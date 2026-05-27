import { Tutorial } from '@/types/tutorial';

export const basicPlaybackAndTransport: Tutorial = {
  id: 'basic-playback-and-transport',
  deviceId: 'cdj-3000',
  title: 'Basic Playback & Transport',
  description:
    'Play, pause, reverse, scrub, and search inside and between tracks using the PLAY/PAUSE button, the DIRECTION lever, the SEARCH and TRACK SEARCH buttons, the jog wheel, and the overall waveform.',
  category: 'playback',
  difficulty: 'beginner',
  estimatedTime: '6 min',
  tags: [
    'playback',
    'transport',
    'play-pause',
    'reverse',
    'slip-reverse',
    'search',
    'track-search',
    'frame-search',
    'super-fast-search',
    'beginner',
  ],
  steps: [
    {
      id: 'step-1',
      title: 'Play and Pause',
      instruction:
        'With a track loaded, press the PLAY/PAUSE button. Playback starts. Press it again to pause — the deck holds at the current position so the next press resumes from the same spot.',
      details:
        'PLAY/PAUSE is a true toggle: during pause it starts playback, during playback it pauses. The button lights solid while playing and blinks while paused at a cue point.',
      highlightControls: ['PLAY_PAUSE'],
      panelStateChanges: {
        PLAY_PAUSE: { active: true },
      },
    },
    {
      id: 'step-2',
      title: 'Seek by Touching the Waveform',
      instruction:
        'During pause, touch any point on the overall waveform at the top of the touch display to jump there. While playing, you can do the same by touching the top of the jog wheel (in Vinyl mode) and then touching the waveform.',
      details:
        'Slide your finger along the overall waveform to scrub through the track quickly. This is the fastest way to land near a specific section before fine-tuning with the jog wheel.',
      highlightControls: ['TOUCH_DISPLAY', 'JOG_WHEEL'],
      panelStateChanges: {},
    },
    {
      id: 'step-3',
      title: 'Reverse Playback',
      instruction:
        'Flip the DIRECTION FWD / REV / SLIP REV lever to the REV side. The loaded track plays backwards and the jog wheel rotation direction is also reversed.',
      details:
        'You may not be able to scratch during reverse playback if you trigger a Track Search or a loop. Flip the lever back to FWD to resume normal playback in the forward direction.',
      highlightControls: ['DIRECTION_LEVER'],
      panelStateChanges: {
        DIRECTION_LEVER: { active: true },
      },
    },
    {
      id: 'step-4',
      title: 'Slip Reverse',
      instruction:
        'Flip the DIRECTION lever to the SLIP REV side. The track plays in reverse, but the original forward timeline keeps running silently underneath. Flip back to FWD and playback resumes at the position the track would have reached if you had never reversed.',
      details:
        'SLIP REV is perfect for short reverse fills mid-set — you can drop a backwards effect without losing the beat phase, because Slip preserves the underlying timeline.',
      highlightControls: ['DIRECTION_LEVER'],
      panelStateChanges: {
        DIRECTION_LEVER: { active: false },
      },
      tipText:
        'Combine SLIP REV with a loop or scratch and the track will rejoin in time when you flip back to FWD.',
    },
    {
      id: 'step-5',
      title: 'Fast-Forward and Fast-Reverse',
      instruction:
        'Press the SEARCH ►► button to fast-forward and SEARCH ◄◄ to fast-reverse. The track continues scanning at speed until you release the button.',
      details:
        'These are momentary buttons — they only scan while held. Release to drop back into normal playback at the current position. Use this for quick A/B comparisons inside a long track.',
      highlightControls: ['SEARCH_BACK', 'SEARCH_FWD'],
      panelStateChanges: {
        SEARCH_FWD: { active: true },
      },
    },
    {
      id: 'step-6',
      title: 'Track Search (Next / Previous)',
      instruction:
        'Press TRACK SEARCH ►►| to jump to the start of the next track. Press TRACK SEARCH |◄◄ once to return to the start of the currently playing track; press it twice to jump to the start of the previous track.',
      details:
        'Track Search depends on the playlist or list you are currently browsing — it walks through the same list the rotary selector navigates. Use it to retry an intro you just played, or to advance without touching the browse screen.',
      highlightControls: ['TRACK_SEARCH_BACK', 'TRACK_SEARCH_FWD'],
      panelStateChanges: {
        SEARCH_FWD: { active: false },
        TRACK_SEARCH_FWD: { active: true },
      },
    },
    {
      id: 'step-7',
      title: 'Frame Search During Pause',
      instruction:
        'Pause the track, then either turn the jog wheel or tap SEARCH ◄◄ / ►► to nudge the pause position one frame at a time. The waveform inches forward or back so you can land precisely on a downbeat.',
      details:
        'Frame Search only behaves this way while paused — once playback resumes, the same controls revert to scratch / pitch-bend (jog) or fast-forward (SEARCH). Use it to set tight manual cue points.',
      highlightControls: ['JOG_WHEEL', 'SEARCH_BACK', 'SEARCH_FWD'],
      panelStateChanges: {
        TRACK_SEARCH_FWD: { active: false },
        PLAY_PAUSE: { active: false },
        JOG_WHEEL: { active: true },
      },
    },
    {
      id: 'step-8',
      title: 'Super Fast Search & Super Fast Track Search',
      instruction:
        'Hold SEARCH ►► (or ◄◄) and turn the jog wheel for Super Fast Search — fast-forward / fast-reverse with extra speed scaled to the rotation. Hold TRACK SEARCH ►►| (or |◄◄) and turn the jog wheel to cycle through tracks at extra speed in the direction you rotate.',
      details:
        'Both Super Fast modes are compound gestures: press-and-hold the search button, then spin the jog wheel. Release the button to stop. Use them to seek to a different section of a long mix or to walk a USB stick at speed.',
      highlightControls: ['SEARCH_FWD', 'TRACK_SEARCH_FWD', 'JOG_WHEEL'],
      panelStateChanges: {
        SEARCH_FWD: { active: true },
        TRACK_SEARCH_FWD: { active: true },
      },
    },
    {
      id: 'step-9',
      title: 'Transport Mastered',
      instruction:
        'You can now play, pause, reverse, slip-reverse, scan, track-search, frame-search, and super-fast-search. Next: read the Waveform & Jog Displays tutorial to learn what every indicator on the display is telling you.',
      details:
        'Cue points, loops, and beat-sync all build on these transport basics — every later tutorial assumes you can move around inside and between tracks comfortably.',
      highlightControls: [],
      panelStateChanges: {
        SEARCH_FWD: { active: false },
        TRACK_SEARCH_FWD: { active: false },
        JOG_WHEEL: { active: false },
      },
    },
  ],
};
