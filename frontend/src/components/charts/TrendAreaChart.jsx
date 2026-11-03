import React, { useState } from "react";

export default function TrendAreaChart({
  data = [],
  height = 200,
  accentColor = "#FFD629",
  fillColor = "rgba(255, 214, 41, 0.22)",
  valueKey = "hours",
  labelKey = "month",
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => d[valueKey] || 0), 10);
  const paddingLeft = 36;
  const paddingRight = 16;
  const paddingTop = 20;
  const paddingBottom = 30;

  const width = 500; // SVG coordinate width
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const points = data.map((d, i) => {
    const x = paddingLeft + (i / (data.length - 1)) * plotWidth;
    const y = paddingTop + plotHeight - ((d[valueKey] || 0) / maxVal) * plotHeight;
    return { x, y, data: d };
  });

  const linePath = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cpX = (prev.x + p.x) / 2;
    return `${acc} C ${cpX} ${prev.y}, ${cpX} ${p.y}, ${p.x} ${p.y}`;
  }, "");

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${
    paddingTop + plotHeight
  } L ${points[0].x} ${paddingTop + plotHeight} Z`;

  return (
    <div style={{ width: "100%", position: "relative" }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", height: "auto", overflow: "visible" }}
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.45" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0, 0.5, 1].map((ratio, i) => {
          const y = paddingTop + plotHeight * (1 - ratio);
          return (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="#E9ECF2"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={paddingLeft - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="#94A3B8"
                fontWeight="500"
              >
                {Math.round(ratio * maxVal)}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill="url(#areaGradient)" />

        {/* Curve stroke */}
        <path
          d={linePath}
          fill="none"
          stroke={accentColor}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((p, idx) => {
          const isHovered = hoveredPoint?.data === p.data;
          return (
            <g
              key={idx}
              onMouseEnter={() => setHoveredPoint(p)}
              onMouseLeave={() => setHoveredPoint(null)}
              style={{ cursor: "pointer" }}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={isHovered ? 7 : 4.5}
                fill="#FFFFFF"
                stroke={accentColor}
                strokeWidth="3"
                style={{ transition: "all 0.2s ease" }}
              />

              {/* X Axis Label */}
              <text
                x={p.x}
                y={height - 8}
                textAnchor="middle"
                fontSize="11.5"
                fontWeight={isHovered ? "700" : "500"}
                fill={isHovered ? "#151515" : "#717784"}
              >
                {p.data[labelKey]}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating tooltip */}
      {hoveredPoint && (
        <div
          style={{
            position: "absolute",
            left: `${(hoveredPoint.x / width) * 100}%`,
            top: 0,
            transform: "translate(-50%, -100%)",
            background: "#151515",
            color: "#FFFFFF",
            padding: "5px 10px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 10,
          }}
        >
          {hoveredPoint.data[labelKey]}: {hoveredPoint.data[valueKey]} hours
        </div>
      )}
    </div>
  );
}
