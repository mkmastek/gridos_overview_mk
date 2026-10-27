// Slide 15 — GridOS Field: digital damage assessment.
// A crew finds a snapped pole and a downed line, fills a damage form on a tablet (shown
// enlarged), GridOS Field checks the pole number against the network model (a wrong number
// is caught, then corrected), and the verified record syncs to ADMS, OMS and GIS at once.

import * as THREE from 'three';
import { finishScene, stepsFromContent, stepTimeline, lerp } from './common.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const ROAD_Z = 2.6;
const TABLET = { pos: V(-5.4, 4.3, 3.2), w: 3.9, h: 2.7 };
const MODEL = V(3.6, 6.8, -2.4);
const SYSTEMS = { adms: V(-7.5, 10.6, -7), oms: V(0, 11.2, -8), gis: V(7.5, 10.6, -7) };

export function createScene(stage, kit, ctx) {
  const { assets: A, flow: F, labels: L, materials: M } = kit;
  const content = ctx.content;
  const { scene, camera } = A.createBaseScene({ ground: { width: 46, depth: 30 }, shadowExtent: 24, fogNear: 60, fogFar: 140 });
  const S = { truck: 0, crew: 0, form: 0, flash: 0, q1: 0, r1: 0, warn: 0, fix: 0, q2: 0, r2: 0, ok: 0, sync: 0, mark: 0, plan: 0 };
  const view = { reduced: false };

  // ── Street, poles and the damage ────────────────────────────
  scene.add(A.createRoad(V(-23, 0, ROAD_Z), V(23, 0, ROAD_Z), 1.6));
  const offMat = M.stdMat(M.PALETTE.off, { emissive: M.PALETTE.off, emissiveIntensity: 0.2 });
  const downMat = M.stdMat(M.PALETTE.fault, { emissive: M.PALETTE.fault, emissiveIntensity: 0.6 });
  const top = (x) => {
    const p = A.createPole({ height: 4.6 });
    p.position.set(x, 0, -0.6);
    scene.add(p);
    return p.position.clone().add(p.userData.top);
  };
  const tops = { a: top(-12), b: top(-6), c: top(6), d: top(12) };
  scene.add(A.createConductor(A.catenary(tops.a, tops.b, 0.3, 10), offMat, 0.04));
  scene.add(A.createConductor(A.catenary(tops.c, tops.d, 0.3, 10), offMat, 0.04));
  // Downed line: from the neighbouring poles to the ground near the break.
  scene.add(A.createConductor([tops.b, V(-3.6, 2.2, -0.3), V(-1.2, 0.3, 0.1), V(-0.4, 0.1, 0.3)], downMat, 0.045));
  scene.add(A.createConductor([tops.c, V(3.8, 2.0, -0.6), V(2.2, 0.3, -0.2), V(1.4, 0.1, 0.1)], downMat, 0.045));
  // Snapped pole: a stub and the broken top lying across the ground.
  const stub = A.createPole({ height: 1.5, crossarm: false });
  stub.position.set(0, 0, -0.6);
  const brokenTop = A.createPole({ height: 3.2 });
  brokenTop.position.set(0.15, 1.4, -0.6);
  brokenTop.rotation.z = -1.99;
  scene.add(stub, brokenTop);

  scene.add(A.createHouses([-14, -9.5, 8.5, 14].map((x, i) => ({ x, z: -4.6, solar: i % 2 === 0 }))).group);
  scene.add(A.createTrees([[-18, -3], [-3.5, -5.5], [3.5, -5.8], [18, -2.5], [-16, 7], [9, 7.5], [16, 7]].map(([x, z], i) => ({ x, z, s: 0.9 + (i % 3) * 0.15 }))));

  // ── Crew, tablet and truck ──────────────────────────────────
  const truck = A.createCrewTruck();
  scene.add(truck.group);
  const crew = A.createPerson({ color: '#F28C28' });
  crew.position.set(-2.3, 0, 1.3);
  scene.add(crew);
  const tablet = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.24, 0.03), M.glowMat(M.PALETTE.data, { blending: THREE.NormalBlending }));
  tablet.position.set(-2.0, 0.66, 1.4);
  tablet.rotation.set(-0.6, 0.6, 0);
  scene.add(tablet);
  const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: M.glowTexture(), color: '#FFFFFF', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  flash.position.set(-1.9, 0.8, 1.4);
  scene.add(flash);

  // Enlarged tablet screen (canvas form).
  const formCanvas = document.createElement('canvas');
  formCanvas.width = 640;
  formCanvas.height = 444;
  const formTex = new THREE.CanvasTexture(formCanvas);
  formTex.colorSpace = THREE.SRGBColorSpace;
  const formPanel = A.createGlassPanel({ width: TABLET.w, height: TABLET.h, color: M.PALETTE.data, map: formTex, opacity: 0.97 });
  formPanel.group.position.copy(TABLET.pos);
  formPanel.group.rotation.y = 0.28;
  scene.add(formPanel.group);
  const tether = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([tablet.position.clone(), TABLET.pos.clone().add(V(0.6, -TABLET.h / 2, 0))]),
    new THREE.LineDashedMaterial({ color: M.PALETTE.data, dashSize: 0.18, gapSize: 0.12, transparent: true, opacity: 0.8 }),
  );
  tether.computeLineDistances();
  scene.add(tether);

  // Network model hologram (where every asset is).
  const model = new THREE.Group();
  const ringMat = M.glowMat(M.BRAND.violet, { blending: THREE.NormalBlending, opacity: 0.85 });
  const disc = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.25, 40).rotateX(-Math.PI / 2), ringMat);
  model.add(disc);
  const nodes = [[-0.7, -0.3], [-0.2, 0.5], [0.4, -0.1], [0.8, 0.5], [0.1, -0.7]];
  const nodeMat = M.glowMat(M.BRAND.violet, { blending: THREE.NormalBlending });
  for (const [x, z] of nodes) {
    const n = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), nodeMat);
    n.position.set(x, 0.15, z);
    model.add(n);
  }
  const lp = [];
  for (const [a, b] of [[0, 1], [1, 2], [2, 3], [2, 4]]) lp.push(nodes[a][0], 0.15, nodes[a][1], nodes[b][0], 0.15, nodes[b][1]);
  const lg = new THREE.BufferGeometry();
  lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
  model.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: '#D6B4F5', toneMapped: false })));
  model.position.copy(MODEL);
  scene.add(model);

  // ── Control-room systems (canvas panels) ────────────────────
  const sysPanels = {};
  for (const [key, pos] of Object.entries(SYSTEMS)) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 300;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const p = A.createGlassPanel({ width: 4.6, height: 2.7, color: M.PALETTE.data, map: tex, opacity: 0.95 });
    p.group.position.copy(pos);
    scene.add(p.group);
    sysPanels[key] = { canvas, tex, panel: p, sig: '' };
  }

  // ── Packets ──────────────────────────────────────────────────
  const P = content.packets;
  const arc = (a, b, lift = 2) => new THREE.QuadraticBezierCurve3(a, V((a.x + b.x) / 2, Math.max(a.y, b.y) + lift, (a.z + b.z) / 2), b);
  const formTop = TABLET.pos.clone().add(V(0.4, TABLET.h / 2, 0));
  const trail = (path, color, text, kind) => {
    const t = new F.PacketTrail({ path, color, size: 0.24, label: text ? { text, kind } : null });
    scene.add(t.object3D);
    return t;
  };
  const q1 = trail(arc(formTop, MODEL), M.PALETTE.data, P.check, 'data');
  const r1 = trail(arc(MODEL, formTop), M.PALETTE.ai, P.reply, 'decision');
  const q2 = trail(arc(formTop, MODEL), M.PALETTE.data, P.recheck, 'data');
  const r2 = trail(arc(MODEL, formTop), M.PALETTE.restored, P.match, 'decision');
  const syncTrails = Object.values(SYSTEMS).map((pos, k) => trail(arc(formTop, pos.clone().add(V(0, -1.35, 0)), 1.5), M.PALETTE.data, k === 0 ? P.record : null, 'data'));

  // ── Labels ───────────────────────────────────────────────────
  const lab = content.labels;
  const labels = {
    adms: L.label(lab.adms, { variant: 'accent' }),
    oms: L.label(lab.oms, { variant: 'accent' }),
    gis: L.label(lab.gis, { variant: 'accent' }),
    tablet: L.label(lab.tablet),
    pole: L.label(lab.pole, { anchor: 'left' }),
    model: L.label(lab.model),
  };
  labels.adms.position.copy(SYSTEMS.adms).add(V(0, 1.55, 0));
  labels.oms.position.copy(SYSTEMS.oms).add(V(0, 1.55, 0));
  labels.gis.position.copy(SYSTEMS.gis).add(V(0, 1.55, 0));
  labels.tablet.position.copy(TABLET.pos).add(V(0, TABLET.h / 2 + 0.15, 0));
  labels.pole.position.set(1.0, 1.9, -0.6);
  labels.model.position.copy(MODEL).add(V(0, 0.5, 0));
  for (const l of Object.values(labels)) scene.add(l);

  // ── Timeline ─────────────────────────────────────────────────
  const timeline = stepTimeline([2.4, 2.8, 4.8, 2.6, 2.2], (tl, at, k) => {
    const q = (d) => `${at}+=${d}`;
    if (k === 1) {
      tl.to(S, { truck: 1, duration: 1.6, ease: 'power2.out' }, q(0));
      tl.to(S, { crew: 1, duration: 0.5 }, q(1.5));
    }
    if (k === 2) {
      tl.to(S, { form: 1, duration: 2.2, ease: 'none' }, q(0.2));
      tl.to(S, { flash: 1, duration: 0.08 }, q(1.1)).to(S, { flash: 0, duration: 0.4 }, q(1.2));
    }
    if (k === 3) {
      tl.to(S, { q1: 1, duration: 0.9, ease: 'power1.inOut' }, q(0.1));
      tl.to(S, { r1: 1, duration: 0.9, ease: 'power1.inOut' }, q(1.0));
      tl.to(S, { warn: 1, duration: 0.3 }, q(1.85));
      tl.to(S, { fix: 1, duration: 0.3 }, q(2.5));
      tl.to(S, { q2: 1, duration: 0.8, ease: 'power1.inOut' }, q(2.8));
      tl.to(S, { r2: 1, duration: 0.8, ease: 'power1.inOut' }, q(3.6));
      tl.to(S, { ok: 1, duration: 0.3 }, q(4.35));
    }
    if (k === 4) {
      tl.to(S, { sync: 1, duration: 1.6, ease: 'power1.inOut' }, q(0.1));
      tl.to(S, { mark: 1, duration: 0.5 }, q(1.7));
    }
    if (k === 5) tl.to(S, { plan: 1, duration: 0.8 }, q(0.2));
  });

  const presets = {
    overview: { pos: [1, 10.5, 22], target: [-0.5, 5, -2] },
    site: { pos: [-3.5, 5, 10], target: [-0.6, 1.2, 0] },
    tablet: { pos: [-2.2, 5.6, 10.5], target: [-4, 3.8, 1.5] },
    check: { pos: [-0.6, 7.5, 14.5], target: [-0.8, 5, 0] },
    sync: { pos: [0, 11.5, 20], target: [0, 8, -4] },
  };

  // ── Canvas drawing ───────────────────────────────────────────
  const T = content.form;
  const g = formCanvas.getContext('2d');
  let formSig = '';
  const drawForm = () => {
    const sig = [Math.round(S.form * 8), S.warn > 0.5, S.fix > 0.5, S.ok > 0.5, S.sync > 0.98].join();
    if (sig === formSig) return;
    formSig = sig;
    const W = formCanvas.width;
    const H = formCanvas.height;
    g.clearRect(0, 0, W, H);
    g.fillStyle = '#FFFFFF';
    roundRect(g, 4, 4, W - 8, H - 8, 26);
    g.fill();
    g.fillStyle = '#001689';
    g.fillRect(4, 4, W - 8, 62);
    g.font = '700 30px "Titillium Web", "Trebuchet MS", sans-serif';
    g.fillStyle = '#FFFFFF';
    g.textBaseline = 'middle';
    g.textAlign = 'left';
    g.fillText(T.title, 28, 36);
    const row = (y, label, value, visible, color = '#1B2559') => {
      if (!visible) return;
      g.font = '500 20px "Poppins", "Trebuchet MS", sans-serif';
      g.fillStyle = '#56628A';
      g.fillText(label, 28, y);
      g.font = '600 24px "Poppins", "Trebuchet MS", sans-serif';
      g.fillStyle = color;
      g.fillText(value, 230, y);
    };
    const f = S.form;
    const asset = S.fix > 0.5 ? T.right : T.wrong;
    row(104, T.asset, asset, f > 0.1, S.warn > 0.5 && S.fix < 0.5 ? '#B5650A' : '#1B2559');
    row(150, T.damage, T.damageValue, f > 0.35);
    row(250, T.materials, T.materialsValue, f > 0.8);
    if (f > 0.55) {
      g.font = '500 20px "Poppins", "Trebuchet MS", sans-serif';
      g.fillStyle = '#56628A';
      g.fillText(T.photo, 28, 200);
      // Photo thumbnail: a snapped pole.
      g.fillStyle = '#DCE4F2';
      g.fillRect(230, 178, 110, 46);
      g.strokeStyle = '#6D5643';
      g.lineWidth = 6;
      g.beginPath(); g.moveTo(262, 222); g.lineTo(262, 196); g.lineTo(300, 214); g.stroke();
    }
    // Validation result
    if (S.ok > 0.5) {
      g.fillStyle = '#E8F8EA';
      g.fillRect(20, 290, W - 40, 56);
      g.fillStyle = '#2E9E44';
      g.font = '600 22px "Poppins", "Trebuchet MS", sans-serif';
      g.fillText(`✔  ${T.checkOk}`, 36, 318);
    } else if (S.warn > 0.5) {
      g.fillStyle = '#FFF2DF';
      g.fillRect(20, 290, W - 40, 56);
      g.fillStyle = '#B5650A';
      g.font = '600 19px "Poppins", "Trebuchet MS", sans-serif';
      g.fillText(`⚠  ${T.checkWarn}`, 30, 318);
    }
    if (S.sync > 0.98) {
      g.fillStyle = '#0099A8';
      g.font = '600 22px "Poppins", "Trebuchet MS", sans-serif';
      g.fillText(`⇅  ${T.synced}`, 36, 388);
    }
    formTex.needsUpdate = true;
  };

  const PT = content.panelText;
  const drawSystem = (key, idx) => {
    const sp = sysPanels[key];
    const sig = [S.mark > 0.5, S.plan > 0.5].join();
    if (sig === sp.sig) return;
    sp.sig = sig;
    const c = sp.canvas.getContext('2d');
    const W = sp.canvas.width;
    const H = sp.canvas.height;
    c.clearRect(0, 0, W, H);
    c.fillStyle = 'rgba(14, 24, 70, 0.92)';
    roundRect(c, 3, 3, W - 6, H - 6, 18);
    c.fill();
    c.strokeStyle = 'rgba(15, 189, 255, 0.85)';
    c.lineWidth = 3;
    c.stroke();
    // A simple map: streets and a feeder line, slightly different per system.
    c.strokeStyle = 'rgba(185, 198, 234, 0.35)';
    c.lineWidth = 6;
    for (let i = 0; i < 3; i += 1) { c.beginPath(); c.moveTo(20, 70 + i * 70); c.lineTo(W - 20, 60 + i * 72 + idx * 6); c.stroke(); }
    c.strokeStyle = '#7C88A9';
    c.lineWidth = 4;
    c.beginPath(); c.moveTo(40, 150); c.lineTo(W - 40, 150); c.stroke();
    if (S.mark > 0.5) {
      c.fillStyle = '#E63946';
      c.beginPath(); c.arc(W / 2, 150, 16, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#FFFFFF';
      c.font = '600 22px "Titillium Web", "Trebuchet MS", sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(`${PT.record}: ${PT.pole}`, W / 2, 205);
    }
    if (S.plan > 0.5) {
      c.fillStyle = '#5ECC62';
      c.font = '600 22px "Titillium Web", "Trebuchet MS", sans-serif';
      c.textAlign = 'center';
      c.fillText(`✔ ${PT.plan}`, W / 2, 250);
    }
    sp.tex.needsUpdate = true;
  };

  // ── Per frame ────────────────────────────────────────────────
  let hudKey = '';
  const update = (dt, t) => {
    truck.group.visible = S.truck > 0.01;
    truck.group.position.set(lerp(-26, -7, S.truck), 0, ROAD_Z);
    truck.lightMaterial.opacity = 0.5 + 0.5 * (Math.sin(t * 9) > 0 ? 1 : 0);
    crew.visible = S.crew > 0.5;
    tablet.visible = S.crew > 0.5;
    downMat.emissiveIntensity = 0.35 + 0.35 * (0.5 + 0.5 * Math.sin(t * 5));
    flash.visible = S.flash > 0.01;
    flash.scale.setScalar(0.5 + 2.5 * S.flash);
    flash.material.opacity = S.flash;
    formPanel.group.visible = S.form > 0.01;
    tether.visible = S.form > 0.01;
    L.setLabelOpacity(labels.tablet, S.form > 0.01 ? 1 : 0);
    if (!view.reduced) model.rotation.y += dt * 0.4;
    ringMat.opacity = S.q1 > 0.01 && S.r2 < 0.99 ? 1 : 0.55; // brighter while it is being asked

    q1.setProgress(S.q1);
    r1.setProgress(S.r1);
    q2.setProgress(S.q2);
    r2.setProgress(S.r2);
    for (const s of syncTrails) s.setProgress(S.sync);
    for (const sp of Object.values(sysPanels)) sp.panel.edgeMaterial.opacity = 0.5 + 0.5 * Math.max(S.mark, S.plan);

    drawForm();
    drawSystem('adms', 0);
    drawSystem('oms', 1);
    drawSystem('gis', 2);

    const h = content.hud;
    let status = null;
    if (S.sync > 0.98) status = { v: h.synced, mood: 'ok' };
    else if (S.ok > 0.5) status = { v: h.verified, mood: 'ok' };
    else if (S.q1 > 0.01) status = { v: h.checking, mood: 'warn' };
    else if (S.form > 0.01) status = { v: h.draft, mood: '' };
    const key = status ? status.v : '';
    if (key !== hudKey) {
      hudKey = key;
      ctx.setHud(status ? { items: [{ label: h.label, value: status.v, mood: status.mood }] } : null);
    }
  };

  return finishScene({
    scene, camera, timeline, presets, update,
    steps: stepsFromContent(content, ['site', 'tablet', 'check', 'sync', 'overview']),
    startPreset: 'overview',
    onEnter: () => { hudKey = '-'; formSig = ''; for (const sp of Object.values(sysPanels)) sp.sig = ''; },
    setReducedMotion: (on) => { view.reduced = on; },
    controlsLimits: { minDistance: 5, maxDistance: 60 },
    dispose: () => {
      for (const t of [q1, r1, q2, r2, ...syncTrails]) t.dispose();
      formTex.dispose();
      for (const sp of Object.values(sysPanels)) sp.tex.dispose();
    },
  });
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
