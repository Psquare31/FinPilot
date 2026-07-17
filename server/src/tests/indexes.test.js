// Index declarations.
//
// A field-level `index`, `unique` or `sparse` each declares an index, so
// pairing any of them with a matching schema.index() call emits the same key
// twice. Mongoose warns; MongoDB rejects the second outright when the options
// differ — which is how the TTL indexes on Notification.expiresAt and
// RefreshToken.expiresAt came to not exist at all, leaving expired
// notifications and refresh tokens to accumulate forever.
//
// These tests assert the indexes that carry behaviour are actually built, so a
// silently-dropped definition fails here rather than in production.

import mongoose from "mongoose";

import User from "../models/User.js";
import Notification from "../models/Notification.js";
import Transaction from "../models/Transaction.js";

const indexesOf = async (model) => {
  await model.syncIndexes();

  return model.collection.indexes();
};

describe("index declarations", () => {
  it("declares no duplicate keys across the schemas", () => {
    const offenders = [];

    for (const [name, model] of Object.entries(mongoose.models)) {
      const seen = new Map();

      for (const [spec] of model.schema.indexes()) {
        const key = JSON.stringify(spec);

        if (seen.has(key)) offenders.push(`${name}: ${key}`);

        seen.set(key, true);
      }
    }

    expect(offenders).toEqual([]);
  });

  it("builds the TTL index that reaps expired notifications", async () => {
    const indexes = await indexesOf(Notification);

    const ttl = indexes.find((i) => i.key?.expiresAt === 1);

    expect(ttl).toBeDefined();
    // Without expireAfterSeconds this is an ordinary index and nothing expires.
    expect(ttl.expireAfterSeconds).toBe(0);
  });

  it("builds the unique sparse index on User.clerkId", async () => {
    const indexes = await indexesOf(User);

    const clerk = indexes.find((i) => i.key?.clerkId === 1);

    expect(clerk).toBeDefined();
    expect(clerk.unique).toBe(true);
    // Sparse matters: users predating Clerk have no clerkId, and a non-sparse
    // unique index would reject every one of them after the first.
    expect(clerk.sparse).toBe(true);
  });

  it("builds the compound index backing workspace transaction queries", async () => {
    const indexes = await indexesOf(Transaction);

    const compound = indexes.find(
      (i) => i.key?.workspace === 1 && i.key?.transactionDate === -1
    );

    expect(compound).toBeDefined();
  });
});
