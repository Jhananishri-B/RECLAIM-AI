# RECLAIM AI

### Smart Receivables for MSME Exporters

**Investigate payments. Resolve exceptions. Reclaim cash flow.**

> An AI-powered receivables management platform designed to help Indian MSME exporters manage international payments, reconcile invoices, prioritize collections, and prepare payment-dispute evidence.

---

## 01. Overview

For an exporter, receiving an international payment is only one part of getting paid. Finance teams must identify which invoice a payment belongs to, verify amounts and currencies, investigate short or excess payments, follow up on overdue invoices, and assemble documents when a payment is disputed.

These tasks are often spread across spreadsheets, payment portals, invoices, purchase orders, and email conversations.

**RECLAIM AI brings these workflows together in one intelligent, traceable platform.**

It combines payment data, invoice records, deterministic reconciliation logic, specialized AI agents, financial dashboards, and human approval workflows.

## 02. The Problem We Solve

| Business challenge | RECLAIM AI approach |
|---|---|
| Payments are difficult to match to invoices | Multi-signal reconciliation and exception handling |
| Partial or excess payments create manual work | Allocation validation and outstanding-balance tracking |
| Overdue invoices are followed up reactively | Collection prioritization and AI recommendations |
| Disputes require evidence from multiple sources | Document collection and structured dispute summaries |
| Financial information is fragmented | Unified, role-aware financial dashboard |

## 03. How RECLAIM AI Works

```mermaid
flowchart TD
    A["Payment and Invoice Data"] --> B["Data Standardization"]
    B --> C["Reconciliation Engine"]
    C --> D{"Match Confidence and Validation"}
    D -->|"Clear candidate"| E["Proposed Allocation"]
    D -->|"Ambiguous / Unmatched"| F["Receivables Intelligence Agent"]
    F --> G["Evidence-Based Recommendation"]
    G --> H["Human Review"]
    E --> I["Backend Financial Validation"]
    H --> I
    I --> J["Confirmed Allocation / Exception Resolution"]
    J --> K["Updated Receivables Dashboard"]
    K --> L["Collection or Dispute Workflow"]
```

**Workflow:** Observe → Investigate → Recommend → Approve → Act

1. Payment and invoice information is brought into one workspace.
2. Transactions are evaluated using invoice references, customer information, amounts, currencies, dates, and available remittance details.
3. Exceptions such as partial payments, overpayments, duplicates, unmatched payments, and currency mismatches are identified.
4. Specialized agents investigate exceptions and recommend next steps.
5. Backend rules validate financial actions, with human approval for uncertain or sensitive cases.

---

## 04. Core Capabilities

### Intelligent Payment Reconciliation

- Matches payment transactions with invoice records using multiple signals.
- Handles partial payments, overpayments, split allocations, duplicate transactions, unidentified payments, and currency mismatches.
- Flags uncertain cases for review.
- Keeps confirmed allocations separate from suggested matches.
- Uses deterministic backend validation for confirmed financial allocations.

### Financial Intelligence Dashboard

- Total outstanding and overdue receivables.
- Historical collections and financial trends.
- Expected receipt estimates based on invoice due dates.
- Receivables ageing and customer payment performance.
- Unmatched payments, reconciliation exceptions, and pending approvals.

> Expected receipts are estimates based on invoice information; they are not guaranteed future cash.

### Role-Based Access

| Role | Access scope |
|---|---|
| **OWNER** | Full business visibility, user administration, integrations, and approval policies |
| **ADMIN** | Operational records and permitted workflows, excluding owner-only controls |
| **MANAGER** | Assigned customers, invoices, payments, collection tasks, and relevant recommendations |
| **MEMBER** | Restricted access based on configured permissions |

Authorization is enforced by the backend. Business records are scoped to the authenticated business membership.

---

## 05. AI Agent System

RECLAIM AI uses specialized agents coordinated through **LangGraph.js**. Each agent has a defined responsibility, controlled access to backend tools, structured outputs, and execution records.

