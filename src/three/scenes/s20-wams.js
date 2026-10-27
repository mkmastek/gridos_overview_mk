// Slide 20 — WAMS demo: PMUs stream fast, time-stamped measurements to a PDC; a forced
// oscillation ripples across the region (substations bob, colour = phase); OSM measures it,
// OSL traces it to the data-center campus, operators remove it; the inertia gauge reacts to
// the "Renewable share" slider. All numbers are illustrative.

import * as THREE from 'three';
import { finishScene, stepsFromContent, stepTimeline, clamp01 } from './common.js';
import { createBusNode, createPMU, createGPSSatellite, createPDC, createRTU, ripple } from '../kit/Transmission.js';
import { createCanvasPanel, chartFrame } from '../kit/Plots3D.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));

const SUBS = [V(-22, 0, -10), V(-12, 0, -12), V(-2, 0, -11), V(10, 0, -12), V(21, 0, -8), V(-19, 0, 2), V(-8, 0, -1), V(7, 0, 1), V(17, 0, 4), V(-3, 0, 11)];
const EDGES = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [1, 6], [2, 6], [2, 7], [3, 7], [4, 8], [5, 6], [6, 7], [7, 8], [6, 9], [7, 9]];
const SOURCE = V(15, 0, 12);
const SOURCE_SUB = 8;
const PDC_POS = V(-1, 0, 4.5);
const PANEL = V(-1, 10.5, 2);
const CHART = V(11, 12.5, -5);
const INERTIA = V(-23, 0, 10);
const MODE_HZ = 0.25;

