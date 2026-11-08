package com.scopeledger.dto;

/** Body of {@code POST /api/v1/projects/{projectId}/dependencies}. */
public record CreateDependencyRequestDto(Long prerequisiteTaskId, Long dependentTaskId) {}
