'use client';

import PanelRenderer from '@/components/controls/PanelRenderer';
import type { PanelManifest, PanelRendererProps } from '@/components/controls/PanelRenderer';

/**
 * Factory: wraps PanelRenderer with a static manifest JSON import.
 * Returns a component matching the DeviceRegistryEntry.PanelComponent interface.
 */
export function makePanelFromManifest(manifest: PanelManifest) {
  function ManifestPanel(props: Omit<PanelRendererProps, 'manifest'>) {
    return <PanelRenderer manifest={manifest} {...props} />;
  }
  ManifestPanel.displayName = `Panel(${manifest.deviceId})`;
  return ManifestPanel;
}
