# 🏗️ Dev 2 — Phase 1 Architectural Audit & Pre-Action Plan

## Repository State Assessment

Every file in Dev 2's ownership domain is currently an **empty skeleton stub** (package declaration + empty class body). Dev 1's entities, repositories, schema/data SQL, and Dev 3's frontend components are similarly empty. This is a true greenfield Phase 1 build with zero runtime dependencies to contend with.

The project uses **Spring Boot 4.1.2** (parent POM — despite PLAN.md saying "3.x"), Java 21, React 19.3, and Vite 8.3.

---

## Part 1: Critical Review & Improvement Suggestions

### 🔴 Critical Issue 1: Floating-Point Monetary Arithmetic

**Problem:** The PLAN.md contract uses `double`-precision fields for money (`hourlyRate: 1000.00`, `baselineBudget: 100000.00`). Using Java `double` or `float` for rupee calculations will cause silent IEEE 754 rounding drift. For example:
```
0.1 + 0.2 == 0.30000000000000004  // in double arithmetic
```
Over a multi-task graph with repeated multiplications (`estimatedHours × hourlyRate × reworkPenaltyRate`), accumulated drift can produce visibly wrong numbers in the UI (e.g., `₹15,999.99` instead of `₹16,000.00`).

**My Fix:** Use `java.math.BigDecimal` with `RoundingMode.HALF_UP` at `scale(2)` for ALL internal financial math inside `RippleSimulationService`. The DTOs will serialize to JSON as plain decimal numbers (Jackson handles `BigDecimal` → `1000.00` natively), preserving exact contract compatibility while eliminating drift.

---

### 🔴 Critical Issue 2: BFS Cycle Safety (Defensive Graph Traversal)

**Problem:** The PLAN assumes Dev 1's DFS cycle detector will prevent all cycles before they enter the database. But during Phase 1 testing (and during potential data corruption scenarios), the BFS traversal in `RippleSimulationService` has **no guard against revisiting nodes**. If a cycle were to exist in the dependency data, the BFS queue would spin indefinitely, causing an OOM crash.

**My Fix:** Maintain a `Set<Long> visited` during BFS traversal. Before enqueuing any downstream task, check `if (visited.contains(taskId)) skip`. This is a zero-cost defensive guard (O(1) HashSet lookup) that makes the engine resilient regardless of whether Dev 1's cycle detection is deployed.

---

### 🟡 Improvement 3: Multi-Path Rework Deduplication

**Problem:** In a diamond dependency pattern (`A → B → D` AND `A → C → D`), when task A is changed, the BFS will discover task D via **both** path B and path C. Without deduplication, task D's rework penalty would be applied **twice**, inflating the cost forecast.

**My Fix:** The BFS `visited` set naturally solves this — each task is processed exactly once, regardless of how many inbound edges lead to it. I will add explicit test coverage for this diamond-dependency scenario.

---

### 🟡 Improvement 4: `addedDays` Delay Propagation Semantics

**Problem:** The PLAN.md contract shows `delayDays: 1` for downstream task 103 when the target task 102 gets `+2 days`. But it's unclear how delay propagation is calculated. Is it:
- **(A)** A flat `ceil(addedDays × reworkPenaltyRate)` per downstream hop?
- **(B)** A fixed `+1 day` per BFS level (hop count)?
- **(C)** Proportional to the rework hours vs. original hours?

