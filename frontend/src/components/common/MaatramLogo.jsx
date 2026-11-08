
import React from "react";
import logoImg from "../../assets/maatram_logo.png";
import iconImg from "../../assets/logo_icon.jpg";

export default function MaatramLogo({
  size = "md",
  showTagline = false,
  theme = "dark",
  className = "",
  iconOnly = false,
}) {
  // Extra-large logo size options
  const heights = {
    sm: 55,
    md: 65,
    lg: 105,
    xl: 150,
    xxl: 200,
    xxxl: 260,
  };

  const h = heights[size] || 65;

  // Icon-only version
  if (iconOnly) {
    return (
      <div
        className={`maatram-brand icon-only ${className}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          userSelect: "none",
        }}
        title="Maatram Foundation"
      >
        <img
          src={iconImg}
          alt="Maatram Icon"
          style={{
            height: h,
            width: h,
            maxWidth: "95vw",
            objectFit: "contain",
            borderRadius: 8,
            display: "block",
          }}
        />
      </div>
    );
  }

  // Full Maatram logo
  return (
    <div
      className={`maatram-brand ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
      }}
      title="Maatram Foundation"
    >
      <img
        src={logoImg}
        alt="Maatram Foundation"
        style={{
          height: h,
          width: "auto",
          maxWidth: "95vw",
          objectFit: "contain",
          display: "block",
        }}
      />
    </div>
  );
}
