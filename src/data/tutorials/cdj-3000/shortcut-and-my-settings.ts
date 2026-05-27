import { Tutorial } from '@/types/tutorial';

export const shortcutAndMySettings: Tutorial = {
  id: 'shortcut-and-my-settings',
  deviceId: 'cdj-3000',
  title: 'SHORTCUT & My Settings',
  description:
    'Open the SHORTCUT screen for instant access to the player and device settings you actually change mid-set, then save your preferences to SD or USB with My Settings so any CDJ-3000 can become "your" deck in seconds.',
  category: 'configuration',
  difficulty: 'intermediate',
  estimatedTime: '6 min',
  tags: [
    'shortcut',
    'my-settings',
    'settings',
    'save-load',
    'sd-usb',
    'waveform-color',
    'intermediate',
  ],
  steps: [
    {
      id: 'step-1',
      title: 'Open the SHORTCUT Screen',
      instruction:
        'Press the SHORTCUT button. The SHORTCUT screen opens on the touch display with four areas — Player settings (top-left), Device information (top-right), Device settings (bottom-centre), and My Settings (bottom-right).',
      details:
        'SHORTCUT mirrors the most-used UTILITY items in a touch-first layout so you can change them without diving into the full UTILITY tree. Press SHORTCUT again to close the screen and return to the previous view.',
      highlightControls: ['SHORTCUT'],
      panelStateChanges: {
        SHORTCUT: { active: true },
      },
    },
    {
      id: 'step-2',
      title: 'Player Settings Area',
      instruction:
        'The top-left block holds the player items: WAVEFORM/PHASE METER (toggle between WAVEFORM and PHASE METER on the playback screen), HOT CUE AUTO LOAD (ON / settings / OFF), LCD BRIGHTNESS (1–5), JOG LCD BRIGHTNESS (1–5), QUANTIZE BEAT VALUE (1/8, 1/4, 1/2, 1), and BEAT JUMP BEAT VALUE (1/2 to 64 beats). Touch a value to set it.',
      details:
        'These items are identical to the UTILITY → DJ SETTING and DISPLAY (LCD) entries, just one tap away. WAVEFORM/PHASE METER is the only item exclusive to SHORTCUT — it picks which visualisation occupies the centre of the Waveform screen.',
      highlightControls: ['TOUCH_DISPLAY'],
      panelStateChanges: {},
      tipText:
        'Mid-set, SHORTCUT → HOT CUE AUTO LOAD OFF lets you load a track without its Hot Cues auto-firing — useful when juggling between rekordbox-prepared and unprepared tracks.',
    },
    {
      id: 'step-3',
      title: 'Device Information Area',
      instruction:
        'The top-right block shows the currently selected device with its icon and name (e.g., "Device Pioneer DJ 001"). It is read-only — its purpose is to confirm which storage device the My Settings actions on this screen will read from and write to.',
      details:
        'If you connected several devices, change which one is active by leaving the SHORTCUT screen, pressing SOURCE, picking the new device, and then re-opening SHORTCUT.',
      highlightControls: ['SOURCE'],
      panelStateChanges: {},
    },
    {
      id: 'step-4',
      title: 'Device Settings Area',
      instruction:
        'The bottom-centre block sets how this player draws the waveform: WAVEFORM COLOR (BLUE, RGB, 3 BAND) and WAVEFORM CURRENT POSITION (CENTER or LEFT). Touch a value to commit it.',
      details:
        'WAVEFORM COLOR = 3 BAND visualises the low / mid / high content separately — great for spotting drops. WAVEFORM CURRENT POSITION = LEFT shifts the playhead to the left edge, exposing more upcoming track at a glance.',
      highlightControls: ['TOUCH_DISPLAY'],
      panelStateChanges: {},
    },
    {
      id: 'step-5',
      title: 'Save My Settings to SD or USB',
      instruction:
        'With an SD card or USB stick connected and selected as the source, touch SAVE in the bottom-right MY SETTINGS area. The unit writes your UTILITY settings — plus Time display mode, Auto Cue, jog mode, tempo range, Master Tempo, Quantize, Beat Sync, and phase meter — to the device.',
      details:
        'My Settings stores only the UTILITY items flagged with "1" in the manual table on page 74, not every UTILITY entry. A track does not need to be loaded to save. Saving overwrites any previous My Settings file on that device.',
      highlightControls: ['TOUCH_DISPLAY', 'SD_SLOT', 'USB_PORT'],
      panelStateChanges: {},
      tipText:
        'Save My Settings to a small dedicated USB stick you always carry. Plug it into any CDJ-3000 in any booth and load it to recreate your preferred Quantize, jog mode, and tempo range instantly.',
    },
    {
      id: 'step-6',
      title: 'Load My Settings from SD or USB',
      instruction:
        'With a device that holds a My Settings file connected and selected, touch LOAD in the bottom-right MY SETTINGS area. The unit pulls those preferences in and applies them immediately.',
      details:
        'You cannot LOAD while a track is playing — pause first, then load. You can also LOAD from the SOURCE screen via MY SETTINGS LOAD, which is handy at the very start of the gig before you have touched anything else.',
      highlightControls: ['TOUCH_DISPLAY', 'PLAY_PAUSE'],
      panelStateChanges: {},
    },
    {
      id: 'step-7',
      title: 'Close SHORTCUT',
      instruction:
        'Press the SHORTCUT button again to close the screen. The CDJ returns to the screen you were on before.',
      details:
        'For UTILITY items not exposed in SHORTCUT (PRO DJ LINK, SYSTEM, INFO, DISPLAY (INDICATOR), and the remaining DJ SETTING entries), use MENU/UTILITY → UTILITY. The full UTILITY tutorial covers every category.',
      highlightControls: ['SHORTCUT', 'MENU_UTILITY'],
      panelStateChanges: {
        SHORTCUT: { active: false },
      },
    },
  ],
};
