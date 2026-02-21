// Radar chart with color based on quality score (FIXED: was always green)

interface Props {
  scores: { label: string; value: number }[]; // 0-100
  qualityScore: number; // 1-10
}

export default function RadarChart({ scores, qualityScore }: Props) {
  // Color based on score instead of always green
  const color = qualityScore >= 7
    ? { fill: 'rgba(34, 197, 94, 0.2)', stroke: '#22c55e' }
    : qualityScore >= 4
    ? { fill: 'rgba(251, 191, 36, 0.2)', stroke: '#fbbf24' }
    : { fill: 'rgba(239, 68, 68, 0.2)', stroke: '#ef4444' };

  const center = 100;
  const radius = 50;
  const labelRadius = radius + 35;

  const points = scores.map((s, i) => ({
    angle: (360 / scores.length) * i,
    value: Math.min(100, Math.max(0, s.value)),
    label: s.label,
  }));

  const toXY = (angle: number, r: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: center + r * Math.cos(rad), y: center + r * Math.sin(rad) };
  };

  const polyPoints = points.map(p => {
    const { x, y } = toXY(p.angle, (p.value / 100) * radius);
    return `${x},${y}`;
  }).join(' ');

  const gridPoints = points.map(p => {
    const { x, y } = toXY(p.angle, radius);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="performance-chart-box">
      <div className="text-[13px] font-semibold text-foreground mb-2 text-center tracking-wide">
        PERFORMANCE
      </div>
      <svg width="180" height="180" viewBox="0 0 200 200" className="block mx-auto">
        <polygon points={gridPoints} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        {points.map((p, i) => {
          const end = toXY(p.angle, radius);
          return (
            <line key={`axis-${i}`} x1={center} y1={center} x2={end.x} y2={end.y}
              stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          );
        })}
        <polygon points={polyPoints} fill={color.fill} stroke={color.stroke} strokeWidth="2" />
        <circle cx={center} cy={center} r={2} fill="#ffffff" opacity={0.5} />
        {points.map((p, i) => {
          const pos = toXY(p.angle, (p.value / 100) * radius);
          return (
            <circle key={`dot-${i}`} cx={pos.x} cy={pos.y} r={3}
              fill={color.stroke} stroke="#ffffff" strokeWidth="1" />
          );
        })}
        {points.map((p, i) => {
          const pos = toXY(p.angle, labelRadius);
          return (
            <text key={`label-${i}`} x={pos.x} y={pos.y + 5}
              textAnchor="middle" fill="#cccccc" fontSize="12" fontWeight="600">
              {p.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
