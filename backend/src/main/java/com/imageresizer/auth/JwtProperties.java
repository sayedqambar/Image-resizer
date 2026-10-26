package com.imageresizer.auth;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * JWT signing configuration. Bound from {@code app.jwt.*} in application.yml.
 * Override via {@code APP_JWT_SECRET} / {@code APP_JWT_EXPIRY_MS} environment variables.
 */
@Data
@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {

    /**
     * HMAC-SHA256 signing secret (Base64-encoded or plain text, min 32 chars).
     * Change this in any real deployment.
     */
    private String secret = "change-me-in-production-min-32-chars!!";

    /** Token lifetime in milliseconds. Default: 24 h. */
    private long expiryMs = 86_400_000L;
}
