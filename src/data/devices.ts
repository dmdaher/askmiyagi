import { DeviceInfo, DeviceRegistry } from '@/types/device';

export const devices: DeviceRegistry = {
  'fantom-08': {
    id: 'fantom-08',
    name: 'Roland Fantom 08',
    manufacturer: 'Roland',
    description: 'Premium 88-key synthesizer workstation with ZEN-Core sound engine, powerful sequencer, and deep sound design capabilities.',
    available: true,
    categories: ['basics', 'zones-splits', 'sound-design', 'effects', 'midi', 'performance', 'sequencer'],
  },
  'rc505-mk2': {
    id: 'rc505-mk2',
    name: 'Boss RC-505 MK2',
    manufacturer: 'Boss',
    description: 'Professional tabletop loop station with 5 tracks, powerful effects, and advanced rhythm features for live performance.',
    available: false,
    categories: ['basics', 'effects', 'performance', 'midi'],
  },
  'deepmind-12': {
    id: 'deepmind-12',
    // `name` must match the curated production manifest's `deviceName`
    // (`src/data/manifests/deepmind-12.json`). The downgrade detector in
    // `exportManifest` aborts when the registry's value would silently
    // rename a non-empty prior production value.
    name: 'DeepMind 12',
    manufacturer: 'Behringer',
    description: '12-voice analog polyphonic synthesizer with dual oscillators, VCF, three envelopes, two LFOs, built-in effects, and 49-key keyboard.',
    available: false,
    categories: ['basics', 'synthesis', 'modulation', 'effects', 'presets'],
  },
  'dj-xdj-rx3': {
    id: 'dj-xdj-rx3',
    // Metadata-only fallback entry. `available: false` keeps this off the
    // homepage. Exists so `exportManifest`'s fallback chain finds a tracked
    // deviceName/manufacturer source instead of falling through to deviceId.
    name: 'XDJ-RX3',
    manufacturer: 'Pioneer DJ',
    description: 'All-in-one DJ system with dual decks, 4-channel mixer, and 10.1-inch touchscreen.',
    available: false,
    categories: ['basics'],
  },
  'dj-djs-1000': {
    id: 'dj-djs-1000',
    // Metadata-only fallback entry — see dj-xdj-rx3 above.
    name: 'DJ DJS-1000',
    manufacturer: 'Pioneer',
    description: 'Standalone DJ sampler with 16 performance pads, step sequencer, and 7-inch touchscreen.',
    available: false,
    categories: ['basics'],
  },
};

export function getDevice(deviceId: string): DeviceInfo | undefined {
  return devices[deviceId];
}

export function getAvailableDevices(): DeviceInfo[] {
  return Object.values(devices);
}
