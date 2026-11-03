
import React, { useEffect } from "react";
import "./SplashScreen.css";

export default function SplashScreen({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish?.();
    }, 2800);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <main className="splash-screen">
      {/* Top-left decoration */}
      <div className="corner-decoration top-left">
        <span className="corner-arc arc-one" />
        <span className="corner-arc arc-two" />
        <div className="corner-dots">
          <i />
          <i />
          <i />
        </div>
      </div>

      {/* Bottom-right decoration */}
      <div className="corner-decoration bottom-right">
        <span className="corner-arc arc-one" />
        <span className="corner-arc arc-two" />
        <div className="corner-dots">
          <i />
          <i />
          <i />
        </div>
      </div>

      {/* Centered brand logo */}
      <div className="splash-logo-wrapper">
        <img
          className="splash-logo"
          src="/maatram-logo.png"
          alt="Maatram Foundation"
        />
      </div>

      <span className="splash-shadow" aria-hidden="true" />
    </main>
  );
}
