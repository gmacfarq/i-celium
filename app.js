// I-celium — a living map of attachments, growing out from the self.
// Everything is stored locally in this browser (localStorage). Use Export to back up.

// The four upādānas (kinds of attachment) are the main cords of the mycelium.
// "forms" are the practical shapes each takes, drawn from Vipassana teaching.
const CATEGORIES = [
  {
    id: 'kama', pali: 'kāmupādāna', label: 'Sensual attachment', color: '#e0a890',
    desc: 'Attachment to sights, sounds, smells, tastes, touches and pleasant mental objects. Chasing pleasant sensation and resisting unpleasant sensation.',
    forms: ['Sights', 'Sounds', 'Smells', 'Tastes', 'Touch & body sensations', 'Pleasant mental states'],
  },
  {
    id: 'ditthi', pali: 'diṭṭhupādāna', label: 'Attachment to views', color: '#8fb8c9',
    desc: 'Holding rigidly to opinions, beliefs, ideologies or personal certainty.',
    forms: ['Opinions', 'Beliefs & ideologies', 'Being right / certainty', 'How things should turn out'],
  },
  {
    id: 'silabbata', pali: 'sīlabbatupādāna', label: 'Attachment to rites & rituals', color: '#d9c27a',
    desc: 'Attachment to ceremonies, rules, routines or spiritual forms as ends in themselves rather than tools for insight. This includes attachment to a technique, to meditation states, or to spiritual progress.',
    forms: ['Rules & routines', 'Ceremonies & spiritual forms', 'Meditation states', 'Technique', 'Spiritual progress'],
  },
  {
    id: 'attavada', pali: 'attavādupādāna', label: 'Attachment to self', color: '#a6c48a',
    desc: 'Attachment to the idea of a permanent, separate "I", and defending "I" and "mine": self-image, roles, relationships and possessions.',
    forms: ['Self-image & ego', 'Roles', 'Relationships', 'Possessions ("mine")'],
  },
];
const TONES = { craving: 'Craving (wanting it)', aversion: 'Aversion (pushing it away)' };

// Earlier versions used seven everyday categories; fold them into the four upādānas.
const LEGACY = {
  people:      { category: 'attavada', form: 'Relationships' },
  possessions: { category: 'attavada', form: 'Possessions ("mine")' },
  identity:    { category: 'attavada', form: 'Self-image & ego' },
  views:       { category: 'ditthi',   form: 'Beliefs & ideologies' },
  pleasures:   { category: 'kama',     form: '' },
  aversions:   { category: 'kama',     form: '', tone: 'aversion' },
  outcomes:    { category: 'ditthi',   form: 'How things should turn out' },
};
const STRENGTH_WORDS = ['', 'lightly', 'loosely', 'firmly', 'tightly', 'held fast'];
const STORAGE_KEY = 'icelium.v1';
const GROW_MS = 2600;
const BREATH_S = 10; // one slow breath cycle for the I

// ---------- state ----------

let state = load();
let selectedId = null;
let hoverId = null;

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data.attachments)) return migrate(data);
    }
  } catch (_) { /* storage unavailable — start empty */ }
  return { attachments: [] };
}

function migrate(data) {
  for (const a of data.attachments) {
    const old = LEGACY[a.category];
    if (old) {
      a.category = old.category;
      a.form = a.form || old.form;
      if (old.tone) a.tone = old.tone;
      a.slot = undefined;
    }
    if (!CATEGORIES.some(c => c.id === a.category)) a.category = 'attavada';
    a.tone = a.tone || 'craving';
    a.form = a.form || '';
  }
  // Re-slot migrated items so they spread evenly within their new quadrant.
  const placed = { attachments: [] };
  for (const a of data.attachments) {
    if (typeof a.slot !== 'number') a.slot = pickSlot(a.category, placed.attachments);
    placed.attachments.push(a);
  }
  // Every attachment keeps stored coordinates (field units, I at 0,0), so it stays
  // where it was placed or dragged. Older records get theirs here, moved off the cord.
  for (const a of data.attachments) {
    if (!validPos(a.pos)) {
      a.slot = offCord(a.slot, a.id);
      a.pos = roundPos(targetOf({ ...a, pos: undefined }));
    }
  }
  return data;
}

// (function declarations, not consts: these run during load(), before later consts exist)
function validPos(p) { return Array.isArray(p) && p.length === 2 && p.every(Number.isFinite); }
function roundPos([x, y]) { return [Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000]; }

// The cord runs down the middle of each quadrant (slot 0.5); keep nodes beside it.
function offCord(slot, id) {
  if (Math.abs(slot - 0.5) >= 0.1) return slot;
  return hashStr(id) % 2 ? 0.32 : 0.68;
}

