package com.imageresizer.common.exception;

/**
 * Thrown when an uploaded file exceeds the configured maximum size.
 * Mapped to HTTP 413 (Payload Too Large) by {@link GlobalExceptionHandler}.
 */
public class FileTooLargeException extends RuntimeException {

    public FileTooLargeException(String message) {
        super(message);
    }
}
