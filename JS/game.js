/* =============================================
   Wellspring Match — Game Logic
   ============================================= */

'use strict';

/*
  File role:
  - Owns shell/UI flow (title, modal, pause, win, impact screens)
  - Contains fallback card-grid mode helpers
  - Exposes screen/confetti hooks used by solitaire module
*/

// =============================================
// CARD DATA
// =============================================



// Progress contributed by each match type (must total 100)
const MATCH_PROGRESS = {
  tool_solution:       15,   // 4 pairs × 15 = 60
  challenge_solution:  10,   // 3 pairs × 10 = 30
  impact:              10,   // 1 pair  × 10 = 10
};

// Base score per match type
const MATCH_SCORE = {
  tool_solution:      100,
  challenge_solution: 150,
  impact:             200,
};

const HEATWAVE_SECS   = 15;    // seconds heatwave lasts
const MAX_SKIPS       = 3;
const SKIP_SCORE_COST = 25;
const DOUBLE_CHALLENGE_PENALTY = 100;

// =============================================
// GAME STATE
// =============================================

let state = {};

function freshState() {
  return {
    cards: [],                 // array of card objects
    flipped: [],               // indices of currently face-up (unmatched) cards
    matched: new Set(),        // pairIds that have been matched
    locked: new Set(),         // card ids that are temporarily locked
    score: 0,
    scoreMultiplier: 1,
    multiplierTimer: null,
    wellProgress: 0,           // 0–100
    timeElapsed: 0,
    timerInterval: null,
    timerMultiplier: 1,        // 1 = normal, 2 = heatwave
    heatwaveTimeout: null,
    isPaused: false,
    isProcessing: false,       // prevent clicks during flip-back animation
    skipsUsed: 0,
    challengesOvercome: 0,
    peopleHelped: 0,
    gameOver: false,
  };
}

// =============================================
// UTILITIES
// =============================================

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildDeck() {
  return shuffle(CARD_DEFINITIONS.map((def, idx) => ({ ...def, idx })));
}

// =============================================
// DOM REFERENCES
// =============================================

const $ = id => document.getElementById(id);

const screens = {
  title:  $('title-screen'),
  game:   $('game-screen'),
  win:    $('win-screen'),
  impact: $('impact-screen'),
};

// =============================================
// SCREEN MANAGEMENT
// =============================================

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  if (screens[name]) screens[name].classList.add('active');
}

// Expose for module-to-module coordination (solitaire engine win flow).
window.showScreen = showScreen;

let isStartingGame = false;

async function startSelectedMode() {
  // Preferred runtime path: launch module-based pipeline mode.
  // Falls back to local mode if module bootstrap fails.
  if (isStartingGame) return;
  isStartingGame = true;

  const startBtn = $('start-btn');
  if (startBtn) startBtn.disabled = true;

  try {
    if (typeof window.initPipelineGame !== 'function') {
      await import('./pipeline.js');
    }

    if (typeof window.initPipelineGame === 'function') {
      window.initPipelineGame();
      showScreen('game');
      return;
    }

    // Fallback mode if solitaire initializer is unavailable.
    initGame();
  } catch (e) {
    console.error('Failed to start selected mode. Falling back to legacy init.', e);
    try {
      initGame();
    } catch (fallbackError) {
      console.error('Legacy init also failed.', fallbackError);
    }
  } finally {
    isStartingGame = false;
    if (startBtn) startBtn.disabled = false;
  }
}

// =============================================
// CARD RENDERING
// =============================================

