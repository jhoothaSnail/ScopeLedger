// frontend/src/content/tourSteps.js
// Guided tour scripts, one per role. `page` switches screens; `target` matches a [data-tour]
// attribute. A missing target falls back to a centred card, so the tour never breaks.

const glance = {
  page: 'overview',
  target: 'overview-health',
  title: 'Your project at a glance',
  body: 'These cards show the agreed budget and timeline, how far along the work is, and how much the optional extras could save.',
};
const card = (body) => ({
  page: 'board',
  target: 'task-102',
  title: 'Each card is a piece of work',
  body,
});
const colours = {
  page: 'board',
  target: 'legend',
  title: 'What the colours mean',
  body: 'Red is the task being changed. Amber tasks are already done or underway and would need rework. Removed extras fade out.',
};
const numbers = {
  page: 'board',
  target: 'metrics',
  title: 'The agreed numbers',
  body: 'The agreed budget and timeline live here. While you explore a change, its effect appears right next to them.',
};
const replay = {
  page: 'overview',
  target: 'help-button',
  title: 'Need this again?',
  body: 'Press the ? button at any time to replay this tour.',
};

const CLIENT = [
  glance,
  {
    page: 'overview',
    target: 'overview-explore',
    title: 'Ask for a change',
    body: 'When you need something different, start here. You will see what it costs before anyone agrees to it.',
  },
  card('Click the task you want changed, then choose “Explore a change to this task”. Describe it and enter the extra hours and days.'),
  colours,
  numbers,
  {
    page: 'requests',
    target: 'requests-list',
    title: 'Send it for approval',
    body: 'When the estimate looks right, press “Send for approval”. Your request appears here for the project manager and finance lead, and you can follow its status.',
  },
  replay,
];

const APPROVER = (role) => [
  glance,
  {
    page: 'overview',
    target: 'overview-requests',
    title: 'Requests waiting for you',
    body: 'When a client asks for a change, it shows up here with its estimated cost.',
  },
  {
    page: 'requests',
    target: 'requests-list',
    title: 'Review and decide',
    body: 'Approve or reject each request, with an optional note. Approving recalculates the cost on the current plan and updates the budget and timeline.',
  },
  card('You can also explore a change yourself: click a task, choose “Explore a change to this task”, then approve it directly.'),
  colours,
  role === 'Project Manager'
    ? {
      page: 'board',
      target: 'add-task',
      title: 'Keep the plan up to date',
      body: 'Add new tasks or link tasks that depend on each other. Links that would create a loop are blocked.',
    }
    : numbers,
  {
    page: 'board',
    target: 'nav-changeorders',
    title: 'Every approved change is recorded',
    body: 'The change history lists each approved change with its cost, extra days and any extras removed.',
  },
  replay,
];

const TEAM = [
  glance,
  card('Click a task to see what it needs and what depends on it. Keep its progress up to date there — Not started, In progress or Done — because finished and in-progress work is what needs redoing when something upstream changes.'),
  {
    page: 'board',
    title: 'Flag extra work',
    body: 'Found that a task needs more time than planned? Choose “Explore a change”, enter the extra hours and days, press “Update estimate” and then “Send for approval”. The project manager or finance lead decides.',
  },
  colours,
  numbers,
  {
    page: 'requests',
    target: 'requests-list',
    title: 'What has been asked for',
    body: 'Requests from you and the client, and the decisions on them, appear here, so you know what is coming.',
  },
  replay,
];

// Built once: the tour compares step objects between renders, so they must keep their identity.
const BY_ROLE = {
  Client: CLIENT,
  'Project Manager': APPROVER('Project Manager'),
  'Finance Lead': APPROVER('Finance Lead'),
};

/** Tour steps for the signed-in person's role (Team Member and unknown roles get the team tour). */
export function getTourSteps(role) {
  return BY_ROLE[role] || TEAM;
}
