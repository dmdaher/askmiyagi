import { Tutorial } from '@/types/tutorial';

export const hotCues: Tutorial = {
  id: 'hot-cues',
  deviceId: 'cdj-3000',
  title: 'Hot Cues',
  description:
    'Set up to eight Hot Cues per track with HOT CUE A–H, launch them with one press, delete one with CALL/DELETE + HOT CUE, and decide whether tracks load their Hot Cues automatically.',
  category: 'cueing',
  difficulty: 'intermediate',
  estimatedTime: '6 min',
  tags: [
    'hot-cue',
    'hot-cue-a',
    'hot-cue-h',
    'cue',
    'cue-loop-call',
    'auto-load',
    'shortcut',
    'utility',
    'intermediate',
  ],
  steps: [
    {
      id: 'step-1',
      title: 'Set a Hot Cue on Button A',
      instruction:
        'During playback or pause, press HOT CUE A at the exact moment you want the marker. The button lights up — green by default for a cue point — and the position is now bound to that pad.',
      details:
        'Each Hot Cue button (A–H) stores one independent marker, so you can keep eight launchers per track. The button can capture either a single cue point or, if you press it during loop playback, a whole loop (covered in the Hot Cue Advanced tutorial).',
      highlightControls: ['PLAY_PAUSE', 'HOT_CUE_A'],
      panelStateChanges: {
        PLAY_PAUSE: { active: true },
        HOT_CUE_A: { active: true },
      },
    },
    {
      id: 'step-2',
      title: 'Fill Out the Rest of the Bank',
      instruction:
        'Continue setting Hot Cues at the breakdown, the drop, the vocal entry — press HOT CUE B, C, D, and so on at each landmark. Buttons that hold a cue point light green; the colour reflects what the button stores.',
      details:
        'You cannot overwrite a populated Hot Cue by pressing it again — that just plays it. To replace a Hot Cue with a new position, delete it first (next step), then set a new one on the freed button.',
      highlightControls: ['HOT_CUE_B', 'HOT_CUE_C', 'HOT_CUE_D'],
      panelStateChanges: {
        HOT_CUE_B: { active: true },
        HOT_CUE_C: { active: true },
        HOT_CUE_D: { active: true },
      },
    },
    {
      id: 'step-3',
      title: 'Play From a Hot Cue',
      instruction:
        'Press any populated HOT CUE button. Playback jumps to that position and starts immediately, no PLAY/PAUSE press required. This is the "instant relaunch" you came to a CDJ for.',
      details:
        'If the Hot Cue holds a loop instead of a cue point, playback starts looping at that point — press LOOP RELOOP / EXIT to cancel the loop and keep playing through.',
      highlightControls: ['HOT_CUE_B'],
      panelStateChanges: {},
    },
    {
      id: 'step-4',
      title: 'Delete a Hot Cue',
      instruction:
        'Hold CALL / DELETE and, while still holding it, press the HOT CUE button you want to clear (e.g. HOT CUE D). The light on that pad goes out and the marker is removed.',
      details:
        'Only the Hot Cue you press is deleted — the others on the same track are untouched. The CALL / DELETE button shares hardware with CUE / LOOP CALL ◄ ►; here you use the same buttons in their "delete" role.',
      highlightControls: ['CUE_LOOP_CALL_BACK', 'CUE_LOOP_CALL_FWD', 'HOT_CUE_D'],
      panelStateChanges: {
        HOT_CUE_D: { active: false },
      },
    },
    {
      id: 'step-5',
      title: 'Toggle Automatic Hot Cue Loading',
      instruction:
        'Hot Cues are stored on the media, like saved cue points. To make them appear automatically every time a track loads, press SHORTCUT (or hold MENU / UTILITY) and set HOT CUE AUTO LOAD to ON. The display shows "A. HOT CUE" in red when auto-load is on for every track.',
      details:
        'Choose ON to auto-load every track, "rekordbox SETTING" to only auto-load tracks the artist (you, in rekordbox) explicitly flagged for it, or OFF to load all tracks blank and call up Hot Cues by hand.',
      highlightControls: ['SHORTCUT', 'MENU_UTILITY'],
      panelStateChanges: {
        SHORTCUT: { active: true },
      },
    },
    {
      id: 'step-6',
      title: 'Manually Call Up Hot Cues',
      instruction:
        'With HOT CUE AUTO LOAD set to OFF, load a track that has stored Hot Cues. Press CALL / DELETE — the HOT CUE buttons that hold a Hot Cue start blinking. Press any blinking pad to lock its Hot Cue onto that button; the blinking stops and the colour goes solid.',
      details:
        'Call-up mode ends when all Hot Cues are called, or when you press CALL / DELETE again, or when you load a different track. Use it to cherry-pick only the markers you actually want loaded for the next mix.',
      highlightControls: ['CUE_LOOP_CALL_BACK', 'CUE_LOOP_CALL_FWD', 'HOT_CUE_A'],
      panelStateChanges: {
        SHORTCUT: { active: false },
        CUE_LOOP_CALL_FWD: { active: true },
      },
    },
    {
      id: 'step-7',
      title: 'Hot Cues Mastered',
      instruction:
        'You can set, play, delete, and selectively call up to eight markers per track, and choose whether the CDJ auto-loads them. Next: Hot Cue Advanced shows how Hot Cues capture whole loops and how the Hot Cue Bank loads pre-made sets from rekordbox.',
      details:
        'Hot Cues sit at the centre of most pro DJ workflows — eight pads is more performance surface than the average mixer effects unit, and they survive across every CDJ that reads your media.',
      highlightControls: [],
      panelStateChanges: {
        CUE_LOOP_CALL_FWD: { active: false },
        HOT_CUE_A: { active: false },
        HOT_CUE_B: { active: false },
        HOT_CUE_C: { active: false },
      },
    },
  ],
};
