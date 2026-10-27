// Tiny FLISR (Fault Location, Isolation and Service Restoration) solver for the
// Slide 10 demo topology. Pure JavaScript, no three.js, so it runs in Node too.
//
//   Substation A ─[CB-A]─ S1 ─[R1]─ S2 ─[SW2]─ S3 ─[SW3]─ S4 ─[TIE]─ S5 ─[CB-B]─ Substation B
//
// It follows standard industry FLISR logic (not GE Vernova's internal algorithm):
// trip → fault indicators → locate → isolate → restore upstream → capacity check →
// restore downstream through the tie switch → crew → repair.
// All numbers are illustrative.

export const FLISR_TOPOLOGY = {
  order: ['CB-A', 'S1', 'R1', 'S2', 'SW2', 'S3', 'SW3', 'S4', 'TIE', 'S5', 'CB-B'],
  sections: {
    S1: { feeder: 'A', customers: 600 },
    S2: { feeder: 'A', customers: 700 },
    S3: { feeder: 'A', customers: 400 },
    S4: { feeder: 'A', customers: 700 },
    S5: { feeder: 'B', customers: 900 },
  },
  devices: {
    'CB-A': { kind: 'breaker', protective: true },
    R1: { kind: 'recloser', protective: true, indicator: true },
    SW2: { kind: 'switch', indicator: true },
    SW3: { kind: 'switch', indicator: true },
    TIE: { kind: 'switch', normallyOpen: true },
    'CB-B': { kind: 'breaker', protective: true },
  },
  // Feeder B loading model (percent of its limit). Chosen so that moving S4 onto
  // Feeder B gives exactly 75 %, as in the brief: (900 + 700) customers → 75 %.
  feederB: { limitPct: 100, pctPerCustomer: 75 / 1600, heavyBasePct: 85 },
};

export const FAULT_CHOICES = ['S2', 'S3', 'S4'];

const isSection = (topo, id) => Boolean(topo.sections[id]);
const sum = (topo, list) => list.reduce((n, s) => n + topo.sections[s].customers, 0);

/** Plan every FLISR action for a fault on `fault`. */
export function solveFlisr(topo = FLISR_TOPOLOGY, { fault = 'S3', feederBHeavy = false } = {}) {
  const { order, devices } = topo;
  const at = (id) => order.indexOf(id);
  const fi = at(fault);
  const tieI = at('TIE');
  if (fi < 0 || !isSection(topo, fault) || fi > tieI) throw new Error(`Fault must be on a Feeder A section, got ${fault}`);

  const sectionsBetween = (a, b) => order.slice(a + 1, b).filter((id) => isSection(topo, id));
  const deviceBefore = (i, pred = () => true) => {
    for (let k = i - 1; k >= 0; k -= 1) if (devices[order[k]] && pred(devices[order[k]])) return k;
    return -1;
  };
  const deviceAfter = (i) => {
    for (let k = i + 1; k < order.length; k += 1) if (devices[order[k]]) return k;
    return -1;
  };

  // 1. Protection: the nearest protective device upstream of the fault trips and locks out.
  const tripI = deviceBefore(fi, (d) => d.protective);
  const trip = order[tripI];
  const outAfterTrip = sectionsBetween(tripI, tieI);

  // 2. Fault indicators between the trip device and the open tie switch.
  const indicators = order.slice(tripI, tieI).filter((id) => devices[id]?.indicator);
  const saw = indicators.filter((id) => at(id) < fi);
  const notSaw = indicators.filter((id) => at(id) > fi);

  // 3. Locate: between the last device that saw fault current and the first device after the fault.
  const upI = deviceBefore(fi);
  const downI = deviceAfter(fi);
  const up = order[upI];
  const down = order[downI];

  // 4. Isolate both sides (skip devices that are already open).
  const toOpen = [];
  const alreadyOpen = [];
  if (upI === tripI) alreadyOpen.push({ id: up, why: 'lockout' }); else toOpen.push(up);
  if (devices[down].normallyOpen) alreadyOpen.push({ id: down, why: 'normallyOpen' }); else toOpen.push(down);

  // 5. Restore upstream: re-close the tripped device if the fault is not right after it.
  const upstreamRestored = upI !== tripI ? sectionsBetween(tripI, upI) : [];
  const recloseTrip = upI !== tripI;

  // 6. Capacity check for moving the healthy downstream sections onto Feeder B.
  const fb = topo.feederB;
  const basePct = feederBHeavy ? fb.heavyBasePct : topo.sections.S5.customers * fb.pctPerCustomer;
  const pctWith = (list) => basePct + sum(topo, list) * fb.pctPerCustomer;
  const downstream = devices[down].normallyOpen ? [] : sectionsBetween(downI, tieI);

  let transfer = [];
  let extraOpen = null;
  let capacity = { kind: 'none', basePct, pct: basePct, pctAll: basePct, limitPct: fb.limitPct };
  if (downstream.length) {
    const pctAll = pctWith(downstream);
    if (pctAll <= fb.limitPct) {
      transfer = downstream;
      capacity = { kind: 'ok', basePct, pct: pctAll, pctAll, limitPct: fb.limitPct };
    } else {
      // Shrink the block from the fault side: open one more switch, keep the part next to the tie.
      for (let k = 1; k < downstream.length; k += 1) {
        const candidate = downstream.slice(k);
        if (pctWith(candidate) <= fb.limitPct) {
          transfer = candidate;
          extraOpen = order[deviceBefore(at(candidate[0]))];
          break;
        }
      }
      capacity = transfer.length
        ? { kind: 'partial', basePct, pct: pctWith(transfer), pctAll, limitPct: fb.limitPct, all: downstream }
        : { kind: 'fail', basePct, pct: pctAll, pctAll, limitPct: fb.limitPct };
    }
  }
  const stranded = downstream.filter((s) => !transfer.includes(s));

  const customers = Object.fromEntries(Object.entries(topo.sections).map(([k, v]) => [k, v.customers]));
  const outCounts = {
    afterTrip: sum(topo, outAfterTrip),
    afterUpstream: sum(topo, outAfterTrip) - sum(topo, upstreamRestored),
    final: sum(topo, [fault, ...stranded]),
  };

  return {
    fault, feederBHeavy, trip, outAfterTrip, saw, notSaw, up, down, toOpen, alreadyOpen,
    recloseTrip, upstreamRestored, downstream, transfer, extraOpen, stranded, capacity,
    customers, outCounts,
    feederA: sum(topo, Object.keys(topo.sections).filter((s) => topo.sections[s].feeder === 'A')),
    feederB: sum(topo, Object.keys(topo.sections).filter((s) => topo.sections[s].feeder === 'B')),
  };
}

