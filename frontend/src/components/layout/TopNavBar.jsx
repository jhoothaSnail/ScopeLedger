// frontend/src/components/layout/TopNavBar.jsx
import React, { useState } from 'react';

export default function TopNavBar({
  projectName = "E-Commerce Checkout & Auth System",
  onResetDemo,
  onOpenAuditLog,
  onOpenAddModal,
  isLiveApi = true
}) {
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (!window.confirm("Reset this project board back to its baseline seed state?")) {
      return;
    }
    setIsResetting(true);
    try {
      await onResetDemo();
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <header className="h-16 px-6 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
      {/* Brand & Project Info */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono font-bold text-sm shadow-inner">
            SL
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-100 text-sm tracking-tight">ScopeLedger</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">v1.0</span>
            </div>
          </div>
        </div>

        <div className="h-4 w-px bg-slate-800 hidden sm:block" />

        {/* Project Breadcrumb */}
        <div className="hidden sm:flex items-center gap-2 text-xs">
          <span className="text-slate-400">Project /</span>
          <span className="text-slate-200 font-medium font-mono">{projectName}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Backend mode pill */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
          <span className={`w-2 h-2 rounded-full ${isLiveApi ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span>{isLiveApi ? 'Live Backend' : 'Offline Mode'}</span>
        </div>

        {/* Audit Log Button */}
        <button
          onClick={onOpenAuditLog}
          className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-mono transition-colors flex items-center gap-1.5"
          title="View committed scope change order audit log"
        >
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Audit Log
        </button>

        {/* Add Task/Dependency Button */}
        <button
          onClick={onOpenAddModal}
          className="px-3 py-1.5 rounded bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/60 text-cyan-300 text-xs font-mono font-medium transition-colors flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Node / Edge
        </button>

        {/* 1-Click Demo Reset Button */}
        <button
          onClick={handleReset}
          disabled={isResetting}
          className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-mono transition-colors flex items-center gap-1.5 disabled:opacity-50"
          title="Reset database seed in 1 click for evaluation"
        >
          <svg className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isResetting ? "Resetting..." : "Reset Demo"}
        </button>
      </div>
    </header>
  );
}
