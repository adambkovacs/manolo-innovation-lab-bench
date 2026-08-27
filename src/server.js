// MANOLO-Bench API server. Zero dependencies: node src/server.js and go.
// Implements the openapi.yaml contract: /benchmark, /assess, /provenance, /verify.
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const ledger = require('./ledger');
const assess = require('./assess');
const claims = require('./claims');

const PORT = parseInt(process.env.PORT || '8787', 10);
const ROOT = path.join(__dirname, '..');

function json(res, code, body) {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(body, null, 2));
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === 'GET' && url.pathname === '/') {
    return json(res, 200, {
      name: 'MANOLO-Bench',
      spec: 'openapi.yaml',
      endpoints: ['POST /benchmark', 'GET /assess', 'GET /provenance', 'GET /verify', 'POST /claims/evaluate', 'GET /receipts'],
      note: 'Community-proposed API for the MANOLO benchmark and trustworthiness pillars. Not affiliated with the MANOLO consortium.',
    });
  }

  if (req.method === 'POST' && url.pathname === '/benchmark') {
    // Live run, sized to finish in seconds during a demo. Clamp the corpus
    // size so a stray query cannot pin the machine mid-presentation.
    const n = Math.min(20000, Math.max(100, parseInt(url.searchParams.get('n'), 10) || 2000));
    const r = spawnSync('node', [path.join(__dirname, 'bench.js')], {
      env: { ...process.env, N: String(n), Q: '30' },
      timeout: 60000,
    });
    if (r.status !== 0) {
      return json(res, 500, { error: 'benchmark failed', detail: String(r.stderr) });
    }
    const results = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'results', 'results.json'), 'utf8')
    );
    return json(res, 200, results);
  }

  if (req.method === 'GET' && url.pathname === '/assess') {
    return json(res, 200, assess.run());
  }

  if (req.method === 'GET' && url.pathname === '/provenance') {
    return json(res, 200, { records: ledger.readChain() });
  }

  if (req.method === 'GET' && url.pathname === '/verify') {
    return json(res, 200, ledger.verify());
  }

  if (req.method === 'POST' && url.pathname === '/claims/evaluate') {
    const set = url.searchParams.get('set');
    const cp = set === 'block'
      ? path.join(ROOT, 'fixtures', 'claims-block.json') : undefined;
    try { return json(res, 200, claims.evaluate(cp)); }
    catch (e) { return json(res, 500, { error: String(e.message) }); }
  }

  if (req.method === 'GET' && url.pathname === '/receipts') {
    const files = claims.listReceipts();
    const latest = files.length
      ? JSON.parse(fs.readFileSync(path.join(ROOT, 'results', 'receipts', files[files.length - 1]), 'utf8'))
      : null;
    return json(res, 200, { files, latest, verification: claims.verifyAll() });
  }

  return json(res, 404, { error: 'not found', see: 'openapi.yaml' });
});

server.listen(PORT, () => {
  console.log(`MANOLO-Bench API on http://localhost:${PORT}`);
  console.log('Open demo/dashboard.html in a browser for the visual console.');
});
