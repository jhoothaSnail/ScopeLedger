package com.scopeledger.exception;

import org.springframework.http.HttpStatus;

/** Request payload failed business validation. HTTP 400 with a specific or generic error code. */
public class InvalidRequestException extends ApiException {

    public InvalidRequestException(String message) {
        this("VALIDATION_ERROR", message);
    }

    public InvalidRequestException(String errorCode, String message) {
        super(HttpStatus.BAD_REQUEST, errorCode, message);
    }
}
