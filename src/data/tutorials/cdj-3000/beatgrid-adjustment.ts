import { Tutorial } from '@/types/tutorial';

export const beatgridAdjustment: Tutorial = {
  id: 'beatgrid-adjustment',
  deviceId: 'cdj-3000',
  title: 'Beatgrid Adjustment',
  description:
    'Enter Grid Adjust mode by holding the rotary selector, then realign a track\'s beatgrid with SNAP GRID(CUE), SHIFT GRID, the half-beat ◄1/2 and 1/2► nudges, and RESET when you need to start over.',
  category: 'editing',
  difficulty: 'advanced',
  estimatedTime: '5 min',
  tags: [
    'beatgrid',
    'grid-adjust',
    'rotary-selector',
    'snap-grid',
    'shift-grid',
    'half-beat',
    'reset',
    'advanced',
  ],
  steps: [
    {
      id: 'step-1',
      title: 'Open the Waveform Screen',
      instruction:
        'Load a track that has been analysed by rekordbox (the only kind that has a beatgrid the CDJ can edit) and make sure the Waveform screen is showing on the touch display. Grid Adjust only works from this screen.',
      details:
        'Tracks the CDJ analyses locally also produce a grid, but tracks without any analysis show no grid markers and cannot be adjusted. If grid markers are missing from the waveform, re-analyse the track in rekordbox before continuing.',
      highlightControls: ['TOUCH_DISPLAY'],
      panelStateChanges: {},
    },
    {
      id: 'step-2',
      title: 'Set a Cue on the True Downbeat',
      instruction:
        'Frame-search to the position you believe is beat 1 of the bar (use SEARCH ◄◄ / ►► or the jog wheel while paused), then press CUE to lock that position as the current cue point. SNAP GRID(CUE) will pivot the entire grid onto this cue.',
      details:
        'A precise downbeat cue is the only ingredient SNAP GRID uses. If the cue is even a frame off, the whole grid lands off — most "the beatgrid is wrong" calls are actually "the cue point is wrong".',
      highlightControls: ['SEARCH_BACK', 'SEARCH_FWD', 'JOG_WHEEL', 'CUE_BTN'],
      panelStateChanges: {
        JOG_WHEEL: { active: true },
        CUE_BTN: { active: true },
      },
    },
    {
      id: 'step-3',
      title: 'Enter Grid Adjust Mode',
      instruction:
        'Press and HOLD the rotary selector for about a second. Grid Adjust mode turns on — the touch display swaps the Zoom controls for the SNAP GRID(CUE), SHIFT GRID, ◄1/2, 1/2►, and RESET buttons.',
      details:
        'Grid Adjust replaces Zoom mode on the rotary selector. Holding the rotary selector again exits Grid Adjust and returns to Zoom mode — both modes share the same physical control, so you cannot zoom while editing the grid.',
      highlightControls: ['ROTARY_SELECTOR'],
      panelStateChanges: {
        JOG_WHEEL: { active: false },
        CUE_BTN: { active: false },
        ROTARY_SELECTOR: { active: true },
      },
    },
    {
      id: 'step-4',
      title: 'Snap the Grid to the Cue',
      instruction:
        'Touch SNAP GRID(CUE) on the screen. The first beat of the beatgrid jumps to sit exactly on the cue point you set in step 2, and every downstream beat marker realigns with it.',
      details:
        'SNAP GRID does not change the BPM, only the phase — beat 1 lands where you want it, and beats 2, 3, 4 follow at the existing tempo. Use this whenever a grid is "right tempo, wrong starting point".',
      highlightControls: ['TOUCH_DISPLAY'],
      panelStateChanges: {},
    },
    {
      id: 'step-5',
      title: 'Use the Half-Beat Nudges',
      instruction:
        'Touch ◄1/2 to shift the whole grid backward by half a beat, or 1/2► to shift it forward by half a beat. Use these when the grid landed on the off-beat (every "&" of a count) instead of the downbeat.',
      details:
        'A common rekordbox bug is a grid that locks to the snare instead of the kick — the BPM is right, the phase is half a beat off. Two taps of 1/2► or ◄1/2 (depending on direction) fix it without re-cueing.',
      highlightControls: ['TOUCH_DISPLAY'],
      panelStateChanges: {},
    },
    {
      id: 'step-6',
      title: 'Apply Pitch-Bend Drift with SHIFT GRID',
      instruction:
        'If you have been nudging the jog wheel because the grid drifts later in the track, touch SHIFT GRID. The pitch-bend adjustments you applied during sync are baked into the beatgrid itself — next play, the grid already accounts for the drift.',
      details:
        'SHIFT GRID is the "permanent fix" for tracks that drift against rekordbox\'s tempo estimate (live recordings, older non-quantised productions). After applying it once, the track sync-locks cleanly on later sessions.',
      highlightControls: ['TOUCH_DISPLAY'],
      panelStateChanges: {},
    },
    {
      id: 'step-7',
      title: 'Reset and Exit',
      instruction:
        'Need to start over? Touch RESET to revert the beatgrid to its original (pre-edit) state. To leave Grid Adjust, press and HOLD the rotary selector again — the display swaps back to Zoom controls.',
      details:
        'RESET only reverts edits made in this session. Edits saved to the source media via MEMORY become the new "original" the next time the track loads, so cue-point and grid edits you keep are durable across CDJs.',
      highlightControls: ['ROTARY_SELECTOR'],
      panelStateChanges: {
        ROTARY_SELECTOR: { active: false },
      },
    },
    {
      id: 'step-8',
      title: 'Beatgrid Mastered',
      instruction:
        'You can fix a misaligned grid by snapping to a downbeat cue, nudging half-beats, or baking in pitch-bend drift, and you can always RESET. Beat Sync and Quantize both depend on an accurate grid, so this is the unblock for clean sync on stubborn tracks.',
      details:
        'For best results, do beatgrid edits in rekordbox where possible — the desktop tools are faster. Use Grid Adjust mid-set when you discover a problem live and just need the next mix to sync cleanly.',
      highlightControls: [],
      panelStateChanges: {},
    },
  ],
};
