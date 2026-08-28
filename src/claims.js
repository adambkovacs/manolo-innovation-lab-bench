// TRACE receipts: claim-to-evidence evaluation with signed, replayable verdicts.
// Anchored on MANOLO D5.1 section 7.2.5 Table 7 (pp. 47-49), where 14 of 15
// use-case claims carry "No direct evidence cited" or "Requires validation
// study". This module binds declared claims to measured artifacts and emits a
// canonical, Ed25519-signed receipt. Zero dependencies (Node crypto only).
// Verdicts: PASS, REVIEW (borderline or missing evidence), FAIL (soft miss),
// BLOCK (hard policy miss; hard outranks any review margin). Overrides:
// REVIEW only, actor+reason+scope required, integrity failures are never
// overridable. Trust rule: a receipt counts only if its embedded public
// key's fingerprint is listed in results/keys/trusted-signers.json, and a
// verdict counts only if semantic replay reproduces it from the digest-bound
// claim and evidence files. A clean clone can verify everything; creating an
// authorised receipt takes an explicit keygen, visible in git diff.
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

const TRUSTED = path.join(KEYS, 'trusted-signers.json');

function keyFingerprint(pem) {
  return sha256(crypto.createPublicKey(pem).export({ type: 'spki', format: 'der' }));
}

function trustedSigners() {
  if (!fs.existsSync(TRUSTED)) return new Set();
  const doc = JSON.parse(fs.readFileSync(TRUSTED, 'utf8'));
  return new Set((doc.signers || []).map((s) => s.key_id_sha256));
}

function loadKeys() {
  const pv = path.join(KEYS, 'ed25519.priv.pem');
  const pb = path.join(KEYS, 'ed25519.pub.pem');
  if (!fs.existsSync(pv)) {
    throw new Error('no signing key: run "node src/claims.js keygen" to create one; ' +
      'its fingerprint is registered in results/keys/trusted-signers.json and the diff is the audit trail');
  }
  return { priv: fs.readFileSync(pv, 'utf8'), pub: fs.readFileSync(pb, 'utf8') };
}

function keygen() {
  fs.mkdirSync(KEYS, { recursive: true });
  const pv = path.join(KEYS, 'ed25519.priv.pem');
  const pb = path.join(KEYS, 'ed25519.pub.pem');
  if (fs.existsSync(pv)) throw new Error('refused: a signing key already exists at ' + pv);
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
  const pubPem = publicKey.export({ type: 'spki', format: 'pem' });
  fs.writeFileSync(pv, privateKey.export({ type: 'pkcs8', format: 'pem' }));
  fs.writeFileSync(pb, pubPem);
  const fp = keyFingerprint(pubPem);
  const doc = fs.existsSync(TRUSTED)
    ? JSON.parse(fs.readFileSync(TRUSTED, 'utf8')) : { signers: [] };
  doc.signers.push({ key_id_sha256: fp, label: 'session key', added: new Date().toISOString() });
  fs.writeFileSync(TRUSTED, JSON.stringify(doc, null, 2) + '\n');
  return { key_id: fp.slice(0, 16), registered_in: path.relative(ROOT, TRUSTED),
    note: 'fingerprint appended to trusted-signers.json; the git diff of that file is the authorisation record' };
}

