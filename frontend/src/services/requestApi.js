// frontend/src/services/requestApi.js
// Shared change requests (ChangeRequestController). These need the server: a request only
// makes sense if other people can see it, so there is no offline fallback.
import { apiFetch, USE_MOCK_API } from './apiClient';

const OFFLINE = 'Change requests need the server, which isn’t reachable right now.';

const base = (projectId) => `/projects/${projectId}/change-requests`;

export async function fetchChangeRequests(projectId = 1) {
  if (USE_MOCK_API) return [];
  return apiFetch(base(projectId));
}

/** Same payload as a simulation; the server stores its own estimate with the request. */
export async function submitChangeRequest(projectId, payload) {
  if (USE_MOCK_API) throw new Error(OFFLINE);
  return apiFetch(base(projectId), { method: 'POST', body: JSON.stringify(payload) });
}

export async function approveChangeRequest(projectId, requestId, note = '') {
  if (USE_MOCK_API) throw new Error(OFFLINE);
  return apiFetch(`${base(projectId)}/${requestId}/approve`, { method: 'POST', body: JSON.stringify({ note }) });
}

export async function rejectChangeRequest(projectId, requestId, note = '') {
  if (USE_MOCK_API) throw new Error(OFFLINE);
  return apiFetch(`${base(projectId)}/${requestId}/reject`, { method: 'POST', body: JSON.stringify({ note }) });
}
