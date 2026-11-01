// Site-wide verse search. Loads a static index (built from the verse YAML) the
// first time the reader shows intent to search, then matches every keystroke
// in memory. Diacritics and case are ignored, so "krsna" finds "kṛṣṇa".

interface VerseRecord {
  u: string; // url
  c: number;
  v: number;
  sp: string;
  t: string; // story title
  m: string; // meaning
  sa: string; // sanskrit
  tr: string; // transliteration
  q: string; // reflection
}

type FieldKey = 't' | 'm' | 'sa' | 'tr' | 'd' | 'q' | 'st';

interface Entry {
  rec: VerseRecord;
  story: string;
  words: string; // word-by-word
  norm: Record<FieldKey, string>;
  all: string;
}

// Higher weight = a match here ranks the verse higher.
const FIELDS: { key: FieldKey; weight: number; label: string }[] = [
  { key: 't', weight: 6, label: 'Story title' },
  { key: 'm', weight: 5, label: 'Meaning' },
  { key: 'tr', weight: 4, label: 'Transliteration' },
  { key: 'sa', weight: 4, label: 'Sanskrit' },
  { key: 'd', weight: 3, label: 'Word by word' },
  { key: 'q', weight: 2, label: 'Reflection' },
  { key: 'st', weight: 1, label: 'Story' },
];
// Which field to quote under a result, in order of preference.
const SNIPPET_ORDER: FieldKey[] = ['m', 'st', 'q', 'tr', 'd', 'sa'];
const DEVANAGARI_FIELDS = new Set<FieldKey>(['sa', 'd']);
const MAX_RESULTS = 50;

const SPEAKERS: Record<string, string> = {
  krishna: 'Krishna',
  arjuna: 'Arjuna',
  sanjaya: 'Sanjaya',
  dhritarashtra: 'Dhritarashtra',
  duryodhana: 'Duryodhana',
};

const COMBINING = /[̀-ͯ]/g;
const LETTER = /[\p{L}\p{M}\p{N}]/u;

export function normalize(s: string): string {
  return s.normalize('NFD').replace(COMBINING, '').replace(/[‌‍]/g, '').toLowerCase();
}

// Normalized text plus, for each normalized char, its index in the original
// string. Lets a match found in normalized text be mapped back for display.
export function normalizeWithMap(s: string): { text: string; map: number[] } {
  let text = '';
  const map: number[] = [];
  for (let i = 0; i < s.length; i++) {
    const n = normalize(s[i]);
    for (let k = 0; k < n.length; k++) map.push(i);
    text += n;
  }
  map.push(s.length);
  return { text, map };
}

export function parseTerms(query: string): string[] {
  return normalize(query).split(/\s+/).filter(Boolean);
}

// Sanskrit compounds join words, so in Sanskrit fields a match may start
// mid-word ("indriya" in "yastvindriyāṇi"). In English it must start a word,
// so "arrow" does not find "sparrow".
const MID_WORD_FIELDS = new Set<FieldKey>(['sa', 'tr', 'd']);
const SANSKRIT_CHARS = /[\u0900-\u097F\u0100-\u017F\u1E00-\u1EFF]/;

function startsWord(text: string, at: number): boolean {
  return at === 0 || !LETTER.test(text[at - 1]);
}

// First allowed match position of term in normalized text, or -1.
function findTerm(text: string, term: string, midWord: boolean, from = 0): number {
  let at = text.indexOf(term, from);
  while (at !== -1 && !midWord && !startsWord(text, at)) at = text.indexOf(term, at + 1);
  return at;
}

function isWholeWord(text: string, at: number, len: number): boolean {
  const before = at > 0 ? text[at - 1] : ' ';
  const after = at + len < text.length ? text[at + len] : ' ';
  return !LETTER.test(before) && !LETTER.test(after);
}

// ---------- index loading ----------

let entries: Entry[] = [];
let coreLoaded: Promise<void> | null = null;
let storiesLoaded = false;
let onIndexChange: () => void = () => {};

function fieldText(e: Pick<Entry, 'rec' | 'story' | 'words'>, key: FieldKey): string {
  if (key === 'st') return e.story;
  if (key === 'd') return e.words;
  return e.rec[key as Exclude<FieldKey, 'st' | 'd'>];
}

function buildEntry(rec: VerseRecord, story = '', words = ''): Entry {
  const norm = {} as Record<FieldKey, string>;
  for (const f of FIELDS) norm[f.key] = normalize(fieldText({ rec, story, words }, f.key));
  return { rec, story, words, norm, all: FIELDS.map((f) => norm[f.key]).join('\u0001') };
}

