import { Tutorial } from '@/types/tutorial';

export const savingPrograms: Tutorial = {
  id: 'saving-programs',
  deviceId: 'deepmind-12',
  title: 'Writing & Saving Programs',
  description:
    'Learn how to write a program to any bank location, choose its category, rename it, and recover unsaved edits using the built-in backup memory.',
  category: 'presets',
  difficulty: 'beginner',
  estimatedTime: '8 min',
  tags: ['saving', 'write', 'programs', 'backup', 'categories', 'naming', 'beginner'],
  steps: [
    {
      id: 'step-1',
      title: 'The Asterisk Warning',
      instruction:
        'Whenever you edit a program, the display shows an asterisk (*) before the program name — for example "*Brass Pad BC". This is your reminder that unsaved changes exist. Press WRITE at any time to save, or change programs and risk losing your edits.',
      details:
        'All edits are stored in a temporary "Editing Memory". If you select a different program before pressing WRITE, the asterisk disappears and a pop-up will prompt you to press COMPARE to restore the edits. This backup survives program changes but is overwritten the moment you start editing the next program.',
      highlightControls: ['display', 'prog-menu-write'],
      panelStateChanges: {
        'prog-menu-prog': { active: true, ledOn: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'A-36  *Brass Pad BC',
        selectedIndex: 36,
      },
    },
    {
      id: 'step-2',
      title: 'Opening the Write Menu',
      instruction:
        'Press the WRITE switch to open the WRITE PROGRAM menu. The menu shows three sections: the target bank and program number (where the program will be saved), the category, and the name "TO BE REPLACED BY".',
      details:
        'The WRITE PROGRAM menu has three navigable sections. Use -/NO or +/YES to move between sections. The currently selected section is highlighted in inverse (white on black). The menu also shows three shortcut assignments at the bottom: WRITE = Confirm, COMPARE = Listen, PROG = Cancel.',
      highlightControls: ['prog-menu-write'],
      panelStateChanges: {
        'prog-menu-write': { active: true, ledOn: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'WRITE PROGRAM',
        menuItems: [
          { label: 'A-36  Brass Pad BC' },
          { label: 'category:POLY' },
          { label: 'TO BE REPLACED BY' },
          { label: 'A-36  Brass Pad BC' },
          { label: '' },
          { label: 'WRITE:    Confirm' },
          { label: 'COMPARE:  Listen' },
          { label: 'PROG:     Cancel' },
        ],
        selectedIndex: 0,
        statusText: 'a-A-0    DEL',
      },
    },
    {
      id: 'step-3',
      title: 'Choosing the Save Location',
      instruction:
        'The first section is the bank and program number where the program will be written. Use BANK/UP, BANK/DOWN, the rotary encoder, or the DATA ENTRY fader to select the target bank (A-H) and program number (1-128). Be careful not to overwrite a program you want to keep.',
      details:
        'By default, the write location matches the current program location. Change the bank using BANK/UP or BANK/DOWN. Use the rotary encoder or DATA ENTRY fader to select the program number (1-128). The program currently at that location is shown as the "TO BE REPLACED BY" name in section 3.',
      highlightControls: ['prog-bank-up', 'prog-bank-down', 'prog-rotary', 'prog-data-entry'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'WRITE PROGRAM',
        menuItems: [
          { label: 'E-37  Influx Pad KA' },
          { label: 'category:AMBIENT' },
          { label: 'TO BE REPLACED BY' },
          { label: 'A-37  Influx Pad KA' },
          { label: '' },
          { label: 'WRITE:    Confirm' },
          { label: 'COMPARE:  Listen' },
          { label: 'PROG:     Cancel' },
        ],
        selectedIndex: 0,
        statusText: 'a-A-0    DEL',
      },
    },
    {
      id: 'step-4',
      title: 'Selecting the Category',
      instruction:
        'Press +/YES to move to the CATEGORY section (second section). Use BANK/UP, BANK/DOWN, the rotary encoder, or the DATA ENTRY fader to cycle through all 14 available categories and choose the one that best describes your sound.',
      details:
        'The 14 categories are: NONE, BASS, PAD, LEAD, MONO, POLY, STAB, SFX, ARP, SEQ, PERC, AMBIENT, MODULAR, and USER-1/4. Assigning the correct category makes it much easier to find your program when browsing by category later. The category is shown in the top-left of the PROG display below the bank/number.',
      highlightControls: ['prog-nav-yes', 'prog-rotary', 'prog-data-entry'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'WRITE PROGRAM',
        menuItems: [
          { label: 'E-37  Influx Pad KA' },
          { label: 'category:PAD' },
          { label: 'TO BE REPLACED BY' },
          { label: 'A-37  Influx Pad KA' },
          { label: '' },
          { label: 'WRITE:    Confirm' },
          { label: 'COMPARE:  Listen' },
          { label: 'PROG:     Cancel' },
        ],
        selectedIndex: 1,
        statusText: 'a-A-0    DEL',
      },
    },
    {
      id: 'step-5',
      title: 'Naming the Program',
      instruction:
        'Press +/YES again to move to the program NAME section ("TO BE REPLACED BY"). Use -/NO or +/YES to step through the characters of the name. Use BANK/UP, BANK/DOWN, the rotary encoder, or DATA ENTRY fader to change the selected character.',
      details:
        'Two shortcuts appear at the bottom of the display while editing the name: "a-A-0" (press FX to cycle between lower-case, upper-case, and numbers/special characters) and "DEL" (press GLOBAL to delete the currently selected character). Programs can have names up to 16 characters long.',
      highlightControls: ['prog-menu-fx', 'prog-menu-global', 'prog-nav-no', 'prog-nav-yes', 'prog-rotary'],
      panelStateChanges: {
        'prog-menu-fx': { active: true, ledOn: true },
        'prog-menu-global': { active: true, ledOn: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'WRITE PROGRAM',
        menuItems: [
          { label: 'E-37  Influx Pad KA' },
          { label: 'category:PAD' },
          { label: 'TO BE REPLACED BY' },
          { label: 'My New Pad_' },
          { label: '' },
          { label: 'WRITE:    Confirm' },
          { label: 'COMPARE:  Listen' },
          { label: 'PROG:     Cancel' },
        ],
        selectedIndex: 2,
        statusText: 'a-A-0    DEL',
      },
    },
    {
      id: 'step-6',
      title: 'Listening Before Writing',
      instruction:
        'Before confirming, press COMPARE to audition the program currently at the write destination. This lets you hear what you would be overwriting. Press COMPARE again to return to your edited program and continue reviewing the save options.',
      details:
        'The COMPARE shortcut in the WRITE menu toggles between the current edited program and the program already stored at the write destination. If there is a program in backup memory (an unsaved edit), the label will read "COMPARE: Clear Backup" — press COMPARE once to clear the backup first, then it reverts to "COMPARE: Listen".',
      highlightControls: ['prog-menu-compare'],
      panelStateChanges: {
        'prog-menu-fx': { active: false, ledOn: false },
        'prog-menu-global': { active: false, ledOn: false },
        'prog-menu-compare': { active: true, ledOn: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'WRITE PROGRAM',
        menuItems: [
          { label: 'E-37  Influx Pad KA' },
          { label: 'category:PAD' },
          { label: 'TO BE REPLACED BY' },
          { label: 'My New Pad' },
          { label: '' },
          { label: 'WRITE:    Confirm' },
          { label: 'COMPARE:  Listen' },
          { label: 'PROG:     Cancel' },
        ],
        selectedIndex: 2,
        statusText: 'Listening to destination...',
      },
    },
    {
      id: 'step-7',
      title: 'Confirming the Write',
      instruction:
        'When you are happy with the location, category, and name, press WRITE to confirm and save the program. The program is immediately written to EEPROM memory and will survive power cycles. The asterisk disappears from the program name.',
      details:
        'Pressing PROG at any point in the WRITE PROGRAM menu cancels the operation and returns you to the main PROG display with no changes saved. Once written, the program is stored permanently in EEPROM — it will be there the next time you power on the DeepMind 12.',
      highlightControls: ['prog-menu-write'],
      panelStateChanges: {
        'prog-menu-compare': { active: false, ledOn: false },
        'prog-menu-write': { active: true, ledOn: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'E-37  My New Pad',
        selectedIndex: 37,
      },
      tipText: 'Tip: Get into the habit of pressing WRITE as soon as you find a sound you like — the asterisk (*) is your warning that your work is not yet saved.',
    },
    {
      id: 'step-8',
      title: 'Recovering Unsaved Edits',
      instruction:
        'If you accidentally changed programs before saving, do not panic. The DeepMind 12 automatically stores a backup of your last edit. When you change programs, a pop-up appears saying "BackUp Saved... Press COMPARE to reStore editS". Press COMPARE to restore your work.',
      details:
        'After pressing COMPARE, a second pop-up confirms "BackUp Restored... Press WRITE to Save editS" and your edited program is back in Editing Memory with the asterisk visible. From here, press WRITE to proceed to the WRITE PROGRAM menu and save your recovered program. If there is already a backup in memory, the WRITE menu shows "COMPARE: Clear Backup" instead of "COMPARE: Listen".',
      highlightControls: ['prog-menu-compare', 'prog-menu-write'],
      panelStateChanges: {
        'prog-menu-write': { active: false, ledOn: false },
        'prog-menu-compare': { active: true, ledOn: true },
      },
      displayState: {
        screenType: 'home',
        statusText: 'A-41  *Nice Pad KA',
        selectedIndex: 41,
      },
      tipText: 'Tip: The backup is overwritten as soon as you start editing a new program — so restore it before making any further changes.',
    },
  ],
};
