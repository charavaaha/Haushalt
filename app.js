/* Haushalt – App-Logik. Läuft komplett lokal; Internet nur für Produktinfos (Open Food Facts) und optional KI. */
(() => {
'use strict';
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
const P = window.HParser, norm = P.norm, cap = P.cap;
const KEY = 'haushalt-v2', KKEY = 'haushalt-ai';

/* ================= Daten ================= */
let S = { shopping: [], pantry: [], todos: [], catalog: {}, recipes: [] };
try { const l = JSON.parse(localStorage.getItem(KEY) || 'null'); if (l) S = Object.assign(S, l); } catch (e) {}
let AI = { key: '', model: 'claude-haiku-5-5' };
try { Object.assign(AI, JSON.parse(localStorage.getItem(KKEY) || '{}')); } catch (e) {}
const LDEF = () => ({ buys: {}, order: {}, aliases: {}, recipe: {}, tags: {}, dismissed: {}, trip: { at: 0, idx: 0 } });
S.learn = Object.assign(LDEF(), S.learn || {});
S.settings = Object.assign({ ask: true, speak: false, suggest: true }, S.settings || {});
let undoSnap = null;
function snap() { undoSnap = JSON.stringify(S); }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Speichern fehlgeschlagen – Speicher voll?'); } render(); }
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

/* ================= Navigation ================= */
const views = ['einkauf', 'vorrat', 'rezepte', 'todos', 'mehr'];
function route() {
  const v = views.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'einkauf';
  views.forEach(n => $('v-' + n).classList.toggle('on', n === v));
  document.querySelectorAll('nav.tabbar a').forEach(a => a.setAttribute('aria-current', a.dataset.v === v));
  if (v === 'rezepte' && !$('recList').innerHTML) localRecipes();
  if (v === 'mehr') renderSettings();
}
window.addEventListener('hashchange', route);
const go = v => { if (location.hash !== '#' + v) location.hash = v; else route(); };

/* ================= Hilfen ================= */
function daysUntil(d) { if (!d) return null; const t = new Date(d + 'T00:00'), n = new Date(); n.setHours(0, 0, 0, 0); return Math.round((t - n) / 864e5); }
function fmtDT(s) { if (!s) return ''; const d = new Date(s); return d.toLocaleString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); }
let toastTimer;
function toast(msg, undo) {
  $('toastMsg').textContent = msg; $('toastOk').textContent = undo ? 'Rückgängig' : 'OK'; $('toastOk').dataset.undo = undo ? '1' : '';
  $('toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('show'), undo ? 7000 : 5000);
}
$('toastOk').onclick = () => { if ($('toastOk').dataset.undo && undoSnap) { S = JSON.parse(undoSnap); undoSnap = null; save(); } $('toast').classList.remove('show'); };
function online() { $('onl').textContent = navigator.onLine ? '' : 'offline'; }
window.addEventListener('online', online); window.addEventListener('offline', online); online();

/* ================= Listen-Logik ================= */
function addShop(name, qty) {
  name = cap(aliasOf(String(name || '').trim())); if (!name) return;
  const ex = S.shopping.find(i => norm(i.name) === norm(name) && !i.done);
  if (ex) { if (qty) ex.qty = qty; return; }
  S.shopping.push({ id: uid(), name, qty: qty || '', done: false });
}
function addPantry(p) {
  if (!p.name) return 'none'; p.name = cap(aliasOf(p.name));
  const ex = S.pantry.find(x => (p.code && x.code === p.code) || (!p.code && !x.code && norm(x.name) === norm(p.name)));
  if (ex) { ex.n = (+ex.n || 1) + (+p.n || 1); ['exp', 'loc', 'qty', 'brand', 'info', 'cat'].forEach(k => { if (p[k]) ex[k] = p[k]; }); return 'more'; }
  S.pantry.push(Object.assign({ id: uid(), name: '', brand: '', qty: '', n: 1, cat: '', exp: '', code: '', loc: 'Vorratsschrank', info: '', added: new Date().toISOString().slice(0, 10) }, p, { n: +p.n || 1 }));
  return 'new';
}
function rememberProduct(p) { if (!p.code) return; S.catalog[p.code] = { name: p.name, brand: p.brand, qty: p.qty, cat: p.cat, loc: p.loc, info: p.info, img: p.img || (S.catalog[p.code] || {}).img || '' }; }
function addTodo(t) { const o = { id: uid(), title: cap(t.title), due: t.due || '', remind: String(t.remind ?? 30), done: false, notified: false }; S.todos.push(o); return o; }

/* ================= Lernen (läuft lokal bei jeder Nutzung) ================= */
const L = () => S.learn;
const todayISO = () => new Date().toISOString().slice(0, 10);
function aliasOf(name) { const a = L().aliases[norm(name)]; return a || name; }
function learnBuy(name) {
  const k = norm(name); if (!k) return;
  const b = L().buys[k] || (L().buys[k] = { name: cap(name), dates: [] });
  b.name = cap(name); const t = todayISO();
  if (b.dates[b.dates.length - 1] !== t) { b.dates.push(t); if (b.dates.length > 12) b.dates.shift(); }
  // Ladenreihenfolge: in welcher Reihenfolge du im Laden abhakst
  const tr = L().trip, now = Date.now(); if (now - tr.at > 2 * 36e5) tr.idx = 0; tr.at = now;
  L().order[k] = L().order[k] == null ? tr.idx : Math.round((L().order[k] * 0.6 + tr.idx * 0.4) * 10) / 10; tr.idx++;
  delete L().dismissed[k];
}
function rhythm(b) { const d = b.dates.map(x => new Date(x + 'T00:00').getTime()); if (d.length < 2) return null; let sum = 0; for (let i = 1; i < d.length; i++) sum += d[i] - d[i - 1]; return Math.max(1, Math.round(sum / (d.length - 1) / 864e5)); }
function buySuggestions() {
  if (!S.settings.suggest) return [];
  const now = Date.now(), open = S.shopping.filter(i => !i.done);
  return Object.entries(L().buys).map(([k, b]) => {
    const avg = rhythm(b); if (!avg) return null;
    const last = b.dates[b.dates.length - 1], since = Math.round((now - new Date(last + 'T00:00').getTime()) / 864e5);
    if (since < avg * 0.85 || L().dismissed[k] === last) return null;
    if (open.some(i => norm(i.name) === k) || S.pantry.some(p => norm(p.name) === k && (+p.n || 1) > 0)) return null;
    return { k, name: b.name, avg, since, due: since / avg };
  }).filter(Boolean).sort((a, b) => b.due - a.due).slice(0, 6);
}
function learnRecipe(r, delta) {
  L().recipe[r.title] = (L().recipe[r.title] || 0) + delta;
  const t = L().tags, f = delta > 0 ? 1 : -0.5, mins = parseInt(r.time) || 30;
  if (r.vegan) t.vegan = (t.vegan || 0) + f; if (r.veg) t.veg = (t.veg || 0) + f; else t.meat = (t.meat || 0) + f; if (mins <= 20) t.quick = (t.quick || 0) + f;
}

/* ================= Rückfragen & Vorlesen ================= */
const askQueue = [];
function ask(q, opts) { askQueue.push({ q, opts }); if (askQueue.length === 1) showAsk(); }
function showAsk() {
  const a = askQueue[0]; const r = $('reply'); clearTimeout(replyTimer);
  if (!a) { r.classList.remove('show'); return; }
  r.innerHTML = '<div class="rtop"><span>' + esc(a.q) + '</span><button type="button" class="rx" id="rClose" aria-label="Schließen">×</button></div><div class="opts">' + a.opts.map((o, i) => `<button type="button" data-o="${i}">${esc(o.label)}</button>`).join('') + '</div>';
  r.classList.add('show'); speak(a.q);
  r.querySelectorAll('[data-o]').forEach(b => b.onclick = () => { const o = a.opts[+b.dataset.o]; askQueue.shift(); try { o.fn && o.fn(); } catch (e) {} save(); showAsk(); });
  $('rClose').onclick = () => { askQueue.length = 0; r.classList.remove('show'); };
}
function speak(t) { if (!S.settings.speak || !t || !window.speechSynthesis) return; try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t.replace(/[🛒📦📝✓−]/g, '')); u.lang = 'de-DE'; u.rate = 1.05; speechSynthesis.speak(u); } catch (e) {} }
function atDay(addDays, h, m) { const d = new Date(); d.setDate(d.getDate() + addDays); d.setHours(h, m || 0, 0, 0); const p = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(h) + ':' + p(m || 0); }
function plusDays(n) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
function followUps(created) {
  if (!S.settings.ask) return;
  created.todos.forEach(t => {
    if (!t.due) {
      const sat = (6 - new Date().getDay() + 7) % 7 || 7, eve = new Date().getHours() < 17;
      ask('Wann soll ich dich an „' + t.title + '“ erinnern?', [
        ...(eve ? [{ label: 'Heute 18 Uhr', fn: () => { t.due = atDay(0, 18); } }] : []),
        { label: 'Morgen 9 Uhr', fn: () => { t.due = atDay(1, 9); } },
        { label: 'Samstag 10 Uhr', fn: () => { t.due = atDay(sat, 10); } },
        { label: 'Ohne Termin', fn: null }]);
    } else ask('„' + t.title + '“ auch in den iPhone-Kalender eintragen? Dann erinnert dich das iPhone sicher.', [{ label: 'Ja, eintragen', fn: () => { openICS([t]); t.inCal = true; } }, { label: 'Nein', fn: null }]);
  });
  created.pantry.forEach(p => {
    if (p.exp || !/kühl/i.test(p.loc || '')) return;
    ask('Wie lange ist „' + p.name + '“ ungefähr haltbar?', [
      { label: '3 Tage', fn: () => { p.exp = plusDays(3); } }, { label: '1 Woche', fn: () => { p.exp = plusDays(7); } },
      { label: '2 Wochen', fn: () => { p.exp = plusDays(14); } }, { label: 'Weiß nicht', fn: null }]);
  });
}