// Radius for a given tightness: tighter attachments sit closer to the I.
function radiusFor(strength) { return 0.32 + (5 - strength) * 0.14; }

function save() {
  try { localStorage.setItem(STORAGE_KEY, serialize()); } catch (_) {}
}

// `fresh` is a transient "grow this in" flag, not part of the record.
function serialize(space) {
  return JSON.stringify(state, (k, v) => (k === 'fresh' ? undefined : v), space);
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Choose the widest free slot in a category's sector so existing nodes never move.
function pickSlot(category, list = state.attachments) {
  const used = list
    .filter(a => a.category === category)
    .map(a => a.slot)
    .sort((a, b) => a - b);
  const edges = [0.1, ...used, 0.9];
  let best = 0.5, gap = -1;
  for (let i = 0; i < edges.length - 1; i++) {
    const g = edges[i + 1] - edges[i];
    if (g > gap) { gap = g; best = (edges[i] + edges[i + 1]) / 2; }
  }
  return used.length ? best : 0.3;
}

// ---------- seeded randomness (so each hypha keeps its shape) ----------

function hashStr(s) {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const angDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

// ---------- geometry (in "units": the field radius = 1) ----------

// Where an attachment sits: its stored coordinates, or a default spot in its quadrant.
function targetOf(a) {
  if (validPos(a.pos)) return a.pos;
  const ci = Math.max(0, CATEGORIES.findIndex(c => c.id === a.category));
  const sector = (Math.PI * 2) / CATEGORIES.length;
  const angle = -Math.PI / 2 + ci * sector + a.slot * sector;
  const rng = mulberry32(hashStr(a.id + 'r'));
  const r = radiusFor(a.strength) + (rng() - 0.5) * 0.06;
  return [Math.cos(angle) * r, Math.sin(angle) * r];
}

function wander(rng, from, heading, steps, stepLen, jitter) {
  const pts = [[from[0], from[1]]];
  let [x, y] = from, h = heading;
  for (let i = 0; i < steps; i++) {
    h += (rng() - 0.5) * jitter;
    x += Math.cos(h) * stepLen; y += Math.sin(h) * stepLen;
    pts.push([x, y]);
  }
  return pts;
}

function growHypha(rng, from, to, jitter = 0.75) {
  const pts = [[from[0], from[1]]];
  let [x, y] = from;
  let h = Math.atan2(to[1] - y, to[0] - x) + (rng() - 0.5) * jitter * 1.6;
  const step = 0.022;
  for (let i = 0; i < 400; i++) {
    const dx = to[0] - x, dy = to[1] - y, d = Math.hypot(dx, dy);
    if (d < step * 1.5) break;
    const pull = d < 0.12 ? 0.55 : 0.16;
    h += angDiff(Math.atan2(dy, dx), h) * pull + (rng() - 0.5) * jitter;
    x += Math.cos(h) * step; y += Math.sin(h) * step;
    pts.push([x, y]);
  }
  pts.push([to[0], to[1]]);
  return pts;
}

function sproutBranches(rng, main, at0, span, depth) {
  const out = [];
  for (let i = 3; i < main.length - 2; i++) {
    if (rng() > (depth ? 0.07 : 0.12)) continue;
    const [x0, y0] = main[i], [x1, y1] = main[i - 1];
    const h = Math.atan2(y0 - y1, x0 - x1) + (rng() < 0.5 ? -1 : 1) * (0.5 + rng() * 0.9);
    const pts = wander(rng, [x0, y0], h, 4 + Math.floor(rng() * (depth ? 6 : 14)), 0.018, 0.7);
    const at = at0 + (i / main.length) * span;
    out.push({ at, pts, depth: depth + 1 });
    if (depth < 1) out.push(...sproutBranches(rng, pts, at, 0.25, depth + 1));
  }
  return out;
}

// The four main cords (rhizomorphs), one per upādāna, running out from the I
// along the middle of each quadrant. They are fixed: same shape every visit.
const CORD_MS = 1800;
let cordsBorn = 0;
const cords = CATEGORIES.map((c, ci) => {
  const sector = (Math.PI * 2) / CATEGORIES.length;
  const angle = -Math.PI / 2 + (ci + 0.5) * sector;
  const rng = mulberry32(hashStr('cord-' + c.id));
  const main = growHypha(rng, [0, 0], [Math.cos(angle) * 1.02, Math.sin(angle) * 1.02], 0.35);
  return { id: c.id, angle, main, branches: sproutBranches(rng, main, 0, 1, 0) };
});

// Where along its cord an attachment's hypha leaves: closer to the I for tighter ones.
function cordAnchor(a, target) {
  const cord = cords.find(c => c.id === a.category) || cords[0];
  const want = Math.max(0.08, Math.hypot(target[0], target[1]) * 0.55);
  let best = cord.main[0], bd = Infinity;
  for (const p of cord.main) {
    const d = Math.abs(Math.hypot(p[0], p[1]) - want);
    if (d < bd) { bd = d; best = p; }
  }
  return best;
}

// Cache of generated hyphae, rebuilt when an attachment moves or changes.
// The seed depends only on the attachment, so a dragged hypha keeps its character.
const hyphae = new Map();
function hyphaFor(a, now) {
  const target = targetOf(a);
  const key = `${a.category}|${a.strength}|${target[0].toFixed(3)},${target[1].toFixed(3)}`;
  let h = hyphae.get(a.id);
  if (!h || h.key !== key) {
    const rng = mulberry32(hashStr(a.id + a.category));
    const main = growHypha(rng, cordAnchor(a, target), target);
    // Grow in when new or when its kind/tightness changed; simply moving it does not regrow it.
    // On first load, wait for the cords to grow before sprouting attachments.
    const regrow = a.fresh || (h && (h.category !== a.category || h.strength !== a.strength));
    const born = regrow ? Math.max(now, cordsBorn + CORD_MS * 0.7) : h ? h.born : -1e9;
    h = { key, target, main, branches: sproutBranches(rng, main, 0, 1, 0), born, category: a.category, strength: a.strength };
    delete a.fresh;
    hyphae.set(a.id, h);
  }
  return h;
}

// ---------- canvas ----------

const canvas = document.getElementById('field');
const ctx = canvas.getContext('2d');
let W = 0, H = 0, CX = 0, CY = 0, R = 1, DPR = 1;
let soilLayer = null;

function resize() {
  DPR = window.devicePixelRatio || 1;
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = W * DPR; canvas.height = H * DPR;
  CX = W / 2; CY = H / 2 + 10;
  R = Math.min(W, H) / 2 * 0.86;
  paintSoil();
  setFocus(focusId, true);
}

// ---------- camera: overview of all four cords, or zoomed into one ----------

// The point (in field units) at the screen centre, and the zoom factor.
const cam = { x: 0, y: 0, z: 1 };
let camTarget = { x: 0, y: 0, z: 1 };
let focusId = null; // id of the cord we're zoomed into, or null for the overview

// Small screens get a quiet overview (small faint dots, no labels); detail lives in the zoom.
const isCompact = () => Math.min(W, H) < 560;
const showDetail = () => !isCompact() || focusId !== null;

function focusBounds(id) {
  const cord = cords.find(c => c.id === id);
  const targets = state.attachments.filter(a => a.category === id).map(targetOf);
  // fit the attachments and the stretch of cord that reaches them, not the empty tip
  const reach = Math.max(0.55, ...targets.map(([x, y]) => Math.hypot(x, y))) + 0.08;
  const pts = [[0, 0], ...cord.main.filter(([x, y]) => Math.hypot(x, y) <= reach), ...targets];
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  const pad = 0.1;
  return { x0: x0 - pad, y0: y0 - pad, x1: x1 + pad, y1: y1 + pad };
}

function setFocus(id, snap = false) {
  focusId = id;
  if (!id) {
    camTarget = { x: 0, y: 0, z: 1 };
  } else {
    const b = focusBounds(id);
    // visible area: below the header and focus bar, above the legend; extra side room for labels
    const top = 110, bottom = H - 40, side = isCompact() ? 24 : 120;
    const z = Math.min((W - side * 2) / ((b.x1 - b.x0) * R), (bottom - top) / ((b.y1 - b.y0) * R), 3.2);
    const midY = (top + bottom) / 2;
    camTarget = {
      x: (b.x0 + b.x1) / 2,
      y: (b.y0 + b.y1) / 2 - (midY - CY) / (R * z),
      z: Math.max(1, z),
    };
  }
  if (snap) Object.assign(cam, camTarget);
  updateFocusUI();
}

function updateFocusUI() {
  const bar = document.getElementById('focusbar');
  if (!bar) return;
  // the hint and the focus bar share the row under the header
  document.getElementById('hint').hidden = state.attachments.length > 0 || focusId !== null;
  const cat = CATEGORIES.find(c => c.id === focusId);
  bar.hidden = !cat;
  if (cat) {
    const n = state.attachments.filter(a => a.category === cat.id).length;
    document.getElementById('focus-title').innerHTML =
      `<em style="color:${cat.color}">${cat.pali}</em> ${cat.label} · ${n}`;
  }
  const tip = document.querySelector('#legend .tip');
  if (tip) {
    tip.textContent = focusId ? 'drag an attachment to move it'
      : isCompact() ? 'tap a kind to zoom in'
      : 'click a cord to zoom in · drag to move';
  }
}

// Which quadrant (cord) a screen point falls in, measured around the I.
function quadrantAt(px, py) {
  const ang = Math.atan2(py - sy(0), px - sx(0));
  const sector = (Math.PI * 2) / CATEGORIES.length;
  const i = Math.floor((((ang + Math.PI / 2) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / sector);
  return CATEGORIES[i].id;
}

// A faint, static background web — the wider mycelium beyond what we've named.
function paintSoil() {
  soilLayer = document.createElement('canvas');
  soilLayer.width = W * DPR; soilLayer.height = H * DPR;
  const g = soilLayer.getContext('2d');
  g.scale(DPR, DPR);
  const grad = g.createRadialGradient(CX, CY, 0, CX, CY, Math.max(W, H) * 0.7);
  grad.addColorStop(0, '#1b1712');
  grad.addColorStop(1, '#0b0a08');
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);

  const rng = mulberry32(7);
  g.lineCap = 'round';
  for (let i = 0; i < 70; i++) {
    const start = [(rng() - 0.5) * W / R * 1.1, (rng() - 0.5) * H / R * 1.1];
    const pts = wander(rng, start, rng() * Math.PI * 2, 20 + rng() * 40, 0.02, 0.5);
    g.strokeStyle = `rgba(200, 185, 160, ${0.025 + rng() * 0.035})`;
    g.lineWidth = 0.6;
    g.beginPath();
    pts.forEach(([x, y], k) => k ? g.lineTo(CX + x * R, CY + y * R) : g.moveTo(CX + x * R, CY + y * R));
    g.stroke();
  }
}

const sx = x => CX + (x - cam.x) * R * cam.z;
const sy = y => CY + (y - cam.y) * R * cam.z;

function strokePartial(pts, frac, w0, w1, color) {
  const n = pts.length - 1;
  const upto = frac * n;
  ctx.strokeStyle = color;
  for (let i = 0; i < n && i < upto; i++) {
    const t = Math.min(1, upto - i);
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    ctx.lineWidth = w0 + (w1 - w0) * (i / n);
    ctx.beginPath();
    ctx.moveTo(sx(ax), sy(ay));
    ctx.lineTo(sx(ax + (bx - ax) * t), sy(ay + (by - ay) * t));
    ctx.stroke();
  }
}

function pointAt(pts, f) {
  const p = f * (pts.length - 1);
  const i = Math.min(pts.length - 2, Math.floor(p)), t = p - i;
  return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t];
}

function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

let hitNodes = [];
let cordLabelRects = [];
let centerR = 30;

function frame(now) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.drawImage(soilLayer, 0, 0, W, H);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // ease the camera toward its target
  for (const k of ['x', 'y', 'z']) cam[k] += (camTarget[k] - cam[k]) * 0.14;
  const lw = Math.sqrt(cam.z); // lines thicken a little when zoomed in
  const compactOverview = !showDetail();
  const dimFor = id => (focusId && focusId !== id ? 0.1 : 1);

  hitNodes = [];
  cordLabelRects = [];
  const secs = now / 1000;

  // main cords: thicker the more attachments (still held) feed them
  const cordGrow = Math.min(1, (now - cordsBorn) / CORD_MS);
  const cordEase = 1 - Math.pow(1 - cordGrow, 2);
  for (const cord of cords) {
    const cat = CATEGORIES.find(c => c.id === cord.id);
    const held = state.attachments.filter(a => a.category === cord.id && !a.released);
    const weight = held.reduce((s, a) => s + a.strength, 0);
    const w = (1.6 + Math.min(7, weight * 0.35)) * lw;
    const alpha = (held.length ? 0.55 : 0.22) * dimFor(cord.id);
    for (const b of cord.branches) {
      const bf = Math.max(0, Math.min(1, (cordEase - b.at) / 0.25));
      if (bf > 0) strokePartial(b.pts, bf, 0.8 / b.depth, 0.25, rgba(cat.color, alpha * 0.4));
    }
    strokePartial(cord.main, cordEase, w, Math.max(0.8, w * 0.25), rgba(cat.color, alpha));

    // label at the cord's tip (overview only; the focus bar names the cord when zoomed)
    const labelFade = Math.max(0, 1 - (cam.z - 1) * 2);
    if (cordGrow > 0.6 && labelFade > 0) {
      const fade = ((cordGrow - 0.6) / 0.4) * labelFade;
      const tip = cord.main[cord.main.length - 1];
      const right = Math.cos(cord.angle) > 0;
      const down = Math.sin(cord.angle) > 0;
      const small = isCompact();
      const paliPx = small ? 13 : 15, subPx = small ? 11 : 12;
      const count = state.attachments.filter(a => a.category === cord.id).length;
      const sub = small && count ? `${cat.label} · ${count}` : cat.label;
      const y = sy(tip[1]) + Math.sin(cord.angle) * 10;
      ctx.font = `${subPx}px "Iowan Old Style", Palatino, Georgia, serif`;
      const textW = Math.max(ctx.measureText(sub).width, cat.pali.length * paliPx * 0.53);
      // keep the label on screen on narrow windows
      let x = sx(tip[0]) + Math.cos(cord.angle) * 10;
      x = right ? Math.min(x, W - 12 - textW) : Math.max(x, 12 + textW);
      ctx.textAlign = right ? 'left' : 'right';
      ctx.textBaseline = down ? 'top' : 'bottom';
      const dy = down ? 0 : -(subPx + 4);
      ctx.font = `italic ${paliPx}px "Iowan Old Style", Palatino, Georgia, serif`;
      ctx.fillStyle = rgba(cat.color, 0.85 * fade);
      ctx.fillText(cat.pali, x, y + dy);
      ctx.font = `${subPx}px "Iowan Old Style", Palatino, Georgia, serif`;
      ctx.fillStyle = `rgba(154,144,127,${fade})`;
      ctx.fillText(sub, x, y + dy + paliPx + 2);
      // clickable area for zooming into this cord
      const top = down ? y + dy : y + dy - paliPx;
      cordLabelRects.push({ id: cord.id, x0: right ? x : x - textW, x1: right ? x + textW : x, y0: top - 4, y1: top + paliPx + subPx + 10 });
    }
  }

  for (const a of state.attachments) {
    const cat = CATEGORIES.find(c => c.id === a.category) || CATEGORIES[0];
    const h = hyphaFor(a, now);
    const grow = Math.min(1, (now - h.born) / GROW_MS);
    const ease = 1 - Math.pow(1 - grow, 3);
    const focus = a.id === selectedId || a.id === hoverId;
    const inView = dimFor(a.category) === 1;
    const dim = dimFor(a.category) * (compactOverview ? 0.7 : 1);
    const alpha = (a.released ? 0.18 : focus ? 0.95 : 0.6) * dim;
    const color = a.released ? `rgba(160,150,135,${alpha})` : rgba(cat.color, alpha);
    const thick = (0.6 + a.strength * 0.7) * (compactOverview ? 0.6 : lw);

    // side branches
    for (const b of h.branches) {
      const bf = Math.max(0, Math.min(1, (ease - b.at) / 0.25));
      if (bf > 0) strokePartial(b.pts, bf, thick * 0.35 / b.depth, 0.3, a.released ? `rgba(160,150,135,0.1)` : rgba(cat.color, alpha * 0.45));
    }
    // main hypha: thick near the self, tapering toward the attachment
    if (a.released) ctx.setLineDash([2, 5]);
    strokePartial(h.main, ease, thick, thick * 0.4, color);
    ctx.setLineDash([]);

    // nutrient pulses: more often noticed → more flow
    if (!a.released && grow >= 1) {
      const n = 1 + Math.min(5, Math.floor((a.observations?.length || 0) / 2));
      const seed = (hashStr(a.id) % 1000) / 1000;
      for (let k = 0; k < n; k++) {
        const f = (secs / 5 + seed + k / n) % 1;
        const [px, py] = pointAt(h.main, f);
        ctx.fillStyle = rgba(cat.color, 0.85 * Math.sin(f * Math.PI));
        ctx.beginPath();
        ctx.arc(sx(px), sy(py), 1.6 + a.strength * 0.25, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // fruiting body (the attachment itself)
    if (grow > 0.85) {
      const appear = (grow - 0.85) / 0.15;
      const [tx, ty] = h.target;
      const x = sx(tx), y = sy(ty);
      // small, quiet dots in the phone overview; full size when zoomed in or on a large screen
      const r = (5 + a.strength * 1.6) * appear * (compactOverview ? 0.45 : focusId ? 1.1 : 1);
      ctx.globalAlpha = dim;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
      glow.addColorStop(0, a.released ? 'rgba(160,150,135,0.15)' : rgba(cat.color, focus ? 0.45 : 0.25));
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(x, y, r * 3, 0, Math.PI * 2); ctx.fill();

      // craving: a full fruiting body; aversion: a hollow ring (pushing away)
      const hollow = a.released || a.tone === 'aversion';
      ctx.fillStyle = hollow ? 'rgba(20,18,15,1)' : rgba(cat.color, 0.95);
      ctx.strokeStyle = a.released ? 'rgba(160,150,135,0.5)' : rgba(cat.color, 1);
      ctx.lineWidth = a.tone === 'aversion' && !a.released ? 2.4 : 1.2;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.globalAlpha = 1;

      // only attachments in view and shown in detail get labels and can be clicked
      if (!inView || compactOverview) continue;

      // label, pushed outward from the centre
      const ang = Math.atan2(ty, tx);
      let lx = x + Math.cos(ang) * (r + 8);
      const ly = y + Math.sin(ang) * (r + 8);
      ctx.font = `${focus ? 15 : 13}px "Iowan Old Style", Palatino, Georgia, serif`;
      let align = Math.abs(Math.cos(ang)) < 0.3 ? 'center' : Math.cos(ang) > 0 ? 'left' : 'right';
      // flip to the other side of the dot if the label would run off screen
      const tw = ctx.measureText(a.name).width;
      if (align === 'left' && lx + tw > W - 8) { align = 'right'; lx = x - r - 8; }
      else if (align === 'right' && lx - tw < 8) { align = 'left'; lx = x + r + 8; }
      else if (align === 'center') lx = Math.max(8 + tw / 2, Math.min(W - 8 - tw / 2, lx));
      ctx.textAlign = align;
      ctx.textBaseline = Math.sin(ang) > 0.5 ? 'top' : Math.sin(ang) < -0.5 ? 'bottom' : 'middle';
      // dark outline keeps labels legible where hyphae or other labels cross
      ctx.lineWidth = 4;
      ctx.strokeStyle = `rgba(15,13,11,${0.85 * appear})`;
      ctx.strokeText(a.name, lx, ly);
      ctx.fillStyle = `rgba(233,226,214,${(a.released ? 0.4 : focus ? 1 : 0.8) * appear})`;
      ctx.fillText(a.name, lx, ly);

      hitNodes.push({ id: a.id, x, y, r: Math.max(r, 10) });
    }
  }

  // the self, breathing slowly at the centre
  const breath = 0.5 + 0.5 * Math.sin((secs / BREATH_S) * Math.PI * 2);
  centerR = Math.max(22, R * 0.07) * (1 + 0.07 * breath);
  const ix = sx(0), iy = sy(0);
  const halo = ctx.createRadialGradient(ix, iy, 0, ix, iy, centerR * 3.2);
  halo.addColorStop(0, `rgba(240, 225, 190, ${0.22 + 0.1 * breath})`);
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(ix, iy, centerR * 3.2, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#1e1a14';
  ctx.strokeStyle = 'rgba(232, 217, 176, 0.8)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(ix, iy, centerR, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  ctx.fillStyle = '#e8d9b0';
  ctx.font = `${Math.round(centerR * 1.1)}px "Iowan Old Style", Palatino, Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('I', ix, iy + 1);

  requestAnimationFrame(frame);
}

// ---------- interaction ----------

function hitTest(x, y) {
  let best = null, bd = Infinity;
  for (const n of hitNodes) {
    const d = Math.hypot(n.x - x, n.y - y);
    if (d < n.r + 8 && d < bd) { best = n; bd = d; }
  }
  if (best) return { type: 'node', id: best.id };
  if (Math.hypot(sx(0) - x, sy(0) - y) < centerR + 4) return { type: 'self' };
  if (!focusId) {
    // On a phone, a tap anywhere in a quadrant zooms into that kind of attachment.
    if (isCompact()) return { type: 'cord', id: quadrantAt(x, y) };
    // On a larger screen, click a cord or its label.
    for (const r of cordLabelRects) {
      if (x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1) return { type: 'cord', id: r.id };
    }
    for (const cord of cords) {
      for (let i = 2; i < cord.main.length; i++) {
        const [px, py] = cord.main[i];
        if (Math.hypot(sx(px) - x, sy(py) - y) < 12) return { type: 'cord', id: cord.id };
      }
    }
  }
  return null;
}

// Press on an attachment and move to drag it; a press without moving is a click.
let drag = null;
const DRAG_THRESHOLD = 4;

// Screen point → field units, kept clear of the I and inside the visible window.
function toUnits(px, py) {
  const s = R * cam.z;
  px = Math.max(24, Math.min(W - 24, px));
  py = Math.max(focusId ? 110 : 70, Math.min(H - 24, py));
  let x = cam.x + (px - CX) / s, y = cam.y + (py - CY) / s;
  const minR = (centerR + 16) / s, d = Math.hypot(x, y);
  if (d < minR) {
    const k = minR / (d || 1);
    x = d ? x * k : minR; y *= k;
  }
  return roundPos([x, y]);
}

canvas.addEventListener('pointerdown', e => {
  const hit = hitTest(e.clientX, e.clientY);
  if (hit?.type === 'node') {
    const node = hitNodes.find(n => n.id === hit.id);
    drag = { id: hit.id, x0: e.clientX, y0: e.clientY, dx: node.x - e.clientX, dy: node.y - e.clientY, moved: false };
    canvas.setPointerCapture(e.pointerId);
  }
});

canvas.addEventListener('pointermove', e => {
  if (drag) {
    if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < DRAG_THRESHOLD) return;
    drag.moved = true;
    const a = state.attachments.find(x => x.id === drag.id);
    if (a) a.pos = toUnits(e.clientX + drag.dx, e.clientY + drag.dy);
    hoverId = drag.id;
    canvas.style.cursor = 'grabbing';
    return;
  }
  if (e.pointerType !== 'mouse') return; // hover only matters for a mouse
  const hit = hitTest(e.clientX, e.clientY);
  hoverId = hit?.type === 'node' ? hit.id : null;
  canvas.style.cursor = hit?.type === 'node' ? 'grab' : hit ? 'pointer' : 'default';
});

canvas.addEventListener('pointerup', e => {
  if (drag) {
    const { id, moved } = drag;
    drag = null;
    canvas.style.cursor = 'grab';
    if (moved) { save(); if (focusId) setFocus(focusId); return; }
    return openEdit(id);
  }
  const hit = hitTest(e.clientX, e.clientY);
  if (hit?.type === 'self') openNew(focusId);
  else if (hit?.type === 'cord') { closePanel(); setFocus(hit.id); }
  else if (!panel.hidden) closePanel();
  else if (focusId) setFocus(null); // tap empty space to zoom back out
});

canvas.addEventListener('pointercancel', () => {
  if (drag?.moved) save();
  drag = null;
});

// ---------- panel ----------

const $ = id => document.getElementById(id);
const panel = $('panel');

$('f-category').innerHTML = CATEGORIES.map(c => `<option value="${c.id}">${c.label} · ${c.pali}</option>`).join('');
// The cords carry their own labels, so the legend only explains the node shapes.
$('legend').innerHTML =
  `<span class="key" style="--c:var(--muted)">craving</span><span class="key ring">aversion</span><span class="tip">drag an attachment to move it</span>`;

// Fill the "Form" list for the chosen upādāna, keeping a custom value if one was saved.
function showCategory(form = '') {
  const cat = CATEGORIES.find(c => c.id === $('f-category').value) || CATEGORIES[0];
  $('f-desc').textContent = cat.desc;
  const opts = ['', ...cat.forms];
  if (form && !opts.includes(form)) opts.push(form);
  $('f-form').innerHTML = opts
    .map(f => `<option value="${f.replace(/"/g, '&quot;')}">${f || '(not specified)'}</option>`)
    .join('');
  $('f-form').value = form;
}
$('f-category').addEventListener('change', () => showCategory());

const toneValue = () => document.querySelector('input[name=tone]:checked')?.value || 'craving';
const setTone = t => { document.querySelector(`input[name=tone][value=${t === 'aversion' ? 'aversion' : 'craving'}]`).checked = true; };

const showStrength = () => { $('f-strength-out').textContent = `— ${STRENGTH_WORDS[$('f-strength').value]}`; };
$('f-strength').addEventListener('input', showStrength);

// Start naming a new attachment, optionally preset to a kind (the cord we're zoomed into).
function openNew(category = null) {
  selectedId = null;
  $('panel-title').textContent = 'Name an attachment';
  $('f-save').textContent = 'Observe it';
  $('form').reset();
  $('f-strength').value = 3;
  if (category) $('f-category').value = category;
  showStrength();
  showCategory();
  setTone('craving');
  $('observe').hidden = true;
  panel.hidden = false;
  $('f-name').focus();
}

function openEdit(id) {
  const a = state.attachments.find(x => x.id === id);
  if (!a) return;
  selectedId = id;
  $('panel-title').textContent = a.name;
  $('f-save').textContent = 'Save changes';
  $('f-name').value = a.name;
  $('f-category').value = a.category;
  $('f-strength').value = a.strength;
  $('f-notes').value = a.notes || '';
  showStrength();
  showCategory(a.form || '');
  setTone(a.tone);
  renderObservations(a);
  $('observe').hidden = false;
  panel.hidden = false;
}

function closePanel() {
  panel.hidden = true;
  selectedId = null;
}

function renderObservations(a) {
  const obs = a.observations || [];
  $('obs-count').textContent = obs.length
    ? `Noticed ${obs.length} time${obs.length === 1 ? '' : 's'}.`
    : 'Each time you notice this arising in practice, record it here.';
  const list = $('obs-list');
  list.innerHTML = '';
  for (const o of [...obs].reverse()) {
    const li = document.createElement('li');
    const t = document.createElement('time');
    t.textContent = new Date(o.t).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    li.append(t, document.createTextNode(o.note || ''));
    list.append(li);
  }
  $('btn-release').textContent = a.released ? 'Hold again' : 'Loosened';
  $('btn-release').title = a.released
    ? 'Mark this as actively held again'
    : 'Mark that the grip on this has loosened';
}

$('form').addEventListener('submit', e => {
  e.preventDefault();
  const fields = {
    name: $('f-name').value.trim(),
    category: $('f-category').value,
    form: $('f-form').value,
    tone: toneValue(),
    strength: Number($('f-strength').value),
    notes: $('f-notes').value.trim(),
  };
  if (!fields.name) return;
  if (selectedId) {
    const a = state.attachments.find(x => x.id === selectedId);
    if (a.category !== fields.category) {
      // A new kind of attachment moves it to that cord's quadrant.
      a.slot = offCord(pickSlot(fields.category), a.id);
      a.pos = undefined;
    } else if (a.strength !== fields.strength && validPos(a.pos)) {
      // Tighter or looser: slide it toward or away from the I, keeping its direction.
      const k = radiusFor(fields.strength) / radiusFor(a.strength);
      a.pos = roundPos([a.pos[0] * k, a.pos[1] * k]);
    }
    Object.assign(a, fields);
    if (!validPos(a.pos)) a.pos = roundPos(targetOf(a));
    openEdit(a.id);
  } else {
    const id = uid();
    const a = { id, ...fields, slot: offCord(pickSlot(fields.category), id), created: Date.now(), observations: [], released: false };
    a.pos = roundPos(targetOf(a));
    a.fresh = true;
    state.attachments.push(a);
    closePanel();
  }
  save();
  updateHint();
});

$('obs-add').addEventListener('click', () => {
  const a = state.attachments.find(x => x.id === selectedId);
  if (!a) return;
  a.observations = a.observations || [];
  a.observations.push({ t: Date.now(), note: $('obs-note').value.trim() });
  $('obs-note').value = '';
  save();
  renderObservations(a);
});
$('obs-note').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('obs-add').click(); } });

