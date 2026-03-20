import { FULL_DECK } from './deck.js';


/* ============================================================
   PIPELINE RESTORATION SOLITAIRE — CORE GAME ENGINE SCAFFOLDING
   ============================================================ */

'use strict';

/* ------------------------------------------------------------
   1. GAME CONSTANTS
------------------------------------------------------------ */

const NUM_TABLEAU_COLUMNS = 8;
const NUM_TANKS = 6; // free cells
const NUM_FOUNDATIONS = 4; // Tools, Solutions, Challenges, Impact
const FOUNDATION_LABELS = ['Tools', 'Solutions', 'Challenges Cleared', 'Impact'];
const DEFAULT_STACK_OFFSET = 26;
const TIMER_TICK_MS = 250;
const TWIST_LOCK_SECS = 6;
const TWIST_SCORE_PENALTY = 35;
const DOUBLE_SCORE_TURNS = 3;

const BALANCE_PROFILES = {
  quick: {
    toolSolutionScore: 90,
    challengeSolutionScore: 160,
    impactScore: 200,
    toolSolutionProgress: 3,
    challengeSolutionProgress: 6,
    impactProgress: 5,
    maxMultiplier: 4,
  },
  medium: {
    toolSolutionScore: 80,
    challengeSolutionScore: 140,
    impactScore: 180,
    toolSolutionProgress: 2,
    challengeSolutionProgress: 4,
    impactProgress: 3,
    maxMultiplier: 3,
  },
  hard: {
    toolSolutionScore: 70,
    challengeSolutionScore: 130,
    impactScore: 160,
    toolSolutionProgress: 1,
    challengeSolutionProgress: 3,
    impactProgress: 2,
    maxMultiplier: 2,
  },
};

let BALANCE_PROFILE = 'medium';
let BALANCE = BALANCE_PROFILES[BALANCE_PROFILE];

function setBalanceProfile(profileName) {
  if (!BALANCE_PROFILES[profileName]) return false;
  BALANCE_PROFILE = profileName;
  BALANCE = BALANCE_PROFILES[profileName];
  try {
    localStorage.setItem('cw.balanceProfile', profileName);
  } catch (_) {
    // Ignore storage failures in constrained environments.
  }
  return true;
}

function applyStoredBalanceProfile() {
  try {
    const saved = localStorage.getItem('cw.balanceProfile');
    if (saved && BALANCE_PROFILES[saved]) {
      setBalanceProfile(saved);
    }
  } catch (_) {
    // Ignore storage access failures.
  }
}

/* ------------------------------------------------------------
   2. GAME STATE
------------------------------------------------------------ */

let S = {
  deck: [],
  tableau: [],       // array of 8 columns, each column = array of card objects
  tanks: [],         // array of 6 slots (null or card)
  foundations: [],   // array of 4 piles
  selectedCard: null,
  selectedFrom: null, // { type: 'tableau'|'tank'|'foundation', col, index }
  gameOver: false,
  score: 0,
  progress: 0,
  multiplier: 1,
  boosters: { hint: 0, double: 0 },
  doubleScoreMoves: 0,
  nextBoosterProgress: 20,
  challengeClears: 0,
  elapsedSeconds: 0,
  startedAtMs: 0,
  timerInterval: null,
};

let resizeListenerBound = false;
let resizeRenderTimeout = null;
let hintHighlightTimeout = null;

/* ------------------------------------------------------------
   3. INITIALIZATION
------------------------------------------------------------ */

export function initSolitaireGame() {
  applyStoredBalanceProfile();
  stopElapsedTimer();
  bindResponsiveLayoutListeners();

  S = {
    ...S,
    deck: shuffle([...FULL_DECK]),
    tableau: Array.from({ length: NUM_TABLEAU_COLUMNS }, () => []),
    tanks: Array.from({ length: NUM_TANKS }, () => null),
    foundations: Array.from({ length: NUM_FOUNDATIONS }, () => []),
    selectedCard: null,
    selectedFrom: null,
    gameOver: false,
    score: 0,
    progress: 0,
    multiplier: 1,
    boosters: { hint: 1, double: 0 },
    doubleScoreMoves: 0,
    nextBoosterProgress: 20,
    challengeClears: 0,
    elapsedSeconds: 0,
    startedAtMs: Date.now(),
    timerInterval: null,
  };

  startElapsedTimer();
  dealInitialLayout();
  updateHUD();
  renderBoard();
}

function bindResponsiveLayoutListeners() {
  if (resizeListenerBound) return;
  resizeListenerBound = true;

  const onViewportChange = () => {
    if (resizeRenderTimeout) clearTimeout(resizeRenderTimeout);
    resizeRenderTimeout = setTimeout(() => {
      renderBoard();
      updateHUD();
    }, 120);
  };

  window.addEventListener('resize', onViewportChange);
  window.addEventListener('orientationchange', onViewportChange);
}

/* ------------------------------------------------------------
   4. DEALING THE INITIAL LAYOUT
------------------------------------------------------------ */

