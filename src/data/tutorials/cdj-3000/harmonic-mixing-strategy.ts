import { Tutorial } from '@/types/tutorial';

export const harmonicMixingStrategy: Tutorial = {
  id: 'harmonic-mixing-strategy',
  deviceId: 'cdj-3000',
  title: 'Harmonic Mixing Strategy with KEY SYNC',
  description:
    'The "why" behind KEY SYNC: how the 6 harmonic-match algorithm picks compatible keys, when sync chooses wrong and you should override with KEY SHIFT, camelot wheel theory, and how to plan a 1-hour key-compatible set in rekordbox before you ever touch the deck.',
  category: 'performance',
  difficulty: 'advanced',
  estimatedTime: '8 min',
  addedDate: '2026-05-28',
  tags: ['key-sync', 'harmonic-mixing', 'camelot', 'key-theory', 'strategy', 'prep'],
  steps: [
    {
      id: 'step-1',
      title: 'Why Key Compatibility Matters',
      instruction:
        'Two tracks at the same tempo can still sound harmonically wrong if their keys clash. The dissonance is subtle — most listeners can\'t name it but they feel "tension" or "off-ness" during the transition. Harmonic mixing eliminates that tension by aligning keys, making transitions feel like extensions of the previous song.',
      details:
        'This is the difference between technically-correct mixing (beats locked, tempo locked) and musically-compelling mixing (beats + tempo + KEY locked). At peak hour with melodic genres (deep house, trance, melodic techno) harmonic mixing is the difference between "competent DJ" and "magical set". Pure-rhythm genres (drum & bass, footwork) are more forgiving.',
      highlightControls: [],
      panelStateChanges: {},
    },
    {
      id: 'step-2',
      title: 'The Camelot Wheel — Quick Mental Model',
      instruction:
        'Think of musical keys arranged in a 12-position clock face (camelot wheel). Each position has a number (1–12) and a letter (A=minor, B=major). The compatibility rules: same number = harmonic match. Adjacent numbers (e.g., 8A → 7A or 9A) = compatible. Same number opposite letter (8A ↔ 8B) = energy boost.',
      details:
        'Camelot is the DJ-friendly notation rekordbox uses by default. The actual music theory is "circle of fifths" — adjacent positions are a perfect fifth apart, which is why they sound compatible (shared overtones). You don\'t need theory; you need the compatibility pattern: ±1 number OR letter-flip-same-number = safe.',
      highlightControls: [],
      panelStateChanges: {},
      tipText:
        'Memorize this single rule: "Stay on the same number, flip the letter for energy. Step up one number for build, step down one for chill." That\'s 80% of harmonic mixing in one sentence.',
    },
    {
      id: 'step-3',
      title: 'What KEY SYNC Actually Does Under the Hood',
      instruction:
        'Press KEY SYNC on a loaded deck. The CDJ-3000 runs a 6-step algorithm: it checks the master deck\'s key, then evaluates 6 candidate shifts of THIS deck\'s key (−3, −2, −1, +1, +2, +3 semitones) and picks the smallest shift that produces a camelot-compatible key with the master.',
      details:
        'Why 6 candidates: the algorithm minimizes pitch distortion. A 3-semitone shift is the maximum that still sounds natural — beyond that, vocals chipmunk and synths get sluggish. If NO compatible shift exists within ±3, the algorithm picks the closest near-match (which is when you should override — see next step).',
      highlightControls: ['KEY_SYNC'],
      panelStateChanges: {
        KEY_SYNC: { active: true, ledOn: true },
      },
    },
    {
      id: 'step-4',
      title: 'When KEY SYNC Picks Wrong — Override with KEY SHIFT',
      instruction:
        'If KEY SYNC produces a transition that sounds off (your ear says "no"), it means the algorithm found a technically-compatible key but the musical context isn\'t serving the moment. Press KEY SYNC again to disengage. Now manually shift: hold MASTER TEMPO while pressing TEMPO_RANGE — this is KEY SHIFT mode. Adjust until it sounds right.',
      details:
        'The algorithm is fast but doesn\'t know what your set ARC is. If you want to build energy, the +1 numerical shift sounds better than the algorithm\'s mathematical-best -2. Manual override lets your taste win. Pros use KEY SYNC for fast, "good enough" transitions and KEY SHIFT for signature moments where they need exact control.',
      highlightControls: ['KEY_SYNC', 'MASTER_TEMPO', 'TEMPO_RANGE'],
      panelStateChanges: {
        KEY_SYNC: { active: false, ledOn: false },
      },
    },
    {
      id: 'step-5',
      title: 'Pre-Set Strategy — Plan Your Key Path in rekordbox',
      instruction:
        'Before the show, open rekordbox and filter your library by KEY. Lay out a 1-hour set as a key path: e.g., 8A → 8B → 9B → 9A → 10A. Each step is a compatible transition. Tag those tracks into a playlist in that order. Now in-the-moment KEY SYNC just confirms what you already planned.',
      details:
        'Live-set integration: KEY SYNC is a safety net, not a strategy. The strategy lives in prep. A planned key path means your transitions aren\'t random — they ARC. Energy builds, peaks, and resolves through deliberate key movement. The deck just executes the plan; the plan came from your taste.',
      highlightControls: [],
      panelStateChanges: {},
      tipText:
        'Pros keep 3-4 playlists per genre: "8A path", "10B path", "minor key", "major key". They pick the playlist that matches the room\'s vibe, then KEY SYNC just smooths the transitions within the chosen path.',
    },
    {
      id: 'step-6',
      title: 'The Energy Trick — Letter Flips for Lift',
      instruction:
        'Loaded a melodic-minor track in 8A? Cue up an 8B track for the transition. Press KEY SYNC. The track shifts to 8B (relative major) — the SAME notes but in a major mood. The dance floor instantly feels a lift in energy without any tempo change. This is the camelot "letter flip" technique.',
      details:
        'The letter flip is musical magic. Same fundamental key, different emotional color. It\'s how big-room DJs create the "lift" moment without speeding up. Reverse it (B → A) for an introspective drop into a chill section. Master this single transition and your sets gain a whole new dimension of dynamics.',
      highlightControls: ['KEY_SYNC'],
      panelStateChanges: {
        KEY_SYNC: { active: true, ledOn: true },
      },
    },
    {
      id: 'step-7',
      title: 'When NOT to Use Harmonic Mixing',
      instruction:
        'Pure-percussion sections (intros, outros, breaks) have no pitched content — KEY SYNC does nothing useful here. Cutting between two pure-drum sections is rhythm-only work. Also: deliberate dissonance (a hard cut from minor to major a tritone away) can be a powerful moment. Don\'t harmonic-mix on autopilot.',
      details:
        'Why this matters: over-applying any tool dulls its impact. If every transition is harmonically perfect, the audience adapts to that and stops noticing. The DJs who use harmonic mixing best are the ones who break it strategically — 5 perfect transitions, then ONE jarring key change that\'s the climax of the set.',
      highlightControls: ['KEY_SYNC'],
      panelStateChanges: {
        KEY_SYNC: { active: false, ledOn: false },
      },
    },
    {
      id: 'step-8',
      title: 'Putting It Together',
      instruction:
        'Your harmonic mixing toolkit: rekordbox key-tagged library → planned key path per set → KEY SYNC on the deck for execution → KEY SHIFT manual override for signature moments → letter flips for energy lifts → deliberate dissonance for set climaxes. The deck handles the math; you handle the music.',
      details:
        'Harmonic mixing is the layer that turns "competent DJ" into "memorable DJ". The CDJ-3000\'s KEY SYNC button is just a button — what makes it powerful is the strategy you bring to it. Combine this with phase-meter-and-visual-diagnostics (visual sync) and live-set-workflow (the end-to-end choreography) and you have the complete pro toolkit.',
      highlightControls: ['KEY_SYNC'],
      panelStateChanges: {},
    },
  ],
};
