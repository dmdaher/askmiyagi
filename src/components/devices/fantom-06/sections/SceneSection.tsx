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
              left: 1287,
              top: 79,
              width: 41,
              height: 26,
            }}
          >
            <div>
              <PanelButton
                id="scene-select"
                label=""
                width={41}
                height={26}
                active={getState('scene-select').active}
                highlighted={isHighlighted('scene-select')}
                onClick={() => onButtonClick?.('scene-select')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1287,
              top: 134,
              width: 41,
              height: 26,
            }}
          >
            <div>
              <PanelButton
                id="scene-chain"
                label=""
                width={41}
                height={26}
                active={getState('scene-chain').active}
                highlighted={isHighlighted('scene-chain')}
                onClick={() => onButtonClick?.('scene-chain')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1287,
              top: 189,
              width: 41,
              height: 26,
            }}
          >
            <div>
              <PanelButton
                id="zone-view"
                label=""
                width={41}
                height={26}
                active={getState('zone-view').active}
                highlighted={isHighlighted('zone-view')}
                onClick={() => onButtonClick?.('zone-view')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1287,
              top: 243,
              width: 41,
              height: 26,
            }}
          >
            <div>
              <PanelButton
                id="single-tone"
                label=""
                width={41}
                height={26}
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
