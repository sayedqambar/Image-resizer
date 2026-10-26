package com.imageresizer.health;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

/**
 * Simple liveness endpoint. Not a replacement for Spring Boot Actuator —
 * intentionally lightweight so the frontend can check the API is reachable
 * without pulling in actuator.
 */
@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public HealthResponse health() {
        return new HealthResponse("ok", Instant.now());
    }
}
