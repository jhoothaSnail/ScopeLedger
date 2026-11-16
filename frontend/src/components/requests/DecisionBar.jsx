// frontend/src/components/requests/DecisionBar.jsx
// Inline approve / reject confirmation with an optional note. Shared by the Change requests page
// and the task inspector on the board, so approvers can decide wherever they meet a request.
import React, { useState } from 'react';

/**
 * @param {object} request  ChangeRequestDto
 * @param {(request:object, mode:'approve'|'reject', note:string) => Promise<boolean>} onDecide
 *        resolves true when the decision was saved (the bar then closes)
 * @param {boolean} compact  narrower layout for side panels
 */
export default function DecisionBar({ request, onDecide, compact = false }) {
  const [mode, setMode] = useState(null); // 'approve' | 'reject' | null
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    const ok = await onDecide(request, mode, note.trim());
    setBusy(false);
    if (ok) { setMode(null); setNote(''); }
  };

  if (!mode) {
    return (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" className="sl-btn sl-btn-primary" onClick={() => setMode('approve')}>Approve</button>
        <button type="button" className="sl-btn" onClick={() => setMode('reject')}>Reject</button>
      </div>
    );
  }
  const approving = mode === 'approve';
  const noteId = `note-${compact ? 'panel-' : ''}${request.id}`;
  return (
    <div style={{ display: 'grid', gap: 8, padding: compact ? 10 : 12, borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-hover)', border: '1px solid var(--border-subtle)' }}>
      <strong style={{ fontSize: compact ? 13 : 14, color: 'var(--text-primary)' }}>
        {approving ? 'Approve this request?' : 'Reject this request?'}
      </strong>
      <span style={{ fontSize: compact ? 12 : 13, color: 'var(--text-secondary)' }}>
        {approving
          ? 'The task, the agreed budget and the timeline are updated, any extras it removes are taken out of scope, and it is recorded in the change history. The cost is recalculated on the current plan.'
          : 'Nothing in the plan changes. The person who asked can see your reason.'}
      </span>
      <label className="sl-label" htmlFor={noteId}>{approving ? 'Note (optional)' : 'Reason (optional)'}</label>
      <input id={noteId} className="sl-input" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)}
        placeholder={approving ? 'e.g. Agreed on the call with Rahul' : 'e.g. Let’s take this up in the next release'} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="sl-btn sl-btn-primary" disabled={busy} onClick={confirm}>
          {busy ? 'Saving…' : approving ? 'Yes, approve' : 'Yes, reject'}
        </button>
        <button type="button" className="sl-btn" disabled={busy} onClick={() => setMode(null)}>Cancel</button>
      </div>
    </div>
  );
}
