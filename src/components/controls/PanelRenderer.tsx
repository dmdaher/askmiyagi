'use client';

import PanelShell from './PanelShell';
import SectionContainer from './SectionContainer';
import PanelButton from './PanelButton';
import Knob from './Knob';
import Slider from './Slider';
import Wheel from './Wheel';
import PadButton from './PadButton';
import ValueDial from './ValueDial';
import Lever from './Lever';
import Port from './Port';
import TouchDisplay from './TouchDisplay';
import JogWheelAssembly from './JogWheelAssembly';
import DirectionSwitch from './DirectionSwitch';
import JogDisplay from './JogDisplay';
import { HARDWARE_ICONS } from '@/lib/hardware-icons';
import { PanelState } from '@/types/panel';
import type { GroupLabel } from '@/types/manifest';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ManifestControl {
  id: string;
  type: string;
  label: string;
  shape?: string;
  surfaceColor?: string;
  buttonStyle?: string;
  labelPosition?: string;
  labelDisplay?: string;
  icon?: string;
  secondaryLabel?: string;
  ledVariant?: string;
  ledColor?: string;
  hasLed?: boolean;
  ledPosition?: string;
  nestedIn?: string;
  encoderHasPush?: boolean;
  positions?: number;
  positionLabels?: string[];
  rotation?: number;
  labelFontSize?: number;
  editorPosition?: { x: number; y: number; w: number; h: number };
}

interface ManifestLabel {
  id: string;
  text: string;
  icon?: string;
  x: number;
  y: number;
  w?: number;
  fontSize: number;
  align?: 'left' | 'center' | 'right';
  hidden?: boolean;
  lineHeight?: number;
}

