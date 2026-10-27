// The one shared 3D stage: a single WebGLRenderer + CSS2DRenderer for the whole deck.
// Slides hand it a scene object; the stage renders only the active one, pauses when the
// tab is hidden or the stage is off-screen, and owns the orbit controls and picking.

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { SCENE } from './materials.js';
import { flyTo as flyCamera, farther } from './kit/Camera.js';

export class Stage {
  constructor(container, { tooltip }) {
    this.container = container;
    this.tooltip = tooltip;
    this.active = null;
    this.reducedMotion = false;
    this.reserveBottom = 0;
    // How the reserved band is made: 1 = shift the whole scene up, 0.5 = zoom out evenly
    // (frees half the band at the top and half at the bottom, centre unchanged).
    // A scene can choose its own with `reserveShift` (scenes with labels near the top use 0.5).
    this.reserveShift = 1;
    this.running = false;
    this.pageVisible = !document.hidden;
    this.onScreen = true;
    this.clock = new THREE.Clock();
    this.elapsed = 0;

    const r = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.setClearColor(SCENE.background, 1);
    this.renderer = r;

    this.labels = new CSS2DRenderer();
    this.labels.domElement.className = 'label-layer';
    container.prepend(r.domElement, this.labels.domElement);

    this.raycaster = new THREE.Raycaster();
    this.ndc = new THREE.Vector2();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();

    document.addEventListener('visibilitychange', () => {
      this.pageVisible = !document.hidden;
      this.updateRunning();
    });
    this.io = new IntersectionObserver((entries) => {
      this.onScreen = entries[entries.length - 1].isIntersecting;
      this.updateRunning();
    });
    this.io.observe(container);

    this.bindPointer();
    this.tick = this.tick.bind(this);
  }

  // ── Size ─────────────────────────────────────────────────────
  resize() {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(w, h, false);
    this.labels.setSize(w, h);
    if (this.active) {
      // A reserved band (for the flow strip) is made by rendering as if the canvas were taller,
      // which zooms the scene out slightly and keeps labels clear of the bottom overlay.
      const cam = this.active.camera;
      const r = this.reserveBottom;
      const shift = this.active.reserveShift ?? this.reserveShift;
      cam.aspect = w / (h + r);
      if (r) cam.setViewOffset(w, h + r, 0, r * shift, w, h);
      else cam.clearViewOffset();
      cam.updateProjectionMatrix();
    }
    if (this.active && !this.running) this.renderOnce();
  }

  /** Keep `px` at the bottom of the view free for the flow strip (0 = none). */
  setReserveBottom(px) {
    if (px === this.reserveBottom) return;
    this.reserveBottom = px;
    this.resize();
  }

  // ── Scene switching ──────────────────────────────────────────
  /** Show `obj` (a scene object from a scene module), or nothing with null. */
  activate(obj) {
    if (this.active === obj) return;
    if (this.active) {
      this.cameraTween?.kill();
      this.setLabelsDisplay(this.active.scene, 'none');
      this.controls?.dispose();
      this.controls = null;
    }
    this.tooltip.hide();
    this.active = obj;
    if (!obj) {
      this.renderer.clear();
      this.updateRunning();
      return;
    }
    const c = new OrbitControls(obj.camera, this.renderer.domElement);
    const lim = obj.controlsLimits || {};
    c.enableDamping = true;
    c.dampingFactor = 0.08;
    c.screenSpacePanning = true;
    c.minDistance = lim.minDistance ?? 6;
    c.maxDistance = lim.maxDistance ?? 90;
    c.maxPolarAngle = lim.maxPolarAngle ?? Math.PI / 2 - 0.06; // never under the map table
    c.minPolarAngle = lim.minPolarAngle ?? 0.05;
    c.addEventListener('start', () => { this.cameraTween?.kill(); this.tooltip.hide(); });
    this.controls = c;
    obj.setReducedMotion?.(this.reducedMotion);
    this.resize();
    this.updateRunning();
  }

  /** CSS2D label elements of an inactive scene must be hidden (they live in one shared layer). */
  setLabelsDisplay(root, value) {
    root.traverse((o) => { if (o.isCSS2DObject) o.element.style.display = value; });
  }

