// Device Registry — single touchpoint for adding new instruments
// To add a new device: add one entry to DEVICE_REGISTRY below.

import { Tutorial } from '@/types/tutorial';
import { fantom08Tutorials } from '@/data/tutorials/fantom-08';
import { rc505mk2Tutorials } from '@/data/tutorials/rc505-mk2';
import { deepmind12Tutorials } from '@/data/tutorials/deepmind-12';
import { cdj3000Tutorials } from '@/data/tutorials/cdj-3000';
import FantomPanel from '@/components/devices/fantom-08/FantomPanel';
import RC505Panel from '@/components/devices/rc505-mk2/RC505Panel';
import CDJ3000Panel from '@/components/devices/cdj-3000/CDJ3000Panel';
import { makePanelFromManifest } from '@/lib/makePanelFromManifest';
import fantom06Manifest from '@/data/manifests/fantom-06.json';
import deepmind12Manifest from '@/data/manifests/deepmind-12.json';

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
  // Migrated 2026-05-10 from handcrafted DeepMindPanel to manifest-driven
  // rendering. The handcrafted panel had ~80% control-ID drift vs the manifest;
  // contractor edits in the editor never reached production. Now the editor →
  // manifest → production loop is closed. Tutorials cleared pending regeneration
  // against current manifest IDs.
  'deepmind-12': {
    tutorials: deepmind12Tutorials,
    PanelComponent: makePanelFromManifest(deepmind12Manifest as any),
    dimensions: { width: deepmind12Manifest.panelWidth, height: deepmind12Manifest.panelHeight },
  },
  'cdj-3000': {
    tutorials: cdj3000Tutorials,
    PanelComponent: CDJ3000Panel,
    dimensions: { width: 1200, height: 1650 },
  },
  'fantom-06': {
    tutorials: [],
    PanelComponent: makePanelFromManifest(fantom06Manifest as any),
    dimensions: { width: fantom06Manifest.panelWidth, height: fantom06Manifest.panelHeight },
  },
};
