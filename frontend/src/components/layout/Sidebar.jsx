import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Compass,
  FileText,
  User,
  Trophy,
  HeartHandshake,
  Bell,
  Settings,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  GraduationCap,
  Globe,
  BookOpen,
  Users,
  ShieldCheck,
  Target,
  Flame,
  X,
  TrendingUp,
  FileSpreadsheet,
  Bot,
  Calendar,
} from "lucide-react";
import MaatramLogo from "../common/MaatramLogo";
import { useApp } from "../../context/AppContext";

export default function Sidebar({ collapsed, onToggleCollapse, isMobile, onCloseMobile }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, unreadCount, logout } = useApp();

  const isAdmin = user?.role === "admin" && (user?.email || "").toLowerCase().trim() === "admin@maatram.org";
  const isOpportunitiesActive = location.pathname.startsWith("/opportunities");
  const [opportunitiesOpen, setOpportunitiesOpen] = useState(true);

  // Admin-specific navigation
  const adminNavLinks = [
    {
      title: "Dashboard Overview",
      path: "/admin/dashboard",
      icon: LayoutDashboard,
      badge: "Admin",
    },
    {
      title: "Events & Applications",
      path: "/admin/events",
      icon: ShieldCheck,
    },
    {
      title: "Student Management",
      path: "/admin/users",
      icon: Users,
    },
    {
      title: "Alumni Network & Leads",
      path: "/admin/alumni",
      icon: GraduationCap,
    },
    {
      title: "Impact Reports & Export",
      path: "/admin/reports",
      icon: TrendingUp,
    },
    {
      title: "Meetings & Availability",
      path: "/admin/meetings",
      icon: Calendar,
      badge: "LIVE",
    },
    {
      title: "AI Learning Hub",
      path: "/admin/learning",
      icon: Sparkles,
      badge: "AI RAG",
    },
    {
      title: "AI Chatbot Manager",
      path: "/admin/chatbot",
      icon: Sparkles,
      badge: "NEW",
    },
    {
      title: "Volunteer Leaderboard",
      path: "/leaderboard",
      icon: Trophy,
    },
  ];

  // Alumni-specific navigation
  const alumniNavLinks = [
    {
      title: "Alumni Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      badge: "Alumni",
    },
    {
      title: "Opportunities & Leads",
      path: "/opportunities",
      icon: Compass,
    },
    {
      title: "AI Learning Hub",
      path: "/learning",
      icon: Sparkles,
    },
    {
      title: "Maatram Connect",
      path: "/connect",
      icon: Users,
    },
    {
      title: "Meetings & Availability",
      path: "/meetings",
      icon: Calendar,
      badge: "NEW",
    },
    {
      title: "Leaderboard",
      path: "/leaderboard",
      icon: Trophy,
    },
    {
      title: "My Contributions",
      path: "/contributions",
      icon: HeartHandshake,
    },
    {
      title: "Volunteer Reports",
      path: "/reports",
      icon: TrendingUp,
    },
    {
      title: "Settings",
      path: "/settings",
      icon: Settings,
    },
  ];

  // Student-specific navigation
  const studentNavLinks = [
    {
      title: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "AI Learning Hub",
      path: "/learning",
      icon: Sparkles,
      badge: "AI RAG",
    },
    {
      title: "Opportunities",
      path: "/opportunities",
      icon: Compass,
    },
    {
      title: "My Applications",
      path: "/applications",
      icon: FileText,
    },

    {
      title: "Maatram Connect",
      path: "/connect",
      icon: Users,
    },
    {
      title: "Meetings & Availability",
      path: "/meetings",
      icon: Calendar,
      badge: "NEW",
    },
    {
      title: "Leaderboard",
      path: "/leaderboard",
      icon: Trophy,
    },
    {
      title: "My Contributions",
      path: "/contributions",
      icon: HeartHandshake,
    },

    {
      title: "Settings",
      path: "/settings",
      icon: Settings,
    },
  ];

  const navLinks = isAdmin
    ? adminNavLinks
    : user?.role === "alumni"
      ? alumniNavLinks
      : studentNavLinks;

  const handleLinkClick = () => {
    if (isMobile) onCloseMobile?.();
  };

  return (
    <aside className={`app-sidebar ${collapsed ? "collapsed" : ""} ${isMobile ? "mobile-drawer" : ""}`}>
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <Link to="/dashboard" onClick={handleLinkClick} style={{ textDecoration: "none" }} title="Maatram Foundation">
          <MaatramLogo size={collapsed ? "sm" : "md"} showTagline={!collapsed} iconOnly={collapsed} />
        </Link>

        {!isMobile ? (
          <button
            className="sidebar-collapse-btn"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar navigation" : "Collapse sidebar navigation"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        ) : (
          <button
            className="sidebar-collapse-btn"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            title="Close navigation menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Main Navigation List */}
      <nav className="sidebar-nav">
        {navLinks.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === "/dashboard"
              ? location.pathname === "/dashboard"
              : item.path === "/admin/dashboard"
                ? location.pathname === "/admin" || location.pathname === "/admin/dashboard"
                : location.pathname.startsWith(item.path);

          if (item.hasSubmenu) {
            return (
              <div key={item.title} className="sidebar-nav-group" title={collapsed ? item.title : undefined}>
                <div
                  className={`sidebar-nav-item ${isActive ? "active-parent" : ""}`}
                  onClick={() => {
                    if (collapsed) {
                      onToggleCollapse();
                      setOpportunitiesOpen(true);
                    } else {
                      setOpportunitiesOpen((prev) => !prev);
                    }
                  }}
                  style={{ cursor: "pointer" }}
                  title={item.title}
                >
                  <Icon size={20} className="nav-icon" />
                  {!collapsed && (
                    <>
                      <span className="nav-label">{item.title}</span>
                      <ChevronDown
                        size={16}
                        className={`submenu-arrow ${opportunitiesOpen ? "open" : ""}`}
                        style={{ marginLeft: "auto", transition: "transform 0.2s" }}
                      />
                    </>
                  )}
                </div>

                {/* Nested Submenu */}
                {!collapsed && opportunitiesOpen && (
                  <div className="sidebar-submenu">
                    {item.subItems.map((sub) => {
                      const SubIcon = sub.icon;
                      const isSubActive = location.pathname === sub.path;
                      return (
                        <Link
                          key={sub.title}
                          to={sub.path}
                          onClick={handleLinkClick}
                          className={`sidebar-subitem ${isSubActive ? "active" : ""}`}
                        >
                          <SubIcon size={16} className="sub-icon" />
                          <span>{sub.title}</span>
                          {sub.badge && <span className="sub-badge">{sub.badge}</span>}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.title}
              to={item.path}
              onClick={handleLinkClick}
              className={`sidebar-nav-item ${isActive ? "active" : ""}`}
              title={collapsed ? item.title : undefined}
            >
              <Icon size={20} className="nav-icon" />
              {!collapsed && (
                <>
                  <span className="nav-label">{item.title}</span>
                  {item.badge && <span className="nav-badge">{item.badge}</span>}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer User Info */}
      <div className="sidebar-footer">
        <Link to="/profile" onClick={handleLinkClick} className="sidebar-user-card" style={{ textDecoration: "none" }}>
          {!collapsed && (
            <div className="user-details-compact">
              <span className="user-name-text">{user?.name || user?.fullName || "User"}</span>
              <span className="user-role-text">
                {isAdmin ? "Admin Coordinator" : user?.department || "Student Volunteer"}
              </span>
            </div>
          )}
        </Link>
      </div>
    </aside>
  );
}
