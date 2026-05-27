import { Tutorial } from '@/types/tutorial';

export const savingAndRecallingCuePoints: Tutorial = {
  id: 'saving-and-recalling-cue-points',
  deviceId: 'cdj-3000',
  title: 'Saving & Recalling Cue Points',
  description:
    'Save the current cue point to the loaded media with MEMORY, walk through saved markers with CUE / LOOP CALL ◄ ►, and remove the one you no longer want with DELETE.',
  category: 'cueing',
  difficulty: 'intermediate',
  estimatedTime: '4 min',
  tags: [
    'cue',
    'memory',
    'cue-loop-call',
    'delete',
    'saved-cue',
    'persistence',
    'intermediate',
  ],
  steps: [
    {
      id: 'step-1',
      title: 'Set the Cue Point You Want to Save',
      instruction:
        'Pause the track on the position you want to remember, then press CUE to lock that position as the current cue point. A small triangle marker appears on the overall waveform at the cue location.',
      details:
        'You can save any cue point you set via CUE (during pause) or via LOOP IN / CUE (during playback). Saving only persists the position that is currently the active cue — set it first, save it second.',
      highlightControls: ['PLAY_PAUSE', 'CUE_BTN'],
      panelStateChanges: {
        PLAY_PAUSE: { active: false },
        CUE_BTN: { active: true },
      },
    },
    {
      id: 'step-2',
      title: 'Save the Cue with MEMORY',
      instruction:
        'With the cue point set, press the MEMORY button. The cue is written to the source device (SD or USB) and a small marker bar appears above the overall waveform to show the cue is now stored.',
      details:
        'Each press of MEMORY saves whatever is currently set — the current cue, or, once you learn loops, the current loop. The track can hold many saved cues and loops side-by-side; only the most recent one is the "active" CUE.',
      highlightControls: ['MEMORY'],
      panelStateChanges: {
        CUE_BTN: { active: false },
        MEMORY: { active: true },
      },
    },
    {
      id: 'step-3',
      title: 'Walk Through Saved Cues with CUE / LOOP CALL',
      instruction:
        'Load any track that already has saved cue points (the same track later in the set, or a track you saved cues on in a previous session). Press CUE / LOOP CALL ► to step forward through the saved markers, or CUE / LOOP CALL ◄ to step back. Each press lands on the next saved cue point.',
      details:
        'Saved cues live on the source media, not on the player — pull the USB stick out, plug it into the next CDJ, and the same markers come back. This is the durable, cross-session twin of CUE-button-only "live" cue points.',
      highlightControls: ['CUE_LOOP_CALL_BACK', 'CUE_LOOP_CALL_FWD'],
      panelStateChanges: {
        MEMORY: { active: false },
        CUE_LOOP_CALL_FWD: { active: true },
      },
    },
    {
      id: 'step-4',
      title: 'Delete a Saved Cue',
      instruction:
        'Use CUE / LOOP CALL ◄ ► to land on the saved cue you no longer want, then press the DELETE button. The marker is removed from the track and the next CALL ► step skips past it.',
      details:
        'DELETE only removes the cue that is currently called up — it never wipes the whole list. To clear several, call each one up in turn and press DELETE each time.',
      highlightControls: ['DELETE'],
      panelStateChanges: {
        CUE_LOOP_CALL_FWD: { active: false },
        DELETE: { active: true },
      },
    },
    {
      id: 'step-5',
      title: 'Saved Cues Mastered',
      instruction:
        'You can persist any cue point to the media, recall it from any CDJ that reads that media, and clean up the markers you have outgrown. Next: Hot Cues, which give you eight one-press launchers for the cues you reach for most.',
      details:
        'MEMORY and CUE / LOOP CALL are also the foundation for saving loops — every workflow you learn from here that says "save" reuses this exact same MEMORY button.',
      highlightControls: [],
      panelStateChanges: {
        DELETE: { active: false },
      },
    },
  ],
};
