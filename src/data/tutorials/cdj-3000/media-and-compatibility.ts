import { Tutorial } from '@/types/tutorial';

export const mediaAndCompatibility: Tutorial = {
  id: 'media-and-compatibility',
  deviceId: 'cdj-3000',
  title: 'Getting Started — Media & Compatibility',
  description:
    'Learn which storage devices, file systems, and audio formats the CDJ-3000 supports, and how to safely insert and remove SD cards and USB devices.',
  category: 'getting-started',
  difficulty: 'beginner',
  estimatedTime: '4 min',
  tags: ['setup', 'media', 'sd-card', 'usb', 'file-formats', 'beginner'],
  steps: [
    {
      id: 'step-1',
      title: 'Welcome — Supported Media',
      instruction:
        'The CDJ-3000 plays audio from three kinds of sources: an SD memory card, a USB mass storage device, or a PC/Mac running rekordbox. This tutorial covers the physical media options. PC/Mac connection is covered in the PRO DJ LINK tutorial.',
      details:
        '"SD memory card" includes standard SD, SDHC, and miniSD/microSD cards used with an adapter. CPRM-protected content is not supported. Optical disc drives (DVD/CD) and USB hubs cannot be connected.',
      highlightControls: [],
      panelStateChanges: {},
    },
    {
      id: 'step-2',
      title: 'Supported File Systems',
      instruction:
        'Storage devices must be formatted as FAT16, FAT32, or HFS+. NTFS is not supported. If your device uses NTFS, reformat it before use.',
      details:
        'The unit supports a folder hierarchy up to 8 levels deep — files in deeper levels cannot be played. Up to 10,000 folders per folder and 10,000 files per folder can be displayed. Reading large libraries may take time.',
      highlightControls: [],
      panelStateChanges: {},
      tipText:
        'For best performance, prepare your media with rekordbox export rather than copying loose files manually.',
    },
    {
      id: 'step-3',
      title: 'Supported Audio Formats',
      instruction:
        'The CDJ-3000 plays MP3, AAC, WAV, AIFF, Apple Lossless (ALAC), and FLAC files. MP3 supports 32–320 kbps, AAC 16–320 kbps. WAV, AIFF, ALAC, and FLAC support 16-bit and 24-bit at 44.1, 48, 88.2, and 96 kHz.',
      details:
        'AAC extensions: .m4a, .aac, .mp4 (MPEG-4 or MPEG-2 AAC LC). FLAC extensions: .flac, .fla. Some files may not play even if their format is supported — re-encode or analyze with rekordbox if you hit issues.',
      highlightControls: [],
      panelStateChanges: {},
    },
    {
      id: 'step-4',
      title: 'Inserting an SD Memory Card',
      instruction:
        'Open the SD memory card cover above the rotary selector. Insert the card with the back side facing you and the notch facing down, then push it straight down until it stops. Close the cover.',
      details:
        'The SD memory card indicator lights when a card is detected. Never remove the card or power off the unit while the SD indicator is blinking — the card may be corrupted. Do not force the cover.',
      highlightControls: ['SD_SLOT'],
      panelStateChanges: {
        SD_SLOT: { active: true, ledOn: true },
      },
      tipText:
        'If the SD indicator never lights, double-check that the card is formatted as FAT32 or HFS+, not NTFS.',
    },
    {
      id: 'step-5',
      title: 'Removing an SD Memory Card',
      instruction:
        'Open the SD card cover and wait for the SD indicator to stop blinking. Push the card straight down to release it — the card pops out. Pull it straight out, then close the cover.',
      details:
        'When you open the cover, the SD indicator may blink briefly while the unit finishes writing management data. Wait for it to stop before removing the card to avoid corrupting your rekordbox library.',
      highlightControls: ['SD_SLOT'],
      panelStateChanges: {
        SD_SLOT: { active: false, ledOn: false },
      },
    },
    {
      id: 'step-6',
      title: 'Connecting a USB Device',
      instruction:
        'Open the USB port cover and insert your USB device at a straight angle until it stops. The USB indicator lights when the device is recognized.',
      details:
        'Only USB mass storage class devices are supported — no USB hubs, optical drives, or specialty controllers. If excessive current is drawn, the USB indicator blinks and the unit cuts power to the port to protect itself. Disconnect the device and avoid using it again.',
      highlightControls: ['USB_PORT'],
      panelStateChanges: {
        USB_PORT: { active: true, ledOn: true },
      },
    },
    {
      id: 'step-7',
      title: 'Disconnecting a USB Device',
      instruction:
        'Press and hold the USB STOP button until the USB indicator stops blinking. Then pull the USB device out at a straight angle and close the port cover.',
      details:
        'USB STOP safely unmounts the device. Never just yank a USB stick out while the indicator is on — the unit may still be writing management data, and you can lose your rekordbox library or cue point history.',
      highlightControls: ['USB_STOP', 'USB_PORT'],
      panelStateChanges: {
        USB_STOP: { active: true },
        USB_PORT: { active: false, ledOn: false },
      },
      tipText:
        'Always use USB STOP — it is the equivalent of "Eject" on a computer. Hot-pulling can corrupt the device.',
    },
    {
      id: 'step-8',
      title: 'Ready to Browse',
      instruction:
        'With media inserted, you are ready to select a source and load tracks. The next tutorial, Source Selection & Loading Tracks, walks through using the SOURCE button and rotary selector to play your first track.',
      details:
        'Pioneer recommends sticking to a few known-good SD and USB models — some consumer devices do not behave reliably. Always carry a backup with the same library before a gig.',
      highlightControls: [],
      panelStateChanges: {
        USB_STOP: { active: false },
      },
    },
  ],
};
