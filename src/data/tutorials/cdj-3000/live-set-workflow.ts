import { Tutorial } from '@/types/tutorial';

export const liveSetWorkflow: Tutorial = {
  id: 'live-set-workflow',
  deviceId: 'cdj-3000',
  title: 'Live-Set Workflow: From Load to Hand-Off',
  description:
    'Capstone tutorial — the actual end-to-end choreography of a DJ set on CDJ-3000. Strings together prep, load, grid verification, entry cueing, Hot Cues + Slip for fills, Beat Sync, Key Sync, master swap, EQ transition, and Instant Doubles hand-off in the order you do them live.',
  category: 'performance',
  difficulty: 'advanced',
  estimatedTime: '12 min',
  addedDate: '2026-05-28',
  tags: ['live-set', 'workflow', 'capstone', 'performance', 'transitions', 'beat-sync', 'key-sync', 'instant-doubles', 'hot-cue', 'slip'],
  steps: [
    {
      id: 'step-1',
      title: 'Pre-Set Prep — In rekordbox, Before You Touch the Deck',
      instruction:
        'Before the show: in rekordbox, set the beatgrid on every track you plan to play, drop hot cues at structural landmarks (intro start, drop, breakdown, outro), and tag the key. Sync your USB. Tracks that arrive at the deck without prep are tracks you can\'t mix confidently.',
      details:
        'Why this is step one of LIVE workflow even though it happens hours earlier: every live skill below assumes prep is done. Trying to beatgrid mid-set is possible (see beatgrid-adjustment) but it costs you 30 seconds of focused attention you don\'t have at peak hour. Prep is what makes the next 10 steps fast.',
      highlightControls: [],
      panelStateChanges: {},
      tipText:
        'A common pro habit: name your hot cues. "DROP", "BUILD", "BREAK", "OUT". When you see HOT_CUE_A glowing under that label mid-set, your hand goes to the right pad without thinking.',
    },
    {
      id: 'step-2',
      title: 'Load the Next Track',
      instruction:
        'Press SOURCE to pick your USB/SD. Use BROWSE + the rotary selector to find the track. Touch LOAD on the touch display (or press the rotary). The track loads on this deck. The waveform appears in the upper touch display, jog display lights, and BPM populates.',
      details:
        'Always load to the OFF-AIR deck (the one not currently feeding the mixer). Loading onto a playing deck would cut your audio mid-track — confirm the channel fader is down before pressing LOAD if you\'re ever unsure.',
      highlightControls: ['SOURCE', 'BROWSE_BTN', 'ROTARY_SELECTOR', 'TOUCH_DISPLAY'],
      panelStateChanges: {
        SOURCE: { active: true },
        ROTARY_SELECTOR: { active: true },
      },
    },
    {
      id: 'step-3',
      title: 'Verify the Beatgrid Is Correct',
      instruction:
        'Look at the upper waveform on the touch display. The vertical white beat markers should fall on every kick of the loaded track. Press PLAY/PAUSE briefly and listen — if the kick lands on the marker, you\'re aligned. If markers drift behind or ahead of kicks, the grid is wrong (open beatgrid-adjustment to fix before mixing in).',
      details:
        'Live-set integration point: never trust the grid blindly just because it shipped from rekordbox. 5 seconds of verification here prevents a sync-drift catastrophe later. The verification IS the workflow — pros do it on every track every time.',
      highlightControls: ['PLAY_PAUSE', 'TOUCH_DISPLAY'],
      panelStateChanges: {
        PLAY_PAUSE: { active: true },
      },
    },
    {
      id: 'step-4',
      title: 'Set the Entry Hot Cue at the First Mixable Phrase',
      instruction:
        'Use SEARCH_FWD or the jog wheel to scrub to where you want the track to enter the mix — usually the first downbeat of the intro\'s phrase, not the very first sample. Press HOT_CUE_A (with the pad mode set to Hot Cue). The pad lights and that exact position is now stored.',
      details:
        'Why a fresh entry hot cue per set: rekordbox-saved cues are static, but live transitions need adaptable entry points. The HOT_CUE_A you set right now reflects the energy your previous track established. Save it for THIS deck for THIS transition, then re-set for the next one.',
      highlightControls: ['SEARCH_FWD', 'JOG_WHEEL', 'HOT_CUE_A'],
      panelStateChanges: {
        HOT_CUE_A: { active: true, ledOn: true },
      },
      tipText:
        'Hold a hot cue pad while pressing PLAY for "Cue Play" — the track starts from that exact position. This is how pros launch tracks on a beat with surgical timing.',
    },
    {
      id: 'step-5',
      title: 'Engage BEAT SYNC Before Mixing In',
      instruction:
        'On the loaded (off-air) deck, press BEAT SYNC. The deck\'s tempo snaps to match the currently playing deck (the master). The tempo slider visually shifts to reflect the locked value. Now the two tracks are phase-locked — your hands are free for EQ.',
      details:
        'Live integration: BEAT SYNC is a tool, not a crutch. You press it to lock tempo so you can FOCUS on EQ transition and energy management. The sync engine handles the math; you handle the music. If you forget this step, you\'ll be jog-wheel-nudging while EQ\'ing — that\'s where mistakes happen.',
      highlightControls: ['BEAT_SYNC_INST_DOUBLES'],
      panelStateChanges: {
        BEAT_SYNC_INST_DOUBLES: { active: true, ledOn: true },
      },
    },
    {
      id: 'step-6',
      title: 'Engage KEY SYNC for a Harmonic Transition',
      instruction:
        'If the two tracks are in compatible keys (per camelot or musical key), press KEY SYNC on the loaded deck. The deck shifts the new track\'s pitch (independent of tempo) to harmonically align with the master deck. The display shows the shifted key.',
      details:
        'When to USE Key Sync: every transition where both tracks have vocals, melodic content, or sustained notes — clashing keys sound discordant even at matched tempo. When to SKIP: rhythm-only transitions (pure drums to drums), or when you\'re intentionally creating tension. Pair this with the harmonic-mixing-strategy tutorial for the deep theory.',
      highlightControls: ['KEY_SYNC'],
      panelStateChanges: {
        KEY_SYNC: { active: true, ledOn: true },
      },
    },
    {
      id: 'step-7',
      title: 'Mix In — Launch at Your Hot Cue',
      instruction:
        'Hold HOT_CUE_A and press PLAY/PAUSE simultaneously. The track launches from that exact position, already tempo-locked and key-locked. Bring up the channel fader on the mixer. The two tracks are now playing together in beat + key.',
      details:
        'This is the moment all the prep pays off. You hit one pad + one button and the track is in the mix at the right tempo, right key, right phrase position. Three steps ago you didn\'t even have the track loaded. That\'s the workflow — prep enables one-action launches.',
      highlightControls: ['HOT_CUE_A', 'PLAY_PAUSE'],
      panelStateChanges: {
        PLAY_PAUSE: { active: true },
      },
    },
    {
      id: 'step-8',
      title: 'Use SLIP for Fills Without Losing Position',
      instruction:
        'Mid-transition, press SLIP (the LED lights). Now any jog-wheel scratch, loop, or hot-cue jump will play that effect, but when you release, the track snaps back to where it WOULD have been. Use this to add a 2-bar reverse-loop fill or a hot-cue stutter without losing your mix position.',
      details:
        'Slip mode is the difference between a "live remix" and a "broken mix". Without slip, hitting a hot cue mid-transition rewinds your track and breaks the EQ relationship you built. With slip, you can be creative and the underlying track keeps playing in the background — when you let go, you\'re right where the audience expects.',
      highlightControls: ['SLIP', 'JOG_WHEEL'],
      panelStateChanges: {
        SLIP: { active: true, ledOn: true },
      },
      tipText:
        'Try this combo: SLIP on → tap HOT_CUE_B (stored at the drop) on the 4th beat of a phrase → release. You just added a one-beat drop teaser without ever leaving your mix position.',
    },
    {
      id: 'step-9',
      title: 'Swap the Master',
      instruction:
        'As the old track fades and the new track becomes the "main" energy, press MASTER on the new deck. The MASTER LED moves from the old deck to the new. Now if you mix in a third deck later, it\'ll sync to THIS deck\'s tempo, not the one fading out.',
      details:
        'Master role rotation is what makes long sets seamless. The master deck defines tempo for everyone synced to it — leaving an old fading-out track as master means the NEXT incoming track inherits the old tempo (which may not be what you want). Always rotate master to "the deck driving the floor right now".',
      highlightControls: ['MASTER'],
      panelStateChanges: {
        MASTER: { active: true, ledOn: true },
      },
    },
    {
      id: 'step-10',
      title: 'EQ Transition + Hand-Off via Instant Doubles',
      instruction:
        'Roll the old deck\'s EQ (low → mid → high) down on the mixer while the new deck takes over. To pre-stage the NEXT track, press and HOLD BEAT SYNC on a third deck — this is Instant Doubles, it loads the same playing track at the same position so you can fade between two copies. The cycle starts over: load → grid-check → entry cue → mix in.',
      details:
        'You\'ve now completed one full mix transition end to end. The workflow loops indefinitely from step 2. The skills you exercised: load timing (step 2), grid verification (step 3), creative cueing (step 4), tempo discipline (step 5), harmonic awareness (step 6), launch precision (step 7), creative-without-breaking (step 8), master rotation (step 9), and now EQ transition + pre-stage (step 10). Welcome to a DJ set on CDJ-3000.',
      highlightControls: ['BEAT_SYNC_INST_DOUBLES'],
      panelStateChanges: {
        BEAT_SYNC_INST_DOUBLES: { active: true },
        SLIP: { active: false, ledOn: false },
      },
    },
  ],
};
