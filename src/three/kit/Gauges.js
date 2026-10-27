// Gauges and in-scene charts for the distribution demos (Phase 3).
//   createDialGauge     half-circle dial with coloured bands and a needle (faces +z)
//   createVoltageRibbon floating band whose height is voltage along a feeder
//   createBandPlanes    the two translucent limit planes for the voltage ribbon
//   createEnvelopeBars  instanced vertical bars (allowed export per home)

import * as THREE from 'three';
import { stdMat, glowMat, COLOR } from '../materials.js';

const { PI } = Math;

/**
 * Half-circle dial. bands: [{ from, to, color }] in value units.
 * Returns { group, setValue(v) }.
 */
export function createDialGauge({ radius = 1, min = 0, max = 1, bands = [] } = {}) {
  const group = new THREE.Group();
  const ang = (v) => PI * (1 - (Math.min(max, Math.max(min, v)) - min) / (max - min));

  const back = new THREE.Mesh(new THREE.CircleGeometry(radius * 1.12, 32, 0, PI), stdMat('#0B1D5C', { roughness: 0.8 }));
  back.position.z = -0.02;
  const base = new THREE.Mesh(new THREE.BoxGeometry(radius * 2.24, radius * 0.18, 0.06), stdMat('#0B1D5C'));
  base.position.set(0, -radius * 0.09, -0.02);
  group.add(back, base);

  for (const b of bands) {
    const a0 = ang(b.to);
    const a1 = ang(b.from);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius * 0.8, radius * 1.0, 24, 1, a0, a1 - a0),
      glowMat(b.color, { blending: THREE.NormalBlending, side: THREE.DoubleSide }),
    );
    group.add(ring);
  }

  const pivot = new THREE.Group();
  const needleGeo = new THREE.BoxGeometry(radius * 0.06, radius * 0.92, 0.04).translate(0, radius * 0.46, 0.03);
  pivot.add(new THREE.Mesh(needleGeo, glowMat('#FFFFFF', { blending: THREE.NormalBlending })));
  pivot.add(new THREE.Mesh(new THREE.CircleGeometry(radius * 0.1, 16), glowMat('#FFFFFF', { blending: THREE.NormalBlending })));
  group.add(pivot);

  return {
    group,
    setValue(v) { pivot.rotation.z = ang(v) - PI / 2; },
  };
}

/**
 * A ribbon above a feeder whose height is the voltage at each point.
 * Colours: green inside the band, amber within `warn` of a limit, red outside.
 * update(fn) takes fn(s) → voltage for s in 0..1 along the feeder.
 */
export function createVoltageRibbon({ x0, x1, z = 0, width = 0.7, baseY = 7.5, scale = 30, low = 0.95, high = 1.05, warn = 0.008, samples = 96 }) {
  const n = samples + 1;
  const positions = new Float32Array(n * 2 * 3);
  const colors = new Float32Array(n * 2 * 3);
  const index = [];
  for (let i = 0; i < samples; i += 1) {
    const a = i * 2;
    index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setIndex(index);
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: 0.92, toneMapped: false, depthWrite: false }));
  mesh.frustumCulled = false;

  // A bright edge line along the top of the ribbon.
  const edgePos = new Float32Array(n * 3);
  const edgeGeo = new THREE.BufferGeometry();
  edgeGeo.setAttribute('position', new THREE.BufferAttribute(edgePos, 3));
  edgeGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const edge = new THREE.Line(edgeGeo, new THREE.LineBasicMaterial({ vertexColors: true, toneMapped: false }));
  edge.frustumCulled = false;

  const group = new THREE.Group();
  group.add(mesh, edge);

  const yFor = (v) => baseY + (v - 1) * scale;
  const tmp = new THREE.Color();
  const colorFor = (v, out = tmp) => {
    if (v < low || v > high) return out.copy(COLOR.fault);
    if (v < low + warn || v > high - warn) return out.copy(COLOR.warning);
    return out.copy(COLOR.restored);
  };

  let min = 1;
  let max = 1;
  const update = (fn) => {
    min = Infinity;
    max = -Infinity;
    const ec = edgeGeo.attributes.color.array;
    for (let i = 0; i < n; i += 1) {
      const s = i / samples;
      const v = fn(s);
      min = Math.min(min, v);
      max = Math.max(max, v);
      const x = x0 + (x1 - x0) * s;
      const y = yFor(v);
      positions.set([x, y, z - width / 2, x, y - 0.35, z + width / 2], i * 6);
      edgePos.set([x, y + 0.02, z - width / 2], i * 3);
      colorFor(v);
      colors.set([tmp.r, tmp.g, tmp.b, tmp.r * 0.7, tmp.g * 0.7, tmp.b * 0.7], i * 6);
      ec.set([tmp.r, tmp.g, tmp.b], i * 3);
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
    edgeGeo.attributes.position.needsUpdate = true;
    edgeGeo.attributes.color.needsUpdate = true;
  };

  return { group, update, yFor, colorFor, get min() { return min; }, get max() { return max; } };
}

/** Two translucent horizontal planes marking the lower and upper voltage limits. */
export function createBandPlanes({ x0, x1, z = 0, depth = 2.2, yLow, yHigh }) {
  const group = new THREE.Group();
  const geo = new THREE.PlaneGeometry(x1 - x0, depth).rotateX(-PI / 2);
  for (const y of [yLow, yHigh]) {
    const plane = new THREE.Mesh(geo, glowMat(COLOR.restored, { opacity: 0.1, blending: THREE.NormalBlending, side: THREE.DoubleSide }));
    plane.position.set((x0 + x1) / 2, y, z);
    const edgeGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(x1 - x0, depth).rotateX(-PI / 2));
    const lines = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: COLOR.restored, transparent: true, opacity: 0.55, toneMapped: false }));
    lines.position.copy(plane.position);
    group.add(plane, lines);
  }
  return group;
}

/**
 * Vertical bars standing on given base points (e.g. above each solar roof).
 * set(i, height, color) then commit(). Height is in world units.
 */
export function createEnvelopeBars(bases, { width = 0.22 } = {}) {
  const geo = new THREE.BoxGeometry(width, 1, width).translate(0, 0.5, 0);
  const mat = new THREE.MeshBasicMaterial({ color: '#FFFFFF', toneMapped: false, transparent: true, opacity: 0.9 });
  const mesh = new THREE.InstancedMesh(geo, mat, bases.length);
  mesh.frustumCulled = false;
  const m = new THREE.Matrix4();
  const s = new THREE.Vector3(1, 1, 1);
  const q = new THREE.Quaternion();
  const c = new THREE.Color();
  return {
    mesh,
    set(i, height, color) {
      s.set(1, Math.max(0.001, height), 1);
      m.compose(bases[i], q, s);
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, c.copy(color));
    },
    commit() {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    },
  };
}
