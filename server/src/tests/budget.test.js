// Budget spend tracking.
//
// budget.service.js read `budget.amount`, which the schema does not define
// (it is the Money subdocument `budgetAmount`). That made `remaining` NaN,
// pinned `percentage` at 0 and left `exceeded` permanently false.
//
// The same defect in budgetAlerts.job.js was worse: `NaN < 80` is false, so
// the early-return never fired and every budget produced an alert containing
// NaN on every run.

import budgetService from "../services/budget.service.js";

import {
  makeWorkspaceFixture,
  makeBudget,
  makeTransaction,
} from "./helpers/factories.js";

const inMarch = { transactionDate: new Date("2026-03-15") };

describe("budgetService.getBudgetProgress", () => {
  it("reports spend, remaining and percentage against budgetAmount.amount", async () => {
    const fixture = await makeWorkspaceFixture();

    // Budget of 10,000 for March.
    const budget = await makeBudget(fixture);

    await makeTransaction(fixture, {
      money: { amount: 2000, currency: "INR" },
      ...inMarch,
    });

    await makeTransaction(fixture, {
      money: { amount: 500, currency: "INR" },
      ...inMarch,
    });

    const progress = await budgetService.getBudgetProgress(budget._id);

    expect(progress.budgetAmount).toBe(10000);
    expect(progress.spent).toBe(2500);
    expect(progress.remaining).toBe(7500);
    expect(Number.isNaN(progress.remaining)).toBe(false);
    expect(progress.percentage).toBe(25);
    expect(progress.exceeded).toBe(false);
  });

  it("flags a budget that has been exceeded", async () => {
    const fixture = await makeWorkspaceFixture();

    const budget = await makeBudget(fixture);

    await makeTransaction(fixture, {
      money: { amount: 12000, currency: "INR" },
      ...inMarch,
    });

    const progress = await budgetService.getBudgetProgress(budget._id);

    expect(progress.spent).toBe(12000);
    expect(progress.remaining).toBe(-2000);
    expect(progress.percentage).toBe(120);
    // `exceeded` was `12000 > undefined` -> false, however far over you went.
    expect(progress.exceeded).toBe(true);
  });

  it("ignores spend outside the budget period", async () => {
    const fixture = await makeWorkspaceFixture();

    const budget = await makeBudget(fixture);

    await makeTransaction(fixture, {
      money: { amount: 1000, currency: "INR" },
      ...inMarch,
    });

    await makeTransaction(fixture, {
      money: { amount: 9999, currency: "INR" },
      transactionDate: new Date("2026-05-01"),
    });

    const progress = await budgetService.getBudgetProgress(budget._id);

    expect(progress.spent).toBe(1000);
  });

  it("ignores soft-deleted transactions", async () => {
    const fixture = await makeWorkspaceFixture();

    const budget = await makeBudget(fixture);

    await makeTransaction(fixture, {
      money: { amount: 1000, currency: "INR" },
      ...inMarch,
    });

    await makeTransaction(fixture, {
      money: { amount: 5000, currency: "INR" },
      isDeleted: true,
      ...inMarch,
    });

    const progress = await budgetService.getBudgetProgress(budget._id);

    expect(progress.spent).toBe(1000);
  });

  it("ignores income and other categories", async () => {
    const fixture = await makeWorkspaceFixture();

    const budget = await makeBudget(fixture);

    await makeTransaction(fixture, {
      money: { amount: 1000, currency: "INR" },
      ...inMarch,
    });

    await makeTransaction(fixture, {
      type: "income",
      category: fixture.incomeCategory._id,
      money: { amount: 50000, currency: "INR" },
      ...inMarch,
    });

    const progress = await budgetService.getBudgetProgress(budget._id);

    expect(progress.spent).toBe(1000);
  });
});
