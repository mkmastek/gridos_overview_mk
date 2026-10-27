// Phase 5 slide content (Slides 23–27). Same rules and shape as slides.js (see the header there).
// Export: an object keyed by slide id. Slides listed here replace the placeholders in slides.js.

// Flow ends reused across slides.
const ADMS = { title: 'ADMS', sub: 'Advanced Distribution Management System' };
const OMS = { title: 'OMS', sub: 'Outage Management System' };
const SCADA = { title: 'SCADA', sub: 'Supervisory Control and Data Acquisition' };
const FABRIC = { title: 'Data Fabric', sub: 'one shared data layer' };
const DERMS = { title: 'DERMS', sub: 'Distributed Energy Resource Management System' };
const AEMS = { title: 'AEMS', sub: 'Advanced Energy Management System' };

// ─────────────────────────────────────────────────────────────────
// Slide 23 — resilience: before, during and after a storm
// ─────────────────────────────────────────────────────────────────
const sResilience = {
  id: 'resilience',
  section: 'Resilience',
  phase: 5,
  scene: 's23-resilience',
  badge: true,
  title: 'Before, during, after a storm: Disruption Prepare, Outage Assist, Storm Manager',
  subtitle: 'One application for each phase of a storm, from 72 hours before landfall to the last repair.',
  blocks: [
    {
      kind: 'lead',
      heading: 'In one line',
      paras: ['GridOS helps a utility prepare for a storm, run the response, and organise the recovery.'],
    },
    {
      kind: 'why',
      heading: 'Why it matters',
      items: [
        'Crews in place before the storm restore power sooner.',
        'During a storm, outages arrive faster than people can sort them.',
        'Recovery needs extra crews, plus their housing and pay.',
      ],
    },
    {
      kind: 'how',
      heading: 'How it works',
      ordered: true,
      items: [
        'Before: Disruption Prepare forecasts outages hour by hour, up to 72 hours ahead.',
        'It mixes past weather, outage and damage data with GIS (Geographic Information System) data and weather forecasts.',
        'During: the Enterprise OMS (Outage Management System) in ADMS (Advanced Distribution Management System) assesses, dispatches, reports and restores.',
        'Outage Assist sends internal or contract crews and adds remote staff by mobile app.',
        'After: Storm Manager brings in extra resources and runs their logistics.',
      ],
    },
    {
      kind: 'example',
      heading: 'Example',
      paras: ['A hurricane will land in three days. Crews wait in the townships most likely to lose power before the first gust.'],
      note: 'VI (Visual Intelligence) helps too: risky trees before the storm, damage photos after it.',
    },
  ],
  notes: ['Storm track, townships and customer numbers are illustrative.'],
  keyFacts: [
    {
      id: 'F-RES-1',
      text: 'Disruption Prepare assesses impact up to 72 hours before an event, with hour-by-hour outage predictions at township level and damage forecasts by service center.',
    },
    {
      id: 'F-RES-2',
      text: 'During an event, ADMS (Advanced Distribution Management System) and its Enterprise OMS (Outage Management System) assess, dispatch, report and restore. Outage Assist dispatches internal or contract crews and adds remote staff through a mobile app.',
    },
    {
      id: 'F-RES-3',
      text: 'Storm Manager acquires and activates resources, prioritizes recovery, and manages logistics including housing and billing for recovery personnel.',
    },
  ],
  steps: [
    {
      id: 'step1',
      caption: 'T−72h: Disruption Prepare forecasts where the storm will cause outages, hour by hour.',
      flow: { type: 'data', from: { title: 'Weather and history', sub: 'forecasts, past outages and damage' }, to: { title: 'Disruption Prepare', sub: 'outages by township' } },
    },
    {
      id: 'step2',
      caption: 'T−48h: crews and materials are pre-staged where damage is predicted.',
      flow: { type: 'command', from: { title: 'Disruption Prepare', sub: 'predicted damage' }, to: { title: 'Service centers', sub: 'crews and materials staged' } },
    },
    {
      id: 'step3',
      caption: 'T0: the storm hits. OMS (Outage Management System) and Outage Assist group the outage reports and dispatch crews.',
      flow: [
        { type: 'data', from: { title: 'Outage reports', sub: 'smart meters and calls' }, to: { title: 'Outage Assist', sub: 'in the Enterprise OMS (Outage Management System)' } },
        { type: 'command', from: { title: 'Outage Assist', sub: 'in the Enterprise OMS (Outage Management System)' }, to: { title: 'Crews', sub: 'sent by zone of impact' } },
      ],
    },
    {
      id: 'step4',
      caption: 'T+6h: remote staff join through the mobile app to handle routine outages.',
      flow: { type: 'command', from: { title: 'Outage Assist', sub: 'routine jobs' }, to: { title: 'Remote staff', sub: 'mobile app' } },
    },
    {
      id: 'step5',
      caption: 'T+12h: Storm Manager brings in mutual-aid crews and manages their logistics.',
      flow: { type: 'command', from: { title: 'Storm Manager', sub: 'resources and logistics' }, to: { title: 'Mutual-aid crews', sub: 'lodging and assigned work' } },
    },
    {
      id: 'step6',
      caption: 'T+48h: restoration complete — every township has power again.',
      flow: { type: 'power', from: { title: 'Repaired lines', sub: 'township by township' }, to: { title: 'Customers', sub: 'power restored' } },
    },
  ],
  labels: {
    prepare: { title: 'Disruption Prepare', sub: 'Before: forecast' },
    assist: { title: 'Outage Assist', sub: 'During: dispatch' },
    manager: { title: 'Storm Manager', sub: 'After: resources' },
    storm: { title: 'Storm', sub: 'Forecast track' },
    center: { title: 'Service center', sub: 'Crews staged here' },
    weather: { title: 'Weather feeds', sub: 'Forecasts and history' },
    remote: { title: 'Remote staff', sub: 'Mobile app' },
  },
  resilience: {
    clockLabel: 'Storm clock',
    outLabel: 'Customers out',
    timeline: ['T−72h', 'T−48h', 'T0', 'T+6h', 'T+12h', 'T+48h'],
    boardRows: ['Crews', 'Lodging', 'Mutual-aid teams'],
    packets: {
      forecast: 'Forecast + history',
      stage: 'Stage crews',
      reports: 'Outage reports',
      dispatch: 'Dispatch',
      remote: 'Routine jobs',
      aid: 'Lodging + tasks',
    },
  },
  legend: ['ai', 'fault', 'restored', 'data', 'command'],
};

