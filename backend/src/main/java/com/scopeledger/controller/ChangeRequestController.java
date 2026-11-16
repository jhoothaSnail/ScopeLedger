package com.scopeledger.controller;

import com.scopeledger.dto.ChangeRequestDto;
import com.scopeledger.dto.DecisionRequestDto;
import com.scopeledger.dto.SimulationRequestDto;
import com.scopeledger.security.Actor;
import com.scopeledger.service.ChangeRequestService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Shared change requests: clients submit, approvers (project manager / finance lead) decide.
 * The signed-in profile arrives in the {@code X-User-Role} / {@code X-User-Name} headers.
 */
@RestController
@RequestMapping("/api/v1/projects/{projectId}/change-requests")
public class ChangeRequestController {

    private final ChangeRequestService requestService;

    public ChangeRequestController(ChangeRequestService requestService) {
        this.requestService = requestService;
    }

    @GetMapping
    public List<ChangeRequestDto> list(@PathVariable Long projectId) {
        return requestService.list(projectId);
    }

    @PostMapping
    public ResponseEntity<ChangeRequestDto> submit(@PathVariable Long projectId, @RequestBody SimulationRequestDto request,
                                                   @RequestHeader(value = Actor.ROLE_HEADER, required = false) String role,
                                                   @RequestHeader(value = Actor.NAME_HEADER, required = false) String name) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(requestService.submit(projectId, request, Actor.from(role, name)));
    }

    @PostMapping("/{requestId}/approve")
    public ChangeRequestDto approve(@PathVariable Long projectId, @PathVariable Long requestId,
                                    @RequestBody(required = false) DecisionRequestDto decision,
                                    @RequestHeader(value = Actor.ROLE_HEADER, required = false) String role,
                                    @RequestHeader(value = Actor.NAME_HEADER, required = false) String name) {
        return requestService.approve(projectId, requestId, decision == null ? null : decision.note(), Actor.from(role, name));
    }

    @PostMapping("/{requestId}/reject")
    public ChangeRequestDto reject(@PathVariable Long projectId, @PathVariable Long requestId,
                                   @RequestBody(required = false) DecisionRequestDto decision,
                                   @RequestHeader(value = Actor.ROLE_HEADER, required = false) String role,
                                   @RequestHeader(value = Actor.NAME_HEADER, required = false) String name) {
        return requestService.reject(projectId, requestId, decision == null ? null : decision.note(), Actor.from(role, name));
    }
}
