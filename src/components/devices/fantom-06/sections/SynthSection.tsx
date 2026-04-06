'use client';

import { motion } from 'framer-motion';
import Knob from '@/components/controls/Knob';
import PanelButton from '@/components/controls/PanelButton';
import { PanelState } from '@/types/panel';

interface SynthSectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function SynthSection({
  panelState,
  highlightedControls,
  onButtonClick,
}: SynthSectionProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.20 }}
    >
      <div data-section-id="synth">
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1530,
              top: 60,
              width: 38,
              height: 38,
            }}
          >
            <Knob
              id="cutoff"
              label=""
              value={getState('cutoff').value ?? 64}
              highlighted={isHighlighted('cutoff')}
              outerSize={38}
              innerSize={27}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1595,
              top: 63,
              width: 38,
              height: 38,
            }}
          >
            <Knob
              id="resonance"
              label=""
              value={getState('resonance').value ?? 64}
              highlighted={isHighlighted('resonance')}
              outerSize={38}
              innerSize={27}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1508,
              top: 110,
              width: 38,
              height: 24,
            }}
          >
            <div>
              <PanelButton
                id="osc"
                label=""
                width={38}
                height={24}
                active={getState('osc').active}
                highlighted={isHighlighted('osc')}
                onClick={() => onButtonClick?.('osc')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1570,
              top: 110,
              width: 38,
              height: 24,
            }}
          >
            <div>
              <PanelButton
                id="filter-type"
                label=""
                width={38}
                height={24}
                active={getState('filter-type').active}
                highlighted={isHighlighted('filter-type')}
                onClick={() => onButtonClick?.('filter-type')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1633,
              top: 110,
              width: 38,
              height: 24,
            }}
          >
            <div>
              <PanelButton
                id="param"
                label=""
                width={38}
                height={24}
                active={getState('param').active}
                highlighted={isHighlighted('param')}
                onClick={() => onButtonClick?.('param')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1508,
              top: 155,
              width: 38,
              height: 24,
            }}
          >
            <div>
              <PanelButton
                id="amp"
                label=""
                width={38}
                height={24}
                active={getState('amp').active}
                highlighted={isHighlighted('amp')}
                onClick={() => onButtonClick?.('amp')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1570,
              top: 155,
              width: 38,
              height: 24,
            }}
          >
            <div>
              <PanelButton
                id="fx"
                label=""
                width={38}
                height={24}
                active={getState('fx').active}
                highlighted={isHighlighted('fx')}
                onClick={() => onButtonClick?.('fx')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1633,
              top: 155,
              width: 38,
              height: 24,
            }}
          >
            <div>
              <PanelButton
                id="lfo"
                label=""
                width={38}
                height={24}
                active={getState('lfo').active}
                highlighted={isHighlighted('lfo')}
                onClick={() => onButtonClick?.('lfo')}
              />
            </div>
          </div>
      </div>
    </motion.div>
  );
}
