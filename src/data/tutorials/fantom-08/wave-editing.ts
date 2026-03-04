import { Tutorial } from '@/types/tutorial';

export const waveEditing: Tutorial = {
  id: 'wave-editing',
  deviceId: 'fantom-08',
  title: 'Wave Editing — Trim, Loop, and Shape Samples',
  description:
    'Learn how to edit sample waveforms on the Fantom 08: set start and end points to trim silence, configure loop points for sustained playback, zoom into transients, and preview your edits.',
  category: 'sampling',
  difficulty: 'intermediate',
  estimatedTime: '10 min',
  tags: ['sampling', 'wave-edit', 'trimming', 'looping', 'intermediate'],
  steps: [
    {
      id: 'step-1',
      title: 'Introduction to Wave Editing',
      instruction:
        'Wave editing lets you refine a recorded sample by trimming unwanted silence, setting loop points for sustained sounds, and adjusting gain and tuning. This is essential for turning raw recordings into polished, playable instruments.',
      details:
        "In this tutorial, you'll open a recorded sample in the KBD SAMPLE WAVE EDIT screen, learn the E-knob assignments for navigating the waveform, set start/end/loop points, and preview your edits before saving.",
      highlightControls: [],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'Homecoming',
        tempo: 120,
        beatSignature: '4/4',
      },
      tipText:
        'Wave editing is non-destructive until you finalize — you can always undo changes by reloading the original sample.',
    },
    {
      id: 'step-2',
      title: 'Open the Sample Pad Screen',
      instruction:
        'Hold SHIFT and press the Sampling button to open the Sample Pad screen. This shows the 4x4 pad grid where your recorded samples are assigned.',
      details:
        'The SAMPLE PAD screen is accessed by holding [SHIFT] and pressing [SAMPLING]. This is different from just pressing [SAMPLING], which opens the Sampling Menu for new recordings. The Sample Pad screen displays all 16 pads and their assigned samples.',
      highlightControls: ['shift', 'sampling'],
      panelStateChanges: {
        sampling: { active: true },
      },
      displayState: {
        screenType: 'sample-pad',
        title: 'SAMPLE PAD',
        menuItems: [
          { label: 'Pad 1: VocalPhrase', selected: true },
          { label: 'Pad 2: GuitarRiff' },
          { label: 'Pad 3: DrumLoop' },
          { label: 'Pad 4: ---' },
        ],
        selectedIndex: 0,
      },
      tipText:
        'If you have not recorded a sample yet, complete the Sampling Basics tutorial first to capture audio to a pad.',
    },
    {
      id: 'step-3',
      title: 'Enter Wave Edit Mode',
      instruction:
        'With Pad 1 selected, press the E1 knob (WAVE EDIT) to enter the KBD SAMPLE WAVE EDIT screen for the selected sample.',
      details:
        'On the SAMPLE PAD screen, E1 opens WAVE EDIT and E2 opens QUICK EDIT. WAVE EDIT gives you full control over start/end/loop points, waveform visualization, and sample parameters.',
      highlightControls: ['function-e1'],
      panelStateChanges: {
        'pad-1': { active: true, ledOn: true, ledColor: '#00ff44' },
      },
      displayState: {
        screenType: 'wave-edit',
        title: 'KBD SAMPLE WAVE EDIT',
        menuItems: [
          { label: 'Sample: VocalPhrase' },
          { label: 'START: 000000000', selected: true },
          { label: 'LOOP: 000000000' },
          { label: 'END: 000524288' },
        ],
        selectedIndex: 1,
        statusText: 'Tabs: WRITE | RELOAD | MODIFY | UTILITY',
      },
      tipText:
        'You can also reach Wave Edit from SAMPLING MENU > KBD SAMPLE > select sample > E4 (WAVE EDIT).',
    },
    {
      id: 'step-4',
      title: 'Understand the Waveform Display',
      instruction:
        'Look at the display: the center shows the sample waveform with three markers — a green START marker on the left, a yellow LOOP marker, and a red END marker on the right. The right side shows Loop Mode, Original Key, Gain, Fine Tune, and Level parameters.',
      details:
        'The waveform display is the heart of the editor. The horizontal axis represents time (sample position) and the vertical axis represents amplitude. The three markers define which portion of the sample plays back and where the loop region begins. Below the waveform, you can see the current point values and zoom level.',
      highlightControls: [],
      panelStateChanges: {},
      displayState: {
        screenType: 'wave-edit',
        title: 'KBD SAMPLE WAVE EDIT',
        menuItems: [
          { label: 'Sample: VocalPhrase' },
          { label: 'Loop Mode: FWD' },
          { label: 'Original Key: C4' },
          { label: 'Gain: 0 dB | Level: 127' },
        ],
        selectedIndex: 0,
        statusText: 'START: 000000000 | LOOP: 000000000 | END: 000524288',
      },
      tipText:
        'Loop Mode options: FWD (forward loop), ONE-SHOT (plays once, no loop), REV (reverse), and REV-LOOP (reverse loop).',
    },
    {
      id: 'step-5',
      title: 'Zoom In with E4',
      instruction:
        'Turn the E4 knob clockwise to zoom into the waveform horizontally. Zoom in to see the attack transient at the beginning of the sample in detail.',
      details:
        'E4 controls horizontal zoom from 1/1 (full sample view) down to 1/65536 (extreme close-up). Zooming in lets you precisely position the start, loop, and end markers. The waveform scrolls to keep the currently selected marker visible.',
      highlightControls: ['function-e4'],
      panelStateChanges: {},
      displayState: {
        screenType: 'wave-edit',
        title: 'KBD SAMPLE WAVE EDIT',
        menuItems: [
          { label: 'Sample: VocalPhrase' },
          { label: 'Zoom H: 1/64' },
          { label: 'Zoom V: x1' },
          { label: 'Gain: 0 dB | Level: 127' },
        ],
        selectedIndex: 1,
        statusText: 'Zoomed to attack region — START marker visible',
      },
      tipText:
        'Use E5 (Zoom Vert) to increase the vertical scale if the waveform appears too small. Vertical zoom ranges from x1 to x128.',
    },
    {
      id: 'step-6',
      title: 'Set the Start Point with E1',
      instruction:
        'Turn the E1 knob clockwise to move the START marker past any silence at the beginning of the sample. Position it just before the first audible transient.',
      details:
        'E1 controls the playback start position. Any audio before this point will not play. This is how you trim leading silence or count-in noise from a recording. Watch the waveform — the green START marker moves as you turn E1. Position it right at the onset of the sound.',
      highlightControls: ['function-e1'],
      panelStateChanges: {},
      displayState: {
        screenType: 'wave-edit',
        title: 'KBD SAMPLE WAVE EDIT',
        menuItems: [
          { label: 'Sample: VocalPhrase' },
          { label: 'START: 000012480', selected: true },
          { label: 'LOOP: 000000000' },
          { label: 'END: 000524288' },
        ],
        selectedIndex: 1,
        statusText: 'Start point moved — silence trimmed',
      },
      tipText:
        'For percussive samples, place the start point right at the attack transient. Even a few milliseconds of silence can make pads feel sluggish.',
    },
    {
      id: 'step-7',
      title: 'Set the End Point with E3',
      instruction:
        'Turn the E3 knob counter-clockwise to move the END marker inward, trimming any unwanted tail or noise at the end of the sample.',
      details:
        'E3 controls the playback end position. Audio after this point will not play. This is useful for removing trailing silence, reverb tails, or background noise at the end of a recording. The red END marker moves as you turn E3.',
      highlightControls: ['function-e3'],
      panelStateChanges: {},
      displayState: {
        screenType: 'wave-edit',
        title: 'KBD SAMPLE WAVE EDIT',
        menuItems: [
          { label: 'Sample: VocalPhrase' },
          { label: 'START: 000012480' },
          { label: 'LOOP: 000000000' },
          { label: 'END: 000498000', selected: true },
        ],
        selectedIndex: 3,
        statusText: 'End point trimmed — tail removed',
      },
      tipText:
        'After setting start and end points, you can use MODIFY > TRUNCATE to permanently remove the trimmed regions and free up sample memory.',
    },
    {
      id: 'step-8',
      title: 'Set the Loop Point with E2',
      instruction:
        'Turn the E2 knob to set the LOOP START point. This defines where the sample will loop back to during sustained playback — ideal for pads, strings, and vocal drones.',
      details:
        'E2 controls the loop start position. When Loop Mode is set to FWD, the sample plays from START to END, then loops back to the LOOP point and repeats the region between LOOP and END. Position the loop point at a zero-crossing (where the waveform crosses the center line) to avoid audible clicks.',
      highlightControls: ['function-e2'],
      panelStateChanges: {},
      displayState: {
        screenType: 'wave-edit',
        title: 'KBD SAMPLE WAVE EDIT',
        menuItems: [
          { label: 'Sample: VocalPhrase' },
          { label: 'START: 000012480' },
          { label: 'LOOP: 000256000', selected: true },
          { label: 'END: 000498000' },
        ],
        selectedIndex: 2,
        statusText: 'Loop Mode: FWD — loop region set',
      },
      tipText:
        'For one-shot samples (drums, hits), set Loop Mode to ONE-SHOT so the sample plays through once without looping.',
    },
    {
      id: 'step-9',
      title: 'Preview Your Edits',
      instruction:
        'Press and hold the E6 knob (PREVIEW) to audition the edited sample. You can also press PLAY on the transport to hear the sample with looping. Verify that the start, end, and loop points sound clean.',
      details:
        'E6 acts as a preview trigger — press and hold to hear the sample from the current start point through the loop region. Listen for clicks at the loop point, unwanted silence at the start, or cut-off audio at the end. Adjust any points as needed before finalizing.',
      highlightControls: ['function-e6', 'play'],
      panelStateChanges: {
        play: { active: true, ledOn: true, ledColor: '#00ff44' },
      },
      displayState: {
        screenType: 'wave-edit',
        title: 'KBD SAMPLE WAVE EDIT',
        menuItems: [
          { label: 'Sample: VocalPhrase' },
          { label: 'START: 000012480' },
          { label: 'LOOP: 000256000' },
          { label: 'END: 000498000' },
        ],
        selectedIndex: 0,
        statusText: 'PREVIEWING — press E6 to audition',
      },
      tipText:
        'If you hear a click at the loop point, nudge the LOOP position with E2 until you find a smooth zero-crossing.',
    },
    {
      id: 'step-10',
      title: 'Save and Exit',
      instruction:
        'Press Exit to leave the Wave Edit screen. The Fantom will prompt you to create a user tone from the edited sample. Your trimmed and looped sample is now ready for performance.',
      details:
        'Pressing Exit saves your edits and creates a user tone. You can also use the MODIFY tab for additional processing: TRUNCATE permanently trims the sample using your start/end points, NORMALIZE raises the level to maximum without clipping, and EMPHASIS boosts high frequencies for presence. Your edited sample remains assigned to its pad.',
      highlightControls: ['exit'],
      panelStateChanges: {
        play: { active: false, ledOn: false },
        'pad-1': { active: false, ledOn: false },
        sampling: { active: false },
        exit: { active: true },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'Homecoming',
        tempo: 120,
        beatSignature: '4/4',
        statusText: 'Wave edit saved — user tone created',
      },
      tipText:
        'Use MODIFY > TRUNCATE after setting start/end points to permanently trim the sample and reclaim memory. NORMALIZE is great for quieter recordings.',
    },
  ],
};
