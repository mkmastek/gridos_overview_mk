// Slide 4 — architecture: seven translucent layers (an exploded stack) with small icons.
// Blue data rises from L1 through every layer; yellow commands descend from L5 to L1.
// Interactions: explode / collapse, click a layer to open its detail card, hover icons.

import * as THREE from 'three';
import { gsap } from 'gsap';
import { finishScene, stepsFromContent, stepTimeline, lerp } from './common.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const IDS = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7'];
const BASE_Y = 0.9;
const SLAB = { w: 14, d: 9, t: 0.32 };

export function createScene(stage, kit, ctx) {
  const { assets: A, flow: F, labels: L, materials: M } = kit;
  const content = ctx.content;
  const { scene, camera } = A.createBaseScene({ ground: { width: 44, depth: 30 }, shadowExtent: 22, fogNear: 60, fogFar: 140 });
  const S = { h1: 0.3, h2: 0.3, h3: 0.3, h4: 0.3, h5: 0.3, h6: 0.3, h7: 0.3, data: 0.85, cmd: 0 };
  // focus: layer index the camera is close to (null = whole stack in view)
  const view = { explode: 1, selected: null, focus: null };
  const flows = [];

  const gap = () => lerp(0.95, 2.75, view.explode);
  const layerY = (i) => BASE_Y + i * gap();

  // ── Icon builders (small, matte, a few draw calls each) ───────
  const mat = (c, o = {}) => M.stdMat(c, o);
  const glow = (c) => M.stdMat(c, { emissive: c, emissiveIntensity: 0.7 });
  const add = (parent, geo, material, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, y, z);
    m.castShadow = true;
    parent.add(m);
    return m;
  };
  const icon = (key, x, z, build) => {
    const g = new THREE.Group();
    g.position.set(x, SLAB.t / 2, z);
    g.userData.tip = key;
    build(g);
    return g;
  };
  const ICON_BUILDERS = {
    L1: [
      icon('rtu', -5, -1.6, (g) => { add(g, new THREE.BoxGeometry(0.8, 1.1, 0.5), mat('#8C97A8'), 0, 0.55); add(g, new THREE.BoxGeometry(0.02, 0.9, 0.3), mat('#3A4558'), 0.41, 0.55); add(g, new THREE.CylinderGeometry(0.02, 0.02, 0.6), mat('#C9D3E0'), 0.25, 1.4); }),
      icon('pmu', -2.4, 1.6, (g) => { add(g, new THREE.BoxGeometry(0.75, 0.45, 0.55), mat('#4B5567'), 0, 0.23); add(g, new THREE.CylinderGeometry(0.03, 0.03, 0.7), mat('#C9D3E0'), 0.2, 0.8); add(g, new THREE.ConeGeometry(0.16, 0.12, 10), glow(M.PALETTE.data), 0.2, 1.18); }),
      icon('meter', 0.2, -1.4, (g) => { add(g, new THREE.BoxGeometry(0.5, 0.65, 0.28), mat('#E8EDF4'), 0, 0.33); add(g, new THREE.CylinderGeometry(0.15, 0.15, 0.04, 16).rotateX(Math.PI / 2), glow(M.PALETTE.flow), 0, 0.4, 0.15); }),
      icon('satellite', 2.6, 1.4, (g) => { add(g, new THREE.BoxGeometry(0.4, 0.4, 0.55), mat('#C9D3E0'), 0, 1.3); add(g, new THREE.BoxGeometry(1.1, 0.03, 0.42), mat('#1E3A6E', { emissive: '#0c1f44' }), 0, 1.3); }),
      icon('business', 5, -1.4, (g) => { for (let i = 0; i < 3; i += 1) add(g, new THREE.CylinderGeometry(0.42, 0.42, 0.24, 16), mat('#6B7486'), 0, 0.14 + i * 0.29); }),
      icon('weather', 5.2, 2.2, (g) => { add(g, new THREE.SphereGeometry(0.28, 12, 8), glow('#F4A261'), 0.35, 0.95); for (const [x, y, r] of [[-0.2, 0.55, 0.3], [0.15, 0.6, 0.36], [0.5, 0.52, 0.26]]) add(g, new THREE.SphereGeometry(r, 10, 8), mat('#D9DEE8'), x, y); }),
    ],
    L2: [
      icon('shield', -4.8, 1.0, (g) => {
        const s = new THREE.Shape();
        s.moveTo(0, 0.9); s.quadraticCurveTo(0.55, 0.85, 0.6, 0.6); s.quadraticCurveTo(0.6, 0.1, 0, -0.2); s.quadraticCurveTo(-0.6, 0.1, -0.6, 0.6); s.quadraticCurveTo(-0.55, 0.85, 0, 0.9);
        add(g, new THREE.ExtrudeGeometry(s, { depth: 0.16, bevelEnabled: false }), glow('#E0A458'), 0, 0.3);
      }),
      icon('containers', -1.8, -1.2, (g) => { const geo = new THREE.BoxGeometry(0.34, 0.34, 0.34); const cs = ['#2EC4B6', '#3FA7F5', '#80ED99']; for (let i = 0; i < 3; i += 1) for (let j = 0; j < 3; j += 1) add(g, geo, mat(cs[(i + j) % 3]), (i - 1) * 0.45, 0.18, (j - 1) * 0.45); }),
      icon('cloud', 1.2, 1.4, (g) => { add(g, new THREE.CylinderGeometry(0.95, 0.95, 0.2, 24), mat('#9AA8BF'), 0, 0.12); add(g, new THREE.BoxGeometry(0.3, 0.3, 0.3), mat('#3FA7F5'), -0.3, 0.38); add(g, new THREE.BoxGeometry(0.3, 0.3, 0.3), mat('#2EC4B6'), 0.25, 0.38, 0.2); }),
      icon('evergreen', 4.0, -1.2, (g) => { add(g, new THREE.TorusGeometry(0.42, 0.07, 8, 24, Math.PI * 1.6), glow('#80ED99'), 0, 0.6); add(g, new THREE.ConeGeometry(0.14, 0.26, 8).rotateZ(-Math.PI / 2), glow('#80ED99'), 0.42, 0.62, 0); }),
      icon('aiChip', 5.3, 2.0, (g) => { add(g, new THREE.BoxGeometry(0.8, 0.12, 0.8), mat('#22324D'), 0, 0.08); add(g, new THREE.BoxGeometry(0.4, 0.06, 0.4), glow(M.PALETTE.ai), 0, 0.16); for (let i = -1; i <= 1; i += 1) for (const [sx, sz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) add(g, new THREE.BoxGeometry(0.08, 0.04, 0.08), mat('#C9D3E0'), sx * 0.48 + (sz ? i * 0.22 : 0), 0.04, sz * 0.48 + (sx ? i * 0.22 : 0)); }),
    ],
    L3: [
      icon('fabric', -1.2, 0, (g) => {
        const geo = new THREE.PlaneGeometry(7, 4, 14, 8).rotateX(-Math.PI / 2);
        const p = geo.attributes.position;
        for (let i = 0; i < p.count; i += 1) p.setY(i, 0.35 + 0.18 * Math.sin(p.getX(i) * 1.1) * Math.cos(p.getZ(i) * 1.3));
        const lines = new THREE.LineSegments(new THREE.WireframeGeometry(geo), new THREE.LineBasicMaterial({ color: '#5BC98C', transparent: true, opacity: 0.85, toneMapped: false }));
        geo.dispose();
        g.add(lines);
      }),
      icon('catalog', 4.6, -1.6, (g) => { for (let i = 0; i < 3; i += 1) add(g, new THREE.CylinderGeometry(0.85 - i * 0.12, 0.85 - i * 0.12, 0.12, 24), mat(i === 2 ? '#80ED99' : '#5BC98C', { emissive: '#1d4d33' }), 0, 0.08 + i * 0.14); }),
      icon('connectors', 4.6, 2.2, (g) => { for (const x of [-0.45, 0.45]) { add(g, new THREE.BoxGeometry(0.4, 0.3, 0.5), mat('#9AA8BF'), x, 0.2); add(g, new THREE.BoxGeometry(0.05, 0.05, 0.25), mat('#E8EDF4'), x - 0.08, 0.2, 0.36); add(g, new THREE.BoxGeometry(0.05, 0.05, 0.25), mat('#E8EDF4'), x + 0.08, 0.2, 0.36); } }),
    ],
    L4: [
      icon('twin', 0, 0, (g) => {
        const nodes = [[-5, -2.5], [-3, 0.5], [-4.5, 2.5], [-1, -1.8], [0.5, 1.5], [2.2, -0.5], [3.8, 2.2], [4.8, -2.4], [-1.8, 3], [1.8, 3.2]];
        const nodeMat = M.stdMat('#A77BE8', { emissive: '#A77BE8', emissiveIntensity: 0.8 });
        const ng = new THREE.SphereGeometry(0.2, 10, 8);
        for (const [x, z] of nodes) add(g, ng, nodeMat, x, 0.35, z);
        const edges = [[0, 1], [1, 2], [1, 3], [3, 4], [4, 5], [5, 6], [5, 7], [4, 9], [2, 8], [8, 9], [6, 9], [3, 7]];
        const pos = [];
        for (const [a, b] of edges) pos.push(nodes[a][0], 0.35, nodes[a][1], nodes[b][0], 0.35, nodes[b][1]);
        const lg = new THREE.BufferGeometry();
        lg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        g.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: '#C9A8FF', toneMapped: false })));
      }),
    ],
    L5: [
      icon('apps', 0, 0, (g) => {
        const tile = new THREE.PlaneGeometry(1.25, 0.8);
        const edge = new THREE.EdgesGeometry(tile);
        const fillMat = new THREE.MeshStandardMaterial({ color: '#4D9DE0', transparent: true, opacity: 0.35, emissive: '#4D9DE0', emissiveIntensity: 0.5, side: THREE.DoubleSide, depthWrite: false });
        const edgeMat = new THREE.LineBasicMaterial({ color: '#8CC4F2', toneMapped: false });
        for (let r = 0; r < 2; r += 1) {
          for (let c = 0; c < 5; c += 1) {
            const x = -4.4 + c * 2.2;
            const z = r ? 1.6 : -1.4;
            add(g, tile, fillMat, x, 0.6, z).castShadow = false;
            const e = new THREE.LineSegments(edge, edgeMat);
            e.position.set(x, 0.6, z);
            g.add(e);
          }
        }
      }),
    ],
    L6: [
      icon('solDist', -3.3, 0, (g) => solutionTile(g, '#4D9DE0')),
      icon('solTrans', 3.3, 0, (g) => solutionTile(g, '#4D9DE0')),
    ],
    L7: [
      icon('operators', -3.2, -0.6, (g) => {
        add(g, new THREE.BoxGeometry(3.2, 0.5, 0.9), mat('#3A4558'), 0, 0.25);
        for (const x of [-1, 0, 1]) add(g, new THREE.BoxGeometry(0.85, 0.5, 0.05), glow('#3FA7F5'), x, 0.85, -0.25);
        for (const x of [-0.7, 0.7]) { const p = A.createPerson(); p.position.set(x, 0, 0.75); g.add(p); }
      }),
      icon('crew', 2.4, 1.6, (g) => { const p = A.createPerson({ color: '#F4A261' }); g.add(p); add(g, new THREE.BoxGeometry(0.28, 0.2, 0.03), glow('#3FA7F5'), 0.18, 0.62, 0.22); }),
      icon('dashboards', 4.4, -1.6, (g) => { add(g, new THREE.BoxGeometry(2.0, 1.15, 0.08), mat('#22324D'), 0, 1.0); add(g, new THREE.BoxGeometry(1.8, 0.95, 0.02), glow('#2EC4B6'), 0, 1.0, 0.05); add(g, new THREE.BoxGeometry(0.08, 0.45, 0.08), mat('#4B5567'), 0, 0.22); }),
    ],
  };
  function solutionTile(g, color) {
    const p = A.createGlassPanel({ width: 4.6, height: 1.9, color });
    p.group.position.y = 1.15;
    g.add(p.group);
    for (let i = 0; i < 3; i += 1) add(g, new THREE.BoxGeometry(0.9, 0.55, 0.06), M.stdMat(color, { emissive: color, emissiveIntensity: 0.5, transparent: true, opacity: 0.75 }), -1.4 + i * 1.4, 1.15, 0.05);
  }

  // ── Layers ───────────────────────────────────────────────────
  const layers = IDS.map((id, i) => {
    const tint = M.LAYER_TINTS[id];
    const group = new THREE.Group();
    const slab = A.createGlassSlab({ width: SLAB.w, depth: SLAB.d, thickness: SLAB.t, color: tint, opacity: 0.2 });
    slab.body.userData.layer = id;
    group.add(slab.group);
    for (const ic of ICON_BUILDERS[id]) group.add(ic);
    const lab = L.label(content.labels[id], { anchor: 'right', variant: 'left' });
    lab.position.set(-SLAB.w / 2 - 0.3, 0, SLAB.d / 2 - 0.2);
    group.add(lab);
    scene.add(group);
    return { id, group, slab, lab, i, tint: new THREE.Color(tint) };
  });

  // ── Flows: data up (blue), commands down (yellow) ────────────
  const dataCols = [[-6.2, -3.8], [6.2, -3.8], [-6.2, 3.8], [6.2, 3.8], [-2.6, 4.0], [2.6, -4.0]];
  const cmdCols = [[-6.6, 0.3], [6.6, -0.3]];
  const dataFlows = dataCols.map(([x, z]) => new F.PowerFlow({ path: [V(x, 0, z), V(x, 1, z)], color: M.PALETTE.data, density: 1.6, size: 0.36, velocity: 2.4 }));
  const cmdFlows = cmdCols.map(([x, z]) => new F.PowerFlow({ path: [V(x, 1, z), V(x, 0, z)], color: M.PALETTE.command, density: 1.4, size: 0.44, velocity: 2.2, intensity: 0 }));
  for (const f of [...dataFlows, ...cmdFlows]) { scene.add(f.object3D); flows.push(f); }
  let pathsFor = -1;
  const updatePaths = () => {
    if (pathsFor === view.explode) return;
    pathsFor = view.explode;
    const y0 = layerY(0) + 0.2;
    const y7 = layerY(6) + 1.2;
    const y5 = layerY(4) + 0.2;
    dataCols.forEach(([x, z], i) => dataFlows[i].setPath([V(x, y0, z), V(x, y7, z)]));
    cmdCols.forEach(([x, z], i) => cmdFlows[i].setPath([V(x, y5, z), V(x, y0, z)]));
  };

  // ── Timeline: one layer per step, bottom to top ──────────────
  const timeline = stepTimeline([1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 2.4], (tl, at, k) => {
    tl.to(S, { [`h${k}`]: 1, duration: 0.8, ease: 'power2.out' }, at);
    if (k > 1) tl.to(S, { [`h${k - 1}`]: 0.55, duration: 0.8 }, at);
    if (k === 7) tl.to(S, { cmd: 1, duration: 0.9 }, `${at}+=0.8`);
  });

  // ── Camera presets depend on the current explode amount ──────
  const cameraPreset = (name) => {
    if (name === 'overview') {
      const mid = (layerY(0) + layerY(6)) / 2;
      const span = layerY(6) - layerY(0);
      return { pos: [13, mid + 6 + span * 0.12, 22 + span * 0.55], target: [-4, mid, 0] };
    }
    const i = IDS.indexOf(name);
    if (i < 0) return null;
    const y = layerY(i);
    return { pos: [8, y + 6.5, 18], target: [-5.6, y + 0.4, 0] };
  };

  // ── Selection (click a slab or a layer row) ──────────────────
  const selectLayer = (id) => {
    view.selected = id;
  };
  const layerOf = (obj) => {
    for (let o = obj; o; o = o.parent) {
      if (o.userData.layer) return o.userData.layer;
      const owner = layers.find((l) => l.group === o);
      if (owner) return owner.id;
    }
    return null;
  };
  const pickables = layers.map((l) => l.group);
  const onClick = (ray) => {
    const hit = ray.intersectObjects(pickables, true)[0];
    const id = hit ? layerOf(hit.object) : null;
    ctx.emit('layer-select', id && id !== view.selected ? id : null);
  };
  const onHover = (ray) => {
    const hit = ray.intersectObjects(pickables, true).find((h) => h.object.visible);
    if (!hit) return null;
    for (let o = hit.object; o; o = o.parent) {
      if (o.userData.tip) return { tip: content.iconTips[o.userData.tip], clickable: true };
    }
    const id = layerOf(hit.object);
    return id ? { tip: `${content.labels[id].title}\n${content.labels[id].sub}`, clickable: true } : null;
  };

  // ── Explode / collapse ───────────────────────────────────────
  let explodeTween = null;
  const setExploded = (on) => {
    explodeTween?.kill();
    explodeTween = gsap.to(view, { explode: on ? 1 : 0, duration: stage.reducedMotion ? 0 : 0.9, ease: 'power2.inOut' });
  };

  const white = new THREE.Color('#ffffff');
  const update = (dt) => {
    updatePaths();
    layers.forEach((l, i) => {
      l.group.position.y = layerY(i);
      const h = S[`h${i + 1}`];
      const sel = view.selected === l.id;
      l.slab.setGlow(Math.max(h, sel ? 0.9 : 0));
      l.slab.edgeMaterial.color.copy(l.tint).lerp(white, sel ? 0.75 : 0);
      // In a close-up, labels of layers far from the focus would sit at the frame edges: hide them.
      const far = view.focus === null ? 0 : Math.abs(i - view.focus);
      const near = far >= 2 ? 0 : 1;
      L.setLabelOpacity(l.lab, sel ? 1 : (0.5 + 0.5 * h) * near);
      l.lab.element.classList.toggle('label3d--accent', sel || h > 0.95);
    });
    for (const f of dataFlows) { f.intensity = S.data; f.update(dt); }
    for (const f of cmdFlows) { f.intensity = S.cmd; f.update(dt); }
  };

  const layerIcons = Object.fromEntries(IDS.map((id) => [id, ICON_BUILDERS[id].map((g) => g.userData.tip)]));

  return finishScene({
    scene, camera, timeline, flows, update, cameraPreset, onClick, onHover, selectLayer, layerIcons,
    steps: stepsFromContent(content, ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'overview']),
    startPreset: 'overview',
    onStep: (k) => {
      // Steps 1–6 are close-ups of one layer; step 0 and step 7 show the whole stack.
      view.focus = k >= 1 && k <= 6 ? k - 1 : null;
      ctx.emit('step-layer', k ? IDS[k - 1] : null);
    },
    controlsLimits: { minDistance: 6, maxDistance: 70 },
    interactions: [
      { type: 'toggleButton', labels: [content.controls.explode, content.controls.collapse], value: true, onChange: (on) => setExploded(on) },
    ],
    dispose: () => explodeTween?.kill(),
  });
}
