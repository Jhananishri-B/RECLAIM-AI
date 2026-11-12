::: {align="center"}
# ✦ RECLAIM AI

### Smart Receivables for MSME Exporters

**Investigate payments. Resolve exceptions. Reclaim cash flow.**

`<img src="https://img.shields.io/badge/AI-Multi--Agent-725CFF?style=for-the-badge" alt="Multi-Agent AI">`{=html}
`<img src="https://img.shields.io/badge/FinTech-Receivables-171717?style=for-the-badge" alt="FinTech">`{=html}
`<img src="https://img.shields.io/badge/Payments-PayPal-003087?style=for-the-badge&logo=paypal&logoColor=white" alt="PayPal">`{=html}
`<img src="https://img.shields.io/badge/Status-Project%20Complete-20A779?style=for-the-badge" alt="Project Complete">`{=html}

```{=html}
<p>
```
`<b>`{=html}RECLAIM AI`</b>`{=html} is an AI-powered receivables
operations platform built to help Indian MSME exporters manage
international payments, reconcile invoices, prioritize collections, and
prepare payment-dispute evidence from one workspace.
```{=html}
</p>
```
`<a href="#key-capabilities">`{=html}Capabilities`</a>`{=html} ·
`<a href="#architecture">`{=html}Architecture`</a>`{=html} ·
`<a href="#ai-agent-system">`{=html}AI agents`</a>`{=html} ·
`<a href="#getting-started">`{=html}Getting started`</a>`{=html} ·
`<a href="#security-and-financial-controls">`{=html}Security`</a>`{=html}
:::The problem
For an exporter, receiving a payment is only one part of getting paid.
Finance teams must still determine which invoice the payment belongs to,
verify amounts and currencies, investigate short or excess payments,
follow up on overdue invoices, and assemble documents when a payment is
disputed.

These tasks are often spread across spreadsheets, payment portals,
invoices, purchase orders, and email conversations. The result is
fragmented visibility, repetitive manual investigation, and delayed
collection decisions.
The solution
RECLAIM AI turns receivables management into an intelligent, traceable
workflow.

It brings invoice and payment information into a centralized workspace,
uses deterministic reconciliation logic to protect financial accuracy,
and uses specialized AI agents to investigate exceptions and recommend
next steps. Sensitive financial actions remain controlled by backend
validation and human approval policies.
::: {align="center"}
### OBSERVE → INVESTIGATE → RECOMMEND → APPROVE → ACT
:::Key capabilities
  Capability                          What it delivers
  Payment intelligence            Centralized visibility into
imported international transactions
and their status

  Intelligent reconciliation      Multi-signal invoice/payment
matching with exception handling

  Receivables investigation       Evidence-backed investigation of
unmatched and ambiguous payments

  Collection prioritization       Due-date, balance, and
payment-history-based collection
recommendations

  Dispute preparation             Relevant document collection,
chronology, and missing-evidence
identification

  Financial dashboards            Outstanding, overdue, collections,
ageing, customer performance, and
expected receipts

  Human approvals                 Review and approval gates for
sensitive or uncertain actions

  Role-based access               Business-owner, administrator, and
manager experiences

  PayPal integration              Backend integration for retrieving
and synchronizing permitted PayPal
transaction data
Auditability                    Traceable agent executions,
recommendations, approvals, and
business activity
Product modules
1. Overview dashboard
A role-aware financial overview that helps teams understand the current
receivables position.
- Total outstanding and overdue receivables
- Collections over selected historical periods
- Expected receipts based on invoice due dates and outstanding
  balances
- Receivables ageing buckets
- Customer payment performance
- Unmatched payments, open investigations, disputes, and pending
  approvals
Expected receipts are estimates derived from invoice information; they
are not guaranteed future cash.

2. Receivables workspace
A consolidated workspace for the core financial records.
- Invoices: invoice details, due dates, amounts, balances, and
  status
- Payments: imported transactions, currency, payer information,
  and payment status
- Reconciliation: candidate matches, exceptions, confirmed
  allocations, and review states
- Disputes: case details, supporting evidence, chronology, and
  review status
