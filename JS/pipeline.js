import { FULL_DECK } from './deck.js';

'use strict';

const STARTING_HAND = 5;
const HAND_REFILL_TARGET = 5;
const MAX_HAND_SIZE = 7;
const SOLUTION_LOCK_SECS = 5;
const AUTO_UNSTUCK_DRAW_COUNT = 2;
const DEBUG_EVENT_LOG_LIMIT = 240;

const SLOT_ORDER = ['tool', 'challenge', 'solution', 'impact'];

const SCORE_VALUES = {
  tool: 80,
  challenge: 130,
  solution: 180,
  impact: 260,
};

const PROGRESS_PER_PIPELINE = 10;
const PEOPLE_PER_PIPELINE = 55;

let P = freshPipelineState();
let debugHudBound = false;

function freshPipelineState() {
  return {
    drawPile: [],
    discardPile: [],
    challengeQueue: [],
    hand: [],
    pipeline: {
      tool: null,
      challenge: null,
      solution: null,
      impact: null,
    },
    selectedHandIndex: -1,
    score: 0,
    progress: 0,
    people: 0,
    challenges: 0,
    elapsedSeconds: 0,
    timerInterval: null,
    timerRate: 1,
    lockTimers: new Map(),
    lockedSlots: new Set(),
    lockedUntil: new Map(),
    streak: 0,
    deadlockRecoveryCount: 0,
    stealNextImpact: false,
    gameOver: false,
    telemetry: {
      turns: 0,
      pipelinesCompleted: 0,
      invalidSlotTaps: 0,
      manualReroutes: 0,
      autoReroutes: 0,
      autoDrawSaves: 0,
      safetyInjects: 0,
      impactsStolen: 0,
      twistCounts: {
        heatwave: 0,
        contamination_spread: 0,
        pipe_lock: 0,
        water_theft: 0,
      },
    },
    debugEvents: [],
  };
}

