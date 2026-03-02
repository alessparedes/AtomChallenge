# API Reference - AtomBuilder

This document provides the API endpoints for the **AtomBuilder** project backend.

## 1. Flows (CRUD)

- **GET `/api/flows`**
  - **Description:** Returns a list of all agent flows in the system.
  - **Common Filter:** `?status=Published` (returns ONLY published agents for the Playground).
  - **Response:** `AgentFlow[]`.

- **GET `/api/flows/:id`**
  - **Description:** Returns the details and `graph_json` of an agent flow by its ID.
  - **Response:** `AgentFlow`.

- **POST `/api/flows`**
  - **Description:** Creates a new agent flow in 'Draft' status.
  - **Payload:** `{ name: string, description?: string }`.

- **PUT `/api/flows/:id`**
  - **Description:** Updates the fields of an existing agent flow (e.g., when saving the canvas).
  - **Payload:** `Partial<AgentFlow>`.

- **PUT `/api/flows/:id/publish`**
  - **Description:** Publishes an agent flow, changing status to 'Published', generating an `agentUuid`, and updating `dateDeploy`.
  - **Response:** `{ success: boolean, agentUuid: string }`.

- **DELETE `/api/flows/:id`**
  - **Description:** Deletes or archives an agent flow.

---

## 2. Execution (Playground)

- **POST `/api/playground/chat`**
  - **Description:** Interactive chat endpoint for testing agents.
  - **Payload:**
    ```json
    {
      "sessionId": "UUID",
      "agentId": "UUID",
      "message": "User query string"
    }
    ```
  - **Response:** `{ response: string, traceId: string }`.

- **GET `/api/logs/stream/:sessionId`**
  - **Description:** (Planned) SSE or WebSocket endpoint for streaming the execution trace for the Logs view.

---

## 3. Data Models

### **AgentFlow**
```json
{
  "id": "UUID",
  "name": "FAQ Agent",
  "description": "Handles common customer questions.",
  "status": "Draft | Published | Archived",
  "dateCreated": "ISO8601",
  "lastModified": "ISO8601",
  "dateDeploy": "ISO8601 | null",
  "agentUuid": "string | null",
  "graph_json": {
    "nodes": [],
    "edges": []
  }
}
```
