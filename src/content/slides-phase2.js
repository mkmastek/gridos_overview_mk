// Phase 2 slide content: Slides 2, 3, 5, 6, 7, 8, 9.
// Same rules and shape as slides.js (see the header there): short, clear text; every
// abbreviation expanded on first use in each block; every step has a `flow`.
// Export: an object keyed by slide id. Slides listed here replace the placeholders in slides.js.

const ADMS = { title: 'ADMS', sub: 'Advanced Distribution Management System' };
const DERMS = { title: 'DERMS', sub: 'Distributed Energy Resource Management System' };
const GNM = { title: 'GNM', sub: 'Geo Network Management' };
const SCADA = { title: 'SCADA', sub: 'Supervisory Control and Data Acquisition' };
const MTLS = { title: 'mTLS', sub: 'mutual Transport Layer Security' };

// ─────────────────────────────────────────────────────────────────
// Slide 2 — GE Vernova portfolio
// ─────────────────────────────────────────────────────────────────
const portfolio = {
  id: 'portfolio',
  section: 'Intro',
  phase: 2,
  scene: 's02-portfolio',
  badge: true,
  title: 'GE Vernova’s product portfolio and where GridOS sits',
  subtitle: 'Three businesses make, move and control electricity. GridOS is their software.',
  blocks: [
    {
      kind: 'lead',
      heading: 'In one line',
      paras: ['GE Vernova has three businesses: Power makes electricity, Wind makes renewable electricity, and Electrification moves and controls it. GridOS is part of Electrification Software.'],
    },
    {
      kind: 'how',
      heading: 'Power',
      items: [
        'Gas turbines: HA (Air-cooled H-class), F class and aeroderivative.',
        'Nuclear: the BWRX-300 (Boiling Water Reactor, 300 MW class) SMR (Small Modular Reactor) with GE Hitachi.',
        'Hydro, pumped storage, steam turbines and services.',
      ],
      note: 'Product family overview.',
    },
    {
      kind: 'how',
      heading: 'Wind',
      items: [
        'Onshore turbines and the Haliade-X offshore turbine.',
        'LM Wind Power blades. Used for wind farms and repowering.',
      ],
      note: 'Product family overview.',
    },
    {
      kind: 'how',
      heading: 'Electrification',
      items: [
        'GIS (Gas-Insulated Switchgear) from 50 to 800 kV (kilovolt), including SF6 (sulphur hexafluoride)-free g3 (green gas for grid) versions.',
        'Circuit breakers, transformers (Prolec GE), HVDC (High Voltage Direct Current) and FACTS (Flexible AC Transmission Systems).',
        'Protection relays, substation automation, power conversion and BESS (Battery Energy Storage Systems).',
        'Electrification Software: GridOS, APM (Asset Performance Management), Smallworld GIS (Geographic Information System).',
      ],
    },
    {
      kind: 'note',
      heading: 'Watch out',
      paras: ['GIS (Gas-Insulated Switchgear) is hardware. GIS (Geographic Information System) is mapping software. Same letters, two meanings.'],
    },
  ],
  keyFacts: [
    {
      id: 'F-PORT-1',
      text: 'Three segments: Power, Wind and Electrification. Electrification covers grid solutions, power conversion, electrification software, and solar and storage.',
    },
    {
      id: 'F-PORT-2',
      text: 'Grid Solutions hardware includes HVDC (High Voltage Direct Current), the FACTSFLEX STATCOM (Static Synchronous Compensator), synchronous condensers and GIS (Gas-Insulated Switchgear) from 50 to 800 kV (kilovolt).',
    },
    {
      id: 'F-PORT-3',
      text: 'Prolec GE (transformers) became fully owned by GE Vernova on 2 February 2026.',
    },
    {
      id: 'F-PORT-4',
      text: 'GE Vernova sold its Proficy manufacturing software to TPG (TPG Inc., formerly Texas Pacific Group) in March 2026. It calls GridOS “its enterprise software and AI (Artificial Intelligence) platform for grid orchestration.”',
    },
  ],
  steps: [
    {
      id: 'step1',
      caption: 'Power: equipment that makes electricity, plus services.',
      flow: { type: 'power', from: { title: 'Power', sub: 'gas, nuclear, hydro, steam' }, to: { title: 'The grid', sub: 'electricity in' } },
    },
    {
      id: 'step2',
      caption: 'Wind: onshore and offshore turbines.',
      flow: { type: 'power', from: { title: 'Wind', sub: 'onshore and offshore' }, to: { title: 'The grid', sub: 'renewable electricity' } },
    },
    {
      id: 'step3',
      caption: 'Electrification: the equipment that moves and controls power — switchgear, transformers, HVDC (High Voltage Direct Current), FACTS (Flexible AC Transmission Systems).',
      flow: { type: 'power', from: { title: 'Electrification', sub: 'switchgear, transformers, converters' }, to: { title: 'Cities and industry', sub: 'power delivered' } },
    },
    {
      id: 'step4',
      caption: 'Electrification Software: GridOS sits here and connects to the equipment of all three businesses through data.',
      flow: { type: 'data', from: { title: 'All three businesses', sub: 'equipment data' }, to: { title: 'GridOS', sub: 'Electrification Software' } },
    },
  ],
  labels: {
    power: { title: 'Power', sub: 'Generation equipment and services' },
    wind: { title: 'Wind', sub: 'Onshore and offshore' },
    electrification: { title: 'Electrification', sub: 'Moves and controls power' },
    gridos: { title: 'GridOS', sub: 'Electrification Software' },
    gas: { title: 'Gas turbines' },
    smr: { title: 'SMR', sub: 'Small Modular Reactor' },
    hydro: { title: 'Hydro' },
    onshore: { title: 'Onshore wind' },
    offshore: { title: 'Offshore wind', sub: 'Haliade-X' },
    gis: { title: 'GIS', sub: 'Gas-Insulated Switchgear' },
    hvdc: { title: 'HVDC', sub: 'High Voltage Direct Current' },
    statcom: { title: 'STATCOM', sub: 'Static Synchronous Compensator' },
  },
  // Hover text for each product in the 3D view.
  productTips: {
    gas: 'Gas turbines: HA (Air-cooled H-class), F class and aeroderivative. Baseload and peaking power.',
    smr: 'BWRX-300 (Boiling Water Reactor, 300 MW class) SMR (Small Modular Reactor) with GE Hitachi.',
    hydro: 'Hydro and pumped storage. Helps firm up renewables.',
    steam: 'Steam turbines and services.',
    onshore: 'Onshore wind turbines with LM Wind Power blades.',
    offshore: 'Haliade-X offshore wind turbine.',
    gis: 'GIS (Gas-Insulated Switchgear) from 50 to 800 kV (kilovolt), including SF6 (sulphur hexafluoride)-free g3 (green gas for grid) versions.',
    breaker: 'AIS (Air-Insulated Switchgear) and circuit breakers.',
    transformer: 'Power transformers, including Prolec GE.',
    hvdc: 'HVDC (High Voltage Direct Current) converter station for long-distance links.',
    statcom: 'FACTS (Flexible AC Transmission Systems) such as the FACTSFLEX STATCOM (Static Synchronous Compensator).',
    relay: 'Protection relays and substation automation.',
    condenser: 'Synchronous condenser: spinning machine that steadies grid voltage.',
    bess: 'Power conversion and BESS (Battery Energy Storage Systems).',
    gridos: 'Electrification Software: GridOS, APM (Asset Performance Management) and Smallworld GIS (Geographic Information System).',
  },
  packets: { data: 'Equipment data' },
  legend: ['flow', 'data'],
};

