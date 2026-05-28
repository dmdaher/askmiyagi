import { Tutorial } from '@/types/tutorial';

export const slipMode: Tutorial = {
  id: 'slip-mode',
  deviceId: 'cdj-3000',
  title: 'Slip Mode',
  description:
    'Turn on SLIP and keep the original timeline running silently in the background while you pause, scratch, loop, beat-loop, reverse, or relaunch Hot Cues — when you release, playback resumes from where the track would have been, perfectly in time.',
  category: 'mixing',
  difficulty: 'advanced',
  estimatedTime: '8 min',
  tags: [
    'slip',
    'slip-pause',
    'slip-scratch',
    'slip-loop',
    'slip-beat-loop',
    'slip-reverse',
    'slip-hot-cue',
    'vinyl-mode',
    'direction-lever',
    'advanced',
  ],
  steps: [
    {
      id: 'step-1',
      title: 'Turn Slip Mode On',
      instruction:
        'With a track playing, press SLIP. The button lights solid to confirm Slip mode is on. The track keeps playing exactly as before — Slip on its own changes nothing audible. What changes is what happens when you do the next thing.',
      details:
        'With Slip on, the player runs two playback heads — the one you hear, and a hidden one that keeps moving forward on the original timeline. Every Slip operation manipulates only the audible head; the hidden head never stops or jumps.',
      highlightControls: ['PLAY_PAUSE', 'SLIP'],
      panelStateChanges: {
        PLAY_PAUSE: { active: true },
        SLIP: { active: true },
      },
    },
    {
      id: 'step-2',
      title: 'Slip Pause — Hold to Mute, Release to Catch Up',
      instruction:
        'In Vinyl jog mode (the JOG MODE indicator next to the jog wheel must be on VINYL), press PLAY / PAUSE. The track pauses audibly but the hidden head keeps running. Press PLAY / PAUSE again to resume — playback jumps forward to wherever the hidden head is now, so the next beat lands exactly where it would have without the pause.',
      details:
        'Slip Pause needs Vinyl mode because that is the mode that lets PLAY / PAUSE behave as an instant stop / restart instead of a fade. In CDJ jog mode the pause has a release ramp and Slip Pause does not apply.',
      highlightControls: ['JOG_MODE', 'PLAY_PAUSE'],
      panelStateChanges: {
        JOG_MODE: { active: true },
      },
    },
    {
      id: 'step-3',
      title: 'Slip Scratch — Scratch and Drop Back Into Time',
      instruction:
        'Still in Vinyl mode, grab the top of the jog wheel and scratch a phrase. The audible head follows your hand; the hidden head keeps moving. The moment you let go, playback snaps back to where the track would have been if you had never touched it.',
      details:
        'This is the move Slip was designed for: you can now scratch over any drop without losing where you are in the mix. Lift your hand and the next bar lands on the beat. No Slip = scratch then chase the beatgrid back.',
      highlightControls: ['JOG_WHEEL'],
      panelStateChanges: {
        JOG_WHEEL: { active: true },
      },
    },
    {
      id: 'step-4',
      title: 'Slip Loop — Loop For Effect, Land on the Phrase',
      instruction:
        'Drop a manual loop (LOOP IN / CUE then LOOP OUT) or a 4 / 8 BEAT loop while Slip is on. The loop plays as normal — but the hidden head keeps moving forward through the track. Press LOOP RELOOP / EXIT to cancel the loop and the audio jumps forward to the exact point the track would have reached.',
      details:
        'Slip Loop is the rescue for "I dropped a 4-beat loop two bars too early" — instead of riding it out of time, exit the loop and the player catches up. The loop becomes a temporary effect over the underlying timeline.',
      highlightControls: ['FOUR_BEAT_LOOP', 'RELOOP_EXIT'],
      panelStateChanges: {
        JOG_WHEEL: { active: false },
        FOUR_BEAT_LOOP: { active: true },
      },
    },
    {
      id: 'step-5',
      title: 'Slip Beat Loop — Touch-and-Hold from the Display',
      instruction:
        'Touch BEAT LOOP on the Waveform screen, then touch and hold a number-of-beats button (e.g. 8). The loop plays for as long as your finger is down — release it and audio resumes from where the hidden head is now. This is the cleanest "stutter for a bar, land on the bar" gesture on the CDJ.',
      details:
        'Slip Beat Loop is hold-only — let go to release. Compare with a tapped BEAT LOOP outside Slip, which would latch the loop until you exit it explicitly with RELOOP / EXIT.',
      highlightControls: ['TOUCH_DISPLAY'],
      panelStateChanges: {
        FOUR_BEAT_LOOP: { active: false },
        TOUCH_DISPLAY: { active: true },
      },
    },
    {
      id: 'step-6',
      title: 'Slip Reverse — Flip the Direction, Slip Catches Up',
      instruction:
        'Flip the DIRECTION FWD / REV / SLIP REV lever to the SLIP REV side during playback. The audible playback reverses, but the hidden head keeps moving forward in time. Flip back to FWD to resume — audio lands on the timeline as if you had never reversed.',
      details:
        'SLIP REV works even when Slip mode is OFF — the lever\'s SLIP REV position is intrinsically a slip-style reverse. Use REV (the other side of the lever) when you want straight backward playback with no hidden head.',
      highlightControls: ['DIRECTION_LEVER'],
      panelStateChanges: {
        TOUCH_DISPLAY: { active: false },
        DIRECTION_LEVER: { active: true },
      },
    },
    {
      id: 'step-7',
      title: 'Slip Hot Cue — Hold a Pad, Release to Resume',
      instruction:
        'Press and HOLD a populated HOT CUE pad (e.g. HOT CUE A). Playback jumps to that Hot Cue and plays from there for as long as you hold. Release the pad — audio jumps forward to the hidden head and the original timeline resumes seamlessly.',
      details:
        'Hold-not-tap is the trigger here. A tapped Hot Cue with Slip on still works like a normal Hot Cue (no slip behaviour on release) — Slip Hot Cue only engages while the pad is physically down.',
      highlightControls: ['HOT_CUE_A'],
      panelStateChanges: {
        DIRECTION_LEVER: { active: false },
        HOT_CUE_A: { active: true },
      },
    },
    {
      id: 'step-8',
      title: 'Read the Waveform for Slip Visual Feedback',
      instruction:
        'On the Waveform screen, the foreground (audible) playhead draws as a yellow line and the background (hidden) playhead draws as a white line. The gap between them is "how far the hidden head has run ahead while you were performing". When the gap closes, audible and hidden are aligned.',
      details:
        'Watch the white line for the answer to "where will I land when I release?". This is the visual confirmation that Slip is doing what you expect — useful while building a feel for longer Slip Reverse or Slip Loop passes.',
      highlightControls: ['TOUCH_DISPLAY'],
      panelStateChanges: {
        HOT_CUE_A: { active: false },
      },
    },
    {
      id: 'step-9',
      title: 'Slip Mastered',
      instruction:
        'You can run any Slip operation — pause, scratch, loop, beat-loop, reverse, Hot Cue — and trust the player to drop you back on the timeline when you release. Press SLIP again (or load a new track) to turn Slip mode off. Next: Key Sync & Key Shift add harmonic control to the tempo and timeline work you have already mastered.',
      details:
        'Slip removes the "lose your place" cost from every performance move. Once it is on, the only question is which gesture serves the moment — the player guarantees you land on the grid when you release.',
      highlightControls: ['SLIP'],
      panelStateChanges: {
        SLIP: { active: false },
        JOG_MODE: { active: false },
      },
    },
  ],
};