/* ================= Rendern ================= */
let locFilter = 'Alle';
function renderToday() {
  const h = new Date().getHours(), greet = h < 11 ? 'Guten Morgen' : h < 17 ? 'Hallo' : 'Guten Abend';
  const now = Date.now(), end = new Date(); end.setHours(23, 59, 59);
  const tds = S.todos.filter(t => !t.done && t.due && new Date(t.due) <= end);
  const exp = S.pantry.filter(p => { const d = daysUntil(p.exp); return d !== null && d <= 2; });
  const sug = buySuggestions(); const parts = [];
  if (tds.length) parts.push(`<div class="tline"><a href="#todos">📝 ${tds.length === 1 ? '1 Aufgabe' : tds.length + ' Aufgaben'} heute${tds.some(t => new Date(t.due) < now) ? ' (überfällig dabei)' : ''}:</a> ${esc(tds.slice(0, 3).map(t => t.title).join(', '))}</div>`);
  if (exp.length) parts.push(`<div class="tline">⏳ Bald ablaufend: ${esc(exp.slice(0, 4).map(p => p.name).join(', '))} <button class="mini" data-a="expRec">Rezept dazu</button></div>`);
  if (sug.length) parts.push(`<div class="tline">🔁 Dein Rhythmus sagt, das brauchst du bald:</div><div class="opts">${sug.map(x => `<span class="sug"><button class="mini" data-a="sugAdd" data-k="${esc(x.k)}" title="kaufst du etwa alle ${x.avg} Tage">+ ${esc(x.name)}</button><button class="mini x2" data-a="sugNo" data-k="${esc(x.k)}" aria-label="Nicht jetzt">×</button></span>`).join('')}${sug.length > 1 ? '<button class="mini" data-a="sugAll">Alle hinzufügen</button>' : ''}</div>`);
  $('today').innerHTML = parts.length ? `<div class="tg">${greet}!</div>` + parts.join('') : '';
  $('today').hidden = !parts.length;
}
function render() {
  const ord = k => { const o = L().order[norm(k)]; return o == null ? 999 : o; };
  const sh = [...S.shopping.filter(i => !i.done).sort((a, b) => ord(a.name) - ord(b.name)), ...S.shopping.filter(i => i.done)];
  $('shopList').innerHTML = sh.length ? sh.map(i => `<li class="${i.done ? 'done' : ''}" data-id="${i.id}"><button class="chk" data-a="shopTog" aria-label="Abhaken">${i.done ? '✓' : ''}</button><div class="main"><div class="name" data-a="shopEdit" title="Antippen zum Korrigieren">${esc(i.name)}</div>${i.qty ? `<div class="meta">${esc(i.qty)}</div>` : ''}</div><button class="x" data-a="shopDel" aria-label="Löschen">×</button></li>`).join('')
    : '<li class="empty">Liste ist leer. Sag z. B. „Butter und Äpfel kaufen“.</li>';

  renderToday();
  const known = [...new Set([...Object.values(L().buys).map(b => b.name), ...Object.values(S.catalog).map(c => c.name), ...S.pantry.map(p => p.name)].filter(Boolean))].sort();
  $('known').innerHTML = known.map(n => `<option value="${esc(n)}">`).join('');
  const locs = ['Alle', ...new Set(S.pantry.map(p => p.loc || 'Sonstiges'))];
  if (!locs.includes(locFilter)) locFilter = 'Alle';
  $('locChips').innerHTML = S.pantry.length ? locs.map(l => `<button class="btn2 ${l === locFilter ? 'on' : ''}" data-loc="${esc(l)}">${esc(l)}</button>`).join('') : '';
  const q = norm($('panSearch').value);
  const pan = S.pantry.filter(p => (locFilter === 'Alle' || (p.loc || 'Sonstiges') === locFilter) && (!q || norm([p.name, p.brand, p.cat, p.loc, p.code].join(' ')).includes(q)))
    .sort((a, b) => (a.exp || '9999').localeCompare(b.exp || '9999') || a.name.localeCompare(b.name));
  $('panList').innerHTML = pan.length ? pan.map(p => {
    const d = daysUntil(p.exp); let tag = '';
    if (d !== null) tag = d < 0 ? '<span class="tag bad">abgelaufen</span>' : d <= 3 ? `<span class="tag warn">${d === 0 ? 'heute' : 'noch ' + d + (d === 1 ? ' Tag' : ' Tage')}</span>` : `<span class="tag">bis ${new Date(p.exp + 'T00:00').toLocaleDateString('de-DE')}</span>`;
    return `<li data-id="${p.id}"><div class="main" data-a="panEdit" style="cursor:pointer"><div class="name"><strong>${esc(p.name)}</strong>${p.brand ? ' <span class="meta">' + esc(p.brand) + '</span>' : ''}</div><div class="meta">${tag}<span class="tag">${esc(p.loc || 'Sonstiges')}</span>${p.qty ? esc(p.qty) : ''}</div></div>
      <div class="cnt"><button data-a="panMinus" aria-label="Eins weniger">−</button><span>${+p.n || 1}</span><button data-a="panPlus" aria-label="Eins mehr">+</button></div></li>`;
  }).join('') : `<li class="empty">${q || locFilter !== 'Alle' ? 'Nichts gefunden.' : 'Noch leer. Scanne ein Produkt oder sag „Reis und Nudeln sind im Vorrat“.'}</li>`;

  const now = Date.now();
  const td = [...S.todos].sort((a, b) => (a.done - b.done) || (a.due || '9').localeCompare(b.due || '9'));
  $('todoList').innerHTML = td.length ? td.map(t => {
    const over = t.due && !t.done && new Date(t.due) < now;
    return `<li class="${t.done ? 'done' : ''}" data-id="${t.id}"><button class="chk" data-a="todoTog" aria-label="Erledigt">${t.done ? '✓' : ''}</button><div class="main"><div class="name">${esc(t.title)}</div>
      <div class="meta">${t.due ? `<span class="tag ${over ? 'bad' : ''}">${over ? 'überfällig · ' : ''}${fmtDT(t.due)}</span>${+t.remind ? `<span class="tag">⏰ ${remTxt(t.remind)}</span>` : ''}` : 'ohne Termin'}</div>
      ${t.due && !t.done ? `<div><a class="cal" href="#" data-a="ics">In Kalender ↗</a><a class="cal" href="${gcal(t)}" target="_blank" rel="noopener">Google</a>${t.inCal ? '<span class="tag">im Kalender</span>' : ''}</div>` : ''}</div>
      <button class="x" data-a="todoDel" aria-label="Löschen">×</button></li>`;
  }).join('') : '<li class="empty">Keine Aufgaben. Sag z. B. „Freitag 18 Uhr Mama anrufen“.</li>';

  const open = S.shopping.filter(i => !i.done).length, dueToday = S.todos.filter(t => !t.done).length;
  const soon = S.pantry.filter(p => { const d = daysUntil(p.exp); return d !== null && d <= 3; }).length;
  $('bShop').textContent = open || ''; $('bTodo').textContent = dueToday || ''; $('bPan').textContent = soon || '';
  try { const urgent = S.todos.filter(t => !t.done && t.due && new Date(t.due) < Date.now() + 864e5).length; if (navigator.setAppBadge) urgent ? navigator.setAppBadge(urgent) : navigator.clearAppBadge(); } catch (e) {}
}
const remTxt = r => +r >= 1440 ? (+r / 1440) + ' Tag vorher' : +r >= 60 ? (+r / 60) + ' Std. vorher' : r + ' Min. vorher';