// ─────────────────────────────────────────────────────────────────
// Slide 3 — the problem: management vs orchestration
// ─────────────────────────────────────────────────────────────────
const whyGridos = {
  id: 'why-gridos',
  section: 'Intro',
  phase: 2,
  scene: 's03-why-gridos',
  badge: true,
  title: 'The problem: grid management vs grid orchestration',
  subtitle: 'Five separate systems hold five versions of the truth. Orchestration gives them one.',
  blocks: [
    {
      kind: 'lead',
      heading: 'In one line',
      paras: ['Grid orchestration means many systems sharing one trusted network model and one governed data layer, so every application decides from the same picture.'],
    },
    {
      kind: 'why',
      heading: 'The problem today',
      items: [
        'Utilities run separate systems from different vendors: SCADA (Supervisory Control and Data Acquisition), GIS (Geographic Information System), OMS (Outage Management System), DMS (Distribution Management System) and EMS (Energy Management System).',
        'Each keeps its own copy of the network, linked by fragile point-to-point interfaces.',
        'Millions of new DERs (Distributed Energy Resources), extreme weather and fast load growth make this harder every year.',
      ],
    },
    {
      kind: 'how',
      heading: 'How orchestration fixes it',
      ordered: true,
      items: [
        'Connect every system to one governed data layer.',
        'Keep one trusted network model.',
        'Every application reads and writes that same model.',
        'A change in the field is then seen everywhere at once.',
      ],
    },
    {
      kind: 'example',
      heading: 'Example',
      paras: ['A crew closes a switch. In separate systems only the OMS (Outage Management System) knows; with orchestration every application sees it at once.'],
    },
  ],
  keyFacts: [
    {
      id: 'F-ORCH',
      text: 'GE Digital announced GridOS on 6 February 2023 as the first software portfolio for grid orchestration, described as “a system-of-systems servicing actionable data and analytics.”',
    },
  ],
  steps: [
    {
      id: 'step1',
      caption: 'Before: five systems, five versions of the truth.',
      flow: { type: 'data', from: { title: 'Five systems', sub: 'each with its own network copy' }, to: { title: 'Point-to-point links', sub: 'fragile interfaces' } },
    },
    {
      id: 'step2',
      caption: 'A change in the field updates only one system; the others are now wrong.',
      flow: { type: 'event', from: { title: 'Field change', sub: 'a switch is closed' }, to: { title: 'OMS', sub: 'Outage Management System' } },
    },
    {
      id: 'step3',
      caption: 'After: all applications read and write one shared model through the Data Fabric.',
      flow: { type: 'data', from: { title: 'All five applications', sub: 'read and write' }, to: { title: 'Shared model', sub: 'through the Data Fabric' } },
    },
    {
      id: 'step4',
      caption: 'Now a change in the field is seen by every application at once.',
      flow: [
        { type: 'event', from: { title: 'Field change', sub: 'a switch is opened' }, to: { title: 'Shared model', sub: 'updated once' } },
        { type: 'data', from: { title: 'Shared model', sub: 'updated once' }, to: { title: 'All applications', sub: 'see it at once' } },
      ],
    },
  ],
  labels: {
    scada: { title: 'SCADA', sub: 'Supervisory Control and Data Acquisition' },
    gis: { title: 'GIS', sub: 'Geographic Information System' },
    oms: { title: 'OMS', sub: 'Outage Management System' },
    dms: { title: 'DMS', sub: 'Distribution Management System' },
    ems: { title: 'EMS', sub: 'Energy Management System' },
    shared: { title: 'Shared network model + Data Fabric', sub: 'one trusted picture' },
    field: { title: 'Field switch', sub: 'changes state' },
  },
  packets: { change: 'Switch closed', change2: 'Switch opened', sync: 'Same update' },
  legend: ['data', 'fault', 'restored'],
};

