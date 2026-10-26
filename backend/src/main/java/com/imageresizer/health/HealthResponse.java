package com.imageresizer.health;

import java.time.Instant;

/**
 * Response body for {@code GET /api/health}.
 *
 * <pre>
 * { "status": "ok", "timestamp": "2026-10-25T10:15:30.123Z" }
 * </pre>
 */
public record HealthResponse(String status, Instant timestamp) {
}
