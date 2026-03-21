#!/usr/bin/env npx tsx
/**
 * Panel Codegen — Deterministic React component generator.
 *
 * Reads manifest.json and templates.json from the pipeline output,
 * then generates production React components for a device panel.
 *
 * Usage:
 *   npx tsx scripts/panel-codegen.ts <device-id> [--dry-run] [--panel-width N] [--panel-height N]
 *
 * Output:
 *   src/components/devices/{deviceId}/{PascalName}Panel.tsx — root panel
 *   src/components/devices/{deviceId}/sections/{SectionPascal}Section.tsx — per section
 *   src/lib/devices/{deviceId}-constants.ts — panel dimensions, control IDs
 *   src/lib/deviceRegistry.ts — appended with new device entry
 */

import fs from 'fs';
import path from 'path';
import {
  MasterManifest,
  ManifestControl,
  ManifestSection,
  TemplateSpec,
  SubZone,
  subZoneControls,
  subZoneDirection,
  LayoutEngineOutput,
} from './layout-engine';
import { HARDWARE_ICONS } from '../src/lib/hardware-icons';

// ─── Constants ──────────────────────────────────────────────────────────────

const PROJECT_ROOT = path.resolve(__dirname, '..');

const DEFAULT_PANEL_WIDTH = 1200;
const DEFAULT_PANEL_HEIGHT = 800;

/**
 * Control type -> React component mapping.
 * Unknown types cause a hard error.
 */
const CONTROL_MAP: Record<string, { component: string; import: string }> = {
  button:    { component: 'PanelButton',      import: '@/components/controls/PanelButton' },
  knob:      { component: 'Knob',             import: '@/components/controls/Knob' },
  fader:     { component: 'Slider',           import: '@/components/controls/Slider' },
  slider:    { component: 'Slider',           import: '@/components/controls/Slider' },
  led:       { component: 'LEDIndicator',     import: '@/components/controls/LEDIndicator' },
  indicator: { component: 'LEDIndicator',     import: '@/components/controls/LEDIndicator' },
  wheel:     { component: 'Wheel',            import: '@/components/controls/Wheel' },
  pad:       { component: 'PadButton',        import: '@/components/controls/PadButton' },
  encoder:   { component: 'ValueDial',        import: '@/components/controls/ValueDial' },
  switch:    { component: 'Lever',            import: '@/components/controls/Lever' },
  lever:     { component: 'DirectionSwitch',  import: '@/components/controls/DirectionSwitch' },
  port:      { component: 'Port',             import: '@/components/controls/Port' },
  slot:      { component: 'Port',             import: '@/components/controls/Port' },
  screen:    { component: 'TouchDisplay',     import: '@/components/controls/TouchDisplay' },
  display:   { component: 'TouchDisplay',     import: '@/components/controls/TouchDisplay' },
};

// ─── Naming Helpers ─────────────────────────────────────────────────────────

/** Convert "cdj-3000" -> "CDJ3000" */
function deviceIdToPascal(deviceId: string): string {
  return deviceId
    .split('-')
    .map(part => part.toUpperCase())
    .join('');
}

