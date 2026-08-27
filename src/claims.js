// TRACE receipts: claim-to-evidence evaluation with signed, replayable verdicts.
// Anchored on MANOLO D5.1 section 7.2.5 Table 7 (pp. 47-49), where 14 of 15
// use-case claims carry "No direct evidence cited" or "Requires validation
// study". This module binds declared claims to measured artifacts and emits a
// canonical, Ed25519-signed receipt. Zero dependencies (Node crypto only).
// Verdicts: PASS, REVIEW (borderline or missing evidence), FAIL (soft miss),
// BLOCK (hard policy miss). Overrides: REVIEW only, actor+reason+scope
// required, integrity failures are never overridable.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ledger = require('./ledger');

const ROOT = path.join(__dirname, '..');
const KEYS = path.join(ROOT, 'results', 'keys');
const RECEIPTS = path.join(ROOT, 'results', 'receipts');

// Canonical serialization: recursive key sort, arrays in order, finite numbers only.
function canon(o) {
  if (o === null || typeof o === 'number' || typeof o === 'boolean') {
    if (typeof o === 'number' && !Number.isFinite(o)) {
      throw new Error('non-finite number rejected in canonical form');
    }
    return JSON.stringify(o);
  }
  if (typeof o === 'string') return JSON.stringify(o);
  if (Array.isArray(o)) return '[' + o.map(canon).join(',') + ']';
  return '{' + Object.keys(o).sort().map(
    (k) => JSON.stringify(k) + ':' + canon(o[k])
  ).join(',') + '}';
}
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

function loadKeys() {
  fs.mkdirSync(KEYS, { recursive: true });
  const pv = path.join(KEYS, 'ed25519.priv.pem');
  const pb = path.join(KEYS, 'ed25519.pub.pem');
  if (!fs.existsSync(pv)) {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
    fs.writeFileSync(pv, privateKey.export({ type: 'pkcs8', format: 'pem' }));
    fs.writeFileSync(pb, publicKey.export({ type: 'spki', format: 'pem' }));
  }
  return { priv: fs.readFileSync(pv, 'utf8'), pub: fs.readFileSync(pb, 'utf8') };
}

function resolvePath(obj, dotted) {
  return dotted.split('.').reduce(
    (acc, k) => (acc && typeof acc === 'object' ? acc[k] : undefined), obj
  );
}

function compare(value, comparator, threshold) {
  switch (comparator) {
    case '<': return value < threshold;
    case '<=': return value <= threshold;
    case '>': return value > threshold;
    case '>=': return value >= threshold;
    case '==': return value === threshold;
    default: throw new Error('unknown comparator ' + comparator);
  }
}

function evaluateClaim(claim, evidenceDoc, docOrigin) {
  const measured = resolvePath(evidenceDoc, claim.metric);
  if (measured === undefined || measured === null) {
    return { verdict: 'REVIEW', measured: null, origin: 'missing',
      reason: 'no direct evidence: metric ' + claim.metric + ' not present in evidence artifact' };
  }
  if (typeof measured !== 'number' || !Number.isFinite(measured)) {
    return { verdict: 'REVIEW', measured: null, origin: 'missing',
      reason: 'evidence is not a finite number' };
  }
  const origin = evidenceDoc.origin || evidenceDoc.evidence_type || docOrigin || 'undeclared';
  const accepted = claim.accepted_origins || ['measured'];
  if (!accepted.includes(origin)) {
    return { verdict: 'REVIEW', measured, origin,
      reason: 'value originates from ' + origin + ' evidence, not from ' + accepted.join(' or ') +
        '; a threshold match alone is not enough to act on' };
  }
  if (compare(measured, claim.comparator, claim.threshold)) {
    return { verdict: 'PASS', measured, origin,
      reason: 'value from an accepted evidence origin satisfies the threshold' };
  }
  const margin = claim.review_margin;
  if (margin !== undefined && Math.abs(measured - claim.threshold) <= margin) {
    return { verdict: 'REVIEW', measured, origin,
      reason: 'within declared review margin of ' + margin + '; human decision required' };
  }
  if (claim.hard) {
    return { verdict: 'BLOCK', measured, origin, reason: 'hard claim violated; not overridable' };
  }
  return { verdict: 'FAIL', measured, origin, reason: 'measured value misses threshold' };
}

