import { Tutorial } from '@/types/tutorial';

export const filterFundamentals: Tutorial = {
  id: 'filter-fundamentals',
  deviceId: 'deepmind-12',
  title: 'VCF Filter — Cutoff, Resonance & Modes',
  description:
    'Shape your tone using the DeepMind 12 VCF: control cutoff frequency, add resonance (up to self-oscillation), switch between 4-pole and 2-pole modes, apply envelope and LFO modulation, and use keyboard tracking.',
  category: 'synthesis',
  difficulty: 'beginner',
  estimatedTime: '10 min',
  tags: ['filter', 'vcf', 'cutoff', 'resonance', 'synthesis', 'beginner', 'low-pass'],
  steps: [
    {
      id: 'step-1',
      title: 'Meet the VCF',
      instruction:
        'The VCF (Voltage Controlled Filter) shapes the tone of your sound by cutting frequencies above the cutoff point. The DeepMind 12 VCF is a fully analog low-pass filter, switchable between 4-pole (24 dB/octave) and 2-pole (12 dB/octave) operation. It can also self-oscillate at high resonance settings.',
      details:
        'The VCF section has five faders: FREQ (cutoff frequency), RES (resonance), ENV (envelope depth), LFO (LFO modulation depth), and KYBD (keyboard tracking). Below the faders are three switches: 2 POLE (4-pole vs 2-pole mode), EDIT (VCF PARAMETERS menu), and INVERT (envelope polarity). The default VCF FREQ is 20000.0 Hz — fully open, no filtering applied.',
      highlightControls: ['vcf-freq', 'vcf-res', 'vcf-env', 'vcf-lfo', 'vcf-kybd'],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        statusText: 'A-1  Default Program',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-2',
      title: 'VCF FREQ — Closing the Filter',
      instruction:
        'Move the VCF FREQ fader downward from its top position. As you lower it, frequencies above the cutoff point are removed from the sound. Moving it to the middle position creates a warm, muffled tone. Moving it near the bottom removes almost all high-frequency content, leaving a deep, dark rumble.',
      details:
        'The VCF FREQ range is 50.0 Hz to 20000.0 Hz. The default is 20000.0 Hz (fully open — no filtering). The PROG display shows the current cutoff value as you move the fader (e.g., "VCF FREQ: 500.0Hz"). The rate of cutoff depends on whether you are in 4-pole or 2-pole mode — with 4-pole, the slope is steeper (24 dB/oct) and the filtering sounds more dramatic.',
      highlightControls: ['vcf-freq'],
      panelStateChanges: {
        'vcf-freq': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'VCF FREQ: 500.0Hz',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-3',
      title: 'VCF RES — Adding Resonance',
      instruction:
        'Move the VCF RES fader upward. As resonance increases, the filter creates a peak — an emphasis — around the cutoff frequency. At low resonance, the peak adds a characteristic coloration. As you push toward the maximum, the DeepMind 12\'s filter can self-oscillate, creating a pure sine-wave-like tone at the cutoff frequency even with no audio input.',
      details:
        'The VCF RES range is 0.0% to 100.0%. Default is 0.0%. The DeepMind 12 is unique: even when self-oscillating, the filter maintains accurate pitch tracking across the full keyboard range — you can actually play it as a third oscillator. At self-oscillation, the resonance peak is so sharp it generates a pitched tone. The PROG display shows "VCF RESONANCE: 100.0%" at maximum. Reduce FREQ to around 500 Hz with RES at 90%+ to hear the resonance sing.',
      highlightControls: ['vcf-res'],
      panelStateChanges: {
        'vcf-res': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'VCF RESONANCE: 75.0%',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-4',
      title: '2-POLE Switch — Filter Character',
      instruction:
        'Press the 2 POLE switch to toggle between filter modes. When the switch is ON (illuminated), the filter uses 2-pole/12 dB-per-octave operation. When OFF, it uses the default 4-pole/24 dB-per-octave operation. The 2-pole mode sounds brighter and more open; the 4-pole mode sounds deeper and more dramatic.',
      details:
        'The 2-pole mode allows more signal above the cutoff frequency to pass through, making the sound feel more open and natural — like many vintage filters from the 1960s. The 4-pole mode cuts much more aggressively, creating the classic "sweeping" Moog-style low-pass character. The default program setting is Off (4-Pole). Try switching between modes while holding a chord to hear the immediate character difference. The LPF-TYPE parameter in VCF EDIT also reflects this setting.',
      highlightControls: ['vcf-2pole'],
      panelStateChanges: {
        'vcf-freq': { active: false },
        'vcf-res': { active: false },
        'vcf-2pole': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'A-1  Default Program',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-5',
      title: 'VCF ENV — Envelope Modulation Depth',
      instruction:
        'Move the VCF ENV fader upward. This controls how much the VCF envelope opens and closes the filter over time. With VCF FREQ at a low value and ENV fader raised, each note you play will open the filter during the attack stage and close again during the release — creating the classic "wah" filter sweep on every note.',
      details:
        'The VCF ENV range is 0.0% to 100.0%. Default is 0.0% (Off — no envelope modulation). The envelope that drives this is the VCF ENVELOPE — you can adjust its ADSR timing in the ENV section. The VCF ENV fader is the depth control: how wide the filter opens (or closes, when INVERT is active). Set VCF FREQ to 200 Hz, raise ENV to 80%, and play a note to hear the sweep. The PROG display shows "VCF ENV DEPTH: 60.0%".',
      highlightControls: ['vcf-env'],
      panelStateChanges: {
        'vcf-2pole': { active: false },
        'vcf-env': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'VCF ENV DEPTH: 60.0%',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-6',
      title: 'INVERT Switch — Envelope Polarity',
      instruction:
        'Press the INVERT switch (ON = inverted). When INVERT is on, the VCF envelope modulation is reversed: the filter closes on the attack (instead of opening) and reopens on the release. This creates a "dark attack brightening to light" effect — the opposite of the normal filter sweep.',
      details:
        'The INVERT switch default is On. This means the default program behavior already uses inverted envelope polarity for the VCF. With INVERT on and ENV fader raised, set a high VCF FREQ and a positive ENV depth — the filter will close downward during attack and release back up. This is useful for pluck and pizzicato sounds where you want the attack to be darker and the body to be brighter. When using INVERT, the manual recommends setting the VCF ENV fader to a higher level.',
      highlightControls: ['vcf-invert'],
      panelStateChanges: {
        'vcf-env': { active: false },
        'vcf-invert': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'A-1  Default Program',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-7',
      title: 'VCF LFO — Wah Modulation',
      instruction:
        'Move the VCF LFO fader upward. This modulates the filter cutoff frequency with an LFO, creating a rhythmic "wah" or "tremolo filter" effect. The speed of the modulation is controlled by the LFO rate. The LFO assigned to the filter is LFO 2 by default (set in VCF EDIT). Shortcut: hold VCF EDIT and move the LFO fader to quickly switch between LFO 1 and LFO 2.',
      details:
        'The VCF LFO range is 0.0% to 100.0%. Default is 0.0%. The LFO shape affects the wah character — a triangle LFO creates a smooth wah, a square LFO creates a staccato stepped-filter effect. At high LFO RATE and moderate VCF LFO depth, you can create tremolo-like filter vibrato. The PROG display shows "VCF LFO DEPTH: 40.0%" as you move the fader. To change LFO source quickly: press and hold VCF EDIT and move the LFO fader — the display will show "Move LFO fader to set Source."',
      highlightControls: ['vcf-lfo'],
      panelStateChanges: {
        'vcf-invert': { active: false },
        'vcf-lfo': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'VCF LFO DEPTH: 40.0%',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-8',
      title: 'VCF Filter Summary',
      instruction:
        'You now understand the DeepMind 12 VCF. The FREQ fader (50–20000 Hz) is your primary tonal sculpting tool. RES adds character and can self-oscillate. The 2-POLE switch changes the filter slope. ENV and LFO bring the filter alive over time. INVERT flips the envelope direction. The VCF EDIT menu holds advanced parameters including BASS-BOOST, VELOCITY-SENS, and LFO-SELECT.',
      details:
        'Key takeaways: (1) VCF FREQ: fully open at top (20 kHz), closed at bottom (50 Hz). (2) RES: 0–100%, capable of self-oscillation with pitch tracking. (3) 2-POLE: brighter 12 dB/oct slope; OFF (4-Pole) is the default darker 24 dB/oct slope. (4) ENV: depth of VCF envelope modulation (0–100%, default Off). (5) INVERT: flips envelope polarity — default is On. (6) LFO: rhythmic filter movement (0–100%, default Off). (7) VCF EDIT: BASS-BOOST, VELOCITY-SENS (default 128), LFO-SELECT (default LFO-2), P.BEND-FREQ.',
      highlightControls: ['vcf-freq', 'vcf-res', 'vcf-2pole', 'vcf-env', 'vcf-invert', 'vcf-lfo', 'vcf-kybd', 'vcf-edit'],
      panelStateChanges: {
        'vcf-lfo': { active: false },
      },
      displayState: {
        screenType: 'home',
        statusText: 'A-1  Default Program',
        selectedIndex: 1,
      },
      tipText: 'Tip: For keyboard tracking, raise the VCF KYBD fader. Higher notes will open the filter more — keeping the tonal character consistent as you play up and down the keyboard.',
    },
  ],
};
