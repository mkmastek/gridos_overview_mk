# GridOS 3D Interactive Explainer Deck — Build Brief for Claude Code

> **How to use this file (for the human):**
> 1. Create an empty folder, e.g. `gridos-deck/`, and save this file inside it as `PROMPT.md`.
> 2. Open a terminal in that folder and start Claude Code.
> 3. Type: **"Read PROMPT.md completely. Then build Phase 1 only and stop for my review."**
> 4. After you review each phase, type: **"Phase N approved. Build Phase N+1."**
> 5. Node.js 18+ must be installed (needed for the Vite build tool).

---

## 0. Instructions to Claude Code (read before writing any code)

You are a senior front-end engineer, 3D web developer (Three.js), and technical educator. You are building an **interactive, slide-by-slide, 3D-animated explainer deck** that teaches a non-specialist how **GE Vernova's GridOS (Grid Operating System)** software works in real time, application by application, through use cases and small animated demonstrations.

Rules for how you work:

1. **Read this entire file before writing code.** All content, facts, scenes and animations are specified here.
2. **Work in phases** (Section 9). Finish one phase, run it, run the checks in Section 10, then **stop and ask the user to review**. Do not start the next phase until the user approves.
3. **Facts come only from Section 11 (Fact sheet).** Do not invent product features, module names, numbers, customers or dates. If a slide needs a fact that is not in Section 11, write `TODO-FACT` in the content file and tell the user — do not guess.
4. **All demo numbers inside animations are illustrative** (e.g. "2,400 customers out"). Every demo panel must show a small badge: `Illustrative simulation — not the real GridOS user interface`.
5. **Vendor-reported statistics** (Section 11.10) must always be shown with the qualifier given there (e.g. "vendor-reported, single demonstration project").
6. **No company financials anywhere** (no revenue, profit, orders, backlog, share price). The user explicitly does not want them.
7. Keep all slide text in **one content data file** (`src/content/slides.js`) so text can be edited without touching 3D code.
8. Ask the user before adding any dependency not listed in Section 3.

---

## 1. Goal and audience

**Goal:** After clicking through the deck, the viewer should be able to explain:
- what GridOS is and why it exists,
- its architecture layers,
- the two packaged solutions (GridOS for Distribution, GridOS for Transmission),
- every application inside them, what each one does, how it works technically, and a concrete use case,
- how the applications work together in real time during a storm and during a high-solar afternoon.

**Audience:** An engineer or IT/OT (Information Technology / Operational Technology) professional who is new to power-grid software. Smart, but not a utility control-room expert. English is the working language; keep sentences short and clear.

**Tone:** Clear, visual, concrete. Show the mechanism, not marketing. Every slide answers: *What is it? What problem does it solve? How does it work? Show me.*

---

## 2. Hard rules (non-negotiable)

### 2.1 Abbreviation rule (most important rule)

The user requires that **wherever an abbreviation appears, its full form appears in brackets in the same place.**

Implement it like this:

1. **Text blocks** (slide title, subtitle, body paragraphs, bullet lists, step captions, info cards, legends): the **first occurrence of each abbreviation inside each text block** must be written as `ABBR (Full Form)`.
   Example: `ADMS (Advanced Distribution Management System) runs the distribution grid. ADMS also includes OMS (Outage Management System).`
   Later occurrences in the same block may use the short form.
2. **Step captions** in animations are separate text blocks: expand on first use in **each** caption.
3. **3D labels** (CSS2D labels floating in the scene): show a two-line label: line 1 = abbreviation in bold, line 2 = full form in smaller text. Example:
   `FLISR`
   `Fault Location, Isolation and Service Restoration`
   If a label is very small (e.g. a switch tag like `SW2`), the label still expands on hover/tap via a tooltip, **and** the slide's "Terms on this slide" strip (below) lists it.
4. **"Terms on this slide" strip:** every slide has a collapsible strip at the bottom of the text panel listing every abbreviation used on that slide with its full form. Auto-generate it from the glossary by scanning that slide's content.
5. **Enforce it automatically:** write `scripts/check-abbreviations.mjs` (Section 10.2). It scans `slides.js`, finds every token that matches a glossary key, and fails if a text block uses an abbreviation without its full form on first occurrence. Run it in every phase. `npm run check` must pass before you report a phase as done.

The complete glossary with full forms is in **Section 12**. Put it in `src/content/glossary.js` as the single source of truth.

### 2.2 Accuracy rules
- Use only facts from Section 11.
- Label illustrative numbers and simulations (badge, see Section 0 rule 4).
- When GE Vernova's own sources disagree (e.g. DDLR capacity gain: 33% on the DDLR page vs 90% on the AEMS page from one demo), show the conservative figure and explain the other with its caveat.
- Technical stack details marked "(from GE Vernova job postings)" in Section 11 must keep that qualifier on screen.
- Generic utility-industry concepts (e.g. how FLISR works in general, what state estimation is) may be explained using standard engineering knowledge, but must not be presented as GE-proprietary specifics.

### 2.3 Scope rules
- No financial data.
- No GE Vernova logos or trademarks drawn as images; plain text product names are fine.
- No real screenshots of GridOS. All visuals are original, stylised 3D.

---

## 3. Tech stack (use exactly this unless the user approves a change)

| Purpose | Choice | Notes |
|---|---|---|
| Build tool | Vite 5.x | `npm create vite@5` vanilla JS template |
| Single-file output | `vite-plugin-singlefile` 2.x | final deliverable is ONE `dist/index.html` that works by double-clicking |
| 3D | `three` **0.160.0** (pin exact) | use `OrbitControls`, `CSS2DRenderer` from `three/examples/jsm/...` |
| Animation timelines | `gsap` **3.12.5** (pin exact) | timelines for each demo, play/pause/step/seek |
| Charts inside slides | Hand-made SVG or Three.js geometry | no chart library needed |
| Language | Vanilla JavaScript ES modules | no React, no TypeScript (keep it simple for the user to edit) |
| Styling | One CSS file with CSS custom properties | |

Pin exact versions in `package.json` (no `^` or `~`).

Scripts in `package.json`:
- `npm run dev` → local dev server
- `npm run build` → `dist/index.html` single file
- `npm run check` → abbreviation checker + fact-ID checker (Section 10)

---

## 4. Project structure

```
gridos-deck/
├─ PROMPT.md                      (this file)
├─ index.html
├─ package.json
├─ vite.config.js
├─ scripts/
│  ├─ check-abbreviations.mjs
│  └─ check-facts.mjs
└─ src/
   ├─ main.js                     (boots deck engine)
   ├─ styles.css
   ├─ content/
   │  ├─ slides.js                (ALL slide text + step captions; data only)
   │  ├─ glossary.js              (Section 12)
   │  └─ facts.js                 (Section 11 as structured data with IDs + source URLs)
   ├─ deck/
   │  ├─ DeckEngine.js            (navigation, URL hash, progress, menu)
   │  ├─ SlideLayout.js           (text panel + 3D stage + controls)
   │  ├─ DemoController.js        (play / pause / step / restart / speed, synced captions)
   │  ├─ TermsStrip.js            (auto "Terms on this slide")
   │  └─ Tooltip.js
   ├─ three/
   │  ├─ Stage.js                 (ONE shared WebGLRenderer + CSS2DRenderer, resize, pause when hidden)
   │  ├─ materials.js             (shared palette materials)
   │  ├─ kit/                     (reusable low-poly 3D building blocks, Section 6)
   │  │  ├─ GridAssets.js
   │  │  ├─ PowerFlow.js          (particle flow along curves)
   │  │  ├─ Weather.js
   │  │  ├─ Labels.js
   │  │  ├─ Charts3D.js           (3D bars, ribbons, gauges)
   │  │  └─ Camera.js             (camera presets + smooth moves)
   │  └─ scenes/                  (one file per slide scene, Section 8)
   │     ├─ s01-title.js
   │     ├─ ...
   │     └─ s27-sources.js
   └─ fallback/
      └─ noWebGL.js               (static description if WebGL is unavailable)
```

Each scene module exports:
```js
export function createScene(stage, kit) {
  // build objects
  return {
    scene, camera,             // THREE objects
    timeline,                  // gsap.timeline({ paused: true }) with labels "step1".."stepN"
    steps: [/* { id, label } matching captions in slides.js */],
    onEnter(), onExit(),       // start/stop idle loops
    dispose()                  // free geometries, materials, textures
  };
}
```

---

## 5. Deck engine and slide layout

### 5.1 Navigation
- Keyboard: `→` / `PageDown` / `Space` next slide; `←` / `PageUp` previous; `Home` / `End`.
- Inside a demo: `P` play/pause, `.` next step, `,` previous step, `R` restart.
- On-screen: Previous / Next buttons, progress bar, slide counter `7 / 27`.
- **Slide menu** (hamburger): grouped list of all slides (sections from Section 7) to jump anywhere.
- URL hash per slide (`#adms-flisr`) so the user can bookmark or share a slide.
- Touch: swipe left/right on the text panel changes slides (not on the 3D canvas, where drag = orbit).

### 5.2 Slide layout (desktop ≥ 1100px)
```
┌───────────────────────────────────────────────────────────────┐
│ Section name · Slide title                         7 / 27  ☰ │
├──────────────────────┬────────────────────────────────────────┤
│ TEXT PANEL (38%)     │ 3D STAGE (62%)                         │
│ • What it is         │   [Illustrative simulation badge]      │
│ • Problem it solves  │                                        │
│ • How it works       │        (Three.js scene)                │
│ • Use case           │                                        │
│ • Key facts          │   Step caption (synced to timeline)    │
│ • Terms on this slide│   ◀ ⏯ ▶  ⟲   0.5× 1× 2×   ●○○○○○      │
└──────────────────────┴────────────────────────────────────────┘
```
- Tablet/mobile (< 1100px): stack vertically, 3D stage first (min height 55vh), text below.
- The step caption sits **under** the 3D view, never over important geometry.
- Step dots show progress through the demo; clicking a dot seeks to that step.

### 5.3 Demo behaviour
- When a slide opens: scene loads, camera flies to the start preset, demo sits at step 0 with a **Play** button pulsing. Do not autoplay audio (there is no audio).
- Play runs all steps with a short pause between them. Step-by-step mode lets the user advance manually.
- Each step changes the caption text **and** may move the camera to a preset.
- OrbitControls are enabled with limits (no flipping under the ground); a "Reset view" button restores the preset.
- Interactive controls (sliders, toggles) are specified per slide in Section 8.

### 5.4 Performance
- **One** `WebGLRenderer` shared by all slides; scenes are created when entered and disposed when left (keep the previous and next scene pre-built for instant navigation, dispose the rest).
- Low-poly geometry, `InstancedMesh` for repeated objects (houses, trees, poles, particles).
- `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`.
- Pause rendering when the tab is hidden or the slide is not visible.
- Target 60 fps on a normal laptop; never below 30 fps.
- Respect `prefers-reduced-motion`: provide a "Reduce motion" toggle that replaces continuous particle flow with static arrows and makes camera moves instant.
- If WebGL is unavailable, show the text panel plus a numbered static step list for the demo.

---

## 6. Visual design system

### 6.1 Theme
Dark "control room" theme, because glowing power flow reads best on dark backgrounds.

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0B1220` | page background |
| `--panel` | `#111A2E` | text panel |
| `--panel-2` | `#16213A` | cards |
| `--text` | `#E6ECF5` | main text |
| `--text-muted` | `#9AA8BF` | secondary text |
| `--line` | `#26324D` | borders |
| `--accent` | `#3FA7F5` | links, active controls |

### 6.2 Semantic colours (use consistently in EVERY scene and legend)

| Meaning | Colour | Example |
|---|---|---|
| Normal energized power flow | `#2EC4B6` teal | particles on healthy lines |
| Heavy loading / warning | `#F4A261` amber | line above 80% |
| Fault / violation / danger | `#E63946` red | faulted section, over-voltage |
| De-energized / out of service | `#4A5568` grey | dark section after trip |
| Reverse flow (from DERs back to grid) | `#9B5DE5` purple | rooftop solar backfeed |
| Data / telemetry | `#3FA7F5` blue | data packets moving to software |
| Control command (software → field) | `#FFD166` yellow | switch-open command |
| AI / analytics highlight | `#F15BB5` pink | AI detection boxes |
| Restored / OK | `#80ED99` green | check marks, restored sections |

Every 3D scene shows a compact legend of the colours it uses.

### 6.3 Typography
- System UI font stack (`Inter, "Segoe UI", system-ui, sans-serif`).
- Title 28px / 600, section label 13px uppercase-free muted, body 16px / 1.6, captions 15px.
- Sentence case for all labels.

### 6.4 3D art style
- Stylised low-poly "architectural model" look: matte materials, soft hemisphere light + one directional light with soft shadows (shadow map 1024).
- Ground: dark plane with subtle grid lines (like a control-room map table).
- Power lines: thin tubes or `Line2`; energized lines carry moving glowing particles (additive blending, small sprites).
- Data flows: small blue cubes or dashes travelling along arcs **above** the ground toward a floating "GridOS" platform.
- Software components (apps) are shown as **floating translucent glass panels** above the physical grid, connected to it by thin vertical data beams — this visual metaphor should be used throughout: *physical grid on the ground, software floating above, data rising, commands descending.*

---

## 7. Deck outline (27 slides in 9 sections)

