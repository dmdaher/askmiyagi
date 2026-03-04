import { Tutorial } from '@/types/tutorial';

export const importingAudioFiles: Tutorial = {
  id: 'importing-audio-files',
  deviceId: 'fantom-08',
  title: 'Importing Audio Files — USB, Keyboard, Multisample, and .svz',
  description:
    'Learn to import audio files from USB or internal storage: create playable keyboard tones, build multisamples from multiple files with auto-mapping, and import .svz sample data packs.',
  category: 'sampling',
  difficulty: 'intermediate',
  estimatedTime: '8 min',
  tags: ['sampling', 'import', 'usb', 'multisample', 'svz', 'intermediate'],
  steps: [
    {
      id: 'step-1',
      title: 'Introduction to Audio Import',
      instruction:
        'The Fantom can import audio files (WAV/AIFF/MP3) from USB to create playable tones on the keyboard, assign to pads, or build multisamples automatically. You can also import .svz sample data packs.',
      details:
        "In this tutorial, you'll learn the Import To Keyboard workflow (single file to playable tone), Import To Multisample (multiple files with auto-mapping), and Import Sample Data (.svz format for sharing between Fantom units).",
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
        'Press the SAMPLING button to open the Sampling Menu. The bottom half shows all import options: Import To Pad, Import To Keyboard, Import To Multisample.',
      details:
        'The Sampling Menu is divided into two sections: the top three entries are for recording (To Pad, To Keyboard, To Storage) and the bottom three are for importing existing files (To Pad, To Keyboard, To Multisample).',
      highlightControls: ['sampling'],
      panelStateChanges: {
        sampling: { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'SAMPLING MENU',
        menuItems: [
          { label: 'SAMPLING <To Pad>' },
          { label: 'SAMPLING <To Keyboard>' },
          { label: 'SAMPLING <To Storage>' },
          { label: 'IMPORT <To Pad>' },
          { label: 'IMPORT <To Keyboard>', selected: true },
          { label: 'IMPORT <To Multisample>' },
        ],
        selectedIndex: 4,
        statusText: 'E1=WAVE/EXP MEMORY INFO  E4=PAD SAMPLE  E5=KBD SAMPLE  E6=MULTISAMPLE',
      },
    },
    {
      id: 'step-3',
      title: 'Import To Keyboard — Select Source',
      instruction:
        'Touch IMPORT <To Keyboard>. The USB file browser shows folders and WAV/AIFF files. Use E2 (PREVIEW) to audition files before importing, E3 for Preview Level, E6 (IMPORT) to select.',
      details:
        'The file browser lets you navigate USB MEMORY or INTERNAL STORAGE. Browse folders, preview audio files to find the right one, then select it for import. Supported formats include WAV, AIFF, and MP3.',
      highlightControls: ['enter'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'IMPORT SAMPLE TO KBD (SELECT SOURCE)',
        menuItems: [
          { label: 'USB MEMORY', selected: true },
          { label: 'INTERNAL STORAGE' },
          { label: 'Wave/A_Syn4_C3.wav  39.7KB' },
          { label: 'Bass.wav  1.2MB' },
          { label: 'Guitar.wav  771.2KB' },
          { label: 'Strings.wav  638.0KB' },
        ],
        selectedIndex: 0,
        statusText: 'E2=PREVIEW  E3=Preview Level  E6=IMPORT',
      },
    },
    {
      id: 'step-4',
      title: 'Configure Import Settings',
      instruction:
        'The SETTING screen appears after selecting a file. Set Destination Tone, Loop Mode, Original Key, Emphasis, and Save To Internal Storage. The Original Key determines which key plays the sample at its natural pitch.',
      details:
        'Loop Mode sets playback behavior (ONE-SHOT or FWD loop). Original Key maps the sample to a specific MIDI note — other keys transpose from this reference. Emphasis boosts high frequencies. Save To Internal Storage keeps a copy of the WAV in the Fantom.',
      highlightControls: ['value-dial'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'IMPORT SAMPLE TO KBD (SETTING)',
        menuItems: [
          { label: 'Import File: USB/Wave/Bass.wav' },
          { label: 'Loop Mode: ONE-SHOT', selected: true },
          { label: 'Original Key: 60(C 4)' },
          { label: 'Emphasis: ON' },
          { label: 'Save To Internal Storage: ON' },
          { label: 'Destination Tone: 0001:INITIAL TONE' },
        ],
        selectedIndex: 1,
        statusText: 'E1=Preview  E6=Execute',
      },
    },
    {
      id: 'step-5',
      title: 'Execute the Import',
      instruction:
        'Press E6 (EXECUTE) to import. A confirmation dialog appears — press E5 (OK) to proceed. A user tone is created and assigned to the current zone. Play the keyboard to hear the imported sound at matched pitches.',
      details:
        'After confirmation, the Fantom creates a new user tone from the imported file. The sample is pitch-shifted across the keyboard based on the Original Key setting, so you can play melodies and chords with the imported sound.',
      highlightControls: ['function-e6'],
      panelStateChanges: {},
      displayState: {
        screenType: 'popup',
        popupData: {
          popupType: 'confirm',
          message: 'Execute import?',
        },
        parameterName: 'Import to Keyboard',
        parameterValue: 'Bass.wav → Tone 0001',
      },
    },
    {
      id: 'step-6',
      title: 'Import Multiple Files to Multisample',
      instruction:
        'Return to the SAMPLING MENU and select IMPORT <To Multisample>. The file browser supports multi-select: touch filenames while holding SHIFT to select multiple files. Press E6 (IMPORT) to proceed.',
      details:
        'Multi-file import is the fastest way to build a multisample instrument. Select all the WAV files that represent different pitches of the same instrument (e.g., piano samples at C2, C3, C4, C5). The Fantom will map them across the keyboard automatically.',
      highlightControls: ['shift', 'enter'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'IMPORT SAMPLE TO MULTISAMPLE (SELECT SOURCE)',
        menuItems: [
          { label: 'A_Syn4_C3.wav  39.7KB', selected: true },
          { label: 'A_Syn4_F3.wav  38.1KB' },
          { label: 'A_Syn4_G2.wav  39.2KB' },
          { label: 'bass.wav  1.2MB' },
        ],
        selectedIndex: 0,
        statusText: 'Hold SHIFT to multi-select  E6=IMPORT',
      },
    },
    {
      id: 'step-7',
      title: 'Configure Multisample Import Settings',
      instruction:
        'The SETTING screen shows: Create Tone, Multisample Name (RENAME), Loop Mode, Apply Normalize, Apply Emphasis, Save To Storage. Set the Original Key per file for accurate auto-mapping.',
      details:
        'Create Tone automatically generates a playable tone after import. Normalize raises all samples to equal volume. Emphasis boosts high frequencies. The multisample name can be edited with RENAME. Each file keeps its Original Key for proper keyboard mapping.',
      highlightControls: ['value-dial'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'IMPORT SAMPLE TO MULTISAMPLE (SETTING)',
        menuItems: [
          { label: 'Selected: 3 files', selected: true },
          { label: 'Loop Mode: ONE-SHOT' },
          { label: 'Normalize: ON' },
          { label: 'Emphasis: ON' },
          { label: 'Create Tone: ON' },
          { label: 'Multisample Name: INITIAL MEMO' },
        ],
        selectedIndex: 0,
        statusText: 'E5=RENAME  E6=EXECUTE',
      },
    },
    {
      id: 'step-8',
      title: 'Review Imported Samples',
      instruction:
        'After pressing E6 (EXECUTE) and E5 (OK), the IMPORTED SAMPLE LIST shows all files with their parameters: No, Name, Loop Mode, Original Key, Gain, Fine Tune, Level. Touch RENAME, WAVE EDIT, MODIFY, or NEXT to manage.',
      details:
        'This review screen lets you fine-tune each imported sample before finalizing. You can rename individual samples, edit their waveforms, apply modify operations (truncate, normalize, emphasis), or proceed to the next step to complete the multisample.',
      highlightControls: ['display'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'IMPORTED SAMPLE LIST',
        menuItems: [
          { label: '0001  A_Syn4_C3  ONE-SHOT  49(C♯3)  0(dB)  0  127', selected: true },
          { label: '0002  A_Syn4_F3  ONE-SHOT  53(F 3)  0(dB)  0  127' },
          { label: '0003  A_Syn4_G2  ONE-SHOT  43(G 2)  0(dB)  0  127' },
        ],
        selectedIndex: 0,
        statusText: 'E1=RENAME  E2=WAVE EDIT  E3=MODIFY  E6=NEXT',
      },
    },
    {
      id: 'step-9',
      title: 'Import .svz Sample Data',
      instruction:
        'Press MENU, touch UTILITY, then IMPORT, then IMPORT SAMPLE. Browse USB for .svz files. Select a file, choose source samples, set destination slots, and execute.',
      details:
        'The .svz format is a Roland proprietary format for sharing sample data between Fantom units. It contains sample waveforms plus all parameter settings. The import wizard lets you select which samples to import and where to place them in memory.',
      highlightControls: ['menu'],
      panelStateChanges: {
        menu: { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'IMPORT SAMPLE (SELECT FILE)',
        menuItems: [
          { label: 'ROLAND/FANTOM/SOUND/EXPORT_TONE.svz', selected: true },
          { label: 'ROLAND/FANTOM/SOUND/My_Samples.svz' },
        ],
        selectedIndex: 0,
        statusText: 'Select .svz file  E6=SELECT',
      },
    },
    {
      id: 'step-10',
      title: 'Complete',
      instruction:
        'Press EXIT to return to the home screen. Imported tones appear in the user tone list and can be assigned to any zone. Your imported multisamples are ready for performance.',
      details:
        "You've learned three import workflows: Import To Keyboard for single-file tones, Import To Multisample for multi-file instruments with auto-mapping, and Import Sample Data for .svz packs. All imported content is accessible from the tone selection screens.",
      highlightControls: ['exit'],
      panelStateChanges: {
        sampling: { active: false },
        menu: { active: false },
        exit: { active: true },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'Homecoming',
        tempo: 120,
        beatSignature: '4/4',
        statusText: 'Import complete — tones available in user list',
      },
    },
  ],
};
