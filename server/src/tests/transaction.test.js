// Transaction statistics.
//
// Seven aggregation pipelines in transaction.service.js summed "$amount" and
// $matched a string workspace id, so every statistic the API reported was
// zero. These tests assert concrete totals against known fixtures.

import transactionService from "../services/transaction.service.js";

import { makeWorkspaceFixture, makeTransaction } from "./helpers/factories.js";

// Builds: income 5000; expenses 1200 + 800; one soft-deleted expense of 9999.
const seedWorkspace = async () => {
  const fixture = await makeWorkspaceFixture();

  await makeTransaction(fixture, {
    type: "income",
    category: fixture.incomeCategory._id,
    money: { amount: 5000, currency: "INR" },
  });

  await makeTransaction(fixture, { money: { amount: 1200, currency: "INR" } });

  await makeTransaction(fixture, { money: { amount: 800, currency: "INR" } });

  await makeTransaction(fixture, {
    money: { amount: 9999, currency: "INR" },
    isDeleted: true,
  });

  return fixture;
};

describe("transactionService.getIncomeVsExpense", () => {
  it("totals income and expense, excluding soft-deleted rows", async () => {
    const fixture = await seedWorkspace();

    const result = await transactionService.getIncomeVsExpense(
      fixture.workspace._id.toString()
    );

    expect(result.income).toBe(5000);
    expect(result.expense).toBe(2000);
  });
});

describe("transactionService.getTransactionStatistics", () => {
  it("reports counts and totals consistently with the dashboard", async () => {
    const fixture = await seedWorkspace();

    const stats = await transactionService.getTransactionStatistics(
      fixture.workspace._id.toString()
    );

    // The count must apply the same isDeleted filter as the totals beside it,
    // or the reported average transaction value is silently wrong.
    expect(stats.totalTransactions).toBe(3);
    expect(stats.totalIncome).toBe(5000);
    expect(stats.totalExpense).toBe(2000);
    expect(stats.netCashFlow).toBe(3000);
  });
});

describe("transactionService.getSpendingByCategory", () => {
  it("groups expense by category and excludes income", async () => {
    const fixture = await seedWorkspace();

    const rows = await transactionService.getSpendingByCategory(
      fixture.workspace._id.toString()
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].total).toBe(2000);
  });
});

describe("workspace isolation", () => {
  it("does not count another workspace's transactions", async () => {
    const a = await seedWorkspace();

    const b = await makeWorkspaceFixture();

    await makeTransaction(b, { money: { amount: 77777, currency: "INR" } });

    const stats = await transactionService.getTransactionStatistics(
      a.workspace._id.toString()
    );

    expect(stats.totalExpense).toBe(2000);
  });
});

describe("invalid input", () => {
  it("rejects a malformed workspace id instead of reporting zeros", async () => {
    await expect(
      transactionService.getIncomeVsExpense("not-an-object-id")
    ).rejects.toThrow(/invalid workspace/i);
  });
});
