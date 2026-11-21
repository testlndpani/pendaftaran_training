/**
 * =========================================================================
 * code.gs - REST API Pendaftaran Pelatihan L&D (Google Apps Script)
 * Spreadsheet: "Pendaftaran Training LnD Pani"
 * =========================================================================
 * Sheet "Jadwal Pelatihan" (A-N): ID_Jadwal, START, END, Duration_Day,
 *   Duration_Hour, Start Hour, AGENDA, PIC, ROOM, BATCH, Kuota, Sisa Kuota, STATUS, Deskripsi
 * Sheet "Data Pendaftaran" (A-O): Timestamp, ID_Booking, Id_Karyawan,
 *   Nama_Karyawan, No_HP, Jabatan, Departement, Perusahaan, ID_Jadwal,
 *   Nama_Pelatihan, Tanggal_Mulai, Tanggal_Selesai, PIC_Pendaftaran, Validasi, Link_Dokumen
 *
 * Folder Google Drive: "1n8o051xeC0EmH1O_vUcfzGn4oZzLAL-a"
 *
 * KODE ERROR (field "code" pada response):
 *  E_BUSY, E_PAYLOAD_KOSONG, E_JSON_INVALID, E_SHEET_JADWAL, E_SHEET_DAFTAR,
 *  E_PESERTA_KOSONG, E_PESERTA_TERLALU_BANYAK, E_JADWAL_KOSONG, E_PIC_KOSONG,
 *  E_JADWAL_TIDAK_ADA, E_JADWAL_DITUTUP, E_KUOTA_PENUH, E_KUOTA_KURANG,
 *  E_VALIDASI, E_SERVER
 *
 * ---- PENCATATAN KOMPETENSI KARYAWAN (self-service) ----
 * GET  ?action=competencies  -> daftar nama kompetensi (sheet "Master_Competency", kolom C)
 * POST {action:"submit_competency", ...} -> simpan 1 baris per kompetensi ke sheet
 *   "Submit_Manpower_Competency" (A-M): Timestamp, ID_Submit, NIK_NoHP, Nama, Departemen,
 *   Jabatan, Position_Title, Nama_Kompetensi, Tanggal_Pelatihan, Bulan_Pelatihan,
 *   Tahun_Pelatihan, Nama_File, Link_Dokumen
 *   Tanggal pelatihan & dokumen bersifat OPSIONAL. Lampiran (JPG/PDF, maks 2 MB) disimpan ke folder Drive "1PxFa6EeiGR3Looy3nxl7SdQSRfXRs4Dt"
 *   dengan nama: NIK/NOHP_NAMA KOMPETENSI_BULAN_TAHUN.ext (bulan & tahun dilewati bila tanggal kosong)
 *   Kode error tambahan: E_KOMPETENSI_MASTER, E_DRIVE
 *
 * DEPLOY ULANG: Terapkan > Kelola penerapan > Edit (pensil) > Versi baru > Terapkan
 * =========================================================================
 */
var SHEET_JADWAL = "Jadwal Pelatihan";
var SHEET_ATMP = "ATMP";
var SHEET_PENDAFTARAN = "Data Pendaftaran";
var SHEET_EXTERNAL_SCHEDULE = "External_Training_Schedule";
var SHEET_AGENDA_LUAR = "AGENDA_DILUAR_TRAINING";
var SHEET_EXTERNAL_MANPOWER = "External_Training_Manpower";
var SHEET_AKSES_ADMIN = "akses_admin";
var SHEET_ROOM_LIST = "roomList";
var SHEET_ROOMS_USE = "roomsUse";
var SPREADSHEET_ID = "1Y5IQUSN84p2Os1e9wxraDIfZF6UfOql4Y5EdXbv850A";
var DRIVE_FOLDER_ID = "1n8o051xeC0EmH1O_vUcfzGn4oZzLAL-a";
var DEFAULT_COMPANY = "PT Pani Bersama Tambang";
var MAX_PESERTA = 50;
var HEADERS = ["Timestamp", "ID_Booking", "Id_Karyawan", "Nama_Karyawan", "No_HP", "Jabatan",
  "Departement", "Perusahaan", "ID_Jadwal", "Nama_Pelatihan", "Tanggal_Mulai_Pelatihan",
  "Tanggal_Selesai_Pelatihan", "PIC_Pendaftaran", "Validasi", "Link_Dokumen"];

/* ------------------------------ Helper ------------------------------ */
function getSpreadsheet() {
  try { var a = SpreadsheetApp.getActiveSpreadsheet(); if (a) return a; } catch (e) {}
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}
function jsonOut(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function fail(code, message, extra) {
  var o = { status: "error", code: code, message: message };
  if (extra) for (var k in extra) o[k] = extra[k];
  return jsonOut(o);
}
function str(v) { return String(v == null ? "" : v).trim(); }
function fmtDate(v, tz) {
  if (!v) return "";
  if (v instanceof Date) return isNaN(v.getTime()) ? "" : Utilities.formatDate(v, tz, "dd-MMM-yyyy");
  return str(v);
}
function isoDate(v, tz) {
  if (v instanceof Date && !isNaN(v.getTime())) return Utilities.formatDate(v, tz, "yyyy-MM-dd");
  return str(v);
}
function isClosed(s) { return /tutup|selesai|closed|batal|cancel/i.test(s); }
function isRejected(s) { return /ditolak|batal|reject/i.test(s); }
function isRequestRegistrationRow(row, requestId) {
  var rowId = str(row[8]);
  if (rowId && rowId.toLowerCase() === requestId.toLowerCase()) return true;
  var legacyRequest = /^REQ-(.+)$/i.exec(requestId);
  return !rowId && legacyRequest && str(row[1]).toLowerCase() === legacyRequest[1].toLowerCase();
}

/**
 * Mengecek apakah pendaftaran pelatihan telah mencapai batas penutupan H-1.
 * Batas Cut-Off: 12 jam sebelum pergantian hari menuju Hari H (yaitu H-1 pukul 12:00:00 siang).
 */
function isRegistrationClosedH1(startRaw, tz) {
  if (!startRaw) return false;
  var sDate = null;
  if (startRaw instanceof Date && !isNaN(startRaw.getTime())) {
    sDate = startRaw;
  } else {
    var s = String(startRaw).trim();
    var mIso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (mIso) {
      sDate = new Date(parseInt(mIso[1], 10), parseInt(mIso[2], 10) - 1, parseInt(mIso[3], 10));
    } else {
      var p = Date.parse(s);
      if (!isNaN(p)) sDate = new Date(p);
    }
  }
  if (!sDate || isNaN(sDate.getTime())) return false;

  var targetTz = tz || "Asia/Jakarta";
  var startStr = Utilities.formatDate(sDate, targetTz, "yyyy-MM-dd");
  var startParts = startStr.split("-");
  var startYear = parseInt(startParts[0], 10);
  var startMonth = parseInt(startParts[1], 10) - 1;
  var startDay = parseInt(startParts[2], 10);

  // Waktu saat ini di zona waktu target
  var nowStr = Utilities.formatDate(new Date(), targetTz, "yyyy-MM-dd HH:mm:ss");
  var nowParts = nowStr.split(" ");
  var nowDateParts = nowParts[0].split("-");
  var nowTimeParts = nowParts[1].split(":");

  var nowTimestamp = new Date(
    parseInt(nowDateParts[0], 10),
    parseInt(nowDateParts[1], 10) - 1,
    parseInt(nowDateParts[2], 10),
    parseInt(nowTimeParts[0], 10),
    parseInt(nowTimeParts[1], 10),
    parseInt(nowTimeParts[2], 10)
  ).getTime();

  // Pergantian hari menuju Hari H: tanggal mulai pukul 00:00:00
  // 12 jam sebelum pergantian hari = H-1 pukul 12:00:00 siang
  var startMidnight = new Date(startYear, startMonth, startDay, 0, 0, 0).getTime();
  var cutoffTimestamp = startMidnight - (12 * 60 * 60 * 1000);

  return nowTimestamp >= cutoffTimestamp;
}

function isRegistrationLocked(status, startRaw, tz) {
  if (isClosed(status)) return true;
  return isRegistrationClosedH1(startRaw, tz);
}
function normValidasi(v) {
  var s = str(v);
  if (!s || /^(ok|valid|tervalidasi|approved|disetujui)$/i.test(s)) return "OK";
  if (/menunggu|pending/i.test(s)) return "Menunggu Validasi";
  return s;
}
function maskFromEnd(v, maxMask) {
  var s = str(v);
  if (!s || s === "-") return "-";
  var len = s.length;
  if (len <= 2) return s.charAt(0) + (len === 2 ? "\u2022" : "");
  if (len === 3) return s.slice(0, 2) + "\u2022";
  if (len <= 5) return s.slice(0, len - 2) + "\u2022\u2022";
  if (s.slice(-1) === ")") {
    var lp = s.lastIndexOf("(");
    if (lp !== -1 && lp < len - 2) {
      var ins = s.slice(lp + 1, -1);
      return s.slice(0, lp + 1) + ins.charAt(0) + new Array(ins.length).join("\u2022") + ")";
    }
  }
  var k = maxMask || (len >= 9 ? 3 : 2);
  var keep = Math.max(2, len - k);
  var dots = new Array(len - keep + 1).join("\u2022");
  return s.slice(0, keep) + dots;
}

/**
 * Menyimpan lampiran Base64 (PDF) langsung ke folder Google Drive L&D Pani.
 * Target Folder: https://drive.google.com/drive/folders/1n8o051xeC0EmH1O_vUcfzGn4oZzLAL-a
 */
function saveFileToDrive(base64Data, originalFileName, mimeType, idBooking) {
  if (!base64Data || !originalFileName) return "";
  try {
    var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    if (!folder) {
      Logger.log("Folder Google Drive tidak ditemukan dengan ID: " + DRIVE_FOLDER_ID);
      return "";
    }
    var cleanName = originalFileName.replace(/[^a-zA-Z0-9._\-]/g, "_");
    var fileName = (idBooking ? idBooking + "_" : "") + cleanName;
    var decoded = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decoded, mimeType || "application/pdf", fileName);
    var file = folder.createFile(blob);
    file.setDescription("Lampiran dokumen pendaftaran pelatihan - Booking ID: " + (idBooking || "-"));
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (eShare) {
      Logger.log("Info sharing file: " + eShare);
    }
    return file.getUrl();
  } catch (err) {
    Logger.log("Gagal menyimpan file ke Drive: " + err);
    return "";
  }
}

/**
 * Jalankan fungsi ini sekali di Google Apps Script Editor jika ingin menguji izin akses Drive (Review Permissions).
 */
function testDriveAccess() {
  try {
    var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    var msg = "Akses Google Drive Berhasil! Nama Folder: " + folder.getName();
    Logger.log(msg);
    return msg;
  } catch (e) {
    var err = "Gagal mengakses Drive: " + e;
    Logger.log(err);
    return err;
  }
}

/** Baris data pertama: 1 jika sheet TIDAK punya header, 2 jika ada header. */
function firstDataRow(sh) {
  if (sh.getLastRow() === 0) return 1;
  var a = sh.getRange(1, 1).getValue(), s = str(a);
  return (a instanceof Date || /^\d{4}-\d{2}-\d{2}/.test(s)) ? 1 : 2;
}
function ensureHeader(sh) {
  if (sh.getLastRow() === 0) { sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]); return; }
  if (firstDataRow(sh) === 1) {
    sh.insertRowBefore(1);
    sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    return;
  }
  // Tambah kolom jika belum ada (misal kolom ke-15: Link_Dokumen)
  var lastCol = sh.getLastColumn();
  if (lastCol < HEADERS.length) {
    for (var c = lastCol + 1; c <= HEADERS.length; c++) {
      sh.getRange(1, c).setValue(HEADERS[c - 1]);
    }
  }
}
function readPendaftaran(sh) {
  var start = firstDataRow(sh), last = sh.getLastRow();
  if (last < start) return [];
  var cols = Math.max(HEADERS.length, sh.getLastColumn());
  return sh.getRange(start, 1, last - start + 1, cols).getValues().filter(function (r) {
    return str(r[1]) || str(r[2]) || str(r[3]);
  });
}
function parseGasStartHour(val, tz) {
  if (val == null || val === "") return { formatted: "", minutes: 9999 };

  if (val instanceof Date && !isNaN(val.getTime())) {
    var h = val.getHours();
    var m = val.getMinutes();
    var hStr = (h < 10 ? "0" : "") + h;
    var mStr = (m < 10 ? "0" : "") + m;
    return { formatted: hStr + ":" + mStr, minutes: h * 60 + m };
  }

  if (typeof val === "number" && val > 0 && val < 1) {
    var totalMin = Math.round(val * 24 * 60);
    var hNum = Math.floor(totalMin / 60) % 24;
    var mNum = totalMin % 60;
    var hS = (hNum < 10 ? "0" : "") + hNum;
    var mS = (mNum < 10 ? "0" : "") + mNum;
    return { formatted: hS + ":" + mS, minutes: hNum * 60 + mNum };
  }

  if (typeof val === "number" && val >= 1 && val <= 24) {
    var hInt = Math.floor(val) % 24;
    var hIStr = (hInt < 10 ? "0" : "") + hInt;
    return { formatted: hIStr + ":00", minutes: hInt * 60 };
  }

  var s = String(val).trim();
  var match = s.match(/(\d{1,2})[:.](\d{2})/);
  if (match) {
    var hour = parseInt(match[1], 10);
    var min = parseInt(match[2], 10);
    var hourStr = (hour < 10 ? "0" : "") + hour;
    var minStr = (min < 10 ? "0" : "") + min;
    return { formatted: hourStr + ":" + minStr, minutes: hour * 60 + min };
  }

  var singleMatch = s.match(/^(\d{1,2})(?:\s*wib)?$/i);
  if (singleMatch) {
    var sh = parseInt(singleMatch[1], 10);
    if (sh >= 0 && sh <= 24) {
      var shStr = (sh < 10 ? "0" : "") + sh;
      return { formatted: shStr + ":00", minutes: sh * 60 };
    }
  }

  return { formatted: s, minutes: 9999 };
}

function loadJadwal(sh, tz) {
  var last = sh.getLastRow(), out = [];
  if (last <= 1) return out;
  var lastCol = Math.max(14, sh.getLastColumn());
  var headerVals = sh.getRange(1, 1, 1, lastCol).getValues()[0];

  function findCol(regex, defIdx) {
    for (var c = 0; c < headerVals.length; c++) {
      if (regex.test(str(headerVals[c]))) return c;
    }
    return defIdx;
  }

  var cId = findCol(/^(id_jadwal|id)/i, 0);
  var cStart = findCol(/^start$/i, 1);
  var cEnd = findCol(/^end$/i, 2);
  var cDDay = findCol(/^(duration_day|durasi_hari)/i, 3);
  var cDHour = findCol(/^(duration_hour|durasi_jam)/i, 4);
  var cStartHour = findCol(/^(start[\s_]?hour|jam[\s_]?mulai|waktu[\s_]?mulai)/i, 5);
  var hasStartHour = (cStartHour !== -1);
  var cAgenda = findCol(/^(agenda|nama_pelatihan|pelatihan|program)/i, hasStartHour ? 6 : 5);
  var cPic = findCol(/^(pic|instruktur|trainer)/i, hasStartHour ? 7 : 6);
  var cRoom = findCol(/^(room|ruangan)/i, hasStartHour ? 8 : 7);
  var cBatch = findCol(/^(batch|angkatan)/i, hasStartHour ? 9 : 8);
  var cKuota = findCol(/^(kuota|quota)/i, hasStartHour ? 10 : 9);
  var cSisa = findCol(/^(sisa[\s_]?kuota|sisa)/i, hasStartHour ? 11 : 10);
  var cStatus = findCol(/^status(?![\s_]*jadwal)/i, hasStartHour ? 12 : 11);
  var cDesc = findCol(/^(deskripsi|desc)/i, hasStartHour ? 13 : 12);
  var cStatusJadwal = findCol(/^(status[\s_]?jadwal|realisasi|keterangan[\s_]?jadwal)/i, -1);
  var cPlanStart = findCol(/^(plan[\s_]?start|tanggal[\s_]?rencana|jadwal[\s_]?awal|start[\s_]?awal)/i, -1);
  var cPlanEnd = findCol(/^(plan[\s_]?end|tanggal[\s_]?selesai[\s_]?rencana|end[\s_]?awal)/i, -1);

  var v = sh.getRange(2, 1, last - 1, lastCol).getValues();
  for (var i = 0; i < v.length; i++) {
    var r = v[i], id = str(r[cId]), agenda = str(r[cAgenda]);
    if (!id && !agenda) continue;
    var rawHour = (cStartHour !== -1 && cStartHour < r.length) ? r[cStartHour] : "";
    var parsedH = parseGasStartHour(rawHour, tz);
    var deskripsi = str(r[cDesc]);
    var roomBooking = /^\[BOOKING RUANGAN\]/i.test(deskripsi);
    var usageMatch = deskripsi.match(/Kegunaan:\s*(Non-Training|Training)/i);
    var linkedMatch = deskripsi.match(/Terkait Jadwal:\s*([^;\r\n]+)/i);
    var bookingDurationMatch = deskripsi.match(/Durasi Booking:\s*([\d.]+)\s*jam/i);

    out.push({
      row: i + 2,
      id: id,
      startRaw: r[cStart],
      endRaw: r[cEnd],
      dDay: str(r[cDDay]),
      dHour: str(r[cDHour]),
      startHour: parsedH.formatted,
      startMinutes: parsedH.minutes,
      agenda: agenda,
      pic: str(r[cPic]),
      room: str(r[cRoom]),
      batch: str(r[cBatch]),
      kuota: Number(r[cKuota]) || 0,
      sisaRaw: r[cSisa],
      status: str(r[cStatus]),
      deskripsi: deskripsi,
      isRoomBooking: roomBooking,
      usageType: usageMatch ? usageMatch[1].toLowerCase().replace("-", "_") : "",
      linkedScheduleId: linkedMatch ? str(linkedMatch[1]) : "",
      bookingDuration: bookingDurationMatch ? Number(bookingDurationMatch[1]) : 0,
      statusJadwal: cStatusJadwal !== -1 ? str(r[cStatusJadwal]) : "",
      planStartRaw: cPlanStart !== -1 ? r[cPlanStart] : "",
      planEndRaw: cPlanEnd !== -1 ? r[cPlanEnd] : ""
    });
  }
  return out;
}
function countByJadwal(regs) {
  var m = {};
  regs.forEach(function (r) {
    if (isRejected(str(r[13]))) return;
    var idJ = str(r[8]);
    if (idJ) {
      m[idJ] = (m[idJ] || 0) + 1;
    } else {
      var alt = str(r[9]);
      if (alt) m[alt] = (m[alt] || 0) + 1;
    }
  });
  return m;
}
/** Sisa kursi = nilai terkecil antara kolom "Sisa Kuota" dan (Kuota - pendaftar riil). */
function computeSisa(j, counts) {
  var terdaftar = (j.id && counts[j.id] !== undefined) ? counts[j.id] : (counts[j.agenda] || 0);
  var byCount = Math.max(0, j.kuota - terdaftar);
  var raw = j.sisaRaw;
  if (raw !== "" && raw != null && !isNaN(Number(raw))) return Math.max(0, Math.min(Number(raw), byCount));
  return byCount;
}

