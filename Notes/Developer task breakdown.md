# PIPELINE RESTORATION SOLITAIRE  
## DEVELOPER TASK BREAKDOWN  
*Front‑End • Game Logic • Assets • Audio*

---

# 1. FRONT‑END DEVELOPMENT TASKS

## Core Layout & Structure
- [ ] Build responsive layout container (desktop + mobile)
- [ ] Implement 8‑column tableau grid
- [ ] Implement Water Tanks (4–6 free cells)
- [ ] Implement Foundations area (4 piles)
- [ ] Implement Well Card reveal area
- [ ] Create scalable card container component
- [ ] Add card type color‑coding (Tools, Challenges, Solutions, Impact)

## UI Screens
### Title Screen
- [ ] Layout structure
- [ ] Add Start / How to Play / Quit buttons
- [ ] Add ripple animation background
- [ ] Add Charity: Water branding

### How to Play Screen
- [ ] Scrollable instructions layout
- [ ] Card type icons + descriptions
- [ ] Sequencing rules section
- [ ] Booster explanations
- [ ] Back to Title button

### Game Screen
- [ ] HUD: Score counter
- [ ] HUD: Progress meter (“Well X% Restored”)
- [ ] Booster bar with quantities
- [ ] Pause / Reset / Return buttons
- [ ] Responsive card scaling
- [ ] Touch + click support

### Pause Screen
- [ ] Resume / Restart / Main Menu buttons
- [ ] Sound toggle

### Win Celebration Screen
- [ ] Confetti animation container
- [ ] Water splash animation container
- [ ] “You Restored Clean Water!” message
- [ ] Emotional microcopy
- [ ] Continue button → Impact Screen

### Impact Screen
- [ ] Final score display
- [ ] Challenges cleared
- [ ] People helped metric
- [ ] Time taken
- [ ] Boosters used
- [ ] Return to Main Menu button
- [ ] Charity: Water photography/silhouette background

### No Moves Screen (Optional)
- [ ] “No Moves Left” message
- [ ] Suggest booster usage
- [ ] Restart / Main Menu buttons

## UI Components
- [ ] Buttons (primary, secondary, ghost)
- [ ] Modals (pause, how to play, no moves)
- [ ] Progress bar component
- [ ] Booster icon component
- [ ] Card flip animation
- [ ] Card hover/active states

---

# 2. GAME LOGIC DEVELOPMENT TASKS

## Card System
- [ ] Create 52‑card deck data structure
- [ ] Assign card types (Tool, Challenge, Solution, Impact)
- [ ] Assign challenge‑solution relationships
- [ ] Assign impact bonuses
- [ ] Assign penalty card behaviors

## Deck & Board Setup
- [ ] Shuffle algorithm
- [ ] Deal cards into 8 tableau columns
- [ ] Randomize hidden/locked layers
- [ ] Place Well Card at bottom of deepest column
- [ ] Initialize Water Tanks
- [ ] Initialize Foundations

## Movement & Sequencing Logic
- [ ] Implement valid sequence detection
- [ ] Prevent invalid sequences
- [ ] Allow multi‑card moves (if rules permit)
- [ ] Implement drag‑and‑drop or tap‑to‑move
- [ ] Implement Water Tank storage rules
- [ ] Implement Foundation placement rules

## Challenge & Solution Logic
- [ ] Detect when a Solution is applied to a Challenge
- [ ] Clear Challenge + unlock layers
- [ ] Trigger challenge‑specific effects (e.g., Contamination Spread)
- [ ] Update progress meter

## Impact Card Logic
- [ ] Apply score multipliers
- [ ] Reveal hidden cards (if applicable)
- [ ] Grant free moves or prevent penalties
- [ ] Stack impact chains

## Penalty & Twist Mechanics
- [ ] Contamination Spread: lock columns
- [ ] Heatwave: reduce available moves temporarily
- [ ] Water Theft: remove Impact Card unless countered
- [ ] Blocked Well: prevent final placement
- [ ] Timer‑based penalties (if used)

