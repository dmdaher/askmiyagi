import { Tutorial } from '@/types/tutorial';

export const oscillatorMixing: Tutorial = {
  id: 'oscillator-mixing',
  deviceId: 'deepmind-12',
  title: 'OSC Mixing, Noise & Detune',
  description:
    'Go deeper into the DeepMind 12 oscillator section: blend OSC 2 level, add pink noise, apply oscillator sync, and use OSC EDIT shortcuts to set pitch modulation and pulse width modulation sources.',
  category: 'synthesis',
  difficulty: 'intermediate',
  estimatedTime: '10 min',
  tags: ['oscillator', 'sync', 'pwm', 'pitch-mod', 'noise', 'detune', 'synthesis', 'intermediate'],
  steps: [
    {
      id: 'step-1',
      title: 'Blend OSC 2 into the Mix',
      instruction:
        'Move the OSC 2 LEVEL fader up from its default Off position. The OSC 2 SQUARE waveform is now audible alongside OSC 1. At 0.0 dB, OSC 2 is equal in level to OSC 1. Try detuning OSC 2 slightly with the PITCH fader — even a few cents creates a thickening "beating" effect as the two frequencies interact.',
      details:
        'The OSC 2 LEVEL range is Off or -48 dB to 0.0 dB. The default is Off (completely silent). The PROG display shows the current level as you move the fader (e.g., "OSC2 LEVEL: -12.0dB"). Setting OSC 2 PITCH to exactly +12 semitones and blending OSC 2 LEVEL creates a classic sub-octave layer. Setting it to +7 semitones creates an open-fifth harmony.',
      highlightControls: ['osc-level', 'osc-pitch'],
      panelStateChanges: {
        'osc-level': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'OSC2 LEVEL: -12.0dB',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-2',
      title: 'OSC 1 PWM — Pulse Width Modulation',
      instruction:
        'Make sure the OSC 1 SQUARE waveform is active. Now move the OSC 1 PWM fader. When the PWM source is set to MANUAL (the default), this fader directly controls the pulse width of the SQUARE waveform. Moving from center (50%) toward maximum (99%) narrows the pulse — the sound becomes thinner and more nasal. The SAWTOOTH waveform is not affected by PWM.',
      details:
        'The OSC 1 PWM range is from 50.0% (symmetrical square wave) to 99.0% (very narrow pulse). The default setting is 50.0%. At 50%, the wave has the typical hollow square character. At 99%, it becomes very thin — sometimes described as a "buzzing" reed quality. The display shows "OSC1 PWM: 72.6%" as you move the fader. When an LFO or envelope is set as the PWM source, the fader controls modulation depth from 0 to ±49%, not the absolute pulse width.',
      highlightControls: ['osc-pwm', 'osc-square'],
      panelStateChanges: {
        'osc-level': { active: false },
        'osc-pwm': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'OSC1 PWM: 72.6%',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-3',
      title: 'OSC 1 Pitch Mod — Vibrato Depth',
      instruction:
        'Move the OSC 1 PITCH MOD fader upward. This controls the amount of pitch modulation (vibrato) applied to OSC 1. The source is LFO-1 by default — you will hear the pitch fluctuate at the LFO rate as you raise the fader. The range is 0.00 cents to 36.0 semitones. The fader has a non-linear response: small amounts give subtle vibrato, larger amounts give dramatic pitch sweeps.',
      details:
        'The OSC 1 PITCH MOD default source is ENV-1 — the VCA envelope. To get the classic LFO vibrato effect, you will need to change the source to LFO-1 or LFO-2 using the shortcut in the next step. The PITCH MOD fader also affects the SAWTOOTH waveform — it modulates the pitch of both the sawtooth and the square waveforms from OSC 1 simultaneously. The display shows "OSC1 PM: +- 4.5semi" with an arrow visualization.',
      highlightControls: ['osc-pitch-mod'],
      panelStateChanges: {
        'osc-pwm': { active: false },
        'osc-pitch-mod': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'OSC1 PM: +- 4.5semi',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-4',
      title: 'Shortcut: Change Pitch Mod Source',
      instruction:
        'Press and hold the OSC EDIT switch, then move the OSC 1 PITCH MOD fader. The display shows the current P.MOD-SRC and prompts you to select a new one by moving the fader. Move it to select LFO-1 (bipolar LFO 1 modulation) for classic vibrato. Release OSC EDIT when done. This is faster than navigating the full OSC EDIT menu.',
      details:
        'The available P.MOD-SRC options in the OSC 1 EDIT menu are: LFO-1 (bipolar), LFO-2 (bipolar), ENV-1 (unipolar), ENV-2 (unipolar), ENV-3 (unipolar), LFO-1(Uni) (unipolar), LFO-2(Uni) (unipolar). The default is ENV-1. While holding OSC EDIT, you can also move the PWM fader to change PWM-SRC, or move the OSC 2 TONE MOD fader to change OSC 2 T.MOD-SRC — all without leaving the live performance view. The display shows "[OSC] HOLD EDIT + move faders to set sources".',
      highlightControls: ['osc-edit', 'osc-pitch-mod'],
      panelStateChanges: {
        'osc-edit': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'OSC1 PM: +- 4.5semi',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-5',
      title: 'OSC 2 TONE MOD — Timbre Modulation',
      instruction:
        'Press PROG to return to the main display. Move the OSC 2 TONE MOD fader. This modulates the duty cycle of the OSC 2 SQUARE waveform continuously — the positive and negative parts of the cycle are split by a pulse, creating a metallic, double-phasing harmonic character. At 50% (center) the wave is a symmetrical square; at 100% it becomes a very narrow pulse interrupt.',
      details:
        'The TONE MOD range is from 50% (symmetrical square wave) to 100% (maximum pulse interruption). The default TONE MOD setting is 50%. The TONE MOD SOURCE is selected in the OSC 2 PARAMETERS page of the OSC EDIT menu — the same shortcut applies: hold OSC EDIT and move the TONE MOD fader. When an LFO is set as the T.MOD-SRC, the fader sets modulation depth from 0 to ±49%. The display shows "OSC2 TONE MOD: +/- 49" when an LFO source is active.',
      highlightControls: ['osc-tone-mod'],
      panelStateChanges: {
        'osc-edit': { active: false },
        'osc-pitch-mod': { active: false },
        'osc-tone-mod': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'OSC2 TONE MOD: 100.0%',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-6',
      title: 'OSC SYNC — Hard Sync',
      instruction:
        'Press the SYNC switch. The LED illuminates to show sync is active. In SYNC mode, OSC 2 is forcibly re-triggered every time OSC 1 completes a cycle. Now sweep OSC 2 PITCH up and down — you will hear the classic "sync sweep" harmonic timbres change dramatically. The pitch of OSC 1 determines the fundamental; the OSC 2 PITCH controls the harmonic profile.',
      details:
        'SYNC works as follows: OSC 1 is the master — its pitch is set by the keyboard. OSC 2 is the slave — every time OSC 1 completes a cycle, OSC 2 resets to the beginning of its own cycle. If OSC 2 is tuned to a lower frequency than OSC 1, it is re-triggered before completing a cycle. If OSC 2 is tuned higher, it is re-triggered during a later cycle. This creates complex, harmonically rich timbres. The default program setting for SYNC is Off. The effect is most dramatic when sweeping OSC 2 PITCH while holding a note.',
      highlightControls: ['osc-sync'],
      panelStateChanges: {
        'osc-tone-mod': { active: false },
        'osc-sync': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'A-1  Default Program',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-7',
      title: 'NOISE LEVEL — Adding Pink Noise',
      instruction:
        'Press SYNC to turn it off, then move the NOISE LEVEL fader up. The DeepMind 12 noise generator uses fully analog circuitry to produce pink noise — a soft, rushing sound with equal energy per octave, like a waterfall or wind. Raise NOISE LEVEL while keeping the VCF FREQ at a medium position to blend in textural noise with your oscillator sound.',
      details:
        'The NOISE LEVEL range is Off or -48.1 dB to 0.0 dB. The default is Off. Pink noise is gentler than white noise because it has a gradual high-frequency roll-off. It is ideal for: breath and attack transients in wind instrument emulations; textural pads; snare drum components; and adding an analog "live" quality to otherwise static pads. The display shows "NOISE LEVEL: 0.0dB" at maximum. Try raising NOISE with VCF FREQ very low for a deep subsonic whoosh layer.',
      highlightControls: ['osc-noise'],
      panelStateChanges: {
        'osc-sync': { active: false },
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
      title: 'OSC Mixing Summary',
      instruction:
        'You now understand the full oscillator mixing and modulation system. OSC 2 LEVEL blends in the second oscillator; PWM shapes the pulse width of the SQUARE; OSC 1 PITCH MOD creates vibrato; OSC 2 TONE MOD adds metallic timbre; SYNC locks the two oscillators for harmonic sweeps; and NOISE LEVEL adds analog texture. The OSC EDIT shortcut — hold OSC EDIT and move faders — lets you change modulation sources without entering the menu.',
      details:
        'Quick reference: OSC 2 LEVEL (Off to 0 dB, default Off) — blend second oscillator. OSC 1 PWM (50% to 99%, default 50%) — pulse width, only affects SQUARE. OSC 1 PITCH MOD (0 to 36 semitones, default 0) — pitch modulation depth. OSC 2 TONE MOD (50% to 100%, default 50%) — timbre modulation depth. SYNC (On/Off, default Off) — OSC 2 hard-sync to OSC 1. NOISE (Off to 0 dB, default Off) — pink noise. Shortcut: hold OSC EDIT + move a modulation fader to change its source on the fly.',
      highlightControls: ['osc-level', 'osc-pwm', 'osc-pitch-mod', 'osc-tone-mod', 'osc-sync', 'osc-noise', 'osc-edit'],
      panelStateChanges: {
        'osc-noise': { active: false },
      },
      displayState: {
        screenType: 'home',
        statusText: 'A-1  Default Program',
        selectedIndex: 1,
      },
      tipText:
        'Tip: For a classic "sync sweep" lead sound, activate SYNC, set OSC 1 to SAWTOOTH, enable OSC 2 LEVEL, and slowly sweep OSC 2 PITCH while playing. The resulting harmonics change dramatically with each semitone of movement.',
    },
  ],
};
