// Phase 4 slide content: transmission and markets (Slides 17–22).
// Same rules and shape as slides.js (see the writing-style and rules header there).
// Export: an object keyed by slide id. Slides listed here replace the placeholders in slides.js.

// Flow ends reused on several slides.
const AEMS = { title: 'AEMS', sub: 'Advanced Energy Management System' };
const DDLR = { title: 'DDLR', sub: 'Digital Dynamic Line Rating' };
const WAMS = { title: 'WAMS', sub: 'Wide Area Monitoring System' };
const SCADA = { title: 'SCADA', sub: 'Supervisory Control and Data Acquisition' };
const PDC = { title: 'PDC', sub: 'Phasor Data Concentrator' };
const FORECASTING = { title: 'GridOS Forecasting', sub: 'load and renewables' };
const MARKETS = { title: 'GridOS Markets', sub: 'market platform' };

// ─────────────────────────────────────────────────────────────────
// Slide 17 — GridOS for Transmission overview
// ─────────────────────────────────────────────────────────────────
const sTransmissionOverview = {
  id: 'transmission-overview',
  section: 'Transmission',
  title: 'GridOS for Transmission: three tiers, four competencies',
  subtitle: 'One coordinated system for the high-voltage grid.',
  phase: 4,
  scene: 's17-transmission-overview',
  badge: true,
  blocks: [
    {
      kind: 'lead',
      heading: 'In one line',
      paras: ['GridOS for Transmission helps utilities run the transmission grid as one coordinated system. AEMS (Advanced Energy Management System) stays at the core; GridOS applications add intelligence on top.'],
    },
    {
      kind: 'why',
      heading: 'Why it matters',
      items: [
        'More renewables and large new loads make the grid harder to predict.',
        'Separate tools give separate views; one coordinated system gives one view.',
      ],
    },
    {
      kind: 'how',
      heading: 'How it works: three tiers',
      ordered: true,
      items: [
        'Data foundation: GridOS Data Fabric and Connect.',
        'Operational core: AEMS (Advanced Energy Management System).',
        'Intelligence layer: DDLR (Digital Dynamic Line Rating), WAMS (Wide Area Monitoring System) and Forecasting, plus VI (Visual Intelligence) and Markets as add-ons.',
        'Together they form a continuous decision loop.',
      ],
    },
    {
      kind: 'why',
      heading: 'Four operational competencies',
      items: ['Network Awareness', 'Capacity Management', 'Stability Management', 'Grid Resilience'],
      note: 'Which applications support each competency is this deck’s illustration, based on what each application does — not a GE Vernova statement.',
    },
    {
      kind: 'example',
      heading: 'Adoption journey',
      ordered: true,
      items: [
        'Establish trusted network awareness.',
        'Strengthen operational coordination.',
        'Operate with predictive intelligence.',
      ],
    },
  ],
  keyFacts: [
    {
      id: 'F-G4T-3',
      text: 'GridOS for Transmission is not a replacement for the EMS (Energy Management System). The EMS stays at the operational core of the control room.',
    },
    {
      id: 'F-G4T-1',
      text: 'Introduced on 9 June 2026 at Orchestrate 2026 in Atlanta, alongside two AI (Artificial Intelligence) whitepapers.',
    },
    {
      id: 'F-G4T-2',
      text: 'Applications: AEMS (Advanced Energy Management System), DDLR (Digital Dynamic Line Rating), WAMS (Wide Area Monitoring System) and Forecasting, with VI (Visual Intelligence) and Markets as add-ons.',
    },
  ],
  steps: [
    {
      id: 'step1',
      caption: 'Data foundation: GridOS Data Fabric and Connect gather data from every substation and business system.',
      flow: { type: 'data', from: { title: 'Substations and systems', sub: 'field measurements' }, to: { title: 'Data Fabric and Connect', sub: 'data foundation' } },
    },
    {
      id: 'step2',
      caption: 'Operational core: AEMS (Advanced Energy Management System) runs the control room.',
      flow: { type: 'data', from: { title: 'Data Fabric', sub: 'trusted network data' }, to: AEMS },
    },
    {
      id: 'step3',
      caption: 'Intelligence layer: specialised applications extend AEMS (Advanced Energy Management System). Markets and VI (Visual Intelligence) are add-ons.',
      flow: { type: 'decision', from: { title: 'GridOS applications', sub: 'ratings, dynamics, forecasts' }, to: AEMS },
    },
    {
      id: 'step4',
      caption: 'Network Awareness: one trusted, real-time view of the whole transmission network.',
      flow: { type: 'data', from: { title: 'Whole network', sub: 'live measurements' }, to: AEMS },
    },
    {
      id: 'step5',
      caption: 'Capacity Management: use each line’s real capacity safely, not just a worst-case limit.',
      flow: { type: 'decision', from: DDLR, to: { title: 'Line ratings', sub: 'updated with the weather' } },
    },
    {
      id: 'step6',
      caption: 'Stability Management: watch fast grid dynamics and keep the grid stable.',
      flow: { type: 'data', from: WAMS, to: AEMS },
    },
    {
      id: 'step7',
      caption: 'Grid Resilience: prepare for extreme events and recover quickly.',
      flow: { type: 'command', from: AEMS, to: { title: 'Substations', sub: 'restoration and control actions' } },
    },
  ],
  labels: {
    aems: { title: 'AEMS', sub: 'Advanced Energy Management System' },
    fabric: { title: 'Data Fabric and Connect', sub: 'Data foundation' },
    apps: { title: 'Intelligence layer', sub: 'GridOS applications' },
    ddlr: { title: 'DDLR', sub: 'Digital Dynamic Line Rating' },
    wams: { title: 'WAMS', sub: 'Wide Area Monitoring System' },
    forecasting: { title: 'Forecasting', sub: 'GridOS Forecasting' },
    vi: { title: 'VI', sub: 'Visual Intelligence · add-on' },
    markets: { title: 'Markets', sub: 'GridOS Markets · add-on' },
    awareness: { title: 'Network Awareness', sub: 'see the whole network' },
    capacity: { title: 'Capacity Management', sub: 'use real line capacity' },
    stability: { title: 'Stability Management', sub: 'keep the grid stable' },
    resilience: { title: 'Grid Resilience', sub: 'prepare and recover' },
    wind: { title: 'Wind farm' },
    gas: { title: 'Gas plant' },
    dataCenter: { title: 'Data-center campus', sub: 'large new load' },
  },
  packets: {
    measurements: 'Measurements',
    state: 'Network state',
    insight: 'Insight',
    rating: 'New line rating',
    command: 'Control action',
  },
  legend: ['flow', 'data', 'command'],
};

