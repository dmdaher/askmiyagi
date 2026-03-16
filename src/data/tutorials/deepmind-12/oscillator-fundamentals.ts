import { Tutorial } from '@/types/tutorial';

export const oscillatorFundamentals: Tutorial = {
  id: 'oscillator-fundamentals',
  deviceId: 'deepmind-12',
  title: 'Oscillator Basics — Waveforms, Range & Mix',
  description:
    'Explore the DeepMind 12 oscillator section: OSC 1 (sawtooth and square), OSC 2 (square with independent pitch and level), and the noise generator. Learn how to combine waveforms and set octave range.',
  category: 'synthesis',
  difficulty: 'beginner',
  estimatedTime: '8 min',
  tags: ['oscillator', 'waveform', 'sawtooth', 'square', 'noise', 'synthesis', 'beginner'],
  steps: [
    {
      id: 'step-1',
      title: 'Meet the Oscillator Section',
      instruction:
        'The OSC 1 & 2 section is the heart of the DeepMind 12 sound. OSC 1 generates a SAWTOOTH waveform and a SQUARE waveform — you can use them independently or together. OSC 2 generates a SQUARE waveform only. The NOISE generator adds pink noise to the mix.',
      details:
        'All oscillators use completely analog circuitry — the pitch is controlled digitally for accurate tuning but the actual waveform generation is 100% analog. This gives the DeepMind 12 its warm, organic character. The faders across the OSC section control: OSC 1 PITCH MOD, PWM, then OSC 2 PITCH MOD, TONE MOD, PITCH, LEVEL, and NOISE LEVEL.',
      highlightControls: ['osc-sawtooth', 'osc-square', 'osc-edit'],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        statusText: 'A-1  Default Program',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-2',
      title: 'OSC 1 SAWTOOTH Waveform',
      instruction:
        'Press the SAWTOOTH switch to turn the OSC 1 sawtooth waveform on or off. The LED illuminates when sawtooth is active. The sawtooth has a bright, buzzy, harmonically rich sound — it contains the fundamental plus all harmonics (2nd, 3rd, 4th...) at decreasing levels. Classic for basses, strings, brass, and leads.',
      details:
        'The sawtooth waveform is often described as "fat" because of its dense harmonic content. It is the most versatile starting point for subtractive synthesis — you start with all harmonics present, then use the VCF to subtract frequencies. The OSC 1 SAWTOOTH can be used independently or combined with the OSC 1 SQUARE waveform at the same time. Default program setting is On.',
      highlightControls: ['osc-sawtooth'],
      panelStateChanges: {
        'osc-sawtooth': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'OSC1 SAW: On',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-3',
      title: 'OSC 1 SQUARE Waveform',
      instruction:
        'Press the SQUARE switch to turn the OSC 1 square waveform on or off. The square wave has a hollow, nasal sound — it only contains odd harmonics (1st, 3rd, 5th, 7th...). It is commonly used to emulate clarinets, nasal leads, and thin electronic sounds. You can have both SAWTOOTH and SQUARE active simultaneously.',
      details:
        'When both SAWTOOTH and SQUARE are active at once on OSC 1, their combined output creates a new waveform with a complex harmonic structure. You can hear the interaction change as you adjust the OSC 1 PWM fader — that fader controls the pulse width of just the SQUARE component, not the sawtooth. Default program setting is On.',
      highlightControls: ['osc-square'],
      panelStateChanges: {
        'osc-square': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'OSC1 SQR: On',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-4',
      title: 'Setting the Octave Range',
      instruction:
        'Press the OSC EDIT switch once to open the OSC 1 PARAMETERS menu. Use BANK UP / BANK DOWN to navigate to the RANGE parameter, then use -/NO or +/YES to select 16\', 8\', or 4\'. This sets the base octave of OSC 1. Press OSC EDIT again to move to the OSC 2 PARAMETERS menu where you can set OSC 2 RANGE independently.',
      details:
        'RANGE values: 16\' — the lowest note on the keyboard (C) is tuned to 16.35 Hz (one octave below 8\' standard pitch). 8\' — C is tuned to 32.7 Hz (standard pitch). 4\' — C is tuned to 65.4 Hz (one octave above standard). The default setting for both OSC 1 and OSC 2 is 8\'. The display shows the OSC 1 PARAMETERS menu. At the bottom of the screen you will see "[EDIT]> OSC 2" — press EDIT again to access OSC 2 PARAMETERS.',
      highlightControls: ['osc-edit'],
      panelStateChanges: {
        'osc-edit': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'OSC 1 PARAMETERS',
        menuItems: [
          { label: 'RANGE          8\'' },
          { label: 'P.MOD-SRC   ENV-1' },
          { label: 'AFT>P.MOD       0' },
          { label: 'WHEEL>P.MOD     0' },
          { label: 'PWM-SRC    MANUAL' },
          { label: 'P.MOD-MODE  OSC1+2' },
          { label: 'KEY-DN-RESET   Off' },
        ],
        selectedIndex: 0,
        statusText: '[EDIT]> OSC 2',
      },
    },
    {
      id: 'step-5',
      title: 'OSC 2 PITCH — Detuning and Harmony',
      instruction:
        'Press PROG to return to the main display. Move the OSC 2 PITCH fader. This shifts OSC 2\'s pitch relative to OSC 1. The center position is 0 semitones (unison). Moving up raises OSC 2\'s pitch; moving down lowers it. The range is -12.0 to +12.0 semitones, giving you a full octave of offset in each direction.',
      details:
        'The PROG display shows the current OSC 2 PITCH value at the bottom as you move the fader (e.g., "OSC2 PITCH: +7.0cent"). Small detune amounts (a few cents) create chorus-like thickening. Musical intervals — a fifth (+7 semitones), an octave (+12 semitones), or a major third (+4 semitones) — add harmony. The default OSC 2 PITCH setting is 0 semitones (identical to OSC 1).',
      highlightControls: ['osc-pitch'],
      panelStateChanges: {
        'osc-edit': { active: false },
        'osc-pitch': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'OSC2 PITCH: +7.0cent',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-6',
      title: 'OSC 2 LEVEL — Blending the Oscillators',
      instruction:
        'Move the OSC 2 LEVEL fader up from its default Off position. This brings OSC 2\'s square wave into the mix alongside OSC 1. As you raise the level, OSC 2 adds its character to the sound. At 0.0 dB, OSC 2 is equal in level to OSC 1. The operational range is -48.0 to 0.0 dB, and the default is Off (fully silent).',
      details:
        'Combining two oscillators is the foundation of classic analog synthesis. With OSC 2 detuned by a few semitones, mixing it in creates a "beating" effect as the frequencies interact — this is the classic two-oscillator thickness. Set OSC 2 PITCH to exactly +12 semitones and blend in OSC 2 LEVEL for a thick sub-octave layer. The PROG display shows "OSC2 LEVEL: -12.0dB" as you move the fader.',
      highlightControls: ['osc-level'],
      panelStateChanges: {
        'osc-pitch': { active: false },
        'osc-level': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'OSC2 LEVEL: -12.0dB',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-7',
      title: 'NOISE LEVEL — Adding Texture',
      instruction:
        'Move the NOISE LEVEL fader up from its default Off position. The DeepMind 12 noise generator produces pink noise using analog circuitry. Pink noise has equal energy per octave and creates a soft rushing sound — like a waterfall. It is useful for breath effects, snare drums, ocean sounds, and adding a sense of air or texture to pads.',
      details:
        'Pink noise has a gentle high-frequency roll-off (unlike white noise which is harsher). The NOISE LEVEL range is Off or -48.1 to 0.0 dB. The default is Off. Try raising NOISE LEVEL while keeping the VCF FREQ very low — you will get a deep whooshing bass layer. Or open the filter fully and add a small amount of noise to an organ-like patch to add analog "breath." The PROG display shows "NOISE LEVEL: 0.0dB" at maximum.',
      highlightControls: ['osc-noise'],
      panelStateChanges: {
        'osc-level': { active: false },
        'osc-noise': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'NOISE LEVEL: 0.0dB',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-8',
      title: 'Oscillator Fundamentals Summary',
      instruction:
        'You now understand the DeepMind 12 oscillator section. OSC 1 produces sawtooth and/or square waveforms; OSC 2 adds an independent square wave with its own pitch offset; and the noise generator adds pink noise. Use RANGE in the OSC EDIT menu to set octave, and blend OSC 2 LEVEL and NOISE LEVEL to shape your starting sound.',
      details:
        'Key takeaways: (1) SAWTOOTH — harmonically rich, great for basses, strings, and leads. (2) SQUARE — hollow and odd-harmonic, great for clarinets and nasal sounds. Both can run simultaneously on OSC 1. (3) OSC 2 is square-only with its own PITCH (-12 to +12 semitones) and LEVEL controls. (4) NOISE is pink noise, analog, useful for non-pitched and textural elements. (5) RANGE in OSC EDIT sets the base octave (16\' / 8\' / 4\'). (6) OSC 2 and NOISE default to Off — raise their level faders to bring them into the mix.',
      highlightControls: ['osc-sawtooth', 'osc-square', 'osc-pitch', 'osc-level', 'osc-noise', 'osc-edit'],
      panelStateChanges: {
        'osc-noise': { active: false },
      },
      displayState: {
        screenType: 'home',
        statusText: 'A-1  Default Program',
        selectedIndex: 1,
      },
      tipText: 'Tip: To hear the difference between SAWTOOTH and SQUARE, press each switch on and off while a note is held. For thicker sounds, enable both simultaneously on OSC 1, then add OSC 2 slightly detuned.',
    },
  ],
};