// ── Captions ─────────────────────────────────────────────────────

const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
/** fill() applied to every string inside an object or array (flow templates). */
const fillDeep = (v, vars) => {
  if (typeof v === 'string') return fill(v, vars);
  if (Array.isArray(v)) return v.map((x) => fillDeep(x, vars));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fillDeep(x, vars)]));
  return v;
};
const num = (n) => Math.round(n).toLocaleString('en-US');

function joinList(list, and) {
  if (list.length <= 1) return list.join('');
  return `${list.slice(0, -1).join(', ')} ${and} ${list[list.length - 1]}`;
}

/**
 * Turn a plan into the 11 demo steps: [{ id, key, caption, flow, camera }].
 * Caption and flow wording comes from slides.js (content.flisr), never from code.
 */
export function flisrSteps(plan, content) {
  const { captions: C, flows: F = {}, words: W } = content;
  const list = (l) => joinList(l, W.and);
  const secs = (l) => (l.length === 1 ? W.section : W.sections);
  const Secs = (l) => (l.length === 1 ? W.Section : W.Sections);
  const pct = (p) => Math.round(p);

  const steps = [];
  const add = (key, vars, camera) => {
    const v = { fault: plan.fault, feederA: num(plan.feederA), feederB: num(plan.feederB), ...vars };
    steps.push({ key, caption: fill(C[key], vars), flow: F[key] ? fillDeep(F[key], v) : null, camera });
  };

  add('normal', { feederA: num(plan.feederA), feederB: num(plan.feederB) }, 'overview');
  add('fault', { fault: plan.fault }, 'fault');
  add('trip', { Secs: Secs(plan.outAfterTrip), outList: list(plan.outAfterTrip) }, 'overview');

  if (plan.notSaw.length) add('indicators', { sawList: list(plan.saw), notList: list(plan.notSaw) }, 'panel');
  else add('indicatorsAll', { sawList: list(plan.saw), lastSaw: plan.saw[plan.saw.length - 1] }, 'panel');

  add('locate', { up: plan.up, down: plan.down, fault: plan.fault }, 'panel');

  if (plan.alreadyOpen.length) {
    const a = plan.alreadyOpen[0];
    const alreadyOpen = a.why === 'lockout' ? fill(W.lockedOut, { device: a.id }) : W.tieSwitch;
    add('isolatePartial', { alreadyOpen, openList: list(plan.toOpen) }, 'fault');
  } else {
    add('isolate', { openList: list(plan.toOpen) }, 'fault');
  }

  if (plan.upstreamRestored.length) {
    const l = plan.upstreamRestored;
    add('upstream', { Secs: Secs(l), restoredList: list(l), isAre: l.length === 1 ? W.is : W.are }, 'overview');
  } else {
    add('upstreamNone', {}, 'overview');
  }

  const cap = plan.capacity;
  if (cap.kind === 'none') add('capacityNone', {}, 'tie');
  else if (cap.kind === 'ok') add('capacityOk', { secs: secs(plan.transfer), transferList: list(plan.transfer), pct: pct(cap.pct) }, 'tie');
  else if (cap.kind === 'partial') {
    add('capacityPartial', {
      secsAll: secs(cap.all), allList: list(cap.all), pctAll: pct(cap.pctAll),
      secs: secs(plan.transfer), transferList: list(plan.transfer), pct: pct(cap.pct),
    }, 'tie');
  } else add('capacityFail', { secs: secs(plan.downstream), transferList: list(plan.downstream), pct: pct(cap.pct) }, 'tie');

  if (cap.kind === 'none') add('downstreamNone', { fault: plan.fault }, 'tie');
  else if (cap.kind === 'fail') {
    const l = plan.stranded;
    add('downstreamSkip', { secs: secs(l), strandedList: list(l), stayStays: l.length === 1 ? W.stays : W.stay }, 'tie');
  } else if (plan.extraOpen) {
    add('downstreamPartial', { extraOpen: plan.extraOpen, secs: secs(plan.transfer), transferList: list(plan.transfer) }, 'tie');
  } else {
    add('downstream', { secs: secs(plan.transfer), transferList: list(plan.transfer) }, 'tie');
  }

  if (plan.stranded.length) {
    add('crewStranded', {
      outCount: num(plan.outCounts.final), fault: plan.fault,
      secs: secs(plan.stranded), strandedList: list(plan.stranded),
    }, 'crew');
  } else {
    add('crew', { fault: plan.fault, faultCustomers: num(plan.customers[plan.fault]) }, 'crew');
  }

  add('repair', {}, 'overview');
  return steps.map((s, i) => ({ id: `step${i + 1}`, ...s }));
}
