// frontend/src/services/changeOrderApi.js
// Calls ChangeOrderController (Contracts B & C). History is fetched via boardApi.fetchChangeOrders.
import { apiFetch, USE_MOCK_API } from './apiClient';
import { MOCK_PROJECT_BOARD } from '../mocks/mockProjectData';

// Offline mock trade-off candidates (optional, NOT_STARTED leaf tasks in the 8-task seed).
const MOCK_CANDIDATES = [
  { taskId: 104, title: 'PDF Invoice Template', savedCost: 16000.0, savedDays: 3 },
  { taskId: 106, title: 'Admin Analytics Dashboard', savedCost: 20000.0, savedDays: 3 },
  { taskId: 107, title: 'Email Notification Service', savedCost: 12000.0, savedDays: 2 },
].map((c) => ({ ...c, rationale: 'Optional task in NOT_STARTED state with 0 active downstream dependencies.' }));

/**
 * Approximates the server for offline demos: direct cost from the payload, a fixed rework
 * on task 103 (as in Contract B) and savings from mock candidates only. The backend is
 * authoritative; this only keeps the UI usable with USE_MOCK_API = true.
 */
function buildMockSimulation(payload) {
  const hours = Number(payload.addedHours) || 0;
  const days = Number(payload.addedDays) || 0;
  const hasChange = hours > 0 || days > 0;
  const rework = hasChange && payload.targetTaskId !== 103
    ? [{ taskId: 103, title: 'Order & Checkout Service', impactType: 'DOWNSTREAM_REWORK', extraHours: 8.0, extraCost: 8000.0, delayDays: 1 }]
    : [];
  const candidates = MOCK_CANDIDATES.filter((c) => c.taskId !== payload.targetTaskId);
  const requested = new Set(payload.droppedOptionalTaskIds || []);
  const applied = candidates.filter((c) => requested.has(c.taskId));

  const directCost = hours * 1000;
  const changeAndReworkCost = directCost + rework.reduce((s, r) => s + r.extraCost, 0);
  const savedCost = applied.reduce((s, c) => s + c.savedCost, 0);
  const savedDays = applied.reduce((s, c) => s + c.savedDays, 0);
  const grossDelay = days + rework.reduce((m, r) => Math.max(m, r.delayDays), 0);
  const { baselineBudget, baselineDurationDays } = MOCK_PROJECT_BOARD;

  return {
    targetTaskId: payload.targetTaskId,
    impactedTasks: [
      { taskId: payload.targetTaskId, title: `Task #${payload.targetTaskId}`, impactType: 'DIRECT_CHANGE', extraHours: hours, extraCost: directCost, delayDays: days },
      ...rework,
    ],
    candidateTradeOffs: candidates,
    financialSummary: {
      originalBudget: baselineBudget,
      changeAndReworkCost,
      optionalTasksSavedCost: savedCost,
      projectedBudget: baselineBudget + changeAndReworkCost - savedCost,
      netBudgetDelta: changeAndReworkCost - savedCost,
    },
    scheduleSummary: {
      originalDurationDays: baselineDurationDays,
      grossDelayDays: grossDelay,
      daysSavedByDroppingOptional: savedDays,
      projectedDurationDays: baselineDurationDays + grossDelay - savedDays,
      netDaysDelta: grossDelay - savedDays,
    },
    appliedDropIds: applied.map((c) => c.taskId),
  };
}

/**
 * Contract B — read-only ripple simulation.
 * @param {number} projectId
 * @param {{targetTaskId:number, changeDescription:string, addedHours:number, addedDays:number, droppedOptionalTaskIds:number[]}} payload
 * @returns {Promise<object>} SimulationResponseDto (incl. candidateTradeOffs and appliedDropIds)
 */
export async function simulateChangeOrder(projectId, payload) {
  if (USE_MOCK_API) {
    return buildMockSimulation(payload);
  }
  return apiFetch(`/projects/${projectId}/change-orders/simulate`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Contract C — transactional commit. Same payload as simulate.
 * @returns {Promise<object>} the refreshed project board (ProjectBoardResponseDto)
 */
export async function commitChangeOrder(projectId, payload) {
  if (USE_MOCK_API) {
    return JSON.parse(JSON.stringify(MOCK_PROJECT_BOARD));
  }
  return apiFetch(`/projects/${projectId}/change-orders/commit`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