/* ================= Klicks ================= */
document.body.addEventListener('click', e => {
  const c = e.target.closest('[data-loc]'); if (c) { locFilter = c.dataset.loc; render(); return; }
  const b = e.target.closest('[data-a]'); if (!b) return;
  const li = b.closest('[data-id]'), id = li && li.dataset.id, a = b.dataset.a;
  if (a === 'ics') { e.preventDefault(); const t = S.todos.find(x => x.id === id); openICS([t]); t.inCal = true; save(); return; }
  if (a === 'panEdit') { openPan(S.pantry.find(x => x.id === id)); return; }
  if (a === 'shopEdit') { editName(b, S.shopping.find(x => x.id === id)); return; }
  if (a === 'expRec') { const exp = S.pantry.filter(p => { const d = daysUntil(p.exp); return d !== null && d <= 2; }); $('recHint').value = exp.map(p => p.name).join(' '); go('rezepte'); localRecipes(); return; }
  if (a === 'sugAdd' || a === 'sugAll' || a === 'sugNo') { snap(); const list = a === 'sugAll' ? buySuggestions() : buySuggestions().filter(x => x.k === b.dataset.k);
    list.forEach(x => { if (a === 'sugNo') { const bb = L().buys[x.k]; L().dismissed[x.k] = bb.dates[bb.dates.length - 1]; } else addShop(x.name, ''); }); save(); return; }
  if (a === 'recCooked' || a === 'recNo') { const r = curRecipes[+b.dataset.i]; learnRecipe(r, a === 'recCooked' ? 1 : -1); save();
    if (a === 'recNo') { toast('Verstanden – „' + r.title + '“ schlage ich seltener vor.'); localRecipes(); return; }
    b.textContent = '👍 Gemerkt'; b.disabled = true;
    const used = (r.uses || []).map(u => S.pantry.find(p => norm(p.name) === norm(u))).filter(Boolean);
    if (used.length) ask('Guten Appetit! Soll ich die verwendeten Zutaten aus dem Vorrat abziehen? (' + used.map(p => p.name).join(', ') + ')', [
      { label: 'Ja, abziehen', fn: () => { snap(); used.forEach(p => { p.n = (+p.n || 1) - 1; if (p.n <= 0) { S.pantry = S.pantry.filter(x => x !== p); addShop(p.name, ''); } }); toast('Vorrat aktualisiert – Aufgebrauchtes steht auf der Einkaufsliste.', true); } },
      { label: 'Nein', fn: null }]);
    return; }
  if (a === 'recShop') { snap(); const r = curRecipes[+b.dataset.i]; r.missing.forEach(m => addShop(m, '')); save(); toast(r.missing.length + ' Zutat(en) auf die Einkaufsliste gesetzt.', true); return; }
  snap();
  if (a === 'shopTog') { const i = S.shopping.find(x => x.id === id); i.done = !i.done; if (i.done) learnBuy(i.name); }
  if (a === 'shopDel') S.shopping = S.shopping.filter(x => x.id !== id);
  if (a === 'panPlus') { const p = S.pantry.find(x => x.id === id); p.n = (+p.n || 1) + 1; }
  if (a === 'panMinus') {
    const p = S.pantry.find(x => x.id === id); p.n = (+p.n || 1) - 1;
    if (p.n <= 0) { S.pantry = S.pantry.filter(x => x.id !== id); addShop(p.name, ''); toast(p.name + ' ist aufgebraucht – steht jetzt auf der Einkaufsliste.', true); }
  }
  if (a === 'todoTog') { const t = S.todos.find(x => x.id === id); t.done = !t.done; }
  if (a === 'todoDel') { S.todos = S.todos.filter(x => x.id !== id); toast('Aufgabe gelöscht.', true); }
  save();
});
$('shopForm').addEventListener('submit', e => { e.preventDefault(); snap(); const it = P.parseItem($('shopName').value); addShop(it.name, $('shopQty').value || it.qty); $('shopName').value = ''; $('shopQty').value = ''; save(); $('shopName').focus(); });
$('toPantry').onclick = () => { snap(); const d = S.shopping.filter(i => i.done); d.forEach(i => { const c = Object.values(S.catalog).find(x => norm(x.name) === norm(i.name)); addPantry(Object.assign({}, c || {}, { name: i.name, qty: (c && c.qty) || i.qty, n: parseInt(i.qty) > 1 && !/[a-z]/i.test(i.qty) ? parseInt(i.qty) : 1 })); }); S.shopping = S.shopping.filter(i => !i.done); save(); if (d.length) toast(d.length + ' Artikel in den Vorrat übernommen.', true); };
$('clearDone').onclick = () => { snap(); S.shopping = S.shopping.filter(i => !i.done); save(); };
$('shareList').onclick = async () => { const txt = 'Einkaufsliste:\n' + S.shopping.filter(i => !i.done).map(i => '• ' + i.name + (i.qty ? ' (' + i.qty + ')' : '')).join('\n');
  try { if (navigator.share) await navigator.share({ text: txt }); else { await navigator.clipboard.writeText(txt); toast('Liste kopiert.'); } } catch (e) {} };
