
// ── STATE ──────────────────────────────────────────────────────────────────
let G = {};
function freshState() {
  return {
    week: 1, dayOfWeek: 0, money: 500, rep: 0, fans: 0,
    venueTier: 0, capacity: 80, ticketPrice: 8,
    headliner: null, support: null,
    sfxOwned: [], sfxActive: [],
    achievements: [], contacts: [],
    enquiries: [],
    dailyNews: {},        // keyed by "week-day" → array of strings
    alerts: [],
    history: [],
    gameOver: false,
  };
}

// ── PERSISTENCE ────────────────────────────────────────────────────────────
function saveGame() {
  try { localStorage.setItem('concertSim_v3', JSON.stringify(G)); } catch(e){}
}
function loadGame() {
  try {
    const raw = localStorage.getItem('concertSim_v3');
    if (raw) { G = Object.assign(freshState(), JSON.parse(raw)); return true; }
  } catch(e){}
  return false;
}
function hasSave() {
  return !!localStorage.getItem('concertSim_v3');
}
function wipeSave() {
  localStorage.removeItem('concertSim_v3');
}

// ── SCREEN / PANEL ROUTING ─────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}
function switchPanel(id, btnEl) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById('panel-' + id);
  if (!panel) return;
  panel.classList.add('active');
  if (btnEl) btnEl.classList.add('active');
  if (id === 'office')       renderOffice();
  if (id === 'bandbook')     { renderBandCarousel(); switchTab('discover'); }
  if (id === 'sfx')          renderSFX();
  if (id === 'achievements') renderAchievements();
  if (id === 'contacts')     renderContacts();
  if (id === 'alerts')       renderAlerts();
}
function switchTab(tab) {
  document.querySelectorAll('.bb-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.bb-tab-content').forEach(c => c.classList.remove('active'));
  const tabBtn = document.querySelector(`.bb-tab[data-tab="${tab}"]`);
  if (tabBtn) tabBtn.classList.add('active');
  const tabContent = document.getElementById('tab-' + tab);
  if (tabContent) tabContent.classList.add('active');
  if (tab === 'enquiries') renderEnquiries();
  if (tab === 'messages')  renderMessages();
}

// ── STATUS BAR ─────────────────────────────────────────────────────────────
const DAY_NAMES = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
function updateStatusBar() {
  const v = VENUE_TIERS[G.venueTier];
  setText('sb-week',  `WK ${G.week}`);
  setText('sb-day',   DAY_NAMES[G.dayOfWeek]);
  setText('sb-venue', v ? v.name : '—');
  setText('sb-money', `£${G.money}`);
  setText('sb-rep',   `${G.rep} REP`);
  setText('sb-fans',  `${G.fans} FANS`);
}
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ── NEXT DAY ───────────────────────────────────────────────────────────────
function nextDay() {
  if (G.gameOver) return;
  G.dayOfWeek++;

  if (G.dayOfWeek === 5) {
    // Friday — show night prompt
    addAlert('🎸 Show night is TOMORROW (Saturday). Make sure your lineup is set!');
  }

  if (G.dayOfWeek === 6) {
    // Saturday — run show automatically if headliner booked
    if (G.headliner !== null) {
      runShow();
      return;
    } else {
      addAlert('📅 Saturday passed with no headliner booked. You lost the week.');
      endWeek();
      return;
    }
  }

  if (G.dayOfWeek > 6) {
    endWeek();
    return;
  }

  // Deliver enquiry replies
  G.enquiries.forEach(enq => {
    if (enq.status === 'pending' && G.dayOfWeek >= enq.replyDay) {
      enq.status = 'replied';
      const band = BANDS[enq.bandId];
      const tmpl = ENQUIRY_REPLIES[Math.floor(Math.random() * ENQUIRY_REPLIES.length)];
      const msg = tmpl.replace('{band}', band.name).replace('{fee}', enq.feeOffered);
      enq.replyText = msg;
      addAlert(`📬 Reply from ${band.name}'s agent: "${msg}"`);
    }
  });

  // Inject daily news
  injectDailyNews();

  saveGame();
  updateStatusBar();
  renderOffice();
}

