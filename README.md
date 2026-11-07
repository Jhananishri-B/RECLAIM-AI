# RECLAIM AI

Phase 1 foundation for an AI-powered receivables management and payment resolution platform for MSME exporters.

## Stack

- Frontend: React, TypeScript, Vite, React Router, Axios
- Backend: Node.js, Express, TypeScript, Prisma, PostgreSQL, JWT, bcryptjs, dotenv
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

## Database and authentication

From the backend directory:

```bash
npm install
npm run prisma:validate
npm run prisma:generate
npm run prisma:deploy
npm run seed
npm run test:auth
npm run build
```

The backend reads `DATABASE_URL` and `JWT_ACCESS_SECRET` from `backend/.env`. Keep that file local and uncommitted. Authentication uses short-lived in-memory access tokens in the frontend and an HTTP-only, rotated refresh cookie. Business-owned reads must use the authenticated membership business context.

## Phase 1 scope

Phase 1 provides the application shell, navigation, reusable UI primitives, API client, structured health endpoint, configuration, logging, and centralized error handling. Phase 2 adds the normalized Prisma data model, migrations, safe allocation constraints, and reproducible dataset importer. Phase 3 adds authentication, refresh-session rotation, memberships, role checks, and tenant-scoped customer access. Invoice workflows, reconciliation engines, PayPal APIs, AI agents, and background jobs remain deferred.
