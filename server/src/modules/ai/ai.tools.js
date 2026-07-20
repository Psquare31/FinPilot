import Account from "../../models/Account.js";
import Category from "../../models/Category.js";
import Transaction from "../../models/Transaction.js";
import Goal from "../../models/Goal.js";
import Investment from "../../models/Investment.js";

import transactionService from "../transactions/transaction.service.js";
import accountService from "../accounts/account.service.js";
import budgetService from "../budgets/budget.service.js";
import goalService from "../goals/goal.service.js";
import investmentService from "../investments/investment.service.js";

// ======================================================
// Tool declarations exposed to Gemini.
//
// Everything is addressed by human-readable name (category/account/goal), not
// ObjectId — the model never sees ids, and we resolve them here. That removes
// a whole class of hallucinated-identifier failures.
// ======================================================

const str = (description) => ({ type: "string", description });
const num = (description) => ({ type: "number", description });

export const toolDeclarations = [
  {
    functionDeclarations: [
      {
        name: "create_transaction",
        description:
          "Record an income or expense. Use for statements like 'I spent 500 on lunch' or 'got my salary'.",
        parameters: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["income", "expense"] },
            amount: num("Amount in the workspace currency, always positive."),
            category: str("Category name, e.g. 'Food & Dining'."),
            description: str("Short description of the transaction."),
            account: str("Account name. Omit to use the first account."),
            date: str("Date as YYYY-MM-DD. Omit for today."),
          },
          required: ["type", "amount", "category"],
        },
      },
      {
        name: "delete_transaction",
        description:
          "Delete a transaction. Find it with list_transactions first and confirm with the user before calling this.",
        parameters: {
          type: "object",
          properties: {
            transactionId: str("The id returned by list_transactions."),
            confirmed: {
              type: "boolean",
              description: "Must be true; set only after the user confirms.",
            },
          },
          required: ["transactionId", "confirmed"],
        },
      },
      {
        name: "list_transactions",
        description:
          "List recent transactions with their ids, so one can be deleted or referenced.",
        parameters: {
          type: "object",
          properties: {
            limit: num("How many to return (default 10, max 50)."),
            type: { type: "string", enum: ["income", "expense"] },
            category: str("Filter by category name."),
          },
        },
      },
      {
        name: "create_account",
        description: "Create a new account (bank, cash, card or wallet).",
        parameters: {
          type: "object",
          properties: {
            name: str("Account name."),
            type: {
              type: "string",
              enum: ["savings", "current", "cash", "credit_card", "upi", "wallet", "business"],
            },
            openingBalance: num("Starting balance. Defaults to 0."),
          },
          required: ["name", "type"],
        },
      },
      {
        name: "create_category",
        description:
          "Create a category, when the user references one that does not exist yet.",
        parameters: {
          type: "object",
          properties: {
            name: str("Category name."),
            type: { type: "string", enum: ["income", "expense"] },
          },
          required: ["name", "type"],
        },
      },
      {
        name: "create_budget",
        description: "Set a monthly spending budget for a category.",
        parameters: {
          type: "object",
          properties: {
            category: str("Category name to budget."),
            amount: num("Budget limit."),
            period: {
              type: "string",
              enum: ["weekly", "monthly", "quarterly", "yearly"],
            },
          },
          required: ["category", "amount"],
        },
      },
      {
        name: "create_goal",
        description: "Create a savings goal.",
        parameters: {
          type: "object",
          properties: {
            name: str("Goal name."),
            targetAmount: num("Amount to save."),
            targetDate: str("Target date as YYYY-MM-DD (must be in the future)."),
            currentAmount: num("Amount already saved. Defaults to 0."),
            type: {
              type: "string",
              enum: ["emergency", "vacation", "education", "purchase", "investment", "custom"],
            },
          },
          required: ["name", "targetAmount", "targetDate"],
        },
      },
      {
        name: "contribute_to_goal",
        description: "Add money to (or withdraw from) an existing savings goal.",
        parameters: {
          type: "object",
          properties: {
            goal: str("Goal name."),
            amount: num("Amount to move, always positive."),
            direction: { type: "string", enum: ["add", "withdraw"] },
          },
          required: ["goal", "amount"],
        },
      },
      {
        name: "create_investment",
        description: "Add a holding to the portfolio.",
        parameters: {
          type: "object",
          properties: {
            name: str("Holding name, e.g. 'Reliance Industries'."),
            type: {
              type: "string",
              enum: ["stock", "mutual_fund", "crypto", "gold", "fd", "ppf", "nps"],
            },
            quantity: num("Units held."),
            purchasePrice: num("Buy price per unit."),
            currentPrice: num("Current price per unit. Defaults to purchase price."),
            symbol: str("Ticker symbol, optional."),
          },
          required: ["name", "type", "quantity", "purchasePrice"],
        },
      },
      {
        name: "update_investment_price",
        description: "Update the current market price of a holding.",
        parameters: {
          type: "object",
          properties: {
            investment: str("Holding name or ticker symbol."),
            currentPrice: num("New price per unit."),
          },
          required: ["investment", "currentPrice"],
        },
      },
    ],
  },
];

