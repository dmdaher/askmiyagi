import { Tutorial } from '@/types/tutorial';

export const vtwOrganEditing: Tutorial = {
  id: 'vtw-organ-editing',
  deviceId: 'fantom-08',
  title: 'VTone Wheel Organ Tone Editing',
  description:
    'Explore the Virtual Tone Wheel (VTW) organ engine — a dedicated drawbar-based organ editor with harmonic bars, percussion, overdrive, and rotary speaker simulation. Shape classic organ sounds using the unique VTW interface.',
  category: 'sound-design',
  difficulty: 'intermediate',
  estimatedTime: '7 min',
  tags: ['vtw', 'organ', 'drawbar', 'tone-edit', 'rotary', 'sound-design'],
  steps: [
    {
      id: 'step-1',
      title: 'Introduction to VTone Wheel Organ',
      instruction:
        'The VTW (Virtual Tone Wheel) engine models classic tone-wheel organs with a unique drawbar interface. Unlike other tone types, VTW uses harmonic bars instead of oscillators to shape the sound.',
      details:
        'VTW tones have their own special editing screens with drawbar controls, percussion settings, overdrive, and a rotary speaker simulator — all the elements of a classic organ setup.',
      highlightControls: [],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        sceneNumber: 'B007',
        sceneName: 'Jazz Organ',
        tempo: 120,
        beatSignature: '4/4',
      },
    },
    {
      id: 'step-2',
      title: 'Select a VTW Zone',
      instruction:
        'Press Zone 1 to select the zone containing our Tone Wheel Organ tone. The zone view shows the tone type as VTW.',
      highlightControls: ['zone-1'],
      panelStateChanges: {
        'zone-1': { active: true, ledOn: true, ledColor: '#3B82F6' },
      },
      displayState: {
        screenType: 'zone-view',
        title: 'ZONE VIEW',
        sceneNumber: 'B007',
        sceneName: 'Jazz Organ',
        tempo: 120,
        beatSignature: '4/4',
        zoneViewMode: 1,
        zones: [
          {
            zoneNumber: 1,
            zoneName: 'Zone 1',
            toneName: 'Tone Wheel Organ',
            toneType: 'VTW',
            toneBank: 'PR-A',
            toneCategory: 'Organ',
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
      zones: [
        {
          zoneNumber: 1,
          color: '#3B82F6',
          lowNote: 21,
          highNote: 108,
          label: 'Zone 1 (Tone Wheel Organ)',
        },
      ],
    },
    {
      id: 'step-3',
      title: 'Enter VTW Tone Edit',
      instruction:
        'Press the PARAM button to enter the Tone Edit ZOOM screen for the VTW tone. The WHEEL tab opens by default, showing the 9 harmonic drawbars.',
      details:
        'You can also access VTW editing via Menu > Tone Edit. The E1 knob scrolls through tabs, E2 selects parameters, and E6 edits values.',
      highlightControls: ['synth-param'],
      panelStateChanges: {
        'synth-param': { active: true },
      },
      displayState: {
        screenType: 'tone-edit-zoom',
        activeTab: 'WHEEL',
        selectedIndex: 0,
        toneEditData: {
          toneType: 'VTW',
          sectionTab: 'WHEEL',
        },
        menuItems: [
          { label: "16': 8", selected: true },
          { label: "5-1/3': 8" },
          { label: "8': 8" },
          { label: "4': 0" },
          { label: "2-2/3': 0" },
          { label: "2': 0" },
          { label: "1-3/5': 0" },
          { label: "1-1/3': 0" },
          { label: "1': 0" },
        ],
      },
    },
    {
      id: 'step-4',
      title: 'Adjust Drawbar Values',
      instruction:
        'Use E6 or the sliders to change the drawbar levels. Each drawbar represents a harmonic — the 8\' bar is the fundamental pitch, while others add harmonics above and below.',
      details:
        'The 9 drawbar positions (16\', 5-1/3\', 8\', 4\', 2-2/3\', 2\', 1-3/5\', 1-1/3\', 1\') correspond to traditional organ stops. Three bar colors indicate: white = octave harmonics (centered on 8\'), black = non-octave harmonics, brown = low range.',
      highlightControls: ['slider-1', 'slider-2', 'slider-3'],
      panelStateChanges: {},
      displayState: {
        screenType: 'tone-edit-zoom',
        activeTab: 'WHEEL',
        selectedIndex: 3,
        toneEditData: {
          toneType: 'VTW',
          sectionTab: 'WHEEL',
        },
        menuItems: [
          { label: "16': 8" },
          { label: "5-1/3': 8" },
          { label: "8': 8" },
          { label: "4': 6", selected: true },
          { label: "2-2/3': 4" },
          { label: "2': 0" },
          { label: "1-3/5': 0" },
          { label: "1-1/3': 0" },
          { label: "1': 0" },
        ],
      },
      tipText:
        'You can also drag the harmonic bars directly on screen to adjust their levels.',
    },
    {
      id: 'step-5',
      title: 'Vibrato & Chorus Settings',
      instruction:
        'The WHEEL tab also includes Vibrato & Chorus controls visible in the editing area. These add classic organ modulation effects to the sound.',
      highlightControls: ['function-e6'],
      panelStateChanges: {},
      displayState: {
        screenType: 'tone-edit-zoom',
        activeTab: 'WHEEL',
        selectedIndex: 0,
        toneEditData: {
          toneType: 'VTW',
          sectionTab: 'WHEEL',
        },
        menuItems: [
          { label: "16': 8", selected: true },
          { label: "5-1/3': 8" },
          { label: "8': 8" },
          { label: "4': 6" },
          { label: "2-2/3': 4" },
          { label: "2': 0" },
          { label: "1-3/5': 0" },
          { label: "1-1/3': 0" },
          { label: "1': 0" },
        ],
        statusText: 'Vibrato & Chorus: ON',
      },
    },
    {
      id: 'step-6',
      title: 'Navigate to PERCUSSION Tab',
      instruction:
        'Turn E1 to navigate to the PERCUSSION settings. Percussion adds a brief click or ping at note onset — a signature element of classic organ sounds.',
      details:
        'Percussion settings include ON/OFF, Speed (Slow/Normal), Harmonic (2nd/3rd), and Level. The percussion attack only sounds on the first note of a legato passage.',
      highlightControls: ['function-e1'],
      panelStateChanges: {},
      displayState: {
        screenType: 'tone-edit-zoom',
        activeTab: 'WHEEL',
        selectedIndex: 0,
        toneEditData: {
          toneType: 'VTW',
          sectionTab: 'PERCUSSION',
        },
        menuItems: [
          { label: 'Percussion: ON', selected: true },
          { label: 'Speed: SLOW' },
          { label: 'Harmonic: 2ND' },
          { label: 'Level: 100' },
        ],
        statusText: 'PERCUSSION settings',
      },
    },
    {
      id: 'step-7',
      title: 'Navigate to OVERDRIVE Tab',
      instruction:
        'Turn E1 to reach the OVERDRIVE tab. This adds distortion to the organ sound, emulating a tube amplifier.',
      details:
        'Three overdrive types are available: 01:VK Overdrive (classic organ), 02:Tube Distortion, and 03:Guitar Amp Simulator. Adjust Drive and Level to taste.',
      highlightControls: ['function-e1'],
      panelStateChanges: {},
      displayState: {
        screenType: 'tone-edit-zoom',
        activeTab: 'WHEEL',
        selectedIndex: 0,
        toneEditData: {
          toneType: 'VTW',
          sectionTab: 'OVERDRIVE',
        },
        menuItems: [
          { label: 'Type: 01:VK Overdrive', selected: true },
          { label: 'Drive: 4' },
          { label: 'Level: 100' },
        ],
        statusText: 'OVERDRIVE settings',
      },
    },
    {
      id: 'step-8',
      title: 'Navigate to ROTARY Tab',
      instruction:
        'Turn E1 to the ROTARY tab. The rotary speaker simulator recreates the spinning horn and woofer of a Leslie cabinet — essential for authentic organ sound.',
      details:
        'Key parameters: Rotation (Slow/Fast), Speed, Brake (stops rotation), Woofer Level, and separate slow/fast frequency settings for woofer and tweeter horns.',
      highlightControls: ['function-e1'],
      panelStateChanges: {},
      displayState: {
        screenType: 'tone-edit-zoom',
        activeTab: 'WHEEL',
        selectedIndex: 0,
        toneEditData: {
          toneType: 'VTW',
          sectionTab: 'ROTARY',
        },
        menuItems: [
          { label: 'Rotation: SLOW', selected: true },
          { label: 'Speed: 0' },
          { label: 'Brake: OFF' },
          { label: 'Woofer Level: 100' },
        ],
        statusText: 'ROTARY speaker settings',
      },
    },
    {
      id: 'step-9',
      title: 'Control Rotary Speed in Real Time',
      instruction:
        'You can switch the rotary between Slow and Fast using the modulation lever or an assigned E-knob. This is a classic performance technique — toggling between slow and fast Leslie speeds.',
      highlightControls: ['function-e6'],
      panelStateChanges: {},
      displayState: {
        screenType: 'popup',
        parameterName: 'Rotation',
        parameterValue: 'FAST',
        popupData: {
          popupType: 'value',
        },
      },
      tipText:
        'Assign Rotation to a foot switch for hands-free Leslie speed control during performance.',
    },
    {
      id: 'step-10',
      title: 'VTone Wheel Organ Editing Complete!',
      instruction:
        'Press Exit to return to the home screen. You\'ve explored the VTW organ engine — drawbars for harmonic shaping, percussion for attack character, overdrive for grit, and rotary for that classic spinning speaker sound.',
      details:
        'The VTW engine also has MFX and MFX CTRL tabs for additional effects processing. Remember to save your changes with Write if you want to keep them.',
      highlightControls: ['exit'],
      panelStateChanges: {
        'synth-param': { active: false },
        'zone-1': { active: false, ledOn: false },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'B007',
        sceneName: 'Jazz Organ',
        tempo: 120,
        beatSignature: '4/4',
      },
    },
  ],
};
