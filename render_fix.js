// ── BAND CAROUSEL ──────────────────────────────────────────────────────────
let _ci = 0, _cb = [];

function renderBandCarousel() {
  const el = document.getElementById('band-carousel');
  if (!el) return;
  _cb = G.bands.filter(b => b.fame <= G.venueTier + 1);
  if (!_cb.length) { el.innerHTML = '<p style="color:#4a3060;padding:2rem;text-align:center">No bands available at this venue tier yet.</p>'; return; }
  _ci = Math.min(_ci, _cb.length - 1);
  _drawCard(el);
}

function _drawCard(el) {
  const band = _cb[_ci];
  const total = _cb.length;
  const isHL = G.bookedBand && G.bookedBand.id === band.id;
  const isSup = G.supportBand && G.supportBand.id === band.id;
  const canAfford = G.cash >= band.feeVal;
  const tier = G.contacts[band.id] ? G.contacts[band.id].tier : 0;
  const GENRE_EMOJI = { punk:'🎸', rock:'🎸', folk:'🪕', electronic:'🎛️', pop:'🎤', metal:'🤘', default:'🎵' };
  const emoji = GENRE_EMOJI[band.genreKey] || GENRE_EMOJI.default;
  const hints = [];
  COMBOS.forEach(combo => {
    if (G.sfxOwned[combo.sfx] && combo.match(band)) {
      hints.push(SFX_GEAR[combo.sfx].icon + ' ' + SFX_GEAR[combo.sfx].name + ' synergy!');
    }
  });
  el.innerHTML = `
    <div class="carousel-outer">
      <div class="carousel-wrap">
        <button class="carousel-arrow" onclick="cprev()" ${_ci===0?'disabled':''}>&#8249;</button>
        <div class="band-card-inner${isHL||isSup?' booked':''}" id="cc"
             ontouchstart="csx(event)" ontouchend="cex(event)">
          ${isHL?'<div class="booked-badge">HEADLINER</div>':isSup?'<div class="booked-badge" style="color:#80c0ff;border-color:rgba(80,150,255,0.4)">SUPPORT</div>':''}
          <div class="carousel-counter">${_ci+1} of ${total}</div>
          <div class="band-avatar">${emoji}</div>
          <div class="band-name" style="text-align:center">${band.name}</div>
          <div class="band-genre" style="text-align:center;margin-bottom:0.8rem">${band.genre} · ${fameLabel(band.fame)}</div>
          <div class="band-bio">${band.bio}</div>
          <div class="band-traits" style="margin:0.6rem 0">${band.traits.map(t=>'<span class="trait-tag">'+t+'</span>').join('')}</div>
          ${hints.length?'<div class="combo-hints">'+hints.map(h=>'<span class="combo-hint-tag">✨ '+h+'</span>').join('')+'</div>':''}
          ${tier>0?'<div style="font-size:0.68rem;color:#507060;margin:0.3rem 0">Relationship: '+tierLabel(tier)+'</div>':''}
          <div class="band-agent">${band.agent} · Fee: ${band.fee}</div>
          <div class="carousel-actions">
            <button class="book-btn" ${isHL||!canAfford?'disabled':''} onclick="bookBand('${band.id}','headline')">
              ${isHL?'✓ Headliner':canAfford?'⭐ Book Headliner':'Can\'t afford'}
            </button>
            <button class="book-btn" style="font-size:0.65rem;opacity:0.8" ${isSup||band.fame>1||!canAfford?'disabled':''} onclick="bookBand('${band.id}','support')">
              ${isSup?'✓ Support':band.fame>1?'Too big for support':'➕ Support Act'}
            </button>
          </div>
        </div>
        <button class="carousel-arrow" onclick="cnext()" ${_ci>=total-1?'disabled':''}>&#8250;</button>
      </div>
      <div class="carousel-dots">${_cb.map((_,i)=>'<span class="dot'+(i===_ci?' active':'')+'" onclick="cgoto('+i+')"></span>').join('')}</div>
    </div>`;
  const card = document.getElementById('cc');
  if (card) {
    card.style.opacity='0'; card.style.transform='translateY(10px) scale(0.97)';
    requestAnimationFrame(()=>{ card.style.transition='opacity 0.22s,transform 0.22s'; card.style.opacity='1'; card.style.transform='translateY(0) scale(1)'; });
  }
}

