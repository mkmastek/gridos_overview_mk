// Software-side buildings and blocks (Phase 2 kit): source-system buildings, control
// center, cloud platform, container grids, data-lake tank, data-fabric mesh, catalog disc,
// shield and lock for security scenes.

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { sharedGeo } from './GridAssets.js';
import { mats, stdMat } from '../materials.js';

const merge = (list) => {
  const g = mergeGeometries(list, false);
  for (const x of list) x.dispose();
  return g;
};
const box = (w, h, d, x = 0, y = 0, z = 0) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
const cyl = (rt, rb, h, s, x = 0, y = 0, z = 0) => new THREE.CylinderGeometry(rt, rb, h, s).translate(x, y, z);
const mesh = (g, m, cast = true) => {
  const o = new THREE.Mesh(g, m);
  o.castShadow = cast;
  o.receiveShadow = true;
  return o;
};

/** Small roof icons that tell the source systems apart. */
const ICONS = {
  antenna: () => merge([cyl(0.04, 0.05, 1.1, 6, 0, 0.55, 0), new THREE.ConeGeometry(0.3, 0.2, 10).rotateX(Math.PI).translate(0, 1.0, 0)]),
  meter: () => merge([box(0.45, 0.6, 0.25, 0, 0.3, 0), new THREE.CylinderGeometry(0.15, 0.15, 0.05, 14).rotateX(Math.PI / 2).translate(0, 0.36, 0.13)]),
  person: () => merge([new THREE.CapsuleGeometry(0.16, 0.32, 3, 8).translate(0, 0.32, 0), new THREE.SphereGeometry(0.14, 10, 8).translate(0, 0.75, 0)]),
  map: () => merge([box(0.9, 0.05, 0.7, 0, 0.05, 0), box(0.06, 0.06, 0.6, -0.2, 0.1, 0), box(0.7, 0.06, 0.06, 0, 0.1, 0.1), box(0.06, 0.06, 0.4, 0.25, 0.1, -0.1)]),
  gears: () => merge([new THREE.TorusGeometry(0.3, 0.09, 6, 10).translate(-0.2, 0.42, 0), new THREE.TorusGeometry(0.2, 0.07, 6, 8).translate(0.28, 0.3, 0)]),
  cloud: () => merge([new THREE.SphereGeometry(0.26, 10, 8).translate(-0.22, 0.3, 0), new THREE.SphereGeometry(0.32, 10, 8).translate(0.08, 0.38, 0), new THREE.SphereGeometry(0.22, 10, 8).translate(0.38, 0.28, 0)]),
  flame: () => merge([new THREE.ConeGeometry(0.28, 0.8, 8).translate(0, 0.4, 0), new THREE.ConeGeometry(0.16, 0.5, 8).translate(0.2, 0.25, 0.05)]),
  solar: () => merge([box(0.9, 0.05, 0.55, 0, 0.4, 0).rotateX(-0.5), box(0.06, 0.4, 0.06, 0, 0.2, 0)]),
  server: () => merge([box(0.5, 0.9, 0.5, 0, 0.45, 0)]),
};
const ICON_COLORS = {
  antenna: '#C9D3E0', meter: '#E8EDF4', person: '#B9C4D6', map: '#5ECC62', gears: '#9AA8C7',
  cloud: '#E8EDF4', flame: '#F28C28', solar: '#1E3A6E', server: '#4B5567',
};

/**
 * A "system of record" building with a coloured roof band and an icon on top.
 * Returns { group, roofMaterial, setGlow(0..1) }.
 */
export function createSystemBuilding({ icon = 'server', color = '#0FBDFF', w = 2.4, d = 2.0, h = 1.5 } = {}) {
  const group = new THREE.Group();
  group.add(mesh(sharedGeo(`sysb:body:${w}x${d}x${h}`, () => merge([
    box(w, h, d, 0, h / 2, 0),
    ...[-0.6, 0, 0.6].map((x) => box(0.4, 0.3, 0.02, x * (w / 2.4), h * 0.55, d / 2 + 0.01)),
  ])), mats().building));
  const roofMaterial = stdMat(color, { emissive: color, emissiveIntensity: 0.25 });
  group.add(mesh(sharedGeo(`sysb:roof:${w}x${d}x${h}`, () => box(w + 0.08, 0.16, d + 0.08, 0, h + 0.08, 0)), roofMaterial, false));
  const iconMesh = mesh(sharedGeo(`sysb:icon:${icon}`, ICONS[icon] || ICONS.server), stdMatShared(ICON_COLORS[icon] || '#C9D3E0'));
  iconMesh.position.y = h + 0.16;
  group.add(iconMesh);
  group.userData.top = new THREE.Vector3(0, h + 1.2, 0);
  return {
    group,
    roofMaterial,
    setGlow(v) { roofMaterial.emissiveIntensity = 0.2 + 1.3 * v; },
  };
}

