import { Tutorial } from '@/types/tutorial';

export const advancedBrowsing: Tutorial = {
  id: 'advanced-browsing',
  deviceId: 'cdj-3000',
  title: 'Advanced Browsing',
  description:
    'Find any track fast — search by keyword on the on-screen QWERTY, jump by letter or page with the rotary selector, narrow down with Track Filter, preview before loading, and recall tracks from History.',
  category: 'browsing',
  difficulty: 'intermediate',
  estimatedTime: '7 min',
  tags: [
    'browse',
    'search',
    'qwerty',
    'alphabet-jump',
    'page-jump',
    'track-filter',
    'touch-preview',
    'history',
    'intermediate',
  ],
  steps: [
    {
      id: 'step-1',
      title: 'Open the SEARCH Screen',
      instruction:
        'While browsing a rekordbox library, press the SEARCH button. The SEARCH screen appears with an on-screen QWERTY keyboard and a live result list above it.',
      details:
        'SEARCH is only available on rekordbox-prepared SD/USB devices, linked players, or PCs running rekordbox. On a plain folder-tree device the SEARCH button has no effect.',
      highlightControls: ['SEARCH_BTN'],
      panelStateChanges: {
        SEARCH_BTN: { active: true },
      },
    },
    {
      id: 'step-2',
      title: 'Type a Keyword',
      instruction:
        'Tap letters on the on-screen keyboard to type a keyword — the track list filters live as you type. Separate multiple keywords with a space to combine them (e.g., "kerri vocal" matches tracks with both words).',
      details:
        'Touch the 123 key to switch to numbers and symbols, CLEAR to wipe the field, and the × key to delete one character. The result list still supports the rotary selector and touch — pick a track and press the rotary selector to load it.',
      highlightControls: ['TOUCH_DISPLAY', 'ROTARY_SELECTOR'],
      panelStateChanges: {
        SEARCH_BTN: { active: false },
        ROTARY_SELECTOR: { active: true },
      },
    },
    {
      id: 'step-3',
      title: 'Alphabet Jump',
      instruction:
        'Back on a normal browse list, when an alphabetical-order list is showing, press and hold the rotary selector. Alphabet Jump mode turns on and a large letter appears on the screen. Turn the rotary selector to scroll through A–Z, 0–9, and a few symbols — the cursor jumps to the next entry whose first character matches.',
      details:
        'Alphabet Jump only fires when the visible list is alphabetically sorted. If no entry starts with the displayed character the cursor stays put. Release the rotary selector or press BACK to exit Alphabet Jump.',
      highlightControls: ['ROTARY_SELECTOR'],
      panelStateChanges: {},
      tipText:
        'Hold the rotary selector to drop straight into "T", spin to land on the artist or track that begins with that letter, release, and you are there.',
    },
    {
      id: 'step-4',
      title: 'Page Jump',
      instruction:
        'When the visible list is sorted by something other than the alphabet (for example a playlist or a BPM-sorted list), press and hold the rotary selector. Page Jump mode turns on instead. Turn the rotary selector to skip the cursor to the first track on each page.',
      details:
        'Page Jump and Alphabet Jump use the exact same gesture (press-and-hold the rotary). The unit picks one or the other automatically based on the current list type, so you do not need to remember a separate shortcut.',
      highlightControls: ['ROTARY_SELECTOR'],
      panelStateChanges: {},
    },
    {
      id: 'step-5',
      title: 'Narrow Down with Track Filter',
      instruction:
        'Browsing a rekordbox library, press the TRACK FILTER / EDIT button to apply the currently set Track Filter — the list narrows down by BPM, key, rating, color, and the My Tag information set in rekordbox.',
      details:
        'Track Filter is unavailable on the TAG LIST screen, the SEARCH screen, the MATCHING category, the HOT CUE BANK category, and the FOLDER category. Filter conditions are remembered per storage device (SD, USB).',
      highlightControls: ['TRACK_FILTER_EDIT'],
      panelStateChanges: {
        ROTARY_SELECTOR: { active: false },
        TRACK_FILTER_EDIT: { active: true },
      },
    },
    {
      id: 'step-6',
      title: 'Edit Track Filter Conditions',
      instruction:
        'Press and hold the TRACK FILTER / EDIT button. The Track Filter editing screen opens with two tabs at the top right — BPM/KEY and MY TAG. Use the BPM/KEY tab to set a target BPM (±10 / ±1 / ±1 / ±10), a BPM RANGE (0–6%), a related KEY, plus RATING and COLOR filters. Use the MY TAG tab to set And/Or matching on the My Tags imported from rekordbox.',
      details:
        'Touch MASTER PLAYER on the editing screen to pull the BPM and key of the currently playing master player into the filter. Touch and hold RESET to clear the conditions back to defaults.',
      highlightControls: ['TRACK_FILTER_EDIT', 'TOUCH_DISPLAY'],
      panelStateChanges: {
        TRACK_FILTER_EDIT: { active: false },
      },
      tipText:
        'Hit MASTER PLAYER, then TRACK FILTER again, and you are instantly viewing only tracks in the same BPM and key family as the deck currently dropping.',
    },
    {
      id: 'step-7',
      title: 'Touch Preview Before Loading',
      instruction:
        'Connect a Touch Preview–compatible DJ mixer to PRO DJ LINK, plug headphones into the mixer, and press LINK CUE on the mixer. On the CDJ browse screen, touch PREVIEW to reveal a small waveform beside each track, then touch the waveform to monitor that point in your headphones — without loading the track.',
      details:
        'Touch Preview works even while the deck is outputting another track on the master, so you can audition the next selection without disturbing the current playback. Releasing the touch stops the preview.',
      highlightControls: ['TOUCH_DISPLAY'],
      panelStateChanges: {},
    },
    {
      id: 'step-8',
      title: 'Recently Played & History',
      instruction:
        'Tracks played for about a minute are written to History on the source device. To recall recent plays fast, press MENU/UTILITY while on the Waveform screen — the recently-played list appears. Or open the BROWSE screen, scroll to the HISTORY category, and press the rotary selector to view the full History.',
      details:
        'Rename History under UTILITY → SYSTEM → HISTORY NAME (up to 32 characters). To delete entries, open the History list, press MENU/UTILITY, and choose DELETE or ALL DELETE. Tracks already in History are coloured green in the PLAYLIST category — press MENU/UTILITY on a green track to toggle it back to un-played.',
      highlightControls: ['MENU_UTILITY', 'BROWSE_BTN'],
      panelStateChanges: {
        MENU_UTILITY: { active: true },
      },
    },
    {
      id: 'step-9',
      title: 'You Can Find Anything',
      instruction:
        'You now have five ways to land on the right track: full-text SEARCH, Alphabet Jump, Page Jump, Track Filter, and History. Next, the Tag List & Track Organization tutorial covers the on-the-fly TAG LIST workflow that complements all of these.',
      details:
        'In a busy set, the fastest path is usually: hold the rotary selector for Alphabet Jump → spin to the right letter → release → arrow down. Save the QWERTY SEARCH for cases where the artist or title is genuinely fuzzy in your memory.',
      highlightControls: [],
      panelStateChanges: {
        MENU_UTILITY: { active: false },
      },
    },
  ],
};
