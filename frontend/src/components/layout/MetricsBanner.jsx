// frontend/src/components/layout/MetricsBanner.jsx
import React from 'react';

export default function MetricsBanner({ project, simulationData, taskCount = 0 }) {
  const baselineBudget = project?.baselineBudget || 100000;
  const baselineDays = project?.baselineDurationDays || 20;
  const penaltyRate = project?.reworkPenaltyRate !== undefined ? project.reworkPenaltyRate * 100 : 25;

  const simFin = simulationData?.financialSummary;
  const simSched = simulationData?.scheduleSummary;

  const projectedBudget = simFin?.projectedBudget ?? baselineBudget;
  const netBudgetDelta = simFin?.netBudgetDelta ?? 0;

  const projectedDays = simSched?.projectedDurationDays ?? baselineDays;
  const netDaysDelta = simSched?.netDaysDelta ?? 0;

  return (
    <section className="bg-slate-900/60 border-b border-slate-800/80 px-6 py-3.5 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Financial KPI */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Baseline Budget
            </span>
            <span className="text-base font-bold font-mono text-slate-100 tabular-nums">
              ₹{Number(baselineBudget).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="h-8 w-px bg-slate-800" />

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Projected Budget
              </span>
              {netBudgetDelta !== 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                  netBudgetDelta > 0 
                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' 
                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {netBudgetDelta > 0 ? `+₹${Number(netBudgetDelta).toLocaleString('en-IN')}` : `-₹${Number(Math.abs(netBudgetDelta)).toLocaleString('en-IN')}`}
                </span>
              )}
            </div>
            <span className={`text-base font-bold font-mono tabular-nums ${
              netBudgetDelta > 0 ? 'text-rose-400' : netBudgetDelta < 0 ? 'text-emerald-400' : 'text-slate-100'
            }`}>
              ₹{Number(projectedBudget).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Schedule KPI */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Baseline Duration
            </span>
            <span className="text-base font-bold font-mono text-slate-100 tabular-nums">
              {baselineDays} <span className="text-xs font-normal text-slate-400">days</span>
            </span>
          </div>

          <div className="h-8 w-px bg-slate-800" />

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Projected Duration
              </span>
              {netDaysDelta !== 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                  netDaysDelta > 0 
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' 
                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {netDaysDelta > 0 ? `+${netDaysDelta}d` : `${netDaysDelta}d`}
                </span>
              )}
            </div>
            <span className={`text-base font-bold font-mono tabular-nums ${
              netDaysDelta > 0 ? 'text-amber-400' : netDaysDelta < 0 ? 'text-emerald-400' : 'text-slate-100'
            }`}>
              {projectedDays} <span className="text-xs font-normal text-slate-400">days</span>
            </span>
          </div>
        </div>

        {/* Project Meta Parameters */}
        <div className="hidden lg:flex items-center gap-5">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Rework Penalty
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold font-mono text-cyan-400">
                {penaltyRate}%
              </span>
              <span className="text-[10px] text-slate-400 font-mono">per hop</span>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-800" />

          <div className="flex flex-col">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Graph Nodes
            </span>
            <span className="text-xs font-bold font-mono text-slate-300">
              {taskCount} <span className="text-[10px] font-normal text-slate-400">tasks</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
