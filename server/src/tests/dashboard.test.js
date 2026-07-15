// Dashboard analytics.
//
// Every assertion here checks a real total against a known fixture. The
// pipelines these cover previously returned zero for two independent reasons:
// they summed "$amount" (a field no schema defines) and they $matched a string
// workspace id against an ObjectId field — and aggregate(), unlike find(),
// performs no schema casting.
//
// A test asserting only "responds 200" or "returns a number" would have passed
// against the broken code. These assert values.

import dashboardService from "../services/dashboard.service.js";

import {
  makeWorkspaceFixture,
  makeTransaction,
  makeInvestment,
} from "./helpers/factories.js";

describe("dashboardService.getTransactionSummary", () => {
  it("totals income and expense from money.amount", async () => {
    const fixture = await makeWorkspaceFixture();

    await makeTransaction(fixture, {
      type: "income",
      category: fixture.incomeCategory._id,
      money: { amount: 5000, currency: "INR" },
    });

    await makeTransaction(fixture, {
      money: { amount: 1200, currency: "INR" },
    });

    await makeTransaction(fixture, {
      money: { amount: 800, currency: "INR" },
    });

    const summary = await dashboardService.getTransactionSummary(
      fixture.workspace._id
    );

    expect(summary.income).toBe(5000);
    expect(summary.expense).toBe(2000);
    expect(summary.cashFlow).toBe(3000);
  });

  it("accepts a string workspace id, as the controller passes from req.query", async () => {
    const fixture = await makeWorkspaceFixture();

    await makeTransaction(fixture, {
      type: "income",
      category: fixture.incomeCategory._id,
      money: { amount: 2500, currency: "INR" },
    });

    // The controller reads req.query.workspace, which is always a string.
    // Before the fix this matched zero documents and returned 0.
    const summary = await dashboardService.getTransactionSummary(
      fixture.workspace._id.toString()
    );

    expect(summary.income).toBe(2500);
  });

  it("excludes soft-deleted transactions", async () => {
    const fixture = await makeWorkspaceFixture();

    await makeTransaction(fixture, {
      money: { amount: 1000, currency: "INR" },
    });

    await makeTransaction(fixture, {
      money: { amount: 9999, currency: "INR" },
      isDeleted: true,
    });

    const summary = await dashboardService.getTransactionSummary(
      fixture.workspace._id
    );

    expect(summary.expense).toBe(1000);
  });

  it("does not leak totals across workspaces", async () => {
    const a = await makeWorkspaceFixture();
    const b = await makeWorkspaceFixture();

    await makeTransaction(a, { money: { amount: 1000, currency: "INR" } });
    await makeTransaction(b, { money: { amount: 7777, currency: "INR" } });

    const summary = await dashboardService.getTransactionSummary(
      a.workspace._id
    );

    expect(summary.expense).toBe(1000);
  });

  it("rejects an invalid workspace id rather than silently returning zero", async () => {
    await expect(
      dashboardService.getTransactionSummary("not-an-object-id")
    ).rejects.toThrow(/invalid workspace/i);
  });
});

describe("dashboardService.getInvestmentSummary", () => {
  it("values holdings as quantity x currentPrice.amount", async () => {
    const fixture = await makeWorkspaceFixture();

    // quantity 10, currentPrice 120 -> 1200
    await makeInvestment(fixture);

    const summary = await dashboardService.getInvestmentSummary(
      fixture.workspace._id
    );

    // Previously `totalUnits * currentPrice` == undefined * {…} == NaN.
    expect(Number.isNaN(summary.totalCurrentValue)).toBe(false);
    expect(summary.totalCurrentValue).toBe(1200);
    expect(summary.totalInvestments).toBe(1);
  });
});
