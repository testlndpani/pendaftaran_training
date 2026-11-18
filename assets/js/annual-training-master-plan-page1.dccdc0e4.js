const API_URL="https://script.google.com/macros/s/AKfycbxb_YaLMPz-vK06QOJBhmD1zlZhOgaQimytAf03Mn8hRjsf4hhN_8Tc0W7nt7LNLnKh/exec",SPREADSHEET_ID="1Y5IQUSN84p2Os1e9wxraDIfZF6UfOql4Y5EdXbv850A",SHEET_ATMP_NAME="ATMP",SHEET_ATMP_GID="gid=91071185",SHEET_JADWAL_NAME="Jadwal Pelatihan",SHEET_JADWAL_GID="gid=241528122",SHEET_PENDAFTARAN_NAME="Data Pendaftaran",MGR_LOGO_FALLBACK="assets/logo.webp",MONTH_NAMES=["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"],MONTH_SHORT=["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"],CATEGORIES=[{key:"K3 & Safety",color:"#9D7828",bgClass:"bg-amber-50 text-amber-900 border-amber-200",barClass:"bg-[#9D7828]"},{key:"Teknis & Sertifikasi",color:"#059669",bgClass:"bg-emerald-50 text-emerald-900 border-emerald-200",barClass:"bg-emerald-600"},{key:"IT & Sistem",color:"#4e45d5",bgClass:"bg-indigo-50 text-indigo-900 border-indigo-200",barClass:"bg-secondary"},{key:"Leadership & Manajemen",color:"#004870",bgClass:"bg-sky-50 text-sky-900 border-sky-200",barClass:"bg-tertiary"},{key:"Umum",color:"#0037b0",bgClass:"bg-blue-50 text-blue-900 border-blue-200",barClass:"bg-primary"}];let DATA_SOURCE="atmp",ALL_RAW_SCHEDULES=[],SELECTED_YEAR=new Date().getFullYear(),ACTIVE_VIEW="matrix",MATRIX_GROUPING="program",SELECTED_MONTH_FILTER=null,CHART_METRIC="sessions",GANTT_SCALE="active",QUARTER_HIDE_EMPTY=!0,CURRENT_MODAL_ITEM=null,__gvizCounter=0;const ACTUAL_BUDGET_PER_PAX=!0;(function(){["header-brand-logo","gate-brand-logo"].forEach(a=>{const n=document.getElementById(a);n&&(n.onerror=function(){this.onerror=null,this.src=MGR_LOGO_FALLBACK})});const e=document.getElementById("footer-year");e&&(e.textContent=new Date().getFullYear())})();function escapeHtml(t){return t==null?"":String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function showToast(t,e,a){const n=document.getElementById("toast-container");if(!n)return;const s={success:"bg-emerald-50 border-emerald-300 text-emerald-950",warning:"bg-amber-50 border-amber-300 text-amber-950",error:"bg-red-50 border-red-300 text-red-950",info:"bg-blue-50 border-blue-300 text-blue-950"},r={success:"check_circle",warning:"warning",error:"error",info:"info"},l=document.createElement("div");l.className=`p-3.5 rounded-xl border shadow-lg flex items-start gap-2.5 text-xs transition-all ${s[t]||s.info}`,l.innerHTML=`
        <span class="material-symbols-outlined text-[18px] shrink-0 mt-0.5">${r[t]||"info"}</span>
        <div class="flex-1 min-w-0">
          <div class="font-bold">${escapeHtml(e)}</div>
          <div class="opacity-90 mt-0.5">${escapeHtml(a)}</div>
        </div>
      `,n.appendChild(l),setTimeout(()=>{l.style.opacity="0",setTimeout(()=>l.remove(),250)},4e3)}function maskFromEnd(t,e){const a=String(t??"").trim();if(!a||a==="-")return"-";const n=a.length;if(n<=2)return a.charAt(0)+(n===2?"•":"");if(n===3)return a.slice(0,2)+"•";if(n<=5)return a.slice(0,n-2)+"••";const s=e||(n>=9?3:2),r=Math.max(2,n-s);return a.slice(0,r)+new Array(n-r+1).join("•")}function maskStringWithBlur(t,e){const a=String(t??"").trim();if(!a||a==="-")return"-";if(a.includes("•")||a.includes("*"))return escapeHtml(a).replace(/([\u2022*]+)/g,'<span class="privacy-masked-blur">$1</span>');if(e==="id"&&a.length>4){const s=Math.max(3,a.length-4);return escapeHtml(a.slice(0,s))+'<span class="privacy-masked-blur">••••</span>'}if(a.length<=3)return escapeHtml(a.slice(0,1))+'<span class="privacy-masked-blur">••</span>';const n=Math.max(2,a.length-3);return escapeHtml(a.slice(0,n))+'<span class="privacy-masked-blur">•••</span>'}function parseDateString(t){if(!t)return null;if(t instanceof Date&&!isNaN(t.getTime()))return{day:t.getDate(),month:t.getMonth()+1,year:t.getFullYear()};const e=String(t).trim();if(!e||e==="-"||/^tba$/i.test(e))return null;const a=e.match(/^Date\(\s*(\d{4})\s*,\s*(\d{1,2})\s*,\s*(\d{1,2})/i);if(a)return{day:+a[3],month:+a[2]+1,year:+a[1]};let n=e.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);if(n)return{day:+n[3],month:+n[2],year:+n[1]};if(n=e.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/),n){const c=+n[1],d=+n[2],i=+n[3];return c>12?{day:c,month:d,year:i}:{day:d,month:c,year:i}}const s={jan:1,feb:2,mar:3,apr:4,mei:5,may:5,jun:6,jul:7,agu:8,agt:8,aug:8,sep:9,okt:10,oct:10,nov:11,des:12,dec:12},r=e.split(/[\s\-\/\.]+/);if(r.length>=3){const c=parseInt(r[0],10),d=r[1].toLowerCase().substring(0,3),i=s[d]||parseInt(r[1],10),k=parseInt(r[2],10);if(!isNaN(c)&&!isNaN(i)&&i>=1&&i<=12&&!isNaN(k)&&k>1900)return{day:c,month:i,year:k}}const l=new Date(e);return isNaN(l.getTime())?null:{day:l.getDate(),month:l.getMonth()+1,year:l.getFullYear()}}function parseStartHour(t){if(t==null||t==="")return{formatted:"",minutes:9999};if(Array.isArray(t)&&t.length>=2){const r=Number(t[0])||0,l=Number(t[1])||0;return{formatted:`${String(r).padStart(2,"0")}:${String(l).padStart(2,"0")}`,minutes:r*60+l}}const e=String(t).trim(),a=e.match(/Date\(\s*\d+,\s*\d+,\s*\d+,\s*(\d+),\s*(\d+)/i);if(a){const r=parseInt(a[1],10),l=parseInt(a[2],10);return{formatted:`${String(r).padStart(2,"0")}:${String(l).padStart(2,"0")}`,minutes:r*60+l}}if(typeof t=="number"&&t>0&&t<1){const r=Math.round(t*1440),l=Math.floor(r/60)%24,c=r%60;return{formatted:`${String(l).padStart(2,"0")}:${String(c).padStart(2,"0")}`,minutes:l*60+c}}const n=e.match(/(\d{1,2})[:.](\d{2})/);if(n){const r=parseInt(n[1],10),l=parseInt(n[2],10);return{formatted:`${String(r).padStart(2,"0")}:${String(l).padStart(2,"0")}`,minutes:r*60+l}}const s=e.match(/^(\d{1,2})(?:\s*(?:wib|wita))?$/i);if(s){const r=parseInt(s[1],10);if(r>=0&&r<=24)return{formatted:`${String(r).padStart(2,"0")}:00`,minutes:r*60}}return{formatted:e,minutes:9999}}function computeItemRange(t){const e=parseDateString(t.start);if(!e)return null;const a=parseDateString(t.end)||e;let n=new Date(e.year,e.month-1,e.day),s=new Date(a.year,a.month-1,a.day);if(s<n)if(a.year<e.year){const r=parseInt(t.duration_hour,10)||t._hours||8,l=Math.max(1,Math.ceil(r/8));s=new Date(n.getTime()+(l-1)*864e5)}else{const r=n;n=s,s=r}return[n,s]}function computeDurationMetrics(t,e){let a=parseInt(t.duration_day,10),n=parseInt(t.duration_hour,10);const s=String(t.duration||"");if(isNaN(a)||a<=0){const l=s.match(/(\d+)\s*(?:hari|day)/i);l&&(a=parseInt(l[1],10))}if(isNaN(n)||n<=0){const l=s.match(/(\d+)\s*(?:jam|hour)/i);l&&(n=parseInt(l[1],10))}(isNaN(a)||a<=0)&&e&&(a=Math.max(1,Math.round((e[1]-e[0])/864e5)+1)),(isNaN(a)||a<=0)&&!isNaN(n)&&n>0&&(a=Math.max(1,Math.ceil(n/8))),(isNaN(a)||a<=0)&&(a=1),(isNaN(n)||n<=0)&&(n=a*8);const r=`${a} Hari (${n} Jam)`;return{days:a,hours:n,label:r}}function formatShortDateRange(t){if(!t)return"TBA (Menunggu Jadwal)";const[e,a]=t,n=e.getTime()===a.getTime(),s=`${e.getDate()} ${MONTH_SHORT[e.getMonth()]} ${e.getFullYear()}`;if(n)return s;if(e.getFullYear()===a.getFullYear()&&e.getMonth()===a.getMonth())return`${e.getDate()}–${a.getDate()} ${MONTH_SHORT[e.getMonth()]} ${e.getFullYear()}`;const r=`${a.getDate()} ${MONTH_SHORT[a.getMonth()]} ${a.getFullYear()}`;return`${s} – ${r}`}function formatCellPillDate(t,e){if(!t)return"TBA";const[a,n]=t;return a.getTime()===n.getTime()?`${a.getDate()} ${MONTH_SHORT[a.getMonth()]}`:a.getMonth()===n.getMonth()&&a.getFullYear()===n.getFullYear()?`${a.getDate()}–${n.getDate()}`:`${a.getDate()} ${MONTH_SHORT[a.getMonth()]}–${n.getDate()} ${MONTH_SHORT[n.getMonth()]}`}function classifyCategory(t){const e=String(t||"").toLowerCase();return/k3|hse|safety|fire|height|hegiht|hight|confined|loto|p3k|first\s*aid|induction|induksi|tambang|mine|hazard|jsa|erp|rescue|smkp|apd|ppe|investigasi|kecelakaan|hand\s*injury|manual\s*handling|ergonom|near\s*water|\bcrm\b|critical\s*risk|fatigue|fit\s*to\s*work|spotter|blindspot/i.test(e)?"K3 & Safety":/operator|alat|mekanik|listrik|electric|welding|rigging|crane|forklift|excavator|drill|blasting|geologi|plant|process|teknis|technical|bnsp|sertifikasi|kompetensi|kalibrasi|kimia|lab|power\s*tools?/i.test(e)?"Teknis & Sertifikasi":/cyber|\bit\b|sap|cloud|excel|data|power\s*bi|sistem|digital|software|komputer|jaringan/i.test(e)?"IT & Sistem":/leader|supervis|manaj|manage|communi|komunikasi|coach|mentor|hr|finance|keuangan|audit|trainer|tot|presentasi|negoti|etika|compliance/i.test(e)?"Leadership & Manajemen":"Umum"}function getCategoryMeta(t){return CATEGORIES.find(e=>e.key===t)||CATEGORIES[CATEGORIES.length-1]}const TRACKING_META={REAL:{code:"REAL",label:"Sudah Terealisasi",shortLabel:"Terealisasi",badgeCls:"bg-emerald-100 text-emerald-800 border-emerald-300",pillBadgeCls:"bg-emerald-600 text-white",pdf:{bg:"#dcfce7",text:"#065f46",border:"#10b981",pillBg:"#bbf7d0"}},PLAN:{code:"PLAN",label:"Masih Rencana",shortLabel:"Rencana",badgeCls:"bg-blue-100 text-blue-800 border-blue-300",pillBadgeCls:"bg-blue-600 text-white",pdf:{bg:"#eff6ff",text:"#1e3a8a",border:"#2563eb",pillBg:"#dbeafe"}},TMBH:{code:"TMBH",label:"Tambahan (Di Luar Plan)",shortLabel:"Tambahan",badgeCls:"bg-teal-100 text-teal-800 border-teal-300",pillBadgeCls:"bg-teal-600 text-white",pdf:{bg:"#ccfbf1",text:"#115e59",border:"#0d9488",pillBg:"#99f6e4"}},BATAL:{code:"BATAL",label:"Dibatalkan",shortLabel:"Dibatalkan",badgeCls:"bg-red-100 text-red-800 border-red-300",pillBadgeCls:"bg-red-600 text-white",pdf:{bg:"#fee2e2",text:"#991b1b",border:"#dc2626",pillBg:"#fecaca"}},"GSR-HARI":{code:"GSR-HARI",label:"Bergeser Hari",shortLabel:"Geser Hari",badgeCls:"bg-amber-100 text-amber-900 border-amber-400",pillBadgeCls:"bg-amber-500 text-white",pdf:{bg:"#fef3c7",text:"#92400e",border:"#f59e0b",pillBg:"#fde68a"}},"GSR-BLN":{code:"GSR-BLN",label:"Bergeser Bulan",shortLabel:"Geser Bulan",badgeCls:"bg-rose-100 text-rose-900 border-rose-400",pillBadgeCls:"bg-rose-600 text-white",pdf:{bg:"#ffe4e6",text:"#9f1239",border:"#e11d48",pillBg:"#fecdd3"}}};function parseTrackingDateToken(t){if(!t)return null;if(t instanceof Date&&!isNaN(t.getTime()))return new Date(t.getFullYear(),t.getMonth(),t.getDate());const e=String(t).trim();if(!e)return null;const a=e.match(/^Date\(\s*(\d{4})\s*,\s*(\d{1,2})\s*,\s*(\d{1,2})/);if(a)return new Date(parseInt(a[1],10),parseInt(a[2],10),parseInt(a[3],10));const n=e.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);if(n)return new Date(parseInt(n[1],10),parseInt(n[2],10)-1,parseInt(n[3],10));const s=e.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);if(s)return new Date(parseInt(s[3],10),parseInt(s[2],10)-1,parseInt(s[1],10));const r={jan:0,januari:0,january:0,feb:1,februari:1,february:1,mar:2,maret:2,march:2,apr:3,april:3,mei:4,may:4,jun:5,juni:5,june:5,jul:6,juli:6,july:6,agu:7,agt:7,agustus:7,aug:7,august:7,sep:8,sept:8,september:8,okt:9,oktober:9,oct:9,october:9,nov:10,november:10,nop:10,des:11,desember:11,dec:11,december:11},l=e.match(/^(\d{1,2})[\s\-\/]([A-Za-z]+)[\s\-\/](\d{2,4})/);if(l){const d=r[l[2].toLowerCase()];if(d!==void 0){let i=parseInt(l[3],10);return i<100&&(i+=2e3),new Date(i,d,parseInt(l[1],10))}}const c=Date.parse(e);if(!isNaN(c)){const d=new Date(c);return new Date(d.getFullYear(),d.getMonth(),d.getDate())}return null}function fmtShortIdDate(t){if(!t)return"";const e=["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];return`${t.getDate()} ${e[t.getMonth()]}`}function resolvePlanTracking(t,e,a){const n=String(t.status_jadwal||t.statusJadwal||"").trim(),s=String(t.status||"").trim(),r=`${n} ${s}`.trim(),l=a&&a.key==="cancelled"||/batal|cancel/i.test(r),c=!l&&(a&&a.key==="completed"||/\b(terealisasi|realisasi|terlaksana|selesai|done|completed)\b/i.test(n)),d=!l&&!c&&/tambahan|unplanned|ad[\s_-]?hoc|ekstra|extra/i.test(n),i=l?"BATAL":c?"REAL":d?"TMBH":"PLAN",k=TRACKING_META[i],b=parseTrackingDateToken(t.plan_start||t.planStart),_=parseTrackingDateToken(t.plan_end||t.planEnd)||b,h=["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];let $="",D="none",x="",f="",g="";if(b){const y=fmtShortIdDate(b)+" "+b.getFullYear(),m=_&&_.getTime()!==b.getTime()?` - ${fmtShortIdDate(_)} ${_.getFullYear()}`:"";g=y+m}if(b&&e&&e[0]){const y=new Date(e[0].getFullYear(),e[0].getMonth(),e[0].getDate()),m=Math.round((y.getTime()-b.getTime())/864e5);m!==0&&(f=`${m>0?"+":""}${m}h`,b.getFullYear()!==y.getFullYear()||b.getMonth()!==y.getMonth()?($="GSR-BLN",D="month",x=`${h[b.getMonth()]}→${h[y.getMonth()]} (${fmtShortIdDate(b)} → ${fmtShortIdDate(y)})`):($="GSR-HARI",D="day",x=`${b.getDate()}→${y.getDate()} ${h[y.getMonth()]} (${f})`))}if(!$&&e&&e[0]){const m=String(t.id_jadwal||"").trim().match(/(?:^|[^0-9])(20\d{2})(0[1-9]|1[0-2])(?:[^0-9]|$)/);if(m){const S=parseInt(m[1],10),u=parseInt(m[2],10)-1,p=e[0];(S!==p.getFullYear()||u!==p.getMonth())&&($="GSR-BLN",D="month",x=`${h[u]} ${S} → ${h[p.getMonth()]} ${p.getFullYear()} (via ID)`)}}!$&&n&&(/geser[\s_-]?bulan|pindah[\s_-]?bulan|mundur[\s_-]?bulan|maju[\s_-]?bulan|gsr[\s_-]?bln/i.test(n)?($="GSR-BLN",D="month",x=n):/geser[\s_-]?hari|geser[\s_-]?tgl|geser[\s_-]?tanggal|pindah[\s_-]?hari|reschedule|geser|gsr[\s_-]?hari/i.test(n)&&($="GSR-HARI",D="day",x=n));const o=$?TRACKING_META[$]:null;return{code:k.code,label:k.label,shortLabel:k.shortLabel,badgeCls:k.badgeCls,pillBadgeCls:k.pillBadgeCls,pdf:k.pdf,isRealized:c,isPlan:i==="PLAN",isTambahan:d,isCancelled:l,isShifted:!!$,shiftCode:$,shiftType:D,shiftLabel:o?o.label:"",shiftShortLabel:o?o.shortLabel:"",shiftBadgeCls:o?o.badgeCls:"",shiftPillBadgeCls:o?o.pillBadgeCls:"",shiftPdf:o?o.pdf:null,shiftDelta:f,shiftNote:x,planDateLabel:g,sheetTag:n}}let SELECTED_TRACKING="all";function matchesTrackingFilter(t,e){if(!e||e==="all")return!0;const a=t&&t._tracking;return a?e==="real"?a.code==="REAL":e==="plan"?a.code==="PLAN":e==="tmbh"?a.code==="TMBH":e==="batal"?a.code==="BATAL":e==="shifted"?a.isShifted:e==="gsr-hari"?a.shiftCode==="GSR-HARI":e==="gsr-bln"?a.shiftCode==="GSR-BLN":!0:!1}function setTrackingFilter(t){SELECTED_TRACKING=t||"all";const e=document.getElementById("filter-tracking");e&&e.value!==SELECTED_TRACKING&&(e.value=SELECTED_TRACKING),updateTrackingToolbarState(),applyFiltersAndRender()}function updateTrackingToolbarState(t){let e=null;Array.isArray(t)&&(e={all:t.length,real:t.filter(s=>s._tracking&&s._tracking.code==="REAL").length,plan:t.filter(s=>s._tracking&&s._tracking.code==="PLAN").length,tmbh:t.filter(s=>s._tracking&&s._tracking.code==="TMBH").length,"gsr-hari":t.filter(s=>s._tracking&&s._tracking.shiftCode==="GSR-HARI").length,"gsr-bln":t.filter(s=>s._tracking&&s._tracking.shiftCode==="GSR-BLN").length,shifted:t.filter(s=>s._tracking&&s._tracking.isShifted).length},Object.entries(e).forEach(([s,r])=>{const l=document.getElementById(`track-count-${s}`);l&&(l.textContent=r)}));const a={all:"bg-slate-900 text-white border-slate-900 font-semibold shadow-2xs",real:"bg-emerald-50 text-emerald-900 border-emerald-400 font-bold shadow-2xs",plan:"bg-blue-50 text-blue-900 border-blue-400 font-bold shadow-2xs",tmbh:"bg-teal-50 text-teal-900 border-teal-400 font-bold shadow-2xs","gsr-hari":"bg-amber-50 text-amber-900 border-amber-400 font-bold shadow-2xs","gsr-bln":"bg-rose-50 text-rose-900 border-rose-400 font-bold shadow-2xs"},n="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] cursor-pointer transition-all";document.querySelectorAll("[data-track-chip]").forEach(s=>{const r=s.getAttribute("data-track-chip"),l=r===SELECTED_TRACKING,c=document.getElementById(`track-count-${r}`),d=e?e[r]??0:c&&Number(c.textContent)||0,i=!l&&r!=="all"&&d===0?"opacity-50":"";s.setAttribute("aria-pressed",l?"true":"false"),s.className=l?`${n} ${a[r]||a.all}`:`${n} bg-white text-slate-600 border-slate-200 hover:bg-slate-50 font-medium ${i}`})}function renderTrackingBadgesHtml(t,e={}){if(!t)return"";const a=!!e.compact,n=!!e.showShiftNote,s=a?"px-1 py-0 text-[9px] leading-[1.35] rounded":"px-1.5 py-0.5 text-[10px] leading-tight rounded-md",r=t.label+(t.sheetTag?` (Sheet: ${t.sheetTag})`:"");let l=`<span class="inline-flex items-center font-extrabold tracking-wide border ${s} ${t.badgeCls}" title="${escapeHtml(r)}">${escapeHtml(t.code)}</span>`;if(t.isShifted&&t.shiftCode){const c=a?t.shiftCode:`${t.shiftCode}${t.shiftDelta?" "+t.shiftDelta:""}`,d=t.shiftLabel+(t.shiftNote?`: ${t.shiftNote}`:"");l+=`<span class="inline-flex items-center font-extrabold tracking-wide border ${s} ${t.shiftBadgeCls}" title="${escapeHtml(d)}">${escapeHtml(c)}</span>`}return n&&t.isShifted&&(t.planDateLabel||t.shiftNote)&&(l+=`<div class="text-[10px] font-semibold text-amber-800 mt-0.5 leading-tight">${escapeHtml(t.shiftNote||"Plan awal: "+t.planDateLabel)}</div>`),l}function resolveMasterStatus(t,e,a,n,s){const r=String(t.status||"").trim(),l=new Date;if(l.setHours(0,0,0,0),/batal|cancel/i.test(r))return{key:"cancelled",label:"Dibatalkan",badgeCls:"bg-red-100 text-red-800 border-red-200",pillCls:"bg-red-50 border-red-300 text-red-900",dotCls:"bg-red-600"};if(!e)return{key:"tba",label:r||"Rencana / TBA",badgeCls:"bg-slate-100 text-slate-700 border-slate-300",pillCls:"bg-slate-100 border-slate-300 text-slate-800",dotCls:"bg-slate-500"};const[c,d]=e;return d.getTime()<l.getTime()||/^selesai$/i.test(r)?{key:"completed",label:"Selesai",badgeCls:"bg-emerald-100 text-emerald-800 border-emerald-200",pillCls:"bg-emerald-50 border-emerald-300 text-emerald-950 hover:bg-emerald-100",dotCls:"bg-emerald-600"}:c.getTime()<=l.getTime()&&d.getTime()>=l.getTime()?{key:"running",label:"Berlangsung",badgeCls:"bg-sky-100 text-sky-900 border-sky-200",pillCls:"bg-sky-50 border-sky-300 text-sky-950 hover:bg-sky-100",dotCls:"bg-sky-600"}:/tutup|closed|h-1/i.test(r)||t.is_registration_closed?{key:"closed",label:/h-1/i.test(r)?"Tutup (H-1)":"Tutup",badgeCls:"bg-amber-100 text-amber-900 border-amber-300",pillCls:"bg-amber-50 border-amber-300 text-amber-950 hover:bg-amber-100",dotCls:"bg-amber-600"}:n>0&&s<=0||/penuh/i.test(r)?{key:"full",label:"Penuh",badgeCls:"bg-amber-100 text-amber-900 border-amber-300",pillCls:"bg-amber-50 border-amber-300 text-amber-950 hover:bg-amber-100",dotCls:"bg-amber-600"}:{key:"upcoming",label:r||"Buka",badgeCls:"bg-blue-100 text-primary border-blue-200",pillCls:"bg-blue-50/90 border-blue-200 text-on-surface hover:bg-primary-fixed/70",dotCls:"bg-primary"}}function parseBudgetValue(t){if(t==null||t===""||t==="-")return null;if(typeof t=="number")return isNaN(t)?null:t;let e=String(t).trim();if(!e||e==="-")return null;let a=1;/\b(?:jt|juta|miliar|milyar|m)\b/i.test(e)&&(/miliar|milyar|\bm\b/i.test(e)?a=1e9:a=1e6),e=e.replace(/rp|idr|jt|juta|miliar|milyar|\s+/gi,""),/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(e)?e=e.replace(/\./g,"").replace(",","."):/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(e)?e=e.replace(/,/g,""):e=e.replace(/[^\d.-]/g,"");const n=Number(e);return isNaN(n)?null:n*a}function formatIdr(t,e=!1){if(t==null||isNaN(t))return"-";const a=Math.abs(t),n=t<0?"-":"";if(e){if(a>=1e9)return`${n}Rp ${(a/1e9).toLocaleString("id-ID",{maximumFractionDigits:2})} M`;if(a>=1e6)return`${n}Rp ${(a/1e6).toLocaleString("id-ID",{maximumFractionDigits:1})} Jt`}return n+"Rp "+Math.round(a).toLocaleString("id-ID")}function computeCosts(t,e,a,n){const s=t!=null?t*(a||0):null;let r=null;return e!=null&&(r=ACTUAL_BUDGET_PER_PAX?e*(n||0):e),{planCost:s,actualCost:r}}function formatShortIsoDateToken(t){if(!t)return"";const e=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];return`${String(t.getDate()).padStart(2,"0")}-${e[t.getMonth()]}-${t.getFullYear()}`}function normalizeScheduleItem(t,e){const a=computeItemRange(t),n=computeDurationMetrics(t,a),s=parseStartHour(t.start_hour||t.startHour),r=Array.isArray(t.peserta)?t.peserta:[],l=t.source_sheet==="ATMP"||t.plan_participants!==void 0||DATA_SOURCE==="atmp"&&!t.is_request,c=Number(t.plan_participants!==void 0&&t.plan_participants!==""?t.plan_participants:t.kuota)||0;let d=t.actual_participants!==void 0&&t.actual_participants!==""&&t.actual_participants!==null?Math.max(0,Number(t.actual_participants)||0):r.length>0?r.length:Number(t.total_terdaftar)||0,i=t.sisa_kuota!==""&&t.sisa_kuota!=null&&!isNaN(Number(t.sisa_kuota))?Math.max(0,Number(t.sisa_kuota)):c>0?Math.max(0,c-d):0;!l&&d===0&&c>0&&t.sisa_kuota!=null&&t.sisa_kuota!==""&&(d=Math.max(0,c-i)),!l&&c>0&&r.length>0&&(i=Math.min(i,Math.max(0,c-r.length)));const k=resolveMasterStatus(t,a,d,c,i),b=classifyCategory(t.agenda),_=resolvePlanTracking(t,a,k),h=parseInt(t.year,10),$=!isNaN(h)&&h>=2020&&h<=2035?h:null,D=a?a[0].getFullYear():null,x=$||D,f=parseBudgetValue(t.budget),g=parseBudgetValue(t.actual_budget),o=computeCosts(f,g,c,d),y=a?/^Date\(/i.test(String(t.start||""))||!t.start?formatShortIsoDateToken(a[0]):String(t.start).trim():"",m=a?/^Date\(/i.test(String(t.end||""))||!t.end?formatShortIsoDateToken(a[1]):String(t.end).trim():"";return{_uid:`ITEM-${e}`,id_jadwal:String(t.id_jadwal||`ATMP-${e+1}`).trim(),agenda:String(t.agenda||"Pelatihan Tanpa Judul").trim(),batch:String(t.batch||"").trim(),pic:String(t.pic||"Tim L&D PGP").trim(),room:String(t.location||t.room||"Gold Room / Diklat").trim(),deskripsi:String(t.deskripsi||"").trim(),start:y,end:m,start_hour:s.formatted,start_minutes:s.minutes,kuota:c,sisa_kuota:i,registered:d,peserta:r,source_sheet:t.source_sheet||(l?"ATMP":"Jadwal Pelatihan"),is_atmp:l,year_col:$,_yearOverride:$,_startYear:D,_hasYearMismatch:!!($&&D&&$!==D),_budget:f,_actualBudget:g,_planCost:o.planCost,_actualCost:o.actualCost,is_request:!!t.is_request,is_synced:!!t.is_synced,synced_schedule_id:t.synced_schedule_id||"",_range:a,_year:x,_month:a?a[0].getMonth():null,_quarter:a?"Q"+(Math.floor(a[0].getMonth()/3)+1):null,_days:n.days,_hours:n.hours,_durationLabel:n.label,_dateRangeLabel:formatShortDateRange(a),_category:b,_status:k,_tracking:_}}function fetchGvizSheetJson(t,e){return new Promise(a=>{const n="__atmpGvizCb_"+Date.now()+"_"+ ++__gvizCounter,s=document.createElement("script");let r=!1;const l=()=>{try{delete window[n]}catch{window[n]=void 0}s.parentNode&&s.parentNode.removeChild(s)},c=setTimeout(()=>{r||(r=!0,l(),a(null))},15e3);window[n]=function(i){r||(r=!0,clearTimeout(c),l(),a(i&&i.status==="ok"?i:i||null))},s.onerror=function(){r||(r=!0,clearTimeout(c),l(),a(null))};const d=/^gid=\d+$/i.test(String(e||""))?`headers=1&${e}`:`headers=1&sheet=${encodeURIComponent(e)}`;s.src=`https://docs.google.com/spreadsheets/d/${t}/gviz/tq?tqx=responseHandler:${n}&${d}`,s.async=!0,(document.head||document.documentElement).appendChild(s)})}async function fetchViaGvizFallback(t=DATA_SOURCE){const e=t==="atmp",a=e?SHEET_ATMP_GID:SHEET_JADWAL_GID,n=e?SHEET_ATMP_NAME:SHEET_JADWAL_NAME;let s=await fetchGvizSheetJson(SPREADSHEET_ID,a);if((!s||!s.table||!Array.isArray(s.table.rows))&&(s=await fetchGvizSheetJson(SPREADSHEET_ID,n)),!s||!s.table||!Array.isArray(s.table.rows))return[];const r={},l={};if(!e){const L=await fetchGvizSheetJson(SPREADSHEET_ID,SHEET_PENDAFTARAN_NAME).catch(()=>null);L&&L.table&&Array.isArray(L.table.rows)&&L.table.rows.forEach(B=>{const C=B.c||[],H=Q=>(C[Q]?C[Q].v!==void 0&&C[Q].v!==null?C[Q].v:C[Q].f:"")||"",j=String(H(13)||"OK").trim();if(/ditolak|batal|reject/i.test(j))return;const F=String(H(8)).trim(),G=String(H(9)).trim();if(!F&&!G)return;const K={timestamp:String(H(0)),id_booking:String(H(1)),id_karyawan:maskFromEnd(H(2),4),nama_karyawan:maskFromEnd(H(3),3),jabatan:String(H(5)),departement:maskFromEnd(H(6),3),perusahaan:maskFromEnd(H(7),3),id_jadwal:F,nama_pelatihan:G,pic_pendaftaran:String(H(12)).trim(),validasi:j||"OK"};F?(r[F]=r[F]||[]).push(K):G&&(l[G]=l[G]||[]).push(K)})}const c=s.table.cols||[],d=(L,B)=>{for(let C=0;C<c.length;C++){const H=String(c[C].label||c[C].id||"").trim();if(L.test(H))return C}return B},i=(L,B)=>{if(B===-1||!L||B>=L.length||!L[B])return"";const C=L[B];return C.v!==void 0&&C.v!==null?C.v:C.f!==void 0&&C.f!==null?C.f:""},k=(L,B)=>{if(B===-1||!L||B>=L.length||!L[B])return"";const C=L[B];return C.f!==void 0&&C.f!==null?C.f:C.v!==void 0&&C.v!==null?C.v:""},b=(L,B)=>{const C=i(L,B);return C&&/^Date\(/i.test(String(C))?String(C):String(k(L,B)||C||"")},_=[];if(e){const L=d(/^(id_jadwal|id)/i,0),B=d(/^start$/i,1),C=d(/^end$/i,2),H=d(/^(year|tahun)$/i,3),j=d(/^(agenda|nama_pelatihan|pelatihan|program)/i,4),F=d(/^(pic|instruktur|trainer)/i,5),G=d(/^(location|room|ruangan|lokasi)/i,6),K=d(/^(batch|angkatan)/i,7),Q=d(/^(plan|kuota|quota|target)$/i,8),Z=d(/^(actual|realisasi_peserta)(?![\s_]*budget)/i,9),W=d(/^budget$/i,10),Y=d(/^(actual[\s_]?budget|realisasi[\s_]?budget|actual[\s_]?anggaran)/i,11),et=d(/^status(?![\s_]*jadwal)/i,12),X=d(/^(deskripsi|desc)/i,13),st=d(/^(status[\s_]?jadwal|realisasi|keterangan[\s_]?jadwal)/i,14),at=d(/^(plan[\s_]?start|tanggal[\s_]?rencana|jadwal[\s_]?awal|start[\s_]?awal)/i,-1),rt=d(/^(plan[\s_]?end|tanggal[\s_]?selesai[\s_]?rencana|end[\s_]?awal)/i,-1);return s.table.rows.forEach(w=>{const T=w.c||[],I=String(i(T,L)||"").trim(),z=String(i(T,j)||"").trim();if(!I&&!z)return;const E=String(i(T,et)||"").trim();if(/batal|cancel/i.test(E))return;const O=Number(i(T,Q))||0,q=i(T,Z),V=q!==""&&q!=null&&!isNaN(Number(q))?Math.max(0,Number(q)):0,tt=i(T,H);_.push({id_jadwal:I,start:b(T,B),end:b(T,C),year:tt,agenda:z,pic:String(i(T,F)||""),room:String(i(T,G)||""),location:String(i(T,G)||""),batch:String(i(T,K)||""),kuota:O,plan_participants:O,actual_participants:V,total_terdaftar:V,sisa_kuota:Math.max(0,O-V),budget:i(T,W),actual_budget:i(T,Y),status:E||"Buka",status_jadwal:st!==-1?String(i(T,st)||"").trim():"",plan_start:at!==-1?b(T,at):"",plan_end:rt!==-1?b(T,rt):"",deskripsi:String(i(T,X)||""),peserta:[],is_request:!1,source_sheet:"ATMP"})}),_}const h=d(/^(id_jadwal|id)/i,0),$=d(/^start$/i,1),D=d(/^end$/i,2),x=d(/^(duration_day|durasi_hari)/i,3),f=d(/^(duration_hour|durasi_jam)/i,4),g=d(/^(start[\s_]?hour|jam[\s_]?mulai|waktu[\s_]?mulai)/i,5),o=g!==-1,y=d(/^(agenda|nama_pelatihan|pelatihan|program)/i,o?6:5),m=d(/^(pic|instruktur|trainer)/i,o?7:6),S=d(/^(room|ruangan)/i,o?8:7),u=d(/^(batch|angkatan)/i,o?9:8),p=d(/^(kuota|quota)/i,o?10:9),v=d(/^(sisa[\s_]?kuota|sisa)/i,o?11:10),M=d(/^status(?![\s_]*jadwal)/i,o?12:11),R=d(/^(deskripsi|desc)/i,o?13:12),N=d(/^(status[\s_]?jadwal|realisasi|keterangan[\s_]?jadwal)/i,-1),A=d(/^(plan[\s_]?start|tanggal[\s_]?rencana|jadwal[\s_]?awal|start[\s_]?awal)/i,-1),P=d(/^(plan[\s_]?end|tanggal[\s_]?selesai[\s_]?rencana|end[\s_]?awal)/i,-1);return s.table.rows.forEach(L=>{const B=L.c||[],C=String(i(B,h)||"").trim(),H=String(i(B,y)||"").trim();if(!C&&!H)return;const j=String(i(B,M)||"").trim();if(/batal|cancel/i.test(j))return;const F=C&&r[C]?r[C]:!C&&H&&l[H]?l[H]:[],G=Number(i(B,p))||0,K=i(B,v),Q=K!==""&&K!=null&&!isNaN(Number(K))?Math.max(0,Number(K)):Math.max(0,G-F.length),Z=g!==-1?i(B,g)||k(B,g):"",W=parseStartHour(Z);_.push({id_jadwal:C,start:b(B,$),end:b(B,D),duration_day:i(B,x),duration_hour:i(B,f),start_hour:W.formatted,start_minutes:W.minutes,agenda:H,pic:String(i(B,m)||""),room:String(i(B,S)||""),batch:String(i(B,u)||""),kuota:G,sisa_kuota:Q,total_terdaftar:F.length,status:j||"Buka",status_jadwal:N!==-1?String(i(B,N)||"").trim():"",plan_start:A!==-1?b(B,A):"",plan_end:P!==-1?b(B,P):"",deskripsi:String(i(B,R)||""),peserta:F,is_request:!1,source_sheet:"Jadwal Pelatihan"})}),_}function updateSourceUiChrome(){const t=DATA_SOURCE==="atmp";document.querySelectorAll("[data-source-btn]").forEach(i=>{const b=i.getAttribute("data-source-btn")===DATA_SOURCE;i.className=b?`px-2.5 py-1 rounded-lg text-xs font-bold text-white cursor-pointer transition-all ${t?"bg-emerald-700":"bg-primary"}`:"px-2.5 py-1 rounded-lg text-xs font-semibold text-on-surface-variant hover:text-on-surface cursor-pointer transition-all"});const e=document.getElementById("topbar-source-badge");e&&(e.textContent=t?"Sheet ATMP":"Sheet Jadwal",e.className=t?"hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 uppercase tracking-wider shrink-0":"hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-fixed text-on-primary-fixed-variant uppercase tracking-wider shrink-0");const a=document.getElementById("page-source-badge"),n=document.getElementById("page-source-badge-text");a&&n&&(n.textContent=t?"Sheet ATMP":"Sheet Jadwal Pelatihan",a.className=t?"inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-[10.5px] font-semibold":"inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[10.5px] font-semibold");const s=document.getElementById("page-subtitle");s&&(s.textContent=t?"Ringkasan program tahunan (Jan – Des), Plan vs Actual peserta, status jadwal, dan budget.":"Ringkasan program tahunan (Jan – Des), realisasi batch, durasi belajar, dan kursi peserta.");const r=document.getElementById("request-toggle-wrap");if(r){r.classList.toggle("hidden",t);const i=document.getElementById("toggle-include-requests");t&&i&&(i.checked=!1)}const l=document.getElementById("kpi-cards-grid"),c=document.getElementById("kpi-budget-card");l&&c&&(c.classList.toggle("hidden",!t),l.className=t?"grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3.5":"grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5");const d=document.getElementById("kpi-participants-title");d&&(d.textContent=t?"Actual vs Plan Peserta":"Peserta & Kursi Buka")}let __loadSeq=0;function switchDataSource(t){if(t!=="atmp"&&t!=="jadwal"||DATA_SOURCE===t)return Promise.resolve();DATA_SOURCE=t;const e=document.getElementById("filter-room");return e&&(e.value="all"),SELECTED_MONTH_FILTER=null,SELECTED_YEAR=new Date().getFullYear(),updateSourceUiChrome(),loadMasterPlanData(!0)}async function loadMasterPlanData(t){const e=++__loadSeq;updateSourceUiChrome();const a=document.getElementById("sync-dot"),n=document.getElementById("sync-label"),s=document.getElementById("refresh-icon"),r=DATA_SOURCE==="atmp",l=r?"Sheet ATMP":"Sheet Jadwal";a&&(a.className="w-2 h-2 rounded-full bg-amber-500"),n&&(n.textContent=`Menyinkronkan ${l}...`),s&&s.classList.add("animate-spin");let c=[],d="Google Apps Script API";const i=r?fetchViaGvizFallback("atmp").catch(()=>[]):null;try{const h=new AbortController,$=setTimeout(()=>h.abort(),r?8e3:18e3);try{const D=r?`${API_URL}?action=atmp`:API_URL,x=await fetch(D,{method:"GET",signal:h.signal});if(x.ok){const f=await x.json();f&&f.status==="success"&&Array.isArray(f.data)&&f.data.length>0&&(!r||f.source==="ATMP"||f.data.every(o=>o&&o.source_sheet==="ATMP"))&&(c=f.data)}}finally{clearTimeout($)}}catch(h){console.warn("GAS API tidak terjangkau, mencoba fallback langsung ke Google Sheets GViz:",h)}if(!c.length)d=`Google Sheets GViz (${l})`,c=i?await i:await fetchViaGvizFallback(DATA_SOURCE);else if(c.some($=>$&&!$.is_request&&$.status_jadwal===void 0&&$.plan_start===void 0))try{const $=await fetchViaGvizFallback(DATA_SOURCE),D=new Map,x=new Map;$.forEach(f=>{const g=String(f.id_jadwal||"").trim().toLowerCase(),o=String(f.agenda||"").trim().toLowerCase();g&&D.set(g,f),o&&!x.has(o)&&x.set(o,f)}),c=c.map(f=>{if(!f||f.is_request)return f;const g=String(f.id_jadwal||"").trim().toLowerCase(),o=String(f.agenda||"").trim().toLowerCase(),y=g&&D.get(g)||o&&x.get(o);return y?{...f,status_jadwal:f.status_jadwal||y.status_jadwal||"",plan_start:f.plan_start||y.plan_start||"",plan_end:f.plan_end||y.plan_end||"",year:f.year!==void 0?f.year:y.year,budget:f.budget!==void 0?f.budget:y.budget,actual_budget:f.actual_budget!==void 0?f.actual_budget:y.actual_budget}:f})}catch($){console.warn("Sinkronisasi kolom tambahan GViz dilewati:",$)}if(e!==__loadSeq)return;s&&s.classList.remove("animate-spin");const k=document.getElementById("loading-skeleton");if(!c.length){a&&(a.className="w-2 h-2 rounded-full bg-red-600"),n&&(n.textContent="Gagal memuat data"),k&&(k.classList.remove("hidden"),k.innerHTML=`
            <div class="w-12 h-12 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center">
              <span class="material-symbols-outlined text-[28px]">cloud_off</span>
            </div>
            <div class="text-sm font-bold text-on-surface">Data ${l} Belum Dapat Dimuat</div>
            <div class="text-xs text-on-surface-variant max-w-md">Pastikan koneksi internet aktif dan akses Google Sheets / Apps Script tidak diblokir jaringan.</div>
            <button type="button" onclick="loadMasterPlanData(true)" class="mt-1 h-9 px-4 rounded-xl bg-primary text-on-primary text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer">
              <span class="material-symbols-outlined text-[16px]">refresh</span> Coba Lagi
            </button>
          `);return}ALL_RAW_SCHEDULES=c.filter(h=>h&&!/batal|cancel/i.test(h.status||"")).map((h,$)=>normalizeScheduleItem(h,$)),k&&k.classList.add("hidden");const b=new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"}),_=ALL_RAW_SCHEDULES.filter(h=>!h.is_request).length;a&&(a.className="w-2 h-2 rounded-full bg-emerald-600"),n&&(n.textContent=`Terhubung ${r?"ATMP":"Jadwal"} (${_} • ${b} WITA)`),rebuildYearButtonsAndAutoPick(),populateRoomFilterOptions(),applyFiltersAndRender(),t&&showToast("success","Data Tersinkron",`${_} sesi dari ${l} dimuat (${d}).`)}function getScopedBaseList(){const t=document.getElementById("toggle-include-requests")?.checked;return ALL_RAW_SCHEDULES.filter(e=>t?!0:!e.is_request)}function rebuildYearButtonsAndAutoPick(){const t=getScopedBaseList(),e={};t.forEach(l=>{l._year&&(e[l._year]=(e[l._year]||0)+1)});const a=new Date().getFullYear(),n=new Set([a-1,a,a+1,...Object.keys(e).map(Number)]),s=Array.from(n).filter(l=>!isNaN(l)&&l>=2020&&l<=2035).sort((l,c)=>l-c);if(SELECTED_YEAR!=="all"&&(!e[SELECTED_YEAR]||e[SELECTED_YEAR]===0)){const l=Object.keys(e).sort((c,d)=>e[d]-e[c])[0];l&&(SELECTED_YEAR=Number(l))}const r=document.getElementById("year-selector-group");r&&(r.innerHTML=s.map(l=>`
          <button type="button" onclick="setSelectedYear(${l})" data-year-btn="${l}" class="px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${SELECTED_YEAR===l?"font-bold bg-primary text-on-primary":"font-semibold text-on-surface-variant hover:text-on-surface"}">
            ${l}${e[l]?` <span class="opacity-75 text-[10px]">(${e[l]})</span>`:""}
          </button>
        `).join("")+`
          <button type="button" onclick="setSelectedYear('all')" data-year-btn="all" class="px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${SELECTED_YEAR==="all"?"font-bold bg-primary text-on-primary":"font-semibold text-on-surface-variant hover:text-on-surface"}">
            Semua
          </button>
        `),updateTitleForYear()}function updateTitleForYear(){const t=document.getElementById("page-main-title"),e=SELECTED_YEAR==="all"?"Multi-Tahun":SELECTED_YEAR;t&&(t.textContent=`Annual Training Master Plan ${e}`);const a=document.getElementById("matrix-panel-title");a&&(a.textContent=`Matriks Master Plan Tahunan ${e}`);const n=document.getElementById("gantt-panel-title");n&&(n.textContent=`Timeline Gantt Tahunan ${e}`)}function setSelectedYear(t){SELECTED_YEAR=t,rebuildYearButtonsAndAutoPick(),applyFiltersAndRender()}function handleIncludeRequestsToggle(){rebuildYearButtonsAndAutoPick(),populateRoomFilterOptions(),applyFiltersAndRender()}function populateRoomFilterOptions(){const t=document.getElementById("filter-room");if(!t)return;const e=t.value,a=Array.from(new Set(getScopedBaseList().map(n=>n.room).filter(Boolean))).sort((n,s)=>n.localeCompare(s));t.innerHTML=`<option value="all">Ruangan: Semua (${a.length})</option>`+a.map(n=>`<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join(""),a.includes(e)&&(t.value=e)}function doesItemMatchYear(t,e){if(e==="all"||!t._range)return!0;if(t._yearOverride)return t._yearOverride===e;const a=new Date(e,0,1),n=new Date(e,11,31,23,59,59);return t._range[0]<=n&&t._range[1]>=a}function getDisplayRangeForYear(t,e){if(!t._range)return null;if(e==="all")return t._range;if(t._hasYearMismatch&&t._yearOverride===e){const a=e-t._range[0].getFullYear(),n=s=>{const r=s.getFullYear()+a,l=new Date(r,s.getMonth()+1,0).getDate();return new Date(r,s.getMonth(),Math.min(s.getDate(),l),s.getHours(),s.getMinutes(),s.getSeconds(),s.getMilliseconds())};return[n(t._range[0]),n(t._range[1])]}return t._range}function doesItemMatchMonth(t,e,a){if(!t._range||e!=="all"&&!doesItemMatchYear(t,e))return!1;const n=e==="all"?t._range:getDisplayRangeForYear(t,e),s=e==="all"?t._range[0].getFullYear():e,r=new Date(s,a,1),l=new Date(s,a+1,0,23,59,59);return n[0]<=l&&n[1]>=r}function doesItemMatchQuarter(t,e,a){if(a==="all")return!0;if(!t._range||e!=="all"&&!doesItemMatchYear(t,e))return!1;const s={Q1:[0,2],Q2:[3,5],Q3:[6,8],Q4:[9,11]}[a];if(!s)return!0;const r=e==="all"?t._range:getDisplayRangeForYear(t,e),l=e==="all"?t._range[0].getFullYear():e,c=new Date(l,s[0],1),d=new Date(l,s[1]+1,0,23,59,59);return r[0]<=d&&r[1]>=c}function getFilteredItems(t={}){const e=(document.getElementById("filter-search")?.value||"").trim().toLowerCase(),a=document.getElementById("filter-category")?.value||"all",n=document.getElementById("filter-quarter")?.value||"all",s=document.getElementById("filter-status")?.value||"all",r=document.getElementById("filter-room")?.value||"all";return getScopedBaseList().filter(l=>{if(!doesItemMatchYear(l,SELECTED_YEAR)||!t.ignoreMonth&&SELECTED_MONTH_FILTER!==null&&!doesItemMatchMonth(l,SELECTED_YEAR,SELECTED_MONTH_FILTER)||!t.ignoreQuarter&&n!=="all"&&!doesItemMatchQuarter(l,SELECTED_YEAR,n)||a!=="all"&&l._category!==a||s!=="all"&&l._status.key!==s||r!=="all"&&l.room!==r)return!1;const c=document.getElementById("filter-tracking");if(SELECTED_TRACKING=(c?c.value:SELECTED_TRACKING)||"all",!t.ignoreTracking&&!matchesTrackingFilter(l,SELECTED_TRACKING))return!1;if(e){const i=l._tracking||{};if(![l.id_jadwal,l.agenda,l.pic,l.room,l.batch,l.deskripsi,i.code,i.label,i.shiftCode,i.shiftLabel,i.shiftNote,i.sheetTag,i.planDateLabel].join(" ").toLowerCase().includes(e))return!1}return!0})}function sortByChronological(t){return[...t].sort((e,a)=>{if(!e._range&&a._range)return 1;if(e._range&&!a._range)return-1;if(e._range&&a._range){const r=e._range[0].getTime()-a._range[0].getTime();if(r!==0)return r}const n=e.start_minutes!=null?e.start_minutes:9999,s=a.start_minutes!=null?a.start_minutes:9999;return n!==s?n-s:e.agenda.localeCompare(a.agenda)})}function toggleMonthFilter(t){SELECTED_MONTH_FILTER=SELECTED_MONTH_FILTER===t?null:t,applyFiltersAndRender()}function toggleCategoryFilter(t){const e=document.getElementById("filter-category");e&&(e.value=e.value===t?"all":t,applyFiltersAndRender())}function toggleQuarterFilter(t){const e=document.getElementById("filter-quarter");e&&(e.value=e.value===t?"all":t,SELECTED_MONTH_FILTER=null,applyFiltersAndRender())}function handleQuarterFilterChange(){SELECTED_MONTH_FILTER=null,applyFiltersAndRender()}function resetAllFilters(){["filter-search","filter-category","filter-quarter","filter-status","filter-room","filter-tracking"].forEach(e=>{const a=document.getElementById(e);a&&(a.value=a.tagName==="INPUT"?"":"all")}),SELECTED_MONTH_FILTER=null,SELECTED_TRACKING="all",applyFiltersAndRender()}function formatCapacityText(t,e,a=" org"){const n=Number(t)||0,s=Number(e)||0;return s>0?`${n.toLocaleString("id-ID")}/${s.toLocaleString("id-ID")}${a}`:`${n.toLocaleString("id-ID")}${a}`}function toggleFiltersDrawer(t){const e=document.getElementById("advanced-filters-panel"),a=document.getElementById("btn-toggle-filters");if(!e)return;const n=typeof t=="boolean"?t:e.classList.contains("hidden");e.classList.toggle("hidden",!n),e.classList.toggle("grid",n),a&&(a.classList.toggle("border-primary/40",n),a.classList.toggle("bg-primary/5",n))}function toggleInsightsPanel(){const t=document.getElementById("insights-section"),e=document.getElementById("insights-toggle-label");if(!t)return;const a=t.classList.toggle("hidden");e&&(e.textContent=a?"Tampilkan Grafik":"Sembunyikan Grafik")}function renderActiveFilterChips(){const t=document.getElementById("active-filter-chips");if(!t)return;const e=[];let a=0;SELECTED_MONTH_FILTER!==null&&e.push(`<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-semibold">Bulan: ${MONTH_NAMES[SELECTED_MONTH_FILTER]} <button type="button" onclick="toggleMonthFilter(${SELECTED_MONTH_FILTER})" class="hover:text-error cursor-pointer">&times;</button></span>`);const n=document.getElementById("filter-quarter")?.value;n&&n!=="all"&&(a++,e.push(`<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-semibold">Kuartal: ${n} <button type="button" onclick="toggleQuarterFilter('${n}')" class="hover:text-error cursor-pointer">&times;</button></span>`));const s=document.getElementById("filter-category")?.value;s&&s!=="all"&&(a++,e.push(`<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-fixed text-secondary font-semibold">Kategori: ${escapeHtml(s)} <button type="button" onclick="toggleCategoryFilter('${escapeHtml(s)}')" class="hover:text-error cursor-pointer">&times;</button></span>`));const r=document.getElementById("filter-status")?.value;if(r&&r!=="all"){a++;const k={upcoming:"Buka / Mendatang",running:"Berlangsung",full:"Penuh",closed:"Tutup / H-1",completed:"Selesai",tba:"TBA"};e.push(`<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface font-semibold">Status: ${escapeHtml(k[r]||r)} <button type="button" onclick="document.getElementById('filter-status').value='all'; applyFiltersAndRender();" class="hover:text-error cursor-pointer">&times;</button></span>`)}const l=document.getElementById("filter-room")?.value;if(l&&l!=="all"&&(a++,e.push(`<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-tertiary font-semibold">Ruang: ${escapeHtml(l)} <button type="button" onclick="document.getElementById('filter-room').value='all'; applyFiltersAndRender();" class="hover:text-error cursor-pointer">&times;</button></span>`)),SELECTED_TRACKING&&SELECTED_TRACKING!=="all"){const k={real:"REAL (Terealisasi)",plan:"PLAN (Masih Rencana)",tmbh:"TMBH (Tambahan)",shifted:"GSR (Bergeser)","gsr-hari":"GSR-HARI (Bergeser Hari)","gsr-bln":"GSR-BLN (Bergeser Bulan)"};e.push(`<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-semibold">Kode: ${escapeHtml(k[SELECTED_TRACKING]||SELECTED_TRACKING)} <button type="button" onclick="setTrackingFilter('all')" class="hover:text-error cursor-pointer">&times;</button></span>`)}const c=document.getElementById("advanced-filter-count");c&&(c.textContent=a,c.classList.toggle("hidden",a===0));const d=!!document.getElementById("filter-search")?.value?.trim(),i=document.getElementById("btn-reset-filters");if(i){const k=e.length>0||d;i.classList.toggle("hidden",!k),i.classList.toggle("inline-flex",k)}e.length?(t.innerHTML='<span class="text-slate-400 font-medium">Filter aktif:</span>'+e.join(""),t.classList.remove("hidden"),t.classList.add("flex")):(t.innerHTML="",t.classList.add("hidden"),t.classList.remove("flex"))}function applyFiltersAndRender(){const t=getFilteredItems({ignoreTracking:!0});updateTrackingToolbarState(t);const e=sortByChronological(getFilteredItems()),a=document.getElementById("filter-result-badge");a&&(a.textContent=`${e.length} Sesi`),renderActiveFilterChips(),renderKpiAndAnalytics(e),renderActiveViewPanel(e)}function renderKpiAndAnalytics(t){const e=t.filter(w=>!!w._range),a=t.filter(w=>!w._range),n=e.filter(w=>w._status.key==="completed"),s=n.length,r=e.length-s,l=t.filter(w=>w._tracking&&w._tracking.code==="REAL").length,c=t.filter(w=>w._tracking&&w._tracking.code==="PLAN").length,d=t.filter(w=>w._tracking&&w._tracking.code==="TMBH").length,i=t.filter(w=>w._tracking&&w._tracking.isShifted).length,k=new Set(t.map(w=>w.agenda.toLowerCase().trim())).size,b=new Set(t.map(w=>w.room).filter(Boolean)).size,_=new Set(t.map(w=>w.pic).filter(Boolean)).size,h=t.reduce((w,T)=>w+(T._hours||0),0),$=n.reduce((w,T)=>w+(T._hours||0),0),D=Math.max(0,h-$),x=t.reduce((w,T)=>w+(T.kuota||0),0),f=t.reduce((w,T)=>w+(T.registered||0),0),g=e.filter(w=>w._status.key==="upcoming"||w._status.key==="running"),o=g.reduce((w,T)=>w+Math.max(0,T.sisa_kuota||0),0),y=e.length>0?Math.round(s/e.length*100):0,m=x>0?Math.round(f/x*100):0,S=Math.min(100,m),u=DATA_SOURCE==="atmp",p=(w,T)=>{const I=document.getElementById(w);I&&(I.textContent=T)};p("kpi-total-sessions",t.length.toLocaleString("id-ID")),p("kpi-unique-programs",k.toLocaleString("id-ID")),p("kpi-sessions-sub",`${l} REAL • ${c} PLAN${d?` • ${d} TMBH`:""}${i?` • ${i} Geser`:""}${a.length?` • ${a.length} TBA`:""} • ${b} Ruang`),p("kpi-total-hours",`${h.toLocaleString("id-ID")} Jam`),p("kpi-hours-sub",`${$}j terlaksana • ${D}j terjadwal`),p("kpi-realization-pct",`${y}%`),p("kpi-realization-count",`${s}/${e.length} sesi`);const v=document.getElementById("kpi-realization-bar");v&&(v.style.width=`${y}%`),p("kpi-participants-title",u?"Actual vs Plan Peserta":"Kapasitas & Peserta"),p("kpi-participants-total",u?`${f.toLocaleString("id-ID")} / ${x.toLocaleString("id-ID")}`:`${f.toLocaleString("id-ID")} Peserta`),p("kpi-occupancy-pct",x>0?`${u?m:S}% ${u?"tercapai":"terisi"}`:`${t.length} sesi`),p("kpi-participants-sub",u?`Actual ${f.toLocaleString("id-ID")} dari Plan ${x.toLocaleString("id-ID")}${g.length>0?` • ${g.length} buka`:""}`:g.length>0?`Dari ${x.toLocaleString("id-ID")} kuota • ${g.length} buka`:`Dari ${x.toLocaleString("id-ID")} kapasitas kursi`);const M=document.getElementById("kpi-budget-card"),R=t.filter(w=>w._budget!==null&&w._budget!==void 0).length,N=t.filter(w=>w._actualBudget!==null&&w._actualBudget!==void 0).length,A=t.reduce((w,T)=>w+(T._planCost||0),0),P=t.reduce((w,T)=>w+(T._actualCost||0),0),L=t.reduce((w,T)=>w+(T._budget!=null&&T.kuota||0),0),B=L>0?A/L:null,C=R>0||N>0;if(M&&M.classList.toggle("hidden",!u&&!C),u||C)if(!C)p("kpi-budget-actual","Belum Diisi"),p("kpi-budget-pct","-"),p("kpi-budget-sub","Kolom ATMP masih kosong");else{const w=A>0?Math.round(P/A*100):0;p("kpi-budget-actual",N>0?formatIdr(P,!0):"Rp 0"),p("kpi-budget-pct",A>0?`${w}% terserap`:`${N}/${t.length} terisi`),p("kpi-budget-sub",`Plan ${A>0?formatIdr(A,!0):"-"} • rata-rata ${B!==null?formatIdr(B,!0):"-"}/peserta`)}const H=document.getElementById("spotlight-kicker"),j=document.getElementById("spotlight-badge"),F=document.getElementById("spotlight-body");if(H&&j&&F){const w=e.filter(z=>z._status.key==="running"),T=e.filter(z=>z._status.key==="upcoming"||z._status.key==="closed"||z._status.key==="full"),I=w[0]||T[0]||e[e.length-1]||t[0]||null;if(!I)H.textContent="Agenda Terdekat",j.textContent="-",j.className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[10.5px] font-bold",F.innerHTML='<div class="text-xs font-semibold text-on-surface-variant">Tidak ada agenda sesuai filter</div>';else{const z=w.length>0,E=!z&&T.length>0;H.textContent=z?`Berjalan Hari Ini (${w.length})`:E?"Sesi Terdekat Berikutnya":"Terakhir Terlaksana",j.textContent=z?"Aktif":I._status.label,j.className=`px-2 py-0.5 rounded-full border text-[10.5px] font-bold ${I._status.badgeCls}`;const O=z?w.length-1:E?T.length-1:0;F.innerHTML=`
            <button type="button" onclick="openDetailModal('${escapeHtml(I._uid)}')" class="w-full text-left group cursor-pointer focus:outline-none">
              <div class="text-xs font-bold text-on-surface group-hover:text-primary truncate transition-colors" title="${escapeHtml(I.agenda)}">${escapeHtml(I.agenda)}</div>
              <div class="text-[11px] text-on-surface-variant mt-0.5 truncate">
                ${escapeHtml(I._dateRangeLabel)} &bull; ${escapeHtml(I.room)}${I.kuota>0?` &bull; ${formatCapacityText(I.registered,I.kuota,"")}`:""}${O>0?` (+${O} lain)`:""}
              </div>
            </button>
          `}}const G=getFilteredItems({ignoreMonth:!0,ignoreQuarter:!0}).filter(w=>!!w._range),K=Array.from({length:12},(w,T)=>{const I=G.filter(J=>doesItemMatchMonth(J,SELECTED_YEAR,T)),z=I.filter(J=>J._status.key==="completed"),E=z.length,O=I.length-E,q=I.reduce((J,U)=>J+(U.registered||0),0),V=z.reduce((J,U)=>J+(U.registered||0),0),tt=I.reduce((J,U)=>J+(U._hours||0),0),nt=z.reduce((J,U)=>J+(U._hours||0),0),ot=Math.round(I.reduce((J,U)=>J+(U._planCost||0),0)/1e6),lt=Math.round(z.reduce((J,U)=>J+(U._planCost||0),0)/1e6),it=CHART_METRIC==="cost"?ot:CHART_METRIC==="participants"?q:CHART_METRIC==="hours"?tt:I.length,dt=CHART_METRIC==="cost"?lt:CHART_METRIC==="participants"?V:CHART_METRIC==="hours"?nt:E,ct=CHART_METRIC==="cost"?"jt":CHART_METRIC==="hours"?"j":"";return{mIdx:T,total:I.length,done:E,plan:O,regs:q,hours:tt,val:it,doneVal:dt,unitSuffix:ct}}),Q=Math.max(1,...K.map(w=>w.val)),Z=K.filter(w=>w.total>0).length,W=K.reduce((w,T)=>T.val>w.val?T:w,{val:0,mIdx:-1,unitSuffix:""}),Y=document.getElementById("monthly-chart-container");if(Y){const w=new Date().getMonth(),T=SELECTED_YEAR===new Date().getFullYear();Y.innerHTML=K.map(I=>{const z=I.val>0?Math.max(16,Math.round(I.val/Q*100)):5,E=I.val>0?Math.round(I.doneVal/I.val*100):0,O=SELECTED_MONTH_FILTER===I.mIdx,q=T&&w===I.mIdx,V=I.val>0?`${I.val}${I.unitSuffix}`:"";return`
            <button type="button" onclick="toggleMonthFilter(${I.mIdx})" class="group flex flex-col items-center justify-end h-full gap-0.5 cursor-pointer focus:outline-none" title="${MONTH_NAMES[I.mIdx]}: ${I.total} sesi (${I.done} selesai) • ${I.regs} peserta • ${I.hours} jam">
              <span class="text-[9.5px] font-bold ${I.val>0?"text-on-surface":"text-outline/50"}">${V}</span>
              <div class="w-full max-w-[24px] rounded-t-md overflow-hidden flex flex-col justify-end transition-all ${O?"ring-2 ring-primary ring-offset-1":"group-hover:opacity-85"}" style="height:${z}%">
                ${I.val===0?'<div class="w-full h-full bg-surface-container"></div>':`
                    ${100-E>0?`<div class="w-full bg-primary" style="height:${100-E}%"></div>`:""}
                    ${E>0?`<div class="w-full bg-emerald-600" style="height:${E}%"></div>`:""}
                  `}
              </div>
              <span class="text-[9.5px] font-semibold ${O?"text-primary font-extrabold underline":q?"text-primary font-bold":"text-on-surface-variant"} pb-0.5">${MONTH_SHORT[I.mIdx]}</span>
            </button>
          `}).join("")}p("chart-active-months",`${Z} / 12 bulan`);const et=CHART_METRIC==="cost"?"juta rencana biaya":CHART_METRIC==="participants"?"peserta":CHART_METRIC==="hours"?"jam":"sesi";p("chart-peak-label",W.val>0?`Puncak: ${MONTH_SHORT[W.mIdx]} (${W.val} ${et})`:"Puncak: -");const X=document.getElementById("category-breakdown-list"),st=document.getElementById("filter-category")?.value||"all";if(X){const w=Math.max(1,t.length),T=CATEGORIES.map(E=>{const O=t.filter(nt=>nt._category===E.key),q=O.length,V=O.reduce((nt,ot)=>nt+(ot._hours||0),0),tt=t.length>0?Math.round(q/w*100):0;return{...E,count:q,hours:V,pct:tt}}),I=t.length>0?`<div class="w-full h-2.5 rounded-full bg-surface-container-high overflow-hidden flex">${T.filter(E=>E.count>0).map(E=>`<div class="${E.barClass} h-full" style="width:${E.count/w*100}%" title="${escapeHtml(E.key)}: ${E.count} sesi • ${E.hours} jam (${E.pct}%)"></div>`).join("")}</div>`:'<div class="w-full h-2.5 rounded-full bg-surface-container-high"></div>',z=T.map(E=>{const O=st===E.key,q=E.count===0&&!O?"opacity-45":"";return`
            <button type="button" onclick="toggleCategoryFilter('${E.key}')" class="inline-flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] transition-all cursor-pointer ${q} ${O?"bg-primary-fixed/60 border-primary/50 text-primary font-bold":"bg-slate-50/90 border-transparent hover:bg-slate-100 text-slate-700"}" title="${escapeHtml(E.key)}: ${E.count} sesi, ${E.hours} jam belajar">
              <span class="inline-flex items-center gap-1.5 min-w-0">
                <span class="w-2 h-2 rounded-full ${E.barClass} shrink-0"></span>
                <span class="truncate font-medium">${escapeHtml(E.key)}</span>
              </span>
              <span class="font-bold shrink-0">${E.count} <span class="font-normal opacity-75">(${E.pct}%)</span></span>
            </button>
          `}).join("");X.innerHTML=`${I}<div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">${z}</div>`}const at=document.getElementById("quarter-summary-pills"),rt=document.getElementById("filter-quarter")?.value||"all";if(at){const w=[{q:"Q1",sub:"Jan–Mar"},{q:"Q2",sub:"Apr–Jun"},{q:"Q3",sub:"Jul–Sep"},{q:"Q4",sub:"Okt–Des"}];at.innerHTML=w.map(T=>{const I=G.filter(O=>doesItemMatchQuarter(O,SELECTED_YEAR,T.q)),z=I.reduce((O,q)=>O+(q._hours||0),0),E=rt===T.q;return`
            <button type="button" onclick="toggleQuarterFilter('${T.q}')" class="px-2.5 py-1.5 rounded-xl border text-left transition-all cursor-pointer ${E?"bg-primary text-on-primary border-primary":"bg-slate-50/90 border-transparent hover:bg-slate-100 text-slate-800"}">
              <div class="flex items-center justify-between gap-1">
                <span class="text-[11px] font-extrabold">${T.q}</span>
                <span class="text-[10px] opacity-65">${T.sub}</span>
              </div>
              <div class="text-xs font-bold mt-0.5">${I.length} Sesi <span class="text-[10px] font-medium opacity-75">&bull; ${z}j</span></div>
            </button>
          `}).join("")}}function setChartMetric(t){CHART_METRIC=t,["sessions","participants","hours","cost"].forEach(e=>{const a=document.getElementById("btn-metric-"+e);a&&(a.className=e===t?"px-2.5 py-0.5 rounded-md font-bold bg-white text-primary shadow-2xs cursor-pointer":"px-2.5 py-0.5 rounded-md font-medium text-slate-500 hover:text-slate-800 cursor-pointer")}),renderKpiAndAnalytics(sortByChronological(getFilteredItems()))}function switchMasterView(t){ACTIVE_VIEW=t,["matrix","gantt","quarters","table","budget"].forEach(a=>{const n=document.getElementById("panel-"+a),s=document.getElementById("view-tab-"+a),r=a===t;n&&(n.classList.toggle("hidden",!r),n.classList.toggle("flex",r)),s&&(s.className=r?"master-view-tab flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold transition-all cursor-pointer shrink-0":"master-view-tab flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white/70 text-xs font-medium transition-all cursor-pointer shrink-0")});const e=document.getElementById("matrix-grouping-wrap");e&&e.classList.toggle("hidden",t!=="matrix"),applyFiltersAndRender()}function setMatrixGrouping(t){MATRIX_GROUPING=t;const e=document.getElementById("btn-group-program"),a=document.getElementById("btn-group-session"),n="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white text-primary shadow-2xs cursor-pointer",s="px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-500 hover:text-slate-800 cursor-pointer";e&&(e.className=t==="program"?n:s),a&&(a.className=t==="session"?n:s),renderActiveViewPanel(sortByChronological(getFilteredItems()))}function renderActiveViewPanel(t){["matrix","gantt","quarters","table","budget"].forEach(e=>{const a=document.getElementById("panel-"+e);a&&(a.classList.toggle("hidden",e!==ACTIVE_VIEW),a.classList.toggle("flex",e===ACTIVE_VIEW))}),ACTIVE_VIEW==="matrix"?renderMatrixView(t):ACTIVE_VIEW==="gantt"?renderGanttView(t):ACTIVE_VIEW==="quarters"?renderQuartersView(t):ACTIVE_VIEW==="table"?renderMasterTableView(t):ACTIVE_VIEW==="budget"&&renderBudgetView(t)}function renderMatrixView(t){const e=document.getElementById("matrix-table-container"),a=document.getElementById("tba-section-box");if(!e)return;const n=t.filter(r=>!!r._range),s=t.filter(r=>!r._range);if(!n.length)e.innerHTML=`
          <div class="p-10 text-center flex flex-col items-center gap-2 text-on-surface-variant">
            <span class="material-symbols-outlined text-[36px] text-outline/60">event_busy</span>
            <div class="text-sm font-bold text-on-surface">Tidak ada jadwal bertanggal yang sesuai filter</div>
            <div class="text-xs">Coba ubah pilihan tahun atau reset filter pencarian.</div>
          </div>
        `;else{let r=[];if(MATRIX_GROUPING==="program"){const x=new Map;n.forEach(f=>{const g=f.agenda.toLowerCase().trim();x.has(g)||x.set(g,{title:f.agenda,category:f._category,items:[]}),x.get(g).items.push(f)}),r=Array.from(x.values()).sort((f,g)=>{const o=f.items[0]._range[0].getTime(),y=g.items[0]._range[0].getTime();return o!==y?o-y:f.title.localeCompare(g.title)})}else r=n.map(x=>({title:x.agenda,subTitle:`${x.id_jadwal}${x.batch?" • "+x.batch:""}`,category:x._category,items:[x]}));const l=new Date,c=SELECTED_YEAR===l.getFullYear(),d=l.getMonth(),i=Array.from({length:12},(x,f)=>{const g=n.filter(y=>doesItemMatchMonth(y,SELECTED_YEAR,f)),o=g.reduce((y,m)=>y+(m.registered||0),0);return{count:g.length,reg:o}}),k=`
          <tr>
            <th rowspan="2" class="matrix-sticky-col bg-surface-container-low border-b border-r border-outline-variant/50 px-4 py-2.5 text-left text-xs font-bold text-on-surface min-w-[230px] max-w-[270px]">
              Program Pelatihan (${r.length})
            </th>
            <th colspan="3" class="border-b border-r border-outline-variant/50 py-1.5 text-center text-[11px] font-bold bg-surface-container-low text-primary">Q1</th>
            <th colspan="3" class="border-b border-r border-outline-variant/50 py-1.5 text-center text-[11px] font-bold bg-surface-container-low text-secondary">Q2</th>
            <th colspan="3" class="border-b border-r border-outline-variant/50 py-1.5 text-center text-[11px] font-bold bg-surface-container-low text-tertiary">Q3</th>
            <th colspan="3" class="border-b border-r border-outline-variant/50 py-1.5 text-center text-[11px] font-bold bg-surface-container-low text-[#9D7828]">Q4</th>
            <th rowspan="2" class="border-b border-r border-outline-variant/50 px-2 py-2 text-center text-[11px] font-bold bg-surface-container-low text-on-surface w-12">Sesi</th>
            <th rowspan="2" class="border-b border-r border-outline-variant/50 px-2 py-2 text-center text-[11px] font-bold bg-surface-container-low text-on-surface w-14">Jam</th>
            <th rowspan="2" class="border-b border-outline-variant/50 px-2 py-2 text-center text-[11px] font-bold bg-surface-container-low text-on-surface w-24">${DATA_SOURCE==="atmp"?"Actual/Plan":"Peserta/Kuota"}</th>
          </tr>
          <tr>
            ${MONTH_SHORT.map((x,f)=>{const g=c&&f===d,o=i[f].count,m=o===0?"w-9 min-w-[36px] px-0.5":"min-w-[122px] px-1.5",S=o>0?`<span class="ml-1 inline-block px-1 py-0 rounded text-[9.5px] ${g?"bg-white/20 text-white":"bg-primary/10 text-primary"}">${o}</span>`:"";return`<th class="border-b border-r border-outline-variant/40 py-2 text-center text-[11px] font-bold ${m} ${g?"bg-primary text-on-primary":"bg-surface-container-low/70 text-on-surface-variant"}">${x}${S}</th>`}).join("")}
          </tr>
        `,b=r.map((x,f)=>{const g=getCategoryMeta(x.category),o=x.items.length,y=x.items.reduce((A,P)=>A+(P._hours||0),0),m=x.items.reduce((A,P)=>A+(P.registered||0),0),S=x.items.reduce((A,P)=>A+(P.kuota||0),0),u=Array.from(new Set(x.items.map(A=>A.room).filter(Boolean))).slice(0,2).join(", "),p=Array.from(new Set(x.items.map(A=>A.pic).filter(Boolean))).slice(0,2).join(", "),v=Array.from({length:12},(A,P)=>{const L=x.items.filter(j=>doesItemMatchMonth(j,SELECTED_YEAR,P)),C=c&&P===d?"bg-primary/[0.03]":"";if(!L.length)return`<td class="border-b border-r border-outline-variant/30 p-1 align-middle text-center ${C}"><span class="text-[10px] text-outline/30 select-none">&ndash;</span></td>`;const H=L.map(j=>{const F=SELECTED_YEAR==="all"?j._range:getDisplayRangeForYear(j,SELECTED_YEAR)||j._range,G=formatCellPillDate(F,P),Q=j.batch&&!/^batch\s*1$/i.test(j.batch)?j.batch:j.start_hour||"",Z=j._hasYearMismatch?`<span class="text-[8.5px] font-extrabold text-amber-800">[YR ${j._yearOverride}] </span>`:"",W=j.is_request?'<span class="text-[9px] font-extrabold text-amber-800">[REQ] </span>':"",Y=j._tracking||{},et=Y.shiftCode==="GSR-BLN"?"ring-1 ring-rose-500 border-l-[3px] border-l-rose-600":Y.shiftCode==="GSR-HARI"?"ring-1 ring-amber-400 border-l-[3px] border-l-amber-500":"",X=Y.isShifted&&(Y.shiftNote||Y.planDateLabel)?` | ${Y.shiftCode}: ${Y.shiftNote||Y.planDateLabel}`:"";return`
                <button type="button" onclick="openDetailModal('${escapeHtml(j._uid)}')" class="w-full text-left px-2 py-1.5 rounded-lg border text-[10.5px] leading-tight transition-all cursor-pointer ${j._status.pillCls} ${et}" title="${escapeHtml(j.agenda)} (${j._dateRangeLabel}${j.start_hour?" • "+j.start_hour+" WITA":""}) | ${escapeHtml(j.room)} • ${escapeHtml(j.pic)} | ${escapeHtml(Y.code||"")}: ${escapeHtml(Y.label||"")}${escapeHtml(X)}">
                  <div class="flex items-center justify-between gap-1 font-bold">
                    <span class="inline-flex items-center gap-1 min-w-0">
                      <span class="w-1.5 h-1.5 rounded-full ${j._status.dotCls} shrink-0"></span>
                      <span class="truncate">${W}${Z}${escapeHtml(G)}</span>
                    </span>
                    ${Q?`<span class="text-[9.5px] font-semibold opacity-75 shrink-0">${escapeHtml(Q)}</span>`:""}
                  </div>
                  <div class="flex items-center justify-between gap-1 text-[9.5px] mt-1">
                    <span class="truncate font-medium opacity-85">${escapeHtml(formatCapacityText(j.registered,j.kuota))}</span>
                    <span class="inline-flex items-center gap-0.5 shrink-0">${renderTrackingBadgesHtml(Y,{compact:!0})}</span>
                  </div>
                </button>
              `}).join("");return`<td class="border-b border-r border-outline-variant/30 p-1 align-top ${C}"><div class="flex flex-col gap-1">${H}</div></td>`}).join(""),M=S>0?Math.min(100,Math.round(m/S*100)):0,R=M>=100?"bg-amber-600":M>=70?"bg-emerald-600":"bg-primary",N=f%2===1?"bg-[#f8f9ff]":"bg-surface-container-lowest";return`
            <tr class="${N} hover:bg-surface-container-low/70 transition-colors">
              <td class="matrix-sticky-col ${N} border-b border-r border-outline-variant/40 px-4 py-2.5 align-top">
                <div class="flex items-start gap-2">
                  <span class="text-[11px] font-bold text-outline mt-0.5 w-5 shrink-0">${f+1}.</span>
                  <div class="min-w-0 flex-1">
                    <div class="text-xs font-bold text-on-surface leading-snug line-clamp-2" title="${escapeHtml(x.title)}">${escapeHtml(x.title)}</div>
                    <div class="flex flex-wrap items-center gap-1.5 mt-1">
                      <span class="inline-block px-1.5 py-0.2 rounded border text-[9.5px] font-semibold ${g.bgClass}">${escapeHtml(x.category)}</span>
                      ${x.subTitle?`<span class="text-[10px] text-on-surface-variant truncate">${escapeHtml(x.subTitle)}</span>`:""}
                    </div>
                    <div class="text-[10px] text-on-surface-variant truncate mt-0.5" title="${escapeHtml(u)} • ${escapeHtml(p)}">
                      ${escapeHtml(u)}${p?" &bull; "+escapeHtml(p):""}
                    </div>
                  </div>
                </div>
              </td>
              ${v}
              <td class="border-b border-r border-outline-variant/30 px-2 py-2.5 text-center text-xs font-bold text-primary align-middle">${o}</td>
              <td class="border-b border-r border-outline-variant/30 px-2 py-2.5 text-center text-xs font-semibold text-on-surface align-middle">${y}j</td>
              <td class="border-b border-outline-variant/30 px-2.5 py-2.5 text-center text-xs font-semibold text-on-surface align-middle whitespace-nowrap">
                <div>${escapeHtml(formatCapacityText(m,S,""))}</div>
                ${S>0?`<div class="w-16 mx-auto h-1 rounded-full bg-surface-container-high overflow-hidden mt-1" title="${M}% terisi"><div class="h-full ${R}" style="width:${M}%"></div></div>`:""}
              </td>
            </tr>
          `}).join(""),_=n.reduce((x,f)=>x+(f._hours||0),0),h=n.reduce((x,f)=>x+(f.registered||0),0),$=n.reduce((x,f)=>x+(f.kuota||0),0),D=`
          <tr class="bg-surface-container-low font-bold text-xs">
            <td class="matrix-sticky-col bg-surface-container-low border-r border-outline-variant/50 px-4 py-2.5 text-on-surface">
              Total Sesi Aktif per Bulan
            </td>
            ${i.map(x=>`
              <td class="border-r border-outline-variant/40 px-1 py-2 text-center">
                <div class="${x.count>0?"text-primary font-extrabold":"text-outline/50"}">${x.count||"&ndash;"}</div>
                ${x.count>0?`<div class="text-[9.5px] font-medium text-on-surface-variant">${x.reg} org</div>`:""}
              </td>
            `).join("")}
            <td class="border-r border-outline-variant/40 px-2 py-2 text-center text-primary font-extrabold">${n.length}</td>
            <td class="border-r border-outline-variant/40 px-2 py-2 text-center text-on-surface">${_}j</td>
            <td class="px-2 py-2 text-center text-on-surface whitespace-nowrap">${escapeHtml(formatCapacityText(h,$,""))}</td>
          </tr>
        `;e.innerHTML=`
          <table class="matrix-table w-full border-collapse text-left">
            <thead>${k}</thead>
            <tbody>${b}</tbody>
            <tfoot>${D}</tfoot>
          </table>
        `}a&&(s.length>0?(a.classList.remove("hidden"),a.innerHTML=`
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                <h4 class="font-display text-sm font-bold text-on-surface">Rencana Program Belum Terjadwal / TBA (${s.length})</h4>
              </div>
              <span class="text-[11px] text-on-surface-variant">Baris tanpa tanggal mulai</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              ${s.map(r=>`
                <button type="button" onclick="openDetailModal('${escapeHtml(r._uid)}')" class="p-3 rounded-xl bg-surface-container-low/60 hover:bg-surface-container-low border border-outline-variant/50 text-left flex items-center justify-between gap-2 cursor-pointer transition-colors">
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-1.5 mb-0.5">${renderTrackingBadgesHtml(r._tracking,{compact:!0})}</div>
                    <div class="text-xs font-bold text-on-surface truncate">${escapeHtml(r.agenda)}</div>
                    <div class="text-[11px] text-on-surface-variant truncate">${escapeHtml(r.id_jadwal)} &bull; ${escapeHtml(r._durationLabel)} &bull; ${escapeHtml(r.pic)}</div>
                  </div>
                  <span class="material-symbols-outlined text-[18px] text-primary shrink-0">chevron_right</span>
                </button>
              `).join("")}
            </div>
          `):(a.classList.add("hidden"),a.innerHTML=""))}function setGanttScale(t){GANTT_SCALE=t;const e=document.getElementById("btn-gantt-active"),a=document.getElementById("btn-gantt-year"),n="px-2.5 py-1 rounded-md font-bold bg-surface-container-lowest text-primary cursor-pointer",s="px-2.5 py-1 rounded-md font-medium text-on-surface-variant hover:text-on-surface cursor-pointer";e&&(e.className=t==="active"?n:s),a&&(a.className=t==="year"?n:s),ACTIVE_VIEW==="gantt"&&renderGanttView(sortByChronological(getFilteredItems()))}function renderGanttView(t){const e=document.getElementById("gantt-container");if(!e)return;const a=t.filter(c=>!!c._range);if(!a.length){e.innerHTML='<div class="p-10 text-center text-xs text-on-surface-variant">Tidak ada jadwal bertanggal untuk ditampilkan pada timeline Gantt.</div>';return}const n=SELECTED_YEAR==="all"?Array.from(new Set(a.map(c=>c._year).filter(Boolean))).sort((c,d)=>c-d):[SELECTED_YEAR],s=new Date,r=new Date(s.getFullYear(),s.getMonth(),s.getDate()).getTime(),l={completed:"bg-emerald-600 text-white",running:"bg-sky-600 text-white",full:"bg-amber-600 text-white",closed:"bg-amber-600 text-white",upcoming:"bg-primary text-on-primary"};e.innerHTML=n.map(c=>{const d=new Date(c,0,1),i=new Date(c,11,31,23,59,59),k=a.filter(m=>doesItemMatchYear(m,c));let b=d,_=i,h=!1;if(GANTT_SCALE==="active"&&k.length>0&&SELECTED_YEAR!=="all"){const m=Math.min(...k.map(p=>{const v=getDisplayRangeForYear(p,c);return Math.max(d.getTime(),v[0].getTime())})),S=Math.max(...k.map(p=>{const v=getDisplayRangeForYear(p,c);return Math.min(i.getTime(),v[1].getTime())}));if(Math.ceil((S-m)/864e5)+1<=115){h=!0;const p=new Date(m);p.setDate(p.getDate()-1),p.setHours(0,0,0,0);const v=new Date(S);v.setDate(v.getDate()+2),v.setHours(23,59,59,999),(v.getTime()-p.getTime())/864e5<14&&v.setTime(p.getTime()+14*864e5-1),b=p,_=v}}const $=Math.max(864e5,_.getTime()-b.getTime());let D=null;s>=b&&s<=_&&(D=(s.getTime()-b.getTime())/$*100);let x="",f="";const g=[];if(h){const m=Math.max(1,Math.round($/864e5)),S=m<=18?1:m<=45?2:Math.ceil(m/16);for(let u=0;u<m;u+=S){const p=new Date(b.getTime()+u*864e5),v=(p.getTime()-b.getTime())/$*100,M=p.getFullYear()===s.getFullYear()&&p.getMonth()===s.getMonth()&&p.getDate()===s.getDate();g.push({dt:p,leftP:v,isTodayTick:M})}x=`
            <div class="flex-1 min-w-[780px] relative h-9 bg-surface-container-low/70">
              ${g.map(u=>`
                <div class="absolute top-0 bottom-0 border-l border-outline-variant/40 px-1.5 flex items-center text-[10px] font-bold ${u.isTodayTick?"text-red-700 bg-red-50/80":"text-on-surface-variant"}" style="left:${u.leftP}%">
                  ${u.dt.getDate()} ${MONTH_SHORT[u.dt.getMonth()]}
                </div>
              `).join("")}
            </div>
          `,f=g.map(u=>`<div class="absolute top-0 bottom-0 border-l border-outline-variant/20 pointer-events-none" style="left:${u.leftP}%"></div>`).join("")}else x=`
            <div class="flex-1 min-w-[780px] grid grid-cols-12">
              ${MONTH_SHORT.map((m,S)=>`
                <div class="text-center text-[11px] font-bold py-2 border-r border-outline-variant/30 last:border-r-0 ${s.getFullYear()===c&&s.getMonth()===S?"bg-primary text-on-primary":"bg-surface-container-low/70 text-on-surface-variant"}">
                  ${m}
                </div>
              `).join("")}
            </div>
          `,f=`<div class="absolute inset-0 grid grid-cols-12 pointer-events-none">${Array.from({length:12},()=>'<div class="h-full border-r border-outline-variant/20 last:border-r-0"></div>').join("")}</div>`;const o=k.map((m,S)=>{const u=getDisplayRangeForYear(m,c),p=Math.max(b.getTime(),u[0].getTime()),v=Math.min(_.getTime(),u[1].getTime()+86399999),M=Math.min(97.5,Math.max(0,(p-b.getTime())/$*100)),R=h?3.2:1.4,N=Math.min(100-M,Math.max(R,(v-p)/$*100)),A=l[m._status.key]||"bg-primary text-on-primary",P=S%2===1?"bg-[#f8f9ff]":"bg-surface-container-lowest",L=u[0].getTime()<=r&&u[1].getTime()>=r,B=formatCapacityText(m.registered,m.kuota,""),C=m._tracking||{},H=C.shiftCode==="GSR-BLN"?"ring-2 ring-rose-500":C.shiftCode==="GSR-HARI"?"ring-2 ring-amber-400":"";return`
            <div class="flex items-stretch border-b border-outline-variant/30 ${P} hover:bg-surface-container-low/65 transition-colors">
              <div class="gantt-sticky-col ${P} w-[250px] sm:w-[295px] shrink-0 px-4 py-2 border-r border-outline-variant/40 flex flex-col justify-center">
                <button type="button" onclick="openDetailModal('${escapeHtml(m._uid)}')" class="text-left text-xs font-bold text-on-surface hover:text-primary truncate cursor-pointer flex items-center gap-1" title="${escapeHtml(m.agenda)}">
                  ${L?'<span class="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0"></span>':""}
                  <span class="truncate">${escapeHtml(m.agenda)}</span>
                </button>
                <div class="flex items-center gap-1.5 text-[10px] text-on-surface-variant truncate mt-0.5">
                  <span class="inline-flex items-center gap-0.5 shrink-0">${renderTrackingBadgesHtml(C,{compact:!0})}</span>
                  ${m._hasYearMismatch?`<span class="px-1 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold shrink-0">YR ${m._yearOverride}</span>`:""}
                  <span class="truncate">${escapeHtml(m._dateRangeLabel)} &bull; ${escapeHtml(m.room)}</span>
                </div>
              </div>
              <div class="flex-1 min-w-[780px] relative flex items-center py-2">
                ${f}
                ${D!==null?`<div class="absolute top-0 bottom-0 w-px bg-red-500/85 z-10 pointer-events-none" style="left:${D}%"></div>`:""}
                <button type="button" onclick="openDetailModal('${escapeHtml(m._uid)}')" style="left:${M}%; width:${N}%" class="absolute z-20 h-7 px-2 rounded-md ${A} ${H} text-[10px] font-bold shadow-xs flex items-center justify-between gap-1.5 overflow-hidden hover:opacity-90 cursor-pointer transition-opacity" title="${escapeHtml(m.agenda)} (${m._dateRangeLabel}) | ${escapeHtml(C.code||"")}${C.isShifted?" • "+C.shiftCode+(C.shiftNote?" ("+C.shiftNote+")":""):""} | ${escapeHtml(m.room)} | ${escapeHtml(formatCapacityText(m.registered,m.kuota))}">
                  <span class="truncate">${escapeHtml(m.agenda)}</span>
                  <span class="text-[9px] opacity-90 shrink-0 hidden sm:inline">${escapeHtml(B)}</span>
                </button>
              </div>
            </div>
          `}).join(""),y=h?`${b.getDate()} ${MONTH_SHORT[b.getMonth()]} – ${_.getDate()} ${MONTH_SHORT[_.getMonth()]} ${c}`:`Tahun ${c}`;return`
          <div class="min-w-[1040px] ${n.length>1?"mb-4":""}">
            <div class="flex items-stretch border-b border-outline-variant/50">
              <div class="gantt-sticky-col bg-surface-container-low w-[250px] sm:w-[295px] shrink-0 px-4 py-2 text-xs font-bold text-on-surface border-r border-outline-variant/50 flex items-center justify-between gap-2">
                <span>${escapeHtml(y)}</span>
                <span class="text-[10.5px] font-semibold text-primary">${k.length} Sesi</span>
              </div>
              ${x}
            </div>
            <div>${o}</div>
          </div>
        `}).join("")}function toggleQuarterEmptyMonths(){QUARTER_HIDE_EMPTY=!QUARTER_HIDE_EMPTY;const t=document.getElementById("quarter-empty-toggle-label");t&&(t.textContent=QUARTER_HIDE_EMPTY?"Tampilkan Bulan Kosong":"Sembunyikan Bulan Kosong"),ACTIVE_VIEW==="quarters"&&renderQuartersView(sortByChronological(getFilteredItems()))}function renderQuartersView(t){const e=document.getElementById("quarters-grid-container");if(!e)return;const a=[{code:"Q1",title:"Kuartal 1 (Q1)",months:[0,1,2],badgeCls:"bg-primary-fixed text-on-primary-fixed-variant"},{code:"Q2",title:"Kuartal 2 (Q2)",months:[3,4,5],badgeCls:"bg-secondary-fixed text-secondary"},{code:"Q3",title:"Kuartal 3 (Q3)",months:[6,7,8],badgeCls:"bg-tertiary-fixed text-tertiary"},{code:"Q4",title:"Kuartal 4 (Q4)",months:[9,10,11],badgeCls:"bg-amber-100 text-amber-900"}],n=t.filter(_=>!!_._range),s=t.filter(_=>!_._range),r=new Date,l=`${r.getFullYear()}-${r.getMonth()}-${r.getDate()}`,c=["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"],d=s.length>0?`
        <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant/50 p-5 flex flex-col gap-3">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
              <h3 class="font-display text-sm font-bold text-on-surface">Rencana Program Belum Terjadwal / TBA (${s.length})</h3>
            </div>
            <span class="text-[11px] text-on-surface-variant">Baris tanpa tanggal mulai</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            ${s.map(_=>`
              <button type="button" onclick="openDetailModal('${escapeHtml(_._uid)}')" class="p-3 rounded-xl bg-surface-container-low/60 hover:bg-surface-container-low border border-outline-variant/50 text-left flex items-center justify-between gap-2 cursor-pointer transition-colors">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5 mb-0.5">${renderTrackingBadgesHtml(_._tracking,{compact:!0})}</div>
                  <div class="text-xs font-bold text-on-surface truncate">${escapeHtml(_.agenda)}</div>
                  <div class="text-[11px] text-on-surface-variant truncate">${escapeHtml(_.id_jadwal)} &bull; ${escapeHtml(_._durationLabel)} &bull; ${escapeHtml(_.pic)}</div>
                </div>
                <span class="material-symbols-outlined text-[18px] text-primary shrink-0">chevron_right</span>
              </button>
            `).join("")}
          </div>
        </div>
      `:"",i=[],k=[];a.forEach(_=>{const h=n.filter(o=>_.months.some(y=>doesItemMatchMonth(o,SELECTED_YEAR,y))),$=h.reduce((o,y)=>o+(y._hours||0),0),D=h.reduce((o,y)=>o+(y.registered||0),0),x=QUARTER_HIDE_EMPTY?_.months.filter(o=>n.some(y=>doesItemMatchMonth(y,SELECTED_YEAR,o))):_.months;if(QUARTER_HIDE_EMPTY&&_.months.forEach(o=>{n.some(y=>doesItemMatchMonth(y,SELECTED_YEAR,o))||k.push(`${MONTH_SHORT[o]} (${_.code})`)}),QUARTER_HIDE_EMPTY&&!x.length)return;const f=x.map(o=>{const y=n.filter(v=>doesItemMatchMonth(v,SELECTED_YEAR,o)),m=y.reduce((v,M)=>v+(M.registered||0),0),S=y.reduce((v,M)=>v+(M._hours||0),0),u=SELECTED_YEAR===r.getFullYear()&&r.getMonth()===o;let p="";if(!y.length)p='<div class="py-3 text-center text-xs text-outline/80 italic">Tidak ada pelatihan terjadwal</div>';else{const v=new Map;y.forEach(R=>{const N=R._range[0],A=`${N.getFullYear()}-${N.getMonth()}-${N.getDate()}`;v.has(A)||v.set(A,{dateObj:N,dKey:A,items:[]}),v.get(A).items.push(R)}),p=`
              <div class="divide-y divide-outline-variant/30">
                ${Array.from(v.values()).sort((R,N)=>R.dateObj-N.dateObj).map(R=>{const N=R.dKey===l,A=`${c[R.dateObj.getDay()]}, ${R.dateObj.getDate()} ${MONTH_SHORT[R.dateObj.getMonth()]}`;return`
                    <div class="py-2.5 first:pt-1 last:pb-1 flex flex-col lg:flex-row lg:items-start gap-2.5 ${N?"bg-primary/[0.04] -mx-3 px-3 rounded-xl":""}">
                      <div class="lg:w-44 shrink-0 flex items-center gap-2 pt-0.5">
                        <span class="text-xs font-bold ${N?"text-primary":"text-on-surface"}">${A}</span>
                        ${N?'<span class="px-1.5 py-0.5 rounded bg-primary text-on-primary text-[9.5px] font-bold">Hari Ini</span>':""}
                      </div>
                      <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                        ${R.items.map(P=>{const L=getCategoryMeta(P._category),B=P.kuota>0?Math.min(100,Math.round(P.registered/P.kuota*100)):0;return`
                            <button type="button" onclick="openDetailModal('${escapeHtml(P._uid)}')" class="w-full text-left p-2.5 rounded-xl border bg-surface-container-lowest hover:border-primary/60 border-outline-variant/45 transition-all cursor-pointer flex items-center justify-between gap-2.5">
                              <div class="min-w-0 flex-1">
                                <div class="flex items-center gap-1.5">
                                  <span class="w-2 h-2 rounded-full ${P._status.dotCls} shrink-0"></span>
                                  <span class="text-xs font-bold text-on-surface truncate">${escapeHtml(P.agenda)}</span>
                                </div>
                                <div class="flex flex-wrap items-center gap-1 text-[10.5px] text-on-surface-variant mt-1">
                                  <span class="px-1.5 py-0 rounded border text-[9.5px] font-semibold ${L.bgClass}">${escapeHtml(P._category)}</span>
                                  ${renderTrackingBadgesHtml(P._tracking,{compact:!0})}
                                  ${P._hasYearMismatch?`<span class="px-1 py-0 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">YR ${P._yearOverride}</span>`:""}
                                  ${P.start_hour?`<span class="font-semibold text-on-surface">${escapeHtml(P.start_hour)} WITA</span><span>&bull;</span>`:""}
                                  <span>${escapeHtml(P.room)}</span>
                                  <span>&bull;</span>
                                  <span class="truncate">${escapeHtml(P.pic)}</span>
                                </div>
                                ${P._tracking&&P._tracking.isShifted&&(P._tracking.shiftNote||P._tracking.planDateLabel)?`<div class="text-[10px] font-semibold text-amber-800 mt-0.5">${escapeHtml(P._tracking.shiftNote||"Plan: "+P._tracking.planDateLabel)}</div>`:""}
                              </div>
                              <div class="text-right shrink-0 flex flex-col items-end gap-1">
                                <span class="inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold ${P._status.badgeCls}">${escapeHtml(P._status.label)}</span>
                                <span class="text-[10.5px] font-semibold text-on-surface">${escapeHtml(formatCapacityText(P.registered,P.kuota))}${P.kuota>0?` <span class="text-on-surface-variant font-normal">(${B}%)</span>`:""}</span>
                              </div>
                            </button>
                          `}).join("")}
                      </div>
                    </div>
                  `}).join("")}
              </div>
            `}return`
            <div class="bg-surface-container-lowest rounded-2xl border ${u?"border-2 border-primary ring-2 ring-primary/10":"border-outline-variant/50"} p-4 flex flex-col gap-3">
              <div class="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-outline-variant/40">
                <div class="flex items-center gap-2">
                  <span class="font-display text-sm sm:text-base font-bold ${u?"text-primary":"text-on-surface"}">${MONTH_NAMES[o]}</span>
                  ${u?'<span class="px-2 py-0.5 rounded-full bg-primary text-on-primary text-[10px] font-bold">Bulan Ini</span>':""}
                </div>
                <div class="flex items-center gap-2 text-xs">
                  <span class="text-on-surface-variant">Total Peserta: <strong class="text-on-surface">${m.toLocaleString("id-ID")}</strong></span>
                  <span class="text-on-surface-variant">&bull; Jam: <strong class="text-on-surface">${S}j</strong></span>
                  <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold ${y.length>0?"bg-primary text-on-primary":"bg-surface-container text-on-surface-variant"}">${y.length} Sesi</span>
                </div>
              </div>
              ${p}
            </div>
          `}).join(""),g=QUARTER_HIDE_EMPTY?"flex flex-col gap-4":"grid grid-cols-1 gap-4";i.push(`
          <div class="flex flex-col gap-3">
            <div class="flex flex-wrap items-center justify-between gap-2 px-1">
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-1 rounded-lg text-xs font-extrabold ${_.badgeCls}">${_.code}</span>
                <h3 class="font-display text-sm sm:text-base font-bold text-on-surface">${_.title}</h3>
              </div>
              <div class="text-xs font-semibold text-on-surface-variant">
                ${h.length} Sesi &bull; ${$.toLocaleString("id-ID")} Jam &bull; ${D.toLocaleString("id-ID")} Peserta
              </div>
            </div>
            <div class="${g}">
              ${f}
            </div>
          </div>
        `)});const b=QUARTER_HIDE_EMPTY&&k.length>0?`
        <div class="bg-surface-container-low/60 rounded-2xl border border-dashed border-outline-variant/60 px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-on-surface-variant">
          <div>
            <strong class="text-on-surface">Bulan Tanpa Jadwal (${k.length}):</strong> ${escapeHtml(k.join(" • "))}
          </div>
          <button type="button" onclick="toggleQuarterEmptyMonths()" class="font-bold text-primary hover:underline cursor-pointer">Tampilkan semua bulan</button>
        </div>
      `:"";!i.length&&!d?e.innerHTML='<div class="bg-surface-container-lowest rounded-2xl border border-outline-variant/50 p-10 text-center text-xs text-on-surface-variant">Tidak ada jadwal yang sesuai filter saat ini.</div>'+b:e.innerHTML=i.join("")+b+d}function setQuickTableStatus(t){const e=document.getElementById("filter-status");e&&(e.value=t),applyFiltersAndRender()}function setTableSort(t){const e=document.getElementById("table-sort-select");if(!e)return;const n={date:["date-asc","date-desc"],agenda:["agenda-asc","agenda-desc"],participants:["participants-desc","participants-asc"],hours:["hours-desc","hours-asc"]}[t];n&&(e.value=e.value===n[0]?n[1]:n[0],renderMasterTableView())}function renderMasterTableView(t){const e=document.getElementById("master-table-container");if(!e)return;const a=document.getElementById("filter-status")?.value||"all";document.querySelectorAll("#table-quick-status [data-qst]").forEach(o=>{const y=o.getAttribute("data-qst")===a;o.className=y?"px-2.5 py-1 rounded-lg font-bold bg-primary text-on-primary cursor-pointer":"px-2.5 py-1 rounded-lg font-medium bg-surface-container-lowest border border-outline-variant/50 text-on-surface-variant hover:text-on-surface cursor-pointer"});let n=Array.isArray(t)?[...t]:sortByChronological(getFilteredItems());const s=document.getElementById("table-sort-select")?.value||"date-asc";if(s==="date-desc"?n.sort((o,y)=>!o._range&&y._range?1:o._range&&!y._range?-1:(y._range?y._range[0].getTime():0)-(o._range?o._range[0].getTime():0)):s==="agenda-asc"?n.sort((o,y)=>o.agenda.localeCompare(y.agenda)):s==="agenda-desc"?n.sort((o,y)=>y.agenda.localeCompare(o.agenda)):s==="participants-desc"?n.sort((o,y)=>y.registered-o.registered):s==="participants-asc"?n.sort((o,y)=>o.registered-y.registered):s==="hours-desc"?n.sort((o,y)=>y._hours-o._hours):s==="hours-asc"&&n.sort((o,y)=>o._hours-y._hours),!n.length){e.innerHTML='<div class="p-10 text-center text-xs text-on-surface-variant">Tidak ada data pelatihan yang sesuai dengan filter saat ini.</div>';return}const r=o=>s.startsWith(o+"-")?s.endsWith("-asc")?" &uarr;":" &darr;":"",l=DATA_SOURCE==="atmp",c=l||n.some(o=>o._budget!==null&&o._budget!==void 0||o._actualBudget!==null&&o._actualBudget!==void 0),d=n.map((o,y)=>{const m=getCategoryMeta(o._category),S=o.kuota>0?Math.min(100,Math.round(o.registered/o.kuota*100)):0,u=S>=100?"bg-amber-600":S>=70?"bg-emerald-600":"bg-primary",p=y%2===1?"bg-surface-container-low/20":"bg-surface-container-lowest",v=o._budget!==null&&o._budget!==void 0?formatIdr(o._budget,!0):"-",M=o._actualBudget!==null&&o._actualBudget!==void 0?formatIdr(o._actualBudget,!0):"-",R=o._budget!==null&&o._budget!==void 0||o._actualBudget!==null&&o._actualBudget!==void 0;return`
          <tr onclick="openDetailModal('${escapeHtml(o._uid)}')" class="${p} hover:bg-primary-fixed/25 transition-colors cursor-pointer">
            <td class="py-2.5 px-3 text-center text-xs text-on-surface-variant">${y+1}</td>
            <td class="py-2.5 px-3 text-xs font-bold text-primary whitespace-nowrap">${escapeHtml(o.id_jadwal)}</td>
            <td class="py-2.5 px-3">
              <div class="text-xs font-bold text-on-surface">${escapeHtml(o.agenda)}</div>
              <div class="flex flex-wrap items-center gap-1.5 mt-0.5">
                <span class="px-1.5 py-0.2 rounded border text-[10px] font-semibold ${m.bgClass}">${escapeHtml(o._category)}</span>
                ${o.batch&&!/^batch\s*1$/i.test(o.batch)?`<span class="text-[10px] font-medium text-on-surface-variant">${escapeHtml(o.batch)}</span>`:""}
              </div>
            </td>
            <td class="py-2.5 px-3 text-xs whitespace-nowrap">
              <div class="font-semibold text-on-surface">${escapeHtml(o._dateRangeLabel)}${o._hasYearMismatch?`<span class="ml-1 inline-block px-1 py-0.2 rounded bg-amber-100 text-amber-800 text-[9.5px] font-bold">YR ${o._yearOverride}</span>`:""}</div>
              <div class="text-[10px] text-on-surface-variant">${o._quarter||"TBA"}${o.start_hour?" • Pukul "+escapeHtml(o.start_hour)+" WITA":""}</div>
            </td>
            <td class="py-2.5 px-3 text-xs whitespace-nowrap text-on-surface">${escapeHtml(o._durationLabel)}</td>
            <td class="py-2.5 px-3 text-xs text-on-surface">${escapeHtml(o.room)}</td>
            <td class="py-2.5 px-3 text-xs text-on-surface">${escapeHtml(o.pic)}</td>
            <td class="py-2.5 px-3 text-xs whitespace-nowrap">
              <div class="flex items-center justify-between gap-2 font-semibold">
                <span>${escapeHtml(formatCapacityText(o.registered,o.kuota))}</span>
                <span class="text-[10px] text-on-surface-variant">${o.kuota>0?S+"%":""}</span>
              </div>
              ${o.kuota>0?`<div class="w-24 h-1.5 rounded-full bg-surface-container-high overflow-hidden mt-1"><div class="h-full ${u} rounded-full" style="width:${S}%"></div></div>`:""}
            </td>
            ${c?`
            <td class="py-2.5 px-3 text-xs whitespace-nowrap">
              ${R?`<div class="font-semibold text-on-surface">Plan ${escapeHtml(o._planCost!=null?formatIdr(o._planCost,!0):"-")}</div><div class="text-[10px] text-on-surface-variant">@${escapeHtml(v)} &times; ${o.kuota||0} peserta</div>${o._actualCost!=null?`<div class="text-[10px] font-semibold text-primary">Actual ${escapeHtml(formatIdr(o._actualCost,!0))} <span class="font-normal text-on-surface-variant">(@${escapeHtml(M)} &times; ${o.registered||0})</span></div>`:""}`:'<div class="font-semibold text-on-surface-variant">-</div><div class="text-[10px] text-outline">Belum diisi</div>'}
            </td>`:""}
            <td class="py-2.5 px-3 whitespace-nowrap">
              <div class="inline-flex flex-wrap items-center gap-1">${renderTrackingBadgesHtml(o._tracking,{compact:!1})}</div>
              ${o._tracking&&o._tracking.isShifted&&(o._tracking.shiftNote||o._tracking.planDateLabel)?`<div class="text-[10px] font-semibold text-amber-800 mt-0.5">${escapeHtml(o._tracking.shiftNote||"Plan: "+o._tracking.planDateLabel)}</div>`:""}
            </td>
            <td class="py-2.5 px-3 text-center whitespace-nowrap">
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10.5px] font-bold ${o._status.badgeCls}">
                <span class="w-1.5 h-1.5 rounded-full ${o._status.dotCls}"></span>
                ${escapeHtml(o._status.label)}
              </span>
            </td>
          </tr>
        `}).join(""),i=n.reduce((o,y)=>o+(y._hours||0),0),k=n.reduce((o,y)=>o+(y._days||0),0),b=n.reduce((o,y)=>o+(y.registered||0),0),_=n.reduce((o,y)=>o+(y.kuota||0),0),h=n.reduce((o,y)=>o+(y._planCost||0),0),$=n.reduce((o,y)=>o+(y._actualCost||0),0),D=n.some(o=>o._budget!==null&&o._budget!==void 0||o._actualBudget!==null&&o._actualBudget!==void 0),x=n.filter(o=>o._tracking&&o._tracking.code==="REAL").length,f=n.filter(o=>o._tracking&&o._tracking.code==="PLAN").length,g=n.filter(o=>o._tracking&&o._tracking.isShifted).length;e.innerHTML=`
        <table class="w-full border-collapse text-left ${c?"min-w-[1260px]":"min-w-[1040px]"}">
          <thead class="bg-surface-container-low border-b border-outline-variant/50 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider sticky top-0 z-10">
            <tr>
              <th class="py-3 px-3 text-center w-10">No</th>
              <th class="py-3 px-3">ID Jadwal</th>
              <th class="py-3 px-3"><button type="button" onclick="setTableSort('agenda')" class="hover:text-primary cursor-pointer font-bold uppercase">Program Pelatihan${r("agenda")}</button></th>
              <th class="py-3 px-3"><button type="button" onclick="setTableSort('date')" class="hover:text-primary cursor-pointer font-bold uppercase">Periode &amp; Waktu${r("date")}</button></th>
              <th class="py-3 px-3"><button type="button" onclick="setTableSort('hours')" class="hover:text-primary cursor-pointer font-bold uppercase">Durasi${r("hours")}</button></th>
              <th class="py-3 px-3">Ruangan</th>
              <th class="py-3 px-3">Instruktur / PIC</th>
              <th class="py-3 px-3"><button type="button" onclick="setTableSort('participants')" class="hover:text-primary cursor-pointer font-bold uppercase">${l?"Actual / Plan":"Peserta / Kuota"}${r("participants")}</button></th>
              ${c?'<th class="py-3 px-3">Biaya Plan / Actual</th>':""}
              <th class="py-3 px-3">Kode Plan</th>
              <th class="py-3 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant/30">${d}</tbody>
          <tfoot class="bg-surface-container-low border-t-2 border-outline-variant/50 text-xs font-bold text-on-surface sticky bottom-0">
            <tr>
              <td colspan="4" class="py-2.5 px-3">Total (${n.length} Sesi Terpilih)</td>
              <td class="py-2.5 px-3 whitespace-nowrap">${i.toLocaleString("id-ID")} Jam (${k} Hari)</td>
              <td colspan="2" class="py-2.5 px-3 text-[11px] font-medium text-on-surface-variant">${new Set(n.map(o=>o.room)).size} Ruangan &bull; ${new Set(n.map(o=>o.pic)).size} PIC</td>
              <td class="py-2.5 px-3 whitespace-nowrap">${escapeHtml(formatCapacityText(b,_))}</td>
              ${c?`<td class="py-2.5 px-3 whitespace-nowrap">${D?`<div class="font-bold">${escapeHtml(formatIdr($,!0))}</div><div class="text-[10px] font-medium text-on-surface-variant">Plan: ${escapeHtml(formatIdr(h,!0))}</div>`:'<span class="text-on-surface-variant">-</span>'}</td>`:""}
              <td class="py-2.5 px-3 whitespace-nowrap text-[11px] font-bold text-on-surface">${x} REAL &bull; ${f} PLAN${g?" &bull; "+g+" Geser":""}</td>
              <td class="py-2.5 px-3 text-center text-[11px] text-primary">${n.filter(o=>o._status.key==="completed").length}/${n.filter(o=>!!o._range).length} Selesai</td>
            </tr>
          </tfoot>
        </table>
      `}const PLAFON_STORE_KEY="lnd_atmp_plafon_v1";let PLAFON_MEM={};function readPlafonStore(){let t={};try{t=JSON.parse(localStorage.getItem(PLAFON_STORE_KEY)||"{}")||{}}catch{t={}}return Object.assign({},PLAFON_MEM,t)}function getPlafon(t){const e=Number(readPlafonStore()[String(t)]);return e>0?e:null}function writePlafonStore(t,e){const a=readPlafonStore();e===null?delete a[String(t)]:a[String(t)]=e,PLAFON_MEM=a;try{return localStorage.setItem(PLAFON_STORE_KEY,JSON.stringify(a)),!0}catch{return!1}}function formatPlafonInput(t){const e=String(t.value||"").replace(/\D/g,"");t.value=e?Number(e).toLocaleString("id-ID"):""}function savePlafonFromInput(){if(SELECTED_YEAR==="all")return;const t=document.getElementById("budget-plafon-input"),e=Number(String(t?t.value:"").replace(/\D/g,""));if(!e){showToast("warning","Plafon belum valid","Isi total anggaran ATMP setahun dalam rupiah, misalnya 3.500.000.000.");return}const a=writePlafonStore(SELECTED_YEAR,e);showToast(a?"success":"warning",a?"Plafon tersimpan":"Plafon dipakai sementara",a?`Plafon ${SELECTED_YEAR}: ${formatIdr(e)}`:"Browser memblokir penyimpanan lokal, plafon hilang setelah halaman ditutup."),rerenderBudgetView()}function clearPlafon(){SELECTED_YEAR!=="all"&&(writePlafonStore(SELECTED_YEAR,null),showToast("info","Plafon dihapus",`Plafon ${SELECTED_YEAR} dihapus dari browser ini.`),rerenderBudgetView())}function getCostMonthIdx(t){return t._range?(SELECTED_YEAR==="all"?t._range:getDisplayRangeForYear(t,SELECTED_YEAR)||t._range)[0].getMonth():null}function projectedCostOf(t){return t._actualCost!=null?t._actualCost:t._planCost||0}function aggBudget(t){const e={sessions:t.length,planPax:0,actualPax:0,planCost:0,actualCost:0,planCostRealized:0,projected:0,paxWithBudget:0,paxWithActual:0,withBudget:0,withActual:0,volVar:0,priceVar:0};return t.forEach(a=>{const n=a.kuota||0,s=a.registered||0;if(e.planPax+=n,e.actualPax+=s,e.projected+=projectedCostOf(a),a._planCost!=null&&(e.planCost+=a._planCost,e.withBudget++,e.paxWithBudget+=n),a._actualCost!=null){e.actualCost+=a._actualCost,e.withActual++,e.paxWithActual+=s,e.planCostRealized+=a._planCost||0;const r=a._budget||0;e.volVar+=(s-n)*r,ACTUAL_BUDGET_PER_PAX&&(e.priceVar+=s*((a._actualBudget||0)-r))}}),e}function buildProjection(t){const e={realized:0,realizedN:0,remaining:0,remainingN:0,overdue:0,overdueN:0,unbudgetedN:0,projected:0};return t.forEach(a=>{if(a._planCost==null&&a._actualCost==null){e.unbudgetedN++;return}if(a._actualCost!=null)e.realized+=a._actualCost,e.realizedN++;else{const n=a._planCost||0;e.remaining+=n,e.remainingN++,a._status&&a._status.key==="completed"&&(e.overdue+=n,e.overdueN++)}}),e.projected=e.realized+e.remaining,e}const fmtSigned=t=>(t>0?"+":t<0?"-":"")+formatIdr(Math.abs(t),!0),pctOf=(t,e)=>e>0?Math.round(t/e*100):null;function sortBudgetList(t,e){const a=s=>s._planCost!=null&&s._actualCost!=null?Math.abs(s._planCost-s._actualCost):-1,n=[...t];return e==="cost-desc"?n.sort((s,r)=>(r._planCost||0)-(s._planCost||0)):e==="perpax-desc"?n.sort((s,r)=>(r._budget||0)-(s._budget||0)):e==="pax-desc"?n.sort((s,r)=>(r.kuota||0)-(s.kuota||0)):e==="gap-desc"?n.sort((s,r)=>a(r)-a(s)):e==="agenda-asc"&&n.sort((s,r)=>s.agenda.localeCompare(r.agenda)),n}function computeBudgetModel(t){const e=getScopedBaseList().filter(f=>doesItemMatchYear(f,SELECTED_YEAR)),a=aggBudget(t),n=aggBudget(e),s=buildProjection(e),r=SELECTED_YEAR==="all"?null:getPlafon(SELECTED_YEAR),l=t.length===e.length,c=Array.from({length:12},()=>[]),d=[];t.forEach(f=>{const g=getCostMonthIdx(f);g===null?d.push(f):c[g].push(f)});const i=c.map(f=>aggBudget(f)),k=aggBudget(d);let b=0,_=null;const h=i.map((f,g)=>(b+=f.projected,r&&l&&_===null&&b>r&&(_=g),b)),$=b+k.projected;r&&l&&_===null&&d.length&&$>r&&(_="undated");const D=[0,1,2,3].map(f=>aggBudget([].concat(c[f*3],c[f*3+1],c[f*3+2]))),x=CATEGORIES.map(f=>({c:f,s:aggBudget(t.filter(g=>g._category===f.key))})).filter(f=>f.s.sessions>0).sort((f,g)=>g.s.planCost-f.s.planCost);return{items:t,yearItems:e,A:a,Y:n,P:s,plafon:r,isFullYear:l,monthStats:i,monthCum:h,undated:d,undatedStats:k,totalCum:$,firstOver:_,quarterStats:D,catRows:x}}function rerenderBudgetView(){renderBudgetView(sortByChronological(getFilteredItems()))}function renderPlafonCard(t){const e=document.getElementById("budget-plafon-card");if(!e)return;const a="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)] p-4 sm:p-5 flex flex-col gap-3.5";if(SELECTED_YEAR==="all"){e.className=a,e.innerHTML='<div class="text-xs text-slate-500">Pilih satu tahun (misalnya 2027) di bagian atas untuk mengatur plafon anggaran dan melihat proyeksi akhir tahun.</div>';return}const{plafon:n,Y:s,P:r}=t,l=SELECTED_YEAR,c=n?pctOf(s.planCost,n):null,d=n?pctOf(r.projected,n):null,i=n?n-r.projected:null,k=n?n-s.planCost:null;let b="";const _=(y,m,S)=>`<div class="p-3 rounded-xl border text-xs flex items-start gap-2 ${{red:"bg-red-50 border-red-200 text-red-900",amber:"bg-amber-50 border-amber-200 text-amber-900",green:"bg-emerald-50 border-emerald-200 text-emerald-900"}[y]}"><span class="material-symbols-outlined text-[18px] shrink-0">${m}</span><span>${S}</span></div>`;n&&(s.planCost>n?b+=_("red","warning",`<strong>Rencana biaya melebihi plafon</strong> sebesar ${formatIdr(s.planCost-n)} (${c}% dari plafon). Kurangi target peserta atau agenda sampai rencana kembali di bawah ${formatIdr(n,!0)}.`):r.projected>n?b+=_("red","trending_up",`<strong>Proyeksi akhir tahun melebihi plafon</strong> sebesar ${formatIdr(r.projected-n)}. Rencana masih muat, tetapi realisasi yang sudah masuk lebih besar dari rencananya.`):c!==null&&c>=90?b+=_("amber","info",`Rencana biaya sudah memakai ${c}% plafon. Sisa ruang hanya ${formatIdr(k,!0)}.`):b+=_("green","check_circle",`Rencana biaya masih di dalam plafon. Sisa plafon terhadap rencana ${formatIdr(k,!0)}.`)),r.overdueN>0&&(b+=_("amber","event_busy",`${r.overdueN} sesi sudah lewat tanggalnya tetapi belum punya data actual. Biayanya (${formatIdr(r.overdue,!0)}) masih dihitung memakai rencana di proyeksi.`)),r.unbudgetedN>0&&(b+=_("amber","info",`${r.unbudgetedN} sesi tahun ${l} belum punya budget, jadi belum masuk hitungan plafon dan proyeksi.`));const h=Math.max(n||0,r.projected,1),$=r.realized/h*100,D=r.remaining/h*100,x=n?Math.min(100,n/h*100):null,f=n?`
        <div class="flex flex-col gap-1.5">
          <div class="relative h-3 rounded-full bg-slate-100 overflow-hidden">
            <div class="absolute inset-y-0 left-0 bg-emerald-600" style="width:${$}%"></div>
            <div class="absolute inset-y-0 bg-primary" style="left:${$}%; width:${D}%"></div>
            <div class="absolute inset-y-0 w-0.5 bg-slate-900" style="left:${x}%"></div>
          </div>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
            <span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-600"></span>Realisasi ${formatIdr(r.realized,!0)} (${r.realizedN} sesi)</span>
            <span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-primary"></span>Rencana sesi yang belum jalan ${formatIdr(r.remaining,!0)} (${r.remainingN} sesi)</span>
            <span class="inline-flex items-center gap-1"><span class="w-0.5 h-3 bg-slate-900"></span>Plafon ${formatIdr(n,!0)}</span>
          </div>
        </div>`:"",g=(y,m,S,u)=>`
        <div class="p-3 rounded-xl bg-slate-50 min-w-0">
          <div class="text-[11px] text-slate-500">${y}</div>
          <div class="font-display text-base sm:text-lg font-bold ${u||"text-slate-900"} truncate">${m}</div>
          <div class="text-[11px] text-slate-500 leading-snug">${S}</div>
        </div>`,o=n?Number(n).toLocaleString("id-ID"):"";e.className=a,e.innerHTML=`
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <h4 class="font-display text-sm font-bold text-slate-900">Plafon anggaran ${l} dan proyeksi akhir tahun</h4>
            <p class="text-[11px] text-slate-500">Dihitung dari seluruh sesi tahun ${l}, tidak terpengaruh filter. Proyeksi = realisasi sesi yang sudah punya actual + rencana sesi lainnya.</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">Rp</span>
              <input id="budget-plafon-input" type="text" inputmode="numeric" autocomplete="off" value="${o}" placeholder="Total anggaran ATMP ${l}" oninput="formatPlafonInput(this)" onkeydown="if(event.key==='Enter'){savePlafonFromInput();}" class="h-9 w-56 pl-9 pr-3 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-primary" aria-label="Plafon anggaran ${l} dalam rupiah">
            </div>
            <button type="button" onclick="savePlafonFromInput()" class="h-9 px-3.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold cursor-pointer">Simpan plafon</button>
            ${n?'<button type="button" onclick="clearPlafon()" class="h-9 px-3 rounded-xl bg-white border border-slate-200 hover:border-red-300 text-xs font-semibold text-slate-600 cursor-pointer">Hapus</button>':""}
          </div>
        </div>
        ${n?"":`<div class="text-xs text-slate-500">Plafon ${l} belum diisi. Masukkan total anggaran ATMP setahun untuk melihat sisa plafon dan peringatan. Nilai disimpan di browser ini.</div>`}
        <div class="grid grid-cols-2 xl:grid-cols-4 gap-3">
          ${g("Plafon "+l,n?formatIdr(n,!0):"Belum diisi",n?"Total anggaran ATMP setahun":"Isi di kolom atas")}
          ${g("Rencana biaya "+l,formatIdr(s.planCost,!0),c!==null?c+"% dari plafon":"Budget per peserta &times; target peserta","text-primary")}
          ${g("Proyeksi akhir tahun",formatIdr(r.projected,!0),d!==null?d+"% dari plafon":"Realisasi + rencana sisa","text-slate-900")}
          ${g("Sisa plafon",i!==null?formatIdr(i,!0):"-",i!==null?"Terhadap rencana "+formatIdr(k,!0):"Menunggu plafon",i!==null&&i<0?"text-red-700":"text-emerald-700")}
        </div>
        ${f}
        ${b?`<div class="flex flex-col gap-2">${b}</div>`:""}`}function renderBudgetView(t){const e=document.getElementById("budget-summary-cards");if(!e)return;const a=document.getElementById("budget-panel-title");a&&(a.textContent=`Budget & Realisasi Training ${SELECTED_YEAR==="all"?"(Semua Tahun)":SELECTED_YEAR}`);const n=computeBudgetModel(t),{A:s,plafon:r}=n;renderPlafonCard(n);const l=s.paxWithBudget>0?s.planCost/s.paxWithBudget:null,c=s.paxWithActual>0?s.actualCost/s.paxWithActual:null,d=pctOf(s.actualPax,s.planPax),i=pctOf(s.actualCost,s.planCost),k=s.planCost-s.actualCost,b=(m,S,u,p)=>`
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)] p-3.5 flex flex-col gap-1.5 min-w-0">
          <span class="text-xs font-medium text-slate-500">${m}</span>
          <span class="font-display text-lg sm:text-xl font-bold ${p||"text-slate-900"} truncate">${S}</span>
          <span class="text-[11px] text-slate-500 leading-snug">${u}</span>
        </div>`;e.innerHTML=[b("Target peserta",s.planPax.toLocaleString("id-ID"),`${s.sessions} sesi, ${s.withBudget} sudah punya budget`),b("Rencana biaya",formatIdr(s.planCost,!0),"Budget per peserta &times; target peserta","text-primary"),b("Budget rata-rata",l!==null?formatIdr(l,!0):"-",`per peserta (plan)${c!==null?`, actual ${formatIdr(c,!0)}`:""}`),b("Peserta terealisasi",s.actualPax.toLocaleString("id-ID"),d!==null?`${d}% dari target ${s.planPax.toLocaleString("id-ID")}`:"Target belum diisi"),b("Realisasi biaya",formatIdr(s.actualCost,!0),i!==null?`${i}% dari rencana terserap`:"Belum ada rencana biaya","text-emerald-700"),b("Sisa anggaran",formatIdr(k,!0),"Rencana biaya dikurangi realisasi",k<0?"text-red-700":"text-slate-900")].join("");const _=document.getElementById("budget-variance-strip");if(_)if(s.withActual>0){const m=s.actualCost-s.planCostRealized,S=u=>u>0?"text-red-700":u<0?"text-emerald-700":"text-slate-700";_.className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 flex flex-col gap-2",_.innerHTML=`
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-xs font-bold text-slate-900">Selisih pada ${s.withActual} sesi yang sudah punya data actual</span>
              <span class="text-[11px] text-slate-500">Tanda + berarti melebihi rencana, tanda - berarti di bawah rencana</span>
            </div>
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div class="p-2.5 rounded-lg bg-slate-50"><div class="text-[11px] text-slate-500">Rencana sesi tersebut</div><div class="font-bold text-slate-900 mt-0.5">${formatIdr(s.planCostRealized,!0)}</div></div>
              <div class="p-2.5 rounded-lg bg-slate-50"><div class="text-[11px] text-slate-500">Actual</div><div class="font-bold text-slate-900 mt-0.5">${formatIdr(s.actualCost,!0)}</div></div>
              <div class="p-2.5 rounded-lg bg-slate-50"><div class="text-[11px] text-slate-500">Karena jumlah peserta</div><div class="font-bold ${S(s.volVar)} mt-0.5">${fmtSigned(s.volVar)}</div></div>
              <div class="p-2.5 rounded-lg bg-slate-50"><div class="text-[11px] text-slate-500">Karena budget per peserta</div><div class="font-bold ${S(s.priceVar)} mt-0.5">${ACTUAL_BUDGET_PER_PAX?fmtSigned(s.priceVar):"-"}</div></div>
            </div>
            <div class="text-[11px] text-slate-500">Total selisih <strong class="${S(m)}">${fmtSigned(m)}</strong>: selisih peserta dihitung (peserta actual &minus; target) &times; budget plan, selisih harga dihitung peserta actual &times; (budget actual &minus; budget plan).</div>`}else _.className="hidden",_.innerHTML="";const h=document.getElementById("budget-quality-strip");if(h){const m=t.filter(v=>v._budget==null).length,S=t.filter(v=>!(v.kuota>0)).length,u=t.filter(v=>!v._range).length,p=[];m&&p.push(`${m} sesi belum punya budget`),S&&p.push(`${S} sesi belum punya target peserta`),u&&p.push(`${u} sesi belum punya tanggal valid`),p.length?(h.className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2",h.innerHTML=`<span class="material-symbols-outlined text-[18px] shrink-0">info</span><span>${p.join(", ")}. Sesi tersebut belum masuk penuh ke total biaya. Lengkapi kolom BUDGET, PLAN, START di sheet ATMP.</span>`):(h.className="hidden",h.innerHTML="")}const $=document.getElementById("budget-quarter-strip");$&&($.innerHTML=n.quarterStats.map((m,S)=>{const u=pctOf(m.actualCost,m.planCost);return`
            <div class="p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 flex flex-col gap-0.5">
              <div class="flex items-center justify-between"><span class="text-xs font-bold text-slate-900">Q${S+1}</span><span class="text-[10px] text-slate-500">${m.sessions} sesi, ${m.planPax.toLocaleString("id-ID")} peserta</span></div>
              <div class="text-sm font-bold text-primary">${formatIdr(m.planCost,!0)}</div>
              <div class="text-[11px] text-slate-500">Actual ${formatIdr(m.actualCost,!0)}${u!==null?` (${u}%)`:""}</div>
              <div class="text-[11px] text-slate-500">Proyeksi ${formatIdr(m.projected,!0)}</div>
            </div>`}).join(""));const D=document.getElementById("budget-month-container");if(D){const m=!!(r&&n.isFullYear),S=Math.max(1,...n.monthStats.map(A=>A.planCost)),u=A=>{if(!m)return"";const P=r-A;return`<td class="py-2 px-3 text-xs text-right whitespace-nowrap font-semibold ${P<0?"text-red-700":"text-emerald-700"}">${P<0?"Lebih ":""}${formatIdr(Math.abs(P),!0)}</td>`},p=n.monthStats.map((A,P)=>{if(A.sessions===0)return"";const L=Math.max(3,Math.round(A.planCost/S*100)),B=pctOf(A.actualCost,A.planCost),C=n.firstOver===P;return`
            <tr class="${C?"bg-red-50/70":"hover:bg-slate-50/70"}">
              <td class="py-2 px-3 text-xs font-semibold text-slate-900 whitespace-nowrap">${MONTH_NAMES[P]}${C?' <span class="ml-1 px-1.5 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold">melewati plafon</span>':""}</td>
              <td class="py-2 px-3 text-xs text-right">${A.sessions}</td>
              <td class="py-2 px-3 text-xs text-right">${A.planPax.toLocaleString("id-ID")}</td>
              <td class="py-2 px-3 text-xs min-w-[150px]"><div class="font-semibold text-slate-900 text-right">${formatIdr(A.planCost,!0)}</div><div class="h-1.5 rounded-full bg-slate-100 mt-1 overflow-hidden"><div class="h-full rounded-full bg-primary" style="width:${L}%"></div></div></td>
              <td class="py-2 px-3 text-xs text-right">${A.actualPax.toLocaleString("id-ID")}</td>
              <td class="py-2 px-3 text-xs text-right font-semibold text-emerald-700">${A.withActual?formatIdr(A.actualCost,!0):"-"}</td>
              <td class="py-2 px-3 text-xs text-right">${B!==null&&A.withActual?B+"%":"-"}</td>
              <td class="py-2 px-3 text-xs text-right whitespace-nowrap">${formatIdr(A.projected,!0)}</td>
              <td class="py-2 px-3 text-xs text-right text-slate-500 whitespace-nowrap">${formatIdr(n.monthCum[P],!0)}</td>
              ${u(n.monthCum[P])}
            </tr>`}).join(""),v=n.undatedStats,M=n.undated.length?`
            <tr class="${n.firstOver==="undated"?"bg-red-50/70":"bg-amber-50/50"}">
              <td class="py-2 px-3 text-xs font-semibold text-amber-900">Belum terjadwal</td>
              <td class="py-2 px-3 text-xs text-right">${v.sessions}</td>
              <td class="py-2 px-3 text-xs text-right">${v.planPax.toLocaleString("id-ID")}</td>
              <td class="py-2 px-3 text-xs text-right font-semibold">${formatIdr(v.planCost,!0)}</td>
              <td class="py-2 px-3 text-xs text-right">${v.actualPax.toLocaleString("id-ID")}</td>
              <td class="py-2 px-3 text-xs text-right font-semibold text-emerald-700">${v.withActual?formatIdr(v.actualCost,!0):"-"}</td>
              <td class="py-2 px-3 text-xs text-right">-</td>
              <td class="py-2 px-3 text-xs text-right whitespace-nowrap">${formatIdr(v.projected,!0)}</td>
              <td class="py-2 px-3 text-xs text-right text-slate-500 whitespace-nowrap">${formatIdr(n.totalCum,!0)}</td>
              ${u(n.totalCum)}
            </tr>`:"",R=m&&n.firstOver!==null?`<div class="px-4 py-2.5 text-xs text-red-800 bg-red-50 border-t border-red-100">Kumulatif proyeksi melewati plafon ${formatIdr(r,!0)} mulai ${n.firstOver==="undated"?"sesi yang belum terjadwal":MONTH_NAMES[n.firstOver]}.</div>`:"",N=r&&!n.isFullYear?`<div class="px-4 py-2.5 text-xs text-slate-600 bg-slate-50 border-t border-slate-100">Filter sedang aktif (${n.items.length} dari ${n.yearItems.length} sesi), jadi kolom sisa plafon disembunyikan. Reset filter untuk melihatnya.</div>`:"";D.innerHTML=t.length?`
          <table class="w-full border-collapse text-left ${m?"min-w-[1020px]":"min-w-[900px]"}">
            <thead class="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500">
              <tr>
                <th class="py-2.5 px-3">Bulan</th>
                <th class="py-2.5 px-3 text-right">Sesi</th>
                <th class="py-2.5 px-3 text-right">Target peserta</th>
                <th class="py-2.5 px-3 text-right">Rencana biaya</th>
                <th class="py-2.5 px-3 text-right">Peserta actual</th>
                <th class="py-2.5 px-3 text-right">Realisasi biaya</th>
                <th class="py-2.5 px-3 text-right">Terserap</th>
                <th class="py-2.5 px-3 text-right">Proyeksi</th>
                <th class="py-2.5 px-3 text-right">Kumulatif proyeksi</th>
                ${m?'<th class="py-2.5 px-3 text-right">Sisa plafon</th>':""}
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">${p}${M}</tbody>
            <tfoot class="bg-slate-50 border-t-2 border-slate-200 text-xs font-bold text-slate-900">
              <tr>
                <td class="py-2.5 px-3">Total</td>
                <td class="py-2.5 px-3 text-right">${s.sessions}</td>
                <td class="py-2.5 px-3 text-right">${s.planPax.toLocaleString("id-ID")}</td>
                <td class="py-2.5 px-3 text-right">${formatIdr(s.planCost,!0)}</td>
                <td class="py-2.5 px-3 text-right">${s.actualPax.toLocaleString("id-ID")}</td>
                <td class="py-2.5 px-3 text-right text-emerald-700">${formatIdr(s.actualCost,!0)}</td>
                <td class="py-2.5 px-3 text-right">${i!==null?i+"%":"-"}</td>
                <td class="py-2.5 px-3 text-right">${formatIdr(s.projected,!0)}</td>
                <td class="py-2.5 px-3"></td>
                ${m?'<td class="py-2.5 px-3"></td>':""}
              </tr>
            </tfoot>
          </table>${R}${N}`:'<div class="p-8 text-center text-xs text-slate-500">Tidak ada sesi yang sesuai dengan filter saat ini.</div>'}const x=document.getElementById("budget-category-container");x&&(x.innerHTML=n.catRows.length?`
          <table class="w-full border-collapse text-left min-w-[360px]">
            <thead class="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500">
              <tr><th class="py-2.5 px-3">Kategori</th><th class="py-2.5 px-3 text-right">Peserta</th><th class="py-2.5 px-3 text-right">Rencana</th><th class="py-2.5 px-3 text-right">Actual</th></tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${n.catRows.map(({c:m,s:S})=>{const u=pctOf(S.planCost,s.planCost);return`
                <tr>
                  <td class="py-2 px-3 text-xs"><div class="flex items-center gap-1.5 font-semibold text-slate-900"><span class="w-2 h-2 rounded-full ${m.barClass} shrink-0"></span>${escapeHtml(m.key)}</div><div class="text-[10px] text-slate-500 mt-0.5">${S.sessions} sesi${u!==null?`, ${u}% dari rencana`:""}</div></td>
                  <td class="py-2 px-3 text-xs text-right">${S.planPax.toLocaleString("id-ID")}</td>
                  <td class="py-2 px-3 text-xs text-right font-semibold">${formatIdr(S.planCost,!0)}</td>
                  <td class="py-2 px-3 text-xs text-right text-emerald-700 font-semibold">${S.withActual?formatIdr(S.actualCost,!0):"-"}</td>
                </tr>`}).join("")}
            </tbody>
          </table>`:'<div class="p-8 text-center text-xs text-slate-500">Belum ada data kategori.</div>');const f=document.getElementById("budget-detail-container");if(!f)return;const g=document.getElementById("budget-sort-select")?.value||"cost-desc",o=sortBudgetList(t,g);if(!o.length){f.innerHTML='<div class="p-10 text-center text-xs text-slate-500">Tidak ada sesi yang sesuai dengan filter saat ini.</div>';return}const y=o.map((m,S)=>{const u=getCategoryMeta(m._category),p=m._actualCost!=null,v=m._planCost!=null&&p?m._planCost-m._actualCost:null,M=m._planCost>0&&p?Math.round(m._actualCost/m._planCost*100):null,R=M===null?"bg-slate-300":M>100?"bg-red-600":"bg-emerald-600",N=getCostMonthIdx(m);return`
          <tr onclick="openDetailModal('${escapeHtml(m._uid)}')" class="${S%2?"bg-slate-50/50":"bg-white"} hover:bg-primary-fixed/25 transition-colors cursor-pointer">
            <td class="py-2.5 px-3 text-center text-xs text-slate-500">${S+1}</td>
            <td class="py-2.5 px-3">
              <div class="text-xs font-bold text-slate-900">${escapeHtml(m.agenda)}</div>
              <div class="flex flex-wrap items-center gap-1.5 mt-0.5">
                <span class="text-[10px] font-semibold text-primary">${escapeHtml(m.id_jadwal)}</span>
                <span class="px-1.5 rounded border text-[10px] font-semibold ${u.bgClass}">${escapeHtml(m._category)}</span>
                <span class="text-[10px] text-slate-500">${N!==null?MONTH_SHORT[N]:"Belum terjadwal"}</span>
              </div>
            </td>
            <td class="py-2.5 px-3 text-xs text-right whitespace-nowrap font-semibold">${m._budget!=null?formatIdr(m._budget):"-"}</td>
            <td class="py-2.5 px-3 text-xs text-right">${m.kuota||0}</td>
            <td class="py-2.5 px-3 text-xs text-right whitespace-nowrap font-bold text-slate-900">${m._planCost!=null?formatIdr(m._planCost):"-"}</td>
            <td class="py-2.5 px-3 text-xs text-right">${m.registered||0}</td>
            <td class="py-2.5 px-3 text-xs text-right whitespace-nowrap">${m._actualBudget!=null?formatIdr(m._actualBudget):"-"}</td>
            <td class="py-2.5 px-3 text-xs text-right whitespace-nowrap font-bold text-emerald-700">${p?formatIdr(m._actualCost):"-"}</td>
            <td class="py-2.5 px-3 text-xs text-right whitespace-nowrap font-semibold ${v===null?"text-slate-400":v>=0?"text-emerald-700":"text-red-700"}">${v===null?"-":(v>=0?"Sisa ":"Lebih ")+formatIdr(Math.abs(v),!0)}</td>
            <td class="py-2.5 px-3 text-xs min-w-[96px]">
              <div class="text-right font-semibold">${M!==null?M+"%":"-"}</div>
              <div class="h-1.5 rounded-full bg-slate-100 mt-1 overflow-hidden"><div class="h-full ${R} rounded-full" style="width:${Math.min(100,M||0)}%"></div></div>
            </td>
            <td class="py-2.5 px-3 text-center whitespace-nowrap">
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10.5px] font-bold ${m._status.badgeCls}"><span class="w-1.5 h-1.5 rounded-full ${m._status.dotCls}"></span>${escapeHtml(m._status.label)}</span>
            </td>
          </tr>`}).join("");f.innerHTML=`
        <table class="w-full border-collapse text-left min-w-[1280px]">
          <thead class="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 sticky top-0 z-10">
            <tr>
              <th class="py-3 px-3 text-center w-10">No</th>
              <th class="py-3 px-3">Training</th>
              <th class="py-3 px-3 text-right">Budget plan / peserta</th>
              <th class="py-3 px-3 text-right">Target peserta</th>
              <th class="py-3 px-3 text-right">Total biaya plan</th>
              <th class="py-3 px-3 text-right">Peserta actual</th>
              <th class="py-3 px-3 text-right">Budget actual / peserta</th>
              <th class="py-3 px-3 text-right">Total biaya actual</th>
              <th class="py-3 px-3 text-right">Sisa / lebih</th>
              <th class="py-3 px-3 text-right">Terserap</th>
              <th class="py-3 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">${y}</tbody>
          <tfoot class="bg-slate-50 border-t-2 border-slate-200 text-xs font-bold text-slate-900 sticky bottom-0">
            <tr>
              <td colspan="2" class="py-2.5 px-3">Total ${o.length} sesi</td>
              <td class="py-2.5 px-3 text-right whitespace-nowrap">${l!==null?"rata-rata "+formatIdr(l,!0):"-"}</td>
              <td class="py-2.5 px-3 text-right">${s.planPax.toLocaleString("id-ID")}</td>
              <td class="py-2.5 px-3 text-right whitespace-nowrap">${formatIdr(s.planCost)}</td>
              <td class="py-2.5 px-3 text-right">${s.actualPax.toLocaleString("id-ID")}</td>
              <td class="py-2.5 px-3 text-right whitespace-nowrap">${c!==null?"rata-rata "+formatIdr(c,!0):"-"}</td>
              <td class="py-2.5 px-3 text-right whitespace-nowrap text-emerald-700">${formatIdr(s.actualCost)}</td>
              <td class="py-2.5 px-3 text-right whitespace-nowrap ${k<0?"text-red-700":""}">${k<0?"Lebih ":"Sisa "}${formatIdr(Math.abs(k),!0)}</td>
              <td class="py-2.5 px-3 text-right">${i!==null?i+"%":"-"}</td>
              <td class="py-2.5 px-3"></td>
            </tr>
          </tfoot>
        </table>`}function exportBudgetCsv(){const t=sortByChronological(getFilteredItems());if(!t.length){showToast("info","Data Kosong","Tidak ada sesi untuk diekspor.");return}const e=computeBudgetModel(t),{A:a,Y:n,P:s,plafon:r}=e,l=SELECTED_YEAR==="all"?"Semua_Tahun":SELECTED_YEAR,c=g=>`"${String(g??"").replace(/"/g,'""')}"`,d=g=>g==null?"":Math.round(g),i=(g,o)=>{const y=pctOf(g,o);return y===null?"":y},k=[],b=g=>k.push(g.map(c).join(","));b(["Budget dan Realisasi Annual Training Master Plan",l]),b(["Tanggal ekspor",new Date().toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})]),b(["Sesi dalam ekspor",`${t.length} dari ${e.yearItems.length} sesi pada tahun terpilih`]),b(["Rumus","Total biaya = budget per peserta x jumlah peserta. Plan memakai target peserta, actual memakai peserta aktual."]),b([]),b(["RINGKASAN (sesi dalam ekspor)"]),b(["Target_Peserta",a.planPax]),b(["Rencana_Biaya",d(a.planCost)]),b(["Budget_Rata2_per_Peserta_Plan",a.paxWithBudget?d(a.planCost/a.paxWithBudget):""]),b(["Peserta_Actual",a.actualPax]),b(["Realisasi_Biaya",d(a.actualCost)]),b(["Terserap_Persen",i(a.actualCost,a.planCost)]),b(["Sisa_Anggaran_Rencana_dikurangi_Realisasi",d(a.planCost-a.actualCost)]),b([]),b(["PLAFON DAN PROYEKSI (seluruh sesi tahun terpilih, tidak terpengaruh filter)"]),b(["Plafon_Anggaran",r?d(r):"Belum diisi"]),b(["Rencana_Biaya_Setahun",d(n.planCost)]),b(["Realisasi_Sesi_yang_Punya_Actual",d(s.realized)]),b(["Rencana_Sesi_yang_Belum_Punya_Actual",d(s.remaining)]),b(["Proyeksi_Akhir_Tahun",d(s.projected)]),b(["Sisa_Plafon_terhadap_Rencana",r?d(r-n.planCost):""]),b(["Sisa_Plafon_terhadap_Proyeksi",r?d(r-s.projected):""]),b(["Status_Plafon",r?n.planCost>r?"Rencana melebihi plafon":s.projected>r?"Proyeksi melebihi plafon":"Di dalam plafon":"Plafon belum diisi"]),b(["Sesi_Lewat_Tanpa_Actual",s.overdueN]),b(["Sesi_Belum_Punya_Budget",s.unbudgetedN]),b([]),b(["PER KUARTAL"]),b(["Kuartal","Sesi","Target_Peserta","Rencana_Biaya","Peserta_Actual","Realisasi_Biaya","Terserap_Persen","Proyeksi_Biaya"]),e.quarterStats.forEach((g,o)=>b([`Q${o+1}`,g.sessions,g.planPax,d(g.planCost),g.actualPax,d(g.actualCost),i(g.actualCost,g.planCost),d(g.projected)])),b([]),b(["PER BULAN"]),b(["Bulan","Sesi","Target_Peserta","Rencana_Biaya","Peserta_Actual","Realisasi_Biaya","Terserap_Persen","Proyeksi_Biaya","Kumulatif_Proyeksi","Sisa_Plafon"]);const _=!!(r&&e.isFullYear);if(e.monthStats.forEach((g,o)=>{g.sessions&&b([MONTH_NAMES[o],g.sessions,g.planPax,d(g.planCost),g.actualPax,d(g.actualCost),i(g.actualCost,g.planCost),d(g.projected),d(e.monthCum[o]),_?d(r-e.monthCum[o]):""])}),e.undated.length){const g=e.undatedStats;b(["Belum terjadwal",g.sessions,g.planPax,d(g.planCost),g.actualPax,d(g.actualCost),i(g.actualCost,g.planCost),d(g.projected),d(e.totalCum),_?d(r-e.totalCum):""])}b([]),b(["PER KATEGORI"]),b(["Kategori","Sesi","Target_Peserta","Rencana_Biaya","Peserta_Actual","Realisasi_Biaya","Proyeksi_Biaya"]),e.catRows.forEach(({c:g,s:o})=>b([g.key,o.sessions,o.planPax,d(o.planCost),o.actualPax,d(o.actualCost),d(o.projected)])),b([]),b(["DETAIL PER TRAINING"]),b(["No","ID_Jadwal","Nama_Pelatihan","Kategori","Bulan","Budget_per_Peserta_Plan","Target_Peserta","Total_Biaya_Plan","Peserta_Actual","Budget_per_Peserta_Actual","Total_Biaya_Actual","Sisa_Selisih_Biaya","Terserap_Persen","Proyeksi_Biaya","Status"]);const h=document.getElementById("budget-sort-select")?.value||"cost-desc";sortBudgetList(t,h).forEach((g,o)=>{const y=getCostMonthIdx(g);b([o+1,g.id_jadwal,g.agenda,g._category,y!==null?MONTH_NAMES[y]:"Belum terjadwal",d(g._budget),g.kuota||0,d(g._planCost),g.registered||0,d(g._actualBudget),d(g._actualCost),g._planCost!=null&&g._actualCost!=null?d(g._planCost-g._actualCost):"",g._planCost>0&&g._actualCost!=null?Math.round(g._actualCost/g._planCost*100):"",d(projectedCostOf(g)),g._status?g._status.label:""])});const $="\uFEFF"+k.join(`\r
