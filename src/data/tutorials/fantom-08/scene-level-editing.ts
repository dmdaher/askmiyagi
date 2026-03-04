import { Tutorial } from '@/types/tutorial';

export const sceneLevelEditing: Tutorial = {
  id: 'scene-level-editing',
  deviceId: 'fantom-08',
  title: 'Scene-Level Sound Design',
  description:
    'Learn how to edit scene-wide parameters and individual zone settings using the Scene Edit and Zone Edit screens. Adjust levels, tempo, key ranges, and more for your entire performance setup.',
  category: 'sound-design',
  difficulty: 'intermediate',
  estimatedTime: '7 min',
  tags: ['scene', 'zone-edit', 'sound-design', 'intermediate'],
  steps: [
    {
      id: 'step-1',
      title: 'Introduction to Scene Editing',
      instruction:
        'Scene parameters control settings that apply to your entire performance setup — master level, tempo, pad mode, and more. Zone parameters let you fine-tune each zone independently.',
      details:
        'The Fantom 08 has two editing levels: Scene Edit (global settings) and Zone Edit (per-zone settings like tone assignment, level/pan, key range, EQ, and MIDI routing).',
      highlightControls: [],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'Grand & Strings',
        tempo: 120,
        beatSignature: '4/4',
      },
    },
    {
      id: 'step-2',
      title: 'Open the Menu',
      instruction:
        'Press the Menu button to access the main menu, where you can find Scene Edit and Zone Edit options.',
      highlightControls: ['menu'],
      panelStateChanges: {
        menu: { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'MENU',
        menuItems: [
          { label: 'TONE EDIT' },
          { label: 'EFFECTS EDIT' },
          { label: 'ZONE EDIT' },
          { label: 'SCENE EDIT', selected: true },
        ],
        selectedIndex: 3,
      },
    },
    {
      id: 'step-3',
      title: 'Enter Scene Edit',
      instruction:
        'Select SCENE EDIT from the menu. The Scene Edit screen appears with tabs for different parameter categories.',
      details:
        'Scene Edit tabs: GENERAL (level, tempo), CONTROL (tone control MIDI messages), PEDAL, KNOB, SLIDER, S1/S2, WHEEL1/2, VOCODER, and SONG. E1 scrolls tabs, E2 selects parameters, E6 edits values.',
      highlightControls: ['cursor-down', 'enter'],
      panelStateChanges: {},
      displayState: {
        screenType: 'scene-edit',
        activeTab: 'GENERAL',
        selectedIndex: 0,
        menuItems: [
          { label: 'Scene Level: 80', selected: true },
          { label: 'Tempo: 120.00' },
          { label: 'Pad Mode: SYSTEM' },
          { label: 'Pad Zone Select: OFF' },
        ],
      },
      tipText:
        'E1 scrolls tabs, E2 moves the cursor, E6 edits the selected value.',
    },
    {
      id: 'step-4',
      title: 'Adjust Scene Level',
      instruction:
        'With Scene Level selected, turn E6 or the Value dial to increase the overall scene volume to 100. This affects the master output of all zones.',
      highlightControls: ['function-e6', 'value-dial'],
      panelStateChanges: {},
      displayState: {
        screenType: 'scene-edit',
        activeTab: 'GENERAL',
        selectedIndex: 0,
        menuItems: [
          { label: 'Scene Level: 100', selected: true },
          { label: 'Tempo: 120.00' },
          { label: 'Pad Mode: SYSTEM' },
          { label: 'Pad Zone Select: OFF' },
        ],
      },
    },
    {
      id: 'step-5',
      title: 'Browse Scene Tabs',
      instruction:
        'Turn E1 to navigate to the CONTROL tab. This tab specifies MIDI messages sent when using Tone Control knobs 1-4.',
      highlightControls: ['function-e1'],
      panelStateChanges: {},
      displayState: {
        screenType: 'scene-edit',
        activeTab: 'CONTROL',
        selectedIndex: 0,
        menuItems: [
          { label: 'Tone Ctrl 1: Cutoff', selected: true },
          { label: 'Tone Ctrl 2: Resonance' },
          { label: 'Tone Ctrl 3: Env Attack' },
          { label: 'Tone Ctrl 4: Env Release' },
        ],
      },
      tipText:
        'The CONTROL tab lets you customize what the front-panel knobs do for this scene.',
    },
    {
      id: 'step-6',
      title: 'Open Zone Edit',
      instruction:
        'Press Exit to return to the menu, then select ZONE EDIT. The Zone Edit screen shows a grid of per-zone parameters.',
      details:
        'Zone Edit has two categories: INT (internal sound engine settings) and EXT (external MIDI module settings). We will focus on INT settings.',
      highlightControls: ['exit', 'enter'],
      panelStateChanges: {},
      displayState: {
        screenType: 'zone-edit',
        activeTab: 'TONE',
        zoneEditCategory: 'INT',
        selectedIndex: 0,
        zones: [
          {
            zoneNumber: 1,
            zoneName: 'Zone 1',
            toneName: 'Concert Grand',
            keyRangeLow: 'A0',
            keyRangeHigh: 'C8',
            volume: 100,
            pan: 0,
            muted: false,
            active: true,
          },
          {
            zoneNumber: 2,
            zoneName: 'Zone 2',
            toneName: 'Strings Sect 1',
            keyRangeLow: 'A0',
            keyRangeHigh: 'C8',
            volume: 80,
            pan: 0,
            muted: false,
            active: true,
          },
        ],
      },
      tipText:
        'The Zone Edit grid shows all zones as columns and parameters as rows.',
    },
    {
      id: 'step-7',
      title: 'Browse Zone Parameter Tabs',
      instruction:
        'Turn E1 to browse through the Zone Edit tabs. Navigate to the LEVEL/PAN tab to see volume and pan settings for each zone.',
      highlightControls: ['function-e1'],
      panelStateChanges: {},
      displayState: {
        screenType: 'zone-edit',
        activeTab: 'LEVEL/PAN',
        zoneEditCategory: 'INT',
        selectedIndex: 0,
        zones: [
          {
            zoneNumber: 1,
            zoneName: 'Zone 1',
            toneName: 'Concert Grand',
            keyRangeLow: 'A0',
            keyRangeHigh: 'C8',
            volume: 100,
            pan: 0,
            muted: false,
            active: true,
          },
          {
            zoneNumber: 2,
            zoneName: 'Zone 2',
            toneName: 'Strings Sect 1',
            keyRangeLow: 'A0',
            keyRangeHigh: 'C8',
            volume: 80,
            pan: 0,
            muted: false,
            active: true,
          },
        ],
      },
    },
    {
      id: 'step-8',
      title: 'View Key Range Settings',
      instruction:
        'Turn E1 to the KEY RANGE tab. This shows the keyboard range assigned to each zone — useful for creating split or layered setups.',
      highlightControls: ['function-e1'],
      panelStateChanges: {},
      displayState: {
        screenType: 'zone-edit',
        activeTab: 'KEY RANGE',
        zoneEditCategory: 'INT',
        selectedIndex: 1,
        zones: [
          {
            zoneNumber: 1,
            zoneName: 'Zone 1',
            toneName: 'Concert Grand',
            keyRangeLow: 'A0',
            keyRangeHigh: 'C8',
            volume: 100,
            pan: 0,
            muted: false,
            active: true,
          },
          {
            zoneNumber: 2,
            zoneName: 'Zone 2',
            toneName: 'Strings Sect 1',
            keyRangeLow: 'A0',
            keyRangeHigh: 'C8',
            volume: 80,
            pan: 0,
            muted: false,
            active: true,
          },
        ],
      },
      tipText:
        'Zone Edit gives you access to settings that Zone View cannot change, like EQ, vibrato, pitch, and scale tuning.',
    },
    {
      id: 'step-9',
      title: 'Edit a Zone Value',
      instruction:
        'Turn E1 back to the LEVEL/PAN tab, then use Cursor Down to select Zone 2. Turn E6 or the Value dial to lower the strings volume to 70 for better balance with the piano.',
      highlightControls: ['function-e1', 'cursor-down', 'function-e6'],
      panelStateChanges: {},
      displayState: {
        screenType: 'zone-edit',
        activeTab: 'LEVEL/PAN',
        zoneEditCategory: 'INT',
        selectedIndex: 2,
        zones: [
          {
            zoneNumber: 1,
            zoneName: 'Zone 1',
            toneName: 'Concert Grand',
            keyRangeLow: 'A0',
            keyRangeHigh: 'C8',
            volume: 100,
            pan: 0,
            muted: false,
            active: true,
          },
          {
            zoneNumber: 2,
            zoneName: 'Zone 2',
            toneName: 'Strings Sect 1',
            keyRangeLow: 'A0',
            keyRangeHigh: 'C8',
            volume: 70,
            pan: 0,
            muted: false,
            active: true,
          },
        ],
      },
    },
    {
      id: 'step-10',
      title: 'Scene Editing Complete!',
      instruction:
        "Press Exit to return to the main screen. You've learned how to use both Scene Edit and Zone Edit to control your overall setup and individual zone parameters.",
      details:
        'Remember to save your scene with Write to keep any changes. Scene Edit controls global parameters, while Zone Edit gives you detailed per-zone control over tone, level, key range, EQ, and more.',
      highlightControls: ['exit'],
      panelStateChanges: {
        menu: { active: false },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'Grand & Strings',
        tempo: 120,
        beatSignature: '4/4',
      },
      tipText:
        'Zone Edit also has EXT tabs for controlling external MIDI devices connected to the Fantom.',
    },
  ],
};