  /** Build GPU programs ahead of time for a scene that is about to be shown. */
  precompile(obj) {
    try { this.renderer.compile(obj.scene, obj.camera); } catch { /* not fatal */ }
  }

  // ── Camera ───────────────────────────────────────────────────
  /** Fly the active camera to a preset ({ pos, target }). `intro` starts further out. */
  flyTo(preset, { intro = false, duration = 1.4 } = {}) {
    if (!this.active || !preset || !this.controls) return;
    this.cameraTween?.kill();
    this.cameraTween = flyCamera(this.active.camera, this.controls, preset, {
      duration: intro ? 1.8 : duration,
      instant: this.reducedMotion,
      from: intro && !this.reducedMotion ? farther(preset, 1.4) : null,
    });
    if (!this.running) this.renderOnce();
  }

  setReducedMotion(on) {
    this.reducedMotion = on;
    this.active?.setReducedMotion?.(on);
  }

  // ── Loop ─────────────────────────────────────────────────────
  updateRunning() {
    const should = Boolean(this.active) && this.pageVisible && this.onScreen;
    if (should && !this.running) {
      this.running = true;
      this.clock.getDelta();
      requestAnimationFrame(this.tick);
    } else if (!should) {
      this.running = false;
    }
  }

  tick() {
    if (!this.running) return;
    requestAnimationFrame(this.tick);
    const dt = Math.min(this.clock.getDelta(), 0.1);
    this.elapsed += dt;
    this.renderOnce(dt);
    if (this.debugEl) this.updateDebug(dt);
  }

  renderOnce(dt = 0) {
    const a = this.active;
    if (!a) return;
    a.update?.(dt, this.elapsed);
    this.controls?.update();
    this.renderer.render(a.scene, a.camera);
    this.labels.render(a.scene, a.camera);
  }

  // ── Picking (click and hover on 3D objects) ──────────────────
  bindPointer() {
    const el = this.renderer.domElement;
    let down = null;
    let hoverQueued = null;
    const setRay = (e) => {
      const r = el.getBoundingClientRect();
      this.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      this.raycaster.setFromCamera(this.ndc, this.active.camera);
    };
    el.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
    el.addEventListener('pointerup', (e) => {
      if (!down || !this.active?.onClick) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      down = null;
      if (moved > 6) return;
      setRay(e);
      this.active.onClick(this.raycaster);
    });
    el.addEventListener('pointermove', (e) => {
      if (!this.active?.onHover || e.buttons) return;
      if (hoverQueued) { hoverQueued = e; return; }
      hoverQueued = e;
      requestAnimationFrame(() => {
        const ev = hoverQueued;
        hoverQueued = null;
        if (!this.active?.onHover) return;
        setRay(ev);
        const hit = this.active.onHover(this.raycaster);
        el.style.cursor = hit?.clickable ? 'pointer' : '';
        if (hit?.tip) this.tooltip.showAt(ev.clientX, ev.clientY, hit.tip);
        else this.tooltip.hide();
      });
    });
    el.addEventListener('pointerleave', () => { this.tooltip.hide(); el.style.cursor = ''; });
  }

  // ── Debug readout (press D): frame rate and GPU memory ───────
  toggleDebug() {
    if (this.debugEl) {
      this.debugEl.remove();
      this.debugEl = null;
      return;
    }
    this.debugEl = document.createElement('div');
    this.debugEl.className = 'debug';
    this.container.append(this.debugEl);
    this.fpsAcc = { t: 0, n: 0 };
    this.updateDebug(0, true);
  }

  updateDebug(dt, force = false) {
    this.fpsAcc.t += dt;
    this.fpsAcc.n += 1;
    if (!force && this.fpsAcc.t < 0.5) return;
    const fps = this.fpsAcc.t ? Math.round(this.fpsAcc.n / this.fpsAcc.t) : 0;
    this.fpsAcc = { t: 0, n: 0 };
    const i = this.renderer.info;
    this.debugEl.textContent = `fps ${fps}  calls ${i.render.calls}  tris ${i.render.triangles}\ngeometries ${i.memory.geometries}  textures ${i.memory.textures}  programs ${i.programs?.length ?? '-'}`;
  }
}
