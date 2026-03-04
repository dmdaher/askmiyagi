import { Tutorial } from '@/types/tutorial';

export const toneEditingZoom: Tutorial = {
  id: 'tone-editing-zoom',
  deviceId: 'fantom-08',
  title: 'Editing Tone Parameters (Zoom View)',
  description:
    'Learn how to access and navigate the Tone Edit ZOOM screen to shape your sound. Adjust oscillator, filter, and amp parameters for any Z-Core tone using the intuitive tabbed ZOOM interface.',
  category: 'sound-design',
  difficulty: 'beginner',
  estimatedTime: '6 min',
  tags: ['tone-edit', 'zoom', 'sound-design', 'beginner', 'z-core'],
  steps: [
    {
      id: 'step-1',
      title: 'Introduction to Tone Editing',
      instruction:
        "The Fantom 08 lets you edit every aspect of a tone's sound using the Tone Edit screens. In this tutorial, you'll learn the ZOOM view — a focused, tab-by-tab editor that shows one parameter section at a time.",
      details:
        "There are two Tone Edit views: ZOOM (focused, one section at a time) and PRO (grid showing all parameters at once). We'll start with ZOOM because it's easier to navigate for beginners.",
      highlightControls: [],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        sceneNumber: 'A005',
        sceneName: 'Synth Lead',
        tempo: 128,
        beatSignature: '4/4',
      },
    },
    {
      id: 'step-2',
      title: 'Select Zone 1',
      instruction:
        'Press the Zone 1 button to select the zone containing our Saw Lead tone. This ensures any edits we make apply to Zone 1.',
      highlightControls: ['zone-1'],
      panelStateChanges: {
        'zone-1': { active: true, ledOn: true, ledColor: '#3B82F6' },
      },
      displayState: {
        screenType: 'zone-view',
        title: 'ZONE VIEW',
        sceneNumber: 'A005',
        sceneName: 'Synth Lead',
        tempo: 128,
        beatSignature: '4/4',
        zoneViewMode: 1,
        zones: [
          {
            zoneNumber: 1,
            zoneName: 'Zone 1',
            toneName: 'Saw Lead',
            toneType: 'Z-Core',
            toneBank: 'PR-A',
            toneCategory: 'Synth',
            toneNumber: '0145',
            keyRangeLow: 'A0',
            keyRangeHigh: 'C8',
            volume: 100,
            pan: 0,
            muted: false,
            active: true,
          },
        ],
      },
      zones: [
        {
          zoneNumber: 1,
          color: '#3B82F6',
          lowNote: 21,
          highNote: 108,
          label: 'Zone 1 (Saw Lead)',
        },
      ],
    },
    {
      id: 'step-3',
      title: 'Enter Tone Edit ZOOM',
      instruction:
        'Press the OSC button in the Synth Control section to jump directly into the Tone Edit ZOOM screen on the OSC tab.',
      details:
        'The Synth Control buttons (OSC, FILTER TYPE, PARAM, AMP, FX, LFO) are shortcuts that open Tone Edit ZOOM directly on the corresponding tab. You can also access Tone Edit via Menu > Tone Edit.',
      highlightControls: ['synth-mode-osc'],
      panelStateChanges: {
        'synth-mode-osc': { active: true },
      },
      displayState: {
        screenType: 'tone-edit-zoom',
        activeTab: 'OSC',
        selectedIndex: 0,
        toneEditData: {
          toneType: 'Z-CORE',
          activePartials: [true, true, false, false],
          selectedPartial: 0,
        },
        menuItems: [
          { label: 'Wave Type: SAW', selected: true },
          { label: 'Wave Variation: ---' },
          { label: 'Gain: 0dB' },
          { label: 'Detune: 0' },
        ],
      },
      tipText:
        'The OSC button is the quickest shortcut to start editing oscillator settings.',
    },
    {
      id: 'step-4',
      title: 'Browse Tabs with E1',
      instruction:
        "Turn the E1 knob to scroll through the available tabs. Navigate to the FILTER tab to adjust the tone's brightness.",
      details:
        'The ZOOM screen has many tabs: COMMON, STRUCTURE, KEYBOARD, OSC, Pitch, PITCH ENV, FILTER, FILTER ENV, AMP, AMP ENV, LFO, and more. E1 scrolls through them.',
      highlightControls: ['function-e1'],
      panelStateChanges: {},
      displayState: {
        screenType: 'tone-edit-zoom',
        activeTab: 'FILTER',
        selectedIndex: 0,
        toneEditData: {
          toneType: 'Z-CORE',
          activePartials: [true, true, false, false],
          selectedPartial: 0,
        },
        menuItems: [
          { label: 'Filter Type: LPF', selected: true },
          { label: 'Cutoff: 80' },
          { label: 'Resonance: 30' },
          { label: 'Key Follow: +100' },
        ],
      },
      tipText: 'E1 always scrolls between tabs in the ZOOM editor.',
    },
    {
      id: 'step-5',
      title: 'Select a Parameter',
      instruction:
        'Use the Cursor Down button to move the selection to the "Cutoff" parameter.',
      details:
        'Use the Cursor Up/Down buttons to select a parameter within the current tab. In ZOOM view, E2-E6 directly edit the visible parameters rather than navigating.',
      highlightControls: ['cursor-down'],
      panelStateChanges: {},
      displayState: {
        screenType: 'tone-edit-zoom',
        activeTab: 'FILTER',
        selectedIndex: 1,
        toneEditData: {
          toneType: 'Z-CORE',
          activePartials: [true, true, false, false],
          selectedPartial: 0,
        },
        menuItems: [
          { label: 'Filter Type: LPF' },
          { label: 'Cutoff: 80', selected: true },
          { label: 'Resonance: 30' },
          { label: 'Key Follow: +100' },
        ],
      },
    },
    {
      id: 'step-6',
      title: 'Adjust the Cutoff Value',
      instruction:
        'Turn the Value dial to change the Cutoff frequency. Increase it to 110 for a brighter sound, or decrease it for a darker, more muffled tone.',
      details:
        'Cutoff controls how much of the harmonic spectrum passes through the filter. Higher values = brighter sound, lower values = darker sound. The range is 0-127.',
      highlightControls: ['value-dial'],
      panelStateChanges: {},
      displayState: {
        screenType: 'tone-edit-zoom',
        activeTab: 'FILTER',
        selectedIndex: 1,
        toneEditData: {
          toneType: 'Z-CORE',
          activePartials: [true, true, false, false],
          selectedPartial: 0,
        },
        menuItems: [
          { label: 'Filter Type: LPF' },
          { label: 'Cutoff: 110', selected: true },
          { label: 'Resonance: 30' },
          { label: 'Key Follow: +100' },
        ],
      },
      tipText:
        'Play notes while adjusting the cutoff to hear the change in real time.',
    },
    {
      id: 'step-7',
      title: 'Focused Value Editing',
      instruction:
        'Press Enter to open a focused value popup for precise editing. The popup shows the parameter name, current value, and lets you use the Value dial for fine adjustments.',
      highlightControls: ['enter'],
      panelStateChanges: {},
      displayState: {
        screenType: 'popup',
        parameterName: 'Cutoff',
        parameterValue: '110',
        selectedIndex: 110,
        popupData: {
          popupType: 'value',
        },
      },
      tipText:
        'The value popup is useful for precise adjustments — you can see the exact numeric value.',
    },
    {
      id: 'step-8',
      title: 'Navigate to AMP Tab',
      instruction:
        'Press Exit to close the popup, then turn E1 to navigate to the AMP tab. Here you can adjust the volume envelope and output level for the tone.',
      highlightControls: ['exit', 'function-e1'],
      panelStateChanges: {},
      displayState: {
        screenType: 'tone-edit-zoom',
        activeTab: 'AMP',
        selectedIndex: 0,
        toneEditData: {
          toneType: 'Z-CORE',
          activePartials: [true, true, false, false],
          selectedPartial: 0,
        },
        menuItems: [
          { label: 'Level: 100', selected: true },
          { label: 'Velocity Sens: +63' },
          { label: 'Pan: 0' },
          { label: 'Tone Delay Type: OFF' },
        ],
      },
    },
    {
      id: 'step-9',
      title: 'Initialize a Tone',
      instruction:
        'While in the ZOOM editor, touch <UTILITY> to open the Utility window. Select TONE INITIALIZE to reset the current tone to its default state — a blank Z-Core tone ready for sound design from scratch.',
      details:
        'Tone Initialize resets all parameters to factory defaults. The UTILITY window also offers PARTIAL INITIALIZE (reset one partial only), PARTIAL COPY (copy settings between partials), and MULTISAMPLE EDIT. After touching TONE INITIALIZE, a confirmation message appears — select [E5] OK to confirm or [E5] CANCEL to abort.',
      highlightControls: ['function-e6'],
      panelStateChanges: {},
      displayState: {
        screenType: 'popup',
        title: 'UTILITY',
        confirmText: 'TONE INITIALIZE — Are you sure?',
        popupData: { popupType: 'confirm' },
        statusText: 'Touch TONE INITIALIZE, then [E5] OK to confirm',
      },
      tipText:
        'Tone Initialize is useful when you want to build a sound from scratch without leftover parameter settings.',
    },
    {
      id: 'step-10',
      title: 'Enter SYNTH CTRL Mode',
      instruction:
        'Press Exit to leave the ZOOM editor and return to the home screen. Now try the SYNTH CTRL section — turn the CUTOFF knob to directly control the filter cutoff in real time while playing.',
      details:
        'The SYNTH CTRL section (FILTER section on the panel) provides hands-on real-time control. The [CUTOFF] knob adjusts the filter cutoff frequency, and the [RESONANCE] knob adjusts resonance. These affect the tone of the current zone as you play.',
      highlightControls: ['synth-cutoff', 'synth-resonance'],
      panelStateChanges: {
        'synth-mode-osc': { active: false },
        'synth-cutoff': { active: true },
        'synth-resonance': { active: true },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'A005',
        sceneName: 'Synth Lead',
        tempo: 128,
        beatSignature: '4/4',
        statusText: 'SYNTH CTRL — Turn Cutoff and Resonance while playing',
      },
    },
    {
      id: 'step-11',
      title: 'SYNTH CTRL Live Performance',
      instruction:
        'Turn the CUTOFF knob while playing notes to create expressive filter sweeps. Turn the RESONANCE knob to add a distinctive resonant character. These changes are temporary unless you save the tone.',
      details:
        'The edited parameter and its value appear in a popup window as you turn the knobs. Unlike general-purpose controllers, SYNTH CTRL changes always apply to the tone of the current zone only. If using layered settings, select the zone you want to edit first.',
      highlightControls: ['synth-cutoff', 'synth-resonance'],
      panelStateChanges: {},
      displayState: {
        screenType: 'popup',
        parameterName: 'Cutoff',
        parameterValue: '95',
        popupData: { popupType: 'value' },
        statusText: 'Live filter sweep — turn knobs while playing',
      },
      tipText:
        'SYNTH CTRL edits apply only to the current zone — great for tweaking one layer in a split.',
    },
    {
      id: 'step-12',
      title: 'SYNTH CTRL Section Buttons',
      instruction:
        'The section buttons (OSC, FILTER TYPE, PARAM, AMP, FX, LFO) are shortcuts to open the corresponding ZOOM editor tab. Press the FILTER TYPE button to jump directly to the Filter section in ZOOM.',
      details:
        'Each button in the SYNTH CTRL section opens a specific tab: [OSC] → OSC tab, [FILTER TYPE] → Filter Type tab, [PARAM] → Filter parameters, [AMP] → AMP ENV tab, [FX] → MFX EDIT screen, [LFO] → LFO tab. This lets you quickly jump between tone editing sections without scrolling through tabs.',
      highlightControls: ['synth-mode-filter', 'synth-mode-amp', 'synth-mode-fx', 'synth-mode-lfo'],
      panelStateChanges: {
        'synth-cutoff': { active: false },
        'synth-resonance': { active: false },
        'synth-mode-filter': { active: true },
      },
      displayState: {
        screenType: 'tone-edit-zoom',
        activeTab: 'FILTER',
        selectedIndex: 0,
        toneEditData: {
          toneType: 'Z-CORE',
          activePartials: [true, true, false, false],
          selectedPartial: 0,
        },
        menuItems: [
          { label: 'Filter Type: LPF', selected: true },
          { label: 'Cutoff: 95' },
          { label: 'Resonance: 30' },
          { label: 'Key Follow: +100' },
        ],
        statusText: 'FILTER TYPE button → ZOOM Filter tab',
      },
    },
    {
      id: 'step-13',
      title: 'Tone Editing Complete!',
      instruction:
        "Press Exit to return to the main screen. You've learned the ZOOM editor, Tone Initialize, and the SYNTH CTRL section for real-time sound shaping.",
      details:
        'Remember to save your changes with the Write button if you want to keep them. Next, try the PRO view (touch <To PRO> in ZOOM) for a detailed grid showing all partials at once. Use SYNTH CTRL knobs during live performance for expressive filter sweeps.',
      highlightControls: ['exit'],
      panelStateChanges: {
        'synth-mode-filter': { active: false },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'A005',
        sceneName: 'Synth Lead',
        tempo: 128,
        beatSignature: '4/4',
      },
      tipText:
        'Try the other Synth Control buttons (OSC, AMP, LFO, FX) — they all jump to the corresponding ZOOM tab.',
    },
  ],
};
