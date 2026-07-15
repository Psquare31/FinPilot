// ======================================================
// Summary statistics for timing samples.
//
// Latency distributions are right-skewed, so a mean alone hides the tail that
// actually degrades user experience. Every reported measurement carries
// percentiles and spread, never a single number.
// ======================================================

export const percentile = (sorted, p) => {
  if (!sorted.length) return NaN;

  // Nearest-rank on the already-sorted sample.
  const rank = Math.ceil((p / 100) * sorted.length);

  return sorted[Math.min(Math.max(rank - 1, 0), sorted.length - 1)];
};

export const summarise = (samples) => {
  const sorted = [...samples].sort((a, b) => a - b);

  const n = sorted.length;

  const mean = sorted.reduce((sum, v) => sum + v, 0) / n;

  const variance =
    sorted.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (n > 1 ? n - 1 : 1);

  const round = (v) => Number(v.toFixed(3));

  return {
    samples: n,
    meanMs: round(mean),
    stdDevMs: round(Math.sqrt(variance)),
    minMs: round(sorted[0]),
    p50Ms: round(percentile(sorted, 50)),
    p95Ms: round(percentile(sorted, 95)),
    p99Ms: round(percentile(sorted, 99)),
    maxMs: round(sorted[n - 1]),
  };
};

// High-resolution timing of a single async call.
export const timeAsync = async (fn) => {
  const startedAt = process.hrtime.bigint();

  const value = await fn();

  const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1e6;

  return { elapsedMs, value };
};

// Run fn `warmup + iterations` times, discarding warmup samples.
//
// Warmup matters: the first calls pay for connection setup, WiredTiger cache
// population and V8 JIT, none of which represent steady-state cost.
export const measure = async (fn, { warmup = 3, iterations = 20 } = {}) => {
  for (let i = 0; i < warmup; i++) await fn();

  const samples = [];

  let last;

  for (let i = 0; i < iterations; i++) {
    const { elapsedMs, value } = await timeAsync(fn);

    samples.push(elapsedMs);

    last = value;
  }

  return { stats: summarise(samples), samples, lastValue: last };
};
