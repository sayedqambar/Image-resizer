package com.imageresizer.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request body for both {@code POST /api/auth/register} and {@code POST /api/auth/login}.
 */
public record AuthRequest(
        @NotBlank @Email
        String email,

        @NotBlank @Size(min = 8, message = "Password must be at least 8 characters")
        String password
) {}
