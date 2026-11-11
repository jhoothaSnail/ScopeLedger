// frontend/src/theme/themeContext.js
import { createContext, useContext } from 'react';

export const ThemeContext = createContext(null);

/** { theme: 'light'|'dark', setTheme, toggleTheme }. Must be used under <ThemeProvider>. */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
