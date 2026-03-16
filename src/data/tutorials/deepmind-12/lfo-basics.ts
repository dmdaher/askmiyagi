import { Tutorial } from '@/types/tutorial';

export const lfoBasics: Tutorial = {
  id: 'lfo-basics',
  deviceId: 'deepmind-12',
  title: 'LFO Modulation — Rate, Waveforms & Delay',
  description:
    'Explore the DeepMind 12\'s two Low Frequency Oscillators. Learn to set rate and delay, choose from seven waveforms using the shared waveform LED column, sync the LFO to tempo, and use the LFO EDIT menu to fine-tune behaviour.',
  category: 'modulation',
  difficulty: 'beginner',
  estimatedTime: '8 min',
  tags: ['lfo', 'modulation', 'vibrato', 'tremolo', 'waveform', 'rate', 'delay', 'arp-sync', 'beginner'],
  steps: [
    {
      id: 'step-1',
      title: 'LFO 1 RATE — Speed of Modulation',
      instruction:
        'Move the LFO 1 RATE fader. At the bottom of its travel (value 0) the LFO runs at 0.041 Hz — one full cycle every 24 seconds. At the top (value 255) it runs at 65.4 Hz, well into audio range. A typical vibrato sits around mid-travel. The display shows the current rate value and a waveform preview.',
      details:
        'The LFO RATE range is 0 to 255, where 0 = 0.041 Hz (24.1 s period) and 255 = 65.4 Hz (15.3 ms period). The default setting is 0. When ARP-SYNC is enabled in the LFO EDIT menu, the RATE fader no longer sets the frequency directly — it instead selects a time division of the Master BPM (e.g., 1/4 note, 1/8 note). Note: the LFO rate can be extended far beyond the fader range — up to 1280 Hz — when a Mod Matrix source is routed to the LFO Rate destination.',
      highlightControls: ['lfo1-rate'],
      panelStateChanges: {
        'lfo1-rate': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'LFO1 RATE: 128',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-2',
      title: 'LFO 1 DELAY — Fade-In Time',
      instruction:
        'Move the LFO 1 DELAY TIME fader. When this fader is above zero, the LFO output fades in gradually rather than starting immediately. Think of the delay period as the time before the LFO starts, followed by a fade-in: 40% of the total DELAY TIME is the silent period, and the remaining 60% is the fade-in ramp. This creates natural-sounding vibrato that appears after a note is held.',
      details:
        'The DELAY TIME range is 0.00s to 6.59s. The default setting is 0.00s (LFO starts at full depth immediately). When the fader is at mid-travel the display shows something like "LFO1 DELAY: 4.99s", giving a long fade-in. A typical expressive vibrato setting uses a delay of 0.5–1.0s so that short notes are unaffected but sustained notes slowly acquire vibrato.',
      highlightControls: ['lfo1-delay'],
      panelStateChanges: {
        'lfo1-rate': { active: false },
        'lfo1-delay': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'LFO1 DELAY: 4.99s',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-3',
      title: 'Waveform LEDs — Shared Column for Both LFOs',
      instruction:
        'The six LED buttons in the centre column (Sine, Triangle, Square, Ramp Up, Ramp Down, Smp&Hold, Smp&Glide) are shared between LFO 1 and LFO 2. The illuminated LED always shows the waveform of whichever LFO was last edited. Press each button in turn and listen: Sine gives smooth vibrato; Triangle is similar with slightly sharper peaks; Square produces abrupt pitch jumps; Ramp Up sweeps slowly up then snaps down; Ramp Down is the reverse; Smp&Hold creates random stepped steps; Smp&Glide slides between random values.',
      details:
        'The default LFO waveform is Triangle. The waveform LED will glow at full brightness to indicate the selected shape, and at half brightness to show other available shapes. Because the column is shared, pressing a waveform button assigns it to the most recently touched LFO (LFO 1 or LFO 2). To be certain you are assigning a waveform to LFO 1, first move the LFO 1 RATE fader (to make LFO 1 the active context), then press the desired waveform button. The SHAPE parameter in the LFO EDIT menu mirrors this selection.',
      highlightControls: ['lfo-wave-sine', 'lfo-wave-triangle', 'lfo-wave-sawtooth', 'lfo-wave-square', 'lfo-wave-sah', 'lfo-wave-random'],
      panelStateChanges: {
        'lfo1-delay': { active: false },
        'lfo-wave-triangle': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'LFO1 SHAPE: Triangle',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-4',
      title: 'LFO EDIT Shortcut — Shape Without Opening a Menu',
      instruction:
        'Press and hold the LFO 1 EDIT switch while moving the LFO 1 RATE fader. The display shows a message guiding you to use the fader. Sliding the fader now steps through the seven waveform shapes — no need to open the menu. Release EDIT when you reach the shape you want. This is the fastest way to audition different LFO waveforms while a patch is playing.',
      details:
        'This hold-and-move shortcut is documented in the LFO EDIT section (§8.2.4). The shortcut assigns the waveform to the LFO whose EDIT button is held. After releasing the EDIT button, the waveform LED column will show the selected shape for that LFO. The same shortcut applies to LFO 2: hold LFO 2 EDIT and move LFO 2 RATE.',
      highlightControls: ['lfo1-edit', 'lfo1-rate'],
      panelStateChanges: {
        'lfo-wave-triangle': { active: false },
        'lfo1-edit': { active: true },
        'lfo1-rate': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'Move LFO RATE fader to set Shape',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-5',
      title: 'LFO 1 EDIT Menu — KEY-SYNC, ARP-SYNC & PHASE',
      instruction:
        'Press the LFO 1 EDIT switch once (without holding) to open the LFO-1 PARAMETERS menu. Navigate with BANK UP / BANK DOWN. The key parameters are: KEY-SYNC (default Off) resets the LFO phase each time you press a key; ARP-SYNC (default Off) locks the LFO to the Master BPM; SLEW-RATE (default 0) smooths the LFO waveform transitions; PHASE (default POLY) controls whether each voice gets its own independent LFO or they share one.',
      details:
        'PHASE has three options: POLY — all voices use an independent LFO (the default); MONO — all voices share one common LFO; SPREAD — each successive voice\'s LFO is phase-shifted by the SPREAD amount (1–254 degrees). With POLY mode and UNISON active, each voice\'s LFO runs independently, which creates a natural chorus-like spread. MONO mode makes all voices track the same LFO cycle, useful for ensemble-style tremolo. The RATE parameter in this menu is the same as the physical fader.',
      highlightControls: ['lfo1-edit'],
      panelStateChanges: {
        'lfo1-rate': { active: false },
        'lfo1-edit': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'LFO-1 PARAMETERS',
        menuItems: [
          { label: 'SHAPE           Triangle' },
          { label: 'RATE                 128' },
          { label: 'KEY-SYNC             Off' },
          { label: 'ARP-SYNC             Off' },
          { label: 'SLEW-RATE              0' },
          { label: 'PHASE               POLY' },
        ],
        selectedIndex: 2,
        statusText: 'LFO-1 PARAMETERS',
      },
    },
    {
      id: 'step-6',
      title: 'ARP-SYNC — Lock LFO to Master BPM',
      instruction:
        'In the LFO-1 PARAMETERS menu, navigate to ARP-SYNC and press +/YES to turn it On. The display changes from showing a raw Hz rate to showing a clock division (e.g., "LFO1 CLOCK: 2bar"). Now move the LFO 1 RATE fader — instead of changing the speed in Hz, you step through musically useful time divisions (4 bars, 3 bars, 2 bars, 1 bar, 1/2 note, 1/4 note, 1/8 note, down to 1/64 note). This keeps the LFO locked in time with your arpeggiated sequence.',
      details:
        'When ARP-SYNC is On, the LFO synchronises to the Master BPM controlled by the ARP RATE fader. If the clock is sourced externally (MIDI or USB), the LFO will sync to that external tempo. The full list of clock divisions in ARP-SYNC mode spans from 4 bars down to 1/64th note, including dotted and triplet values. The default ARP-SYNC setting is Off.',
      highlightControls: ['lfo1-edit'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'LFO-1 PARAMETERS',
        menuItems: [
          { label: 'SHAPE           Triangle' },
          { label: 'RATE                 128' },
          { label: 'KEY-SYNC             Off' },
          { label: 'ARP-SYNC              On' },
          { label: 'SLEW-RATE              0' },
          { label: 'PHASE               POLY' },
        ],
        selectedIndex: 3,
        statusText: 'LFO1 CLOCK: 2bar',
      },
    },
    {
      id: 'step-7',
      title: 'LFO 2 — Independent Second Oscillator',
      instruction:
        'Press PROG (or the LFO 1 EDIT switch again) to exit the menu. Now explore LFO 2 by moving its RATE and DELAY faders, pressing LFO 2 EDIT to open its own parameter menu, and selecting a different waveform. LFO 1 and LFO 2 operate completely independently — LFO 1 is typically used for OSC pitch modulation (vibrato) and LFO 2 for VCF modulation (wah). You can assign both to the same destination via the Mod Matrix for more complex motion.',
      details:
        'The VCF EDIT menu defaults to LFO-SELECT: LFO-2, keeping the two LFOs functionally separated (LFO 1 for pitch, LFO 2 for filter). This separation is deliberate: it lets you dial in vibrato on LFO 1 without disturbing the filter wah depth on LFO 2. LFO 2 has an identical parameter set to LFO 1. Both LFOs are available as Mod Matrix sources (source 7 = LFO1, source 8 = LFO2) and as modulation destinations (so one LFO can modulate the rate of the other for FM-style complexity).',
      highlightControls: ['lfo2-rate', 'lfo2-delay', 'lfo2-edit'],
      panelStateChanges: {
        'lfo1-edit': { active: false },
        'lfo2-rate': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'LFO2 RATE: 64',
        selectedIndex: 1,
      },
      tipText:
        'Tip: Set LFO 1 waveform to Sine with a long DELAY TIME for classic finger-vibrato — play a note and the vibrato fades in expressively after a moment. Set LFO 2 to Triangle with ARP-SYNC On at 1/4 note for a rhythmic filter wah that locks to your sequence.',
    },
  ],
};
