import { Tutorial } from '@/types/tutorial';

export const pitchModWheels: Tutorial = {
  id: 'pitch-mod-wheels',
  deviceId: 'deepmind-12',
  title: 'Pitch Bend & Mod Wheel Setup',
  description:
    'Master the DeepMind 12\'s two performance wheels. Learn how the spring-loaded pitch bend wheel works, how to set its range in the POLY EDIT menu, and how the mod wheel is wired to expressive parameters for live performance.',
  category: 'modulation',
  difficulty: 'beginner',
  estimatedTime: '7 min',
  tags: ['pitch-bend', 'mod-wheel', 'wheels', 'performance', 'expression', 'poly-edit', 'beginner'],
  steps: [
    {
      id: 'step-1',
      title: 'Pitch Bend Wheel — Real-Time Pitch Expression',
      instruction:
        'Push the PITCH wheel forward (away from you) to raise pitch, or pull it back (toward you) to lower pitch. The wheel is spring-loaded and automatically returns to the centre when you release it. By default the range is ±2 semitones: a full forward push raises all playing notes by 2 semitones; a full pull lowers them by 2 semitones. The wheel LED can be lit, unlit, or in AUTO mode (brightens as you move the wheel).',
      details:
        'The pitch bend wheel sends MIDI pitch bend data on the active MIDI channel. The range is controlled independently for up and down via the P.BEND-RANGE+ and P.BEND-RANGE- parameters in the POLY EDIT > PITCH PARAMETERS menu. Having asymmetric up/down ranges is a common technique — for example, ±2 semitones up and ±12 semitones down gives you a subtle upward bend and a dramatic dive bomb downward.',
      highlightControls: ['perf-pitch'],
      panelStateChanges: {
        'perf-pitch': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'A-1  Default Program',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-2',
      title: 'Modulation Wheel — Expressive Control',
      instruction:
        'Move the MOD wheel upward. The mod wheel applies whatever modulation or expression is assigned to it. On a fresh program, the mod wheel is typically wired to OSC 1 PITCH MOD depth (WHEEL>P.MOD in the OSC 1 EDIT menu), giving you manual control over vibrato depth: push the mod wheel up and vibrato increases. The wheel has its own LED indicator and can also run in AUTO mode.',
      details:
        'The mod wheel value is available in two places: as a Mod Matrix source (Source 2: Mod Wheel), and directly in the OSC EDIT menus via the WHEEL>P.MOD parameter (range 0–255, default 0). The Mod Matrix approach is more powerful — you can route the mod wheel to any of the 132 mod destinations, including VCF frequency for a wah-wah effect, or VCA envelope depth for swells. The WHEEL>P.MOD parameter in the OSC EDIT page is a simpler direct-assignment shortcut for pitch modulation.',
      highlightControls: ['perf-mod'],
      panelStateChanges: {
        'perf-pitch': { active: false },
        'perf-mod': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'A-1  Default Program',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-3',
      title: 'Open POLY EDIT — Pitch Parameters Menu',
      instruction:
        'Press the POLY EDIT switch once to open the VOICE PARAMETERS menu, then press it again to advance to the PITCH PARAMETERS menu. The display shows: TRANSPOSE, PORTA-TIME, PORTA-MODE, PORTA-OSC-BAL, P.BEND-RANGE+, P.BEND-RANGE-, and GLOBAL-TUNE. Navigate to P.BEND-RANGE+ using BANK UP / BANK DOWN.',
      details:
        'The POLY EDIT switch cycles through three menus: one press = VOICE PARAMETERS, two presses = PITCH PARAMETERS, three presses = CHAIN PARAMETERS. The footer at the bottom of the VOICE PARAMETERS screen shows "[EDIT]> PITCH PARAMS" to remind you of this navigation. Press PROG at any time to exit to the main display.',
      highlightControls: ['poly-edit'],
      panelStateChanges: {
        'perf-mod': { active: false },
        'poly-edit': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'PITCH PARAMETERS',
        menuItems: [
          { label: 'TRANSPOSE            0' },
          { label: 'PORTA-TIME          80' },
          { label: 'PORTA-MODE    Fingered' },
          { label: 'PORTA-OSC-BAL        0' },
          { label: 'P.BEND-RANGE+        2' },
          { label: 'P.BEND-RANGE-        2' },
          { label: 'GLOBAL-TUNE          0' },
        ],
        selectedIndex: 4,
        statusText: '[EDIT]> VOICE PARAMS',
      },
    },
    {
      id: 'step-4',
      title: 'P.BEND-RANGE+ — Upper Pitch Bend Limit',
      instruction:
        'With P.BEND-RANGE+ highlighted, press +/YES or -/NO to change the value. The range is -24 to +24 notes (semitones). The default is +2 (two semitones up). Try setting it to +12 for a one-octave upward pitch bend — push the pitch wheel forward to hear a full-octave rise. This is useful for guitar-style bends and dramatic lead lines.',
      details:
        'P.BEND-RANGE+ sets how many semitones the pitch rises when the pitch wheel is pushed fully forward. P.BEND-RANGE- sets how far it drops when pulled fully back (default -2). Both parameters are bi-polar: you can set P.BEND-RANGE+ to a negative value to make the upward wheel position lower pitch, though this is unconventional. The rotary knob allows fine single-step changes; the DATA ENTRY fader allows rapid sweeping across the full range.',
      highlightControls: ['poly-edit'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'PITCH PARAMETERS',
        menuItems: [
          { label: 'TRANSPOSE            0' },
          { label: 'PORTA-TIME          80' },
          { label: 'PORTA-MODE    Fingered' },
          { label: 'PORTA-OSC-BAL        0' },
          { label: 'P.BEND-RANGE+       12' },
          { label: 'P.BEND-RANGE-        2' },
          { label: 'GLOBAL-TUNE          0' },
        ],
        selectedIndex: 4,
        statusText: '[EDIT]> VOICE PARAMS',
      },
    },
    {
      id: 'step-5',
      title: 'P.BEND-RANGE- — Asymmetric Bend Range',
      instruction:
        'Navigate down to P.BEND-RANGE- and set it to a larger value, for example 12 (one octave down). With P.BEND-RANGE+ at 2 and P.BEND-RANGE- at 12, you get a subtle up-bend and a dramatic downward dive — the classic "whammy bar" asymmetric configuration. Push the wheel forward for a two-semitone rise; pull it all the way back for a full octave drop.',
      details:
        'P.BEND-RANGE- controls how many semitones the pitch drops when the wheel is pulled fully back. The parameter is named with a minus sign but the stored value is the magnitude of the drop (positive number). Default is 2 (two semitones down). This asymmetric bend capability lets you mimic guitar pitch bend behaviour where you can bend up by a tone but bend down by a whole step or more.',
      highlightControls: ['poly-edit'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'PITCH PARAMETERS',
        menuItems: [
          { label: 'TRANSPOSE            0' },
          { label: 'PORTA-TIME          80' },
          { label: 'PORTA-MODE    Fingered' },
          { label: 'PORTA-OSC-BAL        0' },
          { label: 'P.BEND-RANGE+        2' },
          { label: 'P.BEND-RANGE-       12' },
          { label: 'GLOBAL-TUNE          0' },
        ],
        selectedIndex: 5,
        statusText: '[EDIT]> VOICE PARAMS',
      },
    },
    {
      id: 'step-6',
      title: 'Mod Wheel in the Mod Matrix',
      instruction:
        'Press PROG to exit the POLY EDIT menu and return to the main display. Now press the MOD switch to open the MOD MATRIX page. Bus 1 typically shows "Mod Wheel" as the source and a destination such as "VCF Freq" or "None". When the mod wheel is connected to VCF Freq via the Mod Matrix, pushing the wheel opens the filter — a real-time wah effect. Adjust the DEPTH bar for the mod wheel bus to control how much the filter opens.',
      details:
        'The Mod Wheel (Source 2) can be routed to any of the 132 modulation destinations. Using the Mod Matrix is more flexible than the WHEEL>P.MOD shortcut in the OSC EDIT menu because it allows routing to destinations other than pitch. A depth of zero means the mod wheel has no effect on that bus. A positive depth applies modulation in the standard polarity; setting depth to a negative value inverts the effect. This is covered in depth in the Modulation Matrix tutorial.',
      highlightControls: ['perf-mod', 'prog-menu-mod'],
      panelStateChanges: {
        'poly-edit': { active: false },
        'prog-menu-mod': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'MOD MATRIX (1-8)',
        menuItems: [
          { label: '1 Mod Wheel   [  ]   VCF Freq' },
          { label: '2 None        [  ]   None' },
          { label: '3 None        [  ]   None' },
          { label: '4 None        [  ]   None' },
        ],
        selectedIndex: 0,
        statusText: 'SRC-1    Mod Wheel',
      },
      tipText:
        'Tip: Classic mod wheel assignments: (1) Mod Wheel → OSC1+2 Pitch for vibrato depth control; (2) Mod Wheel → VCF Freq for a wah-wah filter sweep; (3) Mod Wheel → VCA All for volume swells. Each requires a separate bus in the Mod Matrix with the appropriate depth.',
    },
  ],
};