```mermaid
flowchart TB
    U["Business Event / User Request"] --> O["LangGraph.js Orchestrator"]

    O --> R["Receivables Intelligence Agent"]
    O --> C["Collection Strategy Agent"]
    O --> D["Dispute Evidence Agent"]

    R --> RT["Investigate unmatched payments"]
    C --> CT["Prioritize overdue receivables"]
    D --> DT["Organize dispute evidence"]

    RT --> T["Controlled Backend Tools"]
    CT --> T
    DT --> T

    T --> DB[("Business Records")]
    DB --> V["Backend Validation and Policy Checks"]
    V --> H{"Human Approval Required?"}
    H -->|"Yes"| A["Authorized User Review"]
    H -->|"No"| X["Permitted Workflow Continues"]
    A --> X
    X --> L["Execution Record and Audit Log"]
```

### Agent responsibilities

| Agent | Responsibility | Output |
|---|---|---|
| **Receivables Intelligence Agent** | Investigates unmatched payments, retrieves related records, identifies discrepancies, and evaluates possible matches. | Reconciliation findings and recommendations |
| **Collection Strategy Agent** | Reviews due dates, balances, and payment history to prioritize collections. | Collection priorities and suggested follow-ups |
| **Dispute Evidence Agent** | Collects relevant documents, organizes an evidence timeline, and identifies missing items. | Evidence checklist and dispute summary |

### Responsible AI principles

- Agents use controlled backend tools rather than directly changing financial records.
- Tool access is scoped to the authenticated business and permitted role.
- Outputs are structured and validated by backend services.
- Agent runs, tool activity, recommendations, and approvals are recorded.
- Uncertain or high-impact actions require human review.
- LLMs support investigation and recommendations; deterministic services remain responsible for financial arithmetic.

The application presents useful findings and execution summaries, not hidden model chain-of-thought.

---

## 06. Payment Reconciliation Scenarios

```mermaid
flowchart TD
    P["Incoming Payment"] --> M["Evaluate Invoice References, Customer, Amount, Currency and Date"]
    M --> Q{"Reconciliation Scenario"}

    Q -->|"Exact match"| E["Candidate for Confirmation"]
    Q -->|"Partial payment"| PA["Allocate Validated Amount; Keep Remaining Balance"]
    Q -->|"Multiple payments to one invoice"| MP["Evaluate Cumulative Confirmed Allocations"]
    Q -->|"One payment across invoices"| SP["Prepare Split Allocation for Review"]
    Q -->|"Overpayment"| OV["Flag Excess Amount"]
    Q -->|"Duplicate"| DU["Prevent Duplicate Import"]
    Q -->|"Pending / Failed"| ST["Do Not Treat as Collected Funds"]
    Q -->|"Currency mismatch"| FX["Flag Currency Exception"]
    Q -->|"Unidentified / Ambiguous"| UN["Create Investigation Case"]

    E --> V["Backend Validation"]
    PA --> V
    MP --> V
    SP --> V
    OV --> H["Human Review"]
    FX --> H
    UN --> H
    DU --> LOG["Record Sync Result"]
    ST --> LOG
    H --> V
    V --> C["Confirmed Allocation or Recorded Exception"]
```

### Financial integrity principles

1. **Confirmed allocations only:** payment allocation records represent validated allocations.
2. **No payer-name-only matching:** a customer name alone is insufficient when multiple invoices are open.
3. **No premature paid status:** pending, failed, or ambiguous payments do not mark an invoice as paid.
4. **Currency separation:** different currencies are not combined without an explicit, traceable FX conversion.
5. **Decimal arithmetic:** monetary values use database decimal types rather than floating-point arithmetic.
6. **Deterministic balances:** invoice balances and allocation totals are calculated and validated by backend services.

---

## 07. System Architecture

