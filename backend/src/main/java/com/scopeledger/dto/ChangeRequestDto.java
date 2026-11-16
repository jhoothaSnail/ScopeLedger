package com.scopeledger.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * Flat view of a change request. {@code costDelta}/{@code daysDelta} are the estimate while the
 * request is PENDING (or REJECTED) and the figures actually applied once it is APPROVED.
 */
public record ChangeRequestDto(
        Long id,
        Long projectId,
        Long targetTaskId,
        String targetTaskTitle,
        String changeDescription,
        Double addedHours,
        Integer addedDays,
        List<Long> droppedOptionalTaskIds,
        BigDecimal costDelta,
        Integer daysDelta,
        String status,
        String requestedBy,
        String requestedRole,
        OffsetDateTime requestedAt,
        String decidedBy,
        String decidedRole,
        OffsetDateTime decidedAt,
        String decisionNote
) {}
