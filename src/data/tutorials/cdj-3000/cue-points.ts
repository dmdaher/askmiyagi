import { Tutorial } from '@/types/tutorial';

export const cuePoints: Tutorial = {
  id: 'cue-points',
  deviceId: 'cdj-3000',
  title: 'Cue Points',
  description:
    'Set a cue point during pause or on the fly, fine-adjust the position, jump straight to the cue, sample it by holding CUE, and use Auto Cue to skip silence at the start of every track.',
  category: 'cueing',
  difficulty: 'intermediate',
  estimatedTime: '7 min',
  tags: [
    'cue',
    'cue-point',
    'loop-in',
    'auto-cue',
    'cue-sampler',
    'fine-adjust',
    'time-mode',
    'intermediate',
  ],
  steps: [
    {
      id: 'step-1',
      title: 'Set a Cue Point During Pause',
      instruction:
        'Pause the track at the position you want to mark. Press the CUE button — the position becomes the current cue point. A small marker appears on both the overall and enlarged waveforms at that position.',
      details:
        'Setting a new cue point during pause overwrites the previously set cue point. Use this for the classic "set a cue then start the track from it" workflow.',
      highlightControls: ['PLAY_PAUSE', 'CUE_BTN'],
      panelStateChanges: {
        PLAY_PAUSE: { active: false },
        CUE_BTN: { active: true },
      },
    },
    {
      id: 'step-2',
      title: 'Fine-Adjust the Pause Position',
      instruction:
        'Before pressing CUE, fine-tune where the cue will land. While paused, press SEARCH ◄◄ or SEARCH ►► to nudge one frame, or turn the jog wheel for frame-by-frame scrubbing. Now press CUE to lock the cue point at the new spot.',
      details:
        'Frame Search only works while paused — once playback resumes, the jog reverts to scratch / pitch-bend and SEARCH reverts to fast-forward. Combine the overall waveform touch (jump to area) with jog frame-search (final placement) for fast, accurate cue setting.',
      highlightControls: ['SEARCH_BACK', 'SEARCH_FWD', 'JOG_WHEEL'],
      panelStateChanges: {
        CUE_BTN: { active: false },
        JOG_WHEEL: { active: true },
      },
    },
    {
      id: 'step-3',
      title: 'Set a Cue Point During Playback',
      instruction:
        'During live playback, press LOOP IN / CUE (IN ADJUST) at the exact moment you want the cue. The cue point is set on-the-fly without interrupting playback. This is the way to drop a quick reference marker mid-mix.',
      details:
        'LOOP IN / CUE doubles as the LOOP IN button when you actually want to start a loop — pressing it without a matching LOOP OUT just sets the cue. The previously set cue point is overwritten.',
      highlightControls: ['LOOP_IN_CUE'],
      panelStateChanges: {
        JOG_WHEEL: { active: false },
        LOOP_IN_CUE: { active: true },
      },
    },
    {
      id: 'step-4',
      title: 'Jump to the Cue',
      instruction:
        'During playback, press CUE. The deck instantly jumps back to the cue point and pauses there, ready to launch on PLAY/PAUSE. This is the "back cue" workflow that lets you re-arm the next drop without lifting your hand.',
      details:
        'CUE always returns to the most recent cue point. To park on a different marker, use the saved Hot Cue or Cue / Loop Call buttons (covered in later tutorials).',
      highlightControls: ['CUE_BTN'],
      panelStateChanges: {
        LOOP_IN_CUE: { active: false },
        CUE_BTN: { active: true },
        PLAY_PAUSE: { active: false },
      },
    },
    {
      id: 'step-5',
      title: 'Cue Point Sampler — Hold CUE',
      instruction:
        'With the deck paused at a cue point, press and HOLD the CUE button. Playback runs as long as you hold the button and snaps back to the cue the instant you release. This is the "Cue Point Sampler" — perfect for triggering short stabs or previewing the drop.',
      details:
        'Hold for a quarter-second peek, a couple of bars for a fill, or longer for a sustained sample. Releasing always returns to the cue, so you can spam it rhythmically without losing your starting position.',
      highlightControls: ['CUE_BTN'],
      panelStateChanges: {},
    },
    {
      id: 'step-6',
      title: 'Turn On Auto Cue',
      instruction:
        'Press and HOLD the TIME MODE / AUTO CUE button. The AUTO CUE indicator on the Waveform screen lights up. Now, whenever you load a track, the cue point is automatically placed just before the first sound — silence at the top is skipped.',
      details:
        'A short tap on the same button only flips elapsed / remaining time. The long-hold is the toggle. Auto Cue persists across power cycles — once it is on, every freshly loaded track is pre-cued.',
      highlightControls: ['TIME_MODE_AUTO_CUE'],
      panelStateChanges: {
        CUE_BTN: { active: false },
        TIME_MODE_AUTO_CUE: { active: true },
      },
    },
    {
      id: 'step-7',
      title: 'Tune the Auto Cue Level',
      instruction:
        'The threshold for "silence" is configurable. Press and hold MENU / UTILITY, then go to DJ SETTING → AUTO CUE LEVEL. Choose a level (e.g., −36 dB, −42 dB, −48 dB, or a memorised cue) — anything quieter than the chosen level is treated as silence and skipped past on load.',
      details:
        'A higher (less negative) level skips more head noise; a lower level preserves quiet intros. Pick MEMORY to make Auto Cue snap to the previously saved cue point of each track instead of an audio threshold.',
      highlightControls: ['MENU_UTILITY'],
      panelStateChanges: {
        TIME_MODE_AUTO_CUE: { active: false },
        MENU_UTILITY: { active: true },
      },
    },
    {
      id: 'step-8',
      title: 'Cueing Mastered',
      instruction:
        'You can drop, fine-adjust, jump to, and sample cue points, and Auto Cue handles the leading silence for you. Next, the Saving & Recalling Cue Points tutorial pushes these markers to your media so they survive across sessions.',
      details:
        'Cue points are the backbone of every later workflow — Hot Cues, Beatgrid Adjustment, and Slip all assume you already trust the cue point you have set.',
      highlightControls: [],
      panelStateChanges: {
        MENU_UTILITY: { active: false },
      },
    },
  ],
};
