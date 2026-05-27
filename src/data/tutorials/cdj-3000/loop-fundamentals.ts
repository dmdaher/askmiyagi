import { Tutorial } from '@/types/tutorial';

export const loopFundamentals: Tutorial = {
  id: 'loop-fundamentals',
  deviceId: 'cdj-3000',
  title: 'Loop Fundamentals',
  description:
    'Create a manual loop with LOOP IN / CUE and LOOP OUT, drop a tempo-locked loop with 4 BEAT / 8 BEAT LOOP, fine-adjust either end of the loop, and exit playback with RELOOP / EXIT.',
  category: 'looping',
  difficulty: 'intermediate',
  estimatedTime: '6 min',
  tags: [
    'loop',
    'manual-loop',
    'auto-loop',
    'beat-loop',
    'loop-in',
    'loop-out',
    'reloop-exit',
    'fine-adjust',
    'intermediate',
  ],
  steps: [
    {
      id: 'step-1',
      title: 'Drop a Loop-In Point',
      instruction:
        'While the track is playing, press LOOP IN / CUE (IN ADJUST) on the beat you want the loop to start. Nothing audible happens yet — the player has only marked the loop-in point and is waiting for the loop-out.',
      details:
        'LOOP IN / CUE is dual-purpose: a single press during playback sets the cue point (covered in the Cue Points tutorial); the same press also arms the loop-in for the next LOOP OUT press. The two roles do not conflict.',
      highlightControls: ['PLAY_PAUSE', 'LOOP_IN_CUE'],
      panelStateChanges: {
        PLAY_PAUSE: { active: true },
        LOOP_IN_CUE: { active: true },
      },
    },
    {
      id: 'step-2',
      title: 'Close the Loop with LOOP OUT',
      instruction:
        'On the beat you want the loop to end, press LOOP OUT (OUT ADJUST). The track immediately jumps back to the loop-in point and starts repeating the chosen section.',
      details:
        'A manual loop can be any length — quarter-beat stutters, two-bar grooves, full eight-bar phrases. The beatgrid is irrelevant for manual loops; what you press is what plays.',
      highlightControls: ['LOOP_OUT'],
      panelStateChanges: {
        LOOP_OUT: { active: true },
      },
    },
    {
      id: 'step-3',
      title: 'Cancel the Loop with RELOOP / EXIT',
      instruction:
        'Press LOOP RELOOP / EXIT once to exit the loop — playback continues straight past the loop-out point as if nothing had happened. Press it a second time to re-enter the same loop from the loop-in.',
      details:
        'RELOOP / EXIT toggles "playing the loop" against "playing through" without erasing the loop-in / loop-out points. You can sit on a loop, drop out for a vocal, then drop back in for the build.',
      highlightControls: ['RELOOP_EXIT'],
      panelStateChanges: {
        LOOP_IN_CUE: { active: false },
        LOOP_OUT: { active: false },
        RELOOP_EXIT: { active: true },
      },
    },
    {
      id: 'step-4',
      title: 'Drop a Tempo-Locked Beat Loop',
      instruction:
        'Cancel any active loop. Now press 4 BEAT LOOP (1/2X) during playback — the player snaps a four-beat loop starting at that exact press. Press 8 BEAT LOOP (2X) instead for an eight-beat phrase loop.',
      details:
        'Auto loops align to the beatgrid, so they always feel "in time" with whatever you are mixing into. They are the safest way to extend a transition: drop a 4 beat, let the EQ ride, then exit when the next track is locked in.',
      highlightControls: ['FOUR_BEAT_LOOP', 'EIGHT_BEAT_LOOP'],
      panelStateChanges: {
        RELOOP_EXIT: { active: false },
        FOUR_BEAT_LOOP: { active: true },
      },
    },
    {
      id: 'step-5',
      title: 'Fine-Adjust the Loop-In Point',
      instruction:
        'While the loop is playing, press LOOP IN / CUE (IN ADJUST). The loop-in point becomes editable. Now turn the jog wheel — or tap SEARCH ◄◄ / SEARCH ►► — to nudge the loop-in earlier or later, one frame at a time. Press LOOP IN / CUE again to confirm.',
      details:
        'If you walk away for ten seconds without touching anything, the adjust mode auto-confirms and normal loop playback resumes. Use this to clean up a slightly-late loop-in without exiting the loop.',
      highlightControls: ['LOOP_IN_CUE', 'JOG_WHEEL', 'SEARCH_BACK', 'SEARCH_FWD'],
      panelStateChanges: {
        FOUR_BEAT_LOOP: { active: false },
        LOOP_IN_CUE: { active: true },
        JOG_WHEEL: { active: true },
      },
    },
    {
      id: 'step-6',
      title: 'Fine-Adjust the Loop-Out Point',
      instruction:
        'Same workflow on the trailing edge: press LOOP OUT (OUT ADJUST) during loop playback, nudge with the jog wheel or SEARCH buttons, then press LOOP OUT again to confirm. The loop length now reflects the new out-point.',
      details:
        'Adjusting OUT shortens or extends the tail; adjusting IN shifts where the loop kicks back. Doing both lets you sculpt a manual loop tighter than any "drop it on the beat" attempt would land on the first try.',
      highlightControls: ['LOOP_OUT', 'JOG_WHEEL'],
      panelStateChanges: {
        LOOP_IN_CUE: { active: false },
        LOOP_OUT: { active: true },
      },
    },
    {
      id: 'step-7',
      title: 'Loop Fundamentals Mastered',
      instruction:
        'You can drop manual and tempo-locked loops, exit and re-enter them, and tighten either end on the fly. Next: Advanced Loop Techniques add Beat Loop selection from the touch display, halving / doubling, and saving loops to media.',
      details:
        'Every later loop feature — Beat Loop, Slip Loop, Hot Cue loop capture — assumes you can already drop and exit a loop cleanly. Practice closing a four-beat loop on the right beat before moving on.',
      highlightControls: [],
      panelStateChanges: {
        LOOP_OUT: { active: false },
        JOG_WHEEL: { active: false },
      },
    },
  ],
};