// ─────────────────────────────────────────────────────────────────
// Slide 18 — AEMS demo
// ─────────────────────────────────────────────────────────────────
const sAems = {
  id: 'aems',
  section: 'Transmission',
  title: 'Demo: AEMS (Advanced Energy Management System) — state estimation, contingency analysis, restoration',
  subtitle: 'Three control-room jobs on a small six-bus network.',
  phase: 4,
  scene: 's18-aems',
  badge: true,
  blocks: [
    {
      kind: 'lead',
      heading: 'In one line',
      paras: ['GridOS AEMS (Advanced Energy Management System) is the transmission control-room core: EMS (Energy Management System), WAMS (Wide Area Monitoring System) and analytics in one.'],
    },
    {
      kind: 'why',
      heading: 'Why it matters',
      items: [
        'Operators must know the true state of the grid at every moment.',
        'The grid must stay secure even if any one line or generator fails.',
        'After a blackout, every minute of restoration counts.',
      ],
    },
    {
      kind: 'how',
      heading: 'How it works',
      note: 'Standard control-room methods, simplified. Flows are in MW (megawatt) and illustrative.',
      ordered: true,
      items: [
        'State estimation: combine noisy measurements into the most likely grid state.',
        'Bad-data detection: flag a reading that does not fit the others.',
        'Contingency analysis: test the loss of each element — the N-1 (loss of any one element) check.',
        'Re-dispatch: change generator outputs before a problem can happen.',
        'Restoration: plan which units start first and which lines re-energize, in order.',
      ],
    },
    {
      kind: 'example',
      heading: 'Example',
      paras: ['Losing line 3–5 would push line 2–5 to 112% of its rating, so generation is re-dispatched in advance.'],
    },
  ],
  keyFacts: [
    {
      id: 'F-AEMS-1',
      text: 'AEMS (Advanced Energy Management System) comprises EMS (Energy Management System), WAMS (Wide Area Monitoring System) and analytics applications.',
    },
    {
      id: 'F-AEMS-2',
      text: 'EMS (Energy Management System) functions include state estimation, contingency analysis, economic dispatch and OPF (Optimal Power Flow).',
    },
    {
      id: 'F-AEMS-3',
      text: 'Advanced functions include automated voltage control, grid restoration, and real-time and look-ahead security analysis.',
    },
    {
      id: 'F-AEMS-4',
      text: 'Fully compliant with NERC CIP (North American Electric Reliability Corporation Critical Infrastructure Protection) 002–009.',
    },
    {
      id: 'F-AEMS-5',
      text: 'Auto-restoration plan in under 10 seconds for an area covering 3.5 million people.',
      qualifier: 'single demonstration project, PG&E (Pacific Gas and Electric), US (United States)',
    },
  ],
  steps: [
    {
      id: 'step1',
      caption: 'SCADA (Supervisory Control and Data Acquisition) sends thousands of measurements — some noisy, some wrong.',
      flow: { type: 'data', from: { title: 'Substations', sub: 'flow and voltage readings' }, to: AEMS, via: SCADA },
    },
    {
      id: 'step2',
      caption: 'State estimation finds the most likely true state that fits all the measurements together.',
      flow: { type: 'decision', from: AEMS, to: { title: 'Network state', sub: 'best estimate' } },
    },
    {
      id: 'step3',
      caption: 'Bad-data detection flags the measurement that does not fit: line 1–4 reads 480 MW, but physics says about 120.',
      flow: { type: 'decision', from: AEMS, to: { title: 'Line 1–4 reading', sub: 'flagged as suspect' } },
    },
    {
      id: 'step4',
      caption: 'Contingency analysis asks: what if each line trips? This is the N-1 (loss of any one element) check.',
      flow: { type: 'decision', from: AEMS, to: { title: 'N-1', sub: 'loss of any one element, one case at a time' } },
    },
    {
      id: 'step5',
      caption: 'One case fails: losing line 3–5 would overload line 2–5 to 112%.',
      flow: { type: 'event', from: { title: 'Line 3–5 lost', sub: 'simulated case' }, to: { title: 'Line 2–5', sub: '112% of its rating' } },
    },
    {
      id: 'step6',
      caption: 'The operator re-dispatches generation in advance; the N-1 (loss of any one element) case is now secure.',
      flow: { type: 'command', from: AEMS, to: { title: 'Generators', sub: 'raise bus 1, lower bus 2' } },
    },
    {
      id: 'step7',
      caption: 'Worst case: a storm trips part of the network and a region blacks out.',
      flow: { type: 'event', from: { title: 'Storm damage', sub: 'lines trip' }, to: { title: 'Buses 3, 5 and 6', sub: 'dark' } },
    },
    {
      id: 'step8',
      caption: 'AEMS (Advanced Energy Management System) builds a restoration plan: which units start first and which lines energize in what order.',
      flow: [
        { type: 'decision', from: AEMS, to: { title: 'Restoration plan', sub: 'five ordered steps' } },
        { type: 'command', from: { title: 'Restoration plan', sub: 'five ordered steps' }, to: { title: 'Breakers', sub: 'close in order' } },
      ],
    },
    {
      id: 'step9',
      caption: 'Vendor-reported: GridOS AEMS (Advanced Energy Management System) built a restoration plan in under 10 seconds for an area of 3.5 million people (single demonstration project).',
      flow: { type: 'decision', from: AEMS, to: { title: 'Plan ready', sub: 'under 10 seconds, vendor-reported' } },
    },
  ],
  labels: {
    aems: { title: 'AEMS', sub: 'Advanced Energy Management System' },
    gen1: { title: 'Generator', sub: 'gas plant, bus 1' },
    gen2: { title: 'Generator', sub: 'gas plant, bus 2' },
    wind: { title: 'Wind farm', sub: 'bus 3' },
    load4: { title: 'City', sub: 'load, bus 4' },
    load5: { title: 'City', sub: 'load, bus 5' },
    load6: { title: 'Data center', sub: 'load, bus 6' },
    fact: { title: 'Plan ready in under 10 seconds', sub: 'Vendor-reported · single demonstration project, PG&E, US' },
  },
  aems: {
    busTag: 'B{n}',
    busTip: 'Bus {n}: a high-voltage substation',
    flowLabel: '{mw} MW',
    suspect: 'Suspect: {mw} MW',
    loading: '{pct}%',
    hudMismatch: 'Measurement mismatch',
    hudWorst: 'Worst loading if one element is lost',
    hudRestored: 'Load restored',
    mismatchValue: '{mw} MW',
    pctValue: '{pct}%',
  },
  packets: {
    measurement: 'Measurements',
    redispatch: 'New set-point',
    close: 'Close breaker',
  },
  legend: ['flow', 'warning', 'fault', 'off', 'data', 'command', 'restored'],
};

