with open('index.html', 'r') as f:
    content = f.read()

# ════════════════════════════════════════════════════════
# 1. NEW CSS — newspaper clipping, buzz bar, shake, press
# ════════════════════════════════════════════════════════
old_go_css = "/* ── GAME OVER ── */"
new_css = """/* ── POST-SHOW REPORT ── */
.ps-headline { font-size:0.62rem; letter-spacing:0.28em; text-transform:uppercase; color:#6050a0; margin-bottom:0.3rem; }
.ps-band-name { font-size:2rem; color:#e0d0f8; margin-bottom:0.15rem; letter-spacing:0.05em; }
.ps-meta { font-size:0.78rem; color:#7060a0; margin-bottom:1.8rem; }
.ps-stars { font-size:1.4rem; color:#c0a040; letter-spacing:0.1em; margin-bottom:0.3rem; }
.ps-score-line { font-size:0.72rem; color:#6050a0; letter-spacing:0.15em; margin-bottom:1.6rem; }
/* Newspaper clipping */
.newspaper { background:#0c0c10; border:1px solid #252530; padding:1.2rem 1.4rem; margin-bottom:1.4rem; position:relative; }
.newspaper::before { content:''; position:absolute; inset:3px; border:1px solid #1a1a28; pointer-events:none; }
.newspaper-source { font-size:0.58rem; letter-spacing:0.22em; text-transform:uppercase; color:#4a3870; margin-bottom:0.6rem; border-bottom:1px solid #1e1e2e; padding-bottom:0.4rem; }
.newspaper-headline { font-size:1rem; color:#c0b0d8; margin-bottom:0.6rem; line-height:1.4; }
.newspaper-body { font-size:0.8rem; color:#7868a0; line-height:1.8; font-style:italic; }
/* Band DM */
.band-dm { background:#0e0c18; border:1px solid #1e1830; border-left:3px solid #5a3080; padding:1rem 1.2rem; margin-bottom:1.4rem; }
.band-dm-from { font-size:0.6rem; letter-spacing:0.18em; text-transform:uppercase; color:#5040a0; margin-bottom:0.5rem; }
.band-dm-text { font-size:0.82rem; color:#a090c0; line-height:1.7; }
/* Buzz bar */
.buzz-section { margin-bottom:1.4rem; }
.buzz-label { font-size:0.6rem; letter-spacing:0.18em; text-transform:uppercase; color:#5040a0; margin-bottom:0.5rem; }
.buzz-bar-wrap { background:#0a0a14; border:1px solid #1e1e2e; border-radius:2px; height:8px; margin-bottom:0.4rem; overflow:hidden; }
.buzz-bar-fill { height:100%; background:linear-gradient(90deg,#4a2080,#9060e0); border-radius:2px; transition:width 1s ease; }
.buzz-change { font-size:0.7rem; color:#8060c0; }
.buzz-change.up { color:#60c880; }
/* Shake */
@keyframes shake { 0%,100%{transform:translate(0,0) rotate(0)} 15%{transform:translate(-6px,2px) rotate(-1deg)} 30%{transform:translate(5px,-3px) rotate(1deg)} 45%{transform:translate(-4px,4px) rotate(-0.5deg)} 60%{transform:translate(4px,-2px) rotate(0.5deg)} 75%{transform:translate(-3px,1px) rotate(0)} 90%{transform:translate(2px,-1px) rotate(0)} }
.shake { animation:shake 0.55s ease forwards; }
/* Special combo flash */
@keyframes comboFlash { 0%{opacity:0} 30%{opacity:1} 70%{opacity:1} 100%{opacity:0} }
#combo-flash { position:fixed;inset:0;pointer-events:none;z-index:999;opacity:0; }

/* ── GAME OVER ── */"""

content = content.replace(old_go_css, new_css)

