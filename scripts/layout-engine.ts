#!/usr/bin/env npx tsx
/**
 * Layout Engine — Deterministic template generator.
 *
 * Takes a Master Manifest JSON (from the Gatekeeper) and produces
 * section template specifications (CSS architecture, component structure).
 *
 * This is a DETERMINISTIC script — no LLM, no interpretation, no smoothing.
 * It maps archetype selections to CSS patterns via a fixed lookup table.
 * Unknown archetypes cause a hard error (force developer to define the pattern).
 *
 * Usage:
 *   npx tsx scripts/layout-engine.ts <manifest-path> [--output <output-path>]
 *   npx tsx scripts/layout-engine.ts --stdin [--output <output-path>]
 *
 * The manifest JSON must conform to the MasterManifest interface below.
 */

import fs from 'fs';
import path from 'path';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ManifestControl {
  id: string;
  verbatimLabel: string;
  type: 'button' | 'knob' | 'slider' | 'switch' | 'led' | 'screen' | 'encoder' | 'wheel' | 'pad' | 'fader';
  section: string;
  functionalGroup: string;
  spatialNeighbors: {
    above: string | null;
    below: string | null;
    left: string | null;
    right: string | null;
  };
}

export interface ManifestSection {
  id: string;
  headerLabel: string | null;
  archetype: LayoutArchetype;
  /** Grid dimensions — required for grid-NxM archetype */
  gridRows?: number;
  gridCols?: number;
  /** Controls in this section, ordered top-to-bottom, left-to-right */
  controls: string[];
  /** Proportional height splits for anchor-layout and cluster-above-anchor */
  heightSplits?: {
    cluster: number;
    anchor: number;
    gap: number;
  };
  /** Target width as percentage of total panel width */
  widthPercent: number;
  /** Complexity flag from gatekeeper */
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface SharedElement {
  id: string;
  spans: string[];
  expectedInstanceCount: number;
  position: string;
}

export interface MasterManifest {
  deviceId: string;
  deviceName: string;
  manufacturer: string;
  layoutType: 'uniform-row' | 'grid' | 'asymmetric';
  densityTargets: {
    vertical: string;
    horizontal: string;
    horizontalDeadSpaceMax: number;
  };
  sections: ManifestSection[];
  controls: ManifestControl[];
  sharedElements: SharedElement[];
  alignmentAnchors: Array<{
    sourceId: string;
    targetId: string;
    axis: 'x' | 'y';
    tolerancePx: number;
  }>;
}

// ─── Archetype System ───────────────────────────────────────────────────────

/**
 * Layout archetypes — the ONLY valid archetype values.
 * The Gatekeeper can ONLY select from this list.
 * Adding a new archetype requires updating this type AND the ARCHETYPE_CSS map.
 */
export type LayoutArchetype =
  | 'grid-NxM'
  | 'single-column'
  | 'single-row'
  | 'anchor-layout'
  | 'cluster-above-anchor'
  | 'cluster-below-anchor'
  | 'dual-column'
  | 'stacked-rows';

export interface TemplateSpec {
  sectionId: string;
  archetype: LayoutArchetype;
  cssArchitecture: {
    display: string;
    properties: Record<string, string>;
    childContainers?: Array<{
      role: string;
      display: string;
      properties: Record<string, string>;
      children: string[];
    }>;
  };
  componentStructure: string;
  controlSlots: string[];
  notes: string[];
}

/**
 * Archetype → CSS architecture mapping.
 * This is the core lookup table. Each archetype maps to a deterministic CSS pattern.
 *
 * NO INTERPRETATION. NO SMOOTHING. Pure switch statement.
 */
function generateTemplate(section: ManifestSection, controls: ManifestControl[]): TemplateSpec {
  const sectionControls = controls.filter(c => c.section === section.id);

  switch (section.archetype) {
    case 'grid-NxM': {
      const rows = section.gridRows;
      const cols = section.gridCols;
      if (!rows || !cols) {
        throw new LayoutEngineError(
          section.id,
          section.archetype,
          'grid-NxM archetype requires gridRows and gridCols in manifest'
        );
      }
      return {
        sectionId: section.id,
        archetype: section.archetype,
        cssArchitecture: {
          display: 'grid',
          properties: {
            'grid-template-columns': `repeat(${cols}, 1fr)`,
            'grid-template-rows': `repeat(${rows}, 1fr)`,
            'gap': '4px',
          },
        },
        componentStructure: `<div data-section-id="${section.id}" className="grid grid-cols-${cols} grid-rows-${rows} gap-1">{/* ${rows * cols} cells */}</div>`,
        controlSlots: section.controls,
        notes: [
          `${rows}x${cols} grid — ${sectionControls.length} controls in ${rows * cols} cells`,
          rows * cols > sectionControls.length
            ? `${rows * cols - sectionControls.length} empty cell(s) expected`
            : '',
        ].filter(Boolean),
      };
    }

    case 'single-column': {
      return {
        sectionId: section.id,
        archetype: section.archetype,
        cssArchitecture: {
          display: 'flex',
          properties: {
            'flex-direction': 'column',
            'align-items': 'center',
            'gap': '4px',
          },
        },
        componentStructure: `<div data-section-id="${section.id}" className="flex flex-col items-center gap-1">{/* ${sectionControls.length} controls stacked vertically */}</div>`,
        controlSlots: section.controls,
        notes: [`Single column — ${sectionControls.length} controls stacked vertically`],
      };
    }

    case 'single-row': {
      return {
        sectionId: section.id,
        archetype: section.archetype,
        cssArchitecture: {
          display: 'flex',
          properties: {
            'flex-direction': 'row',
            'align-items': 'center',
            'gap': '4px',
          },
        },
        componentStructure: `<div data-section-id="${section.id}" className="flex flex-row items-center gap-1">{/* ${sectionControls.length} controls in a horizontal row */}</div>`,
        controlSlots: section.controls,
        notes: [`Single row — ${sectionControls.length} controls in a horizontal line`],
      };
    }

    case 'anchor-layout': {
      const splits = section.heightSplits ?? { cluster: 0.3, anchor: 0.6, gap: 0.1 };
      return {
        sectionId: section.id,
        archetype: section.archetype,
        cssArchitecture: {
          display: 'flex',
          properties: {
            'flex-direction': 'column',
            'height': '100%',
          },
          childContainers: [
            {
              role: 'secondary-controls',
              display: 'flex',
              properties: {
                'flex-direction': 'row',
                'flex': `0 0 ${(splits.cluster * 100).toFixed(0)}%`,
                'gap': '4px',
              },
              children: [], // Populated by panel builder from manifest order
            },
            {
              role: 'anchor-element',
              display: 'flex',
              properties: {
                'flex-direction': 'column',
                'flex': `0 0 ${(splits.anchor * 100).toFixed(0)}%`,
                'align-items': 'center',
                'justify-content': 'center',
              },
              children: [], // The dominant anchor control
            },
          ],
        },
        componentStructure: [
          `<div data-section-id="${section.id}" className="flex flex-col h-full">`,
          `  <div className="flex flex-row" style={{ flex: '0 0 ${(splits.cluster * 100).toFixed(0)}%' }}>{/* secondary controls */}</div>`,
          `  <div className="flex flex-col items-center justify-center" style={{ flex: '0 0 ${(splits.anchor * 100).toFixed(0)}%' }}>{/* anchor element */}</div>`,
          `</div>`,
        ].join('\n'),
        controlSlots: section.controls,
        notes: [
          `Anchor layout — dominant element gets ${(splits.anchor * 100).toFixed(0)}% height`,
          `Secondary controls get ${(splits.cluster * 100).toFixed(0)}% height`,
          `Gap: ${(splits.gap * 100).toFixed(0)}%`,
        ],
      };
    }

    case 'cluster-above-anchor': {
      const splits = section.heightSplits ?? { cluster: 0.52, anchor: 0.42, gap: 0.06 };
      const rows = section.gridRows ?? 2;
      const cols = section.gridCols ?? 2;
      return {
        sectionId: section.id,
        archetype: section.archetype,
        cssArchitecture: {
          display: 'flex',
          properties: {
            'flex-direction': 'column',
            'height': '100%',
          },
          childContainers: [
            {
              role: 'cluster',
              display: 'grid',
              properties: {
                'grid-template-columns': `repeat(${cols}, 1fr)`,
                'grid-template-rows': `repeat(${rows}, 1fr)`,
                'gap': '4px',
                'flex': `0 0 ${(splits.cluster * 100).toFixed(0)}%`,
              },
              children: [], // Grid of controls
            },
            {
              role: 'anchor',
              display: 'flex',
              properties: {
                'flex-direction': 'column',
                'flex': `0 0 ${(splits.anchor * 100).toFixed(0)}%`,
                'align-items': 'center',
              },
              children: [], // Fader/large element
            },
          ],
        },
        componentStructure: [
          `<div data-section-id="${section.id}" className="flex flex-col h-full">`,
          `  <div className="grid grid-cols-${cols} grid-rows-${rows} gap-1" style={{ flex: '0 0 ${(splits.cluster * 100).toFixed(0)}%' }}>{/* cluster */}</div>`,
          `  <div className="flex flex-col items-center" style={{ flex: '0 0 ${(splits.anchor * 100).toFixed(0)}%' }}>{/* anchor (fader) */}</div>`,
          `</div>`,
        ].join('\n'),
        controlSlots: section.controls,
        notes: [
          `Cluster-above-anchor — grid cluster (${rows}x${cols}) above fixed-height anchor`,
          `Cluster: ${(splits.cluster * 100).toFixed(0)}% | Anchor: ${(splits.anchor * 100).toFixed(0)}% | Gap: ${(splits.gap * 100).toFixed(0)}%`,
        ],
      };
    }

    case 'cluster-below-anchor': {
      const splits = section.heightSplits ?? { cluster: 0.42, anchor: 0.52, gap: 0.06 };
      const rows = section.gridRows ?? 2;
      const cols = section.gridCols ?? 2;
      return {
        sectionId: section.id,
        archetype: section.archetype,
        cssArchitecture: {
          display: 'flex',
          properties: {
            'flex-direction': 'column',
            'height': '100%',
          },
          childContainers: [
            {
              role: 'anchor',
              display: 'flex',
              properties: {
                'flex-direction': 'column',
                'flex': `0 0 ${(splits.anchor * 100).toFixed(0)}%`,
                'align-items': 'center',
              },
              children: [],
            },
            {
              role: 'cluster',
              display: 'grid',
              properties: {
                'grid-template-columns': `repeat(${cols}, 1fr)`,
                'grid-template-rows': `repeat(${rows}, 1fr)`,
                'gap': '4px',
                'flex': `0 0 ${(splits.cluster * 100).toFixed(0)}%`,
              },
              children: [],
            },
          ],
        },
        componentStructure: [
          `<div data-section-id="${section.id}" className="flex flex-col h-full">`,
          `  <div className="flex flex-col items-center" style={{ flex: '0 0 ${(splits.anchor * 100).toFixed(0)}%' }}>{/* anchor */}</div>`,
          `  <div className="grid grid-cols-${cols} grid-rows-${rows} gap-1" style={{ flex: '0 0 ${(splits.cluster * 100).toFixed(0)}%' }}>{/* cluster */}</div>`,
          `</div>`,
        ].join('\n'),
        controlSlots: section.controls,
        notes: [
          `Cluster-below-anchor — anchor element above grid cluster (${rows}x${cols})`,
          `Anchor: ${(splits.anchor * 100).toFixed(0)}% | Cluster: ${(splits.cluster * 100).toFixed(0)}% | Gap: ${(splits.gap * 100).toFixed(0)}%`,
        ],
      };
    }

    case 'dual-column': {
      return {
        sectionId: section.id,
        archetype: section.archetype,
        cssArchitecture: {
          display: 'grid',
          properties: {
            'grid-template-columns': 'repeat(2, 1fr)',
            'gap': '8px',
            'height': '100%',
          },
          childContainers: [
            {
              role: 'left-column',
              display: 'flex',
              properties: {
                'flex-direction': 'column',
                'gap': '4px',
              },
              children: [],
            },
            {
              role: 'right-column',
              display: 'flex',
              properties: {
                'flex-direction': 'column',
                'gap': '4px',
              },
              children: [],
            },
          ],
        },
        componentStructure: [
          `<div data-section-id="${section.id}" className="grid grid-cols-2 gap-2 h-full">`,
          `  <div className="flex flex-col gap-1">{/* left column */}</div>`,
          `  <div className="flex flex-col gap-1">{/* right column */}</div>`,
          `</div>`,
        ].join('\n'),
        controlSlots: section.controls,
        notes: [`Dual column layout — controls split between two vertical columns`],
      };
    }

    case 'stacked-rows': {
      return {
        sectionId: section.id,
        archetype: section.archetype,
        cssArchitecture: {
          display: 'flex',
          properties: {
            'flex-direction': 'column',
            'gap': '4px',
            'height': '100%',
          },
          childContainers: section.controls.length > 0
            ? [
                {
                  role: 'row',
                  display: 'flex',
                  properties: {
                    'flex-direction': 'row',
                    'gap': '4px',
                    'justify-content': 'center',
                  },
                  children: [],
                },
              ]
            : [],
        },
        componentStructure: [
          `<div data-section-id="${section.id}" className="flex flex-col gap-1 h-full">`,
          `  {/* Each row is a flex-row container */}`,
          `  <div className="flex flex-row gap-1 justify-center">{/* row N controls */}</div>`,
          `</div>`,
        ].join('\n'),
        controlSlots: section.controls,
        notes: [
          `Stacked rows — each row is a horizontal flex container`,
          `Row contents determined by manifest control order and neighbor relationships`,
        ],
      };
    }

    default: {
      // This is the safety net — unknown archetypes cause a HARD ERROR.
      // The developer must add the archetype to LayoutArchetype and this switch.
      throw new LayoutEngineError(
        section.id,
        section.archetype as string,
        `Unknown archetype "${section.archetype}". ` +
        `Valid archetypes: grid-NxM, single-column, single-row, anchor-layout, ` +
        `cluster-above-anchor, cluster-below-anchor, dual-column, stacked-rows. ` +
        `To add a new archetype, update LayoutArchetype type AND the generateTemplate switch in layout-engine.ts.`
      );
    }
  }
}

// ─── Error Handling ─────────────────────────────────────────────────────────

export class LayoutEngineError extends Error {
  constructor(
    public sectionId: string,
    public archetype: string,
    message: string,
  ) {
    super(`[LayoutEngine] Section "${sectionId}" (archetype: ${archetype}): ${message}`);
    this.name = 'LayoutEngineError';
  }
}

// ─── Validation ─────────────────────────────────────────────────────────────

function validateManifest(manifest: MasterManifest): string[] {
  const errors: string[] = [];

  if (!manifest.deviceId) errors.push('Missing deviceId');
  if (!manifest.sections || manifest.sections.length === 0) errors.push('No sections defined');
  if (!manifest.controls || manifest.controls.length === 0) errors.push('No controls defined');

  // Validate each section has a valid archetype
  for (const section of manifest.sections) {
    if (!section.id) errors.push(`Section missing id`);
    if (!section.archetype) errors.push(`Section "${section.id}" missing archetype`);

    // Check grid dimensions for grid archetype
    if (section.archetype === 'grid-NxM') {
      if (!section.gridRows || !section.gridCols) {
        errors.push(`Section "${section.id}" uses grid-NxM but missing gridRows/gridCols`);
      }
    }

    // Check height splits for anchor archetypes
    if (
      (section.archetype === 'cluster-above-anchor' ||
        section.archetype === 'cluster-below-anchor' ||
        section.archetype === 'anchor-layout') &&
      !section.heightSplits
    ) {
      errors.push(
        `Section "${section.id}" uses ${section.archetype} but missing heightSplits (will use defaults)`
      );
    }

    // Check all controls in this section exist in the controls array
    for (const controlId of section.controls) {
      if (!manifest.controls.find(c => c.id === controlId)) {
        errors.push(`Section "${section.id}" references control "${controlId}" not found in controls array`);
      }
    }
  }

  // Check for orphaned controls (not assigned to any section)
  const assignedControls = new Set(manifest.sections.flatMap(s => s.controls));
  for (const control of manifest.controls) {
    if (!assignedControls.has(control.id)) {
      errors.push(`Control "${control.id}" not assigned to any section`);
    }
  }

  return errors;
}

// ─── Main Engine ────────────────────────────────────────────────────────────

export interface LayoutEngineOutput {
  deviceId: string;
  deviceName: string;
  generatedAt: string;
  templates: TemplateSpec[];
  panelArchitecture: {
    layoutType: string;
    sectionOrder: string[];
    sectionWidths: Record<string, string>;
    totalSections: number;
    totalControls: number;
  };
  warnings: string[];
}

export function runLayoutEngine(manifest: MasterManifest): LayoutEngineOutput {
  // Step 1: Validate manifest
  const validationErrors = validateManifest(manifest);
  const warnings: string[] = [];

  // Treat missing heightSplits as warnings, not errors
  const fatalErrors = validationErrors.filter(e => !e.includes('will use defaults'));
  const nonFatalWarnings = validationErrors.filter(e => e.includes('will use defaults'));
  warnings.push(...nonFatalWarnings);

  if (fatalErrors.length > 0) {
    throw new LayoutEngineError(
      'manifest',
      'validation',
      `Manifest validation failed:\n${fatalErrors.map(e => `  - ${e}`).join('\n')}`
    );
  }

  // Step 2: Generate templates for each section
  const templates: TemplateSpec[] = [];
  for (const section of manifest.sections) {
    const template = generateTemplate(section, manifest.controls);
    templates.push(template);
  }

  // Step 3: Generate panel-level architecture
  const sectionWidths: Record<string, string> = {};
  for (const section of manifest.sections) {
    sectionWidths[section.id] = `${section.widthPercent}%`;
  }

  return {
    deviceId: manifest.deviceId,
    deviceName: manifest.deviceName,
    generatedAt: new Date().toISOString(),
    templates,
    panelArchitecture: {
      layoutType: manifest.layoutType,
      sectionOrder: manifest.sections.map(s => s.id),
      sectionWidths,
      totalSections: manifest.sections.length,
      totalControls: manifest.controls.length,
    },
    warnings,
  };
}

// ─── CLI Entry Point ────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  let manifestPath: string | null = null;
  let outputPath: string | null = null;
  let useStdin = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--stdin') {
      useStdin = true;
    } else if (args[i] === '--output' && args[i + 1]) {
      outputPath = args[i + 1];
      i++;
    } else if (!args[i].startsWith('--')) {
      manifestPath = args[i];
    }
  }

  if (!manifestPath && !useStdin) {
    console.error('Usage: npx tsx scripts/layout-engine.ts <manifest-path> [--output <output-path>]');
    console.error('       npx tsx scripts/layout-engine.ts --stdin [--output <output-path>]');
    process.exit(1);
  }

  // Read manifest
  let manifestJson: string;
  if (useStdin) {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    manifestJson = Buffer.concat(chunks).toString('utf-8');
  } else {
    manifestJson = fs.readFileSync(manifestPath!, 'utf-8');
  }

  let manifest: MasterManifest;
  try {
    manifest = JSON.parse(manifestJson);
  } catch (e) {
    console.error(`Failed to parse manifest JSON: ${(e as Error).message}`);
    process.exit(1);
  }

  // Run engine
  try {
    const output = runLayoutEngine(manifest);

    const outputJson = JSON.stringify(output, null, 2);

    if (outputPath) {
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      fs.writeFileSync(outputPath, outputJson, 'utf-8');
      console.log(`Layout engine output written to: ${outputPath}`);
    } else {
      console.log(outputJson);
    }

    // Summary to stderr (doesn't pollute stdout JSON)
    console.error(`\n--- Layout Engine Summary ---`);
    console.error(`Device: ${output.deviceName} (${output.deviceId})`);
    console.error(`Layout: ${output.panelArchitecture.layoutType}`);
    console.error(`Sections: ${output.panelArchitecture.totalSections}`);
    console.error(`Controls: ${output.panelArchitecture.totalControls}`);
    console.error(`Templates generated: ${output.templates.length}`);
    if (output.warnings.length > 0) {
      console.error(`Warnings: ${output.warnings.length}`);
      for (const w of output.warnings) {
        console.error(`  ⚠ ${w}`);
      }
    }
  } catch (e) {
    if (e instanceof LayoutEngineError) {
      console.error(`\nLAYOUT ENGINE ERROR:`);
      console.error(`  Section: ${e.sectionId}`);
      console.error(`  Archetype: ${e.archetype}`);
      console.error(`  ${e.message}`);
      process.exit(2);
    }
    throw e;
  }
}

// Run if invoked directly
if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
