import { Tutorial } from '@/types/tutorial';

export const waveformAndJogDisplays: Tutorial = {
  id: 'waveform-and-jog-displays',
  deviceId: 'cdj-3000',
  title: 'The Waveform & Jog Displays',
  description:
    'Read every indicator on the Waveform screen and the centre jog display — track info, time, status indicators, the overall and enlarged waveforms, Zoom vs Grid Adjust, and the cue / loop / Hot Cue markers around the jog.',
  category: 'display',
  difficulty: 'intermediate',
  estimatedTime: '8 min',
  tags: [
    'waveform',
    'jog-display',
    'time-display',
    'auto-cue',
    'a-hot-cue',
    'zoom',
    'grid-adjust',
    'overall-waveform',
    'intermediate',
  ],
  steps: [
    {
      id: 'step-1',
      title: 'Anatomy of the Waveform Screen',
      instruction:
        'With a track loaded, look at the upper touch display — the Waveform screen. The top row carries the device icon (SD / USB / LINK / PC) plus the track title, time, BPM, and key of the loaded track. A small "i" badge expands to detailed track info.',
      details:
        'Everything on this screen reads from the rekordbox analysis baked into the track. If a track is not analysed, the enlarged waveform and grid still draw, but Hot Cue markers, key, and beat positions will not appear.',
      highlightControls: ['TOUCH_DISPLAY'],
      panelStateChanges: {},
    },
    {
      id: 'step-2',
      title: 'Time Display & SINGLE / CONTINUE',
      instruction:
        'In the middle of the screen the time display shows minutes : seconds . msec. Press TIME MODE / AUTO CUE to flip between elapsed time and remaining time — the REMAIN label lights when remaining is showing. To the right of the time, SINGLE or CONTINUE tells you how the deck behaves when the current track ends.',
      details:
        'SINGLE / CONTINUE is set under UTILITY → DJ SETTING → PLAY MODE. SINGLE stops at the end of the loaded track; CONTINUE auto-advances to the next track in the list.',
      highlightControls: ['TIME_MODE_AUTO_CUE'],
      panelStateChanges: {
        TIME_MODE_AUTO_CUE: { active: true },
      },
    },
    {
      id: 'step-3',
      title: 'Status Badges — A.HOT CUE, AUTO CUE, MT, MASTER / SYNC',
      instruction:
        'Around the time and BPM read-outs you will see small badges that tell you which features are armed. A.HOT CUE lights when HOT CUE AUTO LOAD is on. AUTO CUE lights when Auto Cue is on. MT lights when Master Tempo is on. MASTER or SYNC lights when this deck is the sync master or following one.',
      details:
        'These badges are the fastest way to confirm what the deck will do on the next press of CUE, PLAY/PAUSE, or BEAT SYNC. Train your eye to glance here before any drop.',
      highlightControls: ['TOUCH_DISPLAY'],
      panelStateChanges: {
        TIME_MODE_AUTO_CUE: { active: false },
      },
    },
    {
      id: 'step-4',
      title: 'The Overall Waveform',
      instruction:
        'The thin strip near the top of the screen is the overall waveform — the entire track at a glance, with coloured ticks for cue points, loops, and Hot Cues. Touch any point on it during pause to jump there; touch during playback to see that section as an enlarged preview without moving playback.',
      details:
        'Change the colour scheme of both waveforms in SHORTCUT → WAVEFORM COLOR. Coloured ticks mirror the colours assigned in rekordbox so you can scan a familiar layout at a glance.',
      highlightControls: ['TOUCH_DISPLAY'],
      panelStateChanges: {},
    },
    {
      id: 'step-5',
      title: 'The Enlarged Waveform',
      instruction:
        'The large central waveform shows the area around the current playback position. The triangle pointer is the playhead. Beat-countdown numerals above the waveform count bars and beats to the next saved cue point.',
      details:
        'Touching the overall waveform during playback re-targets the enlarged waveform to the touched point so you can scout an upcoming section. Lift your finger to snap back to the live playhead.',
      highlightControls: ['TOUCH_DISPLAY'],
      panelStateChanges: {},
    },
    {
      id: 'step-6',
      title: 'Zoom vs Grid Adjust',
      instruction:
        'Press and hold the rotary selector while on the Waveform screen. The Zoom / Grid Adjust mode indicator at the right of the enlarged waveform toggles between the two modes. In Zoom mode, turning the rotary selector zooms the enlarged waveform in and out. In Grid Adjust mode, turning the rotary selector shifts the beatgrid.',
      details:
        'Same press-and-hold gesture, two different jobs depending on the indicator. Get comfortable glancing at the indicator before you spin — it prevents accidentally nudging the grid when you only meant to zoom.',
      highlightControls: ['ROTARY_SELECTOR'],
      panelStateChanges: {
        ROTARY_SELECTOR: { active: true },
      },
    },
    {
      id: 'step-7',
      title: 'The Jog Display — Artwork, Playhead, Indicators',
      instruction:
        'Look down at the centre of the jog wheel. The artwork of the loaded track fills the middle of the jog display. A bright playback point indicator rotates with the track during playback and stops during pause. Around the rim, SLIP, SYNC, VINYL, and MASTER badges light when each feature is on.',
      details:
        'The jog display is your no-look reference. While your eyes track the dance floor or the mixer, peripheral vision can still confirm that SYNC, SLIP, or VINYL are armed.',
      highlightControls: ['JOG_DISPLAY'],
      panelStateChanges: {
        ROTARY_SELECTOR: { active: false },
      },
    },
    {
      id: 'step-8',
      title: 'Cue, Loop & Hot Cue Markers on the Jog',
      instruction:
        'The cue / loop / Hot Cue point indicator is the small marker that travels around the inner ring of the jog display. As the playback point spins, the distance between the playhead and this marker shows visually how far you are from the next saved cue, loop, or Hot Cue.',
      details:
        'Combined with the beat-countdown numerals on the upper display, the jog markers give you two synchronised previews of where the next anchor sits — one numerical, one rotational. Use whichever your eye prefers in the moment.',
      highlightControls: ['JOG_DISPLAY'],
      panelStateChanges: {},
    },
    {
      id: 'step-9',
      title: 'You Can Now Read the Decks',
      instruction:
        'Time, status badges, overall and enlarged waveforms, Zoom / Grid Adjust, the jog playhead, and the cue / loop / Hot Cue markers — every indicator now has a meaning. Next, the Tempo Control tutorial covers the TEMPO slider and the BPM read-outs you just learned to spot.',
      details:
        'Cue Points, Loops, Beatgrid Adjustment, and Slip Mode all assume you can read these displays at a glance. Spend a minute experimenting with the touch and the rotary on a parked track before moving on.',
      highlightControls: [],
      panelStateChanges: {},
    },
  ],
};