| # | Hash | Section | Slide |
|---|---|---|---|
| 1 | `title` | Intro | GridOS (Grid Operating System): how software runs the power grid |
| 2 | `portfolio` | Intro | GE Vernova's product portfolio and where GridOS sits |
| 3 | `why-gridos` | Intro | The problem: grid management vs grid orchestration |
| 4 | `architecture` | Architecture | The seven layers of GridOS |
| 5 | `data-fabric` | Platform | GridOS Data Fabric and GridOS Connect |
| 6 | `zero-trust-cloud` | Platform | Zero Trust security and cloud-native runtime |
| 7 | `distribution-overview` | Distribution | GridOS for Distribution: five apps, one model |
| 8 | `gnm` | Distribution | GNM (Geo Network Management) |
| 9 | `adms-overview` | Distribution | ADMS (Advanced Distribution Management System): three systems in one |
| 10 | `adms-flisr` | Distribution | Demo: FLISR (Fault Location, Isolation and Service Restoration) |
| 11 | `adms-vvo` | Distribution | Demo: VVO (Volt/VAR Optimization) |
| 12 | `adms-oms` | Distribution | Demo: OMS (Outage Management System) on a storm night |
| 13 | `derms-overview` | Distribution | DERMS (Distributed Energy Resource Management System): eight modules |
| 14 | `derms-demo` | Distribution | Demo: too much rooftop solar on a sunny afternoon |
| 15 | `field` | Distribution | GridOS Field: digital damage assessment |
| 16 | `visual-intelligence` | Distribution | GridOS Visual Intelligence: AI on drone, satellite and LiDAR images |
| 17 | `transmission-overview` | Transmission | GridOS for Transmission: three tiers, four competencies |
| 18 | `aems` | Transmission | Demo: AEMS (Advanced Energy Management System) — state estimation, contingency analysis, restoration |
| 19 | `ddlr` | Transmission | Demo: DDLR (Digital Dynamic Line Rating) — interactive weather sliders |
| 20 | `wams` | Transmission | Demo: WAMS (Wide Area Monitoring System) — catching oscillations with PMUs |
| 21 | `forecasting` | Transmission | GridOS Forecasting: load and renewable forecasts |
| 22 | `markets` | Markets | GridOS Markets: clearing a day-ahead market |
| 23 | `resilience` | Resilience | Before, during, after a storm: Disruption Prepare, Outage Assist, Storm Manager |
| 24 | `workflow-storm` | Real time | Workflow A: one storm, every app working together |
| 25 | `workflow-solar` | Real time | Workflow B: a high-solar afternoon across T&D (Transmission and Distribution) |
| 26 | `deployment` | Adoption | Deployment options, adoption journey, customer examples |
| 27 | `glossary-sources` | Reference | Searchable glossary, sources and caveats |

---

## 8. Slide-by-slide specification

Format for every slide below:
- **Text panel** = content for `slides.js` (abbreviations already expanded — keep them expanded).
- **Scene** = what to build in 3D.
- **Timeline** = numbered steps; each step = one caption + one animation beat (+ camera preset if given).
- **Interaction** = extra controls.
- **Facts** = fact IDs from Section 11 to display in the "Key facts" card.

---

### Slide 1 — `title` — GridOS (Grid Operating System): how software runs the power grid

**Text panel**
- Title: "GridOS (Grid Operating System): how software runs the power grid"
- Subtitle: "An interactive guide to GE Vernova's grid orchestration software, one application at a time."
- Body: "Electricity travels from power plants over high-voltage transmission lines, through substations, and over distribution feeders to homes and businesses. GridOS is the software layer that watches this whole system, predicts problems, and coordinates the right action in real time."
- How to use: "Use the arrow keys or the buttons to move between slides. On demo slides, press Play or step through one action at a time. Drag to rotate the 3D view."

**Scene**
- A miniature landscape on a dark map table, left to right: gas power plant (stack + turbine hall), wind turbines (rotating blades), step-up substation, three transmission towers with lines, a transmission substation, distribution poles along a street, ~20 houses (some with rooftop solar panels), an EV charger, a small data center block.
- Teal particles flow left → right along all lines.
- Floating above the whole scene: a large translucent glass slab labelled `GridOS` / `Grid Operating System`, with thin blue data beams rising from substations and houses into it, and occasional yellow command pulses descending.

**Timeline**
1. "Power is generated at large plants and wind farms." (camera on generation)
2. "Transmission lines carry it at high voltage over long distances." (camera pans)
3. "Distribution feeders deliver it to homes, many of which now have solar panels, batteries and EVs (Electric Vehicles)." (camera on street)
4. "GridOS (Grid Operating System) sits above it all: data rises from the grid, decisions come back down as commands." (camera pulls up to show GridOS slab, beams intensify)

---

### Slide 2 — `portfolio` — GE Vernova's product portfolio and where GridOS sits

**Text panel**
- "GE Vernova has three businesses. Power makes electricity, Wind makes renewable electricity, and Electrification moves, controls and manages it. GridOS is part of Electrification Software."
- Three cards (from Fact sheet 11.1):
  - **Power:** gas turbines (HA class, F class, aeroderivative), nuclear including the BWRX-300 SMR (Small Modular Reactor) with GE Hitachi, hydro and pumped storage, steam turbines, services. Applications: baseload and peaking power, firming renewables, data-center and industrial power.
  - **Wind:** onshore turbines, Haliade-X offshore turbine, LM Wind Power blades. Applications: utility-scale wind farms, repowering.
  - **Electrification:** GIS (Gas-Insulated Switchgear) 50–800 kV including SF6-free (sulphur hexafluoride-free) g3 versions, AIS (Air-Insulated Switchgear) and circuit breakers, transformers (including Prolec GE), HVDC (High Voltage Direct Current) systems, FACTS (Flexible AC Transmission Systems) such as STATCOM (Static Synchronous Compensator), synchronous condensers, protection relays and substation automation, power conversion and BESS (Battery Energy Storage Systems), and Electrification Software (GridOS, APM (Asset Performance Management), Smallworld GIS (Geographic Information System)).
- Note box: "Watch out: GIS means two different things — Gas-Insulated Switchgear (hardware) and Geographic Information System (mapping software)."

**Scene**
- Three raised "islands" on the map table: Power island (gas plant, SMR dome, hydro dam), Wind island (onshore + offshore turbines on water), Electrification island (switchgear bay, transformer, HVDC converter hall with valve-hall shape, STATCOM container, relay cabinet).
- Above the Electrification island, the GridOS glass slab glows brighter than anything else.

**Timeline**
1. "Power: generation equipment and services." (highlight island, others dim)
2. "Wind: onshore and offshore turbines." 
3. "Electrification: the equipment that moves and controls power — switchgear, transformers, HVDC (High Voltage Direct Current), FACTS (Flexible AC Transmission Systems)."
4. "Electrification Software: GridOS (Grid Operating System) sits here and connects to the equipment of all three businesses through data."

**Interaction:** hovering any 3D product shows a tooltip with its name, full form and one-line application.

---

### Slide 3 — `why-gridos` — The problem: grid management vs grid orchestration

**Text panel**
- "Most utilities run many separate systems from different vendors: SCADA (Supervisory Control and Data Acquisition), GIS (Geographic Information System), OMS (Outage Management System), DMS (Distribution Management System), EMS (Energy Management System). Each has its own copy of the network model and data, connected by fragile point-to-point interfaces."
- "Three forces make this harder every year: millions of new DERs (Distributed Energy Resources), more frequent extreme weather, and fast load growth such as data centers."
- "Grid orchestration means a system of systems that shares one trusted network model and one governed data layer, so every application decides from the same picture." (Fact F-ORCH)

**Scene — before/after morph**
- BEFORE: five separate grey boxes floating at different heights, each labelled (two-line labels), connected by a tangle of red-orange cables; each box holds its own small copy of a network map that differs slightly (one map missing a line, one with a switch in the wrong state).
- AFTER: the cables dissolve, the boxes become glass app panels and snap onto one shared glowing slab labelled `Shared network model + Data Fabric`; their small maps merge into one consistent map.

**Timeline**
1. "Before: five systems, five versions of the truth." 
2. "A change in the field updates only one system; the others are now wrong." (one box updates, mismatches flash red)
3. "After: all applications read and write one shared model through the Data Fabric." (morph animation)
4. "Now a change in the field is seen by every application at once." (one update ripples across all panels in green)

---

### Slide 4 — `architecture` — The seven layers of GridOS

**Text panel** — list the layers (Fact F-ARCH; the layering is this deck's teaching model built from GE Vernova's descriptions — say so in a small note):
- L7 Users and experience: control-room operators, planners, field crews, DER (Distributed Energy Resource) and market teams; HMI (Human-Machine Interface) screens, mobile field app, dashboards.
- L6 Packaged solutions: GridOS for Distribution and GridOS for Transmission.
- L5 Applications (intelligence layer): GNM (Geo Network Management), ADMS (Advanced Distribution Management System), DERMS (Distributed Energy Resource Management System), Field, VI (Visual Intelligence), AEMS (Advanced Energy Management System), DDLR (Digital Dynamic Line Rating), WAMS (Wide Area Monitoring System), Forecasting, Disruption Prepare, Storm Manager, Markets, partner apps.
- L4 Grid twin: one trusted network model spanning planning and operations.
- L3 Data foundation: GridOS Data Fabric (discover, govern, utilize) and GridOS Connect (integration).
- L2 Platform services: Zero Trust security, microservices and containers, hybrid cloud, Evergreen incremental updates, AI/ML (Artificial Intelligence / Machine Learning) services.
- L1 Source systems and field data: SCADA (Supervisory Control and Data Acquisition), RTUs (Remote Terminal Units), PMUs (Phasor Measurement Units), AMI (Advanced Metering Infrastructure), MDMS (Meter Data Management System), CIS (Customer Information System), ERP/EAM (Enterprise Resource Planning / Enterprise Asset Management), weather, wildfire, traffic and emergency feeds, DER aggregators, drone/satellite/LiDAR (Light Detection and Ranging) imagery.

**Scene — exploded layer stack**
- Seven translucent slabs stacked vertically, each a different tint (use L1 grey, L2 amber, L3 green, L4 purple, L5–L6 blue, L7 grey — these are layer tints, separate from the semantic flow colours).
- Small 3D icons sit on each slab (e.g. L1: tiny RTU cabinet, PMU box, meter, satellite; L5: small app panels).
- Blue data particles rise from L1 up through every layer; yellow command particles descend from L5 to L1.

**Timeline**
1. "Start at the bottom: field devices and business systems produce the data." (L1 glows)
2. "Platform services secure and run everything." (L2)
3. "The Data Fabric connects to every source without copying it all." (L3)
4. "The grid twin: one trusted model of the network." (L4)
5. "Applications turn data into decisions." (L5)
6. "Packaged solutions bundle applications for distribution or transmission." (L6)
7. "People act on the results — and commands flow back down to the field." (L7, then command particles descend)

**Interaction:** button "Explode / collapse" separates the slabs vertically; clicking a slab opens a detail card in the text panel listing its components.

---

### Slide 5 — `data-fabric` — GridOS Data Fabric and GridOS Connect

**Text panel**
- "GridOS Data Fabric is a grid-specific data fabric. It is not a data lake or warehouse. Data stays in its system of record; the fabric uses federation to reach it and virtualization to present one unified view." (F-DF-1, F-DF-2)
- Three steps: Discover (central metadata finds scattered data), Govern (a metadata catalog organizes, indexes and adds context), Utilize (low-code tools, dashboards and query functions). (F-DF-3)
- "It brings together OT (Operational Technology) and IT (Information Technology) data plus external data such as weather, wildfire, traffic and emergency services." (F-DF-4)
- "GridOS Connect is the integration layer, built on the Utilihive iPaaS (Integration Platform as a Service) from the Greenbird acquisition. Prebuilt connectors cut custom integration work." (F-CONN-1, F-CONN-2)
- Use cases (F-DF-5): T&D (Transmission and Distribution) integration, DER (Distributed Energy Resource) backfeed violation avoidance, grid automation with AI/ML (Artificial Intelligence / Machine Learning), outage pinpointing from voltage, meter and location data.

**Scene — "federation vs copying"**
- A ring of 8 source-system "buildings" on the ground: SCADA, AMI/MDMS, CIS, GIS, ERP/EAM, Weather, Wildfire feed, DER aggregator (two-line labels).
- Phase A (wrong way): every building sends full copies (big blocks) into one central "data lake" tank that overflows; the copies go stale (turn grey) — then a red X crosses the tank.
- Phase B (fabric way): a glowing green mesh (the fabric) forms above the ring; small metadata tags float up from each building into a central "Metadata catalog" disc; when an app panel asks a question ("Which customers on feeder F12 lost voltage?"), thin query threads go out to only the 3 relevant buildings and return small answer packets that assemble into one virtual table.
- GridOS Connect shown as plug-shaped connectors snapping onto each building; a small monitor panel shows each data flow's health (green ticks).

**Timeline**
1. "Utility data lives in many separate systems." 
2. "The old approach copies everything into one central store — slow, costly, and quickly out of date." (Phase A)
3. "GridOS Connect plugs into each system with prebuilt connectors." 
4. "Discover: metadata from each source is registered in one catalog."
5. "Govern: the catalog adds context — what the data means, where it belongs on the network."
6. "Utilize: an application asks a question; only the needed data is fetched, live, and assembled into one view."

**Interaction:** dropdown "Ask a question" with 3 preset queries (outage location, backfeed risk, storm exposure); each lights different source buildings.

