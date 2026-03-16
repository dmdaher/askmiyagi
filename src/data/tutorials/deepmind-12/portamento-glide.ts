import { Tutorial } from '@/types/tutorial';

export const portamentoGlide: Tutorial = {
  id: 'portamento-glide',
  deviceId: 'deepmind-12',
  title: 'Portamento & Glide Modes',
  description:
    'Set portamento time with the front-panel knob, explore the 14 glide modes in the POLY EDIT Pitch Parameters menu, balance glide between OSC 1 and OSC 2 independently, and understand how portamento interacts with polyphony.',
  category: 'sound-design',
  difficulty: 'intermediate',
  estimatedTime: '9 min',
  tags: ['portamento', 'glide', 'pitch', 'poly-edit', 'legato', 'monophonic'],
  steps: [
    {
      id: 'step-1',
      title: 'PORTAMENTO Knob — Setting Glide Time',
      instruction:
        'Locate the PORTAMENTO knob in the PERF section at the top-left of the panel. Turn it clockwise to increase the glide time from 0 to 10 seconds. At the leftmost position (0) there is no glide — notes jump instantly. At the rightmost position (10 seconds) notes take 10 seconds to travel from the previous pitch to the new pitch. Play two notes in sequence to hear the glide effect.',
      details:
        'The PORTAMENTO knob range is 0 to 10 seconds. This sets the glide time between consecutive notes. The exact behaviour (whether all note changes glide or only legato note changes glide) depends on the PORTA-MODE setting in the POLY EDIT menu. By default the mode is Off, meaning no portamento regardless of the knob — you must first activate a mode. The knob position only matters once a portamento mode is enabled.',
      highlightControls: ['perf-portamento'],
      panelStateChanges: {
        'perf-portamento': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'A-1  Default Program',
        selectedIndex: 0,
      },
    },
    {
      id: 'step-2',
      title: 'Opening POLY EDIT Pitch Parameters',
      instruction:
        'Press the POLY EDIT switch to open the POLY menu. Press BANK DOWN to navigate to the PITCH PARAMETERS page. The display shows the portamento mode settings: PORTA-MODE, OSC1-PORTA, and OSC2-PORTA. These parameters let you choose which type of glide to apply and which oscillators are affected.',
      details:
        'The POLY EDIT switch opens the POLY menu which has multiple pages. The PITCH PARAMETERS page contains portamento settings alongside other pitch-related parameters. Use BANK UP / BANK DOWN to move between pages within the POLY menu. The Pitch Parameters page is the primary location for all portamento control — changes here interact directly with the PORTAMENTO knob position.',
      highlightControls: ['poly-edit'],
      panelStateChanges: {
        'perf-portamento': { active: false },
        'poly-edit': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'PITCH PARAMETERS',
        menuItems: [
          { label: 'PORTA-MODE          Off' },
          { label: 'OSC1-PORTA            0' },
          { label: 'OSC2-PORTA            0' },
        ],
        selectedIndex: 0,
        statusText: 'POLY EDIT',
      },
    },
    {
      id: 'step-3',
      title: 'Selecting a Portamento Mode',
      instruction:
        'Navigate to PORTA-MODE and use +/YES to cycle through the available modes. Try "Fingered" first — in this mode glide only occurs when you play legato (press a new note before releasing the previous one). If you lift each key before pressing the next, notes jump normally. This is the most musical mode for melodic lines where you want to choose which intervals glide.',
      details:
        'The DeepMind 12 has 14 portamento modes covering different combinations of: trigger style (always/fingered), rate type (fixed rate or fixed time), glide direction (up/down/both), and oscillator balance. "Off" disables portamento. "Fingered" only glides when playing legato. "Fixed Rate" glides at the same pitch change speed regardless of interval distance (so wide intervals take longer). "Fixed Time" always takes exactly the PORTAMENTO knob time regardless of interval distance. Additional modes include Linear, Exponential, and per-direction variants.',
      highlightControls: ['poly-edit', 'prog-nav-yes', 'prog-nav-no'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'PITCH PARAMETERS',
        menuItems: [
          { label: 'PORTA-MODE    Fingered' },
          { label: 'OSC1-PORTA            0' },
          { label: 'OSC2-PORTA            0' },
        ],
        selectedIndex: 0,
        statusText: 'POLY EDIT',
      },
    },
    {
      id: 'step-4',
      title: 'Fixed Rate vs Fixed Time Glide',
      instruction:
        'Change PORTA-MODE to "Fixed Rate". Now play a minor 2nd (adjacent semitones) — the glide is quick. Then play an octave — the glide takes much longer because the pitch has further to travel. Change to "Fixed Time" and repeat: both intervals now take exactly the same amount of time (set by the PORTAMENTO knob). Fixed Time is more predictable for rhythmic glides; Fixed Rate sounds more like a real string bend.',
      details:
        'Fixed Rate: the pitch changes at a constant rate in semitones per second. A narrow interval (e.g., semitone) glides faster than a wide interval (e.g., octave). This mirrors the behaviour of analogue synths where glide is driven by a fixed slew rate on the CV. Fixed Time: the pitch always takes exactly the PORTAMENTO knob duration regardless of distance, so a semitone and an octave both glide over the same time window. The choice depends on musical context — Fixed Rate for pitch-bend-like expression, Fixed Time for tight rhythmic syncing.',
      highlightControls: ['poly-edit', 'perf-portamento'],
      panelStateChanges: {
        'perf-portamento': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'PITCH PARAMETERS',
        menuItems: [
          { label: 'PORTA-MODE  Fixed Time' },
          { label: 'OSC1-PORTA            0' },
          { label: 'OSC2-PORTA            0' },
        ],
        selectedIndex: 0,
        statusText: 'POLY EDIT',
      },
    },
    {
      id: 'step-5',
      title: 'OSC1-PORTA and OSC2-PORTA — Per-Oscillator Glide Balance',
      instruction:
        'Navigate to OSC1-PORTA and increase it from 0 to 127. Navigate to OSC2-PORTA and leave it at 0. Now play a glide: only OSC 1 glides while OSC 2 jumps immediately to the new pitch. The two oscillators are momentarily detuned as OSC 1 catches up — creating a natural pitch-beating effect during the glide. Set both to 127 for normal full glide on both oscillators.',
      details:
        'OSC1-PORTA and OSC2-PORTA each range 0-255. At 0 that oscillator is not subject to portamento. At 255 it glides fully for the full PORTAMENTO knob time. Setting them to different values creates asymmetric glides — for example, OSC1=200 and OSC2=50 means OSC 1 glides most of the way while OSC 2 glides briefly. This is a rich technique for chorus-style pitch movement during transitions, unique to the dual-oscillator architecture of the DeepMind 12.',
      highlightControls: ['poly-edit'],
      panelStateChanges: {
        'perf-portamento': { active: false },
      },
      displayState: {
        screenType: 'menu',
        title: 'PITCH PARAMETERS',
        menuItems: [
          { label: 'PORTA-MODE  Fixed Time' },
          { label: 'OSC1-PORTA          127' },
          { label: 'OSC2-PORTA            0' },
        ],
        selectedIndex: 1,
        statusText: 'POLY EDIT',
      },
    },
    {
      id: 'step-6',
      title: 'Portamento with Polyphony',
      instruction:
        'With PORTA-MODE set to "Fingered" and polyphony greater than 1 voice, play chords: portamento is generally most effective in mono/unison setups. Switch to POLY UNISON (press POLY EDIT and enable UNISON) to combine all 12 voices into one thick monophonic voice — glide now applies across all 12 stacked oscillators simultaneously for a classic lead synth portamento sound.',
      details:
        'In fully polyphonic mode, each voice independently glides from its previous note to its new note — results depend on voice allocation. Portamento shines most in monophonic or unison configurations. With UNISON on, all voices play the same pitch and the glide behaves like a classic mono synth. The "Fingered" mode works especially well for monophonic leads: play staccato to get clean separate notes, play legato to trigger glides on chosen intervals. This is the standard technique for lead synth portamento in electronic music.',
      highlightControls: ['poly-unison', 'poly-edit', 'perf-portamento'],
      panelStateChanges: {
        'perf-portamento': { active: true },
        'poly-unison': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'POLY EDIT',
        menuItems: [
          { label: 'UNISON           On' },
          { label: 'UNISON DETUNE    20' },
          { label: 'VOICES           12' },
        ],
        selectedIndex: 0,
        statusText: 'POLY EDIT',
      },
    },
    {
      id: 'step-7',
      title: 'Saving Portamento with a Program',
      instruction:
        'Portamento settings (PORTA-MODE, OSC1-PORTA, OSC2-PORTA) are stored as part of each program. The PORTAMENTO knob position, however, is a physical control and its last-moved position takes effect immediately. To store a specific knob value, move the PORTAMENTO knob to the desired position and then press WRITE to save the program. Navigate to the WRITE menu and confirm — the portamento time is saved as part of the program data.',
      details:
        'The PORTAMENTO knob is a continuous analogue control whose current value is saved into the program when you press WRITE. After recalling a program, the physical knob may be at a different position than the saved value — the DeepMind 12 uses "Fader Match" behavior: the knob takes effect only after you move it past the stored value (it "catches up"). The compare mode (COMPARE switch) shows you the stored value vs the current knob position. All three PITCH PARAMETERS settings (PORTA-MODE, OSC1-PORTA, OSC2-PORTA) are always saved with the program.',
      highlightControls: ['perf-portamento', 'prog-menu-write'],
      panelStateChanges: {
        'poly-unison': { active: false },
        'poly-edit': { active: false },
        'prog-menu-write': { active: true },
      },
      displayState: {
        screenType: 'write',
        title: 'WRITE PROGRAM',
        statusText: 'A-1  Default Program',
        selectedIndex: 0,
      },
      tipText:
        'Tip: For expressive bass lines, try PORTA-MODE = Fingered with OSC1-PORTA = 200 and OSC2-PORTA = 60. Only legato note transitions glide, OSC 1 takes a slow sweep while OSC 2 briefly detunes — giving a natural, slightly de-tuned feel during transitions.',
    },
  ],
};