const DISPOSITION = { PASS: 'CONTINUE', REVIEW: 'PAUSE', FAIL: 'PAUSE', BLOCK: 'STOP' };

function listReceipts() {
  fs.mkdirSync(RECEIPTS, { recursive: true });
  return fs.readdirSync(RECEIPTS).filter((f) => f.endsWith('.json')).sort();
}
const receiptHash = (r) => {
  const { signature, ...rest } = r;
  return sha256(canon(rest));
};

function writeReceipt(body) {
  const { priv, pub } = loadKeys();
  const prev = listReceipts();
  body.prev_receipt_hash = prev.length
    ? receiptHash(JSON.parse(fs.readFileSync(path.join(RECEIPTS, prev[prev.length - 1]), 'utf8')))
    : 'GENESIS';
  body.public_key = pub;
  const sig = crypto.sign(null, Buffer.from(canon(body)), priv);
  const receipt = { ...body, signature: sig.toString('base64') };
  const file = 'receipt-' + String(prev.length + 1).padStart(4, '0') + '.json';
  fs.writeFileSync(path.join(RECEIPTS, file), JSON.stringify(receipt, null, 2));
  ledger.append('receipt', {
    file, type: body.type, receipt_hash: receiptHash(receipt),
    summary: body.summary,
  });
  return { file, receipt };
}

function evaluate(claimsPath) {
  const cp = claimsPath || path.join(ROOT, 'fixtures', 'claims.json');
  const claimsDoc = JSON.parse(fs.readFileSync(cp, 'utf8'));
  const seen = new Set();
  for (const c of claimsDoc.claims) {
    if (seen.has(c.id)) throw new Error('duplicate claim id: ' + c.id);
    seen.add(c.id);
  }
  const evPath = path.join(ROOT, claimsDoc.evidence);
  const evidenceDoc = JSON.parse(fs.readFileSync(evPath, 'utf8'));
  const verdicts = claimsDoc.claims.map((c) => {
    const v = evaluateClaim(c, evidenceDoc, claimsDoc.evidence_origin);
    return {
      id: c.id, statement: c.statement, modeled_on: c.modeled_on,
      metric: c.metric, comparator: c.comparator, threshold: c.threshold,
      unit: c.unit, ...v, disposition: DISPOSITION[v.verdict],
    };
  });
  const summary = verdicts.reduce(
    (a, v) => ((a[v.verdict] = (a[v.verdict] || 0) + 1), a), {});
  const dispositions = verdicts.reduce(
    (a, v) => ((a[v.disposition] = (a[v.disposition] || 0) + 1), a), {});
  return writeReceipt({
    schema: 'trace-receipt/0.1', type: 'evaluation',
    created: new Date().toISOString(),
    workload_id: claimsDoc.workload_id, claims_set: path.basename(cp),
    verdicts, summary, dispositions,
    evidence_digests: {
      [claimsDoc.evidence]: sha256(fs.readFileSync(evPath)),
      [path.relative(ROOT, cp)]: sha256(fs.readFileSync(cp)),
    },
  });
}

function verifyReceipt(file) {
  const p = path.isAbsolute(file) ? file : path.join(RECEIPTS, file);
  const r = JSON.parse(fs.readFileSync(p, 'utf8'));
  const { signature, ...body } = r;
  const out = { file: path.basename(p), signature_valid: false,
    evidence_intact: true, mismatches: [] };
  out.signature_valid = crypto.verify(
    null, Buffer.from(canon(body)),
    crypto.createPublicKey(r.public_key), Buffer.from(signature, 'base64'));
  for (const [rel, digest] of Object.entries(r.evidence_digests || {})) {
    const fp = path.join(ROOT, rel);
    const now = fs.existsSync(fp) ? sha256(fs.readFileSync(fp)) : 'MISSING';
    if (now !== digest) { out.evidence_intact = false; out.mismatches.push(rel); }
  }
  out.valid = out.signature_valid && out.evidence_intact;
  return out;
}

