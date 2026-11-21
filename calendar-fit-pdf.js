/**
 * =============================================================================
 * calendar-fit-pdf.js
 * PT Merdeka Copper Gold / Pani Gold Project - Learning & Development
 *
 * 1) downloadTrainingCalendarPdf('internal' | 'external')
 *    Export PDF memakai template "Jadwal Pelatihan Internal Terpadu (Bulanan)"
 *    (A4 portrait, 3 kolom, legenda kategori, catatan, helpdesk, tanda tangan).
 *    Bulan yang dicetak = bulan yang sedang tampil di kalender.
 *
 * 2) Kalender bulanan (Internal & External) pas 1 layar:
 *    tanpa scroll kanan-kiri, dan tanpa scroll atas-bawah di dalam kalender.
 *    Event yang tidak muat diringkas menjadi chip "+N lagi" (klik untuk buka).
 *
 * Pasang SETELAH semua script bawaan (index-core, ux, dst):
 *   <script defer src="calendar-fit-pdf.js"></script>
 * =============================================================================
 */
(function () {
  'use strict';

  /* ===========================================================================
   * KONFIGURASI (ubah di sini)
   * ======================================================================== */
  var CFG = {
    logo: 'favicon.png',                          // logo kotak 40x40 di header PDF
    company: 'PT MERDEKA COPPER GOLD TBK',
    unit: 'Learning & Development site Pani Gold Project',
    rev: '02',
    version: '2.4',
    status: 'RESMI / DISETUJUI',
    email: 'pani.training@merdekacoppergold.com',
    contacts: [
      { name: 'S. Mohi', role: 'Admin LnD', phone: '0852 4074 7436' },
      { name: 'Fadhila', role: 'LnD Specialist', phone: '0822-9048-5633' }
    ],
    paper: 'A3',                                  // 'A3' atau 'A4'
    orientation: 'auto',                          // 'auto' (pilih yang paling mengisi kertas), 'portrait', atau 'landscape'
    defaultRoom: 'Gold Room 2 & 3',
    defaultDurationHour: 8,                       // dipakai bila data tidak punya durasi
    showStamps: true,                             // false = kotak tanda tangan kosong (untuk TTD basah)
    signers: [
      { r: 'Dibuat Oleh', p: 'LnD Officer', d: 'HR Department', s: 'VERIFIED SIGN', ok: 1 },
      { r: 'Diperiksa Oleh', p: 'Safety Superintendent', d: 'HSE Department', s: 'VERIFIED' },
      { r: 'Ditinjau Oleh', p: 'Operations Manager', d: 'Mining & Processing', s: 'VERIFIED' },
      { r: 'Disetujui Oleh', p: 'HR & Admin Manager', d: 'Pani Gold Project', s: 'APPROVED' },
      { r: 'Mengetahui', p: 'General Manager', d: 'Site Project Director', s: 'ACKNOWLEDGED' }
    ]
  };

  var CATS = {
    hse: 'HSE / Safety', lead: 'Leadership / HR', gen: 'Reguler / Umum', tech: 'Teknis',
    ext: 'External Training', evt: 'Agenda / Event'
  };
  var HARI = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
  var BULAN = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'];
  var BLN3 = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  var MONTH_ALIASES = [
    ['januari', 'january'], ['februari', 'february'], ['maret', 'march'], ['april'], ['mei', 'may'], ['juni', 'june'],
    ['juli', 'july'], ['agustus', 'august'], ['september'], ['oktober', 'october'], ['november'], ['desember', 'december']
  ];

  /* ===========================================================================
   * HELPER
   * ======================================================================== */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function ymd(s) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s); return new Date(+m[1], +m[2] - 1, +m[3]); }

  function parseDate(v) {
    if (!v) return null;
    if (v instanceof Date) return isNaN(v) ? null : new Date(v.getFullYear(), v.getMonth(), v.getDate());
    var s = String(v).trim(), m;
    if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s))) return new Date(+m[1], +m[2] - 1, +m[3]);
    if ((m = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/.exec(s))) return new Date(+m[3], +m[2] - 1, +m[1]);
    var d = new Date(s);
    return isNaN(d) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function parseHour(v) {
    if (v == null || v === '') return null;
    var m = /(\d{1,2})\s*[:.]\s*(\d{2})/.exec(String(v));
    if (m) return (+m[1]) * 60 + (+m[2]);
    var n = parseFloat(v);
    return isNaN(n) ? null : Math.round(n * 60);
  }
  function fmtMin(min) {
    min = ((min % 1440) + 1440) % 1440;
    return pad(Math.floor(min / 60)) + '.' + pad(min % 60);
  }

  function classify(title, raw) {
    var r = String(raw || '').toLowerCase();
    if (/hse|safety|k3/.test(r)) return 'hse';
    if (/lead|hr/.test(r)) return 'lead';
    if (/tek|tech/.test(r)) return 'tech';
    var t = String(title || '').toLowerCase();
    if (/leadership|kepemimpinan|supervis|coaching|komunikasi|soft skill|management|manajemen|\bcrm\b|periksa/.test(t)) return 'lead';
    if (/safety|k3|hse|fire|first aid|p3k|lock ?out|loto|height|confined|near water|traffic|manual handling|ergonomi|geotech|hand injury|hazard|defensive|induksi|induction|rescue|spill|\bppe\b|\bapd\b|isolation/.test(t)) return 'hse';
    if (/power tool|welding|las\b|excavator|operator|maintenance|teknis|crane|forklift|rigging|electric|listrik|mechanic|diesel|hydraulic|pneumatic|autocad|excel|software/.test(t)) return 'tech';
    return 'gen';
  }

  /* ===========================================================================
   * DATA -> SESSIONS
   * ======================================================================== */
  function pickArr(name) { return (window[name] && Array.isArray(window[name])) ? window[name] : []; }

  function expand(item, category, year, month, out, fixedCat) {
    var s = parseDate(item.date_obj || item.start || item.tanggal_pelatihan || item.tanggal);
    if (!s) return;
    var e = parseDate(item.end_date_obj || item.end || item.tanggal_selesai) || s;
    if (e < s) e = s;
    var title = item.agenda || item.nama_silabus || item.nama_pelatihan || item.nama_program || item.nama_agenda;
    if (!title) return;
    var st = parseHour(item.start_hour || item.jam_mulai);
    if (st == null) st = 8 * 60;
    var en = parseHour(item.end_hour || item.jam_selesai);
    var dur = parseFloat(item.duration_hour || item.durasi_jam);
    if (en == null || (item.end_hour == null && item.jam_selesai == null)) {
      en = st + Math.round((dur > 0 ? dur : CFG.defaultDurationHour) * 60);
    }
    var kuota = Number(item.kuota || item.kuota_peserta) || 0;
    var sisa = item.sisa_kuota;
    var statusTxt = String(item.status || '').toLowerCase();
    var full = /penuh|full/.test(statusTxt) || (kuota > 0 && sisa != null && sisa !== '' && Number(sisa) <= 0);
    var cat = fixedCat || classify(title, item.kategori || item.kategori_pelatihan || item.category_group);
    var cur = new Date(s), guard = 0;
    while (cur <= e && guard++ < 62) {
      if (cur.getFullYear() === year && cur.getMonth() === month) {
        out.push({
          date: iso(cur), title: String(title).trim(), start: fmtMin(st), end: fmtMin(en),
          room: item.room || item.ruangan || item.location || CFG.defaultRoom, category: cat, full: full
        });
      }
      cur.setDate(cur.getDate() + 1);
    }
  }

  function collectSessions(type, year, month) {
    var out = [];
    if (type === 'external') {
      pickArr('EXTERNAL_DATA').forEach(function (i) { if (i) expand(i, 'ext', year, month, out, 'ext'); });
      pickArr('AGENDA_DATA').forEach(function (i) { if (i) expand(i, 'evt', year, month, out, 'evt'); });
    } else {
      var list = pickArr('LIVE_SCHEDULES');
      if (!list.length) list = pickArr('DATABASE_DATA');
      list.forEach(function (i) {
        if (!i || i.is_request || i.is_room_booking) return;
        expand(i, 'internal', year, month, out, null);
      });
    }
    return out;
  }

  function viewedMonth(type) {
    var el = document.getElementById(type === 'external' ? 'ext-month-view-title' : 'month-view-title');
    var txt = el ? el.textContent.toLowerCase() : '';
    var ym = /(20\d{2})/.exec(txt), y = ym ? +ym[1] : new Date().getFullYear(), m = -1;
    MONTH_ALIASES.forEach(function (al, i) { al.forEach(function (n) { if (m < 0 && txt.indexOf(n) !== -1) m = i; }); });
    if (m < 0) { m = new Date().getMonth(); }
    return { year: y, month: m };
  }

  /* ===========================================================================
   * TEMPLATE PDF
   * ======================================================================== */
  var PAPER_PX = { A3: [1123, 1587], A4: [794, 1123] };  // piksel @96dpi, portrait
  function paperDims(o) {
    var d = PAPER_PX[CFG.paper] || PAPER_PX.A4;
    return (o || CFG.orientation) === 'landscape' ? [d[1], d[0]] : d;
  }
  function pageRule(o) { return '@page{size:' + (PAPER_PX[CFG.paper] ? CFG.paper : 'A4') + ' ' + (o === 'landscape' ? 'landscape' : 'portrait') + ';margin:0}'; }

  var PDF_CSS_BODY = ''  +
    ':root{--navy:#0C2340;--gold:#C59B27;--goldL:#E8BF53;--s50:#F8FAFC;--s100:#F1F5F9;--s200:#E2E8F0;--s300:#CBD5E1;--s400:#94A3B8;--s500:#64748B;--s600:#475569;--s700:#334155;--s900:#0F172A;--z:1}' +
    '*{box-sizing:border-box;margin:0;padding:0}html,body{background:#fff}' +
    "body{font-family:Inter,system-ui,'Segoe UI',Arial,sans-serif;color:#1E293B;-webkit-font-smoothing:antialiased;-webkit-print-color-adjust:exact;print-color-adjust:exact}" +
    ".mono{font-family:ui-monospace,'SFMono-Regular',Menlo,Consolas,monospace}" +
    '.page{width:1100px;margin:0 auto;padding:22px 26px 18px;background:#fff}' +
    '@media print{.page{zoom:var(--z);margin:0 auto}}' +
    '.h1row{display:flex;align-items:center;justify-content:space-between;padding-bottom:12px;border-bottom:1px solid var(--s300)}' +
    '.brand{display:flex;align-items:center;gap:12px}' +
    '.logo{width:40px;height:40px;border-radius:5px;background:var(--navy);border:1px solid var(--gold);color:var(--goldL);font-weight:900;font-size:19px;display:flex;align-items:center;justify-content:center;flex:none;overflow:hidden}' +
    '.logo img{width:100%;height:100%;object-fit:contain;background:#fff}' +
    '.brand b{display:block;font-size:15px;font-weight:900;letter-spacing:.05em;color:var(--navy);text-transform:uppercase}' +
    '.brand span{font-size:11.5px;color:var(--s600);font-weight:500}' +
    '.doc{border:1px solid var(--s300);background:var(--s50);border-radius:5px;padding:8px 11px;text-align:right;font-size:10.5px;line-height:1.45;color:var(--s700)}' +
    '.doc .a{font-weight:700;color:var(--navy);font-size:11.5px}.doc .b{color:var(--s500);margin-top:2px}.doc .c{font-weight:700;margin-top:4px;color:var(--s600)}' +
    '.h2row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 0;border-bottom:2px solid var(--navy);margin-bottom:16px}' +
    '.h2row h1{white-space:nowrap;font-size:21px;font-weight:900;letter-spacing:-.01em;color:var(--navy);text-transform:uppercase;line-height:1.1}' +
    '.legend{display:flex;align-items:center;gap:10px;background:var(--s50);border:1px solid var(--s200);border-radius:5px;padding:6px 12px;font-size:11.5px;font-weight:600;white-space:nowrap}' +
    '.legend .k{font-size:9.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--s400)}.legend .sep{color:var(--s300)}' +
    '.dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:5px}' +
    '.t-hse{color:#B45309}.t-lead{color:#581C87}.t-gen{color:#1E3A8A}.t-tech{color:#134E4A}.t-ext{color:#047857}.t-evt{color:#3730A3}' +
    '.b-hse{background:#F59E0B}.b-lead{background:#9333EA}.b-gen{background:#2563EB}.b-tech{background:#0D9488}.b-ext{background:#059669}.b-evt{background:#4F46E5}.b-full{background:#DC2626}' +
    '.cols{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;align-items:start}' +
    '.colhead{display:flex;align-items:center;justify-content:space-between;background:var(--s100);border:1px solid var(--s300);border-bottom:2px solid var(--gold);border-radius:5px 5px 0 0;padding:7px 12px;margin-bottom:10px}' +
    '.colhead span.l{display:flex;align-items:center;gap:7px;font-size:10px;font-weight:700;letter-spacing:.02em;text-transform:uppercase;color:var(--navy);white-space:nowrap}' +
    '.colhead svg{width:13px;height:13px;color:var(--gold)}' +
    '.colhead .r{white-space:nowrap;font-size:10.5px;font-weight:700;background:#fff;border:1px solid var(--s300);border-radius:4px;padding:1px 7px;color:var(--s700)}' +
    '.stack{display:flex;flex-direction:column;gap:10px}' +
    '.day{border:1px solid var(--s300);border-radius:5px;overflow:hidden;background:#fff;break-inside:avoid}' +
    '.dayh{display:flex;align-items:center;justify-content:space-between;background:var(--s100);border-bottom:1px solid var(--s300);padding:5px 10px}' +
    '.dayh .n{font-size:11px;font-weight:900;color:var(--navy);text-transform:uppercase}' +
    ".dayh .w{font-size:11px;font-weight:600;color:var(--s500);margin-left:7px}.dayh .w:before{content:'|';margin-right:7px;color:var(--s300)}" +
    '.cnt{font-size:9.5px;font-weight:700;color:var(--s700);background:#fff;border:1px solid var(--s300);border-radius:4px;padding:1px 6px}' +
    '.sess{padding:8px;display:flex;flex-direction:column;gap:7px}' +
    '.item{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;padding:7px 8px;border-radius:5px;border:1px solid var(--bd);background:var(--bg)}' +
    '.item .tt{display:flex;align-items:flex-start;gap:6px;font-size:11.5px;font-weight:700;color:var(--s900);line-height:1.25}' +
    '.item .tt .dot{margin-top:3px;flex:none;margin-right:0}' +
    '.item .rm{font-size:10.5px;color:var(--s600);padding-left:14px;margin-top:2px;display:flex;align-items:center;gap:4px}' +
    '.item .rm svg{width:10px;height:10px;flex:none;color:#E11D48}' +
    '.tm{flex:none;font-size:10.5px;font-weight:700;color:var(--navy);background:#fff;border:1px solid var(--s300);border-radius:4px;padding:2px 6px;white-space:nowrap}' +
    '.i-hse{--bd:#FDE68A;--bg:rgba(255,251,235,.7)}.i-lead{--bd:#E9D5FF;--bg:rgba(250,245,255,.7)}.i-gen{--bd:#BFDBFE;--bg:rgba(239,246,255,.7)}.i-tech{--bd:#99F6E4;--bg:rgba(240,253,250,.7)}' +
    '.i-ext{--bd:#A7F3D0;--bg:rgba(236,253,245,.7)}.i-evt{--bd:#C7D2FE;--bg:rgba(238,242,255,.7)}.i-internal{--bd:#BFDBFE;--bg:rgba(239,246,255,.7)}' +
    '.i-lead .tm{color:#581C87;border-color:#E9D5FF}' +
    '.item.full{--bd:#FCA5A5;--bg:rgba(254,242,242,.6)}.item.full .tm{color:#B91C1C;border-color:#FCA5A5}.item.full .rm{color:#B91C1C;font-weight:600}' +
    '.pn{background:#DC2626;color:#fff;font-size:8.5px;font-weight:900;letter-spacing:.06em;padding:1px 5px;border-radius:3px;margin-left:6px;align-self:center}' +
    '.foot{margin-top:18px;border-top:2px solid var(--s300);padding-top:14px}' +
    '.info{display:grid;grid-template-columns:7fr 5fr;gap:14px;margin-bottom:14px}' +
    '.box{background:var(--s50);border:1px solid var(--s300);border-radius:5px;padding:11px 13px}' +
    '.box h3{display:flex;align-items:center;gap:7px;font-size:11px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--navy);margin-bottom:7px}' +
    '.box h3 i{width:8px;height:8px;border-radius:50%;background:var(--navy)}' +
    '.box li{font-size:11px;line-height:1.55;color:var(--s700);margin:0 0 4px 16px}.box li b{color:var(--s900)}' +
    '.box p{font-size:11px;color:var(--s600);margin-bottom:6px}' +
    '.mail{display:flex;align-items:center;gap:7px;font-size:11px;color:var(--s700);margin-bottom:7px}.mail b{color:var(--s900)}.mail span.m{font-size:10.5px;color:var(--s900);font-weight:500}' +
    '.mail svg{width:13px;height:13px;color:var(--gold)}' +
    '.cts{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ct{background:#fff;border:1px solid var(--s300);border-radius:4px;padding:6px 8px}' +
    '.ct b{display:block;font-size:10.5px;color:var(--s900)}.ct span{display:flex;align-items:center;gap:4px;font-size:10px;color:var(--s600);margin-top:2px}.ct svg{width:10px;height:10px;color:#047857;flex:none}' +
    '.sign{border:1px solid var(--s400);border-radius:5px;padding:11px 13px;background:#fff}' +
    '.sign h4{text-align:center;font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--navy);padding-bottom:8px;margin-bottom:10px;border-bottom:1px solid var(--s200)}' +
    '.sg5{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}.sg{border:1px solid var(--s200);border-radius:5px;padding:8px 8px 9px;text-align:center}' +
    '.sg .r{font-size:9px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--s500)}' +
    '.sg .sp{height:44px;margin:4px 0;border-bottom:1px dashed var(--s300);display:flex;align-items:center;justify-content:center}' +
    '.stamp{font-size:9px;font-weight:700;padding:1px 6px;border-radius:3px;background:var(--s100);color:var(--s600);border:1px solid var(--s200)}' +
    '.stamp.ok{background:#ECFDF5;color:#047857;border-color:#A7F3D0}' +
    '.sg .p{font-size:11px;font-weight:700;color:var(--s900)}.sg .d{font-size:9.5px;color:var(--s500)}' +
    '.legal{display:flex;justify-content:space-between;align-items:center;margin-top:10px;font-size:10px;color:var(--s500)}.legal .mono{font-weight:700;color:var(--s700)}' +
    '.empty{padding:40px;text-align:center;color:var(--s500);font-size:13px}';
  function buildPdfCss() { return PDF_CSS_BODY; }

  var ICON_CAL = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>';
  var ICON_PIN = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 00-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6.5a2.5 2.5 0 010 5z"/></svg>';
  var ICON_MAIL = '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>';
  var ICON_WA = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.37a9.9 9.9 0 004.74 1.2c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.2 8.2 0 012.41 5.83c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.39-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.32a8.2 8.2 0 01-1.26-4.38c.01-4.54 3.7-8.24 8.25-8.24z"/></svg>';

  function renderPdf(doc, sessions, opt, ncol) {
    var root = doc.getElementById('app');
    var list = sessions.slice().sort(function (a, b) {
      return a.date < b.date ? -1 : a.date > b.date ? 1 : (a.start < b.start ? -1 : a.start > b.start ? 1 : 0);
    });
    var yr = opt.year, mon = opt.month, lead = (new Date(yr, mon, 1).getDay() + 6) % 7;
    var docNo = opt.docNo;

    var days = [], ix = {};
    list.forEach(function (s) {
      if (!ix[s.date]) { ix[s.date] = { date: s.date, items: [] }; days.push(ix[s.date]); }
      ix[s.date].items.push(s);
    });
    function wt(d) { return d.items.length + 0.8; }
    var tot = days.reduce(function (a, d) { return a + wt(d); }, 0), cols = [], ci = 0, acc = 0, nc = Math.max(1, Math.min(ncol || 3, days.length));
    for (var k = 0; k < nc; k++) cols.push([]);
    days.forEach(function (d) {
      if (ci < nc - 1 && acc + wt(d) / 2 > tot * (ci + 1) / nc) ci++;
      cols[ci].push(d); acc += wt(d);
    });
    cols = cols.filter(function (c) { return c.length; });
    var PHASE = ['Awal Bulan', 'Pertengahan Bulan', 'Akhir Bulan'];
    function wk(d) { return Math.floor((ymd(d).getDate() + lead - 1) / 7) + 1; }

    var used = {}; list.forEach(function (s) { used[s.category] = 1; });
    var legend = Object.keys(CATS).filter(function (k) { return used[k]; }).map(function (k) {
      return '<span class="t-' + k + '"><i class="dot b-' + k + '"></i>' + CATS[k] + '</span>';
    }).join('<span class="sep">|</span>');

    function dayH(d) {
      var dt = ymd(d.date), rows = d.items.map(function (s) {
        var cls = 'i-' + s.category + (s.full ? ' full' : '');
        return '<div class="item ' + cls + '"><div><div class="tt"><i class="dot b-' + (s.full ? 'full' : s.category) + '"></i><span>' + esc(s.title) + '</span>' +
          (s.full ? '<span class="pn">PENUH</span>' : '') + '</div>' +
          '<div class="rm">' + ICON_PIN + '<span>' + esc(s.room) + (s.full ? ' • Kuota Habis' : '') + '</span></div></div>' +
          '<span class="tm mono">' + esc(s.start) + ' - ' + esc(s.end) + '</span></div>';
      }).join('');
      return '<div class="day"><div class="dayh"><div><span class="n">' + pad(dt.getDate()) + ' ' + BULAN[mon] + '</span><span class="w">' + HARI[dt.getDay()] + '</span></div>' +
        '<span class="cnt">' + d.items.length + ' SESI</span></div><div class="sess">' + rows + '</div></div>';
    }
    function colH(c, i) {
      var a = ymd(c[0].date).getDate(), b = ymd(c[c.length - 1].date).getDate(), w1 = wk(c[0].date), w2 = wk(c[c.length - 1].date);
      var lbl = 'Minggu ' + w1 + (w2 !== w1 ? ' &amp; ' + w2 : '') + (cols.length === 3 ? ' (' + PHASE[i] + ')' : '');
      return '<section><div class="colhead"><span class="l">' + ICON_CAL + lbl + '</span><span class="r">' + pad(a) + ' - ' + pad(b) + ' ' + BLN3[mon] + '</span></div>' +
        '<div class="stack">' + c.map(dayH).join('') + '</div></section>';
    }

    var logo = CFG.logo ? '<img src="' + esc(CFG.logo) + '" alt="" onerror="this.parentNode.textContent=\'M\'">' : 'M';
    root.innerHTML =
      '<div class="h1row"><div class="brand"><div class="logo">' + logo + '</div><div><b>' + esc(CFG.company) + '</b><span>' + esc(CFG.unit) + '</span></div></div>' +
      '<div class="doc mono"><div class="a">DOC NO: ' + esc(docNo) + '</div><div class="b">Rev: ' + esc(CFG.rev) + ' • Status: ' + esc(CFG.status) + '</div><div class="c">Periode: ' + BULAN[mon] + ' ' + yr + '</div></div></div>' +
      '<div class="h2row"><h1>' + esc(opt.title) + '</h1><div class="legend"><span class="k">Kategori:</span>' + legend + '</div></div>' +
      '<div class="cols" style="grid-template-columns:repeat(' + cols.length + ',1fr)">' + cols.map(colH).join('') + '</div>' +
      '<div class="foot"><div class="info"><div class="box"><h3><i></i>Catatan Penting (Notice)</h3><ul>' +
      opt.notes.map(function (n) { return '<li><b>' + esc(n[0]) + '</b> ' + esc(n[1]) + '</li>'; }).join('') + '</ul></div>' +
      '<div class="box"><h3><i></i>Informasi &amp; Kontak Bantuan (Helpdesk LnD)</h3><p>Pertanyaan pendaftaran, sertifikasi, atau penjadwalan khusus dapat menghubungi:</p>' +
      '<div class="mail">' + ICON_MAIL + '<b>Email Resmi:</b><span class="m mono">' + esc(CFG.email) + '</span></div>' +
      '<div class="cts">' + CFG.contacts.map(function (c) { return '<div class="ct"><b>' + esc(c.name) + ' (' + esc(c.role) + ')</b><span class="mono">' + ICON_WA + esc(c.phone) + '</span></div>'; }).join('') + '</div></div></div>' +
      '<div class="sign"><h4>Dibuat, diketahui dan disetujui oleh</h4><div class="sg5">' +
      CFG.signers.map(function (s) {
        return '<div class="sg"><div class="r">' + esc(s.r) + '</div><div class="sp">' + (CFG.showStamps && s.s ? '<span class="stamp mono' + (s.ok ? ' ok' : '') + '">[' + esc(s.s) + ']</span>' : '') + '</div><div class="p">' + esc(s.p) + '</div><div class="d">' + esc(s.d) + '</div></div>';
      }).join('') + '</div></div>' +
      '<div class="legal"><span>© ' + yr + ' PT Merdeka Copper Gold Tbk - Pani Gold Project. Dokumen Internal Terkendali.</span><span class="mono">Ref: ' + esc(docNo) + ' • Versi ' + esc(CFG.version) + ' • Dicetak: ' + BLN3[mon] + ' ' + yr + '</span></div></div>';
  }

  /* Pilih orientasi + jumlah kolom yang membuat tulisan paling besar (= kertas paling terisi),
     lalu skalakan agar seluruh isi muat 1 halaman (A3/A4). */
  function layoutAndFit(doc, sessions, opt) {
    var pg = doc.getElementById('page');
    var orients = (CFG.orientation === 'landscape' || CFG.orientation === 'portrait') ? [CFG.orientation] : ['portrait', 'landscape'];
    var nDays = {}; sessions.forEach(function (x) { nDays[x.date] = 1; });
    var maxCols = Math.min(6, Object.keys(nDays).length), best = null;
    orients.forEach(function (o) {
      var d = paperDims(o);
      for (var n = Math.min(3, maxCols); n <= Math.max(3, maxCols); n++) {
        renderPdf(doc, sessions, opt, n);
        var used = doc.querySelectorAll('.cols>section').length;
        var W = Math.max(1100, used * 340 + 84);
        pg.style.width = W + 'px';
        pg.style.zoom = '1';
        var h = pg.offsetHeight, z = Math.min(d[0] / W, d[1] / h);
        if (!best || z > best.z + 0.001) best = { z: z, n: n, o: o, W: W };
      }
    });
    renderPdf(doc, sessions, opt, best.n);
    pg.style.width = best.W + 'px';
    pg.style.zoom = '';
    doc.documentElement.style.setProperty('--z', (best.z * 0.975).toFixed(4));
    doc.getElementById('pagecss').textContent = pageRule(best.o);
  }

  function downloadTrainingCalendarPdf(type) {
    type = type === 'external' ? 'external' : 'internal';
    var vm = viewedMonth(type);
    var sessions = collectSessions(type, vm.year, vm.month);
    if (!sessions.length) {
      alert('Tidak ada jadwal pada ' + BULAN[vm.month] + ' ' + vm.year + ' untuk dicetak.');
      return;
    }
    var isExt = type === 'external';
    var opt = {
      year: vm.year, month: vm.month,
      docNo: 'MGR-PGP-LND-' + (isExt ? 'EXT' : 'SCH') + '-' + vm.year + '-' + pad(vm.month + 1),
      title: isExt ? 'JADWAL EXTERNAL TRAINING & EVENT (BULANAN)' : 'JADWAL PELATIHAN INTERNAL TERPADU (BULANAN)',
      notes: [
        ['Kewajiban CRS:', 'Karyawan yang belum memenuhi persyaratan CRS wajib mengikuti pelatihan sesuai jadwal yang telah ditentukan. Koordinasi aktif dilakukan bersama departemen terkait, atasan langsung, dan tim Learning & Development.'],
        ['Lokasi Pelaksanaan:', isExt
          ? 'Lokasi dan waktu pelaksanaan mengikuti informasi pada setiap sesi. Apabila terdapat perubahan waktu, kuota, atau tempat, pembaruan resmi akan diterbitkan oleh Learning & Development.'
          : 'Seluruh kegiatan pelatihan dipusatkan di Gold Room 2 & 3, Pioneer Site. Apabila terdapat perubahan waktu, kuota, atau tempat, pembaruan resmi akan diterbitkan oleh Learning & Development.']
      ]
    };

    var old = document.getElementById('__pdf_frame__');
    if (old) old.remove();
    var fr = document.createElement('iframe');
    fr.id = '__pdf_frame__';
    fr.setAttribute('aria-hidden', 'true');
    fr.style.cssText = 'position:fixed;left:-10000px;top:0;width:1100px;height:1600px;border:0;visibility:hidden';
    document.body.appendChild(fr);

    var doc = fr.contentDocument;
    doc.open();
    doc.write('<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><base href="' + esc(location.href) + '">' +
      '<title>' + esc(opt.docNo) + '</title>' +
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap">' +
      '<style id="pagecss">' + pageRule('portrait') + '</style><style>' + buildPdfCss() + '</style></head><body><div class="page" id="page"><div id="app"></div></div></body></html>');
    doc.close();
    renderPdf(doc, sessions, opt, 3);

    var prevTitle = document.title, printed = false;
    function cleanup() {
      document.title = prevTitle;
      setTimeout(function () { if (fr.parentNode) fr.remove(); }, 500);
    }
    function doPrint() {
      if (printed) return;
      printed = true;
      layoutAndFit(doc, sessions, opt);
      document.title = 'Jadwal_' + (isExt ? 'External_' : 'Pelatihan_') + BULAN[vm.month] + '_' + vm.year;
      try {
        fr.contentWindow.onafterprint = cleanup;
        fr.contentWindow.focus();
        fr.contentWindow.print();
      } catch (e) {
        console.error('Gagal membuka dialog cetak:', e);
        cleanup();
      }
      setTimeout(cleanup, 120000);
    }
    var ready = (doc.fonts && doc.fonts.ready) ? doc.fonts.ready : Promise.resolve();
    var imgs = Array.prototype.slice.call(doc.images).map(function (im) {
      return im.complete ? null : new Promise(function (r) { im.onload = im.onerror = r; });
    }).filter(Boolean);
    Promise.race([
      Promise.all([ready].concat(imgs)),
      new Promise(function (r) { setTimeout(r, 2500); })
    ]).then(doPrint, doPrint);
  }

  window.downloadTrainingCalendarPdf = downloadTrainingCalendarPdf;
  window.addEventListener('load', function () { window.downloadTrainingCalendarPdf = downloadTrainingCalendarPdf; });

  /* ===========================================================================
   * KALENDER BULANAN: PAS 1 LAYAR
   * ======================================================================== */
  var FIT_CSS = '' +
    /* ukuran huruf kalender mengikuti lebar layar: 12px (laptop kecil) s/d 15px (monitor lebar) */
    ':root{--cal-fs:clamp(12px,calc(0.7vw + 4px),15px);--cal-zoom:1}' +
    /* tampilan Minggu / Tahun / Daftar Agenda ikut diperbesar (nilai --cal-zoom diatur script menurut lebar layar) */
    '#view-week,#view-year,#view-list,#ext-view-week,#ext-view-year,#ext-view-list{zoom:var(--cal-zoom,1)}' +
    /* cegah scroll kiri-kanan di level halaman */
    'html,body{max-width:100%}body{overflow-x:clip}' +
    /* panel kalender = tinggi layar dikurangi header tetap (64px) */
    '#view-month,#ext-view-month{min-width:0;max-width:100%;height:calc(100vh - 80px);height:calc(100dvh - 80px);min-height:460px}' +
    '#view-month>div,#ext-view-month>div{min-width:0}' +
    /* grid 7 kolom sama lebar, baris mengisi sisa tinggi */
    '#month-calendar-grid,#ext-month-calendar-grid{flex:1 1 0;min-height:0;grid-template-columns:repeat(7,minmax(0,1fr))!important;grid-auto-rows:minmax(0,1fr)!important;overflow:hidden}' +
    '#month-calendar-grid>div,#ext-month-calendar-grid>div{min-height:0!important;min-width:0;padding:4px 5px!important;overflow:hidden;justify-content:flex-start!important;position:relative}' +
    '#month-calendar-grid>div .font-title-sm,#ext-month-calendar-grid>div .font-title-sm{font-size:calc(var(--cal-fs) + 2px);line-height:1.1}' +
    '.day-events-container,[data-ext-day-container],#ext-month-calendar-grid>div>div:last-child{min-height:0;min-width:0;overflow:hidden;margin-top:2px!important;gap:2px!important}' +
    /* event ringkas: satu baris, terpotong dengan elipsis */
    '.day-events-container>*:not(.cal-more){margin:0!important;padding:3px 7px!important;font-size:var(--cal-fs)!important;line-height:1.22!important;white-space:normal;overflow:hidden;overflow-wrap:anywhere;min-width:0;max-width:100%;flex:none}' +
    '.day-events-container>*:not(.cal-more) *{white-space:normal;overflow:visible;text-overflow:clip;overflow-wrap:anywhere;font-size:inherit!important;line-height:inherit!important}' +
    '.day-events-container>*:not(.cal-more)>*:nth-child(n+2){display:none!important}' +
    '.cal-more{flex:none;align-self:flex-start;font-size:calc(var(--cal-fs) - 1px);font-weight:700;line-height:1;padding:3px 7px;border-radius:999px;background:rgba(0,0,0,.07);color:inherit;cursor:pointer;border:0}' +
    '.cal-more:hover{background:rgba(0,0,0,.14)}' +
    /* sel yang dibuka: tampil di atas sel lain, menampilkan semua event hari itu */
    '.cal-open{overflow:visible!important;z-index:40;height:auto!important;min-height:100%!important;background:var(--cal-open-bg,#fff);box-shadow:0 8px 28px rgba(0,0,0,.22);border-radius:10px}' +
    '.cal-open .day-events-container,.cal-open [data-ext-day-container]{overflow:visible!important}' +
    /* mode ukur: baris dibuat setinggi isi aslinya (dipakai script untuk membagi tinggi antar-minggu) */
    '#month-calendar-grid.cal-measure,#ext-month-calendar-grid.cal-measure{flex:none!important;height:auto!important;overflow:visible!important;grid-template-rows:none!important;grid-auto-rows:auto!important}' +
    '.cal-measure>div{overflow:visible!important}.cal-measure .day-events-container{overflow:visible!important}' +
    /* teks lain di kalender: judul bulan, nama hari, nomor tanggal, badge */
    '#month-view-title,#ext-month-view-title{font-size:calc(var(--cal-fs) + 7px)!important;line-height:1.2}' +
    '#calendar-session-count,#ext-calendar-session-count{font-size:calc(var(--cal-fs) + 1px)!important}' +
    '#view-month>div:nth-child(2),#ext-view-month>div:nth-child(2){font-size:calc(var(--cal-fs) + 1px)!important;padding-top:8px!important;padding-bottom:8px!important}' +
    '#view-month>div:nth-child(2)>div,#ext-view-month>div:nth-child(2)>div{font-size:inherit!important}' +
    '#month-calendar-grid>div>div:first-child,#ext-month-calendar-grid>div>div:first-child{font-size:calc(var(--cal-fs) + 2px)!important;line-height:1.2}' +
    '#month-calendar-grid>div>div:first-child *,#ext-month-calendar-grid>div>div:first-child *{font-size:inherit!important}' +
    '#month-calendar-grid>div>div:first-child [class*="bg-primary"],#ext-month-calendar-grid>div>div:first-child [class*="bg-emerald"]{font-size:calc(var(--cal-fs) - 2px)!important}' +
    /* bar catatan ringkas: isi terbuka sebagai popover ke atas, tidak menambah tinggi panel */
    '.cal-notes{position:relative;flex:none}.cal-notes>summary{list-style:none}.cal-notes>summary::-webkit-details-marker{display:none}' +
    '.cal-notes-body{position:absolute;bottom:100%;left:0;right:0;z-index:30;max-height:60vh;overflow:auto}' +
    '.cal-notes[open] .cal-notes-chevron{transform:rotate(180deg)}' +
    '@media (max-width:640px){' +
    '#view-month,#ext-view-month{height:calc(100dvh - 72px);min-height:420px}' +
    '#month-calendar-grid>div,#ext-month-calendar-grid>div{padding:2px!important}' +
    '.day-events-container>*:not(.cal-more){font-size:10px!important;padding:1px 3px!important}' +
    '.cal-more{font-size:10px;padding:2px 4px}}';

  function injectCss() {
    if (document.getElementById('cal-fit-css')) return;
    var st = document.createElement('style');
    st.id = 'cal-fit-css';
    st.textContent = FIT_CSS;
    document.head.appendChild(st);
  }

  function containerOf(cell) {
    return cell.querySelector('.day-events-container') || cell.querySelector('[data-ext-day-container]') || cell.lastElementChild;
  }

  function fitCell(cell) {
    var box = containerOf(cell);
    if (!box || box === cell.firstElementChild) return;
    var more = box.querySelector(':scope > .cal-more');
    if (more) more.remove();
    var kids = Array.prototype.filter.call(box.children, function (k) { return !k.classList.contains('cal-more'); });
    kids.forEach(function (k) {
      k.style.display = '';
      if (!k.title) k.title = (k.textContent || '').replace(/\s+/g, ' ').trim();
    });
    if (!kids.length || cell.classList.contains('cal-open')) return;
    if (!box.clientHeight) return;
    if (box.scrollHeight <= box.clientHeight + 1) return;

    var hidden = 0, chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'cal-more';
    box.appendChild(chip);
    for (var i = kids.length - 1; i >= 0 && box.scrollHeight > box.clientHeight + 1; i--) {
      kids[i].style.display = 'none';
      hidden++;
      chip.textContent = '+' + hidden + ' lagi';
    }
    if (!hidden) { chip.remove(); return; }
    chip.title = 'Tampilkan semua agenda hari ini';
    chip.addEventListener('click', function (ev) {
      ev.stopPropagation();
      closeOpenCells();
      cell.classList.add('cal-open');
      var bg = getComputedStyle(cell.closest('[id$="view-month"]') || document.body).backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)') cell.style.setProperty('--cal-open-bg', bg);
      kids.forEach(function (k) { k.style.display = ''; });
      chip.remove();
    });
  }

  function closeOpenCells() {
    var open = document.querySelectorAll('.cal-open');
    if (!open.length) return;
    Array.prototype.forEach.call(open, function (c) { c.classList.remove('cal-open'); });
    scheduleFit();
  }

  var fitQueued = false;
  function scheduleFit() {
    if (fitQueued) return;
    fitQueued = true;
    requestAnimationFrame(function () { fitQueued = false; runFit(); });
  }

  var observers = [];
  function resetCell(cell) {
    var box = containerOf(cell);
    if (!box) return;
    var more = box.querySelector(':scope > .cal-more');
    if (more) more.remove();
    Array.prototype.forEach.call(box.children, function (k) { if (!k.classList.contains('cal-more')) k.style.display = ''; });
  }

  /* Bagi tinggi panel antar-minggu menurut isinya: minggu kosong dikecilkan, minggu padat dibesarkan,
     sehingga judul agenda bisa tampil lengkap (2 baris) dan lebih sedikit yang jadi "+N lagi". */
  function allocateRows(grid) {
    var cells = Array.prototype.slice.call(grid.children);
    if (!cells.length || cells.some(function (c) { return c.classList.contains('cal-open'); })) return;
    cells.forEach(resetCell);
    grid.style.removeProperty('grid-template-rows');
    grid.classList.add('cal-measure');
    var rows = Math.ceil(cells.length / 7), need = [], r, i;
    for (r = 0; r < rows; r++) {
      var mx = 0;
      for (i = r * 7; i < Math.min(cells.length, r * 7 + 7); i++) mx = Math.max(mx, cells[i].offsetHeight);
      need.push(Math.max(mx, 40));
    }
    grid.classList.remove('cal-measure');
    var avail = grid.clientHeight;
    if (!avail || !rows) return;
    var total = need.reduce(function (a, b) { return a + b; }, 0), h;
    if (total <= avail) {
      var extra = (avail - total) / rows;
      h = need.map(function (n) { return n + extra; });
    } else {
      var lo = 0, hi = Math.max.apply(null, need);
      for (i = 0; i < 40; i++) {
        var mid = (lo + hi) / 2;
        var sum = need.reduce(function (a, n) { return a + Math.min(n, mid); }, 0);
        if (sum > avail) hi = mid; else lo = mid;
      }
      h = need.map(function (n) { return Math.min(n, lo); });
      var left = avail - h.reduce(function (a, b) { return a + b; }, 0);
      var capped = need.filter(function (n) { return n > lo; }).length || rows;
      h = h.map(function (v, k) { return need[k] > lo ? v + left / capped : v; });
    }
    grid.style.setProperty('grid-template-rows', h.map(function (v) { return v.toFixed(1) + 'px'; }).join(' '), 'important');
  }

  function runFit() {
    observers.forEach(function (o) { o.disconnect(); });
    ['month-calendar-grid', 'ext-month-calendar-grid'].forEach(function (id) {
      var grid = document.getElementById(id);
      if (grid && grid.offsetParent !== null) {
        allocateRows(grid);
        Array.prototype.forEach.call(grid.children, fitCell);
      }
    });
    observe();
  }

  function observe() {
    observers = [];
    ['month-calendar-grid', 'ext-month-calendar-grid'].forEach(function (id) {
      var grid = document.getElementById(id);
      if (!grid) return;
      var mo = new MutationObserver(function (muts) {
        var real = muts.some(function (m) {
          if (m.type === 'attributes') return false;
          var nodes = Array.prototype.slice.call(m.addedNodes).concat(Array.prototype.slice.call(m.removedNodes));
          return !nodes.length || nodes.some(function (n) { return !(n.classList && n.classList.contains('cal-more')); });
        });
        if (real) scheduleFit();
      });
      mo.observe(grid, { childList: true, subtree: true });
      observers.push(mo);
    });
    ['view-month', 'ext-view-month'].forEach(function (id) {
      var p = document.getElementById(id);
      if (!p) return;
      var mo = new MutationObserver(function () { scheduleFit(); scrollPanelIntoView(p); });
      mo.observe(p, { attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
      observers.push(mo);
    });
  }

  /* saat tampilan bulanan baru dibuka, geser halaman sampai panel kalender menempel di bawah header */
  var lastShown = {};
  function scrollPanelIntoView(p) {
    var visible = p.offsetParent !== null;
    var was = lastShown[p.id];
    lastShown[p.id] = visible;
    if (!visible || was) return;
    var top = p.getBoundingClientRect().top;
    if (top > 90 || top < 60) {
      window.scrollTo({ top: Math.max(0, window.pageYOffset + top - 72), behavior: 'smooth' });
    }
  }

  function setCalZoom() {
    var z = Math.min(1.3, Math.max(1, window.innerWidth / 1300));
    document.documentElement.style.setProperty('--cal-zoom', z.toFixed(3));
  }

  function initFit() {
    injectCss();
    setCalZoom();
    window.addEventListener('resize', setCalZoom);
    runFit();
    document.addEventListener('click', function (e) {
      if (!e.target.closest || !e.target.closest('.cal-open')) closeOpenCells();
      Array.prototype.forEach.call(document.querySelectorAll('details.cal-notes[open]'), function (d) {
        if (!d.contains(e.target)) d.removeAttribute('open');
      });
    });
    window.addEventListener('resize', function () { closeOpenCells(); scheduleFit(); });
    window.addEventListener('load', scheduleFit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleFit);
    // kalender dirender asinkron setelah data Google Sheets tiba; cek ulang beberapa kali
    [400, 1200, 2500, 5000].forEach(function (ms) { setTimeout(function () { runFit(); }, ms); });
    ['view-month', 'ext-view-month'].forEach(function (id) {
      var p = document.getElementById(id);
      if (p) lastShown[id] = p.offsetParent !== null;
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initFit);
  else initFit();
})();