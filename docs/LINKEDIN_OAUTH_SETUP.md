# LinkedIn OAuth Setup Guide

This guide walks you through setting up a LinkedIn App to enable "Sign in with LinkedIn".

## Prerequisites

- A LinkedIn Account.
- Access to [LinkedIn Developers](https://www.linkedin.com/developers/).

---

## Step 1: Create an App

1.  Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps).
2.  Click **Create app**.
3.  **App Name**: `Quantix`.
4.  **LinkedIn Page**: You must associate it with a LinkedIn Company Page (you can create a dummy one if needed).
5.  Upload a logo and agree to the terms.
6.  Click **Create app**.

## Step 2: Configure Products (Permissions)

1.  Go to the **Products** tab.
2.  Request access for **Sign In with LinkedIn using OpenID Connect**.
    - This typically requires verification but is the modern way to get `openid`, `profile`, `email` scopes.

## Step 3: Configure Auth

1.  Go to the **Auth** tab.
2.  **Client ID**: Copy the "Client ID".
3.  **Client Secret**: Copy the "Client Secret".
4.  **OAuth 2.0 settings**:
    - Under **Authorized redirect URLs for your app**, click the edit icon.
    - Add Local: `http://localhost:3000/api/auth/linkedin/callback`
    - Add Production: `https://quantix-backend.onrender.com/api/auth/linkedin/callback`
5.  Click **Update**.

## Step 4: Configure Environment Variables

Add the credentials to your `backend/.env` file:

```env
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_CALLBACK_URL=http://localhost:3000/api/auth/linkedin/callback
```
