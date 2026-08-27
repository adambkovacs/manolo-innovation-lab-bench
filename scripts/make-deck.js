// Generates presentation.pptx, the submission deck. Even the slides replay.
// Run: node scripts/make-deck.js
'use strict';
const pptxgen = require('pptxgenjs');

const INK = '2A2440', BG = 'F7F5FB', DARK = '241E38', PURPLE = '5B4BC4';
const LAV = 'CDC5EE', LAV2 = 'E4DFF6', MUT = '6A6480', WHITE = 'FFFFFF';
const OK = '1E7F5C', OKBG = 'DFF0E8', WARN = '8A6A15', WARNBG = 'F5EBD3';
const BAD = 'B03030', BADBG = 'F6E2E2';
const SANS = 'Calibri', MONO = 'Courier New';

const p = new pptxgen();
p.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5

function chip(s, x, y, label, bg, fg, w) {
  s.addText(label, {
    x, y, w: w || 1.25, h: 0.34, shape: p.ShapeType.roundRect, rectRadius: 0.17,
    fill: { color: bg }, color: fg, fontFace: MONO, fontSize: 10.5, bold: true,
    align: 'center', valign: 'middle', isTextBox: true, margin: 0,
  });
}
function title(s, text, color) {
  s.addText(text, { x: 0.6, y: 0.42, w: 12.13, h: 0.75, fontFace: SANS,
    fontSize: 32, bold: true, color: color || INK, isTextBox: true, margin: 0 });
}
function card(s, x, y, w, h, fill) {
  s.addShape(p.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.09,
    fill: { color: fill || WHITE }, line: { color: 'E3DEF2', width: 0.75 },
    shadow: { type: 'outer', color: '2A2440', opacity: 0.10, blur: 6, offset: 2, angle: 90 } });
}

// Slide 1, dark title
let s = p.addSlide();
s.background = { color: DARK };
s.addText('A claim is not evidence', { x: 0.9, y: 2.0, w: 11.5, h: 1.0,
  fontFace: SANS, fontSize: 44, bold: true, color: WHITE, isTextBox: true, margin: 0 });
s.addText('until it carries a receipt.', { x: 0.9, y: 2.95, w: 11.5, h: 0.6,
  fontFace: SANS, fontSize: 24, italic: true, color: LAV, isTextBox: true, margin: 0 });
s.addText('MANOLO-Bench + TRACE receipts', { x: 0.9, y: 4.35, w: 11.5, h: 0.45,
  fontFace: MONO, fontSize: 16, color: LAV, isTextBox: true, margin: 0 });
s.addText('Innovation Lab · Thessaloniki · August 2026 · Apache-2.0', { x: 0.9, y: 4.85,
  w: 11.5, h: 0.35, fontFace: SANS, fontSize: 12, color: '9B93B8', isTextBox: true, margin: 0 });
chip(s, 0.9, 5.7, 'PASS', OKBG, OK); chip(s, 2.3, 5.7, 'REVIEW', WARNBG, WARN);
chip(s, 3.7, 5.7, 'BLOCK', BADBG, BAD); chip(s, 5.1, 5.7, 'SIGNED', LAV2, PURPLE);
s.addNotes('Open with pre-work transparency using the tool itself: the ledger timestamps show what predates the session and what was built inside it. Write the receipt head hash on the whiteboard now.');

// Slide 2, the anchor
s = p.addSlide(); s.background = { color: BG };
title(s, 'Fourteen of fifteen claims lack direct evidence');
s.addText('14 / 15', { x: 0.6, y: 1.55, w: 4.0, h: 1.45, fontFace: SANS, fontSize: 84,
  bold: true, color: PURPLE, isTextBox: true, margin: 0 });
s.addText('claims in the framework\'s published assessment table carry no direct evidence, in the assessment itself.',
  { x: 0.6, y: 3.15, w: 3.9, h: 1.4, fontFace: SANS, fontSize: 14, color: INK, isTextBox: true, margin: 0 });
