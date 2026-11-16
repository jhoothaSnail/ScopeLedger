// frontend/src/components/board/AddTaskDependencyModal.jsx
// Project Manager only. "Add a task" asks the two planning questions that matter for the ripple
// simulation — what must be finished first, and which existing tasks will wait for the new one —
// and sends the links with the task so the server saves them together (or not at all).
// "Link two tasks" connects existing tasks. Loops are flagged here and rejected again by the server.
import React, { useMemo, useState } from 'react';
import { statusLabel } from '../../content/glossary';
import { formatINR } from '../../content/format';

const CARD_W = 260;
const CARD_H = 170;
const GAP_X = 340;
const GAP_Y = 190;

/** taskId -> Set of every task that (directly or indirectly) waits for it. */
function buildDescendants(dependencies) {
  const next = new Map();
  for (const d of dependencies) {
    if (!next.has(d.prerequisiteTaskId)) next.set(d.prerequisiteTaskId, []);
    next.get(d.prerequisiteTaskId).push(d.dependentTaskId);
  }
  const memo = new Map();
  const walk = (id) => {
    if (memo.has(id)) return memo.get(id);
    const seen = new Set();
    const stack = [...(next.get(id) || [])];
    while (stack.length) {
      const n = stack.pop();
      if (seen.has(n)) continue;
      seen.add(n);
      stack.push(...(next.get(n) || []));
    }
    memo.set(id, seen);
    return seen;
  };
  return walk;
}

/** Places the new card right of its prerequisites (or left of what needs it) without overlapping. */
function suggestPosition(tasks, dependsOn, neededBy) {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const pre = dependsOn.map((id) => byId.get(id)).filter(Boolean);
  const post = neededBy.map((id) => byId.get(id)).filter(Boolean);
  const avgY = (list) => list.reduce((sum, t) => sum + (t.posY || 0), 0) / list.length;
  let x;
  let y;
  if (pre.length) {
    x = Math.max(...pre.map((t) => t.posX || 0)) + GAP_X;
    y = avgY(pre);
  } else if (post.length) {
    x = Math.max(0, Math.min(...post.map((t) => t.posX || 0)) - GAP_X);
    y = avgY(post);
  } else {
    x = 100;
    y = tasks.length ? Math.max(...tasks.map((t) => t.posY || 0)) + GAP_Y : 180;
  }
  const overlaps = (px, py) => tasks.some((t) => Math.abs((t.posX || 0) - px) < CARD_W + 20 && Math.abs((t.posY || 0) - py) < CARD_H);
  let guard = 0;
  while (overlaps(x, y) && guard++ < 50) y += GAP_Y;
  return { posX: Math.round(x), posY: Math.round(Math.max(0, y)) };
}

