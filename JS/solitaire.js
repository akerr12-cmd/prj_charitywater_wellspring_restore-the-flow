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

// Placeholder — we will replace with the full 52-card deck
import { FULL_DECK } from './deck.js';

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
  isDragging: false,
  dragEl: null,
  dragOrigin: null,
  gameOver: false,
  score: 0,
  progress: 0,
};

/* ------------------------------------------------------------
   3. INITIALIZATION
------------------------------------------------------------ */

export function initSolitaireGame() {
  S = {
    ...S,
    deck: shuffle([...FULL_DECK]),
    tableau: Array.from({ length: NUM_TABLEAU_COLUMNS }, () => []),
    tanks: Array.from({ length: NUM_TANKS }, () => null),
    foundations: Array.from({ length: NUM_FOUNDATIONS }, () => []),
    selectedCard: null,
    selectedFrom: null,
    isDragging: false,
    dragEl: null,
    dragOrigin: null,
    gameOver: false,
    score: 0,
    progress: 0,
  };

  dealInitialLayout();
  renderBoard();
}

/* ------------------------------------------------------------
   4. DEALING THE INITIAL LAYOUT
------------------------------------------------------------ */

function dealInitialLayout() {
  // Deal cards into 8 columns, layered
  let deckIndex = 0;

  for (let col = 0; col < NUM_TABLEAU_COLUMNS; col++) {
    const depth = 6 + Math.floor(Math.random() * 3); // 6–8 cards per column
    for (let i = 0; i < depth; i++) {
      const card = S.deck[deckIndex++];
      card.faceDown = i < depth - 1; // all but last card face-down
      card.locked = false;
      S.tableau[col].push(card);
    }
  }

  // Remaining cards go to a draw pile (optional future feature)
}

/* ------------------------------------------------------------
   5. RENDERING THE BOARD
------------------------------------------------------------ */

function renderBoard() {
  renderTableau();
  renderTanks();
  renderFoundations();
}

/* ---------------- TABLEAU ---------------- */

function renderTableau() {
  const container = document.getElementById('tableau');
  container.innerHTML = '';

  S.tableau.forEach((column, colIndex) => {
    const colEl = document.createElement('div');
    colEl.className = 'tableau-column';
    colEl.dataset.col = colIndex;

    column.forEach((card, depth) => {
      const cardEl = buildCardEl(card);
      cardEl.style.top = `${depth * 28}px`; // stacking offset
      cardEl.dataset.col = colIndex;
      cardEl.dataset.index = depth;

      colEl.appendChild(cardEl);
    });

    container.appendChild(colEl);
  });
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
  if (card.faceDown) el.classList.add('facedown');
  if (card.locked) el.classList.add('locked');

  el.innerHTML = `
    <div class="card-inner">
      <div class="card-face card-back-face"></div>
      <div class="card-face card-front-face type-${card.type}">
        <span class="card-type-label">${card.type}</span>
        <span class="card-emoji">${card.emoji}</span>
        <span class="card-name">${card.name}</span>
      </div>
    </div>
  `;

  el.addEventListener('mousedown', e => startDrag(card, el, e));
  el.addEventListener('touchstart', e => startDrag(card, el, e));

  return el;
}

/* ------------------------------------------------------------
   7. DRAG / TAP MOVEMENT SYSTEM
------------------------------------------------------------ */

function startDrag(card, el, event) {
  if (card.faceDown || card.locked) return;

  S.isDragging = true;
  S.dragEl = el;
  S.selectedCard = card;

  el.classList.add('dragging');

  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('mouseup', onDragEnd);
  document.addEventListener('touchmove', onDragMove);
  document.addEventListener('touchend', onDragEnd);
}

function onDragMove(event) {
  if (!S.isDragging || !S.dragEl) return;

  const x = event.touches ? event.touches[0].clientX : event.clientX;
  const y = event.touches ? event.touches[0].clientY : event.clientY;

  S.dragEl.style.position = 'fixed';
  S.dragEl.style.left = `${x - 40}px`;
  S.dragEl.style.top = `${y - 60}px`;
  S.dragEl.style.zIndex = 9999;
}

