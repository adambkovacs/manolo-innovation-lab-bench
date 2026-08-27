# Q&A hardening: the nine questions that decide the room

Answer in two sentences, then stop talking. Every answer ends on a fact, not a defense.

1. You signed your own receipt. Why should we trust it?
The signature binds the record; the truth comes from replay: anyone re-runs one command on the repo and gets the same verdicts, and the head hash on the whiteboard anchors when this chain existed. Self-signed is the floor, a consortium key is a config change, and replayability is the point.

2. Is this not just MLflow, model cards, or your own D2.1 again?
D2.1 lineage says where an artifact came from, D4.1 alerts say a rule fired live with no persisted verdict, and model cards describe; none of them bind claim, threshold, measured value, and evidence digest into a signed verdict that survives after the fact. We checked all five public deliverables, and receipt-0007 already holds your CLAIM-2.

3. Your corpus is synthetic. Why do the recall numbers mean anything?
Declared in the limitations, and the claims are about this system's own artifacts, so the contract is corpus-agnostic: swap the evidence file and the receipts recompute. Receipt-0007 evidences a real published claim with no corpus at all.

4. Was this actually built in your two hours?
Our own ledger answers that: the timestamps delineate what predates the session and what was built inside it, and we opened with that disclosure. A provenance tool that hid its own provenance would be dead on arrival.

5. What stops someone overriding a BLOCK?
The code refuses: only REVIEW verdicts are overridable, the receipt's signature must verify first, actor, reason, and scope are mandatory, and the override is itself a signed receipt in the chain. Integrity failures are never overridable, by design.

6. Isn't this just an if statement?
The if statement is our baseline, and we demo it failing open on an upstream quote; the contribution is what surrounds it: origin classification, digest binding, canonical invariance, signed chained receipts, supersession, and replay. The break-it suite says it survives contact: 6/6 verdicts, 3/3 tamper mutations, 3/3 canonical variants, verify p95 under a quarter of a millisecond (current figure in results/gate-metrics.json).

7. Where do your carbon and price numbers come from?
Transcribed, dated, and source-linked: Ember 2024 lifecycle intensity via Our World in Data and Eurostat 2025-S2 non-household prices with band and tax basis stated, and the transcription digest is bound into the receipt. Swap the file for a signed Ember or ENTSO-E feed, both CC BY 4.0, and the receipts recompute; the origin field is already there.

8. Where are your datasets and model evals?
The contribution is the gate, and the gate ships its own eval suite: adversarial tests with predeclared acceptance gates, replayed by public CI on every push from the committed state alone. The benchmark regenerates its seeded corpus deterministically instead of bundling data, and real datasets enter as evidence with declared origins, exactly how BOAS enters receipt-0007.

9. We store every run in MLflow. How can you say our claims lack evidence?
We never say that: the metrics exist, and your own D5.1 table still marks fourteen of fifteen claims "no direct evidence cited" or "requires validation study", because nothing binds a declared claim to the specific run that would support it and persists the verdict. The receipt is that binding, and it points at your stored runs rather than replacing them.

If a tenth question lands that you cannot answer, say: that is a REVIEW, not a PASS, and we would rather receipt it than bluff it.
