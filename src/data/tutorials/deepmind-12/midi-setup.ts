import { Tutorial } from '@/types/tutorial';

export const midiSetup: Tutorial = {
  id: 'midi-setup',
  deviceId: 'deepmind-12',
  title: 'MIDI, USB & Wi-Fi Connectivity',
  description:
    'Configure the DeepMind 12 for use with a DAW via physical MIDI, USB-MIDI, or Wi-Fi RTP-MIDI. Set MIDI channels, program change behaviour, and controller output format (CC or NRPN) in the Global Connectivity menu.',
  category: 'midi',
  difficulty: 'intermediate',
  estimatedTime: '10 min',
  tags: ['midi', 'usb', 'wifi', 'daw', 'rtp-midi', 'connectivity', 'nrpn', 'program-change'],
  steps: [
    {
      id: 'step-1',
      title: 'Opening Global Connectivity',
      instruction:
        'Press the GLOBAL switch (labelled PROG MENU on the panel, soft-key row). Navigate to the CONNECTIVITY page using BANK UP / BANK DOWN. The display shows: DEVICE-ID, MIDI SETTINGS, USB SETTINGS, WIFI SETTINGS, NETWORK SETTINGS, and EXPORT. This is the central hub for all external communication settings.',
      details:
        'The GLOBAL menu has several pages. The CONNECTIVITY page is where all external interface settings live. DEVICE-ID (1-16) sets the SysEx device ID for distinguishing multiple DeepMind 12 units on the same MIDI network — leave at 1 unless you have multiple units. EXPORT sends the current program or global settings as a SysEx stream to the MIDI, USB, or Wi-Fi output for backup. The three sub-menus (MIDI SETTINGS, USB SETTINGS, WIFI SETTINGS) each have their own transmit/receive controls.',
      highlightControls: ['prog-menu-global'],
      panelStateChanges: {
        'prog-menu-global': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'CONNECTIVITY',
        menuItems: [
          { label: 'DEVICE-ID               1' },
          { label: 'MIDI SETTINGS         -->' },
          { label: 'USB SETTINGS          -->' },
          { label: 'WIFI SETTINGS         -->' },
          { label: 'NETWORK SETTINGS      -->' },
          { label: 'EXPORT                -->' },
        ],
        selectedIndex: 0,
        statusText: 'GLOBAL',
      },
    },
    {
      id: 'step-2',
      title: 'Physical MIDI: Channels and Program Change',
      instruction:
        'Navigate to MIDI SETTINGS and press +/YES to enter. Set RX-CHANNEL to the MIDI channel your DAW or controller sends on (1-16, or ALL to receive on all channels). Set TX-CHANNEL to the channel the DeepMind 12 transmits on. Set PROG-CHANGE to RX-TX so the DeepMind 12 both receives and sends program change messages — this lets your DAW recall presets and also sends changes back when you switch programs on the panel.',
      details:
        'MIDI SETTINGS parameters: MIDI-CTRL (Off/Cc/NRPN — whether knob movements send controller data, and in which format), PROG-CHANGE (RX/TX/RX-TX/NONE), RX-CHANNEL (ALL or 1-16), TX-CHANNEL (1-16), SOFT-THRU (On/Off — routes incoming MIDI through to the MIDI output), MIDI>USB-THRU (On/Off — routes incoming MIDI to the USB output), MIDI>WIFI-THRU (On/Off — routes incoming MIDI to the Wi-Fi output). For standard DAW use: RX-CHANNEL=1, TX-CHANNEL=1, PROG-CHANGE=RX-TX, SOFT-THRU=Off.',
      highlightControls: ['prog-menu-global'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'MIDI SETTINGS',
        menuItems: [
          { label: 'MIDI-CTRL          Off' },
          { label: 'PROG-CHANGE      RX-TX' },
          { label: 'RX-CHANNEL           1' },
          { label: 'TX-CHANNEL           1' },
          { label: 'SOFT-THRU          Off' },
          { label: 'MIDI>USB-THRU      Off' },
          { label: 'MIDI>WIFI-THRU     Off' },
        ],
        selectedIndex: 2,
        statusText: 'MIDI SETTINGS',
      },
    },
    {
      id: 'step-3',
      title: 'Controller Output: CC vs NRPN',
      instruction:
        'In MIDI SETTINGS, navigate to MIDI-CTRL. Set it to "Cc" — now every fader, knob, and button on the panel sends a standard MIDI CC message when moved. Your DAW can record and automate these movements. Switch to "NRPN" for high-resolution 14-bit parameter control — NRPN sends two messages per change (MSB + LSB) giving 16,384 steps instead of 128. Use NRPN for smooth DAW automation of filter and envelope parameters.',
      details:
        'MIDI-CTRL Off: the panel does not send any CC or NRPN messages (the DeepMind 12 still sends note-on/off). Cc: standard 7-bit CC messages (0-127) per parameter. NRPN: Non-Registered Parameter Numbers send 14-bit resolution — ideal for fine automation of slow parameter sweeps. Most DAWs support both. Use Cc for compatibility and simplicity. Use NRPN in a professional DAW environment where you need smooth, artifact-free automation. The same setting applies to USB SETTINGS and WIFI SETTINGS independently — each interface can use a different MIDI-CTRL format.',
      highlightControls: ['prog-menu-global'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'MIDI SETTINGS',
        menuItems: [
          { label: 'MIDI-CTRL           Cc' },
          { label: 'PROG-CHANGE      RX-TX' },
          { label: 'RX-CHANNEL           1' },
          { label: 'TX-CHANNEL           1' },
          { label: 'SOFT-THRU          Off' },
          { label: 'MIDI>USB-THRU      Off' },
          { label: 'MIDI>WIFI-THRU     Off' },
        ],
        selectedIndex: 0,
        statusText: 'MIDI SETTINGS',
      },
    },
    {
      id: 'step-4',
      title: 'USB-MIDI — Class Compliant Connection',
      instruction:
        'Connect the DeepMind 12 to your computer with a standard USB cable. No driver installation is needed — it appears as a class-compliant USB-MIDI device. In the GLOBAL CONNECTIVITY menu, navigate to USB SETTINGS and configure USB-CTRL, RX-CHANNEL, and TX-CHANNEL the same way as MIDI SETTINGS. Set USB-CTRL to "Cc" to enable knob/fader automation via USB. Your DAW will see "DeepMind 12" as a MIDI input and output.',
      details:
        'USB SETTINGS mirrors the MIDI SETTINGS structure: USB-CTRL (Off/Cc/NRPN), PROG-CHANGE (RX/TX/RX-TX/NONE), RX-CHANNEL, TX-CHANNEL, SOFT-THRU, USB>MIDI-THRU, USB>WIFI-THRU. The USB connection carries both MIDI data (note-on/off, CC, NRPN, SysEx) and can optionally carry clock. You can run physical MIDI and USB simultaneously — useful for chaining another device on the MIDI port while the DeepMind 12 is connected to your DAW via USB. Class-compliant means macOS, Windows, iOS, and Linux all recognise the device without additional drivers.',
      highlightControls: ['prog-menu-global'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'USB SETTINGS',
        menuItems: [
          { label: 'USB-CTRL            Cc' },
          { label: 'PROG-CHANGE      RX-TX' },
          { label: 'RX-CHANNEL           1' },
          { label: 'TX-CHANNEL           1' },
          { label: 'SOFT-THRU          Off' },
          { label: 'USB>MIDI-THRU      Off' },
          { label: 'USB>WIFI-THRU      Off' },
        ],
        selectedIndex: 0,
        statusText: 'USB SETTINGS',
      },
    },
    {
      id: 'step-5',
      title: 'Wi-Fi RTP-MIDI Setup',
      instruction:
        'Navigate to NETWORK SETTINGS in the CONNECTIVITY page. Set MODE to "Client" to join your existing Wi-Fi network, or "Access Point" to have the DeepMind 12 broadcast its own network. Enter your network credentials, connect, and note the IP address shown. On macOS, open Audio MIDI Setup > MIDI Studio > Network and add the DeepMind 12\'s IP address. On Windows, use rtpMIDI by Tobias Erichsen to add the connection.',
      details:
        'NETWORK SETTINGS: MODE (Off/Client/Access Point). Client mode connects to an existing Wi-Fi network — the DeepMind 12 gets a DHCP IP address. Access Point mode creates a dedicated Wi-Fi network (useful in live environments without a router). Once connected, Wi-Fi RTP-MIDI works identically to USB-MIDI in terms of MIDI data. Latency is typically 1-5 ms on a local network, which is acceptable for most studio use. Wi-Fi is ideal for wireless performance or when USB ports are occupied. Configure Wi-Fi SETTINGS with WIFI-CTRL, RX-CHANNEL, and TX-CHANNEL just like MIDI/USB settings.',
      highlightControls: ['prog-menu-global'],
      panelStateChanges: {},
      displayState: {
        screenType: 'menu',
        title: 'NETWORK SETTINGS',
        menuItems: [
          { label: 'MODE            Client' },
        ],
        selectedIndex: 0,
        statusText: 'NETWORK SETTINGS',
      },
    },
    {
      id: 'step-6',
      title: 'ARP SETTINGS — Clock Source and MIDI Sync',
      instruction:
        'Press the ARP EDIT switch twice to reach page 2 (CTRL SEQUENCER), then once more to reach page 3: ARP SETTINGS. Set CLOCK to "MIDI(Auto)" or "USB(Auto)" to synchronise the DeepMind 12\'s internal tempo to an external MIDI clock from your DAW. When a MIDI clock signal is detected, the DeepMind 12 automatically switches to external sync and the ARP RATE fader becomes inactive. Set TRANSMIT-CLK to On if you want the DeepMind 12 to be the master clock source.',
      details:
        'ARP SETTINGS: CLOCK (Internal — uses the ARP RATE fader BPM; MIDI(Auto) — locks to incoming MIDI clock on the MIDI port if present, falls back to internal if not; USB(Auto) — locks to incoming USB MIDI clock). TRANSMIT-CLK (On/Off) — when On and CLOCK=Internal, the DeepMind 12 sends MIDI clock on all active outputs (MIDI, USB, Wi-Fi). ARP-TO-MIDI (On/Off) — sends arpeggiated note output to MIDI, allowing another synth to follow the arpeggio pattern. ARP-PARAMS (PROGRAM/GLOBAL) — whether arpeggiator settings (rate, mode, OCT) save per-program or are global across all programs.',
      highlightControls: ['arp-edit', 'arp-rate'],
      panelStateChanges: {
        'prog-menu-global': { active: false },
        'arp-edit': { active: true },
        'arp-rate': { active: true },
      },
      displayState: {
        screenType: 'menu',
        title: 'ARP SETTINGS',
        menuItems: [
          { label: 'CLOCK       MIDI(Auto)' },
          { label: 'TRANSMIT-CLK      Off' },
          { label: 'ARP-TO-MIDI       Off' },
          { label: 'ARP-PARAMS    Program' },
        ],
        selectedIndex: 0,
        statusText: 'ARP SETTINGS',
      },
    },
    {
      id: 'step-7',
      title: 'DAW Template — Putting It All Together',
      instruction:
        'In your DAW, create a MIDI track with the DeepMind 12 as the output device. Record-enable the track and play the keyboard — notes appear in the DAW. Move a fader or knob on the DeepMind 12 — CC messages arrive in the DAW automation lane. Send a program change from the DAW to recall a preset. Send MIDI clock from the DAW — the Arpeggiator locks to the session tempo. You now have full bidirectional MIDI integration.',
      details:
        'Full DAW integration checklist: (1) MIDI or USB cable connected. (2) USB-CTRL or MIDI-CTRL set to Cc. (3) RX-CHANNEL and TX-CHANNEL set to your DAW MIDI channel. (4) PROG-CHANGE set to RX-TX. (5) CLOCK set to MIDI(Auto) or USB(Auto). (6) In your DAW, set the MIDI output to "DeepMind 12" and the MIDI input to "DeepMind 12". (7) Enable MIDI clock send in your DAW. The DeepMind 12 manual chapter 12 (p.127) provides a complete reference for all MIDI CC numbers and NRPN parameter addresses for automation mapping in your DAW.',
      highlightControls: ['prog-menu-global', 'arp-rate', 'prog-menu-mod'],
      panelStateChanges: {
        'arp-edit': { active: false },
        'arp-rate': { active: false },
      },
      displayState: {
        screenType: 'home',
        statusText: 'A-1  Default Program',
        selectedIndex: 0,
      },
      tipText:
        'Tip: Download the Behringer DeepMind 12 DAW MIDI template from the Behringer website — it includes pre-mapped CC lanes for all 130+ parameters, so you can start automating immediately without manual CC assignment.',
    },
  ],
};