s.addText('MANOLO D5.1 · section 7.2.5 · Table 7 · pages 47 to 49', { x: 0.6, y: 4.7,
  w: 3.9, h: 0.6, fontFace: MONO, fontSize: 10.5, color: MUT, isTextBox: true, margin: 0 });
const rows2 = [
  ['CLAIM-4', 'The system maintains sub-100 ms real-time latency', 'no direct evidence', WARNBG, WARN],
  ['CLAIM-7', 'Model compression maintains accuracy while cutting compute', 'no direct evidence', WARNBG, WARN],
  ['CLAIM-2', '87.08% PSG and 86.64% wearable match, BOAS dataset', 'published evidence', OKBG, OK],
];
rows2.forEach(([id, txt, tag, tbg, tfg], i) => {
  const y = 1.55 + i * 1.35;
  card(s, 4.95, y, 7.78, 1.15);
  s.addText(id, { x: 5.2, y: y + 0.16, w: 1.5, h: 0.4, fontFace: MONO, fontSize: 13,
    bold: true, color: INK, isTextBox: true, margin: 0 });
  s.addText(txt, { x: 5.2, y: y + 0.55, w: 5.2, h: 0.5, fontFace: SANS, fontSize: 11.5,
    color: MUT, isTextBox: true, margin: 0 });
  chip(s, 10.75, y + 0.4, tag, tbg, tfg, 1.75);
});
s.addText('The deliverable documented this gap itself. We built the instrument for it.',
  { x: 0.6, y: 6.15, w: 12.13, h: 0.5, fontFace: SANS, fontSize: 15, bold: true,
    color: INK, isTextBox: true, margin: 0 });
s.addNotes('Say early: the subject is the framework assessment loop. The published table is the worked example, and the use case behind it is one of several, never the target. The deliverable documented this gap itself.');

// Slide 3, how it works
s = p.addSlide(); s.background = { color: BG };
title(s, 'Evidence origin decides before arithmetic does');
const boxes = [
  ['Bench measures', 'seeded, replayable, one command'],
  ['Gate judges', 'origin check first, then threshold'],
  ['Receipts remember', 'Ed25519, digest-bound, chained'],
];
boxes.forEach(([h, b], i) => {
  const x = 0.6 + i * 4.4;
  card(s, x, 1.45, 3.55, 1.15, WHITE);
  s.addText(h, { x: x + 0.25, y: 1.6, w: 3.1, h: 0.4, fontFace: SANS, fontSize: 15,
    bold: true, color: PURPLE, isTextBox: true, margin: 0 });
  s.addText(b, { x: x + 0.25, y: 2.0, w: 3.1, h: 0.4, fontFace: SANS, fontSize: 11.5,
    color: MUT, isTextBox: true, margin: 0 });
  if (i < 2) s.addShape(p.ShapeType.line, { x: x + 3.62, y: 2.02, w: 0.7, h: 0,
    line: { color: PURPLE, width: 2, endArrowType: 'triangle' } });
});
s.addText('Evidence origins', { x: 0.6, y: 3.0, w: 3.0, h: 0.4, fontFace: SANS,
  fontSize: 13, bold: true, color: INK, isTextBox: true, margin: 0 });
chip(s, 3.0, 3.02, 'measured', OKBG, OK, 1.5); chip(s, 4.65, 3.02, 'published', LAV2, PURPLE, 1.5);
chip(s, 6.3, 3.02, 'upstream', WARNBG, WARN, 1.5); chip(s, 7.95, 3.02, 'assumed', WARNBG, WARN, 1.5);
s.addText('A threshold match from an unaccepted origin is REVIEW, never PASS. A quote is not a measurement.',
  { x: 0.6, y: 3.55, w: 12.1, h: 0.4, fontFace: SANS, fontSize: 13, color: INK, isTextBox: true, margin: 0 });
