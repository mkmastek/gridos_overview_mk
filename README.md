# GridOS explainer deck

An interactive, slide-by-slide 3D explainer of how GE Vernova's **GridOS (Grid Operating System)**
works, application by application. 27 slides; each demo plays step by step, and a strip inside the
3D view shows **what is moving** (power, data, command, decision), **from where to where**, and
**via which system**.

The finished product is **one self-contained HTML file**: no server, no React, no extra files.
It opens by double-clicking and works offline. Node.js is only used to *build* that file.

Branding follows the Mastek Brand Book (2023): Mastek colours, Titillium Web and Poppins fonts,
and the Mastek logo on a white top bar.

---

## 1. View it

- **Double-click** `docs/index.html` (or `dist/index.html`) — it opens in Chrome, Edge or Firefox.
- Keys: `←` `→` change slide · `P` play/pause · `.` `,` next/previous step · `R` restart · `Home` / `End`.
- Every slide has its own link, e.g. `index.html#adms-flisr`.

## 2. Publish on GitHub Pages

1. Build the file (see §3): `npm run pages` writes `docs/index.html` (and `docs/.nojekyll`).
2. Push the repository to GitHub.
3. On GitHub: **Settings → Pages → Build and deployment → Deploy from a branch**,
   choose your branch and the **`/docs`** folder, then **Save**.
4. After a minute the deck is live at `https://<user>.github.io/<repository>/`.

Only `docs/index.html` is needed. You can also put that single file in any repository's root
and name it `index.html`.

## 3. Build it yourself

Requires Node.js 18 or newer.

```bash
npm install      # once
npm run dev      # live preview at http://localhost:5173 while editing
npm run check    # abbreviation + fact checks (must pass)
npm run build    # → dist/index.html (single file)
npm run pages    # check + build + copy to docs/index.html for GitHub Pages
```

## 4. Edit the text

All reader-facing text lives in `src/content/` — never in the 3D code:

| File | Contains |
|---|---|
| `slides.js` | interface wording, slide order, Slides 1, 4 and 10, writing rules |
| `slides-phase2.js` … `slides-phase5.js` | the other slides, grouped by build phase |
| `glossary.js` | every abbreviation with its full form (single source of truth) |
| `facts.js` | the only allowed product facts, with source links |

Rules the checker enforces (`npm run check`):

- Write every abbreviation as **ABBR (Full Form)** on first use in each paragraph, bullet,
  caption, card, 3D label and flow box. For two-line labels: `{ title: 'ADMS', sub: 'Advanced Distribution Management System' }`.
- Units and organisations (MW, AWS, IEEE …) need expanding once per slide.
- Key facts cite a fact ID (`F-…`) from `facts.js`; vendor-reported facts must show their qualifier.
- No company financial figures.

Each demo step looks like this:

```js
{
  id: 'step4',
  caption: 'Fault indicators report which devices saw fault current.',
  flow: {
    type: 'data',                       // power | data | command | decision | event | govern | reverse
    from: { title: 'R1 and SW2', sub: 'saw fault current' },
    to:   { title: 'ADMS', sub: 'Advanced Distribution Management System' },
    via:  { title: 'SCADA', sub: 'Supervisory Control and Data Acquisition' },
  },
}
```

## 5. Add a slide

1. Add the slide object to a content file (copy an existing slide: `id`, `section`, `title`,
   `subtitle`, `blocks`, `keyFacts`, `steps`, `labels`, `legend`, `scene: 'sNN-name'`).
2. If it is new, add its position in the `slides` list at the bottom of `src/content/slides.js`.
3. Create `src/three/scenes/sNN-name.js` exporting `createScene(stage, kit, ctx)` — copy
   `s01-title.js` for a simple scene or `s10-flisr.js` for an interactive demo.
4. Register it in the matching `src/three/scenes/registry-phase*.js` (or `index.js`).
5. `npm run check`, then `npm run dev` to try it.

## 6. Add a glossary term

Add one line to `src/content/glossary.js`:

```js
{ abbr: 'DNP3', full: 'Distributed Network Protocol 3', category: 'standard', meaning: 'Protocol used between control centers and field devices.' },
```

The tooltips, the "Terms on this slide" strip, the searchable glossary (Slide 27) and the
checker all pick it up automatically.

## 7. Project structure

```
src/
  content/        all text, glossary, facts, shared abbreviation matcher
  deck/           deck engine, slide layout, demo controller, tooltips, terms strip
  three/          shared 3D stage, materials, palette
    kit/          reusable low-poly 3D building blocks
    scenes/       one file per slide scene
  sim/            small pure models (FLISR solver, …) — testable in Node
  assets/         Mastek logos and brand fonts (embedded in the build)
scripts/          check-abbreviations.mjs, check-facts.mjs, copy-to-docs.mjs
docs/             GitHub Pages output (index.html)
```

## 8. Accuracy notes

- Product facts come only from `src/content/facts.js` (sources checked 26 October 2026).
- Every demo is an **illustrative simulation — not the real GridOS user interface**; numbers in
  animations are illustrative.
- Vendor-reported figures are shown with their qualifier; job-posting details are marked as such;
  generic industry logic (for example how FLISR works in general) is labelled as generic.
- Fonts: see `src/assets/fonts/FONTS-LICENSE.md`.
