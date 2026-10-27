// Phase 3 slide content: Slides 11–16 (distribution applications).
// Same rules and shape as slides.js (see the header there). Short, clear text; every demo
// step has a `flow` that the 3D view shows (what moves, from where to where, via what).
// Export: an object keyed by slide id. Slides listed here replace the placeholders in slides.js.

// Flow ends reused on several slides (title = abbreviation, sub = full form).
const ADMS = { title: 'ADMS', sub: 'Advanced Distribution Management System' };
const SCADA = { title: 'SCADA', sub: 'Supervisory Control and Data Acquisition' };
const OMS = { title: 'OMS', sub: 'Outage Management System' };
const AMI = { title: 'AMI', sub: 'Advanced Metering Infrastructure' };
const DERMS = { title: 'DERMS', sub: 'Distributed Energy Resource Management System' };
const IEEE2030 = { title: 'IEEE 2030.5', sub: 'IEEE smart energy profile for DER communication' };
const VI = { title: 'VI', sub: 'Visual Intelligence' };

// ─────────────────────────────────────────────────────────────────
// Slide 11 — VVO demo
// ─────────────────────────────────────────────────────────────────
const sVvo = {
  id: 'adms-vvo',
  section: 'Distribution',
  phase: 3,
  scene: 's11-vvo',
  badge: true,
  title: 'Demo: VVO (Volt/VAR Optimization)',
  subtitle: 'Keeping every customer’s voltage inside the allowed band — with less energy wasted.',
  blocks: [
    {
      kind: 'lead',
      heading: 'In one line',
      paras: ['VVO (Volt/VAR Optimization) is a GridOS ADMS (Advanced Distribution Management System) function. It tunes voltage and reactive power along a feeder to cut losses and keep voltage within limits.'],
    },
    {
      kind: 'why',
      heading: 'Why it matters',
      items: [
        'Voltage drops along a long feeder, most at peak load.',
        'Too low or too high voltage harms equipment; wasted reactive power raises losses.',
      ],
    },
    {
      kind: 'how',
      heading: 'How it works',
      note: 'Standard practice, not GE Vernova-specific detail. Allowed band in this demo: 0.95 to 1.05 pu (per unit).',
      ordered: true,
      items: [
        'Meters report voltage along the feeder.',
        'VVO (Volt/VAR Optimization) works out settings for all devices together.',
        'A capacitor bank supplies reactive power locally.',
        'A voltage regulator and the substation LTC (Load Tap Changer) adjust their taps.',
        'Smart inverters on rooftop solar fine-tune reactive power.',
      ],
    },
    {
      kind: 'example',
      heading: 'Example',
      paras: [
        'A long rural feeder at evening peak: customers at the end get low voltage, customers near the substation get high voltage.',
        'CVR (Conservation Voltage Reduction) is a VVO (Volt/VAR Optimization) use case: run voltage low in the band to save energy.',
      ],
    },
    {
      kind: 'usage',
      heading: 'Try it',
      paras: ['Move the feeder load slider: the voltage ribbon sags or recovers (simplified model).'],
    },
  ],
  notes: ['Voltages, losses and the voltage model are illustrative and simplified.'],
  keyFacts: [
    {
      id: 'F-ADMS-2',
      text: 'GE Vernova lists VVO (Volt/VAR Optimization) among GridOS ADMS (Advanced Distribution Management System) functions, with FLISR (Fault Location, Isolation and Service Restoration) and network optimization.',
    },
  ],
  steps: [
    {
      id: 'step1',
      caption: 'Evening peak: voltage drops along the feeder. The end of the line falls below the limit.',
      flow: { type: 'data', from: { title: 'Meters', sub: 'low voltage at the far end' }, to: ADMS, via: AMI },
    },
    {
      id: 'step2',
      caption: 'VVO (Volt/VAR Optimization) calculates the best settings for every device at once.',
      flow: { type: 'decision', from: ADMS, to: { title: 'Four devices', sub: 'new settings, all together' } },
    },
    {
      id: 'step3',
      caption: 'The capacitor bank switches on, supplying reactive power locally.',
      flow: { type: 'command', from: ADMS, to: { title: 'Capacitor bank', sub: 'switch on' }, via: SCADA },
    },
    {
      id: 'step4',
      caption: 'The voltage regulator raises its tap: the middle of the feeder steps up.',
      flow: { type: 'command', from: ADMS, to: { title: 'Voltage regulator', sub: 'raise tap' }, via: SCADA },
    },
    {
      id: 'step5',
      caption: 'Smart inverters on rooftop solar adjust their reactive power.',
      flow: { type: 'command', from: ADMS, to: { title: 'Smart inverters', sub: 'more reactive power' } },
    },
    {
      id: 'step6',
      caption: 'Result: the whole feeder is inside the allowed band, and losses fall.',
      flow: { type: 'power', from: { title: 'Substation', sub: 'feeder start' }, to: { title: 'Every customer', sub: 'voltage inside the band' } },
    },
    {
      id: 'step7',
      caption: 'CVR (Conservation Voltage Reduction): the substation tap lowers the whole profile toward the bottom of the band to save energy.',
      flow: [
        { type: 'command', from: ADMS, to: { title: 'LTC', sub: 'Load Tap Changer' } },
        { type: 'power', from: { title: 'LTC', sub: 'Load Tap Changer' }, to: { title: 'Customers', sub: 'slightly lower voltage, less energy' } },
      ],
    },
  ],
  labels: {
    adms: { title: 'ADMS', sub: 'Advanced Distribution Management System' },
    ribbon: { title: 'Voltage profile', sub: 'height = voltage' },
    upper: { title: 'Upper limit', sub: '1.05 pu (per unit)' },
    lower: { title: 'Lower limit', sub: '0.95 pu (per unit)' },
    ltc: { title: 'LTC', sub: 'Load Tap Changer' },
    regulator: { title: 'Voltage regulator', sub: 'pole 8' },
    capacitor: { title: 'Capacitor bank', sub: 'pole 11' },
    inverters: { title: 'Smart inverters', sub: 'rooftop solar' },
    losses: { title: 'Line losses', sub: 'illustrative' },
  },
  packets: {
    data: 'Voltage reading',
    capacitor: 'Switch on',
    regulator: 'Raise tap',
    inverter: 'More reactive power',
    ltc: 'Lower tap',
  },
  hud: {
    lowest: 'Lowest voltage (per unit)',
    highest: 'Highest voltage (per unit)',
    losses: 'Line losses (illustrative)',
    saved: 'Energy saved by CVR (Conservation Voltage Reduction)',
  },
  controls: {
    loadLabel: 'Feeder load (simplified model)',
    loadTip: 'Simplified linear model: more load means a bigger voltage drop along the feeder.',
  },
  legend: ['restored', 'warning', 'fault', 'flow', 'data', 'command'],
};