function loadIndex(): Promise<void> {
  if (coreLoaded) return coreLoaded;
  coreLoaded = fetch('/search/verses.json')
    .then((r) => r.json() as Promise<VerseRecord[]>)
    .then((recs) => {
      entries = recs.map((rec) => buildEntry(rec));
      onIndexChange();
      return fetch('/search/stories.json')
        .then((r) => r.json() as Promise<[string, string][]>)
        .then((rows) => {
          entries = entries.map((e, i) => buildEntry(e.rec, rows[i]?.[0], rows[i]?.[1]));
          storiesLoaded = true;
          onIndexChange();
        });
    })
    .catch(() => {
      coreLoaded = null; // allow a retry on the next attempt
    });
  return coreLoaded;
}

// ---------- matching ----------

interface Hit {
  entry: Entry;
  score: number;
}

function search(query: string): Hit[] {
  const terms = parseTerms(query);
  if (!terms.length) return [];
  const hits: Hit[] = [];
  for (const entry of entries) {
    if (!terms.every((t) => entry.all.includes(t))) continue;
    let score = 0;
    let ok = true;
    for (const term of terms) {
      let best = 0;
      for (const f of FIELDS) {
        const text = entry.norm[f.key];
        const at = findTerm(text, term, MID_WORD_FIELDS.has(f.key));
        if (at === -1) continue;
        const s = f.weight * (isWholeWord(text, at, term.length) ? 2 : 1);
        if (s > best) best = s;
      }
      if (!best) {
        ok = false;
        break;
      }
      score += best;
    }
    if (ok) hits.push({ entry, score });
  }
  hits.sort((a, b) => b.score - a.score || a.entry.rec.c - b.entry.rec.c || a.entry.rec.v - b.entry.rec.v);
  return hits;
}

// "2.47", "2:47", "2 47" jump straight to that verse.
function refMatch(query: string): Entry | undefined {
  const m = query.trim().match(/^(\d{1,2})\s*[.:,\s]\s*(\d{1,2})$/);
  if (!m) return undefined;
  const c = Number(m[1]);
  const v = Number(m[2]);
  return entries.find((e) => e.rec.c === c && e.rec.v === v);
}

// ---------- rendering ----------

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);
}

function matchRanges(text: string, terms: string[], midWord = false): [number, number][] {
  const { text: n, map } = normalizeWithMap(text);
  const ranges: [number, number][] = [];
  for (const t of terms) {
    let at = findTerm(n, t, midWord);
    while (at !== -1) {
      ranges.push([map[at], map[at + t.length]]);
      at = findTerm(n, t, midWord, at + t.length);
    }
  }
  return ranges.sort((a, b) => a[0] - b[0]);
}

// Escaped text[start, end) with matches wrapped in <mark>.
function marked(text: string, ranges: [number, number][], start = 0, end = text.length): string {
  let out = '';
  let pos = start;
  for (const [a, b] of ranges) {
    if (a < pos || a >= end) continue;
    out += esc(text.slice(pos, a)) + '<mark>' + esc(text.slice(a, Math.min(b, end))) + '</mark>';
    pos = Math.min(b, end);
  }
  return out + esc(text.slice(pos, end));
}

// A ~150-char window around the first match, trimmed at word boundaries.
function snippet(text: string, terms: string[], midWord = false, width = 150): string {
  const ranges = matchRanges(text, terms, midWord);
  const first = ranges.length ? ranges[0][0] : 0;
  let start = Math.max(0, first - 50);
  if (start > 0) {
    const space = text.lastIndexOf(' ', start);
    start = space > first - 70 ? space + 1 : start;
  }
  let end = Math.min(text.length, start + width);
  if (end < text.length) {
    const space = text.indexOf(' ', end);
    if (space !== -1 && space - end < 20) end = space;
  }
  return (start > 0 ? '…' : '') + marked(text, ranges, start, end) + (end < text.length ? '…' : '');
}

