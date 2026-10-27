// ALL reader-facing text of the deck lives in the content files: this file (interface text,
// Slides 1, 4, 10 and the slide order) and slides-phase2.js … slides-phase5.js (the other
// slides). Edit text there, never in the 3D code.
//
// ── Writing style (the user asked for short, very clear text) ─────────────
//   • Subtitle: one sentence.
//   • "In one line" (kind 'lead'): one or two plain sentences — what it is.
//   • "Why it matters" (kind 'why'): two or three short bullets.
//   • "How it works" (kind 'how'): three to six short numbered steps, ≤ 14 words each.
//   • "Example" (kind 'example'): one sentence.
//   • Key facts: one to three, each one or two sentences, citing a fact ID.
//   • Step captions: ≤ 22 words. Every step also gets a `flow` (shown inside the 3D view):
//       flow = { type, from: { title, sub }, to: { title, sub }, via?: { title, sub } }
//       type: 'power' | 'data' | 'command' | 'decision' | 'event' | 'govern' | 'reverse'
//       Use an array of two flows when two things move at once.
//
// ── Rules (checked by `npm run check`) ─────────────────────────────────────
//   • Every abbreviation is written "ABBR (Full Form)" on first use in each text block
//     (each paragraph, bullet, caption, card, 3D label and flow end is its own block).
//     For two-line labels and flow ends: title = the abbreviation, sub = its full form.
//   • Units and organizations (MW, AWS, IEEE …) only need expanding once per slide.
//   • "GridOS" only needs "(Grid Operating System)" on Slide 1.
//   • Diagram tags (CB-A, SW2, S3, TIE …) are not abbreviations, but need a tooltip in `tags`.
//   • Key facts cite a fact ID from facts.js; vendor-reported facts must repeat the `qualifier`.
//
// Slide shape (all fields optional except id, section, title):
//   id, section, title, subtitle, phase, scene, badge
//   blocks     text panel sections: { kind, heading, note?, paras?, items?, ordered?, keys?, tokens? }
//   keyFacts   [{ id: 'F-…', text, qualifier?, footnote? }]
//   steps      [{ id: 'step1', caption, flow }]
//   labels     { key: { title, sub? } }   two-line 3D labels
//   tags       { 'SW2': 'tooltip text' }  diagram identifiers used on the slide
//   legend     keys of `legendItems` shown in the scene legend
//   controls   wording for slide-specific controls

import { phase2 } from './slides-phase2.js';
import { phase3 } from './slides-phase3.js';
import { phase4 } from './slides-phase4.js';
import { phase5 } from './slides-phase5.js';

export const sections = [
  'Intro', 'Architecture', 'Platform', 'Distribution', 'Transmission',
  'Markets', 'Resilience', 'Real time', 'Adoption', 'Reference',
];

export const ui = {
  deckName: 'GridOS explainer',
  logoAlt: 'Mastek — Trust. Value. Velocity. — Lead with AI',
  prevSlide: 'Previous slide',
  nextSlide: 'Next slide',
  openMenu: 'All slides',
  closeMenu: 'Close',
  menuHeading: 'All slides',
  reduceMotion: 'Reduce motion',
  play: 'Play',
  pause: 'Pause',
  stepBack: 'Previous step',
  stepForward: 'Next step',
  restart: 'Restart',
  resetView: 'Reset view',
  speed: 'Speed',
  stepDot: 'Go to step {n}',
  stepCounter: 'Step {n} / {total}',
  step0: 'Press Play to watch the demo, or use the step buttons to go one action at a time.',
  badge: 'Illustrative simulation — not the real GridOS user interface',
  keyFacts: 'Key facts',
  vendorReported: 'Vendor-reported',
  factLabel: 'Fact',
  sourceLabel: 'Source',
  terms: 'Terms on this slide',
  legend: 'Colours',
  tryIt: 'Try it',
  prev: 'Previous',
  next: 'Next',
  via: 'via',
  flowTypes: {
    power: 'Power',
    data: 'Data',
    command: 'Command',
    decision: 'Decision',
    event: 'Field event',
    govern: 'Security',
    reverse: 'Reverse power',
  },
  placeholderChip: 'Phase {phase}',
  placeholderTitle: 'Coming in Phase {phase}',
  placeholderBody: 'This slide is planned for Phase {phase}.',
  noWebGLTitle: '3D view unavailable',
  noWebGLBody: 'This browser cannot run WebGL, so the 3D scene is replaced by a numbered list of the demo steps.',
  noDemo: 'This slide has no demo.',
  dragHint: 'Drag to rotate · scroll to zoom',
};