// ─────────────────────────────────────────────────────────────────
// Slide 5 — Data Fabric and Connect
// ─────────────────────────────────────────────────────────────────
const SOURCE_NAMES = {
  scada: 'SCADA (Supervisory Control and Data Acquisition) measurements',
  ami: 'AMI/MDMS (Advanced Metering Infrastructure / Meter Data Management System) meter data',
  cis: 'CIS (Customer Information System) customer accounts',
  gis: 'GIS (Geographic Information System) network model',
  erp: 'ERP/EAM (Enterprise Resource Planning / Enterprise Asset Management) asset records',
  weather: 'Weather forecasts',
  wildfire: 'Wildfire feed',
  der: 'DER (Distributed Energy Resource) aggregator data',
};

const dataFabric = {
  id: 'data-fabric',
  section: 'Platform',
  phase: 2,
  scene: 's05-data-fabric',
  badge: true,
  title: 'GridOS Data Fabric and GridOS Connect',
  subtitle: 'One governed view of grid data — without copying it all into one place.',
  blocks: [
    {
      kind: 'lead',
      heading: 'In one line',
      paras: ['GridOS Data Fabric is a grid-specific data fabric: data stays in its system of record, and the fabric reaches it on demand to give one unified view.'],
    },
    {
      kind: 'why',
      heading: 'Why it matters',
      items: [
        'Copying everything into one store is slow, costly and soon out of date.',
        'Grid apps need OT (Operational Technology), IT (Information Technology) and outside data such as weather, wildfire and traffic together.',
      ],
    },
    {
      kind: 'how',
      heading: 'How it works',
      ordered: true,
      items: [
        'Connect: GridOS Connect plugs into each system with prebuilt connectors.',
        'Discover: metadata from every source goes into one catalog.',
        'Govern: the catalog adds context — what the data means, where it sits on the network.',
        'Utilize: an application asks a question; only the needed data is fetched, live.',
      ],
    },
    {
      kind: 'usecase',
      heading: 'Use cases',
      items: [
        'T&D (Transmission and Distribution) integration.',
        'Avoiding DER (Distributed Energy Resource) backfeed violations.',
        'Training data for AI/ML (Artificial Intelligence / Machine Learning).',
        'Pinpointing outages from voltage, meter and location data.',
      ],
    },
    {
      kind: 'example',
      heading: 'Try it',
      paras: ['Pick a question under the 3D view: only the systems that hold the answer light up.'],
    },
  ],
  keyFacts: [
    {
      id: 'F-DF-1',
      text: 'GridOS Data Fabric launched in February 2024 as the first grid-specific data fabric.',
    },
    {
      id: 'F-DF-2',
      text: 'It uses federation to reach scattered data and virtualization to give one view. It is not a central database, data lake or warehouse.',
    },
    {
      id: 'F-CONN-1',
      text: 'GridOS Connect builds on Utilihive from Greenbird (acquired August 2023), a cloud-native iPaaS (Integration Platform as a Service) used by more than 230 utilities (as of 2023).',
    },
  ],
  steps: [
    {
      id: 'step1',
      caption: 'Utility data lives in many separate systems.',
      flow: { type: 'data', from: { title: 'Eight systems', sub: 'each holds its own data' }, to: { title: 'Applications', sub: 'need all of it' } },
    },
    {
      id: 'step2',
      caption: 'The old way copies everything into one central store — slow, costly and soon out of date.',
      flow: { type: 'data', from: { title: 'Full copies', sub: 'every record' }, to: { title: 'Central data lake', sub: 'overflows and goes stale' } },
    },
    {
      id: 'step3',
      caption: 'GridOS Connect plugs into each system with prebuilt connectors.',
      flow: { type: 'govern', from: { title: 'GridOS Connect', sub: 'prebuilt connectors' }, to: { title: 'Eight systems', sub: 'data flows monitored' } },
    },
    {
      id: 'step4',
      caption: 'Discover: metadata from each source is registered in one catalog.',
      flow: { type: 'data', from: { title: 'Each system', sub: 'metadata only' }, to: { title: 'Metadata catalog', sub: 'what exists and where' } },
    },
    {
      id: 'step5',
      caption: 'Govern: the catalog adds context — what the data means and where it belongs on the network.',
      flow: { type: 'govern', from: { title: 'Metadata catalog', sub: 'adds meaning' }, to: { title: 'Network model', sub: 'where it belongs' } },
    },
    {
      id: 'step6',
      caption: 'Utilize: an application asks a question; only the needed data is fetched, live, into one view.',
      flow: [
        { type: 'decision', from: { title: 'Application', sub: 'asks a question' }, to: { title: 'Data Fabric', sub: 'finds the right sources' } },
        { type: 'data', from: { title: 'Data Fabric', sub: 'fetches live' }, to: { title: 'One virtual table', sub: 'the answer' } },
      ],
    },
  ],
  labels: {
    scada: { title: 'SCADA', sub: 'Supervisory Control and Data Acquisition' },
    ami: { title: 'AMI/MDMS', sub: 'Advanced Metering Infrastructure / Meter Data Management System' },
    cis: { title: 'CIS', sub: 'Customer Information System' },
    gis: { title: 'GIS', sub: 'Geographic Information System' },
    erp: { title: 'ERP/EAM', sub: 'Enterprise Resource Planning / Enterprise Asset Management' },
    weather: { title: 'Weather', sub: 'forecasts and actuals' },
    wildfire: { title: 'Wildfire feed', sub: 'fire risk' },
    der: { title: 'DER', sub: 'Distributed Energy Resource aggregator' },
    lake: { title: 'Central data lake', sub: 'the old way' },
    fabric: { title: 'Data Fabric', sub: 'federation, not copies' },
    catalog: { title: 'Metadata catalog', sub: 'discover and govern' },
    app: { title: 'Application', sub: 'asks a question' },
    table: { title: 'One virtual table', sub: 'live answer' },
  },
  packets: { copy: 'Full copy', meta: 'Metadata', ask: 'Query', answer: 'Answer' },
  queries: [
    {
      value: 'outage',
      label: 'Which customers on feeder F12 lost voltage?',
      sources: ['ami', 'gis', 'cis'],
      answer: 'Meter messages, the network model and customer accounts are combined live.',
    },
    {
      value: 'backfeed',
      label: 'Where could rooftop solar backfeed tomorrow?',
      sources: ['der', 'scada', 'weather'],
      answer: 'DER (Distributed Energy Resource) output, feeder measurements and the solar forecast are combined.',
    },
    {
      value: 'storm',
      label: 'Which assets are exposed to tonight’s storm?',
      sources: ['weather', 'wildfire', 'erp', 'gis'],
      answer: 'Weather and fire feeds are laid over asset records and the network map.',
    },
  ],
  sourceNames: SOURCE_NAMES,
  controls: {
    askLabel: 'Ask a question',
    askPlaceholder: 'Choose a question…',
    askTip: 'Each question reaches only the systems that hold the answer.',
    sourcesHeading: 'Systems asked',
  },
  legend: ['data', 'command', 'fault', 'restored'],
};

