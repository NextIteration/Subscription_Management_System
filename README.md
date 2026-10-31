# Brightloop Subscription & Billing Management System

A unified SaaS subscription management, recurring billing, customer portal, and financial reporting platform built with React, Vite, Express, TypeScript, and Prisma.

---

## Architecture Overview

- **Frontend (`/src`)**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Recharts.
- **Backend (`/server`)**: Node.js, Express, TypeScript, Prisma ORM, Argon2, Cookie-based sessions.
- **Portals & Workspaces**:
  - **Admin & Staff Workspace**: Dashboard, Customer Management, Products & Variants, Pricing Plans, Quotations, Subscriptions, Taxes & Discounts, Invoices, Payments, and Financial Reports.
  - **Customer Portal**: My Subscriptions, Active Services, Next Renewal, Self-service Invoices & Receipts.

---

## Prerequisites

- **Node.js**: `v18+` or `v20+` (Node 20+ recommended)
- **npm**: `v9+`
- **PostgreSQL** *(optional for development; Member 1 runs out-of-the-box with in-memory store; Member 2 connects via Prisma)*

---

## Getting Started

### 1. Installation

Install dependencies for both root and backend:

```bash
# Install frontend & root dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

---

### 2. Environment Configuration

Create or verify `.env` in the root and `/server` directory:

```env
# Server Configuration (/server/.env)
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
SESSION_SECRET=brightloop-dev-secret-key-2026

# Database (PostgreSQL)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/brightloop?schema=public

# Optional Email / Cron
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
BILLING_CRON_SCHEDULE="0 0 * * *"
```

---

### 3. Generate Prisma Client

Generate the unified Prisma Client containing models for both Member 1 and Member 2:

```bash
# From server directory
cd server
npm run prisma:generate
cd ..
```

*(Optional: If connected to PostgreSQL, push migrations with `npx prisma db push --schema=server/prisma/schema.prisma`)*

---

## Running the Application

### Option A: Run Both Client and Server Concurrently (Recommended)

From the project root:

```bash
npm run dev:all
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

### Option B: Run in Separate Terminals

#### Terminal 1 — Backend API
```bash
# Option 1 (from root):
npm run server

# Option 2 (from server directory with auto-reload):
cd server
npm run dev
```
Backend runs at `http://localhost:5000`.

#### Terminal 2 — Frontend UI
```bash
# From project root:
npm run dev
```
Frontend runs at `http://localhost:5173` and automatically proxies `/api` requests to `http://localhost:5000`.

---

## Production Build & Type Checking

To verify TypeScript compilation and build production assets:

```bash
# Build frontend
npm run build

# Build backend
npm run server:build
```

---

## Default Access & Roles

The system uses role-based authentication with strict access boundaries:

| Role | Default Access | Description |
| :--- | :--- | :--- |
| **Admin** | Full Admin Workspace | Complete access to customers, products, plans, quotes, subscriptions, billing, tax rules, discounts, and reports. |
| **Staff** | Staff Workspace | Operational management of subscriptions, customers, quotations, and invoices. |
| **Customer** | Customer Portal | Scoped access to personal subscriptions, renewals, invoices, and payment receipts. |

You can register a new account on `/register` as **Customer**, **Staff**, or **Admin**, or use existing accounts.

---

## API Routes Summary

- **Auth**: `/api/auth` (login, register, logout, me)
- **Customers**: `/api/customers`
- **Products & Variants**: `/api/products`
- **Pricing Plans**: `/api/plans`
- **Quotations**: `/api/quotations`
- **Subscriptions**: `/api/subscriptions`
- **Taxes & Discounts**: `/api/tax-rules`, `/api/discount-rules`
- **Invoices & Payments**: `/api/invoices`, `/api/payments`
- **Recurring Billing**: `/api/billing/run`
- **Financial Reports**: `/api/reports/summary`, `/api/reports/aging`, `/api/reports/tax-summary`
- **Customer Portal**: `/api/portal/dashboard`, `/api/portal/subscriptions`, `/api/portal/invoices`

