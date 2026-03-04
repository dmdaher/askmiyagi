import { Tutorial } from '@/types/tutorial';

export const sceneSearchNavigation: Tutorial = {
  id: 'scene-search-navigation',
  deviceId: 'fantom-08',
  title: 'Scene & Tone Search, Ratings, and Single Tone Play',
  description:
    'Master the Fantom 08 search features to quickly find scenes and tones by text or rating. Learn to rate your favorites, customize scene appearance, and use Single Tone Play for focused sound auditioning.',
  category: 'basics',
  difficulty: 'beginner',
  estimatedTime: '7 min',
  tags: ['scene', 'tone', 'search', 'rating', 'single-tone', 'beginner'],
  steps: [
    {
      id: 'step-1',
      title: 'Finding Sounds Fast',
      instruction:
        'The Fantom has hundreds of scenes and thousands of tones. Search features — by text string and by rating — help you find sounds fast without scrolling through long lists.',
      details:
        'In this tutorial you will learn to search scenes and tones by text, assign ratings to your favorites, customize scene appearance, and use Single Tone Play to audition individual sounds.',
      highlightControls: [],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'Homecoming',
        tempo: 120,
        beatSignature: '4/4',
      },
    },
    {
      id: 'step-2',
      title: 'Open Scene Select',
      instruction:
        'Press SCENE SELECT to open the scene selection grid. You can see scenes A001 through A016 displayed as tiles with their names.',
      highlightControls: ['scene-select'],
      panelStateChanges: {
        'scene-select': { active: true },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'Homecoming',
        tempo: 120,
        beatSignature: '4/4',
        statusText: 'SCENE SELECT',
      },
    },
    {
      id: 'step-3',
      title: 'Search Scenes by Text',
      instruction:
        'Touch the search symbol (magnifying glass) on the SCENE SELECT screen. A keyboard appears — type your search text and press E6 OK. Only scenes containing the text are shown.',
      highlightControls: ['function-e6'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'SCENE SELECT (Search)',
        menuItems: [
          { label: 'A009: Natural Facts', selected: true },
          { label: 'A010: Sure It Is' },
          { label: 'A013: Tramonto a Osaka' },
          { label: 'B055: E.Gt vs JUNO106' },
        ],
        selectedIndex: 0,
        statusText: 'Search results',
      },
      tipText:
        'Touch the search symbol again to clear the search results and return to the full scene list.',
    },
    {
      id: 'step-4',
      title: 'Search Scenes by Rating',
      instruction:
        'Touch the rating symbol (star icon) on the SCENE SELECT screen. Only scenes that have a rating assigned are shown. This is the fastest way to find your favorites.',
      highlightControls: [],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'SCENE SELECT (Rated)',
        menuItems: [
          { label: 'A002: MKII Treasures ★★★', selected: true },
          { label: 'A001: Homecoming ★★' },
          { label: 'A003: Ultimate StrSect ★★' },
          { label: 'A004: Brass+Sax S1/S2 ★' },
        ],
        selectedIndex: 0,
        statusText: 'Rating Filter',
      },
    },
    {
      id: 'step-5',
      title: 'Add a Rating to a Scene',
      instruction:
        'On the SCENE SELECT screen, touch EDIT. Turn the E4 knob to assign a rating from 1 to 3 stars. Press WRITE to save the rating to the scene.',
      highlightControls: ['function-e4'],
      panelStateChanges: {},
      displayState: {
        screenType: 'popup',
        title: 'Scene Rating',
        parameterName: 'Scene Rating',
        parameterValue: '★★★',
        popupData: { popupType: 'value' },
      },
      tipText:
        'Ratings are saved per scene. You can assign up to 3 stars (★★★). Press EXIT if you decide not to save.',
    },
    {
      id: 'step-6',
      title: 'Scene Appearance Settings',
      instruction:
        'While in EDIT mode on the SCENE SELECT screen, you can also set a memo (E3), color (E5), and scene level (E6). These settings help you visually organize your scene library.',
      highlightControls: ['function-e3', 'function-e5', 'function-e6'],
      panelStateChanges: {
        'function-e4': { active: false },
      },
      displayState: {
        screenType: 'menu',
        title: 'SCENE APPEARANCE',
        menuItems: [
          { label: 'Memo: (empty)', selected: true },
          { label: 'Rating: ★★★' },
          { label: 'Color: Blue' },
          { label: 'Scene Level: 100' },
        ],
        selectedIndex: 0,
      },
    },
    {
      id: 'step-7',
      title: 'Search Tones by Text',
      instruction:
        'In any TONE LIST screen, touch the search symbol. A keyboard appears — type your search text and press E6 OK. Only tones from the selected category matching your text are shown.',
      highlightControls: ['function-e6'],
      panelStateChanges: {
        'scene-select': { active: false },
        'function-e3': { active: false },
        'function-e5': { active: false },
      },
      displayState: {
        screenType: 'tone-select',
        title: 'TONE LIST (Search)',
        menuItems: [
          { label: '0140: Pad-a-wan Step', selected: true },
          { label: '0389: Slide Chain Syn' },
          { label: '0197: PLS Pad 1' },
          { label: '0198: PLS Pad 2' },
        ],
        selectedIndex: 0,
        statusText: 'Search: "pad"',
      },
    },
    {
      id: 'step-8',
      title: 'Search Tones by Rating',
      instruction:
        'In the TONE LIST screen, touch the rating symbol. Only tones with a rating are shown. Use E4 to assign ratings (★ to ★★★) to your favorite tones — ratings auto-save when you exit.',
      highlightControls: ['function-e4'],
      panelStateChanges: {
        'function-e6': { active: false },
      },
      displayState: {
        screenType: 'tone-select',
        title: 'TONE LIST (Rated)',
        menuItems: [
          { label: '0126: Jewellery Box ★★★', selected: true },
          { label: '0413: Hz Sweep Dn ★★' },
          { label: '0417: Ring Mod Rz ★' },
          { label: '0420: Mud Driver ★' },
        ],
        selectedIndex: 0,
        statusText: 'Rating Filter',
      },
    },
    {
      id: 'step-9',
      title: 'Single Tone Play',
      instruction:
        'Press the SINGLE TONE button. The display switches to 1 ZONE VIEW and only Zone 1 sounds when you play the keyboard. This is ideal for auditioning individual tones without other zones interfering.',
      details:
        'In Single Tone Play mode, an acoustic piano tone is selected by default. You can change the tone and save the modified settings as a scene. Press SINGLE TONE again to exit and return to normal multi-zone playback.',
      highlightControls: ['single-tone'],
      panelStateChanges: {
        'function-e4': { active: false },
        'single-tone': { active: true },
      },
      displayState: {
        screenType: 'zone-view',
        title: 'ZONE VIEW',
        sceneNumber: 'A016',
        sceneName: 'SINGLE ZONE PLAY',
        tempo: 120,
        beatSignature: '4/4',
        zoneViewMode: 1,
        statusText: 'SINGLE ZONE PLAY',
        zones: [
          {
            zoneNumber: 1,
            zoneName: 'Zone 1',
            toneName: 'Classic Piano',
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
      tipText:
        'Scene A016 "Single Tone Play" is a factory preset designed for this mode. You can also select any other scene first.',
    },
    {
      id: 'step-10',
      title: 'Search & Navigation Complete!',
      instruction:
        'You now know how to quickly find any scene or tone using text search and ratings. Single Tone Play gives you a focused way to audition sounds. These tools save significant time when building new scenes.',
      highlightControls: [],
      panelStateChanges: {
        'single-tone': { active: false },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'Homecoming',
        tempo: 120,
        beatSignature: '4/4',
      },
    },
  ],
};
