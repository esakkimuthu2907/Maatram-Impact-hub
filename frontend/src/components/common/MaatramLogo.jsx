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
  const heights = { sm: 32, md: 40, lg: 54, xl: 72 };
  const h = heights[size] || 40;

  if (iconOnly) {
    return (
      <div
        className={`maatram-brand icon-only ${className}`}
        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", userSelect: "none" }}
        title="Maatram Foundation"
      >
        <img
          src={iconImg}
          alt="Maatram Icon"
          style={{ height: h, width: h, objectFit: "contain", borderRadius: 8, display: "block" }}
        />
      </div>
    );
  }

  return (
    <div
      className={`maatram-brand ${className}`}
      style={{ display: "inline-flex", alignItems: "center", userSelect: "none" }}
    >
      <img
        src={logoImg}
        alt="Maatram Foundation"
        style={{ height: h, width: "auto", objectFit: "contain", display: "block" }}
      />
    </div>
  );
}