/**
 * Menghitung durasi pelatihan secara cerdas dan aman (mencegah nilai negatif seperti -411).
 * Mengacu pada standar jam kerja pelatihan Pani Gold Project: 8 Jam/Hari (misal 40 Jam = 5 Hari).
 */
function computeSmartDuration(dDay, dHour, startRaw, endRaw) {
  var dDayNum = parseInt(dDay, 10);
  var dHourNum = parseInt(dHour, 10);

  // Jika dHour valid (misal 40), dan dDay tidak valid / negatif (< 1 seperti -411)
  if ((isNaN(dDayNum) || dDayNum <= 0) && !isNaN(dHourNum) && dHourNum > 0) {
    dDayNum = Math.ceil(dHourNum / 8); // 40 jam = 5 hari
  }

  // Jika dDay masih belum valid, hitung dari selisih tanggal
  if ((isNaN(dDayNum) || dDayNum <= 0) && (startRaw instanceof Date) && (endRaw instanceof Date)) {
    var diff = Math.round((endRaw.getTime() - startRaw.getTime()) / 86400000);
    dDayNum = Math.abs(diff) + 1;
  }

  if (isNaN(dHourNum) || dHourNum <= 0) {
    if (!isNaN(dDayNum) && dDayNum > 0) dHourNum = dDayNum * 8;
  }

  if (!isNaN(dDayNum) && dDayNum > 0 && !isNaN(dHourNum) && dHourNum > 0) {
    return dDayNum + " Hari (" + dHourNum + " Jam)";
  }
  if (!isNaN(dDayNum) && dDayNum > 0) return dDayNum + " Hari";
  if (!isNaN(dHourNum) && dHourNum > 0) return dHourNum + " Jam";
  return str(dDay) || str(dHour) || "5 Hari (40 Jam)";
}

/**
 * Memastikan tanggal mulai dan selesai valid serta berurutan logis (START <= END).
 */
function sanitizeJadwalDates(startRaw, endRaw, dHour, tz) {
  var sDate = (startRaw instanceof Date && !isNaN(startRaw.getTime())) ? startRaw : null;
  var eDate = (endRaw instanceof Date && !isNaN(endRaw.getTime())) ? endRaw : null;

  if (!sDate && startRaw) {
    var pS = Date.parse(str(startRaw));
    if (!isNaN(pS)) sDate = new Date(pS);
  }
  if (!eDate && endRaw) {
    var pE = Date.parse(str(endRaw));
    if (!isNaN(pE)) eDate = new Date(pE);
  }

  // Koreksi jika tanggal selesai mendahului tanggal mulai (misal start Nov 2026 vs end Sep 2025)
  if (sDate && eDate && eDate.getTime() < sDate.getTime()) {
    var h = parseInt(dHour, 10) || 40;
    var days = Math.max(1, Math.ceil(h / 8));
    
    if (sDate.getFullYear() > eDate.getFullYear()) {
      eDate = new Date(sDate.getTime() + (days - 1) * 86400000);
    } else {
      var tmp = sDate; sDate = eDate; eDate = tmp;
    }
  }

  return {
    start: sDate ? Utilities.formatDate(sDate, tz, "dd-MMM-yyyy") : fmtDate(startRaw, tz),
    end: eDate ? Utilities.formatDate(eDate, tz, "dd-MMM-yyyy") : fmtDate(endRaw, tz)
  };
}

/**
 * Jalankan fungsi ini sekali di Apps Script Editor jika Anda ingin otomatis merapikan tanggal & durasi
 * pada sheet "Jadwal Pelatihan" Google Sheets menjadi konsisten 5 Hari (40 Jam).
 */
function fixJadwalSpreadsheet() {
  var ss = getSpreadsheet();
  var shJ = ss.getSheetByName(SHEET_JADWAL);
  if (!shJ) return "Sheet '" + SHEET_JADWAL + "' tidak ditemukan";
  
  var last = shJ.getLastRow();
  if (last <= 1) return "Tidak ada data jadwal";
  
  var lastCol = Math.max(14, shJ.getLastColumn());
  var range = shJ.getRange(2, 1, last - 1, lastCol);
  var values = range.getValues();
  var updated = 0;
  
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var id = str(row[0]);
    if (!id) continue;
    
    var sVal = row[1], eVal = row[2];
    var dHour = parseInt(row[4], 10) || 40;
    var durDays = Math.max(1, Math.ceil(dHour / 8));
    
    var sDate = (sVal instanceof Date && !isNaN(sVal.getTime())) ? sVal : (sVal ? new Date(sVal) : null);
    var eDate = (eVal instanceof Date && !isNaN(eVal.getTime())) ? eVal : (eVal ? new Date(eVal) : null);
    
    // Jika END < START atau dDay bernilai minus/salah di spreadsheet
    if (sDate && (!eDate || eDate < sDate || parseInt(row[3], 10) <= 0)) {
      var newEnd = new Date(sDate.getTime() + (durDays - 1) * 86400000);
      shJ.getRange(i + 2, 3).setValue(newEnd);   // Kolom C (END)
      shJ.getRange(i + 2, 4).setValue(durDays);  // Kolom D (Duration_Day = 5)
      shJ.getRange(i + 2, 5).setValue(dHour);    // Kolom E (Duration_Hour = 40)
      updated++;
    }
  }
  
  SpreadsheetApp.flush();
  var msg = "Berhasil merapikan " + updated + " baris jadwal di spreadsheet! Durasi sekarang 5 Hari (40 Jam).";
  Logger.log(msg);
  return msg;
}

/* ------------------------------ EXTERNAL TRAINING & AGENDA EVENT ------------------------------ */
function extractDateFromText(txt) {
  if (!txt) return "";
  var m = String(txt).match(/(\d{1,2})\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/i);
  if (!m) return "";
  var map = {
    januari: "Jan", februari: "Feb", maret: "Mar", april: "Apr", mei: "May", juni: "Jun",
    juli: "Jul", agustus: "Aug", september: "Sep", oktober: "Oct", november: "Nov", desember: "Dec",
    jan: "Jan", feb: "Feb", mar: "Mar", apr: "Apr", may: "May", jun: "Jun",
    jul: "Jul", aug: "Aug", sep: "Sep", oct: "Oct", nov: "Nov", dec: "Dec"
  };
  var day = ("0" + parseInt(m[1], 10)).slice(-2);
  var mon = map[m[2].toLowerCase()] || m[2].slice(0, 3);
  return day + "-" + mon + "-" + m[3];
}

function loadExternalData(ss, tz) {
  var shExt = ss.getSheetByName(SHEET_EXTERNAL_SCHEDULE);
  var shEv = ss.getSheetByName(SHEET_AGENDA_LUAR);
  var shMp = ss.getSheetByName(SHEET_EXTERNAL_MANPOWER);

  var mpById = {}, mpByAgenda = {}, allManpower = [];
  if (shMp && shMp.getLastRow() >= 2) {
    var mpLastCol = Math.max(15, shMp.getLastColumn());
    var mpRows = shMp.getRange(2, 1, shMp.getLastRow() - 1, mpLastCol).getValues();
    mpRows.forEach(function (r) {
      var colB = str(r[1]), colC = str(r[2]), nama = str(r[3]);
      if (!colB && !colC && !nama) return;
      // Di External_Training_Manpower, jika kolom C (Id_Karyawan) kosong dan kolom B berisi NIK/ID (mis. PGP260062), gunakan kolom B
      var idKar = colC || (!/^REG-/i.test(colB) ? colB : "");
      var idBook = colC ? colB : ("EXT-MP-" + str(r[0]));
      var idJad = str(r[8]), namaPel = str(r[9]);
      var pObj = {
        timestamp: fmtDate(r[0], tz),
        id_booking: idBook,
        id_karyawan: maskFromEnd(idKar, 4),
        nama_karyawan: maskFromEnd(nama, 3),
        jabatan: str(r[5]),
        departement: str(r[6]) ? maskFromEnd(r[6], 3) : str(r[5]),
        perusahaan: str(r[7]) ? maskFromEnd(r[7], 3) : "-",
        id_jadwal: idJad,
        nama_pelatihan: namaPel,
        pic_pendaftaran: str(r[12]),
        pic: str(r[12]),
        validasi: normValidasi(r[13])
      };
      allManpower.push(pObj);
      if (idJad) (mpById[idJad.toLowerCase()] = mpById[idJad.toLowerCase()] || []).push(pObj);
      if (namaPel) (mpByAgenda[namaPel.toLowerCase()] = mpByAgenda[namaPel.toLowerCase()] || []).push(pObj);
    });
  }

  var extList = [];
  if (shExt) {
    loadJadwal(shExt, tz).forEach(function (j, idx) {
      if (isClosed(j.status)) return;
      var dates = sanitizeJadwalDates(j.startRaw, j.endRaw, j.dHour, tz);
      var startStr = dates.start || extractDateFromText(j.agenda);
      var endStr = dates.end || startStr;
      var dur = startStr ? computeSmartDuration(j.dDay, j.dHour, j.startRaw, j.endRaw) : "Menunggu Jadwal";

      var keyId = (j.id || "").toLowerCase();
      var keyAg = (j.agenda || "").toLowerCase();
      var matched = (keyId && mpById[keyId]) ? mpById[keyId].slice() : [];
      if (!matched.length && keyAg) {
        Object.keys(mpByAgenda).forEach(function (k) {
          if (k === keyAg || k.indexOf(keyAg) !== -1 || keyAg.indexOf(k) !== -1) {
            matched = matched.concat(mpByAgenda[k]);
          }
        });
      }

      var kuota = j.kuota || (matched.length ? Math.max(15, matched.length) : 0);
      var byCountExt = kuota > 0 ? Math.max(0, kuota - matched.length) : 0;
      var sisaExtRaw = (j.sisaRaw !== "" && j.sisaRaw !== undefined && j.sisaRaw !== null && !isNaN(Number(j.sisaRaw)))
        ? Math.max(0, Number(j.sisaRaw))
        : byCountExt;
      var sisa = kuota > 0 ? Math.min(sisaExtRaw, byCountExt) : 0;

      extList.push({
        uid: "EXT-" + (idx + 1) + "-" + (j.id || "ITEM"),
        id_jadwal: j.id || ("EXT-PLAN-" + (idx + 1)),
        category: "external_training",
        category_label: "External Training",
        start: startStr,
        end: endStr,
        duration: dur,
        duration_day: parseInt(j.dDay, 10) || 0,
        duration_hour: j.bookingDuration || parseInt(j.dHour, 10) || 0,
        start_hour: j.startHour,
        start_minutes: j.startMinutes,
        agenda: j.agenda,
        pic: j.pic,
        room: j.room,
        batch: j.batch || "External Training",
        kuota: kuota,
        sisa_kuota: sisa,
        total_terdaftar: matched.length,
        status: !startStr ? "Menunggu Jadwal" : (kuota > 0 && sisa <= 0 ? "Penuh" : (j.status || "Buka")),
        deskripsi: j.deskripsi,
        peserta: matched
      });
    });
  }

  var eventList = [];
  if (shEv && shEv.getLastRow() >= 2) {
    var evLastCol = Math.max(8, shEv.getLastColumn());
    var evHeader = shEv.getRange(1, 1, 1, evLastCol).getValues()[0];
    function findEvCol(rx, defIdx) {
      for (var c = 0; c < evHeader.length; c++) {
        if (rx.test(str(evHeader[c]))) return c;
      }
      return defIdx;
    }
    var cEvHour = findEvCol(/^(start[\s_]?hour|jam[\s_]?mulai|waktu[\s_]?mulai)/i, 8);
    var cEvBatch = findEvCol(/^(batch|angkatan)/i, 9);
    var cEvKuota = findEvCol(/^(kuota|quota)/i, 10);
    var cEvSisa = findEvCol(/^(sisa[\s_]?kuota|sisa)/i, 11);
    var cEvDDay = findEvCol(/^(duration_day|durasi_hari)/i, 12);
    var cEvDHour = findEvCol(/^(duration_hour|durasi_jam)/i, 13);

    var evValues = shEv.getRange(2, 1, shEv.getLastRow() - 1, evLastCol).getValues();
    for (var eIdx = 0; eIdx < evValues.length; eIdx++) {
      var er = evValues[eIdx];
      var eId = str(er[0]), eAgenda = str(er[3]);
      if (!eId && !eAgenda) continue;
      var eStatus = str(er[6]);
      if (isClosed(eStatus)) continue;
      var eDDay = cEvDDay < er.length ? str(er[cEvDDay]) : "";
      var eDHour = cEvDHour < er.length ? str(er[cEvDHour]) : "";
      var eDates = sanitizeJadwalDates(er[1], er[2], parseInt(eDHour, 10) || 8, tz);
      var eStart = eDates.start || extractDateFromText(eAgenda);
      var eEnd = eDates.end || eStart;
      var eDur = eStart ? computeSmartDuration(eDDay, eDHour, er[1], er[2]) : "Menunggu Jadwal";
      var rawEvHour = cEvHour < er.length ? er[cEvHour] : "";
      var parsedEvH = parseGasStartHour(rawEvHour, tz);
      var evKuota = cEvKuota < er.length ? (Number(er[cEvKuota]) || 0) : 0;
      var evSisa = cEvSisa < er.length && er[cEvSisa] !== "" ? (Number(er[cEvSisa]) || 0) : evKuota;

      eventList.push({
        uid: "EVT-" + (eIdx + 1) + "-" + (eId || "AGENDA"),
        id_jadwal: eId || ("AGENDA-" + (eIdx + 1)),
        category: "agenda_event",
        category_label: "Agenda di Luar Training",
        start: eStart,
        end: eEnd,
        duration: eDur,
        duration_day: parseInt(eDDay, 10) || 0,
        duration_hour: parseInt(eDHour, 10) || 0,
        start_hour: parsedEvH.formatted,
        start_minutes: parsedEvH.minutes,
        agenda: eAgenda,
        pic: str(er[4]),
        room: str(er[5]),
        batch: (cEvBatch < er.length && str(er[cEvBatch])) ? str(er[cEvBatch]) : "Event & Agenda",
        kuota: evKuota,
        sisa_kuota: evSisa,
        total_terdaftar: 0,
        status: !eStart ? "Menunggu Jadwal" : (eStatus || "Terjadwal"),
        deskripsi: str(er[7]),
        peserta: []
      });
    }
  }

  return {
    external_schedules: extList,
    agenda_diluar_training: eventList,
    combined: extList.concat(eventList),
    total_manpower: allManpower.length
  };
}

