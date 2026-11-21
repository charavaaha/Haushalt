/* Lokaler Sprachbefehl-Parser (Deutsch) – funktioniert komplett offline. */
(function (root) {
  'use strict';
  const NUMW = { ein: 1, eine: 1, einen: 1, einem: 1, zwei: 2, drei: 3, vier: 4, 'fünf': 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10, elf: 11, 'zwölf': 12, paar: 2, 'halbe': 0.5, 'halben': 0.5 };
  const UNITS = 'kg|g|gramm|kilo|l|liter|ml|stück|stk|packungen|packung|pck|dosen|dose|flaschen|flasche|becher|gläser|glas|bund|beutel|tüten|tüte|netz|kisten|kiste|tafeln|tafel|scheiben|scheibe|rollen|rolle|sack|tuben|tube|schalen|schale|laib|kopf|köpfe';
  const WD = ['sonntag', 'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag'];
  const pad = n => String(n).padStart(2, '0');
  const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  const norm = s => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const cap = s => { s = String(s || '').trim(); return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; };
  const num = w => /^\d+([.,]\d+)?$/.test(w) ? parseFloat(w.replace(',', '.')) : (NUMW[w] ?? null);

  /* ---------- Datum & Uhrzeit ---------- */
  function parseWhen(text, now) {
    now = now ? new Date(now) : new Date();
    let s = ' ' + text + ' ';
    const low = () => s.toLowerCase();
    let d = new Date(now); d.setSeconds(0, 0);
    let dateSet = false, timeSet = false, h = null, m = 0, rel = false, remind = null;
    const cut = re => { const mm = low().match(re); if (mm) { s = s.slice(0, mm.index) + ' ' + s.slice(mm.index + mm[0].length); } return mm; };

    let mm;
    // "30 Minuten vorher" / "eine Stunde vorher" -> Erinnerung
    if ((mm = cut(/\b(\d+|eine|einer|zwei|drei)\s*(minuten|minute|min|stunden|stunde|std|tage|tag)\s+(vorher|davor|früher)\b/))) {
      const n = num(mm[1]) || 1; remind = /stund|std/.test(mm[2]) ? n * 60 : /tag/.test(mm[2]) ? n * 1440 : n;
    }
    // relativ: "in 2 Stunden", "in einer Woche"
    if ((mm = cut(/\bin\s+(\d+|einer|einem|zwei|drei|vier|fünf|zehn|paar)\s*(minuten|minute|min|stunden|stunde|std|tagen|tag|wochen|woche)\b/))) {
      const n = mm[1] === 'paar' ? 2 : (num(mm[1]) || 1), u = mm[2];
      if (/^min/.test(u)) d = new Date(now.getTime() + n * 6e4);
      else if (/stund|std/.test(u)) d = new Date(now.getTime() + n * 36e5);
      else if (/tag/.test(u)) { d.setDate(d.getDate() + n); dateSet = true; }
      else { d.setDate(d.getDate() + 7 * n); dateSet = true; }
      if (/min|stund|std/.test(u)) { d.setSeconds(0, 0); rel = true; dateSet = timeSet = true; }
    }
    // Datum: 24.12. / 24.12.2026
    if (!rel && (mm = cut(/\b(?:am\s+)?(\d{1,2})\.\s?(\d{1,2})\.?(\d{2,4})?(?!\d)/))) {
      let y = mm[3] ? (+mm[3] < 100 ? 2000 + (+mm[3]) : +mm[3]) : now.getFullYear();
      d = new Date(y, +mm[2] - 1, +mm[1], 9, 0);
      if (!mm[3] && d < new Date(now.getFullYear(), now.getMonth(), now.getDate())) d.setFullYear(y + 1);
      dateSet = true;
    }
    if (!rel && !dateSet) {
      if ((mm = cut(/\bübermorgen\b/))) { d.setDate(d.getDate() + 2); dateSet = true; }
      else if ((mm = cut(/\bmorgen(?!s)\b/))) { d.setDate(d.getDate() + 1); dateSet = true; }
      else if ((mm = cut(/\b(heute|gleich|jetzt)\b/))) { dateSet = true; if (mm[1] !== 'heute') { rel = true; timeSet = true; d = new Date(now.getTime() + 5 * 6e4); } }
      else if ((mm = cut(new RegExp('\\b(?:(nächste[nm]?|kommende[nm]?|diese[nm]?)\\s+)?(?:am\\s+)?(' + WD.join('|') + ')s?\\b')))) {
        const target = WD.indexOf(mm[2]); let diff = (target - now.getDay() + 7) % 7;
        if (diff === 0) diff = 7; if (/nächst|kommend/.test(mm[1] || '') && diff < 2) diff += 7;
        d.setDate(d.getDate() + diff); dateSet = true;
      }
      else if ((mm = cut(/\b(nächste|kommende)\s+woche\b/))) { d.setDate(d.getDate() + ((8 - now.getDay()) % 7 || 7)); dateSet = true; }
    }
    // Tageszeit
    let part = null;
    if ((mm = cut(/\b(früh|morgens|vormittags|mittags|nachmittags|abends|nachts|am morgen|am abend|am nachmittag|am mittag)\b/))) part = mm[1].replace('am ', '');
    // Uhrzeit
    if (!rel) {
      if ((mm = cut(/\bhalb\s+(\d{1,2})\b(?:\s*uhr)?/))) { h = +mm[1] - 1; m = 30; timeSet = true; }
      else if ((mm = cut(/\bviertel\s+nach\s+(\d{1,2})\b(?:\s*uhr)?/))) { h = +mm[1]; m = 15; timeSet = true; }
      else if ((mm = cut(/\bviertel\s+vor\s+(\d{1,2})\b(?:\s*uhr)?/))) { h = +mm[1] - 1; m = 45; timeSet = true; }
      else if ((mm = cut(/\b(?:um|gegen|ab)\s+(\d{1,2})(?:[:.](\d{2}))?\s*(?:uhr)?\b/)) || (mm = cut(/\b(\d{1,2})(?:[:.](\d{2}))?\s*uhr\b/))) { h = +mm[1]; m = mm[2] ? +mm[2] : 0; timeSet = true; }
      if (timeSet) {
        if (h < 12 && /nachmittag|abend|nacht/.test(part || '')) h += 12;
        else if (h >= 1 && h <= 6 && !/früh|morgen|vormittag/.test(part || '')) h += 12;
        d.setHours(h % 24, m, 0, 0);
      } else if (part) {
        const ph = { 'früh': 8, morgens: 8, morgen: 8, vormittags: 10, mittags: 12, mittag: 12, nachmittags: 15, nachmittag: 15, abends: 19, abend: 19, nachts: 22 }[part] ?? 9;
        d.setHours(ph, 0, 0, 0); timeSet = true;
      }
    }
    if (!timeSet && dateSet) d.setHours(9, 0, 0, 0);
    if (timeSet && !dateSet && !rel && d < now) d.setDate(d.getDate() + 1);
    const found = dateSet || timeSet;
    return { due: found ? iso(d) : '', rest: s.replace(/\s+/g, ' ').trim(), remind, allDay: dateSet && !timeSet };
  }

  /* ---------- Artikel ---------- */
  function parseItem(raw) {
    let s = String(raw).trim().replace(/^(?:noch|etwas|ein bisschen|ein wenig|bitte|auch|mal)\s+/i, '').replace(/[.!?]+$/, '').trim();
    let qty = '', name = s;
    const re = new RegExp('^(\\d+(?:[.,]\\d+)?|' + Object.keys(NUMW).join('|') + ')\\s*(' + UNITS + ')?\\.?\\s+(.+)$', 'i');
    const mm = s.match(re);
    if (mm) {
      const n = num(mm[1].toLowerCase()); name = mm[3];
      if (mm[2]) qty = (n === 0.5 ? '½' : n) + ' ' + mm[2];
      else if (n !== 1) qty = String(n === 0.5 ? '½' : n);
    }
    name = name.replace(/^(der|die|das|den|dem|des)\s+/i, '').replace(/\s+(noch|auch|bitte|mit)$/i, '').trim();
    return { name: cap(name), qty };
  }
  const splitItems = s => s.split(/\s*(?:,|;|\bund\b|\bsowie\b|\bplus\b|&|\+)\s*/i).map(x => x.trim()).filter(x => x && x.length > 1 && !/^(noch|auch|bitte|dann)$/i.test(x));

  const SHOP_FILL = /\b(setz(e|t)?|schreib(e|t)?|pack(e|t)?|füg(e|t)?|trag(e|t)?|nimm|notier(e|t)?)\b|\b(auf|zur|zu der|in die|auf den)\s+(die\s+)?(einkaufsliste|einkaufszettel|liste|einkauf)\b|\b(ich|wir)\s+(brauche[n]?|muss|müssen|sollte[n]?)\b|\bbrauche[n]?\b|\b(ein)?kaufen\b|\bbesorgen\b|\bhinzu\b|\bmir\b|\bbitte\b|\bnoch\b|\bwieder\b/gi;
  const PAN_FILL = /\b(in den|im|zum|zu den|in die)\s+(vorrat|vorratsliste|vorräte[n]?|kühlschrank|tiefkühler|gefrierschrank|schrank|keller)\b|\b(ich habe|ich hab|wir haben|habe|hab|haben)\b|\b(noch|da|vorrätig|gekauft|eingekauft|besorgt|eingelagert|gelagert|leg(e|t)?|stell(e|t)?|tu(e)?|sind|ist|jetzt|bitte|heute)\b/gi;
  const EMPTY_RE = /\b(ist|sind)\s+(leer|alle|aus|weg|aufgebraucht)\b|\b(aufgebraucht|verbraucht|ausgegangen|geht zur neige|gehen zur neige|ist fast leer|sind fast leer)\b|\bkein(e|en)?\b.*\bmehr\b/i;

  const TODO_VERB = /\b(machen|erledigen|anrufen|anzurufen|abholen|bezahlen|überweisen|kündigen|buchen|reservieren|vereinbaren|putzen|aufräumen|waschen|aufhängen|staubsaugen|gießen|schreiben|schicken|zurückgeben|reparieren|wegbringen|rausbringen|einpacken|vorbereiten)\b/i;
  function itemOrTodo(x, actions, now, make) {
    if (TODO_VERB.test(x)) { const w = parseWhen(x, now); actions.push({ type: 'add_todo', title: cap(w.rest), due: w.due, remind: w.remind ?? (w.allDay ? 0 : 30) }); return; }
    make(x);
  }
  function locFrom(t) { t = t.toLowerCase(); return /tiefkühl|gefrier/.test(t) ? 'Tiefkühler' : /kühlschrank/.test(t) ? 'Kühlschrank' : /keller/.test(t) ? 'Keller' : ''; }

  function splitClauses(text) {
    const parts = String(text).replace(/\s+/g, ' ').split(/(?<!\d)\.+(?!\d)|[!?;\n]+|\s+(?:und dann|danach|außerdem|ausserdem|und noch was|zusätzlich)\s+/i);
    const out = [];
    const joiner = /\s+und\s+(?=(?:morgen|übermorgen|heute|am\s|um\s|nächst|kommend|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|erinner|in\s+\d|was\s|ich\s|wir\s|setz|schreib|der\s+\w+\s+ist|die\s+\w+\s+sind|kein))/i;
    parts.forEach(p => p.split(joiner).forEach(x => { x = x.trim().replace(/^(und|aber|also|ok|okay)\s+/i, ''); if (x) out.push(x); }));
    return out;
  }

  function fuzzyFind(list, key, name) {
    const n = norm(name); if (!n) return null;
    return list.find(x => norm(x[key]) === n) || list.find(x => { const v = norm(x[key]); return v.length > 2 && (v.includes(n) || n.includes(v)); }) || null;
  }

  /* ---------- Befehl → Aktionen ---------- */
  function parseCommand(text, state, now) {
    state = state || { shopping: [], pantry: [], todos: [] };
    const actions = [];
    for (const c of splitClauses(text)) {
      const l = c.toLowerCase();
      if (/\b(rezept|rezepte|kochen|koche|kochst|essen|abendessen|mittagessen|frühstück|gericht|hunger)\b/.test(l) && /\b(was|welche|idee|ideen|vorschlag|vorschläge|rezept|rezepte|empfiehl|empfehl)\b/.test(l)) {
        const hint = (l.match(/\b(vegetar\w*|vegan\w*|pflanzlich\w*|schnell\w*|ohne fleisch|nudel\w*|pasta|reis|kartoffel\w*|suppe|salat|hähnchen|fisch|eier)\b/g) || []).join(' ');
        actions.push({ type: 'suggest_recipes', hint }); continue;
      }
      if (/\b(erledigt|abhaken|abgehakt|geschafft|gemacht)\b/.test(l)) {
        const rest = l.replace(/\b(ist|sind|habe|hab|ich|erledigt|abhaken|abgehakt|geschafft|gemacht|schon|bitte|das|die|den)\b/g, ' ').trim();
        const t = fuzzyFind(state.todos.filter(x => !x.done), 'title', rest);
        if (t) { actions.push({ type: 'complete_todo', title: t.title }); continue; }
        const sh = splitItems(rest).map(x => fuzzyFind(state.shopping, 'name', x)).filter(Boolean);
        if (sh.length) { sh.forEach(i => actions.push({ type: 'remove_shopping', name: i.name })); continue; }
      }
      const kein = c.match(/^\s*(?:wir haben\s+|ich habe\s+|es gibt\s+)?kein(?:e|en)?\s+(.+?)\s+mehr\b/i);
      if (kein) { splitItems(kein[1]).forEach(x => { const it = parseItem(x); if (it.name) { actions.push({ type: 'remove_pantry', name: it.name }); actions.push({ type: 'add_shopping', name: it.name, qty: '' }); } }); continue; }
      if (EMPTY_RE.test(l)) {
        const rest = c.replace(EMPTY_RE, ' ').replace(/\b(der|die|das|ist|sind|fast|kein|keine|keinen|mehr|wir|haben|ich|habe|hab|da|bitte)\b/gi, ' ');
        splitItems(rest).forEach(x => { const it = parseItem(x); if (it.name) { actions.push({ type: 'remove_pantry', name: it.name }); actions.push({ type: 'add_shopping', name: it.name, qty: '' }); } });
        continue;
      }
      if (/\b(gekauft|eingekauft|besorgt|mitgebracht)\b/.test(l) && !/\b(vorrat|kühlschrank)\b/.test(l)) {
        const rest = c.replace(PAN_FILL, ' ');
        splitItems(rest).forEach(x => { const it = parseItem(x); if (!it.name) return; const on = fuzzyFind(state.shopping, 'name', it.name); if (on) actions.push({ type: 'remove_shopping', name: on.name }); actions.push({ type: 'add_pantry', name: on ? on.name : it.name, qty: it.qty || (on && on.qty) || '', loc: '' }); });
        continue;
      }
      const isShop = /\b(einkaufsliste|einkaufszettel|auf die liste|zur liste|kaufen|einkaufen|besorgen|brauche|brauchen)\b/.test(l) && !/\berinner/.test(l);
      if (!isShop && /\b(vorrat|vorratsliste|vorräte|kühlschrank|tiefkühler|gefrierschrank|eingelagert|haben wir noch|hab ich noch|habe ich noch|habe noch|haben noch)\b/.test(l)) {
        const loc = locFrom(l); const rest = c.replace(PAN_FILL, ' ');
        splitItems(rest).forEach(x => itemOrTodo(x, actions, now, y => { const it = parseItem(y); if (it.name) actions.push({ type: 'add_pantry', name: it.name, qty: it.qty, loc }); }));
        continue;
      }
      const w = parseWhen(c, now);
      const todoWords = /\b(erinner\w*|termin|to-?do|aufgabe|nicht vergessen|denk dran|denke daran|muss ich|ich muss|anrufen|anzurufen|abholen|bezahlen|zahlen|überweisen|schicken|schreiben|kündigen|buchen|reservieren|vereinbaren|zahnarzt|arzt|friseur|müll|wäsche|putzen|staubsaugen|gießen|treffen|meeting|geburtstag)\b/;
      if (!isShop && (w.due || todoWords.test(l))) {
        let title = w.rest.replace(/\b(erinnere?|erinner)\s+(mich|uns)\s*(bitte\s*)?(daran|an)?\s*,?\s*(dass|daß)?\s*(ich|wir)?\b/gi, ' ')
          .replace(/\b(to-?do|aufgabe|termin|notiz)\s*:?\s*/gi, ' ').replace(/\b(erinnern|erinnere|erinner|erinnerung)\b/gi, ' ').replace(/\b(ich muss|muss ich|wir müssen|nicht vergessen|denk dran|denke daran|bitte|noch)\b/gi, ' ')
          .replace(/\b(dass|daß)\s+(ich|wir)\b/gi, ' ').replace(/^\s*(zu|an|am|um|mich|,)\s+/i, '').replace(/\s*,\s*/g, ' ').replace(/\s+(muss|müssen|soll|sollte)\s*$/i, '').replace(/\s+/g, ' ').trim();
        title = title.replace(/\bzu\s+(\w+)$/i, '$1').replace(/^(\w+)\s+(an|ab)zu(\w+)$/i, '$1 $2$3');
        if (title) actions.push({ type: 'add_todo', title: cap(title), due: w.due, remind: w.remind ?? (w.allDay ? 0 : 30) });
        continue;
      }
      const rest = c.replace(SHOP_FILL, ' ').replace(/\s+/g, ' ');
      splitItems(rest).forEach(x => itemOrTodo(x, actions, now, y => { const it = parseItem(y); if (it.name && it.name.length > 1) actions.push({ type: 'add_shopping', name: it.name, qty: it.qty }); }));
    }
    return actions;
  }

  root.HParser = { parseCommand, parseWhen, parseItem, splitClauses, fuzzyFind, norm, cap };
})(typeof window !== 'undefined' ? window : globalThis);
