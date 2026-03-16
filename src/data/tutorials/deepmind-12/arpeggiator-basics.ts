import { Tutorial } from '@/types/tutorial';

export const arpeggiatorBasics: Tutorial = {
  id: 'arpeggiator-basics',
  deviceId: 'deepmind-12',
  title: 'Arpeggiator — Patterns, Gate & Sync',
  description:
    'Activate the DeepMind 12 Arpeggiator, set the rate and gate time, explore the 11 playback modes, use tap tempo and HOLD, and learn to navigate the ARP EDIT menu — page 1 covers all arpeggiator settings.',
  category: 'performance',
  difficulty: 'beginner',
  estimatedTime: '9 min',
  tags: ['arpeggiator', 'arp', 'gate-time', 'tap-tempo', 'hold', 'patterns', 'beginner'],
  steps: [
    {
      id: 'step-1',
      title: 'Activating the Arpeggiator',
      instruction:
        'Press the ON/OFF switch in the ARP/SEQ section. The switch illuminates and the Arpeggiator is now active. Hold down two or more keys — the Arpeggiator plays the held notes one at a time in sequence. The default mode is UP (from lowest to highest), and the default rate is 120.0 BPM at 1/16th note division.',
      details:
        'The ON/OFF switch only controls the ARPEGGIATOR — it has no effect on the CONTROL SEQUENCER. The default ON/OFF setting is OFF. When the Arpeggiator is active and you release all keys, arpeggiation stops. The display status bar shows "INT" when using the internal clock and "SEQ" when the Control Sequencer is running. With HOLD mode off (default), you must keep keys held down for the arpeggio to continue playing.',
      highlightControls: ['arp-on-off'],
      panelStateChanges: {
        'arp-on-off': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'A-1  Default Program',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-2',
      title: 'ARP RATE — Setting the Tempo',
      instruction:
        'Move the ARP RATE fader to change the Master BPM. Moving it down slows the arpeggiation; moving it up speeds it up. The BPM value is displayed in the status bar at the top of the display (e.g., "BPM:120.0"). The RATE fader controls not just the arpeggiator, but also the CONTROL SEQUENCER, LFO ARP-SYNC, and any effects parameters that are clock-synced.',
      details:
        'The Master BPM RATE range is 20.0 to 275.0 BPM. The default value is 120.0 BPM. The display shows "ARP RATE: 120.0BPM" with a large BPM display and a visualization of the current rate. Note: the RATE fader is the same as the RATE(BPM) parameter in the ARPEGGIATOR menu — changes on the surface are reflected in the menu and vice versa. The actual note step speed also depends on the CLOCK DIVIDER setting (default 1/16 note).',
      highlightControls: ['arp-rate'],
      panelStateChanges: {
        'arp-rate': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'ARP RATE: 120.0BPM',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-3',
      title: 'GATE TIME — Note Length',
      instruction:
        'Move the ARP GATE TIME fader. With the fader at the middle position (the default, value 128), each note lasts exactly half the step length — a clean staccato. Moving the fader down shortens the notes toward silence (0 = no note). Moving it up lengthens the notes toward the full step duration (255 = legato, notes run into each other).',
      details:
        'The GATE TIME fader range is 0 to 255. The default is 128 (half of the step length). The display shows "ARP GATE TIME: 50.1%" at the default, and a visualization showing two consecutive notes with the gate width clearly visible. Note: the GATE TIME FADER on the front panel and the GATE TIME PARAMETER in the Pattern Editor both affect note length — when a Pattern is active, both settings interact. When the GATE TIME fader is at maximum (255), the note length matches the full PATTERN GATE TIME.',
      highlightControls: ['arp-gate-time'],
      panelStateChanges: {
        'arp-rate': { active: false },
        'arp-gate-time': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'ARP GATE TIME: 50.1%',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-4',
      title: 'TAP TEMPO — Setting BPM by Tapping',
      instruction:
        'Press the TAP/HOLD switch repeatedly at the tempo you want. After 5 taps, the DeepMind 12 calculates an average BPM from your tapping and updates the Master BPM. You can continue tapping to refine the tempo. The supported tap tempo range is 20.0 to 275.0 BPM — the same as the RATE fader range.',
      details:
        'The BPM is calculated as an average of the last 5 taps, so you can keep tapping until the tempo feels right. If you are using an external sync source, the TAP/HOLD switch will flash at the rate of the external source. Tapping sets the same Master BPM that the RATE fader controls — after tap-setting a tempo, moving the RATE fader will override it. This is useful for playing live with other musicians: tap the tempo to match the song before activating the Arpeggiator.',
      highlightControls: ['arp-tap-hold'],
      panelStateChanges: {
        'arp-gate-time': { active: false },
        'arp-tap-hold': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'ARP RATE: 96.0BPM',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-5',
      title: 'HOLD Mode — Latch the Arpeggio',
      instruction:
        'Press and hold the TAP/HOLD switch for more than 1 second. The switch illuminates, indicating HOLD mode is now active. In HOLD mode, keys are latched — the Arpeggiator continues playing even after you release the keys. Press another key to add it to the arpeggio pattern. The HOLD mode is also useful without the Arpeggiator: when the ARP is off, HOLD sustains notes in the SUSTAIN phase of all envelopes.',
      details:
        'To turn HOLD mode off, press and hold the TAP/HOLD switch again for more than 1 second — the light turns off and HOLD mode is no longer active. The default HOLD setting is OFF. HOLD mode is especially useful for sound design: with the ARP off and HOLD on, you can hold a chord and use both hands to adjust faders. Add new notes to the HOLD by pressing keys while the HOLD is active — the Arpeggiator will pick them up and include them in the arpeggio pattern. The HOLD parameter in the ARPEGGIATOR menu mirrors this switch state.',
      highlightControls: ['arp-tap-hold'],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        statusText: 'A-1  Default Program',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-6',
      title: 'ARP EDIT — Arpeggiator Settings Menu',
      instruction:
        'Press the ARP EDIT switch once to open the ARPEGGIATOR menu (page 1). The display shows the full arpeggiator parameter list: KEY-SYNC, OCT, MODE, HOLD, CLOCK DIVIDER, RATE(BPM), SWING, and PATTERN. Use BANK UP / BANK DOWN to navigate between parameters. Use -/NO or +/YES to change values. The default MODE is UP; OCT defaults to 2 octaves.',
      details:
        'The ARPEGGIATOR menu parameters: KEY-SYNC (default Off) — when On, the arpeggiator resets each time you press the first key. OCT (1-6, default 2) — how many octaves the arpeggio cycles through. MODE (UP/DOWN/UP-DOWN/UP-INV/DOWN-INV/UP-DN-INV/UP-ALT/DOWN-ALT/RAND/AS PLAYED/CHORD, default UP) — note order. HOLD (On/Off, default Off) — same as the surface switch. CLOCK DIVIDER (1/16 default) — step timing relative to Master BPM. RATE(BPM) (20-275, default 120) — same as RATE fader. SWING (50-75%, default 50%) — timing groove. PATTERN (None/Preset-1 to Preset-32/User-1 to User-32, default None) — velocity/gate pattern.',
      highlightControls: ['arp-edit'],
      panelStateChanges: {
        'arp-tap-hold': { active: false },
        'arp-edit': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'ARPEGGIATOR',
        menuItems: [
          { label: 'KEY-SYNC          Off' },
          { label: 'OCT                 2' },
          { label: 'MODE               UP' },
          { label: 'HOLD              Off' },
          { label: 'CLOCK DIVIDER    1/16' },
          { label: 'RATE(BPM)       120.0' },
          { label: 'SWING              50' },
          { label: 'PATTERN          None' },
        ],
        selectedIndex: 2,
        statusText: '[EDIT]> CTRL SEQ',
      },
    },
    {
      id: 'step-7',
      title: 'Changing MODE and OCT',
      instruction:
        'With the ARPEGGIATOR menu open, navigate to MODE using BANK UP / BANK DOWN. Use -/NO or +/YES to cycle through the 11 modes. Try UP-DOWN — notes ascend then descend. Try RAND — notes play in random order. Try AS PLAYED — notes play in the order you pressed them. Navigate to OCT and change it from 2 to 1 octave to hear a tighter range, or 4 octaves for a sweeping range.',
      details:
        'All 11 arpeggiator modes: UP (lowest to highest), DOWN (highest to lowest), UP-DOWN (ascending then descending, no repeat at top/bottom), UP-INV (up then inverted down), DOWN-INV (down then inverted up), UP-DN-INV (alternating up/down through inversions), UP-ALT (interleaved lowest/highest/next-lowest/next-highest), DOWN-ALT (reverse of UP-ALT), RAND (random), AS PLAYED (note entry order), CHORD (all notes play simultaneously on each step). The default MODE is UP.',
      highlightControls: ['arp-edit'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'ARPEGGIATOR',
        menuItems: [
          { label: 'KEY-SYNC          Off' },
          { label: 'OCT                 2' },
          { label: 'MODE          UP-DOWN' },
          { label: 'HOLD              Off' },
          { label: 'CLOCK DIVIDER    1/16' },
          { label: 'RATE(BPM)       120.0' },
          { label: 'SWING              50' },
          { label: 'PATTERN          None' },
        ],
        selectedIndex: 2,
        statusText: '[EDIT]> CTRL SEQ',
      },
    },
    {
      id: 'step-8',
      title: 'Page 2: Control Sequencer (Overview)',
      instruction:
        'At the bottom of the ARPEGGIATOR menu you will see "[EDIT]> CTRL SEQ". Press the ARP EDIT switch again to advance to page 2: the CONTROL SEQUENCER menu. The Control Sequencer is a separate 32-step modulation source — it is not part of the arpeggiator. Press PROG or ARP EDIT again to exit back to the main display.',
      details:
        'The Control Sequencer menu (page 2) shows: ENABLE, CLOCK DIVIDER, LENGTH, SWING, SLEW-RATE, KEY/LOOP, and SEQUENCE. The Control Sequencer creates a repeating modulation pattern that can be routed to any Mod Matrix destination — it is a separate modulation source independent of the arpeggiator. A full walkthrough of the Control Sequencer is covered in the Arp Patterns & Control Sequencer tutorial. For now, note that both systems share the same Master BPM clock.',
      highlightControls: ['arp-edit'],
      panelStateChanges: {
        'arp-edit': { active: false },
      },
      displayState: {
        screenType: 'menu',
        title: 'CTRL SEQUENCER',
        menuItems: [
          { label: 'ENABLE            Off' },
          { label: 'CLOCK DIVIDER     1/6' },
          { label: 'LENGTH             16' },
          { label: 'SWING              50' },
          { label: 'SLEW-RATE           0' },
          { label: 'KEY/LOOP  Key&Loop On' },
          { label: 'SEQUENCE          -->' },
        ],
        selectedIndex: 0,
        statusText: '[EDIT]> SYNC SETTINGS',
      },
      tipText:
        'Tip: Set OCT to 1 and MODE to AS PLAYED to use the Arpeggiator as a step sequencer — press keys in the exact order you want them to play, and the Arpeggiator repeats that sequence. This gives you a simple sequencer effect without programming a pattern.',
    },
  ],
};
