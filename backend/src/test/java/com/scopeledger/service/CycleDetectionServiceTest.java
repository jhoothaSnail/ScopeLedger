package com.scopeledger.service;

import com.scopeledger.entity.TaskDependency;
import com.scopeledger.exception.CircularDependencyException;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Pure JUnit 5 tests for the DFS cycle preventer — no Spring context, no database. */
class CycleDetectionServiceTest {

    private final CycleDetectionService service = new CycleDetectionService();

    private static TaskDependency edge(long from, long to) {
        return new TaskDependency(null, 1L, from, to);
    }

    private final List<TaskDependency> chain = List.of(edge(101, 102), edge(102, 103));

    @Test
    void rejectsBackLinkThatClosesLoop_planExample() {
        CircularDependencyException ex = assertThrows(CircularDependencyException.class,
                () -> service.assertNoCycle(103L, 101L, chain));
        assertTrue(ex.getMessage().startsWith("Cannot link Task 103 to Task 101: creates a circular loop"));
        assertEquals("CIRCULAR_DEPENDENCY", ex.getErrorCode());
    }

    @Test
    void rejectsSelfLoop() {
        assertThrows(CircularDependencyException.class, () -> service.assertNoCycle(102L, 102L, chain));
    }

    @Test
    void allowsForwardAndParallelLinks() {
        assertDoesNotThrow(() -> service.assertNoCycle(101L, 103L, chain)); // transitive shortcut is fine
        assertDoesNotThrow(() -> service.assertNoCycle(103L, 104L, chain));
        assertDoesNotThrow(() -> service.assertNoCycle(201L, 202L, List.of()));
    }

    @Test
    void detectsCycleThroughDiamond() {
        List<TaskDependency> diamond = List.of(edge(1, 2), edge(1, 3), edge(2, 4), edge(3, 4));
        assertThrows(CircularDependencyException.class, () -> service.assertNoCycle(4L, 1L, diamond));
        assertEquals(List.of(1L, 2L, 4L).size(), service.findPath(1L, 4L, diamond).size());
    }

    @Test
    void deepChainDoesNotOverflowStack() {
        List<TaskDependency> deep = new ArrayList<>();
        for (long i = 0; i < 50_000; i++) {
            deep.add(edge(i, i + 1));
        }
        assertThrows(CircularDependencyException.class, () -> service.assertNoCycle(50_000L, 0L, deep));
    }

    @Test
    void terminatesOnPreExistingCorruptCycle() {
        List<TaskDependency> corrupt = List.of(edge(1, 2), edge(2, 1));
        assertDoesNotThrow(() -> service.assertNoCycle(5L, 6L, corrupt));
    }
}
