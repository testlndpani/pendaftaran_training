/**
 * =============================================================================
 * MODUL PENGGUNAAN & JADWAL RUANGAN (roomList & roomsUse)
 * PT Merdeka Copper Gold / Pani Gold Project
 * 
 * Fitur Lengkap:
 * 1. Kotak Harian (Daily Room Lanes)
 * 2. Kotak Mingguan (Weekly Room Lanes per Ruangan - Senin s/d Minggu)
 * 3. Kalender Bulanan (Monthly Room Calendar Grid dengan penanda warna ruangan)
 * 4. Matriks Jam Kerja (Hourly Matrix 08:00 - 17:00 dengan overlap rentang jam)
 * 5. Daftar Agenda Lengkap (Tabel dengan filter dan pencarian)
 * 6. Pencocokan Presisi Ruangan (Exact Room Match tanpa bocor antar partisi)
 * 7. Resolusi Real Judul Silabus, Trainer/PIC, Batch, & ID dari Master Data
 * 8. Sanitasi String Tanggal & Kalkulasi Otomatis Start Hour + Duration = End Hour
 * =============================================================================
 */
(function() {
  'use strict';

  // 1. STATE & DEFAULT CONFIGURATION
  let ROOMS_LIST = [
    { name: "Gold Room 2", capacity: 20, pic: "LnD", contact: "", description: "Ruang Pelatihan Kapasitas 20 Kursi" },
    { name: "Gold Room 3", capacity: 10, pic: "LnD", contact: "", description: "Ruang Pelatihan / Diskusi Kapasitas 10 Kursi" },
    { name: "Gold Room 2 & 3", capacity: 30, pic: "LnD", contact: "", description: "Ruang Gabungan Partisi Kapasitas 30 Kursi", is_partition: true },
    { name: "GSG", capacity: 100, pic: "Aden & Site Service", contact: "", description: "Gedung Serba Guna / Aula Utama Kapasitas 100 Kursi" },
    { name: "Torosajie - Meeting Room", capacity: 15, pic: "Ms", contact: "", description: "Ruang Rapat Torosajie Kapasitas 15 Kursi" },
    { name: "Hulawa - Meeting Room", capacity: 20, pic: "Ms", contact: "", description: "Ruang Rapat Hulawa Kapasitas 20 Kursi" }
  ];

  let ROOMS_USE_DATA = [];
  let currentRoomDate = new Date();
  let currentCalRoomDate = new Date();
  let currentRoomSubView = 'lanes'; // 'lanes' | 'weekly-lanes' | 'monthly' | 'matrix' | 'list'
  let isRoomLoading = false;

  // 2. HELPER NORMALISASI RUANGAN (EXACT MATCHING - MENCEGAH BOCOR ANTAR PARTISI)
  function normalizeRoomName(name) {
    if (!name) return '';
    return String(name)
      .toLowerCase()
      .replace(/\s*&\s*/g, ' and ')
      .replace(/\s*dan\s*/g, ' and ')
      .replace(/[^a-z0-9]/g, '');
  }

  function doesMatchRoom(roomVal, targetRoomName) {
    if (!roomVal || !targetRoomName) return false;
    return normalizeRoomName(roomVal) === normalizeRoomName(targetRoomName);
  }

  // 3. HELPER WAKTU, TANGGAL & KALKULASI DURASI
  function formatTimeHour(hStr) {
    if (!hStr) return '08:00';
    let s = String(hStr).trim().replace('.', ':');
    if (s.includes('-')) s = s.split('-')[0].trim();
    const m = s.match(/^(\d{1,2}):?(\d{2})?/);
    if (m) {
      const hh = String(parseInt(m[1], 10)).padStart(2, '0');
      const mm = m[2] ? m[2] : '00';
      return `${hh}:${mm}`;
    }
    return '08:00';
  }

  function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const s = formatTimeHour(timeStr);
    const parts = s.split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return (h * 60) + m;
  }

  function minutesToTime(totalMinutes) {
    const norm = ((totalMinutes % 1440) + 1440) % 1440;
    const h = Math.floor(norm / 60);
    const m = norm % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  function calculateEndHour(startHourStr, durationVal) {
    const startMins = timeToMinutes(startHourStr || '08:00');
    let dur = parseFloat(durationVal);
    if (isNaN(dur) || dur <= 0) dur = 2; // default 2 jam jika durasi kosong
    const durMinutes = Math.round(dur * 60);
    return minutesToTime(startMins + durMinutes);
  }

  function isDateGarbage(s) {
    if (!s) return false;
    const str = String(s).trim();
    return /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+[A-Z][a-z]{2}\s+\d{1,2}\s+\d{4}/i.test(str) ||
           /Date\(\d+,\d+,\d+\)/i.test(str) ||
           /Waktu Indonesia/i.test(str) ||
           /GMT[+-]\d{4}/i.test(str);
  }

  function parseToDateObj(v) {
    if (!v) return null;
    if (v instanceof Date && !isNaN(v.getTime())) return v;
    const s = String(v).trim();

    // 1. Format GViz Date(year, month, day) - bulan 0-indexed
    const gvizMatch = s.match(/Date\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\)/);
    if (gvizMatch) {
      return new Date(parseInt(gvizMatch[1], 10), parseInt(gvizMatch[2], 10), parseInt(gvizMatch[3], 10));
    }

    // 2. Format ISO YYYY-MM-DD
    const isoMatch = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      return new Date(parseInt(isoMatch[1], 10), parseInt(isoMatch[2], 10) - 1, parseInt(isoMatch[3], 10));
    }

    // 3. Format Slash MM/DD/YYYY atau DD/MM/YYYY
    const slashMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (slashMatch) {
      let p1 = parseInt(slashMatch[1], 10);
      let p2 = parseInt(slashMatch[2], 10);
      let yr = parseInt(slashMatch[3], 10);
      let m = p1;
      let d = p2;
      if (p1 > 12 && p2 <= 12) {
        d = p1;
        m = p2;
      }
      return new Date(yr, m - 1, d);
    }

    const p = Date.parse(s);
    return isNaN(p) ? null : new Date(p);
  }

  function toIsoDate(d) {
    if (!d || !(d instanceof Date) || isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function formatIndoDateLong(d) {
    if (!d || !(d instanceof Date) || isNaN(d.getTime())) return '-';
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  function formatIndoDateShort(d) {
    if (!d || !(d instanceof Date) || isNaN(d.getTime())) return '-';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  function formatIndoMonthYear(d) {
    if (!d || !(d instanceof Date) || isNaN(d.getTime())) return '-';
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  function isSameDay(d1, d2) {
    if (!d1 || !d2) return false;
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  function isScheduleActiveOnDate(s, targetDate) {
    if (!s || !targetDate) return false;
    const tIso = toIsoDate(targetDate);
    if (!tIso) return false;

    if (s.date_iso && s.date_iso === tIso) return true;
    if (s.tanggal_iso && s.tanggal_iso === tIso) return true;

    if (s.start_date_obj && s.end_date_obj) {
      const targetTime = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
      const startTime = new Date(s.start_date_obj.getFullYear(), s.start_date_obj.getMonth(), s.start_date_obj.getDate()).getTime();
      const endTime = new Date(s.end_date_obj.getFullYear(), s.end_date_obj.getMonth(), s.end_date_obj.getDate()).getTime();
      return targetTime >= startTime && targetTime <= endTime;
    }

    if (s.date_obj) {
      return isSameDay(s.date_obj, targetDate);
    }

    return false;
  }

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getRoomColorTheme(roomName) {
    const r = String(roomName || '').toLowerCase();
    if (r.includes('gold room 2 & 3') || r.includes('gabungan') || (r.includes('gold room 2') && r.includes('3'))) {
      return {
        badgeBg: 'bg-indigo-100 text-indigo-900 border-indigo-200',
        badgePill: 'bg-indigo-600 text-white',
        border: 'border-indigo-400',
        cardBorder: 'border-indigo-200',
        accentBg: 'bg-indigo-50/60',
        headerBg: 'bg-gradient-to-r from-indigo-900 to-indigo-800 text-white',
        chipText: 'text-indigo-700',
        dotColor: 'bg-indigo-600',
        calPill: 'bg-indigo-100 text-indigo-900 hover:bg-indigo-200 border-indigo-300'
      };
    } else if (r.includes('gold room 2')) {
      return {
        badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-200',
        badgePill: 'bg-emerald-700 text-white',
        border: 'border-emerald-400',
        cardBorder: 'border-emerald-200',
        accentBg: 'bg-emerald-50/60',
        headerBg: 'bg-gradient-to-r from-emerald-900 to-teal-800 text-white',
        chipText: 'text-emerald-700',
        dotColor: 'bg-emerald-600',
        calPill: 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200 border-emerald-300'
      };
    } else if (r.includes('gold room 3')) {
      return {
        badgeBg: 'bg-sky-100 text-sky-900 border-sky-200',
        badgePill: 'bg-sky-700 text-white',
        border: 'border-sky-400',
        cardBorder: 'border-sky-200',
        accentBg: 'bg-sky-50/60',
        headerBg: 'bg-gradient-to-r from-cyan-900 to-blue-800 text-white',
        chipText: 'text-sky-700',
        dotColor: 'bg-sky-600',
        calPill: 'bg-sky-100 text-sky-900 hover:bg-sky-200 border-sky-300'
      };
    } else if (r.includes('gsg')) {
      return {
        badgeBg: 'bg-amber-100 text-amber-950 border-amber-200',
        badgePill: 'bg-amber-700 text-white',
        border: 'border-amber-400',
        cardBorder: 'border-amber-200',
        accentBg: 'bg-amber-50/60',
        headerBg: 'bg-gradient-to-r from-amber-900 to-yellow-800 text-white',
        chipText: 'text-amber-800',
        dotColor: 'bg-amber-600',
        calPill: 'bg-amber-100 text-amber-950 hover:bg-amber-200 border-amber-300'
      };
    } else if (r.includes('torosajie')) {
      return {
        badgeBg: 'bg-purple-100 text-purple-900 border-purple-200',
        badgePill: 'bg-purple-700 text-white',
        border: 'border-purple-400',
        cardBorder: 'border-purple-200',
        accentBg: 'bg-purple-50/60',
        headerBg: 'bg-gradient-to-r from-purple-900 to-violet-800 text-white',
        chipText: 'text-purple-700',
        dotColor: 'bg-purple-600',
        calPill: 'bg-purple-100 text-purple-900 hover:bg-purple-200 border-purple-300'
      };
    } else if (r.includes('hulawa')) {
      return {
        badgeBg: 'bg-rose-100 text-rose-900 border-rose-200',
        badgePill: 'bg-rose-700 text-white',
        border: 'border-rose-400',
        cardBorder: 'border-rose-200',
        accentBg: 'bg-rose-50/60',
        headerBg: 'bg-gradient-to-r from-rose-900 to-pink-800 text-white',
        chipText: 'text-rose-700',
        dotColor: 'bg-rose-600',
        calPill: 'bg-rose-100 text-rose-900 hover:bg-rose-200 border-rose-300'
      };
    }
    return {
      badgeBg: 'bg-slate-100 text-slate-800 border-slate-200',
      badgePill: 'bg-slate-700 text-white',
      border: 'border-slate-300',
      cardBorder: 'border-slate-200',
      accentBg: 'bg-slate-50',
      headerBg: 'bg-slate-800 text-white',
      chipText: 'text-slate-700',
      dotColor: 'bg-slate-600',
      calPill: 'bg-slate-100 text-slate-800 hover:bg-slate-200 border-slate-300'
    };
  }

  function getRoomInitials(name) {
    if (!name) return 'R';
    if (name.includes('Gold Room 2 & 3')) return 'GR 2&3';
    if (name.includes('Gold Room 2')) return 'GR 2';
    if (name.includes('Gold Room 3')) return 'GR 3';
    if (name.includes('GSG')) return 'GSG';
    if (name.includes('Torosajie')) return 'TR';
    if (name.includes('Hulawa')) return 'HL';
    return name.slice(0, 4);
  }

  // 4. PENGGABUNGAN SEMUA JADWAL DENGAN LOOKUP AGENDA ID & RESOLUSI DATA VALID
  function getAllRoomSchedules() {
    const list = [];
    const usedAgendaIds = new Set();

    // A. Ambil Data Jadwal Resmi (Internal, External, Agenda Luar)
    const internalList = (window.LIVE_SCHEDULES && Array.isArray(window.LIVE_SCHEDULES) && window.LIVE_SCHEDULES.length > 0)
      ? window.LIVE_SCHEDULES
      : ((window.DATABASE_DATA && Array.isArray(window.DATABASE_DATA))
        ? window.DATABASE_DATA
        : ((typeof LIVE_SCHEDULES !== 'undefined' && Array.isArray(LIVE_SCHEDULES))
          ? LIVE_SCHEDULES
          : []));

    const extList = (window.EXTERNAL_DATA && Array.isArray(window.EXTERNAL_DATA)) ? window.EXTERNAL_DATA : [];
    const agList = (window.AGENDA_DATA && Array.isArray(window.AGENDA_DATA)) ? window.AGENDA_DATA : [];

    // B. Buat Master Lookup Dictionary (Berdasarkan ID & Judul Bersih)
    const masterLookup = {};
    const normKey = (s) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    function registerMaster(id, agenda, pic, room, batch, kuota, sisa, cat, catLabel, dur, startHr, dObj, endObj) {
      const info = {
        id_jadwal: id || '',
        agenda: agenda || '',
        pic: pic || '-',
        room: room || '',
        batch: batch || '',
        kuota: kuota || 0,
        sisa_kuota: sisa != null ? sisa : (kuota || 0),
        category: cat,
        category_label: catLabel,
        duration: parseFloat(dur) || 2,
        start_hour: formatTimeHour(startHr || '08:00'),
        date_obj: dObj,
        end_date_obj: endObj,
        date_iso: dObj ? toIsoDate(dObj) : ''
      };

      if (id && !isDateGarbage(id)) {
        masterLookup[id.trim().toLowerCase()] = info;
      }
      if (agenda && !isDateGarbage(agenda)) {
        masterLookup[normKey(agenda)] = info;
        if (dObj) {
          masterLookup[`${normKey(agenda)}_${toIsoDate(dObj)}`] = info;
        }
      }
    }

    internalList.forEach(item => {
      if (!item) return;
      const dObj = item.date_obj || parseToDateObj(item.start || item.tanggal_pelatihan || item.tanggal);
      const endObj = item.end_date_obj || parseToDateObj(item.end || item.tanggal_selesai || item.tanggal_pelatihan || item.tanggal);
      registerMaster(
        item.id_jadwal || item.id,
        item.agenda || item.nama_silabus || item.nama_pelatihan,
        item.pic || item.nama_trainer,
        item.room || item.ruangan,
        item.batch,
        item.kuota || item.kuota_peserta,
        item.sisa_kuota,
        'internal',
        'Internal Training',
        item.duration_hour || item.duration || 2,
        item.start_hour || item.jam_mulai,
        dObj,
        endObj
      );
    });

    extList.forEach(item => {
      if (!item) return;
      const dObj = item.date_obj || parseToDateObj(item.start || item.tanggal);
      registerMaster(
        item.id_external || item.id_jadwal || item.id,
        item.agenda || item.nama_program,
        item.pic || item.lembaga,
        item.room || item.ruangan,
        item.batch,
        item.kuota,
        item.sisa_kuota,
        'external',
        'External Training',
        item.duration_hour || item.duration || 2,
        item.start_hour || item.jam_mulai,
        dObj,
        dObj
      );
    });

    agList.forEach(item => {
      if (!item) return;
      const dObj = item.date_obj || parseToDateObj(item.start || item.tanggal);
      registerMaster(
        item.id_agenda || item.id_jadwal || item.id,
        item.agenda || item.nama_agenda,
        item.pic,
        item.room || item.ruangan || item.location,
        '',
        0,
        0,
        'agenda',
        'Agenda Training',
        item.duration || 2,
        item.start_hour || item.jam_mulai,
        dObj,
        dObj
      );
    });

    // C. Proses Data Penggunaan Ruangan dari ROOMS_USE_DATA (Sumber Utama Ruangan)
    ROOMS_USE_DATA.forEach((row, idx) => {
      if (!row) return;

      const dObj = row.date_obj || parseToDateObj(row.date);
      if (!dObj) return;
      const iso = toIsoDate(dObj);

      const rawTitleOrId = String(row.agenda_id || row.agenda || row.id || '').trim();
      const cleanTitleKey = normKey(rawTitleOrId);

      // Cari di master data dengan prioritas: (Title + Tanggal) -> Title -> ID
      let matched = masterLookup[`${cleanTitleKey}_${iso}`] ||
                    masterLookup[cleanTitleKey] ||
                    masterLookup[rawTitleOrId.toLowerCase()] ||
                    null;

      // Sanitasi Nama Agenda: JANGAN PERNAH gunakan string tanggal sebagai judul agenda!
      let resolvedAgenda = '';
      if (matched && matched.agenda) {
        resolvedAgenda = matched.agenda;
      } else if (rawTitleOrId && !isDateGarbage(rawTitleOrId)) {
        resolvedAgenda = rawTitleOrId;
      } else if (row.notes && !isDateGarbage(row.notes)) {
        resolvedAgenda = row.notes;
      } else {
        resolvedAgenda = 'Kegiatan Penggunaan Ruangan';
      }

      // Sanitasi ID Agenda
      let resolvedId = '';
      if (matched && matched.id_jadwal) {
        resolvedId = matched.id_jadwal;
      } else if (rawTitleOrId && !isDateGarbage(rawTitleOrId) && /^[A-Z0-9_\-]+$/i.test(rawTitleOrId)) {
        resolvedId = rawTitleOrId;
      } else {
        resolvedId = 'USE-' + (row.no || (idx + 1));
      }

      const roomName = row.room || (matched ? matched.room : '') || 'Gold Room 2 & 3';
      const rawHour = row.hour || (matched ? matched.start_hour : '08:00');
      const startHour = formatTimeHour(rawHour);
      const duration = parseFloat(row.duration || (matched ? matched.duration : 2)) || 2;
      const endHour = calculateEndHour(startHour, duration);

      const resolvedPic = (matched && matched.pic && matched.pic !== '-')
        ? matched.pic
        : (row.pic && row.pic !== '-' && !isDateGarbage(row.pic) ? row.pic : '-');

      list.push({
        source: 'rooms_use',
        id_jadwal: resolvedId,
        agenda: resolvedAgenda,
        room: roomName,
        date_iso: iso,
        date_obj: dObj,
        end_date_obj: dObj,
        start_hour: startHour,
        end_hour: endHour,
        duration: duration,
        start_minutes: timeToMinutes(startHour),
        end_minutes: timeToMinutes(endHour),
        hour_display: `${startHour} - ${endHour} WIB`,
        pic: resolvedPic,
        contact: matched ? (matched.contact || '') : (row.notes || ''),
        category: matched ? matched.category : 'custom',
        category_label: matched ? matched.category_label : 'Penggunaan Ruangan',
        batch: matched ? matched.batch : '',
        kuota: matched ? matched.kuota : 0,
        sisa_kuota: matched ? matched.sisa_kuota : 0,
        status: matched ? matched.status : 'CONFIRMED'
      });

      if (resolvedId) usedAgendaIds.add(resolvedId.toLowerCase());
      if (resolvedAgenda) usedAgendaIds.add(normKey(resolvedAgenda) + '_' + iso);
    });

    // D. Masukkan Pelatihan Internal/External yang memiliki ruangan tapi belum ada di roomsUse
    internalList.forEach(item => {
      if (!item || !item.ruangan) return;
      const id = String(item.id_jadwal || item.id || '').trim();
      const dObj = item.date_obj || parseToDateObj(item.start || item.tanggal_pelatihan || item.tanggal);
      const iso = dObj ? toIsoDate(dObj) : '';
      const agendaTitle = item.agenda || item.nama_silabus || item.nama_pelatihan || '';

      if (id && usedAgendaIds.has(id.toLowerCase())) return;
      if (agendaTitle && usedAgendaIds.has(normKey(agendaTitle) + '_' + iso)) return;

      const endObj = item.end_date_obj || parseToDateObj(item.end || item.tanggal_selesai || item.tanggal_pelatihan || item.tanggal);
      const startHour = formatTimeHour(item.start_hour || item.jam_mulai || '08:00');
      const duration = parseFloat(item.duration_hour || item.duration || 2) || 2;
      const endHour = calculateEndHour(startHour, duration);

      list.push({
        source: 'internal_training',
        id_jadwal: id || 'JADWAL-' + Date.now(),
        agenda: agendaTitle || 'Pelatihan Internal',
        room: item.ruangan,
        date_iso: iso,
        date_obj: dObj,
        end_date_obj: endObj,
        start_hour: startHour,
        end_hour: endHour,
        duration: duration,
        start_minutes: timeToMinutes(startHour),
        end_minutes: timeToMinutes(endHour),
        hour_display: `${startHour} - ${endHour} WIB`,
        pic: item.nama_trainer || item.pic || 'Trainer L&D',
        contact: item.trainer_contact || '',
        category: 'internal',
        category_label: 'Internal Training',
        batch: item.batch ? `Batch ${item.batch}` : '',
        kuota: item.kuota || item.kuota_peserta || 0,
        sisa_kuota: item.sisa_kuota != null ? item.sisa_kuota : (item.kuota || 0),
        status: item.status || item.status_pelatihan || 'CONFIRMED'
      });
    });

    return list;
  }

  // 5. FETCH DATA LANGSUNG DARI GVIZ & SINKRONISASI ONLINE
  async function fetchRoomsData() {
    if (isRoomLoading) return;
    isRoomLoading = true;
    const syncLabel = document.getElementById('room-sync-status');
    if (syncLabel) {
      syncLabel.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-500 animate-spin"></span> Menghubungkan database ruangan...`;
    }

    const SPREADSHEET_ID = '1Y5IQUSN84p2Os1e9wxraDIfZF6UfOql4Y5EdXbv850A';
    const GID_ROOM_LIST = '2012773260';
    const GID_ROOMS_USE = '329050986';

    try {
      // 1. Ambil data langsung dari Google Sheets via GViz JSONP (Live, Real-time, Bebas Cache Rusak)
      if (typeof fetchGvizSheetJson === 'function') {
        const [respRooms, respUse] = await Promise.all([
          fetchGvizSheetJson(SPREADSHEET_ID, 'gid=' + GID_ROOM_LIST).catch(() => null),
          fetchGvizSheetJson(SPREADSHEET_ID, 'gid=' + GID_ROOMS_USE).catch(() => null)
        ]);

        if (respRooms && respRooms.table && Array.isArray(respRooms.table.rows)) {
          const parsedRooms = [];
          respRooms.table.rows.forEach(r => {
            const c = r.c || [];
            const getVal = (i) => (c[i] ? (c[i].v !== undefined ? c[i].v : c[i].f) : '') || '';
            const name = String(getVal(0) || '').trim();
            if (!name) return;
            parsedRooms.push({
              name: name,
              capacity: parseInt(getVal(1), 10) || 20,
              pic: String(getVal(2) || 'LnD').trim(),
              contact: String(getVal(3) || '').trim(),
              description: String(getVal(4) || '').trim()
            });
          });
          if (parsedRooms.length > 0) ROOMS_LIST = parsedRooms;
        }

        if (respUse && respUse.table && Array.isArray(respUse.table.rows)) {
          const parsedUse = [];
          respUse.table.rows.forEach((r, idx) => {
            const c = r.c || [];
            const getVal = (i) => (c[i] ? (c[i].v !== undefined ? c[i].v : c[i].f) : '') || '';
            const getFmt = (i) => (c[i] ? (c[i].f !== undefined ? c[i].f : c[i].v) : '') || '';

            const noVal = String(getVal(0) || (idx + 1)).trim();
            const rawTitle = String(getVal(1) || '').trim();
            const rawDate = getFmt(2) || String(getVal(2) || '');
            const roomVal = String(getVal(3) || '').trim();
            const hourVal = String(getVal(4) || '').trim();
            const durVal = parseFloat(getVal(5)) || 2;

            if (!rawDate && !rawTitle && !roomVal) return;

            parsedUse.push({
              no: noVal,
              agenda_id: rawTitle,
              agenda: rawTitle,
              date: rawDate,
              room: roomVal,
              hour: hourVal,
              duration: durVal,
              date_obj: parseToDateObj(rawDate)
            });
          });

          if (parsedUse.length > 0) {
            ROOMS_USE_DATA = parsedUse;
          }
        }
      }

      updateRoomDropdownOptions();
      renderRoomOverviewCards();
      renderRoomUsagePage();
      renderCalRoomLanes();

      if (syncLabel) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        syncLabel.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Database Ruangan: Terhubung (${timeStr} WIB &bull; ${ROOMS_LIST.length} Ruang &bull; ${ROOMS_USE_DATA.length} Agenda)`;
      }
    } catch (err) {
      console.warn("fetchRoomsData error:", err);
      if (syncLabel) {
        syncLabel.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-500"></span> Menggunakan data lokal ruangan (${ROOMS_LIST.length} Ruang)`;
      }
    } finally {
      isRoomLoading = false;
    }
  }

  function updateRoomDropdownOptions() {
    const optionsHtml = ROOMS_LIST.map(r => `<option value="${escapeHtml(r.name)}">${escapeHtml(r.name)} (Kapasitas: ${r.capacity || '-'})</option>`).join('');

    const schedFilter = document.getElementById('schedule-room-filter');
    if (schedFilter) {
      schedFilter.innerHTML = `<option value="all">Semua Ruangan</option>` + optionsHtml;
    }

    const roomFilter = document.getElementById('room-filter-select');
    if (roomFilter) {
      roomFilter.innerHTML = `<option value="all">Semua Ruangan</option>` + optionsHtml;
    }

    const rbRoom = document.getElementById('rb-room');
    if (rbRoom) {
      rbRoom.innerHTML = ROOMS_LIST.map(r => `<option value="${escapeHtml(r.name)}">${escapeHtml(r.name)} (Kapasitas: ${r.capacity} Orang - ${r.pic || 'PIC'})</option>`).join('');
    }
  }

  // 6. DETEKSI BENTROK PRESISI WAKTU (MEMPERHITUNGKAN JAM MULAI, DURASI, & PARTISI)
  function checkAndDisplayRoomConflicts(targetDate) {
    const banner = document.getElementById('room-conflict-banner');
    if (!banner) return;

    const allSchedules = getAllRoomSchedules();
    const daySchedules = allSchedules.filter(s => isScheduleActiveOnDate(s, targetDate));

    const conflicts = [];
    for (let i = 0; i < daySchedules.length; i++) {
      for (let j = i + 1; j < daySchedules.length; j++) {
        const a = daySchedules[i];
        const b = daySchedules[j];

        const normA = normalizeRoomName(a.room);
        const normB = normalizeRoomName(b.room);

        let hasRoomOverlap = false;
        if (normA === normB) {
          hasRoomOverlap = true;
        } else if (
          (normA.includes('goldroom2and3') && (normB.includes('goldroom2') || normB.includes('goldroom3'))) ||
          (normB.includes('goldroom2and3') && (normA.includes('goldroom2') || normA.includes('goldroom3')))
        ) {
          hasRoomOverlap = true;
        }

        if (hasRoomOverlap) {
          const startA = a.start_minutes != null ? a.start_minutes : timeToMinutes(a.start_hour);
          const endA = a.end_minutes != null ? a.end_minutes : (startA + Math.round((a.duration || 2) * 60));
          const startB = b.start_minutes != null ? b.start_minutes : timeToMinutes(b.start_hour);
          const endB = b.end_minutes != null ? b.end_minutes : (startB + Math.round((b.duration || 2) * 60));

          const hasTimeOverlap = (startA < endB && startB < endA);

          if (hasTimeOverlap) {
            conflicts.push({ itemA: a, itemB: b, date: targetDate });
          }
        }
      }
    }

    if (conflicts.length > 0) {
      banner.classList.remove('hidden');
      const descEl = document.getElementById('room-conflict-desc');
      if (descEl) {
        const c = conflicts[0];
        descEl.innerHTML = `<strong>Perhatian Bentrok Jadwal:</strong> Terjadi tumpang tindih jam pemakaian antara <em>"${escapeHtml(c.itemA.agenda)}"</em> (${escapeHtml(c.itemA.room)}, ${escapeHtml(c.itemA.start_hour)}-${escapeHtml(c.itemA.end_hour)} WIB) dan <em>"${escapeHtml(c.itemB.agenda)}"</em> (${escapeHtml(c.itemB.room)}, ${escapeHtml(c.itemB.start_hour)}-${escapeHtml(c.itemB.end_hour)} WIB) pada ${formatIndoDateLong(targetDate)}.`;
      }
    } else {
      banner.classList.add('hidden');
    }
  }

  // 7. RENDER UTAMA HALAMAN PENGGUNAAN RUANGAN (section-ruangan)
  function renderRoomUsagePage() {
    const sec = document.getElementById('section-ruangan');
    if (!sec || sec.classList.contains('hidden')) return;

    renderRoomKpiRibbon();
    renderRoomOverviewCards();
    updateRoomDateNavigatorUI();
    checkAndDisplayRoomConflicts(currentRoomDate);
    renderActiveRoomSubView();
  }

  // 8. RENDER KPI RIBBON
  function renderRoomKpiRibbon() {
    const allSchedules = getAllRoomSchedules();
    const today = new Date();

    let totalCap = 0;
    ROOMS_LIST.forEach(r => { totalCap += (Number(r.capacity) || 0); });

    const occupiedTodaySet = new Set();
    allSchedules.forEach(s => {
      if (isScheduleActiveOnDate(s, today)) {
        ROOMS_LIST.forEach(r => {
          if (doesMatchRoom(s.room, r.name)) occupiedTodaySet.add(r.name);
        });
      }
    });

    const occupiedCount = occupiedTodaySet.size;
    const freeCount = Math.max(0, ROOMS_LIST.length - occupiedCount);

    const now = new Date();
    const dayOfWeek = (now.getDay() + 6) % 7; // 0 = Senin
    const mondayMs = now.getTime() - (dayOfWeek * 86400000);
    const sundayMs = mondayMs + (6 * 86400000);

    const weekCount = allSchedules.filter(s => {
      if (!s.date_obj) return false;
      const t = s.date_obj.getTime();
      return t >= mondayMs - 43200000 && t <= sundayMs + 43200000;
    }).length;

    const elTotal = document.getElementById('room-kpi-total');
    if (elTotal) elTotal.textContent = ROOMS_LIST.length;
    const elCap = document.getElementById('room-kpi-capacity');
    if (elCap) elCap.textContent = totalCap;
    const elOcc = document.getElementById('room-kpi-occupied');
    if (elOcc) elOcc.textContent = occupiedCount;
    const elFree = document.getElementById('room-kpi-available');
    if (elFree) elFree.textContent = freeCount;
    const elWeek = document.getElementById('room-kpi-week-sessions');
    if (elWeek) elWeek.textContent = weekCount;
  }

  // 9. RENDER OVERVIEW CARDS ("KOTAK KHUSUS UNTUK TIAP RUANGAN")
  function renderRoomOverviewCards() {
    const container = document.getElementById('rooms-overview-cards');
    if (!container) return;

    const allSchedules = getAllRoomSchedules();
    const today = new Date();

    let html = '';
    ROOMS_LIST.forEach(room => {
      const theme = getRoomColorTheme(room.name);
      const isOccupiedToday = allSchedules.some(s => isScheduleActiveOnDate(s, today) && doesMatchRoom(s.room, room.name));
      const todayScheds = allSchedules.filter(s => isScheduleActiveOnDate(s, today) && doesMatchRoom(s.room, room.name));

      html += `
        <div class="relative flex flex-col justify-between p-4 rounded-2xl bg-surface-container-lowest border ${theme.cardBorder} shadow-xs hover:shadow-md transition-all group overflow-hidden">
          <div class="absolute top-0 left-0 right-0 h-1.5 ${theme.headerBg}"></div>

          <div>
            <div class="flex items-start justify-between gap-2 mt-1 mb-2">
              <div class="flex items-center gap-2">
                <span class="w-8 h-8 rounded-xl ${theme.badgeBg} flex items-center justify-center font-bold text-xs">
                  <span class="material-symbols-outlined text-[18px]">meeting_room</span>
                </span>
                <div>
                  <h4 class="font-bold text-sm text-on-surface leading-tight">${escapeHtml(room.name)}</h4>
                  <p class="text-[11px] text-on-surface-variant">PIC: ${escapeHtml(room.pic || 'LnD')}</p>
                </div>
              </div>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${isOccupiedToday ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'}">
                ${isOccupiedToday ? 'Terpakai' : 'Tersedia'}
              </span>
            </div>

            <div class="space-y-1.5 text-xs text-on-surface-variant my-3 pt-2 border-t border-outline-variant/30">
              <div class="flex items-center justify-between">
                <span class="text-outline">Kapasitas:</span>
                <span class="font-semibold text-on-surface">${room.capacity} Orang</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-outline">Status Hari Ini:</span>
                <span class="font-semibold ${isOccupiedToday ? 'text-amber-700' : 'text-emerald-700'}">
                  ${isOccupiedToday ? `${todayScheds.length} Sesi Terjadwal` : 'Kosong (Siap Pakai)'}
                </span>
              </div>
              ${room.is_partition ? `
                <div class="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-[10.5px]">
                  <strong>Catatan Partisi:</strong> Gabungan Gold Room 2 & 3.
                </div>
              ` : ''}
            </div>
          </div>

          <div class="pt-3 border-t border-outline-variant/30 flex items-center gap-2">
            <button type="button" onclick="filterByRoomCard('${escapeHtml(room.name)}')" class="flex-1 h-8 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
              <span class="material-symbols-outlined text-[16px]">visibility</span>
              <span>Lihat Jadwal</span>
            </button>
            <button type="button" onclick="openRoomBookingModal('${escapeHtml(room.name)}')" class="h-8 px-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 text-xs font-semibold inline-flex items-center justify-center gap-1 transition-colors cursor-pointer" title="Booking Ruangan">
              <span class="material-symbols-outlined text-[16px]">add</span>
            </button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  // 10. UPDATE DATE NAVIGATOR UI SESUAI SUB-VIEW (HARIAN, MINGGUAN, BULANAN)
  function updateRoomDateNavigatorUI() {
    const titleEl = document.getElementById('room-view-date-title');
    const badgeEl = document.getElementById('room-view-date-badge');
    const dateInput = document.getElementById('room-date-picker-input');
    const btnToday = document.getElementById('btn-room-nav-today');
    const today = new Date();

    if (dateInput) {
      dateInput.value = toIsoDate(currentRoomDate);
    }

    if (currentRoomSubView === 'weekly-lanes' || currentRoomSubView === 'weekly') {
      const dayOfWeek = (currentRoomDate.getDay() + 6) % 7; // 0 = Senin
      const monday = new Date(currentRoomDate.getFullYear(), currentRoomDate.getMonth(), currentRoomDate.getDate() - dayOfWeek);
      const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);

      const isCurrentWeek = (today >= monday && today <= new Date(sunday.getTime() + 86400000));

      if (btnToday) btnToday.textContent = 'Minggu Ini';
      if (titleEl) {
        titleEl.textContent = `Pekan: ${formatIndoDateShort(monday)} – ${formatIndoDateShort(sunday)}`;
      }
      if (badgeEl) {
        badgeEl.textContent = isCurrentWeek ? 'Minggu Ini' : 'Pekan Terpilih';
        badgeEl.className = isCurrentWeek
          ? 'px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200'
          : 'px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200';
      }
    } else if (currentRoomSubView === 'monthly') {
      const isCurrentMonth = (currentRoomDate.getFullYear() === today.getFullYear() && currentRoomDate.getMonth() === today.getMonth());

      if (btnToday) btnToday.textContent = 'Bulan Ini';
      if (titleEl) {
        titleEl.textContent = formatIndoMonthYear(currentRoomDate);
      }
      if (badgeEl) {
        badgeEl.textContent = isCurrentMonth ? 'Bulan Ini' : 'Bulan Terpilih';
        badgeEl.className = isCurrentMonth
          ? 'px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200'
          : 'px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200';
      }
    } else if (currentRoomSubView === 'list') {
      if (btnToday) btnToday.textContent = 'Hari Ini';
      if (titleEl) titleEl.textContent = 'Semua Jadwal & Penggunaan Ruangan';
      if (badgeEl) {
        badgeEl.textContent = 'Daftar Lengkap';
        badgeEl.className = 'px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200';
      }
    } else {
      const isToday = isSameDay(currentRoomDate, today);

      if (btnToday) btnToday.textContent = 'Hari Ini';
      if (titleEl) {
        titleEl.textContent = formatIndoDateLong(currentRoomDate);
      }
      if (badgeEl) {
        badgeEl.textContent = isToday ? 'Hari Ini' : formatIndoDateShort(currentRoomDate);
        badgeEl.className = isToday
          ? 'px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200'
          : 'px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200';
      }
    }
  }

  // 11. DYNAMIC ROOM SUB-VIEW DISPATCHER
  function renderActiveRoomSubView() {
    const container = document.getElementById('room-schedule-main-container');
    if (!container) return;

    if (currentRoomSubView === 'weekly') {
      currentRoomSubView = 'weekly-lanes';
    }

    document.querySelectorAll('.room-subtab-btn').forEach(btn => {
      const isTarget = btn.id === 'room-subtab-' + currentRoomSubView;
      btn.className = isTarget
        ? 'room-subtab-btn flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg bg-indigo-700 text-white font-label-md text-label-md font-semibold shadow-sm transition-all cursor-pointer shrink-0'
        : 'room-subtab-btn flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest font-label-md text-label-md font-medium transition-all cursor-pointer shrink-0';
    });

    updateRoomDateNavigatorUI();

    if (currentRoomSubView === 'lanes') {
      renderRoomLanesView(container, currentRoomDate);
    } else if (currentRoomSubView === 'weekly-lanes') {
      renderRoomWeeklyLanesView(container, currentRoomDate);
    } else if (currentRoomSubView === 'monthly') {
      renderRoomMonthlyCalendarView(container, currentRoomDate);
    } else if (currentRoomSubView === 'matrix') {
      renderRoomHourlyMatrixView(container, currentRoomDate);
    } else if (currentRoomSubView === 'list') {
      renderRoomListView(container);
    }
  }

  // 12. SUB-VIEW 1: KOTAK RUANGAN HARIAN (DAILY ROOM LANES)
  function renderRoomLanesView(container, targetDate) {
    const allSchedules = getAllRoomSchedules();
    const searchVal = (document.getElementById('room-search-input')?.value || '').toLowerCase().trim();
    const roomFilterVal = document.getElementById('room-filter-select')?.value || 'all';
    const catFilterVal = document.getElementById('room-category-filter')?.value || 'all';

    const activeRooms = ROOMS_LIST.filter(r => {
      if (roomFilterVal !== 'all' && !doesMatchRoom(r.name, roomFilterVal)) return false;
      return true;
    });

    let html = `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">`;

    activeRooms.forEach(room => {
      const theme = getRoomColorTheme(room.name);
      const roomSchedules = allSchedules.filter(s => {
        if (!isScheduleActiveOnDate(s, targetDate)) return false;
        if (!doesMatchRoom(s.room, room.name)) return false;
        if (catFilterVal !== 'all' && s.category !== catFilterVal) return false;
        if (searchVal) {
          const matchAg = (s.agenda || '').toLowerCase().includes(searchVal);
          const matchPic = (s.pic || '').toLowerCase().includes(searchVal);
          const matchId = (s.id_jadwal || '').toLowerCase().includes(searchVal);
          if (!matchAg && !matchPic && !matchId) return false;
        }
        return true;
      });

      roomSchedules.sort((a, b) => (a.start_minutes || 0) - (b.start_minutes || 0));
      const isOccupied = roomSchedules.length > 0;

      html += `
        <div class="flex flex-col rounded-2xl bg-surface-container-lowest border ${theme.cardBorder} shadow-xs overflow-hidden">
          <!-- Room Lane Header -->
          <div class="p-3.5 sm:p-4 ${theme.headerBg} flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[20px]">meeting_room</span>
              <div>
                <h4 class="font-title-sm text-title-sm font-bold leading-tight">${escapeHtml(room.name)}</h4>
                <div class="text-[11px] opacity-85">Kapasitas: ${room.capacity} Kursi &bull; ${escapeHtml(room.pic || 'LnD')}</div>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded-full text-[11px] font-bold ${isOccupied ? 'bg-amber-400 text-slate-950' : 'bg-emerald-400 text-slate-950'}">
              ${isOccupied ? roomSchedules.length + ' Sesi' : 'Kosong'}
            </span>
          </div>

          <!-- Room Lane Body -->
          <div class="p-3 sm:p-4 flex flex-col gap-3 flex-1 bg-surface-container-low/20 min-h-[220px]">
      `;

      if (roomSchedules.length > 0) {
        roomSchedules.forEach(item => {
          const catBadgeClass = item.category === 'internal'
            ? 'bg-primary-fixed text-on-primary-fixed'
            : item.category === 'external'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-900';

          const hasDetail = typeof openTrainingDetailModal === 'function' && item.category === 'internal';

          html += `
            <div class="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between gap-2.5 group">
              <div>
                <div class="flex items-center justify-between gap-1 mb-1.5">
                  <span class="inline-flex items-center gap-1 font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200" title="Jam Mulai s/d Jam Selesai (${item.duration || 2} Jam)">
                    <span class="material-symbols-outlined text-[13px]">schedule</span>
                    <span>${escapeHtml(item.start_hour)} - ${escapeHtml(item.end_hour)} WIB</span>
                    <span class="text-[10px] font-normal text-indigo-500">(${item.duration}h)</span>
                  </span>
                  <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold ${catBadgeClass}">
                    ${escapeHtml(item.category_label || 'Jadwal')}
                  </span>
                </div>

                <h5 class="font-bold text-sm text-on-surface line-clamp-2 leading-snug group-hover:text-primary transition-colors cursor-pointer" onclick="${hasDetail ? `openTrainingDetailModal('${item.id_jadwal}')` : ''}">
                  ${escapeHtml(item.agenda)}
                </h5>

                <div class="flex flex-col gap-1 mt-2.5 text-xs text-on-surface-variant">
                  <div class="flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[15px] text-outline">person</span>
                    <span class="truncate font-medium">Trainer/PIC: <strong class="text-on-surface">${escapeHtml(item.pic || '-')}</strong></span>
                  </div>
                  ${item.batch ? `
                    <div class="flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-[15px] text-outline">label</span>
                      <span>${escapeHtml(item.batch)}</span>
                    </div>
                  ` : ''}
                  ${item.kuota ? `
                    <div class="flex items-center gap-1.5 font-medium text-emerald-700">
                      <span class="material-symbols-outlined text-[15px]">event_seat</span>
                      <span>Sisa Kuota: ${item.sisa_kuota != null ? item.sisa_kuota : item.kuota} Kursi</span>
                    </div>
                  ` : ''}
                </div>
              </div>

              <div class="pt-2 border-t border-outline-variant/30 flex items-center justify-between gap-2">
                <span class="text-[10.5px] text-outline font-mono truncate" title="ID Agenda">${escapeHtml(item.id_jadwal || '')}</span>
                ${hasDetail ? `
                  <button type="button" onclick="openTrainingDetailModal('${item.id_jadwal}')" class="h-7 px-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer">
                    <span>Detail</span>
                    <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                ` : ''}
              </div>
            </div>
          `;
        });
      } else {
        html += `
          <div class="flex-1 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-outline-variant/40 rounded-xl bg-surface-container-lowest/60 text-on-surface-variant gap-2">
            <span class="material-symbols-outlined text-[32px] text-emerald-600">check_circle</span>
            <div class="font-bold text-xs text-on-surface">Ruangan Tersedia</div>
            <p class="text-[11px] text-on-surface-variant max-w-[160px]">Tidak ada agenda terjadwal di ${escapeHtml(room.name)} pada tanggal ini.</p>
            <button type="button" onclick="openRoomBookingModal('${escapeHtml(room.name)}', '${toIsoDate(targetDate)}')" class="mt-1 h-7 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer">
              <span class="material-symbols-outlined text-[14px]">add</span>
              <span>Gunakan Ruangan Ini</span>
            </button>
          </div>
        `;
      }

      html += `
          </div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
  }

  // 13. SUB-VIEW 2: KOTAK RUANGAN MINGGUAN (WEEKLY ROOM LANES)
  function renderRoomWeeklyLanesView(container, targetDate) {
    const allSchedules = getAllRoomSchedules();
    const searchVal = (document.getElementById('room-search-input')?.value || '').toLowerCase().trim();
    const roomFilterVal = document.getElementById('room-filter-select')?.value || 'all';
    const catFilterVal = document.getElementById('room-category-filter')?.value || 'all';

    const dayOfWeek = (targetDate.getDay() + 6) % 7; // 0 = Senin
    const monday = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() - dayOfWeek);
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      weekDays.push(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i));
    }
    const dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const todayIso = toIsoDate(new Date());

    const activeRooms = ROOMS_LIST.filter(r => {
      if (roomFilterVal !== 'all' && !doesMatchRoom(r.name, roomFilterVal)) return false;
      return true;
    });

    let html = `
      <div class="mb-3 px-3.5 py-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200/60 flex flex-wrap items-center justify-between gap-2 text-xs text-indigo-950">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-[18px] text-indigo-600">date_range</span>
          <span class="font-bold">Tampilan Kotak Mingguan:</span>
          <span>Merinci jadwal tiap ruangan dari <strong>Senin, ${formatIndoDateShort(weekDays[0])}</strong> s/d <strong>Minggu, ${formatIndoDateShort(weekDays[6])}</strong>.</span>
        </div>
        <div class="text-[11px] text-indigo-700 font-medium">Klik pada tanggal atau kartu untuk membuka Kotak Harian.</div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    `;

    activeRooms.forEach(room => {
      const theme = getRoomColorTheme(room.name);

      let weekTotalAgenda = 0;
      const weekScheduleByDay = weekDays.map((wd, dayIdx) => {
        const scheds = allSchedules.filter(s => {
          if (!isScheduleActiveOnDate(s, wd)) return false;
          if (!doesMatchRoom(s.room, room.name)) return false;
          if (catFilterVal !== 'all' && s.category !== catFilterVal) return false;
          if (searchVal) {
            const matchAg = (s.agenda || '').toLowerCase().includes(searchVal);
            const matchPic = (s.pic || '').toLowerCase().includes(searchVal);
            const matchId = (s.id_jadwal || '').toLowerCase().includes(searchVal);
            if (!matchAg && !matchPic && !matchId) return false;
          }
          return true;
        });
        scheds.sort((a, b) => (a.start_minutes || 0) - (b.start_minutes || 0));
        weekTotalAgenda += scheds.length;
        return { date: wd, dayName: dayNames[dayIdx], schedules: scheds };
      });

      html += `
        <div class="flex flex-col rounded-2xl bg-surface-container-lowest border ${theme.cardBorder} shadow-xs overflow-hidden">
          <!-- Room Lane Header -->
          <div class="p-3.5 sm:p-4 ${theme.headerBg} flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[20px]">meeting_room</span>
              <div>
                <h4 class="font-title-sm text-title-sm font-bold leading-tight">${escapeHtml(room.name)}</h4>
                <div class="text-[11px] opacity-85">Kapasitas: ${room.capacity} Kursi &bull; ${escapeHtml(room.pic || 'LnD')}</div>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded-full text-[11px] font-bold ${weekTotalAgenda > 0 ? 'bg-amber-400 text-slate-950' : 'bg-emerald-400 text-slate-950'}">
              ${weekTotalAgenda > 0 ? weekTotalAgenda + ' Sesi Pekan Ini' : 'Pekan Ini Kosong'}
            </span>
          </div>

          <!-- Room Lane Body: Breakdown Hari Senin s/d Minggu -->
          <div class="p-3 sm:p-3.5 flex flex-col gap-2.5 flex-1 bg-surface-container-low/20">
      `;

      weekScheduleByDay.forEach(dayItem => {
        const isDayToday = toIsoDate(dayItem.date) === todayIso;
        const hasSched = dayItem.schedules.length > 0;
        const isoStr = toIsoDate(dayItem.date);

        html += `
          <div class="rounded-xl border ${hasSched ? 'border-outline-variant/60 bg-surface-container-lowest' : 'border-dashed border-outline-variant/30 bg-surface-container-lowest/40'} p-2.5 transition-all">
            <div class="flex items-center justify-between gap-1 mb-1.5">
              <div class="flex items-center gap-1.5 cursor-pointer group" onclick="switchRoomDateAndDaily('${isoStr}')" title="Buka Kotak Harian untuk tanggal ini">
                <span class="font-bold text-xs ${isDayToday ? 'text-primary' : 'text-on-surface'} group-hover:underline">${dayItem.dayName}, ${dayItem.date.getDate()} ${dayItem.date.toLocaleDateString('id-ID', { month: 'short' })}</span>
                ${isDayToday ? `<span class="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-primary text-white">Hari Ini</span>` : ''}
              </div>
              <span class="text-[10px] font-semibold ${hasSched ? 'text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200' : 'text-outline/70'}">
                ${hasSched ? `${dayItem.schedules.length} Sesi` : 'Kosong'}
              </span>
            </div>
        `;

        if (hasSched) {
          html += `<div class="space-y-1.5 mt-1">`;
          dayItem.schedules.forEach(item => {
            const hasDetail = typeof openTrainingDetailModal === 'function' && item.category === 'internal';
            html += `
              <div class="p-2 rounded-lg bg-surface-container-low/40 hover:bg-surface-container-low border border-outline-variant/30 transition-all text-xs">
                <div class="flex items-center justify-between gap-1 text-[10px] text-on-surface-variant mb-0.5 font-mono">
                  <span class="font-semibold text-indigo-700">${escapeHtml(item.start_hour)} - ${escapeHtml(item.end_hour)} WIB (${item.duration}h)</span>
                  <span class="px-1 py-0.2 rounded text-[9px] font-medium bg-surface-container text-on-surface">${escapeHtml(item.category_label || 'Jadwal')}</span>
                </div>
                <div class="font-bold text-on-surface line-clamp-1 hover:text-primary cursor-pointer" onclick="${hasDetail ? `openTrainingDetailModal('${item.id_jadwal}')` : `switchRoomDateAndDaily('${isoStr}')`}">
                  ${escapeHtml(item.agenda)}
                </div>
                <div class="flex items-center justify-between text-[10px] text-outline mt-0.5">
                  <span class="truncate">PIC: ${escapeHtml(item.pic || '-')}</span>
                  <span class="font-mono text-[9.5px]">${escapeHtml(item.id_jadwal)}</span>
                </div>
              </div>
            `;
          });
          html += `</div>`;
        } else {
          html += `
            <div class="flex items-center justify-between text-[11px] text-outline/60 pt-0.5">
              <span>Tidak ada pemakaian</span>
              <button type="button" onclick="openRoomBookingModal('${escapeHtml(room.name)}', '${isoStr}')" class="text-[10.5px] font-semibold text-primary hover:underline inline-flex items-center gap-0.5 cursor-pointer">
                <span class="material-symbols-outlined text-[12px]">add</span>
                <span>Pakai</span>
              </button>
            </div>
          `;
        }

        html += `</div>`;
      });

      html += `
          </div>
          <!-- Card Footer -->
          <div class="p-3 bg-surface-container-lowest border-t border-outline-variant/30 flex items-center justify-between gap-2">
            <span class="text-[11px] text-outline">${weekTotalAgenda} Sesi Terjadwal</span>
            <button type="button" onclick="openRoomBookingModal('${escapeHtml(room.name)}', '${toIsoDate(targetDate)}')" class="h-7 px-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer">
              <span class="material-symbols-outlined text-[14px]">add</span>
              <span>Booking Ruangan</span>
            </button>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
  }

  // 14. SUB-VIEW 3: KALENDER BULANAN (MONTHLY ROOM CALENDAR)
  function renderRoomMonthlyCalendarView(container, targetDate) {
    const allSchedules = getAllRoomSchedules();
    const searchVal = (document.getElementById('room-search-input')?.value || '').toLowerCase().trim();
    const roomFilterVal = document.getElementById('room-filter-select')?.value || 'all';
    const catFilterVal = document.getElementById('room-category-filter')?.value || 'all';

    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const today = new Date();
    const todayIso = toIsoDate(today);

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // 0 = Senin
    const totalDaysInMonth = lastDayOfMonth.getDate();

    let monthTotalSessions = 0;
    const occupiedDatesSet = new Set();
    const roomMonthlyCounts = {};
    ROOMS_LIST.forEach(r => { roomMonthlyCounts[r.name] = 0; });

    allSchedules.forEach(s => {
      if (!s.date_obj) return;
      if (s.date_obj.getFullYear() === year && s.date_obj.getMonth() === month) {
        monthTotalSessions++;
        occupiedDatesSet.add(toIsoDate(s.date_obj));
        ROOMS_LIST.forEach(r => {
          if (doesMatchRoom(s.room, r.name)) {
            roomMonthlyCounts[r.name] = (roomMonthlyCounts[r.name] || 0) + 1;
          }
        });
      }
    });

    let html = `
      <div class="flex flex-col gap-3">
        <!-- MONTH SUMMARY BAR & ROOM LEGEND CHIPS -->
        <div class="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-bold text-on-surface">Legenda Ruangan:</span>
            <button type="button" onclick="setRoomFilterAndRender('all')" class="px-2.5 py-1 rounded-lg text-xs font-semibold ${roomFilterVal === 'all' ? 'bg-indigo-700 text-white' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'} transition-all cursor-pointer">
              Semua Ruangan
            </button>
    `;

    ROOMS_LIST.forEach(room => {
      const theme = getRoomColorTheme(room.name);
      const isSelected = doesMatchRoom(roomFilterVal, room.name);
      html += `
        <button type="button" onclick="setRoomFilterAndRender('${escapeHtml(room.name)}')" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${isSelected ? theme.badgePill : theme.badgeBg} border ${theme.cardBorder} transition-all cursor-pointer" title="Klik untuk memfilter kalender ke ruangan ini">
          <span class="w-2 h-2 rounded-full ${isSelected ? 'bg-white' : theme.dotColor}"></span>
          <span>${escapeHtml(room.name)}</span>
          <span class="opacity-75 text-[10px]">(${roomMonthlyCounts[room.name] || 0})</span>
        </button>
      `;
    });

    html += `
          </div>
          <div class="flex items-center gap-3 text-xs text-on-surface-variant font-medium shrink-0">
            <div class="flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px] text-indigo-600">event_available</span>
              <span><strong>${occupiedDatesSet.size}</strong> Hari Terpakai</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px] text-amber-600">calendar_month</span>
              <span><strong>${monthTotalSessions}</strong> Total Sesi</span>
            </div>
          </div>
        </div>

        <!-- CALENDAR GRID -->
        <div class="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest shadow-xs overflow-hidden">
          <div class="grid grid-cols-7 bg-surface-container border-b border-outline-variant/40 text-center font-bold text-xs text-on-surface">
            <div class="py-2.5 border-r border-outline-variant/30">Senin</div>
            <div class="py-2.5 border-r border-outline-variant/30">Selasa</div>
            <div class="py-2.5 border-r border-outline-variant/30">Rabu</div>
            <div class="py-2.5 border-r border-outline-variant/30">Kamis</div>
            <div class="py-2.5 border-r border-outline-variant/30">Jumat</div>
            <div class="py-2.5 border-r border-outline-variant/30 text-amber-700">Sabtu</div>
            <div class="py-2.5 text-rose-700">Minggu</div>
          </div>

          <div class="grid grid-cols-7 auto-rows-fr divide-y divide-outline-variant/30 text-xs">
    `;

    // 1. Sel Kosong Sebelum Tanggal 1 (Leading Days)
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = 0; i < startDayOfWeek; i++) {
      const prevDate = prevMonthLastDay - startDayOfWeek + i + 1;
      html += `
        <div class="min-h-[105px] p-2 bg-surface-container-low/30 border-r border-outline-variant/20 text-outline/50 flex flex-col justify-between">
          <span class="font-bold text-[11px]">${prevDate}</span>
          <span class="text-[9.5px] italic text-center">Bulan lalu</span>
        </div>
      `;
    }

    // 2. Sel Tanggal Bulan Ini
    for (let dayNum = 1; dayNum <= totalDaysInMonth; dayNum++) {
      const cellDate = new Date(year, month, dayNum);
      const cellIso = toIsoDate(cellDate);
      const isCellToday = (cellIso === todayIso);
      const dayColIndex = (startDayOfWeek + dayNum - 1) % 7;
      const isWeekend = (dayColIndex === 5 || dayColIndex === 6);

      const dayScheds = allSchedules.filter(s => {
        if (!isScheduleActiveOnDate(s, cellDate)) return false;
        if (roomFilterVal !== 'all' && !doesMatchRoom(s.room, roomFilterVal)) return false;
        if (catFilterVal !== 'all' && s.category !== catFilterVal) return false;
        if (searchVal) {
          const matchAg = (s.agenda || '').toLowerCase().includes(searchVal);
          const matchPic = (s.pic || '').toLowerCase().includes(searchVal);
          const matchId = (s.id_jadwal || '').toLowerCase().includes(searchVal);
          if (!matchAg && !matchPic && !matchId) return false;
        }
        return true;
      });

      dayScheds.sort((a, b) => (a.start_minutes || 0) - (b.start_minutes || 0));
      const hasBookings = dayScheds.length > 0;

      html += `
        <div class="min-h-[110px] p-2 border-r border-outline-variant/30 flex flex-col justify-between transition-colors group ${isCellToday ? 'bg-primary/5' : isWeekend ? 'bg-surface-container-low/20' : 'bg-surface-container-lowest hover:bg-surface-container-low/40'}">
          <div>
            <div class="flex items-center justify-between gap-1 mb-1.5">
              <span class="inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${isCellToday ? 'bg-primary text-white shadow-xs' : 'text-on-surface'}">
                ${dayNum}
              </span>
              ${hasBookings ? `
                <button type="button" onclick="switchRoomDateAndDaily('${cellIso}')" class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer" title="Lihat Kotak Ruangan pada tanggal ini">
                  ${dayScheds.length} Agenda
                </button>
              ` : `
                <button type="button" onclick="openRoomBookingModal('', '${cellIso}')" class="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-semibold text-primary hover:underline cursor-pointer" title="Booking Ruangan">
                  + Pakai
                </button>
              `}
            </div>

            <div class="space-y-1">
      `;

      if (hasBookings) {
        const visibleScheds = dayScheds.slice(0, 3);
        visibleScheds.forEach(item => {
          const theme = getRoomColorTheme(item.room);
          const roomInit = getRoomInitials(item.room);

          html += `
            <div onclick="switchRoomDateAndDaily('${cellIso}')" class="p-1 rounded-md text-[10.5px] border ${theme.calPill} transition-all cursor-pointer truncate leading-tight shadow-2xs" title="${escapeHtml(item.room)}: ${escapeHtml(item.agenda)} (${escapeHtml(item.start_hour)} - ${escapeHtml(item.end_hour)} WIB)">
              <div class="flex items-center gap-1 font-semibold">
                <span class="w-1.5 h-1.5 rounded-full ${theme.dotColor} shrink-0"></span>
                <span class="font-bold shrink-0">[${roomInit}]</span>
                <span class="truncate">${escapeHtml(item.agenda)}</span>
              </div>
            </div>
          `;
        });

        if (dayScheds.length > 3) {
          html += `
            <div onclick="switchRoomDateAndDaily('${cellIso}')" class="text-[10px] text-center font-bold text-indigo-700 hover:underline cursor-pointer pt-0.5">
              + ${dayScheds.length - 3} agenda lainnya
            </div>
          `;
        }
      }

      html += `
            </div>
          </div>

          <div class="mt-1 flex items-center justify-between text-[9.5px] text-outline/50">
            ${isCellToday ? `<span class="font-bold text-primary">Hari Ini</span>` : `<span></span>`}
            ${hasBookings ? `<span class="cursor-pointer hover:text-primary font-semibold" onclick="switchRoomDateAndDaily('${cellIso}')">Detail &rarr;</span>` : ''}
          </div>
        </div>
      `;
    }

    // 3. Sel Kosong Setelah Tanggal Terakhir (Trailing Days)
    const totalRenderedCells = startDayOfWeek + totalDaysInMonth;
    const remainingCells = (totalRenderedCells % 7 === 0) ? 0 : 7 - (totalRenderedCells % 7);
    for (let j = 1; j <= remainingCells; j++) {
      html += `
        <div class="min-h-[105px] p-2 bg-surface-container-low/30 border-r border-outline-variant/20 text-outline/50 flex flex-col justify-between">
          <span class="font-bold text-[11px]">${j}</span>
          <span class="text-[9.5px] italic text-center">Bulan depan</span>
        </div>
      `;
    }

    html += `
          </div>
        </div>

        <div class="flex items-center gap-2 p-3 rounded-xl bg-surface-container-low/60 border border-outline-variant/30 text-xs text-on-surface-variant">
          <span class="material-symbols-outlined text-[18px] text-indigo-600">lightbulb</span>
          <span><strong>Tips:</strong> Klik pada kartu agenda atau tombol <em>"X Agenda"</em> pada kalender untuk langsung membuka tampilan <strong>Kotak Ruangan Harian</strong> dengan rincian lengkap pada tanggal tersebut.</span>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  // 15. SUB-VIEW 4: MATRIKS JAM KERJA (HOURLY MATRIX 08:00 - 17:00 DENGAN OVERLAP RENTANG JAM)
  function renderRoomHourlyMatrixView(container, targetDate) {
    const allSchedules = getAllRoomSchedules();
    const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

    let html = `
      <div class="overflow-x-auto rounded-2xl border border-outline-variant/40 bg-surface-container-lowest shadow-xs">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-surface-container border-b border-outline-variant/50">
              <th class="p-3 font-bold text-on-surface w-24 border-r border-outline-variant/40">Jam (WIB)</th>
    `;

    ROOMS_LIST.forEach(room => {
      html += `
        <th class="p-3 font-bold text-on-surface border-r border-outline-variant/40 min-w-[180px]">
          <div class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[17px] text-indigo-600">meeting_room</span>
            <div>
              <div>${escapeHtml(room.name)}</div>
              <div class="text-[10px] font-normal text-on-surface-variant">Kapasitas: ${room.capacity} Kursi</div>
            </div>
          </div>
        </th>
      `;
    });

    html += `</tr></thead><tbody>`;

    hours.forEach((hr, idx) => {
      const slotStartMin = timeToMinutes(hr);
      const slotEndMin = slotStartMin + 60; // slot 1 jam

      html += `
        <tr class="border-b border-outline-variant/30 ${idx % 2 === 1 ? 'bg-surface-container-low/20' : ''}">
          <td class="p-3 font-mono font-bold text-on-surface border-r border-outline-variant/40 bg-surface-container-low/40 text-center">
            ${hr}
          </td>
      `;

      ROOMS_LIST.forEach(room => {
        const matched = allSchedules.filter(s => {
          if (!isScheduleActiveOnDate(s, targetDate)) return false;
          if (!doesMatchRoom(s.room, room.name)) return false;

          const sStart = s.start_minutes != null ? s.start_minutes : timeToMinutes(s.start_hour);
          const sEnd = s.end_minutes != null ? s.end_minutes : (sStart + Math.round((s.duration || 2) * 60));

          return (sStart < slotEndMin && sEnd > slotStartMin);
        });

        if (matched.length > 0) {
          html += `<td class="p-2 border-r border-outline-variant/40 bg-amber-50/50">`;
          matched.forEach(item => {
            html += `
              <div class="p-1.5 rounded-lg bg-amber-100/90 border border-amber-300 text-amber-950 font-semibold mb-1 text-[11px]" title="${escapeHtml(item.agenda)} (${escapeHtml(item.start_hour)} - ${escapeHtml(item.end_hour)} WIB, ${item.duration} Jam)">
                <div class="truncate font-bold">${escapeHtml(item.agenda)}</div>
                <div class="text-[9.5px] text-amber-800 font-mono mt-0.5">${escapeHtml(item.start_hour)} - ${escapeHtml(item.end_hour)} WIB (${item.duration}h)</div>
                <div class="text-[9.5px] text-amber-900/80 font-normal">PIC: ${escapeHtml(item.pic || '-')}</div>
              </div>
            `;
          });
          html += `</td>`;
        } else {
          html += `
            <td class="p-2 border-r border-outline-variant/40 text-center text-outline/50 hover:bg-surface-container-low/40 transition-colors">
              <span class="text-[11px]">-</span>
            </td>
          `;
        }
      });

      html += `</tr>`;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
  }

  // 16. SUB-VIEW 5: DAFTAR PENGGUNAAN LENGKAP (LIST TABLE)
  function renderRoomListView(container) {
    const allSchedules = getAllRoomSchedules();
    const searchVal = (document.getElementById('room-search-input')?.value || '').toLowerCase().trim();
    const roomFilterVal = document.getElementById('room-filter-select')?.value || 'all';
    const catFilterVal = document.getElementById('room-category-filter')?.value || 'all';

    let filtered = allSchedules.filter(s => {
      if (roomFilterVal !== 'all' && !doesMatchRoom(s.room, roomFilterVal)) return false;
      if (catFilterVal !== 'all' && s.category !== catFilterVal) return false;
      if (searchVal) {
        const matchAg = (s.agenda || '').toLowerCase().includes(searchVal);
        const matchPic = (s.pic || '').toLowerCase().includes(searchVal);
        const matchRoom = (s.room || '').toLowerCase().includes(searchVal);
        const matchId = (s.id_jadwal || '').toLowerCase().includes(searchVal);
        if (!matchAg && !matchPic && !matchRoom && !matchId) return false;
      }
      return true;
    });

    filtered.sort((a, b) => {
      const ta = a.date_obj ? a.date_obj.getTime() : 0;
      const tb = b.date_obj ? b.date_obj.getTime() : 0;
      if (tb !== ta) return tb - ta;
      return (b.start_minutes || 0) - (a.start_minutes || 0);
    });

    let html = `
      <div class="overflow-x-auto rounded-2xl border border-outline-variant/40 bg-surface-container-lowest shadow-xs">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-surface-container border-b border-outline-variant/50">
              <th class="p-3 font-bold text-on-surface">Tanggal</th>
              <th class="p-3 font-bold text-on-surface">Jam & Durasi</th>
              <th class="p-3 font-bold text-on-surface">Ruangan</th>
              <th class="p-3 font-bold text-on-surface">Agenda / Silabus</th>
              <th class="p-3 font-bold text-on-surface">Kategori</th>
              <th class="p-3 font-bold text-on-surface">PIC / Trainer</th>
              <th class="p-3 font-bold text-on-surface text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant/30">
    `;

    if (filtered.length > 0) {
      filtered.forEach(item => {
        const theme = getRoomColorTheme(item.room);
        const hasDetail = typeof openTrainingDetailModal === 'function' && item.category === 'internal';

        html += `
          <tr class="hover:bg-surface-container-low/30 transition-colors">
            <td class="p-3 font-semibold text-on-surface whitespace-nowrap">
              ${formatIndoDateShort(item.date_obj)}
            </td>
            <td class="p-3 whitespace-nowrap">
              <div class="font-mono font-bold text-indigo-700">${escapeHtml(item.start_hour)} - ${escapeHtml(item.end_hour)} WIB</div>
              <div class="text-[10px] text-outline">Durasi: ${item.duration} Jam</div>
            </td>
            <td class="p-3 whitespace-nowrap">
              <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${theme.badgeBg}">
                <span class="w-1.5 h-1.5 rounded-full ${theme.dotColor}"></span>
                <span>${escapeHtml(item.room)}</span>
              </span>
            </td>
            <td class="p-3 font-bold text-on-surface">
              <div class="line-clamp-2">${escapeHtml(item.agenda)}</div>
              <div class="text-[10px] text-outline font-mono mt-0.5">${escapeHtml(item.id_jadwal || '')} ${item.batch ? `&bull; ${escapeHtml(item.batch)}` : ''}</div>
            </td>
            <td class="p-3 whitespace-nowrap">
              <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-surface-container text-on-surface">
                ${escapeHtml(item.category_label || 'Jadwal')}
              </span>
            </td>
            <td class="p-3 text-on-surface-variant whitespace-nowrap">
              ${escapeHtml(item.pic || '-')}
            </td>
            <td class="p-3 text-center whitespace-nowrap">
              <div class="inline-flex items-center gap-1">
                <button type="button" onclick="switchRoomDateAndDaily('${item.date_iso}')" class="h-7 px-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer" title="Buka Kotak Harian">
                  <span class="material-symbols-outlined text-[14px]">view_column</span>
                </button>
                ${hasDetail ? `
                  <button type="button" onclick="openTrainingDetailModal('${item.id_jadwal}')" class="h-7 px-2.5 rounded-lg bg-primary text-white hover:bg-primary/90 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer">
                    <span>Detail</span>
                  </button>
                ` : ''}
              </div>
            </td>
          </tr>
        `;
      });
    } else {
      html += `
        <tr>
          <td colspan="7" class="p-8 text-center text-outline">
            Tidak ada agenda ruangan yang sesuai dengan filter.
          </td>
        </tr>
      `;
    }

    html += `</tbody></table></div>`;
    container.innerHTML = html;
  }

  // 17. KONTROL NAVIGASI TANGGAL & INTERAKSI DRILL-DOWN
  function navRoomDate(delta) {
    if (currentRoomSubView === 'weekly-lanes' || currentRoomSubView === 'weekly') {
      currentRoomDate = new Date(currentRoomDate.getFullYear(), currentRoomDate.getMonth(), currentRoomDate.getDate() + (delta * 7));
    } else if (currentRoomSubView === 'monthly') {
      currentRoomDate = new Date(currentRoomDate.getFullYear(), currentRoomDate.getMonth() + delta, 1);
    } else {
      currentRoomDate = new Date(currentRoomDate.getFullYear(), currentRoomDate.getMonth(), currentRoomDate.getDate() + delta);
    }
    renderRoomUsagePage();
  }

  function setRoomDateToday() {
    currentRoomDate = new Date();
    renderRoomUsagePage();
  }

  function onRoomDatePickerChange(val) {
    if (!val) return;
    const parts = val.split('-');
    if (parts.length === 3) {
      currentRoomDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      renderRoomUsagePage();
    }
  }

  function setRoomSubView(mode) {
    currentRoomSubView = mode;
    renderActiveRoomSubView();
  }

  function filterRoomView() {
    renderActiveRoomSubView();
  }

  function resetRoomFilters() {
    const s = document.getElementById('room-search-input');
    const r = document.getElementById('room-filter-select');
    const c = document.getElementById('room-category-filter');
    if (s) s.value = '';
    if (r) r.value = 'all';
    if (c) c.value = 'all';
    renderActiveRoomSubView();
  }

  function filterByRoomCard(roomName) {
    const r = document.getElementById('room-filter-select');
    if (r) r.value = roomName;
    renderActiveRoomSubView();
    const container = document.getElementById('room-schedule-main-container');
    if (container) container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function setRoomFilterAndRender(roomName) {
    const r = document.getElementById('room-filter-select');
    if (r) r.value = roomName;
    renderActiveRoomSubView();
  }

  function switchRoomDateAndDaily(isoDate) {
    if (!isoDate) return;
    const d = parseToDateObj(isoDate);
    if (!d) return;
    currentRoomDate = d;
    currentRoomSubView = 'lanes';
    renderRoomUsagePage();

    const container = document.getElementById('room-schedule-main-container');
    if (container) container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // 18. TAB "KOTAK RUANGAN" DI DALAM KALENDER INTERNAL (section-jadwal)
  function renderCalRoomLanes() {
    const container = document.getElementById('cal-room-lanes-container');
    if (!container) return;

    const dateTitle = document.getElementById('cal-room-date-title');
    if (dateTitle) dateTitle.textContent = formatIndoDateLong(currentCalRoomDate);

    const dateInput = document.getElementById('cal-room-date-picker');
    if (dateInput) dateInput.value = toIsoDate(currentCalRoomDate);

    const allSchedules = getAllRoomSchedules();
    const activeRooms = ROOMS_LIST;

    let html = `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">`;

    activeRooms.forEach(room => {
      const theme = getRoomColorTheme(room.name);
      const roomSchedules = allSchedules.filter(s => {
        if (!isScheduleActiveOnDate(s, currentCalRoomDate)) return false;
        if (!doesMatchRoom(s.room, room.name)) return false;
        return true;
      });

      roomSchedules.sort((a, b) => (a.start_minutes || 0) - (b.start_minutes || 0));
      const isOccupied = roomSchedules.length > 0;

      html += `
        <div class="flex flex-col rounded-2xl bg-surface-container-lowest border ${theme.cardBorder} shadow-xs overflow-hidden">
          <div class="p-3 ${theme.headerBg} flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px]">meeting_room</span>
              <div>
                <h4 class="font-bold text-xs leading-tight">${escapeHtml(room.name)}</h4>
                <div class="text-[10px] opacity-80">${room.capacity} Kursi &bull; ${escapeHtml(room.pic || 'LnD')}</div>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${isOccupied ? 'bg-amber-400 text-slate-950' : 'bg-emerald-400 text-slate-950'}">
              ${isOccupied ? roomSchedules.length + ' Sesi' : 'Kosong'}
            </span>
          </div>

          <div class="p-3 flex flex-col gap-2.5 flex-1 bg-surface-container-low/20 min-h-[160px]">
      `;

      if (roomSchedules.length > 0) {
        roomSchedules.forEach(item => {
          html += `
            <div class="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-2xs">
              <div class="flex items-center justify-between text-[10px] text-indigo-700 font-bold mb-1">
                <span>${escapeHtml(item.start_hour)} - ${escapeHtml(item.end_hour)} WIB</span>
                <span class="px-1.5 py-0.2 rounded text-[9px] bg-indigo-50 border border-indigo-200">${escapeHtml(item.category_label || 'Jadwal')}</span>
              </div>
              <h5 class="font-bold text-xs text-on-surface line-clamp-2">${escapeHtml(item.agenda)}</h5>
              <div class="text-[10px] text-on-surface-variant mt-1">PIC: ${escapeHtml(item.pic || '-')}</div>
            </div>
          `;
        });
      } else {
        html += `
          <div class="flex-1 flex flex-col items-center justify-center p-4 text-center border-2 border-dashed border-outline-variant/40 rounded-xl bg-surface-container-lowest/60 text-outline gap-1">
            <span class="material-symbols-outlined text-[24px] text-emerald-600">check_circle</span>
            <div class="font-bold text-xs text-on-surface">Tersedia</div>
            <p class="text-[10px] text-on-surface-variant">Tidak ada agenda.</p>
          </div>
        `;
      }

      html += `
          </div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
  }

  function navCalRoomDate(delta) {
    currentCalRoomDate = new Date(currentCalRoomDate.getFullYear(), currentCalRoomDate.getMonth(), currentCalRoomDate.getDate() + delta);
    renderCalRoomLanes();
  }

  function setCalRoomDateToday() {
    currentCalRoomDate = new Date();
    renderCalRoomLanes();
  }

  function onCalRoomDatePicker(val) {
    if (!val) return;
    const parts = val.split('-');
    if (parts.length === 3) {
      currentCalRoomDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      renderCalRoomLanes();
    }
  }

  // 19. MODAL BOOKING / CATAT PENGGUNAAN RUANGAN (DENGAN START HOUR & DURATION)
  function updateRoomBookingEndHourPreview() {
    const hourInput = document.getElementById('rb-hour');
    const durInput = document.getElementById('rb-duration');
    const previewEl = document.getElementById('rb-end-hour-preview');
    if (!previewEl) return;

    const startH = hourInput ? formatTimeHour(hourInput.value || '08:00') : '08:00';
    const dur = durInput ? (parseFloat(durInput.value) || 2) : 2;
    const endH = calculateEndHour(startH, dur);

    previewEl.innerHTML = `<span class="font-mono font-bold text-indigo-700">${startH} - ${endH} WIB</span> (Total Durasi: <strong>${dur} Jam</strong>)`;
  }

  function onRoomBookingAgendaSelectChange(selectEl) {
    if (!selectEl) return;
    const selectedVal = selectEl.value;
    if (!selectedVal || selectedVal === 'custom') {
      return;
    }

    const all = getAllRoomSchedules();
    const found = all.find(s => s.id_jadwal === selectedVal);
    if (found) {
      const agInput = document.getElementById('rb-agenda');
      if (agInput) agInput.value = found.agenda;

      const picInput = document.getElementById('rb-pic');
      if (picInput) picInput.value = found.pic;

      const roomSelect = document.getElementById('rb-room');
      if (roomSelect && found.room) roomSelect.value = found.room;

      const dateInput = document.getElementById('rb-date');
      if (dateInput && found.date_iso) dateInput.value = found.date_iso;

      const hourInput = document.getElementById('rb-hour');
      if (hourInput && found.start_hour) hourInput.value = found.start_hour;

      const durInput = document.getElementById('rb-duration');
      if (durInput && found.duration) durInput.value = found.duration;

      updateRoomBookingEndHourPreview();
    }
  }

  function openRoomBookingModal(defaultRoom, defaultDate, defaultAgendaId) {
    const modal = document.getElementById('modal-room-booking');
    if (!modal) return;
    modal.classList.remove('hidden');

    const roomSelect = document.getElementById('rb-room');
    if (roomSelect && defaultRoom) roomSelect.value = defaultRoom;

    const dateInput = document.getElementById('rb-date');
    if (dateInput) dateInput.value = defaultDate || toIsoDate(currentRoomDate);

    const hourInput = document.getElementById('rb-hour');
    if (hourInput && !hourInput.value) hourInput.value = '08:00';

    const durInput = document.getElementById('rb-duration');
    if (durInput && !durInput.value) durInput.value = '2';

    const agendaSelect = document.getElementById('rb-agenda-id-select');
    if (agendaSelect) {
      let optHtml = `<option value="custom">&mdash; Booking Mandiri / Acara Baru &mdash;</option>`;
      const internalList = (window.LIVE_SCHEDULES && Array.isArray(window.LIVE_SCHEDULES))
        ? window.LIVE_SCHEDULES
        : ((window.DATABASE_DATA && Array.isArray(window.DATABASE_DATA)) ? window.DATABASE_DATA : []);

      if (internalList.length > 0) {
        optHtml += `<optgroup label="Jadwal Pelatihan Internal">`;
        internalList.forEach(item => {
          const id = item.id_jadwal || item.id;
          if (id) {
            optHtml += `<option value="${escapeHtml(id)}">${escapeHtml(id)} - ${escapeHtml(item.agenda || item.nama_silabus)}</option>`;
          }
        });
        optHtml += `</optgroup>`;
      }

      const extList = (window.EXTERNAL_DATA && Array.isArray(window.EXTERNAL_DATA)) ? window.EXTERNAL_DATA : [];
      if (extList.length > 0) {
        optHtml += `<optgroup label="External Training">`;
        extList.forEach(item => {
          const id = item.id_external || item.id_jadwal || item.id;
          if (id) {
            optHtml += `<option value="${escapeHtml(id)}">${escapeHtml(id)} - ${escapeHtml(item.agenda || item.nama_program)}</option>`;
          }
        });
        optHtml += `</optgroup>`;
      }

      agendaSelect.innerHTML = optHtml;
      if (defaultAgendaId) {
        agendaSelect.value = defaultAgendaId;
        onRoomBookingAgendaSelectChange(agendaSelect);
      }
    }

    updateRoomBookingEndHourPreview();
  }

  function closeRoomBookingModal() {
    const modal = document.getElementById('modal-room-booking');
    if (modal) modal.classList.add('hidden');
  }

  async function submitRoomBooking(e) {
    if (e && e.preventDefault) e.preventDefault();
    const btn = document.getElementById('btn-submit-room-booking');
    const origHtml = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Menyimpan...`;
    }

    const room = document.getElementById('rb-room')?.value || '';
    const date = document.getElementById('rb-date')?.value || '';
    const rawHour = document.getElementById('rb-hour')?.value || '08:00';
    const duration = parseFloat(document.getElementById('rb-duration')?.value || 2) || 2;
    const selectedAgendaId = document.getElementById('rb-agenda-id-select')?.value || '';
    const agenda = document.getElementById('rb-agenda')?.value || '';
    const pic = document.getElementById('rb-pic')?.value || '';
    const notes = document.getElementById('rb-notes')?.value || '';

    if (!room || !date || !agenda) {
      alert("Mohon lengkapi Ruangan, Tanggal, dan Nama Agenda / Kegiatan.");
      if (btn) { btn.disabled = false; btn.innerHTML = origHtml; }
      return;
    }

    const startHour = formatTimeHour(rawHour);
    const endHour = calculateEndHour(startHour, duration);
    const hourDot = startHour.replace(':', '.');

    const agendaId = (selectedAgendaId && selectedAgendaId !== 'custom')
      ? selectedAgendaId
      : agenda; // Gunakan nama agenda atau ID yang dipilih

    const newRecord = {
      no: String(ROOMS_USE_DATA.length + 1),
      agenda_id: agendaId,
      agenda: agenda,
      date: date,
      room: room,
      hour: hourDot,
      duration: duration,
      pic: pic,
      notes: notes,
      date_obj: parseToDateObj(date)
    };

    let savedRemote = false;
    try {
      const apiUrl = (typeof API_URL !== 'undefined' && API_URL)
        ? API_URL
        : 'https://script.google.com/macros/s/AKfycbxb_YaLMPz-vK06QOJBhmD1zlZhOgaQimytAf03Mn8hRjsf4hhN_8Tc0W7nt7LNLnKh/exec';

      const payload = {
        action: 'book_room',
        ...newRecord
      };

      const resp = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      if (resp.ok) {
        const res = await resp.json();
        if (res && res.status === 'success') savedRemote = true;
      }
    } catch (netErr) {
      console.warn("Koneksi simpan booking online gagal, menyimpan di sesi lokal:", netErr);
    }

    ROOMS_USE_DATA.push(newRecord);
    closeRoomBookingModal();

    renderRoomOverviewCards();
    renderRoomUsagePage();
    renderCalRoomLanes();

    if (btn) { btn.disabled = false; btn.innerHTML = origHtml; }

    const msg = savedRemote
      ? `Penggunaan ruangan "${room}" pada ${date} (${startHour} - ${endHour} WIB, ${duration} Jam) berhasil dicatat dan disinkronkan ke sheet roomsUse!`
      : `Penggunaan ruangan "${room}" pada ${date} (${startHour} - ${endHour} WIB, ${duration} Jam) berhasil dicatat dalam sesi lokal.`;
    alert(msg);
  }

  // 20. EXPORT & DOWNLOAD
  function exportRoomScheduleCsv() {
    const all = getAllRoomSchedules();
    if (!all.length) {
      alert("Tidak ada data jadwal ruangan untuk diunduh.");
      return;
    }

    const headers = ['ID Agenda', 'Tanggal', 'Jam Mulai', 'Jam Selesai', 'Durasi (Jam)', 'Ruangan', 'Agenda', 'Kategori', 'PIC / Trainer', 'Status'];
    const rows = all.map(item => [
      `"${(item.id_jadwal || '').replace(/"/g, '""')}"`,
      `"${(item.date_iso || '').replace(/"/g, '""')}"`,
      `"${(item.start_hour || '').replace(/"/g, '""')}"`,
      `"${(item.end_hour || '').replace(/"/g, '""')}"`,
      `"${item.duration || 2}"`,
      `"${(item.room || '').replace(/"/g, '""')}"`,
      `"${(item.agenda || '').replace(/"/g, '""')}"`,
      `"${(item.category_label || '').replace(/"/g, '""')}"`,
      `"${(item.pic || '').replace(/"/g, '""')}"`,
      `"${(item.status || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Jadwal_Penggunaan_Ruangan_${toIsoDate(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function downloadRoomSchedulePdf() {
    window.print();
  }

  function reprocessRoomsData() {
    renderRoomOverviewCards();
    renderRoomUsagePage();
    renderCalRoomLanes();
  }

  // 21. EXPOSE KE GLOBAL WINDOW
  window.fetchRoomsData = fetchRoomsData;
  window.refreshRoomData = fetchRoomsData;
  window.reprocessRoomsData = reprocessRoomsData;
  window.renderRoomUsagePage = renderRoomUsagePage;
  window.renderCalRoomLanes = renderCalRoomLanes;
  window.navRoomDate = navRoomDate;
  window.setRoomDateToday = setRoomDateToday;
  window.onRoomDatePickerChange = onRoomDatePickerChange;
  window.navCalRoomDate = navCalRoomDate;
  window.setCalRoomDateToday = setCalRoomDateToday;
  window.onCalRoomDatePicker = onCalRoomDatePicker;
  window.setRoomSubView = setRoomSubView;
  window.filterRoomView = filterRoomView;
  window.resetRoomFilters = resetRoomFilters;
  window.filterByRoomCard = filterByRoomCard;
  window.setRoomFilterAndRender = setRoomFilterAndRender;
  window.switchRoomDateAndDaily = switchRoomDateAndDaily;
  window.openRoomBookingModal = openRoomBookingModal;
  window.closeRoomBookingModal = closeRoomBookingModal;
  window.submitRoomBooking = submitRoomBooking;
  window.downloadRoomSchedulePdf = downloadRoomSchedulePdf;
  window.exportRoomScheduleCsv = exportRoomScheduleCsv;
  window.updateRoomBookingEndHourPreview = updateRoomBookingEndHourPreview;
  window.onRoomBookingAgendaSelectChange = onRoomBookingAgendaSelectChange;

  // Inisialisasi Otomatis
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      fetchRoomsData();
    });
  } else {
    fetchRoomsData();
  }
})();
