import { Tutorial } from '@/types/tutorial';

export const midiConcepts: Tutorial = {
  id: 'midi-concepts',
  deviceId: 'fantom-08',
  title: 'Understanding MIDI Concepts',
  description:
    'Learn the fundamentals of MIDI (Musical Instrument Digital Interface) and how the Fantom 08 uses MIDI channels, zones, CC messages, and controller modes to communicate with other gear and DAWs.',
  category: 'midi',
  difficulty: 'beginner',
  estimatedTime: '5 min',
  tags: ['midi', 'concepts', 'beginner', 'introduction'],
  steps: [
    {
      id: 'step-1',
      title: 'What Is MIDI?',
      instruction:
        'MIDI stands for Musical Instrument Digital Interface. It is a universal protocol that lets keyboards, synthesizers, drum machines, computers, and other music gear communicate with each other.',
      details:
        'MIDI does not transmit audio — it transmits performance data: which notes you play, how hard you press them, which knobs you turn, and when you start and stop. Think of it like sheet music that instruments read in real time. The Fantom 08 both sends and receives MIDI.',
      highlightControls: [],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'INIT SCENE',
        tempo: 120,
        beatSignature: '4/4',
        statusText: 'MIDI — Musical Instrument Digital Interface',
      },
    },
    {
      id: 'step-2',
      title: 'MIDI Ports — How Devices Connect',
      instruction:
        'The Fantom 08 connects to other MIDI gear in two ways: the traditional 5-pin DIN MIDI ports on the back panel, and via USB to a computer. Both carry the same MIDI data.',
      details:
        'The 5-pin DIN MIDI OUT sends note and control data to external synths and sound modules. MIDI IN receives data from external controllers. The USB port handles MIDI communication with your DAW — no separate MIDI interface needed.',
      highlightControls: ['menu'],
      panelStateChanges: {
        menu: { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'SYSTEM',
        menuItems: [
          { label: 'MIDI', selected: true },
          { label: 'General' },
          { label: 'Sound' },
          { label: 'USB Driver' },
        ],
        selectedIndex: 0,
        statusText: 'MIDI ports: 5-pin DIN OUT/IN + USB',
      },
      tipText:
        'The USB connection also carries audio — the Fantom 08 acts as a USB audio interface for your DAW.',
    },
    {
      id: 'step-3',
      title: 'MIDI Channels (1–16)',
      instruction:
        'MIDI supports 16 independent channels on a single connection. Each zone on the Fantom 08 can send and receive on its own MIDI channel, so different zones talk to different instruments or DAW tracks.',
      details:
        'Think of MIDI channels like TV channels — multiple programs share the same cable, but each device listens to its own channel. Zone 1 might send on channel 1, Zone 2 on channel 2, and so on.',
      highlightControls: ['zone-1', 'zone-2'],
      panelStateChanges: {
        menu: { active: false },
        'zone-1': { active: true, ledOn: true, ledColor: '#3B82F6' },
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
        statusText: 'Each zone sends on its own MIDI channel',
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
          {
            zoneNumber: 2,
            zoneName: 'Zone 2',
            toneName: 'Finger Bass',
            toneType: 'SN-AP',
            toneBank: 'PR-A',
            toneCategory: 'Bass',
            toneNumber: '0021',
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
        'Zone 1 defaults to MIDI channel 1, Zone 2 to channel 2, and so on up to Zone 16.',
    },
    {
      id: 'step-4',
      title: 'INT vs EXT Zones',
      instruction:
        'Each zone can be set to INT (Internal) or EXT (External). An INT zone plays the Fantom 08\'s own sounds. An EXT zone sends MIDI to an external device instead — the Fantom produces no sound for that zone.',
      details:
        'To toggle a zone between INT and EXT, hold SHIFT and press the zone button. The LED color tells you the mode: Red = INT (playing internal sounds), Green = EXT (sending MIDI out to external gear). This is how you control external synths from the Fantom\'s keyboard.',
      highlightControls: ['zone-1', 'zone-2', 'shift'],
      panelStateChanges: {
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
        statusText: 'SHIFT + Zone button toggles INT/EXT',
        zones: [
          {
            zoneNumber: 1,
            zoneName: 'Zone 1 (INT)',
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
          {
            zoneNumber: 2,
            zoneName: 'Zone 2 (EXT)',
            toneName: 'EXT Ch.2',
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
        'LED colors: Red = INT (internal sounds), Green = EXT (external MIDI). You can mix INT and EXT zones in the same scene.',
    },
    {
      id: 'step-5',
      title: 'CC Messages — Control Change',
      instruction:
        'When you move a slider, turn a knob, or rock the mod wheel, the Fantom 08 sends CC (Control Change) messages. These are numbered 0–127 and control things like volume (CC7), modulation (CC1), and filter cutoff (CC74).',
      details:
        'CC messages let you shape your sound in real time and automate parameters in a DAW. The mod wheel (Wheel 1) sends CC1 by default. Sliders and knobs send different CCs depending on the controller mode.',
      highlightControls: ['wheel-1', 'slider-1', 'ctrl-knob-1'],
      panelStateChanges: {
        shift: { active: false },
        'zone-1': { active: false, ledOn: false },
        'zone-2': { active: false, ledOn: false },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'INIT SCENE',
        tempo: 120,
        beatSignature: '4/4',
        statusText: 'CC messages: Volume (CC7), Mod (CC1), Cutoff (CC74)',
      },
      tipText:
        'CC stands for Control Change. Common CCs: 1 = Modulation, 7 = Volume, 10 = Pan, 64 = Sustain, 74 = Filter Cutoff.',
    },
    {
      id: 'step-6',
      title: 'Controller Modes — PAN/LEVEL, CTRL, ASSIGN',
      instruction:
        'The sliders and knobs have three modes that change what MIDI data they send. Press PAN/LEVEL, CTRL, or ASSIGN to switch modes. PAN/LEVEL and CTRL have LEDs that light up when active.',
      details:
        'PAN/LEVEL mode: sliders control zone volume (CC7), knobs control pan (CC10). CTRL mode: sliders and knobs send fixed CC numbers for common parameters like filter cutoff and resonance. ASSIGN mode: you choose which CC each slider and knob sends — full customization.',
      highlightControls: ['pan-level', 'ctrl', 'assign'],
      panelStateChanges: {
        'pan-level': { active: true },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'INIT SCENE',
        tempo: 120,
        beatSignature: '4/4',
        statusText: 'Three controller modes: PAN/LEVEL, CTRL, ASSIGN',
      },
      tipText:
        'PAN/LEVEL is the default mode. Switch to CTRL for sound-shaping or ASSIGN for custom CC mapping.',
    },
    {
      id: 'step-7',
      title: 'DAW Control Mode',
      instruction:
        'The Fantom 08 has a dedicated DAW Control mode that turns the panel into a DAW controller. The pads, sliders, and transport buttons map to your DAW\'s mixer and transport.',
      details:
        'Press the DAW CTRL button to enter DAW Control mode. The sliders become DAW faders, pads trigger DAW functions, and Play/Stop/Rec control your DAW\'s transport. This uses standard MIDI CC and MMC (MIDI Machine Control) messages. Supported DAWs include Logic Pro, Ableton Live, Cubase, and Studio One.',
      highlightControls: ['daw-ctrl', 'pad-mode'],
      panelStateChanges: {
        'pan-level': { active: false },
        'daw-ctrl': { active: true },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'INIT SCENE',
        tempo: 120,
        beatSignature: '4/4',
        statusText: 'DAW Control — sliders, pads, and transport control your DAW',
      },
      tipText:
        'DAW Control mode works over USB. Make sure the Fantom 08 is connected to your computer via USB.',
    },
    {
      id: 'step-8',
      title: 'MIDI Concepts — Summary',
      instruction:
        'You now understand the core MIDI concepts used by the Fantom 08: MIDI ports, channels, INT vs EXT zones, CC messages, controller modes, and DAW control.',
      details:
        'Next steps: try the "Connecting External MIDI Gear" tutorial to set up EXT zones, or "CC Mapping with Knobs & Sliders" to customize what your sliders and knobs send. MIDI is the foundation of everything — once you understand it, connecting gear and automating your DAW becomes second nature.',
      highlightControls: [],
      panelStateChanges: {
        'daw-ctrl': { active: false },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'INIT SCENE',
        tempo: 120,
        beatSignature: '4/4',
        statusText: 'MIDI: Ports, Channels, INT/EXT, CC, Controller Modes, DAW Control',
      },
      tipText:
        'MIDI has been the standard since 1983 — nearly every piece of music gear speaks it.',
    },
  ],
};