// Semantic colours (PROMPT.md 6.2). Colours are defined in src/three/palette.js.
export const legendItems = {
  flow: 'Normal power flow',
  warning: 'Heavy loading / warning',
  fault: 'Fault / violation',
  off: 'De-energized',
  reverse: 'Reverse flow from DERs (Distributed Energy Resources)',
  data: 'Data / telemetry',
  command: 'Control command',
  ai: 'AI (Artificial Intelligence) finding',
  restored: 'Restored / healthy',
};

// Flow ends reused on several slides.
const ADMS = { title: 'ADMS', sub: 'Advanced Distribution Management System' };
const SCADA = { title: 'SCADA', sub: 'Supervisory Control and Data Acquisition' };

// ─────────────────────────────────────────────────────────────────
// Slide 1 — title
// ─────────────────────────────────────────────────────────────────
const sTitle = {
  id: 'title',
  section: 'Intro',
  phase: 1,
  scene: 's01-title',
  badge: true,
  title: 'GridOS (Grid Operating System): how software runs the power grid',
  subtitle: 'An interactive guide to GE Vernova’s grid software, one application at a time.',
  blocks: [
    {
      kind: 'lead',
      heading: 'In one line',
      paras: ['GridOS (Grid Operating System) is software that watches the whole power grid, predicts problems and coordinates the right action in real time.'],
    },
    {
      kind: 'why',
      heading: 'Why it matters',
      items: [
        'Millions of new DERs (Distributed Energy Resources): rooftop solar, batteries, EVs (Electric Vehicles).',
        'More frequent extreme weather.',
        'Fast load growth, such as data centers.',
      ],
    },
    {
      kind: 'how',
      heading: 'How it works',
      ordered: true,
      items: [
        'Field devices send data up to GridOS (Grid Operating System).',
        'Applications turn the data into decisions.',
        'Commands travel back down to the field.',
      ],
    },
    {
      kind: 'usage',
      heading: 'How to use this deck',
      paras: ['Press Play, or step through one action at a time. Drag the 3D view to rotate it.'],
      keys: [
        ['← →', 'previous / next slide'],
        ['P', 'play or pause'],
        ['.  ,', 'next / previous step'],
        ['R', 'restart the demo'],
        ['☰', 'jump to any slide'],
      ],
    },
  ],
  keyFacts: [
    {
      id: 'F-NAME',
      text: 'GridOS (Grid Operating System) is GE Vernova’s product name. GE Vernova describes it as a software portfolio — a platform plus applications — for grid orchestration.',
    },
    {
      id: 'F-ORCH',
      text: 'GE Digital announced GridOS (Grid Operating System) on 6 February 2023 as the first software portfolio designed for grid orchestration.',
    },
  ],
  steps: [
    {
      id: 'step1',
      caption: 'Power is made at large plants and wind farms.',
      flow: { type: 'power', from: { title: 'Power plants', sub: 'gas and wind' }, to: { title: 'Step-up substation', sub: 'raises the voltage' } },
    },
    {
      id: 'step2',
      caption: 'Transmission lines carry it at high voltage over long distances.',
      flow: { type: 'power', from: { title: 'Step-up substation', sub: 'high voltage out' }, to: { title: 'Substation', sub: 'lowers the voltage' } },
    },
    {
      id: 'step3',
      caption: 'Distribution feeders deliver it to homes, many with solar panels, batteries and EVs (Electric Vehicles).',
      flow: { type: 'power', from: { title: 'Substation', sub: 'distribution feeder' }, to: { title: 'Homes and businesses', sub: 'some with solar and batteries' } },
    },
    {
      id: 'step4',
      caption: 'GridOS (Grid Operating System) sits above it all: data rises from the grid, commands come back down.',
      flow: [
        { type: 'data', from: { title: 'Grid devices', sub: 'substations, meters, solar' }, to: { title: 'GridOS', sub: 'Grid Operating System' } },
        { type: 'command', from: { title: 'GridOS', sub: 'Grid Operating System' }, to: { title: 'Field devices', sub: 'switches, inverters, chargers' } },
      ],
    },
  ],
  labels: {
    gridos: { title: 'GridOS', sub: 'Grid Operating System' },
    gas: { title: 'Gas power plant', sub: 'Large-scale generation' },
    wind: { title: 'Wind farm', sub: 'Renewable generation' },
    stepUp: { title: 'Step-up substation', sub: 'Raises voltage for long-distance transmission' },
    lines: { title: 'Transmission lines', sub: 'High voltage, long distance' },
    transSub: { title: 'Substation', sub: 'Lowers voltage for distribution' },
    dataCenter: { title: 'Data center', sub: 'Fast-growing new load' },
    feeder: { title: 'Distribution feeder', sub: 'Delivers power along the street' },
    homes: { title: 'Homes', sub: 'Rooftop solar, batteries and EV (Electric Vehicle) chargers' },
  },
  legend: ['flow', 'data', 'command'],
};

