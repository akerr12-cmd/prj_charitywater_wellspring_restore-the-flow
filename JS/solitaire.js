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
const STACK_OFFSET = 26; // slightly tighter, more elegant

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
      cardEl.style.top = `${depth * STACK_OFFSET}px`;
      cardEl.style.transition = 'top 0.25s ease';
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
  el.dataset.cardId = card.id;

  // Face-down state
  if (card.faceDown) el.classList.add('facedown');

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
          <span class="card-type-badge">${card.type}</span>
          ${twistIcon}
        </div>

        <!-- Center emoji -->
        <div class="card-emoji">${card.emoji}</div>

        <!-- Name -->
        <div class="card-name">${card.name}</div>

        <!-- Pair ID -->
        <div class="card-id">#${card.pairId}</div>

      </div>
    </div>
  `;

  /* ------------------------------------------------------------
     INTERACTION HANDLERS
     ------------------------------------------------------------ */

  // Click / keyboard select
  el.addEventListener('click', e => {
    if (card.faceDown || card.locked) return;
    startDrag(card, el, e); // tap-to-drag behavior
  });

  el.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (card.faceDown || card.locked) return;
      startDrag(card, el, e);
    }
  });

  // Mouse/touch drag
  el.addEventListener('mousedown', e => {
    if (card.faceDown || card.locked) return;
    startDrag(card, el, e);
  });

  el.addEventListener('touchstart', e => {
    if (card.faceDown || card.locked) return;
    startDrag(card, el, e);
  });

  return el;
}

/* ------------------------------------------------------------
   7. DRAG / TAP MOVEMENT SYSTEM
------------------------------------------------------------ */

function startDrag(card, el, event) {
  if (card.faceDown || card.locked) return;

  S.dragOrigin = findCardOrigin(card);
  S.isDragging = true;
  S.dragEl = el;
  S.selectedCard = card;

  el.classList.add('dragging');
  highlightDropTargets(card);

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

  clearDropTargets();
  attemptMoveToTarget(dropTarget);

  // Reset drag state
  S.dragEl.classList.remove('dragging');
  S.dragEl.style = '';
  S.isDragging = false;
  S.dragEl = null;
  S.dragOrigin = null;
  S.selectedCard = null;

  document.removeEventListener('mousemove', onDragMove);
  document.removeEventListener('mouseup', onDragEnd);
  document.removeEventListener('touchmove', onDragMove);
  document.removeEventListener('touchend', onDragEnd);
}

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
  // Find the column the card came from
  const colIndex = S.dragOrigin?.col;
  if (colIndex == null) return;

  const column = S.tableau[colIndex];
  if (column.length === 0) return;

  const topCard = column[column.length - 1];

  // Reveal if face-down
  if (topCard.faceDown) {
    topCard.faceDown = false;
    // Optional: add a flip animation delay
  }
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

// Expose initializer for the non-module UI controller in game.js.
window.initSolitaireGame = initSolitaireGame;
