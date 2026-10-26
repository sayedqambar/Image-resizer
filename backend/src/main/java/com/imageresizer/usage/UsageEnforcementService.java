package com.imageresizer.usage;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;

/**
 * Enforces per-day AI usage limits and records each call in {@code usage_logs}.
 *
 * <p>Call {@link #checkAndRecord} at the start of every AI endpoint. If the caller
 * has exhausted their daily allowance it throws an HTTP 429 before the AI service
 * is called, so no quota is consumed on rejection.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UsageEnforcementService {

    private final UsageLogRepository repository;
    private final UsageLimitProperties limits;

    /**
     * Check quota and record a new usage entry.
     *
     * @param userId    authenticated user id, or {@code null} for anonymous callers
     * @param ipAddress caller IP address (used for anonymous tracking and always logged)
     * @param tool      one of: remove_bg | upscale | smart_crop
     * @throws ResponseStatusException HTTP 429 when the limit is exceeded
     */
    public void checkAndRecord(Long userId, String ipAddress, String tool) {
        Instant startOfDay = startOfTodayUtc();

        if (userId != null) {
            long used  = repository.countByUserIdSince(userId, startOfDay);
            int  limit = limits.getRegisteredDailyLimit();
            if (used >= limit) {
                throw new ResponseStatusException(
                        HttpStatus.TOO_MANY_REQUESTS,
                        "Daily limit reached (" + limit + " AI uses/day). Try again tomorrow.");
            }
        } else {
            long used  = repository.countByIpSince(ipAddress, startOfDay);
            int  limit = limits.getAnonymousDailyLimit();
            if (used >= limit) {
                throw new ResponseStatusException(
                        HttpStatus.TOO_MANY_REQUESTS,
                        "Daily limit reached (" + limit + " AI uses/day for guests). Log in for more.");
            }
        }

        repository.save(UsageLog.builder()
                .userId(userId)
                .ipAddress(ipAddress)
                .tool(tool)
                .build());

        log.debug("AI usage recorded: tool={} userId={} ip={}", tool, userId, ipAddress);
    }

    /**
     * Returns the number of remaining AI calls for today.
     *
     * @param userId null for anonymous
     * @param ip     caller IP
     */
    public UsageStatus getStatus(Long userId, String ip) {
        Instant startOfDay = startOfTodayUtc();
        if (userId != null) {
            int  limit = limits.getRegisteredDailyLimit();
            long used  = repository.countByUserIdSince(userId, startOfDay);
            return new UsageStatus(limit, (int) Math.max(0, limit - used), true);
        } else {
            int  limit = limits.getAnonymousDailyLimit();
            long used  = repository.countByIpSince(ip, startOfDay);
            return new UsageStatus(limit, (int) Math.max(0, limit - used), false);
        }
    }

    private Instant startOfTodayUtc() {
        return ZonedDateTime.now(ZoneOffset.UTC)
                .toLocalDate()
                .atStartOfDay(ZoneOffset.UTC)
                .toInstant();
    }

    /** Snapshot returned by {@link #getStatus}. */
    public record UsageStatus(int dailyLimit, int remaining, boolean authenticated) {}
}
