// Regression tests for Mongoose 9 middleware.
//
// Mongoose 9 removed callback-style document middleware: hooks declared as
// `function (next)` never receive `next`, so calling it throws
// "next is not a function" and the document can never be saved. Seven models
// still used that signature, which made their core write paths unusable.
//
// These tests fail loudly if any hook regresses to the callback signature.

import mongoose from "mongoose";

import {
  makeUser,
  makeWorkspace,
  makeTransaction,
  makeBudget,
  makeWorkspaceFixture,
} from "./helpers/factories.js";

import Goal from "../models/Goal.js";
import WorkspaceMember from "../models/WorkspaceMember.js";

describe("Mongoose 9 document middleware", () => {
  it("saves a Transaction (pre-validate hook must not use next())", async () => {
    const fixture = await makeWorkspaceFixture();

    const transaction = await makeTransaction(fixture);

    expect(transaction._id).toBeDefined();
    expect(transaction.money.amount).toBe(1000);
  });

  it("saves a Budget", async () => {
    const fixture = await makeWorkspaceFixture();

    const budget = await makeBudget(fixture);

    expect(budget._id).toBeDefined();
    expect(budget.budgetAmount.amount).toBe(10000);
  });

  it("saves a Goal", async () => {
    const user = await makeUser();
    const workspace = await makeWorkspace(user);

    const goal = await Goal.create({
      workspace: workspace._id,
      name: "Emergency Fund",
      targetAmount: { amount: 500000, currency: "INR" },
      targetDate: new Date("2027-12-31"),
      audit: { createdBy: user._id },
    });

    expect(goal._id).toBeDefined();
  });

  it("saves a WorkspaceMember and applies its pre-save hook", async () => {
    const user = await makeUser();
    const workspace = await makeWorkspace(user);

    const member = await WorkspaceMember.create({
      workspace: workspace._id,
      user: user._id,
      role: "admin",
      status: "active",
    });

    // The pre('save') hook fills these in; if it threw, we would never get here.
    expect(member.permissions.length).toBeGreaterThan(0);
    expect(member.joinedAt).toBeDefined();
  });
});

describe("Transaction business rules", () => {
  it("rejects a transfer whose destination equals its source account", async () => {
    const fixture = await makeWorkspaceFixture();

    // The pre-validate guard must still reject: converting the hook to async
    // must preserve the rule, not just stop it throwing TypeError.
    await expect(
      makeTransaction(fixture, {
        type: "transfer",
        transferAccount: fixture.account._id,
      })
    ).rejects.toThrow(/different destination account/i);
  });

  it("rejects a Budget whose end date precedes its start date", async () => {
    const fixture = await makeWorkspaceFixture();

    await expect(
      makeBudget(fixture, {
        startDate: new Date("2026-03-31"),
        endDate: new Date("2026-03-01"),
      })
    ).rejects.toThrow(/end date must be after start date/i);
  });
});

describe("Transaction schema", () => {
  it("stores amounts under money.amount, not a top-level amount field", async () => {
    const fixture = await makeWorkspaceFixture();

    await makeTransaction(fixture);

    const raw = await mongoose.connection
      .collection("transactions")
      .findOne({});

    // Aggregation pipelines summing "$amount" relied on a field that does not
    // exist and therefore always totalled zero.
    expect(raw.amount).toBeUndefined();
    expect(raw.money.amount).toBe(1000);
  });
});