function renderHit(entry: Entry, terms: string[], query: string, id: string, isRef = false): string {
  const { rec } = entry;
  let field: FieldKey = 'm';
  for (const k of SNIPPET_ORDER) {
    if (terms.some((t) => findTerm(entry.norm[k], t, MID_WORD_FIELDS.has(k)) !== -1)) {
      field = k;
      break;
    }
  }
  const label = isRef ? 'Go to verse' : FIELDS.find((f) => f.key === field)!.label;
  const text = fieldText(entry, field);
  const font = DEVANAGARI_FIELDS.has(field) ? 'font-devanagari' : 'font-body';
  const href = isRef ? rec.u : `${rec.u}?q=${encodeURIComponent(query.trim())}`;
  return `<a id="${id}" role="option" aria-selected="false" href="${href}" class="search-hit block px-4 py-3 border-b border-gold/10 last:border-b-0 hover:bg-cream-dark/60 focus:outline-none">
    <div class="flex items-baseline gap-2 font-ui text-xs">
      <span class="font-semibold text-saffron-ink tabular-nums">${rec.c}.${rec.v}</span>
      <span class="text-gray-600">${esc(SPEAKERS[rec.sp] ?? rec.sp)}</span>
      <span class="text-gold" aria-hidden="true">·</span>
      <span class="truncate text-gray-700 font-medium">${marked(rec.t, matchRanges(rec.t, terms))}</span>
      <span class="ml-auto shrink-0 text-xs uppercase tracking-wider text-gray-500">${label}</span>
    </div>
    <p class="${font} mt-1 text-sm leading-relaxed text-gray-700 line-clamp-2">${snippet(text, isRef ? [] : terms, MID_WORD_FIELDS.has(field))}</p>
  </a>`;
}

// ---------- UI wiring ----------

export function initSearch() {
  const panel = document.getElementById('search-panel');
  const list = document.getElementById('search-results');
  const status = document.getElementById('search-status');
  const desktopInput = document.getElementById('search-input-desktop') as HTMLInputElement | null;
  const mobileInput = document.getElementById('search-input-mobile') as HTMLInputElement | null;
  const mobileRow = document.getElementById('mobile-search');
  const toggleBtn = document.getElementById('search-toggle');
  const menu = document.getElementById('mobile-menu');
  const menuBtn = document.getElementById('mobile-menu-btn');
  if (!panel || !list || !status || !desktopInput || !mobileInput || !mobileRow || !toggleBtn) return;

  const inputs = [desktopInput, mobileInput];
  let activeInput: HTMLInputElement = desktopInput;
  let activeIndex = -1;
  let timer: number | undefined;

  const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches;

  function setExpanded(open: boolean) {
    for (const i of inputs) i.setAttribute('aria-expanded', String(open));
  }

  function closePanel() {
    panel!.classList.add('hidden');
    document.body.classList.remove('search-open');
    setExpanded(false);
    activeIndex = -1;
  }

  function openPanel() {
    panel!.classList.remove('hidden');
    document.body.classList.add('search-open'); // hides the fixed bottom verse bar
    setExpanded(true);
  }

  function hitEls(): HTMLAnchorElement[] {
    return Array.from(list!.querySelectorAll<HTMLAnchorElement>('.search-hit'));
  }

  function setActive(i: number) {
    const els = hitEls();
    if (!els.length) return;
    activeIndex = (i + els.length) % els.length;
    els.forEach((el, k) => {
      const on = k === activeIndex;
      el.setAttribute('aria-selected', String(on));
      el.classList.toggle('bg-cream-dark/60', on);
    });
    els[activeIndex].scrollIntoView({ block: 'nearest' });
    activeInput.setAttribute('aria-activedescendant', els[activeIndex].id);
  }

  function run() {
    const query = activeInput.value;
    activeIndex = -1;
    activeInput.removeAttribute('aria-activedescendant');
    const terms = parseTerms(query);
    if (query.trim().length < 2) {
      closePanel();
      return;
    }
    openPanel();
    if (!entries.length) {
      list!.innerHTML = '';
      status!.textContent = 'Loading verses…';
      return;
    }
    const ref = refMatch(query);
    const hits = search(query).filter((h) => h.entry !== ref);
    const total = hits.length + (ref ? 1 : 0);
    const html: string[] = [];
    if (ref) html.push(renderHit(ref, terms, query, 'search-hit-ref', true));
    hits.slice(0, MAX_RESULTS).forEach((h, i) => html.push(renderHit(h.entry, terms, query, `search-hit-${i}`)));
    list!.innerHTML = html.join('');

    const pending = storiesLoaded ? '' : ' Still loading stories…';
    if (!total) {
      status!.textContent = `No verses found for “${query.trim()}”.${pending}`;
    } else if (hits.length > MAX_RESULTS) {
      status!.textContent = `${total} verses match. Showing the top ${MAX_RESULTS}; add another word to narrow it.${pending}`;
    } else {
      status!.textContent = `${total} ${total === 1 ? 'verse matches' : 'verses match'}.${pending}`;
    }
  }

  onIndexChange = () => {
    if (!panel.classList.contains('hidden')) run();
  };

  for (const input of inputs) {
    input.addEventListener('focus', () => {
      activeInput = input;
      loadIndex();
      if (input.value.trim().length >= 2) run();
    });
    input.addEventListener('pointerenter', () => loadIndex());
    input.addEventListener('input', () => {
      activeInput = input;
      window.clearTimeout(timer);
      timer = window.setTimeout(run, 60);
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive(activeIndex + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive(activeIndex - 1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const els = hitEls();
        const target = els[activeIndex >= 0 ? activeIndex : 0];
        if (target) window.location.href = target.href;
      } else if (e.key === 'Escape') {
        if (!panel.classList.contains('hidden')) closePanel();
        else input.blur();
        if (input === mobileInput && !input.value) hideMobileRow();
      }
    });
  }

  function showMobileRow() {
    mobileRow!.classList.remove('hidden');
    toggleBtn!.setAttribute('aria-expanded', 'true');
    if (menu && menuBtn) {
      menu.classList.add('hidden');
      menuBtn.setAttribute('aria-expanded', 'false');
    }
    mobileInput!.focus();
  }

  function hideMobileRow() {
    mobileRow!.classList.add('hidden');
    toggleBtn!.setAttribute('aria-expanded', 'false');
    closePanel();
  }

  toggleBtn.addEventListener('pointerdown', () => loadIndex());
  toggleBtn.addEventListener('click', () => {
    if (mobileRow.classList.contains('hidden')) showMobileRow();
    else hideMobileRow();
  });
  menuBtn?.addEventListener('click', () => {
    if (!mobileRow.classList.contains('hidden')) hideMobileRow();
  });

  // Click outside the nav closes results.
  document.addEventListener('pointerdown', (e) => {
    const nav = document.getElementById('site-nav');
    if (nav && !nav.contains(e.target as Node)) closePanel();
  });

  // "/" or Ctrl/Cmd+K focuses search from anywhere.
  document.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement;
    const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
    const slash = e.key === '/' && !typing;
    const cmdK = e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey);
    if (!slash && !cmdK) return;
    e.preventDefault();
    if (isDesktop()) desktopInput.focus();
    else showMobileRow();
  });

  // Arriving from a result: prefill the box with the query.
  const q = new URLSearchParams(window.location.search).get('q');
  if (q) for (const i of inputs) i.value = q;
}

