// Reports every unresolvable relative import under src/.
//
// The layered-architecture refactor copied files to new depths without
// updating their relative specifiers, so a number of imports point at paths
// that do not exist (e.g. shared/services/cache.service.js importing
// ../config/redis/connectRedis.js, which resolves to src/shared/config/...).
// Each one throws only when its module is first loaded, so they surface one at
// a time. This finds them all at once.

import fs from "node:fs/promises";
import path from "node:path";

const SRC = path.resolve(process.cwd(), "src");

const IMPORT_RE =
  /(?:^|\n)\s*(?:import[\s\S]*?from\s*|import\s*|export[\s\S]*?from\s*)["'](\.[^"']+)["']/g;

const exists = async (p) => {
  try {
    const s = await fs.stat(p);
    return s.isFile();
  } catch {
    return false;
  }
};

const listAll = async (dir) => {
  const out = [];

  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) out.push(...(await listAll(full)));
    else if (/\.m?js$/.test(entry.name)) out.push(full);
  }

  return out;
};

const rel = (p) => path.relative(process.cwd(), p).split(path.sep).join("/");

const files = await listAll(SRC);

const broken = [];

for (const file of files) {
  const source = await fs.readFile(file, "utf8");

  for (const match of source.matchAll(IMPORT_RE)) {
    const spec = match[1];

    const base = path.resolve(path.dirname(file), spec);

    const candidates = [base, `${base}.js`, path.join(base, "index.js")];

    let ok = false;

    for (const c of candidates) {
      if (await exists(c)) {
        ok = true;
        break;
      }
    }

    if (!ok) broken.push({ file: rel(file), spec });
  }
}

if (!broken.length) {
  console.log("No broken relative imports under src/.");
} else {
  console.log(`${broken.length} broken relative import(s):\n`);

  for (const b of broken) {
    console.log(`  ${b.file}`);
    console.log(`      -> ${b.spec}`);
  }
}

process.exitCode = broken.length ? 1 : 0;