$('btn-release').addEventListener('click', () => {
  const a = state.attachments.find(x => x.id === selectedId);
  if (!a) return;
  a.released = !a.released;
  a.releasedAt = a.released ? Date.now() : undefined;
  save();
  renderObservations(a);
});

$('btn-delete').addEventListener('click', () => {
  const a = state.attachments.find(x => x.id === selectedId);
  if (!a || !confirm(`Remove “${a.name}” and all its observations?`)) return;
  state.attachments = state.attachments.filter(x => x.id !== a.id);
  hyphae.delete(a.id);
  save();
  closePanel();
  updateHint();
});

$('panel-close').addEventListener('click', closePanel);
$('btn-add').addEventListener('click', () => openNew(focusId));
$('btn-back').addEventListener('click', () => { closePanel(); setFocus(null); });
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!panel.hidden) closePanel();
  else if (focusId) setFocus(null);
});

// ---------- export / import ----------

$('btn-export').addEventListener('click', () => {
  const blob = new Blob([serialize(2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `i-celium-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
});

$('file-import').addEventListener('change', async e => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data.attachments)) throw new Error('No attachments found in that file.');
    if (state.attachments.length && !confirm('Replace your current map with the imported one?')) return;
    state = migrate(data);
    hyphae.clear();
    state.attachments.forEach(a => { a.fresh = true; });
    save();
    closePanel();
    updateHint();
  } catch (err) {
    alert(`Could not import: ${err.message}`);
  }
});

// ---------- start ----------

function updateHint() {
  $('hint').hidden = state.attachments.length > 0;
  // attachments changed: refit the zoomed view and refresh the count
  if (focusId) setFocus(focusId); else updateFocusUI();
}

state.attachments.forEach(a => { a.fresh = true; }); // grow everything in on open
window.addEventListener('resize', resize);
resize();
updateHint();
save(); // persist anything migrate() filled in (e.g. stored coordinates)
cordsBorn = performance.now();
requestAnimationFrame(frame);
