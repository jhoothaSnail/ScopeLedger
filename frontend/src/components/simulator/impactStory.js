// frontend/src/components/simulator/impactStory.js
// Turns a SimulationResponseDto into a short plain-English explanation.
// Pure function (no React) so the wording logic is easy to read and test.
import { formatDays, formatHours, formatINR } from '../../content/format';

const listOf = (items) =>
  items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

/**
 * @param {object} sim          SimulationResponseDto
 * @param {string} [targetTitle] fallback title for the changed task
 * @returns {{ headline: string, points: string[], outcome: {tone: 'good'|'bad', text: string}, tip: string|null } | null}
 */
export function buildImpactStory(sim, targetTitle) {
  if (!sim?.impactedTasks?.length || !sim.financialSummary || !sim.scheduleSummary) return null;

  const fin = sim.financialSummary;
  const sched = sim.scheduleSummary;
  const direct = sim.impactedTasks.find((t) => t.impactType === 'DIRECT_CHANGE');
  const rework = sim.impactedTasks.filter((t) => t.impactType === 'DOWNSTREAM_REWORK');
  const title = (direct?.title && !direct.title.startsWith('Task #') ? direct.title : targetTitle) || 'this task';
  const hours = Number(direct?.extraHours) || 0;
  const days = Number(direct?.delayDays) || 0;

  const headline = hours === 0 && days === 0
    ? `No extra work entered yet for ${title}. Add the hours and days this change needs.`
    : `Changing ${title} adds ${formatHours(hours)} of work (${formatINR(direct.extraCost)}) and ${formatDays(days)}.`;

  const points = [];
  if (rework.length) {
    const names = rework.map((t) => `${t.title} (${formatHours(t.extraHours)}, ${formatINR(t.extraCost)})`);
    points.push(`${rework.length === 1 ? 'One task depends' : `${rework.length} tasks depend`} on it and ${rework.length === 1 ? 'is' : 'are'} already done or underway, so part of the work must be redone: ${listOf(names)}.`);
  } else if (hours > 0 || days > 0) {
    points.push('No finished or in-progress work needs to be redone.');
  }

  const removed = (sim.candidateTradeOffs || []).filter((c) => (sim.appliedDropIds || []).includes(c.taskId));
  if (removed.length) {
    points.push(`Removing ${listOf(removed.map((c) => c.title))} saves ${formatINR(fin.optionalTasksSavedCost)} and ${formatDays(sched.daysSavedByDroppingOptional)}.`);
  }

  points.push(`Budget: ${formatINR(fin.originalBudget)} → ${formatINR(fin.projectedBudget)}. Timeline: ${formatDays(sched.originalDurationDays)} → ${formatDays(sched.projectedDurationDays)}.`);

  const overBudget = Number(fin.netBudgetDelta) > 0;
  const late = Number(sched.netDaysDelta) > 0;
  let outcome;
  if (!overBudget && !late) {
    outcome = { tone: 'good', text: 'Overall this stays within the agreed budget and timeline.' };
  } else {
    const parts = [];
    if (overBudget) parts.push(`${formatINR(fin.netBudgetDelta)} over budget`);
    if (late) parts.push(`${formatDays(sched.netDaysDelta)} late`);
    outcome = { tone: 'bad', text: `Overall this would be ${listOf(parts)}.` };
  }

  // Suggest one optional extra that best offsets the overrun (smallest one that covers it, else the biggest).
  let tip = null;
  const available = (sim.candidateTradeOffs || []).filter((c) => !(sim.appliedDropIds || []).includes(c.taskId));
  if ((overBudget || late) && available.length) {
    const need = Number(fin.netBudgetDelta);
    const sorted = [...available].sort((a, b) => Number(a.savedCost) - Number(b.savedCost));
    const pick = sorted.find((c) => Number(c.savedCost) >= need) || sorted[sorted.length - 1];
    tip = `Tip: removing ${pick.title} would save ${formatINR(pick.savedCost)} and ${formatDays(pick.savedDays)}.`;
  }

  return { headline, points, outcome, tip };
}
