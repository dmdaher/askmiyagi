import { Tutorial } from '@/types/tutorial';

export const displayNavigation: Tutorial = {
  id: 'display-navigation',
  deviceId: 'deepmind-12',
  title: 'Understanding the Display & Menus',
  description:
    'Learn to read the PROG display, navigate the menu system, and use the PROG HELD shortcuts to quickly access the program browser and other menus.',
  category: 'basics',
  difficulty: 'beginner',
  estimatedTime: '5 min',
  tags: ['display', 'navigation', 'menus', 'prog', 'beginner'],
  steps: [
    {
      id: 'step-1',
      title: 'The PROG Display Overview',
      instruction:
        'The PROG (Programming) page is the main display of the DeepMind 12 — it is always shown when you power on. Press the PROG switch now to make sure you are in the PROG menu.',
      details:
        'The PROG display shows 13 pieces of information at once: Program Bank (top-left letter), Program Number, Program Name, Program Category, SEQ/MIDI/BPM status line, the currently adjusted Parameter Control (fader graphic), MIDI value (0-255), Stored value, Parameter name with detailed value, Parameter visualization, and three envelope visualizations (VCA ENV, VCF ENV, MOD ENV).',
      highlightControls: ['display', 'prog-menu-prog'],
      panelStateChanges: {
        'prog-menu-prog': { active: true, ledOn: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'A-1  Up In Clouds RD',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-2',
      title: 'Reading the Status Bar',
      instruction:
        'Look at the second line of the display — the status bar. It shows the program category (top-left), the SEQ status, MIDI sync source, and the BPM value. When SEQ letters appear inverted (white on black), the Control Sequencer is active.',
      details:
        'The status bar has four elements: CATEGORY (e.g., AMBIENT, BASS, PAD), SEQ STATUS (inverted = Control Sequencer ON), MASTER BPM SOURCE (INT = internal, MIDI = synced to MIDI clock, USB = synced to USB), and BPM VALUE (e.g., 74.0). At the far right, a happy face icon marks a Favorite program.',
      highlightControls: ['display'],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        statusText: 'AMBIENT  SEQ INT  BPM: 74.0',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-3',
      title: 'Navigating Within a Bank',
      instruction:
        'Press -/NO to load the previous program or +/YES to load the next program in the current bank. Each bank contains 128 programs numbered 1-128.',
      details:
        'The -/NO and +/YES switches are your primary navigation tools within a bank. Each press loads the adjacent program immediately. The program name updates in real time as you step through the list.',
      highlightControls: ['prog-nav-no', 'prog-nav-yes'],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        statusText: 'A-2  HammondCrunchDG',
        selectedIndex: 2,
      },
    },
    {
      id: 'step-4',
      title: 'Using the Rotary Encoder',
      instruction:
        'Turn the rotary encoder to scroll through programs. When you stop turning, the highlighted program loads automatically. This is the fastest way to browse the full bank.',
      details:
        'The rotary encoder has a satisfying click that allows very precise single-step movement. Turning quickly scrolls through programs rapidly; turning slowly steps one at a time. When you reach program 128 in the current bank, the list wraps to program 1.',
      highlightControls: ['prog-rotary', 'display'],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        statusText: 'A-24  Up In Clouds RD',
        selectedIndex: 24,
      },
    },
    {
      id: 'step-5',
      title: 'Opening the Program Browser',
      instruction:
        'Press and hold the PROG switch, then rotate the encoder (or press GLOBAL). The Program Browser opens — a scrollable list view showing bank, number, and name for every program.',
      details:
        'While holding PROG, a "PROG HELD" help menu appears on the display showing all available shortcuts:\n- ROTARY/GLOBAL: Program Browser\n- FX: Favorites\n- L/R (-/NO and +/YES): Prev/Next in Category\n- UP/DOWN (BANK): Prev/Next Category\n- WRITE: Revert to Panel\n- COMPARE: Default Program\n\nReleasing PROG after selecting from the browser confirms the selection.',
      highlightControls: ['prog-menu-prog', 'prog-rotary', 'prog-menu-global'],
      panelStateChanges: {
        'prog-menu-prog': { active: true, ledOn: true },
      },
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
      id: 'step-6',
      title: 'Cycling Through Menu Pages',
      instruction:
        'The FX and GLOBAL menus each have multiple pages. Press the same switch again to cycle to the next page. The display shows what pressing the switch again will do at the bottom of the screen.',
      details:
        'For example, in the GLOBAL menu there are five pages: CONNECTIVITY, KEYBOARD SETTINGS, PEDAL SETTINGS, PANEL SETTINGS, and SYSTEM SETTINGS. Each time you press GLOBAL, you advance to the next page. The DeepMind 12 remembers the last page you visited within each menu (configurable via REMEMBER PAGES in PANEL SETTINGS).',
      highlightControls: ['prog-menu-global', 'prog-menu-fx'],
      panelStateChanges: {
        'prog-menu-prog': { active: false, ledOn: false },
        'prog-menu-global': { active: true, ledOn: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'GLOBAL',
        menuItems: [
          { label: 'CONNECTIVITY' },
          { label: 'KEYBOARD SETTINGS' },
          { label: 'PEDAL SETTINGS' },
          { label: 'PANEL SETTINGS' },
          { label: 'SYSTEM SETTINGS' },
        ],
        selectedIndex: 0,
        statusText: '[GLOB]>KEYBD SETTINGS',
      },
    },
    {
      id: 'step-7',
      title: 'Display Navigation Summary',
      instruction:
        'You now understand the DeepMind 12 display system. The PROG screen is your home base, -/NO and +/YES step through programs, the rotary encoder browses, and holding PROG unlocks the shortcut menu.',
      details:
        'Key takeaways: (1) The PROG display has 13 information elements — bank, number, name, category, BPM, parameter control, values, and envelope visualizations. (2) -/NO/-YES navigate within a bank; BANK UP/DOWN change banks. (3) Hold PROG to reveal the full shortcut map. (4) FX and GLOBAL menus have multiple pages — press again to cycle. (5) The asterisk (*) in a program name means the program has been edited but not yet saved.',
      highlightControls: ['display', 'prog-menu-prog'],
      panelStateChanges: {
        'prog-menu-global': { active: false, ledOn: false },
        'prog-menu-prog': { active: true, ledOn: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'A-1  Up In Clouds RD',
        selectedIndex: 1,
      },
      tipText: 'Tip: The asterisk (*) before a program name means you have unsaved edits. Press WRITE to save, or load a new program to discard them.',
    },
  ],
};
