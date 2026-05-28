import { Tutorial } from '@/types/tutorial';

export const keySyncAndKeyShift: Tutorial = {
  id: 'key-sync-and-key-shift',
  deviceId: 'cdj-3000',
  title: 'Key Sync & Key Shift',
  description:
    'Match this deck\'s key to the sync master with KEY SYNC, reset to the original key with MASTER TEMPO, and shift up or down by exact semitones from the KEY SHIFT screen on the touch display.',
  category: 'sync',
  difficulty: 'advanced',
  estimatedTime: '6 min',
  tags: [
    'key-sync',
    'key-shift',
    'master-tempo',
    'harmonic-mixing',
    'semitone',
    'touch-display',
    'advanced',
  ],
  steps: [
    {
      id: 'step-1',
      title: 'Confirm the Track Is Analysed and a Master Is Set',
      instruction:
        'Key Sync depends on two things from earlier in the curriculum. First, the loaded track must be rekordbox-analysed — without analysis there is no key data to match. Second, another player on the PRO DJ LINK network must already be the sync master (set with MASTER, covered in Beat Sync & Instant Doubles). The master\'s key is the reference KEY SYNC will match.',
      details:
        'If either prerequisite is missing, KEY SYNC silently does nothing on press — no error message. Verify the touch display shows the loaded track\'s key (e.g. "Gm") and that the master player is visible on the network before continuing.',
      highlightControls: [],
      panelStateChanges: {
        PLAY_PAUSE: { active: true },
      },
    },
    {
      id: 'step-2',
      title: 'Press KEY SYNC to Match the Master',
      instruction:
        'Press the KEY SYNC button. The player picks the closest of six harmonic matches to the master\'s key — same key, dominant, subdominant, relative, relative-of-dominant, or relative-of-subdominant — and shifts this track\'s playback key to that match. The touch display shows the new key.',
      details:
        'The player always picks the match that requires the least change. "Closest" is measured in semitones, so a Gm master + an Am loaded track will likely shift to Gm or a near relative — never a wild +6 jump.',
      highlightControls: ['KEY_SYNC'],
      panelStateChanges: {
        KEY_SYNC: { active: true },
      },
    },
    {
      id: 'step-3',
      title: 'Reset the Key with KEY SYNC or MASTER TEMPO',
      instruction:
        'Press KEY SYNC again to release the key match and return to the track\'s original key. MASTER TEMPO does the same thing — pressing it resets the key as a side effect of toggling master tempo. Use whichever button is closer to your hand.',
      details:
        'Both buttons are valid resets. The reason MASTER TEMPO clears the key sync: enabling or disabling master tempo recomputes the playback engine\'s pitch handling, which wipes any active key shift back to the source key.',
      highlightControls: ['KEY_SYNC', 'MASTER_TEMPO'],
      panelStateChanges: {
        KEY_SYNC: { active: false },
      },
    },
    {
      id: 'step-4',
      title: 'Open KEY SHIFT on the Touch Display',
      instruction:
        'On the Waveform screen, touch KEY SHIFT. A control panel appears at the bottom of the display showing the current key, a centre shift value (e.g. "+2"), and minus / plus buttons on either side. KEY SHIFT is touch-only — there is no dedicated front-panel button for it.',
      details:
        'KEY SHIFT is independent of KEY SYNC. You can shift first and then KEY SYNC to the master, or KEY SYNC first and then shift further from the matched key. The two stack.',
      highlightControls: ['TOUCH_DISPLAY'],
      panelStateChanges: {
        TOUCH_DISPLAY: { active: true },
      },
    },
    {
      id: 'step-5',
      title: 'Shift Up or Down by Semitones',
      instruction:
        'Touch + to shift up by a semitone or − to shift down. Each touch moves the playback key one semitone in that direction and the centre value updates (+1, +2, +3 … or −1, −2 …). The display next to the buttons shows the resulting key (e.g. "Am" → "Bbm").',
      details:
        'Shifting affects pitch only; tempo stays exactly where the TEMPO slider has it. Shift in small steps when matching by ear — a single semitone is usually the difference between a clashing mix and a clean one.',
      highlightControls: ['TOUCH_DISPLAY'],
      panelStateChanges: {},
    },
    {
      id: 'step-6',
      title: 'Reset Key Shift Back to the Original Key',
      instruction:
        'Touch RESET on the KEY SHIFT control panel. The shift value returns to 0 and the playback key snaps back to the track\'s original key. Use this between songs so you do not carry a +3 shift into a new mix unintentionally.',
      details:
        'RESET on the KEY SHIFT panel only clears the manual shift — if KEY SYNC was also engaged, that still holds. Press KEY SYNC again (or MASTER TEMPO) to clear the sync match separately.',
      highlightControls: ['TOUCH_DISPLAY'],
      panelStateChanges: {},
    },
    {
      id: 'step-7',
      title: 'Key Sync & Key Shift Mastered',
      instruction:
        'You can match this deck\'s key to the master with one press, reset with KEY SYNC or MASTER TEMPO, and dial in exact semitone shifts from the touch display\'s KEY SHIFT screen. With this you have closed the full sync chain: Tempo (T05) → Beat Sync (T16) → Key Sync (T17).',
      details:
        'Harmonic mixing is the difference between two tracks that "sound layered" and two tracks that fight each other. With Key Sync and Key Shift you control both — automatic match to the master, or manual shifts when you want a specific harmonic colour the master cannot provide.',
      highlightControls: [],
      panelStateChanges: {
        TOUCH_DISPLAY: { active: false },
      },
    },
  ],
};
