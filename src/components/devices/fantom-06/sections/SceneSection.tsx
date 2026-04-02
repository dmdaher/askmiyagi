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
              left: 1063,
              top: 41,
              width: 30,
              height: 19,
            }}
          >
            <div>
              <PanelButton
                id="scene-select"
                label=""
                width={30}
                height={19}
                active={getState('scene-select').active}
                highlighted={isHighlighted('scene-select')}
                onClick={() => onButtonClick?.('scene-select')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1048,
            top: 25,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            SCENE SELECT
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1063,
              top: 104,
              width: 30,
              height: 19,
            }}
          >
            <div>
              <PanelButton
                id="scene-chain"
                label=""
                width={30}
                height={19}
                active={getState('scene-chain').active}
                highlighted={isHighlighted('scene-chain')}
                onClick={() => onButtonClick?.('scene-chain')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1048,
            top: 88,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            SCENE CHAIN
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1063,
              top: 143,
              width: 30,
              height: 19,
            }}
          >
            <div>
              <PanelButton
                id="zone-view"
                label=""
                width={30}
                height={19}
                active={getState('zone-view').active}
                highlighted={isHighlighted('zone-view')}
                onClick={() => onButtonClick?.('zone-view')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1048,
            top: 127,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            ZONE VIEW
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1063,
              top: 193,
              width: 30,
              height: 19,
            }}
          >
            <div>
              <PanelButton
                id="single-tone"
                label=""
                width={30}
                height={19}
                active={getState('single-tone').active}
                highlighted={isHighlighted('single-tone')}
                onClick={() => onButtonClick?.('single-tone')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1048,
            top: 177,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            SINGLE TONE
          </span>
        </div>
      </div>
    </motion.div>
  );
}
