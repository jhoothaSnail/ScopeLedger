package com.scopeledger.dto;

/** Uniform JSON error body: {@code {"errorCode": "CIRCULAR_DEPENDENCY", "message": "..."}}. */
public record ApiErrorDto(String errorCode, String message) {}