$('panSearch').addEventListener('input', render);
$('todoForm').addEventListener('submit', e => { e.preventDefault(); snap(); addTodo({ title: $('tTitle').value.trim(), due: $('tDue').value, remind: $('tRem').value }); $('tTitle').value = ''; $('tDue').value = ''; save(); });

function editName(el, item) {
  if (!item || el.querySelector('input')) return;
  const old = item.name; el.innerHTML = `<input value="${esc(old)}" style="min-height:36px;padding:4px 8px">`; const inp = el.querySelector('input'); inp.focus(); inp.select();
  const done = () => { const nv = cap(inp.value.trim()); if (nv && nv !== old) { snap(); item.name = nv; L().aliases[norm(old)] = nv; toast('Korrigiert – ab jetzt wird „' + old + '“ automatisch zu „' + nv + '“.', true); } save(); };
  inp.addEventListener('blur', done, { once: true }); inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); } });
}

/* ================= Kalender (.ics) ================= */
function icsDate(s, addMin) { const d = new Date(new Date(s).getTime() + (addMin || 0) * 6e4); const p = n => String(n).padStart(2, '0'); return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + 'T' + p(d.getHours()) + p(d.getMinutes()) + '00'; }
const icsEsc = s => String(s).replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n');
function buildICS(list) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const ev = list.filter(t => t && t.due).map(t => ['BEGIN:VEVENT', 'UID:' + t.id + '@haushalt-app', 'DTSTAMP:' + stamp, 'DTSTART:' + icsDate(t.due), 'DTEND:' + icsDate(t.due, 30), 'SUMMARY:' + icsEsc(t.title), 'DESCRIPTION:' + icsEsc('Aus der Haushalt-App'),
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc(t.title), 'TRIGGER:-PT' + (+t.remind || 0) + 'M', 'END:VALARM', 'END:VEVENT'].join('\r\n'));
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Haushalt App//DE', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', ...ev, 'END:VCALENDAR'].join('\r\n');
}
function openICS(list) {
  const blob = new Blob([buildICS(list)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
function gcal(t) { const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Berlin';
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(t.title) + '&dates=' + icsDate(t.due) + '/' + icsDate(t.due, 30) + '&ctz=' + encodeURIComponent(tz) + '&details=' + encodeURIComponent('Aus der Haushalt-App'); }

/* ================= Erinnerungen (solange die App läuft) ================= */
async function notify(title, body) {
  try { if ('Notification' in window && Notification.permission === 'granted') { const reg = await navigator.serviceWorker?.ready; if (reg) { await reg.showNotification(title, { body, icon: 'icon-192.png', tag: title }); return; } new Notification(title, { body }); return; } } catch (e) {}
  toast('⏰ ' + title + (body ? ' – ' + body : ''));
}
function checkReminders() {
  const now = Date.now(); let ch = false;
  S.todos.forEach(t => { if (t.done || !t.due || t.notified) return; const at = new Date(t.due).getTime() - (+t.remind || 0) * 6e4;
    if (now >= at) { t.notified = true; ch = true; if (now - at < 6 * 36e5) notify(t.title, fmtDT(t.due)); } });
  const today = new Date().toISOString().slice(0, 10);
  if (S.expCheck !== today) { const soon = S.pantry.filter(p => { const d = daysUntil(p.exp); return d !== null && d >= 0 && d <= 1; }); S.expCheck = today; ch = true;
    if (soon.length) notify('Bald ablaufend', soon.map(p => p.name).join(', ')); }
  if (ch) save();
}
setInterval(() => { checkReminders(); render(); }, 30000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { checkReminders(); render(); } });

/* ================= Befehle (Sprache/Text) ================= */
let replyTimer;
function showReply(t, list, undo) {
  const r = $('reply'); clearTimeout(replyTimer);
  r.innerHTML = '<div class="rtop"><span>' + esc(t) + '</span>' + (undo ? '<button type="button" id="rUndo">Rückgängig</button>' : '') + '<button type="button" class="rx" id="rClose" aria-label="Schließen">×</button></div>' + (list && list.length ? '<ul>' + list.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '');
  r.classList.add('show');
  if (undo) $('rUndo').onclick = () => { if (undoSnap) { S = JSON.parse(undoSnap); undoSnap = null; save(); } showReply('Rückgängig gemacht.'); };
  $('rClose').onclick = () => r.classList.remove('show');
  if (list || undo) replyTimer = setTimeout(() => r.classList.remove('show'), 9000);
}
function applyActions(acts) {
  const log = []; let rec = null; const created = { todos: [], pantry: [] };
  for (const a of acts) {
    if (a.type === 'add_shopping' && a.name) { addShop(a.name, a.qty); log.push('🛒 ' + cap(a.name) + (a.qty ? ' (' + a.qty + ')' : '')); }
    else if (a.type === 'remove_shopping') { const i = P.fuzzyFind(S.shopping, 'name', a.name); if (i) { if (!i.done) learnBuy(i.name); i.done = true; log.push('✓ ' + i.name); } }
    else if (a.type === 'add_pantry' && a.name) { const c = Object.values(S.catalog).find(x => norm(x.name) === norm(a.name)); const r = addPantry(Object.assign({}, c || {}, { name: cap(a.name), qty: a.qty || (c && c.qty) || '', exp: a.exp || '', loc: a.loc || (c && c.loc) || 'Vorratsschrank' })); if (r === 'new') created.pantry.push(S.pantry[S.pantry.length - 1]); log.push('📦 ' + cap(a.name)); }
    else if (a.type === 'remove_pantry') { const p = P.fuzzyFind(S.pantry, 'name', a.name); if (p) { p.n = (+p.n || 1) - 1; if (p.n <= 0) S.pantry = S.pantry.filter(x => x !== p); log.push('📦− ' + p.name); } }
    else if (a.type === 'add_todo' && a.title) { created.todos.push(addTodo(a)); log.push('📝 ' + cap(a.title) + (a.due ? ' – ' + fmtDT(a.due) : '')); }
    else if (a.type === 'complete_todo') { const t = P.fuzzyFind(S.todos.filter(x => !x.done), 'title', a.title); if (t) { t.done = true; log.push('✓ ' + t.title); } }
    else if (a.type === 'suggest_recipes') rec = a.hint || '';
  }
  return { log, rec, created };
}
async function aiParse(text) {
  const now = new Date(), p = n => String(n).padStart(2, '0');
  const local = now.getFullYear() + '-' + p(now.getMonth() + 1) + '-' + p(now.getDate()) + 'T' + p(now.getHours()) + ':' + p(now.getMinutes());
  return aiJSON(`Du steuerst eine Haushalts-App. Jetzt: ${now.toLocaleDateString('de-DE', { weekday: 'long' })}, ${local} Ortszeit.
Einkaufsliste: ${S.shopping.filter(i => !i.done).map(i => i.name).join(', ') || 'leer'} | Vorrat: ${S.pantry.map(x => x.name).join(', ') || 'leer'} | Offene To-dos: ${S.todos.filter(t => !t.done).map(t => t.title).join(', ') || 'keine'}
Befehl (gesprochen, evtl. ungenau): """${text}"""
Aktionstypen: add_shopping{name,qty} · remove_shopping{name} · add_pantry{name,qty,exp:"YYYY-MM-DD"|"",loc:"Kühlschrank"|"Vorratsschrank"|"Tiefkühler"|""} · remove_pantry{name} (aufgebraucht → zusätzlich add_shopping) · add_todo{title,due:"YYYY-MM-DDTHH:MM"|"",remind:Minuten vorher (Standard 30)} · complete_todo{title} · suggest_recipes{hint}.
Relative Zeiten in absolute Ortszeit umrechnen; Termin ohne Uhrzeit → 09:00. Artikelnamen kurz und großgeschrieben.
Antworte NUR mit JSON: {"actions":[{"type":"…",…}],"reply":"kurzer deutscher Satz"}`, 1200);
}
async function runCommand(text) {
  text = text.trim(); if (!text) return;
  snap(); let acts = null, reply = '', via = '';
  if (AI.key && navigator.onLine) {
    showReply('Verstehe …');
    try { const r = await aiParse(text); acts = r.actions || []; reply = r.reply || ''; via = 'ki'; } catch (e) { acts = null; }
  }
  if (!acts) acts = P.parseCommand(text, S);
  const { log, rec, created } = applyActions(acts);
  save(); $('cmd').value = '';
  if (!log.length && rec === null) { showReply('Das habe ich nicht verstanden. Beispiele: „Milch kaufen“, „Reis ist leer“, „morgen 9 Uhr Arzt anrufen“, „was kann ich kochen?“'); return; }
  showReply(reply || (log.length ? 'Erledigt:' : 'Rezeptideen aus deinem Vorrat:'), log, log.length > 0);
  speak(reply || (log.length ? 'Erledigt: ' + log.join(', ') : ''));
  if (created.todos.length || created.pantry.length) setTimeout(() => followUps(created), 2500);
  try { localStorage.setItem('haushalt-used', '1'); } catch (e) {} $('micHint').hidden = true;
  if (rec !== null) { $('recHint').value = rec; go('rezepte'); localRecipes(); return; }
  const f = acts[0] && acts[0].type; if (/todo/.test(f)) go('todos'); else if (/shopping/.test(f)) go('einkauf'); else if (/pantry/.test(f)) go('vorrat');
}
$('cmdForm').addEventListener('submit', e => { e.preventDefault(); $('cmd').blur(); runCommand($('cmd').value); });
$('cmd').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('cmd').blur(); runCommand($('cmd').value); } });