function endWeek() {
  G.week++;
  G.dayOfWeek = 0;
  G.headliner = null;
  G.support = null;
  G.enquiries = G.enquiries.filter(e => e.status === 'confirmed');
  saveGame();
  updateStatusBar();
  renderOffice();
}

function injectDailyNews() {
  const key = `${G.week}-${G.dayOfWeek}`;
  if (G.dailyNews[key]) return; // already generated
  const news = [];

  // Rival venue news
  const allBandNames = BANDS.map(b => b.name);
  const rivalAct = allBandNames[Math.floor(Math.random() * allBandNames.length)];
  const rivalTmpl = RIVAL_NEWS[Math.floor(Math.random() * RIVAL_NEWS.length)];
  news.push(rivalTmpl.replace('{act}', rivalAct));

  // Band fame change
  const fameBand = BANDS[Math.floor(Math.random() * BANDS.length)];
  const fameTmpl = FAME_NEWS[Math.floor(Math.random() * FAME_NEWS.length)];
  news.push(fameTmpl.replace('{band}', fameBand.name));

  G.dailyNews[key] = news;
}

// ── ENQUIRY SYSTEM ─────────────────────────────────────────────────────────
function enquireBand(bandId) {
  const band = BANDS[bandId];
  const baseFee = band.fee;
  const replyDay = Math.min(G.dayOfWeek + 1 + Math.floor(Math.random() * 2), 4); // replies Mon-Thu
  G.enquiries.push({
    id: Date.now(),
    bandId,
    status: 'pending',
    replyDay,
    feeOffered: baseFee,
    replyText: '',
    negotiationStep: 0,
  });
  addAlert(`📨 Enquiry sent to ${band.name}'s agent. Expect a reply by ${DAY_NAMES[replyDay]}.`);
  saveGame();
  renderBandCarousel();
  switchTab('enquiries');
}

function renderEnquiries() {
  const el = document.getElementById('enquiries-list');
  if (!el) return;
  if (G.enquiries.length === 0) {
    el.innerHTML = '<p style="color:#6050a0;padding:1rem">No active enquiries. Discover bands and send an enquiry!</p>';
    return;
  }
  el.innerHTML = G.enquiries.map(enq => {
    const band = BANDS[enq.bandId];
    let statusLabel = '';
    let actions = '';
    if (enq.status === 'pending') {
      statusLabel = `<span class="enquiry-btn pending">Awaiting Reply (by ${DAY_NAMES[enq.replyDay]})</span>`;
    } else if (enq.status === 'replied') {
      statusLabel = `<span class="enquiry-btn replied">Reply Received</span>`;
      actions = `<div class="negotiation-box">
        <p class="msg-entry">${enq.replyText}</p>
        ${NEGOTIATION_OPTS.map((opt,i) =>
          `<button class="neg-choice" onclick="handleNegotiation(${enq.id},${i})">${opt.label}</button>`
        ).join('')}
      </div>`;
    } else if (enq.status === 'confirmed') {
      statusLabel = `<span class="enquiry-btn" style="background:#1a4a1a;color:#4caf50">✓ Confirmed — £${enq.feeOffered}</span>`;
    } else if (enq.status === 'declined') {
      statusLabel = `<span class="enquiry-btn" style="background:#3a1a1a;color:#cf6679">✗ Declined</span>`;
    }
    return `<div class="msg-entry">
      <strong style="color:#c9b8ff">${band.name}</strong>
      <span style="color:#6050a0;font-size:0.75rem;margin-left:0.5rem">${band.genre}</span>
      ${statusLabel}
      ${actions}
    </div>`;
  }).join('');
}