/** Convert "browse-bar" -> "BrowseBar" */
function sectionIdToPascal(sectionId: string): string {
  return sectionId
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/** Alias for readability — constant prefix uses same transform as PascalCase */
const deviceIdToConstPrefix = deviceIdToPascal;

// ─── JSX Rendering Helpers ──────────────────────────────────────────────────

/**
 * Render a single control as JSX. Passes enriched manifest fields (buttonStyle,
 * surfaceColor, icon, hasLed, etc.) when they are present; gracefully falls
 * back to defaults when they are absent (backward-compatible with unenriched
 * manifests such as the current CDJ-3000).
 */
function renderControl(
  controlId: string,
  control: ManifestControl,
  indent: string,
  allControls?: Map<string, ManifestControl>,
): string {
  const mapping = CONTROL_MAP[control.type];
  if (!mapping) {
    throw new Error(
      `Unknown control type "${control.type}" for control "${controlId}". ` +
      `Valid types: ${Object.keys(CONTROL_MAP).join(', ')}. ` +
      `Add the type to CONTROL_MAP in panel-codegen.ts.`
    );
  }

  const label = control.verbatimLabel;

  // Resolve icon content from HARDWARE_ICONS library or use raw string
  const resolvedIcon = control.icon
    ? (HARDWARE_ICONS[control.icon] ?? control.icon)
    : undefined;

  switch (control.type) {
    case 'button': {
      // Determine variant: explicit buttonStyle takes priority, then shape-based inference
      // Map 'raised' → 'standard' since PanelButton doesn't have a 'raised' variant
      const rawStyle = control.buttonStyle;
      const variant = rawStyle === 'raised' ? 'standard'
        : rawStyle ?? (control.shape === 'circle' ? 'transport' : undefined);
      const useIcon = resolvedIcon && control.labelDisplay === 'icon-only';
      const lines: string[] = [
        `${indent}<PanelButton`,
        `${indent}  id="${controlId}"`,
        `${indent}  label="${escapeJsx(label)}"`,
      ];
      if (variant) lines.push(`${indent}  variant="${variant}"`);
      if (control.surfaceColor) lines.push(`${indent}  surfaceColor="${control.surfaceColor}"`);
      if (useIcon) lines.push(`${indent}  iconContent="${escapeJsx(resolvedIcon!)}"`);
      if (control.hasLed) lines.push(`${indent}  hasLed`);
      if (control.ledColor) lines.push(`${indent}  ledColor="${control.ledColor}"`);
      lines.push(
        `${indent}  active={getState('${controlId}').active}`,
        `${indent}  highlighted={isHighlighted('${controlId}')}`,
        `${indent}  onClick={() => onButtonClick?.('${controlId}')}`,
        `${indent}/>`,
      );
      return lines.join('\n');
    }

    case 'knob':
      return [
        `${indent}<Knob`,
        `${indent}  id="${controlId}"`,
        `${indent}  label="${escapeJsx(label)}"`,
        `${indent}  value={getState('${controlId}').value ?? 64}`,
        `${indent}  highlighted={isHighlighted('${controlId}')}`,
        `${indent}/>`,
      ].join('\n');

    case 'led':
    case 'indicator': {
      const lines: string[] = [
        `${indent}<LEDIndicator`,
        `${indent}  id="${controlId}"`,
        `${indent}  on={getState('${controlId}').ledOn ?? false}`,
      ];
      if (control.ledColor) {
        lines.push(`${indent}  color="${control.ledColor}"`);
      } else {
        lines.push(`${indent}  color={getState('${controlId}').ledColor}`);
      }
      // Note: dual-label LED variant is handled by the editor/runtime, not codegen
      lines.push(
        `${indent}  highlighted={isHighlighted('${controlId}')}`,
        `${indent}/>`,
      );
      return lines.join('\n');
    }

    case 'fader':
    case 'slider':
      return [
        `${indent}<Slider`,
        `${indent}  id="${controlId}"`,
        `${indent}  label="${escapeJsx(label)}"`,
        `${indent}  value={getState('${controlId}').value ?? 64}`,
        `${indent}  highlighted={isHighlighted('${controlId}')}`,
        `${indent}/>`,
      ].join('\n');

    case 'wheel': {
      // If another control has nestedIn pointing to this wheel, render JogWheelAssembly
      const hasNestedDisplay = allControls
        ? Array.from(allControls.values()).some(
            c => c.nestedIn === controlId && (c.type === 'screen' || c.type === 'display'),
          )
        : false;

      if (hasNestedDisplay) {
        const wheelSize = 160;
        const displaySize = 60;
        const ringColor = control.ledColor ?? undefined;
        const lines: string[] = [
          `${indent}<JogWheelAssembly`,
          `${indent}  id="${controlId}"`,
          `${indent}  label="${escapeJsx(label)}"`,
          `${indent}  wheelSize={${wheelSize}}`,
          `${indent}  displaySize={${displaySize}}`,
        ];
        if (ringColor) lines.push(`${indent}  ringColor="${ringColor}"`);
        lines.push(
          `${indent}  highlighted={isHighlighted('${controlId}')}`,
          `${indent}/>`,
        );
        return lines.join('\n');
      }

      return [
        `${indent}<Wheel`,
        `${indent}  id="${controlId}"`,
        `${indent}  label="${escapeJsx(label)}"`,
        `${indent}  highlighted={isHighlighted('${controlId}')}`,
        `${indent}/>`,
      ].join('\n');
    }

    case 'pad':
      return [
        `${indent}<PadButton`,
        `${indent}  id="${controlId}"`,
        `${indent}  label="${escapeJsx(label)}"`,
        `${indent}  active={getState('${controlId}').active}`,
        `${indent}  highlighted={isHighlighted('${controlId}')}`,
        `${indent}  onClick={() => onButtonClick?.('${controlId}')}`,
        `${indent}/>`,
      ].join('\n');

    case 'encoder': {
      const lines: string[] = [
        `${indent}<ValueDial`,
        `${indent}  id="${controlId}"`,
        `${indent}  label="${escapeJsx(label)}"`,
      ];
      if (control.encoderHasPush) lines.push(`${indent}  hasPush`);
      lines.push(
        `${indent}  highlighted={isHighlighted('${controlId}')}`,
        `${indent}/>`,
      );
      return lines.join('\n');
    }

    case 'switch':
      return [
        `${indent}<Lever`,
        `${indent}  id="${controlId}"`,
        `${indent}  label="${escapeJsx(label)}"`,
        `${indent}  highlighted={isHighlighted('${controlId}')}`,
        `${indent}/>`,
      ].join('\n');

    case 'lever': {
      const positions = control.positionLabels ?? ['FWD', 'REV', 'SLIP REV'];
      return [
        `${indent}<DirectionSwitch`,
        `${indent}  id="${controlId}"`,
        `${indent}  label="${escapeJsx(label)}"`,
        `${indent}  positions={${JSON.stringify(positions)}}`,
        `${indent}  highlighted={isHighlighted('${controlId}')}`,
        `${indent}/>`,
      ].join('\n');
    }

    case 'port':
    case 'slot':
      return [
        `${indent}<Port`,
        `${indent}  id="${controlId}"`,
        `${indent}  label="${escapeJsx(label)}"`,
        `${indent}  variant="${control.type === 'slot' ? 'sd-card' : 'usb-a'}"`,
        `${indent}  highlighted={isHighlighted('${controlId}')}`,
        `${indent}/>`,
      ].join('\n');

    case 'screen':
    case 'display': {
      // Screens nested inside a wheel are rendered by JogWheelAssembly — skip here
      if (control.nestedIn) {
        return `${indent}{/* ${controlId}: nested in ${control.nestedIn}, rendered by JogWheelAssembly */}`;
      }
      return [
        `${indent}<TouchDisplay`,
        `${indent}  id="${controlId}"`,
        `${indent}  label="${escapeJsx(label)}"`,
        `${indent}  variant="main"`,
        `${indent}  showMockContent`,
        `${indent}  width={200}`,
        `${indent}  height={120}`,
        `${indent}  highlighted={isHighlighted('${controlId}')}`,
        `${indent}/>`,
      ].join('\n');
    }

    default:
      throw new Error(`Unhandled control type "${control.type}" for "${controlId}".`);
  }
}

function escapeJsx(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\{/g, '&#123;')
    .replace(/\}/g, '&#125;');
}