// ─────────────────────────────────────────────────────────────────
// Slide 12 — OMS storm night
// ─────────────────────────────────────────────────────────────────
const sOms = {
  id: 'adms-oms',
  section: 'Distribution',
  phase: 3,
  scene: 's12-oms',
  badge: true,
  title: 'Demo: OMS (Outage Management System) on a storm night',
  subtitle: 'Twelve homes go dark. Watch the outage system find the one broken transformer.',
  blocks: [
    {
      kind: 'lead',
      heading: 'In one line',
      paras: ['OMS (Outage Management System) in GridOS ADMS (Advanced Distribution Management System) handles planned and unplanned outages, with field mobility, damage assessment and predictive analytics.'],
    },
    {
      kind: 'why',
      heading: 'Why it matters',
      items: [
        'The utility must know who is out, even before they call.',
        'Crews need the exact device to fix, not just a street name.',
      ],
    },
    {
      kind: 'how',
      heading: 'How it works',
      note: 'Standard outage-management logic, not GE Vernova-specific detail.',
      ordered: true,
      items: [
        'Smart meters send a “last gasp” as power fails; some customers call.',
        'OMS (Outage Management System) groups the reports on the network model.',
        'The device all reports share is the likely cause.',
        'A crew is dispatched; customers get an ETR (Estimated Time to Restore).',
        'Meters confirm when power is back.',
      ],
    },
    {
      kind: 'example',
      heading: 'Example',
      paras: ['A storm knocks out one transformer. Twelve reports all point to it, so the crew drives straight there.'],
    },
  ],
  notes: ['Homes, times and confidence are illustrative.'],
  keyFacts: [
    {
      id: 'F-ADMS-3',
      text: 'OMS (Outage Management System) improves restoration, crew dispatch and customer communication, and improves SAIDI (System Average Interruption Duration Index), SAIFI (System Average Interruption Frequency Index) and CMI (Customer Minutes of Interruption).',
    },
    {
      id: 'F-RES-2',
      text: 'During an event, ADMS (Advanced Distribution Management System) and its Enterprise OMS (Outage Management System) help assess, dispatch, report and restore. Outage Assist dispatches internal or contract crews.',
    },
  ],
  steps: [
    {
      id: 'step1',
      caption: 'Storm night: a distribution transformer fails. 12 homes lose power.',
      flow: { type: 'event', from: { title: 'Transformer', sub: 'fails in the storm' }, to: { title: '12 homes', sub: 'lose power' } },
    },
    {
      id: 'step2',
      caption: 'Smart meters send last-gasp messages; some customers call.',
      flow: { type: 'data', from: { title: 'Meters and calls', sub: '9 last gasps, 3 calls' }, to: OMS, via: AMI },
    },
    {
      id: 'step3',
      caption: 'OMS (Outage Management System) traces the reports up the network model: they all share one transformer.',
      flow: { type: 'decision', from: OMS, to: { title: 'Network model', sub: 'one shared upstream device' } },
    },
    {
      id: 'step4',
      caption: 'The transformer is flagged as the predicted outage device.',
      flow: { type: 'decision', from: OMS, to: { title: 'Transformer', sub: 'predicted, 92% confidence' } },
    },
    {
      id: 'step5',
      caption: 'A crew is dispatched, and an ETR (Estimated Time to Restore) is published to customers.',
      flow: { type: 'command', from: OMS, to: { title: 'Crew', sub: 'drive to the transformer' } },
    },
    {
      id: 'step6',
      caption: 'Power restored — meters confirm every home is back.',
      flow: { type: 'data', from: { title: 'Meters', sub: 'power back on' }, to: OMS, via: AMI },
    },
  ],
  labels: {
    oms: { title: 'OMS', sub: 'Outage Management System' },
    transformer: { title: 'Transformer', sub: 'serves 12 homes' },
    neighbours: { title: 'Next street', sub: 'other transformer, still on' },
    crew: { title: 'Crew truck', sub: 'headlights on' },
  },
  predicted: {
    title: 'Predicted outage device',
    sub: 'Confidence {pct}%',
  },
  packets: {
    lastGasp: 'Last gasp',
    call: 'Customer call',
    restored: 'Power back on',
  },
  panel: {
    title: 'Outage view',
    feeder: 'Feeder',
    transformer: 'Transformer',
    otherTransformer: 'Other transformer',
    predicted: 'Predicted',
    crew: 'Crew',
  },
  hud: {
    out: 'Homes without power',
    etr: 'ETR (Estimated Time to Restore)',
    etrNone: '—',
    etrFormat: '{h} h {m} min',
  },
  legend: ['flow', 'off', 'fault', 'data', 'command', 'restored'],
};

