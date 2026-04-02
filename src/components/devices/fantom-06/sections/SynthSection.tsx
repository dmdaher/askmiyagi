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
              left: 1194,
              top: 38,
              width: 30,
              height: 30,
            }}
          >
            <Knob
              id="cutoff"
              label=""
              value={getState('cutoff').value ?? 64}
              highlighted={isHighlighted('cutoff')}
              outerSize={30}
              innerSize={21}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1179,
            top: 74,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            CUTOFF
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1293,
              top: 38,
              width: 30,
              height: 30,
            }}
          >
            <Knob
              id="resonance"
              label=""
              value={getState('resonance').value ?? 64}
              highlighted={isHighlighted('resonance')}
              outerSize={30}
              innerSize={21}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1278,
            top: 74,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            RESONANCE
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1208,
              top: 113,
              width: 30,
              height: 19,
            }}
          >
            <div>
              <PanelButton
                id="osc"
                label=""
                width={30}
                height={19}
                active={getState('osc').active}
                highlighted={isHighlighted('osc')}
                onClick={() => onButtonClick?.('osc')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1193,
            top: 97,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            OSC
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1258,
              top: 113,
              width: 30,
              height: 19,
            }}
          >
            <div>
              <PanelButton
                id="filter-type"
                label=""
                width={30}
                height={19}
                active={getState('filter-type').active}
                highlighted={isHighlighted('filter-type')}
                onClick={() => onButtonClick?.('filter-type')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1243,
            top: 97,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            FILTER TYPE
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1308,
              top: 113,
              width: 30,
              height: 19,
            }}
          >
            <div>
              <PanelButton
                id="param"
                label=""
                width={30}
                height={19}
                active={getState('param').active}
                highlighted={isHighlighted('param')}
                onClick={() => onButtonClick?.('param')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1293,
            top: 97,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            PARAM
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1208,
              top: 150,
              width: 30,
              height: 19,
            }}
          >
            <div>
              <PanelButton
                id="amp"
                label=""
                width={30}
                height={19}
                active={getState('amp').active}
                highlighted={isHighlighted('amp')}
                onClick={() => onButtonClick?.('amp')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1193,
            top: 134,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            AMP
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1258,
              top: 150,
              width: 30,
              height: 19,
            }}
          >
            <div>
              <PanelButton
                id="fx"
                label=""
                width={30}
                height={19}
                active={getState('fx').active}
                highlighted={isHighlighted('fx')}
                onClick={() => onButtonClick?.('fx')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1243,
            top: 134,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            FX
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1308,
              top: 150,
              width: 30,
              height: 19,
            }}
          >
            <div>
              <PanelButton
                id="lfo"
                label=""
                width={30}
                height={19}
                active={getState('lfo').active}
                highlighted={isHighlighted('lfo')}
                onClick={() => onButtonClick?.('lfo')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1293,
            top: 134,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            LFO
          </span>
        </div>
      </div>
    </motion.div>
  );
}
