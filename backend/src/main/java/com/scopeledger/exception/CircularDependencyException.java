package com.scopeledger.exception;

import org.springframework.http.HttpStatus;

/** A proposed dependency link would create a cycle in the task DAG. HTTP 400. */
public class CircularDependencyException extends ApiException {

    public CircularDependencyException(String message) {
        super(HttpStatus.BAD_REQUEST, "CIRCULAR_DEPENDENCY", message);
    }
}
