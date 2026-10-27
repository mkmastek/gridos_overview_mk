// Reusable low-poly 3D building blocks ("architectural model" look).
// Geometries are cached and shared between scenes (userData.shared) — each asset is built
// from merged parts so it costs one to three draw calls. Repeated objects (houses, trees)
// use InstancedMesh.
//
// Kit v1: ground, lights, road, pole, conductor span, substation, distribution transformer,
// houses (+ solar / battery / EV charger), trees, switch / recloser / breaker, crew truck,
// glass slab and panel, data beam. Also simple generation and transmission assets for Slide 1.

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { mats, stdMat, glowMat, SCENE } from '../materials.js';

const { PI } = Math;
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ── Geometry helpers ─────────────────────────────────────────────
const GEO = new Map();
export function sharedGeo(key, make) {
  let g = GEO.get(key);
  if (!g) {
    g = make();
    g.userData.shared = true;
    GEO.set(key, g);
  }
  return g;
}

function box(w, h, d, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const g = new THREE.BoxGeometry(w, h, d);
  if (rx || ry || rz) g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx, ry, rz)));
  return g.translate(x, y, z);
}
function cyl(rt, rb, h, seg, x = 0, y = 0, z = 0, rx = 0, rz = 0) {
  const g = new THREE.CylinderGeometry(rt, rb, h, seg);
  if (rx || rz) g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx, 0, rz)));
  return g.translate(x, y, z);
}
/** A thin box from point a to point b (lattice members, braces). */
function strut(a, b, t = 0.06) {
  const dir = b.clone().sub(a);
  const g = new THREE.BoxGeometry(t, dir.length(), t);
  const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir.clone().normalize());
  g.applyMatrix4(new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), q, V(1, 1, 1)));
  return g;
}
function merge(list) {
  const g = mergeGeometries(list, false);
  for (const x of list) x.dispose();
  return g;
}
function mesh(geo, mat, { cast = true, receive = false } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

// ── Scene base ───────────────────────────────────────────────────
export function createBaseScene({ fogNear = 60, fogFar = 160, fov = 40, ground = { width: 80, depth: 50 }, shadowExtent = 40, lightScale = 1 } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SCENE.background);
  scene.fog = new THREE.Fog(SCENE.background, fogNear, fogFar);
  const camera = new THREE.PerspectiveCamera(fov, 1.5, 0.1, 500);
  const lights = createLights(scene, { extent: shadowExtent, scale: lightScale });
  const table = ground ? createGround(ground) : null;
  if (table) scene.add(table);
  return { scene, camera, lights, ground: table };
}

export function createLights(scene, { extent = 40, scale = 1 } = {}) {
  const hemi = new THREE.HemisphereLight('#d6e4ff', '#14246a', 1.6 * scale);
  const dir = new THREE.DirectionalLight('#ffffff', 2.1 * scale);
  dir.position.set(extent * 0.45, extent * 0.9, extent * 0.55);
  dir.castShadow = true;
  dir.shadow.mapSize.set(1024, 1024);
  Object.assign(dir.shadow.camera, { left: -extent, right: extent, top: extent, bottom: -extent, near: 1, far: extent * 3.5 });
  dir.shadow.bias = -0.0006;
  dir.shadow.normalBias = 0.03;
  scene.add(hemi, dir, dir.target);
  return { hemi, dir };
}

/** Dark "control-room map table" with subtle grid lines. */
export function createGround({ width = 80, depth = 50, step = 2 } = {}) {
  const group = new THREE.Group();
  const top = mesh(sharedGeo(`ground:${width}x${depth}`, () => new THREE.PlaneGeometry(width, depth).rotateX(-PI / 2)), mats().ground, { cast: false, receive: true });
  const side = mesh(sharedGeo(`groundSide:${width}x${depth}`, () => box(width, 0.6, depth, 0, -0.31, 0)), mats().tableSide, { cast: false });
  const grid = new THREE.LineSegments(sharedGeo(`grid:${width}x${depth}x${step}`, () => gridGeometry(width, depth, step)), gridMaterial());
  grid.position.y = 0.012;
  group.add(top, side, grid);
  return group;
}