// ─────────────────────────────────────────────────────────────────
// Slide 13 — DERMS overview
// ─────────────────────────────────────────────────────────────────
const sDermsOverview = {
  id: 'derms-overview',
  section: 'Distribution',
  phase: 3,
  scene: 's13-derms-overview',
  badge: true,
  title: 'DERMS (Distributed Energy Resource Management System): eight modules',
  subtitle: 'How GridOS turns thousands of rooftop devices into one managed resource.',
  blocks: [
    {
      kind: 'lead',
      heading: 'In one line',
      paras: ['GridOS DERMS (Distributed Energy Resource Management System) manages the whole life of DERs (Distributed Energy Resources): integration, visualization, operation, control and optimization.'],
    },
    {
      kind: 'why',
      heading: 'Why it matters',
      items: [
        'Rooftop solar, batteries and EV (Electric Vehicle) chargers now sit on every feeder.',
        'Unmanaged, they can overload equipment or push voltage out of limits.',
      ],
    },
    {
      kind: 'how',
      heading: 'How it works: eight modules',
      note: 'GE Vernova names all eight modules; the roles of Model Manager, Forecasting, Operations, Program Manager and Markets Orchestration are summarised from their names.',
      ordered: true,
      items: [
        'Model Manager — the model of every device and where it connects.',
        'Forecasting — look-ahead analysis of what devices will do.',
        'Optimization — schedules within grid limits, economics and DOEs (Dynamic Operating Envelopes).',
        'Gateway — single point of communication with devices and aggregators.',
        'Operations — the operators’ live view.',
        'Program Manager — customer programs.',
        'Markets Orchestration — flexibility and energy markets.',
        'Flex Planning — short- and long-term studies, including NWAs (Non-Wires Alternatives).',
      ],
    },
    {
      kind: 'example',
      heading: 'Grid side and edge side',
      paras: [
        'Grid DERMS (Distributed Energy Resource Management System) works grid-wide for the utility. Edge DERMS works with device owners through aggregation and local control. They coordinate.',
        'Standards: OpenADR (Open Automated Demand Response) and IEEE 2030.5 (IEEE smart energy profile for DER communication).',
      ],
    },
  ],
  keyFacts: [
    {
      id: 'F-DERMS-5',
      text: '90+ deployments globally, 127 million utility service points, and ranked #1 Grid DERMS (Distributed Energy Resource Management System) by Guidehouse Insights.',
      qualifier: 'GE Vernova figures',
    },
    {
      id: 'F-DERMS-2',
      text: 'The Gateway is certified to IEEE 2030.5 (IEEE smart energy profile for DER communication); Optimization schedules within grid constraints, economics and DOEs (Dynamic Operating Envelopes).',
    },
    {
      id: 'F-DERMS-6',
      text: 'Partners include EnergyHub, Nodes, EPEX Spot, Piclo, Clean Power Research, WeaveGrid and Plexigrid.',
    },
  ],
  steps: [
    {
      id: 'step1',
      caption: 'Model Manager keeps the model of every device and where it connects to the grid.',
      flow: { type: 'data', from: { title: 'Rooftop devices', sub: 'solar, batteries, chargers' }, to: { title: 'Model Manager', sub: 'one model of them all' } },
    },
    {
      id: 'step2',
      caption: 'Forecasting runs look-ahead analysis: what will solar and demand do in the next hours?',
      flow: { type: 'decision', from: { title: 'Forecasting', sub: 'look-ahead analysis' }, to: { title: 'Next hours', sub: 'backfeeds, shortfalls, surpluses' } },
    },
    {
      id: 'step3',
      caption: 'Optimization schedules devices within grid limits, economics and DOEs (Dynamic Operating Envelopes).',
      flow: { type: 'decision', from: { title: 'Optimization', sub: 'grid limits and economics' }, to: { title: 'Schedules', sub: 'and operating envelopes' } },
    },
    {
      id: 'step4',
      caption: 'The Gateway is the single point of communication with devices and aggregators.',
      flow: { type: 'command', from: { title: 'Gateway', sub: 'single point of contact' }, to: { title: 'Devices and aggregators', sub: 'new schedules' }, via: IEEE2030 },
    },
    {
      id: 'step5',
      caption: 'Operations gives operators one live view of devices and grid conditions.',
      flow: { type: 'data', from: { title: 'Devices', sub: 'live status' }, to: { title: 'Operations', sub: 'operators’ live view' } },
    },
    {
      id: 'step6',
      caption: 'Program Manager runs the customer programs that devices take part in.',
      flow: { type: 'decision', from: { title: 'Program Manager', sub: 'customer programs' }, to: { title: 'Enrolled devices', sub: 'who takes part' } },
    },
    {
      id: 'step7',
      caption: 'Markets Orchestration links devices to flexibility and energy markets.',
      flow: { type: 'data', from: { title: 'Markets Orchestration', sub: 'offers and results' }, to: { title: 'Market platforms', sub: 'flexibility and energy' } },
    },
    {
      id: 'step8',
      caption: 'Flex Planning studies the future in a separate study mode, including NWAs (Non-Wires Alternatives).',
      flow: { type: 'decision', from: { title: 'Flex Planning', sub: 'study mode' }, to: { title: 'Plans', sub: 'flexibility instead of new wires' } },
    },
    {
      id: 'step9',
      caption: 'Grid DERMS (Distributed Energy Resource Management System) works grid-wide; Edge DERMS works with aggregators and customer devices. A bridge keeps them coordinated.',
      flow: { type: 'data', from: { title: 'Grid side', sub: 'utility, grid-wide' }, to: { title: 'Edge side', sub: 'aggregators, customer devices' } },
    },
  ],
  labels: {
    derms: { title: 'DERMS', sub: 'Distributed Energy Resource Management System' },
    modelManager: { title: 'Model Manager', sub: 'model of every device' },
    forecasting: { title: 'Forecasting', sub: 'look-ahead analysis' },
    optimization: { title: 'Optimization', sub: 'schedules and envelopes' },
    gateway: { title: 'Gateway', sub: 'talks to devices' },
    operations: { title: 'Operations', sub: 'live view' },
    programManager: { title: 'Program Manager', sub: 'customer programs' },
    markets: { title: 'Markets Orchestration', sub: 'flexibility markets' },
    flex: { title: 'Flex Planning', sub: 'study mode' },
    battery: { title: 'Community battery', sub: 'shared storage' },
    grid: { title: 'Grid side', sub: 'utility, grid-wide' },
    edge: { title: 'Edge side', sub: 'aggregators, customer devices' },
  },
  packets: {
    status: 'Device status',
    schedule: 'New schedule',
  },
  legend: ['flow', 'data', 'command', 'ai'],
};