function buildCardEl(card, position) {
  const el = document.createElement('div');
  el.classList.add('card');
  el.dataset.position = position;
  el.setAttribute('tabindex', '0');
  el.setAttribute('role', 'button');
  el.setAttribute('aria-label', `Card ${position + 1}, face down`);

  el.innerHTML = `
    <div class="card-inner">
      <div class="card-face card-back-face">
        <svg class="card-back-pattern" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(79,187,239,1)" stroke-width="1.5"/>
          <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(79,187,239,1)" stroke-width="1"/>
          <circle cx="50" cy="50" r="25" fill="none" stroke="rgba(79,187,239,1)" stroke-width="0.8"/>
          <path d="M50 10 Q60 30 50 50 Q40 30 50 10Z" fill="rgba(79,187,239,0.5)"/>
        </svg>
        <div class="lock-overlay hidden" id="lock-${card.id}">
          🔒<span id="lock-countdown-${card.id}"></span>
        </div>
      </div>
      <div class="card-face card-front-face type-${card.type}">
        <span class="card-type-label">${card.type}</span>
        <span class="card-emoji">${card.emoji}</span>
        <span class="card-name">${card.name}</span>
      </div>
    </div>
  `;

  el.addEventListener('click', () => onCardClick(position));
  el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCardClick(position); } });
  return el;
}

function renderGrid() {
  const grid = $('card-grid');
  grid.innerHTML = '';
  state.cards.forEach((card, pos) => {
    grid.appendChild(buildCardEl(card, pos));
  });
}

// =============================================
// GAME INITIALISATION
// =============================================

function initGame() {
  // Fallback mode initializer (kept for safety).
  state = freshState();
  state.cards = buildDeck();

  // Reset UI
  updateProgressBar();
  updateScore();
  updateTimer();
  updateMultiplierBadge();
  updateSkipPips();
  clearHeatwave();

  renderGrid();
  startTimer();
  showScreen('game');
}

// =============================================
// TIMER
// =============================================

function startTimer() {
  clearInterval(state.timerInterval);
  state.timerInterval = setInterval(tickTimer, 1000);
}

function tickTimer() {
  if (state.isPaused || state.gameOver) return;
  state.timeElapsed += state.timerMultiplier;
  updateTimer();
}

function updateTimer() {
  const secs = Math.max(0, Math.floor(state.timeElapsed));
  const mins = Math.floor(secs / 60);
  const s    = secs % 60;
  const display = $('timer-value');
  const chip    = $('timer-display');
  if (display) display.textContent = `${mins}:${s.toString().padStart(2, '0')}`;
  if (chip) {
    chip.classList.remove('warning');
  }
}

// =============================================
// CARD INTERACTION
// =============================================

function onCardClick(position) {
  if (state.isPaused || state.isProcessing || state.gameOver) return;

  const card = state.cards[position];
  if (!card) return;
  if (state.matched.has(card.pairId)) return;     // already matched
  if (state.locked.has(card.id)) return;           // temporarily locked
  if (state.flipped.includes(position)) return;   // already flipped this turn

  flipCard(position, true);
  state.flipped.push(position);

  if (state.flipped.length === 2) {
    state.isProcessing = true;
    checkMatch();
  }
}

function flipCard(position, faceUp) {
  const el = getCardEl(position);
  if (!el) return;
  el.classList.toggle('flipped', faceUp);
  const card = state.cards[position];
  el.setAttribute('aria-label', faceUp
    ? `${card.name}, ${card.type} card`
    : `Card ${position + 1}, face down`);
}

function getCardEl(position) {
  return $('card-grid')?.querySelector(`[data-position="${position}"]`);
}

// =============================================
// MATCH DETECTION
// =============================================

function checkMatch() {
  const [p1, p2] = state.flipped;
  const c1 = state.cards[p1];
  const c2 = state.cards[p2];

  const samePair   = c1.pairId === c2.pairId;
  const bothChallenge = c1.type === 'challenge' && c2.type === 'challenge';

  if (samePair) {
    handleMatch(p1, p2, c1, c2);
  } else if (bothChallenge) {
    handleDoubleChallengePenalty(p1, p2, c1, c2);
  } else {
    handleMismatch(p1, p2, c1, c2);
  }
}

