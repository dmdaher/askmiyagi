import { Tutorial } from '@/types/tutorial';

export const troubleshootingProDjLink: Tutorial = {
  id: 'troubleshooting-pro-dj-link',
  deviceId: 'cdj-3000',
  title: 'Troubleshooting PRO DJ LINK & Recovery',
  description:
    'Diagnose and recover from the failures DJs actually hit live: connection drops, player-number conflicts, no audio after a cable swap, beatgrid drift mid-set, and falling back to USB when the network dies.',
  category: 'networking',
  difficulty: 'advanced',
  estimatedTime: '8 min',
  addedDate: '2026-05-28',
  tags: ['troubleshooting', 'pro-dj-link', 'recovery', 'live-performance', 'fallback'],
  steps: [
    {
      id: 'step-1',
      title: 'Symptom 1 — Player Drops Off the Network',
      instruction:
        'The other CDJs and the mixer suddenly stop "seeing" this deck. Press MENU/UTILITY → PRO DJ LINK → STATUS. If STATUS shows your own player number but no others, the LAN connection is the suspect — not the player itself.',
      details:
        'STATUS is the fastest single-screen confirmation that the network has split. Why this matters live: a dropped player can keep playing its own audio fine, so the booth monitor sounds normal — but other decks lose beat-sync data and waveform overlays go blank. Always check STATUS before assuming the player itself is broken.',
      highlightControls: ['MENU_UTILITY'],
      panelStateChanges: {
        MENU_UTILITY: { active: true },
      },
      tipText:
        'Memorize the path: MENU → PRO DJ LINK → STATUS. In a panic situation you want it on muscle memory, not in the manual.',
    },
    {
      id: 'step-2',
      title: 'Fix 1 — Reseat the LAN Cable Without Cutting Audio',
      instruction:
        'With one deck still playing audio, walk to the back of the dropped CDJ and reseat the LAN cable (unplug, plug back in). The audio path is analog/digital out to the mixer — it survives a LAN reseat. The network re-handshakes in 2–5 seconds and STATUS will repopulate.',
      details:
        'Why this works: PRO DJ LINK runs over Ethernet, but the actual audio output to the mixer is a separate signal path (RCA / digital out). LAN carries metadata only — track names, BPM, beatgrid, sync. Cutting LAN does NOT cut sound. This is the single most valuable fact for staying calm in a live booth — never panic-stop a playing track because the network dropped.',
      highlightControls: [],
      panelStateChanges: {
        MENU_UTILITY: { active: false },
      },
    },
    {
      id: 'step-3',
      title: 'Symptom 2 — Two Decks Claim the Same Player Number',
      instruction:
        'When two CDJs come online with the same number (most common cause: both set to AUTO with timing too close), the mixer routes the wrong waveform to the wrong channel. Press MENU/UTILITY → PRO DJ LINK → PLAYER No. on each deck and check what number it currently shows.',
      details:
        'AUTO assignment is convenient for a 2-deck setup but unreliable at 4+ decks because boot order races. The fix is to assign each deck a fixed number that matches its mixer channel. If a deck shows "—" instead of a number, it means UTILITY refused to assign — that\'s a signal the SD/USB is mounted (player number can\'t change while storage is connected).',
      highlightControls: ['MENU_UTILITY', 'ROTARY_SELECTOR'],
      panelStateChanges: {
        MENU_UTILITY: { active: true },
        ROTARY_SELECTOR: { active: true },
      },
    },
    {
      id: 'step-4',
      title: 'Fix 2 — Assign a Fixed Player Number',
      instruction:
        'In PRO DJ LINK → PLAYER No., turn the rotary selector to pick the number matching this deck\'s mixer channel (1 for CH1, 2 for CH2, etc.). Press to confirm. If the rotary won\'t commit the change, disconnect any mounted SD/USB media first — player number is locked while storage is active.',
      details:
        'Always set fixed numbers BEFORE the show, never during. The "disconnect storage to change PLAYER No." rule exists to prevent mid-set chaos: changing a player number while a track is loaded would break Beat Sync, Instant Doubles, and rekordbox\'s waveform overlay simultaneously.',
      highlightControls: ['ROTARY_SELECTOR', 'BACK', 'MENU_UTILITY'],
      panelStateChanges: {
        ROTARY_SELECTOR: { active: true },
      },
      tipText:
        'A practical pre-show ritual: power up all decks → set PLAYER No. on each → insert SD/USB last. Now the assignment is locked.',
    },
    {
      id: 'step-5',
      title: 'Symptom 3 — No Audio From This Deck Specifically',
      instruction:
        'The track shows as playing, the waveform scrolls, but the mixer channel is dead silent. Check three things in order: (1) is the SOURCE/USB indicator lit? (2) is the AUDIO OUT (rear-panel RCA or DIGITAL OUT) actually cabled? (3) is the mixer channel\'s LINE/PHONO switch set correctly?',
      details:
        'The "looks playing but no sound" failure is almost never the CDJ itself — it\'s a cable or mixer-side switch. Why ordered diagnosis matters: each check takes 5 seconds; randomly stabbing at unfamiliar gear costs minutes. Always: deck-side first (SOURCE indicator confirms playback), cabling second (visual inspection of rear), mixer-side last (LINE/PHONO, channel level, fader position).',
      highlightControls: ['SOURCE_INDICATOR', 'PLAY_PAUSE'],
      panelStateChanges: {
        PLAY_PAUSE: { active: true },
      },
    },
    {
      id: 'step-6',
      title: 'Symptom 4 — Beatgrid Drift Mid-Set',
      instruction:
        'You synced two decks, mixed them, and 30 seconds later they\'re drifting apart audibly. Press BEAT SYNC again to re-lock. If they keep drifting, the loaded track\'s beatgrid is wrong — open the Beatgrid Adjustment workflow (covered in beatgrid-adjustment) on the drifting deck while a buffer-loop holds your mix.',
      details:
        'Beatgrid drift always traces to one of two causes: (1) the track\'s saved grid is off (most common with old uploads or live recordings), or (2) the master deck\'s tempo is moving (someone bumped the slider). Re-pressing BEAT SYNC re-locks the slave to the master\'s current tempo — that\'s a 1-second fix that buys time to identify which case you\'re in.',
      highlightControls: ['BEAT_SYNC_INST_DOUBLES', 'MASTER'],
      panelStateChanges: {
        BEAT_SYNC_INST_DOUBLES: { active: true },
      },
      tipText:
        'Set up a hot cue at a clean downbeat before you mix in. If sync drifts, you can SLIP-jump back to that cue and re-engage sync without losing position.',
    },
    {
      id: 'step-7',
      title: 'Fallback — USB-Only Mode When the Network Won\'t Recover',
      instruction:
        'If LAN refuses to come back (broken hub, bad cable, mystery), keep playing. Each CDJ has its own SD/USB slot — yank the LAN cable, load tracks locally from SD/USB, and ride out the set without PRO DJ LINK. Beat Sync between decks won\'t work, but manual beatmatching with the jog wheel does.',
      details:
        'PRO DJ LINK is a convenience layer, not a dependency. Knowing that the deck still plays everything you need without the network is what separates a stressful set from a survivable one. Use this moment to dispatch someone to swap the hub or LAN cable while you keep the floor moving.',
      highlightControls: ['SD_SLOT', 'USB_PORT', 'JOG_WHEEL'],
      panelStateChanges: {
        SD_SLOT: { active: true },
      },
    },
    {
      id: 'step-8',
      title: 'Post-Mortem — Verify Recovery',
      instruction:
        'After fixing whatever broke, return to MENU/UTILITY → PRO DJ LINK → STATUS. Confirm all expected player numbers appear AND the LINK indicator lights up on each deck. Load a fresh track and verify the waveform overlay shows on the other CDJs — that\'s the proof PRO DJ LINK is fully operational again.',
      details:
        'Don\'t skip the post-mortem. Half-recovered network states (LAN restored but rekordbox connection dead, or one deck still using stale cached metadata) are how you end up dropping audio at the next mix transition. The 30-second STATUS-check ritual catches these before the dance floor notices.',
      highlightControls: ['MENU_UTILITY', 'ROTARY_SELECTOR'],
      panelStateChanges: {
        MENU_UTILITY: { active: true },
        ROTARY_SELECTOR: { active: false },
      },
    },
  ],
};
