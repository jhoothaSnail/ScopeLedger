# ScopeLedger — 3-Developer Execution & Architecture Plan (`PLAN.md`)

**Project:** ScopeLedger — Deliverable Dependency & Change-Order Impact Calculator  
**Team Size:** 3 Developers (`Dev 1`, `Dev 2`, `Dev 3`)  
**Strict Tech Stack:**
- **Frontend:** HTML5, CSS3, React (Pure ES6 JavaScript, scaffolded via Vite)
- **Backend:** Java (JDK 21) + Spring Boot 3.x (`Spring Web`, `Spring Data JPA`)
- **Database:** MySQL 8.0
- **Communication:** REST API via JSON (using native browser `fetch()`)

---

## 0. Meta-Critique & Architectural Refinements

Before writing code, four practical safeguards have been built into this plan to prevent common 3-person student team failures:

1. **Eliminating the "Idle Database Member" Bottleneck:** Splitting a 3-person team into *1 Frontend, 1 Backend, 1 Database* causes the Database person to finish on Day 2 while the other two get overloaded. Instead, work is split into **three balanced tracks**:
   - **Dev 1 (Backend Core & MySQL Architect):** MySQL schema, auto-seed scripts, Task/Dependency CRUD APIs, and the Java Circular-Dependency Validator.
   - **Dev 2 (Backend Simulation Engine + Sandbox Bridge):** Java Ripple-Impact & Rework Calculator, Change-Order Commit Transaction API, and the isolated React `<TradeOffSandbox />` panel.
   - **Dev 3 (Frontend Lead & Interactive SVG Board):** React application layout, HTML5/CSS3/SVG Dependency Board, Domino Ripple Highlighter, and Task Creation Modals.
2. **Preventing Infinite Loops in Task Dependencies (Cycle Detection):** Because ScopeLedger connects tasks with arrows (`Task 1 → Task 2`), an accidental loop (`Task 1 → Task 2 → Task 1`) would crash Spring Boot with a `StackOverflowError`. Dev 1 will implement a Depth-First Search (DFS) check before inserting any dependency row.
3. **Zero-Setup Database Seeding (`schema.sql` + `data.sql`):** Instead of sharing manual SQL exports over WhatsApp, Spring Boot will automatically create the tables and seed the 8-task demo project every time the Java application starts.
4. **Clear Domain Naming (`DeliverableTask` & `TaskDependency`):** All classes and tables use business-friendly terms (`DeliverableTask`, `TaskDependency`, `ChangeOrderLog`) so every team member can explain the architecture clearly during the evaluation viva.

> 💡 **Why this matters:** Evaluators award 10/10 when every team member owns an identifiable algorithm or UI subsystem, and when the live demo works reliably without database setup issues.

---

## 1. Pre-Requisites & Day-Zero Alignment

### 1.1 Local Machine Setup (Identical Across All 3 Laptops)

| Tool | Purpose in Our Stack | Version | Verification Command |
| :--- | :--- | :--- | :--- |
| **Java JDK** | Compiles and runs the **Spring Boot** backend | **JDK 21 LTS** | `java -version` |
| **Maven Wrapper** | Builds Spring Boot and manages Java dependencies | Included in repo (`./mvnw`) | `./mvnw -version` |
| **MySQL Server** | Relational database storing projects, tasks, and logs | **MySQL 8.0+** | `mysql -u root -p` |
| **Vite / npm** | Runs the **React (HTML5/CSS3/JS)** frontend dev server only | Node 20 LTS (for `npm` CLI only) | `npm -v` |
| **Postman** | Tests Spring Boot REST APIs independently of React | Latest Desktop App | Import shared JSON collection |

