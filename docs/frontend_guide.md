# Frontend Development Guide - Angular 20

This guide explains the architectural patterns used in the **AtomChallenge** frontend.

## 1. Core Principles

The frontend is built on **Angular 20 (Standalone Components)** with a focus on reactivity via **Signals**.

- **No `NgModules`:** All components are standalone and import only what they need.
- **Signals:** State management (`signal()`, `computed()`, `effect()`) for ultra-efficient rendering.
- **Tailwind CSS:** All styling is managed via utility classes for consistent UI.

## 2. Directory Structure

- **`/core`**:
  - **`/models`**: TypeScript interfaces (e.g., `AgentFlow`).
  - **`/services`**: Shared logic (HTTP calls to the backend).
  - **`/mocks`**: Pre-backend mock data (e.g., `mock-flows.ts`).
- **`/features`**:
  - **`/dashboard`**: CRUD grid for flow management.
  - **`/editor`**: Canvas logic and node configuration.
  - **`/playground`**: Real-time chat emulator.
  - **`/logs`**: Technical terminal for tracing.
- **`/layout`**: Main shell with navigation.

## 3. The Flow Editor (`EditorComponent`)

The editor uses `ngx-xyflow` to render the node canvas.

### Node Categorization
Nodes are categorized by colors according to the requirements:
- **Trigger**: Blue
- **Memory**: Purple
- **Orchestrator**: Red
- **Validator**: Yellow
- **Specialist**: Green
- **Tool/JSON**: Emerald

### Auto-Save Strategy
The `EditorComponent` listens for change events on the canvas (e.g., `onNodesChange`, `onEdgesChange`). These triggers update a local signal, and an `effect()` debounces the change to push an update to the backend (`PUT /api/flows/:id`).

## 4. The Playground (`PlaygroundComponent`)

The playground manages a list of messages. When a message is sent, a `sessionId` is maintained to keep the context. The `effect()` in the playground is used for **auto-scrolling** the chat container to the bottom on each new message.

## 5. UI Themes

Common themes (Dark/Light) are implemented via a `isDarkMode` signal that applies the `dark` class to the `<html>` root, leveraging Tailwind's dark mode capabilities.
