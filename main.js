/* ============================================================
   Knowledge Fight Memorial Wall — main.js
   ============================================================ */

/* ─────────────────────────────────────────────────────────────
   SUPABASE CONFIG  ← paste your two values here
   See CLAUDE.md for the 5-step setup walkthrough.
   Until both are filled in, the site falls back to local-only
   mode (notes only visible to whoever wrote them).
   ───────────────────────────────────────────────────────────── */
const SUPABASE_URL      = 'https://vzppbqbszvuvsbnlmesh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_UlG2pYD0w6pjPj98IKlBvQ_JBSQBz4k';

/* ============================================================ */

const REMOTE_ENABLED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
const LS_LOCAL_NOTES = 'kf_memorial_local_notes_v1';
const LS_MINE        = 'kf_memorial_mine_v1';
const LS_PENDING     = 'kf_memorial_pending_v1';
const LS_COOLDOWN    = 'kf_memorial_cooldown_v1';

/* ─── Seed notes (always shown, mixed hinged + unhinged) ───── */
const SEED_NOTES = [
  {
    id: 'seed-01', tone: 'hinged',
    name: 'Marie', where: 'Portland',
    body: "I started listening in 2018 during chemo. Dan and Jordan got me through it. I don't know how to thank two strangers for being there in the dark, but: thank you.",
    createdAt: '2026-05-06T07:14:00Z'
  },
  {
    id: 'seed-02', tone: 'unhinged',
    name: 'Andy', where: 'Kansas',
    body: "ANDY IN KANSAS, YOU'RE ON THE AIR. Thanks for taking my call. I'm a longtime listener. The frogs were always gay. The end.",
    createdAt: '2026-05-06T08:01:00Z'
  },
  {
    id: 'seed-03', tone: 'hinged',
    name: 'a quiet one', where: '',
    body: "Nine years of company on long drives. I'll keep all of it. Thanks Dan. Thanks Jordan. Pet Celine for me.",
    createdAt: '2026-05-06T09:22:00Z'
  },
  {
    id: 'seed-04', tone: 'unhinged',
    name: 'Final Brain Truther', where: 'a parking lot',
    body: "I took the FINAL BRAIN. The FINAL BRAIN took me. We are one now. The supplement is alive. I AM THE SUPPLEMENT.",
    createdAt: '2026-05-06T10:48:00Z'
  },
  {
    id: 'seed-05', tone: 'hinged',
    name: 'Devin', where: 'Chicago',
    body: "I learned how to actually listen because of this show. I learned how to check a source. I learned what a receipt looks like. I'll miss the bit. I'll miss the rigor more.",
    createdAt: '2026-05-06T11:30:00Z'
  },
  {
    id: 'seed-06', tone: 'unhinged',
    name: 'Knife Enjoyer', where: '',
    body: "I have purchased every InfoWars knife. I have eight knives. They are all dull. They were dull when they arrived. I love each of them.",
    createdAt: '2026-05-06T12:12:00Z'
  },
  {
    id: 'seed-07', tone: 'hinged',
    name: 'Leah', where: 'Glasgow',
    body: "Found you in lockdown. You were the first thing that made me laugh in months. I kept listening even after the world re-opened, because you were friends now.",
    createdAt: '2026-05-06T12:55:00Z'
  },
  {
    id: 'seed-08', tone: 'unhinged',
    name: '', where: 'the ghost mall',
    body: "the impasse. the impasse. they reached the impasse. what is the shape of an impasse. is it like a cul-de-sac but louder. somebody bring me a folding chair.",
    createdAt: '2026-05-06T13:40:00Z'
  },
  {
    id: 'seed-09', tone: 'hinged',
    name: 'Sam', where: 'Toronto',
    body: "Thank you for never making it cool. Thank you for the work. Thank you for being honest about the cost of doing the work. Take care of yourselves.",
    createdAt: '2026-05-06T14:15:00Z'
  },
  {
    id: 'seed-10', tone: 'unhinged',
    name: 'Jorge from Lubbock', where: 'allegedly',
    body: "Bigfoot is real and I will fight you. Also the show was perfect. Also my wife left me. Also gay frogs. Goodbye my friends.",
    createdAt: '2026-05-06T15:02:00Z'
  },
  {
    id: 'seed-11', tone: 'hinged',
    name: 'Renee', where: 'a hospital cafeteria',
    body: "I would put episodes on while I worked night shifts. The waiting rooms were bearable because of you. I hope you both rest. You earned it a hundred times over.",
    createdAt: '2026-05-06T15:45:00Z'
  },
  {
    id: 'seed-12', tone: 'unhinged',
    name: 'Time Cube Adjacent', where: '',
    body: "PROOF the show ended because the GLOBALISTS reached an impasse with the PODCASTERS at the SUMMIT inside MY HOUSE. I have receipts. The receipts are gay frogs.",
    createdAt: '2026-05-06T16:20:00Z'
  }
];

