<h1 align="center">ScopeLedger 🧮</h1>

<p align="center">
  <strong>A DAG-based financial and temporal impact simulator for software project scope management.</strong>
</p>

---

## 📖 1. Executive Summary (For Evaluators & Judges)

**The Real-World Problem:**
In software consulting, "scope creep" is the leading cause of project failure and margin loss. When a client requests a change to an already-approved feature, traditional project management tools (like Jira or Trello) fail to calculate the downstream **ripple effect**. They treat tasks as isolated tickets. In reality, modifying a completed database schema requires rewriting the API, which requires rewriting the frontend.

**The ScopeLedger Solution:**
ScopeLedger models a project not as a list, but as a **Directed Acyclic Graph (DAG)**. It introduces a dry-run simulation engine that allows project managers and clients to visually negotiate changes.
By running a Breadth-First Search (BFS) over the dependency graph, ScopeLedger calculates the exact cost of rework and the schedule delay, empowering clients to dynamically drop "optional" features to balance the budget in real-time.

**Why this is an advanced architecture:**
This system bridges abstract data structures (Graphs, DFS, BFS, Topological constraints) with a concrete, high-stakes business problem (contract negotiation and financial ledgering).

---

## 🤖 2. Domain Context & Business Rules (For AI & LLM Assistants)

*If you are an AI assistant reading this file to gain context for code generation, adhere strictly to the following domain boundaries, definitions, and state machines.*

