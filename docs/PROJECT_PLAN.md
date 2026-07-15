# FinPilot — Summer Internship Project Plan

Target: BIT Mesra B.Tech Summer Internship report (max 5 chapters, 30-page body) + 12–15 slide presentation.
Window: 2 weeks. Metrics scope: backend performance engineering. Frontend: full.

---

## 1. Guiding principle

Every number that appears in Chapter 4 must come from a benchmark that can be re-run live in front of
the panel. Nothing is estimated, recalled, or illustrative. If an experiment does not run, its table
does not go in the report.

---

## 2. Current state (audited 2026-07-15)

| Area | Reality |
|---|---|
| Backend | ~17.5k LOC, 22 models, 23 services, 18 route groups, RBAC, Redis, cron, Swagger, Docker |
| Frontend | Untouched Vite starter (`client/src/App.jsx` is 102 lines of boilerplate) |
| AI features | None wired. `ai.service.js` is a CRUD log; `constants/ai.js` lists unimplemented features |
| Tests | 10 of 11 files are `expect(true).toBe(true)`. Only `health.test.js` asserts anything |
| CI | `.github/workflows/backend.yml` runs `npm test` at root; root has no `test` script |
| Measurements | None exist anywhere in the repo |

Consequence: the report's results chapter has zero source material today. Workstream A exists to create it.

---

## 3. Workstreams

Ordered by risk to the deliverable. A and E are the critical path; C is cut first if time runs short.

### A. Measurement infrastructure — CRITICAL PATH, do first

**A1. Parametrised dataset generator.**
Current `transaction.seed.js` makes 100 txns/account — far too small to show any curve.
Build a seeder taking `--transactions=N` for N ∈ {1k, 10k, 100k, 1M}, with a documented and
deterministic (fixed-seed) distribution: category mix, income/expense ratio, date spread, merchant
cardinality, workspace count. This document doubles as the report's **dataset description**, which
the marking scheme explicitly weights.

**A2. Benchmark harness.**
`server/bench/` — autocannon for HTTP latency/throughput, `explain("executionStats")` capture for
query-level counters. Every run emits JSON to `bench/results/`, converted to CSV → figures.
Committed results files are the evidence trail for the viva.

**A3. The experiments.** Each yields one table, one figure, and a trade-off discussion.

| ID | Experiment | Metrics | Why it's honest |
|---|---|---|---|
| E1 | Redis cache hit vs miss on `/dashboard` | p50/p95/p99 latency, req/s | Cache layer already exists in `cache.service.js` |
| E2 | Mongo `$group` vs app-level JS summation | latency vs N (1k→1M), server RSS | **Both patterns already exist in `dashboard.service.js`** |
| E3 | Index vs no-index on workspace+date txn query | `docsExamined`, `nReturned`, ms | Indexes already declared across models |
| E4 | Offset `skip/limit` vs cursor pagination | latency at page 1 → page 5000 | `pagination.js` util exists; classic degradation curve |
| E5 | Compression on/off (optional) | payload bytes, TTFB | `compression` already a dependency |

E2 is the centrepiece: it is a real design inconsistency in your own code, discovered by audit, and
the fix is measurable. That is exactly the "bottleneck analysis" the panel wants to see.

### B. Test suite + CI repair
Replace the 10 stub files with real supertest coverage on the modules under benchmark. Report
coverage before → after as a metric. Fix the root `npm test` script so CI stops passing vacuously.

### C. Frontend — scope ladder, cut from the bottom
| Tier | Scope |
|---|---|
| Must | Auth flow, app shell, API client, error/loading states |
| Must | Dashboard with charts (spend by category, cash flow, budget progress) |
| Should | Transactions list — CRUD + paginated (doubles as the live demo for E4) |
| Could | Budgets + goals views |
| Won't (unless time) | Investments, reports, workspace admin UI |

Hard rule: if Tier 3 is not done by day 9, freeze the frontend and finish the report.

### D. AI / self-authorship separation

**What is not possible:** a retroactive line-by-line split. Your history is large AI-shaped commits
(`48c7b1c` alone is +8,596 lines). Any per-line attribution invented now would be a fabrication, and
it is the first thing a panel probes. The report will state the provenance methodology plainly.

**What is honest and defensible:**

1. `docs/PROVENANCE.md` — a module × authorship-class matrix:
   `AI-scaffolded` (generated, reviewed, kept) / `AI-scaffolded + human-redesigned` (generated then
   materially changed by you, with the reason) / `human-authored` (written by you).
2. **Going forward, provenance becomes auditable.** AI-assisted commits carry a
   `Co-Authored-By: Claude` trailer; your own work does not. From today, git itself is the evidence.
3. The work ahead — benchmark design, the E2 discovery, index strategy, trade-off calls, the test
   suite — is genuinely yours, and it is what the marking scheme actually rewards. That is the
   contribution the report should foreground.
4. Deck slide + report appendix on AI-assisted development methodology: what AI was good for
   (scaffolding, boilerplate, breadth), what it got wrong (the E2 inconsistency, vacuous CI, stub
   tests presented as a test suite), and what only judgment could resolve.

Framing for the report and viva: *AI generated the surface area; engineering judgment is what made it
correct.* This is true, it survives cross-examination, and it is a stronger story than pretending you
hand-wrote 17.5k lines in eleven days.

### E. Report + deck

**Chapter map** (5 max, 30-page body):

| Ch | Title | Content |
|---|---|---|
| 1 | Introduction | Problem, objectives, scope, contribution statement |
| 2 | Literature Review | Multi-tenant SaaS data models, MongoDB aggregation & index theory, caching strategies, RBAC, pagination at scale. ~15–20 topic-specific references |
| 3 | Methodology | Architecture, data model, RBAC design, caching design, job scheduling, **dataset generation (A1)**, **benchmark methodology (A2)** |
| 4 | Results & Discussion | E1–E5: tables, figures, bottleneck analysis, trade-offs |
| 5 | Conclusion & Future Scope | Incl. AI-assisted development reflection |

**Deck (15 slides):** title / motivation / objectives / background / architecture (graphical) /
data model / methodology / tools / E1–E2 results / E3–E4 results / bottleneck analysis /
AI-assisted development methodology / conclusion + future work / references.
Bullets only, no paragraphs. Figures from A2's real output.

**Format compliance:** A4, 2.54 cm margins, Times New Roman, 1.5 spacing, justified body, 12 pt body /
18 pt bold-italic chapter titles / 16 pt section, each chapter starts on a new page, numbered
equations, plagiarism report attached (iThenticate).

---

## 4. Timeline

| Days | Work |
|---|---|
| 1–2 | A1 seeder + A2 harness. Chapter 3 methodology drafted alongside |
| 3–4 | Run E1–E4, capture results, generate figures. **Chapter 4 has real data by day 4** |
| 5–6 | B: test suite + CI fix. Chapter 2 literature review |
| 7–9 | C: frontend tiers 1–3. Freeze at day 9 regardless of state |
| 10–11 | Chapters 1 & 5, assemble full report, format pass |
| 12–13 | Deck, plagiarism check, dry-run of live benchmark demo |
| 14 | Buffer |

Rationale: benchmarks land before the frontend so the report is never hostage to UI work.

---

## 5. Open items needing your input

- Cover page: branch name, roll number, guide name + designation, organisation/company.
- `package.json` lists author "Mayank Nishant" — check whether that is correct before submission.
- Confirm the report is submitted as an individual project.
