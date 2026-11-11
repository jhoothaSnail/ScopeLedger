package com.scopeledger.service;

import com.scopeledger.dto.ImpactedTaskDto;
import com.scopeledger.dto.SimulationRequestDto;
import com.scopeledger.dto.SimulationResponseDto;
import com.scopeledger.dto.TradeOffCandidateDto;
import com.scopeledger.entity.DeliverableTask;
import com.scopeledger.entity.Project;
import com.scopeledger.entity.TaskDependency;
import com.scopeledger.exception.InvalidRequestException;
import com.scopeledger.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Pure JUnit 5 tests for the BFS ripple engine — no Spring context, no database. */
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

        tasks = new ArrayList<>(List.of(
                task(101L, "DB Design", "COMPLETED", 20.0, 3, false),
                task(102L, "Auth API", "COMPLETED", 24.0, 4, false),
                task(103L, "Checkout", "IN_PROGRESS", 32.0, 5, false),
                task(104L, "PDF Invoices", "NOT_STARTED", 16.0, 3, true)));
        deps = new ArrayList<>(List.of(edge(101, 102), edge(102, 103)));
    }

    private static DeliverableTask task(Long id, String title, String status, Double hrs, Integer days, boolean opt) {
        DeliverableTask t = new DeliverableTask();
        t.setId(id);
        t.setTitle(title);
        t.setStatus(status);
        t.setEstimatedHours(hrs);
        t.setHourlyRate(1000.0);
        t.setDurationDays(days);
        t.setIsOptional(opt);
        t.setIsActive(true);
        return t;
    }

    private static TaskDependency edge(long from, long to) {
        return new TaskDependency(null, 1L, from, to);
    }

    private SimulationResponseDto run(long target, double hours, int days, List<Long> drops) {
        return service.computeSimulation(project, tasks, deps,
                new SimulationRequestDto(target, "change", hours, days, drops));
    }

    private static List<Long> impactedIds(SimulationResponseDto res) {
        return res.impactedTasks().stream().map(ImpactedTaskDto::taskId).toList();
    }

    @Test
    void contractB_exampleIsReproducedExactly() {
        SimulationResponseDto res = run(102, 12, 2, List.of(104L));

        assertEquals(List.of(102L, 103L), impactedIds(res));
        assertEquals("DIRECT_CHANGE", res.impactedTasks().get(0).impactType());
        assertEquals(new BigDecimal("12000.00"), res.impactedTasks().get(0).extraCost());
        assertEquals("DOWNSTREAM_REWORK", res.impactedTasks().get(1).impactType());
        assertEquals(8.0, res.impactedTasks().get(1).extraHours());
        assertEquals(new BigDecimal("8000.00"), res.impactedTasks().get(1).extraCost());
        assertEquals(1, res.impactedTasks().get(1).delayDays());

        assertEquals(new BigDecimal("100000.00"), res.financialSummary().originalBudget());
        assertEquals(new BigDecimal("20000.00"), res.financialSummary().changeAndReworkCost());
        assertEquals(new BigDecimal("16000.00"), res.financialSummary().optionalTasksSavedCost());
        assertEquals(new BigDecimal("104000.00"), res.financialSummary().projectedBudget());
        assertEquals(new BigDecimal("4000.00"), res.financialSummary().netBudgetDelta());

        assertEquals(20, res.scheduleSummary().originalDurationDays());
        assertEquals(3, res.scheduleSummary().grossDelayDays());
        assertEquals(3, res.scheduleSummary().daysSavedByDroppingOptional());
        assertEquals(20, res.scheduleSummary().projectedDurationDays());
        assertEquals(0, res.scheduleSummary().netDaysDelta());
        assertEquals(List.of(104L), res.appliedDropIds());
    }

    @Test
    void diamondDependentIsCountedOnce() {
        tasks.add(task(105L, "Side", "COMPLETED", 8.0, 1, false));
        tasks.add(task(106L, "Merge", "COMPLETED", 16.0, 2, false));
        deps.addAll(List.of(edge(101, 105), edge(103, 106), edge(105, 106)));

        SimulationResponseDto res = run(101, 4, 1, List.of());

        assertEquals(1, impactedIds(res).stream().filter(id -> id == 106L).count());
        assertEquals(List.of(101L, 102L, 105L, 103L, 106L), impactedIds(res)); // BFS order
    }

    @Test
    void corruptCycleTerminates() {
        deps.add(edge(103, 101));
        SimulationResponseDto res = run(102, 1, 0, List.of());
        assertEquals(List.of(102L, 103L, 101L), impactedIds(res));
    }

    @Test
    void inactiveTaskBlocksRipple() {
        tasks.get(2).setIsActive(false); // 103 dropped earlier
        tasks.add(task(105L, "After checkout", "COMPLETED", 8.0, 1, false));
        deps.add(edge(103, 105));
        assertEquals(List.of(102L), impactedIds(run(102, 5, 1, List.of())));
    }

    @Test
    void notStartedDependentsPassRippleWithoutRework() {
        tasks.add(task(105L, "QA", "NOT_STARTED", 10.0, 2, false));
        tasks.add(task(106L, "Hotfix", "COMPLETED", 10.0, 1, false));
        deps.addAll(List.of(edge(102, 105), edge(105, 106)));

        SimulationResponseDto res = run(102, 1, 0, List.of());

        assertTrue(impactedIds(res).contains(106L));
        assertTrue(!impactedIds(res).contains(105L));
        ImpactedTaskDto hotfix = res.impactedTasks().stream().filter(i -> i.taskId() == 106L).findFirst().orElseThrow();
        assertEquals(new BigDecimal("2500.00"), hotfix.extraCost()); // 10h * 0.25 * 1000
        assertEquals(1, hotfix.delayDays()); // ceil(2.5h / 8h)
    }

    @Test
    void zeroChangeProducesNoRipple() {
        SimulationResponseDto res = run(102, 0, 0, List.of());
        assertEquals(List.of(102L), impactedIds(res));
        assertEquals(new BigDecimal("0.00"), res.financialSummary().netBudgetDelta());
        assertEquals(20, res.scheduleSummary().projectedDurationDays());
    }

    @Test
    void ineligibleDropsArePruned() {
        tasks.get(3).setStatus("IN_PROGRESS"); // 104 now started
        SimulationResponseDto res = run(102, 12, 2, List.of(101L, 103L, 104L, 102L, 999L));
        assertEquals(List.of(), res.appliedDropIds());
        assertEquals(new BigDecimal("0.00"), res.financialSummary().optionalTasksSavedCost());
        assertEquals(List.of(), res.candidateTradeOffs());
    }

    @Test
    void optionalChainMustBeDroppedTogether() {
        tasks.add(task(105L, "Invoice email", "NOT_STARTED", 8.0, 1, true));
        deps.add(edge(104, 105)); // 104 -> 105

        // 104 alone has an active dependent, so it is rejected; only the leaf is offered.
        SimulationResponseDto alone = run(102, 0, 0, List.of(104L));
        assertEquals(List.of(), alone.appliedDropIds());
        assertEquals(List.of(105L), alone.candidateTradeOffs().stream().map(TradeOffCandidateDto::taskId).toList());

        // Leaf dropped -> parent becomes a candidate; both dropped -> both saved.
        SimulationResponseDto leaf = run(102, 0, 0, List.of(105L));
        assertEquals(List.of(104L, 105L), leaf.candidateTradeOffs().stream().map(TradeOffCandidateDto::taskId).toList());

        SimulationResponseDto both = run(102, 0, 0, List.of(104L, 105L));
        assertEquals(List.of(104L, 105L), both.appliedDropIds());
        assertEquals(new BigDecimal("24000.00"), both.financialSummary().optionalTasksSavedCost());
        assertEquals(4, both.scheduleSummary().daysSavedByDroppingOptional());
    }

    @Test
    void invalidInputIsRejected() {
        assertThrows(InvalidRequestException.class, () -> service.computeSimulation(project, tasks, deps,
                new SimulationRequestDto(102L, "x", null, 1, null)));
        assertThrows(InvalidRequestException.class, () -> run(102, -1, 0, null));
        assertThrows(InvalidRequestException.class, () -> run(102, 1, -2, null));
        assertThrows(InvalidRequestException.class, () -> run(102, Double.NaN, 0, null));
        assertThrows(InvalidRequestException.class, () -> service.computeSimulation(project, tasks, deps,
                new SimulationRequestDto(null, "x", 1.0, 1, null)));
        assertThrows(ResourceNotFoundException.class, () -> run(999, 1, 1, null));

        tasks.get(3).setIsActive(false);
        InvalidRequestException ex = assertThrows(InvalidRequestException.class, () -> run(104, 1, 1, null));
        assertEquals("TARGET_INACTIVE", ex.getErrorCode());
    }
}
