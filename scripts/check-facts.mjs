// Fact checker (PROMPT.md 10.3). Run with `npm run check`.
//   • Every fact ID referenced in slides.js exists in facts.js.
//   • Every vendor-reported fact cited on a slide carries its qualifier text.
//   • Every fact has at least one valid source URL.
//   • The vendor-reported set matches Section 11.10 exactly.
//   • Facts with an on-screen qualifier or footnote show it where cited.
//   • No company financial wording appears in slide text (Section 0, rule 6).
//   • TODO-FACT markers are listed so they can be reported to the user.
// Exit code 1 on any failure.

import { slides, ui } from '../src/content/slides.js';
import { facts, factById, SOURCES, VENDOR_REPORTED_IDS } from '../src/content/facts.js';
import { collectTextBlocks } from '../src/content/termMatcher.js';

const errors = [];
const warnings = [];
const todo = [];
const FACT_ID_RE = /(?<![A-Za-z0-9_-])F-[A-Z0-9]+(?:-[A-Z0-9]+)*(?![A-Za-z0-9_])/g;
const FINANCIAL_RE = /\b(revenue|profit|backlog|share price|stock price|earnings|EBITDA|market cap(?:italization)?|dividend)\b/i;

// ── facts.js itself ─────────────────────────────────────────────
const ids = new Set();
for (const f of facts) {
  if (ids.has(f.id)) errors.push(`${f.id}: duplicate fact ID`);
  ids.add(f.id);
  if (!f.text) errors.push(`${f.id}: empty text`);
  if (!f.sources?.length) errors.push(`${f.id}: no source URL`);
  for (const [i, url] of (f.sources || []).entries()) {
    if (!url || !/^https:\/\/\S+$/.test(url)) errors.push(`${f.id}: source ${f.sourceIds[i]} is not a valid https URL`);
  }
  for (const s of f.sourceIds || []) if (!SOURCES[s]) errors.push(`${f.id}: unknown source ID ${s}`);
  if (f.vendorReported && !f.qualifier) errors.push(`${f.id}: vendor-reported but has no qualifier`);
}
const flagged = facts.filter((f) => f.vendorReported).map((f) => f.id).sort();
const expected = [...VENDOR_REPORTED_IDS].sort();
if (flagged.join() !== expected.join()) {
  errors.push(`vendor-reported facts ${JSON.stringify(flagged)} do not match Section 11.10 ${JSON.stringify(expected)}`);
}

// ── slides.js ───────────────────────────────────────────────────
let citations = 0;
for (const slide of slides) {
  const where = `#${slide.id}`;

  for (const kf of slide.keyFacts || []) {
    citations += 1;
    const f = factById[kf.id];
    if (!f) { errors.push(`${where}: key fact cites unknown fact ID ${kf.id}`); continue; }
    if (!kf.text) errors.push(`${where}: key fact ${kf.id} has no display text`);
    if (f.vendorReported) {
      if (!kf.qualifier) errors.push(`${where}: ${kf.id} is vendor-reported — add qualifier: "${f.qualifier}"`);
      else if (!kf.qualifier.includes(f.qualifier)) errors.push(`${where}: ${kf.id} qualifier must include "${f.qualifier}"`);
    }
    if (f.onScreenQualifier && !(kf.text || '').includes(f.onScreenQualifier)) {
      errors.push(`${where}: ${kf.id} must show "${f.onScreenQualifier}" on screen`);
    }
    if (f.footnote && !kf.footnote) errors.push(`${where}: ${kf.id} needs its footnote (see facts.js)`);
  }

  for (const { path, text } of collectTextBlocks(slide)) {
    for (const m of text.matchAll(FACT_ID_RE)) {
      if (!factById[m[0]]) errors.push(`${where} ${path}: unknown fact ID ${m[0]}`);
    }
    if (FINANCIAL_RE.test(text)) errors.push(`${where} ${path}: financial wording is not allowed: "${text.match(FINANCIAL_RE)[0]}"`);
    if (text.includes('TODO-FACT')) todo.push(`${where} ${path}`);
  }
}
for (const { path, text } of collectTextBlocks({ ui })) {
  if (FINANCIAL_RE.test(text)) errors.push(`interface ${path}: financial wording is not allowed`);
}

// ── Report ──────────────────────────────────────────────────────
console.log('Fact check');
console.log(`  ${facts.length} facts, ${Object.keys(SOURCES).length} sources, ${citations} key-fact citations on slides`);
for (const w of warnings) console.log(`  WARN ${w}`);
if (todo.length) {
  console.log(`\n  ${todo.length} TODO-FACT marker(s) — tell the user:`);
  for (const t of todo) console.log(`  TODO ${t}`);
}
if (errors.length) {
  console.log(`\n  ${errors.length} error(s):`);
  for (const e of errors) console.log(`  FAIL ${e}`);
  console.log('\nFact check FAILED');
  process.exit(1);
}
console.log('\nFact check passed: 0 errors.');
