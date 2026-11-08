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

export async function createDeliverableTask(projectId = 1, taskData) {
  if (USE_MOCK_API) {
    const newTask = {
      id: Date.now(),
      projectId,
      title: taskData.title,
      status: taskData.status || "NOT_STARTED",
      estimatedHours: Number(taskData.estimatedHours) || 8,
      hourlyRate: Number(taskData.hourlyRate) || 1000,
      durationDays: Number(taskData.durationDays) || 2,
      isOptional: Boolean(taskData.isOptional),
      isActive: true,
      posX: Number(taskData.posX) || 200,
      posY: Number(taskData.posY) || 200
    };
    localBoard.tasks.push(newTask);
    return Promise.resolve(newTask);
  }

  try {
    return await apiFetch(`/projects/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(taskData)
    });
  } catch {
    // If backend isn't ready yet, insert locally so user experience is smooth
    const newTask = {
      id: Date.now(),
      projectId,
      ...taskData,
      isActive: true
    };
    localBoard.tasks.push(newTask);
    return newTask;
  }
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

  try {
    return await apiFetch('/demo/reset', { method: 'POST' });
  } catch {
    localBoard = JSON.parse(JSON.stringify(MOCK_PROJECT_BOARD));
    return { message: "Reset to demo seed state." };
  }
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