function TaskChecklist({ legend, help, tasks, selected, onToggle, disabledReason }) {
  return (
    <fieldset style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '10px 12px', margin: 0 }}>
      <legend style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', padding: '0 4px' }}>{legend}</legend>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 8px' }}>{help}</p>
      {tasks.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--text-faint)', margin: 0 }}>No tasks to choose from yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: 4, maxHeight: 150, overflowY: 'auto', paddingRight: 4 }}>
          {tasks.map((t) => {
            const reason = disabledReason(t);
            const checked = selected.includes(t.id);
            return (
              <label key={t.id} title={reason || undefined}
                style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '4px 6px', borderRadius: 6,
                  cursor: reason ? 'not-allowed' : 'pointer', opacity: reason ? 0.55 : 1,
                  background: checked ? 'var(--bg-surface-hover)' : 'transparent', color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={checked} disabled={Boolean(reason)} onChange={() => onToggle(t.id)} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ color: 'var(--text-primary)' }}>{t.title}</span>
                  <span style={{ color: 'var(--text-faint)' }}> · {statusLabel(t.status)}{t.isOptional ? ' · optional' : ''}</span>
                  {reason && <span style={{ display: 'block', fontSize: 11, color: 'var(--accent-amber)' }}>{reason}</span>}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}

export default function AddTaskDependencyModal({
  tasks = [],
  dependencies = [],
  isOpen,
  onClose,
  onCreateTask,
  onCreateDependency
}) {
  const [tab, setTab] = useState('task'); // 'task' | 'link'

  // New task
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('NOT_STARTED');
  const [estimatedHours, setEstimatedHours] = useState('16');
  const [hourlyRate, setHourlyRate] = useState('1000');
  const [durationDays, setDurationDays] = useState('2');
  const [isOptional, setIsOptional] = useState(false);
  const [dependsOn, setDependsOn] = useState([]);
  const [neededBy, setNeededBy] = useState([]);

  // Link two existing tasks
  const [prereqId, setPrereqId] = useState('');
  const [dependentId, setDependentId] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeTasks = useMemo(() => tasks.filter((t) => t.isActive !== false), [tasks]);
  const descendantsOf = useMemo(() => buildDescendants(dependencies), [dependencies]);

  if (!isOpen) return null;

  const reset = () => {
    setTitle(''); setStatus('NOT_STARTED'); setEstimatedHours('16'); setHourlyRate('1000'); setDurationDays('2');
    setIsOptional(false); setDependsOn([]); setNeededBy([]); setPrereqId(''); setDependentId(''); setErrorMsg('');
  };
  const close = () => { reset(); onClose(); };
  const toggle = (setter) => (id) => setter((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  // New task sits between "dependsOn" (before it) and "neededBy" (after it): a task cannot be in
  // both, and a task that already comes after a chosen prerequisite cannot also come before it.
  const prerequisiteBlocked = (t) => {
    if (neededBy.includes(t.id)) return 'Already chosen as a task that needs this one.';
    if (neededBy.some((n) => descendantsOf(n).has(t.id))) return 'Comes after a task you said needs this one — that would be a loop.';
    return null;
  };
  const dependentBlocked = (t) => {
    if (dependsOn.includes(t.id)) return 'Already chosen as a task that must finish first.';
    if (t.status === 'COMPLETED') return 'Already done, so it can’t wait for a new task.';
    if (dependsOn.some((p) => descendantsOf(t.id).has(p))) return 'Comes before a task you picked above — that would be a loop.';
    return null;
  };

  const numbers = { hours: Number(estimatedHours), rate: Number(hourlyRate), days: Number(durationDays) };
  const cost = numbers.hours > 0 && numbers.rate > 0 ? numbers.hours * numbers.rate : null;

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return setErrorMsg('Please give the task a name.');
    if (!(numbers.hours > 0)) return setErrorMsg('Hours of work must be more than 0.');
    if (!(numbers.rate > 0)) return setErrorMsg('Rate per hour must be more than 0.');
    if (!Number.isInteger(numbers.days) || numbers.days < 1) return setErrorMsg('Days needed must be a whole number, at least 1.');
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await onCreateTask({
        title: title.trim(),
        status,
        estimatedHours: numbers.hours,
        hourlyRate: numbers.rate,
        durationDays: numbers.days,
        isOptional,
        dependsOnTaskIds: dependsOn,
        neededByTaskIds: neededBy,
        ...suggestPosition(tasks, dependsOn, neededBy),
      });
      close();
    } catch (err) {
      setErrorMsg(err.message || 'Could not add the task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinkSubmit = async (e) => {
    e.preventDefault();
    if (!prereqId || !dependentId) return setErrorMsg('Choose both tasks.');
    if (prereqId === dependentId) return setErrorMsg('A task can’t wait for itself.');
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await onCreateDependency({ prerequisiteTaskId: Number(prereqId), dependentTaskId: Number(dependentId) });
      close();
    } catch (err) {
      setErrorMsg(err.message || 'These tasks could not be linked.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabBtn = (key, label) => (
    <button type="button" role="tab" aria-selected={tab === key}
      onClick={() => { setTab(key); setErrorMsg(''); }}
      className={`sl-btn ${tab === key ? 'sl-btn-primary' : 'sl-btn-ghost'}`}>
      {label}
    </button>
  );
  const field = { display: 'grid', gap: 4 };

  return (
    <div className="modal-backdrop" onKeyDown={(e) => e.key === 'Escape' && close()}>
      <div role="dialog" aria-modal="true" aria-label="Add to the plan"
        style={{ width: '100%', maxWidth: 560, maxHeight: '92vh', display: 'flex', flexDirection: 'column',
          background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)', color: 'var(--text-primary)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div role="tablist" aria-label="What to add" style={{ display: 'flex', gap: 8 }}>
            {tabBtn('task', 'Add a task')}
            {tabBtn('link', 'Link two tasks')}
          </div>
          <button type="button" className="sl-btn sl-btn-ghost sl-icon-btn" aria-label="Close" onClick={close}>×</button>
        </div>

        <div style={{ overflowY: 'auto', padding: '14px 18px 18px' }}>
          {errorMsg && (
            <p role="alert" style={{ margin: '0 0 12px', padding: '8px 10px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              color: 'var(--accent-coral)', background: 'color-mix(in srgb, var(--accent-coral) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--accent-coral) 30%, transparent)' }}>
              {errorMsg}
            </p>
          )}

          {tab === 'task' ? (
            <form noValidate onSubmit={handleTaskSubmit} style={{ display: 'grid', gap: 12 }}>
              <div style={field}>
                <label className="sl-label" htmlFor="new-title">Task name</label>
                <input id="new-title" className="sl-input" maxLength={200} value={title} autoFocus
                  onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Fraud Check Service" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
                <div style={field}>
                  <label className="sl-label" htmlFor="new-hours">Hours of work</label>
                  <input id="new-hours" className="sl-input" type="number" min="0.5" step="0.5" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} />
                </div>
                <div style={field}>
                  <label className="sl-label" htmlFor="new-rate">Rate per hour (₹)</label>
                  <input id="new-rate" className="sl-input" type="number" min="1" step="any" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
                </div>
                <div style={field}>
                  <label className="sl-label" htmlFor="new-days">Days needed</label>
                  <input id="new-days" className="sl-input" type="number" min="1" step="1" value={durationDays} onChange={(e) => setDurationDays(e.target.value)} />
                </div>
                <div style={field}>
                  <label className="sl-label" htmlFor="new-status">Progress</label>
                  <select id="new-status" className="sl-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="NOT_STARTED">Not started</option>
                    <option value="IN_PROGRESS">In progress</option>
                    <option value="COMPLETED">Done</option>
                  </select>
                </div>
              </div>
              {cost != null && (
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                  Cost: {numbers.hours} h × {formatINR(numbers.rate)}/h = <strong style={{ color: 'var(--text-primary)' }}>{formatINR(cost)}</strong>
                </p>
              )}

              <TaskChecklist
                legend="1. Which tasks must be finished before this one can start?"
                help="Tick the tasks this one depends on. Leave empty if it can start right away."
                tasks={activeTasks}
                selected={dependsOn}
                onToggle={toggle(setDependsOn)}
                disabledReason={prerequisiteBlocked}
              />
              <TaskChecklist
                legend="2. Will any existing task need this one before it can be finished?"
                help="Tick deliverables that will wait for this task. If this task changes later, those tasks may need rework."
                tasks={activeTasks}
                selected={neededBy}
                onToggle={toggle(setNeededBy)}
                disabledReason={dependentBlocked}
              />

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" checked={isOptional} onChange={(e) => setIsOptional(e.target.checked)} style={{ marginTop: 3 }} />
                <span>
                  <strong style={{ color: 'var(--text-primary)' }}>Optional extra</strong> — a nice-to-have that can be dropped to balance the budget when a change costs more.
                  {isOptional && neededBy.length > 0 && (
                    <span style={{ display: 'block', color: 'var(--accent-amber)', fontSize: 12, marginTop: 2 }}>
                      Other tasks need this one, so it won’t be offered as something to drop until they no longer do.
                    </span>
                  )}
                </span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
                <button type="button" className="sl-btn" onClick={close}>Cancel</button>
                <button type="submit" className="sl-btn sl-btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding…' : 'Add task'}
                </button>
              </div>
            </form>
          ) : (
            <form noValidate onSubmit={handleLinkSubmit} style={{ display: 'grid', gap: 12 }}>
              <div style={field}>
                <label className="sl-label" htmlFor="link-first">This task must be finished first…</label>
                <select id="link-first" className="sl-input" value={prereqId} onChange={(e) => setPrereqId(e.target.value)}>
                  <option value="">Choose a task…</option>
                  {activeTasks.map((t) => <option key={t.id} value={t.id}>{t.title} ({statusLabel(t.status)})</option>)}
                </select>
              </div>
              <div style={field}>
                <label className="sl-label" htmlFor="link-then">…before this task can be finished</label>
                <select id="link-then" className="sl-input" value={dependentId} onChange={(e) => setDependentId(e.target.value)}>
                  <option value="">Choose a task…</option>
                  {activeTasks.map((t) => <option key={t.id} value={t.id}>{t.title} ({statusLabel(t.status)})</option>)}
                </select>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                Links that would make tasks wait for each other in a loop are refused.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
                <button type="button" className="sl-btn" onClick={close}>Cancel</button>
                <button type="submit" className="sl-btn sl-btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Linking…' : 'Link tasks'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
