// frontend/src/pages/OverviewPage.jsx
// Home after sign-in: project health in plain words, recent approved changes, quick actions.
import React, { useEffect, useMemo, useState } from 'react';
import { fetchChangeOrders, fetchProjectBoard, isUsingFallback } from '../services/boardApi';
import { formatDays, formatINR, formatINRDelta, formatDaysDelta } from '../content/format';
import { METRICS } from '../content/glossary';
import InfoTip from '../components/common/InfoTip';
import ThemeToggle from '../components/common/ThemeToggle';

const PROJECT_ID = 1;

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

/** Turns an "after vs original" difference into a tone + sentence. */
function healthOf(delta, format, unitWord) {
  if (delta > 0) return { tone: 'var(--accent-coral)', text: `${format(delta)} more than first agreed` };
  if (delta < 0) return { tone: 'var(--accent-emerald)', text: `${format(-delta)} less than first agreed` };
  return { tone: 'var(--accent-emerald)', text: `On the original ${unitWord}` };
}

function StatCard({ label, help, value, note, noteTone, children, tour }) {
  return (
    <div className="sl-card sl-stat-card" data-tour={tour}>
      <span className="sl-stat-label">
        {label}
        {help && <InfoTip text={help} label={`What is “${label}”?`} />}
      </span>
      <span className="sl-stat-value">{value}</span>
      {children}
      {note && <span className="sl-stat-note" style={{ color: noteTone || 'var(--text-muted)' }}>{note}</span>}
    </div>
  );
}

function ActionCard({ icon, title, text, onClick, tour }) {
  return (
    <button type="button" className="sl-card sl-action-card" onClick={onClick} data-tour={tour}>
      <span className="sl-action-icon" aria-hidden="true">{icon}</span>
      <span>
        <strong style={{ display: 'block', fontSize: 15, color: 'var(--text-primary)', marginBottom: 2 }}>{title}</strong>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{text}</span>
      </span>
    </button>
  );
}