// ======================================================
// Executors
// ======================================================

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const findCategory = async (workspace, name, type) => {
  if (!name) return null;
  return Category.findOne({
    workspace,
    name: new RegExp(`^${esc(name)}$`, "i"),
    isArchived: false,
    ...(type ? { type } : {}),
  });
};

const findAccount = async (workspace, name) => {
  if (name) {
    const match = await Account.findOne({
      workspace,
      name: new RegExp(`^${esc(name)}$`, "i"),
      isArchived: false,
    });
    if (match) return match;
  }
  return Account.findOne({ workspace, isArchived: false }).sort({ createdAt: 1 });
};

const fail = (message) => ({ ok: false, error: message });

/**
 * Builds the tool executor bound to one workspace/user.
 * Each result is small and human-readable — it goes back to the model, and the
 * `summary` is what the UI shows the user.
 */
export const createToolExecutor = ({ workspace, user, currency = "INR" }) => {
  const money = (amount) => ({ amount, currency });
  const audit = { createdBy: user };

  const handlers = {
    async create_transaction({ type, amount, category, description, account, date }) {
      if (!(Number(amount) > 0)) return fail("Amount must be greater than zero.");

      const cat = await findCategory(workspace, category, type);
      if (!cat) {
        return fail(
          `No ${type} category named "${category}". Use create_category first, or pick an existing one.`
        );
      }

      const acc = await findAccount(workspace, account);
      if (!acc) return fail("No account exists yet. Create one with create_account first.");

      const value = Number(amount);

      const txn = await transactionService.createTransaction({
        workspace,
        account: acc._id,
        category: cat._id,
        type,
        amount: value,
        money: money(value),
        description: description || "",
        paymentMethod: "upi",
        transactionDate: date ? new Date(date) : new Date(),
        audit,
      });

      return {
        ok: true,
        id: String(txn._id),
        summary: `${type === "income" ? "Added income" : "Recorded expense"} of ${value} ${currency} in ${cat.name} (${acc.name})`,
        entity: "transaction",
      };
    },

    async list_transactions({ limit = 10, type, category }) {
      const filter = { workspace, isDeleted: false };
      if (type) filter.type = type;

      if (category) {
        const cat = await findCategory(workspace, category);
        if (cat) filter.category = cat._id;
      }

      const rows = await Transaction.find(filter)
        .sort({ transactionDate: -1 })
        .limit(Math.min(Number(limit) || 10, 50))
        .populate("category", "name")
        .lean();

      return {
        ok: true,
        transactions: rows.map((t) => ({
          id: String(t._id),
          date: t.transactionDate?.toISOString?.().slice(0, 10),
          type: t.type,
          amount: t.money?.amount,
          category: t.category?.name,
          description: t.description,
        })),
      };
    },

    async delete_transaction({ transactionId, confirmed }) {
      if (!confirmed) {
        return fail("Not confirmed. Ask the user to confirm the deletion first.");
      }

      const txn = await Transaction.findOne({ _id: transactionId, workspace });
      if (!txn) return fail("No such transaction in this workspace.");

      await transactionService.deleteTransaction(transactionId);

      return {
        ok: true,
        summary: `Deleted transaction of ${txn.money?.amount} ${currency}${txn.description ? ` (${txn.description})` : ""}`,
        entity: "transaction",
      };
    },

    async create_account({ name, type, openingBalance = 0 }) {
      const acc = await accountService.createAccount(user, {
        workspace,
        name,
        type,
        currency,
        openingBalance: Number(openingBalance) || 0,
      });

      return {
        ok: true,
        id: acc.id,
        summary: `Created account "${name}" with ${Number(openingBalance) || 0} ${currency}`,
        entity: "account",
      };
    },

    async create_category({ name, type }) {
      const existing = await findCategory(workspace, name, type);
      if (existing) {
        return { ok: true, id: String(existing._id), summary: `Category "${name}" already exists`, entity: "category" };
      }

      const cat = await Category.create({ workspace, name, type, icon: "circle", color: "#6366f1" });

      return { ok: true, id: String(cat._id), summary: `Created ${type} category "${name}"`, entity: "category" };
    },

    async create_budget({ category, amount, period = "monthly" }) {
      const cat = await findCategory(workspace, category, "expense");
      if (!cat) return fail(`No expense category named "${category}".`);

      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const budget = await budgetService.createBudget({
        workspace,
        category: cat._id,
        name: cat.name,
        period,
        budgetAmount: money(Number(amount)),
        startDate: start,
        endDate: end,
        alertThreshold: 80,
        audit,
      });

      return {
        ok: true,
        id: String(budget._id),
        summary: `Set a ${period} budget of ${amount} ${currency} for ${cat.name}`,
        entity: "budget",
      };
    },

    async create_goal({ name, targetAmount, targetDate, currentAmount = 0, type = "custom" }) {
      const target = new Date(targetDate);
      if (!(target > new Date())) return fail("The target date must be in the future.");

      const goal = await goalService.createGoal({
        workspace,
        name,
        type,
        targetAmount: money(Number(targetAmount)),
        currentAmount: money(Number(currentAmount) || 0),
        targetDate: target,
        priority: 3,
        audit,
      });

      return {
        ok: true,
        id: String(goal._id),
        summary: `Created goal "${name}" targeting ${targetAmount} ${currency}`,
        entity: "goal",
      };
    },

    async contribute_to_goal({ goal, amount, direction = "add" }) {
      const found = await Goal.findOne({
        workspace,
        name: new RegExp(`^${esc(goal)}$`, "i"),
        isDeleted: false,
      });

      if (!found) return fail(`No goal named "${goal}".`);

      const value = Number(amount);

      const updated =
        direction === "withdraw"
          ? await goalService.withdrawContribution(found._id, value)
          : await goalService.addContribution(found._id, value);

      return {
        ok: true,
        summary: `${direction === "withdraw" ? "Withdrew" : "Added"} ${value} ${currency} ${direction === "withdraw" ? "from" : "to"} "${found.name}" — now ${updated.currentAmount.amount} of ${updated.targetAmount.amount}`,
        entity: "goal",
      };
    },

    async create_investment({ name, type, quantity, purchasePrice, currentPrice, symbol }) {
      const inv = await investmentService.createInvestment({
        workspace,
        name,
        symbol: symbol || undefined,
        type,
        quantity: Number(quantity),
        purchasePrice: money(Number(purchasePrice)),
        currentPrice: money(Number(currentPrice ?? purchasePrice)),
        purchaseDate: new Date(),
        riskLevel: "medium",
        audit,
      });

      return {
        ok: true,
        id: String(inv._id),
        summary: `Added ${quantity} × ${name} at ${purchasePrice} ${currency}`,
        entity: "investment",
      };
    },

    async update_investment_price({ investment, currentPrice }) {
      const pattern = new RegExp(`^${esc(investment)}$`, "i");

      const found = await Investment.findOne({
        workspace,
        isDeleted: false,
        $or: [{ name: pattern }, { symbol: pattern }],
      });

      if (!found) return fail(`No holding named "${investment}".`);

      await investmentService.updateCurrentPrice(found._id, Number(currentPrice));

      return {
        ok: true,
        summary: `Updated ${found.name} price to ${currentPrice} ${currency}`,
        entity: "investment",
      };
    },
  };

  return async (name, args) => {
    const handler = handlers[name];
    if (!handler) return fail(`Unknown tool "${name}".`);
    return handler(args);
  };
};

export default { toolDeclarations, createToolExecutor };
