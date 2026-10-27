// "Terms on this slide" — auto-generated from the glossary by scanning every text block
// of the slide (PROMPT.md 2.1 rule 4). Also lists diagram tags (SW2, S3 …) with their tooltips.
// Shares its matcher with scripts/check-abbreviations.mjs, so the strip and the checker agree.

import { analyzeBlock, collectTextBlocks, findDiagramTags } from '../content/termMatcher.js';

/** Collect terms in reading order: [{ abbr, fulls: [..] }] and tags: [{ tag, tip }] */
export function collectSlideTerms(slide, index, extraTexts = []) {
  const blocks = [...collectTextBlocks(slide), ...extraTexts.map((text) => ({ text }))];
  const order = [];
  const meanings = new Map(); // abbr → Set of full forms used on the slide
  const tags = [];
  const seenTags = new Set();

  for (const { text } of blocks) {
    for (const o of analyzeBlock(text, index)) {
      if (!meanings.has(o.abbr)) {
        meanings.set(o.abbr, new Set());
        order.push(o.abbr);
      }
      if (o.meaning) meanings.get(o.abbr).add(o.meaning);
    }
    for (const t of findDiagramTags(text, index)) {
      if (!seenTags.has(t.tag) && slide.tags?.[t.tag]) {
        seenTags.add(t.tag);
        tags.push({ tag: t.tag, tip: slide.tags[t.tag] });
      }
    }
  }

  const terms = order.map((abbr) => {
    const g = index.groups.get(abbr);
    const used = [...meanings.get(abbr)];
    // Show only the meaning(s) the slide actually uses; if unclear, show all (e.g. both GIS meanings).
    return { abbr, fulls: used.length ? used : g.fulls };
  });
  return { terms, tags };
}

export function renderTermsStrip(slide, index, label, extraTexts = []) {
  const { terms, tags } = collectSlideTerms(slide, index, extraTexts);
  const details = document.createElement('details');
  details.className = 'terms';
  const summary = document.createElement('summary');
  summary.textContent = `${label} (${terms.length + tags.length})`;
  details.append(summary);

  const dl = document.createElement('dl');
  for (const t of terms) {
    const dt = document.createElement('dt');
    dt.textContent = t.abbr;
    const dd = document.createElement('dd');
    dd.textContent = t.fulls.join(' · or · ');
    dl.append(dt, dd);
  }
  for (const t of tags) {
    const dt = document.createElement('dt');
    dt.textContent = t.tag;
    const dd = document.createElement('dd');
    dd.textContent = t.tip.replace(new RegExp(`^${t.tag}:\\s*`), '');
    dl.append(dt, dd);
  }
  details.append(dl);
  if (!terms.length && !tags.length) details.hidden = true;
  return details;
}