**My Decision (matching the contract):** From the sample data: target gets `delayDays: 2` (the user's input), downstream task 103 gets `delayDays: 1`. The rework for task 103 is `32 × 0.25 = 8 hours`. Since the task's original `durationDays` is 5 for 32 hours, the ratio is `8/32 × 5 = 1.25`, rounded down to **1 day**. I will use `ceil(reworkHours / (estimatedHours / durationDays))` — i.e., rework hours divided by the daily work rate of that specific task, ceiling-rounded. This produces the exact contract output and is mathematically defensible.

---

### 🟡 Improvement 5: `droppedOptionalTaskIds` Validation — Out-Degree Constraint

**Problem:** The "Safe-to-Drop" heuristic in README.md §2.3 specifies that a task can only be dropped if it has **zero active downstream dependents**. The current PLAN.md doesn't discuss validating this server-side. If the frontend sends a task ID for dropping that has active dependents, the budget math would be wrong.

**My Fix:** In `RippleSimulationService`, before accepting a task as droppable, I will verify all three conditions:
1. `isOptional == true`
2. `status == NOT_STARTED`
3. No active downstream tasks depend on it (out-degree check against the adjacency list)

If a task fails validation, it will be **silently excluded** from the savings calculation (fail-safe) and flagged in the response, rather than crashing.

---

### 🟡 Improvement 6: TradeOffCandidateDto — Enriched Response

**Problem:** The PLAN.md `SimulationResponseDto` contract only shows `impactedTasks` and summaries, but doesn't include a list of **eligible** trade-off candidates in the response. This means the frontend has no server-authoritative list of which tasks are actually safe to drop — it would have to guess locally.

**My Enhancement:** Add a `tradeOffCandidates` array to the simulation response containing all currently droppable tasks with their savings. This allows `TradeOffSandbox.jsx` to render toggle switches from server-calculated data rather than client-side guesswork.

> [!IMPORTANT]
> This is an additive extension to the contract (new field), not a breaking change. The original `impactedTasks`, `financialSummary`, and `scheduleSummary` fields remain character-for-character identical.

---

### 🟢 Observation 7: Spring Boot Version Mismatch

The `pom.xml` uses `spring-boot-starter-parent:4.1.2` while PLAN.md says "Spring Boot 3.x". Spring Boot 4.x moved some test artifact names (e.g., `spring-boot-starter-data-jpa-test`, `spring-boot-starter-webmvc-test`). Since these are already in the POM, I'll code against the **actual 4.1.2 runtime** without downgrading.

---

## Part 2: Pre-Action Implementation Plan

### Files I Will Create/Overwrite (All Within Dev 2 Domain)

| # | File Path | Action |
|---|-----------|--------|
| 1 | `backend/src/main/java/com/scopeledger/dto/SimulationRequestDto.java` | **Overwrite** empty stub |
| 2 | `backend/src/main/java/com/scopeledger/dto/SimulationResponseDto.java` | **Overwrite** empty stub |
| 3 | `backend/src/main/java/com/scopeledger/dto/ImpactedTaskDto.java` | **Create** new |
| 4 | `backend/src/main/java/com/scopeledger/dto/TradeOffCandidateDto.java` | **Create** new |
| 5 | `backend/src/main/java/com/scopeledger/dto/FinancialSummaryDto.java` | **Create** new |
| 6 | `backend/src/main/java/com/scopeledger/dto/ScheduleSummaryDto.java` | **Create** new |
| 7 | `backend/src/main/java/com/scopeledger/service/RippleSimulationService.java` | **Overwrite** empty stub |
| 8 | `backend/src/main/java/com/scopeledger/controller/ChangeOrderController.java` | **Overwrite** empty stub |
| 9 | `backend/src/test/java/com/scopeledger/service/RippleSimulationServiceTest.java` | **Create** new |
| 10 | `frontend/src/services/changeOrderApi.js` | **Overwrite** empty file |
| 11 | `frontend/src/components/simulator/SimulationDrawer.jsx` | **Overwrite** empty file |
| 12 | `frontend/src/components/simulator/TradeOffSandbox.jsx` | **Overwrite** empty file |
| 13 | `frontend/src/components/simulator/ChangeOrderHistoryModal.jsx` | **Overwrite** empty file |

---

### BFS Algorithm Design for `RippleSimulationService`

```mermaid
flowchart TD
    A["simulate(projectId, request)"] --> B["Load ALL tasks for project<br/>(via repository or mock list)"]
    B --> C["Load ALL dependencies for project<br/>(adjacency list: parentId → Set&lt;childId&gt;)"]
    C --> D["Build adjacency map<br/>Map&lt;Long, List&lt;Long&gt;&gt;"]
    D --> E["Apply DIRECT_CHANGE to targetTask<br/>extraHours = request.addedHours<br/>extraCost = addedHours × hourlyRate<br/>delayDays = request.addedDays"]
    E --> F["Initialize BFS Queue with targetTask's children"]
    F --> G{"Queue empty?"}
    G -- No --> H["Dequeue taskId"]
    H --> I{"visited.contains(taskId)?"}
    I -- Yes --> G
    I -- No --> J["Mark visited"]
    J --> K{"status == COMPLETED<br/>or IN_PROGRESS?"}
    K -- Yes --> L["reworkHours = estimatedHours × penaltyRate<br/>reworkCost = reworkHours × hourlyRate<br/>delayDays = ceil(reworkHours / dailyRate)<br/>Add DOWNSTREAM_REWORK to impactedTasks"]
    K -- No --> M["Task is NOT_STARTED<br/>No rework applied<br/>(but still enqueue children)"]
    L --> N["Enqueue all children of this task"]
    M --> N
    N --> G
    G -- Yes --> O["Compute tradeOffCandidates<br/>(optional + NOT_STARTED + zero active dependents)"]
    O --> P["Compute FinancialSummary<br/>Compute ScheduleSummary<br/>Apply droppedOptionalTaskIds savings"]
    P --> Q["Return SimulationResponseDto"]
```

**Key Algorithm Properties:**
- **Time Complexity:** O(V + E) where V = tasks, E = dependencies — linear BFS
- **Space Complexity:** O(V) for the visited set + O(E) for the adjacency map
- **Cycle Safety:** `visited` set prevents infinite loops
- **Diamond Deduplication:** Each node processed exactly once
- **Precision:** All money math via `BigDecimal.setScale(2, RoundingMode.HALF_UP)`

---

### Decoupled Test Harness Strategy

The `RippleSimulationServiceTest.java` will be a **pure JUnit 5 unit test** — no `@SpringBootTest`, no database, no application context:

```
Approach:
1. RippleSimulationService accepts data via a method signature that takes
   List<TaskDto> (tasks) and List<DependencyDto> (edges) directly
   — NOT through JPA repositories.

2. The service class will have TWO entry points:
   (a) simulate(Long projectId, SimulationRequestDto request)
       — used by the Controller; fetches data from repositories
   (b) simulateFromData(...)
       — pure-function overload accepting pre-built task/dependency lists
       — called by (a) after loading from DB
       — called directly by unit tests with synthetic data

3. The unit test builds synthetic task graphs in-memory:
   - Linear chain: A → B → C → D
   - Diamond: A → B → D, A → C → D
   - Wide fan-out: A → B, A → C, A → D, A → E
   - Mixed statuses: COMPLETED, IN_PROGRESS, NOT_STARTED
   - Optional tasks with/without dependents

4. Zero Spring context, zero MySQL, zero network.
   Runs via: ./mvnw test -pl backend
```

---

### Frontend Component Architecture

```mermaid
flowchart LR
    subgraph "Dev 2 Components"
        API["changeOrderApi.js<br/>───────────<br/>• simulateChangeOrder()<br/>• commitChangeOrder()<br/>• fetchChangeHistory()<br/>• USE_MOCK_API toggle"]
        SD["SimulationDrawer.jsx<br/>───────────<br/>• Task selection input<br/>• addedHours/addedDays fields<br/>• changeDescription field<br/>• Impact breakdown table<br/>• 'Apply Simulation' trigger"]
        TS["TradeOffSandbox.jsx<br/>───────────<br/>• Toggle switches per optional task<br/>• Live cost/delay recalculation<br/>• Strike-through on dropped tasks<br/>• Budget delta bar"]
        HM["ChangeOrderHistoryModal.jsx<br/>───────────<br/>• Paginated table of commits<br/>• Timestamp + description<br/>• Financial delta per order"]
    end

    API -->|fetch results| SD
    SD -->|passes tradeOffCandidates| TS
    SD -->|opens modal| HM
```

**Styling:** All components will use inline CSS variable references matching the dark engineering blueprint aesthetic from the reference UI:
- Background: `#0d1117` / `#161b22` (dark slate)
- Accent Red: `#ff4d4d` (direct change)
- Accent Amber: `#f0a500` (downstream rework)
- Text: `#e6edf3` (high-contrast white)
- Toggle: custom CSS toggle switches with red/green states
- Monospace numerics for financial figures

---

## Summary Checklist Before Implementation

- [x] Read and internalized PLAN.md, AGENTS.md, README.md
- [x] Verified all Dev 2 files are empty stubs (greenfield)
- [x] Verified Dev 1 entities/repositories are also empty (Phase 1 isolation confirmed)
- [x] Studied reference UI image for visual design language
- [x] Identified BigDecimal precision requirement for money
- [x] Designed cycle-safe BFS with deduplication
- [x] Planned pure-JUnit test harness (no Spring context needed)
- [x] Mapped all 13 files to create within Dev 2 boundary
- [x] No boundary violations — zero Dev 1 / Dev 3 files touched

> [!CAUTION]
> **AWAITING YOUR CONFIRMATION** before proceeding to Step 2 (full implementation). Review the audit findings and algorithmic decisions above. If you want me to adjust any approach (e.g., delay propagation formula, trade-off candidate inclusion), say so now — all decisions are locked once implementation begins.