/* ─── Trivia captcha ──────────────────────────────────────── */
const TRIVIA = [
  { q: "What's Dan's cat's name?",                      a: ['celine'] },
  { q: "Andy is on the air from ___",                   a: ['kansas'] },
  { q: "Alex's favorite ___ are gay",                   a: ['frogs', 'frog'] },
  { q: "Who's the bearded co-host?",                    a: ['jordan', 'jordann'] },
  { q: "Who's the co-host with the glasses?",           a: ['dan', 'dan friesen', 'friesen'] },
  { q: "Two words: name of the show",                   a: ['knowledge fight', 'knowledgefight'] },
  { q: "InfoWars sells (one word, the supplement-y one)", a: ['supplements', 'supplement', 'brainforce', 'brain force'] }
];

/* ============================================================
   Storage helpers
   ============================================================ */
function lsGet(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

const mineSet = new Set(lsGet(LS_MINE, []));
function markMine(id) {
  mineSet.add(id);
  lsSet(LS_MINE, [...mineSet]);
}
function unmarkMine(id) {
  mineSet.delete(id);
  lsSet(LS_MINE, [...mineSet]);
}

/* ============================================================
   Supabase REST client (no SDK)
   ============================================================ */
async function remoteFetchNotes() {
  if (!REMOTE_ENABLED) return null;
  const url = `${SUPABASE_URL}/rest/v1/notes?select=*&order=created_at.desc&limit=500`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Supabase read ${res.status}`);
  const rows = await res.json();
  return rows.map(r => ({
    id: r.id,
    name: r.name || '',
    where: r.where_ || '',
    body: r.body,
    tone: r.tone,
    createdAt: r.created_at,
  }));
}

async function remoteInsertNote(note) {
  if (!REMOTE_ENABLED) throw new Error('remote disabled');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/notes`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      name: note.name || null,
      where_: note.where || null,
      body: note.body,
      tone: note.tone,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase insert ${res.status}: ${text}`);
  }
  const [row] = await res.json();
  return {
    id: row.id,
    name: row.name || '',
    where: row.where_ || '',
    body: row.body,
    tone: row.tone,
    createdAt: row.created_at,
  };
}

/* ============================================================
   Note model
   ============================================================ */
let allNotes = []; // current view = remote (or local fallback) + local-pending + local-only + seeds

function combineNotes(remote, localOnly, pending) {
  // remote and localOnly come pre-sorted descending; merge by createdAt desc
  const merged = [...pending, ...localOnly, ...remote, ...SEED_NOTES];
  // dedupe by id
  const seen = new Set();
  const out = [];
  for (const n of merged) {
    if (seen.has(n.id)) continue;
    seen.add(n.id);
    out.push(n);
  }
  out.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return out;
}

async function loadNotes() {
  const localOnly = lsGet(LS_LOCAL_NOTES, []);
  const pending = lsGet(LS_PENDING, []);
  let remote = [];
  if (REMOTE_ENABLED) {
    try {
      remote = await remoteFetchNotes() || [];
      // attempt to flush pending in the background
      flushPending();
    } catch (err) {
      console.warn('[KF] Could not reach Supabase, using local fallback only:', err.message);
    }
  }
  allNotes = combineNotes(remote, localOnly, pending);
  render();
}

async function flushPending() {
  if (!REMOTE_ENABLED) return;
  const pending = lsGet(LS_PENDING, []);
  if (!pending.length) return;
  const stillPending = [];
  for (const note of pending) {
    try {
      const remote = await remoteInsertNote(note);
      // pending → published. Remap "mine" entry from local id → remote id.
      if (mineSet.has(note.id)) {
        unmarkMine(note.id);
        markMine(remote.id);
      }
    } catch {
      stillPending.push(note);
    }
  }
  lsSet(LS_PENDING, stillPending);
}

/* ============================================================
   Rendering
   ============================================================ */
const wallGrid    = document.getElementById('wall-grid');
const wallEmpty   = document.getElementById('wall-empty');
const wallCount   = document.getElementById('wall-count');
const filterBtns  = document.querySelectorAll('.filter-btn');

let currentFilter = 'all';

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.toggle('is-active', b === btn));
    currentFilter = btn.dataset.filter;
    render();
  });
});

function filterNotes(notes) {
  switch (currentFilter) {
    case 'hinged':   return notes.filter(n => n.tone === 'hinged');
    case 'unhinged': return notes.filter(n => n.tone === 'unhinged');
    case 'mine':     return notes.filter(n => mineSet.has(n.id));
    default:         return notes;
  }
}

// Deterministic pseudo-random from string (for tilt/color variant)
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function render() {
  const notes = filterNotes(allNotes);
  wallCount.textContent = `${notes.length} ${notes.length === 1 ? 'note' : 'notes'}`;
  wallGrid.innerHTML = '';

  if (!notes.length) {
    wallEmpty.hidden = false;
    return;
  }
  wallEmpty.hidden = true;

  const frag = document.createDocumentFragment();
  for (const note of notes) {
    frag.appendChild(buildNoteEl(note));
  }
  wallGrid.appendChild(frag);
}

function buildNoteEl(note) {
  const h = hashStr(note.id);
  const tilt = ((h % 90) / 10 - 4.5).toFixed(2); // -4.5 to +4.4
  const variant = (h >> 7) % 3;

  const bgVar = note.tone === 'unhinged'
    ? `--c-unhinged-${variant + 1}`
    : `--c-hinged-${variant + 1}`;

  const el = document.createElement('article');
  el.className = `note ${note.tone === 'unhinged' ? 'is-unhinged' : ''}`;
  el.style.setProperty('--tilt', `${tilt}deg`);
  el.style.setProperty('--bg', `var(${bgVar})`);
  el.dataset.id = note.id;
  el.tabIndex = 0;

  const tone = document.createElement('span');
  tone.className = 'note-tone';
  tone.textContent = note.tone;
  el.appendChild(tone);

  const body = document.createElement('p');
  body.className = 'note-body';
  body.textContent = note.body;
  el.appendChild(body);

  const meta = document.createElement('div');
  meta.className = 'note-meta';
  const who = document.createElement('strong');
  who.textContent = note.name || 'Anonymous';
  meta.appendChild(who);

  if (note.where) {
    const where = document.createElement('span');
    where.textContent = note.where;
    meta.appendChild(where);
  }

  const date = document.createElement('time');
  date.dateTime = note.createdAt || '';
  date.textContent = formatDate(note.createdAt);
  meta.appendChild(date);

  el.appendChild(meta);

  el.addEventListener('click', () => openModal(note));
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(note); }
  });

  return el;
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ============================================================
   Modal
   ============================================================ */
const modal       = document.getElementById('modal');
const modalCard   = modal.querySelector('.modal-card');
const modalBody   = document.getElementById('modal-body');
const modalName   = document.getElementById('modal-name');
const modalWhere  = document.getElementById('modal-where');
const modalDate   = document.getElementById('modal-date');
const modalTone   = document.getElementById('modal-tone');

function openModal(note) {
  modalCard.classList.toggle('is-unhinged', note.tone === 'unhinged');
  modalBody.textContent = note.body;
  modalName.textContent = note.name || 'Anonymous';
  modalWhere.textContent = note.where ? `· ${note.where}` : '';
  modalDate.textContent = note.createdAt ? `· ${formatDate(note.createdAt)}` : '';
  modalTone.textContent = note.tone;
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  modal.hidden = true;
  document.body.style.overflow = '';
}
modal.addEventListener('click', (e) => {
  if (e.target.matches('[data-close]')) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modal.hidden) closeModal();
});

/* ============================================================
   Form / submission
   ============================================================ */
const form        = document.getElementById('note-form');
const fName       = document.getElementById('note-name');
const fWhere      = document.getElementById('note-where');
const fBody       = document.getElementById('note-body');
const fCharCount  = document.getElementById('char-count');
const fCaptchaQ   = document.getElementById('captcha-q');
const fCaptchaA   = document.getElementById('captcha-a');
const fHoneypot   = document.getElementById('hp-field');
const fNote       = document.getElementById('form-note');
const submitBtn   = document.getElementById('submit-btn');
const clearMineBtn = document.getElementById('clear-mine');

let activeTrivia = pickTrivia();
function pickTrivia() {
  const t = TRIVIA[Math.floor(Math.random() * TRIVIA.length)];
  fCaptchaQ.textContent = `(${t.q})`;
  fCaptchaA.value = '';
  return t;
}

function updateCharCount() {
  fCharCount.textContent = `${fBody.value.length} / 800`;
}
fBody.addEventListener('input', updateCharCount);
updateCharCount();

function setNote(msg, kind) {
  fNote.textContent = msg;
  fNote.classList.remove('is-error', 'is-success');
  if (kind) fNote.classList.add(`is-${kind}`);
}

function inCooldown() {
  const until = lsGet(LS_COOLDOWN, 0);
  return until > Date.now() ? until : 0;
}
function setCooldown(ms) {
  lsSet(LS_COOLDOWN, Date.now() + ms);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  setNote('', null);

  // Honeypot
  if (fHoneypot.value.trim() !== '') {
    setNote("Bot detected. Try again later.", 'error');
    return;
  }

  // Cooldown
  const cd = inCooldown();
  if (cd) {
    const secs = Math.ceil((cd - Date.now()) / 1000);
    setNote(`Slow down — try again in ${secs}s.`, 'error');
    return;
  }

  const body = fBody.value.trim();
  if (!body) {
    setNote("Write something first. Even just 'thanks' is enough.", 'error');
    fBody.focus();
    return;
  }
  if (body.length > 800) {
    setNote("Note is over the 800-character limit.", 'error');
    return;
  }

  // Trivia check
  const ans = fCaptchaA.value.trim().toLowerCase();
  if (!activeTrivia.a.includes(ans)) {
    const wrong = (lsGet('kf_trivia_wrong', 0) || 0) + 1;
    lsSet('kf_trivia_wrong', wrong);
    if (wrong >= 3) {
      setCooldown(60_000);
      lsSet('kf_trivia_wrong', 0);
      setNote("Too many wrong answers. 60 seconds in the corner.", 'error');
    } else {
      setNote(`Not quite. Hint: it's a Knowledge Fight thing. (${3 - wrong} tries left)`, 'error');
    }
    activeTrivia = pickTrivia();
    fCaptchaA.focus();
    return;
  }
  lsSet('kf_trivia_wrong', 0);

  const tone = (form.querySelector('input[name="tone"]:checked') || {}).value || 'hinged';
  const draft = {
    id: cryptoRandomId(),
    name: fName.value.trim().slice(0, 40),
    where: fWhere.value.trim().slice(0, 40),
    body,
    tone,
    createdAt: new Date().toISOString(),
  };

  submitBtn.disabled = true;
  setNote("Pinning…", null);

  let saved = draft;
  let mode = 'local';
  if (REMOTE_ENABLED) {
    try {
      saved = await remoteInsertNote(draft);
      mode = 'remote';
    } catch (err) {
      console.warn('[KF] Remote insert failed, queuing locally:', err.message);
      const pending = lsGet(LS_PENDING, []);
      pending.unshift(draft);
      lsSet(LS_PENDING, pending);
      mode = 'pending';
    }
  } else {
    const local = lsGet(LS_LOCAL_NOTES, []);
    local.unshift(draft);
    lsSet(LS_LOCAL_NOTES, local);
    mode = 'local-only';
  }

  markMine(saved.id);

  // Update in-memory list and re-render
  allNotes.unshift(saved);
  render();

  submitBtn.disabled = false;
  form.reset();
  updateCharCount();
  activeTrivia = pickTrivia();

  const messages = {
    'remote':      "Pinned to the wall. Thanks for sharing.",
    'pending':     "Saved locally — we'll sync it when the wall comes back online.",
    'local-only':  "Pinned to your local wall (Supabase isn't configured yet).",
  };
  setNote(messages[mode] || "Pinned.", 'success');

  // scroll to wall so user sees their note
  setTimeout(() => {
    document.getElementById('wall').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 250);
});