// ─────────────────────────────────────────────────────────────────
// Slide 4 — architecture
// ─────────────────────────────────────────────────────────────────
const sArchitecture = {
  id: 'architecture',
  section: 'Architecture',
  phase: 1,
  scene: 's04-architecture',
  badge: true,
  title: 'The seven layers of GridOS',
  subtitle: 'From field devices at the bottom to people at the top.',
  blocks: [
    {
      kind: 'lead',
      heading: 'In one line',
      paras: ['GridOS is a platform plus applications. Here it is split into seven layers, so you can see where each part sits.'],
      note: 'A teaching model built from GE Vernova’s descriptions — not an official GE Vernova diagram.',
    },
    {
      kind: 'why',
      heading: 'Why it matters',
      items: [
        'Every application needs the same trusted data and network model.',
        'Shared layers are built once and reused by every application.',
      ],
    },
    {
      kind: 'layers',
      heading: 'How it works: the layers, top to bottom',
      note: 'Click a layer here or in the 3D view.',
    },
    {
      kind: 'example',
      heading: 'Example',
      paras: ['A smart meter reports low voltage: the reading enters at L1, is secured at L2, reached at L3, placed on the network at L4, analysed at L5 and L6, and shown to an operator at L7.'],
    },
  ],
  // Rendered top (L7) to bottom (L1), like the 3D stack.
  layers: [
    { id: 'L7', name: 'Users and experience', summary: 'People and screens',
      components: ['Control-room operators', 'planners', 'field crews', 'DER (Distributed Energy Resource) and market teams', 'HMI (Human-Machine Interface) screens', 'mobile field app', 'dashboards'] },
    { id: 'L6', name: 'Packaged solutions', summary: 'Ready-made bundles',
      components: ['GridOS for Distribution', 'GridOS for Transmission'] },
    { id: 'L5', name: 'Applications', summary: 'The intelligence layer',
      components: ['GNM (Geo Network Management)', 'ADMS (Advanced Distribution Management System)', 'DERMS (Distributed Energy Resource Management System)', 'Field', 'VI (Visual Intelligence)', 'AEMS (Advanced Energy Management System)', 'DDLR (Digital Dynamic Line Rating)', 'WAMS (Wide Area Monitoring System)', 'Forecasting', 'Disruption Prepare', 'Storm Manager', 'Markets', 'partner apps'] },
    { id: 'L4', name: 'Grid twin', summary: 'One trusted network model',
      components: ['One trusted network model spanning planning and operations'] },
    { id: 'L3', name: 'Data foundation', summary: 'Data Fabric and Connect',
      components: ['GridOS Data Fabric (discover, govern, utilize)', 'GridOS Connect (integration)'] },
    { id: 'L2', name: 'Platform services', summary: 'Security and runtime',
      components: ['Zero Trust security', 'microservices and containers', 'hybrid cloud', 'Evergreen incremental updates', 'AI/ML (Artificial Intelligence / Machine Learning) services'] },
    { id: 'L1', name: 'Source systems and field data', summary: 'Where data is born',
      components: ['SCADA (Supervisory Control and Data Acquisition)', 'RTUs (Remote Terminal Units)', 'PMUs (Phasor Measurement Units)', 'AMI (Advanced Metering Infrastructure)', 'MDMS (Meter Data Management System)', 'CIS (Customer Information System)', 'ERP/EAM (Enterprise Resource Planning / Enterprise Asset Management)', 'weather, wildfire, traffic and emergency feeds', 'DER (Distributed Energy Resource) aggregators', 'drone, satellite and LiDAR (Light Detection and Ranging) imagery'] },
  ],
  keyFacts: [
    {
      id: 'F-ARCH',
      text: 'Original GridOS pillars: Zero Trust security; a federated data fabric with one transmission and distribution network model (a grid digital twin); intelligent grid applications; hybrid cloud. Launch partners included AWS (Amazon Web Services), Accenture and Infosys.',
    },
    {
      id: 'F-DF-2',
      text: 'Data Fabric uses federation and virtualization to give one view of data that stays in its own systems. It is not a data lake or warehouse.',
    },
    {
      id: 'F-ZT-1',
      text: 'Zero Trust is built in, not bolted on. An analyst report also notes containers, small “GridOS Evergreen” updates and hybrid cloud.',
    },
  ],
  steps: [
    {
      id: 'step1',
      caption: 'Start at the bottom: field devices and business systems produce the data.',
      flow: { type: 'data', from: { title: 'Field devices', sub: 'meters, sensors, business systems' }, to: { title: 'Platform', sub: 'secure intake' } },
    },
    {
      id: 'step2',
      caption: 'Platform services secure and run everything.',
      flow: { type: 'govern', from: { title: 'Zero Trust', sub: 'every request is verified' }, to: { title: 'Services', sub: 'run in containers' } },
    },
    {
      id: 'step3',
      caption: 'The Data Fabric connects to every source without copying it all.',
      flow: { type: 'data', from: { title: 'Source systems', sub: 'data stays where it is' }, to: { title: 'Data Fabric', sub: 'one governed view' } },
    },
    {
      id: 'step4',
      caption: 'The grid twin: one trusted model of the network.',
      flow: { type: 'data', from: { title: 'Data Fabric', sub: 'live readings' }, to: { title: 'Grid twin', sub: 'one network model' } },
    },
    {
      id: 'step5',
      caption: 'Applications turn data into decisions.',
      flow: { type: 'decision', from: { title: 'Grid twin', sub: 'current network state' }, to: { title: 'Applications', sub: 'decide what to do' } },
    },
    {
      id: 'step6',
      caption: 'Packaged solutions bundle applications for distribution or transmission.',
      flow: { type: 'decision', from: { title: 'Applications', sub: 'working together' }, to: { title: 'Packaged solutions', sub: 'Distribution and Transmission' } },
    },
    {
      id: 'step7',
      caption: 'People act on the results — and commands flow back down to the field.',
      flow: [
        { type: 'decision', from: { title: 'Applications', sub: 'recommend an action' }, to: { title: 'Operators', sub: 'review and approve' } },
        { type: 'command', from: { title: 'Operators', sub: 'approved action' }, to: { title: 'Field devices', sub: 'switches and controllers' } },
      ],
    },
  ],
  labels: {
    L1: { title: 'L1 · Source systems and field data', sub: 'Field devices, meters, business systems' },
    L2: { title: 'L2 · Platform services', sub: 'Security, containers, hybrid cloud, updates' },
    L3: { title: 'L3 · Data foundation', sub: 'Data Fabric and Connect' },
    L4: { title: 'L4 · Grid twin', sub: 'One trusted network model' },
    L5: { title: 'L5 · Applications', sub: 'The intelligence layer' },
    L6: { title: 'L6 · Packaged solutions', sub: 'For Distribution · For Transmission' },
    L7: { title: 'L7 · Users and experience', sub: 'Operators, planners, field crews' },
  },
  // Hover text for the small 3D objects on each layer.
  iconTips: {
    rtu: 'RTU (Remote Terminal Unit) cabinet',
    pmu: 'PMU (Phasor Measurement Unit) with GPS (Global Positioning System) antenna',
    meter: 'Smart meter, part of AMI (Advanced Metering Infrastructure)',
    satellite: 'Satellite and drone imagery feeds',
    business: 'Business systems: CIS (Customer Information System), ERP (Enterprise Resource Planning), EAM (Enterprise Asset Management)',
    weather: 'Weather, wildfire, traffic and emergency feeds',
    shield: 'Zero Trust security',
    containers: 'Microservices running in containers',
    cloud: 'Hybrid cloud: on-premises and cloud',
    evergreen: 'Evergreen incremental updates',
    aiChip: 'AI/ML (Artificial Intelligence / Machine Learning) services',
    fabric: 'GridOS Data Fabric',
    catalog: 'Metadata catalog',
    connectors: 'GridOS Connect connectors',
    twin: 'Grid twin: one trusted network model',
    apps: 'Applications such as ADMS (Advanced Distribution Management System), DERMS (Distributed Energy Resource Management System) and AEMS (Advanced Energy Management System)',
    solDist: 'GridOS for Distribution',
    solTrans: 'GridOS for Transmission',
    operators: 'Control-room operators',
    crew: 'Field crews with the mobile app',
    dashboards: 'Dashboards and HMI (Human-Machine Interface) screens',
  },
  controls: {
    explode: 'Explode layers',
    collapse: 'Collapse layers',
    detailHeading: 'Selected layer',
    detailIcons: 'Shown in 3D on this layer',
    clearSelection: 'Clear selection',
  },
  legend: ['data', 'command'],
};

