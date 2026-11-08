package com.scopeledger.service;

import com.scopeledger.dto.CreateDependencyRequestDto;
import com.scopeledger.dto.CreateTaskRequestDto;
import com.scopeledger.dto.DependencyDto;
import com.scopeledger.dto.ProjectBoardResponseDto;
import com.scopeledger.dto.TaskDto;
import com.scopeledger.entity.DeliverableTask;
import com.scopeledger.entity.Project;
import com.scopeledger.entity.TaskDependency;
import com.scopeledger.exception.InvalidRequestException;
import com.scopeledger.exception.ResourceNotFoundException;
import com.scopeledger.repository.DeliverableTaskRepository;
import com.scopeledger.repository.ProjectRepository;
import com.scopeledger.repository.TaskDependencyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

/**
 * Board CRUD orchestration. Maps JPA entities to flat DTOs so controllers never serialise
 * entities (PLAN.md Trap 2).
 */
@Service
public class ProjectBoardService {

    static final Set<String> VALID_STATUSES = Set.of("NOT_STARTED", "IN_PROGRESS", "COMPLETED");
    private static final int MAX_TITLE_LENGTH = 200;

    private final ProjectRepository projectRepo;
    private final DeliverableTaskRepository taskRepo;
    private final TaskDependencyRepository depRepo;
    private final CycleDetectionService cycleDetection;

    public ProjectBoardService(ProjectRepository projectRepo, DeliverableTaskRepository taskRepo,
                               TaskDependencyRepository depRepo, CycleDetectionService cycleDetection) {
        this.projectRepo = projectRepo;
        this.taskRepo = taskRepo;
        this.depRepo = depRepo;
        this.cycleDetection = cycleDetection;
    }

    @Transactional(readOnly = true)
    public ProjectBoardResponseDto getBoard(Long projectId) {
        Project project = requireProject(projectId);
        List<TaskDto> tasks = taskRepo.findByProjectId(projectId).stream()
                .sorted(Comparator.comparing(DeliverableTask::getId))
                .map(ProjectBoardService::toDto)
                .toList();
        List<DependencyDto> deps = depRepo.findByProjectId(projectId).stream()
                .sorted(Comparator.comparing(TaskDependency::getId))
                .map(ProjectBoardService::toDto)
                .toList();
        return new ProjectBoardResponseDto(project.getId(), project.getName(), money(project.getBaselineBudget()),
                project.getBaselineDurationDays(), project.getReworkPenaltyRate(), tasks, deps);
    }

    @Transactional
    public TaskDto createTask(Long projectId, CreateTaskRequestDto req) {
        requireProject(projectId);
        if (req == null) {
            throw new InvalidRequestException("Request body is required.");
        }
        String title = req.title() == null ? "" : req.title().trim();
        if (title.isEmpty() || title.length() > MAX_TITLE_LENGTH) {
            throw new InvalidRequestException("Task title is required and must be at most " + MAX_TITLE_LENGTH + " characters.");
        }
        String status = req.status() == null ? "NOT_STARTED" : req.status().trim().toUpperCase();
        if (!VALID_STATUSES.contains(status)) {
            throw new InvalidRequestException("Status must be one of " + VALID_STATUSES + ".");
        }
        double hours = positive(req.estimatedHours(), 8.0, "estimatedHours");
        double rate = positive(req.hourlyRate(), 1000.0, "hourlyRate");
        int days = req.durationDays() == null ? 1 : req.durationDays();
        if (days < 1) {
            throw new InvalidRequestException("durationDays must be at least 1.");
        }

        DeliverableTask task = new DeliverableTask();
        task.setProjectId(projectId);
        task.setTitle(title);
        task.setStatus(status);
        task.setEstimatedHours(hours);
        task.setHourlyRate(rate);
        task.setDurationDays(days);
        task.setIsOptional(Boolean.TRUE.equals(req.isOptional()));
        task.setIsActive(true);
        task.setPosX(req.posX() == null ? 200 : Math.max(0, req.posX()));
        task.setPosY(req.posY() == null ? 200 : Math.max(0, req.posY()));
        return toDto(taskRepo.save(task));
    }

    @Transactional
    public DependencyDto createDependency(Long projectId, CreateDependencyRequestDto req) {
        requireProject(projectId);
        if (req == null || req.prerequisiteTaskId() == null || req.dependentTaskId() == null) {
            throw new InvalidRequestException("prerequisiteTaskId and dependentTaskId are required.");
        }
        requireTaskInProject(projectId, req.prerequisiteTaskId());
        requireTaskInProject(projectId, req.dependentTaskId());

        List<TaskDependency> existing = depRepo.findByProjectId(projectId);
        boolean duplicate = existing.stream().anyMatch(d ->
                d.getPrerequisiteTaskId().equals(req.prerequisiteTaskId())
                        && d.getDependentTaskId().equals(req.dependentTaskId()));
        if (duplicate) {
            throw new InvalidRequestException("DUPLICATE_DEPENDENCY", "Task " + req.prerequisiteTaskId()
                    + " is already linked to Task " + req.dependentTaskId() + ".");
        }
        cycleDetection.assertNoCycle(req.prerequisiteTaskId(), req.dependentTaskId(), existing);

        TaskDependency saved = depRepo.save(
                new TaskDependency(null, projectId, req.prerequisiteTaskId(), req.dependentTaskId()));
        return toDto(saved);
    }

    @Transactional
    public void deleteDependency(Long projectId, Long dependencyId) {
        requireProject(projectId);
        TaskDependency dep = depRepo.findById(dependencyId)
                .filter(d -> projectId.equals(d.getProjectId()))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Dependency " + dependencyId + " not found in project " + projectId + "."));
        depRepo.delete(dep);
    }

    Project requireProject(Long projectId) {
        return projectRepo.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project " + projectId + " not found."));
    }

    private void requireTaskInProject(Long projectId, Long taskId) {
        taskRepo.findById(taskId)
                .filter(t -> projectId.equals(t.getProjectId()))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Task " + taskId + " not found in project " + projectId + "."));
    }

    private static double positive(Double value, double fallback, String field) {
        if (value == null) {
            return fallback;
        }
        if (!Double.isFinite(value) || value <= 0) {
            throw new InvalidRequestException(field + " must be a positive number.");
        }
        return value;
    }

    private static BigDecimal money(Double value) {
        return value == null ? null : BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP);
    }

    static TaskDto toDto(DeliverableTask t) {
        return new TaskDto(t.getId(), t.getTitle(), t.getStatus(), t.getEstimatedHours(), money(t.getHourlyRate()),
                t.getDurationDays(), t.getIsOptional(), t.getIsActive(), t.getPosX(), t.getPosY());
    }

    static DependencyDto toDto(TaskDependency d) {
        return new DependencyDto(d.getId(), d.getPrerequisiteTaskId(), d.getDependentTaskId());
    }
}
