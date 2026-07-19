# Diagnosing and Hardening a MERN Financial Analytics Backend: A Correctness and Performance Engineering Study

> **Draft internship report — content only.** Formatting (Times New Roman, 1.5
> spacing, A4/2.54 cm margins, title case per the BIT template) is applied when
> this is moved into Word. Cover page, certificates and declaration are filled
> from the template separately.
>
> **Scope and authorship note (read first).** FinPilot is a collaborative
> repository. This report covers *this author's individual contribution*: a
> correctness, testing and performance-engineering study carried out over an
> existing MERN backend. The base application (models, service/module layers,
> infrastructure) was authored by a collaborator; that is stated wherever this
> report builds on it, and the full split is recorded in `docs/PROVENANCE.md`.
> Every result below is produced by code in `server/` and is reproducible from a
> seed.

---

## Abstract

Financial software is judged first on whether its numbers are correct and
second on whether it stays correct as data grows. This work is a systematic
diagnosis and hardening of the backend of FinPilot, a personal-finance and
investment analytics platform built on the MERN stack (MongoDB, Express, React,
Node.js). The starting point was an application that appeared complete — 15
feature modules, background jobs, container tooling — but had never been
exercised end to end. Through methodical verification against a running
database, the study established that the application could not start; that once
started, every analytics figure it produced was zero or NaN; and that three
feature modules had been written against database schemas that did not exist.
Each defect was reproduced, fixed, and locked behind a regression test proven
to fail against the original bug. A test suite that had never run was made to
run and given assertions of real values; continuous integration was rebuilt to
execute against real MongoDB and Redis. A deterministic benchmark harness was
then built to quantify three database design decisions on datasets up to one
million records: database-side aggregation versus application-side computation
(up to 43× at 100,000 records), index coverage of a sorted query (constant
versus linear document examination), and offset versus cursor pagination (34×
at depth). Each experiment carries a self-validating check that caught an
earlier, incorrect version of the same measurement. The central finding is
methodological: in an analytics system, a benchmark without a correctness gate
rewards broken code, and an application that passes a test suite may still be
entirely non-functional if the tests assert nothing.

---

## Chapter 1 — Introduction

### 1.1 Overview

FinPilot is a multi-tenant personal-finance platform. A user belongs to one or
more *workspaces*; each workspace owns accounts, categories, transactions,
budgets, goals, debts, and investments. The backend is a Node.js/Express API
over MongoDB (via Mongoose), with Redis-backed caching and rate limiting,
scheduled background jobs, and a layered module architecture. The product's
purpose is analytical: it aggregates a user's financial activity into
dashboards, budget progress, spending breakdowns, net-worth and cash-flow
reports.

This report does not describe building that application from nothing. It
describes taking an existing, collaboratively-authored codebase that *looked*
finished and establishing — empirically — what actually worked, fixing what did
not, and then measuring the performance characteristics of its core data
access patterns.

### 1.2 Motivation

The motivation is a gap that recurs in AI-assisted and rapidly-built software:
the difference between code that *reads* as correct and code that *is* correct.
A service that calls `Transaction.aggregate([...])` with a plausible pipeline
looks right in review. Whether it returns the right number can only be
discovered by running it against real data and comparing to an independently
computed truth. This project is a sustained application of that principle to a
real codebase, and a demonstration of how much a veneer of completeness can
hide.

### 1.3 Objectives

1. Establish, by verification rather than inspection, the true working state of
   the FinPilot backend.
2. Fix every correctness defect found, and lock each behind a regression test
   proven to fail against the original bug.
3. Make the dormant test suite executable and meaningful; rebuild CI to run
   against real backing services.
4. Quantify three core database design decisions with a reproducible benchmark
   harness at realistic scale.
5. Record authorship and AI-assistance honestly (`docs/PROVENANCE.md`).

### 1.4 Contribution summary

- **17 distinct correctness defects** identified and fixed, spanning ORM
  compatibility, aggregation correctness, three schema-mismatched modules,
  index configuration, and total application-boot failure.
