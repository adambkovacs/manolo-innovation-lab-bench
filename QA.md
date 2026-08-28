# Q&A hardening: the sixteen questions that decide the room

Answer in two sentences, then stop talking. Every answer ends on a fact, not a defense.

1. You signed your own receipt. Why should we trust it?
The signature binds the record, the pinned signer list says who may sign, and semantic replay recomputes every verdict from the bound files: node src/claims.js replay re-derives the verdicts, so even our own key signing a wrong verdict comes back INVALID. What replay cannot prove is the origins of the evidence, which is why they are labeled declared, not proven, and why a consortium key and signed origin provenance are the stated next step.

2. Is this not just MLflow, model cards, or your own D2.1 again?
D2.1 lineage says where an artifact came from, D4.1 alerts say a policy rule fired live with no claim verdict, and model cards describe; none of them bind claim, threshold, measured value, and evidence digest into a signed verdict that survives after the fact. We checked nine public deliverables, and receipt-0007 already holds your CLAIM-2.

3. Your corpus is synthetic. Why do the recall numbers mean anything?
Declared in the limitations, and the claims are about this system's own artifacts, so the contract is corpus-agnostic: swap the evidence file and the receipts recompute. Receipt-0007 evidences a real published claim with no corpus at all.

4. Was this actually built in your two hours?
The push history answers that: commit and push times sit on a server we do not control, and the ledger's session entries line up with them. Our own timestamps alone would prove nothing, which is exactly the no-external-anchor limitation we declare, so we opened with the disclosure instead of leaning on it.

5. What stops someone overriding a BLOCK?
The code refuses: only REVIEW verdicts are overridable, the receipt must verify first, trusted signer, signature, and evidence digests all, actor, reason, and scope are mandatory, and the override is itself a signed receipt in the chain. A hard claim is BLOCK even when the miss sits inside a review margin, so it can never reach the override path. Integrity failures are never overridable, by design.

6. Isn't this just an if statement?
The if statement is our baseline, and we demo it failing open on an upstream quote; the contribution is what surrounds it: origin classification, digest binding, canonical invariance, signed chained receipts, supersession, and replay. The break-it suite says it survives contact: 6/6 verdicts, 3/3 tamper mutations, 3/3 canonical variants, verify p95 under a quarter of a millisecond (current figure in results/gate-metrics.json).

7. Where do your carbon and price numbers come from?
Transcribed, dated, and source-linked: Ember 2024 lifecycle intensity via Our World in Data and Eurostat 2025-S2 non-household prices with band and tax basis stated, and the transcription digest is bound into the receipt. Swap the file for a signed Ember or ENTSO-E feed, both CC BY 4.0, and the receipts recompute; the origin field is already there.

8. Where are your datasets and model evals?
The contribution is the gate, and the gate ships its own eval suite: adversarial tests with predeclared acceptance gates, replayed by public CI on every push from the committed state alone. The benchmark regenerates its seeded corpus deterministically instead of bundling data, and real datasets enter as evidence with declared origins, exactly how BOAS enters receipt-0007.

9. We store every run in MLflow. How can you say our claims lack evidence?
The log is attached to the run; nothing attaches the claim to the run. Your own table's evidence column is titled "Evidence from Case Log", and for eight claims that cell reads "No direct evidence cited": the receipt is the missing attachment, and it points at your stored runs rather than replacing them.

If a tenth question lands that you cannot answer, say: that is a REVIEW, not a PASS, and we would rather receipt it than bluff it.

10. Why not in-toto, DSSE, Sigstore, or SLSA?
Those give you attestation envelopes and signer infrastructure, and our envelope can adopt them. What they do not carry is the claim contract: threshold, accepted evidence origins, verdict, disposition, and the REVIEW-only override model, which is the part built here.

11. Can someone relabel an upstream number as measured?
Yes: origin is declared, and the gate enforces the declared policy rather than detecting lies, so the receipt makes the declaration signed, permanent, and attributable. The stated next step is a signed evidence envelope from the measurement producer, which turns origin from self-report into attestation.

12. Why not just store this in MLflow?
Storing receipts as MLflow artifacts is a sensible integration and the adapter is small. MLflow does not carry a predeclared threshold, accepted origins, a verdict, or a disposition, so the contract is what TRACE adds, wherever the record lives.

13. Who chooses the threshold?
The claim owner declares it before evaluation, and the receipt binds the exact claim-file digest, so moving the bar afterwards is visible. For MANOLO that means use-case owners declaring bars for their own Table 16 rows.

14. What if MANOLO already has this internally?
Then this becomes an adapter and a conformance check for that component, which beats duplication. We asked exactly this as a pre-work question, and the answer changes one slide, not the build.

15. What exactly is novel here? Signatures and hash chains are old.
Correct, and we claim none of the parts: Ed25519, digests, chained logs, and attestation envelopes are commodity, in-toto and Sigstore territory. The contribution is the combination, a claim contract binding threshold, accepted evidence origins, verdict, and disposition into one signed, semantically replayable artifact with a REVIEW-only override and a gate the tuner cannot bypass, and we found that combination nowhere, including in the nine deliverables.

16. Endpoints are nodes; what about a hacked robot requesting workloads?
Admission gates the requester the way the gate gates claims: the request must be signed by a key registered in the trusted-signers file, fresh, and its self-reported health evaluates as upstream origin, so it pauses as REVIEW rather than passing, and deregistering the key flips its past admissions INVALID. What this cannot prove is that the device is uncompromised, since a stolen key still signs; hardware attestation is the measured-origin upgrade, and we say so in the limitations.
