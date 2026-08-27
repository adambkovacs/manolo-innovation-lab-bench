// RuVector efSearch sweep: the latency-recall frontier, measured, and a
// run recommendation that has to pass the gate like any other claim.
// Requires the optional ruvector dependency (npm install). Writes
// evidence/ruvector-sweep.json with origin "measured"; evaluate it with
//   node src/claims.js evaluate fixtures/claims-sweep.json
// The recommendation is never self-applied: it is evidence for a claim,
// and the verdict decides the disposition. Same corpus and PRNG as
// src/bench.js (seed 42 by default), so the frontier replays anywhere.
'use strict';
const fs = require('fs');
const path = require('path');
const ledger = require('../src/ledger');

const N = parseInt(process.env.N || '5000', 10);
const D = parseInt(process.env.D || '256', 10);
const Q = parseInt(process.env.Q || '50', 10);
const SEED = parseInt(process.env.SEED || '42', 10);
const RECALL_MIN = parseFloat(process.env.RECALL_MIN || '0.95');
const EF = (process.env.EF || '32,64,100,200').split(',').map(Number);

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(SEED);
function randUnitVec() {
  const v = new Float32Array(D);
  let s = 0;
  for (let i = 0; i < D; i++) { v[i] = rnd() * 2 - 1; s += v[i] * v[i]; }
  s = Math.sqrt(s) || 1;
  for (let i = 0; i < D; i++) v[i] /= s;
  return v;
}
function dot(a, b) { let s = 0; for (let i = 0; i < D; i++) s += a[i] * b[i]; return s; }
function top10(query, corpus) {
  const scores = new Float64Array(N);
  for (let i = 0; i < N; i++) scores[i] = dot(query, corpus[i]);
  const idx = Array.from({ length: N }, (_, i) => i);
  idx.sort((x, y) => scores[y] - scores[x]);
  return idx.slice(0, 10);
}
function pct(arr, p) {
  const a = [...arr].sort((x, y) => x - y);
  return a[Math.min(a.length - 1, Math.floor((p / 100) * a.length))];
}

async function run() {
  let VectorDb;
  try {
    ({ VectorDb } = require('ruvector'));
  } catch (_) {
    console.log(JSON.stringify({
      status: 'not_installed',
      hint: 'npm install pulls the optional ruvector dependency; the core needs nothing',
    }, null, 2));
    return;
  }

  const base = Array.from({ length: N }, randUnitVec);
  const queries = Array.from({ length: Q }, randUnitVec);
  const truth = queries.map((q) => top10(q, base));
  const items = base.map((v, i) => ({ id: String(i), vector: Array.from(v) }));
  const storePath = path.join(__dirname, '..', 'results', 'ruvector-sweep.db');

  const sweep = [];
  for (const efSearch of EF) {
    try { fs.rmSync(storePath, { recursive: true, force: true }); } catch (_) { /* fresh */ }
    const db = new VectorDb({
      dimensions: D,
      storagePath: storePath,
      hnswConfig: { m: 32, efConstruction: 200, efSearch, maxElements: N + 16 },
    });
    try { await db.insertBatch(items); }
    catch (_) { for (const it of items) await db.insert(it); }
    const lat = [];
    let hits = 0;
    for (let i = 0; i < Q; i++) {
      const t0 = process.hrtime.bigint();
      const got = await db.search({ vector: Array.from(queries[i]), k: 10 });
      lat.push(Number(process.hrtime.bigint() - t0) / 1e6);
      const t = new Set(truth[i]);
      for (const g of got) if (t.has(parseInt(g.id, 10))) hits++;
    }
    sweep.push({
      efSearch,
      p50_ms: +pct(lat, 50).toFixed(3),
      p95_ms: +pct(lat, 95).toFixed(3),
      recall_at_10: +(hits / (Q * 10)).toFixed(4),
    });
  }
  try { fs.rmSync(storePath, { recursive: true, force: true }); } catch (_) { /* done */ }

  const qualified = sweep.filter((r) => r.recall_at_10 >= RECALL_MIN);
  const recommendation = qualified.length
    ? { rule: `lowest p50 with recall_at_10 >= ${RECALL_MIN}`, ...qualified.reduce((a, b) => (a.p50_ms <= b.p50_ms ? a : b)) }
    : { rule: `lowest p50 with recall_at_10 >= ${RECALL_MIN}`, none_qualified: true };

  const out = {
    origin: 'measured',
    generated: new Date().toISOString(),
    config: { N, D, Q, seed: SEED, node: process.version, m: 32, efConstruction: 200 },
    note: 'efSearch frontier for RuVector HNSW on the seeded bench corpus. The recommendation is selected by the stated rule and is not self-applied: evaluate fixtures/claims-sweep.json and the gate decides.',
    sweep,
    recommendation,
  };
  const evPath = path.join(__dirname, '..', 'evidence', 'ruvector-sweep.json');
  fs.writeFileSync(evPath, JSON.stringify(out, null, 2));
  ledger.append('sweep', {
    config: out.config, points: sweep.length,
    recommendation: recommendation.none_qualified ? null : { efSearch: recommendation.efSearch, p50_ms: recommendation.p50_ms, recall_at_10: recommendation.recall_at_10 },
  });
  console.log(JSON.stringify(out, null, 2));
}

if (require.main === module) {
  run().catch((e) => { console.error(e); process.exit(1); });
}
module.exports = { run };