function loadAtmpSheet(ss, tz) {
  var sh = ss.getSheetByName(SHEET_ATMP);
  var out = [];
  if (!sh) return out;
  var last = sh.getLastRow();
  if (last <= 1) return out;
  var lastCol = Math.max(15, sh.getLastColumn());
  var headerVals = sh.getRange(1, 1, 1, lastCol).getValues()[0];

  function findCol(regex, defIdx) {
    for (var c = 0; c < headerVals.length; c++) {
      if (regex.test(str(headerVals[c]))) return c;
    }
    return defIdx;
  }

  var cId = findCol(/^(id_jadwal|id)/i, 0);
  var cStart = findCol(/^start$/i, 1);
  var cEnd = findCol(/^end$/i, 2);
  var cYear = findCol(/^(year|tahun)$/i, 3);
  var cAgenda = findCol(/^(agenda|nama_pelatihan|pelatihan|program)/i, 4);
  var cPic = findCol(/^(pic|instruktur|trainer)/i, 5);
  var cLocation = findCol(/^(location|room|ruangan|lokasi)/i, 6);
  var cBatch = findCol(/^(batch|angkatan)/i, 7);
  var cPlan = findCol(/^(plan|kuota|quota|target)$/i, 8);
  var cActual = findCol(/^(actual|realisasi_peserta)(?![\s_]*budget)/i, 9);
  var cBudget = findCol(/^budget$/i, 10);
  var cActualBudget = findCol(/^(actual[\s_]?budget|realisasi[\s_]?budget|actual[\s_]?anggaran)/i, 11);
  var cStatus = findCol(/^status(?![\s_]*jadwal)/i, 12);
  var cDesc = findCol(/^(deskripsi|desc)/i, 13);
  var cStatusJadwal = findCol(/^(status[\s_]?jadwal|realisasi|keterangan[\s_]?jadwal)/i, 14);
  var cPlanStart = findCol(/^(plan[\s_]?start|tanggal[\s_]?rencana|jadwal[\s_]?awal|start[\s_]?awal)/i, -1);
  var cPlanEnd = findCol(/^(plan[\s_]?end|tanggal[\s_]?selesai[\s_]?rencana|end[\s_]?awal)/i, -1);

  var v = sh.getRange(2, 1, last - 1, lastCol).getValues();
  for (var i = 0; i < v.length; i++) {
    var r = v[i], id = str(r[cId]), agenda = str(r[cAgenda]);
    if (!id && !agenda) continue;
    var status = str(r[cStatus]);
    if (/batal|cancel/i.test(status)) continue;

    var startRaw = r[cStart];
    var endRaw = r[cEnd];
    var dates = sanitizeJadwalDates(startRaw, endRaw, "", tz);
    var yearNum = parseInt(r[cYear], 10);
    var dDay = 1;
    var sDate = (startRaw instanceof Date && !isNaN(startRaw.getTime())) ? startRaw : null;
    var eDate = (endRaw instanceof Date && !isNaN(endRaw.getTime())) ? endRaw : null;
    if (sDate && eDate && eDate.getTime() >= sDate.getTime()) {
      dDay = Math.max(1, Math.round((eDate.getTime() - sDate.getTime()) / 86400000) + 1);
    }
    var dHour = dDay * 8;
    var planVal = Number(r[cPlan]) || 0;
    var actualRaw = r[cActual];
    var actualVal = (actualRaw !== "" && actualRaw != null && !isNaN(Number(actualRaw))) ? Number(actualRaw) : 0;
    var sisa = Math.max(0, planVal - actualVal);

    var planStartRaw = cPlanStart !== -1 ? r[cPlanStart] : "";
    var planEndRaw = cPlanEnd !== -1 ? r[cPlanEnd] : "";
    var planDates = planStartRaw
      ? sanitizeJadwalDates(planStartRaw, planEndRaw || "", dHour, tz)
      : { start: "", end: (planEndRaw ? fmtDate(planEndRaw, tz) : "") };

    out.push({
      id_jadwal: id,
      start: dates.start,
      end: dates.end,
      year: (!isNaN(yearNum) && yearNum >= 2020 && yearNum <= 2035) ? yearNum : "",
      duration: dDay + " Hari (" + dHour + " Jam)",
      duration_day: dDay,
      duration_hour: dHour,
      start_hour: "",
      start_minutes: 9999,
      agenda: agenda,
      pic: str(r[cPic]),
      room: str(r[cLocation]),
      location: str(r[cLocation]),
      batch: str(r[cBatch]),
      kuota: planVal,
      plan_participants: planVal,
      actual_participants: actualVal,
      total_terdaftar: actualVal,
      sisa_kuota: sisa,
      budget: cBudget !== -1 ? r[cBudget] : "",
      actual_budget: cActualBudget !== -1 ? r[cActualBudget] : "",
      status: status || "Buka",
      status_jadwal: cStatusJadwal !== -1 ? str(r[cStatusJadwal]) : "",
      plan_start: planDates.start || "",
      plan_end: planDates.end || "",
      deskripsi: str(r[cDesc]),
      peserta: [],
      source_sheet: "ATMP"
    });
  }
  return out;
}

/* ------------------------------ GET ------------------------------ */
function doGet(e) {
  if (e && e.parameter && e.parameter.action === "competencies") return handleCompetencyList();
  if (e && e.parameter && e.parameter.action === "atmp") {
    try {
      var ssAtmp = getSpreadsheet();
      var tzAtmp = ssAtmp.getSpreadsheetTimeZone() || "Asia/Jakarta";
      return jsonOut({
        status: "success",
        source: SHEET_ATMP,
        data: loadAtmpSheet(ssAtmp, tzAtmp),
        generated_at: new Date().toISOString()
      });
    } catch (errAtmp) {
      return fail("E_SERVER", "Gagal membaca sheet " + SHEET_ATMP + ": " + errAtmp);
    }
  }
  if (e && e.parameter && e.parameter.action === "run_autolock") {
    var resMsg = autoLockSchedulesH1();
    return jsonOut({ status: "success", message: resMsg, timestamp: new Date().toISOString() });
  }
  if (e && e.parameter && e.parameter.action === "setup_autolock_trigger") {
    var resTrig = setupDailyAutoLockTrigger();
    return jsonOut({ status: "success", message: resTrig, timestamp: new Date().toISOString() });
  }
  if (e && e.parameter && e.parameter.action === "external_calendar") {
    try {
      var ssExt = getSpreadsheet();
      var tzExt = ssExt.getSpreadsheetTimeZone() || "Asia/Jakarta";
      var extRes = loadExternalData(ssExt, tzExt);
      return jsonOut({ status: "success", external: extRes, generated_at: new Date().toISOString() });
    } catch (errExt) {
      return fail("E_SERVER", "Gagal membaca kalender eksternal: " + errExt);
    }
  }
  if (e && e.parameter && e.parameter.action === "rooms") {
    try {
      var ssRooms = getSpreadsheet();
      var tzRooms = ssRooms.getSpreadsheetTimeZone() || "Asia/Jakarta";
      return jsonOut({
        status: "success",
        source_list: SHEET_ROOM_LIST,
        source_use: SHEET_ROOMS_USE,
        data: loadRoomData(ssRooms, tzRooms),
        generated_at: new Date().toISOString()
      });
    } catch (errRooms) {
      return fail("E_SERVER", "Gagal membaca data ruangan: " + errRooms);
    }
  }
  try {
    var ss = getSpreadsheet(), shJ = ss.getSheetByName(SHEET_JADWAL);
    if (!shJ) return fail("E_SHEET_JADWAL", "Sheet '" + SHEET_JADWAL + "' tidak ditemukan.");
    var tz = ss.getSpreadsheetTimeZone() || "Asia/Jakarta";
    var shP = ss.getSheetByName(SHEET_PENDAFTARAN);
    var regs = shP ? readPendaftaran(shP) : [];
    var counts = countByJadwal(regs), byJadwalId = {}, byAgendaFallback = {};

    regs.forEach(function (r) {
      var idJ = str(r[8]), namaP = str(r[9]);
      if (!idJ && !namaP) return;
      // Data pribadi (No HP, ID penuh) sengaja disamarkan demi privasi.
      var pObj = {
        timestamp: fmtDate(r[0], tz), id_booking: str(r[1]), id_karyawan: maskFromEnd(r[2], 4),
        nama_karyawan: maskFromEnd(r[3], 3), jabatan: str(r[5]), departement: maskFromEnd(r[6], 3), perusahaan: maskFromEnd(r[7], 3),
        id_jadwal: idJ, nama_pelatihan: namaP, pic_pendaftaran: str(r[12]), pic: str(r[12]), validasi: normValidasi(r[13])
      };
      // Strict mapping: Hanya index ke id_jadwal jika tersedia.
      // Dilarang keras memasukkan peserta yang memiliki id_jadwal ke dalam bucket agenda umum,
      // agar tidak bocor ke batch/jadwal lain atau training request yang judulnya sama.
      if (idJ) {
        (byJadwalId[idJ] = byJadwalId[idJ] || []).push(pObj);
      } else if (namaP) {
        (byAgendaFallback[namaP] = byAgendaFallback[namaP] || []).push(pObj);
      }
    });

    var list = [];
    loadJadwal(shJ, tz).forEach(function (j) {
      if (/batal|cancel/i.test(j.status)) return;
      var sisa = computeSisa(j, counts);
      var dur = computeSmartDuration(j.dDay, j.dHour, j.startRaw, j.endRaw);
      var dates = sanitizeJadwalDates(j.startRaw, j.endRaw, j.dHour, tz);
      var isH1Closed = isRegistrationClosedH1(j.startRaw, tz);
      var isManualClosed = isClosed(j.status);
      var isRegClosed = isManualClosed || isH1Closed;

      // Strict matching: Hanya ambil peserta yang benar-benar terdaftar di id_jadwal ini.
      // Fallback ke agenda HANYA jika id_jadwal kosong dan ada peserta tanpa ID jadwal.
      var peserta = (j.id && byJadwalId[j.id]) ? byJadwalId[j.id] : [];
      if (peserta.length === 0 && (!j.id || !byJadwalId[j.id]) && j.agenda && byAgendaFallback[j.agenda]) {
        peserta = byAgendaFallback[j.agenda];
      }
      var totalPesertaCount = peserta.length;

      var st = "Buka";
      if (isManualClosed) {
        st = j.status;
      } else if (isH1Closed) {
        st = "Pendaftaran Ditutup (H-1)";
      } else if (sisa <= 0) {
        st = "Penuh";
      } else if (j.status && !/penuh/i.test(j.status)) {
        st = j.status;
      }

      var planDates = j.planStartRaw
        ? sanitizeJadwalDates(j.planStartRaw, j.planEndRaw || "", j.dHour, tz)
        : { start: "", end: (j.planEndRaw ? fmtDate(j.planEndRaw, tz) : "") };

      list.push({
        id_jadwal: j.id, start: dates.start, end: dates.end, duration: dur,
        duration_day: parseInt(j.dDay, 10) || 0,
        duration_hour: parseInt(j.dHour, 10) || 0,
        start_hour: j.startHour, start_minutes: j.startMinutes,
        agenda: j.agenda, pic: j.pic, room: j.room, batch: j.batch, kuota: j.kuota, sisa_kuota: sisa,
        total_terdaftar: totalPesertaCount,
        is_closed_h1: isH1Closed,
        is_registration_closed: isRegClosed,
        status: st,
        status_jadwal: j.statusJadwal || "",
        plan_start: planDates.start || "",
        plan_end: planDates.end || "",
        deskripsi: j.deskripsi, peserta: peserta,
        is_room_booking: j.isRoomBooking,
        usage_type: j.usageType,
        linked_schedule_id: j.linkedScheduleId
      });
    });

    // Kumpulkan seluruh Training Request (Custom Request di luar jadwal) dari Data Pendaftaran
    var reqGroups = {};
    regs.forEach(function (r) {
      var idJ = str(r[8]), namaP = str(r[9]);
      var isReq = (/^REQ-/i.test(idJ)) || (/^CUSTOM/i.test(idJ)) || (/custom request/i.test(namaP));
      if (!isReq) return;
      if (isRejected(str(r[13]))) return; // request yang sudah ditolak admin tidak ditampilkan

      var groupKey = idJ || str(r[1]) || namaP;
      if (!reqGroups[groupKey]) {
        var startRaw = r[10] || r[0];
        var endRaw = r[11] || r[10] || r[0];
        var isTentative = !r[10] || str(r[10]) === "" || str(r[10]) === "-";
        var parsedDates = sanitizeJadwalDates(startRaw, endRaw, 8, tz);
        var tStart = isTentative ? (isoDate(r[0], tz) || isoDate(new Date(), tz)) : parsedDates.start;
        var tEnd = isTentative ? tStart : parsedDates.end;

        reqGroups[groupKey] = {
          id_jadwal: idJ || ("REQ-" + str(r[1])),
          id_booking: str(r[1]),
          agenda: namaP || "Training Request",
          start: tStart,
          end: tEnd,
          is_tentative: isTentative,
          pic: str(r[12]) || "PIC Pemohon",
          link_dokumen: str(r[14]) || "",
          peserta: []
        };
      }

      var pObj = {
        timestamp: fmtDate(r[0], tz), id_booking: str(r[1]), id_karyawan: maskFromEnd(r[2], 4),
        nama_karyawan: maskFromEnd(r[3], 3), jabatan: str(r[5]), departement: maskFromEnd(r[6], 3), perusahaan: maskFromEnd(r[7], 3),
        id_jadwal: idJ, nama_pelatihan: namaP, pic_pendaftaran: str(r[12]), pic: str(r[12]), validasi: normValidasi(r[13])
      };
      reqGroups[groupKey].peserta.push(pObj);
    });

    var normStr = function(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]/g, ""); };

    Object.keys(reqGroups).forEach(function (k) {
      var req = reqGroups[k];
      var cleanReqTitle = normStr(req.agenda);
      var matched = null;

      // Cari apakah sudah ada jadwal resmi yang cocok di Jadwal Pelatihan.
      // Kecocokan JUDUL saja tidak cukup (judul yang sama dipakai banyak batch/tanggal), maka:
      //  - Request BERTANGGAL  : cocok hanya jika tanggal usulan berada dalam rentang jadwal resmi.
      //  - Request TENTATIF    : cocok hanya jika hanya ada SATU jadwal resmi dengan judul tersebut.
      var dayNum = function (str) {
        var t = String(str || "");
        var iso = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (iso) return (+iso[1]) * 10000 + (+iso[2]) * 100 + (+iso[3]);
        var d = new Date(Date.parse(t));
        return isNaN(d.getTime()) ? 0 : d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
      };
      var titleCands = [];
      for (var m = 0; m < list.length; m++) {
        var itemOfficial = list[m];
        if (itemOfficial.is_request) continue;
        if (itemOfficial.id_jadwal && req.id_jadwal && itemOfficial.id_jadwal.toLowerCase() === req.id_jadwal.toLowerCase()) {
          matched = itemOfficial;
          break;
        }
        var cleanOfficialTitle = normStr(itemOfficial.agenda);
        if (cleanReqTitle && cleanOfficialTitle && (cleanOfficialTitle === cleanReqTitle || cleanOfficialTitle.indexOf(cleanReqTitle) !== -1 || cleanReqTitle.indexOf(cleanOfficialTitle) !== -1)) {
          titleCands.push(itemOfficial);
        }
      }
      if (!matched) {
        if (!req.is_tentative) {
          var reqDay = dayNum(req.start);
          for (var c2 = 0; c2 < titleCands.length; c2++) {
            var s0 = dayNum(titleCands[c2].start), e0 = dayNum(titleCands[c2].end) || s0;
            if (reqDay && s0 && reqDay >= s0 && reqDay <= e0) { matched = titleCands[c2]; break; }
          }
        } else if (titleCands.length === 1) {
          matched = titleCands[0];
        }
      }
      var isSynced = !!matched;
      var syncedId = matched ? matched.id_jadwal : "";
      var statusLnD = isSynced ? ("Tersinkron dengan Jadwal Resmi (" + syncedId + ")") : "Belum didaftarkan Admin LnD jadwalnya";

      if (matched) {
        matched.has_linked_request = true;
        matched.linked_request_id = req.id_jadwal;
        matched.linked_request_count = (matched.linked_request_count || 0) + req.peserta.length;
      }

      list.push({
        id_jadwal: req.id_jadwal,
        id_booking: req.id_booking,
        start: req.start,
        end: req.end,
        duration: req.is_tentative ? "Tentatif (Menunggu Admin LnD)" : "2 Hari (16 Jam)",
        start_hour: "08:00",
        start_minutes: 480,
        agenda: req.agenda,
        pic: req.pic,
        room: "Tentatif (Gold Room / Diklat)",
        batch: "Training Request",
        kuota: req.peserta.length,
        sisa_kuota: 0,
        total_terdaftar: req.peserta.length,
        status: statusLnD,
        status_lnd: statusLnD,
        is_request: true,
        is_synced: isSynced,
        synced_schedule_id: syncedId,
        is_tentative: req.is_tentative,
        link_dokumen: req.link_dokumen,
        deskripsi: "Pengajuan Training Request di luar jadwal oleh " + req.pic + " (" + req.peserta.length + " peserta). Status: " + statusLnD + ".",
        peserta: req.peserta
      });
    });

    // Urutkan jadwal secara kronologis: Tanggal Mulai ASC, lalu Jam Mulai (Start Hour) ASC
    list.sort(function (a, b) {
      var parseTime = function (dStr) {
        if (!dStr) return 0;
        var p = Date.parse(dStr);
        return isNaN(p) ? 0 : p;
      };
      var diff = parseTime(a.start) - parseTime(b.start);
      if (diff !== 0) return diff;
      var minA = a.start_minutes != null ? a.start_minutes : 9999;
      var minB = b.start_minutes != null ? b.start_minutes : 9999;
      if (minA !== minB) return minA - minB;
      return String(a.agenda).localeCompare(String(b.agenda));
    });

    var externalData = null;
    try { externalData = loadExternalData(ss, tz); } catch (eExtIgn) {}

    var roomsData = null;
    try { roomsData = loadRoomData(ss, tz); } catch (eRmIgn) {}

    return jsonOut({ status: "success", total: list.length, data: list, external: externalData, rooms: roomsData, generated_at: new Date().toISOString() });
  } catch (err) {
    return fail("E_SERVER", "Terjadi kesalahan saat membaca jadwal: " + err);
  }
}