let _sx=0;
function cnext(){ if(_ci<_cb.length-1){_ci++;_drawCard(document.getElementById('band-carousel'));} }
function cprev(){ if(_ci>0){_ci--;_drawCard(document.getElementById('band-carousel'));} }
function cgoto(i){ _ci=i; _drawCard(document.getElementById('band-carousel')); }
function csx(e){ _sx=e.touches[0].clientX; }
function cex(e){ const dx=e.changedTouches[0].clientX-_sx; if(dx<-40)cnext(); else if(dx>40)cprev(); }
function renderBandBook(){ _ci=0; renderBandCarousel(); }

// ── SFX ────────────────────────────────────────────────────────────────────
function renderSFX() {
  const el = document.getElementById('sfx-list');
  if (!el) return;
  el.innerHTML = Object.values(SFX_GEAR).map(gear => {
    const owned  = !!G.sfxOwned[gear.id];
    const active = !!G.sfxActive[gear.id];
    const synStr = gear.synergies.length ? '✓ Works with: ' + gear.synergies.join(', ') : '';
    const penStr = (gear.penalties||[]).length ? '✗ Clashes with: ' + (gear.penalties||[]).join(', ') : '';
    return '<div class="sfx-item' + (owned?' sfx-owned':'') + (active?' sfx-active-item':'') + '">' +
      '<div class="sfx-item-left">' +
        '<div class="sfx-item-name">' + gear.icon + ' ' + gear.name + (active?' <span style="color:#7aff7a;font-size:0.65rem">● ACTIVE</span>':'') + '</div>' +
        '<div class="sfx-item-cost">Buy: £' + gear.cost + ' · Nightly: £' + gear.nightly + '</div>' +
        (synStr ? '<div class="sfx-synergy">' + synStr + '</div>' : '') +
        (penStr ? '<div class="sfx-penalty">' + penStr + '</div>' : '') +
      '</div>' +
      '<div class="sfx-item-right">' +
        (owned
          ? '<button class="sfx-toggle' + (active?' sfx-toggle-on':'') + '" onclick="toggleSFX(\'' + gear.id + '\')">' + (active?'ON ✓':'OFF') + '</button>'
          : (gear.cost > 0
              ? '<button class="sfx-buy" ' + (G.cash < gear.cost ? 'disabled' : '') + ' onclick="buySFX(\'' + gear.id + '\')">Buy £' + gear.cost + '</button>'
              : '<span style="color:#4caf50;font-size:0.75rem">✓ Included</span>')) +
      '</div>' +
    '</div>';
  }).join('');
}

function buySFX(id) {
  const gear = SFX_GEAR[id]; if (!gear || G.sfxOwned[id]) return;
  if (G.cash < gear.cost) { addAlert('Not enough cash to buy ' + gear.name + '.', true); return; }
  G.cash -= gear.cost;
  G.sfxOwned[id] = true;
  addAlert(gear.icon + ' ' + gear.name + ' installed! Toggle it on before your next show.', false);
  updateStatusBar(); renderSFX(); saveGame();
}

function toggleSFX(id) {
  if (!G.sfxOwned[id]) return;
  if (id === 'basic') {
    G.sfxActive = { basic: !G.sfxActive['basic'] };
  } else {
    if (G.sfxActive[id]) {
      delete G.sfxActive[id];
    } else {
      delete G.sfxActive['basic'];
      G.sfxActive[id] = true;
    }
  }
  updateStatusBar(); renderSFX(); saveGame();
}