// ─────────────────────────────────────────────────────────────────
// Slide 24 — Workflow A: one storm, every app working together
// ─────────────────────────────────────────────────────────────────
const sWorkflowStorm = {
  id: 'workflow-storm',
  section: 'Real time',
  phase: 5,
  scene: 's24-workflow-storm',
  badge: true,
  title: 'Workflow A: one storm, every app working together',
  subtitle: 'Follow one storm: each application acts, then hands its result to the next through the shared data layer.',
  blocks: [
    {
      kind: 'lead',
      heading: 'In one line',
      paras: ['No single application handles a storm. Each one acts on its part and shares the result, so the next one starts from the same picture.'],
    },
    {
      kind: 'why',
      heading: 'Why it matters',
      items: [
        'Applications share one network model and one governed data layer.',
        'Planners, operators and field crews work from the same view.',
      ],
    },
    {
      kind: 'how',
      heading: 'How it works',
      ordered: true,
      items: [
        'Disruption Prepare predicts damage 72 hours ahead; VI (Visual Intelligence) has already flagged risky trees.',
        'A tree hits a feeder: ADMS (Advanced Distribution Management System) FLISR (Fault Location, Isolation and Service Restoration) isolates it and re-feeds healthy sections.',
        'OMS (Outage Management System) uses AMI (Advanced Metering Infrastructure) messages to confirm who is still out.',
        'GridOS Field crews record verified damage; VI (Visual Intelligence) images support the assessment.',
        'Storm Manager coordinates extra crews until everyone is restored.',
        'AEMS (Advanced Energy Management System) and WAMS (Wide Area Monitoring System) watch transmission stability throughout.',
      ],
    },
    {
      kind: 'example',
      heading: 'Watch for',
      paras: ['Each blue arc is a handoff: a result leaving one application and arriving at the next.'],
    },
  ],
  keyFacts: [
    {
      id: 'F-G4D-2',
      text: 'GridOS for Distribution applications share one network model exchange and one governed data layer, so planners, operators and field crews work from the same view.',
    },
    {
      id: 'F-FIELD-1',
      text: 'GridOS Field damage assessments are validated against the network model and synchronized across ADMS (Advanced Distribution Management System), OMS (Outage Management System) and GIS (Geographic Information System).',
    },
    {
      id: 'F-AEMS-1',
      text: 'AEMS (Advanced Energy Management System) comprises EMS (Energy Management System), WAMS (Wide Area Monitoring System) and analytics applications.',
    },
  ],
  steps: [
    {
      id: 'step1',
      caption: 'T−72h: VI (Visual Intelligence) has flagged risky trees; Disruption Prepare uses it to forecast damage.',
      flow: [
        { type: 'data', from: { title: 'VI', sub: 'Visual Intelligence: risky trees' }, to: FABRIC },
        { type: 'data', from: FABRIC, to: { title: 'Disruption Prepare', sub: '72-hour damage forecast' } },
      ],
    },
    {
      id: 'step2',
      caption: 'A tree hits a feeder. ADMS (Advanced Distribution Management System) FLISR (Fault Location, Isolation and Service Restoration) isolates it and re-feeds the healthy sections.',
      flow: [
        { type: 'data', from: { title: 'Fault indicators', sub: 'on the feeder' }, to: ADMS },
        { type: 'command', from: ADMS, to: { title: 'Remote switches', sub: 'isolate and re-feed' }, via: SCADA },
      ],
    },
    {
      id: 'step3',
      caption: 'OMS (Outage Management System) reads AMI (Advanced Metering Infrastructure) messages to confirm who is still out, and shares the outage list.',
      flow: [
        { type: 'data', from: { title: 'AMI', sub: 'Advanced Metering Infrastructure: smart meters' }, to: OMS },
        { type: 'data', from: OMS, to: { title: 'Data Fabric', sub: 'outage list shared' } },
      ],
    },
    {
      id: 'step4',
      caption: 'A GridOS Field crew records verified damage; it reaches ADMS (Advanced Distribution Management System) and OMS (Outage Management System) at once.',
      flow: [
        { type: 'data', from: { title: 'Field', sub: 'verified damage record' }, to: FABRIC },
        { type: 'data', from: FABRIC, to: { title: 'ADMS/OMS', sub: 'Advanced Distribution Management System / Outage Management System' } },
      ],
    },
    {
      id: 'step5',
      caption: 'Storm Manager reads the open outages and sends extra crews until every customer is back.',
      flow: [
        { type: 'data', from: { title: 'Data Fabric', sub: 'outages still open' }, to: { title: 'Storm Manager', sub: 'resources and logistics' } },
        { type: 'command', from: { title: 'Storm Manager', sub: 'resources and logistics' }, to: { title: 'Extra crews', sub: 'assigned work' } },
      ],
    },
    {
      id: 'step6',
      caption: 'Throughout, WAMS (Wide Area Monitoring System) and AEMS (Advanced Energy Management System) watch transmission stability.',
      flow: [
        { type: 'data', from: { title: 'PMUs', sub: 'Phasor Measurement Units' }, to: { title: 'WAMS', sub: 'Wide Area Monitoring System' } },
        { type: 'data', from: { title: 'WAMS', sub: 'Wide Area Monitoring System' }, to: AEMS },
      ],
    },
  ],
  labels: {
    slab: { title: 'GridOS applications', sub: 'Sharing one data layer' },
    fabric: { title: 'Data Fabric', sub: 'Shared data layer' },
    prepare: { title: 'Disruption Prepare', sub: 'Storm forecast' },
    vi: { title: 'VI', sub: 'Visual Intelligence' },
    adms: { title: 'ADMS', sub: 'Advanced Distribution Management System' },
    oms: { title: 'OMS', sub: 'Outage Management System' },
    field: { title: 'Field', sub: 'Damage assessment' },
    manager: { title: 'Storm Manager', sub: 'Recovery resources' },
    wams: { title: 'WAMS', sub: 'Wide Area Monitoring System' },
    aems: { title: 'AEMS', sub: 'Advanced Energy Management System' },
    town: { title: 'Distribution feeder', sub: 'Homes and smart meters' },
    region: { title: 'Transmission grid', sub: 'Watched by phasor sensors' },
  },
  packets: {
    trees: 'Risky trees',
    forecast: 'Damage forecast',
    faultData: 'Fault current',
    switching: 'Open + re-feed',
    meters: 'Last gasp',
    outages: 'Outage list',
    damage: 'Damage record',
    open: 'Open outages',
    crews: 'Assign crews',
    phasors: 'Phasors',
    stability: 'Stability',
  },
  legend: ['flow', 'fault', 'off', 'data', 'command', 'restored'],
};

