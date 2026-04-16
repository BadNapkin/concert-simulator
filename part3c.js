
// ═══════════════════════════════════════════════
// GAME STATE
// ═══════════════════════════════════════════════
let G = {};

function initGame() {
  G = {
    week: 1,
    cash: 800,
    venueTier: 0,
    bookedBand: null,
    supportBand: null,
    history: [],
    contacts: {},
    alerts: [],
    messages: [],
    bands: JSON.parse(JSON.stringify(BANDS)),
    sfxOwned: { basic: true },
    sfxActive: { basic: true },
    achievements: JSON.parse(JSON.stringify(ACHIEVEMENTS)),
    showsWithoutRevenue: 0,
    totalActsBroken: 0,
    repTags: [],  // unlocked niche reps e.g. 'Shoegaze Sanctuary'
    staffCostBonus: 0,
  };
  addAlert('Welcome to The Dive Bar. Week 1. You have £800, a sticky floor, and a dream. Check BandBook to find your first act.', false);
  addMessage('Derek @ The Monarch', "Heard you just took over The Dive Bar. Good luck with that. We just confirmed The Morrigan for New Year's. Exciting times. 🥂");
}

function saveGame() {
  try { localStorage.setItem('concertsim_save', JSON.stringify(G)); } catch(e) {}
}

function loadGame() {
  try {
    const saved = localStorage.getItem('concertsim_save');
    if (!saved) return false;
    G = JSON.parse(saved);
    return true;
  } catch(e) { return false; }
}

function hasSave() {
  try { return !!localStorage.getItem('concertsim_save'); } catch(e) { return false; }
}

// ═══════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════
function venueInfo() { return VENUE_TIERS[G.venueTier]; }
function fameLabel(f) { return ['Unknown','Local Buzz','Regional Act','National Touring','Headliner','Superstar'][f]||'Unknown'; }
function tierLabel(t) { return ['Cold Call','Familiar','Preferred Venue','Scene Partners','Legendary Partners'][t]||'Cold Call'; }

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function switchPanel(id, el) {
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('panel-'+id).classList.add('active');
  if (el) el.classList.add('active');
  if (id==='office')        renderOffice();
  if (id==='bandbook')      renderBandBook();
  if (id==='sfx')           renderSFX();
  if (id==='achievements')  renderAchievements();
  if (id==='contacts')      renderContacts();
  if (id==='alerts')        renderAlerts();
}