interface ManifestSection {
  id: string;
  headerLabel?: string;
  hidden?: boolean;
  frameMode?: 'full' | 'header-only' | 'hidden';
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PanelManifest {
  deviceId: string;
  deviceName: string;
  manufacturer: string;
  controls: ManifestControl[];
  editorSections?: ManifestSection[];
  editorLabels?: ManifestLabel[];
  groupLabels?: GroupLabel[];
  keyboard?: {
    keys: number;
    startNote: string;
    panelHeightPercent: number;
    leftPercent?: number;
    widthPercent?: number;
  } | null;
  panelWidth: number;
  panelHeight: number;
  controlScale?: number;
}

export interface PanelRendererProps {
  manifest: PanelManifest;
  panelState?: PanelState;
  highlightedControls?: string[];
  onButtonClick?: (id: string) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function renderLabelText(text: string): React.ReactNode {
  if (!text.includes('\n')) return text;
  return text.split('\n').map((line, i) => (
    <span key={i}>
      {i > 0 && <br />}
      {line}
    </span>
  ));
}

function inferPortVariant(label: string): string {
  const l = label.toLowerCase();
  if (l.includes('usb')) return 'usb';
  if (l.includes('midi')) return 'midi';
  if (l.includes('sd') || l.includes('card')) return 'sd-card';
  if (l.includes('power') || l.includes('dc')) return 'power';
  return 'audio';
}

// ─── Control Renderer ───────────────────────────────────────────────────────

function renderControl(
  control: ManifestControl,
  allControls: ManifestControl[],
  w: number,
  h: number,
  highlighted: boolean,
  active: boolean,
  ledOn: boolean,
  onClick?: () => void,
): React.ReactNode {
  switch (control.type) {
    case 'button': {
      if (control.shape === 'circle') {
        const diameter = Math.min(w, h);
        const iconKey = control.icon;
        const iconContent = iconKey ? (HARDWARE_ICONS[iconKey] ?? iconKey) : undefined;
        const showInside = control.labelPosition === 'on-button' || control.labelDisplay === 'icon-only';
        const displayText = iconContent ?? control.label;
        const isIcon = !!iconContent;
        return (
          <div className="relative" data-control-id={control.id}>
            {control.hasLed && control.ledPosition !== 'inside' && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2" style={{ zIndex: 1 }}>
                <div className="rounded-full" style={{
                  width: 6, height: 6,
                  backgroundColor: ledOn ? (control.ledColor ?? '#22c55e') : '#333',
                  boxShadow: ledOn ? `0 0 4px 1px ${control.ledColor ?? '#22c55e'}` : 'none',
                }} />
              </div>
            )}
            <div
              className="rounded-full flex items-center justify-center cursor-pointer"
              style={{
                width: diameter, height: diameter,
                backgroundColor: active ? '#3a3a3a' : '#2a2a2a',
                border: `3px solid ${control.surfaceColor ?? '#444'}`,
                boxShadow: control.surfaceColor
                  ? `inset 0 2px 4px rgba(0,0,0,0.4), 0 0 8px ${control.surfaceColor}40`
                  : 'inset 0 2px 4px rgba(0,0,0,0.4)',
              }}
              onClick={onClick}
            >
              {showInside && (
                <span className="font-medium text-gray-300 uppercase text-center leading-tight px-1"
                  style={{ fontSize: isIcon ? 14 : 8 }}>
                  {displayText}
                </span>
              )}
            </div>
          </div>
        );
      }

      const rawStyle = control.buttonStyle;
      const variant = (rawStyle === 'raised' ? 'standard' : (rawStyle ?? 'standard')) as any;
      const iconContent = (control.icon && control.labelDisplay === 'icon-only')
        ? (HARDWARE_ICONS[control.icon] ?? control.icon) : undefined;

      return (
        <div className="relative">
          {control.hasLed && control.ledPosition !== 'inside' && (
            <div className="absolute -top-2 left-1/2 -translate-x-1/2" style={{ zIndex: 1 }}>
              <div className="rounded-full" style={{
                width: 6, height: 6,
                backgroundColor: ledOn ? (control.ledColor ?? '#22c55e') : '#333',
                boxShadow: ledOn ? `0 0 4px 1px ${control.ledColor ?? '#22c55e'}` : 'none',
              }} />
            </div>
          )}
          <PanelButton
            id={control.id}
            label={control.labelPosition === 'on-button' ? control.label : (iconContent ?? '')}
            highlighted={highlighted}
            active={active}
            width={w}
            height={h}
            variant={variant}
            surfaceColor={control.surfaceColor ?? undefined}
            iconContent={iconContent}
            hasLed={control.hasLed && control.ledPosition === 'inside'}
            ledOn={ledOn}
            ledColor={control.ledColor ?? undefined}
            onClick={onClick}
          />
        </div>
      );
    }
    case 'knob': {
      const knobSize = Math.max(Math.min(w, h) - 4, 12);
      return (
        <Knob id={control.id} label="" highlighted={highlighted}
          outerSize={knobSize} innerSize={knobSize * 0.7} />
      );
    }
    case 'fader':
    case 'slider':
      return (
        <Slider id={control.id} label="" highlighted={highlighted}
          trackHeight={Math.max(h - 10, 20)} trackWidth={Math.max(w - 4, 8)} />
      );
    case 'led':
    case 'indicator': {
      const ledColor = control.ledColor ?? '#22c55e';
      if (control.ledVariant === 'dual-label') {
        const parts = control.label.split('/').map(s => s.trim());
        return (
          <div className="flex flex-col rounded overflow-hidden"
            style={{ width: Math.max(w, 48), border: '1px solid #333' }}>
            <div className="flex items-center justify-center py-1 px-2"
              style={{ backgroundColor: '#0a2e1a', borderBottom: '1px solid #333' }}>
              <div className="flex items-center gap-1.5">
                <div className="rounded-full" style={{
                  width: 6, height: 6, backgroundColor: ledColor,
                  boxShadow: `0 0 4px ${ledColor}`,
                }} />
                <span className="text-[8px] font-medium text-green-400 uppercase">{parts[0] || 'MODE A'}</span>
              </div>
            </div>
            <div className="flex items-center justify-center py-1 px-2"
              style={{ backgroundColor: '#1a1a2a' }}>
              <div className="flex items-center gap-1.5">
                <div className="rounded-full" style={{
                  width: 6, height: 6, backgroundColor: `${ledColor}33`,
                  border: `1px solid ${ledColor}66`,
                }} />
                <span className="text-[8px] font-medium uppercase" style={{ color: `${ledColor}88` }}>
                  {parts[1] || 'MODE B'}
                </span>
              </div>
            </div>
          </div>
        );
      }
      if (control.ledVariant === 'bar') {
        return (
          <div className="flex flex-col items-center justify-center gap-1 rounded"
            style={{ backgroundColor: '#1a1a2a', padding: 4 }}>
            <div className="rounded-sm" style={{
              width: Math.max(w - 8, 16), height: 6,
              backgroundColor: ledColor, boxShadow: `0 0 6px ${ledColor}`,
            }} />
            <span className="text-[7px] text-gray-400 uppercase break-words w-full text-center leading-tight">
              {renderLabelText(control.label)}
            </span>
          </div>
        );
      }
      return (
        <div className="flex flex-col items-center justify-center gap-1 rounded"
          style={{ backgroundColor: '#1a1a2a', padding: 4 }}>
          <div className="rounded-full" style={{
            width: 20, height: 20, backgroundColor: ledColor,
            border: `3px solid ${ledColor}44`,
            boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.2)',
          }} />
          <span className="text-[7px] text-gray-400 uppercase break-words w-full text-center leading-tight">
            {renderLabelText(control.label)}
          </span>
        </div>
      );
    }
    case 'wheel': {
      const nestedIds = allControls.filter(c => c.nestedIn === control.id);
      const nestedDisplay = nestedIds.find(c => c.type === 'screen' || c.type === 'display');
      const nestedRing = nestedIds.find(c => c.type === 'led' && c.ledPosition === 'ring');
      if (nestedDisplay || nestedRing) {
        return (
          <JogWheelAssembly id={control.id} label="" highlighted={highlighted}
            wheelSize={Math.min(w, h)}
            displaySize={nestedDisplay ? Math.min(nestedDisplay.editorPosition?.w ?? 60, nestedDisplay.editorPosition?.h ?? 60, 60) : 60}
            ringColor={nestedRing?.ledColor ?? undefined} />
        );
      }
      return <Wheel id={control.id} label="" highlighted={highlighted} width={w} height={h} />;
    }
    case 'pad':
      return (
        <div className="relative">
          {control.hasLed && (
            <div className="absolute -top-2 left-1/2 -translate-x-1/2" style={{ zIndex: 1 }}>
              <div className="rounded-full" style={{
                width: 6, height: 6,
                backgroundColor: ledOn ? (control.ledColor ?? '#22c55e') : '#333',
                boxShadow: ledOn ? `0 0 4px 1px ${control.ledColor ?? '#22c55e'}` : 'none',
              }} />
            </div>
          )}
          <PadButton id={control.id}
            label={control.labelPosition === 'on-button' ? control.label : ''}
            highlighted={highlighted} active={active}
            width={w} height={h} onClick={onClick}
            labelFontSize={control.labelFontSize} />
        </div>
      );
    case 'encoder':
      return (
        <ValueDial id={control.id} label="" highlighted={highlighted}
          outerSize={Math.min(w, h)} hasPush={control.encoderHasPush} />
      );
    case 'switch':
    case 'lever': {
      if (control.positions && control.positions > 2) {
        return (
          <DirectionSwitch id={control.id} label=""
            positions={control.positionLabels ?? Array.from({ length: control.positions }, (_, i) => `${i + 1}`)}
            highlighted={highlighted} ledColor={control.ledColor ?? undefined}
            width={w} height={Math.min(h, 16)} />
        );
      }
      return (
        <Lever id={control.id} label="" highlighted={highlighted}
          scale={h / 62} positions={control.positions}
          positionLabels={control.positionLabels} />
      );
    }
    case 'port':
      return <Port id={control.id} label="" variant={inferPortVariant(control.label) as any}
        highlighted={highlighted} width={w} height={h} />;
    case 'slot':
      return <Port id={control.id} label="" variant="sd-card"
        highlighted={highlighted} width={w} height={h} />;
    case 'screen':
    case 'display': {
      const isJog = control.shape === 'circle'
        || control.label.toLowerCase().includes('jog')
        || control.nestedIn != null;
      if (isJog) {
        return <JogDisplay id={control.id} size={Math.min(w, h)}
          highlighted={highlighted} showMockContent />;
      }
      return <TouchDisplay id={control.id} highlighted={highlighted}
        width={w} height={h} showMockContent />;
    }
    default:
      return <div className="text-xs text-red-400">Unknown: {control.type}</div>;
  }
}