**One-Time MySQL Database Creation (Run on all 3 laptops):**
```sql
CREATE DATABASE IF NOT EXISTS scopeledger_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

### 1.2 Git Workflow (Zero-Conflict Protocol for 3 Developers)

We use a single **Monorepo** containing `/backend` (Spring Boot) and `/frontend` (React) so all code stays synchronized in one repository.

* **Branch Strategy:**
  * `main` — Protected production branch. Only merge here before milestone demos.
  * `dev` — Shared integration branch. All feature branches merge into `dev` via Pull Request.
  * `feat/dev1-task-crud-dag` — Dev 1's isolated branch.
  * `feat/dev2-ripple-engine` — Dev 2's isolated branch.
  * `feat/dev3-react-board` — Dev 3's isolated branch.
* **Daily Sync Rule (Run every morning before coding):**
  ```bash
  git checkout feat/your-branch-name
  git pull origin dev
  ```
* **Root `.gitignore` (Commit on Day 0 before adding code):**
  ```gitignore
  # Java / Spring Boot
  backend/target/
  backend/.mvn/wrapper/maven-wrapper.jar
  *.class
  *.jar

  # React / Vite Frontend
  frontend/node_modules/
  frontend/dist/
  frontend/.env.local

  # IDE & OS files
  .idea/
  .vscode/
  *.iml
  .DS_Store
  Thumbs.db
  ```

---

### 1.3 The Decoupling Strategy (The Day-1 REST JSON Contract)

On Day 1, all 3 developers lock the exact JSON contracts below.
* **Dev 3 (Frontend)** copies these JSON payloads into `frontend/src/mocks/mockProjectData.js` and builds the entire React UI with `USE_MOCK_API = true`.
* **Dev 1 & Dev 2 (Spring Boot)** build the Java Controllers and Services to produce these exact JSON structures, verifying them in Postman.

#### Contract A: `GET /api/v1/projects/{projectId}/board`
Fetches project baseline totals, all deliverable tasks, and all dependency links.
```json
{
  "projectId": 1,
  "name": "E-Commerce Checkout & Auth System",
  "baselineBudget": 100000.00,
  "baselineDurationDays": 20,
  "reworkPenaltyRate": 0.25,
  "tasks": [
    {
      "id": 101,
      "title": "MySQL Schema Design",
      "status": "COMPLETED",
      "estimatedHours": 20,
      "hourlyRate": 1000.00,
      "durationDays": 3,
      "isOptional": false,
      "isActive": true,
      "posX": 80,
      "posY": 160
    },
    {
      "id": 102,
      "title": "Email Login API",
      "status": "COMPLETED",
      "estimatedHours": 24,
      "hourlyRate": 1000.00,
      "durationDays": 4,
      "isOptional": false,
      "isActive": true,
      "posX": 360,
      "posY": 160
    },
    {
      "id": 103,
      "title": "Order & Checkout Service",
      "status": "IN_PROGRESS",
      "estimatedHours": 32,
      "hourlyRate": 1000.00,
      "durationDays": 5,
      "isOptional": false,
      "isActive": true,
      "posX": 640,
      "posY": 160
    },
    {
      "id": 104,
      "title": "PDF Invoice Template",
      "status": "NOT_STARTED",
      "estimatedHours": 16,
      "hourlyRate": 1000.00,
      "durationDays": 3,
      "isOptional": true,
      "isActive": true,
      "posX": 640,
      "posY": 320
    }
  ],
  "dependencies": [
    { "id": 501, "prerequisiteTaskId": 101, "dependentTaskId": 102 },
    { "id": 502, "prerequisiteTaskId": 102, "dependentTaskId": 103 }
  ]
}
```

#### Contract B: `POST /api/v1/projects/{projectId}/change-orders/simulate`
Dry-run simulation in Spring Boot (calculates ripple cost and schedule delay without overwriting MySQL data).

**Request JSON:**
```json
{
  "targetTaskId": 102,
  "changeDescription": "Switch Email Login to WhatsApp OTP Login",
  "addedHours": 12,
  "addedDays": 2,
  "droppedOptionalTaskIds": [104]
}
```

**Response JSON:**
```json
{
  "targetTaskId": 102,
  "impactedTasks": [
    {
      "taskId": 102,
      "title": "Email Login API",
      "impactType": "DIRECT_CHANGE",
      "extraHours": 12.0,
      "extraCost": 12000.00,
      "delayDays": 2
    },
    {
      "taskId": 103,
      "title": "Order & Checkout Service",
      "impactType": "DOWNSTREAM_REWORK",
      "extraHours": 8.0,
      "extraCost": 8000.00,
      "delayDays": 1
    }
  ],
  "financialSummary": {
    "originalBudget": 100000.00,
    "changeAndReworkCost": 20000.00,
    "optionalTasksSavedCost": 16000.00,
    "projectedBudget": 104000.00,
    "netBudgetDelta": 4000.00
  },
  "scheduleSummary": {
    "originalDurationDays": 20,
    "grossDelayDays": 3,
    "daysSavedByDroppingOptional": 3,
    "projectedDurationDays": 20,
    "netDaysDelta": 0
  }
}
```

#### Contract C: `POST /api/v1/projects/{projectId}/change-orders/commit`
Accepts the same request JSON as `/simulate`, executes an `@Transactional` update in MySQL (updates task hours/durations, marks dropped optional tasks `isActive = false`, and saves a row in `change_order_logs`), and returns the updated board.

> 💡 **Why this matters:** Because these three JSON shapes are frozen on Day 1, Dev 3 never waits for Spring Boot endpoints to be written, and Dev 1 & Dev 2 never wait for React forms to test their Java logic.

---

## 2. Work Division & Responsibilities Matrix

| Dimension | Dev 1: Backend Core & MySQL Architect | Dev 2: Simulation Engine & Sandbox Bridge | Dev 3: Frontend Lead & SVG Board |
| :--- | :--- | :--- | :--- |
| **Primary Domain** | MySQL Schema, JPA Entities, Task/Dependency CRUD, DFS Circular-Link Validator | Java BFS Ripple & Rework Calculator, Change-Order Commit API, React `<TradeOffSandbox />` | React App Shell, Pure HTML5/CSS3/SVG Dependency Board, Visual Ripple Highlighting |
| **Phase 1 (100% Autonomous)** | Write `schema.sql`, `data.sql`, JPA Repositories, `ProjectBoardController`, and `CycleDetectionService.java`. Test in Postman. | Write `RippleSimulationService.java` (tested with JUnit) + build `<TradeOffSandbox.jsx>` against mock data. | Build `<DependencyBoardCanvas.jsx>`, `<TaskCard.jsx>`, and `<MetricsBanner.jsx>` using `mockProjectData.js`. |
| **Phase 2 (Integration)** | Connect `CycleDetectionService` to `POST /dependencies` and provide repository access to Dev 2. | Wire `ChangeOrderController.java` (`/simulate` and `/commit`) to MySQL and integrate `<TradeOffSandbox.jsx>` into Workspace. | Switch `USE_MOCK_API = false`; connect task clicks on the board to Dev 2's simulation drawer and highlight impacted tasks. |
| **Phase 3 (Polish & Viva)** | Build `POST /api/v1/demo/reset` to reset MySQL seed data in 1 click during live evaluation. | Build `<ChangeOrderHistoryModal.jsx>` displaying the immutable audit log of approved scope changes. | Add CSS3 pulse animations on red/amber impacted tasks and smooth SVG connector lines. |

---

### Detailed Developer Deliverables

#### Developer 1: Backend Core & MySQL Architect (100% Spring Boot + MySQL)
* **Phase 1 (Autonomous):**
  1. Author `src/main/resources/schema.sql` and `data.sql` for tables: `projects`, `deliverable_tasks`, `task_dependencies`, and `change_order_logs`.
  2. Build JPA Entities (`Project.java`, `DeliverableTask.java`, `TaskDependency.java`, `ChangeOrderLog.java`) and DTO classes.
  3. Implement `CycleDetectionService.java`: when a user links `Task A → Task B`, run a Depth-First Search (DFS) starting at `B`. If `A` is visited, throw `CircularDependencyException` (HTTP `400 Bad Request`).
  4. Build `ProjectBoardController.java` (`GET /board`, `POST /tasks`, `POST /dependencies`, `DELETE /dependencies/{id}`).
* **Phase 2 (Integration):**
  1. Ensure `DeliverableTaskRepository` and `TaskDependencyRepository` expose clean query methods (`findByProjectId`) for Dev 2's simulation engine.
* **Phase 3 (Polish):**
  1. Implement `DemoResetController.java` (`POST /api/v1/demo/reset`) that re-runs the seed script so the team can reset the database between evaluator demos in one click.

#### Developer 2: Backend Simulation Engine & Sandbox Bridge (Spring Boot + React)
* **Phase 1 (Autonomous):**
  1. Implement `RippleSimulationService.java` in Spring Boot:
     * Given `targetTaskId` and `addedHours`, run a Breadth-First Search (BFS) across `task_dependencies` to find all downstream dependent tasks.
     * For every downstream task whose status is `COMPLETED` or `IN_PROGRESS`, calculate rework: `extraHours = task.estimatedHours * project.reworkPenaltyRate`.
     * Subtract the cost and duration of any task IDs listed in `droppedOptionalTaskIds`.
  2. Build `<TradeOffSandbox.jsx>` in React (`frontend/src/components/simulator/`) using mock JSON props so clients can toggle optional tasks on/off and watch budget/day bars update.
* **Phase 2 (Integration):**
  1. Build `ChangeOrderController.java` exposing `POST /simulate` (read-only calculation) and `POST /commit` (`@Transactional` database update + audit log insertion).
  2. Embed `<TradeOffSandbox.jsx>` into Dev 3's `WorkspacePage.jsx`.
* **Phase 3 (Polish):**
  1. Build `GET /api/v1/projects/{projectId}/change-orders` and `<ChangeOrderHistoryModal.jsx>` to show evaluators the persisted history of approved client changes.

#### Developer 3: Frontend Lead & Interactive SVG Board (100% HTML5, CSS3, React JS)
* **Phase 1 (Autonomous):**
  1. Initialize the React app with Vite (`npm create vite@latest frontend -- --template react`), set up pure CSS3 variables in `src/styles/`, and create `src/services/apiClient.js` with `export const USE_MOCK_API = true;`.
  2. Build `<DependencyBoardCanvas.jsx>`: renders standard HTML5 `<div>` task cards positioned at `(posX, posY)` and an underlying `<svg>` layer that draws connecting arrows (`<path>`) between `prerequisiteTaskId` and `dependentTaskId`.
  3. Style the 4 visual states in `board.css`:
     * Normal Task: Clean slate border
     * Direct Change (`DIRECT_CHANGE`): Red border + subtle pulse
     * Downstream Rework (`DOWNSTREAM_REWORK`): Amber border + rework badge
     * Dropped Optional Task: Faded opacity (`0.4`) + strikethrough badge
* **Phase 2 (Integration):**
  1. Flip `USE_MOCK_API = false`, wire the board to `GET /api/v1/projects/1/board`, and pass the clicked task into Dev 2's simulation drawer.
* **Phase 3 (Polish):**
  1. Add an "Add Task / Link Dependency" modal and clean toast notifications when Spring Boot blocks a circular dependency.

---

## 3. Proposed Directory & File Structure

```text
scopeledger/
├── README.md
├── PLAN.md
├── .gitignore
│
├── backend/                                           # 100% Java Spring Boot 3.x
│   ├── pom.xml                                        # Dependencies: spring-boot-starter-web, data-jpa, mysql-connector-j
│   ├── mvnw
│   └── src/main/
│       ├── java/com/scopeledger/
│       │   ├── ScopeLedgerApplication.java
│       │   ├── config/
│       │   │   └── CorsConfig.java                    # Allows React (localhost:5173) to call Spring Boot (localhost:8080)
│       │   ├── controller/
│       │   │   ├── ProjectBoardController.java        # Dev 1: GET /board, POST /tasks, POST /dependencies
│       │   │   ├── ChangeOrderController.java         # Dev 2: POST /simulate, POST /commit, GET /change-orders
│       │   │   └── DemoResetController.java           # Dev 1: POST /demo/reset for instant viva reset
│       │   ├── dto/                                   # Plain Java objects for JSON serialization (prevents JPA infinite loops)
│       │   │   ├── ProjectBoardResponseDto.java
│       │   │   ├── TaskDto.java
│       │   │   ├── DependencyDto.java
│       │   │   ├── SimulationRequestDto.java
│       │   │   └── SimulationResponseDto.java
│       │   ├── entity/                                # JPA @Entity classes mapped to MySQL tables
│       │   │   ├── Project.java
│       │   │   ├── DeliverableTask.java
│       │   │   ├── TaskDependency.java
│       │   │   └── ChangeOrderLog.java
│       │   ├── exception/
│       │   │   ├── CircularDependencyException.java
│       │   │   ├── ResourceNotFoundException.java
│       │   │   └── GlobalExceptionHandler.java        # @RestControllerAdvice returning clean JSON error messages
│       │   ├── repository/                            # Spring Data JPA interfaces
│       │   │   ├── ProjectRepository.java
│       │   │   ├── DeliverableTaskRepository.java
│       │   │   ├── TaskDependencyRepository.java
│       │   │   └── ChangeOrderLogRepository.java
│       │   └── service/
│       │       ├── ProjectBoardService.java           # Dev 1: CRUD orchestration
│       │       ├── CycleDetectionService.java         # Dev 1: DFS loop prevention algorithm
│       │       └── RippleSimulationService.java       # Dev 2: BFS domino ripple & rework math engine
│       └── resources/
│           ├── application.properties                 # MySQL connection & auto-seed settings
│           ├── schema.sql                             # Creates MySQL tables automatically
│           └── data.sql                               # Inserts the 8-task demo project
│
└── frontend/                                          # HTML5, CSS3, React (Pure JavaScript)
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── styles/
        │   ├── global.css                             # CSS3 variables, typography, reset
        │   └── board.css                              # SVG connector styles & red/amber ripple animations
        ├── mocks/
        │   └── mockProjectData.js                     # Frozen Day-1 JSON for Phase 1 offline development
        ├── services/
        │   ├── apiClient.js                           # Central fetch() helper with USE_MOCK_API toggle
        │   ├── boardApi.js                            # Functions calling ProjectBoardController
        │   └── changeOrderApi.js                      # Functions calling ChangeOrderController
        ├── components/
        │   ├── layout/
        │   │   ├── TopNavbar.jsx                      # App header + "Reset Demo Data" button
        │   │   └── MetricsBanner.jsx                  # Baseline vs. Projected Budget (₹) & Days bar
        │   ├── board/                                 # Owned by Dev 3 (zero merge conflicts with Dev 2)
        │   │   ├── DependencyBoardCanvas.jsx          # Renders SVG arrows + TaskCard grid
        │   │   ├── TaskCard.jsx                       # Individual deliverable card
        │   │   └── AddTaskDependencyModal.jsx         # Form to add tasks or connect dependency arrows
        │   └── simulator/                             # Owned by Dev 2 (zero merge conflicts with Dev 3)
        │       ├── SimulationDrawer.jsx               # Side panel to input proposed client changes
        │       ├── TradeOffSandbox.jsx                # Toggle switches for optional tasks
        │       └── ChangeOrderHistoryModal.jsx        # Table of committed change orders
        └── pages/
            └── WorkspacePage.jsx                      # Main screen combining Board + Simulator Drawer
