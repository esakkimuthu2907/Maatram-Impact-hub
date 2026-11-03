// frontend/src/pages/NotificationsPage.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCircle2,
  HeartHandshake,
  Sparkles,
  Share2,
  Clock,
  Check,
  Trash2,
  ArrowRight,
  Inbox,
  Award,
  Users,
  AlertCircle,
  XCircle,
  Radio,
} from "lucide-react";

import { useApp } from "../../context/AppContext";
import "./StudentDashboard.css";

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    pushSupported,
    pushPermission,
    requestPushPermission,
  } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("All"); // All | Approvals | Points | Connect | Announcements

  const filteredNotifs = (notifications || []).filter((n) => {
    if (activeTab === "All") return true;
    if (activeTab === "Approvals") return n.type === "approval" || n.type === "rejection";
    if (activeTab === "Points") return n.type === "points";
    if (activeTab === "Connect") return n.type === "connect";
    if (activeTab === "Announcements") return n.type === "announcement" || n.type === "general";
    return true;
  });

  const getIcon = (type) => {
    switch (type) {
      case "approval":
        return <CheckCircle2 size={19} color="#16A34A" />;
      case "rejection":
        return <XCircle size={19} color="#DC2626" />;
      case "points":
        return <Award size={19} color="#EAB308" />;
      case "connect":
        return <Users size={19} color="#0066CC" />;
      case "announcement":
        return <Radio size={19} color="#8B5CF6" />;
      default:
        return <Bell size={19} color="#0066CC" />;
    }
  };

  const handleCardClick = (notif) => {
    markAsRead(notif._id || notif.id);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <div className="dashboard-container">
      {/* HEADER WITH ACTION */}
      <div className="section-header-row">
        <div>
          <h1 className="page-heading">Live Notifications & Activity Feed</h1>
          <p className="page-subheading">
            Instant updates on application approvals, volunteer points allocations, connection requests, and drive announcements.
          </p>
        </div>

        {unreadCount > 0 && (
          <button className="dash-btn dash-btn-outline" onClick={markAllAsRead}>
            <Check size={16} /> Mark All as Read ({unreadCount})
          </button>
        )}
      </div>

      {/* PUSH NOTIFICATION / FCM PERMISSION BANNER */}
      {pushSupported && pushPermission !== "granted" && (
        <div
          style={{
            background: "#EFF6FF",
            border: "1.5px solid #BFDBFE",
            padding: "16px 20px",
            borderRadius: 14,
            marginBottom: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "#DBEAFE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bell size={20} color="#1E40AF" />
            </div>
            <div>
              <strong style={{ fontSize: 14, color: "#1E3A8A", display: "block" }}>
                Enable Real-time Push Notifications (FCM Supported)
              </strong>
              <span style={{ fontSize: 12.5, color: "#3B82F6" }}>
                Receive instant mobile and desktop alerts when your application is approved or points are credited.
              </span>
            </div>
          </div>

          <button
            className="dash-btn dash-btn-primary"
            onClick={requestPushPermission}
            style={{ padding: "8px 16px", fontSize: 13 }}
          >
            Allow Push Notifications
          </button>
        </div>
      )}

      {/* FILTER TABS */}
      <div className="filter-search-toolbar">
        <div className="format-pills-row">
          {["All", "Approvals", "Points", "Connect", "Announcements"].map((tab) => (
            <button
              key={tab}
              className={`format-pill-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* NOTIFICATIONS LIST */}
      {filteredNotifs.length === 0 ? (
        <div className="opp-empty-state">
          <Inbox size={42} color="#717784" />
          <h3>No notifications in this category</h3>
          <p>You're all caught up with your updates and event reminders.</p>
        </div>
      ) : (
        <div className="notifications-list" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filteredNotifs.map((notif) => (
            <div
              key={notif._id || notif.id}
              className={`notification-item-card ${!notif.isRead ? "unread" : ""}`}
              onClick={() => handleCardClick(notif)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
                padding: "16px 20px",
                background: !notif.isRead ? "#F0F7FF" : "#FFFFFF",
                borderRadius: 14,
                border: !notif.isRead ? "1.5px solid #93C5FD" : "1px solid #E2E8F0",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: !notif.isRead ? "#DBEAFE" : "#F1F5F9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {getIcon(notif.type)}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontSize: 14.5, color: "#0F172A" }}>{notif.title}</strong>
                  <span style={{ fontSize: 11.5, color: "#94A3B8" }}>
                    {new Date(notif.createdAt).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "#475569", lineHeight: 1.5 }}>
                  {notif.message}
                </p>
                {notif.link && (
                  <span style={{ fontSize: 12, color: "#0066CC", fontWeight: 600, marginTop: 6, display: "inline-block" }}>
                    View details →
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
