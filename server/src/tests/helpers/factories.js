// Factories producing schema-valid documents.
//
// Every field here is one the schema actually defines. Hand-written fixtures
// in this repo previously invented fields (`amount`, `totalUnits`, `units`)
// that no schema declares, which is exactly the class of defect these tests
// exist to catch — so factories build through the real models and let
// validation reject anything that drifts.

import User from "../../models/User.js";
import Workspace from "../../models/Workspace.js";
import Category from "../../models/Category.js";
import Account from "../../models/Account.js";
import Transaction from "../../models/Transaction.js";
import Budget from "../../models/Budget.js";
import Investment from "../../models/Investment.js";
import Debt from "../../models/Debt.js";

let counter = 0;

const uniqueSuffix = () => `${Date.now().toString(36)}-${counter++}`;

export const makeUser = (overrides = {}) =>
  User.create({
    firstName: "Test",
    lastName: "User",
    email: `test-${uniqueSuffix()}@finpilot.local`,
    password: "test-password-123",
    ...overrides,
  });

export const makeWorkspace = (user, overrides = {}) =>
  Workspace.create({
    name: "Test Workspace",
    slug: `test-workspace-${uniqueSuffix()}`,
    type: "personal",
    owner: user._id,
    ...overrides,
  });

export const makeCategory = (workspace, overrides = {}) =>
  Category.create({
    workspace: workspace._id,
    name: "Food",
    type: "expense",
    ...overrides,
  });

export const makeAccount = (workspace, user, overrides = {}) =>
  Account.create({
    workspace: workspace._id,
    name: "Savings Account",
    slug: `savings-${uniqueSuffix()}`,
    type: "savings",
    balance: 100000,
    openingBalance: 100000,
    audit: { createdBy: user._id },
    ...overrides,
  });

export const makeTransaction = (
  { workspace, account, category, user },
  overrides = {}
) =>
  Transaction.create({
    workspace: workspace._id,
    account: account._id,
    category: category._id,
    type: "expense",
    money: { amount: 1000, currency: "INR" },
    transactionDate: new Date("2026-03-01"),
    audit: { createdBy: user._id },
    ...overrides,
  });

export const makeBudget = ({ workspace, category, user }, overrides = {}) =>
  Budget.create({
    workspace: workspace._id,
    category: category._id,
    name: "Monthly Food Budget",
    period: "monthly",
    budgetAmount: { amount: 10000, currency: "INR" },
    startDate: new Date("2026-03-01"),
    endDate: new Date("2026-03-31"),
    audit: { createdBy: user._id },
    ...overrides,
  });

export const makeDebt = ({ workspace, account, user }, overrides = {}) =>
  Debt.create({
    workspace: workspace._id,
    account: account._id,
    name: "Car Loan",
    lender: "Test Bank",
    type: "loan",
    principalAmount: { amount: 100000, currency: "INR" },
    outstandingAmount: { amount: 100000, currency: "INR" },
    interestRate: 9.5,
    emiAmount: { amount: 5000, currency: "INR" },
    startDate: new Date("2026-01-01"),
    endDate: new Date("2028-01-01"),
    nextDueDate: new Date("2026-08-01"),
    audit: { createdBy: user._id },
    ...overrides,
  });

export const makeInvestment = ({ workspace, account, user }, overrides = {}) =>
  Investment.create({
    workspace: workspace._id,
    account: account._id,
    name: "Test Equity",
    symbol: `TST${counter++}`,
    type: "stock",
    quantity: 10,
    purchasePrice: { amount: 100, currency: "INR" },
    currentPrice: { amount: 120, currency: "INR" },
    purchaseDate: new Date("2026-01-01"),
    audit: { createdBy: user._id },
    ...overrides,
  });

// A complete, related fixture set for tests that need a populated workspace.
export const makeWorkspaceFixture = async () => {
  const user = await makeUser();
  const workspace = await makeWorkspace(user);
  const category = await makeCategory(workspace);
  const incomeCategory = await makeCategory(workspace, {
    name: "Salary",
    type: "income",
  });
  const account = await makeAccount(workspace, user);

  return { user, workspace, category, incomeCategory, account };
};
