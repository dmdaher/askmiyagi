import { Tutorial } from '@/types/tutorial';

export const vcaLevelPan: Tutorial = {
  id: 'vca-level-pan',
  deviceId: 'deepmind-12',
  title: 'VCA Level, Pan & Voice Spread',
  description:
    'Control overall output volume with the VCA LEVEL knob, shape dynamics with Envelope Depth and Velocity Sensitivity, and use PAN-SPREAD to position the 12 voices across the stereo field for width and movement.',
  category: 'sound-design',
  difficulty: 'beginner',
  estimatedTime: '7 min',
  tags: ['vca', 'level', 'pan', 'spread', 'velocity', 'envelope', 'stereo'],
  steps: [
    {
      id: 'step-1',
      title: 'VCA LEVEL — Output Volume',
      instruction:
        'Locate the VCA LEVEL knob in the VCA section of the panel. Turn it to adjust the program\'s overall output volume. The range is -12.0 dB to +6.0 dB, with the default at 0.0 dB (unity gain). This is the program-level volume — it scales the final output of the VCA envelope and the VCA EDIT parameters together.',
      details:
        'VCA LEVEL is saved per program. It is distinct from the PERF VOLUME control (which is a global master output level). Use VCA LEVEL to balance programs against each other so they all have a consistent output level — for example, a program with a dense sound that is naturally louder can be pulled down to -3 dB while a quiet pad is pushed up to +3 dB. At -12.0 dB the program is very quiet; at +6.0 dB it is boosted above unity which can cause clipping in the mix.',
      highlightControls: ['vca-level'],
      panelStateChanges: {
        'vca-level': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'VCA LEVEL: 0.0dB',
        selectedIndex: 0,
      },
    },
    {
      id: 'step-2',
      title: 'Opening VCA EDIT — Envelope Depth',
      instruction:
        'Press the VCA EDIT switch to open the VCA PARAMETERS menu. The first parameter is ENVELOPE-DEPTH (range 0-255, default 255). At 255, the VCA envelope fully controls the amplitude shape — attack, decay, sustain, and release. Lower values reduce the envelope\'s influence, making the VCA respond more like a gate (sustained at a constant level). Try setting ENVELOPE-DEPTH to 128 and play a note — the amplitude arc is compressed.',
      details:
        'ENVELOPE-DEPTH scales how much the VCA envelope (ENV section) modulates the VCA. At 255, the full ENV shape is applied. At 0, the envelope has no effect and the VCA stays at whatever level the VCA LEVEL knob sets (essentially open). This is useful for drone sounds or organ-style patches where you want consistent sustain regardless of envelope settings. Intermediate values allow partial envelope shaping — a fast attack envelope sounds more gradual when ENVELOPE-DEPTH is reduced.',
      highlightControls: ['vca-edit'],
      panelStateChanges: {
        'vca-level': { active: false },
        'vca-edit': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'VCA PARAMETERS',
        menuItems: [
          { label: 'ENVELOPE-DEPTH    255' },
          { label: 'VELOCITY-SENS     128' },
          { label: 'PAN-SPREAD          0' },
          { label: 'VCA-MODE  Transparent' },
        ],
        selectedIndex: 0,
        statusText: 'VCA PARAMETERS',
      },
    },
    {
      id: 'step-3',
      title: 'Velocity Sensitivity',
      instruction:
        'Navigate to VELOCITY-SENS (range 0-255, default 128). At 128, moderate key velocity differences produce moderate volume differences — typical keyboard response. Increase to 200-255 for extreme dynamic range: soft touches are very quiet, hard hits are very loud. Decrease to 50 or lower to make volume nearly constant regardless of how hard you play. At 0, all notes play at the same volume.',
      details:
        'VELOCITY-SENS scales how much the MIDI velocity of each note affects the VCA amplitude. At 0, all notes play at ENVELOPE-DEPTH level regardless of velocity. At 255, velocity differences create dramatic volume variation. This interacts with ENVELOPE-DEPTH: if ENVELOPE-DEPTH is low (e.g., 50), the VCA range is compressed, so even high VELOCITY-SENS values produce small absolute volume swings. For expressive pad playing, try VELOCITY-SENS = 80 to reduce dynamic range while retaining some feel. For percussion-style patches, use 220-255.',
      highlightControls: ['vca-edit'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'VCA PARAMETERS',
        menuItems: [
          { label: 'ENVELOPE-DEPTH    255' },
          { label: 'VELOCITY-SENS     200' },
          { label: 'PAN-SPREAD          0' },
          { label: 'VCA-MODE  Transparent' },
        ],
        selectedIndex: 1,
        statusText: 'VCA PARAMETERS',
      },
    },
    {
      id: 'step-4',
      title: 'PAN-SPREAD — Stereo Voice Width',
      instruction:
        'Navigate to PAN-SPREAD (range -128 to +127, default 0). Increase it to a positive value such as +80 — the 12 individual voices spread apart: voice 1 pans far left, voice 12 pans far right, and the remaining voices distribute evenly across the stereo field. Play a chord and listen to the width. Set it to a negative value (-80) to invert the spread: voices converge inward toward the centre.',
      details:
        'PAN-SPREAD distributes the 12 voices symmetrically across the stereo panorama. At 0 all voices are centred (mono). At +127 the spread is maximum — voices 1 and 12 are hard left and hard right, voices 6 and 7 are near-centre, and the others fill in between. At -128 the spread is maximum but inverted (highest-numbered voices on the left). The spread follows voice allocation order, not pitch order. For pad sounds, a moderate spread of +40 to +80 creates natural width. For lead sounds, keep at 0 for focused mono impact.',
      highlightControls: ['vca-edit'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'VCA PARAMETERS',
        menuItems: [
          { label: 'ENVELOPE-DEPTH    255' },
          { label: 'VELOCITY-SENS     200' },
          { label: 'PAN-SPREAD         80' },
          { label: 'VCA-MODE  Transparent' },
        ],
        selectedIndex: 2,
        statusText: 'VCA PARAMETERS',
      },
    },
    {
      id: 'step-5',
      title: 'VCA-MODE — Transparent vs BALLSY',
      instruction:
        'Navigate to VCA-MODE (default Transparent). Change it to BALLSY and play a note. In BALLSY mode the VCA circuit adds harmonic saturation and a more characterful, slightly compressed response — the output sounds thicker and more aggressive. Transparent mode is clean and linear. BALLSY mode is inspired by the warm colouration of vintage analogue VCAs.',
      details:
        'VCA-MODE: Transparent applies a clean, linear amplifier response — what goes in comes out at the correct scaled level with no tonal colouration. BALLSY applies a soft-saturation characteristic to the VCA, adding warmth and subtle harmonic content — particularly noticeable on transient-heavy sounds and leads. Neither mode changes the gain structure (VCA LEVEL, ENVELOPE-DEPTH, VELOCITY-SENS still work identically). The difference is in tonal character. For clinical, modern sounds use Transparent; for analogue-inspired warmth use BALLSY.',
      highlightControls: ['vca-edit'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'VCA PARAMETERS',
        menuItems: [
          { label: 'ENVELOPE-DEPTH    255' },
          { label: 'VELOCITY-SENS     200' },
          { label: 'PAN-SPREAD         80' },
          { label: 'VCA-MODE       BALLSY' },
        ],
        selectedIndex: 3,
        statusText: 'VCA PARAMETERS',
      },
    },
    {
      id: 'step-6',
      title: 'Modulating PAN-SPREAD with the Mod Matrix',
      instruction:
        'Press MOD to open the Mod Matrix. Add a row with SOURCE = LFO-1 and DESTINATION = VCA PAN. Set AMOUNT to +30. Now LFO 1 slowly pans the voices — when combined with PAN-SPREAD, each voice already has a different starting pan position and the LFO adds a global movement on top. This creates a slow rotating stereo field effect. Exit the Mod Matrix and adjust the LFO 1 RATE to taste.',
      details:
        'The Mod Matrix VCA PAN destination modulates the overall stereo position of the entire output. It does not change the relative spread of individual voices — it offsets all voices together. Combining a large PAN-SPREAD (e.g., +80) with a slow LFO PAN modulation gives each voice a different fixed offset within the spread, and the LFO moves the entire cluster left and right. For evolving stereo movement, use a slow sine or triangle LFO (0.1-0.5 Hz). For widening only with no movement, rely on PAN-SPREAD alone without LFO modulation.',
      highlightControls: ['prog-menu-mod', 'vca-edit', 'lfo1-rate'],
      panelStateChanges: {
        'vca-edit': { active: false },
        'prog-menu-mod': { active: true },
        'lfo1-rate': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'MOD MATRIX',
        menuItems: [
          { label: 'SRC: LFO-1' },
          { label: 'DST: VCA PAN' },
          { label: 'AMT: +30' },
        ],
        selectedIndex: 0,
        statusText: 'MOD MATRIX',
      },
      tipText:
        'Tip: For an instant wide, lush pad: set PAN-SPREAD = +64, VCA-MODE = BALLSY, ENVELOPE-DEPTH = 220, VELOCITY-SENS = 70, and add a slow LFO on VCA PAN at +20. The result is a thick, gently moving stereo pad with natural dynamics.',
    },
  ],
};
