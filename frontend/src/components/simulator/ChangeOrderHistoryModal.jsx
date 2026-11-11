// frontend/src/components/simulator/ChangeOrderHistoryModal.jsx
// Read-only table of committed change orders from GET /api/v1/projects/{id}/change-orders.
import React, { useEffect, useMemo } from 'react';

const inr = (v) => Math.abs(Number(v || 0)).toLocaleString('en-IN', { maximumFractionDigits: 2 });

/** droppedTasksJson is a JSON array string such as "[104, 106]"; tolerate bad or empty values. */
function parseDropped(json) {
  try {
    const ids = JSON.parse(json || '[]');
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ChangeOrderHistoryModal({ isOpen, onClose, changeOrders = [] }) {
  // Esc closes the modal.
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Newest first, whatever order the source returns.
  const rows = useMemo(
    () => [...changeOrders].sort((a, b) => (new Date(b.committedAt) - new Date(a.committedAt)) || (b.id - a.id)),
    [changeOrders]
  );

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="audit-title"
        className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden p-6 flex flex-col max-h-[80vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 id="audit-title" className="text-sm font-semibold text-slate-100 font-mono tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Scope Change-Order Audit Trail
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Immutable ledger of approved deliverable modifications, financial adjustments, and dropped tasks.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close audit trail" className="text-slate-400 hover:text-slate-100 text-xl leading-none">
            &times;
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto mt-4 pr-1">
          {rows.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs font-mono">
              No scope change orders committed for this project yet.
            </div>
          ) : (
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                  <th scope="col" className="pb-2 pr-3">Log ID</th>
                  <th scope="col" className="pb-2 pr-3">Target Deliverable</th>
                  <th scope="col" className="pb-2 pr-3">Description</th>
                  <th scope="col" className="pb-2 pr-3">Dropped</th>
                  <th scope="col" className="pb-2 pr-3 text-right">Net Cost Δ</th>
                  <th scope="col" className="pb-2 pr-3 text-right">Days Δ</th>
                  <th scope="col" className="pb-2 text-right">Committed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rows.map((order) => {
                  const cost = Number(order.netCostDelta) || 0;
                  const days = Number(order.netDaysDelta) || 0;
                  const dropped = parseDropped(order.droppedTasksJson);
                  return (
                    <tr key={order.id} className="hover:bg-slate-800/30 transition-colors align-top">
                      <td className="py-3 pr-3 text-slate-400">#{order.id}</td>
                      <td className="py-3 pr-3 font-semibold text-slate-200">
                        {order.targetTaskTitle || 'Task'} <span className="text-slate-500 font-normal">#{order.targetTaskId}</span>
                      </td>
                      <td className="py-3 pr-3 text-slate-300 max-w-xs truncate" title={order.changeDescription}>
                        {order.changeDescription}
                      </td>
                      <td className="py-3 pr-3 text-slate-400">
                        {dropped.length ? dropped.map((id) => `#${id}`).join(', ') : '—'}
                      </td>
                      <td className="py-3 pr-3 text-right">
                        <span className={`font-semibold ${cost > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {cost > 0 ? '+' : cost < 0 ? '−' : ''}₹{inr(cost)}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-right text-slate-300">{days > 0 ? `+${days}d` : `${days}d`}</td>
                      <td className="py-3 text-right text-slate-400 text-[11px] whitespace-nowrap">{formatDate(order.committedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-[11px] font-mono text-slate-400">
          <span>{rows.length} committed record(s)</span>
          <button type="button" onClick={onClose} className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