export default function OverviewPage({ user, onNavigate, onProjectNameChange, onStartTour }) {
  const [board, setBoard] = useState(null);
  const [changes, setChanges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [b, logs] = await Promise.all([fetchProjectBoard(PROJECT_ID), fetchChangeOrders(PROJECT_ID)]);
        if (cancelled) return;
        setBoard(b);
        setChanges(Array.isArray(logs) ? logs : []);
        setIsOffline(isUsingFallback());
        if (b?.name) onProjectNameChange?.(b.name);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [onProjectNameChange]);

  const stats = useMemo(() => {
    if (!board) return null;
    const tasks = board.tasks || [];
    const active = tasks.filter((t) => t.isActive !== false);
    const done = active.filter((t) => t.status === 'COMPLETED').length;
    const inProgress = active.filter((t) => t.status === 'IN_PROGRESS');
    const extras = active.filter((t) => t.isOptional && t.status === 'NOT_STARTED');
    const costDelta = changes.reduce((s, c) => s + (Number(c.netCostDelta) || 0), 0);
    const daysDelta = changes.reduce((s, c) => s + (Number(c.netDaysDelta) || 0), 0);
    return {
      total: active.length,
      done,
      inProgress,
      extras,
      extrasSaving: extras.reduce((s, t) => s + t.estimatedHours * t.hourlyRate, 0),
      budget: Number(board.baselineBudget),
      days: Number(board.baselineDurationDays),
      budgetHealth: healthOf(costDelta, formatINR, 'budget'),
      timeHealth: healthOf(daysDelta, formatDays, 'timeline'),
      recent: [...changes].sort((a, b) => new Date(b.committedAt) - new Date(a.committedAt)).slice(0, 3),
    };
  }, [board, changes]);

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="sl-page" aria-busy={isLoading}>
      {/* Header */}
      <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>{greeting()}, {firstName}</h1>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 4 }}>
            Here’s where <strong style={{ color: 'var(--text-primary)' }}>{board?.name || 'your project'}</strong> stands today.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isOffline && (
            <span className="sl-chip" title="The server is not reachable, so you are seeing sample data.">
              <span className="sl-dot" style={{ background: 'var(--accent-amber)' }} /> Offline · sample data
            </span>
          )}
          <ThemeToggle />
        </div>
      </header>

      {/* Health */}
      <h2 className="sl-section-title">Project health</h2>
      {isLoading || !stats ? (
        <div className="sl-grid">{[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 132 }} />)}</div>
      ) : (
        <div className="sl-grid" data-tour="overview-health">
          <StatCard label={METRICS.agreedBudget.label} help={METRICS.agreedBudget.help} value={formatINR(stats.budget)}
            note={stats.budgetHealth.text} noteTone={stats.budgetHealth.tone} />
          <StatCard label={METRICS.agreedTimeline.label} help={METRICS.agreedTimeline.help} value={formatDays(stats.days)}
            note={stats.timeHealth.text} noteTone={stats.timeHealth.tone} />
          <StatCard label={METRICS.progress.label} help={METRICS.progress.help} value={`${stats.done} of ${stats.total} done`}
            note={stats.inProgress.length ? `Now working on: ${stats.inProgress.map((t) => t.title).join(', ')}` : 'Nothing in progress right now'}>
            <div className="sl-bar" role="progressbar" aria-valuenow={stats.total ? Math.round((stats.done / stats.total) * 100) : 0}
              aria-valuemin={0} aria-valuemax={100} aria-label={`${stats.done} of ${stats.total} tasks done`}>
              <div style={{ width: `${stats.total ? (stats.done / stats.total) * 100 : 0}%`, background: 'var(--accent-emerald)' }} />
              <div style={{ width: `${stats.total ? (stats.inProgress.length / stats.total) * 100 : 0}%`, background: 'var(--accent-cyan)' }} />
            </div>
          </StatCard>
          <StatCard label="Room to save" help="Optional extras that haven’t started yet. Removing them is how you balance the cost of a change."
            value={stats.extras.length ? `Up to ${formatINR(stats.extrasSaving)}` : 'None left'}
            note={stats.extras.length
              ? `${stats.extras.length} optional extra${stats.extras.length > 1 ? 's' : ''} could be removed if a change runs over budget.`
              : 'All optional extras are already started or removed.'} />
        </div>
      )}

      {/* Quick actions */}
      <h2 className="sl-section-title">What would you like to do?</h2>
      <div className="sl-grid">
        <ActionCard tour="overview-explore" onClick={() => onNavigate?.('board')} title="Explore a change"
          text="Pick a task, describe the change, and see its cost before agreeing to it."
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><circle cx="5" cy="12" r="2.5" /><circle cx="19" cy="6" r="2.5" /><circle cx="19" cy="18" r="2.5" /><path d="M7.5 12l9-5M7.5 12l9 5" strokeLinecap="round" /></svg>} />
        <ActionCard onClick={() => onNavigate?.('changeorders')} title="Review approved changes"
          text="See every change that was agreed, what it cost and what was removed."
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        {onStartTour && (
          <ActionCard onClick={onStartTour} title="Show me around"
            text="A two-minute guided tour of how ScopeLedger works."
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M9.5 9a2.5 2.5 0 114 2c-.9.6-1.5 1.1-1.5 2.2M12 17h.01" /></svg>} />
        )}
      </div>

      {/* Recent changes */}
      <h2 className="sl-section-title">Recently approved changes</h2>
      <div className="sl-card" style={{ padding: 4 }}>
        {isLoading ? (
          <div className="skeleton" style={{ height: 80, margin: 12 }} />
        ) : !stats?.recent.length ? (
          <p style={{ padding: '18px 16px', color: 'var(--text-muted)' }}>
            No changes approved yet. When a change is approved, it will appear here with its cost.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {stats.recent.map((c, i) => (
              <li key={c.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', alignItems: 'center', padding: '12px 16px',
                borderTop: i ? '1px solid var(--border-subtle)' : 'none' }}>
                <span style={{ flex: '1 1 240px', minWidth: 0 }}>
                  <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{c.changeDescription}</strong>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {c.targetTaskTitle || `Task #${c.targetTaskId}`} · {c.committedAt ? new Date(c.committedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                  </span>
                </span>
                <span style={{ fontWeight: 700, color: Number(c.netCostDelta) > 0 ? 'var(--accent-coral)' : 'var(--accent-emerald)' }}>
                  {formatINRDelta(c.netCostDelta)}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 80, textAlign: 'right' }}>{formatDaysDelta(c.netDaysDelta)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* How it works */}
      <h2 className="sl-section-title">How ScopeLedger works</h2>
      <ol className="sl-grid" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {[
          ['Pick a task', 'Open the project board and click the task the client wants to change.'],
          ['See the ripple', 'Enter the extra hours and days. Tasks that depend on it light up, and you see the full cost.'],
          ['Balance and approve', 'Remove optional extras to win back money or time, then approve the change. It’s saved to the history.'],
        ].map(([title, text], i) => (
          <li key={title} className="sl-card" style={{ padding: '16px 18px', display: 'flex', gap: 12 }}>
            <span className="sl-avatar" aria-hidden="true" style={{ width: 30, height: 30, background: 'var(--accent-solid)' }}>{i + 1}</span>
            <span>
              <strong style={{ display: 'block', color: 'var(--text-primary)', marginBottom: 2 }}>{title}</strong>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{text}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