function handleMatch(p1, p2, c1, c2) {
  const matchType = resolveMatchType(c1, c2);
  const progress  = MATCH_PROGRESS[matchType] || 0;
  const baseScore = MATCH_SCORE[matchType]    || 100;
  const earned    = Math.round(baseScore * state.scoreMultiplier);

  state.matched.add(c1.pairId);
  state.score += earned;
  state.wellProgress = Math.min(100, state.wellProgress + progress);

  if (matchType === 'challenge_solution') state.challengesOvercome += 1;
  if (matchType === 'impact') {
    state.peopleHelped += 50;
    activateMultiplier(2, 20); // 2× for 20 seconds
  }

  // Mark DOM
  [p1, p2].forEach(p => {
    const el = getCardEl(p);
    if (el) {
      el.classList.add('matched');
      el.setAttribute('aria-label', `${state.cards[p].name} — matched!`);
    }
  });

  const msgs = {
    tool_solution:      `🔧 Progress! +${earned} pts — Well ${state.wellProgress}% restored`,
    challenge_solution: `✅ Challenge solved! +${earned} pts`,
    impact:             `🌊 Impact! 2× multiplier active! +${earned} pts`,
  };
  showToast(msgs[matchType] || `Match! +${earned} pts`, matchType === 'impact' ? 'type-impact' : 'type-success');

  state.flipped = [];
  state.isProcessing = false;

  updateScore();
  updateProgressBar();

  if (state.wellProgress >= 100) {
    setTimeout(triggerWin, 600);
  }
}

function resolveMatchType(c1, c2) {
  const types = [c1.type, c2.type].sort().join('_');
  if (types === 'solution_tool')       return 'tool_solution';
  if (types === 'challenge_solution')  return 'challenge_solution';
  if (types === 'impact_impact')       return 'impact';
  return 'tool_solution';
}

function handleDoubleChallengePenalty(p1, p2, c1, c2) {
  state.score = Math.max(0, state.score - DOUBLE_CHALLENGE_PENALTY);
  showToast(`⚡ Two challenges! −${DOUBLE_CHALLENGE_PENALTY} pts`, 'type-penalty');
  updateScore();
  // Fire both twist effects
  [c1, c2].forEach(c => { if (c.twist) applyTwist(c); });
  unflipAfterDelay(p1, p2);
}

function handleMismatch(p1, p2, c1, c2) {
  // If either card has a twist, fire it
  [c1, c2].forEach(c => { if (c.twist) applyTwist(c); });
  unflipAfterDelay(p1, p2);
}

function unflipAfterDelay(p1, p2) {
  setTimeout(() => {
    flipCard(p1, false);
    flipCard(p2, false);
    state.flipped = [];
    state.isProcessing = false;
  }, 1000);
}

// =============================================
// TWIST MECHANICS
// =============================================

function applyTwist(card) {
  switch (card.twist) {
    case 'contamination_spread': twistContaminationSpread(card); break;
    case 'pipe_lock':            twistPipeLock(card);            break;
    case 'heatwave':             twistHeatwave(card);            break;
  }
}

function twistContaminationSpread(card) {
  // Shuffle 3 random unmatched, face-down card positions
  const eligible = state.cards
    .map((c, i) => i)
    .filter(i => !state.matched.has(state.cards[i].pairId) && !state.flipped.includes(i));

  if (eligible.length < 3) return;

  const chosen = shuffle([...eligible]).slice(0, 3);
  const cards  = chosen.map(i => state.cards[i]);
  const shuffledCards = shuffle([...cards]);
  chosen.forEach((pos, k) => { state.cards[pos] = shuffledCards[k]; });

  // Re-render the affected cells
  chosen.forEach(pos => {
    const el = getCardEl(pos);
    if (el) el.replaceWith(buildCardEl(state.cards[pos], pos));
  });

  showToast(card.twistLabel + ' ' + card.twistDesc, 'type-twist');
}