---

### Slide 6 — `zero-trust-cloud` — Zero Trust security and cloud-native runtime

**Text panel**
- "Zero Trust means never trust, always verify: every user, service and device must prove who it is for every request. In GridOS it is built into the platform rather than added later." (F-ZT-1)
- "GridOS applications are built as microservices: many small independent services running in containers. GE Vernova job postings mention Kubernetes, Rancher RKE2 (Rancher Kubernetes Engine 2), TLS/mTLS (Transport Layer Security / mutual TLS) and PKI (Public Key Infrastructure) certificates." (F-TECH-1 — keep "(from GE Vernova job postings)")
- "Hybrid cloud: applications can run on-premises, in the cloud, or both. Example: Norway's One Grid Operation runs ADMS (Advanced Distribution Management System) on-premises and other GridOS applications in AWS (Amazon Web Services)." (F-DEP-1)
- "Evergreen updates: small incremental updates instead of large disruptive version upgrades." (F-TECH-2)

**Scene**
- Left: an on-premises control-center building; right: a cloud platform floating (a flat rounded platform, not a cloud cartoon). Inside each, rows of small container cubes grouped into pods.
- Zero Trust demo: two service cubes exchange certificates (two small shield icons swap, a lock closes, a green encrypted tube connects them). Then an unknown grey cube without a certificate tries to connect — a red barrier blocks it.
- Evergreen demo: one container at a time turns from version 1 (blue) to version 2 (green) while the others keep running and particles keep flowing (no downtime).

**Timeline**
1. "Applications run as many small services in containers."
2. "Before two services talk, both present certificates — mutual TLS (Transport Layer Security)."
3. "A device without valid identity is blocked, even inside the network."
4. "Real-time ADMS (Advanced Distribution Management System) stays on-premises; other apps run in the cloud — a hybrid deployment."
5. "Evergreen: services update one at a time, so the grid software never stops."

---

### Slide 7 — `distribution-overview` — GridOS for Distribution: five apps, one model

**Text panel**
- "GridOS for Distribution (launched February 2026) brings five applications onto one governed data foundation, GridOS Data Fabric: Smallworld GNM (Geo Network Management), GridOS ADMS (Advanced Distribution Management System), GridOS DERMS (Distributed Energy Resource Management System), GridOS Field, and GridOS VI (Visual Intelligence)." (F-G4D-1)
- "They share one network model exchange and one governed data layer, so planners, operators and field crews work from the same view." (F-G4D-2)
- Adoption journey (F-G4D-3): 1 Essentials → 2 Disruption Management → 3 Distribution Optimization → 4 DER Orchestration → 5 Distribution Intelligence.
- Key fact: Alabama Power avoided more than 112 million CMI (Customer Minutes of Interruption) in 2025 (F-G4D-4, vendor-reported).

**Scene**
- Centre: a round green "Data Fabric" platform with a purple "grid twin" map hologram on top.
- Five glass app panels orbit around it (slowly), each with a small icon and two-line label.
- Below, a neighbourhood distribution grid; beams connect each app to the grid parts it touches (GNM → map, ADMS → substation/feeders, DERMS → solar houses, Field → crew truck, VI → drone).
- Journey: a 5-step path on the ground, steps light up one by one.

**Timeline**
1–5. One caption per app: name with full form + one-line role; that app panel moves to the front and its beam lights.
6. "Adoption is staged: start with Essentials, then add capabilities step by step." (journey path animates)

---

### Slide 8 — `gnm` — GNM (Geo Network Management)

**Text panel**
- "Smallworld GNM (Geo Network Management) creates a detailed digital model of a utility's electric, gas, water or telecom network. It enforces data quality and supports a fully connected network model." (F-GNM-1)
- How it works (generic GIS (Geographic Information System) concepts, labelled as such): assets are placed on a map with attributes; connectivity (which asset connects to which) forms the topology; quality rules catch errors; the connected model is exported to operational systems like ADMS (Advanced Distribution Management System) and DERMS (Distributed Energy Resource Management System).
- Use case: "A new housing estate is built. Designers add new poles, cables and a transformer in GNM. Once commissioned, the model updates and ADMS can operate the new feeder."

**Scene**
- A flat map with streets. Assets drop in from above (poles, transformer, cables).
- Connectivity tracing: a bright pulse travels from the substation along conductors, lighting each connected asset.
- Error: one cable segment is drawn but not snapped to a pole — the trace stops, a red ring marks the gap, label "Disconnected segment".
- Fix: segment snaps; trace completes; the map "lifts" into a 3D purple grid-twin model and slides into an ADMS glass panel.

**Timeline**
1. "Assets are placed on the map with their attributes."
2. "Connectivity tracing follows the network from the substation outward."
3. "A data-quality rule finds a cable that is not connected."
4. "Once fixed, the full connected model is complete."
5. "The model is published to ADMS (Advanced Distribution Management System) and other apps as the operational network model."

---

### Slide 9 — `adms-overview` — ADMS: three systems in one

**Text panel**
- "GridOS ADMS (Advanced Distribution Management System) combines three systems: DMS (Distribution Management System) for monitoring, analysis and control; OMS (Outage Management System) for planned and unplanned outages; and built-in DERMS (Distributed Energy Resource Management System) capabilities." (F-ADMS-1)
- DMS functions (F-ADMS-2): real-time monitoring and control, FLISR (Fault Location, Isolation and Service Restoration), VVO (Volt/VAR Optimization), AI/ML (Artificial Intelligence / Machine Learning) load prediction, network optimization and congestion management.
- OMS functions (F-ADMS-3): outage management, field mobility, damage assessment, predictive analytics.
- Outcome metrics it improves: SAIDI (System Average Interruption Duration Index), SAIFI (System Average Interruption Frequency Index), CMI (Customer Minutes of Interruption).
- Key facts (vendor-reported): one US utility avoided over 150 million CMI per year; one US utility avoided over $175 million of ICE (Interruption Cost Estimate) in a year. (F-ADMS-4)

**Scene**
- A control-room console with three large curved screens floating as glass panels: DMS (feeder map with loading colours), OMS (outage map with crew trucks), DERMS (solar/battery icons).
- Below: a town with 3 feeders from one substation. Live particle flow; one feeder segment amber (heavily loaded).

**Timeline**
1. "DMS (Distribution Management System) shows every feeder's live state." (DMS panel forward; feeders colour by loading)
2. "OMS (Outage Management System) tracks outages and crews." (OMS panel)
3. "Built-in DERMS (Distributed Energy Resource Management System) shows DERs and their impact." (DERMS panel)
4. "All three work on the same network model — next slides show each one in action."

---

### Slide 10 — `adms-flisr` — Demo: FLISR (Fault Location, Isolation and Service Restoration) ★ centrepiece demo

**Text panel**
- "FLISR (Fault Location, Isolation and Service Restoration) is a DMS (Distribution Management System) function in GridOS ADMS. It finds the faulted section, isolates it with remote switches, and restores power to the healthy sections from other feeders." (F-ADMS-2)
- "GridOS ADMS uses a centralized, model-based FLISR application." (F-ADMS-5)
- How FLISR works (generic, label as standard industry logic): protection trips → fault indicators report which devices saw fault current → the network model locates the section between the last device that saw fault current and the first that did not → isolate → restore upstream → restore downstream via a tie switch if the other feeder has spare capacity.
- Use case: "A tree falls on a line during a storm."

**Scene — exact topology (build it precisely)**
```
Substation A ─[CB-A]─ S1 ─[R1]─ S2 ─[SW2]─ S3 ─[SW3]─ S4 ─[TIE (normally open)]─ S5 ─[CB-B]─ Substation B
```
- CB-A, CB-B = feeder circuit breakers; R1 = recloser; SW2, SW3 = remote-controlled switches; TIE = normally-open tie switch between Feeder A and Feeder B.
- Sections S1–S4 belong to Feeder A; S5 to Feeder B.
- Each section has a cluster of houses with a floating customer counter (illustrative): S1 600, S2 700, S3 400, S4 700, S5 900.
- Switch states visible: closed = solid bar, open = bar lifted at an angle; colour per Section 6.2.
- A fault indicator (small lamp) on R1, SW2, SW3.
- Top HUD (Heads-Up Display) counter: "Customers without power: 0".
- ADMS glass panel floats above showing a mini single-line diagram that mirrors the 3D state.

**Timeline**
1. "Normal operation: Feeder A serves 2,400 customers, Feeder B serves 900. The tie switch is open." (teal particles)
2. "A tree falls on section S3 — a fault." (tree animates falling, red spark at S3)
3. "The recloser R1 trips, tries to reclose, and locks out. Sections S2, S3 and S4 lose power." (S2–S4 grey; counter → 1,800)
4. "Fault indicators report: R1 and SW2 saw fault current, SW3 did not." (lamps: R1 and SW2 red blink, SW3 stays dark; blue data packets rise to ADMS)
5. "The ADMS (Advanced Distribution Management System) network model locates the fault: between SW2 and SW3 — section S3." (S3 pulses red; panel highlights)
6. "Isolate: ADMS sends commands to open SW2 and SW3." (yellow command pulses descend; switches open)
7. "Restore upstream: R1 recloses. Section S2 is back." (S2 teal; counter → 1,100)
8. "Capacity check: can Feeder B carry section S4?" (a capacity bar on Feeder B fills to 75% — under limit, green)
9. "Restore downstream: ADMS closes the tie switch. Feeder B now feeds S4." (TIE closes; particles flow from Substation B into S4; counter → 400)
10. "Only the faulted section S3 (400 customers) stays off. A crew is dispatched to the exact location." (crew truck drives to S3)
11. "After repair, switches return to the normal configuration." (tree removed, all teal, counter → 0)

**Interaction**
- "Choose fault location" buttons: S2, S3, S4. Re-run the timeline logic for the chosen section (generate steps from the topology rather than hard-coding only S3 — implement a tiny FLISR solver in JS over this linear topology).
- Toggle "Feeder B heavily loaded": capacity check fails (bar red), FLISR skips downstream restoration and S4 stays dark — caption explains why.

---

### Slide 11 — `adms-vvo` — Demo: VVO (Volt/VAR Optimization)

**Text panel**
- "VVO (Volt/VAR Optimization) optimizes voltage levels and reactive power (VAR (Volt-Ampere Reactive)) across the network to reduce energy losses and keep voltage within limits." (F-ADMS-2)
- Generic devices used (label as standard practice): substation transformer tap changer (LTC (Load Tap Changer)), line voltage regulators, switched capacitor banks, and smart inverters on DERs.
- "CVR (Conservation Voltage Reduction) is a VVO use case: run voltage in the lower part of the allowed band to save energy."
- Use case: "Long rural feeder: customers at the end see low voltage at evening peak, while customers near the substation see high voltage."

**Scene**
- A long feeder (15 poles) from a substation; houses along it.
- Above the feeder, a floating 3D **voltage ribbon** (a curved band) whose height = voltage at each point. Two horizontal translucent planes mark the allowed band (illustrative 0.95 and 1.05 pu (per unit)). Ribbon colour: green inside band, amber near the limit, red outside.
- Devices: substation tap changer, one voltage regulator at pole 8, one capacitor bank at pole 11, two solar homes with smart inverters at the end.
- A small "losses" gauge on the substation.

**Timeline**
1. "Evening peak: voltage drops along the feeder. The end of the line is below the limit." (ribbon slopes down, end red)
2. "VVO (Volt/VAR Optimization) calculates the best settings for every device at once."
3. "The capacitor bank switches on, supplying reactive power locally." (end of ribbon rises)
4. "The voltage regulator changes tap." (middle section steps up)
5. "Smart inverters adjust their reactive power." (fine adjustment)
6. "Result: the whole feeder is inside the allowed band and losses fall." (ribbon green, losses gauge drops)
7. "CVR (Conservation Voltage Reduction): the substation tap lowers the whole profile toward the bottom of the band to save energy." (ribbon lowers, still green)

**Interaction:** slider "Feeder load (%)" 30–110 — ribbon sag updates live (simple linear voltage-drop approximation, labelled "simplified").

---

### Slide 12 — `adms-oms` — Demo: OMS (Outage Management System) on a storm night

**Text panel**
- "OMS (Outage Management System) in GridOS ADMS manages planned and unplanned outages, including field mobility, damage assessment and predictive analytics." (F-ADMS-3)
- How outage detection works (generic, label as such): customer calls and AMI (Advanced Metering Infrastructure) smart-meter "last gasp" messages arrive; the OMS uses the network model to group them and infer the most likely failed device (e.g. a fuse or transformer); crews are dispatched; meters confirm restoration.
- "Inside the Enterprise OMS, Outage Assist helps dispatch crews to the right areas." (F-RES-2)

**Scene**
- Night version of the town (dark blue lighting, house windows lit warm).
- Storm: rain particles, wind-blown trees.
- A transformer serving 12 houses fails — its houses go dark. Small blue "last gasp" pings rise from 9 of the 12 meters; 3 phone icons (calls) rise.
- OMS glass panel: pings cluster; prediction engine draws lines from pings up the network tree to the common upstream device; the transformer gets a red "predicted" marker with a confidence bar.
- A crew truck with headlights drives there; repair sparkle; houses light up; green "restored" pings rise; ETR (Estimated Time to Restore) counter counts down.

