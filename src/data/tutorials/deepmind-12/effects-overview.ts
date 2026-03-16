import { Tutorial } from '@/types/tutorial';

export const effectsOverview: Tutorial = {
  id: 'effects-overview',
  deviceId: 'deepmind-12',
  title: 'Effects Engine — 4 FX Slots & Routing',
  description:
    'Explore the DeepMind 12\'s on-board virtual FX Rack. Learn how the four true-stereo FX slots work, how to load effects from the 35-algorithm library, and how to switch between INSERT, SEND, and BYPASS modes.',
  category: 'effects',
  difficulty: 'beginner',
  estimatedTime: '8 min',
  tags: ['effects', 'fx', 'reverb', 'delay', 'routing', 'insert', 'send', 'beginner'],
  steps: [
    {
      id: 'step-1',
      title: 'Press FX — Open the FX Overview',
      instruction:
        'Press the FX switch. The FX LED illuminates and the display shows the FX OVERVIEW screen. At the top you see a row of four numbered boxes — [1]+[2]+[3]+[4] — representing the four effect slots connected in a chain. The current routing configuration is shown in the top-right corner (e.g., "M-1"). Below the routing diagram, a table lists each slot with its TYPE, MIX, and LVL columns. By default all four slots show "None" — no effects loaded.',
      details:
        'The DeepMind 12 carries four independent true-stereo DSP processors. Each slot can hold any one of 35 different effect algorithms. Because each processor is true-stereo, even complex algorithms such as the TC-DeepVRB reverb run at full quality without halving the voice count. The FX OVERVIEW is your dashboard for all four slots at once. Press FX again to cycle through the individual FX parameter pages (FX-1, FX-2, FX-3, FX-4) and then back to the PROG screen.',
      highlightControls: ['prog-menu-fx', 'display'],
      panelStateChanges: {
        'prog-menu-fx': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'FX OVERVIEW',
        menuItems: [
          { label: 'SLOT  TYPE         MIX  LVL' },
          { label: '1     None         ---  ---' },
          { label: '2     None         ---  ---' },
          { label: '3     None         ---  ---' },
          { label: '4     None         ---  100' },
        ],
        selectedIndex: 0,
        statusText: 'FX OVERVIEW  M-1',
      },
    },
    {
      id: 'step-2',
      title: 'Select a Routing Mode',
      instruction:
        'At the very top of the FX OVERVIEW, the routing diagram shows how the four slots are connected. Make sure the "<" cursor is next to the routing diagram, then turn the rotary knob or use the DATA ENTRY fader to step through the ten routing options: M-1 (all four in series) through M-10 (feedback loops). Each routing is drawn as a small block diagram so you can see instantly which slots are parallel and which are in series. For now, leave the routing on M-1 — the simplest fully-serial chain.',
      details:
        'Ten routing configurations are available: M-1 routes all four slots in series (SERIAL 1-2-3-4). M-2 places slots 1 and 2 in parallel, then feeds into the series chain of slots 3 and 4. M-3 and M-4 increase the degree of parallelism. M-9 and M-10 include feedback loops, which can create dramatic resonant or infinite-sustain effects — use these with the VOLUME knob kept low while exploring. A 30 Hz high-pass filter in the feedback path prevents excessive low-frequency build-up.',
      highlightControls: ['prog-rotary', 'prog-data-entry', 'display'],
      panelStateChanges: {
        'prog-menu-fx': { active: true },
        'prog-rotary': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'FX OVERVIEW',
        menuItems: [
          { label: 'SLOT  TYPE         MIX  LVL' },
          { label: '1     None         ---  ---' },
          { label: '2     None         ---  ---' },
          { label: '3     None         ---  ---' },
          { label: '4     None         ---  100' },
        ],
        selectedIndex: 0,
        statusText: 'FX ROUTING: M-1',
      },
    },
    {
      id: 'step-3',
      title: 'Choose INSERT, SEND, or BYPASS Mode',
      instruction:
        'Just below the routing diagram, the FX MODE indicator reads "Send", "Insert", or "Bypass". Move the "<" cursor to this field and press +/YES or -/NO to cycle through the three modes. INSERT places the effects directly in the synthesizer\'s output signal path — the effects hear everything. SEND routes the synth output to the effect slots and returns the wet signal — ideal for reverb and delay that should sit alongside a dry signal. BYPASS disables all four slots at once, useful for quick A/B comparisons.',
      details:
        'INSERT mode is the most common for filtering, compression, and distortion effects that should process the entire signal. SEND mode is preferred for time-based effects (reverb, delay) because the dry signal remains audible independently of the wet return. The MIX parameter on each slot controls the wet/dry blend in both modes. In BYPASS mode the signal passes through unaffected, but all effect settings are preserved — press FX MODE again to re-engage.',
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
          { label: '1     None         ---  ---' },
          { label: '2     None         ---  ---' },
          { label: '3     None         ---  ---' },
          { label: '4     None         ---  100' },
        ],
        selectedIndex: 0,
        statusText: 'FX MODE: Send',
      },
    },
    {
      id: 'step-4',
      title: 'Load an Effect into Slot 1',
      instruction:
        'Move the "<" cursor down to the SLOT 1 row in the table. The cursor highlights the TYPE column. Turn the rotary knob to scroll through the 35 available algorithms. The list is ordered by type: Reverb algorithms first (TC-DeepVRB, AmbVerb, Room Rev, VintageRev, Hall Rev, Chamber Rev, Plate Rev, Rich Plate, Gated Rev, Reverse Rev, ChorusVerb, DelayVerb, FlangeVerb), then Processing, then Delay, then Creative. When you stop on an effect it is automatically loaded into Slot 1.',
      details:
        'The 35 algorithms span four categories: Reverb (13 algorithms — from the lush TC-DeepVRB to creative FlangeVerb), Processing (8 algorithms — EQ, compression, distortion, noise gate), Delay (6 algorithms — stereo, multi-tap, decimator, modulation), and Creative (8 algorithms — chorus, flanger, phaser, pitch shifting, rotary speaker). Each algorithm has up to 12 editable parameters. Parameters marked with an asterisk (*) in the manual are available as destinations in the Mod Matrix, letting you automate any of them in real time.',
      highlightControls: ['prog-rotary', 'display'],
      panelStateChanges: {
        'prog-nav-yes': { active: false },
        'prog-rotary': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'FX OVERVIEW',
        menuItems: [
          { label: 'SLOT  TYPE         MIX  LVL' },
          { label: '1     AmbVerb      100  ---' },
          { label: '2     None         ---  ---' },
          { label: '3     None         ---  ---' },
          { label: '4     None         ---  100' },
        ],
        selectedIndex: 1,
        statusText: 'Slot 1: AmbVerb',
      },
    },
    {
      id: 'step-5',
      title: 'Set MIX Level for Slot 1',
      instruction:
        'With the cursor on the MIX column of Slot 1, turn the rotary knob or move the DATA ENTRY fader to adjust the wet/dry blend from 0% (fully dry) to 100% (fully wet). A setting of 30–50% is typical for reverb used in SEND mode. In INSERT mode the MIX controls how much of the processed signal is blended in. Note: Processing-type effects (EQ, compression, gate, distortion) do not use the MIX parameter — their MIX column shows "---" because they always process the full signal.',
      details:
        'The MIX and LEVEL parameters serve different purposes. MIX (0–100%) controls the balance between the dry (unprocessed) and wet (processed) signal within each slot. LEVEL controls the output level of effects which are configured in parallel, or of the last effect in a serial chain before the output stage. When you see "---" in the LVL column, that slot\'s output feeds directly into the next slot without an independent level stage.',
      highlightControls: ['prog-rotary', 'prog-data-entry', 'display'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'FX OVERVIEW',
        menuItems: [
          { label: 'SLOT  TYPE         MIX  LVL' },
          { label: '1     AmbVerb       40  ---' },
          { label: '2     None         ---  ---' },
          { label: '3     None         ---  ---' },
          { label: '4     None         ---  100' },
        ],
        selectedIndex: 1,
        statusText: 'Slot 1 MIX: 40%',
      },
    },
    {
      id: 'step-6',
      title: 'Navigate to the FX-1 Parameter Page',
      instruction:
        'Press the FX switch once. The display leaves the FX OVERVIEW and enters the FX-1 page, showing all parameters for the AmbVerb algorithm loaded in Slot 1: PreDelay, Decay, Size, Damping, Diffusion, Mix, LoCut, HiCut, Mod, and TailGain. Use BANK UP / BANK DOWN to move between parameters. Turn the rotary knob or move the DATA ENTRY fader to change the value. The selected parameter\'s name and value are shown in detail at the bottom of the screen.',
      details:
        'Each FX slot has up to 12 parameters depending on the algorithm. The FX parameter page header shows the slot number and algorithm name (e.g., "FX-1   AmbVerb"). Navigate between parameters using BANK UP / BANK DOWN; the highlighted parameter shows its current value in the lower status bar. When you have finished editing, press WRITE to save. If you change to a different FX type without saving, a CAUTION dialog appears: press +/YES to proceed (changes are lost) or -/NO to cancel and save first.',
      highlightControls: ['prog-menu-fx', 'prog-bank-up', 'prog-bank-down', 'prog-rotary', 'display'],
      panelStateChanges: {
        'prog-rotary': { active: false },
        'prog-menu-fx': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'FX-1  AmbVerb',
        menuItems: [
          { label: 'PD    PreDelay     16.0ms' },
          { label: 'DCY   Decay         0.4s' },
          { label: 'SIZ   Size            58' },
          { label: 'DMP   Damping        3.4' },
          { label: 'DIF   Diffusion       86' },
          { label: 'MIX   Mix           100%' },
        ],
        selectedIndex: 0,
        statusText: 'PreDelay 16.0ms',
      },
    },
    {
      id: 'step-7',
      title: 'Copy FX Settings & Move Effects',
      instruction:
        'Press FX once more to move to FX-2, then again for FX-3 and FX-4. Press FX one final time to return to the PROG screen. To copy all four slots\' settings between programs: press FX to reach the FX OVERVIEW, navigate to the routing diagram, then hold FX — the display shows "FX HELD: GLOBAL: COPY FX / WRITE: PASTE FX". Press GLOBAL to copy into memory. Load the target program, navigate to the FX OVERVIEW, hold FX, then press WRITE to paste. To move a slot to a different position, hold FX and use BANK UP / BANK DOWN or the rotary.',
      details:
        'All FX settings (routing, mode, and all four slot types and parameters) are copied and pasted together as a single block. This is the fastest way to replicate a carefully tuned effects chain across multiple programs. The COPY/PASTE function is only available when you are on the routing diagram row at the top of the FX OVERVIEW — not on a slot row. Moving effects (hold FX + BANK UP/DOWN or rotary) reorders the slots without losing their parameters.',
      highlightControls: ['prog-menu-fx', 'prog-menu-global', 'prog-menu-write', 'display'],
      panelStateChanges: {
        'prog-menu-fx': { active: false },
        'prog-menu-global': { active: true },
        'prog-menu-write': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'FX OVERVIEW',
        menuItems: [
          { label: 'FX HELD' },
          { label: 'GLOBAL : COPY FX' },
          { label: 'WRITE  : PASTE FX' },
        ],
        selectedIndex: 0,
        statusText: 'Hold FX for options',
      },
      tipText:
        'Tip: Keep all effects in SEND mode with MIX at 100% and use the LEVEL fader in the FX OVERVIEW to control how much of each effect you hear. This gives you a master wet-return control for each slot independently — useful when running reverb on slots 1-2 and delay on slots 3-4.',
    },
  ],
};
