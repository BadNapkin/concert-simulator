// ── SHOW NIGHT ────────────────────────────────────────────────────────────────

function runShow() {
  const band = G.bookedBand;
  if (!band) return;

  // Deduct nightly SFX costs
  let sfxCostTotal = 0;
  for (const id in G.sfxActive) {
    if (G.sfxActive[id] && SFX_GEAR[id]) sfxCostTotal += SFX_GEAR[id].nightly;
  }
  G.cash -= sfxCostTotal;

  // Show SFX badges on show screen
  const badgeEl = document.getElementById('show-sfx-badges');
  if (badgeEl) {
    const activeIds = Object.keys(G.sfxActive).filter(k => G.sfxActive[k]);
    badgeEl.innerHTML = activeIds.map(id => {
      const g = SFX_GEAR[id];
      return `<span class="sfx-badge">${g.icon} ${g.name}</span>`;
    }).join('');
  }

  showScreen('game-screen');
  switchPanel('show', null);
  animateShow(band);
}

function animateShow(band) {
  const canvas = document.getElementById('show-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width  = canvas.offsetWidth  || 600;
  canvas.height = canvas.offsetHeight || 220;

  const hasPyro  = G.sfxActive['pyro'];
  const hasLaser = G.sfxActive['laser'];
  const hasSmoke = G.sfxActive['smoke'];
  const hasUV    = G.sfxActive['uv'];
  const hasSpots = G.sfxActive['spots'];
  const hasBasic = G.sfxActive['basic'];

  let hue = 260;
  if (hasBasic)  hue = 50;
  if (hasSpots)  hue = 40;
  if (hasUV)     hue = 280;
  if (hasSmoke)  hue = 200;
  if (hasLaser)  hue = 120;
  if (hasPyro)   hue = 20;

  const W = canvas.width, H = canvas.height;
  let frame = 0;
  const totalFrames = 180;

  const crowd = Array.from({ length: 60 }, (_, i) => ({
    x: (i / 60) * W,
    y: H - 20 - Math.random() * 30,
    phase: Math.random() * Math.PI * 2,
    amp: 4 + Math.random() * 8,
  }));

  const lasers = hasLaser ? Array.from({ length: 4 }, (_, i) => ({
    angle: -0.4 + i * 0.28,
    speed: 0.012 + i * 0.005,
    phase: i * Math.PI / 2,
  })) : [];

  const fireParticles = [];
  if (hasPyro) {
    for (let i = 0; i < 40; i++) {
      fireParticles.push({ x: W * 0.2 + Math.random() * W * 0.6, y: H, vy: -(2 + Math.random() * 4), life: Math.random(), hue: 10 + Math.random() * 30 });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, W, H);

    if (hasSmoke && frame > 10) {
      const a = Math.min(0.35, (frame - 10) / 80);
      ctx.fillStyle = `rgba(180,200,220,${a})`;
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 5; i++) {
        const wx = W * 0.1 + i * W * 0.18 + Math.sin(frame * 0.02 + i) * 20;
        const g = ctx.createRadialGradient(wx, H * 0.6, 0, wx, H * 0.6, 80);
        g.addColorStop(0, `rgba(200,215,230,${a * 0.6})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(wx - 80, H * 0.3, 160, H * 0.5);
      }
    }

    if (hasUV) {
      ctx.fillStyle = `rgba(160,0,255,${0.18 + 0.08 * Math.sin(frame * 0.05)})`;
      ctx.fillRect(0, 0, W, H);
    }

    ctx.fillStyle = '#1a1020';
    ctx.fillRect(0, H - 40, W, 40);

    const numLights = hasSpots ? 5 : hasBasic ? 3 : 1;
    for (let i = 0; i < numLights; i++) {
      const lx = W * (0.15 + i * (0.7 / (numLights - 1 || 1)));
      const fh = hue + Math.sin(frame * 0.08 + i) * 20;
      const g = ctx.createRadialGradient(lx, 0, 0, lx, H * 0.7, 140);
      g.addColorStop(0, `hsla(${fh},80%,70%,0.3)`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx - 60, H * 0.75);
      ctx.lineTo(lx + 60, H * 0.75);
      ctx.closePath();
      ctx.fill();
    }

    lasers.forEach(l => {
      const a = l.angle + Math.sin(frame * l.speed + l.phase) * 0.3;
      ctx.save();
      ctx.translate(W / 2, 0);
      ctx.rotate(a);
      const lg = ctx.createLinearGradient(0, 0, 0, H);
      lg.addColorStop(0, `hsla(${hue},100%,65%,0.9)`);
      lg.addColorStop(1, `hsla(${hue},100%,65%,0)`);
      ctx.strokeStyle = lg;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, H);
      ctx.stroke();
      ctx.restore();
    });

    if (hasPyro) {
      fireParticles.forEach(p => {
        p.y += p.vy;
        p.life -= 0.015;
        if (p.life <= 0) { p.y = H; p.life = 0.8 + Math.random() * 0.2; p.x = W * 0.15 + Math.random() * W * 0.7; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 + p.life * 4, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},100%,60%,${p.life})`;
        ctx.fill();
      });
    }

    const bandX = W / 2, bandY = H - 60;
    const bounce = Math.sin(frame * 0.15) * 4;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(bandX, bandY - 20 + bounce, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(bandX - 5, bandY - 12 + bounce, 10, 22);
    ctx.fillRect(bandX - 12, bandY - 5 + bounce, 8, 4);
    ctx.fillRect(bandX + 4,  bandY - 5 + bounce, 8, 4);

    crowd.forEach(p => {
      const sway = Math.sin(frame * 0.1 + p.phase) * p.amp;
      ctx.fillStyle = `hsla(${hue},40%,50%,0.7)`;
      ctx.beginPath();
      ctx.arc(p.x, p.y + sway, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(p.x - 3, p.y + sway + 5, 6, 10);
    });

    if (frame % 20 < 3) {
      ctx.fillStyle = `hsla(${hue},80%,60%,0.07)`;
      ctx.fillRect(0, 0, W, H);
    }

    frame++;
    if (frame < totalFrames) requestAnimationFrame(draw);
    else showPostShow(band);
  }

  requestAnimationFrame(draw);
}

// ── POST-SHOW ─────────────────────────────────────────────────────────────────

function showPostShow(band) {
  const vt = VENUE_TIERS[G.venueTier];
  const capacity = vt.capacity;

  let attendance = Math.floor(capacity * (0.4 + Math.random() * 0.5));

  // SFX synergy/penalty
  let sfxScoreMod = 0;
  for (const id in G.sfxActive) {
    if (!G.sfxActive[id] || !SFX_GEAR[id]) continue;
    const gear = SFX_GEAR[id];
    gear.synergies.forEach(t => { if (band.traits.includes(t)) sfxScoreMod += 8; });
    (gear.penalties||[]).forEach(t => { if (band.traits.includes(t)) sfxScoreMod -= 10; });
  }

  let score = Math.max(10, Math.min(100, 55 + Math.floor(Math.random() * 30) + sfxScoreMod));

  // Combo detection
  let comboHTML = '';
  const comboUnlocks = [];
  COMBOS.forEach(combo => {
    if (!G.sfxActive[combo.sfx]) return;
    if (!combo.match(band)) return;
    score = Math.min(100, score + combo.scoreMod);
    attendance = Math.min(capacity, Math.floor(attendance * 1.15));
    if (combo.reviewLine) comboHTML += `<div class="combo-unlock">✨ <em>${combo.reviewLine}</em></div>`;
    comboUnlocks.push(combo.id);
    const repMap = {
      combo_smoke_shoegaze: 'Smoke & Mirrors',
      combo_pyro_metal:     'Pyro Kings',
      combo_uv_electronic:  'UV Nights',
      combo_laser_synthwave:'Laser Rave',
    };
    if (repMap[combo.id] && !G.repTags.includes(repMap[combo.id])) G.repTags.push(repMap[combo.id]);
  });

  const ticketPrice = 8 + G.venueTier * 3;
  const revenue = attendance * ticketPrice;
  G.cash += revenue;
  G.showsBooked = (G.showsBooked || 0) + 1;

  // Update contact relationship
  if (!G.contacts[band.id]) G.contacts[band.id] = { tier: 0, gigs: 0, bestNight: null };
  G.contacts[band.id].gigs++;
  if (score >= 80) {
    G.contacts[band.id].tier = Math.min(4, G.contacts[band.id].tier + 1);
    G.contacts[band.id].bestNight = `Week ${G.week} — ${score}/100`;
  }

  const reviewPool = REVIEWS[score >= 80 ? 'great' : score >= 55 ? 'ok' : 'bad'];
  const reviewText = reviewPool[Math.floor(Math.random() * reviewPool.length)];
  const stars = score >= 85 ? '★★★★★' : score >= 70 ? '★★★★☆' : score >= 50 ? '★★★☆☆' : score >= 30 ? '★★☆☆☆' : '★☆☆☆☆';

  // Populate post-show panel
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('ps-band',    band.name);
  set('ps-stars',   stars);
  set('ps-score',   `${score}/100`);
  set('ps-attend',  `${attendance.toLocaleString()} / ${capacity.toLocaleString()}`);
  set('ps-revenue', `+£${revenue.toLocaleString()}`);
  set('ps-review',  reviewText);
  const comboEl = document.getElementById('ps-combo');
  if (comboEl) comboEl.innerHTML = comboHTML;

  switchPanel('post-show', null);
  checkAchievements(band, score, attendance);
  comboUnlocks.forEach(id => unlockAchievement(id));
  updateStatusBar();
  saveGame();
}

// ── CONTINUE / WEEKLY EVENT ───────────────────────────────────────────────────

function continueAfterShow() {
  G.week++;
  G.bookedBand   = null;
  G.supportBand  = null;
  randomWeeklyEvent();
  updateStatusBar();
  renderOffice();
  switchPanel('office', document.querySelector('[data-panel="office"]'));
}

function randomWeeklyEvent() {
  if (Math.random() > 0.3) return;
  const events = [
    { msg: "📰 Local press covered last weekend's show. +£200 bonus!", effect: () => { G.cash += 200; } },
    { msg: '🔧 Venue maintenance needed. -£150.',                       effect: () => { G.cash -= 150; } },
    { msg: '🎙️ A band dropped out — refund issued. -£100.',             effect: () => { G.cash -= 100; } },
    { msg: '🍺 Bar takings were huge this week. +£300!',                 effect: () => { G.cash += 300; } },
    { msg: '🌧️ Bad weather kept some fans home. No penalty though.',    effect: () => {} },
    { msg: '📱 Your venue went viral on social. +£500 sponsorship!',     effect: () => { G.cash += 500; } },
    { msg: '⚡ Power surge damaged a speaker. -£250 repair.',            effect: () => { G.cash -= 250; } },
  ];
  const ev = events[Math.floor(Math.random() * events.length)];
  ev.effect();
  showAchToast(ev.msg);
  updateStatusBar();
}

// ── GAME FLOW ─────────────────────────────────────────────────────────────────

function startGame() {
  if (hasSave() && loadGame()) {
    showScreen('game-screen');
    updateStatusBar();
    renderOffice();
    renderBandBook();
    renderSFX();
    renderAchievements();
    switchPanel('office', document.querySelector('[data-panel="office"]'));
    return;
  }
  initGame();
  showScreen('game-screen');
  updateStatusBar();
  renderOffice();
  renderBandBook();
  renderSFX();
  renderAchievements();
  switchPanel('office', document.querySelector('[data-panel="office"]'));
}

function newGame() {
  initGame();
  showScreen('game-screen');
  updateStatusBar();
  renderOffice();
  renderBandBook();
  renderSFX();
  renderAchievements();
  switchPanel('office', document.querySelector('[data-panel="office"]'));
}

function gameOver() {
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('go-weeks', G.week);
  set('go-shows', G.showsBooked || 0);
  set('go-cash',  '£' + G.cash.toLocaleString());
  showScreen('game-over');
  localStorage.removeItem('concertsim_save');
}

// ── BAND SWIPE CAROUSEL ───────────────────────────────────────────────────────

let _carouselIdx = 0;
let _carouselBands = [];
let _swipeStartX = 0;

function renderBandCarousel() {
  const vt = VENUE_TIERS[G.venueTier];
  _carouselBands = G.bands.filter(b => b.fame <= G.venueTier + 1);

  if (!_carouselBands.length) {
    const grid = document.getElementById('band-grid');
    if (grid) grid.innerHTML = '<p style="color:#4a3060;padding:2rem;text-align:center">No bands available yet.</p>';
    return;
  }

  _carouselIdx = Math.min(_carouselIdx, _carouselBands.length - 1);
  _renderCarouselCard();
}

function _renderCarouselCard() {
  const grid = document.getElementById('band-grid');
  if (!grid) return;

  const band = _carouselBands[_carouselIdx];
  const total = _carouselBands.length;
  const isBooked  = G.bookedBand  && G.bookedBand.id  === band.id;
  const isSupport = G.supportBand && G.supportBand.id === band.id;
  const canAfford = G.cash >= band.feeVal;

  // Combo hints
  const hints = [];
  COMBOS.forEach(combo => {
    if (G.sfxOwned && G.sfxOwned[combo.sfx] && combo.match(band)) {
      const g = SFX_GEAR[combo.sfx];
      hints.push(`${g.icon} ${g.name} synergy!`);
    }
  });

  grid.innerHTML = `
    <div class="carousel-wrap">
      <button class="carousel-arrow carousel-prev" onclick="carouselPrev()" ${_carouselIdx === 0 ? 'disabled' : ''}>‹</button>

      <div class="carousel-card band-card fade-in${isBooked || isSupport ? ' booked' : ''}"
           id="carousel-main"
           ontouchstart="swipeStart(event)"
           ontouchend="swipeEnd(event)">
        <div class="carousel-counter">${_carouselIdx + 1} / ${total}</div>
        <div class="band-name">${band.name}</div>
        <div class="band-genre">${band.genre} · ${fameLabel(band.fame)}</div>
        <div class="band-bio">${band.bio}</div>
        <div class="band-traits">${band.traits.map(t => `<span class="trait-tag">${t}</span>`).join('')}</div>
        ${hints.length ? `<div class="combo-hints">${hints.map(h => `<span class="combo-hint-tag">✨ ${h}</span>`).join('')}</div>` : ''}
        <div class="band-agent">${band.agent} · Fee: ${band.fee}</div>
        <div class="carousel-actions">
          <button class="book-btn" ${isBooked || !canAfford ? 'disabled' : ''} onclick="bookBand('${band.id}','headline')">
            ${isBooked ? '✓ Headliner' : canAfford ? '⭐ Book Headliner' : 'Can\'t afford'}
          </button>
          <button class="book-btn" style="font-size:0.65rem;opacity:0.8" ${isSupport || band.fame > 1 || !canAfford ? 'disabled' : ''} onclick="bookBand('${band.id}','support')">
            ${isSupport ? '✓ Support' : band.fame > 1 ? 'Too big for support' : '➕ Add Support'}
          </button>
        </div>
      </div>

      <button class="carousel-arrow carousel-next" onclick="carouselNext()" ${_carouselIdx >= total - 1 ? 'disabled' : ''}>›</button>
    </div>
    <div class="carousel-dots">
      ${_carouselBands.map((_, i) => `<span class="dot${i === _carouselIdx ? ' active' : ''}" onclick="carouselGoto(${i})"></span>`).join('')}
    </div>`;

  // Animate card in
  const card = document.getElementById('carousel-main');
  if (card) {
    card.style.opacity = '0';
    card.style.transform = 'translateY(12px) scale(0.97)';
    requestAnimationFrame(() => {
      card.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0) scale(1)';
    });
  }
}

function carouselNext() {
  if (_carouselIdx < _carouselBands.length - 1) { _carouselIdx++; _renderCarouselCard(); }
}
function carouselPrev() {
  if (_carouselIdx > 0) { _carouselIdx--; _renderCarouselCard(); }
}
function carouselGoto(i) {
  _carouselIdx = i; _renderCarouselCard();
}
function swipeStart(e) { _swipeStartX = e.touches[0].clientX; }
function swipeEnd(e) {
  const dx = e.changedTouches[0].clientX - _swipeStartX;
  if (dx < -40) carouselNext();
  else if (dx > 40) carouselPrev();
}

// Override renderBandBook to use carousel
function renderBandBook() { renderBandCarousel(); }

// ── DOM READY ─────────────────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => {
  const continueBtn = document.getElementById('continue-btn');
  if (continueBtn) {
    continueBtn.style.display = hasSave() ? 'inline-block' : 'none';
    continueBtn.onclick = startGame;
  }
});
