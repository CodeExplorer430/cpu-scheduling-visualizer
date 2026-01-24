# MongoDB Atlas Setup Guide

This project supports an optional database integration using **MongoDB** to save and load CPU scheduling scenarios. This guide will help you set up a free MongoDB Atlas cluster and connect it to the application.

## Prerequisites

- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) account (Free tier is sufficient).

---

## Step 1: Create a Cluster

1.  Log in to your MongoDB Atlas dashboard.
2.  Click **+ Create** or **Build a Database**.
3.  Select the **M0 (Free)** tier.
4.  Choose a **Provider** (AWS, Google Cloud, or Azure) and **Region** closest to you.
5.  Click **Create**. It may take a few minutes for the cluster to provision.

## Step 2: Configure Security

### 1. Create a Database User
1.  Go to the **Database Access** tab (under Security in the sidebar).
2.  Click **+ Add New Database User**.
3.  **Authentication Method**: Password.
4.  **Username**: Enter a username (e.g., `cpu_admin`).
5.  **Password**: Click "Autogenerate Secure Password" (copy this!) or enter your own.
6.  **Built-in Roles**: Select "Read and write to any database" (or restrict it later).
7.  Click **Add User**.

### 2. Network Access (Allow Connection)
1.  Go to the **Network Access** tab.
2.  Click **+ Add IP Address**.
3.  Select **Allow Access from Anywhere** (`0.0.0.0/0`) for easiest development access.
    *   *Note: For production, you should only whitelist your specific server IP.*
4.  Click **Confirm**.

## Step 3: Get Connection String

1.  Go back to the **Database** tab (Deployment).
2.  Click the **Connect** button on your cluster card.
3.  Select **Drivers**.
4.  Under **Step 3**, you will see your connection string. It looks like this:
    ```
    mongodb+srv://<username>:<password>@cluster0.123xy.mongodb.net/?retryWrites=true&w=majority
    ```
5.  **Copy this string.**

---

## Step 4: Configure the Project

1.  Open your project in the terminal or code editor.
2.  Navigate to the `backend` directory (or root if using a monorepo `.env`).
3.  Create a `.env` file in the `backend/` directory if it doesn't exist.
4.  Add the `MONGODB_URI` variable, replacing `<password>` with the password you created in Step 2.

    **backend/.env**:
    ```env
    PORT=3000
    MONGODB_URI=mongodb+srv://cpu_admin:mySecurePassword123@cluster0.123xy.mongodb.net/cpu-visualizer?retryWrites=true&w=majority
    ```
    *Note: I added `/cpu-visualizer` after the domain to specify the database name.*

---

## Step 5: Verify Connection

1.  Start the backend server:
    ```bash
    npm run dev:backend
    ```
2.  Check the console output. You should see:
    ```
    Server running on port 3000
    MongoDB Connected...
    ```

## Usage

Once connected, you can use the **"Save Scenario"** and **"Load Scenario"** buttons in the frontend Playground to persist your simulation configurations.