function handleNegotiation(enquiryId, choiceIndex) {
  const enq = G.enquiries.find(e => e.id === enquiryId);
  if (!enq || enq.status !== 'replied') return;
  const opt = NEGOTIATION_OPTS[choiceIndex];
  const band = BANDS[enq.bandId];

  if (opt.effect === 'standard') {
    enq.status = 'confirmed';
    G.headliner = enq.bandId;
    addAlert(`✅ ${band.name} confirmed as headliner at £${enq.feeOffered}.`);
  } else if (opt.effect === 'negotiate') {
    const reduced = Math.round(enq.feeOffered * 0.85);
    const success = Math.random() > 0.4;
    if (success) {
      enq.feeOffered = reduced;
      enq.status = 'confirmed';
      G.headliner = enq.bandId;
      addAlert(`✅ Negotiation worked! ${band.name} confirmed at £${reduced}.`);
    } else {
      enq.status = 'declined';
      addAlert(`❌ ${band.name}'s agent wasn't happy with the lowball. They passed.`);
    }
  } else if (opt.effect === 'bonus') {
    enq.status = 'confirmed';
    G.headliner = enq.bandId;
    G.rep = Math.min(100, G.rep + 2);
    addAlert(`✅ ${band.name} confirmed! Guest list sweetener earned +2 rep.`);
  } else if (opt.effect === 'decline') {
    enq.status = 'declined';
    addAlert(`📋 You passed on ${band.name}. Enquiry closed.`);
  }

  saveGame();
  renderEnquiries();
  updateStatusBar();
  renderOffice();
}

// ── OFFICE / SCHEDULE ──────────────────────────────────────────────────────
function renderOffice() {
  const el = document.getElementById('schedule-slots');
  if (!el) return;
  const slots = [];
  for (let d = 0; d <= 6; d++) {
    const isCurrent = d === G.dayOfWeek;
    const isSat = d === 6;
    const key = `${G.week}-${d}`;
    const dayNews = G.dailyNews[key] || [];
    const dayLabel = DAY_NAMES[d];

    let content = '';
    if (isSat) {
      if (G.headliner !== null) {
        content = `<strong style="color:#c9b8ff">🎸 ${BANDS[G.headliner].name}</strong><br><span style="color:#6050a0;font-size:0.72rem">Show Night</span>`;
      } else {
        content = `<span style="color:#6050a0">No headliner booked</span>`;
      }
    } else if (dayNews.length) {
      content = dayNews.map(n => `<span class="slot-news">📰 ${n}</span>`).join('');
    } else if (d < G.dayOfWeek) {
      content = `<span style="color:#3a3050;font-size:0.72rem">—</span>`;
    } else {
      content = `<span style="color:#3a3050;font-size:0.72rem">No news yet</span>`;
    }

    slots.push(`<div class="schedule-slot${isCurrent ? ' slot-day-current' : ''}${isSat ? ' slot-saturday' : ''}">
      <div class="slot-label">${dayLabel}</div>
      <div class="slot-content">${content}</div>
    </div>`);
  }
  el.innerHTML = slots.join('');
}

// ── BAND CAROUSEL ──────────────────────────────────────────────────────────
function renderBandCarousel() {
  const el = document.getElementById('band-carousel');
  if (!el) return;
  el.innerHTML = BANDS.map((band, i) => {
    const alreadyEnquired = G.enquiries.some(e => e.bandId === i && ['pending','replied','confirmed'].includes(e.status));
    const isHeadliner = G.headliner === i;
    let btnHtml = '';
    if (isHeadliner) {
      btnHtml = `<button class="enquiry-btn" style="background:#1a4a1a;color:#4caf50" disabled>✓ Headlining</button>`;
    } else if (alreadyEnquired) {
      btnHtml = `<button class="enquiry-btn pending" disabled>Enquiry Sent</button>`;
    } else {
      btnHtml = `<button class="enquiry-btn" onclick="enquireBand(${i})">Enquire</button>`;
    }
    return `<div class="band-card">
      <div class="band-name">${band.name}</div>
      <div class="band-genre">${band.genre}</div>
      <div class="band-stats">
        <span>Fame ${band.fame}</span>
        <span>£${band.fee}</span>
        <span>${band.draw} draw</span>
      </div>
      ${btnHtml}
    </div>`;
  }).join('');
}

