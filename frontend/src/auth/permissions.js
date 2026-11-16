// frontend/src/auth/permissions.js
// What each role may do. Mirrors com.scopeledger.security.Permission on the server, which
// enforces the same rules; the UI uses this to show only the actions a person can take.

const RULES = {
  editPlan: ['Project Manager'],
  approve: ['Project Manager', 'Finance Lead'],
  request: ['Project Manager', 'Client', 'Team Member'],
  progress: ['Project Manager', 'Team Member'],
  reset: ['Project Manager'],
};

/** @param {{role:string}|null} user  @param {'editPlan'|'approve'|'request'|'progress'|'reset'} action */
export function can(user, action) {
  return Boolean(user && RULES[action]?.includes(user.role));
}

/** The main button a person sees after estimating a change. */
export function changeAction(user) {
  if (can(user, 'approve')) return 'approve';
  if (can(user, 'request')) return 'request';
  return null;
}

export const APPROVER_ROLES = RULES.approve;