### 2.1 Core Entities
* **Project:** The root aggregate. Holds the baseline budget, baseline duration, and a global `reworkPenaltyRate` (e.g., `0.25`, meaning 25% of a task's original hours must be redone if an upstream dependency changes).
* **DeliverableTask (Node):** A specific unit of work. Contains estimated hours, hourly rate, physical X/Y canvas coordinates for the UI, and an `isOptional` boolean flag.
* **TaskDependency (Edge):** A directed link indicating execution order. `prerequisiteTaskId` -> `dependentTaskId`.
* **ChangeOrderLog:** An immutable, timestamped record of an approved scope change and its financial delta.

### 2.2 The Task Lifecycle (State Machine)
Tasks strictly follow this state progression: `NOT_STARTED` -> `IN_PROGRESS` -> `COMPLETED`.
* **Rule A:** A task's state cannot be manually rolled back.
* **Rule B:** If a task is `COMPLETED` or `IN_PROGRESS`, the client has "spent" that budget. These tasks **cannot** be dropped or marked as inactive to save money.

### 2.3 The "Safe-to-Drop" Heuristic
A task can only be offered to the client as a budget-saving trade-off if it meets **all** of the following conditions:
1. `isOptional == true` (It is a non-core business requirement).
2. `status == NOT_STARTED` (No money/time has been spent on it yet).
3. **Out-Degree Constraint:** It has zero active downstream dependent tasks. (If Task B depends on Task A, Task A cannot be dropped unless Task B is also dropped).

---

## ⚙️ 3. Algorithmic Architecture

ScopeLedger relies on two primary graph traversal engines running in the Java Spring Boot backend.

### Engine A: The Cycle Preventer (Depth-First Search)
A project schedule cannot contain time paradoxes.
* **Trigger:** When a user attempts to draw a dependency arrow from `Task X` to `Task Y`.
* **Execution:** Before saving to MySQL, the backend initiates a **Depth-First Search (DFS)** starting from `Task Y`.
* **Validation:** If the traversal encounters `Task X`, a cycle exists (`X -> Y -> ... -> X`). The API aborts the transaction, returns HTTP 400, and prevents graph corruption.

### Engine B: The Ripple Calculator (Breadth-First Search)
This is the core financial engine. It calculates the collateral damage of a change order without altering the live database.
* **Trigger:** The client inputs a requested change (e.g., "+10 hours to Task A").
* **Execution:**
    1. The backend applies the direct cost to Task A.
    2. It initiates a **Breadth-First Search (BFS)** exploring all outward edges from Task A.
    3. For every downstream task encountered, it checks the State Machine. If the downstream task is `COMPLETED` or `IN_PROGRESS`, it applies the `reworkPenaltyRate` (e.g., adding 2.5 hours of rework).
* **Output:** It aggregates the total direct cost, total rework cost, and total days delayed, returning a comprehensive financial forecast to the React frontend.

---

## 🗄️ 4. Conceptual Data Model (Relational Schema)

The MySQL database utilizes an Adjacency List model to persist the graph.

    [ projects ]
    - id (PK)
    - name
    - baseline_budget
    - baseline_duration_days
    - rework_penalty_rate (DECIMAL)

    [ deliverable_tasks ]
    - id (PK)
    - project_id (FK)
    - title
    - status (ENUM: NOT_STARTED, IN_PROGRESS, COMPLETED)
    - estimated_hours
    - hourly_rate
    - is_optional (BOOLEAN)
    - is_active (BOOLEAN)

    [ task_dependencies ]
    - id (PK)
    - project_id (FK)
    - prerequisite_task_id (FK -> deliverable_tasks.id)
    - dependent_task_id (FK -> deliverable_tasks.id)

*Crucial Constraint for Code Generation:* The backend must map these relational entities into flat DTOs (Data Transfer Objects) before returning JSON. Returning raw JPA entities will cause infinite recursion loops via Jackson serialization due to the graph's bidirectional nature.

---

## 🖥️ 5. The User Interface (React + SVG)

The frontend is a custom-built interactive workspace that avoids heavy charting libraries in favor of raw DOM manipulation:
1. **The Canvas:** Renders Task Cards as standard HTML `<div>` elements absolutely positioned based on database coordinates.
2. **The Connectors:** An underlaid HTML5 `<svg>` element draws Bezier curves (`<path>`) representing the `task_dependencies`.
3. **The Simulator Overlay:** When the BFS engine returns a change simulation, the UI dynamically injects CSS classes into the DOM:
    * **Directly Changed Node:** Pulses with a red border.
    * **Downstream Rework Nodes:** Glow with an amber border.
    * **Trade-Off Nodes:** Fade to 40% opacity when toggled off.

---

## 🚀 6. Running the System Locally

### Backend (Spring Boot 3.x / Java 21)
The backend is designed for zero-friction setup. It uses Spring Boot's schema.sql and data.sql to automatically construct the relational schema and seed an 8-node sample project on startup.

    cd backend
    export DB_USER=root
    export DB_PASS=yourpassword
    ./mvnw spring-boot:run 

### Frontend (React / Vite)

    cd frontend
    npm install
    npm run dev
    # Application boots in ~300ms at http://localhost:5173
```eof

The file is ready! By removing the nested code block markers, it should now render properly as one cohesive file in your interface. Let me know if you need any further refinements. hours to Task A").
* **Execution:**
    1. The backend applies the direct cost to Task A.
    2. It initiates a **Breadth-First Search (BFS)** exploring all outward edges from Task A.
    3. For every downstream task encountered, it checks the State Machine. If the downstream task is `COMPLETED` or `IN_PROGRESS`, it applies the `reworkPenaltyRate` (e.g., adding 2.5 hours of rework).
* **Output:** It aggregates the total direct cost, total rework cost, and total days delayed, returning a comprehensive financial forecast to the React frontend.

---

## 🗄️ 4. Conceptual Data Model (Relational Schema)

The MySQL database utilizes an Adjacency List model to persist the graph.

    [ projects ]
    - id (PK)
    - name
    - baseline_budget
    - baseline_duration_days
    - rework_penalty_rate (DECIMAL)

    [ deliverable_tasks ]
    - id (PK)
    - project_id (FK)
    - title
    - status (ENUM: NOT_STARTED, IN_PROGRESS, COMPLETED)
    - estimated_hours
    - hourly_rate
    - is_optional (BOOLEAN)
    - is_active (BOOLEAN)

    [ task_dependencies ]
    - id (PK)
    - project_id (FK)
    - prerequisite_task_id (FK -> deliverable_tasks.id)
    - dependent_task_id (FK -> deliverable_tasks.id)

*Crucial Constraint for Code Generation:* The backend must map these relational entities into flat DTOs (Data Transfer Objects) before returning JSON. Returning raw JPA entities will cause infinite recursion loops via Jackson serialization due to the graph's bidirectional nature.

---

## 🖥️ 5. The User Interface (React + SVG)

The frontend is a custom-built interactive workspace that avoids heavy charting libraries in favor of raw DOM manipulation:
1. **The Canvas:** Renders Task Cards as standard HTML `<div>` elements absolutely positioned based on database coordinates.
2. **The Connectors:** An underlaid HTML5 `<svg>` element draws Bezier curves (`<path>`) representing the `task_dependencies`.
3. **The Simulator Overlay:** When the BFS engine returns a change simulation, the UI dynamically injects CSS classes into the DOM:
    * **Directly Changed Node:** Pulses with a red border.
    * **Downstream Rework Nodes:** Glow with an amber border.
    * **Trade-Off Nodes:** Fade to 40% opacity when toggled off.

---

## 🚀 6. Running the System Locally

### Backend (Spring Boot 3.x / Java 21)
The backend is designed for zero-friction setup. It uses Spring Boot's schema.sql and data.sql to automatically construct the relational schema and seed an 8-node sample project on startup.

    cd backend
    export DB_USER=root
    export DB_PASS=yourpassword
    ./mvnw spring-boot:run 

### Frontend (React / Vite)

    cd frontend
    npm install
    npm run dev
    # Application boots in ~300ms at http://localhost:5173
```eof

The file is ready! By removing the nested code block markers, it should now render properly as one cohesive file in your interface. Let me know if you need any further refinements.