package com.scopeledger.service;

import com.scopeledger.entity.TaskDependency;
import com.scopeledger.exception.CircularDependencyException;
import org.springframework.stereotype.Service;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Deque;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Engine A — the Cycle Preventer. Before a link {@code X -> Y} is stored, a Depth-First Search
 * runs from {@code Y} along existing edges; reaching {@code X} means the link would close a loop.
 *
 * <p>The DFS is iterative (explicit stack), so deep graphs can never cause a StackOverflowError.
 * Pure function of its inputs: no repository access, fully unit-testable.
 */
@Service
public class CycleDetectionService {

    /**
     * @throws CircularDependencyException if adding {@code prerequisiteId -> dependentId} would
     *                                     create a cycle (including a self-loop)
     */
    public void assertNoCycle(Long prerequisiteId, Long dependentId, Collection<TaskDependency> existingEdges) {
        if (prerequisiteId.equals(dependentId)) {
            throw new CircularDependencyException(
                    "Cannot link Task " + prerequisiteId + " to itself: creates a circular loop.");
        }
        List<Long> path = findPath(dependentId, prerequisiteId, existingEdges);
        if (!path.isEmpty()) {
            String loop = path.stream().map(String::valueOf).collect(Collectors.joining(" → "))
                    + " → " + dependentId;
            throw new CircularDependencyException("Cannot link Task " + prerequisiteId + " to Task "
                    + dependentId + ": creates a circular loop (" + loop + ").");
        }
    }

    /** Returns the edge path {@code from ... to}, or an empty list when {@code to} is unreachable. */
    List<Long> findPath(Long from, Long to, Collection<TaskDependency> edges) {
        Map<Long, List<Long>> adjacency = new HashMap<>();
        for (TaskDependency e : edges) {
            adjacency.computeIfAbsent(e.getPrerequisiteTaskId(), k -> new ArrayList<>()).add(e.getDependentTaskId());
        }

        Map<Long, Long> parent = new HashMap<>();
        Deque<Long> stack = new ArrayDeque<>();
        stack.push(from);
        parent.put(from, null);

        while (!stack.isEmpty()) {
            Long current = stack.pop();
            if (current.equals(to)) {
                LinkedList<Long> path = new LinkedList<>();
                for (Long n = current; n != null; n = parent.get(n)) {
                    path.addFirst(n);
                }
                return path;
            }
            for (Long next : adjacency.getOrDefault(current, Collections.emptyList())) {
                if (!parent.containsKey(next)) { // visited guard: each node expanded once
                    parent.put(next, current);
                    stack.push(next);
                }
            }
        }
        return Collections.emptyList();
    }
}