```mermaid
flowchart TB
    subgraph USERS["User Experience"]
        OWNER["Business Owner"]
        ADMIN["Administrator"]
        MANAGER["Manager"]
    end

    subgraph FRONTEND["Frontend Layer"]
        UI["React + TypeScript + Vite"]
        DASH["Role-Aware Dashboards"]
        WORK["Receivables, Payments, Reconciliation, Disputes"]
        OPS["AI Operations and Approvals"]
    end

    subgraph BACKEND["Backend Layer"]
        API["Node.js + Express REST API"]
        AUTH["Authentication and RBAC"]
        SVC["Business Services"]
        RECON["Reconciliation Engine"]
        SYNC["Payment Synchronization"]
        AGENT["LangGraph.js Orchestration"]
    end

    subgraph DATA["Data and Integration Layer"]
        DB[("PostgreSQL")]
        ORM["Prisma ORM"]
        PAYPAL["PayPal REST APIs"]
        LLM["Configured LLM Service"]
        AUDIT["Agent Execution and Audit Records"]
    end

    OWNER --> UI
    ADMIN --> UI
    MANAGER --> UI
    UI --> DASH
    UI --> WORK
    UI --> OPS
    DASH --> API
    WORK --> API
    OPS --> API
    API --> AUTH
    AUTH --> SVC
    SVC --> RECON
    SVC --> SYNC
    SVC --> AGENT
    RECON --> DB
    SYNC <--> PAYPAL
    SYNC --> DB
    AGENT <--> LLM
    AGENT --> DB
    SVC --> ORM
    ORM --> DB
    AGENT --> AUDIT
    SVC --> AUDIT
    AUDIT --> DB
```

### Architecture layers

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend | React, TypeScript, Vite | Dashboards, receivables workflows, agent activity, and approvals |
| Backend | Node.js, Express.js, TypeScript | APIs, authentication, authorization, and business logic |
| Database | PostgreSQL | Business, invoice, payment, reconciliation, and audit data |
| ORM | Prisma | Database access and migrations |
| Agent orchestration | LangGraph.js | Agent routing, state, and controlled tool execution |
| Payment integration | PayPal REST APIs | Authorized transaction retrieval and synchronization |
| AI reasoning | Configurable LLM service | Contextual reasoning and structured recommendations |

---

## 08. PayPal Integration

The PayPal integration is designed to retrieve and synchronize transaction information that the connected account and granted API permissions allow.

```mermaid
sequenceDiagram
    actor User as Authorized Business User
    participant UI as RECLAIM AI Frontend
    participant API as Node.js Backend
    participant PP as PayPal REST API
    participant DB as PostgreSQL

    User->>UI: Initiate PayPal connection or sync
    UI->>API: Send authenticated request
    API->>API: Validate role and business access
    API->>PP: Authenticate using configured credentials / consent
    PP-->>API: Return authorized token or response
    API->>PP: Request permitted transaction data
    PP-->>API: Return transaction information
    API->>API: Map and validate transaction fields
    API->>DB: Idempotent payment upsert
    DB-->>API: Persisted payment records
    API-->>UI: Sync result and transaction summary
```

**Important access boundary:** PayPal application credentials do not automatically provide access to arbitrary third-party merchant accounts. Access to another merchant's data requires the appropriate supported merchant-consent or partner onboarding arrangement.

---

## 09. Technology Stack

| Area | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL |
| ORM and migrations | Prisma |
| Agent orchestration | LangGraph.js |
| AI reasoning | Configurable LLM integration |
| Payment integration | PayPal REST APIs |
| Authentication | JWT and secure session handling |
| API style | REST |

---

## 10. Data Model

The relational data model is organized around business ownership and traceable financial operations.

| Domain | Main entities |
|---|---|
| Organization and access | Business, User, BusinessMembership, RefreshSession |
| Integrations | BusinessIntegration |
| Customers and receivables | Customer, Invoice, PurchaseOrder |
| Payments | Payment, PaymentAllocation |
| Reconciliation | MatchingCase, MatchingCandidate |
| Evidence and disputes | SupportingDocument, Communication, Dispute |
| External events | WebhookEvent, WebhookDelivery |
| Operational workflows | ActionQueue |
| AI governance | AgentExecution, AgentToolCall, AgentRecommendation, ApprovalRecord |
| Auditability | ActivityLog |

---

## 11. Security and Financial Controls

