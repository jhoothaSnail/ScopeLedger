// frontend/src/auth/authContext.js
import { createContext, useContext } from 'react';

export const AuthContext = createContext(null);

/** sessionStorage key set on a fresh sign-in (not on refresh) so the guided tour opens once per sign-in. */
export const FRESH_SIGN_IN_KEY = 'scopeledger.tour.pending';

/** Current demo user plus signIn/signOut. Must be used under <AuthProvider>. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
