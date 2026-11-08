package com.scopeledger.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Flat view of one immutable audit-log row for {@code GET .../change-orders}. */
public record ChangeOrderLogDto(
        Long id,
        Long projectId,
        Long targetTaskId,
        String targetTaskTitle,
        String changeDescription,
        BigDecimal netCostDelta,
        Integer netDaysDelta,
        String droppedTasksJson,
        LocalDateTime committedAt
) {}
