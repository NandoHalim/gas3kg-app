import React, { useMemo } from "react";
export default function StockDonut({ data = [], size = 180, thickness = 22 }) {
  const total = useMemo(() => data.reduce((a, d) => a + (d.value || 0), 0), [data]);
  const radius = size / 2;
  const inner = radius - thickness;
  let acc = 0;
  const segs = data.map((d) => {
    const val = d.value || 0;
    const frac = total ? val / total : 0;
    const start = acc * 2 * Math.PI - Math.PI / 2;
    const end = (acc + frac) * 2 * Math.PI - Math.PI / 2;
    acc += frac;
    const large = end - start > Math.PI ? 1 : 0;
    const x0 = radius + inner * Math.cos(start);
    const y0 = radius + inner * Math.sin(start);
    const x1 = radius + inner * Math.cos(end);
    const y1 = radius + inner * Math.sin(end);
    const X0 = radius + radius * Math.cos(start);
    const Y0 = radius + radius * Math.sin(start);
    const X1 = radius + radius * Math.cos(end);
    const Y1 = radius + radius * Math.sin(end);
    const dpath = [
      `M ${x0} ${y0}`,
      `L ${X0} ${Y0}`,
      `A ${radius} ${radius} 0 ${large} 1 ${X1} ${Y1}`,
      `L ${x1} ${y1}`,
      `A ${inner} ${inner} 0 ${large} 0 ${x0} ${y0}`
    ].join(" ");
    return { dpath, color: d.color || "#aaa", key: d.label };
  });
  return (
    <svg width={size} height={size}>
      <g>
        {segs.map((s, i) => (
          <path key={s.key + i} d={s.dpath} fill={s.color} opacity={0.9} />
        ))}
        <circle cx={radius} cy={radius} r={inner - 1} fill="#fff" />
      </g>
    </svg>
  );
}