# ════════════════════════════════════════════════════════
# 2. Add combo-flash overlay + new post-show HTML slots
# ════════════════════════════════════════════════════════
old_postshow_html = """  <div class="postshow-inner fade-in">
    <div class="postshow-title">Post-Show</div>
    <div class="postshow-band" id="ps-band"></div>
    <div class="postshow-night" id="ps-night"></div>
    <div id="ps-combo"></div>
    <div class="postshow-review" id="ps-review"></div>
    <div class="revenue-breakdown" id="ps-revenue"></div>
    <div id="ps-rival"></div>
    <button class="continue-btn" onclick="continueAfterShow()">Next Week →</button>
  </div>"""

new_postshow_html = """  <div class="postshow-inner fade-in" id="postshow-inner">
    <div class="ps-headline">Post-Show Report · Week <span id="ps-week"></span></div>
    <div class="ps-band-name" id="ps-band"></div>
    <div class="ps-meta" id="ps-night"></div>
    <div class="ps-stars" id="ps-stars"></div>
    <div class="ps-score-line" id="ps-score-line"></div>
    <div id="ps-combo"></div>
    <!-- Newspaper -->
    <div class="newspaper" id="ps-newspaper">
      <div class="newspaper-source" id="ps-source"></div>
      <div class="newspaper-headline" id="ps-headline"></div>
      <div class="newspaper-body" id="ps-review"></div>
    </div>
    <!-- Revenue -->
    <div class="revenue-breakdown" id="ps-revenue-box">
      <h3 style="font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;color:#6050a0;margin-bottom:0.8rem">Night's Financials</h3>
      <div class="rev-row"><span class="rev-label">Attendance</span><span id="ps-attend" style="color:#c0b0d8"></span></div>
      <div class="rev-row"><span class="rev-label">Ticket Revenue</span><span id="ps-revenue" style="color:#50c878"></span></div>
      <div class="rev-row"><span class="rev-label">SFX Costs</span><span id="ps-sfx-cost" style="color:#e05060"></span></div>
    </div>
    <!-- Band DM -->
    <div class="band-dm" id="ps-dm">
      <div class="band-dm-from" id="ps-dm-from"></div>
      <div class="band-dm-text" id="ps-dm-text"></div>
    </div>
    <!-- Buzz -->
    <div class="buzz-section">
      <div class="buzz-label">Local Buzz — <span id="ps-band-name-buzz"></span></div>
      <div class="buzz-bar-wrap"><div class="buzz-bar-fill" id="ps-buzz-bar" style="width:0%"></div></div>
      <div class="buzz-change" id="ps-buzz-change"></div>
    </div>
    <div id="ps-rival"></div>
    <button class="continue-btn" onclick="continueAfterShow()">Next Week →</button>
  </div>"""

content = content.replace(old_postshow_html, new_postshow_html)

# Add combo-flash div after ach-toast
old_toast = '<div class="ach-toast" id="ach-toast"></div>'
new_toast = '<div class="ach-toast" id="ach-toast"></div>\n<div id="combo-flash"></div>'
content = content.replace(old_toast, new_toast)

# ════════════════════════════════════════════════════════
# 3. Upgrade animateShow — combo palette flash, pyro fritz, crowd surge
# ════════════════════════════════════════════════════════
old_draw_end = """    frame++;
    if (frame < totalFrames) requestAnimationFrame(draw);
    else showPostShow(band);
  }

  requestAnimationFrame(draw);
}"""

new_draw_end = """    frame++;
    if (frame < totalFrames) requestAnimationFrame(draw);
    else showPostShow(band, pyroFritzed, comboTriggered);
  }

  requestAnimationFrame(draw);
}"""

content = content.replace(old_draw_end, new_draw_end)

# Replace crowd dots section + add combo/fritz/surge logic
old_crowd = """  const crowd = Array.from({ length: 60 }, (_, i) => ({
    x: (i / 60) * W,
    y: H - 20 - Math.random() * 30,
    phase: Math.random() * Math.PI * 2,
    amp: 4 + Math.random() * 8,
  }));"""

