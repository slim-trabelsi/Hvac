/* ============================================================
   HVAC MONITOR — application logic
   ============================================================ */
const BASE_HEAT = 20;   // HDD base
const BASE_COOL = 25;   // CDD base
const MONTH_NAMES = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];

const state = {
  raw: { 2025: [], 2026: [] },
  daily: { 2025: [], 2026: [] },     // per-date aggregates
  filter: { year: 2026, month: 'all' },
  pendingBatch: [],                  // entries staged for GitHub commit
  charts: {}
};

/* ---------------- data loading ---------------- */
async function loadYear(year){
  try{
    const res = await fetch(`data/${year}.json`, { cache:'no-store' });
    if(!res.ok) throw new Error(res.status);
    return await res.json();
  }catch(e){
    console.warn(`data/${year}.json introuvable ou vide`, e);
    return [];
  }
}

function aggregateDaily(records){
  const byDate = new Map();
  for(const r of records){
    if(!byDate.has(r.date)) byDate.set(r.date, { date:r.date, temps:[], total:0, admin:0, prod:0, n:0 });
    const d = byDate.get(r.date);
    d.temps.push(r.t);
    d.total += (r.total||0);
    d.admin += (r.admin||0);
    d.prod  += (r.prod||0);
    d.n++;
  }
  const out = [];
  for(const d of byDate.values()){
    const tAvg = d.temps.reduce((a,b)=>a+b,0)/d.temps.length;
    const hdd = Math.max(0, BASE_HEAT - tAvg);
    const cdd = Math.max(0, tAvg - BASE_COOL);
    out.push({
      date:d.date, tAvg, tMin:Math.min(...d.temps), tMax:Math.max(...d.temps),
      total:d.total, admin:d.admin, prod:d.prod, hdd, cdd, hours:d.n
    });
  }
  out.sort((a,b)=> a.date.localeCompare(b.date));
  return out;
}

async function init(){
  state.raw[2025] = await loadYear(2025);
  state.raw[2026] = await loadYear(2026);
  state.daily[2025] = aggregateDaily(state.raw[2025]);
  state.daily[2026] = aggregateDaily(state.raw[2026]);
  restorePendingBatch();
  buildMonthPills();
  bindNav();
  bindFilters();
  bindEntryForm();
  renderAll();
}

/* ---------------- filtering helpers ---------------- */
function filteredDaily(year, month){
  const arr = state.daily[year] || [];
  if(month === 'all') return arr;
  const mm = String(month).padStart(2,'0');
  return arr.filter(d => d.date.slice(5,7) === mm);
}

function sumKpis(dailyArr){
  let total=0, admin=0, prod=0, hdd=0, cdd=0, tSum=0, heatKwh=0, coolKwh=0;
  for(const d of dailyArr){
    total += d.total; admin += d.admin; prod += d.prod;
    hdd += d.hdd; cdd += d.cdd; tSum += d.tAvg;
    if(d.hdd > 0) heatKwh += d.total;
    if(d.cdd > 0) coolKwh += d.total;
  }
  const n = dailyArr.length || 1;
  return {
    total, admin, prod, hdd, cdd,
    tAvg: tSum/n,
    kwhPerHdd: hdd>0 ? heatKwh/hdd : 0,
    kwhPerCdd: cdd>0 ? coolKwh/cdd : 0,
    days: dailyArr.length
  };
}

/* ---------------- KPI cards ---------------- */
function gaugeSvg(pct, color){
  const p = Math.max(0, Math.min(1, pct));
  const r = 16, c = 2*Math.PI*r, off = c*(1-p);
  return `<svg viewBox="0 0 40 40" class="kpi__gauge">
    <circle cx="20" cy="20" r="${r}" fill="none" stroke="var(--border)" stroke-width="4"/>
    <circle cx="20" cy="20" r="${r}" fill="none" stroke="${color}" stroke-width="4"
      stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}"
      transform="rotate(-90 20 20)"/>
  </svg>`;
}

function fmt(n, d=0){ return Number(n).toLocaleString('fr-FR', {maximumFractionDigits:d, minimumFractionDigits:d}); }