**Timeline**
1. "Storm night: a distribution transformer fails. 12 homes lose power."
2. "Smart meters send last-gasp messages; some customers call." 
3. "OMS (Outage Management System) traces the reports up the network model: they share one transformer."
4. "The transformer is flagged as the predicted outage device."
5. "A crew is dispatched; an ETR (Estimated Time to Restore) is published to customers."
6. "Power restored — meters confirm every home is back."

---

### Slide 13 — `derms-overview` — DERMS: eight modules

**Text panel**
- "GridOS DERMS (Distributed Energy Resource Management System) manages the full DER (Distributed Energy Resource) lifecycle: integration, visualization, operation, control and optimization." (F-DERMS-1)
- Eight core modules (F-DERMS-2): Model Manager, Program Manager, Gateway (certified to IEEE 2030.5), Operations, Forecasting, Optimization (with DOEs (Dynamic Operating Envelopes)), Markets Orchestration, Flex Planning (including NWA (Non-Wires Alternatives)).
- Grid DERMS vs Edge DERMS (F-DERMS-3).
- Standards: OpenADR (Open Automated Demand Response) and IEEE 2030.5. (F-DERMS-4)
- Key facts (vendor-reported): 90+ deployments, 127 million utility service points, ranked #1 Grid DERMS by Guidehouse. (F-DERMS-5)
- Partners: EnergyHub, Nodes, EPEX Spot, Piclo, Clean Power Research, WeaveGrid, Plexigrid. (F-DERMS-6)

**Scene**
- A horizontal "assembly line" of 8 glass module blocks above a neighbourhood with solar homes, home batteries, EV chargers and a community battery.
- Data packets flow through the modules in order: Model Manager → Forecasting → Optimization → Gateway → down to devices; Program Manager and Markets Orchestration sit as side branches; Operations is a large overview screen; Flex Planning sits slightly apart as a "study mode" block with a dashed outline.
- Split view at the end: "Grid DERMS" (utility, grid-wide) on the left; "Edge DERMS" (aggregators, customer devices) on the right, with a bridge between them.

**Timeline:** one step per module (8 steps), each highlighting the block and showing its one-line description; step 9 shows the Grid vs Edge split.

---

### Slide 14 — `derms-demo` — Demo: too much rooftop solar on a sunny afternoon

**Text panel**
- Use case: "Midday in a suburb with many rooftop solar systems. Solar output exceeds local demand, power flows backward through the transformer, and voltage rises above the limit."
- "GridOS DERMS (Distributed Energy Resource Management System) uses look-ahead analysis to anticipate backfeeds and schedule DERs (Distributed Energy Resources) within grid constraints using dynamic operating envelopes." (F-DERMS-2, F-DERMS-7)
- "Envelopes and dispatch signals reach devices through the Gateway (IEEE 2030.5) or through aggregators."
- Evening twist: "At the evening peak, the same DERMS asks home batteries to discharge and EV (Electric Vehicle) chargers to pause — turning DERs into a grid resource."

**Scene**
- Sun arc moves across the sky (time-of-day slider). 24 houses, 16 with solar panels, 6 with batteries, 4 with EV chargers; one distribution transformer.
- Flow particles: from houses toward transformer turn **purple** when flow reverses.
- A voltage gauge on the transformer with a red limit mark; a forecast chart floating above the DERMS panel (load vs solar curves for the day, with a moving "now" line).
- Each house shows a small vertical "envelope" bar (allowed export) that animates when DOEs (Dynamic Operating Envelopes) are applied.

**Timeline**
1. "10:00 — solar rises; local demand is low."
2. "DERMS Forecasting predicts a reverse-flow peak at 13:00 that will push voltage over the limit." (forecast chart highlights the future violation)
3. "Optimization calculates a dynamic operating envelope for each home — how much it may export each hour."
4. "The Gateway sends envelopes using IEEE 2030.5; aggregator-managed homes receive them through their aggregator." (yellow command pulses to houses; envelope bars shrink for a few homes, batteries start charging — absorbing solar)
5. "13:00 — reverse flow stays within limits and voltage stays inside the band." (gauge green)
6. "18:30 — evening peak: batteries discharge and EV chargers pause." (flows reverse to normal direction; transformer loading drops from amber to teal)

**Interaction:** time-of-day slider (06:00–22:00) and a "DERMS on/off" toggle. With DERMS off, the 13:00 voltage goes red and the evening transformer goes amber — so the user sees the difference.

---

### Slide 15 — `field` — GridOS Field: digital damage assessment

**Text panel**
- "GridOS Field Damage Assessment is the bridge between field operations and the control room. Damage assessments are digitized at the source, validated against the network model, and synchronized across ADMS (Advanced Distribution Management System), OMS (Outage Management System) and GIS (Geographic Information System). Crews get the latest geospatial and network context." (F-FIELD-1)
- Use case: "After a storm, a crew finds a broken pole."

**Scene**
- A crew member figure (simple low-poly) with a tablet next to a snapped pole and a downed line.
- The tablet screen (enlarged as a floating panel) shows a damage form: asset ID, damage type, photo thumbnail, materials needed.
- Validation: asset ID compared to the network model — a green tick for a match. A second variant: the crew types a wrong pole ID → amber warning "Asset not at this location — did you mean P-1047?".
- Sync: three blue beams go up from the tablet to ADMS, OMS and GIS panels simultaneously, each panel showing the new damage marker.

**Timeline**
1. "A crew reaches a broken pole."
2. "They capture photos and damage details on the tablet."
3. "GridOS Field checks the entry against the network model." (show both match and mismatch variants)
4. "The verified record syncs to ADMS, OMS and GIS (Geographic Information System) at once."
5. "Operators now see verified field data and can plan the repair."

---

### Slide 16 — `visual-intelligence` — GridOS VI (Visual Intelligence): AI on drone, satellite and LiDAR images

**Text panel**
- "GridOS VI (Visual Intelligence) analyses drone imagery, satellite imagery, thermal scans, visible and infrared camera images and LiDAR (Light Detection and Ranging) point clouds." (F-VI-1)
- "It is a cloud SaaS (Software as a Service) platform with ready-to-use deep-learning models. It overlays visual findings on the network map to identify exactly where vegetation must be trimmed and which assets need attention." (F-VI-2)
- Use cases: vegetation management and wildfire mitigation, asset inspection (sagging poles, corrosion, wear), storm damage assessment. (F-VI-3)
- "Requirement: accurate GIS (Geographic Information System) data and high-quality LiDAR or photo datasets are needed to train the AI for asset inspection." (F-VI-4)
- History: GE Vernova announced the acquisition of Alteia (French visual-AI company) in July 2025. (F-VI-5)

**Scene**
- A 1 km rural line corridor with poles, conductors and many trees of varying height.
- A drone flies along the corridor emitting a scanning cone; a satellite passes overhead drawing a swath.
- LiDAR effect: the scene briefly turns into a coloured point cloud (generate points on tree and pole surfaces; height-coloured).
- A translucent **clearance cylinder** appears around each conductor; trees intruding into it are outlined with pink AI bounding boxes and a risk score.
- Asset inspection: one pole slightly leaning and one cross-arm with rust texture get pink boxes with labels ("Leaning pole — 0.91 confidence", illustrative).
- A floating work-order list sorts findings by risk (High / Medium / Low) and pins each to the map.

**Timeline**
1. "A drone and a satellite capture images of the line corridor."
2. "LiDAR (Light Detection and Ranging) turns the corridor into a 3D point cloud."
3. "VI (Visual Intelligence) overlays the network model and draws a safety clearance zone around each conductor."
4. "AI finds trees inside the clearance zone and scores their risk."
5. "AI also flags asset problems: a leaning pole and a corroded cross-arm."
6. "Findings become a prioritized work-order list for vegetation and maintenance crews."

**Interaction:** toggle "Data source": Satellite / LiDAR / Drone photo — changes which findings are detectable (satellite = wide area, coarser; LiDAR = precise clearance distances; photo = visual defects), with a one-line explanation of the trade-off.

---

### Slide 17 — `transmission-overview` — GridOS for Transmission: three tiers, four competencies

**Text panel**
- "GridOS for Transmission (introduced June 9, 2026 at Orchestrate 2026) helps utilities operate the transmission grid as one coordinated system." (F-G4T-1)
- Three tiers (F-G4T-2): AEMS (Advanced Energy Management System) as the operational core; GridOS applications as the intelligence layer (DDLR (Digital Dynamic Line Rating), WAMS (Wide Area Monitoring System), Forecasting, plus add-ons VI (Visual Intelligence) and Markets); Data Fabric and Connect as the data foundation.
- "It is not a replacement for the EMS (Energy Management System). The EMS stays at the operational core of the control room." (F-G4T-3)
- Four operational competencies (F-G4T-4): Network Awareness, Capacity Management, Stability Management, Grid Resilience.
- Journey (F-G4T-5): establish trusted network awareness → strengthen operational coordination → operate with predictive intelligence.

**Scene**
- A high-voltage landscape: 6 substations connected by double-circuit lines on lattice towers, a wind farm, a gas plant, a large data-center campus.
- Three stacked glass tiers above: bottom green (Data Fabric & Connect), middle blue ring of app panels (DDLR, WAMS, Forecasting, VI, Markets — add-ons with dashed outlines), top solid panel (AEMS).
- Four competency "pillars" light up in turn, each connecting to the apps that serve it.

**Timeline**
1. "Data foundation: Data Fabric and Connect."
2. "Operational core: AEMS (Advanced Energy Management System) runs the control room."
3. "Intelligence layer: specialised apps extend AEMS."
4–7. One caption per competency.

---

### Slide 18 — `aems` — Demo: AEMS — state estimation, contingency analysis, restoration

**Text panel**
- "GridOS AEMS (Advanced Energy Management System) is the transmission control-room core, comprising EMS (Energy Management System), WAMS (Wide Area Monitoring System) and analytics applications." (F-AEMS-1)
- Core functions (F-AEMS-2): real-time monitoring and supervisory control, state estimation, contingency analysis, economic dispatch, OPF (Optimal Power Flow), load forecasting and generation scheduling, alarms and event management.
- Advanced functions (F-AEMS-3): automated voltage control, grid restoration, AI-based renewables and inertia forecasting, Effective Inertia module, real-time and look-ahead security analysis.
- Compliance: NERC CIP (North American Electric Reliability Corporation Critical Infrastructure Protection) 002–009. (F-AEMS-4)
- Vendor-reported demonstration: an auto-restoration plan in under 10 seconds for an area covering 3.5 million people (single demonstration project, PG&E). (F-AEMS-5)

**Scene — 6-bus transmission network**
- 6 substations (buses) connected by 8 lines in a mesh. Generators at 2 buses, a wind farm at 1, loads at 3.
- Measurement arrows on lines (MW values, illustrative) with small "noise jitter"; one measurement is wrong (e.g. shows 480 MW where physics says ~120).

**Timeline — part A, state estimation**
1. "SCADA (Supervisory Control and Data Acquisition) sends thousands of measurements — some noisy, some wrong."
2. "State estimation finds the most likely true state that fits all measurements together." (iterations: arrows converge; values stabilise)
3. "Bad-data detection flags the measurement that does not fit." (the wrong arrow turns red with a "suspect" tag)

**Timeline — part B, contingency analysis**
4. "Contingency analysis asks: what if each line trips? (N-1 (loss of any one element))" (each line flickers off in turn, ghost flows recompute)
5. "One case fails: losing line 3–5 would overload line 2–5 to 112%." (that line glows red in the ghost simulation)
6. "The operator re-dispatches generation in advance; the N-1 case is now secure." (generator output bars change; red turns green)

**Timeline — part C, restoration**
7. "Worst case: a region blacks out." (half the network grey)
8. "AEMS builds a restoration plan: which units start first, which lines energize in what order." (numbered path animates over the network)
9. Show the vendor-reported fact card for F-AEMS-5 with its caveat.

---

### Slide 19 — `ddlr` — Demo: DDLR (Digital Dynamic Line Rating) — interactive

**Text panel**
- Problem: "A SLR (Static Line Rating) assumes worst-case weather all year, so lines often carry less power than they safely could."
- "GridOS DDLR (Digital Dynamic Line Rating) computes real-time and forecasted line ratings without sensors or new infrastructure. It combines GIS (Geographic Information System), EMS (Energy Management System) model, line and asset data with weather data — hourly temperature, wind speed and direction, and atmospheric conditions." (F-DDLR-1)
- "It calculates ratings following IEEE 738, with real-time and 10-day forecasts, in DLR (Dynamic Line Rating), AAR (Ambient Adjusted Rating) and emergency modes, and supports FERC 881 (US Federal Energy Regulatory Commission Order 881) and FAC-008 (NERC facility ratings standard) most-limiting-component logic." (F-DDLR-2)
- Key facts (vendor-reported): up to 33% more line capacity; up to 250× lower investment than sensor-based solutions. (F-DDLR-3). Note: GE Vernova's AEMS page cites up to 90% in favourable weather from a single PPL demonstration — show as a footnote with that caveat.

**Scene**
- One transmission span between two towers, close-up; conductor sag visible; a conductor temperature gauge; a rating gauge (MW) with three needles/markers: SLR (fixed), AAR, DLR.
- Weather: animated wind arrows (direction relative to line matters), sun with intensity, thermometer.
- Conductor colour shifts with temperature (cool teal → amber → red near max).
- Floating 10-day forecast bar chart (illustrative, generated from a simple seeded weather series).

