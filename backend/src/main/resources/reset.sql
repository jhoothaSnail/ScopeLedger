-- Used ONLY by POST /api/v1/demo/reset: wipes every table (reverse foreign-key order).
-- The controller then re-runs schema.sql and data.sql to restore the sample project.
DROP TABLE IF EXISTS change_order_logs;
DROP TABLE IF EXISTS task_dependencies;
DROP TABLE IF EXISTS deliverable_tasks;
DROP TABLE IF EXISTS projects;
