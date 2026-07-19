// Authoritative dead-code analysis for deletion.
//
// Extends reachability.mjs with two corrections that matter before any file is
// removed:
//
//   1. Test files are entrypoints too. A source file imported only by a test is
//      still "used" — deleting it breaks the suite. All src/**/*.test.js are
//      walked as roots.
//
//   2. swagger-jsdoc loads files by PATH GLOB, not by import (see
//      config/swagger/swagger.js -> apis: ["./src/routes/**/*.js",
//      "./src/modules/**/*.js"]). Files matched by those globs are read for
//      their @swagger JSDoc even when nothing imports them, so they are not
//      dead for documentation purposes. They are reported separately.
//
// Output: three buckets — DELETE (orphaned, outside swagger globs, not test-
// reached), KEEP-SWAGGER (orphaned but glob-scanned), and the reached set size.

import fs from "node:fs/promises";
import path from "node:path";

const CWD = process.cwd();
const SRC = path.resolve(CWD, "src");

const APP_ENTRYPOINTS = [
  "src/server.js",
  "src/app.js",
  "src/jobs/index.js",
  "src/seeds/index.js",
];

// Paths swagger-jsdoc scans by glob (mirrors config/swagger/swagger.js).
const SWAGGER_GLOB_DIRS = [
  path.join(SRC, "routes"),
  path.join(SRC, "modules"),
];

const IMPORT_RE =
  /(?:^|\n)\s*(?:import[\s\S]*?from\s*|import\s*|export[\s\S]*?from\s*)["']([^"']+)["']/g;

const exists = async (p) => {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
};

const resolveImport = async (fromFile, spec) => {
  if (!spec.startsWith(".")) return null;
  const base = path.resolve(path.dirname(fromFile), spec);
  for (const c of [base, `${base}.js`, path.join(base, "index.js")]) {
    if (await exists(c)) {
      const stat = await fs.stat(c);
      if (stat.isFile()) return c;
    }
  }
  return null;
};

const reached = new Set();

const walk = async (file) => {
  const abs = path.resolve(file);
  if (reached.has(abs)) return;
  if (!(await exists(abs))) return;
  reached.add(abs);
  const source = await fs.readFile(abs, "utf8");
  for (const match of source.matchAll(IMPORT_RE)) {
    const target = await resolveImport(abs, match[1]);
    if (target) await walk(target);
  }
};

const listAll = async (dir) => {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await listAll(full)));
    else if (entry.name.endsWith(".js")) out.push(full);
  }
  return out;
};

const all = await listAll(SRC);

// Roots: the app entrypoints AND every test file.
const testFiles = all.filter((f) => f.endsWith(".test.js"));
for (const entry of APP_ENTRYPOINTS) await walk(entry);
for (const t of testFiles) await walk(t);

const rel = (f) => path.relative(CWD, f).split(path.sep).join("/");

const underSwaggerGlob = (f) =>
  SWAGGER_GLOB_DIRS.some((d) => f.startsWith(d + path.sep));

const orphaned = all.filter(
  (f) => !reached.has(f) && !f.endsWith(".test.js")
);

const toDelete = orphaned.filter((f) => !underSwaggerGlob(f)).map(rel).sort();
const keepSwagger = orphaned.filter(underSwaggerGlob).map(rel).sort();

console.log(`reached (app + tests): ${reached.size} files`);
console.log(`orphaned total:        ${orphaned.length}`);
console.log(`  -> DELETE (dead):    ${toDelete.length}`);
console.log(`  -> KEEP (swagger):   ${keepSwagger.length}\n`);

const group = (files) => {
  const byDir = {};
  for (const f of files) {
    const dir = f.split("/").slice(0, 3).join("/");
    (byDir[dir] ||= []).push(f);
  }
  for (const [dir, fs_] of Object.entries(byDir).sort())
    console.log(`  ${dir}/  (${fs_.length})`);
};

console.log("DELETE candidates by dir:");
group(toDelete);

console.log("\nKEEP (swagger-globbed) by dir:");
group(keepSwagger);

await fs.writeFile(
  path.join(CWD, "bench", "deadcode.json"),
  JSON.stringify({ toDelete, keepSwagger }, null, 2)
);
