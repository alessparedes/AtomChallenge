# Setup & Installation Guide - AtomBuilder

This guide will walk you through setting up the **AtomBuilder** project locally and for production.

## 1. Local Development Setup

### **Prerequisites**
- Node.js (v20+)
- PostgreSQL (Local or Docker)
- Docker & Docker Compose (Recomendado)

### **Backend (NestJS)**
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure environment variables:
    - Create a `.env` file in the root of `backend/`.
    - Provide Database URL, OpenAI API Key, and other credentials.
4.  Run in development mode:
    ```bash
    npm run start:dev
    ```

### **Frontend (Angular 20)**
1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the application:
    ```bash
    npm run start
    ```
    - The application will be available at `http://localhost:4200`.

---

## 2. Infrastructure via Docker

To run the entire stack (PostgreSQL + App) using Docker Compose:

1.  From the project root:
    ```bash
    docker-compose up --build -d
    ```
2.  Verify the services:
    - Frontend: `http://localhost:3000` (mapped to 4200)
    - Backend: `http://localhost:3001` (mapped to 3000)
    - DB: `localhost:5432`

---

## 3. Data Sources Setup

The project uses JSON data files for its specialists. These files should be located in the `/data` folder in the project root:

- `autos.json`: Automotive catalog.
- `faq.json`: Frequently asked questions.
- `dates.json`: Appointment scheduling slots.

Ensure these files are accessible to the backend execution service.

---

## 4. Deployment (Ubuntu VPS)

The project is optimized for deployment via a Docker-based architecture on Ubuntu.

1.  Install Docker and Docker Compose on your VPS.
2.  Clone the repository.
3.  Configure the production `.env`.
4.  Run `docker-compose up -d`.
5.  Setup a reverse proxy (Nginx) to map your domain to the frontend and backend ports.

- **Note on Resolutions:** The UI is desktop-first (optimizado para 1440px+). Ensure your display supports this for the best experience.
