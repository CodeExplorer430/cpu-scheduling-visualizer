# System Architecture

## High-Level Overview (C4 Container)

```mermaid
C4Container
    title System Architecture Diagram for Quantix

    Person(user, "User", "Student or Educator")

    System_Boundary(quantix, "Quantix System") {
        Container(web_app, "Frontend Application", "React, Vite", "Interactive simulation and visualization UI.")
        Container(api, "Backend API", "Node.js, Express", "Handles persistence, auth, and computations.")
        Container(shared, "Shared Engine", "TypeScript", "Deterministic scheduling algorithms and logic.")
        ContainerDb(database, "Database", "MongoDB Atlas", "Stores users, scenarios, and history.")
    }

    Rel(user, web_app, "Uses", "HTTPS")
    Rel(web_app, api, "API Calls", "JSON/HTTPS")
    Rel(web_app, shared, "Imports", "Local Workspace")
    Rel(api, shared, "Imports", "Local Workspace")
    Rel(api, database, "Reads/Writes", "Mongoose")

    UpdateLayoutConfig($c4ShapeInRow="2", $c4BoundaryInRow="1")
```

## Overview

The Quantix is a full-stack monorepo designed for interactivity and performance.

- **Frontend**: React/Vite SPA (Vercel)
  - Interactive Gantt charts with D3.js (Keyboard & Screen Reader accessible)
  - State management for simulations
  - Offline-first PWA support
  - Internationalization (i18n) with 11 supported languages
  - Storybook for UI component documentation
- **Backend**: Express/Node.js API (Render)
  - Heavy simulation offloading
  - Batch processing
  - User authentication (JWT + OAuth Providers)
  - Persistence via MongoDB
- **Shared**: TypeScript core logic (`@cpu-vis/shared`)
  - Deterministic scheduling algorithms (15 total)
  - Extended process model (`priority`, `tickets`, `shareGroup`, `shareWeight`, `deadline`, `period`)
  - Multi-core scheduling support and context-switch modeling
  - Advanced statistical utilities (95th Percentile, Standard Deviation)
  - Energy consumption modeling
  - Property-based tests
  - Shared types and validation

## Deployment Architecture

```mermaid
graph TD
    subgraph Cloud [Cloud Infrastructure]
        subgraph Vercel
            Frontend[React Frontend]
        end

        subgraph Render
            Backend[Node.js Backend Container]
        end

        subgraph Atlas
            DB[(MongoDB Cluster)]
        end
    end

    User[Client Browser] -->|HTTPS| Frontend
    Frontend -->|API / HTTPS| Backend
    Backend -->|Mongoose| DB
```

## Data Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend (React)
    participant B as Backend (Express)
    participant D as Database (MongoDB)

    Note over U,F: Client-Side Simulation
    U->>F: Input Process Data
    F->>F: Run @cpu-vis/shared Algorithm
    F-->>U: Display Gantt Chart (D3)

    Note over U,D: Persistence
    U->>F: Click "Save Scenario"
    F->>B: POST /api/scenarios (Bearer Token)
    B->>D: Save Document
    D-->>B: Success
    B-->>F: Created 201
```

## Algorithms Supported

- **FCFS**: First-Come, First-Served
- **SJF**: Shortest Job First (Non-preemptive)
- **SRTF**: Shortest Remaining Time First (Preemptive)
- **RR**: Round Robin (Time Quantum)
- **PRIORITY**: Priority Scheduling (Preemptive/Non-preemptive)
- **MLFQ**: Multilevel Feedback Queue
- **MQ (MLQ)**: Multilevel Queue
- **LJF/LRTF**: Longest Job/Remaining Time First
- **HRRN**: Highest Response Ratio Next
- **FAIR_SHARE**: Group-weighted fair-share scheduling
- **LOTTERY**: Probabilistic ticket-based proportional sharing
- **EDF**: Earliest Deadline First
- **RMS**: Rate Monotonic Scheduling

## Security

- **Authentication**: JWT (JSON Web Tokens) with 7-day expiration.
- **Passwords**: Hashed with `bcryptjs`.
- **OAuth**: Google, GitHub, GitLab, Discord, LinkedIn.
- **CORS**: Configured for frontend domain.
