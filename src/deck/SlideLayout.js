// Slide layout: top bar (Mastek logo), text panel (38 %), 3D stage (62 %) with overlays,
// demo bar. Builds the DOM once; renderSlide() refills it for each slide. All wording comes
// from the content files (`ui` + the slide object) — nothing reader-facing is hard-coded here.

import { analyzeBlock, findDiagramTags, termTip } from '../content/termMatcher.js';
import { renderTermsStrip } from './TermsStrip.js';
import { PALETTE, LAYER_TINTS, FLOW_COLORS } from '../three/palette.js';
import { ICONS } from './icons.js';
import logoUrl from '../assets/logos/mastek-lwai-color.png';

const el = (tag, cls, attrs = {}) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'text') n.textContent = v;
    else if (k === 'html') n.innerHTML = v;
    else n.setAttribute(k, v);
  }
  return n;
};
export const fillTpl = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
const hostOf = (url) => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; } };

export class SlideLayout {
  constructor(root, { ui, legendItems, index, factById, glossary, categories, sources }) {
    this.ui = ui;
    this.legendItems = legendItems;
    this.index = index;
    this.factById = factById;
    this.glossary = glossary;
    this.categories = categories;
    this.sources = sources;
    this.slide = null;
    this.onLayerSelect = null;
    this.controlHandles = {};
    this.build(root);
  }

  // ── Skeleton ─────────────────────────────────────────────────
  build(root) {
    const ui = this.ui;
    this.root = el('div', 'deck');

    // Top bar: Mastek colour logo on white (Brand Book: primary logo on white or light backgrounds)
    const top = el('header', 'topbar');
    const logo = el('img', 'brand-logo', { src: logoUrl, alt: ui.logoAlt, width: '160', height: '34' });
    const title = el('div', 'topbar__title');
    this.topSection = el('span', 'topbar__section');
    this.topSlide = el('span', 'topbar__slide');
    title.append(this.topSection, el('span', 'topbar__dot', { text: '·', 'aria-hidden': 'true' }), this.topSlide);

    const actions = el('div', 'topbar__actions');
    const rmLabel = el('label', 'toggle', { title: ui.reduceMotion });
    this.reduceMotionInput = el('input', '', { type: 'checkbox' });
    rmLabel.append(this.reduceMotionInput, el('span', 'toggle__text', { text: ui.reduceMotion }));
    this.btnPrevSlide = el('button', 'btn btn--icon', { type: 'button', 'aria-label': ui.prevSlide, title: ui.prevSlide, html: ICONS.prev });
    this.counter = el('span', 'counter', { 'aria-live': 'polite' });
    this.btnNextSlide = el('button', 'btn btn--icon', { type: 'button', 'aria-label': ui.nextSlide, title: ui.nextSlide, html: ICONS.next });
    this.btnMenu = el('button', 'btn btn--icon', { type: 'button', 'aria-label': ui.openMenu, title: ui.openMenu, 'aria-haspopup': 'dialog', html: ICONS.menu });
    actions.append(rmLabel, this.btnPrevSlide, this.counter, this.btnNextSlide, this.btnMenu);

    const progress = el('div', 'progress', { 'aria-hidden': 'true' });
    this.progressBar = el('div', 'progress__bar');
    progress.append(this.progressBar);
    top.append(logo, el('span', 'topbar__divider', { 'aria-hidden': 'true' }), title, actions, progress);

    // Main
    const main = el('main', 'layout');
    this.textPanel = el('article', 'text-panel', { tabindex: '-1' });

    const stageCol = el('section', 'stage-col', { 'aria-label': '3D view' });
    // stage-view = 3D canvas box + the flow strip floating at its bottom edge.
    // On narrow screens the flow strip moves under the canvas (see styles.css).
    // stage-footer = the "Illustrative simulation" badge, live readouts and the colour legend,
    // under the view, so they never cover the scene.
    this.stageView = el('div', 'stage-view');
    this.stageCanvas = el('div', 'stage-canvas');
    this.overlay = el('div', 'stage-overlay is-empty');
    this.flow = el('div', 'flow', { hidden: '', 'aria-live': 'polite' });
    this.hint = el('div', 'stage-hint', { text: ui.dragHint });
    this.message = el('div', 'stage-message', { hidden: '' });
    this.overlay.append(this.flow);
    this.stageCanvas.append(this.hint, this.message);
    this.stageView.append(this.stageCanvas, this.overlay);
    this.footer = el('div', 'stage-footer');
    this.badge = el('div', 'badge', { text: ui.badge });
    this.hud = el('div', 'hud', { hidden: '', 'aria-live': 'polite' });
    this.legend = el('div', 'legend');
    this.footer.append(this.badge, this.hud, this.legend);

    // Demo bar (caption + transport + slide-specific controls)
    this.demo = el('div', 'demo');
    const captionRow = el('div', 'caption-row');
    this.stepCounter = el('span', 'step-counter');
    this.caption = el('p', 'caption', { 'aria-live': 'polite' });
    captionRow.append(this.stepCounter, this.caption);

    const controls = el('div', 'controls');
    const transport = el('div', 'transport');
    const tbtn = (icon, label, extra = '') => el('button', `btn btn--icon ${extra}`, { type: 'button', 'aria-label': label, title: label, html: ICONS[icon] });
    this.btnStepBack = tbtn('stepBack', ui.stepBack);
    this.btnPlay = tbtn('play', ui.play, 'btn--play');
    this.btnStepForward = tbtn('stepForward', ui.stepForward);
    this.btnRestart = tbtn('restart', ui.restart);
    transport.append(this.btnStepBack, this.btnPlay, this.btnStepForward, this.btnRestart);

    const speed = el('div', 'speed', { role: 'group', 'aria-label': ui.speed });
    this.speedButtons = [0.5, 1, 2].map((s) => {
      const b = el('button', 'btn', { type: 'button', text: `${s}×`, 'aria-pressed': String(s === 1), 'data-speed': String(s) });
      speed.append(b);
      return b;
    });
    this.dots = el('div', 'dots');
    this.btnResetView = el('button', 'btn', { type: 'button', title: ui.resetView, html: `${ICONS.resetView}<span>${ui.resetView}</span>` });
    controls.append(transport, speed, this.dots, el('span', 'controls__spacer'), this.btnResetView);

    this.interactions = el('div', 'interactions');
    this.demo.append(captionRow, controls, this.interactions);

    stageCol.append(this.stageView, this.footer, this.demo);
    main.append(this.textPanel, stageCol);

    // Menu
    this.menu = el('div', 'menu', { hidden: '', role: 'dialog', 'aria-modal': 'true', 'aria-label': ui.menuHeading });
    this.menuPanel = el('nav', 'menu__panel');
    this.menu.append(this.menuPanel);

    this.root.append(top, main, this.menu);
    root.append(this.root);
  }

