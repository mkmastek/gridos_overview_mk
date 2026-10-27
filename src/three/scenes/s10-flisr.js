// Slide 10 — FLISR (Fault Location, Isolation and Service Restoration) centrepiece demo.
//
//   Substation A ─[CB-A]─ S1 ─[R1]─ S2 ─[SW2]─ S3 ─[SW3]─ S4 ─[TIE]─ S5 ─[CB-B]─ Substation B
//
// The tiny solver in src/sim/flisrSolver.js plans every action for the chosen fault location
// and Feeder B loading; this file turns the plan into a seekable timeline. All visuals are
// driven from one numeric state object S, which the timeline tweens.

import * as THREE from 'three';
import { finishScene, stepTimeline, clamp01, lerp } from './common.js';
import { solveFlisr, flisrSteps, FLISR_TOPOLOGY, FAULT_CHOICES } from '../../sim/flisrSolver.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const SECTIONS = ['S1', 'S2', 'S3', 'S4', 'S5'];
const DEVICES = ['R1', 'SW2', 'SW3', 'TIE'];

// Layout (world x). Line runs along x at z = 0; houses behind it, road in front.
const SUB_A = -25;
const SUB_B = 22;
const DEV_X = { R1: -14.5, SW2: -7, SW3: 0.5, TIE: 8 };
const MID_POLES = { S1: [-18.5], S2: [-10.75], S3: [-3.25], S4: [4.25], S5: [11.8, 15.6] };
const DEVICE_POLE_TOP = 4.42;
const LINE_Y = 4.82;
const ROAD_Z = 4.7;
const PANEL = { x: -1.5, y: 12.4, z: -9.5, w: 21, h: 6.4 };