function dealInitialLayout() {
  // Deal cards into 8 columns while never overrunning the deck.
  let deckIndex = 0;
  let remaining = S.deck.length;

  for (let col = 0; col < NUM_TABLEAU_COLUMNS; col++) {
    const colsLeft = NUM_TABLEAU_COLUMNS - col;
    const minForRemainingCols = (colsLeft - 1) * 6;

    // Keep 6-8 cards per column when possible, clamped by remaining cards.
    const maxDepth = Math.min(8, remaining - minForRemainingCols);
    const minDepth = Math.min(6, maxDepth);
    const depth = minDepth + Math.floor(Math.random() * (maxDepth - minDepth + 1));

    for (let i = 0; i < depth; i++) {
      const card = S.deck[deckIndex++];
      if (!card) break;
      card.faceDown = i < depth - 1; // all but last card face-down
      card.locked = false;
      S.tableau[col].push(card);
    }

    remaining = S.deck.length - deckIndex;
  }

  // Remaining cards go to a draw pile (optional future feature)
}

/* ------------------------------------------------------------
   5. RENDERING THE BOARD
------------------------------------------------------------ */

function renderBoard() {
  ensureTableauColumns();
  for (let col = 0; col < NUM_TABLEAU_COLUMNS; col++) {
    renderTableauColumn(col);
  }
  renderTanks();
  renderFoundations();
}

/* ---------------- TABLEAU ---------------- */

function ensureTableauColumns() {
  const container = document.getElementById('tableau');
  if (container.querySelectorAll('.tableau-column').length === NUM_TABLEAU_COLUMNS) {
    return;
  }

  container.innerHTML = '';
  for (let colIndex = 0; colIndex < NUM_TABLEAU_COLUMNS; colIndex++) {
    const colEl = document.createElement('div');
    colEl.className = 'tableau-column';
    colEl.dataset.col = colIndex;
    container.appendChild(colEl);
  }
}

function renderTableauColumn(colIndex) {
  const container = document.querySelector(`.tableau-column[data-col="${colIndex}"]`);
  const column = S.tableau[colIndex];
  if (!container) return;

  const stackOffset = getConfiguredStackOffset();

  container.innerHTML = '';

  column.forEach((card, depth) => {
    const cardEl = buildCardEl(card);
    cardEl.style.top = `${depth * stackOffset}px`;
    cardEl.style.transition = 'top 0.25s ease';
    cardEl.dataset.col = colIndex;
    cardEl.dataset.index = depth;
    container.appendChild(cardEl);
  });

  // Ensure each grid cell reserves enough vertical space for the full stack.
  const cardHeight = getConfiguredCardHeight();
  const stackDepth = Math.max(0, column.length - 1);
  const requiredHeight = cardHeight + stackDepth * stackOffset + 20;
  const minMobileHeight = cardHeight + 190;
  container.style.minHeight = `${Math.max(minMobileHeight, requiredHeight)}px`;
}

function getConfiguredCardHeight() {
  const cssValue = getComputedStyle(document.documentElement)
    .getPropertyValue('--play-card-h')
    .trim();
  const parsed = Number.parseFloat(cssValue);
  return Number.isFinite(parsed) ? parsed : 120;
}

function getConfiguredStackOffset() {
  const cssValue = getComputedStyle(document.documentElement)
    .getPropertyValue('--stack-offset')
    .trim();
  const parsed = Number.parseFloat(cssValue);
  return Number.isFinite(parsed) ? parsed : DEFAULT_STACK_OFFSET;
}

/* ---------------- TANKS ---------------- */

function renderTanks() {
  const container = document.getElementById('water-tanks');
  container.innerHTML = '';

  S.tanks.forEach((card, i) => {
    const slot = document.createElement('div');
    slot.className = 'tank-slot';
    slot.dataset.tank = i;

    if (card) slot.appendChild(buildCardEl(card));

    container.appendChild(slot);
  });
}

/* ---------------- FOUNDATIONS ---------------- */

function renderFoundations() {
  const container = document.getElementById('foundations');
  container.innerHTML = '';

  S.foundations.forEach((pile, i) => {
    const slot = document.createElement('div');
    slot.className = 'foundation-slot';
    slot.dataset.foundation = i;
    slot.dataset.label = FOUNDATION_LABELS[i] || `Foundation ${i + 1}`;

    if (pile.length > 0) {
      const topCard = pile[pile.length - 1];
      slot.appendChild(buildCardEl(topCard));
    }

    container.appendChild(slot);
  });
}

/* ------------------------------------------------------------
   6. CARD ELEMENT BUILDER
------------------------------------------------------------ */

