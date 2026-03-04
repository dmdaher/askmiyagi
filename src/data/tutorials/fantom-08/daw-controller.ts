import { Tutorial } from '@/types/tutorial';

export const dawController: Tutorial = {
  id: 'daw-controller',
  deviceId: 'fantom-08',
  title: 'DAW Controller Setup',
  description:
    'Learn how to set up the Fantom 08 as a DAW controller over USB. Configure the USB driver, enable USB audio, activate DAW Control mode, and use the Logic Pro X pad mappings to control your recording software directly from the panel.',
  category: 'midi',
  difficulty: 'intermediate',
  estimatedTime: '10 min',
  tags: ['daw', 'midi', 'usb', 'controller', 'intermediate'],
  steps: [
    {
      id: 'step-1',
      title: 'Welcome to DAW Controller Setup',
      instruction:
        'The Fantom 08 can function as a full-featured DAW controller, letting you control Logic Pro X, MainStage, or Ableton Live directly from the panel over USB. In this tutorial you will configure the USB driver, enable USB audio, activate DAW Control mode, and learn the Logic Pro X pad mappings.',
      details:
        'DAW Control mode repurposes the 16 performance pads to send DAW-specific commands — screen sets, zoom, markers, and transport. Combined with USB VENDOR driver mode, you get bidirectional MIDI and audio over a single USB cable.',
      highlightControls: [],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'Studio Session',
        tempo: 120,
        beatSignature: '4/4',
        statusText: 'DAW Controller tutorial — start',
      },
    },
    {
      id: 'step-2',
      title: 'Open System Settings',
      instruction:
        'Press the Menu button to open the main menu, then navigate to SYSTEM and press Enter. This opens the System Settings screen where USB driver and audio settings are configured.',
      details:
        'The SYSTEM option is at the top of the Menu list. Once open, the System Settings screen shows 17 tabbed categories on the left sidebar. The GENERAL tab is selected by default and contains the USB driver settings we need.',
      highlightControls: ['menu'],
      panelStateChanges: {
        menu: { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'MENU',
        menuItems: [
          { label: 'SYSTEM', selected: true },
          { label: 'UTILITY' },
          { label: 'SOUND PREVIEW' },
          { label: 'QUICK SETUP' },
          { label: 'INFORMATION' },
        ],
        selectedIndex: 0,
        statusText: 'Navigate to SYSTEM',
      },
      tipText: 'SYSTEM is the first item in the Menu list.',
    },
    {
      id: 'step-3',
      title: 'Set USB Driver to VENDOR',
      instruction:
        'On the GENERAL tab, navigate to the USB Driver parameter and set it to VENDOR. This enables full MIDI and audio communication over USB — the Fantom sends and receives both MIDI data and multi-channel audio through a single USB cable.',
      details:
        'There are two USB driver modes: VENDOR (full MIDI + audio, requires Roland driver installed on your computer) and GENERIC (MIDI only, no driver needed). For DAW control with audio monitoring, VENDOR is required. After changing this setting, you may need to restart the Fantom.',
      highlightControls: ['function-e2'],
      panelStateChanges: {
        menu: { active: false },
      },
      displayState: {
        screenType: 'system-settings',
        title: 'SYSTEM',
        activeTab: 'GENERAL',
        menuItems: [
          { label: 'Auto Off', value: '4 Hours' },
          { label: 'USB Driver', value: 'VENDOR', selected: true },
          { label: 'LCD Brightness', value: '10' },
          { label: 'LED Brightness', value: '7' },
          { label: 'Zone Sw Indicator', value: 'ON' },
          { label: 'Encoder Speed', value: 'FAST' },
        ],
        selectedIndex: 1,
        statusText: 'GENERAL tab — USB Driver = VENDOR',
      },
      tipText:
        'VENDOR mode requires the Roland USB driver installed on your computer. Download it from roland.com.',
    },
    {
      id: 'step-4',
      title: 'Enable USB Audio',
      instruction:
        'Scroll down on the GENERAL tab to find the USB Audio parameters. Set USB Audio Input Switch to ON and USB Audio Output Switch to ON. This lets audio flow bidirectionally between the Fantom and your DAW.',
      details:
        'USB Audio Input Switch routes audio from your DAW into the Fantom (for monitoring). USB Audio Output Switch sends the Fantom\'s audio output to your DAW (for recording). Input Level and Output Level control the volume of each direction. Keep both at 127 for unity gain.',
      highlightControls: ['function-e2', 'value-dial'],
      panelStateChanges: {},
      displayState: {
        screenType: 'system-settings',
        title: 'SYSTEM',
        activeTab: 'GENERAL',
        menuItems: [
          { label: 'USB Driver', value: 'VENDOR' },
          { label: 'USB Audio Input Switch', value: 'ON', selected: true },
          { label: 'USB Audio Input Level', value: '127' },
          { label: 'USB Audio Output Switch', value: 'ON' },
          { label: 'USB Audio Output Level', value: '127' },
        ],
        selectedIndex: 1,
        statusText: 'GENERAL tab — USB Audio enabled',
      },
      tipText:
        'USB Audio lets you record the Fantom directly into your DAW without an external audio interface.',
    },
    {
      id: 'step-5',
      title: 'Activate DAW Control Mode',
      instruction:
        'Press Exit to leave the System Settings, then press the DAW CTRL button on the panel. This activates DAW Control mode, which changes the behavior of certain panel controls to send DAW commands instead of normal MIDI.',
      details:
        'The DAW CTRL button is located in the main panel section. In DAW Control mode, the transport buttons (Play, Stop, Rec) and other controls send DAW-specific commands over USB. The keyboard still plays notes normally.',
      highlightControls: ['daw-ctrl'],
      panelStateChanges: {
        'daw-ctrl': { active: true },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'Studio Session',
        tempo: 120,
        beatSignature: '4/4',
        statusText: 'DAW CTRL active',
      },
      tipText:
        'The display shows DAW CTRL mode status. Press the button again to exit DAW Control mode.',
    },
    {
      id: 'step-6',
      title: 'Open Pad Mode Selection',
      instruction:
        'Press the Pad Mode button to open the pad mode selection screen. This shows all available pad modes in a grid. We need to select DAW Control mode for the pads.',
      details:
        'The Pad Mode screen displays the available modes: Sample Pad, Note Pad, Partial Sw/Sel, DAW Control, Zone Mute, Zone Solo, Kbd Sw Group, Rhythm Pattern, Pattern, Variation Play, Group Play, and System. Press the corresponding pad number to select a mode.',
      highlightControls: ['pad-mode'],
      panelStateChanges: {
        'pad-mode': { active: true },
      },
      displayState: {
        screenType: 'pad-mode',
        title: 'PAD MODE',
        menuItems: [
          { label: '1: Sample Pad', selected: true },
          { label: '2: Note Pad' },
          { label: '3: Partial Sw/Sel' },
          { label: '4: DAW Control' },
          { label: '5: Zone Mute' },
          { label: '6: Zone Solo' },
          { label: '7: Kbd Sw Group' },
          { label: '8: Rhythm Pattern' },
        ],
        selectedIndex: 0,
        statusText: 'Select DAW Control (Pad 4)',
      },
      tipText:
        'DAW Control is Pad 4 in the mode grid. Press Pad 4 to select it.',
    },
    {
      id: 'step-7',
      title: 'Select DAW Control Pad Mode',
      instruction:
        'Press Pad 4 to select DAW Control from the pad mode list. The pads are now repurposed to send DAW-specific commands. The pad assignments depend on which DAW application you are using.',
      details:
        'In DAW Control pad mode, each pad sends a specific command to your DAW software. The Fantom supports Logic Pro X and MainStage natively. For other DAWs, the pads send standard MIDI CC messages that can be mapped to any function.',
      highlightControls: ['pad-4'],
      panelStateChanges: {
        'pad-4': { active: true, ledOn: true, ledColor: '#00ff44' },
      },
      displayState: {
        screenType: 'pad-mode',
        title: 'PAD MODE',
        menuItems: [
          { label: '1: Sample Pad' },
          { label: '2: Note Pad' },
          { label: '3: Partial Sw/Sel' },
          { label: '4: DAW Control', selected: true },
          { label: '5: Zone Mute' },
          { label: '6: Zone Solo' },
        ],
        selectedIndex: 3,
        statusText: 'DAW Control selected',
      },
      tipText:
        'DAW Control pad mode works with Logic Pro X, MainStage, and any DAW that accepts MIDI CC.',
    },
    {
      id: 'step-8',
      title: 'Logic Pro X Pad Mapping',
      instruction:
        'With DAW Control pad mode active, here are the Logic Pro X pad assignments: Pads [1]-[4] recall Screen Sets 1-4, Pads [5]-[8] control Zoom (H In, H Out, V In, V Out), Pad [9] opens the Marker List, Pads [13]-[14] navigate markers, Pad [15] is Song Position, and Pad [16] is Play/Stop.',
      details:
        'For MainStage: Pad [1] = Next Set, Pad [2] = Previous Set, Pad [3] = Next Patch, Pad [4] = Previous Patch. You need the Roland USB driver and the Logic Pro X or MainStage control surface plug-in installed on your Mac for these mappings to work automatically.',
      highlightControls: ['pad-1', 'pad-4'],
      panelStateChanges: {
        'pad-4': { active: false, ledOn: false },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'Studio Session',
        tempo: 120,
        beatSignature: '4/4',
        statusText: 'Logic Pro X: [1-4]=ScreenSet [5-8]=Zoom [16]=Play/Stop',
      },
      tipText:
        'Install the Logic Pro X control surface plug-in from Roland for automatic pad mapping.',
    },
    {
      id: 'step-9',
      title: 'Set Local Switch to OFF',
      instruction:
        'Press Menu, navigate to SYSTEM, then scroll to the MIDI tab. Set Local Switch to OFF. This prevents double notes when recording — the DAW echoes MIDI back to the Fantom, so local sound generation must be disabled to avoid hearing each note twice.',
      details:
        'When Local Switch is OFF, pressing a key does not directly trigger the Fantom\'s tone engine. Instead, the MIDI note goes out over USB to the DAW, the DAW processes it and sends it back, and the Fantom plays the returned note. This is called "MIDI thru" monitoring and is standard practice for DAW recording.',
      highlightControls: ['menu'],
      panelStateChanges: {
        menu: { active: true },
        'pad-mode': { active: false },
      },
      displayState: {
        screenType: 'system-settings',
        title: 'SYSTEM',
        activeTab: 'MIDI',
        menuItems: [
          { label: 'MIDI Ch', value: '1' },
          { label: 'Local Switch', value: 'OFF', selected: true },
          { label: 'Zone 1 Tx Ch', value: '1' },
          { label: 'Zone 1 Rx Ch', value: '1' },
          { label: 'Zone 2 Tx Ch', value: '2' },
          { label: 'Device ID', value: '17' },
        ],
        selectedIndex: 1,
        statusText: 'MIDI tab — Local Switch = OFF',
      },
      tipText:
        'Turn Local Switch back ON when you disconnect from the DAW, otherwise the keyboard will be silent.',
    },
    {
      id: 'step-10',
      title: 'Return Pads to Sample Pad Mode',
      instruction:
        'Press Exit to leave System Settings, then press Pad Mode and select Sample Pad (Pad 1) to return the pads to their normal sample-triggering function.',
      details:
        'You can switch pad modes at any time during a session. DAW Control mode only affects the pads — the keyboard, sliders, and knobs continue to work normally. Switch back to Sample Pad when you are done with DAW control.',
      highlightControls: ['pad-mode'],
      panelStateChanges: {
        menu: { active: false },
        'pad-mode': { active: true },
      },
      displayState: {
        screenType: 'pad-mode',
        title: 'PAD MODE',
        menuItems: [
          { label: '1: Sample Pad', selected: true },
          { label: '2: Note Pad' },
          { label: '3: Partial Sw/Sel' },
          { label: '4: DAW Control' },
          { label: '5: Zone Mute' },
          { label: '6: Zone Solo' },
        ],
        selectedIndex: 0,
        statusText: 'Returning to Sample Pad mode',
      },
      tipText:
        'Pad mode changes take effect immediately — no need to save.',
    },
    {
      id: 'step-11',
      title: 'DAW Controller Setup Complete!',
      instruction:
        'Press Exit to return to the home screen. Your Fantom 08 is now configured as a DAW controller with USB VENDOR driver, USB audio enabled, and DAW Control pad mode ready to use. Remember to set Local Switch back to ON when you disconnect from the DAW.',
      details:
        'Summary: (1) USB Driver = VENDOR for full MIDI + audio over USB, (2) USB Audio Input/Output = ON for bidirectional audio, (3) DAW CTRL button activates DAW control mode, (4) Pad Mode = DAW Control for Logic/MainStage commands, (5) Local Switch = OFF to prevent double notes during recording. Save your System settings with Write to keep these changes.',
      highlightControls: ['exit'],
      panelStateChanges: {
        'daw-ctrl': { active: false },
        'pad-mode': { active: false },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'Studio Session',
        tempo: 120,
        beatSignature: '4/4',
        statusText: 'DAW Controller configured',
      },
      tipText:
        'Remember: Local Switch OFF = DAW mode. Local Switch ON = standalone mode. Toggle as needed.',
    },
  ],
};
