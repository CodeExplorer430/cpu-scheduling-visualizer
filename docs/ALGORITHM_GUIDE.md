# Algorithm Implementation Guide

This guide documents how scheduling algorithms are implemented and integrated in Quantix.

## Current Catalog (15 Algorithms)

### Core Scheduling Algorithms

- `FCFS`
- `SJF`
- `SRTF`
- `RR`
- `PRIORITY`
- `PRIORITY_PE`

### Advanced & Hybrid

- `MQ` (user-facing label: MLQ)
- `MLFQ`
- `HRRN`

### Proportional/Fair-Share

- `FAIR_SHARE`
- `LOTTERY`

### Real-Time

- `EDF`
- `RMS`

### Experimental/Extended

- `LJF`
- `LRTF`

## Shared Types and Inputs

Core types are defined in `shared/src/types.ts`.

### `Process`

Required fields:

- `pid: string`
- `arrival: number`
- `burst: number`

Optional fields used by specific algorithms:

- `priority?: number`
- `tickets?: number`
- `shareGroup?: string`
- `shareWeight?: number`
- `deadline?: number`
- `period?: number`

### `SimulationOptions`

Common fields:

- `quantum?: number`
- `coreCount?: number`
- `contextSwitchOverhead?: number`
- `enableLogging?: boolean`
- `enableAffinity?: boolean`
- `energyConfig?: { activeWatts, idleWatts, switchJoules }`

Algorithm-specific:

- `randomSeed?: number` (`LOTTERY`)
- `fairShareQuantum?: number` (`FAIR_SHARE`)

## Engine File Structure

All algorithms live in `shared/src/engine/`.

- `index.ts`: exports all algorithm runners.
- `[algorithm].ts`: per-algorithm implementation.
- `utils.ts`: snapshots + metrics.

Each runner should follow:

```ts
export function runX(inputProcesses: Process[], options: SimulationOptions = {}): SimulationResult;
```

## Integration Checklist for New Algorithm

1. Add `runX` implementation in `shared/src/engine/x.ts`.
2. Export from `shared/src/engine/index.ts`.
3. Add key to `Algorithm` union in `shared/src/types.ts`.
4. Wire to:
   - frontend `useSimulation` and `useComparison`
   - backend `runSimulation` and `runBatchSimulation`
   - shared `autograder` engine map
5. Add display labels in locale files (`controls.algorithms`).
6. Add Guide page documentation.
7. Add tests (engine + integration points).

## Testing Expectations

At minimum, add tests in `shared/tests/engine/` for:

- Correct dispatch order / preemption behavior
- Arrival-time correctness
- Completion and average metrics sanity
- Tie-break determinism
- Algorithm-specific defaults (e.g., fallback deadline/period, default tickets)

Recommended additional coverage:

- Property tests in `shared/tests/properties/` where applicable
- Backend controller tests for single/batch endpoints
- Frontend hook tests for dispatch wiring

## Conventions

- Keep algorithm behavior deterministic for a fixed input/options.
- Keep event `coreId` explicit for multi-core outputs.
- Avoid mutating caller-provided arrays/objects directly.
- Prefer stable tie-breakers (`arrival`, then `pid`, etc.) to keep traces reproducible.

## Notes on Terminology

- Internal algorithm key is `MQ` for compatibility.
- User-facing documentation and UI label should present it as **MLQ** (Multilevel Queue).