// ─────────────────────────────────────────────────────────────────
// Slide 6 — Zero Trust and cloud-native runtime
// ─────────────────────────────────────────────────────────────────
const zeroTrust = {
  id: 'zero-trust-cloud',
  section: 'Platform',
  phase: 2,
  scene: 's06-zero-trust-cloud',
  badge: true,
  title: 'Zero Trust security and cloud-native runtime',
  subtitle: 'Every service proves who it is, runs in a container, and updates without downtime.',
  blocks: [
    {
      kind: 'lead',
      heading: 'In one line',
      paras: ['GridOS is secured by Zero Trust (never trust, always verify) and runs as small services in containers — on-premises, in the cloud, or both.'],
    },
    {
      kind: 'why',
      heading: 'Why it matters',
      items: [
        'Grid software controls critical infrastructure: one stolen password must not open everything.',
        'Big version upgrades are risky; small updates keep the software running.',
      ],
    },
    {
      kind: 'how',
      heading: 'How it works',
      ordered: true,
      items: [
        'Zero Trust: every user, service and device proves who it is, on every request.',
        'mTLS (mutual Transport Layer Security): both sides show a certificate before talking.',
        'Microservices: many small, independent services in containers.',
        'Hybrid cloud: real-time control on-premises, other apps in the cloud.',
        'Evergreen: services update one at a time, so nothing stops.',
      ],
    },
    {
      kind: 'example',
      heading: 'Example',
      paras: ['Norway’s One Grid Operation plans ADMS (Advanced Distribution Management System) on-premises and its other GridOS applications in AWS (Amazon Web Services).'],
    },
  ],
  keyFacts: [
    {
      id: 'F-ZT-1',
      text: 'Zero Trust is built in, not bolted on. An analyst report notes containers, “GridOS Evergreen” small updates instead of big releases, and hybrid cloud.',
    },
    {
      id: 'F-TECH-1',
      text: '(from GE Vernova job postings) DERMS (Distributed Energy Resource Management System) delivery uses Kubernetes microservices; listed technologies include Docker, Rancher RKE2 (Rancher Kubernetes Engine 2), TLS/mTLS (Transport Layer Security / mutual TLS) and PKI (Public Key Infrastructure).',
    },
    {
      id: 'F-DEP-1',
      text: 'One Grid Operation (Norway) plans a three-year rollout: ADMS (Advanced Distribution Management System) on-premises, other GridOS applications in AWS (Amazon Web Services).',
    },
  ],
  steps: [
    {
      id: 'step1',
      caption: 'Applications run as many small services in containers.',
      flow: { type: 'govern', from: { title: 'Container platform', sub: 'schedules services' }, to: { title: 'Containers', sub: 'small independent services' } },
    },
    {
      id: 'step2',
      caption: 'Before two services talk, both show certificates — mTLS (mutual Transport Layer Security).',
      flow: { type: 'govern', from: { title: 'Service A', sub: 'shows its certificate' }, to: { title: 'Service B', sub: 'shows its certificate' }, via: MTLS },
    },
    {
      id: 'step3',
      caption: 'A device without a valid identity is blocked, even inside the network.',
      flow: { type: 'event', from: { title: 'Unknown device', sub: 'no certificate' }, to: { title: 'Blocked', sub: 'request refused' } },
    },
    {
      id: 'step4',
      caption: 'Real-time ADMS (Advanced Distribution Management System) stays on-premises; other apps run in the cloud — a hybrid deployment.',
      flow: { type: 'data', from: { title: 'On-premises', sub: 'real-time control' }, to: { title: 'Cloud', sub: 'other GridOS apps' }, via: MTLS },
    },
    {
      id: 'step5',
      caption: 'Evergreen: services update one at a time, so the grid software never stops.',
      flow: { type: 'govern', from: { title: 'Version 2', sub: 'one service at a time' }, to: { title: 'Running services', sub: 'no downtime' } },
    },
  ],
  labels: {
    onPrem: { title: 'On-premises', sub: 'control center' },
    cloud: { title: 'Cloud', sub: 'hybrid deployment' },
    adms: { title: 'ADMS', sub: 'Advanced Distribution Management System' },
    apps: { title: 'Other GridOS apps', sub: 'running in the cloud' },
    svcA: { title: 'Service A', sub: 'certificate checked' },
    svcB: { title: 'Service B', sub: 'certificate checked' },
    unknown: { title: 'Unknown device', sub: 'no certificate' },
  },
  packets: { cert: 'Certificate', link: 'Encrypted data', update: 'Version 2' },
  legend: ['data', 'fault', 'restored'],
};

