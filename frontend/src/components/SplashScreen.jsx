
import React, { useEffect } from "react";
import "./SplashScreen.css";
import maatramLogo from "../assets/maatram_logo.png";

export default function SplashScreen({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish?.();
    }, 2800);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <main className="splash-screen">

      {/* Split Background */}
      <div className="splash-white-section" />
      <div className="splash-yellow-section" />

      {/* Center Logo and Loader */}
      <div className="splash-content">

        <div className="splash-logo-container">
          <img
            src={maatramLogo}
            alt="Maatram Foundation"
            className="splash-logo"
          />
        </div>

        {/* Animated Loading Dots */}
        <div className="splash-loader">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>

      </div>

    </main>
  );
}
