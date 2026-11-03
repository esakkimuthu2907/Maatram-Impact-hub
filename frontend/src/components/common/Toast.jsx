import React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function Toast() {
  const { toast } = useApp();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 size={18} color="#20A464" />,
    error: <AlertCircle size={18} color="#DC2626" />,
    info: <Info size={18} color="#3B82F6" />,
  };

  const bgColors = {
    success: "#FFFFFF",
    error: "#FFFFFF",
    info: "#FFFFFF",
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 18px",
        background: bgColors[toast.type] || "#FFFFFF",
        color: "#151515",
        borderRadius: 14,
        boxShadow: "0 12px 36px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.06)",
        border: "1px solid #E5E7EB",
        fontSize: 14,
        fontWeight: 600,
        maxWidth: 380,
        animation: "slideInToast 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {icons[toast.type] || icons.success}
      <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
    </div>
  );
}
