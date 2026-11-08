package com.scopeledger.service;

import com.scopeledger.dto.ChangeOrderLogDto;
import com.scopeledger.dto.FinancialSummaryDto;
import com.scopeledger.dto.ImpactedTaskDto;
import com.scopeledger.dto.ScheduleSummaryDto;
import com.scopeledger.dto.SimulationRequestDto;
import com.scopeledger.dto.SimulationResponseDto;
import com.scopeledger.dto.TradeOffCandidateDto;
import com.scopeledger.entity.ChangeOrderLog;
import com.scopeledger.entity.DeliverableTask;
import com.scopeledger.entity.Project;
import com.scopeledger.entity.TaskDependency;
import com.scopeledger.exception.InvalidRequestException;
import com.scopeledger.exception.ResourceNotFoundException;
import com.scopeledger.repository.ChangeOrderLogRepository;
import com.scopeledger.repository.DeliverableTaskRepository;
import com.scopeledger.repository.ProjectRepository;
import com.scopeledger.repository.TaskDependencyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Engine B — the Ripple Calculator. Pure dry-run maths in {@link #computeSimulation} (no DB
 * access, unit-testable) plus a transactional {@link #commitChange} and the audit-log read.
 *
 * <p>Rules: the target's change is a {@code DIRECT_CHANGE}; a BFS over dependents applies
 * {@code reworkPenaltyRate} to every reachable active {@code COMPLETED}/{@code IN_PROGRESS} task
 * exactly once (visited set also makes it cycle-safe). Optional tasks may be dropped only if they
 * are NOT_STARTED, not the target, and every active dependent is dropped too (README §2.3).
 * All money is {@link BigDecimal}, scale 2, HALF_UP.
 */
@Service
public class RippleSimulationService {

    private static final BigDecimal HOURS_PER_WORKDAY = BigDecimal.valueOf(8);
    private static final double MAX_ADDED_HOURS = 100_000;
    private static final int MAX_ADDED_DAYS = 3_650;
    private static final int MAX_DESCRIPTION_LENGTH = 500;

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

    /** Dry run: reads only, never writes. */
    @Transactional(readOnly = true)
    public SimulationResponseDto simulateChange(Long projectId, SimulationRequestDto req) {
        Project project = requireProject(projectId);
        return computeSimulation(project, taskRepo.findByProjectId(projectId), depRepo.findByProjectId(projectId), req);
    }

    /**
     * Pure simulation over in-memory data.
     *
     * @throws InvalidRequestException   malformed numbers or an inactive target
     * @throws ResourceNotFoundException unknown target task
     */
    public SimulationResponseDto computeSimulation(Project project, List<DeliverableTask> allTasks,
                                                   List<TaskDependency> allDeps, SimulationRequestDto req) {
        validateNumbers(req);
        Map<Long, DeliverableTask> taskMap = allTasks.stream()
                .collect(Collectors.toMap(DeliverableTask::getId, Function.identity(), (a, b) -> a));
        DeliverableTask target = taskMap.get(req.targetTaskId());
        if (target == null) {
            throw new ResourceNotFoundException("Target task " + req.targetTaskId() + " not found in this project.");
        }
        if (!Boolean.TRUE.equals(target.getIsActive())) {
            throw new InvalidRequestException("TARGET_INACTIVE",
                    "Task " + target.getId() + " was dropped from scope and cannot be changed.");
        }

        Map<Long, List<Long>> adjacency = new HashMap<>();
        for (TaskDependency d : allDeps) {
            adjacency.computeIfAbsent(d.getPrerequisiteTaskId(), k -> new ArrayList<>()).add(d.getDependentTaskId());
        }

        // 1. Direct impact on the target.
        BigDecimal addedHours = BigDecimal.valueOf(req.addedHours());
        BigDecimal directCost = money(addedHours.multiply(BigDecimal.valueOf(target.getHourlyRate())));
        List<ImpactedTaskDto> impacted = new ArrayList<>();
        impacted.add(new ImpactedTaskDto(target.getId(), target.getTitle(), "DIRECT_CHANGE",
                req.addedHours(), directCost, req.addedDays()));

        // 2. BFS downstream rework — skipped when nothing actually changes.
        BigDecimal reworkCostTotal = money(BigDecimal.ZERO);
        int maxReworkDelayDays = 0;
        boolean hasChange = req.addedHours() > 0 || req.addedDays() > 0;
        if (hasChange) {
            BigDecimal penaltyRate = BigDecimal.valueOf(project.getReworkPenaltyRate());
            Queue<Long> queue = new ArrayDeque<>();
            Set<Long> visited = new HashSet<>();
            queue.add(target.getId());
            visited.add(target.getId());
            while (!queue.isEmpty()) {
                Long current = queue.poll();
                for (Long childId : adjacency.getOrDefault(current, Collections.emptyList())) {
                    if (!visited.add(childId)) {
                        continue; // diamond / cycle guard: each task is processed once
                    }
                    DeliverableTask child = taskMap.get(childId);
                    if (child == null || !Boolean.TRUE.equals(child.getIsActive())) {
                        continue; // dropped tasks neither cost rework nor pass the ripple on
                    }
                    queue.add(childId);
                    if ("COMPLETED".equalsIgnoreCase(child.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(child.getStatus())) {
                        BigDecimal reworkHours = BigDecimal.valueOf(child.getEstimatedHours())
                                .multiply(penaltyRate).setScale(2, RoundingMode.HALF_UP);
                        BigDecimal cost = money(reworkHours.multiply(BigDecimal.valueOf(child.getHourlyRate())));
                        int delay = reworkHours.divide(HOURS_PER_WORKDAY, 0, RoundingMode.CEILING).intValue();
                        reworkCostTotal = reworkCostTotal.add(cost);
                        maxReworkDelayDays = Math.max(maxReworkDelayDays, delay);
                        impacted.add(new ImpactedTaskDto(child.getId(), child.getTitle(), "DOWNSTREAM_REWORK",
                                reworkHours.doubleValue(), cost, delay));
                    }
                }
            }
        }

        // 3. Server-authoritative drop set + candidates.
        Set<Long> applied = resolveDropSet(req.droppedOptionalTaskIds(), taskMap, adjacency, target.getId());
        List<TradeOffCandidateDto> candidates = buildCandidates(allTasks, taskMap, adjacency, applied, target.getId());

        BigDecimal savedCost = money(BigDecimal.ZERO);
        int savedDays = 0;
        for (Long id : applied) {
            DeliverableTask t = taskMap.get(id);
            savedCost = savedCost.add(taskCost(t));
            savedDays += t.getDurationDays() == null ? 0 : t.getDurationDays();
        }

        // 4. Summaries.
        BigDecimal grossCost = directCost.add(reworkCostTotal);
        BigDecimal netDelta = grossCost.subtract(savedCost);
        BigDecimal baseline = money(BigDecimal.valueOf(project.getBaselineBudget()));
        int grossDelay = req.addedDays() + maxReworkDelayDays;
        int netDays = grossDelay - savedDays;

        return new SimulationResponseDto(target.getId(), impacted, candidates,
                new FinancialSummaryDto(baseline, grossCost, savedCost, baseline.add(netDelta), netDelta),
                new ScheduleSummaryDto(project.getBaselineDurationDays(), grossDelay, savedDays,
                        project.getBaselineDurationDays() + netDays, netDays),
                List.copyOf(applied));
    }

    /**
     * Applies the change order atomically: bumps the target, deactivates dropped tasks, rolls the
     * project baseline forward to the projected values (so stacked change orders never double
     * count) and appends an audit row. Invalid drops are rejected rather than silently pruned.
     */
    @Transactional
    public SimulationResponseDto commitChange(Long projectId, SimulationRequestDto req) {
        if (req == null) {
            throw new InvalidRequestException("Request body is required.");
        }
        String description = req.changeDescription() == null ? "" : req.changeDescription().trim();
        if (description.isEmpty() || description.length() > MAX_DESCRIPTION_LENGTH) {
            throw new InvalidRequestException(
                    "changeDescription is required and must be at most " + MAX_DESCRIPTION_LENGTH + " characters.");
        }

        Project project = requireProject(projectId);
        List<DeliverableTask> tasks = taskRepo.findByProjectId(projectId);
        SimulationResponseDto sim = computeSimulation(project, tasks, depRepo.findByProjectId(projectId), req);

        Set<Long> rejected = new LinkedHashSet<>(req.droppedOptionalTaskIds() == null
                ? List.<Long>of() : req.droppedOptionalTaskIds());
        rejected.removeAll(sim.appliedDropIds());
        rejected.remove(null);
        if (!rejected.isEmpty()) {
            throw new InvalidRequestException("INVALID_DROP", "Tasks " + rejected + " cannot be dropped: only "
                    + "optional, not-started tasks whose dependents are also dropped are eligible.");
        }

        Map<Long, DeliverableTask> byId = tasks.stream().collect(Collectors.toMap(DeliverableTask::getId, Function.identity()));
        DeliverableTask target = byId.get(req.targetTaskId());
        target.setEstimatedHours(target.getEstimatedHours() + req.addedHours());
        target.setDurationDays(target.getDurationDays() + req.addedDays());
        taskRepo.save(target);

        List<DeliverableTask> dropped = sim.appliedDropIds().stream().map(byId::get).toList();
        dropped.forEach(t -> t.setIsActive(false));
        taskRepo.saveAll(dropped);

        project.setBaselineBudget(sim.financialSummary().projectedBudget().doubleValue());
        project.setBaselineDurationDays(sim.scheduleSummary().projectedDurationDays());
        projectRepo.save(project);

        ChangeOrderLog log = new ChangeOrderLog();
        log.setProjectId(projectId);
        log.setTargetTaskId(target.getId());
        log.setChangeDescription(description);
        log.setNetCostDelta(sim.financialSummary().netBudgetDelta().doubleValue());
        log.setNetDaysDelta(sim.scheduleSummary().netDaysDelta());
        log.setDroppedTasksJson(sim.appliedDropIds().stream().sorted().toList().toString());
        logRepo.save(log);

        return sim;
    }

    /** Audit trail, newest first. */
    @Transactional(readOnly = true)
    public List<ChangeOrderLogDto> getChangeHistory(Long projectId) {
        requireProject(projectId);
        Map<Long, String> titles = taskRepo.findByProjectId(projectId).stream()
                .collect(Collectors.toMap(DeliverableTask::getId, DeliverableTask::getTitle, (a, b) -> a));
        return logRepo.findByProjectId(projectId).stream()
                .sorted(Comparator.comparing(ChangeOrderLog::getCommittedAt).reversed()
                        .thenComparing(ChangeOrderLog::getId, Comparator.reverseOrder()))
                .map(l -> new ChangeOrderLogDto(l.getId(), l.getProjectId(), l.getTargetTaskId(),
                        titles.getOrDefault(l.getTargetTaskId(), "Task #" + l.getTargetTaskId()),
                        l.getChangeDescription(), money(BigDecimal.valueOf(l.getNetCostDelta())),
                        l.getNetDaysDelta(), l.getDroppedTasksJson(), l.getCommittedAt()))
                .toList();
    }

    // ---------------------------------------------------------------- helpers

    /** Optional + NOT_STARTED + active + not the target. */
    private static boolean isStaticallyDroppable(DeliverableTask t, Long targetId) {
        return t != null
                && Boolean.TRUE.equals(t.getIsOptional())
                && Boolean.TRUE.equals(t.getIsActive())
                && "NOT_STARTED".equalsIgnoreCase(t.getStatus())
                && !t.getId().equals(targetId);
    }

    private static boolean allActiveChildrenIn(Long id, Map<Long, DeliverableTask> taskMap,
                                               Map<Long, List<Long>> adjacency, Set<Long> allowed) {
        for (Long childId : adjacency.getOrDefault(id, Collections.emptyList())) {
            DeliverableTask child = taskMap.get(childId);
            if (child != null && Boolean.TRUE.equals(child.getIsActive()) && !allowed.contains(childId)) {
                return false;
            }
        }
        return true;
    }

    /** Largest subset of the request that satisfies the drop rules (iterate to a fixpoint). */
    private static Set<Long> resolveDropSet(List<Long> requested, Map<Long, DeliverableTask> taskMap,
                                            Map<Long, List<Long>> adjacency, Long targetId) {
        Set<Long> valid = new LinkedHashSet<>();
        if (requested != null) {
            for (Long id : requested) {
                if (id != null && isStaticallyDroppable(taskMap.get(id), targetId)) {
                    valid.add(id);
                }
            }
        }
        boolean changed = true;
        while (changed) {
            List<Long> invalid = valid.stream()
                    .filter(id -> !allActiveChildrenIn(id, taskMap, adjacency, valid))
                    .toList();
            valid.removeAll(invalid);
            changed = !invalid.isEmpty();
        }
        return valid;
    }

    private static List<TradeOffCandidateDto> buildCandidates(List<DeliverableTask> allTasks,
                                                              Map<Long, DeliverableTask> taskMap,
                                                              Map<Long, List<Long>> adjacency,
                                                              Set<Long> applied, Long targetId) {
        return allTasks.stream()
                .sorted(Comparator.comparing(DeliverableTask::getId))
                .filter(t -> isStaticallyDroppable(t, targetId))
                .filter(t -> allActiveChildrenIn(t.getId(), taskMap, adjacency, applied))
                .map(t -> {
                    boolean hasDroppedDependents = adjacency.getOrDefault(t.getId(), Collections.emptyList())
                            .stream().anyMatch(applied::contains);
                    return new TradeOffCandidateDto(t.getId(), t.getTitle(), taskCost(t),
                            t.getDurationDays() == null ? 0 : t.getDurationDays(),
                            hasDroppedDependents
                                    ? "Optional, not started; all of its dependents are also being dropped."
                                    : "Optional task in NOT_STARTED state with 0 active downstream dependencies.");
                })
                .toList();
    }

    private static BigDecimal taskCost(DeliverableTask t) {
        return money(BigDecimal.valueOf(t.getEstimatedHours()).multiply(BigDecimal.valueOf(t.getHourlyRate())));
    }

    private static BigDecimal money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private static void validateNumbers(SimulationRequestDto req) {
        if (req == null || req.targetTaskId() == null) {
            throw new InvalidRequestException("targetTaskId is required.");
        }
        Double hours = req.addedHours();
        if (hours == null || !Double.isFinite(hours) || hours < 0 || hours > MAX_ADDED_HOURS) {
            throw new InvalidRequestException("addedHours must be a number between 0 and " + (int) MAX_ADDED_HOURS + ".");
        }
        Integer days = req.addedDays();
        if (days == null || days < 0 || days > MAX_ADDED_DAYS) {
            throw new InvalidRequestException("addedDays must be a whole number between 0 and " + MAX_ADDED_DAYS + ".");
        }
    }

    private Project requireProject(Long projectId) {
        return projectRepo.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project " + projectId + " not found."));
    }
}
