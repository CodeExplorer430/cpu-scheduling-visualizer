# CPU Scheduling Visualizer — Project Plan & Structure

**Stack:** Frontend — React + TypeScript + Vite + D3.js + TailwindCSS (PWA-ready)
Backend — Express (Node.js). Optional DB: PostgreSQL or MongoDB.

---

## 1. Project root (top-level directory tree)

```
cpu-scheduling-visualizer/
├── README.md
├── .gitignore
├── package.json            # monorepo root scripts (optional)
├── pnpm-workspace.yaml     # or yarn workspaces / npm workspaces (recommended)
├── /frontend               # React app (Vite + TS)
├── /backend                # Express API
├── /shared                 # shared TS types / algorithm engine (reusable)
├── /infra                  # Docker, deployment, CI/CD manifests
├── /docs                   # design docs, API docs, UML, diagrams
└── /examples               # sample CSV/JSON inputs and test-cases
```

> Recommendation: use a workspace (pnpm or npm workspaces) so `shared` code (algorithm engine + types) can be imported by frontend, backend, and potential Tauri/Flutter wrappers.

---

## 2. Frontend directory (detailed)

```
frontend/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.cjs
├── postcss.config.cjs
├── public/
│   ├── index.html
│   ├── manifest.webmanifest
│   └── icons/           # PWA icons
├── src/
│   ├── main.tsx
│   ├── index.css
│   ├── App.tsx
│   ├── service-worker.ts   # custom service worker (or use Workbox)
│   ├── registerServiceWorker.ts
│   ├── routes/             # if using react-router
│   ├── pages/
│   │   ├── Playground.tsx
│   │   └── Compare.tsx
│   ├── components/
│   │   ├── GanttChart/     # small set of components (SVG-based)
│   │   │   ├── Gantt.tsx
│   │   │   ├── TimeAxis.tsx
│   │   │   └── ProcessBar.tsx
│   │   ├── ProcessTable.tsx
│   │   ├── Controls.tsx
│   │   └── Stepper.tsx
│   ├── lib/
│   │   ├── engine.ts       # thin frontend wrapper around shared engine
│   │   └── utils.ts
│   ├── hooks/
│   │   └── useSimulation.ts
│   └── types.ts            # local types re-exporting from /shared
├── tests/                  # frontend unit & integration tests (Vitest + Testing Library)
└── README.md
```

**Notes:**

- `service-worker.ts` should implement caching strategy for static assets and API fallback so app works offline for saved scenarios. Consider Workbox or Vite PWA plugin for simpler setup.
- Keep visualization (Gantt) as presentational components; heavy logic should live in `shared/engine`.

---

## 3. Shared package (algorithm engine + types)

```
shared/
├── package.json
├── tsconfig.json
├── src/
│   ├── types.ts
│   ├── engine/
│   │   ├── fcfs.ts
│   │   ├── sjf.ts
│   │   ├── srtf.ts
│   │   ├── rr.ts
│   │   └── index.ts         # unified API
│   └── validators.ts
└── README.md
```

**Design:**

- Expose pure functions only (no DOM or side effects). Example API:
  ```ts
  // in shared/src/engine/index.ts
  import { Process } from './types';
  export type SimulationResult = { events: GanttEvent[]; metrics: Metrics };
  export function runFCFS(processes: Process[]): SimulationResult;
  export function runSJF(processes: Process[], options?): SimulationResult;
  ```
- This lets frontend, backend, and any other client re-use deterministic logic and unit tests.

---

## 4. Backend (Express) directory

```
backend/
├── package.json
├── tsconfig.json
├── src/
│   ├── server.ts
│   ├── app.ts
│   ├── routes/
│   │   ├── simulate.ts      # POST /api/simulate -> returns metrics & events
│   │   └── scenarios.ts     # CRUD for saved scenarios (if using DB)
│   ├── controllers/
│   ├── services/
│   │   └── engineProxy.ts   # imports shared engine for server-side simulations
│   ├── db/
│   │   └── index.ts         # DB connection (optional)
│   └── middlewares/
├── tests/
└── README.md
```

**API endpoints (suggested):**

