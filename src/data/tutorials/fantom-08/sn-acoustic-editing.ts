import { Tutorial } from '@/types/tutorial';

export const snAcousticEditing: Tutorial = {
  id: 'sn-acoustic-editing',
  deviceId: 'fantom-08',
  title: 'SN-A Acoustic Tone Editing',
  description:
    'Learn to edit SuperNATURAL Acoustic (SN-A) tones — realistic acoustic instrument models with natural playing behavior. Adjust instrument-specific parameters, cutoff offset, and portamento for expressive performance.',
  category: 'sound-design',
  difficulty: 'intermediate',
  estimatedTime: '5 min',
  tags: ['sn-a', 'acoustic', 'supernatural', 'tone-edit', 'sound-design'],
  steps: [
    {
      id: 'step-1',
      title: 'Introduction to SN-A Engine',
      instruction:
        'SuperNATURAL Acoustic (SN-A) tones model real acoustic instruments with natural articulation and response. Each SN-A tone has instrument-specific parameters that capture the unique behavior of that instrument.',
      details:
        'SN-A covers instruments like saxophone, guitar, strings, trumpet, flute, and more. Each has unique parameters — for example, a saxophone has breath noise and growl, while a guitar has slide noise and body resonance.',
      highlightControls: [],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        sceneNumber: 'A020',
        sceneName: 'Nylon Guitar',
        tempo: 100,
        beatSignature: '4/4',
      },
    },
    {
      id: 'step-2',
      title: 'Select an SN-A Zone',
      instruction:
        'Press Zone 1 to select the zone containing our Nylon Gtr SN-A tone. The zone view confirms the tone type as SN-A.',
      highlightControls: ['zone-1'],
      panelStateChanges: {
        'zone-1': { active: true, ledOn: true, ledColor: '#3B82F6' },
      },
      displayState: {
        screenType: 'zone-view',
        title: 'ZONE VIEW',
        sceneNumber: 'A020',
        sceneName: 'Nylon Guitar',
        tempo: 100,
        beatSignature: '4/4',
        zoneViewMode: 1,
        zones: [
          {
            zoneNumber: 1,
            zoneName: 'Zone 1',
            toneName: 'Nylon Gtr',
            toneType: 'SN-A',
            toneBank: 'PR-A',
            toneCategory: 'Guitar',
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
          label: 'Zone 1 (Nylon Gtr)',
        },
      ],
    },
    {
      id: 'step-3',
      title: 'Enter SN-A Tone Edit — COMMON Tab',
      instruction:
        'Press the PARAM button to open the SN-A Tone Edit screen. The COMMON tab shows general settings including Category, Level, Pan, Tuning, Mono/Poly mode, and special SN-A parameters like Portamento Time Offset and Cutoff Offset.',
      details:
        'SN-A has four tabs: COMMON, INST, MFX, and MFX CONTROL. Note the Mono/Poly setting — many SN-A instruments default to MONO for realistic single-note behavior (e.g., saxophone, trumpet).',
      highlightControls: ['synth-param'],
      panelStateChanges: {
        'synth-param': { active: true },
      },
      displayState: {
        screenType: 'tone-edit-zoom',
        activeTab: 'COMMON',
        selectedIndex: 0,
        toneEditData: {
          toneType: 'SN-A',
        },
        menuItems: [
          { label: 'Category: 15:Guitar', selected: true },
          { label: 'Level: 107' },
          { label: 'Pan: 0' },
          { label: 'Coarse Tune: 0' },
          { label: 'Fine Tune: 0(cent)' },
          { label: 'Octave Shift: 0' },
          { label: 'Mono/Poly: MONO' },
          { label: 'Portamento Time Offset: 0' },
          { label: 'Cutoff Offset: 0' },
        ],
      },
    },
    {
      id: 'step-4',
      title: 'Navigate to INST Tab',
      instruction:
        'Turn E1 to switch to the INST tab. This shows parameters unique to this specific instrument — the available parameters vary depending on which SN-A instrument is loaded.',
      details:
        'Unlike Z-Core tones where OSC/FILTER/AMP parameters are standardized, SN-A INST parameters are custom to each instrument model. A nylon guitar might show body resonance and string noise, while a saxophone would show breath and growl parameters.',
      highlightControls: ['function-e1'],
      panelStateChanges: {},
      displayState: {
        screenType: 'tone-edit-zoom',
        activeTab: 'INST',
        selectedIndex: 0,
        toneEditData: {
          toneType: 'SN-A',
        },
        menuItems: [
          { label: 'Body Resonance: 70', selected: true },
          { label: 'String Noise: 50' },
          { label: 'Slide Noise: 40' },
          { label: 'Fret Noise: 30' },
        ],
      },
    },
    {
      id: 'step-5',
      title: 'Adjust an Instrument Parameter',
      instruction:
        'Select Body Resonance and press Enter to open the value popup. Higher values emphasize the acoustic body of the guitar for a warmer, more resonant sound.',
      highlightControls: ['enter'],
      panelStateChanges: {},
      displayState: {
        screenType: 'popup',
        parameterName: 'Body Resonance',
        parameterValue: '70',
        popupData: {
          popupType: 'value',
        },
      },
      tipText:
        'Play notes while adjusting to hear how each parameter changes the instrument character.',
    },
    {
      id: 'step-6',
      title: 'Navigate to MFX Tab',
      instruction:
        'Press Exit to close the popup, then turn E1 to the MFX tab. This controls the multi-effect applied to this SN-A tone — add reverb, delay, or amp simulation to enhance the acoustic character.',
      highlightControls: ['exit', 'function-e1'],
      panelStateChanges: {},
      displayState: {
        screenType: 'tone-edit-zoom',
        activeTab: 'MFX',
        selectedIndex: 0,
        toneEditData: {
          toneType: 'SN-A',
        },
        menuItems: [
          { label: 'MFX Type: 073:Overdrive→Chorus', selected: true },
          { label: 'MFX Switch: ON' },
          { label: 'OD Drive: 20' },
          { label: 'Chorus Rate: 50' },
        ],
      },
    },
    {
      id: 'step-7',
      title: 'MFX CONTROL Tab',
      instruction:
        'Turn E1 to the MFX CTRL tab. Here you can assign MIDI CC messages to control MFX parameters in real time — for example, using a pedal to control reverb depth during performance.',
      highlightControls: ['function-e1'],
      panelStateChanges: {},
      displayState: {
        screenType: 'tone-edit-zoom',
        activeTab: 'MFX CTRL',
        selectedIndex: 0,
        toneEditData: {
          toneType: 'SN-A',
        },
        menuItems: [
          { label: 'Control 1 Source: CC01', selected: true },
          { label: 'Control 1 Dest: MFX Param 1' },
          { label: 'Control 1 Depth: +63' },
          { label: 'Control 2 Source: OFF' },
        ],
      },
    },
    {
      id: 'step-8',
      title: 'SN-A Editing Complete!',
      instruction:
        'Press Exit to return to the home screen. You\'ve explored the SN-A engine — with its instrument-specific INST parameters, standard COMMON settings, and MFX processing. Each SN-A instrument has unique parameters tailored to that specific instrument.',
      details:
        'The SN-A engine is ideal for realistic solo acoustic instruments. For layered or heavily processed sounds, Z-Core tones offer more flexibility with multiple partials and detailed oscillator control.',
      highlightControls: ['exit'],
      panelStateChanges: {
        'synth-param': { active: false },
        'zone-1': { active: false, ledOn: false },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'A020',
        sceneName: 'Nylon Guitar',
        tempo: 100,
        beatSignature: '4/4',
      },
    },
  ],
};
