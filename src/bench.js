// Reproducible efficiency benchmark. Zero dependencies for the core path.
// Baseline: exact fp32 brute-force cosine top-10 (ground truth).
// Candidate: int8 scalar quantization (per-vector scale), same search.
// Measures: p50/p95 query latency, recall@10 vs ground truth, bytes/vector.
// Seeded PRNG so every run on every machine produces the same corpus.
'use strict';
const fs = require('fs');
const path = require('path');
const ledger = require('./ledger');

const N = parseInt(process.env.N || '5000', 10); // corpus size
const D = parseInt(process.env.D || '256', 10);  // dimensions
const Q = parseInt(process.env.Q || '50', 10);   // queries
const SEED = parseInt(process.env.SEED || '42', 10);

// mulberry32: tiny deterministic PRNG for reproducibility.
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

function dot(a, b) {
  let s = 0;
  for (let i = 0; i < D; i++) s += a[i] * b[i];
  return s;
}

function quantize(v) {
  let m = 0;
  for (let i = 0; i < D; i++) if (Math.abs(v[i]) > m) m = Math.abs(v[i]);
  const scale = m > 0 ? 127 / m : 1;
  const q = new Int8Array(D);
  for (let i = 0; i < D; i++) q[i] = Math.round(v[i] * scale);
  return { q, scale };
}

function dotQ(a, b) {
  let s = 0;
  for (let i = 0; i < D; i++) s += a.q[i] * b.q[i];
  return s / (a.scale * b.scale);
}

function top10(scoreFn, query, corpus) {
  const scores = new Float64Array(N);
  for (let i = 0; i < N; i++) scores[i] = scoreFn(query, corpus[i]);
  const idx = Array.from({ length: N }, (_, i) => i);
  idx.sort((x, y) => scores[y] - scores[x]);
  return idx.slice(0, 10);
}

function pct(arr, p) {
  const a = [...arr].sort((x, y) => x - y);
  return a[Math.min(a.length - 1, Math.floor((p / 100) * a.length))];
}

async function run() {
  const base = Array.from({ length: N }, randUnitVec);
  const queries = Array.from({ length: Q }, randUnitVec);
  const baseQ = base.map(quantize);
  const queriesQ = queries.map(quantize);

  // fp32 ground truth + latency
  const truth = [];
  const latF = [];
  for (let i = 0; i < Q; i++) {
    const t0 = process.hrtime.bigint();
    truth.push(top10(dot, queries[i], base));
    latF.push(Number(process.hrtime.bigint() - t0) / 1e6);
  }

  // int8 + latency + recall@10
  const latI = [];
  let hits = 0;
  for (let i = 0; i < Q; i++) {
    const t0 = process.hrtime.bigint();
    const got = top10(dotQ, queriesQ[i], baseQ);
    latI.push(Number(process.hrtime.bigint() - t0) / 1e6);
    const t = new Set(truth[i]);
    for (const g of got) if (t.has(g)) hits++;
  }
  const recall = hits / (Q * 10);

  // Ruvnet layer: RuVector native VectorDb, benchmarked for real when the
  // optional dependency is installed. Corpus vectors are unit-normalized, so
  // euclidean and cosine rankings are identical and recall@10 is comparable
  // to the fp32 ground truth.
  let ruvector = { status: 'not_installed' };
  try {
    const { VectorDb, getBackendInfo } = require('ruvector');
    // RuVector persists to ./ruvector.db by default and silently reopens it,
    // ignoring a new dimensionality. Pin an explicit store and wipe it per
    // run so results stay reproducible. Found the hard way; see README.
    const storePath = path.join(__dirname, '..', 'results', 'ruvector-bench.db');
    try { fs.rmSync(storePath, { recursive: true, force: true }); } catch (_) { /* fresh */ }
    // Wrapper default maxElements is 10,000,000, which makes the native HNSW
    // pre-allocate ~4.4 GB before the first insert. Size it to the corpus.
    const db = new VectorDb({
      dimensions: D,
      storagePath: storePath,
      hnswConfig: { m: 32, efConstruction: 200, efSearch: 100, maxElements: N + 16 },
    });
    const items = base.map((v, i) => ({ id: String(i), vector: Array.from(v) }));
    try {
      await db.insertBatch(items);
    } catch (_) {
      for (const it of items) await db.insert(it);
    }
    const latR = [];
    let rHits = 0;
    for (let i = 0; i < Q; i++) {
      const t0 = process.hrtime.bigint();
      const got = await db.search({ vector: Array.from(queries[i]), k: 10 });
      latR.push(Number(process.hrtime.bigint() - t0) / 1e6);
      const t = new Set(truth[i]);
      for (const g of got) if (t.has(parseInt(g.id, 10))) rHits++;
    }
    let backend = null;
    try { backend = await getBackendInfo(); } catch (_) { /* optional */ }
    ruvector = {
      status: 'benchmarked',
      backend,
      p50_ms: +pct(latR, 50).toFixed(3),
      p95_ms: +pct(latR, 95).toFixed(3),
      recall_at_10: +(rHits / (Q * 10)).toFixed(4),
      bytes_per_vector: null,
      note: 'HNSW ANN, explicit config m=32, efConstruction=200, efSearch=100, maxElements=N+16. Memory footprint not measured.',
    };
  } catch (e) {
    try {
      require.resolve('ruvector');
      ruvector = { status: 'installed_error', error: String(e.message).slice(0, 160) };
    } catch (_) { /* genuinely not installed */ }
  }

  const fp32Bytes = D * 4;
  const int8Bytes = D + 4; // int8 weights + one float32 scale
  const results = {
    generated: new Date().toISOString(),
    config: { N, D, Q, seed: SEED, node: process.version },
    fp32_baseline: {
      p50_ms: +pct(latF, 50).toFixed(2),
      p95_ms: +pct(latF, 95).toFixed(2),
      bytes_per_vector: fp32Bytes,
      recall_at_10: 1.0,
    },
    int8_quantized: {
      p50_ms: +pct(latI, 50).toFixed(2),
      p95_ms: +pct(latI, 95).toFixed(2),
      bytes_per_vector: int8Bytes,
      recall_at_10: +recall.toFixed(4),
      compression_x: +(fp32Bytes / int8Bytes).toFixed(2),
    },
    ruvector,
  };

  const out = path.join(__dirname, '..', 'results', 'results.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(results, null, 2));

  ledger.append('benchmark', {
    config: results.config,
    compression_x: results.int8_quantized.compression_x,
    recall_at_10: results.int8_quantized.recall_at_10,
    fp32_p50_ms: results.fp32_baseline.p50_ms,
    int8_p50_ms: results.int8_quantized.p50_ms,
  });

  console.log(JSON.stringify(results, null, 2));
  return results;
}

if (require.main === module) {
  run().catch((e) => { console.error(e); process.exit(1); });
}
module.exports = { run };
