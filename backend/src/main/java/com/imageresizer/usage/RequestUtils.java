package com.imageresizer.usage;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;

/**
 * Shared helpers for extracting the authenticated user id and real IP from
 * an HTTP request. Used by both {@link UsageController} and
 * {@link com.imageresizer.ai.AiController}.
 */
public final class RequestUtils {

    private RequestUtils() {}

    /**
     * Extract the user-id stored as authentication details by
     * {@link com.imageresizer.auth.JwtAuthFilter}, or {@code null} for anonymous callers.
     */
    public static Long resolveUserId(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return null;
        Object details = auth.getDetails();
        if (details instanceof Long l) return l;
        return null;
    }

    /**
     * Best-effort real-IP extraction.
     * Prefers {@code X-Forwarded-For} (set by load-balancers/proxies) over
     * {@code getRemoteAddr()}.
     */
    public static String resolveIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
