package com.scopeledger.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;

/**
 * Flat task node for Contract A. {@code isOptional}/{@code isActive} are pinned with
 * {@link JsonProperty} so the JSON keys keep their "is" prefix exactly as frozen in PLAN.md.
 */
public record TaskDto(
        Long id,
        String title,
        String status,
        Double estimatedHours,
        BigDecimal hourlyRate,
        Integer durationDays,
        @JsonProperty("isOptional") Boolean isOptional,
        @JsonProperty("isActive") Boolean isActive,
        Integer posX,
        Integer posY
) {}