// ─── Section Body Renderers ─────────────────────────────────────────────────

function renderControlsById(
  controlIds: string[],
  controlMap: Map<string, ManifestControl>,
  indent: string,
): string {
  return controlIds
    .filter(id => {
      // Skip controls with nestedIn — they are rendered by their parent control
      const ctrl = controlMap.get(id);
      return !ctrl?.nestedIn;
    })
    .map(id => {
      const ctrl = controlMap.get(id);
      if (!ctrl) {
        throw new Error(`Control "${id}" referenced in containerAssignment but not found in manifest controls.`);
      }
      return renderControl(id, ctrl, indent, controlMap);
    })
    .join('\n');
}

function renderSingleRow(
  controlIds: string[],
  controlMap: Map<string, ManifestControl>,
  sectionId: string,
): string {
  const controls = renderControlsById(controlIds, controlMap, '        ');
  return [
    `      <div data-section-id="${sectionId}" className="flex flex-row items-center gap-1">`,
    controls,
    `      </div>`,
  ].join('\n');
}

function renderSingleColumn(
  controlIds: string[],
  controlMap: Map<string, ManifestControl>,
  sectionId: string,
): string {
  const controls = renderControlsById(controlIds, controlMap, '        ');
  return [
    `      <div data-section-id="${sectionId}" className="flex flex-col items-center gap-1">`,
    controls,
    `      </div>`,
  ].join('\n');
}

function renderGridNxM(
  controlIds: string[],
  controlMap: Map<string, ManifestControl>,
  section: ManifestSection,
): string {
  const cols = section.gridCols!;
  const controls = renderControlsById(controlIds, controlMap, '        ');
  return [
    `      <div data-section-id="${section.id}" className="grid" style={{ gridTemplateColumns: 'repeat(${cols}, 1fr)', gap: '4px' }}>`,
    controls,
    `      </div>`,
  ].join('\n');
}

function renderStackedRows(
  template: TemplateSpec,
  controlMap: Map<string, ManifestControl>,
  sectionId: string,
): string {
  const assignment = template.containerAssignment;
  if (!assignment) {
    // Fallback: all controls in a single row
    const controls = renderControlsById(template.controlSlots, controlMap, '          ');
    return [
      `      <div data-section-id="${sectionId}" className="flex flex-col gap-1">`,
      `        <div className="flex flex-row gap-1 justify-center">`,
      controls,
      `        </div>`,
      `      </div>`,
    ].join('\n');
  }

  // Sort rows by key (row-0, row-1, ...)
  const rowKeys = Object.keys(assignment).sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ''), 10);
    const numB = parseInt(b.replace(/\D/g, ''), 10);
    return numA - numB;
  });

  const rows = rowKeys.map(rowKey => {
    const value = assignment[rowKey];
    const ids = Array.isArray(value) ? value : [];
    const controls = renderControlsById(ids, controlMap, '          ');
    return [
      `        <div className="flex flex-row gap-1 justify-center">`,
      controls,
      `        </div>`,
    ].join('\n');
  });

  return [
    `      <div data-section-id="${sectionId}" className="flex flex-col gap-1">`,
    ...rows,
    `      </div>`,
  ].join('\n');
}

