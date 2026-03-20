# PIPELINE RESTORATION SOLITAIRE — MATCHING & SEQUENCING MATRIX

This matrix defines all valid interactions between card types in the game:
Tools, Challenges, Solutions, and Impact Cards.

---

# 1. CARD TYPE LEGEND
- **T** = Tool  
- **C** = Challenge  
- **S** = Solution  
- **I** = Impact Card  

---

# 2. SEQUENCING MATRIX (What Can Follow What)

| Current Card | Can Follow | Result |
|--------------|------------|--------|
| **Tool (T)** | T → T | Builds a tool chain; useful for preparing Solutions |
| **Tool (T)** | T → S | Valid sequence; prepares a Solution play |
| **Tool (T)** | T → C | Valid only if the Tool weakens the Challenge |
| **Tool (T)** | T → I | Valid; creates a boosted sequence for scoring |
| **Challenge (C)** | C → S | Clears the Challenge; unlocks layers |
| **Challenge (C)** | C → I | Invalid; Impact cannot resolve a Challenge |
| **Challenge (C)** | C → T | Invalid; Tools must precede Challenges |
| **Solution (S)** | S → I | Valid; creates a scoring combo |
| **Solution (S)** | S → T | Invalid; cannot go backwards in the pipeline |
| **Solution (S)** | S → C | Valid only if the Solution is a “pre‑solution” |
| **Impact (I)** | I → I | Valid; stacks multipliers |
| **Impact (I)** | I → S | Invalid; cannot place Solution after Impact |
| **Impact (I)** | I → C | Invalid; cannot place Challenge after Impact |

---

# 3. INTERACTION MATRIX (How Cards Affect Each Other)

| Card Type | Interacts With | Effect |
|-----------|----------------|--------|
| **Tool (T)** | Challenge | Weakens or prepares the Challenge |
| **Tool (T)** | Solution | Enables Solution to be applied |
| **Tool (T)** | Impact | Boosts score multiplier |
| **Challenge (C)** | Solution | Clears the Challenge |
| **Challenge (C)** | Impact | No effect; Impact cannot clear Challenges |
| **Solution (S)** | Challenge | Clears or unlocks layers |
| **Solution (S)** | Tool | Invalid; cannot revert pipeline |
| **Solution (S)** | Impact | Creates a scoring combo |
| **Impact (I)** | Any | Adds score multiplier; may reveal hidden cards |

---

# 4. CHALLENGE‑TO‑SOLUTION REQUIREMENTS

| Challenge | Required Solution | Result |
|-----------|-------------------|--------|
| **Drought** | Emergency Water Delivery | Unlocks column; reveals 1–2 cards |
| **Broken Pump** | New Pump | Clears block; reveals Pump Layer |
| **Contamination** | Anti‑Contamination Protocol | Removes penalty; stops spread |
| **Mudslide** | Well Cleaning Crew | Clears debris; unlocks hidden layer |
| **Heatwave** | Solar Panel Repair | Restores move count; removes timer penalty |
| **Rusted Pipe** | Pipe Replacement | Unlocks pipe layer |
| **Water Theft** | Community Training | Prevents Impact loss |
| **Supply Delay** | Pressure Regulator | Reduces penalty duration |
| **Low Water Pressure** | Pressure Regulator | Restores normal sequencing |
| **Blocked Well** | Leak Seal Operation | Unlocks final Well Card |
| **Clogged Intake** | Intake Repair Team | Clears intake; reveals 2 cards |
| **Pipe Burst** | Leak Seal Operation | Stops column lock |

---

# 5. TOOL‑TO‑CHALLENGE PREPARATION MATRIX

| Tool | Prepares Challenge | Effect |
|------|--------------------|--------|
| Rope | Mudslide | Allows Solution to be applied |
| Pipe | Rusted Pipe / Pipe Burst | Weakens Challenge |
| Water Filter | Contamination | Reduces penalty severity |
| Wrench | Broken Pump | Allows Solution to be applied |
| PVC Connector | Low Water Pressure | Reduces penalty |
| Solar Charger | Heatwave | Slows penalty timer |
| Water Testing Strips | Contamination | Reveals hidden contamination layer |
| Tool Kit | Any Challenge | Universal prep tool |
| Replacement Valve | Low Water Pressure | Prepares for Solution |
| Sealant Tape | Pipe Burst | Reduces lock duration |
| Drill Bit | Blocked Well | Weakens Challenge |
| Water Jug | Drought | Reduces penalty |

---

# 6. IMPACT CARD COMBO MATRIX

| Impact Card | Trigger | Bonus |
|-------------|---------|--------|
| Clean Water Reached 50 People | Any Solution play | +2× score |
| Community Celebration | Clearing 3 Challenges | +1 free move |
| School Reopened | Clearing Broken Pump | +3× score |
| Health Clinic Restored | Clearing Contamination | Reveals 1 hidden card |
| Women Saved 3 Hours | Clearing Drought | +2 free moves |
| Children Returned to Class | Clearing Mudslide | +1× score |
| Local Garden Thriving | Clearing Rusted Pipe | +1× score |
| New Water Committee Formed | Clearing Water Theft | Prevents next penalty |
| First Bucket of Clean Water | Clearing Blocked Well | Unlocks Well Card |
| “You Made a Difference” Bonus | Win condition | +5× score |
| Village Festival | Clearing 5 Challenges | +3× score |
| New Water Storage Tank | Clearing Pipe Burst | Reveals 2 hidden cards |
| Safe Cooking Water Restored | Clearing Intake | +1× score |
| Community Training Completed | Clearing Supply Delay | +1 free move |
| Water Quality Certified | Clearing Contamination | +2× score |
| “Hope Returned” Bonus | Any Impact chain | +1× score per chain |

---

# 7. INVALID COMBINATIONS (For Clarity)

| Attempted Sequence | Why It Fails |
|--------------------|--------------|
| Challenge → Challenge | Cannot stack obstacles |
| Impact → Challenge | Impact cannot block or clear |
| Solution → Tool | Cannot reverse pipeline flow |
| Impact → Tool | Impact cannot precede Tools |
| Solution → Challenge (wrong type) | Must match specific Challenge |
| Challenge → Impact | Impact cannot resolve Challenges |

---

# 8. SUMMARY
This matrix ensures:
- Clear logic for sequencing  
- Strategic depth  
- Thematic consistency  
- Predictable but interesting interactions  
- A strong foundation for coding the game logic  

