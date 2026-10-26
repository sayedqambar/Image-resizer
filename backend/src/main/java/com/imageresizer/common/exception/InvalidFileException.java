package com.imageresizer.common.exception;

/**
 * Thrown when an uploaded file is missing, empty, or has an unsupported
 * content type. Mapped to HTTP 400 by {@link GlobalExceptionHandler}.
 */
public class InvalidFileException extends RuntimeException {

    public InvalidFileException(String message) {
        super(message);
    }
}