function buildCardEl(card) {
  const el = document.createElement('div');
  el.className = 'card';
  el.dataset.cardId = card.id;

  // Face-down state
  if (card.faceDown) el.classList.add('facedown');
  else el.classList.add('faceup');

  if (card.justRevealed) {
    el.classList.add('reveal-flip');
    card.justRevealed = false;
  }

  // Locked state
  if (card.locked) el.classList.add('locked');

  // ARIA label
  el.setAttribute(
    'aria-label',
    card.faceDown
      ? 'Face-down card'
      : `${card.name}, ${card.type} card`
  );
  el.setAttribute('role', 'button');
  el.setAttribute('tabindex', '0');

  /* ------------------------------------------------------------
     CARD FRONT (Option B Layout)
     ------------------------------------------------------------ */
  const twistIcon = card.twist ? '<span class="card-twist-icon">⚠️</span>' : '';
  const actionHint = getCardActionHint(card);
  const typeLabel = getCardTypeLabel(card);
  const pointValue = getCardPointValue(card);

  el.innerHTML = `
    <div class="card-inner">

      <!-- BACK FACE -->
      <div class="card-face card-back-face">
        <svg class="card-back-pattern" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(79,187,239,1)" stroke-width="1.5"/>
          <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(79,187,239,1)" stroke-width="1"/>
          <circle cx="50" cy="50" r="25" fill="none" stroke="rgba(79,187,239,1)" stroke-width="0.8"/>
          <path d="M50 10 Q60 30 50 50 Q40 30 50 10Z" fill="rgba(79,187,239,0.5)"/>
        </svg>
      </div>

      <!-- FRONT FACE -->
      <div class="card-face card-front-face type-${card.type}">

        <!-- Top bar -->
        <div class="card-top-bar">
          <span class="card-type-badge">${typeLabel}</span>
        </div>

        <!-- Center emoji -->
        <div class="card-emoji">${card.emoji}</div>

        <!-- Name -->
        <div class="card-name">${card.name}</div>

        <!-- Action hint -->
        <div class="card-hint">${actionHint}</div>

        <!-- Point value -->
        <div class="card-point-value">${pointValue}</div>

        <!-- Pair ID (hidden) -->
        <div class="card-id">#${card.pairId}</div>

        <!-- Twist icon (bottom-right overlay) -->
        ${twistIcon}

      </div>
    </div>
  `;

  /* ------------------------------------------------------------
     INTERACTION HANDLERS (CLICK-TO-SELECT, CLICK-TO-PLACE)
     ------------------------------------------------------------ */

  // Click to select/deselect or place
  el.addEventListener('click', e => {
    if (card.faceDown || card.locked) return;
    e.stopPropagation();
    
    // If this card is already selected, deselect it
    if (S.selectedCard === card) {
      clearSelection();
      return;
    }

    // If another card is selected, first try to place it onto this card's pile.
    if (S.selectedCard !== null && S.selectedCard !== card) {
      if (attemptSelectedMoveToTarget(el, true)) return;
      clearSelection();
    }
    
    // Select this card
    toggleCardSelection(card, el);
  });

  el.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (card.faceDown || card.locked) return;
      
      if (S.selectedCard === card) {
        clearSelection();
      } else {
        if (S.selectedCard !== null) {
          if (attemptSelectedMoveToTarget(el, true)) return;
          clearSelection();
        }
        toggleCardSelection(card, el);
      }
    }
  });

  return el;
}

/* ------------------------------------------------------------
   7. CLICK-TO-SELECT, CLICK-TO-PLACE MOVEMENT SYSTEM
------------------------------------------------------------ */

function findCardOrigin(card) {
  // Tableau
  for (let col = 0; col < S.tableau.length; col++) {
    const idx = S.tableau[col].indexOf(card);
    if (idx !== -1) return { type: 'tableau', col, index: idx };
  }

  // Tanks
  for (let i = 0; i < S.tanks.length; i++) {
    if (S.tanks[i] === card) return { type: 'tank', tank: i };
  }

  // Foundations
  for (let i = 0; i < S.foundations.length; i++) {
    const idx = S.foundations[i].indexOf(card);
    if (idx !== -1) return { type: 'foundation', foundation: i, index: idx };
  }

  return null;
}

function toggleCardSelection(card, el) {
  S.selectedCard = card;
  S.selectedFrom = findCardOrigin(card);
  
  el.classList.add('selected');
  applySourceSelectionHighlight();
  highlightDropTargets(card);
}

function clearSelection() {
  if (S.selectedCard) {
    const selectedEl = document.querySelector(`[data-card-id="${S.selectedCard.id}"]`);
    if (selectedEl) {
      selectedEl.classList.remove('selected');
    }
  }
  
  clearDropTargets();
  clearSourceSelectionHighlight();
  S.selectedCard = null;
  S.selectedFrom = null;
}

function highlightDropTargets(card) {
  document.querySelectorAll('.tableau-column').forEach(col => {
    const colIndex = Number(col.dataset.col);
    if (isValidTableauMove(card, S.tableau[colIndex])) {
      col.classList.add('drop-target');
    }
  });

  document.querySelectorAll('.tank-slot').forEach((slot, i) => {
    if (S.tanks[i] === null) slot.classList.add('drop-target');
  });

  document.querySelectorAll('.foundation-slot').forEach((slot, i) => {
    if (isValidFoundationMove(card, S.foundations[i], i)) {
      slot.classList.add('drop-target');
    }
  });
}

function clearDropTargets() {
  document.querySelectorAll('.drop-target').forEach(el =>
    el.classList.remove('drop-target')
  );
}

function applySourceSelectionHighlight() {
  clearSourceSelectionHighlight();
  if (!S.selectedFrom) return;

  let sourceEl = null;
  if (S.selectedFrom.type === 'tableau') {
    sourceEl = document.querySelector(`.tableau-column[data-col="${S.selectedFrom.col}"]`);
  }
  if (S.selectedFrom.type === 'tank') {
    sourceEl = document.querySelector(`.tank-slot[data-tank="${S.selectedFrom.tank}"]`);
  }
  if (S.selectedFrom.type === 'foundation') {
    sourceEl = document.querySelector(`.foundation-slot[data-foundation="${S.selectedFrom.foundation}"]`);
  }

  if (sourceEl) {
    sourceEl.classList.add('source-selected');
  }
}

