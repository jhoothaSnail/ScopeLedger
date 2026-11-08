package com.scopeledger.dto;

import java.util.List;

/**
 * Contract B response. {@code appliedDropIds} is an additive field: the subset of the requested
 * {@code droppedOptionalTaskIds} that the server accepted as safe-to-drop. The client should
 * mirror it in its toggle state.
 */
public record SimulationResponseDto(
        Long targetTaskId,
        List<ImpactedTaskDto> impactedTasks,
        List<TradeOffCandidateDto> candidateTradeOffs,
        FinancialSummaryDto financialSummary,
        ScheduleSummaryDto scheduleSummary,
        List<Long> appliedDropIds
) {}
