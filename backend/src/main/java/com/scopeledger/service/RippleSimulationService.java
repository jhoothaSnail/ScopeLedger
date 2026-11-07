// File: backend/src/main/java/com/scopeledger/service/RippleSimulationService.java
package com.scopeledger.service;

import com.scopeledger.dto.*;
import com.scopeledger.entity.*;
import com.scopeledger.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RippleSimulationService {

    private final ProjectRepository projectRepo;
    private final DeliverableTaskRepository taskRepo;
    private final TaskDependencyRepository depRepo;
    private final ChangeOrderLogRepository logRepo;

    public RippleSimulationService(ProjectRepository projectRepo, DeliverableTaskRepository taskRepo,
                                   TaskDependencyRepository depRepo, ChangeOrderLogRepository logRepo) {
        this.projectRepo = projectRepo;
        this.taskRepo = taskRepo;
        this.depRepo = depRepo;
        this.logRepo = logRepo;
    }

    public SimulationResponseDto simulateChange(Long projectId, SimulationRequestDto req) {
        Project project = projectRepo.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));
        List<DeliverableTask> allTasks = taskRepo.findByProjectId(projectId);
        List<TaskDependency> allDeps = depRepo.findByProjectId(projectId);

        return computeSimulation(project, allTasks, allDeps, req);
    }

    public SimulationResponseDto computeSimulation(Project project, List<DeliverableTask> allTasks,
                                                   List<TaskDependency> allDeps, SimulationRequestDto req) {
        Map<Long, DeliverableTask> taskMap = allTasks.stream().collect(Collectors.toMap(DeliverableTask::getId, t -> t));
        DeliverableTask target = Optional.ofNullable(taskMap.get(req.targetTaskId()))
                .orElseThrow(() -> new IllegalArgumentException("Target task not found: " + req.targetTaskId()));

        // 1. Direct Target Impact
        BigDecimal targetRate = BigDecimal.valueOf(target.getHourlyRate());
        BigDecimal directAddedHours = BigDecimal.valueOf(req.addedHours());
        BigDecimal directCost = directAddedHours.multiply(targetRate).setScale(2, RoundingMode.HALF_UP);

        List<ImpactedTaskDto> impacted = new ArrayList<>();
        impacted.add(new ImpactedTaskDto(target.getId(), target.getTitle(), "DIRECT_CHANGE",
                req.addedHours(), directCost, req.addedDays()));

        // 2. Adjacency Graph: Pre -> List<Dependent>
        Map<Long, List<Long>> adj = new HashMap<>();
        for (TaskDependency d : allDeps) {
            adj.computeIfAbsent(d.getPrerequisiteTaskId(), k -> new ArrayList<>()).add(d.getDependentTaskId());
        }

        // 3. BFS Downstream Ripple
        Queue<Long> queue = new ArrayDeque<>();
        Set<Long> visited = new HashSet<>();
        queue.add(target.getId());
        visited.add(target.getId());

        BigDecimal reworkCostTotal = BigDecimal.ZERO;
        int maxReworkDelayDays = 0;
        BigDecimal penaltyRate = BigDecimal.valueOf(project.getReworkPenaltyRate());

        while (!queue.isEmpty()) {
            Long curr = queue.poll();
            List<Long> children = adj.getOrDefault(curr, Collections.emptyList());
            for (Long childId : children) {
                if (visited.add(childId)) {
                    DeliverableTask child = taskMap.get(childId);
                    if (child != null && child.getIsActive()) {
                        queue.add(childId);
                        String st = child.getStatus();
                        if ("COMPLETED".equalsIgnoreCase(st) || "IN_PROGRESS".equalsIgnoreCase(st)) {
                            BigDecimal baseHours = BigDecimal.valueOf(child.getEstimatedHours());
                            BigDecimal reworkHrs = baseHours.multiply(penaltyRate).setScale(2, RoundingMode.HALF_UP);
                            BigDecimal cost = reworkHrs.multiply(BigDecimal.valueOf(child.getHourlyRate())).setScale(2, RoundingMode.HALF_UP);
                            int delay = (int) Math.ceil(reworkHrs.doubleValue() / 8.0);

                            reworkCostTotal = reworkCostTotal.add(cost);
                            maxReworkDelayDays = Math.max(maxReworkDelayDays, delay);

                            impacted.add(new ImpactedTaskDto(child.getId(), child.getTitle(), "DOWNSTREAM_REWORK",
                                    reworkHrs.doubleValue(), cost, delay));
                        }
                    }
                }
            }
        }

        // 4. Safe-to-Drop Candidates Identification
        Set<Long> prerequisitesWithActiveDeps = allDeps.stream()
                .filter(d -> {
                    DeliverableTask child = taskMap.get(d.getDependentTaskId());
                    return child != null && child.getIsActive();
                })
                .map(TaskDependency::getPrerequisiteTaskId)
                .collect(Collectors.toSet());

        List<TradeOffCandidateDto> safeCandidates = allTasks.stream()
                .filter(t -> Boolean.TRUE.equals(t.getIsOptional()))
                .filter(t -> Boolean.TRUE.equals(t.getIsActive()))
                .filter(t -> "NOT_STARTED".equalsIgnoreCase(t.getStatus()))
                .filter(t -> !prerequisitesWithActiveDeps.contains(t.getId()))
                .filter(t -> !t.getId().equals(target.getId()))
                .map(t -> {
                    BigDecimal saved = BigDecimal.valueOf(t.getEstimatedHours())
                            .multiply(BigDecimal.valueOf(t.getHourlyRate())).setScale(2, RoundingMode.HALF_UP);
                    return new TradeOffCandidateDto(t.getId(), t.getTitle(), saved, t.getDurationDays(),
                            "Optional task in NOT_STARTED state with 0 active downstream dependencies.");
                })
                .toList();

        // 5. Deductions for Dropped Selections
        Set<Long> droppedSet = req.droppedOptionalTaskIds() == null ? Collections.emptySet() : new HashSet<>(req.droppedOptionalTaskIds());
        BigDecimal totalSavedCost = BigDecimal.ZERO;
        int totalSavedDays = 0;

        for (Long dropId : droppedSet) {
            DeliverableTask t = taskMap.get(dropId);
            if (t != null && t.getIsActive()) {
                BigDecimal saved = BigDecimal.valueOf(t.getEstimatedHours())
                        .multiply(BigDecimal.valueOf(t.getHourlyRate())).setScale(2, RoundingMode.HALF_UP);
                totalSavedCost = totalSavedCost.add(saved);
                totalSavedDays += (t.getDurationDays() != null ? t.getDurationDays() : 0);
            }
        }

        BigDecimal grossAddedCost = directCost.add(reworkCostTotal);
        BigDecimal netBudgetDelta = grossAddedCost.subtract(totalSavedCost);
        BigDecimal baselineBudget = BigDecimal.valueOf(project.getBaselineBudget());
        BigDecimal projectedBudget = baselineBudget.add(netBudgetDelta);

        int grossDelay = req.addedDays() + maxReworkDelayDays;
        int netDaysDelta = grossDelay - totalSavedDays;
        int projectedDuration = project.getBaselineDurationDays() + netDaysDelta;

        FinancialSummaryDto financial = new FinancialSummaryDto(baselineBudget, grossAddedCost, totalSavedCost, projectedBudget, netBudgetDelta);
        ScheduleSummaryDto schedule = new ScheduleSummaryDto(project.getBaselineDurationDays(), grossDelay, totalSavedDays, projectedDuration, netDaysDelta);

        return new SimulationResponseDto(target.getId(), impacted, safeCandidates, financial, schedule);
    }

    @Transactional
    public SimulationResponseDto commitChange(Long projectId, SimulationRequestDto req) {
        SimulationResponseDto sim = simulateChange(projectId, req);

        // Mutate target
        DeliverableTask target = taskRepo.findById(req.targetTaskId()).orElseThrow();
        target.setEstimatedHours(target.getEstimatedHours() + req.addedHours());
        target.setDurationDays(target.getDurationDays() + req.addedDays());
        taskRepo.save(target);

        // Deactivate dropped tasks
        if (req.droppedOptionalTaskIds() != null && !req.droppedOptionalTaskIds().isEmpty()) {
            List<DeliverableTask> dropped = taskRepo.findAllById(req.droppedOptionalTaskIds());
            dropped.forEach(t -> t.setIsActive(false));
            taskRepo.saveAll(dropped);
        }

        // Append Immutable Audit Log
        ChangeOrderLog log = new ChangeOrderLog();
        log.setProjectId(projectId);
        log.setTargetTaskId(req.targetTaskId());
        log.setChangeDescription(req.changeDescription());
        log.setNetCostDelta(sim.financialSummary().netBudgetDelta().doubleValue());
        log.setNetDaysDelta(sim.scheduleSummary().netDaysDelta());
        log.setDroppedTasksJson(droppedSetToJson(req.droppedOptionalTaskIds()));
        logRepo.save(log);

        return sim;
    }

    private String droppedSetToJson(List<Long> ids) {
        return (ids == null || ids.isEmpty()) ? "[]" : ids.toString();
    }
}