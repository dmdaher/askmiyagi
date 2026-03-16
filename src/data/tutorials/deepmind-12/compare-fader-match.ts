import { Tutorial } from '@/types/tutorial';

export const compareFaderMatch: Tutorial = {
  id: 'compare-fader-match',
  deviceId: 'deepmind-12',
  title: 'Compare, Fader Matching & Revert to Panel',
  description:
    'Master the COMPARE function to instantly toggle between original and edited versions of a program, use the four-page fader map to match physical faders to stored values, and use "Revert to Panel" to snap all stored values to the current fader positions.',
  category: 'presets',
  difficulty: 'intermediate',
  estimatedTime: '10 min',
  tags: ['compare', 'fader matching', 'revert', 'panel', 'editing', 'intermediate'],
  steps: [
    {
      id: 'step-1',
      title: 'Two Uses of COMPARE',
      instruction:
        'The COMPARE switch has two distinct jobs. First: toggle between your edited program and the original stored version — press COMPARE to hear the original, press again to return to your edits. Second: open the four-page fader map to visually match physical faders to stored values.',
      details:
        'These two functions activate in different contexts. If you have edited the program (asterisk visible), pressing COMPARE immediately toggles between the edit and the original. If you have NOT edited the program (no asterisk), pressing COMPARE opens the fader matching pages directly. You can always navigate to the fader pages from within the COMPARE menu.',
      highlightControls: ['prog-menu-compare'],
      panelStateChanges: {
        'prog-menu-prog': { active: true, ledOn: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'A-36  *Brass Pad BC',
        selectedIndex: 36,
      },
    },
    {
      id: 'step-2',
      title: 'Toggle: Edited vs Original',
      instruction:
        'With the asterisk visible (program has unsaved edits), press COMPARE. The asterisk disappears and you hear the original stored version. Press COMPARE again to return to your edited version. Use this to quickly A/B your changes against the starting sound.',
      details:
        'This is the fastest A/B comparison tool on the DeepMind 12. The toggle is instant — no menus required. The display shows the program name without the asterisk when you are hearing the original, and with the asterisk when you are on your edited version. Any fader or knob move while listening to the original immediately returns you to editing mode and creates a new edit.',
      highlightControls: ['prog-menu-compare'],
      panelStateChanges: {
        'prog-menu-compare': { active: true, ledOn: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'A-36  Brass Pad BC',
        selectedIndex: 36,
      },
    },
    {
      id: 'step-3',
      title: 'Opening the Fader Map',
      instruction:
        'Press COMPARE (when the program has no unsaved edits, or navigate from within a COMPARE toggle) to open the four-page COMPARE menu. Page 1 appears by default if this is the first time using COMPARE since power-on, otherwise the last page you used is shown.',
      details:
        'The COMPARE menu has four pages of faders. Use -/NO or +/YES to navigate between pages, or simply move a fader and that page will appear automatically. Press [EDIT] (shown at the bottom of the display) to access additional envelope-matching options. Press COMPARE again at any time to exit back to the PROG menu.',
      highlightControls: ['prog-menu-compare', 'prog-nav-no', 'prog-nav-yes'],
      panelStateChanges: {
        'prog-menu-compare': { active: true, ledOn: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'COMPARE',
        menuItems: [
          { label: 'PORT ARP  ARP  LFO1 LFO1 LFO2 LFO2' },
          { label: 'DEL  RATE GATE RATE DEL  RATE DEL' },
        ],
        selectedIndex: 0,
        statusText: '[-/+]>L/R  [EDIT]>EXIT',
      },
    },
    {
      id: 'step-4',
      title: 'Reading the Fader Map',
      instruction:
        'Each fader column on screen represents one physical fader. Two numbers appear below each column: the top number is the current physical fader position, the bottom number is the stored program value. A black fader graphic means the positions match. A white fader with an arrow means the physical fader needs to move in the arrow\'s direction.',
      details:
        'The narrow white bar beside each white fader shows how far the fader needs to travel to reach the stored value. When a fader is black, it is matched — moving it will now directly change that parameter. When a fader is white, moving it has no audible effect until it "catches" the stored value, unless you use Revert to Panel (which sends all physical positions to the program at once).',
      highlightControls: ['prog-menu-compare'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'COMPARE',
        menuItems: [
          { label: 'PORT ARP  ARP  LFO1 LFO1 LFO2 LFO2' },
          { label: 'DEL  RATE GATE RATE DEL  RATE DEL' },
          { label: '80   100  66   0    0    0    0' },
          { label: '80   100  66   0    0    0    0' },
        ],
        selectedIndex: 0,
        statusText: '[-/+]>L/R  [EDIT]>EXIT',
      },
    },
    {
      id: 'step-5',
      title: 'The Four Fader Pages',
      instruction:
        'Press +/YES to advance through all four pages. Page 1 shows ARP/SEQ and LFO faders. Page 2 shows OSC faders (PITCH-MOD, PWM, TONE-MOD, PITCH, LVL). Page 3 shows UNISON, VCF, HPF and VCA faders. Page 4 shows the VCA ENVELOPE faders (ATT, DEC, SUS, REL).',
      details:
        'All 32 physical faders on the DeepMind 12 panel are covered across the four pages. Moving any fader while in the COMPARE menu jumps directly to that fader\'s page. Note: you can select which envelope (VCA, VCF, or MOD) to match on page 4 using the [EDIT] option at the bottom of the display.',
      highlightControls: ['prog-nav-yes', 'prog-nav-no'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'COMPARE',
        menuItems: [
          { label: 'OSC1 OSC1 OSC1 OSC2 OSC2 OSC2 OSC2 DIS' },
          { label: 'PMOD PWM  TMOD PMOD TMOD PIT  LVL  LVL' },
          { label: '0    0    0    0    0    0    0    0' },
          { label: '0    0    0    0    0    0    0    0' },
        ],
        selectedIndex: 1,
        statusText: '[-/+]>L/R  [EDIT]>EXIT',
      },
    },
    {
      id: 'step-6',
      title: 'Matching a Fader',
      instruction:
        'To match a fader, slowly move it in the direction the arrow indicates. When the physical position reaches the stored value, the fader graphic turns black. At that moment, the fader is "caught" — further movement will change the parameter value.',
      details:
        'Fader matching is essential for maintaining the sound character of a program when you load it. Until a fader is matched, that parameter is frozen at its stored value even if you move the physical fader. Only after matching does the physical fader gain control of the parameter. Match all faders before performing live if accurate physical control matters.',
      highlightControls: ['env-attack', 'env-decay', 'env-sustain', 'env-release'],
      panelStateChanges: {
        'env-attack': { active: true },
        'env-decay': { active: true },
        'env-sustain': { active: true },
        'env-release': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'COMPARE',
        menuItems: [
          { label: 'VCA  VCA  VCA  VCA' },
          { label: 'ATT  DEC  SUS  REL' },
          { label: '0    128  128  128' },
          { label: '0    128  128  128' },
        ],
        selectedIndex: 3,
        statusText: '[-/+]>L/R  [EDIT]>EXIT',
      },
    },
    {
      id: 'step-7',
      title: 'Revert to Panel — What It Does',
      instruction:
        'Instead of matching each fader individually, "Revert to Panel" sends ALL physical fader positions to the program at once. This is the fastest way to get the faders in sync — but be aware: the sound will often change dramatically as every parameter jumps to its physical position.',
      details:
        'Revert to Panel is documented in §4.7 of the manual. It is a shortcut that skips the gradual matching process entirely. Use it when you want to start editing from the current physical panel state — for example, after loading a preset you plan to deeply modify anyway. Avoid it during live performance unless you want a sudden sound transformation.',
      highlightControls: ['prog-menu-prog', 'prog-menu-write'],
      panelStateChanges: {
        'env-attack': { active: false },
        'env-decay': { active: false },
        'env-sustain': { active: false },
        'env-release': { active: false },
        'prog-menu-compare': { active: false, ledOn: false },
        'prog-menu-prog': { active: true, ledOn: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'A-36  Brass Pad BC',
        selectedIndex: 36,
      },
      tipText: 'Tip: The PROG HELD help menu (hold PROG and read the display) shows: "WRITE : REVERT TO PANEL" as a quick reminder of this shortcut.',
    },
    {
      id: 'step-8',
      title: 'Performing Revert to Panel',
      instruction:
        'To revert: press and hold the PROG switch, then (while holding PROG) press the WRITE switch. The current program is immediately updated with the positions of all physical controls on the DeepMind 12. The asterisk (*) will appear, showing the program now has unsaved changes.',
      details:
        'The PROG HELD help menu appears on screen while you hold PROG, showing all available shortcuts including "WRITE : REVERT TO PANEL". After reverting, the asterisk (*) appears before the program name as a reminder that something has changed. Use the WRITE command to save the reverted state if you want to keep it permanently.',
      highlightControls: ['prog-menu-prog', 'prog-menu-write'],
      panelStateChanges: {
        'prog-menu-write': { active: true, ledOn: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'A-36  *Brass Pad BC',
        selectedIndex: 36,
      },
      tipText: 'Tip: Revert to Panel is also accessible via the COMPARE shortcut shown in the WRITE PROGRAM menu — giving you multiple ways to reach the same workflow depending on where you are in the interface.',
    },
  ],
};
