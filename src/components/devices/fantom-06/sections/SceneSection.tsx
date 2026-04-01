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
              left: '56.70%',
              top: '13.40%',
              width: '5.30%',
              height: '14.10%',
            }}
          >
            <div>
              <PanelButton
                id="scene-select"
                label=""
                width={64}
                height={51}
                active={getState('scene-select').active}
                highlighted={isHighlighted('scene-select')}
                onClick={() => onButtonClick?.('scene-select')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '56.7%',
            top: '12.2%',
            width: '5.3%',
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
              left: '56.70%',
              top: '33.50%',
              width: '5.30%',
              height: '14.10%',
            }}
          >
            <div>
              <PanelButton
                id="scene-chain"
                label=""
                width={64}
                height={51}
                active={getState('scene-chain').active}
                highlighted={isHighlighted('scene-chain')}
                onClick={() => onButtonClick?.('scene-chain')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '56.7%',
            top: '32.3%',
            width: '5.3%',
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
              left: '56.70%',
              top: '45.80%',
              width: '5.30%',
              height: '14.10%',
            }}
          >
            <div>
              <PanelButton
                id="zone-view"
                label=""
                width={64}
                height={51}
                active={getState('zone-view').active}
                highlighted={isHighlighted('zone-view')}
                onClick={() => onButtonClick?.('zone-view')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '56.7%',
            top: '44.6%',
            width: '5.3%',
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
              left: '56.70%',
              top: '61.90%',
              width: '5.30%',
              height: '14.10%',
            }}
          >
            <div>
              <PanelButton
                id="single-tone"
                label=""
                width={64}
                height={51}
                active={getState('single-tone').active}
                highlighted={isHighlighted('single-tone')}
                onClick={() => onButtonClick?.('single-tone')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '56.7%',
            top: '60.7%',
            width: '5.3%',
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
