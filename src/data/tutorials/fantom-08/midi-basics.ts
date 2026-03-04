import { Tutorial } from '@/types/tutorial';

export const midiBasics: Tutorial = {
  id: 'midi-basics',
  deviceId: 'fantom-08',
  title: 'Connecting External MIDI Gear',
  description:
    'Learn how to set up a zone to control an external MIDI device. You will configure Zone 2 as an EXT zone, set its MIDI channel, and use the Fantom 08 keyboard to play an external synth or sound module.',
  category: 'midi',
  difficulty: 'beginner',
  estimatedTime: '8 min',
  tags: ['midi', 'external', 'zones', 'beginner'],
  steps: [
    {
      id: 'step-1',
      title: 'Welcome — Controlling External Gear',
      instruction:
        'In this tutorial, you will set up Zone 2 to control an external MIDI synthesizer or sound module. By the end, your Fantom 08 keyboard will send MIDI notes on a dedicated channel to your external device.',
      details:
        'Make sure your external MIDI device is connected to the Fantom 08 MIDI OUT port (5-pin DIN) or via USB. The external device should be set to receive on MIDI channel 2.',
      highlightControls: [],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'INIT SCENE',
        tempo: 120,
        beatSignature: '4/4',
        statusText: 'Set up Zone 2 to control external MIDI gear',
      },
    },
    {
      id: 'step-2',
      title: 'Open Zone View',
      instruction:
        'Press the Zone View button to see an overview of all zones. Right now, only Zone 1 is active as an internal (INT) zone, covering the full keyboard.',
      details:
        'Zone View displays each active zone with its tone assignment, key range, and volume. The zone LED colors tell you the mode: Red = INT (internal sounds), Green = EXT (external MIDI).',
      highlightControls: ['zone-view'],
      panelStateChanges: {
        'zone-view': { active: true },
      },
      displayState: {
        screenType: 'zone-view',
        title: 'ZONE VIEW',
        sceneNumber: 'A001',
        sceneName: 'INIT SCENE',
        tempo: 120,
        beatSignature: '4/4',
        zoneViewMode: 4,
        statusText: 'Zone 1 active — internal (INT) zone',
        zones: [
          {
            zoneNumber: 1,
            zoneName: 'Zone 1',
            toneName: 'Concert Grand',
            toneType: 'SN-AP',
            toneBank: 'PR-A',
            toneCategory: 'Ac.Piano',
            toneNumber: '0001',
            keyRangeLow: 'A0',
            keyRangeHigh: 'C8',
            volume: 100,
            pan: 0,
            muted: false,
            active: true,
          },
        ],
      },
      tipText:
        'Zone 1 LED is red, indicating it plays the Fantom 08 internal sounds.',
    },
    {
      id: 'step-3',
      title: 'Select Zone 2',
      instruction:
        'Press Zone Select to enter zone selection mode, then press the Zone 2 button to select it. This activates Zone 2 so we can configure it.',
      details:
        'Zone Select lets you pick which zone to edit. When Zone Select is lit, pressing a zone button selects that zone without changing its INT/EXT setting.',
      highlightControls: ['zone-select', 'zone-2'],
      panelStateChanges: {
        'zone-view': { active: false },
        'zone-select': { active: true },
        'zone-1': { active: true, ledOn: true, ledColor: '#EF4444' },
        'zone-2': { active: true, ledOn: true, ledColor: '#EF4444' },
      },
      displayState: {
        screenType: 'zone-view',
        title: 'ZONE VIEW',
        sceneNumber: 'A001',
        sceneName: 'INIT SCENE',
        tempo: 120,
        beatSignature: '4/4',
        zoneViewMode: 4,
        statusText: 'Zone 2 selected — currently INT (red LED)',
        zones: [
          {
            zoneNumber: 1,
            zoneName: 'Zone 1',
            toneName: 'Concert Grand',
            toneType: 'SN-AP',
            toneBank: 'PR-A',
            toneCategory: 'Ac.Piano',
            toneNumber: '0001',
            keyRangeLow: 'A0',
            keyRangeHigh: 'C8',
            volume: 100,
            pan: 0,
            muted: false,
            active: false,
          },
          {
            zoneNumber: 2,
            zoneName: 'Zone 2',
            toneName: 'INIT TONE',
            toneType: 'Z-Core',
            toneBank: 'PR-A',
            toneCategory: 'Init',
            toneNumber: '0001',
            keyRangeLow: 'A0',
            keyRangeHigh: 'C8',
            volume: 100,
            pan: 0,
            muted: false,
            active: true,
          },
        ],
      },
      tipText:
        'Both Zone 1 and Zone 2 LEDs are red — both are currently set to INT (internal sounds).',
    },
    {
      id: 'step-4',
      title: 'Set Zone 2 to EXT',
      instruction:
        'Hold SHIFT and press the Zone 2 button to toggle it from INT to EXT. The Zone 2 LED changes from Red (INT) to Green (EXT), meaning it now sends MIDI to your external device instead of playing internal sounds.',
      details:
        'LED colors: Red = INT (internal sounds), Green = EXT (external MIDI), Yellow = BOTH (advanced mode only), Orange = MUTE. When a zone is EXT, the Fantom 08 produces no sound for that zone — all notes go out the MIDI port.',
      highlightControls: ['shift', 'zone-2'],
      panelStateChanges: {
        'zone-select': { active: false },
        shift: { active: true },
        'zone-2': { active: true, ledOn: true, ledColor: '#22C55E' },
      },
      displayState: {
        screenType: 'zone-view',
        title: 'ZONE VIEW',
        sceneNumber: 'A001',
        sceneName: 'INIT SCENE',
        tempo: 120,
        beatSignature: '4/4',
        zoneViewMode: 4,
        statusText: 'Zone 2 is now EXT (green LED) — sends MIDI externally',
        zones: [
          {
            zoneNumber: 1,
            zoneName: 'Zone 1',
            toneName: 'Concert Grand',
            toneType: 'SN-AP',
            toneBank: 'PR-A',
            toneCategory: 'Ac.Piano',
            toneNumber: '0001',
            keyRangeLow: 'A0',
            keyRangeHigh: 'C8',
            volume: 100,
            pan: 0,
            muted: false,
            active: false,
          },
          {
            zoneNumber: 2,
            zoneName: 'Zone 2 (EXT)',
            toneName: 'EXT Ch.1',
            toneNumber: '---',
            keyRangeLow: 'A0',
            keyRangeHigh: 'C8',
            volume: 100,
            pan: 0,
            muted: false,
            active: true,
            intExt: 'EXT',
          },
        ],
      },
      tipText:
        'The green LED confirms Zone 2 is in EXT mode. Your external synth will receive MIDI when you play the keyboard.',
    },
    {
      id: 'step-5',
      title: 'Open Zone Edit for Zone 2',
      instruction:
        'Press Enter to open Zone Edit for Zone 2. Since Zone 2 is an EXT zone, the editor shows MIDI-specific parameters: MIDI Channel, Bank Select, and Program Change.',
      details:
        'Zone Edit for EXT zones has a different set of parameters than INT zones. Instead of tone and sound-shaping controls, you see MIDI routing options that tell the Fantom 08 which channel and program to send to your external device.',
      highlightControls: ['enter'],
      panelStateChanges: {
        shift: { active: false },
        enter: { active: true },
        'zone-2': { active: true, ledOn: true, ledColor: '#22C55E' },
      },
      displayState: {
        screenType: 'zone-edit',
        title: 'ZONE EDIT',
        zoneEditCategory: 'EXT',
        activeTab: 'OUT/PC',
        menuItems: [
          { label: 'MIDI Ch', value: '1', selected: true },
          { label: 'Bank Sel MSB', value: '---' },
          { label: 'Bank Sel LSB', value: '---' },
          { label: 'PC', value: '---' },
        ],
        selectedIndex: 0,
        statusText: 'Zone Edit — EXT zone MIDI parameters',
        zones: [
          {
            zoneNumber: 2,
            zoneName: 'Zone 2 (EXT)',
            toneName: 'EXT Ch.1',
            toneNumber: '---',
            keyRangeLow: 'A0',
            keyRangeHigh: 'C8',
            volume: 100,
            pan: 0,
            muted: false,
            active: true,
            intExt: 'EXT',
          },
        ],
      },
      tipText:
        'EXT zone edit shows MIDI Ch, Bank Sel MSB, Bank Sel LSB, and PC (Program Change) — these control which sound your external device plays.',
    },
    {
      id: 'step-6',
      title: 'Set MIDI Channel to 2',
      instruction:
        'Turn the Value dial to change the MIDI channel from 1 to 2. This tells Zone 2 to send all its MIDI data on channel 2, matching your external device.',
      details:
        'MIDI channels 1-16 let multiple devices share a single MIDI connection. By setting Zone 2 to channel 2 and your external synth to receive on channel 2, only that device responds to Zone 2 notes. Zone 1 stays on channel 1 for internal sounds.',
      highlightControls: ['value-dial'],
      panelStateChanges: {},
      displayState: {
        screenType: 'zone-edit',
        title: 'ZONE EDIT',
        zoneEditCategory: 'EXT',
        activeTab: 'OUT/PC',
        menuItems: [
          { label: 'MIDI Ch', value: '2', selected: true },
          { label: 'Bank Sel MSB', value: '---' },
          { label: 'Bank Sel LSB', value: '---' },
          { label: 'PC', value: '---' },
        ],
        selectedIndex: 0,
        statusText: 'MIDI Ch set to 2 — matches external device',
      },
      tipText:
        'Make sure your external synth is also set to receive on MIDI channel 2, or it will not respond.',
    },
    {
      id: 'step-7',
      title: 'Control External Volume with PAN/LEVEL',
      instruction:
        'Press Exit to return to the home screen, then press PAN/LEVEL to enter volume/pan mode. Move Slider 2 to control the external device\'s volume — this sends MIDI CC7 (Volume) on channel 2.',
      details:
        'In PAN/LEVEL mode, each slider controls the volume for its corresponding zone (CC7), and each knob controls pan (CC10). Since Zone 2 is EXT, the CC7 message goes out the MIDI port to your external device.',
      highlightControls: ['exit', 'pan-level', 'slider-2'],
      panelStateChanges: {
        enter: { active: false },
        exit: { active: true },
        'pan-level': { active: true },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'INIT SCENE',
        tempo: 120,
        beatSignature: '4/4',
        statusText: 'PAN/LEVEL mode — Slider 2 sends CC7 to external device',
      },
      tipText:
        'CC7 is the universal MIDI volume control. Most external synths respond to it automatically.',
    },
    {
      id: 'step-8',
      title: 'Play the Keyboard',
      instruction:
        'Play notes on the Fantom 08 keyboard. Zone 1 plays the internal Concert Grand piano, while Zone 2 simultaneously sends MIDI notes on channel 2 to your external device. You hear both at once.',
      details:
        'Both zones cover the full keyboard range (A0-C8), so every note you play triggers both the internal piano and your external synth. To separate them, you could split the keyboard using the Split button — but for now, the layered response shows that EXT zones work alongside INT zones.',
      highlightControls: [],
      panelStateChanges: {
        exit: { active: false },
        'pan-level': { active: false },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'INIT SCENE',
        tempo: 120,
        beatSignature: '4/4',
        statusText: 'Playing — Zone 1 internal + Zone 2 sends MIDI to external',
      },
      tipText:
        'If you do not hear your external device, check: MIDI cable connection, correct receive channel (2), and that the device volume is up.',
    },
    {
      id: 'step-9',
      title: 'Complete — External MIDI Setup',
      instruction:
        'You have successfully set up Zone 2 as an EXT zone on MIDI channel 2. The Fantom 08 now controls your external synthesizer alongside its own internal sounds.',
      details:
        'What you learned: toggling zones between INT and EXT using SHIFT + Zone button, setting the MIDI channel in Zone Edit, and using PAN/LEVEL sliders to send CC7 volume to external gear. Next, try the "CC Mapping with Knobs & Sliders" tutorial to customize what your knobs and sliders send.',
      highlightControls: [],
      panelStateChanges: {
        'zone-1': { active: false, ledOn: false },
        'zone-2': { active: false, ledOn: false },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'INIT SCENE',
        tempo: 120,
        beatSignature: '4/4',
        statusText: 'Zone 2 is EXT on MIDI Ch 2 — controlling external gear',
      },
      tipText:
        'You can save this setup by pressing Write. You can also set multiple zones to EXT to control several external devices at once.',
    },
  ],
};
