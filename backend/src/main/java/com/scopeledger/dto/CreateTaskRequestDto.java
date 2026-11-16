package com.scopeledger.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * Body of {@code POST /api/v1/projects/{projectId}/tasks}. Nullable fields fall back to defaults.
 *
 * <p>{@code dependsOnTaskIds} are tasks that must be finished before the new one can start;
 * {@code neededByTaskIds} are existing tasks that will wait for the new one. Both are optional and
 * are linked in the same transaction as the task, so a rejected link (cycle, unknown or removed
 * task) leaves no half-created task behind.
 */
public record CreateTaskRequestDto(
        String title,
        String status,
        Double estimatedHours,
        Double hourlyRate,
        Integer durationDays,
        @JsonProperty("isOptional") Boolean isOptional,
        Integer posX,
        Integer posY,
        List<Long> dependsOnTaskIds,
        List<Long> neededByTaskIds
) {
    /** Original eight-field shape, kept for callers that create a task without links. */
    public CreateTaskRequestDto(String title, String status, Double estimatedHours, Double hourlyRate,
                                Integer durationDays, Boolean isOptional, Integer posX, Integer posY) {
        this(title, status, estimatedHours, hourlyRate, durationDays, isOptional, posX, posY, null, null);
    }
}
