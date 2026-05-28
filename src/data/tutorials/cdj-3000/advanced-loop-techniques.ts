import { Tutorial } from '@/types/tutorial';

export const advancedLoopTechniques: Tutorial = {
  id: 'advanced-loop-techniques',
  deviceId: 'cdj-3000',
  title: 'Advanced Loop Techniques',
  description:
    'Select any beat-loop length from the touch display, halve or double an active loop on the fly, let rekordbox-marked Active Loops trigger themselves, understand the safety net of Emergency Loop, and save / recall / delete loops to your media.',
  category: 'looping',
  difficulty: 'advanced',
  estimatedTime: '8 min',
  tags: [
    'loop',
    'beat-loop',
    'active-loop',
    'emergency-loop',
    'saved-loop',
    'memory',
    'cue-loop-call',
    'advanced',
  ],
  steps: [
    {
      id: 'step-1',
      title: 'Open BEAT LOOP on the Touch Display',
      instruction:
        'On the Waveform screen, touch BEAT LOOP. A row of buttons appears across the bottom — 1/4, 1/2, 1, 2, 4, 8, 16, 32 beats. Until you pick one, no loop is active.',
      details:
        'BEAT LOOP differs from the dedicated 4 BEAT / 8 BEAT hardware buttons: instead of fixed lengths, it lets you choose any tempo-locked length in the supported range, which is the only way to drop a 1/4-beat stutter or a 32-beat phrase from the front panel.',
      highlightControls: ['TOUCH_DISPLAY'],
      panelStateChanges: {
        PLAY_PAUSE: { active: true },
        TOUCH_DISPLAY: { active: true },
      },
    },
    {
      id: 'step-2',
      title: 'Pick a Beat Length to Drop the Loop',
      instruction:
        'Touch the number of beats you want — say 16. The player immediately drops a 16-beat loop starting at the exact moment of the touch and loop playback begins. The selected length stays highlighted on screen.',
      details:
        'The loop is beatgrid-aligned: if you press just before beat 1, the loop snaps to the next bar boundary so it always feels musical. Touch a different number to retrigger the loop with a new length without exiting first.',
      highlightControls: ['TOUCH_DISPLAY'],
      panelStateChanges: {},
    },
    {
      id: 'step-3',
      title: 'Halve the Loop Length with 1/2X',
      instruction:
        'While the loop is playing, press 4 BEAT LOOP (1/2X) — or press CUE / LOOP CALL ◄ — to cut the loop length in half. Each subsequent press halves again: 16 → 8 → 4 → 2 → 1 → 1/2 beats.',
      details:
        'Halving is the classic build-up move: stack two or three presses against a snare roll for an instant stutter ramp into the drop. Both controls do the same thing — pick whichever fits your hand position.',
      highlightControls: ['FOUR_BEAT_LOOP', 'CUE_LOOP_CALL_BACK'],
      panelStateChanges: {
        FOUR_BEAT_LOOP: { active: true },
      },
    },
    {
      id: 'step-4',
      title: 'Double the Loop Length with 2X',
      instruction:
        'Press 8 BEAT LOOP (2X) — or press CUE / LOOP CALL ► — to double the active loop length. Repeated presses keep doubling, up to the player\'s maximum loop size.',
      details:
        'Doubling lets you "zoom out" of a tight stutter without breaking phase — a 1-beat loop becomes 2, then 4, then 8 beats, each one still locked to the grid. Pair with halving to climb up and back down a loop ladder.',
      highlightControls: ['EIGHT_BEAT_LOOP', 'CUE_LOOP_CALL_FWD'],
      panelStateChanges: {
        FOUR_BEAT_LOOP: { active: false },
        EIGHT_BEAT_LOOP: { active: true },
      },
    },
    {
      id: 'step-5',
      title: 'Save the Loop to the Media',
      instruction:
        'With the loop still playing, press MEMORY. The current loop-in and loop-out are written to the track on the source device (SD or USB) as a saved loop. The touch display flashes a confirmation and a marker appears on the waveform.',
      details:
        'Saved loops belong to the track, not the player — load the same track on any CDJ that reads your media and the saved loop is there. Use this to bank intro and outro loops the audience will not notice you using.',
      highlightControls: ['MEMORY'],
      panelStateChanges: {
        EIGHT_BEAT_LOOP: { active: false },
        MEMORY: { active: true },
      },
    },
    {
      id: 'step-6',
      title: 'Recall a Saved Loop with CUE / LOOP CALL',
      instruction:
        'After loading a track that has a saved loop, press CUE / LOOP CALL ◄ or CUE / LOOP CALL ► to step through saved cue points and loops on the timeline. When the saved loop is the active selection, the player jumps to it and starts looping immediately.',
      details:
        'The same two arrow buttons step through both cue points and saved loops — the touch display shows what the next call will be. CALL is one-press; you do not need to hold anything.',
      highlightControls: ['CUE_LOOP_CALL_BACK', 'CUE_LOOP_CALL_FWD'],
      panelStateChanges: {
        MEMORY: { active: false },
        CUE_LOOP_CALL_FWD: { active: true },
      },
    },
    {
      id: 'step-7',
      title: 'Delete the Saved Loop with DELETE',
      instruction:
        'While the saved loop is the active call, press DELETE. The loop is removed from the track. The touch display confirms the deletion and the next CALL press will move to whatever saved point follows.',
      details:
        'DELETE only erases the saved (on-media) copy — it does not stop the loop currently playing. To exit the playing loop after deleting, press LOOP RELOOP / EXIT as usual.',
      highlightControls: ['DELETE', 'RELOOP_EXIT'],
      panelStateChanges: {
        CUE_LOOP_CALL_FWD: { active: false },
      },
    },
    {
      id: 'step-8',
      title: 'Active Loop and Emergency Loop',
      instruction:
        'Two automatic loops to know about: (1) Active Loop — a saved loop tagged in rekordbox auto-triggers the first time playback crosses its loop-in point, no button press required. (2) Emergency Loop — if the player reaches the end of a track with no next track queued, it auto-loops the last beats so the dance floor never hears silence. Load a new track to cancel.',
      details:
        'Active Loops belong to the rekordbox workflow — set them in the rekordbox software, not on the CDJ. Emergency Loop is a safety net you cannot DJ on top of: it will not respond to your inputs until you load a new track.',
      highlightControls: [],
      panelStateChanges: {},
    },
    {
      id: 'step-9',
      title: 'Advanced Loops Mastered',
      instruction:
        'You can pick any beat-loop length from the display, halve and double live, save / recall / delete loops to your media, and recognise the two automatic loop modes. Next: Hot Cue Advanced shows how to capture an active loop straight to a HOT CUE pad for one-press relaunch.',
      details:
        'Every later loop-aware feature — Slip Loop, Loop Move via Beat Jump, Hot Cue loop capture — assumes you can already drop, resize, and exit any tempo-locked loop. Practice the halve / double ladder against a kick before moving on.',
      highlightControls: [],
      panelStateChanges: {
        TOUCH_DISPLAY: { active: false },
      },
    },
  ],
};
