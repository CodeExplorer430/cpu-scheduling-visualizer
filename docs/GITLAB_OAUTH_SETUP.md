# GitLab OAuth Setup Guide

This guide walks you through setting up a GitLab Application to enable "Sign in with GitLab".

## Prerequisites

- A GitLab Account (GitLab.com or self-hosted).

---

## Step 1: Create an Application

1.  Log in to [GitLab](https://gitlab.com/).
2.  Click your avatar (top-right) > **Edit profile**.
3.  In the left sidebar, click **Applications**.
4.  Click **Add new application**.

## Step 2: Configure Application

1.  **Name**: `Quantix`.
2.  **Redirect URI**:
    - Local: `http://localhost:3000/api/auth/gitlab/callback`
    - Production: `https://quantix-backend.onrender.com/api/auth/gitlab/callback`
3.  **Confidential**: Ensure this checkbox is checked.
4.  **Scopes**:
    - Select `read_user` (Grants read-only access to user profile).
    - Select `openid`, `profile`, `email` (Standard OIDC scopes).
5.  Click **Save application**.

## Step 3: Get Application ID and Secret

1.  **Application ID**: Copy the "Application ID".
2.  **Secret**: Copy the "Secret".

## Step 4: Configure Environment Variables

Add the credentials to your `backend/.env` file:

```env
GITLAB_CLIENT_ID=your_application_id
GITLAB_CLIENT_SECRET=your_secret
GITLAB_CALLBACK_URL=http://localhost:3000/api/auth/gitlab/callback
```