clearMineBtn.addEventListener('click', () => {
  if (!mineSet.size) {
    setNote("Nothing of yours to clear from this browser.", null);
    return;
  }
  if (!confirm("Remove your local notes from this browser? Notes already published to the shared wall stay there — use the moderation steps in CLAUDE.md to delete those.")) return;

  // Remove local-only notes and pending notes belonging to me
  const localOnly = lsGet(LS_LOCAL_NOTES, []).filter(n => !mineSet.has(n.id));
  lsSet(LS_LOCAL_NOTES, localOnly);
  const pending = lsGet(LS_PENDING, []).filter(n => !mineSet.has(n.id));
  lsSet(LS_PENDING, pending);
  mineSet.clear();
  lsSet(LS_MINE, []);

  loadNotes();
  setNote("Cleared from this browser.", 'success');
});

function cryptoRandomId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/* ============================================================
   Drifting cartoons
   ============================================================ */
(function flyerEngine() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const stage = document.getElementById('flying-stage');
  const symbols = ['kf-dan', 'kf-jordan', 'kf-celine', 'kf-knife', 'kf-supplement', 'kf-frog', 'kf-coin', 'kf-mic', 'kf-hat'];
  const COUNT = window.innerWidth < 720 ? 10 : 18;

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function spawn() {
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const size = Math.round(rand(50, 120));
    const yPct = rand(2, 92);
    const dy = rand(-80, 80);
    const r0 = Math.round(rand(-30, 30));
    const r1 = r0 + (Math.random() < 0.5 ? -1 : 1) * Math.round(rand(180, 540));
    const dur = rand(16, 34);
    const dir = Math.random() < 0.5 ? 'r' : 'l';

    const wrap = document.createElement('div');
    wrap.className = 'flyer';
    wrap.style.width = `${size}px`;
    wrap.style.height = `${size}px`;
    wrap.style.setProperty('--y', `${yPct}vh`);
    wrap.style.setProperty('--dy', `${dy}px`);
    wrap.style.setProperty('--r0', `${r0}deg`);
    wrap.style.setProperty('--r1', `${r1}deg`);
    wrap.style.opacity = String(rand(0.5, 0.95));
    wrap.style.animation = `flyer-drift-${dir} ${dur}s linear forwards`;

    wrap.innerHTML = `<svg viewBox="0 0 120 120" preserveAspectRatio="xMidYMid meet"><use href="#${symbol}"/></svg>`;

    wrap.addEventListener('animationend', () => {
      wrap.remove();
      spawn();
    });

    stage.appendChild(wrap);
  }

  for (let i = 0; i < COUNT; i++) {
    // stagger initial spawns so they don't all enter at once
    setTimeout(spawn, i * (8000 / COUNT));
  }
})();

/* ============================================================
   Boot
   ============================================================ */
loadNotes();