**Interaction (main feature of this slide)**
- Sliders: Ambient temperature (−10 to 45 °C), Wind speed (0–10 m/s), Wind angle to line (0–90°), Solar radiation (0–1000 W/m²).
- Mode toggle: SLR / AAR / DLR.
- Implement a **simplified educational heat-balance model** (label on screen: "Simplified teaching model — real DDLR follows IEEE 738"):
  ```
  Tmax = 75 °C (max conductor temperature)
  qc = kc * sqrt(max(wind, 0.1)) * (0.4 + 0.6 * sin(angle)) * (Tmax - Tamb)   // convective cooling
  qr = kr * (Tmax - Tamb)                                                    // radiative cooling (simplified)
  qs = ks * solar                                                            // solar heating
  I  = sqrt(max(qc + qr - qs, 0) / R)                                        // ampacity
  ```
  Choose constants so the static assumption (wind 0.6 m/s at 90°, 40 °C, 1000 W/m²) gives exactly 1.00 pu; display ratings as pu (per unit) and as illustrative MW (1.00 pu = 400 MW).
  - SLR mode: always the static value.
  - AAR mode: uses the real ambient temperature but the static wind and sun assumptions.
  - DLR mode: uses all slider values.
- A "Grid needs 480 MW" demand marker: in SLR the line cannot carry it (red, congestion); in DLR on a windy cool day it can (green).

**Timeline (auto-demo before the user plays with sliders)**
1. "The static rating assumes a hot, still, sunny day — every day." 
2. "AAR (Ambient Adjusted Rating): on a cool night the rating rises." (temperature slider animates down)
3. "DLR (Dynamic Line Rating): wind cooling raises it further." (wind slider animates up)
4. "Forecasts up to 10 days ahead let operators plan power transfers in advance." (forecast chart animates)

---

### Slide 20 — `wams` — Demo: WAMS (Wide Area Monitoring System)

**Text panel**
- "PMUs (Phasor Measurement Units) measure voltage and current phasors many times per second, time-stamped by GPS (Global Positioning System). GE Vernova material shows PMU data at 60 frames per second — far faster than traditional SCADA (Supervisory Control and Data Acquisition) scans." (F-WAMS-1)
- "GridOS WAMS (Wide Area Monitoring System) applications: Oscillation Monitoring and Source Location, Disturbance Detection, Islanding Re-Synchronization Support, Effective Inertia Metering, and Dynamic Model Validation and Calibration." (F-WAMS-2)
- Heritage: PhasorPoint, about 20 years of WAMS experience re-architected for GridOS; winner of the 2021 IEEE-NASPI (North American SynchroPhasor Initiative) Oscillation Source Location contest. (F-WAMS-3)
- Recent: extended to detect load-driven oscillations at data-center interconnections. (F-WAMS-4)
- Vendor-reported: disturbance analysis reduced from days to hours. (F-WAMS-5)

**Scene**
- A wide regional map with 10 substations; each has a PMU box with a small antenna and a GPS satellite icon above.
- Each PMU streams fast blue dots to a PDC (Phasor Data Concentrator) hub; for contrast one SCADA RTU (Remote Terminal Unit) sends a slow dot every few seconds.
- Oscillation: a forced oscillation starts at one generator (or a data-center campus); a sine-wave "ripple" travels across the map; each substation bobs up and down slightly with phase offsets (visualise phase as colour hue).
- A floating chart: frequency vs time showing a growing oscillation; readouts: mode frequency (e.g. 0.25 Hz, illustrative), damping %.
- OSL (Oscillation Source Location): lines from the substations converge (like triangulation) on the source, which glows pink.
- Inertia gauge: as wind/solar share rises (slider), the "Effective inertia" needle drops; frequency dip after a generator trip gets deeper.

**Timeline**
1. "PMUs (Phasor Measurement Units) stream synchronized measurements many times per second; SCADA updates only every few seconds."
2. "A forced oscillation starts somewhere in the grid."
3. "OSM (Oscillation Monitoring) detects it and measures its frequency and damping."
4. "OSL (Oscillation Source Location) traces where it comes from." 
5. "Operators contact the source and remove the oscillation before it can cause a blackout." (ripple fades)
6. "Effective inertia metering shows how much rotating inertia the grid has right now." (inertia gauge)

**Interaction:** slider "Renewable share (%)" 10–80 → effective inertia needle and post-trip frequency dip depth (simple illustrative relationship).

---

### Slide 21 — `forecasting` — GridOS Forecasting

**Text panel**
- "GridOS Forecasting enables forecasting of load and renewable generation, helping operators anticipate variability and align dispatch decisions." (F-FC-1)
- "AEMS (Advanced Energy Management System) offers AI-based applications for renewables forecasting and inertia projections." (F-AEMS-3)
- Use case: "Tomorrow: cloudy morning, sunny afternoon, windy night, plus a data center ramping up."

**Scene**
- A 24-hour 3D area chart standing on the map table: load (grey), solar (yellow-amber), wind (teal), with a translucent uncertainty band.
- A "now" plane sweeps along time; behind it, actuals; ahead, forecast.
- Small linked icons on the map (solar farm, wind farm, data center) pulse as their series change.

**Timeline**
1. "Forecasts start from weather, history and calendar patterns."
2. "Solar forecast: low in the cloudy morning, strong in the afternoon."
3. "Wind forecast: rising overnight."
4. "Load forecast including the data center ramp."
5. "The uncertainty band tells operators how much reserve to hold."
6. "Forecasts feed AEMS scheduling and DDLR (Digital Dynamic Line Rating) look-ahead ratings."

---

### Slide 22 — `markets` — GridOS Markets: clearing a day-ahead market

**Text panel**
- "GridOS Markets supports market transactions including wholesale, balancing, settlements and spot." (F-MKT-1)
- Modules (F-MKT-2): day-ahead and real-time markets with security-constrained commitment, scheduling and dispatch; look-ahead and fast-start resource commitment and dispatch; forward capacity markets; FTR (Financial Transmission Rights); ENTSO-E (European Network of Transmission System Operators for Electricity) markets for EU rules including capacity allocation and balancing; settlements; LEP (Limit Exchange Portal).
- "An optimization engine clears bids in day-ahead and real-time markets according to market rules." (F-MKT-3)
- Generic concepts (label as such): SCUC (Security-Constrained Unit Commitment), SCED (Security-Constrained Economic Dispatch), LMP (Locational Marginal Price).
- In GridOS for Transmission, Markets is an add-on aligned with real-time grid conditions. (F-G4T-2)

**Scene**
- 3D supply stack ("merit order"): bars for each generator offer, sorted by price (height = price, width = MW); a vertical demand plane slides in; the intersection marks the clearing price.
- Congestion: a two-zone map below; when the tie line between zones hits its limit, the price splits into two LMP (Locational Marginal Price) colours.

**Timeline**
1. "Generators submit offers: how much power, at what price."
2. "Offers are stacked from cheapest to most expensive."
3. "Demand is placed on the stack; the intersection sets the clearing price."
4. "SCUC (Security-Constrained Unit Commitment) and SCED (Security-Constrained Economic Dispatch) make sure the result is physically secure on the network."
5. "If a line is congested, prices differ by location: LMP (Locational Marginal Price)."
6. "After delivery, settlements calculate who pays and who is paid."

**Interaction:** slider "Tie-line limit (MW)" — lower it to see price separation.

---

### Slide 23 — `resilience` — Before, during, after a storm

**Text panel**
- Before — GridOS Disruption Prepare (F-RES-1): up to 72 hours ahead; uses historical weather, outage, cost and facility-damage data with GIS (Geographic Information System) data and high-resolution weather forecasts; gives hour-by-hour outage predictions at township level and damage forecasts by service center for the next 72 hours.
- During — Enterprise OMS (Outage Management System) with Outage Assist (F-RES-2): assess, dispatch, report and restore; dispatch internal or contract crews; manage power flow by zone of impact; a mobile app adds remote staff to the control center.
- After — Storm Manager (F-RES-3): acquire and activate resources, prioritize recovery, manage logistics including housing and billing for recovery personnel, communicate with the workforce.
- Also used: VI (Visual Intelligence) for vegetation risk before the storm and damage assessment after.

**Scene**
- A regional map divided into ~20 township polygons. A storm system (rotating cloud disc with rain) moves across along a forecast track with a cone of uncertainty.
- Timeline scrubber at the bottom labelled T−72h … T0 … T+48h.
- Before: township polygons extrude upward like a 3D bar map = predicted outages; crew-staging icons appear at service centers.
- During: outages appear; trucks move; zones of impact outlined.
- After: Storm Manager panel shows a resource board (crews, hotels, mutual-aid teams); polygons flatten as restoration progresses.

**Timeline**
1. "T−72h: Disruption Prepare forecasts where the storm will cause outages, hour by hour."
2. "T−48h: crews and materials are pre-staged where damage is predicted."
3. "T0: the storm hits. OMS (Outage Management System) and Outage Assist manage outages and crew dispatch."
4. "T+6h: remote staff join through the mobile app to handle routine outages."
5. "T+12h: Storm Manager brings in mutual-aid crews and manages their logistics."
6. "T+48h: restoration complete."

---

### Slide 24 — `workflow-storm` — Workflow A: one storm, every app working together

**Text panel** — a numbered list connecting earlier slides:
1. Disruption Prepare predicts damage 72 hours ahead; VI (Visual Intelligence) has already flagged high-risk trees.
2. A tree hits a feeder: ADMS (Advanced Distribution Management System) FLISR (Fault Location, Isolation and Service Restoration) isolates and restores healthy sections in minutes.
3. OMS (Outage Management System) uses AMI (Advanced Metering Infrastructure) messages to confirm who is still out.
4. GridOS Field crews record verified damage; VI images support damage assessment.
5. Storm Manager coordinates extra crews until everyone is restored.
6. At the transmission level, AEMS (Advanced Energy Management System) and WAMS (Wide Area Monitoring System) watch system stability throughout.

**Scene:** reuse assets from slides 10, 12, 15, 16, 23 in one combined town + region view. The GridOS slab above shows each app panel lighting in order with connecting arrows between panels (data handoffs drawn as blue arcs between app panels).

**Timeline:** 6 steps matching the list; camera moves between the relevant locations.

---

### Slide 25 — `workflow-solar` — Workflow B: a high-solar afternoon across T&D (Transmission and Distribution)

**Text panel**
1. GridOS Forecasting predicts high solar output and the data center's load ramp.
2. DERMS (Distributed Energy Resource Management System) forecasts backfeed on several feeders and sets dynamic operating envelopes.
3. Gateway sends limits by IEEE 2030.5 and through aggregators.
4. ADMS (Advanced Distribution Management System) confirms voltages stay within limits (VVO (Volt/VAR Optimization) fine-tunes).
5. The net load at each transmission–distribution boundary changes; AEMS (Advanced Energy Management System) sees it and adjusts dispatch.
6. DDLR (Digital Dynamic Line Rating) shows extra line capacity on a windy evening, so more power can be moved without congestion.
- Fact: GridOS DERMS integrates with ADMS, AEMS, Edge DERMS and Markets for T&D coordination. (F-DERMS-8)

**Scene:** split vertical view — top half transmission landscape, bottom half distribution neighbourhood, joined by a substation in the middle ("T&D boundary") with a big net-flow arrow that changes size and direction during the day.

**Timeline:** 6 steps matching the list.

---

### Slide 26 — `deployment` — Deployment, adoption journey, customer examples

**Text panel**
- Deployment (F-DEP-1, F-DEP-2): on-premises, cloud or hybrid. One Grid Operation (Norway, for Tensio and Linea) plans to implement GridOS over three years with ADMS on-premises and other apps on AWS (Amazon Web Services).
- Integration (F-G4D-5): Data Fabric integrates with SCADA, AEMS, AMI/MDM (Advanced Metering Infrastructure / Meter Data Management), CIS (Customer Information System) and weather systems; federated model keeps data in systems of record; open standards and documented APIs (Application Programming Interfaces).
- Customer examples (F-CUST-1..4): Alabama Power (US), One Grid Operation (Norway), Stedin (Netherlands, DER orchestration), Energy Queensland (Australia, DERMS Gateway with IEEE 2030.5).
- Caution box: "ADMS programmes are multi-year projects; results depend on SCADA, GIS and OMS data quality." (F-RISK-1)

**Scene:** a globe (low-poly) with four glowing pins for the customer examples; clicking a pin shows its card. Beside it, a 3D staircase for the adoption journey stages (distribution and transmission versions).

---

### Slide 27 — `glossary-sources` — Glossary, sources and caveats

**Text panel**
- Searchable glossary: every term from Section 12, filterable by text and category.
- Sources: list every URL from Section 11.12 as links.
- Caveats: vendor-reported statistics; illustrative simulations; technical-stack details from job postings; generic industry concepts explained using standard engineering knowledge.

**Scene:** a calm idle view of the Slide 1 landscape at dusk with the GridOS slab glowing — no timeline.

---

## 9. Build phases (stop for user review after each)

### Phase 1 — Foundation + 3 showcase slides
- Scaffold Vite project, pinned dependencies, `vite.config.js` with `vite-plugin-singlefile`.
- Deck engine (navigation, hash routing, menu, progress), slide layout, DemoController, TermsStrip, Tooltip.
- Shared Stage (one renderer, CSS2D labels, resize, visibility pause, reduced-motion toggle, WebGL fallback).
- Kit v1: pole, conductor span (catenary), substation, distribution transformer, house (with optional solar panel / battery / EV charger), tree, switch/recloser/breaker with open/closed states, crew truck, PowerFlow particles, Labels (two-line), Camera presets, legend widget, "Illustrative simulation" badge.
- `glossary.js` (all of Section 12), `facts.js` (all of Section 11), both checker scripts.
- Slides **1 (title)**, **4 (architecture)**, **10 (FLISR, including the fault-location chooser and the Feeder B loading toggle)** fully finished.
- `npm run check` and `npm run build` pass. **Stop and ask for review.**

