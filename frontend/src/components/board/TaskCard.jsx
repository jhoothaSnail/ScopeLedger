// frontend/src/components/board/TaskCard.jsx
import React from 'react';
import { IMPACT, OPTIONAL, STATUS, statusLabel } from '../../content/glossary';
import { formatDays, formatHours, formatINR } from '../../content/format';

export default function TaskCard({
  task,
  isSelected,
  impactData,       // { impactType: "DIRECT_CHANGE" | "DOWNSTREAM_REWORK", extraHours, extraCost, delayDays }
  isDropped,        // boolean (task toggled off in TradeOffSandbox)
  onSelectTask
}) {
  const isDirectChange = impactData?.impactType === "DIRECT_CHANGE";
  const isDownstreamRework = impactData?.impactType === "DOWNSTREAM_REWORK";

  // Dynamic CSS styling for domino ripple
  let rippleClass = "";
  if (isDropped) {
    rippleClass = "card-state-dropped";
  } else if (isDirectChange) {
    rippleClass = "card-state-direct-change";
  } else if (isDownstreamRework) {
    rippleClass = "card-state-downstream-rework";
  }

  // Status badge colours (palette re-themed by index.css in light mode)
  const statusColors = {
    COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    IN_PROGRESS: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    NOT_STARTED: "bg-slate-800 text-slate-400 border-slate-700"
  };

  const totalCost = Number(task.estimatedHours) * Number(task.hourlyRate);
  const impactLabel = isDirectChange ? IMPACT.DIRECT_CHANGE : IMPACT.DOWNSTREAM_REWORK;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectTask(task);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      data-tour={`task-${task.id}`}
      onClick={() => onSelectTask(task)}
      onKeyDown={handleKeyDown}
      aria-pressed={isSelected}
      aria-label={`${task.title}. ${statusLabel(task.status)}${task.isOptional ? ', optional' : ''}.${impactData && !isDropped ? ` ${impactLabel.label}.` : ''}${isDropped ? ' Removed from scope.' : ''} Press Enter for details.`}
      style={{
        left: `${task.posX || 0}px`,
        top: `${task.posY || 0}px`,
        width: '260px'
      }}
      className={`absolute select-none cursor-pointer rounded-xl p-3.5 bg-slate-900 border transition-all duration-200 shadow-lg hover:shadow-cyan-950/20 hover:scale-[1.01] ${
        isSelected
          ? 'border-cyan-400 ring-2 ring-cyan-400/30'
          : 'border-slate-800 hover:border-slate-700'
      } ${rippleClass}`}
    >
      {/* Status row */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${statusColors[task.status] || statusColors.NOT_STARTED}`}
          title={STATUS[task.status]?.help}>
          {statusLabel(task.status)}
        </span>
        {task.isOptional && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 font-semibold" title={OPTIONAL.help}>
            {OPTIONAL.label}
          </span>
        )}
      </div>

      {/* Title */}
      <h4 className={`text-sm font-semibold text-slate-100 line-clamp-2 mb-2.5 ${isDropped ? 'line-through text-slate-400' : ''}`}>
        {task.title}
      </h4>

      {/* Effort & cost */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
        <div>
          <span className="text-[11px] text-slate-400 block">Work</span>
          <span className="text-slate-200 font-medium" title={`${task.estimatedHours} hours at ${formatINR(task.hourlyRate)} per hour`}>
            {formatHours(task.estimatedHours)} <span className="text-slate-400">× {formatINR(task.hourlyRate)}/h</span>
          </span>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 block">Time · Cost</span>
          <span className="text-slate-200 font-medium">
            {formatDays(task.durationDays)} · {formatINR(totalCost)}
          </span>
        </div>
      </div>

      {/* Impact of the change being explored */}
      {impactData && !isDropped && (
        <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between gap-2 text-xs" title={impactLabel.help}>
          <span className={`${isDirectChange ? 'text-rose-400' : 'text-amber-400'} font-semibold flex items-center gap-1.5`}>
            <span className={`w-2 h-2 rounded-full ${isDirectChange ? 'bg-rose-400' : 'bg-amber-400'} motion-safe:animate-ping`} />
            {impactLabel.label}
          </span>
          <span className={`${isDirectChange ? 'text-rose-400' : 'text-amber-400'} font-semibold`}>
            +{formatHours(impactData.extraHours)} · +{formatINR(impactData.extraCost)}
          </span>
        </div>
      )}

      {/* Removed from scope */}
      {isDropped && (
        <div className="mt-2 text-center text-xs font-medium text-emerald-400 bg-emerald-950/40 py-1 rounded border border-emerald-500/30" title={IMPACT.DROPPED.help}>
          ✓ {IMPACT.DROPPED.label} · saves {formatINR(totalCost)}
        </div>
      )}
    </div>
  );
}
