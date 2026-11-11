// frontend/src/components/simulator/ImpactStory.jsx
// "What this change means" card shown at the top of the simulation drawer.
import React from 'react';
import { buildImpactStory } from './impactStory';

export default function ImpactStory({ simulation, targetTitle }) {
  const story = buildImpactStory(simulation, targetTitle);
  if (!story) return null;
  const good = story.outcome.tone === 'good';
  const tone = good ? 'var(--accent-emerald)' : 'var(--accent-coral)';

  return (
    <section
      aria-label="What this change means"
      aria-live="polite"
      data-tour="impact-story"
      style={{
        padding: '12px 14px',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-surface-elevated)',
        border: '1px solid var(--border-default)',
        fontSize: 13,
        lineHeight: 1.5,
        color: 'var(--text-secondary)',
      }}
    >
      <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
        What this change means
      </h4>
      <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 6 }}>{story.headline}</p>
      <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 4 }}>
        {story.points.map((p) => <li key={p}>{p}</li>)}
      </ul>
      <p
        style={{
          marginTop: 10,
          padding: '6px 10px',
          borderRadius: 'var(--radius-md)',
          fontWeight: 600,
          color: tone,
          background: `color-mix(in srgb, ${tone} 10%, transparent)`,
        }}
      >
        {good ? '✓ ' : '! '}{story.outcome.text}
      </p>
      {story.tip && <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>💡 {story.tip}</p>}
    </section>
  );
}
