import { Tutorial } from '@/types/tutorial';

export const troubleshootingGuide: Tutorial = {
  id: 'troubleshooting-guide',
  deviceId: 'fantom-08',
  title: 'Troubleshooting Guide',
  description:
    'Diagnose and resolve common Fantom 08 issues: no sound, wrong pitch, USB/MIDI problems, error messages, and when to factory reset. A systematic approach to fixing problems.',
  category: 'basics',
  difficulty: 'beginner',
  estimatedTime: '5 min',
  tags: ['troubleshooting', 'error-messages', 'no-sound', 'beginner'],
  steps: [
    {
      id: 'step-1',
      title: 'Introduction to Troubleshooting',
      instruction:
        'When something goes wrong with your Fantom 08, a systematic approach saves time. This guide covers the most common issues and their solutions, organized by symptom.',
      details:
        'The Fantom 08 manual documents solutions for: no sound, wrong pitch, distorted sound, USB/MIDI connection issues, sequencer problems, saving issues, and error messages. Most problems have simple fixes.',
      highlightControls: [],
      panelStateChanges: {},
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'Grand Piano',
        tempo: 120,
        beatSignature: '4/4',
      },
    },
    {
      id: 'step-2',
      title: 'No Sound — Check the Basics',
      instruction:
        'If you hear no sound, first check the MASTER VOLUME knob — turn it up. Then verify your amp/speakers are powered on and cables are connected to the MAIN OUTPUT jacks.',
      details:
        'Full no-sound checklist: (1) MASTER VOLUME up, (2) amp/speakers on and connected, (3) headphones plugged in if using them, (4) check if zones are muted in Zone View, (5) check if the zone volume or level is set too low, (6) verify the Zone Switch is set to INT (not EXT), (7) check if Local Switch is ON (Menu > SYSTEM > SOUND).',
      highlightControls: ['master-volume', 'zone-view'],
      panelStateChanges: {
        'master-volume': { active: true },
      },
      displayState: {
        screenType: 'zone-view',
        title: 'ZONE VIEW',
        zoneViewMode: 4,
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
        statusText: 'Check: volume, cables, zone mute, INT/EXT',
      },
    },
    {
      id: 'step-3',
      title: 'Sound Issues — Wrong Pitch or Tuning',
      instruction:
        'If notes sound wrong, check the Transpose and Octave settings. Press the TRANSPOSE button to see the current shift — it should be 0 for normal pitch. Also check OCTAVE UP/DOWN.',
      details:
        'Pitch problems: (1) Transpose may be set to a non-zero value, (2) Octave shift may be active, (3) The pitch bend lever or a pedal may be sending pitch bend data, (4) Check Coarse Tune, Fine Tune, and Master Tune in the Parameter Guide. Master Key Shift (Menu > SYSTEM > SOUND) shifts pitch globally.',
      highlightControls: ['transpose', 'octave-up', 'octave-down'],
      panelStateChanges: {
        'master-volume': { active: false },
        transpose: { active: true },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'Grand Piano',
        tempo: 120,
        beatSignature: '4/4',
        statusText: 'Check Transpose (should be 0) and Octave shift',
      },
      tipText:
        'If pitch sounds slightly off, check Master Tune in Menu > SYSTEM > SOUND (default: 440.0 Hz).',
    },
    {
      id: 'step-4',
      title: 'USB and MIDI Issues',
      instruction:
        'If USB or MIDI connections are not working, check the USB Driver setting in Menu > SYSTEM > GENERAL. Set it to VENDOR for the dedicated Roland driver, or GENERIC for the OS built-in driver.',
      details:
        'USB/MIDI checklist: (1) USB Driver set to VENDOR or GENERIC as needed, (2) MIDI channels match between Fantom and external devices, (3) Local Switch is ON for standalone play, OFF for DAW use to avoid double-triggering, (4) USB-MIDI Thru set to ON if you need MIDI pass-through, (5) Check Receive/Transmit settings in Menu > SYSTEM > MIDI.',
      highlightControls: ['menu'],
      panelStateChanges: {
        transpose: { active: false },
        menu: { active: true },
      },
      displayState: {
        screenType: 'system-settings',
        title: 'SYSTEM',
        activeTab: 'GENERAL',
        menuItems: [
          { label: 'Auto Off: 240min' },
          { label: 'USB Driver: VENDOR', selected: true },
          { label: 'File Verify: OFF' },
          { label: 'LCD Brightness: 20' },
          { label: 'LED Brightness: MAX' },
        ],
        selectedIndex: 1,
        statusText: 'Check USB Driver: VENDOR or GENERIC',
      },
    },
    {
      id: 'step-5',
      title: 'Common Error Messages',
      instruction:
        'The Fantom displays error messages when something goes wrong. Common ones: "USB Memory Not Ready!" (reinsert USB drive), "Storage Full!" (delete unneeded data), "Incorrect File!" (incompatible format).',
      details:
        'Key error messages: "USB Memory Not Ready!" — USB drive not inserted or removed during operation. "Storage Full!" — insufficient space, delete unneeded data. "Incorrect File!" — unsupported file format. "Data Full!" — maximum pattern notes exceeded, use Erase to clear data. "Sample Too Long!" — sampling time exceeded. "Storage Protected!" — USB drive lock is on, turn it off.',
      highlightControls: [],
      panelStateChanges: {
        menu: { active: false },
      },
      displayState: {
        screenType: 'popup',
        confirmText: 'USB Memory Not Ready!',
        popupData: { popupType: 'confirm' },
        statusText: 'Common error — reinsert USB drive and try again',
      },
      tipText:
        'For "Storage Error!", try formatting the USB drive via the Fantom (Menu > UTILITY > FORMAT).',
    },
    {
      id: 'step-6',
      title: 'When to Factory Reset',
      instruction:
        'If problems persist after checking all settings, a factory reset restores the Fantom to its original state. Important: back up your data first! See the Backup & Factory Reset tutorial for the full procedure.',
      details:
        'Factory reset erases ALL user data: scenes, tones, samples, patterns, and system settings. Always back up to USB first using File Utility (Menu > UTILITY > FILE UTILITY). After reset, you can restore your backup. Factory reset is a last resort — try the specific troubleshooting steps above first.',
      highlightControls: ['menu'],
      panelStateChanges: {
        menu: { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'UTILITY',
        menuItems: [
          { label: 'FILE UTILITY' },
          { label: 'INTERNAL STORAGE' },
          { label: 'FORMAT' },
          { label: 'FACTORY RESET', selected: true },
        ],
        selectedIndex: 3,
        statusText: 'CAUTION: Back up before factory reset!',
      },
      tipText:
        'Always back up to USB before a factory reset. See the Backup & Factory Reset tutorial.',
    },
    {
      id: 'step-7',
      title: 'Troubleshooting Complete!',
      instruction:
        'Press Exit to return to the home screen. You now have a systematic approach to diagnosing Fantom 08 issues: check volume and connections, verify settings, read error messages, and use factory reset only as a last resort.',
      details:
        'Quick diagnostic steps: (1) No sound → check volume, cables, zone mute, INT/EXT. (2) Wrong pitch → check transpose, octave, Master Tune. (3) USB/MIDI → check driver, channels, Local Switch. (4) Error messages → follow the on-screen guidance. (5) Persistent issues → back up, then factory reset.',
      highlightControls: ['exit'],
      panelStateChanges: {
        menu: { active: false },
      },
      displayState: {
        screenType: 'home',
        sceneNumber: 'A001',
        sceneName: 'Grand Piano',
        tempo: 120,
        beatSignature: '4/4',
      },
    },
  ],
};
