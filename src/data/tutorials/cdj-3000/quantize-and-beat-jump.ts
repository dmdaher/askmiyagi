import { Tutorial } from '@/types/tutorial';

export const quantizeAndBeatJump: Tutorial = {
  id: 'quantize-and-beat-jump',
  deviceId: 'cdj-3000',
  title: 'Quantize & Beat Jump',
  description:
    'Snap every cue, loop, reverse, and slip trigger to the beat grid with QUANTIZE, then move the playback point a precise number of beats — forward or backward — with BEAT JUMP ◄ / ►, change the jump size from the touch display, and move an active loop without breaking it.',
  category: 'sync',
  difficulty: 'advanced',
  estimatedTime: '7 min',
  tags: [
    'quantize',
    'beat-jump',
    'loop-move',
    'beat-value',
    'shortcut',
    'utility',
    'touch-display',
    'advanced',
  ],
  steps: [
    {
      id: 'step-1',
      title: 'Turn Quantize On',
      instruction:
        'Press the QUANTIZE button. The button lights up and the touch display shows the current Quantize beat value (e.g. "Q 1/2"). From this moment, every cue, Hot Cue, loop, reverse, and Slip trigger will snap to the nearest beat at that resolution instead of firing exactly when you pressed.',
      details:
        'Quantize only works on tracks rekordbox has analysed — the player needs the beatgrid to snap to. If a track has no analysis, Quantize silently does nothing and your triggers fire on the literal press.',
      highlightControls: ['QUANTIZE'],
      panelStateChanges: {
        PLAY_PAUSE: { active: true },
        QUANTIZE: { active: true },
      },
    },
    {
      id: 'step-2',
      title: 'Set the Quantize Beat Value',
      instruction:
        'Press SHORTCUT (or hold MENU / UTILITY) and select QUANTIZE BEAT VALUE. Choose 1/8, 1/4, 1/2, or 1 beat. Tighter values (1/8, 1/4) snap to sub-divisions; looser values (1/2, 1) only snap on the main downbeats and half-beats.',
      details:
        'Pick the resolution by what you are about to do: 1/8 for stutter Hot Cue work where small offsets feel "right", 1 for safe back-to-back drops where any miss is unacceptable. The value persists until you change it.',
      highlightControls: ['SHORTCUT', 'MENU_UTILITY'],
      panelStateChanges: {
        SHORTCUT: { active: true },
      },
    },
    {
      id: 'step-3',
      title: 'Jump Forward with BEAT JUMP ►',
      instruction:
        'Press BEAT JUMP ►. The playback point jumps forward by the number of beats set as BEAT JUMP BEAT VALUE — the default is shown on the touch display. The press lands you on a clean beat boundary, so the mix stays in phase.',
      details:
        'Beat Jump is the precision navigator: instead of "scrub forward until it sounds right" with the jog wheel, you hop forward by an exact musical interval. It is the cleanest way to skip a bridge or repeat a 4-bar phrase.',
      highlightControls: ['BEAT_JUMP_FWD'],
      panelStateChanges: {
        SHORTCUT: { active: false },
        BEAT_JUMP_FWD: { active: true },
      },
    },
    {
      id: 'step-4',
      title: 'Jump Backward with BEAT JUMP ◄',
      instruction:
        'Press BEAT JUMP ◄ to jump backward by the same beat value. Combine with BEAT JUMP ► for "re-rewind" moves — jump back 8 beats, ride the build again, jump forward 8 to land back where you were.',
      details:
        'Backward and forward jumps use the same configured beat value — there is no separate "back jump size". To jump by different lengths on the fly, use the on-screen Beat Jump selector instead (next step).',
      highlightControls: ['BEAT_JUMP_BACK'],
      panelStateChanges: {
        BEAT_JUMP_FWD: { active: false },
        BEAT_JUMP_BACK: { active: true },
      },
    },
    {
      id: 'step-5',
      title: 'Pick Any Jump Size from the Touch Display',
      instruction:
        'On the Waveform screen, touch BEAT JUMP. A row of buttons appears across the bottom — 1/2, 1, 2, 4, 8, 16, 32, 64 beats. Touch any value to jump immediately by that amount.',
      details:
        'The on-screen jump fires the jump in one motion: touch a value and the player jumps right then. Use it when you want a 32-beat skip without first reconfiguring the dedicated buttons.',
      highlightControls: ['TOUCH_DISPLAY'],
      panelStateChanges: {
        BEAT_JUMP_BACK: { active: false },
        TOUCH_DISPLAY: { active: true },
      },
    },
    {
      id: 'step-6',
      title: 'Shortcut: Change Beat Value with CALL / DELETE',
      instruction:
        'Hold CALL / DELETE and press BEAT JUMP ◄ or BEAT JUMP ►. Each press steps the BEAT JUMP BEAT VALUE down or up the supported range (1/2, 1, 2, 4, 8, 16, 32, 64). This is the fast way to reconfigure mid-set without diving into a menu.',
      details:
        'The same CALL / DELETE button shares hardware with CUE / LOOP CALL ◄ ►. While holding it, BEAT JUMP behaves as a value selector instead of a jump trigger — release CALL / DELETE before pressing BEAT JUMP normally again.',
      highlightControls: ['CUE_LOOP_CALL_BACK', 'CUE_LOOP_CALL_FWD', 'BEAT_JUMP_FWD'],
      panelStateChanges: {
        TOUCH_DISPLAY: { active: false },
      },
    },
    {
      id: 'step-7',
      title: 'Loop Move — Beat Jump During an Active Loop',
      instruction:
        'Drop a loop (any kind). While the loop is playing, press BEAT JUMP ◄ or BEAT JUMP ►. Instead of jumping playback out of the loop, the whole loop moves by the configured beat value — same length, new position. Press again to keep stepping the loop forward or backward through the track.',
      details:
        'Loop Move is the same Beat Jump trigger you already know, but applied to the loop as a unit. It is how you slide a 4-beat loop bar-by-bar across a phrase to find the part of the breakdown you actually want to repeat.',
      highlightControls: ['FOUR_BEAT_LOOP', 'BEAT_JUMP_FWD'],
      panelStateChanges: {
        FOUR_BEAT_LOOP: { active: true },
      },
    },
    {
      id: 'step-8',
      title: 'Quantize & Beat Jump Mastered',
      instruction:
        'You can lock every trigger to the grid with QUANTIZE, jump by any beat amount with the dedicated buttons or the touch display, retune the jump size on the fly with CALL / DELETE, and re-position an active loop with the same controls. Next: Slip Mode uses everything you just learned to maintain the timeline while you perform on top of it.',
      details:
        'Quantize + Beat Jump are the precision pair: Quantize keeps your triggers musical, Beat Jump lets you navigate by exact musical distance. Together they make every later compound move (Slip loops, Slip Hot Cues, on-grid scratch returns) predictable.',
      highlightControls: [],
      panelStateChanges: {
        FOUR_BEAT_LOOP: { active: false },
        QUANTIZE: { active: false },
      },
    },
  ],
};
