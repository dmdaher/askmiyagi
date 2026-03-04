import { Tutorial } from '@/types/tutorial';

export const midiCcMapping: Tutorial = {
  id: 'midi-cc-mapping',
  deviceId: 'fantom-08',
  title: 'CC Mapping with Knobs & Sliders',
  description:
    'Learn how the Fantom 08\'s three controller modes — PAN/LEVEL, CTRL, and ASSIGN — change what the sliders and knobs do, and how to customize CC assignments for your own workflow.',
  category: 'midi',
  difficulty: 'intermediate',
  estimatedTime: '10 min',
  tags: ['midi', 'cc', 'controller', 'assign', 'intermediate'],
  steps: [
    {
      id: 'step-1',
      title: 'Introduction — Three Controller Modes',
      instruction:
        'The Fantom 08 has eight sliders and eight knobs that can send different MIDI CC data depending on which controller mode is active. There are three modes: PAN/LEVEL, CTRL, and ASSIGN.',
      details:
        'Each mode reassigns what every slider and knob does. PAN/LEVEL is the default for mixing, CTRL gives you direct access to sound-shaping parameters, and ASSIGN lets you map any CC number you want. This tutorial walks through all three modes and shows you how to customize assignments.',
      highlightControls: ['pan-level', 'ctrl', 'assign'],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'INIT SCENE',
        tempo: 120,
        beatSignature: '4/4',
        statusText: 'Three controller modes: PAN/LEVEL, CTRL, ASSIGN',
      },
    },
    {
      id: 'step-2',
      title: 'PAN/LEVEL Mode — Mixing Controls',
      instruction:
        'Press the PAN/LEVEL button. In this mode, each knob controls the pan position (CC10) for its corresponding zone, and each slider controls the volume (CC7) for its corresponding zone.',
      details:
        'Knob 1 = Zone 1 pan, Knob 2 = Zone 2 pan, and so on. Slider 1 = Zone 1 volume, Slider 2 = Zone 2 volume. The knob and slider numbers match the zone numbers, so this is the most intuitive mode for live mixing. When you move a control, a popup shows the current parameter and value.',
      highlightControls: ['pan-level', 'slider-1', 'ctrl-knob-1'],
      panelStateChanges: {
        'pan-level': { active: true, ledOn: true },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'INIT SCENE',
        tempo: 120,
        beatSignature: '4/4',
        statusText: 'PAN/LEVEL: Knobs = Pan (CC10), Sliders = Volume (CC7)',
      },
      tipText:
        'Knob and slider numbers correspond to zone numbers — Slider 1 controls Zone 1 volume, Knob 1 controls Zone 1 pan.',
    },
    {
      id: 'step-3',
      title: 'CTRL Mode — Sound Shaping',
      instruction:
        'Press the CTRL button to switch to CTRL mode. In this mode, the SYNTH CTRL knobs (Cutoff, Resonance) become the primary controls for shaping the tone of the selected zone in real time.',
      details:
        'CTRL mode puts sound-design parameters at your fingertips. The Cutoff knob sweeps the filter frequency, and the Resonance knob adds emphasis at the cutoff point. This is essential for expressive performance — especially with synth patches.',
      highlightControls: ['ctrl', 'synth-cutoff', 'synth-resonance'],
      panelStateChanges: {
        'pan-level': { active: false, ledOn: false },
        ctrl: { active: true, ledOn: true },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'INIT SCENE',
        tempo: 120,
        beatSignature: '4/4',
        statusText: 'CTRL: Synth Cutoff & Resonance shape the sound live',
      },
      tipText:
        'In CTRL mode, the Cutoff and Resonance knobs in the SYNTH section control the currently selected zone\'s tone.',
    },
    {
      id: 'step-4',
      title: 'ASSIGN Mode — Custom Assignments (ASSIGN1)',
      instruction:
        'Press the ASSIGN button to enter ASSIGN mode. This is ASSIGN1 (Scene-level) — each knob and slider sends whichever CC or parameter you have assigned to it. Assignments are stored per scene.',
      details:
        'ASSIGN1 assignments are individual to each scene, so you can have different CC mappings for different performances. By default, the assignments may be empty or set to common CCs. You\'ll customize them in the next steps.',
      highlightControls: ['assign'],
      panelStateChanges: {
        ctrl: { active: false, ledOn: false },
        assign: { active: true },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'INIT SCENE',
        tempo: 120,
        beatSignature: '4/4',
        statusText: 'ASSIGN1 (Scene): Custom CC mapping per scene',
      },
      tipText:
        'ASSIGN1 is scene-level — your custom mappings are saved with each scene independently.',
    },
    {
      id: 'step-5',
      title: 'Open the ASSIGN Editor',
      instruction:
        'Hold SHIFT and press ASSIGN to open the assignment editor screen. This shows what each knob and slider is currently assigned to, and lets you change the assignments.',
      details:
        'The assignment editor lists all eight sliders and all eight knobs with their current CC or parameter assignment. Use the Cursor buttons to navigate the list and the Value Dial to change assignments.',
      highlightControls: ['shift', 'assign'],
      panelStateChanges: {
        shift: { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'ASSIGN1 SETTING',
        menuItems: [
          { label: 'Slider 1', value: 'CC#16', selected: true },
          { label: 'Slider 2', value: 'CC#17' },
          { label: 'Slider 3', value: 'CC#18' },
          { label: 'Slider 4', value: 'CC#19' },
          { label: 'Knob 1', value: 'CC#80' },
          { label: 'Knob 2', value: 'CC#81' },
        ],
        selectedIndex: 0,
        statusText: 'SHIFT + ASSIGN opens the assignment editor',
      },
      tipText:
        'SHIFT + ASSIGN is the shortcut to jump straight into the assignment editor from any screen.',
    },
    {
      id: 'step-6',
      title: 'Assign Slider 1 to CC#1 (Modulation)',
      instruction:
        'With Slider 1 selected, turn the Value Dial to change its assignment to CC#1 (Modulation). Then press Cursor Down to move to the next item.',
      details:
        'CC#1 is the standard MIDI Modulation controller. Mapping it to Slider 1 gives you a large, easy-to-reach fader for adding vibrato or other mod-wheel effects without taking your hand off the keyboard.',
      highlightControls: ['value-dial', 'cursor-down'],
      panelStateChanges: {
        shift: { active: false },
      },
      displayState: {
        screenType: 'menu',
        title: 'ASSIGN1 SETTING',
        menuItems: [
          { label: 'Slider 1', value: 'CC#1 (Modulation)', selected: true },
          { label: 'Slider 2', value: 'CC#17' },
          { label: 'Slider 3', value: 'CC#18' },
          { label: 'Slider 4', value: 'CC#19' },
          { label: 'Knob 1', value: 'CC#80' },
          { label: 'Knob 2', value: 'CC#81' },
        ],
        selectedIndex: 0,
        statusText: 'Slider 1 → CC#1 (Modulation)',
      },
      tipText:
        'CC#1 (Modulation) is the same controller as the mod wheel — now you have a slider for it too.',
    },
    {
      id: 'step-7',
      title: 'Assign Knob 1 to CC#74 (Filter Cutoff)',
      instruction:
        'Navigate down to Knob 1 and turn the Value Dial to assign it to CC#74 (Filter Cutoff). This gives you a dedicated knob for sweeping the filter on external synths or DAW plugins.',
      details:
        'CC#74 is the standard MIDI controller for filter brightness / cutoff frequency. Many hardware synths and DAW plugins respond to CC#74 by default, making this a universally useful assignment.',
      highlightControls: ['value-dial'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'ASSIGN1 SETTING',
        menuItems: [
          { label: 'Slider 1', value: 'CC#1 (Modulation)' },
          { label: 'Slider 2', value: 'CC#17' },
          { label: 'Slider 3', value: 'CC#18' },
          { label: 'Slider 4', value: 'CC#19' },
          { label: 'Knob 1', value: 'CC#74 (Filter Cutoff)', selected: true },
          { label: 'Knob 2', value: 'CC#81' },
        ],
        selectedIndex: 4,
        statusText: 'Knob 1 → CC#74 (Filter Cutoff)',
      },
      tipText:
        'CC#74 is recognized by most synths and DAW plugins as the filter cutoff controller.',
    },
    {
      id: 'step-8',
      title: 'ASSIGN2 — System-Wide Assignments',
      instruction:
        'Press PAN/LEVEL and ASSIGN together to switch to ASSIGN2 (System-level). ASSIGN2 assignments are common across all scenes — they apply everywhere regardless of which scene is loaded.',
      details:
        'ASSIGN1 (scene) and ASSIGN2 (system) are independent layers. Use ASSIGN1 for per-scene custom mappings and ASSIGN2 for global assignments you always want available (like a master filter or expression control). To edit ASSIGN2 assignments, hold SHIFT and press ASSIGN while in ASSIGN2 mode.',
      highlightControls: ['pan-level', 'assign'],
      panelStateChanges: {
        'pan-level': { active: true },
        assign: { active: true },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'INIT SCENE',
        tempo: 120,
        beatSignature: '4/4',
        statusText: 'ASSIGN2 (System): Assignments shared across all scenes',
      },
      tipText:
        'ASSIGN2 (system) keeps your assignments consistent no matter which scene you switch to.',
    },
    {
      id: 'step-9',
      title: 'Test Your Assignments',
      instruction:
        'Switch back to ASSIGN1 by pressing ASSIGN alone, then move Slider 1 and turn Knob 1 to verify your new CC assignments are working. A popup appears showing the CC number and current value.',
      details:
        'When you move an assigned control, the Fantom 08 shows a brief popup on the display with the parameter name and value (e.g., "CC#1 = 64"). If you are connected to a DAW or external synth, you should see the corresponding parameter respond.',
      highlightControls: ['slider-1', 'ctrl-knob-1'],
      panelStateChanges: {
        'pan-level': { active: false },
        assign: { active: true },
        'slider-1': { active: true, value: 80 },
        'ctrl-knob-1': { active: true, value: 64 },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'INIT SCENE',
        tempo: 120,
        beatSignature: '4/4',
        statusText: 'Testing: Slider 1 = CC#1, Knob 1 = CC#74',
      },
      tipText:
        'Moving a control shows a popup with the CC number and value — use this to confirm your assignments are correct.',
    },
    {
      id: 'step-10',
      title: 'CC Mapping Complete!',
      instruction:
        'You now know how to use all three controller modes on the Fantom 08: PAN/LEVEL for mixing, CTRL for sound shaping, and ASSIGN for custom CC mappings.',
      details:
        'Key takeaways: PAN/LEVEL maps knobs to pan (CC10) and sliders to volume (CC7) per zone. CTRL activates the Synth Cutoff and Resonance knobs. ASSIGN1 stores custom mappings per scene, ASSIGN2 stores them system-wide. Use SHIFT + ASSIGN to open the assignment editor. Next, try the "DAW Controller Setup" tutorial to learn how to control your DAW directly from the Fantom 08.',
      highlightControls: [],
      panelStateChanges: {
        assign: { active: false },
        'slider-1': { active: false, value: 0 },
        'ctrl-knob-1': { active: false, value: 0 },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'INIT SCENE',
        tempo: 120,
        beatSignature: '4/4',
        statusText: 'Complete: PAN/LEVEL, CTRL, ASSIGN1 (Scene), ASSIGN2 (System)',
      },
      tipText:
        'Remember: ASSIGN1 = per-scene, ASSIGN2 = system-wide. SHIFT + ASSIGN opens the editor for whichever is active.',
    },
  ],
};
