// ======================================================
// Benchmark dataset generator.
//
// Produces a deterministic, schema-conformant FinPilot dataset at arbitrary
// scale. Documents are built to match the real Mongoose schemas exactly, so
// benchmarks measure the same shapes the application actually stores.
//
// Determinism rules:
//   - all randomness derives from a single seeded PRNG
//   - _ids are derived from that PRNG, not from ObjectId()'s clock
//   - dates derive from REFERENCE_DATE, never Date.now()
//
// Given the same seed and scale, two runs produce identical data.
// ======================================================

import {
  createRng,
  intBetween,
  pick,
  weightedPick,
  objectIdHex,
  skewedAmount,
} from "./rng.js";

// Anchoring to a fixed instant keeps the dataset stable across days.
// Date.now() here would silently invalidate every previously reported number.
export const REFERENCE_DATE = new Date("2026-07-01T00:00:00.000Z");

export const HISTORY_MONTHS = 24;

// ======================================================
// Distributions
//
// Weights approximate a realistic household spend profile. A uniform
// distribution would flatten index selectivity and make $group look cheaper
// and more predictable than it is in production.
// ======================================================

export const INCOME_CATEGORIES = [
  { name: "Salary", weight: 70 },
  { name: "Freelancing", weight: 15 },
  { name: "Investments", weight: 10 },
  { name: "Interest", weight: 5 },
];

export const EXPENSE_CATEGORIES = [
  { name: "Food", weight: 24 },
  { name: "Transport", weight: 14 },
  { name: "Housing", weight: 12 },
  { name: "Utilities", weight: 10 },
  { name: "Shopping", weight: 10 },
  { name: "Entertainment", weight: 8 },
  { name: "Health", weight: 7 },
  { name: "Education", weight: 6 },
  { name: "Travel", weight: 5 },
  { name: "Miscellaneous", weight: 4 },
];

const PAYMENT_METHOD_WEIGHTS = [
  { value: "upi", weight: 40 },
  { value: "credit_card", weight: 20 },
  { value: "debit_card", weight: 14 },
  { value: "cash", weight: 12 },
  { value: "bank_transfer", weight: 10 },
  { value: "wallet", weight: 4 },
];

// Bounded merchant cardinality gives `merchant.name` a realistic selectivity
// for the index experiment.
const MERCHANT_POOL_SIZE = 250;

const ACCOUNT_TEMPLATES = [
  { name: "Cash", type: "cash", color: "green", icon: "wallet" },
  { name: "Savings Account", type: "savings", color: "blue", icon: "landmark" },
  { name: "Current Account", type: "current", color: "purple", icon: "building-2" },
  { name: "Credit Card", type: "credit_card", color: "red", icon: "credit-card" },
  { name: "UPI Wallet", type: "upi", color: "orange", icon: "wallet" },
  { name: "Business Account", type: "business", color: "gray", icon: "banknote" },
];

// Share of transactions that are income rather than expense.
const INCOME_RATIO = 0.18;

// Share of transactions left in a non-completed state.
const PENDING_RATIO = 0.04;

// Share soft-deleted, so `isDeleted: false` filters do real work.
const SOFT_DELETED_RATIO = 0.02;

const slugify = (value, suffix) =>
  `${value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${suffix}`;

// ======================================================
// Base entities
// ======================================================

