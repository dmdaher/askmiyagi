import { Tutorial } from '@/types/tutorial';

export const modMatrix: Tutorial = {
  id: 'mod-matrix',
  deviceId: 'deepmind-12',
  title: 'The Modulation Matrix — Sources & Destinations',
  description:
    'Unlock the full power of the DeepMind 12\'s 8-bus Modulation Matrix. Learn the navigate-select-set workflow, assign sources and destinations, set modulation depth, and build three practical routings: vibrato, velocity-to-filter, and LFO-rate modulation.',
  category: 'modulation',
  difficulty: 'intermediate',
  estimatedTime: '12 min',
  tags: ['mod-matrix', 'modulation', 'sources', 'destinations', 'intermediate', 'vibrato', 'velocity', 'lfo'],
  steps: [
    {
      id: 'step-1',
      title: 'Opening the MOD MATRIX Page',
      instruction:
        'Press the MOD switch (below the DATA ENTRY fader in the PROG section). The switch illuminates and the display shows the MOD MATRIX page: 8 numbered buses, each with a SOURCE column, a DEPTH bar graph, and a DESTINATION column. Initially all buses show "None" source and "None" destination with zero depth. This is the central routing hub for all modulation on the DeepMind 12.',
      details:
        'The DeepMind 12 has 24 modulation sources and 132 modulation destinations, giving over 25,000 possible combinations across the 8 buses. Key sources include: LFO1, LFO2, Env 1 (VCA), Env 2 (VCF), Env 3 (MOD), Note Velocity, Note Number, Pitch Bend, Mod Wheel, Aftertouch, Control Sequencer, and more. Key destinations include: OSC pitch, VCF frequency, VCF resonance, VCA level, LFO rates, envelope times, pan spread, and all effects parameters marked with an asterisk (*) in Chapter 9 of the manual.',
      highlightControls: ['prog-menu-mod'],
      panelStateChanges: {
        'prog-menu-mod': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'MOD MATRIX (1-8)',
        menuItems: [
          { label: '1 None        [  ]   None' },
          { label: '2 None        [  ]   None' },
          { label: '3 None        [  ]   None' },
          { label: '4 None        [  ]   None' },
          { label: '5 None        [  ]   None' },
          { label: '6 None        [  ]   None' },
          { label: '7 None        [  ]   None' },
          { label: '8 None        [  ]   None' },
        ],
        selectedIndex: 0,
        statusText: 'SRC-1          None',
      },
    },
    {
      id: 'step-2',
      title: 'Workflow: Navigate to a Bus Column',
      instruction:
        'Use BANK UP / BANK DOWN to move the highlight to Bus 1. The status bar at the bottom shows which column is active: "SRC-1 None" means the SOURCE column of Bus 1 is selected. Use the rotary knob or DATA ENTRY fader to change the source. Scroll to "LFO1" and stop. The display now shows Bus 1 source as "LFO1".',
      details:
        'Navigation on the MOD MATRIX page works as follows: BANK UP / BANK DOWN moves between rows (buses 1–8) and between columns (SOURCE → DEPTH → DESTINATION) within each row. The status bar at the bottom of the display always shows which parameter is being edited. Use the rotary knob for precise single-step changes or the DATA ENTRY fader for fast sweeping. -/NO and +/YES also adjust the selected parameter.',
      highlightControls: ['prog-menu-mod', 'prog-rotary', 'prog-nav-no', 'prog-nav-yes'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'MOD MATRIX (1-8)',
        menuItems: [
          { label: '1 LFO1        [  ]   None' },
          { label: '2 None        [  ]   None' },
          { label: '3 None        [  ]   None' },
          { label: '4 None        [  ]   None' },
          { label: '5 None        [  ]   None' },
          { label: '6 None        [  ]   None' },
          { label: '7 None        [  ]   None' },
          { label: '8 None        [  ]   None' },
        ],
        selectedIndex: 0,
        statusText: 'SRC-1         LFO1',
      },
    },
    {
      id: 'step-3',
      title: 'Example 1 — LFO 1 to OSC Pitch (Vibrato)',
      instruction:
        'With Bus 1 source set to "LFO1": press BANK DOWN to move to the DEPTH column of Bus 1. Move the DATA ENTRY fader to set a depth of around 30–50. Then press BANK DOWN again to move to the DESTINATION column and scroll to "OSC1+2 Pit" (destination 9: OSC 1+2 Pitch). Press a key and hold it — LFO 1 now modulates both oscillators in pitch, creating vibrato. Raise the depth for more vibrato; lower it for subtlety.',
      details:
        'Destination 9 "OSC1+2 Pit" applies pitch modulation to both OSC 1 and OSC 2 simultaneously. For vibrato, a depth around 20–40 with the LFO RATE fader at mid-travel (around value 80–120, giving a rate of 2–5 Hz) and the LFO waveform set to Sine produces a natural-sounding vibrato. The OSC 1 PITCH MOD fader on the surface is a dedicated shortcut for this same routing — but the Mod Matrix version lets you also add delays, use different sources, or route to only one oscillator.',
      highlightControls: ['prog-menu-mod', 'prog-data-entry'],
      panelStateChanges: {
        'prog-data-entry': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'MOD MATRIX (1-8)',
        menuItems: [
          { label: '1 LFO1        [##]   OSC1+2 Pit' },
          { label: '2 None        [  ]   None' },
          { label: '3 None        [  ]   None' },
          { label: '4 None        [  ]   None' },
          { label: '5 None        [  ]   None' },
          { label: '6 None        [  ]   None' },
          { label: '7 None        [  ]   None' },
          { label: '8 None        [  ]   None' },
        ],
        selectedIndex: 0,
        statusText: 'DST-1    OSC1+2 Pit',
      },
    },
    {
      id: 'step-4',
      title: 'Example 2 — Velocity to VCF Frequency',
      instruction:
        'Navigate to Bus 2. Set SOURCE to "Note Vel" (Note Velocity, source 13). Move to the DEPTH column and set a positive depth around 60–80. Move to the DESTINATION column and set it to "VCF Freq" (destination 20). Now play keys softly and hard: soft notes keep the filter closed (dark tone); hard strikes open the filter (bright tone). This gives the patch dynamic response — playing harder makes the sound brighter.',
      details:
        'Velocity-to-VCF-Frequency is one of the most musically expressive routings available. A depth of 60 means a hard strike (velocity 127) opens the filter by roughly half its range. Setting a negative depth inverts the effect: hard playing produces a darker tone. The VCF VELOCITY-SENS parameter in the VCF EDIT menu provides a similar shortcut specifically for filter velocity, but the Mod Matrix version gives you control over exactly which envelope or destination is affected.',
      highlightControls: ['prog-menu-mod', 'prog-data-entry'],
      panelStateChanges: {
        'prog-data-entry': { active: false },
      },
      displayState: {
        screenType: 'menu',
        title: 'MOD MATRIX (1-8)',
        menuItems: [
          { label: '1 LFO1        [##]   OSC1+2 Pit' },
          { label: '2 Note Vel    [###]  VCF Freq' },
          { label: '3 None        [  ]   None' },
          { label: '4 None        [  ]   None' },
          { label: '5 None        [  ]   None' },
          { label: '6 None        [  ]   None' },
          { label: '7 None        [  ]   None' },
          { label: '8 None        [  ]   None' },
        ],
        selectedIndex: 1,
        statusText: 'DST-2       VCF Freq',
      },
    },
    {
      id: 'step-5',
      title: 'Example 3 — Effects as Destinations (Asterisk Parameters)',
      instruction:
        'Navigate to Bus 3. Set SOURCE to "LFO2". Move to DESTINATION and scroll into the high-numbered destinations (destinations 81–132: FX Slot 1–4 Parameters and FX Level). These are effects parameters marked with an asterisk (*) in Chapter 9 of the manual. Set the destination to "Fx 1 Level" (destination 129) and a depth of 50. Now LFO 2 rhythmically fades the first effects slot in and out — great for pulsing reverb or tremolo-like delay.',
      details:
        'The manual\'s Chapter 9 effects reference marks modulation-capable parameters with an asterisk (*). For example, in the AmbVerb reverb algorithm, the Decay parameter is asterisked — meaning it can be a mod destination. In the Delay algorithm, the feedback and mix parameters are asterisked. This connection between the Mod Matrix and the FX engine turns effects parameters into live, modulatable variables. Use LFO or envelope sources for automated movement, or use the Mod Wheel or Velocity for expressive real-time control of effects.',
      highlightControls: ['prog-menu-mod', 'prog-rotary'],
      panelStateChanges: {
        'prog-rotary': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'MOD MATRIX (1-8)',
        menuItems: [
          { label: '1 LFO1        [##]   OSC1+2 Pit' },
          { label: '2 Note Vel    [###]  VCF Freq' },
          { label: '3 LFO2        [##]   Fx 1 Level' },
          { label: '4 None        [  ]   None' },
          { label: '5 None        [  ]   None' },
          { label: '6 None        [  ]   None' },
          { label: '7 None        [  ]   None' },
          { label: '8 None        [  ]   None' },
        ],
        selectedIndex: 2,
        statusText: 'DST-3      Fx 1 Level',
      },
    },
    {
      id: 'step-6',
      title: 'Negative Depth — Inverting Modulation',
      instruction:
        'Navigate to Bus 4. Set SOURCE to "Env 1" (VCA Envelope, source 9). Move to the DEPTH column and use the DATA ENTRY fader to sweep into negative values (the depth bar moves to the left). Set a depth of around -50. Set DESTINATION to "VCF Freq". Now the VCA envelope inversely modulates the filter: as the sound grows in level, the filter closes — creating a darkening swell effect. Negative depths invert the polarity of any source.',
      details:
        'The DEPTH range spans from full negative to full positive. A depth of 0 means no modulation. Positive depth applies modulation in the standard direction (source value rising → destination value rising). Negative depth inverts it (source value rising → destination value falling). The bar graph on the display shows the direction and magnitude: bars to the right = positive, bars to the left = negative. Negative depth is especially useful with envelope sources to create counter-intuitive but musically expressive results.',
      highlightControls: ['prog-menu-mod', 'prog-data-entry'],
      panelStateChanges: {
        'prog-rotary': { active: false },
        'prog-data-entry': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'MOD MATRIX (1-8)',
        menuItems: [
          { label: '1 LFO1        [##]   OSC1+2 Pit' },
          { label: '2 Note Vel    [###]  VCF Freq' },
          { label: '3 LFO2        [##]   Fx 1 Level' },
          { label: '4 Env 1    [##    ]  VCF Freq' },
          { label: '5 None        [  ]   None' },
          { label: '6 None        [  ]   None' },
          { label: '7 None        [  ]   None' },
          { label: '8 None        [  ]   None' },
        ],
        selectedIndex: 3,
        statusText: 'DEP-4           -50',
      },
    },
    {
      id: 'step-7',
      title: 'Saving & Full Source/Destination Reference',
      instruction:
        'Press PROG (or press WRITE) to exit the MOD MATRIX. Your matrix settings are part of the program and will be saved when you write the program. The DeepMind 12 has 24 sources and 132 destinations — the full tables are in §8.9 of the manual (pp.93–94). Key sources to remember: 1=Pitch Bend, 2=Mod Wheel, 5=Aftertouch, 7=LFO1, 8=LFO2, 9=Env1 (VCA), 10=Env2 (VCF), 11=Env3 (MOD), 13=Note Velocity, 15=Control Sequencer.',
      details:
        'Key destinations to remember: 9=OSC1+2 Pitch, 20=VCF Freq, 21=VCF Res, 24=Env Rates (all), 25=All Attack, 59=VCA All, 62=Pan Spread, 67=Unison Detune, 68=OSC Drift, 71=Arp Gate, 73–80=Mod routing depths (modulating the depth of another bus — this creates complex, multi-layered modulation). Destinations 81–132 are effects slot parameters. Destinations marked with * in §8.9 are common to all voices (not per-voice). Understanding this table transforms the Mod Matrix from a routing tool into a complete modulation language.',
      highlightControls: ['prog-menu-mod', 'prog-menu-write'],
      panelStateChanges: {
        'prog-data-entry': { active: false },
        'prog-menu-mod': { active: false },
      },
      displayState: {
        screenType: 'home',
        statusText: 'A-1  *Default Program',
        selectedIndex: 1,
      },
      tipText:
        'Tip: Use Bus 7 or 8 to route Control Sequencer (source 15) to LFO 1 Rate (destination 1). The 32-step Control Sequencer now rhythmically speeds up and slows down the LFO — an advanced technique for evolving, living textures that change over time.',
    },
  ],
};
