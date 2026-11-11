// frontend/src/content/tourSteps.js
// Guided tour script. `page` switches screens; `target` matches a [data-tour] attribute.
// A missing target falls back to a centred card, so the tour never breaks on data changes.
export const TOUR_STEPS = [
  {
    page: 'overview',
    target: 'overview-health',
    title: 'Your project at a glance',
    body: 'These cards show the agreed budget and timeline, how far along the work is, and how much the optional extras could save.',
  },
  {
    page: 'overview',
    target: 'overview-explore',
    title: 'Start here to explore a change',
    body: 'When a client asks for something different, use this to see what it would really cost before you agree.',
  },
  {
    page: 'board',
    target: 'metrics',
    title: 'The agreed numbers',
    body: 'The agreed budget and timeline live here. While you explore a change, its effect appears right next to them.',
  },
  {
    page: 'board',
    target: 'task-102',
    title: 'Each card is a piece of work',
    body: 'Arrows show which tasks depend on others. Click a task to see its details, then choose “Explore a change to this task”.',
  },
  {
    page: 'board',
    target: 'legend',
    title: 'What the colours mean',
    body: 'Red is the task being changed. Amber tasks are already done or underway and would need rework. Removed extras fade out.',
  },
  {
    page: 'board',
    target: 'history-button',
    title: 'Every approved change is recorded',
    body: 'Approved changes are saved with their cost, extra days and any extras removed — a clear record to share with the client.',
  },
  {
    page: 'board',
    target: null,
    title: 'Try it yourself',
    body: 'Click “Email Login API”, explore a change of 12 hours and 2 days, then switch off “PDF Invoice Template” and watch the budget balance out. You can replay this tour any time from the ? button.',
  },
];
