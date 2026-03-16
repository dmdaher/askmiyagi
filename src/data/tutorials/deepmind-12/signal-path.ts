import { Tutorial } from '@/types/tutorial';

export const signalPath: Tutorial = {
  id: 'signal-path',
  deviceId: 'deepmind-12',
  title: 'Understanding the Signal Path',
  description:
    'Trace the complete analog signal flow of the DeepMind 12 — from the two oscillators and noise generator through the VCF filter, VCA amplifier, HPF, and DSP effects to the main output. Understand where each control sits in the chain.',
  category: 'synthesis',
  difficulty: 'intermediate',
  estimatedTime: '8 min',
  tags: ['signal-path', 'voice-architecture', 'analog', 'synthesis', 'intermediate', 'concept'],
  steps: [
    {
      id: 'step-1',
      title: 'The Signal Path Is Completely Analog',
      instruction:
        'The DeepMind 12 has a completely analog signal path from the oscillators to the main output — the DSP effects can be bypassed entirely to maintain a pure analog path. The voice structure is fully analog: OSC 1 + OSC 2 + Noise → VCF → VCA. After the VCA, all 12 voices are summed together before passing through the HPF, BOOST, and the DSP FX chain.',
      details:
        'Although the DeepMind 12 uses digital control (for accurate tuning and precise parameter storage), the actual audio signal never leaves the analog domain until it optionally enters the DSP effects stage. The DSP samples at 24-bit/48 kHz when active, and all internal DSP processing runs at 32/40-bit floating point resolution. When routing is set to BYPASS or ANALOG PATH mode, the DSP is completely sidestepped — no digital conversion occurs at all.',
      highlightControls: ['osc-sawtooth', 'osc-square', 'osc-noise', 'vcf-freq', 'vca-level'],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        statusText: 'A-1  Default Program',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-2',
      title: 'Stage 1: The Oscillators',
      instruction:
        'The signal begins at the oscillators. OSC 1 generates a SAWTOOTH and/or SQUARE waveform. OSC 2 generates a SQUARE waveform with its own independent PITCH and LEVEL controls. The NOISE generator produces pink noise. All three are mixed together before entering the VCF. The Arpeggiator determines which note (pitch) the oscillators play.',
      details:
        'Per voice: each of the 12 voices has its own pair of oscillators (OSC 1 + OSC 2) and its own noise generator. The faders in the OSC section — PITCH MOD, PWM, TONE MOD, PITCH, LEVEL, NOISE LEVEL — all control per-voice parameters. OSC 2 LEVEL and NOISE LEVEL default to Off; they must be raised to contribute to the mix. The SYNC switch (when active) hard-synchronizes OSC 2 to OSC 1, forcing OSC 2 to restart its waveform every time OSC 1 completes a cycle.',
      highlightControls: ['osc-sawtooth', 'osc-square', 'osc-noise', 'osc-edit'],
      panelStateChanges: {
        'osc-sawtooth': { active: true },
        'osc-square': { active: true },
        'osc-noise': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'A-1  Default Program',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-3',
      title: 'Stage 2: VCF — The Low-Pass Filter',
      instruction:
        'After the oscillators mix, the combined signal passes through the VCF (Voltage Controlled Filter). The VCF is a per-voice low-pass filter — each of the 12 voices has its own VCF. The FREQ fader sets the cutoff: frequencies above the cutoff are removed. RES adds resonance. The VCF is the primary tone-shaping stage, with its own envelope (VCF ENV) and LFO modulation.',
      details:
        'The VCF is switchable between 4-pole (24 dB/octave) and 2-pole (12 dB/octave) operation. In 4-pole mode, the filter cuts more aggressively — classic Moog-style. In 2-pole mode, more signal passes above the cutoff, creating a brighter, more natural character. The VCF FREQ default is 20000.0 Hz (fully open). The VCF also supports keyboard tracking (KYBD fader): higher notes can open the filter more, maintaining tonal consistency across the keyboard.',
      highlightControls: ['vcf-freq', 'vcf-res', 'vcf-edit'],
      panelStateChanges: {
        'osc-sawtooth': { active: false },
        'osc-square': { active: false },
        'osc-noise': { active: false },
        'vcf-freq': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'VCF FREQ: 500.0Hz',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-4',
      title: 'Stage 3: VCA — The Amplifier',
      instruction:
        'After the VCF, the signal passes through the VCA (Voltage Controlled Amplifier). The VCA is also per-voice. The VCA LEVEL fader controls the overall output level of the program (-12.0 dB to +6.0 dB). The VCA ENVELOPE shapes how the volume rises and falls over time — this is the amplitude shaping stage. Without VCA envelope modulation, notes would be completely static in volume.',
      details:
        'The VCA is split into two stages: a per-voice VCA (modulated by the VCA envelope and other sources) and a common VCA that corrects and compensates the level so it is consistent between programs. The VCA ENVELOPE-DEPTH parameter (in VCA EDIT) sets how much the VCA envelope modulates the per-voice VCA — the default is 255 (full depth). The VELOCITY-SENS setting controls how key velocity affects VCA level. PAN-SPREAD spreads the 12 voices across the stereo field.',
      highlightControls: ['vca-level', 'vca-edit'],
      panelStateChanges: {
        'vcf-freq': { active: false },
        'vca-level': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'VCA LEVEL: 2.50dB',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-5',
      title: 'Stage 4: HPF & BOOST — Global Shaping',
      instruction:
        'After the VCA, all 12 voices are summed together into a single stereo signal. This summed signal then passes through the HPF (High-Pass Filter) and BOOST stage — these are global controls that affect every voice simultaneously. The HPF removes low frequencies; the BOOST adds low-frequency warmth at 100 Hz. This is the last stage in the pure analog path.',
      details:
        'The position of the HPF after the VCA summing is important: it is not possible to have the HPF affect some voices but not others. It shapes the final mix of everything. The HPF FREQ range is 20–2000 Hz (default 20 Hz, fully open). The BOOST adds +6 dB at 100 Hz (default Off). After the HPF/BOOST stage, the signal can either go directly to the outputs (Analog Path) or enter the DSP effects chain.',
      highlightControls: ['hpf-freq', 'hpf-boost'],
      panelStateChanges: {
        'vca-level': { active: false },
        'hpf-freq': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'HPF FREQ: 20.0Hz',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-6',
      title: 'Stage 5: FX Engine — DSP Effects',
      instruction:
        'After the HPF/BOOST, the signal optionally passes through the DSP effects engine. The FX menu provides 4 effect slots (FX 1, FX 2, FX 3, FX 4) in series. There are 10 routing configurations (Modes M-1 to M-10), including INSERT (FX in the main signal path), SEND (FX applied to a send signal mixed back in), and BYPASS (DSP completely bypassed for a pure analog path). Press the FX menu button to explore.',
      details:
        'The three FX routing modes are: INSERT — analog path is off, digital path is on (all signal goes through DSP). SEND — both paths are on, the FX receive a copy of the signal (parallel processing). BYPASS — analog path is on, digital path is off (pure analog). This means you can use effects on some slots in send configuration while maintaining a portion of the dry analog signal simultaneously. When DSP is bypassed, no digital conversion occurs — the signal remains 100% analog.',
      highlightControls: ['prog-menu-fx'],
      panelStateChanges: {
        'hpf-freq': { active: false },
        'prog-menu-fx': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'FX OVERVIEW',
        menuItems: [
          { label: 'MODE    INSERT' },
          { label: 'FX 1    ------' },
          { label: 'FX 2    ------' },
          { label: 'FX 3    ------' },
          { label: 'FX 4    ------' },
        ],
        selectedIndex: 0,
        statusText: 'ANALOG PATH: OFF',
      },
    },
    {
      id: 'step-7',
      title: 'Signal Path Summary',
      instruction:
        'The complete DeepMind 12 signal path: (1) OSC 1 + OSC 2 + NOISE mix per voice → (2) VCF (per-voice low-pass filter) → (3) VCA (per-voice amplitude control) → (4) 12 voices summed → (5) HPF + BOOST (global) → (6) DSP FX (optional) → (7) VOLUME knob → Main Outputs & Headphones. The Modulation Matrix can route any source to any per-voice destination, adding movement throughout the chain.',
      details:
        'Understanding the signal path helps you troubleshoot sound design problems: if a sound has too much bass, try the HPF. If it is too bright or too dark, adjust the VCF FREQ. If the volume is inconsistent, check the VCA LEVEL and ENVELOPE-DEPTH. If there is no sound despite oscillators being active, check that the VCF FREQ is not set to minimum (50 Hz) and the VCA envelope is not stuck. The Mod Matrix (MOD switch) lets you view and configure all modulation connections between sources and destinations throughout the chain.',
      highlightControls: ['osc-sawtooth', 'vcf-freq', 'vca-level', 'hpf-freq', 'prog-menu-fx', 'prog-menu-mod'],
      panelStateChanges: {
        'prog-menu-fx': { active: false },
      },
      displayState: {
        screenType: 'home',
        statusText: 'A-1  Default Program',
        selectedIndex: 1,
      },
      tipText:
        'Tip: To hear the pure analog path with no effects, press FX and set the routing mode to BYPASS. All 4 FX slots are completely bypassed and the signal goes directly from the HPF/BOOST stage to the outputs — no digital conversion at all.',
    },
  ],
};
