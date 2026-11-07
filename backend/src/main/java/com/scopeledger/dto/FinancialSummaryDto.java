package com.scopeledger.dto;

import java.math.BigDecimal;

public record FinancialSummaryDto(
        BigDecimal originalBudget,
        BigDecimal changeAndReworkCost,
        BigDecimal optionalTasksSavedCost,
        BigDecimal projectedBudget,
        BigDecimal netBudgetDelta
) {}