3. AI Operations
A central place to review the work performed by specialized agents.
- Agent execution history and status
- Investigations and findings
- Structured recommendations
- Tool-call and record-access summaries
- Approval queue and decision history
- Human-readable explanations and uncertainty indicators
The interface presents useful evidence and execution summaries---not
hidden model chain-of-thought.
4. Activity and audit trail
A unified timeline of important business and system events, including
payment synchronization, reconciliation decisions, user actions, agent
runs, and approvals.
5. Settings and administration
Business profile, PayPal connection settings, user management, role
assignments, notification preferences, and agent policies.
AI agent system
RECLAIM AI uses specialized agents coordinated through LangGraph.js.
Each agent has a bounded responsibility, controlled access to backend
tools, structured outputs, and execution records.
Receivables Intelligence Agent
Goal: Investigate unmatched payments and reconciliation exceptions.
1. Receives an unmatched or ambiguous payment case.
2. Retrieves relevant payment, invoice, customer, and remittance
   records.
3. Evaluates available matching evidence and discrepancies.
4. Produces candidate explanations and a structured recommendation.
5. Routes uncertain cases for human review.
Collection Strategy Agent
Goal: Help teams prioritize and manage overdue receivables.
1. Reviews invoice due dates and outstanding balances.
2. Considers customer payment history and previous communications.
3. Prioritizes accounts requiring attention.
4. Recommends a suitable follow-up action and rationale.
5. Routes actions through configured approval and communication
   controls.
Dispute Evidence Agent
Goal: Reduce the effort required to prepare payment-dispute cases.
1. Retrieves relevant invoices, purchase orders, delivery records, and
   communications.
2. Organizes available evidence into a chronology.
3. Identifies missing or inconsistent supporting information.
4. Drafts a structured dispute summary for review.
5. Leaves final submission and other sensitive actions to an authorized
   user.
Agent design principles
- Agents use backend tools rather than directly modifying database
  records.
- Tool access is scoped to the authenticated business and permitted
  role.
- Outputs use structured schemas and are validated by the backend.
- Agent runs, tool activity, recommendations, and approvals are
  recorded.
- Uncertain or high-impact actions require human review.
- LLMs are used for investigation and recommendations---not as the
  source of truth for financial arithmetic.
Payment reconciliation
Payment reconciliation is designed for real-world exceptions rather than
only exact one-to-one matches.
Matching signals
- Invoice reference and transaction identifiers
- Customer identity and payer information
- Payment amount and invoice outstanding balance
- Currency
- Transaction date and invoice date
- Remittance information, when available
- Transaction status
Scenarios handled
  Scenario                            System behavior
  Exact payment                       Identifies a strong candidate for
confirmation

  Partial payment                     Preserves the remaining invoice
balance

  Multiple payments for one invoice   Evaluates cumulative confirmed
allocations

  One payment across multiple         Supports reviewed split allocations
invoices                            

  Overpayment                         Flags the excess amount for review

  Unidentified payment                Creates an investigation instead of
guessing

  Duplicate transaction/event         Uses idempotent processing to avoid
duplicate imports

  Pending or failed payment           Does not treat it as collected
funds

  Currency mismatch                   Flags the discrepancy; does not
silently convert currencies
Ambiguous match                     Presents candidates and requires
review
Financial integrity rules
1. Confirmed allocations only: payment-allocation records represent
   validated allocations.
2. No payer-name-only matching: a customer name alone is not enough
   when multiple invoices are open.
3. No premature paid status: pending, failed, or ambiguous payments
   do not mark an invoice as paid.
4. Currency separation: amounts in different currencies are not
   combined without an explicit, traceable FX conversion.
5. Decimal arithmetic: monetary values use database decimal types
   rather than floating-point arithmetic.
6. Deterministic balances: invoice balances and allocation totals
   are calculated and validated by backend services.
Architecture
```mermaid
flowchart TB
    U[Business Owner / Admin / Manager] --> FE[React + TypeScript Frontend]
    FE --> API[Node.js + Express API]
    API --> AUTH[Authentication & RBAC]
    API --> SERVICES[Business Services]
    SERVICES --> DB[(PostgreSQL)]
    SERVICES --> PAYPAL[PayPal REST APIs]
    SERVICES --> RECON[Reconciliation Engine]
    SERVICES --> GRAPH[LangGraph.js Agent Orchestration]
    GRAPH --> R[Receivables Intelligence Agent]
    GRAPH --> C[Collection Strategy Agent]
    GRAPH --> D[Dispute Evidence Agent]
    R --> TOOLS[Controlled Backend Tools]
    C --> TOOLS
    D --> TOOLS
    TOOLS --> DB
    GRAPH --> LOGS[Agent Runs & Recommendations]
    LOGS --> DB
    SERVICES --> AUDIT[Activity & Audit Logs]
    AUDIT --> DB
```
Architectural layers
  Layer                               Responsibility
  Frontend                        Role-aware dashboards, receivables
workflows, agent activity,
approvals

  API layer                       Request validation, authentication,
authorization, and response
handling

  Business services               Financial calculations,
