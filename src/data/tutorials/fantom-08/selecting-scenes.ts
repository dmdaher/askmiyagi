import { Tutorial } from '@/types/tutorial';

export const selectingScenes: Tutorial = {
  id: 'selecting-scenes',
  deviceId: 'fantom-08',
  title: 'Selecting and Browsing Scenes',
  description:
    'Learn how to browse, preview, and select scenes on the Fantom 08. Scenes store complete sound setups including all zone and effect settings.',
  category: 'basics',
  difficulty: 'beginner',
  estimatedTime: '3 min',
  tags: ['scenes', 'browsing', 'basics', 'beginner'],
  steps: [
    {
      id: 'step-1',
      title: 'What Are Scenes?',
      instruction:
        'A Scene is a complete setup for the Fantom 08 — it stores all zone assignments, tones, effects, and keyboard splits in one preset.',
      details:
        'The Fantom 08 can hold hundreds of scenes organized in banks (A through H). Each bank has up to 128 scenes.',
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
      title: 'Open Scene Select',
      instruction:
        'Press the Scene Select button to enter the scene browser.',
      details:
        'The display switches to show a list of available scenes. The currently loaded scene is highlighted.',
      highlightControls: ['scene-select'],
      panelStateChanges: {
        'scene-select': { active: true },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'Concert Grand',
        tempo: 120,
        beatSignature: '4/4',
        statusText: 'Scene Select',
      },
      tipText:
        'The current scene name and number are always shown at the top of the home screen.',
    },
    {
      id: 'step-3',
      title: 'Browse Scenes',
      instruction:
        'Turn the Value dial to scroll through the scene list. Each scene loads immediately so you can preview the sound.',
      details:
        'You can also use the Inc and Dec buttons for step-by-step browsing. Turning the dial faster skips through scenes more quickly.',
      highlightControls: ['value-dial', 'inc', 'dec'],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        sceneNumber: 'A005',
        sceneName: 'Warm Pad Layer',
        tempo: 100,
        beatSignature: '4/4',
        statusText: 'Scene Select',
      },
    },
    {
      id: 'step-4',
      title: 'Switch Scene Banks',
      instruction:
        'Touch the bank indicator on screen (A, B, C, etc.) or use the Inc/Dec buttons to move between scene banks (A through H). Each bank holds a different set of scenes.',
      details:
        'Bank A typically contains factory presets. Banks further along may contain user presets or expansion sounds. The touchscreen grid makes it easy to jump between banks.',
      highlightControls: ['inc', 'dec'],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        sceneNumber: 'B012',
        sceneName: 'Funk Split',
        tempo: 110,
        beatSignature: '4/4',
        statusText: 'Scene Select',
      },
    },
    {
      id: 'step-5',
      title: 'Confirm Scene Selection',
      instruction:
        'Press Enter to confirm and load the selected scene. The Fantom will load all zone and effect settings.',
      highlightControls: ['enter'],
      panelStateChanges: {
        'scene-select': { active: false },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'B012',
        sceneName: 'Funk Split',
        tempo: 110,
        beatSignature: '4/4',
      },
      tipText:
        'On the real Fantom, scenes load instantly — you can switch scenes mid-performance without gaps.',
    },
    {
      id: 'step-6',
      title: 'Check Zone View',
      instruction:
        'Press Zone View to see what zones are active in this scene and what tones are assigned.',
      highlightControls: ['zone-view'],
      panelStateChanges: {
        'zone-view': { active: true },
      },
      displayState: {
        screenType: 'zone-view',
        title: 'ZONE VIEW',
        sceneNumber: 'B012',
        sceneName: 'Funk Split',
        tempo: 110,
        beatSignature: '4/4',
        zoneViewMode: 4,
        zones: [
          {
            zoneNumber: 1,
            zoneName: 'Zone 1',
            toneName: 'Clav Wah',
            toneType: 'Z-Core',
            toneBank: 'PR-A',
            toneCategory: 'Keys',
            toneNumber: '0045',
            keyRangeLow: 'A0',
            keyRangeHigh: 'B3',
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
            toneBank: 'PR-A',
            toneCategory: 'Bass',
            toneNumber: '0201',
            keyRangeLow: 'C4',
            keyRangeHigh: 'C8',
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
          lowNote: 21,
          highNote: 59,
          label: 'Zone 1 (Clav Wah)',
        },
        {
          zoneNumber: 2,
          color: '#EF4444',
          lowNote: 60,
          highNote: 108,
          label: 'Zone 2 (Finger Bass)',
        },
      ],
    },
    {
      id: 'step-7',
      title: 'Scene Selection Complete!',
      instruction:
        'You now know how to browse and select scenes. Try loading different scenes to explore the Fantom 08\'s built-in sounds.',
      details:
        "Next, try the 'Saving Your Work' tutorial to learn how to save your own scene modifications.",
      highlightControls: [],
      panelStateChanges: {
        'zone-view': { active: false },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'B012',
        sceneName: 'Funk Split',
        tempo: 110,
        beatSignature: '4/4',
      },
      tipText:
        'Use Scene Chain to create ordered playlists of scenes for live performance.',
    },
  ],
};