  // ── Rich text: abbreviations and diagram tags get tooltips ───
  rich(text) {
    const frag = document.createDocumentFragment();
    const spans = [
      ...analyzeBlock(text, this.index).map((o) => ({ start: o.start, end: o.end, kind: 'term', o })),
      ...findDiagramTags(text, this.index).map((t) => ({ start: t.start, end: t.end, kind: 'tag', t })),
    ].sort((a, b) => a.start - b.start);

    let pos = 0;
    for (const s of spans) {
      if (s.start < pos) continue;
      if (s.start > pos) frag.append(text.slice(pos, s.start));
      const word = text.slice(s.start, s.end);
      if (s.kind === 'term') {
        frag.append(el('span', 'term', { 'data-tip': termTip(s.o.abbr, this.index, s.o.meaning), text: word }));
      } else {
        const tip = this.slide?.tags?.[s.t.tag];
        frag.append(tip ? el('span', 'tag', { 'data-tip': tip, tabindex: '0', text: word }) : word);
      }
      pos = s.end;
    }
    if (pos < text.length) frag.append(text.slice(pos));
    return frag;
  }

  para(text, tag = 'p', cls = '') {
    const p = el(tag, cls);
    p.append(this.rich(text));
    return p;
  }

  // ── Slide ─────────────────────────────────────────────────────
  renderSlide(slide, { number, total, prev, next }) {
    this.slide = slide;
    const ui = this.ui;
    this.topSection.textContent = slide.section;
    this.topSlide.textContent = slide.title;
    this.counter.textContent = `${number} / ${total}`;
    this.progressBar.style.width = `${(number / total) * 100}%`;
    this.btnPrevSlide.disabled = !prev;
    this.btnNextSlide.disabled = !next;
    document.title = `${slide.title} · ${ui.deckName}`;

    const tp = this.textPanel;
    tp.replaceChildren();
    tp.scrollTop = 0;
    tp.append(el('p', 'slide-section', { text: slide.section }));
    const h1 = el('h1', 'slide-title');
    h1.append(this.rich(slide.title));
    tp.append(h1);
    if (slide.subtitle) tp.append(this.para(slide.subtitle, 'p', 'slide-subtitle'));
    this.infoCard = el('div', 'card detail-card', { hidden: '' });
    tp.append(this.infoCard);

    if (slide.placeholder) {
      const block = el('section', 'block');
      block.append(el('h2', '', { text: fillTpl(ui.placeholderTitle, slide) }));
      block.append(el('p', '', { text: fillTpl(ui.placeholderBody, slide) }));
      tp.append(block);
    }

    this.layerRows = null;
    for (const b of slide.blocks || []) tp.append(this.renderBlock(b, slide));
    if (slide.notes?.length) {
      const ul = el('ul', 'notes');
      for (const n of slide.notes) ul.append(this.para(n, 'li'));
      tp.append(ul);
    }
    if (slide.keyFacts?.length) tp.append(this.renderFacts(slide.keyFacts));
    tp.append(renderTermsStrip(slide, this.index, ui.terms, slide.badge ? [ui.badge] : []));
    tp.append(this.renderSlideNav(prev, next));

    // Stage overlays
    this.badge.hidden = !slide.badge;
    this.setLegend(slide.legend || []);
    this.footer.hidden = !slide.badge && !slide.legend?.length;
    this.setHud(null);
    this.setFlow(null);
    this.setInteractions([]);
    this.hideMessage();
  }

