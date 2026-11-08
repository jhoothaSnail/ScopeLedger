// frontend/src/components/layout/MetricsBanner.jsx
import React from 'react';

function KpiBlock({ label, value, delta, deltaPositiveIsGood = false }) {
  const isNeutral = delta === 0 || delta == null;
  const isBad = delta > 0 && !deltaPositiveIsGood;
  const isGood = delta < 0 || (delta > 0 && deltaPositiveIsGood);

  const badgeStyle = isNeutral ? null : {
    display: 'inline-flex', alignItems: 'center',
    padding: '1px 7px', borderRadius: 4,
    fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700,
    background: isBad
      ? 'rgba(244,63,94,0.12)'
      : 'rgba(16,185,129,0.12)',
    border: isBad
      ? '1px solid rgba(244,63,94,0.3)'
      : '1px solid rgba(16,185,129,0.3)',
    color: isBad ? '#f43f5e' : '#10b981',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.07em',
          color: 'var(--text-faint)'
        }}>
          {label}
        </span>
        {!isNeutral && badgeStyle && (
          <span style={badgeStyle}>
            {delta > 0 ? '+' : ''}{delta}
          </span>
        )}
      </div>
      <span style={{
        fontSize: 15, fontFamily: 'var(--font-mono)', fontWeight: 700,
        letterSpacing: '-0.02em',
        color: isNeutral
          ? 'var(--text-primary)'
          : isBad ? '#f43f5e' : isGood ? '#10b981' : 'var(--text-primary)',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return (
    <div style={{
      width: 1, height: 32,
      background: 'rgba(255,255,255,0.08)',
      flexShrink: 0
    }} />
  );
}

function TaskProgressBar({ tasks = [] }) {
  const total = tasks.length;
  if (total === 0) return null;

  const completed  = tasks.filter(t => t.status === 'COMPLETED').length;
  const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const notStarted = total - completed - inProgress;

  const pctComplete   = Math.round((completed  / total) * 100);
  const pctInProgress = Math.round((inProgress / total) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.07em',
          color: 'var(--text-faint)'
        }}>
          Task Progress
        </span>
        <span style={{
          fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700,
          color: '#10b981'
        }}>
          {pctComplete}%
        </span>
      </div>

      {/* Segmented bar */}
      <div
        style={{
          height: 5, borderRadius: 3,
          background: 'rgba(255,255,255,0.07)',
          overflow: 'hidden',
          display: 'flex',
        }}
        role="progressbar"
        aria-valuenow={pctComplete}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${pctComplete}% of tasks completed`}
      >
        <div style={{
          width: `${pctComplete}%`,
          background: '#10b981',
          transition: 'width 0.5s ease',
          borderRadius: completed === total ? 3 : '3px 0 0 3px',
          flexShrink: 0,
        }} />
        <div style={{
          width: `${pctInProgress}%`,
          background: '#06b6d4',
          transition: 'width 0.5s ease',
          flexShrink: 0,
        }} />
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 10 }}>
        {[
          { color: '#10b981', label: `${completed} done`      },
          { color: '#06b6d4', label: `${inProgress} active`   },
          { color: 'rgba(255,255,255,0.15)', label: `${notStarted} queued` },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: 2, background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MetricsBanner({ project, simulationData, taskCount = 0, tasks = [] }) {
  const baselineBudget = project?.baselineBudget || 100000;
  const baselineDays   = project?.baselineDurationDays || 20;
  const penaltyRate    = project?.reworkPenaltyRate != null
    ? Math.round(project.reworkPenaltyRate * 100)
    : 25;

  const simFin   = simulationData?.financialSummary;
  const simSched = simulationData?.scheduleSummary;

  const projectedBudget = simFin?.projectedBudget ?? baselineBudget;
  const netBudgetDelta  = simFin?.netBudgetDelta  ?? 0;
  const projectedDays   = simSched?.projectedDurationDays ?? baselineDays;
  const netDaysDelta    = simSched?.netDaysDelta   ?? 0;

  return (
    <section
      aria-label="Project metrics banner"
      style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '10px 20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '12px 20px',
        minHeight: 56,
      }}
    >
      {/* Budget KPIs */}
      <KpiBlock
        label="Baseline Budget"
        value={`₹${Number(baselineBudget).toLocaleString('en-IN')}`}
        delta={0}
      />

      <Divider />

      <KpiBlock
        label="Projected Budget"
        value={`₹${Number(projectedBudget).toLocaleString('en-IN')}`}
        delta={netBudgetDelta !== 0
          ? `${netBudgetDelta > 0 ? '+' : ''}₹${Number(netBudgetDelta).toLocaleString('en-IN')}`
          : 0}
      />

      <Divider />

      {/* Schedule KPIs */}
      <KpiBlock
        label="Baseline Duration"
        value={`${baselineDays}d`}
        delta={0}
      />

      <Divider />

      <KpiBlock
        label="Projected Duration"
        value={`${projectedDays}d`}
        delta={netDaysDelta !== 0 ? `${netDaysDelta > 0 ? '+' : ''}${netDaysDelta}d` : 0}
      />

      <Divider />

      {/* Rework Penalty */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{
          fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.07em',
          color: 'var(--text-faint)'
        }}>
          Rework Penalty
        </span>
        <span style={{
          fontSize: 15, fontFamily: 'var(--font-mono)', fontWeight: 700,
          color: 'var(--accent-cyan)',
          letterSpacing: '-0.02em'
        }}>
          {penaltyRate}% <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-faint)' }}>/ hop</span>
        </span>
      </div>

      <Divider />

      {/* Graph Nodes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{
          fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.07em',
          color: 'var(--text-faint)'
        }}>
          Graph Nodes
        </span>
        <span style={{
          fontSize: 15, fontFamily: 'var(--font-mono)', fontWeight: 700,
          color: 'var(--text-secondary)',
          letterSpacing: '-0.02em'
        }}>
          {taskCount} <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-faint)' }}>tasks</span>
        </span>
      </div>

      {/* Task Progress Bar (spacer + right aligned) */}
      {tasks.length > 0 && (
        <>
          <div style={{ flex: 1, minWidth: 20 }} />
          <TaskProgressBar tasks={tasks} />
        </>
      )}
    </section>
  );
}
