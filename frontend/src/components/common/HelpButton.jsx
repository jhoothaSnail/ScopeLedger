// frontend/src/components/common/HelpButton.jsx
// The single "?" entry point to the guided tour, used in each page header.
import React from 'react';

export default function HelpButton({ onClick }) {
  if (!onClick) return null;
  return (
    <button type="button" className="sl-btn sl-icon-btn" data-tour="help-button" onClick={onClick}
      aria-label="Help: show me around" title="Show me around">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" d="M9.5 9a2.5 2.5 0 114 2c-.9.6-1.5 1.1-1.5 2.2M12 17h.01" />
      </svg>
    </button>
  );
}
