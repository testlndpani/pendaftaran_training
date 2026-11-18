const API_URL="https://script.google.com/macros/s/AKfycbxb_YaLMPz-vK06QOJBhmD1zlZhOgaQimytAf03Mn8hRjsf4hhN_8Tc0W7nt7LNLnKh/exec";let fetchedJadwalList=[],LIVE_SCHEDULES=[],currentModalJadwalId="",rowCount=0,maxQuota=30;const MONTH_NAMES=["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];let currentCalendarYear=new Date().getFullYear(),currentCalendarMonth=new Date().getMonth(),currentActiveView="view-month";const SOFT_LOADER_QUOTES={submit:[{title:"Menyimpan data",desc:"Data sedang dimasukkan ke sistem.",icon:"save",tag:"Menyimpan Data",notice:"Mohon jangan menutup atau memuat ulang halaman."},{title:"Data sedang dimasukkan ke sistem.",desc:"Menyinkronkan data peserta & reservasi kuota ke database terpusat...",icon:"edit_note",tag:"Mencatat Pendaftaran",notice:"Proses pendaftaran sedang berlangsung, tunggu sebentar..."},{title:"Data sedang diproses",desc:"Memastikan registrasi tersimpan rapi dan aman di database...",icon:"task_alt",tag:"Memproses Formulir",notice:"Hampir selesai. Jangan tinggalkan halaman."},{title:"Menyinkronkan data...",desc:"Menghubungkan ke server sistem untuk konfirmasi data...",icon:"hourglass_top",tag:"Sinkronisasi Server",notice:"Sistem sedang mengunci alokasi kursi untuk pesertamu."}],wait:[{title:"Memuat data jadwal",desc:"Mengambil data terbaru dari database.",icon:"refresh",tag:"Memuat Database",notice:"Sedang mengambil data jadwal pelatihan terbaru..."},{title:"Mengambil data terbaru dari database.",desc:"Mengambil daftar pelatihan, ketersediaan ruangan, dan kuota...",icon:"list_alt",tag:"Menyiapkan Jadwal",notice:"Data terhubung langsung dengan Database Pusat L&D Pani."},{title:"Mencari data...",desc:"Menelusuri agenda kegiatan dan sesi kelas yang masih aktif...",icon:"search",tag:"Mencari Agenda",notice:"Menyesuaikan tanggal dan kalender kompetensi..."},{title:"Data belum dapat ditampilkan",desc:"Data sedang disusun.",icon:"hourglass_empty",tag:"Sedikit Lagi",notice:"Data segera ditampilkan."},{title:"Menyinkronkan data...",desc:"Menghubungkan database sistem secara real-time...",icon:"hourglass_top",tag:"Live Sync",notice:"Memastikan informasi kuota paling mutakhir untukmu."}]};let softLoaderTimer=null,softLoaderQuoteIndex=0;window.isDatabaseLoading=!1;function showSoftLoader(e={}){const n=e.type||"submit",t=SOFT_LOADER_QUOTES[n]||SOFT_LOADER_QUOTES.submit;softLoaderQuoteIndex=0;const a=document.getElementById("soft-loader-modal"),r=document.getElementById("soft-loader-card");if(!a||!r)return;softLoaderTimer&&(clearInterval(softLoaderTimer),softLoaderTimer=null);const l=document.getElementById("soft-loader-title"),i=document.getElementById("soft-loader-desc"),s=document.getElementById("soft-loader-tag"),o=document.getElementById("soft-loader-icon-wrap"),c=document.getElementById("soft-loader-notice-text"),d=u=>{!l||!i||(l.style.opacity="0",i.style.opacity="0",setTimeout(()=>{l.textContent=e.title||u.title,i.textContent=e.desc||u.desc,s&&(s.textContent=e.tag||u.tag),c&&(c.textContent=e.notice||u.notice),l.style.opacity="1",i.style.opacity="1"},150))};d(t[0]),e.noRotate||(softLoaderTimer=setInterval(()=>{softLoaderQuoteIndex=(softLoaderQuoteIndex+1)%t.length,d(t[softLoaderQuoteIndex])},3200)),a.classList.remove("hidden"),requestAnimationFrame(()=>{r.classList.remove("scale-95","opacity-0"),r.classList.add("scale-100","opacity-100")})}function hideSoftLoader(){softLoaderTimer&&(clearInterval(softLoaderTimer),softLoaderTimer=null);const e=document.getElementById("soft-loader-modal"),n=document.getElementById("soft-loader-card");!e||!n||(n.classList.remove("scale-100","opacity-100"),n.classList.add("scale-95","opacity-0"),setTimeout(()=>{e.classList.add("hidden")},250))}window.showSoftLoader=showSoftLoader,window.hideSoftLoader=hideSoftLoader;function getWaitingLoaderHtml(e="list"){const n=SOFT_LOADER_QUOTES.wait,t=n[Math.floor(Math.random()*n.length)];return e==="home"?`
        <div class="py-6 px-4 rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 flex flex-col items-center text-center gap-3 animate-pulse">
          <div class="w-12 h-12 rounded-2xl bg-primary-fixed/70 flex items-center justify-center text-2xl select-none soft-float">
            <span class="material-symbols-outlined text-primary text-[28px]">hourglass_top</span>
          </div>
          <div class="flex flex-col gap-1 max-w-sm">
            <span class="font-title-sm text-title-sm font-bold text-on-surface">${escapeHtml(t.title)}</span>
            <span class="text-body-sm text-on-surface-variant">${escapeHtml(t.desc)}</span>
          </div>
          <div class="w-full max-w-xs h-1.5 rounded-full bg-surface-container-high overflow-hidden mt-1">
            <div class="soft-progress-bar h-full rounded-full bg-primary"></div>
          </div>
        </div>
      `:`
      <div class="p-8 sm:p-10 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs flex flex-col items-center text-center gap-4 transition-all">
        <div class="relative flex items-center justify-center my-1">
          <div class="absolute -inset-2 rounded-2xl bg-primary/10 animate-pulse blur-sm"></div>
          <div class="relative w-16 h-16 rounded-2xl bg-surface-container border border-outline-variant/30 flex items-center justify-center text-3xl shadow-inner soft-float select-none">
            <span class="material-symbols-outlined text-primary text-[28px]">hourglass_top</span>
          </div>
        </div>
        <div class="flex flex-col gap-1.5 max-w-md">
          <span class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-primary-fixed text-primary text-xs font-semibold uppercase tracking-wider mx-auto">
            <span class="w-2 h-2 rounded-full bg-primary animate-ping"></span>
            Sinkronisasi Database
          </span>
          <h4 class="font-headline-sm text-headline-sm font-bold text-on-surface mt-1 leading-snug">
            ${escapeHtml(t.title)}
          </h4>
          <p class="font-body-md text-body-md text-on-surface-variant">
            ${escapeHtml(t.desc)}
          </p>
        </div>

        <div class="w-full max-w-xl flex flex-col gap-3 mt-2 pt-3 border-t border-outline-variant/30 opacity-70">
          <div class="h-14 rounded-xl bg-surface-container-low/70 soft-shimmer"></div>
          <div class="h-14 rounded-xl bg-surface-container-low/50 soft-shimmer"></div>
        </div>

        <div class="w-full max-w-xs h-1.5 rounded-full bg-surface-container-high overflow-hidden mt-2">
          <div class="soft-progress-bar h-full rounded-full bg-primary"></div>
        </div>
      </div>
    `}function refreshDataWithLoader(){showSoftLoader({type:"wait",title:"Memuat data jadwal",desc:"Mengambil data terbaru dari database.",icon:"refresh",tag:"Memuat Jadwal"}),fetchAllDatabaseData().finally(()=>{setTimeout(hideSoftLoader,600)})}window.refreshDataWithLoader=refreshDataWithLoader;const SITE_LINKS={instagram:"https://www.instagram.com/merdekacoppergold/",tiktok:"https://www.tiktok.com/@merdekacoppergold",youtube:"https://www.youtube.com/@merdekacoppergold",linkedin:"https://www.linkedin.com/company/pt-merdeka-copper-gold-tbk/",website:"https://merdekacoppergold.com"};function switchPageTab(e){const n=["beranda","pendaftaran","jadwal","external","ruangan","kompetensi"];n.includes(e)||(e="beranda");const t="px-2 xl:px-2.5 2xl:px-3 py-1.5 rounded-lg text-[11.5px] xl:text-xs 2xl:text-[13px] font-bold transition-all text-primary bg-surface-container-lowest shadow-2xs border-b-2 border-primary flex items-center gap-1 xl:gap-1.5 cursor-pointer",a="px-2 xl:px-2.5 2xl:px-3 py-1.5 rounded-lg text-[11.5px] xl:text-xs 2xl:text-[13px] font-medium transition-all text-on-surface-variant hover:text-primary hover:bg-surface-container-lowest/60 flex items-center gap-1 xl:gap-1.5 cursor-pointer",r="px-2 xl:px-2.5 2xl:px-3 py-1.5 rounded-lg text-[11.5px] xl:text-xs 2xl:text-[13px] font-bold transition-all text-emerald-800 bg-surface-container-lowest shadow-2xs border-b-2 border-emerald-600 flex items-center gap-1 xl:gap-1.5 cursor-pointer",l="px-2 xl:px-2.5 2xl:px-3 py-1.5 rounded-lg text-[11.5px] xl:text-xs 2xl:text-[13px] font-semibold transition-all text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50/60 flex items-center gap-1 xl:gap-1.5 cursor-pointer",i="px-2 xl:px-2.5 2xl:px-3 py-1.5 rounded-lg text-[11.5px] xl:text-xs 2xl:text-[13px] font-bold transition-all text-indigo-800 bg-surface-container-lowest shadow-2xs border-b-2 border-indigo-600 flex items-center gap-1 xl:gap-1.5 cursor-pointer",s="px-2 xl:px-2.5 2xl:px-3 py-1.5 rounded-lg text-[11.5px] xl:text-xs 2xl:text-[13px] font-medium transition-all text-on-surface-variant hover:text-indigo-700 hover:bg-indigo-50/60 flex items-center gap-1 xl:gap-1.5 cursor-pointer",o="px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-semibold bg-primary text-on-primary shadow-xs transition-all shrink-0",c="px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-all shrink-0",d="px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-semibold bg-emerald-700 text-white shadow-xs transition-all shrink-0",u="px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-all shrink-0",m="px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-semibold bg-indigo-700 text-white shadow-xs transition-all shrink-0",b="px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-semibold text-indigo-700 hover:bg-indigo-50 transition-all shrink-0";n.forEach(p=>{const f=p===e,g=p==="external",y=p==="ruangan",v=document.getElementById("section-"+p);v&&v.classList.toggle("hidden",!f);const x=document.getElementById("nav-btn-"+p);x&&(g?x.className=f?r:l:y?x.className=f?i:s:x.className=f?t:a);const k=document.getElementById("mobile-nav-"+p);k&&(g?k.className=f?d:u:y?k.className=f?m:b:k.className=f?o:c)});const h=document.getElementById("main-footer");h&&h.classList.toggle("hidden",e!=="beranda");try{history.replaceState(null,null,"#"+e)}catch{}try{document.querySelectorAll("[data-bn]").forEach(function(p){var f=p.dataset.bn===e;p.classList.toggle("is-active",f),p.setAttribute("aria-current",f?"page":"false")})}catch{}window.scrollTo({top:0,behavior:"smooth"}),e==="beranda"&&renderHome(),e==="external"&&typeof renderExtAllViews=="function"&&renderExtAllViews(),e==="ruangan"&&typeof renderRoomUsagePage=="function"&&renderRoomUsagePage()}window.switchPageTab=switchPageTab;function initAmbassador(){const e=Array.from(document.querySelectorAll(".amb-img")),n=Array.from(document.querySelectorAll(".amb-dot"));if(e.length<2)return;let t=0,a=null;const r=i=>{t=i,e.forEach((s,o)=>s.classList.toggle("on",o===i)),n.forEach((s,o)=>{s.classList.toggle("bg-white",o===i),s.classList.toggle("bg-white/40",o!==i)})},l=()=>{clearInterval(a),!window.matchMedia("(prefers-reduced-motion: reduce)").matches&&(a=setInterval(()=>r((t+1)%e.length),5e3))};n.forEach((i,s)=>i.addEventListener("click",()=>{r(s),l()})),r(0),l()}function renderHome(){const e=LIVE_SCHEDULES||[],n=(o,c)=>{const d=document.getElementById(o);d&&(d.textContent=c)},t=new Date,a=new Date(t.getFullYear(),t.getMonth(),t.getDate()),r=new Date(t.getFullYear(),t.getMonth(),1),l=new Date(t.getFullYear(),t.getMonth()+1,0);e.length&&(n("home-stat-aktif",e.filter(o=>!o.is_request).length),n("home-stat-kursi",e.filter(o=>!o.is_request).reduce((o,c)=>o+Math.max(0,Number(c.sisa_kuota)||0),0)),n("home-stat-bulan",e.filter(o=>{if(o.is_request)return!1;const c=itemRange(o);return c&&c[0]<=l&&c[1]>=r}).length));const i=document.getElementById("home-upcoming");if(!i)return;if(!e.length){window.isDatabaseLoading?i.innerHTML=getWaitingLoaderHtml("home"):i.innerHTML='<div class="py-8 text-center text-on-surface-variant">Belum ada jadwal mendatang.</div>';return}const s=e.map(o=>({s:o,r:itemRange(o)})).filter(o=>o.r&&o.r[1]>=a).sort((o,c)=>{const d=o.r[0]-c.r[0];if(d!==0)return d;const u=o.s.start_minutes!=null?o.s.start_minutes:9999,m=c.s.start_minutes!=null?c.s.start_minutes:9999;return u-m}).slice(0,4);i.innerHTML=s.length?s.map(({s:o,r:c})=>{if(o.is_request){const m=!!o.is_synced;return`<button type="button" onclick="openTrainingDetailModal(${jsArg(o.id_jadwal)})" class="w-full flex items-center gap-4 py-3.5 text-left hover:bg-amber-50/60 transition-colors">
          <div class="w-14 shrink-0 border-2 border-amber-400 rounded text-center py-1.5 bg-amber-50">
            <div class="font-title-md text-title-md font-extrabold text-amber-900 leading-none">${c[0].getDate()}</div>
            <div class="text-[11px] text-amber-800 font-bold mt-0.5">${MONTH_NAMES[c[0].getMonth()].slice(0,3)}</div>
          </div>
          <div class="min-w-0 flex-1">
            <div class="font-title-sm text-title-sm font-bold text-on-surface truncate flex items-center gap-1.5">
              <span class="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 text-[10px] font-extrabold">REQ</span>
              <span class="truncate">${escapeHtml(o.agenda)}</span>
            </div>
            <div class="text-body-sm text-amber-900 font-medium truncate">${m?"Tersinkron: "+escapeHtml(o.synced_schedule_id):"Belum didaftarkan Admin LnD"} &bull; ${(o.peserta||[]).length} Peserta</div>
          </div>
          <div class="text-right shrink-0 text-label-md font-bold ${m?"text-emerald-700":"text-amber-800"}">${m?"Tersinkron":"Menunggu"}</div>
          <span class="material-symbols-outlined text-[18px] text-amber-600 hidden sm:block">chevron_right</span>
        </button>`}const d=Number(o.sisa_kuota),u=!isNaN(d)&&d<=0;return`<button type="button" onclick="openTrainingDetailModal(${jsArg(o.id_jadwal)})" class="w-full flex items-center gap-4 py-3.5 text-left hover:bg-surface-container-low/60 transition-colors">
        <div class="w-14 shrink-0 border border-outline-variant/70 rounded text-center py-1.5 bg-surface-container-lowest">
          <div class="font-title-md text-title-md font-bold text-primary leading-none">${c[0].getDate()}</div>
          <div class="text-[11px] text-on-surface-variant mt-0.5">${MONTH_NAMES[c[0].getMonth()].slice(0,3)}</div>
        </div>
        <div class="min-w-0 flex-1">
          <div class="font-title-sm text-title-sm font-semibold text-on-surface truncate">${escapeHtml(o.agenda)}</div>
          <div class="text-body-sm text-on-surface-variant truncate">${escapeHtml([o.start_hour?`Pukul ${o.start_hour} WIB`:"",o.room,formatSmartDuration(o.duration,o.start,o.end)].filter(Boolean).join(" • "))}</div>
        </div>
        <div class="text-right shrink-0 text-label-md font-semibold ${u?"text-error":"text-emerald-700"}">${u?"Penuh":isNaN(d)?"":d+" kursi"}</div>
        <span class="material-symbols-outlined text-[18px] text-outline hidden sm:block">chevron_right</span>
      </button>`}).join(""):'<div class="py-8 text-center text-on-surface-variant">Belum ada jadwal mendatang.</div>'}function selectScheduleAndRegister(e,n){const t=(LIVE_SCHEDULES||[]).find(s=>s.id_jadwal===e||s.agenda===n);if(t&&isRegClosedOnly(t)){closeTrainingDetailModal(),switchPageTab("pendaftaran"),showToast("info","Pendaftaran Sudah Ditutup",`Pendaftaran "${t.agenda}" sudah ditutup (batas H-1 pukul 12:00). Anda dialihkan ke formulir Request di Luar Jadwal.`),setCustomTrainingMode(!0,t.agenda);return}if(t&&isSchedulePast(t)){closeTrainingDetailModal(),switchPageTab("pendaftaran"),showToast("info","Jadwal Sudah Terlewat",`Pelatihan "${t.agenda}" telah lewat tanggalnya. Anda dialihkan ke formulir Request di Luar Jadwal.`),setCustomTrainingMode(!0,t.agenda);return}typeof setCustomTrainingMode=="function"&&setCustomTrainingMode(!1);const a=t?Number(t.sisa_kuota):NaN,r=t?!isNaN(a)&&a<=0||/penuh/i.test(t.status):!1;closeTrainingDetailModal(),switchPageTab("pendaftaran");const l=document.getElementById("trainingProgramSelect");if(l){let s=-1;for(let o=0;o<l.options.length;o++)if(l.options[o].getAttribute("data-id")===e||l.options[o].value===e){s=o;break}if(s===-1&&n){for(let o=0;o<l.options.length;o++)if(l.options[o].getAttribute("data-agenda")===n||l.options[o].value===n){s=o;break}}s!==-1?(l.selectedIndex=s,window.currentSelectedScheduleId=l.options[s].getAttribute("data-id")||e):window.currentSelectedScheduleId=e,updateTrainingInfo(),typeof updateProgramComboboxTrigger=="function"&&updateProgramComboboxTrigger()}const i=document.getElementById("participantTable");i&&setTimeout(()=>{i.scrollIntoView({behavior:"smooth",block:"center"})},150),r?showToast("info","Program Terpilih (Kuota Penuh)",`Modul "${n||e}" berstatus kuota penuh. Pendaftaran tetap dibuka dan akan diverifikasi oleh Tim L&D.`):showToast("info","Program Dipilih",`Modul "${n||e}" otomatis terpilih. Silakan isi data peserta.`)}function goToRegistration(e,n){selectScheduleAndRegister(e,n)}function switchCalendarView(e){currentActiveView=e;const n=document.querySelectorAll(".view-tab-btn"),t=document.querySelectorAll(".view-panel"),a="view-tab-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold shadow-sm transition-all cursor-pointer",r="view-tab-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest font-label-md text-label-md font-medium transition-all cursor-pointer";n.forEach(i=>{i.getAttribute("data-target")===e||i.id==="tab-"+e.replace("view-","")?i.className=a:i.className=r}),t.forEach(i=>{i.classList.add("hidden"),i.classList.remove("flex")});const l=document.getElementById(e);if(l&&(l.classList.remove("hidden"),l.classList.add("flex")),e==="view-month")renderMonthGrid(currentCalendarYear,currentCalendarMonth);else if(e==="view-week"){const i=document.getElementById("week-view-title");i&&(i.textContent=`Jadwal Mingguan: ${MONTH_NAMES[currentCalendarMonth]} ${currentCalendarYear}`),renderDynamicWeekView(getFilteredSchedules())}else e==="view-year"?updateYearViewHighlight(currentCalendarYear,currentCalendarMonth):e==="view-list"?renderDynamicListView(getFilteredSchedules()):e==="view-rooms"&&typeof renderCalRoomLanes=="function"&&renderCalRoomLanes()}window.switchCalendarView=switchCalendarView;function updateCalendarPeriod(e,n){currentCalendarYear=e,currentCalendarMonth=n;const t=document.getElementById("month-picker");t&&(t.value=`${e}-${n}`);const a=document.getElementById("quarter-badge");if(a){const i=Math.floor(n/3)+1;a.textContent=`Q${i} FY${e}`}const r=document.getElementById("month-view-title");r&&(r.textContent=`${MONTH_NAMES[n]} ${e}`);const l=document.getElementById("week-view-title");l&&(l.textContent=`Jadwal Mingguan: ${MONTH_NAMES[n]} ${e}`),updateYearViewHighlight(e,n),renderMonthGrid(e,n),currentActiveView==="view-week"?renderDynamicWeekView(getFilteredSchedules()):currentActiveView==="view-list"&&renderDynamicListView(getFilteredSchedules())}window.updateCalendarPeriod=updateCalendarPeriod;function navigatePrev(){currentActiveView==="view-year"?currentCalendarYear--:(currentCalendarMonth--,currentCalendarMonth<0&&(currentCalendarMonth=11,currentCalendarYear--)),updateCalendarPeriod(currentCalendarYear,currentCalendarMonth)}window.navigatePrev=navigatePrev;function navigateNext(){currentActiveView==="view-year"?currentCalendarYear++:(currentCalendarMonth++,currentCalendarMonth>11&&(currentCalendarMonth=0,currentCalendarYear++)),updateCalendarPeriod(currentCalendarYear,currentCalendarMonth)}window.navigateNext=navigateNext;function navigateToday(){const e=new Date;currentCalendarYear=e.getFullYear(),currentCalendarMonth=e.getMonth(),updateCalendarPeriod(currentCalendarYear,currentCalendarMonth)}window.navigateToday=navigateToday;function handleMonthPickerChange(e){if(!e)return;const n=e.split("-");if(n.length===2){const t=parseInt(n[0],10),a=parseInt(n[1],10);updateCalendarPeriod(t,a)}}window.handleMonthPickerChange=handleMonthPickerChange;function selectMonthFromYear(e){currentCalendarMonth=e,updateCalendarPeriod(currentCalendarYear,currentCalendarMonth),switchCalendarView("view-month")}window.selectMonthFromYear=selectMonthFromYear;function getScheduleRegisteredCount(e){if(!e)return 0;if(Array.isArray(e.peserta)&&e.peserta.length>0)return e.peserta.length;if(e.total_terdaftar!=null&&!isNaN(Number(e.total_terdaftar))&&Number(e.total_terdaftar)>0)return Number(e.total_terdaftar);const n=Number(e.kuota)||0,t=Number(e.sisa_kuota);return n>0&&!isNaN(t)?Math.max(0,n-t):0}window.getScheduleRegisteredCount=getScheduleRegisteredCount;function setYearView(e){currentCalendarYear=e,updateCalendarPeriod(currentCalendarYear,currentCalendarMonth)}window.setYearView=setYearView;function renderYearViewMatrix(e,n){const t=document.getElementById("year-matrix-grid"),a=document.getElementById("year-view-title");a&&(a.textContent=`Tinjauan Agenda Tahunan ${e}`),[2025,2026,2027].forEach(g=>{const y=document.getElementById(`btn-yr-${g}`);y&&(g===e?y.className="px-3 py-1 rounded-lg text-xs font-bold bg-primary text-on-primary shadow-xs transition-all":y.className="px-3 py-1 rounded-lg text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-all")});const r=typeof n=="number"?n:currentCalendarMonth;let l=0,i=0,s=0,o="-",c=0,d=0;const u=MONTH_NAMES.map((g,y)=>{const v=`Q${Math.floor(y/3)+1}`,x=new Date(e,y,1),k=new Date(e,y+1,0,23,59,59);let w=(LIVE_SCHEDULES||[]).filter(B=>{const P=itemRange(B);return P&&P[0]<=k&&P[1]>=x});const _=w.length;l+=_,_>0&&s++;let I=0;w.forEach(B=>{I+=getScheduleRegisteredCount(B)}),i+=I,(_>c||_>0&&_===c&&I>d)&&(c=_,d=I,o=g);const S=y===r;w=sortSchedulesChronologically(w);let E="";w.length>0?E=`
          <div class="flex flex-col gap-1.5 mt-1 max-h-[190px] overflow-y-auto pr-1">
            ${w.map(B=>{const P=isSchedulePast(B),A=!!B.is_request,R=!!B.is_synced,$=(B.peserta?B.peserta.length:0)||getScheduleRegisteredCount(B),M=A?R?"bg-amber-500":"bg-orange-500":P?"bg-outline":"bg-primary",T=A?`[Training Request] ${B.agenda} (${R?"Tersinkron: "+B.synced_schedule_id:"Belum didaftarkan Admin LnD"})`:`${B.agenda} (${$} Peserta Terdaftar)`,j=A?R?"REQ SYNC":"REQ: Menunggu":`${$} Peserta`,N=A?R?"bg-emerald-100 text-emerald-800 font-bold":"bg-amber-100 text-amber-900 font-bold":$>0?"text-primary":"text-outline";return`
              <div onclick="event.stopPropagation(); openTrainingDetailModal(${jsArg(B.id_jadwal)})" class="px-2.5 py-1.5 rounded-lg ${A?"bg-amber-50/80 border-amber-300":"bg-surface-container-lowest border-outline-variant/40"} border text-[11px] font-medium ${P?"opacity-60 text-on-surface-variant":"text-on-surface"} flex items-center justify-between gap-2 hover:border-amber-500 hover:bg-amber-100/50 transition-all cursor-pointer" title="${escapeHtml(T)}">
                <div class="flex items-center gap-1.5 min-w-0 flex-1">
                  <span class="w-1.5 h-1.5 rounded-full ${M} shrink-0"></span>
                  <span class="truncate font-semibold">${A?'<span class="text-amber-800 font-bold">[REQ] </span>':""}${escapeHtml(B.agenda)}</span>
                </div>
                <span class="px-1.5 py-0.5 rounded bg-surface-container text-[10px] font-bold ${N} shrink-0">${j}</span>
              </div>
              `}).join("")}
          </div>
        `:E=`
          <div class="flex items-center justify-center min-h-[90px] rounded-lg border border-dashed border-outline-variant/40 bg-surface-container-lowest/40 text-xs text-outline italic">
            Belum ada jadwal pelatihan
          </div>
        `;const L=S?"border-2 border-primary bg-primary/5 shadow-md ring-2 ring-primary/15":_>0?"border border-outline-variant/60 bg-surface-container-low/70 hover:border-primary/60 hover:shadow-md":"border border-surface-container bg-surface-container-low/40 hover:border-outline-variant";return`
        <div data-year-month="${y}" onclick="selectMonthFromYear(${y})" class="year-month-card p-4 rounded-xl flex flex-col justify-between gap-3 w-full cursor-pointer transition-all ${L}" title="Buka Kalender Bulan ${g} ${e}">
          <div class="flex flex-col gap-2.5">
            <!-- Header Bulan -->
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5">
                <span class="font-title-sm text-title-sm font-bold ${S?"text-primary":"text-on-surface"}">${g}</span>
                <span class="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-surface-container text-outline">${v}</span>
              </div>
              <span class="px-2 py-0.5 rounded-full text-[11px] font-bold ${_>0?"bg-primary text-on-primary":"bg-surface-container text-on-surface-variant"}">
                ${_} Pelatihan
              </span>
            </div>

            <!-- Daftar Nama Pelatihan & Peserta Terdaftar -->
            ${E}
          </div>

          <!-- Footer Kartu: Total Peserta Terdaftar -->
          <div class="pt-2.5 border-t border-outline-variant/40 flex items-center justify-between text-xs">
            <span class="font-semibold ${I>0?"text-on-surface":"text-outline"} flex items-center gap-1">
              <span class="material-symbols-outlined text-[15px] ${I>0?"text-primary":"text-outline"}">groups</span>
              Total Terdaftar: <strong>${I.toLocaleString("id-ID")} Peserta</strong>
            </span>
            <span class="material-symbols-outlined text-[16px] text-primary group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
          </div>
        </div>
      `}).join("");t&&(t.innerHTML=u);const m=document.getElementById("yr-stat-sessions");m&&(m.textContent=l.toLocaleString("id-ID"));const b=document.getElementById("yr-stat-seats");b&&(b.textContent=i.toLocaleString("id-ID"));const h=document.getElementById("yr-stat-active-months");h&&(h.textContent=s);const p=document.getElementById("yr-stat-peak");p&&(p.textContent=c>0?`${o} (${c} Sesi)`:"Belum Ada Jadwal");const f=document.getElementById("yr-stat-peak-sub");f&&(f.textContent=c>0?`${d.toLocaleString("id-ID")} peserta terdaftar pada ${o} ${e}`:`Tidak ada jadwal pada tahun ${e}`)}function updateYearViewHighlight(e,n){renderYearViewMatrix(e,n)}function renderMonthGrid(e,n){const t=document.getElementById("month-calendar-grid");if(!t)return;const r=(new Date(e,n,1).getDay()+6)%7,l=new Date(e,n+1,0).getDate(),i=new Date(e,n,0).getDate(),s=new Date,o=s.getFullYear()===e&&s.getMonth()===n,c=s.getDate();let d="";for(let h=r-1;h>=0;h--){const p=i-h;d+=`
        <div class="min-h-[72px] sm:min-h-[105px] p-1.5 sm:p-2.5 flex flex-col justify-between bg-surface-container-low/30 opacity-40 select-none">
          <div class="flex items-center justify-between">
            <span class="font-title-sm text-title-sm text-outline/70 font-medium">${p}</span>
          </div>
          <div class="mt-0.5 sm:mt-1 flex flex-col gap-0.5 sm:gap-1 w-full flex-1"></div>
        </div>
      `}const u=new Date(s.getFullYear(),s.getMonth(),s.getDate()).getTime();for(let h=1;h<=l;h++){const p=new Date(e,n,h).getTime(),f=o&&h===c,g=p<u,y=(r+h-1)%7,v=y===5||y===6,x=f?"min-h-[72px] sm:min-h-[105px] p-1.5 sm:p-2.5 flex flex-col justify-between bg-primary/[0.04] ring-2 ring-primary ring-inset rounded-lg":g?`min-h-[72px] sm:min-h-[105px] p-1.5 sm:p-2.5 flex flex-col justify-between bg-surface-container-low/35 opacity-70 hover:opacity-100 hover:bg-surface-container-low/60 transition-all ${v?"bg-surface-container-low/45":""}`:`min-h-[72px] sm:min-h-[105px] p-1.5 sm:p-2.5 flex flex-col justify-between ${v?"bg-surface-container-low/25":""} hover:bg-surface-container-low/40 transition-colors`,k=f?"font-title-sm text-title-sm text-primary font-extrabold":g?"font-title-sm text-title-sm text-outline/70 font-medium":`font-title-sm text-title-sm ${v?"text-on-surface-variant font-semibold":"text-on-surface font-bold"}`,w=f?'<span class="text-[9px] sm:text-[10px] bg-primary text-on-primary px-1 sm:px-1.5 py-0.2 rounded font-semibold">Hari Ini</span>':"",_=`${e}-${String(n+1).padStart(2,"0")}-${String(h).padStart(2,"0")}`,S=typeof window.isAdminAuthenticated=="function"&&window.isAdminAuthenticated()?`<button type="button" onclick="event.stopPropagation(); openAdminScheduleModal('add', null, 'internal', '${_}')" class="w-5 h-5 rounded-md bg-primary/10 hover:bg-primary text-primary hover:text-white inline-flex items-center justify-center transition-all cursor-pointer shrink-0" title="Tambah jadwal pada ${_}"><span class="material-symbols-outlined text-[13px]">add</span></button>`:"";d+=`
        <div class="${x} group/daycell" data-date="${_}" ${g?'data-past="true"':""}>
          <div class="flex items-center justify-between gap-1">
            <span class="${k}">${h}</span>
            <div class="flex items-center gap-1">
              ${w}
              ${S}
            </div>
          </div>
          <div class="day-events-container mt-0.5 sm:mt-1 flex flex-col gap-0.5 sm:gap-1 w-full flex-1" data-day-container="${h}"></div>
        </div>
      `}const b=(7-(r+l)%7)%7;for(let h=1;h<=b;h++)d+=`
        <div class="min-h-[72px] sm:min-h-[105px] p-1.5 sm:p-2.5 flex flex-col justify-between bg-surface-container-low/30 opacity-40 select-none">
          <div class="flex items-center justify-between">
            <span class="font-title-sm text-title-sm text-outline/70 font-medium">${h}</span>
          </div>
          <div class="mt-0.5 sm:mt-1 flex flex-col gap-0.5 sm:gap-1 w-full flex-1"></div>
        </div>
      `;t.innerHTML=d,injectMonthViewBadges(getFilteredSchedules(),e,n)}window.renderMonthGrid=renderMonthGrid;function getFilteredSchedules(){const e=document.getElementById("schedule-search-input"),n=document.getElementById("schedule-status-filter"),t=document.getElementById("schedule-room-filter"),a=e?e.value.trim().toLowerCase():"",r=n?n.value:"",l=t?t.value:"all";return(LIVE_SCHEDULES||[]).filter(i=>{if(a){const s=(i.agenda||"").toLowerCase().includes(a),o=(i.id_jadwal||"").toLowerCase().includes(a),c=(i.room||"").toLowerCase().includes(a),d=(i.pic||"").toLowerCase().includes(a),u=(i.linked_request_id||"").toLowerCase().includes(a)||Array.isArray(i.linked_request_ids)&&i.linked_request_ids.some(b=>(b||"").toLowerCase().includes(a)),m=Array.isArray(i.peserta)&&i.peserta.some(b=>b.id_jadwal&&b.id_jadwal.toLowerCase().includes(a)||b.id_booking&&b.id_booking.toLowerCase().includes(a)||b.nama_karyawan&&b.nama_karyawan.toLowerCase().includes(a)||b.id_karyawan&&b.id_karyawan.toLowerCase().includes(a));if(!s&&!o&&!c&&!d&&!u&&!m)return!1}if(r==="official"){if(i.is_request)return!1}else if(r==="request"){if(!i.is_request)return!1}else if(r==="request_unscheduled"){if(!i.is_request||i.is_synced)return!1}else if(r==="request_synced"){if(!i.is_request||!i.is_synced)return!1}else if(r==="open"){const s=parseInt(i.sisa_kuota,10);if(!isNaN(s)&&s<=0||isSchedulePast(i))return!1}else if(r==="almost"){const s=parseInt(i.sisa_kuota,10);if(isNaN(s)||s>5||s<=0||isSchedulePast(i))return!1}else if(r==="full"){const s=parseInt(i.sisa_kuota,10);if(!isNaN(s)&&s>0||isSchedulePast(i))return!1}else if(r==="running"){const s=itemRange(i);if(!s)return!1;const o=new Date().getTime();if(o<s[0].getTime()||o>s[1].getTime()+864e5)return!1}else if(r==="past"&&!isSchedulePast(i))return!1;if(l&&l!=="all"){const s=(i.room||"").toLowerCase().trim(),o=l.toLowerCase().trim();if(!s.includes(o)&&!o.includes(s))return!1}return!0})}function checkWaitingListMatchForSearch(e){const n=document.getElementById("calendar-waiting-list-notice");if(!n)return;if(!e){n.classList.add("hidden");return}const t=e.toLowerCase().trim(),r=(window.LIVE_WAITING_LIST||[]).filter(l=>{const i=(l.id_jadwal||"").toLowerCase(),s=(l.agenda||"").toLowerCase(),o=(l.pic||"").toLowerCase();return i.includes(t)||s.includes(t)||o.includes(t)});if(r.length>0){const l=r[0],i=!!l.is_synced,s=document.getElementById("calendar-wl-notice-title"),o=document.getElementById("calendar-wl-notice-badge"),c=document.getElementById("calendar-wl-notice-desc"),d=document.getElementById("calendar-wl-notice-btn");s&&(s.textContent=`Ditemukan di Waiting List: "${l.agenda}" (${l.id_jadwal})`),o&&(o.textContent=i?`Terjadwal (${l.synced_schedule_id||"Resmi"})`:"Menunggu Tanggal Admin",o.className=i?"px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white":"px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-600 text-white"),c&&(c.textContent=i?`Permintaan ini telah resmi dijadwalkan dengan kode jadwal "${l.synced_schedule_id}". Jadwal ini sudah tampil di kalender dengan nama jadwal resmi tersebut.`:"Pengajuan ini sengaja belum dimasukkan ke tanggal kalender karena menunggu penetapan tanggal resmi oleh Admin Tim L&D."),d&&(i?(d.className="h-8 px-3.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-label-md text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer",d.innerHTML='<span class="material-symbols-outlined text-[16px]">calendar_month</span><span>Buka Jadwal di Kalender</span>',d.onclick=()=>{viewScheduledTrainingInCalendar(l.synced_schedule_id||l.id_jadwal)}):(d.className="h-8 px-3.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-label-md text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer",d.innerHTML='<span class="material-symbols-outlined text-[16px]">calendar_add_on</span><span>Buka Waiting List &amp; Jadwalkan</span>',d.onclick=()=>{openWaitingListModal();const u=document.getElementById("waiting-list-search");u&&(u.value=l.id_jadwal,filterWaitingList())})),n.classList.remove("hidden")}else n.classList.add("hidden")}function filterSchedules(){const e=(document.getElementById("schedule-search-input")?.value||"").trim();checkWaitingListMatchForSearch(e);const n=getFilteredSchedules();renderMonthGrid(currentCalendarYear,currentCalendarMonth),currentActiveView==="view-week"?renderDynamicWeekView(n):currentActiveView==="view-list"&&renderDynamicListView(n)}window.filterSchedules=filterSchedules;function resetScheduleFilters(){const e=document.getElementById("schedule-search-input"),n=document.getElementById("schedule-status-filter"),t=document.getElementById("schedule-room-filter");e&&(e.value=""),n&&(n.value="all"),t&&(t.value="all"),checkWaitingListMatchForSearch(""),filterSchedules()}window.resetScheduleFilters=resetScheduleFilters;function extractAndSyncTrainingRequests(e,n){if(!Array.isArray(n)||n.length===0)return[];const t={};n.forEach(l=>{let i=l.c||l;const s=E=>!i||i[E]===void 0||i[E]===null?"":typeof i[E]=="object"&&i[E]!==null?i[E].v!==void 0?i[E].v:i[E].f!==void 0?i[E].f:"":i[E],o=E=>!i||i[E]===void 0||i[E]===null?"":typeof i[E]=="object"&&i[E]!==null?i[E].f!==void 0?i[E].f:i[E].v!==void 0?i[E].v:"":i[E],c=String(o(0)||s(0)||""),d=String(s(1)||"").trim(),u=String(s(2)||"").trim(),m=String(s(3)||"").trim(),b=String(s(4)||"").trim(),h=String(s(5)||"").trim(),p=String(s(6)||"").trim(),f=String(s(7)||"").trim(),g=String(s(8)||"").trim(),y=String(s(9)||"").trim(),v=String(o(10)||s(10)||""),x=String(o(11)||s(11)||""),k=String(s(12)||"").trim(),w=String(s(13)||"OK").trim(),_=String(s(14)||"").trim();if(!(/^REQ-/i.test(g)||/^CUSTOM/i.test(g)||/custom request/i.test(y))||!d&&!g&&!y||/ditolak|reject|batal/i.test(w))return;const S=g||d||y;t[S]||(t[S]={id_jadwal:g||"REQ-"+(d?d.replace(/^REG-/,""):Date.now()),id_booking:d,agenda:y||"Training Request",startRaw:v,endRaw:x||v,pic:k||"PIC Pemohon",link_dokumen:_,timestamp:c,peserta:[]}),t[S].peserta.push({timestamp:c,id_booking:d,id_karyawan:u,nama_karyawan:m,jabatan:h,departement:p,perusahaan:f,id_jadwal:g,nama_pelatihan:y,pic_pendaftaran:k,pic:k,validasi:w})});const a=l=>String(l||"").toLowerCase().replace(/[^a-z0-9]/g,""),r=[];return Object.keys(t).forEach(l=>{const i=t[l],s=a(i.agenda);let o=null;const __rq=i.startRaw&&typeof parseDateString=="function"?parseDateString(i.startRaw):null,__rd=__rq?new Date(__rq.year,__rq.month-1,__rq.day).getTime():null,__cands=[];for(let f=0;f<e.length;f++){const g=e[f];if(g.is_request)continue;if(g.id_jadwal&&i.id_jadwal&&g.id_jadwal.toLowerCase()===i.id_jadwal.toLowerCase()){o=g;break}const y=a(g.agenda);s&&y&&(y===s||y.includes(s)||s.includes(y))&&__cands.push(g)}if(!o){if(__rd!=null)o=__cands.find(g=>{const r0=typeof itemRange=="function"?itemRange(g):null;return r0&&r0[0].getTime()<=__rd&&r0[1].getTime()>=__rd})||null;else __cands.length===1&&(o=__cands[0])}const c=!!o,d=o?o.id_jadwal:"",u=c?`Tersinkron dengan Jadwal Resmi (${d})`:"Belum didaftarkan Admin LnD jadwalnya";o&&(o.has_linked_request=!0,o.linked_request_id=i.id_jadwal,o.linked_request_ids=o.linked_request_ids||[],o.linked_request_ids.includes(i.id_jadwal)||o.linked_request_ids.push(i.id_jadwal),o.linked_request_count=(o.linked_request_count||0)+i.peserta.length,Array.isArray(o.peserta)||(o.peserta=[]),i.peserta.forEach(f=>{o.peserta.some(g=>g.id_karyawan&&g.id_karyawan===f.id_karyawan||g.nama_karyawan&&g.nama_karyawan.toLowerCase()===(f.nama_karyawan||"").toLowerCase())||o.peserta.push(f)}),o.total_terdaftar=o.peserta.length,Number(o.kuota)>0&&(o.sisa_kuota=Math.max(0,Number(o.kuota)-o.total_terdaftar)));let m=null;if(i.startRaw){const f=typeof parseDateString=="function"?parseDateString(i.startRaw):null;if(f){const g=i.endRaw&&typeof parseDateString=="function"?parseDateString(i.endRaw):f;m={start:`${f.year}-${String(f.month).padStart(2,"0")}-${String(f.day).padStart(2,"0")}`,end:g?`${g.year}-${String(g.month).padStart(2,"0")}-${String(g.day).padStart(2,"0")}`:`${f.year}-${String(f.month).padStart(2,"0")}-${String(f.day).padStart(2,"0")}`}}}const b=!m;let h=m?m.start:"",p=m?m.end:"";if(!h){const f=typeof parseDateString=="function"?(parseDateString(i.timestamp)||(x=>x?{year:+x[1],month:+x[2],day:+x[3]}:null)(String(i.id_jadwal||i.id_booking||"").match(/(\d{4})(\d{2})(\d{2})/))):null;f?(h=`${f.year}-${String(f.month).padStart(2,"0")}-${String(f.day).padStart(2,"0")}`,p=h):(h=new Date().toISOString().split("T")[0],p=h)}r.push({id_jadwal:i.id_jadwal,id_booking:i.id_booking,start:h,end:p,duration:b?"Tentatif (Menunggu Admin LnD)":"2 Hari (16 Jam)",start_hour:"08:00",start_minutes:480,agenda:i.agenda,pic:i.pic,room:"Tentatif (Gold Room / Diklat)",batch:"Training Request",kuota:i.peserta.length,sisa_kuota:0,total_terdaftar:i.peserta.length,status:u,status_lnd:u,is_request:!0,is_synced:c,synced_schedule_id:d,is_tentative:b,link_dokumen:i.link_dokumen,deskripsi:`Permintaan Pelatihan di luar jadwal yang diajukan oleh PIC ${i.pic} (${i.peserta.length} peserta). Status: ${u}.`,peserta:i.peserta})}),r}window.extractAndSyncTrainingRequests=extractAndSyncTrainingRequests;async function fetchJadwal(){return await fetchAllDatabaseData()}window.fetchJadwal=fetchJadwal;async function fetchAllDatabaseData(){window.isDatabaseLoading=!0,window.__gvizP=fetchGvizSheetJson("1Y5IQUSN84p2Os1e9wxraDIfZF6UfOql4Y5EdXbv850A","Data Pendaftaran").catch(function(){return null}),!window.__skipAux&&typeof fetchExternalCalendarData=="function"&&fetchExternalCalendarData(),!window.__skipAux&&typeof fetchRoomsData=="function"&&fetchRoomsData();const e=document.getElementById("sync-time-label"),n=document.getElementById("trainingProgramSelect");if(e&&(e.innerHTML='<span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span> Menyinkronkan data...'),!LIVE_SCHEDULES||LIVE_SCHEDULES.length===0){const t=document.getElementById("dynamic-schedule-container");t&&(t.innerHTML=getWaitingLoaderHtml("list"));const a=document.getElementById("home-upcoming");a&&(a.innerHTML=getWaitingLoaderHtml("home"))}try{let t=null;if(!window.__swrTried){window.__swrTried=!0;try{const a=JSON.parse(localStorage.getItem("mgr_swr_v1")||"null");a&&a.res&&Date.now()-a.t<864e5&&(!LIVE_SCHEDULES||!LIVE_SCHEDULES.length)&&(t=a.res,window.__swrRefresh=!0)}catch{}}if(!t)try{const a=new AbortController,r=setTimeout(()=>a.abort(),2e4);try{const l=await fetch(API_URL,{method:"GET",signal:a.signal});if(l.ok){t=await l.json();try{t&&t.status==="success"&&localStorage.setItem("mgr_swr_v1",JSON.stringify({t:Date.now(),res:t}))}catch{}}}finally{clearTimeout(r)}}catch(a){console.warn("GAS API fetch error, trying direct sheets fallback:",a)}if(!t||t.status!=="success"||!Array.isArray(t.data)||t.data.length===0)try{const a="1Y5IQUSN84p2Os1e9wxraDIfZF6UfOql4Y5EdXbv850A",[r,l]=await Promise.all([fetchGvizSheetJson(a,"gid=241528122"),fetchGvizSheetJson(a,"Data Pendaftaran").catch(()=>null)]),i={},s={};if(l&&l.table&&Array.isArray(l.table.rows))try{l.table.rows.forEach(o=>{const c=o.c||[],d=h=>(c[h]?c[h].v!==void 0?c[h].v:c[h].f:"")||"",u=String(d(8)).trim(),m=String(d(9)).trim();if(!u&&!m)return;const b={timestamp:String(d(0)),id_booking:String(d(1)),id_karyawan:String(d(2)),nama_karyawan:String(d(3)),jabatan:String(d(5)),departement:String(d(6)),perusahaan:String(d(7)),id_jadwal:u,nama_pelatihan:m,pic_pendaftaran:String(d(12)).trim(),pic:String(d(12)).trim(),validasi:String(d(13)||"OK")};u?(i[u]=i[u]||[]).push(b):m&&(s[m]=s[m]||[]).push(b)})}catch(o){console.warn("Fallback pendaftaran parse error:",o)}if(r&&r.table&&Array.isArray(r.table.rows)){const o=r.table.cols||[],c=(P,A)=>{for(let R=0;R<o.length;R++){const $=(o[R].label||o[R].id||"").trim();if(P.test($))return R}return A},d=c(/^(id_jadwal|id)/i,0),u=c(/^start$/i,1),m=c(/^end$/i,2),b=c(/^(duration_day|durasi_hari)/i,3),h=c(/^(duration_hour|durasi_jam)/i,4),p=c(/^(start[\s_]?hour|jam[\s_]?mulai|waktu[\s_]?mulai)/i,5),f=p!==-1,g=c(/^(agenda|nama_pelatihan|pelatihan|program)/i,f?6:5),y=c(/^(pic|instruktur|trainer)/i,f?7:6),v=c(/^(room|ruangan)/i,f?8:7),x=c(/^(batch|angkatan)/i,f?9:8),k=c(/^(kuota|quota)/i,f?10:9),w=c(/^(sisa[\s_]?kuota|sisa)/i,f?11:10),_=c(/^status/i,f?12:11),I=c(/^(deskripsi|desc)/i,f?13:12),S=(P,A)=>{if(A===-1||!P||A>=P.length||!P[A])return"";const R=P[A];return R.v!==void 0?R.v:R.f!==void 0?R.f:""},E=(P,A)=>{if(A===-1||!P||A>=P.length||!P[A])return"";const R=P[A];return R.f!==void 0?R.f:R.v!==void 0?R.v:""},B=r.table.rows.map(P=>{const A=P.c||[],R=E(A,b),$=E(A,h);let M=R?`${R} Hari`:"";$&&(M+=` (${$} Jam)`);const T=p!==-1&&A[p]?A[p].v!==void 0?A[p].v:A[p].f:"",j=parseStartHour(T),N=String(S(A,d)||"").trim(),H=String(S(A,g)||"").trim();let F=N?i[N]||[]:[];F.length===0&&!N&&H&&(F=s[H]||[]);const G=Number(S(A,k)||0),q=S(A,w);let C=0;q!==""&&q!==null&&!isNaN(Number(q))?C=Math.max(0,Math.min(Number(q),G-F.length)):C=Math.max(0,G-F.length);const D=String(S(A,_)||"Buka"),O=G>0&&C<=0?"Penuh":D&&!/penuh/i.test(D)?D:C<=0?"Penuh":"Buka";return{id_jadwal:N,start:String(E(A,u)||S(A,u)||""),end:String(E(A,m)||S(A,m)||""),duration:M,start_hour:j.formatted,start_minutes:j.minutes,agenda:H,pic:String(S(A,y)||""),room:String(S(A,v)||""),batch:String(S(A,x)||""),kuota:G,sisa_kuota:C,total_terdaftar:F.length,status:O,deskripsi:String(S(A,I)||""),peserta:F}}).filter(P=>P.id_jadwal&&P.agenda&&!P.is_request&&!/^REQ-/i.test(P.id_jadwal||"")&&!/tutup|selesai|closed|batal/i.test(P.status));if(l&&l.table&&Array.isArray(l.table.rows)){const P=extractAndSyncTrainingRequests(B,l.table.rows);window.LIVE_WAITING_LIST=P||[],typeof updateWaitingListUI=="function"&&updateWaitingListUI()}B.length>0&&(t={status:"success",data:B})}}catch(a){console.warn("Direct Google Sheets fallback error:",a)}if(t&&t.status==="success"&&Array.isArray(t.data)&&t.data.length>0){window.isDatabaseLoading=!1;let a=typeof window.applyAdminOverridesToInternalList=="function"?window.applyAdminOverridesToInternalList(t.data):t.data;a.forEach(s=>{if(!s.is_request&&Array.isArray(s.peserta)){s.peserta=s.peserta.filter(c=>{const d=String(c.id_jadwal||"").trim();return!(/^REQ-/i.test(d)||/^CUSTOM/i.test(d)||d&&s.id_jadwal&&d.toLowerCase()!==s.id_jadwal.toLowerCase())}),s.total_terdaftar=s.peserta.length;const o=Number(s.kuota)||0;if(o>0){const c=Math.max(0,o-s.peserta.length),d=Number(s.sisa_kuota);s.sisa_kuota=!isNaN(d)&&s.sisa_kuota!==""&&s.sisa_kuota!==void 0&&s.sisa_kuota!==null?Math.min(Math.max(0,d),c):c}}else s.is_request&&Array.isArray(s.peserta)&&(s.peserta=s.peserta.filter(o=>{const c=String(o.id_jadwal||"").trim();return!(c&&s.id_jadwal&&c.toLowerCase()!==s.id_jadwal.toLowerCase())}),s.total_terdaftar=s.peserta.length)});try{const s=await(window.__gvizP||fetchGvizSheetJson("1Y5IQUSN84p2Os1e9wxraDIfZF6UfOql4Y5EdXbv850A","Data Pendaftaran"));if(s&&s.table&&Array.isArray(s.table.rows)){const o=extractAndSyncTrainingRequests(a,s.table.rows);window.LIVE_WAITING_LIST=o||[],typeof updateWaitingListUI=="function"&&updateWaitingListUI()}}catch(s){console.warn("Gviz training requests sync fallback error:",s)}a=(()=>{const o=a.filter(s=>!s.is_request&&!/^REQ-/i.test(s.id_jadwal||"")),w=Array.isArray(window.LIVE_WAITING_LIST)&&window.LIVE_WAITING_LIST.length?window.LIVE_WAITING_LIST:a.filter(s=>s.is_request||/^REQ-/i.test(s.id_jadwal||""));return o.concat(w.filter(s=>s.is_request).map(s=>{const c=Object.assign({},s);if(c.is_synced&&c.is_tentative){const m=o.find(x=>x.id_jadwal&&x.id_jadwal===c.synced_schedule_id);m&&m.start&&(c.start=m.start,c.end=m.end||m.start,c.start_hour=m.start_hour||c.start_hour,c.start_minutes=m.start_minutes!=null?m.start_minutes:c.start_minutes,c.room=m.room||c.room)}return c}))})(),a.forEach(s=>{const o=parseStartHour(s.start_hour||s.startHour||s.waktu);s.start_hour=o.formatted,s.start_minutes=o.minutes});const r=sortSchedulesChronologically(a);fetchedJadwalList=r,LIVE_SCHEDULES=r,window.LIVE_SCHEDULES=r,typeof window.reprocessRoomsData=="function"&&window.reprocessRoomsData();const i=new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"});if(e&&(e.innerHTML=`<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Database Sistem: Terhubung (${i} WIB • ${LIVE_SCHEDULES.filter(o=>!o.is_request).length} Pelatihan Aktif)`),n){if(n.innerHTML="",fetchedJadwalList.filter(o=>!o.is_request&&!isSchedulePast(o)&&!isRegClosedOnly(o)).forEach((o,c)=>{const d=document.createElement("option");d.value=o.id_jadwal,d.setAttribute("data-id",o.id_jadwal),d.setAttribute("data-agenda",o.agenda),d.setAttribute("data-date",o.start||"");const u=formatSmartDateRange(o.start,o.end),m=o.start_hour?` • Pukul ${o.start_hour} WIB`:"",b=Number(o.sisa_kuota),p=!isNaN(b)&&b<=0||/penuh/i.test(o.status)?"Kuota Penuh (Verifikasi L&D)":`Sisa ${o.sisa_kuota||0} Kursi`,f=o.batch&&!o.agenda.toLowerCase().includes(o.batch.toLowerCase())?` [${o.batch}]`:"";d.textContent=`${o.agenda}${f} (${u}${m} • ${p})`,n.appendChild(d)}),n.options.length>0)n.selectedIndex=0,n.value=n.options[0].value,window.currentSelectedScheduleId=n.options[0].getAttribute("data-id")||null;else{const o=document.createElement("option");o.value="",o.textContent="Tidak ada jadwal pelatihan aktif mendatang (Ajukan Request di Luar Jadwal)",n.appendChild(o)}updateTrainingInfo()}typeof renderProgramComboboxList=="function"&&renderProgramComboboxList(),typeof updateProgramComboboxTrigger=="function"&&updateProgramComboboxTrigger(),typeof populateTrainingSuggestions=="function"&&populateTrainingSuggestions(),window.__periodInit||(window.__periodInit=!0,pickDefaultPeriod()),renderDynamicListView(getFilteredSchedules()),updateCalendarPeriod(currentCalendarYear,currentCalendarMonth),renderDynamicWeekView(getFilteredSchedules()),renderHome(),typeof renderRoomUsagePage=="function"&&renderRoomUsagePage(),typeof renderCalRoomLanes=="function"&&renderCalRoomLanes()}else window.isDatabaseLoading=!1,e&&(e.innerHTML=`<span class="w-2 h-2 rounded-full bg-amber-500"></span> Database Sistem: Siap (${t&&t.message||"Tidak ada jadwal aktif"})`),typeof renderProgramComboboxList=="function"&&renderProgramComboboxList(),typeof updateProgramComboboxTrigger=="function"&&updateProgramComboboxTrigger(),typeof populateTrainingSuggestions=="function"&&populateTrainingSuggestions(),renderDynamicListView(getFilteredSchedules()),renderHome()}catch(t){window.isDatabaseLoading=!1,console.warn("Koneksi background GAS:",t),e&&(e.innerHTML='<span class="w-2 h-2 rounded-full bg-red-500"></span> Gagal memuat jadwal. <button type="button" class="underline font-semibold" onclick="fetchAllDatabaseData()">Coba lagi</button>');const a=document.getElementById("dynamic-schedule-container");a&&(!LIVE_SCHEDULES||LIVE_SCHEDULES.length===0)&&(a.innerHTML=`
          <div class="p-8 bg-surface-container-low/40 rounded-2xl border border-outline-variant/30 text-center flex flex-col items-center gap-2 text-on-surface-variant">
            <span class="material-symbols-outlined text-outline/60 text-[36px]">cloud_off</span>
            <span class="font-bold text-on-surface">Data belum dapat ditampilkan</span>
            <span class="text-body-sm text-outline">Koneksi ke server lambat atau terputus. Coba ambil data lagi.</span>
            <button type="button" onclick="fetchAllDatabaseData()" class="mt-2 px-4 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary-container transition-colors inline-flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[16px]">refresh</span>
              Coba Ambil Data Lagi
            </button>
          </div>
        `),showToast("warning","Gagal Memuat Jadwal","Periksa koneksi internet, lalu tekan Coba lagi.")}finally{window.isDatabaseLoading=!1,window.__swrRefresh&&(window.__swrRefresh=!1,window.__skipAux=!0,setTimeout(fetchAllDatabaseData,0))}}function handleComboboxSearchKeydown(e){if(e.key==="Escape")toggleProgramCombobox(!1),e.stopPropagation();else if(e.key==="Enter"){e.preventDefault();const n=document.querySelector("#programComboboxList button:not([disabled])");n&&n.click()}}function toggleProgramCombobox(e){const n=document.getElementById("programComboboxPanel"),t=document.getElementById("programComboboxTrigger"),a=document.getElementById("programComboboxArrow"),r=document.getElementById("programComboboxSearch");if(!n||!t)return;if(typeof e=="boolean"?e:n.classList.contains("hidden")){if(n.classList.remove("hidden"),t.setAttribute("aria-expanded","true"),a&&(a.style.transform="rotate(180deg)"),r){r.value="";const i=document.getElementById("programComboboxClearBtn");i&&i.classList.add("hidden")}renderProgramComboboxList(""),r&&setTimeout(()=>r.focus(),60)}else n.classList.add("hidden"),t.setAttribute("aria-expanded","false"),a&&(a.style.transform="rotate(0deg)")}function filterProgramCombobox(e){const n=document.getElementById("programComboboxClearBtn");n&&n.classList.toggle("hidden",!e||e.trim().length===0),renderProgramComboboxList(e)}function clearProgramComboboxSearch(){const e=document.getElementById("programComboboxSearch");e&&(e.value="",e.focus()),filterProgramCombobox("")}function renderProgramComboboxList(e=""){const n=document.getElementById("programComboboxList"),t=document.getElementById("programComboboxCount"),a=document.getElementById("trainingProgramSelect");if(!n)return;if(window.isDatabaseLoading&&(!LIVE_SCHEDULES||LIVE_SCHEDULES.length===0)){t&&(t.textContent="Menghubungkan ke database..."),n.innerHTML=`
        <div class="p-6 text-center text-outline flex flex-col items-center gap-2 select-none">
          <span class="material-symbols-outlined text-[26px] animate-spin text-primary">progress_activity</span>
          <span class="font-medium text-body-sm text-on-surface-variant">Memuat data jadwal pelatihan...</span>
          <span class="text-[11px] text-outline">Mohon tunggu sebentar</span>
        </div>
      `;return}const r=a&&a.selectedOptions&&a.selectedOptions[0],l=window.currentSelectedScheduleId||(r?r.getAttribute("data-id"):null),i=a?a.value:"",s=(e||"").toLowerCase().trim(),c=(Array.isArray(LIVE_SCHEDULES)&&LIVE_SCHEDULES.length>0?LIVE_SCHEDULES:Array.isArray(fetchedJadwalList)?fetchedJadwalList:[]).filter(u=>!isSchedulePast(u)&&!isRegClosedOnly(u));let d=c;if(s&&(d=d.filter(u=>{const m=String(u.agenda||"").toLowerCase(),b=String(u.id_jadwal||"").toLowerCase(),h=String(u.batch||"").toLowerCase(),p=String(u.room||"").toLowerCase(),f=String(u.pic||"").toLowerCase(),g=String(u.start||"").toLowerCase();return m.includes(s)||b.includes(s)||h.includes(s)||p.includes(s)||f.includes(s)||g.includes(s)})),t&&(t.textContent=`Menampilkan ${d.length} dari ${c.length} jadwal aktif`),d.length===0){n.innerHTML=`
        <div class="col-span-full p-8 text-center text-outline flex flex-col items-center gap-2 select-none">
          <span class="material-symbols-outlined text-[32px] opacity-40">event_busy</span>
          <span class="font-medium text-body-sm text-on-surface-variant">${s?"Tidak ada pelatihan yang cocok":"Tidak ada jadwal pelatihan aktif mendatang"}</span>
          <span class="text-[11px] text-outline">${s?"Modul atau tanggal yang dicari tidak tersedia di jadwal aktif mendatang.":"Semua tanggal di jadwal resmi telah terlewat."}</span>
          <button type="button" onclick="setCustomTrainingMode(true, ${jsArg(e)}); toggleProgramCombobox(false);" class="mt-1 px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-label-xs text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer">
            <span class="material-symbols-outlined text-[16px]">edit_calendar</span>
            Ajukan Request di Luar Jadwal
          </button>
        </div>
      `;return}n.innerHTML=d.map(u=>{const m=Number(u.sisa_kuota),b=!isNaN(m)&&m<=0||/penuh/i.test(u.status),h=l?u.id_jadwal===l:u.agenda===i,p=formatSmartDateRange(u.start,u.end),f=u.start_hour?`Pukul ${u.start_hour} WIB`:"",g=u.batch?`<span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-surface-container text-on-surface-variant border border-outline-variant/40 shrink-0">${escapeHtml(u.batch)}</span>`:"",y=b?'<span class="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Kuota Penuh (Verifikasi L&amp;D)</span>':`<span class="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"><span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Sisa ${u.sisa_kuota||0} Kursi</span>`;return`
        <button type="button" onclick="selectComboboxProgram(${jsArg(u.id_jadwal||u.agenda)})" class="w-full p-3 sm:p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-2.5 group cursor-pointer ${h?"bg-primary/5 border-primary ring-2 ring-primary/25 shadow-xs":"bg-surface-container-lowest border-outline-variant/50 hover:bg-surface-container-low hover:border-primary/50 shadow-xs"}">
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="font-bold text-body-sm ${h?"text-primary":"text-on-surface"} group-hover:text-primary transition-colors leading-snug">${escapeHtml(u.agenda)}</span>
                ${g}
              </div>
              <div class="mt-1.5 flex items-center gap-x-2.5 gap-y-1 text-[11px] text-on-surface-variant flex-wrap">
                <span class="inline-flex items-center gap-1 text-on-surface font-medium"><span class="material-symbols-outlined text-[14px] text-primary">calendar_today</span> ${p}</span>
                ${f?`<span class="inline-flex items-center gap-1"><span class="material-symbols-outlined text-[14px] text-outline">schedule</span> ${f}</span>`:""}
                <span class="inline-flex items-center gap-1"><span class="material-symbols-outlined text-[14px] text-outline">meeting_room</span> ${escapeHtml(u.room||"-")}</span>
              </div>
            </div>
            <span class="material-symbols-outlined ${h?"text-primary font-bold":"text-outline/40 group-hover:text-primary"} text-[22px] shrink-0 mt-0.5 transition-colors">${h?"check_circle":"radio_button_unchecked"}</span>
          </div>
          <div class="pt-2 border-t border-outline-variant/30 flex items-center justify-between gap-2">
            ${y}
            <span class="text-[11px] font-semibold shrink-0 ${h?"text-primary":"text-outline group-hover:text-primary"} transition-colors">${h?"Terpilih ✓":"Pilih →"}</span>
          </div>
        </button>
      `}).join("")}function selectComboboxProgram(e){typeof setCustomTrainingMode=="function"&&isCustomTrainingModeActive&&setCustomTrainingMode(!1);const n=Array.isArray(LIVE_SCHEDULES)&&LIVE_SCHEDULES.length>0?LIVE_SCHEDULES:fetchedJadwalList,t=(n||[]).find(i=>i.id_jadwal===e)||(n||[]).find(i=>i.agenda===e);if(!t)return;window.currentSelectedScheduleId=t.id_jadwal;const a=document.getElementById("trainingProgramSelect");if(a){let i=Array.from(a.options).find(o=>o.getAttribute("data-id")===t.id_jadwal||o.value===t.id_jadwal);i||(i=Array.from(a.options).find(o=>o.getAttribute("data-agenda")===t.agenda&&o.getAttribute("data-date")===t.start)),i||(i=Array.from(a.options).find(o=>o.getAttribute("data-agenda")===t.agenda)),i||(i=document.createElement("option"),i.value=t.id_jadwal,i.setAttribute("data-id",t.id_jadwal),i.setAttribute("data-agenda",t.agenda),i.setAttribute("data-date",t.start||""),i.textContent=t.agenda,a.appendChild(i));const s=Array.from(a.options).indexOf(i);s!==-1&&(a.selectedIndex=s),updateTrainingInfo()}toggleProgramCombobox(!1),updateProgramComboboxTrigger();const r=Number(t.sisa_kuota);(!isNaN(r)&&r<=0||/penuh/i.test(t.status))&&showToast("info","Program Terpilih (Kuota Penuh)",`Modul "${t.agenda}" berstatus kuota penuh. Pendaftaran Anda tetap diterima dan akan diverifikasi oleh Tim L&D.`)}function updateProgramComboboxTrigger(){const e=document.getElementById("trainingProgramSelect"),n=document.getElementById("programComboboxLabel"),t=document.getElementById("programComboboxSubtext"),a=document.getElementById("selected-program-quota-badge");if(!e||!n)return;const r=e.value;if(!r){n.textContent="Pilih Program Pelatihan...",n.className="truncate font-normal text-outline",t&&(t.textContent="",t.classList.add("hidden")),a&&(a.textContent="",a.classList.add("hidden"));return}const l=e.selectedOptions&&e.selectedOptions[0],i=window.currentSelectedScheduleId||(l?l.getAttribute("data-id"):null),s=Array.isArray(LIVE_SCHEDULES)&&LIVE_SCHEDULES.length>0?LIVE_SCHEDULES:fetchedJadwalList,o=(i?(s||[]).find(c=>c.id_jadwal===i):null)||(s||[]).find(c=>c.agenda===r);if(o){if(n.textContent=o.agenda,n.className="truncate font-semibold text-on-surface",t){const c=formatSmartDateRange(o.start,o.end),d=o.start_hour?` • ${o.start_hour} WIB`:"",u=o.room?` • ${o.room}`:"",m=o.batch?`[${o.batch}] `:"";t.textContent=`${m}${c}${d}${u}`,t.classList.remove("hidden")}if(a){const c=Number(o.sisa_kuota);!isNaN(c)&&c<=0||/penuh/i.test(o.status)?(a.className="text-label-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1",a.innerHTML='<span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Kuota Penuh (Verifikasi L&amp;D)'):(a.className="text-label-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1",a.innerHTML=`<span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Sisa ${o.sisa_kuota||0} Kursi`),a.classList.remove("hidden")}}else n.textContent=r,n.className="truncate font-semibold text-on-surface",t&&(t.textContent="",t.classList.add("hidden")),a&&(a.textContent="",a.classList.add("hidden"))}function removeExampleRow(){const e=document.getElementById("example-participant-row");e&&(e.remove(),updateRowIndices(),updateQuotaMetrics())}function handleExampleRowFocus(){removeExampleRow(),addParticipantRow();const e=document.querySelector("#participantTableBody tr .p-nip");e&&e.focus()}function addParticipantRow(e=null){removeExampleRow(),rowCount++;const n=document.getElementById("participantTableBody"),t=document.createElement("tr");t.className="hover:bg-surface-container-low/60 transition-colors group animate-in fade-in duration-100",t.id=`row-${rowCount}`,t.innerHTML=`
      <td class="py-1 px-2 text-center font-medium text-outline text-[12px] bg-surface-container-low/60 border-r border-outline-variant/60 select-none row-index"></td>
      <td class="p-0 border-r border-outline-variant/40">
        <input type="text" required class="w-full h-8 px-2.5 bg-transparent border-0 text-on-surface text-body-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary focus:bg-surface-container-lowest font-mono text-[13px] p-nip" placeholder="EMP-XXXXX" value="${e?escapeHtml(e.nip):""}">
      </td>
      <td class="p-0 border-r border-outline-variant/40">
        <input type="text" required class="w-full h-8 px-2.5 bg-transparent border-0 text-on-surface text-body-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary focus:bg-surface-container-lowest p-nama" placeholder="Nama Lengkap" value="${e?escapeHtml(e.nama):""}">
      </td>
      <td class="p-0 border-r border-outline-variant/40">
        <input type="tel" required class="w-full h-8 px-2.5 bg-transparent border-0 text-on-surface text-body-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary focus:bg-surface-container-lowest p-hp" placeholder="0812-xxxx-xxxx" value="${e?escapeHtml(e.hp):""}">
      </td>
      <td class="p-0 border-r border-outline-variant/40">
        <input type="text" required class="w-full h-8 px-2.5 bg-transparent border-0 text-on-surface text-body-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary focus:bg-surface-container-lowest p-jabatan" placeholder="Jabatan" value="${e?escapeHtml(e.jabatan):""}">
      </td>
      <td class="p-0 border-r border-outline-variant/40">
        <input type="text" required class="w-full h-8 px-2.5 bg-transparent border-0 text-on-surface text-body-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary focus:bg-surface-container-lowest p-dept" placeholder="Departemen" value="${e?escapeHtml(e.dept):""}">
      </td>
      <td class="p-0 text-center">
        <button type="button" onclick="deleteParticipantRow(this)" class="w-7 h-7 rounded text-outline hover:text-error hover:bg-error-container/30 inline-flex items-center justify-center transition-colors opacity-60 group-hover:opacity-100" title="Hapus Baris">
          <span class="material-symbols-outlined text-[16px]">close</span>
        </button>
      </td>
    `,n.appendChild(t),updateRowIndices(),updateQuotaMetrics()}function addMultipleRows(e=5){removeExampleRow();for(let n=0;n<e;n++)addParticipantRow()}function deleteParticipantRow(e){const n=e.closest("tr");n&&(n.remove(),updateRowIndices(),updateQuotaMetrics())}function clearAllRows(){const e=document.getElementById("participantTableBody");e&&(e.innerHTML="",e.innerHTML=`
      <tr class="opacity-40 italic text-outline bg-surface-container-low/20 border-dashed border-outline-variant/50 transition-all select-none group cursor-pointer" id="example-participant-row" data-is-example="true" onclick="handleExampleRowFocus()" title="Klik untuk mulai mengisi data Anda">
        <td class="py-1 px-2 text-center font-medium text-outline text-[12px] bg-surface-container-low/40 border-r border-outline-variant/60 select-none row-index">1</td>
        <td class="p-0 border-r border-outline-variant/40"><input class="w-full h-8 px-2.5 bg-transparent border-0 text-outline text-body-sm font-mono text-[13px] p-nip italic cursor-pointer" readonly type="text" value="contoh: EMP-1001"></td>
        <td class="p-0 border-r border-outline-variant/40"><input class="w-full h-8 px-2.5 bg-transparent border-0 text-outline text-body-sm p-nama italic cursor-pointer" readonly type="text" value="contoh: Ahmad Pratama"></td>
        <td class="p-0 border-r border-outline-variant/40"><input class="w-full h-8 px-2.5 bg-transparent border-0 text-outline text-body-sm p-hp italic cursor-pointer" readonly type="tel" value="contoh: 0812-3456-7890"></td>
        <td class="p-0 border-r border-outline-variant/40"><input class="w-full h-8 px-2.5 bg-transparent border-0 text-outline text-body-sm p-jabatan italic cursor-pointer" readonly type="text" value="contoh: Mining Engineer"></td>
        <td class="p-0 border-r border-outline-variant/40"><input class="w-full h-8 px-2.5 bg-transparent border-0 text-outline text-body-sm p-dept italic cursor-pointer" readonly type="text" value="contoh: Mining Operations"></td>
        <td class="p-0 text-center"><span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-surface-container-high text-outline uppercase">Contoh</span></td>
      </tr>
    `,updateRowIndices(),updateQuotaMetrics(),showToast("info","Tabel Dikosongkan","Seluruh baris peserta telah dibersihkan."))}function updateRowIndices(){document.querySelectorAll("#participantTableBody tr").forEach((n,t)=>{const a=n.querySelector(".row-index");a&&(a.textContent=t+1)})}function updateQuotaMetrics(){const n=document.querySelectorAll("#participantTableBody tr:not([data-is-example])").length,t=document.getElementById("participantCountBadge");t&&(n===0?(t.textContent="0 Peserta (Data Belum Diisi)",t.className="font-label-sm text-[12px] px-2.5 py-1 rounded-full font-bold bg-surface-container-high text-outline"):(t.textContent=`${n} Peserta`,t.className="font-label-sm text-[12px] px-2.5 py-1 rounded-full font-bold bg-primary-fixed text-primary"));const a=Math.min(100,Math.round(n/maxQuota*100)),r=document.getElementById("quotaProgressBar");r&&(r.style.width=`${a}%`);const l=document.getElementById("quotaProgressText");l&&(l.textContent=`${n}/${maxQuota} Kursi`)}async function toggleExcelQuickPasteArea(e){const n=document.getElementById("excelQuickPasteArea"),t=document.getElementById("excelPasteTextarea");if(!n)return;if(typeof e=="boolean"?e:n.classList.contains("hidden")){if(n.classList.remove("hidden"),t){if(!t.value.trim()&&navigator.clipboard&&navigator.clipboard.readText)try{const r=await navigator.clipboard.readText();r&&(r.includes("	")||r.includes(`
`))&&(t.value=r,showToast("info","Data Terdeteksi dari Clipboard","Data dari Excel telah otomatis ditempelkan ke kotak teks. Silakan periksa opsi dan klik Terapkan ke Tabel."))}catch{}t.focus()}}else n.classList.add("hidden")}function exportTableToPasteArea(){const e=document.querySelectorAll("#participantTableBody tr:not([data-is-example])");if(e.length===0){showToast("warning","Tabel Masih Kosong","Belum ada data peserta di tabel untuk dimuat.");return}const n=[];e.forEach(a=>{const r=a.querySelector(".p-nip")?.value.trim()||"",l=a.querySelector(".p-nama")?.value.trim()||"",i=a.querySelector(".p-hp")?.value.trim()||"",s=a.querySelector(".p-jabatan")?.value.trim()||"",o=a.querySelector(".p-dept")?.value.trim()||"";(r||l)&&n.push([r,l,i,s,o].join("	"))});const t=document.getElementById("excelPasteTextarea");t&&(t.value=n.join(`
`),t.focus(),showToast("success","Data Tabel Dimuat",`${n.length} baris peserta berhasil dimuat ke kotak teks. Anda dapat mengedit lalu menerapkan kembali perubahan ke tabel.`))}async function pasteFromClipboard(){try{const e=await navigator.clipboard.readText();if(!e||e.trim()===""){showToast("warning","Clipboard Kosong","Silakan salin (Copy) tabel peserta dari Excel terlebih dahulu."),toggleExcelQuickPasteArea(!0);return}processTsvData(e,"replace")}catch{toggleExcelQuickPasteArea(!0),showToast("info","Tempelkan Data","Silakan tekan Ctrl+V pada kotak teks yang terbuka lalu klik Terapkan ke Tabel.")}}function applyExcelPaste(e){const n=document.getElementById("excelPasteTextarea"),t=(n?n.value:"").trim();if(!t){showToast("warning","Area Paste Kosong","Tempelkan (Ctrl+V) data tabel dari Excel terlebih dahulu ke kotak teks."),n&&n.focus();return}let a=e;if(!a){const l=document.querySelector('input[name="pasteApplyMode"]:checked');a=l?l.value:"replace"}processTsvData(t,a),n&&(n.value="");const r=document.getElementById("excelQuickPasteArea");r&&r.classList.add("hidden")}function processTsvData(e,n="replace"){if(!e||!e.trim())return;removeExampleRow();const t=e.trim().split(/\r\n|\n|\r/),a=[];for(let i=0;i<t.length;i++){const s=t[i].trim();if(!s)continue;let o=s.split("	");if(o.length<2&&(o=s.split(";")),o.length<2&&(o=s.split(",")),o=o.map(c=>(c||"").trim().replace(/^["']|["']$/g,"").trim()),i===0){const c=s.toLowerCase();if(c.includes("nip")||c.includes("nik")||c.includes("id_karyawan")||c.includes("nama_karyawan")||c.includes("nama")||c.includes("jabatan")||c.includes("departemen"))continue}o.length>=3&&/^\d{1,3}$/.test(o[0])&&(o[1].length>2||isNaN(o[1]))&&o.shift(),(o.length>=2||o[0]&&o[0].length>=3)&&a.push({nip:o[0]||"",nama:o[1]||"",hp:o[2]||"",jabatan:o[3]||"",dept:o[4]||""})}if(a.length===0){showToast("warning","Format Tidak Sesuai","Pastikan data memuat minimal kolom NIP dan Nama Karyawan.");return}let r=0,l=0;if(n==="replace"){const i=document.getElementById("participantTableBody");i&&(i.innerHTML=""),rowCount=0,a.forEach(s=>{addParticipantRow(s),r++}),showToast("success","Tabel Berhasil Diperbarui",`${r} data peserta dari Excel telah diterapkan ke tabel.`)}else if(n==="update"){const i=Array.from(document.querySelectorAll("#participantTableBody tr:not([data-is-example])"));a.forEach(s=>{const o=(s.nip||"").trim().toLowerCase(),c=o?i.find(d=>d.querySelector(".p-nip")?.value.trim().toLowerCase()===o):null;if(c){if(s.nama){const d=c.querySelector(".p-nama");d&&(d.value=s.nama)}if(s.hp){const d=c.querySelector(".p-hp");d&&(d.value=s.hp)}if(s.jabatan){const d=c.querySelector(".p-jabatan");d&&(d.value=s.jabatan)}if(s.dept){const d=c.querySelector(".p-dept");d&&(d.value=s.dept)}c.classList.add("bg-emerald-500/10","transition-all"),setTimeout(()=>{c.classList.remove("bg-emerald-500/10")},1200),l++}else addParticipantRow(s),r++}),updateRowIndices(),updateQuotaMetrics(),l>0&&r>0?showToast("success","Tabel Diperbarui",`${l} peserta diperbarui & ${r} peserta baru ditambahkan.`):l>0?showToast("success","Data Diperbarui",`${l} data peserta yang ada di tabel berhasil diperbarui dari Excel.`):showToast("success","Peserta Ditambahkan",`${r} peserta baru berhasil ditambahkan ke tabel.`)}else a.forEach(i=>{addParticipantRow(i),r++}),showToast("success","Peserta Ditambahkan",`${r} peserta baru berhasil ditambahkan ke tabel.`)}function setupTablePasteListener(){const e=document.getElementById("participantTable");e&&!e.__pasteListenerAttached&&(e.__pasteListenerAttached=!0,e.addEventListener("paste",n=>{const t=(n.clipboardData||window.clipboardData)?.getData("text");if(t&&(t.includes("	")||t.includes(`
`)))if(n.preventDefault(),document.querySelectorAll("#participantTableBody tr:not([data-is-example])").length===0)processTsvData(t,"replace"),showToast("success","Data Excel Diterapkan","Data peserta dari clipboard berhasil dimasukkan langsung ke tabel.");else{const r=document.getElementById("excelPasteTextarea");r&&(r.value=t),toggleExcelQuickPasteArea(!0),showToast("info","Pembaruan Tabel",'Data tabel terdeteksi dari Excel. Tentukan opsi penerapan lalu klik "Terapkan ke Tabel".')}}))}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",setupTablePasteListener):setupTablePasteListener();function handleCsvUpload(e){showToast("info","Gunakan Paste dari Excel",'Silakan gunakan tombol "Paste dari Excel" untuk menempelkan data tabel secara langsung.'),e&&e.target&&(e.target.value="")}function importCsvFile(e){handleCsvUpload(e)}window.toggleExcelQuickPasteArea=toggleExcelQuickPasteArea,window.exportTableToPasteArea=exportTableToPasteArea,window.applyExcelPaste=applyExcelPaste,window.handleCsvUpload=handleCsvUpload,window.importCsvFile=handleCsvUpload,window.pasteFromClipboard=pasteFromClipboard,window.processTsvData=processTsvData;function downloadTemplateExcel(){const e=`ID_Karyawan,Nama_Karyawan,No_HP,Jabatan,Departemen
EMP-1001,Ahmad Dhani,081234567890,Senior Engineer,Mining Operations
EMP-1002,Bunga Citra Lestari,081987654321,Process Specialist,Metallurgy
EMP-1003,Cakra Khan,081288889999,Safety Officer,HSE K3
`,n=new Blob([e],{type:"text/csv;charset=utf-8;"}),t=URL.createObjectURL(n),a=document.createElement("a");a.href=t,a.download="Template_Peserta_Pelatihan_MGR.csv",document.body.appendChild(a),a.click(),document.body.removeChild(a),showToast("info","Unduh Format","File template Excel/CSV berhasil diunduh.")}function handleCompanyChange(e){const n=document.getElementById("customCompanyWrapper"),t=document.getElementById("customCompanyInput");e==="Lainnya"?(n&&n.classList.remove("hidden"),t&&(t.required=!0,t.focus())):(n&&n.classList.add("hidden"),t&&(t.required=!1,t.value=""))}function getSelectedCompany(){const e=document.getElementById("companySelect");if(!e)return"";const n=e.value;if(n==="Lainnya"){const t=document.getElementById("customCompanyInput");return t?t.value.trim():""}return n}function generateRegNumber(){const e=new Date,n=e.getFullYear(),t=String(e.getMonth()+1).padStart(2,"0"),a=String(e.getDate()).padStart(2,"0"),r=Math.floor(1e3+Math.random()*9e3),l=`REG-${n}${t}${a}-${r}`,i=document.getElementById("regRefNo"),s=document.getElementById("regRefNoDisplay"),o=document.getElementById("modalRegNo");return i&&(i.value=l),s&&(s.textContent=l),o&&(o.textContent=l),l}let isCustomTrainingModeActive=!1;function setCustomTrainingMode(e,n=""){isCustomTrainingModeActive=!!e,isCustomTrainingModeActive&&(window.currentSelectedScheduleId=null);const t=document.getElementById("tabModeJadwalResmi"),a=document.getElementById("tabModeRequestKhusus"),r=document.getElementById("training-program-combobox-container"),l=document.getElementById("custom-training-name-container"),i=document.getElementById("custom-schedule-notice"),s=document.getElementById("customTrainingNameInput"),o=document.getElementById("trainingProgramSelect"),c=document.getElementById("selected-program-quota-badge"),d=document.getElementById("startDateInput"),u=document.getElementById("endDateInput"),m=document.getElementById("trainingVenueInput"),b=document.getElementById("trainingHourInput"),h=document.getElementById("startDateHelper"),p=document.getElementById("endDateHelper"),f=document.getElementById("venueHelper"),g=document.getElementById("hourHelper");isCustomTrainingModeActive?(t&&(t.className="px-3 py-1.5 rounded-md font-medium text-on-surface-variant hover:text-on-surface transition-all flex items-center gap-1.5 cursor-pointer"),a&&(a.className="px-3 py-1.5 rounded-md font-semibold transition-all bg-surface-container-lowest text-amber-800 shadow-xs flex items-center gap-1.5 cursor-pointer"),r&&r.classList.add("hidden"),l&&l.classList.remove("hidden"),i&&i.classList.remove("hidden"),c&&c.classList.add("hidden"),o&&(o.required=!1),s&&(s.required=!0,n&&typeof n=="string"&&(s.value=n),setTimeout(()=>s.focus(),60)),[d,u,m,b].forEach(y=>{y&&(y.readOnly=!1,y.removeAttribute("readonly"),y.classList.remove("bg-surface-container-low","cursor-not-allowed"),y.classList.add("bg-surface-container-lowest","cursor-pointer"))}),m&&(m.classList.remove("cursor-pointer"),m.placeholder="Default: Gold Room (akan ditentukan oleh Admin L&D)",m.value="Gold Room"),b&&(b.classList.remove("cursor-pointer"),b.placeholder="Default: 08:00 WIB (akan ditentukan oleh Admin L&D)",b.value="08:00 WIB"),h&&(h.textContent="(Bebas Date Pick)",h.className="text-[11px] text-primary font-medium",h.classList.remove("hidden")),p&&(p.textContent="(Bebas Date Pick)",p.className="text-[11px] text-primary font-medium",p.classList.remove("hidden")),f&&(f.textContent="(Default: Gold Room • Ditentukan Admin)",f.className="text-[11px] text-primary font-medium",f.classList.remove("hidden")),g&&(g.textContent="(Default: 08:00 WIB • Ditentukan Admin)",g.className="text-[11px] text-primary font-medium",g.classList.remove("hidden")),calculateDuration(),typeof populateTrainingSuggestions=="function"&&populateTrainingSuggestions(n||"")):(t&&(t.className="px-3 py-1.5 rounded-md font-semibold transition-all bg-surface-container-lowest text-primary shadow-xs flex items-center gap-1.5 cursor-pointer"),a&&(a.className="px-3 py-1.5 rounded-md font-medium text-on-surface-variant hover:text-on-surface transition-all flex items-center gap-1.5 cursor-pointer"),r&&r.classList.remove("hidden"),l&&l.classList.add("hidden"),i&&i.classList.add("hidden"),o&&(o.required=!0),s&&(s.required=!1),[d,u,m,b].forEach(y=>{y&&(y.readOnly=!0,y.setAttribute("readonly","true"),y.classList.remove("bg-surface-container-lowest","cursor-pointer"),y.classList.add("bg-surface-container-low","cursor-not-allowed"))}),m&&(m.placeholder="Pilih modul pelatihan untuk memuat ruangan..."),b&&(b.placeholder="Pilih modul untuk memuat jam..."),h&&h.classList.add("hidden"),p&&p.classList.add("hidden"),f&&f.classList.add("hidden"),g&&g.classList.add("hidden"),updateTrainingInfo())}window.setCustomTrainingMode=setCustomTrainingMode;function populateTrainingSuggestions(e=""){const n=document.getElementById("suggestedTrainingsList"),t=document.getElementById("suggestedTrainingChips");if(!n&&!t)return;const a=Array.isArray(LIVE_SCHEDULES)&&LIVE_SCHEDULES.length>0?LIVE_SCHEDULES:Array.isArray(fetchedJadwalList)?fetchedJadwalList:[],r=new Set,l=[];if(a.forEach(i=>{if(!i||!i.agenda)return;let s=String(i.agenda).trim();s=s.replace(/\s*\[Batch\s*\d+\]/gi,"").replace(/\s*-\s*Batch\s*\d+/gi,"").trim(),s&&!r.has(s.toLowerCase())&&(r.add(s.toLowerCase()),l.push(s))}),l.sort((i,s)=>i.localeCompare(s)),n&&(n.innerHTML=l.map(i=>`<option value="${escapeHtml(i)}"></option>`).join("")),t){const i=(e||"").toLowerCase().trim(),s=i?l.filter(o=>o.toLowerCase().includes(i)):l;if(s.length===0){t.innerHTML='<span class="text-[11px] text-outline italic py-0.5">Tidak ada jadwal dengan kata kunci tersebut. Anda tetap dapat menulis nama modul baru secara manual.</span>';return}t.innerHTML=s.map(o=>`
        <button type="button" onclick="selectSuggestedTrainingName('${escapeHtml(o)}')" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface-container hover:bg-primary/10 hover:text-primary text-on-surface text-xs font-medium border border-outline-variant/40 transition-colors cursor-pointer group">
          <span class="material-symbols-outlined text-[13px] text-primary group-hover:scale-125 transition-transform">add_circle</span>
          <span>${escapeHtml(o)}</span>
        </button>
      `).join("")}}window.populateTrainingSuggestions=populateTrainingSuggestions;function filterSuggestedTrainingChips(e){populateTrainingSuggestions(e)}window.filterSuggestedTrainingChips=filterSuggestedTrainingChips;function selectSuggestedTrainingName(e){const n=document.getElementById("customTrainingNameInput");n&&(n.value=e,n.focus()),showToast("info","Nama Pelatihan Terpilih",`Nama modul diselaraskan: "${e}".`)}window.selectSuggestedTrainingName=selectSuggestedTrainingName;function updateTrainingInfo(){if(isCustomTrainingModeActive)return;const e=document.getElementById("trainingProgramSelect"),n=document.getElementById("trainingVenueInput"),t=document.getElementById("trainingHourInput"),a=document.getElementById("startDateInput"),r=document.getElementById("endDateInput"),l=document.getElementById("courseCapacityInput");if(!e)return;const i=e.value;if(!i){n&&(n.value=""),t&&(t.value=""),a&&(a.value=""),r&&(r.value=""),l&&(l.value="");const d=document.getElementById("durationSummaryBadge");d&&(d.textContent="-"),typeof updateProgramComboboxTrigger=="function"&&updateProgramComboboxTrigger();return}const s=e.selectedOptions&&e.selectedOptions[0],o=(s?s.getAttribute("data-id"):null)||window.currentSelectedScheduleId||i;o&&(window.currentSelectedScheduleId=o);const c=(o?(fetchedJadwalList||[]).find(d=>d.id_jadwal===o):null)||(fetchedJadwalList||[]).find(d=>d.id_jadwal===i)||(fetchedJadwalList||[]).find(d=>d.agenda===i);if(c){c.room&&n&&(n.value=c.room),t&&(t.value=c.start_hour?`${c.start_hour} WIB`:"08:00 WIB (Tentatif)"),c.kuota&&(maxQuota=isNaN(Number(c.sisa_kuota))?Number(c.kuota)||30:Number(c.sisa_kuota),l&&(l.value=c.kuota));const d=parseDateString(c.start);d&&a&&(a.value=`${d.year}-${String(d.month).padStart(2,"0")}-${String(d.day).padStart(2,"0")}`);const u=parseDateString(c.end);if(u&&r){let m=u.year,b=u.month,h=u.day;if(d&&new Date(u.year,u.month-1,u.day)<new Date(d.year,d.month-1,d.day)){const p=new Date(new Date(d.year,d.month-1,d.day).getTime()+3456e5);m=p.getFullYear(),b=p.getMonth()+1,h=p.getDate()}r.value=`${m}-${String(b).padStart(2,"0")}-${String(h).padStart(2,"0")}`}calculateDuration(),updateQuotaMetrics()}typeof updateProgramComboboxTrigger=="function"&&updateProgramComboboxTrigger()}function calculateDuration(){const e=document.getElementById("startDateInput"),n=document.getElementById("endDateInput"),t=document.getElementById("durationSummaryBadge"),a=e?e.value:"";let r=n?n.value:"";if(isCustomTrainingModeActive&&e&&a&&n&&(n.min=a,(!r||r<a)&&(n.value=a,r=a)),a&&r){const l=new Date(a),s=new Date(r)-l;let o=Math.ceil(s/(1e3*60*60*24))+1;if(o<=0&&(o=Math.abs(Math.ceil(s/(1e3*60*60*24)))+1),o>0){const c=o*8;t&&(t.textContent=`${o} Hari (${c} Jam Pelatihan)`);return}}t&&(t.textContent=isCustomTrainingModeActive?"Tentukan Tanggal":"5 Hari (40 Jam Pelatihan)")}let uploadedFileObj=null;function handleFileUpload(e){const n=e.target,t=n.files&&n.files[0],a=document.getElementById("uploadedDocName"),r=document.getElementById("uploadedDocHint"),l=document.getElementById("btnUploadText"),i=document.getElementById("btnRemoveFile"),s=document.getElementById("uploadedDocIcon");if(!t)return;if(!(t.type==="application/pdf"||/\.pdf$/i.test(t.name))){showToast("error","Format Berkas Ditolak","Hanya berkas format PDF (.pdf) yang diperbolehkan."),removeUploadedFile();return}const c=2*1024*1024;if(t.size>c){const u=(t.size/1048576).toFixed(2);showToast("error","Ukuran Berkas Terlalu Besar",`Maksimal ukuran berkas PDF adalah 2 MB. Berkas Anda berukuran ${u} MB.`),removeUploadedFile();return}const d=new FileReader;d.onload=function(u){const m=(u.target.result||"").split(",")[1]||"";uploadedFileObj={name:t.name,type:t.type||"application/pdf",size:t.size,base64:m};const b=(t.size/1024).toFixed(0);a&&(a.textContent=`${t.name} (${b} KB)`,a.classList.remove("text-outline","italic"),a.classList.add("text-primary","font-medium")),r&&(r.textContent="Berkas PDF valid & siap diunggah ke Google Drive",r.classList.add("text-primary")),l&&(l.textContent="Ganti PDF"),i&&i.classList.remove("hidden"),s&&s.classList.add("text-primary"),showToast("success","Berkas PDF Terpilih",`${t.name} (${b} KB) siap diunggah ke Google Drive.`)},d.onerror=function(){showToast("error","Gagal Membaca Berkas","Terjadi kesalahan saat memproses berkas PDF."),removeUploadedFile()},d.readAsDataURL(t)}function removeUploadedFile(){uploadedFileObj=null;const e=document.getElementById("fileUpload");e&&(e.value="");const n=document.getElementById("uploadedDocName");n&&(n.textContent="Belum ada berkas dipilih",n.className="font-body-sm text-body-sm text-outline italic truncate");const t=document.getElementById("uploadedDocHint");t&&(t.textContent="Opsional • Format PDF (Maksimal 2 MB)",t.className="font-label-sm text-label-sm text-on-surface-variant");const a=document.getElementById("btnUploadText");a&&(a.textContent="Pilih PDF");const r=document.getElementById("btnRemoveFile");r&&r.classList.add("hidden")}function resetForm(){const e=document.getElementById("trainingRegistrationForm");e&&e.reset(),setCustomTrainingMode(!1);const n=document.getElementById("customTrainingNameInput");n&&(n.value="");const t=document.getElementById("companySelect");t&&(t.selectedIndex=0);const a=document.getElementById("customCompanyWrapper");a&&a.classList.add("hidden");const r=document.getElementById("customCompanyInput");r&&(r.value="",r.required=!1);const l=document.getElementById("trainingProgramSelect");l&&(l.selectedIndex=0,window.currentSelectedScheduleId=l.options[0]?l.options[0].getAttribute("data-id"):null);const i=document.getElementById("startDateInput");i&&(i.value="");const s=document.getElementById("endDateInput");s&&(s.value="");const o=document.getElementById("trainingVenueInput");o&&(o.value="");const c=document.getElementById("trainingHourInput");c&&(c.value="");const d=document.getElementById("courseCapacityInput");d&&(d.value="");const u=document.getElementById("picNameInput");u&&(u.value="");const m=document.getElementById("picPhoneInput");m&&(m.value="");const b=document.getElementById("notesInput");b&&(b.value=""),removeUploadedFile();const h=document.getElementById("durationSummaryBadge");h&&(h.textContent="-"),generateRegNumber(),clearAllRows(),showToast("info","Formulir Direset","Seluruh isian formulir telah dikosongkan.")}function submitForm(){let e=document.getElementById("regRefNo").value;e||(e="REG-"+new Date().getFullYear()+"-"+Math.floor(1e3+Math.random()*9e3),document.getElementById("regRefNo").value=e);const n=isCustomTrainingModeActive;let t="";if(n){const x=document.getElementById("customTrainingNameInput");t=x?x.value.trim():""}else{const x=document.getElementById("trainingProgramSelect"),k=x?x.selectedOptions[0]:null,w=(k?k.getAttribute("data-id"):null)||window.currentSelectedScheduleId||(x?x.value:null),_=w?(fetchedJadwalList||[]).find(I=>I.id_jadwal===w):null;t=_?_.agenda:k?k.getAttribute("data-agenda")||k.textContent:x?x.value:""}const a=document.getElementById("startDateInput").value,r=document.getElementById("endDateInput").value,l=document.getElementById("picNameInput").value.trim(),i=(document.getElementById("picPhoneInput")?.value||"").trim(),s=getSelectedCompany();if(!s){showToast("warning","Asal Perusahaan Wajib Dipilih","Pilih entitas asal perusahaan atau ketik manual jika tidak ada.");const x=document.getElementById("companySelect");x&&(x.focus(),x.scrollIntoView({behavior:"smooth",block:"center"}));return}if(!t){if(n){showToast("warning","Nama Pelatihan Belum Diisi","Silakan tuliskan nama program pelatihan yang diminta.");const x=document.getElementById("customTrainingNameInput");x&&(x.focus(),x.scrollIntoView({behavior:"smooth",block:"center"}))}else showToast("warning","Modul Belum Dipilih","Silakan pilih program pelatihan yang tersedia.");return}if(!a||!r){showToast("warning","Tanggal Belum Lengkap","Tentukan tanggal mulai dan selesai pelatihan.");return}if(new Date(r)<new Date(a)){showToast("warning","Rentang Tanggal Tidak Sesuai","Tanggal selesai pelatihan tidak boleh mendahului tanggal mulai.");return}if(!l){showToast("warning","PIC Wajib Diisi","Masukkan nama PIC penanggung jawab pendaftaran Anda.");const x=document.getElementById("picNameInput");x&&(x.focus(),x.scrollIntoView({behavior:"smooth",block:"center"}));return}if(!i){showToast("warning","Kontak PIC Wajib Diisi","Masukkan nomor HP / WhatsApp PIC pendaftaran yang dapat dihubungi.");const x=document.getElementById("picPhoneInput");x&&(x.focus(),x.scrollIntoView({behavior:"smooth",block:"center"}));return}const o=document.querySelectorAll("#participantTableBody tr:not([data-is-example])"),c=[];if(o.forEach(x=>{const k=x.querySelector(".p-nip")?.value.trim()||"",w=x.querySelector(".p-nama")?.value.trim()||"",_=x.querySelector(".p-hp")?.value.trim()||"",I=x.querySelector(".p-jabatan")?.value.trim()||"",S=x.querySelector(".p-dept")?.value.trim()||"";(k||w)&&c.push({id_karyawan:k,nama_karyawan:w,no_hp:_,jabatan:I,departement:S})}),c.length===0){showToast("warning","Peserta Masih Kosong","Isi minimal 1 data NIP & Nama Karyawan riil pada tabel.");return}const d=document.getElementById("trainingProgramSelect"),u=d?d.selectedOptions[0]:null,m=u?u.getAttribute("data-id"):null,b=n?null:(m?(fetchedJadwalList||[]).find(x=>x.id_jadwal===m):null)||(fetchedJadwalList||[]).find(x=>x.agenda===t),h=validatePeserta(c);if(h){showToast("warning","Data Peserta Belum Valid",h);return}document.getElementById("modalRegNo").textContent=e;const p=document.getElementById("modalCompany");p&&(p.textContent=s);const f=document.getElementById("modalPicInfo");f&&(f.textContent=`${l} (${i})`),document.getElementById("modalEmpName").textContent=`${c.length} Peserta (${c[0].nama_karyawan}${c.length>1?" dkk.":""})`,document.getElementById("modalCourse").textContent=t+(n?" (Request di Luar Jadwal)":"");const g=document.getElementById("modalScheduleDates");if(g){const x=formatSmartDateRange(a,r);g.textContent=x||`${a} s/d ${r}`}const y=document.getElementById("modalDocFile");y&&(uploadedFileObj?(y.textContent=`${uploadedFileObj.name} (${(uploadedFileObj.size/1024).toFixed(0)} KB)`,y.className="font-semibold text-right truncate text-xs text-primary font-mono"):(y.textContent="Tidak dilampirkan",y.className="font-normal text-right truncate text-xs text-on-surface-variant italic"));const v=document.getElementById("confirmationModal");v&&v.classList.remove("hidden")}const DRAFT_KEY="lnd_pendaftaran_draft_v1";function jsArg(e){return escapeHtml(JSON.stringify(String(e??"")))}function collectParticipants(){return Array.from(document.querySelectorAll("#participantTableBody tr:not([data-is-example])")).map(e=>({nip:e.querySelector(".p-nip")?.value||"",nama:e.querySelector(".p-nama")?.value||"",hp:e.querySelector(".p-hp")?.value||"",jabatan:e.querySelector(".p-jabatan")?.value||"",dept:e.querySelector(".p-dept")?.value||""}))}function validatePeserta(e){const n=new Set;for(let t=0;t<e.length;t++){const a=e[t],r=t+1;if(!a.id_karyawan)return`Baris ${r}: ID/NIK karyawan wajib diisi.`;if(!a.nama_karyawan)return`Baris ${r}: nama karyawan wajib diisi.`;const l=(a.no_hp||"").replace(/[\s\-().]/g,"");if(!/^(\+?62|0)8\d{7,12}$/.test(l))return`Baris ${r}: nomor HP tidak valid (contoh 081234567890).`;const i=a.id_karyawan.replace(/\s+/g,"").toLowerCase();if(n.has(i))return`Baris ${r}: ID ${a.id_karyawan} terdaftar dua kali.`;n.add(i)}return""}function saveDraft(){try{const e=n=>document.getElementById(n)?.value||"";localStorage.setItem(DRAFT_KEY,JSON.stringify({company:e("companySelect"),customCompany:e("customCompanyInput"),isCustomTraining:isCustomTrainingModeActive,customTrainingName:e("customTrainingNameInput"),startDate:e("startDateInput"),endDate:e("endDateInput"),venue:e("trainingVenueInput"),hour:e("trainingHourInput"),pic:e("picNameInput"),picPhone:e("picPhoneInput"),notes:e("notesInput"),peserta:collectParticipants(),at:Date.now()})),showToast("success","Draf Disimpan","Tersimpan di browser ini (berlaku 7 hari).")}catch{showToast("warning","Draf Gagal Disimpan","Penyimpanan browser tidak tersedia atau penuh.")}}function loadDraft(){try{const e=localStorage.getItem(DRAFT_KEY);if(!e)return;const n=JSON.parse(e);if(!n||Date.now()-n.at>7*864e5){localStorage.removeItem(DRAFT_KEY);return}const t=(a,r)=>{const l=document.getElementById(a);l&&r&&(l.value=r)};t("companySelect",n.company),handleCompanyChange(n.company||""),t("customCompanyInput",n.customCompany),t("picNameInput",n.pic),t("picPhoneInput",n.picPhone),t("notesInput",n.notes),n.isCustomTraining&&(setCustomTrainingMode(!0,n.customTrainingName||""),t("startDateInput",n.startDate),t("endDateInput",n.endDate),t("trainingVenueInput",n.venue),t("trainingHourInput",n.hour),calculateDuration()),Array.isArray(n.peserta)&&n.peserta.length&&n.peserta.forEach(a=>addParticipantRow(a)),showToast("info","Draf Dipulihkan","Isian terakhir Anda dimuat kembali.")}catch{}}function closeModal(){const e=document.getElementById("confirmationModal");e&&e.classList.add("hidden")}async function finalizeSubmission(){const e=document.getElementById("btnFinalSubmit"),n=document.getElementById("finalSubmitText");e.disabled=!0,n.textContent="Menyimpan...",closeModal(),showSoftLoader({type:"submit",title:"Menyimpan data",desc:uploadedFileObj?`Mengunggah ${uploadedFileObj.name} ke Google Drive & mencatat data...`:"Data sedang dimasukkan ke sistem.",icon:uploadedFileObj?"cloud_upload":"save",tag:uploadedFileObj?"Unggah PDF & Simpan Data":"Menyimpan ke Database"});let t=document.getElementById("regRefNo").value;t||(t="REG-"+new Date().getFullYear()+"-"+Math.floor(1e3+Math.random()*9e3),document.getElementById("regRefNo").value=t);const a=isCustomTrainingModeActive;let r="",l=null;if(a)r=(document.getElementById("customTrainingNameInput")?.value||"").trim();else{const g=document.getElementById("trainingProgramSelect"),y=g?g.selectedOptions[0]:null,v=(y?y.getAttribute("data-id"):null)||window.currentSelectedScheduleId||(g?g.value:null);l=v?(fetchedJadwalList||[]).find(x=>x.id_jadwal===v):null,r=l?l.agenda:y?y.getAttribute("data-agenda")||y.textContent:g?g.value:""}const i=document.getElementById("startDateInput").value,s=document.getElementById("endDateInput").value,o=document.getElementById("picNameInput").value.trim(),c=(document.getElementById("picPhoneInput")?.value||"").trim(),d=(document.getElementById("trainingVenueInput")?.value||"").trim()||(a?"Tentatif (Request Khusus)":"-"),u=(document.getElementById("trainingHourInput")?.value||"").trim()||"08:00 WIB (Tentatif)",m=document.querySelectorAll("#participantTableBody tr:not([data-is-example])"),b=[];m.forEach(g=>{const y=g.querySelector(".p-nip")?.value.trim()||"",v=g.querySelector(".p-nama")?.value.trim()||"",x=g.querySelector(".p-hp")?.value.trim()||"",k=g.querySelector(".p-jabatan")?.value.trim()||"",w=g.querySelector(".p-dept")?.value.trim()||"";(y||v)&&b.push({id_karyawan:y,nama_karyawan:v,no_hp:x,jabatan:k,departement:w,perusahaan:getSelectedCompany()||"PT Pani Bersama Tambang",validasi:"OK"})});const h=getSelectedCompany()||"PT Pani Bersama Tambang";let p="";if(a)p="REQ-"+t.replace(/^REG-/,"")+"-"+Math.floor(100+Math.random()*900);else{const g=document.getElementById("trainingProgramSelect"),y=g?g.selectedOptions[0]:null,v=(y?y.getAttribute("data-id"):null)||window.currentSelectedScheduleId||(g?g.value:null),x=l||(v?(fetchedJadwalList||[]).find(k=>k.id_jadwal===v):null);p=x&&x.id_jadwal?x.id_jadwal:v||"JADWAL-"+r.substring(0,10).replace(/[^a-zA-Z0-9]/g,"").toUpperCase(),x&&x.agenda&&(r=x.agenda)}const f={id_booking:t,id_jadwal:p,nama_pelatihan:r,tanggal_mulai:i,tanggal_selesai:s,ruangan:d,waktu_mulai:u,is_custom:a,pic_pendaftaran:c?`${o} (${c})`:o,pic_name:o,pic_phone:c,no_hp_pic:c,status_validasi:"OK",perusahaan:h,catatan:document.getElementById("notesInput")?.value?.trim()||"",file_name:uploadedFileObj?uploadedFileObj.name:"",file_type:uploadedFileObj?uploadedFileObj.type:"",file_data:uploadedFileObj?uploadedFileObj.base64:"",peserta:b};try{const g=new AbortController,y=setTimeout(()=>g.abort(),45e3);let v;try{v=await fetch(API_URL,{method:"POST",body:JSON.stringify(f),headers:{"Content-Type":"text/plain;charset=utf-8"},signal:g.signal})}finally{clearTimeout(y)}if(!v.ok)throw new Error("Server mengembalikan HTTP "+v.status);let x;try{x=await v.json()}catch{throw new Error("Respons server tidak valid. Silakan coba kembali beberapa saat lagi.")}if(x.status==="success"){hideSoftLoader(),closeModal();const k=x.file_url?" beserta dokumen memo di Google Drive":"",w=a?"Masuk ke Waiting List!":"Pendaftaran Berhasil!",_=a?`Permintaan pelatihan "${r}" untuk ${x.total_peserta||b.length} peserta${k} telah masuk ke Waiting List (ID: ${x.id_booking}). Permintaan tidak langsung masuk kalender; Admin L&D akan meninjau dan menetapkan tanggal jadwal resmi.`:`Data ${x.total_peserta||b.length} peserta${k} telah tersimpan (ID: ${x.id_booking}).`;showToast("success",w,_);const I=document.getElementById("statusRegistrasiLabel");I&&(I.textContent="Terkirim (Status: OK)",I.className="font-label-md text-label-md text-emerald-700 font-bold"),fetchAllDatabaseData();try{localStorage.removeItem(DRAFT_KEY)}catch{}generateRegNumber(),clearAllRows(),removeUploadedFile(),setCustomTrainingMode(!1)}else hideSoftLoader(),typeof window.handleRegistrationError=="function"?(window.handleRegistrationError(x),/^E_KUOTA|^E_JADWAL/.test(x.code||"")&&(closeModal(),fetchAllDatabaseData())):showToast("warning","Pendaftaran Gagal",x.message||"Terjadi kesalahan.")}catch(g){hideSoftLoader(),console.error(g);const y=g&&g.name==="AbortError";showToast("warning",y?"Koneksi Timeout":"Gagal Mengirim",y?"Server lama merespons. Data mungkin sudah tersimpan: cek jadwal, lalu kirim ulang (aman, tidak akan ganda).":g&&g.message||"Kendala jaringan.")}finally{hideSoftLoader(),e.disabled=!1,n.textContent="Ya, Kirim Sekarang"}}function renderDynamicListView(e){const n=document.getElementById("dynamic-schedule-container");if(!n)return;if(!e||e.length===0){if(window.isDatabaseLoading){n.innerHTML=getWaitingLoaderHtml("list");return}n.innerHTML=`
        <div class="p-8 bg-surface-container-low/40 rounded-2xl border border-outline-variant/30 text-center text-on-surface-variant">
          Belum ada jadwal pelatihan aktif dalam database sistem.
        </div>
      `;return}const t=sortSchedulesChronologically(e),a=t.filter(s=>!isSchedulePast(s)).length,r=t.length-a;let l=!1;const i=t.map(s=>{if(s.is_request){const x=!!s.is_synced,k=x?`Tersinkron dengan Jadwal Resmi (${escapeHtml(s.synced_schedule_id)})`:"Belum didaftarkan Admin LnD jadwalnya",w=x?"bg-emerald-100 text-emerald-950 border border-emerald-400":"bg-amber-100 text-amber-950 border border-amber-400",_=x?"sync":"pending_actions",I="bg-amber-500",S="p-4 sm:p-6 bg-amber-50/40 rounded-2xl shadow-sm border-2 border-amber-400/80 hover:shadow-md transition-shadow flex flex-col gap-4 relative overflow-hidden group",E=(s.peserta||[]).length,L=typeof window.isAdminAuthenticated=="function"&&window.isAdminAuthenticated();return`
        <div class="${S}">
          <div class="absolute left-0 top-0 bottom-0 w-2 ${I}"></div>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <span class="px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 font-label-sm text-label-sm font-extrabold flex items-center gap-1 shadow-2xs">
                <span class="material-symbols-outlined text-[14px]">history_edu</span>
                TRAINING REQUEST
              </span>
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${w} font-label-sm text-label-sm font-bold shadow-2xs">
                <span class="material-symbols-outlined text-[15px] ${x?"text-emerald-700":"text-amber-700 animate-pulse"}">${_}</span>
                ${k}
              </span>
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100/70 text-amber-900 border border-amber-200 font-label-sm text-label-sm font-semibold">
                <span class="material-symbols-outlined text-[14px]">group</span>
                ${E} Peserta Diajukan
              </span>
            </div>
            <div class="flex items-center gap-1.5 text-on-surface-variant font-label-md text-label-md">
              <span class="material-symbols-outlined text-[18px] text-amber-600">pin_drop</span>
              <span>${escapeHtml(s.room||"Tentatif (Gold Room / Diklat)")}</span>
            </div>
          </div>

          <div class="flex flex-col md:flex-row gap-4 items-start justify-between">
            <div class="flex gap-3 sm:gap-4 w-full">
              <div class="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                <span class="material-symbols-outlined text-[26px] sm:text-[32px] md:text-[36px]">hourglass_top</span>
              </div>
              <div class="flex flex-col gap-1 min-w-0 flex-1">
                <span class="font-label-sm text-label-sm uppercase tracking-wider text-amber-800 font-extrabold flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                  Permintaan Pelatihan di Luar Jadwal (Custom Request)
                </span>
                <h3 onclick="openTrainingDetailModal(${jsArg(s.id_jadwal)})" class="font-headline-sm text-headline-sm text-on-surface font-bold group-hover:text-amber-800 transition-colors cursor-pointer break-words">
                  ${escapeHtml(s.agenda)}
                </h3>
                <p class="text-body-sm text-on-surface-variant line-clamp-2">${escapeHtml(s.deskripsi||"Permintaan jadwal pelatihan khusus dari departemen / pemohon.")}</p>
                <div class="flex flex-wrap items-center gap-y-1 gap-x-4 text-on-surface-variant font-body-sm text-body-sm mt-0.5">
                  <span class="flex items-center gap-1 text-on-surface font-semibold">
                    <span class="material-symbols-outlined text-[16px] text-amber-600">date_range</span> ${s.is_tentative?"Tanggal Tentatif / Belum Ditetapkan":escapeHtml(formatSmartDateRange(s.start,s.end))}
                  </span>
                  <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-[16px] text-outline">alarm</span> ${escapeHtml(s.duration)}
                  </span>
                  <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-[16px] text-outline">badge</span> Kode: <strong>${escapeHtml(s.id_jadwal)}</strong>
                  </span>
                  ${s.id_booking?`
                  <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-[16px] text-outline">confirmation_number</span> ID Booking: <strong>${escapeHtml(s.id_booking)}</strong>
                  </span>`:""}
                </div>
              </div>
            </div>
          </div>

          <div class="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/70 flex flex-col md:flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-3 w-full md:w-auto">
              <div class="w-9 h-9 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-title-sm text-title-sm font-extrabold shadow-2xs">
                ${escapeHtml(getInitials(s.pic||"PIC"))}
              </div>
              <div class="flex flex-col">
                <span class="font-label-md text-label-md text-on-surface font-bold">${escapeHtml(s.pic||"PIC Pemohon")}</span>
                <span class="font-body-sm text-body-sm text-amber-900 font-medium">Pemohon Training Request</span>
              </div>
            </div>
            <div class="flex flex-col gap-1 w-full md:w-64">
              <div class="flex items-center justify-between font-label-sm text-label-sm">
                <span class="text-amber-950 font-semibold">Peserta Diajukan</span>
                <span class="font-extrabold text-amber-900">${E} Orang</span>
              </div>
              <div class="w-full h-2 bg-amber-200 rounded-full overflow-hidden">
                <div class="h-full bg-amber-500 rounded-full" style="width: 100%"></div>
              </div>
              <span class="text-right font-label-sm text-label-sm ${x?"text-emerald-700":"text-amber-900"} font-bold">
                ${x?"Jadwal Resmi Diterbitkan":"Menunggu Penjadwalan Admin L&D"}
              </span>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
            <span class="flex items-center gap-1.5 font-label-md text-label-md ${x?"text-emerald-800 font-semibold":"text-amber-950 font-medium"}">
              <span class="material-symbols-outlined text-[17px] ${x?"text-emerald-600":"text-amber-600"}">${x?"verified":"info"}</span>
              ${x?`Telah tersinkronisasi ke jadwal resmi ${escapeHtml(s.synced_schedule_id)}`:"Pengajuan belum dimasukkan ke jadwal resmi oleh Admin L&D"}
            </span>
            <div class="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
              ${L&&!x?`<button type="button" onclick="openAdminAddFromRequest(${jsArg(s.id_jadwal)})" class="flex-1 sm:flex-none h-10 sm:h-9 px-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer" title="Setujui request, pilih tempat/ruangan, dan jadwalkan"><span class="material-symbols-outlined text-[17px]">task_alt</span><span>Setujui &amp; Jadwalkan</span></button><button type="button" onclick="openRejectRequestModal(${jsArg(s.id_jadwal)})" class="flex-1 sm:flex-none h-10 sm:h-9 px-3.5 rounded-xl border border-red-300 bg-red-50 hover:bg-red-100 text-red-800 font-label-md text-label-md font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer" title="Tolak pengajuan pelatihan ini"><span class="material-symbols-outlined text-[17px]">block</span><span>Tolak</span></button>`:L&&x?`<button type="button" onclick="editScheduledTrainingFromWaitingList(${jsArg(s.synced_schedule_id||s.id_jadwal)})" class="flex-1 sm:flex-none h-10 sm:h-9 px-3.5 rounded-xl border border-outline-variant bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-md text-label-md font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer" title="Ubah ruangan/tempat, tanggal, atau jam jadwal resmi"><span class="material-symbols-outlined text-[17px] text-primary">edit_calendar</span><span>Ubah Jadwal / Tempat</span></button>`:""}
              <button type="button" onclick="openTrainingDetailModal(${jsArg(s.id_jadwal)})" class="flex-1 sm:flex-none h-10 sm:h-9 px-4 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md font-semibold transition-colors justify-center flex items-center gap-1.5 cursor-pointer">
                <span class="material-symbols-outlined text-[17px]">visibility</span>
                <span>Lihat Detail &amp; Peserta (${E})</span>
              </button>
            </div>
          </div>
        </div>`}const o=Number(s.kuota)||20,c=Number(s.sisa_kuota)||0,d=Math.max(0,o-c),u=Math.min(100,Math.round(d/(o||1)*100)),m=isSchedulePast(s);let b="";m&&!l&&(l=!0,b=`
          <div class="pt-4 pb-1 flex items-center gap-3">
            <div class="h-px bg-outline-variant/60 flex-1"></div>
            <span class="px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-bold flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[15px]">history</span>
              Pelatihan yang Sudah Berjalan / Selesai (${r})
            </span>
            <div class="h-px bg-outline-variant/60 flex-1"></div>
          </div>
        `);const h=c<=0;let p=h?"Kuota Penuh (Verifikasi L&amp;D)":s.status||"Buka Pendaftaran",f=h?"bg-amber-50 text-amber-800":"bg-emerald-50 text-emerald-800",g=h?"info":"check_circle";return m&&(p="Selesai Pelaksanaan",f="bg-slate-100 text-slate-700",g="task_alt"),`
      ${b}
      <div class="${m?"p-4 sm:p-6 bg-surface-container-low/30 rounded-2xl shadow-none border border-outline-variant/30 opacity-75 hover:opacity-100 transition-all flex flex-col gap-4 relative overflow-hidden group":"p-4 sm:p-6 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/40 hover:shadow-md transition-shadow flex flex-col gap-4 relative overflow-hidden group"}">
        <div class="absolute left-0 top-0 bottom-0 w-1.5 ${m?"bg-slate-400":"bg-primary"}"></div>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <span class="px-2.5 py-1 rounded-md ${m?"bg-surface-container-high text-on-surface-variant":"bg-primary-fixed text-on-primary-fixed"} font-label-sm text-label-sm font-bold">${escapeHtml(s.batch||s.id_jadwal)}</span>
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full ${f} font-label-sm text-label-sm font-semibold">
              <span class="material-symbols-outlined text-[14px]">${g}</span>
              ${p}
            </span>
            ${s.has_linked_request?`
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300 font-label-sm text-label-sm font-bold shadow-2xs" title="Tersinkron dengan Training Request (${escapeHtml(s.linked_request_id)})">
              <span class="material-symbols-outlined text-[14px] text-amber-700">link</span>
              ${s.linked_request_count||1} Peserta dari Training Request
            </span>`:""}
            
          </div>
          <div class="flex items-center gap-1.5 text-on-surface-variant font-label-md text-label-md">
            <span class="material-symbols-outlined text-[18px] ${m?"text-outline":"text-primary"}">pin_drop</span>
            <span>${escapeHtml(s.room||"Ruang Diklat Utama")}</span>
          </div>
        </div>
        <div class="flex flex-col md:flex-row gap-4 items-start justify-between">
          <div class="flex gap-3 sm:gap-4 w-full">
            <div class="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl ${m?"bg-slate-600":"bg-primary"} text-on-primary flex items-center justify-center shrink-0 shadow-xs">
              <span class="material-symbols-outlined text-[26px] sm:text-[32px] md:text-[36px]">school</span>
            </div>
            <div class="flex flex-col gap-1 min-w-0 flex-1">
              <span class="font-label-sm text-label-sm uppercase tracking-wider ${m?"text-outline":"text-primary"} font-bold">Program L&amp;D Pani Gold Project</span>
              <h3 onclick="openTrainingDetailModal(${jsArg(s.id_jadwal)})" class="font-headline-sm text-headline-sm text-on-surface font-semibold group-hover:text-primary transition-colors cursor-pointer break-words">
                ${escapeHtml(s.agenda)}
              </h3>
              <p class="text-body-sm text-on-surface-variant line-clamp-2">${escapeHtml(s.deskripsi||"Program peningkatan kompetensi teknis dan profesional karyawan.")}</p>
              <div class="flex flex-wrap items-center gap-y-1 gap-x-4 text-on-surface-variant font-body-sm text-body-sm mt-0.5">
                <span class="flex items-center gap-1 text-on-surface font-medium">
                  <span class="material-symbols-outlined text-[16px] text-outline">date_range</span> ${escapeHtml(formatSmartDateRange(s.start,s.end))}
                </span>
                ${s.start_hour?`
                <span class="flex items-center gap-1 ${m?"text-on-surface-variant":"text-primary"} font-semibold">
                  <span class="material-symbols-outlined text-[16px]">schedule</span> Pukul ${escapeHtml(s.start_hour)} WIB
                </span>`:""}
                <span class="flex items-center gap-1">
                  <span class="material-symbols-outlined text-[16px] text-outline">alarm</span> ${escapeHtml(formatSmartDuration(s.duration,s.start,s.end))}
                </span>
                <span class="flex items-center gap-1">
                  <span class="material-symbols-outlined text-[16px] text-outline">badge</span> Kode: <strong>${escapeHtml(s.id_jadwal)}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="p-3.5 rounded-xl bg-surface-container-low flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-3 w-full md:w-auto">
            <div class="w-9 h-9 rounded-full ${m?"bg-surface-container-high text-on-surface-variant":"bg-primary-fixed text-primary"} flex items-center justify-center font-title-sm text-title-sm font-bold">
              ${escapeHtml(getInitials(s.pic||"Trainer"))}
            </div>
            <div class="flex flex-col">
              <span class="font-label-md text-label-md text-on-surface font-semibold">${escapeHtml(s.pic||"Instruktur L&D")}</span>
              <span class="font-body-sm text-body-sm text-on-surface-variant">PIC Training & Development</span>
            </div>
          </div>
          <div class="flex flex-col gap-1 w-full md:w-64">
            <div class="flex items-center justify-between font-label-sm text-label-sm">
              <span class="text-on-surface-variant">Kapasitas Batch</span>
              <span class="font-bold text-on-surface">${d} <span class="text-on-surface-variant font-normal">/ ${o} Terisi (${u}%)</span></span>
            </div>
            <div class="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
              <div class="h-full ${m?"bg-slate-400":"bg-primary"} rounded-full" style="width: ${u}%"></div>
            </div>
            <span class="text-right font-label-sm text-label-sm ${m?"text-slate-600":c>0?"text-primary":"text-error"} font-semibold">
              ${m?"Pelatihan Selesai":c>0?`Sisa ${c} Kursi Tersedia`:"Pendaftaran Penuh"}
            </span>
          </div>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
          <span></span>
          <div class="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
            ${!s.is_request&&typeof window.isAdminAuthenticated=="function"&&window.isAdminAuthenticated()?`
            <button type="button" onclick="openAdminScheduleModal('edit', ${jsArg(s.id_jadwal)}, 'internal')" class="h-10 sm:h-9 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 font-label-sm text-label-sm font-semibold transition-colors inline-flex items-center justify-center gap-1 cursor-pointer" title="Edit Jadwal (Admin)">
              <span class="material-symbols-outlined text-[16px] text-amber-700">edit_calendar</span>
              <span>Edit</span>
            </button>
            <button type="button" onclick="openAdminDeleteModal(${jsArg(s.id_jadwal)}, 'internal', ${jsArg(s.agenda)})" class="h-10 sm:h-9 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-label-sm text-label-sm font-semibold transition-colors inline-flex items-center justify-center gap-1 cursor-pointer" title="Hapus Jadwal (Wajib Password Admin)">
              <span class="material-symbols-outlined text-[16px]">delete</span>
              <span>Hapus</span>
            </button>
            `:""}
            <button type="button" onclick="openTrainingDetailModal(${jsArg(s.id_jadwal)})" class="flex-1 sm:flex-none h-10 sm:h-9 px-4 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md transition-colors justify-center flex items-center cursor-pointer">
              ${m?"Lihat Dokumentasi &amp; Silabus":"Lihat Detail &amp; Silabus"}
            </button>
            ${m?`
            <button type="button" onclick="openTrainingDetailModal(${jsArg(s.id_jadwal)})" class="flex-1 sm:flex-none h-10 sm:h-9 px-5 rounded-xl bg-surface-container-highest hover:bg-surface-container text-on-surface-variant font-label-md text-label-md shadow-xs transition-all flex items-center justify-center gap-1.5 font-semibold cursor-pointer">
              <span class="material-symbols-outlined text-[16px]">task_alt</span>
              Pelatihan Selesai
            </button>
            `:isRegClosedOnly(s)?`<button type="button" onclick="selectScheduleAndRegister(${jsArg(s.id_jadwal)}, ${jsArg(s.agenda)})" class="flex-1 sm:flex-none h-10 sm:h-9 px-5 rounded-xl bg-surface-container-highest hover:bg-surface-container text-on-surface-variant font-label-md text-label-md shadow-xs transition-all flex items-center justify-center gap-1.5 font-semibold cursor-pointer" title="Pendaftaran ditutup (batas H-1 pukul 12:00). Klik untuk mengajukan Request di luar jadwal."><span class="material-symbols-outlined text-[16px]">lock</span> Pendaftaran Ditutup</button>`:h?`
            <button type="button" onclick="selectScheduleAndRegister(${jsArg(s.id_jadwal)}, ${jsArg(s.agenda)})" class="flex-1 sm:flex-none h-10 sm:h-9 px-5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-label-md text-label-md shadow-sm transition-all flex items-center justify-center gap-1.5 font-semibold cursor-pointer" title="Kuota penuh - tetap dapat mendaftar (diverifikasi Tim L&amp;D)">
              <span class="material-symbols-outlined text-[16px]">how_to_reg</span>
              + Daftar (Verifikasi L&amp;D)
            </button>
            `:`
            <button type="button" onclick="selectScheduleAndRegister(${jsArg(s.id_jadwal)}, ${jsArg(s.agenda)})" class="flex-1 sm:flex-none h-10 sm:h-9 px-5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md shadow-sm transition-all flex items-center justify-center gap-1.5 font-semibold cursor-pointer">
              <span class="material-symbols-outlined text-[16px]">person_add</span>
              + Daftarkan Peserta
            </button>
            `}
          </div>
        </div>
      </div>`}).join("");n.innerHTML=`
      <div class="flex flex-wrap items-center justify-between gap-2 pb-2">
        <h3 class="font-title-md text-title-md font-bold text-on-surface flex items-center gap-2">
          <span class="material-symbols-outlined text-primary text-[22px]">event_available</span>
          Pelatihan Aktif &amp; Akan Datang (${a})${r>0?` <span class="text-body-sm font-normal text-on-surface-variant">&bull; ${r} Sudah Berjalan</span>`:""}
        </h3>
        <span class="text-label-sm text-primary font-semibold">Urutan: Aktif / Akan Datang Terdekat</span>
      </div>
      ${i}
    `}function formatSmartDuration(e,n,t){if(e&&typeof e=="string"&&!e.includes("-")){const i=e.match(/\d+/);if(i&&parseInt(i[0],10)>0)return e}let a=0;if(e){const i=String(e).match(/(\d+)\s*(?:jam|hour|hours)/i);i&&(a=parseInt(i[1],10))}if(a>0)return`${Math.max(1,Math.ceil(a/8))} Hari (${a} Jam)`;const r=parseDateString(n),l=parseDateString(t);if(r&&l){const i=new Date(r.year,r.month-1,r.day),s=new Date(l.year,l.month-1,l.day);let o=Math.round((s-i)/864e5)+1;if(o<=0&&(o=Math.abs(Math.round((s-i)/864e5))+1),o>0)return`${o} Hari (${o*8} Jam)`}return e&&!e.includes("-")?e:"5 Hari (40 Jam)"}function formatSmartDateRange(e,n){const t=parseDateString(e),a=parseDateString(n);if(!t&&!a)return"-";if(!a)return t?`${t.day} ${MONTH_NAMES[t.month-1].slice(0,3)} ${t.year}`:"-";if(!t)return`${a.day} ${MONTH_NAMES[a.month-1].slice(0,3)} ${a.year}`;let r=new Date(t.year,t.month-1,t.day),l=new Date(a.year,a.month-1,a.day);if(l<r)if(a.year<t.year)l=new Date(r.getTime()+4*864e5);else{const o=r;r=l,l=o}const i=`${r.getDate()} ${MONTH_NAMES[r.getMonth()].slice(0,3)} ${r.getFullYear()}`,s=`${l.getDate()} ${MONTH_NAMES[l.getMonth()].slice(0,3)} ${l.getFullYear()}`;return i===s?i:`${i} – ${s}`}function itemRange(e){const n=parseDateString(e.start);if(!n)return null;const t=parseDateString(e.end)||n;let a=new Date(n.year,n.month-1,n.day),r=new Date(t.year,t.month-1,t.day);if(r<a)if(t.year<n.year){const l=String(e.duration||"").match(/(\d+)\s*(?:jam|hour)/i),i=l?parseInt(l[1],10):40,s=Math.max(1,Math.ceil(i/8));r=new Date(a.getTime()+(s-1)*864e5)}else{const l=a;a=r,r=l}return[a,r]}function isRegClosedOnly(e){return!!e&&!isSchedulePast(e)&&(!!e.is_registration_closed||!!e.is_closed_h1||/tutup|closed/i.test(e.status||""))}window.isRegClosedOnly=isRegClosedOnly;function isSchedulePast(e){if(!e)return!1;if(/selesai|batal|cancel/i.test(e.status||""))return!0;const n=itemRange(e);if(!n||!n[1])return!1;const t=new Date;return t.setHours(0,0,0,0),n[1].getTime()<t.getTime()}window.isSchedulePast=isSchedulePast;function parseStartHour(e){if(e==null||e==="")return{formatted:"",minutes:9999};if(Array.isArray(e)&&e.length>=2){const l=Number(e[0])||0,i=Number(e[1])||0,s=String(l).padStart(2,"0"),o=String(i).padStart(2,"0");return{formatted:`${s}:${o}`,minutes:l*60+i}}if(e instanceof Date&&!isNaN(e.getTime())){const l=e.getHours(),i=e.getMinutes(),s=String(l).padStart(2,"0"),o=String(i).padStart(2,"0");return{formatted:`${s}:${o}`,minutes:l*60+i}}const n=String(e).trim(),t=n.match(/Date\(\s*\d+,\s*\d+,\s*\d+,\s*(\d+),\s*(\d+)/i);if(t){const l=parseInt(t[1],10),i=parseInt(t[2],10),s=String(l).padStart(2,"0"),o=String(i).padStart(2,"0");return{formatted:`${s}:${o}`,minutes:l*60+i}}if(typeof e=="number"&&e>0&&e<1){const l=Math.round(e*24*60),i=Math.floor(l/60)%24,s=l%60,o=String(i).padStart(2,"0"),c=String(s).padStart(2,"0");return{formatted:`${o}:${c}`,minutes:i*60+s}}if(typeof e=="number"&&e>=1&&e<=24){const l=Math.floor(e)%24;return{formatted:`${String(l).padStart(2,"0")}:00`,minutes:l*60}}const a=n.match(/(\d{1,2})[:.](\d{2})/);if(a){const l=parseInt(a[1],10),i=parseInt(a[2],10),s=String(l).padStart(2,"0"),o=String(i).padStart(2,"0");return{formatted:`${s}:${o}`,minutes:l*60+i}}const r=n.match(/^(\d{1,2})(?:\s*wib)?$/i);if(r){const l=parseInt(r[1],10);if(l>=0&&l<=24)return{formatted:`${String(l).padStart(2,"0")}:00`,minutes:l*60}}return{formatted:n,minutes:9999}}window.parseStartHour=parseStartHour;function sortSchedulesChronologically(e){return Array.isArray(e)?[...e].sort((n,t)=>{const a=isSchedulePast(n),r=isSchedulePast(t);if(a!==r)return a?1:-1;const l=itemRange(n),i=itemRange(t);if(!l&&i)return 1;if(l&&!i)return-1;const s=l?l[0].getTime():0,o=i?i[0].getTime():0;if(s!==o)return s-o;const c=n.start_minutes!=null?n.start_minutes:9999,d=t.start_minutes!=null?t.start_minutes:9999;return c!==d?c-d:String(n.agenda||"").localeCompare(String(t.agenda||""))}):[]}window.sortSchedulesChronologically=sortSchedulesChronologically;function colorFor(e,n){if(n&&n.is_request)return n.is_synced?"bg-amber-500 text-slate-950 font-bold border-2 border-amber-600 shadow-sm":"bg-amber-400 text-slate-950 font-black border-2 border-amber-600 shadow-sm";const t=(e||"").toLowerCase();return/k3|hse|safety|tambang/.test(t)?"bg-[#9D7828] text-white":/cyber|\bit\b|sap|cloud/.test(t)?"bg-secondary text-on-secondary":/bnsp|audit/.test(t)?"bg-emerald-700 text-white":/finance|keuangan/.test(t)?"bg-tertiary text-on-tertiary":"bg-primary text-on-primary"}function pickDefaultPeriod(){const e=new Date,n=new Date(e.getFullYear(),e.getMonth(),e.getDate()),t=(LIVE_SCHEDULES||[]).map(itemRange).filter(Boolean);if(!t.length)return;const a=new Date(e.getFullYear(),e.getMonth(),1),r=new Date(e.getFullYear(),e.getMonth()+1,0);let l;if(t.some(i=>i[0]<=r&&i[1]>=a))l=n;else{const i=t.filter(s=>s[1]>=n).sort((s,o)=>s[0]-o[0])[0];l=i?i[0]:t.sort((s,o)=>o[0]-s[0])[0][0]}currentCalendarYear=l.getFullYear(),currentCalendarMonth=l.getMonth()}function renderDynamicWeekView(e){const n=document.getElementById("week-view-body");if(!n)return;const t=currentCalendarYear,a=currentCalendarMonth,r=new Date(t,a,1),l=new Date(t,a+1,0),i=(e||[]).map(p=>({it:p,r:itemRange(p)})).filter(p=>p.r&&p.r[0]<=l&&p.r[1]>=r),s=document.getElementById("week-view-title");s&&(s.textContent=`Jadwal Mingguan: ${MONTH_NAMES[a]} ${t}`);const o=document.getElementById("week-count-badge");o&&(o.textContent=`${i.length} Pelatihan Terjadwal`);let c=0,d=0;i.forEach(p=>{c+=Number(p.it.kuota)||0,d+=Number(p.it.sisa_kuota)||0});const u=document.getElementById("week-capacity-summary");if(u&&(u.innerHTML=i.length?`Kapasitas: <strong>${c} Kursi (${Math.max(0,c-d)} Terisi, ${d} Tersedia)</strong>`:""),!i.length){if(window.isDatabaseLoading){n.innerHTML=getWaitingLoaderHtml("home");return}n.innerHTML=`<div class="p-8 text-center text-on-surface-variant bg-surface-container-low/40 rounded-2xl">Tidak ada pelatihan pada ${MONTH_NAMES[a]} ${t}.</div>`;return}const m=["Sen","Sel","Rab","Kam","Jum","Sab","Min"],b=p=>`${p.getDate()} ${MONTH_NAMES[p.getMonth()].slice(0,3)}`;let h="";for(let p=new Date(t,a,1-(r.getDay()+6)%7);p<=l;p=new Date(p.getFullYear(),p.getMonth(),p.getDate()+7)){const f=new Date(p.getFullYear(),p.getMonth(),p.getDate()+6),g=i.filter(w=>w.r[0]<=f&&w.r[1]>=p);g.sort((w,_)=>{const I=w.r[0]-_.r[0];if(I!==0)return I;const S=w.it.start_minutes!=null?w.it.start_minutes:9999,E=_.it.start_minutes!=null?_.it.start_minutes:9999;return S-E});const y=new Date,v=new Date(y.getFullYear(),y.getMonth(),y.getDate()).getTime(),x=m.map((w,_)=>{const I=new Date(p.getFullYear(),p.getMonth(),p.getDate()+_);return`<div class="text-center text-[11px] ${I.getTime()<v?"text-outline/70 opacity-70":_>4?"text-outline":"text-on-surface-variant"} ${I.getMonth()!==a?"opacity-40":""}"><span class="font-semibold">${w}</span> ${I.getDate()}</div>`}).join(""),k=g.map(w=>{const _=Math.max(0,Math.round((w.r[0]-p)/864e5)),I=Math.min(6,Math.round((w.r[1]-p)/864e5)),S=Number(w.it.sisa_kuota),E=w.it.start_hour?`${escapeHtml(w.it.start_hour)} • `:"",L=isSchedulePast(w.it)||w.r&&w.r[1]&&w.r[1].getTime()<v,B=!!w.it.is_request,P=!!w.it.is_synced,R=B?P?"bg-amber-500 text-slate-950 font-bold border border-amber-600 shadow-xs":"bg-amber-400 text-slate-950 font-black border-2 border-amber-600 shadow-sm":L?`${colorFor(w.it.agenda,w.it)} opacity-40 hover:opacity-95 filter grayscale-[55%] hover:grayscale-0 shadow-none border border-black/10`:`${colorFor(w.it.agenda,w.it)} shadow-xs hover:opacity-90`,$=B?`[Request] ${P?"Tersinkron: "+escapeHtml(w.it.synced_schedule_id):"Belum didaftarkan Admin LnD"} • ${(w.it.peserta||[]).length} Peserta`:L?`${E}Selesai • ${escapeHtml(w.it.room||"")}`:`${E}${escapeHtml(w.it.room||"")} &bull; ${!isNaN(S)&&S<=0?"Penuh":"Sisa "+(isNaN(S)?"-":S)+" kursi"}`,T=typeof window.isAdminAuthenticated=="function"&&window.isAdminAuthenticated()&&!B?`<span class="inline-flex items-center gap-0.5 ml-1 shrink-0"><span onclick="event.stopPropagation(); openAdminScheduleModal('edit', ${jsArg(w.it.id_jadwal)}, 'internal')" class="w-5 h-5 rounded bg-black/25 hover:bg-black/45 text-white inline-flex items-center justify-center cursor-pointer" title="Edit Jadwal"><span class="material-symbols-outlined text-[12px]">edit</span></span><span onclick="event.stopPropagation(); openAdminDeleteModal(${jsArg(w.it.id_jadwal)}, 'internal', ${jsArg(w.it.agenda)})" class="w-5 h-5 rounded bg-red-600/80 hover:bg-red-700 text-white inline-flex items-center justify-center cursor-pointer" title="Hapus Jadwal"><span class="material-symbols-outlined text-[12px]">delete</span></span></span>`:"";return`<div onclick="openTrainingDetailModal(${jsArg(w.it.id_jadwal)})" style="grid-column:${_+1} / ${I+2}" class="${R} rounded-lg px-2.5 py-1.5 text-left text-[12px] leading-tight transition-all min-w-0 cursor-pointer flex items-center justify-between gap-1"><div class="min-w-0 flex-1"><span class="block font-bold truncate">${escapeHtml(w.it.agenda)}</span><span class="block text-[10px] opacity-90 truncate">${$}</span></div>${T}</div>`}).join("");h+=`<div class="min-w-[640px]"><div class="text-label-md font-semibold text-on-surface mb-2">${b(p)} - ${b(f)}</div><div class="grid grid-cols-7 gap-1 pb-1 border-b border-surface-container">${x}</div><div class="grid grid-cols-7 gap-1 pt-2">${k||'<div class="col-span-7 text-center text-[12px] text-outline py-2">Tidak ada sesi</div>'}</div></div>`}n.innerHTML=h}function injectMonthViewBadges(e,n,t){Array.isArray(e)||(e=getFilteredSchedules()),n===void 0&&(n=currentCalendarYear),t===void 0&&(t=currentCalendarMonth),document.querySelectorAll(".day-events-container").forEach(d=>{d.innerHTML=""});const a=new Date(n,t,1),r=new Date(n,t+1,0),l=new Date,i=new Date(l.getFullYear(),l.getMonth(),l.getDate()).getTime();let s=0;const o={};e.forEach(d=>{const u=itemRange(d);if(!u||u[0]>r||u[1]<a)return;s++;const m=u[0]<a?1:u[0].getDate(),b=u[1]>r?r.getDate():u[1].getDate();for(let h=m;h<=b;h++)o[h]||(o[h]=[]),o[h].push({item:d,isStart:h===m})}),Object.keys(o).forEach(d=>{const u=parseInt(d,10),m=document.querySelector(`[data-day-container="${u}"]`);if(!m)return;const h=new Date(n,t,u).getTime()<i;o[u].sort((p,f)=>{const g=p.item.start_minutes!=null?p.item.start_minutes:9999,y=f.item.start_minutes!=null?f.item.start_minutes:9999;return g!==y?g-y:(p.item.agenda||"").localeCompare(f.item.agenda||"")}),o[u].forEach(({item:p,isStart:f})=>{const g=h||isSchedulePast(p),y=document.createElement("div");y.setAttribute("data-schedule-id",p.id_jadwal);const v=typeof window.isAdminAuthenticated=="function"&&window.isAdminAuthenticated(),x=v&&!p.is_request?`<span class="inline-flex items-center gap-0.5 ml-auto pl-1 shrink-0"><button type="button" onclick="event.stopPropagation(); openAdminScheduleModal('edit', ${jsArg(p.id_jadwal)}, 'internal')" class="w-4 h-4 rounded bg-black/25 hover:bg-black/50 text-white inline-flex items-center justify-center" title="Edit Jadwal"><span class="material-symbols-outlined text-[11px]">edit</span></button><button type="button" onclick="event.stopPropagation(); openAdminDeleteModal(${jsArg(p.id_jadwal)}, 'internal', ${jsArg(p.agenda)})" class="w-4 h-4 rounded bg-red-600/85 hover:bg-red-700 text-white inline-flex items-center justify-center" title="Hapus Jadwal"><span class="material-symbols-outlined text-[11px]">close</span></button></span>`:"";if(p.is_request){const k=!!p.is_synced,w=k?`Tersinkron (${p.synced_schedule_id})`:"Belum didaftarkan Admin LnD",_=k?"bg-amber-500 text-slate-950 font-bold border border-amber-600 shadow-sm":"bg-amber-400 text-slate-950 font-black border-2 border-amber-600 shadow-sm";y.className=`mt-0.5 sm:mt-1 p-1 sm:p-1.5 rounded-md sm:rounded-lg ${_} text-[10px] sm:text-[11px] leading-tight cursor-pointer hover:opacity-95 hover:scale-[1.01] transition-all`,y.classList.add("cal-req"),y.title=`[Training Request] ${p.agenda} - ${w} (${(p.peserta||[]).length} Peserta)`;const I=`<span class="inline-block px-1 py-0.2 rounded ${k?"bg-amber-950/20 text-slate-950":"bg-slate-950/20 text-slate-950"} text-[8.5px] font-mono font-black mr-1 shrink-0">REQ</span>`,S=v&&!k?`<button type="button" onclick="event.stopPropagation(); openAdminAddFromRequest(${jsArg(p.id_jadwal)})" class="w-4 h-4 rounded bg-amber-800 hover:bg-amber-900 text-white inline-flex items-center justify-center ml-auto shrink-0 shadow-2xs" title="Setujui &amp; Jadwalkan Request"><span class="material-symbols-outlined text-[11px]">add</span></button><button type="button" onclick="event.stopPropagation(); openRejectRequestModal(${jsArg(p.id_jadwal)})" class="w-4 h-4 rounded bg-red-700 hover:bg-red-800 text-white inline-flex items-center justify-center ml-0.5 shrink-0 shadow-2xs" title="Tolak Request"><span class="material-symbols-outlined text-[11px]">close</span></button>`:"";y.innerHTML=f?`<div class="font-extrabold truncate flex items-center">${I}<span class="truncate">${escapeHtml(p.agenda)}</span>${S}</div><div class="text-[9px] sm:text-[9.5px] text-slate-950/90 font-bold truncate flex items-center gap-1 mt-0.5"><span class="inline-block w-1.5 h-1.5 rounded-full ${k?"bg-emerald-800":"bg-amber-800 animate-pulse"}"></span> ${escapeHtml(w)} &bull; ${(p.peserta||[]).length} Peserta</div>`:`<div class="font-bold truncate flex items-center">${I}<span class="truncate">&#8627; ${escapeHtml(p.agenda)} <span class="text-[9px] font-normal">(${escapeHtml(w)})</span></span>${S}</div>`}else g?(y.className=`mt-0.5 sm:mt-1 p-1 sm:p-1.5 rounded-md sm:rounded-lg ${colorFor(p.agenda,p)} opacity-40 hover:opacity-95 filter grayscale-[55%] hover:grayscale-0 text-[10px] sm:text-[11px] leading-tight cursor-pointer transition-all border border-black/10`,y.title=`${p.agenda} (Selesai) - Klik untuk melihat detail & dokumentasi`):(y.className=`mt-0.5 sm:mt-1 p-1 sm:p-1.5 rounded-md sm:rounded-lg ${colorFor(p.agenda,p)} text-[10px] sm:text-[11px] leading-tight shadow-xs cursor-pointer hover:opacity-90 hover:scale-[1.01] transition-all`,y.title=`${p.agenda} - Klik untuk mendaftar atau melihat detail`);if(y.onclick=()=>openTrainingDetailModal(p.id_jadwal),!p.is_request){const k=p.start_hour?`<span class="inline-block px-1 py-0.2 rounded ${g?"bg-black/30 text-white/80":"bg-black/20"} text-[8.5px] sm:text-[9px] font-mono font-bold mr-1 shrink-0">${escapeHtml(p.start_hour)}</span>`:"",w=p.room&&p.room!=="-"?`<span class="inline-flex items-center gap-0.5 px-1 py-0.2 rounded ${g?"bg-black/25 text-white/70":"bg-black/20 text-white"} text-[8px] sm:text-[8.5px] font-semibold mr-1 shrink-0 max-w-[85px] truncate" title="Ruangan: ${escapeHtml(p.room)}"><span class="material-symbols-outlined text-[10px]">meeting_room</span><span class="truncate">${escapeHtml(p.room)}</span></span>`:"",_=p.has_linked_request?`<span class="inline-block w-2 h-2 rounded-full bg-amber-400 border border-white shrink-0 ml-1" title="Tersinkron dengan Training Request (${p.linked_request_count||1} peserta)"></span>`:"",I=[];if(p.start_hour&&I.push('<span class="cal-chip cal-time">'+escapeHtml(p.start_hour)+"</span>"),p.room&&p.room!=="-"&&I.push('<span class="cal-chip">'+escapeHtml(p.room)+"</span>"),f){const S=String(p.batch||"").trim();S&&String(p.agenda||"").toLowerCase().indexOf(S.toLowerCase())===-1&&I.push('<span class="cal-chip">'+escapeHtml(S)+"</span>"),I.push(g?'<span class="cal-chip cal-done">Selesai</span>':isRegClosedOnly(p)?'<span class="cal-chip cal-closed">Pendaftaran ditutup</span>':'<span class="cal-chip cal-qty">Sisa '+(p.sisa_kuota||0)+" kursi</span>")}y.innerHTML='<div class="flex items-start gap-1"><span class="cal-name">'+(f?"":"&#8627; ")+escapeHtml(p.agenda)+"</span>"+_+x+'</div><div class="cal-meta">'+I.join("")+"</div>"}m.appendChild(y)})});const c=document.getElementById("calendar-session-count");c&&(c.innerHTML=`&bull; ${s} Sesi Terjadwal (${MONTH_NAMES[t]} ${n})`)}window.injectMonthViewBadges=injectMonthViewBadges;function maskStringWithBlur(e,n="general"){if(!e||e==="-")return"-";let t=String(e).trim();if(!t||t==="-")return"-";if(t.includes("privacy-masked-blur")||t.includes("<span"))return t;const a=s=>`<span class="privacy-masked-blur">${s}</span>`;if(/[\u2022\u00E2\u20AC\u00A2*•]/.test(t)){t=t.replace(/â€¢/g,"•").replace(/[\u2022*]/g,"•");const s=t.match(/^(.*?)(•+)$/);return s?escapeHtml(s[1])+a(s[2]):t.split(/(•+)/).map(o=>o.startsWith("•")?a(o):escapeHtml(o)).join("")}const r=t.length;if(r<=2)return escapeHtml(t[0])+a("•");if(r===3)return escapeHtml(t.slice(0,2))+a("•");if(r<=5)return escapeHtml(t.slice(0,r-2))+a("••");if(t.endsWith(")")){const s=t.lastIndexOf("(");if(s!==-1&&s<r-2){const o=t.slice(s+1,-1),c=o.length<=2?o[0]+"•":o[0]+"•".repeat(o.length-1);return escapeHtml(t.slice(0,s+1))+a(c)+")"}}if(n==="id"||n==="nik"){const s=r>=8?4:3,o=Math.max(1,r-s);return escapeHtml(t.slice(0,o))+a("•".repeat(s))}const l=r>=9?3:2,i=Math.max(1,r-l);return escapeHtml(t.slice(0,i))+a("•".repeat(l))}let currentModalParticipantsList=[];function renderModalParticipantRows(e){const n=document.getElementById("participant-table-body"),t=document.getElementById("search-result-count");n&&(Array.isArray(e)&&e.length>0?n.innerHTML=e.map((a,r)=>{const l=/menunggu/i.test(a.validasi||""),i=maskStringWithBlur(a.nama_karyawan,"name"),s=maskStringWithBlur(a.id_karyawan,"id"),o=maskStringWithBlur(a.perusahaan||"-","company"),c=maskStringWithBlur(a.departement||a.jabatan||"-","dept"),d=String(a.pic_pendaftaran||a.pic||a.pic_perusahaan||"").trim(),u=d&&d!=="-"&&d!=="- (-)"&&d!=="()",m=u?escapeHtml(d):"";return`<tr class="hover:bg-surface-container-low/40 transition-colors">
          <td class="py-2.5 px-4 sm:px-6 text-outline text-[12px] font-mono">${r+1}</td>
          <td class="py-2.5 px-3">
            <div class="font-medium text-on-surface">${i}</div>
            <div class="text-[11px] text-outline font-mono mt-0.5">${s}</div>
            <div class="sm:hidden text-[11px] text-on-surface-variant mt-1 space-y-0.5">
              <div class="font-medium">${o}</div>
              ${u?`<div class="text-[10.5px] text-outline flex items-center gap-1"><span class="text-primary font-semibold text-[9.5px]">PIC:</span><span class="text-on-surface-variant truncate">${m}</span></div>`:""}
            </div>
          </td>
          <td class="py-2.5 px-3 text-on-surface-variant hidden sm:table-cell text-body-sm">
            <div class="font-medium text-on-surface">${o}</div>
            ${u?`<div class="text-[11px] text-outline mt-0.5 flex items-center gap-1" title="PIC Perusahaan: ${m}">
              <span class="inline-flex items-center gap-0.5 font-semibold text-primary">
                <span class="material-symbols-outlined text-[13px] leading-none">person</span>
                <span class="text-[9.5px] uppercase font-bold tracking-wider">PIC:</span>
              </span>
              <span class="font-normal text-on-surface-variant truncate max-w-[190px]">${m}</span>
            </div>`:""}
          </td>
          <td class="py-2.5 px-3 text-on-surface-variant hidden sm:table-cell text-body-sm">${c}</td>
          <td class="py-2.5 px-4 sm:px-6 text-right"><span class="inline-flex items-center gap-1.5 text-[12px] font-medium ${l?"text-amber-700":"text-emerald-700"}"><span class="w-1.5 h-1.5 rounded-full ${l?"bg-amber-500":"bg-emerald-600"}"></span>${escapeHtml(a.validasi||"OK")}</span></td>
        </tr>`}).join(""):n.innerHTML='<tr><td colspan="5" class="py-6 px-6 text-center text-on-surface-variant">Belum ada peserta terdaftar yang sesuai.</td></tr>',t&&(t.textContent=`${(e||[]).length} peserta`))}function filterModalParticipants(e){const n=(e||"").toLowerCase().trim(),t=document.getElementById("modal-participant-search-clear");if(t&&t.classList.toggle("hidden",!n),!n){renderModalParticipantRows(currentModalParticipantsList);return}const a=currentModalParticipantsList.filter(r=>{const l=String(r.nama_karyawan||"").toLowerCase(),i=String(r.id_karyawan||"").toLowerCase(),s=String(r.perusahaan||"").toLowerCase(),o=String(r.departement||r.jabatan||"").toLowerCase(),c=String(r.pic_pendaftaran||r.pic||r.pic_perusahaan||"").toLowerCase(),d=String(r.validasi||"").toLowerCase();return l.includes(n)||i.includes(n)||s.includes(n)||o.includes(n)||c.includes(n)||d.includes(n)});renderModalParticipantRows(a)}function clearModalParticipantSearch(){const e=document.getElementById("modal-participant-search");e&&(e.value="",e.focus()),filterModalParticipants("")}function openTrainingDetailModal(e){currentModalJadwalId=e,document.querySelectorAll(".modal-reject-req-btn").forEach(x=>x.remove());const n=document.getElementById("training-detail-modal");if(!n)return;const t=Array.isArray(window.EXTERNAL_ITEMS)?window.EXTERNAL_ITEMS:[],a=t.find(D=>D.uid===e||D.id_jadwal===e)||(LIVE_SCHEDULES||[]).find(D=>D.id_jadwal===e)||(LIVE_SCHEDULES||[]).find(D=>D.agenda===e)||t.find(D=>D.agenda===e);if(!a){showToast("warning","Jadwal Tidak Ditemukan","Muat ulang data jadwal lalu coba lagi.");return}const r=a.source_type==="agenda_event",l=r?Number(a.kuota)||0:a.kuota!==void 0&&a.kuota!==null&&!isNaN(Number(a.kuota))?Number(a.kuota):0,i=Array.isArray(a.peserta)?a.peserta:[],s=i.length||Number(a.total_terdaftar)||(l>0?Math.max(0,l-(Number(a.sisa_kuota)||0)):0),o=l>0?Math.max(0,l-s):0,c=a.sisa_kuota!==void 0&&a.sisa_kuota!==null&&a.sisa_kuota!==""&&!isNaN(Number(a.sisa_kuota))?Math.max(0,Number(a.sisa_kuota)):o,d=l>0?Math.min(c,o):0,u=l>0?Math.min(100,Math.round(s/l*100)):0,m=isSchedulePast(a),b=!r&&l>0&&(d<=0||s>=l||/penuh/i.test(a.status)),h=document.getElementById("modal-training-title");h&&(h.textContent=a.agenda||"Detail Pelatihan");const p=document.getElementById("modal-batch-badge");p&&(a.is_request?(p.className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-extrabold text-label-sm shadow-2xs",p.textContent="TRAINING REQUEST"):(p.className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-semibold",p.textContent=a.batch||a.id_jadwal||"-"));const f=document.getElementById("modal-status-badge");if(f)if(a.is_request){const D=!!a.is_synced;f.className=D?"inline-flex items-center gap-1.5 font-bold text-emerald-950 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full":"inline-flex items-center gap-1.5 font-bold text-amber-950 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full",f.innerHTML=D?`<span class="material-symbols-outlined text-[15px] text-emerald-700">sync</span>Tersinkron dengan Jadwal Resmi (${escapeHtml(a.synced_schedule_id)})`:'<span class="w-2 h-2 rounded-full bg-amber-600 animate-pulse"></span>Belum didaftarkan Admin LnD jadwalnya'}else m?(f.className="inline-flex items-center gap-1.5 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full",f.innerHTML='<span class="w-1.5 h-1.5 rounded-full bg-slate-500"></span>Selesai Pelaksanaan'):(f.className="inline-flex items-center gap-1.5 font-semibold "+(b?"text-amber-700":"text-emerald-700"),f.innerHTML=`<span class="w-1.5 h-1.5 rounded-full ${b?"bg-amber-500":"bg-emerald-600"}"></span>${escapeHtml(b?"Kuota Penuh (Verifikasi L&amp;D)":a.status||"Buka")}`);const g=document.getElementById("modal-date-display");g&&(g.textContent=formatSmartDateRange(a.start,a.end));const y=document.getElementById("modal-hour-display");y&&(y.textContent=a.start_hour?`${a.start_hour} WIB`:"08:00 WIB (Tentatif)");const v=document.getElementById("modal-duration-display");v&&(v.textContent=formatSmartDuration(a.duration,a.start,a.end));const x=document.getElementById("modal-id-display");x&&(x.textContent=a.id_jadwal||"-");const k=document.getElementById("modal-room-display");k&&(k.textContent=a.room||"-");const w=document.getElementById("modal-pic-display");w&&(w.textContent=a.pic||"-");const _=document.getElementById("modal-description-text");_&&(_.textContent=a.deskripsi||"",_.classList.toggle("hidden",!a.deskripsi));const I=document.getElementById("modal-kpi-total");I&&(I.innerHTML=`${l} <span class="text-label-md font-normal text-on-surface-variant">Kursi</span>`);const S=document.getElementById("modal-kpi-terdaftar");S&&(S.innerHTML=`${s} <span class="text-label-md font-normal text-on-surface-variant">Peserta</span>`);const E=document.getElementById("modal-kpi-sisa");E&&(m?E.innerHTML='0 <span class="text-label-md font-normal text-slate-500 font-semibold">(Selesai)</span>':E.innerHTML=`${d} <span class="text-label-md font-normal ${b?"text-amber-700 font-semibold":"text-emerald-700"}">Kursi</span>`);const L=document.getElementById("modal-kpi-percent-badge");L&&(L.textContent=`${u}% terisi`);const B=document.getElementById("modal-bar-terisi");B&&(B.style.width=`${u}%`,B.classList.toggle("bg-slate-400",m),B.classList.toggle("bg-amber-500",!m&&b),B.classList.toggle("bg-primary",!m&&!b));const P=document.getElementById("modal-bar-keterisian-text");P&&(m?P.textContent=`${s} Peserta Terdaftar (Pelatihan Telah Selesai Dilaksanakan)`:P.textContent=`${s} Peserta Terdaftar (Kapasitas ${l} Kursi • ${b?"Kuota Penuh (Verifikasi Tim L&D)":"Sisa "+d+" Tersedia"})`);const A=document.getElementById("modal-participant-search");A&&(A.value="");const R=document.getElementById("modal-participant-search-clear");R&&R.classList.add("hidden");const $={},M={};i.forEach(D=>{const O=String(D.pic_pendaftaran||D.pic||"").trim();O&&O!=="-"&&O!=="- (-)"&&(D.id_booking&&(M[D.id_booking]=O),D.perusahaan&&D.perusahaan!=="-"&&($[D.perusahaan]=O))}),i.forEach(D=>{!D.pic_pendaftaran&&!D.pic&&(D.pic_pendaftaran=D.id_booking&&M[D.id_booking]||D.perusahaan&&$[D.perusahaan]||(a.is_request?a.pic:"")||"")}),currentModalParticipantsList=i,renderModalParticipantRows(i);const T=!a.is_request&&typeof window.isAdminAuthenticated=="function"&&window.isAdminAuthenticated(),j=document.getElementById("modal-admin-actions-bar");j&&(j.classList.toggle("hidden",!T),j.classList.toggle("flex",T));const N=a.source_type||"internal",H=a.id_jadwal||a.uid,F=document.getElementById("modal-btn-admin-edit");F&&(F.onclick=()=>{closeTrainingDetailModal(),openAdminScheduleModal("edit",H,N)});const G=document.getElementById("modal-btn-admin-duplicate");G&&(G.onclick=()=>{closeTrainingDetailModal(),openAdminScheduleModal("duplicate",H,N)});const q=document.getElementById("modal-btn-admin-delete");q&&(q.onclick=()=>{closeTrainingDetailModal(),openAdminDeleteModal(H,N,a.agenda||"")});const C=document.getElementById("modal-btn-register");C&&(C.disabled=!1,a.is_request?T&&!a.is_synced?(C.className="w-full sm:w-auto h-10 px-5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-label-md text-label-md font-bold inline-flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer",C.innerHTML='<span class="material-symbols-outlined text-[18px]">add_circle</span><span>+ Daftarkan ke Jadwal Resmi Admin LnD</span>',C.onclick=()=>{closeTrainingDetailModal(),openAdminAddFromRequest(a.id_jadwal)}):(C.className="w-full sm:w-auto h-10 px-5 rounded-xl bg-amber-100 text-amber-950 border border-amber-300 font-label-md text-label-md font-bold inline-flex items-center justify-center gap-1.5 shadow-2xs cursor-default",C.innerHTML=`<span class="material-symbols-outlined text-[18px] ${a.is_synced?"text-emerald-700":"text-amber-700"}">${a.is_synced?"verified":"pending_actions"}</span><span>${a.is_synced?"Tersinkron Jadwal Resmi":"Menunggu Penjadwalan Admin L&D"}</span>`,C.onclick=null,!a.is_synced&&typeof window.isAdminAuthenticated=="function"&&window.isAdminAuthenticated()&&(C.className="w-full sm:w-auto h-10 px-5 rounded-xl bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md font-bold inline-flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer",C.innerHTML='<span class="material-symbols-outlined text-[18px]">task_alt</span><span>Setujui & Jadwalkan</span>',C.onclick=()=>{closeTrainingDetailModal(),openAssignDateModal(a.id_jadwal)},(()=>{const R=document.createElement("button");R.type="button",R.className="modal-reject-req-btn w-full sm:w-auto h-10 px-4 rounded-xl border border-red-300 bg-red-50 hover:bg-red-100 text-red-800 font-label-md text-label-md font-bold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer",R.innerHTML='<span class="material-symbols-outlined text-[18px]">block</span><span>Tolak Request</span>',R.onclick=()=>{closeTrainingDetailModal(),openRejectRequestModal(a.id_jadwal)},C.after(R)})())):(m||isRegClosedOnly(a))?(C.className="w-full sm:w-auto h-10 px-5 rounded-xl bg-surface-container-highest text-on-surface hover:bg-primary hover:text-on-primary font-label-md text-label-md font-semibold inline-flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer",C.innerHTML='<span class="material-symbols-outlined text-[18px]">add_circle</span><span>Ajukan Request Jadwal Baru</span>',C.onclick=()=>{closeTrainingDetailModal(),switchPageTab("pendaftaran"),setCustomTrainingMode(!0,a.agenda||"")}):(C.className="w-full sm:w-auto h-10 px-5 rounded-xl bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md font-semibold inline-flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer",b?C.innerHTML='<span class="material-symbols-outlined text-[18px]">how_to_reg</span><span>Daftarkan Peserta (Verifikasi L&amp;D)</span>':C.innerHTML='<span class="material-symbols-outlined text-[18px]">how_to_reg</span><span>Daftarkan Peserta</span>',C.onclick=()=>selectScheduleAndRegister(a.id_jadwal,a.agenda))),n.classList.remove("hidden")}function openAdminAddFromRequest(e){if(typeof openAssignDateModal=="function"){openAssignDateModal(e);return}const n=(LIVE_WAITING_LIST||[]).find(t=>t.id_jadwal===e)||(LIVE_SCHEDULES||[]).find(t=>t.id_jadwal===e);n&&typeof openAdminScheduleModal=="function"&&(openAdminScheduleModal("add",null,"internal",n.start&&!n.is_tentative?n.start:""),setTimeout(()=>{const t=document.getElementById("admin-input-agenda");t&&(t.value=n.agenda||"");const a=document.getElementById("admin-input-deskripsi");a&&(a.value=`Diakomodasi dari Training Request (${n.id_jadwal}) yang diajukan oleh ${n.pic} (${n.peserta?n.peserta.length:0} peserta).`);const r=document.getElementById("admin-input-room");r&&n.room&&!/tentatif/i.test(n.room)&&(r.value=n.room);const l=document.getElementById("admin-input-kuota");l&&(l.value=Math.max(20,(n.peserta?n.peserta.length:0)+10));const i=document.getElementById("admin-input-start-date");i&&n.start&&!n.is_tentative&&(i.value=n.start);const s=document.getElementById("admin-input-end-date");s&&n.end&&!n.is_tentative&&(s.value=n.end)},120))}window.openAdminAddFromRequest=openAdminAddFromRequest,window.LIVE_WAITING_LIST=[],window.currentWaitingListFilter="pending";function openWaitingListModal(){const e=document.getElementById("waiting-list-modal");e&&(e.classList.remove("hidden"),renderWaitingListItems())}window.openWaitingListModal=openWaitingListModal;function closeWaitingListModal(){const e=document.getElementById("waiting-list-modal");e&&e.classList.add("hidden")}window.closeWaitingListModal=closeWaitingListModal;function getWaitingListItemTimingState(e){if(!e.is_synced)return{code:"unscheduled",label:"Belum Terjadwal",sublabel:"Menunggu Tanggal Admin",badgeClass:"bg-amber-50 text-amber-900 border-amber-300",icon:"hourglass_top",dotColor:"bg-amber-500",officialDateStr:""};const n=(window.LIVE_SCHEDULES||[]).find(u=>u.id_jadwal&&u.id_jadwal.toLowerCase()===(e.synced_schedule_id||"").toLowerCase()),t=n||e;let a=null,r=null;if(typeof itemRange=="function"){const u=itemRange(t);u&&u[0]&&(a=u[0],r=u[1]||u[0])}if(!a&&t.start){const u=typeof parseDateString=="function"?parseDateString(t.start):null;u&&(a=new Date(u.year,u.month-1,u.day,0,0,0))}if(!r&&(t.end||t.start)){const u=typeof parseDateString=="function"?parseDateString(t.end||t.start):null;u&&(r=new Date(u.year,u.month-1,u.day,23,59,59))}const l=new Date;l.setHours(0,0,0,0);const i=r?new Date(r.getTime()):null;i&&i.setHours(23,59,59,999);const s=a?new Date(a.getTime()):null;s&&s.setHours(0,0,0,0);const o=i&&i.getTime()<l.getTime()||n&&typeof isSchedulePast=="function"&&isSchedulePast(n),c=s&&i&&l.getTime()>=s.getTime()&&l.getTime()<=i.getTime(),d=t.start?t.end&&t.end!==t.start?`${t.start} s/d ${t.end}`:t.start:"";return o?{code:"past",label:"Terjadwal • Sudah Berlangsung",sublabel:"Sudah Selesai",badgeClass:"bg-slate-100 text-slate-700 border-slate-300",icon:"event_busy",dotColor:"bg-slate-500",officialDateStr:d}:c?{code:"running",label:"Terjadwal • Sedang Berlangsung",sublabel:"Hari Ini",badgeClass:"bg-blue-50 text-blue-900 border-blue-300",icon:"timelapse",dotColor:"bg-blue-500",officialDateStr:d}:{code:"upcoming",label:"Terjadwal • Belum Berlangsung",sublabel:"Akan Datang",badgeClass:"bg-emerald-50 text-emerald-900 border-emerald-300",icon:"event_available",dotColor:"bg-emerald-500",officialDateStr:d}}window.getWaitingListItemTimingState=getWaitingListItemTimingState;function setWaitingListFilter(e){window.currentWaitingListFilter=e||"all",["all","pending","scheduled","upcoming","past"].forEach(n=>{const t=document.getElementById("wl-filter-"+n);if(t)if(n===window.currentWaitingListFilter){t.className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap bg-amber-600 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1";const a=t.querySelector("span:last-child");a&&(a.className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]")}else{t.className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low border border-outline-variant/50 transition-colors cursor-pointer flex items-center gap-1";const a=t.querySelector("span:last-child");a&&(a.className="px-1.5 py-0.2 rounded-full bg-outline-variant/40 text-[10px]")}}),renderWaitingListItems()}window.setWaitingListFilter=setWaitingListFilter;function filterWaitingList(){renderWaitingListItems();const e=(document.getElementById("waiting-list-search")?.value||"").trim(),n=document.getElementById("waiting-list-search-clear");n&&n.classList.toggle("hidden",!e)}window.filterWaitingList=filterWaitingList;function clearWaitingListSearch(){const e=document.getElementById("waiting-list-search");e&&(e.value=""),filterWaitingList()}window.clearWaitingListSearch=clearWaitingListSearch;function refreshWaitingListData(){showToast("info","Memuat Ulang","Memperbarui data Waiting List dari server..."),typeof fetchAllDatabaseData=="function"&&fetchAllDatabaseData().then(()=>{renderWaitingListItems()})}window.refreshWaitingListData=refreshWaitingListData;function updateWaitingListUI(){const e=window.LIVE_WAITING_LIST||[],n=e.filter(k=>!k.is_synced),t=e.filter(k=>!!k.is_synced),a=t.filter(k=>{const w=typeof getWaitingListItemTimingState=="function"?getWaitingListItemTimingState(k):{code:"upcoming"};return w.code==="upcoming"||w.code==="running"}),r=t.filter(k=>(typeof getWaitingListItemTimingState=="function"?getWaitingListItemTimingState(k):{code:"past"}).code==="past"),l=n.length,i=e.length,s=t.length,o=a.length,c=r.length,d=document.getElementById("waiting-list-count-badge");d&&(d.textContent=l,d.className=l>0?"px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-600 text-white leading-none animate-pulse":"px-2 py-0.5 text-[11px] font-bold rounded-full bg-surface-container-high text-on-surface-variant leading-none");const u=document.getElementById("home-waiting-list-badge");u&&(u.textContent=l,u.classList.toggle("hidden",l===0));const m=document.getElementById("header-admin-wl-badge");m&&(m.textContent=l);const b=document.getElementById("ribbon-waiting-list-count");b&&(b.textContent=l);const h=document.getElementById("waiting-list-modal-header-badge");h&&(h.textContent=`${l} Menunggu Tanggal`,h.className=l>0?"px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-600 text-white animate-pulse":"px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white");const p=document.getElementById("wl-count-pending");p&&(p.textContent=l);const f=document.getElementById("wl-count-all");f&&(f.textContent=i);const g=document.getElementById("wl-count-scheduled");g&&(g.textContent=s);const y=document.getElementById("wl-count-upcoming");y&&(y.textContent=o);const v=document.getElementById("wl-count-past");v&&(v.textContent=c);const x=document.getElementById("waiting-list-modal");x&&!x.classList.contains("hidden")&&renderWaitingListItems()}window.updateWaitingListUI=updateWaitingListUI;function renderWaitingListItems(){const e=document.getElementById("waiting-list-items-container");if(!e)return;const n=window.LIVE_WAITING_LIST||[],t=(document.getElementById("waiting-list-search")?.value||"").toLowerCase().trim(),a=window.currentWaitingListFilter||"all";let r=n.filter(i=>{const s=typeof getWaitingListItemTimingState=="function"?getWaitingListItemTimingState(i):{code:i.is_synced?"upcoming":"unscheduled"};if(a==="pending"&&i.is_synced||a==="scheduled"&&!i.is_synced||a==="upcoming"&&(!i.is_synced||s.code==="past")||a==="past"&&(!i.is_synced||s.code!=="past"))return!1;if(t){const o=(i.agenda||"").toLowerCase(),c=(i.pic||"").toLowerCase(),d=(i.id_jadwal||"").toLowerCase(),u=(i.synced_schedule_id||"").toLowerCase(),m=Array.isArray(i.peserta)&&i.peserta.some(b=>(b.nama_karyawan||"").toLowerCase().includes(t)||(b.id_karyawan||"").toLowerCase().includes(t)||(b.departement||"").toLowerCase().includes(t)||(b.perusahaan||"").toLowerCase().includes(t));if(!o.includes(t)&&!c.includes(t)&&!d.includes(t)&&!u.includes(t)&&!m)return!1}return!0});if(r.length===0){let i=t?"Pencarian Tidak Ditemukan":"Tidak Ada Data",s=t?`Tidak ada data waiting list yang cocok dengan kata kunci "${t}".`:"Belum ada data permintaan pada kategori ini.",o="hourglass_empty";t||(a==="pending"?(i="Tidak Ada Request Belum Terjadwal",s="Semua pengajuan pelatihan telah dijadwalkan oleh Admin L&D, atau belum ada permohonan baru.",o="task_alt"):a==="scheduled"?(i="Belum Ada Permintaan yang Terjadwal",s="Permintaan yang telah diberikan tanggal resmi oleh Admin akan tampil di sini.",o="event_available"):a==="upcoming"?(i="Tidak Ada Pelatihan yang Belum Berlangsung",s="Belum ada pelatihan terjadwal yang akan datang atau sedang berlangsung hari ini.",o="event_available"):a==="past"&&(i="Belum Ada Pelatihan yang Sudah Berlangsung",s="Belum ada riwayat pelatihan permintaan yang telah selesai diselenggarakan.",o="history")),e.innerHTML=`
        <div class="py-12 px-4 flex flex-col items-center justify-center text-center gap-3 bg-surface-container-lowest rounded-2xl border border-outline-variant/40">
          <div class="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
            <span class="material-symbols-outlined text-[32px]">${o}</span>
          </div>
          <div class="max-w-md">
            <h4 class="font-title-md text-title-md font-bold text-on-surface">${i}</h4>
            <p class="font-body-sm text-body-sm text-on-surface-variant mt-1">${s}</p>
          </div>
          ${t?`
            <button type="button" onclick="clearWaitingListSearch()" class="mt-2 h-8 px-3 rounded-lg border border-outline-variant text-primary font-semibold text-xs hover:bg-surface-container-low transition-colors">
              Reset Pencarian
            </button>
          `:`
            <button type="button" onclick="closeWaitingListModal(); switchPageTab('pendaftaran'); setTimeout(() => setCustomTrainingMode(true), 150);" class="mt-2 h-9 px-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-md text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer">
              <span class="material-symbols-outlined text-[17px]">add_circle</span>
              <span>Buat Permintaan Jadwal Baru</span>
            </button>
          `}
        </div>
      `;return}const l=typeof window.isAdminAuthenticated=="function"&&window.isAdminAuthenticated();e.innerHTML=r.map((i,s)=>{const o=!!i.is_synced,c=typeof getWaitingListItemTimingState=="function"?getWaitingListItemTimingState(i):{code:o?"upcoming":"unscheduled",label:o?"Terjadwal":"Belum Terjadwal",sublabel:"",icon:o?"event_available":"hourglass_top",badgeClass:o?"bg-emerald-50 text-emerald-800 border-emerald-300":"bg-amber-50 text-amber-900 border-amber-300",officialDateStr:""},d=Array.isArray(i.peserta)?i.peserta.length:0,u=i.startRaw||i.start?`${i.startRaw||i.start}${i.endRaw&&i.endRaw!==i.startRaw?" s/d "+i.endRaw:""}`:"Tentatif (Menunggu Admin)",m=escapeHtml(i.id_jadwal||"REQ-"+s),b=escapeHtml(i.agenda||"Pelatihan Permintaan Khusus"),h=escapeHtml(i.pic||"PIC Pemohon"),p=escapeHtml(i.room||"Gold Room (Tentatif)"),f=escapeHtml(i.timestamp||"-"),g=escapeHtml(i.synced_schedule_id||"");return`
        <div class="bg-surface-container-lowest rounded-2xl border ${o?c.code==="past"?"border-slate-300/80 shadow-xs":"border-emerald-300/80 shadow-xs":"border-amber-300/80 shadow-xs"} p-4 sm:p-5 flex flex-col gap-3.5 transition-all hover:shadow-md">
          
          <!-- CARD HEADER -->
          <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div class="flex items-start gap-3 min-w-0">
              <div class="w-10 h-10 rounded-xl ${o?c.code==="past"?"bg-slate-100 text-slate-700 border border-slate-200":"bg-emerald-50 text-emerald-700 border border-emerald-200":"bg-amber-50 text-amber-700 border border-amber-200"} flex items-center justify-center shrink-0 mt-0.5">
                <span class="material-symbols-outlined text-[22px]">${c.icon}</span>
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap mb-1">
                  <span class="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-surface-container text-on-surface-variant border border-outline-variant/60">${m}</span>
                  ${o?`
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-bold border inline-flex items-center gap-1 ${c.badgeClass}">
                      <span class="material-symbols-outlined text-[14px]">${c.icon}</span>
                      <span>Terjadwal (${g}) • ${c.sublabel}</span>
                    </span>
                  `:`
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                      Belum Terjadwal (Menunggu Admin)
                    </span>
                  `}
                </div>
                <h3 class="font-title-md text-title-md font-bold text-on-surface leading-snug">${b}</h3>
              </div>
            </div>

            <!-- ACTION BUTTONS -->
            <div class="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-outline-variant/30">
              ${o?`
                <button type="button" onclick="editScheduledTrainingFromWaitingList('${g||m}')" class="flex-1 sm:flex-initial h-9 px-3.5 rounded-xl border border-outline-variant bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-md text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer" title="Ubah tanggal, ruangan, kuota, jam, atau status jadwal ini">
                  <span class="material-symbols-outlined text-[17px] text-primary">edit_calendar</span>
                  <span>Ubah Jadwal</span>
                </button>
                <button type="button" onclick="viewScheduledTrainingInCalendar('${g||m}')" class="flex-1 sm:flex-initial h-9 px-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-label-md text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer" title="Buka jadwal resmi di Kalender">
                  <span class="material-symbols-outlined text-[17px]">calendar_month</span>
                  <span>Lihat di Kalender</span>
                </button>
              `:`
                <button type="button" onclick="openAssignDateModal('${m}')" class="w-full sm:w-auto h-9 px-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-md text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer" title="Berikan tanggal resmi untuk pelatihan ini">
                  <span class="material-symbols-outlined text-[17px]">calendar_add_on</span>
                  <span>${l?"Setujui & Jadwalkan":"Jadwalkan (Admin)"}</span>
                </button>${l?`<button type="button" onclick="openRejectRequestModal('${m}')" class="w-full sm:w-auto h-9 px-4 rounded-xl border border-red-300 bg-red-50 hover:bg-red-100 text-red-800 font-label-md text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer" title="Tolak pengajuan pelatihan ini"><span class="material-symbols-outlined text-[17px]">block</span><span>Tolak</span></button>`:""}
              `}
            </div>
          </div>

          <!-- CARD DETAILS GRID -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 p-3 rounded-xl bg-surface-container-low/60 border border-outline-variant/40 text-xs">
            <div>
              <span class="text-on-surface-variant block text-[11px]">PIC Pemohon / Pengaju:</span>
              <span class="font-semibold text-on-surface inline-flex items-center gap-1 mt-0.5">
                <span class="material-symbols-outlined text-[14px] text-primary">person</span>
                ${h}
              </span>
            </div>
            <div>
              <span class="text-on-surface-variant block text-[11px]">${o?"Tanggal Pelaksanaan Resmi:":"Usulan Tanggal Pelaksanaan:"}</span>
              <span class="font-semibold text-on-surface inline-flex items-center gap-1 mt-0.5">
                <span class="material-symbols-outlined text-[14px] ${o?c.code==="past"?"text-slate-500":"text-emerald-700":"text-amber-700"}">${o?"event":"date_range"}</span>
                <span>${o&&c.officialDateStr?c.officialDateStr:u}</span>
              </span>
              ${o&&u&&u!=="Tentatif (Menunggu Admin)"&&u!==c.officialDateStr?`
                <span class="text-[10px] text-on-surface-variant block mt-0.5">Usulan: ${u}</span>
              `:""}
            </div>
            <div>
              <span class="text-on-surface-variant block text-[11px]">Calon Peserta Terdaftar:</span>
              <span class="font-semibold text-on-surface inline-flex items-center gap-1 mt-0.5">
                <span class="material-symbols-outlined text-[14px] text-primary">groups</span>
                ${d} Orang Peserta
              </span>
            </div>
            <div>
              <span class="text-on-surface-variant block text-[11px]">Lokasi Ruangan:</span>
              <span class="font-semibold text-on-surface inline-flex items-center gap-1 mt-0.5 truncate">
                <span class="material-symbols-outlined text-[14px] text-primary">meeting_room</span>
                ${p}
              </span>
            </div>
          </div>
              <span class="font-semibold text-on-surface inline-flex items-center gap-1 mt-0.5 truncate">
                <span class="material-symbols-outlined text-[14px] text-primary">meeting_room</span>
                ${p}
              </span>
            </div>
          </div>

          <!-- EXTRA ROW: DOKUMEN & TIMESTAMP & PARTICIPANT TOGGLE -->
          <div class="flex flex-wrap items-center justify-between gap-2.5 pt-1 text-xs">
            <div class="flex items-center gap-3 text-on-surface-variant flex-wrap">
              <span class="inline-flex items-center gap-1">
                <span class="material-symbols-outlined text-[15px] text-outline">history</span>
                Diajukan: ${f}
              </span>
              ${i.link_dokumen?`
                <a href="${escapeHtml(i.link_dokumen)}" target="_blank" rel="noopener noreferrer" class="font-semibold text-primary hover:underline inline-flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">
                  <span class="material-symbols-outlined text-[14px]">attachment</span>
                  <span>Lampiran Dokumen</span>
                </a>
              `:""}
            </div>

            <button type="button" onclick="toggleWaitingListParticipants('${m}')" class="h-8 px-3 rounded-lg border border-outline-variant/60 bg-surface-container-lowest hover:bg-surface-container-low text-on-surface font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer">
              <span class="material-symbols-outlined text-[16px] text-primary">groups</span>
              <span>Lihat Peserta (${d})</span>
              <span id="wl-icon-toggle-${m}" class="material-symbols-outlined text-[16px] transition-transform duration-200">expand_more</span>
            </button>
          </div>

          <!-- COLLAPSIBLE PARTICIPANT LIST -->
          <div id="wl-participants-${m}" class="hidden pt-3 border-t border-outline-variant/40 animate-in fade-in duration-150">
            <div class="overflow-x-auto rounded-xl border border-outline-variant/50">
              <table class="w-full text-left text-xs">
                <thead class="bg-surface-container-low text-on-surface-variant border-b border-outline-variant/40">
                  <tr>
                    <th class="py-2 px-3 font-semibold w-10">No</th>
                    <th class="py-2 px-3 font-semibold">NIK / ID</th>
                    <th class="py-2 px-3 font-semibold">Nama Peserta</th>
                    <th class="py-2 px-3 font-semibold">Departemen</th>
                    <th class="py-2 px-3 font-semibold">Jabatan</th>
                    <th class="py-2 px-3 font-semibold">Perusahaan</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-outline-variant/30 bg-surface-container-lowest">
                  ${d>0?i.peserta.map((y,v)=>`
                    <tr class="hover:bg-surface-container-low/50">
                      <td class="py-2 px-3 text-on-surface-variant">${v+1}</td>
                      <td class="py-2 px-3 font-mono font-medium text-on-surface">${escapeHtml(y.id_karyawan||"-")}</td>
                      <td class="py-2 px-3 font-bold text-on-surface">${escapeHtml(y.nama_karyawan||"-")}</td>
                      <td class="py-2 px-3 text-on-surface-variant">${escapeHtml(y.departement||"-")}</td>
                      <td class="py-2 px-3 text-on-surface-variant">${escapeHtml(y.jabatan||"-")}</td>
                      <td class="py-2 px-3 text-on-surface-variant">${escapeHtml(y.perusahaan||"-")}</td>
                    </tr>
                  `).join(""):`
                    <tr>
                      <td colspan="6" class="py-3 px-3 text-center text-on-surface-variant italic">Belum ada rincian peserta.</td>
                    </tr>
                  `}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      `}).join("")}window.renderWaitingListItems=renderWaitingListItems;function toggleWaitingListParticipants(e){const n=document.getElementById(`wl-participants-${e}`),t=document.getElementById(`wl-icon-toggle-${e}`);if(!n)return;const a=n.classList.contains("hidden");n.classList.toggle("hidden",!a),t&&(t.style.transform=a?"rotate(180deg)":"rotate(0deg)")}window.toggleWaitingListParticipants=toggleWaitingListParticipants;function openAssignDateModal(e){if(!(typeof window.isAdminAuthenticated=="function"&&window.isAdminAuthenticated())){window._onAdminLoginSuccess=function(){openAssignDateModal(e)},typeof window.openAdminLoginModal=="function"&&window.openAdminLoginModal(),showToast("info","Autentikasi Admin","Silakan login Admin Tim L&D untuk memberikan tanggal dan menjadwalkan pelatihan ini.");return}const a=(window.LIVE_WAITING_LIST||[]).find(g=>g.id_jadwal===e);if(!a){showToast("warning","Tidak Ditemukan","Permintaan pelatihan tidak ditemukan.");return}document.getElementById("assign-date-req-id").value=a.id_jadwal,document.getElementById("assign-date-agenda").value=a.agenda||"",document.getElementById("assign-date-display-agenda").textContent=a.agenda||"Pelatihan",document.getElementById("assign-date-display-pic").textContent=a.pic||"-";const r=Array.isArray(a.peserta)?a.peserta.length:0;document.getElementById("assign-date-display-peserta").textContent=`${r} Calon Peserta`;const l=a.startRaw||a.start?`${a.startRaw||a.start}${a.endRaw&&a.endRaw!==a.startRaw?" s/d "+a.endRaw:""}`:"Tentatif";document.getElementById("assign-date-display-proposed").textContent=l;const i=new Date().toISOString().split("T")[0];let s=a.start&&!a.is_tentative?a.start:i,o=a.end&&!a.is_tentative?a.end:s;/^\d{4}-\d{2}-\d{2}$/.test(s)||(s=i),/^\d{4}-\d{2}-\d{2}$/.test(o)||(o=s);const c=document.getElementById("assign-date-start"),d=document.getElementById("assign-date-end");c&&(c.value=s),d&&(d.value=o);const u=document.getElementById("assign-date-room");u&&(u.value=a.room&&!/tentatif/i.test(a.room)?a.room:"Gold Room 2 & 3");const m=document.getElementById("assign-date-hour");m&&(m.value=a.start_hour?`${a.start_hour} WIB`:"08:00 WIB");const b=document.getElementById("assign-date-kuota");b&&(b.value=Math.max(25,r+5));const h=document.getElementById("assign-date-batch");h&&(h.value="Batch Khusus");const p=document.getElementById("assign-date-deskripsi");p&&(p.value=`Diakomodasi dari Waiting List (${a.id_jadwal}) yang diajukan oleh PIC ${a.pic} (${r} peserta).`),calculateAssignDateDuration();const f=document.getElementById("admin-assign-date-modal");f&&f.classList.remove("hidden")}window.openAssignDateModal=openAssignDateModal;function closeAdminAssignDateModal(){const e=document.getElementById("admin-assign-date-modal");e&&e.classList.add("hidden")}window.closeAdminAssignDateModal=closeAdminAssignDateModal;function handleAssignDateChange(){const e=document.getElementById("assign-date-start"),n=document.getElementById("assign-date-end"),t=e?e.value:"";let a=n?n.value:"";t&&!a&&n&&(n.value=t,a=t),t&&a&&a<t&&(n&&(n.value=t),a=t),calculateAssignDateDuration()}window.handleAssignDateChange=handleAssignDateChange;function calculateAssignDateDuration(){const e=document.getElementById("assign-date-start")?.value||"",n=document.getElementById("assign-date-end")?.value||e,t=document.getElementById("assign-date-duration-badge");if(!t)return;if(!e){t.textContent="1 Hari (8 Jam)";return}let a=1;try{const r=new Date(e+"T00:00:00"),l=new Date((n||e)+"T00:00:00");a=Math.max(1,Math.round((l-r)/864e5)+1)}catch{a=1}t.textContent=`${a} Hari (${a*8} Jam)`}window.calculateAssignDateDuration=calculateAssignDateDuration;async function submitAssignDateToWaitingList(e){if(e&&e.preventDefault(),!(typeof window.isAdminAuthenticated=="function"&&window.isAdminAuthenticated())){typeof window.openAdminLoginModal=="function"&&window.openAdminLoginModal();return}const t=document.getElementById("assign-date-req-id")?.value||"",a=document.getElementById("assign-date-agenda")?.value||"",r=document.getElementById("assign-date-start")?.value||"",l=document.getElementById("assign-date-end")?.value||r,i=document.getElementById("assign-date-hour")?.value||"08:00",s=document.getElementById("assign-date-room")?.value||"Gold Room 2 & 3",o=document.getElementById("assign-date-batch")?.value||"Batch Khusus",c=parseInt(document.getElementById("assign-date-kuota")?.value,10)||25,d=document.getElementById("assign-date-status")?.value||"Buka",u=document.getElementById("assign-date-pic")?.value||"Tim L&D Pani Gold Project",m=document.getElementById("assign-date-deskripsi")?.value||"";if(!r){showToast("warning","Validasi Tanggal","Tanggal Mulai pelatihan wajib diisi.");return}let b=1;try{const _=new Date(r+"T00:00:00"),I=new Date(l+"T00:00:00");b=Math.max(1,Math.round((I-_)/864e5)+1)}catch{b=1}const h=b*8,p=document.getElementById("assign-date-submit-btn"),f=document.getElementById("assign-date-submit-text");p&&(p.disabled=!0),f&&(f.textContent="Menyetujui & Menerbitkan Jadwal...");const g=r.replace(/-/g,""),y=Math.floor(100+Math.random()*900),x={category:"internal",id_jadwal:`TRN-${g}-${y}`,original_id:"",original_agenda:a,agenda:a,batch:o,start:r,end:l,start_hour:i,duration_day:String(b),duration_hour:String(h),kuota:c,sisa_kuota:c,room:s,pic:u,status:d,deskripsi:m,sync_request_id:t},w={action:"admin_add_schedule",admin_username:window._adminState&&window._adminState.username||"admin",sync_request_id:t,schedule:x};try{const I=await(await fetch(API_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(w)})).json();if(I&&I.status==="success"){const S=I.schedule||x,E=typeof _buildNormalizedItemFromForm=="function"?_buildNormalizedItemFromForm(S,x,null):S,L=(window.LIVE_WAITING_LIST||[]).find(B=>B.id_jadwal===t);L&&(L.is_synced=!0,L.synced_schedule_id=E.id_jadwal,L.status_lnd=`Tersinkron dengan Jadwal Resmi (${E.id_jadwal})`,L.status=L.status_lnd,Array.isArray(L.peserta)&&L.peserta.length>0&&(E.peserta=L.peserta,E.total_terdaftar=L.peserta.length,E.sisa_kuota=Math.max(0,E.kuota-E.total_terdaftar))),typeof _recordOverride=="function"&&_recordOverride({type:"upsert",scope:"internal",keys:[E.id_jadwal,E.uid].filter(Boolean),item:E}),typeof _applyLivePatchToArrays=="function"?_applyLivePatchToArrays("internal","upsert",E,[E.id_jadwal]):Array.isArray(window.LIVE_SCHEDULES)&&(window.LIVE_SCHEDULES.push(E),typeof sortSchedulesChronologically=="function"&&(window.LIVE_SCHEDULES=sortSchedulesChronologically(window.LIVE_SCHEDULES)),typeof renderDynamicListView=="function"&&renderDynamicListView(window.LIVE_SCHEDULES),typeof renderCalendar=="function"&&renderCalendar()),closeAdminAssignDateModal(),updateWaitingListUI(),renderWaitingListItems(),showToast("success","Request Disetujui!",`Pelatihan "${a}" berhasil ditetapkan tanggalnya (${r}) dan kini tampil di Kalender.`),typeof fetchAllDatabaseData=="function"&&fetchAllDatabaseData()}else showToast("error","Gagal Menjadwalkan",I?I.message:"Terjadi kesalahan sistem.")}catch(_){console.error(_),showToast("error","Koneksi Gagal","Gagal menghubungi server Google Sheets.")}finally{p&&(p.disabled=!1),f&&(f.textContent="Setujui & Masukkan ke Kalender")}}window.submitAssignDateToWaitingList=submitAssignDateToWaitingList;function openRejectRequestModal(e){if(!(typeof window.isAdminAuthenticated=="function"&&window.isAdminAuthenticated())){window._onAdminLoginSuccess=function(){openRejectRequestModal(e)},typeof window.openAdminLoginModal=="function"&&window.openAdminLoginModal(),showToast("info","Autentikasi Admin","Silakan login Admin Tim L&D untuk menolak request pelatihan.");return}const n=(window.LIVE_WAITING_LIST||[]).find(t=>t.id_jadwal===e);if(!n){showToast("warning","Tidak Ditemukan","Permintaan pelatihan tidak ditemukan.");return}document.getElementById("reject-req-id").value=n.id_jadwal,document.getElementById("reject-req-agenda").textContent=n.agenda||"Pelatihan",document.getElementById("reject-req-peserta").textContent=Array.isArray(n.peserta)?n.peserta.length:0,document.getElementById("reject-req-pic").textContent=n.pic||"-",document.getElementById("reject-req-reason").value="",document.getElementById("reject-req-password").value="";const a=document.getElementById("admin-reject-request-modal");a&&a.classList.remove("hidden")}window.openRejectRequestModal=openRejectRequestModal;function closeRejectRequestModal(){const e=document.getElementById("admin-reject-request-modal");e&&e.classList.add("hidden");const n=document.getElementById("reject-req-password");n&&(n.value="")}window.closeRejectRequestModal=closeRejectRequestModal;async function submitRejectRequest(e){if(e&&e.preventDefault(),!(typeof window.isAdminAuthenticated=="function"&&window.isAdminAuthenticated())){typeof window.openAdminLoginModal=="function"&&window.openAdminLoginModal();return}const n=document.getElementById("reject-req-id")?.value||"",t=(document.getElementById("reject-req-reason")?.value||"").trim(),a=(document.getElementById("reject-req-password")?.value||"").trim();if(!a){showToast("warning","Password Diperlukan","Masukkan password admin untuk konfirmasi penolakan.");return}const r=document.getElementById("reject-req-submit-btn"),l=document.getElementById("reject-req-submit-text");r&&(r.disabled=!0),l&&(l.textContent="Memproses...");try{const i=await(await fetch(API_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action:"admin_reject_request",username:window._adminState&&window._adminState.username||"admin",password:a,request_id:n,reason:t})})).json();if(i&&i.status==="success"){window.LIVE_WAITING_LIST=(window.LIVE_WAITING_LIST||[]).filter(s=>s.id_jadwal!==n);for(const s of[LIVE_SCHEDULES,fetchedJadwalList])if(Array.isArray(s))for(let o=s.length-1;o>=0;o--)s[o]&&s[o].is_request&&s[o].id_jadwal===n&&s.splice(o,1);try{localStorage.removeItem("mgr_swr_v1")}catch{}closeRejectRequestModal(),typeof updateWaitingListUI=="function"&&updateWaitingListUI(),typeof renderWaitingListItems=="function"&&renderWaitingListItems(),typeof renderDynamicListView=="function"&&renderDynamicListView(LIVE_SCHEDULES),typeof renderCalendar=="function"&&renderCalendar(),typeof renderHome=="function"&&renderHome(),showToast("success","Request Ditolak","Request pelatihan telah ditolak dan ditandai di sheet Data Pendaftaran.")}else showToast("error","Gagal Menolak",i?i.message:"Terjadi kesalahan sistem.")}catch(i){console.error(i),showToast("error","Koneksi Gagal","Gagal menghubungi server Google Sheets.")}finally{r&&(r.disabled=!1),l&&(l.textContent="Tolak Request")}}window.submitRejectRequest=submitRejectRequest;function viewScheduledTrainingInCalendar(e){closeWaitingListModal(),typeof switchPageTab=="function"&&switchPageTab("jadwal"),setTimeout(()=>{const n=(window.LIVE_WAITING_LIST||[]).find(r=>r.id_jadwal&&r.id_jadwal.toLowerCase()===String(e).toLowerCase()||r.synced_schedule_id&&r.synced_schedule_id.toLowerCase()===String(e).toLowerCase()),t=n&&n.synced_schedule_id||e,a=(LIVE_SCHEDULES||[]).find(r=>r.id_jadwal&&r.id_jadwal.toLowerCase()===String(t).toLowerCase());if(a&&a.start){const r=typeof parseDateString=="function"?parseDateString(a.start):null;r&&typeof currentYear<"u"&&(currentYear=r.year,currentMonth=r.month-1,typeof updateMonthPicker=="function"&&updateMonthPicker(),typeof renderCalendar=="function"&&renderCalendar())}typeof openTrainingDetailModal=="function"&&openTrainingDetailModal(t)},200)}window.viewScheduledTrainingInCalendar=viewScheduledTrainingInCalendar;function editScheduledTrainingFromWaitingList(e){if(!(typeof window.isAdminAuthenticated=="function"&&window.isAdminAuthenticated())){window._onAdminLoginSuccess=function(){editScheduledTrainingFromWaitingList(e)},typeof window.openAdminLoginModal=="function"&&window.openAdminLoginModal(),showToast("info","Autentikasi Admin","Silakan login Admin Tim L&D untuk merubah jadwal pelatihan ini.");return}closeWaitingListModal();const t=(window.LIVE_WAITING_LIST||[]).find(s=>s.id_jadwal&&s.id_jadwal.toLowerCase()===String(e).toLowerCase()||s.synced_schedule_id&&s.synced_schedule_id.toLowerCase()===String(e).toLowerCase()),a=t&&t.synced_schedule_id||e,r=typeof _findScheduleItem=="function"?_findScheduleItem(a,"internal"):(window.LIVE_SCHEDULES||[]).find(s=>s.id_jadwal&&s.id_jadwal.toLowerCase()===String(a).toLowerCase()),l=r&&(r.source_type||r.category)||"internal",i=r&&(r.id_jadwal||r.uid)||a;typeof openAdminScheduleModal=="function"?openAdminScheduleModal("edit",i,l):showToast("warning","Fitur Belum Siap","Modal edit jadwal belum dapat dibuka.")}window.editScheduledTrainingFromWaitingList=editScheduledTrainingFromWaitingList;function closeTrainingDetailModal(){const e=document.getElementById("training-detail-modal");e&&e.classList.add("hidden")}window.closeTrainingDetailModal=closeTrainingDetailModal;function openHelpCenterModal(){const e=document.getElementById("help-center-modal");e&&e.classList.remove("hidden")}window.openHelpCenterModal=openHelpCenterModal;function closeHelpCenterModal(){const e=document.getElementById("help-center-modal");e&&e.classList.add("hidden")}window.closeHelpCenterModal=closeHelpCenterModal;function openUserProfileModal(){const e=document.getElementById("user-profile-modal");e&&e.classList.remove("hidden")}window.openUserProfileModal=openUserProfileModal;function closeUserProfileModal(){const e=document.getElementById("user-profile-modal");e&&e.classList.add("hidden")}window.closeUserProfileModal=closeUserProfileModal;function showToast(e,n,t){const a=document.getElementById("toast-container");if(!a)return;const r=document.createElement("div"),l=e==="success",i=e==="warning",s=l?"bg-emerald-50 border-emerald-300 text-emerald-950":i?"bg-amber-50 border-amber-300 text-amber-950":"bg-surface-container-lowest border-outline-variant text-on-surface",o=l?"check_circle":i?"warning":"info",c=l?"text-emerald-700":i?"text-amber-700":"text-primary";r.className=`flex items-start gap-3 p-4 rounded-xl border shadow-lg ${s} transition-all duration-300 animate-in fade-in slide-in-from-top-4 max-w-sm`,r.innerHTML=`
      <span class="material-symbols-outlined ${c} text-[22px] shrink-0 mt-0.5">${o}</span>
      <div class="flex flex-col gap-0.5 flex-1">
        <span class="font-title-sm text-title-sm font-bold leading-tight">${escapeHtml(n)}</span>
        <span class="font-body-sm text-body-sm text-on-surface-variant leading-snug">${escapeHtml(t)}</span>
      </div>
      <button type="button" onclick="this.parentElement.remove()" class="text-outline hover:text-on-surface p-1">
        <span class="material-symbols-outlined text-[16px]">close</span>
      </button>
    `,a.appendChild(r),setTimeout(()=>{r.style.opacity="0",setTimeout(()=>r.remove(),300)},4500)}window.showToast=showToast;function parseDateString(e){if(!e)return null;const n=String(e).trim();let t=n.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);if(t)return{day:+t[3],month:+t[2],year:+t[1]};if(t=n.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/),t){const i=+t[1],s=+t[2];return i>12?{day:i,month:s,year:+t[3]}:{day:s,month:i,year:+t[3]}}const a=new Date(n);if(!isNaN(a.getTime()))return{day:a.getDate(),month:a.getMonth()+1,year:a.getFullYear()};const r={jan:1,feb:2,mar:3,apr:4,mei:5,may:5,jun:6,jul:7,agu:8,agt:8,aug:8,sep:9,okt:10,oct:10,nov:11,des:12,dec:12},l=n.split(/[\s\-\/\.]+/);if(l.length>=3){const i=parseInt(l[0],10),s=l[1].toLowerCase().substring(0,3),o=r[s]||parseInt(l[1],10),c=parseInt(l[2],10);if(!isNaN(i)&&!isNaN(o)&&!isNaN(c))return{day:i,month:o,year:c}}return null}window.parseDateString=parseDateString;function getInitials(e){if(!e)return"LD";const n=e.replace(/^(Ir\.|Dr\.|Drs\.|S\.T\.|M\.T\.|S\.Si\.|M\.Psi)\s*/g,"").trim(),t=n.split(/\s+/);return t.length>=2?(t[0][0]+t[1][0]).toUpperCase():n.substring(0,2).toUpperCase()}window.getInitials=getInitials;function escapeHtml(e){return e?String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"):""}window.escapeHtml=escapeHtml,window.EXTERNAL_ITEMS=[],window.EXTERNAL_MANPOWER=[];let extCalendarYear=2026,extCalendarMonth=10,extActiveView="ext-view-month";const MONTH_NAMES_ID=MONTH_NAMES;function extractDateStringFromText(e){if(!e)return"";const n=String(e),t={januari:"Jan",jan:"Jan",februari:"Feb",feb:"Feb",maret:"Mar",mar:"Mar",april:"Apr",apr:"Apr",mei:"May",may:"May",juni:"Jun",jun:"Jun",juli:"Jul",jul:"Jul",agustus:"Aug",agu:"Aug",agt:"Aug",aug:"Aug",september:"Sep",sep:"Sep",oktober:"Oct",okt:"Oct",oct:"Oct",november:"Nov",nov:"Nov",desember:"Dec",des:"Dec",dec:"Dec"},a=n.match(/(\d{1,2})\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember|Jan|Feb|Mar|Apr|May|Jun|Jul|Agu|Agt|Aug|Sep|Okt|Oct|Nov|Des|Dec)[a-z]*\s+(\d{4})/i);if(a){const r=String(parseInt(a[1],10)).padStart(2,"0"),l=t[a[2].toLowerCase()]||a[2].substring(0,3);return`${r} ${l} ${a[3]}`}return""}function inferCompanyFromEmployeeId(e,n){if(n&&String(n).trim())return String(n).trim();const t=String(e||"").toUpperCase().trim();return t.startsWith("PGP")?"Pani Gold Project (PGP)":t.startsWith("PBT")?"PT Pani Bersama Tambang (PBT)":t.startsWith("MMI")?"PT Merdeka Mining Indonesia (MMI)":t.startsWith("GSM")?"PT Gorontalo Sejahtera Mining (GSM)":t.startsWith("PETS")?"PT Puncak Emas Tani Sejahtera (PETS)":t.startsWith("MMS")?"PT Merdeka Mining Servis (MMS)":"Pani Gold Project"}window.__gvizCounter=window.__gvizCounter||0;function fetchGvizSheetJson(e,n,t){return new Promise(a=>{const r="__gvizCb_"+Date.now()+"_"+ ++window.__gvizCounter,l=document.createElement("script");let i=!1;const s=()=>{try{delete window[r]}catch{window[r]=void 0}l.parentNode&&l.parentNode.removeChild(l)},o=setTimeout(()=>{i||(i=!0,s(),a(null))},15e3);window[r]=function(u){i||(i=!0,clearTimeout(o),s(),a(u&&u.status==="ok"?u:u||null))},l.onerror=function(){i||(i=!0,clearTimeout(o),s(),a(null))};const c=/^gid=\d+$/i.test(String(n||""))?`headers=1&${n}`:`headers=1&sheet=${encodeURIComponent(n||"")}`,d=t?`&tq=${encodeURIComponent(t)}`:"";l.src=`https://docs.google.com/spreadsheets/d/${e}/gviz/tq?tqx=responseHandler:${r}&${c}${d}`,l.async=!0,(document.head||document.documentElement).appendChild(l)})}window.fetchGvizSheetJson=fetchGvizSheetJson;function gvizFindColIdx(e,n){const t=r=>String(r||"").toLowerCase().replace(/[^a-z0-9]/g,""),a=n.map(t);return(e||[]).findIndex(r=>{const l=t(r.label||r.id);return a.some(i=>l===i||l&&l.includes(i))})}function gvizCellVal(e,n){if(n===-1||!e||n>=e.length||!e[n])return"";const t=e[n];return t.v!==void 0&&t.v!==null?t.v:t.f!==void 0&&t.f!==null?t.f:""}function gvizCellFmt(e,n){if(n===-1||!e||n>=e.length||!e[n])return"";const t=e[n];return t.f!==void 0&&t.f!==null?t.f:t.v!==void 0&&t.v!==null?t.v:""}async function fetchExternalCalendarData(){const e="1Y5IQUSN84p2Os1e9wxraDIfZF6UfOql4Y5EdXbv850A",n=document.getElementById("ext-sync-time-label");n&&(n.innerHTML='<span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Menyinkronkan data jadwal eksternal...');try{const[t,a,r]=await Promise.all([fetchGvizSheetJson(e,"External_Training_Schedule").catch(()=>null),fetchGvizSheetJson(e,"AGENDA_DILUAR_TRAINING").catch(()=>null),fetchGvizSheetJson(e,"External_Training_Manpower").catch(()=>null)]),l={},i=[];if(r&&r.table&&r.table.rows){const d=r.table.cols||[],u=gvizFindColIdx(d,["ID_Booking"]),m=gvizFindColIdx(d,["Id_Karyawan","NIK"]),b=gvizFindColIdx(d,["Nama_Karyawan","Nama"]),h=gvizFindColIdx(d,["No_HP","HP"]),p=gvizFindColIdx(d,["Jabatan"]),f=gvizFindColIdx(d,["Departement","Departemen"]),g=gvizFindColIdx(d,["Perusahaan"]),y=gvizFindColIdx(d,["ID_Jadwal"]),v=gvizFindColIdx(d,["Nama_Pelatihan","Agenda"]),x=gvizFindColIdx(d,["PIC_Pendaftaran","PIC"]),k=gvizFindColIdx(d,["Status"]);r.table.rows.forEach((w,_)=>{const I=w.c||[],S=String(gvizCellVal(I,u)||"").trim(),E=String(gvizCellVal(I,m)||"").trim(),L=String(gvizCellVal(I,b)||"").trim();if(!L&&!S&&!E)return;const B=E||(/^REG-/i.test(S)?"":S),P=/^REG-/i.test(S)?S:`EXT-MP-${_+1}`,A=String(gvizCellVal(I,p)||"").trim(),R=String(gvizCellVal(I,f)||"").trim()||A,$=inferCompanyFromEmployeeId(B,gvizCellVal(I,g)),M=String(gvizCellVal(I,y)||"").trim(),T=String(gvizCellVal(I,v)||"").trim(),j=String(gvizCellVal(I,k)||"").trim()||"Terdaftar",N={id_booking:P,id_karyawan:B||"-",nama_karyawan:L||"Peserta External",no_hp:String(gvizCellVal(I,h)||"").trim(),jabatan:A,departement:R||"-",perusahaan:$,id_jadwal:M,nama_pelatihan:T,pic:String(gvizCellVal(I,x)||"").trim(),validasi:j};i.push(N),M&&(l[M]||(l[M]=[]),l[M].push(N)),T&&(l[T]||(l[T]=[]),l[T].push(N))})}const s=[];if(t&&t.table&&t.table.rows){const d=t.table.cols||[],u=gvizFindColIdx(d,["ID_Jadwal"]),m=gvizFindColIdx(d,["START","Tanggal_Mulai"]),b=gvizFindColIdx(d,["END","Tanggal_Selesai"]),h=gvizFindColIdx(d,["Duration_Day"]),p=gvizFindColIdx(d,["Duration_Hour"]),f=gvizFindColIdx(d,["Start Hour","Start_Hour"]),g=gvizFindColIdx(d,["AGENDA"]),y=gvizFindColIdx(d,["PIC"]),v=gvizFindColIdx(d,["ROOM","Ruangan"]),x=gvizFindColIdx(d,["BATCH"]),k=gvizFindColIdx(d,["Kuota"]),w=gvizFindColIdx(d,["Sisa Kuota","Sisa_Kuota"]),_=gvizFindColIdx(d,["STATUS"]),I=gvizFindColIdx(d,["Deskripsi_Pelatihan","Deskripsi"]);t.table.rows.forEach((S,E)=>{const L=S.c||[],B=String(gvizCellVal(L,u)||"").trim(),P=String(gvizCellVal(L,g)||"").trim();if(!B&&!P)return;let A=String(gvizCellFmt(L,m)||gvizCellVal(L,m)||"").trim(),R=String(gvizCellFmt(L,b)||gvizCellVal(L,b)||"").trim();const $=String(gvizCellVal(L,I)||"").trim();if(!A){const K=extractDateStringFromText(P)||extractDateStringFromText($);K&&(A=K,R=R||K)}const M=gvizCellFmt(L,h),T=gvizCellFmt(L,p);let j=M?`${M} Hari`:"";T&&(j+=j?` (${T} Jam)`:`${T} Jam`);const N=gvizCellFmt(L,f)||gvizCellVal(L,f),H=parseStartHour(N),F=B?l[B]||[]:[],G=P?l[P]||[]:[],q={},C=[];F.concat(G).forEach(K=>{const U=(K.id_karyawan||"")+"_"+(K.nama_karyawan||"");q[U]||(q[U]=!0,C.push(K))});const D=Number(gvizCellVal(L,k))||(C.length>0?Math.max(15,C.length):15),O=C.length>0?Math.max(0,D-C.length):gvizCellVal(L,w)!==""?Number(gvizCellVal(L,w)):D;s.push({uid:`EXT-${E+1}-${B||P}`,id_jadwal:B||`EXT-PLAN-${E+1}`,source_type:"external_training",source_label:"External Training",start:A,end:R||A,duration:j||(A?"":"Menunggu Jadwal"),start_hour:H.formatted,start_minutes:H.minutes,agenda:P,pic:String(gvizCellVal(L,y)||"").trim()||"Tim L&D / Vendor Sertifikasi",room:String(gvizCellVal(L,v)||"").trim()||"Menunggu Konfirmasi Lokasi",batch:String(gvizCellVal(L,x)||"").trim()||(A?"Batch 1":"Rencana Program"),kuota:D,sisa_kuota:O,total_terdaftar:C.length,status:String(gvizCellVal(L,_)||"").trim()||(A?"Buka":"Rencana Jadwal"),deskripsi:$,peserta:C})})}const o=[];if(a&&a.table&&a.table.rows){const d=a.table.cols||[],u=gvizFindColIdx(d,["ID_Jadwal"]),m=gvizFindColIdx(d,["START","Tanggal_Mulai"]),b=gvizFindColIdx(d,["END","Tanggal_Selesai"]),h=gvizFindColIdx(d,["AGENDA"]),p=gvizFindColIdx(d,["PIC"]),f=gvizFindColIdx(d,["LOCATION","ROOM","Lokasi"]),g=gvizFindColIdx(d,["STATUS"]),y=gvizFindColIdx(d,["Deskripsi_Pelatihan","Deskripsi"]);a.table.rows.forEach((v,x)=>{const k=v.c||[],w=String(gvizCellVal(k,u)||"").trim(),_=String(gvizCellVal(k,h)||"").trim();if(!w&&!_)return;let I=String(gvizCellFmt(k,m)||gvizCellVal(k,m)||"").trim(),S=String(gvizCellFmt(k,b)||gvizCellVal(k,b)||"").trim();const E=String(gvizCellVal(k,y)||"").trim();let L=!1;if(!I){const B=extractDateStringFromText(_)||extractDateStringFromText(E);B&&(I=B,S=S||B,L=!0)}o.push({uid:`EVT-${x+1}-${w||x}`,id_jadwal:w||`AGENDA-${x+1}`,source_type:"agenda_event",source_label:"Agenda di Luar Training",start:I,end:S||I,duration:"",start_hour:"08:00",start_minutes:480,agenda:_,pic:String(gvizCellVal(k,p)||"").trim()||"External Relations / L&D",room:String(gvizCellVal(k,f)||"").trim()||"Lokasi Eksternal / Site",batch:L?"Agenda Event (Tanggal dari Undangan)":"Agenda Event",kuota:0,sisa_kuota:0,total_terdaftar:0,status:String(gvizCellVal(k,g)||"").trim()||"Terjadwal",deskripsi:E,peserta:[]})})}window.EXTERNAL_MANPOWER=i,window.EXTERNAL_ITEMS=s.concat(o);const c=(d,u)=>{const m=document.getElementById(d);m&&(m.textContent=u)};if(c("ext-kpi-total",window.EXTERNAL_ITEMS.length),c("ext-kpi-training",s.length),c("ext-kpi-events",o.length),c("ext-kpi-manpower",i.length),n){const d=new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"});n.innerHTML=`<span class="w-2 h-2 rounded-full bg-emerald-600"></span> Tersinkronisasi (${s.length} External Training, ${o.length} Event, ${i.length} Manpower &bull; ${d} WITA)`}if(!window.__extPeriodInit&&window.EXTERNAL_ITEMS.length>0){window.__extPeriodInit=!0;const d=window.EXTERNAL_ITEMS.map(u=>parseDateString(u.start)).filter(Boolean);d.length>0&&(extCalendarYear=d[0].year,extCalendarMonth=d[0].month-1)}renderExtAllViews()}catch(t){console.warn("Gagal memuat External Calendar:",t),n&&(n.innerHTML='<span class="w-2 h-2 rounded-full bg-amber-500"></span> Gagal menyinkronkan sheet eksternal. Klik untuk coba lagi.')}}function getFilteredExtItems(){const e=(document.getElementById("ext-search-input")?.value||"").toLowerCase().trim(),n=document.getElementById("ext-category-filter")?.value||"all",t=document.getElementById("ext-status-filter")?.value||"all";return(window.EXTERNAL_ITEMS||[]).filter(a=>{if(n!=="all"&&a.source_type!==n)return!1;const r=!!parseDateString(a.start),l=r&&isSchedulePast(a);if(t==="scheduled"&&!r||t==="unscheduled"&&r||t==="past"&&!l)return!1;if(e){const i=(a.peserta||[]).map(o=>`${o.nama_karyawan} ${o.id_karyawan} ${o.jabatan}`).join(" ").toLowerCase();if(!`${a.agenda} ${a.id_jadwal} ${a.room} ${a.pic} ${a.batch} ${a.deskripsi} ${i}`.toLowerCase().includes(e))return!1}return!0})}function filterExtSchedules(){renderExtAllViews()}function resetExtFilters(){const e=document.getElementById("ext-search-input"),n=document.getElementById("ext-category-filter"),t=document.getElementById("ext-status-filter");e&&(e.value=""),n&&(n.value="all"),t&&(t.value="all"),renderExtAllViews()}function switchExtCalendarView(e){extActiveView=e,document.querySelectorAll(".ext-view-panel").forEach(n=>{const t=n.id===e;n.classList.toggle("hidden",!t),n.classList.toggle("flex",t)}),document.querySelectorAll(".ext-view-tab-btn").forEach(n=>{const t=n.getAttribute("data-ext-target")===e;n.className=t?"ext-view-tab-btn flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg bg-emerald-700 text-white font-label-md text-label-md font-semibold shadow-sm transition-all cursor-pointer shrink-0":"ext-view-tab-btn flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest font-label-md text-label-md font-medium transition-all cursor-pointer shrink-0"}),renderExtAllViews()}function handleExtMonthPickerChange(e){if(!e)return;const n=e.split("-");n.length===2&&updateExtCalendarPeriod(parseInt(n[0],10),parseInt(n[1],10))}function navigateExtPrev(){let e=extCalendarMonth-1,n=extCalendarYear;e<0&&(e=11,n--),n<2025&&(n=2025,e=0),updateExtCalendarPeriod(n,e)}function navigateExtNext(){let e=extCalendarMonth+1,n=extCalendarYear;e>11&&(e=0,n++),n>2027&&(n=2027,e=11),updateExtCalendarPeriod(n,e)}function navigateExtToday(){const e=(window.EXTERNAL_ITEMS||[]).map(n=>parseDateString(n.start)).filter(Boolean);if(e.length>0)updateExtCalendarPeriod(e[0].year,e[0].month-1);else{const n=new Date;updateExtCalendarPeriod(n.getFullYear(),n.getMonth())}}function setExtYearView(e){updateExtCalendarPeriod(Number(e)||2026,extCalendarMonth)}function updateExtCalendarPeriod(e,n){extCalendarYear=e,extCalendarMonth=n;const t=document.getElementById("ext-month-picker");t&&(t.value=`${e}-${n}`);const a=document.getElementById("ext-quarter-badge");if(a){const l=Math.floor(n/3)+1;a.textContent=`Q${l} FY${e}`}const r=document.getElementById("ext-month-view-title");r&&(r.textContent=`${MONTH_NAMES[n]} ${e}`),[2025,2026,2027].forEach(l=>{const i=document.getElementById("ext-btn-yr-"+l);i&&(i.className=l===e?"px-3 py-1 rounded-lg text-xs font-bold bg-emerald-700 text-white shadow-xs transition-all":"px-3 py-1 rounded-lg text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-all")}),renderExtAllViews()}function renderExtAllViews(){const e=getFilteredExtItems();renderExtMonthView(e,extCalendarYear,extCalendarMonth),renderExtWeekView(e,extCalendarYear,extCalendarMonth),renderExtYearMatrix(e,extCalendarYear,extCalendarMonth),renderExtDynamicListView(e)}function renderExtMonthView(e,n,t){const a=document.getElementById("ext-month-calendar-grid");if(!a)return;let l=new Date(n,t,1).getDay()-1;l<0&&(l=6);const i=new Date(n,t+1,0).getDate(),s=new Date(n,t,0).getDate(),o=Math.ceil((l+i)/7)*7,c=new Date,d=c.getFullYear()===n&&c.getMonth()===t,u=c.getDate();let m="";for(let v=0;v<o;v++){const x=v-l+1,k=v%7,w=k===5||k===6;if(x<1){const _=s+x;m+=`<div class="min-h-[110px] p-2.5 bg-surface-container-low/30 text-outline-variant flex flex-col gap-1 select-none"><span class="font-title-sm text-title-sm font-medium">${_}</span></div>`}else if(x>i){const _=x-i;m+=`<div class="min-h-[110px] p-2.5 bg-surface-container-low/30 text-outline-variant flex flex-col gap-1 select-none"><span class="font-title-sm text-title-sm font-medium">${_}</span></div>`}else{const _=d&&x===u,I=_?"min-h-[110px] p-2.5 flex flex-col justify-between bg-emerald-500/[0.06] ring-2 ring-emerald-600 ring-inset rounded-lg":`min-h-[110px] p-2.5 flex flex-col justify-between ${w?"bg-surface-container-low/20":"hover:bg-surface-container-low/40"} transition-colors`,S=_?`<div class="flex items-center justify-between"><span class="font-title-sm text-title-sm text-emerald-700 font-extrabold">${x}</span><span class="text-[10px] bg-emerald-700 text-white px-1.5 py-0.2 rounded font-semibold">Hari Ini</span></div>`:`<div class="flex items-center justify-between"><span class="font-title-sm text-title-sm ${w?"text-outline font-semibold":"text-on-surface font-bold"}">${x}</span></div>`;m+=`
           <div data-ext-day="${x}" class="${I}">
             ${S}
             <div class="ext-day-events mt-1 flex flex-col gap-1 w-full flex-1"></div>
           </div>
         `}}a.innerHTML=m;let b=0;const h=new Date(n,t,1),p=new Date(n,t,i,23,59,59);e.forEach(v=>{const x=parseDateString(v.start),k=parseDateString(v.end)||x;if(!x)return;const w=new Date(x.year,x.month-1,x.day),_=new Date(k.year,k.month-1,k.day,23,59,59);if(_<h||w>p)return;b++;const I=v.source_type==="external_training",S=escapeHtml(v.uid).replace(/'/g,"\\'"),E=I?"bg-emerald-700 text-white":"bg-teal-600 text-white";for(let L=1;L<=i;L++){const B=new Date(n,t,L,12,0,0);if(B>=w&&B<=_){const P=a.querySelector(`[data-ext-day="${L}"] .ext-day-events`);if(!P)continue;const A=L===x.day&&t+1===x.month,R=document.createElement("div");R.className=`mt-0.5 sm:mt-1 p-1 sm:p-1.5 rounded-md sm:rounded-lg ${E} text-[10px] sm:text-[11px] leading-tight shadow-xs cursor-pointer hover:opacity-90 hover:scale-[1.01] transition-all`,R.title=`${v.agenda} - Klik untuk melihat rincian`,R.setAttribute("onclick",`openTrainingDetailModal('${S}')`);const $=I?`${escapeHtml(v.batch||"Batch")} &bull; ${(v.peserta||[]).length}/${v.kuota||15} Peserta`:`${escapeHtml(v.room||"Agenda Luar Training")}`;R.innerHTML=A?`<div class="font-bold truncate">${escapeHtml(v.agenda)}</div><div class="text-[9.5px] sm:text-[10px] opacity-90 truncate">${$}</div>`:`<div class="font-semibold truncate opacity-90">&#8627; ${escapeHtml(v.agenda)}</div>`,P.appendChild(R)}}});const f=e.filter(v=>!parseDateString(v.start)),g=document.getElementById("ext-calendar-session-count");g&&(g.innerHTML=`&bull; ${b} Sesi Terjadwal (${MONTH_NAMES[t]} ${n})`+(f.length>0?` &bull; ${f.length} Rencana Program`:""));const y=document.getElementById("ext-unscheduled-box");y&&(f.length>0?(y.classList.remove("hidden"),y.innerHTML=`
           <div class="flex flex-col gap-2.5">
             <div class="text-label-md font-semibold text-on-surface flex items-center gap-2">
               <span class="w-2 h-2 rounded-full bg-emerald-600"></span>
               <span>Rencana Program External Training (Menunggu Tanggal Pelaksanaan)</span>
             </div>
             <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
               ${f.map(v=>`
                   <div onclick="openTrainingDetailModal('${escapeHtml(v.uid).replace(/'/g,"\\'")}')" class="p-3 rounded-xl bg-surface-container-lowest hover:bg-emerald-50/50 border border-outline-variant/50 flex items-center justify-between gap-2 cursor-pointer transition-all">
                     <div class="min-w-0">
                       <div class="font-semibold text-on-surface text-body-sm truncate">${escapeHtml(v.agenda)}</div>
                       <div class="text-[11px] text-on-surface-variant">Tanggal Menyusul (TBA)</div>
                     </div>
                     <span class="material-symbols-outlined text-emerald-700 text-[18px] shrink-0">chevron_right</span>
                   </div>
                 `).join("")}
             </div>
           </div>
         `):(y.classList.add("hidden"),y.innerHTML=""))}function renderExtWeekView(e,n,t){const a=document.getElementById("ext-week-view-body"),r=document.getElementById("ext-week-view-title"),l=document.getElementById("ext-week-count-badge");if(!a)return;r&&(r.textContent=`Jadwal Mingguan: ${MONTH_NAMES[t]} ${n}`);const i=new Date(n,t,1),s=new Date(n,t+1,0),o=e.map(m=>{const b=parseDateString(m.start),h=parseDateString(m.end)||b;return b?{it:m,r:[new Date(b.year,b.month-1,b.day),new Date(h.year,h.month-1,h.day)]}:null}).filter(m=>m&&m.r[0]<=s&&m.r[1]>=i);if(l&&(l.textContent=`${o.length} Agenda Terjadwal`),!o.length){a.innerHTML=`<div class="p-8 text-center text-on-surface-variant bg-surface-container-low/40 rounded-2xl">Tidak ada agenda terjadwal pada ${MONTH_NAMES[t]} ${n}.</div>`;return}const c=["Sen","Sel","Rab","Kam","Jum","Sab","Min"],d=m=>`${m.getDate()} ${MONTH_NAMES[m.getMonth()].slice(0,3)}`;let u="";for(let m=new Date(n,t,1-(i.getDay()+6)%7);m<=s;m=new Date(m.getFullYear(),m.getMonth(),m.getDate()+7)){const b=new Date(m.getFullYear(),m.getMonth(),m.getDate()+6),h=o.filter(g=>g.r[0]<=b&&g.r[1]>=m),p=c.map((g,y)=>{const v=new Date(m.getFullYear(),m.getMonth(),m.getDate()+y);return`<div class="text-center text-[11px] ${y>4?"text-outline":"text-on-surface-variant"} ${v.getMonth()!==t?"opacity-40":""}"><span class="font-semibold">${g}</span> ${v.getDate()}</div>`}).join(""),f=h.map(g=>{const y=Math.max(0,Math.round((g.r[0]-m)/864e5)),v=Math.min(6,Math.round((g.r[1]-m)/864e5)),x=g.it.source_type==="external_training",k=x?"bg-emerald-700 text-white":"bg-teal-600 text-white",w=escapeHtml(g.it.uid).replace(/'/g,"\\'"),_=x?`${escapeHtml(g.it.room||"")} &bull; ${(g.it.peserta||[]).length}/${g.it.kuota||15} Peserta`:`${escapeHtml(g.it.room||"Agenda Luar Training")}`,I=g.it.source_type||"external_training",S=g.it.id_jadwal||g.it.uid,L=typeof window.isAdminAuthenticated=="function"&&window.isAdminAuthenticated()?`<span class="inline-flex items-center gap-0.5 ml-1 shrink-0"><span onclick="event.stopPropagation(); openAdminScheduleModal('edit', ${jsArg(S)}, ${jsArg(I)})" class="w-5 h-5 rounded bg-black/25 hover:bg-black/45 text-white inline-flex items-center justify-center cursor-pointer" title="Edit Jadwal"><span class="material-symbols-outlined text-[12px]">edit</span></span><span onclick="event.stopPropagation(); openAdminDeleteModal(${jsArg(S)}, ${jsArg(I)}, ${jsArg(g.it.agenda)})" class="w-5 h-5 rounded bg-red-600/80 hover:bg-red-700 text-white inline-flex items-center justify-center cursor-pointer" title="Hapus Jadwal"><span class="material-symbols-outlined text-[12px]">delete</span></span></span>`:"";return`<div onclick="openTrainingDetailModal('${w}')" style="grid-column:${y+1} / ${v+2}" class="${k} shadow-xs hover:opacity-90 rounded-lg px-2.5 py-1.5 text-left text-[12px] leading-tight transition-all min-w-0 cursor-pointer flex items-center justify-between gap-1"><div class="min-w-0 flex-1"><span class="block font-bold truncate">${escapeHtml(g.it.agenda)}</span><span class="block text-[10px] opacity-90 truncate">${_}</span></div>${L}</div>`}).join("");u+=`<div class="min-w-[640px]"><div class="text-label-md font-semibold text-on-surface mb-2">${d(m)} - ${d(b)}</div><div class="grid grid-cols-7 gap-1 pb-1 border-b border-surface-container">${p}</div><div class="grid grid-cols-7 gap-1 pt-2">${f||'<div class="col-span-7 text-center text-[12px] text-outline py-2">Tidak ada sesi</div>'}</div></div>`}a.innerHTML=u}function renderExtYearMatrix(e,n,t){const a=document.getElementById("ext-year-matrix-grid"),r=document.getElementById("ext-year-view-title");if(!a)return;r&&(r.textContent=`Tinjauan Agenda Tahunan ${n}`);let l="";for(let i=0;i<12;i++){const s=e.filter(c=>{const d=parseDateString(c.start);return d&&d.year===n&&d.month-1===i});l+=`
        <div onclick="updateExtCalendarPeriod(${n}, ${i}); switchExtCalendarView('ext-view-month');" class="p-4 rounded-xl border ${i===t?"border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/30":"border-outline-variant/40 bg-surface-container-lowest hover:border-emerald-500/60"} flex flex-col justify-between gap-3 cursor-pointer transition-all shadow-xs">
          <div class="flex items-center justify-between">
            <span class="font-title-sm text-title-sm font-bold text-on-surface">${MONTH_NAMES[i]}</span>
            <span class="px-2 py-0.5 rounded-full text-xs font-bold ${s.length>0?"bg-emerald-700 text-white":"bg-surface-container text-on-surface-variant"}">${s.length} Agenda</span>
          </div>
          <div class="flex flex-col gap-1.5 min-h-[60px]">
            ${s.length===0?'<span class="text-xs text-outline italic my-auto">Tidak ada jadwal</span>':s.map(c=>`
                  <div class="px-2 py-1 rounded text-[11px] font-semibold truncate ${c.source_type==="external_training"?"bg-emerald-50 text-emerald-900 border-l-2 border-emerald-700":"bg-teal-50 text-teal-900 border-l-2 border-teal-600"}">
                    ${escapeHtml(c.agenda)}
                  </div>
                `).join("")}
          </div>
        </div>
      `}a.innerHTML=l}function renderExtDynamicListView(e){const n=document.getElementById("ext-dynamic-schedule-container");if(n){if(!e||e.length===0){n.innerHTML=`
        <div class="p-8 bg-surface-container-low/40 rounded-2xl border border-outline-variant/30 text-center text-on-surface-variant">
          Belum ada agenda eksternal yang sesuai dengan filter pencarian.
        </div>
      `;return}n.innerHTML=e.map(t=>{const a=t.source_type==="external_training",r=t.source_type||"external_training",l=t.id_jadwal||t.uid,i=!!parseDateString(t.start),s=escapeHtml(t.uid).replace(/'/g,"\\'"),o=Array.isArray(t.peserta)?t.peserta:[],c=t.kuota!==void 0&&t.kuota!==null&&t.kuota!==""&&!isNaN(Number(t.kuota))?Number(t.kuota):15,d=o.length,u=Math.max(0,c-d),m=t.sisa_kuota!==void 0&&t.sisa_kuota!==null&&t.sisa_kuota!==""&&!isNaN(Number(t.sisa_kuota))?Math.max(0,Number(t.sisa_kuota)):u,b=c>0?Math.min(m,u):0,h=a&&c>0?Math.min(100,Math.round(d/c*100)):0,p=a?"bg-emerald-700":"bg-teal-600",f=a?"workspace_premium":"event_note";return`
      <div class="p-4 sm:p-6 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/40 hover:shadow-md transition-shadow flex flex-col gap-4 relative overflow-hidden group">
        <div class="absolute left-0 top-0 bottom-0 w-1.5 ${p}"></div>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <span class="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-900 font-label-sm text-label-sm font-bold">${escapeHtml(t.batch||t.id_jadwal)}</span>
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full ${i?"bg-emerald-50 text-emerald-800":"bg-amber-50 text-amber-800"} font-label-sm text-label-sm font-semibold">
              <span class="material-symbols-outlined text-[14px]">${i?"check_circle":"schedule"}</span>
              ${escapeHtml(i?t.status||"Terjadwal":"Menunggu Jadwal (TBA)")}
            </span>
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-medium">
              <span class="material-symbols-outlined text-[14px]">${f}</span>
              ${escapeHtml(t.source_label)}
            </span>
          </div>
          <div class="flex items-center gap-1.5 text-on-surface-variant font-label-md text-label-md">
            <span class="material-symbols-outlined text-[18px] text-emerald-700">pin_drop</span>
            <span>${escapeHtml(t.room||"Lokasi Menyusul")}</span>
          </div>
        </div>

        <div class="flex flex-col md:flex-row gap-4 items-start justify-between">
          <div class="flex gap-3 sm:gap-4 w-full">
            <div class="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl ${p} text-white flex items-center justify-center shrink-0 shadow-xs">
              <span class="material-symbols-outlined text-[26px] sm:text-[32px] md:text-[36px]">${f}</span>
            </div>
            <div class="flex flex-col gap-1 min-w-0 flex-1">
              <span class="font-label-sm text-label-sm uppercase tracking-wider text-emerald-700 font-bold">${escapeHtml(t.source_label)} &bull; Pani Gold Project</span>
              <h3 onclick="openTrainingDetailModal('${s}')" class="font-headline-sm text-headline-sm text-on-surface font-semibold group-hover:text-emerald-700 transition-colors cursor-pointer break-words">
                ${escapeHtml(t.agenda)}
              </h3>
              ${t.deskripsi?`<p class="text-body-sm text-on-surface-variant whitespace-pre-line line-clamp-3">${escapeHtml(t.deskripsi)}</p>`:""}
              <div class="flex flex-wrap items-center gap-y-1 gap-x-4 text-on-surface-variant font-body-sm text-body-sm mt-0.5">
                <span class="flex items-center gap-1 text-on-surface font-medium">
                  <span class="material-symbols-outlined text-[16px] text-emerald-700">date_range</span>
                  ${i?escapeHtml(formatSmartDateRange(t.start,t.end)):"Tanggal Menyusul (TBA)"}
                </span>
                ${t.id_jadwal?`
                <span class="flex items-center gap-1">
                  <span class="material-symbols-outlined text-[16px] text-outline">badge</span> Kode: <strong>${escapeHtml(t.id_jadwal)}</strong>
                </span>`:""}
              </div>
            </div>
          </div>
        </div>

        <div class="p-3.5 rounded-xl bg-surface-container-low flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-3 w-full md:w-auto">
            <div class="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-title-sm text-title-sm font-bold">
              ${escapeHtml(getInitials(t.pic||"LD"))}
            </div>
            <div class="flex flex-col">
              <span class="font-label-md text-label-md text-on-surface font-semibold">${escapeHtml(t.pic||"Tim L&D Pani Gold Project")}</span>
              <span class="font-body-sm text-body-sm text-on-surface-variant">PIC Kegiatan</span>
            </div>
          </div>
          ${a?`
          <div class="flex flex-col gap-1 w-full md:w-64">
            <div class="flex items-center justify-between font-label-sm text-label-sm">
              <span class="text-on-surface-variant">Kapasitas Batch</span>
              <span class="font-bold text-on-surface">${d} <span class="text-on-surface-variant font-normal">/ ${c} Terisi (${h}%)</span></span>
            </div>
            <div class="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
              <div class="h-full bg-emerald-700 rounded-full" style="width: ${h}%"></div>
            </div>
            <span class="text-right font-label-sm text-label-sm text-emerald-700 font-semibold">
              Sisa ${b} Kursi Tersedia
            </span>
          </div>`:""}
        </div>

        <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
          <span class="flex items-center gap-1 font-label-md text-label-md text-on-surface-variant">
            <span class="material-symbols-outlined text-[16px] text-emerald-700">verified</span>
            External &amp; Event Pani Gold Project
          </span>
          <div class="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
            ${typeof window.isAdminAuthenticated=="function"&&window.isAdminAuthenticated()?`
            <button type="button" onclick="openAdminScheduleModal('edit', ${jsArg(l)}, ${jsArg(r)})" class="h-10 sm:h-9 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 font-label-sm text-label-sm font-semibold transition-colors inline-flex items-center justify-center gap-1 cursor-pointer" title="Edit Jadwal (Admin)">
              <span class="material-symbols-outlined text-[16px] text-amber-700">edit_calendar</span>
              <span>Edit</span>
            </button>
            <button type="button" onclick="openAdminDeleteModal(${jsArg(l)}, ${jsArg(r)}, ${jsArg(t.agenda)})" class="h-10 sm:h-9 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-label-sm text-label-sm font-semibold transition-colors inline-flex items-center justify-center gap-1 cursor-pointer" title="Hapus Jadwal (Wajib Password Admin)">
              <span class="material-symbols-outlined text-[16px]">delete</span>
              <span>Hapus</span>
            </button>
            `:""}
            <button type="button" onclick="openTrainingDetailModal('${s}')" class="flex-1 sm:flex-none h-10 sm:h-9 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-label-md text-label-md font-semibold transition-colors justify-center flex items-center gap-1.5 cursor-pointer">
              <span>${d>0?`Lihat Detail & ${d} Manpower`:"Lihat Detail Agenda"}</span>
            </button>
          </div>
        </div>
      </div>`}).join("")}}function formatIcsDateTime(e,n){if(!e)return"";const t=String(e).match(/^(\d{4})-(\d{2})-(\d{2})/);if(!t)return"";const a=t[1],r=t[2],l=t[3];let i="08",s="00",o="00";if(n){const c=String(n).match(/(\d{1,2}):(\d{2})/);c&&(i=c[1].padStart(2,"0"),s=c[2])}return`${a}${r}${l}T${i}${s}${o}`}function computeIcsEndTime(e,n,t){if(!e)return"";const a=String(e).match(/^(\d{4})-(\d{2})-(\d{2})/);if(!a)return"";const r=parseInt(a[1],10),l=parseInt(a[2],10)-1,i=parseInt(a[3],10);let s=8,o=0;if(n){const f=String(n).match(/(\d{1,2}):(\d{2})/);f&&(s=parseInt(f[1],10),o=parseInt(f[2],10))}let c=4;if(t){const f=String(t).match(/(\d+)\s*jam/i);f?c=parseInt(f[1],10):/hari/i.test(t)&&(c=8)}const d=new Date(r,l,i,s,o,0);d.setHours(d.getHours()+Math.min(12,Math.max(1,c)));const u=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),b=String(d.getDate()).padStart(2,"0"),h=String(d.getHours()).padStart(2,"0"),p=String(d.getMinutes()).padStart(2,"0");return`${u}${m}${b}T${h}${p}00`}function escapeIcsText(e){return e?String(e).replace(/\\/g,"\\\\").replace(/;/g,"\\;").replace(/,/g,"\\,").replace(/\r\n|\n|\r/g,"\\n"):""}function buildIcsEvent(e){if(!e)return"";const n=`${(e.id_jadwal||e.uid||"EVT").replace(/[^a-zA-Z0-9-]/g,"")}-${Date.now()}@panigoldproject.com`,t=new Date().toISOString().replace(/[-:]/g,"").split(".")[0]+"Z",a=p=>{const f=parseDateString(p);return f?`${f.year}-${String(f.month).padStart(2,"0")}-${String(f.day).padStart(2,"0")}`:""},r=a(e.start);if(!r)return"";const l=a(e.end)||r,i=e.start_hour||"08:00",s=e.room||"Gold Room (Diklat PGP)",o=formatIcsDateTime(r,i),c=computeIcsEndTime(l,i,e.duration),d=e.agenda||"Pelatihan Pani Gold Project",u=`[Training PGP] ${d} (${s})`,m=(e.peserta||[]).length||Number(e.total_terdaftar)||0,b=Number(e.kuota)||0,h=[`Detail Pelatihan: ${d}`,`Kode Jadwal: ${e.id_jadwal||"-"}`,`Ruangan: ${s}`,`Waktu / Jam Mulai: ${i} WITA`,`Durasi: ${e.duration||"1 Hari"}`,`Instruktur / PIC: ${e.pic||"Tim L&D Pani Gold Project"}`,b>0?`Kapasitas Kuota: ${b} Kursi (Terdaftar: ${m} Peserta)`:"",e.deskripsi?`Deskripsi Materi: ${e.deskripsi}`:"","Sistem: Pani Gold Project - Internal Training & Manpower Competency System"].filter(Boolean).join(`
`);return["BEGIN:VEVENT",`UID:${n}`,`DTSTAMP:${t}`,`DTSTART;TZID=Asia/Makassar:${o}`,`DTEND;TZID=Asia/Makassar:${c}`,`SUMMARY:${escapeIcsText(u)}`,`LOCATION:${escapeIcsText(s)}`,`DESCRIPTION:${escapeIcsText(h)}`,"STATUS:CONFIRMED","TRANSP:OPAQUE","END:VEVENT"].join(`\r
`)}function downloadIcsBlob(e,n){const t=new Blob([e],{type:"text/calendar;charset=utf-8"}),a=URL.createObjectURL(t),r=document.createElement("a");r.href=a,r.download=n||"Kalender_Pelatihan_PGP.ics",document.body.appendChild(r),r.click(),setTimeout(()=>{document.body.removeChild(r),URL.revokeObjectURL(a)},200)}function downloadSingleScheduleIcs(e){const n=Array.isArray(window.EXTERNAL_ITEMS)?window.EXTERNAL_ITEMS:[],t=(LIVE_SCHEDULES||[]).find(o=>o.id_jadwal===e||o.agenda===e)||n.find(o=>o.uid===e||o.id_jadwal===e||o.agenda===e);if(!t){showToast("warning","Jadwal Tidak Ditemukan","Tidak dapat menemukan rincian jadwal untuk diunduh.");return}if(!t.start){showToast("info","Tanggal Belum Ditetapkan","Jadwal ini berstatus tentatif. Tanggal pasti belum ditentukan admin LnD.");return}const a=buildIcsEvent(t);if(!a){showToast("warning","Gagal Memproses Kalender","Format tanggal jadwal belum valid.");return}const r=t.agenda||"Pani Gold Project Training",l=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Pani Gold Project//Training Calendar//ID","CALSCALE:GREGORIAN","METHOD:PUBLISH",`X-WR-CALNAME:${escapeIcsText(r)}`,"X-WR-TIMEZONE:Asia/Makassar",a,"END:VCALENDAR"].join(`\r
`),s=`Jadwal_${(t.agenda||"Pelatihan").replace(/[^a-zA-Z0-9_-]/g,"_").substring(0,30)}_${t.start||"PGP"}.ics`;downloadIcsBlob(l,s),showToast("success","Kalender Diunduh",`Jadwal "${t.agenda}" (${t.room||"Ruangan PGP"}) berhasil diunduh dalam format kalender (.ics).`)}window.downloadSingleScheduleIcs=downloadSingleScheduleIcs;function downloadTrainingCalendarIcs(e="internal"){const t=(e==="internal"?LIVE_SCHEDULES||[]:window.EXTERNAL_ITEMS||[]).filter(c=>c&&c.start&&!c.is_request&&!/tutup|batal/i.test(c.status||""));if(!t.length){showToast("info","Data Kosong","Belum ada jadwal bertanggal aktif untuk diunduh.");return}const a=t.map(c=>buildIcsEvent(c)).filter(Boolean);if(!a.length){showToast("info","Tidak Ada Agenda","Semua agenda saat ini masih menunggu penetapan tanggal.");return}const l=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Pani Gold Project//Training Calendar//ID","CALSCALE:GREGORIAN","METHOD:PUBLISH",`X-WR-CALNAME:${e==="internal"?"Internal Training Pani Gold Project":"External & Event Calendar PGP"}`,"X-WR-TIMEZONE:Asia/Makassar",a.join(`\r
`),"END:VCALENDAR"].join(`\r
`),s=new Date().toISOString().slice(0,10),o=`Kalender_${e==="internal"?"Internal_Training":"External_Event"}_PGP_${s}.ics`;downloadIcsBlob(l,o),showToast("success","Kalender Berhasil Diunduh",`${a.length} sesi pelatihan berhasil diekspor ke file kalender (.ics) lengkap dengan jam dan ruangan.`)}window.downloadTrainingCalendarIcs=downloadTrainingCalendarIcs;function exportSchedulesToCsv(e="internal"){const n=e==="internal"?LIVE_SCHEDULES||[]:window.EXTERNAL_ITEMS||[];if(!n.length){showToast("info","Data Kosong","Belum ada jadwal untuk diekspor.");return}const t=["No","Kode_Jadwal","Nama_Pelatihan","Batch_Kategori","Tanggal_Mulai","Tanggal_Selesai","Jam_Mulai","Durasi","Ruangan","Instruktur_PIC","Kuota_Kursi","Total_Terdaftar","Sisa_Kuota","Status_Jadwal","Deskripsi_Pelatihan"],a=u=>`"${String(u??"").replace(/"/g,'""')}"`,r=n.map((u,m)=>{const b=(u.peserta||[]).length||Number(u.total_terdaftar)||0,h=Number(u.kuota)||0,p=h>0?Math.max(0,h-b):0,f=u.start_hour?`${u.start_hour} WITA`:u.start?"08:00 WITA":"Tentatif",g=u.room||"Gold Room / Diklat PGP";return[m+1,u.id_jadwal||u.uid||"-",u.agenda||"Pelatihan",u.batch||u.category_label||(u.is_request?"Training Request":"Reguler"),u.start||"TBA",u.end||u.start||"TBA",f,u.duration||"-",g,u.pic||"Tim L&D PGP",h,b,p,u.status||"Buka",u.deskripsi||"-"].map(a).join(",")}),l="\uFEFF"+[t.map(a).join(","),...r].join(`\r
`),i=new Blob([l],{type:"text/csv;charset=utf-8;"}),s=URL.createObjectURL(i),o=document.createElement("a");o.href=s;const d=new Date().toISOString().slice(0,10);o.download=`Jadwal_${e==="internal"?"Internal_Training":"External_Event"}_PGP_${d}.csv`,document.body.appendChild(o),o.click(),setTimeout(()=>{document.body.removeChild(o),URL.revokeObjectURL(s)},200),showToast("success","File Excel (.CSV) Diunduh",`${n.length} jadwal pelatihan berhasil diekspor lengkap dengan rincian jam dan ruangan.`)}window.exportSchedulesToCsv=exportSchedulesToCsv;function openPdfPrintWindow(e,n){const t=window.open("","_blank","width=1150,height=850,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes");if(t)try{t.document.open(),t.document.write(e),t.document.close(),t.focus(),setTimeout(()=>{try{t.print()}catch{}},500);return}catch(l){console.warn("Popup write failed, falling back to hidden iframe:",l)}let a=document.getElementById("pgp-print-frame");a||(a=document.createElement("iframe"),a.id="pgp-print-frame",a.style.position="fixed",a.style.right="0",a.style.bottom="0",a.style.width="0",a.style.height="0",a.style.border="0",document.body.appendChild(a));const r=a.contentWindow.document;r.open(),r.write(e),r.close(),setTimeout(()=>{try{a.contentWindow.focus(),a.contentWindow.print()}catch{showToast("warning","Gagal Mencetak","Browser memblokir pratinjau. Silakan izinkan pop-up pada peramban Anda.")}},600)}window.openPdfPrintWindow=openPdfPrintWindow;const MGR_LOGO_BASE64=new URL("assets/logo-print.png",document.baseURI).href;function generateCalendarPdfHtml(e,n){const t=e==="internal",a=t?"LEARNING & DEVELOPMENT":"EXTERNAL & EVENT CALENDAR",r=t?"mgr":"green",l=["MINGGU","SENIN","SELASA","RABU","KAMIS","JUMAT","SABTU"],i=["SENIN","SELASA","RABU","KAMIS","JUMAT","SABTU","MINGGU"],s=["JANUARI","FEBRUARI","MARET","APRIL","MEI","JUNI","JULI","AGUSTUS","SEPTEMBER","OKTOBER","NOVEMBER","DESEMBER"];function o($){if($&&$.is_request)return{key:"request",label:"Request",accent:"#d97706",bg:"#fef3c7",text:"#92400e",pillBg:"#fde68a",dot:"#f59e0b"};const M=(($&&($.agenda||""))+" "+($&&($.kategori||""))+" "+($&&($.batch||""))).toLowerCase();return/meeting|\bhr\b|leadership|manajemen|management|supervis|coaching|komunikasi|onboarding/.test(M)?{key:"leadership",label:"Leadership / HR",accent:"#6d28d9",bg:"#f5f3ff",text:"#5b21b6",pillBg:"#ede9fe",dot:"#7c3aed"}:/cyber|\bit\b|sap|cloud|digital|data|software|komputer/.test(M)?{key:"it",label:"IT / Digital",accent:"#0f766e",bg:"#f0fdfa",text:"#115e59",pillBg:"#ccfbf1",dot:"#0d9488"}:/bnsp|audit|sertifikasi/.test(M)?{key:"bnsp",label:"BNSP / Audit",accent:"#047857",bg:"#ecfdf5",text:"#065f46",pillBg:"#d1fae5",dot:"#059669"}:/power tools|workshop|teknis|operator|alat|mekanik|listrik|welding|crane|rigging/.test(M)?{key:"teknis",label:"Teknis / Operasi",accent:"#0369a1",bg:"#e0f2fe",text:"#075985",pillBg:"#bae6fd",dot:"#0284c7"}:/finance|keuangan|budget|akuntansi/.test(M)?{key:"finance",label:"Finance",accent:"#be185d",bg:"#fdf2f8",text:"#9d174d",pillBg:"#fce7f3",dot:"#db2777"}:/k3|hse|safety|tambang|loto|first aid|fire|working at|working near|hegiht|height|confined|hazard|manual handling|hand injury|spotter|blindspot|fatigue|sds|hazardous|waste|crm|erp/.test(M)?{key:"safety",label:"HSE / Safety",accent:"#9D7828",bg:"#fdf6e3",text:"#725210",pillBg:"#f6e4b4",dot:"#9D7828"}:t?{key:"reguler",label:"Reguler / Umum",accent:"#0037b0",bg:"#eff6ff",text:"#1e3a8a",pillBg:"#dbeafe",dot:"#2563eb"}:{key:"external",label:"Eksternal / Event",accent:"#059669",bg:"#ecfdf5",text:"#065f46",pillBg:"#d1fae5",dot:"#10b981"}}function c($){const M=String($&&$.status||"").trim().toLowerCase();return M?/selesai|done/.test(M)?{label:"Selesai",color:"#065f46",bg:"#d1fae5"}:/berlangsung|ongoing/.test(M)?{label:"Berjalan",color:"#0369a1",bg:"#e0f2fe"}:/penuh|tutup|full|closed/.test(M)?{label:"Penuh",color:"#9a3412",bg:"#ffedd5"}:null:null}function d($){const M=String($.waktu||$.start_hour||$.startHour||$.jam||"").trim(),T=M.match(/(\d{1,2})[:.](\d{2})\s*(?:-|–|sd|s\/d|to)\s*(\d{1,2})[:.](\d{2})/i);if(T){const q=String(parseInt(T[1],10)).padStart(2,"0"),C=T[2],D=String(parseInt(T[3],10)).padStart(2,"0"),O=T[4];return`${q}.${C} sd ${D}.${O}`}let j=8,N=0,H=!1;const F=M.match(/(\d{1,2})[:.](\d{2})/);if(F)j=parseInt(F[1],10),N=parseInt(F[2],10),H=!0;else{const q=M.match(/^(\d{1,2})(?:\s*wib)?$/i);q?(j=parseInt(q[1],10),N=0,H=!0):$.start_minutes!=null&&$.start_minutes<1440&&(j=Math.floor($.start_minutes/60),N=$.start_minutes%60,H=!0)}let G=2;if(j===16&&(G=1),$.duration){const q=String($.duration).match(/(\d+)\s*(?:jam|hour)/i);if(q){const C=parseInt(q[1],10);C>=1&&C<=8&&(G=C)}}if(H){const q=j*60+N+G*60,C=Math.min(23,Math.floor(q/60)),D=q%60;return`${String(j).padStart(2,"0")}.${String(N).padStart(2,"0")} sd ${String(C).padStart(2,"0")}.${String(D).padStart(2,"0")}`}return"08.00 sd 10.00"}function u($){const T=d($).match(/^(\d{2}\.\d{2})/);return T?T[1]:"08.00"}const m={},b=[],h={},p=new Map;(n||[]).forEach($=>{if(!$)return;const M=o($);p.has(M.key)||p.set(M.key,M);const T=parseDateString($.start)||parseDateString($.start_date);if(T&&T.year&&T.month&&T.day){const j=`${T.year}-${String(T.month).padStart(2,"0")}-${String(T.day).padStart(2,"0")}`,N=new Date(T.year,T.month-1,T.day),H=`${s[T.month-1]} ${T.year}`;h[H]||(h[H]={count:0,year:T.year,monthIdx:T.month-1,label:H}),h[H].count+=1,m[j]||(m[j]={dateKey:j,dateObj:N,headerText:`${String(T.day).padStart(2,"0")} ${s[T.month-1]} | ${l[N.getDay()]}`,items:[]}),m[j].items.push($)}else b.push($)});let f=null;for(const $ of Object.values(h))(!f||$.count>f.count)&&(f=$);if(!f){const $=new Date,M=typeof currentCalendarMonth=="number"?currentCalendarMonth:$.getMonth(),T=typeof currentCalendarYear=="number"?currentCalendarYear:$.getFullYear();f={count:0,year:T,monthIdx:M,label:`${s[M]} ${T}`}}const g=f.label,y=f.year,v=f.monthIdx,x=Object.keys(m).sort().map($=>{const M=m[$];return M.items.sort((T,j)=>{const N=T.start_minutes!=null?T.start_minutes:T.start_hour?parseInt(T.start_hour,10)*60:9999,H=j.start_minutes!=null?j.start_minutes:j.start_hour?parseInt(j.start_hour,10)*60:9999;return N!==H?N-H:String(T.agenda||"").localeCompare(String(j.agenda||""))}),M});b.length>0&&x.push({dateKey:"9999-99-99",headerText:"JADWAL TENTATIF / MENUNGGU JADWAL RESMI",items:b});const k=x.length;let w=Math.ceil(k/3),_=Math.ceil(k*2/3);if(k>=3){const $=x.map(N=>1.3+N.items.length*.9),T=$.reduce((N,H)=>N+H,0)/3;let j=1/0;for(let N=1;N<k-1;N++){const H=$.slice(0,N).reduce((F,G)=>F+G,0);for(let F=N+1;F<k;F++){const G=$.slice(N,F).reduce((D,O)=>D+O,0),q=$.slice(F).reduce((D,O)=>D+O,0),C=Math.max(Math.abs(H-T),Math.abs(G-T),Math.abs(q-T));C<j&&(j=C,w=N,_=F)}}}const I=[x.slice(0,w),x.slice(w,_),x.slice(_)];function S($){if(!$||$.length===0)return`
          <div class="col-wrap">
            <table class="schedule-tbl">
              <thead>
                <tr>
                  <th class="th-agenda">NAMA PELATIHAN</th>
                  <th class="th-waktu">WAKTU</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colspan="2" style="text-align:center; padding:16px; color:#94a3b8; font-style:italic;">- Tidak ada jadwal tambahan -</td></tr>
              </tbody>
            </table>
          </div>
        `;let M="";return $.forEach(T=>{const j=T.dateObj&&T.dateObj.getDay()===0,N=T.dateKey==="9999-99-99";M+=`
          <tr class="date-header-row${j?" is-sunday":""}${N?" is-tentatif":""}">
            <td colspan="2" class="date-header-cell">
              <div class="date-header-flex">
                <span>${T.headerText}</span>
                <span class="date-count-pill">${T.items.length} sesi</span>
              </div>
            </td>
          </tr>
        `,T.items.forEach(H=>{const F=d(H),G=escapeHtml(H.agenda||"Pelatihan"),q=o(H),C=c(H),D=H.room?escapeHtml(String(H.room).replace(/\s*\(.*?\)\s*/g,"").trim()):"";M+=`
            <tr class="item-row" style="background-color:${q.bg};">
              <td class="item-agenda-cell" style="border-left: 3.5px solid ${q.accent}; background-color:${q.bg};">
                <div class="item-title-line">
                  <span class="item-dot" style="background-color:${q.dot};"></span>
                  <span class="item-title">${G}${D?` <span class="item-room-inline" style="color:${q.text};">(${D})</span>`:""}</span>
                  ${C?`<span class="item-status-pill" style="background-color:${C.bg}; color:${C.color};">${C.label}</span>`:""}
                </div>
              </td>
              <td class="item-time-cell" style="background-color:${q.bg}; color:${q.text};">${F}</td>
            </tr>
          `})}),`
        <div class="col-wrap">
          <table class="schedule-tbl">
            <thead>
              <tr>
                <th class="th-agenda">NAMA PELATIHAN</th>
                <th class="th-waktu">WAKTU</th>
              </tr>
            </thead>
            <tbody>
              ${M}
            </tbody>
          </table>
        </div>
      `}function E(){const $=new Date(y,v+1,0).getDate(),M=(new Date(y,v,1).getDay()+6)%7,T=Array.from({length:$+1},()=>[]),j=[],N=new Date(y,v,1),H=new Date(y,v,$);(n||[]).forEach(D=>{if(!D)return;const O=parseDateString(D.start)||parseDateString(D.start_date);if(!O||!O.year||!O.month||!O.day){j.push(D);return}const K=parseDateString(D.end)||parseDateString(D.end_date)||O,U=new Date(O.year,O.month-1,O.day),J=new Date(K.year,K.month-1,K.day);if(J<N||U>H){j.push(D);return}const Y=U<N?1:U.getDate(),X=J>H?$:J.getDate();for(let W=Y;W<=X;W++)T[W].push(D)});const F=Math.ceil((M+$)/7)*7,G=Math.max(4,F/7);let q="";for(let D=0;D<G;D++){let O="";for(let K=0;K<7;K++){const J=D*7+K-M+1,Y=K===6,X=K===5;if(J<1||J>$){O+=`<td class="cal-cell is-empty${Y?" is-sunday":""}"></td>`;continue}const W=T[J].slice().sort((z,V)=>{const te=z.start_minutes!=null?z.start_minutes:9999,ae=V.start_minutes!=null?V.start_minutes:9999;return te-ae||String(z.agenda||"").localeCompare(String(V.agenda||""))}),Q=G>=6?3:4,Z=W.slice(0,Q).map(z=>{const V=o(z);return`<div class="cal-chip" style="background-color:${V.bg}; border-left:3px solid ${V.accent}; color:${V.text};">
              <span class="cal-chip-time">${u(z)}</span>
              <span class="cal-chip-name">${escapeHtml(z.agenda||"Pelatihan")}</span>
            </div>`}).join(""),ee=W.length>Q?`<div class="cal-more">+${W.length-Q} agenda lainnya</div>`:"";O+=`<td class="cal-cell${Y?" is-sunday":""}${X?" is-saturday":""}${W.length?" has-events":""}">
            <div class="cal-day-head">
              <span class="cal-day-num${Y?" sun-num":""}">${J}</span>
              ${W.length?`<span class="cal-day-badge">${W.length}</span>`:""}
            </div>
            <div class="cal-chip-list">${Z}${ee}</div>
          </td>`}q+=`<tr>${O}</tr>`}const C=j.length?`<div class="cal-extra-strip"><strong>Agenda di Luar ${g} / Tentatif (${j.length}):</strong> ${j.slice(0,8).map(D=>{const O=o(D);return`<span class="legend-pill" style="background-color:${O.bg}; color:${O.text}; border-color:${O.accent};"><span class="legend-dot" style="background-color:${O.dot};"></span>${escapeHtml(D.agenda||"Pelatihan")}${D.start?" ("+escapeHtml(D.start)+")":""}</span>`}).join("")}${j.length>8?`<span>+${j.length-8} lagi</span>`:""}</div>`:"";return`
        <table class="cal-grid-tbl">
          <thead>
            <tr>
              ${i.map((D,O)=>`<th class="${O===6?"th-sunday":O===5?"th-saturday":""}">${D}</th>`).join("")}
            </tr>
          </thead>
          <tbody>${q}</tbody>
        </table>
        ${C}
      `}const L=S(I[0]),B=S(I[1]),P=S(I[2]),A=E(),R=Array.from(p.values()).map($=>`
      <span class="legend-pill" style="background-color:${$.bg}; color:${$.text}; border-color:${$.accent};">
        <span class="legend-dot" style="background-color:${$.dot};"></span>
        <span>${escapeHtml($.label)}</span>
      </span>
    `).join("");return`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>Jadwal Pelatihan - Merdeka Gold Resources (${g})</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 5.5mm 7mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      background: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      --brand-primary: #0f3b7a;
      --brand-secondary: #1e6b3b;
      --brand-gold: #9D7828;
      --th-bg: #0f3b7a;
      --th-text: #ffffff;
      --th-border: #c59b27;
      --date-bg: #e8eefb;
      --date-border: #bfdbfe;
      --date-accent: #0037b0;
      --date-text: #0f295c;
      --footer-bg: #0f3b7a;
      --footer-accent: #c59b27;
    }
    body[data-theme="green"] {
      --brand-primary: #1e6b3b;
      --brand-secondary: #047857;
      --brand-gold: #9D7828;
      --th-bg: #1e6b3b;
      --th-text: #ffffff;
      --th-border: #c59b27;
      --date-bg: #dcfce7;
      --date-border: #bbf7d0;
      --date-accent: #1e6b3b;
      --date-text: #14532d;
      --footer-bg: #1e6b3b;
      --footer-accent: #c59b27;
    }
    body[data-layout="poster"] .view-grid { display: none !important; }
    body[data-layout="grid"] .view-poster { display: none !important; }
    body[data-layout="poster"] #btn-layout-poster,
    body[data-layout="grid"] #btn-layout-grid {
      background-color: #2563eb;
      color: #ffffff;
      border-color: #60a5fa;
    }
    body[data-theme="mgr"] #btn-theme-mgr,
    body[data-theme="green"] #btn-theme-green {
      background-color: #9D7828;
      color: #ffffff;
      border-color: #fbbf24;
    }

    .no-print-bar {
      position: sticky;
      top: 0;
      z-index: 9999;
      background: #0f172a;
      color: #ffffff;
      padding: 9px 16px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.22);
    }
    .toolbar-group {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #1e293b;
      padding: 3px;
      border-radius: 7px;
      border: 1px solid #334155;
    }
    .toolbar-btn {
      background: transparent;
      color: #cbd5e1;
      border: 1px solid transparent;
      padding: 5px 10px;
      border-radius: 5px;
      font-weight: 600;
      font-size: 11px;
      cursor: pointer;
    }
    .toolbar-btn:hover {
      color: #ffffff;
      background: #334155;
    }
    .btn-print {
      background: #dc2626;
      color: #ffffff;
      border: none;
      padding: 7px 16px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-print:hover { background: #b91c1c; }
    .btn-close {
      background: #334155;
      color: #ffffff;
      border: none;
      padding: 7px 12px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      margin-left: 6px;
    }
    .btn-close:hover { background: #475569; }

    .poster-page {
      background: #ffffff;
      width: 100%;
      max-width: 297mm;
      min-height: 196mm;
      margin: 14px auto;
      padding: 12px 16px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.08);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    /* TOP COLOR BAR & HEADER */
    .top-color-bar {
      display: flex;
      height: 5px;
      width: 100%;
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 8px;
    }
    .top-bar-seg1 { width: 52%; background-color: var(--brand-primary); }
    .top-bar-seg2 { width: 28%; background-color: var(--brand-gold); }
    .top-bar-seg3 { width: 20%; background-color: var(--brand-secondary); }

    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 6px;
      border-bottom: 2px solid var(--brand-primary);
    }
    .header-brand {
      font-size: 10.5px;
      font-weight: 800;
      color: var(--brand-gold);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      line-height: 1.2;
    }
    .header-title {
      font-size: 21px;
      font-weight: 900;
      color: var(--brand-primary);
      letter-spacing: -0.02em;
      line-height: 1.05;
      margin: 1px 0 3px 0;
    }
    .header-sub-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .header-sub-pill {
      display: inline-block;
      background-color: var(--brand-primary);
      color: #ffffff;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      padding: 2.5px 9px;
      border-radius: 4px;
    }
    .header-month-pill {
      display: inline-block;
      background-color: #fdf6e3;
      color: #725210;
      border: 1px solid #c59b27;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      padding: 2px 9px;
      border-radius: 4px;
    }
    .header-logo-wrap { text-align: right; }
    .header-logo-img {
      height: 42px;
      max-width: 210px;
      object-fit: contain;
    }

    /* LEGEND STRIP */
    .legend-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 5px;
      margin-top: 6px;
      padding: 4px 8px;
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 5px;
    }
    .legend-pills {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 5px;
    }
    .legend-title {
      font-size: 8.5px;
      font-weight: 800;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-right: 2px;
    }
    .legend-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 8.5px;
      font-weight: 700;
      padding: 1.5px 7px;
      border-radius: 999px;
      border: 1px solid transparent;
      white-space: nowrap;
    }
    .legend-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      display: inline-block;
      flex-shrink: 0;
    }
    .legend-count {
      font-size: 8.5px;
      font-weight: 700;
      color: var(--brand-primary);
      background-color: #e8eefb;
      padding: 2px 8px;
      border-radius: 999px;
      white-space: nowrap;
    }

    /* 3 COLUMNS GRID */
    .grid-container {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      column-gap: 12px;
      margin-top: 8px;
      margin-bottom: 10px;
      align-items: start;
    }
    .col-wrap { width: 100%; }
    .schedule-tbl {
      width: 100%;
      border-collapse: collapse;
      font-size: 9px;
      border: 1px solid #cbd5e1;
    }
    .schedule-tbl th {
      background-color: var(--th-bg);
      color: var(--th-text);
      font-weight: 800;
      font-size: 9.5px;
      letter-spacing: 0.04em;
      padding: 5px 7px;
      text-transform: uppercase;
      border-bottom: 2.5px solid var(--th-border);
      border-right: 1px solid rgba(255,255,255,0.25);
    }
    .schedule-tbl th:last-child { border-right: none; }
    .schedule-tbl th.th-agenda { text-align: left; }
    .schedule-tbl th.th-waktu { text-align: right; width: 88px; white-space: nowrap; }

    /* DATE HEADER ROW */
    .date-header-row td {
      background-color: var(--date-bg);
      color: var(--date-text);
      font-weight: 800;
      font-size: 9.5px;
      letter-spacing: 0.02em;
      padding: 3.5px 7px;
      border-top: 1px solid var(--date-border);
      border-bottom: 1px solid var(--date-border);
      border-left: 3.5px solid var(--date-accent);
      text-transform: uppercase;
    }
    .date-header-row.is-sunday td {
      background-color: #fee2e2;
      color: #991b1b;
      border-left-color: #dc2626;
      border-color: #fecaca;
    }
    .date-header-row.is-tentatif td {
      background-color: #fef3c7;
      color: #92400e;
      border-left-color: #d97706;
    }
    .date-header-cell {
      padding: 3px 7px !important;
    }
    .date-header-flex {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    .date-count-pill {
      font-size: 7.5px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 999px;
      background-color: rgba(255,255,255,0.85);
      color: inherit;
    }

    /* ITEM ROWS */
    .item-row td {
      padding: 2.5px 6px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: middle;
      line-height: 1.24;
    }
    .item-agenda-cell {
      color: #0f172a;
      font-weight: 600;
      font-size: 8.6px;
    }
    .item-title-line {
      display: flex;
      align-items: flex-start;
      gap: 4px;
    }
    .item-dot {
      width: 5.5px;
      height: 5.5px;
      border-radius: 50%;
      margin-top: 2.8px;
      flex-shrink: 0;
    }
    .item-title {
      color: #0f172a;
      font-weight: 700;
      flex: 1 1 auto;
    }
    .item-room-inline {
      font-size: 7.4px;
      font-weight: 600;
      opacity: 0.78;
    }
    .item-status-pill {
      font-size: 7px;
      font-weight: 800;
      padding: 0.5px 4px;
      border-radius: 3px;
      text-transform: uppercase;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .item-time-cell {
      text-align: right;
      font-weight: 700;
      font-size: 8.4px;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
      padding-left: 4px;
    }

    /* MONTHLY GRID VIEW */
    .view-grid {
      margin-top: 8px;
      margin-bottom: 10px;
    }
    .cal-grid-tbl {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      border: 1px solid #cbd5e1;
    }
    .cal-grid-tbl th {
      background-color: var(--th-bg);
      color: var(--th-text);
      font-size: 9.5px;
      font-weight: 800;
      letter-spacing: 0.05em;
      padding: 5px 4px;
      border: 1px solid rgba(255,255,255,0.22);
      border-bottom: 2.5px solid var(--th-border);
      text-align: center;
    }
    .cal-grid-tbl th.th-sunday { background-color: #991b1b; }
    .cal-grid-tbl th.th-saturday { background-color: var(--brand-secondary); }
    .cal-cell {
      height: 66px;
      vertical-align: top;
      border: 1px solid #cbd5e1;
      padding: 3px 4px;
      background-color: #ffffff;
    }
    .cal-cell.is-empty { background-color: #f8fafc; }
    .cal-cell.is-sunday { background-color: #fef2f2; }
    .cal-cell.is-saturday { background-color: #f8fafc; }
    .cal-day-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2px;
    }
    .cal-day-num {
      font-size: 9.5px;
      font-weight: 800;
      color: #334155;
    }
    .cal-day-num.sun-num { color: #dc2626; }
    .cal-day-badge {
      font-size: 7.5px;
      font-weight: 800;
      background-color: var(--brand-primary);
      color: #ffffff;
      padding: 0 4px;
      border-radius: 999px;
    }
    .cal-chip-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .cal-chip {
      font-size: 7.8px;
      line-height: 1.2;
      padding: 1.5px 4px;
      border-radius: 3px;
      font-weight: 600;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    .cal-chip-time {
      font-weight: 800;
      margin-right: 3px;
    }
    .cal-more {
      font-size: 7.5px;
      font-weight: 700;
      color: #475569;
      padding-left: 3px;
    }
    .cal-extra-strip {
      margin-top: 6px;
      padding: 4px 8px;
      background-color: #fffbeb;
      border: 1px solid #fcd34d;
      border-radius: 4px;
      font-size: 8.5px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 5px;
    }

    /* FOOTER CARDS */
    .footer-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      column-gap: 12px;
      margin-top: auto;
      page-break-inside: avoid;
    }
    .footer-card {
      background-color: var(--footer-bg);
      color: #ffffff;
      border-radius: 5px;
      border-top: 3px solid var(--footer-accent);
      padding: 6px 10px;
    }
    .footer-card.card-right {
      background-color: var(--brand-secondary);
    }
    .card-title {
      font-weight: 800;
      font-size: 9.5px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 3px;
      color: #fde68a;
    }
    .card-body {
      font-size: 8.2px;
      line-height: 1.35;
      color: #f8fafc;
    }
    .card-list { margin: 0; padding-left: 14px; }
    .card-list li { margin-bottom: 2px; }
    .card-list li:last-child { margin-bottom: 0; }

    /* APPROVAL 5 BOXES */
    .approval-row {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      column-gap: 10px;
      margin-top: 5px;
      padding-top: 5px;
      border-top: 1px dashed #cbd5e1;
      page-break-inside: avoid;
    }
    .approval-box {
      text-align: center;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-top: 2.5px solid var(--brand-primary);
      border-radius: 4px;
      padding: 3px 6px 4px 6px;
    }
    .approval-label {
      font-size: 8px;
      font-weight: 800;
      color: var(--brand-primary);
      min-height: 10px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .approval-space { height: 22px; }
    .approval-line {
      border-bottom: 1px dashed #94a3b8;
      margin: 0 4px 3px 4px;
    }
    .approval-name {
      font-size: 8.5px;
      font-weight: 600;
      color: #0f172a;
      min-height: 11px;
    }
    .approval-role {
      font-size: 8px;
      color: #475569;
      font-weight: 600;
      margin-top: 1px;
      min-height: 10px;
    }

    @media print {
      .no-print-bar { display: none !important; }
      body {
        background: #ffffff !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .poster-page {
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        width: 100% !important;
        max-width: 100% !important;
        min-height: 100% !important;
        border: none !important;
      }
    }
  </style>
</head>
<body data-theme="${r}" data-layout="poster">
  <div class="no-print-bar">
    <div style="font-weight:700; font-size:12.5px; display:flex; align-items:center; gap:8px;">
      <span>Pratinjau Kalender PDF Berwarna &mdash; Merdeka Gold Resources / Pani Gold Project</span>
    </div>
    <div style="display:flex; flex-wrap:wrap; align-items:center; gap:8px;">
      <div class="toolbar-group" title="Pilih Tampilan Kalender">
        <button id="btn-layout-poster" type="button" class="toolbar-btn" onclick="document.body.dataset.layout='poster'">Daftar 3 Kolom</button>
        <button id="btn-layout-grid" type="button" class="toolbar-btn" onclick="document.body.dataset.layout='grid'">Kalender Grid</button>
      </div>
      <div class="toolbar-group" title="Pilih Tema Warna PDF">
        <button id="btn-theme-mgr" type="button" class="toolbar-btn" onclick="document.body.dataset.theme='mgr'">Warna MGR</button>
        <button id="btn-theme-green" type="button" class="toolbar-btn" onclick="document.body.dataset.theme='green'">Hijau PGP</button>
      </div>
      <button class="btn-print" onclick="window.print()">
        <span>Cetak / Simpan PDF</span>
      </button>
      <button class="btn-close" onclick="window.close()">Tutup</button>
    </div>
  </div>

  <div class="poster-page">
    <div>
      <div class="top-color-bar">
        <div class="top-bar-seg1"></div>
        <div class="top-bar-seg2"></div>
        <div class="top-bar-seg3"></div>
      </div>

      <div class="header-row">
        <div>
          <div class="header-brand">MERDEKA GOLD RESOURCES &bull; PANI GOLD PROJECT</div>
          <div class="header-title">JADWAL PELATIHAN</div>
          <div class="header-sub-wrap">
            <span class="header-sub-pill">${a}</span>
            <span class="header-month-pill">${g}</span>
          </div>
        </div>
        <div class="header-logo-wrap">
          <img src="${MGR_LOGO_BASE64}" onerror="this.onerror=null;this.src='Logo-MGR-Long-default.png';" alt="Merdeka Gold Resources" class="header-logo-img">
        </div>
      </div>

      <div class="legend-bar">
        <div class="legend-pills">
          <span class="legend-title">Kategori:</span>
          ${R}
        </div>
        <span class="legend-count">${n.length} Sesi Terjadwal &bull; ${g}</span>
      </div>

      <div class="view-poster">
        <div class="grid-container">
          ${L}
          ${B}
          ${P}
        </div>
      </div>

      <div class="view-grid">
        ${A}
      </div>
    </div>

    <div>
      <div class="footer-row">
        <div class="footer-card">
          <div class="card-title">CATATAN PENTING</div>
          <div class="card-body">
            <ul class="card-list">
              <li>Karyawan yang belum memenuhi persyaratan CRS wajib mengikuti pelatihan sesuai jadwal. Silakan berkoordinasi dengan admin departemen masing-masing, atasan langsung dan tim Learning &amp; Development.</li>
              <li>Semua kegiatan training dilaksanakan di Gold Room, Pioneer. Jika ada perubahan waktu dan tempat, akan diinformasikan lebih lanjut.</li>
            </ul>
          </div>
        </div>
        <div class="footer-card card-right">
          <div class="card-title">INFORMASI &amp; BANTUAN</div>
          <div class="card-body">
            <div style="margin-bottom: 3px;">Untuk pertanyaan atau pengajuan kebutuhan training yang belum tersedia pada jadwal bulanan, silakan hubungi:</div>
            <ul class="card-list">
              <li>Email: <span style="font-weight: 700;">pani.training@merdekacoppergold.com</span></li>
              <li>S. Mohi: <span style="font-weight: 700;">0852 4074 7436</span></li>
              <li>Fadhila: <span style="font-weight: 700;">0822-9048-5633</span></li>
            </ul>
          </div>
        </div>
      </div>

      <!-- APPROVAL 5 BOXES (DI BAWAH CATATAN PENTING & INFORMASI) -->
      <div class="approval-row">
        <div class="approval-box">
          <div class="approval-label">Created By:</div>
          <div class="approval-space"></div>
          <div class="approval-line"></div>
          <div class="approval-name">( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )</div>
          <div class="approval-role">LnD Officer HR Departement</div>
        </div>
        <div class="approval-box">
          <div class="approval-label">&nbsp;</div>
          <div class="approval-space"></div>
          <div class="approval-line"></div>
          <div class="approval-name">( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )</div>
          <div class="approval-role">&nbsp;</div>
        </div>
        <div class="approval-box">
          <div class="approval-label">&nbsp;</div>
          <div class="approval-space"></div>
          <div class="approval-line"></div>
          <div class="approval-name">( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )</div>
          <div class="approval-role">&nbsp;</div>
        </div>
        <div class="approval-box">
          <div class="approval-label">&nbsp;</div>
          <div class="approval-space"></div>
          <div class="approval-line"></div>
          <div class="approval-name">( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )</div>
          <div class="approval-role">&nbsp;</div>
        </div>
        <div class="approval-box">
          <div class="approval-label">&nbsp;</div>
          <div class="approval-space"></div>
          <div class="approval-line"></div>
          <div class="approval-name">( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )</div>
          <div class="approval-role">&nbsp;</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`}window.generateCalendarPdfHtml=generateCalendarPdfHtml;function generateSingleSchedulePdfHtml(e){if(!e)return"";const n=new Date,t=n.toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})+" "+String(n.getHours()).padStart(2,"0")+":"+String(n.getMinutes()).padStart(2,"0")+" WITA",a=e.is_request||/request/i.test(e.batch||"")||/REQ-/i.test(e.id_jadwal||""),r=e.start_hour?`${e.start_hour} WITA`:e.start?"08:00 WITA":"Tentatif",l=e.room||"Gold Room / Diklat PGP",i=Number(e.kuota)||0,s=Array.isArray(e.peserta)?e.peserta:[],o=s.length||Number(e.total_terdaftar)||0,c=String(e.status||"Buka").trim(),d=c.toLowerCase(),u=/selesai|done/.test(d)?"background:#dcfce7; color:#065f46; border:1px solid #86efac;":/berlangsung|ongoing/.test(d)?"background:#e0f2fe; color:#0369a1; border:1px solid #7dd3fc;":/penuh|tutup|full|closed/.test(d)?"background:#ffedd5; color:#9a3412; border:1px solid #fdba74;":"background:#dbeafe; color:#1e40af; border:1px solid #93c5fd;",m=s.length>0?s.map((b,h)=>{const p=typeof b=="string"?b:b.nama||b.name||"-",f=typeof b=="object"&&(b.perusahaan||b.company)||"-",g=typeof b=="object"&&(b.pic_pendaftaran||b.pic)||"",y=typeof b=="object"&&(b.departemen||b.dept)||"-";return`
            <tr style="border-bottom:1px solid #e2e8f0; font-size:11px; background:${h%2===1?"#f8fafc":"#ffffff"};">
              <td style="padding:6px 8px; text-align:center; color:#64748b;">${h+1}</td>
              <td style="padding:6px 8px; font-weight:600; color:#0f172a;">${escapeHtml(p)}</td>
              <td style="padding:6px 8px; color:#334155;">
                ${escapeHtml(f)}
                ${g?`<div style="font-size:10px; color:#0284c7; font-weight:500;">PIC: ${escapeHtml(g)}</div>`:""}
              </td>
              <td style="padding:6px 8px; color:#475569;">${escapeHtml(y)}</td>
              <td style="padding:6px 8px; text-align:center;"><span style="display:inline-block; padding:2px 8px; border-radius:999px; font-size:10px; font-weight:700; background:#dcfce7; color:#15803d;">Terdaftar</span></td>
            </tr>
          `}).join(""):'<tr><td colspan="5" style="padding:14px; text-align:center; color:#94a3b8; font-style:italic;">Belum ada peserta terdaftar dalam rincian jadwal ini.</td></tr>';return`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>Detail Pelatihan - ${escapeHtml(e.agenda||"Pelatihan")}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 14mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; font-size: 11.5px; line-height: 1.4; }
    .no-print-bar { position: sticky; top: 0; background: #0f172a; color: #fff; padding: 10px 16px; border-radius: 8px; margin-bottom: 18px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .btn-print { background: #dc2626; color: #fff; border: none; padding: 8px 18px; border-radius: 6px; font-weight: 700; font-size: 12px; cursor: pointer; }
    .btn-print:hover { background: #b91c1c; }
    .btn-close { background: #334155; color: #fff; border: none; padding: 8px 14px; border-radius: 6px; font-size: 12px; cursor: pointer; }
    .top-stripe { display: flex; height: 5px; width: 100%; border-radius: 3px; overflow: hidden; margin-bottom: 10px; }
    .header-box { border-bottom: 2px solid #0037b0; padding-bottom: 10px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
    .table-spec { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .table-spec td { padding: 7px 10px; border: 1px solid #cbd5e1; }
    .table-spec td.label { width: 22%; background: #eff6ff; font-weight: 700; color: #1e3a8a; }
    .table-spec td.val { width: 28%; color: #0f172a; font-weight: 500; }
    .notice-box { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 10px 14px; border-radius: 4px; margin-top: 14px; margin-bottom: 20px; }
    .sign-row { display: flex; justify-content: space-between; margin-top: 30px; page-break-inside: avoid; }
    .sign-box { width: 30%; text-align: center; }
    .sign-space { height: 55px; }
    .sign-name { font-weight: 700; border-top: 1px dashed #94a3b8; padding-top: 4px; }
    @media print { .no-print-bar { display: none !important; } body { padding: 0; background: #fff !important; } }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div style="font-weight:600;">Pratinjau Dokumen Jadwal &mdash; Pani Gold Project</div>
    <div style="display:flex; gap:8px;">
      <button class="btn-print" onclick="window.print()">Simpan sebagai PDF / Cetak</button>
      <button class="btn-close" onclick="window.close()">Tutup</button>
    </div>
  </div>
  <div class="top-stripe">
    <div style="width:52%; background:#0037b0;"></div>
    <div style="width:28%; background:#9D7828;"></div>
    <div style="width:20%; background:#1e6b3b;"></div>
  </div>
  <div class="header-box">
    <div>
      <div style="font-size:10px; color:#9D7828; font-weight:800; letter-spacing:0.04em;">PT PANI BERSAMA TAMBANG &bull; PT PUNCAK EMAS TANI SEJAHTERA</div>
      <div style="font-size:18px; font-weight:900; color:#0037b0; margin-top:2px;">LEMBAR JADWAL &amp; RINCIAN PELATIHAN</div>
      <div style="font-size:12px; font-weight:700; color:#0f766e;">Learning &amp; Development Department</div>
    </div>
    <div style="text-align:right; font-size:10px; color:#475569;">
      <div>Kode: <strong style="color:#0037b0;">${escapeHtml(e.id_jadwal||e.uid||"-")}</strong></div>
      <div>Dicetak: ${t}</div>
    </div>
  </div>
  <table class="table-spec">
    <tr>
      <td class="label">Program Pelatihan</td>
      <td class="val" colspan="3" style="font-size:13px; font-weight:800; color:#0037b0; background:#f8fafc;">${escapeHtml(e.agenda||"-")}</td>
    </tr>
    <tr>
      <td class="label">Tanggal Pelaksanaan</td>
      <td class="val"><strong>${escapeHtml(e.start||"TBA")}</strong>${e.end&&e.end!==e.start?" s/d "+escapeHtml(e.end):""}</td>
      <td class="label">Jam Pelaksanaan</td>
      <td class="val"><strong style="color:#0369a1;">${r}</strong></td>
    </tr>
    <tr>
      <td class="label">Ruangan Pelatihan</td>
      <td class="val"><strong>${escapeHtml(l)}</strong></td>
      <td class="label">Durasi Pelatihan</td>
      <td class="val">${escapeHtml(e.duration||"1 Hari")}</td>
    </tr>
    <tr>
      <td class="label">Instruktur / PIC</td>
      <td class="val">${escapeHtml(e.pic||"Tim L&D Pani Gold Project")}</td>
      <td class="label">Kapasitas / Kuota</td>
      <td class="val">${i>0?i+" Kursi (Terdaftar: "+o+" Peserta)":o+" Peserta Terdaftar"}</td>
    </tr>
    <tr>
      <td class="label">Batch / Kategori</td>
      <td class="val">${escapeHtml(e.batch||(a?"Training Request":"Reguler"))}</td>
      <td class="label">Status Jadwal</td>
      <td class="val"><span style="display:inline-block; padding:2px 10px; border-radius:999px; font-size:10.5px; font-weight:800; ${u}">${escapeHtml(c)}</span></td>
    </tr>
    ${e.deskripsi?`<tr><td class="label">Materi / Deskripsi</td><td class="val" colspan="3" style="color:#334155;">${escapeHtml(e.deskripsi)}</td></tr>`:""}
  </table>
  <div style="font-size:12px; font-weight:800; color:#0f172a; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
    <span>Daftar Peserta Terdaftar (${o} Pekerja)</span>
  </div>
  <table style="width:100%; border-collapse:collapse; margin-bottom:14px;">
    <thead>
      <tr style="background:#0f3b7a; font-size:10.5px; text-transform:uppercase; color:#ffffff; border-bottom:2px solid #9D7828;">
        <th style="padding:7px 6px; border:1px solid #1e40af; width:5%;">No</th>
        <th style="padding:7px 8px; border:1px solid #1e40af; text-align:left; width:30%;">Nama Peserta</th>
        <th style="padding:7px 8px; border:1px solid #1e40af; text-align:left; width:30%;">Perusahaan &amp; PIC</th>
        <th style="padding:7px 8px; border:1px solid #1e40af; text-align:left; width:23%;">Departemen</th>
        <th style="padding:7px 6px; border:1px solid #1e40af; width:12%;">Status</th>
      </tr>
    </thead>
    <tbody>${m}</tbody>
  </table>
  <div class="notice-box">
    <div style="font-weight:700; color:#15803d; margin-bottom:3px;">CATATAN KESEPAKATAN BERSAMA:</div>
    <div style="color:#166534; font-size:11px;">
      1. Notifikasi jadwal resmi dikirimkan ke email pekerja maksimal <strong>tanggal 25</strong> setiap bulannya.<br>
      2. Jadwal ini telah <strong>disepakati bersama antara Trainer, Head of Department (HOD), serta Tim LnD Pani Gold Project</strong>.<br>
      3. Peserta wajib hadir 10 menit sebelum jam mulai yang tertera di ruangan masing-masing.
    </div>
  </div>
  <div class="sign-row">
    <div class="sign-box">
      <div>Disiapkan Oleh,</div><div class="sign-space"></div>
      <div class="sign-name">Tim L&amp;D Pani</div>
      <div style="font-size:10px; color:#64748b;">Learning &amp; Development</div>
    </div>
    <div class="sign-box">
      <div>Diketahui Oleh,</div><div class="sign-space"></div>
      <div class="sign-name">Trainer / Instruktur</div>
      <div style="font-size:10px; color:#64748b;">Lead Trainer</div>
    </div>
    <div class="sign-box">
      <div>Disetujui Oleh,</div><div class="sign-space"></div>
      <div class="sign-name">Head of Department (HOD)</div>
      <div style="font-size:10px; color:#64748b;">Departemen Terkait</div>
    </div>
  </div>
</body>
</html>`}window.generateSingleSchedulePdfHtml=generateSingleSchedulePdfHtml;function downloadTrainingCalendarPdf(e="internal"){let t=(e==="internal"?LIVE_SCHEDULES||[]:window.EXTERNAL_ITEMS||[]).filter(r=>r&&!/batal/i.test(r.status||""));if(typeof currentCalendarMonth=="number"&&typeof currentCalendarYear=="number"){const r=t.filter(l=>{const i=parseDateString(l.start)||parseDateString(l.start_date);return i&&i.month-1===currentCalendarMonth&&i.year===currentCalendarYear});r.length>0&&(t=r)}if(!t.length){showToast("info","Data Kosong","Belum ada jadwal aktif untuk diekspor ke format PDF.");return}t.sort((r,l)=>(r.start||"9999").localeCompare(l.start||"9999"));const a=generateCalendarPdfHtml(e,t);openPdfPrintWindow(a,`Kalender_Pelatihan_PGP_${e}`),showToast("success","Pratinjau PDF Terbuka","Jendela cetak / simpan sebagai PDF siap digunakan.")}window.downloadTrainingCalendarPdf=downloadTrainingCalendarPdf;function downloadSingleSchedulePdf(e){const n=Array.isArray(window.EXTERNAL_ITEMS)?window.EXTERNAL_ITEMS:[],t=(LIVE_SCHEDULES||[]).find(r=>r.id_jadwal===e||r.agenda===e)||n.find(r=>r.uid===e||r.id_jadwal===e||r.agenda===e);if(!t){showToast("warning","Jadwal Tidak Ditemukan","Tidak dapat menemukan rincian jadwal untuk diekspor ke PDF.");return}const a=generateSingleSchedulePdfHtml(t);openPdfPrintWindow(a,`Jadwal_${(t.agenda||"Pelatihan").replace(/[^a-zA-Z0-9_-]/g,"_")}`),showToast("success","Pratinjau PDF Terbuka",`Lembar rincian jadwal "${t.agenda}" siap dicetak / disimpan ke PDF.`)}window.downloadSingleSchedulePdf=downloadSingleSchedulePdf,document.addEventListener("DOMContentLoaded",function(){generateRegNumber(),updateCalendarPeriod(currentCalendarYear,currentCalendarMonth),updateExtCalendarPeriod(extCalendarYear,extCalendarMonth),document.querySelectorAll(".view-tab-btn").forEach(r=>{r.addEventListener("click",function(){const l=this.getAttribute("data-target");l&&switchCalendarView(l)})});var n=(window.location.hash||"").replace("#","");n==="waiting-list"?(switchPageTab("jadwal"),setTimeout(function(){typeof openWaitingListModal=="function"&&openWaitingListModal()},350)):switchPageTab(n||"beranda"),window.addEventListener("hashchange",function(){var r=(window.location.hash||"").replace("#","");r==="waiting-list"?typeof openWaitingListModal=="function"&&openWaitingListModal():switchPageTab(r||"beranda")});const t=document.getElementById("header-quick-search");t&&t.addEventListener("input",function(){const r=this.value.toLowerCase().trim();document.querySelectorAll("#participantTableBody tr:not([data-is-example])").forEach(i=>{const s=Array.from(i.querySelectorAll("input")).map(o=>o.value).join(" ").toLowerCase();i.style.display=s.includes(r)?"":"none"});const l=document.getElementById("schedule-search-input");l&&(l.value=this.value,filterSchedules())}),document.addEventListener("keydown",function(r){r.key==="Escape"&&(typeof toggleProgramCombobox=="function"&&toggleProgramCombobox(!1),typeof closeAdminDropdown=="function"&&closeAdminDropdown(),typeof closeAdminDeleteModal=="function"&&closeAdminDeleteModal(),typeof closeAdminScheduleModal=="function"&&closeAdminScheduleModal(),typeof closeAdminLoginModal=="function"&&closeAdminLoginModal(),closeTrainingDetailModal(),closeModal(),closeHelpCenterModal())}),document.addEventListener("click",function(r){const l=document.getElementById("training-program-combobox-container");l&&!l.contains(r.target)&&typeof toggleProgramCombobox=="function"&&toggleProgramCombobox(!1);const i=document.getElementById("training-detail-modal");i&&r.target===i&&closeTrainingDetailModal();const s=document.getElementById("confirmationModal");s&&r.target===s&&closeModal();const o=document.getElementById("help-center-modal");o&&r.target===o&&closeHelpCenterModal();const c=document.getElementById("admin-login-modal");c&&r.target===c&&typeof closeAdminLoginModal=="function"&&closeAdminLoginModal();const d=document.getElementById("admin-schedule-modal");d&&r.target===d&&typeof closeAdminScheduleModal=="function"&&closeAdminScheduleModal();const u=document.getElementById("admin-delete-modal");u&&r.target===u&&typeof closeAdminDeleteModal=="function"&&closeAdminDeleteModal()}),["startDateInput","endDateInput","trainingVenueInput","trainingHourInput","courseCapacityInput"].forEach(r=>{const l=document.getElementById(r);l&&(l.readOnly=!0,l.classList.add("bg-surface-container-low","cursor-not-allowed"),l.addEventListener("click",()=>{l.readOnly&&!isCustomTrainingModeActive&&showToast("info","Jadwal Terkunci Otomatis",'Bidang ini terisi otomatis dari modul yang dipilih. Untuk mengisi nama pelatihan & tanggal secara manual, klik tab "Request di Luar Jadwal".')}))}),window.addEventListener("unhandledrejection",r=>{console.error(r.reason),showToast("warning","Terjadi Kesalahan","Aksi gagal diproses. Muat ulang halaman jika berlanjut.")}),window.addEventListener("error",r=>console.error(r.error||r.message)),loadDraft();const a=document.getElementById("footer-year");a&&(a.textContent=new Date().getFullYear()),document.querySelectorAll("[data-social]").forEach(r=>{const l=SITE_LINKS[r.dataset.social];l?(r.href=l,r.target="_blank",r.rel="noopener noreferrer"):r.addEventListener("click",i=>i.preventDefault())}),initAmbassador(),setTimeout(()=>{document.documentElement.classList.add("booted");const r=document.getElementById("splash");r&&r.remove()},60),fetchAllDatabaseData()});
