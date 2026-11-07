// File: backend/src/test/java/com/scopeledger/service/RippleSimulationServiceTest.java
package com.scopeledger.service;

import com.scopeledger.dto.SimulationRequestDto;
import com.scopeledger.dto.SimulationResponseDto;
import com.scopeledger.entity.DeliverableTask;
import com.scopeledger.entity.Project;
import com.scopeledger.entity.TaskDependency;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class RippleSimulationServiceTest {

    private RippleSimulationService service;
    private Project project;
    private List<DeliverableTask> tasks;
    private List<TaskDependency> deps;

    @BeforeEach
    void setUp() {
        service = new RippleSimulationService(null, null, null, null);

        project = new Project();
        project.setId(1L);
        project.setBaselineBudget(100000.0);
        project.setBaselineDurationDays(20);
        project.setReworkPenaltyRate(0.25);

        DeliverableTask t101 = createTask(101L, "DB Design", "COMPLETED", 20.0, 1000.0, 3, false);
        DeliverableTask t102 = createTask(102L, "Auth API", "COMPLETED", 24.0, 1000.0, 4, false);
        DeliverableTask t103 = createTask(103L, "Checkout", "IN_PROGRESS", 32.0, 1000.0, 5, false);
        DeliverableTask t104 = createTask(104L, "PDF Invoices", "NOT_STARTED", 16.0, 1000.0, 3, true);

        tasks = List.of(t101, t102, t103, t104);
        deps = List.of(
                new TaskDependency(501L, 1L, 101L, 102L),
                new TaskDependency(502L, 1L, 102L, 103L)
        );
    }

    private DeliverableTask createTask(Long id, String title, String status, Double hrs, Double rate, Integer days, boolean opt) {
        DeliverableTask t = new DeliverableTask();
        t.setId(id);
        t.setTitle(title);
        t.setStatus(status);
        t.setEstimatedHours(hrs);
        t.setHourlyRate(rate);
        t.setDurationDays(days);
        t.setIsOptional(opt);
        t.setIsActive(true);
        return t;
    }

    @Test
    void testRippleSimulation_DirectAndReworkCalculation() {
        SimulationRequestDto req = new SimulationRequestDto(102L, "WhatsApp OTP", 12.0, 2, List.of(104L));
        SimulationResponseDto res = service.computeSimulation(project, tasks, deps, req);

        assertEquals(2, res.impactedTasks().size());
        assertEquals("DIRECT_CHANGE", res.impactedTasks().get(0).impactType());
        assertEquals(new BigDecimal("12000.00"), res.impactedTasks().get(0).extraCost());

        // 32h * 0.25 = 8.0h -> 8.0 * 1000 = 8000.00
        assertEquals("DOWNSTREAM_REWORK", res.impactedTasks().get(1).impactType());
        assertEquals(new BigDecimal("8000.00"), res.impactedTasks().get(1).extraCost());

        // Trade-off: Task 104 saved = 16 * 1000 = 16000.00
        assertEquals(new BigDecimal("20000.00"), res.financialSummary().changeAndReworkCost());
        assertEquals(new BigDecimal("16000.00"), res.financialSummary().optionalTasksSavedCost());
        assertEquals(new BigDecimal("4000.00"), res.financialSummary().netBudgetDelta());
        assertEquals(0, res.scheduleSummary().netDaysDelta());
    }
}