function twistPipeLock(card) {
  // Lock a random unmatched, face-down card for 5 seconds
  const eligible = state.cards
    .map((c, i) => i)
    .filter(i =>
      !state.matched.has(state.cards[i].pairId) &&
      !state.flipped.includes(i) &&
      !state.locked.has(state.cards[i].id)
    );

  if (eligible.length === 0) return;

  const pos        = eligible[Math.floor(Math.random() * eligible.length)];
  const targetCard = state.cards[pos];

  state.locked.add(targetCard.id);
  const overlay = $(`lock-${targetCard.id}`);
  if (overlay) overlay.classList.remove('hidden');

  let secs = 5;
  const countdown = $(`lock-countdown-${targetCard.id}`);
  if (countdown) countdown.textContent = secs + 's';

  const interval = setInterval(() => {
    secs--;
    if (countdown) countdown.textContent = secs > 0 ? secs + 's' : '';
    if (secs <= 0) {
      clearInterval(interval);
      state.locked.delete(targetCard.id);
      if (overlay) overlay.classList.add('hidden');
    }
  }, 1000);

  showToast(card.twistLabel + ' ' + card.twistDesc, 'type-twist');
}

function twistHeatwave(card) {
  if (state.timerMultiplier > 1) return; // already active
  state.timerMultiplier = 2;
  activateHeatwave();
  showToast(card.twistLabel + ' ' + card.twistDesc, 'type-twist');

  clearTimeout(state.heatwaveTimeout);
  state.heatwaveTimeout = setTimeout(() => {
    state.timerMultiplier = 1;
    clearHeatwave();
  }, HEATWAVE_SECS * 1000);
}

function activateHeatwave() {
  const overlay = $('heatwave-overlay');
  if (overlay) overlay.classList.add('active');
}

function clearHeatwave() {
  const overlay = $('heatwave-overlay');
  if (overlay) overlay.classList.remove('active');
}

// =============================================
// SCORE MULTIPLIER
// =============================================

function activateMultiplier(factor, durationSecs) {
  clearTimeout(state.multiplierTimer);
  state.scoreMultiplier = factor;
  updateMultiplierBadge();

  state.multiplierTimer = setTimeout(() => {
    state.scoreMultiplier = 1;
    updateMultiplierBadge();
  }, durationSecs * 1000);
}

// =============================================
// SKIP MECHANIC
// =============================================

function onSkip() {
  if (state.isPaused || state.isProcessing || state.gameOver) return;
  if (state.skipsUsed >= MAX_SKIPS) {
    showToast('No skips remaining!', 'type-penalty');
    return;
  }
  if (state.flipped.length === 0) {
    showToast('Flip a card first, then skip to pass your second flip.', '');
    return;
  }

  // Un-flip any already-flipped card and count as a wasted turn
  state.flipped.forEach(pos => flipCard(pos, false));
  state.flipped = [];
  state.isProcessing = false;
  state.skipsUsed += 1;
  updateSkipPips();
  showToast(`Skip used (${MAX_SKIPS - state.skipsUsed} remaining)`, '');
}

// =============================================
// WIN / GAME OVER
// =============================================

function triggerWin() {
  // Legacy-mode win transition + celebration.
  state.gameOver = true;
  clearInterval(state.timerInterval);
  clearTimeout(state.heatwaveTimeout);

  // Bonus: penalise skips
  const skipPenalty = state.skipsUsed * SKIP_SCORE_COST;
  state.score = Math.max(0, state.score - skipPenalty);

  showScreen('win');
  startConfetti();
}

function populateImpactScreen() {
  if (typeof window.getSolitaireRunStats === 'function') {
    const stats = window.getSolitaireRunStats();
    if (stats) {
      setText('impact-score',      Number(stats.score || 0).toLocaleString());
      setText('impact-challenges', stats.challenges ?? 0);
      setText('impact-people',     stats.people ?? 0);
      setText('impact-time',       stats.timeLabel || '0:00');
      setText('impact-progress',   `${Math.round(stats.progress || 0)}%`);
      return;
    }
  }

  const timeTaken = Math.max(0, Math.floor(state.timeElapsed));
  const mins = Math.floor(timeTaken / 60);
  const secs = timeTaken % 60;

  setText('impact-score',      state.score.toLocaleString());
  setText('impact-challenges', state.challengesOvercome);
  setText('impact-people',     state.peopleHelped);
  setText('impact-time',       `${mins}:${secs.toString().padStart(2, '0')}`);
  setText('impact-progress',   `${Math.round(state.wellProgress)}%`);
}

