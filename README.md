# CPU Scheduling Visualizer

A comprehensive, interactive web-based visualizer for CPU scheduling algorithms, designed for students and educators. It features a modern React frontend, a robust Node.js backend for simulations, and a shared core engine.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

## 🚀 Features

- **Interactive Gantt Charts**: Visualize process execution, idle times, and context switches in real-time.
- **Algorithm Comparison**: Run simulations side-by-side to compare metrics like Turnaround Time and Waiting Time.
- **Step-by-Step Explanations**: Understand *why* a scheduler made a specific decision at any given tick.
- **Multi-Core Support**: Simulate scheduling across multiple CPU cores.
- **Save & Load**: Persist your custom scenarios using MongoDB (via Google Login or Guest).
- **Export**: Download results as PNG, PDF, or CSV.
- **Internationalization**: Full English and Spanish (Español) support.
- **PWA Ready**: Installable on desktop and mobile for offline usage.

## 🏗️ Architecture

The project is structured as a Monorepo:

- **`frontend/`**: React 18, Vite, Tailwind CSS, D3.js (Visualization).
- **`backend/`**: Node.js, Express, MongoDB (API & Persistence).
- **`shared/`**: TypeScript library containing the core deterministic scheduling algorithms.
- **`docs/`**: Project documentation.

## 🛠️ Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB (Local or Atlas) - *Optional for basic usage*

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/CodeExplorer430/cpu-scheduling-visualizer.git
    cd cpu-scheduling-visualizer
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Build shared libraries:**
    ```bash
    npm run build
    ```

### Running Locally

1.  **Start the Frontend (Development):**
    ```bash
    npm run dev:frontend
    ```
    Access at `http://localhost:5173`

2.  **Start the Backend (Optional):**
    Create a `.env` file in `backend/` (see [MongoDB Setup](docs/MONGODB_SETUP.md) and [OAuth Setup](docs/GOOGLE_OAUTH_SETUP.md)) and run:
    ```bash
    npm run dev:backend
    ```
    Access at `http://localhost:3000`

## 🧠 Implemented Algorithms

### Preemptive
- **Round Robin (RR)**: Time-slice based scheduling.
- **Shortest Remaining Time First (SRTF)**: Preempts if a shorter job arrives.
- **Preemptive Priority**: Switches immediately if a higher priority process arrives.
- **Longest Remaining Time First (LRTF)**: Preempts if a process with a longer remaining time becomes available.
- **Multilevel Feedback Queue (MLFQ)**: Complex dynamic priority scheduling with 3 queues (High/RR -> Medium/RR -> Low/FCFS) and aging/demotion logic.

### Non-Preemptive
- **First-Come, First-Served (FCFS)**: Strict arrival order.
- **Shortest Job First (SJF)**: Prioritizes shortest burst time.
- **Longest Job First (LJF)**: Prioritizes longest burst time.
- **Priority Scheduling**: Processes executed based on assigned priority.
- **Highest Response Ratio Next (HRRN)**: Dynamic priority based on waiting time to prevent starvation.
- **Multilevel Queue (MQ)**: Static fixed-priority queues (High: RR, Low: FCFS).

## 📚 Documentation

- [Architecture Overview](docs/architecture.md)
- [MongoDB & Environment Setup](docs/MONGODB_SETUP.md)
- [Google OAuth Setup Guide](docs/GOOGLE_OAUTH_SETUP.md)
- [Algorithm Implementation Guide](docs/ALGORITHM_GUIDE.md)
- [API Documentation](docs/API.md)

## 🤝 Contributing

Contributions are welcome! Please check out the `FEATURES.md` for planned improvements.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request