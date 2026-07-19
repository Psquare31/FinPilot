# FinPilot — Authorship and Provenance

This document records, honestly, who wrote what and how. It exists so the
project can be represented truthfully in the internship report and defended in
a viva, where the git history is public and takes seconds to inspect
(`git shortlog -sn`, `git log --author=...`).

Two questions are separated deliberately, because they are different:

1. **Which human wrote which part** — FinPilot is a two-person repository.
2. **Where AI assistance was used** — within one contributor's work.

Read (1) first. It is the one that governs how the report may be framed.

---

## 1. Human authorship — this is a two-person project

The repository has two substantive contributors. Measured over `server/src`
across the whole history:

| Contributor | Insertions in `server/src` | Share |
|---|---|---|
| mayank-nishant | ~29,650 | ~89% |
| Pranav Prajyot (Psquare / this author) | ~3,500 | ~11% |

`git shortlog -sn` — commit counts:

```
19  Psquare              (this author)
15  mayank-nishant
 2  Pranav Prajyot       (merge commits, this author)
```

Commit count is not proportional to authorship. Many of this author's 19
commits are the small, surgical fixes and the benchmark/test work described in
sections 2–3; several of mayank-nishant's 15 commits each introduce thousands
of lines of new application code.

### What each person authored

**mayank-nishant** wrote the great majority of the application:

- the entire `server/src/modules/` layered architecture (15 modules ×
  controller / service / repository / mapper / validation / routes)
- the original `server/src/{services,controllers,routes,validators}` trees
- the Mongoose models, background jobs, Docker setup, and the layered refactor

**Pranav Prajyot (this author)** wrote:

- *Before this work* (6–10 July): the validation layer for several modules and
  the app/server bootstrap; a backend-restore pass fixing auth, imports and
  some Mongoose 9 compatibility. ~1,900 lines across two commits.
- *This work* (15–17 July): everything in sections 2 and 3 below — the
  correctness fixes, the test suite, the benchmark harness, and the experiments.

### Consequence for the report

The BIT Mesra internship report is an **individual** submission, and its
declaration certificate certifies that the work "is original and has been done
by myself." The FinPilot repository as a whole does not satisfy that for a
single author. Two honest options:

- **Scope the report to this author's own contribution** — the diagnostic,
  correctness, testing and performance-engineering work of 15–17 July, over a
  pre-existing collaborative codebase whose authorship is stated plainly. This
  is the recommended framing: it is defensible line-by-line, and it is the
  contribution the marking scheme actually rewards (bottleneck analysis,
  results, methodology).
- **Present it as a team project** if the guide permits one, naming both
  contributors.

What the report must not do is present the full ~30k-line codebase as the
individual work of one author. A panel will check.

---

## 2. This author's contribution (15–17 July)

All defensible as individual work. None of it invents new product surface; it
makes the existing application correct, tested, and measured — which is the
work the git history and the commit messages document in full.

### Correctness fixes

| Area | Defect found | Evidence |
|---|---|---|
| Mongoose 9 middleware | 7 models used callback-style hooks (`function(next)`); Mongoose 9 never passes `next`, so no document could be saved | `models.test.js` |
| Analytics aggregation | 12 pipelines summed `$amount` (no such field; it is `money.amount`) and `$match`ed a string workspace id against an ObjectId, so every total was 0 | `dashboard.test.js`, `transaction.test.js` |
| Investments | service written against a non-existent schema (`totalUnits`/`averagePrice`); oversell guard compared `undefined < n`, always false | `investment.test.js` |
| Budgets | read `budget.amount` (undefined) → NaN remaining, percentage pinned at 0, alerts fired with NaN every run | `budget.test.js` |
| Debts | read `totalAmount`/`paidAmount` (non-existent) → a debt could never be closed | `debt.test.js` |
| TTL indexes | duplicate `expiresAt` declarations meant the TTL index was never built; expired notifications and refresh tokens never reaped | `indexes.test.js` |
| Application boot | after the refactor merge, all 15 modules failed to load — deleted constant, wrong Clerk API, unresolved paths, plural seed names | `broken-imports.mjs`, boot check |

### Test and CI infrastructure

- Made the Jest suite runnable (it had never executed: misconfigured setup path)
  and replaced 10 always-passing stubs with value-asserting tests.
- Every regression test verified by mutation: reintroducing the bug fails the
  test. A test that does not fail against the defect is not evidence.
- CI rebuilt to run against real MongoDB and Redis; added `check:imports`
  (unresolved + case-mismatched imports) after three CI failures traced to a
  local environment more forgiving than Linux CI.

### Benchmark harness and experiments (`server/bench/`)

Fully this author's work. Deterministic dataset generator (seeded PRNG, fixed
epoch, reproducible `_id`s), statistics helpers, and three experiments:

- **E2** — database `$group` vs application-side summation (up to 43× at 100k)
- **E3** — index coverage: compound vs filter-only vs none (docs examined)
- **E4** — offset vs cursor pagination by depth (34× at page 1,600)

Each experiment carries a self-check that failed a first, wrong version of it:
E2 a correctness gate (the broken pipeline would have "won" by summing
nothing), E3 a plan assertion (dropping one index silently fell back to
another), E4 a blocking-sort assertion (the tiebreaker was not index-served).
This is the methodological core of the results chapter.

---

## 3. Where AI assistance was used

The 15–17 July work was carried out with an AI coding assistant. The division
of labour was:

**AI produced:** the mechanical edits once a decision was made (applying a fix
across N call sites), first drafts of the benchmark and test scaffolding, and
the search/diagnosis legwork.

**This author directed and owns the judgment:** which findings were real vs
noise; the trade-off decisions (fail-closed vs fail-open rate limiting; rewrite
service to schema vs schema to service; scope of deletion); catching the
benchmarks that measured the wrong thing; and the decision to verify every
claim against a running database rather than trust output. The commit messages
record this reasoning throughout.

**Honest limitation.** A line-by-line "AI vs human" split of this work cannot be
reconstructed after the fact, and this document does not fabricate one. The
defensible claim is the one above: AI accelerated the typing and the search;
the engineering judgment that made the result correct is the author's. That
judgment — not the line count — is what the work should be assessed on.

**Going forward**, if strict attribution is wanted, AI-assisted commits should
carry a `Co-Authored-By` trailer so that git records provenance automatically.
(This was deliberately omitted here at the repository owner's request; the
consequence is that this document, not the trailer, is the record.)
