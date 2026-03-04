import { Tutorial } from '@/types/tutorial';

export const snPianoEditing: Tutorial = {
  id: 'sn-piano-editing',
  deviceId: 'fantom-08',
  title: 'SN-AP & SN-EP Piano Tone Editing',
  description:
    'Learn to edit SuperNATURAL Acoustic Piano (SN-AP) and Electric Piano (SN-EP) tones. These specialized engines model realistic piano behavior with instrument-specific parameters like stereo width and noise level.',
  category: 'sound-design',
  difficulty: 'intermediate',
  estimatedTime: '7 min',
  tags: ['sn-ap', 'sn-ep', 'piano', 'tone-edit', 'partial-copy', 'sound-design'],
  steps: [
    {
      id: 'step-1',
      title: 'Introduction to SuperNATURAL Piano Engines',
      instruction:
        'The Fantom 08 has two dedicated piano engines: SN-AP (SuperNATURAL Acoustic Piano) for grand and upright pianos, and SN-EP (SuperNATURAL Electric Piano) for Rhodes, Wurlitzer, and other electric pianos.',
      details:
        'Both engines use physical modeling for realistic behavior — they respond naturally to touch and sustain pedal. The SN-AP and SN-EP expansions are pre-installed by factory default.',
      highlightControls: [],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'Concert Grand',
        tempo: 120,
        beatSignature: '4/4',
      },
    },
    {
      id: 'step-2',
      title: 'Select an SN-AP Zone',
      instruction:
        'Press Zone 1 to select the zone containing our Concert Grand tone. The zone view shows the tone type as SN-AP.',
      highlightControls: ['zone-1'],
      panelStateChanges: {
        'zone-1': { active: true, ledOn: true, ledColor: '#3B82F6' },
      },
      displayState: {
        screenType: 'zone-view',
        title: 'ZONE VIEW',
        sceneNumber: 'A001',
        sceneName: 'Concert Grand',
        tempo: 120,
        beatSignature: '4/4',
        zoneViewMode: 1,
        zones: [
          {
            zoneNumber: 1,
            zoneName: 'Zone 1',
            toneName: 'Concert Grand',
            toneType: 'SN-AP',
            toneBank: 'PR-A',
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
          label: 'Zone 1 (Concert Grand)',
        },
      ],
    },
    {
      id: 'step-3',
      title: 'Enter SN-AP Tone Edit',
      instruction:
        'Press the PARAM button to open the SN-AP Tone Edit screen. The COMMON tab shows general tone settings: Category, Level, Pan, Tuning, and Send Levels.',
      details:
        'SN-AP has four tabs: COMMON (general settings), INST (instrument-specific parameters), MFX (multi-effects), and MFX CONTROL (MIDI control of MFX). E1 scrolls tabs, E2 moves the cursor, E6 edits values.',
      highlightControls: ['synth-param'],
      panelStateChanges: {
        'synth-param': { active: true },
      },
      displayState: {
        screenType: 'tone-edit-zoom',
        activeTab: 'COMMON',
        selectedIndex: 0,
        toneEditData: {
          toneType: 'SN-AP',
        },
        menuItems: [
          { label: 'Category: 01:Ac.Piano', selected: true },
          { label: 'Level: 80' },
          { label: 'Pan: 0' },
          { label: 'Coarse Tune: 0' },
          { label: 'Fine Tune: 0(cent)' },
          { label: 'Octave Shift: 0' },
          { label: 'Mono/Poly: POLY' },
          { label: 'Chorus Send Level: 0' },
          { label: 'Reverb Send Level: 0' },
        ],
      },
    },
    {
      id: 'step-4',
      title: 'Navigate to INST Tab',
      instruction:
        'Turn E1 to switch to the INST tab. This shows the instrument-specific parameter unique to SN-AP: Stereo Width.',
      details:
        'Stereo Width adjusts the stereo spread of the acoustic piano sound. A value of 0 produces a narrow/mono image, while 100 gives the widest stereo spread.',
      highlightControls: ['function-e1'],
      panelStateChanges: {},
      displayState: {
        screenType: 'tone-edit-zoom',
        activeTab: 'INST',
        selectedIndex: 0,
        toneEditData: {
          toneType: 'SN-AP',
        },
        menuItems: [
          { label: 'Stereo Width: 40', selected: true },
        ],
      },
    },
    {
      id: 'step-5',
      title: 'Adjust Stereo Width',
      instruction:
        'With "Stereo Width" selected, press Enter to open a focused value popup. Lower values narrow the stereo image toward mono, while higher values widen the spread (0–100).',
      highlightControls: ['enter'],
      panelStateChanges: {},
      displayState: {
        screenType: 'popup',
        parameterName: 'Stereo Width',
        parameterValue: '40',
        popupData: {
          popupType: 'value',
        },
      },
      tipText:
        'Try different stereo width values while playing — lower values focus the sound in the center, higher values spread it across the stereo field.',
    },
    {
      id: 'step-6',
      title: 'Switch to an SN-EP Tone',
      instruction:
        'Press Exit to leave Tone Edit, then select a new tone with SN-EP type. Navigate to the Tone Edit screen for the electric piano. The COMMON tab shows similar settings but with Category 04:E.Piano1.',
      details:
        'SN-EP tones model classic electric pianos like the Rhodes and Wurlitzer. They share the same tab structure (COMMON, INST, MFX, MFX CTRL) but with different instrument-specific parameters on the INST tab.',
      highlightControls: ['exit'],
      panelStateChanges: {},
      displayState: {
        screenType: 'tone-edit-zoom',
        activeTab: 'COMMON',
        selectedIndex: 0,
        toneEditData: {
          toneType: 'SN-EP',
        },
        menuItems: [
          { label: 'Category: 04:E.Piano1', selected: true },
          { label: 'Level: 118' },
          { label: 'Pan: 0' },
          { label: 'Coarse Tune: 0' },
          { label: 'Fine Tune: 0(cent)' },
          { label: 'Octave Shift: 0' },
          { label: 'Mono/Poly: POLY' },
          { label: 'Chorus Send Level: 0' },
          { label: 'Reverb Send Level: 0' },
        ],
        statusText: 'Tone: 4Tine Mk I Trm',
      },
    },
    {
      id: 'step-7',
      title: 'SN-EP Instrument Parameters',
      instruction:
        'Turn E1 to the INST tab. SN-EP has its own instrument-specific parameter: Noise Level.',
      details:
        'Noise Level adjusts the amount of mechanical noise in the electric piano sound (0–127). Higher values add more of the characteristic mechanical sounds of the electric piano mechanism.',
      highlightControls: ['function-e1'],
      panelStateChanges: {},
      displayState: {
        screenType: 'tone-edit-zoom',
        activeTab: 'INST',
        selectedIndex: 0,
        toneEditData: {
          toneType: 'SN-EP',
        },
        menuItems: [
          { label: 'Noise Level: 64', selected: true },
        ],
      },
    },
    {
      id: 'step-8',
      title: 'Adjust Noise Level',
      instruction:
        'Press Enter on Noise Level to open the value popup. Higher values add more mechanical noise to the electric piano sound (0–127).',
      highlightControls: ['enter'],
      panelStateChanges: {},
      displayState: {
        screenType: 'popup',
        parameterName: 'Noise Level',
        parameterValue: '64',
        popupData: {
          popupType: 'value',
        },
      },
    },
    {
      id: 'step-9',
      title: 'Partial Copy via UTILITY',
      instruction:
        'From the Tone Edit screen, touch <UTILITY> to access advanced functions. Select PARTIAL COPY to copy settings between partials — useful for building layered sounds from existing presets.',
      details:
        'The UTILITY window offers: TONE INITIALIZE (reset entire tone), PARTIAL INITIALIZE (reset one partial), PARTIAL COPY (copy between partials), and MULTISAMPLE EDIT. Select the SOURCE partial and DEST partial, then confirm with E6 OK → E5 OK.',
      highlightControls: ['menu'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'UTILITY',
        menuItems: [
          { label: 'TONE INITIALIZE' },
          { label: 'PARTIAL INITIALIZE' },
          { label: 'PARTIAL COPY', selected: true },
          { label: 'MULTISAMPLE EDIT' },
        ],
        selectedIndex: 2,
      },
    },
    {
      id: 'step-10',
      title: 'SN Piano Editing Complete!',
      instruction:
        'Press Exit to return to the home screen. You\'ve learned to edit both SN-AP and SN-EP piano tones — exploring their INST tab parameters (Stereo Width for SN-AP, Noise Level for SN-EP) and using Partial Copy to transfer settings between partials.',
      details:
        'Remember to save your edited tones with the Write button. Both SN-AP and SN-EP also have MFX tabs for adding effects like reverb, chorus, or amp simulation.',
      highlightControls: ['exit'],
      panelStateChanges: {
        'synth-param': { active: false },
        'zone-1': { active: false, ledOn: false },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'Concert Grand',
        tempo: 120,
        beatSignature: '4/4',
      },
    },
  ],
};
