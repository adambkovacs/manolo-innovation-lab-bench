# Project context for Claude Code

Auto-loaded at session start. This file exists because a fresh session has no
memory of the build conversation, only this repo. It carries what nothing
else in the repo carries: competition logistics not fully written elsewhere,
the decision log, technical gotchas, and the live task tracker. For
everything else, read the file, don't duplicate it here: EXPLAINER.md (what
and why), README.md (how it works), RUNBOOK.md (hour-by-hour session plan),
ADOPTION.md (handover memo), QA.md (judge Q&A prep), PRESENTATION.md (deck
script), FAQ.md (public plain-language).

## Competition facts

MANOLO EU Innovation Lab hackathon, Horizon Europe GA 101135782, CeADAR/UCD.
Summer school 26 to 28 August 2026, Thessaloniki. Format: two 60-minute
session slots. Mentors and judges: Ricardo Simon Carbajo
(ricardo.simoncarbajo@ucd.ie), Cristian Bosch
(cristian.boschserrano@ucd.ie). Submissions to all three:
manolosummerschool@28digital.eu, cristian.boschserrano@ucd.ie,
ricardo.simoncarbajo@ucd.ie (per the challenge PDF). Rubric: Technical
30, Trustworthy + Efficient 30, Novelty 20, Impact 20; the novelty
section names "creativity in the use of the Manolo framework API
specification", so expect a spec handout at the event (RUNBOOK extension
option e). Prize: 28Digital entrepreneurship course plus invitation to
the EC event "Trust in the Loop", Dublin, 20 October 2026. Apache-2.0
required. The brief prefers a small project with clear evidence over a
large incomplete one. Goal: win and get invited to Dublin.

**Not yet done, exists only as a plan:** two pre-work questions for the
organizers, never sent. (1) May we bring pre-built code, or must everything
originate in-session? (2) Does MANOLO emit machine-readable claim to
evidence to decision records anywhere internally? If asked to draft this
email, these are the two questions; do not invent others without asking
Adam first.

## Task tracker (human-only, none confirmed as of last session)

1. Email organizers the two pre-work questions above.
2. ~~Push this repo public on GitHub.~~ Done 27 Aug 2026: pushed to
   github.com/adambkovacs/manolo-innovation-lab-bench, branch main
   (created as manolo-innovation-lab, renamed same day; links repointed
   in follow-up commits). Settings still needing a human with repo
   admin rights: public visibility, Pages source set to GitHub Actions,
   and the four topics. See PUBLISH.md.
3. Open docs/index.html and docs/demo.html on a phone once, real device,
   before relying on them in front of a jury.
4. Update the two session-number slots in presentation.pptx (slides 4 and
   5, see speaker notes) with the in-session benchmark rerun.
5. Hand ADOPTION.md to Ricardo in person and say the October 20 sentence.
   Never ask for the invitation directly.

Update this list's status as items complete. Don't remove completed items
silently; strike them so the history of what shipped when survives.

## Decision log: things already decided, do not silently re-open

- **The subject is the MANOLO framework's assessment loop, not the BitBrain
  use case.** D5.1's Table 7 is the worked example, cited once with its
  section and page numbers. BitBrain is named only inside fixture files and
  evidence pointers (exact provenance for signed receipts), never in prose,
  slides, or the docs site. If asked to "improve the BitBrain framing,"
  that's a reframe request, not a return to use-case language.
- **No live energy metering, no carbon dashboard, no estimated joules.**
  Rejected on first principles: this environment cannot measure joules
  credibly, MANOLO's own D5.1 section 4 already covers eco-efficiency
  tooling (Kepler, Alumet, CodeCarbon) so a dashboard would duplicate the
  judges' own work, and live APIs would break the zero-network-calls gate
  that is itself a tested, receipted property. Energy enters only as
  claims over declared-origin evidence (measured, published, upstream,
  assumed), exactly like every other claim. This was a considered
  rejection, not an oversight; don't re-propose it without a materially
  different argument.
- **Old fixture and receipt provenance is never rewritten to fit a new
  narrative.** When the framing moved from use-case to framework-level,
  the fixtures keep their original BitBrain references and the fixtures
  in fixtures/claims-bitbrain.json plus receipt-0007 are untouched. Editing
  signed history to make a story read better is the exact failure this
  tool exists to catch. If a judge notices the fixture filename, that's
  the intended answer, not a bug to quietly patch.
