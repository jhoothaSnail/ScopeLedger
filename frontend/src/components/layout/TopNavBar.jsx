// frontend/src/components/layout/TopNavBar.jsx
// Page header: project name, connection status, primary actions, theme and help.
import React, { useState } from 'react';
import ThemeToggle from '../common/ThemeToggle';

export default function TopNavBar({
  projectName = 'E-Commerce Checkout & Auth System',
  pageTitle = 'Project board',
  onResetDemo,
  onOpenAuditLog,
  onOpenAddModal,
  onOpenHelp,
  isLiveApi = true,
}) {
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (!window.confirm('Restore the sample project? This removes every change made so far and cannot be undone.')) {
      return;
    }
    setIsResetting(true);
    try {
      await onResetDemo();
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <header
      style={{
        minHeight: 64,
        padding: '10px 24px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Title */}
      <div style={{ minWidth: 0 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{pageTitle}</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {projectName}
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        <span
          className="sl-chip"
          role="status"
          title={isLiveApi
            ? 'Connected to the server — changes you approve are saved.'
            : 'The server is not reachable, so you are seeing sample data. Changes will not be saved.'}
        >
          <span className="sl-dot" style={{ background: isLiveApi ? 'var(--accent-emerald)' : 'var(--accent-amber)' }} />
          {isLiveApi ? 'Connected' : 'Offline · sample data'}
        </span>

        <button type="button" className="sl-btn" onClick={onOpenAuditLog} data-tour="history-button" title="See every change that has been approved">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Change history
        </button>

        {onOpenAddModal && (
          <button type="button" className="sl-btn sl-btn-primary" onClick={onOpenAddModal} title="Add a new task or connect two tasks">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
            Add task or link
          </button>
        )}

        <button
          type="button"
          className="sl-btn"
          onClick={handleReset}
          disabled={isResetting}
          title="Go back to the original sample project"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"
            style={isResetting ? { animation: 'sl-spin 1s linear infinite' } : undefined}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.58m15.36 2A8 8 0 004.58 9m0 0H9m11 11v-5h-.58m0 0a8 8 0 01-15.36-2m15.36 2H15" />
          </svg>
          {isResetting ? 'Restoring…' : 'Restore sample data'}
        </button>

        <ThemeToggle />

        {onOpenHelp && (
          <button type="button" className="sl-btn sl-icon-btn" onClick={onOpenHelp} aria-label="Help: show me around" title="Show me around">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" d="M9.5 9a2.5 2.5 0 114 2c-.9.6-1.5 1.1-1.5 2.2M12 17h.01" />
            </svg>
          </button>
        )}
      </div>
    </header>
  );
}
