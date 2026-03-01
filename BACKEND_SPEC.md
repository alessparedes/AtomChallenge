# Especificación para el Backend (Node.js + PostgreSQL)
**Fecha:** 2026-03-01
**Proyecto:** AtomBuilder Agent Editor
**Contexto:** El Frontend en Angular (Standalone + Signals + Tailwind) ya está finalizado. Utiliza Mock Data para simular todas las vistas. El objetivo de este documento es transferir el conocimiento al desarrollador Backend sobre la API REST que espera consumir el cliente.

## 1. Arquitectura de Datos (Modelos)

El modelo núcleo que espera el Frontend se llama `AgentFlow` (Ver: `frontend/src/app/core/models/flow.model.ts`).

```typescript
export interface AgentFlow {
  id: string; // UUID v4 o autogenerado por Postgres
  name: string; // Nombre dado por el usuario al agente
  description: string; // Breve descripción de lo que hace (Puede venir en null por defecto)
  status: 'Draft' | 'Published' | 'Archived'; // Estado actual del despliegue del flujo
  dateCreated: Date | string; // Fecha de creación (ISO string)
  lastModified: Date | string; // Última fecha de edición del flujo
  dateDeploy?: Date | string; // Fecha de última vez que se hizo el "Publish" (opcional)
  agentUuid?: string; // (Opcional) UUID autogenerado tras publicar para uso externo (Widget embebible)
  graph_json?: any; // El contenido del canvas visual (nodos y conexiones)
}
```

> **NOTA SOBRE `graph_json`:** El frontend (EditorComponent) usará drag & drop en un canvas. Enviará la estructura topológica del grafo (posiciones de nodos y aristas) en este campo en formato JSON (Ej. tipo `JSONB` en Postgres).

## 2. API REST Endpoints Esperados

El Frontend, cuando deje de usar los *mocks* (en `frontend/src/app/core/mocks/mock-flows.ts`), intentará comunicarse a través de Axios o del `HttpClient` de Angular con las siguientes rutas en el Backend (Node.js/Express):

### A. Flujos de Agentes (CRUD)
- `GET /api/flows` -> Retorna un arreglo `[]` del tipo `AgentFlow`. Utilizado por el Dashboard y por el Playground (filtrando por status).
- `GET /api/flows/:id` -> Retorna un objeto `AgentFlow`. Utilizado al entrar a la vista `/editor/:id` o `/deploy/:id`.
- `POST /api/flows` -> Crea un flujo en estado 'Draft'. Payload mínimo: `{ name: string }`.
- `PUT /api/flows/:id` -> Actualiza todo el objeto (Se dispara cuando en el Frontend dan click a "Guardar" y manda el `graph_json`).
- `PUT /api/flows/:id/publish` -> Cambia el estado a 'Published', le asigna un `agentUuid` (si no tiene) y asigna un `dateDeploy`. Retorna el uuid asignado.
- `DELETE /api/flows/:id` -> Elimina de postgres o lo marca archivado 'Archived'.

### B. Playground y Logs (Ejecución Virtual Multi-Agente)
- `POST /api/playground/chat` -> Para la simulación de chat. Recibe: `{ sessionId: string, agentId: string, message: string }`. Debe retornar la respuesta del AI (esto conectará con la lógica Langchain/Gemini en Node posteriormente).
- `GET /api/logs/stream` (Opcional - WebSockets o SSE) -> Para el **LogsComponent**, o un endpoint genérico para obtener la traza de Node.js en String Arrays. Actualmente, el frontend lo simula por `setInterval` con líneas de consolas técnicas, por lo que una vía de Streaming de Eventos o Websockets es súper recomendable si la ejecución va a tardar varios segundos de ida y venida.

## 3. Implementación Sugerida

- **Stack:** Node.js (v20+), Express.js o Fastify, PostgreSQL y Prisma / Sequelize ORM.
- **Capa Base de Datos:**
  ```sql
  CREATE TABLE flows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Draft',
    dateCreated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastModified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dateDeploy TIMESTAMP NULL,
    agentUuid VARCHAR(255) NULL,
    graph_json JSONB NULL
  );
  ```

¡Cualquier duda, el repositorio ya tiene en `frontend/src/app/core/models/flow.model.ts` y en los `Mocks` exactamente cómo lucen todos los datos!
