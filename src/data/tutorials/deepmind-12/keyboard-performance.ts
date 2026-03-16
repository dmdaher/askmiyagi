import { Tutorial } from '@/types/tutorial';

export const keyboardPerformance: Tutorial = {
  id: 'keyboard-performance',
  deviceId: 'deepmind-12',
  title: 'Keyboard, Velocity & Aftertouch',
  description:
    'Master expressive playing on the DeepMind 12\'s 49-key keyboard. Understand velocity response, aftertouch, octave shifting, and how the pitch and modulation wheels work.',
  category: 'basics',
  difficulty: 'beginner',
  estimatedTime: '5 min',
  tags: ['keyboard', 'velocity', 'aftertouch', 'octave', 'pitch-bend', 'mod-wheel', 'beginner'],
  steps: [
    {
      id: 'step-1',
      title: 'The 49-Key Keyboard',
      instruction:
        'The DeepMind 12 has 49 semi-weighted full-size keys spanning four octaves from C2 to C6. It supports both velocity and aftertouch for expressive playing.',
      details:
        'Semi-weighted keys provide a balance between the lightness of synth-action keys and the resistance of piano-weighted keys. This makes fast runs and sustained chords equally comfortable. The keyboard range (C2-C6) can be extended in both directions using the octave shift buttons.',
      highlightControls: ['perf-oct-down', 'perf-oct-up'],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        statusText: 'A-1  Up In Clouds RD',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-2',
      title: 'Velocity — How Hard You Strike',
      instruction:
        'Play a key softly, then play the same key hard. The DeepMind 12 senses the speed at which you press the key and uses that as the velocity value. Faster strike = higher velocity = typically louder or brighter sound.',
      details:
        'The DeepMind 12 measures two velocity types: NOTE ON VELOCITY (how fast you press the key down) and NOTE OFF VELOCITY (how fast you release the key). Both can be assigned to modulate any parameter. Velocity curves and fixed velocity values can be configured in the GLOBAL > KEYBOARD SETTINGS menu.',
      highlightControls: ['display'],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        statusText: 'A-1  Up In Clouds RD',
        selectedIndex: 1,
      },
      tipText: 'Tip: If the sound does not respond to velocity, check whether VELOCITY-SENS is set to 0 in the VCF or VCA EDIT menus — a value of 0 disables velocity sensitivity.',
    },
    {
      id: 'step-3',
      title: 'Aftertouch — Pressure After the Key is Down',
      instruction:
        'Press and hold a key, then push down harder without releasing. This is aftertouch — the keyboard senses the additional pressure you apply after the initial strike. Aftertouch typically adds vibrato, filter modulation, or volume swell.',
      details:
        'Aftertouch is a channel-wide signal — it applies to all currently held notes simultaneously. The DeepMind 12 measures the pressure you apply to the keys after they are fully pressed. Like velocity, aftertouch response curves can be customized in GLOBAL > KEYBOARD SETTINGS.',
      highlightControls: ['display'],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        statusText: 'A-24  Up In Clouds RD',
        selectedIndex: 24,
      },
    },
    {
      id: 'step-4',
      title: 'Octave Shift — OCT DOWN and OCT UP',
      instruction:
        'Press OCT DOWN (-) to shift the keyboard one octave lower. Press OCT UP (+) to shift one octave higher. The five OCTAVE LEDs above the buttons show your current position: center LED (lit green) = no shift.',
      details:
        'The five OCTAVE LEDs represent positions -2, -1, 0, +1, +2. Each press of OCT DOWN or OCT UP moves one step. The center LED glows green at octave 0 (no shift). The other LEDs glow orange to indicate the current shifted position. Octave shifting lets you play bass lines or high leads without leaving the keyboard range.',
      highlightControls: ['perf-oct-down', 'perf-oct-up', 'octave-leds'],
      panelStateChanges: {
        'perf-oct-down': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'A-1  Up In Clouds RD',
        selectedIndex: 0,
      },
      tipText: 'Tip: Press both OCT DOWN and OCT UP simultaneously to instantly reset to octave 0 (no transpose).',
    },
    {
      id: 'step-5',
      title: 'Resetting Octave & Playing Across the Range',
      instruction:
        'Press both OCT DOWN and OCT UP buttons at the same time to reset to octave 0. Try playing with the keyboard shifted to -2, -1, 0, +1, and +2 to hear how the same keys produce different octave ranges.',
      details:
        'With a -2 shift, the 49 keys span C0-C4 (very low). With a +2 shift, they span C4-C8 (very high). This makes the DeepMind 12 versatile for both bass/pad programs and lead/high-frequency sounds without needing a larger keyboard.',
      highlightControls: ['perf-oct-down', 'perf-oct-up', 'octave-leds'],
      panelStateChanges: {
        'perf-oct-down': { active: false },
      },
      displayState: {
        screenType: 'home',
        statusText: 'A-1  Up In Clouds RD',
        selectedIndex: 0,
      },
    },
    {
      id: 'step-6',
      title: 'Pitch Bend Wheel',
      instruction:
        'Move the PITCH wheel (left wheel) up or down while holding a note. The pitch bends smoothly in that direction. When you release the wheel, it springs back to center and pitch returns to normal.',
      details:
        'The PITCH wheel is spring-loaded and always returns to center when released. The default pitch bend range is ±2 semitones. Both wheels are illuminated by LEDs which can be set to always on, always off, or AUTO (LEDs brighten as the wheel moves). The bend range can be changed in POLY EDIT > PITCH PARAMS (second page of the POLY EDIT menu).',
      highlightControls: ['perf-pitch'],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        statusText: 'A-24  Up In Clouds RD',
        selectedIndex: 24,
      },
    },
    {
      id: 'step-7',
      title: 'Modulation Wheel',
      instruction:
        'Move the MOD wheel (right wheel) upward while playing notes. The mod wheel applies modulation — typically vibrato, filter opening, or any parameter assigned to it. Unlike the pitch wheel, the mod wheel stays wherever you leave it.',
      details:
        'The MOD wheel sends a continuous modulation signal (0 at rest, maximum when fully up). What it modulates depends on the program — most factory programs assign it to vibrato depth or filter cutoff. For traditional playing, push it up gradually after the initial note attack to add expressive vibrato. Advanced assignments are set in the Modulation Matrix (MOD menu).',
      highlightControls: ['perf-mod'],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        statusText: 'A-24  Up In Clouds RD',
        selectedIndex: 24,
      },
      tipText: 'Tip: Both wheels have LED indicators. Set them to AUTO mode in GLOBAL > PANEL SETTINGS to have the LEDs brighten as you move each wheel — a useful visual indicator on stage.',
    },
  ],
};