function setText(id, val) {
  const el = $(id);
  if (el) el.textContent = val;
}

// =============================================
// UI UPDATES
// =============================================

function updateProgressBar() {
  const fill  = $('progress-fill');
  const label = $('progress-label');
  if (fill)  fill.style.width  = `${state.wellProgress}%`;
  if (label) label.textContent = `Well ${Math.round(state.wellProgress)}% Restored`;
}

function updateScore() {
  setText('score-value', state.score.toLocaleString());
}

function updateMultiplierBadge() {
  const badge = $('multiplier-badge');
  if (!badge) return;
  if (state.scoreMultiplier > 1) {
    badge.textContent = `${state.scoreMultiplier}× Score!`;
    badge.classList.add('active');
  } else {
    badge.classList.remove('active');
  }
}

function updateSkipPips() {
  document.querySelectorAll('.skip-pip').forEach((pip, i) => {
    pip.classList.toggle('used', i < state.skipsUsed);
  });
  const btn = $('skip-btn');
  if (btn) btn.disabled = state.skipsUsed >= MAX_SKIPS;
}

// =============================================
// TOAST NOTIFICATIONS
// =============================================

let toastTimeout = null;

function showToast(msg, cls) {
  const toast = $('toast');
  if (!toast) return;
  clearTimeout(toastTimeout);
  toast.textContent = msg;
  toast.className = 'toast ' + (cls || '');
  toast.classList.add('show');
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 2800);
}

// =============================================
// PAUSE / RESUME
// =============================================

function pauseGame() {
  if (state.gameOver) return;
  state.isPaused = true;
  $('pause-overlay').classList.add('open');
}

function resumeGame() {
  state.isPaused = false;
  $('pause-overlay').classList.remove('open');
}

// =============================================
// CONFETTI
// =============================================

function startConfetti() {
  const canvas  = $('confetti-canvas');
  if (!canvas) return;
  const ctx     = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors  = ['#FFC907','#1E88C4','#4FBBEF','#43A047','#E53935','#FFFFFF'];
  const pieces  = Array.from({ length: 140 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    r: 4 + Math.random() * 6,
    d: 1 + Math.random() * 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    tilt: Math.random() * 10 - 10,
    tiltAngle: 0,
    tiltAngleDelta: 0.1 + Math.random() * 0.1,
  }));

  let frame = 0;
  let animId;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.tiltAngle += p.tiltAngleDelta;
      p.y         += p.d;
      p.tilt       = Math.sin(p.tiltAngle) * 12;
      if (p.y > canvas.height) {
        p.y = -10;
        p.x = Math.random() * canvas.width;
      }
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.ellipse(p.x, p.y, p.r, p.r * 0.5, p.tilt, 0, Math.PI * 2);
      ctx.fill();
    });
    frame++;
    if (frame < 360) animId = requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  animId = requestAnimationFrame(draw);

  // Clean up if user navigates away
  window.addEventListener('beforeunload', () => cancelAnimationFrame(animId), { once: true });
}

// Expose for module-to-module coordination (solitaire engine win flow).
window.startConfetti = startConfetti;

// =============================================
// FLOATING DROPLETS (title screen atmosphere)
// =============================================

function spawnDroplets() {
  const container = $('droplet-container');
  if (!container) return;
  const DROPLET_COUNT = 18;
  for (let i = 0; i < DROPLET_COUNT; i++) {
    const d = document.createElement('div');
    d.className = 'droplet';
    d.style.left = Math.random() * 100 + '%';
    d.style.bottom = -(10 + Math.random() * 30) + 'px';
    d.style.animationDelay = (Math.random() * 6) + 's';
    d.style.animationDuration = (4 + Math.random() * 4) + 's';
    d.style.transform = `scale(${0.5 + Math.random()})`;
    container.appendChild(d);
  }
}

// =============================================
// MODAL
// =============================================