/* Spracherkennung */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null, listening = false, base = '', finalTxt = '';
$('mic').addEventListener('click', () => {
  if (!SR) { $('micHint').textContent = 'Tipp ins Textfeld und nutze das Mikrofon unten auf der iPhone-Tastatur.'; $('cmd').focus(); return; }
  if (listening) { rec.stop(); return; }
  rec = new SR(); rec.lang = 'de-DE'; rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
  base = $('cmd').value.trim(); finalTxt = '';
  rec.onstart = () => { listening = true; $('micHint').hidden = false; $('mic').classList.add('on'); $('micHint').textContent = 'Ich höre zu … (zum Beenden nochmal tippen)'; };
  rec.onresult = ev => { let interim = ''; for (let i = ev.resultIndex; i < ev.results.length; i++) { const r = ev.results[i]; if (r.isFinal) finalTxt += r[0].transcript + ' '; else interim += r[0].transcript; } $('cmd').value = (base ? base + ' ' : '') + finalTxt + interim; };
  rec.onerror = ev => { $('micHint').textContent = /not-allowed|service-not-allowed/.test(ev.error) ? 'Mikrofon/Spracherkennung nicht erlaubt. Einstellungen → Safari → Mikrofon, oder die Diktiertaste der Tastatur nutzen.' : ev.error === 'no-speech' ? 'Nichts gehört – nochmal versuchen.' : 'Spracherkennung: ' + ev.error; };
  rec.onend = () => { listening = false; $('mic').classList.remove('on'); if ($('micHint').textContent.startsWith('Ich höre')) $('micHint').textContent = 'Mikro antippen und sprechen – oder tippen und OK drücken.'; if (finalTxt.trim() || $('cmd').value.trim() !== base) runCommand($('cmd').value); };
  try { rec.start(); } catch (e) { $('micHint').textContent = 'Spracherkennung konnte nicht starten – nutze die Diktiertaste der Tastatur.'; }
});

/* ================= KI (optional) ================= */
async function aiCall(content, max) {
  const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': AI.key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
    body: JSON.stringify({ model: AI.model || 'claude-haiku-5-5', max_tokens: max || 1500, messages: [{ role: 'user', content }] }) });
  if (!r.ok) { let m = r.status; try { m = (await r.json()).error.message; } catch (e) {} throw new Error(m); }
  const j = await r.json(); return (j.content || []).map(c => c.text || '').join('');
}
async function aiJSON(content, max) { const t = await aiCall(content, max); const a = t.indexOf('{'), b = t.lastIndexOf('}'); return JSON.parse(t.slice(a, b + 1)); }

/* ================= Barcode-Scanner ================= */
let stream = null, scanning = false, track = null;
function zxReader() {
  if (!window.ZXing) return null;
  const Z = window.ZXing, hints = new Map();
  hints.set(Z.DecodeHintType.POSSIBLE_FORMATS, [Z.BarcodeFormat.EAN_13, Z.BarcodeFormat.EAN_8, Z.BarcodeFormat.UPC_A, Z.BarcodeFormat.UPC_E, Z.BarcodeFormat.CODE_128]);
  hints.set(Z.DecodeHintType.TRY_HARDER, true);
  const r = new Z.MultiFormatReader(); r.setHints(hints); return r;
}
function decodeCanvas(reader, c) { try { const Z = window.ZXing; return reader.decode(new Z.BinaryBitmap(new Z.HybridBinarizer(new Z.HTMLCanvasElementLuminanceSource(c)))).getText(); } catch (e) { return ''; } }
$('scanBtn').onclick = async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { $('scanStatus').textContent = 'Kamera nicht verfügbar – nutze „Foto“.'; return; }
  const reader = zxReader(); if (!reader) { $('scanStatus').textContent = 'Scanner nicht geladen.'; return; }
  $('scanner').classList.add('show'); $('scanMsg').textContent = 'Barcode in den Rahmen halten';
  try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false }); }
  catch (e) { closeScanner(); $('scanStatus').textContent = 'Kein Kamerazugriff. Erlaube die Kamera in den iPhone-Einstellungen oder nutze „Foto“.'; return; }
  const v = $('video'); v.srcObject = stream; try { await v.play(); } catch (e) {}
  track = stream.getVideoTracks()[0];
  try { const cps = track.getCapabilities && track.getCapabilities(); $('torch').hidden = !(cps && cps.torch); } catch (e) {}
  scanning = true; const c = document.createElement('canvas'), ctx = c.getContext('2d', { willReadFrequently: true });
  const loop = () => {
    if (!scanning) return;
    if (v.videoWidth) {
      const sw = v.videoWidth * 0.84, sh = v.videoHeight * 0.4, sx = (v.videoWidth - sw) / 2, sy = (v.videoHeight - sh) / 2;
      const scale = Math.min(1, 900 / sw); c.width = sw * scale; c.height = sh * scale; ctx.drawImage(v, sx, sy, sw, sh, 0, 0, c.width, c.height);
      const code = decodeCanvas(reader, c);
      if (code && /^\d{6,14}$/.test(code)) { closeScanner(); try { navigator.vibrate && navigator.vibrate(80); } catch (e) {} handleCode(code); return; }
    }
    setTimeout(loop, 120);
  };
  loop();
};
let torchOn = false;
$('torch').onclick = async () => { torchOn = !torchOn; try { await track.applyConstraints({ advanced: [{ torch: torchOn }] }); } catch (e) {} };
function closeScanner() { scanning = false; $('scanner').classList.remove('show'); if (stream) stream.getTracks().forEach(t => t.stop()); stream = null; }
$('scanClose').onclick = closeScanner;

