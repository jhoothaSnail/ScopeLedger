package com.scopeledger.security;

import java.util.Arrays;
import java.util.Optional;

/**
 * The four roles a ScopeLedger user can sign in as. {@link #label()} is the exact text the
 * frontend sends in the {@code X-User-Role} header (and shows on screen).
 */
public enum UserRole {
    PROJECT_MANAGER("Project Manager"),
    CLIENT("Client"),
    FINANCE_LEAD("Finance Lead"),
    TEAM_MEMBER("Team Member");

    private final String label;

    UserRole(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }

    /** Case-insensitive lookup by label or enum name; empty for unknown or blank values. */
    public static Optional<UserRole> fromHeader(String value) {
        if (value == null || value.isBlank()) {
            return Optional.empty();
        }
        String v = value.trim();
        return Arrays.stream(values())
                .filter(r -> r.label.equalsIgnoreCase(v) || r.name().equalsIgnoreCase(v))
                .findFirst();
    }
}
