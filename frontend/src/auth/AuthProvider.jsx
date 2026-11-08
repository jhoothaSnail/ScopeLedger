// frontend/src/auth/AuthProvider.jsx
// Demo sign-in (frontend only, by design): stores a display profile in this browser.
// There is no password and no server-side authentication — it personalises the UI only.
import React, { useMemo, useState } from 'react';
import { AuthContext } from './authContext';
import { buildUser } from './profile';

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

  const value = useMemo(() => ({
    user,
    signIn(profile) {
      const result = buildUser(profile);
      if (result.user) {
        setUser(result.user);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(result.user));
        } catch {
          /* session still works until the tab is closed */
        }
      }
      return result;
    },
    signOut() {
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