function loadImg(file) { return new Promise((res, rej) => { const u = URL.createObjectURL(file), im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = u; }); }
function toCanvas(im, max) { const s = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * s); c.height = Math.round(im.naturalHeight * s); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); return c; }
$('scanFile').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  $('scanStatus').textContent = 'Lese Barcode vom Foto …';
  try { const im = await loadImg(f), reader = zxReader(); let code = '';
    for (const m of [1200, 800, 1800]) { code = decodeCanvas(reader, toCanvas(im, m)); if (code) break; }
    if (code) handleCode(code); else { $('scanStatus').textContent = 'Kein Barcode erkannt. Nochmal näher und scharf fotografieren – oder manuell eintragen.'; if (AI.key) { photoBlob = f; openPan({}, 'Kein Barcode erkannt'); readLabel(f); } }
  } catch (err) { $('scanStatus').textContent = 'Foto konnte nicht gelesen werden.'; }
});

/* Produktdaten */
const ALG = { milk: 'Milch', gluten: 'Gluten', eggs: 'Ei', nuts: 'Schalenfrüchte', peanuts: 'Erdnüsse', soybeans: 'Soja', celery: 'Sellerie', mustard: 'Senf', 'sesame-seeds': 'Sesam', fish: 'Fisch', crustaceans: 'Krebstiere', molluscs: 'Weichtiere', lupin: 'Lupinen', 'sulphur-dioxide-and-sulphites': 'Sulfite' };
async function offLookup(code) {
  const fields = 'product_name,product_name_de,generic_name_de,brands,quantity,categories,categories_tags,nutriments,allergens_tags,ingredients_text_de,ingredients_text,nutriscore_grade,image_front_small_url';
  for (const host of ['world.openfoodfacts.org', 'world.openproductsfacts.org', 'world.openbeautyfacts.org']) {
    try {
      const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 8000);
      const r = await fetch(`https://${host}/api/v2/product/${encodeURIComponent(code)}.json?fields=${fields}`, { signal: ctl.signal }); clearTimeout(to);
      if (!r.ok) continue; const j = await r.json(); const p = j.product; if (!p || j.status === 0) continue;
      const name = p.product_name_de || p.product_name || p.generic_name_de; if (!name) continue;
      const n = p.nutriments || {}, f = k => n[k + '_100g'] != null ? Math.round(n[k + '_100g'] * 10) / 10 : null;
      const parts = [];
      if (p.nutriscore_grade && /^[a-e]$/.test(p.nutriscore_grade)) parts.push('Nutri-Score: ' + p.nutriscore_grade.toUpperCase());
      const nut = [[f('energy-kcal'), ' kcal'], [f('fat'), ' g Fett'], [f('saturated-fat'), ' g ges. Fettsäuren'], [f('carbohydrates'), ' g Kohlenhydrate'], [f('sugars'), ' g Zucker'], [f('proteins'), ' g Eiweiß'], [f('salt'), ' g Salz']].filter(x => x[0] != null).map(x => x[0] + x[1]);
      if (nut.length) parts.push('Pro 100 g: ' + nut.join(' · '));
      const al = (p.allergens_tags || []).map(t => ALG[t.replace(/^\w+:/, '')] || t.replace(/^\w+:/, '')); if (al.length) parts.push('Allergene: ' + al.join(', '));
      const ing = p.ingredients_text_de || p.ingredients_text; if (ing) parts.push('Zutaten: ' + ing.slice(0, 600));
      const tags = (p.categories_tags || []).join(' ');
      const loc = /frozen|tiefk/.test(tags) ? 'Tiefkühler' : /dair|milk|yogh|yogurt|chees|meat|fresh|sausag|fish|cream|butter|joghurt|käse|milch|fleisch|wurst/.test(tags) ? 'Kühlschrank' : host.includes('beauty') || host.includes('products') ? 'Sonstiges' : 'Vorratsschrank';
      const cat = (p.categories || '').split(',').map(s => s.trim()).filter(s => s && !/:/.test(s)).slice(-1)[0] || '';
      return { name: cap(name), brand: (p.brands || '').split(',')[0].trim(), qty: p.quantity || '', cat, loc, info: parts.join('\n'), img: p.image_front_small_url || '', src: host.split('.')[1] };
    } catch (e) {}
  }
  return null;
}
async function handleCode(code) {
  const inPan = S.pantry.find(p => p.code === code);
  if (inPan) { snap(); inPan.n = (+inPan.n || 1) + 1; save(); $('scanStatus').textContent = inPan.name + ' war schon im Vorrat – jetzt ' + inPan.n + ' Stück.'; toast(inPan.name + ': Anzahl +1', true); openPan(inPan, 'Bekanntes Produkt – Anzahl erhöht. Haltbarkeit anpassen?'); return; }
  const known = S.catalog[code];
  if (known) { openPan(Object.assign({}, known, { code, n: 1, exp: '' }), 'Bekanntes Produkt (offline erkannt)'); $('scanStatus').textContent = 'Barcode ' + code + ' erkannt.'; return; }
  openPan({ code, n: 1 }, navigator.onLine ? 'Suche Produktinfos …' : 'Offline – Produktdaten bitte eintragen, Infos später nachladen.');
  $('scanStatus').textContent = 'Barcode ' + code + ' erkannt.';
  if (navigator.onLine) await fillFromOFF(code);
}
async function fillFromOFF(code) {
  $('pSrc').textContent = 'Suche Produktinfos …'; $('pImgRow').hidden = false; $('pImg').hidden = true;
  const info = await offLookup(code);
  if ($('pCode').value !== code) return;
  if (info) { fillForm(info, true); $('pSrc').textContent = 'Daten von Open ' + ({ openfoodfacts: 'Food', openproductsfacts: 'Products', openbeautyfacts: 'Beauty' }[info.src] || 'Food') + ' Facts – bitte Haltbarkeit ergänzen.'; if (info.img) { $('pImg').src = info.img; $('pImg').hidden = false; } }
  else { $('pSrc').textContent = 'Produkt nicht in der Datenbank. ' + (AI.key ? 'Tipp: „Verpackung per KI lesen“.' : 'Bitte Name eintragen – beim nächsten Scan wird es wiedererkannt.'); }
}

