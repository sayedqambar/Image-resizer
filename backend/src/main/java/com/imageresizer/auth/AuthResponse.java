package com.imageresizer.auth;

/**
 * Returned after a successful register or login.
 */
public record AuthResponse(
        String token,
        String email,
        long   expiresIn   // milliseconds from now
) {}