- **A test suite taken from 0 to 33 executing assertions** across 14 suites,
  each regression test mutation-verified.
- **A deterministic benchmark harness** and three experiments (E2–E4)
  producing the results in Chapter 4.
- **Three self-validating experiment designs**, each of which caught a wrong
  first version of its own measurement.

### 1.5 Report organisation

Chapter 2 reviews the relevant background (document-database aggregation, index
theory, pagination at scale, ORM lifecycle semantics). Chapter 3 describes the
methodology: the verification discipline, the deterministic dataset generator,
and the benchmark harness. Chapter 4 presents and discusses the results.
Chapter 5 concludes and identifies future work.

---

## Chapter 2 — Background and Literature Review

### 2.1 Document databases and server-side aggregation

MongoDB offers two ways to compute a summary over a collection: pull matching
documents to the application and reduce them in code, or express the
computation as an aggregation pipeline (`$match`, `$group`, …) executed by the
database engine. The trade-off is classic client-server computation placement:
application-side reduction ships every document over the wire and pays
serialization and language-runtime overhead, while server-side aggregation
executes next to the data and returns only the result. The magnitude of the
difference is data- and query-dependent; Chapter 4 measures it for this
application's dashboard summary.

### 2.2 Indexes, selectivity, and covered sorts

A B-tree index lets the database seek to matching keys instead of scanning the
collection. Two properties matter for this study. First, *selectivity*: the
ratio of documents examined to documents returned; the ideal is 1.0, and a
value that grows with collection size signals a query that will degrade.
Second, *sort coverage*: a compound index whose key order matches a query's
sort can supply results already ordered, letting a `limit` stop early; an index
that covers only the filter forces the database to fetch all matches and sort
them in a blocking stage. `explain("executionStats")` exposes both via
`totalDocsExamined` and the presence of a `SORT` stage.

### 2.3 Pagination at scale: offset versus keyset

Offset pagination (`skip(n).limit(k)`) is ubiquitous and, at depth, quadratic
in aggregate: serving page *p* requires the database to traverse and discard
*(p−1)·k* documents. Keyset (cursor) pagination instead encodes the position of
the last row seen and asks for rows *after* it, which an appropriate index can
seek to directly, making per-page cost independent of depth. The correctness
subtlety — and a result of this study — is that the cursor key must be a *total
order*; a non-unique sort key silently drops or repeats rows across page
boundaries, and adding a tiebreaker that the index does not cover reintroduces
the blocking sort that keyset pagination exists to avoid.

### 2.4 ORM document lifecycle and middleware

Mongoose interposes *middleware* (hooks) around document operations such as
`validate` and `save`. Historically these used a callback style,
`function(next) { … next(); }`. Mongoose 9 removed that style for document
middleware: hooks are now async functions that signal completion by returning
and failure by throwing. A hook written in the old style receives no `next`
argument, so calling it throws — and because `save` runs its hooks, the effect
is that the document cannot be persisted at all. This is the single change
behind the most severe defect in Chapter 4.

### 2.5 The verification gap in AI-assisted development

A recurring theme in recent practice is that code generated quickly — by a
person under time pressure or by an AI assistant — tends to be *locally
plausible*: each function reads as a reasonable solution to its apparent task.
Errors concentrate not in syntax but in silent semantic mismatches: a field
name that does not exist, a type that is never cast, a hook signature one major
version out of date. Such errors survive code review, which reads for
plausibility, and are exposed only by execution against real data. This study
is, in effect, a case study in that gap.

---

## Chapter 3 — Methodology

### 3.1 Verification-first discipline

The governing rule of this work was that no claim about behaviour was accepted
without observing it against a running database. This applied symmetrically to
the application's code and to the author's own tools. Two examples set the
standard. First, the application's dashboard was proven to return zero not by
reading the pipeline but by running it against a 100,000-transaction dataset
and comparing to an independently computed ground truth (₹50.5 crore income
where the service reported 0). Second, the benchmark seeder was caught
reporting "1,000 transactions seeded" into an *empty* collection — Mongoose's
`insertMany` with `ordered: false` had swallowed every validation error — and
was only trusted after it verified its own inserts with a follow-up count.

