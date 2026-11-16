package com.scopeledger.security;

import java.util.EnumSet;
import java.util.Set;

import static com.scopeledger.security.UserRole.CLIENT;
import static com.scopeledger.security.UserRole.FINANCE_LEAD;
import static com.scopeledger.security.UserRole.PROJECT_MANAGER;
import static com.scopeledger.security.UserRole.TEAM_MEMBER;

/**
 * What each role may change. Reading the board, simulating a change and viewing history or
 * requests are open to every signed-in role, so they are not listed here.
 */
public enum Permission {
    EDIT_PLAN("add or link tasks", EnumSet.of(PROJECT_MANAGER)),
    APPROVE_CHANGES("approve or reject changes", EnumSet.of(PROJECT_MANAGER, FINANCE_LEAD)),
    SUBMIT_REQUESTS("submit change requests", EnumSet.of(PROJECT_MANAGER, CLIENT, TEAM_MEMBER)),
    UPDATE_PROGRESS("update task progress", EnumSet.of(PROJECT_MANAGER, TEAM_MEMBER)),
    RESET_DEMO("restore the sample data", EnumSet.of(PROJECT_MANAGER));

    private final String action;
    private final Set<UserRole> roles;

    Permission(String action, Set<UserRole> roles) {
        this.action = action;
        this.roles = roles;
    }

    public String action() {
        return action;
    }

    public boolean allows(UserRole role) {
        return role != null && roles.contains(role);
    }

    /** Human-readable list of the roles that hold this permission, e.g. "Project Manager or Finance Lead". */
    public String rolesText() {
        return String.join(" or ", roles.stream().map(UserRole::label).toList());
    }
}