const vd = [['PASS', OKBG, OK, 'CONTINUE', OKBG, OK], ['REVIEW', WARNBG, WARN, 'PAUSE', WARNBG, WARN],
  ['FAIL', BADBG, BAD, 'PAUSE', WARNBG, WARN], ['BLOCK', BADBG, BAD, 'STOP', BADBG, BAD]];
vd.forEach(([v, vb, vf, d, db, df], i) => {
  const x = 0.6 + (i % 2) * 6.3, y = 4.25 + Math.floor(i / 2) * 0.65;
  chip(s, x, y, v, vb, vf, 1.35);
  s.addText('maps to', { x: x + 1.5, y: y + 0.02, w: 1.0, h: 0.32, fontFace: SANS,
    fontSize: 11, color: MUT, isTextBox: true, margin: 0, valign: 'middle' });
  chip(s, x + 2.55, y, d, db, df, 1.5);
});
s.addText('Only REVIEW is overridable: named actor, reason, scope. The override is itself a signed receipt. Integrity failures are never overridable.',
  { x: 0.6, y: 5.95, w: 12.1, h: 0.7, fontFace: SANS, fontSize: 13, bold: true,
    color: INK, isTextBox: true, margin: 0 });
s.addNotes('Show only three live outcomes in the demo: CONTINUE, PAUSE, STOP. Keep the state machine simple in the room.');

// Slide 4, measured evidence
s = p.addSlide(); s.background = { color: BG };
title(s, '3.94x smaller, 3.4x faster, every number replays');
s.addChart(p.ChartType.bar, [{
  name: 'p50 latency (ms)',
  labels: ['fp32 exact', 'int8 quantized', 'RuVector HNSW'],
  values: [3.66, 3.38, 1.076],
}], {
  x: 0.6, y: 1.55, w: 6.4, h: 4.3, barDir: 'col', showLegend: false,
  showValue: true, dataLabelPosition: 'outEnd', dataLabelColor: INK, dataLabelFontSize: 11,
  dataLabelFontFace: MONO, dataLabelFormatCode: '0.00', chartColors: ['CDC5EE', '9A8CE0', '5B4BC4'],
  catAxisLabelColor: INK, catAxisLabelFontSize: 11, catAxisLabelFontFace: SANS,
  valAxisLabelColor: MUT, valAxisLabelFontSize: 10,
  valGridLine: { color: 'E3DEF2', size: 0.75 }, catGridLine: { style: 'none' },
  showTitle: true, title: 'Query latency, p50 ms (seed 42, N=5000, D=256)',
  titleColor: MUT, titleFontSize: 11, titleFontFace: SANS,
});
s.addText('3.94x', { x: 7.5, y: 1.5, w: 5.2, h: 0.9, fontFace: SANS, fontSize: 52,
  bold: true, color: PURPLE, isTextBox: true, margin: 0 });
s.addText('memory reduction: 1024 to 260 bytes per vector', { x: 7.5, y: 2.4, w: 5.2,
  h: 0.4, fontFace: SANS, fontSize: 12.5, color: INK, isTextBox: true, margin: 0 });
s.addText('0.988 / 0.944', { x: 7.5, y: 3.05, w: 5.2, h: 0.7, fontFace: SANS,
  fontSize: 34, bold: true, color: INK, isTextBox: true, margin: 0 });
s.addText('recall@10, int8 and HNSW, against exact ground truth', { x: 7.5, y: 3.75,
  w: 5.2, h: 0.4, fontFace: SANS, fontSize: 12.5, color: INK, isTextBox: true, margin: 0 });
s.addText('HNSW latency crosses runtimes (native SIMD Rust vs a JS loop): read it as packaged-system latency for a deployment decision.',
  { x: 7.5, y: 4.35, w: 5.2, h: 0.9, fontFace: SANS, fontSize: 10.5, italic: true,
    color: MUT, isTextBox: true, margin: 0 });
