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
              left: '13.70%',
              top: '38.30%',
              width: '3.70%',
              height: '12.10%',
            }}
          >
            <Knob
              id="master-volume"
              label=""
              value={getState('master-volume').value ?? 64}
              highlighted={isHighlighted('master-volume')}
              outerSize={44}
              innerSize={31}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '13.7%',
            top: '50.6%',
            width: '3.7%',
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
              left: '15.30%',
              top: '24.40%',
              width: '4.70%',
              height: '16.10%',
            }}
          >
            <div>
              <PanelButton
                id="pan-level"
                label=""
                width={56}
                height={58}
                active={getState('pan-level').active}
                highlighted={isHighlighted('pan-level')}
                onClick={() => onButtonClick?.('pan-level')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '15.3%',
            top: '23.2%',
            width: '4.7%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            PAN/ LEVEL
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '18.50%',
              top: '28.50%',
              width: '2.00%',
              height: '6.00%',
            }}
          >
            <div>
              <PanelButton
                id="ctrl"
                label=""
                width={24}
                height={22}
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
            top: '27.3%',
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
              left: '16.70%',
              top: '40.80%',
              width: '5.30%',
              height: '6.00%',
            }}
          >
            <div>
              <PanelButton
                id="assign"
                label=""
                width={64}
                height={22}
                active={getState('assign').active}
                highlighted={isHighlighted('assign')}
                onClick={() => onButtonClick?.('assign')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '16.7%',
            top: '39.6%',
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
              top: '53.40%',
              width: '3.00%',
              height: '6.00%',
            }}
          >
            <div>
              <PanelButton
                id="zone-9-16"
                label=""
                width={36}
                height={22}
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
            top: '52.2%',
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
              left: '16.80%',
              top: '51.80%',
              width: '5.30%',
              height: '10.10%',
            }}
          >
            <div>
              <PanelButton
                id="zone-select"
                label=""
                width={64}
                height={36}
                active={getState('zone-select').active}
                highlighted={isHighlighted('zone-select')}
                onClick={() => onButtonClick?.('zone-select')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '16.8%',
            top: '50.6%',
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
              left: '20.60%',
              top: '25.00%',
              width: '3.30%',
              height: '16.10%',
            }}
          >
            <Knob
              id="knob-1"
              label=""
              value={getState('knob-1').value ?? 64}
              highlighted={isHighlighted('knob-1')}
              outerSize={40}
              innerSize={28}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '20.6%',
            top: '41.3%',
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
              top: '23.90%',
              width: '3.50%',
              height: '14.10%',
            }}
          >
            <Knob
              id="knob-2"
              label=""
              value={getState('knob-2').value ?? 64}
              highlighted={isHighlighted('knob-2')}
              outerSize={42}
              innerSize={29}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '22.8%',
            top: '38.2%',
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
              top: '24.40%',
              width: '3.70%',
              height: '14.10%',
            }}
          >
            <Knob
              id="knob-3"
              label=""
              value={getState('knob-3').value ?? 64}
              highlighted={isHighlighted('knob-3')}
              outerSize={44}
              innerSize={31}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '24.8%',
            top: '38.7%',
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
              left: '27.00%',
              top: '24.40%',
              width: '3.50%',
              height: '14.10%',
            }}
          >
            <Knob
              id="knob-4"
              label=""
              value={getState('knob-4').value ?? 64}
              highlighted={isHighlighted('knob-4')}
              outerSize={42}
              innerSize={29}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '27.0%',
            top: '38.7%',
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
              top: '23.90%',
              width: '3.50%',
              height: '14.10%',
            }}
          >
            <Knob
              id="knob-5"
              label=""
              value={getState('knob-5').value ?? 64}
              highlighted={isHighlighted('knob-5')}
              outerSize={42}
              innerSize={29}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '29.2%',
            top: '38.2%',
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
              top: '22.90%',
              width: '3.30%',
              height: '16.10%',
            }}
          >
            <Knob
              id="knob-6"
              label=""
              value={getState('knob-6').value ?? 64}
              highlighted={isHighlighted('knob-6')}
              outerSize={40}
              innerSize={28}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '31.7%',
            top: '39.2%',
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
              top: '22.90%',
              width: '3.30%',
              height: '16.10%',
            }}
          >
            <Knob
              id="knob-7"
              label=""
              value={getState('knob-7').value ?? 64}
              highlighted={isHighlighted('knob-7')}
              outerSize={40}
              innerSize={28}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '33.9%',
            top: '39.2%',
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
              top: '23.90%',
              width: '3.50%',
              height: '14.10%',
            }}
          >
            <Knob
              id="knob-8"
              label=""
              value={getState('knob-8').value ?? 64}
              highlighted={isHighlighted('knob-8')}
              outerSize={42}
              innerSize={29}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '35.8%',
            top: '38.2%',
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
              top: '45.80%',
              width: '3.70%',
              height: '8.10%',
            }}
          >
            <div>
              <PanelButton
                id="zone-int-ext-1"
                label=""
                width={44}
                height={29}
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
            top: '44.6%',
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
              top: '45.20%',
              width: '3.30%',
              height: '8.10%',
            }}
          >
            <div>
              <PanelButton
                id="zone-int-ext-2"
                label=""
                width={40}
                height={29}
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
            top: '44.0%',
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
              top: '45.30%',
              width: '3.30%',
              height: '8.10%',
            }}
          >
            <div>
              <PanelButton
                id="zone-int-ext-3"
                label=""
                width={40}
                height={29}
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
            top: '44.1%',
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
              top: '44.70%',
              width: '3.30%',
              height: '8.10%',
            }}
          >
            <div>
              <PanelButton
                id="zone-int-ext-4"
                label=""
                width={40}
                height={29}
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
            top: '43.5%',
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
              top: '46.20%',
              width: '3.70%',
              height: '8.10%',
            }}
          >
            <div>
              <PanelButton
                id="zone-int-ext-5"
                label=""
                width={44}
                height={29}
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
            top: '45.0%',
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
              top: '46.20%',
              width: '3.30%',
              height: '8.10%',
            }}
          >
            <div>
              <PanelButton
                id="zone-int-ext-6"
                label=""
                width={40}
                height={29}
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
            top: '45.0%',
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
              top: '46.80%',
              width: '3.30%',
              height: '6.00%',
            }}
          >
            <div>
              <PanelButton
                id="zone-int-ext-7"
                label=""
                width={40}
                height={22}
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
            top: '45.6%',
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
              top: '46.20%',
              width: '3.70%',
              height: '6.00%',
            }}
          >
            <div>
              <PanelButton
                id="zone-int-ext-8"
                label=""
                width={44}
                height={22}
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
            top: '45.0%',
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
              top: '52.90%',
              width: '2.00%',
              height: '36.30%',
            }}
          >
            <Slider
              id="slider-1"
              label=""
              value={getState('slider-1').value ?? 64}
              highlighted={isHighlighted('slider-1')}
              trackHeight={111}
              trackWidth={14}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '21.4%',
            top: '89.4%',
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
              top: '52.40%',
              width: '2.00%',
              height: '36.30%',
            }}
          >
            <Slider
              id="slider-2"
              label=""
              value={getState('slider-2').value ?? 64}
              highlighted={isHighlighted('slider-2')}
              trackHeight={111}
              trackWidth={14}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '23.8%',
            top: '88.9%',
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
              top: '52.40%',
              width: '2.00%',
              height: '36.30%',
            }}
          >
            <Slider
              id="slider-3"
              label=""
              value={getState('slider-3').value ?? 64}
              highlighted={isHighlighted('slider-3')}
              trackHeight={111}
              trackWidth={14}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '25.8%',
            top: '88.9%',
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
              left: '28.10%',
              top: '52.40%',
              width: '2.00%',
              height: '36.30%',
            }}
          >
            <Slider
              id="slider-4"
              label=""
              value={getState('slider-4').value ?? 64}
              highlighted={isHighlighted('slider-4')}
              trackHeight={111}
              trackWidth={14}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '28.1%',
            top: '88.9%',
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
              left: '30.60%',
              top: '52.90%',
              width: '2.00%',
              height: '36.30%',
            }}
          >
            <Slider
              id="slider-5"
              label=""
              value={getState('slider-5').value ?? 64}
              highlighted={isHighlighted('slider-5')}
              trackHeight={111}
              trackWidth={14}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '30.6%',
            top: '89.4%',
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
              left: '32.80%',
              top: '52.40%',
              width: '2.00%',
              height: '36.30%',
            }}
          >
            <Slider
              id="slider-6"
              label=""
              value={getState('slider-6').value ?? 64}
              highlighted={isHighlighted('slider-6')}
              trackHeight={111}
              trackWidth={14}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '32.8%',
            top: '88.9%',
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
              left: '34.90%',
              top: '52.90%',
              width: '2.00%',
              height: '36.30%',
            }}
          >
            <Slider
              id="slider-7"
              label=""
              value={getState('slider-7').value ?? 64}
              highlighted={isHighlighted('slider-7')}
              trackHeight={111}
              trackWidth={14}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '34.9%',
            top: '89.4%',
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
              left: '36.70%',
              top: '53.90%',
              width: '2.00%',
              height: '36.30%',
            }}
          >
            <Slider
              id="slider-8"
              label=""
              value={getState('slider-8').value ?? 64}
              highlighted={isHighlighted('slider-8')}
              trackHeight={111}
              trackWidth={14}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '36.7%',
            top: '90.4%',
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
              left: '13.20%',
              top: '64.20%',
              width: '4.70%',
              height: '8.10%',
            }}
          >
            <div>
              <PanelButton
                id="split"
                label=""
                width={56}
                height={29}
                active={getState('split').active}
                highlighted={isHighlighted('split')}
                onClick={() => onButtonClick?.('split')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '13.2%',
            top: '63.0%',
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
              left: '15.40%',
              top: '63.00%',
              width: '4.70%',
              height: '14.10%',
            }}
          >
            <div>
              <PanelButton
                id="chord-memory"
                label=""
                width={56}
                height={51}
                active={getState('chord-memory').active}
                highlighted={isHighlighted('chord-memory')}
                onClick={() => onButtonClick?.('chord-memory')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '15.4%',
            top: '61.8%',
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
              left: '17.70%',
              top: '66.50%',
              width: '3.70%',
              height: '6.00%',
            }}
          >
            <div>
              <PanelButton
                id="arpeggio"
                label=""
                width={44}
                height={22}
                active={getState('arpeggio').active}
                highlighted={isHighlighted('arpeggio')}
                onClick={() => onButtonClick?.('arpeggio')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '17.7%',
            top: '65.3%',
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
              left: '13.10%',
              top: '78.10%',
              width: '5.00%',
              height: '6.00%',
            }}
          >
            <div>
              <PanelButton
                id="transpose"
                label=""
                width={60}
                height={22}
                active={getState('transpose').active}
                highlighted={isHighlighted('transpose')}
                onClick={() => onButtonClick?.('transpose')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '13.1%',
            top: '76.9%',
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
              top: '78.10%',
              width: '4.70%',
              height: '16.10%',
            }}
          >
            <div>
              <PanelButton
                id="octave-down"
                label=""
                width={56}
                height={58}
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
            top: '76.9%',
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
              left: '17.80%',
              top: '78.60%',
              width: '3.30%',
              height: '8.10%',
            }}
          >
            <div>
              <PanelButton
                id="octave-up"
                label=""
                width={40}
                height={29}
                active={getState('octave-up').active}
                highlighted={isHighlighted('octave-up')}
                onClick={() => onButtonClick?.('octave-up')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '17.8%',
            top: '77.4%',
            width: '3.3%',
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
