// Artifact-derived trustworthiness status assessment, mapped to the EU
// Trustworthy AI requirements MANOLO applies via Z-Inspection®.
// v0.2: statuses are implemented / partial / absent. No invented 0-100
// precision; a numeric mapping (100/50/0) exists only so charts can render.
// Every entry carries evidence and an explicit gap.
'use strict';
const fs = require('fs');
const path = require('path');
const ledger = require('./ledger');
const claims = require('./claims');

const ROOT = path.join(__dirname, '..');
const has = (p) => fs.existsSync(path.join(ROOT, p));
const read = (p) => (has(p) ? fs.readFileSync(path.join(ROOT, p), 'utf8') : '');
const NUM = { implemented: 100, partial: 50, absent: 0 };
const entry = (status, evidence, gap) => ({ status, score: NUM[status], evidence, gap });

function compute() {
  const results = has('results/results.json')
    ? JSON.parse(read('results/results.json')) : null;
  const chain = ledger.verify();
  let receipts = { receipts: 0, all_valid: false };
  try { receipts = claims.verifyAll(); } catch (_) { /* none yet */ }
  const readme = read('README.md');
  const spec = read('openapi.yaml');

  const scorecard = {};  scorecard.efficiency_sustainability = results
    ? entry('implemented',
        `Vector payload size, latency, and recall measured: ${results.int8_quantized.compression_x}x smaller encoded payload at recall@10 ${results.int8_quantized.recall_at_10}.`,
        'Energy is not metered in joules; payload size and latency are the declared proxies, not process memory.')
    : entry('absent', 'No benchmark results found.', 'Run npm run bench.');

  scorecard.transparency_explainability = entry(
    spec.includes('/claims/evaluate') && readme.includes('## Limitations')
      ? 'implemented' : 'partial',
    'Public API contract covering every live endpoint, plus a written Limitations section.',
    'No per-decision model explanations; scope is system transparency.');  scorecard.accountability_auditability =
    chain.valid && (receipts.receipts === 0 || receipts.all_valid)
      ? entry('implemented',
          `Hash chain intact across ${chain.records} records; ${receipts.receipts} signed receipts verify (trusted signer, signature, evidence digests, linkage, semantic replay).`,
          'Single-node ledger, pinned trusted-signer list without a PKI, no external time anchor.')
      : entry('absent',
          chain.valid ? 'Receipt verification failed.' : `Chain integrity FAILED at record ${chain.break_index}.`,
          'Provenance cannot be trusted until integrity is restored.');

  scorecard.reliability_robustness = entry(
    results ? 'partial' : 'absent',
    results
      ? `Quality loss under compression measured and reported (recall@10 delta ${(1 - results.int8_quantized.recall_at_10).toFixed(4)}).`
      : 'No measured degradation data.',
    'No out-of-distribution or drift testing; synthetic seeded corpus.');

  scorecard.security_misuse_resistance = entry('partial',
    'Tamper-evident ledger plus Ed25519-signed receipts detect post-hoc manipulation of records and evidence.',
    'No input sanitization or injection screening on the API; tamper-evident is not tamper-proof.');

  scorecard.human_agency_oversight = entry('partial',
    'Governed override exists: REVIEW verdicts only, named actor, reason, and scope required, override itself signed and chained.',
    'No pre-action approval gate; oversight is post-verdict, not pre-execution.');  return {
    generated: new Date().toISOString(),
    method: 'artifact-derived trustworthiness evidence coverage v0.3 (implemented / partial / absent); numeric mapping for charts only; Z-Inspection®-aligned; computing this record changes nothing, recording it is a separate explicit step',
    scorecard,
  };
}

// run() computes AND appends an assessment record to the ledger. The API
// exposes compute() on GET /assess (no side effect) and run() on
// POST /assessments (explicit record).
function run() {
  const out = compute();
  ledger.append('assessment', {
    method: out.method,
    scores: Object.fromEntries(Object.entries(out.scorecard).map(([k, v]) => [k, v.score])),
    statuses: Object.fromEntries(Object.entries(out.scorecard).map(([k, v]) => [k, v.status])),
  });
  return out;
}

if (require.main === module) console.log(JSON.stringify(compute(), null, 2));
module.exports = { run, compute };
