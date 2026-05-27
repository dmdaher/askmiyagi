import { Tutorial } from '@/types/tutorial';

export const beatSyncAndInstantDoubles: Tutorial = {
  id: 'beat-sync-and-instant-doubles',
  deviceId: 'cdj-3000',
  title: 'Beat Sync & Instant Doubles',
  description:
    'Promote one CDJ to sync master with MASTER, lock the other players to it with BEAT SYNC, swap the master mid-set, and clone the master\'s track and position to your deck by holding BEAT SYNC.',
  category: 'sync',
  difficulty: 'intermediate',
  estimatedTime: '5 min',
  tags: [
    'beat-sync',
    'master',
    'sync',
    'instant-doubles',
    'pro-dj-link',
    'tempo',
    'intermediate',
  ],
  steps: [
    {
      id: 'step-1',
      title: 'Confirm the PRO DJ LINK Network',
      instruction:
        'Make sure two or more CDJ-3000s are connected to the same PRO DJ LINK network and that each player has been assigned a unique player number (see the PRO DJ LINK Setup tutorial). All sync operations require at least two linked players reading rekordbox-analysed tracks.',
      details:
        'Tracks that have not been analysed by rekordbox cannot sync — the player has no beatgrid to lock to. Sync also fails silently on link drops, so verify all expected player numbers are visible on the touch display first.',
      highlightControls: [],
      panelStateChanges: {},
    },
    {
      id: 'step-2',
      title: 'Set This Deck as Sync Master',
      instruction:
        'On the CDJ you want every other player to follow, press the MASTER button. The MASTER indicator lights up and the touch display shows this player as the network sync master. Its current tempo is now the reference tempo.',
      details:
        'The sync master can also be rekordbox running on a connected PC / Mac — set that inside rekordbox if you want the software to drive tempo. There is only ever one sync master on the network at a time.',
      highlightControls: ['MASTER'],
      panelStateChanges: {
        MASTER: { active: true },
      },
    },
    {
      id: 'step-3',
      title: 'Lock Another Deck with BEAT SYNC',
      instruction:
        'On a different CDJ in the network, press BEAT SYNC / INST. DOUBLES. That player\'s tempo and beat position snap to the master, and Beat Sync turns on. Subsequent tempo changes on the master propagate to this deck automatically.',
      details:
        'While Beat Sync is on, the TEMPO slider on this (non-master) player is disabled — the master sets the tempo, not the slider. Move the slider back to the playback tempo position to "release" it before turning Beat Sync off, or movements after re-enabling will jump the pitch.',
      highlightControls: ['BEAT_SYNC_INST_DOUBLES'],
      panelStateChanges: {
        BEAT_SYNC_INST_DOUBLES: { active: true },
        TEMPO_SLIDER: { active: false },
      },
    },
    {
      id: 'step-4',
      title: 'Swap the Sync Master Mid-Set',
      instruction:
        'Any player can become master at any time. Press MASTER on the deck you want to promote — the previous master gives up the role, the new player takes it, and every synced deck (including the old master, if its sync is still on) re-locks to the new tempo.',
      details:
        'Re-mastering is the cleanest way to hand the mix to the next deck before its tempo would drift after a beatgrid edit. Pressing MASTER on the current master also releases the role (handy as a "free everyone" reset).',
      highlightControls: ['MASTER'],
      panelStateChanges: {},
    },
    {
      id: 'step-5',
      title: 'Clone the Master with Instant Doubles',
      instruction:
        'On any non-master deck, press and HOLD the BEAT SYNC / INST. DOUBLES button. The master\'s currently-loaded track loads onto this player at the exact same playback position — both decks are now playing the same track in the same place, in sync.',
      details:
        'Instant Doubles is the textbook back-to-back tool: lift the fader from the master to your double, drop a Hot Cue on the double, then ride that new cue forward. Hold-not-tap is the trigger — a quick tap is just normal Beat Sync.',
      highlightControls: ['BEAT_SYNC_INST_DOUBLES'],
      panelStateChanges: {},
    },
    {
      id: 'step-6',
      title: 'Sync Mastered',
      instruction:
        'You can elect any player as the network reference, lock the others to it, hand the master role around mid-set, and clone the master\'s playback state with a single hold. Next: Key Sync & Key Shift add harmonic matching on top of the tempo match you just set up.',
      details:
        'Beat Sync is the foundation for every later sync-aware feature — Key Sync, Quantize on the network, and Slip operations that need to land back on the master\'s grid all assume sync is already locked.',
      highlightControls: [],
      panelStateChanges: {
        BEAT_SYNC_INST_DOUBLES: { active: false },
        MASTER: { active: false },
        TEMPO_SLIDER: { active: true },
      },
    },
  ],
};
