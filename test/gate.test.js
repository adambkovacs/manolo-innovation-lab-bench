// Adversarial test suite for the TRACE receipt gate.
// Predeclared acceptance gates, asserted below, no tuning after the fact:
//   verdict fixtures ....... 6/6 correct (PASS, BLOCK, FAIL, borderline
//                            REVIEW, missing REVIEW, upstream REVIEW)
//   canonicalization ....... 3/3 semantically equal variants, one digest
//   tamper mutations ....... 3/3 signature failures on mutated receipts
//   duplicate claim ids .... rejected deterministically
//   override integrity ..... tampered evidence refused, never overridable
//   sign p95 / verify p95 .. under 10 ms over 500 local iterations
//   outbound network ....... zero attempts, measured: net, http, https,
//                            tls, and fetch are tripwired for the whole
//                            suite and the counter must read zero
// Tests never write receipts or ledger records: verdict logic is exercised
// through exported internals, tampering through in-memory mutation of a
// committed receipt, so the provenance chain stays clean.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const net = require('net');
const http = require('http');
const https = require('https');
const tls = require('tls');

// Tripwire every outbound network surface before any project code loads.
// An attempt increments the counter and fails loudly; the final test
// asserts the counter still reads zero and records it as a measured
// metric, so "zero network calls" is an observation, not an assertion.
let networkAttempts = 0;
const trip = (name) => function tripped() {
  networkAttempts += 1;
  throw new Error('outbound network attempt via ' + name);
};
net.Socket.prototype.connect = trip('net.Socket.connect');
net.connect = trip('net.connect');
http.request = trip('http.request');
http.get = trip('http.get');
https.request = trip('https.request');
https.get = trip('https.get');
tls.connect = trip('tls.connect');
if (typeof globalThis.fetch === 'function') globalThis.fetch = trip('fetch');

const { evaluate, verifyReceipt, override, _internals } = require('../src/claims.js');
const { canon, sha256, evaluateClaim, DISPOSITION } = _internals;

const ROOT = path.join(__dirname, '..');
const claim = (over) => ({ id: 'T', metric: 'm', comparator: '<', threshold: 5, ...over });

test('verdict fixtures: 6/6', () => {
  const cases = [
    [claim({}), { m: 3 }, 'measured', 'PASS'],
    [claim({ hard: true }), { m: 9 }, 'measured', 'BLOCK'],
    [claim({}), { m: 9 }, 'measured', 'FAIL'],
    [claim({ comparator: '>=', review_margin: 0.02 }), { m: 4.99 }, 'measured', 'REVIEW'],
    [claim({ metric: 'absent' }), { m: 3 }, 'measured', 'REVIEW'],
    [claim({}), { origin: 'upstream', m: 3 }, 'measured', 'REVIEW'],
  ];
  for (const [c, ev, docOrigin, expected] of cases) {
    const v = evaluateClaim(c, ev, docOrigin);
    assert.strictEqual(v.verdict, expected, JSON.stringify({ c, ev, got: v }));
    assert.ok(DISPOSITION[v.verdict], 'every verdict maps to a disposition');
  }
});

test('canonicalization invariance: 3/3', () => {
  const a = { b: 1, a: [2, { y: 3, x: 4 }], c: 'z' };
  const b = { c: 'z', a: [2, { x: 4, y: 3 }], b: 1 };
  const c = JSON.parse(JSON.stringify(a));
  const digests = new Set([sha256(canon(a)), sha256(canon(b)), sha256(canon(c))]);
  assert.strictEqual(digests.size, 1, 'key order must not change the digest');
  assert.throws(() => canon({ x: NaN }), /non-finite/);
});

test('tamper mutations: 3/3 signature failures', () => {
  const file = path.join(ROOT, 'results', 'receipts', 'receipt-0001.json');
  const original = JSON.parse(fs.readFileSync(file, 'utf8'));
  const check = (r) => {
    const { signature, ...body } = r;
    return crypto.verify(null, Buffer.from(canon(body)),
      crypto.createPublicKey(r.public_key), Buffer.from(signature, 'base64'));
  };
  assert.strictEqual(check(original), true, 'untouched receipt must verify');
  const mutations = [
    (r) => { r.verdicts[0].measured = 999; },
    (r) => { r.created = '1999-01-01T00:00:00.000Z'; },
    (r) => { r.summary.PASS = (r.summary.PASS || 0) + 1; },
  ];
  for (const mutate of mutations) {
    const copy = JSON.parse(JSON.stringify(original));
    mutate(copy);
    assert.strictEqual(check(copy), false, 'mutated receipt must fail');
  }
});