s.addText('gate tested: 6/6 verdicts · 3/3 tamper caught · 3/3 canonicalization · verify p95 under 0.25 ms · 0 network calls',
  { x: 0.6, y: 6.35, w: 12.1, h: 0.4, fontFace: MONO, fontSize: 11.5, color: PURPLE,
    isTextBox: true, margin: 0 });
s.addNotes('SESSION SLOT: after the hour-1 rerun, update the three bar values and the recall numbers with the live run. State the runtime caveat unprompted.');

// Slide 5, the demo
s = p.addSlide(); s.background = { color: BG };
title(s, 'Watch the baseline fail open');
const demo = [
  ['The naive checker passes an upstream 82 ms quote against the CLAIM-4 pattern. The gate answers REVIEW and PAUSE, naming the origin.', 'REVIEW', WARNBG, WARN],
  ['Placement pair: identical claims, two zones. Sweden CONTINUE, Greece STOP under the workload-declared 100 g budget (Ember 2024, Eurostat 2025-S2).', 'STOP', BADBG, BAD],
  ['The cost claim meets its threshold and still pauses: measured CPU time, assumed wattage, upstream price. Arithmetic is not evidence.', 'PAUSE', WARNBG, WARN],
  ['Edit one digit of the evidence, verify: INVALID, mismatch named. Undo, green.', 'INVALID', BADBG, BAD],
  ['Receipt-0007: the one evidenced claim in their table, CLAIM-2, already carries a receipt.', 'PASS', OKBG, OK],
];
demo.forEach(([txt, tag, tbg, tfg], i) => {
  const y = 1.42 + i * 1.02;
  s.addShape(p.ShapeType.ellipse, { x: 0.6, y: y + 0.12, w: 0.52, h: 0.52,
    fill: { color: PURPLE } });
  s.addText(String(i + 1), { x: 0.6, y: y + 0.12, w: 0.52, h: 0.52, fontFace: SANS,
    fontSize: 16, bold: true, color: WHITE, align: 'center', valign: 'middle',
    isTextBox: true, margin: 0 });
  s.addText(txt, { x: 1.35, y: y, w: 9.55, h: 0.9, fontFace: SANS, fontSize: 12.5,
    color: INK, isTextBox: true, margin: 0, valign: 'middle' });
  chip(s, 11.15, y + 0.22, tag, tbg, tfg, 1.55);
});
s.addNotes('SESSION SLOT: rerun bench and evaluate live in hour 1 so these carry in-session timestamps. Commands: node src/baseline.js fixtures/claims-upstream.json, then evaluate the same fixture, then claims-place-gr and -se, then the tamper beat. Rehearse to 20 seconds per beat.');

// Slide 6, the boundary
s = p.addSlide(); s.background = { color: BG };
title(s, 'The missing joint between D2.1, D4.1, and D6.1');
const cols = [
  ['D2.1 Data Operations Manager', 'Lineage: where artifacts came from. No verdicts.'],
  ['D4.1 Policy Manager', 'Alerts on policy violations, logged. No claim-verdict artifact.'],
  ['D6.1 CAE in Z-Inspection®', 'Claims, arguments, evidence: qualitative and socio-technical.'],
];
cols.forEach(([h, b], i) => {
  const x = 0.6 + i * 4.18;
  card(s, x, 1.45, 3.9, 1.75);
  s.addText(h, { x: x + 0.25, y: 1.62, w: 3.4, h: 0.65, fontFace: SANS, fontSize: 14,
    bold: true, color: INK, isTextBox: true, margin: 0 });
  s.addText(b, { x: x + 0.25, y: 2.3, w: 3.4, h: 0.8, fontFace: SANS, fontSize: 11.5,
    color: MUT, isTextBox: true, margin: 0 });
});
s.addShape(p.ShapeType.line, { x: 6.66, y: 3.3, w: 0, h: 0.55,
  line: { color: PURPLE, width: 2, endArrowType: 'triangle' } });
