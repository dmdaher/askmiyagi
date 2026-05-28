import { Tutorial } from '@/types/tutorial';

export const multiPlayerBoothSetup: Tutorial = {
  id: 'multi-player-booth-setup',
  deviceId: 'cdj-3000',
  title: 'Multi-Player Booth Setup (3–6 Decks)',
  description:
    'Configure a multi-CDJ booth: assign player numbers strategically, use DUPLICATION to copy MY SETTINGS across all decks in one pass, manage ON AIR indicator sync with the mixer, and rotate master role across 4+ decks during long sets.',
  category: 'networking',
  difficulty: 'advanced',
  estimatedTime: '9 min',
  addedDate: '2026-05-28',
  tags: ['multi-player', 'booth', 'duplication', 'player-number', 'on-air', 'master-rotation'],
  steps: [
    {
      id: 'step-1',
      title: 'Plan Your Player Number Assignments',
      instruction:
        'Before powering decks on: decide which physical CDJ position corresponds to which mixer channel. Standard 4-deck setup: leftmost deck = PLAYER 1 = CH1, then 2/2, 3/3, 4/4. For a 6-deck setup, add 5 and 6 in your visual scan order (usually right-side outer decks).',
      details:
        'Why physical position should map to channel number: when something goes wrong live, you grab the deck nearest you. If PLAYER 1 is physically deck 3, you waste seconds finding it. Standardize the mapping across every booth you build — your hands learn the layout, not the labels.',
      highlightControls: [],
      panelStateChanges: {},
      tipText:
        'In agency or club settings where decks rotate gear, gaffer-tape a small "P1", "P2" label below each CDJ\'s screen. Saves new arrivals 5 minutes of orientation.',
    },
    {
      id: 'step-2',
      title: 'Power Up + Assign Each Player Number',
      instruction:
        'Power on each CDJ. On each, press MENU/UTILITY → PRO DJ LINK → PLAYER No. Turn the rotary selector to set the number per your plan. Press to confirm. Repeat across all decks. Each deck\'s assigned number appears in the bottom-left of its touch display.',
      details:
        'Doing this on every deck before any SD/USB is inserted: player number is LOCKED once storage is mounted. Forgetting and inserting USB first means you have to eject, change, reinsert — annoying but recoverable. The proper order is: power → assign numbers → insert storage.',
      highlightControls: ['MENU_UTILITY', 'ROTARY_SELECTOR'],
      panelStateChanges: {
        MENU_UTILITY: { active: true },
        ROTARY_SELECTOR: { active: true },
      },
    },
    {
      id: 'step-3',
      title: 'Configure MY SETTINGS on Deck 1',
      instruction:
        'On the leftmost CDJ (PLAYER 1), open UTILITY and dial in your preferences: time mode (REMAIN/ELAPSED), AUTO CUE level, jog brightness, waveform color mode, headphone-pre options. This is your reference deck — every other deck should match it.',
      details:
        'Why one reference deck first: 4 decks × 20 settings each = 80 configurations to keep in sync if you set them individually. The DUPLICATION feature (next step) eliminates 79 of those — you configure ONE, then push to all others. Get the reference right before duplicating.',
      highlightControls: ['MENU_UTILITY', 'ROTARY_SELECTOR'],
      panelStateChanges: {
        MENU_UTILITY: { active: true },
        ROTARY_SELECTOR: { active: true },
      },
    },
    {
      id: 'step-4',
      title: 'Use DUPLICATION to Push MY SETTINGS to All Decks',
      instruction:
        'On PLAYER 1: UTILITY → MY SETTINGS → DUPLICATION. Press the rotary to begin. The deck broadcasts its settings to every linked CDJ on the network — up to 5 other decks receive identical configs simultaneously. Each receiving deck displays a confirmation and applies the new settings.',
      details:
        'DUPLICATION is the killer feature for multi-deck booths. Without it, you\'d touch 4-6 menus per setting × 20 settings = 80-120 button presses before the show. With it, it\'s 80-120 → 21 (set on PLAYER 1, then one DUPLICATION command). The 5-minute time savings per show adds up to hours per residency.',
      highlightControls: ['MENU_UTILITY', 'ROTARY_SELECTOR'],
      panelStateChanges: {
        ROTARY_SELECTOR: { active: true },
      },
      tipText:
        'After DUPLICATION, do a 5-second verification on a random deck — open UTILITY, check that your reference settings landed. Network glitches occasionally cause partial duplication; trust but verify.',
    },
    {
      id: 'step-5',
      title: 'Insert Storage + Verify Network Population',
      instruction:
        'Insert SD/USB into each CDJ. On any deck, press MENU/UTILITY → PRO DJ LINK → STATUS. You should see all expected player numbers AND any rekordbox connections. If a number is missing or shows "—", the corresponding deck isn\'t on the network yet (check LAN cable, hub power).',
      details:
        'STATUS is your "all systems go" check before the doors open. Doing it now (calm, no audience) catches problems while there\'s still time to fix them. Doing it for the first time when a deck drops mid-set is high-stress diagnosis under pressure.',
      highlightControls: ['SD_SLOT', 'USB_PORT', 'MENU_UTILITY'],
      panelStateChanges: {
        SD_SLOT: { active: true },
      },
    },
    {
      id: 'step-6',
      title: 'Verify ON AIR Indicator Sync with Mixer',
      instruction:
        'Push one channel fader up on the mixer. The corresponding CDJ\'s ON AIR indicator (around the jog wheel ring) should light red — telling you "this deck is live to the floor". Push the fader down; the ON AIR light extinguishes. Cycle through every channel/deck pair to confirm.',
      details:
        'ON AIR is what stops you from accidentally scratching the playing track when you meant to scratch the cued one. The visual feedback is constant — your peripheral vision picks up red glow without conscious thought. If ON AIR fails to light when a fader is up, the mixer-to-CDJ link is broken (check LAN cable to the mixer specifically — the data path is separate from inter-deck LAN).',
      highlightControls: ['JOG_WHEEL'],
      panelStateChanges: {
        JOG_WHEEL: { active: true, ledOn: true },
      },
    },
    {
      id: 'step-7',
      title: 'Master Role Rotation Across 4+ Decks',
      instruction:
        'Press MASTER on PLAYER 1 — its MASTER LED lights, all other decks now sync to its tempo. Press MASTER on PLAYER 2 — the LED moves; tempo lock shifts to PLAYER 2. The master role is single-instance: only one deck at a time owns it. You rotate it deliberately as the set evolves.',
      details:
        'Long-set workflow: as you mix PLAYER 1 → PLAYER 2, transfer master to PLAYER 2 before fading PLAYER 1 out. When PLAYER 3 comes online, it syncs to PLAYER 2 (the current master). This is how a 4-hour set keeps coherent tempo flow without sudden tempo jumps — each transition both moves the music AND moves the master role forward.',
      highlightControls: ['MASTER'],
      panelStateChanges: {
        MASTER: { active: true, ledOn: true },
      },
    },
    {
      id: 'step-8',
      title: 'Final Pre-Show Checklist',
      instruction:
        'Run this 4-item check on the active master deck: (1) STATUS shows all expected players, (2) ON AIR sync confirmed across all channels, (3) MY SETTINGS look correct (TIME mode, AUTO CUE level), (4) a test track loads cleanly on each deck. Close MENU/UTILITY when done — you\'re booth-ready.',
      details:
        'Discipline of the pre-show ritual: 4 minutes here saves 30+ minutes of mid-set firefighting. Pros do this same checklist every show, every booth, every time. Muscle-memorized verification is the foundation of professional reliability — the audience never sees this, but they hear the difference when something breaks at 1am vs when nothing breaks.',
      highlightControls: ['MENU_UTILITY', 'PLAY_PAUSE'],
      panelStateChanges: {
        MENU_UTILITY: { active: false },
        ROTARY_SELECTOR: { active: false },
      },
    },
  ],
};