function openModal(id) {
  const m = $(id);
  if (m) m.classList.add('open');
}

function closeModal(id) {
  const m = $(id);
  if (m) m.classList.remove('open');
}

function checkOrientation() {
  const isPortrait = window.innerHeight > window.innerWidth;
  const warning = $('portrait-warning');
  if (!warning) return;

  if (isPortrait) {
    warning.classList.add('show');
    warning.setAttribute('aria-hidden', 'false');
  } else {
    warning.classList.remove('show');
    warning.setAttribute('aria-hidden', 'true');
  }
}

function initOrientationLock() {
  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock('landscape-primary').catch(() => {
      // Silently fail if lock is not supported.
    });
  }

  window.addEventListener('resize', checkOrientation, { passive: true });
  window.addEventListener('orientationchange', checkOrientation, { passive: true });
  checkOrientation();
}

// =============================================
// EVENT LISTENERS (wired after DOM ready)
// =============================================

document.addEventListener('DOMContentLoaded', () => {
  initOrientationLock();

  function syncGameplayViewportVars() {
    const viewportWidth = Math.round(window.visualViewport?.width || window.innerWidth || 0);
    const viewportHeight = Math.round(window.visualViewport?.height || window.innerHeight || 0);

    if (viewportWidth > 0) {
      document.documentElement.style.setProperty('--app-vw', `${viewportWidth}px`);
    }
    if (viewportHeight > 0) {
      document.documentElement.style.setProperty('--app-vh', `${viewportHeight}px`);
    }
  }

  syncGameplayViewportVars();
  window.addEventListener('resize', syncGameplayViewportVars, { passive: true });
  window.addEventListener('orientationchange', syncGameplayViewportVars, { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', syncGameplayViewportVars, { passive: true });
  }

  // Wire all top-level UI controls once DOM is ready.
  // Preload pipeline module so first Start click is immediate.
  import('./pipeline.js').catch(() => {
    // No-op: startSelectedMode has fallback handling.
  });

  // Title screen
  $('start-btn')?.addEventListener('click',    startSelectedMode);
  $('how-to-btn')?.addEventListener('click',   () => openModal('how-to-modal'));
  $('quit-btn')?.addEventListener('click',     () => {
    // Browsers only allow script-closing windows in limited cases (e.g., script-opened tabs).
    // Try the standard close path first, then a compatible fallback.
    window.close();

    setTimeout(() => {
      if (!document.hidden) {
        try {
          window.open('', '_self');
          window.close();
        } catch (_) {
          // Ignore fallback errors.
        }
      }

      if (!document.hidden) {
        showToast('Your browser blocked auto-close. You can close this tab/window now.', '');
      }
    }, 80);
  });

  // Modal close
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
  });
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });
  });

  // Game controls
  $('pause-btn')?.addEventListener('click',    pauseGame);
  $('skip-btn')?.addEventListener('click',     onSkip);
  $('reset-btn')?.addEventListener('click',    startSelectedMode);
  $('menu-btn')?.addEventListener('click',     () => {
    clearInterval(state.timerInterval);
    if (typeof window.stopPipelineGame === 'function') {
      window.stopPipelineGame();
    }
    showScreen('title');
  });

  // Pause overlay
  $('resume-btn')?.addEventListener('click',   resumeGame);
  $('restart-btn')?.addEventListener('click',  () => { resumeGame(); startSelectedMode(); });
  $('pause-menu-btn')?.addEventListener('click', () => { resumeGame(); showScreen('title'); });

  // Win screen
  $('win-impact-btn')?.addEventListener('click', () => { populateImpactScreen(); showScreen('impact'); });
  $('win-play-again-btn')?.addEventListener('click', startSelectedMode);

  // Impact screen
  $('impact-menu-btn')?.addEventListener('click',      () => {
    if (typeof window.stopPipelineGame === 'function') {
      window.stopPipelineGame();
    }
    showScreen('title');
  });
  $('impact-play-again-btn')?.addEventListener('click', startSelectedMode);

  // Title: spawn background droplets
  spawnDroplets();
});
