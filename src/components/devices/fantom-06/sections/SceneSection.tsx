'use client';

import { motion } from 'framer-motion';
import PanelButton from '@/components/controls/PanelButton';
import { PanelState } from '@/types/panel';

interface SceneSectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function SceneSection({
  panelState,
  highlightedControls,
  onButtonClick,
}: SceneSectionProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.15 }}
    >
      <div data-section-id="scene">
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '14.10%',
              top: '95.30%',
              width: '4.70%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="scene-select"
                label=""
                size="md"
                active={getState('scene-select').active}
                highlighted={isHighlighted('scene-select')}
                onClick={() => onButtonClick?.('scene-select')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '14.10%',
              top: '108.40%',
              width: '4.70%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="scene-chain"
                label=""
                size="md"
                active={getState('scene-chain').active}
                highlighted={isHighlighted('scene-chain')}
                onClick={() => onButtonClick?.('scene-chain')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '14.10%',
              top: '113.80%',
              width: '4.70%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="zone-view"
                label=""
                size="md"
                active={getState('zone-view').active}
                highlighted={isHighlighted('zone-view')}
                onClick={() => onButtonClick?.('zone-view')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '14.10%',
              top: '121.60%',
              width: '4.70%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="single-tone"
                label=""
                size="md"
                active={getState('single-tone').active}
                highlighted={isHighlighted('single-tone')}
                onClick={() => onButtonClick?.('single-tone')}
              />
            </div>
          </div>
      </div>
    </motion.div>
  );
}