- `POST /api/simulate` — body: `{ algorithm, processes, options }` -> returns simulation result.
- `POST /api/compare` — run multiple algorithms in parallel and return comparative metrics.
- `GET /api/examples` — return included example scenarios.
- `GET /api/scenarios/:id` — CRUD endpoints for user-saved scenarios (auth optional).

**Security & performance:**

- Validate inputs thoroughly; limit maximum timeline length and process count to defend against large simulations.
- Rate-limit endpoints if deployed publicly.

---

## 5. Infra & DevOps

```
infra/
├── Dockerfile.frontend
├── Dockerfile.backend
├── docker-compose.yml
├── .github/workflows/
│   ├── ci.yml
│   └── cd.yml
└── k8s/ (optional)
```

CI pipeline tasks: `lint`, `type-check`, `unit-tests`, `build`, `deploy`.

---

## 6. PWA considerations

- `manifest.webmanifest` with name, short_name, icons, `start_url`, `display: standalone`.
- Register service worker and implement caching strategies: cache-first for app shell, network-first for API (or stale-while-revalidate).
- Offline mode: allow user to save scenarios locally (IndexedDB) and run simulations offline using the shared engine.
- Add `beforeinstallprompt` flow and support HTTPS (required for PWA install on most browsers).

---

## 7. Advanced feature list (complete)

**Core / MVP features**

- Input table (PID, Arrival, Burst, Priority optional)
- Run algorithms: FCFS, SJF (non-preemptive), SRTF (preemptive SJF), Round Robin, Priority (preemptive/non-preemptive)
- Display: CT, TAT, WT for each process and averages
- Interactive Gantt chart (SVG) with hover tooltips
- Step mode (advance by time unit) & Play/Pause
- Export/Import scenarios (CSV/JSON)

**Advanced / Portfolio-grade**

- **Algorithm comparison**: side-by-side Gantt and metrics comparison
- **Pre-built test-suite**: standard scenarios & edge-case generator (for QA)
- **Benchmark & statistics**: CPU utilization, context switch count, response time distributions
- **Visualization controls**: zoom/pan timeline, color-coding by priority/CPU/core
- **Multi-core simulation**: simulate multiple CPU cores & affinity
- **Context switch visualization**: show markers where context switches occur, and compute overhead
- **Energy model (optional)**: model energy/energy-saving effects of scheduling
- **User accounts & persistence**: save scenarios to DB, sync across devices (Auth: OAuth or simple JWT)
- **Offline-first support**: PWA with IndexedDB sync when online
- **Export Gantt to PNG/PDF/SVG**
- **Accessibility**: keyboard navigation, high-contrast mode, ARIA support
- **Localization / i18n**
- **Unit tests + property-based tests** for algorithms (e.g., compare non-preemptive SJF vs brute-force)
- **Visual step-through with explanations**: show why the algorithm picked a process at each step
- **API endpoints** for batch simulation and CSV uploads
- **Load testing**: simulate many concurrent requests (backend)
- **CI & CD**: automated tests + deployment (Netlify/Vercel for frontend, Heroku/DigitalOcean/Render for backend)

**Stretch / Research features**

- **Trace playback**: import real OS trace logs and visualize
- **Simulate different context-switch costs & quantum tuning optimizer**
- **Educational mode**: guided tutorials for each algorithm
- **Auto-grading mode**: teacher can upload test cases and auto-grade student's outputs
- **Cross-platform wrappers**: Flutter mobile app and Tauri desktop app reusing shared engine

---

## 8. UX & Data Model (technical)

### UX flows

1. **Landing / Playground**: create process list manually or import CSV → choose algorithm & options → Run / Step / Play → Inspect metrics
2. **Compare**: upload or select multiple scenarios → pick algorithms to compare → show side‑by‑side Gantt + table of metrics
3. **Scenarios**: view saved scenarios, edit, delete, export
4. **Settings**: toggle preemption, quantum, tie-breaking rules, multi-core

### Wireframe notes

- Top: control bar (New, Import, Save, Algorithm select, Run, Step, Reset)
- Left pane: Process input table (editable rows)
- Center: Gantt visualization with time axis and markers
- Right pane: Metrics and logs (CT/TAT/WT + average + context switch count)
- Footer: timeline scrubber + controls

