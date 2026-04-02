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
              left: 850,
              top: 33,
              width: 40,
              height: 25,
            }}
          >
            <div>
              <PanelButton
                id="scene-select"
                label=""
                width={40}
                height={25}
                active={getState('scene-select').active}
                highlighted={isHighlighted('scene-select')}
                onClick={() => onButtonClick?.('scene-select')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 840,
            top: 21,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            SCENE SELECT
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 850,
              top: 83,
              width: 40,
              height: 25,
            }}
          >
            <div>
              <PanelButton
                id="scene-chain"
                label=""
                width={40}
                height={25}
                active={getState('scene-chain').active}
                highlighted={isHighlighted('scene-chain')}
                onClick={() => onButtonClick?.('scene-chain')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 840,
            top: 71,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            SCENE CHAIN
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 850,
              top: 114,
              width: 40,
              height: 25,
            }}
          >
            <div>
              <PanelButton
                id="zone-view"
                label=""
                width={40}
                height={25}
                active={getState('zone-view').active}
                highlighted={isHighlighted('zone-view')}
                onClick={() => onButtonClick?.('zone-view')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 840,
            top: 102,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            ZONE VIEW
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 850,
              top: 154,
              width: 40,
              height: 25,
            }}
          >
            <div>
              <PanelButton
                id="single-tone"
                label=""
                width={40}
                height={25}
                active={getState('single-tone').active}
                highlighted={isHighlighted('single-tone')}
                onClick={() => onButtonClick?.('single-tone')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 840,
            top: 142,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            SINGLE TONE
          </span>
        </div>
      </div>
    </motion.div>
  );
}
