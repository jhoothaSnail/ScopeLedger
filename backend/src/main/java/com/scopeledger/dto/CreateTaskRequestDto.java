package com.scopeledger.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/** Body of {@code POST /api/v1/projects/{projectId}/tasks}. Nullable fields fall back to defaults. */
public record CreateTaskRequestDto(
        String title,
        String status,
        Double estimatedHours,
        Double hourlyRate,
        Integer durationDays,
        @JsonProperty("isOptional") Boolean isOptional,
        Integer posX,
        Integer posY
) {}
