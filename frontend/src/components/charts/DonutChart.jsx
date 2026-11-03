import React, { useState } from "react";

export default function DonutChart({
  data = [],
  size = 240,
  strokeWidth = 34,
  centerTitle = "Total Hours",
  centerValue = "24 hrs",
  className = "",
}) {
  const [activeItem, setActiveItem] = useState(null);

  const total = data.reduce((sum, item) => sum + (item.percentage || item.hours || 0), 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let accumulatedAngle = -90;

  return (
    <div
      className={`donut-chart-container ${className}`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
        width: "100%",
      }}
    >
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#F1F3F7"
            strokeWidth={strokeWidth}
          />

          {/* Slices */}
          {data.map((item, index) => {
            const val = item.percentage || item.hours || 0;
            const slicePercent = total > 0 ? val / total : 0;
            const strokeDash = slicePercent * circumference;
            const strokeGap = circumference - strokeDash;
            const rotation = accumulatedAngle;
            accumulatedAngle += slicePercent * 360;

            const isHovered = activeItem?.name === item.name;

            return (
              <circle
                key={index}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={item.color || "#FFD629"}
                strokeWidth={isHovered ? strokeWidth + 6 : strokeWidth}
                strokeDasharray={`${strokeDash} ${strokeGap}`}
                transform={`rotate(${rotation} ${center} ${center})`}
                strokeLinecap="butt"
                style={{
                  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                  cursor: "pointer",
                  filter: isHovered ? "drop-shadow(0 4px 10px rgba(0,0,0,0.18))" : "none",
                }}
                onMouseEnter={() => setActiveItem(item)}
                onMouseLeave={() => setActiveItem(null)}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#717784",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {activeItem ? activeItem.name : centerTitle}
          </span>
          <span
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#151515",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              marginTop: 2,
            }}
          >
            {activeItem
              ? `${activeItem.percentage || activeItem.hours}%`
              : centerValue}
          </span>
        </div>
      </div>

      {/* Legend Grid matching reference */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: "8px 16px",
          width: "100%",
        }}
      >
        {data.map((item, index) => {
          const isHovered = activeItem?.name === item.name;
          return (
            <div
              key={index}
              onMouseEnter={() => setActiveItem(item)}
              onMouseLeave={() => setActiveItem(null)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 10px",
                borderRadius: 8,
                background: isHovered ? "#F7F8FA" : "transparent",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: item.color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: isHovered ? 700 : 500,
                    color: "#151515",
                  }}
                >
                  {item.name}
                </span>
              </div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#717784",
                }}
              >
                {item.percentage}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
