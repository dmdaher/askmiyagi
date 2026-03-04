import { Tutorial } from '@/types/tutorial';

export const advancedKeyboardSampling: Tutorial = {
  id: 'advanced-keyboard-sampling',
  deviceId: 'fantom-08',
  title: 'Advanced Keyboard Sampling — KBD Sampling, Storage, and Management',
  description:
    'Go beyond basic pad sampling: record samples to the keyboard for pitched playback, save directly to internal storage, and manage your KBD sample library with rename, modify, and utility tools.',
  category: 'sampling',
  difficulty: 'advanced',
  estimatedTime: '10 min',
  tags: ['sampling', 'keyboard', 'storage', 'sample-management', 'advanced'],
  steps: [
    {
      id: 'step-1',
      title: 'Introduction to Advanced Sampling',
      instruction:
        'Beyond basic pad sampling, the Fantom can sample to the keyboard (creating playable tones across the keys) and to storage (saving WAV files without assignment). This tutorial covers the full keyboard sampling workflow and sample management tools.',
      details:
        "You'll learn three key workflows: Sampling To Keyboard (record and map to keys for pitched playback), Sampling To Storage (save WAV to internal storage), and KBD SAMPLE management (rename, modify, assign, export).",
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
      title: 'Open the Sampling Menu',
      instruction:
        'Press the SAMPLING button to open the Sampling Menu. This menu shows all sampling and import options.',
      details:
        'The Sampling Menu is the gateway to all sampling workflows. From here you can sample to pad, keyboard, or storage, and import audio files to pad, keyboard, or multisample. The E-knobs provide quick access to sample management screens.',
      highlightControls: ['sampling'],
      panelStateChanges: {
        sampling: { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'SAMPLING MENU',
        menuItems: [
          { label: 'SAMPLING <To Pad>', selected: true },
          { label: 'SAMPLING <To Keyboard>' },
          { label: 'SAMPLING <To Storage>' },
          { label: 'IMPORT <To Pad>' },
          { label: 'IMPORT <To Keyboard>' },
          { label: 'IMPORT <To Multisample>' },
        ],
        selectedIndex: 0,
        statusText: 'E1=WAVE/EXP MEMORY INFO  E4=PAD SAMPLE  E5=KBD SAMPLE  E6=MULTISAMPLE',
      },
    },
    {
      id: 'step-3',
      title: 'Select Sampling To Keyboard',
      instruction:
        'Touch SAMPLING <To Keyboard> to open the keyboard sampling standby screen. This records audio and maps it to the keyboard for pitched playback.',
      details:
        'Unlike pad sampling which assigns to a single pad trigger, keyboard sampling creates a tone that plays across the full key range. The sample is pitch-shifted automatically based on the Original Key setting, so playing higher keys produces higher pitches.',
      highlightControls: ['cursor-down', 'enter'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'SAMPLING STANDBY (TO KBD)',
        menuItems: [
          { label: 'Destination Tone: 0001', selected: true },
          { label: 'Loop Mode: FWD' },
          { label: 'Original Key: 60(C 4)' },
          { label: 'Save To Internal Storage: OFF' },
          { label: 'Assign To Keyboard: ON' },
          { label: 'Emphasis: OFF' },
        ],
        selectedIndex: 0,
        statusText: '000:00:00  CANCEL / START',
      },
    },
    {
      id: 'step-4',
      title: 'Configure Sampling Parameters',
      instruction:
        'Set Loop Mode to ONE-SHOT for a single playback, Original Key to 60(C 4), and Save To Internal Storage to ON so the sample persists after power off.',
      details:
        'Loop Mode determines playback behavior: FWD loops continuously, ONE-SHOT plays once. Original Key sets which key plays the sample at its original pitch. Save To Internal Storage writes the WAV file permanently. Emphasis boosts high frequencies during recording.',
      highlightControls: ['value-dial'],
      panelStateChanges: {},
      displayState: {
        screenType: 'popup',
        popupData: {
          popupType: 'value',
        },
        parameterName: 'Loop Mode',
        parameterValue: 'ONE-SHOT',
      },
    },
    {
      id: 'step-5',
      title: 'Record and Preview',
      instruction:
        'Press START to begin recording. Play your sound source, then press STOP. A dialog appears: "Use new sample?" with a waveform preview. Press E1 to preview, E6 OK to accept.',
      details:
        'After recording, the Fantom shows the captured waveform and offers four options: PREVIEW (E1) to audition, RETRY (E4) to re-record, CANCEL (E5) to discard, and OK (E6) to accept. Always preview before accepting to verify recording quality.',
      highlightControls: ['function-e1', 'function-e6'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'SAMPLING TO KBD (DLG)',
        statusText: 'Use new sample?',
        menuItems: [
          { label: '[E1] PREVIEW' },
          { label: '[E4] RETRY' },
          { label: '[E5] CANCEL' },
          { label: '[E6] OK', selected: true },
        ],
        selectedIndex: 3,
      },
    },
    {
      id: 'step-6',
      title: 'Edit KBD Sample Wave',
      instruction:
        'Press E6 OK to accept the sample. The KBD SAMPLE WAVE EDIT screen opens, showing the waveform with Start Point, Loop Start Point, and End Point markers. Adjust Gain, Fine Tune, and Level as needed.',
      details:
        'The wave editor lets you trim silence (Start/End Point), set a loop region (Loop Start Point), adjust volume (Gain/Level), and fine-tune pitch (Fine Tune in cents). Tabs at the bottom provide WRITE, RELOAD, MODIFY, and UTILITY functions.',
      highlightControls: ['function-e1', 'function-e2', 'function-e3'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'KBD SAMPLE WAVE EDIT',
        menuItems: [
          { label: 'Start Point: 0000000000', selected: true },
          { label: 'Loop Start Point: 0000000000' },
          { label: 'End Point: 0000524288' },
          { label: 'Gain: 0(dB)  Fine Tune: 0  Level: 127' },
        ],
        selectedIndex: 0,
        statusText: 'WRITE | RELOAD | MODIFY | UTILITY',
      },
    },
    {
      id: 'step-7',
      title: 'Sampling to Storage',
      instruction:
        'Return to the SAMPLING MENU and select SAMPLING <To Storage>. This records a WAV file directly to INT:SAMPLING folder without assigning to pad or keyboard.',
      details:
        'Sampling to Storage is useful for capturing audio files that you want to import later or transfer via USB. The recorded file is saved in WAV format to the internal SAMPLING folder. You can rename the file before saving. This closes the "Sampling to Storage" gap from the manual.',
      highlightControls: ['sampling'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'SAMPLING STANDBY (TO STORAGE)',
        menuItems: [
          { label: 'Destination: INT STORAGE', selected: true },
          { label: 'Sampling Mode: KBD+INPUT' },
          { label: 'Format: STEREO' },
          { label: 'Audio In: OFF' },
        ],
        selectedIndex: 0,
        statusText: 'INT:SAMPLING  000:00:00  CANCEL / START',
      },
    },
    {
      id: 'step-8',
      title: 'Open KBD SAMPLE List',
      instruction:
        'Press SAMPLING then E5 (KBD SAMPLE) to view all keyboard samples. The list shows sample number, name, channel (S=stereo, M=mono), size, time, and Original Key.',
      details:
        'The KBD SAMPLE LIST is the central management screen for all keyboard samples. From here you can preview, edit parameters, access wave editing, and run utilities. E2=MARK for multi-select, E3=PARAM EDIT, E4=WAVE EDIT.',
      highlightControls: ['sampling', 'function-e5'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'KBD SAMPLE LIST',
        menuItems: [
          { label: 'smpl0001  S  00:00:302  49(C♯3)', selected: true },
          { label: 'smpl0002  M  00:06:028  60(C 4)' },
          { label: 'Guitar   M  85KB       60(C 4)' },
          { label: 'Strings  M  638KB      60(C 4)' },
        ],
        selectedIndex: 0,
        statusText: 'E2=MARK  E3=PARAM EDIT  E4=WAVE EDIT  E6=UTILITY',
      },
    },
    {
      id: 'step-9',
      title: 'Edit Sample Parameters',
      instruction:
        'Press E3 (PARAM EDIT) to view the parameter view. This shows Loop Mode, Original Key, Gain, Fine Tune, and Level for each sample in a grid. Use E2 MARK to select multiple samples for batch editing.',
      details:
        'The parameter view is a compact way to compare and edit multiple samples at once. Each row shows one sample with all its key parameters. Press E4 to switch to WAVE EDIT view for the selected sample.',
      highlightControls: ['function-e3'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'KBD SAMPLE LIST (PARAMETER)',
        menuItems: [
          { label: 'smpl0001  FWD      49(C♯3)  0(dB)  0  127', selected: true },
          { label: 'smpl0002  ONE-SHOT 60(C 4)  0(dB)  0  127' },
          { label: 'Guitar   ONE-SHOT 60(C 4)  0(dB)  0  127' },
          { label: 'Strings  FWD      60(C 4)  0(dB)  0  127' },
        ],
        selectedIndex: 0,
        statusText: 'E2=MARK  E4=WAVE EDIT  E6=UTILITY',
      },
    },
    {
      id: 'step-10',
      title: 'KBD Sample Utility',
      instruction:
        'Press E6 (UTILITY) to open the Sample Utility menu. Options include Rename, Delete, Assign To Keyboard, Move, Copy, Import, and Create Multisample.',
      details:
        'The utility menu provides essential sample management. ASSIGN TO KEYBOARD assigns an existing sample to a keyboard tone. MOVE/COPY rearranges samples in the list. IMPORT brings in external WAV files. CREATE MULTISAMPLE builds a multisample from selected KBD samples.',
      highlightControls: ['function-e6'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'SAMPLE UTILITY',
        menuItems: [
          { label: 'Rename', selected: true },
          { label: 'Delete' },
          { label: 'Assign To Keyboard' },
          { label: 'Move' },
          { label: 'Copy' },
          { label: 'Import' },
          { label: 'Create Multisample' },
        ],
        selectedIndex: 0,
      },
    },
    {
      id: 'step-11',
      title: 'Sample MODIFY Functions',
      instruction:
        'From the WAVE EDIT screen, touch MODIFY to access processing tools: TRUNCATE removes waveform before start and after end points, NORMALIZE raises volume to maximum without clipping, and EMPHASIS boosts high frequencies.',
      details:
        'These are destructive operations that permanently alter the sample data. TRUNCATE is essential after setting start/end points — it frees memory by removing the unused portions. NORMALIZE is great for quiet recordings. EMPHASIS adds presence to dull samples.',
      highlightControls: ['display'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'SAMPLE MODIFY',
        menuItems: [
          { label: 'Truncate', selected: true },
          { label: 'Emphasis' },
          { label: 'Normalize' },
        ],
        selectedIndex: 0,
        statusText: 'Select modify operation',
      },
    },
    {
      id: 'step-12',
      title: 'Complete',
      instruction:
        'Press EXIT to return to the home screen. Your keyboard samples are saved and ready to play. Check Wave/Expansion Memory Info (E1 from SAMPLING MENU) to monitor storage usage.',
      details:
        "You've learned to sample to keyboard for pitched playback, sample to storage for WAV file capture, manage your KBD sample library with parameters and utilities, and process samples with Truncate, Normalize, and Emphasis.",
      highlightControls: ['exit'],
      panelStateChanges: {
        sampling: { active: false },
        exit: { active: true },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'Homecoming',
        tempo: 120,
        beatSignature: '4/4',
        statusText: 'KBD samples saved — ready for playback',
      },
    },
  ],
};
