# System Architecture

## High-Level Overview

```mermaid
graph TD
    User([User])
    subgraph Frontend [Frontend - Vercel]
        React[React SPA]
        D3[D3.js Visualization]
        i18n[i18n - en/es]
        PWA[PWA Service Worker]
    end
    subgraph Backend [Backend - Render]
        Express[Express.js API]
        Passport[Passport.js OAuth]
        JWT[JWT Auth]
    end
    subgraph Shared [Shared Engine]
        Engine[Scheduling Algorithms]
        Validators[Types & Validators]
    end
    DB[(MongoDB Atlas)]

    User <--> React
    React <--> Express
    Express <--> DB
    React -.-> Shared
    Express -.-> Shared
    Passport <--> Google[Google OAuth]
    Passport <--> GitHub[GitHub OAuth]
    Passport <--> GitLab[GitLab OAuth]
    Passport <--> Discord[Discord OAuth]
    Passport <--> LinkedIn[LinkedIn OAuth]
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
  - User authentication (JWT + 5 OAuth Providers)
  - Persistence via MongoDB
- **Shared**: TypeScript core logic (`@cpu-vis/shared`)
  - Deterministic scheduling algorithms (FCFS, RR, SJF, etc.)
  - Property-based tests
  - Shared types and validation

## Data Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend (React)
    participant B as Backend (Express)
    participant S as Shared Engine
    participant D as Database (MongoDB)

    U->>F: Input Process Data
    F->>S: Run Simulation (Client-side)
    S-->>F: Return Gantt Data
    F->>U: Display Visualization

    U->>F: Save Scenario
    F->>B: POST /api/scenarios
    B->>D: Save Scenario
    D-->>B: Success
    B-->>F: Created
```

## Algorithms Supported

- **FCFS**: First-Come, First-Served
- **SJF**: Shortest Job First (Non-preemptive)
- **SRTF**: Shortest Remaining Time First (Preemptive)
- **RR**: Round Robin (Time Quantum)
- **PRIORITY**: Priority Scheduling (Preemptive/Non-preemptive)

## Security

- **Authentication**: JWT (JSON Web Tokens) with 7-day expiration.
- **Passwords**: Hashed with `bcryptjs`.
- **OAuth**: Google Strategy via `passport`.
- **CORS**: Configured for frontend domain.
