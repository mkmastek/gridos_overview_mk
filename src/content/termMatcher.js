// Shared abbreviation matcher. Pure JavaScript (no DOM, no three.js) so that BOTH
// scripts/check-abbreviations.mjs (Node) and the deck (browser) use the same rules:
//   - the checker enforces "ABBR (Full Form)" on first use,
//   - the deck builds tooltips and the "Terms on this slide" strip.

const WORD = 'A-Za-z0-9_';
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const bounded = (alts, extra = '') =>
  new RegExp(`(?<![${WORD}${extra}])(?:${alts})(?![${WORD}${extra}])`, 'g');

// Categories that only need expanding on first use in the whole slide (PROMPT.md 10.2 rule B).
export const PER_SLIDE_CATEGORIES = new Set(['unit', 'organization']);

/** Build a lookup index from the glossary and exemption lists. */
export function createTermIndex(glossary, exemptions) {
  const groups = new Map();
  for (const entry of glossary) {
    let g = groups.get(entry.abbr);
    if (!g) {
      g = { abbr: entry.abbr, entries: [], fulls: [], accepts: [], categories: new Set(), forms: new Set([entry.abbr]) };
      groups.set(entry.abbr, g);
    }
    g.entries.push(entry);
    g.fulls.push(entry.full);
    g.accepts.push(entry.full, ...(entry.accept || []));
    g.categories.add(entry.category);
    for (const p of entry.plurals || []) g.forms.add(p);
    // Default plural for upper-case abbreviations ending in a letter: DERs, PMUs, RTUs, EVs ...
    if (/^[A-Z][A-Z0-9]*[A-Z]$/.test(entry.abbr)) g.forms.add(`${entry.abbr}s`);
  }
  for (const g of groups.values()) {
    g.perSlide = [...g.categories].every((c) => PER_SLIDE_CATEGORIES.has(c));
    g.acceptsLower = g.accepts.map((a) => a.toLowerCase());
  }

  const formToAbbr = new Map();
  for (const g of groups.values()) for (const f of g.forms) formToAbbr.set(f, g.abbr);
  // Longest forms first so "IEEE 2030.5" wins over "IEEE" and "DERMS" over "DER".
  const forms = [...formToAbbr.keys()].sort((a, b) => b.length - a.length);
  const termRe = bounded(forms.map(escapeRe).join('|'));

  const brandRe = exemptions.brandNames.length
    ? bounded(exemptions.brandNames.map(escapeRe).sort((a, b) => b.length - a.length).join('|'))
    : null;
  const tagRe = bounded(exemptions.diagramTags.map(escapeRe).join('|'), '\\-');
  const gridosRe = bounded('GridOS');

  return { groups, formToAbbr, termRe, brandRe, tagRe, gridosRe, exemptions };
}

const blank = (s) => ' '.repeat(s.length);

/**
 * Replace exempt spans (brand names, diagram tags, optionally "GridOS") with spaces.
 * Positions are preserved so indices map back to the original text.
 */
export function maskText(text, index, { gridosExempt = false } = {}) {
  let out = text;
  if (index.brandRe) out = out.replace(index.brandRe, blank);
  out = out.replace(index.tagRe, blank);
  if (gridosExempt) out = out.replace(index.gridosRe, blank);
  return out;
}

/** All glossary-term occurrences in `text`: [{ abbr, form, start, end }] */
export function findTerms(text, index, opts = {}) {
  const masked = maskText(text, index, opts);
  const out = [];
  index.termRe.lastIndex = 0;
  let m;
  while ((m = index.termRe.exec(masked))) {
    out.push({ abbr: index.formToAbbr.get(m[0]), form: m[0], start: m.index, end: m.index + m[0].length });
  }
  return out;
}

/** Diagram tags (SW2, S3, TIE ...) in `text`: [{ tag, start, end }] */
export function findDiagramTags(text, index) {
  const out = [];
  index.tagRe.lastIndex = 0;
  let m;
  while ((m = index.tagRe.exec(text))) out.push({ tag: m[0], start: m.index, end: m.index + m[0].length });
  return out;
}

/**
 * The bracket that expands an occurrence ending at `end`, allowing:
 *   "AI/ML (…)"          — slash-joined sibling abbreviations before the bracket
 *   "SF6-free (…)"       — a hyphenated suffix before the bracket
 * Returns { open, close, content } or null.
 */