function renderClusterBelowAnchor(
  template: TemplateSpec,
  controlMap: Map<string, ManifestControl>,
  section: ManifestSection,
): string {
  const assignment = template.containerAssignment;
  const splits = section.heightSplits ?? { cluster: 0.42, anchor: 0.52, gap: 0.06 };
  const cols = section.gridCols ?? 2;

  const anchorPct = `${(splits.anchor * 100).toFixed(0)}%`;
  const clusterPct = `${(splits.cluster * 100).toFixed(0)}%`;

  // Cluster controls
  const clusterIds = assignment?.cluster;
  const clusterControls = Array.isArray(clusterIds)
    ? renderControlsById(clusterIds, controlMap, '          ')
    : '';

  // Anchor — may be flat string[] or nested Record<string, SubZone>
  const anchorValue = assignment?.anchor;
  let anchorBody: string;

  if (!anchorValue) {
    anchorBody = '';
  } else if (Array.isArray(anchorValue)) {
    anchorBody = renderControlsById(anchorValue, controlMap, '          ');
  } else {
    // Nested sub-zones: Record<string, SubZone>
    const subZones = anchorValue as Record<string, SubZone>;
    const subZoneParts = Object.entries(subZones).map(([_subRole, sz]) => {
      const ids = subZoneControls(sz);
      const dir = subZoneDirection(sz);
      const flexDir = dir === 'row' ? 'flex-row' : 'flex-col';
      const controls = renderControlsById(ids, controlMap, '              ');
      return [
        `            <div className="flex ${flexDir} gap-1 flex-1">`,
        controls,
        `            </div>`,
      ].join('\n');
    });
    anchorBody = [
      `          <div className="flex flex-row gap-1 w-full h-full">`,
      ...subZoneParts,
      `          </div>`,
    ].join('\n');
  }

  return [
    `      <div data-section-id="${section.id}" className="flex flex-col h-full">`,
    `        <div className="flex flex-col items-center" style={{ flex: '0 0 ${anchorPct}' }}>`,
    anchorBody,
    `        </div>`,
    `        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(${cols}, 1fr)', flex: '0 0 ${clusterPct}' }}>`,
    clusterControls,
    `        </div>`,
    `      </div>`,
  ].join('\n');
}

function renderClusterAboveAnchor(
  template: TemplateSpec,
  controlMap: Map<string, ManifestControl>,
  section: ManifestSection,
): string {
  const assignment = template.containerAssignment;
  const splits = section.heightSplits ?? { cluster: 0.52, anchor: 0.42, gap: 0.06 };
  const cols = section.gridCols ?? 2;

  const clusterPct = `${(splits.cluster * 100).toFixed(0)}%`;
  const anchorPct = `${(splits.anchor * 100).toFixed(0)}%`;

  // Cluster controls
  const clusterIds = assignment?.cluster;
  const clusterControls = Array.isArray(clusterIds)
    ? renderControlsById(clusterIds, controlMap, '          ')
    : '';

  // Anchor — may be flat string[] or nested Record<string, SubZone>
  const anchorValue = assignment?.anchor;
  let anchorBody: string;

  if (!anchorValue) {
    anchorBody = '';
  } else if (Array.isArray(anchorValue)) {
    anchorBody = renderControlsById(anchorValue, controlMap, '          ');
  } else {
    // Nested sub-zones: Record<string, SubZone>
    const subZones = anchorValue as Record<string, SubZone>;
    const subZoneParts = Object.entries(subZones).map(([_subRole, sz]) => {
      const ids = subZoneControls(sz);
      const dir = subZoneDirection(sz);
      const flexDir = dir === 'row' ? 'flex-row' : 'flex-col';
      const controls = renderControlsById(ids, controlMap, '              ');
      return [
        `            <div className="flex ${flexDir} gap-1 flex-1">`,
        controls,
        `            </div>`,
      ].join('\n');
    });
    anchorBody = [
      `          <div className="flex flex-row gap-1 w-full h-full">`,
      ...subZoneParts,
      `          </div>`,
    ].join('\n');
  }

  return [
    `      <div data-section-id="${section.id}" className="flex flex-col h-full">`,
    `        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(${cols}, 1fr)', flex: '0 0 ${clusterPct}' }}>`,
    clusterControls,
    `        </div>`,
    `        <div className="flex flex-col items-center" style={{ flex: '0 0 ${anchorPct}' }}>`,
    anchorBody,
    `        </div>`,
    `      </div>`,
  ].join('\n');
}

function renderAnchorLayout(
  template: TemplateSpec,
  controlMap: Map<string, ManifestControl>,
  section: ManifestSection,
): string {
  const assignment = template.containerAssignment;
  const splits = section.heightSplits ?? { cluster: 0.3, anchor: 0.6, gap: 0.1 };

  const clusterPct = `${(splits.cluster * 100).toFixed(0)}%`;
  const anchorPct = `${(splits.anchor * 100).toFixed(0)}%`;

  const clusterIds = assignment?.cluster;
  const anchorIds = assignment?.anchor;

  const clusterControls = Array.isArray(clusterIds)
    ? renderControlsById(clusterIds, controlMap, '          ')
    : '';
  const anchorControls = Array.isArray(anchorIds)
    ? renderControlsById(anchorIds, controlMap, '          ')
    : '';

  return [
    `      <div data-section-id="${section.id}" className="flex flex-col h-full">`,
    `        <div className="flex flex-row" style={{ flex: '0 0 ${clusterPct}' }}>`,
    clusterControls,
    `        </div>`,
    `        <div className="flex flex-col items-center justify-center" style={{ flex: '0 0 ${anchorPct}' }}>`,
    anchorControls,
    `        </div>`,
    `      </div>`,
  ].join('\n');
}

