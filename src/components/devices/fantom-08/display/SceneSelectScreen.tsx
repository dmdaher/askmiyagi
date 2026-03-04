'use client';

import { motion } from 'framer-motion';
import { DisplayState } from '@/types/display';
import { DISPLAY_COLORS } from '@/lib/constants';

interface SceneSelectScreenProps {
  displayState: DisplayState;
}

const SCENE_PRESETS = [
  { id: 'A001', name: 'Homecoming', level: 90 },
  { id: 'A002', name: 'MKii Tres', level: 80 },
  { id: 'A003', name: 'Ult.Str', level: 75 },
  { id: 'A004', name: 'Piano', level: 85 },
  { id: 'A005', name: 'Synth Ld', level: 100 },
  { id: 'A006', name: 'E.Piano', level: 70 },
  { id: 'A007', name: 'Strings', level: 90 },
  { id: 'A008', name: 'Organ', level: 80 },
  { id: 'A009', name: 'Pad Warm', level: 85 },
  { id: 'A010', name: 'BrassEns', level: 75 },
  { id: 'A011', name: 'Choir', level: 80 },
  { id: 'A012', name: 'Guitar', level: 70 },
  { id: 'A013', name: 'Bass Syn', level: 90 },
  { id: 'A014', name: 'Lead Syn', level: 85 },
  { id: 'A015', name: 'Clav', level: 75 },
  { id: 'A016', name: 'Vibes', level: 70 },
];

export default function SceneSelectScreen({ displayState }: SceneSelectScreenProps) {
  const activeSceneId = displayState.sceneNumber ?? 'A001';
  const sceneName = displayState.sceneName ?? 'Homecoming';
  const sceneDesc = 'Layer; SuperNATURAL Piano; Synth Pad';

  return (
    <div className="flex flex-col h-full font-mono">
      {/* Scene info header */}
      <div
        className="px-2.5 py-1 border-b"
        style={{ borderColor: DISPLAY_COLORS.border }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span
              className="text-[11px] tracking-wider"
              style={{ color: DISPLAY_COLORS.header }}
            >
              SCENE
            </span>
            <span className="text-[11px]" style={{ color: DISPLAY_COLORS.text }}>
              &#9656;
            </span>
          </div>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded border"
            style={{
              color: DISPLAY_COLORS.header,
              borderColor: DISPLAY_COLORS.border,
            }}
          >
            EDIT
          </span>
        </div>
        <div className="mt-0.5">
          <span
            className="text-[11px] font-bold"
            style={{ color: DISPLAY_COLORS.highlight }}
          >
            {activeSceneId}: {sceneName}
          </span>
        </div>
        <div className="mt-0.5">
          <span
            className="text-[10px]"
            style={{ color: DISPLAY_COLORS.zoneMuted }}
          >
            {sceneDesc}
          </span>
        </div>
      </div>

      {/* Scene grid - 4 columns x 4 rows */}
      <div className="flex-1 p-1.5 overflow-hidden">
        <div className="grid grid-cols-4 gap-1 h-full">
          {SCENE_PRESETS.map((scene, idx) => {
            const isActive = scene.id === activeSceneId;
            return (
              <motion.div
                key={scene.id}
                className="flex flex-col justify-between rounded px-1 py-0.5 overflow-hidden"
                style={{
                  backgroundColor: isActive
                    ? `${DISPLAY_COLORS.active}25`
                    : `${DISPLAY_COLORS.border}40`,
                  border: isActive
                    ? `1px solid ${DISPLAY_COLORS.active}`
                    : `1px solid ${DISPLAY_COLORS.border}60`,
                }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15, delay: idx * 0.015 }}
              >
                <div className="flex items-center justify-end">
                  <span
                    className="text-[11px]"
                    style={{ color: DISPLAY_COLORS.zoneMuted }}
                  >
                    LEV:{scene.level}
                  </span>
                </div>
                <div className="flex items-center gap-0.5">
                  {isActive && (
                    <span
                      className="w-1 h-1 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: DISPLAY_COLORS.active }}
                    />
                  )}
                  <span
                    className="text-[10px] font-bold truncate"
                    style={{
                      color: isActive ? DISPLAY_COLORS.active : DISPLAY_COLORS.text,
                    }}
                  >
                    {scene.id}
                  </span>
                </div>
                <span
                  className="text-[11px] truncate"
                  style={{ color: DISPLAY_COLORS.text }}
                >
                  {scene.name}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
