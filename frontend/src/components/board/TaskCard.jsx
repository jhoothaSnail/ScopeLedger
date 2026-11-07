// frontend/src/components/board/TaskCard.jsx
import React from 'react';

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

  // Status badge colors
  const statusColors = {
    COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    IN_PROGRESS: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    NOT_STARTED: "bg-slate-800 text-slate-400 border-slate-700"
  };

  const statusText = {
    COMPLETED: "Completed",
    IN_PROGRESS: "In Progress",
    NOT_STARTED: "Not Started"
  };

  const totalCost = Number(task.estimatedHours) * Number(task.hourlyRate);

  return (
    <div
      onClick={() => onSelectTask(task)}
      style={{
        left: `${task.posX || 0}px`,
        top: `${task.posY || 0}px`,
        width: '260px'
      }}
      className={`absolute select-none cursor-pointer rounded-xl p-3.5 bg-slate-900/90 border transition-all duration-200 shadow-lg hover:shadow-cyan-950/20 hover:scale-[1.01] ${
        isSelected
          ? 'border-cyan-400 ring-2 ring-cyan-400/30'
          : 'border-slate-800 hover:border-slate-700'
      } ${rippleClass}`}
    >
      {/* Top Header: ID & Status */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-mono text-slate-400 font-semibold tracking-wider">
          #{task.id}
        </span>

        <div className="flex items-center gap-1.5">
          {task.isOptional && (
            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold">
              Optional
            </span>
          )}
          <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border font-semibold ${statusColors[task.status] || statusColors.NOT_STARTED}`}>
            {statusText[task.status] || task.status}
          </span>
        </div>
      </div>

      {/* Task Title */}
      <h4 className={`text-xs font-semibold text-slate-100 line-clamp-2 mb-2.5 ${isDropped ? 'line-through text-slate-400' : ''}`}>
        {task.title}
      </h4>

      {/* Metadata metrics */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
        <div>
          <span className="text-[10px] text-slate-400 block">Effort / Rate</span>
          <span className="text-slate-300 font-medium">
            {task.estimatedHours}h <span className="text-slate-400 text-[9px]">@ ₹{task.hourlyRate}</span>
          </span>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 block">Duration / Cost</span>
          <span className="text-slate-300 font-medium">
            {task.durationDays}d <span className="text-slate-400 text-[9px]">(₹{(totalCost / 1000).toFixed(0)}k)</span>
          </span>
        </div>
      </div>

      {/* Domino Ripple Impact Notification Badge */}
      {impactData && !isDropped && (
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
          {isDirectChange ? (
            <>
              <span className="text-rose-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                Direct Scope
              </span>
              <span className="text-rose-400 font-semibold">
                +{impactData.extraHours}h (+₹{Number(impactData.extraCost).toLocaleString('en-IN')})
              </span>
            </>
          ) : (
            <>
              <span className="text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                Rework Domino
              </span>
              <span className="text-amber-400 font-semibold">
                +{impactData.extraHours}h (+₹{Number(impactData.extraCost).toLocaleString('en-IN')})
              </span>
            </>
          )}
        </div>
      )}

      {/* Dropped Indicator Banner */}
      {isDropped && (
        <div className="mt-2 text-center text-[10px] font-mono text-emerald-400 bg-emerald-950/40 py-0.5 rounded border border-emerald-500/20">
          ✓ Proposed to Drop
        </div>
      )}
    </div>
  );
}
