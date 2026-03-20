export const FULL_DECK = [

  /* ============================================================
     TOOLS (12)
     ============================================================ */
  { id: 1,  pairId: 1,  type: 'tool', name: 'Rope', emoji: '🪢',
    description: 'Used to lower buckets and equipment into deep wells.' },

  { id: 2,  pairId: 2,  type: 'tool', name: 'Pipe', emoji: '🔩',
    description: 'Carries clean water through the restored pipeline.' },

  { id: 3,  pairId: 3,  type: 'tool', name: 'Wrench', emoji: '🔧',
    description: 'Tightens bolts and secures pipe fittings.' },

  { id: 4,  pairId: 4,  type: 'tool', name: 'Water Filter', emoji: '🪣',
    description: 'Removes sediment and debris from the water supply.' },

  { id: 5,  pairId: 5,  type: 'tool', name: 'Tool Kit', emoji: '🧰',
    description: 'Contains essential tools for field repairs.' },

  { id: 6,  pairId: 6,  type: 'tool', name: 'Solar Charger', emoji: '🔋',
    description: 'Powers small devices and sensors in remote areas.' },

  { id: 7,  pairId: 7,  type: 'tool', name: 'PVC Connector', emoji: '🧩',
    description: 'Links pipe segments together securely.' },

  { id: 8,  pairId: 8,  type: 'tool', name: 'Replacement Valve', emoji: '🚰',
    description: 'Controls water flow and pressure in the system.' },

  { id: 9,  pairId: 9,  type: 'tool', name: 'Sealant Tape', emoji: '📏',
    description: 'Seals small leaks and prevents pressure loss.' },

  { id: 10, pairId: 10, type: 'tool', name: 'Drill Bit', emoji: '🛠️',
    description: 'Used to bore into rock or reinforce well walls.' },

  { id: 11, pairId: 11, type: 'tool', name: 'Water Jug', emoji: '🫗',
    description: 'Transports small amounts of clean water safely.' },

  { id: 12, pairId: 12, type: 'tool', name: 'Testing Strips', emoji: '🧪',
    description: 'Checks water quality for contaminants.' },


  /* ============================================================
     CHALLENGES (12)
     ============================================================ */
  {
    id: 13, pairId: 13, type: 'challenge',
    name: 'Drought', emoji: '🌵',
    description: 'Severe dryness threatens the water supply.',
    twist: 'drought',
    twistLabel: '🌵 Drought!',
    twistDesc: 'Reduces available moves temporarily.'
  },

  {
    id: 14, pairId: 14, type: 'challenge',
    name: 'Broken Pump', emoji: '💥',
    description: 'The main pump has failed and needs replacement.',
    twist: 'pump_failure',
    twistLabel: '💥 Pump Failure!',
    twistDesc: 'Slows progress until repaired.'
  },

  {
    id: 15, pairId: 15, type: 'challenge',
    name: 'Contamination', emoji: '☣️',
    description: 'Bacteria detected in the water supply.',
    twist: 'contamination_spread',
    twistLabel: '☣️ Contamination Spread!',
    twistDesc: 'Shuffles 3 random cards.'
  },

  {
    id: 16, pairId: 16, type: 'challenge',
    name: 'Mudslide', emoji: '🌧️',
    description: 'Debris blocks access to the well.',
    twist: 'mudslide',
    twistLabel: '🌧️ Mudslide!',
    twistDesc: 'Covers a random card with debris.'
  },

  {
    id: 17, pairId: 17, type: 'challenge',
    name: 'Heatwave', emoji: '🌡️',
    description: 'Extreme heat increases water demand.',
    twist: 'heatwave',
    twistLabel: '🌡️ Heatwave!',
    twistDesc: 'Timer speeds up temporarily.'
  },

  {
    id: 18, pairId: 18, type: 'challenge',
    name: 'Rusted Pipe', emoji: '🧱',
    description: 'A corroded pipe threatens the system.',
    twist: 'rust_spread',
    twistLabel: '🧱 Rust Spread!',
    twistDesc: 'Locks a card for several seconds.'
  },

  {
    id: 19, pairId: 19, type: 'challenge',
    name: 'Water Theft', emoji: '🕳️',
    description: 'Unaccounted water loss detected.',
    twist: 'water_theft',
    twistLabel: '🕳️ Water Theft!',
    twistDesc: 'Steals an Impact card unless countered.'
  },

  {
    id: 20, pairId: 20, type: 'challenge',
    name: 'Supply Delay', emoji: '📦',
    description: 'Critical parts are delayed in transit.',
    twist: 'delay',
    twistLabel: '📦 Supply Delay!',
    twistDesc: 'Slows progress briefly.'
  },

  {
    id: 21, pairId: 21, type: 'challenge',
    name: 'Low Water Pressure', emoji: '🌀',
    description: 'Pressure drops across the system.',
    twist: 'pressure_drop',
    twistLabel: '🌀 Pressure Drop!',
    twistDesc: 'Reduces score gains temporarily.'
  },

  {
    id: 22, pairId: 22, type: 'challenge',
    name: 'Blocked Well', emoji: '🚫',
    description: 'The well is obstructed and inaccessible.',
    twist: 'blocked_well',
    twistLabel: '🚫 Blocked Well!',
    twistDesc: 'Prevents final restoration until cleared.'
  },

  {
    id: 23, pairId: 23, type: 'challenge',
    name: 'Clogged Intake', emoji: '🪨',
    description: 'Debris blocks the intake pipe.',
    twist: 'intake_clog',
    twistLabel: '🪨 Intake Clog!',
    twistDesc: 'Hides 2 random cards.'
  },

  {
    id: 24, pairId: 24, type: 'challenge',
    name: 'Pipe Burst', emoji: '💧',
    description: 'A major leak threatens the system.',
    twist: 'pipe_lock',
    twistLabel: '💧 Pipe Burst!',
    twistDesc: 'Locks a card for 5 seconds.'
  },


  /* ============================================================
     SOLUTIONS (12)
     ============================================================ */
  { id: 25, pairId: 13, type: 'solution', name: 'Emergency Water Delivery', emoji: '🚚',
    description: 'Provides temporary relief during drought.' },

  { id: 26, pairId: 14, type: 'solution', name: 'New Pump', emoji: '⚙️',
    description: 'Replaces the broken pump motor.' },

  { id: 27, pairId: 15, type: 'solution', name: 'Anti-Contamination Protocol', emoji: '🧼',
    description: 'Neutralizes harmful bacteria.' },

  { id: 28, pairId: 16, type: 'solution', name: 'Well Cleaning Crew', emoji: '🧹',
    description: 'Clears debris and restores access.' },

  { id: 29, pairId: 17, type: 'solution', name: 'Solar Panel Repair', emoji: '🔆',
    description: 'Restores power during extreme heat.' },

  { id: 30, pairId: 18, type: 'solution', name: 'Pipe Replacement', emoji: '🛠️',
    description: 'Installs new, corrosion-free piping.' },

  { id: 31, pairId: 19, type: 'solution', name: 'Community Training', emoji: '📚',
    description: 'Educates locals to prevent water loss.' },

  { id: 32, pairId: 20, type: 'solution', name: 'Pressure Regulator', emoji: '🎚️',
    description: 'Stabilizes water pressure.' },

  { id: 33, pairId: 21, type: 'solution', name: 'Flow Stabilizer', emoji: '💨',
    description: 'Restores consistent water pressure.' },

  { id: 34, pairId: 22, type: 'solution', name: 'Leak Seal Operation', emoji: '🩹',
    description: 'Clears the well obstruction.' },

  { id: 35, pairId: 23, type: 'solution', name: 'Intake Repair Team', emoji: '🛠️',
    description: 'Removes debris from the intake pipe.' },

  { id: 36, pairId: 24, type: 'solution', name: 'High-Pressure Seal', emoji: '💼',
    description: 'Fixes major pipe bursts.' },


  /* ============================================================
     IMPACT CARDS (16)
     ============================================================ */
  { id: 37, pairId: 25, type: 'impact', name: 'Clean Water Reached 50 People', emoji: '🌊',
    description: '50 lives transformed by safe water.' },

  { id: 38, pairId: 26, type: 'impact', name: 'Community Celebration', emoji: '🎉',
    description: 'The village celebrates clean water access.' },

  { id: 39, pairId: 27, type: 'impact', name: 'School Reopened', emoji: '🏫',
    description: 'Children return to class thanks to clean water.' },

  { id: 40, pairId: 28, type: 'impact', name: 'Health Clinic Restored', emoji: '🏥',
    description: 'Safe water improves community health.' },

  { id: 41, pairId: 29, type: 'impact', name: 'Women Saved 3 Hours Daily', emoji: '👩‍🍼',
    description: 'Women gain back precious time each day.' },

  { id: 42, pairId: 30, type: 'impact', name: 'Children Returned to Class', emoji: '📚',
    description: 'Kids spend more time learning, not fetching water.' },

  { id: 43, pairId: 31, type: 'impact', name: 'Local Garden Thriving', emoji: '🌱',
    description: 'Clean water revitalizes crops and gardens.' },

  { id: 44, pairId: 32, type: 'impact', name: 'New Water Committee Formed', emoji: '🤝',
    description: 'Local leaders ensure long-term sustainability.' },

  { id: 45, pairId: 33, type: 'impact', name: 'First Bucket of Clean Water', emoji: '🪣',
    description: 'A powerful moment of transformation.' },

  { id: 46, pairId: 34, type: 'impact', name: 'You Made a Difference', emoji: '💛',
    description: 'Your actions changed lives today.' },

  { id: 47, pairId: 35, type: 'impact', name: 'Village Festival', emoji: '🎊',
    description: 'A celebration of hope and renewal.' },

  { id: 48, pairId: 36, type: 'impact', name: 'New Water Storage Tank', emoji: '🛢️',
    description: 'Improves water security for the whole village.' },

  { id: 49, pairId: 37, type: 'impact', name: 'Safe Cooking Water Restored', emoji: '🍲',
    description: 'Families can cook safely again.' },

  { id: 50, pairId: 38, type: 'impact', name: 'Community Training Completed', emoji: '📘',
    description: 'Locals now maintain their own water system.' },

  { id: 51, pairId: 39, type: 'impact', name: 'Water Quality Certified', emoji: '🔬',
    description: 'The water supply meets safety standards.' },

  { id: 52, pairId: 40, type: 'impact', name: 'Hope Returned', emoji: '✨',
    description: 'Clean water brings a brighter future.' },

];

