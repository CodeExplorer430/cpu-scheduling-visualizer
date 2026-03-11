# Local Agent Instructions Template

Copy this file to `AGENTS.md` for your local-only agent instructions. The real `AGENTS.md` is ignored by git and must never be committed.

## Repository Guidelines

### Project Structure & Module Organization

- `frontend/`: React + Vite UI, Tailwind styles, Storybook, and UI tests. Source lives in `frontend/src/` with pages in `frontend/src/pages/`, shared UI in `frontend/src/components/`, and tests under `frontend/src/test/`.
- `backend/`: Express API and simulation services. Source is in `backend/src/` with routes/controllers/models/middleware, and tests in `backend/src/test/`.
- `shared/`: TypeScript engine with scheduling algorithms and utilities. Source is in `shared/src/` and tests in `shared/tests/`.
- `docs/`: Architecture, API, and setup guides.
- `scripts/` and `infra/`: build and deployment helpers.

### Build, Test, and Development Commands

- `npm install`: install workspace dependencies.
- `npm run dev:frontend`: start the Vite dev server at `http://localhost:5173`.
- `npm run dev:backend`: start the API server at `http://localhost:3000` (requires `backend/.env` for OAuth/MongoDB if used).
- `npm run build`: build all workspaces.
- `npm test`: run all workspace tests.
- `npm run lint`: run ESLint across all workspaces.
- `npm run format`: apply Prettier formatting across the repo.
- `npm run format:check`: verify formatting without modifying files.
- `npm run verify`: run format check, lint, tests, and build in sequence.
- `npm run storybook -w frontend`: run Storybook UI library locally.

### Coding Style & Naming Conventions

- Indentation: 2 spaces (no tabs). Prettier settings: single quotes, semicolons, print width 100.
- TypeScript across `frontend/`, `backend/`, and `shared/`.
- File naming: use `PascalCase` for React components (e.g., `frontend/src/components/SchedulerPanel.tsx`), `camelCase` for hooks/utilities (e.g., `useScheduler.ts`).
- Linting: ESLint with `@typescript-eslint` rules; avoid `any` and unused vars (unused args should be prefixed with `_`).

### Testing Guidelines

- Test runner: Vitest in `frontend/`, `backend/`, and `shared/`.
- Frontend component tests live in `frontend/src/test/`.
- Backend and shared tests live in `backend/src/test/` and `shared/tests/`.
- Run a single workspace: `npm run test -w backend`.

### Commit & Pull Request Guidelines

- Commit messages in recent history are mostly conventional-style (e.g., `fix: ...`, `docs: ...`), with occasional sentence-case entries. Prefer `type: summary` (e.g., `feat: add SRTF insights panel`).
- PRs should include: a short summary, linked issues if applicable, and screenshots for UI changes (Storybook or app view).

### Configuration Notes

- Backend environment config lives in `backend/.env`. See `docs/MONGODB_SETUP.md` and OAuth guides in `docs/` for required variables.

## Required Pre-Push Quality Gate

Before every push, run `npm run verify` from the repo root and do not push unless it finishes with zero warnings and zero errors.

The required verification flow is:

1. `npm run format:check`
2. `npm run lint`
3. `npm test`
4. `npm run build`

If any command fails, emits warnings, or emits errors, fix the issue before pushing.

## Hook Setup

Enable the tracked git hooks once per clone:

`git config core.hooksPath .githooks`
