// Static reachability analysis from the application entrypoints.
//
// After the modules/ refactor landed alongside the original services/,
// controllers/, routes/ and validators/ trees, it is no longer obvious which
// files the running application actually loads. Deleting by eye would break
// the live paths (health, subscription and investment-transaction routes are
// still served from the old tree).
//
// Walks the real import graph and reports which files under src/ are never
// reached.

import fs from "node:fs/promises";
import path from "node:path";

const SRC = path.resolve(process.cwd(), "src");

const ENTRYPOINTS = [
  "src/server.js",
  "src/app.js",
  "src/jobs/index.js",
  "src/seeds/index.js",
];

const IMPORT_RE = /(?:^|\n)\s*(?:import[\s\S]*?from\s*|import\s*|export[\s\S]*?from\s*)["']([^"']+)["']/g;

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

  const candidates = [base, `${base}.js`, path.join(base, "index.js")];

  for (const c of candidates) {
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

for (const entry of ENTRYPOINTS) await walk(entry);

const all = await listAll(SRC);

const orphaned = all
  .filter((f) => !reached.has(f))
  // tests are entrypoints of their own
  .filter((f) => !f.includes(`${path.sep}tests${path.sep}`))
  .map((f) => path.relative(process.cwd(), f).split(path.sep).join("/"));

const byDir = {};

for (const f of orphaned) {
  const dir = f.split("/").slice(0, 3).join("/");
  (byDir[dir] ||= []).push(f);
}

console.log(`reached:  ${reached.size} files`);
console.log(`orphaned: ${orphaned.length} files\n`);

for (const [dir, files] of Object.entries(byDir).sort()) {
  console.log(`${dir}/  (${files.length})`);
  for (const f of files) console.log(`    ${f}`);
}
