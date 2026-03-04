import { Tutorial } from '@/types/tutorial';

export const effectsRouting: Tutorial = {
  id: 'effects-routing',
  deviceId: 'fantom-08',
  title: 'Effects Routing and Signal Flow',
  description:
    'Understand the Fantom 08 effects signal flow and learn to configure MFX, insert effects (IFX), chorus, reverb, and master effects. Edit per-zone effects routing using the Effects Edit screen.',
  category: 'sound-design',
  difficulty: 'advanced',
  estimatedTime: '8 min',
  tags: ['effects', 'routing', 'mfx', 'ifx', 'master-fx', 'advanced'],
  steps: [
    {
      id: 'step-1',
      title: 'Understanding Effects Signal Flow',
      instruction:
        'The Fantom 08 has a multi-stage effects chain: each zone has MFX and Zone EQ, followed by shared IFX1/IFX2, Chorus, Reverb, Master Comp, Master EQ, and TFX (Total Effects).',
      details:
        'The signal path is: Tone → MFX → Zone EQ → Insert FX (IFX1/IFX2) → Chorus/Reverb → Master Comp → Master EQ → TFX → Output. Each stage can be independently configured.',
      highlightControls: [],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        sceneNumber: 'B010',
        sceneName: 'Synth Layers',
        tempo: 130,
        beatSignature: '4/4',
      },
    },
    {
      id: 'step-2',
      title: 'Select Zone 1',
      instruction:
        'Press Zone 1 to select it. Zone 1 has a Trance Key 1 tone that we will route through multiple effects.',
      highlightControls: ['zone-1'],
      panelStateChanges: {
        'zone-1': { active: true, ledOn: true, ledColor: '#3B82F6' },
      },
      displayState: {
        screenType: 'zone-view',
        title: 'ZONE VIEW',
        sceneNumber: 'B010',
        sceneName: 'Synth Layers',
        tempo: 130,
        beatSignature: '4/4',
        zoneViewMode: 4,
        zones: [
          {
            zoneNumber: 1,
            zoneName: 'Zone 1',
            toneName: 'Trance Key 1',
            toneType: 'Z-Core',
            toneBank: 'PR-A',
            toneCategory: 'Synth',
            toneNumber: '0156',
            keyRangeLow: 'C4',
            keyRangeHigh: 'C8',
            volume: 100,
            pan: 0,
            muted: false,
            active: true,
          },
          {
            zoneNumber: 2,
            zoneName: 'Zone 2',
            toneName: 'Finger Bass',
            toneType: 'SN-AP',
            toneBank: 'EXSN03',
            toneCategory: 'Bass',
            toneNumber: '0320',
            keyRangeLow: 'A0',
            keyRangeHigh: 'B3',
            volume: 90,
            pan: 0,
            muted: false,
            active: false,
          },
        ],
      },
      zones: [
        {
          zoneNumber: 1,
          color: '#3B82F6',
          lowNote: 60,
          highNote: 108,
          label: 'Zone 1 (Trance Key 1)',
        },
        {
          zoneNumber: 2,
          color: '#EF4444',
          lowNote: 21,
          highNote: 59,
          label: 'Zone 2 (Finger Bass)',
        },
      ],
    },
    {
      id: 'step-3',
      title: 'Open Effects Edit',
      instruction:
        'Press the Master FX button to access the Effects Edit screen. This shows the complete signal routing diagram for the internal sound engine.',
      details:
        'The Effects Edit screen has tabs: INTERNAL (main effects routing), AUDIO IN, PAD, USB, CLICK, and OUTPUT. We will focus on the INTERNAL tab.',
      highlightControls: ['master-fx'],
      panelStateChanges: {
        'master-fx': { active: true },
      },
      displayState: {
        screenType: 'effects-edit',
        activeTab: 'INTERNAL',
        selectedIndex: 0,
        zones: [
          {
            zoneNumber: 1,
            zoneName: 'Zone 1',
            toneName: 'Trance Key 1',
            keyRangeLow: 'C4',
            keyRangeHigh: 'C8',
            volume: 100,
            pan: 0,
            muted: false,
            active: true,
          },
        ],
      },
      tipText:
        'The routing diagram shows the signal path from zones through all effect stages to the output.',
    },
    {
      id: 'step-4',
      title: 'View Zone MFX Settings',
      instruction:
        'Select Zone 1 in the routing diagram to see its MFX settings. The diagram highlights the MFX block and shows the current effect type.',
      highlightControls: ['cursor-down'],
      panelStateChanges: {},
      displayState: {
        screenType: 'effects-edit',
        activeTab: 'INTERNAL',
        selectedIndex: 1,
        zones: [
          {
            zoneNumber: 1,
            zoneName: 'Zone 1',
            toneName: 'Trance Key 1',
            keyRangeLow: 'C4',
            keyRangeHigh: 'C8',
            volume: 100,
            pan: 0,
            muted: false,
            active: true,
            mfxEnabled: true,
          },
        ],
      },
    },
    {
      id: 'step-5',
      title: 'Edit the MFX Block',
      instruction:
        'Touch the MFX EDIT area to enter the Zone Effects zoom screen. Here you can change the MFX type, adjust Zone EQ, and set the send level to chorus/reverb.',
      details:
        'The Zone Effects screen shows: MFX on/off and type, Zone EQ gain bands (Low, Mid, Mid2, High), and the send levels from MFX to the shared chorus and reverb.',
      highlightControls: ['enter'],
      panelStateChanges: {},
      displayState: {
        screenType: 'effects-edit',
        activeTab: 'INTERNAL',
        selectedIndex: 2,
        menuItems: [
          { label: 'MFX Type: Tape Echo', selected: true },
          { label: 'MFX Switch: ON' },
          { label: 'Zone EQ: Low Gain: +6dB' },
          { label: 'Zone EQ: High Gain: +3dB' },
        ],
        zones: [
          {
            zoneNumber: 1,
            zoneName: 'Zone 1',
            toneName: 'Trance Key 1',
            keyRangeLow: 'C4',
            keyRangeHigh: 'C8',
            volume: 100,
            pan: 0,
            muted: false,
            active: true,
            mfxEnabled: true,
            eqEnabled: true,
          },
        ],
      },
      tipText:
        'E1 scrolls through parameters, E6 edits the selected value.',
    },
    {
      id: 'step-6',
      title: 'Configure Send Levels',
      instruction:
        'Navigate down to the Chorus and Reverb send parameters. Set the Chorus Send to 40 and Reverb Send to 60 for spatial depth.',
      highlightControls: ['cursor-down', 'function-e6'],
      panelStateChanges: {},
      displayState: {
        screenType: 'effects-edit',
        activeTab: 'INTERNAL',
        selectedIndex: 3,
        menuItems: [
          { label: 'MFX Type: Tape Echo' },
          { label: 'MFX Switch: ON' },
          { label: 'Chorus Send: 40' },
          { label: 'Reverb Send: 60', selected: true },
        ],
        zones: [
          {
            zoneNumber: 1,
            zoneName: 'Zone 1',
            toneName: 'Trance Key 1',
            keyRangeLow: 'C4',
            keyRangeHigh: 'C8',
            volume: 100,
            pan: 0,
            muted: false,
            active: true,
            mfxEnabled: true,
            eqEnabled: true,
            chorusSend: 40,
            reverbSend: 60,
          },
        ],
      },
    },
    {
      id: 'step-7',
      title: 'Switch to Zone 2',
      instruction:
        'Press the Zone 2 button to select the Finger Bass zone. Each zone has independent MFX settings, so Zone 2 can have a completely different effect chain.',
      highlightControls: ['zone-2'],
      panelStateChanges: {
        'zone-2': { active: true, ledOn: true, ledColor: '#EF4444' },
        'zone-1': { active: false, ledOn: true, ledColor: '#3B82F6' },
      },
      displayState: {
        screenType: 'effects-edit',
        activeTab: 'INTERNAL',
        selectedIndex: 0,
        zones: [
          {
            zoneNumber: 2,
            zoneName: 'Zone 2',
            toneName: 'Finger Bass',
            keyRangeLow: 'A0',
            keyRangeHigh: 'B3',
            volume: 90,
            pan: 0,
            muted: false,
            active: true,
            mfxEnabled: false,
          },
        ],
      },
      zones: [
        {
          zoneNumber: 1,
          color: '#3B82F6',
          lowNote: 60,
          highNote: 108,
          label: 'Zone 1 (Trance Key 1)',
        },
        {
          zoneNumber: 2,
          color: '#EF4444',
          lowNote: 21,
          highNote: 59,
          label: 'Zone 2 (Finger Bass)',
        },
      ],
    },
    {
      id: 'step-8',
      title: 'Enable MFX for Zone 2',
      instruction:
        'Touch the MFX block to enable it for Zone 2. Select a Compressor effect type — ideal for tightening bass sounds.',
      highlightControls: ['enter', 'value-dial'],
      panelStateChanges: {},
      displayState: {
        screenType: 'effects-edit',
        activeTab: 'INTERNAL',
        selectedIndex: 1,
        menuItems: [
          { label: 'MFX Type: Compressor', selected: true },
          { label: 'MFX Switch: ON' },
          { label: 'Zone EQ: Low Gain: 0dB' },
          { label: 'Zone EQ: High Gain: 0dB' },
        ],
        zones: [
          {
            zoneNumber: 2,
            zoneName: 'Zone 2',
            toneName: 'Finger Bass',
            keyRangeLow: 'A0',
            keyRangeHigh: 'B3',
            volume: 90,
            pan: 0,
            muted: false,
            active: true,
            mfxEnabled: true,
          },
        ],
      },
    },
    {
      id: 'step-9',
      title: 'View Master Effects',
      instruction:
        'Navigate to the Master FX section of the routing diagram. The Master Comp, Master EQ, and TFX affect all zones globally.',
      highlightControls: ['cursor-up', 'cursor-right'],
      panelStateChanges: {},
      displayState: {
        screenType: 'effects-edit',
        activeTab: 'INTERNAL',
        selectedIndex: 4,
        menuItems: [
          { label: 'Master Comp: ON' },
          { label: 'Master EQ: ON' },
          { label: 'IFX1 Type: Thru' },
          { label: 'IFX2 Type: Thru', selected: true },
        ],
        zones: [
          {
            zoneNumber: 2,
            zoneName: 'Zone 2',
            toneName: 'Finger Bass',
            keyRangeLow: 'A0',
            keyRangeHigh: 'B3',
            volume: 90,
            pan: 0,
            muted: false,
            active: true,
            mfxEnabled: true,
          },
        ],
      },
    },
    {
      id: 'step-10',
      title: 'Initialize Effects (Confirm)',
      instruction:
        'To reset Zone 2 effects to default, touch UTILITY and select ZONE INITIALIZE. A confirmation popup appears — press OK to confirm or CANCEL to keep your settings.',
      highlightControls: ['display'],
      panelStateChanges: {},
      displayState: {
        screenType: 'popup',
        popupData: {
          popupType: 'confirm',
          message: 'Initialize Zone 2 Effects?',
        },
      },
      tipText:
        'The confirm popup prevents accidental resets — always review before pressing OK.',
    },
    {
      id: 'step-11',
      title: 'Effects Routing Complete!',
      instruction:
        "Press Exit to cancel the reset and return to the main screen. You've learned the Fantom's effects signal flow, how to configure per-zone MFX, set send levels, and view master effects.",
      details:
        'Each zone can have its own MFX and EQ. Shared effects (IFX1/2, Chorus, Reverb) are controlled by send levels. Master effects (Comp, EQ, TFX) process the final mix.',
      highlightControls: ['exit'],
      panelStateChanges: {
        'master-fx': { active: false },
        'zone-2': { active: false, ledOn: false },
        'zone-1': { active: false, ledOn: false },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'B010',
        sceneName: 'Synth Layers',
        tempo: 130,
        beatSignature: '4/4',
      },
      tipText:
        'Use the FX button in Synth Control for quick access to MFX editing for the currently selected zone.',
    },
  ],
};