export function createScene(stage, kit, ctx) {
  const { assets: A, flow: F, labels: L, materials: M, charts: CH } = kit;
  const content = ctx.content;
  const lab = content.labels;
  const T = content.wams;
  const pk = content.packets;
  const ctl = content.controls;
  const C = M.COLOR;
  const { scene, camera } = A.createBaseScene({ ground: { width: 60, depth: 40 }, shadowExtent: 32, fogNear: 80, fogFar: 170 });
  const flows = [];

  // ── Region: substations with PMUs, and the lines between them ─
  const subs = SUBS.map((p) => {
    const b = createBusNode({ radius: 1.1 });
    b.group.position.copy(p);
    scene.add(b.group);
    const pmu = createPMU();
    pmu.position.copy(p).add(V(1.7, 0, 0.6));
    scene.add(pmu);
    return { ...b, pmu, base: p.clone(), dist: p.distanceTo(SOURCE), color: new THREE.Color() };
  });
  const lineMat = M.stdMat(M.PALETTE.flow, { emissive: M.PALETTE.flow, emissiveIntensity: 0.45 });
  for (const [a, b] of EDGES) {
    const path = A.catenary(SUBS[a].clone().setY(1.5), SUBS[b].clone().setY(1.5), 0.3, 10);
    scene.add(A.createConductor(path, lineMat, 0.08));
    const f = new F.PowerFlow({ path, color: M.PALETTE.flow, density: 0.9, size: 0.34 });
    scene.add(f.object3D);
    flows.push(f);
  }

  // Oscillation source: the data-center campus
  const dcs = [[13, 12], [17.5, 12.6]].map(([x, z]) => {
    const d = A.createDataCenter({ w: 3.6, d: 2.4, h: 1.3 });
    d.group.position.set(x, 0, z);
    scene.add(d.group);
    return d;
  });
  const sourceGlow = new THREE.Mesh(new THREE.PlaneGeometry(9, 9).rotateX(-Math.PI / 2), M.glowMat(M.PALETTE.ai, { map: M.glowTexture(), opacity: 0 }));
  sourceGlow.position.copy(SOURCE).setY(0.08);
  scene.add(sourceGlow);
  const srcFeed = new F.PowerFlow({ path: [SUBS[SOURCE_SUB].clone().setY(0.12), SOURCE.clone().setY(0.12)], color: M.PALETTE.flow, density: 1, size: 0.3 });
  scene.add(srcFeed.object3D);
  flows.push(srcFeed);

  // GPS time for every PMU
  const sats = [V(-12, 19, -16), V(13, 20, -15)].map((p) => {
    const s = createGPSSatellite();
    s.position.copy(p);
    scene.add(s);
    return s;
  });
  const syncBeams = subs.map((s, i) => {
    const b = A.createBeam(sats[i % 2].position, s.pmu.position.clone().add(V(0.18, 1.05, 0)), { color: '#C9D3EE', radius: 0.015, opacity: 0.12 });
    scene.add(b);
    return b;
  });

  // PDC hub, one slow RTU, the WAMS panel and the frequency chart
  const pdc = createPDC();
  pdc.group.position.copy(PDC_POS);
  scene.add(pdc.group);
  const rtu = createRTU();
  rtu.position.copy(SUBS[0]).add(V(-1.8, 0, 1.2));
  scene.add(rtu);
  const panel = A.createGlassPanel({ width: 8, height: 2.4, color: M.BRAND.lightBlue });
  panel.group.position.copy(PANEL);
  scene.add(panel.group);

  const chart = createCanvasPanel({
    width: 9, height: 3.6, px: 900,
    draw: (g, w, h, st) => {
      chartFrame(g, w, h, T.chartTitle);
      const x0 = 30;
      const x1 = w - 30;
      const yMid = h * 0.56;
      g.strokeStyle = 'rgba(185, 198, 234, 0.35)';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(x0, yMid);
      g.lineTo(x1, yMid);
      g.stroke();
      g.lineWidth = 5;
      g.strokeStyle = st.dip ? '#0FBDFF' : st.amp > 0.05 ? '#F15BB5' : '#0099A8';
      g.beginPath();
      for (let i = 0; i <= 240; i += 1) {
        const u = i / 240;
        let y;
        if (st.dip) {
          // Frequency after a generator trip: a dip that recovers (deeper with less inertia)
          const k = u < 0.2 ? 0 : (u - 0.2) * 7;
          y = -st.dipDepth * (k * Math.exp(1 - k)) * (u < 0.2 ? 0 : 1);
        } else {
          const env = st.amp * Math.exp(st.growth * (u - 1) * 3);
          y = env * Math.sin(u * Math.PI * 2 * 6);
        }
        const py = yMid - y * h * 0.32;
        const px = x0 + u * (x1 - x0);
        if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
      }
      g.stroke();
      g.fillStyle = '#FFFFFF';
      g.font = '600 26px "Poppins", "Trebuchet MS", sans-serif';
      g.textAlign = 'right';
      g.textBaseline = 'middle';
      g.fillText(st.dip ? fill(T.chartDip, { dip: st.dipText }) : fill(T.chartMode, { f: MODE_HZ, d: st.damp }), w - 28, 34);
    },
  });
  chart.group.position.copy(CHART);
  scene.add(chart.group);

  // Inertia gauge (driven by the slider)
  const gauge = CH.createBarGauge({ height: 4.4, width: 0.8, maxPct: 100, limitPct: 100 });
  gauge.group.position.copy(INERTIA);
  scene.add(gauge.group);
  const inertiaEl = document.createElement('div');
  inertiaEl.className = 'label3d';
  const inTitle = document.createElement('span');
  inTitle.className = 'label3d__title';
  inTitle.textContent = lab.inertia.title;
  const inSub = document.createElement('span');
  inSub.className = 'label3d__sub';
  inertiaEl.append(inTitle, inSub);
  const inertiaLabel = L.elementLabel(inertiaEl);
  inertiaLabel.position.copy(INERTIA).add(V(0, 5, 0));
  scene.add(inertiaLabel);

  // OSL: lines from every substation converge on the source
  const oslBeams = subs.map((s) => {
    const b = A.createBeam(s.base.clone().setY(2.2), SOURCE.clone().setY(1.6), { color: M.PALETTE.ai, radius: 0.05, opacity: 0 });
    scene.add(b);
    return b;
  });

  // ── Streams and labelled packets ────────────────────────────
  const pmuTop = (s) => s.pmu.position.clone().add(V(0.18, 1.1, 0));
  const pdcTop = PDC_POS.clone().add(V(0, 2.3, 0));
  const panelBottom = PANEL.clone().add(V(0, -1.2, 0));
  const pmuStream = new F.PacketStream({ paths: subs.map((s) => [pmuTop(s), pdcTop]), color: M.PALETTE.data, perPath: 4, size: 0.16, velocity: 9 });
  const pdcStream = new F.PacketStream({ paths: [[pdcTop, panelBottom]], color: M.PALETTE.data, perPath: 5, size: 0.2, velocity: 7 });
  const rtuStream = new F.PacketStream({ paths: [[rtu.position.clone().add(V(0.22, 1.6, 0)), panelBottom.clone().add(V(-3, 0, 0))]], color: M.PALETTE.data, perPath: 1, size: 0.3, velocity: 1.1 });
  scene.add(pmuStream.object3D, pdcStream.object3D, rtuStream.object3D);
  flows.push(pmuStream, pdcStream, rtuStream);
  const arc = (a, b, lift = 2.4) => new THREE.QuadraticBezierCurve3(a, V((a.x + b.x) / 2, Math.max(a.y, b.y) + lift, (a.z + b.z) / 2), b);
  const trail = (a, b, text, kind, color) => {
    const t = new F.PacketTrail({ path: arc(a, b), color, label: { text, kind } });
    scene.add(t.object3D);
    return t;
  };
  const trails = {
    tp: trail(pmuTop(subs[7]), pdcTop, pk.pmu, 'data', M.PALETTE.data),
    ts: trail(rtu.position.clone().add(V(0.22, 1.6, 0)), panelBottom.clone().add(V(-3, 0, 0)), pk.scada, 'data', M.PALETTE.data),
    to: trail(panelBottom.clone().add(V(2, 0, 0)), SOURCE.clone().setY(2), pk.osl, 'decision', M.PALETTE.ai),
  };

  // ── Labels ──────────────────────────────────────────────────
  const at = (def, p, opts) => { const l = L.label(def, opts); l.position.copy(p); scene.add(l); return l; };
  const labels = {
    pdc: at(lab.pdc, PDC_POS.clone().add(V(-2.6, 2.4, 0)), { anchor: 'right' }),
    wams: at(lab.wams, PANEL, { anchor: 'center', variant: 'big' }),
    pmu: at(lab.pmu, pmuTop(subs[7]).add(V(0, 0.4, 0))),
    rtu: at(lab.rtu, rtu.position.clone().add(V(0.6, 2.4, 0)), { anchor: 'left' }),
    gps: at(lab.gps, sats[0].position.clone().add(V(0, 0.9, 0))),
    source: at(lab.source, SOURCE.clone().add(V(0, 2.4, 1.4))),
  };

  // ── State and timeline ─────────────────────────────────────
  const S = { stream: 1, scadaFocus: 0, osc: 0, grow: 0, damp: 4, detect: 0, osl: 0, fix: 0, inertia: 0, tp: 0, ts: 0, to: 0 };
  let share = 30;
  const timeline = stepTimeline([3.6, 3.0, 2.6, 3.0, 2.8, 2.4], (tl, at2, k) => {
    const q = (d) => `${at2}+=${d}`;
    if (k === 1) {
      tl.to(S, { scadaFocus: 1, duration: 0.4 }, q(0));
      tl.to(S, { tp: 1, duration: 1.2, ease: 'power1.inOut' }, q(0.2));
      tl.to(S, { ts: 1, duration: 3.2, ease: 'none' }, q(0.2));
    }
    if (k === 2) tl.to(S, { scadaFocus: 0, osc: 1, duration: 0.8 }, q(0)).to(S, { grow: 1, damp: -1, duration: 2.2 }, q(0.6));
    if (k === 3) tl.to(S, { detect: 1, duration: 0.6 }, q(0.2));
    if (k === 4) tl.to(S, { osl: 1, duration: 1.6 }, q(0.2)).to(S, { to: 1, duration: 1.4, ease: 'power1.inOut' }, q(0.4));
    if (k === 5) tl.to(S, { fix: 1, osc: 0, grow: 0, damp: 9, osl: 0.3, duration: 2.0, ease: 'power1.inOut' }, q(0.3));
    if (k === 6) tl.to(S, { inertia: 1, osl: 0, duration: 0.8 }, q(0.2));
  });

  const presets = {
    overview: { pos: [0, 27, 38], target: [0, 2, 0] },
    panel: { pos: [3, 17, 25], target: [4, 8, -3] },
    source: { pos: [10, 13, 28], target: [11, 2, 7] },
    inertia: { pos: [-12, 11, 24], target: [-18, 3.5, 6] },
  };

  // ── Per-frame rendering ─────────────────────────────────────
  const inertiaH = () => 6.5 - 0.06 * share; // seconds, illustrative
  const dipHz = (h) => 0.9 / h; // illustrative
  let chartKey = '';
  let hudKey = '';

  function update(dt, t) {
    const amp = S.osc * (0.35 + 0.65 * S.grow);
    subs.forEach((s, i) => {
      const r = ripple(t, s.dist, { freq: 0.5, waveLength: 20, amp: 0.55 * amp });
      s.group.position.y = r.y;
      s.pmu.position.y = r.y;
      if (amp > 0.02) s.color.setHSL(0.55 + 0.35 * r.phase, 0.8, 0.6);
      else s.color.copy(C.flow);
      if (S.fix > 0.02) s.color.lerp(C.restored, S.fix * 0.6);
      s.setColor(s.color, 0.7);
      oslBeams[i].material.opacity = 0.75 * S.osl;
    });
    for (const f of flows) {
      if (f === pmuStream) f.intensity = S.stream;
      else if (f === rtuStream) f.intensity = 0.4 + 0.6 * S.scadaFocus;
      f.update(dt);
    }
    sourceGlow.material.opacity = 0.85 * Math.max(S.osl, amp * S.detect * 0.4);
    for (const b of syncBeams) b.material.opacity = 0.08 + 0.14 * S.scadaFocus;
    for (const [k, tr] of Object.entries(trails)) tr.setProgress(S[k]);
    pdc.ringMat.opacity = 0.6 + 0.4 * Math.sin(t * 6);
    panel.material.opacity = 0.16 + 0.22 * Math.max(S.detect, S.osl);
    labels.source.element.classList.toggle('label3d--accent', S.osl > 0.5);
    L.setLabelOpacity(labels.source, 0.5 + 0.5 * Math.max(S.osl, S.fix));
    L.setLabelOpacity(labels.rtu, 0.5 + 0.5 * S.scadaFocus);
    L.setLabelOpacity(labels.pmu, 0.5 + 0.5 * S.scadaFocus);
    L.setLabelOpacity(labels.gps, 0.4 + 0.6 * S.scadaFocus);

    // Inertia gauge from the slider
    const h = inertiaH();
    gauge.setValue((h / 7) * 100);
    gauge.setColor(h > 4 ? C.restored : h > 2.6 ? C.warning : C.fault);
    gauge.setOpacity(0.55 + 0.45 * S.inertia);
    const hs = fill(T.hudInertiaValue, { h: h.toFixed(1) });
    if (inSub.textContent !== hs) inSub.textContent = hs;
    inertiaEl.classList.toggle('label3d--accent', S.inertia > 0.5);

    // Frequency chart (redrawn only when what it shows changes)
    const dip = S.inertia > 0.5;
    const damp = Math.round(S.damp);
    const st = { amp, growth: S.grow, damp, dip, dipDepth: Math.min(1, dipHz(h) * 1.5), dipText: dipHz(h).toFixed(2) };
    const key = JSON.stringify([Math.round(amp * 40), Math.round(S.grow * 20), damp, dip, st.dipText]);
    if (key !== chartKey) { chartKey = key; chart.redraw(st); }

    // Readouts
    let items;
    if (dip) {
      items = [
        { label: T.hudInertia, value: hs, mood: h > 4 ? 'ok' : 'warn' },
        { label: T.hudDip, value: fill(T.hudDipValue, { dip: st.dipText }), mood: dipHz(h) > 0.3 ? 'alert' : 'ok' },
      ];
    } else if (S.osc > 0.05 || S.fix > 0.05) {
      items = [
        { label: T.hudMode, value: fill(T.hudModeValue, { f: MODE_HZ }), mood: '' },
        { label: T.hudDamping, value: fill(T.hudDampingValue, { d: damp }), mood: damp < 3 ? 'alert' : 'ok' },
      ];
    } else items = null;
    const hk = JSON.stringify(items);
    if (hk !== hudKey) { hudKey = hk; ctx.setHud(items ? { items } : null); }
  }

  return finishScene({
    scene, camera, timeline, flows, presets, update,
    steps: stepsFromContent(content, ['overview', 'overview', 'panel', 'overview', 'source', 'inertia']),
    startPreset: 'overview',
    onEnter: () => { hudKey = ''; chartKey = ''; },
    controlsLimits: { minDistance: 8, maxDistance: 100 },
    interactions: [
      {
        id: 'share', type: 'slider', label: ctl.share, min: 10, max: 80, step: 1, value: share,
        format: (v) => fill(ctl.shareUnit, { v }),
        onChange: (v) => { share = v; },
      },
    ],
    dispose: () => chart.texture.dispose(),
  });
}
