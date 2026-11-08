// frontend/src/components/layout/MetricsBanner.jsx
// Plain-language project numbers. While a change is being explored, the "after" figures
// show its effect so people can compare with what is agreed today.
import React from 'react';
import InfoTip from '../common/InfoTip';
import { METRICS } from '../../content/glossary';
import { formatDays, formatDaysDelta, formatINR, formatINRDelta } from '../../content/format';

const labelStyle = { fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' };
const valueStyle = { fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' };

/** Delta badge: coral when it costs more, emerald when it saves, hidden when zero. */
function DeltaBadge({ amount, text }) {
  if (!amount) return null;
  const worse = amount > 0;
  const color = worse ? 'var(--accent-coral)' : 'var(--accent-emerald)';
  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        color,
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
      }}
    >
      {text}
    </span>
  );
}

function Kpi({ metric, value, children, align }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4, ...labelStyle }}>
        {metric.label}
        <InfoTip text={metric.help} label={`What is “${metric.label}”?`} align={align} />
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={valueStyle}>{value}</span>
        {children}
      </span>
    </div>
  );
}

const Divider = () => (
  <div aria-hidden="true" style={{ width: 1, height: 36, background: 'var(--border-subtle)', flexShrink: 0 }} />
);

function Progress({ tasks }) {
  const total = tasks.length;
  if (!total) return null;
  const done = tasks.filter((t) => t.status === 'COMPLETED').length;
  const active = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const pct = (n) => (n / total) * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4, ...labelStyle }}>
        {METRICS.progress.label}
        <InfoTip text={METRICS.progress.help} label="What does progress show?" align="end" />
        <span style={{ marginLeft: 'auto', color: 'var(--text-primary)' }}>{done} of {total} done</span>
      </span>
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct(done))}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${done} of ${total} tasks done`}
        style={{ height: 8, borderRadius: 999, background: 'color-mix(in srgb, var(--ink) 10%, transparent)', overflow: 'hidden', display: 'flex' }}
      >
        <div style={{ width: `${pct(done)}%`, background: 'var(--accent-emerald)', transition: 'width 0.4s ease' }} />
        <div style={{ width: `${pct(active)}%`, background: 'var(--accent-cyan)', transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        {done} done · {active} in progress · {total - done - active} not started
      </span>
    </div>
  );
}

export default function MetricsBanner({ project, simulationData, tasks = [] }) {
  const budget = Number(project?.baselineBudget ?? 0);
  const days = Number(project?.baselineDurationDays ?? 0);
  const ratePct = project?.reworkPenaltyRate != null ? Math.round(project.reworkPenaltyRate * 100) : null;

  const fin = simulationData?.financialSummary;
  const sched = simulationData?.scheduleSummary;
  const exploring = Boolean(fin && sched);

  return (
    <section
      aria-label="Project numbers"
      data-tour="metrics"
      style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '12px 24px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '14px 24px',
      }}
    >
      <Kpi metric={METRICS.agreedBudget} value={formatINR(budget)} align="start" />
      <Divider />
      <Kpi metric={METRICS.agreedTimeline} value={formatDays(days)} />

      {exploring && (
        <>
          <Divider />
          <Kpi metric={METRICS.budgetAfter} value={formatINR(fin.projectedBudget)}>
            <DeltaBadge amount={Number(fin.netBudgetDelta)} text={formatINRDelta(fin.netBudgetDelta)} />
          </Kpi>
          <Divider />
          <Kpi metric={METRICS.timelineAfter} value={formatDays(sched.projectedDurationDays)}>
            <DeltaBadge amount={Number(sched.netDaysDelta)} text={formatDaysDelta(sched.netDaysDelta)} />
          </Kpi>
        </>
      )}

      {ratePct != null && (
        <>
          <Divider />
          <Kpi metric={METRICS.redoCost} value={`${ratePct}%`}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>of a task’s hours</span>
          </Kpi>
        </>
      )}

      <div style={{ flex: 1, minWidth: 16 }} />
      <Progress tasks={tasks} />
    </section>
  );
}
