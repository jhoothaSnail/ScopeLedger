import React from 'react';

export default function TradeOffSandbox({ candidates = [], selectedDropIds = [], onToggleDrop }) {
    return (
        <div className="mt-4 p-3.5 bg-slate-900/90 border border-slate-800 rounded-lg shadow-inner">
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
                <div className="space-y-2">
                    {candidates.map((task) => {
                        const isDropped = selectedDropIds.includes(task.taskId);
                        return (
                            <div
                                key={task.taskId}
                                onClick={() => onToggleDrop(task.taskId)}
                                className={`flex items-center justify-between p-2.5 rounded cursor-pointer border transition-all select-none ${
                                    isDropped
                                        ? 'border-emerald-500/50 bg-emerald-950/20 text-slate-300'
                                        : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                                }`}
                            >
                                <div className="flex flex-col pr-2">
                  <span className={`text-xs font-medium ${isDropped ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                    {task.title}
                  </span>
                                    <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                    -{task.savedDays}d | -₹{Number(task.savedCost).toLocaleString('en-IN')}
                  </span>
                                </div>

                                {/* Switch indicator */}
                                <div className={`w-8 h-4 flex items-center rounded-full p-0.5 transition-colors ${isDropped ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                                    <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${isDropped ? 'translate-x-4' : 'translate-x-0'}`} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}