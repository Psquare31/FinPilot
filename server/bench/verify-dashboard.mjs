// Empirical check of the real DashboardService.getTransactionSummary against
// independently computed ground truth. Imports the actual shipped service so
// the check cannot drift from the code it validates.

import connectBenchDB, { disconnectBenchDB } from "./lib/db.js";
import Workspace from "../src/models/Workspace.js";
import Transaction from "../src/models/Transaction.js";
import dashboardService from "../src/services/dashboard.service.js";

await connectBenchDB();

const workspace = await Workspace.findOne().lean();

const workspaceId = workspace._id;

// ---- Ground truth, computed independently of the service ----
const truth = await Transaction.aggregate([
  { $match: { workspace: workspaceId, isDeleted: false } },
  { $group: { _id: "$type", total: { $sum: "$money.amount" } } },
]);

const truthIncome = truth.find((t) => t._id === "income")?.total ?? 0;
const truthExpense = truth.find((t) => t._id === "expense")?.total ?? 0;

// ---- The real service, called exactly as the controller calls it:
// ---- with a STRING id straight off req.query ----
const actual = await dashboardService.getTransactionSummary(
  workspaceId.toString()
);

console.log("ground truth : income", truthIncome, "expense", truthExpense);
console.log("service      : income", actual.income, "expense", actual.expense);
console.log("cashFlow     :", actual.cashFlow, "(expected", truthIncome - truthExpense, ")");

const ok =
  actual.income === truthIncome &&
  actual.expense === truthExpense &&
  actual.cashFlow === truthIncome - truthExpense;

console.log("\n" + (ok ? "PASS — service matches ground truth" : "FAIL — service disagrees"));

if (!ok) process.exitCode = 1;

await disconnectBenchDB();