function clearSourceSelectionHighlight() {
  document.querySelectorAll('.source-selected').forEach(el => {
    el.classList.remove('source-selected');
  });
}

function showInvalidMoveFeedback(target) {
  const selectedEl = S.selectedCard
    ? document.querySelector(`[data-card-id="${S.selectedCard.id}"]`)
    : null;

  if (selectedEl) {
    selectedEl.classList.remove('invalid-shake');
    setTimeout(() => selectedEl.classList.add('invalid-shake'), 0);
    setTimeout(() => selectedEl.classList.remove('invalid-shake'), 260);
  }

  const targetPile = target?.closest('.tableau-column, .tank-slot, .foundation-slot');
  if (targetPile) {
    targetPile.classList.remove('invalid-target-shake');
    setTimeout(() => targetPile.classList.add('invalid-target-shake'), 0);
    setTimeout(() => targetPile.classList.remove('invalid-target-shake'), 260);
  }

  showSolitaireToast('Invalid move for selected card.', 'invalid');
}

function triggerSlotSnap(slotType, index) {
  const selector = slotType === 'tank'
    ? `.tank-slot[data-tank="${index}"]`
    : `.foundation-slot[data-foundation="${index}"]`;

  const slotEl = document.querySelector(selector);
  if (!slotEl) return;

  slotEl.classList.remove('slot-snap');
  setTimeout(() => {
    slotEl.classList.add('slot-snap');
    setTimeout(() => slotEl.classList.remove('slot-snap'), 220);
  }, 0);
}

function attemptSelectedMoveToTarget(target, feedbackOnInvalid = false) {
  if (!S.selectedCard || !target) return false;

  const tankEl = target.closest('.tank-slot');
  if (tankEl) {
    const tankIndex = Number(tankEl.dataset.tank);
    if (S.tanks[tankIndex] !== null) {
      if (feedbackOnInvalid) showInvalidMoveFeedback(target);
      return false;
    }
    moveToTank(tankIndex);
    triggerSlotSnap('tank', tankIndex);
    clearSelection();
    return true;
  }

  const foundationEl = target.closest('.foundation-slot');
  if (foundationEl) {
    const fIndex = Number(foundationEl.dataset.foundation);
    if (!isValidFoundationMove(S.selectedCard, S.foundations[fIndex], fIndex)) {
      if (feedbackOnInvalid) showInvalidMoveFeedback(target);
      return false;
    }
    moveToFoundation(fIndex);
    triggerSlotSnap('foundation', fIndex);
    clearSelection();
    return true;
  }

  const tableauEl = target.closest('.tableau-column');
  if (tableauEl) {
    const colIndex = Number(tableauEl.dataset.col);
    if (!isValidTableauMove(S.selectedCard, S.tableau[colIndex])) {
      if (feedbackOnInvalid) showInvalidMoveFeedback(target);
      return false;
    }
    moveToTableau(colIndex);
    clearSelection();
    return true;
  }

  return false;
}

// Global handler to clear selection when clicking elsewhere
document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', (e) => {
    if (S.selectedCard === null) return;
    if (e.target.closest('.booster') || e.target.closest('.btn')) return;

    const isBoardDropIntent = Boolean(
      e.target.closest('.card') ||
      e.target.closest('.tank-slot') ||
      e.target.closest('.foundation-slot') ||
      e.target.closest('.tableau-column')
    );

    if (attemptSelectedMoveToTarget(e.target, isBoardDropIntent)) return;

    if (!e.target.closest('.card')) {
      clearSelection();
    }
  });
});

function handleDropTargetClick(target) {
  attemptSelectedMoveToTarget(target);
}

/* ------------------------------------------------------------
   8. MOVE VALIDATION
------------------------------------------------------------ */

/* ------------------------------------------------------------
   9. MOVE HANDLERS
------------------------------------------------------------ */

function moveToTank(tankIndex) {
  if (S.tanks[tankIndex] !== null) return; // tank full

  removeCardFromOrigin(S.selectedCard);
  S.selectedCard.faceDown = false;
  S.selectedCard.justRevealed = true;
  S.tanks[tankIndex] = S.selectedCard;

  revealNextCardInOrigin();
  renderBoard();
}

function moveToFoundation(fIndex) {
  const pile = S.foundations[fIndex];

  if (!isValidFoundationMove(S.selectedCard, pile, fIndex)) return;

  removeCardFromOrigin(S.selectedCard);
  S.selectedCard.faceDown = false;
  S.selectedCard.justRevealed = true;
  pile.push(S.selectedCard);

  revealNextCardInOrigin();
  updateProgress();
  updateHUD();
  renderBoard();
}

