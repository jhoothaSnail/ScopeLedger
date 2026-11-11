// frontend/src/content/glossary.js
// Single source of user-facing wording. Business language first; every term has a
// one-line explanation used in tooltips, the legend and the guided tour.

export const STATUS = {
  COMPLETED: { label: 'Done', help: 'This work is finished. If something it depends on changes, part of it must be redone.' },
  IN_PROGRESS: { label: 'In progress', help: 'Work has started. Upstream changes mean some of it must be redone.' },
  NOT_STARTED: { label: 'Not started', help: 'No work done yet, so upstream changes cost nothing extra here.' },
};

export const IMPACT = {
  DIRECT_CHANGE: { label: 'Requested change', help: 'The task the client wants to change. Its extra hours are charged directly.' },
  DOWNSTREAM_REWORK: { label: 'Needs rework', help: 'Already done or underway, and it depends on the changed task — so part of it must be redone.' },
  DROPPED: { label: 'Removed from scope', help: 'An optional extra taken out of the plan to save money and time.' },
};

export const OPTIONAL = {
  label: 'Optional',
  help: 'A nice-to-have extra. If it has not started, it can be removed to save money and time.',
};

export const METRICS = {
  agreedBudget: { label: 'Agreed budget', help: 'The budget currently agreed with the client, including changes already approved.' },
  budgetAfter: { label: 'Budget after this change', help: 'What the budget would become if the change you are exploring is approved.' },
  agreedTimeline: { label: 'Agreed timeline', help: 'Working days currently agreed to deliver the whole project.' },
  timelineAfter: { label: 'Timeline after this change', help: 'How long the project would take if the change you are exploring is approved.' },
  redoCost: {
    label: 'Rework rate',
    help: 'When a finished or in-progress task is affected by a change, this share of its hours has to be redone.',
  },
  progress: { label: 'Progress', help: 'How many tasks are done, in progress, or not started yet.' },
};

export const statusLabel = (status) => STATUS[status]?.label ?? status;
