import { Tutorial } from '@/types/tutorial';

export const programManagement: Tutorial = {
  id: 'program-management',
  deviceId: 'deepmind-12',
  title: 'Categories, Default Program & Backup',
  description:
    'Organize your programs with categories, manage your Favorites list, load the Default Program as a clean starting point, and clear the Favorites list when needed.',
  category: 'presets',
  difficulty: 'intermediate',
  estimatedTime: '10 min',
  tags: ['categories', 'favorites', 'default program', 'backup', 'organization', 'intermediate'],
  steps: [
    {
      id: 'step-1',
      title: 'Understanding Program Categories',
      instruction:
        'Every DeepMind 12 program belongs to one of 14 categories: NONE, BASS, PAD, LEAD, MONO, POLY, STAB, SFX, ARP, SEQ, PERC, AMBIENT, MODULAR, or USER-1 through USER-4. The category is shown in the top-left corner of the PROG display below the bank and program number.',
      details:
        'Categories are stored as part of the program data. NONE means no category information is stored. The USER-1 through USER-4 categories are free-form slots for user or project-specific classification. A program\'s category is assigned or changed during the WRITE PROGRAM procedure (see the Writing Programs tutorial). Categories are searchable via the hold-PROG browsing shortcuts.',
      highlightControls: ['display', 'prog-menu-prog'],
      panelStateChanges: {
        'prog-menu-prog': { active: true, ledOn: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'AMBIENT  A-24  Up In Clouds RD',
        selectedIndex: 24,
      },
    },
    {
      id: 'step-2',
      title: 'Browsing Within a Category',
      instruction:
        'Hold the PROG switch and press -/NO or +/YES to step backwards or forwards through programs that share the same category as the currently loaded program. This lets you audition all pads, or all bass sounds, without leaving the category.',
      details:
        'The hold-PROG + -/NO or +/YES shortcut is the fastest way to audition sounds of a specific type. When you reach the first or last program in a category, pressing -/NO or +/YES wraps around within the category — it will not jump to a different category. The category name remains visible in the top-left of the PROG display throughout.',
      highlightControls: ['prog-menu-prog', 'prog-nav-no', 'prog-nav-yes'],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        statusText: 'AMBIENT  A-38  Tundra RD',
        selectedIndex: 38,
      },
    },
    {
      id: 'step-3',
      title: 'Jumping Between Categories',
      instruction:
        'Hold the PROG switch and press BANK/UP to jump to the next category, or BANK/DOWN to jump to the previous category. Once in a new category, you can use hold-PROG + -/NO or +/YES to step through programs within it.',
      details:
        'Category navigation cycles through all 14 categories in order: NONE, BASS, PAD, LEAD, MONO, POLY, STAB, SFX, ARP, SEQ, PERC, AMBIENT, MODULAR, USER-1/4. When you jump to a new category, the first program in that category is loaded. The PROG HELD help menu on the display shows "L/R: PREV/NEXT IN CATEGORY" and "UP/DOWN: PREV/NEXT CATEGORY" as reminders.',
      highlightControls: ['prog-menu-prog', 'prog-bank-up', 'prog-bank-down'],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        statusText: 'PAD  A-36  Brass Pad BC',
        selectedIndex: 36,
      },
    },
    {
      id: 'step-4',
      title: 'Saving a Program as a Favorite',
      instruction:
        'To add the current program to your Favorites list, press and hold PROG and FX at the same time, then press +/YES. A happy face icon appears in the top-right corner of the status bar, confirming the program is now in your Favorites list.',
      details:
        'The Favorites list is a fast-access collection of your most-used programs. Once a program is a Favorite, the happy face icon appears in the status bar whenever that program is loaded. Adding to Favorites does not copy or move the program — it simply marks it for quick retrieval. You can have multiple favorites across different banks.',
      highlightControls: ['prog-menu-prog', 'prog-menu-fx', 'prog-nav-yes'],
      panelStateChanges: {
        'prog-menu-fx': { active: true, ledOn: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'C-90  Cluster Pad RD  :)',
        selectedIndex: 90,
      },
    },
    {
      id: 'step-5',
      title: 'Recalling Favorites',
      instruction:
        'To open the Favorites Browser, press and hold PROG and FX at the same time, then turn the rotary encoder. A list of all your saved favorites appears. Turn the encoder to scroll — the highlighted program loads automatically when you stop.',
      details:
        'The Favorites Browser shows program names with their bank and number in a scrollable list. It works the same as the standard Program Browser but shows only your favorites. Press PROG (shown as [PROG] >EXIT at the bottom of the display) to exit the Favorites Browser without changing the current program.',
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
          { label: 'F-84  Old Film RD' },
        ],
        selectedIndex: 0,
        statusText: '[PROG] >EXIT',
      },
    },
    {
      id: 'step-6',
      title: 'Removing a Favorite',
      instruction:
        'To remove a program from the Favorites list, load that program (so the happy face icon is visible), then press and hold PROG and FX at the same time, and press -/NO. The happy face icon disappears, confirming the program has been removed from Favorites.',
      details:
        'Removing a Favorite only removes it from the Favorites list — the program itself is not deleted from the bank. The happy face icon will no longer appear when that program is loaded. You can re-add it at any time by repeating the save-as-Favorite procedure.',
      highlightControls: ['prog-menu-prog', 'prog-menu-fx', 'prog-nav-no'],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        statusText: 'C-90  Cluster Pad RD',
        selectedIndex: 90,
      },
    },
    {
      id: 'step-7',
      title: 'Clearing the Entire Favorites List',
      instruction:
        'To remove all favorites at once, press and hold PROG and FX at the same time, then press WRITE. A warning screen appears: "RESET FAVORITES LIST? NOT REVERSIBLE!" Press +/YES to confirm, or -/NO to cancel. No programs are deleted — only the list is cleared.',
      details:
        'This bulk-clear operation is not reversible — there is no way to restore the favorites list after clearing. The confirmation screen explicitly warns "NOT REVERSIBLE!" Use this when you want to start your favorites collection fresh, such as when preparing for a new project or performance set. The programs themselves remain safely in their banks.',
      highlightControls: ['prog-menu-prog', 'prog-menu-fx', 'prog-menu-write', 'prog-nav-yes', 'prog-nav-no'],
      panelStateChanges: {
        'prog-menu-fx': { active: true, ledOn: true },
        'prog-menu-write': { active: true, ledOn: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'RESET',
        menuItems: [
          { label: 'RESET FAVORITES LIST?' },
          { label: '  NOT REVERSIBLE!' },
          { label: '' },
          { label: '  -/NO      +/YES' },
        ],
        selectedIndex: 0,
        statusText: 'Confirm with +/YES or cancel with -/NO',
      },
    },
    {
      id: 'step-8',
      title: 'Loading the Default Program',
      instruction:
        'The Default Program is a blank starting point with no modulation or effects — perfect for sound design from scratch. To load it: press and hold PROG, then press COMPARE. The display shows "*Default Program" and the program name changes to confirm it loaded.',
      details:
        'The Default Program is configured without modulation or effects and uses basic settings in each section. It is documented in Appendix 4 of the manual with the exact parameter values for each section. The asterisk (*) appears before "Default Program" on the display, indicating it is a loaded state that has not been written to a bank location. Use WRITE to save it as a starting template to any program slot.',
      highlightControls: ['prog-menu-prog', 'prog-menu-compare'],
      panelStateChanges: {
        'prog-menu-fx': { active: false, ledOn: false },
        'prog-menu-write': { active: false, ledOn: false },
        'prog-menu-compare': { active: true, ledOn: true },
        'prog-menu-prog': { active: true, ledOn: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'A-31  *Default Program',
        selectedIndex: 31,
      },
      tipText: 'Tip: The PROG HELD help menu shows "COMPARE: DEFAULT PROGRAM" as a quick reminder — hold PROG and read the display to see all available shortcuts at any time.',
    },
  ],
};
