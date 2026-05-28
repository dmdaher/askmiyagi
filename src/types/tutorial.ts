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
  /** ISO date (YYYY-MM-DD) marking when this tutorial was authored.
   *  Optional — older tutorials don't set it. Used by PR-X3's "Recently
   *  added" UI. Added here on PR-X2 for the 5 integration tutorials so
   *  this PR can ship independently of PR-X3 merge order. */
  addedDate?: string;
}
