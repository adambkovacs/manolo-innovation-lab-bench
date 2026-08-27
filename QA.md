# Q&A hardening: the seven questions that decide the room

Answer in two sentences, then stop talking. Every answer ends on a fact, not a defense.

1. You signed your own receipt. Why should we trust it?
The signature binds the record; the truth comes from replay: anyone re-runs one command on the repo and gets the same verdicts, and the head hash on the whiteboard anchors when this chain existed. Self-signed is the floor, a consortium key is a config change, and replayability is the point.

2. Is this not just MLflow, model cards, or your own D2.1 again?
D2.1 lineage says where an artifact came from, D4.1 alerts say a rule fired live with no persisted verdict, and model cards describe; none of them bind claim, threshold, measured value, and evidence digest into a signed verdict that survives after the fact. We checked all five public deliverables, and receipt-0004 already holds your CLAIM-2.

3. Your corpus is synthetic. Why do the recall numbers mean anything?
Declared in the limitations, and the claims are about this system's own artifacts, so the contract is corpus-agnostic: swap the evidence file and the receipts recompute. Receipt-0004 evidences a real published claim with no corpus at all.

4. Was this actually built in your two hours?
Our own ledger answers that: the timestamps delineate what predates the session and what was built inside it, and we opened with that disclosure. A provenance tool that hid its own provenance would be dead on arrival.

5. What stops someone overriding a BLOCK?
The code refuses: only REVIEW verdicts are overridable, the receipt's signature must verify first, actor, reason, and scope are mandatory, and the override is itself a signed receipt in the chain. Integrity failures are never overridable, by design.

6. Isn't this just an if statement?
The if statement is our baseline, and we demo it failing open on an upstream quote; the contribution is what surrounds it: origin classification, digest binding, canonical invariance, signed chained receipts, supersession, and replay. The break-it suite says it survives contact: 6/6 verdicts, 3/3 tamper mutations, 3/3 canonical variants, verify p95 0.2458 ms.

7. Where do your carbon and price numbers come from?
Transcribed, dated, and source-linked: Ember 2024 lifecycle intensity via Our World in Data and Eurostat 2025-S2 non-household prices with band and tax basis stated, and the transcription digest is bound into the receipt. Swap the file for a signed Ember or ENTSO-E feed, both CC BY 4.0, and the receipts recompute; the origin field is already there.

If an eighth question lands that you cannot answer, say: that is a REVIEW, not a PASS, and we would rather receipt it than bluff it.
