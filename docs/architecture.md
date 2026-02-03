# System Architecture

## High-Level Overview (C4 Container)

```mermaid
C4Context
    title System Context Diagram for Quantix

    Person(user, "User", "Student or Educator")

    System_Boundary(quantix, "Quantix System") {
        Container(web_app, "Frontend Application", "React, Vite, Vercel", "Provides interactive simulation and visualization.")
        Container(api, "Backend API", "Node.js, Express, Render", "Handles persistence, auth, and heavy computations.")
        Container(shared, "Shared Engine", "TypeScript Library", "Core deterministic scheduling algorithms.")
        ContainerDb(database, "Database", "MongoDB Atlas", "Stores users, scenarios, and history.")
    }

    Rel(user, web_app, "Uses", "HTTPS")
    Rel(web_app, api, "API Calls", "JSON/HTTPS")
    Rel(web_app, shared, "Imports", "NPM Workspace")
    Rel(api, shared, "Imports", "NPM Workspace")
    Rel(api, database, "Reads/Writes", "Mongo Protocol")
```

## Overview

The Quantix is a full-stack monorepo designed for interactivity and performance.

- **Frontend**: React/Vite SPA (Vercel)
  - Interactive Gantt charts with D3.js
  - State management for simulations
  - Offline-first PWA support
  - Internationalization (i18n)
- **Backend**: Express/Node.js API (Render)
  - Heavy simulation offloading
  - Batch processing
  - User authentication (JWT + OAuth Providers)
  - Persistence via MongoDB
- **Shared**: TypeScript core logic (`@cpu-vis/shared`)
  - Deterministic scheduling algorithms (FCFS, RR, SJF, etc.)
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
- **LJF/LRTF**: Longest Job/Remaining Time First
- **HRRN**: Highest Response Ratio Next

## Security

- **Authentication**: JWT (JSON Web Tokens) with 7-day expiration.
- **Passwords**: Hashed with `bcryptjs`.
- **OAuth**: Google, GitHub, GitLab, Discord, LinkedIn.
- **CORS**: Configured for frontend domain.