reconciliation, payment sync, and
workflow rules

  AI orchestration                LangGraph workflows, agent routing,
controlled tool execution

  Persistence                     PostgreSQL relational records and
Prisma data access

  External integration            PayPal transaction access and
synchronization
Governance                      Approval records, execution logs,
and audit trail
Design principles
- Modular service-oriented backend structure
- Clear separation between controllers, services, and persistence
- Tenant-scoped data access
- Idempotent external transaction synchronization
- Explicit approval boundaries for sensitive actions
- Extensible integration and agent-tool interfaces
Technology stack
  Area                  Technology
  Frontend              React, TypeScript, Vite
Backend               Node.js, Express.js, TypeScript
Database              PostgreSQL
ORM and migrations    Prisma
Agent orchestration   LangGraph.js
AI reasoning          Configurable LLM integration
Payment integration   PayPal REST APIs
Authentication        JWT and secure session handling
API style             REST
Development           Git, npm, environment-based configuration
Role-based access control
RECLAIM AI applies authorization on the backend---not only by hiding
frontend navigation items.
  Role                                Access scope
  OWNER                           Full business visibility, financial
dashboards, user and manager
administration, integration
settings, and approval policies

  ADMIN                           Operational records,
reconciliation, disputes, and
permitted operational actions;
restricted from owner-only controls

  MANAGER                         Assigned customers, invoices,
payments, collection tasks, and
relevant agent recommendations
MEMBER                          Restricted access based on
configured permissions
Every business-data query is scoped to the authenticated user's business
membership. Manager access is further constrained by assigned records
and permissions.
PayPal integration
The PayPal integration brings permitted transaction information into
RECLAIM AI's receivables workflow.
Integration workflow
1. An authorized business user initiates the PayPal connection flow.
2. The backend handles credentials and token operations.
3. The integration retrieves transaction data permitted by the
   connected PayPal account and API access.
4. The synchronization service maps external transactions to the
   internal payment model.
5. Idempotent upsert logic prevents duplicate transaction imports.
6. Imported payments become available for reconciliation and
   investigation.
Important integration boundary
PayPal application credentials do not automatically grant access to
arbitrary third-party merchant accounts. Access to another merchant's
data requires the appropriate supported merchant-consent or partner
onboarding arrangement and permissions. The integration must operate
only within the access actually granted.
Data model
The relational data model is organized around business ownership and
traceable financial operations.
  Domain                              Main entities
  Organization and access             Business, User, BusinessMembership,
RefreshSession

  Integrations                        BusinessIntegration

  Customer records                    Customer

  Receivables                         Invoice, PurchaseOrder

  Payments                            Payment, PaymentAllocation

  Reconciliation                      MatchingCase, MatchingCandidate

  Evidence and disputes               SupportingDocument, Communication,
Dispute

  External events                     WebhookEvent, WebhookDelivery

  Operational workflows               ActionQueue

  AI governance                       AgentExecution, AgentToolCall,
AgentRecommendation, ApprovalRecord
Auditability                        ActivityLog
The schema is designed to preserve business-level ownership,
transaction traceability, and the distinction between imported
payments, proposed matches, and confirmed allocations.

Security and financial controls
RECLAIM AI handles sensitive financial and business information.
Security and correctness are core system requirements.
- Passwords are stored as secure password hashes.
- Authentication and authorization are enforced by protected backend
  routes.
- Business-level tenant isolation is applied to data access.
- Role and record-assignment permissions are validated server-side.
- API credentials and secrets are kept out of frontend bundles and
  source control.
- Sensitive integration tokens are protected using appropriate
  encryption and key management.
- Payment synchronization is idempotent.
- Financial amounts use decimal precision.
- Agent recommendations are distinguishable from completed financial
  actions.
- Sensitive actions are subject to approval policies.
- Important user, agent, and financial workflow events are auditable.
Getting started
Prerequisites
- Node.js (use the version specified by the project, if configured)
- npm
- PostgreSQL
- Git
- PayPal Developer account and sandbox application credentials for
  sandbox integration testing
- An API key for the configured LLM provider, if agent features are
  enabled
1. Clone the repository
git clone <YOUR_REPOSITORY_URL>
cd <YOUR_PROJECT_DIRECTORY>
2. Configure the backend
cd backend
npm install
Create a .env file in the backend directory. Use the actual variable
names defined by your backend configuration.
NODE_ENV=development
PORT=5000

DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require

JWT_SECRET=replace_with_a_strong_random_secret
# Add refresh/session secrets if required by your implementation.

