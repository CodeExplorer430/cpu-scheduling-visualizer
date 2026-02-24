# API Documentation

The backend exposes REST endpoints for authentication, persistence, and server-side scheduling simulation.

## Base URL

- Development: `http://localhost:3000/api`
- Production: `https://quantix-api.onrender.com/api`

## Authentication

Protected routes require:

- `Authorization: Bearer <jwt_token>`

Simulation endpoints accept anonymous requests; authenticated requests additionally record simulation history.

## Auth Endpoints

### Register

- `POST /auth/register`
- Body:

```json
{
  "username": "jdoe",
  "email": "jdoe@example.com",
  "password": "securepassword"
}
```

### Login

- `POST /auth/login`
- Body:

```json
{
  "email": "jdoe@example.com",
  "password": "securepassword"
}
```

### OAuth Login

- `GET /auth/google`
- `GET /auth/github`
- `GET /auth/gitlab`
- `GET /auth/discord`
- `GET /auth/linkedin`

On success, backend redirects to frontend with `?token=<jwt>`.

### Magic Link

- Request: `POST /auth/magic-link`
- Verify: `POST /auth/magic-link/verify`

## Simulation Endpoints

### Run Single Simulation

- `POST /simulate`
- Body:

```json
{
  "algorithm": "RR",
  "processes": [
    {
      "pid": "P1",
      "arrival": 0,
      "burst": 5,
      "priority": 2,
      "tickets": 5,
      "shareGroup": "interactive",
      "shareWeight": 2,
      "deadline": 12,
      "period": 6
    },
    {
      "pid": "P2",
      "arrival": 1,
      "burst": 3,
      "priority": 1
    }
  ],
  "timeQuantum": 2,
  "randomSeed": 42,
  "fairShareQuantum": 1
}
```

- Notes:
  - `timeQuantum` maps to shared `quantum` option.
  - `randomSeed` is used by `LOTTERY`.
  - `fairShareQuantum` is used by `FAIR_SHARE`.

### Run Batch Simulation

- `POST /simulate/batch`
- Body:

```json
{
  "algorithms": ["FCFS", "RR", "MLFQ", "LOTTERY", "EDF"],
  "processes": [
    { "pid": "P1", "arrival": 0, "burst": 5, "priority": 2 },
    { "pid": "P2", "arrival": 1, "burst": 3, "priority": 1 }
  ],
  "timeQuantum": 2,
  "randomSeed": 42,
  "fairShareQuantum": 1
}
```

- Response shape:

```json
{
  "FCFS": {
    "events": [],
    "metrics": {}
  },
  "RR": {
    "events": [],
    "metrics": {}
  },
  "LOTTERY": {
    "events": [],
    "metrics": {}
  }
}
```

- If one algorithm fails in batch mode, its key returns `{ "error": "..." }` while others still return results.

## Supported Algorithm Keys

- `FCFS`, `SJF`, `LJF`, `SRTF`, `RR`
- `PRIORITY`, `PRIORITY_PE`, `HRRN`
- `LRTF`, `MQ`, `MLFQ`
- `FAIR_SHARE`, `LOTTERY`, `EDF`, `RMS`

## Scenario Endpoints

### Save Scenario

- `POST /scenarios`
- Auth required

### List Scenarios

- `GET /scenarios`
- Auth required

### Upload CSV

- `POST /scenarios/upload/csv`
- `multipart/form-data`, field: `file`
- CSV header supports:
  - `PID,Arrival,Burst,Priority,Tickets,ShareGroup,ShareWeight,Deadline,Period`

## Health

- `GET /health`
- Response:

```json
{
  "status": "ok",
  "timestamp": "..."
}
```
