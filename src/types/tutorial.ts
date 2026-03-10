import { PanelState } from './panel';
import { DisplayState } from './display';
import { ZoneConfig } from './keyboard';

export type TutorialCategory = string;

export interface TutorialStep {
  id: string;
  title: string;
  instruction: string;
  details?: string;
  highlightControls: string[];
  panelStateChanges: Partial<PanelState>;
  displayState?: DisplayState;
  zones?: ZoneConfig[];
  tipText?: string;
}

export interface Tutorial {
  id: string;
  deviceId: string;
  title: string;
  description: string;
  category: TutorialCategory;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  steps: TutorialStep[];
  tags: string[];
}