new_crowd = """  // Pyro fritz: 20% chance if pyro active
  const pyroFritzed = hasPyro && Math.random() < 0.20;

  // Combo detection for animation
  let comboTriggered = null;
  let comboHue = hue;
  COMBOS.forEach(combo => {
    if (G.sfxActive[combo.sfx] && combo.match(band)) {
      comboTriggered = combo;
      if (combo.sfx === 'uv') comboHue = 285;
      else if (combo.sfx === 'pyro') comboHue = 15;
      else if (combo.sfx === 'laser') comboHue = 140;
      else if (combo.sfx === 'smoke') comboHue = 210;
    }
  });

  const crowd = Array.from({ length: 60 }, (_, i) => ({
    x: (i / 60) * W,
    y: H - 20 - Math.random() * 30,
    phase: Math.random() * Math.PI * 2,
    amp: 4 + Math.random() * 8,
  }));"""

content = content.replace(old_crowd, new_crowd)

# Replace crowd drawing to add surge + combo palette flash + fritz distort
old_crowd_draw = """    crowd.forEach(p => {
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
    }"""

new_crowd_draw = """    // Combo palette flash — switch hue mid-show
    const activeHue = (comboTriggered && frame > 60) ? comboHue : hue;
    if (comboTriggered && frame === 61) {
      const flash = document.getElementById('combo-flash');
      if (flash) {
        flash.style.background = 'hsla(' + comboHue + ',80%,60%,0.18)';
        flash.style.animation = 'none';
        requestAnimationFrame(() => {
          flash.style.animation = 'comboFlash 1.2s ease forwards';
        });
      }
    }

    // Pyro fritz — explosion + distort from frame 80-95
    if (pyroFritzed && frame >= 80 && frame <= 95) {
      const distort = (frame - 80) / 5;
      ctx.save();
      ctx.globalAlpha = 0.7 + Math.random() * 0.3;
      // Explosion bloom
      const ex = W * 0.5 + (Math.random() - 0.5) * 80;
      const eg = ctx.createRadialGradient(ex, H * 0.4, 0, ex, H * 0.4, 60 + distort * 20);
      eg.addColorStop(0, 'rgba(255,160,40,0.9)');
      eg.addColorStop(0.4, 'rgba(200,60,10,0.5)');
      eg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = eg;
      ctx.fillRect(0, 0, W, H);
      // Screen shake via canvas offset
      ctx.translate((Math.random()-0.5)*10, (Math.random()-0.5)*6);
      ctx.restore();
      // Shake game panel
      if (frame === 81) {
        const panel = document.getElementById('panel-show');
        if (panel) { panel.classList.add('shake'); setTimeout(()=>panel.classList.remove('shake'), 600); }
      }
    }

    // Crowd surge — faster + mosh if score would be high (use SFX count as proxy)
    const sfxCount = Object.keys(G.sfxActive).filter(k=>G.sfxActive[k]).length;
    const surging = sfxCount >= 2 && frame > 90;
    const surgeSpeed = surging ? 0.22 : 0.1;
    crowd.forEach(p => {
      const sway = Math.sin(frame * surgeSpeed + p.phase) * (surging ? p.amp * 1.8 : p.amp);
      // Mosh: random horizontal drift when surging
      if (surging) p.x += (Math.random() - 0.5) * 1.2;
      p.x = Math.max(5, Math.min(W - 5, p.x));
      ctx.fillStyle = 'hsla(' + activeHue + ',50%,55%,0.8)';
      ctx.beginPath();
      ctx.arc(p.x, p.y + sway, surging ? 6 : 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(p.x - 3, p.y + sway + 5, 6, 10);
    });

    if (frame % 20 < 3) {
      ctx.fillStyle = 'hsla(' + activeHue + ',80%,60%,0.07)';
      ctx.fillRect(0, 0, W, H);
    }"""