const SHARED = new Map();
function stdMatShared(color) {
  let m = SHARED.get(color);
  if (!m) {
    m = stdMat(color);
    m.userData.shared = true;
    SHARED.set(color, m);
  }
  return m;
}

/** On-premises control center: building with a glass front and a dish on the roof. */
export function createControlCenter({ w = 6, d = 4, h = 2.2 } = {}) {
  const group = new THREE.Group();
  group.add(mesh(sharedGeo(`cc:body:${w}`, () => merge([
    box(w, h, d, 0, h / 2, 0),
    box(w + 0.2, 0.18, d + 0.2, 0, h + 0.09, 0),
  ])), mats().building));
  group.add(mesh(sharedGeo(`cc:glass:${w}`, () => box(w * 0.85, h * 0.55, 0.05, 0, h * 0.5, d / 2 + 0.03)), mats().glassDark, false));
  group.add(mesh(sharedGeo(`cc:dish:${w}`, () => merge([
    cyl(0.05, 0.05, 0.6, 6, w * 0.3, h + 0.4, -d * 0.2),
    new THREE.SphereGeometry(0.45, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2.4).rotateX(Math.PI * 0.75).translate(w * 0.3, h + 0.8, -d * 0.2),
  ])), mats().white));
  return group;
}

/** A floating rounded "cloud platform" slab. Returns { group, material }. */
export function createCloudPlatform({ w = 10, d = 7, r = 1.4, color = '#0FBDFF' } = {}) {
  const s = new THREE.Shape();
  const x0 = -w / 2;
  const y0 = -d / 2;
  s.moveTo(x0 + r, y0);
  s.lineTo(x0 + w - r, y0);
  s.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r);
  s.lineTo(x0 + w, y0 + d - r);
  s.quadraticCurveTo(x0 + w, y0 + d, x0 + w - r, y0 + d);
  s.lineTo(x0 + r, y0 + d);
  s.quadraticCurveTo(x0, y0 + d, x0, y0 + d - r);
  s.lineTo(x0, y0 + r);
  s.quadraticCurveTo(x0, y0, x0 + r, y0);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.45, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12, bevelSegments: 2 });
  geo.rotateX(-Math.PI / 2);
  const material = new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.32, emissive: color, emissiveIntensity: 0.35, roughness: 0.3, depthWrite: false });
  const body = new THREE.Mesh(geo, material);
  body.renderOrder = 2;
  const edgeMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.8, toneMapped: false });
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), edgeMat);
  const group = new THREE.Group();
  group.add(body, edges);
  return { group, material, edgeMaterial: edgeMat };
}

/**
 * A grid of container cubes (microservices). Returns { mesh, positions, setColor(i, color) }.
 * Positions are local; pods are groups of `perPod` cubes.
 */
