package com.scopeledger.exception;

import org.springframework.http.HttpStatus;

/** A project, task, dependency or log row does not exist (or belongs to another project). HTTP 404. */
public class ResourceNotFoundException extends ApiException {

    public ResourceNotFoundException(String message) {
        super(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", message);
    }
}
