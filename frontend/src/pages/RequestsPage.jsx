// frontend/src/pages/RequestsPage.jsx
// Shared change requests: clients send them, the project manager or finance lead decides.
// Everyone sees the same list (it lives on the server), so a request made under one profile is
// visible to all others.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchChangeRequests, approveChangeRequest, rejectChangeRequest } from '../services/requestApi';
import { fetchProjectBoard } from '../services/boardApi';
import { useAuth } from '../auth/authContext';
import { can } from '../auth/permissions';
import { formatDaysDelta, formatHours, formatINRDelta } from '../content/format';
import ThemeToggle from '../components/common/ThemeToggle';
import HelpButton from '../components/common/HelpButton';
import DecisionBar from '../components/requests/DecisionBar';

const PROJECT_ID = 1;

const STATUS_STYLE = {
  PENDING: { label: 'Waiting for approval', color: 'var(--accent-amber)' },
  APPROVED: { label: 'Approved', color: 'var(--accent-emerald)' },
  REJECTED: { label: 'Rejected', color: 'var(--accent-coral)' },
};

const when = (iso) => (iso
  ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  : '');

function StatusChip({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.PENDING;
  return (
    <span className="sl-chip" style={{ color: s.color }}>
      <span className="sl-dot" style={{ background: s.color }} /> {s.label}
    </span>
  );
}

export default function RequestsPage({ onStartTour, onRequestsChanged, onProjectNameChange }) {
  const { user } = useAuth();
  const isApprover = can(user, 'approve');
  const [requests, setRequests] = useState([]);
  const [titles, setTitles] = useState({});
  const [state, setState] = useState({ loading: true, error: null });
  const [filter, setFilter] = useState('PENDING');
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    try {
      const [list, board] = await Promise.all([fetchChangeRequests(PROJECT_ID), fetchProjectBoard(PROJECT_ID)]);
      setRequests(Array.isArray(list) ? list : []);
      setTitles(Object.fromEntries((board?.tasks || []).map((t) => [t.id, t.title])));
      if (board?.name) onProjectNameChange?.(board.name);
      setState({ loading: false, error: null });
    } catch (err) {
      setState({ loading: false, error: err.message });
    }
  }, [onProjectNameChange]);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => ({
    PENDING: requests.filter((r) => r.status === 'PENDING').length,
    ALL: requests.length,
  }), [requests]);
  const shown = filter === 'PENDING' ? requests.filter((r) => r.status === 'PENDING') : requests;

  const decide = async (request, mode, note) => {
    try {
      if (mode === 'approve') await approveChangeRequest(PROJECT_ID, request.id, note);
      else await rejectChangeRequest(PROJECT_ID, request.id, note);
      setToast({ type: 'success', text: mode === 'approve' ? 'Approved. The plan and budget are updated.' : 'Request rejected.' });
      await load();
      onRequestsChanged?.();
      return true;
    } catch (err) {
      setToast({ type: 'error', text: err.message });
      await load(); // someone else may have decided it already
      return false;
    }
  };

  const intro = isApprover
    ? 'Changes people have asked for. Review the estimated cost, then approve or reject each one.'
    : can(user, 'request')
      ? 'Changes you and others have asked for, and what the approvers decided. Send a new one from the project board.'
      : 'Changes that have been asked for and what was decided.';

  return (
    <div className="sl-page" aria-busy={state.loading}>
      <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Change requests</h1>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 4, maxWidth: 640 }}>{intro}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ThemeToggle />
          <HelpButton onClick={onStartTour} />
        </div>
      </header>

      <div role="tablist" aria-label="Filter requests" data-tour="requests-list" style={{ display: 'flex', gap: 8, marginTop: 24 }}>
        {[['PENDING', 'Waiting for approval'], ['ALL', 'All requests']].map(([key, label]) => (
          <button key={key} type="button" role="tab" aria-selected={filter === key}
            className={`sl-btn ${filter === key ? 'sl-btn-primary' : ''}`} onClick={() => setFilter(key)}>
            {label} ({counts[key]})
          </button>
        ))}
      </div>

      {toast && (
        <p role={toast.type === 'error' ? 'alert' : 'status'} style={{ marginTop: 16, fontSize: 14, fontWeight: 600,
          color: toast.type === 'error' ? 'var(--accent-coral)' : 'var(--accent-emerald)' }}>
          {toast.text}
        </p>
      )}

      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {state.loading ? (
          <div className="skeleton" style={{ height: 120 }} />
        ) : state.error ? (
          <div className="sl-card" style={{ padding: 18, color: 'var(--accent-coral)' }}>
            Couldn’t load requests: {state.error}
          </div>
        ) : shown.length === 0 ? (
          <div className="sl-card" style={{ padding: 18, color: 'var(--text-muted)' }}>
            {filter === 'PENDING'
              ? (isApprover ? 'Nothing is waiting for your decision.' : 'No requests are waiting for approval.')
              : 'No change requests yet.'}
          </div>
        ) : (
          shown.map((r) => {
            const removed = (r.droppedOptionalTaskIds || []).map((id) => titles[id] || `Task #${id}`);
            const mine = user && r.requestedBy === user.name;
            return (
              <article key={r.id} className="sl-card" style={{ padding: '16px 18px', display: 'grid', gap: 10 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ minWidth: 0, flex: '1 1 320px' }}>
                    <strong style={{ display: 'block', fontSize: 16, color: 'var(--text-primary)' }}>{r.changeDescription}</strong>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {r.targetTaskTitle} · asked by {r.requestedBy}{mine ? ' (you)' : ''}, {r.requestedRole} · {when(r.requestedAt)}
                    </span>
                  </div>
                  <StatusChip status={r.status} />
                </div>

                <dl style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 28px', margin: 0, fontSize: 14 }}>
                  <div><dt style={{ color: 'var(--text-muted)', fontSize: 12 }}>Extra work</dt>
                    <dd style={{ margin: 0 }}>{formatHours(r.addedHours)} · {r.addedDays} day{r.addedDays === 1 ? '' : 's'}</dd></div>
                  <div><dt style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.status === 'APPROVED' ? 'Effect on budget' : 'Estimated effect on budget'}</dt>
                    <dd style={{ margin: 0, fontWeight: 700, color: Number(r.costDelta) > 0 ? 'var(--accent-coral)' : 'var(--accent-emerald)' }}>{formatINRDelta(r.costDelta)}</dd></div>
                  <div><dt style={{ color: 'var(--text-muted)', fontSize: 12 }}>Effect on timeline</dt>
                    <dd style={{ margin: 0 }}>{formatDaysDelta(r.daysDelta)}</dd></div>
                  {removed.length > 0 && (
                    <div><dt style={{ color: 'var(--text-muted)', fontSize: 12 }}>Extras removed</dt>
                      <dd style={{ margin: 0 }}>{removed.join(', ')}</dd></div>
                  )}
                </dl>

                {r.status !== 'PENDING' && (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                    {r.status === 'APPROVED' ? 'Approved' : 'Rejected'} by {r.decidedBy} ({r.decidedRole}) · {when(r.decidedAt)}
                    {r.decisionNote ? <> — “{r.decisionNote}”</> : null}
                  </p>
                )}
                {r.status === 'PENDING' && isApprover && <DecisionBar request={r} onDecide={decide} />}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
