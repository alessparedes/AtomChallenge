# Especificación del Frontend (Angular 20)
**Fecha:** 2026-03-01
**Proyecto:** AtomBuilder Agent Editor
**Estado:** Interfaz core finalizada (Mocks Integrados). Lista para conectar a APIs.

Este documento sirve como guía arquitectónica para cualquier desarrollador frontend que necesite integrarse, continuar o modificar la interfaz de AtomBuilder.

## 1. Stack Tecnológico Principal
- **Framework:** Angular 20 (Componentes Standalone). No hay `NgModules`.
- **Estilos:** Tailwind CSS v3 + SCSS nativo. (Tema Dark/Light soportado mediante variables en `src/styles.scss`).
- **Estado Reactivo:** Uso extensivo de **Angular Signals** (`signal()`, `computed()`, `effect()`).
- **Drag & Drop:** `@angular/cdk/drag-drop` (usado para el Canvas del Editor de Nodos).
- **Íconos:** Lucide Icons (SVGs inline embebidos para evitar dependencias externas pesadas).

## 2. Estructura de Directorios Clave

Toda la aplicación vive en `frontend/src/app/`:

```text
app/
├── core/
│   ├── mocks/
│   │   └── mock-flows.ts         # Datos temporales simulando respuestas del backend.
│   └── models/
│       └── flow.model.ts         # Interfaz principal `AgentFlow` y sub-modelos.
├── features/
│   ├── dashboard/                # Pantalla principal (Grid/List de flujos y modal crear).
│   ├── deploy/                   # Pantalla de publicación y snippet (Iframe embed script).
│   ├── editor/                   # Editor Canvas Drag&Drop (Nodos, Conectores, panel Propiedades).
│   ├── logs/                     # Visualizador estilo Bash/Terminal de las ejecuciones.
│   └── playground/               # Emulador de Chat (Multi-agente) para testear flujos 'Published'.
└── layout/
    └── main-layout/              # Layout envolvente. Sidebar dinámico (Colapsable con LocalStorage).
```

## 3. Patrones de Diseño Implementados

### 3.1. Routing & Layout Centralizado
- `app.routes.ts` orquesta todo. El `MainLayoutComponent` envuelve las vistas hijas (`<router-outlet>`).
- Todas las rutas hacen `loadComponent` para aprovechar el **Lazy Loading**.

### 3.2. Manejo de Estado (Signals)
En lugar de RxJS complejo o NgRx, cada vista Features maneja su estado con Signals para renderizado ultra-rápido:
- `dashboard.ts`: Signals numéricos y de string manejan los *Tabs* (All, Live, Draft) y la barra de búsqueda reactivamente.
- `playground.ts`: Utiliza arrays de Messages en Signals con dependencias (`effect`) para forzar un scroll automático al final del DOM cada que el agente o usuario escribe.

### 3.3. Sidebar Dinámico y Tema
- El modo oscuro (`isDarkMode`) aplica la clase `dark` sobre la etiqueta `<html>` raíz de Tailwind.
- El Sidebar usa una señal `isCollapsed` ligada a `localStorage` para recordar preferencias. Se adapta suavemente entre sus anchos (w-64 a w-20) e incluye tooltips que sólo se muestran cuando el menú está colapsado.

## 4. Notas para el Desarrollo Futuro

1. **`FlowService` (Pendiente):** Cuando el backend esté listo, la prioridad #1 es crear el `flow.service.ts` en `core/services/` e inyectar `HttpClient`. Todo deberá sustituir directamente al uso actual de la constante `MOCK_FLOWS`.
2. **Conectores SVG Visuales:** Actualmente en `EditorComponent` los nodos se arrastran usando el Angular CDK en un Canvas libre. El siguiente paso técnico complejo (si se requieren flechas que unan visualmente a los nodos) es calcular líneas SVG dinámicas (`<path d="...">`) calculando los centros relacionales (X,Y) usando `ElementRef` entre el nodo padre y el nodo destino.
3. **Logs en Tiempo Real:** El `LogsComponent` actualmente itera localmente mediante `setInterval` empujando mensajes a su arreglo. Una vez Node.js exista, esto debe cambiarse a escuchar un `WebSocket` o eventos de Server-Sent Events (SSE).