// ─── PanelRenderer ──────────────────────────────────────────────────────────

export default function PanelRenderer({
  manifest,
  panelState = {},
  highlightedControls = [],
  onButtonClick,
}: PanelRendererProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };
  const scale = manifest.controlScale ?? 1;
  const topLevelControls = manifest.controls.filter(c => !c.nestedIn);

  return (
    <PanelShell
      manufacturer={manifest.manufacturer}
      deviceName={manifest.deviceName}
      width={manifest.panelWidth}
      height={manifest.panelHeight}
      keyboard={manifest.keyboard}
    >
      {/* Section backgrounds */}
      {(manifest.editorSections ?? []).map((s) => {
        const mode = s.frameMode ?? (s.hidden ? 'hidden' : 'full');
        if (mode === 'hidden') return null;
        if (mode === 'header-only') {
          // Floating title only — no container background
          // Section coords are in pixels (same as SectionContainer), no scale needed
          return s.headerLabel ? (
            <div
              key={s.id}
              style={{
                position: 'absolute',
                left: s.x,
                top: s.y,
                width: s.w,
                height: 20,
                display: 'flex',
                alignItems: 'center',
                paddingLeft: 8,
                pointerEvents: 'none',
                zIndex: 0,
              }}
            >
              <span style={{
                fontSize: 8,
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: '#666',
              }}>
                {s.headerLabel}
              </span>
            </div>
          ) : null;
        }
        // Full mode — render SectionContainer
        return (
          <SectionContainer key={s.id} id={s.id}
            x={s.x} y={s.y} w={s.w} h={s.h}
            headerLabel={s.headerLabel} />
        );
      })}

      {/* Controls */}
      {topLevelControls.map((ctrl) => {
        const ep = ctrl.editorPosition;
        if (!ep) return null;
        const w = Math.round(ep.w * scale);
        const h = Math.round(ep.h * scale);
        const state = getState(ctrl.id);
        const inner = renderControl(
          ctrl, manifest.controls, w, h,
          isHighlighted(ctrl.id),
          state.active ?? false,
          state.ledOn ?? false,
          onButtonClick ? () => onButtonClick(ctrl.id) : undefined,
        );
        const rotation = ctrl.rotation;
        return (
          <div
            key={ctrl.id}
            className="absolute"
            style={{
              left: ep.x, top: ep.y, width: w, height: h,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {rotation ? (
              <div style={{ transform: `rotate(${rotation}deg)`, width: w, height: h,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {inner}
              </div>
            ) : inner}
          </div>
        );
      })}

      {/* Group labels */}
      {(manifest.groupLabels ?? []).map((gl) => {
        const memberControls = manifest.controls.filter(c => gl.controlIds.includes(c.id));
        const eps = memberControls.map(c => c.editorPosition).filter(Boolean) as Array<{ x: number; y: number; w: number; h: number }>;
        if (eps.length === 0) return null;
        const minX = Math.min(...eps.map(e => e.x));
        const maxX = Math.max(...eps.map(e => e.x + e.w * scale));
        const minY = Math.min(...eps.map(e => e.y));
        const maxY = Math.max(...eps.map(e => e.y + e.h * scale));
        const labelY = gl.position === 'above' ? minY - 14 : maxY + 2;
        return (
          <span key={gl.id} className="absolute text-[8px] font-semibold text-gray-500 uppercase tracking-widest text-center pointer-events-none"
            style={{ left: minX, width: maxX - minX, top: labelY }}>
            {gl.text}
          </span>
        );
      })}

      {/* Floating labels */}
      {(manifest.editorLabels ?? []).filter(l => !l.hidden).map((label) => (
        <div key={label.id} className="absolute pointer-events-none"
          style={{
            left: label.x, top: label.y,
            width: label.w ?? 'auto',
            textAlign: (label.align ?? 'center') as any,
            fontSize: label.fontSize,
            lineHeight: `${label.lineHeight ?? label.fontSize + 2}px`,
          }}>
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            {label.icon && HARDWARE_ICONS[label.icon] && (
              <span style={{ marginRight: label.text ? 3 : 0 }}>{HARDWARE_ICONS[label.icon]}</span>
            )}
            {label.text && renderLabelText(label.text)}
          </span>
        </div>
      ))}
    </PanelShell>
  );
}
