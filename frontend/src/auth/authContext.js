// frontend/src/auth/authContext.js
import { createContext, useContext } from 'react';

export const AuthContext = createContext(null);

/** Current demo user plus signIn/signOut. Must be used under <AuthProvider>. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