// ─────────────────────────────────────────────────────────────────
// Slide 7 — GridOS for Distribution overview
// ─────────────────────────────────────────────────────────────────
const distributionOverview = {
  id: 'distribution-overview',
  section: 'Distribution',
  phase: 2,
  scene: 's07-distribution-overview',
  badge: true,
  title: 'GridOS for Distribution: five apps, one model',
  subtitle: 'Five applications on one governed data foundation, GridOS Data Fabric.',
  blocks: [
    {
      kind: 'lead',
      heading: 'In one line',
      paras: ['GridOS for Distribution (launched February 2026) brings five applications onto one data foundation, so planners, operators and field crews work from the same view.'],
    },
    {
      kind: 'how',
      heading: 'The five applications',
      items: [
        'Smallworld GNM (Geo Network Management): the detailed network model.',
        'GridOS ADMS (Advanced Distribution Management System): runs the feeders in real time.',
        'GridOS DERMS (Distributed Energy Resource Management System): steers solar, batteries and EVs (Electric Vehicles).',
        'GridOS Field: crews capture verified damage data.',
        'GridOS VI (Visual Intelligence): AI (Artificial Intelligence) on drone and satellite images.',
      ],
    },
    {
      kind: 'how',
      heading: 'Adoption journey',
      ordered: true,
      items: [
        'Essentials',
        'Disruption Management',
        'Distribution Optimization',
        'DER (Distributed Energy Resource) Orchestration',
        'Distribution Intelligence',
      ],
    },
  ],
  keyFacts: [
    {
      id: 'F-G4D-1',
      text: 'Launched February 2026: Smallworld GNM (Geo Network Management), GridOS ADMS (Advanced Distribution Management System), GridOS DERMS (Distributed Energy Resource Management System), GridOS Field and GridOS VI (Visual Intelligence) on GridOS Data Fabric.',
    },
    {
      id: 'F-G4D-2',
      text: 'The applications share one network model exchange and one governed data layer.',
    },
    {
      id: 'F-G4D-4',
      text: 'Alabama Power avoided more than 112 million CMI (Customer Minutes of Interruption) in 2025.',
      qualifier: 'GE Vernova customer claim',
    },
  ],
  steps: [
    {
      id: 'step1',
      caption: 'Smallworld GNM (Geo Network Management) keeps the detailed network model.',
      flow: { type: 'data', from: GNM, to: { title: 'Network model', sub: 'shared by all five apps' } },
    },
    {
      id: 'step2',
      caption: 'GridOS ADMS (Advanced Distribution Management System) monitors and controls the feeders in real time.',
      flow: { type: 'command', from: ADMS, to: { title: 'Substation and feeders', sub: 'switching and control' }, via: SCADA },
    },
    {
      id: 'step3',
      caption: 'GridOS DERMS (Distributed Energy Resource Management System) forecasts and steers solar, batteries and EVs (Electric Vehicles).',
      flow: { type: 'command', from: DERMS, to: { title: 'Solar homes', sub: 'limits and schedules' } },
    },
    {
      id: 'step4',
      caption: 'GridOS Field gives crews the latest map and sends verified damage data back.',
      flow: { type: 'data', from: { title: 'Field crew', sub: 'verified damage' }, to: { title: 'Data Fabric', sub: 'shared with all apps' } },
    },
    {
      id: 'step5',
      caption: 'GridOS VI (Visual Intelligence) turns drone and satellite images into findings on the map.',
      flow: { type: 'decision', from: { title: 'VI', sub: 'Visual Intelligence' }, to: { title: 'Network map', sub: 'trees and asset defects' } },
    },
    {
      id: 'step6',
      caption: 'Adoption is staged: start with Essentials, then add capabilities step by step.',
      flow: { type: 'decision', from: { title: 'Essentials', sub: 'step 1' }, to: { title: 'Distribution Intelligence', sub: 'step 5' } },
    },
  ],
  labels: {
    fabric: { title: 'Data Fabric', sub: 'one governed data foundation' },
    gnm: GNM,
    adms: ADMS,
    derms: DERMS,
    field: { title: 'Field', sub: 'GridOS Field' },
    vi: { title: 'VI', sub: 'Visual Intelligence' },
    j1: { title: '1 · Essentials' },
    j2: { title: '2 · Disruption Management' },
    j3: { title: '3 · Distribution Optimization' },
    j4: { title: '4 · DER', sub: 'Distributed Energy Resource Orchestration' },
    j5: { title: '5 · Distribution Intelligence' },
  },
  packets: { gnm: 'Network model', adms: 'Switch command', derms: 'Export limit', field: 'Damage report', vi: 'Tree risk' },
  legend: ['flow', 'data', 'command', 'ai'],
};

