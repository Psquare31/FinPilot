// ======================================================
// Deterministic pseudo-random number generation.
//
// Every benchmark dataset must be byte-for-byte reproducible from its seed,
// otherwise a reported measurement cannot be re-derived by a third party.
// Math.random() is unseedable in V8, so we use mulberry32 instead.
// ======================================================

// mulberry32: 32-bit seeded PRNG. Fast, and its period (2^32) far exceeds the
// number of draws any dataset here makes.
export const createRng = (seed) => {
  let a = seed >>> 0;

  return () => {
    a = (a + 0x6d2b79f5) | 0;

    let t = Math.imul(a ^ (a >>> 15), 1 | a);

    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// Integer in [min, max] inclusive.
export const intBetween = (rng, min, max) =>
  Math.floor(rng() * (max - min + 1)) + min;

// Uniform pick from an array.
export const pick = (rng, items) => items[Math.floor(rng() * items.length)];

// Pick from [{ value, weight }] proportionally to weight. Used to give the
// dataset a realistic, documented category/payment distribution rather than a
// uniform one, which would make index selectivity unrealistically flat.
export const weightedPick = (rng, weighted) => {
  const total = weighted.reduce((sum, item) => sum + item.weight, 0);

  let threshold = rng() * total;

  for (const item of weighted) {
    threshold -= item.weight;

    if (threshold <= 0) return item.value;
  }

  return weighted[weighted.length - 1].value;
};

// Deterministic 24-char hex ObjectId string.
//
// mongoose's ObjectId is time+counter+random based, so reusing a seed would
// still produce different _ids across runs. Deriving them from the PRNG keeps
// the entire dataset — keys included — reproducible.
export const objectIdHex = (rng) => {
  let hex = "";

  for (let i = 0; i < 24; i++) {
    hex += Math.floor(rng() * 16).toString(16);
  }

  return hex;
};

// Log-normal-ish amount: most transactions small, a long right tail.
// Real spend distributions are heavily skewed; a uniform amount would make
// $group aggregation look artificially cheap and uniform.
export const skewedAmount = (rng, min, max) => {
  const u = Math.max(rng(), 1e-9);

  const skewed = Math.pow(u, 2.2);

  return Math.round(min + skewed * (max - min));
};