// ─────────────────────────────────────────────────────────────────
// Slide 25 — Workflow B: a high-solar afternoon across T&D
// ─────────────────────────────────────────────────────────────────
const sWorkflowSolar = {
  id: 'workflow-solar',
  section: 'Real time',
  phase: 5,
  scene: 's25-workflow-solar',
  badge: true,
  title: 'Workflow B: a high-solar afternoon across T&D (Transmission and Distribution)',
  subtitle: 'From the morning forecast to a windy evening: distribution and transmission applications coordinate through the day.',
  blocks: [
    {
      kind: 'lead',
      heading: 'In one line',
      paras: ['Rooftop solar changes what the transmission grid sees. GridOS applications pass forecasts, limits and flows to each other so both grids stay secure.'],
    },
    {
      kind: 'why',
      heading: 'Why it matters',
      items: [
        'At midday, solar can push power backwards from homes into the substation.',
        'The transmission grid must adjust as that net flow changes through the day.',
      ],
    },
    {
      kind: 'how',
      heading: 'How it works',
      ordered: true,
      items: [
        'GridOS Forecasting predicts high solar output and a data center’s load ramp.',
        'DERMS (Distributed Energy Resource Management System) foresees backfeed and sets DOEs (Dynamic Operating Envelopes).',
        'The Gateway sends the limits by IEEE 2030.5 (IEEE smart energy profile for DER communication) and through aggregators.',
        'ADMS (Advanced Distribution Management System) keeps voltages in limits; VVO (Volt/VAR Optimization) fine-tunes.',
        'AEMS (Advanced Energy Management System) sees the net flow change and adjusts dispatch.',
        'DDLR (Digital Dynamic Line Rating) finds extra line capacity on a windy evening.',
      ],
    },
    {
      kind: 'example',
      heading: 'Watch for',
      paras: ['The big arrow at the T&D (Transmission and Distribution) boundary: it flips upward (purple) when homes export, and down again in the evening.'],
      note: 'Flows in MW (megawatt) and times are illustrative.',
    },
  ],
  keyFacts: [
    {
      id: 'F-DERMS-8',
      text: 'GridOS DERMS (Distributed Energy Resource Management System) integrates with ADMS (Advanced Distribution Management System), AEMS (Advanced Energy Management System), Edge DERMS and Markets for T&D (Transmission and Distribution) visibility, coordination and control.',
    },
    {
      id: 'F-FC-1',
      text: 'GridOS Forecasting forecasts load and renewable generation, so operators can anticipate variability and plan dispatch.',
    },
    {
      id: 'F-DDLR-1',
      text: 'DDLR (Digital Dynamic Line Rating) combines line data with hourly weather to compute ratings without sensors or new infrastructure.',
    },
  ],
  steps: [
    {
      id: 'step1',
      caption: '09:00 — GridOS Forecasting predicts strong midday solar and the data center’s afternoon load ramp.',
      flow: [
        { type: 'data', from: { title: 'Weather and history', sub: 'sun, wind, demand' }, to: { title: 'Forecasting', sub: 'solar and load forecast' } },
        { type: 'data', from: { title: 'Forecasting', sub: 'solar and load forecast' }, to: FABRIC },
      ],
    },
    {
      id: 'step2',
      caption: '10:30 — DERMS (Distributed Energy Resource Management System) foresees backfeed and calculates an export limit for each home.',
      flow: [
        { type: 'data', from: { title: 'Data Fabric', sub: 'solar forecast' }, to: DERMS },
        { type: 'decision', from: DERMS, to: { title: 'DOEs', sub: 'Dynamic Operating Envelopes per home' } },
      ],
    },
    {
      id: 'step3',
      caption: '11:30 — The Gateway sends the limits to homes and aggregators; batteries start soaking up solar.',
      flow: {
        type: 'command',
        from: { title: 'Gateway', sub: 'DERMS (Distributed Energy Resource Management System) module' },
        to: { title: 'Homes and aggregators', sub: 'export limits' },
        via: { title: 'IEEE 2030.5', sub: 'IEEE smart energy profile for DER communication' },
      },
    },
    {
      id: 'step4',
      caption: '13:00 — Power flows backward, but ADMS (Advanced Distribution Management System) keeps every voltage within limits.',
      flow: [
        { type: 'reverse', from: { title: 'Rooftop solar', sub: 'exporting' }, to: ADMS },
        { type: 'command', from: ADMS, to: { title: 'Regulators and inverters', sub: 'VVO (Volt/VAR Optimization) settings' } },
      ],
    },
    {
      id: 'step5',
      caption: '14:00 — The net flow at the boundary reverses. AEMS (Advanced Energy Management System) sees it and re-dispatches generation.',
      flow: [
        { type: 'data', from: { title: 'T&D', sub: 'Transmission and Distribution boundary flow' }, to: AEMS },
        { type: 'command', from: AEMS, to: { title: 'Generators', sub: 'new dispatch' } },
      ],
    },
    {
      id: 'step6',
      caption: '19:30 — A windy evening: DDLR (Digital Dynamic Line Rating) raises line ratings, so more power moves without congestion.',
      flow: [
        { type: 'data', from: { title: 'Weather', sub: 'strong, cooling wind' }, to: { title: 'DDLR', sub: 'Digital Dynamic Line Rating' } },
        { type: 'decision', from: { title: 'DDLR', sub: 'Digital Dynamic Line Rating' }, to: { title: 'AEMS', sub: 'Advanced Energy Management System: higher line limits' } },
      ],
    },
  ],
  labels: {
    forecasting: { title: 'Forecasting', sub: 'Solar and load' },
    fabric: { title: 'Data Fabric', sub: 'Shared data layer' },
    derms: { title: 'DERMS', sub: 'Distributed Energy Resource Management System' },
    adms: { title: 'ADMS', sub: 'Advanced Distribution Management System' },
    aems: { title: 'AEMS', sub: 'Advanced Energy Management System' },
    ddlr: { title: 'DDLR', sub: 'Digital Dynamic Line Rating' },
    gateway: { title: 'Gateway', sub: 'Sends limits to homes' },
    boundary: { title: 'T&D', sub: 'Transmission and Distribution boundary' },
    transmission: { title: 'Transmission grid', sub: 'Generators, lines, data center' },
    distribution: { title: 'Distribution grid', sub: 'Homes with rooftop solar' },
    dataCenter: { title: 'Data center', sub: 'Load ramps up' },
    gas: { title: 'Gas plant output', sub: 'Set by AEMS (Advanced Energy Management System) dispatch' },
    weather: { title: 'Weather station', sub: 'Sun, wind, temperature' },
  },
  solar: {
    timeLabel: 'Time of day',
    netLabel: 'Net flow at the T&D (Transmission and Distribution) boundary',
    unit: 'MW',
    importWord: 'into homes',
    exportWord: 'back to the grid',
    ratingLabel: 'Line rating',
    times: ['09:00', '10:30', '11:30', '13:00', '14:00', '19:30'],
  },
  packets: {
    weather: 'Weather',
    forecast: 'Solar forecast',
    envelopes: 'Export limits',
    limits: 'Limits',
    voltages: 'Voltages',
    settings: 'Voltage settings',
    boundary: 'Net flow',
    dispatch: 'New dispatch',
    wind: 'Wind',
    rating: 'Higher rating',
  },
  legend: ['flow', 'reverse', 'data', 'command', 'ai'],
};

