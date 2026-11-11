package com.scopeledger.exception;

import org.springframework.http.HttpStatus;

/**
 * Base type for all expected, client-facing failures. Carries the HTTP status and a stable
 * machine-readable {@code errorCode} that {@link GlobalExceptionHandler} serialises as
 * {@code {"errorCode": "...", "message": "..."}}.
 */
public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String errorCode;

    public ApiException(HttpStatus status, String errorCode, String message) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
    }

    public HttpStatus getStatus() { return status; }

    public String getErrorCode() { return errorCode; }
}
