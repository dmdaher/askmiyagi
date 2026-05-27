import { Tutorial } from '@/types/tutorial';

export const proDjLinkSetup: Tutorial = {
  id: 'pro-dj-link-setup',
  deviceId: 'cdj-3000',
  title: 'PRO DJ LINK Setup',
  description:
    'Link multiple CDJ-3000s and a DJ mixer over a single LAN, connect a PC/Mac running rekordbox, and set each player\'s number.',
  category: 'networking',
  difficulty: 'intermediate',
  estimatedTime: '6 min',
  tags: ['pro-dj-link', 'networking', 'lan', 'usb', 'wifi', 'player-number'],
  steps: [
    {
      id: 'step-1',
      title: 'What PRO DJ LINK Does',
      instruction:
        'PRO DJ LINK lets you share track data, beat sync, and metadata between linked CDJs, a DJ mixer, and computers running rekordbox over a single network. Everything we cover here happens on the rear panel — no top-panel controls are involved.',
      details:
        'Before connecting anything: turn the unit off and disconnect the power cord, make every cable connection, then plug the power back in. Use the supplied LAN cable or any STP CAT5e shielded cable.',
      highlightControls: [],
      panelStateChanges: {},
    },
    {
      id: 'step-2',
      title: 'Wired LAN Connection',
      instruction:
        'Connect each CDJ\'s rear-panel LAN port to a 1 Gbps switching hub using a shielded CAT5e LAN cable. Connect the DJ mixer to the same hub. You can link up to 6 multi players this way (up to 4 if any are pre-2020 models).',
      details:
        'If your DJ mixer has enough LAN ports for every player you want to link, skip the hub and connect each CDJ directly into the mixer. Do not disconnect a LAN cable while units are exchanging audio data — it can drop tracks mid-set.',
      highlightControls: [],
      panelStateChanges: {},
      tipText:
        'A consumer router will work in a pinch, but a dedicated gigabit switching hub gives the most reliable timing for beat sync.',
    },
    {
      id: 'step-3',
      title: 'Connect a PC/Mac via USB',
      instruction:
        'To send tracks from rekordbox over PRO DJ LINK using USB, connect the rear-panel USB port (the one labeled for PC connection) to your computer with a standard USB cable. Up to 2 computers can be connected over USB.',
      details:
        'Install the rekordbox LINK Export driver (Mac/Windows) before plugging in for the first time. With USB LINK Export active, rekordbox treats this CDJ as a source — your library appears on the SOURCE screen.',
      highlightControls: [],
      panelStateChanges: {},
    },
    {
      id: 'step-4',
      title: 'Wireless LAN (Wi-Fi) Connection',
      instruction:
        'For a cable-free PC/Mac connection, link the CDJs and a wireless router/access point that conforms to IEEE 802.11n or 802.11ac, then connect your computer to the same Wi-Fi network. Up to 4 computers can be linked this way.',
      details:
        'Wireless is convenient but adds latency and is more failure-prone than wired LAN — use it for prep and prefer wired for live performance. The audio path between players and the mixer is still analog or via the mixer\'s digital input.',
      highlightControls: [],
      panelStateChanges: {},
    },
    {
      id: 'step-5',
      title: 'Set the Player Number',
      instruction:
        'On each linked CDJ, the player number must match the mixer channel its audio cable is plugged into. Press and hold the MENU/UTILITY button, navigate to PRO DJ LINK → PLAYER No., and pick AUTO or 1–6.',
      details:
        'With AUTO (the factory setting), the unit picks an unused number on boot. Set a specific number if you want a fixed assignment. The player number appears in the bottom-left of the touch display. You cannot change PLAYER No. while an SD or USB device is connected — disconnect storage first.',
      highlightControls: ['MENU_UTILITY'],
      panelStateChanges: {
        MENU_UTILITY: { active: true },
      },
      tipText:
        'Always match the player number to the mixer channel feeding it audio — otherwise beat sync and waveform overlays target the wrong deck.',
    },
    {
      id: 'step-6',
      title: 'Use the Rotary Selector to Navigate UTILITY',
      instruction:
        'Inside UTILITY, turn the rotary selector to move between settings, press to select, and press BACK to go up a level. Press the MENU/UTILITY button again to close UTILITY when done.',
      details:
        'Categories run down the left side: DJ SETTING, DISPLAY (LCD), DISPLAY (INDICATOR), PRO DJ LINK, SYSTEM, INFO. The currently selected setting\'s value options appear on the right.',
      highlightControls: ['ROTARY_SELECTOR', 'BACK', 'MENU_UTILITY'],
      panelStateChanges: {
        ROTARY_SELECTOR: { active: true },
      },
    },
    {
      id: 'step-7',
      title: 'Ready for Sync',
      instruction:
        'With players linked, numbers set, and rekordbox connected, you are ready for synchronized performance. The Beat Sync & Instant Doubles tutorial covers the MASTER and BEAT SYNC buttons; MIDI/HID — DJ Application Control covers using this CDJ as a controller for software.',
      details:
        'Always disconnect SD/USB before unplugging LAN cables. Treat the network as production infrastructure: same hub, same cables, same configuration every show.',
      highlightControls: [],
      panelStateChanges: {
        ROTARY_SELECTOR: { active: false },
        MENU_UTILITY: { active: false },
      },
    },
  ],
};
