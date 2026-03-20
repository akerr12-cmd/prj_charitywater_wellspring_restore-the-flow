# PIPELINE RESTORATION SOLITAIRE  

## MASTER DEVELOPMENT & DESIGN DOCUMENT  

*A complete blueprint for building the Charity: Water–themed hybrid solitaire game.*

---

# 1. CORE VISION

## Game Fantasy

You lead a water‑restoration effort in a community whose pipeline system has collapsed.  
Each card represents a real part of the clean‑water journey: Tools, Challenges, Solutions, and Impact moments.

## Goals

- Untangle the broken pipeline  
- Clear obstacles  
- Uncover the Well Card  
- Restore clean water  

## Target Audience

College students.

## Tone & Branding

- Hopeful, modern, clean  
- Charity: Water color palette  
- Montserrat + Open Sans  
- Generous whitespace  
- Subtle water‑themed motion  

---

# 2. BRANDING & STYLE GUIDE

## Color Palette

| Name | Hex | Usage |
|------|------|--------|
| Jerry Can Yellow | `#FFC907` | Primary accents, buttons |
| Deep Water Blue | `#003366` | Headers, contrast |
| Sky Blue | `#00AEEF` | Progress, accents |
| White | `#FFFFFF` | Clean space |
| Black | `#000000` | Text on light backgrounds |
| Soft Gray | `#F2F2F2` | Panels, cards |
| Slate Gray | `#4A4A4A` | Secondary text |
| Aqua Tint | `#D9F4FF` | Water highlights |

## Typography

- Montserrat — titles, headers, buttons  
- Open Sans — body text  
- Weights: 700, 600, 400, 300  

## Spacing Scale

- 4px / 8px / 16px / 24px / 32px / 48px  
- Generous whitespace  
- Clean hierarchy  
- Responsive scaling  

## Buttons

- Primary (Yellow)  
- Secondary (Blue)  
- Ghost (Outline Blue)  

## Card Design

- White card base  
- Soft shadow  
- Left‑border color coding:  
  - Tools → Sky Blue  
  - Challenges → Deep Water Blue  
  - Solutions → Yellow  
  - Impact → Aqua Tint  

## Backgrounds & Effects

- Ripple animation  
- Gradient (Sky Blue → White)  
- Smooth progress bar  

## Animations

- Confetti  
- Water splash  
- Card flip (0.2–0.3s)  

## Accessibility

- 4.5:1 contrast  
- 44px minimum button height  
- Avoid yellow text on white  
- Sound toggle  

---

# 3. GAME STRUCTURE

## Tableau

- 8 columns  
- Some cards hidden or locked  
- Depth varies  

## Water Tanks (Free Cells)

- 4–6 slots  
- Temporary storage  
- Some card types cannot be stored  

## Foundations

1. Tools  
2. Solutions  
3. Challenges Cleared  
4. Impact Cards  

All must be completed to win.

---

# 4. CARD SYSTEM

## Tools

- Prepare or weaken Challenges  
- Can chain together  
- Often required before Solutions  

## Challenges

- Block progress  
- Some freeze columns  
- Some spread penalties  
- Often immovable  

## Solutions

- Clear specific Challenges  
- Reveal hidden layers  
- Advance Solutions foundation  

## Impact Cards

- Score multipliers  
- Reveal hidden cards  
- Grant free moves or prevent penalties  

---

# 5. SEQUENCING RULES

## Valid Sequences

- Tool → Tool  
- Tool → Solution  
- Challenge → Solution  
- Tool → Challenge → Solution  
- Solution → Impact  
- Impact → Impact  

## Invalid Sequences

- Challenge → Challenge  
- Impact → Challenge  
- Solution → Tool  
- Impact → Tool  
- Solution → Challenge (wrong type)  

---

# 6. MATCHING & INTERACTION MATRIX

## Challenge → Required Solution

- Drought → Emergency Water Delivery  
- Broken Pump → New Pump  
- Contamination → Anti‑Contamination Protocol  
- Mudslide → Well Cleaning Crew  
- Heatwave → Solar Panel Repair  
- Rusted Pipe → Pipe Replacement  
- Water Theft → Community Training  
- Supply Delay → Pressure Regulator  
- Low Water Pressure → Pressure Regulator  
- Blocked Well → Leak Seal Operation  
- Clogged Intake → Intake Repair Team  
- Pipe Burst → Leak Seal Operation  

