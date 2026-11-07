package com.scopeledger.dto;

public record ScheduleSummaryDto(
        Integer originalDurationDays,
        Integer grossDelayDays,
        Integer daysSavedByDroppingOptional,
        Integer projectedDurationDays,
        Integer netDaysDelta
) {}