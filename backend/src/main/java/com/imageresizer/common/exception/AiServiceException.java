package com.imageresizer.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Thrown when a call to the Python AI service fails or times out. Carries the
 * HTTP status the backend should return (typically 502 Bad Gateway or
 * 504 Gateway Timeout), mapped to JSON by {@link GlobalExceptionHandler}.
 */
@Getter
public class AiServiceException extends RuntimeException {

    private final HttpStatus status;

    public AiServiceException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public AiServiceException(HttpStatus status, String message, Throwable cause) {
        super(message, cause);
        this.status = status;
    }
}
