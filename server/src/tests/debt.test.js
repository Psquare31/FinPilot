// Debt repayment.
//
// debt.service.js was written against fields the schema does not define:
// `totalAmount` and `paidAmount`, where the model has `principalAmount` and
// `outstandingAmount` (both Money subdocuments). So:
//
//   - `debt.paidAmount += amount` was NaN
//   - `if (debt.paidAmount >= debt.totalAmount)` compared NaN with undefined,
//     which is always false, so a debt could never be closed
//   - the branch it guarded assigned status "paid", which is not a member of
//     DEBT_STATUS ("active" | "closed" | "defaulted"), and set `paidAt`,
//     which is not a field — so had it ever run, it would have thrown

import debtService from "../modules/debts/debt.service.js";

import { makeWorkspaceFixture, makeDebt } from "./helpers/factories.js";

describe("debtService.recordPayment", () => {
  it("reduces the outstanding balance", async () => {
    const fixture = await makeWorkspaceFixture();

    // principal 100000, outstanding 100000
    const debt = await makeDebt(fixture);

    const updated = await debtService.recordPayment(debt._id, 25000);

    expect(updated.outstandingAmount.amount).toBe(75000);
    expect(Number.isNaN(updated.outstandingAmount.amount)).toBe(false);
    // Virtual derived from principal - outstanding.
    expect(updated.amountPaid).toBe(25000);
    expect(updated.status).toBe("active");
  });

  it("closes the debt once the balance reaches zero", async () => {
    const fixture = await makeWorkspaceFixture();

    const debt = await makeDebt(fixture);

    await debtService.recordPayment(debt._id, 60000);

    const updated = await debtService.recordPayment(debt._id, 40000);

    expect(updated.outstandingAmount.amount).toBe(0);
    // Previously unreachable: the completion check could never be true.
    expect(updated.status).toBe("closed");
  });

  it("rejects a payment larger than the outstanding balance", async () => {
    const fixture = await makeWorkspaceFixture();

    const debt = await makeDebt(fixture);

    await expect(
      debtService.recordPayment(debt._id, 150000)
    ).rejects.toThrow(/exceeds the outstanding balance/i);
  });

  it("rejects a non-positive payment", async () => {
    const fixture = await makeWorkspaceFixture();

    const debt = await makeDebt(fixture);

    await expect(debtService.recordPayment(debt._id, 0)).rejects.toThrow(
      /greater than zero/i
    );
  });
});

describe("debtService.getDebtProgress", () => {
  it("reports totals against principalAmount and outstandingAmount", async () => {
    const fixture = await makeWorkspaceFixture();

    const debt = await makeDebt(fixture);

    await debtService.recordPayment(debt._id, 30000);

    const progress = await debtService.getDebtProgress(debt._id);

    expect(progress.totalAmount).toBe(100000);
    expect(progress.paidAmount).toBe(30000);
    expect(progress.remainingAmount).toBe(70000);
    expect(progress.percentage).toBe(30);
    expect(progress.completed).toBe(false);
  });
});

describe("debtService.getDebtSummary", () => {
  it("counts closed debts and totals principal and paid amounts", async () => {
    const fixture = await makeWorkspaceFixture();

    const cleared = await makeDebt(fixture);
    await debtService.recordPayment(cleared._id, 100000);

    await makeDebt(fixture, {
      name: "Home Loan",
      principalAmount: { amount: 50000, currency: "INR" },
      outstandingAmount: { amount: 50000, currency: "INR" },
    });

    const summary = await debtService.getDebtSummary(fixture.workspace._id);

    expect(summary.totalDebts).toBe(2);
    // Counted debts whose status was "paid" — a value the enum does not allow.
    expect(summary.paidDebts).toBe(1);
    expect(summary.activeDebts).toBe(1);
    expect(summary.totalAmount).toBe(150000);
    expect(summary.totalPaid).toBe(100000);
    expect(summary.remainingAmount).toBe(50000);
  });
});
