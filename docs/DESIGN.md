# Design Documentation

## Overview

Quantix is a CPU scheduling visualizer that runs entirely in the browser (client-side) for simulation logic, while providing optional backend services for persistence and heavy batch processing. This hybrid approach ensures low latency for interactive simulations and scalability for comprehensive analysis.

## Frontend Architecture

The frontend is built with **React** and **Vite**, using a feature-based folder structure. State is managed via React Context (`AuthContext`, `ThemeContext`) and custom hooks (`useSimulation`, `useComparison`).

### Component Hierarchy (Simplified)

```mermaid
graph TD
    App --> Layout
    Layout --> Header
    Layout --> MainContent
    Layout --> Footer

    MainContent --> Playground
    MainContent --> Dashboard
    MainContent --> Compare

    Playground --> SimulationControls
    Playground --> ProcessTable
    Playground --> Gantt
    Playground --> Stepper
    Playground --> Metrics

    ProcessTable --> ScenarioManager
    ScenarioManager --> SaveScenarioModal
    ScenarioManager --> LoadScenarioModal

    Dashboard --> SavedScenarios
    Dashboard --> AnalyticsDashboard
    Dashboard --> ProfileSettings

    Compare --> ComparisonSettings
    Compare --> ComparisonResults
    ComparisonResults --> Gantt
```

### State Management

- **Global State**:
  - `AuthContext`: Manages user session (JWT), profile, and login/logout actions.
  - `ThemeContext`: Toggles Light/Dark mode and persists preference.
- **Local/Feature State**:
  - `useSimulation`: Encapsulates the core simulation engine loop, timer, and result state.
  - `useComparison`: Manages batch execution of multiple algorithms.

## Authentication Flow

Quantix supports traditional Email/Password login and OAuth (Google, GitHub, etc.).

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant DB
    participant OAuthProvider

    User->>Frontend: Click "Login with Google"
    Frontend->>Backend: GET /api/auth/google
    Backend->>OAuthProvider: Redirect to Provider
    OAuthProvider-->>User: Consent Screen
    User->>OAuthProvider: Approve
    OAuthProvider->>Backend: Callback with Code
    Backend->>OAuthProvider: Exchange Code for Profile
    Backend->>DB: Find or Create User
    Backend->>Backend: Generate JWT
    Backend->>Frontend: Redirect /?token=JWT
    Frontend->>Frontend: Store Token in LocalStorage
    Frontend->>Backend: GET /api/auth/me (Verify)
    Backend-->>Frontend: User Profile
```

## Data Model

```mermaid
erDiagram
    User ||--o{ Scenario : "saves"
    User ||--o{ SimulationHistory : "generates"

    User {
        ObjectId _id
        string username
        string email
        string passwordHash
        object settings
        object profile
        string[] oauth_ids
    }

    Scenario {
        ObjectId _id
        ObjectId userId
        string name
        Process[] processes
        Date createdAt
    }

    SimulationHistory {
        ObjectId _id
        ObjectId userId
        string algorithm
        int processesCount
        object metrics
        Date createdAt
    }
```

## Simulation Engine

The core simulation logic resides in `@cpu-vis/shared`. It is designed to be deterministic and platform-agnostic.

### Supported Algorithm Families

- Core: `FCFS`, `SJF`, `SRTF`, `RR`, `PRIORITY`, `PRIORITY_PE`
- Advanced/Hybrid: `MQ` (MLQ), `MLFQ`, `HRRN`
- Proportional/Fair-share: `FAIR_SHARE`, `LOTTERY`
- Real-time: `EDF`, `RMS`
- Experimental/Extended: `LJF`, `LRTF`

### Process Model Extensions

Beyond classic `(pid, arrival, burst, priority)`, the shared process type supports:

- `tickets` for lottery scheduling
- `shareGroup` and `shareWeight` for fair-share scheduling
- `deadline` for EDF
- `period` for RMS

These fields are optional and algorithm-specific; defaults are applied by the corresponding engine when absent.

### Process Lifecycle

```mermaid
stateDiagram-v2
    [*] --> New
    New --> Ready : Arrival Time
    Ready --> Running : Scheduler Dispatch
    Running --> Terminated : Burst Completed
    Running --> Ready : Time Quantum / Preemption
    Terminated --> [*]
```

```mermaid
classDiagram
    class Scheduler {
        +run(processes, options) SimulationResult
    }
    class FCFS {
        +execute()
    }
    class RR {
        +execute()
    }
    class MLFQ {
        +execute()
    }

    Scheduler <|-- FCFS
    Scheduler <|-- RR
    Scheduler <|-- MLFQ

    class SimulationResult {
        +events: GanttEvent[]
        +metrics: Metrics
        +snapshots: Snapshot[]
    }
```

## Key Design Decisions

1.  **Client-Side Simulation**:
    - _Decision_: Run individual simulations in the browser.
    - _Reasoning_: Immediate feedback loop for the user without network latency. CPU scheduling algorithms are computationally light enough for modern browsers for typical inputs (N < 100).

2.  **Shared Library (`@cpu-vis/shared`)**:
    - _Decision_: Extract logic into a shared workspace.
    - _Reasoning_: Allows the same algorithms to be used by the Frontend (interactive) and Backend (batch processing/validation) without code duplication.

3.  **D3.js for Visualization**:
    - _Decision_: Use D3.js wrapped in React components.
    - _Reasoning_: Provides fine-grained control over the Gantt chart rendering (SVG) which is difficult to achieve with standard charting libraries like Chart.js.

4.  **Magic Link Auth**:
    - _Decision_: Implement passwordless login.
    - _Reasoning_: Reduces friction for student adoption.