export function createScene(stage, kit, ctx) {
  const { assets: A, flow: F, labels: L, materials: M, charts: CH } = kit;
  const content = ctx.content;
  const fl = content.flisr;
  const C = M.COLOR;
  const { scene, camera } = A.createBaseScene({ ground: { width: 66, depth: 36 }, shadowExtent: 34, fogNear: 70, fogFar: 170 });
  const flows = [];
  const options = { fault: 'S3', feederBHeavy: false };

  // ── Substations with their feeder breakers ──────────────────
  const subA = A.createSubstation({ w: 5, d: 4.4 });
  subA.position.set(SUB_A, 0, 0);
  const subB = A.createSubstation({ w: 5, d: 4.4 });
  subB.position.set(SUB_B, 0, 0);
  subB.rotation.y = Math.PI;
  scene.add(subA, subB);
  const exitA = subA.position.clone().add(subA.userData.exitE);
  const exitB = V(SUB_B - subA.userData.exitE.x, subA.userData.exitE.y, 0);

  const devices = {};
  const cbA = A.createSwitchDevice({ kind: 'breaker', span: 0.7 });
  cbA.group.position.set(SUB_A + 1.2, 0.16, 1.4);
  const cbB = A.createSwitchDevice({ kind: 'breaker', span: 0.7 });
  cbB.group.position.set(SUB_B - 1.2, 0.16, 1.4);
  scene.add(cbA.group, cbB.group);
  devices['CB-A'] = cbA;
  devices['CB-B'] = cbB;

  // ── Poles, devices and conductors per section ───────────────
  const poleAt = (x, height) => {
    const p = A.createPole({ height, crossarm: height > 4.6 });
    p.position.set(x, 0, 0);
    scene.add(p);
    return p;
  };
  for (const id of DEVICES) {
    poleAt(DEV_X[id], 4.5);
    const d = A.createSwitchDevice({ kind: id === 'R1' ? 'recloser' : 'switch', span: 0.9, lamp: id !== 'TIE' });
    d.group.position.set(DEV_X[id], DEVICE_POLE_TOP, 0);
    scene.add(d.group);
    devices[id] = d;
  }
  const term = (id, side) => devices[id].group.position.clone().add(devices[id].group.userData[side === 'W' ? 'terminalW' : 'terminalE']);
  const ends = {
    S1: [exitA, term('R1', 'W')], S2: [term('R1', 'E'), term('SW2', 'W')], S3: [term('SW2', 'E'), term('SW3', 'W')],
    S4: [term('SW3', 'E'), term('TIE', 'W')], S5: [term('TIE', 'E'), exitB],
  };

  const sec = {};
  for (const s of SECTIONS) {
    const pts = [ends[s][0], ...MID_POLES[s].map((x) => { poleAt(x, 4.9); return V(x, LINE_Y, 0); }), ends[s][1]];
    let path = [];
    for (let i = 0; i < pts.length - 1; i += 1) path = A.joinPaths(path, A.catenary(pts[i], pts[i + 1], 0.32, 12));
    const condMat = M.stdMat(M.PALETTE.flow, { emissive: M.PALETTE.flow, emissiveIntensity: 0.5 });
    scene.add(A.createConductor(path, condMat, 0.05));
    const flow = new F.PowerFlow({ path, color: M.PALETTE.flow, velocity: 3.2, direction: s === 'S5' ? -1 : 1 });
    scene.add(flow.object3D);
    flows.push(flow);
    const x0 = ends[s][0].x;
    const x1 = ends[s][1].x;
    sec[s] = { condMat, flow, x0, x1, mid: (x0 + x1) / 2, customers: FLISR_TOPOLOGY.sections[s].customers, color: new THREE.Color() };
  }

  // Houses behind each section (1 house ≈ 100 customers, illustrative)
  for (const s of SECTIONS) {
    const n = Math.round(sec[s].customers / 100);
    const cols = Math.ceil(n / 2);
    const list = [];
    for (let i = 0; i < n; i += 1) {
      const c = Math.floor(i / 2);
      list.push({ x: sec[s].mid + (c - (cols - 1) / 2) * 1.55, z: i % 2 ? -5.6 : -3.5, solar: (i + s.length) % 3 === 0 });
    }
    sec[s].houses = A.createHouses(list);
    scene.add(sec[s].houses.group);
    // Faint zone tint on the ground under the section
    const zoneMat = M.glowMat(M.PALETTE.flow, { opacity: 0.05, blending: THREE.NormalBlending });
    const zone = new THREE.Mesh(new THREE.PlaneGeometry(sec[s].x1 - sec[s].x0, 8.2).rotateX(-Math.PI / 2), zoneMat);
    zone.position.set(sec[s].mid, 0.03, -3.0);
    scene.add(zone);
    sec[s].zoneMat = zoneMat;
  }

  scene.add(A.createRoad(V(-31, 0, ROAD_Z), V(29, 0, ROAD_Z), 1.6));
  scene.add(A.createTrees([[-29.5, -6], [-28, 7.5], [-21, 7.6], [-12, 7.8], [-2, 7.6], [9, 7.6], [18, 7.8], [26.5, 7.4], [28, -7], [-30, 2]].map(([x, z], i) => ({ x, z, s: 0.95 + (i % 3) * 0.15 }))));

  // ── The tree that falls, and the spark ──────────────────────
  const tree = A.createTree({ height: 5.6 });
  scene.add(tree);
  const spark = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), M.glowMat('#FFE7A8', { map: M.glowTexture(), side: THREE.DoubleSide }));
  scene.add(spark);

  // ── Crew truck ───────────────────────────────────────────────
  const truck = A.createCrewTruck();
  scene.add(truck.group);

  // ── ADMS panel with a live single-line diagram ──────────────
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 312;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const panel = A.createGlassPanel({ width: PANEL.w, height: PANEL.h, color: M.PALETTE.data, map: tex, opacity: 0.94 });
  panel.group.position.set(PANEL.x, PANEL.y, PANEL.z);
  panel.group.rotation.x = -0.1;
  scene.add(panel.group);

  // Packets: data rises from devices to the panel, commands descend from the panel.
  const panelPoint = (x) => V(PANEL.x + (x - PANEL.x) * 0.55, PANEL.y - PANEL.h / 2 + 0.2, PANEL.z + 0.2);
  const arc = (from, to) => new THREE.QuadraticBezierCurve3(from, V((from.x + to.x) / 2, Math.max(from.y, to.y) + 2.2, (from.z + to.z) / 2), to);
  const trails = { data: {}, cmd: {} };
  for (const id of DEVICES) {
    const top = devices[id].group.position.clone().add(V(0, 0.9, 0));
    // Each device only ever receives one kind of command in this demo.
    const cmd = id === 'R1' ? fl.packets.reclose : id === 'TIE' ? fl.packets.close : fl.packets.open;
    trails.data[id] = new F.PacketTrail({ path: arc(top, panelPoint(DEV_X[id])), color: M.PALETTE.data, label: { text: fl.packets.data, kind: 'data' } });
    trails.cmd[id] = new F.PacketTrail({ path: arc(panelPoint(DEV_X[id]), top), color: M.PALETTE.command, size: 0.26, label: { text: cmd.replace('{device}', id), kind: 'command' } });
    scene.add(trails.data[id].object3D, trails.cmd[id].object3D);
  }

  // ── Feeder B capacity gauge ──────────────────────────────────
  const gauge = CH.createBarGauge({ height: 4.6, width: 0.8, maxPct: 140, limitPct: 100 });
  gauge.group.position.set(26.6, 0, -2.6);
  scene.add(gauge.group);

  // ── Labels (text from slides.js) ────────────────────────────
  const lab = content.labels;
  const lSubA = L.label(lab.subA);
  lSubA.position.set(SUB_A, 3.5, -1.8);
  const lSubB = L.label(lab.subB);
  lSubB.position.set(SUB_B, 3.5, -1.8);
  const lAdms = L.label(lab.adms, { variant: 'big accent' });
  lAdms.position.set(PANEL.x, PANEL.y + PANEL.h / 2 + 0.35, PANEL.z);
  const lCrew = L.label(lab.crew);
  scene.add(lSubA, lSubB, lAdms, lCrew);

  const tags = {};
  for (const id of ['CB-A', 'CB-B', ...DEVICES]) {
    tags[id] = L.tagLabel(id, content.tags[id]);
    const p = devices[id].group.position;
    tags[id].position.set(p.x, id.startsWith('CB') ? 2.2 : 5.9, p.z);
    scene.add(tags[id]);
  }
  for (const s of SECTIONS) {
    const chip = document.createElement('div');
    chip.className = 'counter3d';
    const t = document.createElement('span');
    t.className = 'tag3d';
    t.textContent = s;
    t.setAttribute('data-tip', content.tags[s]);
    const n = document.createElement('span');
    n.textContent = fl.sectionCounter.replace('{n}', sec[s].customers.toLocaleString('en-US'));
    chip.append(t, n);
    // Counters sit in front of the road, like a ruler under each section, clear of the device tags.
    const o = L.elementLabel(chip, { anchor: 'center' });
    o.position.set(sec[s].mid, 0.2, ROAD_Z + 2.4);
    scene.add(o);
    sec[s].chip = chip;
    sec[s].chipObj = o;
  }
  const gaugeEl = document.createElement('div');
  gaugeEl.className = 'label3d';
  const gaugeTitle = document.createElement('span');
  gaugeTitle.className = 'label3d__title';
  const gaugeSub = document.createElement('span');
  gaugeSub.className = 'label3d__sub';
  gaugeSub.textContent = fl.capacityLabel;
  gaugeEl.append(gaugeTitle, gaugeSub);
  const lGauge = L.elementLabel(gaugeEl);
  lGauge.position.set(26.6, 5.3, -2.6);
  scene.add(lGauge);

  // ── State ────────────────────────────────────────────────────
  const initialState = () => ({
    e1: 1, e2: 1, e3: 1, e4: 1, e5: 1, // energized
    f1: 0, f2: 0, f3: 0, f4: 0, f5: 0, // fault highlight
    g1: 0, g2: 0, g3: 0, g4: 0, g5: 0, // "restored" flash
    d1: 1, d2: 1, d3: 1, d4: 1, d5: -1, // flow direction (+1 from A, −1 from B)
    cR1: 1, cSW2: 1, cSW3: 1, cTIE: 0, // closed amount
    lock: 0, iR1: 0, iSW2: 0, iSW3: 0, // R1 lockout, fault indicators
    data: 0, mR1: 0, mSW2: 0, mSW3: 0, mTIE: 0, // packet progress (m = command)
    hR1: 0, hSW2: 0, hSW3: 0, hTIE: 0, // yellow "command received" flash
    tree: 0, treeGone: 0, spark: 0, locate: 0, pulse: 0,
    capVis: 0, cap: 0, truck: 0, truckVis: 0, out: 0,
  });
  const S = initialState();
  let plan = null;
  let faultX = 0;
  const idx = (s) => s.slice(1);

  // ── Plan → timeline ──────────────────────────────────────────
  function buildTimeline() {
    plan = solveFlisr(FLISR_TOPOLOGY, options);
    Object.assign(S, initialState());
    const P = plan;
    const f = idx(P.fault);
    faultX = sec[P.fault].mid;
    const set = (keys, v) => Object.fromEntries(keys.map((k) => [k, v]));
    const secKeys = (list, pre) => list.map((s) => `${pre}${idx(s)}`);

    const capPct = P.capacity.kind === 'none' ? 0 : P.capacity.pct;
    const durations = [1.6, 2.2, 2.6, 2.8, 2.0, 2.6, 2.4, 2.4, P.extraOpen ? 3.4 : 2.6, 3.4, 3.2];
    const tl = stepTimeline(durations, (t, at, k) => {
      const q = (dt) => `${at}+=${dt}`;
      switch (k) {
        case 1: // normal operation
          t.to(S, { pulse: 1, duration: 0.6 }, q(0.1)).to(S, { pulse: 0, duration: 0.7 }, q(0.75));
          break;
        case 2: // tree falls
          t.to(S, { tree: 1, duration: 1.1, ease: 'power2.in' }, q(0));
          t.to(S, { spark: 1, duration: 0.12 }, q(1.08)).to(S, { spark: 0, duration: 0.7 }, q(1.25));
          t.to(S, { [`f${f}`]: 1, duration: 0.4 }, q(1.1));
          break;
        case 3: // R1 trips, recloses once, locks out
          t.to(S, { cR1: 0, lock: 1, duration: 0.2 }, q(0.1));
          t.to(S, { ...set(secKeys(P.outAfterTrip, 'e'), 0), duration: 0.5 }, q(0.15));
          t.to(S, { out: P.outCounts.afterTrip, duration: 0.9, ease: 'power1.out' }, q(0.15));
          t.to(S, { cR1: 1, duration: 0.18 }, q(0.95));
          t.to(S, { spark: 0.8, duration: 0.08 }, q(1.13)).to(S, { spark: 0, duration: 0.4 }, q(1.25));
          t.to(S, { cR1: 0, duration: 0.18 }, q(1.3));
          break;
        case 4: // fault indicators report to ADMS
          t.to(S, { ...set(P.saw.map((d) => `i${d}`), 1), duration: 0.3 }, q(0.1));
          t.to(S, { data: 1, duration: 1.8, ease: 'power1.inOut' }, q(0.5));
          break;
        case 5: // locate
          t.to(S, { locate: 1, duration: 0.6 }, q(0.1));
          break;
        case 6: // isolate
          t.to(S, { iR1: 0, iSW2: 0, iSW3: 0, duration: 0.3 }, q(0));
          for (const d of P.toOpen) {
            t.to(S, { [`m${d}`]: 1, duration: 1.0, ease: 'power1.in' }, q(0.2));
            t.to(S, { [`h${d}`]: 1, duration: 0.15 }, q(1.15)).to(S, { [`h${d}`]: 0, duration: 0.5 }, q(1.7));
            t.to(S, { [`c${d}`]: 0, duration: 0.35 }, q(1.2));
          }
          break;
        case 7: // restore upstream
          if (P.recloseTrip) {
            t.to(S, { mR1: 1, duration: 0.9, ease: 'power1.in' }, q(0.1));
            t.to(S, { hR1: 1, duration: 0.15 }, q(0.95)).to(S, { hR1: 0, duration: 0.5 }, q(1.5));
            t.to(S, { cR1: 1, lock: 0, duration: 0.3 }, q(1.0));
            t.to(S, { ...set(secKeys(P.upstreamRestored, 'e'), 1), ...set(secKeys(P.upstreamRestored, 'g'), 1), duration: 0.5 }, q(1.15));
            t.to(S, { ...set(secKeys(P.upstreamRestored, 'g'), 0), duration: 0.6 }, q(1.7));
            t.to(S, { out: P.outCounts.afterUpstream, duration: 0.6 }, q(1.15));
          } else {
            t.to(S, { g1: 1, duration: 0.3 }, q(0.2)).to(S, { g1: 0, duration: 0.8 }, q(0.6));
          }
          break;
        case 8: // capacity check
          if (P.capacity.kind !== 'none') {
            t.to(S, { capVis: 1, duration: 0.4 }, q(0.1));
            t.to(S, { cap: capPct, duration: 1.4, ease: 'power1.out' }, q(0.4));
          }
          break;
        case 9: { // restore downstream
          let t0 = 0.1;
          if (P.extraOpen) {
            const d = P.extraOpen;
            t.to(S, { [`m${d}`]: 1, duration: 0.9, ease: 'power1.in' }, q(t0));
            t.to(S, { [`h${d}`]: 1, duration: 0.15 }, q(t0 + 0.85)).to(S, { [`h${d}`]: 0, duration: 0.5 }, q(t0 + 1.4));
            t.to(S, { [`c${d}`]: 0, duration: 0.3 }, q(t0 + 0.9));
            t0 += 1.2;
          }
          if (P.transfer.length) {
            t.to(S, { mTIE: 1, duration: 0.9, ease: 'power1.in' }, q(t0));
            t.to(S, { hTIE: 1, duration: 0.15 }, q(t0 + 0.85)).to(S, { hTIE: 0, duration: 0.5 }, q(t0 + 1.4));
            t.to(S, { cTIE: 1, duration: 0.3 }, q(t0 + 0.9));
            t.to(S, { ...set(secKeys(P.transfer, 'd'), -1), duration: 0.01 }, q(t0 + 0.92));
            t.to(S, { ...set(secKeys(P.transfer, 'e'), 1), ...set(secKeys(P.transfer, 'g'), 1), duration: 0.5 }, q(t0 + 1.0));
            t.to(S, { ...set(secKeys(P.transfer, 'g'), 0), duration: 0.6 }, q(t0 + 1.55));
            t.to(S, { out: P.outCounts.final, duration: 0.6 }, q(t0 + 1.0));
          }
          break;
        }
        case 10: // crew dispatched
          t.to(S, { truckVis: 1, duration: 0.3 }, q(0));
          t.to(S, { truck: 1, duration: 2.6, ease: 'power1.inOut' }, q(0.2));
          break;
        case 11: { // repair, back to normal
          const reclose = [...P.toOpen, ...(P.extraOpen ? [P.extraOpen] : [])];
          t.to(S, { treeGone: 1, duration: 0.6 }, q(0.2));
          t.to(S, { [`f${f}`]: 0, locate: 0, capVis: 0, duration: 0.5 }, q(0.5));
          t.to(S, { ...set(reclose.map((d) => `c${d}`), 1), cR1: 1, lock: 0, cTIE: 0, duration: 0.3 }, q(0.9));
          t.to(S, { ...set(secKeys(P.transfer, 'd'), 1), duration: 0.01 }, q(0.95));
          t.to(S, { e1: 1, e2: 1, e3: 1, e4: 1, ...set(secKeys(['S1', 'S2', 'S3', 'S4'], 'g'), 1), duration: 0.5 }, q(1.0));
          t.to(S, { ...set(secKeys(['S1', 'S2', 'S3', 'S4'], 'g'), 0), duration: 0.8 }, q(1.6));
          t.to(S, { out: 0, duration: 0.8 }, q(1.0));
          t.to(S, { truckVis: 0, duration: 0.5 }, q(2.0));
          t.to(S, { truck: 0, duration: 0.01 }, q(2.6));
          break;
        }
        default:
      }
    });

    // Place the tree for this fault: in front of the line, falling back onto it.
    tree.position.set(faultX - 0.6, 0, 2.7);
    spark.position.set(faultX - 0.6, LINE_Y - 0.35, 0.05);
    return { timeline: tl, steps: flisrSteps(plan, fl) };
  }

  // ── Per-frame rendering of the state ────────────────────────
  const tmp = new THREE.Color();
  const tmp2 = new THREE.Color();
  const lampColor = C.fault;
  let lastSld = '';
  let lastHud = '';

  function sectionColor(s, t, out) {
    const i = idx(s);
    out.copy(C.off).lerp(C.flow, clamp01(S[`e${i}`]));
    if (S.pulse > 0) out.lerp(tmp2.set('#7FF5EA'), S.pulse * 0.5 * S[`e${i}`]);
    if (S[`g${i}`] > 0) out.lerp(C.restored, S[`g${i}`]);
    const fv = S[`f${i}`];
    if (fv > 0) out.lerp(C.fault, fv * (0.6 + 0.4 * Math.sin(t * 7)));
    return out;
  }

  function deviceColor(id, out) {
    const d = devices[id];
    const c = id.startsWith('CB') ? 1 : S[`c${id}`];
    const h = S[`h${id}`] || 0;
    let live = c > 0.5;
    if (id === 'R1') live = live && S.e2 > 0.5;
    if (id === 'SW2') live = live && (S.e2 > 0.5 || S.e3 > 0.5);
    if (id === 'SW3') live = live && (S.e3 > 0.5 || S.e4 > 0.5);
    if (id === 'TIE') live = live && S.e4 > 0.5;
    out.copy(live ? C.flow : C.off);
    if (id === 'R1' && S.lock > 0) out.lerp(C.fault, S.lock);
    if (h > 0) out.lerp(C.command, h);
    d.setColor(out, 0.35 + 0.6 * Math.max(h, live ? 0.4 : 0));
    return out;
  }

  function update(dt, t) {
    // The fixed-size counters would touch side by side: stagger them in two rows.
    SECTIONS.forEach((s, n) => {
      const up = n % 2 === 1;
      sec[s].chipObj.position.set(sec[s].mid, up ? 1.9 : 0.2, ROAD_Z + (up ? 1.2 : 4.0));
    });

    for (const s of SECTIONS) {
      const i = idx(s);
      const o = sec[s];
      const col = sectionColor(s, t, o.color);
      o.condMat.color.copy(col);
      o.condMat.emissive.copy(col);
      o.condMat.emissiveIntensity = 0.25 + 0.45 * Math.max(S[`e${i}`], S[`f${i}`]);
      o.flow.intensity = clamp01(S[`e${i}`]) * (1 - 0.85 * S[`f${i}`]);
      o.flow.color.copy(C.flow).lerp(C.restored, S[`g${i}`]);
      o.flow.direction = S[`d${i}`];
      o.flow.update(dt);
      o.houses.setLit(S[`e${i}`]);
      o.zoneMat.color.copy(col);
      o.zoneMat.opacity = 0.035 + 0.09 * Math.max(S[`f${i}`], S[`g${i}`]);
      const chip = o.chip.classList;
      chip.toggle('is-off', S[`e${i}`] < 0.5 && S[`f${i}`] < 0.5);
      chip.toggle('is-fault', S[`f${i}`] > 0.5);
      chip.toggle('is-restored', S[`g${i}`] > 0.3);
    }
    for (const id of ['CB-A', 'CB-B', ...DEVICES]) {
      const d = devices[id];
      if (!id.startsWith('CB')) d.setOpen(1 - S[`c${id}`]);
      deviceColor(id, tmp);
      const iv = S[`i${id}`] || 0;
      d.setLamp(iv * (Math.sin(t * 10) > 0 ? 1 : 0.25), lampColor);
      tags[id].element.classList.toggle('is-command', (S[`h${id}`] || 0) > 0.3 || (S[`m${id}`] > 0.02 && S[`m${id}`] < 0.98));
      tags[id].element.classList.toggle('is-fault', iv > 0.5 || (id === 'R1' && S.lock > 0.5));
    }
    for (const id of DEVICES) {
      trails.data[id].setProgress(plan.saw.includes(id) ? S.data : 0);
      trails.cmd[id].setProgress(S[`m${id}`]);
    }

    // Tree, spark, truck
    tree.rotation.x = -0.56 * S.tree;
    tree.scale.setScalar(Math.max(0.001, 1 - S.treeGone));
    tree.visible = S.treeGone < 0.99;
    spark.visible = S.spark > 0.01;
    spark.scale.setScalar(0.5 + 2.6 * S.spark);
    spark.material.opacity = S.spark;
    spark.quaternion.copy(camera.quaternion);
    truck.group.visible = S.truckVis > 0.01;
    truck.group.position.set(lerp(-28, faultX + 1.6, S.truck), 0, ROAD_Z);
    truck.lightMaterial.opacity = 0.5 + 0.5 * (Math.sin(t * 9) > 0 ? 1 : 0);
    lCrew.position.set(truck.group.position.x, 1.9, ROAD_Z);
    L.setLabelOpacity(lCrew, S.truckVis);

    // Capacity gauge
    gauge.setOpacity(S.capVis);
    gauge.setValue(S.cap);
    const capCol = S.cap > 100 ? C.fault : S.cap > 80 ? C.warning : C.restored;
    gauge.setColor(capCol);
    L.setLabelOpacity(lGauge, S.capVis);
    const pctText = `${Math.round(S.cap)}%`;
    if (gaugeTitle.textContent !== pctText) gaugeTitle.textContent = pctText;
    gaugeTitle.style.color = `#${capCol.getHexString()}`;

    // HUD (DOM overlay) — only when the value changes
    const out = Math.round(S.out);
    const hudKey = String(out);
    if (hudKey !== lastHud) {
      lastHud = hudKey;
      ctx.setHud({ label: fl.hudLabel, value: out.toLocaleString('en-US'), mood: out > 0 ? 'alert' : '' });
    }

    drawSld(t);
  }

  // ── Single-line diagram on the ADMS panel ────────────────────
  const g2d = canvas.getContext('2d');
  const sx = (x) => 60 + ((x - (SUB_A - 2)) / ((SUB_B + 2) - (SUB_A - 2))) * (canvas.width - 120);
  const css = (c) => `#${c.getHexString()}`;

  function drawSld(t) {
    const blink = Math.sin(t * 7) > 0 ? 1 : 0;
    const sig = JSON.stringify([
      SECTIONS.map((s) => [S[`e${idx(s)}`] > 0.5, Math.round(S[`f${idx(s)}`] * 4), S[`g${idx(s)}`] > 0.3]),
      DEVICES.map((d) => [Math.round(S[`c${d}`] * 4), S[`h${d}`] > 0.3, (S[`i${d}`] || 0) > 0.5]),
      S.lock > 0.5, S.locate > 0.5, S[`f${idx(plan.fault)}`] > 0.5 ? blink : 0,
    ]);
    if (sig === lastSld) return;
    lastSld = sig;

    const W = canvas.width;
    const H = canvas.height;
    const g = g2d;
    g.clearRect(0, 0, W, H);
    g.fillStyle = 'rgba(14, 24, 44, 0.9)';
    roundRect(g, 4, 4, W - 8, H - 8, 22);
    g.fill();
    g.strokeStyle = 'rgba(63, 167, 245, 0.85)';
    g.lineWidth = 3;
    g.stroke();
    g.fillStyle = '#9AA8BF';
    g.font = '600 24px Inter, "Segoe UI", system-ui, sans-serif';
    g.textBaseline = 'middle';
    g.fillText(fl.sldTitle, 30, 38);

    const y = 175;
    // Substations
    for (const [x, name] of [[SUB_A, lab.subA.title], [SUB_B, lab.subB.title]]) {
      g.fillStyle = '#26324D';
      g.fillRect(sx(x) - 34, y - 34, 68, 68);
      g.fillStyle = '#C9D3E0';
      g.font = '600 18px Inter, "Segoe UI", system-ui, sans-serif';
      g.textAlign = 'center';
      g.fillText(name, sx(x), y + 62);
    }
    // Sections
    for (const s of SECTIONS) {
      const o = sec[s];
      const fv = S[`f${idx(s)}`];
      g.strokeStyle = css(sectionColor(s, t, tmp));
      g.lineWidth = 11;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(sx(o.x0) + 10, y);
      g.lineTo(sx(o.x1) - 10, y);
      g.stroke();
      g.fillStyle = '#E6ECF5';
      g.font = '700 22px Inter, "Segoe UI", system-ui, sans-serif';
      g.textAlign = 'center';
      g.fillText(s, sx(o.mid), y - 40);
      if (fv > 0.5) {
        g.fillStyle = css(C.fault);
        g.font = '700 34px Inter, "Segoe UI", system-ui, sans-serif';
        g.fillText('⚡', sx(o.mid), y - 2);
      }
      if (S.locate > 0.5 && s === plan.fault) {
        g.strokeStyle = css(C.fault);
        g.lineWidth = 4;
        g.setLineDash([10, 7]);
        g.strokeRect(sx(o.x0) + 4, y - 66, sx(o.x1) - sx(o.x0) - 8, 116);
        g.setLineDash([]);
      }
    }
    // Breakers at the substations
    for (const [id, x] of [['CB-A', exitA.x], ['CB-B', exitB.x]]) {
      g.fillStyle = css(C.flow);
      g.fillRect(sx(x) - 13, y - 13, 26, 26);
      drawTag(g, id, sx(x), y + 40);
    }
    // Line devices
    for (const id of DEVICES) {
      const x = sx(DEV_X[id]);
      const c = S[`c${id}`];
      const col = css(deviceColor(id, tmp));
      g.strokeStyle = col;
      g.fillStyle = '#0E182C';
      g.lineWidth = 6;
      g.beginPath();
      g.arc(x - 16, y, 6, 0, Math.PI * 2);
      g.arc(x + 16, y, 6, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.moveTo(x - 16, y);
      const ang = (1 - c) * 0.9;
      g.lineTo(x - 16 + Math.cos(ang) * 32, y - Math.sin(ang) * 32);
      g.stroke();
      if (id === 'R1') {
        g.lineWidth = 3;
        g.beginPath();
        g.arc(x, y, 26, 0, Math.PI * 2);
        g.stroke();
      }
      if ((S[`i${id}`] || 0) > 0.5) {
        g.fillStyle = css(C.fault);
        g.beginPath();
        g.arc(x, y - 44, 9, 0, Math.PI * 2);
        g.fill();
      }
      drawTag(g, id, x, y + 40);
    }
    tex.needsUpdate = true;
  }

  function drawTag(g, text, x, y) {
    g.font = '700 18px Inter, "Segoe UI", system-ui, sans-serif';
    const w = g.measureText(text).width + 14;
    g.fillStyle = '#16213A';
    g.strokeStyle = '#4A5568';
    g.lineWidth = 2;
    roundRect(g, x - w / 2, y - 13, w, 26, 6);
    g.fill();
    g.stroke();
    g.fillStyle = '#E6ECF5';
    g.textAlign = 'center';
    g.fillText(text, x, y + 1);
  }

  // ── Interactions: fault location and Feeder B loading ───────
  const sceneObj = {};
  const replan = () => {
    const { timeline, steps } = buildTimeline();
    sceneObj.timeline?.kill();
    sceneObj.timeline = timeline;
    sceneObj.steps = steps;
    lastSld = '';
    ctx.timelineChanged();
  };

  const first = buildTimeline();
  const presets = () => ({
    overview: { pos: [-1.5, 23, 45], target: [-1.5, 5, -2] },
    fault: { pos: [faultX - 1, 9.5, 15], target: [faultX, 3.6, -0.6] },
    panel: { pos: [-1.5, 13, 26], target: [-1.5, 9.4, -5] },
    tie: { pos: [13.5, 8.6, 20], target: [17.5, 4.4, -1] },
    crew: { pos: [faultX - 3, 8.4, 21.5], target: [faultX + 0.5, 4.6, 2.6] },
  });

  Object.assign(sceneObj, finishScene({
    scene, camera, flows,
    timeline: first.timeline,
    steps: first.steps,
    startPreset: 'overview',
    cameraPreset: (name) => presets()[name] || null,
    update,
    onEnter: () => { lastHud = ''; lastSld = ''; },
    controlsLimits: { minDistance: 6, maxDistance: 95 },
    reserveShift: 0.5, // zoom out evenly: shifting up would push the ADMS label out of frame
    interactions: [
      {
        type: 'choice', label: content.controls.faultLabel, tip: content.controls.faultTip, value: options.fault,
        options: FAULT_CHOICES.map((s) => ({ value: s, label: s, tip: content.tags[s] })),
        onChange: (v) => { options.fault = v; replan(); },
      },
      {
        type: 'toggle', label: content.controls.heavyLabel, tip: content.controls.heavyTip, value: options.feederBHeavy,
        onChange: (v) => { options.feederBHeavy = v; replan(); },
      },
    ],
    dispose: () => {
      for (const k of ['data', 'cmd']) for (const id of DEVICES) trails[k][id].dispose();
      tex.dispose();
    },
  }));
  return sceneObj;
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
