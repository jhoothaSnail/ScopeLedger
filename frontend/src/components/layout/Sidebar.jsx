// frontend/src/components/layout/Sidebar.jsx
// Premium sidebar navigation — the application shell's identity anchor.
import React from 'react';

const NAV_ITEMS = [
  {
    key: 'board',
    label: 'Dependency Board',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <circle cx="4"  cy="10" r="2.5" />
        <circle cx="16" cy="5"  r="2.5" />
        <circle cx="16" cy="15" r="2.5" />
        <path d="M6.5 10 L13.5 5.5M6.5 10 L13.5 14.5" strokeLinecap="round"/>
      </svg>
    ),
    badge: null
  },
  {
    key: 'changeorders',
    label: 'Change Orders',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path d="M6 2h8l4 4v12a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 2v4h4M8 11h4M8 14h2" strokeLinecap="round"/>
      </svg>
    ),
    badge: 'Audit'
  },
];

export default function Sidebar({
  activePage = 'board',
  onNavigate,
  projectName,
  isCollapsed,
  onToggleCollapse
}) {
  return (
    <aside
      role="navigation"
      aria-label="Application navigation"
      className="relative flex flex-col h-screen bg-[#040509] border-r transition-all duration-200 ease-out shrink-0 z-30"
      style={{
        width: isCollapsed ? '64px' : '240px',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        transition: 'width 0.2s cubic-bezier(0.33, 1, 0.68, 1)'
      }}
    >
      {/* Brand Wordmark */}
      <div
        className="flex items-center gap-3 px-4 py-5 border-b overflow-hidden"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', minHeight: '64px' }}
      >
        {/* Logo mark */}
        <div
          className="shrink-0 flex items-center justify-center rounded-lg font-bold text-xs font-mono"
          style={{
            width: 32,
            height: 32,
            background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(20,184,166,0.1))',
            border: '1px solid rgba(6,182,212,0.3)',
            color: '#06b6d4',
            letterSpacing: '0.03em'
          }}
          aria-hidden="true"
        >
          SL
        </div>

        {!isCollapsed && (
          <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <div
              className="font-semibold text-sm tracking-tight"
              style={{ color: '#f1f5f9', letterSpacing: '-0.01em' }}
            >
              ScopeLedger
            </div>
            <div
              className="text-xs font-mono"
              style={{ color: '#64748b', fontSize: '10px' }}
            >
              DEV3 · Phase 1
            </div>
          </div>
        )}
      </div>

      {/* Project Context */}
      {!isCollapsed && projectName && (
        <div
          className="mx-3 mt-3 mb-1 px-3 py-2 rounded-lg"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)'
          }}
        >
          <div
            className="text-xs font-mono uppercase tracking-wider mb-0.5"
            style={{ color: '#475569', fontSize: '10px' }}
          >
            Active Project
          </div>
          <div
            className="text-xs font-medium truncate"
            style={{ color: '#94a3b8', fontSize: '11px' }}
            title={projectName}
          >
            {projectName}
          </div>
        </div>
      )}

      {/* Nav Divider Label */}
      {!isCollapsed && (
        <div
          className="px-4 mt-4 mb-1 text-xs uppercase tracking-widest font-semibold"
          style={{ color: '#475569', fontSize: '10px' }}
        >
          Navigation
        </div>
      )}

      {/* Nav Items */}
      <nav className="flex-1 px-2 mt-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = activePage === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate?.(item.key)}
              aria-current={isActive ? 'page' : undefined}
              title={isCollapsed ? item.label : undefined}
              className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-left transition-all duration-150"
              style={{
                background: isActive ? 'rgba(6,182,212,0.1)' : 'transparent',
                border: isActive ? '1px solid rgba(6,182,212,0.25)' : '1px solid transparent',
                color: isActive ? '#06b6d4' : '#64748b',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.color = '#94a3b8';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#64748b';
                }
              }}
            >
              {/* Icon */}
              <span
                className="shrink-0"
                style={{ width: 18, height: 18, opacity: isActive ? 1 : 0.7 }}
              >
                {item.icon}
              </span>

              {/* Label */}
              {!isCollapsed && (
                <span
                  className="flex-1 text-xs font-medium truncate"
                  style={{
                    fontSize: '12.5px',
                    letterSpacing: '-0.01em',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden'
                  }}
                >
                  {item.label}
                </span>
              )}

              {/* Badge */}
              {!isCollapsed && item.badge && (
                <span
                  className="shrink-0 text-xs font-mono px-1.5 py-0.5 rounded"
                  style={{
                    fontSize: '9px',
                    background: 'rgba(99,102,241,0.15)',
                    color: '#6366f1',
                    border: '1px solid rgba(99,102,241,0.25)',
                    letterSpacing: '0.03em'
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom: Profile & Collapse */}
      <div
        className="mt-auto px-2 pb-4 space-y-1"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '12px' }}
      >
        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg transition-all duration-150"
          style={{
            background: 'transparent',
            border: '1px solid transparent',
            color: '#475569',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
            e.currentTarget.style.color = '#94a3b8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#475569';
          }}
        >
          <span className="shrink-0" style={{ width: 18, height: 18 }}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              {isCollapsed
                ? <path d="M7 4l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/>
                : <path d="M13 4l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round"/>
              }
            </svg>
          </span>
          {!isCollapsed && (
            <span className="text-xs" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
              Collapse sidebar
            </span>
          )}
        </button>

        {/* User Profile stub */}
        <div
          className="flex items-center gap-3 px-2.5 py-2.5 rounded-lg"
          style={{ cursor: 'default' }}
        >
          <div
            className="shrink-0 flex items-center justify-center rounded-full text-xs font-bold font-mono"
            style={{
              width: 28,
              height: 28,
              background: 'rgba(99,102,241,0.2)',
              border: '1px solid rgba(99,102,241,0.3)',
              color: '#6366f1',
              fontSize: '10px'
            }}
            aria-hidden="true"
          >
            D3
          </div>
          {!isCollapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div
                className="text-xs font-medium truncate"
                style={{ color: '#94a3b8', fontSize: '12px' }}
              >
                DEV3 Engineer
              </div>
              <div
                className="text-xs font-mono"
                style={{ color: '#475569', fontSize: '10px' }}
              >
                Frontend Lead
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

