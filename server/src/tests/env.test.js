// Guards the test environment itself.
//
// src/config/env/index.js validates the whole environment at import time and
// calls process.exit(1) if anything is missing. Locally that never bites,
// because a developer's .env supplies the values — but CI has no .env, so any
// variable the schema requires and env.setup.js does not default takes the
// entire suite down with an exit code, not a test failure.
//
// That is exactly how SMTP_* got through: verified locally, broken in CI.
// This test reads the schema and asserts the test setup covers it, so a newly
// required variable fails here with a readable message instead.

import fs from "node:fs/promises";
import path from "node:path";

const read = (file) =>
  fs.readFile(path.join(process.cwd(), "src", "config", "env", file), "utf8");

describe("test environment setup", () => {
  it("defaults every variable the env schema requires", async () => {
    const schemaSource = await read("index.js");

    const setupSource = await fs.readFile(
      path.join(process.cwd(), "src", "tests", "env.setup.js"),
      "utf8"
    );

    // Top-level keys of the zod object, e.g. "  SMTP_EMAIL: z"
    const declared = [...schemaSource.matchAll(/^ {2}([A-Z][A-Z0-9_]*):/gm)].map(
      (m) => m[1]
    );

    expect(declared.length).toBeGreaterThan(10);

    // A variable is exempt only if the schema gives it a default.
    const hasDefault = (name) => {
      const start = schemaSource.indexOf(`\n  ${name}:`);

      const next = schemaSource.slice(start + 1).search(/\n {2}[A-Z][A-Z0-9_]*:/);

      const block = schemaSource.slice(
        start,
        next === -1 ? undefined : start + 1 + next
      );

      return /\.default\(/.test(block);
    };

    const required = declared.filter((name) => !hasDefault(name));

    const missing = required.filter(
      (name) => !new RegExp(`process\\.env\\.${name}\\s*=`).test(setupSource)
    );

    expect(missing).toEqual([]);
  });

  it("runs against a disposable local database", () => {
    // The suite drops collections between tests; see setup.js.
    expect(process.env.MONGO_URI).toMatch(/127\.0\.0\.1|localhost/);
    expect(process.env.MONGO_URI).toMatch(/test/i);
  });
});