### Data model (TypeScript interfaces)

```ts
// shared/src/types.ts
export interface Process {
  pid: string;
  arrival: number; // integer (time units)
  burst: number; // integer (time units)
  remaining?: number; // used for preemptive algorithms
  priority?: number; // lower => higher priority (configurable)
}

export interface GanttEvent {
  pid: string | 'IDLE';
  start: number;
  end: number;
}

export interface Metrics {
  completion: Record<string, number>; // pid -> completion time
  turnaround: Record<string, number>;
  waiting: Record<string, number>;
  avgTurnaround: number;
  avgWaiting: number;
  contextSwitches?: number;
}

export type Algorithm = 'FCFS' | 'SJF' | 'SRTF' | 'RR' | 'PRIORITY';

export interface SimulationResult {
  events: GanttEvent[];
  metrics: Metrics;
  logs?: string[]; // optional step logs for step-through
}
```

**Engine contract:** functions accept normalized `Process[]` (sorted or unsorted; engine will copy and sort internally) and options, and return `SimulationResult`.

---

## 9. Implementation details & best practices

- **Pure engine**: shared engine must be side-effect-free and deterministic. Add `seed` option if randomness is needed for tie-breakers.
- **Tests**: write tests in `shared` first (Vitest/Jest) and ensure identical results between frontend and backend runs.
- **Type safety**: use `tsconfig` strict mode to catch subtle bugs.
- **Performance**: avoid per-time-unit loops when possible; aggregate contiguous execution intervals into one `GanttEvent` for rendering efficiency.
- **Accessibility & UX**: ensure the Gantt is keyboard-navigable and labels are readable at different zoom levels.
- **Logging & explainability**: provide an optional `explain` flag to return human-friendly step reasons (e.g., "At t=3, Process P2 arrived with burst 1 -> preempting P1").

---

## 10. Project roadmap (milestones)

**Phase 0 — Prep (1–2 days)**

- Initialize workspace, repo, and license
- Create `shared` package and implement TS types
- Setup linting, formatting (ESLint, Prettier), and CI skeleton

**Phase 1 — MVP (3–7 days)**

- Scaffold frontend (Vite + React + TS + Tailwind)
- Implement FCFS + SJF (non-preemptive) in `shared/engine`
- Build process input table + run button
- Render basic SVG Gantt + metrics table
- Add export/import (JSON)

**Phase 2 — Features (1–2 weeks)**

- Add SRTF (preemptive), RR, and Priority
- Step mode & play/pause
- Implement service worker + manifest (PWA)
- Add tests for engine and frontend components

**Phase 3 — Advanced (2–4 weeks)**

- Algorithm comparison view
- Save scenarios & optional backend with Express + DB
- Export Gantt (PNG/PDF)
- Accessibility and i18n

**Phase 4 — Polish & Deploy (1 week)**

- CI/CD, Docker images, deploy frontend and backend
- Add demo scenarios and documentation
- Prepare README and short demo video/gif for portfolio

**Stretch roadmap**

- Multi-core, context-switch visualization, energy model
- Mobile app in Flutter (reuse `shared` engine via WASM or reimplement engine in Dart)
- Desktop app with Tauri (reuse the web UI)

---

## 11. Testing & Validation

- Unit tests for each algorithm with canonical test cases (verify CT/TAT/WT values)
- Integration tests for the simulation API
- Visual regression tests for the Gantt render (e.g., Percy)
- Property-based tests for invariants (total executed time == sum bursts, no overlapping events per CPU)

---

## 12. Developer notes / shortcuts

- Use **pnpm** workspaces for fast installs and linking shared packages.
- Vite PWA plugin: `vite-plugin-pwa` for quick PWA scaffolding.
- Keep heavy D3 manipulations in isolated components to avoid state/DOM mismatches.
- Implement a `normalizeInput(processes)` util to sanitize inputs (negative numbers, duplicates, etc.).

---

If you want, I can next:

- scaffold the workspace `package.json` + `pnpm-workspace.yaml` and `shared` engine stubs, or
- generate the full `frontend` file tree with starter code for FCFS + a minimal Gantt component.

Tell me which you'd like me to generate next and I will produce the files/code.