## Booster Logic
- [ ] Reveal Hidden Card booster
- [ ] Minor Challenge Clear booster
- [ ] Swap Two Cards booster
- [ ] Freeze Penalty Timer booster
- [ ] Temporary Extra Water Tank booster
- [ ] Booster cooldowns
- [ ] Booster inventory system

## Win Condition Logic
- [ ] Detect when all Challenges are cleared
- [ ] Detect when all Foundations are complete
- [ ] Detect when Well Card is uncovered
- [ ] Detect when final Solution is placed
- [ ] Trigger win celebration

## Fail Condition Logic
- [ ] Detect no valid moves
- [ ] Trigger No Moves Screen
- [ ] Suggest booster usage

---

# 3. ASSET DEVELOPMENT TASKS

## Visual Assets
- [ ] Card front template
- [ ] Card back template
- [ ] 52 card illustrations/icons
- [ ] Challenge icons
- [ ] Solution icons
- [ ] Tool icons
- [ ] Impact card icons
- [ ] Booster icons
- [ ] Progress meter graphics
- [ ] Ripple animation background
- [ ] Confetti animation sprites
- [ ] Water splash animation sprites
- [ ] Title screen background
- [ ] Impact screen photography/silhouettes

## Branding
- [ ] Apply Charity: Water color palette
- [ ] Apply Montserrat + Open Sans typography
- [ ] Ensure logo usage compliance

## Animation Assets
- [ ] Card flip frames (if sprite‑based)
- [ ] Challenge clear effects
- [ ] Impact glow effects
- [ ] Win celebration animations

---

# 4. AUDIO DEVELOPMENT TASKS

## Sound Effects
- [ ] Card flip sound
- [ ] Challenge clear sound
- [ ] Solution applied sound
- [ ] Booster activation sound
- [ ] Penalty alert sound
- [ ] No moves alert sound
- [ ] Button click sounds

## Ambient Audio
- [ ] Soft water loop for gameplay
- [ ] Subtle wind or nature ambience (optional)

## Win Celebration Audio
- [ ] Water splash sound
- [ ] Soft drum loop
- [ ] Celebration chime

## Audio Controls
- [ ] Mute/unmute toggle
- [ ] Volume balancing
- [ ] Fade‑in/fade‑out transitions

---

# 5. INTEGRATION & POLISH

## Integration Tasks
- [ ] Connect UI to game logic
- [ ] Connect boosters to game logic
- [ ] Connect animations to events
- [ ] Connect audio to events
- [ ] Connect win condition to celebration screen
- [ ] Connect celebration screen to Impact Screen

## Polish Tasks
- [ ] Smooth card movement easing
- [ ] Refine animation timing
- [ ] Improve mobile spacing
- [ ] Add subtle shadows and depth
- [ ] Optimize asset loading
- [ ] Add accessibility improvements (contrast, text size)

---

# 6. TESTING & QA

## Functional Testing
- [ ] Card movement
- [ ] Booster usage
- [ ] Challenge clearing
- [ ] Impact bonuses
- [ ] Penalty triggers
- [ ] Win condition
- [ ] No moves detection

## UX Testing
- [ ] Mobile usability
- [ ] Desktop usability
- [ ] Button placement
- [ ] Readability
- [ ] Tutorial clarity

## Bug Fixing
- [ ] Card overlap issues
- [ ] Incorrect sequence detection
- [ ] Booster misfires
- [ ] Animation glitches
- [ ] Audio timing issues
- [ ] Layout overflow issues

---

# 7. FINALIZATION

## Final Build Tasks
- [ ] Code cleanup
- [ ] Asset compression
- [ ] Performance optimization
- [ ] Accessibility pass
- [ ] Branding compliance check

## Launch Prep
- [ ] Promotional screenshots
- [ ] Short game description
- [ ] Demo video (optional)
- [ ] Presentation deck (optional)

---