/* ------------------------------ POST ------------------------------ */
function parsePayload(e) {
  if (e && e.postData && e.postData.contents) {
    try { return { data: JSON.parse(e.postData.contents) }; }
    catch (x) { return { code: "E_JSON_INVALID", error: "Format JSON tidak valid." }; }
  }
  if (e && e.parameter && e.parameter.payload) {
    try { return { data: JSON.parse(e.parameter.payload) }; }
    catch (x2) { return { code: "E_JSON_INVALID", error: "Format JSON tidak valid." }; }
  }
  return { code: "E_PAYLOAD_KOSONG", error: "Tidak ada data yang dikirim." };
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(20000); }
  catch (err) { return fail("E_BUSY", "Server sedang sibuk memproses pendaftaran lain. Coba lagi beberapa saat."); }

  try {
    var pp = parsePayload(e);
    if (pp.error) return fail(pp.code, pp.error);
    if (pp.data && pp.data.action === "submit_competency") return handleCompetencySubmit(pp.data);
    if (pp.data && pp.data.action === "submit_competency_batch") return handleCompetencyBatch(pp.data);
    if (pp.data && pp.data.action === "admin_login") return handleAdminLogin(pp.data);
    if (pp.data && pp.data.action === "admin_verify_password") return handleAdminVerifyPassword(pp.data);
    if (pp.data && pp.data.action === "admin_add_schedule") return handleAdminSaveSchedule(pp.data, "add");
    if (pp.data && pp.data.action === "admin_edit_schedule") return handleAdminSaveSchedule(pp.data, "edit");
    if (pp.data && pp.data.action === "admin_assign_request_to_schedule") return handleAdminAssignRequestToSchedule(pp.data);
    if (pp.data && pp.data.action === "admin_batch_add_schedule") return handleAdminBatchAddSchedule(pp.data);
    if (pp.data && pp.data.action === "admin_delete_schedule") return handleAdminDeleteSchedule(pp.data);
    if (pp.data && pp.data.action === "admin_reject_request") return handleAdminRejectRequest(pp.data);
    if (pp.data && (pp.data.action === "book_room" || pp.data.action === "add_room_use")) return handleAddRoomUse(pp.data);
    var payload = pp.data || {}, list = payload.peserta;

    if (!Array.isArray(list) || !list.length) return fail("E_PESERTA_KOSONG", "Daftar peserta tidak boleh kosong.");
    if (list.length > MAX_PESERTA) return fail("E_PESERTA_TERLALU_BANYAK", "Maksimal " + MAX_PESERTA + " peserta per pengiriman.");
    var idJadwal = str(payload.id_jadwal);
    var picName = str(payload.pic_pendaftaran || payload.pic_name);
    var picPhone = str(payload.no_hp_pic || payload.pic_phone || payload.kontak_pic || payload.picPhone);
    if (!idJadwal) return fail("E_JADWAL_KOSONG", "Jadwal pelatihan wajib dipilih.");
    if (!picName) return fail("E_PIC_KOSONG", "Nama PIC pendaftaran wajib diisi.");

    // Format PIC pendaftaran lengkap dengan nomor kontak jika tersedia: e.g. "Nama PIC (No HP)"
    var pic = picName;
    if (picPhone && pic.indexOf(picPhone) === -1) {
      pic = pic + " (" + picPhone + ")";
    }

    var ss = getSpreadsheet(), tz = ss.getSpreadsheetTimeZone() || "Asia/Jakarta";
    var shJ = ss.getSheetByName(SHEET_JADWAL), shP = ss.getSheetByName(SHEET_PENDAFTARAN);
    if (!shJ) return fail("E_SHEET_JADWAL", "Sheet '" + SHEET_JADWAL + "' tidak ditemukan.");
    if (!shP) return fail("E_SHEET_DAFTAR", "Sheet '" + SHEET_PENDAFTARAN + "' tidak ditemukan.");

    ensureHeader(shP);
    var regs = readPendaftaran(shP);
    var idBooking = str(payload.id_booking);

    // Cek apakah pengajuan adalah Permintaan Pelatihan di Luar Jadwal (Custom Request)
    var isCustom = (payload.is_custom === true) || (/^REQ-/i.test(idJadwal)) || (/^CUSTOM/i.test(idJadwal));
    var j = null;
    if (isCustom) {
      var customName = str(payload.nama_pelatihan) || "Permintaan Pelatihan Khusus";
      var customStart = str(payload.tanggal_mulai);
      var customEnd = str(payload.tanggal_selesai) || customStart;
      j = {
        id: idJadwal || ("REQ-" + (idBooking || Utilities.formatDate(new Date(), tz, "yyyyMMdd-HHmmss"))),
        agenda: customName,
        startRaw: customStart,
        endRaw: customEnd,
        room: str(payload.ruangan) || "Gold Room",
        batch: "Custom Request",
        kuota: 99,
        sisa_kuota: 99,
        status: "Buka",
        isCustom: true
      };
    } else {
      var all = loadJadwal(shJ, tz);
      for (var a = 0; a < all.length; a++) if (all[a].id === idJadwal) { j = all[a]; break; }
      if (!j) return fail("E_JADWAL_TIDAK_ADA", "Jadwal '" + idJadwal + "' tidak ditemukan. Muat ulang halaman.");
      if (isClosed(j.status)) return fail("E_JADWAL_DITUTUP", "Pendaftaran untuk jadwal ini sudah resmi ditutup dan tidak dapat menerima pendaftaran lagi.");
      if (isRegistrationClosedH1(j.startRaw, tz)) {
        return fail("E_JADWAL_H1_DITUTUP", "Pendaftaran untuk jadwal pelatihan ini sudah resmi ditutup karena telah mencapai batas cut-off (H-1 pukul 12:00 siang sebelum pelaksanaan).");
      }
    }

    // Idempoten: kiriman ulang dengan ID booking sama PADA JADWAL YANG SAMA tidak menggandakan data
    if (idBooking && j && j.id) {
      var sudah = regs.filter(function (r) { return str(r[1]) === idBooking && str(r[8]) === j.id; }).length;
      if (sudah) return jsonOut({ status: "success", duplicate: true, message: "Pendaftaran untuk jadwal ini sudah tersimpan sebelumnya.", id_booking: idBooking, total_peserta: sudah });
    }

    var counts = countByJadwal(regs), sisa = isCustom ? 99 : computeSisa(j, counts);
    // Program dengan kuota penuh tetap dapat menerima pendaftaran (akan diverifikasi oleh Tim L&D)

    // Validasi tiap peserta: hanya menolak jika peserta sudah terdaftar di JADWAL/PELATIHAN YANG SAMA
    var errors = [], seen = {}, existing = {};
    regs.forEach(function (r) { if (j.id && str(r[8]) === j.id && !isRejected(str(r[13]))) existing[str(r[2]).toLowerCase()] = true; });
    var company = str(payload.perusahaan) || DEFAULT_COMPANY, clean = [];
    for (var i = 0; i < list.length; i++) {
      var p = list[i] || {}, n = i + 1;
      var nama = str(p.nama_karyawan || p.nama).replace(/\s+/g, " ");
      var nik = str(p.id_karyawan || p.nip).replace(/\s+/g, "");
      var hp = str(p.no_hp || p.telepon).replace(/[\s\-().]/g, "");
      if (!nik) errors.push("Baris " + n + ": ID karyawan wajib diisi.");
      if (!nama) errors.push("Baris " + n + ": nama wajib diisi.");
      if (!/^(\+?62|0)8\d{7,12}$/.test(hp)) errors.push("Baris " + n + ": nomor HP tidak valid.");
      var key = nik.toLowerCase();
      if (nik && seen[key]) errors.push("Baris " + n + ": ID " + nik + " terdaftar dua kali.");
      else if (nik && existing[key]) errors.push("Baris " + n + ": ID " + nik + " sudah terdaftar di pelatihan ini.");
      seen[key] = true;
      clean.push({ nik: nik, nama: nama, hp: hp, jabatan: str(p.jabatan), dept: str(p.departement || p.dept), perusahaan: str(p.perusahaan) || company });
    }
    if (errors.length) return fail("E_VALIDASI", errors.slice(0, 5).join(" "), { errors: errors });

    // ID booking unik
    var used = {};
    regs.forEach(function (r) { used[str(r[1])] = true; });
    if (!idBooking || used[idBooking]) {
      do { idBooking = "REG-" + Utilities.formatDate(new Date(), tz, "yyyy") + "-" + Math.floor(1000 + Math.random() * 9000); } while (used[idBooking]);
    }

    // Unggah dokumen PDF lampiran ke Google Drive jika dilampirkan
    var fileUrl = "";
    if (payload.file_data && payload.file_name) {
      try {
        fileUrl = saveFileToDrive(payload.file_data, str(payload.file_name), str(payload.file_type) || "application/pdf", idBooking);
      } catch (eDoc) {
        Logger.log("Gagal unggah file ke Drive: " + eDoc);
      }
    }

    var ts = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd HH:mm:ss");
    var tglMulai = isCustom ? str(payload.tanggal_mulai) : isoDate(j.startRaw, tz);
    var tglSelesai = isCustom ? (str(payload.tanggal_selesai) || tglMulai) : isoDate(j.endRaw, tz);
    // Default validasi peserta adalah "OK" sesuai instruksi
    var statusValidasi = str(payload.status_validasi) || "OK";
    var rows = clean.map(function (c) {
      var pValid = str(c.validasi) || statusValidasi;
      return [ts, idBooking, c.nik, c.nama, c.hp, c.jabatan, c.dept, c.perusahaan, j.id, j.agenda, tglMulai, tglSelesai, pic, pValid, fileUrl || "-"];
    });

    var range = shP.getRange(shP.getLastRow() + 1, 1, rows.length, HEADERS.length);
    range.setNumberFormat("@");          // teks: NIK 16 digit & nol di depan HP tidak rusak
    range.setValues(rows);
    SpreadsheetApp.flush();

    var newSisa = Math.max(0, sisa - rows.length);
    if (!isCustom && j.row) {
      try {
        var cK = shJ.getRange(j.row, 11);
        if (!cK.getFormula()) cK.setValue(newSisa);
        if (newSisa <= 0) { var cL = shJ.getRange(j.row, 12); if (!cL.getFormula()) cL.setValue("Penuh"); }
      } catch (eK) { Logger.log("Update sisa kuota gagal: " + eK); }
    }

    return jsonOut({
      status: "success",
      message: isCustom
        ? "Permintaan pelatihan di luar jadwal berhasil diajukan untuk " + rows.length + " peserta. Tim L&D akan segera memvalidasi pengajuan Anda."
        : "Pendaftaran berhasil disimpan untuk " + rows.length + " peserta.",
      id_booking: idBooking,
      total_peserta: rows.length,
      sisa_kuota: isCustom ? null : newSisa,
      timestamp: ts,
      file_url: fileUrl,
      is_custom: isCustom
    });
  } catch (err) {
    Logger.log("doPost error: " + err + (err && err.stack ? "\n" + err.stack : ""));
    return fail("E_SERVER", "Gagal menyimpan data: " + err);
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}



/* =========================================================================
 * PENCATATAN KOMPETENSI KARYAWAN (SELF-SERVICE, INDIVIDUAL & KOLEKTIF)
 * ========================================================================= */
var SHEET_MASTER_COMPETENCY = "Master_Competency";
var SHEET_SUBMIT_COMPETENCY = "Submit_Manpower_Competency";
var COMPETENCY_FOLDER_ID = "1PxFa6EeiGR3Looy3nxl7SdQSRfXRs4Dt";
var COMPETENCY_MAX_FILE_BYTES = 2 * 1024 * 1024;   // 2 MB per lampiran
var COMPETENCY_MAX_ITEMS = 5;                      // maks kompetensi (lampiran) per permintaan
var COMPETENCY_CACHE_KEY = "competency_master_v1";
var COMPETENCY_HEADERS = ["Timestamp", "ID_Submit", "NIK_NoHP", "Nama", "Departemen", "Jabatan",
  "Position_Title", "Nama_Kompetensi", "Tanggal_Pelatihan", "Bulan_Pelatihan", "Tahun_Pelatihan",
  "Nama_File", "Link_Dokumen"];
var BULAN_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus",
  "September", "Oktober", "November", "Desember"];

/** Daftar kompetensi unik dari Master_Competency kolom C (NAMA KOMPETENSI) + kolom D (JENIS). */
function getCompetencyMaster(forceFresh) {
  var cache = CacheService.getScriptCache();
  if (!forceFresh) {
    try {
      var hit = cache.get(COMPETENCY_CACHE_KEY);
      if (hit) return JSON.parse(hit);
    } catch (eC) {}
  }
  var sh = getSpreadsheet().getSheetByName(SHEET_MASTER_COMPETENCY);
  if (!sh) throw new Error("Sheet '" + SHEET_MASTER_COMPETENCY + "' tidak ditemukan.");
  var last = sh.getLastRow(), out = [], seen = {};
  if (last >= 2) {
    sh.getRange(2, 3, last - 1, 2).getValues().forEach(function (r) {
      var nama = str(r[0]).replace(/\s+/g, " ");
      if (!nama || seen[nama.toLowerCase()]) return;
      seen[nama.toLowerCase()] = true;
      out.push({ nama: nama, jenis: str(r[1]) });
    });
  }
  try { cache.put(COMPETENCY_CACHE_KEY, JSON.stringify(out), 300); } catch (eP) {}
  return out;
}

function handleCompetencyList() {
  try {
    var list = getCompetencyMaster(false);
    return jsonOut({ status: "success", total: list.length, competencies: list });
  } catch (err) {
    return fail("E_KOMPETENSI_MASTER", "Gagal membaca daftar kompetensi: " + err);
  }
}

function ensureCompetencySheet(ss) {
  var sh = ss.getSheetByName(SHEET_SUBMIT_COMPETENCY);
  if (!sh) sh = ss.insertSheet(SHEET_SUBMIT_COMPETENCY);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, COMPETENCY_HEADERS.length).setValues([COMPETENCY_HEADERS]).setFontWeight("bold");
    sh.setFrozenRows(1);
  }
  return sh;
}

/** NIK KTP (16 digit) atau nomor HP Indonesia (08xx / 628xx / +628xx). */
function isValidNikOrHp(v) {
  return /^\d{16}$/.test(v) || /^(\+?62|0)8\d{7,12}$/.test(v);
}

/** Buang karakter terlarang untuk nama file Drive. */
function safeFilePart(s) {
  return String(s == null ? "" : s).replace(/[\\\/:*?"<>|#%]+/g, "-").replace(/\s+/g, " ").trim();
}

/** Mengembalikan {ok, ext, mime} bila isi file benar-benar JPG / PDF (cek magic bytes). */
function sniffCompetencyFile(bytes) {
  if (bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46)
    return { ok: true, ext: "pdf", mime: "application/pdf" };
  if (bytes.length >= 3 && (bytes[0] & 0xFF) === 0xFF && (bytes[1] & 0xFF) === 0xD8 && (bytes[2] & 0xFF) === 0xFF)
    return { ok: true, ext: "jpg", mime: "image/jpeg" };
  return { ok: false };
}

function parseYmdStrict(s) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str(s));
  if (!m) return null;
  var y = +m[1], mo = +m[2], d = +m[3], dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return { y: y, mo: mo, d: d, iso: m[0] };
}

/**
 * Menyimpan 1 karyawan x N kompetensi. Setiap kompetensi = 1 baris data + 1 file lampiran.
 * Idempoten berdasarkan id_submit (kiriman ulang karena jaringan putus tidak menggandakan data).
 * Dipanggil dari doPost (sudah memegang LockService).
 */