### Phase 2 — Intro, platform, distribution overview
- Slides 2, 3, 5, 6, 7, 8, 9. Kit additions: generation assets, switchgear/HVDC/STATCOM blocks, source-system buildings, container/pod cubes, glass app panels. **Stop.**

### Phase 3 — Distribution applications
- Slides 11 (VVO with load slider), 12 (OMS night storm), 13, 14 (DERMS with time slider and on/off toggle), 15 (Field), 16 (VI with point cloud and data-source toggle). Kit additions: Weather (rain, wind, sun arc, night lighting), voltage ribbon, gauges, point-cloud generator, drone, satellite, crew figure. **Stop.**

### Phase 4 — Transmission and markets
- Slides 17, 18 (AEMS three-part demo), 19 (DDLR interactive heat-balance model), 20 (WAMS oscillation + inertia slider), 21, 22 (market stack + tie-line slider). Kit additions: lattice tower, HV substation, PMU box, ripple shader or animated vertex offsets, 3D bar/area charts. **Stop.**

### Phase 5 — Resilience, workflows, reference, polish
- Slides 23–27. Then a polish pass: consistent camera framing, label collisions fixed, legend on every scene, performance budget met, keyboard and touch tested, reduced-motion verified, final single-file build, and a `README.md` explaining how to run, edit text in `slides.js`, and add a slide. **Final review.**

---

## 10. Quality checks

### 10.1 Per-slide checklist (verify every slide before reporting a phase done)
- [ ] Text panel has: What it is, Problem / use case, How it works, Key facts (with fact IDs), Terms strip.
- [ ] Every abbreviation is expanded on first use in each text block and in every caption.
- [ ] 3D labels use the two-line format; tiny labels have tooltips.
- [ ] "Illustrative simulation" badge visible on every demo.
- [ ] Vendor-reported numbers show their qualifier.
- [ ] Legend matches the semantic colours used in the scene.
- [ ] Play, pause, step forward/back, restart and speed all work; step dots seek correctly.
- [ ] Captions never cover key geometry; no overlapping labels at 1366×768.
- [ ] Leaving the slide disposes the scene (no memory growth after visiting all slides twice — check `renderer.info.memory`).
- [ ] Works with reduced motion on.

### 10.2 `scripts/check-abbreviations.mjs` specification
- Import `slides.js` and `glossary.js`.
- A "text block" = every string field in a slide: `title`, `subtitle`, each paragraph, each bullet, each caption, each card body, each 3D label definition.
- For each glossary entry, build a case-sensitive word-boundary regex for the abbreviation and its plural (`DERs`, `PMUs`, `RTUs`, `EVs`, `DOEs`, `APIs`, `IEDs`).
- **Rule A (per text block):** the first occurrence of each abbreviation must be followed (after optional spaces) by `(` and the bracket must contain the glossary full form (case-insensitive, plural allowed), OR the full form must already appear earlier in the same block.
- **Rule B (per slide) for categories `unit` and `organization`:** expand on first use in the slide instead of every block.
- **Exemptions:** `GridOS` after Slide 1 (see F-NAME); the "GE" inside the brand names "GE Vernova" and "GE Hitachi"; switch and section tags inside topology labels (`CB-A`, `SW2`, `R1`, `S3`, `TIE`) because they are diagram identifiers, not abbreviations — but these must have tooltips.
- Output a readable report: slide hash, block, abbreviation, problem. Exit code 1 on any failure.
- Also warn (not fail) on any ALL-CAPS token of 2–6 letters that is not in the glossary or exemptions, so new abbreviations are caught and added to the glossary.

### 10.3 `scripts/check-facts.mjs` specification
- Every fact ID referenced in `slides.js` exists in `facts.js`.
- Every fact with `vendorReported: true` is rendered with its `qualifier` text (check the slide data includes the qualifier field).
- Every fact has at least one source URL.