// ── ACHIEVEMENTS ───────────────────────────────────────────────────────────
function renderAchievements() {
  const el = document.getElementById('achievements-list');
  if (!el) return;
  el.innerHTML = ACHIEVEMENTS.map(a => {
    const ach = G.achievements.find(x => x.id === a.id);
    const unlocked = ach && ach.unlocked;
    return '<div class="achievement' + (unlocked?' ach-unlocked':'') + '">' +
      '<span class="ach-icon">' + (unlocked ? a.icon : '🔒') + '</span>' +
      '<div>' +
        '<strong style="color:' + (unlocked?'#c9b8ff':'#3a3050') + '">' + a.name + '</strong>' +
        '<p style="color:#6050a0;font-size:0.72rem;margin:0.15rem 0">' + a.desc + '</p>' +
        '<p style="color:#4a3a80;font-size:0.68rem;margin:0">' + a.reward + '</p>' +
        (unlocked && ach.week ? '<p style="color:#405030;font-size:0.65rem;margin:0.1rem 0">Unlocked Week ' + ach.week + '</p>' : '') +
      '</div>' +
    '</div>';
  }).join('');
}

// ── INBOX (messages + enquiries combined) ──────────────────────────────────
function renderInbox() {
  const el = document.getElementById('inbox-list');
  if (!el) return;
  const msgs = (G.messages || []).map(m => ({ type:'msg', from:m.from, text:m.text, date:m.date, urgent:false }));
  const enqs = (G.enquiries || []).map(e => {
    const band = G.bands.find(b => b.id === e.bandId || (typeof e.bandId === 'number' && G.bands[e.bandId]));
    const bname = band ? band.name : 'Unknown Band';
    return { type:'enq', from: bname + ' (Enquiry)', text: e.status === 'confirmed' ? '✓ Confirmed for Week ' + e.week : e.status === 'pending' ? 'Awaiting response...' : e.reply || e.status, date: e.date || 'Week ' + (e.week||'?'), urgent: e.status === 'replied' };
  });
  const all = [...msgs, ...enqs].reverse();
  if (!all.length) { el.innerHTML = '<p style="color:#4a3060;font-size:0.8rem;padding:1.5rem">Your inbox is empty.</p>'; return; }
  el.innerHTML = all.map(item =>
    '<div class="msg-item' + (item.urgent?' msg-urgent':'') + '">' +
      '<div class="msg-from">' + item.from + (item.type==='enq'?' <span style="font-size:0.6rem;color:#5a4080">ENQUIRY</span>':'') + '</div>' +
      '<div class="msg-date">' + item.date + '</div>' +
      '<div class="msg-text">' + item.text + '</div>' +
    '</div>'
  ).join('');
}

function renderMessages() { renderInbox(); }
function renderEnquiries() { renderInbox(); }

// ── CONTACTS ───────────────────────────────────────────────────────────────
function renderContacts() {
  const el = document.getElementById('contacts-list');
  if (!el) return;
  const seen = Object.keys(G.contacts || {});
  if (!seen.length) { el.innerHTML = '<p style="color:#4a3060;font-size:0.8rem;padding:1rem">No relationship history yet.</p>'; return; }
  el.innerHTML = seen.map(id => {
    const c = G.contacts[id], band = G.bands.find(b => b.id === id);
    if (!band) return '';
    return '<div class="contact-entry fade-in">' +
      '<div class="contact-name">' + band.name + ' <span class="relationship-tier tier-' + c.tier + '">' + tierLabel(c.tier) + '</span></div>' +
      '<div class="contact-meta">' + band.genre + ' · Gigs: ' + c.gigs + ' · Fame: ' + fameLabel(band.fame) + '</div>' +
      '<div class="contact-history">Best night: ' + (c.bestNight||'None yet') + (c.agentNote?'<br><em style="color:#5a4070">"'+c.agentNote+'"</em>':'') + '</div>' +
    '</div>';
  }).join('');
}

// ── ALERTS ─────────────────────────────────────────────────────────────────
function renderAlerts() {
  const badge = document.getElementById('alerts-badge');
  const el = document.getElementById('alerts-list');
  if (!el) return;
  const urgent = (G.alerts||[]).filter(a=>a.urgent).length;
  if (badge) { badge.textContent = urgent||''; badge.style.display = urgent ? 'flex' : 'none'; }
  if (!G.alerts||!G.alerts.length) { el.innerHTML = '<p style="color:#4a3060;font-size:0.8rem;padding:1rem">No alerts.</p>'; return; }
  el.innerHTML = G.alerts.map(a =>
    '<div class="alert-item' + (a.urgent?' urgent':'') + '">' +
      '<div class="alert-date">' + a.date + '</div>' + a.text +
    '</div>'
  ).join('');
}
