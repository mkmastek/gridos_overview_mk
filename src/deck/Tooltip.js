// One floating tooltip for the whole deck.
//   • Any element with data-tip="…" shows it on hover, keyboard focus, or tap (touch).
//   • 3D scenes call showAt(x, y, text) / hide() for objects under the pointer.
// Text is plain; "\n" becomes a line break (white-space: pre-line).

export class Tooltip {
  constructor(root) {
    this.el = document.createElement('div');
    this.el.className = 'tooltip';
    this.el.setAttribute('role', 'tooltip');
    this.el.hidden = true;
    root.append(this.el);
    this.owner = null;

    const tipTarget = (e) => (e.target instanceof Element ? e.target.closest('[data-tip]') : null);

    root.addEventListener('pointerover', (e) => {
      if (e.pointerType === 'touch') return;
      const t = tipTarget(e);
      if (t) this.showFor(t);
    });
    root.addEventListener('pointerout', (e) => {
      const t = tipTarget(e);
      if (t && t === this.owner && !t.contains(e.relatedTarget)) this.hide();
    });
    root.addEventListener('focusin', (e) => {
      const t = tipTarget(e);
      if (t) this.showFor(t);
    });
    root.addEventListener('focusout', () => this.hide());
    // Touch: tap toggles the tooltip of the tapped element; tapping elsewhere closes it.
    root.addEventListener('pointerup', (e) => {
      if (e.pointerType !== 'touch') return;
      const t = tipTarget(e);
      if (t && t !== this.owner) this.showFor(t);
      else this.hide();
    });
    window.addEventListener('scroll', () => this.hide(), { passive: true, capture: true });
  }

  showFor(target) {
    const text = target.getAttribute('data-tip');
    if (!text) return;
    this.owner = target;
    const r = target.getBoundingClientRect();
    this.render(text);
    this.place(r.left + r.width / 2, r.bottom + 8, r.top - 8);
  }

  showAt(x, y, text) {
    this.owner = null;
    this.render(text);
    this.place(x + 14, y + 18, y - 14);
  }

  render(text) {
    this.el.textContent = text;
    this.el.hidden = false;
  }

  place(cx, below, above) {
    const { innerWidth: vw, innerHeight: vh } = window;
    const w = this.el.offsetWidth;
    const h = this.el.offsetHeight;
    const left = Math.min(Math.max(8, cx - w / 2), vw - w - 8);
    const top = below + h > vh - 8 ? Math.max(8, above - h) : below;
    this.el.style.left = `${left}px`;
    this.el.style.top = `${top}px`;
  }

  hide() {
    this.owner = null;
    this.el.hidden = true;
  }
}
