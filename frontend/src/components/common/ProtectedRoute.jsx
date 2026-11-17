import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useApp } from "../../context/AppContext";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, isAuthenticated } = useApp();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (
    adminOnly &&
    (user.role !== "admin" || (user.email || "").toLowerCase().trim() !== "admin@maatram.org")
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