content = content.replace(old_crowd_draw, new_crowd_draw)

# ════════════════════════════════════════════════════════
# 4. Upgrade showPostShow — FM report, band DM, buzz bar
# ════════════════════════════════════════════════════════

# Update function signature
content = content.replace(
    'function showPostShow(band) {',
    'function showPostShow(band, pyroFritzed, comboTriggered) {'
)

# Replace the populate block
old_populate = """  // Populate post-show panel
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('ps-band',    band.name);
  set('ps-stars',   stars);
  set('ps-score',   `${score}/100`);
  set('ps-attend',  `${attendance.toLocaleString()} / ${capacity.toLocaleString()}`);
  set('ps-revenue', `+£${revenue.toLocaleString()}`);
  set('ps-review',  reviewText);
  const comboEl = document.getElementById('ps-combo');
  if (comboEl) comboEl.innerHTML = comboHTML;

  switchPanel('post-show', null);"""

new_populate = """  // ── Band DM by relationship tier ──────────────────────────────────
  const contactTier = G.contacts[band.id] ? G.contacts[band.id].tier : 0;
  const dmLines = {
    0: score >= 70
      ? ["That was the biggest crowd we've ever seen. Thank you. Seriously.", "— " + band.name]
      : ["Decent night. We appreciated the opportunity.", "— " + band.name],
    1: score >= 70
      ? ["Great show. The crowd was electric. Let's do this again soon.", "— " + band.name + "'s manager"]
      : ["Solid. A few technical hiccups but overall fine.", "— " + band.name + "'s manager"],
    2: score >= 70
      ? ["Strong night. The room felt right. We'll be back.", "— " + band.name]
      : ["It was okay. We've had better rooms.", "— " + band.name],
    3: score >= 70
      ? ["Professional operation. The crowd matched our rider expectations. We'll consider future dates.", "— " + band.name + " Management"]
      : ["The sightlines weren't ideal and the monitor mix was off. Our team will follow up.", "— " + band.name + " Management"],
    4: score >= 70
      ? ["The champagne was the correct year. Adequate. Have your people speak to our people.", "— " + band.name + " / Artist Relations"]
      : ["The champagne was the wrong year. My agent will be in touch. Do not book us again without approval.", "— " + band.name + " / Artist Relations"],
  };
  const dm = dmLines[Math.min(contactTier, 4)];

  // ── Newspaper headline & source ──────────────────────────────────
  const sources = ['The Local Gig Guide', 'NightLife Weekly', 'Scene Report', 'The Venue Beat', 'Underground Press'];
  const source = sources[Math.floor(Math.random() * sources.length)];
  const goodHeads = [
    '"' + band.name + ' Ignite ' + (G.venueTier > 1 ? 'Packed' : 'Sold-Out') + ' Venue in Career-Best Show"',
    '"A Night to Remember: ' + band.name + ' Own the Stage"',
    '"' + band.name + ': The Buzz Is Real — And It Started Here"',
  ];
  const okHeads = [
    '"' + band.name + ' Deliver Competent Set to Enthusiastic Crowd"',
    '"Solid Night Out: ' + band.name + ' Play It Safe"',
    '"The Room Was Full. The Band Was Fine. More Please."',
  ];
  const badHeads = [
    '"Technical Issues Mar ' + band.name + ' Show"',
    '"' + band.name + ': Promising, But Not Quite There Yet"',
    '"Half-Full Room Leaves Early — A Night of Missed Chances"',
  ];
  const headPool = score >= 78 ? goodHeads : score >= 52 ? okHeads : badHeads;
  const newsHead = headPool[Math.floor(Math.random() * headPool.length)];

  // ── Pyro fritz special note ──────────────────────────────────────
  let fritzNote = '';
  if (pyroFritzed) {
    score = Math.max(10, score - 12);
    fritzNote = ' The pyrotechnics misfired mid-set, cutting the music briefly and rattling the crowd.';
  }

  // ── Buzz (fame) growth ───────────────────────────────────────────
  const oldBuzz = Math.min(100, (band.fame * 20) + (G.contacts[band.id] ? G.contacts[band.id].gigs * 3 : 0));
  const buzzGain = score >= 78 ? 8 + Math.floor(Math.random() * 7) : score >= 52 ? 2 + Math.floor(Math.random() * 4) : 0;
  const newBuzz = Math.min(100, oldBuzz + buzzGain);

  // ── SFX cost for display ─────────────────────────────────────────
  let sfxCostDisplay = 0;
  for (const id in G.sfxActive) {
    if (G.sfxActive[id] && SFX_GEAR[id]) sfxCostDisplay += SFX_GEAR[id].nightly;
  }

  // ── Populate DOM ─────────────────────────────────────────────────
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  const setHTML = (id, v) => { const el = document.getElementById(id); if (el) el.innerHTML = v; };
  set('ps-week',      G.week);
  set('ps-band',      band.name);
  set('ps-night',     band.genre + ' · Week ' + G.week + ' · ' + attendance.toLocaleString() + ' / ' + capacity.toLocaleString() + ' capacity');
  set('ps-stars',     stars);
  set('ps-score-line', score + '/100 · ' + (score >= 78 ? 'Legendary' : score >= 60 ? 'Solid Night' : score >= 40 ? 'Underwhelming' : 'Disaster'));
  set('ps-source',    source);
  set('ps-headline',  newsHead);
  set('ps-review',    reviewText + fritzNote);
  set('ps-attend',    attendance.toLocaleString() + ' / ' + capacity.toLocaleString());
  set('ps-revenue',   '+£' + revenue.toLocaleString());
  set('ps-sfx-cost',  sfxCostDisplay > 0 ? '-£' + sfxCostDisplay.toLocaleString() : 'None');
  set('ps-dm-from',   'Message from ' + band.name);
  set('ps-dm-text',   dm[0]);
  set('ps-band-name-buzz', band.name);
  set('ps-buzz-change', '+' + buzzGain + ' buzz this week' + (buzzGain === 0 ? ' — no growth' : ''));
  const buzzEl = document.getElementById('ps-buzz-change');
  if (buzzEl) buzzEl.className = 'buzz-change ' + (buzzGain > 0 ? 'up' : '');
  const comboEl = document.getElementById('ps-combo');
  if (comboEl) comboEl.innerHTML = comboHTML;

  // Animate buzz bar after short delay
  setTimeout(() => {
    const bar = document.getElementById('ps-buzz-bar');
    if (bar) bar.style.width = newBuzz + '%';
  }, 400);

  switchPanel('post-show', null);"""

content = content.replace(old_populate, new_populate)

with open('index.html', 'w') as f:
    f.write(content)

checks = [
    ('newspaper CSS', 'newspaper' in content),
    ('band-dm CSS', 'band-dm' in content),
    ('buzz-bar CSS', 'buzz-bar' in content),
    ('shake animation', '@keyframes shake' in content),
    ('comboFlash animation', '@keyframes comboFlash' in content),
    ('combo-flash div', 'combo-flash' in content),
    ('new postshow HTML', 'ps-buzz-bar' in content),
    ('pyroFritzed', 'pyroFritzed' in content),
    ('comboTriggered', 'comboTriggered' in content),
    ('crowd surge', 'surging' in content),
    ('band DM tiers', 'dmLines' in content),
    ('newspaper headlines', 'goodHeads' in content),
    ('buzz growth', 'buzzGain' in content),
    ('fritz note', 'fritzNote' in content),
    ('updated showPostShow signature', 'showPostShow(band, pyroFritzed, comboTriggered)' in content),
]
for name, ok in checks:
    print(f"{'✅' if ok else '❌'} {name}")
