// frontend/src/components/simulator/ChangeOrderHistoryModal.jsx
import React from 'react';

export default function ChangeOrderHistoryModal({
  isOpen,
  onClose,
  changeOrders = []
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 font-mono tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Scope Change-Order Audit Trail
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Immutable ledger of approved deliverable modifications, financial adjustments, and dropped tasks.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Audit Log Table */}
        <div className="flex-1 overflow-y-auto mt-4 pr-1">
          {changeOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs font-mono">
              No scope change orders committed for this project yet.
            </div>
          ) : (
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                  <th className="pb-2">Log ID</th>
                  <th className="pb-2">Target Deliverable</th>
                  <th className="pb-2">Description</th>
                  <th className="pb-2 text-right">Net Cost Delta</th>
                  <th className="pb-2 text-right">Days Delta</th>
                  <th className="pb-2 text-right">Committed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {changeOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 text-slate-400">#{order.id}</td>
                    <td className="py-3 font-semibold text-slate-200">
                      Task #{order.targetTaskId}
                    </td>
                    <td className="py-3 text-slate-300 max-w-xs truncate" title={order.changeDescription}>
                      {order.changeDescription}
                    </td>
                    <td className="py-3 text-right">
                      <span className={`font-semibold ${Number(order.netCostDelta) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {Number(order.netCostDelta) > 0 ? "+" : ""}
                        ₹{Number(order.netCostDelta).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="py-3 text-right text-slate-300">
                      {order.netDaysDelta > 0 ? `+${order.netDaysDelta}d` : `${order.netDaysDelta}d`}
                    </td>
                    <td className="py-3 text-right text-slate-400 text-[11px]">
                      {order.committedAt ? new Date(order.committedAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Recently'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-[11px] font-mono text-slate-400">
          <span>{changeOrders.length} committed record(s)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