function moveToTableau(colIndex) {
  const column = S.tableau[colIndex];
  const topBefore = column[column.length - 1] || null;

  if (!isValidTableauMove(S.selectedCard, column)) return;

  removeCardFromOrigin(S.selectedCard);
  S.selectedCard.faceDown = false;
  S.selectedCard.justRevealed = true;
  column.push(S.selectedCard);

  const topAfter = S.selectedCard;

  handlePostMoveEffects(topBefore, topAfter, column, colIndex);
  revealNextCardInOrigin();
  updateHUD();
  renderBoard();
  
  // Trigger animation on the moved card
  setTimeout(() => {
    const el = document.querySelector(`[data-card-id="${S.selectedCard.id}"]`);
    if (el) {
      el.style.animation = 'none';
      setTimeout(() => {
        el.style.animation = '';
        el.classList.add('card-moved');
        setTimeout(() => el.classList.remove('card-moved'), 300);
      }, 10);
    }
  }, 50);
}

function handlePostMoveEffects(prevTop, newTop, column, colIndex) {
  if (!prevTop) return;

  if (prevTop.twist) {
    animateTwist(prevTop);
    applyTwistPenalty(prevTop);
  }
  if (newTop.twist) {
    animateTwist(newTop);
    applyTwistPenalty(newTop);
  }

  const matchType = getMatchType(prevTop, newTop);
  const prevType = getCardType(prevTop);
  const newType = getCardType(newTop);

  if (prevType === 'tool' && newType === 'solution') {
    addScore(BALANCE.toolSolutionScore);
    updateProgress(BALANCE.toolSolutionProgress);
  }

  if (matchType === 'challenge_solution') {
    const challengeCard = getCardType(prevTop) === 'challenge' ? prevTop : newTop;
    animateTwist(challengeCard);
    const challengeIndex = column.indexOf(challengeCard);
    if (challengeIndex !== -1) {
      column.splice(challengeIndex, 1);
      S.foundations[2].push(challengeCard);
    }
    S.challengeClears += 1;
    if (S.challengeClears % 2 === 0) {
      grantBooster('hint', 1, 'Challenge streak reward');
    }
    addScore(BALANCE.challengeSolutionScore);
    updateProgress(BALANCE.challengeSolutionProgress);
  }

  if (prevType === 'solution' && newType === 'impact') {
    S.multiplier = Math.min(S.multiplier + 1, BALANCE.maxMultiplier);
    addScore(BALANCE.impactScore);
    updateProgress(BALANCE.impactProgress);
  }

  if (matchType === 'impact') {
    S.multiplier = Math.min(S.multiplier + 1, BALANCE.maxMultiplier);
    addScore(BALANCE.impactScore);
    updateProgress(BALANCE.impactProgress);
  }

  if (newType !== 'impact' && !(prevType === 'solution' && newType === 'impact')) {
    S.multiplier = 1;
  }
}

function animateTwist(card) {
  const el = document.querySelector(`[data-card-id="${card.id}"]`);
  if (!el) return;

  el.classList.add('twist-activated');
  setTimeout(() => el.classList.remove('twist-activated'), 1200);
}

function applyTwistPenalty(card) {
  if (!card?.twist) return;

  stateScorePenalty(TWIST_SCORE_PENALTY);
  const lockedCard = lockRandomPlayableCard(TWIST_LOCK_SECS);

  if (lockedCard) {
    showSolitaireToast(`${card.name} twist: ${lockedCard.name} locked for ${TWIST_LOCK_SECS}s. -${TWIST_SCORE_PENALTY} points.`);
  } else {
    showSolitaireToast(`${card.name} twist: -${TWIST_SCORE_PENALTY} points.`);
  }

  updateHUD();
}

function stateScorePenalty(amount) {
  S.score = Math.max(0, S.score - Math.max(0, amount));
}

function lockRandomPlayableCard(durationSecs) {
  const candidates = [];

  for (let col = 0; col < S.tableau.length; col++) {
    const top = S.tableau[col][S.tableau[col].length - 1];
    if (!top) continue;
    if (top.faceDown || top.locked) continue;
    candidates.push(top);
  }

  for (let i = 0; i < S.tanks.length; i++) {
    const card = S.tanks[i];
    if (!card) continue;
    if (card.faceDown || card.locked) continue;
    candidates.push(card);
  }

  if (candidates.length === 0) return null;

  const lockedCard = candidates[Math.floor(Math.random() * candidates.length)];
  lockedCard.locked = true;

  setTimeout(() => {
    lockedCard.locked = false;
    if (!S.gameOver) renderBoard();
  }, durationSecs * 1000);

  return lockedCard;
}

function showSolitaireToast(message, type = 'twist') {
  const toastEl = document.getElementById('toast');
  if (!toastEl) return;

  toastEl.textContent = message;
  toastEl.className = `toast type-${type} show`;
  setTimeout(() => {
    if (toastEl.textContent === message) {
      toastEl.classList.remove('show');
    }
  }, 2400);
}

function grantBooster(type, amount = 1, reason = '') {
  if (!S.boosters[type]) S.boosters[type] = 0;
  S.boosters[type] += Math.max(0, amount);

  const label = type === 'hint' ? 'Hint' : 'Double Score';
  const suffix = reason ? ` (${reason})` : '';
  showSolitaireToast(`+${amount} ${label} booster${amount > 1 ? 's' : ''}${suffix}`);
}

