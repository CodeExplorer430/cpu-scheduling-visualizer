# Discord OAuth Setup Guide

This guide walks you through setting up a Discord Application to enable "Sign in with Discord".

## Prerequisites

- A Discord Account.

---

## Step 1: Create an Application

1.  Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2.  Click **New Application**.
3.  Enter a name (e.g., `Quantix`) and click **Create**.

## Step 2: Configure OAuth2

1.  In the left sidebar, click **OAuth2**.
2.  **Client ID**: Copy the "Client ID".
3.  **Client Secret**: Click **Reset Secret**, then copy the generated secret.
4.  **Redirects**:
    - Click **Add Redirect**.
    - Local: `http://localhost:3000/api/auth/discord/callback`
    - Production: `https://quantix-backend.onrender.com/api/auth/discord/callback`
5.  Click **Save Changes**.

## Step 3: Configure Environment Variables

Add the credentials to your `backend/.env` file:

```env
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
DISCORD_CALLBACK_URL=http://localhost:3000/api/auth/discord/callback
```