export const buildBaseEntities = ({
  seed,
  workspaceCount,
  accountsPerWorkspace,
}) => {
  const rng = createRng(seed);

  const userId = objectIdHex(rng);

  // bcrypt hash of "benchmark-password" (cost 10). Precomputed because
  // insertMany bypasses the User pre('save') hook that would normally hash it.
  const user = {
    _id: userId,
    firstName: "Bench",
    lastName: "Operator",
    email: "bench.operator@finpilot.local",
    password: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
    emailVerified: true,
  };

  const workspaces = [];
  const categories = [];
  const accounts = [];
  const merchants = [];

  for (let i = 0; i < MERCHANT_POOL_SIZE; i++) {
    merchants.push(`Merchant ${String(i).padStart(4, "0")}`);
  }

  for (let w = 0; w < workspaceCount; w++) {
    const workspaceId = objectIdHex(rng);

    workspaces.push({
      _id: workspaceId,
      name: `Bench Workspace ${w + 1}`,
      slug: slugify(`bench-workspace-${w + 1}`, workspaceId.slice(-6)),
      type: w === 0 ? "personal" : "family",
      owner: userId,
      currency: "INR",
      status: "active",
    });

    for (const category of INCOME_CATEGORIES) {
      categories.push({
        _id: objectIdHex(rng),
        workspace: workspaceId,
        name: category.name,
        type: "income",
        isDefault: true,
        weight: category.weight,
      });
    }

    for (const category of EXPENSE_CATEGORIES) {
      categories.push({
        _id: objectIdHex(rng),
        workspace: workspaceId,
        name: category.name,
        type: "expense",
        isDefault: true,
        weight: category.weight,
      });
    }

    for (let a = 0; a < accountsPerWorkspace; a++) {
      const template = ACCOUNT_TEMPLATES[a % ACCOUNT_TEMPLATES.length];

      const accountId = objectIdHex(rng);

      accounts.push({
        _id: accountId,
        workspace: workspaceId,
        name:
          a < ACCOUNT_TEMPLATES.length
            ? template.name
            : `${template.name} ${Math.floor(a / ACCOUNT_TEMPLATES.length) + 1}`,
        slug: slugify(template.name, accountId.slice(-6)),
        type: template.type,
        // Opening balances are generous so that later balance updates cannot
        // drive `balance` below the schema's `min: 0`.
        balance: 500000,
        openingBalance: 500000,
        currency: "INR",
        color: template.color,
        icon: template.icon,
        status: "active",
        audit: { createdBy: userId },
      });
    }
  }

  return { rng, user, workspaces, categories, accounts, merchants };
};

// ======================================================
// Transactions
//
// Yielded in batches so that 1M-document runs stay within a bounded heap.
// ======================================================

export function* generateTransactionBatches({
  rng,
  base,
  total,
  batchSize = 5000,
}) {
  const { user, workspaces, categories, accounts, merchants } = base;

  const accountsByWorkspace = new Map();

  for (const workspace of workspaces) {
    accountsByWorkspace.set(
      workspace._id,
      accounts.filter((account) => account.workspace === workspace._id)
    );
  }

  const incomeByWorkspace = new Map();
  const expenseByWorkspace = new Map();

  for (const workspace of workspaces) {
    incomeByWorkspace.set(
      workspace._id,
      categories
        .filter((c) => c.workspace === workspace._id && c.type === "income")
        .map((c) => ({ value: c, weight: c.weight }))
    );

    expenseByWorkspace.set(
      workspace._id,
      categories
        .filter((c) => c.workspace === workspace._id && c.type === "expense")
        .map((c) => ({ value: c, weight: c.weight }))
    );
  }

  const windowMs = HISTORY_MONTHS * 30 * 24 * 60 * 60 * 1000;

  const startMs = REFERENCE_DATE.getTime() - windowMs;

  let batch = [];

  for (let i = 0; i < total; i++) {
    // Round-robin across workspaces keeps per-workspace counts balanced and
    // predictable, which matters when comparing per-workspace query costs.
    const workspace = workspaces[i % workspaces.length];

    const workspaceAccounts = accountsByWorkspace.get(workspace._id);

    const account = pick(rng, workspaceAccounts);

    const isIncome = rng() < INCOME_RATIO;

    const category = weightedPick(
      rng,
      isIncome
        ? incomeByWorkspace.get(workspace._id)
        : expenseByWorkspace.get(workspace._id)
    );

    const amount = isIncome
      ? skewedAmount(rng, 15000, 250000)
      : skewedAmount(rng, 50, 40000);

    // Drawn independently: sharing one roll would correlate the two flags and
    // make "pending AND soft-deleted" impossible, distorting filter selectivity.
    const statusRoll = rng();

    const deletedRoll = rng();

    batch.push({
      _id: objectIdHex(rng),
      workspace: workspace._id,
      account: account._id,
      category: category._id,
      type: isIncome ? "income" : "expense",
      status: statusRoll < PENDING_RATIO ? "pending" : "completed",
      money: { amount, currency: "INR" },
      merchant: {
        name: pick(rng, merchants),
        type: "business",
      },
      paymentMethod: weightedPick(rng, PAYMENT_METHOD_WEIGHTS),
      description: `${category.name} transaction`,
      transactionDate: new Date(startMs + rng() * windowMs),
      isDeleted: deletedRoll < SOFT_DELETED_RATIO,
      audit: { createdBy: user._id },
    });

    if (batch.length >= batchSize) {
      yield batch;

      batch = [];
    }
  }

  if (batch.length) yield batch;
}
