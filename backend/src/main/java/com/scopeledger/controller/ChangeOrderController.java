package com.scopeledger.controller;

import com.scopeledger.dto.ChangeOrderLogDto;
import com.scopeledger.dto.ProjectBoardResponseDto;
import com.scopeledger.dto.SimulationRequestDto;
import com.scopeledger.dto.SimulationResponseDto;
import com.scopeledger.service.ProjectBoardService;
import com.scopeledger.service.RippleSimulationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Change-order endpoints: dry-run simulation (Contract B), transactional commit (Contract C)
 * and the immutable audit trail.
 */
@RestController
@RequestMapping("/api/v1/projects/{projectId}/change-orders")
public class ChangeOrderController {

    private final RippleSimulationService simulationService;
    private final ProjectBoardService boardService;

    public ChangeOrderController(RippleSimulationService simulationService, ProjectBoardService boardService) {
        this.simulationService = simulationService;
        this.boardService = boardService;
    }

    /** Contract B: read-only ripple calculation; never writes to the database. */
    @PostMapping("/simulate")
    public SimulationResponseDto simulate(@PathVariable Long projectId, @RequestBody SimulationRequestDto request) {
        return simulationService.simulateChange(projectId, request);
    }

    /** Contract C: applies the change order atomically, then returns the refreshed board. */
    @PostMapping("/commit")
    public ProjectBoardResponseDto commit(@PathVariable Long projectId, @RequestBody SimulationRequestDto request) {
        simulationService.commitChange(projectId, request);
        return boardService.getBoard(projectId);
    }

    /** Audit trail of committed change orders, newest first. */
    @GetMapping
    public List<ChangeOrderLogDto> history(@PathVariable Long projectId) {
        return simulationService.getChangeHistory(projectId);
    }
}