// ─────────────────────────────────────────────────────────────────
// Slide 19 — DDLR demo
// ─────────────────────────────────────────────────────────────────
const sDdlr = {
  id: 'ddlr',
  section: 'Transmission',
  title: 'Demo: DDLR (Digital Dynamic Line Rating) — interactive weather sliders',
  subtitle: 'How much power can this line carry right now?',
  phase: 4,
  scene: 's19-ddlr',
  badge: true,
  blocks: [
    {
      kind: 'lead',
      heading: 'In one line',
      paras: ['GridOS DDLR (Digital Dynamic Line Rating) works out how much power a line can safely carry right now, from weather data — with no sensors on the line.'],
    },
    {
      kind: 'why',
      heading: 'Why it matters',
      items: [
        'An SLR (Static Line Rating) assumes worst-case weather all year.',
        'So most of the time lines carry less than they safely could.',
      ],
    },
    {
      kind: 'how',
      heading: 'How it works',
      note: 'This demo uses a simplified teaching model. Real DDLR (Digital Dynamic Line Rating) follows IEEE 738 (IEEE standard for calculating conductor temperature and current). Here 1.00 pu (per unit) = 400 MW (megawatt), illustrative.',
      ordered: true,
      items: [
        'Combine line, network and asset data with hourly weather.',
        'Balance the heat: wind and cold air cool the wire, sun and current heat it.',
        'The current that keeps the wire below its maximum temperature is the rating.',
        'Publish ratings for now and up to 10 days ahead.',
      ],
    },
    {
      kind: 'example',
      heading: 'Try it',
      paras: ['Move the sliders: cool, windy weather lets the line carry the 480 MW the grid needs; a hot, still, sunny day does not.'],
    },
  ],
  keyFacts: [
    {
      id: 'F-DDLR-1',
      text: 'DDLR (Digital Dynamic Line Rating) combines GIS (Geographic Information System), EMS (Energy Management System) and asset data with hourly weather, and computes ratings without sensors or new infrastructure.',
    },
    {
      id: 'F-DDLR-2',
      text: 'Ratings follow IEEE 738 (IEEE standard for calculating conductor temperature and current), in real time and up to 10 days ahead, in DLR (Dynamic Line Rating), AAR (Ambient Adjusted Rating) and emergency modes. They support FERC 881 (Federal Energy Regulatory Commission Order No. 881) and FAC-008 (NERC facility ratings standard).',
    },
    {
      id: 'F-DDLR-3',
      text: 'Up to 33% more line capacity, and up to 250× lower investment than sensor-based solutions.',
      qualifier: 'GE Vernova figures',
      footnote: 'GE Vernova’s AEMS (Advanced Energy Management System) page cites up to 90% more transmission capacity in favourable weather, from a single demonstration project (PPL (Pennsylvania Power and Light), US (United States)).',
    },
  ],
  steps: [
    {
      id: 'step1',
      caption: 'The SLR (Static Line Rating) assumes a hot, still, sunny day — every day. The line may carry only 400 MW.',
      flow: { type: 'decision', from: { title: 'SLR', sub: 'Static Line Rating' }, to: { title: 'Line', sub: '400 MW all year' } },
    },
    {
      id: 'step2',
      caption: 'AAR (Ambient Adjusted Rating): on a cool night the rating rises.',
      flow: [
        { type: 'data', from: { title: 'Weather', sub: 'air temperature' }, to: DDLR },
        { type: 'decision', from: DDLR, to: { title: 'AAR', sub: 'Ambient Adjusted Rating' } },
      ],
    },
    {
      id: 'step3',
      caption: 'DLR (Dynamic Line Rating): wind cooling raises it further — now the line can carry the 480 MW the grid needs.',
      flow: [
        { type: 'data', from: { title: 'Weather', sub: 'wind speed and direction' }, to: DDLR },
        { type: 'decision', from: DDLR, to: { title: 'DLR', sub: 'Dynamic Line Rating' } },
      ],
    },
    {
      id: 'step4',
      caption: 'Forecasts up to 10 days ahead let operators plan power transfers in advance.',
      flow: [
        { type: 'data', from: { title: 'Weather forecast', sub: 'up to 10 days' }, to: DDLR },
        { type: 'data', from: DDLR, to: { title: 'Operators', sub: 'plan transfers ahead' } },
      ],
    },
  ],
  labels: {
    ddlr: { title: 'DDLR', sub: 'Digital Dynamic Line Rating' },
    station: { title: 'Weather data', sub: 'hourly, no line sensors' },
    slr: { title: 'SLR', sub: 'Static Line Rating' },
    aar: { title: 'AAR', sub: 'Ambient Adjusted Rating' },
    dlr: { title: 'DLR', sub: 'Dynamic Line Rating' },
    demand: { title: 'Grid needs 480 MW', sub: 'requested transfer' },
    sun: { title: 'Sun', sub: 'heats the wire' },
    wind: { title: 'Wind', sub: 'cools the wire' },
  },
  ddlr: {
    ratingTitle: 'Line rating',
    ratingValue: '{pu} pu · {mw} MW',
    tempTitle: 'Wire temperature',
    tempValue: '{t} °C · max 75 °C',
    airTitle: 'Air temperature',
    airValue: '{t} °C',
    forecastTitle: '10-day rating forecast (illustrative)',
    forecastDay: 'Day {n}',
    forecastNeed: '480 MW needed',
    hudRating: 'Line rating',
    hudFlow: 'Power on the line',
    hudFlowValue: '{mw} of 480 MW needed',
    // Short tag under the 3D view; the full statement is the note in the text panel.
    hudModel: 'Simplified teaching model',
  },
  packets: {
    weather: 'Hourly weather',
    rating: 'New rating',
  },
  controls: {
    temp: 'Air',
    tempUnit: '{v} °C',
    wind: 'Wind',
    windUnit: '{v} m/s',
    angle: 'Wind angle',
    angleUnit: '{v}° to the line',
    solar: 'Sun',
    solarUnit: '{v} W/m²',
    mode: 'Rating mode',
    modes: [
      { value: 'SLR', label: 'SLR (Static Line Rating)' },
      { value: 'AAR', label: 'AAR (Ambient Adjusted Rating)' },
      { value: 'DLR', label: 'DLR (Dynamic Line Rating)' },
    ],
  },
  legend: ['flow', 'warning', 'fault', 'data', 'restored'],
};

