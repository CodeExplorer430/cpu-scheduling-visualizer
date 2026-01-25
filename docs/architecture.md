# System Architecture

## Overview

The CPU Scheduling Visualizer is a monorepo consisting of:

- **Frontend**: React/Vite SPA for interaction and visualization.
- **Backend**: Express/Node.js API for heavy simulations (optional offloading) and persistence.
- **Shared**: Core algorithm logic used by both frontend and backend.

## Data Flow

1. User inputs processes in the Frontend.
2. Frontend calls `shared` engine directly for instant feedback (Client-side simulation).
3. (Optional) User saves scenario -> Frontend calls Backend -> Backend saves to DB (Future).
4. (Optional) Batch processing -> Frontend calls Backend with large dataset -> Backend uses `shared` engine -> Returns results.

## Algorithms

- **FCFS**: First-Come, First-Served (Non-preemptive).
- **SJF**: Shortest Job First (Non-preemptive).
- **SRTF**: Shortest Remaining Time First (Preemptive).
- **RR**: Round Robin (Preemptive, Time Quantum).
- **PRIORITY**: Priority Scheduling (Non-preemptive).