- Passwords are stored as secure password hashes.
- Authentication and authorization are enforced by protected backend routes.
- Business-level tenant isolation is applied to data access.
- Role and record-assignment permissions are validated server-side.
- API credentials and secrets are kept out of frontend bundles and source control.
- Sensitive integration tokens are protected using appropriate encryption and key management.
- Payment synchronization is idempotent.
- Financial amounts use decimal precision.
- Agent recommendations are distinguished from completed financial actions.
- Sensitive actions are subject to approval policies.
- Important user, agent, and financial workflow events are auditable.

---

## 12. Getting Started

### Prerequisites

- Node.js and npm
- PostgreSQL
- Git
- PayPal Developer Sandbox credentials, if testing the PayPal integration
- LLM provider credentials, if agent reasoning is enabled

### Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd <YOUR_PROJECT_DIRECTORY>
```

### Install backend dependencies

```bash
cd backend
npm install
```

Create `backend/.env` using the exact variable names expected by your application:

```env
NODE_ENV=development
PORT=5000

DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE

JWT_SECRET=replace_with_a_strong_random_secret

PAYPAL_ENVIRONMENT=sandbox
PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_paypal_sandbox_client_secret
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com

LLM_API_KEY=your_llm_provider_api_key
```

**Never commit `.env` files or expose database, PayPal, JWT, or LLM credentials in frontend code.**

### Prepare the database

```bash
npx prisma generate
npx prisma migrate deploy
```

Use the project's configured seed command if a seed script is available. Use synthetic data for development and testing.

### Start the backend

```bash
npm run dev
```

### Start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite.

> Confirm the actual scripts in each `package.json` and the exact environment-variable names in the application configuration. Commands may differ by project setup.

---

## 13. Repository Structure

```text
reclaim-ai/
├── frontend/
│   └── src/
│       ├── components/
│       ├── layouts/
│       ├── pages/
│       ├── hooks/
│       ├── services/
│       ├── types/
│       └── utils/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── routes/
│       ├── services/
│       ├── agents/
│       ├── integrations/
│       ├── utils/
│       ├── types/
│       ├── app.ts
│       └── server.ts
├── design.md
└── README.md
```

The exact file and folder names may differ. Keep financial and integration logic in backend services.

---

## 14. Testing and Validation

| Area | Important validation cases |
|---|---|
| Authentication | Login, logout, session expiry, refresh, password change |
| Authorization | Owner, admin, manager, and member permissions |
| Tenant isolation | Cross-business record access is denied |
| Reconciliation | Exact, partial, split, overpayment, unmatched, and ambiguous cases |
| Financial calculations | Decimal precision, outstanding balance, currency separation |
| Payment sync | Idempotency, duplicate imports, status mapping, API failures |
| AI agents | Tool permissions, structured output, missing data, uncertain recommendations |
| Approvals | Unauthorized actions blocked; decisions recorded |
| Disputes | Evidence links, chronology, missing-document handling |
| Audit | User actions and agent executions are traceable |

---

## 15. Roadmap

- [x] Project foundation and frontend/backend structure
- [x] PostgreSQL data model and persistence
- [x] Authentication, business membership, and role-based access
- [x] Owner and manager dashboard workflows
- [x] PayPal transaction integration and synchronization
- [x] Payment reconciliation and exception handling
- [x] Specialized AI agent workflows
- [x] Human approval and audit workflows
- [x] Receivables, dispute, and activity workspaces
- [ ] Additional payment-provider integrations
- [ ] Advanced cash-flow forecasting and risk indicators
- [ ] Configurable multilingual collection communications
- [ ] Expanded analytics and operational monitoring

---

## 16. Why RECLAIM AI?

RECLAIM AI is not just an invoice tracker or a chatbot. It combines payment information, deterministic financial controls, specialized AI assistance, and human approvals in one receivables workflow.

**The goal:** help MSME exporters spend less time chasing payment information and more time making informed financial decisions.

---

<div align="center">

### RECLAIM AI — Smart Receivables for MSME Exporters

**Don't just track receivables. Understand them. Resolve them. Reclaim your cash flow.**

*From payment uncertainty to financial clarity.*

</div>

---

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Keep business logic in backend services.
4. Add or update tests for financial and authorization behavior.
5. Submit a pull request describing the change.

Do not include real customer records, payment information, tokens, or credentials in commits, screenshots, or test fixtures.
