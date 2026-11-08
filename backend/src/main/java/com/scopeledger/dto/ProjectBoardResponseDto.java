package com.scopeledger.dto;

import java.math.BigDecimal;
import java.util.List;

/** Contract A: {@code GET /api/v1/projects/{projectId}/board}. Also returned by change-order commit. */
public record ProjectBoardResponseDto(
        Long projectId,
        String name,
        BigDecimal baselineBudget,
        Integer baselineDurationDays,
        Double reworkPenaltyRate,
        List<TaskDto> tasks,
        List<DependencyDto> dependencies
) {}
