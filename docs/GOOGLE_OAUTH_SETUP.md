# Google OAuth 2.0 Setup Guide

This guide walks you through setting up a Google Cloud Project to enable "Sign in with Google" for the CPU Scheduling Visualizer.

## Prerequisites
- A Google Account.
- Access to the [Google Cloud Console](https://console.cloud.google.com/).

---

## Step 1: Create a Project

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Click the project dropdown in the top bar (next to the Google Cloud logo).
3.  Click **New Project**.
4.  **Project Name**: Enter a name (e.g., `cpu-scheduling-viz`).
5.  **Organization**: Leave as "No organization" (unless you have one).
6.  Click **Create**. Wait for the notification that the project is ready and select it.

## Step 2: Configure OAuth Consent Screen

1.  In the left sidebar, navigate to **APIs & Services** > **OAuth consent screen**.
2.  **User Type**:
    - Select **External** (allows any Google user to sign in).
    - *Note: If you select Internal, only users in your G-Suite organization can log in.*
3.  Click **Create**.
4.  **App Information**:
    - **App Name**: `CPU Scheduling Visualizer`
    - **User Support Email**: Select your email address.
    - **App Logo**: (Optional) Upload an icon if you wish.
5.  **Developer Contact Information**:
    - **Email Address**: Enter your email again.
6.  Click **Save and Continue**.
7.  **Scopes**:
    - Click **Add or Remove Scopes**.
    - Select the checkboxes for:
        - `.../auth/userinfo.email`
        - `.../auth/userinfo.profile`
        - `openid`
    - Click **Update**, then **Save and Continue**.
8.  **Test Users**:
    - Since the app is in "Testing" mode, you must add your own email address to log in.
    - Click **+ Add Users**, enter your Google email, and click **Add**.
    - Click **Save and Continue**.
9.  Review the summary and click **Back to Dashboard**.

## Step 3: Create Credentials

1.  In the left sidebar, go to **APIs & Services** > **Credentials**.
2.  Click **+ CREATE CREDENTIALS** at the top.
3.  Select **OAuth client ID**.
4.  **Application Type**: Select **Web application**.
5.  **Name**: `CPU Visualizer Client` (or any name).
6.  **Authorized JavaScript Origins**:
    - This validates where the request comes from (your Frontend).
    - Click **+ ADD URI**.
    - Enter: `http://localhost:5173` (for local development).
    - *For production, add your Vercel URL (e.g., `https://my-cpu-viz.vercel.app`).*
7.  **Authorized Redirect URIs**:
    - This is where Google sends the user back after login (your Backend).
    - Click **+ ADD URI**.
    - Enter: `http://localhost:3000/api/auth/google/callback` (for local development).
    - *For production, add your Render backend URL (e.g., `https://my-backend.onrender.com/api/auth/google/callback`).*
8.  Click **Create**.

## Step 4: Get Client ID and Secret

1.  A popup will appear with your **Client ID** and **Client Secret**.
2.  **Copy these values immediately.**
    - `Client ID`: Public identifier for your app.
    - `Client Secret`: Private key (keep this safe!).

## Step 5: Configure Environment Variables

1.  Open your project's `backend/` directory.
2.  Create or edit the `.env` file.
3.  Add the credentials:

    ```env
    GOOGLE_CLIENT_ID=your_pasted_client_id
    GOOGLE_CLIENT_SECRET=your_pasted_client_secret
    GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
    ```

    *Note: In production (Render), ensure `GOOGLE_CALLBACK_URL` matches the production URL you added in Step 3.*

---

## Troubleshooting

- **Error: "redirect_uri_mismatch"**:
    - Ensure the URL in your browser matches exactly what you entered in "Authorized Redirect URIs".
    - Check for trailing slashes or `http` vs `https`.
- **Error: "Access blocked: App is in testing mode"**:
    - Ensure you added the email you are trying to log in with to the **Test Users** list in the OAuth Consent Screen configuration.