export function bracketAfter(text, end) {
  const lead = /^(?:\s*\/\s*[A-Za-z0-9&.\-]+|-[A-Za-z]+)*\s*\(/.exec(text.slice(end));
  if (!lead) return null;
  const open = end + lead[0].length - 1;
  let depth = 1;
  let j = open + 1;
  while (j < text.length && depth > 0) {
    if (text[j] === '(') depth += 1;
    else if (text[j] === ')') depth -= 1;
    j += 1;
  }
  if (depth !== 0) return null;
  return { open, close: j - 1, content: text.slice(open + 1, j - 1) };
}

const includesAny = (hay, needlesLower) => {
  const h = hay.toLowerCase();
  return needlesLower.some((n) => h.includes(n));
};

/**
 * Analyse one text block. Each occurrence gets:
 *   expanded   — followed by a bracket containing its full form
 *   fullBefore — its full form already appears earlier in the block, outside any other
 *                term's bracket ("Fault Location, Isolation and Service Restoration (FLISR)").
 *                A full form buried in another expansion does not count: in
 *                "DERMS (Distributed Energy Resource Management System) manages DERs"
 *                the "DERs" still needs its own bracket.
 *   inside     — sits inside another term's expansion bracket, e.g. the "VAR" in
 *                "VVO (Volt/VAR Optimization)". The bracket IS the full form, so it
 *                is not re-checked (the Terms strip still lists it).
 *   meaning    — which full form the bracket used (for terms like GIS with two meanings)
 */
export function analyzeBlock(text, index, opts = {}) {
  const occ = findTerms(text, index, opts);
  const ranges = [];
  const matchEntry = (g, hayLower) =>
    g.entries.find((e) => [e.full, ...(e.accept || [])].some((a) => hayLower.includes(a.toLowerCase())));

  for (const o of occ) {
    const g = index.groups.get(o.abbr);
    const br = bracketAfter(text, o.end);
    o.expanded = false;
    o.meaning = null;
    if (br) {
      const hit = matchEntry(g, br.content.toLowerCase());
      if (hit) {
        o.expanded = true;
        o.meaning = hit.full;
        ranges.push([br.open, br.close, o]);
      }
    }
  }
  for (const o of occ) {
    o.inside = ranges.some(([a, b, owner]) => owner !== o && o.start > a && o.end <= b);
    // Text before this occurrence, with other terms' brackets blanked out.
    let before = text.slice(0, o.start);
    for (const [a, b, owner] of ranges) {
      if (owner === o || a >= o.start) continue;
      const end = Math.min(b + 1, o.start);
      before = before.slice(0, a) + ' '.repeat(end - a) + before.slice(end);
    }
    const g = index.groups.get(o.abbr);
    o.fullBefore = includesAny(before, g.acceptsLower);
    if (!o.meaning && o.fullBefore) o.meaning = (matchEntry(g, before.toLowerCase()) || {}).full || null;
  }
  return occ;
}

// Keys whose string values are identifiers or settings, not reader-facing text.
const NON_TEXT_KEYS = new Set(['id', 'scene', 'kind', 'camera', 'legend', 'phase', 'icon', 'tint', 'hash', 'value', 'key', 'type', 'layer', 'url']);

/** A two-line label object: { title, sub? } and no other reader-facing strings. */
const isLabelObject = (v) => typeof v.title === 'string'
  && Object.entries(v).every(([k, x]) => k === 'title' || k === 'sub' || NON_TEXT_KEYS.has(k) || typeof x !== 'string');

/**
 * Every reader-facing string in a slide, as text blocks: [{ path, text }].
 * Two-line label definitions — { title, sub } in `labels`, and flow-strip ends — become one
 * block "title (sub)", because they render as abbreviation on line 1, full form on line 2.
 */
export function collectTextBlocks(node, path = '') {
  const out = [];
  const walk = (v, p, parentKey) => {
    if (typeof v === 'string') {
      if (!NON_TEXT_KEYS.has(parentKey)) out.push({ path: p, text: v });
    } else if (Array.isArray(v)) {
      v.forEach((item, i) => walk(item, `${p}[${i}]`, parentKey));
    } else if (v && typeof v === 'object') {
      if ((parentKey === '#label' || ['from', 'to', 'via'].includes(parentKey)) && isLabelObject(v)) {
        out.push({ path: p, text: v.sub ? `${v.title} (${v.sub})` : v.title });
        return;
      }
      for (const [k, val] of Object.entries(v)) {
        const kp = p ? `${p}.${k}` : k;
        if (k === 'labels' && val && typeof val === 'object' && !Array.isArray(val)) {
          for (const [lk, lv] of Object.entries(val)) walk(lv, `${kp}.${lk}`, '#label');
        } else {
          walk(val, kp, k);
        }
      }
    }
  };
  walk(node, path, '');
  return out;
}

/** Tooltip text for a glossary term. `meaning` picks one entry when an abbreviation has two. */
export function termTip(abbr, index, meaning = null) {
  const g = index.groups.get(abbr);
  if (!g) return '';
  const entries = meaning ? g.entries.filter((e) => e.full === meaning) : g.entries;
  return entries
    .map((e) => `${g.abbr} — ${e.full}${e.meaning ? `\n${e.meaning}` : ''}`)
    .join('\n\n');
}
