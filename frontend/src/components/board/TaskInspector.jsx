// frontend/src/components/board/TaskInspector.jsx
// Right-side inspector panel: task details, dependency context, impact summary, CTA.
import React from 'react';

function ImpactTypeBadge({ type }) {
  if (type === 'DIRECT_CHANGE') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '2px 8px', borderRadius: 4,
        fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.06em',
        background: 'rgba(244,63,94,0.12)',
        border: '1px solid rgba(244,63,94,0.3)',
        color: '#f43f5e'
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: '#f43f5e',
          display: 'inline-block',
          animation: 'ping 1.2s cubic-bezier(0,0,0.2,1) infinite'
        }} />
        Direct Change
      </span>
    );
  }
  if (type === 'DOWNSTREAM_REWORK') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '2px 8px', borderRadius: 4,
        fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.06em',
        background: 'rgba(245,158,11,0.12)',
        border: '1px solid rgba(245,158,11,0.3)',
        color: '#f59e0b'
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: '#f59e0b',
          display: 'inline-block',
          animation: 'ping 1.2s cubic-bezier(0,0,0.2,1) infinite'
        }} />
        Rework Domino
      </span>
    );
  }
  return null;
}

function StatusPill({ status }) {
  const map = {
    COMPLETED: { label: 'Completed', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', color: '#10b981' },
    IN_PROGRESS: { label: 'In Progress', bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.25)', color: '#06b6d4' },
    NOT_STARTED: { label: 'Not Started', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.25)', color: '#64748b' },
  };
  const s = map[status] || map.NOT_STARTED;
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 4,
      fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.06em',
      background: s.bg, border: `1px solid ${s.border}`, color: s.color
    }}>
      {s.label}
    </span>
  );
}

function TaskPill({ task }) {
  if (!task) return <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '5px 10px', borderRadius: 6,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
    }}>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 10,
        color: 'var(--text-faint)', fontWeight: 600,
        minWidth: 28, flexShrink: 0
      }}>
        #{task.id}
      </span>
      <span style={{
        fontSize: 12, color: 'var(--text-secondary)',
        fontWeight: 500, flex: 1,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
      }}>
        {task.title}
      </span>
      <StatusPill status={task.status} />
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.08em',
      color: 'var(--text-faint)',
      marginBottom: 6
    }}>
      {children}
    </div>
  );
}

function MetricRow({ label, value, valueStyle }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 6 }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>{label}</span>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)', ...valueStyle }}>
        {value}
      </span>
    </div>
  );
}

