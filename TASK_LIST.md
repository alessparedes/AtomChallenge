# Task List - AI Agent Builder (ATOM 2026)

This roadmap tracks the development of the "AtomBuilder" system based on the Maestro requirements defined in `REQUERIMIENTOS_CHALLENGE.md`.

---

## 🛠 1. CORE ARCHITECTURE & INFRASTRUCTURE
- [x] **Project Scaffolding:** Initial Angular (v20) and NestJS projects created.
- [x] **Frontend Mocks:** UI prototypes for all 5 screens (Dashboard, Editor, Deploy, Logs, Playground) with mock data.
- [ ] **Database Connection:** Finalize PostgreSQL connection via TypeORM in NestJS.
- [ ] **Dockerization:** Create `Dockerfile` for backend/frontend and `docker-compose.yml` for the full stack (App + Postgres).
- [ ] **VPS Deployment:** Setup Ubuntu server and CI/CD for Docker-based deployment.

---

## 💻 2. FRONTEND (Angular 20)
- [x] **Main Layout:** Collapsible Sidebar with Dark/Light mode toggle.
- [x] **Dashboard:** Searchable list of flows (cards) with CRUD controls.
- [x] **Editor UI:** Node canvas (ngx-xyflow), categorization by colors, and sidebar properties panel.
- [x] **Playground UI:** Interactive chat window with multi-agent selection.
- [x] **Logs UI:** Terminal-style view for execution trace.
- [ ] **Backend Integration:** Replace all `mock-flows.ts` usages with `FlowService` (HttpClient calls).
- [ ] **Canvas Logic:** Implement dynamic SVG connectors and edge calculations between nodes.
- [ ] **Canvas Auto-Save:** Signal-based trigger to auto-save to backend when nodes are moved or modified.

---

## ⚙️ 3. BACKEND (NestJS & API)
- [ ] **CRUD API:** Endpoints for `AgentFlow` (GET all, GET by ID, POST new, PUT update, DELETE).
- [ ] **Publishing Logic:** Endpoint `PUT /api/flows/:id/publish` to generate `agentUuid` and versioning.
- [ ] **Data Repository:** Persistence layer for `graph_json` (JSONB) in PostgreSQL.
- [ ] **Execution Engine:** Service to parse the DAG (Metadata-Driven DAG) and execute node-by-node.
- [ ] **Real-time Logging:** Implementation of Server-Sent Events (SSE) or WebSockets to stream execution status.

---

## 🧠 4. AI AGENT LOGIC (LangChain / OpenAI)
- [ ] **Trigger Node:** Input parsing and session management.
- [ ] **Memory Node:** Implementation of `Redis` or Postgres-based message history per `sessionId`.
- [ ] **Orchestrator Node:** Intention classification using LLMs to route to specific Specialists.
- [ ] **Validator Node:** Entity extraction (Profile, Budget, etc.) for lead qualification.
- [ ] **Specialists:** Implement logic for the 3 required use cases:
  - [ ] **FAQs Specialist:** Vector search or keyword match against `faq.json`.
  - [ ] **Catalog Specialist:** Filter logic for `autos.json` (Price, Segment).
  - [ ] **Agenda Specialist:** Check availability in `dates.json`.
- [ ] **Tools Integration:** Connect Specialists with the respective JSON files in the `/data` directory.

---

## 🎨 5. UX/UI & POLISH
- [x] **Desktop-First Design:** Optimized for 1440px screens as required.
- [ ] **Micro-animations:** Smooth transitions between screens and node interaction feedback.
- [ ] **Global Indicator:** Add "Saved / Unsaved" badge in the editor header based on sync status.
- [ ] **Integration Snippet:** Generate a copy-pasteable HTML/JS code for embedding the chat widget.

---

## 📈 EVALUATION CRITERIA TRACKER
- **Architecture (35 pts):** [░░░░░░░░░░] 20%
- **UX/UI (25 pts):** [████████░░] 80%
- **Functionality (25 pts):** [░░░░░░░░░░] 10%
- **Teamwork (15 pts):** [███████░░░] 70%