function awardProgressBoosters() {
  while (S.progress >= S.nextBoosterProgress && S.nextBoosterProgress <= 100) {
    const type = S.nextBoosterProgress % 40 === 0 ? 'double' : 'hint';
    grantBooster(type, 1, `${S.nextBoosterProgress}% restored`);
    S.nextBoosterProgress += 20;
  }
}

function renderBoosterBar() {
  const barEl = document.getElementById('booster-bar');
  if (!barEl) return;

  const hintCount = S.boosters.hint || 0;
  const doubleCount = S.boosters.double || 0;
  const doubleActive = S.doubleScoreMoves > 0 ? ` (${S.doubleScoreMoves})` : '';

  barEl.innerHTML = `
    <button class="booster ${hintCount === 0 ? 'used' : ''}" data-booster="hint" ${hintCount === 0 || S.gameOver ? 'disabled' : ''} title="Reveal a suggested move">
      🔎 Hint x${hintCount}
    </button>
    <button class="booster ${doubleCount === 0 ? 'used' : ''}" data-booster="double" ${doubleCount === 0 || S.gameOver ? 'disabled' : ''} title="Next ${DOUBLE_SCORE_TURNS} score events are doubled">
      ✨ Double x${doubleCount}${doubleActive}
    </button>
  `;

  barEl.querySelectorAll('.booster').forEach(btn => {
    btn.addEventListener('click', () => useBooster(btn.dataset.booster));
  });
}

function useBooster(type) {
  if (S.gameOver) return;
  if (!S.boosters[type] || S.boosters[type] <= 0) return;

  if (type === 'hint') {
    S.boosters.hint -= 1;
    const hint = findHintMove();
    if (!hint) {
      showSolitaireToast('No clear hint available right now.');
      S.boosters.hint += 1;
      updateHUD();
      return;
    }
    showHint(hint.sourceEl, hint.targetEl);
    showSolitaireToast('Hint: try the highlighted move.');
  }

  if (type === 'double') {
    S.boosters.double -= 1;
    S.doubleScoreMoves += DOUBLE_SCORE_TURNS;
    showSolitaireToast(`Double Score active for next ${DOUBLE_SCORE_TURNS} scoring moves.`);
  }

  updateHUD();
}

function getHintCandidates() {
  const candidates = [];

  for (let col = 0; col < S.tableau.length; col++) {
    const top = S.tableau[col][S.tableau[col].length - 1];
    if (!top || top.faceDown || top.locked) continue;
    candidates.push(top);
  }

  for (let i = 0; i < S.tanks.length; i++) {
    const card = S.tanks[i];
    if (!card || card.faceDown || card.locked) continue;
    candidates.push(card);
  }

  return candidates;
}

function findHintMove() {
  const candidates = getHintCandidates();

  for (const card of candidates) {
    const origin = findCardOrigin(card);
    const sourceEl = document.querySelector(`.card[data-card-id="${card.id}"]`);

    for (let f = 0; f < S.foundations.length; f++) {
      if (!isValidFoundationMove(card, S.foundations[f], f)) continue;
      const targetEl = document.querySelector(`.foundation-slot[data-foundation="${f}"]`);
      if (sourceEl && targetEl) return { sourceEl, targetEl };
    }

    for (let col = 0; col < S.tableau.length; col++) {
      if (origin?.type === 'tableau' && origin.col === col) continue;
      if (!isValidTableauMove(card, S.tableau[col])) continue;
      const targetEl = document.querySelector(`.tableau-column[data-col="${col}"]`);
      if (sourceEl && targetEl) return { sourceEl, targetEl };
    }
  }

  return null;
}

function showHint(sourceEl, targetEl) {
  clearHintHighlights();
  sourceEl.classList.add('hint-source');
  targetEl.classList.add('hint-target');

  hintHighlightTimeout = setTimeout(() => {
    clearHintHighlights();
  }, 2200);
}

function clearHintHighlights() {
  if (hintHighlightTimeout) {
    clearTimeout(hintHighlightTimeout);
    hintHighlightTimeout = null;
  }

  document.querySelectorAll('.hint-source').forEach(el => el.classList.remove('hint-source'));
  document.querySelectorAll('.hint-target').forEach(el => el.classList.remove('hint-target'));
}

/* ------------------------------------------------------------
   9. HELPER FUNCTIONS
------------------------------------------------------------ */

function getCardType(card) {
  return card.type; // 'tool' | 'challenge' | 'solution' | 'impact'
}

function getCardTypeLabel(card) {
  if (card.type === 'tool') return 'Tool';
  if (card.type === 'challenge') return 'Challenge';
  if (card.type === 'solution') return 'Solution';
  if (card.type === 'impact') return 'Impact';
  return card.type;
}

function getCardActionHint(card) {
  if (card.type === 'tool') {
    return 'Play onto Tool or before Solution';
  }

  if (card.type === 'challenge') {
    const solution = FULL_DECK.find(c => c.type === 'solution' && c.pairId === card.pairId);
    return solution ? `Needs: ${solution.name}` : 'Clear with matching Solution';
  }

  if (card.type === 'solution') {
    const challenge = FULL_DECK.find(c => c.type === 'challenge' && c.id === card.pairId);
    return challenge ? `Fixes: ${challenge.name}` : 'Place on matching Challenge';
  }

  if (card.type === 'impact') {
    return 'Play after Solution to build multiplier';
  }

  return 'Use strategically';
}