function onDragEnd(event) {
  if (!S.isDragging) return;

  const dropTarget = document.elementFromPoint(
    event.changedTouches ? event.changedTouches[0].clientX : event.clientX,
    event.changedTouches ? event.changedTouches[0].clientY : event.clientY
  );

  attemptMoveToTarget(dropTarget);

  // Reset drag state
  S.dragEl.classList.remove('dragging');
  S.dragEl.style = '';
  S.isDragging = false;
  S.dragEl = null;
  S.selectedCard = null;

  document.removeEventListener('mousemove', onDragMove);
  document.removeEventListener('mouseup', onDragEnd);
  document.removeEventListener('touchmove', onDragMove);
  document.removeEventListener('touchend', onDragEnd);
}

/* ------------------------------------------------------------
   8. MOVE VALIDATION
------------------------------------------------------------ */

function attemptMoveToTarget(target) {
  if (!target) return;

  // Tank drop
  if (target.closest('.tank-slot')) {
    const tankIndex = Number(target.closest('.tank-slot').dataset.tank);
    return moveToTank(tankIndex);
  }

  // Foundation drop
  if (target.closest('.foundation-slot')) {
    const fIndex = Number(target.closest('.foundation-slot').dataset.foundation);
    return moveToFoundation(fIndex);
  }

  // Tableau drop
  if (target.closest('.tableau-column')) {
    const colIndex = Number(target.closest('.tableau-column').dataset.col);
    return moveToTableau(colIndex);
  }
}

/* ------------------------------------------------------------
   9. MOVE HANDLERS
------------------------------------------------------------ */

function moveToTank(tankIndex) {
  if (S.tanks[tankIndex] !== null) return; // tank full

  removeCardFromOrigin(S.selectedCard);
  S.tanks[tankIndex] = S.selectedCard;

  renderBoard();
}

function moveToFoundation(fIndex) {
  const pile = S.foundations[fIndex];

  if (!isValidFoundationMove(S.selectedCard, pile, fIndex)) return;

  removeCardFromOrigin(S.selectedCard);
  pile.push(S.selectedCard);

  updateProgress();
  renderBoard();
}

function moveToTableau(colIndex) {
  const column = S.tableau[colIndex];
  const topBefore = column[column.length - 1] || null;

  if (!isValidTableauMove(S.selectedCard, column)) return;

  removeCardFromOrigin(S.selectedCard);
  column.push(S.selectedCard);

  const topAfter = S.selectedCard;

  handlePostMoveEffects(topBefore, topAfter, column, colIndex);
  revealNextCardInOrigin();
  renderBoard();
}

function handlePostMoveEffects(prevTop, newTop, column, colIndex) {
  if (!prevTop) return;

  const matchType = getMatchType(prevTop, newTop);

  if (matchType === 'challenge_solution') {
    // Clear challenge, update progress, maybe move a "cleared" marker to foundation 2
    // TODO: implement your challenge-clearing logic here
  }

  if (matchType === 'impact') {
    // Impact combo: score multiplier, people helped, etc.
    // TODO: implement your impact logic here
  }
}

/* ------------------------------------------------------------
   9. HELPER FUNCTIONS
------------------------------------------------------------ */

function getCardType(card) {
  return card.type; // 'tool' | 'challenge' | 'solution' | 'impact'
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

  // Challenge → Solution (clear challenge)
  if (topType === 'challenge' && type === 'solution') return true;

  // Solution → Impact (scoring combo)
  if (topType === 'solution' && type === 'impact') return true;

  // Impact → Impact (stack multipliers)
  if (topType === 'impact' && type === 'impact') return true;

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
  // TODO: reveal face-down card if needed
}

/* ------------------------------------------------------------
   13. PROGRESS + WIN CONDITION
------------------------------------------------------------ */

function updateProgress() {
  // TODO: update S.progress based on foundations
  if (S.progress >= 100) triggerWin();
}

function triggerWin() {
  S.gameOver = true;
  showScreen('win');
  startConfetti();
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
