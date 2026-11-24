import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import MobileNav from "./MobileNav";
import Toast from "../common/Toast";
import ErrorBoundary from "../common/ErrorBoundary";

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer automatically whenever the user navigates to a new page
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  // Close mobile drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="app-shell">
      {/* Desktop Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
      />

      {/* Mobile Drawer (Slide out) */}
      {mobileDrawerOpen && (
        <>
          <div
            className="mobile-drawer-backdrop"
            onClick={() => setMobileDrawerOpen(false)}
            aria-label="Close navigation overlay"
          />
          <Sidebar
            isMobile={true}
            onCloseMobile={() => setMobileDrawerOpen(false)}
          />
        </>
      )}

      {/* Main Content Area */}
      <div className={`app-main-wrap ${collapsed ? "sidebar-collapsed" : ""}`}>
        <Navbar
          onToggleSidebar={() => setCollapsed((prev) => !prev)}
          onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
        />

        <main className="app-page-content">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNav />
      </div>

      {/* Global Toast Notification */}
      <Toast />
    </div>
  );
}
