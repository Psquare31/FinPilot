// Exercises the rewritten investment service against real documents:
// weighted-average cost basis, the oversell guard, and the dashboard value
// that previously evaluated to NaN.

import connectBenchDB, { disconnectBenchDB } from "./lib/db.js";

import User from "../src/models/User.js";
import Workspace from "../src/models/Workspace.js";
import Account from "../src/models/Account.js";
import Investment from "../src/models/Investment.js";
import InvestmentTransaction from "../src/models/InvestmentTransaction.js";

import investmentService from "../src/services/investment.service.js";
import dashboardService from "../src/services/dashboard.service.js";

await connectBenchDB();

const user = await User.findOne().lean();
const workspace = await Workspace.findOne().lean();
const account = await Account.findOne({ workspace: workspace._id }).lean();

await Investment.deleteMany({ workspace: workspace._id });
await InvestmentTransaction.deleteMany({ workspace: workspace._id });

const results = [];

const check = (name, actual, expected) => {
  const pass = actual === expected;
  results.push(pass);
  console.log(
    `${pass ? "PASS" : "FAIL"}  ${name.padEnd(48)} ${actual}${pass ? "" : `  (expected ${expected})`}`
  );
};

const investment = await Investment.create({
  workspace: workspace._id,
  account: account._id,
  name: "Test Equity",
  symbol: "TEST",
  type: "stock",
  quantity: 10,
  purchasePrice: { amount: 100, currency: "INR" },
  currentPrice: { amount: 120, currency: "INR" },
  purchaseDate: new Date("2026-01-01"),
  audit: { createdBy: user._id },
});

// Buy 10 @ 200 -> quantity 20, weighted avg = (10*100 + 10*200)/20 = 150
const afterBuy = await investmentService.buyInvestment(
  investment._id,
  { quantity: 10, price: 200 },
  user._id
);

check("buy: quantity", afterBuy.quantity, 20);
check("buy: weighted-average cost basis", afterBuy.purchasePrice.amount, 150);

// Oversell must be rejected. Before the fix this compared `undefined < 100`
// (always false) and silently drove quantity negative.
let blocked = false;
try {
  await investmentService.sellInvestment(
    investment._id,
    { quantity: 100, price: 250 },
    user._id
  );
} catch (error) {
  blocked = /Insufficient units/.test(error.message);
}

check("sell: oversell blocked", blocked, true);

// Sell 5 @ 250 -> quantity 15, average unchanged at 150
const afterSell = await investmentService.sellInvestment(
  investment._id,
  { quantity: 5, price: 250 },
  user._id
);

check("sell: quantity", afterSell.quantity, 15);
check("sell: cost basis unchanged", afterSell.purchasePrice.amount, 150);

// Ledger rows must have been written with the schema's real field names.
const ledger = await InvestmentTransaction.find({
  investment: investment._id,
}).lean();

check("ledger: rows written", ledger.length, 2);
check("ledger: buy quantity", ledger.find((r) => r.type === "buy")?.quantity, 10);
check("ledger: buy price.amount", ledger.find((r) => r.type === "buy")?.price?.amount, 200);

// Summary: invested 15*150 = 2250, current 15*120 = 1800, P/L = -450
const summary = await investmentService.getInvestmentSummary(workspace._id);

check("summary: totalInvested", summary.totalInvested, 2250);
check("summary: currentValue", summary.currentValue, 1800);
check("summary: profitLoss", summary.profitLoss, -450);

// Dashboard previously reported NaN here.
const dash = await dashboardService.getInvestmentSummary(workspace._id);

check("dashboard: totalCurrentValue is a number", Number.isNaN(dash.totalCurrentValue), false);
check("dashboard: totalCurrentValue", dash.totalCurrentValue, 1800);

// Activity summary (the last $sum:"$amount" site).
// buy 10 @ 200 = 2000; sell 5 @ 250 = 1250
const { default: itService } = await import(
  "../src/services/investmentTransaction.service.js"
);

const activity = await itService.getActivitySummary(workspace._id.toString());

const buy = activity.find((a) => a._id === "buy");
const sell = activity.find((a) => a._id === "sell");

check("activity summary: buy total (quantity x price)", buy?.totalAmount, 2000);
check("activity summary: sell total (quantity x price)", sell?.totalAmount, 1250);

console.log(`\n${results.every(Boolean) ? "ALL CHECKS PASS" : "SOME CHECKS FAILED"}`);

if (!results.every(Boolean)) process.exitCode = 1;

await disconnectBenchDB();