export default function TaskInspector({
  task,
  allTasks = [],
  dependencies = [],
  impactData,
  isDropped,
  onOpenSimulation,
  onClose
}) {
  if (!task) return null;

  // Determine prerequisite tasks (tasks that THIS task depends on)
  const prereqIds = dependencies
    .filter(d => d.dependentTaskId === task.id)
    .map(d => d.prerequisiteTaskId);
  const prereqTasks = allTasks.filter(t => prereqIds.includes(t.id));

  // Determine downstream dependents (tasks that depend on THIS task)
  const downstreamIds = dependencies
    .filter(d => d.prerequisiteTaskId === task.id)
    .map(d => d.dependentTaskId);
  const downstreamTasks = allTasks.filter(t => downstreamIds.includes(t.id));

  const totalCost = Number(task.estimatedHours) * Number(task.hourlyRate);

  return (
    <>
      {/* Panel backdrop (subtle) */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          zIndex: 29,
          background: 'transparent',
          cursor: 'default',
          pointerEvents: 'none'
        }}
      />

      {/* Inspector Panel */}
      <aside
        aria-label="Task inspector"
        role="complementary"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: 320,
          zIndex: 30,
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* Panel Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px 12px',
          borderBottom: '1px solid var(--border-subtle)',
          position: 'sticky', top: 0,
          background: 'var(--bg-surface)',
          zIndex: 1
        }}>
          <div>
            <div style={{
              fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              color: 'var(--accent-cyan)', marginBottom: 2
            }}>
              Task Inspector
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: 'var(--text-faint)'
            }}>
              ID #{task.id}
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close inspector"
            style={{
              width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 6,
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 14, fontFamily: 'var(--font-sans)',
              transition: 'background 0.15s, color 0.15s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            ✕
          </button>
        </div>

        {/* Panel Body */}
        <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Task Title & Status */}
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              marginBottom: 8, flexWrap: 'wrap'
            }}>
              <StatusPill status={task.status} />
              {task.isOptional && (
                <span style={{
                  padding: '2px 8px', borderRadius: 4,
                  fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  background: 'rgba(139,92,246,0.1)',
                  border: '1px solid rgba(139,92,246,0.25)',
                  color: '#8b5cf6'
                }}>
                  Optional
                </span>
              )}
              {isDropped && (
                <span style={{
                  padding: '2px 8px', borderRadius: 4,
                  fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.25)',
                  color: '#10b981'
                }}>
                  Proposed Drop
                </span>
              )}
            </div>
            <h2 style={{
              fontSize: 14, fontWeight: 700,
              color: isDropped ? 'var(--text-muted)' : 'var(--text-primary)',
              lineHeight: 1.4, margin: 0,
              textDecoration: isDropped ? 'line-through' : 'none',
              fontFamily: 'var(--font-sans)'
            }}>
              {task.title}
            </h2>
          </div>

          {/* Impact Alert */}
          {impactData && !isDropped && (
            <div style={{
              padding: '10px 12px',
              borderRadius: 8,
              background: impactData.impactType === 'DIRECT_CHANGE'
                ? 'rgba(244,63,94,0.07)'
                : 'rgba(245,158,11,0.07)',
              border: `1px solid ${impactData.impactType === 'DIRECT_CHANGE'
                ? 'rgba(244,63,94,0.25)'
                : 'rgba(245,158,11,0.25)'}`,
            }}>
              <div style={{ marginBottom: 6 }}>
                <ImpactTypeBadge type={impactData.impactType} />
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>
                    Extra Hours
                  </div>
                  <div style={{
                    fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 700,
                    color: impactData.impactType === 'DIRECT_CHANGE' ? '#f43f5e' : '#f59e0b'
                  }}>
                    +{impactData.extraHours}h
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>
                    Extra Cost
                  </div>
                  <div style={{
                    fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 700,
                    color: impactData.impactType === 'DIRECT_CHANGE' ? '#f43f5e' : '#f59e0b'
                  }}>
                    +₹{Number(impactData.extraCost).toLocaleString('en-IN')}
                  </div>
                </div>
                {impactData.delayDays > 0 && (
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>
                      Delay
                    </div>
                    <div style={{
                      fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 700,
                      color: '#f59e0b'
                    }}>
                      +{impactData.delayDays}d
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Task Metrics */}
          <div>
            <SectionLabel>Task Metrics</SectionLabel>
            <div style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8, padding: '10px 12px'
            }}>
              <MetricRow label="Estimated Hours" value={`${task.estimatedHours}h`} />
              <MetricRow label="Hourly Rate" value={`₹${Number(task.hourlyRate).toLocaleString('en-IN')}`} />
              <MetricRow label="Duration" value={`${task.durationDays} days`} />
              <MetricRow
                label="Total Cost"
                value={`₹${Number(totalCost).toLocaleString('en-IN')}`}
                valueStyle={{ color: 'var(--accent-cyan)' }}
              />
            </div>
          </div>

          {/* Prerequisite Tasks */}
          <div>
            <SectionLabel>Prerequisites ({prereqTasks.length})</SectionLabel>
            {prereqTasks.length === 0 ? (
              <p style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'var(--font-sans)', margin: 0 }}>
                No upstream dependencies — this task can start independently.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {prereqTasks.map(t => <TaskPill key={t.id} task={t} />)}
              </div>
            )}
          </div>

          {/* Downstream Dependents */}
          <div>
            <SectionLabel>Downstream Dependents ({downstreamTasks.length})</SectionLabel>
            {downstreamTasks.length === 0 ? (
              <p style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'var(--font-sans)', margin: 0 }}>
                No downstream tasks depend on this task.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {downstreamTasks.map(t => <TaskPill key={t.id} task={t} />)}
              </div>
            )}
          </div>

          {/* Ripple Risk Callout */}
          {downstreamTasks.length > 0 && (
            <div style={{
              padding: '10px 12px', borderRadius: 8,
              background: 'rgba(245,158,11,0.05)',
              border: '1px solid rgba(245,158,11,0.15)'
            }}>
              <div style={{
                fontSize: 11, color: '#f59e0b', fontWeight: 600,
                fontFamily: 'var(--font-sans)', marginBottom: 4
              }}>
                ⚠ Ripple Risk
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>
                Scope changes to this task will trigger rework analysis across {downstreamTasks.length} downstream
                {downstreamTasks.length === 1 ? ' task' : ' tasks'}.
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer CTA */}
        <div style={{
          padding: '14px 16px',
          borderTop: '1px solid var(--border-subtle)',
          position: 'sticky', bottom: 0,
          background: 'var(--bg-surface)',
        }}>
          <button
            onClick={onOpenSimulation}
            aria-label={`Propose scope change for ${task.title}`}
            disabled={isDropped}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: 8,
              background: isDropped
                ? 'rgba(100,116,139,0.08)'
                : 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(20,184,166,0.1))',
              border: `1px solid ${isDropped ? 'rgba(100,116,139,0.2)' : 'rgba(6,182,212,0.4)'}`,
              color: isDropped ? 'var(--text-faint)' : 'var(--accent-cyan)',
              fontFamily: 'var(--font-sans)',
              fontSize: 13, fontWeight: 600,
              cursor: isDropped ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.15s, border-color 0.15s, transform 0.1s',
              letterSpacing: '-0.01em'
            }}
            onMouseEnter={e => {
              if (!isDropped) {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(6,182,212,0.22), rgba(20,184,166,0.16))';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={e => {
              if (!isDropped) {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(20,184,166,0.1))';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75}
              style={{ width: 14, height: 14, flexShrink: 0 }} aria-hidden="true">
              <path d="M8 1v14M1 8l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Propose Scope Change
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75}
              style={{ width: 12, height: 12, flexShrink: 0 }} aria-hidden="true">
              <path d="M4 8h8M9 5l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </aside>
    </>
  );
}

