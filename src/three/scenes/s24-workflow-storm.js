// Slide 24 — Workflow A: one storm, every application working together.
// Ground: a storm-hit distribution feeder (3 sections, 3 remote switches), risky trees, smart
// meters, a field crew, mutual-aid trucks and the transmission grid with phasor sensors.
// Above: GridOS application panels around the shared Data Fabric hub. Each step lights the
// acting application and moves labelled data / command packets along handoff arcs:
// field → application → Data Fabric → next application → field.

import * as THREE from 'three';
import { finishScene, stepsFromContent, stepTimeline, clamp01, lerp } from './common.js';
import { createStorm } from '../kit/Regions.js';
import { createAppPanel, createHub, createHandoff } from '../kit/AppNetwork.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const LINE_Z = 5;
const ROAD_Z = 10.5;

export function createScene(stage, kit, ctx) {
  const { assets: A, flow: F, labels: L, materials: M } = kit;
  const content = ctx.content;
  const lab = content.labels;
  const P = content.packets;
  const C = M.COLOR;
  const { scene, camera } = A.createBaseScene({ ground: { width: 66, depth: 40 }, shadowExtent: 34, fogNear: 75, fogFar: 180 });
  const flows = [];

  // ── Distribution feeder: Substation → A → SW1 → B → SW2 → C → TIE ← second feeder ──
  const subMain = A.createSubstation({ w: 4.4, d: 4 });
  subMain.position.set(6.6, 0, LINE_Z);
  const subAlt = A.createSubstation({ w: 4.4, d: 4 });
  subAlt.position.set(-24.6, 0, LINE_Z);
  scene.add(subMain, subAlt);
  const exitMain = subMain.position.clone().add(subMain.userData.exitW);
  const exitAlt = subAlt.position.clone().add(subAlt.userData.exitE);

  const devices = {};
  const poleAt = (x, h) => {
    const p = A.createPole({ height: h, crossarm: h > 4.6 });
    p.position.set(x, 0, LINE_Z);
    scene.add(p);
  };
  for (const [id, x, lamp] of [['SW1', -4, true], ['SW2', -11, false], ['TIE', -18, false]]) {
    poleAt(x, 4.5);
    const d = A.createSwitchDevice({ kind: 'switch', span: 0.9, lamp });
    d.group.position.set(x, 4.42, LINE_Z);
    scene.add(d.group);
    devices[id] = d;
  }
  const term = (id, side) => devices[id].group.position.clone().add(devices[id].group.userData[side === 'W' ? 'terminalW' : 'terminalE']);
  const sectionDefs = {
    A: [exitMain, V(0, 4.82, LINE_Z), term('SW1', 'E')],
    B: [term('SW1', 'W'), V(-7.5, 4.82, LINE_Z), term('SW2', 'E')],
    C: [term('SW2', 'W'), V(-14.5, 4.82, LINE_Z), term('TIE', 'E')],
    D: [term('TIE', 'W'), exitAlt],
  };
  const sec = {};
  for (const [id, pts] of Object.entries(sectionDefs)) {
    pts.slice(1, -1).forEach((p) => poleAt(p.x, 4.9));
    let path = [];
    for (let i = 0; i < pts.length - 1; i += 1) path = A.joinPaths(path, A.catenary(pts[i], pts[i + 1], 0.3, 10));
    const mat = M.stdMat(M.PALETTE.flow, { emissive: M.PALETTE.flow, emissiveIntensity: 0.5 });
    scene.add(A.createConductor(path, mat, 0.05));
    const flow = new F.PowerFlow({ path, color: M.PALETTE.flow, velocity: 3 });
    scene.add(flow.object3D);
    flows.push(flow);
    sec[id] = { mat, flow, color: new THREE.Color(), mid: pts.reduce((a, p) => a + p.x, 0) / pts.length };
  }
  const houseRows = { A: [2.5, 1.0, -0.5, -2], B: [-6, -7.5, -9], C: [-13, -14.5, -16] };
  for (const [id, xs] of Object.entries(houseRows)) {
    const hs = A.createHouses(xs.map((x, i) => ({ x, z: 2.1, solar: i % 2 === 0 })));
    scene.add(hs.group);
    sec[id].houses = hs;
  }
  scene.add(A.createRoad(V(-28, 0, ROAD_Z), V(30, 0, ROAD_Z), 1.6));

  // Risky trees near the line; one falls in the storm.
  const fallTree = A.createTree({ height: 5.4 });
  fallTree.position.set(-7.4, 0, 7.6);
  scene.add(fallTree);
  scene.add(A.createTrees([[-14.2, 8.2], [-16.6, 7.7], [-21, 8.6], [4, 8.4], [12, 7.9], [-26, -2], [18, 2]].map(([x, z], i) => ({ x, z, s: 1 + (i % 3) * 0.12 }))));
  const riskyAt = [V(-7.4, 0, 7.6), V(-14.2, 0, 8.2), V(-16.6, 0, 7.7)];
  const aiMat = new THREE.LineBasicMaterial({ color: M.PALETTE.ai, transparent: true, opacity: 0, toneMapped: false });
  const aiBoxGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(2.2, 5.2, 2.2).translate(0, 2.6, 0));
  for (const p of riskyAt) {
    const b = new THREE.LineSegments(aiBoxGeo, aiMat);
    b.position.copy(p);
    scene.add(b);
  }

  // VI drone with its scan cone
  const drone = new THREE.Group();
  drone.add(new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.16, 0.55), M.stdMat('#E8EDF4')));
  const rotors = [];
  for (const [x, z] of [[0.5, 0.5], [-0.5, 0.5], [0.5, -0.5], [-0.5, -0.5]]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.05, 0.06), M.stdMat('#9AA8C7'));
    arm.position.set(x / 2, 0, z / 2);
    arm.rotation.y = Math.atan2(z, x);
    const rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.02, 12), M.glowMat('#C9D3EE', { opacity: 0.6, blending: THREE.NormalBlending }));
    rotor.position.set(x, 0.08, z);
    drone.add(arm, rotor);
    rotors.push(rotor);
  }
  const scanMat = M.glowMat(M.PALETTE.data, { opacity: 0, blending: THREE.NormalBlending, side: THREE.DoubleSide });
  const scan = new THREE.Mesh(new THREE.ConeGeometry(2.4, 5.6, 20, 1, true).translate(0, -2.8, 0), scanMat);
  drone.add(scan);
  drone.position.set(-12, 6.4, 8.4);
  scene.add(drone);

  // Field crew (GridOS Field) and mutual-aid trucks
  const crewTruck = A.createCrewTruck();
  scene.add(crewTruck.group);
  const crewPerson = A.createPerson({ color: '#F28C28' });
  const tablet = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.03), M.glowMat(M.PALETTE.data, { blending: THREE.NormalBlending }));
  tablet.position.set(0.2, 0.62, 0.22);
  const crew = new THREE.Group();
  crew.add(crewPerson, tablet);
  crew.position.set(-6.6, 0, 8.6);
  scene.add(crew);
  const aidTrucks = [0, 1].map(() => {
    const t = A.createCrewTruck();
    scene.add(t.group);
    return t;
  });

  // Transmission grid with phasor sensors (PMUs)
  const towerXs = [11, 18, 25];
  towerXs.forEach((x) => {
    const tw = A.createTransmissionTower({ height: 7 });
    tw.position.set(x, 0, -8);
    scene.add(tw);
  });
  const tLine = [];
  for (let i = 0; i < towerXs.length - 1; i += 1) {
    tLine.push(...A.catenary(V(towerXs[i], 4.7, -9.8), V(towerXs[i + 1], 4.7, -9.8), 0.6, 10));
  }
  const tMat = M.stdMat(M.PALETTE.flow, { emissive: M.PALETTE.flow, emissiveIntensity: 0.5 });
  scene.add(A.createConductor(tLine, tMat, 0.05));
  const tFlow = new F.PowerFlow({ path: tLine, color: M.PALETTE.flow, velocity: 4 });
  scene.add(tFlow.object3D);
  flows.push(tFlow);
  const pmus = [11, 25].map((x) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.5).translate(0, 0.25, 0), M.stdMat('#4B5567')));
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7).translate(0, 0.85, 0), M.stdMat('#C9D3E0'));
    g.add(ant);
    g.position.set(x + 1.4, 0, -6.4);
    scene.add(g);
    return g;
  });

  const storm = createStorm({ radius: 3.8 });
  scene.add(storm.group);

  // ── GridOS applications above the grid ──────────────────────
  const slab = A.createGlassSlab({ width: 42, depth: 12.5, thickness: 0.35, color: M.PALETTE.data, opacity: 0.08 });
  slab.group.position.set(1, 10.4, -4);
  scene.add(slab.group);
  const hub = createHub(lab.fabric, { radius: 1.3 });
  hub.group.position.set(1, 10.75, -4);
  scene.add(hub.group);
  const apps = {};
  const appAt = (key, x, y, z) => {
    const p = createAppPanel(lab[key], { width: 3.4, height: 1.7 });
    p.group.position.set(x, y, z);
    p.group.rotation.x = -0.1;
    scene.add(p.group);
    Object.assign(p.label.element.style, { whiteSpace: 'normal', maxWidth: '150px' });
    apps[key] = p;
  };
  appAt('prepare', -11, 13.6, -7.6);
  appAt('adms', -3, 13.6, -7.6);
  appAt('oms', 5, 13.6, -7.6);
  appAt('manager', 13, 13.6, -7.6);
  appAt('vi', -16, 11.8, -0.5);
  appAt('field', -8, 11.8, -0.5);
  appAt('wams', 10, 11.8, -0.5);
  appAt('aems', 18, 11.8, -0.5);
  const under = (key) => apps[key].group.position.clone().add(V(0, -1.0, 0.15));
  const hubPt = hub.group.position.clone().add(V(0, 0.35, 0));

  // ── Handoffs ─────────────────────────────────────────────────
  const H = [];
  const hand = (a, b, kind, packet, lift = 1.4) => {
    const h = createHandoff(a, b, { color: kind === 'command' ? M.PALETTE.command : M.PALETTE.data, kind, packet, lift });
    scene.add(h.group);
    H.push(h);
    return h;
  };
  const swTop = (id) => devices[id].group.position.clone().add(V(0, 0.8, 0));
  const h = {
    droneVi: hand(drone.position.clone(), under('vi'), 'data', null, 0.8),
    viHub: hand(under('vi'), hubPt, 'data', P.trees),
    hubPrep: hand(hubPt, under('prepare'), 'data', P.forecast),
    swAdms: hand(swTop('SW1'), under('adms'), 'data', P.faultData),
    cmdSw1: hand(under('adms'), swTop('SW1'), 'command', P.switching),
    cmdSw2: hand(under('adms'), swTop('SW2'), 'command', null),
    cmdTie: hand(under('adms'), swTop('TIE'), 'command', null),
    metersOms: hand(V(-7.5, 1.3, 2.1), under('oms'), 'data', P.meters),
    metersOms2: hand(V(-14.5, 1.3, 2.1), under('oms'), 'data', null),
    omsHub: hand(under('oms'), hubPt, 'data', P.outages),
    crewField: hand(V(-6.4, 1.3, 8.6), under('field'), 'data', null, 1.0),
    fieldHub: hand(under('field'), hubPt, 'data', P.damage),
    hubAdms: hand(hubPt, under('adms'), 'data', null, 0.9),
    hubOms: hand(hubPt, under('oms'), 'data', null, 0.9),
    hubMgr: hand(hubPt, under('manager'), 'data', P.open),
    mgrAid: hand(under('manager'), V(16, 1.4, ROAD_Z), 'command', P.crews),
    pmuWams: hand(pmus[0].position.clone().add(V(0, 1.3, 0)), under('wams'), 'data', P.phasors),
    pmuWams2: hand(pmus[1].position.clone().add(V(0, 1.3, 0)), under('wams'), 'data', null),
    wamsAems: hand(under('wams'), under('aems'), 'data', P.stability, 1.2),
  };

  // ── Labels ───────────────────────────────────────────────────
  const lTown = L.label(lab.town);
  lTown.position.set(-14.5, 0.3, 0.6);
  const lRegion = L.label(lab.region);
  lRegion.position.set(18, 0.3, -11);
  scene.add(lTown, lRegion);

  // ── State and timeline ───────────────────────────────────────
  const S = {
    eA: 1, eB: 1, eC: 1, eD: 1, fB: 0, gA: 0, gB: 0, gC: 0, dC: 1,
    cSW1: 1, cSW2: 1, cTIE: 0, ind: 0, hSW: 0,
    tree: 0, treeGone: 0, scan: 0, ai: 0, storm: 0, stormI: 0,
    crew: 0, aid: 0,
    aVi: 0.15, aPrepare: 0.15, aAdms: 0.15, aOms: 0.15, aField: 0.15, aManager: 0.15, aWams: 0.15, aAems: 0.15, aHub: 0.3,
  };
  for (const k of Object.keys(h)) S[`p_${k}`] = 0;
  // Move the packets of one or more handoffs from start to finish.
  const go = (tl, keys, at, dur = 0.9) => tl.to(S, { ...Object.fromEntries(keys.map((k) => [`p_${k}`, 1])), duration: dur, ease: 'power1.inOut' }, at);

  const timeline = stepTimeline([3.4, 4.4, 3.0, 3.8, 3.8, 3.0], (tl, at, k) => {
    const q = (d) => `${at}+=${d}`;
    const cast = (vars, d, dur = 0.5) => tl.to(S, { ...vars, duration: dur }, q(d));
    switch (k) {
      case 1: // VI → Data Fabric → Disruption Prepare
        cast({ aVi: 1, scan: 1, storm: 0.15, stormI: 0.5 }, 0, 0.6);
        cast({ ai: 1 }, 0.5, 0.4);
        go(tl, ['droneVi'], q(0.6), 0.6);
        go(tl, ['viHub'], q(1.2));
        cast({ aHub: 1 }, 1.9, 0.3);
        go(tl, ['hubPrep'], q(2.1));
        cast({ aPrepare: 1, aVi: 0.35, scan: 0 }, 2.6, 0.5);
        break;
      case 2: // tree falls; ADMS FLISR isolates and re-feeds
        cast({ storm: 0.5, stormI: 1, aPrepare: 0.35, aHub: 0.3, ai: 0.4 }, 0, 0.9);
        tl.to(S, { tree: 1, duration: 0.9, ease: 'power2.in' }, q(0.7));
        cast({ fB: 1 }, 1.55, 0.2);
        cast({ eA: 0, eB: 0, eC: 0, ind: 1 }, 1.65, 0.3);
        cast({ aAdms: 1 }, 1.9, 0.3);
        go(tl, ['swAdms'], q(1.9), 0.8);
        go(tl, ['cmdSw1', 'cmdSw2', 'cmdTie'], q(2.75), 0.8);
        cast({ hSW: 1 }, 3.5, 0.12);
        cast({ cSW1: 0, cSW2: 0, cTIE: 1, dC: -1, ind: 0 }, 3.55, 0.3);
        cast({ eA: 1, eC: 1, gA: 1, gC: 1 }, 3.7, 0.3);
        cast({ gA: 0, gC: 0, hSW: 0 }, 4.0, 0.35);
        break;
      case 3: // AMI meters → OMS → Data Fabric
        cast({ aAdms: 0.35, aOms: 1 }, 0, 0.4);
        go(tl, ['metersOms', 'metersOms2'], q(0.2), 1.0);
        cast({ aHub: 1 }, 1.25, 0.3);
        go(tl, ['omsHub'], q(1.4), 1.0);
        break;
      case 4: // Field crew → Field → Data Fabric → ADMS and OMS
        cast({ aOms: 0.35, aHub: 0.3, stormI: 0.6 }, 0, 0.4);
        tl.to(S, { crew: 1, duration: 1.3, ease: 'power1.inOut' }, q(0));
        cast({ aField: 1 }, 1.3, 0.3);
        go(tl, ['crewField'], q(1.35), 0.6);
        go(tl, ['fieldHub'], q(2.0), 0.8);
        cast({ aHub: 1 }, 2.75, 0.2);
        go(tl, ['hubAdms', 'hubOms'], q(2.85), 0.8);
        cast({ aAdms: 1, aOms: 1 }, 3.4, 0.3);
        break;
      case 5: // Storm Manager → mutual-aid crews; repair complete
        cast({ aField: 0.35, aAdms: 0.35, aOms: 0.35 }, 0, 0.4);
        go(tl, ['hubMgr'], q(0.1), 0.9);
        cast({ aManager: 1, aHub: 0.3 }, 0.95, 0.3);
        go(tl, ['mgrAid'], q(1.0), 0.8);
        tl.to(S, { aid: 1, duration: 1.4, ease: 'power1.inOut' }, q(1.6));
        cast({ treeGone: 1, storm: 1, stormI: 0, ai: 0 }, 2.6, 0.6);
        cast({ fB: 0, eB: 1, gB: 1, cSW1: 1, cSW2: 1, cTIE: 0, dC: 1 }, 3.0, 0.3);
        cast({ gB: 0 }, 3.35, 0.4);
        break;
      case 6: // PMUs → WAMS → AEMS
        cast({ aManager: 0.35, aWams: 1 }, 0, 0.4);
        go(tl, ['pmuWams', 'pmuWams2'], q(0.2), 1.0);
        go(tl, ['wamsAems'], q(1.4), 0.9);
        cast({ aAems: 1 }, 2.2, 0.4);
        break;
      default:
    }
  });

  // ── Per-frame rendering ─────────────────────────────────────
  const tmp = new THREE.Color();
  const placeTruck = (truck, x0, x1, u, z) => {
    truck.group.position.set(lerp(x0, x1, clamp01(u)), 0, z);
    truck.group.rotation.y = x1 < x0 ? Math.PI : 0;
  };
  function update(dt, t) {
    for (const [id, s] of Object.entries(sec)) {
      const e = S[`e${id}`];
      const f = S[`f${id}`] || 0;
      const g = S[`g${id}`] || 0;
      s.color.copy(C.off).lerp(C.flow, clamp01(e));
      if (g > 0) s.color.lerp(C.restored, g);
      if (f > 0) s.color.lerp(C.fault, f * (0.6 + 0.4 * Math.sin(t * 7)));
      s.mat.color.copy(s.color);
      s.mat.emissive.copy(s.color);
      s.flow.intensity = clamp01(e) * (1 - 0.85 * f);
      s.flow.direction = id === 'C' ? S.dC : id === 'D' ? -1 : 1;
      s.flow.update(dt);
      s.houses?.setLit(e);
    }
    tFlow.update(dt);
    const devState = { SW1: S.cSW1, SW2: S.cSW2, TIE: S.cTIE };
    for (const [id, d] of Object.entries(devices)) {
      d.setOpen(1 - devState[id]);
      tmp.copy(devState[id] > 0.5 ? C.flow : C.off);
      if (S.hSW > 0) tmp.lerp(C.command, S.hSW);
      d.setColor(tmp, 0.6);
    }
    devices.SW1.setLamp(S.ind * (Math.sin(t * 10) > 0 ? 1 : 0.25), C.fault);

    fallTree.rotation.x = -0.5 * S.tree;
    fallTree.scale.setScalar(Math.max(0.001, 1 - S.treeGone));
    fallTree.visible = S.treeGone < 0.99;
    aiMat.opacity = S.ai;
    scanMat.opacity = 0.18 * S.scan;
    for (const r of rotors) r.rotation.y += dt * 30;
    drone.position.y = 6.4 + 0.15 * Math.sin(t * 2);

    storm.group.position.set(lerp(-36, 30, S.storm), 7.2, 3);
    storm.setIntensity(S.stormI);
    storm.update(dt);

    placeTruck(crewTruck, 22, -4.6, S.crew, ROAD_Z);
    crewTruck.group.visible = S.crew > 0.01;
    crew.visible = S.crew > 0.95;
    aidTrucks.forEach((tr, i) => {
      tr.group.visible = S.aid > 0.01;
      placeTruck(tr, 32 + i * 2.5, -12 - i * 3, S.aid, ROAD_Z + (i ? -0.5 : 0.5));
    });
    for (const tr of [crewTruck, ...aidTrucks]) tr.lightMaterial.opacity = Math.sin(t * 9) > 0 ? 1 : 0.4;

    hub.update(dt);
    hub.setActive(S.aHub);
    apps.vi.setActive(S.aVi);
    apps.prepare.setActive(S.aPrepare);
    apps.adms.setActive(S.aAdms);
    apps.oms.setActive(S.aOms);
    apps.field.setActive(S.aField);
    apps.manager.setActive(S.aManager);
    apps.wams.setActive(S.aWams);
    apps.aems.setActive(S.aAems);
    // Eight apps share the sky: the overview shows titles only; each close-up labels only the
    // apps acting in that step (the others would crowd or sit cut off at the frame edge).
    for (const [key, app] of Object.entries(apps)) {
      const a = S[`a${key[0].toUpperCase()}${key.slice(1)}`];
      app.label.element.classList.toggle('label3d--compact', a < 0.6);
      if (view.k >= 1 && a < 0.6) app.setLabelVisible(0);
    }
    L.setLabelOpacity(lTown, view.k <= 4 ? 1 : 0);
    L.setLabelOpacity(lRegion, view.k === 0 || view.k === 6 ? 1 : 0);
    for (const [k, link] of Object.entries(h)) link.set(S[`p_${k}`]);
  }

  // k = current step: 0 is the overview, 1-6 follow one application each.
  const view = { k: 0 };
  const presets = {
    overview: { pos: [1, 23, 45], target: [1, 6.5, -1] },
    prep: { pos: [-11, 14, 24], target: [-9, 7, 0] },
    feeder: { pos: [-5, 12, 26], target: [-5, 6.5, 0] },
    oms: { pos: [-2, 14.5, 32], target: [-2, 7.8, -2] },
    field: { pos: [-3, 14, 33], target: [-2, 7.6, -1] },
    manager: { pos: [7, 15.5, 35], target: [5, 7.8, -2] },
    transmission: { pos: [14, 15, 31], target: [12.5, 8.2, -3] },
  };

  return finishScene({
    scene, camera, timeline, presets, update,
    flows: [...flows, storm],
    steps: stepsFromContent(content, ['prep', 'feeder', 'oms', 'field', 'manager', 'transmission']),
    startPreset: 'overview',
    onStep: (k) => { view.k = k; },
    controlsLimits: { minDistance: 8, maxDistance: 100 },
    dispose: () => { for (const x of H) x.dispose(); },
  });
}