  renderBlock(b, slide) {
    const sec = el('section', `block block--${b.kind || 'text'}`);
    if (b.heading) sec.append(el('h2', '', { text: b.heading }));
    for (const p of b.paras || []) sec.append(this.para(p));
    if (b.note && b.kind !== 'layers') sec.append(this.para(b.note, 'p', 'block-note'));
    if (b.items?.length) {
      const list = el(b.ordered ? 'ol' : 'ul');
      for (const it of b.items) list.append(this.para(it, 'li'));
      sec.append(list);
    }
    if (b.keys?.length) {
      const keys = el('div', 'keys');
      for (const [k, v] of b.keys) keys.append(el('kbd', '', { text: k }), el('span', '', { text: v }));
      sec.append(keys);
    }
    if (b.tokens?.length) {
      const row = el('div', 'topology');
      b.tokens.forEach((t, i) => {
        if (i) row.append(el('span', 'topology__arrow', { text: '—', 'aria-hidden': 'true' }));
        const isTag = slide.tags?.[t];
        row.append(isTag ? el('span', 'tag', { 'data-tip': slide.tags[t], tabindex: '0', text: t }) : el('span', 'topology__node', { text: t }));
      });
      sec.insertBefore(row, sec.querySelector('p'));
    }
    if (b.kind === 'layers') this.renderLayers(sec, b, slide);
    if (b.kind === 'glossary') this.renderGlossary(sec, b);
    if (b.kind === 'sources') this.renderSources(sec);
    return sec;
  }

  // Slide 4: clickable layer list + "selected layer" detail card.
  renderLayers(sec, b, slide) {
    if (b.note) sec.append(this.para(b.note, 'p', 'block-note'));
    this.detailCard = el('div', 'card detail-card', { hidden: '' });
    sec.append(this.detailCard);
    const list = el('div', 'layer-list');
    this.layerRows = new Map();
    for (const layer of slide.layers || []) {
      const row = el('button', 'layer-row', { type: 'button', 'data-layer': layer.id });
      row.style.setProperty('--layer-tint', LAYER_TINTS[layer.id]);
      row.append(el('span', 'layer-row__id', { text: layer.id }));
      const name = el('span', 'layer-row__name', { text: `${layer.name} — ${layer.summary}` });
      const comps = el('span', 'layer-row__components');
      layer.components.forEach((c, i) => {
        if (i) comps.append(', ');
        comps.append(this.rich(c));
      });
      row.append(name, comps);
      row.addEventListener('click', () => this.onLayerSelect?.(layer.id));
      list.append(row);
      this.layerRows.set(layer.id, row);
    }
    sec.append(list);
  }

