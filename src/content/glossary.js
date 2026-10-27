// Glossary — the single source of truth for every abbreviation (PROMPT.md Section 12).
//
// Entry shape: { abbr, full, category, meaning, plurals?, accept? }
//   full     — the full form shown in tooltips, 3D labels and the "Terms on this slide" strip.
//              Written self-contained (no unexplained abbreviations inside it).
//   accept   — other full-form spellings the checker accepts inside brackets
//              (usually the wording used in PROMPT.md Section 12).
//   plurals  — extra plural spellings. Upper-case abbreviations ending in a letter
//              automatically accept a trailing "s" (DERs, PMUs, RTUs, EVs, DOEs, APIs, IEDs).
// Combined rows in Section 12 ("MDM / MDMS", "LV / MV / HV", ...) are split into one entry each.
// GIS has two entries on purpose: same letters, two meanings.
//
// To add a term: add one object below, then run `npm run check`.

export const CATEGORIES = {
  app: 'Applications',
  distribution: 'Distribution',
  transmission: 'Transmission',
  markets: 'Markets',
  'data-it-ot': 'Data, IT and OT',
  'security-cloud': 'Security and cloud',
  standard: 'Standards',
  organization: 'Organizations',
  metric: 'Metrics',
  hardware: 'Hardware',
  unit: 'Units',
};