// ─────────────────────────────────────────────────────────────────
// Slide 20 — WAMS demo
// ─────────────────────────────────────────────────────────────────
const sWams = {
  id: 'wams',
  section: 'Transmission',
  title: 'Demo: WAMS (Wide Area Monitoring System) — catching oscillations with PMUs (Phasor Measurement Units)',
  subtitle: 'Seeing fast swings across a whole region, and finding where they start.',
  phase: 4,
  scene: 's20-wams',
  badge: true,
  blocks: [
    {
      kind: 'lead',
      heading: 'In one line',
      paras: ['GridOS WAMS (Wide Area Monitoring System) watches fast grid dynamics across a whole region, using PMUs (Phasor Measurement Units).'],
    },
    {
      kind: 'why',
      heading: 'Why it matters',
      items: [
        'Fast power swings can grow and cause a blackout.',
        'SCADA (Supervisory Control and Data Acquisition) updates every few seconds — too slow to see them.',
      ],
    },
    {
      kind: 'how',
      heading: 'How it works',
      note: 'Mode frequency, damping and inertia values are illustrative. Hz (hertz) means cycles per second.',
      ordered: true,
      items: [
        'PMUs (Phasor Measurement Units) measure voltage and current many times per second, time-stamped by GPS (Global Positioning System).',
        'A PDC (Phasor Data Concentrator) lines the streams up in time.',
        'OSM (Oscillation Monitoring) spots swings and measures their damping.',
        'OSL (Oscillation Source Location) finds where they start.',
        'Effective inertia metering shows how well the grid resists sudden changes.',
      ],
    },
    {
      kind: 'example',
      heading: 'Try it',
      paras: ['Raise the renewable share: effective inertia falls, and the frequency dip after a generator trip gets deeper.'],
    },
  ],
  keyFacts: [
    {
      id: 'F-WAMS-1',
      text: 'GE Vernova material shows PMU (Phasor Measurement Unit) data at 60 FPS (Frames Per Second) — far faster than traditional SCADA (Supervisory Control and Data Acquisition) scans.',
    },
    {
      id: 'F-WAMS-2',
      text: 'Applications: Oscillation Monitoring and Source Location, Disturbance Detection, Islanding Re-Synchronization Support, Effective Inertia Metering, and Dynamic Model Validation and Calibration.',
    },
    {
      id: 'F-WAMS-3',
      text: 'Built on about 20 years of PhasorPoint WAMS (Wide Area Monitoring System) experience; winner of the 2021 IEEE (Institute of Electrical and Electronics Engineers) NASPI (North American SynchroPhasor Initiative) Oscillation Source Location contest.',
    },
    {
      id: 'F-WAMS-4',
      text: 'Extended to detect load-driven oscillations at data-center interconnections.',
    },
    {
      id: 'F-WAMS-5',
      text: 'Disturbance analysis reduced from days to hours.',
      qualifier: 'GE Vernova customer claim',
    },
  ],
  steps: [
    {
      id: 'step1',
      caption: 'PMUs (Phasor Measurement Units) stream synchronized measurements many times per second; SCADA (Supervisory Control and Data Acquisition) updates only every few seconds.',
      flow: [
        { type: 'data', from: { title: 'PMUs', sub: 'Phasor Measurement Units, 60 per second' }, to: PDC },
        { type: 'data', from: PDC, to: WAMS },
      ],
    },
    {
      id: 'step2',
      caption: 'A forced oscillation starts somewhere in the grid.',
      flow: { type: 'event', from: { title: 'Unknown source', sub: 'somewhere in the grid' }, to: { title: 'Whole region', sub: 'power swings back and forth' } },
    },
    {
      id: 'step3',
      caption: 'OSM (Oscillation Monitoring) detects it and measures its frequency and damping.',
      flow: { type: 'decision', from: WAMS, to: { title: 'OSM', sub: 'Oscillation Monitoring: 0.25 Hz, damping too low' } },
    },
    {
      id: 'step4',
      caption: 'OSL (Oscillation Source Location) traces where it comes from: the data-center campus.',
      flow: { type: 'decision', from: WAMS, to: { title: 'OSL', sub: 'Oscillation Source Location: data-center campus' } },
    },
    {
      id: 'step5',
      caption: 'Operators contact the source and remove the oscillation before it can cause a blackout.',
      flow: { type: 'command', from: { title: 'Operators', sub: 'contact the source' }, to: { title: 'Data-center campus', sub: 'oscillation removed' } },
    },
    {
      id: 'step6',
      caption: 'Effective inertia metering shows how much rotating inertia the grid has right now.',
      flow: { type: 'data', from: WAMS, to: { title: 'Effective inertia', sub: 'measured right now' } },
    },
  ],
  labels: {
    pdc: { title: 'PDC', sub: 'Phasor Data Concentrator' },
    wams: { title: 'WAMS', sub: 'Wide Area Monitoring System' },
    pmu: { title: 'PMU', sub: 'Phasor Measurement Unit · 60 per second' },
    rtu: { title: 'RTU', sub: 'Remote Terminal Unit · every few seconds' },
    gps: { title: 'GPS', sub: 'Global Positioning System time' },
    source: { title: 'Data-center campus', sub: 'oscillation source' },
    inertia: { title: 'Effective inertia', sub: 'falls as renewables rise' },
  },
  wams: {
    chartTitle: 'Grid frequency (illustrative)',
    chartMode: 'Mode {f} Hz · damping {d}%',
    chartDip: 'After a generator trip: dip {dip} Hz',
    hudMode: 'Oscillation',
    hudModeValue: '{f} Hz',
    hudDamping: 'Damping',
    hudDampingValue: '{d}%',
    hudInertia: 'Effective inertia',
    hudInertiaValue: '{h} s',
    hudDip: 'Frequency dip after a trip',
    hudDipValue: '{dip} Hz',
  },
  packets: {
    pmu: '60 per second',
    scada: 'Every 4 seconds',
    osl: 'Source located',
  },
  controls: {
    share: 'Renewable share',
    shareUnit: '{v}%',
  },
  legend: ['flow', 'fault', 'data', 'command', 'ai', 'restored'],
};

