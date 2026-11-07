package com.scopeledger.dto;

import java.math.BigDecimal;

public record TradeOffCandidateDto(
        Long taskId,
        String title,
        BigDecimal savedCost,
        Integer savedDays,
        String rationale
) {}