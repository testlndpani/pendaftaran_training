(function () {
  "use strict";

  var pendingMergeRequestId = "";
  var originalFetch = window.fetch;
  var originalOpenAssignDateModal = window.openAssignDateModal;
  var originalSubmitAssignDate = window.submitAssignDateToWaitingList;
  var fieldIds = [
    "assign-date-start",
    "assign-date-end",
    "assign-date-hour",
    "assign-date-room",
    "assign-date-batch",
    "assign-date-kuota",
    "assign-date-status",
    "assign-date-pic",
    "assign-date-deskripsi"
  ];

  function getElement(id) {
    return document.getElementById(id);
  }

  function normalizedTitle(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function findSchedule(id) {
    return (window.LIVE_SCHEDULES || []).find(function (schedule) {
      return schedule && String(schedule.id_jadwal || "").toLowerCase() === String(id || "").toLowerCase();
    });
  }

  function parseDate(value) {
    var match = String(value || "").match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (match) {
      return match[1] + "-" + ("0" + match[2]).slice(-2) + "-" + ("0" + match[3]).slice(-2);
    }
    var date = new Date(value);
    if (isNaN(date.getTime())) return "";
    return date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2);
  }

  function availableSeats(schedule) {
    var quota = Number(schedule.kuota);
    if (!(quota > 0)) return 0;
    if (schedule.sisa_kuota !== "" && schedule.sisa_kuota != null && !isNaN(Number(schedule.sisa_kuota))) {
      return Math.max(0, Number(schedule.sisa_kuota));
    }
    return Math.max(0, quota - (Number(schedule.total_terdaftar) || 0));
  }

  function populateSchedules() {
    var select = getElement("assign-date-existing-schedule");
    if (!select) return;
    while (select.options.length > 1) select.remove(1);

    var requestId = (getElement("assign-date-req-id") || {}).value || "";
    var request = (window.LIVE_WAITING_LIST || []).find(function (item) {
      return item && String(item.id_jadwal || "").toLowerCase() === requestId.toLowerCase();
    });
    var participantCount = request && Array.isArray(request.peserta) ? request.peserta.length : 0;
    var requestTitle = normalizedTitle(request && request.agenda);
    var candidates = (window.LIVE_SCHEDULES || []).filter(function (schedule) {
      if (!schedule || schedule.is_request || schedule.is_room_booking || !schedule.id_jadwal || /^(REQ-|CUSTOM)/i.test(schedule.id_jadwal)) return false;
      if (!requestTitle || normalizedTitle(schedule.agenda) !== requestTitle) return false;
      if (!requestTitle || normalizedTitle(schedule.agenda) !== requestTitle) return false;
      if (schedule.is_registration_closed || schedule.is_closed_h1 || /tutup|selesai|closed|batal|cancel/i.test(schedule.status || "")) return false;
      var start = parseDate(schedule.start);
      var end = parseDate(schedule.end || schedule.start);
      if (!start || !end || end < new Date().toISOString().slice(0, 10)) return false;
      return availableSeats(schedule) >= participantCount;
    });

    candidates.forEach(function (schedule) {
      var option = document.createElement("option");
      var dateLabel = schedule.start || "Tanggal belum ditentukan";
      var roomLabel = schedule.room ? " · " + schedule.room : "";
      var remaining = availableSeats(schedule);
      option.value = schedule.id_jadwal;
      option.textContent = schedule.id_jadwal + " · " + schedule.agenda + " · " + dateLabel + roomLabel + " · sisa " + remaining;
      select.appendChild(option);
    });

    var hint = getElement("assign-date-existing-schedule-hint");
    if (hint) {
      hint.textContent = candidates.length
        ? "Hanya jadwal dengan pelatihan yang sama dan kuota yang cukup yang ditampilkan."
        : "Belum ada jadwal aktif untuk pelatihan ini dengan kuota yang cukup. Buat jadwal baru atau periksa jadwal dan kuotanya.";
    }
  }

  function setScheduleFieldsDisabled(disabled) {
    fieldIds.forEach(function (id) {
      var field = getElement(id);
      if (field) field.disabled = disabled;
    });
  }

  function handleAssignExistingScheduleChange() {
    var select = getElement("assign-date-existing-schedule");
    var selected = select && select.value ? findSchedule(select.value) : null;
    var hint = getElement("assign-date-existing-schedule-hint");
    var submitText = getElement("assign-date-submit-text");
    setScheduleFieldsDisabled(!!selected);

    if (selected) {
      var start = parseDate(selected.start);
      var end = parseDate(selected.end || selected.start) || start;
      if (getElement("assign-date-start")) getElement("assign-date-start").value = start;
      if (getElement("assign-date-end")) getElement("assign-date-end").value = end;
      if (getElement("assign-date-hour")) getElement("assign-date-hour").value = selected.start_hour || "08:00";
      if (hint) hint.textContent = "Peserta akan memakai tanggal dan tempat jadwal " + selected.id_jadwal + " (" + selected.agenda + "). Jadwal baru tidak dibuat.";
      if (submitText) submitText.textContent = "Gabungkan & Setujui";
    } else {
      if (hint) hint.textContent = "Pilih jadwal pelatihan yang sama untuk menggabungkan peserta dari request berbeda tanpa membuat jadwal baru.";
      if (submitText) submitText.textContent = "Setujui & Masukkan ke Kalender";
    }
  }

  window.handleAssignExistingScheduleChange = handleAssignExistingScheduleChange;

  if (typeof originalFetch === "function") {
    window.fetch = function (input, init) {
      if (pendingMergeRequestId && init && typeof init.body === "string") {
        var payload;
        try {
          payload = JSON.parse(init.body);
        } catch (error) {
          payload = null;
        }
        var select = getElement("assign-date-existing-schedule");
        if (payload && payload.action === "admin_add_schedule" &&
            String(payload.sync_request_id || "").toLowerCase() === pendingMergeRequestId.toLowerCase() &&
            select && select.value) {
          pendingMergeRequestId = "";
          init = Object.assign({}, init, {
            body: JSON.stringify({
              action: "admin_assign_request_to_schedule",
              admin_username: payload.admin_username,
              request_id: payload.sync_request_id,
              schedule_id: select.value
            })
          });
        }
      }
      return originalFetch.apply(this, arguments.length > 1 ? [input, init] : [input]);
    };
  }

  if (typeof originalOpenAssignDateModal === "function") {
    window.openAssignDateModal = function () {
      var result = originalOpenAssignDateModal.apply(this, arguments);
      var select = getElement("assign-date-existing-schedule");
      if (select) select.value = "";
      populateSchedules();
      handleAssignExistingScheduleChange();
      return result;
    };
  }

  if (typeof originalSubmitAssignDate === "function") {
    window.submitAssignDateToWaitingList = async function (event) {
      var select = getElement("assign-date-existing-schedule");
      if (!select || !select.value) return originalSubmitAssignDate.apply(this, arguments);

      pendingMergeRequestId = (getElement("assign-date-req-id") || {}).value || "";
      try {
        return await originalSubmitAssignDate.apply(this, arguments);
      } finally {
        pendingMergeRequestId = "";
        handleAssignExistingScheduleChange();
      }
    };
  }
})();