- **The "MANOLO Reflex" idea was rejected twice** (two independent sibling
  analyses proposed it) because it duplicates the controlled-actions
  roadmap already in D1.3 and D5.1. Absorbed from that line of thinking
  instead: the evidence-origin model, the CONTINUE/PAUSE/STOP disposition
  mapping, the adversarial test suite with predeclared gates, and the
  fail-open baseline. Those four made it in; the rest of that proposal did
  not.
- **Never say MANOLO lacks evidence; say the binding is missing.** MANOLO
  stores run metrics (MLflow, Thanos, Grafana per D1.3/D5.1), provenance
  (D2.1 Data Operations Manager), and alerts (D4.1). Validated 27 Aug
  2026 against the full D5.1 PDF directly: the Table 7 tally is 8 "No
  direct evidence cited", 6 "Requires validation study", 1 with cited
  evidence (CLAIM-2, BOAS, Esparza-Iaizzo 2024, 87.08/86.64); the
  evidence column is titled "Evidence from Case Log", which is the
  MLflow answer in one line (the log is attached to the run, nothing
  attaches the claim to the run); the claims list is reproduced in D5.1
  from D6.1's socio-technical scenarios, cite it that way. Also caught
  there: the acronym is IPD YAML (Infrastructure and Policy Definition),
  not IDP; the committed pptx still carries the old spelling until the
  in-session deck regen. Copy that drifts toward "no evidence exists"
  gets corrected, not defended. QA question 9 carries the answer for the
  MLflow challenge. Keep the framing at four use cases with Table 7 as
  the one published in full, not a single-use-case story.
- **Never claim MANOLO compatibility.** No public MANOLO schema exists to
  bind against (its GitHub org is empty, no public OpenAPI). The repo says
  "MANOLO-shaped, adapter-ready" everywhere, never "MANOLO-compatible."
  Keep that distinction if writing new copy.
- **The private Ed25519 signing key is deliberately excluded from git**
  (see .gitignore). Every receipt embeds its own public key, so
  verification is self-contained for any clone; a keyless clone can
  generate a fresh keypair and keep signing validly. Don't add the private
  key back to version control for convenience.

## Technical gotchas hit during the build

- **Apostrophes inside single-quoted strings break both Python heredocs
  and JS scripts silently mid-patch**, leaving partial edits applied. This
  happened twice in this project (once in a Python doc-patch script, once
  in scripts/make-deck.js). Prefer double quotes or rephrase to drop the
  apostrophe; after any multi-file patch script, verify with `assert`
  statements or grep, don't trust the "it ran" signal alone.
- **RuVector needs an explicit `storagePath` and `hnswConfig.maxElements`**
  set to at least N+16 for the benchmark's vector count, or it throws. See
  src/bench.js for the working configuration.
- **`node --test` with no path argument, not `node --test test/`**, since
  the latter fails on this Node version (v22.22.2). Use the `gate:test` or
  `test` npm script.
- **In sandboxed shells, `pkill -f` or `pgrep -f` against a process name
  can self-match the wrapper shell** if the search string appears in its
  own command line. Scan `/proc` directly and exclude the searching
  process's own interpreter if this comes up again.
- **Editing a fixture invalidates the evidence digest of any receipt that
  referenced its old content.** This is by design (tamper detection), not
  a bug: use the SUPERSEDED lifecycle already implemented in
  src/claims.js rather than trying to keep old receipts matching edited
  fixtures.

## The verification discipline that matters most

**Always verify the staged zip's actual bytes, never the working tree's
apparent state.** This project was caught twice by the gap between "the
files on disk look right" and "the artifact that ships is right": a
runbook that referenced a file structure from before a rename, and a
doc-patch script that silently no-op'd on a syntax error while later
steps reported success. The fix that stuck: after any change meant to
ship, open the zip (or in this repo's case, `git status --porcelain`
plus `git archive HEAD | tar -x` into a scratch dir) and assert on the
extracted content, not on files edited in place. Apply this to any future
change here: build the deliverable, then verify the deliverable, not your
memory of having built it.

## Writing standard

No em dashes, no AI filler openers or closers, no inflated buzzwords
(delve, tapestry, leverage, seamless, robust, comprehensive, and so on),
sentence-case headings, lead with the answer. Full ruleset:
`/mnt/skills/plugins/fulcrum-os:anti-slop/SKILL.md` if available in the
environment; if not, the condensed version lives in this file's tone.
Quoted D5.1 text is exempt. Run a plain grep for the banned-word list
against any new prose file before considering it done.
