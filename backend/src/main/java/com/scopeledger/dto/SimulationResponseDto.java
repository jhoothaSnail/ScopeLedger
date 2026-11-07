package com.scopeledger.dto;

import java.util.List;

public record SimulationResponseDto(
        Long targetTaskId,
        List<ImpactedTaskDto> impactedTasks,
        List<TradeOffCandidateDto> candidateTradeOffs,
        FinancialSummaryDto financialSummary,
        ScheduleSummaryDto scheduleSummary
) {}