# Team Task Board — Documentation

## Project Overview

Team Task Board is a small, self-contained Node.js example app that provides a minimal task management UI backed by a file-based JSON datastore. It demonstrates a lightweight HTTP server with static file serving plus a tiny JSON API for creating, updating, listing, and deleting tasks.

## Contents

- `server.js` — Single-file Node HTTP server that serves static files and exposes a REST-like JSON API under `/api/tasks`.
- `package.json` — Minimal package manifest (includes `start` script).
- `components/navbar.html` — Top navigation and taskbar UI.
- `components/tasks.html` — Task management UI: list, create, edit, delete, filters, and theme toggle.
- `data/tasks.json` — Persistent data file that stores tasks as a JSON array.
- `README.md` — Short project intro (this repo also contains `documentation.md` for extended docs).

## Getting Started

Prerequisites

- Node.js (v12+ recommended) installed on your machine.

Install & run

1. From the repository root, install dependencies (none required for this simple project) and start the server:

```powershell
npm start
```

2. Open your browser at `http://localhost:3000` (or the port defined by the `PORT` environment variable).

Notes

- The server is intentionally dependency-free (uses Node's built-in `http`, `fs`, and `path` modules).
- The `start` script runs `node server.js` as defined in `package.json`.

## Server & API

The server implementation lives in `server.js`. Key behaviors:

- Serves static files from the repository root via a safe path resolver. By default the root route (`/`) returns the `components/navbar.html` page.
- Exposes a JSON API for tasks at `/api/tasks` and `/api/tasks/:id`.

API endpoints

- GET `/api/tasks`
  - Returns: 200 JSON array of task objects.

- POST `/api/tasks`
  - Accepts JSON body: `{ "title": "Task title", "status": "pending|in-progress|completed" }`.
  - Validation: `title` is required; `status` defaults to `pending` if omitted or invalid.
  - Returns: 201 with the created task object.

- PUT `/api/tasks/:id`
  - Accepts JSON body with fields to update (e.g., `title`, `status`).
  - Returns: 200 with the updated task object.

- DELETE `/api/tasks/:id`
  - Deletes the task with the given numeric `id`.
  - Returns: 200 with `{ "success": true }` on success.

Error handling

- The server returns JSON error responses with appropriate HTTP status codes (400, 404, 500).
- CORS headers are set to allow requests from any origin (for local/demo use).

Data storage format

- Tasks are stored in `data/tasks.json` as a JSON array. Each task has the shape:

```json
{
  "id": 1620000000000,
  "title": "Example task",
  "status": "pending"
}
```

- `id` is generated as `Date.now()` (numeric timestamp).
- `status` must be one of `pending`, `in-progress`, or `completed`.

Front-end behavior

- `components/tasks.html` provides a dynamic UI that fetches tasks from `/api/tasks` and renders them.
- Users can search, filter by status, toggle theme (light/dark), create tasks via a form, edit titles via prompt, mark completed (checkbox), and delete tasks.
- `components/navbar.html` includes a compact taskbar view and navigation links to `tasks.html`.

Security & limitations

- This demo uses synchronous file I/O for simplicity and is not designed for production or concurrent writes.
- There is minimal validation and no authentication — do not expose this service publicly without adding proper security controls.
- The static file resolver includes a path safety check, but the server is intentionally simple.

Development notes

- To change the server port, set `PORT` before running: `PORT=4000 npm start` (Windows PowerShell: `$env:PORT=4000; npm start`).
- The server will create or overwrite `data/tasks.json` when tasks are written. Keep backups if needed.

Testing & usage examples

Create a task (curl):

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Write docs","status":"pending"}'
```

Update a task:

```bash
curl -X PUT http://localhost:3000/api/tasks/1620000000000 \
  -H "Content-Type: application/json" \
  -d '{"status":"completed"}'
```

Delete a task:

```bash
curl -X DELETE http://localhost:3000/api/tasks/1620000000000
```

Contributing

- This repository is a small learning/demo project. Suggested improvements:
  - Replace file-based storage with an embedded DB (SQLite, lowdb) for safer concurrency.
  - Add API input validation and better error messages.
  - Extract front-end JS into separate `.js` files and add bundling/build step.
  - Add automated tests for server endpoints.

License

- No license declared in the repository. Add a `LICENSE` file if you intend to publish or share.

Contact / Maintainers

- This is a demo repo. For questions, modify the project and submit a PR or open an issue in the originating source.
