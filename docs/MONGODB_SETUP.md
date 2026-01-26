# MongoDB & Environment Setup Guide

This project requires a MongoDB connection for user accounts and scenario persistence. It also uses Google OAuth for optional social login.

## Prerequisites

- **MongoDB Atlas** Account (Free Tier)
- **Google Cloud Console** Project (for OAuth)

---

## 1. MongoDB Setup

1.  Create a Cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2.  **Database Access**: Create a user (e.g., `cpu_admin`) with a strong password.
3.  **Network Access**: Whitelist `0.0.0.0/0` (for development/Render) or your specific IP.
4.  **Connection String**: Get the Node.js driver string.
    ```
    mongodb+srv://<username>:<password>@cluster0.123xy.mongodb.net/cpu-visualizer?retryWrites=true&w=majority
    ```

## 2. Google OAuth Setup (Optional)

1.  Go to [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project.
3.  Navigate to **APIs & Services > Credentials**.
4.  Create **OAuth 2.0 Client IDs**.
5.  **Authorized JavaScript Origins**: `http://localhost:5173` (Frontend)
6.  **Authorized Redirect URIs**: `http://localhost:3000/api/auth/google/callback` (Backend)
7.  Copy the `Client ID` and `Client Secret`.

## 3. Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# Security
JWT_SECRET=super-secret-random-string-at-least-32-chars

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```