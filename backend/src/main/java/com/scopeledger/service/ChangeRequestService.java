package com.scopeledger.service;

import com.scopeledger.dto.ChangeRequestDto;
import com.scopeledger.dto.SimulationRequestDto;
import com.scopeledger.dto.SimulationResponseDto;
import com.scopeledger.entity.ChangeRequest;
import com.scopeledger.entity.DeliverableTask;
import com.scopeledger.exception.ApiException;
import com.scopeledger.exception.InvalidRequestException;
import com.scopeledger.exception.ResourceNotFoundException;
import com.scopeledger.repository.ChangeRequestRepository;
import com.scopeledger.repository.DeliverableTaskRepository;
import com.scopeledger.security.Actor;
import com.scopeledger.security.Permission;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Shared change-request workflow: a client (or project manager) submits a change with its
 * simulated cost; a project manager or finance lead approves or rejects it. Approval reuses
 * {@link RippleSimulationService#commitChange}, so the plan, baseline and audit log are updated
 * exactly as for a direct approval and in the same transaction as the status change.
 */
@Service
public class ChangeRequestService {

    private static final int MAX_NOTE = 500;

    private final ChangeRequestRepository requestRepo;
    private final DeliverableTaskRepository taskRepo;
    private final RippleSimulationService simulationService;

    public ChangeRequestService(ChangeRequestRepository requestRepo, DeliverableTaskRepository taskRepo,
                                RippleSimulationService simulationService) {
        this.requestRepo = requestRepo;
        this.taskRepo = taskRepo;
        this.simulationService = simulationService;
    }

    /** Stores a PENDING request with the estimate the requester saw (server-recomputed, never trusted from the client). */
    @Transactional
    public ChangeRequestDto submit(Long projectId, SimulationRequestDto req, Actor actor) {
        actor.require(Permission.SUBMIT_REQUESTS);
        String description = requireDescription(req);
        SimulationResponseDto sim = simulationService.simulateChange(projectId, req);

        ChangeRequest cr = new ChangeRequest();
        cr.setProjectId(projectId);
        cr.setTargetTaskId(req.targetTaskId());
        cr.setChangeDescription(description);
        cr.setAddedHours(req.addedHours());
        cr.setAddedDays(req.addedDays());
        cr.setDroppedTasksJson(sim.appliedDropIds().stream().sorted().toList().toString());
        cr.setCostDelta(sim.financialSummary().netBudgetDelta().doubleValue());
        cr.setDaysDelta(sim.scheduleSummary().netDaysDelta());
        cr.setRequestedBy(actor.name());
        cr.setRequestedRole(actor.role().label());
        return toDto(requestRepo.save(cr), titles(projectId));
    }

    /** Every request for the project: pending first (oldest first, a fair queue), then decided ones newest first. */
    @Transactional(readOnly = true)
    public List<ChangeRequestDto> list(Long projectId) {
        simulationService.requireProjectExists(projectId);
        Map<Long, String> titles = titles(projectId);
        List<ChangeRequest> all = requestRepo.findByProjectId(projectId);
        List<ChangeRequest> pending = all.stream().filter(r -> ChangeRequest.PENDING.equals(r.getStatus()))
                .sorted(Comparator.comparing(ChangeRequest::getRequestedAt).thenComparing(ChangeRequest::getId))
                .toList();
        List<ChangeRequest> decided = all.stream().filter(r -> !ChangeRequest.PENDING.equals(r.getStatus()))
                .sorted(Comparator.comparing(ChangeRequest::getDecidedAt, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(ChangeRequest::getId, Comparator.reverseOrder()))
                .toList();
        return java.util.stream.Stream.concat(pending.stream(), decided.stream()).map(r -> toDto(r, titles)).toList();
    }

    /**
     * Applies the request through the normal commit. If the plan has changed since the request was
     * made (for example an extra has started and can no longer be dropped) the commit fails, the
     * whole transaction rolls back and the request stays PENDING so the approver can reject it.
     */
    @Transactional
    public ChangeRequestDto approve(Long projectId, Long requestId, String note, Actor actor) {
        actor.require(Permission.APPROVE_CHANGES);
        ChangeRequest cr = requirePending(projectId, requestId);
        SimulationResponseDto applied = simulationService.commitChange(projectId, new SimulationRequestDto(
                cr.getTargetTaskId(), cr.getChangeDescription(), cr.getAddedHours(), cr.getAddedDays(), parseIds(cr.getDroppedTasksJson())));
        cr.setCostDelta(applied.financialSummary().netBudgetDelta().doubleValue());
        cr.setDaysDelta(applied.scheduleSummary().netDaysDelta());
        decide(cr, ChangeRequest.APPROVED, note, actor);
        return toDto(requestRepo.saveAndFlush(cr), titles(projectId));
    }

    @Transactional
    public ChangeRequestDto reject(Long projectId, Long requestId, String note, Actor actor) {
        actor.require(Permission.APPROVE_CHANGES);
        ChangeRequest cr = requirePending(projectId, requestId);
        decide(cr, ChangeRequest.REJECTED, note, actor);
        return toDto(requestRepo.saveAndFlush(cr), titles(projectId));
    }

    // ---------------------------------------------------------------- helpers

    private ChangeRequest requirePending(Long projectId, Long requestId) {
        ChangeRequest cr = requestRepo.findByIdAndProjectId(requestId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Change request " + requestId + " not found in this project."));
        if (!ChangeRequest.PENDING.equals(cr.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "REQUEST_ALREADY_DECIDED",
                    "This request was already " + cr.getStatus().toLowerCase() + " by " + cr.getDecidedBy() + ".");
        }
        return cr;
    }

    private static void decide(ChangeRequest cr, String status, String note, Actor actor) {
        String clean = note == null ? "" : note.trim();
        if (clean.length() > MAX_NOTE) {
            throw new InvalidRequestException("The note must be at most " + MAX_NOTE + " characters.");
        }
        cr.setStatus(status);
        cr.setDecidedBy(actor.name());
        cr.setDecidedRole(actor.role().label());
        cr.setDecidedAt(LocalDateTime.now());
        cr.setDecisionNote(clean.isEmpty() ? null : clean);
    }

    private static String requireDescription(SimulationRequestDto req) {
        if (req == null) {
            throw new InvalidRequestException("Request body is required.");
        }
        String d = req.changeDescription() == null ? "" : req.changeDescription().trim();
        if (d.isEmpty() || d.length() > 500) {
            throw new InvalidRequestException("Describe the change (at most 500 characters) before sending it.");
        }
        return d;
    }

    private Map<Long, String> titles(Long projectId) {
        return taskRepo.findByProjectId(projectId).stream()
                .collect(Collectors.toMap(DeliverableTask::getId, DeliverableTask::getTitle, (a, b) -> a));
    }

    /** droppedTasksJson is written by this service as "[104, 106]"; parse it back without a JSON dependency. */
    static List<Long> parseIds(String json) {
        if (json == null) {
            return List.of();
        }
        String body = json.replaceAll("[\\[\\]\\s]", "");
        if (body.isEmpty()) {
            return List.of();
        }
        return Arrays.stream(body.split(",")).map(Long::valueOf).toList();
    }

    private static ChangeRequestDto toDto(ChangeRequest r, Map<Long, String> titles) {
        ZoneId zone = ZoneId.systemDefault();
        return new ChangeRequestDto(r.getId(), r.getProjectId(), r.getTargetTaskId(),
                titles.getOrDefault(r.getTargetTaskId(), "Task #" + r.getTargetTaskId()),
                r.getChangeDescription(), r.getAddedHours(), r.getAddedDays(), parseIds(r.getDroppedTasksJson()),
                BigDecimal.valueOf(r.getCostDelta()).setScale(2, RoundingMode.HALF_UP), r.getDaysDelta(),
                r.getStatus(), r.getRequestedBy(), r.getRequestedRole(),
                r.getRequestedAt() == null ? null : r.getRequestedAt().atZone(zone).toOffsetDateTime(),
                r.getDecidedBy(), r.getDecidedRole(),
                r.getDecidedAt() == null ? null : r.getDecidedAt().atZone(zone).toOffsetDateTime(),
                r.getDecisionNote());
    }
}
