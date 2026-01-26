# System Architecture

## Overview

The CPU Scheduling Visualizer is a full-stack monorepo designed for interactivity and performance.

- **Frontend**: React/Vite SPA (Vercel)
  - Interactive Gantt charts with D3.js
  - State management for simulations
  - Offline-first PWA support
  - Internationalization (i18n)
- **Backend**: Express/Node.js API (Render)
  - Heavy simulation offloading
  - Batch processing
  - User authentication (JWT + Google OAuth)
  - Persistence via MongoDB
- **Shared**: TypeScript core logic (`@cpu-vis/shared`)
  - Deterministic scheduling algorithms (FCFS, RR, SJF, etc.)
  - Property-based tests
  - Shared types and validation

## Data Flow

1.  **Simulation**:
    - _Client-side_: Instant feedback for small datasets.
    - _Server-side_: `/api/simulate/batch` for large-scale comparisons.
2.  **Persistence**:
    - Users authenticate via Email/Password or Google.
    - Scenarios are saved to MongoDB (`Scenario` collection).
    - `authController` manages sessions via stateless JWTs.
3.  **Deployment**:
    - Frontend: Deployed on Vercel (rewrites to backend).
    - Backend: Deployed on Render (Docker or Node runtime).

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
