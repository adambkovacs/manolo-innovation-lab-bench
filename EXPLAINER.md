# What this is, why it exists, and how it works

## What we built

MANOLO-Bench with TRACE receipts is an evidence engine plus a claim gate. The bench produces measured evidence about an AI workload. The gate evaluates declared claims against that evidence and turns every evaluation into a cryptographically signed, replayable receipt. The result is a portable answer to a deliberately narrow question: does evidence of a declared, accepted origin clear the declared bar, and if not, who paused it and why?

When you buy groceries you get a receipt that says what you bought, for how much, and when. This gives AI promises the same treatment. The promise, the bar it must clear, the number we saw, the verdict, and a signature that breaks if anyone edits the story afterwards. FAQ.md covers the same ground in plain language.

Three layers, all zero-dependency Node:

1. The bench measures. A seeded retrieval benchmark compares exact fp32 search, int8 quantization, and RuVector's HNSW index, and writes latency, memory, and recall to a results artifact.
2. The gate judges. Small JSON claim contracts are evaluated against evidence artifacts. Verdicts are PASS, REVIEW, FAIL, or BLOCK, and each maps to an operational disposition: CONTINUE, PAUSE, or STOP.
3. The receipts remember. Every evaluation is canonicalized, digest-bound to its evidence, Ed25519-signed, chained to the previous receipt, and anchored in an append-only hash-chain ledger. Anyone can replay any verdict from the repo.

## Why

The problem sits in the MANOLO framework's own assessment loop. Deliverable D5.1 (Trustworthy Efficiency-Performance Assessment) builds claim-evidence tables for the project's four industry use cases. In the one claims table published in full (section 7.2.5, Table 7, pages 47 to 49, reproduced there from D6.1 Table 16, built through its socio-technical scenarios), the column titled "Evidence from Case Log" reads "No direct evidence cited" for eight of fifteen claims and "Requires validation study" for six; one cites evidence. The gap belongs to the loop, not to any use case, and it is not an absence of data: run metrics land in MLflow and Thanos, provenance in the D2.1 Data Operations Manager, and a benchmarking engine (KOBE) evaluates performance and energy. No instrument binds a declared claim to the specific run evidence that would support it and keeps the verdict. Two of the table's rows, CLAIM-4 (sub-100 ms latency) and CLAIM-7 (compression maintains accuracy while reducing compute), describe exactly what a benchmark can evidence, so that table is the worked example here.

And across nine public deliverables, nothing binds a declared claim to its evidence in a machine-verifiable, signed form. D2.1's Data Operations Manager records lineage, meaning where artifacts came from. D4.1's Policy Manager raises and logs alerts on policy violations, in its own words without executing remediation, and never handles a claim. D6.1's claims, arguments, and evidence process is qualitative and socio-technical. The signed claim-to-evidence receipt is the missing joint between them, and this repo supplies it under Apache-2.0, using MANOLO's own vocabulary (IPD YAML, AIWorkloadID), as the machine-executable counterpart to the existing process rather than a replacement.

## How it works

A claim names a metric path, a comparator, a threshold, and the evidence origins it accepts: measured, published, upstream, or assumed, defaulting to measured. Evaluation checks the origin before the arithmetic. A value that satisfies its threshold but comes from an unaccepted origin is REVIEW, never PASS, because a quoted number is not a measurement. The naive baseline in src/baseline.js exists to show that exact failure: fed an upstream 82 ms quote against the CLAIM-4 pattern, it prints PASS; the gate returns REVIEW and PAUSE, naming the origin.

Receipts make verdicts durable. Each one binds claim, threshold, measured value, verdict, disposition, and the SHA-256 digests of the evidence files, then signs the canonical form. Edit one digit of an evidence file and verification fails with the mismatched artifact named. Verification also checks who signed (the key fingerprint must be pinned in a committed trusted-signers list) and what was signed (semantic replay recomputes every verdict from the bound files, so a valid signature on a wrong verdict is still INVALID). When claim sets legitimately evolve, older receipts become SUPERSEDED: their signatures still verify, and only the latest receipt per set must match current disk and replay clean, so history stays history and tampering stays INVALID.

Oversight is governed. Only REVIEW verdicts can be overridden, only by a named actor with a reason and a scope, and the override is itself a signed receipt in the chain. Integrity failures are never overridable.

## What it demonstrates today

Receipt-0007 formalizes D5.1's CLAIM-2, the table's one evidenced claim, as a published-evidence receipt (BOAS dataset on OpenNeuro; Esparza-Iaizzo et al. 2024). The placement pair evaluates identical claims against Greece and Sweden zone evidence, transcribed source-linked from Ember 2024 and Eurostat 2025-S2: under a workload-declared 100 g carbon budget, Sweden is CONTINUE and Greece is STOP, and the budget belongs to the workload, not the grid. The cost claim composes measured CPU time with an assumed wattage and an upstream price; it meets its threshold and still gets REVIEW, because arithmetic is not evidence. The adversarial suite runs with predeclared gates: 7/7 verdict fixtures including a hard violation inside a review margin, 3/3 tamper mutations caught, an unauthorised signer rejected with its signature intact, a signed-but-wrong verdict caught by semantic replay, 3/3 canonicalization variants to one digest, verify p95 under 0.25 ms (exact figure lands in results/gate-metrics.json on every run), and zero outbound network attempts with the networking APIs tripwired.

## What it is not

Not a provenance store: D2.1 owns lineage. Not a policy engine: D4.1 owns live alerting. Not an energy meter: no estimated joules presented as measurements, energy enters only as declared-origin claims. Not MANOLO-compatible: no public schema exists to bind against, so everything is MANOLO-shaped and adapter-ready, and says so. Not proof of model safety or clinical efficacy: receipts prove claim-to-evidence binding and integrity, nothing more, and the limitations section in the README scores this project's own gaps as honestly as anyone else's.

## Who it is for and where it goes

For the people who own claims: assessment work like WP5 and use-case owners who can declare thresholds. Point the contract at the Table 7 claims with owner-declared thresholds and the receipts recompute; an afternoon turns the remaining fourteen rows into contracts, with the six that require validation studies reading REVIEW on the record until the studies run; the other use cases' tables work the same way. When live inputs are wanted, Ember and ENTSO-E publish under CC BY 4.0 and slot into the origin field. The hand-over path is in ADOPTION.md.

## Run it in sixty seconds

```
node src/bench.js                                    # measure
node src/baseline.js fixtures/claims-upstream.json   # watch the naive checker fail open
node src/claims.js evaluate                          # gate the claims, emit a signed receipt
node src/claims.js verify                            # replay and verify the whole chain
node src/server.js                                   # API on :8787, dashboard in demo/
```