PAYPAL_ENVIRONMENT=sandbox
PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_paypal_sandbox_client_secret
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com

LLM_API_KEY=your_llm_provider_api_key
Never commit .env files or expose database, PayPal, JWT, or LLM
credentials in frontend code. Use the environment-variable names
expected by the actual application configuration.
3. Set up the database
npx prisma generate
npx prisma migrate deploy
For a local development workflow where migrations are being created, use
the migration command configured by the project.

If the repository provides a seed script, run it using the project's
configured seed command. Use synthetic/demo data for local testing.
4. Start the backend
npm run dev
5. Start the frontend
Open another terminal:
cd frontend
npm install
npm run dev
Open the local URL printed by Vite in your terminal.
Script names and environment-variable names can differ between project
configurations. Check the package.json files and backend
configuration before running commands. Do not use production
credentials in local development.

Configuration checklist
Before enabling integrations in a deployment, verify:
- [ ] PostgreSQL is reachable and migrations are applied.
- [ ] Strong authentication secrets are configured.
- [ ] CORS and allowed frontend origins are restricted.
- [ ] PayPal environment and API credentials are correct.
- [ ] PayPal permissions match the intended account-access model.
- [ ] LLM provider credentials and model settings are configured.
- [ ] Token encryption keys are stored outside the database and source
  repository.
- [ ] Production seed accounts and demo credentials are disabled.
- [ ] Logging does not expose secrets or sensitive payment data.
- [ ] Backups, monitoring, and error reporting are configured.
Testing and validation
The project should be validated across financial correctness, security,
integrations, and agent behavior.
  Area                                Important validation cases
  Authentication                      Login, logout, session expiry,
refresh, password change

  Authorization                       Owner/admin/manager/member
permissions

  Tenant isolation                    Cross-business record access is
denied

  Reconciliation                      Exact, partial, split, overpayment,
unmatched, and ambiguous cases

  Financial calculations              Decimal precision, outstanding
balance, currency separation

  Payment sync                        Idempotency, duplicate imports,
status mapping, API failures

  AI agents                           Tool permissions, structured
output, missing data, uncertain
recommendations

  Approvals                           Unauthorized actions blocked;
decisions recorded

  Disputes                            Evidence links, chronology,
missing-document handling
Audit                               User actions and agent executions
are traceable
Repository structure
The project follows a frontend/backend separation. A typical layout is:
reclaim-ai/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   └── package.json
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── agents/
│   │   ├── integrations/
│   │   ├── utils/
│   │   ├── types/
│   │   ├── app.ts
│   │   └── server.ts
│   └── package.json
│
├── design.md
├── README.md
└── .gitignore
The exact directory names may vary as the implementation evolves; the
key architectural boundary is that financial and integration logic
belongs in backend services.
Product design
The interface uses a dark, technical SaaS visual language with a
restrained violet accent.
- Near-black application background
- Layered dark surfaces and subtle borders
- Violet highlights for primary actions
- Clear semantic colors for success, warning, and errors
- Compact, readable financial tables
- Responsive layouts and accessible contrast
- Consistent typography and spacing
The design prioritizes operational clarity: users should be able to
identify overdue receivables, unresolved payment exceptions, and pending
approvals quickly.
Roadmap
- [x] Project foundation and modular frontend/backend setup
- [x] PostgreSQL data model and persistence layer
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
Impact
RECLAIM AI is designed to help MSME exporters:
- Spend less time manually investigating payment records.
- Identify overdue and unresolved receivables earlier.
- Make collection priorities more visible.
- Prepare dispute evidence more efficiently.
- Improve cash-flow visibility through consolidated financial
  information.
- Keep sensitive financial decisions under business control.
The platform's value is not simply that it uses AI. Its value comes from
combining specialized AI assistance with deterministic financial
controls, secure access, and auditable workflows.
The principle behind RECLAIM AI
::: {align="center"}
### Don't just track receivables.

### Understand them. Resolve them. Reclaim your cash flow.

**Built for the businesses that keep global trade moving.**
:::Contributing
Contributions, suggestions, and technical feedback are welcome.
1. Fork the repository.
2. Create a feature branch.
3. Keep business logic in backend services.
4. Add or update tests for financial and authorization behavior.
5. Submit a pull request with a clear description of the change.
Never include real customer records, payment information, access tokens,
or credentials in issues, commits, screenshots, or test fixtures.
License
Add the license selected for this repository (for example, MIT) and
include the corresponding LICENSE file before describing the project
as open source.
::: {align="center"}
**RECLAIM AI --- Smart Receivables for MSME Exporters**

*From payment uncertainty to financial clarity.*
:::
