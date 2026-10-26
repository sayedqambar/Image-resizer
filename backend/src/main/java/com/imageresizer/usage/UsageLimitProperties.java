package com.imageresizer.usage;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Daily AI-usage limits per user tier. Bound from {@code app.usage.*} in application.yml.
 */
@Data
@ConfigurationProperties(prefix = "app.usage")
public class UsageLimitProperties {

    /** AI calls per day allowed for registered (logged-in) users. */
    private int registeredDailyLimit = 5;

    /** AI calls per day allowed for anonymous (IP-tracked) users. */
    private int anonymousDailyLimit = 2;
}