function renderDualColumn(
  template: TemplateSpec,
  controlMap: Map<string, ManifestControl>,
  sectionId: string,
): string {
  const assignment = template.containerAssignment;

  const leftIds = assignment?.['left-column'];
  const rightIds = assignment?.['right-column'];

  const leftControls = Array.isArray(leftIds)
    ? renderControlsById(leftIds, controlMap, '          ')
    : '';
  const rightControls = Array.isArray(rightIds)
    ? renderControlsById(rightIds, controlMap, '          ')
    : '';

  return [
    `      <div data-section-id="${sectionId}" className="grid grid-cols-2 gap-1">`,
    `        <div className="flex flex-col gap-1">`,
    leftControls,
    `        </div>`,
    `        <div className="flex flex-col gap-1">`,
    rightControls,
    `        </div>`,
    `      </div>`,
  ].join('\n');
}

function renderTransportPair(
  template: TemplateSpec,
  controlMap: Map<string, ManifestControl>,
  section: ManifestSection,
): string {
  // Render each button with the transport variant automatically applied
  const controlJsx = template.controlSlots
    .filter(id => {
      const ctrl = controlMap.get(id);
      return !ctrl?.nestedIn;
    })
    .map(id => {
      const ctrl = controlMap.get(id);
      if (!ctrl) {
        throw new Error(`Control "${id}" referenced in transport-pair but not found in manifest controls.`);
      }
      // Force transport variant for buttons in a transport-pair section
      const transportCtrl: ManifestControl = {
        ...ctrl,
        buttonStyle: ctrl.buttonStyle ?? 'transport',
        shape: ctrl.shape ?? 'circle',
      };
      return renderControl(id, transportCtrl, '        ', controlMap);
    })
    .join('\n');

  return [
    `      <div data-section-id="${section.id}" className="flex flex-col items-center gap-4">`,
    controlJsx,
    `      </div>`,
  ].join('\n');
}

function renderSectionBody(
  template: TemplateSpec,
  section: ManifestSection,
  controlMap: Map<string, ManifestControl>,
): string {
  switch (template.archetype) {
    case 'single-row':
      return renderSingleRow(template.controlSlots, controlMap, section.id);
    case 'single-column':
      return renderSingleColumn(template.controlSlots, controlMap, section.id);
    case 'grid-NxM':
      return renderGridNxM(template.controlSlots, controlMap, section);
    case 'stacked-rows':
      return renderStackedRows(template, controlMap, section.id);
    case 'cluster-below-anchor':
      return renderClusterBelowAnchor(template, controlMap, section);
    case 'cluster-above-anchor':
      return renderClusterAboveAnchor(template, controlMap, section);
    case 'anchor-layout':
      return renderAnchorLayout(template, controlMap, section);
    case 'dual-column':
      return renderDualColumn(template, controlMap, section.id);
    case 'transport-pair':
      return renderTransportPair(template, controlMap, section);
    default:
      throw new Error(
        `Unknown archetype "${template.archetype}" for section "${section.id}". ` +
        `The layout engine should have caught this — check manifest validity.`
      );
  }
}

// ─── File Generators ────────────────────────────────────────────────────────

function collectImports(
  controls: ManifestControl[],
  allControls: Map<string, ManifestControl>,
): Map<string, string> {
  const imports = new Map<string, string>();
  for (const ctrl of controls) {
    const mapping = CONTROL_MAP[ctrl.type];
    if (!mapping) {
      throw new Error(`Unknown control type "${ctrl.type}" for control "${ctrl.id}".`);
    }
    if (mapping.import && !imports.has(mapping.component)) {
      imports.set(mapping.component, mapping.import);
    }

    // If this is a wheel that has a nested display, add JogWheelAssembly import
    if (ctrl.type === 'wheel') {
      const hasNestedDisplay = Array.from(allControls.values()).some(
        c => c.nestedIn === ctrl.id && (c.type === 'screen' || c.type === 'display'),
      );
      if (hasNestedDisplay) {
        if (!imports.has('JogWheelAssembly')) {
          imports.set('JogWheelAssembly', '@/components/controls/JogWheelAssembly');
        }
      }
    }
  }
  return imports;
}