/* Vorrats-Formular */
const F = { name: 'pName', brand: 'pBrand', qty: 'pQty', n: 'pN', exp: 'pExp', loc: 'pLoc', cat: 'pCat', code: 'pCode', info: 'pInfo' };
let editId = null, curImg = '', photoBlob = null;
function fillForm(p, onlyEmpty) { Object.entries(F).forEach(([k, id]) => { if (p[k] == null || p[k] === '') return; if (onlyEmpty && $(id).value && k !== 'loc' && k !== 'info') return; $(id).value = p[k]; }); if (p.img) curImg = p.img; }
function openPan(p, msg) {
  p = p || {}; editId = p.id || null; curImg = p.img || '';
  Object.entries(F).forEach(([k, id]) => { $(id).value = p[k] != null ? p[k] : (k === 'loc' ? 'Vorratsschrank' : k === 'n' ? 1 : ''); });
  $('panTitle').textContent = editId ? 'Produkt bearbeiten' : 'Neues Produkt';
  $('pSrc').textContent = msg || ''; $('pImgRow').hidden = !msg && !curImg; $('pImg').hidden = !curImg; if (curImg) $('pImg').src = curImg;
  $('pLookup').hidden = !(p.code && navigator.onLine); $('pPhoto').hidden = !AI.key;
  $('panModal').classList.add('show');
}
function closePan() { $('panModal').classList.remove('show'); editId = null; }
$('manualAdd').onclick = () => openPan({});
$('pCancel').onclick = closePan;
$('panModal').addEventListener('click', e => { if (e.target === $('panModal')) closePan(); });
$('pLookup').onclick = () => { const c = $('pCode').value.trim(); if (c) fillFromOFF(c); };
$('pCode').addEventListener('change', () => { $('pLookup').hidden = !($('pCode').value.trim() && navigator.onLine); });
$('panForm').addEventListener('submit', e => {
  e.preventDefault(); snap();
  const p = {}; Object.entries(F).forEach(([k, id]) => p[k] = String($(id).value).trim()); p.n = Math.max(1, parseInt(p.n) || 1); p.name = cap(p.name); p.img = curImg;
  rememberProduct(p);
  if (editId) { const x = S.pantry.find(q => q.id === editId); if (x) Object.assign(x, p); toast(p.name + ' gespeichert.'); }
  else { const r = addPantry(p); toast(r === 'more' ? p.name + ' war schon da – Anzahl erhöht.' : p.name + ' ist jetzt im Vorrat.', true); }
  const sh = P.fuzzyFind(S.shopping.filter(i => !i.done), 'name', p.name); if (sh && !editId) sh.done = true;
  closePan(); save(); $('scanStatus').textContent = 'Gespeichert. Nächstes Produkt scannen?';
});
$('pPhoto').onclick = () => $('pPhotoFile').click();
$('pPhotoFile').addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; if (f) readLabel(f); });
async function readLabel(file) {
  if (!AI.key) return; $('pSrc').textContent = 'KI liest die Verpackung …'; $('pImgRow').hidden = false;
  try {
    const c = toCanvas(await loadImg(file), 1280), b64 = c.toDataURL('image/jpeg', 0.82).split(',')[1];
    const code = $('pCode').value.trim();
    const r = await aiJSON([{ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: b64 } }, { type: 'text', text: `Lies von diesem Produktfoto ab, was sichtbar ist.${code ? ' Barcode: ' + code + '.' : ''} Antworte NUR mit JSON: {"name":"kurzer deutscher Produktname","brand":"","qty":"Packungsgröße","cat":"Kategorie","exp":"MHD als YYYY-MM-DD oder leer","code":"EAN-Ziffern falls lesbar","loc":"Kühlschrank|Vorratsschrank|Tiefkühler|Sonstiges","info":"Nährwerte pro 100 g, Allergene, Zutaten kompakt – nur Sichtbares"}. Nichts erfinden, Unbekanntes leer lassen.` }], 900);
    fillForm(r, false); $('pSrc').textContent = 'Von der KI gelesen – bitte prüfen.';
  } catch (e) { $('pSrc').textContent = 'KI-Auslesen fehlgeschlagen: ' + e.message; }
}

/* ================= Rezepte ================= */
let curRecipes = [];
function pantryForRecipes() { return S.pantry.map(p => { const d = daysUntil(p.exp); return { name: p.name, soon: d !== null && d <= 3 }; }); }
function renderRecipes(list, note) {
  curRecipes = list;
  $('recList').innerHTML = list.map((r, i) => `<article class="rc"><h3>${esc(r.title)}</h3><div>${r.time ? `<span class="tag">${esc(r.time)}</span>` : ''}${r.vegan ? '<span class="tag vegan">vegan</span>' : r.veg ? '<span class="tag">vegetarisch</span>' : ''}${r.liked ? '<span class="tag">❤ mag ich</span>' : ''}${r.soon ? '<span class="tag warn">nutzt Bald-Ablaufendes</span>' : ''}${r.ai ? '<span class="tag">KI</span>' : ''}</div>
    <div class="meta"><strong>Hast du:</strong> ${esc((r.uses || []).join(', ') || '–')}</div>
    ${(r.missing || []).length ? `<div class="miss"><strong>Fehlt:</strong> ${esc(r.missing.join(', '))}</div><button class="btn2" data-a="recShop" data-i="${i}">Fehlendes auf die Liste</button>` : '<div><span class="tag">alles da 👍</span></div>'}
    <details><summary>Zubereitung</summary><ol>${(r.steps || []).map(s => `<li>${esc(s)}</li>`).join('')}</ol></details>
    <div class="row"><button class="btn2 mini2" data-a="recCooked" data-i="${i}">👍 Gekocht</button><button class="btn2 mini2" data-a="recNo" data-i="${i}">👎 Nicht mein Fall</button></div></article>`).join('');
  $('recStatus').textContent = note || '';
}
function localRecipes() {
  try { syncChips(); } catch (e) {}
  const list = window.HRecipes.suggest(pantryForRecipes(), $('recHint').value, 8, { recipe: L().recipe, tags: L().tags });
  renderRecipes(list, !S.pantry.length ? 'Dein Vorrat ist noch leer – hier ein paar Ideen. Trage Vorräte ein für passende Vorschläge.' : list.length ? '' : 'Keine passenden Rezepte gefunden – probiere andere Wünsche.');
  if (!S.pantry.length && !list.length) renderRecipes(window.HRecipes.recipes.slice(0, 6).map(r => ({ title: r.title, time: r.time + ' Min.', veg: r.veg, uses: [], missing: r.ing.map(a => a[0]), steps: r.steps })), 'Dein Vorrat ist noch leer – hier ein paar Ideen.');
}
$('recForm').addEventListener('submit', e => { e.preventDefault(); localRecipes(); });
function syncChips() { const v = norm($('recHint').value); document.querySelectorAll('#recChips [data-h]').forEach(b => b.classList.toggle('on', v.split(' ').includes(norm(b.dataset.h)))); }
$('recChips').addEventListener('click', e => { const b = e.target.closest('[data-h]'); if (!b) return; let w = $('recHint').value.split(/\s+/).filter(Boolean); const k = b.dataset.h;
  w = w.some(x => norm(x) === norm(k)) ? w.filter(x => norm(x) !== norm(k)) : [...w, k]; if (k === 'vegan') w = w.filter(x => norm(x) !== 'vegetarisch'); if (k === 'vegetarisch') w = w.filter(x => norm(x) !== 'vegan');
  $('recHint').value = w.join(' '); syncChips(); localRecipes(); });