// ─────────────────────────────────────────────────────────────────
// Slide 26 — deployment, adoption journey, customer examples
// ─────────────────────────────────────────────────────────────────
const sDeployment = {
  id: 'deployment',
  section: 'Adoption',
  phase: 5,
  scene: 's26-deployment',
  badge: true,
  title: 'Deployment options, adoption journey, customer examples',
  subtitle: 'Where GridOS runs, how utilities adopt it step by step, and who uses it.',
  blocks: [
    {
      kind: 'lead',
      heading: 'In one line',
      paras: ['GridOS can run on-premises, in the cloud, or as a hybrid of both, and utilities adopt it in stages.'],
    },
    {
      kind: 'why',
      heading: 'Why it matters',
      items: [
        'Real-time control can stay on-premises while other applications run in the cloud.',
        'A staged journey lets a utility start with the essentials and add capabilities later.',
      ],
    },
    {
      kind: 'how',
      heading: 'How it connects',
      items: [
        'Data Fabric links SCADA (Supervisory Control and Data Acquisition), AEMS (Advanced Energy Management System), AMI/MDM (Advanced Metering Infrastructure / Meter Data Management), CIS (Customer Information System) and weather systems.',
        'Data stays in its system of record.',
        'Open standards and documented APIs (Application Programming Interfaces) connect other systems.',
      ],
    },
    {
      kind: 'journey',
      heading: 'Adoption journeys',
      items: [
        'Distribution: Essentials → Disruption Management → Distribution Optimization → DER (Distributed Energy Resource) Orchestration → Distribution Intelligence.',
        'Transmission: trusted network awareness → operational coordination → predictive intelligence.',
      ],
    },
    {
      kind: 'customers',
      heading: 'Customer examples',
      items: [
        'Alabama Power, United States.',
        'One Grid Operation, Norway: hybrid cloud deployment.',
        'Stedin, Netherlands: DER (Distributed Energy Resource) orchestration.',
        'Energy Queensland, Australia: DERMS (Distributed Energy Resource Management System) Gateway.',
      ],
      note: 'Click a pin on the globe to open a customer card.',
    },
    {
      kind: 'caution',
      heading: 'Caution',
      paras: ['Independent reviewers note that ADMS (Advanced Distribution Management System) programmes take years and depend on SCADA (Supervisory Control and Data Acquisition), GIS (Geographic Information System) and OMS (Outage Management System) data quality.'],
    },
  ],
  keyFacts: [
    {
      id: 'F-DEP-1',
      text: 'One Grid Operation (Norway, for owners Tensio and Linea) plans to implement GridOS over three years: ADMS (Advanced Distribution Management System) on-premises and other GridOS applications in AWS (Amazon Web Services).',
    },
    {
      id: 'F-G4D-4',
      text: 'Alabama Power avoided more than 112 million CMI (Customer Minutes of Interruption) in 2025.',
      qualifier: 'GE Vernova customer claim',
    },
    {
      id: 'F-CUST-4',
      text: 'Energy Queensland uses the DERMS (Distributed Energy Resource Management System) Gateway for DER (Distributed Energy Resource) connectivity with IEEE 2030.5 (IEEE smart energy profile for DER communication).',
    },
    {
      id: 'F-RISK-1',
      text: 'Independent reviewers note ADMS (Advanced Distribution Management System) programmes carry risks: long timelines and dependency on data quality.',
    },
  ],
  steps: [
    {
      id: 'step1',
      caption: 'GridOS can run on-premises, in the cloud, or both — a hybrid deployment.',
      flow: { type: 'data', from: { title: 'On-premises', sub: 'utility data center' }, to: { title: 'Cloud', sub: 'hybrid link' } },
    },
    {
      id: 'step2',
      caption: 'One Grid Operation, Norway: ADMS (Advanced Distribution Management System) on-premises, other GridOS applications in AWS (Amazon Web Services).',
      flow: { type: 'data', from: { title: 'ADMS', sub: 'Advanced Distribution Management System, on-premises' }, to: { title: 'AWS', sub: 'Amazon Web Services: other GridOS applications' } },
    },
    {
      id: 'step3',
      caption: 'Alabama Power, United States: avoided more than 112 million CMI (Customer Minutes of Interruption) in 2025 — a GE Vernova customer claim.',
      flow: { type: 'data', from: { title: 'Alabama Power', sub: 'United States' }, to: { title: 'GridOS', sub: 'distribution operations' } },
    },
    {
      id: 'step4',
      caption: 'Stedin, Netherlands: a DSO (Distribution System Operator) orchestrating DERs (Distributed Energy Resources) with GridOS DERMS (Distributed Energy Resource Management System).',
      flow: { type: 'command', from: DERMS, to: { title: 'DERs', sub: 'Distributed Energy Resources' } },
    },
    {
      id: 'step5',
      caption: 'Energy Queensland, Australia: the DERMS (Distributed Energy Resource Management System) Gateway connects DERs (Distributed Energy Resources) by IEEE 2030.5 (IEEE smart energy profile for DER communication).',
      flow: {
        type: 'command',
        from: { title: 'Gateway', sub: 'DERMS (Distributed Energy Resource Management System) module' },
        to: { title: 'DERs', sub: 'Distributed Energy Resources' },
        via: { title: 'IEEE 2030.5', sub: 'IEEE smart energy profile for DER communication' },
      },
    },
    {
      id: 'step6',
      caption: 'Distribution adoption is staged: start with Essentials, then add capabilities step by step.',
      flow: { type: 'decision', from: { title: 'Essentials', sub: 'step 1' }, to: { title: 'Distribution Intelligence', sub: 'step 5' } },
    },
    {
      id: 'step7',
      caption: 'Transmission adoption: trusted network awareness, then coordination, then predictive intelligence.',
      flow: { type: 'decision', from: { title: 'Network awareness', sub: 'step 1' }, to: { title: 'Predictive intelligence', sub: 'step 3' } },
    },
  ],
  labels: {
    globe: { title: 'GridOS customers', sub: 'Examples on four continents' },
    onPrem: { title: 'On-premises', sub: 'Utility data center' },
    cloud: { title: 'Cloud', sub: 'For example AWS (Amazon Web Services)' },
    gridos: { title: 'GridOS', sub: 'Applications and Data Fabric' },
    distJourney: { title: 'Distribution journey', sub: 'Five stages' },
    transJourney: { title: 'Transmission journey', sub: 'Three stages' },
    d1: { title: 'Essentials', sub: 'Stage 1' },
    d2: { title: 'Disruption Management', sub: 'Stage 2' },
    d3: { title: 'Distribution Optimization', sub: 'Stage 3' },
    d4: { title: 'DER', sub: 'Distributed Energy Resource orchestration, stage 4' },
    d5: { title: 'Distribution Intelligence', sub: 'Stage 5' },
    t1: { title: 'Network awareness', sub: 'Stage 1' },
    t2: { title: 'Operational coordination', sub: 'Stage 2' },
    t3: { title: 'Predictive intelligence', sub: 'Stage 3' },
  },
  tips: {
    distribution: [
      'Stage 1: Essentials',
      'Stage 2: Disruption Management',
      'Stage 3: Distribution Optimization',
      'Stage 4: DER (Distributed Energy Resource) Orchestration',
      'Stage 5: Distribution Intelligence',
    ],
    transmission: [
      'Stage 1: establish trusted network awareness',
      'Stage 2: strengthen operational coordination',
      'Stage 3: operate with predictive intelligence',
    ],
    pinHint: 'Click to open the customer card',
  },
  customers: {
    alabama: {
      name: 'Alabama Power',
      place: 'United States',
      card: {
        title: 'Alabama Power — United States',
        paras: ['Avoided more than 112 million CMI (Customer Minutes of Interruption) in 2025.'],
        note: 'GE Vernova customer claim.',
      },
    },
    oneGrid: {
      name: 'One Grid Operation',
      place: 'Norway',
      card: {
        title: 'One Grid Operation — Norway',
        paras: [
          'Bought GridOS for its owners Tensio and Linea; plans to implement it over three years.',
          'Hybrid cloud: ADMS (Advanced Distribution Management System) on-premises, other GridOS applications in AWS (Amazon Web Services). Includes ADMS and DERMS (Distributed Energy Resource Management System).',
        ],
      },
    },
    stedin: {
      name: 'Stedin',
      place: 'Netherlands',
      card: {
        title: 'Stedin — Netherlands',
        paras: ['A DSO (Distribution System Operator) using GridOS DERMS (Distributed Energy Resource Management System) for end-to-end DER (Distributed Energy Resource) orchestration.'],
      },
    },
    queensland: {
      name: 'Energy Queensland',
      place: 'Australia',
      card: {
        title: 'Energy Queensland — Australia',
        paras: ['Uses the DERMS (Distributed Energy Resource Management System) Gateway for DER (Distributed Energy Resource) connectivity with IEEE 2030.5 (IEEE smart energy profile for DER communication).'],
      },
    },
  },
  packets: {
    hybrid: 'Hybrid link',
    adms: 'Grid data',
    alabama: 'Outage data',
    stedin: 'Flexibility dispatch',
    queensland: 'Export limits',
  },
  legend: ['data', 'command'],
};

