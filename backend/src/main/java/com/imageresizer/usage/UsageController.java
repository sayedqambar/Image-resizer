package com.imageresizer.usage;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * {@code GET /api/usage} — returns the caller's remaining daily AI uses.
 *
 * Works for both authenticated (JWT) and anonymous callers. The frontend polls
 * this after each AI call and on page load to keep the usage bar up to date.
 */
@RestController
@RequestMapping("/api/usage")
@RequiredArgsConstructor
public class UsageController {

    private final UsageEnforcementService usageService;

    @GetMapping
    public UsageEnforcementService.UsageStatus status(Authentication auth,
                                                       HttpServletRequest request) {
        return usageService.getStatus(
                RequestUtils.resolveUserId(auth),
                RequestUtils.resolveIp(request));
    }
}