test('duplicate claim ids rejected before any write', () => {
  const tmp = path.join(ROOT, 'fixtures', 'tmp-dup.json');
  fs.writeFileSync(tmp, JSON.stringify({
    workload_id: 'w', evidence: 'results/results.json', evidence_origin: 'measured',
    claims: [claim({ id: 'D1' }), claim({ id: 'D1' })],
  }));
  const before = fs.readdirSync(path.join(ROOT, 'results', 'receipts')).length;
  assert.throws(() => evaluate(tmp), /duplicate claim id/);
  const after = fs.readdirSync(path.join(ROOT, 'results', 'receipts')).length;
  assert.strictEqual(before, after, 'no receipt may be written on rejection');
  fs.unlinkSync(tmp);
});

test('sign and verify micro-benchmark: p95 under 10 ms', () => {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
  const body = JSON.parse(fs.readFileSync(
    path.join(ROOT, 'results', 'receipts', 'receipt-0001.json'), 'utf8'));
  delete body.signature;
  const buf = Buffer.from(canon(body));
  const signMs = [], verMs = [];
  for (let i = 0; i < 500; i++) {
    let t = process.hrtime.bigint();
    const sig = crypto.sign(null, buf, privateKey);
    signMs.push(Number(process.hrtime.bigint() - t) / 1e6);
    t = process.hrtime.bigint();
    crypto.verify(null, buf, publicKey, sig);
    verMs.push(Number(process.hrtime.bigint() - t) / 1e6);
  }
  const p = (arr, q) => arr.slice().sort((x, y) => x - y)[Math.floor(q * arr.length)];
  const metrics = {
    generated: new Date().toISOString(), iterations: 500,
    receipt_bytes: fs.statSync(path.join(ROOT, 'results', 'receipts', 'receipt-0001.json')).size,
    sign_p50_ms: +p(signMs, 0.50).toFixed(4), sign_p95_ms: +p(signMs, 0.95).toFixed(4),    verify_p50_ms: +p(verMs, 0.50).toFixed(4), verify_p95_ms: +p(verMs, 0.95).toFixed(4),
  };  fs.writeFileSync(path.join(ROOT, 'results', 'gate-metrics.json'),
    JSON.stringify(metrics, null, 2));
  assert.ok(metrics.sign_p95_ms < 10 && metrics.verify_p95_ms < 10, JSON.stringify(metrics));
});

test('override refuses tampered evidence: integrity is never overridable', () => {
  const evPath = path.join(ROOT, 'results', 'results.json');
  const original = fs.readFileSync(evPath);
  try {
    fs.writeFileSync(evPath, original.toString().replace('3.66', '3.67'));
    assert.strictEqual(verifyReceipt('receipt-0006.json').evidence_intact, false,
      'tamper must be visible before the override attempt');
    assert.throws(
      () => override('receipt-0006.json',
        { actor: 't', decision: 'proceed', reason: 'r', scope: 's' }),
      /not overridable/, 'override must refuse tampered evidence');
  } finally {
    fs.writeFileSync(evPath, original);
  }
  assert.strictEqual(verifyReceipt('receipt-0006.json').valid, true,
    'evidence restored after the test');
});

test('outbound network: zero attempts, measured across the whole suite', () => {
  // One more full cycle under the tripwires, then read the counter.
  evaluateClaim(claim({}), { m: 3 }, 'measured');
  sha256(canon({ a: 1 }));
  assert.strictEqual(verifyReceipt('receipt-0001.json').signature_valid, true);
  assert.strictEqual(networkAttempts, 0, 'no outbound network attempt may occur');
  const mPath = path.join(ROOT, 'results', 'gate-metrics.json');
  const metrics = JSON.parse(fs.readFileSync(mPath, 'utf8'));
  metrics.network_calls = networkAttempts;
  fs.writeFileSync(mPath, JSON.stringify(metrics, null, 2));
});