function getCardPointValue(card) {
  if (card.type === 'tool' || card.type === 'solution') {
    return BALANCE.toolSolutionScore;
  }
  if (card.type === 'impact') {
    return BALANCE.impactScore;
  }
  if (card.type === 'challenge') {
    return 0; // Challenges don't award points directly
  }
  return 0;
}

function getMatchType(a, b) {
  const types = [getCardType(a), getCardType(b)].sort().join('_');
  if (types === 'tool_solution' || types === 'solution_tool') return 'tool_solution';
  if (types === 'challenge_solution') return 'challenge_solution';
  if (types === 'impact_impact') return 'impact';
  return null;
}

/* ------------------------------------------------------------
   10. VALIDATION RULES (PLACEHOLDERS)
------------------------------------------------------------ */

function isValidFoundationMove(card, pile, foundationIndex) {
  const type = getCardType(card);

  // Foundation 0: Tools
  if (foundationIndex === 0) {
    if (type !== 'tool') return false;
    // Optional: enforce ordering or uniqueness
    return true;
  }

  // Foundation 1: Solutions
  if (foundationIndex === 1) {
    if (type !== 'solution') return false;
    return true;
  }

  // Foundation 2: Challenges Cleared (we only place "cleared" markers or special cards here)
  if (foundationIndex === 2) {
    // If you represent cleared challenges as special cards, check that here.
    // For now, disallow direct placement.
    return false;
  }

  // Foundation 3: Impact
  if (foundationIndex === 3) {
    if (type !== 'impact') return false;
    // Allow stacking impact cards
    return true;
  }

  return false;
}

function isValidTableauMove(card, column) {
  const type = getCardType(card);

  // Empty column: allow any face-up card
  if (column.length === 0) {
    return !card.faceDown && !card.locked;
  }

  const top = column[column.length - 1];
  const topType = getCardType(top);

  // Disallow placing on face-down or locked cards
  if (top.faceDown || top.locked) return false;

  // Tool → Tool (tool chain)
  if (topType === 'tool' && type === 'tool') return true;

  // Tool → Solution
  if (topType === 'tool' && type === 'solution') return true;

  // Tool → Challenge (optional: only if you want "prep before challenge")
  // If you don't want this, remove this block.
  if (topType === 'tool' && type === 'challenge') return true;

  // Challenge → Challenge
  if (topType === 'challenge' && type === 'challenge') return true;

  // Challenge → Solution (clear challenge)
  if (topType === 'challenge' && type === 'solution') return true;
  
  // Solution → Solution (chain solutions)
  if (topType === 'solution' && type === 'solution') return true;

  // Solution → Impact (scoring combo)
  if (topType === 'solution' && type === 'impact') return true;

  // Impact → Impact (stack multipliers)
  if (topType === 'impact' && type === 'impact') return true;
  
  // Impact → Solution (unwind)
  if (topType === 'impact' && type === 'solution') return true;

  // Everything else is invalid
  return false;
}

/* ------------------------------------------------------------
   11. REMOVE CARD FROM ORIGIN
------------------------------------------------------------ */

function removeCardFromOrigin(card) {
  // Remove from tableau
  for (let col = 0; col < S.tableau.length; col++) {
    const idx = S.tableau[col].indexOf(card);
    if (idx !== -1) {
      S.tableau[col].splice(idx, 1);
      return;
    }
  }

  // Remove from tanks
  for (let i = 0; i < S.tanks.length; i++) {
    if (S.tanks[i] === card) {
      S.tanks[i] = null;
      return;
    }
  }

  // Remove from foundations (rare)
  for (let i = 0; i < S.foundations.length; i++) {
    const pile = S.foundations[i];
    const idx = pile.indexOf(card);
    if (idx !== -1) {
      pile.splice(idx, 1);
      return;
    }
  }
}

/* ------------------------------------------------------------
   12. REVEAL NEXT CARD IN ORIGIN COLUMN
------------------------------------------------------------ */

function revealNextCardInOrigin() {
  // Find the column the card came from (click-to-place origin).
  const origin = S.selectedFrom;
  if (!origin || origin.type !== 'tableau') return;

  const colIndex = origin.col;
  if (colIndex == null) return;

  const column = S.tableau[colIndex];
  if (column.length === 0) return;

  const topCard = column[column.length - 1];

  // Reveal if face-down
  if (topCard.faceDown) {
    topCard.faceDown = false;
    topCard.justRevealed = true;
    // Optional: add a flip animation delay
  }
}

/* ------------------------------------------------------------
   13. PROGRESS + WIN CONDITION
------------------------------------------------------------ */

