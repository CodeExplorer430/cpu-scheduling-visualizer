# Deployment Guide

This guide details how to deploy the Quantix application (Frontend, Backend, and Database) to a production environment.

**Architecture:**

- **Frontend**: Vercel (React/Vite)
- **Backend**: Render (Node.js/Express via Docker)
- **Database**: MongoDB Atlas

---

## 1. Database Setup (MongoDB Atlas)

Before deploying the code, ensure your database is ready.

1.  Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2.  Create a Cluster (Free Tier is sufficient).
3.  **Network Access**: Allow access from anywhere (`0.0.0.0/0`) since Render IPs vary.
4.  **Database Access**: Create a database user with a password.
5.  **Get Connection String**:
    - Click "Connect" -> "Connect your application".
    - Copy the connection string (e.g., `mongodb+srv://<user>:<password>@cluster...`).

---

## 2. Backend Deployment (Render)

We will deploy the backend as a **Docker Container** on Render. This ensures the monorepo structure (specifically the `@cpu-vis/shared` dependency) is handled correctly during the build.

### Prerequisites

- A [Render](https://render.com/) account.
- Your code pushed to a GitHub repository.

### Steps

1.  **New Web Service**:
    - Go to the Render Dashboard and click **New +** -> **Web Service**.
2.  **Connect Repository**: Select your repository.
3.  **Configuration**:
    - **Name**: `quantix-backend` (or similar)
    - **Runtime**: **Docker** (Crucial!)
    - **Region**: Choose one close to you (and your Database).
    - **Branch**: `main`
    - **Context Directory**: `.` (Leave as default / root)
    - **Dockerfile Path**: `infra/Dockerfile.backend`
4.  **Environment Variables**:
    Add the following keys:
    - `NODE_ENV`: `production`
    - `PORT`: `3000`
    - `MONGODB_URI`: (Paste your Atlas connection string)
    - `JWT_SECRET`: (Generate a long, random string)
    - `GOOGLE_CLIENT_ID`: (From Google Cloud Console - see `GOOGLE_OAUTH_SETUP.md`)
    - `GOOGLE_CLIENT_SECRET`: (From Google Cloud Console)
    - `GOOGLE_CALLBACK_URL`: `https://<your-render-app-name>.onrender.com/api/auth/google/callback`
    - `FRONTEND_URL`: (Leave blank for now, update after Frontend deployment)
5.  **Deploy**: Click **Create Web Service**.

Wait for the build to finish. Once live, copy your backend URL (e.g., `https://quantix-backend.onrender.com`).

### CLI Setup

For local operational tasks and GitHub Actions driven deployments, install the Render CLI:

- macOS/Homebrew: `brew install render`
- Linux/macOS installer: `curl -fsSL https://raw.githubusercontent.com/render-oss/cli/refs/heads/main/bin/install.sh | sh`

Local usage:

1. Run `render login`
2. Select the correct workspace
3. Validate the blueprint with `npm run render:validate`
4. List services with `npm run render:services`
5. Save the backend service ID for CI with `render services --output json --confirm`

GitHub Actions secrets required for CLI deploys:

- `RENDER_API_KEY`
- `RENDER_SERVICE_ID`

Disable Render's Git auto-deploy if GitHub Actions will be the single production deploy trigger.

---

## 3. Frontend Deployment (Vercel)

The frontend is a Vite application deployed on Vercel.

### Prerequisites

- A [Vercel](https://vercel.com/) account.

### Steps

1.  **Add New Project**:
    - Go to Vercel Dashboard -> **Add New...** -> **Project**.
2.  **Import Repository**: Select your Git repository.
3.  **Project Configuration**:
    - **Framework Preset**: Vite
    - **Root Directory**: Click "Edit" and select `frontend`.
4.  **Build Settings**:
    - Vercel usually detects the settings automatically.
    - **Build Command**: `tsc -b && vite build` (Default from package.json)
    - **Output Directory**: `dist`
5.  **Environment Variables**:
    Add the following:
    - `VITE_API_URL`: (Paste your **Render Backend URL**)
      - Example: `https://quantix-backend.onrender.com/api`
        _(Note: Ensure you include `/api` if your backend routes are prefixed with it)_
6.  **Deploy**: Click **Deploy**.

Vercel will build the application. If it succeeds, you will get a production URL (e.g., `https://quantix-frontend.vercel.app`).

**Troubleshooting Monorepo Builds on Vercel:**
If Vercel fails to resolve `@cpu-vis/shared`, you may need to override the **Build Command** to build the shared library first:
`cd .. && npm install && npm run build --workspace=shared && cd frontend && npm run build`

### CLI Setup

For local and CI-driven deployments, use the Vercel CLI:

1. Run `npx vercel@latest login`
2. Link the frontend project with `npx vercel@latest link frontend`
3. Save the generated `orgId` and `projectId` from `frontend/.vercel/project.json`
4. Keep `.vercel/` untracked; it is local metadata only
5. Pull project settings locally with:
   - `npm run vercel:pull:preview`
   - `npm run vercel:pull:prod`

Local deploy commands:

- Preview: `npm run deploy:frontend:preview`
- Production: `npm run deploy:frontend:prod`

For GitHub Actions and local CLI deploys, the Vercel build is performed remotely on Vercel by `vercel deploy`. This avoids local `vercel build` issues in CI runners and keeps the CLI as the deployment trigger rather than the build executor.

GitHub Actions secrets required for CLI deploys:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Disable Vercel's Git auto-deploy if GitHub Actions will be the single production deploy trigger.

---

## 4. Final Configuration

Now that both services are up, link them securely.

1.  **Update Backend Env Vars**:
    - Go back to Render Dashboard -> **Environment**.
    - Set `FRONTEND_URL` to your new Vercel URL (no trailing slash).
    - **Save Changes** (Render will redeploy).

2.  **Update Google OAuth**:
    - Go to [Google Cloud Console](https://console.cloud.google.com/).
    - Navigate to **APIs & Services** -> **Credentials**.
    - Edit your OAuth 2.0 Client.
    - **Authorized JavaScript Origins**: Add your Vercel URL.
    - **Authorized Redirect URIs**: Ensure your Render URL is correct (`.../api/auth/google/callback`).

3.  **Verify**:
    - Open your Vercel app.
    - Try to Register/Login.
    - Run a simulation.

---

## 5. GitHub Actions as the Deployment Orchestrator

This repository now supports CLI-driven deployments from GitHub Actions:

- `.github/workflows/ci.yml` remains the quality gate
- `.github/workflows/cd.yml` deploys only after CI succeeds for `main`
- Frontend deploys use Vercel CLI from the `frontend/` workspace and build remotely on Vercel
- Backend deploys use Render CLI against the configured `RENDER_SERVICE_ID`

Recommended platform settings:

- Disable Vercel production auto-deploy from Git
- Disable Render auto-deploy from Git
- Keep GitHub Actions as the only production deployment path