// ─────────────────────────────────────────────────────────────────
// Slide 8 — GNM
// ─────────────────────────────────────────────────────────────────
const gnm = {
  id: 'gnm',
  section: 'Distribution',
  phase: 2,
  scene: 's08-gnm',
  badge: true,
  title: 'GNM (Geo Network Management)',
  subtitle: 'The detailed, connected map of the network that every other app relies on.',
  blocks: [
    {
      kind: 'lead',
      heading: 'In one line',
      paras: ['Smallworld GNM (Geo Network Management) builds a detailed, connected digital model of a utility network — electric, gas, water or telecom.'],
    },
    {
      kind: 'why',
      heading: 'Why it matters',
      items: [
        'Every operational app needs an accurate map of what connects to what.',
        'Errors in the map become wrong decisions in the control room.',
      ],
    },
    {
      kind: 'how',
      heading: 'How it works',
      note: 'Generic GIS (Geographic Information System) concepts, not GE Vernova-specific detail.',
      ordered: true,
      items: [
        'Assets are placed on the map with their attributes.',
        'Connectivity links each asset to the next, forming the network topology.',
        'Quality rules catch errors, such as a cable connected to nothing.',
        'The connected model is published to ADMS (Advanced Distribution Management System) and DERMS (Distributed Energy Resource Management System).',
      ],
    },
    {
      kind: 'example',
      heading: 'Example',
      paras: ['A new housing estate is built: designers add poles, cables and a transformer in GNM (Geo Network Management). Once commissioned, ADMS (Advanced Distribution Management System) can operate the new feeder.'],
    },
  ],
  keyFacts: [
    {
      id: 'F-GNM-1',
      text: 'Smallworld GNM (Geo Network Management) gives an enterprise-wide network view, enforces data quality and supports a fully connected network model.',
    },
  ],
  steps: [
    {
      id: 'step1',
      caption: 'Assets are placed on the map with their attributes.',
      flow: { type: 'data', from: { title: 'Designer', sub: 'new poles, cables, transformer' }, to: GNM },
    },
    {
      id: 'step2',
      caption: 'Connectivity tracing follows the network from the substation outward.',
      flow: { type: 'decision', from: { title: 'Substation', sub: 'trace starts here' }, to: { title: 'Connected assets', sub: 'lit one by one' } },
    },
    {
      id: 'step3',
      caption: 'A data-quality rule finds a cable that is not connected.',
      flow: { type: 'event', from: { title: 'Quality rule', sub: 'checks every link' }, to: { title: 'Disconnected segment', sub: 'flagged' } },
    },
    {
      id: 'step4',
      caption: 'Once fixed, the full connected model is complete.',
      flow: { type: 'decision', from: { title: 'Fixed segment', sub: 'snapped to the pole' }, to: { title: 'Connected model', sub: 'trace completes' } },
    },
    {
      id: 'step5',
      caption: 'The model is published to ADMS (Advanced Distribution Management System) and other apps as the operational network model.',
      flow: { type: 'data', from: GNM, to: ADMS },
    },
  ],
  labels: {
    gnm: GNM,
    substation: { title: 'Substation', sub: 'trace starts here' },
    transformer: { title: 'Transformer', sub: 'serves the new estate' },
    gap: { title: 'Disconnected segment', sub: 'quality rule failed' },
    adms: ADMS,
    model: { title: 'Network model', sub: 'published' },
  },
  packets: { publish: 'Network model' },
  legend: ['data', 'fault', 'restored', 'ai'],
};