// ─────────────────────────────────────────────────────────────────
// Slide 14 — DERMS demo: too much rooftop solar
// ─────────────────────────────────────────────────────────────────
const sDermsDemo = {
  id: 'derms-demo',
  section: 'Distribution',
  phase: 3,
  scene: 's14-derms-demo',
  badge: true,
  title: 'Demo: too much rooftop solar on a sunny afternoon',
  subtitle: 'Solar pushes power backwards through the transformer. GridOS keeps it inside the limits.',
  blocks: [
    {
      kind: 'lead',
      heading: 'In one line',
      paras: ['At midday, rooftop solar beats local demand: power flows backwards through the transformer and voltage rises. GridOS DERMS (Distributed Energy Resource Management System) prevents it.'],
    },
    {
      kind: 'why',
      heading: 'Why it matters',
      items: [
        'Reverse flow can push voltage too high and overload the transformer.',
        'The same DERs (Distributed Energy Resources) can help at the evening peak.',
      ],
    },
    {
      kind: 'how',
      heading: 'How it works',
      ordered: true,
      items: [
        'Look-ahead analysis anticipates the backfeed.',
        'Optimization sets DOEs (Dynamic Operating Envelopes): how much each home may export.',
        'The Gateway sends limits by IEEE 2030.5 (IEEE smart energy profile for DER communication) or through aggregators.',
        'Batteries soak up midday solar.',
        'At the evening peak, batteries discharge and EV (Electric Vehicle) chargers pause.',
      ],
    },
    {
      kind: 'usage',
      heading: 'Try it',
      paras: ['Drag the time of day. Then switch DERMS (Distributed Energy Resource Management System) off and look at 13:00 and 18:30.'],
    },
  ],
  notes: ['Power, voltage and timings are illustrative.'],
  keyFacts: [
    {
      id: 'F-DERMS-7',
      text: 'GridOS DERMS (Distributed Energy Resource Management System) look-ahead analysis anticipates backfeeds and predicts power shortfalls or surpluses.',
    },
    {
      id: 'F-DERMS-2',
      text: 'Optimization schedules DERs (Distributed Energy Resources) within grid constraints, economics and DOEs (Dynamic Operating Envelopes). The Gateway is certified to IEEE 2030.5 (IEEE smart energy profile for DER communication).',
    },
  ],
  steps: [
    {
      id: 'step1',
      caption: '10:00 — solar rises; local demand is low.',
      flow: { type: 'reverse', from: { title: 'Rooftop solar', sub: '16 homes' }, to: { title: 'Transformer', sub: 'flow starts to reverse' } },
    },
    {
      id: 'step2',
      caption: 'DERMS (Distributed Energy Resource Management System) Forecasting predicts a reverse-flow peak at 13:00 that would push voltage over the limit.',
      flow: { type: 'decision', from: { title: 'Forecasting', sub: 'look-ahead analysis' }, to: { title: '13:00', sub: 'voltage over the limit' } },
    },
    {
      id: 'step3',
      caption: 'Optimization calculates a DOE (Dynamic Operating Envelope) for each home: how much it may export each hour.',
      flow: { type: 'decision', from: { title: 'Optimization', sub: 'grid limits' }, to: { title: 'DOEs', sub: 'Dynamic Operating Envelopes' } },
    },
    {
      id: 'step4',
      caption: 'The Gateway sends the envelopes by IEEE 2030.5 (IEEE smart energy profile for DER communication); aggregator homes get them through their aggregator. Batteries start charging.',
      flow: { type: 'command', from: { title: 'Gateway', sub: 'single point of contact' }, to: { title: 'Homes and aggregator', sub: 'new export limits' }, via: IEEE2030 },
    },
    {
      id: 'step5',
      caption: '13:00 — reverse flow stays within limits and voltage stays inside the band.',
      flow: { type: 'reverse', from: { title: 'Homes', sub: 'limited export' }, to: { title: 'Transformer', sub: 'voltage within limits' } },
    },
    {
      id: 'step6',
      caption: '18:30 — evening peak: batteries discharge and EV (Electric Vehicle) chargers pause.',
      flow: { type: 'command', from: DERMS, to: { title: 'Batteries and chargers', sub: 'discharge, pause charging' } },
    },
  ],
  labels: {
    derms: { title: 'DERMS', sub: 'Distributed Energy Resource Management System' },
    forecast: { title: 'Forecast', sub: 'demand and solar today' },
    transformer: { title: 'Transformer', sub: 'voltage gauge' },
    aggregator: { title: 'Aggregator', sub: 'manages some homes' },
  },
  chart: {
    demand: 'Demand',
    solar: 'Solar',
    now: 'Now',
    risk: 'Voltage risk',
    reverse: 'Reverse flow',
  },
  packets: {
    meter: 'Meter and weather data',
    envelope: 'Export limit',
    battery: 'Discharge',
    ev: 'Pause charging',
  },
  hud: {
    time: 'Time',
    voltage: 'Transformer voltage (per unit)',
    loading: 'Transformer loading',
  },
  controls: {
    hourLabel: 'Time of day',
    hourTip: 'Drag to any hour. Press Play or a step to return to the guided demo.',
    dermsLabel: 'DERMS (Distributed Energy Resource Management System) on',
    dermsTip: 'Switch off to see what happens without envelopes, batteries and charger control.',
  },
  legend: ['flow', 'reverse', 'warning', 'fault', 'data', 'command', 'restored'],
};