function renderKpis(){
  const d = filteredDaily(state.filter.year, state.filter.month);
  const k = sumKpis(d);
  const maxDaily = Math.max(1, ...d.map(x=>x.total));
  const avgDaily = k.days ? k.total/k.days : 0;

  const cards = [
    { label:'Consommation totale', value:fmt(k.total), unit:'kWh', color:'var(--cool)', pct: 0.7 },
    { label:'Température moy.', value:fmt(k.tAvg,1), unit:'°C', color:'var(--warm)', pct: Math.min(1,Math.max(0,(k.tAvg)/40)) },
    { label:'HDD cumulés (base 20°C)', value:fmt(k.hdd,1), unit:'DJC', color:'var(--warm)', pct: Math.min(1,k.hdd/300) },
    { label:'CDD cumulés (base 25°C)', value:fmt(k.cdd,1), unit:'DJF', color:'var(--cool)', pct: Math.min(1,k.cdd/300) },
    { label:'kWh / HDD', value: k.hdd>0? fmt(k.kwhPerHdd,1): '—', unit:'kWh/DJC', color:'var(--warm)', pct: Math.min(1,k.kwhPerHdd/2000) },
    { label:'kWh / CDD', value: k.cdd>0? fmt(k.kwhPerCdd,1): '—', unit:'kWh/DJF', color:'var(--cool)', pct: Math.min(1,k.kwhPerCdd/2000) },
  ];
  document.getElementById('kpiRow').innerHTML = cards.map(c => `
    <div class="kpi">
      <div class="kpi__eyebrow">${c.label}</div>
      <div class="kpi__row">
        <div><span class="kpi__value">${c.value}</span><span class="kpi__unit">${c.unit}</span></div>
        ${gaugeSvg(c.pct, c.color)}
      </div>
    </div>`).join('');
}

/* ---------------- charts ---------------- */
function chartDefaults(){
  Chart.defaults.color = '#7C8798';
  Chart.defaults.font.family = "'IBM Plex Mono', monospace";
  Chart.defaults.font.size = 11;
  Chart.defaults.borderColor = '#1A222E';
}

function upsertChart(key, canvasId, config){
  if(state.charts[key]) state.charts[key].destroy();
  const ctx = document.getElementById(canvasId).getContext('2d');
  state.charts[key] = new Chart(ctx, config);
}

function renderMainChart(){
  const month = state.filter.month;
  const year = state.filter.year;
  let labels, temp, cons;
  if(month === 'all'){
    const d = filteredDaily(year, 'all');
    labels = d.map(x=>x.date.slice(5));
    temp = d.map(x=>Number(x.tAvg.toFixed(1)));
    cons = d.map(x=>Number(x.total.toFixed(0)));
  } else {
    const mm = String(month).padStart(2,'0');
    const recs = state.raw[year].filter(r=>r.date.slice(5,7)===mm)
      .sort((a,b)=> a.date===b.date ? a.h-b.h : a.date.localeCompare(b.date));
    labels = recs.map(r=>`${r.date.slice(8,10)}/${r.h}h`);
    temp = recs.map(r=>r.t);
    cons = recs.map(r=>r.total);
  }
  upsertChart('main','mainChart',{
    type:'line',
    data:{ labels, datasets:[
      { label:'HVAC Total (kWh)', data:cons, borderColor:'#4FD8E8', backgroundColor:'rgba(79,216,232,0.08)',
        yAxisID:'y', tension:0.25, pointRadius:0, borderWidth:1.6, fill:true },
      { label:'Température (°C)', data:temp, borderColor:'#F5A623', yAxisID:'y1',
        tension:0.25, pointRadius:0, borderWidth:1.6 }
    ]},
    options:{
      responsive:true, maintainAspectRatio:false,
      interaction:{ mode:'index', intersect:false },
      plugins:{ legend:{ labels:{ boxWidth:10, boxHeight:10 } } },
      scales:{
        x:{ ticks:{ maxTicksLimit:14 }, grid:{ display:false } },
        y:{ position:'left', title:{ display:true, text:'kWh' }, grid:{ color:'#161E2B' } },
        y1:{ position:'right', title:{ display:true, text:'°C' }, grid:{ display:false } }
      }
    }
  });
}