function switchTab(id, el) {
  document.querySelectorAll('#panel-bandbook .tab-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(p=>p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('tab-'+id).classList.add('active');
  if (id==='contacted') renderContacted();
  if (id==='messages')  renderMessages();
}

function updateStatusBar() {
  const v = venueInfo();
  document.getElementById('sb-week').textContent = G.week;
  document.getElementById('sb-venue').textContent = v.name+' (cap.'+v.capacity+')';
  document.getElementById('sb-cash').textContent = '£'+G.cash;
  document.getElementById('sb-booked').textContent = G.bookedBand ? G.bookedBand.name : '—';
  const activeSFX = Object.keys(G.sfxActive).filter(k=>G.sfxActive[k]);
  document.getElementById('sb-sfx').textContent = activeSFX.map(k=>SFX_GEAR[k].icon).join(' ')||'None';
  document.getElementById('office-venue-name').textContent = v.name;
}

function addMessage(from, text) { G.messages.push({from, text, date:`Week ${G.week}`}); }
function addAlert(text, urgent=false) { G.alerts.unshift({text, date:`Week ${G.week}`, urgent}); }

// ═══════════════════════════════════════════════
// ACHIEVEMENT SYSTEM
// ═══════════════════════════════════════════════
function unlockAchievement(id) {
  const ach = G.achievements.find(a=>a.id===id);
  if (!ach || ach.unlocked) return false;
  ach.unlocked = true;
  ach.week = G.week;
  // Apply reward effects
  if (id==='first_show')   G.cash += 50;
  if (id==='five_shows')   G.staffCostBonus = -10;
  showAchToast(`🏆 Achievement: ${ach.name} — ${ach.reward}`);
  addAlert(`🏆 Achievement unlocked: "${ach.name}" — ${ach.reward}`, false);
  return true;
}

function checkAchievements(band, score, attendance) {
  const v = venueInfo();
  if (G.history.length === 1) unlockAchievement('first_show');
  if (attendance >= v.capacity) unlockAchievement('sold_out');
  if (G.totalActsBroken >= 1) unlockAchievement('broke_act');
  if (G.history.length >= 5) unlockAchievement('five_shows');
  if (Object.values(G.contacts).some(c=>c.tier>=4)) unlockAchievement('legendary');
  if (G.venueTier >= 1) unlockAchievement('upgrade1');
  // SFX combos
  const active = Object.keys(G.sfxActive).filter(k=>G.sfxActive[k]);
  if (active.includes('pyro') && band.genreKey==='punk') unlockAchievement('pyro_punk');
  if (active.includes('smoke') && (band.genre==='Shoegaze'||band.traits.includes('Smoke Lovers'))) unlockAchievement('smoke_gaze');
  if (active.includes('uv') && band.traits.includes('Face Paint')) unlockAchievement('uv_paint');
  if (active.includes('laser') && band.genreKey==='electronic') unlockAchievement('laser_rave');
  if (active.includes('basic') && active.length===1 && band.traits.includes('Acoustic Purists')) unlockAchievement('acoustic_pure');
}

function showAchToast(msg) {
  const t = document.getElementById('ach-toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 4000);
}

// ═══════════════════════════════════════════════
// RENDER BANDBOOK
// ═══════════════════════════════════════════════
function renderBandBook() {
  const grid = document.getElementById('band-grid');
  grid.innerHTML = '';
  const v = venueInfo();
  G.bands.forEach(band => {
    if (band.fame > v.capacity/100 + 1 && !G.achievements.find(a=>a.id==='broke_act')?.unlocked) return; // fame gate
    const isBooked  = G.bookedBand  && G.bookedBand.id  === band.id;
    const isSupport = G.supportBand && G.supportBand.id === band.id;
    const card = document.createElement('div');
    card.className = 'band-card fade-in'+(isBooked||isSupport?' booked':'');
    const tier = G.contacts[band.id]?.tier||0;
    card.innerHTML = `
      <div class="band-name">${band.name}</div>
      <div class="band-genre">${band.genre} · ${fameLabel(band.fame)}</div>
      <div class="band-bio">${band.bio}</div>
      <div class="band-traits">${band.traits.map(t=>`<span class="trait-tag">${t}</span>`).join('')}</div>
      <div class="band-agent">${band.agent} · Fee: ${band.fee}</div>
      ${tier>0?`<div class="band-agent" style="color:#407060">Relationship: ${tierLabel(tier)}</div>`:''}
      <button class="book-btn" ${isBooked?'disabled':''} onclick="bookBand('${band.id}','headline')">
        ${isBooked?'✓ Booked (Headline)':isSupport?'Booked as Support':'Book as Headliner'}
      </button>
      <button class="book-btn" style="margin-top:0.3rem;font-size:0.65rem;opacity:0.7" ${isSupport||band.fame>1?'disabled':''} onclick="bookBand('${band.id}','support')">
        ${isSupport?'✓ Booked (Support)':band.fame>1?'Too big for support':'Add as Support Act'}
      </button>`;
    grid.appendChild(card);
  });
}

function bookBand(bandId, slot) {
  const band = G.bands.find(b=>b.id===bandId);
  if (!band) return;
  if (slot==='headline') {
    if (G.cash < band.feeVal) {
      addAlert(`Can't afford ${band.name} — fee is £${band.feeVal}, you have £${G.cash}.`, true);
      switchPanel('alerts', document.querySelector('[data-panel="alerts"]'));
      return;
    }
    G.bookedBand = band;
  } else {
    G.supportBand = band;
  }
  addMessage(band.agent, `Re: ${band.name} — ${slot==='headline'?'Headline':'Support'} slot confirmed for Week ${G.week+1}. Fee of £${band.feeVal} due on the night. Looking forward to it.`);
  updateStatusBar();
  renderBandBook();
  switchPanel('office', document.querySelector('[data-panel="office"]'));
}

function renderContacted() {
  const el = document.getElementById('contacted-list');
  el.innerHTML = '';
  const list = [];
  if (G.bookedBand)  list.push({band:G.bookedBand, slot:'Headline'});
  if (G.supportBand) list.push({band:G.supportBand, slot:'Support'});
  if (!list.length) { el.innerHTML='<p style="color:#4a3060;font-size:0.8rem;padding:1rem">No bookings confirmed yet.</p>'; return; }
  list.forEach(({band,slot})=>{
    const d=document.createElement('div'); d.className='contact-entry fade-in';
    d.innerHTML=`<div class="contact-name">${band.name} <span style="font-size:0.7rem;color:#507050">${slot}</span></div>
    <div class="contact-meta">${band.genre} · Fee: £${band.feeVal}</div>
    <div class="contact-history">${band.bio}</div>`;
    el.appendChild(d);
  });
}

function renderMessages() {
  const el = document.getElementById('messages-list');
  el.innerHTML = '';
  if (!G.messages.length) { el.innerHTML='<p style="color:#4a3060;font-size:0.8rem;padding:1rem">No messages yet.</p>'; return; }
  [...G.messages].reverse().forEach(m=>{
    const d=document.createElement('div'); d.className='contact-entry fade-in';
    d.innerHTML=`<div class="contact-name">${m.from}</div>
    <div class="contact-meta">${m.date||''}</div>
    <div class="contact-history">"${m.text}"</div>`;
    el.appendChild(d);
  });
}

// ═══════════════════════════════════════════════
// RENDER SFX PANEL
// ═══════════════════════════════════════════════
function renderSFX() {
  const el = document.getElementById('sfx-grid');
  el.innerHTML = '';
  Object.values(SFX_GEAR).forEach(gear => {
    const owned   = !!G.sfxOwned[gear.id];
    const active  = !!G.sfxActive[gear.id];
    const canAfford = G.cash >= gear.cost;
    const card = document.createElement('div');
    card.className = 'sfx-card'+(owned?' owned':'')+(active?' active-sfx':'');
    const synStr = gear.synergies.length ? `✓ Works with: ${gear.synergies.join(', ')}` : '';
    const penStr = gear.penalties.length ? `✗ Clashes with: ${gear.penalties.join(', ')}` : '';
    card.innerHTML = `
      <div class="sfx-icon">${gear.icon}</div>
      <div class="sfx-name">${gear.name}</div>
      <div class="sfx-desc">${gear.desc}</div>
      ${synStr?`<div class="sfx-synergy">${synStr}</div>`:''}
      ${penStr?`<div class="sfx-penalty">${penStr}</div>`:''}
      <div class="sfx-cost">${owned ? (gear.cost===0?'Free':'Owned — £'+gear.nightly+'/show') : '£'+gear.cost+' to buy · £'+gear.nightly+'/show'}</div>
      <div class="sfx-actions">
        ${owned
          ? `<button class="sfx-btn ${active?'toggle-on':''}" onclick="toggleSFX('${gear.id}')">${active?'✓ Active — Deactivate':'Activate for show'}</button>`
          : `<button class="sfx-btn" ${!canAfford?'disabled':''} onclick="buySFX('${gear.id}')">${canAfford?'Buy — £'+gear.cost:'Need £'+gear.cost}</button>`
        }
      </div>`;
    el.appendChild(card);
  });
}

function buySFX(id) {
  const gear = SFX_GEAR[id];
  if (!gear || G.sfxOwned[id]) return;
  if (G.cash < gear.cost) { addAlert(`Can't afford ${gear.name}. Need £${gear.cost}.`, true); return; }
  G.cash -= gear.cost;
  G.sfxOwned[id] = true;
  addAlert(`${gear.icon} ${gear.name} installed. Toggle it on before your next show.`, false);
  updateStatusBar();
  renderSFX();
  saveGame();
}

function toggleSFX(id) {
  if (!G.sfxOwned[id]) return;
  G.sfxActive[id] = !G.sfxActive[id];
  // Deactivate basic if something else is activated
  if (id !== 'basic' && G.sfxActive[id]) G.sfxActive['basic'] = false;
  if (id === 'basic' && G.sfxActive['basic']) {
    Object.keys(G.sfxActive).forEach(k => { if (k!=='basic') G.sfxActive[k]=false; });
  }
  updateStatusBar();
  renderSFX();
  saveGame();
}

// ═══════════════════════════════════════════════
// RENDER ACHIEVEMENTS
// ═══════════════════════════════════════════════
function renderAchievements() {
  const el = document.getElementById('ach-grid');
  el.innerHTML = '';
  G.achievements.forEach(ach => {
    const card = document.createElement('div');
    card.className = 'ach-card'+(ach.unlocked?' unlocked ach-pop':'');
    card.innerHTML = `
      <div class="ach-icon">${ach.icon}</div>
      <div class="ach-name">${ach.name}</div>
      <div class="ach-desc">${ach.desc}</div>
      <div class="ach-reward">${ach.reward}</div>
      ${ach.unlocked?`<div class="ach-unlocked-date">Unlocked Week ${ach.week}</div>`:''}`;
    el.appendChild(card);
  });
}

// ═══════════════════════════════════════════════
// RENDER OFFICE
// ═══════════════════════════════════════════════
function renderOffice() {
  const grid = document.getElementById('office-grid');
  const v = venueInfo();
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const scheduleHTML = days.map(d=>{
    const act = d==='Saturday' && G.bookedBand ? G.bookedBand.name : '';
    const sup = d==='Saturday' && G.supportBand ? `<br><span style="font-size:0.68rem;color:#507050">+ ${G.supportBand.name} (support)</span>` : '';
    return `<div class="schedule-slot">
      <span class="slot-day">${d}</span>
      <span class="${act?'slot-act':'slot-empty'}">${act||'—'}${sup}</span>
    </div>`;
  }).join('');

  const recent = G.history.slice(-3).reverse();
  const finRows = recent.length ? recent.map(h=>
    `<div class="finances-row"><span class="fin-label">${h.band} (Wk ${h.week})</span>
     <span class="fin-value ${h.revenue>0?'positive':'negative'}">${h.revenue>=0?'+':''}£${h.revenue}</span></div>`
  ).join('') : '<div class="finances-row"><span class="fin-label">No shows yet</span><span class="fin-value">—</span></div>';

  const lastNotifs = G.alerts.slice(0,3).map(a=>
    `<div class="notif ${a.urgent?'rival':''}">${a.text}</div>`
  ).join('') || '<div class="notif">All quiet.</div>';

  const canPlay = !!G.bookedBand;
  const activeSFX = Object.keys(G.sfxActive).filter(k=>G.sfxActive[k]);
  const sfxSummary = activeSFX.map(k=>SFX_GEAR[k].icon+' '+SFX_GEAR[k].name).join(', ')||'None';

  // Venue upgrade row
  const nextTier = VENUE_TIERS[G.venueTier+1];
  const upgradeHTML = nextTier ? `
    <div class="upgrade-row">
      <span class="upgrade-cost">${nextTier.upgradeLabel}</span>
      <button class="upgrade-btn" ${G.cash>=nextTier.upgradeCost?'':'disabled'} onclick="upgradeVenue()">
        Upgrade → ${nextTier.name}
      </button>
    </div>` : `<div style="font-size:0.75rem;color:#507050;margin-top:0.8rem">Maximum capacity reached. Legend.</div>`;

  grid.innerHTML = `
    <div class="office-card"><h3>This Week's Schedule</h3>${scheduleHTML}</div>
    <div class="office-card"><h3>Recent P&L</h3>${finRows}
      <div class="finances-row" style="margin-top:0.8rem;padding-top:0.8rem;border-top:1px solid #1e1e30">
        <span class="fin-label">Current Cash</span>
        <span class="fin-value positive">£${G.cash}</span>
      </div>
    </div>
    <div class="venue-card" style="grid-column:1/-1">
      <h3 style="font-size:0.68rem;letter-spacing:0.2em;text-transform:uppercase;color:#6050a0;margin-bottom:0.8rem">Venue</h3>
      <div class="venue-tier-name">${v.name}</div>
      <div class="venue-tier-cap">Capacity: ${v.capacity} · SFX Active: ${sfxSummary}</div>
      ${upgradeHTML}
    </div>
    <div class="office-card" style="grid-column:1/-1"><h3>Notifications</h3>
      <div class="notifications-list">${lastNotifs}</div>
    </div>
    <button class="do-show-btn" ${canPlay?'':'disabled'} onclick="runShow()">
      ${canPlay?`▶  Run Show — ${G.bookedBand.name} · Saturday Night · SFX: ${sfxSummary}`:'Book an act in BandBook to run a show'}
    </button>`;
}

function upgradeVenue() {
  const nextTier = VENUE_TIERS[G.venueTier+1];
  if (!nextTier || G.cash < nextTier.upgradeCost) return;
  G.cash -= nextTier.upgradeCost;
  G.venueTier++;
  const v = venueInfo();
  addAlert(`🏗️ Venue upgraded to "${v.name}" — capacity now ${v.capacity}. Bigger acts, bigger nights.`, false);
  unlockAchievement('upgrade1');
  updateStatusBar();
  renderOffice();
  saveGame();
}

function renderContacts() {
  const el = document.getElementById('contacts-list');
  el.innerHTML = '';
  const seen = Object.keys(G.contacts);
  if (!seen.length) { el.innerHTML='<p style="color:#4a3060;font-size:0.8rem;padding:1rem">No relationship history yet.</p>'; return; }
  seen.forEach(id=>{
    const c=G.contacts[id], band=G.bands.find(b=>b.id===id);
    if (!band) return;
    const d=document.createElement('div'); d.className='contact-entry fade-in';
    d.innerHTML=`<div class="contact-name">${band.name}
      <span class="relationship-tier tier-${c.tier}">${tierLabel(c.tier)}</span></div>
      <div class="contact-meta">${band.genre} · Gigs: ${c.gigs} · Fame: ${fameLabel(band.fame)}</div>
      <div class="contact-history">Best night: ${c.bestNight||'None yet'}${c.agentNote?`<br><em style="color:#5a4070">"${c.agentNote}"</em>`:''}</div>`;
    el.appendChild(d);
  });
}

function renderAlerts() {
  const el = document.getElementById('alerts-list');
  el.innerHTML = '';
  if (!G.alerts.length) { el.innerHTML='<p style="color:#4a3060;font-size:0.8rem;padding:1rem">No alerts.</p>'; return; }
  G.alerts.forEach(a=>{
    const d=document.createElement('div');
    d.className='alert-item'+(a.urgent?' urgent':'');
    d.innerHTML=`<div class="alert-date">${a.date}</div>${a.text}`;
    el.appendChild(d);
  });
}
