// Deck engine: navigation (keyboard, buttons, swipe, menu, URL hash), progress, and the
// scene lifecycle — the current scene plus its neighbours stay built, the rest are disposed.

import { createTermIndex } from '../content/termMatcher.js';
import { SlideLayout, fillTpl } from './SlideLayout.js';
import { DemoController } from './DemoController.js';
import { Tooltip } from './Tooltip.js';
import { staticSteps } from '../fallback/noWebGL.js';

const RM_KEY = 'gridos-deck.reduceMotion';

export class DeckEngine {
  /**
   * @param root    element to build the deck in
   * @param opts    { slides, sections, ui, legendItems, glossary, categories, exemptions, factById, sources }
   */
  constructor(root, opts) {
    Object.assign(this, opts);
    this.index = createTermIndex(opts.glossary, opts.exemptions);
    this.layout = new SlideLayout(root, {
      ui: opts.ui, legendItems: opts.legendItems, index: this.index, factById: opts.factById,
      glossary: opts.glossary, categories: opts.categories, sources: opts.sources,
    });
    this.tooltip = new Tooltip(document.body);
    this.demo = new DemoController(this.layout, opts.ui, {
      onCamera: (name) => this.flyTo(name),
      onStep: (k) => this.scene?.onStep?.(k),
    });
    this.cache = new Map(); // slide index → scene object
    this.i = -1;
    this.scene = null;
    this.stage = null;
    this.kit = null;
    this.reducedMotion = this.loadReducedMotion();
    this.layout.reduceMotionInput.checked = this.reducedMotion;
    document.documentElement.classList.toggle('reduce-motion', this.reducedMotion);
    this.bindEvents();
  }

  /** Attach the 3D stage (only when WebGL is available). */
  attachStage(stage, kit, scenes) {
    this.stage = stage;
    this.kit = kit;
    this.scenes = scenes;
    stage.setReducedMotion(this.reducedMotion);
    // On desktop the flow strip floats over the bottom of the 3D view; on narrow screens it
    // sits under the view (styles.css), so nothing needs reserving there.
    this.wide = window.matchMedia('(min-width: 1100px)');
    this.wide.addEventListener?.('change', () => this.updateReserve());
  }

  updateReserve() {
    if (!this.stage) return;
    const hasFlow = this.scene?.steps?.some((s) => s.flow);
    this.stage.setReserveBottom(hasFlow && this.wide.matches ? 80 : 0);
  }

  start() {
    this.goTo(this.indexFromHash() ?? 0, { replaceHash: true });
  }