### 3.2 Reproducible dataset generation

Chapter 4's results require data that any examiner can regenerate identically.
The generator (`server/bench/lib/`) is deterministic:

- all randomness derives from a single seeded PRNG (mulberry32);
- document `_id`s are derived from that PRNG, not from MongoDB's clock-based
  `ObjectId`, so keys reproduce too;
- dates derive from a fixed reference epoch, never `Date.now()`.

Determinism is verified, not assumed: re-running a seed and comparing an MD5
over all sorted `_id`s yields an identical hash. Distributions are documented
and realistic (income/expense ratio, skewed amounts, bounded merchant
cardinality) because uniform data would flatten index selectivity and
understate the effects measured. At 100,000 transactions the dataset is ~85 MB
of documents (852 B/document average) with ~6.25 MB of indexes.

*Table 3.1 — dataset scales used.*

| Transactions | Purpose |
|---|---|
| 1,000 | smoke / small-N behaviour |
| 10,000 | mid-scale trend |
| 100,000 | headline figures |
| 1,000,000 | generator stress (seeded at ~5,750 docs/s) |

### 3.3 Benchmark harness

Timings are summarised as p50/p95/p99 over 20 iterations after 3 warmup runs
(warmup matters: the first calls pay for connection setup, WiredTiger cache
population, and JIT). Latency distributions are reported by percentile rather
than mean, because the tail is what degrades user experience. All benchmarks
run against a dedicated local MongoDB — never the shared cluster the
application uses — because network variance on a remote database would exceed
the effects being measured; this is stated as an explicit limitation (absolute
latencies are lower than production; the *relative* comparisons are the
finding).

### 3.4 Self-validating experiments

The defining methodological choice of Chapter 4 is that **each experiment
validates its own premise before trusting a number**, because each of the three
had a first version that measured the wrong thing convincingly:

- **E2** gates on correctness: every strategy must match independently computed
  ground truth before it is timed. Without this gate the original broken
  pipeline would have *won* the benchmark — it was fast because it summed a
  field that did not exist and returned zero.
- **E3** asserts the query planner chose the execution stage the variant claims
  (`IXSCAN` vs `COLLSCAN`); a first version dropped one index, and MongoDB
  silently fell back to another, so it compared two indexes while claiming to
  compare index against no-index.
- **E4** asserts no plan contains a blocking `SORT`; a first version's cursor
  key was not covered by any index, so both paginators paid a full sort and the
  cursor appeared *slower* than offset.

### 3.5 Testing and continuous integration

The regression suite uses real MongoDB and (via a REST-protocol proxy) real
Redis, because the defects under guard — aggregation casting, index conflicts,
a rate limiter that fails closed on a Redis error — do not reproduce against
mocks. Each regression test is **mutation-verified**: the fix is reverted, the
test is confirmed to fail with the bug's signature, and the fix is reinstated.
A test that does not fail against the defect is not evidence that the defect is
fixed. CI additionally runs static import-graph checks (unresolved imports;
case-mismatched imports that a case-insensitive developer filesystem hides but
Linux CI does not).

---

## Chapter 4 — Results and Discussion

### 4.1 State of the application as found

Verification established the following, none of which is visible by inspection:

*Table 4.1 — defect classes found and fixed.*

| # | Defect | Effect | Locked by |
|---|---|---|---|
| 1 | 7 models used Mongoose-8 callback middleware | No document could be saved | `models.test.js` |
| 2 | 12 aggregation pipelines summed `$amount` (field is `money.amount`) and matched a string workspace id | Every analytics total was 0 | `dashboard.test.js`, `transaction.test.js` |
| 3 | `investment.service` written against a non-existent schema | NaN arithmetic; oversell guard never fired | `investment.test.js` |
| 4 | `budget.service` read `budget.amount` (undefined) | NaN remaining; alerts fired with NaN every run | `budget.test.js` |
| 5 | `debt.service` read `totalAmount`/`paidAmount` (non-existent) | A debt could never be closed | `debt.test.js` |
| 6 | Duplicate `expiresAt` index declarations | TTL indexes never built; expired tokens/notifications never reaped | `indexes.test.js` |
| 7 | Post-refactor: deleted constant, wrong Clerk API, unresolved import paths | All 15 modules failed to load; server could not boot | `broken-imports.mjs` |