// ─────────────────────────────────────────────────────────────────
// Slide 9 — ADMS overview
// ─────────────────────────────────────────────────────────────────
const admsOverview = {
  id: 'adms-overview',
  section: 'Distribution',
  phase: 2,
  scene: 's09-adms-overview',
  badge: true,
  title: 'ADMS (Advanced Distribution Management System): three systems in one',
  subtitle: 'One control room, one network model, three jobs.',
  blocks: [
    {
      kind: 'lead',
      heading: 'In one line',
      paras: ['GridOS ADMS (Advanced Distribution Management System) combines DMS (Distribution Management System), OMS (Outage Management System) and built-in DERMS (Distributed Energy Resource Management System) capabilities.'],
    },
    {
      kind: 'why',
      heading: 'Why it matters',
      items: [
        'It improves SAIDI (System Average Interruption Duration Index), SAIFI (System Average Interruption Frequency Index) and CMI (Customer Minutes of Interruption).',
        'Monitoring, outages and DERs (Distributed Energy Resources) share one network model.',
      ],
    },
    {
      kind: 'how',
      heading: 'The three parts',
      items: [
        'DMS (Distribution Management System): monitoring and control, FLISR (Fault Location, Isolation and Service Restoration), VVO (Volt/VAR Optimization), AI/ML (Artificial Intelligence / Machine Learning) load prediction, congestion management.',
        'OMS (Outage Management System): planned and unplanned outages, field mobility, damage assessment, predictive analytics.',
        'DERMS (Distributed Energy Resource Management System): built-in DER (Distributed Energy Resource) lifecycle capabilities.',
      ],
    },
    {
      kind: 'example',
      heading: 'Next',
      paras: ['The next slides show FLISR (Fault Location, Isolation and Service Restoration), VVO (Volt/VAR Optimization) and OMS (Outage Management System) in action.'],
    },
  ],
  keyFacts: [
    {
      id: 'F-ADMS-1',
      text: 'Three solutions in one: DMS (Distribution Management System), OMS (Outage Management System) and built-in DERMS (Distributed Energy Resource Management System) capabilities.',
    },
    {
      id: 'F-ADMS-3',
      text: 'OMS (Outage Management System) improves restoration, crew dispatch and customer communication, and improves SAIDI (System Average Interruption Duration Index), SAIFI (System Average Interruption Frequency Index) and CMI (Customer Minutes of Interruption).',
    },
    {
      id: 'F-ADMS-4',
      text: 'A US (United States) utility avoided over 150 million CMI (Customer Minutes of Interruption) a year. A US utility avoided over $175 million of ICE (Interruption Cost Estimate) in one year.',
      qualifier: 'GE Vernova customer claims, individual utilities',
    },
  ],
  steps: [
    {
      id: 'step1',
      caption: 'DMS (Distribution Management System) shows every feeder’s live state.',
      flow: { type: 'data', from: { title: 'Feeders', sub: 'live measurements' }, to: { title: 'DMS', sub: 'Distribution Management System' }, via: SCADA },
    },
    {
      id: 'step2',
      caption: 'OMS (Outage Management System) tracks outages and crews.',
      flow: { type: 'data', from: { title: 'Outage reports', sub: 'meters and customer calls' }, to: { title: 'OMS', sub: 'Outage Management System' } },
    },
    {
      id: 'step3',
      caption: 'Built-in DERMS (Distributed Energy Resource Management System) shows DERs (Distributed Energy Resources) and their impact.',
      flow: { type: 'data', from: { title: 'Solar and batteries', sub: 'output and limits' }, to: DERMS },
    },
    {
      id: 'step4',
      caption: 'All three work on the same network model — the next slides show each one in action.',
      flow: { type: 'decision', from: { title: 'One network model', sub: 'shared' }, to: ADMS },
    },
  ],
  labels: {
    dms: { title: 'DMS', sub: 'Distribution Management System' },
    oms: { title: 'OMS', sub: 'Outage Management System' },
    derms: DERMS,
    substation: { title: 'Substation', sub: 'three feeders' },
    loaded: { title: 'Heavily loaded', sub: 'feeder segment' },
    outage: { title: 'Outage', sub: 'crew on the way' },
  },
  packets: { dms: 'Feeder loading', oms: 'Outage report', derms: 'Solar output' },
  legend: ['flow', 'warning', 'off', 'data', 'reverse'],
};

export const phase2 = {
  portfolio,
  'why-gridos': whyGridos,
  'data-fabric': dataFabric,
  'zero-trust-cloud': zeroTrust,
  'distribution-overview': distributionOverview,
  gnm,
  'adms-overview': admsOverview,
};
