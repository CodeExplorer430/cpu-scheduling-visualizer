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