// ─────────────────────────────────────────────────────────────────
// Slide 15 — GridOS Field
// ─────────────────────────────────────────────────────────────────
const sField = {
  id: 'field',
  section: 'Distribution',
  phase: 3,
  scene: 's15-field',
  badge: true,
  title: 'GridOS Field: digital damage assessment',
  subtitle: 'From a broken pole to a verified record in the control room.',
  blocks: [
    {
      kind: 'lead',
      heading: 'In one line',
      paras: ['GridOS Field Damage Assessment links field crews and the control room: damage is recorded digitally at the source, checked against the network model and shared with ADMS (Advanced Distribution Management System), OMS (Outage Management System) and GIS (Geographic Information System).'],
    },
    {
      kind: 'why',
      heading: 'Why it matters',
      items: [
        'Paper notes and phone calls are slow and error-prone.',
        'A wrong pole number sends crews and materials to the wrong place.',
      ],
    },
    {
      kind: 'how',
      heading: 'How it works',
      ordered: true,
      items: [
        'The crew records photos and damage on a tablet.',
        'GridOS Field checks the asset against the network model.',
        'The verified record syncs to ADMS (Advanced Distribution Management System), OMS (Outage Management System) and GIS (Geographic Information System).',
        'Crews always work with the latest map and network context.',
      ],
    },
    {
      kind: 'example',
      heading: 'Example',
      paras: ['After a storm, a crew types the wrong pole number. GridOS Field spots it and suggests the right one.'],
    },
  ],
  notes: ['Pole numbers and the form are illustrative.'],
  keyFacts: [
    {
      id: 'F-FIELD-1',
      text: 'GridOS Field Damage Assessment digitizes assessments at the source, validates them against the network model and synchronizes them across ADMS (Advanced Distribution Management System), OMS (Outage Management System) and GIS (Geographic Information System).',
    },
    {
      id: 'F-G4D-1',
      text: 'GridOS Field is one of the five applications in GridOS for Distribution, launched in February 2026.',
    },
  ],
  steps: [
    {
      id: 'step1',
      caption: 'A crew reaches a broken pole.',
      flow: { type: 'event', from: { title: 'Storm', sub: 'snaps a pole' }, to: { title: 'Crew', sub: 'on site' } },
    },
    {
      id: 'step2',
      caption: 'They capture photos and damage details on the tablet.',
      flow: { type: 'data', from: { title: 'Crew', sub: 'photos and damage details' }, to: { title: 'GridOS Field', sub: 'digital damage form' } },
    },
    {
      id: 'step3',
      caption: 'GridOS Field checks the entry against the network model — a wrong pole number is caught and corrected.',
      flow: { type: 'decision', from: { title: 'GridOS Field', sub: 'validation' }, to: { title: 'Network model', sub: 'is this pole here?' } },
    },
    {
      id: 'step4',
      caption: 'The verified record syncs to ADMS (Advanced Distribution Management System), OMS (Outage Management System) and GIS (Geographic Information System) at once.',
      flow: { type: 'data', from: { title: 'GridOS Field', sub: 'verified record' }, to: { title: 'Control-room systems', sub: 'outage, network and map views' } },
    },
    {
      id: 'step5',
      caption: 'Operators now see verified field data and can plan the repair.',
      flow: { type: 'decision', from: { title: 'Control room', sub: 'verified damage on the map' }, to: { title: 'Repair plan', sub: 'crew, materials, time' } },
    },
  ],
  labels: {
    adms: { title: 'ADMS', sub: 'Advanced Distribution Management System' },
    oms: { title: 'OMS', sub: 'Outage Management System' },
    gis: { title: 'GIS', sub: 'Geographic Information System' },
    tablet: { title: 'Crew tablet', sub: 'GridOS Field' },
    pole: { title: 'Broken pole', sub: 'P-1047' },
    model: { title: 'Network model', sub: 'where every asset is' },
  },
  form: {
    title: 'Damage report',
    asset: 'Asset number',
    wrong: 'P-1074',
    right: 'P-1047',
    damage: 'Damage',
    damageValue: 'Pole snapped, line down',
    photo: 'Photo',
    materials: 'Materials',
    materialsValue: '1 pole, 40 m conductor',
    checkWarn: 'Asset not at this location — did you mean P-1047?',
    checkOk: 'Matches the network model',
    synced: 'Synced to the control room',
  },
  panelText: {
    record: 'New damage record',
    pole: 'P-1047',
    plan: 'Repair planned',
  },
  packets: {
    check: 'Check P-1074',
    reply: 'Not here: P-1047?',
    recheck: 'Check P-1047',
    match: 'Match',
    record: 'Verified record',
  },
  hud: {
    label: 'Record',
    draft: 'Draft',
    checking: 'Checking',
    verified: 'Verified',
    synced: 'Synced',
  },
  legend: ['fault', 'data', 'ai', 'restored', 'warning'],
};

