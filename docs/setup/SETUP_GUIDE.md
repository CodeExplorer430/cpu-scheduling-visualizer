# Setup Guide

This guide will help you set up the project documentation and configuration files for `Quantix`.

## 1. Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **pnpm** (recommended) or `npm`
- **Git**

## 2. Directory Structure Setup

The project uses a monorepo structure. Ensure your directories are set up as follows:

```
quantix/
├── docs/                   # Documentation files
│   ├── setup/              # Setup guides (this folder)
│   ├── ALGORITHM_GUIDE.md  # How to implement new algorithms
│   ├── API.md              # API documentation
│   ├── architecture.md     # System architecture overview
│   ├── DEPLOYMENT.md       # Deployment instructions
│   ├── GOOGLE_OAUTH_SETUP.md # Google OAuth setup
│   └── MONGODB_SETUP.md    # MongoDB setup
├── backend/                # Backend API (Express)
│   └── .env                # Backend environment variables
├── frontend/               # Frontend App (React/Vite)
└── shared/                 # Shared logic (TypeScript)
```

## 3. Environment Variables

You need to configure the environment variables for the backend to function correctly.

1.  Navigate to the `backend/` directory:
    ```bash
    cd backend
    ```
2.  Create a `.env` file (if it doesn't exist) or edit the existing one.
3.  Add the following configurations:

    ```env
    # Server Configuration
    PORT=3000
    NODE_ENV=development
    FRONTEND_URL=http://localhost:5173

    # Database Configuration (MongoDB Atlas)
    MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority

    # Security (JWT)
    JWT_SECRET=your_super_secure_random_string_here

    # Google OAuth (Optional)
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

    # GitHub OAuth (Optional)
    GITHUB_CLIENT_ID=your_github_client_id
    GITHUB_CLIENT_SECRET=your_github_client_secret
    GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback

    # GitLab OAuth (Optional)
    GITLAB_CLIENT_ID=your_gitlab_client_id
    GITLAB_CLIENT_SECRET=your_gitlab_client_secret
    GITLAB_CALLBACK_URL=http://localhost:3000/api/auth/gitlab/callback

    # Discord OAuth (Optional)
    DISCORD_CLIENT_ID=your_discord_client_id
    DISCORD_CLIENT_SECRET=your_discord_client_secret
    DISCORD_CALLBACK_URL=http://localhost:3000/api/auth/discord/callback

    # LinkedIn OAuth (Optional)
    LINKEDIN_CLIENT_ID=your_linkedin_client_id
    LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
    LINKEDIN_CALLBACK_URL=http://localhost:3000/api/auth/linkedin/callback
    ```

    *Note: Replace placeholders like `your_google_client_id` with actual values obtained from the respective provider's developer console.*

## 4. Documentation Maintenance

- **Algorithm Guide**: Update `docs/ALGORITHM_GUIDE.md` when adding new scheduling algorithms to `shared/src/engine`.
- **API Docs**: Keep `docs/API.md` in sync with new endpoints added to `backend/src/routes`.
- **Deployment**: Refer to `docs/DEPLOYMENT.md` for production release steps.

## 5. Running the Project

1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Build Shared Library**:
    ```bash
    npm run build -w shared
    ```
3.  **Start Development Servers**:
    - **Backend**: `cd backend && npm run dev`
    - **Frontend**: `cd frontend && npm run dev`

Open [http://localhost:5173](http://localhost:5173) to view the application.
