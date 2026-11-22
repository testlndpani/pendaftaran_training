/* =====================================================================
   Kalender Internal & External: tampilan baru
   Dimuat SETELAH index-core.js dan calendar-fit-pdf.js.
   Tidak mengubah logika data. Script ini membungkus fungsi render bulanan
   yang sudah ada, lalu merapikan DOM hasilnya.
   ===================================================================== */
(function () {
  'use strict';

  /* Ubah di sini bila ingin tampilan awal berbeda: 'detail' (halaman menggulir) atau 'compact' (pas satu layar) */
  var DEFAULT_DENSITY = 'detail';
  var DEFAULT_PAST = '0.5';
  var DETAIL_LIMIT = 3;            /* jumlah kartu per hari sebelum "+N lagi" pada mode Detail */

  var KEY_DENSITY = 'cr_cal_density';
  var KEY_PAST = 'cr_cal_past';
  var DENSITIES = ['compact', 'detail'];
  var PASTS = ['0.3', '0.5', '0.75', '1'];

  /* Warna legenda mengikuti colorFor() di index-core.js. Jika pemetaan warna di sana berubah, ubah juga di sini. */
  var KINDS = {
    internal: {
      panel: 'view-month', grid: 'month-calendar-grid', box: '.day-events-container', count: 'calendar-session-count',
      unit: 'Sesi',
      legend: [['#9D7828', 'K3 / HSE'], ['#4E45D5', 'IT'], ['#047857', 'Sertifikasi / Audit'], ['#004870', 'Keuangan'], ['#0037B0', 'Umum'], ['req', 'Request (REQ)'], ['past', 'Sesi lampau']]
    },
    external: {
      panel: 'ext-view-month', grid: 'ext-month-calendar-grid', box: '.ext-day-events', count: 'ext-calendar-session-count',
      unit: 'Agenda',
      legend: [['#047857', 'Training external'], ['#0D9488', 'Agenda / event'], ['past', 'Sesi lampau']]
    }
  };

  var state = { density: DEFAULT_DENSITY, past: DEFAULT_PAST };
  /* Di layar HP kolom terlalu sempit untuk kartu lengkap, jadi selalu pakai mode Ringkas (pas satu layar). */
  var narrow = window.matchMedia ? window.matchMedia('(max-width: 639px)') : { matches: false };
  function effDensity() { return narrow.matches ? 'compact' : state.density; }

  function byId(id) { return document.getElementById(id); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function lsGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* abaikan */ } }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function chipsOf(box) {
    return Array.prototype.filter.call(box.children, function (c) {
      return !c.classList.contains('cal-more') && !c.classList.contains('cr-more');
    });
  }

  (function loadState() {
    var d = lsGet(KEY_DENSITY), p = lsGet(KEY_PAST);
    if (DENSITIES.indexOf(d) > -1) state.density = d;
    if (PASTS.indexOf(p) > -1) state.past = p;
  })();

  /* ------------------------------------------------------------------ */
  /* Panel, toolbar, legenda                                             */
  /* ------------------------------------------------------------------ */
  function prepPanel(kind) {
    var cfg = KINDS[kind], panel = byId(cfg.panel), grid = byId(cfg.grid);
    if (!panel || !grid) return null;
    panel.classList.add('cr-panel');
    panel.setAttribute('data-kind', kind);
    panel.setAttribute('data-density', effDensity());
    panel.style.setProperty('--cr-past', state.past);
    grid.classList.add('cr-grid');
    return panel;
  }

  function optsMarkup(kind) {
    var wrap = el('div', 'cr-opts');
    wrap.setAttribute('data-kind', kind);
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Pengaturan tampilan kalender');
    function seg(name, label, items) {
      var s = el('div', 'cr-seg');
      s.setAttribute('data-cr', name);
      s.appendChild(el('span', 'cr-seg-label', label));
      items.forEach(function (it) {
        var b = el('button', null, it[1]);
        b.type = 'button';
        b.setAttribute('data-v', it[0]);
        s.appendChild(b);
      });
      return s;
    }
    wrap.appendChild(seg('density', 'Tampilan', [['compact', 'Ringkas'], ['detail', 'Detail']]));
    wrap.appendChild(seg('past', 'Lampau', [['0.3', '30%'], ['0.5', '50%'], ['0.75', '75%'], ['1', '100%']]));
    return wrap;
  }

  function ensureToolbar(kind) {
    var anchor = kind === 'internal'
      ? byId('view-switcher-group')
      : (document.querySelector('.ext-view-tab-btn') || {}).parentElement;
    if (!anchor || !anchor.parentElement) return;
    var host = anchor.parentElement;
    if (host.querySelector(':scope > .cr-opts')) return;
    host.classList.add('cr-toolbar-right');
    host.appendChild(optsMarkup(kind));
    syncControls();
  }

  function ensureLegend(kind, panel) {
    if (!panel || panel.querySelector('.cr-legend')) return;
    var bar = panel.firstElementChild;
    if (!bar) return;
    var lg = el('div', 'cr-legend');
    lg.setAttribute('aria-label', 'Keterangan warna');
    KINDS[kind].legend.forEach(function (it) {
      var row = el('span');
      var sw = el('span', 'cr-sw' + (it[0] === 'req' ? ' cr-sw--req' : it[0] === 'past' ? ' cr-sw--past' : ''));
      if (it[0].charAt(0) === '#') sw.style.background = it[0];
      row.appendChild(sw);
      row.appendChild(document.createTextNode(it[1]));
      if (it[0] === 'past') {
        row.appendChild(document.createTextNode(': '));
        row.appendChild(el('b', 'cr-past-ind', Math.round(parseFloat(state.past) * 100) + '%'));
      }
      lg.appendChild(row);
    });
    bar.appendChild(lg);
  }

  function syncControls() {
    Array.prototype.forEach.call(document.querySelectorAll('.cr-seg[data-cr]'), function (seg) {
      var cur = seg.getAttribute('data-cr') === 'density' ? state.density : state.past;
      Array.prototype.forEach.call(seg.querySelectorAll('button'), function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-v') === cur ? 'true' : 'false');
      });
    });
    Array.prototype.forEach.call(document.querySelectorAll('.cr-past-ind'), function (n) {
      n.textContent = Math.round(parseFloat(state.past) * 100) + '%';
    });
  }

  function setState(name, value) {
    if (name === 'density') {
      if (DENSITIES.indexOf(value) < 0 || value === state.density) return;
      state.density = value;
      lsSet(KEY_DENSITY, value);
      Object.keys(KINDS).forEach(function (k) {
        var p = byId(KINDS[k].panel);
        if (p) p.setAttribute('data-density', effDensity());
      });
      decorateAll();
      /* beri tahu mesin pas-layar (calendar-fit-pdf.js) agar menghitung ulang */
      Object.keys(KINDS).forEach(function (k) {
        var p = byId(KINDS[k].panel);
        if (p) p.classList.toggle('cr-tick');
      });
    } else if (name === 'past') {
      if (PASTS.indexOf(value) < 0) return;
      state.past = value;
      lsSet(KEY_PAST, value);
      Object.keys(KINDS).forEach(function (k) {
        var p = byId(KINDS[k].panel);
        if (p) p.style.setProperty('--cr-past', value);
      });
    }
    syncControls();
  }

  /* ------------------------------------------------------------------ */
  /* Dekorasi sel kalender                                               */
  /* ------------------------------------------------------------------ */
  function quotaFor(chip) {
    var id = chip.getAttribute('data-schedule-id');
    if (!id || !chip.querySelector('.cal-meta')) return null;
    var list = Array.isArray(window.LIVE_SCHEDULES) ? window.LIVE_SCHEDULES : [];
    var s = null;
    for (var i = 0; i < list.length; i++) { if (list[i] && list[i].id_jadwal === id) { s = list[i]; break; } }
    if (!s || s.is_request) return null;
    if (typeof window.isSchedulePast === 'function' && window.isSchedulePast(s)) return null;
    var total = Number(s.kuota);
    if (!(total > 0)) return null;
    var reg = Array.isArray(s.peserta) && s.peserta.length
      ? s.peserta.length
      : (Number(s.total_terdaftar) || Math.max(0, total - (Number(s.sisa_kuota) || 0)));
    var pct = Math.min(100, Math.round(reg / total * 100));
    return { reg: reg, total: total, pct: pct, full: reg >= total || /penuh/i.test(s.status || '') };
  }

  function decorate(kind, ym) {
    var cfg = KINDS[kind], grid = byId(cfg.grid);
    if (!grid) return;
    var panel = prepPanel(kind);
    ensureToolbar(kind);
    ensureLegend(kind, panel);

    var counter = byId(cfg.count);
    if (counter) counter.textContent = counter.textContent.replace(/^[\s\u2022]+/, '');

    if (kind === 'external') {
      if (ym) grid.setAttribute('data-ym', ym[0] + '-' + ym[1]);
      var parts = (grid.getAttribute('data-ym') || '').split('-');
      var year = parseInt(parts[0], 10), month = parseInt(parts[1], 10);
    }
    var detail = effDensity() === 'detail';
    var now = new Date();
    var todayKey = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
    var todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    Array.prototype.forEach.call(grid.children, function (cell, idx) {
      cell.classList.add('cr-cell');
      var col = idx % 7;
      if (col >= 5) cell.setAttribute('data-wk', '1'); else cell.removeAttribute('data-wk');
      if (col === 6) cell.setAttribute('data-sun', '1'); else cell.removeAttribute('data-sun');

      var box = cell.querySelector(cfg.box);
      var head = cell.firstElementChild;
      if (!box) {   /* tanggal bulan sebelum/sesudahnya */
        cell.classList.add('cr-cell--out');
        if (head && head.firstElementChild) head.firstElementChild.classList.add('cr-date');
        else if (head) head.classList.add('cr-date');
        return;
      }
      cell.classList.remove('cr-cell--out');

      var key;
      if (kind === 'internal') {
        key = cell.getAttribute('data-date');
      } else {
        var dn = parseInt(cell.getAttribute('data-ext-day'), 10);
        key = year + '-' + pad(month + 1) + '-' + pad(dn);
        cell.setAttribute('data-date', key);
        if (new Date(year, month, dn).getTime() < todayMs) cell.setAttribute('data-past', 'true');
        else cell.removeAttribute('data-past');
      }
      if (key === todayKey) cell.setAttribute('data-today', '1'); else cell.removeAttribute('data-today');

      /* header sel: tanggal, jumlah sesi, cut-off */
      if (head) {
        head.classList.add('cr-head');
        if (head.firstElementChild) head.firstElementChild.classList.add('cr-date');
        var hr = head.querySelector(':scope > .cr-hdr-r');
        if (hr) hr.remove();
        hr = el('span', 'cr-hdr-r');
        var chips = chipsOf(box);
        var n = chips.length;
        if (n) {
          var allReq = chips.every(function (c) { return c.classList.contains('cal-req'); });
          hr.appendChild(el('span', 'cr-count' + (allReq ? ' cr-count--req' : ''), n + ' ' + (allReq ? 'Request' : cfg.unit)));
        }
        if (kind === 'internal' && key && key.slice(-2) === '25') {
          var co = el('span', 'cr-cutoff', 'Cut-Off');
          co.title = 'Batas akhir pengajuan jadwal';
          hr.appendChild(co);
        }
        if (hr.childNodes.length) {
          if (head.firstElementChild) head.firstElementChild.insertAdjacentElement('afterend', hr);
          else head.appendChild(hr);
        }
      }

      /* kartu event */
      var old = box.querySelector(':scope > .cr-more');
      if (old) old.remove();
      var items = chipsOf(box);
      items.forEach(function (c, i) {
        c.classList.add('cr-ev');
        c.classList.remove('cr-hidden');
        c.classList.toggle('cr-ev--line', detail && i > 0);
        var q = c.querySelector(':scope > .cr-quota');
        if (q) q.remove();
        if (detail && i === 0 && kind === 'internal') {
          var info = quotaFor(c);
          if (info) {
            var qb = el('div', 'cr-quota');
            qb.setAttribute('data-full', info.full ? '1' : '0');
            var row = el('div', 'cr-quota-row');
            row.appendChild(el('span', null, 'Kuota ' + info.reg + '/' + info.total));
            row.appendChild(el('span', null, info.full ? 'Penuh' : info.pct + '%'));
            var bar = el('div', 'cr-quota-bar');
            var fill = el('i'); fill.style.width = info.pct + '%';
            bar.appendChild(fill);
            qb.appendChild(row); qb.appendChild(bar);
            c.appendChild(qb);
          }
        }
      });
      if (detail && items.length > DETAIL_LIMIT) {
        items.slice(DETAIL_LIMIT).forEach(function (c) { c.classList.add('cr-hidden'); });
        var more = el('button', 'cr-more');
        more.type = 'button';
        more.title = 'Lihat seluruh ' + items.length + ' sesi pada hari ini';
        var ic = el('span', 'material-symbols-outlined', 'format_list_bulleted');
        ic.setAttribute('aria-hidden', 'true');
        more.appendChild(ic);
        more.appendChild(el('span', null, '+' + (items.length - DETAIL_LIMIT) + ' lagi'));
        box.appendChild(more);
      }
    });
  }

  function decorateAll() {
    decorate('internal');
    decorate('external');
  }

  /* ------------------------------------------------------------------ */
  /* Modal daftar sesi harian                                            */
  /* ------------------------------------------------------------------ */
  var modal, lastFocus;

  function ensureModal() {
    if (modal) return modal;
    modal = el('div', 'cr-modal');
    modal.id = 'cr-day-modal';
    var card = el('div', 'cr-modal-card');
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');
    card.setAttribute('aria-labelledby', 'cr-day-title');

    var head = el('header', 'cr-modal-head');
    var ttl = el('div', 'cr-modal-title');
    var ico = el('div', 'cr-modal-ico');
    var icg = el('span', 'material-symbols-outlined', 'calendar_month');
    icg.setAttribute('aria-hidden', 'true');
    ico.appendChild(icg);
    var txt = el('div');
    var h3 = el('h3');
    var h3t = el('span', null, 'Seluruh sesi pada hari ini');
    h3t.id = 'cr-day-title';
    var badge = el('span', 'cr-modal-badge');
    badge.id = 'cr-day-badge';
    h3.appendChild(h3t); h3.appendChild(badge);
    var sub = el('p');
    sub.id = 'cr-day-sub';
    txt.appendChild(h3); txt.appendChild(sub);
    ttl.appendChild(ico); ttl.appendChild(txt);
    var x = el('button', 'cr-x');
    x.type = 'button'; x.title = 'Tutup'; x.setAttribute('aria-label', 'Tutup');
    var xi = el('span', 'material-symbols-outlined', 'close');
    xi.setAttribute('aria-hidden', 'true');
    x.appendChild(xi);
    x.addEventListener('click', closeModal);
    head.appendChild(ttl); head.appendChild(x);

    var body = el('div', 'cr-modal-body');
    body.id = 'cr-day-list';

    var foot = el('footer', 'cr-modal-foot');
    foot.appendChild(el('span', null, 'Pilih Detail untuk melihat kuota dan peserta'));
    var close = el('button', null, 'Tutup');
    close.type = 'button';
    close.addEventListener('click', closeModal);
    foot.appendChild(close);

    card.appendChild(head); card.appendChild(body); card.appendChild(foot);
    modal.appendChild(card);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    document.body.appendChild(modal);
    return modal;
  }

  function closeModal() {
    if (!modal || !modal.classList.contains('is-open')) return;
    modal.classList.remove('is-open');
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) { /* abaikan */ } }
  }

  function cleanName(t) { return String(t || '').replace(/^\s*[\u21B3]\s*/, '').replace(/\s+/g, ' ').trim(); }

  function describeChip(chip, kind, past) {
    var isReq = chip.classList.contains('cal-req');
    var nameEl = chip.querySelector('.cal-name') || chip.querySelector('span.truncate') || chip.querySelector('.truncate');
    var name = cleanName(nameEl ? nameEl.textContent : chip.textContent);
    var metas = [];
    var cont = !isReq && kind === 'internal' && !chip.querySelector('.cal-meta');
    if (kind === 'internal' && !isReq) {
      Array.prototype.forEach.call(chip.querySelectorAll('.cal-meta .cal-chip'), function (c) {
        var t = c.textContent.replace(/\s+/g, ' ').trim();
        /* status sudah tampil sebagai label di atas judul */
        if (t && !c.classList.contains('cal-done') && !c.classList.contains('cal-closed')) metas.push(t);
      });
    } else {
      var sub = chip.children[1];
      if (sub && !sub.classList.contains('cr-quota')) {
        var t = sub.textContent.replace(/\s+/g, ' ').trim();
        if (t) metas.push(t);
      }
    }
    var badge, tone = '';
    if (isReq) { badge = 'Training Request (REQ)'; tone = 'req'; }
    else if (past) { badge = 'Selesai'; tone = 'muted'; }
    else if (chip.querySelector('.cal-closed')) { badge = 'Pendaftaran ditutup'; tone = 'warn'; }
    else if (cont) { badge = 'Sesi lanjutan'; tone = 'muted'; }
    else if (kind === 'internal') { badge = 'Terkonfirmasi'; }
    else { badge = /bg-emerald-700/.test(chip.className) ? 'Training External' : 'Agenda / Event'; }
    return { name: name, metas: metas, badge: badge, tone: tone, isReq: isReq };
  }

  function openFromCell(cell) {
    if (!cell) return;
    var kind = cell.closest('#ext-view-month') ? 'external' : 'internal';
    var cfg = KINDS[kind];
    var box = cell.querySelector(cfg.box);
    if (!box) return;
    var chips = chipsOf(box);
    var past = cell.getAttribute('data-past') === 'true';

    var m = ensureModal();
    m.setAttribute('data-kind', kind);
    var key = cell.getAttribute('data-date') || '';
    var p = key.split('-');
    var label = '';
    if (p.length === 3) {
      label = new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    byId('cr-day-sub').textContent = label;
    byId('cr-day-badge').textContent = chips.length + ' ' + cfg.unit;

    var list = byId('cr-day-list');
    list.textContent = '';
    chips.forEach(function (chip) {
      var d = describeChip(chip, kind, past);
      var item = el('div', 'cr-item' + (d.isReq ? ' cr-item--req' : ''));
      var main = el('div', 'cr-item-main');
      main.appendChild(el('span', 'cr-pill' + (d.tone ? ' cr-pill--' + d.tone : ''), d.badge));
      main.appendChild(el('h4', null, d.name));
      if (d.metas.length) {
        var mt = el('div', 'cr-item-meta');
        d.metas.forEach(function (t) { mt.appendChild(el('span', null, t)); });
        main.appendChild(mt);
      }
      var go = el('button', 'cr-item-go', 'Detail');
      go.type = 'button';
      go.addEventListener('click', function () {
        closeModal();
        lastFocus = null;
        chip.click();
      });
      item.appendChild(main); item.appendChild(go);
      list.appendChild(item);
    });

    lastFocus = document.activeElement;
    m.classList.add('is-open');
    var first = m.querySelector('.cr-x');
    if (first) first.focus();
  }

  /* ------------------------------------------------------------------ */
  /* Event global                                                        */
  /* ------------------------------------------------------------------ */
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var b = t.closest('.cr-seg button');
    if (b) {
      setState(b.parentElement.getAttribute('data-cr'), b.getAttribute('data-v'));
      return;
    }
    var more = t.closest('.cr-more') || t.closest(':is(#view-month, #ext-view-month) .cal-more');
    if (more) {
      /* ambil alih tombol "+N lagi" bawaan mesin pas-layar: buka modal, bukan popover */
      e.preventDefault();
      e.stopPropagation();
      openFromCell(more.closest('.cr-cell'));
    }
  }, true);

  document.addEventListener('keydown', function (e) {
    if (!modal || !modal.classList.contains('is-open')) return;
    if (e.key === 'Escape') { e.stopPropagation(); closeModal(); return; }
    if (e.key === 'Tab') {
      var f = modal.querySelectorAll('button');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }, true);

  /* ------------------------------------------------------------------ */
  /* Pasang                                                              */
  /* ------------------------------------------------------------------ */
  function wrap(name, after) {
    var orig = window[name];
    if (typeof orig !== 'function' || orig.__cr) return;
    var w = function () {
      var r = orig.apply(this, arguments);
      try { after.apply(null, arguments); } catch (err) { console.error('[calendar-redesign]', err); }
      return r;
    };
    w.__cr = true;
    window[name] = w;
  }

  function init() {
    Object.keys(KINDS).forEach(function (k) { prepPanel(k); ensureToolbar(k); ensureLegend(k, byId(KINDS[k].panel)); });
    syncControls();
    wrap('injectMonthViewBadges', function () { decorate('internal'); });
    wrap('renderExtMonthView', function (e, n, t) { decorate('external', [n, t]); });
    /* jika kalender sudah sempat tergambar sebelum script ini jalan */
    decorateAll();
  }

  function onNarrowChange() {
    Object.keys(KINDS).forEach(function (k) {
      var p = byId(KINDS[k].panel);
      if (p) { p.setAttribute('data-density', effDensity()); p.classList.toggle('cr-tick'); }
    });
    decorateAll();
  }
  if (narrow.addEventListener) narrow.addEventListener('change', onNarrowChange);
  else if (narrow.addListener) narrow.addListener(onNarrowChange);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