  // ── Navigation ────────────────────────────────────────────────
  indexFromHash() {
    const id = decodeURIComponent(location.hash.replace(/^#/, ''));
    const i = this.slides.findIndex((s) => s.id === id);
    return i >= 0 ? i : null;
  }

  next() { if (this.i < this.slides.length - 1) this.goTo(this.i + 1); }
  prev() { if (this.i > 0) this.goTo(this.i - 1); }

  goTo(i, { replaceHash = false } = {}) {
    i = Math.max(0, Math.min(this.slides.length - 1, i));
    if (i === this.i) return;
    const slide = this.slides[i];

    // Leave the current slide
    this.demo.unbind();
    this.scene?.onExit?.();
    this.stage?.activate(null);
    this.scene = null;
    this.i = i;

    this.layout.renderSlide(slide, {
      number: i + 1,
      total: this.slides.length,
      prev: this.slides[i - 1],
      next: this.slides[i + 1],
    });
    this.layout.onLayerSelect = (id) => this.selectLayer(id);
    this.layout.renderMenu(this.slides, this.sections, slide.id);
    this.layout.btnCloseMenu.addEventListener('click', () => this.closeMenu());

    if (slide.placeholder) {
      this.layout.demo.hidden = true;
      this.layout.showMessage('placeholder', fillTpl(this.ui.placeholderTitle, slide), fillTpl(this.ui.placeholderBody, slide));
    } else if (!this.stage || !slide.scene) {
      this.layout.demo.hidden = true;
      const steps = staticSteps(slide);
      this.layout.showMessage('fallback', this.ui.noWebGLTitle, this.ui.noWebGLBody, steps);
    } else {
      const scene = this.getScene(i);
      this.scene = scene;
      this.layout.layerIconKeys = scene.layerIcons || null;
      // Build the controls and demo bar first: they set the canvas height the camera frames for.
      this.layout.setInteractions(scene.interactions || []);
      this.demo.bind(scene);
      this.stage.activate(scene);
      this.updateReserve();
      scene.onEnter?.();
      this.stage.flyTo(scene.cameraPreset(scene.startPreset), { intro: true });
    }

    const hash = `#${slide.id}`;
    if (location.hash !== hash) {
      if (replaceHash) history.replaceState(null, '', hash);
      else location.hash = hash;
    }
    this.scheduleNeighbours();
  }

  // ── Scenes: build on demand, keep neighbours, dispose the rest ──
  getScene(i) {
    if (this.cache.has(i)) return this.cache.get(i);
    const slide = this.slides[i];
    const factory = this.scenes[slide.scene];
    let obj = null;
    const ctx = {
      content: slide,
      ui: this.ui,
      setHud: (hud) => { if (this.scene === obj) this.layout.setHud(hud); },
      setControl: (id, value) => { if (this.scene === obj) this.layout.setControl(id, value); },
      showInfo: (info) => { if (this.scene === obj) this.layout.showInfoCard(info); },
      emit: (type, data) => { if (this.scene === obj) this.onSceneEvent(type, data); },
      timelineChanged: () => { if (this.scene === obj) this.demo.bind(obj); },
    };
    obj = factory(this.stage, this.kit, ctx);
    this.cache.set(i, obj);
    return obj;
  }

  scheduleNeighbours() {
    clearTimeout(this.neighbourTimer);
    if (!this.stage) return;
    this.neighbourTimer = setTimeout(() => {
      for (const [k, obj] of this.cache) {
        if (Math.abs(k - this.i) > 1) {
          obj.dispose();
          this.cache.delete(k);
        }
      }
      for (const k of [this.i + 1, this.i - 1]) {
        const s = this.slides[k];
        if (s && s.scene && !s.placeholder && !this.cache.has(k)) {
          const obj = this.getScene(k);
          obj.setReducedMotion?.(this.reducedMotion);
          this.stage.precompile(obj);
        }
      }
    }, 450);
  }

  flyTo(name) {
    if (!this.scene || !this.stage) return;
    this.stage.flyTo(this.scene.cameraPreset(name));
  }

  onSceneEvent(type, data) {
    if (type === 'layer-select') this.selectLayer(data);
    if (type === 'step-layer') this.layout.markStepLayer(data);
  }

  selectLayer(id) {
    this.scene?.selectLayer?.(id);
    this.layout.selectLayer(id);
  }

  // ── Menu ──────────────────────────────────────────────────────
  openMenu() {
    this.layout.menu.hidden = false;
    this.layout.btnMenu.setAttribute('aria-expanded', 'true');
    (this.layout.menuPanel.querySelector('[aria-current="page"]') || this.layout.btnCloseMenu).focus();
  }

  closeMenu() {
    if (this.layout.menu.hidden) return;
    this.layout.menu.hidden = true;
    this.layout.btnMenu.setAttribute('aria-expanded', 'false');
    this.layout.btnMenu.focus();
  }

  // ── Reduced motion ────────────────────────────────────────────
  loadReducedMotion() {
    try {
      const v = localStorage.getItem(RM_KEY);
      if (v !== null) return v === '1';
    } catch { /* storage unavailable */ }
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }

  setReducedMotion(on) {
    this.reducedMotion = on;
    try { localStorage.setItem(RM_KEY, on ? '1' : '0'); } catch { /* storage unavailable */ }
    document.documentElement.classList.toggle('reduce-motion', on);
    this.stage?.setReducedMotion(on);
    for (const obj of this.cache.values()) obj.setReducedMotion?.(on);
  }

  // ── Events ────────────────────────────────────────────────────
  bindEvents() {
    const L = this.layout;
    L.btnPrevSlide.addEventListener('click', () => this.prev());
    L.btnNextSlide.addEventListener('click', () => this.next());
    L.btnMenu.addEventListener('click', () => this.openMenu());
    L.menu.addEventListener('click', (e) => {
      if (e.target === L.menu || e.target.closest('a')) this.closeMenu();
    });
    L.textPanel.addEventListener('click', (e) => {
      const b = e.target.closest('[data-nav]');
      if (b) (b.dataset.nav === 'prev' ? this.prev() : this.next());
    });
    L.reduceMotionInput.addEventListener('change', () => this.setReducedMotion(L.reduceMotionInput.checked));
    window.addEventListener('hashchange', () => {
      const i = this.indexFromHash();
      if (i !== null && i !== this.i) this.goTo(i);
    });
    document.addEventListener('keydown', (e) => this.onKey(e));

    // Swipe left/right on the text panel changes slides (the 3D canvas keeps drag = orbit).
    let t0 = null;
    L.textPanel.addEventListener('touchstart', (e) => {
      const t = e.changedTouches[0];
      t0 = { x: t.clientX, y: t.clientY, at: Date.now() };
    }, { passive: true });
    L.textPanel.addEventListener('touchend', (e) => {
      if (!t0) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - t0.x;
      const dy = t.clientY - t0.y;
      const quick = Date.now() - t0.at < 700;
      t0 = null;
      if (quick && Math.abs(dx) > 60 && Math.abs(dx) > 1.6 * Math.abs(dy)) (dx < 0 ? this.next() : this.prev());
    }, { passive: true });
  }

  onKey(e) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target;
    const tag = t?.tagName;
    if (!this.layout.menu.hidden) {
      if (e.key === 'Escape') { e.preventDefault(); this.closeMenu(); }
      return;
    }
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || t?.isContentEditable) return;
    const onControl = tag === 'BUTTON' || tag === 'A' || tag === 'SUMMARY';
    const handled = () => e.preventDefault();

    switch (e.key) {
      case 'ArrowRight': case 'PageDown': handled(); this.next(); break;
      case 'ArrowLeft': case 'PageUp': handled(); this.prev(); break;
      case ' ': if (onControl) return; handled(); this.next(); break;
      case 'Home': handled(); this.goTo(0); break;
      case 'End': handled(); this.goTo(this.slides.length - 1); break;
      case 'p': case 'P': handled(); this.demo.togglePlay(); break;
      case '.': handled(); this.demo.next(); break;
      case ',': handled(); this.demo.prev(); break;
      case 'r': case 'R': handled(); this.demo.restart(); break;
      case 'd': case 'D': this.stage?.toggleDebug(); break;
      case 'Escape': this.tooltip.hide(); break;
      default:
    }
  }
}
