import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Compass,
  FileText,
  HeartHandshake,
  User,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function MobileNav() {
  const location = useLocation();
  const { user, applications = [] } = useApp();
  const isAdmin = user?.role === "admin";

  const pendingCount = (applications || []).filter((a) => a?.status === "Pending").length;

  const studentNavItems = [
    { label: "Home", path: "/dashboard", icon: LayoutDashboard },
    { label: "Opportunities", path: "/opportunities", icon: Compass },
    {
      label: "Applications",
      path: "/applications",
      icon: FileText,
      badge: pendingCount > 0 ? pendingCount : null,
    },
    { label: "Impact", path: "/contributions", icon: HeartHandshake },
    { label: "Profile", path: "/profile", icon: User },
  ];

  const adminNavItems = [
    { label: "Home", path: "/dashboard", icon: LayoutDashboard },
    { label: "Admin Portal", path: "/admin/events", icon: ShieldCheck, badge: "CRUD" },
    { label: "Opportunities", path: "/opportunities", icon: Compass },
    { label: "Leaderboard", path: "/leaderboard", icon: Trophy },
    { label: "Settings", path: "/settings", icon: User },
  ];

  const navItems = isAdmin ? adminNavItems : studentNavItems;

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.path === "/dashboard"
            ? location.pathname === "/dashboard"
            : location.pathname.startsWith(item.path);

        return (
          <Link
            key={item.path}
            to={item.path}
            className={`mobile-nav-item ${isActive ? "active" : ""}`}
          >
            <div className="mobile-icon-wrap" style={{ position: "relative" }}>
              <Icon size={20} />
              {item.badge && (
                <span
                  style={{
                    position: "absolute",
                    top: "-5px",
                    right: "-10px",
                    background: "#FFD629",
                    color: "#151515",
                    fontSize: "9px",
                    fontWeight: 800,
                    padding: "1px 4px",
                    borderRadius: "10px",
                    lineHeight: "12px",
                  }}
                >
                  {item.badge}
                </span>
              )}
            </div>
            <span className="mobile-nav-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