function handleCompetencySubmit(p) {
  var idSubmit = str(p.id_submit);
  if (!idSubmit) return fail("E_VALIDASI", "ID pengiriman kosong. Muat ulang halaman.");

  var nik = str(p.nik_nohp).replace(/[\s\-().]/g, "");
  var nama = str(p.nama).replace(/\s+/g, " ");
  var dept = str(p.departemen).replace(/\s+/g, " ");
  var jabatan = str(p.jabatan).replace(/\s+/g, " ");
  var title = str(p.position_title).replace(/\s+/g, " ");
  var items = p.items;

  var errors = [];
  if (!isValidNikOrHp(nik)) errors.push("NIK KTP harus 16 digit atau Nomor HP tidak valid.");
  if (!nama) errors.push("Nama wajib diisi.");
  if (!dept) errors.push("Departemen wajib diisi.");
  if (!jabatan) errors.push("Jabatan wajib diisi.");
  if (!title) errors.push("Position Title wajib diisi.");
  if (!Array.isArray(items) || !items.length) errors.push("Pilih minimal 1 kompetensi.");
  else if (items.length > COMPETENCY_MAX_ITEMS) errors.push("Maksimal " + COMPETENCY_MAX_ITEMS + " kompetensi per pengiriman.");
  if (errors.length) return fail("E_VALIDASI", errors.join(" "), { errors: errors });

  var ss = getSpreadsheet(), tz = ss.getSpreadsheetTimeZone() || "Asia/Jakarta";
  var sh = ensureCompetencySheet(ss);

  // Idempoten: ID yang sama sudah tersimpan.
  var lastRow = sh.getLastRow();
  if (lastRow >= 2) {
    var ids = sh.getRange(2, 2, lastRow - 1, 1).getValues();
    for (var q = 0; q < ids.length; q++) {
      if (str(ids[q][0]) === idSubmit) {
        return jsonOut({ status: "success", duplicate: true, id_submit: idSubmit,
          message: "Data ini sudah tersimpan sebelumnya." });
      }
    }
  }

  // Validasi kompetensi terhadap Master_Competency (segarkan cache sekali bila ada yang tidak cocok).
  var master;
  try { master = getCompetencyMaster(false); } catch (eM) { return fail("E_KOMPETENSI_MASTER", "Gagal membaca daftar kompetensi: " + eM); }
  function masterIndex(list) { var o = {}; list.forEach(function (c) { o[c.nama.toLowerCase()] = c.nama; }); return o; }
  var idx = masterIndex(master);
  var refreshed = false;

  var todayIso = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");
  var tomorrowIso = Utilities.formatDate(new Date(new Date().getTime() + 86400000), tz, "yyyy-MM-dd"); // toleransi zona waktu
  var clean = [], seenKey = {};
  for (var i = 0; i < items.length; i++) {
    var it = items[i] || {}, n = i + 1;
    var kompName = str(it.kompetensi).replace(/\s+/g, " ");
    if (kompName && !idx[kompName.toLowerCase()] && !refreshed) {
      try { idx = masterIndex(getCompetencyMaster(true)); } catch (eR) {}
      refreshed = true;
    }
    var kompetensi = idx[kompName.toLowerCase()];
    if (!kompetensi) { errors.push("Kompetensi " + n + ": '" + kompName + "' tidak ada di daftar Master_Competency."); continue; }

    // Tanggal pelatihan OPSIONAL: kosong = diizinkan; bila diisi harus valid (yyyy-MM-dd) dan tidak di masa depan.
    var dt = null, tglRaw = str(it.tanggal);
    if (tglRaw) {
      dt = parseYmdStrict(tglRaw);
      if (!dt || dt.y < 1990) { errors.push("Kompetensi '" + kompetensi + "': tanggal pelatihan tidak valid."); continue; }
      if (dt.iso > tomorrowIso) { errors.push("Kompetensi '" + kompetensi + "': tanggal pelatihan tidak boleh di masa depan."); continue; }
    }

    // Dokumen OPSIONAL: bila dilampirkan harus JPG/PDF asli, maks 2 MB.
    var b64 = str(it.file_data), bytes = null, kind = null;
    if (b64) {
      try { bytes = Utilities.base64Decode(b64); } catch (eB) { errors.push("Kompetensi '" + kompetensi + "': isi berkas rusak."); continue; }
      if (bytes.length > COMPETENCY_MAX_FILE_BYTES) { errors.push("Kompetensi '" + kompetensi + "': ukuran berkas melebihi 2 MB."); continue; }
      kind = sniffCompetencyFile(bytes);
      if (!kind.ok) { errors.push("Kompetensi '" + kompetensi + "': berkas harus berformat JPG atau PDF."); continue; }
    }

    var key = kompetensi.toLowerCase() + "|" + (dt ? dt.y + "-" + dt.mo : "x");
    if (seenKey[key]) { errors.push("Kompetensi '" + kompetensi + "' terisi dua kali" + (dt ? " untuk bulan & tahun yang sama." : " tanpa tanggal.")); continue; }
    seenKey[key] = true;

    // NIK/NOHP_NAMA KOMPETENSI_BULAN_TAHUN.ext (bulan & tahun dilewati bila tanggal kosong)
    var fileName = "";
    if (bytes) {
      var parts = [nik, kompetensi];
      if (dt) parts.push(BULAN_ID[dt.mo - 1], dt.y);
      fileName = safeFilePart(parts.join("_")) + "." + kind.ext;
    }
    clean.push({ kompetensi: kompetensi, dt: dt, bytes: bytes, mime: kind ? kind.mime : "", fileName: fileName });
  }
  if (errors.length) return fail("E_VALIDASI", errors.slice(0, 5).join(" "), { errors: errors });

  // Simpan lampiran (bila ada) ke Drive; rollback bila ada yang gagal.
  var created = [], rows = [], files = [];
  var ts = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd HH:mm:ss");
  try {
    var folder = null;
    clean.forEach(function (c) {
      var url = "";
      if (c.bytes) {
        if (!folder) folder = DriveApp.getFolderById(COMPETENCY_FOLDER_ID);
        var file = folder.createFile(Utilities.newBlob(c.bytes, c.mime, c.fileName));
        created.push(file);
        file.setDescription("Dokumen kompetensi - " + nama + " - ID: " + idSubmit);
        url = file.getUrl();
        files.push({ kompetensi: c.kompetensi, file_name: c.fileName, file_url: url });
      }
      rows.push([ts, idSubmit, nik, nama, dept, jabatan, title, c.kompetensi,
        c.dt ? c.dt.d : "", c.dt ? BULAN_ID[c.dt.mo - 1] : "", c.dt ? c.dt.y : "", c.fileName, url]);
    });
  } catch (errDrive) {
    created.forEach(function (f) { try { f.setTrashed(true); } catch (x) {} });
    Logger.log("Gagal simpan lampiran kompetensi: " + errDrive);
    return fail("E_DRIVE", "Gagal menyimpan dokumen ke Google Drive: " + errDrive);
  }

  try {
    var range = sh.getRange(sh.getLastRow() + 1, 1, rows.length, COMPETENCY_HEADERS.length);
    range.setNumberFormat("@");   // teks: NIK 16 digit & nol di depan HP tidak rusak
    range.setValues(rows);
    SpreadsheetApp.flush();
  } catch (errSheet) {
    created.forEach(function (f) { try { f.setTrashed(true); } catch (x) {} });
    Logger.log("Gagal tulis sheet kompetensi: " + errSheet);
    return fail("E_SERVER", "Gagal menyimpan data ke spreadsheet: " + errSheet);
  }

  return jsonOut({ status: "success", message: "Berhasil menyimpan " + rows.length + " kompetensi untuk " + nama + ".",
    id_submit: idSubmit, total_kompetensi: rows.length, timestamp: ts, files: files });
}

/**
 * Menyimpan 1 kompetensi x N karyawan (Mode Massal / Per Pelatihan).
 * Setiap peserta = 1 baris data di sheet Submit_Manpower_Competency.
 * Lampiran bisa diunggah per orang atau 1 berkas bersama (kolektif).
 */
function handleCompetencyBatch(p) {
  var idSubmit = str(p.id_submit);
  if (!idSubmit) return fail("E_VALIDASI", "ID pengiriman kosong. Muat ulang halaman.");

  var kompName = str(p.kompetensi).replace(/\s+/g, " ");
  if (!kompName) return fail("E_VALIDASI", "Nama kompetensi wajib dipilih.");

  var list = p.peserta;
  if (!Array.isArray(list) || !list.length) return fail("E_PESERTA_KOSONG", "Daftar peserta tidak boleh kosong.");
  if (list.length > 50) return fail("E_PESERTA_TERLALU_BANYAK", "Maksimal 50 peserta per pengiriman.");

  var master;
  try { master = getCompetencyMaster(false); } catch (eM) { return fail("E_KOMPETENSI_MASTER", "Gagal membaca daftar kompetensi: " + eM); }
  // masterIndex sudah dideklarasikan di atas (baris 1146)
  var idx = masterIndex(master);
  if (!idx[kompName.toLowerCase()]) {
    try { idx = masterIndex(getCompetencyMaster(true)); } catch (eR) {}
  }
  var kompetensi = idx[kompName.toLowerCase()];
  if (!kompetensi) return fail("E_VALIDASI", "Kompetensi '" + kompName + "' tidak ada di Master_Competency.");

  var ss = getSpreadsheet(), tz = ss.getSpreadsheetTimeZone() || "Asia/Jakarta";
  var tomorrowIso = Utilities.formatDate(new Date(new Date().getTime() + 86400000), tz, "yyyy-MM-dd");

  var dt = null, tglRaw = str(p.tanggal);
  if (tglRaw) {
    dt = parseYmdStrict(tglRaw);
    if (!dt || dt.y < 1990) return fail("E_VALIDASI", "Tanggal pelatihan tidak valid.");
    if (dt.iso > tomorrowIso) return fail("E_VALIDASI", "Tanggal pelatihan tidak boleh di masa depan.");
  }

  var sh = ensureCompetencySheet(ss);
  var lastRow = sh.getLastRow();
  if (lastRow >= 2) {
    var ids = sh.getRange(2, 2, lastRow - 1, 1).getValues();
    for (var q = 0; q < ids.length; q++) {
      if (str(ids[q][0]) === idSubmit) {
        return jsonOut({ status: "success", duplicate: true, id_submit: idSubmit,
          message: "Data batch ini sudah tersimpan sebelumnya." });
      }
    }
  }

  var errors = [], clean = [], seenNik = {};
  for (var i = 0; i < list.length; i++) {
    var r = list[i] || {}, n = i + 1;
    var nik = str(r.nik_nohp).replace(/[\s\-().]/g, "");
    var nama = str(r.nama).replace(/\s+/g, " ");
    var dept = str(r.departemen).replace(/\s+/g, " ");
    var jabatan = str(r.jabatan).replace(/\s+/g, " ");
    var title = str(r.position_title).replace(/\s+/g, " ");

    if (!isValidNikOrHp(nik)) errors.push("Baris " + n + ": NIK KTP (16 digit) atau Nomor HP tidak valid.");
    if (!nama) errors.push("Baris " + n + ": Nama wajib diisi.");
    if (!dept) errors.push("Baris " + n + ": Departemen wajib diisi.");
    if (!jabatan) errors.push("Baris " + n + ": Jabatan wajib diisi.");
    if (!title) errors.push("Baris " + n + ": Position Title wajib diisi.");

    var key = nik.toLowerCase();
    if (seenNik[key]) errors.push("Baris " + n + ": NIK/HP " + nik + " terdaftar dua kali.");
    seenNik[key] = true;

    var b64 = str(r.file_data), bytes = null, kind = null, fileName = "";
    if (b64) {
      try { bytes = Utilities.base64Decode(b64); } catch (eB) { errors.push("Baris " + n + ": Berkas rusak."); }
      if (bytes && bytes.length > COMPETENCY_MAX_FILE_BYTES) errors.push("Baris " + n + ": Berkas melebihi 2 MB.");
      if (bytes) {
        kind = sniffCompetencyFile(bytes);
        if (!kind.ok) errors.push("Baris " + n + ": Berkas harus JPG atau PDF.");
        else {
          var parts = [nik, kompetensi];
          if (dt) parts.push(BULAN_ID[dt.mo - 1], dt.y);
          fileName = safeFilePart(parts.join("_")) + "." + kind.ext;
        }
      }
    }

    clean.push({ nik: nik, nama: nama, dept: dept, jabatan: jabatan, title: title, bytes: bytes, mime: kind ? kind.mime : "", fileName: fileName });
  }
  if (errors.length) return fail("E_VALIDASI", errors.slice(0, 5).join(" "), { errors: errors });

  var sharedBytes = null, sharedKind = null, sharedFileName = "", sharedUrl = "";
  var sharedB64 = str(p.shared_file_data);
  if (sharedB64) {
    try { sharedBytes = Utilities.base64Decode(sharedB64); } catch (eSb) { return fail("E_VALIDASI", "Berkas bersama rusak."); }
    if (sharedBytes.length > COMPETENCY_MAX_FILE_BYTES) return fail("E_VALIDASI", "Berkas bersama melebihi 2 MB.");
    sharedKind = sniffCompetencyFile(sharedBytes);
    if (!sharedKind.ok) return fail("E_VALIDASI", "Berkas bersama harus berformat JPG atau PDF.");
    var sParts = ["KOLEKTIF", kompetensi];
    if (dt) sParts.push(BULAN_ID[dt.mo - 1], dt.y);
    sharedFileName = safeFilePart(sParts.join("_")) + "." + sharedKind.ext;
  }

  var created = [], rows = [];
  var ts = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd HH:mm:ss");
  try {
    var folder = null;
    if (sharedBytes) {
      folder = DriveApp.getFolderById(COMPETENCY_FOLDER_ID);
      var sFile = folder.createFile(Utilities.newBlob(sharedBytes, sharedKind.mime, sharedFileName));
      created.push(sFile);
      sFile.setDescription("Dokumen kolektif kompetensi: " + kompetensi + " - ID: " + idSubmit);
      sharedUrl = sFile.getUrl();
    }

    clean.forEach(function (c) {
      var url = "", fn = "";
      if (c.bytes) {
        if (!folder) folder = DriveApp.getFolderById(COMPETENCY_FOLDER_ID);
        var f = folder.createFile(Utilities.newBlob(c.bytes, c.mime, c.fileName));
        created.push(f);
        f.setDescription("Dokumen kompetensi: " + kompetensi + " - " + c.nama + " - ID: " + idSubmit);
        url = f.getUrl();
        fn = c.fileName;
      } else if (sharedUrl) {
        url = sharedUrl;
        fn = sharedFileName;
      }

      rows.push([ts, idSubmit, c.nik, c.nama, c.dept, c.jabatan, c.title, kompetensi,
        dt ? dt.d : "", dt ? BULAN_ID[dt.mo - 1] : "", dt ? dt.y : "", fn, url]);
    });
  } catch (errDrive) {
    created.forEach(function (f) { try { f.setTrashed(true); } catch (x) {} });
    return fail("E_DRIVE", "Gagal menyimpan berkas ke Google Drive: " + errDrive);
  }

  try {
    var range = sh.getRange(sh.getLastRow() + 1, 1, rows.length, COMPETENCY_HEADERS.length);
    range.setNumberFormat("@");
    range.setValues(rows);
    SpreadsheetApp.flush();
  } catch (errSheet) {
    created.forEach(function (f) { try { f.setTrashed(true); } catch (x) {} });
    return fail("E_SERVER", "Gagal menyimpan ke spreadsheet: " + errSheet);
  }

  return jsonOut({ status: "success", message: "Berhasil mencatat kompetensi " + kompetensi + " untuk " + rows.length + " karyawan.",
    id_submit: idSubmit, total_peserta: rows.length, timestamp: ts });
}

/** Jalankan sekali di Apps Script Editor untuk memberi izin & menguji akses sheet + folder Drive kompetensi. */
function testCompetencyAccess() {
  var msg;
  try {
    var list = getCompetencyMaster(true);
    var folder = DriveApp.getFolderById(COMPETENCY_FOLDER_ID);
    ensureCompetencySheet(getSpreadsheet());
    msg = "OK. Kompetensi terbaca: " + list.length + " | Folder: " + folder.getName();
  } catch (e) {
    msg = "Gagal: " + e;
  }
  Logger.log(msg);
  return msg;
}

/* =========================================================================
 * FITUR ADMIN MANAJEMEN JADWAL PELATIHAN (INTERNAL, EXTERNAL & AGENDA LUAR)
 * Autentikasi menggunakan sheet "akses_admin"
 * ========================================================================= */
function getAdminSheet(ss) {
  var sh = ss.getSheetByName(SHEET_AKSES_ADMIN);
  if (sh) return sh;
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var nm = str(sheets[i].getName()).toLowerCase().replace(/[\s\-]+/g, "_");
    if (nm === "akses_admin" || nm === "admin" || nm.indexOf("akses_admin") !== -1) {
      return sheets[i];
    }
  }
  return null;
}

