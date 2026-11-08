package com.scopeledger.dto;

/** Flat directed edge for Contract A: {@code prerequisiteTaskId -> dependentTaskId}. */
public record DependencyDto(Long id, Long prerequisiteTaskId, Long dependentTaskId) {}
