(function(){"use strict";let k=[{name:"Gold Room 2",capacity:20,pic:"LnD",contact:"",description:"Ruang Pelatihan Kapasitas 20 Kursi"},{name:"Gold Room 3",capacity:10,pic:"LnD",contact:"",description:"Ruang Pelatihan / Diskusi Kapasitas 10 Kursi"},{name:"Gold Room 2 & 3",capacity:30,pic:"LnD",contact:"",description:"Ruang Gabungan Partisi Kapasitas 30 Kursi",is_partition:!0},{name:"GSG",capacity:100,pic:"Aden & Site Service",contact:"",description:"Gedung Serba Guna / Aula Utama Kapasitas 100 Kursi"},{name:"Torosajie - Meeting Room",capacity:15,pic:"Ms",contact:"",description:"Ruang Rapat Torosajie Kapasitas 15 Kursi"},{name:"Hulawa - Meeting Room",capacity:20,pic:"Ms",contact:"",description:"Ruang Rapat Hulawa Kapasitas 20 Kursi"}],G=[],y=new Date,L=new Date,I="lanes",Z=!1;function U(t){return t?String(t).toLowerCase().replace(/\s*&\s*/g," and ").replace(/\s*dan\s*/g," and ").replace(/[^a-z0-9]/g,""):""}function E(t,n){return!t||!n?!1:U(t)===U(n)}function K(t){if(!t)return"08:00";let n=String(t).trim().replace(".",":");n.includes("-")&&(n=n.split("-")[0].trim());const l=n.match(/^(\d{1,2}):?(\d{2})?/);if(l){const r=String(parseInt(l[1],10)).padStart(2,"0"),o=l[2]?l[2]:"00";return`${r}:${o}`}return"08:00"}function M(t){if(!t)return 0;const l=K(t).split(":"),r=parseInt(l[0],10)||0,o=parseInt(l[1],10)||0;return r*60+o}function le(t){const n=(t%1440+1440)%1440,l=Math.floor(n/60),r=n%60;return`${String(l).padStart(2,"0")}:${String(r).padStart(2,"0")}`}function W(t,n){const l=M(t||"08:00");let r=parseFloat(n);(isNaN(r)||r<=0)&&(r=2);const o=Math.round(r*60);return le(l+o)}function N(t){if(!t)return!1;const n=String(t).trim();return/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+[A-Z][a-z]{2}\s+\d{1,2}\s+\d{4}/i.test(n)||/Date\(\d+,\d+,\d+\)/i.test(n)||/Waktu Indonesia/i.test(n)||/GMT[+-]\d{4}/i.test(n)}function T(t){if(!t)return null;if(t instanceof Date&&!isNaN(t.getTime()))return t;const n=String(t).trim(),l=n.match(/Date\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\)/);if(l)return new Date(parseInt(l[1],10),parseInt(l[2],10),parseInt(l[3],10));const r=n.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);if(r)return new Date(parseInt(r[1],10),parseInt(r[2],10)-1,parseInt(r[3],10));const o=n.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);if(o){let s=parseInt(o[1],10),a=parseInt(o[2],10),e=parseInt(o[3],10),c=s,g=a;return s>12&&a<=12&&(g=s,c=a),new Date(e,c-1,g)}const d=Date.parse(n);return isNaN(d)?null:new Date(d)}function B(t){if(!t||!(t instanceof Date)||isNaN(t.getTime()))return"";const n=t.getFullYear(),l=String(t.getMonth()+1).padStart(2,"0"),r=String(t.getDate()).padStart(2,"0");return`${n}-${l}-${r}`}function q(t){if(!t||!(t instanceof Date)||isNaN(t.getTime()))return"-";const n=["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"],l=["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];return`${n[t.getDay()]}, ${t.getDate()} ${l[t.getMonth()]} ${t.getFullYear()}`}function O(t){if(!t||!(t instanceof Date)||isNaN(t.getTime()))return"-";const n=["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];return`${t.getDate()} ${n[t.getMonth()]} ${t.getFullYear()}`}function de(t){return!t||!(t instanceof Date)||isNaN(t.getTime())?"-":`${["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"][t.getMonth()]} ${t.getFullYear()}`}function ae(t,n){return!t||!n?!1:t.getFullYear()===n.getFullYear()&&t.getMonth()===n.getMonth()&&t.getDate()===n.getDate()}function j(t,n){if(!t||!n)return!1;const l=B(n);if(!l)return!1;if(t.date_iso&&t.date_iso===l||t.tanggal_iso&&t.tanggal_iso===l)return!0;if(t.start_date_obj&&t.end_date_obj){const r=new Date(n.getFullYear(),n.getMonth(),n.getDate()).getTime(),o=new Date(t.start_date_obj.getFullYear(),t.start_date_obj.getMonth(),t.start_date_obj.getDate()).getTime(),d=new Date(t.end_date_obj.getFullYear(),t.end_date_obj.getMonth(),t.end_date_obj.getDate()).getTime();return r>=o&&r<=d}return t.date_obj?ae(t.date_obj,n):!1}function u(t){return t==null?"":String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function P(t){const n=String(t||"").toLowerCase();return n.includes("gold room 2 & 3")||n.includes("gabungan")||n.includes("gold room 2")&&n.includes("3")?{badgeBg:"bg-indigo-100 text-indigo-900 border-indigo-200",badgePill:"bg-indigo-600 text-white",border:"border-indigo-400",cardBorder:"border-indigo-200",accentBg:"bg-indigo-50/60",headerBg:"bg-gradient-to-r from-indigo-900 to-indigo-800 text-white",chipText:"text-indigo-700",dotColor:"bg-indigo-600",calPill:"bg-indigo-100 text-indigo-900 hover:bg-indigo-200 border-indigo-300"}:n.includes("gold room 2")?{badgeBg:"bg-emerald-100 text-emerald-900 border-emerald-200",badgePill:"bg-emerald-700 text-white",border:"border-emerald-400",cardBorder:"border-emerald-200",accentBg:"bg-emerald-50/60",headerBg:"bg-gradient-to-r from-emerald-900 to-teal-800 text-white",chipText:"text-emerald-700",dotColor:"bg-emerald-600",calPill:"bg-emerald-100 text-emerald-900 hover:bg-emerald-200 border-emerald-300"}:n.includes("gold room 3")?{badgeBg:"bg-sky-100 text-sky-900 border-sky-200",badgePill:"bg-sky-700 text-white",border:"border-sky-400",cardBorder:"border-sky-200",accentBg:"bg-sky-50/60",headerBg:"bg-gradient-to-r from-cyan-900 to-blue-800 text-white",chipText:"text-sky-700",dotColor:"bg-sky-600",calPill:"bg-sky-100 text-sky-900 hover:bg-sky-200 border-sky-300"}:n.includes("gsg")?{badgeBg:"bg-amber-100 text-amber-950 border-amber-200",badgePill:"bg-amber-700 text-white",border:"border-amber-400",cardBorder:"border-amber-200",accentBg:"bg-amber-50/60",headerBg:"bg-gradient-to-r from-amber-900 to-yellow-800 text-white",chipText:"text-amber-800",dotColor:"bg-amber-600",calPill:"bg-amber-100 text-amber-950 hover:bg-amber-200 border-amber-300"}:n.includes("torosajie")?{badgeBg:"bg-purple-100 text-purple-900 border-purple-200",badgePill:"bg-purple-700 text-white",border:"border-purple-400",cardBorder:"border-purple-200",accentBg:"bg-purple-50/60",headerBg:"bg-gradient-to-r from-purple-900 to-violet-800 text-white",chipText:"text-purple-700",dotColor:"bg-purple-600",calPill:"bg-purple-100 text-purple-900 hover:bg-purple-200 border-purple-300"}:n.includes("hulawa")?{badgeBg:"bg-rose-100 text-rose-900 border-rose-200",badgePill:"bg-rose-700 text-white",border:"border-rose-400",cardBorder:"border-rose-200",accentBg:"bg-rose-50/60",headerBg:"bg-gradient-to-r from-rose-900 to-pink-800 text-white",chipText:"text-rose-700",dotColor:"bg-rose-600",calPill:"bg-rose-100 text-rose-900 hover:bg-rose-200 border-rose-300"}:{badgeBg:"bg-slate-100 text-slate-800 border-slate-200",badgePill:"bg-slate-700 text-white",border:"border-slate-300",cardBorder:"border-slate-200",accentBg:"bg-slate-50",headerBg:"bg-slate-800 text-white",chipText:"text-slate-700",dotColor:"bg-slate-600",calPill:"bg-slate-100 text-slate-800 hover:bg-slate-200 border-slate-300"}}function ce(t){return t?t.includes("Gold Room 2 & 3")?"GR 2&3":t.includes("Gold Room 2")?"GR 2":t.includes("Gold Room 3")?"GR 3":t.includes("GSG")?"GSG":t.includes("Torosajie")?"TR":t.includes("Hulawa")?"HL":t.slice(0,4):"R"}function R(){const t=[],n=new Set,l=window.LIVE_SCHEDULES&&Array.isArray(window.LIVE_SCHEDULES)&&window.LIVE_SCHEDULES.length>0?window.LIVE_SCHEDULES:window.DATABASE_DATA&&Array.isArray(window.DATABASE_DATA)?window.DATABASE_DATA:typeof LIVE_SCHEDULES<"u"&&Array.isArray(LIVE_SCHEDULES)?LIVE_SCHEDULES:[],r=window.EXTERNAL_DATA&&Array.isArray(window.EXTERNAL_DATA)?window.EXTERNAL_DATA:[],o=window.AGENDA_DATA&&Array.isArray(window.AGENDA_DATA)?window.AGENDA_DATA:[],d={},s=e=>String(e||"").trim().toLowerCase().replace(/[^a-z0-9]/g,"");function a(e,c,g,m,i,b,p,h,v,x,w,_,$){const f={id_jadwal:e||"",agenda:c||"",pic:g||"-",room:m||"",batch:i||"",kuota:b||0,sisa_kuota:p??(b||0),category:h,category_label:v,duration:parseFloat(x)||2,start_hour:K(w||"08:00"),date_obj:_,end_date_obj:$,date_iso:_?B(_):""};e&&!N(e)&&(d[e.trim().toLowerCase()]=f),c&&!N(c)&&(d[s(c)]=f,_&&(d[`${s(c)}_${B(_)}`]=f))}return l.forEach(e=>{if(!e)return;const c=e.date_obj||T(e.start||e.tanggal_pelatihan||e.tanggal),g=e.end_date_obj||T(e.end||e.tanggal_selesai||e.tanggal_pelatihan||e.tanggal);a(e.id_jadwal||e.id,e.agenda||e.nama_silabus||e.nama_pelatihan,e.pic||e.nama_trainer,e.room||e.ruangan,e.batch,e.kuota||e.kuota_peserta,e.sisa_kuota,"internal","Internal Training",e.duration_hour||e.duration||2,e.start_hour||e.jam_mulai,c,g)}),r.forEach(e=>{if(!e)return;const c=e.date_obj||T(e.start||e.tanggal);a(e.id_external||e.id_jadwal||e.id,e.agenda||e.nama_program,e.pic||e.lembaga,e.room||e.ruangan,e.batch,e.kuota,e.sisa_kuota,"external","External Training",e.duration_hour||e.duration||2,e.start_hour||e.jam_mulai,c,c)}),o.forEach(e=>{if(!e)return;const c=e.date_obj||T(e.start||e.tanggal);a(e.id_agenda||e.id_jadwal||e.id,e.agenda||e.nama_agenda,e.pic,e.room||e.ruangan||e.location,"",0,0,"agenda","Agenda Training",e.duration||2,e.start_hour||e.jam_mulai,c,c)}),G.forEach((e,c)=>{if(!e)return;const g=e.date_obj||T(e.date);if(!g)return;const m=B(g),i=String(e.agenda_id||e.agenda||e.id||"").trim(),b=s(i);let p=d[`${b}_${m}`]||d[b]||d[i.toLowerCase()]||null,h="";p&&p.agenda?h=p.agenda:i&&!N(i)?h=i:e.notes&&!N(e.notes)?h=e.notes:h="Kegiatan Penggunaan Ruangan";let v="";p&&p.id_jadwal?v=p.id_jadwal:i&&!N(i)&&/^[A-Z0-9_\-]+$/i.test(i)?v=i:v="USE-"+(e.no||c+1);const x=e.room||(p?p.room:"")||"Gold Room 2 & 3",w=e.hour||(p?p.start_hour:"08:00"),_=K(w),$=parseFloat(e.duration||(p?p.duration:2))||2,f=W(_,$),D=p&&p.pic&&p.pic!=="-"?p.pic:e.pic&&e.pic!=="-"&&!N(e.pic)?e.pic:"-";t.push({source:"rooms_use",id_jadwal:v,agenda:h,room:x,date_iso:m,date_obj:g,end_date_obj:g,start_hour:_,end_hour:f,duration:$,start_minutes:M(_),end_minutes:M(f),hour_display:`${_} - ${f} WIB`,pic:D,contact:p?p.contact||"":e.notes||"",category:p?p.category:"custom",category_label:p?p.category_label:"Penggunaan Ruangan",batch:p?p.batch:"",kuota:p?p.kuota:0,sisa_kuota:p?p.sisa_kuota:0,status:p?p.status:"CONFIRMED"}),v&&n.add(v.toLowerCase()),h&&n.add(s(h)+"_"+m)}),l.forEach(e=>{if(!e||!e.ruangan)return;const c=String(e.id_jadwal||e.id||"").trim(),g=e.date_obj||T(e.start||e.tanggal_pelatihan||e.tanggal),m=g?B(g):"",i=e.agenda||e.nama_silabus||e.nama_pelatihan||"";if(c&&n.has(c.toLowerCase())||i&&n.has(s(i)+"_"+m))return;const b=e.end_date_obj||T(e.end||e.tanggal_selesai||e.tanggal_pelatihan||e.tanggal),p=K(e.start_hour||e.jam_mulai||"08:00"),h=parseFloat(e.duration_hour||e.duration||2)||2,v=W(p,h);t.push({source:"internal_training",id_jadwal:c||"JADWAL-"+Date.now(),agenda:i||"Pelatihan Internal",room:e.ruangan,date_iso:m,date_obj:g,end_date_obj:b,start_hour:p,end_hour:v,duration:h,start_minutes:M(p),end_minutes:M(v),hour_display:`${p} - ${v} WIB`,pic:e.nama_trainer||e.pic||"Trainer L&D",contact:e.trainer_contact||"",category:"internal",category_label:"Internal Training",batch:e.batch?`Batch ${e.batch}`:"",kuota:e.kuota||e.kuota_peserta||0,sisa_kuota:e.sisa_kuota!=null?e.sisa_kuota:e.kuota||0,status:e.status||e.status_pelatihan||"CONFIRMED"})}),t}async function Y(){if(Z)return;Z=!0;const t=document.getElementById("room-sync-status");t&&(t.innerHTML='<span class="w-2 h-2 rounded-full bg-amber-500 animate-spin"></span> Menghubungkan database ruangan...');const n="1Y5IQUSN84p2Os1e9wxraDIfZF6UfOql4Y5EdXbv850A",l="2012773260",r="329050986";try{if(typeof fetchGvizSheetJson=="function"){const[o,d]=await Promise.all([fetchGvizSheetJson(n,"gid="+l).catch(()=>null),fetchGvizSheetJson(n,"gid="+r).catch(()=>null)]);if(o&&o.table&&Array.isArray(o.table.rows)){const s=[];o.table.rows.forEach(a=>{const e=a.c||[],c=m=>(e[m]?e[m].v!==void 0?e[m].v:e[m].f:"")||"",g=String(c(0)||"").trim();g&&s.push({name:g,capacity:parseInt(c(1),10)||20,pic:String(c(2)||"LnD").trim(),contact:String(c(3)||"").trim(),description:String(c(4)||"").trim()})}),s.length>0&&(k=s)}if(d&&d.table&&Array.isArray(d.table.rows)){const s=[];d.table.rows.forEach((a,e)=>{const c=a.c||[],g=w=>(c[w]?c[w].v!==void 0?c[w].v:c[w].f:"")||"",m=w=>(c[w]?c[w].f!==void 0?c[w].f:c[w].v:"")||"",i=String(g(0)||e+1).trim(),b=String(g(1)||"").trim(),p=m(2)||String(g(2)||""),h=String(g(3)||"").trim(),v=String(g(4)||"").trim(),x=parseFloat(g(5))||2;!p&&!b&&!h||s.push({no:i,agenda_id:b,agenda:b,date:p,room:h,hour:v,duration:x,date_obj:T(p)})}),s.length>0&&(G=s)}}if(ue(),z(),H(),F(),t){const d=new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"});t.innerHTML=`<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Database Ruangan: Terhubung (${d} WIB &bull; ${k.length} Ruang &bull; ${G.length} Agenda)`}}catch(o){console.warn("fetchRoomsData error:",o),t&&(t.innerHTML=`<span class="w-2 h-2 rounded-full bg-amber-500"></span> Menggunakan data lokal ruangan (${k.length} Ruang)`)}finally{Z=!1}}function ue(){const t=k.map(o=>`<option value="${u(o.name)}">${u(o.name)} (Kapasitas: ${o.capacity||"-"})</option>`).join(""),n=document.getElementById("schedule-room-filter");n&&(n.innerHTML='<option value="all">Semua Ruangan</option>'+t);const l=document.getElementById("room-filter-select");l&&(l.innerHTML='<option value="all">Semua Ruangan</option>'+t);const r=document.getElementById("rb-room");r&&(r.innerHTML=k.map(o=>`<option value="${u(o.name)}">${u(o.name)} (Kapasitas: ${o.capacity} Orang - ${o.pic||"PIC"})</option>`).join(""))}function ge(t){const n=document.getElementById("room-conflict-banner");if(!n)return;const r=R().filter(d=>j(d,t)),o=[];for(let d=0;d<r.length;d++)for(let s=d+1;s<r.length;s++){const a=r[d],e=r[s],c=U(a.room),g=U(e.room);let m=!1;if((c===g||c.includes("goldroom2and3")&&(g.includes("goldroom2")||g.includes("goldroom3"))||g.includes("goldroom2and3")&&(c.includes("goldroom2")||c.includes("goldroom3")))&&(m=!0),m){const i=a.start_minutes!=null?a.start_minutes:M(a.start_hour),b=a.end_minutes!=null?a.end_minutes:i+Math.round((a.duration||2)*60),p=e.start_minutes!=null?e.start_minutes:M(e.start_hour),h=e.end_minutes!=null?e.end_minutes:p+Math.round((e.duration||2)*60);i<h&&p<b&&o.push({itemA:a,itemB:e,date:t})}}if(o.length>0){n.classList.remove("hidden");const d=document.getElementById("room-conflict-desc");if(d){const s=o[0];d.innerHTML=`<strong>Perhatian Bentrok Jadwal:</strong> Terjadi tumpang tindih jam pemakaian antara <em>"${u(s.itemA.agenda)}"</em> (${u(s.itemA.room)}, ${u(s.itemA.start_hour)}-${u(s.itemA.end_hour)} WIB) dan <em>"${u(s.itemB.agenda)}"</em> (${u(s.itemB.room)}, ${u(s.itemB.start_hour)}-${u(s.itemB.end_hour)} WIB) pada ${q(t)}.`}}else n.classList.add("hidden")}function H(){const t=document.getElementById("section-ruangan");!t||t.classList.contains("hidden")||(pe(),z(),oe(),ge(y),V())}function pe(){const t=R(),n=new Date;let l=0;k.forEach(v=>{l+=Number(v.capacity)||0});const r=new Set;t.forEach(v=>{j(v,n)&&k.forEach(x=>{E(v.room,x.name)&&r.add(x.name)})});const o=r.size,d=Math.max(0,k.length-o),s=new Date,a=(s.getDay()+6)%7,e=s.getTime()-a*864e5,c=e+6*864e5,g=t.filter(v=>{if(!v.date_obj)return!1;const x=v.date_obj.getTime();return x>=e-432e5&&x<=c+432e5}).length,m=document.getElementById("room-kpi-total");m&&(m.textContent=k.length);const i=document.getElementById("room-kpi-capacity");i&&(i.textContent=l);const b=document.getElementById("room-kpi-occupied");b&&(b.textContent=o);const p=document.getElementById("room-kpi-available");p&&(p.textContent=d);const h=document.getElementById("room-kpi-week-sessions");h&&(h.textContent=g)}function z(){const t=document.getElementById("rooms-overview-cards");if(!t)return;const n=R(),l=new Date;let r="";k.forEach(o=>{const d=P(o.name),s=n.some(e=>j(e,l)&&E(e.room,o.name)),a=n.filter(e=>j(e,l)&&E(e.room,o.name));r+=`
        <div class="relative flex flex-col justify-between p-4 rounded-2xl bg-surface-container-lowest border ${d.cardBorder} shadow-xs hover:shadow-md transition-all group overflow-hidden">
          <div class="absolute top-0 left-0 right-0 h-1.5 ${d.headerBg}"></div>

          <div>
            <div class="flex items-start justify-between gap-2 mt-1 mb-2">
              <div class="flex items-center gap-2">
                <span class="w-8 h-8 rounded-xl ${d.badgeBg} flex items-center justify-center font-bold text-xs">
                  <span class="material-symbols-outlined text-[18px]">meeting_room</span>
                </span>
                <div>
                  <h4 class="font-bold text-sm text-on-surface leading-tight">${u(o.name)}</h4>
                  <p class="text-[11px] text-on-surface-variant">PIC: ${u(o.pic||"LnD")}</p>
                </div>
              </div>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${s?"bg-amber-100 text-amber-900 border border-amber-300":"bg-emerald-100 text-emerald-900 border border-emerald-300"}">
                ${s?"Terpakai":"Tersedia"}
              </span>
            </div>

            <div class="space-y-1.5 text-xs text-on-surface-variant my-3 pt-2 border-t border-outline-variant/30">
              <div class="flex items-center justify-between">
                <span class="text-outline">Kapasitas:</span>
                <span class="font-semibold text-on-surface">${o.capacity} Orang</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-outline">Status Hari Ini:</span>
                <span class="font-semibold ${s?"text-amber-700":"text-emerald-700"}">
                  ${s?`${a.length} Sesi Terjadwal`:"Kosong (Siap Pakai)"}
                </span>
              </div>
              ${o.is_partition?`
                <div class="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-[10.5px]">
                  <strong>Catatan Partisi:</strong> Gabungan Gold Room 2 & 3.
                </div>
              `:""}
            </div>
          </div>

          <div class="pt-3 border-t border-outline-variant/30 flex items-center gap-2">
            <button type="button" onclick="filterByRoomCard('${u(o.name)}')" class="flex-1 h-8 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
              <span class="material-symbols-outlined text-[16px]">visibility</span>
              <span>Lihat Jadwal</span>
            </button>
            <button type="button" onclick="openRoomBookingModal('${u(o.name)}')" class="h-8 px-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 text-xs font-semibold inline-flex items-center justify-center gap-1 transition-colors cursor-pointer" title="Booking Ruangan">
              <span class="material-symbols-outlined text-[16px]">add</span>
            </button>
          </div>
        </div>
      `}),t.innerHTML=r}function oe(){const t=document.getElementById("room-view-date-title"),n=document.getElementById("room-view-date-badge"),l=document.getElementById("room-date-picker-input"),r=document.getElementById("btn-room-nav-today"),o=new Date;if(l&&(l.value=B(y)),I==="weekly-lanes"||I==="weekly"){const d=(y.getDay()+6)%7,s=new Date(y.getFullYear(),y.getMonth(),y.getDate()-d),a=new Date(s.getFullYear(),s.getMonth(),s.getDate()+6),e=o>=s&&o<=new Date(a.getTime()+864e5);r&&(r.textContent="Minggu Ini"),t&&(t.textContent=`Pekan: ${O(s)} – ${O(a)}`),n&&(n.textContent=e?"Minggu Ini":"Pekan Terpilih",n.className=e?"px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200":"px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200")}else if(I==="monthly"){const d=y.getFullYear()===o.getFullYear()&&y.getMonth()===o.getMonth();r&&(r.textContent="Bulan Ini"),t&&(t.textContent=de(y)),n&&(n.textContent=d?"Bulan Ini":"Bulan Terpilih",n.className=d?"px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200":"px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200")}else if(I==="list")r&&(r.textContent="Hari Ini"),t&&(t.textContent="Semua Jadwal & Penggunaan Ruangan"),n&&(n.textContent="Daftar Lengkap",n.className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200");else{const d=ae(y,o);r&&(r.textContent="Hari Ini"),t&&(t.textContent=q(y)),n&&(n.textContent=d?"Hari Ini":O(y),n.className=d?"px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200":"px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200")}}function V(){const t=document.getElementById("room-schedule-main-container");t&&(I==="weekly"&&(I="weekly-lanes"),document.querySelectorAll(".room-subtab-btn").forEach(n=>{const l=n.id==="room-subtab-"+I;n.className=l?"room-subtab-btn flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg bg-indigo-700 text-white font-label-md text-label-md font-semibold shadow-sm transition-all cursor-pointer shrink-0":"room-subtab-btn flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest font-label-md text-label-md font-medium transition-all cursor-pointer shrink-0"}),oe(),I==="lanes"?me(t,y):I==="weekly-lanes"?fe(t,y):I==="monthly"?be(t,y):I==="matrix"?xe(t,y):I==="list"&&he(t))}function me(t,n){const l=R(),r=(document.getElementById("room-search-input")?.value||"").toLowerCase().trim(),o=document.getElementById("room-filter-select")?.value||"all",d=document.getElementById("room-category-filter")?.value||"all",s=k.filter(e=>!(o!=="all"&&!E(e.name,o)));let a='<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">';s.forEach(e=>{const c=P(e.name),g=l.filter(i=>{if(!j(i,n)||!E(i.room,e.name)||d!=="all"&&i.category!==d)return!1;if(r){const b=(i.agenda||"").toLowerCase().includes(r),p=(i.pic||"").toLowerCase().includes(r),h=(i.id_jadwal||"").toLowerCase().includes(r);if(!b&&!p&&!h)return!1}return!0});g.sort((i,b)=>(i.start_minutes||0)-(b.start_minutes||0));const m=g.length>0;a+=`
        <div class="flex flex-col rounded-2xl bg-surface-container-lowest border ${c.cardBorder} shadow-xs overflow-hidden">
          <!-- Room Lane Header -->
          <div class="p-3.5 sm:p-4 ${c.headerBg} flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[20px]">meeting_room</span>
              <div>
                <h4 class="font-title-sm text-title-sm font-bold leading-tight">${u(e.name)}</h4>
                <div class="text-[11px] opacity-85">Kapasitas: ${e.capacity} Kursi &bull; ${u(e.pic||"LnD")}</div>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded-full text-[11px] font-bold ${m?"bg-amber-400 text-slate-950":"bg-emerald-400 text-slate-950"}">
              ${m?g.length+" Sesi":"Kosong"}
            </span>
          </div>

          <!-- Room Lane Body -->
          <div class="p-3 sm:p-4 flex flex-col gap-3 flex-1 bg-surface-container-low/20 min-h-[220px]">
      `,g.length>0?g.forEach(i=>{const b=i.category==="internal"?"bg-primary-fixed text-on-primary-fixed":i.category==="external"?"bg-emerald-100 text-emerald-800":"bg-amber-100 text-amber-900",p=typeof openTrainingDetailModal=="function"&&i.category==="internal";a+=`
            <div class="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between gap-2.5 group">
              <div>
                <div class="flex items-center justify-between gap-1 mb-1.5">
                  <span class="inline-flex items-center gap-1 font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200" title="Jam Mulai s/d Jam Selesai (${i.duration||2} Jam)">
                    <span class="material-symbols-outlined text-[13px]">schedule</span>
                    <span>${u(i.start_hour)} - ${u(i.end_hour)} WIB</span>
                    <span class="text-[10px] font-normal text-indigo-500">(${i.duration}h)</span>
                  </span>
                  <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold ${b}">
                    ${u(i.category_label||"Jadwal")}
                  </span>
                </div>

                <h5 class="font-bold text-sm text-on-surface line-clamp-2 leading-snug group-hover:text-primary transition-colors cursor-pointer" onclick="${p?`openTrainingDetailModal('${i.id_jadwal}')`:""}">
                  ${u(i.agenda)}
                </h5>

                <div class="flex flex-col gap-1 mt-2.5 text-xs text-on-surface-variant">
                  <div class="flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[15px] text-outline">person</span>
                    <span class="truncate font-medium">Trainer/PIC: <strong class="text-on-surface">${u(i.pic||"-")}</strong></span>
                  </div>
                  ${i.batch?`
                    <div class="flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-[15px] text-outline">label</span>
                      <span>${u(i.batch)}</span>
                    </div>
                  `:""}
                  ${i.kuota?`
                    <div class="flex items-center gap-1.5 font-medium text-emerald-700">
                      <span class="material-symbols-outlined text-[15px]">event_seat</span>
                      <span>Sisa Kuota: ${i.sisa_kuota!=null?i.sisa_kuota:i.kuota} Kursi</span>
                    </div>
                  `:""}
                </div>
              </div>

              <div class="pt-2 border-t border-outline-variant/30 flex items-center justify-between gap-2">
                <span class="text-[10.5px] text-outline font-mono truncate" title="ID Agenda">${u(i.id_jadwal||"")}</span>
                ${p?`
                  <button type="button" onclick="openTrainingDetailModal('${i.id_jadwal}')" class="h-7 px-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer">
                    <span>Detail</span>
                    <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                `:""}
              </div>
            </div>
          `}):a+=`
          <div class="flex-1 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-outline-variant/40 rounded-xl bg-surface-container-lowest/60 text-on-surface-variant gap-2">
            <span class="material-symbols-outlined text-[32px] text-emerald-600">check_circle</span>
            <div class="font-bold text-xs text-on-surface">Ruangan Tersedia</div>
            <p class="text-[11px] text-on-surface-variant max-w-[160px]">Tidak ada agenda terjadwal di ${u(e.name)} pada tanggal ini.</p>
            <button type="button" onclick="openRoomBookingModal('${u(e.name)}', '${B(n)}')" class="mt-1 h-7 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer">
              <span class="material-symbols-outlined text-[14px]">add</span>
              <span>Gunakan Ruangan Ini</span>
            </button>
          </div>
        `,a+=`
          </div>
        </div>
      `}),a+="</div>",t.innerHTML=a}function fe(t,n){const l=R(),r=(document.getElementById("room-search-input")?.value||"").toLowerCase().trim(),o=document.getElementById("room-filter-select")?.value||"all",d=document.getElementById("room-category-filter")?.value||"all",s=(n.getDay()+6)%7,a=new Date(n.getFullYear(),n.getMonth(),n.getDate()-s),e=[];for(let b=0;b<7;b++)e.push(new Date(a.getFullYear(),a.getMonth(),a.getDate()+b));const c=["Senin","Selasa","Rabu","Kamis","Jumat","Sabtu","Minggu"],g=B(new Date),m=k.filter(b=>!(o!=="all"&&!E(b.name,o)));let i=`
      <div class="mb-3 px-3.5 py-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200/60 flex flex-wrap items-center justify-between gap-2 text-xs text-indigo-950">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-[18px] text-indigo-600">date_range</span>
          <span class="font-bold">Tampilan Kotak Mingguan:</span>
          <span>Merinci jadwal tiap ruangan dari <strong>Senin, ${O(e[0])}</strong> s/d <strong>Minggu, ${O(e[6])}</strong>.</span>
        </div>
        <div class="text-[11px] text-indigo-700 font-medium">Klik pada tanggal atau kartu untuk membuka Kotak Harian.</div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    `;m.forEach(b=>{const p=P(b.name);let h=0;const v=e.map((x,w)=>{const _=l.filter($=>{if(!j($,x)||!E($.room,b.name)||d!=="all"&&$.category!==d)return!1;if(r){const f=($.agenda||"").toLowerCase().includes(r),D=($.pic||"").toLowerCase().includes(r),S=($.id_jadwal||"").toLowerCase().includes(r);if(!f&&!D&&!S)return!1}return!0});return _.sort(($,f)=>($.start_minutes||0)-(f.start_minutes||0)),h+=_.length,{date:x,dayName:c[w],schedules:_}});i+=`
        <div class="flex flex-col rounded-2xl bg-surface-container-lowest border ${p.cardBorder} shadow-xs overflow-hidden">
          <!-- Room Lane Header -->
          <div class="p-3.5 sm:p-4 ${p.headerBg} flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[20px]">meeting_room</span>
              <div>
                <h4 class="font-title-sm text-title-sm font-bold leading-tight">${u(b.name)}</h4>
                <div class="text-[11px] opacity-85">Kapasitas: ${b.capacity} Kursi &bull; ${u(b.pic||"LnD")}</div>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded-full text-[11px] font-bold ${h>0?"bg-amber-400 text-slate-950":"bg-emerald-400 text-slate-950"}">
              ${h>0?h+" Sesi Pekan Ini":"Pekan Ini Kosong"}
            </span>
          </div>

          <!-- Room Lane Body: Breakdown Hari Senin s/d Minggu -->
          <div class="p-3 sm:p-3.5 flex flex-col gap-2.5 flex-1 bg-surface-container-low/20">
      `,v.forEach(x=>{const w=B(x.date)===g,_=x.schedules.length>0,$=B(x.date);i+=`
          <div class="rounded-xl border ${_?"border-outline-variant/60 bg-surface-container-lowest":"border-dashed border-outline-variant/30 bg-surface-container-lowest/40"} p-2.5 transition-all">
            <div class="flex items-center justify-between gap-1 mb-1.5">
              <div class="flex items-center gap-1.5 cursor-pointer group" onclick="switchRoomDateAndDaily('${$}')" title="Buka Kotak Harian untuk tanggal ini">
                <span class="font-bold text-xs ${w?"text-primary":"text-on-surface"} group-hover:underline">${x.dayName}, ${x.date.getDate()} ${x.date.toLocaleDateString("id-ID",{month:"short"})}</span>
                ${w?'<span class="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-primary text-white">Hari Ini</span>':""}
              </div>
              <span class="text-[10px] font-semibold ${_?"text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200":"text-outline/70"}">
                ${_?`${x.schedules.length} Sesi`:"Kosong"}
              </span>
            </div>
        `,_?(i+='<div class="space-y-1.5 mt-1">',x.schedules.forEach(f=>{const D=typeof openTrainingDetailModal=="function"&&f.category==="internal";i+=`
              <div class="p-2 rounded-lg bg-surface-container-low/40 hover:bg-surface-container-low border border-outline-variant/30 transition-all text-xs">
                <div class="flex items-center justify-between gap-1 text-[10px] text-on-surface-variant mb-0.5 font-mono">
                  <span class="font-semibold text-indigo-700">${u(f.start_hour)} - ${u(f.end_hour)} WIB (${f.duration}h)</span>
                  <span class="px-1 py-0.2 rounded text-[9px] font-medium bg-surface-container text-on-surface">${u(f.category_label||"Jadwal")}</span>
                </div>
                <div class="font-bold text-on-surface line-clamp-1 hover:text-primary cursor-pointer" onclick="${D?`openTrainingDetailModal('${f.id_jadwal}')`:`switchRoomDateAndDaily('${$}')`}">
                  ${u(f.agenda)}
                </div>
                <div class="flex items-center justify-between text-[10px] text-outline mt-0.5">
                  <span class="truncate">PIC: ${u(f.pic||"-")}</span>
                  <span class="font-mono text-[9.5px]">${u(f.id_jadwal)}</span>
                </div>
              </div>
            `}),i+="</div>"):i+=`
            <div class="flex items-center justify-between text-[11px] text-outline/60 pt-0.5">
              <span>Tidak ada pemakaian</span>
              <button type="button" onclick="openRoomBookingModal('${u(b.name)}', '${$}')" class="text-[10.5px] font-semibold text-primary hover:underline inline-flex items-center gap-0.5 cursor-pointer">
                <span class="material-symbols-outlined text-[12px]">add</span>
                <span>Pakai</span>
              </button>
            </div>
          `,i+="</div>"}),i+=`
          </div>
          <!-- Card Footer -->
          <div class="p-3 bg-surface-container-lowest border-t border-outline-variant/30 flex items-center justify-between gap-2">
            <span class="text-[11px] text-outline">${h} Sesi Terjadwal</span>
            <button type="button" onclick="openRoomBookingModal('${u(b.name)}', '${B(n)}')" class="h-7 px-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer">
              <span class="material-symbols-outlined text-[14px]">add</span>
              <span>Booking Ruangan</span>
            </button>
          </div>
        </div>
      `}),i+="</div>",t.innerHTML=i}function be(t,n){const l=R(),r=(document.getElementById("room-search-input")?.value||"").toLowerCase().trim(),o=document.getElementById("room-filter-select")?.value||"all",d=document.getElementById("room-category-filter")?.value||"all",s=n.getFullYear(),a=n.getMonth(),c=B(new Date),g=new Date(s,a,1),m=new Date(s,a+1,0),i=(g.getDay()+6)%7,b=m.getDate();let p=0;const h=new Set,v={};k.forEach(f=>{v[f.name]=0}),l.forEach(f=>{f.date_obj&&f.date_obj.getFullYear()===s&&f.date_obj.getMonth()===a&&(p++,h.add(B(f.date_obj)),k.forEach(D=>{E(f.room,D.name)&&(v[D.name]=(v[D.name]||0)+1)}))});let x=`
      <div class="flex flex-col gap-3">
        <!-- MONTH SUMMARY BAR & ROOM LEGEND CHIPS -->
        <div class="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-bold text-on-surface">Legenda Ruangan:</span>
            <button type="button" onclick="setRoomFilterAndRender('all')" class="px-2.5 py-1 rounded-lg text-xs font-semibold ${o==="all"?"bg-indigo-700 text-white":"bg-surface-container text-on-surface hover:bg-surface-container-high"} transition-all cursor-pointer">
              Semua Ruangan
            </button>
    `;k.forEach(f=>{const D=P(f.name),S=E(o,f.name);x+=`
        <button type="button" onclick="setRoomFilterAndRender('${u(f.name)}')" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${S?D.badgePill:D.badgeBg} border ${D.cardBorder} transition-all cursor-pointer" title="Klik untuk memfilter kalender ke ruangan ini">
          <span class="w-2 h-2 rounded-full ${S?"bg-white":D.dotColor}"></span>
          <span>${u(f.name)}</span>
          <span class="opacity-75 text-[10px]">(${v[f.name]||0})</span>
        </button>
      `}),x+=`
          </div>
          <div class="flex items-center gap-3 text-xs text-on-surface-variant font-medium shrink-0">
            <div class="flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px] text-indigo-600">event_available</span>
              <span><strong>${h.size}</strong> Hari Terpakai</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px] text-amber-600">calendar_month</span>
              <span><strong>${p}</strong> Total Sesi</span>
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
    `;const w=new Date(s,a,0).getDate();for(let f=0;f<i;f++){const D=w-i+f+1;x+=`
        <div class="min-h-[105px] p-2 bg-surface-container-low/30 border-r border-outline-variant/20 text-outline/50 flex flex-col justify-between">
          <span class="font-bold text-[11px]">${D}</span>
          <span class="text-[9.5px] italic text-center">Bulan lalu</span>
        </div>
      `}for(let f=1;f<=b;f++){const D=new Date(s,a,f),S=B(D),ee=S===c,ie=(i+f-1)%7,Ce=ie===5||ie===6,J=l.filter(C=>{if(!j(C,D)||o!=="all"&&!E(C.room,o)||d!=="all"&&C.category!==d)return!1;if(r){const A=(C.agenda||"").toLowerCase().includes(r),X=(C.pic||"").toLowerCase().includes(r),ne=(C.id_jadwal||"").toLowerCase().includes(r);if(!A&&!X&&!ne)return!1}return!0});J.sort((C,A)=>(C.start_minutes||0)-(A.start_minutes||0));const te=J.length>0;x+=`
        <div class="min-h-[110px] p-2 border-r border-outline-variant/30 flex flex-col justify-between transition-colors group ${ee?"bg-primary/5":Ce?"bg-surface-container-low/20":"bg-surface-container-lowest hover:bg-surface-container-low/40"}">
          <div>
            <div class="flex items-center justify-between gap-1 mb-1.5">
              <span class="inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${ee?"bg-primary text-white shadow-xs":"text-on-surface"}">
                ${f}
              </span>
              ${te?`
                <button type="button" onclick="switchRoomDateAndDaily('${S}')" class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer" title="Lihat Kotak Ruangan pada tanggal ini">
                  ${J.length} Agenda
                </button>
              `:`
                <button type="button" onclick="openRoomBookingModal('', '${S}')" class="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-semibold text-primary hover:underline cursor-pointer" title="Booking Ruangan">
                  + Pakai
                </button>
              `}
            </div>

            <div class="space-y-1">
      `,te&&(J.slice(0,3).forEach(A=>{const X=P(A.room),ne=ce(A.room);x+=`
            <div onclick="switchRoomDateAndDaily('${S}')" class="p-1 rounded-md text-[10.5px] border ${X.calPill} transition-all cursor-pointer truncate leading-tight shadow-2xs" title="${u(A.room)}: ${u(A.agenda)} (${u(A.start_hour)} - ${u(A.end_hour)} WIB)">
              <div class="flex items-center gap-1 font-semibold">
                <span class="w-1.5 h-1.5 rounded-full ${X.dotColor} shrink-0"></span>
                <span class="font-bold shrink-0">[${ne}]</span>
                <span class="truncate">${u(A.agenda)}</span>
              </div>
            </div>
          `}),J.length>3&&(x+=`
            <div onclick="switchRoomDateAndDaily('${S}')" class="text-[10px] text-center font-bold text-indigo-700 hover:underline cursor-pointer pt-0.5">
              + ${J.length-3} agenda lainnya
            </div>
          `)),x+=`
            </div>
          </div>

          <div class="mt-1 flex items-center justify-between text-[9.5px] text-outline/50">
            ${ee?'<span class="font-bold text-primary">Hari Ini</span>':"<span></span>"}
            ${te?`<span class="cursor-pointer hover:text-primary font-semibold" onclick="switchRoomDateAndDaily('${S}')">Detail &rarr;</span>`:""}
          </div>
        </div>
      `}const _=i+b,$=_%7===0?0:7-_%7;for(let f=1;f<=$;f++)x+=`
        <div class="min-h-[105px] p-2 bg-surface-container-low/30 border-r border-outline-variant/20 text-outline/50 flex flex-col justify-between">
          <span class="font-bold text-[11px]">${f}</span>
          <span class="text-[9.5px] italic text-center">Bulan depan</span>
        </div>
      `;x+=`
          </div>
        </div>

        <div class="flex items-center gap-2 p-3 rounded-xl bg-surface-container-low/60 border border-outline-variant/30 text-xs text-on-surface-variant">
          <span class="material-symbols-outlined text-[18px] text-indigo-600">lightbulb</span>
          <span><strong>Tips:</strong> Klik pada kartu agenda atau tombol <em>"X Agenda"</em> pada kalender untuk langsung membuka tampilan <strong>Kotak Ruangan Harian</strong> dengan rincian lengkap pada tanggal tersebut.</span>
        </div>
      </div>
    `,t.innerHTML=x}function xe(t,n){const l=R(),r=["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00"];let o=`
      <div class="overflow-x-auto rounded-2xl border border-outline-variant/40 bg-surface-container-lowest shadow-xs">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-surface-container border-b border-outline-variant/50">
              <th class="p-3 font-bold text-on-surface w-24 border-r border-outline-variant/40">Jam (WIB)</th>
    `;k.forEach(d=>{o+=`
        <th class="p-3 font-bold text-on-surface border-r border-outline-variant/40 min-w-[180px]">
          <div class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[17px] text-indigo-600">meeting_room</span>
            <div>
              <div>${u(d.name)}</div>
              <div class="text-[10px] font-normal text-on-surface-variant">Kapasitas: ${d.capacity} Kursi</div>
            </div>
          </div>
        </th>
      `}),o+="</tr></thead><tbody>",r.forEach((d,s)=>{const a=M(d),e=a+60;o+=`
        <tr class="border-b border-outline-variant/30 ${s%2===1?"bg-surface-container-low/20":""}">
          <td class="p-3 font-mono font-bold text-on-surface border-r border-outline-variant/40 bg-surface-container-low/40 text-center">
            ${d}
          </td>
      `,k.forEach(c=>{const g=l.filter(m=>{if(!j(m,n)||!E(m.room,c.name))return!1;const i=m.start_minutes!=null?m.start_minutes:M(m.start_hour),b=m.end_minutes!=null?m.end_minutes:i+Math.round((m.duration||2)*60);return i<e&&b>a});g.length>0?(o+='<td class="p-2 border-r border-outline-variant/40 bg-amber-50/50">',g.forEach(m=>{o+=`
              <div class="p-1.5 rounded-lg bg-amber-100/90 border border-amber-300 text-amber-950 font-semibold mb-1 text-[11px]" title="${u(m.agenda)} (${u(m.start_hour)} - ${u(m.end_hour)} WIB, ${m.duration} Jam)">
                <div class="truncate font-bold">${u(m.agenda)}</div>
                <div class="text-[9.5px] text-amber-800 font-mono mt-0.5">${u(m.start_hour)} - ${u(m.end_hour)} WIB (${m.duration}h)</div>
                <div class="text-[9.5px] text-amber-900/80 font-normal">PIC: ${u(m.pic||"-")}</div>
              </div>
            `}),o+="</td>"):o+=`
            <td class="p-2 border-r border-outline-variant/40 text-center text-outline/50 hover:bg-surface-container-low/40 transition-colors">
              <span class="text-[11px]">-</span>
            </td>
          `}),o+="</tr>"}),o+="</tbody></table></div>",t.innerHTML=o}function he(t){const n=R(),l=(document.getElementById("room-search-input")?.value||"").toLowerCase().trim(),r=document.getElementById("room-filter-select")?.value||"all",o=document.getElementById("room-category-filter")?.value||"all";let d=n.filter(a=>{if(r!=="all"&&!E(a.room,r)||o!=="all"&&a.category!==o)return!1;if(l){const e=(a.agenda||"").toLowerCase().includes(l),c=(a.pic||"").toLowerCase().includes(l),g=(a.room||"").toLowerCase().includes(l),m=(a.id_jadwal||"").toLowerCase().includes(l);if(!e&&!c&&!g&&!m)return!1}return!0});d.sort((a,e)=>{const c=a.date_obj?a.date_obj.getTime():0,g=e.date_obj?e.date_obj.getTime():0;return g!==c?g-c:(e.start_minutes||0)-(a.start_minutes||0)});let s=`
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
    `;d.length>0?d.forEach(a=>{const e=P(a.room),c=typeof openTrainingDetailModal=="function"&&a.category==="internal";s+=`
          <tr class="hover:bg-surface-container-low/30 transition-colors">
            <td class="p-3 font-semibold text-on-surface whitespace-nowrap">
              ${O(a.date_obj)}
            </td>
            <td class="p-3 whitespace-nowrap">
              <div class="font-mono font-bold text-indigo-700">${u(a.start_hour)} - ${u(a.end_hour)} WIB</div>
              <div class="text-[10px] text-outline">Durasi: ${a.duration} Jam</div>
            </td>
            <td class="p-3 whitespace-nowrap">
              <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${e.badgeBg}">
                <span class="w-1.5 h-1.5 rounded-full ${e.dotColor}"></span>
                <span>${u(a.room)}</span>
              </span>
            </td>
            <td class="p-3 font-bold text-on-surface">
              <div class="line-clamp-2">${u(a.agenda)}</div>
              <div class="text-[10px] text-outline font-mono mt-0.5">${u(a.id_jadwal||"")} ${a.batch?`&bull; ${u(a.batch)}`:""}</div>
            </td>
            <td class="p-3 whitespace-nowrap">
              <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-surface-container text-on-surface">
                ${u(a.category_label||"Jadwal")}
              </span>
            </td>
            <td class="p-3 text-on-surface-variant whitespace-nowrap">
              ${u(a.pic||"-")}
            </td>
            <td class="p-3 text-center whitespace-nowrap">
              <div class="inline-flex items-center gap-1">
                <button type="button" onclick="switchRoomDateAndDaily('${a.date_iso}')" class="h-7 px-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer" title="Buka Kotak Harian">
                  <span class="material-symbols-outlined text-[14px]">view_column</span>
                </button>
                ${c?`
                  <button type="button" onclick="openTrainingDetailModal('${a.id_jadwal}')" class="h-7 px-2.5 rounded-lg bg-primary text-white hover:bg-primary/90 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer">
                    <span>Detail</span>
                  </button>
                `:""}
              </div>
            </td>
          </tr>
        `}):s+=`
        <tr>
          <td colspan="7" class="p-8 text-center text-outline">
            Tidak ada agenda ruangan yang sesuai dengan filter.
          </td>
        </tr>
      `,s+="</tbody></table></div>",t.innerHTML=s}function ve(t){I==="weekly-lanes"||I==="weekly"?y=new Date(y.getFullYear(),y.getMonth(),y.getDate()+t*7):I==="monthly"?y=new Date(y.getFullYear(),y.getMonth()+t,1):y=new Date(y.getFullYear(),y.getMonth(),y.getDate()+t),H()}function ye(){y=new Date,H()}function we(t){if(!t)return;const n=t.split("-");n.length===3&&(y=new Date(parseInt(n[0],10),parseInt(n[1],10)-1,parseInt(n[2],10)),H())}function _e(t){I=t,V()}function $e(){V()}function De(){const t=document.getElementById("room-search-input"),n=document.getElementById("room-filter-select"),l=document.getElementById("room-category-filter");t&&(t.value=""),n&&(n.value="all"),l&&(l.value="all"),V()}function ke(t){const n=document.getElementById("room-filter-select");n&&(n.value=t),V();const l=document.getElementById("room-schedule-main-container");l&&l.scrollIntoView({behavior:"smooth",block:"start"})}function Ie(t){const n=document.getElementById("room-filter-select");n&&(n.value=t),V()}function Be(t){if(!t)return;const n=T(t);if(!n)return;y=n,I="lanes",H();const l=document.getElementById("room-schedule-main-container");l&&l.scrollIntoView({behavior:"smooth",block:"start"})}function F(){const t=document.getElementById("cal-room-lanes-container");if(!t)return;const n=document.getElementById("cal-room-date-title");n&&(n.textContent=q(L));const l=document.getElementById("cal-room-date-picker");l&&(l.value=B(L));const r=R(),o=k;let d='<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">';o.forEach(s=>{const a=P(s.name),e=r.filter(g=>!(!j(g,L)||!E(g.room,s.name)));e.sort((g,m)=>(g.start_minutes||0)-(m.start_minutes||0));const c=e.length>0;d+=`
        <div class="flex flex-col rounded-2xl bg-surface-container-lowest border ${a.cardBorder} shadow-xs overflow-hidden">
          <div class="p-3 ${a.headerBg} flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px]">meeting_room</span>
              <div>
                <h4 class="font-bold text-xs leading-tight">${u(s.name)}</h4>
                <div class="text-[10px] opacity-80">${s.capacity} Kursi &bull; ${u(s.pic||"LnD")}</div>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${c?"bg-amber-400 text-slate-950":"bg-emerald-400 text-slate-950"}">
              ${c?e.length+" Sesi":"Kosong"}
            </span>
          </div>

          <div class="p-3 flex flex-col gap-2.5 flex-1 bg-surface-container-low/20 min-h-[160px]">
      `,e.length>0?e.forEach(g=>{d+=`
            <div class="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-2xs">
              <div class="flex items-center justify-between text-[10px] text-indigo-700 font-bold mb-1">
                <span>${u(g.start_hour)} - ${u(g.end_hour)} WIB</span>
                <span class="px-1.5 py-0.2 rounded text-[9px] bg-indigo-50 border border-indigo-200">${u(g.category_label||"Jadwal")}</span>
              </div>
              <h5 class="font-bold text-xs text-on-surface line-clamp-2">${u(g.agenda)}</h5>
              <div class="text-[10px] text-on-surface-variant mt-1">PIC: ${u(g.pic||"-")}</div>
            </div>
          `}):d+=`
          <div class="flex-1 flex flex-col items-center justify-center p-4 text-center border-2 border-dashed border-outline-variant/40 rounded-xl bg-surface-container-lowest/60 text-outline gap-1">
            <span class="material-symbols-outlined text-[24px] text-emerald-600">check_circle</span>
            <div class="font-bold text-xs text-on-surface">Tersedia</div>
            <p class="text-[10px] text-on-surface-variant">Tidak ada agenda.</p>
          </div>
        `,d+=`
          </div>
        </div>
      `}),d+="</div>",t.innerHTML=d}function Ee(t){L=new Date(L.getFullYear(),L.getMonth(),L.getDate()+t),F()}function Re(){L=new Date,F()}function Se(t){if(!t)return;const n=t.split("-");n.length===3&&(L=new Date(parseInt(n[0],10),parseInt(n[1],10)-1,parseInt(n[2],10)),F())}function Q(){const t=document.getElementById("rb-hour"),n=document.getElementById("rb-duration"),l=document.getElementById("rb-end-hour-preview");if(!l)return;const r=t?K(t.value||"08:00"):"08:00",o=n&&parseFloat(n.value)||2,d=W(r,o);l.innerHTML=`<span class="font-mono font-bold text-indigo-700">${r} - ${d} WIB</span> (Total Durasi: <strong>${o} Jam</strong>)`}function re(t){if(!t)return;const n=t.value;if(!n||n==="custom")return;const r=R().find(o=>o.id_jadwal===n);if(r){const o=document.getElementById("rb-agenda");o&&(o.value=r.agenda);const d=document.getElementById("rb-pic");d&&(d.value=r.pic);const s=document.getElementById("rb-room");s&&r.room&&(s.value=r.room);const a=document.getElementById("rb-date");a&&r.date_iso&&(a.value=r.date_iso);const e=document.getElementById("rb-hour");e&&r.start_hour&&(e.value=r.start_hour);const c=document.getElementById("rb-duration");c&&r.duration&&(c.value=r.duration),Q()}}function Ae(t,n,l){const r=document.getElementById("modal-room-booking");if(!r)return;r.classList.remove("hidden");const o=document.getElementById("rb-room");o&&t&&(o.value=t);const d=document.getElementById("rb-date");d&&(d.value=n||B(y));const s=document.getElementById("rb-hour");s&&!s.value&&(s.value="08:00");const a=document.getElementById("rb-duration");a&&!a.value&&(a.value="2");const e=document.getElementById("rb-agenda-id-select");if(e){let c='<option value="custom">&mdash; Booking Mandiri / Acara Baru &mdash;</option>';const g=window.LIVE_SCHEDULES&&Array.isArray(window.LIVE_SCHEDULES)?window.LIVE_SCHEDULES:window.DATABASE_DATA&&Array.isArray(window.DATABASE_DATA)?window.DATABASE_DATA:[];g.length>0&&(c+='<optgroup label="Jadwal Pelatihan Internal">',g.forEach(i=>{const b=i.id_jadwal||i.id;b&&(c+=`<option value="${u(b)}">${u(b)} - ${u(i.agenda||i.nama_silabus)}</option>`)}),c+="</optgroup>");const m=window.EXTERNAL_DATA&&Array.isArray(window.EXTERNAL_DATA)?window.EXTERNAL_DATA:[];m.length>0&&(c+='<optgroup label="External Training">',m.forEach(i=>{const b=i.id_external||i.id_jadwal||i.id;b&&(c+=`<option value="${u(b)}">${u(b)} - ${u(i.agenda||i.nama_program)}</option>`)}),c+="</optgroup>"),e.innerHTML=c,l&&(e.value=l,re(e))}Q()}function se(){const t=document.getElementById("modal-room-booking");t&&t.classList.add("hidden")}async function Te(t){t&&t.preventDefault&&t.preventDefault();const n=document.getElementById("btn-submit-room-booking"),l=n?n.innerHTML:"";n&&(n.disabled=!0,n.innerHTML='<span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Menyimpan...');const r=document.getElementById("rb-room")?.value||"",o=document.getElementById("rb-date")?.value||"",d=document.getElementById("rb-hour")?.value||"08:00",s=parseFloat(document.getElementById("rb-duration")?.value||2)||2,a=document.getElementById("rb-agenda-id-select")?.value||"",e=document.getElementById("rb-agenda")?.value||"",c=document.getElementById("rb-pic")?.value||"",g=document.getElementById("rb-notes")?.value||"";if(!r||!o||!e){alert("Mohon lengkapi Ruangan, Tanggal, dan Nama Agenda / Kegiatan."),n&&(n.disabled=!1,n.innerHTML=l);return}const m=K(d),i=W(m,s),b=m.replace(":","."),p=a&&a!=="custom"?a:e,h={no:String(G.length+1),agenda_id:p,agenda:e,date:o,room:r,hour:b,duration:s,pic:c,notes:g,date_obj:T(o)};let v=!1;try{const w=typeof API_URL<"u"&&API_URL?API_URL:"https://script.google.com/macros/s/AKfycbxb_YaLMPz-vK06QOJBhmD1zlZhOgaQimytAf03Mn8hRjsf4hhN_8Tc0W7nt7LNLnKh/exec",_={action:"book_room",...h},$=await fetch(w,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(_)});if($.ok){const f=await $.json();f&&f.status==="success"&&(v=!0)}}catch(w){console.warn("Koneksi simpan booking online gagal, menyimpan di sesi lokal:",w)}G.push(h),se(),z(),H(),F(),n&&(n.disabled=!1,n.innerHTML=l);const x=v?`Penggunaan ruangan "${r}" pada ${o} (${m} - ${i} WIB, ${s} Jam) berhasil dicatat dan disinkronkan ke sheet roomsUse!`:`Penggunaan ruangan "${r}" pada ${o} (${m} - ${i} WIB, ${s} Jam) berhasil dicatat dalam sesi lokal.`;alert(x)}function Le(){const t=R();if(!t.length){alert("Tidak ada data jadwal ruangan untuk diunduh.");return}const n=["ID Agenda","Tanggal","Jam Mulai","Jam Selesai","Durasi (Jam)","Ruangan","Agenda","Kategori","PIC / Trainer","Status"],l=t.map(a=>[`"${(a.id_jadwal||"").replace(/"/g,'""')}"`,`"${(a.date_iso||"").replace(/"/g,'""')}"`,`"${(a.start_hour||"").replace(/"/g,'""')}"`,`"${(a.end_hour||"").replace(/"/g,'""')}"`,`"${a.duration||2}"`,`"${(a.room||"").replace(/"/g,'""')}"`,`"${(a.agenda||"").replace(/"/g,'""')}"`,`"${(a.category_label||"").replace(/"/g,'""')}"`,`"${(a.pic||"").replace(/"/g,'""')}"`,`"${(a.status||"").replace(/"/g,'""')}"`]),r="\uFEFF"+[n.join(","),...l.map(a=>a.join(","))].join(`\r
`),o=new Blob([r],{type:"text/csv;charset=utf-8;"}),d=URL.createObjectURL(o),s=document.createElement("a");s.setAttribute("href",d),s.setAttribute("download",`Jadwal_Penggunaan_Ruangan_${B(new Date)}.csv`),document.body.appendChild(s),s.click(),document.body.removeChild(s),URL.revokeObjectURL(d)}function Me(){window.print()}function je(){z(),H(),F()}window.fetchRoomsData=Y,window.refreshRoomData=Y,window.reprocessRoomsData=je,window.renderRoomUsagePage=H,window.renderCalRoomLanes=F,window.navRoomDate=ve,window.setRoomDateToday=ye,window.onRoomDatePickerChange=we,window.navCalRoomDate=Ee,window.setCalRoomDateToday=Re,window.onCalRoomDatePicker=Se,window.setRoomSubView=_e,window.filterRoomView=$e,window.resetRoomFilters=De,window.filterByRoomCard=ke,window.setRoomFilterAndRender=Ie,window.switchRoomDateAndDaily=Be,window.openRoomBookingModal=Ae,window.closeRoomBookingModal=se,window.submitRoomBooking=Te,window.downloadRoomSchedulePdf=Me,window.exportRoomScheduleCsv=Le,window.updateRoomBookingEndHourPreview=Q,window.onRoomBookingAgendaSelectChange=re,document.readyState==="loading"?document.addEventListener("DOMContentLoaded",function(){Y()}):Y()})();
