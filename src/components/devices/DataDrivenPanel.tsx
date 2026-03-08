'use client';

import React from 'react';
import type {
  PanelLayout,
  PanelSection,
  PanelControl,
  PanelState,
  SectionControlLayout,
  StructuralRow,
  ButtonVariant,
} from '@/types/panel';
import PanelButton from '@/components/controls/PanelButton';
import Knob from '@/components/controls/Knob';
import Slider from '@/components/controls/Slider';
import PadButton from '@/components/controls/PadButton';
import TransportButton from '@/components/controls/TransportButton';
import ValueDial from '@/components/controls/ValueDial';
import LEDIndicator from '@/components/controls/LEDIndicator';
import JogWheel from '@/components/controls/JogWheel';
import Lever from '@/components/controls/Lever';
import Wheel from '@/components/controls/Wheel';

interface DataDrivenPanelProps {
  layout: PanelLayout;
  panelState: PanelState;
  highlightedControls: string[];
  onControlClick?: (controlId: string) => void;
}

/** Map PanelButton variant safely — PanelButton does not accept 'round' */
function mapButtonVariant(
  variant: ButtonVariant | undefined,
): 'standard' | 'zone' | 'scene' | 'category' | 'function' | 'menu' {
  if (!variant) return 'standard';
  if (variant === 'round') return 'standard';
  return variant;
}

/** Map labelPosition to the values PanelButton accepts ('on' | 'above') */
function mapLabelPosition(
  pos: PanelControl['labelPosition'],
): 'on' | 'above' {
  if (pos === 'above') return 'above';
  return 'on';
}

/** Detect transport icon from label text */
function detectTransportIcon(label: string): 'play' | 'stop' | 'rec' {
  const lower = label.toLowerCase();
  if (lower.includes('play') || lower.includes('start')) return 'play';
  if (lower.includes('rec')) return 'rec';
  return 'stop';
}

