import { Tutorial } from '@/types/tutorial';

export const masterEffectsOutput: Tutorial = {
  id: 'master-effects-output',
  deviceId: 'fantom-08',
  title: 'Master Effects and Output Routing',
  description:
    'Configure the system-wide Master FX chain: Master Compressor, Master EQ, and TFX (Total Effects). Set up pad effects routing, USB/click output destinations, and per-zone output assignments.',
  category: 'sound-design',
  difficulty: 'advanced',
  estimatedTime: '10 min',
  tags: ['effects', 'master-fx', 'compressor', 'eq', 'tfx', 'output', 'routing', 'advanced'],
  steps: [
    {
      id: 'step-1',
      title: 'Introduction to Master Effects',
      instruction:
        'Beyond per-zone MFX and insert effects, the Fantom has system-wide Master FX (compressor, EQ, and TFX), plus detailed output routing for USB, click, and pads. This tutorial covers the master effects chain and output destinations.',
      details:
        "You'll learn to configure the Master Compressor for dynamic control, Master EQ for frequency shaping, TFX for a final multi-effect, pad FX routing, USB/click output destinations, and per-zone output assignments (MAIN/SUB).",
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
      title: 'Open Effects Edit',
      instruction:
        'Press MENU, then navigate to EFFECTS EDIT. The INTERNAL tab shows the full signal flow: Zone → MFX → Zone EQ → IFX1/IFX2 → Chorus/Reverb → Master Comp → Master EQ → TFX → Output.',
      details:
        'The Effects Edit screen has six tabs: INTERNAL (main effects routing), AUDIO IN (external input effects), PAD (pad sampler FX), USB (USB audio routing), CLICK (metronome output), and OUTPUT (master output assignments). The signal flow diagram shows every stage of processing.',
      highlightControls: ['menu'],
      panelStateChanges: {
        menu: { active: true },
      },
      displayState: {
        screenType: 'effects-edit',
        activeTab: 'INTERNAL',
        selectedIndex: 0,
        statusText: 'INTERNAL',
        zones: [
          {
            zoneNumber: 1,
            zoneName: 'Zone 1',
            toneName: 'Concert Grand',
            keyRangeLow: 'A0',
            keyRangeHigh: 'C8',
            volume: 100,
            pan: 0,
            muted: false,
            active: true,
          },
        ],
      },
    },
    {
      id: 'step-3',
      title: 'Navigate to Master FX Section',
      instruction:
        'In the INTERNAL tab, look at the MASTER FX area on the right side of the signal flow diagram. It shows three blocks: M.COMP, M.EQ, and TFX, each with on/off status and EDIT buttons.',
      details:
        'The Master FX section processes the combined output of all zones after the chorus and reverb sends. M.COMP (Master Compressor) controls dynamics, M.EQ (Master EQ) shapes the frequency spectrum, and TFX (Total Effects) adds a final multi-effect.',
      highlightControls: ['cursor-right'],
      panelStateChanges: {},
      displayState: {
        screenType: 'effects-edit',
        activeTab: 'INTERNAL',
        selectedIndex: 1,
        statusText: 'MASTER FX',
        menuItems: [
          { label: 'M.COMP: ON', selected: true },
          { label: 'M.EQ: ON' },
          { label: 'TFX: 00:Thru' },
        ],
        zones: [
          {
            zoneNumber: 1,
            zoneName: 'Zone 1',
            toneName: 'Concert Grand',
            keyRangeLow: 'A0',
            keyRangeHigh: 'C8',
            volume: 100,
            pan: 0,
            muted: false,
            active: true,
          },
        ],
      },
    },
    {
      id: 'step-4',
      title: 'Edit Master Compressor',
      instruction:
        'Touch M.COMP → EDIT to open the M.COMP EDIT PRO screen. Parameters: Attack Time, Release Time, Threshold, Ratio, Knee, and Make-up Gain. The compressor controls the overall dynamic range.',
      details:
        'Attack Time sets how quickly the compressor responds to transients (0.1ms to 100ms). Release Time controls how long compression holds after the signal drops. Threshold sets the level where compression begins. Ratio determines how much compression is applied. Knee controls the transition smoothness. Make-up Gain boosts the output to compensate for volume reduction.',
      highlightControls: ['enter'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'M.COMP EDIT PRO',
        menuItems: [
          { label: 'Attack Time: 0.1ms', selected: true },
          { label: 'Release Time: 300ms' },
          { label: 'Threshold: -20dB' },
          { label: 'Ratio: 4:1' },
          { label: 'Knee: SOFT' },
          { label: 'Make-up Gain: 0dB' },
        ],
        selectedIndex: 0,
        statusText: 'Master Compressor — system-wide dynamics',
      },
    },
    {
      id: 'step-5',
      title: 'Edit Master EQ',
      instruction:
        'Press EXIT to return, then touch M.EQ → EDIT to open the MASTER EQ. A 4-band parametric EQ with Low, Mid1, Mid2, and High bands. Adjust Freq, Gain, and Q per band to shape the overall mix.',
      details:
        'The Master EQ applies to the entire output after the compressor. Low and High bands are shelving filters. Mid1 and Mid2 are parametric with adjustable Q (bandwidth). Use this to fine-tune the overall frequency balance — boost low end for warmth, cut mids for clarity, or add high-end sparkle.',
      highlightControls: ['exit', 'enter'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'MASTER EQ EDIT',
        menuItems: [
          { label: 'Low Gain: +6(dB)  Freq: 400', selected: true },
          { label: 'Mid1 Gain: 0(dB)  Freq: 1000  Q: 0.5' },
          { label: 'Mid2 Gain: 0(dB)  Freq: 3000  Q: 0.5' },
          { label: 'High Gain: +6(dB)  Freq: 4000' },
        ],
        selectedIndex: 0,
        statusText: 'Master EQ — 4-band parametric',
      },
    },
    {
      id: 'step-6',
      title: 'Enable and Configure TFX',
      instruction:
        'Press EXIT to return, then touch TFX → EDIT. TFX is a multi-effect placed after the mastering chain (same effect types as MFX). It is a system-level setting — you must save system settings to keep it.',
      details:
        'TFX (Total Effects) applies after Master Comp and Master EQ. It uses the same effect algorithms available to zone MFX, so you can add delay, reverb, chorus, distortion, or any other effect to the final output. Unlike per-scene effects, TFX is a system setting that persists across all scenes.',
      highlightControls: ['exit', 'enter'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'TFX EDIT',
        menuItems: [
          { label: 'TFX Type: 00:Thru', selected: true },
        ],
        selectedIndex: 0,
        statusText: 'Select TFX type with Value dial',
      },
    },
    {
      id: 'step-7',
      title: 'Set TFX Effect Type',
      instruction:
        'Turn the Value dial to change from Thru to an effect type. For example, select Stereo Delay for a spacious final effect.',
      details:
        'The TFX type list includes all the same effects available in zone MFX: EQ, compressor, limiter, enhancer, delays, chorus, flangers, phasers, reverbs, distortion, and more. Thru means no effect is applied. Changing to any other type activates the TFX processing.',
      highlightControls: ['value-dial'],
      panelStateChanges: {},
      displayState: {
        screenType: 'popup',
        popupData: {
          popupType: 'value',
        },
        parameterName: 'TFX Type',
        parameterValue: '17:Stereo Delay',
      },
    },
    {
      id: 'step-8',
      title: 'Pad Effects Routing',
      instruction:
        'Touch the PAD tab in Effects Edit. Select BANK1-4, then toggle FX:ON/OFF per pad to connect pads to the Master FX chain (M.COMP, M.EQ, TFX). Set Sample Output Assign for the entire sampler output.',
      details:
        'Each pad can independently route through the Master FX chain or bypass it. FX:ON sends the pad audio through M.COMP, M.EQ, and TFX. FX:OFF sends it directly to the output. Sample Output Assign sets where the entire sampler output goes (MAIN or SUB jacks).',
      highlightControls: ['display'],
      panelStateChanges: {},
      displayState: {
        screenType: 'effects-edit',
        activeTab: 'PAD',
        selectedIndex: 0,
        statusText: 'PAD',
        menuItems: [
          { label: 'Bank1  Pad1 FX:ON', selected: true },
          { label: 'Pad2 FX:OFF' },
          { label: 'Pad3 FX:OFF' },
          { label: 'Sample Output Assign: MAIN' },
        ],
      },
    },
    {
      id: 'step-9',
      title: 'USB Output Routing',
      instruction:
        'Touch the USB tab. Set the USB MASTER output destination to MAIN or SUB. USB SUB is fixed to the SUB OUT jacks. This is useful for separate monitor mixes or DAW recording.',
      details:
        'When using the Fantom with a DAW via USB audio, the USB tab controls where USB audio input gets routed. USB MASTER can go to MAIN (main output jacks) or SUB (sub output jacks). This lets you set up separate headphone mixes or recording paths.',
      highlightControls: ['display'],
      panelStateChanges: {},
      displayState: {
        screenType: 'effects-edit',
        activeTab: 'USB',
        selectedIndex: 0,
        statusText: 'USB',
        menuItems: [
          { label: 'USB MASTER: MAIN', selected: true },
          { label: 'USB SUB: (fixed to SUB OUT)' },
        ],
      },
    },
    {
      id: 'step-10',
      title: 'Output Destinations',
      instruction:
        'Touch the OUTPUT tab. Set Master Output Assign (MAIN/SUB/MAIN+SUB) and SUB Output Assign. This controls which physical output jacks receive the master bus signal.',
      details:
        'Master Output Assign determines the final output routing: MAIN sends to the main L/R jacks, SUB sends to the sub L/R jacks, MAIN+SUB sends to both. SUB Output Assign configures what signal feeds the sub outputs. This is essential for live setups with separate monitor feeds.',
      highlightControls: ['display'],
      panelStateChanges: {},
      displayState: {
        screenType: 'effects-edit',
        activeTab: 'OUTPUT',
        selectedIndex: 0,
        statusText: 'OUTPUT',
        menuItems: [
          { label: 'Master Output Assign: MAIN', selected: true },
          { label: 'SUB Output Assign: SUB' },
        ],
      },
    },
    {
      id: 'step-11',
      title: 'Zone Out Assign',
      instruction:
        'Return to the INTERNAL tab and select a zone. Per-zone output routing lets you send individual zones to MAIN, SUB, or MAIN+SUB outputs for separate processing or monitoring.',
      details:
        'Zone Out Assign overrides the master output routing for individual zones. For example, send a bass zone to SUB for a separate bass amp, while everything else goes to MAIN for FOH speakers. This is a powerful tool for live performance and studio recording setups.',
      highlightControls: ['zone-1'],
      panelStateChanges: {
        'zone-1': { active: true, ledOn: true },
      },
      displayState: {
        screenType: 'effects-edit',
        activeTab: 'INTERNAL',
        selectedIndex: 2,
        statusText: 'INTERNAL Zone 1',
        menuItems: [
          { label: 'Zone 1 Output Assign: MAIN', selected: true },
          { label: 'MFX: ON' },
          { label: 'Zone EQ: ON' },
        ],
        zones: [
          {
            zoneNumber: 1,
            zoneName: 'Zone 1',
            toneName: 'Concert Grand',
            keyRangeLow: 'A0',
            keyRangeHigh: 'C8',
            volume: 100,
            pan: 0,
            muted: false,
            active: true,
          },
        ],
      },
    },
    {
      id: 'step-12',
      title: 'Complete',
      instruction:
        'Press EXIT to return to the home screen. Master FX settings (M.COMP, M.EQ) are saved per-scene. TFX is a system setting — save system settings from MENU → SYSTEM to keep it.',
      details:
        "You've configured the full Master FX chain: compressor for dynamics, EQ for frequency balance, TFX for a final effect. You also learned pad FX routing, USB/output destinations, and per-zone output assignments.",
      highlightControls: ['exit'],
      panelStateChanges: {
        menu: { active: false },
        'zone-1': { active: false, ledOn: false },
        exit: { active: true },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'Homecoming',
        tempo: 120,
        beatSignature: '4/4',
        statusText: 'Master FX configured — save scene to keep',
      },
    },
  ],
};
