import React, { useState } from 'react';
import TradeOffSandbox from './TradeOffSandbox';

export default function SimulationDrawer({
                                             targetTask,
                                             simulationData,
                                             onSimulate,
                                             onCommit,
                                             onClose
                                         }) {
    const [addedHours, setAddedHours] = useState(12);
    const [addedDays, setAddedDays] = useState(2);
    const [desc, setDesc] = useState("WhatsApp OTP Login replacement");
    const [droppedIds, setDroppedIds] = useState([]);

    const handleToggleDrop = (id) => {
        const updated = droppedIds.includes(id)
            ? droppedIds.filter(x => x !== id)
            : [...droppedIds, id];
        setDroppedIds(updated);
        onSimulate({
            targetTaskId: targetTask.id,
            changeDescription: desc,
            addedHours,
            addedDays,
            droppedOptionalTaskIds: updated
        });
    };

    const handleRunSimulation = () => {
        onSimulate({
            targetTaskId: targetTask.id,
            changeDescription: desc,
            addedHours,
            addedDays,
            droppedOptionalTaskIds: droppedIds
        });
    };

    const handleCommit = () => {
        onCommit({
            targetTaskId: targetTask.id,
            changeDescription: desc,
            addedHours,
            addedDays,
            droppedOptionalTaskIds: droppedIds
        });
    };

    const sim = simulationData;

    return (
        <div className="fixed right-0 top-0 h-full w-[380px] bg-slate-950/95 border-l border-slate-800 p-5 flex flex-col z-50 backdrop-blur-xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
                <h3 className="text-sm font-semibold text-slate-100 font-mono tracking-wide">
                    Change Order Simulation
                </h3>
                <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-white text-xl leading-none"
                >
                    &times;
                </button>
            </div>

            {/* Body Scroll */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                <div>
                    <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                        Target Deliverable
                    </label>
                    <div className="text-xs font-semibold text-slate-100 p-2.5 mt-1 rounded bg-slate-900 border border-slate-800">
                        #{targetTask?.id} — {targetTask?.title}
                    </div>
                </div>

                {/* Inputs */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[11px] font-mono text-slate-400">Added Hours</label>
                        <input
                            type="number"
                            value={addedHours}
                            onChange={(e) => setAddedHours(Number(e.target.value))}
                            className="w-full mt-1 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono focus:border-rose-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-[11px] font-mono text-slate-400">Added Days</label>
                        <input
                            type="number"
                            value={addedDays}
                            onChange={(e) => setAddedDays(Number(e.target.value))}
                            className="w-full mt-1 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono focus:border-rose-500 outline-none"
                        />
                    </div>
                </div>

                {/* Trade-off toggles */}
                <TradeOffSandbox
                    candidates={sim?.candidateTradeOffs || []}
                    selectedDropIds={droppedIds}
                    onToggleDrop={handleToggleDrop}
                />

                {/* Live Metrics Card */}
                {sim && (
                    <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-2 font-mono text-xs">
                        <div className="flex justify-between text-slate-400">
                            <span>Gross Cost (Added + Rework):</span>
                            <span className="text-rose-400 font-semibold">
                +₹{Number(sim.financialSummary.changeAndReworkCost).toLocaleString('en-IN')}
              </span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                            <span>Scope Savings:</span>
                            <span className="text-emerald-400 font-semibold">
                -₹{Number(sim.financialSummary.optionalTasksSavedCost).toLocaleString('en-IN')}
              </span>
                        </div>
                        <div className="flex justify-between text-slate-200 border-t border-slate-800 pt-2 font-semibold">
                            <span>Net Budget Delta:</span>
                            <span className={sim.financialSummary.netBudgetDelta > 0 ? "text-amber-400" : "text-emerald-400"}>
                {sim.financialSummary.netBudgetDelta > 0 ? "+" : ""}
                                ₹{Number(sim.financialSummary.netBudgetDelta).toLocaleString('en-IN')}
              </span>
                        </div>
                        <div className="flex justify-between text-slate-300 text-[11px] pt-1">
                            <span>Net Delay:</span>
                            <span>{sim.scheduleSummary.netDaysDelta} days</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Footers */}
            <div className="pt-3 border-t border-slate-800 flex gap-2">
                <button
                    onClick={handleRunSimulation}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 rounded transition-colors"
                >
                    Run Simulation
                </button>
                <button
                    onClick={handleCommit}
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-xs font-mono text-white font-semibold rounded shadow-lg shadow-rose-950 transition-colors"
                >
                    Commit Scope
                </button>
            </div>
        </div>
    );
}