function verifyAdminAuth(ss, username, password, requireUsername) {
  var uIn = str(username).toLowerCase();
  var pIn = str(password);
  if (!pIn) return { ok: false, message: "Password wajib diisi." };
  if (requireUsername && !uIn) return { ok: false, message: "Username wajib diisi." };

  var sh = getAdminSheet(ss);
  if (!sh) return { ok: false, message: "Sheet '" + SHEET_AKSES_ADMIN + "' tidak ditemukan di spreadsheet." };

  var lastRow = sh.getLastRow();
  var lastCol = sh.getLastColumn();
  if (lastRow < 1 || lastCol < 1) {
    return { ok: false, message: "Data akun pada sheet '" + SHEET_AKSES_ADMIN + "' masih kosong." };
  }

  var vals = sh.getRange(1, 1, lastRow, Math.max(2, lastCol)).getDisplayValues();
  var cUser = -1, cPass = -1, cName = -1, cRole = -1;
  var headerRow = vals[0];
  var hasHeader = false;

  for (var c = 0; c < headerRow.length; c++) {
    var h = str(headerRow[c]).toLowerCase();
    if (cUser === -1 && /^(user|username|user_name|user\s*name|id_user|akun|login|nik|email)/i.test(h)) {
      cUser = c; hasHeader = true;
    } else if (cPass === -1 && /^(pass|password|kata[\s_]?sandi|sandi|pin|pwd)/i.test(h)) {
      cPass = c; hasHeader = true;
    } else if (cName === -1 && /^(nama|name|nama_lengkap|full_name)/i.test(h)) {
      cName = c;
    } else if (cRole === -1 && /^(role|jabatan|akses|hak_akses|level)/i.test(h)) {
      cRole = c;
    }
  }

  if (cUser === -1 || cPass === -1) {
    if (headerRow.length >= 3 && /^(no|nomor|id|#)$/i.test(str(headerRow[0]))) {
      cUser = 1; cPass = 2; hasHeader = true;
    } else {
      cUser = 0; cPass = 1;
    }
  }

  var startIdx = (hasHeader && vals.length > 1) ? 1 : 0;
  for (var r = startIdx; r < vals.length; r++) {
    var row = vals[r];
    var rowUser = str(row[cUser]);
    var rowPass = str(row[cPass]);

    // Pencocokan kolom eksplisit
    if (rowPass && rowPass === pIn) {
      if (!uIn || (rowUser && rowUser.toLowerCase() === uIn)) {
        return {
          ok: true,
          username: rowUser || username || "Admin",
          name: (cName !== -1 && str(row[cName])) ? str(row[cName]) : (rowUser || "Admin L&D"),
          role: (cRole !== -1 && str(row[cRole])) ? str(row[cRole]) : "L&D Administrator"
        };
      }
    }

    // Fallback: jika posisi kolom di sheet berbeda (misal No | Nama | Username | Password)
    var foundU = !uIn, foundP = false, matchedUVal = "";
    for (var k = 0; k < row.length; k++) {
      var cellVal = str(row[k]);
      if (!cellVal) continue;
      if (uIn && cellVal.toLowerCase() === uIn) {
        foundU = true;
        matchedUVal = cellVal;
      } else if (cellVal === pIn) {
        foundP = true;
      }
    }
    if (foundU && foundP) {
      return {
        ok: true,
        username: matchedUVal || rowUser || username || "Admin",
        name: (cName !== -1 && str(row[cName])) ? str(row[cName]) : (matchedUVal || rowUser || "Admin L&D"),
        role: (cRole !== -1 && str(row[cRole])) ? str(row[cRole]) : "L&D Administrator"
      };
    }
  }

  return { ok: false, message: "Username atau password admin tidak sesuai dengan sheet '" + SHEET_AKSES_ADMIN + "'." };
}

function handleAdminLogin(p) {
  var ss = getSpreadsheet();
  var auth = verifyAdminAuth(ss, p.username, p.password, true);
  if (!auth.ok) return fail("E_AUTH", auth.message);
  return jsonOut({
    status: "success",
    message: "Login Admin berhasil.",
    admin: { username: auth.username, name: auth.name, role: auth.role }
  });
}

function handleAdminVerifyPassword(p) {
  var ss = getSpreadsheet();
  var auth = verifyAdminAuth(ss, p.username, p.password, false);
  if (!auth.ok) return fail("E_AUTH", auth.message);
  return jsonOut({ status: "success", verified: true, admin: auth });
}

function resolveAdminTargetSheet(ss, category) {
  var cat = str(category).toLowerCase();
  var shName = SHEET_JADWAL;
  var isEventSheet = false;
  if (cat === "external_training" || cat === "external") {
    shName = SHEET_EXTERNAL_SCHEDULE;
  } else if (cat === "agenda_event" || cat === "event" || cat === "agenda_luar") {
    shName = SHEET_AGENDA_LUAR;
    isEventSheet = true;
  }
  var sh = ss.getSheetByName(shName);
  if (!sh) {
    sh = ss.insertSheet(shName);
    if (isEventSheet) {
      sh.getRange(1, 1, 1, 14).setValues([[
        "ID_Jadwal", "START", "END", "AGENDA", "PIC", "LOCATION", "STATUS", "Deskripsi_Pelatihan",
        "Start Hour", "BATCH", "Kuota", "Sisa Kuota", "Duration_Day", "Duration_Hour"
      ]]).setFontWeight("bold");
    } else {
      sh.getRange(1, 1, 1, 14).setValues([[
        "ID_Jadwal", "START", "END", "Duration_Day", "Duration_Hour", "Start Hour",
        "AGENDA", "PIC", "ROOM", "BATCH", "Kuota", "Sisa Kuota", "STATUS", "Deskripsi"
      ]]).setFontWeight("bold");
    }
    sh.setFrozenRows(1);
  }
  return { sheet: sh, sheetName: shName, isEventSheet: isEventSheet, category: cat || "internal" };
}

function parseDateInputForSheet(val) {
  var s = str(val);
  if (!s) return "";
  var ymd = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (ymd) return new Date(+ymd[1], +ymd[2] - 1, +ymd[3]);
  var dmy = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/.exec(s);
  if (dmy) return new Date(+dmy[3], +dmy[2] - 1, +dmy[1]);
  var p = Date.parse(s);
  if (!isNaN(p)) return new Date(p);
  return s;
}

function generateAutoScheduleIdServer(sh, category, tz, seqOffset) {
  var prefix = "JDW";
  var cat = str(category).toLowerCase();
  if (cat === "external_training" || cat === "external") prefix = "EXT";
  else if (cat === "agenda_event" || cat === "event") prefix = "EVT";

  var ym = Utilities.formatDate(new Date(), tz || "Asia/Jakarta", "yyyyMM");
  var lastRow = sh ? sh.getLastRow() : 1;
  var existingIds = {};
  if (sh && lastRow >= 2) {
    var colA = sh.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < colA.length; i++) {
      var idVal = str(colA[i][0]).toUpperCase();
      if (idVal) existingIds[idVal] = true;
    }
  }
  var num = Math.max(1, lastRow) + (seqOffset || 0);
  var candidate = "";
  do {
    var numStr = ("000" + num).slice(-3);
    candidate = prefix + "-" + ym + "-" + numStr;
    num++;
  } while (existingIds[candidate]);
  return candidate;
}

function saveSingleScheduleToSheet(ss, tz, item, mode, seqOffset) {
  var cat = str(item.category || item.source_type || "internal").toLowerCase();
  var target = resolveAdminTargetSheet(ss, cat);
  var sh = target.sheet;

  var agenda = str(item.agenda || item.nama_pelatihan);
  if (!agenda) throw new Error("Nama pelatihan / agenda wajib diisi.");

  var idJadwal = str(item.id_jadwal);
  if (!idJadwal || idJadwal.toUpperCase() === "AUTO") {
    idJadwal = generateAutoScheduleIdServer(sh, cat, tz, seqOffset || 0);
  }
  var origId = str(item.original_id || idJadwal);
  var origAgenda = str(item.original_agenda || agenda);

  var startObj = parseDateInputForSheet(item.start || item.tanggal_mulai);
  var endObj = parseDateInputForSheet(item.end || item.tanggal_selesai || item.start || item.tanggal_mulai);
  if (startObj instanceof Date && endObj instanceof Date && endObj.getTime() < startObj.getTime()) {
    endObj = new Date(startObj.getTime());
  }

  var dDay = parseInt(item.duration_day || item.dDay, 10);
  var dHour = parseInt(item.duration_hour || item.dHour, 10);
  if ((isNaN(dDay) || dDay <= 0) && (startObj instanceof Date) && (endObj instanceof Date)) {
    dDay = Math.max(1, Math.round((endObj.getTime() - startObj.getTime()) / 86400000) + 1);
  }
  if (isNaN(dDay) || dDay <= 0) dDay = 1;
  if (isNaN(dHour) || dHour <= 0) dHour = dDay * 8;

  var parsedH = parseGasStartHour(item.start_hour || item.waktu_mulai || "08:00", tz);
  var startHourStr = parsedH.formatted || "08:00";
  var pic = str(item.pic || "Tim L&D Pani Gold Project");
  var room = str(item.room || item.ruangan || "Gold Room");
  var batch = str(item.batch || (target.isEventSheet ? "Agenda Event" : "Batch 1"));
  var kuota = item.kuota !== undefined && item.kuota !== "" ? Math.max(0, Number(item.kuota) || 0) : (target.isEventSheet ? 0 : 30);
  var rawSisaNum = (item.sisa_kuota !== undefined && item.sisa_kuota !== "" && item.sisa_kuota !== null) ? Number(item.sisa_kuota) : NaN;
  var sisa = !isNaN(rawSisaNum) ? Math.max(0, rawSisaNum) : kuota;
  var status = str(item.status || "Buka");
  var deskripsi = str(item.deskripsi || "");

  var lastRow = sh.getLastRow();
  var lastCol = Math.max(14, sh.getLastColumn());

  if (target.isEventSheet) {
    var targetRowEv = -1;
    if (mode === "edit" && lastRow >= 2) {
      var evVals = sh.getRange(2, 1, lastRow - 1, Math.min(8, lastCol)).getValues();
      for (var i = 0; i < evVals.length; i++) {
        var rId = str(evVals[i][0]);
        var rAg = str(evVals[i][3]);
        if ((origId && rId && rId.toLowerCase() === origId.toLowerCase()) ||
            (idJadwal && rId && rId.toLowerCase() === idJadwal.toLowerCase())) {
          targetRowEv = i + 2;
          break;
        }
      }
      if (targetRowEv === -1 && origAgenda) {
        for (var i2 = 0; i2 < evVals.length; i2++) {
          if (str(evVals[i2][3]).toLowerCase() === origAgenda.toLowerCase()) {
            targetRowEv = i2 + 2;
            break;
          }
        }
      }
    }

    var evRowData = [
      idJadwal,
      startObj || "",
      endObj || "",
      agenda,
      pic,
      room,
      status,
      deskripsi,
      startHourStr,
      batch,
      kuota,
      sisa,
      dDay,
      dHour
    ];

    if (targetRowEv !== -1) {
      sh.getRange(targetRowEv, 1, 1, evRowData.length).setValues([evRowData]);
    } else {
      sh.getRange(lastRow + 1, 1, 1, evRowData.length).setValues([evRowData]);
    }
  } else {
    var headerVals = lastRow >= 1 ? sh.getRange(1, 1, 1, lastCol).getValues()[0] : [];
    function findCol(regex, defIdx) {
      for (var c = 0; c < headerVals.length; c++) {
        if (regex.test(str(headerVals[c]))) return c;
      }
      return defIdx;
    }
    var cId = findCol(/^(id_jadwal|id)/i, 0);
    var cStart = findCol(/^start$/i, 1);
    var cEnd = findCol(/^end$/i, 2);
    var cDDay = findCol(/^(duration_day|durasi_hari)/i, 3);
    var cDHour = findCol(/^(duration_hour|durasi_jam)/i, 4);
    var cStartHour = findCol(/^(start[\s_]?hour|jam[\s_]?mulai|waktu[\s_]?mulai)/i, 5);
    var hasStartHour = (cStartHour !== -1);
    var cAgenda = findCol(/^(agenda|nama_pelatihan|pelatihan|program)/i, hasStartHour ? 6 : 5);
    var cPic = findCol(/^(pic|instruktur|trainer)/i, hasStartHour ? 7 : 6);
    var cRoom = findCol(/^(room|ruangan)/i, hasStartHour ? 8 : 7);
    var cBatch = findCol(/^(batch|angkatan)/i, hasStartHour ? 9 : 8);
    var cKuota = findCol(/^(kuota|quota)/i, hasStartHour ? 10 : 9);
    var cSisa = findCol(/^(sisa[\s_]?kuota|sisa)/i, hasStartHour ? 11 : 10);
    var cStatus = findCol(/^status(?![\s_]*jadwal)/i, hasStartHour ? 12 : 11);
    var cDesc = findCol(/^(deskripsi|desc)/i, hasStartHour ? 13 : 12);
    var cStatusJadwal = findCol(/^(status[\s_]?jadwal|realisasi|keterangan[\s_]?jadwal)/i, -1);
    var cPlanStart = findCol(/^(plan[\s_]?start|tanggal[\s_]?rencana|jadwal[\s_]?awal|start[\s_]?awal)/i, -1);
    var cPlanEnd = findCol(/^(plan[\s_]?end|tanggal[\s_]?selesai[\s_]?rencana|end[\s_]?awal)/i, -1);

    var targetRow = -1;
    if (mode === "edit" && lastRow >= 2) {
      var jVals = sh.getRange(2, 1, lastRow - 1, lastCol).getValues();
      for (var j = 0; j < jVals.length; j++) {
        var rowId = str(jVals[j][cId]);
        if ((origId && rowId && rowId.toLowerCase() === origId.toLowerCase()) ||
            (idJadwal && rowId && rowId.toLowerCase() === idJadwal.toLowerCase())) {
          targetRow = j + 2;
          break;
        }
      }
      if (targetRow === -1 && origAgenda) {
        for (var j2 = 0; j2 < jVals.length; j2++) {
          if (str(jVals[j2][cAgenda]).toLowerCase() === origAgenda.toLowerCase()) {
            targetRow = j2 + 2;
            break;
          }
        }
      }
    }

    var maxIdx = Math.max(cId, cStart, cEnd, cDDay, cDHour, cStartHour, cAgenda, cPic, cRoom, cBatch, cKuota, cSisa, cStatus, cDesc, cStatusJadwal, cPlanStart, cPlanEnd);
    var rowArr = new Array(maxIdx + 1);
    for (var k = 0; k < rowArr.length; k++) rowArr[k] = "";

    var prevStartObj = null;
    var prevEndObj = null;
    if (targetRow !== -1) {
      var existingRow = sh.getRange(targetRow, 1, 1, maxIdx + 1).getValues()[0];
      for (var k2 = 0; k2 < existingRow.length; k2++) rowArr[k2] = existingRow[k2];
      prevStartObj = parseDateInputForSheet(existingRow[cStart]);
      prevEndObj = parseDateInputForSheet(existingRow[cEnd]);
    }

    rowArr[cId] = idJadwal;
    rowArr[cStart] = startObj || "";
    rowArr[cEnd] = endObj || "";
    if (cDDay !== -1) rowArr[cDDay] = dDay;
    if (cDHour !== -1) rowArr[cDHour] = dHour;
    if (cStartHour !== -1) rowArr[cStartHour] = startHourStr;
    rowArr[cAgenda] = agenda;
    if (cPic !== -1) rowArr[cPic] = pic;
    if (cRoom !== -1) rowArr[cRoom] = room;
    if (cBatch !== -1) rowArr[cBatch] = batch;
    if (cKuota !== -1) rowArr[cKuota] = kuota;
    if (cSisa !== -1) rowArr[cSisa] = sisa;
    if (cStatus !== -1) rowArr[cStatus] = status;
    if (cDesc !== -1) rowArr[cDesc] = deskripsi;

    if (cPlanStart !== -1) {
      if (item.plan_start !== undefined && str(item.plan_start)) {
        rowArr[cPlanStart] = parseDateInputForSheet(item.plan_start) || item.plan_start;
      } else if (targetRow !== -1 && !str(rowArr[cPlanStart]) && prevStartObj && startObj) {
        var prevDayKey = Utilities.formatDate(prevStartObj, tz, "yyyy-MM-dd");
        var newDayKey = Utilities.formatDate(startObj, tz, "yyyy-MM-dd");
        if (prevDayKey !== newDayKey) {
          rowArr[cPlanStart] = prevStartObj;
          if (cPlanEnd !== -1 && !str(rowArr[cPlanEnd]) && prevEndObj) {
            rowArr[cPlanEnd] = prevEndObj;
          }
        }
      }
    }
    if (cPlanEnd !== -1 && item.plan_end !== undefined && str(item.plan_end)) {
      rowArr[cPlanEnd] = parseDateInputForSheet(item.plan_end) || item.plan_end;
    }
    if (cStatusJadwal !== -1 && item.status_jadwal !== undefined) {
      rowArr[cStatusJadwal] = str(item.status_jadwal);
    }

    var writeRowIdx = targetRow !== -1 ? targetRow : (lastRow + 1);
    if (cStartHour !== -1) {
      sh.getRange(writeRowIdx, cStartHour + 1).setNumberFormat("@");
    }
    sh.getRange(writeRowIdx, 1, 1, rowArr.length).setValues([rowArr]);
  }

  var fmtStart = (startObj instanceof Date) ? Utilities.formatDate(startObj, tz, "dd-MMM-yyyy") : str(startObj);
  var fmtEnd = (endObj instanceof Date) ? Utilities.formatDate(endObj, tz, "dd-MMM-yyyy") : str(endObj);

  return {
    id_jadwal: idJadwal,
    category: target.category,
    start: fmtStart,
    end: fmtEnd,
    duration_day: dDay,
    duration_hour: dHour,
    duration: dDay + " Hari (" + dHour + " Jam)",
    start_hour: startHourStr,
    start_minutes: parsedH.minutes,
    agenda: agenda,
    pic: pic,
    room: room,
    batch: batch,
    kuota: kuota,
    sisa_kuota: sisa,
    status: status,
    status_jadwal: str(item.status_jadwal || ""),
    deskripsi: deskripsi
  };
}

