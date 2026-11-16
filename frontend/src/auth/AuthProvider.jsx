// frontend/src/auth/AuthProvider.jsx
// Demo sign-in (frontend only, by design): stores a display profile in this browser.
// There is no password and no server-side authentication — it personalises the UI only.
import React, { useMemo, useState } from 'react';
import { AuthContext, FRESH_SIGN_IN_KEY } from './authContext';
import { buildUser } from './profile';
import { setApiActor } from '../services/apiClient';

const STORAGE_KEY = 'scopeledger.session';

function readSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const { user } = buildUser(JSON.parse(raw)); // re-validate anything read from storage
    return user || null;
  } catch {
    return null;
  }
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession);
  setApiActor(user); // keep API role headers in step with the session (cheap, idempotent)

  const value = useMemo(() => ({
    user,
    signIn(profile) {
      const result = buildUser(profile);
      if (result.user) {
        setApiActor(result.user);
        setUser(result.user);
        try {
          // Marks a new sign-in for this tab so the guided tour opens (a page refresh does not).
          sessionStorage.setItem(FRESH_SIGN_IN_KEY, result.user.id);
        } catch {
          /* tour simply won't auto-open */
        }
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(result.user));
        } catch {
          /* session still works until the tab is closed */
        }
      }
      return result;
    },
    signOut() {
      setApiActor(null);
      setUser(null);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* nothing stored */
      }
    },
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