```

> 💡 **Why `/dto` is separated from `/entity`:** In Spring Boot JPA, entities with foreign keys (`Project` ↔ `DeliverableTask` ↔ `TaskDependency`) contain bidirectional object references. Returning an `@Entity` directly from a `@RestController` causes Jackson to enter an infinite loop while generating JSON (`StackOverflowError`). Mapping entities to flat DTOs inside the Service layer prevents this completely.

---

## 4. The 5 Rookie Traps & Concrete Preventative Fixes

### Trap 1: Browser CORS Errors Between React (`:5173`) and Spring Boot (`:8080`)
* **The Symptom:** React `fetch()` fails with `Access to fetch at 'http://localhost:8080/api/...' from origin 'http://localhost:5173' has been blocked by CORS policy`.
* **The Fix:** Add this single global `CorsConfig.java` in Spring Boot on Day 1 so all `GET`, `POST`, `PUT`, `DELETE`, and preflight `OPTIONS` requests succeed:
  ```java
  package com.scopeledger.config;

  import org.springframework.context.annotation.Configuration;
  import org.springframework.web.servlet.config.annotation.CorsRegistry;
  import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

  @Configuration
  public class CorsConfig implements WebMvcConfigurer {
      @Override
      public void addCorsMappings(CorsRegistry registry) {
          registry.addMapping("/api/**")
                  .allowedOrigins("http://localhost:5173", "http://localhost:3000")
                  .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                  .allowedHeaders("*");
      }
  }
  ```

### Trap 2: Infinite JSON Recursion in JPA Entities
* **The Symptom:** Calling `GET /api/v1/projects/1/board` throws `HttpMessageNotWritableException: Could not write JSON: Infinite recursion (StackOverflowError)`.
* **The Fix:** Store explicit foreign key columns (`projectId`, `prerequisiteTaskId`, `dependentTaskId`) on `TaskDependency.java` and always return `ProjectBoardResponseDto` (composed of `TaskDto` and `DependencyDto` lists) from your controllers—never raw JPA entities.

### Trap 3: Hardcoded MySQL Passwords Breaking Teammates' Laptops
* **The Symptom:** Dev 1 commits `spring.datasource.password=mySecretPass`, which immediately breaks Dev 2's Spring Boot startup because Dev 2's MySQL password is `root`.
* **The Fix:** Use environment variable placeholders with fallback defaults in `backend/src/main/resources/application.properties`:
  ```properties
  spring.application.name=scopeledger
  server.port=8080

  spring.datasource.url=jdbc:mysql://localhost:3306/scopeledger_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true
  spring.datasource.username=${DB_USER:root}
  spring.datasource.password=${DB_PASS:root}

  spring.jpa.hibernate.ddl-auto=none
  spring.sql.init.mode=always
  spring.sql.init.schema-locations=classpath:schema.sql
  spring.sql.init.data-locations=classpath:data.sql
  ```
  If a teammate has a different MySQL password, they simply set `DB_PASS=theirpassword` in their IDE Run Configuration without ever modifying `application.properties`.

### Trap 4: Unhandled HTTP 400/500 Responses Crashing React into a Blank White Screen
* **The Symptom:** When Spring Boot rejects a circular dependency with HTTP `400`, React tries to treat the error response as a valid board object, fails on `board.tasks.map(...)`, and blanks out the screen during the live demo.
* **The Fix:**
  1. In Spring Boot, return structured JSON errors from `GlobalExceptionHandler.java`:
     ```json
     { "errorCode": "CIRCULAR_DEPENDENCY", "message": "Cannot link Task 103 to Task 101: creates a circular loop." }
     ```
  2. In React (`src/services/apiClient.js`), check `response.ok` before returning data:
     ```javascript
     export const USE_MOCK_API = false;
     const API_BASE = "http://localhost:8080/api/v1";

     export async function apiFetch(endpoint, options = {}) {
       const res = await fetch(`${API_BASE}${endpoint}`, {
         headers: { "Content-Type": "application/json" },
         ...options,
       });
       const payload = await res.json();
       if (!res.ok) {
         throw new Error(payload.message || "Request failed");
       }
       return payload;
     }
     ```

### Trap 5: Git Merge Conflicts from Overlapping File Edits
* **The Symptom:** Two developers edit the same controller or React component simultaneously and spend 2 hours fixing broken merge markers.
* **The Fix:** Follow strict folder ownership:
  * **Dev 1** only edits `ProjectBoardController.java`, `CycleDetectionService.java`, `schema.sql`, and `data.sql`.
  * **Dev 2** only edits `ChangeOrderController.java`, `RippleSimulationService.java`, and `frontend/src/components/simulator/*`.
  * **Dev 3** only edits `frontend/src/components/board/*`, `frontend/src/components/layout/*`, and `frontend/src/styles/*`.

---

## 5. Step-by-Step Milestones & Verification Checklist

### Phase 1: Autonomous Development (Days 1–4)
* [ ] **Dev 1 (Spring Boot + MySQL):** Running `./mvnw spring-boot:run` creates the 4 MySQL tables and populates the 8-task demo project automatically.
* [ ] **Dev 1 (Spring Boot DFS Check):** Sending `POST /api/v1/projects/1/dependencies` in Postman with `{ "prerequisiteTaskId": 103, "dependentTaskId": 101 }` returns HTTP `400 Bad Request` (`CircularDependencyException`).
* [ ] **Dev 2 (Spring Boot BFS Engine):** Unit test on `RippleSimulationService` confirms that adding 12 hours to Task `102` automatically flags downstream Task `103` for 25% rework (+8 hours) and calculates the exact rupee and day delta.
* [ ] **Dev 2 (React Sandbox):** `<TradeOffSandbox.jsx>` renders with mock props and recalculates net cost when optional tasks are toggled off.
* [ ] **Dev 3 (React SVG Board):** With `USE_MOCK_API = true` and Spring Boot turned off, `http://localhost:5173` renders all task cards, SVG dependency arrows, and red/amber ripple highlights.
* **✅ Phase 1 Exit Gate:** Dev 1 and Dev 2 pass all Postman/JUnit checks on Spring Boot, and Dev 3 demonstrates the interactive board in the browser using `mockProjectData.js`.

### Phase 2: Full-Stack Integration (Days 5–7)
* [ ] Set `USE_MOCK_API = false` in `frontend/src/services/apiClient.js`.
* [ ] React loads the live 8-task graph from MySQL via Spring Boot (`GET /api/v1/projects/1/board`).
* [ ] Clicking Task `102` ("Email Login API"), entering `+12 hours / +2 days`, and clicking **Simulate Ripple** triggers `POST /simulate` and highlights Task `102` in red and downstream Task `103` in amber.
* [ ] Unchecking optional Task `104` ("PDF Invoice Template") inside `<TradeOffSandbox />` brings the projected deadline back to 20 days.
* [ ] Clicking **Approve & Commit Change Order** calls `POST /commit`, updates MySQL transactionally, and refreshes the board state.
* **✅ Phase 2 Exit Gate:** The complete 30-second demo flow executes end-to-end across React → Spring Boot → MySQL with zero browser console or Java stack-trace errors.

### Phase 3: Polish & Viva Readiness (Days 8–9)
* [ ] Clicking **Reset Demo Data** in the navbar calls `POST /api/v1/demo/reset` and restores the original 8-task state in under 1 second.
* [ ] Trying to link a downstream task back to an upstream task in the UI displays a clear red banner explaining the circular dependency block.
* [ ] Opening the **Change Order Audit Log** modal displays every committed scope amendment fetched from `change_order_logs`.

---

## 6. How This Plan Secures 10/10 in Evaluation

| Evaluation Criterion | What the Evaluator Sees |
| :--- | :--- |
| **Genuine Novelty** | Instead of a generic Kanban board, the system models contractual scope creep, rework penalties on completed tasks, and client scope trade-offs. |
| **Spring Boot Depth** | Real graph algorithms in Java—**DFS** for cycle prevention and **BFS** for downstream rework propagation—paired with `@Transactional` state commits. |
| **MySQL Relational Design** | Self-referencing dependency links (`prerequisite_task_id` → `dependent_task_id`), immutable audit logging (`change_order_logs`), and automated SQL initialization. |
| **React + HTML5/CSS3 Craft** | Custom SVG dependency arrows layered behind interactive task cards with live red/amber domino highlighting. |
