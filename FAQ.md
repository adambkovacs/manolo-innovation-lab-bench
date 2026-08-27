# FAQ, in plain language

The judge-preparation answers live in QA.md. This file covers the same ground
in plain language, and the same content is hosted on the project site
(docs/index.html).

**What is this in one sentence?**
A tool that turns claims about an AI system, like "answers in under 100
milliseconds", into signed, checkable receipts, so decisions rest on records,
not on whoever sounds most confident.

**What exactly is a "claim"?**
Any promise about an AI system stated with a number: "answers in under 100
milliseconds", "keeps 95 percent accuracy after compression", "runs on a grid
cleaner than 100 grams of CO2 per kilowatt hour". If it has a bar to clear, it
is a claim.

**Is the receipt like a store receipt?**
Very close. A store receipt records what happened in a purchase. Ours records
what happened in a check: the promise, the bar, the observed number, the
verdict, and when. The difference is the signature: edit ours afterwards and
the forgery is detectable by anyone, in under a second.

**Do I need to be a programmer to use it?**
To read receipts, no: the demo page shows them as colored verdicts with plain
reasons. To connect it to a new system, someone technical writes a small file
listing the promises and their bars. That is the whole integration.

**Can someone fake or quietly edit a receipt?**
Edits are detectable, which is the honest promise. Every receipt is chained to
the one before it and signed. Change any digit of the evidence or the receipt
and verification fails, naming the exact spot. The demo breaks it on purpose
to show this.

**Why do some of your own checks fail?**
On purpose. We did not meter energy in joules, so our own energy claim pauses
itself instead of pretending. A checking tool has to hold
itself to the same bar it applies to everyone else.

**What does the energy part mean for a normal company?**
Where you run AI changes its carbon footprint and its electricity bill. The
same workload can be nine times cleaner and almost half the price in one
country versus another, using public data anyone can check (Sweden 34.91 vs
Greece 321.65 gCO2e/kWh, Ember 2024; 0.0970 vs 0.1738 EUR/kWh, Eurostat
2025-S2). Receipts turn that choice into an accountable record.

**Is this an official MANOLO tool?**
No. It is an independent, open-source build for the MANOLO Innovation Lab,
based on the project's public documents. It uses their vocabulary and is
designed to plug in, and it never claims compatibility with systems that have
no public interface yet.

**Does it send my data anywhere?**
No. Zero network calls, verified by the test suite. Everything runs and
verifies locally, and the whole history replays from the repository.

**What does it deliberately not do?**
It does not meter energy in joules, does not store data lineage, does not
replace live monitoring, and does not prove a model is safe or clinically
effective. It proves one thing well: that a claim, its evidence, and its
verdict are bound together and unedited.

**What happens after the hackathon?**
The ask is thirty minutes with the people who own the claims: they declare the
bars, the receipts recompute, and the fourteen unevidenced promises start
getting evidence. The code is Apache-2.0 and ready to hand over.
