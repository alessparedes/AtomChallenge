# Análisis del Backend
Hemos importado la estructura del Backend (NestJS). A continuación el detalle de los Endpoints y Tablas configuradas.

## 1. Endpoints Disponibles
El compañero creó dos controladores principales bajo el prefijo global `/api`:

### A. WorkflowsController (`/api/workflows`)
* `POST /api/workflows`: Crea un flujo vacio o con configuración en la BD.
* `GET /api/workflows/:id`: Obtiene un flujo de la BD por su ID.
* `PATCH /api/workflows/:id`: Modifica la estructura del flujo.
* `DELETE /api/workflows/:id`: Borra el flujo correspondiente.

### B. TelegramController (`/api/telegram`)
* `POST /api/telegram/:workflowId`: Integrado con un servicio orquestador (`WorkflowEngineService`). Recibe en su Body `{ message: string, sessionId: string }` y genera una respuesta procesando el grafo con LangChain. Esto es perfecto para conectarlo al **Playground** del Frontend.

## 2. Docker Compose
Tu compañero incluyó un archivo `docker-compose.yml`. Configuró únicamente un servicio de **PostgreSQL 15** en el puerto local `54321`.
> Ya levanté exitosamente el contenedor de la BD en tu máquina asegurándome que tengamos de variables de entorno usuario y contraseña como `admin:admin`. También ejecuté un `npm install` forzado para instalar las versiones de `@langchain`.

## 3. Discrepancia Estructural de Datos (FRONT vs BACK)
El backend utiliza **TypeORM** con la siguiente estructura dividida en tablas relacionales, mientras que en el Frontend habíamos diseñado guardarlo como un solo JSON gráfico:

* **Entity `Workflow`**: Guarda `id`, `name`, `isActive` y fechas. 
* **Entity `NodeEntity`**: Guarda `id`, `config (JSON)`, `positionX`, `positionY`, relacionadas a un Workflow y a un `NodeType`.
* **Entity `EdgeEntity`**: Guarda `source`, `target` y relación a Workflow.

### ⚠️ Próximos Pasos (Resolución Necesaria)
Debido a que tu compañero estructuró la Base de Datos dividiendo los **Nodes** y los **Edges** de forma relacional estricta, en lugar de nuestro JSON flexible (`graph_json` que definimos en el FRONTEND_SPEC):

**¿Cómo prefieres que resolvamos esta diferencia?**
1. **Modificamos el Frontend:** Hacemos que el editor de Angular adapte su botón de 'Guardar' para disparar mapeos exactos extrayendo nodos y aristas para enviarlos al endpoint.
2. **Modificamos el Backend:** Recomiendo cambiar las entidades de TypeORM de tu compañero para que sólo exista la tabla `Workflows` que acepte una columna tipo JSONB y guarde toda la gráfica de una.

¿Qué aproximación tomamos?