let GRID_MAT = null;
function gridMaterial() {
  if (!GRID_MAT) {
    GRID_MAT = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9 });
    GRID_MAT.userData.shared = true;
  }
  return GRID_MAT;
}
function gridGeometry(w, d, step) {
  const pos = [];
  const col = [];
  const major = new THREE.Color(SCENE.gridMajor);
  const minor = new THREE.Color(SCENE.gridMinor);
  const push = (x1, z1, x2, z2, c) => { pos.push(x1, 0, z1, x2, 0, z2); col.push(c.r, c.g, c.b, c.r, c.g, c.b); };
  let i = 0;
  for (let x = -w / 2; x <= w / 2 + 1e-6; x += step, i += 1) push(x, -d / 2, x, d / 2, i % 5 === 0 ? major : minor);
  i = 0;
  for (let z = -d / 2; z <= d / 2 + 1e-6; z += step, i += 1) push(-w / 2, z, w / 2, z, i % 5 === 0 ? major : minor);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}

/** Flat road strip from a to b (x/z only). */
export function createRoad(a, b, width = 1.6) {
  const len = Math.hypot(b.x - a.x, b.z - a.z);
  const g = new THREE.PlaneGeometry(len, width).rotateX(-PI / 2);
  const m = mesh(g, mats().road, { cast: false, receive: true });
  m.position.set((a.x + b.x) / 2, 0.02, (a.z + b.z) / 2);
  m.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
  return m;
}

// ── Distribution line ───────────────────────────────────────────
/** Wooden distribution pole with crossarm. userData.top = conductor attach point (local). */
export function createPole({ height = 4.6, crossarm = true } = {}) {
  const group = new THREE.Group();
  const body = sharedGeo(`pole:${height}:${crossarm}`, () => merge([
    cyl(0.07, 0.11, height, 6, 0, height / 2, 0),
    ...(crossarm ? [box(0.1, 0.1, 1.5, 0, height - 0.35, 0)] : []),
  ]));
  const ins = sharedGeo(`poleIns:${height}`, () => merge([
    cyl(0.045, 0.06, 0.2, 6, 0, height - 0.2, -0.6),
    cyl(0.045, 0.06, 0.2, 6, 0, height - 0.2, 0),
    cyl(0.045, 0.06, 0.2, 6, 0, height - 0.2, 0.6),
  ]));
  group.add(mesh(body, mats().wood));
  if (crossarm) group.add(mesh(ins, mats().insulator, { cast: false }));
  group.userData.top = V(0, height - 0.08, 0);
  return group;
}

/** Points of a sagging conductor between a and b (parabola approximation of a catenary). */
export function catenary(a, b, sag = 0.35, n = 14) {
  const pts = [];
  for (let i = 0; i <= n; i += 1) {
    const t = i / n;
    pts.push(a.clone().lerp(b, t).add(V(0, -sag * 4 * t * (1 - t), 0)));
  }
  return pts;
}

/** A conductor mesh along points. The material is passed in, so a section can be recoloured. */
export function createConductor(points, material, radius = 0.04) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.1);
  const g = new THREE.TubeGeometry(curve, Math.max(8, points.length * 2), radius, 5, false);
  return mesh(g, material, { cast: false });
}

/** Join several point lists end-to-end, dropping duplicated joints. */
export function joinPaths(...lists) {
  const out = [];
  for (const l of lists) for (const p of l) if (!out.length || out[out.length - 1].distanceToSquared(p) > 1e-6) out.push(p);
  return out;
}

// ── Substations and transformers ────────────────────────────────
/**
 * Fenced substation pad with a power transformer and a gantry.
 * userData.exitE / exitW: local points where lines leave (east = +x, west = −x).
 */
