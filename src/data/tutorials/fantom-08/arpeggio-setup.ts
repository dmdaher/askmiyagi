import { Tutorial } from '@/types/tutorial';

export const arpeggioSetup: Tutorial = {
  id: 'arpeggio-setup',
  deviceId: 'fantom-08',
  title: 'Setting Up Arpeggiator Patterns',
  description:
    'Learn how to use the Fantom 08 arpeggiator to automatically play notes in rhythmic patterns. Configure style, motif, hold, and variations, then enable the arpeggiator on a zone.',
  category: 'performance',
  difficulty: 'beginner',
  estimatedTime: '8 min',
  tags: ['arpeggio', 'performance', 'pattern', 'beginner'],
  steps: [
    {
      id: 'step-1',
      title: 'What Is the Arpeggiator?',
      instruction:
        'The arpeggiator automatically plays notes in patterns when you hold down keys. Instead of playing each note individually, just hold a chord and the Fantom plays the notes in sequence — up, down, random, and more.',
      details:
        'The Fantom 08 has 128 built-in arpeggio styles with multiple variations each. Arpeggio settings are saved per scene, and the tempo is shared with the rhythm pattern and sequencer.',
      highlightControls: [],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        sceneNumber: 'B012',
        sceneName: 'Synth Pad',
        tempo: 128,
        beatSignature: '4/4',
      },
    },
    {
      id: 'step-2',
      title: 'Open the Arpeggio Screen',
      instruction:
        'Press the Arpeggio button in the Zone section to open the arpeggiator settings screen.',
      details:
        'The Arpeggio screen shows all arpeggiator parameters in a vertical list: Style, Hold, Variation, Motif, Keyboard Velocity, Octave Range, Accent Rate, Shuffle Rate, and Shuffle Resolution.',
      highlightControls: ['arpeggio'],
      panelStateChanges: {
        arpeggio: { active: true, ledOn: true, ledColor: '#00ff44' },
      },
      displayState: {
        screenType: 'arpeggio',
        title: 'ARPEGGIO',
        selectedIndex: 0,
        statusText: 'Style: P001 NOTE VALUES | Hold: OFF',
      },
      tipText: 'The Arpeggio LED lights up green when the arpeggio screen is open.',
    },
    {
      id: 'step-3',
      title: 'Select a Style',
      instruction:
        'The cursor starts on Hold (the first parameter). Use the Cursor Down button to move to Motif, then back up — but first, notice the Style bar at the top shows "P001: NOTE VALUES". Turn the Value dial to change it to P003.',
      details:
        'There are 128 arpeggio styles (P001–P128). Each style defines a unique rhythmic and melodic pattern. Use the Value dial to browse styles. The style name updates in the top bar as you scroll.',
      highlightControls: ['value-dial'],
      panelStateChanges: {},
      displayState: {
        screenType: 'arpeggio',
        title: 'ARPEGGIO',
        selectedIndex: 0,
        statusText: 'Style: P003 — browsing styles',
      },
      tipText: 'Styles range from simple note patterns to complex rhythmic sequences.',
    },
    {
      id: 'step-4',
      title: 'Set the Motif to UP',
      instruction:
        'Use the Cursor Down button to move the selection to the Motif parameter, then turn the Value dial to set it to UP. This makes the arpeggiator play notes in ascending order.',
      details:
        'Available motifs: UP, DOWN, UP&DOWN, RANDOM, NOTE ORDER, GLISSANDO, CHORD, AUTO1, AUTO2, PHRASE. Each motif changes how the held notes are played back.',
      highlightControls: ['cursor-down', 'value-dial'],
      panelStateChanges: {},
      displayState: {
        screenType: 'arpeggio',
        title: 'ARPEGGIO',
        selectedIndex: 2,
      },
      tipText: 'UP plays notes from lowest to highest. Try RANDOM for more unpredictable results.',
    },
    {
      id: 'step-5',
      title: 'Enable Hold Mode',
      instruction:
        'Press the E1 function button below the display to toggle Hold to ON. When Hold is enabled, the arpeggio continues playing even after you release the keys.',
      details:
        'Hold mode is essential for live performance — it frees your hands to adjust other parameters while the arpeggio keeps running. You can also navigate to the Hold parameter and change it with the Value dial.',
      highlightControls: ['function-e1'],
      panelStateChanges: {},
      displayState: {
        screenType: 'arpeggio',
        title: 'ARPEGGIO',
        selectedIndex: 0,
        statusText: 'Hold: ON — arpeggio continues after key release',
      },
      tipText: 'The HOLD button at the bottom of the screen shows the current hold state.',
    },
    {
      id: 'step-6',
      title: 'Browse Variations',
      instruction:
        'Use the Cursor Up button to move to the Variation parameter, then turn the Value dial to explore different variations within the current style.',
      details:
        'Each style has multiple variations that add rhythmic or melodic complexity. The number of available variations depends on the selected style. Higher variation numbers typically add more intricate patterns.',
      highlightControls: ['cursor-up', 'value-dial'],
      panelStateChanges: {},
      displayState: {
        screenType: 'arpeggio',
        title: 'ARPEGGIO',
        selectedIndex: 1,
      },
      tipText: 'Try different variation numbers to find patterns that complement your playing style.',
    },
    {
      id: 'step-7',
      title: 'Enable Arpeggio on Zone 1',
      instruction:
        'Press Exit to leave the Arpeggio screen, then press Zone View to see your zones. The arpeggiator must be enabled per zone — select Zone 1 and press the Arpeggio button to toggle ARP on for this zone.',
      details:
        'Each zone has its own ARP on/off toggle. This lets you have the arpeggiator running on one zone while playing normally on another. The ARP indicator appears in the Zone View when enabled.',
      highlightControls: ['zone-1', 'arpeggio'],
      panelStateChanges: {
        'zone-1': { active: true, ledOn: true, ledColor: '#3B82F6' },
      },
      displayState: {
        screenType: 'zone-view',
        title: 'ZONE VIEW',
        sceneNumber: 'B012',
        sceneName: 'Synth Pad',
        tempo: 128,
        beatSignature: '4/4',
        zoneViewMode: 1,
        zones: [
          {
            zoneNumber: 1,
            zoneName: 'Zone 1',
            toneName: 'Saw Lead 1',
            toneType: 'Z-Core',
            toneBank: 'PR-A',
            toneCategory: 'Synth',
            toneNumber: '0156',
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
        'In Zone View, zones with ARP enabled show an ARP indicator next to the zone name.',
    },
    {
      id: 'step-8',
      title: 'Play the Arpeggio',
      instruction:
        'Hold down a chord on the keyboard and listen to the arpeggiator play the notes in sequence. Press Play to start the internal clock so the arpeggio syncs to the tempo.',
      details:
        'The arpeggiator follows the scene tempo. You can change the tempo with the Value dial while on the home screen, or use the tap tempo button. Hold mode keeps the arpeggio running after you release the keys.',
      highlightControls: ['play'],
      panelStateChanges: {
        play: { active: true, ledOn: true, ledColor: '#00ff44' },
      },
      displayState: {
        screenType: 'zone-view',
        title: 'ZONE VIEW',
        sceneNumber: 'B012',
        sceneName: 'Synth Pad',
        tempo: 128,
        beatSignature: '4/4',
        zoneViewMode: 1,
        zones: [
          {
            zoneNumber: 1,
            zoneName: 'Zone 1',
            toneName: 'Saw Lead 1',
            toneType: 'Z-Core',
            toneBank: 'PR-A',
            toneCategory: 'Synth',
            toneNumber: '0156',
            keyRangeLow: 'A0',
            keyRangeHigh: 'C8',
            volume: 100,
            pan: 0,
            muted: false,
            active: true,
          },
        ],
        statusText: 'ARP ON — Zone 1',
      },
      tipText: 'Try changing chords while the arpeggio runs to hear different note sequences.',
    },
    {
      id: 'step-9',
      title: 'Arpeggio Setup Complete!',
      instruction:
        "Press Stop to halt playback, then Exit to return to the home screen. You've set up the arpeggiator with a style, motif, hold, and enabled it on Zone 1.",
      details:
        'The arpeggio tempo is shared with the sequencer and rhythm patterns, so everything stays in sync. You can save your arpeggio settings by writing the scene. Try exploring different styles and motifs to find patterns that inspire your music.',
      highlightControls: ['stop', 'exit'],
      panelStateChanges: {
        stop: { active: true },
        play: { active: false, ledOn: false },
        arpeggio: { active: false, ledOn: false },
        'zone-1': { active: false, ledOn: false },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'B012',
        sceneName: 'Synth Pad',
        tempo: 128,
        beatSignature: '4/4',
        statusText: 'Arpeggio configured',
      },
      tipText:
        'Remember: arpeggio tempo is shared with the sequencer and rhythm pattern — everything stays in sync!',
    },
  ],
};
