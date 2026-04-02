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
              left: 955,
              top: 30,
              width: 40,
              height: 40,
            }}
          >
            <Knob
              id="cutoff"
              label=""
              value={getState('cutoff').value ?? 64}
              highlighted={isHighlighted('cutoff')}
              outerSize={40}
              innerSize={28}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 945,
            top: 72,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            CUTOFF
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1034,
              top: 30,
              width: 40,
              height: 40,
            }}
          >
            <Knob
              id="resonance"
              label=""
              value={getState('resonance').value ?? 64}
              highlighted={isHighlighted('resonance')}
              outerSize={40}
              innerSize={28}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1024,
            top: 72,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            RESONANCE
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 966,
              top: 90,
              width: 40,
              height: 25,
            }}
          >
            <div>
              <PanelButton
                id="osc"
                label=""
                width={40}
                height={25}
                active={getState('osc').active}
                highlighted={isHighlighted('osc')}
                onClick={() => onButtonClick?.('osc')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 956,
            top: 78,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            OSC
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1006,
              top: 90,
              width: 40,
              height: 25,
            }}
          >
            <div>
              <PanelButton
                id="filter-type"
                label=""
                width={40}
                height={25}
                active={getState('filter-type').active}
                highlighted={isHighlighted('filter-type')}
                onClick={() => onButtonClick?.('filter-type')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 996,
            top: 78,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            FILTER TYPE
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1046,
              top: 90,
              width: 40,
              height: 25,
            }}
          >
            <div>
              <PanelButton
                id="param"
                label=""
                width={40}
                height={25}
                active={getState('param').active}
                highlighted={isHighlighted('param')}
                onClick={() => onButtonClick?.('param')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1036,
            top: 78,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            PARAM
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 966,
              top: 120,
              width: 40,
              height: 25,
            }}
          >
            <div>
              <PanelButton
                id="amp"
                label=""
                width={40}
                height={25}
                active={getState('amp').active}
                highlighted={isHighlighted('amp')}
                onClick={() => onButtonClick?.('amp')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 956,
            top: 108,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            AMP
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1006,
              top: 120,
              width: 40,
              height: 25,
            }}
          >
            <div>
              <PanelButton
                id="fx"
                label=""
                width={40}
                height={25}
                active={getState('fx').active}
                highlighted={isHighlighted('fx')}
                onClick={() => onButtonClick?.('fx')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 996,
            top: 108,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            FX
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1046,
              top: 120,
              width: 40,
              height: 25,
            }}
          >
            <div>
              <PanelButton
                id="lfo"
                label=""
                width={40}
                height={25}
                active={getState('lfo').active}
                highlighted={isHighlighted('lfo')}
                onClick={() => onButtonClick?.('lfo')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1036,
            top: 108,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            LFO
          </span>
        </div>
      </div>
    </motion.div>
  );
}
