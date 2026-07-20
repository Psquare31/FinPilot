# FinPilot — Live Demo Guide

A React frontend for the FinPilot API, built so you can drive a live demo in
front of an audience: create accounts, record income/expenses, set budgets,
track goals and investments — and watch dashboards update in real time. Every
action writes to the **real MongoDB-backed Express API**.

## Prerequisites

- **Node 18+**
- **MongoDB running locally** on `mongodb://localhost:27017` (standalone is fine)

## Run it (two terminals)

```bash
# 1. API  (http://localhost:5000)
npm run dev:server

# 2. Web app  (http://localhost:5173)
npm run dev:client
```

Then open **http://localhost:5173**.

## Load the demo dataset (optional but recommended)

With the server running, seed one clean workspace full of realistic data
(accounts, a few months of transactions, budgets, goals, investments):

```bash
npm run seed:demo
```

Reload the browser and the dashboard comes alive. If you skip this, the app
still works — it creates an empty workspace on first load and you build up the
data yourself during the demo.

## Authentication — two modes

The frontend adapts automatically. On start-up it calls the public
`GET /api/v1/config`, which reports whether the API is in demo mode, so the same
build works either way — no client rebuild needed when you flip the server.

### Demo mode (no login wall)

`server/.env`:

```ini
DEMO_AUTH=true
```

Every request is authenticated as a fixed local demo user. The audience can just
start clicking. Clerk is bypassed entirely and no Clerk keys are needed.

### Real Clerk sign-in

`server/.env`:

```ini
DEMO_AUTH=false
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

`client/.env` (see `client/.env.example`):

```ini
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

Restart both servers. You'll get a branded sign-in screen, and the app attaches
the Clerk session token as a `Bearer` header on every API call. On first sign-in
the user is synced into MongoDB and gets their own workspace, so each signed-in
account sees only its own data.

> Vite only reads `client/.env` at start-up — restart the dev server after
> editing it, or the key won't be picked up.

## Suggested demo flow

1. **Dashboard** — point out net worth, income/expense, savings rate, the
   spending donut and the cash-flow trend.
2. **Transactions** — click **Add transaction**, enter an amount, pick a
   category, save. Show the account balance and dashboard totals change.
3. **Budgets** — add a budget for a category; add an expense and watch the
   progress bar move and the status flip to *Nearing limit* / *Over budget*.
4. **Goals** — create a goal, then **Add** a contribution and watch the ring
   fill; the goal marks itself *Completed* when it reaches the target.
5. **Investments** — add a holding, then **Update price** to mark it to market
   and watch profit/loss and the return % change live.

## What talks to what

```
client (Vite/React, :5173)  ──/api proxy──▶  server (Express, :5000)  ──▶  MongoDB
```

The frontend lives in `client/src` using a feature-based layout
(`services/`, `store/`, `components/`, `features/…`).
