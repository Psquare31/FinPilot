// Investment service.
//
// investment.service.js was written against a schema that does not exist: it
// used `totalUnits`, `averagePrice` and `assetType`, while the model defines
// `quantity`, `purchasePrice` (Money), `currentPrice` (Money) and `type`.
// Consequences these tests pin down:
//   - buy/sell arithmetic produced NaN
//   - the oversell guard compared `undefined < quantity`, always false, so a
//     user could sell units they did not hold

import investmentService from "../services/investment.service.js";

import InvestmentTransaction from "../models/InvestmentTransaction.js";

import { makeWorkspaceFixture, makeInvestment } from "./helpers/factories.js";

describe("investmentService.buyInvestment", () => {
  it("updates quantity and recomputes the weighted-average cost basis", async () => {
    const fixture = await makeWorkspaceFixture();

    // Opens at quantity 10 @ 100.
    const investment = await makeInvestment(fixture);

    // Buy 10 @ 200 -> quantity 20, avg = (10*100 + 10*200) / 20 = 150
    const updated = await investmentService.buyInvestment(
      investment._id,
      { quantity: 10, price: 200 },
      fixture.user._id
    );

    expect(updated.quantity).toBe(20);
    expect(updated.purchasePrice.amount).toBe(150);
    expect(Number.isNaN(updated.purchasePrice.amount)).toBe(false);
  });

  it("writes a ledger row using the schema's real field names", async () => {
    const fixture = await makeWorkspaceFixture();

    const investment = await makeInvestment(fixture);

    await investmentService.buyInvestment(
      investment._id,
      { quantity: 4, price: 250 },
      fixture.user._id
    );

    const ledger = await InvestmentTransaction.findOne({
      investment: investment._id,
    }).lean();

    // Previously created with { units, price: <number>, amount }, none of
    // which the schema accepts — price is a Money subdocument and audit is
    // required, so the write could not have succeeded.
    expect(ledger.quantity).toBe(4);
    expect(ledger.price.amount).toBe(250);
    expect(ledger.type).toBe("buy");
    expect(ledger.audit.createdBy).toBeDefined();
  });

  it("rejects a non-positive quantity", async () => {
    const fixture = await makeWorkspaceFixture();

    const investment = await makeInvestment(fixture);

    await expect(
      investmentService.buyInvestment(
        investment._id,
        { quantity: 0, price: 100 },
        fixture.user._id
      )
    ).rejects.toThrow(/greater than zero/i);
  });
});

describe("investmentService.sellInvestment", () => {
  it("blocks selling more units than are held", async () => {
    const fixture = await makeWorkspaceFixture();

    // Holds 10 units.
    const investment = await makeInvestment(fixture);

    await expect(
      investmentService.sellInvestment(
        investment._id,
        { quantity: 100, price: 130 },
        fixture.user._id
      )
    ).rejects.toThrow(/insufficient units/i);
  });

  it("leaves the holding untouched when a sell is rejected", async () => {
    const fixture = await makeWorkspaceFixture();

    const investment = await makeInvestment(fixture);

    await expect(
      investmentService.sellInvestment(
        investment._id,
        { quantity: 100, price: 130 },
        fixture.user._id
      )
    ).rejects.toThrow();

    const after = await investmentService.getInvestmentById(investment._id);

    // The old guard never fired, so quantity was driven negative.
    expect(after.quantity).toBe(10);
    expect(after.quantity).toBeGreaterThanOrEqual(0);
  });

  it("reduces quantity and leaves the cost basis unchanged", async () => {
    const fixture = await makeWorkspaceFixture();

    const investment = await makeInvestment(fixture);

    const updated = await investmentService.sellInvestment(
      investment._id,
      { quantity: 4, price: 130 },
      fixture.user._id
    );

    expect(updated.quantity).toBe(6);
    // Selling realises a gain; it does not change what the remaining units cost.
    expect(updated.purchasePrice.amount).toBe(100);
  });
});

describe("investmentService.getInvestmentSummary", () => {
  it("computes invested value, current value and profit/loss", async () => {
    const fixture = await makeWorkspaceFixture();

    // quantity 10, purchase 100, current 120
    await makeInvestment(fixture);

    const summary = await investmentService.getInvestmentSummary(
      fixture.workspace._id
    );

    expect(summary.totalInvested).toBe(1000);
    expect(summary.currentValue).toBe(1200);
    expect(summary.profitLoss).toBe(200);
    expect(summary.returnPercentage).toBe(20);
  });
});