function verifyAll() {
  const files = listReceipts();
  const parsed = files.map((f) => ({
    f, r: JSON.parse(fs.readFileSync(path.join(RECEIPTS, f), 'utf8')),
  }));
  // Latest evaluation per claims_set: only that one must match current disk.
  // Earlier ones are SUPERSEDED history: signature and linkage must still
  // hold, evidence digests are expected to reflect the state they signed.
  const latest = {};
  for (const { f, r } of parsed) {
    if (r.type === 'evaluation') latest[r.claims_set] = f;
  }
  let prev = 'GENESIS';
  const results = [];
  for (const { f, r } of parsed) {
    const one = verifyReceipt(f);
    one.chain_linked = r.prev_receipt_hash === prev;
    one.superseded = r.type === 'evaluation' && latest[r.claims_set] !== f;
    one.valid = one.signature_valid && one.chain_linked &&
      (one.superseded || one.evidence_intact);
    one.status = (!one.signature_valid || !one.chain_linked) ? 'INVALID'
      : one.superseded ? 'SUPERSEDED'
      : one.evidence_intact ? 'VALID' : 'INVALID';
    prev = receiptHash(r);
    results.push(one);
  }
  return { receipts: results.length, all_valid: results.every((x) => x.valid), results };
}

function override(file, opts) {
  for (const k of ['actor', 'decision', 'reason', 'scope']) {
    if (!opts[k]) throw new Error('override requires --' + k);
  }
  const check = verifyReceipt(file);
  if (!check.signature_valid) {
    throw new Error('refused: receipt signature invalid; integrity failures are not overridable');
  }
  const p = path.isAbsolute(file) ? file : path.join(RECEIPTS, file);
  const r = JSON.parse(fs.readFileSync(p, 'utf8'));
  const reviewIds = (r.verdicts || []).filter((v) => v.verdict === 'REVIEW').map((v) => v.id);
  if (!reviewIds.length) {
    throw new Error('refused: no REVIEW verdicts to override; FAIL and BLOCK are not overridable');
  }
  return writeReceipt({
    schema: 'trace-receipt/0.1', type: 'override',
    created: new Date().toISOString(),
    workload_id: r.workload_id,
    override: {
      actor: opts.actor, decision: opts.decision, reason: opts.reason,
      scope: opts.scope, prior_receipt: path.basename(p),
      prior_receipt_hash: receiptHash(r), overridden_claims: reviewIds,
    },
    summary: { OVERRIDDEN: reviewIds.length },
    evidence_digests: {},
  });
}

module.exports = { evaluate, verifyReceipt, verifyAll, override, listReceipts,
  _internals: { canon, sha256, evaluateClaim, receiptHash, DISPOSITION } };

if (require.main === module) {
  const [cmd, arg] = process.argv.slice(2);
  const flags = {};
  process.argv.slice(3).forEach((a, i, arr) => {
    if (a.startsWith('--')) flags[a.slice(2)] = arr[i + 1];
  });
  try {
    if (cmd === 'evaluate') console.log(JSON.stringify(evaluate(arg && !arg.startsWith('--') ? arg : undefined), null, 2));
    else if (cmd === 'verify' && arg && arg !== 'all') console.log(JSON.stringify(verifyReceipt(arg), null, 2));
    else if (cmd === 'verify') console.log(JSON.stringify(verifyAll(), null, 2));
    else if (cmd === 'override') console.log(JSON.stringify(override(arg, flags), null, 2));
    else console.log('usage: node src/claims.js evaluate [claims.json] | verify [receipt|all] | override <receipt> --actor A --decision D --scope S --reason R');
  } catch (e) { console.error('ERROR: ' + e.message); process.exit(1); }
}
