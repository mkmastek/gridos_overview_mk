// Abbreviation checker (PROMPT.md 10.2). Run with `npm run check`.
//
// Rule A (per text block): the first use of each abbreviation in a block is written
//   "ABBR (Full Form)", or its full form already appears earlier in that block.
// Rule B (per slide): units and organizations only need that on first use in the slide.
// Exemptions: brand names, "GridOS" after Slide 1, diagram tags (which need a tooltip).
// Text inside an expansion bracket is the full form itself and is not re-checked,
// e.g. the "VAR" inside "VVO (Volt/VAR Optimization)".
// Warns (does not fail) on ALL-CAPS tokens that are not in the glossary.
// Exit code 1 on any failure.

import { pathToFileURL } from 'node:url';
import {
  createTermIndex, analyzeBlock, collectTextBlocks, findDiagramTags, maskText,
} from '../src/content/termMatcher.js';

const snippet = (text, start, end) => {
  const a = Math.max(0, start - 30);
  const b = Math.min(text.length, end + 40);
  return `${a > 0 ? '…' : ''}${text.slice(a, b)}${b < text.length ? '…' : ''}`;
};

/** Run every rule. Returns { errors, warnings, blockCount, termCount }. */
export function checkAbbreviations({ slides, ui, legendItems, glossary, exemptions, categories }) {
  const index = createTermIndex(glossary, exemptions);
  const errors = [];
  const warnings = [];
  let blockCount = 0;

  // ── Glossary sanity ───────────────────────────────────────────
  const seenPairs = new Set();
  for (const e of glossary) {
    const where = `glossary "${e.abbr}"`;
    if (!e.abbr || !e.full) errors.push({ unit: 'glossary', path: where, abbr: e.abbr, problem: 'missing abbr or full form' });
    if (categories && !categories[e.category]) errors.push({ unit: 'glossary', path: where, abbr: e.abbr, problem: `unknown category "${e.category}"` });
    const key = `${e.abbr}|${e.full}`;
    if (seenPairs.has(key)) errors.push({ unit: 'glossary', path: where, abbr: e.abbr, problem: 'duplicate entry' });
    seenPairs.add(key);
  }

  // One unit = a slide, the interface strings, or one glossary meaning.
  // `blocks` are in reading order; Rule B state is shared across them.
  const checkUnit = (unit, blocks, { gridosExempt, tags = null, checkTags = false }) => {
    const firstInUnit = new Set();
    for (const { path, text } of blocks) {
      blockCount += 1;
      const occ = analyzeBlock(text, index, { gridosExempt });
      const firstInBlock = new Set();

      for (const o of occ) {
        if (o.inside) continue;
        const g = index.groups.get(o.abbr);
        const seen = g.perSlide ? firstInUnit : firstInBlock;
        if (seen.has(o.abbr)) continue;
        seen.add(o.abbr);
        if (!o.expanded && !o.fullBefore) {
          const rule = g.perSlide ? 'first use on this slide' : 'first use in this block';
          errors.push({
            unit, path, abbr: o.form,
            problem: `${rule} needs "${o.form} (${g.fulls[0]})"`,
            context: snippet(text, o.start, o.end),
          });
        }
      }

      // Unknown ALL-CAPS tokens → warning, so new abbreviations get added to the glossary.
      let rest = maskText(text, index, { gridosExempt: true });
      for (const o of occ) rest = rest.slice(0, o.start) + ' '.repeat(o.end - o.start) + rest.slice(o.end);
      for (const m of rest.matchAll(/(?<![A-Za-z0-9_])[A-Z]{2,6}(?![A-Za-z0-9_])/g)) {
        warnings.push({ unit, path, abbr: m[0], problem: 'ALL-CAPS token is not in the glossary or exemptions' });
      }

      // Diagram tags are exempt from expansion but must have a tooltip.
      if (checkTags) {
        for (const t of findDiagramTags(text, index)) {
          if (!tags || !tags[t.tag]) {
            errors.push({ unit, path, abbr: t.tag, problem: 'diagram tag has no tooltip — add it to this slide\'s "tags"' });
          }
        }
      }
    }
  };

  // ── Slides ────────────────────────────────────────────────────
  slides.forEach((slide, i) => {
    const gridosExempt = i + 1 > exemptions.gridosFreeAfterSlide;
    const all = collectTextBlocks(slide);
    checkUnit(`#${slide.id}`, all.filter((b) => !b.path.startsWith('tags.')), { gridosExempt, tags: slide.tags, checkTags: true });
    // Tooltip texts follow the rules too (their own unit: they are read on hover, out of order).
    checkUnit(`#${slide.id}`, all.filter((b) => b.path.startsWith('tags.')), { gridosExempt });
  });

  // ── Interface strings and legend (shared by every slide) ─────
  checkUnit('interface', collectTextBlocks({ ui, legendItems }), { gridosExempt: true });

  // ── Glossary meanings (shown in tooltips and on the glossary slide) ─
  for (const e of glossary) {
    if (e.meaning) checkUnit(`glossary ${e.abbr}`, [{ path: 'meaning', text: e.meaning }], { gridosExempt: true });
  }

  return { errors, warnings, blockCount, termCount: index.groups.size };
}

// ── CLI ─────────────────────────────────────────────────────────
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { slides, ui, legendItems } = await import('../src/content/slides.js');
  const { glossary, exemptions, CATEGORIES } = await import('../src/content/glossary.js');
  const { errors, warnings, blockCount, termCount } = checkAbbreviations({
    slides, ui, legendItems, glossary, exemptions, categories: CATEGORIES,
  });

  const print = (list, label) => {
    for (const x of list) {
      console.log(`  ${label} ${x.unit}  ${x.path}  ${x.abbr}: ${x.problem}`);
      if (x.context) console.log(`         "${x.context}"`);
    }
  };

  console.log('Abbreviation check');
  console.log(`  ${slides.length} slides, ${blockCount} text blocks, ${termCount} glossary terms`);
  if (warnings.length) {
    console.log(`\n  ${warnings.length} warning(s):`);
    print(warnings, 'WARN');
  }
  if (errors.length) {
    console.log(`\n  ${errors.length} error(s):`);
    print(errors, 'FAIL');
    console.log('\nAbbreviation check FAILED');
    process.exit(1);
  }
  console.log('\nAbbreviation check passed: 0 errors.');
}