Defect 2 is illustrative. On the 100,000-transaction dataset, ground truth for
one workspace is ₹50,53,08,347 income and ₹33,80,47,607 expense; the shipped
dashboard returned an empty pipeline result, i.e. zero, for both — for two
independent reasons stacked (wrong field path *and* uncast string id). A test
asserting only "responds 200" would have passed against this.

### 4.2 E2 — server-side aggregation vs application-side computation

The dashboard's transaction summary was benchmarked three ways on the same
question (income/expense totals for a workspace): (A) `$group` in MongoDB; (B)
`find().lean()` then reduce in Node over full documents — the pattern the
dashboard uses elsewhere; (C) the same but projecting only the two needed
fields.

*Table 4.2 — E2, p50 latency (ms) by strategy and scale.*

| Transactions | A: `$group` | B: full-doc reduce | C: projected reduce | B ÷ A |
|---|---|---|---|---|
| 1,000 | 2.79 | 20.08 | 5.59 | 7.2× |
| 10,000 | 5.60 | 155.24 | 22.80 | 27.7× |
| 100,000 | 38.97 | 1,704.65 | 196.88 | 43.7× |

The gap widens with scale — the cost grows with a user's history rather than
staying fixed. At 100,000 records the pattern the application actually used
(B) takes 1.7 seconds where `$group` takes 39 ms. Strategy C isolates the
cause: projecting only the needed fields recovers most of the loss (1,705 → 197
ms), so the dominant cost is shipping whole 852-byte documents to sum two
fields — but C is still 5× slower than letting the database do the work.
**Discussion:** the correctness gate is essential here. The original
`$sum:"$amount"` pipeline was the fastest option in early runs precisely
because it summed nothing; only gating each strategy on matching ground truth
prevents the benchmark from rewarding the broken implementation.

### 4.3 E3 — index coverage of the transaction-list query

The query is the transaction list's:
`find({workspace, isDeleted:false}).sort({transactionDate:-1}).limit(20)`.
Three levels of index support were measured via `explain`.

*Table 4.3 — E3 at 100,000 transactions.*

| Variant | Stage | Docs examined | Sort | p50 (ms) |
|---|---|---|---|---|
| Compound `{workspace, transactionDate}` | IXSCAN | **20** | index | 2.08 |
| Filter-only index | IXSCAN | 32,659 | in-memory | 26.23 (12.6×) |
| No usable index | COLLSCAN | 100,000 | in-memory | 42.51 (20.5×) |

The compound index examines **exactly 20 documents at every scale** because it
supplies the sort order and the limit stops after 20 keys; the other two
examine every matching document, growing linearly. The documents-examined ratio
of compound to filter-only is 16× at 1k, 163× at 10k, and 1,633× at 100k — the
selectivity gap widens with data. **Discussion:** wall-clock alone understates
this, because at these sizes the collection fits in RAM and even a scan looks
survivable; `docsExamined` is the work a production-sized, disk-resident
collection would actually pay. The plan-stage assertion is what makes the
"no index" row trustworthy: an earlier version reported IXSCAN there because
the planner had silently fallen back to a different index.

### 4.4 E4 — offset vs cursor pagination by depth

At 100,000 transactions (32,659 in the workspace, 1,633 pages of 20):

*Table 4.4 — E4, offset vs cursor by page.*

| Page | Offset docs examined | Offset p50 (ms) | Cursor docs examined | Cursor p50 (ms) | Offset ÷ Cursor |
|---|---|---|---|---|---|
| 1 | 20 | 2.28 | 20 | 1.41 | 1.6× |
| 100 | 2,040 | 5.09 | 20 | 2.61 | 2.0× |
| 500 | 10,216 | 14.99 | 20 | 1.58 | 9.5× |
| 1,000 | 20,421 | 29.88 | 21 | 1.72 | 17.4× |
| 1,600 | 32,659 | 41.92 | 21 | 1.24 | **33.9×** |

