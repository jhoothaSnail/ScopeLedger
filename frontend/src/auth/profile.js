// frontend/src/auth/profile.js
// Demo profile data + validation helpers (no React).

export const ROLES = ['Project Manager', 'Client', 'Finance Lead', 'Team Member'];

export const DEMO_PROFILES = [
  { name: 'Priya Sharma', email: 'priya@scopeledger.demo', role: 'Project Manager', blurb: 'Plans the work and approves changes' },
  { name: 'Rahul Mehta', email: 'rahul@acmeretail.demo', role: 'Client', blurb: 'Asks for changes and reviews their cost' },
  { name: 'Ananya Iyer', email: 'ananya@scopeledger.demo', role: 'Finance Lead', blurb: 'Keeps an eye on budget and timeline' },
];

// Stable colour per person (token-based so it reads well in both themes).
const AVATAR_COLORS = ['var(--accent-solid)', '#7c3aed', '#c2410c', '#047857', '#be123c', '#4338ca'];

export function initialsOf(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] || '?').slice(0, 2);
  return letters.toUpperCase();
}

function avatarColorOf(name) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

/** Validates and normalises a profile; returns { user } or { errors }. */
export function buildUser({ name = '', email = '', role = '' }) {
  const errors = {};
  const cleanName = name.trim().replace(/\s+/g, ' ');
  const cleanEmail = email.trim();
  if (cleanName.length < 2 || cleanName.length > 60) errors.name = 'Please enter your name (2–60 characters).';
  if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) errors.email = 'That email address doesn’t look right.';
  if (!ROLES.includes(role)) errors.role = 'Please choose a role.';
  if (Object.keys(errors).length) return { errors };
  return {
    user: {
      id: (cleanEmail || cleanName).toLowerCase(),
      name: cleanName,
      email: cleanEmail,
      role,
      initials: initialsOf(cleanName),
      avatarColor: avatarColorOf(cleanName),
    },
  };
}
