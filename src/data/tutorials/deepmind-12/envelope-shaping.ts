import { Tutorial } from '@/types/tutorial';

export const envelopeShaping: Tutorial = {
  id: 'envelope-shaping',
  deviceId: 'deepmind-12',
  title: 'Shaping Sound with ADSR Envelopes',
  description:
    'Master the DeepMind 12\'s three-envelope system. The ATTACK, DECAY, SUSTAIN, and RELEASE faders are physically shared — the active envelope (VCA, VCF, or MOD) is selected by pressing its switch. Learn to shape amplitude, filter, and modulation envelopes, plus the CURVES mode for advanced envelope sculpting.',
  category: 'synthesis',
  difficulty: 'intermediate',
  estimatedTime: '12 min',
  tags: ['envelope', 'adsr', 'vca', 'vcf', 'mod', 'curves', 'synthesis', 'intermediate'],
  steps: [
    {
      id: 'step-1',
      title: 'The Shared ADSR System',
      instruction:
        'The DeepMind 12 has THREE independent envelope generators — VCA, VCF, and MOD — but only ONE set of physical faders: ATTACK (A), DECAY (D), SUSTAIN (S), and RELEASE (R). These four faders are shared. The envelope you are editing is selected by pressing its switch: VCA, VCF, or MOD. Whichever switch is illuminated, the ADSR faders control THAT envelope.',
      details:
        'This is the single most important concept in the DeepMind 12 synthesis section. Each envelope generator (VCA, VCF, MOD) has its own completely independent ADSR settings stored in memory. You access each one by pressing its switch. ATTACK, DECAY, and RELEASE measure TIME. SUSTAIN measures LEVEL. The envelope stages are: Attack (rise from 0 to peak), Decay (fall from peak to Sustain level), Sustain (held level while key is down), Release (fall from Sustain level to 0 after key release).',
      highlightControls: ['env-vca', 'env-vcf', 'env-mod', 'env-attack', 'env-decay', 'env-sustain', 'env-release'],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        statusText: 'A-1  Default Program',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-2',
      title: 'VCA Envelope — Shaping Volume Over Time',
      instruction:
        'Press the VCA switch in the ENV section. The switch illuminates, and the ADSR faders now control the VCA (amplitude) envelope. Move the ATTACK fader upward — you will hear the sound fade in slowly instead of starting instantly. This controls how long the sound takes to reach its maximum level after you press a key.',
      details:
        'Pressing the VCA switch also opens the VCA ENVELOPE menu in the display, showing the current ADSR values and CURV values. The display shows: ADSR: ATK DCY SUS REL with current values, and below it CURV: ATK DCY SUS REL curve values. The VCA envelope controls the amplitude of each voice over time. A short attack gives a punchy, immediate sound; a long attack creates a slow fade-in (like bowing a string or swelling a pad).',
      highlightControls: ['env-vca', 'env-attack'],
      panelStateChanges: {
        'env-vca': { active: true },
        'env-attack': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'VCA ENVELOPE',
        menuItems: [
          { label: 'VCA-ENV-TRIG   Key' },
          { label: 'ADSR ATK  DCY  SUS  REL' },
          { label: 'ADSR  64  128  128  128' },
          { label: 'CURV 128    0  128    0' },
        ],
        selectedIndex: 0,
        statusText: 'VCA ATTACK: 2.50s',
      },
    },
    {
      id: 'step-3',
      title: 'DECAY and SUSTAIN — Shaping the Body',
      instruction:
        'Still in VCA envelope mode. Move the DECAY fader — this sets how quickly the level drops from its peak after the initial attack. Then move the SUSTAIN fader — this sets the held level while the key is pressed. Lower SUSTAIN means the sound gets quieter after the attack peak; higher SUSTAIN keeps it at near-full volume.',
      details:
        'Think of a piano: the ATTACK is instant (the hammer strike). The DECAY is the rapid fall after the initial impact. The SUSTAIN is the resonating level the string holds while the key is depressed. On a synthesizer, a typical bright lead uses: short ATTACK (punchy), medium DECAY, low-to-medium SUSTAIN (sound thins out), medium RELEASE. A pad uses: long ATTACK, long DECAY, high SUSTAIN (full volume throughout), long RELEASE (trails off after key lift).',
      highlightControls: ['env-decay', 'env-sustain'],
      panelStateChanges: {
        'env-attack': { active: false },
        'env-decay': { active: true },
        'env-sustain': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'VCA ENVELOPE',
        menuItems: [
          { label: 'VCA-ENV-TRIG   Key' },
          { label: 'ADSR ATK  DCY  SUS  REL' },
          { label: 'ADSR  64   64  100  128' },
          { label: 'CURV 128    0  128    0' },
        ],
        selectedIndex: 0,
        statusText: 'VCA DECAY: 1.00s',
      },
    },
    {
      id: 'step-4',
      title: 'RELEASE — The Tail After the Key Lifts',
      instruction:
        'Move the RELEASE fader. This sets how long the sound takes to fade to silence after you release a key. A short RELEASE creates a staccato effect — the sound cuts off immediately. A long RELEASE creates a sustained reverb-like tail. Try holding a chord, then lifting your fingers: a high RELEASE value will let the sound ring out gently.',
      details:
        'The RELEASE fader is the R in ADSR. Together with DECAY and SUSTAIN, it defines how the sound behaves over the course of a note. Short RELEASE is used for percussion, pluck sounds, and staccato playing. Long RELEASE is used for pads, strings, and any sound where you want natural decay after key release. Note: the HOLD switch in the ARP/SEQ section, when enabled, will hold notes in their SUSTAIN phase even after key release — useful for sound design.',
      highlightControls: ['env-release'],
      panelStateChanges: {
        'env-decay': { active: false },
        'env-sustain': { active: false },
        'env-release': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'VCA ENVELOPE',
        menuItems: [
          { label: 'VCA-ENV-TRIG   Key' },
          { label: 'ADSR ATK  DCY  SUS  REL' },
          { label: 'ADSR  64   64  100  200' },
          { label: 'CURV 128    0  128    0' },
        ],
        selectedIndex: 0,
        statusText: 'VCA RELEASE: 4.00s',
      },
    },
    {
      id: 'step-5',
      title: 'VCF Envelope — The Same Faders, Different Destination',
      instruction:
        'Press the VCF switch in the ENV section. The VCA switch deactivates and the VCF switch illuminates. Now the SAME ADSR faders control the VCF (filter) envelope — the values are completely independent from the VCA envelope. Set ATTACK low, DECAY medium, SUSTAIN low, and RELEASE short to create a classic filter sweep that opens on each note and closes quickly.',
      details:
        'The VCF ENVELOPE menu appears on the display showing the VCF envelope\'s stored ADSR values (separate from the VCA envelope). The VCF envelope controls how much the filter cutoff changes over time — this is what creates the classic "wah" envelope sweep. For the VCF envelope to have an audible effect, the VCF ENV fader (in the VCF section) must be raised above 0%. The VCF-ENV-TRIG parameter in the menu controls the trigger mode (Key/LFO-1/LFO-2/Loop/Seq).',
      highlightControls: ['env-vcf', 'env-attack', 'env-decay', 'env-sustain', 'env-release'],
      panelStateChanges: {
        'env-vca': { active: false },
        'env-vcf': { active: true },
        'env-attack': { active: true },
        'env-decay': { active: true },
        'env-sustain': { active: true },
        'env-release': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'VCF ENVELOPE',
        menuItems: [
          { label: 'VCF-ENV-TRIG   Key' },
          { label: 'ADSR ATK  DCY  SUS  REL' },
          { label: 'ADSR   0  128  128  128' },
          { label: 'CURV 128    0  128    0' },
        ],
        selectedIndex: 0,
        statusText: 'VCF ATTACK: 0.00s',
      },
    },
    {
      id: 'step-6',
      title: 'MOD Envelope — General Purpose Modulation',
      instruction:
        'Press the MOD switch in the ENV section. The VCF switch deactivates and the MOD switch illuminates. The ADSR faders now control the MOD (modulation) envelope — a general-purpose envelope that can be routed to any destination in the Mod Matrix. It has no fixed destination; it becomes the source "Env 3" in the Mod Matrix.',
      details:
        'The MOD envelope is the most flexible of the three — it is not pre-wired to anything. You must connect it in the Mod Matrix (press the MOD switch below the DATA ENTRY fader). For example, route Env 3 to OSC1+2 Pitch to create a pitch bend that follows your envelope shape on each note. Or route it to VCF Resonance for a resonance sweep. The MOD-ENV-TRIG parameter controls how it is triggered (Key/LFO-1/LFO-2/Loop/Seq — Loop mode is especially useful for rhythmic modulation).',
      highlightControls: ['env-mod', 'env-attack', 'env-decay', 'env-sustain', 'env-release'],
      panelStateChanges: {
        'env-vcf': { active: false },
        'env-mod': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'MOD ENVELOPE',
        menuItems: [
          { label: 'MOD-ENV-TRIG   Key' },
          { label: 'ADSR ATK  DCY  SUS  REL' },
          { label: 'ADSR   0  128  128  128' },
          { label: 'CURV 128    0  128    0' },
        ],
        selectedIndex: 0,
        statusText: 'MOD ATTACK: 0.00s',
      },
    },
    {
      id: 'step-7',
      title: 'CURVES Mode — Shaping Envelope Slopes',
      instruction:
        'Press the VCA switch to return to the VCA envelope. Then press the CURVES switch. The CURVES switch illuminates — now the ADSR faders control the CURVE SHAPE of each stage rather than the time/level. Move the ATTACK fader to change from logarithmic (0) to linear (128) to exponential (255) attack shapes. Press CURVES again to return to normal ADSR mode.',
      details:
        'CURVES mode: ATTACK fader = CURV ATK (attack curve shape), DECAY fader = CURV DCY (decay curve), SUSTAIN fader = CURV SUS (sustain slope), RELEASE fader = CURV REL (release curve). The curve range is 0–255. At 0, the attack shape is a pure logarithmic curve (fast initial rise, then gradual). At 128, it is linear. At 255, it is exponential (slow rise then fast completion). The VCA ENVELOPE menu shows both ADSR and CURV rows, so you can see both at once. To exit CURVES mode, press the CURVES switch again.',
      highlightControls: ['env-vca', 'env-curves', 'env-attack', 'env-decay', 'env-sustain', 'env-release'],
      panelStateChanges: {
        'env-mod': { active: false },
        'env-vca': { active: true },
        'env-curves': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'VCA ENVELOPE',
        menuItems: [
          { label: 'VCA-ENV-TRIG   Key' },
          { label: 'ADSR ATK  DCY  SUS  REL' },
          { label: 'ADSR  64   64  100  200' },
          { label: 'CURV 193  204  169  255' },
        ],
        selectedIndex: 0,
        statusText: 'VCA ATTACK CURVE: 193',
      },
    },
    {
      id: 'step-8',
      title: 'Envelope Shaping Summary',
      instruction:
        'You have mastered the DeepMind 12 envelope system. Three independent envelopes share one set of ADSR faders — VCA controls amplitude, VCF controls filter cutoff, MOD is free-routeable. Press VCA, VCF, or MOD to switch which envelope the faders edit. Use CURVES mode to sculpt the shape of each stage beyond simple linear slopes.',
      details:
        'Key takeaways: (1) ONE set of ADSR faders serves THREE envelopes (VCA, VCF, MOD) — the active envelope is selected by its switch. (2) ATTACK = rise time. DECAY = fall after attack peak. SUSTAIN = held level. RELEASE = fade after key lift. (3) VCA envelope drives amplitude. VCF envelope drives the filter cutoff (requires VCF ENV fader raised). MOD envelope is a free source for the Mod Matrix. (4) CURVES mode transforms the faders to control curve shapes (logarithmic/linear/exponential) for each ADSR stage. (5) ENV-TRIG options (Key/LFO/Loop/Seq) control what triggers each envelope — Loop creates a repeating envelope without needing a key press.',
      highlightControls: ['env-vca', 'env-vcf', 'env-mod', 'env-attack', 'env-decay', 'env-sustain', 'env-release', 'env-curves'],
      panelStateChanges: {
        'env-curves': { active: false },
        'env-vca': { active: false },
      },
      displayState: {
        screenType: 'home',
        statusText: 'A-1  Default Program',
        selectedIndex: 1,
      },
      tipText: 'Tip: To compare envelope settings across VCA, VCF, and MOD quickly — press each switch in turn and read the ADSR values shown in the display. You can make fine adjustments using the rotary encoder instead of faders for precise control.',
    },
  ],
};
