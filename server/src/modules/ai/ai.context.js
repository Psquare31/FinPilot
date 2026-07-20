import Account from "../../models/Account.js";
import Transaction from "../../models/Transaction.js";
import Budget from "../../models/Budget.js";
import Goal from "../../models/Goal.js";
import Investment from "../../models/Investment.js";
import Category from "../../models/Category.js";

// Builds a compact snapshot of a workspace's finances to ground the model in
// the user's real data. Kept small and pre-aggregated on purpose: sending raw
// documents would burn tokens and bury the signal.

const sum = (rows, fn) => rows.reduce((s, r) => s + (fn(r) || 0), 0);

const amountOf = (t) => t.money?.amount ?? 0;

const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export const buildFinancialContext = async (workspace, { months = 6 } = {}) => {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const [accounts, transactions, budgets, goals, investments, categories] =
    await Promise.all([
      Account.find({ workspace, isArchived: false }).lean(),
      Transaction.find({
        workspace,
        isDeleted: false,
        transactionDate: { $gte: since },
      })
        .sort({ transactionDate: -1 })
        .limit(500)
        .lean(),
      Budget.find({ workspace, isDeleted: false }).lean(),
      Goal.find({ workspace, isDeleted: false }).lean(),
      Investment.find({ workspace, isDeleted: false }).lean(),
      Category.find({ workspace, isArchived: false }).lean(),
    ]);

  const catName = new Map(categories.map((c) => [String(c._id), c.name]));

  const income = transactions.filter((t) => t.type === "income");
  const expense = transactions.filter((t) => t.type === "expense");

  // Spend per category
  const spendByCategory = {};
  expense.forEach((t) => {
    const name = catName.get(String(t.category)) || "Uncategorised";
    spendByCategory[name] = (spendByCategory[name] || 0) + amountOf(t);
  });

  // Month-by-month income / expense
  const monthly = {};
  transactions.forEach((t) => {
    const key = monthKey(new Date(t.transactionDate || t.createdAt));
    monthly[key] = monthly[key] || { income: 0, expense: 0 };
    if (t.type === "income") monthly[key].income += amountOf(t);
    if (t.type === "expense") monthly[key].expense += amountOf(t);
  });

  const totalIncome = sum(income, amountOf);
  const totalExpense = sum(expense, amountOf);

  const investedValue = sum(investments, (i) => i.quantity * (i.purchasePrice?.amount || 0));
  const currentValue = sum(investments, (i) => i.quantity * (i.currentPrice?.amount || 0));

  const currency = accounts[0]?.currency || "INR";

  return {
    currency,
    periodMonths: months,
    accounts: accounts.map((a) => ({
      name: a.name,
      type: a.type,
      balance: a.balance,
    })),
    totals: {
      cashBalance: sum(accounts, (a) => a.balance),
      income: totalIncome,
      expense: totalExpense,
      net: totalIncome - totalExpense,
      savingsRate:
        totalIncome > 0
          ? Number((((totalIncome - totalExpense) / totalIncome) * 100).toFixed(1))
          : 0,
      transactionCount: transactions.length,
    },
    spendByCategory: Object.entries(spendByCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([name, amount]) => ({ name, amount })),
    monthly: Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month, ...v })),
    budgets: budgets.map((b) => {
      const spent = expense
        .filter(
          (t) =>
            String(t.category) === String(b.category) &&
            new Date(t.transactionDate) >= new Date(b.startDate) &&
            new Date(t.transactionDate) <= new Date(b.endDate)
        )
        .reduce((s, t) => s + amountOf(t), 0);
      const limit = b.budgetAmount?.amount || 0;
      return {
        name: b.name,
        category: catName.get(String(b.category)) || "Unknown",
        period: b.period,
        limit,
        spent,
        percentUsed: limit ? Number(((spent / limit) * 100).toFixed(1)) : 0,
      };
    }),
    goals: goals.map((g) => ({
      name: g.name,
      type: g.type,
      target: g.targetAmount?.amount || 0,
      saved: g.currentAmount?.amount || 0,
      targetDate: g.targetDate,
      status: g.status,
    })),
    investments: investments.map((i) => ({
      name: i.name,
      symbol: i.symbol,
      type: i.type,
      quantity: i.quantity,
      buyPrice: i.purchasePrice?.amount || 0,
      currentPrice: i.currentPrice?.amount || 0,
      value: i.quantity * (i.currentPrice?.amount || 0),
      riskLevel: i.riskLevel,
    })),
    portfolio: {
      invested: investedValue,
      currentValue,
      profitLoss: currentValue - investedValue,
      returnPercentage:
        investedValue > 0
          ? Number((((currentValue - investedValue) / investedValue) * 100).toFixed(2))
          : 0,
    },
    recentTransactions: transactions.slice(0, 25).map((t) => ({
      date: (t.transactionDate || t.createdAt)?.toISOString?.().slice(0, 10),
      type: t.type,
      amount: amountOf(t),
      category: catName.get(String(t.category)) || "Uncategorised",
      description: t.description || "",
    })),
    categories: categories.map((c) => ({ name: c.name, type: c.type })),
  };
};

export default { buildFinancialContext };