export function createSubstation({ w = 5, d = 4.4, gantryH = 2.8, scale = 1 } = {}) {
  const group = new THREE.Group();
  const pad = sharedGeo(`sub:pad:${w}x${d}`, () => box(w, 0.16, d, 0, 0.08, 0));
  const fence = sharedGeo(`sub:fence:${w}x${d}`, () => {
    const h = 0.55;
    const parts = [
      box(w, h, 0.04, 0, 0.16 + h / 2, d / 2), box(w, h, 0.04, 0, 0.16 + h / 2, -d / 2),
      box(0.04, h, d, w / 2, 0.16 + h / 2, 0), box(0.04, h, d, -w / 2, 0.16 + h / 2, 0),
    ];
    return merge(parts);
  });
  const xfmr = sharedGeo('sub:xfmr', () => merge([
    box(1.3, 1.1, 0.95, 0, 0.16 + 0.55, 0),
    ...[-0.45, -0.15, 0.15, 0.45].map((x) => box(0.08, 0.9, 0.3, x, 0.16 + 0.5, 0.62)),
    ...[-0.35, 0, 0.35].map((x) => cyl(0.06, 0.08, 0.55, 6, x, 0.16 + 1.35, -0.15)),
  ]));
  const gantry = sharedGeo(`sub:gantry:${gantryH}:${d}`, () => merge([
    box(0.12, gantryH, 0.12, 0, 0.16 + gantryH / 2, -d * 0.32),
    box(0.12, gantryH, 0.12, 0, 0.16 + gantryH / 2, d * 0.32),
    box(0.12, 0.12, d * 0.7, 0, 0.16 + gantryH, 0),
    cyl(0.035, 0.035, w * 0.42, 6, -w * 0.16, 0.16 + gantryH - 0.45, 0, 0, PI / 2),
  ]));
  group.add(mesh(pad, mats().concrete, { cast: false, receive: true }));
  group.add(mesh(fence, mats().darkMetal, { cast: false }));
  const t = mesh(xfmr, mats().darkMetal);
  t.position.x = -w * 0.18;
  const gt = mesh(gantry, mats().metal);
  gt.position.x = w * 0.28;
  group.add(t, gt);
  group.scale.setScalar(scale);
  group.userData.exitE = V(w / 2 + 0.1, 0.16 + gantryH - 0.3, 0).multiplyScalar(scale);
  group.userData.exitW = V(-w / 2 - 0.1, 0.16 + gantryH - 0.3, 0).multiplyScalar(scale);
  return group;
}

/** Pole-mounted distribution transformer (the grey "can"). Mount at a pole top. */
export function createDistTransformer() {
  const g = sharedGeo('distXfmr', () => merge([
    cyl(0.22, 0.22, 0.55, 8, 0, 0, 0.32),
    cyl(0.04, 0.05, 0.16, 6, -0.08, 0.34, 0.32),
    cyl(0.04, 0.05, 0.16, 6, 0.08, 0.34, 0.32),
  ]));
  return mesh(g, mats().darkMetal);
}

// ── Houses (instanced) ──────────────────────────────────────────
const HOUSE_WALLS = ['#D9DEE8', '#C9D0DC', '#E2D8C9', '#CFD9D3'];
const HOUSE_ROOFS = ['#7C4A3A', '#4F5D73', '#6B4C3B', '#5C6678'];

/**
 * A group of houses drawn with instancing.
 * list: [{ x, z, rot = 0, s = 1, solar, battery, ev }]
 * Returns { group, setLit(0..1), windowMaterial, solarCount }.
 */
