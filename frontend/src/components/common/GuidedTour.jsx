// frontend/src/components/common/GuidedTour.jsx
// Lightweight guided tour (no library). Each step may name a page and a [data-tour] target;
// the tour switches page, waits for the target to render, spotlights it and explains it.
// Keyboard: ←/→ to move, Esc to close; focus stays inside the step card.
import React, { useCallback, useEffect, useRef, useState } from 'react';

const CARD_WIDTH = 340;
const GAP = 12;
const FIND_TIMEOUT_MS = 2500;

function placeCard(rect) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (!rect) return { top: Math.max(16, vh / 2 - 120), left: Math.max(16, vw / 2 - CARD_WIDTH / 2) };
  const left = Math.min(Math.max(16, rect.left), vw - CARD_WIDTH - 16);
  const below = rect.bottom + GAP;
  const top = below + 220 < vh ? below : Math.max(16, rect.top - GAP - 220);
  return { top, left };
}

export default function GuidedTour({ steps, isOpen, onClose, activePage, onNavigate }) {
  const [index, setIndex] = useState(0);
  const [target, setTarget] = useState({ index: -1, rect: null, searched: false });
  const cardRef = useRef(null);
  const primaryRef = useRef(null);

  const step = steps[index];
  const isLast = index === steps.length - 1;

  const finish = useCallback(() => {
    setIndex(0);
    onClose?.();
  }, [onClose]);

  // Switch page if the step lives elsewhere.
  useEffect(() => {
    if (isOpen && step?.page && step.page !== activePage) onNavigate?.(step.page);
  }, [isOpen, step, activePage, onNavigate]);

  // Locate the target (it may render a moment after navigation), then keep it measured.
  useEffect(() => {
    if (!isOpen || !step) return undefined;
    let raf = 0;
    let el = null;
    const started = performance.now();
    const measure = () => setTarget({ index, rect: el ? el.getBoundingClientRect() : null, searched: true });

    const find = () => {
      el = step.target ? document.querySelector(`[data-tour="${step.target}"]`) : null;
      if (el || !step.target || performance.now() - started > FIND_TIMEOUT_MS) {
        if (el) {
          const r = el.getBoundingClientRect();
          if (r.top < 0 || r.bottom > window.innerHeight) el.scrollIntoView({ block: 'center' });
        }
        measure();
        return;
      }
      raf = requestAnimationFrame(find);
    };
    raf = requestAnimationFrame(find);

    const onChange = () => { if (el) measure(); };
    window.addEventListener('resize', onChange);
    window.addEventListener('scroll', onChange, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onChange);
      window.removeEventListener('scroll', onChange, true);
    };
  }, [isOpen, step, index]);

  // Keyboard navigation + focus trap.
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); finish(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); if (isLast) finish(); else setIndex((i) => i + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); setIndex((i) => Math.max(0, i - 1)); }
      else if (e.key === 'Tab' && cardRef.current) {
        const items = cardRef.current.querySelectorAll('button');
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [isOpen, isLast, finish]);

  const ready = target.index === index && target.searched;
  useEffect(() => {
    if (isOpen && ready) primaryRef.current?.focus();
  }, [isOpen, ready, index]);

  if (!isOpen || !step) return null;

  const rect = ready ? target.rect : null;
  const pos = placeCard(rect);

  return (
    <div className="sl-tour" role="presentation">
      {/* Click shield: keeps the page still while the tour is open */}
      <div className="sl-tour-shield" onClick={(e) => e.stopPropagation()} />
      {rect ? (
        <div
          className="sl-tour-spot"
          aria-hidden="true"
          style={{ top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12 }}
        />
      ) : (
        <div className="sl-tour-dim" aria-hidden="true" />
      )}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        className="sl-card sl-tour-card"
        style={{ top: pos.top, left: pos.left, width: CARD_WIDTH, visibility: ready ? 'visible' : 'hidden' }}
      >
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: 4 }}>
          Step {index + 1} of {steps.length}
        </div>
        <h2 id="tour-title" style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{step.title}</h2>
        <p id="tour-body" style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text-secondary)' }}>{step.body}</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
          <button type="button" className="sl-btn sl-btn-ghost" onClick={finish}>Skip tour</button>
          <span style={{ flex: 1 }} />
          {index > 0 && (
            <button type="button" className="sl-btn" onClick={() => setIndex((i) => i - 1)}>Back</button>
          )}
          <button
            ref={primaryRef}
            type="button"
            className="sl-btn sl-btn-primary"
            onClick={() => (isLast ? finish() : setIndex((i) => i + 1))}
          >
            {isLast ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
