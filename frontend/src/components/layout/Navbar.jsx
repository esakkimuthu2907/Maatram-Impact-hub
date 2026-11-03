import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Bell,
  Search,
  Menu,
  User,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import MaatramLogo from "../common/MaatramLogo";

export default function Navbar({ onToggleSidebar, onOpenMobileDrawer }) {
  const { user, unreadCount, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Close profile dropdown menu on route change
  React.useEffect(() => {
    setShowProfileMenu(false);
  }, [location.pathname]);

  // Close profile menu on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setShowProfileMenu(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/opportunities?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="app-top-navbar">
      <div className="nav-left">
        {/* Mobile menu trigger */}
        <button
          className="nav-icon-btn mobile-only"
          onClick={onOpenMobileDrawer}
          aria-label="Open Navigation Menu"
        >
          <Menu size={20} />
        </button>

        {/* Desktop Sidebar Toggle button */}
        <button
          type="button"
          className="nav-icon-btn desktop-only"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation sidebar"
          title="Toggle Sidebar Navigation"
          style={{ marginRight: 6 }}
        >
          <Menu size={18} />
        </button>

        {/* Brand logo for mobile header */}
        <Link to="/dashboard" className="mobile-only nav-mobile-brand">
          <MaatramLogo size="sm" showTagline={false} />
        </Link>

        {/* Global Search Input (desktop) */}
        <form className="nav-search-form desktop-only" onSubmit={handleSearchSubmit}>
          <Search size={17} className="nav-search-icon" />
          <input
            type="text"
            placeholder="Search opportunities, school visits, skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="nav-search-input"
          />
        </form>
      </div>

      <div className="nav-right">
        {/* Hackathon Live Badge */}
        {/* Notification Bell with Badge */}
        <Link
          to="/notifications"
          className="nav-icon-btn notif-btn"
          aria-label="Notifications"
        >
          <Bell size={19} />
          {unreadCount > 0 && (
            <span className="notif-badge">{unreadCount}</span>
          )}
        </Link>

        {/* User Profile Pill & Dropdown */}
        <div className="profile-menu-container">
          <button
            className="profile-pill-btn"
            onClick={() => setShowProfileMenu((prev) => !prev)}
            aria-expanded={showProfileMenu}
            style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user?.fullName || user?.name || "User"}
                className="profile-nav-avatar"
                style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: user?.role === "admin" ? "#1E293B" : "#FFD629",
                  color: user?.role === "admin" ? "#FFFFFF" : "#151515",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                {(user?.fullName || user?.name || (user?.role === "admin" ? "A" : "S"))[0]?.toUpperCase()}
              </div>
            )}
            <div className="profile-nav-info desktop-only" style={{ textAlign: "left" }}>
              <span className="profile-nav-name" style={{ fontWeight: 700, fontSize: 13.5, color: "#1E293B", display: "block" }}>
                {user?.role === "admin" ? "Admin" : (user?.fullName || user?.name || "Student Volunteer")}
              </span>
              {user?.role !== "admin" && (
                <span className="profile-nav-role" style={{ fontSize: 11, color: "#64748B", display: "block" }}>
                  {user?.applicationId || "MAA001"}
                </span>
              )}
            </div>
            <ChevronDown size={14} className="desktop-only" color="#717784" />
          </button>

          {showProfileMenu && (
            <>
              <div
                className="dropdown-overlay"
                onClick={() => setShowProfileMenu(false)}
              />
              <div className="profile-dropdown-menu">
                <div className="dropdown-header">
                  <strong>{user?.name || "Student Volunteer"}</strong>
                  <span>{user?.email || "volunteer@maatram.org"}</span>
                  {user?.role === "admin" && (
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "2px 8px", background: "#FFF7D1",
                      borderRadius: 6, fontSize: "10.5px", fontWeight: 700, color: "#92400E",
                      marginTop: 4,
                    }}>
                      <ShieldCheck size={11} color="#D97706" /> Admin Access
                    </span>
                  )}
                </div>
                <div className="dropdown-divider" />
                {user?.role === "admin" ? (
                  <>
                    <Link
                      to="/admin/dashboard"
                      className="dropdown-item"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <ShieldCheck size={16} /> Admin Command Center
                    </Link>
                    <Link
                      to="/admin/events"
                      className="dropdown-item"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <FileText size={16} /> Manage Events & Slots
                    </Link>
                    <Link
                      to="/admin/users"
                      className="dropdown-item"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <User size={16} /> Manage Students
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/profile"
                      className="dropdown-item"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <User size={16} /> My Profile
                    </Link>
                    <Link
                      to="/applications"
                      className="dropdown-item"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <FileText size={16} /> My Applications
                    </Link>
                  </>
                )}
                <Link
                  to="/settings"
                  className="dropdown-item"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <Settings size={16} /> Settings
                </Link>
                <div className="dropdown-divider" />
                <button
                  className="dropdown-item logout-item"
                  onClick={handleLogout}
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