function generateSectionFile(
  template: TemplateSpec,
  section: ManifestSection,
  sectionControls: ManifestControl[],
  allControlMap: Map<string, ManifestControl>,
  groupLabels?: Array<{ id: string; text: string; controlIds: string[]; position: string }>,
): string {
  const sectionPascal = sectionIdToPascal(section.id);
  const imports = collectImports(sectionControls, allControlMap);

  const importLines = Array.from(imports.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([component, importPath]) => `import ${component} from '${importPath}';`)
    .join('\n');

  const body = renderSectionBody(template, section, allControlMap);

  const importBlock = importLines ? `${importLines}\n` : '';

  // Check for shared labels / group labels for controls in this section
  const sectionControlIds = new Set(sectionControls.map(c => c.id));
  const relevantGroups = (groupLabels ?? []).filter(g =>
    g.controlIds.some(id => sectionControlIds.has(id)),
  );
  // Also check for sharedLabel on individual controls
  const sharedLabelGroups = new Map<string, string[]>();
  for (const ctrl of sectionControls) {
    if (ctrl.sharedLabel) {
      const existing = sharedLabelGroups.get(ctrl.sharedLabel) ?? [];
      existing.push(ctrl.id);
      sharedLabelGroups.set(ctrl.sharedLabel, existing);
    }
  }

  // Generate group label wrappers if any exist
  let groupLabelComment = '';
  if (relevantGroups.length > 0 || sharedLabelGroups.size > 0) {
    groupLabelComment = '\n  // Group labels are rendered inline within the section body\n';
  }

  return `'use client';

${importBlock}import { PanelState } from '@/types/panel';

interface ${sectionPascal}SectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function ${sectionPascal}Section({
  panelState,
  highlightedControls,
  onButtonClick,
}: ${sectionPascal}SectionProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };
${groupLabelComment}
  return (
${body}
  );
}
`;
}

function generateRootPanel(
  manifest: MasterManifest,
  sections: ManifestSection[],
  panelWidth: number,
  panelHeight: number,
): string {
  const pascalName = deviceIdToPascal(manifest.deviceId);
  const constPrefix = deviceIdToConstPrefix(manifest.deviceId);

  const sectionImports = sections
    .map(s => {
      const pascal = sectionIdToPascal(s.id);
      return `import ${pascal}Section from './sections/${pascal}Section';`;
    })
    .join('\n');

  const sectionRenderings = sections
    .map(s => {
      const pascal = sectionIdToPascal(s.id);
      const bb = s.panelBoundingBox;
      if (bb) {
        return [
          `        <div`,
          `          className="absolute"`,
          `          style={{`,
          `            left: '${bb.x}%',`,
          `            top: '${bb.y}%',`,
          `            width: '${bb.w}%',`,
          `            height: '${bb.h}%',`,
          `          }}`,
          `        >`,
          `          <${pascal}Section`,
          `            panelState={panelState}`,
          `            highlightedControls={highlightedControls}`,
          `            onButtonClick={onButtonClick}`,
          `          />`,
          `        </div>`,
        ].join('\n');
      } else {
        return [
          `        <${pascal}Section`,
          `          panelState={panelState}`,
          `          highlightedControls={highlightedControls}`,
          `          onButtonClick={onButtonClick}`,
          `        />`,
        ].join('\n');
      }
    })
    .join('\n');

  return `'use client';

import { PanelState } from '@/types/panel';
import { ${constPrefix}_PANEL } from '@/lib/devices/${manifest.deviceId}-constants';
${sectionImports}

interface ${pascalName}PanelProps {
  panelState: PanelState;
  displayState?: any;
  highlightedControls: string[];
  zones?: any[];
  onButtonClick?: (id: string) => void;
}

export default function ${pascalName}Panel({
  panelState,
  highlightedControls,
  onButtonClick,
}: ${pascalName}PanelProps) {
  return (
    <div className="w-full h-full overflow-x-auto">
      <div
        className="relative rounded-2xl overflow-hidden select-none"
        style={{
          width: ${constPrefix}_PANEL.width,
          minWidth: ${constPrefix}_PANEL.width,
          height: ${constPrefix}_PANEL.height,
          backgroundColor: '#1a1a1a',
        }}
      >
${sectionRenderings}
      </div>
    </div>
  );
}
`;
}

function generateConstants(
  manifest: MasterManifest,
  panelWidth: number,
  panelHeight: number,
): string {
  const constPrefix = deviceIdToConstPrefix(manifest.deviceId);

  const controlEntries = manifest.controls
    .map(ctrl => {
      return `  '${ctrl.id}': { type: '${ctrl.type}', section: '${ctrl.section}', label: '${escapeTs(ctrl.verbatimLabel)}' },`;
    })
    .join('\n');

  return `// ${manifest.deviceName} constants — generated by panel-codegen.ts
// Do not edit manually. Re-run: npx tsx scripts/panel-codegen.ts ${manifest.deviceId}

export const ${constPrefix}_PANEL = {
  width: ${panelWidth},
  height: ${panelHeight},
  deviceId: '${manifest.deviceId}',
  deviceName: '${escapeTs(manifest.deviceName)}',
  manufacturer: '${escapeTs(manifest.manufacturer)}',
} as const;

export const ${constPrefix}_CONTROLS = {
${controlEntries}
} as const;
`;
}

