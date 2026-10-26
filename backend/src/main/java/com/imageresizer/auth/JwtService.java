package com.imageresizer.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Generates and validates HMAC-SHA256 signed JWTs.
 *
 * <p>Token payload: {@code sub} = user email, {@code uid} = user id.
 */
@Service
@RequiredArgsConstructor
public class JwtService {

    private final JwtProperties properties;

    /** Mint a new token for the given user. */
    public String generate(User user) {
        Date now    = new Date();
        Date expiry = new Date(now.getTime() + properties.getExpiryMs());

        return Jwts.builder()
                .subject(user.getEmail())
                .claim("uid", user.getId())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key())
                .compact();
    }

    /** Extract the email (subject) from a valid token. Throws on invalid/expired. */
    public String extractEmail(String token) {
        return claims(token).getSubject();
    }

    /** Extract the user-id claim from a valid token. */
    public Long extractUserId(String token) {
        Object uid = claims(token).get("uid");
        if (uid instanceof Integer i) return i.longValue();
        if (uid instanceof Long l)    return l;
        return null;
    }

    /** Return true if the token parses and has not expired. */
    public boolean isValid(String token) {
        try {
            claims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims claims(String token) {
        return Jwts.parser()
                .verifyWith(key())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey key() {
        return Keys.hmacShaKeyFor(properties.getSecret().getBytes(StandardCharsets.UTF_8));
    }
}
