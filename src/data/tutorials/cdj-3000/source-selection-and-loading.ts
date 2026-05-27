import { Tutorial } from '@/types/tutorial';

export const sourceSelectionAndLoading: Tutorial = {
  id: 'source-selection-and-loading',
  deviceId: 'cdj-3000',
  title: 'Source Selection & Loading Tracks',
  description:
    'Use the SOURCE button, rotary selector, and touch display to pick a device, browse its library, and load a track to the deck.',
  category: 'browsing',
  difficulty: 'beginner',
  estimatedTime: '5 min',
  tags: ['source', 'browse', 'load', 'rotary-selector', 'load-lock', 'beginner'],
  steps: [
    {
      id: 'step-1',
      title: 'Open the SOURCE Screen',
      instruction:
        'With media connected (SD, USB, or a PC/Mac on PRO DJ LINK), press the SOURCE button to open the source-selection screen.',
      details:
        'The SOURCE screen lists every device the unit can see — local SD/USB slots, linked players, and connected computers — each with a device icon and player number.',
      highlightControls: ['SOURCE'],
      panelStateChanges: {
        SOURCE: { active: true },
      },
    },
    {
      id: 'step-2',
      title: 'Select a Source Device',
      instruction:
        'Turn the rotary selector to highlight the device you want to play from, then press the rotary selector to select it. You can also touch the device row directly on the screen.',
      details:
        'The right side of the SOURCE screen shows the highlighted device\'s song count, playlist count, export date, total/available storage, and the optional background color. MY SETTINGS LOAD on this screen restores UTILITY settings previously saved to the device.',
      highlightControls: ['ROTARY_SELECTOR', 'TOUCH_DISPLAY'],
      panelStateChanges: {
        SOURCE: { active: false },
        ROTARY_SELECTOR: { active: true },
      },
      tipText:
        'BACKGROUND COLOR on the SOURCE screen tags a device with a recognizable color — useful when juggling multiple USB sticks between decks.',
    },
    {
      id: 'step-3',
      title: 'Open the Browse Screen',
      instruction:
        'Press the BROWSE button to view the device\'s rekordbox library. You can also press TAG LIST, PLAYLIST, or SEARCH to jump into those views directly.',
      details:
        'On a rekordbox-prepared device the library appears as categories (TRACK, ARTIST, ALBUM, BPM, KEY, HISTORY, etc.) on the left and a track list on the right. On a plain device, you get a folder-tree view of the file system instead.',
      highlightControls: ['BROWSE_BTN', 'TAG_LIST', 'PLAYLIST', 'SEARCH_BTN'],
      panelStateChanges: {
        ROTARY_SELECTOR: { active: false },
        BROWSE_BTN: { active: true },
      },
    },
    {
      id: 'step-4',
      title: 'Navigate with the Rotary Selector',
      instruction:
        'Turn the rotary selector to move the highlight up and down. Press the rotary selector to drill into a category or open a folder. Press the BACK button to return to the previous level.',
      details:
        'If you press the rotary selector when a hierarchical level (like a category or playlist) is highlighted, you go down a level. If you press it on a track, the track loads and the Waveform screen appears. Press and hold BACK to jump back to the top level.',
      highlightControls: ['ROTARY_SELECTOR', 'BACK'],
      panelStateChanges: {
        BROWSE_BTN: { active: false },
        ROTARY_SELECTOR: { active: true },
      },
    },
    {
      id: 'step-5',
      title: 'Touch Operations',
      instruction:
        'Alternatively, touch an item on the screen to highlight it, then touch it again to confirm. Touching a track shows a LOAD button on screen — touch LOAD to load it to this deck.',
      details:
        'Touch the title row of a column to sort the list by that field. Touch the arrow next to a column header to choose which sub-columns are displayed. PREVIEW and INFO toggles let you preview tracks on headphones and inspect detailed track info.',
      highlightControls: ['TOUCH_DISPLAY'],
      panelStateChanges: {},
    },
    {
      id: 'step-6',
      title: 'Loading a Track',
      instruction:
        'Highlight the track you want and press the rotary selector — or touch LOAD on the screen. The track loads, the Waveform screen appears, and the deck is ready to play.',
      details:
        'If a deck is already playing, by default the new track replaces it. You can guard against that by enabling LOAD LOCK (next step) which prevents loading over a playing track until you press PLAY/PAUSE first.',
      highlightControls: ['ROTARY_SELECTOR'],
      panelStateChanges: {
        ROTARY_SELECTOR: { active: false },
      },
      tipText:
        'On a rekordbox-prepared device, loading a track also pulls in its saved cues, loops, and beatgrid — so you start with everything you prepared.',
    },
    {
      id: 'step-7',
      title: 'LOAD LOCK Setting',
      instruction:
        'To prevent accidentally loading over a playing track, press and hold the MENU/UTILITY button to open UTILITY, navigate to DJ SETTING → LOAD LOCK, and set it to LOCK. Set it back to UNLOCK to load freely.',
      details:
        'With LOAD LOCK set to LOCK, attempting to load a new track while one is playing is ignored. You must either set LOAD LOCK to UNLOCK or press PLAY/PAUSE to pause the deck before the load is accepted. Factory setting is UNLOCK.',
      highlightControls: ['MENU_UTILITY', 'PLAY_PAUSE'],
      panelStateChanges: {
        MENU_UTILITY: { active: true },
      },
    },
    {
      id: 'step-8',
      title: 'You\'re Browsing',
      instruction:
        'You can now select a source, browse a rekordbox library, and load tracks. Next, learn the transport and waveform — start with Basic Playback & Transport.',
      details:
        'The browse experience deepens with the Advanced Browsing tutorial, which covers the on-screen QWERTY search, Alphabet Jump, track filters, Touch Preview, and History.',
      highlightControls: [],
      panelStateChanges: {
        MENU_UTILITY: { active: false },
      },
    },
  ],
};
