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
              left: '63.10%',
              top: '9.10%',
              width: '4.30%',
              height: '10.80%',
            }}
          >
            <Knob
              id="cutoff"
              label=""
              value={getState('cutoff').value ?? 64}
              highlighted={isHighlighted('cutoff')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '68.90%',
              top: '9.10%',
              width: '4.30%',
              height: '10.80%',
            }}
          >
            <Knob
              id="resonance"
              label=""
              value={getState('resonance').value ?? 64}
              highlighted={isHighlighted('resonance')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '63.90%',
              top: '22.40%',
              width: '2.80%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="osc"
                label=""
                size="md"
                active={getState('osc').active}
                highlighted={isHighlighted('osc')}
                onClick={() => onButtonClick?.('osc')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '66.80%',
              top: '22.40%',
              width: '2.80%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="filter-type"
                label=""
                size="md"
                active={getState('filter-type').active}
                highlighted={isHighlighted('filter-type')}
                onClick={() => onButtonClick?.('filter-type')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '69.60%',
              top: '22.40%',
              width: '2.80%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="param"
                label=""
                size="md"
                active={getState('param').active}
                highlighted={isHighlighted('param')}
                onClick={() => onButtonClick?.('param')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '63.90%',
              top: '29.00%',
              width: '2.80%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="amp"
                label=""
                size="md"
                active={getState('amp').active}
                highlighted={isHighlighted('amp')}
                onClick={() => onButtonClick?.('amp')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '66.80%',
              top: '29.00%',
              width: '2.80%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="fx"
                label=""
                size="md"
                active={getState('fx').active}
                highlighted={isHighlighted('fx')}
                onClick={() => onButtonClick?.('fx')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '69.60%',
              top: '29.00%',
              width: '2.80%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="lfo"
                label=""
                size="md"
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
