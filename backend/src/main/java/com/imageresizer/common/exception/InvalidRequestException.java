package com.imageresizer.common.exception;

/**
 * Thrown for malformed request parameters (e.g. an unsupported scale value or a
 * non-positive width/height). Mapped to HTTP 400 by {@link GlobalExceptionHandler}.
 */
public class InvalidRequestException extends RuntimeException {

    public InvalidRequestException(String message) {
        super(message);
    }
}