$('recHint').addEventListener('input', syncChips);
$('aiRec').onclick = async () => {
  if (!navigator.onLine) { $('recStatus').textContent = 'Für KI-Ideen brauchst du Internet.'; return; }
  $('recStatus').textContent = 'KI denkt sich Rezepte aus …'; $('aiRec').disabled = true;
  const pan = S.pantry.map(p => { const d = daysUntil(p.exp); return p.name + (d !== null && d <= 3 ? ' [läuft bald ab]' : ''); }).join('; ') || 'leer';
  try { const r = await aiJSON(`Vorrat: ${pan}. Wünsche: ${$('recHint').value || 'keine'}. Salz, Pfeffer, Öl, Zucker vorhanden. Schlage 4 alltagstaugliche Rezepte vor, die möglichst viel aus dem Vorrat nutzen und bald Ablaufendes bevorzugen. Antworte NUR mit JSON: {"recipes":[{"title":"","time":"25 Min.","veg":true,"vegan":false,"uses":["aus dem Vorrat"],"missing":["fehlende Zutat mit Menge"],"steps":["kurze Schritte"]}]}`, 2500);
    renderRecipes((r.recipes || []).map(x => Object.assign(x, { ai: true })));
  } catch (e) { $('recStatus').textContent = 'KI-Fehler: ' + e.message; }
  $('aiRec').disabled = false;
};

/* ================= Einstellungen ================= */
function renderSettings() {
  $('setAsk').checked = S.settings.ask; $('setSpeak').checked = S.settings.speak; $('setSuggest').checked = S.settings.suggest;
  const rh = Object.values(L().buys).filter(b => rhythm(b)).length, liked = Object.values(L().recipe).filter(v => v > 0).length, disl = Object.values(L().recipe).filter(v => v < 0).length;
  const tg = L().tags, pref = (tg.vegan || 0) > 1 ? 'vegan' : (tg.veg || 0) > (tg.meat || 0) + 1 ? 'vegetarisch' : (tg.meat || 0) > (tg.veg || 0) + 1 ? 'mit Fleisch' : 'noch offen';
  $('learnInfo').innerHTML = `Gelernt bisher: <b>${rh}</b> Kaufrhythmen · <b>${Object.keys(L().order).length}</b> Artikel in Laden-Reihenfolge · <b>${Object.keys(L().aliases).length}</b> Korrekturen · <b>${liked}</b> Lieblingsrezepte, <b>${disl}</b> abgelehnt · Essensvorliebe: ${pref}`;
  $('apiKey').value = AI.key ? '••••••••' + AI.key.slice(-4) : ''; $('apiModel').value = AI.model;
  $('keyState').textContent = AI.key ? 'aktiv' : 'aus';
  const perm = 'Notification' in window ? Notification.permission : 'nicht verfügbar';
  $('notifState').textContent = { granted: 'erlaubt', denied: 'abgelehnt (in iPhone-Einstellungen ändern)', default: '', 'nicht verfügbar': 'erst nach „Zum Home-Bildschirm“ verfügbar' }[perm] ?? perm;
  let bytes = 0; try { bytes = (localStorage.getItem(KEY) || '').length; } catch (e) {}
  $('storeInfo').textContent = `${S.shopping.length} Einkaufsartikel · ${S.pantry.length} Vorratsprodukte · ${S.todos.length} To-dos · ${Object.keys(S.catalog).length} bekannte Barcodes · ${(bytes / 1024).toFixed(1)} KB`;
}
$('notifBtn').onclick = async () => { if (!('Notification' in window)) { toast('Mitteilungen gehen erst, wenn die App auf dem Home-Bildschirm liegt.'); return; } try { await Notification.requestPermission(); } catch (e) {} renderSettings(); if (Notification.permission === 'granted') notify('Mitteilungen aktiv', 'So sehen Erinnerungen aus.'); };
$('saveKey').onclick = () => { const k = $('apiKey').value.trim(); if (!k.startsWith('••')) AI.key = k; AI.model = $('apiModel').value.trim() || 'claude-haiku-5-5'; try { localStorage.setItem(KKEY, JSON.stringify(AI)); } catch (e) {} applyAIui(); renderSettings(); toast(AI.key ? 'KI-Zusatz gespeichert.' : 'KI-Zusatz ausgeschaltet.'); };
$('testKey').onclick = async () => { $('keyState').textContent = 'teste …'; try { const t = await aiCall('Antworte nur mit: OK', 10); $('keyState').textContent = t.includes('OK') ? 'funktioniert ✓' : 'Antwort: ' + t; } catch (e) { $('keyState').textContent = 'Fehler: ' + e.message; } };
function applyAIui() { $('aiRec').hidden = !AI.key; }
$('exportBtn').onclick = async () => {
  const data = JSON.stringify(Object.assign({ app: 'haushalt', version: 2, exported: new Date().toISOString() }, S), null, 1);
  const name = 'haushalt-sicherung-' + new Date().toISOString().slice(0, 10) + '.json';
  try { const file = new File([data], name, { type: 'application/json' }); if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Haushalt-Sicherung' }); return; } } catch (e) { if (e.name === 'AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' })); a.download = name; a.click();
};
$('importFile').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try { const d = JSON.parse(await f.text()); if (!d || !Array.isArray(d.pantry)) throw 0; snap(); S = { shopping: d.shopping || [], pantry: d.pantry || [], todos: d.todos || [], catalog: d.catalog || {}, recipes: [], learn: Object.assign(LDEF(), d.learn || {}), settings: Object.assign({ ask: true, speak: false, suggest: true }, d.settings || {}) }; save(); renderSettings(); toast('Sicherung geladen.', true); }
  catch (err) { toast('Das ist keine gültige Haushalt-Sicherung.'); }
});
$('wipe').onclick = () => { if ($('wipe').dataset.sure) { snap(); S = { shopping: [], pantry: [], todos: [], catalog: {}, recipes: [], learn: LDEF(), settings: S.settings }; save(); renderSettings(); toast('Alle Daten gelöscht.', true); delete $('wipe').dataset.sure; $('wipe').textContent = 'Alle Daten löschen'; } else { $('wipe').dataset.sure = 1; $('wipe').textContent = 'Wirklich alles löschen? Nochmal tippen'; setTimeout(() => { delete $('wipe').dataset.sure; $('wipe').textContent = 'Alle Daten löschen'; }, 4000); } };

['setAsk', 'setSpeak', 'setSuggest'].forEach(id => $(id).addEventListener('change', () => { S.settings.ask = $('setAsk').checked; S.settings.speak = $('setSpeak').checked; S.settings.suggest = $('setSuggest').checked; save(); if (id === 'setSpeak' && S.settings.speak) speak('Okay, ich lese meine Antworten ab jetzt vor.'); }));
$('learnReset').onclick = () => { snap(); S.learn = LDEF(); save(); renderSettings(); toast('Gelerntes zurückgesetzt.', true); };

/* ================= Start ================= */
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
applyAIui(); render(); route(); checkReminders();
try { if (localStorage.getItem('haushalt-used')) $('micHint').hidden = true; } catch (e) {}
})();
