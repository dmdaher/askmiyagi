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
  /** ISO date (YYYY-MM-DD) marking when this tutorial was first authored.
   *  Optional — older tutorials don't set it. Used to surface "Recently added"
   *  in the UI so users can see which tutorials closed coverage gaps. */
  addedDate?: string;
}