export function createContainerGrid({ pods = 4, perPod = 4, size = 0.42, gap = 0.12, podGap = 0.7, color = '#0FBDFF' } = {}) {
  const n = pods * perPod;
  const geo = new THREE.BoxGeometry(size, size, size);
  const mat = stdMat('#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.15 });
  const im = new THREE.InstancedMesh(geo, mat, n);
  im.castShadow = true;
  const positions = [];
  const side = Math.ceil(Math.sqrt(perPod));
  const podW = side * (size + gap);
  const cols = Math.ceil(Math.sqrt(pods));
  const o = new THREE.Object3D();
  const c = new THREE.Color(color);
  for (let p = 0; p < pods; p += 1) {
    const px = (p % cols) * (podW + podGap);
    const pz = Math.floor(p / cols) * (podW + podGap);
    for (let k = 0; k < perPod; k += 1) {
      const x = px + (k % side) * (size + gap);
      const z = pz + Math.floor(k / side) * (size + gap);
      const pos = new THREE.Vector3(x, size / 2, z);
      positions.push(pos);
      o.position.copy(pos);
      o.updateMatrix();
      im.setMatrixAt(p * perPod + k, o.matrix);
      im.setColorAt(p * perPod + k, c);
    }
  }
  // centre the grid on the origin
  const box3 = new THREE.Box3().setFromPoints(positions);
  const centre = box3.getCenter(new THREE.Vector3()).setY(0);
  for (const pos of positions) pos.sub(centre);
  for (let i = 0; i < n; i += 1) {
    o.position.copy(positions[i]);
    o.updateMatrix();
    im.setMatrixAt(i, o.matrix);
  }
  im.instanceMatrix.needsUpdate = true;
  return {
    mesh: im,
    positions,
    setColor(i, col) { im.setColorAt(i, col); im.instanceColor.needsUpdate = true; },
    setScale(i, s) {
      o.position.copy(positions[i]);
      o.scale.setScalar(Math.max(0.0001, s));
      o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
      im.instanceMatrix.needsUpdate = true;
      o.scale.setScalar(1);
    },
  };
}

/** Data-lake tank: translucent shell with a fill level. Returns { group, setLevel(0..1.2), fillMaterial, shellMaterial }. */
export function createTank({ r = 2.2, h = 3 } = {}) {
  const group = new THREE.Group();
  const shellMaterial = new THREE.MeshStandardMaterial({ color: '#9AA8C7', transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide });
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 24, 1, true).translate(0, h / 2, 0), shellMaterial);
  const fillMaterial = stdMat('#3B6FD8', { emissive: '#1d3f9e', emissiveIntensity: 0.4, transparent: true, opacity: 0.85 });
  const fillGeo = new THREE.CylinderGeometry(r * 0.96, r * 0.96, 1, 24).translate(0, 0.5, 0);
  const fill = new THREE.Mesh(fillGeo, fillMaterial);
  fill.scale.y = 0.001;
  const rimMat = new THREE.LineBasicMaterial({ color: '#C9D3EE', transparent: true, opacity: 0.7 });
  const rim = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(r, r, h, 24, 1, true).translate(0, h / 2, 0), 40), rimMat);
  group.add(shell, fill, rim);
  return {
    group, fillMaterial, shellMaterial, rimMaterial: rimMat,
    setLevel(v) { fill.scale.y = Math.max(0.001, Math.min(v, 1.15) * h); },
  };
}

/** Wavy wire mesh (the data fabric). Returns { lines, material }. */
export function createFabricMesh({ w = 20, d = 20, seg = 20, amp = 0.35, color = '#5ECC62' } = {}) {
  const geo = new THREE.PlaneGeometry(w, d, seg, seg).rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i += 1) p.setY(i, amp * Math.sin(p.getX(i) * 0.55) * Math.cos(p.getZ(i) * 0.6));
  const wire = new THREE.WireframeGeometry(geo);
  geo.dispose();
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.7, toneMapped: false });
  return { lines: new THREE.LineSegments(wire, material), material };
}

/** Metadata catalog disc: stacked glowing discs. Returns { group, material }. */
export function createCatalogDisc({ r = 1.6, color = '#5ECC62' } = {}) {
  const group = new THREE.Group();
  const material = stdMat(color, { emissive: color, emissiveIntensity: 0.6, transparent: true, opacity: 0.9 });
  for (let i = 0; i < 3; i += 1) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r - i * 0.28, r - i * 0.28, 0.14, 32), material);
    m.position.y = i * 0.2;
    group.add(m);
  }
  return { group, material };
}

/** Extruded shield (security). Returns a mesh with its own material. */
export function createShield({ color = '#EBAA01', size = 1 } = {}) {
  const s = new THREE.Shape();
  s.moveTo(0, 0.9); s.quadraticCurveTo(0.55, 0.85, 0.6, 0.6); s.quadraticCurveTo(0.6, 0.1, 0, -0.2);
  s.quadraticCurveTo(-0.6, 0.1, -0.6, 0.6); s.quadraticCurveTo(-0.55, 0.85, 0, 0.9);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.14, bevelEnabled: false }).translate(0, 0, -0.07).scale(size, size, size);
  return new THREE.Mesh(geo, stdMat(color, { emissive: color, emissiveIntensity: 0.6 }));
}

/** Padlock. Returns { group, setClosed(0..1), material }. */
export function createLock({ color = '#5ECC62' } = {}) {
  const group = new THREE.Group();
  const material = stdMat(color, { emissive: color, emissiveIntensity: 0.7 });
  group.add(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.25), material));
  const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.05, 8, 16, Math.PI), material);
  group.add(shackle);
  return {
    group, material,
    setClosed(t) { shackle.position.y = 0.25 + 0.22 * (1 - Math.max(0, Math.min(1, t))); },
  };
}