function renderComparisonChart(){
  const months = MONTH_NAMES.map((_, i)=>{
    const d25 = filteredDaily(2025, i+1);
    const d26 = filteredDaily(2026, i+1);
    return { m:MONTH_NAMES[i], v25: sumKpis(d25).total, v26: d26.length? sumKpis(d26).total : null };
  });
  upsertChart('cmp','cmpChart',{
    type:'bar',
    data:{ labels: months.map(m=>m.m), datasets:[
      { label:'2025', data:months.map(m=>Math.round(m.v25)), backgroundColor:'#A78BFA' },
      { label:'2026', data:months.map(m=>m.v26!==null?Math.round(m.v26):null), backgroundColor:'#4FD8E8' }
    ]},
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ labels:{ boxWidth:10, boxHeight:10 } } },
      scales:{ x:{ grid:{ display:false } }, y:{ title:{ display:true, text:'kWh' }, grid:{ color:'#161E2B' } } }
    }
  });

  const zoneMonths = MONTH_NAMES.map((_,i)=>{
    const d25 = filteredDaily(2025,i+1); const d26 = filteredDaily(2026,i+1);
    const k25 = sumKpis(d25); const k26 = sumKpis(d26);
    return { admin: k25.admin + (k26.days?k26.admin:0), prod: k25.prod + (k26.days?k26.prod:0) };
  });
  upsertChart('zone','zoneChart',{
    type:'bar',
    data:{ labels: MONTH_NAMES, datasets:[
      { label:'Administration', data: zoneMonths.map(z=>Math.round(z.admin)), backgroundColor:'#A78BFA', stack:'z' },
      { label:'Prod + entrepôt', data: zoneMonths.map(z=>Math.round(z.prod)), backgroundColor:'#4FD8E8', stack:'z' }
    ]},
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ labels:{ boxWidth:10, boxHeight:10 } } },
      scales:{ x:{ stacked:true, grid:{ display:false } }, y:{ stacked:true, title:{ display:true, text:'kWh' }, grid:{ color:'#161E2B' } } }
    }
  });
}

function renderSplitChart(){
  const d = filteredDaily(state.filter.year, state.filter.month);
  const k = sumKpis(d);
  upsertChart('split','splitChart',{
    type:'doughnut',
    data:{ labels:['Administration','Prod + entrepôt'], datasets:[{
      data:[Math.round(k.admin), Math.round(k.prod)],
      backgroundColor:['#A78BFA','#4FD8E8'], borderColor:'#121822', borderWidth:3
    }]},
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ position:'bottom', labels:{ boxWidth:10, boxHeight:10 } } },
      cutout:'68%'
    }
  });

  const rows = d.map(x=>`<tr>
      <td>${x.date}</td><td>${fmt(x.tAvg,1)}</td><td>${fmt(x.hdd,1)}</td><td>${fmt(x.cdd,1)}</td>
      <td>${fmt(x.total,0)}</td><td>${fmt(x.admin,0)}</td><td>${fmt(x.prod,0)}</td>
    </tr>`).join('');
  document.getElementById('dailyTableBody').innerHTML = rows || `<tr><td colspan="7" style="text-align:center;color:var(--text-faint)">Aucune donnée pour ce filtre</td></tr>`;
}

function renderAll(){
  renderKpis();
  renderMainChart();
  renderComparisonChart();
  renderSplitChart();
  renderEntryTable();
}

/* ---------------- nav / filters ---------------- */
function bindNav(){
  document.querySelectorAll('.tab').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.view).classList.add('active');
    });
  });
}

function buildMonthPills(){
  const wrap = document.getElementById('monthPills');
  const all = [`<button class="pill active" data-m="all">Tous</button>`]
    .concat(MONTH_NAMES.map((m,i)=>`<button class="pill" data-m="${i+1}">${m}</button>`));
  wrap.innerHTML = all.join('');
}

function bindFilters(){
  document.querySelectorAll('#yearPills .pill').forEach(p=>{
    p.addEventListener('click', ()=>{
      document.querySelectorAll('#yearPills .pill').forEach(x=>x.classList.remove('active'));
      p.classList.add('active');
      state.filter.year = Number(p.dataset.y);
      renderKpis(); renderMainChart(); renderSplitChart();
    });
  });
  document.getElementById('monthPills').addEventListener('click', (e)=>{
    const p = e.target.closest('.pill'); if(!p) return;
    document.querySelectorAll('#monthPills .pill').forEach(x=>x.classList.remove('active'));
    p.classList.add('active');
    state.filter.month = p.dataset.m === 'all' ? 'all' : Number(p.dataset.m);
    renderKpis(); renderMainChart(); renderSplitChart();
  });
}

/* ================================================================
   SAISIE — GitHub API integration
   ================================================================ */
const GH_KEYS = { owner:'gh_owner', repo:'gh_repo', branch:'gh_branch', path:'gh_path', token:'gh_token' };

