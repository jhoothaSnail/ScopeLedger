// frontend/src/services/boardApi.js
import { apiFetch, USE_MOCK_API } from './apiClient';
import { MOCK_PROJECT_BOARD, MOCK_CHANGE_ORDERS } from '../mocks/mockProjectData';

// Mutable in-memory state for local testing when backend is offline
let localBoard = JSON.parse(JSON.stringify(MOCK_PROJECT_BOARD));
let localChangeOrders = [...MOCK_CHANGE_ORDERS];

// True when the last board load used local sample data (mock mode or server unreachable).
let usingFallback = USE_MOCK_API;

/** Lets the UI say honestly whether it is showing live or sample data. */
export function isUsingFallback() {
  return usingFallback;
}

export async function fetchProjectBoard(projectId = 1) {
  if (USE_MOCK_API) {
    return Promise.resolve(JSON.parse(JSON.stringify(localBoard)));
  }

  try {
    const board = await apiFetch(`/projects/${projectId}/board`);
    usingFallback = false;
    return board;
  } catch (err) {
    console.warn("Backend board endpoint unreachable. Falling back to in-memory board state.", err.message);
    usingFallback = true;
    return JSON.parse(JSON.stringify(localBoard));
  }
}

/** Adds a task in local sample mode, including its links (offline only — nothing is saved). */
function createLocalTask(projectId, taskData) {
  const newTask = {
    id: Date.now(),
    projectId,
    title: taskData.title,
    status: taskData.status || "NOT_STARTED",
    estimatedHours: Number(taskData.estimatedHours) || 8,
    hourlyRate: Number(taskData.hourlyRate) || 1000,
    durationDays: Number(taskData.durationDays) || 1,
    isOptional: Boolean(taskData.isOptional),
    isActive: true,
    posX: Number(taskData.posX) || 200,
    posY: Number(taskData.posY) || 200
  };
  localBoard.tasks.push(newTask);
  let edgeId = Date.now() + 1;
  for (const id of taskData.dependsOnTaskIds || []) {
    localBoard.dependencies.push({ id: edgeId++, prerequisiteTaskId: id, dependentTaskId: newTask.id });
  }
  for (const id of taskData.neededByTaskIds || []) {
    localBoard.dependencies.push({ id: edgeId++, prerequisiteTaskId: newTask.id, dependentTaskId: id });
  }
  return newTask;
}

/**
 * Creates a task and, in the same server transaction, its links
 * (taskData.dependsOnTaskIds / taskData.neededByTaskIds).
 * Server errors (no permission, circular link, validation) are passed on to the form; the local
 * copy is only used when the board itself is already showing offline sample data.
 */
export async function createDeliverableTask(projectId = 1, taskData) {
  if (USE_MOCK_API || usingFallback) {
    return createLocalTask(projectId, taskData);
  }
  return apiFetch(`/projects/${projectId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(taskData)
  });
}

/** Saves a task's progress (NOT_STARTED | IN_PROGRESS | COMPLETED). Project Manager or Team Member. */
export async function updateTaskStatus(projectId = 1, taskId, status) {
  if (USE_MOCK_API || usingFallback) {
    const task = localBoard.tasks.find((t) => t.id === taskId);
    if (task) task.status = status;
    return Promise.resolve(task ? { ...task } : null);
  }
  return apiFetch(`/projects/${projectId}/tasks/${taskId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

export async function createTaskDependency(projectId = 1, depData) {
  if (USE_MOCK_API) {
    // Basic local cycle prevention
    if (depData.prerequisiteTaskId === depData.dependentTaskId) {
      throw new Error("Cannot link task to itself: self-loop detected.");
    }
    const newDep = {
      id: Date.now(),
      prerequisiteTaskId: Number(depData.prerequisiteTaskId),
      dependentTaskId: Number(depData.dependentTaskId)
    };
    localBoard.dependencies.push(newDep);
    return Promise.resolve(newDep);
  }

  return await apiFetch(`/projects/${projectId}/dependencies`, {
    method: 'POST',
    body: JSON.stringify(depData)
  });
}

export async function deleteTaskDependency(projectId = 1, depId) {
  if (USE_MOCK_API) {
    localBoard.dependencies = localBoard.dependencies.filter(d => d.id !== depId);
    return Promise.resolve({ success: true });
  }

  return await apiFetch(`/projects/${projectId}/dependencies/${depId}`, {
    method: 'DELETE'
  });
}

export async function resetDemoData() {
  if (USE_MOCK_API) {
    localBoard = JSON.parse(JSON.stringify(MOCK_PROJECT_BOARD));
    return Promise.resolve({ message: "Mock project board restored to baseline state." });
  }

  if (usingFallback) { // offline sample data: restore the local copy
    localBoard = JSON.parse(JSON.stringify(MOCK_PROJECT_BOARD));
    return { message: "Reset to demo seed state." };
  }
  return apiFetch('/demo/reset', { method: 'POST' }); // errors (e.g. no permission) reach the UI

}

export async function fetchChangeOrders(projectId = 1) {
  if (USE_MOCK_API) {
    return Promise.resolve(localChangeOrders);
  }

  try {
    return await apiFetch(`/projects/${projectId}/change-orders`);
  } catch {
    return localChangeOrders;
  }
}
