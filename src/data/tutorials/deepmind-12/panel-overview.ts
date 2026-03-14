import { Tutorial } from '@/types/tutorial';

export const panelOverview: Tutorial = {
  id: 'panel-overview',
  deviceId: 'deepmind-12',
  title: 'Getting to Know the DeepMind 12 Panel',
  description:
    'Take a guided tour of the Behringer DeepMind 12 front panel. Learn where the oscillators, filter, envelopes, arpeggiator, programmer, and performance controls are located.',
  category: 'basics',
  difficulty: 'beginner',
  estimatedTime: '4 min',
  tags: ['overview', 'panel', 'controls', 'beginner', 'synthesizer'],
  steps: [
    {
      id: 'step-1',
      title: 'Welcome to the DeepMind 12',
      instruction:
        'This tutorial gives you a guided tour of the DeepMind 12 front panel. Each step highlights a different section so you can learn your way around this 12-voice analog polyphonic synthesizer.',
      details:
        'The DeepMind 12 has 10 main areas: Performance controls (wheels), Arpeggiator/Sequencer, two LFOs, Oscillators, Programmer (display & navigation), Polyphony, VCF (filter), VCA, HPF (high-pass filter), and Envelopes. A VOICES LED strip shows voice allocation, and the 49-key keyboard spans C2 to C6.',
      highlightControls: [],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        statusText: 'Init Program',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-2',
      title: 'Performance Controls',
      instruction:
        'On the far left is the Performance section. It includes Pitch and Mod wheels, a Portamento slider, a Volume knob, and Octave shift buttons.',
      details:
        'The Pitch wheel springs back to center when released. The Mod wheel sends modulation (typically vibrato). The Portamento slider controls glide time between notes. Five LEDs above show the current octave shift.',
      highlightControls: [
        'perf-pitch',
        'perf-mod',
        'perf-portamento',
        'perf-volume',
        'perf-oct-down',
        'perf-oct-up',
      ],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        statusText: 'Init Program',
        selectedIndex: 1,
      },
      tipText: 'The octave LEDs show your current transpose: center LED = no shift.',
    },
    {
      id: 'step-3',
      title: 'Arpeggiator / Sequencer',
      instruction:
        'The ARP/SEQ section has Rate and Gate Time sliders to shape arpeggio patterns, plus CHORD and POLY CHORD buttons for chord memory, and ON/OFF, TAP, and EDIT controls.',
      details:
        'Turn the arpeggiator on with ON/OFF. Rate controls speed, Gate Time controls note length. CHORD lets you memorize and trigger chords. TAP sets tempo by tapping. EDIT opens the full arp/seq parameter menu.',
      highlightControls: [
        'arp-rate',
        'arp-gate-time',
        'arp-on-off',
        'arp-tap-hold',
        'arp-edit',
        'arp-chord',
        'arp-poly-chord',
      ],
      panelStateChanges: {
        'arp-on-off': { active: true, ledOn: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'Init Program',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-4',
      title: 'LFO 1 & LFO 2',
      instruction:
        'Two identical LFO sections provide low-frequency modulation. Each has waveform selection LEDs, Rate and Delay sliders, and an EDIT button for deeper parameters.',
      details:
        'The waveform LEDs on the left show the selected shape: sine, triangle, sawtooth, square, sample & hold, or random. Rate controls speed, Delay sets how long before the LFO kicks in after a key press. LFO 1 typically modulates pitch or filter; LFO 2 adds a second modulation source.',
      highlightControls: [
        'lfo1-rate',
        'lfo1-delay',
        'lfo1-edit',
        'lfo2-rate',
        'lfo2-delay',
        'lfo2-edit',
      ],
      panelStateChanges: {
        'arp-on-off': { active: false, ledOn: false },
      },
      displayState: {
        screenType: 'home',
        statusText: 'Init Program',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-5',
      title: 'Oscillators (OSC 1 & 2)',
      instruction:
        'The OSC section controls both oscillators. Six sliders shape the sound: PWM (pulse width modulation), Pitch Mod, Tone Mod, Pitch, Level, and Noise. Waveform buttons select Square or Sawtooth waves.',
      details:
        'PWM adds movement to square waves. Pitch and Tone Mod sliders route modulation from LFOs or envelopes. The PITCH slider detunes OSC 2 relative to OSC 1. LEVEL sets the oscillator mix, and NOISE adds white noise. SYNC locks OSC 2 to OSC 1 for harder timbres. Press EDIT for detailed oscillator parameters.',
      highlightControls: [
        'osc-pwm',
        'osc-pitch-mod',
        'osc-tone-mod',
        'osc-pitch',
        'osc-level',
        'osc-noise',
        'osc-square',
        'osc-sawtooth',
        'osc-sync',
        'osc-edit',
      ],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        statusText: 'Init Program',
        selectedIndex: 1,
      },
      tipText: 'Both oscillators can be active simultaneously for rich, layered tones.',
    },
    {
      id: 'step-6',
      title: 'Programmer & Display',
      instruction:
        'The Programmer is the central hub. It has the LCD display, a Data Entry slider, a rotary encoder, navigation buttons, and bank select buttons. Below the display are the menu buttons: PROG, FX, GLOBAL, COMPARE, WRITE, and MOD.',
      details:
        'Use the Data Entry slider or rotary encoder to change values. The display shows program names, parameters, and menus. BANK buttons cycle through program banks. The six menu buttons access different editor pages. WRITE saves your edits, COMPARE toggles between edited and saved states.',
      highlightControls: [
        'display',
        'prog-data-entry',
        'prog-rotary',
        'prog-nav-up',
        'prog-nav-down',
        'prog-nav-no',
        'prog-nav-yes',
        'prog-bank-up',
        'prog-bank-down',
        'prog-menu-prog',
        'prog-menu-fx',
        'prog-menu-global',
        'prog-menu-write',
      ],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        statusText: 'Init Program',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-7',
      title: 'Polyphony Section',
      instruction:
        'The POLY section has a Unison slider and an EDIT button. The Unison slider controls how many voices are stacked per note for thicker sounds.',
      details:
        'At zero unison, each note uses one voice (12-note polyphony). Increase unison to stack voices per note, reducing polyphony but adding thickness and detuning. Press EDIT for voice allocation modes and detune settings.',
      highlightControls: ['poly-unison', 'poly-edit'],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        statusText: 'Init Program',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-8',
      title: 'VCF (Voltage-Controlled Filter)',
      instruction:
        'The VCF section shapes your tone with five sliders: Frequency (cutoff), Resonance, Envelope amount, LFO amount, and Keyboard tracking. Buttons toggle 2-POLE mode, INVERT envelope polarity, and open EDIT.',
      details:
        'FREQ controls the filter cutoff \u2014 the most important sound-shaping parameter. RES adds emphasis at the cutoff point. ENV routes the filter envelope to cutoff. LFO modulates the filter with the LFO. KYBD makes the filter track the keyboard pitch. 2-POLE switches from 4-pole (24dB/oct) to gentler 2-pole (12dB/oct).',
      highlightControls: [
        'vcf-freq',
        'vcf-res',
        'vcf-env',
        'vcf-lfo',
        'vcf-kybd',
        'vcf-2pole',
        'vcf-invert',
        'vcf-edit',
      ],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        statusText: 'Init Program',
        selectedIndex: 1,
      },
      tipText: 'The VCF is the heart of subtractive synthesis \u2014 sweep the cutoff to hear its effect.',
    },
    {
      id: 'step-9',
      title: 'VCA & HPF',
      instruction:
        'The VCA section has a single Level slider controlling the output amplitude envelope amount. The HPF (High-Pass Filter) section has a Frequency slider and a BOOST button.',
      details:
        'VCA Level sets how much the amplitude envelope shapes the volume. HPF removes low frequencies \u2014 useful for thinning out pads or removing bass rumble. BOOST adds resonance emphasis at the HPF cutoff.',
      highlightControls: [
        'vca-level',
        'vca-edit',
        'hpf-freq',
        'hpf-boost',
      ],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        statusText: 'Init Program',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-10',
      title: 'Envelopes',
      instruction:
        'The ENVELOPES section has four ADSR sliders (Attack, Decay, Sustain, Release) and curve shape icons. Buttons along the bottom select which envelope you are editing: VCA, VCF, or MOD. CURVES opens curve shape selection.',
      details:
        'Attack = how quickly the sound reaches full level. Decay = how long it takes to fall to the sustain level. Sustain = the held level while a key is pressed. Release = how long the sound fades after releasing the key. The three envelopes (VCA, VCF, MOD) can each have different ADSR shapes. Curve icons on the right show exponential, linear, or reverse curves.',
      highlightControls: [
        'env-attack',
        'env-decay',
        'env-sustain',
        'env-release',
        'env-vca',
        'env-vcf',
        'env-mod',
        'env-curves',
      ],
      panelStateChanges: {
        'env-vca': { active: true, ledOn: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'Init Program',
        selectedIndex: 1,
      },
      tipText: 'Switch between VCA, VCF, and MOD to set different envelopes for amplitude, filter, and modulation.',
    },
    {
      id: 'step-11',
      title: 'Voices & Keyboard',
      instruction:
        'Below the control surface, the VOICES LED strip shows which of the 12 analog voices are currently active. The 49-key velocity-sensitive keyboard spans C2 to C6.',
      details:
        'Each LED represents one of the 12 analog voices. When you play notes, the corresponding voice LEDs light up green, showing voice allocation in real time. The keyboard supports velocity for expressive playing.',
      highlightControls: [
        'voice-led-1',
        'voice-led-6',
        'voice-led-12',
      ],
      panelStateChanges: {
        'env-vca': { active: false, ledOn: false },
        'voice-led-1': { active: true, ledOn: true },
        'voice-led-2': { active: true, ledOn: true },
        'voice-led-3': { active: true, ledOn: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'Init Program',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-12',
      title: 'Tour Complete!',
      instruction:
        'You now know your way around the DeepMind 12 front panel. Every slider, button, and LED has a specific purpose in this powerful analog synthesizer.',
      details:
        'The DeepMind 12 combines classic analog synthesis with modern digital control. Its signal path flows from Oscillators \u2192 VCF \u2192 HPF \u2192 VCA, shaped by three envelopes and two LFOs. Experiment with the sliders and buttons to discover the sounds this synth can create.',
      highlightControls: [],
      panelStateChanges: {
        'voice-led-1': { active: false, ledOn: false },
        'voice-led-2': { active: false, ledOn: false },
        'voice-led-3': { active: false, ledOn: false },
      },
      displayState: {
        screenType: 'home',
        statusText: 'Init Program',
        selectedIndex: 1,
      },
      tipText: 'Tip: Press PROG to browse factory presets and hear what the DeepMind 12 can do.',
    },
  ],
};