function ghConfig(){
  return {
    owner:  localStorage.getItem(GH_KEYS.owner)  || '',
    repo:   localStorage.getItem(GH_KEYS.repo)   || '',
    branch: localStorage.getItem(GH_KEYS.branch) || 'main',
    path:   localStorage.getItem(GH_KEYS.path)   || 'data/2026.json',
    token:  localStorage.getItem(GH_KEYS.token)  || ''
  };
}
function saveGhConfig(cfg){
  localStorage.setItem(GH_KEYS.owner, cfg.owner);
  localStorage.setItem(GH_KEYS.repo, cfg.repo);
  localStorage.setItem(GH_KEYS.branch, cfg.branch);
  localStorage.setItem(GH_KEYS.path, cfg.path);
  if(cfg.token) localStorage.setItem(GH_KEYS.token, cfg.token);
}

// UTF-8 safe base64 helpers (chunked to survive large files)
function b64Encode(str){
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  const chunk = 0x8000;
  for(let i=0;i<bytes.length;i+=chunk){
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i+chunk));
  }
  return btoa(binary);
}
function b64Decode(b64){
  const binary = atob(b64.replace(/\n/g,''));
  const bytes = new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function ghGetFile(cfg){
  const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${cfg.path}?ref=${cfg.branch}`;
  const res = await fetch(url, { headers:{ 'Authorization':`token ${cfg.token}`, 'Accept':'application/vnd.github+json' }});
  if(res.status === 404) return { sha:null, data:[] };
  if(!res.ok) throw new Error(`Lecture GitHub échouée (${res.status})`);
  const json = await res.json();
  const data = JSON.parse(b64Decode(json.content));
  return { sha: json.sha, data };
}

async function ghPutFile(cfg, data, sha, message){
  const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${cfg.path}`;
  const body = {
    message,
    content: b64Encode(JSON.stringify(data)),
    branch: cfg.branch
  };
  if(sha) body.sha = sha;
  const res = await fetch(url, {
    method:'PUT',
    headers:{ 'Authorization':`token ${cfg.token}`, 'Accept':'application/vnd.github+json', 'Content-Type':'application/json' },
    body: JSON.stringify(body)
  });
  if(!res.ok){
    const err = await res.json().catch(()=>({}));
    throw new Error(err.message || `Écriture GitHub échouée (${res.status})`);
  }
  return res.json();
}

function toast(msg, isErr=false){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.toggle('err', isErr);
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(()=> t.classList.remove('show'), 5000);
}

function restorePendingBatch(){
  try{
    state.pendingBatch = JSON.parse(localStorage.getItem('pending_batch') || '[]');
  }catch(e){ state.pendingBatch = []; }
}
function persistPendingBatch(){
  localStorage.setItem('pending_batch', JSON.stringify(state.pendingBatch));
}

function buildEntryGrid(){
  const wrap = document.getElementById('entryGrid');
  let html = `<div class="entry-grid" style="margin-bottom:6px;">
    <div class="entry-head">Heure</div><div class="entry-head">Temp. [°C]</div>
    <div class="entry-head">HVAC Total [kWh]</div><div class="entry-head">Admin [kWh]</div>
    <div class="entry-head">Prod + entrepôt [kWh]</div></div>`;
  for(let h=0; h<24; h++){
    html += `<div class="entry-grid" style="margin-bottom:4px;">
      <div class="h">${String(h).padStart(2,'0')}h</div>
      <input type="number" step="0.1" data-h="${h}" data-f="t" placeholder="°C">
      <input type="number" step="0.01" data-h="${h}" data-f="total" placeholder="kWh">
      <input type="number" step="0.01" data-h="${h}" data-f="admin" placeholder="kWh">
      <input type="number" step="0.01" data-h="${h}" data-f="prod" placeholder="kWh">
    </div>`;
  }
  wrap.innerHTML = html;
}

function bindEntryForm(){
  buildEntryGrid();
  const cfg = ghConfig();
  document.getElementById('ghOwner').value = cfg.owner;
  document.getElementById('ghRepo').value = cfg.repo;
  document.getElementById('ghBranch').value = cfg.branch;
  document.getElementById('ghPath').value = cfg.path;
  document.getElementById('ghToken').value = cfg.token;

  document.getElementById('saveGhConfig').addEventListener('click', ()=>{
    const newCfg = {
      owner: document.getElementById('ghOwner').value.trim(),
      repo: document.getElementById('ghRepo').value.trim(),
      branch: document.getElementById('ghBranch').value.trim() || 'main',
      path: document.getElementById('ghPath').value.trim() || 'data/2026.json',
      token: document.getElementById('ghToken').value.trim()
    };
    saveGhConfig(newCfg);
    toast('Configuration GitHub enregistrée dans ce navigateur.');
  });

  document.getElementById('addToBatch').addEventListener('click', ()=>{
    const date = document.getElementById('entryDate').value;
    if(!date){ toast('Choisis une date.', true); return; }
    const inputs = document.querySelectorAll('#entryGrid input');
    const byHour = {};
    inputs.forEach(inp=>{
      const h = Number(inp.dataset.h);
      byHour[h] = byHour[h] || {};
      byHour[h][inp.dataset.f] = inp.value === '' ? null : Number(inp.value);
    });
    const rows = [];
    for(let h=0; h<24; h++){
      const r = byHour[h];
      if(r.t==null || r.total==null){ continue; } // ignore incomplete hours
      rows.push({ date, h, t:r.t, total:r.total, admin:r.admin, prod:r.prod });
    }
    if(rows.length === 0){ toast('Renseigne au moins une heure complète (temp. + total).', true); return; }
    // remove any earlier pending rows for this same date, then add the fresh set
    state.pendingBatch = state.pendingBatch.filter(r=>r.date !== date).concat(rows);
    persistPendingBatch();
    renderEntryTable();
    toast(`${rows.length} heure(s) ajoutée(s) à la file pour le ${date}.`);
  });

  document.getElementById('clearBatch').addEventListener('click', ()=>{
    state.pendingBatch = [];
    persistPendingBatch();
    renderEntryTable();
  });

  document.getElementById('publishBatch').addEventListener('click', publishBatch);
}

function renderEntryTable(){
  const body = document.getElementById('batchTableBody');
  const dates = [...new Set(state.pendingBatch.map(r=>r.date))].sort();
  if(dates.length === 0){
    body.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-faint)">Aucune donnée en attente</td></tr>`;
    document.getElementById('publishBatch').disabled = true;
    return;
  }
  document.getElementById('publishBatch').disabled = false;
  body.innerHTML = dates.map(d=>{
    const rows = state.pendingBatch.filter(r=>r.date===d);
    const total = rows.reduce((a,r)=>a+(r.total||0),0);
    return `<tr><td>${d}</td><td>${rows.length}</td><td>${fmt(total,0)}</td>
      <td><button class="btn secondary" data-date="${d}" style="padding:4px 10px;font-size:11px;">Retirer</button></td></tr>`;
  }).join('');
  body.querySelectorAll('button[data-date]').forEach(b=>{
    b.addEventListener('click', ()=>{
      state.pendingBatch = state.pendingBatch.filter(r=>r.date !== b.dataset.date);
      persistPendingBatch();
      renderEntryTable();
    });
  });
}

