# GitHub OAuth Setup Guide

This guide walks you through setting up a GitHub OAuth App to enable "Sign in with GitHub" for Quantix.

## Prerequisites

- A GitHub Account.

---

## Step 1: Register a New OAuth Application

1.  Log in to [GitHub](https://github.com/).
2.  Go to **Settings** > **Developer settings** > **OAuth Apps**.
    - Or use this direct link: [Register a new OAuth application](https://github.com/settings/applications/new).
3.  Click **New OAuth App**.

## Step 2: Configure Application Details

1.  **Application Name**: `Quantix` (or your preferred name).
2.  **Homepage URL**:
    - Local: `http://localhost:5173`
    - Production: Your Vercel frontend URL (e.g., `https://quantix-frontend.vercel.app`).
3.  **Application Description**: (Optional) e.g., "CPU Scheduling Visualizer".
4.  **Authorization callback URL**:
    - Local: `http://localhost:3000/api/auth/github/callback`
    - Production: Your Render backend URL + `/api/auth/github/callback` (e.g., `https://quantix-backend.onrender.com/api/auth/github/callback`).
5.  Click **Register application**.

## Step 3: Get Client ID and Secret

1.  You will be redirected to the application page.
2.  **Client ID**: Copy the "Client ID" shown at the top.
3.  **Client Secret**:
    - Click **Generate a new client secret**.
    - Copy the generated secret immediately.

## Step 4: Configure Environment Variables

Add the credentials to your `backend/.env` file (and Render Environment variables):

```env
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback
```
