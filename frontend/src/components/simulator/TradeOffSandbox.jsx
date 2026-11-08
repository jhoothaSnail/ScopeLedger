// frontend/src/components/simulator/TradeOffSandbox.jsx
// Toggle switches for server-approved, safe-to-drop optional tasks (README §2.3).
import React from 'react';

const inr = (v) => Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

export default function TradeOffSandbox({ candidates = [], selectedDropIds = [], onToggleDrop, disabled = false }) {
  return (
    <section className="mt-4 p-3.5 bg-slate-900/90 border border-slate-800 rounded-lg shadow-inner" aria-label="Optional scope trade-offs">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase font-semibold">
          Optional Scope Trade-Offs
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
          Safe to Drop
        </span>
      </div>

      {candidates.length === 0 ? (
        <p className="text-xs text-slate-500 py-2">No unstarted optional leaf tasks available to drop.</p>
      ) : (
        <ul className="space-y-2">
          {candidates.map((task) => {
            const isDropped = selectedDropIds.includes(task.taskId);
            return (
              <li key={task.taskId}>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isDropped}
                  aria-label={`Drop ${task.title}`}
                  title={task.rationale}
                  disabled={disabled}
                  onClick={() => onToggleDrop?.(task.taskId)}
                  className={`w-full text-left flex items-center justify-between p-2.5 rounded border transition-all select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 disabled:opacity-60 disabled:cursor-wait ${
                    isDropped
                      ? 'border-emerald-500/50 bg-emerald-950/20 text-slate-300'
                      : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 cursor-pointer'
                  }`}
                >
                  <span className="flex flex-col pr-2">
                    <span className={`text-xs font-medium ${isDropped ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {task.title}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                      -{task.savedDays}d | -₹{inr(task.savedCost)}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={`w-8 h-4 shrink-0 flex items-center rounded-full p-0.5 transition-colors ${isDropped ? 'bg-emerald-500' : 'bg-slate-700'}`}
                  >
                    <span className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${isDropped ? 'translate-x-4' : 'translate-x-0'}`} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
