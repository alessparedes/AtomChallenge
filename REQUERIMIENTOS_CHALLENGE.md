# CONTEXTO MAESTRO: AI AGENT BUILDER - ATOM 2026

## 1. OBJETIVO Y CRITERIOS DE EVALUACIÓN
* **Arquitectura (35 pts):** Escalabilidad, desacoplamiento (Frontend/Backend) y persistencia en la nube.
* **UX/UI (25 pts):** Interfaz Desktop-First, intuitiva, tipo Flowise/LangFlow con Dark/Light mode.
* **Funcionalidad (25 pts):** Implementación de los 3 casos de uso (FAQs, Autos, Agenda).
* **Trabajo en Equipo (15 pts):** Estructura de código organizada y clara.

## 2. ESTRUCTURA DE PROYECTO Y STACK
* **Frontend:** `/frontend` (Angular 17+, Signals, Tailwind CSS, AngularFire).
* **Backend:** `/backend` (Node.js/Express, orquestador de agentes).
* **Base de Datos:** PostgreSQL en un docker para persistencia de grafos y sesiones.
* **Hosting:** Servidor AWS EC2 para el despliegue de la demo.

## 3. INTERFAZ Y NAVEGACIÓN (Desktop-First Only)
Se requiere un layout de alta densidad para escritorio con los siguientes Tabs:
* **Resolución:** Diseño optimizado para pantallas de 1440px o superiores. Prohibido el uso de layouts móviles o menús de hamburguesa.
* **Barra de Navegación Lateral (Sidebar):** Debe contener los iconos y etiquetas para:
    - **Dashboard:** Gestión de flujos.
    - **Logs:** Consola técnica de ejecución.
    - **Playground:** Chat de pruebas.

1. **Dashboard:** 
    - Funcionalidad CRUD visible: Lista de flujos guardados con el nombre del flujo, fecha de creacion. Cada elemento de la lista debe tener botones o menú contextual para: [Abrir, Duplicar, Renombrar, Eliminar, desplegar].
    - Botón de Acción: Un botón destacado de '+ Nuevo Flujo'.

2. **Editor:** 
    - Esta pantalla proviene de dashboard al presionar abrir, seria el flujo seleccionado en la coleccion flows de firestore.
    - Canvas de nodos con auto-guardado en Firestore e indicador de sincronización con la base de datos, badge que diga 'Guardado' o 'Sin Guardar' en la parte superior. 
    - Sidebar Izquierda (Toolbox): Nodos categorizados por color: [Trigger (Azul), Memoria (Morado), Orquestador (Rojo), Validador (Amarillo), Especialista (Verde), Tool/JSON (Esmeralda)].
    - anvas Central: Área amplia con rejilla (grid) y conexiones curvas entre nodos.
    - Sidebar Derecha (Properties): Panel dinámico que cambia según el nodo seleccionado para configurar parámetros (ej. Seleccionar 'autos.json' en el nodo Tool).
    - Adicional a la funcionalidad de Flowise/LangFlow, debe tener la funcionalidad de arrastrar y soltar nodos, conectar nodos, eliminar nodos, guardar grafo, cargar grafo, publicar grafo. 

3. **Despliegues:** 
   - Esta pantalla proviene de dashboard al presionar desplegar, seria el flujo seleccionado en la coleccion flows de firestore.
   - Debe mostrar una pantalla con el detalle del flujo como fecha de creacion, fecha de actualizacion, version actual y la sección de 'Integration' que muestre un 'API Key' y un código de ejemplo (Snippet) para insertar el chat en cualquier web. Historial de 'Deploys'previos con fecha y estado. y a la par del nombre un botón para publicar la versión actual del grafo.
4. **Logs:** 
    - Consola estilo terminal (fondo negro, texto verde/blanco) que muestre el 'trace' de los nodos ejecutados (ej: 'Orchestrator routed to Specialist...') dependiendo del playground segun que flujo se este utilizando. Debe mostrar la fecha y hora de cada ejecucion.
5. **Playground (Multi-Agente):** 
   - Selector (Dropdown) para elegir entre los agentes publicados o en borrador.
   - Chat interactivo que carga el grafo específico del agente seleccionado.
   - Persistencia de `sessionId` por agente.

6. **Estetica:**
   - Tema: Dark Mode de alto contraste y light mode (estilo moderno tech) que tenga un toggle para cambiar entre ambos.
   - Debe ser responsive y adaptarse a diferentes tamaños de pantalla.
   - Debe tener un diseño limpio y moderno, con animaciones suaves y transiciones fluidas.

## 4. FLUJO DE NODOS Y LÓGICA DE AGENTES
El editor debe permitir la conexión lógica de:
* **Trigger:** Entrada de usuario.
* **Memoria:** Recuperación de contexto e historial de sesión.
* **Orquestador:** Clasificación de intención y ruteo.
* **Validador:** Extracción de datos (Perfil: asalariado/independiente, Presupuesto, etc).
* **Especialista:** Lógica de negocio consumiendo Tools.
* **Tool/Data:** Consulta a `autos.json`, `faq.json` o `dates.json`.
* **Respuesta:** Generación de salida y actualización de memoria.

## 5. CASOS DE USO (Fuentes de Datos Adjuntas)
* **FAQs:** Consultas basadas en `faq.json`.
* **Catálogo:** Búsqueda en `autos.json` (filtrado por precio/segmento + imágenes).
* **Agenda:** Verificación de slots en `dates.json` y propuesta de alternativas.

## 6. GESTIÓN DE PERSISTENCIA (Firebase Firestore)
* **Colección `flows`:** Documentos con el JSON del grafo, nombre, fecha de creación y estado.
* **Colección `sessions`:** Almacenamiento del historial de mensajes para que no se pierdan al recargar.

## 7. Arquitectura
* **Metadata-Driven DAG:** El frontend genera un JSON del grafo.
* **Persistencia del Editor:** El estado del canvas (posiciones y configuraciones) DEBE guardarse automáticamente para que no se pierda al cerrar el navegador (Firestore).
* **Sesión de Chat:** Manejo de `sessionId` para mantener el contexto de la charla.