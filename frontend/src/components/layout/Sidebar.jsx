// frontend/src/components/layout/Sidebar.jsx
// App navigation + signed-in user's profile menu (theme, help tour, sign out).
import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../theme/themeContext';

const ICONS = {
  overview: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
      <rect x="2.5" y="2.5" width="6" height="7" rx="1.5" /><rect x="11.5" y="2.5" width="6" height="4" rx="1.5" />
      <rect x="11.5" y="9.5" width="6" height="8" rx="1.5" /><rect x="2.5" y="12.5" width="6" height="5" rx="1.5" />
    </svg>
  ),
  board: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
      <circle cx="4" cy="10" r="2.5" /><circle cx="16" cy="5" r="2.5" /><circle cx="16" cy="15" r="2.5" />
      <path d="M6.5 10 L13.5 5.5M6.5 10 L13.5 14.5" strokeLinecap="round" />
    </svg>
  ),
  changeorders: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
      <path d="M6 2h8l4 4v12a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z" strokeLinejoin="round" />
      <path d="M14 2v4h4M8 11h4M8 14h2" strokeLinecap="round" />
    </svg>
  ),
};

const NAV_ITEMS = [
  { key: 'overview', label: 'Overview', hint: 'Project health at a glance' },
  { key: 'board', label: 'Project board', hint: 'Tasks and how they connect' },
  { key: 'changeorders', label: 'Change history', hint: 'Every approved change' },
];

function ProfileMenu({ user, isCollapsed, onSignOut, onStartTour }) {
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const choose = (fn) => () => { setOpen(false); fn?.(); };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {open && (
        <div className="sl-menu" role="menu" aria-label="Profile menu" style={{ bottom: 'calc(100% + 8px)', left: 0 }}>
          <div style={{ padding: '8px 10px 10px' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user.email || user.role}</div>
          </div>
          <div className="sl-menu-sep" />
          <button type="button" role="menuitem" className="sl-menu-item" onClick={choose(toggleTheme)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
            {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          </button>
          {onStartTour && (
            <button type="button" role="menuitem" className="sl-menu-item" onClick={choose(onStartTour)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M9.5 9a2.5 2.5 0 114 2c-.9.6-1.5 1.1-1.5 2.2M12 17h.01" /></svg>
              Show me around
            </button>
          )}
          <div className="sl-menu-sep" />
          <button type="button" role="menuitem" className="sl-menu-item" onClick={choose(onSignOut)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17l5-5-5-5M20 12H9M12 21H5a2 2 0 01-2-2V5a2 2 0 012-2h7" /></svg>
            Sign out
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user.name}`}
        className="sl-nav-item"
        style={{ padding: isCollapsed ? 6 : '8px 10px', justifyContent: isCollapsed ? 'center' : 'flex-start' }}
      >
        <span className="sl-avatar" style={{ width: 34, height: 34, background: user.avatarColor }}>{user.initials}</span>
        {!isCollapsed && (
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</span>
            <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)' }}>{user.role}</span>
          </span>
        )}
      </button>
    </div>
  );
}

export default function Sidebar({ activePage = 'overview', onNavigate, projectName, isCollapsed, onToggleCollapse, user, onSignOut, onStartTour, navItems = NAV_ITEMS }) {
  return (
    <aside
      aria-label="Main navigation"
      style={{
        width: isCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        transition: 'width 0.2s var(--ease-out-cubic)',
        height: '100vh',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
        zIndex: 30,
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px', minHeight: 64, borderBottom: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        <div className="sl-avatar" style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-solid)' }}>SL</div>
        {!isCollapsed && (
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>ScopeLedger</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Change impact planner</div>
          </div>
        )}
      </div>

      {/* Current project */}
      {!isCollapsed && projectName && (
        <div style={{ margin: '14px 12px 4px', padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-hover)', border: '1px solid var(--border-faint)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>Project</div>
          <div title={projectName} style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{projectName}</div>
        </div>
      )}

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px', display: 'grid', alignContent: 'start', gap: 4 }}>
        {navItems.map((item) => (
          <button
            key={item.key}
            type="button"
            data-tour={`nav-${item.key}`}
            className="sl-nav-item"
            aria-current={activePage === item.key ? 'page' : undefined}
            onClick={() => onNavigate?.(item.key)}
            title={isCollapsed ? item.label : item.hint}
            style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}
          >
            {ICONS[item.key]}
            {!isCollapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Footer: collapse + profile */}
      <div style={{ padding: 12, borderTop: '1px solid var(--border-subtle)', display: 'grid', gap: 6 }}>
        <button
          type="button"
          className="sl-nav-item"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', fontSize: 13 }}
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true"
            style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
            <path d="M12.5 5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {!isCollapsed && 'Collapse'}
        </button>
        {user && <ProfileMenu user={user} isCollapsed={isCollapsed} onSignOut={onSignOut} onStartTour={onStartTour} />}
      </div>
    </aside>
  );
}