export const glossary = [
  // ── Applications ────────────────────────────────────────────────
  { abbr: 'GridOS', full: 'Grid Operating System', category: 'app', meaning: 'GE Vernova’s grid orchestration software portfolio: a platform plus a suite of applications. “Grid Operating System” is how the product name reads.' },
  { abbr: 'ADMS', full: 'Advanced Distribution Management System', category: 'app', meaning: 'Runs the distribution grid in real time. Combines DMS (Distribution Management System), OMS (Outage Management System) and DERMS (Distributed Energy Resource Management System) capabilities.' },
  { abbr: 'DMS', full: 'Distribution Management System', category: 'app', meaning: 'Monitoring, analysis, control and optimization of distribution feeders.' },
  { abbr: 'OMS', full: 'Outage Management System', category: 'app', meaning: 'Detects, tracks and restores outages; manages crews.' },
  { abbr: 'EOMS', full: 'Enterprise Outage Management System', category: 'app', meaning: 'GE Vernova’s enterprise-scale OMS (Outage Management System) inside ADMS (Advanced Distribution Management System).' },
  { abbr: 'DERMS', full: 'Distributed Energy Resource Management System', category: 'app', meaning: 'Monitors, forecasts, optimizes and dispatches DERs (Distributed Energy Resources).' },
  { abbr: 'GNM', full: 'Geo Network Management', category: 'app', meaning: 'Smallworld GIS (Geographic Information System)-based digital network model.' },
  { abbr: 'VI', full: 'Visual Intelligence', category: 'app', meaning: 'AI (Artificial Intelligence) analysis of drone, satellite, LiDAR (Light Detection and Ranging) and camera images.' },
  { abbr: 'AEMS', full: 'Advanced Energy Management System', category: 'app', meaning: 'Transmission control-room core: EMS (Energy Management System), WAMS (Wide Area Monitoring System) and analytics.' },
  { abbr: 'EMS', full: 'Energy Management System', category: 'app', meaning: 'Monitors and controls the transmission grid and generation.' },
  { abbr: 'DDLR', full: 'Digital Dynamic Line Rating', category: 'app', meaning: 'Software-only, weather-based line capacity.' },
  { abbr: 'WAMS', full: 'Wide Area Monitoring System', category: 'app', meaning: 'Uses PMU (Phasor Measurement Unit) data to watch fast grid dynamics across a region.' },
  { abbr: 'WAMPAC', full: 'Wide Area Monitoring, Protection and Control', category: 'app', meaning: 'WAMS (Wide Area Monitoring System) plus automatic protection and control actions.' },
  { abbr: 'APM', full: 'Asset Performance Management', category: 'app', meaning: 'Asset health and maintenance strategy software.' },

  // ── Data, IT and OT ─────────────────────────────────────────────
  { abbr: 'HMI', full: 'Human-Machine Interface', category: 'data-it-ot', meaning: 'Operator screens.' },
  { abbr: 'SCADA', full: 'Supervisory Control and Data Acquisition', category: 'data-it-ot', meaning: 'Real-time telemetry and remote control of field devices.' },
  { abbr: 'RTU', full: 'Remote Terminal Unit', category: 'data-it-ot', meaning: 'Field device that sends data to SCADA (Supervisory Control and Data Acquisition).' },
  { abbr: 'IED', full: 'Intelligent Electronic Device', category: 'data-it-ot', meaning: 'Relays, meters and controllers with communications.' },
  { abbr: 'AMI', full: 'Advanced Metering Infrastructure', category: 'data-it-ot', meaning: 'Smart meters and their communication network.' },
  { abbr: 'MDM', full: 'Meter Data Management', category: 'data-it-ot', meaning: 'Stores and validates smart-meter data.' },
  { abbr: 'MDMS', full: 'Meter Data Management System', category: 'data-it-ot', meaning: 'Stores and validates smart-meter data.' },
  { abbr: 'CIS', full: 'Customer Information System', category: 'data-it-ot', meaning: 'Customer accounts and billing.' },
  { abbr: 'ERP', full: 'Enterprise Resource Planning', category: 'data-it-ot', meaning: 'Business system for finance, supply chain and human resources.' },
  { abbr: 'EAM', full: 'Enterprise Asset Management', category: 'data-it-ot', meaning: 'Asset records and work management.' },
  { abbr: 'GIS', full: 'Geographic Information System', category: 'data-it-ot', meaning: 'Maps assets and network connectivity. Same letters as Gas-Insulated Switchgear, different meaning.' },
  { abbr: 'IT', full: 'Information Technology', category: 'data-it-ot', meaning: 'Business computing systems.' },
  { abbr: 'OT', full: 'Operational Technology', category: 'data-it-ot', meaning: 'Systems that monitor and control physical equipment.' },
  { abbr: 'iPaaS', full: 'Integration Platform as a Service', category: 'data-it-ot', meaning: 'Cloud integration hub (Utilihive is one).' },
  { abbr: 'API', full: 'Application Programming Interface', category: 'data-it-ot', meaning: 'Defined way for software to talk to other software.' },
  { abbr: 'AI', full: 'Artificial Intelligence', category: 'data-it-ot', meaning: 'Software that learns patterns and makes predictions.' },
  { abbr: 'ML', full: 'Machine Learning', category: 'data-it-ot', meaning: 'Subset of AI (Artificial Intelligence) that learns from data.' },
  { abbr: 'LiDAR', full: 'Light Detection and Ranging', category: 'data-it-ot', meaning: 'Laser scanning that creates 3D point clouds.' },
  { abbr: 'VIS/IR', full: 'Visible / Infrared', category: 'data-it-ot', meaning: 'Camera image types.' },
  { abbr: 'GPS', full: 'Global Positioning System', category: 'data-it-ot', meaning: 'Satellite positioning and precise time source for PMUs (Phasor Measurement Units).' },
  { abbr: 'DTS', full: 'Dispatcher Training Simulator', category: 'data-it-ot', meaning: 'Control-room training environment.' },
  { abbr: 'HUD', full: 'Heads-Up Display', category: 'data-it-ot', meaning: 'On-screen overlay showing live numbers in the demo.' },
  { abbr: 'MES', full: 'Manufacturing Execution System', category: 'data-it-ot', meaning: 'Factory software (part of the sold Proficy business).' },

  // ── Distribution ────────────────────────────────────────────────
  { abbr: 'DER', full: 'Distributed Energy Resource', category: 'distribution', meaning: 'Small generation or storage on the distribution grid, such as rooftop solar or a home battery.' },
  { abbr: 'EV', full: 'Electric Vehicle', category: 'distribution', meaning: 'A vehicle that charges from the grid; its charger is a large, flexible load.' },
  { abbr: 'PV', full: 'Photovoltaic', category: 'distribution', meaning: 'Solar panels.' },
  { abbr: 'FLISR', full: 'Fault Location, Isolation and Service Restoration', category: 'distribution', meaning: 'Finds a fault, isolates it, re-feeds healthy sections.' },
  { abbr: 'FISR', full: 'Fault Isolation and Service Restoration', category: 'distribution', meaning: 'FLISR (Fault Location, Isolation and Service Restoration) variant without the location step.' },
  { abbr: 'VVO', full: 'Volt/VAR Optimization', category: 'distribution', meaning: 'Optimizes voltage and reactive power to cut losses.', accept: ['Volt-VAR Optimization'] },
  { abbr: 'CVR', full: 'Conservation Voltage Reduction', category: 'distribution', meaning: 'Running voltage low within limits to save energy.' },
  { abbr: 'DOE', full: 'Dynamic Operating Envelope', category: 'distribution', meaning: 'Time-varying import/export limit for a DER (Distributed Energy Resource).' },
  { abbr: 'NWA', full: 'Non-Wires Alternative', category: 'distribution', meaning: 'Using DERs (Distributed Energy Resources) or flexibility instead of new lines or transformers.' },
  { abbr: 'VPP', full: 'Virtual Power Plant', category: 'distribution', meaning: 'Many DERs (Distributed Energy Resources) aggregated to act like one plant.' },
  { abbr: 'ETR', full: 'Estimated Time to Restore', category: 'distribution', meaning: 'Predicted time power returns.' },

  // ── Transmission ────────────────────────────────────────────────
  { abbr: 'PMU', full: 'Phasor Measurement Unit', category: 'transmission', meaning: 'Measures voltage and current phasors many times per second, time-stamped by GPS (Global Positioning System).' },
  { abbr: 'PDC', full: 'Phasor Data Concentrator', category: 'transmission', meaning: 'Collects and time-aligns PMU (Phasor Measurement Unit) streams.' },
  { abbr: 'T&D', full: 'Transmission and Distribution', category: 'transmission', meaning: 'The two parts of the delivery grid.' },
  { abbr: 'SE', full: 'State Estimation', category: 'transmission', meaning: 'Best estimate of the true grid state from imperfect measurements.' },
  { abbr: 'CA', full: 'Contingency Analysis', category: 'transmission', meaning: 'Simulates equipment outages to test security.' },
  { abbr: 'N-1', full: 'loss of any one element (N minus 1)', category: 'transmission', meaning: 'The grid must survive losing any single major element.', accept: ['loss of any one element'] },
  { abbr: 'OPF', full: 'Optimal Power Flow', category: 'transmission', meaning: 'Cheapest secure dispatch meeting network limits.' },
  { abbr: 'AGC', full: 'Automatic Generation Control', category: 'transmission', meaning: 'Adjusts generators to hold frequency and interchange.' },
  { abbr: 'SLR', full: 'Static Line Rating', category: 'transmission', meaning: 'Fixed worst-case line capacity.' },
  { abbr: 'DLR', full: 'Dynamic Line Rating', category: 'transmission', meaning: 'Line capacity that changes with real weather.' },
  { abbr: 'AAR', full: 'Ambient Adjusted Rating', category: 'transmission', meaning: 'Rating adjusted mainly for air temperature; hourly under FERC 881 (Federal Energy Regulatory Commission Order No. 881).' },
  { abbr: 'OSM', full: 'Oscillation Monitoring', category: 'transmission', meaning: 'Detects power-system oscillations.' },
  { abbr: 'OSL', full: 'Oscillation Source Location', category: 'transmission', meaning: 'Finds where an oscillation originates.' },
  { abbr: 'FID', full: 'Fast Instability Detection', category: 'transmission', meaning: 'Sub-cycle detection of growing unstable oscillations.' },
  { abbr: 'LSE', full: 'Linear State Estimation', category: 'transmission', meaning: 'PMU (Phasor Measurement Unit)-based state estimation at data rate.' },

  // ── Markets ─────────────────────────────────────────────────────
  { abbr: 'SCUC', full: 'Security-Constrained Unit Commitment', category: 'markets', meaning: 'Decides which generators run, respecting security.' },
  { abbr: 'SCED', full: 'Security-Constrained Economic Dispatch', category: 'markets', meaning: 'Sets output of committed units at least cost.' },
  { abbr: 'LMP', full: 'Locational Marginal Price', category: 'markets', meaning: 'Price at each grid node including congestion and losses.' },
  { abbr: 'FTR', full: 'Financial Transmission Right', category: 'markets', meaning: 'Hedge against congestion costs.' },
  { abbr: 'CRR', full: 'Congestion Revenue Right', category: 'markets', meaning: 'Equivalent of an FTR (Financial Transmission Right) in some markets.' },
  { abbr: 'LEP', full: 'Limit Exchange Portal', category: 'markets', meaning: 'GridOS Markets module for exchanging limits.' },

  // ── Hardware ────────────────────────────────────────────────────
  { abbr: 'BESS', full: 'Battery Energy Storage System', category: 'hardware', meaning: 'Grid or site battery.' },
  { abbr: 'LTC', full: 'Load Tap Changer', category: 'hardware', meaning: 'Transformer device that adjusts voltage under load.' },
  { abbr: 'GIS', full: 'Gas-Insulated Switchgear', category: 'hardware', meaning: 'Compact switchgear insulated with gas. Same letters as Geographic Information System, different meaning.' },
  { abbr: 'HVDC', full: 'High Voltage Direct Current', category: 'hardware', meaning: 'Direct-current transmission for long distances or for linking grids.' },
  { abbr: 'FACTS', full: 'Flexible Alternating Current Transmission Systems', category: 'hardware', meaning: 'Power-electronic devices controlling voltage and flow.', accept: ['Flexible AC Transmission System'] },
  { abbr: 'STATCOM', full: 'Static Synchronous Compensator', category: 'hardware', meaning: 'Fast reactive-power FACTS (Flexible Alternating Current Transmission Systems) device.' },
  { abbr: 'SVC', full: 'Static Volt-Ampere Reactive Compensator', category: 'hardware', meaning: 'Thyristor-based reactive-power device.', accept: ['Static VAR Compensator'] },
  { abbr: 'AIS', full: 'Air-Insulated Switchgear', category: 'hardware', meaning: 'Switchgear insulated by open air.' },
  { abbr: 'SF6', full: 'sulphur hexafluoride', category: 'hardware', meaning: 'Potent greenhouse gas used as switchgear insulation.' },
  { abbr: 'g3', full: 'green gas for grid', category: 'hardware', meaning: 'GE Vernova’s SF6 (sulphur hexafluoride)-free insulating gas technology.' },
  { abbr: 'SMR', full: 'Small Modular Reactor', category: 'hardware', meaning: 'Factory-built smaller nuclear reactor.' },
  { abbr: 'BWRX-300', full: 'Boiling Water Reactor, 300-megawatt class (GE Hitachi design)', category: 'hardware', meaning: 'GE Hitachi’s SMR (Small Modular Reactor).', accept: ['Boiling Water Reactor, 300 MW class'] },
  { abbr: 'HA', full: 'Air-cooled H-class', category: 'hardware', meaning: 'GE Vernova’s highest-efficiency heavy-duty gas turbine class.', accept: ['Air-cooled H-class (GE gas turbine class)'] },

  // ── Security and cloud ──────────────────────────────────────────
  { abbr: 'SaaS', full: 'Software as a Service', category: 'security-cloud', meaning: 'Software delivered from the cloud on subscription.' },
  { abbr: 'TLS', full: 'Transport Layer Security', category: 'security-cloud', meaning: 'Encrypted connections.' },
  { abbr: 'mTLS', full: 'mutual Transport Layer Security', category: 'security-cloud', meaning: 'Encrypted connections where both sides prove their identity with certificates.', accept: ['mutual TLS'] },
  { abbr: 'PKI', full: 'Public Key Infrastructure', category: 'security-cloud', meaning: 'Certificates that prove identity.' },
  { abbr: 'ACL', full: 'Access Control List', category: 'security-cloud', meaning: 'Rules for who may access what.' },
  { abbr: 'K8s', full: 'Kubernetes', category: 'security-cloud', meaning: 'Container orchestration platform.' },
  { abbr: 'RKE2', full: 'Rancher Kubernetes Engine 2', category: 'security-cloud', meaning: 'Security-hardened Kubernetes distribution.' },
  { abbr: 'DevSecOps', full: 'Development, Security and Operations', category: 'security-cloud', meaning: 'Security built into delivery pipelines.' },
  { abbr: 'GitOps', full: 'Git-based Operations', category: 'security-cloud', meaning: 'Managing deployments declaratively from a Git repository.' },

  // ── Standards ───────────────────────────────────────────────────
  { abbr: 'NERC CIP', full: 'North American Electric Reliability Corporation Critical Infrastructure Protection', category: 'standard', meaning: 'Cybersecurity standards for the North American bulk power system.', accept: ['NERC Critical Infrastructure Protection'] },
  { abbr: 'CIP', full: 'Critical Infrastructure Protection', category: 'standard', meaning: 'Used with NERC (North American Electric Reliability Corporation).' },
  { abbr: 'FERC 881', full: 'Federal Energy Regulatory Commission Order No. 881', category: 'standard', meaning: 'Requires hourly ambient-adjusted line ratings.', accept: ['Federal Energy Regulatory Commission Order 881', 'FERC Order No. 881'] },
  { abbr: 'FAC-008', full: 'North American Electric Reliability Corporation Facility Ratings standard', category: 'standard', meaning: 'Ratings set by the most limiting component.', accept: ['NERC Facility Ratings standard', 'NERC facility ratings standard'] },
  { abbr: 'IEEE 738', full: 'Institute of Electrical and Electronics Engineers standard for calculating conductor temperature and current', category: 'standard', meaning: 'Line-rating calculation method.', accept: ['IEEE standard for calculating conductor temperature and current'] },
  { abbr: 'IEEE 2030.5', full: 'Institute of Electrical and Electronics Engineers smart energy profile for distributed energy resource communication', category: 'standard', meaning: 'Protocol used by the DERMS (Distributed Energy Resource Management System) Gateway.', accept: ['IEEE smart energy profile for DER communication'] },
  { abbr: 'IEEE 1547', full: 'Institute of Electrical and Electronics Engineers standard for distributed energy resource interconnection', category: 'standard', meaning: 'How DERs (Distributed Energy Resources) connect to the grid.', accept: ['IEEE standard for DER interconnection'] },
  { abbr: 'OpenADR', full: 'Open Automated Demand Response', category: 'standard', meaning: 'Protocol for demand-response signals.' },

  // ── Organizations ───────────────────────────────────────────────
  { abbr: 'GE', full: 'General Electric', category: 'organization', meaning: 'Industrial company whose GE Digital business announced GridOS in 2023. Brand names such as GE Vernova and GE Hitachi are not expanded.' },
  { abbr: 'AWS', full: 'Amazon Web Services', category: 'organization', meaning: 'Cloud provider.' },
  { abbr: 'GCP', full: 'Google Cloud Platform', category: 'organization', meaning: 'Cloud provider.' },
  { abbr: 'NERC', full: 'North American Electric Reliability Corporation', category: 'organization', meaning: 'Sets grid reliability standards.' },
  { abbr: 'FERC', full: 'Federal Energy Regulatory Commission', category: 'organization', meaning: 'United States energy regulator.' },
  { abbr: 'IEEE', full: 'Institute of Electrical and Electronics Engineers', category: 'organization', meaning: 'Standards body.' },
  { abbr: 'IEC', full: 'International Electrotechnical Commission', category: 'organization', meaning: 'Standards body.' },
  { abbr: 'NASPI', full: 'North American SynchroPhasor Initiative', category: 'organization', meaning: 'Industry group for PMU (Phasor Measurement Unit) technology.' },
  { abbr: 'ENTSO-E', full: 'European Network of Transmission System Operators for Electricity', category: 'organization', meaning: 'European transmission operators’ association.' },
  { abbr: 'ACER', full: 'European Union Agency for the Cooperation of Energy Regulators', category: 'organization', meaning: 'European Union regulator body.' },
  { abbr: 'TSO', full: 'Transmission System Operator', category: 'organization', meaning: 'Operates the transmission grid.' },
  { abbr: 'TO', full: 'Transmission Owner', category: 'organization', meaning: 'Owns the transmission grid.' },
  { abbr: 'DSO', full: 'Distribution System Operator', category: 'organization', meaning: 'Operates the distribution grid.' },
  { abbr: 'ISO', full: 'Independent System Operator', category: 'organization', meaning: 'Runs wholesale markets and the bulk grid.' },
  { abbr: 'RTO', full: 'Regional Transmission Organization', category: 'organization', meaning: 'Runs wholesale markets and the bulk grid.' },
  { abbr: 'PG&E', full: 'Pacific Gas and Electric', category: 'organization', meaning: 'United States utility (restoration demonstration).' },
  { abbr: 'NG ESO', full: 'National Grid Electricity System Operator', category: 'organization', meaning: 'United Kingdom system operator (inertia demonstration).' },
  { abbr: 'PPL', full: 'PPL Corporation (formerly Pennsylvania Power and Light)', category: 'organization', meaning: 'United States utility (dynamic line rating demonstration).', accept: ['Pennsylvania Power and Light'] },
  { abbr: 'TPG', full: 'TPG Inc. (formerly Texas Pacific Group)', category: 'organization', meaning: 'Investment firm that bought the Proficy business.', accept: ['Texas Pacific Group'] },
  { abbr: 'US', full: 'United States', category: 'organization', meaning: '' },
  { abbr: 'UK', full: 'United Kingdom', category: 'organization', meaning: '' },
  { abbr: 'EU', full: 'European Union', category: 'organization', meaning: '' },

  // ── Metrics ─────────────────────────────────────────────────────
  { abbr: 'SAIDI', full: 'System Average Interruption Duration Index', category: 'metric', meaning: 'Average outage minutes per customer.' },
  { abbr: 'SAIFI', full: 'System Average Interruption Frequency Index', category: 'metric', meaning: 'Average number of outages per customer.' },
  { abbr: 'CMI', full: 'Customer Minutes of Interruption', category: 'metric', meaning: 'Customers × minutes without power.' },
  { abbr: 'ICE', full: 'Interruption Cost Estimate', category: 'metric', meaning: 'Economic cost of outages.' },

  // ── Units ───────────────────────────────────────────────────────
  { abbr: 'VAR', full: 'Volt-Ampere Reactive', category: 'unit', meaning: 'Unit of reactive power.' },
  { abbr: 'MVAR', full: 'Mega Volt-Ampere Reactive', category: 'unit', meaning: 'One million VAR (Volt-Ampere Reactive).' },
  { abbr: 'LV', full: 'Low Voltage', category: 'unit', meaning: 'The lowest voltage level, supplying homes and small businesses.' },
  { abbr: 'MV', full: 'Medium Voltage', category: 'unit', meaning: 'The voltage level used by distribution feeders.' },
  { abbr: 'HV', full: 'High Voltage', category: 'unit', meaning: 'The voltage level used by transmission lines.' },
  { abbr: 'AC', full: 'Alternating Current', category: 'unit', meaning: 'Current that reverses direction many times per second.' },
  { abbr: 'DC', full: 'Direct Current', category: 'unit', meaning: 'Current that flows in one direction.' },
  { abbr: 'GPU', full: 'Graphics Processing Unit', category: 'unit', meaning: 'Chip that renders 3D graphics.' },
  { abbr: 'FPS', full: 'Frames Per Second', category: 'unit', meaning: 'Update or render rate.' },
  { abbr: 'pu', full: 'per unit', category: 'unit', meaning: 'A value as a fraction of a reference; 1.00 per unit equals the nominal value.' },
  { abbr: 'kV', full: 'kilovolt', category: 'unit', meaning: '1,000 volts.' },
  { abbr: 'MW', full: 'megawatt', category: 'unit', meaning: '1,000,000 watts.' },
  { abbr: 'Hz', full: 'hertz', category: 'unit', meaning: 'Cycles per second.' },
];

