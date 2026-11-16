package com.scopeledger.dto;

/** Body of {@code PATCH /api/v1/projects/{projectId}/tasks/{taskId}/status}: NOT_STARTED, IN_PROGRESS or COMPLETED. */
public record TaskStatusUpdateDto(String status) {}