function escapeTs(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// ─── Device Registry Update ─────────────────────────────────────────────────

function updateDeviceRegistry(
  manifest: MasterManifest,
  panelWidth: number,
  panelHeight: number,
): void {
  const registryPath = path.join(PROJECT_ROOT, 'src/lib/deviceRegistry.ts');
  let content = fs.readFileSync(registryPath, 'utf-8');

  // Check if this device is already registered
  if (content.includes(`'${manifest.deviceId}'`)) {
    console.log(`  Device "${manifest.deviceId}" already in registry, skipping.`);
    return;
  }

  const pascalName = deviceIdToPascal(manifest.deviceId);

  // Add import for the panel component
  const panelImportLine = `import ${pascalName}Panel from '@/components/devices/${manifest.deviceId}/${pascalName}Panel';`;

  // Find the last import line and add after it
  const importLines = content.split('\n');
  let lastImportIdx = -1;
  for (let i = 0; i < importLines.length; i++) {
    if (importLines[i].startsWith('import ')) {
      lastImportIdx = i;
    }
  }
  if (lastImportIdx >= 0) {
    importLines.splice(lastImportIdx + 1, 0, panelImportLine);
  }
  content = importLines.join('\n');

  // Add the device entry before the closing brace of DEVICE_REGISTRY
  const registryEntry = `  '${manifest.deviceId}': {
    tutorials: [],
    PanelComponent: ${pascalName}Panel,
    dimensions: { width: ${panelWidth}, height: ${panelHeight} },
  },`;

  // Find the closing }; of DEVICE_REGISTRY and insert before it
  const closingIdx = content.lastIndexOf('};');
  if (closingIdx >= 0) {
    content = content.slice(0, closingIdx) + registryEntry + '\n' + content.slice(closingIdx);
  }

  fs.writeFileSync(registryPath, content, 'utf-8');
  console.log(`  Updated device registry: ${registryPath}`);
}

// ─── Main ───────────────────────────────────────────────────────────────────

function parseArgs(): { deviceId: string; dryRun: boolean; panelWidth: number; panelHeight: number } {
  const args = process.argv.slice(2);
  let deviceId = '';
  let dryRun = false;
  let panelWidth = DEFAULT_PANEL_WIDTH;
  let panelHeight = DEFAULT_PANEL_HEIGHT;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') {
      dryRun = true;
    } else if (args[i] === '--panel-width' && args[i + 1]) {
      panelWidth = parseInt(args[i + 1], 10);
      if (isNaN(panelWidth)) {
        console.error(`Invalid --panel-width value: ${args[i + 1]}`);
        process.exit(1);
      }
      i++;
    } else if (args[i] === '--panel-height' && args[i + 1]) {
      panelHeight = parseInt(args[i + 1], 10);
      if (isNaN(panelHeight)) {
        console.error(`Invalid --panel-height value: ${args[i + 1]}`);
        process.exit(1);
      }
      i++;
    } else if (!args[i].startsWith('--')) {
      deviceId = args[i];
    }
  }

  if (!deviceId) {
    console.error('Usage: npx tsx scripts/panel-codegen.ts <device-id> [--dry-run] [--panel-width N] [--panel-height N]');
    process.exit(1);
  }

  return { deviceId, dryRun, panelWidth, panelHeight };
}

