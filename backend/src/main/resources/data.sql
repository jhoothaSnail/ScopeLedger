-- ScopeLedger 8-task demo seed. Tasks 101-104 and edges 501-502 match the frozen
-- Day-1 contract in PLAN.md exactly; the rest extend the demo graph.

INSERT INTO projects (id, name, baseline_budget, baseline_duration_days, rework_penalty_rate)
VALUES (1, 'E-Commerce Checkout & Auth System', 100000.00, 20, 0.25);

INSERT INTO deliverable_tasks
    (id, project_id, title, status, estimated_hours, hourly_rate, duration_days, is_optional, is_active, pos_x, pos_y)
VALUES
    (101, 1, 'MySQL Schema Design',         'COMPLETED',   20, 1000.00, 3, FALSE, TRUE,  100, 180),
    (102, 1, 'Email Login API',             'COMPLETED',   24, 1000.00, 4, FALSE, TRUE,  440, 180),
    (103, 1, 'Order & Checkout Service',    'IN_PROGRESS', 32, 1000.00, 5, FALSE, TRUE,  780, 180),
    (104, 1, 'PDF Invoice Template',        'NOT_STARTED', 16, 1000.00, 3, TRUE,  TRUE, 1120, 370),
    (105, 1, 'Payment Gateway Integration', 'NOT_STARTED', 24, 1000.00, 4, FALSE, TRUE, 1120, 180),
    (106, 1, 'Admin Analytics Dashboard',   'NOT_STARTED', 20, 1000.00, 3, TRUE,  TRUE,  440, 370),
    (107, 1, 'Email Notification Service',  'NOT_STARTED', 12, 1000.00, 2, TRUE,  TRUE,  780, 560),
    (108, 1, 'QA & UAT Sign-off',           'NOT_STARTED', 16, 1000.00, 3, FALSE, TRUE, 1460, 180);

INSERT INTO task_dependencies (id, project_id, prerequisite_task_id, dependent_task_id)
VALUES
    (501, 1, 101, 102),
    (502, 1, 102, 103),
    (503, 1, 103, 104),
    (504, 1, 103, 105),
    (505, 1, 105, 108),
    (506, 1, 101, 106),
    (507, 1, 102, 107);
