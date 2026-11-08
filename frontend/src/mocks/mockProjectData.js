// frontend/src/mocks/mockProjectData.js
// Contract A, B, C payloads representing the canonical 8-node/4-node scope state

export const MOCK_PROJECT_BOARD = {
  projectId: 1,
  name: "E-Commerce Checkout & Auth System",
  baselineBudget: 100000.00,
  baselineDurationDays: 20,
  reworkPenaltyRate: 0.25,
  // Mirrors backend/src/main/resources/data.sql exactly (8 tasks, 7 links).
  tasks: [
    {
      id: 101,
      title: "MySQL Schema Design",
      status: "COMPLETED",
      estimatedHours: 20,
      hourlyRate: 1000.00,
      durationDays: 3,
      isOptional: false,
      isActive: true,
      posX: 100,
      posY: 180
    },
    {
      id: 102,
      title: "Email Login API",
      status: "COMPLETED",
      estimatedHours: 24,
      hourlyRate: 1000.00,
      durationDays: 4,
      isOptional: false,
      isActive: true,
      posX: 440,
      posY: 180
    },
    {
      id: 103,
      title: "Order & Checkout Service",
      status: "IN_PROGRESS",
      estimatedHours: 32,
      hourlyRate: 1000.00,
      durationDays: 5,
      isOptional: false,
      isActive: true,
      posX: 780,
      posY: 180
    },
    {
      id: 104,
      title: "PDF Invoice Template",
      status: "NOT_STARTED",
      estimatedHours: 16,
      hourlyRate: 1000.00,
      durationDays: 3,
      isOptional: true,
      isActive: true,
      posX: 1120,
      posY: 370
    },
    {
      id: 105,
      title: "Payment Gateway Integration",
      status: "NOT_STARTED",
      estimatedHours: 24,
      hourlyRate: 1000.00,
      durationDays: 4,
      isOptional: false,
      isActive: true,
      posX: 1120,
      posY: 180
    },
    {
      id: 106,
      title: "Admin Analytics Dashboard",
      status: "NOT_STARTED",
      estimatedHours: 20,
      hourlyRate: 1000.00,
      durationDays: 3,
      isOptional: true,
      isActive: true,
      posX: 440,
      posY: 370
    },
    {
      id: 107,
      title: "Email Notification Service",
      status: "NOT_STARTED",
      estimatedHours: 12,
      hourlyRate: 1000.00,
      durationDays: 2,
      isOptional: true,
      isActive: true,
      posX: 780,
      posY: 560
    },
    {
      id: 108,
      title: "QA & UAT Sign-off",
      status: "NOT_STARTED",
      estimatedHours: 16,
      hourlyRate: 1000.00,
      durationDays: 3,
      isOptional: false,
      isActive: true,
      posX: 1460,
      posY: 180
    }
  ],
  dependencies: [
    { id: 501, prerequisiteTaskId: 101, dependentTaskId: 102 },
    { id: 502, prerequisiteTaskId: 102, dependentTaskId: 103 },
    { id: 503, prerequisiteTaskId: 103, dependentTaskId: 104 },
    { id: 504, prerequisiteTaskId: 103, dependentTaskId: 105 },
    { id: 505, prerequisiteTaskId: 105, dependentTaskId: 108 },
    { id: 506, prerequisiteTaskId: 101, dependentTaskId: 106 },
    { id: 507, prerequisiteTaskId: 102, dependentTaskId: 107 }
  ]
};

export const MOCK_CHANGE_ORDERS = [
  {
    id: 1,
    projectId: 1,
    targetTaskId: 102,
    targetTaskTitle: "Email Login API",
    changeDescription: "Switch Email Login to WhatsApp OTP Login",
    netCostDelta: 4000.00,
    netDaysDelta: 0,
    droppedTasksJson: "[104]",
    committedAt: "2026-11-07T14:32:00"
  }
];
