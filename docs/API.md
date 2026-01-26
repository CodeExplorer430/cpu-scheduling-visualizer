# API Documentation

The backend provides a RESTful API for managing user scenarios and offloading heavy simulations.

## Base URL

Development: `http://localhost:3000/api`
Production: `https://quantix-api.onrender.com/api`

## Authentication

All protected routes require a Bearer Token.

**Header:**
`Authorization: Bearer <jwt_token>`

### 1. Register

- **Endpoint**: `POST /auth/register`
- **Body**:
  ```json
  {
    "username": "jdoe",
    "email": "jdoe@example.com",
    "password": "securepassword"
  }
  ```

### 2. Login

- **Endpoint**: `POST /auth/login`
- **Body**:
  ```json
  {
    "email": "jdoe@example.com",
    "password": "securepassword"
  }
  ```

### 3. Google OAuth

- **Endpoint**: `GET /auth/google`
- **Description**: Redirects user to Google Sign-In. Returns to frontend with `?token=<jwt>` on success.

---

## Simulation

### Run Batch Simulation

- **Endpoint**: `POST /simulate/batch`
- **Description**: Runs multiple algorithms on the same dataset for comparison.
- **Body**:
  ```json
  {
    "algorithms": ["FCFS", "RR", "SJF"],
    "processes": [{ "pid": "P1", "arrival": 0, "burst": 5, "priority": 1 }],
    "options": {
      "timeQuantum": 2
    }
  }
  ```

---

## Scenarios (Persistence)

### Upload CSV

- **Endpoint**: `POST /scenarios/upload/csv`
- **Body**: `multipart/form-data` with key `file` (CSV).
- **Format**: `Process ID, Arrival Time, Burst Time, Priority`

### Save Scenario

- **Endpoint**: `POST /scenarios`
- **Auth**: Required
- **Body**:
  ```json
  {
    "name": "My Custom Test",
    "processes": [...]
  }
  ```

### List Scenarios

- **Endpoint**: `GET /scenarios`
- **Auth**: Required
- **Description**: Returns all scenarios saved by the logged-in user.