Offset degrades linearly with depth (18× from first page to last); cursor is
flat, examining ~20 documents wherever it lands. **Discussion — two costs the
naive reading misses.** First, a correct cursor needs a total order:
`transactionDate` alone is not unique, so the cursor key is
`(transactionDate, _id)` — but the shipped compound index does not cover that
sort, and adding the tiebreaker without extending the index reintroduces a
blocking sort of all 32,659 matches (the failure the E4 self-check now catches).
Making the cursor correct therefore *costs an index*; that is part of the
trade-off, not a footnote. Second, the repository issues a `count()` alongside
every page — ~3.7 ms of work proportional to the whole matched set, paid on
page 1 as much as page 1,600, and unaffected by either pagination strategy.

### 4.5 Testing outcome

*Table 4.5 — test suite before and after.*

| Metric | Before | After |
|---|---|---|
| Suites that execute | 0 (misconfigured; never ran) | 14 |
| Assertions of real values | 0 (10 files were `expect(true).toBe(true)`) | 33 |
| Regression tests mutation-verified | — | all |
| CI backing services | none | MongoDB + Redis |

Every fix in Table 4.1 is covered by a test confirmed to fail against the
original defect. Two defects (`AiInteraction` filename casing; two further
duplicate indexes) were found *by* the new tests and static checks rather than
by inspection — evidence that the safety net functions.

---

## Chapter 5 — Conclusion and Future Work

### 5.1 Conclusion

This work converted a MERN financial backend that could not start, and whose
analytics returned only zeros and NaNs, into a booting application with a
correct analytics layer, a real regression suite, and quantified performance
characteristics for its core data-access patterns. Seventeen defects were fixed
and locked behind mutation-verified tests. Three database design decisions were
measured on reproducible datasets up to 100,000 records, showing a 43×
penalty for application-side aggregation, a linear-versus-constant divide in
index selectivity, and a 34× pagination penalty at depth.

The central lesson is methodological and transfers beyond this codebase. In an
analytics system, *correctness must gate performance*: a benchmark that does
not first verify each variant returns the right answer will reward the
implementation that computes nothing, because computing nothing is fast. And a
test suite is only evidence in proportion to what it asserts: ten green files
asserting `true === true` reported the same success as a working suite while the
application beneath them was entirely non-functional. The discipline that
exposed all of this was singular — observe behaviour against a running system,
and trust no output, including one's own, until it is verified.

### 5.2 Future work

- **Extend correctness coverage** to the remaining modules (notifications,
  reports, subscriptions) with the same value-asserting, mutation-verified
  approach.
- **Apply E3/E4 findings to the application**: add the `_id` tiebreaker to the
  transaction index and migrate the repository from offset to cursor
  pagination; make the per-page `count()` optional.
- **Remove dead code**: static reachability analysis (`bench/reachability.mjs`)
  identifies ~180 orphaned files left by the architecture refactor; deletion is
  pending the base author's review.
- **A performance regression budget in CI**: run the benchmark harness at a
  fixed small scale and fail the build if p50 regresses beyond a threshold.
- **Frontend**: the client remains a starter; a dashboard consuming the
  now-correct analytics endpoints is the natural next deliverable.

---

## References

*(To be formatted per the BIT citation style; representative sources for the
background chapter.)*

1. MongoDB, Inc. *Aggregation Pipeline* and *Analyze Query Performance
   (`explain`)*, MongoDB Manual v8.0.
2. MongoDB, Inc. *Indexes* and *Compound Index Sort Order*, MongoDB Manual v8.0.
3. Automattic. *Mongoose Documentation — Middleware*, v9.x (document middleware
   signature change).
4. M. Winand. *SQL Performance Explained* — chapters on index selectivity and
   keyset ("seek") pagination. (Principles apply directly to indexed document
   stores.)
5. E. Brewer et al. Background on client–server computation placement and the
   cost of moving data to computation versus computation to data.