export function createHouses(list, { lit = 1 } = {}) {
  const group = new THREE.Group();
  const n = list.length;
  const body = sharedGeo('house:body', () => box(1.2, 0.8, 1.0, 0, 0.4, 0));
  const roof = sharedGeo('house:roof', () => {
    const g = new THREE.ConeGeometry(0.9, 0.55, 4, 1);
    g.rotateY(PI / 4);
    g.scale(1, 1, 0.84);
    return g.translate(0, 1.075, 0);
  });
  const win = sharedGeo('house:win', () => new THREE.PlaneGeometry(0.22, 0.2));
  const solar = sharedGeo('house:solar', () => box(0.74, 0.035, 0.34));
  const batt = sharedGeo('house:batt', () => box(0.16, 0.34, 0.12, 0, 0.17, 0));
  const ev = sharedGeo('house:ev', () => merge([box(0.1, 0.5, 0.08, 0, 0.25, 0), box(0.16, 0.14, 0.1, 0, 0.44, 0.02)]));
  const car = sharedGeo('house:car', () => merge([box(0.36, 0.18, 0.74, 0, 0.17, 0), box(0.32, 0.15, 0.4, 0, 0.33, -0.04)]));

  const count = (k) => list.filter((h) => h[k]).length;
  const bodies = new THREE.InstancedMesh(body, mats().white, n);
  const roofs = new THREE.InstancedMesh(roof, mats().white, n);
  const windowMaterial = new THREE.MeshBasicMaterial({ color: SCENE.windowLit, toneMapped: false });
  const windows = new THREE.InstancedMesh(win, windowMaterial, n * 2);
  const solars = new THREE.InstancedMesh(solar, mats().solar, Math.max(1, count('solar')));
  const batts = new THREE.InstancedMesh(batt, mats().battery, Math.max(1, count('battery')));
  const evs = new THREE.InstancedMesh(ev, mats().darkMetal, Math.max(1, count('ev')));
  const cars = new THREE.InstancedMesh(car, mats().glassDark, Math.max(1, count('ev')));
  for (const im of [bodies, roofs, solars, batts, evs, cars]) { im.castShadow = true; im.receiveShadow = true; }
  windows.castShadow = false;

  const house = new THREE.Object3D();
  const part = new THREE.Object3D();
  const m = new THREE.Matrix4();
  const place = (im, i, x, y, z, rx = 0, ry = 0) => {
    part.position.set(x, y, z);
    part.rotation.set(rx, ry, 0);
    part.updateMatrix();
    m.multiplyMatrices(house.matrix, part.matrix);
    im.setMatrixAt(i, m);
  };
  let si = 0; let bi = 0; let ei = 0;
  const c = new THREE.Color();
  list.forEach((h, i) => {
    house.position.set(h.x, 0, h.z);
    house.rotation.set(0, h.rot || 0, 0);
    house.scale.setScalar(h.s || 1);
    house.updateMatrix();
    place(bodies, i, 0, 0, 0);
    bodies.setColorAt(i, c.set(HOUSE_WALLS[i % HOUSE_WALLS.length]));
    place(roofs, i, 0, 0, 0);
    roofs.setColorAt(i, c.set(HOUSE_ROOFS[(i * 3) % HOUSE_ROOFS.length]));
    place(windows, i * 2, -0.3, 0.42, 0.502);
    place(windows, i * 2 + 1, 0.3, 0.42, 0.502);
    if (h.solar) place(solars, si++, 0, 1.09, 0.27, 0.8);
    if (h.battery) place(batts, bi++, 0.68, 0, 0.18);
    if (h.ev) {
      place(evs, ei, 0.92, 0, 0.62);
      place(cars, ei++, 1.22, 0, 0.1);
    }
  });
  solars.count = si; batts.count = bi; evs.count = ei; cars.count = ei;
  group.add(bodies, roofs, windows);
  if (si) group.add(solars);
  if (bi) group.add(batts);
  if (ei) group.add(evs, cars);

  const dark = new THREE.Color(SCENE.windowDark);
  const on = new THREE.Color(SCENE.windowLit);
  const setLit = (t) => windowMaterial.color.copy(dark).lerp(on, Math.max(0, Math.min(1, t)));
  setLit(lit);
  return { group, setLit, windowMaterial, solarCount: si };
}

// ── Trees ───────────────────────────────────────────────────────
const TREE_GREENS = ['#2F6B4F', '#3A7A55', '#285E46', '#467F4E'];