// ─────────────────────────────────────────────────────────────────
// Slide 21 — Forecasting
// ─────────────────────────────────────────────────────────────────
const sForecasting = {
  id: 'forecasting',
  section: 'Transmission',
  title: 'GridOS Forecasting: load and renewable forecasts',
  subtitle: 'Tomorrow, hour by hour: a cloudy morning, a sunny afternoon, a windy night and a data center ramping up.',
  phase: 4,
  scene: 's21-forecasting',
  badge: true,
  blocks: [
    {
      kind: 'lead',
      heading: 'In one line',
      paras: ['GridOS Forecasting predicts load and renewable generation, so operators can plan ahead instead of reacting.'],
    },
    {
      kind: 'why',
      heading: 'Why it matters',
      items: [
        'Solar and wind output change with the weather.',
        'Large new loads, such as data centers, can ramp up quickly.',
      ],
    },
    {
      kind: 'how',
      heading: 'How it works',
      note: 'Curves and reserve values are illustrative. Power is in MW (megawatt).',
      ordered: true,
      items: [
        'Start from weather forecasts, history and calendar patterns.',
        'Forecast solar, wind and load hour by hour.',
        'Add an uncertainty band: how far the real values may drift.',
        'Feed the forecasts into scheduling and look-ahead line ratings.',
      ],
    },
    {
      kind: 'example',
      heading: 'Example',
      paras: ['A wide band in the evening tells operators to hold more reserve then.'],
    },
  ],
  keyFacts: [
    {
      id: 'F-FC-1',
      text: 'GridOS Forecasting forecasts load and renewable generation, helping operators anticipate variability and align dispatch decisions.',
    },
    {
      id: 'F-AEMS-3',
      text: 'AEMS (Advanced Energy Management System) offers AI (Artificial Intelligence)-based applications for renewables forecasting and inertia projections.',
    },
  ],
  steps: [
    {
      id: 'step1',
      caption: 'Forecasts start from weather, history and calendar patterns.',
      flow: { type: 'data', from: { title: 'Weather, history, calendar', sub: 'inputs' }, to: FORECASTING },
    },
    {
      id: 'step2',
      caption: 'Solar forecast: low in the cloudy morning, strong in the afternoon.',
      flow: { type: 'decision', from: FORECASTING, to: { title: 'Solar', sub: 'low morning, strong afternoon' } },
    },
    {
      id: 'step3',
      caption: 'Wind forecast: rising overnight.',
      flow: { type: 'decision', from: FORECASTING, to: { title: 'Wind', sub: 'rising overnight' } },
    },
    {
      id: 'step4',
      caption: 'Load forecast, including the data center ramping up from late morning.',
      flow: { type: 'decision', from: FORECASTING, to: { title: 'Load', sub: 'with the data-center ramp' } },
    },
    {
      id: 'step5',
      caption: 'The uncertainty band tells operators how much reserve to hold.',
      flow: { type: 'decision', from: FORECASTING, to: { title: 'Operators', sub: 'hold enough reserve' } },
    },
    {
      id: 'step6',
      caption: 'Forecasts feed AEMS (Advanced Energy Management System) scheduling and DDLR (Digital Dynamic Line Rating) look-ahead ratings.',
      flow: { type: 'data', from: FORECASTING, to: { title: 'AEMS', sub: 'Advanced Energy Management System scheduling' } },
    },
  ],
  labels: {
    load: { title: 'Load', sub: 'demand, with data-center ramp' },
    solar: { title: 'Solar' },
    wind: { title: 'Wind' },
    band: { title: 'Uncertainty band', sub: 'how sure the forecast is' },
    now: { title: 'Now' },
    actual: { title: 'Actual', sub: 'behind the line' },
    forecast: { title: 'Forecast', sub: 'ahead of the line' },
    forecasting: { title: 'GridOS Forecasting', sub: 'load and renewables' },
    aems: { title: 'AEMS', sub: 'Advanced Energy Management System' },
    ddlr: { title: 'DDLR', sub: 'Digital Dynamic Line Rating' },
    solarFarm: { title: 'Solar farm' },
    windFarm: { title: 'Wind farm' },
    dataCenter: { title: 'Data center', sub: 'ramping up tomorrow' },
  },
  forecasting: {
    hours: ['00:00', '06:00', '12:00', '18:00', '24:00'],
    hudTime: 'Time',
    hudTimeValue: '{h}:00',
    hudReserve: 'Reserve to hold',
    hudReserveValue: '{mw} MW',
  },
  packets: {
    inputs: 'Weather, history, calendar',
    schedule: 'Schedules',
    lookahead: 'Look-ahead weather',
  },
  legend: ['data'],
};