// On a verse page reached from search, highlight the words and scroll to the
// first one. Uses the CSS Custom Highlight API, so the DOM (including hydrated
// React islands) is never modified.
export function highlightFromQuery() {
  const q = new URLSearchParams(window.location.search).get('q');
  const main = document.getElementById('main-content');
  if (!q || !main) return;
  const terms = parseTerms(q);
  if (!terms.length) return;

  const run = () => {
    const ranges: Range[] = [];
    const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) =>
        node.parentElement?.closest('script, style, [aria-hidden="true"]')
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT,
    });
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const raw = node.nodeValue ?? '';
      if (!raw.trim()) continue;
      const { text, map } = normalizeWithMap(raw);
      const midWord = SANSKRIT_CHARS.test(raw);
      for (const t of terms) {
        let at = findTerm(text, t, midWord);
        while (at !== -1) {
          const r = document.createRange();
          r.setStart(node, map[at]);
          r.setEnd(node, map[at + t.length]);
          ranges.push(r);
          at = findTerm(text, t, midWord, at + t.length);
        }
      }
    }
    if (!ranges.length) return;
    const css = (window as any).CSS;
    if (css?.highlights && (window as any).Highlight) {
      css.highlights.set('gk-search', new (window as any).Highlight(...ranges));
    }
    ranges.sort((a, b) => a.compareBoundaryPoints(Range.START_TO_START, b));
    // Measure the range itself: text inside a React island has an
    // `astro-island` (display: contents) parent with no box to scroll to.
    const rect = ranges[0].getBoundingClientRect();
    window.scrollTo({ top: window.scrollY + rect.top - window.innerHeight / 3, behavior: 'smooth' });
  };

  // Wait for islands (glossary tooltips) to hydrate so text nodes are final.
  if (document.readyState === 'complete') setTimeout(run, 150);
  else window.addEventListener('load', () => setTimeout(run, 150));
}