/** Instanced trees: list [{ x, z, s = 1 }]. */
export function createTrees(list) {
  const group = new THREE.Group();
  const trunk = sharedGeo('tree:trunk', () => cyl(0.07, 0.1, 0.6, 5, 0, 0.3, 0));
  const crown = sharedGeo('tree:crown', () => merge([
    new THREE.ConeGeometry(0.55, 1.1, 6).translate(0, 1.05, 0),
    new THREE.ConeGeometry(0.42, 0.85, 6).translate(0, 1.55, 0),
  ]));
  const trunks = new THREE.InstancedMesh(trunk, mats().trunk, list.length);
  const crowns = new THREE.InstancedMesh(crown, mats().white, list.length);
  const o = new THREE.Object3D();
  const c = new THREE.Color();
  list.forEach((t, i) => {
    o.position.set(t.x, 0, t.z);
    o.rotation.y = (i * 1.7) % (2 * PI);
    o.scale.setScalar(t.s || 1);
    o.updateMatrix();
    trunks.setMatrixAt(i, o.matrix);
    crowns.setMatrixAt(i, o.matrix);
    crowns.setColorAt(i, c.set(TREE_GREENS[i % TREE_GREENS.length]));
  });
  for (const im of [trunks, crowns]) { im.castShadow = true; im.receiveShadow = true; }
  group.add(trunks, crowns);
  return group;
}

/** One tree with its pivot at the base (it can fall over). */
export function createTree({ height = 5.5 } = {}) {
  const group = new THREE.Group();
  const s = height / 5.5;
  group.add(mesh(sharedGeo('bigtree:trunk', () => cyl(0.12, 0.2, 2.6, 6, 0, 1.3, 0)), mats().trunk));
  group.add(mesh(sharedGeo('bigtree:crown', () => merge([
    new THREE.ConeGeometry(1.2, 2.2, 7).translate(0, 2.9, 0),
    new THREE.ConeGeometry(0.9, 1.8, 7).translate(0, 3.9, 0),
    new THREE.ConeGeometry(0.55, 1.3, 7).translate(0, 4.8, 0),
  ])), mats().foliage));
  group.scale.setScalar(s);
  return group;
}

// ── Switching devices ───────────────────────────────────────────
/**
 * Switch, recloser or circuit breaker with a visible blade:
 * closed = blade flat across the gap, open = blade lifted at an angle.
 * kind: 'switch' (pole-top, on insulators) | 'recloser' (pole-top tank) | 'breaker' (ground cabinet)
 * Returns { group, setOpen(0..1), setColor(THREE.Color, glow), setLamp(0..1, THREE.Color), lampVisible }
 * userData.terminalW / terminalE: local conductor attach points.
 */
export function createSwitchDevice({ kind = 'switch', span = 0.9, lamp = false } = {}) {
  const group = new THREE.Group();
  const L = span;
  let y = 0;
  if (kind === 'switch') {
    group.add(mesh(sharedGeo(`sw:base:${L}`, () => merge([
      box(L + 0.3, 0.06, 0.16, 0, 0.03, 0),
      cyl(0.05, 0.065, 0.32, 6, -L / 2, 0.22, 0),
      cyl(0.05, 0.065, 0.32, 6, L / 2, 0.22, 0),
    ])), mats().insulator));
    y = 0.4;
  } else if (kind === 'recloser') {
    group.add(mesh(sharedGeo(`rec:body:${L}`, () => merge([
      cyl(0.2, 0.2, 0.46, 10, 0, -0.1, 0),
      box(0.22, 0.28, 0.16, 0, -0.55, 0.12),
      cyl(0.05, 0.06, 0.24, 6, -L / 2, 0.24, 0),
      cyl(0.05, 0.06, 0.24, 6, L / 2, 0.24, 0),
      box(L + 0.1, 0.05, 0.12, 0, 0.12, 0),
    ])), mats().darkMetal));
    y = 0.38;
  } else {
    group.add(mesh(sharedGeo(`brk:body:${L}`, () => merge([
      box(0.75, 1.0, 0.6, 0, 0.5, 0),
      cyl(0.05, 0.065, 0.36, 6, -L / 2, 1.18, 0),
      cyl(0.05, 0.065, 0.36, 6, L / 2, 1.18, 0),
    ])), mats().darkMetal));
    y = 1.38;
  }

  const bladeMat = stdMat('#2EC4B6', { emissive: '#2EC4B6', emissiveIntensity: 0.6 });
  const pivot = new THREE.Group();
  pivot.position.set(-L / 2, y, 0);
  const blade = mesh(sharedGeo(`blade:${L}`, () => box(L, 0.06, 0.07, L / 2, 0, 0)), bladeMat);
  pivot.add(blade);
  group.add(pivot);

  let lampMesh = null;
  if (lamp) {
    lampMesh = mesh(sharedGeo('lamp', () => new THREE.SphereGeometry(0.11, 10, 8)), new THREE.MeshBasicMaterial({ color: '#2A3346', toneMapped: false }), { cast: false });
    lampMesh.position.set(0, y + 0.32, 0);
    group.add(lampMesh);
  }
  group.userData.terminalW = V(-L / 2, y, 0);
  group.userData.terminalE = V(L / 2, y, 0);
  group.userData.lampPos = V(0, y + 0.32, 0);

  const lampOff = new THREE.Color('#2A3346');
  return {
    group,
    lamp: lampMesh,
    setOpen(t) { pivot.rotation.z = Math.max(0, Math.min(1, t)) * 0.95; },
    setColor(color, glow = 0.6) { bladeMat.color.copy(color); bladeMat.emissive.copy(color); bladeMat.emissiveIntensity = glow; },
    setLamp(v, color) {
      if (!lampMesh) return;
      lampMesh.material.color.copy(lampOff).lerp(color, Math.max(0, Math.min(1, v)));
      lampMesh.scale.setScalar(1 + 0.35 * Math.max(0, v));
    },
  };
}

