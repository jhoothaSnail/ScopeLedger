-- ScopeLedger schema (MySQL 8 + H2 MySQL-mode compatible).
-- Re-run on every startup and by POST /api/v1/demo/reset, so tables are dropped first
-- in reverse foreign-key order.

DROP TABLE IF EXISTS change_order_logs;
DROP TABLE IF EXISTS task_dependencies;
DROP TABLE IF EXISTS deliverable_tasks;
DROP TABLE IF EXISTS projects;

CREATE TABLE projects (
    id                     BIGINT         NOT NULL AUTO_INCREMENT,
    name                   VARCHAR(200)   NOT NULL,
    baseline_budget        DECIMAL(14, 2) NOT NULL,
    baseline_duration_days INT            NOT NULL,
    rework_penalty_rate    DECIMAL(5, 4)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT chk_projects_rate CHECK (rework_penalty_rate >= 0 AND rework_penalty_rate <= 1)
);

CREATE TABLE deliverable_tasks (
    id              BIGINT         NOT NULL AUTO_INCREMENT,
    project_id      BIGINT         NOT NULL,
    title           VARCHAR(200)   NOT NULL,
    status          VARCHAR(20)    NOT NULL DEFAULT 'NOT_STARTED',
    estimated_hours DECIMAL(10, 2) NOT NULL,
    hourly_rate     DECIMAL(12, 2) NOT NULL,
    duration_days   INT            NOT NULL,
    is_optional     BOOLEAN        NOT NULL DEFAULT FALSE,
    is_active       BOOLEAN        NOT NULL DEFAULT TRUE,
    pos_x           INT            NOT NULL DEFAULT 0,
    pos_y           INT            NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT fk_tasks_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT chk_tasks_status CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'))
);
CREATE INDEX idx_tasks_project ON deliverable_tasks (project_id);

CREATE TABLE task_dependencies (
    id                   BIGINT NOT NULL AUTO_INCREMENT,
    project_id           BIGINT NOT NULL,
    prerequisite_task_id BIGINT NOT NULL,
    dependent_task_id    BIGINT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_deps_project      FOREIGN KEY (project_id)           REFERENCES projects (id)          ON DELETE CASCADE,
    CONSTRAINT fk_deps_prerequisite FOREIGN KEY (prerequisite_task_id) REFERENCES deliverable_tasks (id) ON DELETE CASCADE,
    CONSTRAINT fk_deps_dependent    FOREIGN KEY (dependent_task_id)    REFERENCES deliverable_tasks (id) ON DELETE CASCADE,
    CONSTRAINT uq_deps_edge UNIQUE (prerequisite_task_id, dependent_task_id),
    CONSTRAINT chk_deps_no_self_loop CHECK (prerequisite_task_id <> dependent_task_id)
);
CREATE INDEX idx_deps_project ON task_dependencies (project_id);

-- Immutable audit log of approved change orders (append-only by convention).
CREATE TABLE change_order_logs (
    id                 BIGINT         NOT NULL AUTO_INCREMENT,
    project_id         BIGINT         NOT NULL,
    target_task_id     BIGINT         NOT NULL,
    change_description VARCHAR(500)   NOT NULL,
    net_cost_delta     DECIMAL(14, 2) NOT NULL,
    net_days_delta     INT            NOT NULL,
    dropped_tasks_json TEXT,
    committed_at       DATETIME       NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_logs_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);
CREATE INDEX idx_logs_project ON change_order_logs (project_id);
