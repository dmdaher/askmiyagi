import { Tutorial } from '@/types/tutorial';

export const effectsRouting: Tutorial = {
  id: 'effects-routing',
  deviceId: 'deepmind-12',
  title: 'Effects Routing — Insert, Send & the 10 Configurations',
  description:
    'Go beyond the default M-1 serial chain. Load effects into multiple slots, change the routing mode from M-1 through M-10, and hear how serial, parallel, and send configurations change your sound. Learn when to use INSERT versus SEND mode.',
  category: 'effects',
  difficulty: 'intermediate',
  estimatedTime: '10 min',
  tags: ['effects', 'routing', 'fx', 'serial', 'parallel', 'send', 'insert', 'intermediate'],
  steps: [
    {
      id: 'step-1',
      title: 'Set Up: Load Effects in Slots 1–4',
      instruction:
        'Press FX to open the FX OVERVIEW. Load a reverb into Slot 1 (e.g., AmbVerb), a delay into Slot 2 (e.g., Delay), a chorus into Slot 3 (e.g., Chorus), and leave Slot 4 as None. Set the MIX for each loaded slot to 50%. This four-slot setup lets you hear concretely how each routing configuration changes which effects process the signal and in what order. Play and hold a chord so you can listen continuously as you change routings.',
      details:
        'To navigate: use BANK UP / BANK DOWN to move the cursor between rows in the FX OVERVIEW. With the cursor on a SLOT row and the TYPE column highlighted, turn the rotary or use the DATA ENTRY fader to scroll through the 35 algorithms. The effect loads automatically when you stop scrolling. The MIX column controls the wet/dry blend (0–100%) for Reverb, Delay, and Creative effects. Processing effects (EQ, compressor, etc.) show "---" in MIX — they always pass the full signal.',
      highlightControls: ['prog-menu-fx', 'prog-rotary', 'prog-data-entry', 'prog-bank-up', 'prog-bank-down', 'display'],
      panelStateChanges: {
        'prog-menu-fx': { active: true },
        'prog-rotary': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'FX OVERVIEW',
        menuItems: [
          { label: 'SLOT  TYPE         MIX  LVL' },
          { label: '1     AmbVerb       50  ---' },
          { label: '2     Delay         50  ---' },
          { label: '3     Chorus        50  ---' },
          { label: '4     None         ---  100' },
        ],
        selectedIndex: 1,
        statusText: 'FX OVERVIEW  M-1',
      },
    },
    {
      id: 'step-2',
      title: 'M-1: Fully Serial — Signal Flows Through Every Slot',
      instruction:
        'Make sure the routing is set to M-1 (SERIAL 1-2-3-4). In this configuration the signal flows in a straight line: your synth audio enters Slot 1 (AmbVerb), exits into Slot 2 (Delay), exits into Slot 3 (Chorus), and finally exits to the output. Each slot processes the output of the previous slot. You hear reverb feeding delay feeding chorus — a classic "effects chain" topology. Play a note and listen: the reverb tail gets delayed, and the whole thing gets a chorus shimmer.',
      details:
        'Serial routing gives the most cohesive, "glued" effect combination because each processor shapes the sound before the next receives it. The drawback is that all three effects colour the signal cumulatively. If Slot 1 adds a long reverb tail, Slot 2\'s delay echoes the reverb, not just the original dry note — this is often exactly what you want for dense ambient textures, but can become muddy for rhythmically precise delay. The LEVEL parameter on Slot 4 (the last slot) controls the final output level of the entire chain.',
      highlightControls: ['prog-rotary', 'prog-data-entry', 'display'],
      panelStateChanges: {
        'prog-rotary': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'FX OVERVIEW',
        menuItems: [
          { label: 'SLOT  TYPE         MIX  LVL' },
          { label: '1     AmbVerb       50  ---' },
          { label: '2     Delay         50  ---' },
          { label: '3     Chorus        50  ---' },
          { label: '4     None         ---  100' },
        ],
        selectedIndex: 0,
        statusText: 'FX ROUTING: M-1',
      },
    },
    {
      id: 'step-3',
      title: 'Changing the Routing Mode — Hear the Difference',
      instruction:
        'Navigate the cursor to the routing diagram row at the top of the FX OVERVIEW. Turn the rotary knob clockwise to step through the routing modes. Stop at M-3 (PARALLEL 1/2 PARALLEL 3/4): now Slots 1 and 2 run in parallel (both receive the dry signal independently), and Slots 3 and 4 also run in parallel, and the two parallel pairs are mixed together at the output. Play the same chord. You now hear the AmbVerb and Delay running side-by-side rather than in series — the delay echoes are clean, not coloured by the reverb. Step further to M-4 (PARALLEL 1/2/3/4): all three loaded effects receive the dry signal and are summed at output. The chorus no longer processes the reverb or delay — each effect is completely independent.',
      details:
        'The critical difference between serial and parallel routing is signal independence. In M-1 each slot shapes what the next slot hears. In M-4 every slot hears only the original dry signal. Parallel routing is ideal when you want effects to coexist without mutual influence — for example, a tight delay that locks to tempo alongside a lush reverb that decays naturally, without one affecting the other. The LVL parameter on the last slot (or on any slot in a parallel group) sets the contribution of that slot to the final mix. You can balance reverb at LVL 80 and delay at LVL 60 for precise control.',
      highlightControls: ['prog-rotary', 'display'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'FX OVERVIEW',
        menuItems: [
          { label: 'SLOT  TYPE         MIX  LVL' },
          { label: '1     AmbVerb       50  ---' },
          { label: '2     Delay         50  ---' },
          { label: '3     Chorus        50  100' },
          { label: '4     None         ---  100' },
        ],
        selectedIndex: 0,
        statusText: 'FX ROUTING: M-4',
      },
    },
    {
      id: 'step-4',
      title: 'M-6: Hybrid — Serial Pre-Stage + Parallel End',
      instruction:
        'Rotate to M-6 (SERIAL 1-2 PARALLEL 3/4). Now Slots 1 and 2 form a series chain (AmbVerb feeds Delay), and that chain\'s output runs in parallel with Slot 3 (Chorus) — both are summed at the output. This is a hybrid topology: you get the "delayed reverb" effect from the 1-2 chain alongside the clean chorus from Slot 3. Play a chord and hear: the reverb-into-delay texture sits on one path; the chorus shimmer arrives separately on another path. Adjust the LVL on the 1-2 chain versus Slot 3 to balance the two paths.',
      details:
        'Hybrid routings like M-6 and M-7 are powerful for professional sound design. M-6 (SERIAL 1-2 PARALLEL 3/4): a series processing pre-stage followed by a parallel wet/dry. M-7 (SERIAL 1 PARALLEL 2/3/4): a single serial pre-processor (e.g., a compressor in Slot 1) followed by three independent parallel effects. M-2 (PARALLEL 1/2 SERIAL 3-4): two parallel effects whose combined output feeds a final series processor — great for running reverb and delay in parallel, then sending both through a compressor or EQ in Slots 3-4.',
      highlightControls: ['prog-rotary', 'display'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'FX OVERVIEW',
        menuItems: [
          { label: 'SLOT  TYPE         MIX  LVL' },
          { label: '1     AmbVerb       50  ---' },
          { label: '2     Delay         50  100' },
          { label: '3     Chorus        50  100' },
          { label: '4     None         ---  100' },
        ],
        selectedIndex: 0,
        statusText: 'FX ROUTING: M-6',
      },
    },
    {
      id: 'step-5',
      title: 'INSERT vs SEND Mode — Different Signal Paths',
      instruction:
        'Navigate the cursor to the FX MODE field (just below the routing diagram). Press +/YES to cycle to INSERT mode. In INSERT mode the effect slots sit directly in the synthesizer\'s output signal path — the full audio passes through every slot. Now switch to SEND mode by pressing +/YES again. In SEND mode the synth\'s output signals are sent to the effects and returned into the signal flow; this is the classic "aux send and return" topology of a mixing desk. For reverb and delay, SEND mode keeps your dry signal present and lets you blend in wet signal via the MIX control. For dynamics processing (compressor, gate, distortion), use INSERT mode so the entire signal is processed.',
      details:
        'In SEND mode the MIX parameter on each slot controls the return level of the wet signal. Setting MIX to 100% means only wet signal is returned — the dry signal is provided separately by the synthesizer\'s own path. In INSERT mode the MIX parameter behaves as a blend: 0% = fully dry (effect bypassed), 100% = fully wet (no dry signal). BYPASS mode disables all effect processing while preserving every setting — useful for a quick A/B comparison against the dry signal during programming.',
      highlightControls: ['prog-nav-yes', 'prog-nav-no', 'display'],
      panelStateChanges: {
        'prog-rotary': { active: false },
        'prog-nav-yes': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'FX OVERVIEW',
        menuItems: [
          { label: 'SLOT  TYPE         MIX  LVL' },
          { label: '1     AmbVerb       50  ---' },
          { label: '2     Delay         50  ---' },
          { label: '3     Chorus        50  100' },
          { label: '4     None         ---  100' },
        ],
        selectedIndex: 0,
        statusText: 'FX MODE: Insert',
      },
    },
    {
      id: 'step-6',
      title: 'M-9 & M-10 — Feedback Routing (Use with Care)',
      instruction:
        'Return to SEND mode. Rotate to M-9 (SERIAL 3-4 FEEDBACK4(1-2)): the output of Slot 4 feeds back into the input of Slots 1 and 2, creating a loop. This can produce resonant, evolving, or infinite-sustain textures. Rotate to M-10 (SERIAL 4 FEEDBACK4(1-2-3)): Slot 4 feeds back into all three preceding slots simultaneously. WARNING: feedback routings can build to high levels very quickly. Keep the VOLUME knob low while exploring M-9 and M-10. A built-in 30 Hz high-pass filter in the feedback path prevents low-frequency runaway.',
      details:
        'Feedback routing is most useful at low LEVEL values (20–40 range) with time-based effects such as delay and reverb in the feedback loop. Loading a short delay in Slot 4 with a reverb in Slot 1 under M-9 creates a regenerating echo texture that smears and blurs over time. Extreme feedback settings approach infinite sustain, which can be musical (drone/ambient) or uncontrolled (feedback screech). Always save your program before experimenting with feedback routings, and never leave a feedback routing playing unattended at high volumes.',
      highlightControls: ['prog-rotary', 'perf-volume', 'display'],
      panelStateChanges: {
        'prog-nav-yes': { active: false },
        'prog-rotary': { active: true },
        'perf-volume': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'FX OVERVIEW',
        menuItems: [
          { label: 'SLOT  TYPE         MIX  LVL' },
          { label: '1     AmbVerb       50  ---' },
          { label: '2     Delay         50  ---' },
          { label: '3     Chorus        50  ---' },
          { label: '4     None         ---   30' },
        ],
        selectedIndex: 0,
        statusText: 'FX ROUTING: M-9',
      },
    },
    {
      id: 'step-7',
      title: 'Practical Routing Recipe — Reverb + Delay',
      instruction:
        'Set routing back to M-1 (SERIAL 1-2-3-4) in SEND mode. Load AmbVerb in Slot 1 (MIX 100%), Delay in Slot 2 (MIX 100%), and clear Slots 3 and 4. This is the most common effects chain: reverb first, then delay. In SEND mode your dry synth signal plays alongside the wet return. The reverb adds space, and the delay echoes the reverb tail for a rich "studio-quality" sound. Press WRITE to save these settings. Remember: any unsaved changes to FX type are flagged with a CAUTION dialog — always save before switching algorithms.',
      details:
        'Reverb-before-delay vs delay-before-reverb is one of the fundamental routing decisions in professional mixing. Reverb first (M-1, Slot 1 = reverb, Slot 2 = delay): the delay echoes repeat the reverbed sound, creating a cascading, wash-like ambience. Delay first (swap slots): the echoes repeat the dry signal, and reverb then softens them — typically more distinct echo repeats that gradually bloom into reverb. Try both using the "Moving Effects" function: hold FX, then use BANK UP/DOWN to reorder Slot 1 and Slot 2 without losing parameters.',
      highlightControls: ['prog-menu-fx', 'prog-menu-write', 'display'],
      panelStateChanges: {
        'prog-rotary': { active: false },
        'perf-volume': { active: false },
        'prog-menu-write': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'FX OVERVIEW',
        menuItems: [
          { label: 'SLOT  TYPE         MIX  LVL' },
          { label: '1     AmbVerb      100  ---' },
          { label: '2     Delay        100  ---' },
          { label: '3     None         ---  ---' },
          { label: '4     None         ---  100' },
        ],
        selectedIndex: 0,
        statusText: 'FX ROUTING: M-1',
      },
      tipText:
        'Tip: For the classic "cathedral" sound, set Slot 1 = AmbVerb with Decay 5.0s, Slot 2 = Delay with Time synced to 1/4 note and Feedback at 40%. Routing M-1, SEND mode. The delay repeats extend into the reverb tail, and both are heard alongside your dry playing.',
    },
  ],
};