// ── Vehicles ────────────────────────────────────────────────────
/** Utility crew truck facing +x. Returns { group, lightMaterial }. */
export function createCrewTruck() {
  const group = new THREE.Group();
  group.add(mesh(sharedGeo('truck:body', () => merge([
    box(1.75, 0.22, 0.72, 0, 0.3, 0),
    box(0.55, 0.52, 0.7, 0.6, 0.67, 0),
    box(1.05, 0.58, 0.72, -0.3, 0.7, 0),
    box(0.9, 0.06, 0.06, -0.35, 1.18, 0, 0, 0, 0.35),
  ])), mats().truck));
  group.add(mesh(sharedGeo('truck:stripe', () => box(1.07, 0.08, 0.74, -0.3, 0.62, 0)), mats().truckStripe, { cast: false }));
  group.add(mesh(sharedGeo('truck:glass', () => box(0.06, 0.24, 0.6, 0.88, 0.76, 0)), mats().glassDark, { cast: false }));
  group.add(mesh(sharedGeo('truck:wheels', () => merge(
    [[0.55, 0.36], [0.55, -0.36], [-0.55, 0.36], [-0.55, -0.36]].map(([x, z]) => cyl(0.17, 0.17, 0.12, 10, x, 0.17, z, PI / 2)),
  )), mats().tyre));
  const lightMaterial = glowMat('#F4A261', { blending: THREE.NormalBlending });
  const bar = mesh(sharedGeo('truck:bar', () => box(0.12, 0.06, 0.4, 0.6, 0.96, 0)), lightMaterial, { cast: false });
  group.add(bar);
  return { group, lightMaterial };
}

// ── Software metaphor: glass slabs, panels and beams ────────────
/**
 * Floating translucent slab (GridOS platform, architecture layers).
 * Returns { group, body, edges, setGlow(0..1), material }.
 */
export function createGlassSlab({ width = 20, depth = 10, thickness = 0.4, color = '#3FA7F5', opacity = 0.16, edgeOpacity = 0.85 } = {}) {
  const group = new THREE.Group();
  const geo = new THREE.BoxGeometry(width, thickness, depth);
  const material = new THREE.MeshStandardMaterial({
    color, transparent: true, opacity, roughness: 0.25, metalness: 0.1,
    emissive: color, emissiveIntensity: 0.25, depthWrite: false, side: THREE.DoubleSide,
  });
  const body = new THREE.Mesh(geo, material);
  body.renderOrder = 2;
  const edgeMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: edgeOpacity, toneMapped: false });
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat);
  group.add(body, edges);
  const base = { opacity, edgeOpacity };
  return {
    group, body, edges, material, edgeMaterial: edgeMat,
    setGlow(v) {
      material.opacity = base.opacity * (0.55 + 1.3 * v);
      material.emissiveIntensity = 0.12 + 0.75 * v;
      edgeMat.opacity = Math.min(1, base.edgeOpacity * (0.35 + 0.9 * v));
    },
  };
}

