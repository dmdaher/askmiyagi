import { Tutorial } from '@/types/tutorial';

export const quickEditFunctionKnobs: Tutorial = {
  id: 'quick-edit-function-knobs',
  deviceId: 'fantom-08',
  title: 'Quick Edit with Function Knobs',
  description:
    'Learn how to use the PAN/LEVEL, ASSIGN, and SYNTH CTRL buttons with the sliders and control knobs for quick sound editing. These hardware shortcuts let you tweak parameters without diving into menus.',
  category: 'basics',
  difficulty: 'beginner',
  estimatedTime: '6 min',
  tags: ['quick-edit', 'function-knobs', 'pan-level', 'assign', 'synth-ctrl', 'basics'],
  steps: [
    {
      id: 'step-1',
      title: 'Introduction to Quick Edit',
      instruction:
        'The Fantom 08 has three button modes — PAN/LEVEL, ASSIGN, and SYNTH CTRL — that change what the sliders and control knobs do. These let you quickly tweak sound parameters without opening any menus.',
      details:
        'The FUNCTION knobs [E1]–[E6] below the display also serve as Quick Edit controls on the SCENE SELECT and ZONE VIEW screens. The editable parameters differ depending on the tone type.',
      highlightControls: [],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        sceneNumber: 'A005',
        sceneName: 'Synth Lead',
        tempo: 128,
        beatSignature: '4/4',
      },
    },
    {
      id: 'step-2',
      title: 'Activate PAN/LEVEL Mode',
      instruction:
        'Press the PAN/LEVEL button to light it up. Now the control knobs adjust the pan of each zone, and the sliders adjust the volume of each zone.',
      details:
        'When PAN/LEVEL is lit, knob 1 controls Zone 1 pan, knob 2 controls Zone 2 pan, and so on. Similarly, slider 1 controls Zone 1 volume, slider 2 controls Zone 2 volume. The knob/slider numbers correspond to the zone numbers.',
      highlightControls: ['pan-level'],
      panelStateChanges: {
        'pan-level': { active: true, ledOn: true, ledColor: '#00ff44' },
      },
      displayState: {
        screenType: 'popup',
        parameterName: 'Pan Zone 1',
        parameterValue: '0',
        popupData: {
          popupType: 'value',
        },
      },
    },
    {
      id: 'step-3',
      title: 'Adjust Zone Volume with a Slider',
      instruction:
        'Move Slider 1 to adjust the volume of Zone 1. A popup window shows the parameter name and value as you adjust it.',
      details:
        'The popup window automatically closes after a short time. For some parameters, no popup appears.',
      highlightControls: ['slider-1'],
      panelStateChanges: {},
      displayState: {
        screenType: 'popup',
        parameterName: 'Volume Zone 1',
        parameterValue: '100',
        popupData: {
          popupType: 'value',
        },
      },
    },
    {
      id: 'step-4',
      title: 'Switch to ASSIGN Mode',
      instruction:
        'Press the ASSIGN button. This switches the knobs and sliders to control scene-assigned parameters (ASSIGN1). Press ASSIGN + PAN/LEVEL together for system-wide assignments (ASSIGN2).',
      details:
        'ASSIGN1 function assignments are made individually for each scene. ASSIGN2 function assignments are common to the entire system. When using ASSIGN, operating a knob or slider affects the zone(s) that are heard when you play the keyboard.',
      highlightControls: ['assign'],
      panelStateChanges: {
        'pan-level': { active: false, ledOn: false },
        assign: { active: true },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'A005',
        sceneName: 'Synth Lead',
        tempo: 128,
        beatSignature: '4/4',
        statusText: 'ASSIGN1 (Scene) active — knobs/sliders control assigned parameters',
      },
    },
    {
      id: 'step-5',
      title: 'Enter SYNTH CTRL — OSC Section',
      instruction:
        'Press the OSC button in the Synth Control section. This opens the Tone Edit ZOOM screen directly on the OSC tab, letting you edit oscillator parameters in real time.',
      details:
        'The Synth Control buttons (OSC, FILTER TYPE, PARAM, AMP, FX, LFO) are shortcuts that jump directly to the corresponding Tone Edit ZOOM tab. Unlike PAN/LEVEL and ASSIGN, these edits apply only to the tone of the current zone.',
      highlightControls: ['synth-mode-osc'],
      panelStateChanges: {
        assign: { active: false },
        'synth-mode-osc': { active: true },
      },
      displayState: {
        screenType: 'tone-edit-zoom',
        activeTab: 'OSC',
        selectedIndex: 0,
        toneEditData: {
          toneType: 'Z-CORE',
          activePartials: [true, true, false, false],
          selectedPartial: 0,
        },
        menuItems: [
          { label: 'Wave Type: SAW', selected: true },
          { label: 'Wave Variation: ---' },
          { label: 'Gain: 0dB' },
          { label: 'Detune: 0' },
        ],
      },
    },
    {
      id: 'step-6',
      title: 'Use the CUTOFF Knob',
      instruction:
        'Turn the CUTOFF knob to adjust the filter cutoff frequency in real time. A popup shows the current value. Higher values make the sound brighter.',
      details:
        'The CUTOFF knob adjusts the cutoff frequency of the filter. The edited parameter and its value appear in a popup window.',
      highlightControls: ['synth-cutoff'],
      panelStateChanges: {},
      displayState: {
        screenType: 'popup',
        parameterName: 'Cutoff',
        parameterValue: '80',
        popupData: {
          popupType: 'value',
        },
      },
    },
    {
      id: 'step-7',
      title: 'Use the RESONANCE Knob',
      instruction:
        'Turn the RESONANCE knob to add a distinctive resonant character to the sound. This emphasizes frequencies around the cutoff point.',
      details:
        'Resonance adds a peak at the cutoff frequency, creating a more pronounced, sometimes whistling quality. Combined with cutoff adjustments, it shapes the tonal character dramatically.',
      highlightControls: ['synth-resonance'],
      panelStateChanges: {},
      displayState: {
        screenType: 'popup',
        parameterName: 'Resonance',
        parameterValue: '45',
        popupData: {
          popupType: 'value',
        },
      },
    },
    {
      id: 'step-8',
      title: 'Quick Edit Complete!',
      instruction:
        'Press Exit to return to the home screen. You now know the three main controller modes: PAN/LEVEL for zone volume and pan, ASSIGN for scene/system parameters, and SYNTH CTRL for real-time tone editing.',
      details:
        'Remember: PAN/LEVEL and ASSIGN affect the zones heard when playing. SYNTH CTRL edits apply only to the current zone\'s tone. Save your changes with Write if you want to keep them.',
      highlightControls: ['exit'],
      panelStateChanges: {
        'synth-mode-osc': { active: false },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'A005',
        sceneName: 'Synth Lead',
        tempo: 128,
        beatSignature: '4/4',
      },
      tipText:
        'Try the other Synth Control buttons (FILTER TYPE, AMP, FX, LFO) — they each jump to the corresponding ZOOM tab.',
    },
  ],
};
