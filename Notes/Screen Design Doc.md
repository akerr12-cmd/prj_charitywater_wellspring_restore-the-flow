# PIPELINE RESTORATION SOLITAIRE — SCREEN DESIGN DOCUMENT

This document outlines all required screens for the game, including UI elements, layout expectations, and Charity: Water–aligned visual direction.

---

# 1. TITLE SCREEN

## Purpose
Introduce the game, set the tone, and provide clear entry points into gameplay or instructions.

## Visual Style
- Charity: Water logo displayed prominently  
- Brand colors: **yellow (#FFD200), blue (#00AEEF), white, black**  
- Clean, modern layout  
- Subtle animated **water ripple** background or overlay  
- Minimalist, uplifting Charity: Water–style typography  

## UI Elements
- **Start Button**  
  - Takes player to the Game Screen  
- **How to Play Button**  
  - Opens the How to Play screen or modal  
- **Quit Button**  
  - Closes the game (desktop) or returns to system home (mobile)  
- **Footer Branding**  
  - “Inspired by Charity: Water”  
  - Small, respectful logo usage  

---

# 2. GAME SCREEN (PLAY SCREEN)

## Purpose
Main gameplay area where players interact with cards, manage sequences, and progress toward restoring the well.

## Layout Requirements
- Fully responsive for **desktop and mobile**  
- Touch‑friendly card interactions  
- Clear spacing between columns  
- Water Tanks (free cells) displayed at top  
- Foundations displayed on right side or top‑right  

## UI Elements

### **Top Bar**
- **Pause Button**  
- **Reset Button**  
- **Return to Main Menu Button**  

### **Game HUD**
- **Score Counter**  
  - Updates dynamically as sequences, clears, and combos occur  
- **Progress Meter**  
  - Displays: “Well X% Restored”  
  - Fills as Challenges are cleared and Foundations are built  
- **Consumables & Boosters Bar**  
  - Small icons/buttons for player‑usable items  
  - Examples:  
    - *“Reveal 1 Hidden Card”*  
    - *“Clear Minor Obstacle”*  
    - *“Swap Two Cards”*  
    - *“Freeze Penalty Timer”*  
  - Each booster shows:  
    - Quantity remaining  
    - Cooldown (if applicable)  

### **Main Play Area**
- **8 Tableau Columns**  
  - Some cards face‑down  
  - Some locked behind Challenges  
- **4–6 Water Tanks (Free Cells)**  
  - Temporary storage slots  
- **4 Foundations**  
  - Tools  
  - Solutions  
  - Challenges Cleared  
  - Impact Cards  

---

# 3. WIN CONDITION & CELEBRATION SCREEN

## Trigger
Occurs when the player:
1. Clears all Challenges  
2. Completes all Foundations  
3. Uncovers the Well Card  
4. Places the final Solution on the Well Card  

## Celebration Elements
- **Confetti Burst Animation**  
- **Water Splash Animation**  
- **Large Win Message:**  
  - “You Restored Clean Water!”  
- **Emotional Microcopy (Charity: Water tone):**  
  - “Your strategy brought hope back to this community.”  
  - “Clean water changes everything.”  
- **Soft Drum Loop or Gentle Water Sound**  
  - Optional toggle for sound‑off  

## Transition
After celebration finishes (or when player taps “Continue”), the game moves to the **Impact Screen**.

---

# 4. IMPACT SCREEN

## Purpose
Provide emotional payoff and reinforce the real‑world meaning behind the gameplay.

## Visual Style
- Charity: Water brand photography or silhouettes  
- Clean, spacious layout  
- Warm, hopeful tone  

## Displayed Stats
- **Final Score**  
- **Number of Challenges Overcome**  
- **Number of People “Helped”**  
  - Fictional but meaningful metric tied to score  
- **Time Taken**  
- **Boosters Used**  
- **Longest Sequence Chain** (optional)  

## UI Elements
- **Return to Main Menu Button**  
- **Play Again Button** (optional)  
- **Share Button** (optional, for social media or campus events)  

---

# 5. HOW TO PLAY SCREEN

## Purpose
Teach the player the rules quickly and clearly.

## Content
- Card type explanations (Tools, Challenges, Solutions, Impact)  
- Valid sequences  
- How to clear Challenges  
- How Water Tanks work  
- How to win  
- Booster explanations  
- Simple diagrams or icons  

## UI Elements
- Scrollable content  
- “Back to Title” button  
- Optional “Start Game” button  

---

# 6. BOOSTERS & CONSUMABLES (GLOBAL UI ELEMENTS)

## Purpose
Give players strategic tools without microtransactions.

## Booster Types (Examples)
- **Reveal Card**  
  - Flip one hidden card  
- **Minor Clear**  
  - Remove a low‑tier Challenge  
- **Swap Cards**  
  - Swap any two visible cards  
- **Slow Penalty**  
  - Freeze or slow a spreading Challenge  
- **Extra Tank Slot**  
  - Temporarily adds a Water Tank  

## Placement
- Displayed as small icons on the **Game Screen**  
- Show quantity remaining  
- Greyed out when unavailable  

## Acquisition
- Earned through:  
  - Clearing specific Challenges  
  - Completing sequences  
  - Reaching progress milestones  
  - Impact Card bonuses  

---

# 7. PAUSE SCREEN (OVERLAY)

## UI Elements
- Resume  
- Restart  
- Return to Main Menu  
- Sound on/off  
- Quick reference for card types (optional)  

---

# 8. ERROR / NO MOVES SCREEN (OPTIONAL)

## Trigger
If the player reaches a state with no valid moves.

## UI Elements
- “No Moves Left” message  
- Suggest using a booster  
- Offer Restart  
- Offer Return to Main Menu  

---

# SUMMARY OF ALL SCREENS

1. **Title Screen**  
2. **How to Play Screen**  
3. **Game Screen**  
4. **Pause Screen**  
5. **Win Celebration Screen**  
6. **Impact Screen**  
7. **No Moves / Error Screen** (optional)  

Each screen supports Charity: Water’s brand identity and the emotional arc of restoring clean water.

---
