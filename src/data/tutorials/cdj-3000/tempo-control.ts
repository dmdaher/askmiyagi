import { Tutorial } from '@/types/tutorial';

export const tempoControl: Tutorial = {
  id: 'tempo-control',
  deviceId: 'cdj-3000',
  title: 'Tempo Control',
  description:
    'Adjust playback speed with the TEMPO slider, cycle through ±6 / ±10 / ±16 / WIDE ranges, snap back to original speed with TEMPO RESET, and lock the pitch with MASTER TEMPO.',
  category: 'playback',
  difficulty: 'intermediate',
  estimatedTime: '6 min',
  tags: [
    'tempo',
    'tempo-slider',
    'tempo-range',
    'tempo-reset',
    'master-tempo',
    'pitch',
    'bpm',
    'time-mode',
    'intermediate',
  ],
  steps: [
    {
      id: 'step-1',
      title: 'Move the TEMPO Slider',
      instruction:
        'With a track playing, slide the TEMPO fader on the right of the deck. Push it toward + to speed the track up and toward − to slow it down. The TEMPO read-out on the touch display updates live in percent, and the BPM read-out updates to the new tempo.',
      details:
        'TEMPO scales the entire track — speed and pitch move together unless Master Tempo is on. The fader is the primary tool for beatmatching by ear.',
      highlightControls: ['TEMPO_SLIDER'],
      panelStateChanges: {
        TEMPO_SLIDER: { active: true },
      },
    },
    {
      id: 'step-2',
      title: 'Cycle the Tempo Range',
      instruction:
        'Press the TEMPO ±6/±10/±16/WIDE button to cycle the slider range. Each press steps through ±6% (0.02% per tick) → ±10% (0.05%) → ±16% (0.05%) → WIDE (0.5%) and back. The currently-selected range shows beside the TEMPO read-out.',
      details:
        'Narrow ranges give finer resolution per millimetre of slider travel — start at ±6% for delicate beatmatching, switch to WIDE only when you actually need ±100% (the track stops at −100%).',
      highlightControls: ['TEMPO_RANGE'],
      panelStateChanges: {
        TEMPO_RANGE: { active: true },
      },
    },
    {
      id: 'step-3',
      title: 'Tempo Reset',
      instruction:
        'Press the TEMPO RESET button. Playback snaps back to the original track speed regardless of where the slider is parked, and the TEMPO RESET indicator lights up.',
      details:
        'TEMPO RESET is the quickest way to confirm you have not drifted off the original BPM during a long mix. Press it again or move the slider to release the reset and return to slider-driven tempo.',
      highlightControls: ['TEMPO_RESET'],
      panelStateChanges: {
        TEMPO_RANGE: { active: false },
        TEMPO_RESET: { active: true },
        TEMPO_RESET_INDICATOR: { active: true, ledOn: true },
      },
    },
    {
      id: 'step-4',
      title: 'Master Tempo (Pitch Lock)',
      instruction:
        'Press MASTER TEMPO. The button lights up and the MT badge appears on the Waveform screen. Now slide the TEMPO fader — the playback speed changes, but the pitch (key) stays locked at the original.',
      details:
        'Master Tempo is essential when sliding tempo across genres or harmonically mixing — vocals stay in their original key even as you swing 5% slower. Press MASTER TEMPO again to turn it off.',
      highlightControls: ['MASTER_TEMPO'],
      panelStateChanges: {
        TEMPO_RESET: { active: false },
        TEMPO_RESET_INDICATOR: { active: false, ledOn: false },
        MASTER_TEMPO: { active: true },
      },
    },
    {
      id: 'step-5',
      title: 'Read the BPM and Tempo Values',
      instruction:
        'On the Waveform screen, the central read-outs show TEMPO (the adjustment in percent, e.g. +3.20%) and BPM (the live tempo of the playing track). Compare these to a second deck to beatmatch by the numbers.',
      details:
        'The CDJ-measured BPM may differ slightly from values shown on a DJ mixer because they use different measurement methods. Trust the CDJ value while you are mixing on the CDJ.',
      highlightControls: ['TOUCH_DISPLAY'],
      panelStateChanges: {},
    },
    {
      id: 'step-6',
      title: 'Swap Time Display While You Mix',
      instruction:
        'Press TIME MODE / AUTO CUE to flip the time read-out between elapsed and remaining time. Remaining time (REMAIN badge) is the more useful view while planning a transition — you can see exactly how long is left before you need to bring in the next track.',
      details:
        'Press-and-hold TIME MODE / AUTO CUE toggles Auto Cue itself — be deliberate with which gesture you use. A quick tap = switch display; a long hold = Auto Cue on/off.',
      highlightControls: ['TIME_MODE_AUTO_CUE'],
      panelStateChanges: {
        MASTER_TEMPO: { active: false },
        TIME_MODE_AUTO_CUE: { active: true },
      },
    },
    {
      id: 'step-7',
      title: 'Tempo Mastered',
      instruction:
        'You can slide tempo, cycle ranges, reset to original, lock the pitch with Master Tempo, read live BPM, and flip time modes. Next, the Jog Wheel Techniques tutorial covers pitch-bending and scratching to fine-tune the tempo work you just did.',
      details:
        'Beat Sync (a later tutorial) automates a lot of this, but the slider remains the most musical and most responsive way to ride tempo by hand. Keep practising slider beatmatches even after Sync is in your toolbox.',
      highlightControls: [],
      panelStateChanges: {
        TIME_MODE_AUTO_CUE: { active: false },
        TEMPO_SLIDER: { active: false },
      },
    },
  ],
};
