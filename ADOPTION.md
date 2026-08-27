# Memo: a receipt layer for the D5.1 assessment loop

To: MANOLO consortium, attn Ricardo Simon Carbajo, Cristian Bosch Serrano (CeADAR)
From: the MANOLO-Bench team, Innovation Lab, Thessaloniki, August 2026

D5.1 section 7.2.5 Table 7 lists fifteen trustworthiness claims for the wearables use case; fourteen are marked "No direct evidence cited" or "Requires validation study". D2.1's Data Operations Manager records where artifacts came from, and D4.1's Policy Manager raises live alerts without a persisted verdict. Nothing in the five public deliverables binds a declared claim to a measured artifact in a signed, replayable form.

We built that binding. A small JSON claims contract (modeled on CLAIM-4 and CLAIM-7), evaluated against benchmark artifacts, emitting canonical Ed25519-signed receipts with verdicts PASS, REVIEW, FAIL, BLOCK, chained and tamper-evident, with overrides restricted to REVIEW and always signed with actor, reason, and scope. Reference implementation is zero-dependency Node, Apache-2.0, already using your vocabulary (IPD YAML, AIWorkloadID), and demonstrated on our own measured system including the claims we fail. The same contract prices energy: zone carbon intensity and electricity cost evaluate today as published-origin claims (Ember 2024 and Eurostat 2025-S2 transcriptions, digest-bound), signed live feeds (Ember, ENTSO-E, both CC BY 4.0) slot into the origin field when wanted, and the CLAIM-5 power claim is exactly this category.

The ask: thirty minutes with WP5 to review whether this contract, with use-case owners declaring the thresholds, is worth adopting or adapting against the Table 7 claims and the equivalent tables of the other three use cases before Trust in the Loop in Dublin on October 20. We will hand over the specification and rename every field to your internal vocabulary.

Repository: github.com/adambkovacs/manolo-innovation-lab-bench (Apache-2.0). Plain-language site: adambkovacs.github.io/manolo-innovation-lab-bench. Contact: Adam Kovacs.
