// frontend/src/services/apiClient.js
// Central REST API fetcher with configurable offline/mock toggle and graceful error handling

export const USE_MOCK_API = false;
const API_BASE = "http://localhost:8080/api/v1";

export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  };

  try {
    const res = await fetch(url, config);
    const contentType = res.headers.get("content-type");
    let payload = null;

    if (contentType && contentType.includes("application/json")) {
      payload = await res.json();
    } else {
      payload = await res.text();
    }

    if (!res.ok) {
      const msg = typeof payload === "object" && payload?.message 
        ? payload.message 
        : typeof payload === "string" && payload.length > 0 
          ? payload 
          : `HTTP ${res.status}: Request failed`;
      throw new Error(msg);
    }

    return payload;
  } catch (error) {
    console.warn(`[ScopeLedger API] Call to ${endpoint} failed:`, error.message);
    throw error;
  }
}
