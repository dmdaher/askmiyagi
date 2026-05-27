import { Tutorial } from '@/types/tutorial';

export const utilitySettings: Tutorial = {
  id: 'utility-settings',
  deviceId: 'cdj-3000',
  title: 'UTILITY Settings',
  description:
    'Tour every UTILITY category — DJ SETTING, DISPLAY (LCD), DISPLAY (INDICATOR), PRO DJ LINK, SYSTEM, and INFO — and learn how to tailor the CDJ-3000 to your workflow.',
  category: 'configuration',
  difficulty: 'intermediate',
  estimatedTime: '8 min',
  tags: ['utility', 'settings', 'configuration', 'dj-setting', 'display', 'system'],
  steps: [
    {
      id: 'step-1',
      title: 'Open the UTILITY Screen',
      instruction:
        'Press and hold the MENU/UTILITY button until the UTILITY screen appears on the touch display. A short press opens MENU instead — make sure to hold.',
      details:
        'UTILITY has three columns: Category on the left, Setting items and current values in the middle, and the Options for the highlighted setting on the right. The unit\'s software version appears in the top-right corner.',
      highlightControls: ['MENU_UTILITY'],
      panelStateChanges: {
        MENU_UTILITY: { active: true },
      },
    },
    {
      id: 'step-2',
      title: 'Navigate with the Rotary Selector',
      instruction:
        'Turn the rotary selector to move through categories and items, press to drill in or commit a value, and press BACK to step out. Press MENU/UTILITY again to close UTILITY.',
      details:
        'You can also touch any row or option directly on the screen. The current value for each setting is shown next to its name, with the factory default marked by an asterisk in the manual.',
      highlightControls: ['ROTARY_SELECTOR', 'BACK', 'MENU_UTILITY'],
      panelStateChanges: {
        ROTARY_SELECTOR: { active: true },
      },
    },
    {
      id: 'step-3',
      title: 'DJ SETTING Category',
      instruction:
        'DJ SETTING controls how the deck behaves during performance: LOAD LOCK (UNLOCK/LOCK), QUANTIZE BEAT VALUE (1/8, 1/4, 1/2, 1), BEAT JUMP BEAT VALUE (1/2 to 64 beats), HOT CUE AUTO LOAD, HOT CUE COLOR, AUTO CUE LEVEL, VINYL SPEED ADJUST, and PLAY MODE.',
      details:
        'AUTO CUE LEVEL ranges from −78dB to −36dB, plus MEMORY (sets the cue point closest to the start of the track, the factory default). PLAY MODE selects CONTINUE (auto-load next track at end) or SINGLE (factory default — stop at end). Most DJ SETTING items can be duplicated to linked players via PRO DJ LINK → DUPLICATION.',
      highlightControls: [],
      panelStateChanges: {},
      tipText:
        'Set LOAD LOCK = LOCK before a high-pressure set to make accidentally loading over a playing track impossible.',
    },
    {
      id: 'step-4',
      title: 'DISPLAY (LCD) Category',
      instruction:
        'DISPLAY (LCD) covers the touch display itself: LCD BRIGHTNESS (1–5), JOG LCD BRIGHTNESS (1–5), LANGUAGE, SCREEN SAVER (OFF/ON), and TOUCH DISPLAY CALIBRATION.',
      details:
        'The screen saver kicks in after 5 minutes with no track loaded, or after 100 minutes during pause / cue standby / end-of-track. Touching the screen wakes it. Use TOUCH DISPLAY CALIBRATION if taps stop registering accurately — follow the on-screen [+] targets and avoid sharp objects like pen tips.',
      highlightControls: ['TOUCH_DISPLAY', 'JOG_DISPLAY'],
      panelStateChanges: {},
    },
    {
      id: 'step-5',
      title: 'DISPLAY (INDICATOR) Category',
      instruction:
        'DISPLAY (INDICATOR) controls the panel\'s lit indicators: SLIP FLASHING (blink buttons available for Slip), ON AIR DISPLAY (dim when an On Air–compatible mixer says another deck is live), JOG RING BRIGHTNESS (OFF/1/2), and JOG RING INDICATOR (blink when track is ending).',
      details:
        'JOG RING INDICATOR is a useful safety net — when the remaining time on the playing track gets low, the jog ring blinks so you notice even without looking at the waveform. Factory default is ON.',
      highlightControls: ['JOG_WHEEL'],
      panelStateChanges: {},
    },
    {
      id: 'step-6',
      title: 'PRO DJ LINK Category',
      instruction:
        'PRO DJ LINK contains: PLAYER No. (AUTO or 1–6), DUPLICATION (copy UTILITY settings to other linked players — ALL or PLAYER 1–6), and MIDI CHANNEL (1–16) used when controlling DJ software.',
      details:
        'DUPLICATION is fantastic for multi-CDJ booths: dial in your preferences on one unit, then duplicate to the rest. It copies most DJ SETTING items, plus Time display mode, Auto Cue, jog mode, tempo range, Master Tempo, Quantize, Beat Sync, and phase meter. It cannot target a player currently playing a track.',
      highlightControls: [],
      panelStateChanges: {},
      tipText:
        'DUPLICATION saves minutes per gig if you set up multiple CDJs the same way every time.',
    },
    {
      id: 'step-7',
      title: 'SYSTEM Category',
      instruction:
        'SYSTEM holds: AUTO STANDBY (OFF/ON — defaults ON, sleeps after 4 hours idle), OUTPUT ATT. (−12dB to 0dB, ignored when DJ software drives output), HISTORY NAME (up to 32 characters for the auto-saved play history), and DEFAULT (factory-reset the duplicatable settings — not available during playback).',
      details:
        'AUTO STANDBY triggers only when no SD/USB is connected, no PC/Mac is on the rear USB, and the unit is not on the PRO DJ LINK network. Any one of those keeps it awake. DEFAULT is destructive for your customised settings — confirm before using.',
      highlightControls: [],
      panelStateChanges: {},
    },
    {
      id: 'step-8',
      title: 'INFO Category',
      instruction:
        'INFO is read-only diagnostics: VERSION No. (firmware version), IP ADDRESS (the unit\'s address on the PRO DJ LINK network), SERIAL No., and LICENSE (third-party software notices).',
      details:
        'IP ADDRESS is invaluable when troubleshooting a network — if it is empty or shows a self-assigned 169.254.x.x address, the LAN connection or hub is suspect. VERSION No. tells you whether to install a firmware update from pioneerdj.com.',
      highlightControls: [],
      panelStateChanges: {},
    },
    {
      id: 'step-9',
      title: 'Close UTILITY',
      instruction:
        'Press the MENU/UTILITY button to close UTILITY and return to the previous screen. To save these settings to a storage device for the next gig, see SHORTCUT & My Settings (MY SETTINGS SAVE/LOAD).',
      details:
        'UTILITY settings persist when the unit is powered off. To reset everything to factory defaults at once, use SYSTEM → DEFAULT — but note that not every setting is included (those marked with a † footnote in the manual).',
      highlightControls: ['MENU_UTILITY'],
      panelStateChanges: {
        MENU_UTILITY: { active: false },
        ROTARY_SELECTOR: { active: false },
      },
    },
  ],
};
