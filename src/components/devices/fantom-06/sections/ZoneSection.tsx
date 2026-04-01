'use client';

import { motion } from 'framer-motion';
import Knob from '@/components/controls/Knob';
import PanelButton from '@/components/controls/PanelButton';
import Slider from '@/components/controls/Slider';
import { PanelState } from '@/types/panel';

interface ZoneSectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function ZoneSection({
  panelState,
  highlightedControls,
  onButtonClick,
}: ZoneSectionProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.05 }}
    >
      <div data-section-id="zone">
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '12.50%',
              top: '17.50%',
              width: '6.00%',
              height: '13.30%',
            }}
          >
            <Knob
              id="master-volume"
              label=""
              value={getState('master-volume').value ?? 64}
              highlighted={isHighlighted('master-volume')}
              outerSize={48}
              innerSize={34}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '12.5%',
            top: '31.0%',
            width: '6.0%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            MASTER VOLUME
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '15.50%',
              top: '12.90%',
              width: '4.70%',
              height: '8.90%',
            }}
          >
            <div>
              <PanelButton
                id="pan-level"
                label=""
                size="sm"
                active={getState('pan-level').active}
                highlighted={isHighlighted('pan-level')}
                onClick={() => onButtonClick?.('pan-level')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '15.5%',
            top: '11.7%',
            width: '4.7%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            PAN/LEVEL
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '18.50%',
              top: '13.20%',
              width: '2.00%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="ctrl"
                label=""
                size="sm"
                active={getState('ctrl').active}
                highlighted={isHighlighted('ctrl')}
                onClick={() => onButtonClick?.('ctrl')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '18.5%',
            top: '12.0%',
            width: '2.0%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            CTRL
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '16.90%',
              top: '24.10%',
              width: '5.30%',
              height: '3.30%',
            }}
          >
            <div>
              <PanelButton
                id="assign"
                label=""
                size="sm"
                active={getState('assign').active}
                highlighted={isHighlighted('assign')}
                onClick={() => onButtonClick?.('assign')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '16.9%',
            top: '22.9%',
            width: '5.3%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            ASSIGN
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '16.10%',
              top: '29.40%',
              width: '3.00%',
              height: '3.30%',
            }}
          >
            <div>
              <PanelButton
                id="zone-9-16"
                label=""
                size="sm"
                active={getState('zone-9-16').active}
                highlighted={isHighlighted('zone-9-16')}
                onClick={() => onButtonClick?.('zone-9-16')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '16.1%',
            top: '28.2%',
            width: '3.0%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            ZONE 9-16
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '16.90%',
              top: '28.70%',
              width: '5.30%',
              height: '5.50%',
            }}
          >
            <div>
              <PanelButton
                id="zone-select"
                label=""
                size="sm"
                active={getState('zone-select').active}
                highlighted={isHighlighted('zone-select')}
                onClick={() => onButtonClick?.('zone-select')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '16.9%',
            top: '27.5%',
            width: '5.3%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            ZONE SELECT
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '20.50%',
              top: '13.40%',
              width: '3.30%',
              height: '8.90%',
            }}
          >
            <Knob
              id="knob-1"
              label=""
              value={getState('knob-1').value ?? 64}
              highlighted={isHighlighted('knob-1')}
              outerSize={32}
              innerSize={22}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '20.5%',
            top: '22.5%',
            width: '3.3%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            1
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '22.80%',
              top: '13.20%',
              width: '3.50%',
              height: '7.80%',
            }}
          >
            <Knob
              id="knob-2"
              label=""
              value={getState('knob-2').value ?? 64}
              highlighted={isHighlighted('knob-2')}
              outerSize={28}
              innerSize={20}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '22.8%',
            top: '21.2%',
            width: '3.5%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            2
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '24.80%',
              top: '13.40%',
              width: '3.70%',
              height: '7.80%',
            }}
          >
            <Knob
              id="knob-3"
              label=""
              value={getState('knob-3').value ?? 64}
              highlighted={isHighlighted('knob-3')}
              outerSize={28}
              innerSize={20}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '24.8%',
            top: '21.4%',
            width: '3.7%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            3
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '26.90%',
              top: '13.20%',
              width: '3.50%',
              height: '7.80%',
            }}
          >
            <Knob
              id="knob-4"
              label=""
              value={getState('knob-4').value ?? 64}
              highlighted={isHighlighted('knob-4')}
              outerSize={28}
              innerSize={20}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '26.9%',
            top: '21.2%',
            width: '3.5%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            4
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '29.20%',
              top: '13.20%',
              width: '3.50%',
              height: '7.80%',
            }}
          >
            <Knob
              id="knob-5"
              label=""
              value={getState('knob-5').value ?? 64}
              highlighted={isHighlighted('knob-5')}
              outerSize={28}
              innerSize={20}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '29.2%',
            top: '21.2%',
            width: '3.5%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            5
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '31.70%',
              top: '12.60%',
              width: '3.30%',
              height: '8.90%',
            }}
          >
            <Knob
              id="knob-6"
              label=""
              value={getState('knob-6').value ?? 64}
              highlighted={isHighlighted('knob-6')}
              outerSize={32}
              innerSize={22}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '31.7%',
            top: '21.7%',
            width: '3.3%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            6
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '33.90%',
              top: '12.60%',
              width: '3.30%',
              height: '8.90%',
            }}
          >
            <Knob
              id="knob-7"
              label=""
              value={getState('knob-7').value ?? 64}
              highlighted={isHighlighted('knob-7')}
              outerSize={32}
              innerSize={22}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '33.9%',
            top: '21.7%',
            width: '3.3%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            7
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '35.80%',
              top: '13.20%',
              width: '3.50%',
              height: '7.80%',
            }}
          >
            <Knob
              id="knob-8"
              label=""
              value={getState('knob-8').value ?? 64}
              highlighted={isHighlighted('knob-8')}
              outerSize={28}
              innerSize={20}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '35.8%',
            top: '21.2%',
            width: '3.5%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            8
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '20.20%',
              top: '25.20%',
              width: '3.70%',
              height: '4.40%',
            }}
          >
            <div>
              <PanelButton
                id="zone-int-ext-1"
                label=""
                size="sm"
                active={getState('zone-int-ext-1').active}
                highlighted={isHighlighted('zone-int-ext-1')}
                onClick={() => onButtonClick?.('zone-int-ext-1')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '20.2%',
            top: '24.0%',
            width: '3.7%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            1
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '22.40%',
              top: '24.90%',
              width: '3.30%',
              height: '4.40%',
            }}
          >
            <div>
              <PanelButton
                id="zone-int-ext-2"
                label=""
                size="sm"
                active={getState('zone-int-ext-2').active}
                highlighted={isHighlighted('zone-int-ext-2')}
                onClick={() => onButtonClick?.('zone-int-ext-2')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '22.4%',
            top: '23.7%',
            width: '3.3%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            2
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '24.60%',
              top: '24.90%',
              width: '3.30%',
              height: '4.40%',
            }}
          >
            <div>
              <PanelButton
                id="zone-int-ext-3"
                label=""
                size="sm"
                active={getState('zone-int-ext-3').active}
                highlighted={isHighlighted('zone-int-ext-3')}
                onClick={() => onButtonClick?.('zone-int-ext-3')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '24.6%',
            top: '23.7%',
            width: '3.3%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            3
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '27.10%',
              top: '24.60%',
              width: '3.30%',
              height: '4.40%',
            }}
          >
            <div>
              <PanelButton
                id="zone-int-ext-4"
                label=""
                size="sm"
                active={getState('zone-int-ext-4').active}
                highlighted={isHighlighted('zone-int-ext-4')}
                onClick={() => onButtonClick?.('zone-int-ext-4')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '27.1%',
            top: '23.4%',
            width: '3.3%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            4
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '29.10%',
              top: '25.40%',
              width: '3.70%',
              height: '4.40%',
            }}
          >
            <div>
              <PanelButton
                id="zone-int-ext-5"
                label=""
                size="sm"
                active={getState('zone-int-ext-5').active}
                highlighted={isHighlighted('zone-int-ext-5')}
                onClick={() => onButtonClick?.('zone-int-ext-5')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '29.1%',
            top: '24.2%',
            width: '3.7%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            5
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '31.50%',
              top: '25.40%',
              width: '3.30%',
              height: '4.40%',
            }}
          >
            <div>
              <PanelButton
                id="zone-int-ext-6"
                label=""
                size="sm"
                active={getState('zone-int-ext-6').active}
                highlighted={isHighlighted('zone-int-ext-6')}
                onClick={() => onButtonClick?.('zone-int-ext-6')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '31.5%',
            top: '24.2%',
            width: '3.3%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            6
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '33.70%',
              top: '25.80%',
              width: '3.30%',
              height: '3.30%',
            }}
          >
            <div>
              <PanelButton
                id="zone-int-ext-7"
                label=""
                size="sm"
                active={getState('zone-int-ext-7').active}
                highlighted={isHighlighted('zone-int-ext-7')}
                onClick={() => onButtonClick?.('zone-int-ext-7')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '33.7%',
            top: '24.6%',
            width: '3.3%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            7
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '35.80%',
              top: '25.40%',
              width: '3.70%',
              height: '3.30%',
            }}
          >
            <div>
              <PanelButton
                id="zone-int-ext-8"
                label=""
                size="sm"
                active={getState('zone-int-ext-8').active}
                highlighted={isHighlighted('zone-int-ext-8')}
                onClick={() => onButtonClick?.('zone-int-ext-8')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '35.8%',
            top: '24.2%',
            width: '3.7%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            8
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '21.40%',
              top: '24.70%',
              width: '2.00%',
              height: '35.50%',
            }}
          >
            <Slider
              id="slider-1"
              label=""
              value={getState('slider-1').value ?? 64}
              highlighted={isHighlighted('slider-1')}
              trackHeight={108}
              trackWidth={14}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '21.4%',
            top: '60.4%',
            width: '2.0%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            1
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '23.80%',
              top: '23.30%',
              width: '2.00%',
              height: '35.50%',
            }}
          >
            <Slider
              id="slider-2"
              label=""
              value={getState('slider-2').value ?? 64}
              highlighted={isHighlighted('slider-2')}
              trackHeight={108}
              trackWidth={14}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '23.8%',
            top: '59.0%',
            width: '2.0%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            2
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '25.80%',
              top: '23.30%',
              width: '2.00%',
              height: '35.50%',
            }}
          >
            <Slider
              id="slider-3"
              label=""
              value={getState('slider-3').value ?? 64}
              highlighted={isHighlighted('slider-3')}
              trackHeight={108}
              trackWidth={14}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '25.8%',
            top: '59.0%',
            width: '2.0%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            3
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '27.80%',
              top: '22.40%',
              width: '2.00%',
              height: '35.50%',
            }}
          >
            <Slider
              id="slider-4"
              label=""
              value={getState('slider-4').value ?? 64}
              highlighted={isHighlighted('slider-4')}
              trackHeight={108}
              trackWidth={14}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '27.8%',
            top: '58.1%',
            width: '2.0%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            4
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '30.30%',
              top: '22.40%',
              width: '2.00%',
              height: '35.50%',
            }}
          >
            <Slider
              id="slider-5"
              label=""
              value={getState('slider-5').value ?? 64}
              highlighted={isHighlighted('slider-5')}
              trackHeight={108}
              trackWidth={14}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '30.3%',
            top: '58.1%',
            width: '2.0%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            5
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '32.40%',
              top: '22.20%',
              width: '2.00%',
              height: '35.50%',
            }}
          >
            <Slider
              id="slider-6"
              label=""
              value={getState('slider-6').value ?? 64}
              highlighted={isHighlighted('slider-6')}
              trackHeight={108}
              trackWidth={14}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '32.4%',
            top: '57.9%',
            width: '2.0%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            6
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '34.80%',
              top: '23.00%',
              width: '2.00%',
              height: '35.50%',
            }}
          >
            <Slider
              id="slider-7"
              label=""
              value={getState('slider-7').value ?? 64}
              highlighted={isHighlighted('slider-7')}
              trackHeight={108}
              trackWidth={14}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '34.8%',
            top: '58.7%',
            width: '2.0%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            7
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '36.90%',
              top: '22.70%',
              width: '2.00%',
              height: '35.50%',
            }}
          >
            <Slider
              id="slider-8"
              label=""
              value={getState('slider-8').value ?? 64}
              highlighted={isHighlighted('slider-8')}
              trackHeight={108}
              trackWidth={14}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '36.9%',
            top: '58.4%',
            width: '2.0%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            8
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '13.30%',
              top: '35.60%',
              width: '4.70%',
              height: '4.40%',
            }}
          >
            <div>
              <PanelButton
                id="split"
                label=""
                size="sm"
                active={getState('split').active}
                highlighted={isHighlighted('split')}
                onClick={() => onButtonClick?.('split')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '13.3%',
            top: '34.4%',
            width: '4.7%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            SPLIT
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '15.20%',
              top: '35.20%',
              width: '4.70%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="chord-memory"
                label=""
                size="sm"
                active={getState('chord-memory').active}
                highlighted={isHighlighted('chord-memory')}
                onClick={() => onButtonClick?.('chord-memory')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '15.2%',
            top: '34.0%',
            width: '4.7%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            CHORD MEMORY
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '18.00%',
              top: '36.30%',
              width: '3.70%',
              height: '3.30%',
            }}
          >
            <div>
              <PanelButton
                id="arpeggio"
                label=""
                size="sm"
                active={getState('arpeggio').active}
                highlighted={isHighlighted('arpeggio')}
                onClick={() => onButtonClick?.('arpeggio')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '18.0%',
            top: '35.1%',
            width: '3.7%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            ARPEGGIO
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '12.60%',
              top: '42.70%',
              width: '5.00%',
              height: '3.30%',
            }}
          >
            <div>
              <PanelButton
                id="transpose"
                label=""
                size="sm"
                active={getState('transpose').active}
                highlighted={isHighlighted('transpose')}
                onClick={() => onButtonClick?.('transpose')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '12.6%',
            top: '41.5%',
            width: '5.0%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            TRANSPOSE
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '15.20%',
              top: '42.90%',
              width: '4.70%',
              height: '3.30%',
            }}
          >
            <div>
              <PanelButton
                id="octave-down"
                label=""
                size="sm"
                active={getState('octave-down').active}
                highlighted={isHighlighted('octave-down')}
                onClick={() => onButtonClick?.('octave-down')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '15.2%',
            top: '41.7%',
            width: '4.7%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            DOWN
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '17.00%',
              top: '42.70%',
              width: '5.00%',
              height: '3.30%',
            }}
          >
            <div>
              <PanelButton
                id="octave-up"
                label=""
                size="sm"
                active={getState('octave-up').active}
                highlighted={isHighlighted('octave-up')}
                onClick={() => onButtonClick?.('octave-up')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '17.0%',
            top: '41.5%',
            width: '5.0%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            UP
          </span>
        </div>
      </div>
    </motion.div>
  );
}
