// File: backend/src/main/java/com/scopeledger/controller/ChangeOrderController.java
package com.scopeledger.controller;

import com.scopeledger.dto.SimulationRequestDto;
import com.scopeledger.dto.SimulationResponseDto;
import com.scopeledger.service.RippleSimulationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/change-orders")
public class ChangeOrderController {

    private final RippleSimulationService simulationService;

    public ChangeOrderController(RippleSimulationService simulationService) {
        this.simulationService = simulationService;
    }

    @PostMapping("/simulate")
    public ResponseEntity<SimulationResponseDto> simulate(
            @PathVariable Long projectId,
            @RequestBody SimulationRequestDto request) {
        return ResponseEntity.ok(simulationService.simulateChange(projectId, request));
    }

    @PostMapping("/commit")
    public ResponseEntity<SimulationResponseDto> commit(
            @PathVariable Long projectId,
            @RequestBody SimulationRequestDto request) {
        return ResponseEntity.ok(simulationService.commitChange(projectId, request));
    }
}