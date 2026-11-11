// frontend/src/pages/LoginPage.jsx
// Demo sign-in: pick a sample profile or continue with your own name. No password, by design.
import React, { useState } from 'react';
import { DEMO_PROFILES, ROLES, initialsOf } from '../auth/profile';
import { useAuth } from '../auth/authContext';
import ThemeToggle from '../components/common/ThemeToggle';

const HIGHLIGHTS = [
  { title: 'See the ripple', text: 'Change one task and instantly see which other tasks are affected.' },
  { title: 'Know the real cost', text: 'Every change shows its exact cost in rupees and days.' },
  { title: 'Balance the budget', text: 'Drop optional extras to stay on budget and on time.' },
];

export default function LoginPage() {
  const { signIn } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', role: ROLES[0] });
  const [errors, setErrors] = useState({});

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = signIn(form);
    setErrors(result.errors || {});
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'grid',
        placeItems: 'center',
        padding: '32px 16px',
        background: 'radial-gradient(1200px 600px at 10% -10%, color-mix(in srgb, var(--accent-cyan) 12%, transparent), transparent), var(--bg-app)',
      }}
    >
      <div style={{ position: 'fixed', top: 16, right: 16 }}>
        <ThemeToggle />
      </div>

      <div style={{ width: '100%', maxWidth: 980, display: 'grid', gap: 32, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', alignItems: 'center' }}>
        {/* Intro */}
        <section aria-labelledby="login-heading">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div className="sl-avatar" style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-solid)', fontSize: 14 }}>SL</div>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>ScopeLedger</span>
          </div>
          <h1 id="login-heading" style={{ fontSize: 32, lineHeight: 1.2, fontWeight: 700, marginBottom: 12 }}>
            See what a change will really cost — before you agree to it.
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 24 }}>
            ScopeLedger shows how one change to a project affects the rest of the work, the budget and the deadline.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 14 }}>
            {HIGHLIGHTS.map((h, i) => (
              <li key={h.title} style={{ display: 'flex', gap: 12 }}>
                <span className="sl-avatar" aria-hidden="true" style={{ width: 28, height: 28, background: 'color-mix(in srgb, var(--accent-cyan) 15%, transparent)', color: 'var(--accent-cyan)' }}>{i + 1}</span>
                <span>
                  <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{h.title}</strong>
                  <span style={{ color: 'var(--text-secondary)' }}>{h.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Sign-in card */}
        <section className="sl-card" style={{ padding: 28, boxShadow: 'var(--shadow-lg)' }} aria-labelledby="signin-heading">
          <h2 id="signin-heading" style={{ fontSize: 20, marginBottom: 4 }}>Sign in</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 13 }}>
            Choose a sample profile to explore, or continue with your own name.
          </p>

          <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
            {DEMO_PROFILES.map((p) => (
              <button
                key={p.email}
                type="button"
                className="sl-btn"
                onClick={() => signIn(p)}
                style={{ justifyContent: 'flex-start', padding: '10px 12px', gap: 12, textAlign: 'left', whiteSpace: 'normal' }}
              >
                <span className="sl-avatar" style={{ width: 36, height: 36, background: 'var(--accent-solid)' }}>{initialsOf(p.name)}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</span>
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)' }}>{p.role} · {p.blurb}</span>
                </span>
                <span aria-hidden="true" style={{ color: 'var(--text-faint)' }}>→</span>
              </button>
            ))}
          </div>

          <div role="separator" style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 18px', color: 'var(--text-faint)', fontSize: 12 }}>
            <span style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
            or continue as yourself
            <span style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          </div>

          <form onSubmit={handleSubmit} noValidate style={{ display: 'grid', gap: 14 }}>
            <div>
              <label className="sl-label" htmlFor="login-name">Your name</label>
              <input id="login-name" className="sl-input" autoComplete="name" value={form.name} onChange={update('name')}
                aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'login-name-err' : undefined} placeholder="e.g. Neha Verma" />
              {errors.name && <p id="login-name-err" className="sl-error">{errors.name}</p>}
            </div>
            <div>
              <label className="sl-label" htmlFor="login-email">Email <span style={{ fontWeight: 400, color: 'var(--text-faint)' }}>(optional)</span></label>
              <input id="login-email" type="email" className="sl-input" autoComplete="email" value={form.email} onChange={update('email')}
                aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'login-email-err' : undefined} placeholder="you@company.com" />
              {errors.email && <p id="login-email-err" className="sl-error">{errors.email}</p>}
            </div>
            <div>
              <label className="sl-label" htmlFor="login-role">Your role</label>
              <select id="login-role" className="sl-input" value={form.role} onChange={update('role')} aria-invalid={Boolean(errors.role)}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              {errors.role && <p className="sl-error">{errors.role}</p>}
            </div>
            <button type="submit" className="sl-btn sl-btn-primary" style={{ minHeight: 42, fontSize: 14 }}>Continue</button>
          </form>

          <p style={{ marginTop: 16, fontSize: 12, color: 'var(--text-faint)', textAlign: 'center' }}>
            Demo sign-in — no password needed. Your profile is saved only in this browser.
          </p>
        </section>
      </div>
    </main>
  );
}