// Things the abbreviation checker must NOT treat as abbreviations (PROMPT.md 10.2 and Section 12).
export const exemptions = {
  // Brand names are not abbreviations. "GE Digital" added: it is the brand that announced GridOS (F-ORCH).
  // "Lead with AI" is Mastek's brand line, shown in the logo lock-up.
  brandNames: [
    'GE Vernova', 'GE Hitachi', 'GE Digital', 'Lead with AI', 'Smallworld', 'Utilihive', 'PhasorPoint', 'Prolec GE',
    'FACTSFLEX', 'Haliade-X', 'LM Wind Power', 'Multilin', 'MiCOM', 'Lentronics', 'CERius',
    'Meridium', 'SmartSignal', 'Greenbird', 'Alteia', 'Itron', 'Orchestrate',
    // DERMS partner names from fact F-DERMS-6.
    'EPEX Spot',
  ],
  // Diagram identifiers on the FLISR (Fault Location, Isolation and Service Restoration) topology.
  // Not abbreviations, but every slide that uses one must give it a tooltip in its `tags` map.
  diagramTags: ['CB-A', 'CB-B', 'SW2', 'SW3', 'R1', 'S1', 'S2', 'S3', 'S4', 'S5', 'TIE'],
  // "GridOS" only needs its full form on Slide 1 (see fact F-NAME).
  gridosFreeAfterSlide: 1,
};
