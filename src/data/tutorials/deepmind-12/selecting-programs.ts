import { Tutorial } from '@/types/tutorial';

export const selectingPrograms: Tutorial = {
  id: 'selecting-programs',
  deviceId: 'deepmind-12',
  title: 'Browsing & Selecting Programs',
  description:
    'Explore all 1024 DeepMind 12 programs across 8 banks, filter by one of 17 categories, and build a Favorites list for quick recall during performance.',
  category: 'basics',
  difficulty: 'beginner',
  estimatedTime: '5 min',
  tags: ['programs', 'banks', 'browsing', 'categories', 'favorites', 'beginner'],
  steps: [
    {
      id: 'step-1',
      title: 'The Program Library',
      instruction:
        'The DeepMind 12 holds 1024 programs organized into 8 Banks (A through H), each containing 128 programs. The current program name appears in the top-right of the PROG display, with its bank letter and number in the top-left.',
      details:
        'All programs can be overwritten. The display shows the bank (A-H), the program number (1-128), the program name (up to 16 characters), and the category below the name. When a program name begins with an asterisk (*), it means you have made unsaved edits to the current program.',
      highlightControls: ['display', 'prog-menu-prog'],
      panelStateChanges: {
        'prog-menu-prog': { active: true, ledOn: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'A-24  Up In Clouds RD',
        selectedIndex: 24,
      },
    },
    {
      id: 'step-2',
      title: 'Stepping Through Programs',
      instruction:
        'Press +/YES to load the next program in the bank, or -/NO to go to the previous program. Press BANK/UP to advance to the next bank (A → B → ... → H). Press BANK/DOWN to go back.',
      details:
        'The -/NO and +/YES switches step one program at a time within the current bank. When you reach program 128 and press +/YES, you wrap back to program 1 in the same bank. BANK/UP and BANK/DOWN cycle through all 8 banks (A-H), loading program 1 of the new bank.',
      highlightControls: ['prog-nav-no', 'prog-nav-yes', 'prog-bank-up', 'prog-bank-down'],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        statusText: 'B-1  Nightdrive BC',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-3',
      title: 'Using the Program Browser',
      instruction:
        'Press and hold PROG, then turn the rotary encoder (or press GLOBAL) to open the Program Browser. A scrollable list appears showing bank, number, and name for every program. Scroll with the encoder and release PROG to load the highlighted program.',
      details:
        'The Program Browser shows programs in a list: "A33 Helix Repeat RB", "A34 HammondCrunchDG", etc. When you stop scrolling, the highlighted program loads automatically. Press PROG (labeled [PROG] >EXIT at the bottom of the screen) to return to the main PROG display without changing the selection.',
      highlightControls: ['prog-menu-prog', 'prog-rotary'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'PROGRAM BROWSE',
        menuItems: [
          { label: 'A33  Helix Repeat RB' },
          { label: 'A34  HammondCrunchDG' },
          { label: 'A35  Nightdrive BC' },
          { label: 'A36  Brass Pad BC' },
          { label: 'A37  Influx Pad KA' },
          { label: 'A38  Tundra RD' },
        ],
        selectedIndex: 2,
        statusText: '[PROG] >EXIT',
      },
    },
    {
      id: 'step-4',
      title: 'Browsing by Category',
      instruction:
        'Hold PROG and press -/NO or +/YES to step through programs in the same category as the current program. Hold PROG and press BANK/UP or BANK/DOWN to jump to the previous or next category.',
      details:
        'There are 17 categories: NONE, BASS, PAD, LEAD, MONO, POLY, STAB, SFX, ARP, SEQ, PERC, AMBIENT, MODULAR, USER-1, USER-2, USER-3, USER-4. The category is shown in the top-left of the PROG display below the bank/number. Browsing by category is the fastest way to find sounds of a specific type.',
      highlightControls: ['prog-menu-prog', 'prog-nav-no', 'prog-nav-yes', 'prog-bank-up', 'prog-bank-down'],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        statusText: 'PAD  — A-36  Brass Pad BC',
        selectedIndex: 36,
      },
    },
    {
      id: 'step-5',
      title: 'Saving a Favorite',
      instruction:
        'To save the current program as a Favorite, press and hold PROG and FX at the same time, then press +/YES. A happy face icon appears in the top-right of the status bar, confirming the program is now in your Favorites list.',
      details:
        'The Favorites list lets you quickly recall your most-used programs without scrolling through all 1024 programs. Once saved, the happy face icon appears whenever this program is loaded. To remove a program from Favorites: hold PROG + FX together, then press -/NO.',
      highlightControls: ['prog-menu-prog', 'prog-menu-fx', 'prog-nav-yes'],
      panelStateChanges: {
        'prog-menu-fx': { active: true, ledOn: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'C-90  Cluster Pad RD',
        selectedIndex: 90,
      },
    },
    {
      id: 'step-6',
      title: 'Recalling a Favorite',
      instruction:
        'To browse your Favorites list, press and hold PROG + FX at the same time, then turn the rotary encoder. The Favorites Browser appears with all your saved programs listed for quick recall.',
      details:
        'The Favorites Browser shows program names with their bank and number. Turn the encoder to scroll through your list. When you stop, the highlighted program loads automatically. The happy face icon remains visible in the status bar for all programs in your Favorites list.',
      highlightControls: ['prog-menu-prog', 'prog-menu-fx', 'prog-rotary'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'Favorites',
        menuItems: [
          { label: 'C-90  Cluster Pad RD' },
          { label: 'C-92  Spin Space RD' },
          { label: 'F-66  Piano Amber RD' },
          { label: 'F-71  Deep Drone RD' },
          { label: 'F-76  Chord Heaven RD' },
          { label: 'F-80  ShootingStar RD' },
        ],
        selectedIndex: 0,
        statusText: '[PROG] >EXIT',
      },
    },
    {
      id: 'step-7',
      title: 'Program Selection Summary',
      instruction:
        'You can now navigate all 1024 programs with confidence. Use -/NO and +/YES for step-through, the rotary encoder for fast browsing, hold PROG to access category filtering and the Program Browser, and build a Favorites list for instant recall.',
      details:
        'Quick reference: -/NO = prev program, +/YES = next program, BANK UP/DOWN = change bank, Hold PROG + ROTARY/GLOBAL = Program Browser, Hold PROG + -/YES (+/NO) = prev/next in same category, Hold PROG + BANK UP/DOWN = prev/next category, Hold PROG + FX + +/YES = save Favorite, Hold PROG + FX + ROTARY = Favorites browser.',
      highlightControls: ['prog-menu-prog', 'prog-rotary', 'prog-bank-up', 'prog-bank-down'],
      panelStateChanges: {
        'prog-menu-fx': { active: false, ledOn: false },
        'prog-menu-prog': { active: true, ledOn: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'A-24  Up In Clouds RD',
        selectedIndex: 24,
      },
      tipText: 'Tip: The DeepMind 12 comes pre-loaded with 1024 programs from professional synthesizer programmers around the world — explore all 8 banks to discover the full range of sounds.',
    },
  ],
};