function main() {
  const { deviceId, dryRun, panelWidth, panelHeight } = parseArgs();

  // Read manifest
  const manifestPath = path.join(PROJECT_ROOT, `.pipeline/${deviceId}/manifest.json`);
  if (!fs.existsSync(manifestPath)) {
    console.error(`Manifest not found: ${manifestPath}`);
    console.error(`Run the pipeline first: npx tsx scripts/pipeline-runner.ts ${deviceId}`);
    process.exit(1);
  }
  const manifest: MasterManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  // Read templates
  const templatesPath = path.join(PROJECT_ROOT, `.pipeline/${deviceId}/templates.json`);
  if (!fs.existsSync(templatesPath)) {
    console.error(`Templates not found: ${templatesPath}`);
    console.error(`Run the layout engine first: npx tsx scripts/layout-engine.ts ${manifestPath}`);
    process.exit(1);
  }
  const templatesOutput: LayoutEngineOutput = JSON.parse(fs.readFileSync(templatesPath, 'utf-8'));
  const templates = templatesOutput.templates;

  // Read inferred layout (from editor's Approve & Build) — overrides template archetypes
  const inferredPath = path.join(PROJECT_ROOT, `.pipeline/${deviceId}/inferred-layout.json`);
  if (fs.existsSync(inferredPath)) {
    try {
      const inferred = JSON.parse(fs.readFileSync(inferredPath, 'utf-8'));
      const inferredSections: Array<{ sectionId: string; archetype: string; parameters: { gap?: number; gridCols?: number; gridRows?: number } }> = inferred.sections ?? [];
      for (const inf of inferredSections) {
        const tmpl = templates.find(t => t.sectionId === inf.sectionId);
        if (tmpl && inf.archetype !== 'absolute') {
          console.log(`  Inference override: ${inf.sectionId} ${tmpl.archetype} → ${inf.archetype} (gap=${inf.parameters.gap ?? 'auto'})`);
          (tmpl as any).archetype = inf.archetype;
          // Update CSS architecture based on inferred archetype
          if (inf.archetype === 'single-row') {
            tmpl.cssArchitecture = {
              display: 'flex',
              properties: {
                'flex-direction': 'row',
                'align-items': 'center',
                'gap': `${inf.parameters.gap ?? 4}px`,
              },
            };
          } else if (inf.archetype === 'single-column') {
            tmpl.cssArchitecture = {
              display: 'flex',
              properties: {
                'flex-direction': 'column',
                'align-items': 'center',
                'gap': `${inf.parameters.gap ?? 4}px`,
              },
            };
          } else if (inf.archetype.startsWith('grid')) {
            const cols = inf.parameters.gridCols ?? 2;
            tmpl.cssArchitecture = {
              display: 'grid',
              properties: {
                'grid-template-columns': `repeat(${cols}, 1fr)`,
                'gap': `${inf.parameters.gap ?? 4}px`,
              },
            };
          }
        }
      }
      console.log(`  Applied ${inferredSections.length} inference overrides from inferred-layout.json`);
    } catch (e) {
      console.warn(`  Warning: Could not read inferred-layout.json: ${e}`);
    }
  }

  // Build lookup maps
  const controlMap = new Map<string, ManifestControl>();
  for (const ctrl of manifest.controls) {
    controlMap.set(ctrl.id, ctrl);
  }

  const templateMap = new Map<string, TemplateSpec>();
  for (const tmpl of templates) {
    templateMap.set(tmpl.sectionId, tmpl);
  }

  // Validate all control types before generating anything
  for (const ctrl of manifest.controls) {
    if (!CONTROL_MAP[ctrl.type]) {
      console.error(
        `FATAL: Unknown control type "${ctrl.type}" for control "${ctrl.id}". ` +
        `Valid types: ${Object.keys(CONTROL_MAP).join(', ')}`
      );
      process.exit(1);
    }
  }

  const pascalName = deviceIdToPascal(manifest.deviceId);

  // Output paths
  const deviceDir = path.join(PROJECT_ROOT, `src/components/devices/${deviceId}`);
  const sectionsDir = path.join(deviceDir, 'sections');
  const constantsPath = path.join(PROJECT_ROOT, `src/lib/devices/${deviceId}-constants.ts`);

  console.log(`\nPanel Codegen — ${manifest.deviceName} (${deviceId})`);
  console.log(`  Sections: ${manifest.sections.length}`);
  console.log(`  Controls: ${manifest.controls.length}`);
  console.log(`  Panel: ${panelWidth}x${panelHeight}`);
  console.log(`  Mode: ${dryRun ? 'DRY RUN' : 'WRITE'}\n`);

  // Generate section files
  const sectionFiles: Array<{ path: string; content: string }> = [];
  for (const section of manifest.sections) {
    const template = templateMap.get(section.id);
    if (!template) {
      console.error(`No template found for section "${section.id}". Check templates.json.`);
      process.exit(1);
    }

    const sectionControls = manifest.controls.filter(c => c.section === section.id);
    const sectionPascal = sectionIdToPascal(section.id);
    const content = generateSectionFile(template, section, sectionControls, controlMap, manifest.groupLabels);
    const filePath = path.join(sectionsDir, `${sectionPascal}Section.tsx`);

    sectionFiles.push({ path: filePath, content });
    console.log(`  Section: ${sectionPascal}Section.tsx (${sectionControls.length} controls, ${template.archetype})`);
  }

  // Generate root panel
  const rootPanelContent = generateRootPanel(manifest, manifest.sections, panelWidth, panelHeight);
  const rootPanelPath = path.join(deviceDir, `${pascalName}Panel.tsx`);
  console.log(`  Root: ${pascalName}Panel.tsx`);

  // Generate constants
  const constantsContent = generateConstants(manifest, panelWidth, panelHeight);
  console.log(`  Constants: ${deviceId}-constants.ts`);

  if (dryRun) {
    console.log('\n--- DRY RUN — no files written ---\n');
    console.log('=== ROOT PANEL ===');
    console.log(rootPanelContent);
    console.log('=== CONSTANTS ===');
    console.log(constantsContent);
    for (const sf of sectionFiles) {
      console.log(`=== ${path.basename(sf.path)} ===`);
      console.log(sf.content);
    }
    return;
  }

  // Write files
  fs.mkdirSync(sectionsDir, { recursive: true });

  for (const sf of sectionFiles) {
    fs.writeFileSync(sf.path, sf.content, 'utf-8');
  }
  fs.writeFileSync(rootPanelPath, rootPanelContent, 'utf-8');
  fs.writeFileSync(constantsPath, constantsContent, 'utf-8');

  // Update device registry
  updateDeviceRegistry(manifest, panelWidth, panelHeight);

  console.log(`\nDone. Generated ${sectionFiles.length + 2} files.`);
}

main();
