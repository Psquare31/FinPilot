// Reports relative imports whose case does not match the file on disk.
//
// Windows and macOS resolve these anyway — their filesystems are
// case-insensitive — so they pass locally and fail only on Linux CI, where
// they surface as "Cannot find module". modules/ai/ai.service.js importing
// ../../models/AIInteraction.js (the file is AiInteraction.js) was exactly
// this, and it broke the health suite while every local run stayed green.

import fs from "node:fs/promises";
import path from "node:path";

const SRC = path.resolve(process.cwd(), "src");

const IMPORT_RE =
  /(?:^|\n)\s*(?:import[\s\S]*?from\s*|import\s*|export[\s\S]*?from\s*)["'](\.[^"']+)["']/g;

const listAll = async (dir) => {
  const out = [];

  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) out.push(...(await listAll(full)));
    else if (/\.m?js$/.test(entry.name)) out.push(full);
  }

  return out;
};

// Resolve a path segment-by-segment against the real directory entries, so a
// case difference is detected rather than silently absorbed by the OS.
const resolveExact = async (target) => {
  const parts = path.resolve(target).split(path.sep);

  let current = parts[0] + path.sep;

  for (const part of parts.slice(1)) {
    let entries;

    try {
      entries = await fs.readdir(current);
    } catch {
      return null;
    }

    const exact = entries.find((e) => e === part);

    if (!exact) {
      const insensitive = entries.find(
        (e) => e.toLowerCase() === part.toLowerCase()
      );

      return insensitive ? { mismatch: insensitive, expected: part } : null;
    }

    current = path.join(current, exact);
  }

  return { ok: true };
};

const rel = (p) => path.relative(process.cwd(), p).split(path.sep).join("/");

const files = await listAll(SRC);

const problems = [];

for (const file of files) {
  const source = await fs.readFile(file, "utf8");

  for (const match of source.matchAll(IMPORT_RE)) {
    const spec = match[1];

    const base = path.resolve(path.dirname(file), spec);

    for (const candidate of [base, `${base}.js`, path.join(base, "index.js")]) {
      const result = await resolveExact(candidate);

      if (result?.ok) break;

      if (result?.mismatch) {
        problems.push({
          file: rel(file),
          spec,
          expected: result.expected,
          actual: result.mismatch,
        });
        break;
      }
    }
  }
}

if (!problems.length) {
  console.log("All relative imports match on-disk casing.");
} else {
  console.log(`${problems.length} case-mismatched import(s):\n`);

  for (const p of problems) {
    console.log(`  ${p.file}`);
    console.log(`      imports "${p.spec}"`);
    console.log(`      wants "${p.expected}" but disk has "${p.actual}"`);
  }
}

process.exitCode = problems.length ? 1 : 0;
