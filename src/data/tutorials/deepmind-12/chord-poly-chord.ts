import { Tutorial } from '@/types/tutorial';

export const chordPolyChord: Tutorial = {
  id: 'chord-poly-chord',
  deviceId: 'deepmind-12',
  title: 'Chord Memory & Poly Chord',
  description:
    'Use Chord Memory to store a custom chord triggered by a single key, then explore Poly Chord — 4 banks of 32 programmable chord shapes — and the Chord Wizard for real-time chord construction.',
  category: 'performance',
  difficulty: 'intermediate',
  estimatedTime: '10 min',
  tags: ['chord-memory', 'poly-chord', 'chord-wizard', 'performance', 'chords'],
  steps: [
    {
      id: 'step-1',
      title: 'Arming Chord Memory',
      instruction:
        'Press the CHORD switch in the ARP section. The switch begins flashing — this means Chord Memory is armed but no chord is stored yet. The display shows the keyboard screen ready to receive your chord. A status strip at the top shows the current chord slot (empty until you record one).',
      details:
        'The CHORD switch arms Chord Memory mode. When no chord is stored, the switch flashes. When a chord is stored and Chord Memory is active, the switch illuminates solid. In Chord Memory mode, every key you press triggers the entire stored chord transposed to that key. The display keyboard screen shows which notes are included in the stored chord relative to the root.',
      highlightControls: ['arp-chord'],
      panelStateChanges: {
        'arp-chord': { active: true },
      },
      displayState: {
        screenType: 'chord-memory',
        statusText: 'CHORD MEMORY',
        selectedIndex: 0,
      },
    },
    {
      id: 'step-2',
      title: 'Recording a Chord',
      instruction:
        'With Chord Memory armed (CHORD switch flashing), play and hold the notes of your chord — for example, hold C4, E4, and G4 simultaneously. The display briefly shows "LEARNING". Release all keys. The chord is now stored: the display shows "CUSTOM-Ma-C4,E4,G4" in the status bar and the CHORD switch illuminates solid.',
      details:
        'Only one chord can be stored in Chord Memory at a time. Recording a new chord replaces the previous one. The format in the status bar is: CUSTOM-[category abbreviation]-[note list]. The DeepMind 12 automatically identifies the chord quality (Ma = major, Mi = minor, 7 = dominant 7th, etc.) where possible. After recording, every key press plays the stored interval pattern transposed to that root note across all active voices.',
      highlightControls: ['arp-chord'],
      panelStateChanges: {},
      displayState: {
        screenType: 'chord-memory',
        statusText: 'CUSTOM-Ma-C4,E4,G4',
        selectedIndex: 0,
      },
    },
    {
      id: 'step-3',
      title: 'Chord Memory Soft Keys: REC and DEL',
      instruction:
        'While the Chord Memory screen is active, look at the soft key labels beneath the display. The PROG soft key exits back to the main display. The GLOBAL soft key is labelled REC — press it to arm for a new recording and replace the current chord. The WRITE soft key is labelled DEL — press it to delete the stored chord and return the CHORD switch to flashing (unarmed) state.',
      details:
        'These soft key assignments are unique to the Chord Memory screen. PROG=EXIT returns to the current program without erasing the stored chord. GLOBAL=REC re-arms Chord Memory so you can play a new chord — the existing chord is not deleted until you play a new one and release. WRITE=DEL immediately clears the stored chord. If you delete the chord, the CHORD switch reverts to flashing until a new chord is recorded.',
      highlightControls: ['prog-menu-prog', 'prog-menu-global', 'prog-menu-write'],
      panelStateChanges: {},
      displayState: {
        screenType: 'chord-memory',
        statusText: 'CUSTOM-Ma-C4,E4,G4',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-4',
      title: 'Poly Chord — Banks and Slots',
      instruction:
        'Press the POLY CHORD switch. The display shows the Poly Chord screen with 4 banks: A, B, C, and D. Each bank contains 32 chord slots. The current bank and slot are highlighted. Use the Rotary encoder to scroll through slots 1-32. To switch banks quickly, hold POLY CHORD and press the soft key under the bank label (A, B, C, or D).',
      details:
        'Poly Chord stores up to 128 chord shapes (4 banks × 32 slots). Each slot holds a fixed interval set — unlike Chord Memory, the intervals are pre-defined and cannot be changed by playing keys unless you use REC mode. Bank A is factory-populated with common chord shapes. Banks B, C, and D can be used for custom chords. The bank/slot combination is saved with the program, so each preset can recall a different Poly Chord.',
      highlightControls: ['arp-poly-chord'],
      panelStateChanges: {
        'arp-chord': { active: false },
        'arp-poly-chord': { active: true },
      },
      displayState: {
        screenType: 'chord-memory',
        statusText: 'POLY CHORD  A-01',
        selectedIndex: 0,
      },
    },
    {
      id: 'step-5',
      title: 'Recording a Custom Poly Chord',
      instruction:
        'Navigate to an empty slot (e.g., B-01). Press the REC soft key under the display — the POLY CHORD switch double-flashes and the display shows "ARMED". Play and hold your chord (e.g., C4, Eb4, G4, Bb4). The display shows "LEARNING". Release all keys — the display shows "PRESS TRIGGER". Now press the single key you want to use as the trigger note. The chord shape is saved to that slot.',
      details:
        'The recording process has 4 stages: ARMED → LEARNING → PRESS TRIGGER → saved. During LEARNING, all held notes are captured as intervals relative to the first note pressed. During PRESS TRIGGER, a single key press defines the reference (trigger) key for the slot — any key pressed during performance will play the chord transposed relative to this trigger note. The double-flash of POLY CHORD during ARMED mode distinguishes it from the single-flash of Chord Memory armed.',
      highlightControls: ['arp-poly-chord', 'prog-menu-global'],
      panelStateChanges: {},
      displayState: {
        screenType: 'chord-memory',
        statusText: 'POLY CHORD  B-01 ARMED',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-6',
      title: 'Chord Wizard — Building Chords from Categories',
      instruction:
        'On the Poly Chord screen, navigate to any slot and press the soft key labelled WIZARD. The display shows "CREATE / ChordWizard 1.0 / CANCEL". Hold any note on the keyboard and turn the Rotary encoder to cycle through chord categories (CAT): MAJOR, MINOR, DOM, DIM. Stop on MAJOR to see the chord types listed. Keep turning to scroll through Ma, Ma7, Ma9, Add9, SuS4, 6, 6/9 and hear the chord change in real time.',
      details:
        'Chord Wizard parameters: CAT (category: MAJOR/MINOR/DOM/DIM), TYPE (chord type within the category — 7 options per category), MOD (voicing modifier: BASS/SPREAD/SPREAD2/OFF). MAJOR types: Ma, Ma7, Ma9, Add9, SuS4, 6, 6/9. MINOR types: Mi, Mi7, Mi9, Mi6, Mi6/9, Mi11, Mi7b5, MiMaj7. DOM types: 7, 9, 7SuS4, 9SuS4, 11, 7#5, 9#5, 7b5, 7#9, 7b5b9, 13, #9#5. DIM types: DIM, Au9, Dim7. SPREAD/SPREAD2 widens the voicing across the 12-voice polyphony. Press CREATE to save to the current slot or CANCEL to discard.',
      highlightControls: ['arp-poly-chord', 'prog-rotary'],
      panelStateChanges: {},
      displayState: {
        screenType: 'chord-memory',
        statusText: 'ChordWizard 1.0',
        selectedIndex: 2,
      },
    },
    {
      id: 'step-7',
      title: 'Comparing Chord Memory vs Poly Chord',
      instruction:
        'Press the POLY CHORD switch again to exit Poly Chord mode. Now press the CHORD switch to toggle Chord Memory on. Play a single key — your stored chord plays. Press CHORD again to turn it off and try POLY CHORD with a preset from Bank A. Notice the key difference: Chord Memory stores one chord globally; Poly Chord stores 128 named slots that can be recalled per program. Both are single-key-trigger systems and can run simultaneously with the Arpeggiator.',
      details:
        'Chord Memory and Poly Chord can both be active at the same time — pressing a key would stack both chord layers on top of each other, producing a very dense chord. This is intentional; both can also be used independently. Chord Memory is ideal for live recording of a quick custom chord. Poly Chord is ideal for structured sets where you need specific, repeatable chord shapes per song section. Both systems are compatible with the Arpeggiator, which will arpeggiate the resulting chord notes.',
      highlightControls: ['arp-chord', 'arp-poly-chord'],
      panelStateChanges: {
        'arp-poly-chord': { active: false },
        'arp-chord': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'CUSTOM-Ma-C4,E4,G4',
        selectedIndex: 0,
      },
      tipText:
        'Tip: Combine Poly Chord with the Arpeggiator in CHORD mode (ARP MODE = CHORD) to arpeggiate every chord note as a single arpeggio step — one key triggers both the chord and the arpeggio pattern.',
    },
  ],
};
