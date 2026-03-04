import { Tutorial } from '@/types/tutorial';

export const editingMfx: Tutorial = {
  id: 'editing-mfx',
  deviceId: 'fantom-08',
  title: 'Editing Zone Effects (MFX)',
  description:
    'Learn how to access and edit the MFX (Multi-Effects) block for each zone. Apply effects like reverb, delay, distortion, and chorus to shape your sound.',
  category: 'effects',
  difficulty: 'intermediate',
  estimatedTime: '5 min',
  tags: ['effects', 'mfx', 'reverb', 'delay', 'chorus', 'intermediate'],
  steps: [
    {
      id: 'step-1',
      title: 'What Is MFX?',
      instruction:
        'MFX (Multi-Effects) is a powerful per-zone effect processor with 91 effect types — from reverb and delay to distortion, phaser, and chorus.',
      details:
        "Each zone has its own independent MFX block. The signal flow is: Zone Tone → MFX → Zone EQ → Insert Effects → Master Effects. In this tutorial, you'll learn to select and edit MFX for Zone 1.",
      highlightControls: [],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'Clean Piano',
        tempo: 120,
        beatSignature: '4/4',
      },
    },
    {
      id: 'step-2',
      title: 'Select Your Zone',
      instruction:
        'Press Zone 1 to select the zone you want to add effects to.',
      highlightControls: ['zone-1'],
      panelStateChanges: {
        'zone-1': { active: true, ledOn: true, ledColor: '#3B82F6' },
      },
      displayState: {
        screenType: 'zone-view',
        title: 'ZONE VIEW',
        sceneNumber: 'A001',
        sceneName: 'Clean Piano',
        tempo: 120,
        beatSignature: '4/4',
        zoneViewMode: 1,
        zones: [
          {
            zoneNumber: 1,
            zoneName: 'Zone 1',
            toneName: 'Concert Grand',
            toneType: 'SN-AP',
            toneBank: 'EXSN03',
            toneCategory: 'Ac.Piano',
            toneNumber: '0001',
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
          label: 'Zone 1 (Piano)',
        },
      ],
    },
    {
      id: 'step-3',
      title: 'Open the Effects Editor',
      instruction:
        'Press the FX button in the Synth Control section to jump directly to the MFX editor for the selected zone.',
      details:
        'You can also access MFX through Menu → TONE EDIT → MFX tab, but the FX button is the fastest shortcut.',
      highlightControls: ['synth-mode-fx'],
      panelStateChanges: {
        'synth-mode-fx': { active: true },
      },
      displayState: {
        screenType: 'effect',
        title: 'MFX - Zone 1',
        tempo: 120,
        beatSignature: '4/4',
        menuItems: [
          { label: 'MFX Type: Thru', selected: true },
          { label: 'MFX Switch: ON' },
          { label: 'MFX Param 1: ---' },
          { label: 'MFX Param 2: ---' },
        ],
        selectedIndex: 0,
      },
      tipText:
        'The FX button is a quick shortcut — no need to navigate through menus.',
    },
    {
      id: 'step-4',
      title: 'Choose an Effect Type',
      instruction:
        "With 'MFX Type' selected, turn the Value dial to browse through the 91 available effect types. Select 'Tape Echo' for a classic delay effect.",
      details:
        'Effect categories include: Filter (01-10), Modulation (11-22), Chorus (23-28), Dynamics (29-36), Delay (37-44), Lo-fi (45-46), Pitch (47-48), Combinations (49-71), and more.',
      highlightControls: ['value-dial'],
      panelStateChanges: {},
      displayState: {
        screenType: 'effect',
        title: 'MFX - Zone 1',
        tempo: 120,
        beatSignature: '4/4',
        menuItems: [
          { label: 'MFX Type: Tape Echo', selected: true },
          { label: 'MFX Switch: ON' },
          { label: 'Delay Time: 350ms' },
          { label: 'Feedback: 40%' },
          { label: 'High Cut: 8.0kHz' },
          { label: 'Saturation: 30' },
          { label: 'Dry/Wet: D80:W20' },
        ],
        selectedIndex: 0,
      },
      tipText:
        'Tape Echo simulates vintage tape delay units — warm and slightly degraded repeats.',
    },
    {
      id: 'step-5',
      title: 'Edit Effect Parameters',
      instruction:
        "Use the Cursor Down button to navigate to 'Delay Time', then use the Value dial to adjust it. Try 350ms for a rhythmic quarter-note delay at 120 BPM.",
      highlightControls: ['cursor-down', 'value-dial'],
      panelStateChanges: {},
      displayState: {
        screenType: 'effect',
        title: 'MFX - Zone 1',
        tempo: 120,
        beatSignature: '4/4',
        menuItems: [
          { label: 'MFX Type: Tape Echo' },
          { label: 'MFX Switch: ON' },
          { label: 'Delay Time: 350ms', selected: true },
          { label: 'Feedback: 40%' },
          { label: 'High Cut: 8.0kHz' },
          { label: 'Saturation: 30' },
          { label: 'Dry/Wet: D80:W20' },
        ],
        selectedIndex: 2,
      },
    },
    {
      id: 'step-6',
      title: 'Adjust the Dry/Wet Mix',
      instruction:
        "Navigate down to 'Dry/Wet' and set it to D70:W30 for a noticeable but not overwhelming echo effect.",
      details:
        'Dry is your original unprocessed sound, Wet is the effect. Higher wet values mean more effect. D70:W30 is a good starting point for delay.',
      highlightControls: ['cursor-down', 'value-dial'],
      panelStateChanges: {},
      displayState: {
        screenType: 'effect',
        title: 'MFX - Zone 1',
        tempo: 120,
        beatSignature: '4/4',
        menuItems: [
          { label: 'MFX Type: Tape Echo' },
          { label: 'MFX Switch: ON' },
          { label: 'Delay Time: 350ms' },
          { label: 'Feedback: 40%' },
          { label: 'High Cut: 8.0kHz' },
          { label: 'Saturation: 30' },
          { label: 'Dry/Wet: D70:W30', selected: true },
        ],
        selectedIndex: 6,
      },
      tipText:
        "Play some notes while adjusting — you'll hear the delay respond in real time.",
    },
    {
      id: 'step-7',
      title: 'Quick Edit with E-Knobs',
      instruction:
        'The six E-knobs below the display provide quick access to the most important MFX parameters. Turn them to adjust values without navigating the menu.',
      details:
        'E1-E6 are automatically mapped to the first six parameters of the current MFX type. This is the fastest way to tweak effects during performance.',
      highlightControls: [
        'function-e1',
        'function-e2',
        'function-e3',
        'function-e4',
      ],
      panelStateChanges: {},
      displayState: {
        screenType: 'effect',
        title: 'MFX - Zone 1',
        tempo: 120,
        beatSignature: '4/4',
        menuItems: [
          { label: 'MFX Type: Tape Echo' },
          { label: 'MFX Switch: ON' },
          { label: 'E1: Delay Time: 350ms' },
          { label: 'E2: Feedback: 40%' },
          { label: 'E3: High Cut: 8.0kHz' },
          { label: 'E4: Saturation: 30' },
          { label: 'Dry/Wet: D70:W30' },
        ],
        selectedIndex: 2,
      },
      tipText:
        'E-knobs are your best friend for real-time effect tweaking during performance.',
    },
    {
      id: 'step-8',
      title: 'MFX Editing Complete!',
      instruction:
        'Press Exit to return to the main screen. Your Zone 1 now has a Tape Echo effect applied. Save your scene with Write to keep the effect settings.',
      details:
        'Each zone can have its own MFX type and settings. Try different effects like Chorus, Phaser, or Guitar Amp Sim to transform your sounds. The Fantom has 91 MFX types to explore!',
      highlightControls: ['exit'],
      panelStateChanges: {
        'synth-mode-fx': { active: false },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'Clean Piano',
        tempo: 120,
        beatSignature: '4/4',
      },
      tipText:
        'Popular MFX choices: Tape Echo for keys, Guitar Amp Sim for guitar tones, Rotary for organ, Chorus for strings.',
    },
  ],
};
