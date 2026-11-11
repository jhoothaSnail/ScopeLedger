// frontend/src/content/format.js
// Number formatting shared across the UI (Indian rupee grouping, plain-language durations).

/** ₹1,04,000 — whole rupees unless paise are present. */
export function formatINR(value) {
  const n = Number(value) || 0;
  return `₹${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

/** +₹4,000 / −₹2,000 / ₹0 */
export function formatINRDelta(value) {
  const n = Number(value) || 0;
  if (n === 0) return '₹0';
  return `${n > 0 ? '+' : '−'}${formatINR(n)}`;
}

/** 1 day / 3 days */
export function formatDays(value) {
  const n = Number(value) || 0;
  return `${n} ${Math.abs(n) === 1 ? 'day' : 'days'}`;
}

/** +3 days / −1 day / no change */
export function formatDaysDelta(value) {
  const n = Number(value) || 0;
  if (n === 0) return 'no change';
  return `${n > 0 ? '+' : '−'}${formatDays(Math.abs(n))}`;
}

/** 12 h / 2.5 h */
export function formatHours(value) {
  const n = Number(value) || 0;
  return `${Number.isInteger(n) ? n : n.toFixed(1)} h`;
}