// ─────────────────────────────────────────────────────────────────
// Slide 10 — FLISR demo (centrepiece)
// ─────────────────────────────────────────────────────────────────
const sFlisr = {
  id: 'adms-flisr',
  section: 'Distribution',
  phase: 1,
  scene: 's10-flisr',
  badge: true,
  title: 'Demo: FLISR (Fault Location, Isolation and Service Restoration)',
  subtitle: 'A tree falls on a line in a storm. Watch GridOS ADMS (Advanced Distribution Management System) find the fault, isolate it and restore power around it.',
  blocks: [
    {
      kind: 'lead',
      heading: 'In one line',
      paras: ['FLISR (Fault Location, Isolation and Service Restoration) is a function of GridOS ADMS (Advanced Distribution Management System). It finds a fault, cuts it off and re-feeds the healthy sections.'],
    },
    {
      kind: 'why',
      heading: 'Why it matters',
      items: [
        'One fault can black out a whole feeder, even far from the fault.',
        'Patrolling the line and switching by hand takes hours.',
      ],
    },
    {
      kind: 'how',
      heading: 'How it works',
      note: 'Standard industry logic, not GE Vernova’s internal algorithm.',
      ordered: true,
      items: [
        'A recloser trips to clear the fault.',
        'Fault indicators report which devices saw fault current.',
        'The network model finds the faulted section.',
        'Remote switches open on both sides of it.',
        'Healthy sections are re-fed — from another feeder if it has spare capacity.',
      ],
    },
    {
      kind: 'topology',
      heading: 'The demo network',
      tokens: ['Substation A', 'CB-A', 'S1', 'R1', 'S2', 'SW2', 'S3', 'SW3', 'S4', 'TIE', 'S5', 'CB-B', 'Substation B'],
      paras: ['S1 to S4 are on Feeder A, S5 is on Feeder B. Hover a tag for its meaning.'],
    },
    {
      kind: 'example',
      heading: 'Try it',
      paras: ['Move the fault to S2, S3 or S4, or load Feeder B heavily. The demo re-plans itself.'],
    },
  ],
  notes: ['Customer numbers and loadings are illustrative.'],
  keyFacts: [
    {
      id: 'F-ADMS-2',
      text: 'GE Vernova lists FLISR (Fault Location, Isolation and Service Restoration) among GridOS ADMS (Advanced Distribution Management System) functions, with VVO (Volt/VAR Optimization) and real-time monitoring and control.',
    },
    {
      id: 'F-ADMS-5',
      text: 'GridOS ADMS (Advanced Distribution Management System) uses a centralized FLISR (Fault Location, Isolation and Service Restoration) application. GE Vernova features “model-based FISR (Fault Isolation and Service Restoration)” in a customer story.',
    },
  ],
  tags: {
    'CB-A': 'CB-A: Feeder A circuit breaker at Substation A',
    'CB-B': 'CB-B: Feeder B circuit breaker at Substation B',
    R1: 'R1: recloser — a line breaker that trips on a fault and tries to re-close automatically',
    SW2: 'SW2: remote-controlled switch 2',
    SW3: 'SW3: remote-controlled switch 3',
    TIE: 'TIE: normally-open tie switch between Feeder A and Feeder B',
    S1: 'S1: line section 1, Feeder A',
    S2: 'S2: line section 2, Feeder A',
    S3: 'S3: line section 3, Feeder A',
    S4: 'S4: line section 4, Feeder A',
    S5: 'S5: line section 5, Feeder B',
  },
  // Caption and flow templates. The FLISR solver (src/sim/flisrSolver.js) picks one per step
  // and fills the {placeholders} from the topology, so every fault location gets correct text.
  flisr: {
    captions: {
      normal: 'Normal operation: Feeder A serves {feederA} customers, Feeder B serves {feederB}. The tie switch is open.',
      fault: 'A tree falls on section {fault} — a fault.',
      trip: 'The recloser R1 trips, tries to reclose, and locks out. {Secs} {outList} lose power.',
      indicators: 'Fault indicators report: {sawList} saw fault current, {notList} did not.',
      indicatorsAll: 'Fault indicators report: {sawList} all saw fault current. Beyond {lastSaw} there is only the open tie switch.',
      locate: 'The ADMS (Advanced Distribution Management System) network model locates the fault: between {up} and {down} — section {fault}.',
      isolate: 'Isolate: ADMS (Advanced Distribution Management System) sends commands to open {openList}.',
      isolatePartial: 'Isolate: {alreadyOpen} is already open, so ADMS (Advanced Distribution Management System) sends one command: open {openList}.',
      upstream: 'Restore upstream: R1 recloses. {Secs} {restoredList} {isAre} back.',
      upstreamNone: 'Restore upstream: nothing to re-close — the fault is right after R1, so R1 stays open. Section S1 never lost power.',
      capacityOk: 'Capacity check: can Feeder B carry {secs} {transferList}? It would be loaded to {pct}% — within its limit.',
      capacityPartial: 'Capacity check: Feeder B cannot carry {secsAll} {allList} ({pctAll}%), but it can carry {secs} {transferList} ({pct}%).',
      capacityFail: 'Capacity check: can Feeder B carry {secs} {transferList}? It would be loaded to {pct}% — over its limit, so no transfer.',
      capacityNone: 'Capacity check: no healthy section lies beyond the fault, so nothing needs Feeder B.',
      downstream: 'Restore downstream: ADMS (Advanced Distribution Management System) closes the tie switch. Feeder B now feeds {secs} {transferList}.',
      downstreamPartial: 'Restore downstream: ADMS (Advanced Distribution Management System) opens {extraOpen}, then closes the tie switch. Feeder B now feeds {secs} {transferList}.',
      downstreamSkip: 'Restore downstream: skipped. Feeder B has no spare capacity, so {secs} {strandedList} {stayStays} dark until the repair.',
      downstreamNone: 'Restore downstream: not needed — section {fault} is the last section before the tie switch.',
      crew: 'Only the faulted section {fault} ({faultCustomers} customers) stays off. A crew is dispatched to the exact location.',
      crewStranded: '{outCount} customers stay off: the faulted section {fault} plus {secs} {strandedList}, which Feeder B could not carry. A crew is dispatched to the exact location.',
      repair: 'After repair, switches return to the normal configuration.',
    },
    // What moves in each step (shown inside the 3D view). Same keys as `captions`.
    flows: {
      normal: { type: 'power', from: { title: 'Substation A', sub: 'Feeder A' }, to: { title: 'S1 to S4', sub: '{feederA} customers' } },
      fault: { type: 'event', from: { title: 'Tree', sub: 'falls on the line' }, to: { title: '{fault}', sub: 'faulted section' } },
      trip: { type: 'event', from: { title: 'R1', sub: 'trips and locks out' }, to: { title: '{outList}', sub: 'lose power' } },
      indicators: { type: 'data', from: { title: '{sawList}', sub: 'saw fault current' }, to: ADMS, via: SCADA },
      indicatorsAll: { type: 'data', from: { title: '{sawList}', sub: 'saw fault current' }, to: ADMS, via: SCADA },
      locate: { type: 'decision', from: ADMS, to: { title: '{fault}', sub: 'between {up} and {down}' } },
      isolate: { type: 'command', from: ADMS, to: { title: '{openList}', sub: 'open' }, via: SCADA },
      isolatePartial: { type: 'command', from: ADMS, to: { title: '{openList}', sub: 'open' }, via: SCADA },
      upstream: { type: 'command', from: ADMS, to: { title: 'R1', sub: 're-close' }, via: SCADA },
      upstreamNone: { type: 'decision', from: ADMS, to: { title: 'R1', sub: 'stays open' } },
      capacityOk: { type: 'decision', from: ADMS, to: { title: 'Feeder B', sub: '{pct}% loaded after transfer' } },
      capacityPartial: { type: 'decision', from: ADMS, to: { title: 'Feeder B', sub: '{pct}% loaded after transfer' } },
      capacityFail: { type: 'decision', from: ADMS, to: { title: 'Feeder B', sub: '{pct}% — over its limit' } },
      capacityNone: { type: 'decision', from: ADMS, to: { title: 'Feeder B', sub: 'not needed' } },
      downstream: { type: 'command', from: ADMS, to: { title: 'TIE', sub: 'close' }, via: SCADA },
      downstreamPartial: [
        { type: 'command', from: ADMS, to: { title: '{extraOpen}', sub: 'open' }, via: SCADA },
        { type: 'command', from: ADMS, to: { title: 'TIE', sub: 'close' }, via: SCADA },
      ],
      downstreamSkip: { type: 'decision', from: ADMS, to: { title: 'TIE', sub: 'stays open' } },
      downstreamNone: { type: 'decision', from: ADMS, to: { title: 'TIE', sub: 'stays open' } },
      crew: { type: 'command', from: ADMS, to: { title: 'Crew', sub: 'go to {fault}' } },
      crewStranded: { type: 'command', from: ADMS, to: { title: 'Crew', sub: 'go to {fault}' } },
      repair: { type: 'power', from: { title: 'Substation A', sub: 'Feeder A' }, to: { title: 'S1 to S4', sub: 'all sections back' } },
    },
    // Labels riding on the moving data and command packets in the 3D view.
    packets: {
      data: 'Fault current: yes',
      open: 'Open {device}',
      close: 'Close {device}',
      reclose: 'Re-close {device}',
    },
    words: {
      section: 'section',
      sections: 'sections',
      Section: 'Section',
      Sections: 'Sections',
      and: 'and',
      is: 'is',
      are: 'are',
      stays: 'stays',
      stay: 'stay',
      lockedOut: '{device} (locked out)',
      tieSwitch: 'the tie switch',
    },
    hudLabel: 'Customers without power',
    sectionCounter: '{n} customers',
    capacityLabel: 'Feeder B loading',
    capacityLimit: 'Limit',
    sldTitle: 'Live single-line diagram',
  },
  labels: {
    subA: { title: 'Substation A', sub: 'Source of Feeder A' },
    subB: { title: 'Substation B', sub: 'Source of Feeder B' },
    adms: { title: 'ADMS', sub: 'Advanced Distribution Management System' },
    crew: { title: 'Crew truck', sub: 'Sent to the faulted section' },
  },
  controls: {
    faultLabel: 'Fault location',
    faultTip: 'Choose where the tree falls. The demo re-plans itself from the topology.',
    heavyLabel: 'Feeder B heavily loaded',
    heavyTip: 'Feeder B already carries a large load, so it has little spare capacity for a transfer.',
  },
  legend: ['flow', 'warning', 'fault', 'off', 'data', 'command', 'restored'],
};

