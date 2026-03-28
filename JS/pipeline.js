import { FULL_DECK } from './deck.js';

'use strict';

const DEFAULT_DIFFICULTY = 'normal';
const DIFFICULTY_PROFILES = {
  easy: {
    id: 'easy',
    label: 'Easy',
    winTargetProgress: 84,
    startHand: 6,
    handRefillTarget: 6,
    maxHandSize: 9,
    lockSecs: 2,
    autoUnstuckDrawCount: 4,
    progressPerPipeline: 15,
    timeLimitSeconds: 0,
    streakBonusStep: 32,
    streakBonusCap: 300,
    deadlockAssistProgress: 3,
    invalidTapPenalty: 0,
    manualReroutePenalty: 0,
    consumableDropChance: 0.44,
    scoreValues: { tool: 95, challenge: 155, solution: 205, impact: 305, consumable: 100 },
  },
  normal: {
    id: 'normal',
    label: 'Normal',
    winTargetProgress: 100,
    startHand: 5,
    handRefillTarget: 5,
    maxHandSize: 7,
    lockSecs: 5,
    autoUnstuckDrawCount: 2,
    progressPerPipeline: 10,
    timeLimitSeconds: 420,
    streakBonusStep: 24,
    streakBonusCap: 220,
    deadlockAssistProgress: 1,
    invalidTapPenalty: 5,
    manualReroutePenalty: 8,
    consumableDropChance: 0.35,
    scoreValues: { tool: 80, challenge: 130, solution: 180, impact: 260, consumable: 90 },
  },
  hard: {
    id: 'hard',
    label: 'Hard',
    winTargetProgress: 108,
    startHand: 4,
    handRefillTarget: 4,
    maxHandSize: 6,
    lockSecs: 7,
    autoUnstuckDrawCount: 1,
    progressPerPipeline: 8,
    timeLimitSeconds: 330,
    streakBonusStep: 20,
    streakBonusCap: 180,
    deadlockAssistProgress: 0,
    invalidTapPenalty: 12,
    manualReroutePenalty: 20,
    consumableDropChance: 0.28,
    scoreValues: { tool: 75, challenge: 125, solution: 175, impact: 255, consumable: 85 },
  },
};

const MILESTONES = [
  { score: 500, message: 'Milestone: 500 points - The first village sees clean water.' },
  { score: 1200, message: 'Milestone: 1,200 points - Multiple neighborhoods restored.' },
  { score: 2200, message: 'Milestone: 2,200 points - Regional impact accelerating.' },
  { score: 3500, message: 'Milestone: 3,500 points - Mission momentum is unstoppable.' },
];

const DEBUG_EVENT_LOG_LIMIT = 240;

const SLOT_ORDER = ['tool', 'challenge', 'solution', 'impact', 'consumable'];
const PIPELINE_COMPLETE_SLOTS = ['tool', 'challenge', 'solution', 'impact'];

const DEFAULT_SCORE_VALUES = { tool: 80, challenge: 130, solution: 180, impact: 260, consumable: 90 };
const PEOPLE_PER_PIPELINE = 55;
const EFFECT_CLASS_DURATION_MS = 620;

const BOOSTERS = [
  {
    id: 'deep_draw',
    name: 'Deep Draw',
    emoji: '📦',
    description: 'Draw 2 cards.',
    charges: { easy: 2, normal: 1, hard: 1 },
  },
  {
    id: 'lock_breaker',
    name: 'Lock Breaker',
    emoji: '🗝️',
    description: 'Remove all active locks.',
    charges: { easy: 2, normal: 1, hard: 1 },
  },
  {
    id: 'momentum',
    name: 'Momentum',
    emoji: '⚡',
    description: 'Gain +8 progress and +100 score.',
    charges: { easy: 1, normal: 1, hard: 1 },
  },
];

