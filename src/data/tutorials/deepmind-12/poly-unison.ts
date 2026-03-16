import { Tutorial } from '@/types/tutorial';

export const polyUnison: Tutorial = {
  id: 'poly-unison',
  deviceId: 'deepmind-12',
  title: 'Polyphony, Unison & Voice Modes',
  description:
    'Configure how the DeepMind 12\'s 12 independent analog voices are allocated. Explore Poly mode for full chords, Unison stacking for enormous pads and leads, Mono modes for bass and solo lines, and use OSC Drift for vintage analog character.',
  category: 'modulation',
  difficulty: 'intermediate',
  estimatedTime: '10 min',
  tags: ['polyphony', 'unison', 'mono', 'voice-modes', 'detune', 'osc-drift', 'poly-edit', 'intermediate'],
  steps: [
    {
      id: 'step-1',
      title: 'Open VOICE PARAMETERS — POLY EDIT Menu',
      instruction:
        'Press the POLY EDIT switch once. The switch begins flashing and the display shows the VOICE PARAMETERS menu. The key parameter at the top is POLYPHONY, currently set to "Poly" (the default). Navigate with BANK UP / BANK DOWN. Below POLYPHONY you will see: UNISON-DETUNE, PRIORITY, ENV-TRIGGER, OSC-DRIFT, PARAM-DRIFT, and DRIFT-RATE. The footer shows "[EDIT]> PITCH PARAMS" — pressing POLY EDIT again advances to the Pitch Parameters menu.',
      details:
        'The VOICE PARAMETERS menu (first press of POLY EDIT) controls how the 12 voices are allocated and how they behave. POLYPHONY is the most fundamental — it determines how many voices respond to each note press. UNISON-DETUNE controls the spread between stacked voices. PRIORITY determines which notes are stolen when more notes are played than voices are available. ENV-TRIGGER controls envelope restart behaviour when notes overlap.',
      highlightControls: ['poly-edit'],
      panelStateChanges: {
        'poly-edit': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'VOICE PARAMETERS',
        menuItems: [
          { label: 'POLYPHONY          Poly' },
          { label: 'UNISON-DETUNE         0' },
          { label: 'PRIORITY           Last' },
          { label: 'ENV-TRIGGER        Mono' },
          { label: 'OSC-DRIFT             0' },
          { label: 'PARAM-DRIFT           0' },
          { label: 'DRIFT-RATE           16' },
        ],
        selectedIndex: 0,
        statusText: '[EDIT]> PITCH PARAMS',
      },
    },
    {
      id: 'step-2',
      title: 'POLYPHONY — Poly vs Unison vs Mono',
      instruction:
        'With POLYPHONY highlighted, use -/NO or +/YES to cycle through the modes. In "Poly" mode (the default), one voice is assigned to each note — you can play all 12 notes simultaneously. Press to "Unison-2" and play a note: two voices now play each note, spread by the UNISON-DETUNE amount. Step through Unison-4, Unison-6, and Unison-12. Each step doubles or increases the voices per note, reducing the available polyphony but creating a thicker, more powerful sound.',
      details:
        'Available modes: Poly (one voice per note, up to 12 notes), Unison-2 through Unison-12 (2–12 voices per note), Mono (one voice, monophonic — all 12 voices play the same note), Mono-2, Mono-3, Mono-4, Mono-6 (monophonic but with 2–6 voices stacked per note), Poly-6 (one voice per note but polyphony capped at 6), Poly-8 (one voice per note, polyphony capped at 8). When an even number of voices is used in unison, they spread symmetrically around the root frequency — the root note itself is not directly played, but is implied by the spectral result. When an odd number is used, one voice plays the root note.',
      highlightControls: ['poly-edit'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'VOICE PARAMETERS',
        menuItems: [
          { label: 'POLYPHONY      Unison-4' },
          { label: 'UNISON-DETUNE         0' },
          { label: 'PRIORITY           Last' },
          { label: 'ENV-TRIGGER        Mono' },
          { label: 'OSC-DRIFT             0' },
          { label: 'PARAM-DRIFT           0' },
          { label: 'DRIFT-RATE           16' },
        ],
        selectedIndex: 0,
        statusText: '[EDIT]> PITCH PARAMS',
      },
    },
    {
      id: 'step-3',
      title: 'UNISON-DETUNE — Thickness & Chorus Spread',
      instruction:
        'Navigate down to UNISON-DETUNE. With Polyphony set to Unison-4 or higher, increase this value. The UNISON DETUNE fader on the panel is the fastest way — move it upward. The display shows the detuning in cents, up to ±50.0 cents (value 255). A small value (5–15 cents) gives a warm chorus-like spread. Higher values (40–50 cents) create the massive "supersaw" wall-of-sound effect used in trance and EDM leads.',
      details:
        'UNISON-DETUNE spreads up to ±50 cents across all the stacked voices. The range is 0 to 255, where 255 = ±50.0 cents. Default is 0 (all voices in perfect tune). The detuning is spread evenly: in Unison-12, voice 1 sits at the most negative detune, voice 12 at the most positive, and the others spread linearly between them. The UNISON DETUNE fader on the surface is a direct shortcut for this parameter — any changes on the fader are reflected in the menu and vice versa.',
      highlightControls: ['poly-unison', 'poly-edit'],
      panelStateChanges: {
        'poly-unison': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'DETUNE: +/-50.0cents',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-4',
      title: 'POLY EDIT Shortcut — Set Polyphony Without Menu',
      instruction:
        'Press PROG to return to the main display, then try the hardware shortcut: press and hold the POLY EDIT switch while moving the UNISON DETUNE fader. The display shows the current POLYPHONY setting and the fader position now steps through polyphony modes rather than adjusting detune. Slide to Unison-12 for the maximum 12-voice stack. Release EDIT when you reach the desired mode.',
      details:
        'This hold-and-move shortcut mirrors the same pattern used by OSC EDIT, VCF EDIT, and LFO EDIT. It lets you change POLYPHONY without entering the menu — useful during live performance when you want to switch quickly between Poly and Unison modes. The shortcut is documented in Chapter 10 (Short-cuts) of the manual.',
      highlightControls: ['poly-edit', 'poly-unison'],
      panelStateChanges: {
        'poly-unison': { active: false },
        'poly-edit': { active: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'POLYPHONY: Unison-12',
        selectedIndex: 1,
      },
    },
    {
      id: 'step-5',
      title: 'PRIORITY — Voice Stealing Behaviour',
      instruction:
        'Press POLY EDIT once to open VOICE PARAMETERS. Navigate to PRIORITY. The three options are: Lowest (when a new note is lower in pitch than currently playing notes, it takes the highest-pitched voice), Highest (new higher notes steal the lowest voice), Last (the most recently played note steals the voice played least recently — this is the default). Try each setting while playing a chord and adding more notes than voices allow.',
      details:
        'PRIORITY matters most in Poly mode when all 12 voices are occupied. In Unison modes it also matters when playing multiple keys that would require more note-slots than the polyphony divided by unison voices allows. "Last" priority (default) is the most natural for keyboard playing. "Lowest" priority is useful for bass-heavy patches where you want low notes to always come through. "Highest" is good for lead patches where you want the melody to always cut through. Note: PRIORITY is not available when POLY CHAIN mode is active.',
      highlightControls: ['poly-edit'],
      panelStateChanges: {
        'poly-edit': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'VOICE PARAMETERS',
        menuItems: [
          { label: 'POLYPHONY      Unison-4' },
          { label: 'UNISON-DETUNE        50' },
          { label: 'PRIORITY         Lowest' },
          { label: 'ENV-TRIGGER        Mono' },
          { label: 'OSC-DRIFT             0' },
          { label: 'PARAM-DRIFT           0' },
          { label: 'DRIFT-RATE           16' },
        ],
        selectedIndex: 2,
        statusText: '[EDIT]> PITCH PARAMS',
      },
    },
    {
      id: 'step-6',
      title: 'OSC-DRIFT & DRIFT-RATE — Vintage Analog Character',
      instruction:
        'Navigate down to OSC-DRIFT. Increase it from 0 toward 50–100. OSC-DRIFT adds random slow pitch wandering to each of the 12 independent oscillators, recreating the natural instability of a vintage analog synthesizer. Each voice has its own independent drift generator. DRIFT-RATE (below it) controls how quickly the drift moves — lower values give slow, lazy drift; higher values give faster wobble.',
      details:
        'OSC-DRIFT applies to both OSC 1 and OSC 2. Range is 0–255 (default 0 = no drift). DRIFT-RATE controls the speed of the random drift: 0 = 25–50 ms per change, 255 = 2.5–5.0 s per change. Default DRIFT-RATE is 16. PARAM-DRIFT (directly above DRIFT-RATE) adds drift to a wider set of voice parameters: OSC1 PITCH MOD, OSC1 PWM, OSC2 PITCH MOD, OSC2 TONE MOD, VCF FREQ, VCF RES, VCF ENV DEPTH, VCF LFO DEPTH, and VCA ENV DEPTH. Combining OSC-DRIFT with PARAM-DRIFT at low values gives a convincing vintage synthesizer character.',
      highlightControls: ['poly-edit'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'VOICE PARAMETERS',
        menuItems: [
          { label: 'POLYPHONY      Unison-4' },
          { label: 'UNISON-DETUNE        50' },
          { label: 'PRIORITY           Last' },
          { label: 'ENV-TRIGGER        Mono' },
          { label: 'OSC-DRIFT            40' },
          { label: 'PARAM-DRIFT          20' },
          { label: 'DRIFT-RATE           16' },
        ],
        selectedIndex: 4,
        statusText: '[EDIT]> PITCH PARAMS',
      },
    },
    {
      id: 'step-7',
      title: 'Unison-12 — Maximum Voice Stacking',
      instruction:
        'Navigate POLYPHONY back to Unison-12. All 12 voices now play a single note. Set UNISON-DETUNE to 244 (around ±48 cents). Play a single note — all 12 independent analog voices stack with a wide detuning spread. The result is an enormous, wall-of-sound unison lead or pad. Press PROG to exit and hear the full effect while playing. To return to normal polyphony, press POLY EDIT and set POLYPHONY back to Poly.',
      details:
        'Unison-12 is the most voices-per-note available on the DeepMind 12, and with 12 independent fully-analog voices it produces an exceptionally thick sound. Note that in Unison-12, you can only play one note at a time — all 12 voices are dedicated to a single pitch. Adding OSC-DRIFT in this mode creates additional randomness between the 12 voices for an even more organic sound. The voice LED indicators above the keyboard all illuminate simultaneously in Unison-12 mode to show all voices are active.',
      highlightControls: ['poly-edit', 'poly-unison'],
      panelStateChanges: {
        'poly-edit': { active: false },
        'poly-unison': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'VOICE PARAMETERS',
        menuItems: [
          { label: 'POLYPHONY     Unison-12' },
          { label: 'UNISON-DETUNE       244' },
          { label: 'PRIORITY           Last' },
          { label: 'ENV-TRIGGER        Mono' },
          { label: 'OSC-DRIFT            40' },
          { label: 'PARAM-DRIFT          20' },
          { label: 'DRIFT-RATE           16' },
        ],
        selectedIndex: 0,
        statusText: '[EDIT]> PITCH PARAMS',
      },
      tipText:
        'Tip: For a classic "supersaw" sound, set POLYPHONY to Unison-12, UNISON-DETUNE to 200+, OSC 1 waveform to Sawtooth, VCF FREQ at about 60%, light VCF LFO modulation (LFO 2 at slow Triangle), and add reverb. This is the foundation of classic trance, EDM, and cinematic pad sounds.',
    },
  ],
};
