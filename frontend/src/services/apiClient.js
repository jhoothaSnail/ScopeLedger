// frontend/src/services/apiClient.js
// Central REST API fetcher with configurable offline/mock toggle and graceful error handling

export const USE_MOCK_API = false;
// Backend address. Set VITE_API_BASE at build time for deployments (e.g. https://api.example.com/api/v1);
// local development falls back to the Spring Boot dev server.
const API_BASE = (import.meta.env.VITE_API_BASE || "http://localhost:8080/api/v1").replace(/\/+$/, "");

// Signed-in demo profile, sent with every call so the server can apply the role rules.
// The name is URL-encoded because HTTP headers only allow Latin-1 characters.
let actorHeaders = {};

/** Called by AuthProvider whenever the signed-in user changes (null when signed out). */
export function setApiActor(user) {
  actorHeaders = user
    ? { "X-User-Role": user.role, "X-User-Name": encodeURIComponent(user.name) }
    : {};
}

export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...actorHeaders,
      ...(options.headers || {})
    }
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