// ─────────────────────────────────────────────────────────────────
// Slide order. Slides built in later phases come from slides-phase*.js;
// any slide not built yet shows a placeholder.
// ─────────────────────────────────────────────────────────────────
const built = { ...phase2, ...phase3, ...phase4, ...phase5 };
const slot = (id, section, title, phase) => built[id] || { id, section, title, phase, placeholder: true };

export const slides = [
  sTitle,
  slot('portfolio', 'Intro', 'GE Vernova’s product portfolio and where GridOS sits', 2),
  slot('why-gridos', 'Intro', 'The problem: grid management vs grid orchestration', 2),
  sArchitecture,
  slot('data-fabric', 'Platform', 'GridOS Data Fabric and GridOS Connect', 2),
  slot('zero-trust-cloud', 'Platform', 'Zero Trust security and cloud-native runtime', 2),
  slot('distribution-overview', 'Distribution', 'GridOS for Distribution: five apps, one model', 2),
  slot('gnm', 'Distribution', 'GNM (Geo Network Management)', 2),
  slot('adms-overview', 'Distribution', 'ADMS (Advanced Distribution Management System): three systems in one', 2),
  sFlisr,
  slot('adms-vvo', 'Distribution', 'Demo: VVO (Volt/VAR Optimization)', 3),
  slot('adms-oms', 'Distribution', 'Demo: OMS (Outage Management System) on a storm night', 3),
  slot('derms-overview', 'Distribution', 'DERMS (Distributed Energy Resource Management System): eight modules', 3),
  slot('derms-demo', 'Distribution', 'Demo: too much rooftop solar on a sunny afternoon', 3),
  slot('field', 'Distribution', 'GridOS Field: digital damage assessment', 3),
  slot('visual-intelligence', 'Distribution', 'GridOS VI (Visual Intelligence): AI (Artificial Intelligence) on drone, satellite and LiDAR (Light Detection and Ranging) images', 3),
  slot('transmission-overview', 'Transmission', 'GridOS for Transmission: three tiers, four competencies', 4),
  slot('aems', 'Transmission', 'Demo: AEMS (Advanced Energy Management System) — state estimation, contingency analysis, restoration', 4),
  slot('ddlr', 'Transmission', 'Demo: DDLR (Digital Dynamic Line Rating) — interactive weather sliders', 4),
  slot('wams', 'Transmission', 'Demo: WAMS (Wide Area Monitoring System) — catching oscillations with PMUs (Phasor Measurement Units)', 4),
  slot('forecasting', 'Transmission', 'GridOS Forecasting: load and renewable forecasts', 4),
  slot('markets', 'Markets', 'GridOS Markets: clearing a day-ahead market', 4),
  slot('resilience', 'Resilience', 'Before, during, after a storm: Disruption Prepare, Outage Assist, Storm Manager', 5),
  slot('workflow-storm', 'Real time', 'Workflow A: one storm, every app working together', 5),
  slot('workflow-solar', 'Real time', 'Workflow B: a high-solar afternoon across T&D (Transmission and Distribution)', 5),
  slot('deployment', 'Adoption', 'Deployment options, adoption journey, customer examples', 5),
  slot('glossary-sources', 'Reference', 'Searchable glossary, sources and caveats', 5),
];