// ─────────────────────────────────────────────────────────────────
// Slide 16 — GridOS Visual Intelligence
// ─────────────────────────────────────────────────────────────────
const sVi = {
  id: 'visual-intelligence',
  section: 'Distribution',
  phase: 3,
  scene: 's16-visual-intelligence',
  badge: true,
  title: 'GridOS VI (Visual Intelligence): AI (Artificial Intelligence) on drone, satellite and LiDAR (Light Detection and Ranging) images',
  subtitle: 'Finding risky trees and worn assets along a power line — from images, not patrols.',
  blocks: [
    {
      kind: 'lead',
      heading: 'In one line',
      paras: ['GridOS VI (Visual Intelligence) uses AI (Artificial Intelligence) on drone, satellite, thermal and camera images and LiDAR (Light Detection and Ranging) point clouds to find vegetation and asset risks.'],
    },
    {
      kind: 'why',
      heading: 'Why it matters',
      items: [
        'Trees touching lines cause outages and wildfires.',
        'Checking long lines by eye is slow and costly.',
      ],
    },
    {
      kind: 'how',
      heading: 'How it works',
      ordered: true,
      items: [
        'Drones, satellites and LiDAR (Light Detection and Ranging) capture the line corridor.',
        'Ready-to-use deep-learning models analyse the images in the cloud.',
        'Findings are overlaid on the network map.',
        'Results become prioritized work orders.',
      ],
    },
    {
      kind: 'example',
      heading: 'Use cases',
      paras: ['Vegetation management, wildfire mitigation, asset inspection (sagging poles, corrosion, wear) and storm damage assessment.'],
    },
    {
      kind: 'usage',
      heading: 'Try it',
      paras: ['Change the data source to see what each one can and cannot detect.'],
    },
  ],
  notes: ['Scores, findings and distances are illustrative.'],
  keyFacts: [
    {
      id: 'F-VI-2',
      text: 'A cloud SaaS (Software as a Service) platform with ready-to-use deep-learning models. It overlays imagery on network maps and generates prioritized, actionable work orders.',
    },
    {
      id: 'F-VI-4',
      text: 'Accurate GIS (Geographic Information System) data and high-quality LiDAR (Light Detection and Ranging) or photo datasets are needed to train AI (Artificial Intelligence) for asset inspection.',
    },
    {
      id: 'F-VI-5',
      text: 'GE Vernova announced the acquisition of Alteia, a French visual-AI (Artificial Intelligence) company, in July 2025.',
    },
  ],
  steps: [
    {
      id: 'step1',
      caption: 'A drone and a satellite capture images of the line corridor.',
      flow: { type: 'data', from: { title: 'Drone and satellite', sub: 'images of the corridor' }, to: VI, via: { title: 'SaaS', sub: 'Software as a Service' } },
    },
    {
      id: 'step2',
      caption: 'LiDAR (Light Detection and Ranging) turns the corridor into a 3D point cloud.',
      flow: { type: 'data', from: { title: 'LiDAR', sub: 'Light Detection and Ranging' }, to: { title: 'Point cloud', sub: 'every tree and pole in 3D' } },
    },
    {
      id: 'step3',
      caption: 'VI (Visual Intelligence) overlays the network model and draws a safety clearance zone around each conductor.',
      flow: { type: 'decision', from: VI, to: { title: 'Clearance zones', sub: 'around each conductor' } },
    },
    {
      id: 'step4',
      caption: 'AI (Artificial Intelligence) finds trees inside the clearance zone and scores their risk.',
      flow: { type: 'decision', from: { title: 'AI', sub: 'Artificial Intelligence' }, to: { title: '4 trees', sub: 'inside the zone, risk scored' } },
    },
    {
      id: 'step5',
      caption: 'AI (Artificial Intelligence) also flags asset problems: a leaning pole and a corroded cross-arm.',
      flow: { type: 'decision', from: { title: 'AI', sub: 'Artificial Intelligence' }, to: { title: '2 assets', sub: 'leaning pole, corroded cross-arm' } },
    },
    {
      id: 'step6',
      caption: 'Findings become a prioritized work-order list for vegetation and maintenance crews.',
      flow: { type: 'command', from: VI, to: { title: 'Work orders', sub: 'high, medium, low' } },
    },
  ],
  labels: {
    vi: { title: 'VI', sub: 'Visual Intelligence' },
    drone: { title: 'Drone', sub: 'camera and LiDAR (Light Detection and Ranging)' },
    satellite: { title: 'Satellite', sub: 'wide-area images' },
  },
  findings: {
    tree: 'Tree · risk {score}',
    pole: 'Leaning pole · {conf} confidence',
    arm: 'Corroded cross-arm · {conf} confidence',
  },
  workOrders: {
    title: 'Work orders, by priority',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    tree: 'Trim tree, span {n}',
    pole: 'Straighten leaning pole',
    arm: 'Replace corroded cross-arm',
  },
  packets: {
    images: 'Images',
    scan: 'LiDAR (Light Detection and Ranging) scan',
  },
  hud: {
    found: 'Findings detected',
    foundFormat: '{n} of {total}',
  },
  controls: {
    sourceLabel: 'Data source',
    sourceTip: 'Each source sees different things.',
    sources: {
      all: 'All sources',
      satellite: 'Satellite images',
      lidar: 'LiDAR (Light Detection and Ranging) scan',
      photo: 'Drone photos',
    },
    infoTitle: 'What this source can see',
    tradeoffs: {
      all: 'Together, the sources find every issue in this demo.',
      satellite: 'Satellite: covers wide areas quickly but is coarse — it finds big tree encroachments, not small defects.',
      lidar: 'LiDAR (Light Detection and Ranging): precise 3D clearance distances for trees and pole lean; it cannot see rust.',
      photo: 'Drone photos: sharp detail such as corrosion and lean, but no exact clearance distance.',
    },
  },
  legend: ['ai', 'data', 'flow', 'warning'],
};

export const phase3 = {
  'adms-vvo': sVvo,
  'adms-oms': sOms,
  'derms-overview': sDermsOverview,
  'derms-demo': sDermsDemo,
  field: sField,
  'visual-intelligence': sVi,
};