card(s, 0.6, 4.0, 12.13, 1.35, LAV2);
s.addText('The TRACE receipt binds claim + threshold + measured value + evidence digest, signed, chained, replayable by anyone from the repo.',
  { x: 0.95, y: 4.25, w: 11.4, h: 0.9, fontFace: SANS, fontSize: 16, bold: true,
    color: INK, isTextBox: true, margin: 0, valign: 'middle' });
s.addText('MANOLO-shaped and adapter-ready, never claimed compatible · speaks IPD YAML and AIWorkloadID · no receipts, attestation, or signing anywhere in the nine public deliverables (checked)',
  { x: 0.6, y: 5.75, w: 12.13, h: 0.7, fontFace: SANS, fontSize: 11.5, color: MUT,
    isTextBox: true, margin: 0 });
s.addNotes('If asked "is this not just MLflow or model cards": lineage says where from, alerts say a rule fired, cards describe. None bind a verdict that survives after the fact.');

// Slide 7, honest limits
s = p.addSlide(); s.background = { color: BG };
title(s, 'We score ourselves REVIEW where we are REVIEW');
const lims = [
  'Energy is not metered in joules. Our own claim MB-ENE-01 fails on us, on purpose.',
  'Single local keypair, no PKI. Tamper-evident, not tamper-proof: the head hash goes public at session start.',
  'Origin labels are declared, not proven. The gate enforces the declared policy, it cannot detect a mislabeled origin.',
  'Synthetic seeded corpus. Recall on real embedding distributions will differ.',
  'Claims here are about our own system, until the use-case owners declare theirs.',
];
lims.forEach((txt, i) => {
  const y = 1.5 + i * 0.92;
  chip(s, 0.6, y + 0.1, 'REVIEW', WARNBG, WARN, 1.35);
  s.addText(txt, { x: 2.2, y: y, w: 10.5, h: 0.8, fontFace: SANS, fontSize: 13,
    color: INK, isTextBox: true, margin: 0, valign: 'middle' });
});
s.addText('Apache-2.0 · zero-dependency core · the adversarial suite ships in the repo',
  { x: 0.6, y: 6.35, w: 12.1, h: 0.4, fontFace: MONO, fontSize: 11.5, color: MUT,
    isTextBox: true, margin: 0 });
s.addNotes('Read these plainly. Scoring ourselves REVIEW where we are REVIEW is the credibility of everything else.');

// Slide 8, dark close
s = p.addSlide(); s.background = { color: DARK };
s.addText('Adopt the contract before Trust in the Loop', { x: 0.9, y: 1.9, w: 11.5,
  h: 0.9, fontFace: SANS, fontSize: 34, bold: true, color: WHITE, isTextBox: true, margin: 0 });
s.addText('Thirty minutes with WP5: point the contract at the Table 7 claims, the use-case owners declare the thresholds, the receipts recompute.',
  { x: 0.9, y: 3.0, w: 11.0, h: 0.8, fontFace: SANS, fontSize: 16, color: LAV,
    isTextBox: true, margin: 0 });
s.addText('Ready to hand over. Dublin, October 20.', { x: 0.9, y: 3.95, w: 11.0, h: 0.5,
  fontFace: SANS, fontSize: 16, bold: true, color: WHITE, isTextBox: true, margin: 0 });
s.addText('github.com/adambkovacs/manolo-innovation-lab-bench · Apache-2.0 · every verdict replays from the repo',
  { x: 0.9, y: 4.75, w: 11.0, h: 0.45, fontFace: MONO, fontSize: 13, color: LAV,
    isTextBox: true, margin: 0 });
chip(s, 0.9, 5.65, 'PASS', OKBG, OK); chip(s, 2.3, 5.65, 'CONTINUE', OKBG, OK, 1.5);
chip(s, 3.95, 5.65, 'SIGNED', LAV2, PURPLE);
s.addNotes('Hand ADOPTION.md over here, printed or linked. Say the October 20 sentence in person. Never ask for an invitation.');

p.writeFile({ fileName: __dirname + '/../presentation.pptx' })
  .then(() => console.log('presentation.pptx written'));
