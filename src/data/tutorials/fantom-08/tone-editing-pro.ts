import { Tutorial } from '@/types/tutorial';

export const toneEditingPro: Tutorial = {
  id: 'tone-editing-pro',
  deviceId: 'fantom-08',
  title: 'Detailed Tone Editing (PRO View)',
  description:
    'Master the Tone Edit PRO screen for detailed, grid-based editing of all tone parameters. Compare and adjust partials side-by-side using the multi-column view.',
  category: 'sound-design',
  difficulty: 'intermediate',
  estimatedTime: '7 min',
  tags: ['tone-edit', 'pro', 'sound-design', 'intermediate', 'partials'],
  steps: [
    {
      id: 'step-1',
      title: 'Introduction to PRO Editing',
      instruction:
        "The Tone Edit PRO screen shows all parameters in a detailed grid, letting you see and edit multiple partials side-by-side. It's the most powerful editing view on the Fantom 08.",
      details:
        "While ZOOM view shows one section at a time, PRO view displays a spreadsheet-like grid with one column per partial. This is ideal for comparing values across partials and making precise adjustments.",
      highlightControls: [],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        sceneNumber: 'A012',
        sceneName: 'Ambient Pad',
        tempo: 90,
        beatSignature: '4/4',
      },
    },
    {
      id: 'step-2',
      title: 'Select Zone 1',
      instruction:
        'Press the Zone 1 button to select the zone with our Analog Pad tone.',
      highlightControls: ['zone-1'],
      panelStateChanges: {
        'zone-1': { active: true, ledOn: true, ledColor: '#3B82F6' },
      },
      displayState: {
        screenType: 'zone-view',
        title: 'ZONE VIEW',
        sceneNumber: 'A012',
        sceneName: 'Ambient Pad',
        tempo: 90,
        beatSignature: '4/4',
        zoneViewMode: 1,
        zones: [
          {
            zoneNumber: 1,
            zoneName: 'Zone 1',
            toneName: 'Analog Pad',
            toneType: 'Z-Core',
            toneBank: 'PR-A',
            toneCategory: 'Pad',
            toneNumber: '0280',
            keyRangeLow: 'A0',
            keyRangeHigh: 'C8',
            volume: 100,
            pan: 0,
            muted: false,
            active: true,
          },
        ],
      },
      zones: [
        {
          zoneNumber: 1,
          color: '#3B82F6',
          lowNote: 21,
          highNote: 108,
          label: 'Zone 1 (Analog Pad)',
        },
      ],
    },
    {
      id: 'step-3',
      title: 'Enter Tone Edit ZOOM',
      instruction:
        'Press the PARAM button to open the Tone Edit ZOOM screen. We will then switch to PRO view from here.',
      details:
        'You can enter Tone Edit ZOOM via PARAM or any of the Synth Control buttons (OSC, FILTER TYPE, AMP, FX, LFO).',
      highlightControls: ['synth-param'],
      panelStateChanges: {
        'synth-param': { active: true },
      },
      displayState: {
        screenType: 'tone-edit-zoom',
        activeTab: 'FILTER',
        selectedIndex: 0,
        toneEditData: {
          toneType: 'Z-CORE',
          activePartials: [true, true, true, false],
          selectedPartial: 0,
        },
        menuItems: [
          { label: 'Filter Type: LPF', selected: true },
          { label: 'Cutoff: 80' },
          { label: 'Resonance: 30' },
          { label: 'Key Follow: +100' },
        ],
      },
      tipText:
        'The ZOOM screen opens on whichever tab matches the button you pressed — PARAM opens the FILTER tab.',
    },
    {
      id: 'step-4',
      title: 'Switch to PRO View',
      instruction:
        'Touch the <To PRO> button on screen to switch from ZOOM to PRO view. The display changes to show a multi-column grid with one column per partial.',
      highlightControls: ['display'],
      panelStateChanges: {},
      displayState: {
        screenType: 'tone-edit-pro',
        activeTab: 'FILTER',
        selectedIndex: 0,
        menuItems: [
          { label: 'Filter Type', values: ['TVF', 'TVF', 'TVF', '---'] },
          { label: 'TVF Type', values: ['LPF', 'LPF', 'LPF', '---'], selected: true },
          { label: 'Filter Slope', values: ['-12dB', '-12dB', '-12dB', '---'] },
          { label: 'Cutoff', values: ['127', '80', '100', '---'] },
        ],
        toneEditData: {
          toneType: 'Z-CORE',
          activePartials: [true, true, true, false],
          selectedPartial: 0,
        },
      },
      tipText:
        'PRO view shows Partial 1-4 columns. Dashes (---) indicate inactive partials.',
    },
    {
      id: 'step-5',
      title: 'Browse Parameter Tabs',
      instruction:
        'Turn E1 to scroll through the tabs on the left side. Navigate to the OSC tab to see oscillator parameters for all partials.',
      highlightControls: ['function-e1'],
      panelStateChanges: {},
      displayState: {
        screenType: 'tone-edit-pro',
        activeTab: 'OSC',
        selectedIndex: 0,
        menuItems: [
          { label: 'Wave Type', values: ['SAW', 'SQR', 'SAW', '---'], selected: true },
          { label: 'Wave Variation', values: ['---', '---', '---', '---'] },
          { label: 'Gain', values: ['0dB', '0dB', '0dB', '---'] },
          { label: 'Detune', values: ['0', '+7', '-7', '---'] },
        ],
        toneEditData: {
          toneType: 'Z-CORE',
          activePartials: [true, true, true, false],
          selectedPartial: 0,
        },
      },
      tipText:
        'Notice how each partial can have different wave types — this is what gives pads their rich character.',
    },
    {
      id: 'step-6',
      title: 'Navigate to a Parameter',
      instruction:
        'Turn E1 back to the FILTER tab, then use Cursor Down to navigate to the Cutoff parameter row.',
      highlightControls: ['function-e1', 'cursor-down'],
      panelStateChanges: {},
      displayState: {
        screenType: 'tone-edit-pro',
        activeTab: 'FILTER',
        selectedIndex: 3,
        menuItems: [
          { label: 'Filter Type', values: ['TVF', 'TVF', 'TVF', '---'] },
          { label: 'TVF Type', values: ['LPF', 'LPF', 'LPF', '---'] },
          { label: 'Filter Slope', values: ['-12dB', '-12dB', '-12dB', '---'] },
          { label: 'Cutoff', values: ['127', '80', '100', '---'], selected: true },
        ],
        toneEditData: {
          toneType: 'Z-CORE',
          activePartials: [true, true, true, false],
          selectedPartial: 0,
        },
      },
    },
    {
      id: 'step-7',
      title: 'Edit Partial Values with E-Knobs',
      instruction:
        'In PRO view, E3-E6 correspond to Partials 1-4. Turn E3 to adjust the Cutoff for Partial 1, and E4 for Partial 2. This lets you shape each partial independently.',
      details:
        'By giving each partial a different cutoff value, you create timbral variation that makes the pad sound wider and more complex.',
      highlightControls: ['function-e3', 'function-e4'],
      panelStateChanges: {},
      displayState: {
        screenType: 'tone-edit-pro',
        activeTab: 'FILTER',
        selectedIndex: 3,
        menuItems: [
          { label: 'Filter Type', values: ['TVF', 'TVF', 'TVF', '---'] },
          { label: 'TVF Type', values: ['LPF', 'LPF', 'LPF', '---'] },
          { label: 'Filter Slope', values: ['-12dB', '-12dB', '-12dB', '---'] },
          { label: 'Cutoff', values: ['110', '95', '100', '---'], selected: true },
        ],
        toneEditData: {
          toneType: 'Z-CORE',
          activePartials: [true, true, true, false],
          selectedPartial: 0,
        },
      },
      tipText:
        'E3=Partial 1, E4=Partial 2, E5=Partial 3, E6=Partial 4. This mapping is consistent across all PRO view tabs.',
    },
    {
      id: 'step-8',
      title: 'Numeric Input for Precision',
      instruction:
        'Press Enter on the selected Cutoff parameter to open a numeric input popup. Type an exact value for precise control.',
      highlightControls: ['enter'],
      panelStateChanges: {},
      displayState: {
        screenType: 'popup',
        parameterName: 'Cutoff',
        parameterValue: '95',
        popupData: {
          popupType: 'numeric-input',
        },
      },
      tipText:
        'Numeric input is especially useful when you need to match exact values across partials.',
    },
    {
      id: 'step-9',
      title: 'View AMP Parameters',
      instruction:
        'Press Exit to close the popup, then turn E1 to navigate to the AMP tab. Here you can compare volume levels and panning across all active partials.',
      highlightControls: ['exit', 'function-e1'],
      panelStateChanges: {},
      displayState: {
        screenType: 'tone-edit-pro',
        activeTab: 'AMP',
        selectedIndex: 0,
        menuItems: [
          { label: 'Level', values: ['100', '90', '85', '---'], selected: true },
          { label: 'Velocity Sens', values: ['+63', '+50', '+40', '---'] },
          { label: 'Pan', values: ['L20', '0', 'R20', '---'] },
          { label: 'Tone Delay', values: ['OFF', 'OFF', 'OFF', '---'] },
        ],
        toneEditData: {
          toneType: 'Z-CORE',
          activePartials: [true, true, true, false],
          selectedPartial: 0,
        },
      },
    },
    {
      id: 'step-10',
      title: 'PRO Editing Complete!',
      instruction:
        "Press Exit to return to the main screen. You've mastered the Tone Edit PRO view — browsing tabs, comparing partials side-by-side, and using E-knobs for per-partial editing.",
      details:
        'The PRO view is your go-to for detailed sound design. Use ZOOM for quick single-parameter tweaks, and PRO when you need the full picture across all partials.',
      highlightControls: ['exit'],
      panelStateChanges: {
        'synth-param': { active: false },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'A012',
        sceneName: 'Ambient Pad',
        tempo: 90,
        beatSignature: '4/4',
      },
      tipText:
        'You can switch between ZOOM and PRO at any time — touch <To ZOOM> in PRO view or <To PRO> in ZOOM view.',
    },
  ],
};