let P = freshPipelineState();
let D = DIFFICULTY_PROFILES[DEFAULT_DIFFICULTY];
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
      consumable: null,
    },
    boosters: {},
    impactShield: 0,
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
    isPaused: false,
    outcome: 'in-progress',
    difficulty: DEFAULT_DIFFICULTY,
    milestoneHits: new Set(),
    telemetry: {
      turns: 0,
      pipelinesCompleted: 0,
      invalidSlotTaps: 0,
      manualReroutes: 0,
      autoReroutes: 0,
      autoDrawSaves: 0,
      safetyInjects: 0,
      impactsStolen: 0,
      consumablesUsed: 0,
      consumableDrops: 0,
      boostersUsed: 0,
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

function getDifficultyProfile(id) {
  return DIFFICULTY_PROFILES[id] || DIFFICULTY_PROFILES[DEFAULT_DIFFICULTY];
}

function getSelectedDifficultyFromUI() {
  const select = $('difficulty-mode');
  if (!select) return DEFAULT_DIFFICULTY;
  return select.value || DEFAULT_DIFFICULTY;
}

function syncDifficultySelect(value) {
  const select = $('difficulty-mode');
  if (select) {
    select.value = value;
  }
}

function loadSavedDifficulty() {
  try {
    const saved = localStorage.getItem('cw.pipelineDifficulty');
    if (saved && DIFFICULTY_PROFILES[saved]) {
      return saved;
    }
  } catch (_) {
    // Ignore storage access failures.
  }
  return DEFAULT_DIFFICULTY;
}

function saveDifficulty(value) {
  try {
    localStorage.setItem('cw.pipelineDifficulty', value);
  } catch (_) {
    // Ignore storage access failures.
  }
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
  const select = $('difficulty-mode');
  const savedDifficulty = loadSavedDifficulty();
  const shouldUseSaved = select && !select.dataset.boundDifficulty;
  const selectedDifficulty = shouldUseSaved ? savedDifficulty : getSelectedDifficultyFromUI();
  D = getDifficultyProfile(selectedDifficulty);
  syncDifficultySelect(D.id);
  saveDifficulty(D.id);

  stopPipelineGame();
  P = freshPipelineState();
  P.difficulty = D.id;
  resetBoostersForRun();

  setupDecks();
  drawCards(D.startHand);
  spawnNextChallenge();
  bindPipelineInteractions();
  startTimer();

  renderBoosterBar();
  renderPipeline();
  renderHand();
  bindDebugHudControls();
  updateHud();
  checkForDeadlock();
  recordDebugEvent('game_start', { handSize: P.hand.length, difficulty: D.id });
  showToast(buildDifficultyIntroMessage());
}

function resetBoostersForRun() {
  P.boosters = {};
  BOOSTERS.forEach(booster => {
    P.boosters[booster.id] = Math.max(0, booster.charges[D.id] || 0);
  });
}

function buildDifficultyIntroMessage() {
  const target = D.winTargetProgress;
  if (D.timeLimitSeconds <= 0) {
    return `${D.label} mode: reach ${target} points. Hand ${D.handRefillTarget}, lock ${D.lockSecs}s, no timer.`;
  }

  const mins = Math.floor(D.timeLimitSeconds / 60);
  const secs = D.timeLimitSeconds % 60;
  return `${D.label} mode: reach ${target} points in ${mins}:${String(secs).padStart(2, '0')}. Hand ${D.handRefillTarget}, lock ${D.lockSecs}s.`;
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
    if (P.gameOver || P.isPaused) return;
    P.elapsedSeconds += P.timerRate;

    if (D.timeLimitSeconds > 0 && P.elapsedSeconds >= D.timeLimitSeconds) {
      triggerLoss('Time limit reached for selected difficulty.');
      return;
    }

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

  const difficultySelect = $('difficulty-mode');
  if (difficultySelect && !difficultySelect.dataset.boundDifficulty) {
    difficultySelect.dataset.boundDifficulty = 'true';
    difficultySelect.value = D.id;
    difficultySelect.addEventListener('change', () => {
      const selected = getDifficultyProfile(difficultySelect.value);
      D = selected;
      saveDifficulty(selected.id);
      if (window.gameAudio?.playSfx) {
        window.gameAudio.playSfx('click');
      }
      initPipelineGame();
    });
  }
}

function renderBoosterBar() {
  const bar = $('booster-bar');
  if (!bar) return;

  bar.innerHTML = '';

  BOOSTERS.forEach(booster => {
    const charges = Math.max(0, P.boosters[booster.id] || 0);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'booster-btn';
    if (charges <= 0) {
      btn.classList.add('is-empty');
      btn.disabled = true;
    }

    btn.setAttribute('aria-label', `${booster.name}. ${booster.description} Charges left: ${charges}.`);
    btn.innerHTML = `
      <span class="booster-name"><span aria-hidden="true">${booster.emoji}</span>${booster.name}</span>
      <span class="booster-count" aria-hidden="true">${charges}</span>
    `;

    btn.onclick = () => {
      activateBooster(booster.id);
    };

    bar.appendChild(btn);
  });
}

function activateBooster(boosterId) {
  if (P.gameOver || P.isPaused) return;

  const charges = Math.max(0, P.boosters[boosterId] || 0);
  if (charges <= 0) {
    showToast('That booster is out of charges.');
    return;
  }

  let used = false;

  if (boosterId === 'deep_draw') {
    const before = P.hand.length;
    drawCards(2);
    used = P.hand.length > before;
    if (used) {
      triggerScreenEffect('effect-draw');
      showToast('Booster used: Deep Draw activated.');
    }
  }

  if (boosterId === 'lock_breaker') {
    const unlocked = clearAllLocks();
    used = unlocked > 0;
    if (used) {
      triggerScreenEffect('effect-lock');
      showToast(`Booster used: ${unlocked} lock${unlocked === 1 ? '' : 's'} removed.`);
    }
  }

  if (boosterId === 'momentum') {
    P.progress += 8;
    P.score += 100;
    checkMilestones();
    triggerScreenEffect('effect-progress');
    showToast('Booster used: Momentum surge (+8 progress, +100 score).');
    used = true;

    if (P.progress >= D.winTargetProgress) {
      updateHud();
      renderBoosterBar();
      triggerWin();
      return;
    }
  }

  if (!used) {
    showToast('Booster cannot be used right now.');
    return;
  }

  P.boosters[boosterId] = charges - 1;
  P.telemetry.boostersUsed += 1;
  window.gameAudio?.playSfx?.('click');
  recordDebugEvent('booster_used', { boosterId, remaining: P.boosters[boosterId] });

  updateHud();
  updateSlotHighlights();
  renderBoosterBar();
  checkForDeadlock();
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
  if (P.gameOver || P.isPaused) return;
  if (index < 0 || index >= P.hand.length) return;

  P.selectedHandIndex = P.selectedHandIndex === index ? -1 : index;
  renderHand();
  updateSlotHighlights();
}

function onSlotTap(slot) {
  if (P.gameOver || P.isPaused) return;
  if (P.selectedHandIndex < 0) return;

  const card = P.hand[P.selectedHandIndex];
  if (!card) return;

  if (!canPlaceCard(slot, card)) {
    P.telemetry.invalidSlotTaps += 1;
    recordDebugEvent('invalid_slot_tap', { slot, cardType: card.type, cardName: card.name });

    const invalidPenalty = Math.max(0, D.invalidTapPenalty || 0);
    if (invalidPenalty > 0) {
      P.score = Math.max(0, P.score - invalidPenalty);
      updateHud();
    }

    showToast('That card cannot be placed in this slot right now.');
    window.gameAudio?.playSfx?.('invalid');
    animateSlotPulse(slot, 'bad');
    updateDebugHud();
    return;
  }

  if (slot === 'impact' && P.stealNextImpact) {
    const hasCounter = P.pipeline.tool?.name === 'Tool Kit' || P.impactShield > 0;
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
      window.gameAudio?.playSfx?.('miss');
      animateSlotPulse('impact', 'bad');
      refillHand();
      checkForDeadlock();
      return;
    }

    if (P.impactShield > 0) {
      P.impactShield -= 1;
    }

    showTwistBanner('Water Theft blocked by your defenses.');
  }

  P.telemetry.turns += 1;
  recordDebugEvent('card_placed', { slot, cardType: card.type, cardName: card.name });
  window.gameAudio?.playSfx?.('place');

  P.pipeline[slot] = card;
  animateSlotPulse(slot, 'good');
  P.hand.splice(P.selectedHandIndex, 1);
  P.selectedHandIndex = -1;

  renderPipeline();
  renderHand();
  updateHud();
  updateSlotHighlights();

  if (slot === 'consumable') {
    setTimeout(resolveConsumablePlacement, 180);
  } else if (isPipelineComplete()) {
    setTimeout(resolvePipelineCompletion, 220);
  } else {
    refillHand();
    checkForDeadlock();
    updateDebugHud();
  }
}

