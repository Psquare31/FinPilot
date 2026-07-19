/**
 * Seeds a single, clean, realistic demo workspace for the live UI demo.
 *
 * Run with the API server up (DEMO_AUTH=true):
 *   node scripts/seed-demo.mjs
 *
 * It removes any previously-created workspaces for the demo user, then builds
 * one "My Finances" workspace with accounts, categories, a few months of
 * transactions, budgets, goals and investments so the dashboard looks alive.
 */

const BASE = process.env.API_BASE || "http://localhost:5000/api/v1";

const call = async (method, path, body) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${method} ${path} -> ${res.status}: ${json.message || "error"}`);
  }
  return json.data;
};

const idOf = (x) => x?.id || x?._id;
const money = (amount) => ({ amount, currency: "INR" });
const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString();
const monthsAgoFirst = (m) => {
  const d = new Date();
  d.setMonth(d.getMonth() - m, 5);
  return d.toISOString();
};

const run = async () => {
  const me = await call("GET", "/auth/me");
  const userId = idOf(me.user);
  const audit = { createdBy: userId };
  console.log("Demo user:", userId);

  // 1. Wipe existing workspaces
  const existing = await call("GET", "/workspaces");
  for (const ws of existing) {
    await call("DELETE", `/workspaces/${idOf(ws)}`).catch(() => {});
  }
  console.log(`Removed ${existing.length} old workspace(s).`);

  // 2. Fresh workspace
  const ws = await call("POST", "/workspaces", { name: "My Finances", currency: "INR" });
  const workspace = idOf(ws);
  console.log("Workspace:", workspace);

  // 3. Categories
  const catDefs = [
    ["Salary", "income", "#22c55e"],
    ["Freelance", "income", "#10b981"],
    ["Food & Dining", "expense", "#f97316"],
    ["Rent & Housing", "expense", "#6366f1"],
    ["Transport", "expense", "#38bdf8"],
    ["Shopping", "expense", "#ec4899"],
    ["Entertainment", "expense", "#a855f7"],
    ["Utilities & Bills", "expense", "#f59e0b"],
    ["Health", "expense", "#f43f5e"],
  ];
  const cat = {};
  for (const [name, type, color] of catDefs) {
    const c = await call("POST", "/categories", { workspace, name, type, color, icon: "circle" });
    cat[name] = idOf(c);
  }
  console.log("Categories:", Object.keys(cat).length);

  // 4. Accounts
  const hdfc = idOf(
    await call("POST", "/accounts", {
      workspace, name: "HDFC Savings", type: "savings", currency: "INR", openingBalance: 145000,
    })
  );
  const wallet = idOf(
    await call("POST", "/accounts", {
      workspace, name: "Cash Wallet", type: "cash", currency: "INR", openingBalance: 9000,
    })
  );

  // 5. Transactions — incomes first (so balances cover expenses)
  const tx = async (account, category, type, amount, description, date, method = "upi") =>
    call("POST", "/transactions", {
      workspace, account, category, type, amount, money: money(amount),
      description, paymentMethod: method, transactionDate: date, audit,
    });

  // Incomes over the last 3 months
  await tx(hdfc, cat["Salary"], "income", 85000, "Monthly salary", monthsAgoFirst(2), "bank_transfer");
  await tx(hdfc, cat["Salary"], "income", 85000, "Monthly salary", monthsAgoFirst(1), "bank_transfer");
  await tx(hdfc, cat["Salary"], "income", 85000, "Monthly salary", monthsAgoFirst(0), "bank_transfer");
  await tx(hdfc, cat["Freelance"], "income", 22000, "Logo design project", daysAgo(20), "upi");

  // Expenses spread across categories & months
  const expenses = [
    [hdfc, "Rent & Housing", 28000, "Apartment rent", monthsAgoFirst(2), "bank_transfer"],
    [hdfc, "Rent & Housing", 28000, "Apartment rent", monthsAgoFirst(1), "bank_transfer"],
    [hdfc, "Rent & Housing", 28000, "Apartment rent", monthsAgoFirst(0), "bank_transfer"],
    [wallet, "Food & Dining", 1450, "Groceries", daysAgo(2), "upi"],
    [wallet, "Food & Dining", 780, "Dinner with friends", daysAgo(5), "upi"],
    [hdfc, "Food & Dining", 2300, "Weekly groceries", daysAgo(12), "credit_card"],
    [hdfc, "Transport", 1200, "Fuel", daysAgo(6), "credit_card"],
    [hdfc, "Transport", 640, "Cab rides", daysAgo(15), "upi"],
    [hdfc, "Shopping", 5400, "New headphones", daysAgo(9), "credit_card"],
    [hdfc, "Shopping", 3200, "Winter clothes", daysAgo(28), "credit_card"],
    [hdfc, "Entertainment", 1600, "Movie & streaming", daysAgo(4), "upi"],
    [hdfc, "Utilities & Bills", 2100, "Electricity + internet", daysAgo(8), "bank_transfer"],
    [hdfc, "Health", 1800, "Pharmacy + checkup", daysAgo(18), "upi"],
  ];
  for (const [acc, c, amt, desc, date, m] of expenses) {
    await tx(acc, cat[c], "expense", amt, desc, date, m);
  }
  console.log("Transactions seeded.");

  // 6. Budgets (current month)
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
  const budget = (category, name, amount) =>
    call("POST", "/budgets", {
      workspace, category, name, period: "monthly",
      budgetAmount: money(amount), startDate: start, endDate: end, alertThreshold: 80, audit,
    });
  await budget(cat["Food & Dining"], "Food & Dining", 8000);
  await budget(cat["Shopping"], "Shopping", 6000);
  await budget(cat["Transport"], "Transport", 3000);
  console.log("Budgets seeded.");

  // 7. Goals
  const goal = (name, type, target, current, months) =>
    call("POST", "/goals", {
      workspace, name, type,
      targetAmount: money(target), currentAmount: money(current),
      targetDate: new Date(now.getFullYear(), now.getMonth() + months, 15).toISOString(),
      priority: 3, audit,
    });
  await goal("Emergency Fund", "emergency", 300000, 175000, 8);
  await goal("Goa Trip", "vacation", 60000, 24000, 4);
  await goal("New Laptop", "purchase", 120000, 40000, 6);
  console.log("Goals seeded.");

  // 8. Investments
  const invest = (name, symbol, type, qty, buy, now_, risk) =>
    call("POST", "/investments", {
      workspace, name, symbol, type, quantity: qty,
      purchasePrice: money(buy), currentPrice: money(now_),
      purchaseDate: daysAgo(120), riskLevel: risk, audit,
    });
  await invest("Reliance Industries", "RELIANCE", "stock", 15, 2400, 2915, "medium");
  await invest("Nifty 50 Index Fund", "NIFTYBEES", "mutual_fund", 120, 210, 242, "low");
  await invest("Bitcoin", "BTC", "crypto", 0.05, 5200000, 4850000, "high");
  await invest("Gold ETF", "GOLDBEES", "gold", 40, 62, 71, "low");
  console.log("Investments seeded.");

  console.log("\n✅ Demo workspace ready. Reload the client.");
};

run().catch((e) => {
  console.error("SEED FAILED:", e.message);
  process.exit(1);
});
