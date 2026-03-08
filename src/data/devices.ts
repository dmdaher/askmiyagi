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
};

export function getDevice(deviceId: string): DeviceInfo | undefined {
  return devices[deviceId];
}

export function getAvailableDevices(): DeviceInfo[] {
  return Object.values(devices);
}
