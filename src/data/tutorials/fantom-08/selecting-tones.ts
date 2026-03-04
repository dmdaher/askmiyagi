import { Tutorial } from '@/types/tutorial';

export const selectingTones: Tutorial = {
  id: 'selecting-tones',
  deviceId: 'fantom-08',
  title: 'Selecting and Browsing Tones',
  description:
    'Learn how to browse the Fantom 08\'s tone library using the 16 category buttons. Find and assign sounds to any zone.',
  category: 'basics',
  difficulty: 'beginner',
  estimatedTime: '4 min',
  tags: ['tones', 'sounds', 'categories', 'browsing', 'beginner'],
  steps: [
    {
      id: 'step-1',
      title: 'What Are Tones?',
      instruction:
        'Tones are the individual sounds on the Fantom 08 — pianos, strings, synths, drums, and more. Each zone in a scene is assigned one tone.',
      details:
        'The Fantom 08 has thousands of tones organized into 16 categories. You can browse by category or scroll through the full list.',
      highlightControls: [],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'INIT SCENE',
        tempo: 120,
        beatSignature: '4/4',
      },
    },
    {
      id: 'step-2',
      title: 'Select a Zone',
      instruction:
        'Press Zone 1 to select the zone you want to change the tone for. The zone LED lights up to show it\'s selected.',
      highlightControls: ['zone-1'],
      panelStateChanges: {
        'zone-1': { active: true, ledOn: true, ledColor: '#3B82F6' },
      },
      displayState: {
        screenType: 'zone-view',
        title: 'ZONE VIEW',
        sceneNumber: 'A001',
        sceneName: 'INIT SCENE',
        tempo: 120,
        beatSignature: '4/4',
        zoneViewMode: 1,
        zones: [
          {
            zoneNumber: 1,
            zoneName: 'Zone 1',
            toneName: 'INIT TONE',
            toneType: 'Z-Core',
            toneBank: 'PR-A',
            toneCategory: 'Init',
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
      tipText:
        'Always select a zone first — the tone you choose will be assigned to the active zone.',
    },
    {
      id: 'step-3',
      title: 'Choose a Tone Category',
      instruction:
        'Press the A.Piano category button (first button in the tone category row) to browse acoustic piano sounds.',
      details:
        'The 16 category buttons are along the bottom of the panel: A.Piano, E.Piano, Organ, Keys, Guitar, Bass, Strings, Brass, Wind, Choir, Synth, Pad, FX, Drums, User, Assign.',
      highlightControls: ['tone-cat-1'],
      panelStateChanges: {
        'tone-cat-1': { active: true },
      },
      displayState: {
        screenType: 'tone-select',
        title: 'TONE LIST - Zone 1',
        tempo: 120,
        beatSignature: '4/4',
        menuItems: [
          { label: 'Concert Grand', selected: true },
          { label: 'Bright Piano' },
          { label: 'Stage Piano' },
          { label: 'Warm Grand' },
        ],
        selectedIndex: 0,
      },
    },
    {
      id: 'step-4',
      title: 'Scroll Through Tones',
      instruction:
        'Turn the Value dial to scroll through tones within the category. Each tone loads for immediate preview.',
      highlightControls: ['value-dial'],
      panelStateChanges: {},
      displayState: {
        screenType: 'tone-select',
        title: 'TONE LIST - Zone 1',
        tempo: 120,
        beatSignature: '4/4',
        menuItems: [
          { label: 'Concert Grand' },
          { label: 'Bright Piano' },
          { label: 'Stage Piano', selected: true },
          { label: 'Warm Grand' },
        ],
        selectedIndex: 2,
      },
      tipText:
        "Play the keyboard while browsing — you'll hear each tone as you scroll to it.",
    },
    {
      id: 'step-5',
      title: 'Try the Strings Category',
      instruction:
        'Press the Strings category button to switch to orchestral string sounds.',
      details:
        'You can jump between categories at any time. The Value dial position resets to the first tone in the new category.',
      highlightControls: ['tone-cat-7'],
      panelStateChanges: {
        'tone-cat-1': { active: false },
        'tone-cat-7': { active: true },
      },
      displayState: {
        screenType: 'tone-select',
        title: 'TONE LIST - Zone 1',
        tempo: 120,
        beatSignature: '4/4',
        menuItems: [
          { label: 'Strings Sect 1', selected: true },
          { label: 'Chamber Strings' },
          { label: 'Violin Solo' },
          { label: 'Cello Ensemble' },
        ],
        selectedIndex: 0,
      },
    },
    {
      id: 'step-6',
      title: 'Explore Synth Sounds',
      instruction:
        'Press the Synth category button to browse synthesizer sounds — leads, basses, and textures.',
      highlightControls: ['tone-cat-11'],
      panelStateChanges: {
        'tone-cat-7': { active: false },
        'tone-cat-11': { active: true },
      },
      displayState: {
        screenType: 'tone-select',
        title: 'TONE LIST - Zone 1',
        tempo: 120,
        beatSignature: '4/4',
        menuItems: [
          { label: 'Saw Lead 1', selected: true },
          { label: 'Square Lead' },
          { label: 'Analog Pad' },
          { label: 'Trance Key 1' },
        ],
        selectedIndex: 0,
      },
      tipText:
        'The Synth category includes both vintage analog-style and modern digital sounds.',
    },
    {
      id: 'step-7',
      title: 'Confirm Tone Selection',
      instruction:
        'When you find a tone you like, press Enter to confirm the selection. The tone is now assigned to Zone 1.',
      highlightControls: ['enter'],
      panelStateChanges: {
        'tone-cat-11': { active: false },
      },
      displayState: {
        screenType: 'zone-view',
        title: 'ZONE VIEW',
        sceneNumber: 'A001',
        sceneName: 'INIT SCENE',
        tempo: 120,
        beatSignature: '4/4',
        zoneViewMode: 1,
        zones: [
          {
            zoneNumber: 1,
            zoneName: 'Zone 1',
            toneName: 'Saw Lead 1',
            toneType: 'Z-Core',
            toneBank: 'PR-A',
            toneCategory: 'Synth',
            toneNumber: '0512',
            keyRangeLow: 'A0',
            keyRangeHigh: 'C8',
            volume: 100,
            pan: 0,
            muted: false,
            active: true,
          },
        ],
      },
    },
    {
      id: 'step-8',
      title: 'Tone Selection Complete!',
      instruction:
        "You've learned how to browse tones by category and assign them to zones. Remember to save your scene with the Write button to keep your changes.",
      details:
        "Try the 'Saving Your Work' tutorial next to learn how to save scenes, or 'Split Keyboard Zones' to assign different tones to different parts of the keyboard.",
      highlightControls: [],
      panelStateChanges: {
        'zone-1': { active: false, ledOn: false },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'INIT SCENE',
        tempo: 120,
        beatSignature: '4/4',
      },
      tipText:
        "Don't forget to Write (save) your scene — unsaved tone changes are lost when you switch scenes!",
    },
  ],
};