async function publishBatch(){
  const cfg = ghConfig();
  if(!cfg.owner || !cfg.repo || !cfg.token){
    toast('Renseigne le dépôt et le token GitHub avant de publier.', true);
    return;
  }
  const btn = document.getElementById('publishBatch');
  btn.disabled = true; btn.textContent = 'Publication...';
  try{
    const { sha, data } = await ghGetFile(cfg);
    const pendingDates = new Set(state.pendingBatch.map(r=>r.date));
    const merged = data.filter(r=>!pendingDates.has(r.date)).concat(state.pendingBatch);
    merged.sort((a,b)=> a.date===b.date ? a.h-b.h : a.date.localeCompare(b.date));
    const dateList = [...pendingDates].join(', ');
    await ghPutFile(cfg, merged, sha, `Ajout données HVAC — ${dateList}`);
    // refresh local state immediately so charts update without waiting for the Pages rebuild
    const year = cfg.path.match(/(\d{4})/);
    if(year && state.raw[year[1]] !== undefined){
      state.raw[year[1]] = merged;
      state.daily[year[1]] = aggregateDaily(merged);
    }
    state.pendingBatch = [];
    persistPendingBatch();
    renderEntryTable();
    renderAll();
    toast(`Publié sur GitHub (${dateList}). Le site public se mettra à jour après le redéploiement des Pages.`);
  }catch(e){
    console.error(e);
    toast(e.message || 'Échec de la publication.', true);
  }finally{
    btn.disabled = false; btn.textContent = 'Publier sur GitHub';
  }
}

/* ---------------- boot ---------------- */
document.addEventListener('DOMContentLoaded', ()=>{
  chartDefaults();
  init();
});