// Evidence paths inside receipts and claim sets are repo-relative; anything
// resolving outside the repository is rejected before any filesystem access.
function insideRoot(rel) {
  const abs = path.resolve(ROOT, rel);
  return abs === ROOT || abs.startsWith(ROOT + path.sep);
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

function evaluateClaim(claim, evidenceDoc, docOrigin, docWorkload, refTime) {
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
  }  // Binding checks fire only when the documents declare the fields, so
  // receipts signed before these fields existed replay unchanged.
  if (docWorkload && evidenceDoc.workload_id && evidenceDoc.workload_id !== docWorkload) {
    return { verdict: 'REVIEW', measured, origin,
      reason: 'evidence belongs to workload ' + evidenceDoc.workload_id +
        ', claim set belongs to ' + docWorkload + '; cross-workload evidence needs a human' };
  }
  if (claim.unit && evidenceDoc.units) {
    const evUnit = resolvePath(evidenceDoc.units, claim.metric);
    if (evUnit !== claim.unit) {
      return { verdict: 'REVIEW', measured, origin,
        reason: 'claim declares unit ' + claim.unit + ' but evidence declares ' +
          (evUnit || 'no unit for this metric') + '; no silent conversion' };
    }
  }
  if (claim.max_age_days !== undefined) {
    const ts = Date.parse(evidenceDoc.observed_at || '');
    const now = refTime !== undefined ? refTime : Date.now();
    if (Number.isNaN(ts)) {
      return { verdict: 'REVIEW', measured, origin,
        reason: 'claim declares max_age_days but evidence carries no parseable observed_at' };
    }
    if (now - ts > claim.max_age_days * 86400000) {
      return { verdict: 'REVIEW', measured, origin,
        reason: 'evidence observed_at is older than the declared max_age_days of ' + claim.max_age_days };
    }
  }
  if (compare(measured, claim.comparator, claim.threshold)) {
    return { verdict: 'PASS', measured, origin,
      reason: 'value from an accepted evidence origin satisfies the threshold' };
  }
  // A hard claim outranks any review margin: a hard violation is BLOCK even
  // when the miss sits inside the margin, so it can never reach the
  // REVIEW-only override path.
  if (claim.hard) {
    return { verdict: 'BLOCK', measured, origin, reason: 'hard claim violated; not overridable' };
  }
  const margin = claim.review_margin;
  if (margin !== undefined && Math.abs(measured - claim.threshold) <= margin) {
    return { verdict: 'REVIEW', measured, origin,
      reason: 'within declared review margin of ' + margin + '; human decision required' };
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
    : 'GENESIS';  body.public_key = pub;
  body.evaluator = 'trace/0.2';
  body.signer_key_id = keyFingerprint(pub).slice(0, 16);
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
  }  if (!insideRoot(claimsDoc.evidence)) {
    throw new Error('evidence path escapes the repository: ' + claimsDoc.evidence);
  }
  const evPath = path.join(ROOT, claimsDoc.evidence);
  const evidenceDoc = JSON.parse(fs.readFileSync(evPath, 'utf8'));
  const verdicts = claimsDoc.claims.map((c) => {
    const v = evaluateClaim(c, evidenceDoc, claimsDoc.evidence_origin, claimsDoc.workload_id);
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
  const { signature, ...body } = r;  const fp = keyFingerprint(r.public_key);
  const out = { file: path.basename(p), signature_valid: false,
    key_id: fp.slice(0, 16), signer_trusted: trustedSigners().has(fp),
    evidence_intact: true, mismatches: [] };
  out.signature_valid = crypto.verify(
    null, Buffer.from(canon(body)),
    crypto.createPublicKey(r.public_key), Buffer.from(signature, 'base64'));
  for (const [rel, digest] of Object.entries(r.evidence_digests || {})) {
    if (!insideRoot(rel)) {
      out.evidence_intact = false;
      out.mismatches.push(rel + ' (path escapes repository, not read)');
      continue;
    }
    const ep = path.join(ROOT, rel);
    const now = fs.existsSync(ep) ? sha256(fs.readFileSync(ep)) : 'MISSING';
    if (now !== digest) { out.evidence_intact = false; out.mismatches.push(rel); }
  }
  out.valid = out.signature_valid && out.signer_trusted && out.evidence_intact;
  return out;
}

// Semantic replay: reload the digest-bound claim set and evidence a receipt
// names, re-run every evaluation with the receipt's own timestamp as the
// clock, and compare with what was signed. A trusted key signing a wrong
// verdict fails here even though its signature verifies.
function replayVerdicts(r) {
  const cpRel = Object.keys(r.evidence_digests || {})
    .find((k) => path.basename(k) === r.claims_set);
  if (!cpRel) return { semantic_valid: false, mismatches: ['claims_set file is not digest-bound'] };
  if (!insideRoot(cpRel)) return { semantic_valid: false, mismatches: [cpRel + ' escapes repository'] };
  const claimsDoc = JSON.parse(fs.readFileSync(path.join(ROOT, cpRel), 'utf8'));
  if (!insideRoot(claimsDoc.evidence)) {
    return { semantic_valid: false, mismatches: [claimsDoc.evidence + ' escapes repository'] };
  }
  const evidenceDoc = JSON.parse(fs.readFileSync(path.join(ROOT, claimsDoc.evidence), 'utf8'));
  const refTime = Date.parse(r.created);
  const mismatches = [];
  for (const c of claimsDoc.claims) {
    const v = evaluateClaim(c, evidenceDoc, claimsDoc.evidence_origin, claimsDoc.workload_id, refTime);
    const signed = (r.verdicts || []).find((x) => x.id === c.id);
    if (!signed) { mismatches.push(c.id + ': claim has no signed verdict'); continue; }
    if (signed.verdict !== v.verdict) {
      mismatches.push(c.id + ': signed ' + signed.verdict + ', replay computes ' + v.verdict);
    }
    if (signed.measured !== v.measured) {
      mismatches.push(c.id + ': signed measured ' + signed.measured + ', replay reads ' + v.measured);
    }
    if (signed.disposition !== DISPOSITION[v.verdict]) {
      mismatches.push(c.id + ': disposition does not match replayed verdict');
    }
  }
  if ((r.verdicts || []).length !== claimsDoc.claims.length) {
    mismatches.push('receipt carries ' + (r.verdicts || []).length +
      ' verdicts for ' + claimsDoc.claims.length + ' claims');
  }
  return { semantic_valid: mismatches.length === 0, mismatches };
}

// Override receipts replay differently: the prior receipt must exist, hash
// to what the override signed, and every overridden claim must have been a
// REVIEW in it.
function replayOverride(r) {
  const o = r.override || {};
  const pp = path.join(RECEIPTS, o.prior_receipt || '');
  if (!o.prior_receipt || !fs.existsSync(pp)) {
    return { semantic_valid: false, mismatches: ['prior receipt missing: ' + o.prior_receipt] };
  }
  const prior = JSON.parse(fs.readFileSync(pp, 'utf8'));
  const mismatches = [];
  if (receiptHash(prior) !== o.prior_receipt_hash) {
    mismatches.push('prior receipt hash does not match the one the override signed');
  }
  for (const id of o.overridden_claims || []) {
    const v = (prior.verdicts || []).find((x) => x.id === id);
    if (!v) mismatches.push(id + ': not present in prior receipt');
    else if (v.verdict !== 'REVIEW') mismatches.push(id + ': was ' + v.verdict + ', only REVIEW is overridable');
  }
  return { semantic_valid: mismatches.length === 0, mismatches };
}

function replayReceipt(file) {
  const p = path.isAbsolute(file) ? file : path.join(RECEIPTS, file);
  const r = JSON.parse(fs.readFileSync(p, 'utf8'));
  const integrity = verifyReceipt(file);
  if (!integrity.evidence_intact) {
    return { ...integrity, semantic_valid: null,
      note: 'evidence on disk differs from what this receipt signed; superseded history is not replayable from the working tree, only from the git version it signed' };
  }
  const sem = r.type === 'override' ? replayOverride(r) : replayVerdicts(r);
  return { ...integrity, ...sem, valid: integrity.valid && sem.semantic_valid };
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
  for (const { f, r } of parsed) {    const one = verifyReceipt(f);
    one.chain_linked = r.prev_receipt_hash === prev;
    one.superseded = r.type === 'evaluation' && latest[r.claims_set] !== f;
    if (one.superseded || !one.evidence_intact) {
      one.semantic_valid = null; // history; replay needs the git version it signed
    } else {
      const sem = r.type === 'override' ? replayOverride(r) : replayVerdicts(r);
      one.semantic_valid = sem.semantic_valid;
      if (!sem.semantic_valid) one.mismatches.push(...sem.mismatches);
    }
    one.valid = one.signature_valid && one.signer_trusted && one.chain_linked &&
      (one.superseded || (one.evidence_intact && one.semantic_valid === true));
    one.status = (!one.signature_valid || !one.signer_trusted || !one.chain_linked) ? 'INVALID'
      : one.superseded ? 'SUPERSEDED'
      : (one.evidence_intact && one.semantic_valid === true) ? 'VALID' : 'INVALID';
    prev = receiptHash(r);
    results.push(one);
  }
  return { receipts: results.length, all_valid: results.every((x) => x.valid), results };
}

function override(file, opts) {
  for (const k of ['actor', 'decision', 'reason', 'scope']) {
    if (!opts[k]) throw new Error('override requires --' + k);
  }  const check = verifyReceipt(file);
  if (!check.signature_valid) {
    throw new Error('refused: receipt signature invalid; integrity failures are not overridable');
  }  if (!check.signer_trusted) {
    throw new Error('refused: receipt signer ' + check.key_id +
      ' is not in trusted-signers.json; untrusted receipts are not overridable');
  }
  if (!check.evidence_intact) {
    throw new Error('refused: evidence digests do not match disk (' +
      check.mismatches.join(', ') + '); integrity failures are not overridable');
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
  replayReceipt, keygen,
  _internals: { canon, sha256, evaluateClaim, receiptHash, DISPOSITION,
    replayVerdicts, replayOverride, keyFingerprint, trustedSigners, insideRoot } };

if (require.main === module) {
  const [cmd, arg] = process.argv.slice(2);
  const flags = {};
  process.argv.slice(3).forEach((a, i, arr) => {
    if (a.startsWith('--')) flags[a.slice(2)] = arr[i + 1];
  });
  try {    if (cmd === 'evaluate') console.log(JSON.stringify(evaluate(arg && !arg.startsWith('--') ? arg : undefined), null, 2));
    else if (cmd === 'verify' && arg && arg !== 'all') console.log(JSON.stringify(verifyReceipt(arg), null, 2));
    else if (cmd === 'verify') console.log(JSON.stringify(verifyAll(), null, 2));
    else if (cmd === 'replay' && arg) console.log(JSON.stringify(replayReceipt(arg), null, 2));
    else if (cmd === 'keygen') console.log(JSON.stringify(keygen(), null, 2));
    else if (cmd === 'override') console.log(JSON.stringify(override(arg, flags), null, 2));
    else console.log('usage: node src/claims.js evaluate [claims.json] | verify [receipt|all] | replay <receipt> | keygen | override <receipt> --actor A --decision D --scope S --reason R');
  } catch (e) { console.error('ERROR: ' + e.message); process.exit(1); }
}
