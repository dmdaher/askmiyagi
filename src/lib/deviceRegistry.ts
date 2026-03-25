// Device Registry — single touchpoint for adding new instruments
// To add a new device: add one entry to DEVICE_REGISTRY below.

import { Tutorial } from '@/types/tutorial';
import { fantom08Tutorials } from '@/data/tutorials/fantom-08';
import { rc505mk2Tutorials } from '@/data/tutorials/rc505-mk2';
import { deepmind12Tutorials } from '@/data/tutorials/deepmind-12';
import FantomPanel from '@/components/devices/fantom-08/FantomPanel';
import RC505Panel from '@/components/devices/rc505-mk2/RC505Panel';
import DeepMindPanel from '@/components/devices/deepmind-12/DeepMindPanel';
import CDJ3000Panel from '@/components/devices/cdj-3000/CDJ3000Panel';
import FANTOM06Panel from '@/components/devices/fantom-06/FANTOM06Panel';

interface DeviceRegistryEntry {
  tutorials: Tutorial[];
  PanelComponent: React.ComponentType<any>;
  dimensions: { width: number; height: number };
}

export const DEVICE_REGISTRY: Record<string, DeviceRegistryEntry> = {
  'fantom-08': {
    tutorials: fantom08Tutorials,
    PanelComponent: FantomPanel,
    dimensions: { width: 2700, height: 580 },
  },
  'rc505-mk2': {
    tutorials: rc505mk2Tutorials,
    PanelComponent: RC505Panel,
    dimensions: { width: 1200, height: 600 },
  },
  'deepmind-12': {
    tutorials: deepmind12Tutorials,
    PanelComponent: DeepMindPanel,
    dimensions: { width: 2200, height: 580 },
  },
  'cdj-3000': {
    tutorials: [],
    PanelComponent: CDJ3000Panel,
    dimensions: { width: 1200, height: 1650 },
  },
  'fantom-06': {
    tutorials: [],
    PanelComponent: FANTOM06Panel,
    dimensions: { width: 1200, height: 1650 },
  },
};
