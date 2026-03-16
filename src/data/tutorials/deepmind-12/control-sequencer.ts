import { Tutorial } from '@/types/tutorial';

export const controlSequencer: Tutorial = {
  id: 'control-sequencer',
  deviceId: 'deepmind-12',
  title: 'Control Sequencer — 32-Step Modulation',
  description:
    'Explore the 32-step Control Sequencer: enable it, set length and clock division, draw step values in the Sequence Editor, apply slew for smooth curves, and route the output through the Mod Matrix.',
  category: 'performance',
  difficulty: 'intermediate',
  estimatedTime: '10 min',
  tags: ['control-sequencer', 'step-sequencer', 'modulation', 'mod-matrix', 'arp'],
  steps: [
    {
      id: 'step-1',
      title: 'Accessing the Control Sequencer Menu',
      instruction:
        'Press the ARP EDIT switch once to open the ARPEGGIATOR menu (page 1). Then press ARP EDIT a second time to advance to page 2: the CONTROL SEQUENCER menu. The display shows: ENABLE, CLOCK DIVIDER, LENGTH, SWING, SLEW-RATE, KEY/LOOP, and SEQUENCE. The Control Sequencer is a separate 32-step modulation source — it is not part of the arpeggiator itself.',
      details:
        'The Control Sequencer runs independently of the Arpeggiator. Both share the same Master BPM clock (set by the ARP RATE fader), but have separate CLOCK DIVIDER and LENGTH settings. The Control Sequencer can run even when the Arpeggiator is off. The status bar at the bottom of the CTRL SEQUENCER screen shows "[EDIT]> SYNC SETTINGS", indicating page 3 (Sync Settings) is one more press of ARP EDIT away.',
      highlightControls: ['arp-edit'],
      panelStateChanges: {
        'arp-edit': { active: true },
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
    },
    {
      id: 'step-2',
      title: 'Enable and Set Length',
      instruction:
        'Navigate to ENABLE using BANK UP / BANK DOWN and press +/YES to set it to On. The Control Sequencer is now active. Navigate to LENGTH and use -/NO or +/YES to change it from the default 16 to your desired step count (range: 2 to 32 steps). A shorter LENGTH creates a tighter, faster loop; the full 32 steps gives a long evolving pattern.',
      details:
        'ENABLE defaults to Off. When enabled, the sequencer starts playing immediately using the current KEY/LOOP setting. The LENGTH parameter sets how many steps the sequence plays before looping — not the total number of steps stored. The default LENGTH is 6 steps in the factory default, but can be set anywhere from 2 to 32. Steps beyond the LENGTH value are not played but their values are preserved if you extend the length later.',
      highlightControls: ['arp-edit', 'prog-bank-up', 'prog-bank-down', 'prog-nav-yes', 'prog-nav-no'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'CTRL SEQUENCER',
        menuItems: [
          { label: 'ENABLE             On' },
          { label: 'CLOCK DIVIDER     1/6' },
          { label: 'LENGTH             16' },
          { label: 'SWING              50' },
          { label: 'SLEW-RATE           0' },
          { label: 'KEY/LOOP  Key&Loop On' },
          { label: 'SEQUENCE          -->' },
        ],
        selectedIndex: 2,
        statusText: '[EDIT]> SYNC SETTINGS',
      },
    },
    {
      id: 'step-3',
      title: 'Clock Divider and Swing',
      instruction:
        'Navigate to CLOCK DIVIDER and change the step timing. The same divisions used by the LFO are available (1/1 through 1/64T). The default is 1/6. A setting of 1/16 gives one step per 16th note — 16 steps loops every bar at 4/4. Try 1/8 to make each step an 8th note for a slower sweep. Set SWING (50-75%, default 50%) to shift alternate steps later and create a groove.',
      details:
        'The CLOCK DIVIDER divides the Master BPM to set the step rate. Values: 1/1, 1/2, 1/3, 1/4, 1/6, 1/8, 1/12, 1/16, 1/24, 1/32, 1/48, 1/64, and triplet variants. SWING pushes every second step later in time, ranging from 0% (no swing, equal spacing) to 75% (heavily late). At 50% the steps are evenly spaced. Swing values above 60% produce a strong triplet feel. Both CLOCK DIVIDER and SWING interact with the Arpeggiator\'s same parameters — they can differ between the two systems.',
      highlightControls: ['arp-edit'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'CTRL SEQUENCER',
        menuItems: [
          { label: 'ENABLE             On' },
          { label: 'CLOCK DIVIDER    1/16' },
          { label: 'LENGTH             16' },
          { label: 'SWING              55' },
          { label: 'SLEW-RATE           0' },
          { label: 'KEY/LOOP  Key&Loop On' },
          { label: 'SEQUENCE          -->' },
        ],
        selectedIndex: 3,
        statusText: '[EDIT]> SYNC SETTINGS',
      },
    },
    {
      id: 'step-4',
      title: 'Slew Rate — Smoothing Step Transitions',
      instruction:
        'Navigate to SLEW-RATE and increase it from 0 toward 255. At 0 (default), the Control Sequencer output jumps instantly between step values — useful for sharp filter cuts or hard pan changes. As you increase SLEW-RATE, the output glides smoothly between steps, turning a stepped pattern into a continuous slow sweep. At maximum (255), the glide is very slow and smooth.',
      details:
        'SLEW-RATE (range 0-255, default 0) applies a portamento-style lag processor to the Control Sequencer output. This is different from LFO smoothing — it directly affects how quickly the output reaches each target step value. With long SLEW-RATE values and short step lengths, the output may never fully reach each step\'s target before the next step fires. This creates organic, wave-like modulation from a simple stepped sequence. SLEW-RATE is particularly useful when routing the sequencer to filter cutoff for evolving filter sweeps.',
      highlightControls: ['arp-edit'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'CTRL SEQUENCER',
        menuItems: [
          { label: 'ENABLE             On' },
          { label: 'CLOCK DIVIDER    1/16' },
          { label: 'LENGTH             16' },
          { label: 'SWING              55' },
          { label: 'SLEW-RATE          80' },
          { label: 'KEY/LOOP  Key&Loop On' },
          { label: 'SEQUENCE          -->' },
        ],
        selectedIndex: 4,
        statusText: '[EDIT]> SYNC SETTINGS',
      },
    },
    {
      id: 'step-5',
      title: 'Sequence Editor — Drawing Step Values',
      instruction:
        'Navigate to SEQUENCE and press +/YES to open the Sequence Editor. The display shows 16 steps as bar graphs. The current step is highlighted. Use BANK UP / BANK DOWN to move between steps and -/NO or +/YES to change each step\'s value (0-127). Soft key tabs across the bottom control what you are editing: PROG=VALUE (modulation level), FX=GATE (step on/off), GLOBAL=LEM (step length), COMPARE=COMP, WRITE=SAVE.',
      details:
        'The Sequence Editor soft key tabs: PROG (VALUE) edits the modulation value per step from 0 to 127 — this is the level output to the Mod Matrix destination. FX (GATE) toggles individual steps on or off — steps with GATE off output 0 regardless of their VALUE. GLOBAL (LEM) sets a per-step length multiplier (not the same as the global LENGTH). Steps are displayed as bar heights proportional to their value. Steps with GATE off appear as empty bars. The sequence loops at the LENGTH boundary set in the CTRL SEQUENCER menu.',
      highlightControls: ['arp-edit', 'prog-nav-yes', 'prog-nav-no', 'prog-bank-up', 'prog-bank-down'],
      panelStateChanges: {},
      displayState: {
        screenType: 'pattern',
        statusText: 'SEQUENCE EDITOR',
        selectedIndex: 0,
      },
    },
    {
      id: 'step-6',
      title: 'Routing via the Mod Matrix',
      instruction:
        'Exit the Sequence Editor by pressing PROG. Press MOD to open the Mod Matrix. Add a new row: set SOURCE to CTRL-SEQ and choose a destination such as VCF CUTOFF with an AMOUNT of +50. Now the Control Sequencer drives the filter cutoff — each step in your sequence modulates the filter at the level you set. The sequencer output range 0-127 maps to the Mod Matrix amount.',
      details:
        'The Control Sequencer appears in the Mod Matrix SOURCE list as CTRL-SEQ. Its output ranges from 0 to 127 per step. With AMOUNT +50 and a VCF CUTOFF destination, the filter moves by (step value / 127) × 50% of the full cutoff range per step. Because the Control Sequencer is a unipolar source (0 to +127), you can set the BASE CUTOFF lower and let the sequencer lift it, rather than centering it around the current knob position. Multiple Mod Matrix rows can use CTRL-SEQ simultaneously for multi-destination modulation.',
      highlightControls: ['prog-menu-mod', 'arp-edit'],
      panelStateChanges: {
        'arp-edit': { active: false },
        'prog-menu-mod': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'MOD MATRIX',
        menuItems: [
          { label: 'SRC: CTRL-SEQ' },
          { label: 'DST: VCF CUTOFF' },
          { label: 'AMT: +50' },
        ],
        selectedIndex: 0,
        statusText: 'MOD MATRIX',
      },
    },
    {
      id: 'step-7',
      title: 'KEY/LOOP and Sync Settings',
      instruction:
        'Press MOD again to exit the Mod Matrix. Press ARP EDIT twice to return to the CTRL SEQUENCER menu. Navigate to KEY/LOOP and explore the three options: Loop On (sequencer runs continuously regardless of keys held), Key Sync On (resets on each new key press), Key&Loop On (default — resets on key press but continues looping). Then press ARP EDIT once more to reach page 3: ARP SETTINGS, where you can set the global CLOCK source (Internal / MIDI(Auto) / USB(Auto)) and TRANSMIT-CLK.',
      details:
        'KEY/LOOP values: Loop On — the sequencer runs freely from the moment ENABLE=On, with no key-reset. Key Sync On — the sequencer resets its step counter each time a new note-on is received, giving a rhythmically tight effect tied to performance. Key&Loop On (default) — same as Key Sync, but the sequencer keeps running between note-ons (it only resets, not pauses). ARP SETTINGS page (page 3): CLOCK (Internal/MIDI(Auto)/USB(Auto)), TRANSMIT-CLK (On/Off — sends clock to MIDI output), ARP-TO-MIDI (On/Off — sends arpeggiated notes to MIDI output), ARP-PARAMS (PROGRAM/GLOBAL — whether ARP settings save per-program or globally).',
      highlightControls: ['arp-edit'],
      panelStateChanges: {
        'prog-menu-mod': { active: false },
        'arp-edit': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'ARP SETTINGS',
        menuItems: [
          { label: 'CLOCK        Internal' },
          { label: 'TRANSMIT-CLK      Off' },
          { label: 'ARP-TO-MIDI       Off' },
          { label: 'ARP-PARAMS    Program' },
        ],
        selectedIndex: 0,
        statusText: 'ARP SETTINGS',
      },
      tipText:
        'Tip: Set ARP-PARAMS to GLOBAL if you want the Arpeggiator and Control Sequencer settings to remain consistent across programs during a live set — changes you make on stage persist even when switching presets.',
    },
  ],
};