function updateProgress(delta) {
  if (typeof delta === 'number' && delta !== 0) {
    S.progress = Math.min(100, Math.max(0, S.progress + delta));
  }

  // Foundation-based baseline progress plus any bonus progress gained from combos.
  const toolsProgress = (S.foundations[0].length / 12) * 30;
  const solutionsProgress = (S.foundations[1].length / 12) * 30;
  const clearedChallengesProgress = (S.foundations[2].length / 12) * 20;
  const impactProgress = (S.foundations[3].length / 16) * 20;
  const foundationBaseline = toolsProgress + solutionsProgress + clearedChallengesProgress + impactProgress;
  S.progress = Math.max(S.progress, Math.round(foundationBaseline));
  if (S.progress > 100) S.progress = 100;

  awardProgressBoosters();

  updateHUD();
  if (S.progress >= 100) triggerWin();
}

function addScore(baseAmount) {
  const hasDouble = S.doubleScoreMoves > 0;
  const effectiveMultiplier = hasDouble ? S.multiplier * 2 : S.multiplier;
  const gained = Math.round(baseAmount * effectiveMultiplier);
  S.score += gained;

  if (hasDouble) {
    S.doubleScoreMoves = Math.max(0, S.doubleScoreMoves - 1);
    if (S.doubleScoreMoves === 0) {
      showSolitaireToast('Double Score finished.');
    }
  }
}

function updateHUD() {
  const scoreEl = document.getElementById('score-value');
  if (scoreEl) scoreEl.textContent = String(S.score);

  const progressLabelEl = document.getElementById('progress-label');
  if (progressLabelEl) progressLabelEl.textContent = `Well ${S.progress}% Restored`;

  const progressFillEl = document.getElementById('progress-fill');
  if (progressFillEl) progressFillEl.style.width = `${S.progress}%`;

  const progressTrackEl = document.querySelector('.progress-bar-track');
  if (progressTrackEl) progressTrackEl.setAttribute('aria-valuenow', String(S.progress));

  const multiplierBadgeEl = document.getElementById('multiplier-badge');
  if (multiplierBadgeEl) {
    multiplierBadgeEl.textContent = `${S.multiplier}x Score!`;
    if (S.multiplier > 1) multiplierBadgeEl.classList.add('active');
    else multiplierBadgeEl.classList.remove('active');
  }

  renderBoosterBar();
  updateTimerUI();
  updateBestTimeUI();
}

function triggerWin() {
  S.gameOver = true;
  stopElapsedTimer();
  saveBestTime();

  if (typeof window.showScreen === 'function') {
    window.showScreen('win');
  } else {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    const winScreen = document.getElementById('win-screen');
    if (winScreen) winScreen.classList.add('active');
  }

  if (typeof window.startConfetti === 'function') {
    window.startConfetti();
  }
}

function startElapsedTimer() {
  S.startedAtMs = Date.now();
  S.elapsedSeconds = 0;
  S.timerInterval = setInterval(() => {
    if (S.gameOver) return;
    S.elapsedSeconds = Math.max(0, Math.floor((Date.now() - S.startedAtMs) / 1000));
    updateTimerUI();
  }, TIMER_TICK_MS);
}

function stopElapsedTimer() {
  if (!S.timerInterval) return;
  clearInterval(S.timerInterval);
  S.timerInterval = null;
}

function formatDuration(totalSeconds) {
  const secs = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(secs / 60);
  const rem = secs % 60;
  return `${mins}:${String(rem).padStart(2, '0')}`;
}

function getBestTimeStorageKey() {
  return `cw.bestTime.${BALANCE_PROFILE}`;
}

function getBestTimeSeconds() {
  try {
    const raw = localStorage.getItem(getBestTimeStorageKey());
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  } catch (_) {
    return null;
  }
}

function saveBestTime() {
  const current = Math.max(0, Math.floor(S.elapsedSeconds));
  if (current <= 0) return;

  const best = getBestTimeSeconds();
  if (best !== null && best <= current) {
    updateBestTimeUI();
    return;
  }

  try {
    localStorage.setItem(getBestTimeStorageKey(), String(current));
  } catch (_) {
    // Ignore storage failures in constrained environments.
  }

  updateBestTimeUI();
}

function updateTimerUI() {
  const timerValueEl = document.getElementById('timer-value');
  if (timerValueEl) timerValueEl.textContent = formatDuration(S.elapsedSeconds);

  const timerDisplayEl = document.getElementById('timer-display');
  if (timerDisplayEl) timerDisplayEl.classList.remove('warning');
}

function updateBestTimeUI() {
  const bestEl = document.getElementById('best-time-value');
  if (!bestEl) return;

  const best = getBestTimeSeconds();
  bestEl.textContent = best === null ? '--:--' : formatDuration(best);
}

function getSolitaireRunStats() {
  const best = getBestTimeSeconds();
  return {
    score: S.score,
    progress: S.progress,
    challenges: S.foundations[2].length,
    people: S.foundations[3].length * 50,
    timeSeconds: Math.max(0, Math.floor(S.elapsedSeconds)),
    timeLabel: formatDuration(S.elapsedSeconds),
    bestTimeSeconds: best,
    bestTimeLabel: best === null ? '--:--' : formatDuration(best),
  };
}

/* ------------------------------------------------------------
   14. UTILS
------------------------------------------------------------ */

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Expose initializer for the non-module UI controller in game.js.
window.initSolitaireGame = initSolitaireGame;
window.setBalanceProfile = setBalanceProfile;
window.getSolitaireRunStats = getSolitaireRunStats;