// ─────────────────────────────────────────────────────────────────
// Slide 27 — glossary, sources and caveats
// ─────────────────────────────────────────────────────────────────
const sGlossary = {
  id: 'glossary-sources',
  section: 'Reference',
  phase: 5,
  scene: 's27-glossary-sources',
  title: 'Searchable glossary, sources and caveats',
  subtitle: 'Every abbreviation used in this deck, every source, and what to keep in mind.',
  blocks: [
    {
      kind: 'glossary',
      heading: 'Glossary',
      searchPlaceholder: 'Search, for example outage or voltage',
      categoryLabel: 'Category',
      allCategories: 'All categories',
      countTemplate: '{n} of {total} terms',
    },
    {
      kind: 'caveats',
      heading: 'Caveats',
      items: [
        'Vendor-reported statistics are GE Vernova claims, always shown with their qualifier.',
        'Every demo is an illustrative simulation, not the real GridOS user interface.',
        'Technical-stack details marked “from GE Vernova job postings” come from job adverts.',
        'Generic industry logic, such as how FLISR (Fault Location, Isolation and Service Restoration) works, uses standard engineering knowledge, not GE Vernova internals.',
        'No company financial figures are used.',
      ],
    },
    {
      kind: 'sources',
      heading: 'Sources (checked 26 October 2026; product pages may change)',
    },
  ],
  // Labels for the calm Slide 1 landscape shown behind the reference page.
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
  steps: [],
  legend: ['flow', 'data', 'command'],
};

export const phase5 = {
  resilience: sResilience,
  'workflow-storm': sWorkflowStorm,
  'workflow-solar': sWorkflowSolar,
  deployment: sDeployment,
  'glossary-sources': sGlossary,
};