// ── SFX ────────────────────────────────────────────────────────────────────
function renderSFX() {
  const el = document.getElementById('sfx-list');
  if (!el) return;
  el.innerHTML = SFX_GEAR.map((item, i) => {
    const owned = G.sfxOwned.includes(i);
    const active = G.sfxActive.includes(i);
    return `<div class="sfx-item${owned ? ' owned' : ''}">
      <div>
        <strong style="color:#c9b8ff">${item.name}</strong>
        <span style="color:#6050a0;font-size:0.75rem"> — £${item.cost}/night</span>
        <p style="color:#8070b0;font-size:0.75rem;margin:0.2rem 0">${item.desc}</p>
      </div>
      <div style="display:flex;gap:0.5rem;align-items:center">
        ${owned
          ? `<button class="sfx-toggle${active ? ' active' : ''}" onclick="toggleSFX(${i})">${active ? 'ON' : 'OFF'}</button>`
          : `<button class="sfx-buy" onclick="buySFX(${i})">Buy £${item.purchase || item.cost * 10}</button>`
        }
      </div>
    </div>`;
  }).join('');
}
function buySFX(i) {
  const item = SFX_GEAR[i];
  const price = item.purchase || item.cost * 10;
  if (G.money < price) { addAlert('Not enough money!'); return; }
  if (G.sfxOwned.includes(i)) return;
  G.money -= price;
  G.sfxOwned.push(i);
  saveGame(); updateStatusBar(); renderSFX();
}
function toggleSFX(i) {
  if (!G.sfxOwned.includes(i)) return;
  if (G.sfxActive.includes(i)) {
    G.sfxActive = G.sfxActive.filter(x => x !== i);
  } else {
    G.sfxActive.push(i);
  }
  saveGame(); renderSFX();
}

// ── ACHIEVEMENTS ───────────────────────────────────────────────────────────
function renderAchievements() {
  const el = document.getElementById('achievements-list');
  if (!el) return;
  el.innerHTML = ACHIEVEMENTS.map(a => {
    const unlocked = G.achievements.includes(a.id);
    return `<div class="achievement${unlocked ? ' unlocked' : ''}">
      <span class="ach-icon">${unlocked ? a.icon : '🔒'}</span>
      <div>
        <strong style="color:${unlocked ? '#c9b8ff' : '#3a3050'}">${a.name}</strong>
        <p style="color:#6050a0;font-size:0.75rem;margin:0">${a.desc}</p>
      </div>
    </div>`;
  }).join('');
}
function unlockAchievement(id) {
  if (G.achievements.includes(id)) return;
  G.achievements.push(id);
  const a = ACHIEVEMENTS.find(x => x.id === id);
  if (a) addAlert(`🏆 Achievement unlocked: ${a.name}`);
  saveGame();
  renderAchievements();
}

// ── CONTACTS ───────────────────────────────────────────────────────────────
function renderContacts() {
  const el = document.getElementById('contacts-list');
  if (!el) return;
  if (G.contacts.length === 0) {
    el.innerHTML = '<p style="color:#6050a0;padding:1rem">No contacts yet. Book shows to build your network.</p>';
    return;
  }
  el.innerHTML = G.contacts.map(c => `<div class="msg-entry">
    <strong style="color:#c9b8ff">${c.name}</strong>
    <span style="color:#6050a0;font-size:0.75rem"> — ${c.role}</span>
  </div>`).join('');
}

// ── ALERTS ─────────────────────────────────────────────────────────────────
function addAlert(msg) {
  G.alerts.unshift({ msg, ts: Date.now() });
  if (G.alerts.length > 50) G.alerts.pop();
  // badge
  const badge = document.getElementById('alerts-badge');
  if (badge) { badge.textContent = G.alerts.length; badge.style.display = 'inline'; }
}
function renderAlerts() {
  const el = document.getElementById('alerts-list');
  if (!el) return;
  const badge = document.getElementById('alerts-badge');
  if (badge) badge.style.display = 'none';
  if (G.alerts.length === 0) {
    el.innerHTML = '<p style="color:#6050a0;padding:1rem">No alerts yet.</p>';
    return;
  }
  el.innerHTML = G.alerts.map(a => `<div class="msg-entry">${a.msg}</div>`).join('');
}