function handleAdminSaveSchedule(p, mode) {
  try {
    var ss = getSpreadsheet();
    var tz = ss.getSpreadsheetTimeZone() || "Asia/Jakarta";
    if (p.admin_password) {
      var auth = verifyAdminAuth(ss, p.admin_username, p.admin_password, false);
      if (!auth.ok) return fail("E_AUTH", auth.message);
    }
    var item = p.schedule || p;
    var syncReqId = str(p.sync_request_id || item.sync_request_id);
    var shP = null, participantRows = [];
    if (syncReqId) {
      shP = ss.getSheetByName(SHEET_PENDAFTARAN);
      if (!shP || shP.getLastRow() < 2) {
        return fail("E_REQUEST_NOT_FOUND", "Data peserta request " + syncReqId + " tidak ditemukan.");
      }
      var pLastRow = shP.getLastRow();
      var pVals = shP.getRange(2, 1, pLastRow - 1, 12).getValues();
      for (var pi = 0; pi < pVals.length; pi++) {
        if (isRequestRegistrationRow(pVals[pi], syncReqId)) {
          participantRows.push(pi + 2);
        }
      }
      if (!participantRows.length) {
        return fail("E_REQUEST_NOT_FOUND", "Peserta untuk request " + syncReqId + " tidak ditemukan; jadwal belum dibuat.");
      }
    }

    var saved = saveSingleScheduleToSheet(ss, tz, item, mode || "add", 0);
    for (var syncIdx = 0; syncIdx < participantRows.length; syncIdx++) {
      var participantRow = participantRows[syncIdx];
      shP.getRange(participantRow, 9).setValue(saved.id_jadwal);
      if (saved.start) shP.getRange(participantRow, 11).setValue(saved.start);
      if (saved.end) shP.getRange(participantRow, 12).setValue(saved.end);
    }

    SpreadsheetApp.flush();
    return jsonOut({
      status: "success",
      mode: mode,
      schedule: saved,
      synced_participants: participantRows.length,
      message: mode === "edit"
        ? "Jadwal pelatihan '" + saved.agenda + "' berhasil diperbarui."
        : "Jadwal pelatihan '" + saved.agenda + "' berhasil ditambahkan (ID: " + saved.id_jadwal + ")."
    });
  } catch (err) {
    return fail("E_SERVER", "Gagal menyimpan jadwal: " + err);
  }
}

function handleAdminAssignRequestToSchedule(p) {
  try {
    var ss = getSpreadsheet();
    var tz = ss.getSpreadsheetTimeZone() || "Asia/Jakarta";
    if (p.admin_password) {
      var auth = verifyAdminAuth(ss, p.admin_username, p.admin_password, false);
      if (!auth.ok) return fail("E_AUTH", auth.message);
    }

    var requestId = str(p.request_id);
    var scheduleId = str(p.schedule_id);
    if (!/^(REQ-|CUSTOM)/i.test(requestId)) return fail("E_VALIDASI", "ID request tidak valid.");
    if (!scheduleId || /^(REQ-|CUSTOM)/i.test(scheduleId)) return fail("E_VALIDASI", "Pilih jadwal resmi yang valid.");

    var shJ = ss.getSheetByName(SHEET_JADWAL);
    var shP = ss.getSheetByName(SHEET_PENDAFTARAN);
    if (!shJ) return fail("E_SHEET_JADWAL", "Sheet '" + SHEET_JADWAL + "' tidak ditemukan.");
    if (!shP || shP.getLastRow() < 2) return fail("E_NOT_FOUND", "Data peserta request tidak ditemukan.");

    var schedules = loadJadwal(shJ, tz);
    var target = null;
    for (var si = 0; si < schedules.length; si++) {
      if (schedules[si].id && schedules[si].id.toLowerCase() === scheduleId.toLowerCase()) {
        target = schedules[si];
        break;
      }
    }
    if (!target) return fail("E_JADWAL_TIDAK_ADA", "Jadwal tujuan tidak ditemukan.");
    if (isClosed(target.status) || isRegistrationClosedH1(target.startRaw, tz)) {
      return fail("E_JADWAL_DITUTUP", "Jadwal tujuan sudah ditutup atau telah melewati batas pendaftaran.");
    }
    if (!target.startRaw) return fail("E_VALIDASI", "Jadwal tujuan belum memiliki tanggal resmi.");
    if (!(target.kuota > 0)) return fail("E_VALIDASI", "Kuota jadwal tujuan belum ditetapkan.");

    var dataStart = firstDataRow(shP);
    var pLastRow = shP.getLastRow();
    var pVals = shP.getRange(dataStart, 1, pLastRow - dataStart + 1, Math.max(14, shP.getLastColumn())).getValues();
    var regs = readPendaftaran(shP);
    var participantRows = [];
    var targetCount = 0;
    var targetEmployees = {};
    for (var ri = 0; ri < regs.length; ri++) {
      var regId = str(regs[ri][8]);
      if (regId.toLowerCase() === scheduleId.toLowerCase() && !isRejected(str(regs[ri][13]))) {
        targetCount++;
        var targetEmployeeId = str(regs[ri][2]).toLowerCase();
        if (targetEmployeeId) targetEmployees[targetEmployeeId] = true;
      }
    }

    var incomingEmployees = {};
    var requestTitle = "";
    for (var pi = 0; pi < pVals.length; pi++) {
      if (!isRequestRegistrationRow(pVals[pi], requestId) || isRejected(str(pVals[pi][13]))) continue;
      var participantTitle = str(pVals[pi][9]).toLowerCase().replace(/[^a-z0-9]/g, "");
      if (participantTitle && requestTitle && participantTitle !== requestTitle) {
        return fail("E_VALIDASI", "Peserta request memiliki nama pelatihan yang berbeda; gabungkan request secara terpisah.");
      }
      if (participantTitle) requestTitle = participantTitle;
      var employeeId = str(pVals[pi][2]).toLowerCase();
      if (employeeId && (targetEmployees[employeeId] || incomingEmployees[employeeId])) {
        return fail("E_PESERTA_DUPLIKAT", "Ada peserta request yang sudah terdaftar pada jadwal tujuan. Hapus duplikasi sebelum menggabungkan.");
      }
      if (employeeId) incomingEmployees[employeeId] = true;
      participantRows.push(dataStart + pi);
    }
    if (!participantRows.length) return fail("E_REQUEST_NOT_FOUND", "Peserta aktif untuk request " + requestId + " tidak ditemukan.");
    var targetTitle = str(target.agenda).toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!requestTitle || requestTitle !== targetTitle) {
      return fail("E_VALIDASI", "Jadwal tujuan harus memiliki nama pelatihan yang sama dengan request.");
    }
    if (targetCount + participantRows.length > target.kuota) {
      return fail("E_KUOTA_KURANG", "Kuota jadwal tujuan tidak cukup. Sisa kuota " + Math.max(0, target.kuota - targetCount) + ", sedangkan peserta request " + participantRows.length + ".");
    }

    var startDate = fmtDate(target.startRaw, tz);
    var endDate = fmtDate(target.endRaw || target.startRaw, tz);
    for (var moveIdx = 0; moveIdx < participantRows.length; moveIdx++) {
      var participantRow = participantRows[moveIdx];
      shP.getRange(participantRow, 9).setValue(target.id);
      shP.getRange(participantRow, 11).setValue(startDate);
      shP.getRange(participantRow, 12).setValue(endDate);
    }

    var remaining = Math.max(0, target.kuota - targetCount - participantRows.length);
    var scheduleLastCol = Math.max(14, shJ.getLastColumn());
    var scheduleHeaders = shJ.getRange(1, 1, 1, scheduleLastCol).getValues()[0];
    function findScheduleCol(regex, fallback) {
      for (var col = 0; col < scheduleHeaders.length; col++) {
        if (regex.test(str(scheduleHeaders[col]))) return col;
      }
      return fallback;
    }
    var cSisa = findScheduleCol(/^(sisa[\s_]?kuota|sisa)/i, 11);
    var cStatus = findScheduleCol(/^status(?![\s_]?jadwal)/i, 12);
    shJ.getRange(target.row, cSisa + 1).setValue(remaining);
    if (cStatus !== -1 && cStatus !== 12) {
      var targetStatus = remaining === 0 ? "Penuh" : (/^penuh$/i.test(target.status) ? "Buka" : target.status);
      shJ.getRange(target.row, cStatus + 1).setValue(targetStatus);
    } else if (remaining === 0) {
      shJ.getRange(target.row, cStatus + 1).setValue("Penuh");
    } else if (/^penuh$/i.test(target.status)) {
      shJ.getRange(target.row, cStatus + 1).setValue("Buka");
    }

    SpreadsheetApp.flush();
    var dates = sanitizeJadwalDates(target.startRaw, target.endRaw || target.startRaw, target.dHour, tz);
    return jsonOut({
      status: "success",
      schedule: {
        id_jadwal: target.id,
        category: "internal",
        start: dates.start,
        end: dates.end,
        duration_day: parseInt(target.dDay, 10) || 0,
        duration_hour: parseInt(target.dHour, 10) || 0,
        duration: computeSmartDuration(target.dDay, target.dHour, target.startRaw, target.endRaw),
        start_hour: target.startHour,
        start_minutes: target.startMinutes,
        agenda: target.agenda,
        pic: target.pic,
        room: target.room,
        batch: target.batch,
        kuota: target.kuota,
        sisa_kuota: remaining,
        total_terdaftar: targetCount + participantRows.length,
        status: remaining === 0 ? "Penuh" : target.status,
        peserta: []
      },
      synced_participants: participantRows.length,
      message: participantRows.length + " peserta berhasil digabungkan ke jadwal " + target.id + "."
    });
  } catch (err) {
    return fail("E_SERVER", "Gagal menggabungkan peserta ke jadwal: " + err);
  }
}

function handleAdminBatchAddSchedule(p) {
  try {
    var ss = getSpreadsheet();
    var tz = ss.getSpreadsheetTimeZone() || "Asia/Jakarta";
    if (p.admin_password) {
      var auth = verifyAdminAuth(ss, p.admin_username, p.admin_password, false);
      if (!auth.ok) return fail("E_AUTH", auth.message);
    }
    var list = p.schedules;
    if (!Array.isArray(list) || !list.length) {
      return fail("E_VALIDASI", "Daftar jadwal batch tidak boleh kosong.");
    }
    var savedList = [];
    for (var i = 0; i < list.length; i++) {
      var it = list[i] || {};
      if (!it.category && p.category) it.category = p.category;
      var saved = saveSingleScheduleToSheet(ss, tz, it, "add", i);
      savedList.push(saved);
    }
    SpreadsheetApp.flush();
    return jsonOut({
      status: "success",
      total_added: savedList.length,
      schedules: savedList,
      message: "Berhasil menambahkan " + savedList.length + " jadwal pelatihan secara batch."
    });
  } catch (err) {
    return fail("E_SERVER", "Gagal menyimpan batch jadwal: " + err);
  }
}

function handleAdminRejectRequest(p) {
  try {
    var ss = getSpreadsheet();
    var pwd = str(p.password || p.admin_password);
    var usr = str(p.username || p.admin_username);
    if (!pwd) return fail("E_PASSWORD_REQUIRED", "Password admin wajib dimasukkan untuk menolak request.");
    var auth = verifyAdminAuth(ss, usr, pwd, false);
    if (!auth.ok) return fail("E_AUTH", "Password admin salah! Penolakan request dibatalkan.");

    var reqId = str(p.request_id || p.id_jadwal);
    if (!/^(REQ-|CUSTOM)/i.test(reqId)) return fail("E_VALIDASI", "ID request tidak valid.");
    // Alasan: satu baris, maks 120 karakter, tanpa awalan karakter formula spreadsheet.
    var reason = str(p.reason).replace(/[\r\n]+/g, " ").replace(/^[=+\-@\s]+/, "").slice(0, 120);

    var shP = ss.getSheetByName(SHEET_PENDAFTARAN);
    if (!shP || shP.getLastRow() < 2) return fail("E_NOT_FOUND", "Data pendaftaran tidak ditemukan.");
    var vals = shP.getRange(2, 1, shP.getLastRow() - 1, 14).getValues();
    var label = "Ditolak" + (reason ? " - " + reason : "");
    var n = 0;
    for (var i = 0; i < vals.length; i++) {
      if (isRequestRegistrationRow(vals[i], reqId) && !isRejected(str(vals[i][13]))) {
        shP.getRange(i + 2, 14).setValue(label); // kolom N = Validasi
        n++;
      }
    }
    if (!n) return fail("E_NOT_FOUND", "Request tidak ditemukan atau sudah ditolak sebelumnya.");
    SpreadsheetApp.flush();
    return jsonOut({ status: "success", rejected_rows: n, request_id: reqId, message: "Request " + reqId + " ditolak (" + n + " peserta)." });
  } catch (err) {
    return fail("E_SERVER", "Gagal menolak request: " + err);
  }
}
function handleAdminDeleteSchedule(p) {
  try {
    var ss = getSpreadsheet();
    var pwd = str(p.password || p.admin_password);
    var usr = str(p.username || p.admin_username);
    if (!pwd) {
      return fail("E_PASSWORD_REQUIRED", "Password admin wajib dimasukkan kembali untuk menghapus jadwal.");
    }
    var auth = verifyAdminAuth(ss, usr, pwd, false);
    if (!auth.ok) {
      return fail("E_AUTH", "Password admin salah! Penghapusan jadwal dibatalkan.");
    }

    var idJadwal = str(p.id_jadwal);
    var origAgenda = str(p.agenda || p.original_agenda);
    var cat = str(p.category || p.source_type || "internal").toLowerCase();
    if (!idJadwal && !origAgenda) {
      return fail("E_VALIDASI", "ID Jadwal yang akan dihapus tidak ditemukan.");
    }

    var target = resolveAdminTargetSheet(ss, cat);
    var sh = target.sheet;
    var lastRow = sh.getLastRow();
    if (lastRow < 2) {
      return fail("E_NOT_FOUND", "Data jadwal tidak ditemukan di sheet.");
    }

    var lastCol = Math.max(8, sh.getLastColumn());
    var vals = sh.getRange(2, 1, lastRow - 1, lastCol).getValues();
    var delRow = -1;

    for (var i = 0; i < vals.length; i++) {
      var rId = str(vals[i][0]);
      if (idJadwal && rId && rId.toLowerCase() === idJadwal.toLowerCase()) {
        delRow = i + 2;
        break;
      }
    }

    if (delRow === -1 && origAgenda) {
      var cAg = target.isEventSheet ? 3 : 6;
      for (var j = 0; j < vals.length; j++) {
        var rAg = str(vals[j][cAg]) || str(vals[j][5]) || str(vals[j][3]);
        if (rAg && rAg.toLowerCase() === origAgenda.toLowerCase()) {
          delRow = j + 2;
          break;
        }
      }
    }

    if (delRow === -1) {
      return fail("E_NOT_FOUND", "Jadwal '" + (idJadwal || origAgenda) + "' tidak ditemukan di sheet '" + target.sheetName + "'.");
    }

    sh.deleteRow(delRow);
    SpreadsheetApp.flush();

    return jsonOut({
      status: "success",
      deleted_id: idJadwal,
      category: target.category,
      message: "Jadwal '" + (origAgenda || idJadwal) + "' berhasil dihapus secara permanen."
    });
  } catch (err) {
    return fail("E_SERVER", "Gagal menghapus jadwal: " + err);
  }
}

/* =========================================================================
 * OTOMATISASI PENGUNCIAN PENDAFTARAN H-1 (AUTO-LOCK SCHEDULES)
 * =========================================================================
 * Memeriksa seluruh jadwal pelatihan di sheet "Jadwal Pelatihan".
 * Jika tanggal mulai pelatihan telah memasuki batas H-1 (besok, hari H, atau telah lewat),
 * status jadwal otomatis diperbarui menjadi "Tutup (H-1)" di kolom Status Google Spreadsheet.
 */
