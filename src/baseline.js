// The naive threshold checker most pipelines actually run.
// Reads a claims set and its evidence, compares numbers, nothing else.
// It ignores evidence origin, artifact digests, workload identity, units,
// freshness, and tampering. It exists to be shown failing open next to
// the gate: a quoted number that satisfies a threshold gets PASS here
// and REVIEW / PAUSE from src/claims.js.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const cp = process.argv[2] || path.join(ROOT, 'fixtures', 'claims.json');
const doc = JSON.parse(fs.readFileSync(path.isAbsolute(cp) ? cp : path.join(ROOT, cp), 'utf8'));
const ev = JSON.parse(fs.readFileSync(path.join(ROOT, doc.evidence), 'utf8'));
const get = (o, d) => d.split('.').reduce((a, k) => (a && a[k]), o);
for (const c of doc.claims) {
  const v = get(ev, c.metric);
  const ok = { '<': v < c.threshold, '<=': v <= c.threshold,
    '>': v > c.threshold, '>=': v >= c.threshold, '==': v === c.threshold }[c.comparator];
  console.log(`${c.id}: BASELINE ${ok ? 'PASS' : 'FAIL'} (value ${v})`);
}
