import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./flip.css";

const EXIT_MS = 450; // must match the flip-out duration in flip.css

export default function useFlipNavigate() {
  const navigate = useNavigate();
  const location = useLocation();
  const [exitDir, setExitDir] = useState("");

  // direction: "forward" (login -> register) or "back" (register -> login)
  const flipTo = (path, direction = "forward") => {
    if (exitDir) return; // ignore double clicks
    setExitDir(direction);
    setTimeout(() => {
      navigate(path, { state: { flip: direction } });
    }, EXIT_MS);
  };

  // class for the page that is LEAVING
  const exitClass = exitDir ? `flip-out-${exitDir}` : "";

  // class for the page that is ARRIVING
  const enterClass = location.state?.flip
    ? `flip-in-${location.state.flip}`
    : "";

  return { flipTo, flipClass: `${enterClass} ${exitClass}`.trim() };
}