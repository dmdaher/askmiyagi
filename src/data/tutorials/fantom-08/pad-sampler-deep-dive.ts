import { Tutorial } from '@/types/tutorial';

export const padSamplerDeepDive: Tutorial = {
  id: 'pad-sampler-deep-dive',
  deviceId: 'fantom-08',
  title: 'Pad Sampler Deep Dive — Banks, Import, Edit, and Export',
  description:
    'Master the full pad sampler: organize 64 samples across 4 banks, move and copy between pads, import audio from USB, use Quick Edit and Wave Edit for per-pad control, and export WAV files.',
  category: 'sampling',
  difficulty: 'intermediate',
  estimatedTime: '10 min',
  tags: ['sampling', 'pads', 'banks', 'import', 'wave-edit', 'intermediate'],
  steps: [
    {
      id: 'step-1',
      title: 'Introduction to the Pad Sampler',
      instruction:
        'The pad sampler goes far beyond basic recording. You can organize 64 samples across 4 banks, import files from USB, edit waveforms per pad, and export WAV files.',
      details:
        "In this tutorial, you'll explore the SAMPLE PAD overview screen, bank switching, pad move/copy operations, sampling modes, file import, Quick Edit, Wave Edit, and the Sample Utility for rename/export.",
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
      title: 'View the SAMPLE PAD Screen',
      instruction:
        'Hold SHIFT and press SAMPLING to open the SAMPLE PAD overview. This shows all pad assignments across all 4 banks, with GATE, LOOP, and FX SW status per pad.',
      details:
        'The SAMPLE PAD screen is the central dashboard for pad sample management. Each pad entry shows: sample name, stereo/mono indicator, file size, and toggle states for GATE (play while held), LOOP (continuous playback), and FX SW (route through Master FX). Tabs at bottom: WAVE EDIT, QUICK EDIT, IMPORT.',
      highlightControls: ['shift', 'sampling'],
      panelStateChanges: {
        shift: { active: true },
        sampling: { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'SAMPLE PAD',
        menuItems: [
          { label: '1  GATE LOOP FX  PartA_Riff  STEREO 2.1MB', selected: true },
          { label: '2  GATE LOOP FX  PartB_Riff  STEREO 1.8MB' },
          { label: '3  GATE LOOP FX  Kick_808    MONO   142KB' },
          { label: '4  GATE LOOP FX  Snare_Clap  MONO   98KB' },
        ],
        selectedIndex: 0,
        statusText: 'BANK 1  |  E1=WAVE EDIT  E2=QUICK EDIT  E6=IMPORT',
      },
    },
    {
      id: 'step-3',
      title: 'Switch Banks',
      instruction:
        'Touch BANK2/3/4 tabs to view different pad banks. The Fantom has 4 banks of 16 pads each (64 total). You can also press the BANK button + pad 1-4 to switch directly.',
      details:
        'Each bank holds 16 independent pad samples. Banks let you organize samples by type — for example, Bank 1 for drums, Bank 2 for bass loops, Bank 3 for vocal hits. The BANK button provides hardware access to quick-switch between banks.',
      highlightControls: ['bank'],
      panelStateChanges: {
        shift: { active: false },
        bank: { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'SAMPLE PAD',
        statusText: 'BANK 2  |  E1=WAVE EDIT  E2=QUICK EDIT  E6=IMPORT',
        menuItems: [
          { label: '1  GATE LOOP FX  Bass_Loop   STEREO 3.2MB', selected: true },
          { label: '2  GATE LOOP FX  Chord_Stab  STEREO 1.5MB' },
          { label: '3  GATE LOOP FX  ---' },
          { label: '4  GATE LOOP FX  ---' },
        ],
        selectedIndex: 0,
      },
    },
    {
      id: 'step-4',
      title: 'Move and Copy Pad Samples',
      instruction:
        'To MOVE a sample: hold the source pad and press CLIP BOARD. To COPY: hold SHIFT + source pad + CLIP BOARD. Then hold CLIP BOARD and press the destination pad.',
      details:
        'Move removes the sample from the source pad and places it at the destination. Copy duplicates it so both pads have the same sample. This is useful for rearranging your pad layout or duplicating a sample across banks for quick access.',
      highlightControls: ['clip-board'],
      panelStateChanges: {
        bank: { active: false },
        'clip-board': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'SAMPLE PAD',
        statusText: 'Move: Select destination pad',
        menuItems: [
          { label: '1  GATE LOOP FX  PartA_Riff  STEREO 2.1MB' },
          { label: '2  GATE LOOP FX  PartB_Riff  STEREO 1.8MB' },
          { label: '3  GATE LOOP FX  Kick_808    MONO   142KB', selected: true },
          { label: '4  GATE LOOP FX  Snare_Clap  MONO   98KB' },
        ],
        selectedIndex: 2,
      },
    },
    {
      id: 'step-5',
      title: 'Sampling to Pad with Options',
      instruction:
        'Press SAMPLING and select SAMPLING <To Pad>. Choose the destination pad bank/number. Set Sampling Mode (KBD+INPUT, KBD, or INPUT), Format (MONO/STEREO), and Auto Trigger.',
      details:
        'Sampling Mode controls the audio source: KBD+INPUT captures keyboard audio plus external input together, KBD captures only the internal sound engine, INPUT captures only external audio. Auto Trigger starts recording automatically when the input level exceeds a threshold.',
      highlightControls: ['sampling'],
      panelStateChanges: {
        'clip-board': { active: false },
        sampling: { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'SAMPLING STANDBY (TO PAD)',
        menuItems: [
          { label: 'Sample Pad: 1-1', selected: true },
          { label: 'Sampling Mode: KBD+INPUT' },
          { label: 'Format: STEREO' },
          { label: 'Audio In: OFF' },
          { label: 'Auto Trigger: OFF' },
        ],
        selectedIndex: 0,
        statusText: '000:00:00  CANCEL / START',
      },
    },
    {
      id: 'step-6',
      title: 'Select Sampling Mode',
      instruction:
        'Touch Sampling Mode to choose the input source. KBD+INPUT samples keyboard and external audio together; KBD samples only the internal sound engine; INPUT samples only external audio.',
      details:
        'KBD mode is great for resampling internal tones — play a chord and capture it as a one-shot sample. INPUT mode is for recording external instruments or vocals. KBD+INPUT lets you layer live playing over external audio.',
      highlightControls: ['value-dial'],
      panelStateChanges: {},
      displayState: {
        screenType: 'popup',
        popupData: {
          popupType: 'value',
        },
        parameterName: 'Sampling Mode',
        parameterValue: 'KBD+INPUT',
      },
    },
    {
      id: 'step-7',
      title: 'Import Audio to Pad',
      instruction:
        'On the SAMPLE PAD screen, touch IMPORT (E6). Browse USB MEMORY or INTERNAL STORAGE for WAV files. Auto Import (E4) assigns files consecutively to empty pads; manual Import (E3) selects a specific destination.',
      details:
        'The file browser shows folders and audio files on USB or internal storage. Select files and use Auto Import to quickly load a batch of samples across consecutive pads, or manually choose exactly which pad each file goes to.',
      highlightControls: ['function-e6'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'PAD SAMPLE IMPORT',
        menuItems: [
          { label: 'USB MEMORY', selected: true },
          { label: 'INTERNAL STORAGE' },
          { label: 'MySample_001.wav  3.0MB' },
          { label: 'MySample_002.wav  3.0MB' },
        ],
        selectedIndex: 0,
        statusText: 'E3=IMPORT  E4=AUTO IMPORT  E5=PREVIEW',
      },
    },
    {
      id: 'step-8',
      title: 'Quick Edit — Per-Pad Settings',
      instruction:
        'On the SAMPLE PAD screen, touch E2 (QUICK EDIT). Toggle GATE (ON = stops when released, OFF = plays to end), LOOP (ON/OFF), and FX SW (ON = routes through Master FX) per pad.',
      details:
        'Quick Edit provides fast access to the three most important per-pad settings without entering the full editor. GATE mode is essential for triggering — drums typically use GATE OFF (play full sample) while loops use GATE ON (hold to play).',
      highlightControls: ['function-e2'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'SAMPLE PAD (QUICK EDIT)',
        menuItems: [
          { label: '1  GATE:ON   LOOP:ON   FX:ON', selected: true },
          { label: '2  GATE:ON   LOOP:OFF  FX:OFF' },
          { label: '3  GATE:OFF  LOOP:OFF  FX:ON' },
          { label: '4  GATE:OFF  LOOP:OFF  FX:ON' },
        ],
        selectedIndex: 0,
        statusText: 'Touch pad number to toggle settings',
      },
    },
    {
      id: 'step-9',
      title: 'Wave Edit for Pad Samples',
      instruction:
        'Select a pad and touch E1 (WAVE EDIT). The waveform display shows START POINT and END POINT markers. Use E1-E6 for: Start, End, Zoom Horz, Zoom Vert, Level, Preview.',
      details:
        'The pad Wave Edit screen works like the KBD wave editor but is optimized for pad samples. Trim start/end points to remove silence, adjust the level, and preview in real time. The SAMPLE UTILITY button gives access to rename, truncate, delete, and export functions.',
      highlightControls: ['function-e1'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'WAVE EDIT',
        menuItems: [
          { label: 'Start Point: 0000061952', selected: true },
          { label: 'End Point: 0000286905' },
          { label: 'Zoom Horz: 1/512' },
          { label: 'Zoom Vert: x1' },
          { label: 'Level: 127' },
        ],
        selectedIndex: 0,
        statusText: 'E1=Start  E2=End  E3=Zoom H  E4=Zoom V  E5=Level  E6=Preview',
      },
    },
    {
      id: 'step-10',
      title: 'Use HOLD for Sustained Playback',
      instruction:
        'While holding a pad, press the HOLD button. The pad sample continues playing after you release it. Press the pad again to stop. Rapidly press HOLD 4 times to stop all held pads.',
      details:
        'HOLD only works with GATE=ON pads. It latches the pad so you can free your hands while the sample plays. This is great for backing loops during a live performance. Press HOLD 4 times quickly to release all held samples at once.',
      highlightControls: ['hold', 'pad-1'],
      panelStateChanges: {
        hold: { active: true },
        'pad-1': { active: true, ledOn: true, ledColor: '#00ff44' },
      },
      displayState: {
        screenType: 'menu',
        title: 'SAMPLE PAD',
        statusText: 'HOLD Active — Pad 1 latched',
        menuItems: [
          { label: '1  GATE LOOP FX  PartA_Riff  STEREO 2.1MB', selected: true },
          { label: '2  GATE LOOP FX  PartB_Riff  STEREO 1.8MB' },
          { label: '3  GATE LOOP FX  Kick_808    MONO   142KB' },
          { label: '4  GATE LOOP FX  Snare_Clap  MONO   98KB' },
        ],
        selectedIndex: 0,
      },
    },
    {
      id: 'step-11',
      title: 'Sample Utility — Rename, Export, Delete',
      instruction:
        'From SAMPLE PAD or WAVE EDIT, touch SAMPLE UTILITY. Options: RENAME, TRUNCATE (cut unwanted regions), DELETE, DELETE ALL, EXPORT WAV, EXPORT ALL WAV. Exports save to the "EXPORT SAMPLE" folder on USB.',
      details:
        'RENAME lets you give meaningful names to samples. TRUNCATE permanently removes audio before start point and after end point, freeing memory. EXPORT WAV saves individual pad samples as WAV files to USB for backup or use in a DAW. EXPORT ALL WAV exports every pad sample at once.',
      highlightControls: ['display'],
      panelStateChanges: {
        hold: { active: false },
        'pad-1': { active: false, ledOn: false },
      },
      displayState: {
        screenType: 'menu',
        title: 'SAMPLE UTILITY',
        menuItems: [
          { label: 'Rename', selected: true },
          { label: 'Truncate' },
          { label: 'Delete' },
          { label: 'Delete All' },
          { label: 'Export WAV' },
          { label: 'Export All WAV' },
        ],
        selectedIndex: 0,
        statusText: 'Select utility operation',
      },
    },
    {
      id: 'step-12',
      title: 'Complete',
      instruction:
        'Press EXIT to return to the home screen. Pad samples auto-save to memory. You now know how to organize, import, edit, and export pad samples across all 4 banks.',
      details:
        "You've mastered the full pad sampler workflow: SAMPLE PAD overview, bank switching, move/copy, sampling modes, file import, Quick Edit toggles, Wave Edit trimming, HOLD for live performance, and Sample Utility for management and export.",
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
        statusText: 'Pad samples saved — 4 banks available',
      },
    },
  ],
};
