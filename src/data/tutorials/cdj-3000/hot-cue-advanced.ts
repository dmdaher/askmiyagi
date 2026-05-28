import { Tutorial } from '@/types/tutorial';

export const hotCueAdvanced: Tutorial = {
  id: 'hot-cue-advanced',
  deviceId: 'cdj-3000',
  title: 'Hot Cue Advanced — Loop Capture & Banks',
  description:
    'Capture an active loop straight to a HOT CUE pad, cancel the loop without losing the Hot Cue, load a rekordbox-built Hot Cue Bank to populate all eight pads at once, and know the three ways manual call-up mode ends.',
  category: 'cueing',
  difficulty: 'advanced',
  estimatedTime: '6 min',
  tags: [
    'hot-cue',
    'hot-cue-loop',
    'hot-cue-bank',
    'browse',
    'call-up',
    'reloop-exit',
    'advanced',
  ],
  steps: [
    {
      id: 'step-1',
      title: 'Drop a Loop You Want to Bank',
      instruction:
        'Drop any loop on a playing track — press 4 BEAT LOOP for a fast example, or use BEAT LOOP on the touch display to pick a different length. The loop must actually be playing for the Hot Cue capture to register it as a loop.',
      details:
        'Any loop type counts — a manual loop made with LOOP IN / LOOP OUT, a 4 / 8 BEAT auto loop, or a BEAT LOOP from the touch display. The CDJ does not care how the loop was created, only that it is currently active.',
      highlightControls: ['PLAY_PAUSE', 'FOUR_BEAT_LOOP'],
      panelStateChanges: {
        PLAY_PAUSE: { active: true },
        FOUR_BEAT_LOOP: { active: true },
      },
    },
    {
      id: 'step-2',
      title: 'Capture the Loop onto a HOT CUE Pad',
      instruction:
        'While the loop is playing, press an empty HOT CUE pad (e.g. HOT CUE E). The whole loop — both the loop-in and loop-out points — is stored on that pad. The button lights orange to show it now holds a loop instead of a single cue point.',
      details:
        'Loop pads always light orange regardless of the HOT CUE COLOR utility setting; single-point cues honour the colour scheme but loops do not. The cue-point colour rule from the basic Hot Cues tutorial only applies to non-loop pads.',
      highlightControls: ['HOT_CUE_E'],
      panelStateChanges: {
        HOT_CUE_E: { active: true },
      },
    },
    {
      id: 'step-3',
      title: 'Cancel the Loop, Keep the Hot Cue',
      instruction:
        'Press LOOP RELOOP / EXIT. The currently-playing loop releases and playback continues straight through the track. The HOT CUE E pad stays lit orange — the saved loop on that pad is untouched.',
      details:
        'This is the key trick: cancelling the live loop does not erase the Hot Cue copy. Pressing HOT CUE E later restarts loop playback from the captured loop-in point.',
      highlightControls: ['RELOOP_EXIT'],
      panelStateChanges: {
        FOUR_BEAT_LOOP: { active: false },
        RELOOP_EXIT: { active: true },
      },
    },
    {
      id: 'step-4',
      title: 'Relaunch the Loop from the Hot Cue',
      instruction:
        'Press HOT CUE E again. Playback jumps to the captured loop-in and starts looping with the original length. To exit the loop without erasing the pad, press LOOP RELOOP / EXIT once more.',
      details:
        'Hot Cue loops are a performance shortcut for "I want to drop this same 8-beat phrase three times tonight, perfectly on the grid, with one finger." The loop persists across track reloads because it is stored on the media.',
      highlightControls: ['HOT_CUE_E', 'RELOOP_EXIT'],
      panelStateChanges: {
        RELOOP_EXIT: { active: false },
      },
    },
    {
      id: 'step-5',
      title: 'Load a Hot Cue Bank from BROWSE',
      instruction:
        'Press BROWSE. In the category list, scroll to HOT CUE BANK and press the rotary selector. Select a Hot Cue Bank, then touch it (or press the rotary again) to write its eight Hot Cues onto pads A–H of the loaded track.',
      details:
        'Hot Cue Banks are built in rekordbox — you cannot edit them on the CDJ. They are how you preload a curated set of intro, drop, vocal, and outro launchers in a single press, instead of setting eight pads by hand each set.',
      highlightControls: ['BROWSE_BTN', 'ROTARY_SELECTOR'],
      panelStateChanges: {
        HOT_CUE_E: { active: false },
        BROWSE_BTN: { active: true },
        ROTARY_SELECTOR: { active: true },
      },
    },
    {
      id: 'step-6',
      title: 'Three Ways Call-Up Mode Ends',
      instruction:
        'If you triggered manual call-up with CALL / DELETE (covered in the Hot Cues tutorial), it exits in any of three ways: (1) all the blinking pads have been called, (2) you press CALL / DELETE again, or (3) you load a different track. Knowing these is the difference between "I am still in call-up" and "my next pad press will do something else".',
      details:
        'A common mistake during call-up: press a HOT CUE pad to "set" a new cue while the player is still in call-up mode — instead, you have just locked the existing saved Hot Cue onto that pad. Exit call-up first if you want to set, not call.',
      highlightControls: ['CUE_LOOP_CALL_BACK', 'CUE_LOOP_CALL_FWD'],
      panelStateChanges: {
        BROWSE_BTN: { active: false },
        ROTARY_SELECTOR: { active: false },
      },
    },
    {
      id: 'step-7',
      title: 'Hot Cue Advanced Mastered',
      instruction:
        'You can capture loops to pads, swap a whole bank in from BROWSE, and predict when call-up mode releases. Next: Quantize & Beat Jump add precision triggering and beatgrid-accurate navigation on top of every cue and loop you have set so far.',
      details:
        'Hot Cue loops plus a Hot Cue Bank give you eight pre-mapped launchers with one-press loop-relaunch — the bridge between basic cue work and the compound performance moves covered in Slip Mode and beyond.',
      highlightControls: [],
      panelStateChanges: {},
    },
  ],
};