// ── MESSAGES (stub) ────────────────────────────────────────────────────────
function renderMessages() {
  const el = document.getElementById('messages-list');
  if (!el) return;
  el.innerHTML = '<p style="color:#6050a0;padding:1rem">No messages yet. Contacts will reach out after shows.</p>';
}

// ── SHOW FLOW ──────────────────────────────────────────────────────────────
function runShow() {
  if (G.headliner === null) { addAlert('No headliner booked!'); return; }
  const band = BANDS[G.headliner];

  // Deduct SFX costs
  let sfxCost = 0;
  G.sfxActive.forEach(i => { sfxCost += SFX_GEAR[i].cost; });

  // Calculate attendance
  const baseAttend = Math.min(G.capacity, Math.round(band.draw * (0.8 + Math.random() * 0.4)));
  const attendance = Math.min(G.capacity, baseAttend);
  const revenue = attendance * G.ticketPrice;
  const bandFee = band.fee;
  const profit = revenue - bandFee - sfxCost;

  G.money += profit;
  if (G.money < 0) G.money = 0;

  // Rep & fans
  const repGain = Math.max(1, Math.round((attendance / G.capacity) * 5));
  const fanGain = Math.round(attendance * 0.3);
  G.rep = Math.min(100, G.rep + repGain);
  G.fans += fanGain;

  // SFX combo review
  let specialReview = null;
  const activeNames = G.sfxActive.map(i => SFX_GEAR[i].name);
  COMBOS.forEach(combo => {
    if (combo.genre === band.genre && combo.sfx.every(s => activeNames.includes(s))) {
      specialReview = combo.review;
      if (combo.achievement) unlockAchievement(combo.achievement);
    }
  });

  // Build review text
  const reviewPool = REVIEWS[profit > 0 ? (attendance / G.capacity > 0.8 ? 'great' : 'okay') : 'bad'];
  const review = specialReview || reviewPool[Math.floor(Math.random() * reviewPool.length)];

  // Record history
  G.history.push({ week: G.week, band: band.name, attendance, capacity: G.capacity, profit, review });

  // Check achievements
  if (attendance >= G.capacity) unlockAchievement('sellout');
  if (G.history.length >= 5) unlockAchievement('veteran');
  if (G.rep >= 50) unlockAchievement('rep50');

  // Show the post-show screen
  showScreen('postshow-screen');
  document.getElementById('ps-band').textContent = band.name;
  document.getElementById('ps-attendance').textContent = `${attendance} / ${G.capacity}`;
  document.getElementById('ps-revenue').textContent = `£${revenue}`;
  document.getElementById('ps-fee').textContent = `£${bandFee}`;
  document.getElementById('ps-sfx').textContent = `£${sfxCost}`;
  document.getElementById('ps-profit').textContent = `£${profit}`;
  document.getElementById('ps-rep').textContent = `+${repGain}`;
  document.getElementById('ps-fans').textContent = `+${fanGain}`;
  document.getElementById('ps-review').textContent = review;

  // Check game over
  if (G.money <= 0 && profit < 0) {
    G.gameOver = true;
    saveGame();
    setTimeout(() => { showScreen('gameover-screen'); }, 3000);
    return;
  }

  saveGame();
}

function continueAfterShow() {
  endWeek();
  showScreen('game-screen');
  switchPanel('office', document.querySelector('.nav-btn'));
}

function gameOver() {
  showScreen('gameover-screen');
}

// ── INIT GAME ──────────────────────────────────────────────────────────────
function initGame(fresh) {
  if (!fresh && hasSave()) {
    loadGame();
  } else {
    wipeSave();
    G = freshState();
  }
  showScreen('game-screen');
  updateStatusBar();
  switchPanel('office', document.querySelector('.nav-btn[onclick*="office"]'));
}

// ── START SCREEN ───────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('start-new-btn');
  const contBtn  = document.getElementById('continue-btn');
  if (hasSave()) {
    if (contBtn) contBtn.style.display = 'inline-block';
  }
  if (startBtn) startBtn.addEventListener('click', () => initGame(true));
  if (contBtn)  contBtn.addEventListener('click',  () => initGame(false));
});
