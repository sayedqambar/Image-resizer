package com.imageresizer.ai;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

/**
 * Configuration for the Python AI microservice client: base URL and the timeouts
 * applied to forwarded calls. Bound from {@code ai.service.*} in application.yml.
 */
@Data
@ConfigurationProperties(prefix = "ai.service")
public class AiServiceProperties {

    /** Base URL of the FastAPI AI service (no trailing slash needed). */
    private String url = "http://localhost:8000";

    /** Connection timeout for calls to the AI service. */
    private Duration connectTimeout = Duration.ofSeconds(5);

    /** Read timeout — a full AI call (model inference) must finish within this. */
    private Duration readTimeout = Duration.ofSeconds(120);
}
