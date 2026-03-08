'use client';

interface LevelMeterProps {
  id?: string;
  level?: number;
  segments?: number;
  width?: number;
  height?: number;
}

export default function LevelMeter({
  id,
  level = 0,
  segments = 8,
  width = 6,
  height = 80,
}: LevelMeterProps) {
  const segmentHeight = (height - (segments - 1) * 2) / segments;
  const activeSegments = Math.round((level / 127) * segments);

  return (
    <div
      className="flex flex-col-reverse gap-[2px]"
      style={{ width, height }}
      {...(id ? { 'data-control-id': id } : {})}
    >
      {Array.from({ length: segments }, (_, i) => {
        const isActive = i < activeSegments;
        const isRed = i >= segments - 2;
        const isYellow = i >= segments - 4 && !isRed;
        const activeColor = isRed ? '#ef4444' : isYellow ? '#eab308' : '#22c55e';

        return (
          <div
            key={i}
            className="rounded-[1px]"
            style={{
              width,
              height: segmentHeight,
              backgroundColor: isActive ? activeColor : '#1a1a1e',
              boxShadow: isActive ? `0 0 4px ${activeColor}44` : 'inset 0 1px 2px rgba(0,0,0,0.5)',
              opacity: isActive ? 1 : 0.4,
            }}
          />
        );
      })}
    </div>
  );
}