/** Vertical translucent panel facing +z, optionally showing a canvas texture. */
export function createGlassPanel({ width = 6, height = 3.5, color = '#3FA7F5', map = null, opacity = 0.9 } = {}) {
  const group = new THREE.Group();
  const geo = new THREE.PlaneGeometry(width, height);
  const material = map
    ? new THREE.MeshBasicMaterial({ map, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })
    : new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.18, emissive: color, emissiveIntensity: 0.3, side: THREE.DoubleSide, depthWrite: false });
  const plane = new THREE.Mesh(geo, material);
  plane.renderOrder = 3;
  const edgeMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9, toneMapped: false });
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat);
  group.add(plane, edges);
  return { group, plane, material, edgeMaterial: edgeMat };
}

/** Thin glowing cylinder between two points (data beam). */
export function createBeam(a, b, { color = '#3FA7F5', radius = 0.05, opacity = 0.5 } = {}) {
  const dir = b.clone().sub(a);
  const geo = new THREE.CylinderGeometry(radius, radius, dir.length(), 6, 1, true);
  const m = new THREE.Mesh(geo, glowMat(color, { opacity }));
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(V(0, 1, 0), dir.normalize());
  return m;
}

// ── Generation and transmission (simple versions for Slide 1; refined in later phases) ──
/** Gas power plant: turbine hall, heat-recovery boiler and stack. userData.exit = line start. */
export function createGasPlant() {
  const group = new THREE.Group();
  group.add(mesh(sharedGeo('gas:hall', () => merge([
    box(3.6, 1.7, 2.2, 0, 0.85, 0),
    box(3.7, 0.12, 2.3, 0, 1.76, 0),
    box(1.6, 2.5, 1.6, 2.6, 1.25, 0),
    box(0.9, 0.9, 0.8, -2.4, 0.45, 1.0),
  ])), mats().building));
  group.add(mesh(sharedGeo('gas:stack', () => merge([
    cyl(0.32, 0.42, 5.2, 10, 3.0, 2.6, -0.2),
    cyl(0.36, 0.36, 0.18, 10, 3.0, 5.0, -0.2),
  ])), mats().concrete));
  group.add(mesh(sharedGeo('gas:roof', () => box(1.4, 0.28, 1.0, -0.8, 1.95, 0)), mats().darkMetal));
  group.userData.exit = V(-2.4, 1.0, 1.0);
  return group;
}

/** Three-blade wind turbine. Returns { group, rotor, hub } — spin rotor.rotation.x. */
export function createWindTurbine({ height = 6.5, radius = 2.3 } = {}) {
  const group = new THREE.Group();
  group.add(mesh(sharedGeo(`wt:tower:${height}`, () => merge([
    cyl(0.1, 0.22, height, 10, 0, height / 2, 0),
    box(0.85, 0.32, 0.36, -0.12, height + 0.08, 0),
  ])), mats().turbine));
  const rotor = new THREE.Group();
  rotor.position.set(0.36, height + 0.08, 0);
  rotor.add(mesh(sharedGeo(`wt:blades:${radius}`, () => {
    const parts = [new THREE.SphereGeometry(0.16, 8, 6)];
    for (let i = 0; i < 3; i += 1) {
      const b = new THREE.BoxGeometry(0.05, radius, 0.2).translate(0, radius / 2 + 0.1, 0);
      b.applyMatrix4(new THREE.Matrix4().makeRotationX((i * 2 * PI) / 3));
      parts.push(b);
    }
    return merge(parts);
  }), mats().turbine));
  group.add(rotor);
  group.userData.base = V(0, 0.3, 0);
  return { group, rotor };
}

