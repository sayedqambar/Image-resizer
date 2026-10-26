package com.imageresizer.common.exception;

import java.time.Instant;

/**
 * Clean, consistent JSON error body returned for all handled exceptions.
 *
 * Example:
 * <pre>
 * {
 *   "timestamp": "2026-10-25T10:15:30.123Z",
 *   "status": 400,
 *   "error": "Bad Request",
 *   "message": "Unsupported file type: application/pdf. Allowed types: [image/jpeg, image/png, image/webp]",
 *   "path": "/api/upload"
 * }
 * </pre>
 */
public record ApiError(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path
) {
}