`),D=new Blob([$],{type:"text/csv;charset=utf-8;"}),x=URL.createObjectURL(D),f=document.createElement("a");f.href=x,f.download=`Budget_Realisasi_ATMP_${l}_PGP.csv`,document.body.appendChild(f),f.click(),setTimeout(()=>{document.body.removeChild(f),URL.revokeObjectURL(x)},200),showToast("success","CSV Diunduh",`Ringkasan, kuartal, bulan, kategori, dan ${t.length} sesi berhasil diekspor.`)}function printBudgetPdf(){const t=sortByChronological(getFilteredItems());if(!t.length){showToast("info","Data Kosong","Tidak ada sesi untuk dicetak.");return}const e=computeBudgetModel(t),{A:a,Y:n,P:s,plafon:r}=e,l=SELECTED_YEAR==="all"?"Multi-Tahun":SELECTED_YEAR,c=new Date().toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"}),d=!!(r&&e.isFullYear),i=a.paxWithBudget>0?a.planCost/a.paxWithBudget:null,k=pctOf(a.actualCost,a.planCost),b=document.getElementById("budget-sort-select")?.value||"cost-desc",_=(p,v)=>`<td style="border:1px solid #cbd5e1; padding:4px; ${v||""}">${p}</td>`,h=(p,v)=>_(p,"text-align:right; white-space:nowrap; "+(v||"")),$=(p,v)=>`<th style="${v||""}">${p}</th>`,D=r?n.planCost>r?"Rencana melebihi plafon":s.projected>r?"Proyeksi melebihi plafon":"Di dalam plafon":"Plafon belum diisi",x=r?n.planCost>r||s.projected>r?"#b91c1c":"#047857":"#475569",f=(p,v,M,R)=>`<div class="kpi ${p}"><div class="kpi-lbl">${v}</div><div class="kpi-val">${M}</div><div style="font-size:8.5px; color:#475569; margin-top:2px;">${R}</div></div>`,g=[f("","Rencana biaya",escapeHtml(formatIdr(a.planCost,!0)),`${a.planPax.toLocaleString("id-ID")} peserta target${i!==null?`, rata-rata ${escapeHtml(formatIdr(i,!0))}/peserta`:""}`),f("kpi-4","Realisasi biaya",escapeHtml(formatIdr(a.actualCost,!0)),`${a.actualPax.toLocaleString("id-ID")} peserta actual${k!==null?`, ${k}% terserap`:""}`),f("kpi-5","Plafon "+l,r?escapeHtml(formatIdr(r,!0)):"Belum diisi",r?`Sisa terhadap rencana ${escapeHtml(formatIdr(r-n.planCost,!0))}`:"Isi plafon di halaman"),f("kpi-2","Proyeksi akhir tahun",escapeHtml(formatIdr(s.projected,!0)),r?`Sisa plafon ${escapeHtml(formatIdr(r-s.projected,!0))}`:"Realisasi + rencana sisa"),f("kpi-3","Status plafon",`<span style="color:${x}; font-size:12px;">${D}</span>`,`${s.overdueN} sesi lewat tanpa actual, ${s.unbudgetedN} tanpa budget`)].join(""),o=e.quarterStats.map((p,v)=>`<tr>${_("Q"+(v+1),"font-weight:700;")}${h(p.sessions)}${h(p.planPax.toLocaleString("id-ID"))}${h(escapeHtml(formatIdr(p.planCost)))}${h(p.actualPax.toLocaleString("id-ID"))}${h(escapeHtml(formatIdr(p.actualCost)))}${h(pctOf(p.actualCost,p.planCost)!==null?pctOf(p.actualCost,p.planCost)+"%":"-")}${h(escapeHtml(formatIdr(p.projected)))}</tr>`).join(""),y=e.monthStats.map((p,v)=>{if(!p.sessions)return"";const M=d?r-e.monthCum[v]:null;return`<tr>${_(MONTH_NAMES[v],"font-weight:700;")}${h(p.sessions)}${h(p.planPax.toLocaleString("id-ID"))}${h(escapeHtml(formatIdr(p.planCost)))}${h(p.actualPax.toLocaleString("id-ID"))}${h(p.withActual?escapeHtml(formatIdr(p.actualCost)):"-")}${h(escapeHtml(formatIdr(p.projected)))}${h(escapeHtml(formatIdr(e.monthCum[v])))}${d?h((M<0?"Lebih ":"")+escapeHtml(formatIdr(Math.abs(M))),M<0?"color:#b91c1c; font-weight:700;":""):""}</tr>`}).join("")+(e.undated.length?`<tr style="background:#fffbeb;">${_("Belum terjadwal","font-weight:700;")}${h(e.undatedStats.sessions)}${h(e.undatedStats.planPax.toLocaleString("id-ID"))}${h(escapeHtml(formatIdr(e.undatedStats.planCost)))}${h(e.undatedStats.actualPax.toLocaleString("id-ID"))}${h(e.undatedStats.withActual?escapeHtml(formatIdr(e.undatedStats.actualCost)):"-")}${h(escapeHtml(formatIdr(e.undatedStats.projected)))}${h(escapeHtml(formatIdr(e.totalCum)))}${d?h(escapeHtml(formatIdr(r-e.totalCum))):""}</tr>`:""),m=e.catRows.map(({c:p,s:v})=>`<tr>${_(escapeHtml(p.key),"font-weight:700;")}${h(v.sessions)}${h(v.planPax.toLocaleString("id-ID"))}${h(escapeHtml(formatIdr(v.planCost)))}${h(v.actualPax.toLocaleString("id-ID"))}${h(v.withActual?escapeHtml(formatIdr(v.actualCost)):"-")}</tr>`).join(""),S=sortBudgetList(t,b).map((p,v)=>{const M=getCostMonthIdx(p),R=p._planCost!=null&&p._actualCost!=null?p._planCost-p._actualCost:null;return`<tr style="background:${v%2?"#f8fafc":"#ffffff"};">${_(v+1,"text-align:center;")}${_(escapeHtml(p.id_jadwal),"font-weight:700; color:#0f3b7a; white-space:nowrap;")}${_(escapeHtml(p.agenda),"font-weight:700;")}${_(M!==null?MONTH_SHORT[M]:"TBA","text-align:center;")}${h(p._budget!=null?escapeHtml(formatIdr(p._budget)):"-")}${h(p.kuota||0)}${h(p._planCost!=null?escapeHtml(formatIdr(p._planCost)):"-","font-weight:700;")}${h(p.registered||0)}${h(p._actualBudget!=null?escapeHtml(formatIdr(p._actualBudget)):"-")}${h(p._actualCost!=null?escapeHtml(formatIdr(p._actualCost)):"-","font-weight:700; color:#047857;")}${h(R===null?"-":(R>=0?"Sisa ":"Lebih ")+escapeHtml(formatIdr(Math.abs(R))),R!==null&&R<0?"color:#b91c1c;":"")}</tr>`}).join(""),u=`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>Budget dan Realisasi ATMP ${l} - Pani Gold Project</title>
  <style>
    @page { size: A4 landscape; margin: 10mm 12mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; margin: 0; padding: 16px; font-size: 10px; }
    .no-print { display: flex; justify-content: space-between; align-items: center; background: #0f172a; color: #fff; padding: 10px 16px; border-radius: 8px; margin-bottom: 14px; }
    .no-print button { border: none; border-radius: 6px; padding: 7px 14px; font-weight: 700; cursor: pointer; font-size: 11px; }
    .btn-pdf { background: #dc2626; color: #fff; }
    .btn-close { background: #334155; color: #fff; margin-left: 6px; }
    .hdr { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #0f3b7a; padding-bottom: 8px; margin-bottom: 10px; }
    .kpis { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 12px; }
    .kpi { border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 10px; background: #f8fafc; border-top: 3px solid #0037b0; }
    .kpi.kpi-2 { background: #fdf6e3; border-top-color: #9D7828; }
    .kpi.kpi-3 { background: #f0fdfa; border-top-color: #0f766e; }
    .kpi.kpi-4 { background: #ecfdf5; border-top-color: #047857; }
    .kpi.kpi-5 { background: #fffbeb; border-top-color: #b45309; }
    .kpi-lbl { font-size: 8.5px; color: #475569; font-weight: 700; }
    .kpi-val { font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 2px; }
    .sec { font-weight: 800; font-size: 11px; margin: 6px 0 5px; color: #0f3b7a; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
    th { background: #0f3b7a; border: 1px solid #1e40af; border-bottom: 2px solid #9D7828; padding: 5px 4px; font-size: 9px; font-weight: 700; color: #ffffff; }
    .note { font-size: 8.5px; color: #475569; margin: -8px 0 12px; }
    .sign-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 18px; page-break-inside: avoid; }
    .sign-box { border: 1px solid #cbd5e1; border-top: 2.5px solid #0f3b7a; background: #f8fafc; border-radius: 6px; padding: 8px; text-align: center; }
    .sign-space { height: 44px; }
    .sign-line { border-top: 1px dashed #64748b; padding-top: 4px; font-weight: 700; }
    @media print { .no-print { display: none !important; } body { padding: 0; background: #fff !important; } .page-break { page-break-before: always; } }
  </style>
</head>
<body>
  <div class="no-print">
    <div><strong>Pratinjau Cetak PDF</strong> &mdash; Budget dan Realisasi ATMP ${l} (A4 Landscape)</div>
    <div>
      <button class="btn-pdf" onclick="window.print()">Simpan PDF / Cetak</button>
      <button class="btn-close" onclick="window.close()">Tutup</button>
    </div>
  </div>

  <div class="hdr">
    <div>
      <div style="font-size:9px; font-weight:800; color:#9D7828;">PT MERDEKA COPPER GOLD TBK &bull; PANI GOLD PROJECT</div>
      <div style="font-size:16px; font-weight:900; color:#0f3b7a; margin-top:2px;">BUDGET DAN REALISASI ANNUAL TRAINING MASTER PLAN ${l}</div>
      <div style="font-size:10px; color:#334155;">Learning &amp; Development Department &bull; Total biaya = budget per peserta &times; jumlah peserta</div>
    </div>
    <div style="text-align:right; font-size:9px; color:#475569;">
      <div>Dicetak: <strong>${c}</strong></div>
      <div>Sesi dalam laporan: <strong style="color:#0f3b7a;">${t.length}</strong> dari ${e.yearItems.length}</div>
    </div>
  </div>

  <div class="kpis">${g}</div>
  <div class="note">Plafon, rencana setahun, dan proyeksi dihitung dari seluruh ${e.yearItems.length} sesi tahun ${l}. Proyeksi = realisasi sesi yang sudah punya actual + rencana sesi lainnya. Kartu rencana dan realisasi mengikuti ${t.length} sesi dalam laporan.</div>

  <div class="sec">I. RINGKASAN PER KUARTAL</div>
  <table>
    <thead><tr>${$("Kuartal")}${$("Sesi")}${$("Target peserta")}${$("Rencana biaya")}${$("Peserta actual")}${$("Realisasi biaya")}${$("Terserap")}${$("Proyeksi")}</tr></thead>
    <tbody>${o}</tbody>
  </table>

  <div class="sec">II. RINGKASAN PER BULAN</div>
  <table>
    <thead><tr>${$("Bulan")}${$("Sesi")}${$("Target peserta")}${$("Rencana biaya")}${$("Peserta actual")}${$("Realisasi biaya")}${$("Proyeksi")}${$("Kumulatif proyeksi")}${d?$("Sisa plafon"):""}</tr></thead>
    <tbody>${y}</tbody>
  </table>

  <div class="sec">III. BIAYA PER KATEGORI</div>
  <table>
    <thead><tr>${$("Kategori")}${$("Sesi")}${$("Target peserta")}${$("Rencana biaya")}${$("Peserta actual")}${$("Realisasi biaya")}</tr></thead>
    <tbody>${m}</tbody>
  </table>

  <div class="page-break"></div>
  <div class="sec">IV. BUDGET PER TRAINING PER PESERTA</div>
  <table>
    <thead><tr>${$("No")}${$("ID Jadwal")}${$("Training","text-align:left;")}${$("Bulan")}${$("Budget plan / peserta")}${$("Target peserta")}${$("Total biaya plan")}${$("Peserta actual")}${$("Budget actual / peserta")}${$("Total biaya actual")}${$("Sisa / lebih")}</tr></thead>
    <tbody>${S}</tbody>
    <tfoot><tr style="background:#f1f5f9; font-weight:800;">${_("","")}${_("","")}${_("Total "+t.length+" sesi","")}${_("","")}${h(i!==null?"rata-rata "+escapeHtml(formatIdr(i,!0)):"-")}${h(a.planPax.toLocaleString("id-ID"))}${h(escapeHtml(formatIdr(a.planCost)))}${h(a.actualPax.toLocaleString("id-ID"))}${h("")}${h(escapeHtml(formatIdr(a.actualCost)))}${h((a.planCost-a.actualCost<0?"Lebih ":"Sisa ")+escapeHtml(formatIdr(Math.abs(a.planCost-a.actualCost),!0)))}</tr></tfoot>
  </table>

  <div class="sign-grid">
    <div class="sign-box"><div style="font-size:9px; color:#475569;">Disusun Oleh,</div><div class="sign-space"></div><div class="sign-line">Learning &amp; Development Officer</div><div style="font-size:8.5px; color:#64748b;">HR Department</div></div>
    <div class="sign-box"><div style="font-size:9px; color:#475569;">Diperiksa Oleh,</div><div class="sign-space"></div><div class="sign-line">L&amp;D Superintendent / HR Manager</div><div style="font-size:8.5px; color:#64748b;">Pani Gold Project</div></div>
    <div class="sign-box"><div style="font-size:9px; color:#475569;">Disetujui Oleh,</div><div class="sign-space"></div><div class="sign-line">Kepala Teknik Tambang / Site Manager</div><div style="font-size:8.5px; color:#64748b;">PT Merdeka Copper Gold Tbk</div></div>
  </div>
</body>
</html>`;openPrintWindow(u)}function openDetailModal(t){const e=ALL_RAW_SCHEDULES.find(x=>x._uid===t||x.id_jadwal===t);if(!e)return;CURRENT_MODAL_ITEM=e;const a=(x,f)=>{const g=document.getElementById(x);g&&(g.textContent=f)};a("modal-id-badge",e.id_jadwal),a("modal-category-badge",e._category);const n=document.getElementById("modal-status-badge");n&&(n.className=`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${e._status.badgeCls}`,n.textContent=e._status.label);const s=document.getElementById("modal-tracking-badges");s&&(s.innerHTML=renderTrackingBadgesHtml(e._tracking,{compact:!1})),a("modal-title",e.agenda),a("modal-date",`${e._dateRangeLabel}${e._hasYearMismatch?` (Tab YEAR ${e._yearOverride})`:""}`);const r=document.getElementById("modal-plan-shift-info");if(r){const x=e._tracking||{};x.isShifted?(r.textContent=`${x.shiftCode} (${x.shiftLabel}): ${x.shiftNote||""}${x.planDateLabel?" • Plan Awal: "+x.planDateLabel:""}`,r.classList.remove("hidden")):x.planDateLabel?(r.textContent=`Sesuai Plan Awal: ${x.planDateLabel}`,r.classList.remove("hidden")):(r.textContent="",r.classList.add("hidden"))}a("modal-duration",`${e.start_hour?e.start_hour+" WITA • ":""}${e._durationLabel}`),a("modal-batch",e.batch||"Reguler"),a("modal-room",e.room),a("modal-pic",e.pic);const l=document.getElementById("modal-desc-wrap");l&&(e.deskripsi?(l.textContent=e.deskripsi,l.classList.remove("hidden")):l.classList.add("hidden"));const c=DATA_SOURCE==="atmp"||e.is_atmp,d=e.kuota>0?Math.round(e.registered/e.kuota*100):0,i=Math.min(100,d);a("modal-quota-heading",c?"Target Plan & Realisasi Peserta":"Kapasitas & Realisasi Peserta"),a("modal-quota-pct-badge",c?`${d}% tercapai`:`${i}% terisi`),a("modal-kpi-quota-lbl",c?"Plan Peserta":"Kuota Maks"),a("modal-kpi-reg-lbl",c?"Actual Peserta":"Terdaftar"),a("modal-kpi-rem-lbl",c?"Selisih":"Sisa Kursi"),a("modal-kpi-quota",e.kuota||"-"),a("modal-kpi-reg",e.registered);const k=e.registered-e.kuota;a("modal-kpi-rem",e.kuota>0?c?k>0?`+${k}`:`${k}`:e.sisa_kuota:"-");const b=document.getElementById("modal-quota-bar");b&&(b.style.width=`${i}%`);const _=document.getElementById("modal-budget-strip"),h=e._budget!==null&&e._budget!==void 0||e._actualBudget!==null&&e._actualBudget!==void 0;if(_&&_.classList.toggle("hidden",!c&&!h),c||h){const x=e._planCost,f=e._actualCost,g=x>0&&f!==null&&f!==void 0?Math.round(f/x*100):null;if(a("modal-budget-pct-badge",g!==null?`${g}% terserap`:h?"Terisi sebagian":"Belum diisi"),a("modal-budget-plan",x!=null?formatIdr(x):"-"),a("modal-budget-actual",f!=null?formatIdr(f):"-"),x!=null&&f!==null&&f!==void 0){const o=x-f;a("modal-budget-diff",`${o>=0?"+":"-"}${formatIdr(Math.abs(o))}`)}else a("modal-budget-diff","-");a("modal-budget-formula-plan",e._budget!=null?`${formatIdr(e._budget)} × ${e.kuota||0} peserta = ${x!=null?formatIdr(x):"-"}`:"-"),a("modal-budget-formula-actual",e._actualBudget!=null?ACTUAL_BUDGET_PER_PAX?`${formatIdr(e._actualBudget)} × ${e.registered||0} peserta = ${formatIdr(f)}`:`${formatIdr(e._actualBudget)} (total sesi)`:"-")}a("modal-part-count",e.peserta.length||e.registered);const $=document.getElementById("modal-part-search");$&&($.value=""),renderModalParticipants("");const D=document.getElementById("detail-modal");D&&D.classList.remove("hidden")}function closeDetailModal(){const t=document.getElementById("detail-modal");t&&t.classList.add("hidden")}function renderModalParticipants(t){const e=document.getElementById("modal-part-tbody");if(!e||!CURRENT_MODAL_ITEM)return;const a=Array.isArray(CURRENT_MODAL_ITEM.peserta)?CURRENT_MODAL_ITEM.peserta:[],n=String(t||"").trim().toLowerCase(),s=n?a.filter(r=>[r.nama_karyawan,r.id_karyawan,r.jabatan,r.departement,r.perusahaan,r.pic_pendaftaran].join(" ").toLowerCase().includes(n)):a;if(!s.length){e.innerHTML=`<tr><td colspan="5" class="py-6 px-3 text-center text-on-surface-variant italic">${a.length?"Tidak ada peserta yang cocok dengan pencarian.":"Belum ada rincian nama peserta pada sesi ini."}</td></tr>`;return}e.innerHTML=s.map((r,l)=>`
        <tr class="hover:bg-surface-container-low/50">
          <td class="py-2 px-3 text-center text-on-surface-variant">${l+1}</td>
          <td class="py-2 px-3">
            <div class="font-semibold text-on-surface">${maskStringWithBlur(r.nama_karyawan||"-","name")}</div>
            <div class="text-[10px] text-on-surface-variant">${maskStringWithBlur(r.id_karyawan||"-","id")}</div>
          </td>
          <td class="py-2 px-3">
            <div class="text-on-surface">${escapeHtml(r.jabatan||"-")}</div>
            <div class="text-[10px] text-on-surface-variant">${maskStringWithBlur(r.departement||"-","general")}</div>
          </td>
          <td class="py-2 px-3">
            <div class="text-on-surface">${maskStringWithBlur(r.perusahaan||"-","general")}</div>
            ${r.pic_pendaftaran?`<div class="text-[10px] text-primary">PIC: ${escapeHtml(r.pic_pendaftaran)}</div>`:""}
          </td>
          <td class="py-2 px-3 text-center">
            <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">${escapeHtml(r.validasi||"OK")}</span>
          </td>
        </tr>
      `).join("")}function exportMasterPlanCsv(){const t=sortByChronological(getFilteredItems());if(!t.length){showToast("info","Data Kosong","Tidak ada data jadwal untuk diekspor.");return}const e=DATA_SOURCE==="atmp",a=["No","Sumber_Sheet","ID_Jadwal","Kategori","Nama_Pelatihan","Batch","Kolom_Tahun","Kuartal","Bulan","Tanggal_Mulai","Tanggal_Selesai","Jam_Mulai","Durasi_Hari","Durasi_Jam","Ruangan","Instruktur_PIC",e?"Plan_Peserta":"Kuota",e?"Actual_Peserta":"Terdaftar",e?"Selisih_Peserta":"Sisa_Kuota","Budget_Plan_per_Peserta","Total_Biaya_Plan","Actual_Budget_per_Peserta","Total_Biaya_Actual","Sisa_Selisih_Biaya","Kode_Realisasi","Keterangan_Realisasi","Status_Jadwal_Sheet","Tanggal_Rencana_Awal","Kode_Pergeseran","Detail_Pergeseran","Status","Deskripsi"],n=i=>`"${String(i??"").replace(/"/g,'""')}"`,s=t.map((i,k)=>{const b=i._tracking||{};return[k+1,i.source_sheet||(e?"ATMP":"Jadwal Pelatihan"),i.id_jadwal,i._category,i.agenda,i.batch||"Reguler",i._yearOverride||i._year||"",i._quarter||"TBA",i._month!==null?MONTH_NAMES[i._month]:"TBA",i.start||"TBA",i.end||i.start||"TBA",i.start_hour?`${i.start_hour} WITA`:"-",i._days,i._hours,i.room,i.pic,i.kuota,i.registered,e?i.registered-i.kuota:i.sisa_kuota,i._budget!==null&&i._budget!==void 0?i._budget:"",i._planCost!==null&&i._planCost!==void 0?i._planCost:"",i._actualBudget!==null&&i._actualBudget!==void 0?i._actualBudget:"",i._actualCost!==null&&i._actualCost!==void 0?i._actualCost:"",i._planCost!=null&&i._actualCost!=null?i._planCost-i._actualCost:"",b.code||"",b.label||"",b.sheetTag||"",b.planDateLabel||"",b.shiftCode||"",b.shiftNote||"",i._status.label,i.deskripsi].map(n).join(",")}),r="\uFEFF"+[a.map(n).join(","),...s].join(`\r
`),l=new Blob([r],{type:"text/csv;charset=utf-8;"}),c=URL.createObjectURL(l),d=document.createElement("a");d.href=c,d.download=`Annual_Training_Master_Plan_${e?"ATMP":"JADWAL"}_${SELECTED_YEAR}_PGP.csv`,document.body.appendChild(d),d.click(),setTimeout(()=>{document.body.removeChild(d),URL.revokeObjectURL(c)},200),showToast("success","CSV Diunduh",`${t.length} baris Annual Training Master Plan berhasil diekspor.`)}function openPrintWindow(t){const e=window.open("","_blank","width=1200,height=850,menubar=no,toolbar=no,scrollbars=yes,resizable=yes");e?(e.document.open(),e.document.write(t),e.document.close(),e.focus(),setTimeout(()=>{try{e.print()}catch{}},500)):showToast("warning","Pop-up Diblokir","Izinkan pop-up browser untuk membuka pratinjau cetak PDF.")}function printMasterPlanPdf(){const t=sortByChronological(getFilteredItems());if(!t.length){showToast("info","Data Kosong","Tidak ada data untuk dicetak.");return}const e=t.filter(u=>!!u._range),a=SELECTED_YEAR==="all"?"Multi-Tahun":SELECTED_YEAR,n=new Date().toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"});function s(u){const p=((u&&u.key||"")+" "+(u&&u.label||"")).toLowerCase();return/past|done|selesai|finished/.test(p)?{bg:"#dcfce7",text:"#065f46",border:"#10b981",pillBg:"#bbf7d0"}:/running|ongoing|berlangsung|active/.test(p)?{bg:"#e0f2fe",text:"#0369a1",border:"#0ea5e9",pillBg:"#bae6fd"}:/full|penuh|tutup|closed/.test(p)?{bg:"#fef3c7",text:"#92400e",border:"#f59e0b",pillBg:"#fde68a"}:{bg:"#eff6ff",text:"#1e3a8a",border:"#2563eb",pillBg:"#dbeafe"}}function r(u,p){if(!u||!u.pdf)return"";const v=p?"0.5px 3px":"1.5px 5px",M=p?"7px":"8px";let R=`<span style="display:inline-block; padding:${v}; border-radius:3px; font-size:${M}; font-weight:800; background:${u.pdf.pillBg}; color:${u.pdf.text}; border:1px solid ${u.pdf.border};">${escapeHtml(u.code)}</span>`;if(u.isShifted&&u.shiftPdf){const N=p?u.shiftCode:`${u.shiftCode}${u.shiftDelta?" "+u.shiftDelta:""}`;R+=` <span style="display:inline-block; padding:${v}; border-radius:3px; font-size:${M}; font-weight:800; background:${u.shiftPdf.pillBg}; color:${u.shiftPdf.text}; border:1px solid ${u.shiftPdf.border};">${escapeHtml(N)}</span>`}return R}const l=DATA_SOURCE==="atmp",c=t.some(u=>u._budget!==null&&u._budget!==void 0||u._actualBudget!==null&&u._actualBudget!==void 0),d=l||c,i=new Map;e.forEach(u=>{const p=u.agenda.toLowerCase().trim();i.has(p)||i.set(p,{title:u.agenda,category:u._category,items:[]}),i.get(p).items.push(u)});const k=Array.from(i.values()),b=k.map((u,p)=>{const v=Array.from({length:12},(N,A)=>{const P=u.items.filter(L=>doesItemMatchMonth(L,SELECTED_YEAR,A));return P.length?`<td style="border:1px solid #cbd5e1; padding:2.5px; background:#ffffff; font-size:8px; line-height:1.25;">${P.map(L=>{const B=L._tracking||{},C=B.isShifted&&B.shiftPdf?B.shiftPdf:B.pdf||s(L._status),H=SELECTED_YEAR==="all"?L._range:getDisplayRangeForYear(L,SELECTED_YEAR)||L._range;return`<div style="background:${C.bg}; border-left:3px solid ${C.border}; border-radius:3px; padding:1.5px 3.5px; margin-bottom:2px; color:${C.text};"><div><strong>${escapeHtml(formatCellPillDate(H,A))}</strong>${L.batch?' <span style="opacity:0.85;">('+escapeHtml(L.batch)+")</span>":""}</div><div style="margin-top:1px;">${r(B,!0)}</div></div>`}).join("")}</td>`:'<td style="border:1px solid #cbd5e1; padding:4px; background:#ffffff;"></td>'}).join(""),M=u.items.reduce((N,A)=>N+A._hours,0);return`
          <tr style="background:${p%2===1?"#f8fafc":"#ffffff"};">
            <td style="border:1px solid #cbd5e1; padding:4px 6px; text-align:center;">${p+1}</td>
            <td style="border:1px solid #cbd5e1; padding:4px 6px; font-weight:700; color:#0f172a;">${escapeHtml(u.title)}<div style="font-size:8px; font-weight:600; color:#0037b0;">${escapeHtml(u.category)}</div></td>
            ${v}
            <td style="border:1px solid #cbd5e1; padding:4px; text-align:center; font-weight:800; color:#0f3b7a;">${u.items.length}</td>
            <td style="border:1px solid #cbd5e1; padding:4px; text-align:center; font-weight:600; color:#334155;">${M}j</td>
          </tr>
        `}).join(""),_=t.map((u,p)=>{const v=s(u._status),M=u._tracking||{},R=M.isShifted&&M.shiftPdf?M.shiftPdf.border:v.border,N=p%2===1?"#f8fafc":"#ffffff",A=M.isShifted&&(M.shiftNote||M.planDateLabel)?`<div style="font-size:7.8px; color:#92400e; font-weight:700; margin-top:2px;">${escapeHtml(M.shiftNote||"Plan: "+M.planDateLabel)}</div>`:"",P=d?`<td style="border:1px solid #cbd5e1; padding:4px; text-align:right; font-size:8.5px; white-space:nowrap;">${u._budget!==null||u._actualBudget!==null?`<strong>Plan ${escapeHtml(formatIdr(u._planCost,!0))}</strong><div style="color:#64748b;">@${escapeHtml(formatIdr(u._budget,!0))} &times; ${u.kuota||0}</div>${u._actualCost!=null?`<div style="color:#0f3b7a;">Act ${escapeHtml(formatIdr(u._actualCost,!0))}</div>`:""}`:"-"}</td>`:"";return`
        <tr style="background:${N};">
          <td style="border:1px solid #cbd5e1; padding:4px; text-align:center;">${p+1}</td>
          <td style="border:1px solid #cbd5e1; padding:4px; font-weight:700; color:#0f3b7a;">${escapeHtml(u.id_jadwal)}</td>
          <td style="border:1px solid #cbd5e1; padding:4px; font-weight:700; border-left:3px solid ${R};">${escapeHtml(u.agenda)}</td>
          <td style="border:1px solid #cbd5e1; padding:4px;">${escapeHtml(u.batch||"Reguler")}</td>
          <td style="border:1px solid #cbd5e1; padding:4px;">${escapeHtml(u._dateRangeLabel)}${u._hasYearMismatch?`<div style="font-size:7.5px; color:#92400e; font-weight:700;">Kolom YEAR: ${u._yearOverride}</div>`:""}</td>
          <td style="border:1px solid #cbd5e1; padding:4px;">${escapeHtml(u._durationLabel)}</td>
          <td style="border:1px solid #cbd5e1; padding:4px;">${escapeHtml(u.room)}</td>
          <td style="border:1px solid #cbd5e1; padding:4px;">${escapeHtml(u.pic)}</td>
          <td style="border:1px solid #cbd5e1; padding:4px; text-align:center; font-weight:600;">${u.registered}/${u.kuota||"-"}</td>
          ${P}
          <td style="border:1px solid #cbd5e1; padding:4px; text-align:center;"><div>${r(M,!1)}</div>${A}</td>
          <td style="border:1px solid #cbd5e1; padding:4px; text-align:center;"><span style="display:inline-block; padding:1.5px 6px; border-radius:999px; font-size:8.5px; font-weight:700; background:${v.pillBg}; color:${v.text}; border:1px solid ${v.border};">${escapeHtml(u._status.label)}</span></td>
        </tr>
      `}).join(""),h=t.filter(u=>u._tracking&&u._tracking.code==="REAL").length,$=t.filter(u=>u._tracking&&u._tracking.code==="PLAN").length,D=t.filter(u=>u._tracking&&u._tracking.code==="TMBH").length,x=t.filter(u=>u._tracking&&u._tracking.isShifted).length,f=t.reduce((u,p)=>u+p._hours,0),g=t.reduce((u,p)=>u+p.registered,0),o=t.reduce((u,p)=>u+(p.kuota||0),0),y=t.reduce((u,p)=>u+(p._planCost||0),0),m=t.reduce((u,p)=>u+(p._actualCost||0),0),S=`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>Annual Training Master Plan ${a} - Pani Gold Project</title>
  <style>
    @page { size: A4 landscape; margin: 10mm 12mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; margin: 0; padding: 16px; font-size: 10px; }
    .no-print { display: flex; justify-content: space-between; align-items: center; background: #0f172a; color: #fff; padding: 10px 16px; border-radius: 8px; margin-bottom: 14px; }
    .no-print button { border: none; border-radius: 6px; padding: 7px 14px; font-weight: 700; cursor: pointer; font-size: 11px; }
    .btn-pdf { background: #dc2626; color: #fff; }
    .btn-close { background: #334155; color: #fff; margin-left: 6px; }
    .top-stripe { display: flex; height: 4px; width: 100%; border-radius: 2px; overflow: hidden; margin-bottom: 8px; }
    .hdr { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #0f3b7a; padding-bottom: 8px; margin-bottom: 10px; }
    .kpis { display: grid; grid-template-columns: repeat(${d?5:4}, 1fr); gap: 8px; margin-bottom: 10px; }
    .kpi { border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 10px; background: #f8fafc; border-top: 3px solid #0037b0; }
    .kpi.kpi-2 { background: #fdf6e3; border-top-color: #9D7828; }
    .kpi.kpi-3 { background: #f0fdfa; border-top-color: #0f766e; }
    .kpi.kpi-4 { background: #ecfdf5; border-top-color: #047857; }
    .kpi.kpi-5 { background: #fffbeb; border-top-color: #b45309; }
    .kpi-lbl { font-size: 8.5px; color: #475569; text-transform: uppercase; font-weight: 700; }
    .kpi-val { font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 2px; }
    .status-legend { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 8.5px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; padding: 4px 8px; }
    .st-pill { display: inline-flex; align-items: center; gap: 4px; padding: 1.5px 7px; border-radius: 999px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
    th { background: #0f3b7a; border: 1px solid #1e40af; border-bottom: 2px solid #9D7828; padding: 5px 4px; font-size: 9px; font-weight: 700; color: #ffffff; }
    .sign-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 18px; page-break-inside: avoid; }
    .sign-box { border: 1px solid #cbd5e1; border-top: 2.5px solid #0f3b7a; background: #f8fafc; border-radius: 6px; padding: 8px; text-align: center; }
    .sign-space { height: 44px; }
    .sign-line { border-top: 1px dashed #64748b; padding-top: 4px; font-weight: 700; }
    @media print { .no-print { display: none !important; } body { padding: 0; background: #fff !important; } .page-break { page-break-before: always; } }
  </style>
</head>
<body>
  <div class="no-print">
    <div><strong>Pratinjau Cetak PDF Berwarna</strong> &mdash; Annual Training Master Plan ${a} (A4 Landscape)</div>
    <div>
      <button class="btn-pdf" onclick="window.print()">Simpan PDF / Cetak</button>
      <button class="btn-close" onclick="window.close()">Tutup</button>
    </div>
  </div>

  <div class="top-stripe">
    <div style="width:52%; background:#0f3b7a;"></div>
    <div style="width:28%; background:#9D7828;"></div>
    <div style="width:20%; background:#047857;"></div>
  </div>

  <div class="hdr">
    <div>
      <div style="font-size:9px; font-weight:800; color:#9D7828;">PT MERDEKA COPPER GOLD TBK &bull; PANI GOLD PROJECT</div>
      <div style="font-size:16px; font-weight:900; color:#0f3b7a; margin-top:2px;">ANNUAL TRAINING MASTER PLAN ${a}</div>
      <div style="font-size:10px; color:#334155;">Learning &amp; Development Department &bull; Sumber Data: ${l?"Sheet ATMP (Annual Training Master Plan)":"Sheet Jadwal Pelatihan"}</div>
    </div>
    <div style="text-align:right; font-size:9px; color:#475569;">
      <div>Dicetak: <strong>${n}</strong></div>
      <div>Total Program Unik: <strong style="color:#0f3b7a;">${k.length}</strong> | Total Sesi: <strong style="color:#0f3b7a;">${t.length}</strong></div>
    </div>
  </div>

  <div class="kpis">
    <div class="kpi"><div class="kpi-lbl">Total Sesi (${h} REAL &bull; ${$} PLAN${D?" &bull; "+D+" TMBH":""})</div><div class="kpi-val" style="color:#0037b0;">${t.length} Sesi${x?` <span style="font-size:10px; color:#b45309;">(${x} Geser)</span>`:""}</div></div>
    <div class="kpi kpi-2"><div class="kpi-lbl">Program Pelatihan Unik</div><div class="kpi-val" style="color:#725210;">${k.length} Program</div></div>
    <div class="kpi kpi-3"><div class="kpi-lbl">Akumulasi Jam Pelatihan</div><div class="kpi-val" style="color:#0f766e;">${f.toLocaleString("id-ID")} Jam</div></div>
    <div class="kpi kpi-4"><div class="kpi-lbl">${l?"Actual / Plan Peserta":"Total Peserta Terdaftar"}</div><div class="kpi-val" style="color:#047857;">${l?`${g.toLocaleString("id-ID")} / ${o.toLocaleString("id-ID")}`:`${g.toLocaleString("id-ID")} Orang`}</div></div>
    ${d?`<div class="kpi kpi-5"><div class="kpi-lbl">Biaya Actual / Plan</div><div class="kpi-val" style="color:#92400e; font-size:12px;">${c?`${escapeHtml(formatIdr(m,!0))} / ${escapeHtml(formatIdr(y,!0))}`:"Belum Diisi"}</div></div>`:""}
  </div>

  <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px; margin-bottom:5px;">
    <div style="font-weight:800; font-size:11px; color:#0f3b7a;">I. MATRIKS RENCANA PELATIHAN TAHUNAN (JANUARI &ndash; DESEMBER)</div>
    <div class="status-legend">
      <strong style="color:#475569;">Kode Realisasi &amp; Pergeseran:</strong>
      <span class="st-pill" style="background:#bbf7d0; color:#065f46; border:1px solid #10b981;">REAL = Terealisasi</span>
      <span class="st-pill" style="background:#dbeafe; color:#1e3a8a; border:1px solid #2563eb;">PLAN = Rencana</span>
      <span class="st-pill" style="background:#99f6e4; color:#115e59; border:1px solid #0d9488;">TMBH = Tambahan</span>
      <span class="st-pill" style="background:#fde68a; color:#92400e; border:1px solid #f59e0b;">GSR-HARI = Geser Hari</span>
      <span class="st-pill" style="background:#fecdd3; color:#9f1239; border:1px solid #e11d48;">GSR-BLN = Geser Bulan</span>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th rowspan="2" style="width:24px;">No</th>
        <th rowspan="2" style="text-align:left; width:190px;">Program Pelatihan</th>
        <th colspan="3">Q1</th><th colspan="3">Q2</th><th colspan="3">Q3</th><th colspan="3">Q4</th>
        <th rowspan="2" style="width:34px;">Sesi</th>
        <th rowspan="2" style="width:38px;">Jam</th>
      </tr>
      <tr>${MONTH_SHORT.map(u=>`<th>${u}</th>`).join("")}</tr>
    </thead>
    <tbody>${b||'<tr><td colspan="16" style="padding:12px; text-align:center; border:1px solid #cbd5e1;">Tidak ada jadwal bertanggal</td></tr>'}</tbody>
  </table>

  <div class="page-break"></div>
  <div style="font-weight:800; font-size:11px; margin-bottom:5px; color:#0f3b7a;">II. RINCIAN JADWAL &amp; REALISASI PELATIHAN</div>
  <table>
    <thead>
      <tr>
        <th>No</th><th>ID Jadwal</th><th style="text-align:left;">Program Pelatihan</th><th>Batch</th>
        <th>Tanggal</th><th>Durasi</th><th>Ruangan</th><th>PIC / Trainer</th><th>${l?"Actual/Plan":"Peserta/Kuota"}</th>${d?"<th>Biaya Plan/Actual</th>":""}<th>Kode Plan</th><th>Status</th>
      </tr>
    </thead>
    <tbody>${_}</tbody>
  </table>

  <div class="sign-grid">
    <div class="sign-box">
      <div style="font-size:9px; color:#475569;">Disusun Oleh,</div>
      <div class="sign-space"></div>
      <div class="sign-line">Learning &amp; Development Officer</div>
      <div style="font-size:8.5px; color:#64748b;">HR Department</div>
    </div>
    <div class="sign-box">
      <div style="font-size:9px; color:#475569;">Diperiksa Oleh,</div>
      <div class="sign-space"></div>
      <div class="sign-line">L&amp;D Superintendent / HR Manager</div>
      <div style="font-size:8.5px; color:#64748b;">Pani Gold Project</div>
    </div>
    <div class="sign-box">
      <div style="font-size:9px; color:#475569;">Disetujui Oleh,</div>
      <div class="sign-space"></div>
      <div class="sign-line">Kepala Teknik Tambang / Site Manager</div>
      <div style="font-size:8.5px; color:#64748b;">PT Merdeka Copper Gold Tbk</div>
    </div>
  </div>
</body>
</html>`;openPrintWindow(S)}function printSingleSessionPdf(){const t=CURRENT_MODAL_ITEM;if(!t)return;const e=new Date().toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"}),a=((t._status&&t._status.key||"")+" "+(t._status&&t._status.label||"")).toLowerCase(),n=/past|done|selesai|finished/.test(a)?"background:#dcfce7; color:#065f46; border:1px solid #10b981;":/running|ongoing|berlangsung|active/.test(a)?"background:#e0f2fe; color:#0369a1; border:1px solid #0ea5e9;":/full|penuh|tutup|closed/.test(a)?"background:#fef3c7; color:#92400e; border:1px solid #f59e0b;":"background:#dbeafe; color:#1e3a8a; border:1px solid #2563eb;",s=Array.isArray(t.peserta)?t.peserta:[],r=s.length?s.map((c,d)=>`
            <tr style="background:${d%2===1?"#f8fafc":"#ffffff"};">
              <td style="text-align:center;">${d+1}</td>
              <td><strong>${escapeHtml(c.nama_karyawan||"-")}</strong><div style="font-size:9px; color:#64748b;">${escapeHtml(c.id_karyawan||"-")}</div></td>
              <td>${escapeHtml(c.jabatan||"-")} / ${escapeHtml(c.departement||"-")}</td>
              <td>${escapeHtml(c.perusahaan||"-")}${c.pic_pendaftaran?" (PIC: "+escapeHtml(c.pic_pendaftaran)+")":""}</td>
              <td style="text-align:center;"><span style="display:inline-block; padding:1.5px 7px; border-radius:999px; font-weight:700; background:#dcfce7; color:#15803d;">${escapeHtml(c.validasi||"OK")}</span></td>
            </tr>
          `).join(""):'<tr><td colspan="5" style="text-align:center; color:#64748b; font-style:italic; padding:12px;">Belum ada daftar peserta terdaftar pada sesi ini.</td></tr>',l=`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>Lembar Pelatihan - ${escapeHtml(t.agenda)}</title>
  <style>
    @page { size: A4 portrait; margin: 14mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; font-size: 11px; margin: 0; padding: 16px; }
    .no-print { display: flex; justify-content: space-between; align-items: center; background: #0f172a; color: #fff; padding: 10px 14px; border-radius: 8px; margin-bottom: 16px; }
    .no-print button { border: none; border-radius: 6px; padding: 7px 14px; font-weight: 700; cursor: pointer; }
    .btn-pdf { background: #dc2626; color: #fff; }
    .btn-close { background: #334155; color: #fff; margin-left: 6px; }
    .top-stripe { display: flex; height: 4px; width: 100%; border-radius: 2px; overflow: hidden; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    td, th { border: 1px solid #cbd5e1; padding: 7px 10px; text-align: left; }
    th { background: #0f3b7a; border-color: #1e40af; border-bottom: 2px solid #9D7828; font-size: 10px; color: #ffffff; }
    td.lbl { width: 24%; background: #eff6ff; font-weight: 700; color: #1e3a8a; }
    @media print { .no-print { display: none !important; } body { padding: 0; background: #fff !important; } }
  </style>
</head>
<body>
  <div class="no-print">
    <div><strong>Pratinjau Lembar Pelatihan Berwarna</strong></div>
    <div><button class="btn-pdf" onclick="window.print()">Cetak / PDF</button><button class="btn-close" onclick="window.close()">Tutup</button></div>
  </div>
  <div class="top-stripe">
    <div style="width:52%; background:#0f3b7a;"></div>
    <div style="width:28%; background:#9D7828;"></div>
    <div style="width:20%; background:#047857;"></div>
  </div>
  <div style="border-bottom:2px solid #0037b0; padding-bottom:8px; display:flex; justify-content:space-between; align-items:flex-end;">
    <div>
      <div style="font-size:9px; font-weight:800; color:#9D7828;">PANI GOLD PROJECT &bull; LEARNING &amp; DEVELOPMENT</div>
      <div style="font-size:17px; font-weight:900; color:#0037b0;">RINCIAN PROGRAM MASTER PLAN</div>
    </div>
    <div style="font-size:9.5px; color:#475569; text-align:right;">
      <div>ID: <strong style="color:#0037b0;">${escapeHtml(t.id_jadwal)}</strong></div>
      <div>Dicetak: ${e}</div>
    </div>
  </div>
  <table>
    <tr><td class="lbl">Program Pelatihan</td><td colspan="3" style="font-weight:800; font-size:13px; color:#0037b0; background:#f8fafc;">${escapeHtml(t.agenda)}</td></tr>
    <tr><td class="lbl">Kategori</td><td>${escapeHtml(t._category)}</td><td class="lbl">Batch</td><td>${escapeHtml(t.batch||"Reguler")}</td></tr>
    <tr><td class="lbl">Tanggal</td><td>${escapeHtml(t._dateRangeLabel)}${t._hasYearMismatch?` (YEAR: ${t._yearOverride})`:""}</td><td class="lbl">Jam &amp; Durasi</td><td>${escapeHtml((t.start_hour?t.start_hour+" WITA • ":"")+t._durationLabel)}</td></tr>
    <tr><td class="lbl">Ruangan</td><td>${escapeHtml(t.room)}</td><td class="lbl">Instruktur / PIC</td><td>${escapeHtml(t.pic)}</td></tr>
    <tr><td class="lbl">${DATA_SOURCE==="atmp"||t.is_atmp?"Actual / Plan Peserta":"Peserta / Kuota"}</td><td>${t.registered} / ${t.kuota||"-"}</td><td class="lbl">Status Pendaftaran</td><td><span style="display:inline-block; padding:2px 8px; border-radius:999px; font-weight:800; ${n}">${escapeHtml(t._status.label)}</span></td></tr>
    ${DATA_SOURCE==="atmp"||t.is_atmp||t._budget!==null||t._actualBudget!==null?`<tr><td class="lbl">Budget Plan / Peserta</td><td>${t._budget!==null&&t._budget!==void 0?escapeHtml(formatIdr(t._budget)):"-"}</td><td class="lbl">Actual Budget / Peserta</td><td>${t._actualBudget!==null&&t._actualBudget!==void 0?escapeHtml(formatIdr(t._actualBudget)):"-"}</td></tr><tr><td class="lbl">Total Biaya Plan</td><td>${t._planCost!=null?escapeHtml(formatIdr(t._planCost))+" ("+(t.kuota||0)+" peserta)":"-"}</td><td class="lbl">Total Biaya Actual</td><td>${t._actualCost!=null?escapeHtml(formatIdr(t._actualCost))+" ("+(t.registered||0)+" peserta)":"-"}</td></tr>`:""}
    ${(()=>{const c=t._tracking;if(!c||!c.pdf)return"";let d=`<span style="display:inline-block; padding:2px 8px; border-radius:6px; font-weight:800; background:${c.pdf.pillBg}; color:${c.pdf.text}; border:1px solid ${c.pdf.border};">${escapeHtml(c.code)} &mdash; ${escapeHtml(c.label)}</span>`;c.isShifted&&c.shiftPdf&&(d+=` <span style="display:inline-block; padding:2px 8px; border-radius:6px; font-weight:800; background:${c.shiftPdf.pillBg}; color:${c.shiftPdf.text}; border:1px solid ${c.shiftPdf.border};">${escapeHtml(c.shiftCode)} (${escapeHtml(c.shiftNote||c.shiftLabel)})</span>`);const i=c.planDateLabel?`<td class="lbl">Tanggal Plan Awal</td><td>${escapeHtml(c.planDateLabel)}</td>`:`<td class="lbl">Sumber Plan (Sheet)</td><td>${escapeHtml(c.sheetTag||"-")}</td>`;return`<tr><td class="lbl">Kode Realisasi</td><td>${d}</td>${i}</tr>`})()}
    ${t.deskripsi?`<tr><td class="lbl">Deskripsi</td><td colspan="3">${escapeHtml(t.deskripsi)}</td></tr>`:""}
  </table>
  <div style="font-weight:700; font-size:11px; margin-top:16px;">Daftar Peserta Terdaftar (${s.length} Orang)</div>
  <table>
    <thead>
      <tr><th style="width:36px; text-align:center;">No</th><th>Nama / ID</th><th>Jabatan &amp; Dept</th><th>Perusahaan &amp; PIC</th><th style="width:70px; text-align:center;">Validasi</th></tr>
    </thead>
    <tbody>${r}</tbody>
  </table>
</body>
</html>`;openPrintWindow(l)}const ATMP_SESSION_KEY="lnd_atmp_access",ATMP_SESSION_TTL_MS=480*60*1e3;let ATMP_ADMIN_INFO=null,ATMP_BOOTED=!1;function toggleAtmpGatePassword(){const t=document.getElementById("atmp-gate-password"),e=document.getElementById("atmp-gate-pass-icon");if(!t)return;const a=t.type==="password";t.type=a?"text":"password",e&&(e.textContent=a?"visibility_off":"visibility")}function showAtmpGateError(t){const e=document.getElementById("atmp-gate-error"),a=document.getElementById("atmp-gate-error-text");e&&e.classList.remove("hidden"),a&&(a.textContent=t)}function hideAtmpGateError(){const t=document.getElementById("atmp-gate-error");t&&t.classList.add("hidden")}function grantAtmpSession(t){ATMP_ADMIN_INFO=t||{};try{sessionStorage.setItem(ATMP_SESSION_KEY,JSON.stringify({verified:!0,at:Date.now(),admin:ATMP_ADMIN_INFO}))}catch{}}function checkAtmpAccessGrant(){try{if(window.name&&window.name.indexOf("lndAtmpGrant")!==-1){const t=JSON.parse(window.name);if(window.name="",t&&t.lndAtmpGrant===!0&&Date.now()-Number(t.at||0)<6e4)return grantAtmpSession(t.admin),!0}}catch{window.name=""}try{const t=sessionStorage.getItem(ATMP_SESSION_KEY);if(t){const e=JSON.parse(t);if(e&&e.verified===!0&&Date.now()-Number(e.at||0)<ATMP_SESSION_TTL_MS)return ATMP_ADMIN_INFO=e.admin||{},!0}}catch{}return!1}async function initializeMasterPlanPortal(){const t=new URLSearchParams(window.location.search),e=(t.get("source")||"").toLowerCase();(e==="jadwal"||e==="atmp")&&(DATA_SOURCE=e),updateSourceUiChrome();const a=t.get("year");a==="all"?SELECTED_YEAR="all":a&&/^\d{4}$/.test(a)&&(SELECTED_YEAR=parseInt(a,10)),await loadMasterPlanData(!1);const n=t.get("cat");if(n){const k=document.getElementById("filter-category");k&&(k.value=n,applyFiltersAndRender())}const s=t.get("q");if(s){const k=document.getElementById("filter-search");k&&(k.value=s,applyFiltersAndRender())}const r=t.get("grouping");(r==="session"||r==="program")&&setMatrixGrouping(r);const l=t.get("metric");l&&["sessions","participants","hours"].includes(l)&&setChartMetric(l);const c=t.get("gantt");(c==="year"||c==="active")&&setGanttScale(c);const d=t.get("view");d&&["matrix","gantt","quarters","table"].includes(d)&&switchMasterView(d);const i=t.get("modal");i&&openDetailModal(i),ATMP_BOOTED=!0}async function unlockMasterPlanUi(){const t=document.getElementById("atmp-auth-gate"),e=document.getElementById("atmp-protected-shell");t&&t.classList.add("hidden"),e&&(e.classList.remove("hidden"),e.classList.add("flex")),hideAtmpGateError(),(!ATMP_BOOTED||!ALL_RAW_SCHEDULES.length)&&await initializeMasterPlanPortal()}function lockMasterPlanAccess(){ATMP_ADMIN_INFO=null,ALL_RAW_SCHEDULES=[],window.name="";try{sessionStorage.removeItem(ATMP_SESSION_KEY)}catch{}typeof closeDetailModal=="function"&&closeDetailModal();const t=document.getElementById("atmp-auth-gate"),e=document.getElementById("atmp-protected-shell"),a=document.getElementById("atmp-gate-password"),n=document.getElementById("atmp-gate-pass-icon");e&&(e.classList.add("hidden"),e.classList.remove("flex")),t&&t.classList.remove("hidden"),hideAtmpGateError(),a&&(a.value="",a.type="password",setTimeout(()=>a.focus(),60)),n&&(n.textContent="visibility")}function submitAtmpGatePassword(t){t&&t.preventDefault();const e=document.getElementById("atmp-gate-password"),a=document.getElementById("atmp-gate-submit-btn"),n=document.getElementById("atmp-gate-submit-text"),s=e?e.value:"";if(!s.trim()){showAtmpGateError("Password admin wajib diisi."),e&&e.focus();return}a&&(a.disabled=!0),n&&(n.textContent="Memverifikasi..."),hideAtmpGateError(),fetch(API_URL,{method:"POST",body:JSON.stringify({action:"admin_verify_password",username:"",password:s.trim()})}).then(r=>r.json()).then(async r=>{a&&(a.disabled=!1),n&&(n.textContent="Verifikasi & Buka Master Plan"),r&&r.status==="success"?(grantAtmpSession(r.admin||{}),e&&(e.value=""),showToast("success","Akses Diterima","Selamat datang di Annual Training Master Plan."),await unlockMasterPlanUi()):(showAtmpGateError(r&&r.message||"Password admin tidak sesuai."),e&&e.select())}).catch(()=>{a&&(a.disabled=!1),n&&(n.textContent="Verifikasi & Buka Master Plan"),showAtmpGateError("Koneksi ke server gagal. Periksa koneksi internet.")})}document.addEventListener("DOMContentLoaded",async()=>{if(checkAtmpAccessGrant())await unlockMasterPlanUi();else{const t=document.getElementById("atmp-gate-password");t&&setTimeout(()=>t.focus(),60)}});
