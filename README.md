# AI Agent Builder - ATOM 2026

![Project Banner](https://img.shields.io/badge/Status-Development-orange)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![Tech Stack](https://img.shields.io/badge/Stack-Angular%20%7C%20NestJS%20%7C%20PostgreSQL-green)

## 🚀 Overview

**AtomChallenge** is a high-performance, desktop-first AI Agent Builder designed for the 2026 ATOM Challenge. It provides a low-code/no-code interface similar to Flowise or LangFlow, allowing users to create, test, and deploy complex AI agent workflows using a Metadata-Driven DAG (Directed Acyclic Graph) architecture.

The platform enables building specialized agents for various use cases such as FAQs, automotive catalogs, and appointment scheduling, integrating with multiple data sources and memory systems.

---

## 🛠 Tech Stack

### Frontend
- **Framework:** Angular 20 (Standalone Components)
- **State Management:** Angular Signals
- **Styling:** Tailwind CSS + SCSS
- **Flow Engine:** `ngx-xyflow` (React-based flow library integrated into Angular)
- **Icons:** Lucide Icons

### Backend
- **Framework:** NestJS (Node.js)
- **ORM:** TypeORM
- **Database:** PostgreSQL (with Docker support)
- **AI Orchestration:** LangChain / OpenAI
- **Communication:** REST API + (Planned) WebSockets for real-time logs

### Infrastructure
- **Containerization:** Docker & Docker Compose
- **Deployment:** VPS Ubuntu (Optimized for 1440px+ screens)

---

## 📐 Architecture: Metadata-Driven DAG

The core of AtomChallenge follows a **Metadata-Driven Directed Acyclic Graph (DAG)** pattern. 

Unlike traditional builders where logic is hardcoded, this system serializes the visual canvas into a `graph_json` blob. This metadata is then parsed by the backend execution engine to dynamically route user queries through various "Specialist" nodes, maintaining a clear separation between the UI representation and the execution logic.

---

## 🏗 Project Structure

```text
AtomChallenge/
├── frontend/               # Angular 20 Application
│   ├── src/app/core/       # Models, Services, Mocks, Guards
│   ├── src/app/features/   # Dashboard, Editor, Deploy, Logs, Playground
│   └── src/app/layout/     # Main Layout and Navigation
├── backend/                # NestJS Application
│   ├── src/modules/        # Flows, Execution, Auth, Logs
│   ├── src/entities/       # TypeORM Entities (Postgres)
│   └── src/services/       # AI Orchestration Logic
├── data/                   # JSON Data Sources (autos.json, faq.json, etc.)
├── docs/                   # Detailed Project Documentation
├── docker-compose.yml      # Infrastructure orchestration
└── REQUERIMIENTOS_CHALLENGE.md  # Original Project Requirements
```

---

## 🌟 Key Features

1.  **Dashboard:** CRUD operations for agent flows with card-based management (Open, Duplicate, Rename, Delete, Deploy).
2.  **Visual Editor:** A powerful canvas for building DAGs with nodes such as Trigger, Memory, Orchestrator, Validator, and Specialists. Includes auto-save to PostgreSQL.
3.  **Playground:** Multi-agent chat interface to test published or draft agents with persistent session context.
4.  **Deployment Center:** Manage versions, API keys, and integration snippets (Iframe/Widget).
5.  **Technical Logs:** Real-time terminal-style execution trace for debugging agent logic.
6.  **Dual Theme:** Modern Dark/Light mode support with high-contrast UI.

---

## ⚙️ Getting Started

### Prerequisites
- Node.js v20+
- Docker & Docker Compose
- PostgreSQL

### Local Development

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd AtomChallenge
    ```

2.  **Setup Backend:**
    ```bash
    cd backend
    npm install
    npm run start:dev
    ```

3.  **Setup Frontend:**
    ```bash
    cd ../frontend
    npm install
    npm run start
    ```

4.  **Database (via Docker):**
    ```bash
    docker-compose up -d
    ```

---

## 📄 Documentation

For more detailed information, please refer to the following:
- [Architecture Overview](docs/architecture.md)
- [API Reference](docs/api_reference.md)
- [Frontend Guide](docs/frontend_guide.md)
- [Task List (Roadmap)](TASK_LIST.md)

---

## ⚖️ License
UNLICENSED - Internal Project for ATOM 2026