function autoLockSchedulesH1() {
  try {
    var ss = getSpreadsheet();
    var tz = ss.getSpreadsheetTimeZone() || "Asia/Jakarta";
    var shJ = ss.getSheetByName(SHEET_JADWAL);
    if (!shJ) return "Sheet '" + SHEET_JADWAL + "' tidak ditemukan.";

    var all = loadJadwal(shJ, tz);
    if (!all.length) return "Tidak ada data jadwal di sheet '" + SHEET_JADWAL + "'.";

    var headerVals = shJ.getRange(1, 1, 1, Math.max(14, shJ.getLastColumn())).getValues()[0];
    var cStartHour = -1;
    for (var c = 0; c < headerVals.length; c++) {
      if (/^(start[\s_]?hour|jam[\s_]?mulai|waktu[\s_]?mulai)/i.test(str(headerVals[c]))) {
        cStartHour = c; break;
      }
    }
    var cStatus = -1;
    for (var c2 = 0; c2 < headerVals.length; c2++) {
      if (/^status/i.test(str(headerVals[c2]))) {
        cStatus = c2; break;
      }
    }
    if (cStatus === -1) cStatus = (cStartHour !== -1) ? 12 : 11;
    var colIdx1Based = cStatus + 1;

    var updatedCount = 0;
    var lockedList = [];

    for (var i = 0; i < all.length; i++) {
      var j = all[i];
      // Jika sudah ditutup manual atau dibatalkan, abaikan
      if (/tutup|selesai|closed|batal|cancel/i.test(j.status)) continue;

      if (isRegistrationClosedH1(j.startRaw, tz)) {
        var cell = shJ.getRange(j.row, colIdx1Based);
        if (!cell.getFormula()) {
          cell.setValue("Tutup (H-1)");
          updatedCount++;
          lockedList.push(j.agenda + " (" + (j.id || "Baris " + j.row) + ")");
        }
      }
    }

    SpreadsheetApp.flush();
    var msg = "Auto-Lock H-1 Selesai: " + updatedCount + " jadwal berhasil dikunci menjadi 'Tutup (H-1)'.";
    if (lockedList.length > 0) {
      msg += " Modul terkunci: " + lockedList.slice(0, 5).join(", ") + (lockedList.length > 5 ? " dkk." : "");
    }
    Logger.log(msg);
    return msg;
  } catch (err) {
    Logger.log("Error autoLockSchedulesH1: " + err);
    return "Gagal autoLock: " + err;
  }
}

/**
 * Pasang pemicu harian otomatis (Time-driven Trigger).
 * Fungsi ini cukup dijalankan sekali di Apps Script Editor untuk mengaktifkan
 * jadwal harian setiap malam pukul 00:00 (pergantian tanggal).
 */
function setupDailyAutoLockTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "autoLockSchedulesH1") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // Trigger 1: Pukul 12:00 siang (tepat saat batas cut-off 12 jam sebelum pergantian hari)
  ScriptApp.newTrigger("autoLockSchedulesH1")
    .timeBased()
    .everyDays(1)
    .atHour(12)
    .create();

  // Trigger 2: Pukul 00:00 tengah malam (pergantian hari)
  ScriptApp.newTrigger("autoLockSchedulesH1")
    .timeBased()
    .everyDays(1)
    .atHour(0)
    .create();

  var msg = "Pemicu otomatis Auto-Lock H-1 berhasil dipasang! Fungsi autoLockSchedulesH1 akan berjalan otomatis setiap hari pukul 12:00 siang (Cut-off H-1) dan pukul 00:00 tengah malam.";
  Logger.log(msg);
  return msg;
}

/**
 * =========================================================================
 * PENGELOLAAN DATA RUANGAN & BOOKING (roomList; booking tersimpan di Jadwal Pelatihan)
 * =========================================================================
 */
function loadRoomData(ss, tz) {
  var shList = ss.getSheetByName(SHEET_ROOM_LIST);
  var shUse = ss.getSheetByName(SHEET_ROOMS_USE);

  var roomList = [];
  if (shList && shList.getLastRow() >= 2) {
    var lastCol = Math.max(4, shList.getLastColumn());
    var headerVals = shList.getRange(1, 1, 1, lastCol).getValues()[0];
    function findColList(regex, defIdx) {
      for (var c = 0; c < headerVals.length; c++) {
        if (regex.test(str(headerVals[c]))) return c;
      }
      return defIdx;
    }
    var cName = findColList(/^(name|nama|nama[\s_]?ruangan|room|ruangan)/i, 0);
    var cCap = findColList(/^(capacity|kapasitas|kuota|seat)/i, 1);
    var cPic = findColList(/^(pic|penanggung[\s_]?jawab|pengelola)/i, 2);
    var cContact = findColList(/^(contact|kontak|no[\s_]?hp|telepon|wa)/i, 3);

    var rows = shList.getRange(2, 1, shList.getLastRow() - 1, lastCol).getValues();
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var name = str(r[cName]);
      if (!name) continue;
      roomList.push({
        name: name,
        capacity: Number(r[cCap]) || 0,
        pic: str(r[cPic]) || "LnD",
        contact: str(r[cContact]) || ""
      });
    }
  }

  // Fallback default bila sheet roomList kosong
  if (!roomList.length) {
    roomList = [
      { name: "Gold Room 2", capacity: 20, pic: "LnD", contact: "" },
      { name: "Gold Room 3", capacity: 10, pic: "LnD", contact: "" },
      { name: "Gold Room 2 & 3", capacity: 30, pic: "LnD", contact: "" },
      { name: "GSG", capacity: 100, pic: "Aden & Site Service", contact: "" }
    ];
  }

  // Pre-load lookup map dari Jadwal Pelatihan, External_Training_Schedule, dan AGENDA_DILUAR_TRAINING
  var agendaMap = {};
  function populateAgendaMap(sheetName, cat, label) {
    try {
      var sh = ss.getSheetByName(sheetName);
      if (!sh || sh.getLastRow() < 2) return;
      var vals = sh.getDataRange().getValues();
      if (!vals || vals.length < 2) return;
      var h = vals[0];
      var cId = -1, cAgenda = -1, cPic = -1, cRoom = -1, cBatch = -1, cKuota = -1, cSisa = -1, cStatus = -1, cDur = -1, cStart = -1;
      for (var col = 0; col < h.length; col++) {
        var colName = str(h[col]).toLowerCase();
        if (/^(id_jadwal|id|booking_id)/i.test(colName) && cId === -1) cId = col;
        if (/^(agenda|nama_silabus|nama_pelatihan|nama_program|nama_agenda)/i.test(colName) && cAgenda === -1) cAgenda = col;
        if (/^(pic|trainer|nama_trainer|lembaga)/i.test(colName) && cPic === -1) cPic = col;
        if (/^(room|ruangan|location)/i.test(colName) && cRoom === -1) cRoom = col;
        if (/^(batch)/i.test(colName) && cBatch === -1) cBatch = col;
        if (/^(kuota|kuota_peserta)/i.test(colName) && cKuota === -1) cKuota = col;
        if (/^(sisa|sisa_kuota)/i.test(colName) && cSisa === -1) cSisa = col;
        if (/^(status)/i.test(colName) && cStatus === -1) cStatus = col;
        if (/^(duration_hour|duration|durasi)/i.test(colName) && cDur === -1) cDur = col;
        if (/^(start[\s_]?hour|jam_mulai|jam)/i.test(colName) && cStart === -1) cStart = col;
      }
      for (var rowIdx = 1; rowIdx < vals.length; rowIdx++) {
        var rData = vals[rowIdx];
        var idKey = cId !== -1 ? str(rData[cId]) : "";
        if (!idKey) continue;
        agendaMap[idKey] = {
          agenda: cAgenda !== -1 ? str(rData[cAgenda]) : "",
          pic: cPic !== -1 ? str(rData[cPic]) : "",
          room: cRoom !== -1 ? str(rData[cRoom]) : "",
          batch: cBatch !== -1 ? str(rData[cBatch]) : "",
          kuota: cKuota !== -1 ? Number(rData[cKuota]) || 0 : 0,
          sisa_kuota: cSisa !== -1 ? Number(rData[cSisa]) || 0 : 0,
          status: cStatus !== -1 ? str(rData[cStatus]) : "CONFIRMED",
          duration: cDur !== -1 ? (Number(rData[cDur]) || 2) : 2,
          start_hour: cStart !== -1 ? str(rData[cStart]) : "08:00",
          category: cat,
          category_label: label
        };
      }
    } catch (eMap) {
      // Abaikan jika sheet terkait tidak ada
    }
  }

  populateAgendaMap(SHEET_JADWAL, "internal", "Internal Training");
  populateAgendaMap(SHEET_EXTERNAL_SCHEDULE, "external", "External Training");
  populateAgendaMap(SHEET_AGENDA_LUAR, "agenda", "Agenda Luar Training");

  var roomsUse = [];
  if (shUse && shUse.getLastRow() >= 2) {
    var lastColUse = Math.max(6, shUse.getLastColumn());
    var hUse = shUse.getRange(1, 1, 1, lastColUse).getValues()[0];
    function findColUse(regex, defIdx) {
      for (var c = 0; c < hUse.length; c++) {
        if (regex.test(str(hUse[c]))) return c;
      }
      return defIdx;
    }
    var cNo = findColUse(/^(no|nomor)/i, 0);
    var cId = findColUse(/^(agenda_id|id_jadwal|id|booking_id)/i, 1);
    var cDate = findColUse(/^(date|tanggal)/i, 2);
    var cRoom = findColUse(/^(room|ruangan)/i, 3);
    var cHour = findColUse(/^(hour|jam|start[\s_]?hour|waktu)/i, 4);
    var cDuration = findColUse(/^(duration|durasi|durasi[\s_]?jam)/i, 5);

    var uRows = shUse.getRange(2, 1, shUse.getLastRow() - 1, lastColUse).getValues();
    for (var j = 0; j < uRows.length; j++) {
      var ur = uRows[j];
      var dateVal = ur[cDate];
      var dStr = dateVal ? fmtDate(dateVal, tz) : "";
      var idVal = str(ur[cId]);
      var hourVal = str(ur[cHour]);
      var roomVal = cRoom !== -1 ? str(ur[cRoom]) : "";
      var durVal = cDuration !== -1 ? (Number(ur[cDuration]) || 2) : 2;
      if (!dStr && !idVal && !hourVal) continue;

      var info = agendaMap[idVal] || {};

      // Normalisasi jam mulai dan hitung jam selesai dari hour + duration
      var rawStart = hourVal || info.start_hour || "08.00";
      var sClean = String(rawStart).trim().replace(".", ":");
      if (sClean.indexOf("-") !== -1) sClean = sClean.split("-")[0].trim();
      var sParts = sClean.split(":");
      var sH = Number(sParts[0]) || 8;
      var sM = sParts.length > 1 ? (Number(sParts[1]) || 0) : 0;
      var totalMinutes = (sH * 60) + sM + Math.round(durVal * 60);
      var endH = Math.floor(totalMinutes / 60) % 24;
      var endM = totalMinutes % 60;
      var startStr = (sH < 10 ? "0" + sH : "" + sH) + ":" + (sM < 10 ? "0" + sM : "" + sM);
      var endStr = (endH < 10 ? "0" + endH : "" + endH) + ":" + (endM < 10 ? "0" + endM : "" + endM);

      roomsUse.push({
        no: str(ur[cNo]) || String(j + 1),
        agenda_id: idVal,
        id: idVal,
        date: dStr,
        room: roomVal || info.room || "",
        hour: hourVal,
        start_hour: startStr,
        end_hour: endStr,
        duration: durVal,
        agenda: info.agenda || idVal,
        pic: info.pic || "-",
        batch: info.batch || "",
        kuota: info.kuota || 0,
        sisa_kuota: info.sisa_kuota != null ? info.sisa_kuota : (info.kuota || 0),
        category: info.category || "custom",
        category_label: info.category_label || "Penggunaan Ruangan",
        status: info.status || "CONFIRMED"
      });
    }
  }

  return {
    room_list: roomList,
    rooms_use: roomsUse,
    total_rooms: roomList.length
  };
}

function handleAddRoomUse(p) {
  try {
    var ss = getSpreadsheet();
    var tz = ss.getSpreadsheetTimeZone() || "Asia/Jakarta";
    var shJ = ss.getSheetByName(SHEET_JADWAL);
    if (!shJ) return fail("E_SHEET_JADWAL", "Sheet '" + SHEET_JADWAL + "' tidak ditemukan.");

    var usageType = str(p.usage_type).toLowerCase();
    if (usageType !== "training" && usageType !== "non_training") {
      return fail("E_VALIDASI", "Pilih kegunaan Training atau Non-Training.");
    }
    var roomVal = str(p.room || p.ruangan);
    var agenda = str(p.agenda);
    var pic = str(p.pic) || "Belum ditentukan";
    var contact = str(p.contact || p.kontak);
    var rawDate = str(p.date || p.tanggal);
    var dObj = parseDateInputForSheet(rawDate);
    var rawHour = str(p.hour || p.jam || p.start_hour);
    var durationVal = Number(p.duration || p.durasi);
    if (!roomVal || !agenda || !rawDate || !(dObj instanceof Date) || isNaN(dObj.getTime())) {
      return fail("E_VALIDASI", "Ruangan, tanggal, dan agenda wajib diisi dengan benar.");
    }
    if (!/^([01]?\d|2[0-3])[:.][0-5]\d$/.test(rawHour) ||
        !isFinite(durationVal) || durationVal < 0.5 || durationVal > 24) {
      return fail("E_VALIDASI", "Jam mulai atau durasi booking tidak valid.");
    }

    var schedules = loadJadwal(shJ, tz);
    var linkedId = usageType === "training" ? str(p.agenda_id || p.id_jadwal) : "";
    var linked = null;
    if (linkedId && linkedId !== "custom") {
      for (var i = 0; i < schedules.length; i++) {
        if (schedules[i].id.toLowerCase() === linkedId.toLowerCase()) {
          linked = schedules[i];
          break;
        }
      }
    }

    var cleanHour = rawHour.replace(".", ":");
    var note = str(p.notes || p.keterangan);
    var bookingLine = "[BOOKING RUANGAN] Kegunaan: " +
      (usageType === "training" ? "Training" : "Non-Training") +
      "; Durasi Booking: " + durationVal + " jam" +
      (linked ? "; Terkait Jadwal: " + linked.id : "") +
      (contact ? "; Kontak: " + contact.replace(/[\r\n]+/g, " ") : "") +
      (note ? "; Catatan: " + note.replace(/[\r\n]+/g, " ") : "");
    var previousDescription = linked
      ? str(linked.deskripsi).replace(/^\[BOOKING RUANGAN\][^\r\n]*(?:\r?\n)?/i, "")
      : "";
    var description = bookingLine + (previousDescription ? "\n" + previousDescription : "");
    var saveItem = {
      category: "internal",
      id_jadwal: linked ? linked.id : "AUTO",
      original_id: linked ? linked.id : "",
      start: rawDate,
      end: rawDate,
      duration_day: 1,
      duration_hour: Math.ceil(durationVal),
      start_hour: cleanHour,
      agenda: agenda,
      pic: pic,
      room: roomVal,
      batch: linked ? linked.batch : "Booking Ruangan",
      kuota: linked ? linked.kuota : 0,
      sisa_kuota: linked ? linked.sisaRaw : 0,
      status: linked ? linked.status : "Tutup (Booking Ruangan)",
      deskripsi: description,
      status_jadwal: linked ? linked.statusJadwal : ""
    };
    var saved = saveSingleScheduleToSheet(ss, tz, saveItem, linked ? "edit" : "add", 0);
    saved.is_room_booking = true;
    saved.usage_type = usageType;
    saved.linked_schedule_id = linked ? linked.id : "";
    SpreadsheetApp.flush();

    return jsonOut({
      status: "success",
      message: "Booking ruangan berhasil dicatat di sheet " + SHEET_JADWAL,
      schedule: saved
    });
  } catch (err) {
    return fail("E_SERVER", "Gagal menyimpan pemakaian ruangan: " + err);
  }
}

/**
 * UTILITAS (jalankan manual dari editor Apps Script, TIDAK otomatis):
 * Mengisi kolom ID_Jadwal yang kosong pada sheet Jadwal (mis. baris rencana Desember)
 * dengan format JADWAL-YYYY-MM-N, melanjutkan nomor terbesar yang sudah ada untuk bulan tsb.
 * Baris tanpa ID tidak bisa didaftari / dibuka detailnya dengan benar di frontend.
 */
function fillMissingScheduleIds() {
  var ss = getSpreadsheet(), sh = ss.getSheetByName(SHEET_JADWAL);
  if (!sh) throw new Error("Sheet '" + SHEET_JADWAL + "' tidak ditemukan.");
  var tz = ss.getSpreadsheetTimeZone() || "Asia/Jakarta";
  var last = sh.getLastRow();
  if (last < 2) return 0;
  var vals = sh.getRange(2, 1, last - 1, 7).getValues(); // A..G : ID, START, END, ..., AGENDA
  var maxByYm = {};
  vals.forEach(function (r) {
    var m = str(r[0]).match(/^JADWAL-(\d{4})-(\d{2})-(\d+)$/i);
    if (m) { var k = m[1] + "-" + m[2]; maxByYm[k] = Math.max(maxByYm[k] || 0, +m[3]); }
  });
  var filled = 0;
  for (var i = 0; i < vals.length; i++) {
    var id = str(vals[i][0]), agenda = str(vals[i][6]);
    if (id || !agenda || !vals[i][1]) continue;
    var ym = Utilities.formatDate(new Date(vals[i][1]), tz, "yyyy-MM");
    maxByYm[ym] = (maxByYm[ym] || 0) + 1;
    sh.getRange(i + 2, 1).setValue("JADWAL-" + ym + "-" + maxByYm[ym]);
    filled++;
  }
  Logger.log("ID_Jadwal terisi: " + filled + " baris.");
  return filled;
}