## Tool → Challenge Preparation

- Rope → Mudslide  
- Pipe → Rusted Pipe / Pipe Burst  
- Water Filter → Contamination  
- Wrench → Broken Pump  
- PVC Connector → Low Pressure  
- Solar Charger → Heatwave  
- Water Testing Strips → Contamination  
- Tool Kit → Any Challenge  
- Replacement Valve → Low Pressure  
- Sealant Tape → Pipe Burst  
- Drill Bit → Blocked Well  
- Water Jug → Drought  

## Impact Card Bonuses

- Score multipliers  
- Free moves  
- Reveal hidden cards  
- Penalty prevention  

---

# 7. TWIST MECHANICS

- Contamination Spread — locks columns  
- Heatwave — reduces moves  
- Water Theft — steals Impact Card  
- Blocked Well — prevents final placement  
- Storage Limits — some cards degrade or cannot be stored  

---

# 8. WIN & FAIL CONDITIONS

## Win Conditions

1. All Challenges cleared  
2. All Foundations complete  
3. Well Card uncovered  
4. Final Solution placed on Well Card  

Triggers:

- Confetti  
- Water splash  
- Win message  
- Transition to Impact Screen  

## Fail Conditions

- No valid moves  
- Tanks full + no sequences  
- Spreading Challenge locks too many columns  

---

# 9. SCREEN DESIGNS

## Title Screen

- Start / How to Play / Quit  
- Ripple background  
- Charity: Water branding  

## How to Play Screen

- Card types  
- Valid sequences  
- Challenge clearing  
- Boosters  
- Scrollable  

## Game Screen

- Top bar: Pause / Reset / Main Menu  
- HUD: Score, Progress Meter  
- Booster bar  
- Tableau (8 columns)  
- Water Tanks  
- Foundations  

## Pause Screen

- Resume / Restart / Main Menu  
- Sound toggle  

## Win Celebration Screen

- Confetti  
- Water splash  
- Win message  
- Continue → Impact Screen  

## Impact Screen

- Final score  
- Challenges cleared  
- People helped  
- Time taken  
- Boosters used  
- Return to Main Menu  

## No Moves Screen

- “No Moves Left”  
- Suggest booster  
- Restart / Main Menu  

---

# 10. BOOSTERS & CONSUMABLES

## Booster Types

- Reveal Hidden Card  
- Minor Challenge Clear  
- Swap Two Cards  
- Freeze Penalty Timer  
- Temporary Extra Water Tank  

## Acquisition

- Clearing Challenges  
- Completing sequences  
- Impact bonuses  
- Progress milestones  

---

# 11. DEVELOPMENT ROADMAP

## Phase 1 — Pre‑Production

- Finalize gameplay model  
- Define deck  
- Define sequencing rules  
- Create Matching/Sequencing Matrix  
- Write full ruleset  
- Create CSS Style Guide  
- Create Screen Design Doc  

## Phase 2 — UX/UI Planning

- Wireframes  
- Navigation flow  
- Responsive layout planning  

## Phase 3 — Asset Creation

- Card templates  
- 52 illustrations  
- Booster icons  
- Progress meter  
- Ripple backgrounds  
- Confetti & splash animations  
- Audio assets  

## Phase 4 — Gameplay System Development

- Card data structure  
- Shuffle + deal  
- Tableau logic  
- Water Tank logic  
- Foundation logic  
- Hidden/locked layers  
- Challenge/Solution logic  
- Impact bonuses  
- Penalty mechanics  
- Booster logic  
- HUD logic  

## Phase 5 — Screen Implementation

- Title  
- How to Play  
- Game  
- Pause  
- Win Celebration  
- Impact  
- No Moves  

## Phase 6 — Polish

- Spacing  
- Shadows  
- Animation timing  
- Audio balancing  
- Smooth transitions  

## Phase 7 — Testing & QA

- Functional testing  
- UX testing  
- Bug fixing  

## Phase 8 — Finalization & Launch Prep

- Code cleanup  
- Asset optimization  
- Accessibility pass  
- Branding compliance  
- Screenshots + description  

---

# 12. SUMMARY

This document consolidates:

- Branding  
- Ruleset  
- Sequencing logic  
- All screens  
- All gameplay systems  
- All boosters  
- All animations  
- Full development roadmap  

It serves as the single source of truth for building Pipeline Restoration Solitaire.
