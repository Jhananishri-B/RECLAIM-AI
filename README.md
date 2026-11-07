# RECLAIM AI

Phase 1 foundation for an AI-powered receivables management and payment resolution platform for MSME exporters.

## Stack

- Frontend: React, TypeScript, Vite, React Router, Axios
- Backend: Node.js, Express, TypeScript, dotenv
- Development: npm and concurrently

## Getting started

```bash
npm run install:all
copy frontend\.env.example frontend\.env
copy backend\.env.example backend\.env
npm run dev
```

The frontend runs at [http://localhost:5173](http://localhost:5173) and the API runs at [http://localhost:4000](http://localhost:4000). The health check is available at `GET http://localhost:4000/api/health`.

For independent development, run `npm --prefix frontend run dev` or `npm --prefix backend run dev`.

## Phase 1 scope

This release provides the application shell, navigation, reusable UI primitives, API client, structured health endpoint, configuration, logging, and centralized error handling. Authentication, persistence, invoice workflows, reconciliation, AI agents, integrations, and background jobs are intentionally deferred to later phases.
