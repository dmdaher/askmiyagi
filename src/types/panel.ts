export type ControlType = 'button' | 'knob' | 'slider' | 'dial' | 'wheel' | 'pad' | 'led' | 'transport';

export type ButtonVariant = 'standard' | 'zone' | 'scene' | 'category' | 'function' | 'menu';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ControlPosition {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface PanelControl {
  id: string;
  type: ControlType;
  label: string;
  section: string;
  position?: ControlPosition;
  variant?: ButtonVariant;
  size?: ButtonSize;
  hasLed?: boolean;
  ledColor?: string;
  defaultValue?: number;
  minValue?: number;
  maxValue?: number;
}

export interface PanelSection {
  id: string;
  label: string;
  controls: PanelControl[];
}

export interface PanelLayout {
  deviceId: string;
  sections: PanelSection[];
}

export interface ButtonState {
  active: boolean;
  ledOn?: boolean;
  ledBlink?: boolean;  // FUTURE: CSS blink animation — inert until render path is built
  ledColor?: string;
  value?: number;
}

export type PanelState = Record<string, ButtonState>;
