# RECLAIM AI

RECLAIM AI is an AI-ready receivables management and payment resolution platform for MSME exporters. The current implementation includes a database-backed application shell, authentication, multi-tenant access control, seeded receivables data, administrative dashboards, and manager workspaces.

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

## Database, seeding, and authentication

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

The backend reads `DATABASE_URL` and `JWT_ACCESS_SECRET` from `backend/.env`. Keep that file local and uncommitted. Run migrations before seeding a new database:

```bash
cd backend
npm run prisma:generate
npm run prisma:deploy
npm run seed
```

The seed script imports the synthetic dataset from `data/reclaim_ai_dataset` and creates the dataset workspace, including customers, invoices, purchase orders, payments, matching cases, confirmed allocations, communications, disputes, supporting documents, webhook records, and action queue items.

In non-production development, seeding creates the bootstrap owner account below if it does not already exist:


The bootstrap owner must change this password on first sign-in. Set `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` in `backend/.env` to use different values. Production seeding requires both variables to be set.

Authentication uses short-lived access tokens in the frontend and an HTTP-only, rotated refresh cookie. Business-owned reads use the authenticated membership business context, and protected routes enforce both membership and role requirements.

### PayPal sandbox setup

Set `PAYPAL_MODE=sandbox`, `PAYPAL_CLIENT_ID`, and `PAYPAL_CLIENT_SECRET` in `backend/.env` using a PayPal sandbox REST app. Configure its webhook URL as `https://<your-api-host>/api/paypal/webhook`, subscribe to `PAYMENT.CAPTURE.COMPLETED`, and set its webhook ID as `PAYPAL_WEBHOOK_ID`. Use `PAYPAL_MODE=live` with live app credentials only when deploying to production.

Authenticated endpoints are `GET /api/paypal/connection`, `POST /api/paypal/orders` with `{ "invoiceId": "..." }`, and `POST /api/paypal/orders/:orderId/capture`. The order endpoint charges the invoice's current outstanding balance and returns PayPal's approval URL. After approval, PayPal returns to `/receivables`; the frontend captures the order against the signed-in business and records the transaction. Verified completion webhooks also record payments idempotently; they do not allocate a payment to an invoice, so the reconciliation review remains required.

This initial integration uses one PayPal REST app and merchant account configured on the server. Per-business merchant onboarding, refunds, disputes, and hosted payment buttons are not included yet.

## Implemented functionality

### Authentication and security

- Registration and login with bcrypt password hashing and Zod request validation.
- JWT access tokens with refresh-token rotation and logout revocation.
- HTTP-only refresh cookies and authentication rate limiting.
- Password-change flow for newly bootstrapped accounts.
- Multi-tenant business memberships and tenant-scoped data access.
- Role-based route protection for owners, admins, managers, and members.

### Owner and admin experience

- Admin dashboard with outstanding, overdue, collected, expected, unmatched, and overdue-invoice metrics.
- Receivables ageing grouped by due-date range and currency.
- Upcoming-receipts summary with links into receivables.
- Business user list with role changes and account status visibility.
- Protected admin API endpoints for dashboard data, user management, and manager assignments.
- Activity logging for administrative role and assignment changes.

### Manager experience

- Manager-only dashboard with assigned invoice and customer counts.
- Assigned balance and overdue-invoice metrics.
- Manager-scoped invoice, payment, and task endpoints.
- Navigation and routes that change based on the authenticated membership role.

### Payment reconciliation

- Business-scoped queue for completed payments with deterministic invoice suggestions based on payer identity, invoice references, currency, amount, and dates.
- Manager queues and allocation actions are limited to assigned invoices and customers.
- Suggestions show their matching signals and rule score; every allocation requires an explicit user confirmation.
- Allocation writes lock the payment and invoice rows, enforce customer, currency, and balance constraints, refresh invoice totals, and record an activity event.

### PayPal Checkout

- Server-side OAuth credentials and sandbox/live API selection, with a connection check that does not expose secrets.
- Invoice-balance order creation, PayPal approval redirect, and authenticated capture that records the completed transaction idempotently.
- Raw-body webhook intake with PayPal signature verification; completed captures are recorded and logged for reconciliation.
- Captures remain unallocated until a reviewer confirms their invoice match.

### Application foundation

- React/Vite application shell with responsive navigation, reusable UI primitives, loading states, empty states, metric cards, status badges, and API health status.
- Receivables, AI operations, activity, settings, and product areas wired into the application shell, with placeholder surfaces where workflows are not yet implemented.
- Prisma migrations for the normalized receivables model, authentication/memberships, allocation safeguards, and admin-panel fields.

## Validation and tests

From `backend`:

```bash
npm run prisma:validate
npm run test:auth
npm run build
```

From the repository root:

```bash
npm run build
```

## Next planned work

Invoice workflow actions, per-business PayPal merchant onboarding, AI-assisted matching and communications, document processing, and background jobs remain planned extensions. The current reconciliation workflow uses deterministic rules and human confirmation; automated matching and payment-provider integrations beyond the initial PayPal Checkout capture flow are not yet implemented.
