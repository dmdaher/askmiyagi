import { Tutorial } from '@/types/tutorial';

export const hpfBassBoost: Tutorial = {
  id: 'hpf-bass-boost',
  deviceId: 'deepmind-12',
  title: 'High-Pass Filter & Bass Boost',
  description:
    'Learn to use the DeepMind 12 High-Pass Filter (HPF) and BOOST switch. The HPF removes low frequencies from the output of all voices simultaneously, while BOOST adds a 100 Hz shelving boost to restore low-end warmth and body.',
  category: 'synthesis',
  difficulty: 'beginner',
  estimatedTime: '6 min',
  tags: ['hpf', 'high-pass', 'bass-boost', 'eq', 'synthesis', 'beginner'],
  steps: [
    {
      id: 'step-1',
      title: 'Meet the HPF',
      instruction:
        'The HPF (High-Pass Filter) and BOOST section sits after the VCA in the signal path — it is applied to the summed output of all 12 voices simultaneously, not per-voice. The HPF FREQ fader controls the cut-off frequency. The BOOST switch adds a +6 dB shelving boost at 100 Hz. Both controls affect every voice at once.',
      details:
        'Unlike the VCF (which is per-voice and shapes tone), the HPF is a global filter applied to the mix of all voices together. The HPF cuts at -6 dB per octave above the cut-off frequency, removing bass content. This is useful for thinning sounds, removing unwanted subsonic rumble, or sculpting the mix. The HPF FREQ range is 20.0 Hz to 2000.0 Hz. The default is 20.0 Hz — fully open, the HPF has no effect on the sound at this setting.',
      highlightControls: ['hpf-freq', 'hpf-boost'],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        statusText: 'A-1  Default Program',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-2',
      title: 'HPF FREQ — Rolling Off the Low End',
      instruction:
        'Move the HPF FREQ fader upward from its default position at the bottom (20.0 Hz). As you raise it, bass frequencies are progressively removed from the output. Moving to a medium position (around 100–300 Hz) creates a natural "space" for bass in a mix. Moving it near the top cuts most of the low-frequency content, producing a thin, high-pitched sound.',
      details:
        'The HPF FREQ range is 20.0 Hz to 2000.0 Hz. At 20.0 Hz (fully lowered), the cut-off is below most audible frequencies — no filtering occurs. At 100 Hz, you begin to notice bass reduction on low notes. At 300 Hz, the sound becomes noticeably thinner. At 2000 Hz (fully raised), only frequencies above 2 kHz pass through — creating a telephone or radio effect. The PROG display shows the current value as you move the fader, e.g., "HPF FREQ: 98.0Hz". The display also shows a visualization of the HPF filter slope.',
      highlightControls: ['hpf-freq'],
      panelStateChanges: {
        'hpf-freq': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'HPF FREQ: 98.0Hz',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-3',
      title: 'BOOST Switch — Low-End Shelf Boost',
      instruction:
        'Press the BOOST switch to turn it on. The BOOST function engages an analog circuit that adds a +6 dB shelving boost centered at 100 Hz. You will hear an immediate increase in low-end body and warmth. The BOOST is designed to compensate for bass loss when using the HPF — the boost adds warmth back to the low end while the HPF removes the very lowest rumble.',
      details:
        'The BOOST is a shelving equalizer, not a peak boost — it lifts the entire low-frequency shelf below 100 Hz by up to +6 dB, with the peak level at 100 Hz. This is similar to the low-shelf boost on a vintage mixing console. The BOOST default program setting is Off. The VCF PARAMETERS menu (VCF EDIT) also has a BASS-BOOST parameter that mirrors the BOOST switch state — any changes on the surface are reflected in the menu and vice versa.',
      highlightControls: ['hpf-boost'],
      panelStateChanges: {
        'hpf-freq': { active: false },
        'hpf-boost': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'A-1  Default Program',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-4',
      title: 'HPF + BOOST Together',
      instruction:
        'With BOOST on, raise the HPF FREQ fader to around 100–200 Hz. The HPF removes the very lowest subsonic content, while the BOOST adds warmth back at 100 Hz — creating a tighter, punchier low end. This combination is especially useful on pad sounds where you want body without boom, or on bass sounds to clean up unwanted sub-bass rumble.',
      details:
        'This is the classic use case for the HPF+BOOST combination: the HPF removes frequencies that compete with a bass guitar or kick drum in a mix, while the BOOST maintains the sense of warmth and body. Think of it as a high-pass filter with a "warmth compensation" circuit built in. Try different HPF FREQ settings — 50 Hz, 80 Hz, 150 Hz — with BOOST on and off to hear the character differences. The visualization on the PROG display when the HPF fader is active shows both the HPF slope and the BOOST curve together.',
      highlightControls: ['hpf-freq', 'hpf-boost'],
      panelStateChanges: {
        'hpf-freq': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'HPF FREQ: 98.0Hz',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-5',
      title: 'HPF as a Creative Tool',
      instruction:
        'The HPF FREQ parameter is also available as a Modulation Matrix destination (destination 66: "HP Freq"). This means you can use an LFO, envelope, or any other source to automate the HPF cutoff — creating sweeping, dynamic filter effects on the global mix output. Try setting a slow LFO as the HPF FREQ mod source in the Mod Matrix for a filter-breath effect across all voices.',
      details:
        'Because the HPF is applied after the VCA summing all voices, modulating it from the Mod Matrix creates a global movement effect — unlike the VCF which is modulated per voice. This gives the HPF a unique character: slow rhythmic opening and closing of the HPF can create a "breathing" quality on sustained pads and strings. The HPF is also useful for dynamic sweeps on live performance — move the fader in real time during a performance to thin out the sound and bring it back.',
      highlightControls: ['hpf-freq', 'prog-menu-mod'],
      panelStateChanges: {
        'hpf-freq': { active: false },
        'prog-menu-mod': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'MOD MATRIX (1-8)',
        menuItems: [
          { label: '1 None       [  ]    None' },
          { label: '2 None       [  ]    None' },
          { label: '3 None       [  ]    None' },
          { label: '4 None       [  ]    None' },
          { label: '5 None       [  ]    None' },
          { label: '6 None       [  ]    None' },
          { label: '7 None       [  ]    None' },
          { label: '8 None       [  ]    None' },
        ],
        selectedIndex: 0,
        statusText: 'SRC-1    None',
      },
    },
    {
      id: 'step-6',
      title: 'HPF & BOOST Summary',
      instruction:
        'The DeepMind 12 HPF is a global filter applied after the VCA, affecting all voices simultaneously. HPF FREQ (20–2000 Hz, default 20 Hz) rolls off low frequencies at -6 dB/octave. The BOOST switch adds a +6 dB shelving boost at 100 Hz to restore warmth. Use them together to create tight, punchy low-end character. The HPF FREQ is also a Mod Matrix destination for dynamic filter automation.',
      details:
        'Key takeaways: (1) HPF is global — it affects the sum of all voices, not individual voices. (2) HPF FREQ default is 20.0 Hz (no effect). Raising it removes low frequencies. (3) BOOST default is Off. Turning it on adds +6 dB at 100 Hz. (4) HPF + BOOST together: clean punchy lows, removes rumble. (5) HPF FREQ is a Mod Matrix destination — it can be automated. (6) The VCF PARAMETERS menu (VCF EDIT) also has a BASS-BOOST parameter that mirrors this switch.',
      highlightControls: ['hpf-freq', 'hpf-boost'],
      panelStateChanges: {
        'prog-menu-mod': { active: false },
      },
      displayState: {
        screenType: 'home',
        statusText: 'A-1  Default Program',
        selectedIndex: 1,
      },
      tipText:
        'Tip: When programming bass sounds, try setting HPF FREQ to around 40-60 Hz with BOOST on. This removes subsonic rumble that wastes headroom while the BOOST keeps the body of the bass sounding full.',
    },
  ],
};
