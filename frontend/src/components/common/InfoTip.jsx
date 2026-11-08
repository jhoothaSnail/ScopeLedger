// frontend/src/components/common/InfoTip.jsx
// Small "i" button that explains a term. Opens on hover or keyboard focus; Esc closes.
import React, { useId, useState } from 'react';

export default function InfoTip({ text, label = 'More information', placement = 'bottom', align = 'center' }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span
      className="sl-tip-wrap"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="sl-tip-btn"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <path d="M8 7.2v3.6M8 5.1v.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <span id={id} role="tooltip" className={`sl-tip sl-tip-${placement} sl-tip-align-${align}`}>
          {text}
        </span>
      )}
    </span>
  );
}
