import React, { useState } from "react";

export default function BarChart({
  data = [],
  height = 180,
  barColor = "#FFD629",
  valueKey = "hours",
  labelKey = "name",
}) {
  const [hoveredBar, setHoveredBar] = useState(null);

  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => d[valueKey] || 0), 10);
  const width = 500;
  const paddingLeft = 36;
  const paddingRight = 16;
  const paddingTop = 16;
  const paddingBottom = 32;

  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;
  const barGap = 16;
  const barWidth = Math.max(12, (plotWidth - (data.length - 1) * barGap) / data.length);

  return (
    <div style={{ width: "100%", position: "relative" }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", height: "auto", overflow: "visible" }}
      >
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

        {/* Bars */}
        {data.map((d, i) => {
          const val = d[valueKey] || 0;
          const barH = (val / maxVal) * plotHeight;
          const x = paddingLeft + i * (barWidth + barGap);
          const y = paddingTop + plotHeight - barH;
          const isHovered = hoveredBar === d;

          return (
            <g
              key={i}
              onMouseEnter={() => setHoveredBar(d)}
              onMouseLeave={() => setHoveredBar(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Background slot */}
              <rect
                x={x}
                y={paddingTop}
                width={barWidth}
                height={plotHeight}
                rx={6}
                fill="#F7F8FA"
              />

              {/* Active Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={6}
                fill={d.color || barColor}
                style={{
                  transition: "all 0.25s ease",
                  filter: isHovered ? "brightness(1.08)" : "none",
                }}
              />

              {/* Label */}
              <text
                x={x + barWidth / 2}
                y={height - 10}
                textAnchor="middle"
                fontSize="11"
                fontWeight={isHovered ? "700" : "500"}
                fill={isHovered ? "#151515" : "#717784"}
              >
                {d[labelKey].length > 10 ? `${d[labelKey].slice(0, 8)}…` : d[labelKey]}
              </text>
            </g>
          );
        })}
      </svg>

      {hoveredBar && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translate(-50%, -100%)",
            background: "#151515",
            color: "#FFFFFF",
            padding: "5px 12px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            pointerEvents: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 10,
          }}
        >
          {hoveredBar[labelKey]}: {hoveredBar[valueKey]} hrs
        </div>
      )}
    </div>
  );
}