/**
 * Lattice transmission tower for a line running along x (arms along z).
 * userData.attach: [left-lower, right-lower, left-upper, right-upper] local points.
 */
export function createTransmissionTower({ height = 7.5 } = {}) {
  const h = height;
  const group = new THREE.Group();
  group.add(mesh(sharedGeo(`tower:${h}`, () => {
    const parts = [];
    const b = 0.8; // half base
    const t = 0.25; // half top
    const level = (y) => b + (t - b) * (y / (h * 0.92));
    const legs = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    for (const [sx, sz] of legs) parts.push(strut(V(sx * b, 0, sz * b), V(sx * t, h * 0.92, sz * t), 0.09));
    const ys = [0, h * 0.25, h * 0.5, h * 0.72, h * 0.92];
    for (let i = 0; i < ys.length - 1; i += 1) {
      const y1 = ys[i]; const y2 = ys[i + 1];
      const a = level(y1); const c = level(y2);
      for (const s of [1, -1]) {
        parts.push(strut(V(-a, y1, s * a), V(c, y2, s * c), 0.04));
        parts.push(strut(V(a, y1, s * a), V(-c, y2, s * c), 0.04));
        parts.push(strut(V(s * a, y1, -a), V(s * c, y2, c), 0.04));
        parts.push(strut(V(s * a, y1, a), V(s * c, y2, -c), 0.04));
      }
      parts.push(strut(V(-c, y2, -c), V(c, y2, -c), 0.04), strut(V(-c, y2, c), V(c, y2, c), 0.04));
      parts.push(strut(V(-c, y2, -c), V(-c, y2, c), 0.04), strut(V(c, y2, -c), V(c, y2, c), 0.04));
    }
    for (const [y, w] of [[h * 0.72, 2.0], [h * 0.9, 1.5]]) {
      parts.push(strut(V(0, y, -w), V(0, y, w), 0.08));
      parts.push(strut(V(0, y + 0.45, -0.2), V(0, y, -w), 0.04), strut(V(0, y + 0.45, 0.2), V(0, y, w), 0.04));
    }
    parts.push(strut(V(0, h * 0.92, 0), V(0, h, 0), 0.07));
    return merge(parts);
  }), mats().metal));
  group.userData.attach = [V(0, h * 0.72 - 0.35, -1.9), V(0, h * 0.72 - 0.35, 1.9), V(0, h * 0.9 - 0.35, -1.4), V(0, h * 0.9 - 0.35, 1.4)];
  return group;
}

/** Data-center block with rooftop cooling units. Returns { group, stripMaterial }. */
export function createDataCenter({ w = 5, d = 3.2, h = 1.6 } = {}) {
  const group = new THREE.Group();
  group.add(mesh(sharedGeo(`dc:body:${w}x${d}x${h}`, () => box(w, h, d, 0, h / 2, 0)), mats().buildingDark));
  group.add(mesh(sharedGeo(`dc:roof:${w}x${d}x${h}`, () => {
    const parts = [];
    for (let i = 0; i < 4; i += 1) for (let j = 0; j < 2; j += 1) parts.push(box(0.7, 0.32, 0.7, -w / 2 + 0.8 + i * ((w - 1.6) / 3), h + 0.16, -d / 4 + j * (d / 2)));
    return merge(parts);
  }), mats().metal));
  const stripMaterial = glowMat('#3FA7F5', { blending: THREE.NormalBlending, opacity: 0.9 });
  group.add(mesh(sharedGeo(`dc:strip:${w}x${d}x${h}`, () => box(w * 0.9, 0.07, 0.02, 0, h * 0.62, d / 2 + 0.01)), stripMaterial, { cast: false }));
  return { group, stripMaterial };
}

/** Simple standing person (operator, crew member). */
export function createPerson({ color = '#B9C4D6' } = {}) {
  const g = sharedGeo('person', () => merge([
    new THREE.CapsuleGeometry(0.16, 0.42, 3, 8).translate(0, 0.38, 0),
    new THREE.SphereGeometry(0.13, 10, 8).translate(0, 0.86, 0),
  ]));
  return mesh(g, stdMat(color));
}
