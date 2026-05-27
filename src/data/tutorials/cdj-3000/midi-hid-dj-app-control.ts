import { Tutorial } from '@/types/tutorial';

export const midiHidDjAppControl: Tutorial = {
  id: 'midi-hid-dj-app-control',
  deviceId: 'cdj-3000',
  title: 'MIDI/HID — DJ Application Control',
  description:
    'Wire the CDJ-3000 to a PC or Mac over USB, pick a MIDI channel, switch the unit into CONTROL MODE, and drive rekordbox, Serato, Traktor, or any HID-compatible DJ software directly from the top panel.',
  category: 'integration',
  difficulty: 'intermediate',
  estimatedTime: '5 min',
  tags: [
    'midi',
    'hid',
    'control-mode',
    'dj-software',
    'rekordbox',
    'serato',
    'traktor',
    'usb',
    'intermediate',
  ],
  steps: [
    {
      id: 'step-1',
      title: 'Connect the CDJ to a PC or Mac',
      instruction:
        'Plug a USB cable from the rear-panel USB B port on the CDJ-3000 to a free USB port on your computer. To also stream audio from the computer through the unit, install the dedicated audio driver software from pioneerdj.com beforehand.',
      details:
        'The rear USB port is dedicated to PC/Mac connection — do not confuse it with the front USB slot used for storage devices. The CDJ shows up to the OS as a USB audio + MIDI / HID device. Install your DJ app and configure its audio and MIDI/HID settings before continuing.',
      highlightControls: ['USB_PORT'],
      panelStateChanges: {
        USB_PORT: { active: true },
      },
    },
    {
      id: 'step-2',
      title: 'Set the MIDI Channel',
      instruction:
        'For MIDI control software, set the MIDI channel that this unit will speak on. Press and hold MENU/UTILITY to open UTILITY, navigate to PRO DJ LINK → MIDI CHANNEL, and choose a channel from 1 to 16. HID-mode software (Serato HID, rekordbox HID, Traktor HID) does not need this — skip to the next step.',
      details:
        'Each linked CDJ should be on a different MIDI channel so the software can tell them apart. Channels 1 and 2 are common for a two-deck setup; pick higher channels for 4–6 deck rigs. The setting persists across power cycles.',
      highlightControls: ['MENU_UTILITY', 'ROTARY_SELECTOR'],
      panelStateChanges: {
        MENU_UTILITY: { active: true },
        ROTARY_SELECTOR: { active: true },
      },
      tipText:
        'For MIDI mapping in rekordbox or Traktor, channel mismatch is the most common "why does nothing trigger?" cause. Always confirm the channel on both ends matches.',
    },
    {
      id: 'step-3',
      title: 'Activate CONTROL MODE',
      instruction:
        'Close UTILITY and press the SOURCE button — the SOURCE screen lists every device and a CONTROL MODE entry for the connected computer. Touch CONTROL MODE (or highlight it with the rotary selector and press) to enable it.',
      details:
        'CONTROL MODE re-routes the top-panel controls so they send MIDI or HID messages to the computer instead of driving the unit\'s internal player. The Waveform screen is replaced by a CONTROL MODE indicator. The unit stops behaving as a stand-alone player while CONTROL MODE is on.',
      highlightControls: ['MENU_UTILITY', 'SOURCE', 'TOUCH_DISPLAY'],
      panelStateChanges: {
        MENU_UTILITY: { active: false },
        SOURCE: { active: true },
      },
    },
    {
      id: 'step-4',
      title: 'Launch the DJ Application',
      instruction:
        'With CONTROL MODE active, launch your DJ application on the PC or Mac. The unit starts communicating with the app and the top-panel jog, transport, performance, and search controls now drive the software.',
      details:
        'Some buttons cannot be remapped through MIDI/HID — for example, the SOURCE button itself, MENU/UTILITY, and SHORTCUT remain local to the unit. Refer to the URL pioneerdj.com/support/ for the full list of MIDI messages this unit sends.',
      highlightControls: ['JOG_WHEEL', 'PLAY_PAUSE', 'TEMPO_SLIDER'],
      panelStateChanges: {
        SOURCE: { active: false },
        ROTARY_SELECTOR: { active: false },
      },
    },
    {
      id: 'step-5',
      title: 'Leaving CONTROL MODE',
      instruction:
        'CONTROL MODE turns off automatically when you load a track from a different device — for example, inserting a USB stick and loading from it. To leave manually, press SOURCE and pick a different source. The unit returns to stand-alone playback.',
      details:
        'If you plan to switch between software control and stand-alone CDJ playback during a set, keep an SD card or USB stick ready — loading from it is the fastest way to exit CONTROL MODE without diving back into the SOURCE menu.',
      highlightControls: ['SOURCE'],
      panelStateChanges: {
        USB_PORT: { active: false },
      },
    },
    {
      id: 'step-6',
      title: 'You\'re a Controller Too',
      instruction:
        'The CDJ-3000 can now drive your favourite DJ application end-to-end. Use it as a master controller for laptop sets, or mix and match — one CDJ on USB stick, one in CONTROL MODE — to bridge stand-alone and software workflows in a single rig.',
      details:
        'When you go back to multi-player play, see PRO DJ LINK Setup for linking two CDJ-3000s. The MIDI CHANNEL setting is also remembered per linked player, so each unit can stay on its own channel for hybrid software/stand-alone sets.',
      highlightControls: [],
      panelStateChanges: {},
    },
  ],
};