function $(id) {
  return document.getElementById(id);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function cloneCard(card) {
  return { ...card };
}

function setupDecks() {
  const cards = FULL_DECK.map(cloneCard);
  const challenges = cards.filter(c => c.type === 'challenge');
  const playable = cards.filter(c => c.type !== 'challenge');

  P.challengeQueue = shuffle(challenges);
  P.drawPile = shuffle(playable);
}

export function initPipelineGame() {
  stopPipelineGame();
  P = freshPipelineState();

  setupDecks();
  drawCards(STARTING_HAND);
  spawnNextChallenge();
  bindPipelineInteractions();
  startTimer();

  renderPipeline();
  renderHand();
  bindDebugHudControls();
  updateHud();
  checkForDeadlock();
  recordDebugEvent('game_start', { handSize: P.hand.length });
  showToast('Build the pipeline: Tool -> Challenge -> Solution -> Impact');
}

export function stopPipelineGame() {
  clearInterval(P.timerInterval);
  P.timerInterval = null;

  P.lockTimers.forEach(timerId => clearTimeout(timerId));
  P.lockTimers.clear();
  P.lockedSlots.clear();
  P.lockedUntil.clear();
}

function startTimer() {
  clearInterval(P.timerInterval);
  P.timerInterval = setInterval(() => {
    if (P.gameOver) return;
    P.elapsedSeconds += P.timerRate;
    updateHud();
    updateSlotHighlights();
  }, 1000);
}

function bindPipelineInteractions() {
  document.querySelectorAll('.pipeline-hand-card').forEach(btn => {
    btn.onclick = () => {
      const idx = Number(btn.dataset.index);
      onHandCardTap(idx);
    };
  });

  document.querySelectorAll('.pipeline-slot').forEach(slotEl => {
    slotEl.onclick = () => {
      onSlotTap(slotEl.dataset.slot);
    };
  });

  const rerouteBtn = $('reroute-btn');
  if (rerouteBtn) {
    rerouteBtn.onclick = () => {
      rerouteHand(false);
    };
  }
}

function drawCards(count) {
  for (let i = 0; i < count; i++) {
    refillDrawPileIfNeeded();
    if (P.drawPile.length === 0) break;
    P.hand.push(P.drawPile.pop());
  }
  renderHand();
}

function refillDrawPileIfNeeded() {
  if (P.drawPile.length > 0) return;
  if (P.discardPile.length === 0) return;

  P.drawPile = shuffle([...P.discardPile]);
  P.discardPile = [];
}

function spawnNextChallenge() {
  if (P.pipeline.challenge) return;

  if (P.challengeQueue.length === 0) {
    const recycle = FULL_DECK
      .filter(card => card.type === 'challenge')
      .map(cloneCard);
    P.challengeQueue = shuffle(recycle);
  }

  P.pipeline.challenge = P.challengeQueue.pop() || null;

  if (P.pipeline.challenge) {
    applyChallengeTwist(P.pipeline.challenge);
  }

  renderPipeline();
}

function onHandCardTap(index) {
  if (P.gameOver) return;
  if (index < 0 || index >= P.hand.length) return;

  P.selectedHandIndex = P.selectedHandIndex === index ? -1 : index;
  renderHand();
  updateSlotHighlights();
}

function onSlotTap(slot) {
  if (P.gameOver) return;
  if (P.selectedHandIndex < 0) return;

  const card = P.hand[P.selectedHandIndex];
  if (!card) return;

  if (!canPlaceCard(slot, card)) {
    P.telemetry.invalidSlotTaps += 1;
    recordDebugEvent('invalid_slot_tap', { slot, cardType: card.type, cardName: card.name });
    showToast('That card cannot be placed in this slot right now.');
    animateSlotPulse(slot, 'bad');
    updateDebugHud();
    return;
  }

  if (slot === 'impact' && P.stealNextImpact) {
    const hasCounter = P.pipeline.tool?.name === 'Tool Kit';
    P.stealNextImpact = false;
    if (!hasCounter) {
      P.telemetry.impactsStolen += 1;
      recordDebugEvent('impact_stolen', { challenge: P.pipeline.challenge?.name || 'unknown' });
      P.hand.splice(P.selectedHandIndex, 1);
      if (card) {
        P.discardPile.push(card);
      }
      P.selectedHandIndex = -1;
      renderHand();
      updateSlotHighlights();
      showTwistBanner('Water Theft! Impact card was stolen.');
      animateSlotPulse('impact', 'bad');
      refillHand();
      checkForDeadlock();
      return;
    }
    showTwistBanner('Tool Kit countered Water Theft.');
  }

  P.telemetry.turns += 1;
  recordDebugEvent('card_placed', { slot, cardType: card.type, cardName: card.name });

  P.pipeline[slot] = card;
  animateSlotPulse(slot, 'good');
  P.hand.splice(P.selectedHandIndex, 1);
  P.selectedHandIndex = -1;

  renderPipeline();
  renderHand();
  updateHud();
  updateSlotHighlights();

  if (isPipelineComplete()) {
    setTimeout(resolvePipelineCompletion, 220);
  } else {
    refillHand();
    checkForDeadlock();
    updateDebugHud();
  }
}

function canPlaceCard(slot, card) {
  if (!card) return false;
  if (P.lockedSlots.has(slot)) return false;

  if (slot !== 'challenge' && P.pipeline[slot]) return false;
  if (slot === 'challenge' && P.pipeline.challenge) return false;

  if (slot === 'tool') return card.type === 'tool';
  if (slot === 'challenge') return card.type === 'challenge';
  if (slot === 'solution') {
    if (card.type !== 'solution') return false;
    const challenge = P.pipeline.challenge;
    if (!challenge) return false;
    return card.pairId === challenge.pairId;
  }
  if (slot === 'impact') {
    if (card.type !== 'impact') return false;
    return Boolean(P.pipeline.solution);
  }
  return false;
}

function updateSlotHighlights() {
  const selectedCard = P.selectedHandIndex >= 0 ? P.hand[P.selectedHandIndex] : null;

  document.querySelectorAll('.pipeline-slot').forEach(slotEl => {
    const slot = slotEl.dataset.slot;
    const valid = selectedCard ? canPlaceCard(slot, selectedCard) : false;
    const blocked = Boolean(selectedCard) && !valid;
    slotEl.classList.toggle('is-valid', valid);
    slotEl.classList.toggle('is-blocked', blocked);
    slotEl.classList.toggle('is-locked', P.lockedSlots.has(slot));

    const lockText = getSlotLockText(slot);
    setSlotLockLabel(slotEl, lockText);
  });
}

function getSlotLockText(slot) {
  if (!P.lockedSlots.has(slot)) return '';
  const until = P.lockedUntil.get(slot);
  if (!until) return 'Locked';
  const secs = Math.max(1, Math.ceil((until - Date.now()) / 1000));
  return `Locked ${secs}s`;
}

function setSlotLockLabel(slotEl, text) {
  let badge = slotEl.querySelector('.slot-lock-pill');

  if (!text) {
    if (badge) badge.remove();
    return;
  }

  if (!badge) {
    badge = document.createElement('span');
    badge.className = 'slot-lock-pill';
    slotEl.appendChild(badge);
  }

  badge.textContent = text;
}

function isPipelineComplete() {
  return SLOT_ORDER.every(slot => Boolean(P.pipeline[slot]));
}

function resolvePipelineCompletion() {
  if (!isPipelineComplete()) return;

  const earned = SLOT_ORDER.reduce((sum, slot) => {
    const type = P.pipeline[slot]?.type;
    return sum + (SCORE_VALUES[type] || 0);
  }, 0);

  P.streak += 1;
  const streakBonus = Math.min(250, P.streak * 25);

  P.score += (earned + streakBonus);
  P.progress = Math.min(100, P.progress + PROGRESS_PER_PIPELINE);
  P.people += PEOPLE_PER_PIPELINE;
  P.challenges += 1;
  P.telemetry.pipelinesCompleted += 1;
  recordDebugEvent('pipeline_completed', {
    earned: earned + streakBonus,
    streak: P.streak,
    progress: P.progress,
  });

  showToast(`Pipeline complete! +${earned + streakBonus} score (streak +${streakBonus}).`);
  pulseBoard();

  if (P.pipeline.tool) P.discardPile.push(P.pipeline.tool);
  if (P.pipeline.solution) P.discardPile.push(P.pipeline.solution);
  if (P.pipeline.impact) P.discardPile.push(P.pipeline.impact);

  P.pipeline.tool = null;
  P.pipeline.solution = null;
  P.pipeline.impact = null;
  P.pipeline.challenge = null;

  updateHud();
  renderPipeline();

  if (P.progress >= 100) {
    triggerWin();
    return;
  }

  spawnNextChallenge();
  refillHand();
  checkForDeadlock();
}

function refillHand() {
  if (P.hand.length >= HAND_REFILL_TARGET) return;
  drawCards(HAND_REFILL_TARGET - P.hand.length);
}

function renderPipeline() {
  SLOT_ORDER.forEach(slot => {
    const slotEl = document.querySelector(`.pipeline-slot[data-slot="${slot}"] .slot-card-host`);
    if (!slotEl) return;

    slotEl.innerHTML = '';
    const card = P.pipeline[slot];
    if (card) {
      slotEl.appendChild(buildCardEl(card));
    }
  });

  updateSlotHighlights();
}

function renderHand() {
  const handRow = $('pipeline-hand-row');
  if (!handRow) return;

  handRow.innerHTML = '';

  P.hand.forEach((card, index) => {
    const button = document.createElement('button');
    button.className = 'pipeline-hand-card';
    if (P.selectedHandIndex === index) {
      button.classList.add('is-selected');
    }
    button.type = 'button';
    button.dataset.index = String(index);
    button.setAttribute('role', 'listitem');
    button.setAttribute('aria-label', `${card.name}, ${card.type}`);
    button.appendChild(buildCardEl(card));

    handRow.appendChild(button);
  });

  bindPipelineInteractions();
}

function buildCardEl(card) {
  const el = document.createElement('article');
  el.className = 'pipeline-card';
  el.dataset.type = card.type;

  el.innerHTML = `
    <span class="card-type">${card.type}</span>
    <span class="card-emoji" aria-hidden="true">${card.emoji}</span>
    <span class="card-name">${card.name}</span>
  `;

  return el;
}

function updateHud() {
  const timerEl = $('pipeline-timer-value');
  const scoreEl = $('pipeline-score-value');
  const progressEl = $('pipeline-progress-value');
  const progressFill = $('pipeline-progress-fill');

  if (timerEl) {
    const mins = Math.floor(P.elapsedSeconds / 60);
    const secs = P.elapsedSeconds % 60;
    timerEl.textContent = `${mins}:${String(secs).padStart(2, '0')}`;
  }

  if (scoreEl) scoreEl.textContent = P.score.toLocaleString();
  if (progressEl) progressEl.textContent = `${Math.round(P.progress)}%`;
  if (progressFill) progressFill.style.width = `${Math.round(P.progress)}%`;

  updateDebugHud();
}

let toastTimer = null;

function showToast(message) {
  const toastEl = $('pipeline-toast');
  if (!toastEl) return;

  clearTimeout(toastTimer);
  toastEl.textContent = message;
  toastEl.style.opacity = '1';

  toastTimer = setTimeout(() => {
    toastEl.style.opacity = '0.9';
  }, 2500);
}

let bannerTimer = null;

function showTwistBanner(message) {
  const layer = $('twist-layer');
  if (!layer) return;

  clearTimeout(bannerTimer);
  layer.innerHTML = '';

  const banner = document.createElement('div');
  banner.className = 'twist-banner';
  banner.textContent = message;
  layer.appendChild(banner);

  bannerTimer = setTimeout(() => {
    layer.innerHTML = '';
  }, 2200);
}

function applyChallengeTwist(challengeCard) {
  if (!challengeCard?.twist) return;

  incrementTwistTelemetry(challengeCard.twist);
  recordDebugEvent('twist_triggered', { twist: challengeCard.twist, challenge: challengeCard.name });

  if (challengeCard.twist === 'contamination_spread') {
    twistContaminationSpread();
    showTwistBanner('Contamination Spread! Hand cards shuffled.');
    return;
  }

  if (challengeCard.twist === 'pipe_lock') {
    twistPipeLock();
    showTwistBanner(`Pipe Lock! Solution slot locked for ${SOLUTION_LOCK_SECS}s.`);
    return;
  }

  if (challengeCard.twist === 'water_theft') {
    P.stealNextImpact = true;
    showTwistBanner('Water Theft! Next impact card can be stolen.');
    return;
  }

  if (challengeCard.twist === 'heatwave') {
    twistHeatwave();
    showTwistBanner('Heatwave! Timer speed increased briefly.');
    return;
  }

  showTwistBanner(`${challengeCard.name} twist activated.`);
}

function twistContaminationSpread() {
  if (P.hand.length < 2) return;

  const count = Math.min(3, P.hand.length);
  const picked = shuffle(P.hand.map((_, index) => index)).slice(0, count);
  const cards = picked.map(index => P.hand[index]);
  const shuffledCards = shuffle([...cards]);

  picked.forEach((index, i) => {
    P.hand[index] = shuffledCards[i];
  });

  renderHand();
  checkForDeadlock();
}

function twistPipeLock() {
  const slot = 'solution';
  if (P.lockedSlots.has(slot)) return;

  P.lockedSlots.add(slot);
  P.lockedUntil.set(slot, Date.now() + (SOLUTION_LOCK_SECS * 1000));
  updateSlotHighlights();

  const timerId = setTimeout(() => {
    P.lockedSlots.delete(slot);
    P.lockedUntil.delete(slot);
    P.lockTimers.delete(slot);
    updateSlotHighlights();
    showToast('Solution slot unlocked.');
  }, SOLUTION_LOCK_SECS * 1000);

  P.lockTimers.set(slot, timerId);
}

function twistHeatwave() {
  P.timerRate = 2;

  const timerId = setTimeout(() => {
    P.timerRate = 1;
  }, 10000);

  P.lockTimers.set('heatwave', timerId);
}

function pulseBoard() {
  const board = $('pipeline-board');
  if (!board) return;

  board.animate(
    [
      { transform: 'scale(1)' },
      { transform: 'scale(1.01)' },
      { transform: 'scale(1)' },
    ],
    {
      duration: 420,
      easing: 'ease-out',
    }
  );
}

function animateSlotPulse(slot, type) {
  const slotEl = document.querySelector(`.pipeline-slot[data-slot="${slot}"]`);
  if (!slotEl) return;

  const className = type === 'good' ? 'pulse-good' : 'pulse-bad';
  slotEl.classList.add(className);
  setTimeout(() => slotEl.classList.remove(className), 360);
}

function triggerWin() {
  P.gameOver = true;
  stopPipelineGame();

  if (typeof window.showScreen === 'function') {
    window.showScreen('win');
  }
  if (typeof window.startConfetti === 'function') {
    window.startConfetti();
  }
}

function hasAnyValidMove() {
  if (P.hand.length === 0) return false;

  return P.hand.some(card => SLOT_ORDER.some(slot => canPlaceCard(slot, card)));
}

function hasActiveLock() {
  return P.lockedSlots.size > 0;
}

function checkForDeadlock() {
  if (P.gameOver) return;
  if (hasAnyValidMove()) return;
  if (hasActiveLock()) return;

  recordDebugEvent('deadlock_detected', {
    handSize: P.hand.length,
    drawPile: P.drawPile.length,
    discardPile: P.discardPile.length,
  });
  recoverFromDeadlock();
}

function recoverFromDeadlock() {
  P.deadlockRecoveryCount += 1;

  // Try lightweight recovery first: expand the hand briefly.
  const before = P.hand.length;
  for (let i = 0; i < AUTO_UNSTUCK_DRAW_COUNT; i++) {
    if (P.hand.length >= MAX_HAND_SIZE) break;
    drawCards(1);
    if (hasAnyValidMove()) {
      P.telemetry.autoDrawSaves += 1;
      recordDebugEvent('deadlock_auto_draw_save', { handSize: P.hand.length });
      showToast('New supply arrived. Keep building the pipeline.');
      return;
    }
  }

  // If no progress, reroute hand to force a fresh decision space.
  if (P.hand.length >= before) {
    rerouteHand(true);
  }

  if (!hasAnyValidMove()) {
    injectSafetyCard();
    showToast('Emergency aid deployed: playable card added.');
  }
}

function rerouteHand(autoTriggered) {
  if (P.hand.length > 0) {
    P.discardPile.push(...P.hand);
  }

  P.hand = [];
  P.selectedHandIndex = -1;

  drawCards(HAND_REFILL_TARGET);
  updateSlotHighlights();

  if (autoTriggered) {
    P.telemetry.autoReroutes += 1;
    recordDebugEvent('reroute_auto', { handSize: P.hand.length });
  } else {
    P.telemetry.manualReroutes += 1;
    recordDebugEvent('reroute_manual', { handSize: P.hand.length });
  }

  if (autoTriggered) {
    showToast('Route adjusted automatically to prevent a deadlock.');
  } else {
    showToast('Hand rerouted. New cards are ready.');
  }
}

function injectSafetyCard() {
  const challenge = P.pipeline.challenge;
  if (challenge) {
    const needed = FULL_DECK.find(c => c.type === 'solution' && c.pairId === challenge.pairId);
    if (needed) {
      P.telemetry.safetyInjects += 1;
      recordDebugEvent('safety_card_injected', { type: 'solution', pairId: challenge.pairId });
      P.hand.push(cloneCard(needed));
      renderHand();
      updateSlotHighlights();
      return;
    }
  }

  const fallbackImpact = FULL_DECK.find(c => c.type === 'impact');
  if (fallbackImpact) {
    P.telemetry.safetyInjects += 1;
    recordDebugEvent('safety_card_injected', { type: 'impact' });
    P.hand.push(cloneCard(fallbackImpact));
    renderHand();
    updateSlotHighlights();
  }
}

function incrementTwistTelemetry(twist) {
  if (!P.telemetry.twistCounts[twist] && P.telemetry.twistCounts[twist] !== 0) return;
  P.telemetry.twistCounts[twist] += 1;
}

function countValidMoves() {
  let total = 0;
  P.hand.forEach(card => {
    SLOT_ORDER.forEach(slot => {
      if (canPlaceCard(slot, card)) {
        total += 1;
      }
    });
  });
  return total;
}

function updateDebugHud() {
  setText('debug-valid-moves', countValidMoves());
  setText('debug-turns', P.telemetry.turns);
  setText('debug-pipelines', P.telemetry.pipelinesCompleted);
  setText('debug-deadlocks', P.deadlockRecoveryCount);
  setText('debug-auto-draw-saves', P.telemetry.autoDrawSaves);
  setText('debug-auto-reroutes', P.telemetry.autoReroutes);
  setText('debug-manual-reroutes', P.telemetry.manualReroutes);
  setText('debug-safety-injects', P.telemetry.safetyInjects);
  setText('debug-impacts-stolen', P.telemetry.impactsStolen);
  setText('debug-invalid-taps', P.telemetry.invalidSlotTaps);
  setText('debug-heatwaves', P.telemetry.twistCounts.heatwave);
  setText('debug-contamination', P.telemetry.twistCounts.contamination_spread);
  setText('debug-pipe-locks', P.telemetry.twistCounts.pipe_lock);
  setText('debug-water-thefts', P.telemetry.twistCounts.water_theft);
}

function setText(id, value) {
  const el = $(id);
  if (el) {
    el.textContent = String(value);
  }
}

function bindDebugHudControls() {
  if (debugHudBound) return;
  debugHudBound = true;

  $('debug-toggle-btn')?.addEventListener('click', () => {
    const hud = $('pipeline-debug-hud');
    if (!hud) return;

    hud.classList.toggle('is-collapsed');
    const collapsed = hud.classList.contains('is-collapsed');
    const btn = $('debug-toggle-btn');
    if (btn) btn.textContent = collapsed ? 'Show' : 'Hide';
  });

  $('debug-copy-btn')?.addEventListener('click', async () => {
    const payload = JSON.stringify(getDebugSnapshot(), null, 2);
    try {
      await navigator.clipboard.writeText(payload);
      showToast('Debug JSON copied to clipboard.');
    } catch (_) {
      showToast('Clipboard blocked. Use Download JSON instead.');
    }
  });

  $('debug-download-btn')?.addEventListener('click', () => {
    const payload = JSON.stringify(getDebugSnapshot(), null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pipeline-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Debug JSON downloaded.');
  });
}

function recordDebugEvent(type, details = {}) {
  P.debugEvents.push({
    t: new Date().toISOString(),
    type,
    ...details,
  });

  if (P.debugEvents.length > DEBUG_EVENT_LOG_LIMIT) {
    P.debugEvents.splice(0, P.debugEvents.length - DEBUG_EVENT_LOG_LIMIT);
  }
}

function getDebugSnapshot() {
  return {
    elapsedSeconds: P.elapsedSeconds,
    score: P.score,
    progress: P.progress,
    people: P.people,
    handSize: P.hand.length,
    drawPileSize: P.drawPile.length,
    discardPileSize: P.discardPile.length,
    validMoveCount: countValidMoves(),
    challenge: P.pipeline.challenge?.name || null,
    telemetry: P.telemetry,
    debugEvents: P.debugEvents,
  };
}

function getPipelineRunStats() {
  const mins = Math.floor(P.elapsedSeconds / 60);
  const secs = P.elapsedSeconds % 60;

  return {
    score: P.score,
    challenges: P.challenges,
    people: P.people,
    progress: P.progress,
    timeLabel: `${mins}:${String(secs).padStart(2, '0')}`,
  };
}

window.initPipelineGame = initPipelineGame;
window.stopPipelineGame = stopPipelineGame;
window.getPipelineRunStats = getPipelineRunStats;
window.getPipelineDebugData = getDebugSnapshot;
window.getSolitaireRunStats = getPipelineRunStats;
