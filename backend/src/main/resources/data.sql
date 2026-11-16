-- ScopeLedger 8-task demo seed. Each task has its own hourly rate (senior backend work costs
-- more than templating or QA). Planned work totals Rs 2,14,400 against an agreed budget of Rs 2,20,000.

INSERT INTO projects (id, name, baseline_budget, baseline_duration_days, rework_penalty_rate)
VALUES (1, 'E-Commerce Checkout & Auth System', 220000.00, 20, 0.25);

INSERT INTO deliverable_tasks
    (id, project_id, title, status, estimated_hours, hourly_rate, duration_days, is_optional, is_active, pos_x, pos_y)
VALUES
    (101, 1, 'MySQL Schema Design',         'COMPLETED',   20, 1200.00, 3, FALSE, TRUE,  100, 180),
    (102, 1, 'Email Login API',             'COMPLETED',   24, 1500.00, 4, FALSE, TRUE,  440, 180),
    (103, 1, 'Order & Checkout Service',    'IN_PROGRESS', 32, 1800.00, 5, FALSE, TRUE,  780, 180),
    (104, 1, 'PDF Invoice Template',        'NOT_STARTED', 16, 800.00, 3, TRUE,  TRUE, 1120, 370),
    (105, 1, 'Payment Gateway Integration', 'NOT_STARTED', 24, 2000.00, 4, FALSE, TRUE, 1120, 180),
    (106, 1, 'Admin Analytics Dashboard',   'NOT_STARTED', 20, 900.00, 3, TRUE,  TRUE,  440, 370),
    (107, 1, 'Email Notification Service',  'NOT_STARTED', 12, 700.00, 2, TRUE,  TRUE,  780, 560),
    (108, 1, 'QA & UAT Sign-off',           'NOT_STARTED', 16, 600.00, 3, FALSE, TRUE, 1460, 180);

INSERT INTO task_dependencies (id, project_id, prerequisite_task_id, dependent_task_id)
VALUES
    (501, 1, 101, 102),
    (502, 1, 102, 103),
    (503, 1, 103, 104),
    (504, 1, 103, 105),
    (505, 1, 105, 108),
    (506, 1, 101, 106),
    (507, 1, 102, 107);
