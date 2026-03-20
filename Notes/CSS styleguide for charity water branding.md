# PIPELINE RESTORATION SOLITAIRE  
## CSS STYLE GUIDE — CHARITY: WATER BRANDING

This style guide defines the visual language for all screens in the game, ensuring alignment with Charity: Water’s clean, modern, hopeful aesthetic.

---

# 1. COLOR PALETTE

## Primary Colors
| Name | Hex | Usage |
|------|------|--------|
| **Jerry Can Yellow** | `#FFC907` | Primary accents, buttons, highlights |
| **Deep Water Blue** | `#003366` | Backgrounds, headers, strong contrast |
| **Sky Blue** | `#00AEEF` | Progress meters, soft accents |
| **White** | `#FFFFFF` | Text on dark backgrounds, clean space |
| **Black** | `#000000` | Text on light backgrounds, subtle outlines |

## Secondary Colors
| Name | Hex | Usage |
|------|------|--------|
| **Soft Gray** | `#F2F2F2` | Panels, card backgrounds |
| **Slate Gray** | `#4A4A4A` | Secondary text |
| **Aqua Tint** | `#D9F4FF` | Water‑themed highlights |

---

# 2. TYPOGRAPHY

## Primary Font
**Montserrat**  
- Clean, modern, geometric  
- Used for titles, buttons, headers  

## Secondary Font
**Open Sans**  
- Highly readable  
- Used for body text, instructions, card descriptions  

## Font Weights
- 700 — Bold (titles, headers)  
- 600 — Semi‑bold (buttons, labels)  
- 400 — Regular (body text)  
- 300 — Light (subtle UI text)  

## Example Usage
```css
h1, h2, h3 {
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
}

p, li, span {
  font-family: 'Open Sans', sans-serif;
  font-weight: 400;
}

--
SPACING & LAYOUT
Spacing Scale
4px — micro spacing

8px — small spacing

16px — standard spacing

24px — large spacing

32px — section spacing

48px — major layout spacing

Layout Principles
Generous whitespace

Clean, breathable spacing

Clear visual hierarchy

Avoid clutter

Centered or left‑aligned content depending on screen

Responsive Behavior
Cards scale down proportionally

Buttons become full‑width on mobile

Progress meter moves to top on mobile

Water Tanks stack horizontally on desktop, vertically on mobile

--

## Button Styles
Primary Button (Yellow)
.btn-primary {
  background-color: #FFC907;
  color: #000;
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: 600;
  border: none;
  transition: 0.2s ease;
}
.btn-primary:hover {
  background-color: #e0b000;
}


Secondary Button (Blue)
.btn-secondary {
  background-color: #003366;
  color: #fff;
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: 600;
  border: none;
  transition: 0.2s ease;
}
.btn-secondary:hover {
  background-color: #00264d;
}

Tertiary Button (Ghost)
.btn-ghost {
  background: transparent;
  color: #003366;
  border: 2px solid #003366;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 600;
}
.btn-ghost:hover {
  background: #003366;
  color: #fff;
}

## Card Desgin

Card Container
.card {
  background-color: #FFFFFF;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  padding: 12px;
  transition: transform 0.15s ease;
}
.card:hover {
  transform: translateY(-4px);
}


Card Types (Color Coding)
Tools — Sky Blue border (#00AEEF)
Challenges — Deep Water Blue border (#003366)
Solutions — Jerry Can Yellow border (#FFC907)
Impact Cards — Aqua Tint border (#D9F4FF)

.card.tool { border-left: 6px solid #00AEEF; }
.card.challenge { border-left: 6px solid #003366; }
.card.solution { border-left: 6px solid #FFC907; }
.card.impact { border-left: 6px solid #D9F4FF; }


## BACKGROUNDS & EFFECTS
Water Ripple Animation (Title Screen)
.ripple-bg {
  background: url('water-ripple.svg');
  animation: ripple 12s infinite linear;
  opacity: 0.15;
}
@keyframes ripple {
  0% { background-position: 0 0; }
  100% { background-position: 1000px 1000px; }
}

Subtle Gradient Background
.bg-gradient {
  background: linear-gradient(180deg, #00AEEF 0%, #FFFFFF 100%);
}

## PROGRESS METER
Style
Horizontal bar
Rounded corners
Smooth fill animation
Yellow or blue fill depending on theme

.progress-bar {
  width: 100%;
  height: 16px;
  background: #F2F2F2;
  border-radius: 8px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: #FFC907;
  width: 0%;
  transition: width 0.4s ease;
}

## Modals & Overlays
Modal Style
.modal {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.2);
}

Overlay
.overlay {
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(4px);
}

## Iconography
Style

Simple, line‑based icons
Rounded corners
Minimal detail
Consistent stroke width (2–3px)
Colors: black, white, yellow, blue

Usage

Buttons
Boosters
Progress indicators
Challenge icons

## BOOSTERS & CONSUMABLES UI
Booster Icon Style
.booster {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #FFFFFF;
  border: 2px solid #FFC907;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}
.booster.used {
  opacity: 0.4;
}


Booster Count Badge
.booster-count {
  background: #003366;
  color: #FFFFFF;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
  position: absolute;
  top: -4px;
  right: -4px;
}

## ANIMATION GUIDELINES
Confetti
Bright, celebratory
Yellow, blue, white pieces
1–2 seconds duration

Water Splash
Soft, curved shapes
Blue and aqua tones
Gentle easing

Card Flip
0.2–0.3 seconds
Smooth, cubic‑bezier easing

## ACCESSIBILITY
Minimum text contrast ratio: 4.5:1
Button sizes: 44px minimum height
Avoid yellow text on white backgrounds
Provide sound toggle
Ensure animations do not overwhelm