function resolveConsumablePlacement() {
  const card = P.pipeline.consumable;
  if (!card) return;

  applyConsumableEffect(card);
  P.pipeline.consumable = null;
  P.discardPile.push(card);

  renderPipeline();
  refillHand();
  checkForDeadlock();
  updateDebugHud();
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
  if (slot === 'consumable') {
    return card.type === 'consumable';
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
  return PIPELINE_COMPLETE_SLOTS.every(slot => Boolean(P.pipeline[slot]));
}

function resolvePipelineCompletion() {
  if (!isPipelineComplete()) return;

  const earned = PIPELINE_COMPLETE_SLOTS.reduce((sum, slot) => {
    const type = P.pipeline[slot]?.type;
    return sum + (D.scoreValues[type] || DEFAULT_SCORE_VALUES[type] || 0);
  }, 0);

  P.streak += 1;
  const streakStep = D.streakBonusStep || 25;
  const streakCap = D.streakBonusCap || 250;
  const streakBonus = Math.min(streakCap, P.streak * streakStep);

  P.score += (earned + streakBonus);
  P.progress += D.progressPerPipeline;
  P.people += PEOPLE_PER_PIPELINE;
  P.challenges += 1;
  P.telemetry.pipelinesCompleted += 1;
  recordDebugEvent('pipeline_completed', {
    earned: earned + streakBonus,
    streak: P.streak,
    progress: P.progress,
  });

  showToast(`Pipeline complete! +${earned + streakBonus} score (streak +${streakBonus}).`);
  checkMilestones();
  pulseBoard();

  if (P.pipeline.tool) P.discardPile.push(P.pipeline.tool);
  if (P.pipeline.solution) P.discardPile.push(P.pipeline.solution);
  if (P.pipeline.impact) P.discardPile.push(P.pipeline.impact);
  if (P.pipeline.consumable) P.discardPile.push(P.pipeline.consumable);

  P.pipeline.tool = null;
  P.pipeline.solution = null;
  P.pipeline.impact = null;
  P.pipeline.challenge = null;
  P.pipeline.consumable = null;

  maybeDropConsumableToHand();
  maybeRefillBoosterCharge();

  updateHud();
  renderPipeline();
  renderBoosterBar();

  if (P.progress >= D.winTargetProgress) {
    triggerWin();
    return;
  }

  spawnNextChallenge();
  refillHand();
  checkForDeadlock();
}

function maybeDropConsumableToHand() {
  const chance = Math.max(0, Math.min(1, D.consumableDropChance || 0));
  if (chance <= 0) return;
  if (Math.random() >= chance) return;

  const options = FULL_DECK.filter(card => card.type === 'consumable');
  if (options.length === 0) return;

  const picked = cloneCard(options[Math.floor(Math.random() * options.length)]);
  if (P.hand.length < D.maxHandSize) {
    P.hand.push(picked);
  } else {
    P.drawPile.unshift(picked);
  }

  P.telemetry.consumableDrops += 1;
  recordDebugEvent('consumable_drop', { card: picked.name, handSize: P.hand.length });
  showTwistBanner(`Supply Drop! Consumable acquired: ${picked.name}.`);
}

function maybeRefillBoosterCharge() {
  if (P.telemetry.pipelinesCompleted < 1) return;
  if (P.telemetry.pipelinesCompleted % 3 !== 0) return;

  const refillable = BOOSTERS.filter(b => (P.boosters[b.id] || 0) < (b.charges[D.id] || 0));
  if (refillable.length === 0) return;

  const picked = refillable[Math.floor(Math.random() * refillable.length)];
  P.boosters[picked.id] = Math.min((picked.charges[D.id] || 0), (P.boosters[picked.id] || 0) + 1);
  recordDebugEvent('booster_refilled', { boosterId: picked.id, charges: P.boosters[picked.id] });
  showToast(`Booster recharged: ${picked.name}.`);
}

function refillHand() {
  if (P.hand.length >= D.handRefillTarget) return;
  drawCards(D.handRefillTarget - P.hand.length);
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

  const detailText = buildCardDetailText(card);

  el.innerHTML = `
    <div class="card-head">
      <span class="card-type">${card.type}</span>
      <span class="card-id">#${card.id}</span>
    </div>
    <span class="card-emoji" aria-hidden="true">${card.emoji}</span>
    <span class="card-name">${card.name}</span>
    <span class="card-description">${detailText}</span>
  `;

  return el;
}

function buildCardDetailText(card) {
  if (card?.type === 'consumable' && card?.effectLabel) {
    return card.effectLabel;
  }

  const text = String(card?.description || '').trim();
  if (!text) {
    return 'Mission card used to restore clean water access.';
  }

  return text.length > 88 ? `${text.slice(0, 85)}...` : text;
}

function updateHud() {
  const timerEl = $('pipeline-timer-value');
  const scoreEl = $('pipeline-score-value');
  const progressEl = $('pipeline-progress-value');
  const progressFill = $('pipeline-progress-fill');

  if (timerEl) {
    const mins = Math.floor(P.elapsedSeconds / 60);
    const secs = P.elapsedSeconds % 60;
    const timeLabel = `${mins}:${String(secs).padStart(2, '0')}`;
    if (D.timeLimitSeconds > 0) {
      const limitMins = Math.floor(D.timeLimitSeconds / 60);
      const limitSecs = D.timeLimitSeconds % 60;
      timerEl.textContent = `${timeLabel} / ${limitMins}:${String(limitSecs).padStart(2, '0')}`;
    } else {
      timerEl.textContent = timeLabel;
    }
  }

  if (scoreEl) scoreEl.textContent = P.score.toLocaleString();
  const completionPct = Math.min(100, Math.round((P.progress / D.winTargetProgress) * 100));
  if (progressEl) progressEl.textContent = `${completionPct}%`;
  if (progressFill) progressFill.style.width = `${completionPct}%`;

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
    showTwistBanner(`Pipe Lock! Solution slot locked for ${D.lockSecs}s.`);
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
  P.lockedUntil.set(slot, Date.now() + (D.lockSecs * 1000));
  updateSlotHighlights();

  const timerId = setTimeout(() => {
    P.lockedSlots.delete(slot);
    P.lockedUntil.delete(slot);
    P.lockTimers.delete(slot);
    updateSlotHighlights();
    showToast('Solution slot unlocked.');
  }, D.lockSecs * 1000);

  P.lockTimers.set(slot, timerId);
}

function clearAllLocks() {
  const locked = Array.from(P.lockedSlots);
  if (locked.length === 0) return 0;

  locked.forEach(slot => {
    const timerId = P.lockTimers.get(slot);
    if (timerId) {
      clearTimeout(timerId);
      P.lockTimers.delete(slot);
    }
    P.lockedSlots.delete(slot);
    P.lockedUntil.delete(slot);
  });

  updateSlotHighlights();
  return locked.length;
}

function applyConsumableEffect(card) {
  const effect = card?.consumableEffect || 'supply_crate';
  P.telemetry.consumablesUsed += 1;

  if (effect === 'supply_crate') {
    drawCards(2);
    triggerScreenEffect('effect-draw');
    showToast(`${card.name}: +2 cards.`);
    recordDebugEvent('consumable_used', { effect, card: card.name, handSize: P.hand.length });
    return;
  }

  if (effect === 'lock_release') {
    const unlocked = clearAllLocks();
    triggerScreenEffect('effect-lock');
    showToast(unlocked > 0 ? `${card.name}: ${unlocked} lock${unlocked === 1 ? '' : 's'} cleared.` : `${card.name}: no active locks to clear.`);
    recordDebugEvent('consumable_used', { effect, card: card.name, unlocked });
    return;
  }

  if (effect === 'progress_burst') {
    P.progress += 6;
    P.score += 60;
    checkMilestones();
    triggerScreenEffect('effect-progress');
    showToast(`${card.name}: +6 progress and +60 score.`);
    recordDebugEvent('consumable_used', { effect, card: card.name, progress: P.progress, score: P.score });
    updateHud();
    if (P.progress >= D.winTargetProgress) {
      triggerWin();
    }
    return;
  }

  if (effect === 'impact_guard') {
    P.impactShield += 1;
    triggerScreenEffect('effect-lock');
    showToast(`${card.name}: theft shield armed.`);
    recordDebugEvent('consumable_used', { effect, card: card.name, shield: P.impactShield });
    return;
  }

  if (effect === 'solution_hint') {
    injectSafetyCard();
    triggerScreenEffect('effect-draw');
    showToast(`${card.name}: matching aid card deployed.`);
    recordDebugEvent('consumable_used', { effect, card: card.name });
    return;
  }

  showToast(`${card.name}: effect resolved.`);
  recordDebugEvent('consumable_used', { effect: 'unknown', card: card.name });
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

function triggerScreenEffect(effectClass) {
  const screen = $('game-screen');
  if (!screen) return;

  screen.classList.remove('effect-draw', 'effect-lock', 'effect-progress');
  void screen.offsetWidth;
  screen.classList.add(effectClass);

  setTimeout(() => {
    screen.classList.remove(effectClass);
  }, EFFECT_CLASS_DURATION_MS);
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
  P.outcome = 'win';
  stopPipelineGame();
  window.gameAudio?.playSfx?.('win');

  if (typeof window.showScreen === 'function') {
    window.showScreen('win');
  }
  if (typeof window.startConfetti === 'function') {
    window.startConfetti();
  }
}

function triggerLoss(reason) {
  if (P.gameOver) return;

  P.gameOver = true;
  P.outcome = 'loss';
  stopPipelineGame();
  recordDebugEvent('mission_failed', { reason, elapsedSeconds: P.elapsedSeconds, score: P.score });
  window.gameAudio?.playSfx?.('miss');

  showTwistBanner(`Mission failed: ${reason}`);
  showToast('Mission failed. Review your impact report and try again.');

  setTimeout(() => {
    if (typeof window.populateImpactScreen === 'function') {
      window.populateImpactScreen();
    }
    if (typeof window.showScreen === 'function') {
      window.showScreen('impact');
    }
  }, 750);
}

function hasAnyValidMove() {
  if (P.hand.length === 0) return false;

  return P.hand.some(card => SLOT_ORDER.some(slot => canPlaceCard(slot, card)));
}

function hasActiveLock() {
  return P.lockedSlots.size > 0;
}

function checkForDeadlock() {
  if (P.gameOver || P.isPaused) return;
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

  const assistProgress = Math.max(0, D.deadlockAssistProgress || 0);
  if (assistProgress > 0) {
    P.progress += assistProgress;
    recordDebugEvent('deadlock_progress_assist', { progressAssist: assistProgress, progress: P.progress });
    updateHud();
  }

  // Try lightweight recovery first: expand the hand briefly.
  const before = P.hand.length;
  for (let i = 0; i < D.autoUnstuckDrawCount; i++) {
    if (P.hand.length >= D.maxHandSize) break;
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
  if (P.gameOver || P.isPaused) return;

  if (P.hand.length > 0) {
    P.discardPile.push(...P.hand);
  }

  P.hand = [];
  P.selectedHandIndex = -1;

  drawCards(D.handRefillTarget);
  updateSlotHighlights();

  if (autoTriggered) {
    P.telemetry.autoReroutes += 1;
    recordDebugEvent('reroute_auto', { handSize: P.hand.length });
  } else {
    P.telemetry.manualReroutes += 1;
    recordDebugEvent('reroute_manual', { handSize: P.hand.length });

    const reroutePenalty = Math.max(0, D.manualReroutePenalty || 0);
    if (reroutePenalty > 0) {
      P.score = Math.max(0, P.score - reroutePenalty);
      updateHud();
    }
  }

  if (autoTriggered) {
    showToast('Route adjusted automatically to prevent a deadlock.');
  } else {
    showToast('Hand rerouted. New cards are ready.');
  }
}

function checkMilestones() {
  MILESTONES.forEach(milestone => {
    if (P.score >= milestone.score && !P.milestoneHits.has(milestone.score)) {
      P.milestoneHits.add(milestone.score);
      showToast(milestone.message);
      showTwistBanner(milestone.message);
      window.gameAudio?.playSfx?.('milestone');
      recordDebugEvent('score_milestone', { score: milestone.score, message: milestone.message });
    }
  });
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
  setText('debug-consumables-used', P.telemetry.consumablesUsed);
  setText('debug-consumable-drops', P.telemetry.consumableDrops);
  setText('debug-boosters-used', P.telemetry.boostersUsed);
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
    difficulty: D.id,
    winTargetProgress: D.winTargetProgress,
    timeLimitSeconds: D.timeLimitSeconds,
    elapsedSeconds: P.elapsedSeconds,
    score: P.score,
    progress: P.progress,
    people: P.people,
    handSize: P.hand.length,
    drawPileSize: P.drawPile.length,
    discardPileSize: P.discardPile.length,
    validMoveCount: countValidMoves(),
    challenge: P.pipeline.challenge?.name || null,
    boosterCharges: { ...P.boosters },
    impactShield: P.impactShield,
    telemetry: P.telemetry,
    debugEvents: P.debugEvents,
  };
}

function getPipelineRunStats() {
  const mins = Math.floor(P.elapsedSeconds / 60);
  const secs = P.elapsedSeconds % 60;
  const completionPct = Math.min(100, Math.round((P.progress / D.winTargetProgress) * 100));

  return {
    score: P.score,
    challenges: P.challenges,
    people: P.people,
    progress: completionPct,
    progressPoints: P.progress,
    winTargetProgress: D.winTargetProgress,
    difficulty: D.id,
    outcome: P.outcome,
    timeLabel: `${mins}:${String(secs).padStart(2, '0')}`,
  };
}

function pausePipelineGame() {
  if (P.gameOver) return false;
  P.isPaused = true;
  return true;
}

function resumePipelineGame() {
  P.isPaused = false;
}

window.initPipelineGame = initPipelineGame;
window.stopPipelineGame = stopPipelineGame;
window.getPipelineRunStats = getPipelineRunStats;
window.getPipelineDebugData = getDebugSnapshot;
window.pausePipelineGame = pausePipelineGame;
window.resumePipelineGame = resumePipelineGame;
window.getSolitaireRunStats = getPipelineRunStats;
