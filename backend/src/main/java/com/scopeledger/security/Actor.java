package com.scopeledger.security;

import com.scopeledger.exception.ApiException;
import org.springframework.http.HttpStatus;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

/**
 * Who is making a request, read from the {@code X-User-Role} / {@code X-User-Name} headers that
 * the frontend attaches for the signed-in demo profile.
 *
 * <p><b>Scope note:</b> ScopeLedger's sign-in is a demo profile picker without passwords, so these
 * headers are trusted as sent. The checks keep every screen and API call consistent with the role
 * rules; they are not a substitute for real authentication.
 */
public record Actor(String name, UserRole role) {

    public static final String ROLE_HEADER = "X-User-Role";
    public static final String NAME_HEADER = "X-User-Name";
    private static final int MAX_NAME = 80;

    /** Builds the actor from raw header values (name is URL-encoded by the client so any script is safe). */
    public static Actor from(String roleHeader, String nameHeader) {
        UserRole role = UserRole.fromHeader(roleHeader).orElse(null);
        String name = decode(nameHeader);
        if (name.isBlank()) {
            name = role == null ? "Unknown user" : role.label();
        }
        return new Actor(name.length() > MAX_NAME ? name.substring(0, MAX_NAME) : name, role);
    }

    /** @throws ApiException 403 ROLE_REQUIRED / ROLE_NOT_ALLOWED when the role may not perform the action */
    public Actor require(Permission permission) {
        if (role == null) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ROLE_REQUIRED",
                    "Sign in with a role before you " + permission.action() + ".");
        }
        if (!permission.allows(role)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ROLE_NOT_ALLOWED",
                    "Only a " + permission.rolesText() + " can " + permission.action() + ".");
        }
        return this;
    }

    private static String decode(String raw) {
        if (raw == null) {
            return "";
        }
        try {
            return URLDecoder.decode(raw, StandardCharsets.UTF_8).trim().replaceAll("\\s+", " ");
        } catch (IllegalArgumentException e) {
            return raw.trim();
        }
    }
}
