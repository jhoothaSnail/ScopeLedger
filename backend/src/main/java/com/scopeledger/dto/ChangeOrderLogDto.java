package com.scopeledger.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Flat view of one immutable audit-log row for {@code GET .../change-orders}.
 * {@code committedAt} carries a UTC offset so clients in any timezone render the correct time.
 */
public record ChangeOrderLogDto(
        Long id,
        Long projectId,
        Long targetTaskId,
        String targetTaskTitle,
        String changeDescription,
        BigDecimal netCostDelta,
        Integer netDaysDelta,
        String droppedTasksJson,
        OffsetDateTime committedAt
) {}