### 10.4 Browsers and screens
- Chrome, Edge and Firefox (latest); laptop 1366×768 and 1920×1080; tablet portrait.
- Opening `dist/index.html` directly from disk (file://) must work — the single-file build makes this possible; do not rely on fetching external files at runtime.
- If the user agrees, add Playwright for automated screenshot smoke tests of every slide; otherwise provide the manual checklist results.

### 10.5 Performance budget
- Initial load of `dist/index.html` under 3 MB.
- 60 fps target, 30 fps minimum on an integrated-GPU (Graphics Processing Unit) laptop.
- No single scene above ~150k triangles; use instancing for repeated objects.

### 10.6 End-of-phase report format
1. What was built (slides, components).
2. How to run (`npm install`, `npm run dev`, `npm run build`).
3. Check results (`npm run check` output summary).
4. Known issues and anything marked `TODO-FACT`.
5. Specific things you want the user to look at and give feedback on.

---

## 11. Fact sheet (the only allowed source of product facts)

Store these in `src/content/facts.js` as objects: `{ id, text, vendorReported, qualifier, sources: [urls] }`. Sources were checked on 26 October 2026; GE Vernova product pages may change.

### 11.0 Name
- **F-NAME:** "GridOS" is GE Vernova's product name (registered trademark). "Grid Operating System" is how the name reads; GE Vernova itself describes GridOS as a software portfolio — a platform plus a suite of applications — for grid orchestration. Show this clarification once on Slide 1. Sources: S1, S13.

### 11.1 GE Vernova portfolio (no financials)
- **F-PORT-1:** Three segments: Power, Wind, Electrification. The Electrification segment includes grid solutions, power conversion, electrification software, and solar and storage technologies for transmission, distribution, conversion, storage and orchestration of electricity. Sources: S20.
- **F-PORT-2:** Grid Solutions hardware includes HVDC systems, FACTSFLEX STATCOM, synchronous condensers, modular substation automation systems, SF6-free (g3) solutions, gas-insulated switchgear from 50 kV to 800 kV (g3 SF6-free GIS at 145 kV and 420 kV), live tank circuit breakers up to 800 kV, dead tank circuit breakers up to 550 kV, hybrid and compact switchgear, switchgear monitoring, HVDC switches and disconnectors, naval and marine energy grids. Sources: S21.
- **F-PORT-3:** Prolec GE (transformers) became fully owned by GE Vernova on 2 February 2026. Sources: S22.
- **F-PORT-4:** GE Vernova sold its Proficy manufacturing software business (HMI/SCADA, MES, historian) to TPG; completed 2 March 2026. GE Vernova describes GridOS as "its enterprise software and AI platform for grid orchestration." Do not list Proficy products as GE Vernova products. Sources: S19.
- Power and Wind product families on Slide 2 (gas turbines HA/F/aeroderivative, BWRX-300 SMR with GE Hitachi, hydro, steam, onshore wind, Haliade-X offshore, LM Wind Power blades) are general public knowledge about GE Vernova; mark the Slide 2 Power and Wind cards with a small note "product family overview" and no numbers.

### 11.2 GridOS history and platform
- **F-ORCH:** GridOS was announced 6 February 2023 by GE Digital as the first software portfolio designed for grid orchestration. It integrates energy data, network modeling and AI/ML-driven analytics to power applications developed by GE, utilities and partners. Grid orchestration is described as "a system-of-systems servicing actionable data and analytics." Sources: S1, S13.
- **F-ARCH:** Original platform pillars: Zero Trust grid security model applied throughout the platform; federated grid data fabric with a common transmission and distribution network model enabling a grid digital twin; suite of intelligent grid applications; hybrid cloud architecture (on-site or hybrid). Launch partners included AWS, Accenture and Infosys. The seven-layer model on Slide 4 is this deck's teaching model built from these descriptions. Sources: S1, S14.
- **F-DF-1:** GridOS Data Fabric launched February 2024; first grid-specific data fabric. Sources: S15, S5.
- **F-DF-2:** It uses federation to access decentralized data and virtualization to generate a centralized view across transmission, distribution, IT and OT applications. It is not a centralized database, data lake or warehouse. Sources: S15, S5.
- **F-DF-3:** How it works: Discover (centralizes metadata; federation to unify access), Govern (metadata catalog organizes, indexes and unlocks data), Utilize (dashboards, query functions; low-code; minimal coding needed). Sources: S5.
- **F-DF-4:** Integrates OT and IT data and external sources such as weather, wildfire, traffic and emergency services. Itron collaborates to connect grid-edge data (e.g. residential solar, EVs). Sources: S15.
- **F-DF-5:** Use cases: T&D integration (forecasting, switching, emergency response, restoration, digital twin simulations), violation avoidance (DER backfeed), grid automation (training data for AI/ML), outage management (combining voltage, meter and location data). Sources: S5.
- **F-CONN-1:** GE Vernova acquired Greenbird Integration Technology (Norway) on 14 August 2023. Its Utilihive platform is a cloud-native iPaaS combining enterprise integration with a data lake optimized for energy; used by more than 230 utilities serving over 50 million consumers (as of 2023). Built with containerization. Sources: S16.
- **F-CONN-2:** GridOS Data Fabric & GridOS Connect are presented together as the trusted grid data foundation; Utilihive's prebuilt connectors reduce integration time and provide real-time end-to-end monitoring of data flows. Sources: S5, S17.
- **F-ZT-1:** Zero Trust is built in, not bolted on, to protect resources from inside and outside threats. An analyst report notes GridOS combines zero trust, containerized architecture, "GridOS Evergreen" incremental updates instead of large destabilizing releases, and hybrid cloud with the ability to move from on-premises to cloud-native. Sources: S1, S18.
- **F-TECH-1 (from GE Vernova job postings):** DERMS delivery uses Kubernetes-based microservices patterns; technologies listed include Docker, Kubernetes, Rancher RKE2, TLS/mTLS, PKI, Zero Trust, GitOps, DevSecOps; deployments across multi-cloud (AWS, Azure, GCP), hybrid, on-premises or edge. Keep the qualifier "(from GE Vernova job postings)". Sources: S23.
- **F-TECH-2:** Evergreen incremental updates (see F-ZT-1). ADMS FAQ mentions a microservices-based architecture for scalability; WAMS page says it scales via the GridOS microservice-based architecture. Sources: S18, S3, S8.

### 11.3 GridOS for Distribution
- **F-G4D-1:** Launched February 2026. Five applications — Smallworld Geo Network Management, GridOS ADMS, GridOS DERMS, GridOS Field, GridOS Visual Intelligence — on a single governed data foundation, GridOS Data Fabric. Sources: S2, S24.
- **F-G4D-2:** Engineered as a single solution on a federated data fabric; applications share one network model exchange and one governed data layer; planners, operators and field crews work from the same view. Sources: S2.
- **F-G4D-3:** Journey: Essentials → Disruption Management → Distribution Optimization → DER Orchestration → Distribution Intelligence. Sources: S2.
- **F-G4D-4 (vendor-reported):** Alabama Power avoided more than 112 million Customer Minutes of Interruption in 2025. Qualifier: "GE Vernova customer claim." Sources: S2.
- **F-G4D-5:** Data Fabric integrates with SCADA, AEMS, AMI/MDM, CIS and weather systems; federated model keeps data in its system of record; open standards and documented APIs. Sources: S2.
- **F-GNM-1:** Smallworld GNM creates a detailed digital representation of electric, gas, water or telecom networks; enterprise-wide network view with data quality and integrity enforced; supports a fully connected network model. Sources: S2.
- **F-FIELD-1:** GridOS Field Damage Assessment: damage assessments digitized at the source, validated against the network model, synchronized across ADMS, OMS and GIS; crews get latest geospatial and network context. Sources: S2.

### 11.4 GridOS ADMS
- **F-ADMS-1:** Three solutions in one: DMS (visualization, planning, monitoring, control, optimization), OMS (planned and unplanned outages, field mobility, damage assessment, predictive analytics), DERMS (built-in DER lifecycle capabilities). Sources: S3.
- **F-ADMS-2:** Functions listed by GE Vernova: real-time monitoring and control, load forecasting with AI/ML, FLISR, DER management, VVO, network optimization including congestion management, data management and analytics. Sources: S3.
- **F-ADMS-3:** OMS improves restoration, crew dispatch and customer communication; improves SAIDI, SAIFI and CMI. Sources: S3.
- **F-ADMS-4 (vendor-reported):** A US utility avoided over 150M CMI annually; a US utility avoided over $175M of Interruption Cost Estimates in one year. Qualifier: "GE Vernova customer claims, individual utilities." Sources: S3.
- **F-ADMS-5:** A centralized FLISR application pinpoints and isolates faults and restores power flow; GE Vernova features "model-based FISR" in a customer story. Sources: S3.

### 11.5 GridOS DERMS
- **F-DERMS-1:** Covers the full DER management lifecycle: integration, visualization, operation, control, optimization; modular; start small or roll out at scale. Sources: S4.
- **F-DERMS-2:** Core modules: Model Manager, Program Manager, Gateway (single point of communication with DERs and aggregators, certified to IEEE 2030.5), Operations, Forecasting, Optimization (scheduling based on grid constraints, economics and dynamic operating envelopes), Markets Orchestration, Flex Planning (short-term operational and long-term scenario planning including non-wires alternatives, study mode). Sources: S4.
- **F-DERMS-3:** Grid DERMS is centralized for grid-wide outcomes; Edge DERMS engages DER owners and customers with aggregation and localized control; they coordinate. Sources: S4.
- **F-DERMS-4:** Adheres to OpenADR and IEEE 2030.5. Sources: S4.
- **F-DERMS-5 (vendor-reported):** 90+ deployments globally; 127 million utility service points; ranked #1 Grid DERMS by Guidehouse Insights. Qualifier: "GE Vernova figures." Sources: S4.
- **F-DERMS-6:** Partners: EnergyHub, Nodes, EPEX Spot, Piclo, Clean Power Research, WeaveGrid, Plexigrid. Sources: S4.
- **F-DERMS-7:** Look-ahead analysis anticipates backfeeds and predicts power shortfalls or surpluses. Sources: S4.
- **F-DERMS-8:** Integrates with ADMS, AEMS, Edge DERMS and Markets for T&D visibility, coordination and control. Sources: S4.

### 11.6 GridOS Visual Intelligence
- **F-VI-1:** Processes drone imagery, satellite imagery, thermal scans and LiDAR point clouds; relies on satellite, drone, VIS/IR (visible / infrared) camera and LiDAR datasets; can use standard camera photos. Sources: S25, S26, S11.
- **F-VI-2:** Cloud-based SaaS platform with ready-to-use deep-learning models; overlays imagery with network maps to identify where vegetation must be trimmed; generates prioritized, actionable work orders. Sources: S26, S11, S27.
- **F-VI-3:** Use cases: vegetation management, asset inspection (e.g. sagging poles, corrosion, wear), wildfire mitigation, storm damage assessment. Sources: S11, S26.
- **F-VI-4:** Accurate GIS and high-quality LiDAR or photo datasets are required to train AI for asset inspection. Sources: S26.
- **F-VI-5:** GE Vernova announced the acquisition of Alteia (French visual-AI company) on 21 July 2025 to integrate visual data with operational data such as ADMS. Sources: S28.

### 11.7 GridOS for Transmission
- **F-G4T-1:** Introduced 9 June 2026 at Orchestrate 2026 (Atlanta), alongside two AI whitepapers: one on grid-edge autonomy (adaptive zone management, predictive controls, software-defined architecture, integration with EMS and ADMS) and "AI in Grid Planning" (long-range planning, interconnection analysis, forecasting, risk management, anchored by a living digital grid twin). Sources: S6, S7.
- **F-G4T-2:** Applications: AEMS (operational core), GridOS DDLR, GridOS WAMS, GridOS Forecasting, GridOS Visual Intelligence (add-on), GridOS Markets (add-on). Architecture: AEMS (operational core) + GridOS applications (intelligence layer) + Data Fabric & Connect (data foundation) forming a continuous decision loop. Sources: S6.
- **F-G4T-3:** Not a replacement for EMS; EMS remains the operational core of the control room. Sources: S6.
- **F-G4T-4:** Four competencies: Network Awareness, Capacity Management, Stability Management, Grid Resilience. Sources: S6.
- **F-G4T-5:** Journey: establish trusted network awareness → strengthen operational coordination → operate with predictive intelligence. Sources: S6.

### 11.8 Transmission applications
- **F-AEMS-1:** AEMS comprises EMS, WAMS and Analytics applications; helps manage renewables uncertainty and recovery from extreme weather. Sources: S9.
- **F-AEMS-2:** EMS functions listed by GE Vernova: real-time monitoring and visualization, supervisory control, economic dispatch, optimal power flow, contingency analysis, state estimation, energy scheduling and load forecasting, alarms and event management, integration with SCADA and market systems. Sources: S9.
- **F-AEMS-3:** Automated voltage control and system restoration; AI-based applications for renewables forecasting and inertia projections; Effective Inertia module measures and forecasts effective inertia; advanced generation optimization with real-time and look-ahead security analysis; Renewables Modeling & Forecasting; Grid Restoration. Sources: S9.
- **F-AEMS-4:** Fully compliant with NERC-CIP 002-009. Sources: S9.
- **F-AEMS-5 (vendor-reported):** Auto-restoration plan in less than 10 seconds for an area covering 3.5 million people. Qualifier: "single demonstration project, PG&E (Pacific Gas and Electric), US." Also: up to 40% inertia management cost avoided — qualifier "single demonstration project, NG ESO (National Grid Electricity System Operator), UK; results vary by generation mix." Sources: S9.
- **F-DDLR-1:** DDLR combines GIS, EMS and asset data with weather data; hourly refreshed temperature, wind speed, direction and atmospheric conditions; computes ratings without sensors or new infrastructure. Sources: S10, S29.
- **F-DDLR-2:** Field-sensor-free computation of real-time and 10-day forecasted dynamic line ratings in compliance with IEEE 738; configurable "DLR mode" and "AAR mode" (plus Emergency); actual dynamic ratings (normal, emergency, N-modes) for FERC 881 and beyond (sub-transmission, distribution); effective dynamic ratings for FAC-008 (next most limiting components). Sources: S29, S10.
- **F-DDLR-3 (vendor-reported):** Up to 33% line capacity increase; up to 250× investment reduction compared with sensor-based solutions. Qualifier: "GE Vernova figures." Footnote: AEMS page cites up to 90% transmission capacity increase "during favorable weather conditions" from a single demonstration project (PPL, US). Sources: S10, S9.
- **F-WAMS-1:** WAMS uses real-time data from PMUs; GE Vernova NASPI material shows PMU data at 60 FPS (frames per second). Sources: S30, S31.
- **F-WAMS-2:** Applications: Oscillation Monitoring and Source Location, Disturbance Detection, Islanding Re-Synchronization Support, Effective Inertia Metering, Dynamic Model Validation & Calibration. Sources: S8.
- **F-WAMS-3:** 20 years of WAMS experience (PhasorPoint) re-architected in GridOS; 2021 IEEE NASPI Oscillation Source Location contest winner; extended frequency range for oscillation monitoring (up to 46 Hz / 54 Hz); sub-synchronous oscillation management. Sources: S30, S31, S32.
- **F-WAMS-4:** Oscillation monitoring and source location extended for load-driven oscillation detection at data-center interconnections (NASPI 2026). Sources: S30.
- **F-WAMS-5 (vendor-reported):** Disturbance analysis reduced from days to hours. Qualifier: "GE Vernova customer claim." Sources: S8, S9.
- **F-FC-1:** GridOS Forecasting: forecasting of load and renewable generation to anticipate variability; supports proactive planning and improved dispatch. Sources: S6.

### 11.9 Markets and resilience
- **F-MKT-1:** GridOS Markets facilitates market transactions including wholesale, balancing, settlements and spot. Sources: S12.
- **F-MKT-2:** Covers day-ahead and real-time markets (security-constrained commitment, scheduling, dispatching), look-ahead and fast-start resource commitment and dispatch, forward capacity markets, FTR, ENTSO-E capacity allocation, scheduling and balancing markets, settlements, Limit Exchange Portal; ENTSO-E Markets module tailored to EU (ENTSO-E, ACER) regulations. Sources: S12, S33.
- **F-MKT-3:** Advanced optimization engine clears bids in day-ahead and real-time markets based on market rules and customer requirements; AI/ML-ready. Sources: S12.
- **F-RES-1:** Disruption Prepare: impact assessments up to 72 hours before an event; uses historical weather, outage, cost and facility damage data with GIS data and high-resolution weather forecasts; hour-by-hour outage predictions at township level; hour-by-hour outage and damage forecasts by service center for the next 72 hours; alerts to workforce and community. Available on cloud marketplaces. Sources: S34, S35, S36.
- **F-RES-2:** During an event, ADMS and its Enterprise OMS help assess, dispatch, report and restore; Outage Assist dispatches internal or contract crews, manages power flow by zones of impact, and augments control-center staff with remote resources via a mobile app. Sources: S35, S36.
- **F-RES-3:** Storm Manager: acquire and activate resources, prioritize and direct recovery, manage logistics including housing and billing for recovery personnel, communicate with the workforce. Sources: S36.

### 11.10 Vendor-reported statistics summary
Always display with qualifiers: F-G4D-4, F-ADMS-4, F-DERMS-5, F-AEMS-5, F-DDLR-3, F-WAMS-5.

### 11.11 Deployment, customers, risks
- **F-DEP-1:** One Grid Operation AS (Norway; for owners Tensio AS and Linea AS) purchased GridOS; plans to implement over three years; hybrid cloud with ADMS on-premises and other GridOS applications in AWS; includes ADMS and DERMS. Sources: S37.
- **F-DEP-2:** GridOS supports on-premises, cloud and hybrid deployment. Sources: S1, S23.
- **F-CUST-1:** Alabama Power (US) — see F-G4D-4. Sources: S2.
- **F-CUST-2:** One Grid Operation (Norway) — see F-DEP-1. Sources: S37.
- **F-CUST-3:** Stedin (Netherlands DSO) — end-to-end DER orchestration with GridOS DERMS. Sources: S4.
- **F-CUST-4:** Energy Queensland (Australia) — DERMS Gateway for DER connectivity with IEEE 2030.5. Sources: S4.
- **F-RISK-1:** Independent reviewers note ADMS programmes carry implementation risks including long timelines and dependency on SCADA, GIS and OMS data quality. Sources: S38.

### 11.12 Source list (use as `sources` in facts.js and on Slide 27)
- S1 https://www.ge.com/news/press-releases/GE-Digital-Announces-GridOS-Software
- S2 https://www.gevernova.com/software/products/gridos-for-distribution
- S3 https://www.gevernova.com/software/products/gridos/advanced-distribution-management-system
- S4 https://www.gevernova.com/software/products/gridos/distributed-energy-resources-management-system
- S5 https://www.gevernova.com/software/products/gridos/grid-data-fabric
- S6 https://www.gevernova.com/software/products/gridos-for-transmission
- S7 https://www.gevernova.com/news/press-releases/ge-vernova-introduces-gridosr-transmission-new-ai
- S8 https://gevernova.com/software/products/gridos/wide-area-management-system
- S9 https://www.gevernova.com/software/products/gridos/advanced-energy-management-system
- S10 https://gevernova.com/software/products/gridos/digital-dynamic-line-rating
- S11 https://www.gevernova.com/software/products/gridos/visual-intelligence
- S12 https://gevernova.com/software/products/gridos/energy-markets-software
- S13 https://gevernova.com/software/products/gridos
- S14 https://www.businesswire.com/news/home/20230206005216/en
- S15 https://www.turbomachinerymag.com/view/ge-vernova-launches-data-management-software-gridos-data-fabric
- S16 https://www.ge.com/news/press-releases/ge-vernova-acquires-greenbird-to-accelerate-gridos-innovation
- S17 https://www.enlit.world/library/acceleration-gridos-with-utilihive
- S18 https://gevernova.com/software/sites/default/files/2024-10/ge-vernovas-gridos-aims-to-bring-zero-trust-to-power-operations-1_0.pdf
- S19 https://www.gevernova.com/news/press-releases/ge-vernova-completes-sale-proficyr-software-business
- S20 https://new.alphaspread.com/security/mil/1gev/investor-relations (segment description only — do not use any financial figures from it)
- S21 https://www.gevernova.com/grid-solutions/node?page=40
- S22 https://www.sec.gov/Archives/edgar/data/0001996810/000199681026000063/gevpressrelease1q26.htm (Prolec GE acquisition date only — do not use financial figures)
- S23 https://www.themuse.com/jobs/gevernova/derms-technology-specialist-a1f35b
- S24 https://www.usa.smart-grids-conference.com/news/meet-the-os-running-americas-electric-future
- S25 https://aws.amazon.com/marketplace/pp/prodview-cboqj2pokiexk
- S26 https://www.eurelectric.org/stories/ge-vernova-visual-grid-analytics/
- S27 https://www.gevernova.com/software/blog/lidar-vs-satellite-utility-vegetation-management
- S28 https://www.renewableenergyworld.com/power-grid/smart-grids/ge-vernova-acquires-alteia-bringing-new-intelligence-to-gridos-tech/
- S29 https://query.prod.cms.rt.microsoft.com/cms/api/am/binary/RW1hWZM
- S30 https://www.naspi.org/sites/default/files/2026-04/3-1_Khan-GEVernova_0.pdf
- S31 https://naspi.org/sites/default/files/2023-11/D2_S12_01_Parashar_GE_20230927.pdf
- S32 https://www.ge.com/digital/applications/transmission/wide-area-management-system-and-control-wams-wamc
- S33 https://www.g2.com/products/advanced-market-management-system-amms/discuss
- S34 https://aws.amazon.com/marketplace/pp/prodview-7wrrcdyrbjeqm
- S35 https://www.gevernova.com/software/products/gridos/power-grid-disruption
- S36 https://www.ge.com/digital/sites/default/files/download_assets/protect-against-power-grid-disruptions.pdf
- S37 https://www.gevernova.com/news/press-releases/ge-vernova-software-reliable-sustainable-electricity-norway
- S38 https://us.fitgap.com/products/039108/gridos

---

## 12. Glossary (single source of truth for `src/content/glossary.js`)

Store as `{ abbr, full, category, meaning, plurals? }`. Categories: `app`, `distribution`, `transmission`, `markets`, `data-it-ot`, `security-cloud`, `standard`, `organization`, `metric`, `hardware`, `unit`.

**Brand names are not abbreviations** and are exempt from the checker: GE Vernova, GE Hitachi, Smallworld, Utilihive, PhasorPoint, Prolec GE, FACTSFLEX, Haliade-X, LM Wind Power, Multilin, MiCOM, Lentronics, CERius, Meridium, SmartSignal, Greenbird, Alteia, Itron, Orchestrate.

| Abbreviation | Full form | Category | Plain-English meaning |
|---|---|---|---|
| GridOS | Grid Operating System (product name; see F-NAME) | app | GE Vernova's grid orchestration software portfolio |
| ADMS | Advanced Distribution Management System | app | Runs the distribution grid in real time; DMS + OMS + DERMS |
| DMS | Distribution Management System | app | Monitoring, analysis, control and optimization of feeders |
| OMS | Outage Management System | app | Detects, tracks and restores outages; manages crews |
| EOMS | Enterprise Outage Management System | app | GE Vernova's enterprise-scale OMS inside ADMS |
| DERMS | Distributed Energy Resource Management System | app | Monitors, forecasts, optimizes and dispatches DERs |
| GNM | Geo Network Management | app | Smallworld GIS-based digital network model |
| VI | Visual Intelligence | app | AI analysis of drone, satellite, LiDAR and camera images |
| AEMS | Advanced Energy Management System | app | Transmission control-room core: EMS + WAMS + analytics |
| EMS | Energy Management System | app | Monitors and controls the transmission grid and generation |
| DDLR | Digital Dynamic Line Rating | app | Software-only, weather-based line capacity |
| WAMS | Wide Area Monitoring System | app | Uses PMU data to watch fast grid dynamics across a region |
| WAMPAC | Wide Area Monitoring, Protection and Control | app | WAMS plus automatic protection and control actions |
| APM | Asset Performance Management | app | Asset health and maintenance strategy software |
| HMI | Human-Machine Interface | data-it-ot | Operator screens |
| SCADA | Supervisory Control and Data Acquisition | data-it-ot | Real-time telemetry and remote control of field devices |
| RTU | Remote Terminal Unit | data-it-ot | Field device that sends data to SCADA (plural RTUs) |
| IED | Intelligent Electronic Device | data-it-ot | Relays, meters and controllers with communications (plural IEDs) |
| PMU | Phasor Measurement Unit | transmission | GPS-time-stamped voltage/current phasors, many per second (plural PMUs) |
| PDC | Phasor Data Concentrator | transmission | Collects and time-aligns PMU streams |
| AMI | Advanced Metering Infrastructure | data-it-ot | Smart meters and their communication network |
| MDM / MDMS | Meter Data Management / Meter Data Management System | data-it-ot | Stores and validates smart-meter data |
| CIS | Customer Information System | data-it-ot | Customer accounts and billing |
| ERP | Enterprise Resource Planning | data-it-ot | Business system for finance, supply chain, HR |
| EAM | Enterprise Asset Management | data-it-ot | Asset records and work management |
| GIS (software) | Geographic Information System | data-it-ot | Maps assets and network connectivity |
| GIS (hardware) | Gas-Insulated Switchgear | hardware | Compact switchgear insulated with gas — same letters, different meaning |
| IT | Information Technology | data-it-ot | Business computing systems |
| OT | Operational Technology | data-it-ot | Systems that monitor and control physical equipment |
| iPaaS | Integration Platform as a Service | data-it-ot | Cloud integration hub (Utilihive is one) |
| API | Application Programming Interface | data-it-ot | Defined way for software to talk to other software (plural APIs) |
| SaaS | Software as a Service | security-cloud | Software delivered from the cloud on subscription |
| AI | Artificial Intelligence | data-it-ot | Software that learns patterns and makes predictions |
| ML | Machine Learning | data-it-ot | Subset of AI that learns from data |
| LiDAR | Light Detection and Ranging | data-it-ot | Laser scanning that creates 3D point clouds |
| VIS/IR | Visible / Infrared | data-it-ot | Camera image types |
| GPS | Global Positioning System | data-it-ot | Satellite positioning and precise time source for PMUs |
| DTS | Dispatcher Training Simulator | data-it-ot | Control-room training environment |
| HUD | Heads-Up Display | data-it-ot | On-screen overlay showing live numbers in the demo |
| MES | Manufacturing Execution System | data-it-ot | Factory software (part of the sold Proficy business) |
| DER | Distributed Energy Resource | distribution | Small generation or storage on the distribution grid (plural DERs) |
| EV | Electric Vehicle | distribution | (plural EVs) |
| PV | Photovoltaic | distribution | Solar panels |
| BESS | Battery Energy Storage System | hardware | Grid or site battery |
| FLISR | Fault Location, Isolation and Service Restoration | distribution | Finds a fault, isolates it, re-feeds healthy sections |
| FISR | Fault Isolation and Service Restoration | distribution | FLISR variant without the location step |
| VVO | Volt/VAR Optimization | distribution | Optimizes voltage and reactive power to cut losses |
| VAR | Volt-Ampere Reactive | unit | Unit of reactive power |
| MVAR | Mega Volt-Ampere Reactive | unit | One million VAR |
| CVR | Conservation Voltage Reduction | distribution | Running voltage low within limits to save energy |
| LTC | Load Tap Changer | hardware | Transformer device that adjusts voltage under load |
| DOE | Dynamic Operating Envelope | distribution | Time-varying import/export limit for a DER (plural DOEs) |
| NWA | Non-Wires Alternative | distribution | Using DERs/flexibility instead of new lines or transformers |
| VPP | Virtual Power Plant | distribution | Many DERs aggregated to act like one plant |
| ETR | Estimated Time to Restore | distribution | Predicted time power returns |
| LV / MV / HV | Low / Medium / High Voltage | unit | Voltage levels |
| T&D | Transmission and Distribution | transmission | The two parts of the delivery grid |
| SE | State Estimation | transmission | Best estimate of true grid state from imperfect measurements |
| CA | Contingency Analysis | transmission | Simulates equipment outages to test security |
| N-1 | Loss of any one element (N minus 1) | transmission | Grid must survive losing any single major element |
| OPF | Optimal Power Flow | transmission | Cheapest secure dispatch meeting network limits |
| AGC | Automatic Generation Control | transmission | Adjusts generators to hold frequency and interchange |
| SLR | Static Line Rating | transmission | Fixed worst-case line capacity |
| DLR | Dynamic Line Rating | transmission | Line capacity that changes with real weather |
| AAR | Ambient Adjusted Rating | transmission | Rating adjusted mainly for air temperature; hourly under FERC 881 |
| OSM | Oscillation Monitoring | transmission | Detects power-system oscillations |
| OSL | Oscillation Source Location | transmission | Finds where an oscillation originates |
| FID | Fast Instability Detection | transmission | Sub-cycle detection of growing unstable oscillations |
| LSE | Linear State Estimation | transmission | PMU-based state estimation at data rate |
| HVDC | High Voltage Direct Current | hardware | DC transmission for long distances or linking grids |
| AC / DC | Alternating Current / Direct Current | unit | Two forms of electric current |
| FACTS | Flexible AC Transmission Systems | hardware | Power-electronic devices controlling voltage and flow |
| STATCOM | Static Synchronous Compensator | hardware | Fast reactive-power FACTS device |
| SVC | Static VAR Compensator | hardware | Thyristor-based reactive-power device |
| AIS | Air-Insulated Switchgear | hardware | Switchgear insulated by open air |
| SF6 | Sulphur hexafluoride | hardware | Potent greenhouse gas used as switchgear insulation |
| g3 | green gas for grid | hardware | GE Vernova's SF6-free insulating gas technology |
| SMR | Small Modular Reactor | hardware | Factory-built smaller nuclear reactor |
| BWRX-300 | Boiling Water Reactor, 300 MW class (GE Hitachi design) | hardware | GE Hitachi's SMR |
| HA | Air-cooled H-class (GE gas turbine class) | hardware | GE's highest-efficiency heavy-duty gas turbines |
| SCUC | Security-Constrained Unit Commitment | markets | Decides which generators run, respecting security |
| SCED | Security-Constrained Economic Dispatch | markets | Sets output of committed units at least cost |
| LMP | Locational Marginal Price | markets | Price at each grid node including congestion and losses |
| FTR | Financial Transmission Right | markets | Hedge against congestion costs |
| CRR | Congestion Revenue Right | markets | Equivalent of FTR in some markets |
| LEP | Limit Exchange Portal | markets | GridOS Markets module for exchanging limits |
| TLS / mTLS | Transport Layer Security / mutual TLS | security-cloud | Encrypted connections; mTLS authenticates both sides |
| PKI | Public Key Infrastructure | security-cloud | Certificates that prove identity |
| ACL | Access Control List | security-cloud | Rules for who may access what |
| K8s | Kubernetes | security-cloud | Container orchestration platform |
| RKE2 | Rancher Kubernetes Engine 2 | security-cloud | Security-hardened Kubernetes distribution |
| DevSecOps | Development, Security and Operations | security-cloud | Security built into delivery pipelines |
| GitOps | Git-based Operations | security-cloud | Managing deployments declaratively from a Git repository |
| AWS | Amazon Web Services | organization | Cloud provider |
| GCP | Google Cloud Platform | organization | Cloud provider |
| GPU | Graphics Processing Unit | unit | Chip that renders 3D graphics |
| FPS | Frames Per Second | unit | Update or render rate |
| NERC | North American Electric Reliability Corporation | organization | Sets grid reliability standards |
| NERC CIP | NERC Critical Infrastructure Protection | standard | NERC cybersecurity standards |
| CIP | Critical Infrastructure Protection | standard | (used with NERC) |
| FERC | Federal Energy Regulatory Commission | organization | US energy regulator |
| FERC 881 | FERC Order No. 881 | standard | Requires hourly ambient-adjusted line ratings |
| FAC-008 | NERC Facility Ratings standard | standard | Ratings set by the most limiting component |
| IEEE | Institute of Electrical and Electronics Engineers | organization | Standards body |
| IEEE 738 | IEEE standard for calculating conductor temperature and current | standard | Line-rating calculation method |
| IEEE 2030.5 | IEEE smart energy profile for DER communication | standard | Protocol used by DERMS Gateway |
| IEEE 1547 | IEEE standard for DER interconnection | standard | How DERs connect to the grid |
| IEC | International Electrotechnical Commission | organization | Standards body |
| OpenADR | Open Automated Demand Response | standard | Protocol for demand-response signals |
| NASPI | North American SynchroPhasor Initiative | organization | Industry group for PMU technology |
| ENTSO-E | European Network of Transmission System Operators for Electricity | organization | EU transmission operators' association |
| ACER | European Union Agency for the Cooperation of Energy Regulators | organization | EU regulator body |
| TSO / TO | Transmission System Operator / Transmission Owner | organization | Operates / owns the transmission grid |
| DSO | Distribution System Operator | organization | Operates the distribution grid |
| ISO / RTO | Independent System Operator / Regional Transmission Organization | organization | Run wholesale markets and bulk grids |
| PG&E | Pacific Gas and Electric | organization | US utility (AEMS restoration demo) |
| NG ESO | National Grid Electricity System Operator | organization | UK system operator (inertia demo) |
| PPL | PPL Corporation (formerly Pennsylvania Power and Light) | organization | US utility (DLR demo) |
| TPG | TPG Inc. (formerly Texas Pacific Group) | organization | Investment firm that bought Proficy |
| US / UK / EU | United States / United Kingdom / European Union | organization | |
| SAIDI | System Average Interruption Duration Index | metric | Average outage minutes per customer |
| SAIFI | System Average Interruption Frequency Index | metric | Average number of outages per customer |
| CMI | Customer Minutes of Interruption | metric | Customers × minutes without power |
| ICE | Interruption Cost Estimate | metric | Economic cost of outages |
| pu | per unit | unit | Value as a fraction of a reference (1.00 pu = nominal) |
| kV | kilovolt | unit | 1,000 volts |
| MW | megawatt | unit | 1,000,000 watts |
| Hz | hertz | unit | Cycles per second |

Industry standards you may mention in tooltips only as general background (not as confirmed GE Vernova specifications): CIM (Common Information Model, IEC 61968/61970), IEC 61850 (substation automation communication), DNP3 (Distributed Network Protocol 3), ICCP (Inter-Control Center Communications Protocol, IEC 60870-6). If used, add them to the glossary.

---

## 13. Acceptance criteria (the deck is done when all are true)

1. `npm run build` produces one `dist/index.html` that opens by double-click in Chrome, Edge and Firefox with no network connection.
2. All 27 slides exist in the order of Section 7, each reachable by menu, keyboard and URL hash.
3. Every demo slide has a working timeline with play, pause, step, restart, speed and synced captions.
4. Slides 10, 11, 14, 16, 19, 20 and 22 have the interactive controls specified.
5. `npm run check` passes: zero abbreviation violations, zero missing fact IDs.
6. No financial figures appear anywhere.
7. Every demo shows the "Illustrative simulation" badge; every vendor-reported figure shows its qualifier.
8. Visiting every slide twice does not grow GPU memory without bound.
9. Reduced-motion mode and WebGL fallback both work.
10. `README.md` explains how to run, edit text, add a slide, and add a glossary term.

---

## 14. Your first reply (Claude Code)

Before writing code, reply with:
1. A short summary of your understanding of the project in 5 bullet points.
2. Any questions or conflicts you found in this brief.
3. Your Phase 1 plan (files you will create and in what order).

Then wait for the user to say "go" before starting Phase 1.
