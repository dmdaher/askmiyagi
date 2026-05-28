import { Tutorial } from '@/types/tutorial';

export const phaseMeterAndVisualDiagnostics: Tutorial = {
  id: 'phase-meter-and-visual-diagnostics',
  deviceId: 'cdj-3000',
  title: 'Phase Meter & Visual Sync Diagnostics',
  description:
    'Learn to read the upper-display Phase Meter, switch between WAVEFORM and PHASE METER views, choose waveform color modes (3BAND vs SINGLE), and use HOT CUE colors as visual landmarks. These are the diagnostic skills that let you see sync drift BEFORE you hear it.',
  category: 'performance',
  difficulty: 'intermediate',
  estimatedTime: '7 min',
  addedDate: '2026-05-28',
  tags: ['phase-meter', 'waveform', 'diagnostics', 'visual-sync', 'color-modes', 'hot-cue-color'],
  steps: [
    {
      id: 'step-1',
      title: 'Why a Phase Meter Matters',
      instruction:
        'When you sync two decks with BEAT SYNC, the tempo is locked but the PHASE — the alignment of beat ONE on each deck — may not be. A track can be at the same BPM but starting on beat 3 of the bar instead of beat 1. The Phase Meter is the visual indicator that catches this 2 seconds faster than your ears.',
      details:
        'Live integration: by the time your ears notice a phase mismatch, the dance floor has already heard it. The Phase Meter shows the misalignment as a visible offset, letting you correct (jog nudge, or re-engage SYNC) before the next beat lands. This is the diagnostic skill that separates "synced" from "actually in time".',
      highlightControls: ['TOUCH_DISPLAY'],
      panelStateChanges: {},
    },
    {
      id: 'step-2',
      title: 'Toggle to PHASE METER View',
      instruction:
        'Press SHORTCUT. The shortcut screen appears on the touch display. Touch "WAVEFORM / PHASE METER" — the selection toggles between WAVEFORM (default, big scrolling waveform) and PHASE METER (compact phase alignment indicator). Pick PHASE METER.',
      details:
        'The SHORTCUT screen is your fast-access settings menu — covered in detail in shortcut-and-my-settings. The WAVEFORM/PHASE METER toggle lives here because it\'s a per-set preference: live DJs running multiple decks usually want PHASE METER; bedroom practice usually wants WAVEFORM. There\'s no wrong answer, only context-dependent ones.',
      highlightControls: ['SHORTCUT', 'TOUCH_DISPLAY'],
      panelStateChanges: {
        SHORTCUT: { active: true },
      },
    },
    {
      id: 'step-3',
      title: 'Read the Phase Meter Display',
      instruction:
        'With Phase Meter active and two decks synced, look at the top of the touch display. A horizontal indicator with a center mark and side bars shows phase alignment. When this deck and the master deck are phase-locked, the bars sit centered. When phase drifts, the bars shift left or right of center.',
      details:
        'The amount of bar offset corresponds to how many milliseconds you\'re ahead/behind the master beat. A small visible offset = a small audible offset. Most pros learn to correct as soon as the bar leaves center — not when it\'s already pushed to one side. This is purely a visual-feedback skill — practice catches it.',
      highlightControls: ['TOUCH_DISPLAY'],
      panelStateChanges: {},
      tipText:
        'In Phase Meter view, you give up the big scrolling waveform but gain microsecond-level sync feedback. This trade is why pros keep PHASE METER as their default and only switch to WAVEFORM when prepping a track they don\'t know.',
    },
    {
      id: 'step-4',
      title: 'Correct Phase Drift with the Jog Wheel',
      instruction:
        'When the Phase Meter shows drift, give the jog wheel a tiny nudge — clockwise to push this deck FORWARD in time, counter-clockwise to pull it BACK. The Phase Meter responds instantly. Stop nudging when the bars return to center.',
      details:
        'The jog wheel\'s default behavior in CDJ mode (covered in jog-wheel-techniques) is exactly this: micro-adjustments to phase. The Phase Meter makes the jog nudge a CLOSED LOOP — you see the correction, see the result, adjust if needed. Without the visual feedback, you\'re guessing.',
      highlightControls: ['JOG_WHEEL', 'TOUCH_DISPLAY'],
      panelStateChanges: {
        JOG_WHEEL: { active: true },
      },
    },
    {
      id: 'step-5',
      title: 'Switch Back to WAVEFORM with Color Mode',
      instruction:
        'Press SHORTCUT again. Toggle WAVEFORM / PHASE METER back to WAVEFORM. Now touch WAVEFORM COLOR — toggle between 3BAND (kicks blue, mids green, hats red) and SINGLE (one color per deck). Pick 3BAND.',
      details:
        'Color mode is per-set preference. 3BAND tells you what frequency content is where — instantly readable: a track starts with hats only? Top of the waveform glows red. Drop coming? Blue thickness builds. SINGLE is cleaner for less-distracting visuals but loses the frequency cues. New DJs learn faster with 3BAND.',
      highlightControls: ['SHORTCUT', 'TOUCH_DISPLAY'],
      panelStateChanges: {
        SHORTCUT: { active: true },
      },
    },
    {
      id: 'step-6',
      title: 'HOT CUE Colors as Landmarks',
      instruction:
        'On the waveform, your hot cues appear as vertical colored markers. If you set HOT CUE COLOR to ON in UTILITY (see utility-settings), each hot cue uses the color you assigned in rekordbox — drop=red, breakdown=blue, build=orange. Glance at the waveform: you see the structural map of the track without thinking.',
      details:
        'This is why pros pre-color their hot cues during prep. In a 90-minute set, you\'re glancing at 8 waveforms per song. Color-coded landmarks reduce cognitive load — you don\'t have to remember which pad is the drop, you SEE the red line approaching the playhead. With HOT CUE COLOR OFF, all cues are the default green and you lose this visual map.',
      highlightControls: ['HOT_CUE_A', 'HOT_CUE_B', 'HOT_CUE_C', 'TOUCH_DISPLAY'],
      panelStateChanges: {
        HOT_CUE_A: { active: false, ledOn: true },
        HOT_CUE_B: { active: false, ledOn: true },
        HOT_CUE_C: { active: false, ledOn: true },
      },
    },
    {
      id: 'step-7',
      title: 'Diagnostic Workflow Summary',
      instruction:
        'Your visual diagnostic toolkit: PHASE METER for live phase-lock confirmation, WAVEFORM (3BAND) for frequency-aware track preview, HOT CUE colors for structural landmarks. Press SHORTCUT one more time and close it — the settings are saved and persist across the set.',
      details:
        'The complete diagnostic loop: SYNC engages tempo lock → PHASE METER confirms phase lock → JOG WHEEL corrects drift → WAVEFORM colors preview what\'s coming → HOT CUE colors mark structural exits. Mastering this loop is what makes a CDJ-3000 feel like an instrument instead of a track player.',
      highlightControls: ['SHORTCUT'],
      panelStateChanges: {
        SHORTCUT: { active: false },
      },
    },
  ],
};