/** Render a single control based on its type */
function renderControl(
  control: PanelControl,
  state: PanelState,
  isHighlighted: boolean,
  onControlClick?: (controlId: string) => void,
): React.ReactNode {
  const controlState = state[control.id];
  const active = controlState?.active ?? false;
  const ledOn = controlState?.ledOn ?? false;
  const ledColor = controlState?.ledColor ?? control.ledColor;
  const value = controlState?.value ?? control.defaultValue ?? 0;

  switch (control.type) {
    case 'button':
      return (
        <PanelButton
          id={control.id}
          label={control.label}
          variant={mapButtonVariant(control.variant)}
          size={control.size}
          active={active}
          hasLed={control.hasLed}
          ledOn={ledOn}
          ledColor={ledColor}
          highlighted={isHighlighted}
          labelPosition={mapLabelPosition(control.labelPosition)}
          onClick={() => onControlClick?.(control.id)}
        />
      );

    case 'knob':
      return (
        <Knob
          id={control.id}
          label={control.label}
          value={value}
          highlighted={isHighlighted}
          size={control.size === 'sm' ? 'sm' : 'md'}
        />
      );

    case 'slider':
    case 'fader':
      return (
        <Slider
          id={control.id}
          label={control.label}
          value={value}
          highlighted={isHighlighted}
        />
      );

    case 'pad':
      return (
        <PadButton
          id={control.id}
          label={control.label}
          active={active}
          color={control.color}
          highlighted={isHighlighted}
          onClick={() => onControlClick?.(control.id)}
        />
      );

    case 'transport':
      return (
        <TransportButton
          id={control.id}
          icon={detectTransportIcon(control.label)}
          active={active}
          highlighted={isHighlighted}
          onClick={() => onControlClick?.(control.id)}
        />
      );

    case 'dial':
    case 'encoder':
      return (
        <ValueDial
          id={control.id}
          label={control.label}
          highlighted={isHighlighted}
          size={control.size === 'lg' ? 'lg' : 'sm'}
        />
      );

    case 'led':
      return (
        <LEDIndicator
          id={control.id}
          on={ledOn || active}
          color={control.color ?? ledColor}
          highlighted={isHighlighted}
        />
      );

    case 'jog-wheel':
      return (
        <JogWheel
          id={control.id}
          highlighted={isHighlighted}
          size={control.position?.width ?? 240}
          onButtonClick={onControlClick}
        />
      );

    case 'display':
      return (
        <div
          data-control-id={control.id}
          style={{
            width: '100%',
            height: control.position?.height ?? 240,
            backgroundColor: '#0a0a12',
            borderRadius: 4,
            border: '1px solid #333',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8)',
          }}
        />
      );

    case 'text':
      return (
        <span
          data-control-id={control.id}
          style={{
            fontFamily: 'monospace',
            fontSize: 10,
            color: '#aaa',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {control.label}
        </span>
      );

    case 'lever':
      return (
        <Lever
          id={control.id}
          label={control.label}
          highlighted={isHighlighted}
        />
      );

    case 'wheel':
      return (
        <Wheel
          id={control.id}
          label={control.label}
          value={value}
          highlighted={isHighlighted}
        />
      );

    default:
      return null;
  }
}

/**
 * Determines whether a control component already renders its own data-control-id.
 * These components should NOT get an extra wrapper with data-control-id.
 */
function controlRendersOwnId(type: PanelControl['type']): boolean {
  // PadButton, LEDIndicator, JogWheel render data-control-id on their own root element.
  // PanelButton, Knob, Slider, TransportButton, ValueDial, Lever, Wheel also render it
  // on their own wrapper div. display and text are inline elements we add the attr to.
  // So ALL controls already have data-control-id — we don't need a wrapper for the attr.
  return true;
}

/** Build the style for a control layout container */
function buildLayoutContainerStyle(
  layout: SectionControlLayout,
): React.CSSProperties {
  switch (layout.type) {
    case 'grid':
      return {
        display: 'grid',
        gridTemplateColumns: `repeat(${layout.columns}, auto)`,
        gap: layout.gap ?? 0,
        rowGap: layout.rowGap ?? layout.gap ?? 0,
      };
    case 'flex-row':
      return {
        display: 'flex',
        flexDirection: 'row',
        gap: layout.gap ?? 0,
        flexWrap: layout.wrap ? 'wrap' : 'nowrap',
        alignItems: layout.align ?? 'center',
      };
    case 'flex-col':
      return {
        display: 'flex',
        flexDirection: 'column',
        gap: layout.gap ?? 0,
        alignItems: layout.align ?? 'center',
      };
    case 'absolute':
      return {
        position: 'relative',
        width: layout.width,
        height: layout.height,
      };
    default:
      return { display: 'flex', flexDirection: 'row', gap: 4 };
  }
}

/** Build the style for a control within its layout */
function buildControlStyle(
  control: PanelControl,
  layout: SectionControlLayout,
): React.CSSProperties {
  const style: React.CSSProperties = {};

  if (layout.type === 'grid') {
    if (control.gridColumn) style.gridColumn = control.gridColumn;
    if (control.gridRow) style.gridRow = control.gridRow;
  } else if (layout.type === 'flex-row' || layout.type === 'flex-col') {
    if (control.flexOrder !== undefined) style.order = control.flexOrder;
  } else if (layout.type === 'absolute' && control.position) {
    style.position = 'absolute';
    style.left = control.position.x;
    style.top = control.position.y;
  }

  return style;
}

/** Render a section's controls inside the appropriate layout container */
function renderSectionControls(
  section: PanelSection,
  panelState: PanelState,
  highlightedControls: string[],
  onControlClick?: (controlId: string) => void,
): React.ReactNode {
  const layout = section.controlLayout ?? { type: 'flex-row', gap: 4 };
  const containerStyle = buildLayoutContainerStyle(layout);

  return (
    <div data-layout={layout.type} style={containerStyle}>
      {section.controls.map((control) => {
        const isHighlighted = highlightedControls.includes(control.id);
        const controlStyle = buildControlStyle(control, layout);
        const hasPositioning = Object.keys(controlStyle).length > 0;

        if (hasPositioning) {
          return (
            <div key={control.id} style={controlStyle}>
              {renderControl(control, panelState, isHighlighted, onControlClick)}
            </div>
          );
        }

        return (
          <React.Fragment key={control.id}>
            {renderControl(control, panelState, isHighlighted, onControlClick)}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/** Render a section container */
function renderSection(
  section: PanelSection,
  panelState: PanelState,
  highlightedControls: string[],
  stretchSection?: string,
  onControlClick?: (controlId: string) => void,
): React.ReactNode {
  const isStretch = stretchSection === section.id;

  const sectionStyle: React.CSSProperties = {
    ...(isStretch ? { flex: 1 } : {}),
    ...(section.minWidth ? { minWidth: section.minWidth } : {}),
    ...(section.minHeight ? { minHeight: section.minHeight } : {}),
    ...(section.background ? { backgroundColor: section.background } : {}),
    ...(section.borderRadius ? { borderRadius: section.borderRadius } : {}),
    ...(section.padding !== undefined ? { padding: section.padding } : {}),
  };

  return (
    <div
      key={section.id}
      data-section-id={section.id}
      style={sectionStyle}
    >
      {renderSectionControls(section, panelState, highlightedControls, onControlClick)}
    </div>
  );
}

/** Render a structural row (flex-direction: row container) */
function renderStructuralRow(
  row: StructuralRow,
  sections: PanelSection[],
  panelState: PanelState,
  highlightedControls: string[],
  rowIndex: number,
  onControlClick?: (controlId: string) => void,
): React.ReactNode {
  const rowStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    gap: row.gap ?? 0,
  };

  // Height handling
  if (row.height === 'auto') {
    // No explicit height — size to content
  } else if (typeof row.height === 'number') {
    rowStyle.height = row.height;
  } else {
    // undefined → flex: 1 (fill remaining space)
    rowStyle.flex = 1;
  }

  // Build a map for quick section lookup
  const sectionMap = new Map(sections.map((s) => [s.id, s]));

  return (
    <div key={`row-${rowIndex}`} style={rowStyle}>
      {row.sections.map((sectionId) => {
        const section = sectionMap.get(sectionId);
        if (!section) return null;
        return renderSection(
          section,
          panelState,
          highlightedControls,
          row.stretch,
          onControlClick,
        );
      })}
    </div>
  );
}

/** Render the panel in structural layout mode */
function renderStructuralLayout(
  layout: PanelLayout,
  panelState: PanelState,
  highlightedControls: string[],
  onControlClick?: (controlId: string) => void,
): React.ReactNode {
  const rows = layout.rows ?? [];
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    width: layout.dimensions?.width,
    height: layout.dimensions?.height,
    backgroundColor: layout.background?.color,
    borderRadius: 8,
    overflow: 'hidden',
  };

  return (
    <div style={containerStyle}>
      {rows.map((row, index) =>
        renderStructuralRow(
          row,
          layout.sections,
          panelState,
          highlightedControls,
          index,
          onControlClick,
        ),
      )}
    </div>
  );
}

/** Render the panel in absolute layout mode (legacy) */
function renderAbsoluteLayout(
  layout: PanelLayout,
  panelState: PanelState,
  highlightedControls: string[],
  onControlClick?: (controlId: string) => void,
): React.ReactNode {
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: layout.dimensions?.width,
    height: layout.dimensions?.height,
    backgroundColor: layout.background?.color,
    borderRadius: 8,
    overflow: 'hidden',
  };

  return (
    <div style={containerStyle}>
      {layout.sections.map((section) => {
        const bounds = section.bounds;
        const sectionStyle: React.CSSProperties = bounds
          ? {
              position: 'absolute',
              left: bounds.x,
              top: bounds.y,
              width: bounds.width,
              height: bounds.height,
              ...(section.background ? { backgroundColor: section.background } : {}),
              ...(section.borderRadius ? { borderRadius: section.borderRadius } : {}),
              ...(section.padding !== undefined ? { padding: section.padding } : {}),
            }
          : {};

        return (
          <div key={section.id} data-section-id={section.id} style={sectionStyle}>
            {section.controls.map((control) => {
              const isHighlighted = highlightedControls.includes(control.id);
              const pos = control.position;
              const controlWrapperStyle: React.CSSProperties = pos
                ? {
                    position: 'absolute',
                    left: pos.x,
                    top: pos.y,
                  }
                : {};

              return (
                <div key={control.id} style={controlWrapperStyle}>
                  {renderControl(control, panelState, isHighlighted, onControlClick)}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export default function DataDrivenPanel({
  layout,
  panelState,
  highlightedControls,
  onControlClick,
}: DataDrivenPanelProps) {
  const mode = layout.layoutMode ?? 'absolute';

  if (mode === 'structural') {
    return renderStructuralLayout(layout, panelState, highlightedControls, onControlClick);
  }

  return renderAbsoluteLayout(layout, panelState, highlightedControls, onControlClick);
}