// ─────────────────────────────────────────────────────────────────
// Slide 22 — Markets
// ─────────────────────────────────────────────────────────────────
const sMarkets = {
  id: 'markets',
  section: 'Markets',
  title: 'GridOS Markets: clearing a day-ahead market',
  subtitle: 'Offers in, one price out — unless the network gets congested.',
  phase: 4,
  scene: 's22-markets',
  badge: true,
  blocks: [
    {
      kind: 'lead',
      heading: 'In one line',
      paras: ['GridOS Markets runs electricity market transactions: wholesale, balancing, settlements and spot.'],
    },
    {
      kind: 'why',
      heading: 'Why it matters',
      items: [
        'Generators compete to supply power at the lowest cost.',
        'The network’s limits must still be respected.',
      ],
    },
    {
      kind: 'how',
      heading: 'How it works',
      note: 'Standard market concepts, simplified: SCUC (Security-Constrained Unit Commitment), SCED (Security-Constrained Economic Dispatch) and LMP (Locational Marginal Price). Volumes in MW (megawatt) and prices are illustrative.',
      ordered: true,
      items: [
        'Collect offers from generators.',
        'Sort them by price: the merit order.',
        'Match demand: the last offer needed sets the price.',
        'Check the result is secure on the network.',
        'Settle: who pays and who is paid.',
      ],
    },
    {
      kind: 'example',
      heading: 'Try it',
      paras: ['Lower the tie-line limit: when the line between the zones is full, the North and South prices split.'],
    },
  ],
  keyFacts: [
    {
      id: 'F-MKT-1',
      text: 'GridOS Markets supports market transactions including wholesale, balancing, settlements and spot.',
    },
    {
      id: 'F-MKT-2',
      text: 'Modules include day-ahead and real-time markets, forward capacity markets, FTR (Financial Transmission Rights), ENTSO-E (European Network of Transmission System Operators for Electricity) markets for EU (European Union) rules, settlements and the LEP (Limit Exchange Portal).',
    },
    {
      id: 'F-MKT-3',
      text: 'An optimization engine clears bids in day-ahead and real-time markets according to market rules.',
    },
    {
      id: 'F-G4T-2',
      text: 'In GridOS for Transmission, Markets is an add-on.',
    },
  ],
  steps: [
    {
      id: 'step1',
      caption: 'Generators submit offers: how much power, at what price.',
      flow: { type: 'data', from: { title: 'Generators', sub: 'megawatts and price' }, to: MARKETS },
    },
    {
      id: 'step2',
      caption: 'Offers are stacked from cheapest to most expensive.',
      flow: { type: 'decision', from: MARKETS, to: { title: 'Merit order', sub: 'cheapest first' } },
    },
    {
      id: 'step3',
      caption: 'Demand is placed on the stack; where they meet sets the clearing price.',
      flow: { type: 'decision', from: MARKETS, to: { title: 'Clearing price', sub: '$45 per megawatt-hour' } },
    },
    {
      id: 'step4',
      caption: 'SCUC (Security-Constrained Unit Commitment) and SCED (Security-Constrained Economic Dispatch) make sure the result is physically secure on the network.',
      flow: [
        { type: 'decision', from: { title: 'SCUC', sub: 'Security-Constrained Unit Commitment' }, to: { title: 'SCED', sub: 'Security-Constrained Economic Dispatch' } },
        { type: 'command', from: { title: 'SCED', sub: 'Security-Constrained Economic Dispatch' }, to: { title: 'Generators', sub: 'secure schedule' } },
      ],
    },
    {
      id: 'step5',
      caption: 'If a line is congested, prices differ by location: LMP (Locational Marginal Price).',
      flow: { type: 'decision', from: MARKETS, to: { title: 'LMP', sub: 'Locational Marginal Price: North $8, South $95' } },
    },
    {
      id: 'step6',
      caption: 'After delivery, settlements calculate who pays and who is paid.',
      flow: [
        { type: 'data', from: { title: 'Buyers', sub: 'pay for energy' }, to: MARKETS },
        { type: 'data', from: MARKETS, to: { title: 'Generators', sub: 'are paid' } },
      ],
    },
  ],
  labels: {
    markets: { title: 'GridOS Markets', sub: 'clears the market' },
    stack: { title: 'Supply offers', sub: 'cheapest first (merit order)' },
    demand: { title: 'Demand', sub: '1,100 MW' },
    north: { title: 'North zone', sub: 'wind, solar, hydro' },
    south: { title: 'South zone', sub: 'cities and gas plants' },
    tie: { title: 'Tie line', sub: 'links the two zones' },
  },
  markets: {
    offers: {
      wind: 'Wind',
      solar: 'Solar',
      hydro: 'Hydro',
      ccgt: 'Gas, combined cycle',
      peaker: 'Gas peaker',
      oil: 'Oil',
    },
    price: 'Clearing price: ${p}',
    priceAxis: 'Price per megawatt-hour',
    mwAxis: 'Megawatts offered',
    zonePrice: '{zone}: ${p}',
    north: 'North',
    south: 'South',
    tieValue: '{f} of {lim} MW',
    hudPrice: 'Single price',
    hudNorth: 'North LMP (Locational Marginal Price)',
    hudSouth: 'South LMP (Locational Marginal Price)',
    hudTie: 'Tie-line flow',
    money: '${p}',
  },
  packets: {
    offer: 'Offer',
    schedule: 'Schedule',
    pays: 'Pays',
    paid: 'Is paid',
  },
  controls: {
    tie: 'Tie-line limit',
    tieUnit: '{v} MW',
  },
  legend: ['flow', 'warning', 'data', 'command'],
};

export const phase4 = {
  'transmission-overview': sTransmissionOverview,
  aems: sAems,
  ddlr: sDdlr,
  wams: sWams,
  forecasting: sForecasting,
  markets: sMarkets,
};