  /** Mark the layer the demo is currently on (thin accent bar). */
  markStepLayer(id) {
    for (const [lid, row] of this.layerRows || []) row.classList.toggle('is-step', lid === id);
  }

  /** Select a layer (or null): highlights its row and opens the detail card. */
  selectLayer(id) {
    if (!this.layerRows) return;
    for (const [lid, row] of this.layerRows) row.classList.toggle('is-selected', lid === id);
    const card = this.detailCard;
    if (!id) { card.hidden = true; return; }
    const slide = this.slide;
    const layer = slide.layers.find((l) => l.id === id);
    const c = slide.controls || {};
    card.replaceChildren();
    const head = el('div', 'detail-card__head');
    head.append(el('h2', '', { text: `${c.detailHeading}: ${layer.id} · ${layer.name}` }));
    const close = el('button', 'btn btn--icon btn--ghost', { type: 'button', 'aria-label': c.clearSelection, title: c.clearSelection, html: ICONS.close });
    close.addEventListener('click', () => this.onLayerSelect?.(null));
    head.append(close);
    card.append(head);
    const ul = el('ul');
    for (const comp of layer.components) ul.append(this.para(comp, 'li'));
    card.append(ul);
    const icons = (this.layerIconKeys?.[id] || []).map((k) => slide.iconTips?.[k]).filter(Boolean);
    if (icons.length) {
      card.append(el('p', 'block-note', { text: c.detailIcons }));
      const ul2 = el('ul');
      for (const t of icons) ul2.append(this.para(t, 'li'));
      card.append(ul2);
    }
    card.hidden = false;
    card.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  /**
   * Generic card a scene can open at the top of the text panel (e.g. a clicked customer pin,
   * a chosen query). info = null | { title, paras?, items?, note? } — text from content files.
   */
  showInfoCard(info) {
    const card = this.infoCard;
    if (!card) return;
    if (!info) { card.hidden = true; return; }
    card.replaceChildren();
    const head = el('div', 'detail-card__head');
    const h = el('h2');
    h.append(this.rich(info.title));
    head.append(h);
    const close = el('button', 'btn btn--icon btn--ghost', { type: 'button', 'aria-label': this.ui.closeMenu, title: this.ui.closeMenu, html: ICONS.close });
    close.addEventListener('click', () => { card.hidden = true; });
    head.append(close);
    card.append(head);
    for (const p of info.paras || []) card.append(this.para(p));
    if (info.items?.length) {
      const ul = el('ul');
      for (const it of info.items) ul.append(this.para(it, 'li'));
      card.append(ul);
    }
    if (info.note) card.append(this.para(info.note, 'p', 'block-note'));
    card.hidden = false;
    card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // Slide 27: searchable glossary built from glossary.js (single source of truth).
  renderGlossary(sec, b) {
    const tools = el('div', 'gloss-tools');
    const search = el('input', 'gloss-search', { type: 'search', placeholder: b.searchPlaceholder || '', 'aria-label': b.searchPlaceholder || '' });
    const cat = el('select', 'select', { 'aria-label': b.categoryLabel || '' });
    cat.append(el('option', '', { value: '', text: b.allCategories || '' }));
    for (const [k, v] of Object.entries(this.categories)) cat.append(el('option', '', { value: k, text: v }));
    tools.append(search, cat);
    const count = el('p', 'gloss-count');
    const list = el('div', 'gloss-list');
    const items = this.glossary.map((g) => {
      const item = el('div', 'gloss-item');
      const head = el('div', 'gloss-item__head');
      head.append(el('span', 'gloss-item__abbr', { text: g.abbr }), el('span', 'gloss-item__full', { text: g.full }), el('span', 'chip', { text: this.categories[g.category] }));
      item.append(head);
      if (g.meaning) item.append(this.para(g.meaning, 'p', 'gloss-item__meaning'));
      list.append(item);
      return { g, item, hay: `${g.abbr} ${g.full} ${g.meaning}`.toLowerCase() };
    });
    const apply = () => {
      const q = search.value.trim().toLowerCase();
      let n = 0;
      for (const { g, item, hay } of items) {
        const show = (!q || hay.includes(q)) && (!cat.value || g.category === cat.value);
        item.hidden = !show;
        if (show) n += 1;
      }
      count.textContent = fillTpl(b.countTemplate || '{n}', { n, total: items.length });
    };
    search.addEventListener('input', apply);
    cat.addEventListener('change', apply);
    apply();
    sec.append(tools, count, list);
  }

  renderSources(sec) {
    const ol = el('ol', 'sources');
    for (const [id, url] of Object.entries(this.sources)) {
      const li = el('li');
      li.append(el('span', 'sources__id', { text: id }));
      li.append(el('a', '', { href: url, target: '_blank', rel: 'noopener noreferrer', text: url }));
      ol.append(li);
    }
    sec.append(ol);
  }

  renderFacts(keyFacts) {
    const ui = this.ui;
    const card = el('section', 'card block');
    card.append(el('h2', '', { text: ui.keyFacts }));
    for (const kf of keyFacts) {
      const fact = this.factById[kf.id];
      const item = el('div', 'fact');
      item.append(this.para(kf.text));
      if (kf.footnote) item.append(this.para(kf.footnote, 'p', 'block-note'));
      const meta = el('div', 'fact__meta');
      meta.append(el('span', 'chip', { text: `${ui.factLabel} ${kf.id}` }));
      if (fact?.vendorReported) {
        meta.append(el('span', 'chip chip--vendor', { text: ui.vendorReported }));
        const q = el('span', 'fact__qualifier');
        q.append(this.rich(kf.qualifier));
        meta.append(q);
      }
      for (const [i, url] of (fact?.sources || []).entries()) {
        meta.append(el('a', '', { href: url, target: '_blank', rel: 'noopener noreferrer', text: `${ui.sourceLabel}: ${hostOf(url)}`, title: `${fact.sourceIds[i]} · ${url}` }));
      }
      item.append(meta);
      card.append(item);
    }
    return card;
  }

  renderSlideNav(prev, next) {
    const nav = el('nav', 'slide-nav');
    const mk = (target, dir) => {
      const b = el('button', 'btn', { type: 'button', 'data-nav': dir });
      const label = el('span', 'slide-nav__text', { text: `${dir === 'prev' ? this.ui.prev : this.ui.next}: ${target.title}` });
      if (dir === 'prev') b.append(el('span', '', { html: ICONS.prev }), label);
      else b.append(label, el('span', '', { html: ICONS.next }));
      return b;
    };
    nav.append(prev ? mk(prev, 'prev') : el('span'));
    if (next) nav.append(mk(next, 'next'));
    return nav;
  }

  // ── Overlays ──────────────────────────────────────────────────
  setLegend(keys) {
    this.legend.replaceChildren();
    this.legend.hidden = !keys.length;
    if (!keys.length) return;
    this.legend.append(el('span', 'legend__title', { text: this.ui.legend }));
    const ul = el('ul');
    for (const k of keys) {
      const li = el('li');
      const sw = el('span', 'swatch');
      sw.style.color = PALETTE[k];
      li.append(sw);
      li.append(this.rich(this.legendItems[k]));
      ul.append(li);
    }
    this.legend.append(ul);
  }

  /**
   * Live readouts over the 3D view.
   * hud = null | { label, value, mood } | { items: [{ label, value, mood }] }
   * mood: 'alert' | 'ok' | 'warn' | ''
   */
  setHud(hud) {
    if (!hud) { this.hud.hidden = true; this.hudKey = ''; this.syncOverlay(); return; }
    const items = hud.items || [hud];
    const key = JSON.stringify(items);
    if (key === this.hudKey && !this.hud.hidden) return;
    this.hudKey = key;
    this.hud.replaceChildren();
    for (const it of items) {
      const box = el('div', `hud__item${it.mood ? ` is-${it.mood}` : ''}`);
      const label = el('span', 'hud__label');
      label.append(this.rich(it.label));
      box.append(label, el('span', 'hud__value', { text: it.value }));
      this.hud.append(box);
    }
    this.hud.hidden = false;
    this.syncOverlay();
  }

  /** The overlay strip (narrow screens) only shows when there is a flow. */
  syncOverlay() {
    this.overlay.classList.toggle('is-empty', this.flow.hidden);
  }

  /**
   * The flow strip: what is moving in this step, from where to where, and via what.
   * flows = null | flow | flow[]; flow = { type, from: {title, sub}, to: {title, sub}, via? }
   */
  setFlow(flows) {
    const list = !flows ? [] : Array.isArray(flows) ? flows : [flows];
    const key = JSON.stringify(list);
    if (key === this.flowKey) return;
    this.flowKey = key;
    this.flow.replaceChildren();
    this.flow.hidden = !list.length;
    this.syncOverlay();
    this.hint.hidden = Boolean(list.length) || !this.message.hidden;
    const end = (e) => {
      const box = el('div', 'flow-end');
      const t = el('span', 'flow-end__title');
      t.append(this.rich(e.title));
      box.append(t);
      if (e.sub) {
        const s = el('span', 'flow-end__sub');
        s.append(this.rich(e.sub));
        box.append(s);
      }
      return box;
    };
    const color = (f) => FLOW_COLORS[f.type] || FLOW_COLORS.data;
    const typeChip = (f) => {
      const c = el('span', 'flow-type', { text: this.ui.flowTypes[f.type] || f.type });
      c.style.setProperty('--flow-color', color(f));
      return c;
    };
    const arrow = (f) => {
      const a = el('span', 'flow-arrow', { 'aria-hidden': 'true' });
      a.style.setProperty('--flow-color', color(f));
      return a;
    };
    const via = (f, row) => {
      if (!f.via) return;
      const v = el('div', 'flow-via');
      v.append(el('span', 'flow-via__label', { text: this.ui.via }), end(f.via));
      row.append(v);
    };

    // Two flows that connect (A → B, then B → C) read best as one chain: A → B → C.
    const [a, b] = list;
    if (list.length === 2 && a.to && b.from && a.to.title === b.from.title && !a.via) {
      const row = el('div', 'flow-row flow-row--chain');
      row.append(typeChip(a), end(a.from), arrow(a), end(a.to), typeChip(b), arrow(b), end(b.to));
      via(b, row);
      this.flow.append(row);
      return;
    }
    for (const f of list) {
      const row = el('div', 'flow-row');
      row.append(typeChip(f));
      if (f.from) row.append(end(f.from));
      if (f.from && f.to) row.append(arrow(f));
      if (f.to) row.append(end(f.to));
      via(f, row);
      this.flow.append(row);
    }
  }

  showMessage(kind, title, body, steps = []) {
    this.message.className = `stage-message stage-message--${kind}`;
    this.message.replaceChildren();
    const card = el('div', 'stage-message__card');
    card.append(el('h2', '', { text: title }));
    if (body) card.append(el('p', '', { text: body }));
    if (steps.length) {
      const ol = el('ol');
      for (const s of steps) ol.append(this.para(s, 'li'));
      card.append(ol);
    }
    this.message.append(card);
    this.message.hidden = false;
    this.hint.hidden = true;
  }

  hideMessage() {
    this.message.hidden = true;
    this.hint.hidden = !this.flow.hidden;
  }

  // ── Slide-specific controls ──────────────────────────────────
  // defs: [{ id?, type: 'choice'|'toggle'|'toggleButton'|'slider'|'select'|'button', label, tip, ... onChange }]
  //   slider: { min, max, step, value, format(v) → text }    select: { options: [{ value, label }], value }
  // Scenes can move a control later with ctx.setControl(id, value) (e.g. an auto-demo moving a slider).
  setInteractions(defs) {
    this.interactions.replaceChildren();
    this.controlHandles = {};
    if (!defs.length) return;
    this.interactions.append(el('span', 'interactions__label', { text: this.ui.tryIt }));
    for (const d of defs) {
      const group = el('div', 'control-group');
      const labelEl = (text) => {
        const lab = el('span', 'control-group__label', { text });
        if (d.tip) lab.setAttribute('data-tip', d.tip);
        return lab;
      };
      let handle = null;
      if (d.type === 'choice') {
        const seg = el('div', 'segmented', { role: 'group', 'aria-label': d.label });
        const buttons = d.options.map((o) => {
          const b = el('button', 'btn', { type: 'button', 'aria-pressed': String(o.value === d.value), text: o.label });
          if (o.tip) b.setAttribute('data-tip', o.tip);
          b.addEventListener('click', () => {
            for (const x of buttons) x.setAttribute('aria-pressed', String(x === b));
            d.onChange(o.value);
          });
          seg.append(b);
          return b;
        });
        group.append(labelEl(d.label), seg);
        handle = { set: (v) => buttons.forEach((x, i) => x.setAttribute('aria-pressed', String(d.options[i].value === v))) };
      } else if (d.type === 'toggle') {
        const lab = el('label', 'toggle');
        const input = el('input', '', { type: 'checkbox' });
        input.checked = Boolean(d.value);
        input.addEventListener('change', () => d.onChange(input.checked));
        const text = el('span', '', { text: d.label });
        if (d.tip) text.setAttribute('data-tip', d.tip);
        lab.append(input, text);
        group.append(lab);
        handle = { set: (v) => { input.checked = Boolean(v); } };
      } else if (d.type === 'toggleButton') {
        let on = Boolean(d.value);
        const b = el('button', 'btn', { type: 'button', 'aria-pressed': String(on), text: d.labels[on ? 1 : 0] });
        const show = () => { b.setAttribute('aria-pressed', String(on)); b.textContent = d.labels[on ? 1 : 0]; };
        b.addEventListener('click', () => { on = !on; show(); d.onChange(on); });
        group.append(b);
        handle = { set: (v) => { on = Boolean(v); show(); } };
      } else if (d.type === 'slider') {
        const input = el('input', 'slider', { type: 'range', min: String(d.min), max: String(d.max), step: String(d.step ?? 1), 'aria-label': d.label });
        input.value = String(d.value);
        const out = el('span', 'control-group__value', { text: d.format ? d.format(d.value) : String(d.value) });
        input.addEventListener('input', () => {
          const v = Number(input.value);
          out.textContent = d.format ? d.format(v) : String(v);
          d.onChange(v);
        });
        group.append(labelEl(d.label), input, out);
        handle = { set: (v) => { input.value = String(v); out.textContent = d.format ? d.format(v) : String(v); } };
      } else if (d.type === 'select') {
        const sel = el('select', 'select', { 'aria-label': d.label });
        for (const o of d.options) sel.append(el('option', '', { value: String(o.value), text: o.label }));
        sel.value = String(d.value ?? d.options[0]?.value);
        sel.addEventListener('change', () => d.onChange(sel.value));
        group.append(labelEl(d.label), sel);
        handle = { set: (v) => { sel.value = String(v); } };
      } else if (d.type === 'button') {
        const b = el('button', 'btn', { type: 'button', text: d.label });
        if (d.tip) b.setAttribute('data-tip', d.tip);
        b.addEventListener('click', () => d.onClick?.());
        group.append(b);
      }
      if (d.id && handle) this.controlHandles[d.id] = handle;
      this.interactions.append(group);
    }
  }

  setControl(id, value) {
    this.controlHandles[id]?.set(value);
  }

  // ── Menu ──────────────────────────────────────────────────────
  renderMenu(slides, sections, currentId) {
    const ui = this.ui;
    this.menuPanel.replaceChildren();
    const head = el('div', 'menu__head');
    head.append(el('h2', '', { text: ui.menuHeading }));
    this.btnCloseMenu = el('button', 'btn btn--icon', { type: 'button', 'aria-label': ui.closeMenu, title: ui.closeMenu, html: ICONS.close });
    head.append(this.btnCloseMenu);
    this.menuPanel.append(head);
    for (const sec of sections) {
      const items = slides.map((s, i) => ({ s, i })).filter(({ s }) => s.section === sec);
      if (!items.length) continue;
      this.menuPanel.append(el('h3', '', { text: sec }));
      const ol = el('ol');
      for (const { s, i } of items) {
        const a = el('a', s.placeholder ? 'is-later' : '', { href: `#${s.id}` });
        if (s.id === currentId) a.setAttribute('aria-current', 'page');
        a.append(el('span', 'menu__num', { text: String(i + 1) }));
        const t = el('span');
        t.append(this.rich(s.title));
        if (s.placeholder) t.append(el('span', 'placeholder-chip', { text: fillTpl(ui.placeholderChip, s) }));
        a.append(t);
        const li = el('li');
        li.append(a);
        ol.append(li);
      }
      this.menuPanel.append(ol);
    }
  }
}
