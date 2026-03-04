import { Tutorial } from '@/types/tutorial';

export const advancedPadModes: Tutorial = {
  id: 'advanced-pad-modes',
  deviceId: 'fantom-08',
  title: 'Advanced Pad Modes — Beyond Sample Pad',
  description:
    'Explore the 12 pad modes on the Fantom 08: Note Pad for playing tones, Partial Sw/Sel for toggling partials, Zone Mute and Zone Solo for live mixing, Kbd Sw Group for switching zone configurations, and Pattern/Variation/Group Play for sequencer control.',
  category: 'performance',
  difficulty: 'intermediate',
  estimatedTime: '8 min',
  tags: ['pads', 'pad-mode', 'zone-mute', 'zone-solo', 'kbd-sw', 'pattern', 'intermediate'],
  steps: [
    {
      id: 'step-1',
      title: 'Beyond Sample Pad',
      instruction:
        'The Fantom 08 pads have 12 modes beyond just triggering samples. Each mode assigns a completely different function to the 16 pads — from playing tones and toggling partials to muting zones and triggering sequencer patterns.',
      details:
        'In this tutorial you will explore the most useful pad modes: Note Pad, Partial Sw/Sel, Zone Mute, Zone Solo, Kbd Sw Group, Pattern, and Variation Play.',
      highlightControls: [],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'Homecoming',
        tempo: 120,
        beatSignature: '4/4',
      },
    },
    {
      id: 'step-2',
      title: 'Open the PAD MODE Screen',
      instruction:
        'Press the PAD MODE button to open the pad mode selection screen. A 4x3 grid of available modes appears — each position maps to a physical pad number.',
      highlightControls: ['pad-mode'],
      panelStateChanges: {
        'pad-mode': { active: true },
      },
      displayState: {
        screenType: 'pad-mode',
        title: 'PAD MODE',
        statusText: 'Press the pads to select.',
        menuItems: [
          { label: '1: Sample Pad', selected: true },
          { label: '2: Note Pad' },
          { label: '3: Partial Sw/Sel' },
          { label: '4: DAW Control' },
          { label: '5: Zone Mute' },
          { label: '6: Zone Solo' },
          { label: '7: Kbd Sw Group' },
          { label: '8: Rhythm Pattern' },
          { label: '9: Pattern' },
          { label: '10: Variation Play' },
          { label: '11: Group Play' },
          { label: '16: System' },
        ],
        selectedIndex: 0,
      },
      tipText:
        'Press pads [1]–[8] or [9]–[11] and [16] to select a mode. You can also touch mode icons on screen.',
    },
    {
      id: 'step-3',
      title: 'Note Pad Mode',
      instruction:
        'Press pad [2] to activate Note Pad mode. Each pad plays a tone like a keyboard key — you can see per-pad assignments showing zone, note number, and velocity.',
      highlightControls: ['pad-2'],
      panelStateChanges: {
        'pad-mode': { active: false },
      },
      displayState: {
        screenType: 'menu',
        title: 'NOTE PAD',
        menuItems: [
          { label: '1: LD Kick 1  ZONE10 36(C 2) 100', selected: true },
          { label: '2: LD Crs Stk  ZONE10 37(C#2) 100' },
          { label: '3: LD Snr  ZONE10 38(D 2) 100' },
          { label: '4: Reg.Snr Gstt  ZONE10 39(Eb2) 100' },
          { label: '5: LD Rim  ZONE10 40(E 2) 100' },
          { label: '6: RR F.Tom 1  ZONE10 41(F 2) 100' },
        ],
        selectedIndex: 0,
      },
    },
    {
      id: 'step-4',
      title: 'Edit Note Pad Settings',
      instruction:
        'Use E1 to select a pad, then E4 to set the zone, E5 to set the note number, and E6 to set the velocity. Press E3 SYSTEM WRITE to save. Note Pad settings are saved as system settings.',
      highlightControls: ['function-e1', 'function-e5'],
      panelStateChanges: {},
      displayState: {
        screenType: 'popup',
        title: 'NOTE PAD',
        parameterName: 'Pad 1 Note Number',
        parameterValue: 'C2 (36)',
        popupData: { popupType: 'value' },
      },
      tipText:
        'Note Pad is great for triggering drum hits from specific zones while keeping both hands on the keyboard.',
    },
    {
      id: 'step-5',
      title: 'Partial Sw/Sel Mode',
      instruction:
        'Press pad [3] to activate Partial Sw/Sel. Pads 1–4 select partials (like picking which layer to edit), and pads 5–8 toggle each partial on or off. This is essential for multi-partial tone editing.',
      highlightControls: ['pad-3'],
      panelStateChanges: {
        'function-e1': { active: false },
        'function-e5': { active: false },
      },
      displayState: {
        screenType: 'menu',
        title: 'PARTIAL SW/SELECT',
        menuItems: [
          { label: 'Partial 1 Sw: On', selected: true },
          { label: 'Partial 2 Sw: On' },
          { label: 'Partial 3 Sw: Off' },
          { label: 'Partial 4 Sw: Off' },
          { label: 'Partial 1 Sel: On' },
          { label: 'Partial 2 Sel: On' },
        ],
        selectedIndex: 0,
      },
    },
    {
      id: 'step-6',
      title: 'Zone Mute Mode',
      instruction:
        'Press pad [5] to activate Zone Mute. Each pad corresponds to a zone number (1–16). Pressing a pad toggles that zone\'s mute state — the same as the Mute function in the Mixer screen.',
      highlightControls: ['pad-5'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'ZONE MUTE',
        menuItems: [
          { label: 'Zone1: On', selected: true },
          { label: 'Zone2: Off' },
          { label: 'Zone3: Off' },
          { label: 'Zone4: Off' },
          { label: 'Zone5: Off' },
          { label: 'Zone6: Off' },
        ],
        selectedIndex: 0,
      },
      tipText:
        'Zone Mute is perfect for live performance — mute and unmute zones on the fly to build up or break down your arrangement.',
    },
    {
      id: 'step-7',
      title: 'Zone Solo Mode',
      instruction:
        'Press pad [6] to activate Zone Solo. Pressing a pad solos that zone so only it is heard. Press the soloed pad again to defeat the solo and return to normal playback.',
      details:
        'Unlike Zone Mute where you can mute multiple zones simultaneously, Zone Solo only lets you solo one zone at a time.',
      highlightControls: ['pad-6'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'ZONE SOLO',
        menuItems: [
          { label: 'Zone1: Off' },
          { label: 'Zone2: Off' },
          { label: 'Zone3: Off' },
          { label: 'Zone4: Off' },
          { label: 'Zone5: Off' },
          { label: 'Zone6: Off' },
          { label: 'Zone7: On (Soloed)', selected: true },
        ],
        selectedIndex: 6,
      },
    },
    {
      id: 'step-8',
      title: 'Kbd Sw Group Select',
      instruction:
        'Press pad [7] to activate Kbd Sw Group. The display shows 16 group icons — each group is a pre-saved combination of zone INT/EXT on/off states. Press a pad to instantly switch between groups.',
      details:
        'Keyboard Switch Groups let you instantly switch which zones play from the keyboard while keeping the scene unchanged. This is powerful for live performance — different groups can activate different instrument combinations.',
      highlightControls: ['pad-7'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'KBD SW GRP SELECT',
        menuItems: [
          { label: 'Group1', selected: true },
          { label: 'Group2' },
          { label: 'Group3' },
          { label: 'Group4' },
          { label: 'Group5' },
          { label: 'Group6' },
        ],
        selectedIndex: 0,
      },
    },
    {
      id: 'step-9',
      title: 'Edit Kbd Sw Group',
      instruction:
        'Select a group and press E1 EDIT. The KBD SW GRP EDIT screen shows per-zone on/off states for the selected group. Touch a zone or press a pad to toggle its INT/EXT status.',
      highlightControls: ['function-e1'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'KBD SW GRP EDIT — GROUP 2',
        menuItems: [
          { label: 'ZONE1: Off' },
          { label: 'ZONE2: Off' },
          { label: 'ZONE3: On', selected: true },
          { label: 'ZONE4: On' },
          { label: 'ZONE5: Off' },
          { label: 'ZONE6: Off' },
        ],
        selectedIndex: 2,
      },
      tipText:
        'Save the scene after editing groups to keep your changes. Groups are stored per scene.',
    },
    {
      id: 'step-10',
      title: 'Pattern Play Mode',
      instruction:
        'Press pad [9] to activate Pattern mode. The pads directly trigger sequencer patterns from a 4x4 grid. Recorded patterns light up — press a pad to start playback from that pattern position.',
      highlightControls: ['pad-9'],
      panelStateChanges: {
        'function-e1': { active: false },
      },
      displayState: {
        screenType: 'pattern',
        title: 'PAD PATTERN',
        statusText: 'PAD PATTERN',
      },
      tipText:
        'Hold SHIFT + PAD MODE to access the PAD AREA SELECT screen, where you can move the 4x4 selection area around the pattern grid.',
    },
    {
      id: 'step-11',
      title: 'Variation Play Mode',
      instruction:
        'Press pad [10] to activate Variation Play. Pads directly play pattern variations from the next measure location: Pad 1 = variation A, Pad 4 = E, Pad 5 = B, Pad 8 = F, Pad 9 = C, Pad 12 = G, Pad 13 = D, Pad 16 = H.',
      highlightControls: ['pad-10'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'VARIATION PLAY',
        menuItems: [
          { label: 'Pad 1: Variation A', selected: true },
          { label: 'Pad 4: Variation E' },
          { label: 'Pad 5: Variation B' },
          { label: 'Pad 8: Variation F' },
          { label: 'Pad 9: Variation C' },
          { label: 'Pad 13: Variation D' },
        ],
        selectedIndex: 0,
      },
    },
    {
      id: 'step-12',
      title: 'Advanced Pad Modes Complete!',
      instruction:
        'You have explored the most powerful pad modes on the Fantom 08. Use Note Pad for drum triggering, Zone Mute/Solo for live mixing, Kbd Sw Group for instant zone switching, and Pattern/Variation Play for sequencer control.',
      details:
        'Each pad mode transforms the same 16 pads into a completely different controller surface. Experiment with different modes during performance to find your ideal workflow.',
      highlightControls: [],
      panelStateChanges: {
        'pad-10': { active: false },
        'pad-9': { active: false },
        'pad-7': { active: false },
        'pad-6': { active: false },
        'pad-5': { active: false },
        'pad-3': { active: false },
        'pad-2': { active: false },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'Homecoming',
        tempo: 120,
        beatSignature: '4/4',
      },
    },
  ],
};
