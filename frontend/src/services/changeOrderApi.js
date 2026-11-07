import { apiFetch, USE_MOCK_API } from './apiClient';

const MOCK_SIM_RESPONSE = {
    targetTaskId: 102,
    impactedTasks: [
        {
            taskId: 102,
            title: "Email Login API",
            impactType: "DIRECT_CHANGE",
            extraHours: 12.0,
            extraCost: 12000.0,
            delayDays: 2
        },
        {
            taskId: 103,
            title: "Order & Checkout Service",
            impactType: "DOWNSTREAM_REWORK",
            extraHours: 8.0,
            extraCost: 8000.0,
            delayDays: 1
        }
    ],
    candidateTradeOffs: [
        {
            taskId: 104,
            title: "PDF Invoice Template",
            savedCost: 16000.0,
            savedDays: 3,
            rationale: "Optional leaf task with 0 active dependents."
        }
    ],
    financialSummary: {
        originalBudget: 100000.0,
        changeAndReworkCost: 20000.0,
        optionalTasksSavedCost: 16000.0,
        projectedBudget: 104000.0,
        netBudgetDelta: 4000.0
    },
    scheduleSummary: {
        originalDurationDays: 20,
        grossDelayDays: 3,
        daysSavedByDroppingOptional: 3,
        projectedDurationDays: 20,
        netDaysDelta: 0
    }
};

export async function simulateChangeOrder(projectId, payload) {
    if (USE_MOCK_API) {
        return Promise.resolve(MOCK_SIM_RESPONSE);
    }
    return apiFetch(`/projects/${projectId}/change-orders/simulate`, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}

export async function commitChangeOrder(projectId, payload) {
    if (USE_MOCK_API) {
        return Promise.resolve({ ...MOCK_SIM_RESPONSE, committed: true });
    }
    return apiFetch(`/projects/${projectId}/change-orders/commit`, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}