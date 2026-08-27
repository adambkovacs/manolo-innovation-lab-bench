// Tamper-evident append-only provenance ledger (SHA-256 hash chain).
// Zero dependencies. Implements the MANOLO data-management pillar:
// distributed tracking of assets and their provenance.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const LEDGER = path.join(__dirname, '..', 'results', 'ledger.jsonl');

function sha256(s) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

// Deterministic serialization of the hashed fields, in fixed order.
function canon(rec) {
  return JSON.stringify({
    index: rec.index,
    ts: rec.ts,
    type: rec.type,
    payload: rec.payload,
  });
}

function readChain() {
  if (!fs.existsSync(LEDGER)) return [];
  return fs
    .readFileSync(LEDGER, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function append(type, payload) {
  const chain = readChain();
  const prev_hash = chain.length ? chain[chain.length - 1].hash : 'GENESIS';
  const rec = {
    index: chain.length,
    ts: new Date().toISOString(),
    type,
    payload,
    prev_hash,
  };
  rec.hash = sha256(prev_hash + canon(rec));
  fs.mkdirSync(path.dirname(LEDGER), { recursive: true });
  fs.appendFileSync(LEDGER, JSON.stringify(rec) + '\n');
  return rec;
}

// Walks the chain. Any edited payload, reordered record, or broken link
// is detected and reported with the index where integrity fails.
function verify() {
  const chain = readChain();
  let prev = 'GENESIS';
  for (const rec of chain) {
    const expected = sha256(prev + canon(rec));
    if (rec.prev_hash !== prev || rec.hash !== expected) {
      return { valid: false, break_index: rec.index, records: chain.length };
    }
    prev = rec.hash;
  }
  return { valid: true, records: chain.length };
}

module.exports = { append, verify, readChain, LEDGER };

if (require.main === module) {
  const cmd = process.argv[2];
  if (cmd === 'verify') console.log(JSON.stringify(verify(), null, 2));
  else if (cmd === 'show') console.log(JSON.stringify(readChain(), null, 2));
  else console.log('usage: node src/ledger.js [verify|show]');
}
