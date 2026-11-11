// frontend/src/components/simulator/SimulationDrawer.jsx
// Side panel to describe a client change, dry-run its ripple, trade off optional scope and commit.
import React, { useEffect, useRef, useState } from 'react';
import TradeOffSandbox from './TradeOffSandbox';
import ImpactStory from './ImpactStory';

// Mirrors server-side limits in RippleSimulationService.
const MAX_HOURS = 100000;
const MAX_DAYS = 3650;
const MAX_DESC = 500;
// Defaults match WorkspacePage's automatic first dry-run, so that result is not "stale".
const DEFAULT_HOURS = 12;
const DEFAULT_DAYS = 2;

const inr = (v) => Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const signed = (n, fmt = String) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${fmt(Math.abs(n))}`;
const sameIds = (a = [], b = []) => {
  if (a.length !== b.length) return false;
  const sb = [...b].sort((x, y) => x - y);
  return [...a].sort((x, y) => x - y).every((v, i) => v === sb[i]);
};

function validate(hoursStr, daysStr, desc) {
  const errors = {};
  const hours = Number(hoursStr);
  const days = Number(daysStr);
  if (hoursStr === '' || !Number.isFinite(hours) || hours < 0 || hours > MAX_HOURS) {
    errors.hours = `0 – ${MAX_HOURS.toLocaleString('en-IN')} hours`;
  }
  if (daysStr === '' || !Number.isInteger(days) || days < 0 || days > MAX_DAYS) {
    errors.days = `Whole number, 0 – ${MAX_DAYS}`;
  }
  if (desc.trim().length > MAX_DESC) {
    errors.desc = `At most ${MAX_DESC} characters`;
  }
  return { errors, hours, days };
}

export default function SimulationDrawer({ targetTask, simulationData, onSimulate, onCommit, onClose }) {
  const [hoursStr, setHoursStr] = useState(String(DEFAULT_HOURS));
  const [daysStr, setDaysStr] = useState(String(DEFAULT_DAYS));
  const [desc, setDesc] = useState(`Scope modification for ${targetTask?.title ?? 'task'}`);
  const [droppedIds, setDroppedIds] = useState([]);
  const [lastRun, setLastRun] = useState({ hours: DEFAULT_HOURS, days: DEFAULT_DAYS });
  const [isBusy, setIsBusy] = useState(false);
  const [seenSim, setSeenSim] = useState(null);
  const lastPayload = useRef(null); // last payload sent, used to detect server-side pruning

  const sim = simulationData?.targetTaskId === targetTask?.id ? simulationData : null;

  // Adopt the server-approved drop set whenever a new result arrives (render-time sync, no effect).
  if (sim !== seenSim) {
    setSeenSim(sim);
    if (sim?.appliedDropIds && !sameIds(sim.appliedDropIds, droppedIds)) {
      setDroppedIds(sim.appliedDropIds);
    }
  }

  const { errors, hours, days } = validate(hoursStr, daysStr, desc);
  const inputsValid = Object.keys(errors).length === 0;
  const isStale = !sim || hours !== lastRun.hours || days !== lastRun.days;
  const canCommit = inputsValid && !isBusy && !isStale && desc.trim().length > 0;

  const buildPayload = (dropIds) => ({
    targetTaskId: targetTask.id,
    changeDescription: desc.trim(),
    addedHours: hours,
    addedDays: days,
    droppedOptionalTaskIds: dropIds,
  });

  const runSimulation = async (dropIds = droppedIds) => {
    if (!inputsValid || isBusy) return;
    setIsBusy(true);
    setLastRun({ hours, days });
    const payload = buildPayload(dropIds);
    lastPayload.current = payload;
    try {
      await onSimulate(payload); // parent stores result + toasts on error
    } finally {
      setIsBusy(false);
    }
  };

  // If the server pruned an ineligible drop (e.g. a parent whose leaf was re-enabled), re-run
  // once with the approved set so the board's faded cards match the numbers shown.
  // Runs ONLY when a new response arrives (deps: [sim]). The parent recreates onSimulate on every
  // render, so it is read through a ref; depending on it directly would re-fire this effect against
  // a stale response and undo the user's latest toggle. Toggles are disabled while a request is in
  // flight, so a new response always answers the most recent payload.
  const onSimulateRef = useRef(onSimulate);
  useEffect(() => {
    onSimulateRef.current = onSimulate;
  });
  useEffect(() => {
    const sent = lastPayload.current;
    if (!sim?.appliedDropIds || !sent || sameIds(sent.droppedOptionalTaskIds, sim.appliedDropIds)) return;
    lastPayload.current = { ...sent, droppedOptionalTaskIds: sim.appliedDropIds };
    onSimulateRef.current(lastPayload.current);
  }, [sim]);

  const handleToggleDrop = (id) => {
    const updated = droppedIds.includes(id) ? droppedIds.filter((x) => x !== id) : [...droppedIds, id];
    setDroppedIds(updated);
    runSimulation(updated);
  };

  const handleCommit = () => {
    if (canCommit) onCommit(buildPayload(droppedIds));
  };

  const fin = sim?.financialSummary;
  const sched = sim?.scheduleSummary;
  const inputCls = (bad) =>
    `w-full mt-1 px-2.5 py-1.5 bg-slate-900 border rounded text-xs text-slate-100 tabular-nums outline-none ${
      bad ? 'border-rose-500' : 'border-slate-700 focus:border-rose-500'
    }`;

  return (
    <aside
      role="dialog"
      data-tour="drawer"
      aria-label="Explore a change"
      className="fixed right-0 top-0 h-full w-[380px] max-w-full bg-slate-950 border-l border-slate-800 p-5 flex flex-col z-50 shadow-2xl"
      onKeyDown={(e) => e.key === 'Escape' && onClose?.()}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
        <h3 className="text-sm font-semibold text-slate-100 tabular-nums ">Explore a change</h3>
        <button type="button" onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-100 text-xl leading-none">
          &times;
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        <div>
          <span className="text-xs tabular-nums text-slate-400 ">Task being changed</span>
          <div className="text-xs font-semibold text-slate-100 p-2.5 mt-1 rounded bg-slate-900 border border-slate-800">
            #{targetTask?.id} — {targetTask?.title}
          </div>
        </div>

        <div>
          <label htmlFor="sim-desc" className="text-xs tabular-nums text-slate-400">What is the client asking for?</label>
          <textarea
            id="sim-desc"
            rows={2}
            maxLength={MAX_DESC + 50}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="e.g. Switch Email Login to WhatsApp OTP Login"
            className={`${inputCls(errors.desc)} resize-none`}
          />
          {errors.desc && <p className="text-[11px] text-rose-400 mt-1">{errors.desc}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="sim-hours" className="text-xs tabular-nums text-slate-400">Extra hours of work</label>
            <input id="sim-hours" type="number" min="0" step="0.5" value={hoursStr}
              onChange={(e) => setHoursStr(e.target.value)} aria-invalid={Boolean(errors.hours)} className={inputCls(errors.hours)} />
            {errors.hours && <p className="text-[11px] text-rose-400 mt-1">{errors.hours}</p>}
          </div>
          <div>
            <label htmlFor="sim-days" className="text-xs tabular-nums text-slate-400">Extra days needed</label>
            <input id="sim-days" type="number" min="0" step="1" value={daysStr}
              onChange={(e) => setDaysStr(e.target.value)} aria-invalid={Boolean(errors.days)} className={inputCls(errors.days)} />
            {errors.days && <p className="text-[11px] text-rose-400 mt-1">{errors.days}</p>}
          </div>
        </div>

        <TradeOffSandbox
          candidates={sim?.candidateTradeOffs || []}
          selectedDropIds={droppedIds}
          onToggleDrop={handleToggleDrop}
          disabled={isBusy || !inputsValid}
        />

        {sim && !isStale && <ImpactStory simulation={sim} targetTitle={targetTask?.title} />}

        {sim && (
          <div className={`space-y-3 transition-opacity ${isStale ? 'opacity-50' : ''}`} aria-live="polite">
            {/* Ripple breakdown */}
            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
              <div className="text-xs tabular-nums text-slate-400 font-semibold mb-2">Affected tasks</div>
              <ul className="space-y-1.5 tabular-nums text-xs">
                {sim.impactedTasks.map((t) => (
                  <li key={t.taskId} className="flex justify-between gap-2">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.impactType === 'DIRECT_CHANGE' ? 'bg-rose-500' : 'bg-amber-400'}`} />
                      <span className="truncate text-slate-300" title={t.title}>#{t.taskId} {t.title}</span>
                    </span>
                    <span className="text-slate-400 shrink-0">+{t.extraHours}h · +₹{inr(t.extraCost)} · +{t.delayDays}d</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Summary */}
            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-2 tabular-nums text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Extra cost (change + rework)</span>
                <span className="text-rose-400 font-semibold">+₹{inr(fin.changeAndReworkCost)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Saved by removing extras</span>
                <span className="text-emerald-400 font-semibold">−₹{inr(fin.optionalTasksSavedCost)}</span>
              </div>
              <div className="flex justify-between text-slate-200 border-t border-slate-800 pt-2 font-semibold">
                <span>Net effect on budget</span>
                <span className={fin.netBudgetDelta > 0 ? 'text-amber-400' : 'text-emerald-400'}>{signed(fin.netBudgetDelta, (n) => `₹${inr(n)}`)}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-xs">
                <span>Budget</span>
                <span>₹{inr(fin.originalBudget)} → ₹{inr(fin.projectedBudget)}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-xs">
                <span>Timeline</span>
                <span>
                  {sched.originalDurationDays}d → {sched.projectedDurationDays}d ({signed(sched.netDaysDelta)}d)
                </span>
              </div>
            </div>
          </div>
        )}

        {isStale && sim && inputsValid && (
          <p className="text-xs text-amber-400 tabular-nums">You changed the numbers — press “Update estimate” before approving.</p>
        )}
      </div>

      {/* Actions */}
      <div className="pt-3 border-t border-slate-800 flex gap-2">
        <button
          type="button"
          onClick={() => runSimulation()}
          disabled={!inputsValid || isBusy}
          className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-xs tabular-nums text-slate-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isBusy ? 'Updating…' : 'Update estimate'}
        </button>
        <button
          type="button"
          onClick={handleCommit}
          disabled={!canCommit}
          title={!desc.trim() ? 'Describe the change before approving it' : undefined}
          className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-xs tabular-nums text-white font-semibold rounded shadow-lg shadow-rose-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Approve change
        </button>
      </div>
    </aside>
  );
}
