import { Tutorial } from '@/types/tutorial';

export const velocityLayersZones: Tutorial = {
  id: 'velocity-layers-zones',
  deviceId: 'fantom-08',
  title: 'Velocity Layers & Zone Editing',
  description:
    'Create velocity-layered zones where different sounds respond to soft and hard playing, then explore the Zone Edit screen to fine-tune velocity ranges, mono/poly settings, voice reserve, and zone initialization.',
  category: 'zones-splits',
  difficulty: 'advanced',
  estimatedTime: '8 min',
  tags: ['zones', 'velocity', 'zone-edit', 'voice-reserve', 'advanced'],
  steps: [
    {
      id: 'step-1',
      title: 'Velocity Layers Overview',
      instruction:
        'Velocity layers let different zones respond to different playing dynamics. By setting velocity ranges, you can have a soft piano for gentle playing and a bright piano for harder strikes — all on the same keys.',
      details:
        'The Zone Edit screen gives deep per-zone control over velocity ranges, mono/poly modes, voice reserve, and more. In this tutorial you will set up a 4-zone scene with velocity-split pianos, strings, and bass.',
      highlightControls: [],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        sceneNumber: 'A003',
        sceneName: 'Velocity Layers',
        tempo: 120,
        beatSignature: '4/4',
      },
    },
    {
      id: 'step-2',
      title: 'Open Zone View',
      instruction:
        'Press Zone View to see the 4-zone setup. Zone 1 is a soft piano (velocity 1–80), Zone 2 is a bright piano (velocity 81–127), Zone 3 is strings, and Zone 4 is bass.',
      highlightControls: ['zone-view'],
      panelStateChanges: {
        'zone-view': { active: true },
      },
      displayState: {
        screenType: 'zone-view',
        title: 'ZONE VIEW',
        sceneNumber: 'A003',
        sceneName: 'Velocity Layers',
        tempo: 120,
        beatSignature: '4/4',
        zoneViewMode: 4,
        zones: [
          {
            zoneNumber: 1,
            zoneName: 'Zone 1',
            toneName: 'Mellow Concert',
            toneType: 'SN-AP',
            toneBank: 'PR-A',
            toneCategory: 'Ac.Piano',
            toneNumber: '0005',
            keyRangeLow: 'C3',
            keyRangeHigh: 'C8',
            volume: 100,
            pan: 0,
            muted: false,
            active: true,
          },
          {
            zoneNumber: 2,
            zoneName: 'Zone 2',
            toneName: 'Bright Concert',
            toneType: 'SN-AP',
            toneBank: 'PR-A',
            toneCategory: 'Ac.Piano',
            toneNumber: '0008',
            keyRangeLow: 'C3',
            keyRangeHigh: 'C8',
            volume: 100,
            pan: 0,
            muted: false,
            active: false,
          },
          {
            zoneNumber: 3,
            zoneName: 'Zone 3',
            toneName: 'Strings Sect 1',
            toneType: 'Z-Core',
            toneBank: 'PR-A',
            toneCategory: 'Strings',
            toneNumber: '0301',
            keyRangeLow: 'C3',
            keyRangeHigh: 'C8',
            volume: 80,
            pan: 0,
            muted: false,
            active: false,
          },
          {
            zoneNumber: 4,
            zoneName: 'Zone 4',
            toneName: 'Finger Bass',
            toneType: 'SN-AP',
            toneBank: 'PR-A',
            toneCategory: 'Bass',
            toneNumber: '0201',
            keyRangeLow: 'A0',
            keyRangeHigh: 'B2',
            volume: 100,
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
          lowNote: 48,
          highNote: 108,
          label: 'Zone 1 (Soft Piano)',
        },
        {
          zoneNumber: 2,
          color: '#EF4444',
          lowNote: 48,
          highNote: 108,
          label: 'Zone 2 (Bright Piano)',
        },
        {
          zoneNumber: 3,
          color: '#10B981',
          lowNote: 48,
          highNote: 108,
          label: 'Zone 3 (Strings)',
        },
        {
          zoneNumber: 4,
          color: '#F59E0B',
          lowNote: 21,
          highNote: 47,
          label: 'Zone 4 (Bass)',
        },
      ],
    },
    {
      id: 'step-3',
      title: 'Enter Zone Edit',
      instruction:
        'Press Menu, then touch ZONE EDIT to open the zone parameter editor. This screen lets you configure each zone individually across many tabs.',
      highlightControls: ['menu', 'enter'],
      panelStateChanges: {
        'zone-view': { active: false },
        menu: { active: true },
      },
      displayState: {
        screenType: 'zone-edit',
        title: 'ZONE EDIT',
        activeTab: 'TONE',
        menuItems: [
          { label: 'Zone 1: Mellow Concert', selected: true },
          { label: 'Zone 2: Bright Concert' },
          { label: 'Zone 3: Strings Sect 1' },
          { label: 'Zone 4: Finger Bass' },
        ],
        selectedIndex: 0,
      },
    },
    {
      id: 'step-4',
      title: 'Navigate to VEL RANGE Tab',
      instruction:
        'Use E1 to scroll the left tab list to VEL RANGE. This tab shows the velocity range settings for each zone. Zone 1 is set to 1–80 (soft playing) and Zone 2 is set to 81–127 (hard playing).',
      highlightControls: ['function-e1'],
      panelStateChanges: {
        menu: { active: false },
      },
      displayState: {
        screenType: 'zone-edit',
        title: 'ZONE EDIT',
        activeTab: 'VEL RANGE',
        menuItems: [
          { label: 'Zone 1  Vel: 1 – 80', selected: true },
          { label: 'Zone 2  Vel: 81 – 127' },
          { label: 'Zone 3  Vel: 1 – 127' },
          { label: 'Zone 4  Vel: 1 – 127' },
        ],
        selectedIndex: 0,
      },
      tipText:
        'Velocity layers work because zones with overlapping key ranges respond to different velocity ranges — soft playing triggers Zone 1, hard playing triggers Zone 2.',
    },
    {
      id: 'step-5',
      title: 'Edit Velocity Range',
      instruction:
        'Select Zone 2 and use E6 to adjust the lower velocity boundary. Setting it to 81 means Zone 2 only sounds when you play with velocity 81 or higher.',
      highlightControls: ['function-e6'],
      panelStateChanges: {},
      displayState: {
        screenType: 'popup',
        title: 'VEL RANGE',
        parameterName: 'Vel Range Lower',
        parameterValue: '81',
        popupData: { popupType: 'value' },
      },
    },
    {
      id: 'step-6',
      title: 'Navigate to MONO/POLY Tab',
      instruction:
        'Scroll to the MONO/POLY tab with E1. Here you can set each zone to monophonic or polyphonic mode, enable legato, and configure voice reserve.',
      highlightControls: ['function-e1'],
      panelStateChanges: {},
      displayState: {
        screenType: 'zone-edit',
        title: 'ZONE EDIT',
        activeTab: 'MONO/POLY',
        menuItems: [
          { label: 'Mono/Poly: POLY', selected: true },
          { label: 'Legato: OFF' },
          { label: 'Voice Reserve: 0' },
        ],
        selectedIndex: 0,
      },
    },
    {
      id: 'step-7',
      title: 'Adjust Voice Reserve',
      instruction:
        'Select Voice Reserve and set it to 16 for Zone 1. Voice Reserve guarantees a minimum number of polyphony voices for this zone, preventing other zones from stealing all available voices.',
      highlightControls: ['function-e6'],
      panelStateChanges: {},
      displayState: {
        screenType: 'popup',
        title: 'MONO/POLY',
        parameterName: 'Voice Reserve',
        parameterValue: '16',
        popupData: { popupType: 'value' },
      },
    },
    {
      id: 'step-8',
      title: 'Zone Utility: Initialize a Zone',
      instruction:
        'On the ZONE EDIT screen, touch UTILITY to open the zone utility window. This provides ZONE INITIALIZE — useful for resetting a zone back to its default settings.',
      details:
        'Zone Initialize resets all parameters of the current zone to factory defaults. This is helpful when you want to start fresh on a zone without affecting other zones in the scene.',
      highlightControls: ['function-e6'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'UTILITY',
        menuItems: [
          { label: 'ZONE INITIALIZE', selected: true },
        ],
        selectedIndex: 0,
      },
    },
    {
      id: 'step-9',
      title: 'Confirm Zone Initialize',
      instruction:
        'Select ZONE INITIALIZE with E6, then press E5 OK to confirm. The zone is reset and you return to the ZONE EDIT screen. Press E6 CANCEL if you change your mind.',
      highlightControls: ['function-e5'],
      panelStateChanges: {},
      displayState: {
        screenType: 'popup',
        title: 'ZONE INITIALIZE',
        confirmText: 'Initialize Zone 3?',
        popupData: { popupType: 'confirm' },
      },
      tipText:
        'Zone Initialize only affects the selected zone — your other zones remain untouched.',
    },
    {
      id: 'step-10',
      title: 'Velocity Layers Complete!',
      instruction:
        'Your velocity-layered zone setup is ready. Soft playing triggers the mellow piano, hard playing triggers the bright piano, with strings layered on top and bass below. Press Write to save your scene.',
      details:
        'Velocity layering is a powerful technique for expressive live performance. Experiment with different velocity split points and overlapping ranges for crossfade effects between zones.',
      highlightControls: [],
      panelStateChanges: {
        'function-e5': { active: false },
        'function-e6': { active: false },
        'function-e1': { active: false },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'A003',
        sceneName: 'Velocity Layers',
        tempo: 120,
        beatSignature: '4/4',
      },
      zones: [
        {
          zoneNumber: 1,
          color: '#3B82F6',
          lowNote: 48,
          highNote: 108,
          label: 'Zone 1 (Mellow Concert)',
        },
        {
          zoneNumber: 2,
          color: '#EF4444',
          lowNote: 48,
          highNote: 108,
          label: 'Zone 2 (Bright Concert)',
        },
        {
          zoneNumber: 3,
          color: '#10B981',
          lowNote: 48,
          highNote: 108,
          label: 'Zone 3 (Strings Sect 1)',
        },
        {
          zoneNumber: 4,
          color: '#F59E0B',
          lowNote: 21,
          highNote: 47,
          label: 'Zone 4 (Finger Bass)',
        },
      ],
    },
  ],
};
