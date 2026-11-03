// frontend/src/pages/ConnectPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  UserCheck,
  UserPlus,
  Clock,
  Search,
  X,
  MessageSquare,
  GraduationCap,
  Award,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  User,
  ArrowRight,
  Send,
  Palette,
  Check,
  Mail,
  Phone,
  RefreshCw,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { connectionsAPI } from "../../api/connectionsAPI";
import { usersAPI } from "../../api/usersAPI";
import "./ConnectPage.css";

export default function ConnectPage() {
  const { user, showToast } = useApp();

  const [search, setSearch] = useState("");
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [backendConnections, setBackendConnections] = useState({
    accepted: [],
    pendingIncoming: [],
    pendingOutgoing: [],
  });
  const [loading, setLoading] = useState(true);

  const [viewProfile, setViewProfile] = useState(null);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [chatMessages, setChatMessages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("maatram_chat_messages")) || {};
    } catch {
      return {};
    }
  });
  const [messageInput, setMessageInput] = useState("");
  const chatBottomRef = useRef(null);

  // Background Theme: "blue" or "yellow"
  const [bgTheme, setBgTheme] = useState(() => {
    try {
      return localStorage.getItem("maatram_profile_theme") || "blue";
    } catch {
      return "blue";
    }
  });

  const handleThemeChange = (newTheme) => {
    setBgTheme(newTheme);
    try {
      localStorage.setItem("maatram_profile_theme", newTheme);
    } catch {}
    showToast(`Background theme set to ${newTheme === "blue" ? "Maatram Blue" : "Maatram Yellow"}!`);
  };

  // Load Real Backend Data
  const loadData = async () => {
    try {
      setLoading(true);
      // 1. Fetch all registered enrolled student users (excluding admin)
      const usersRes = await usersAPI.getStudents();
      if (usersRes && usersRes.data) {
        setRegisteredUsers(usersRes.data);
      }
      // 2. Fetch connections
      const connRes = await connectionsAPI.getMyConnections();
      if (connRes && connRes.data) {
        setBackendConnections(connRes.data);
      }
    } catch (err) {
      console.warn("Connect data load error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (activeChatUser && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeChatUser, chatMessages]);

  const currentUserId = user?.applicationId || user?.id || user?._id || "";

  // Check connection status of any user
  const getUserConnectionInfo = (targetUser) => {
    const targetId = targetUser.id || targetUser._id;
    const targetAppId = targetUser.applicationId;

    // Is Accepted Friend?
    const acceptedMatch = backendConnections.accepted.find(
      (c) => c.user?.id === targetId || c.user?._id === targetId || c.user?.applicationId === targetAppId
    );
    if (acceptedMatch) {
      return { status: "connected", connectionId: acceptedMatch.connectionId };
    }

    // Is Incoming Request?
    const incomingMatch = backendConnections.pendingIncoming.find(
      (c) => c.user?.id === targetId || c.user?._id === targetId || c.user?.applicationId === targetAppId
    );
    if (incomingMatch) {
      return { status: "pending_received", connectionId: incomingMatch.connectionId, message: incomingMatch.message };
    }

    // Is Outgoing Request?
    const outgoingMatch = backendConnections.pendingOutgoing.find(
      (c) => c.user?.id === targetId || c.user?._id === targetId || c.user?.applicationId === targetAppId
    );
    if (outgoingMatch) {
      return { status: "pending_sent", connectionId: outgoingMatch.connectionId };
    }

    return { status: "none", connectionId: null };
  };

  // 1. Send connection request
  const handleSendRequest = async (targetUser) => {
    const targetId = targetUser.id || targetUser._id;
    try {
      await connectionsAPI.sendRequest(
        targetId,
        `Hi ${targetUser.fullName || targetUser.name}! I would like to connect with you on Maatram Impact Hub.`
      );
      showToast(`📨 Connection request sent to ${targetUser.fullName || targetUser.name}!`);
      loadData();
    } catch (err) {
      showToast(err.message || "Could not send connection request", "error");
    }
  };

  // 2. Accept incoming request
  const handleAcceptRequest = async (connectionId, targetUser) => {
    try {
      await connectionsAPI.acceptRequest(connectionId);
      showToast(`🎉 You are now connected with ${targetUser?.fullName || targetUser?.name}! Messaging unlocked.`);
      loadData();
    } catch (err) {
      showToast(err.message || "Failed to accept connection", "error");
    }
  };

  // 3. Reject incoming request
  const handleDeclineRequest = async (connectionId, targetUser) => {
    try {
      await connectionsAPI.rejectRequest(connectionId);
      showToast(`Connection request from ${targetUser?.fullName || targetUser?.name} declined.`);
      loadData();
    } catch (err) {
      showToast(err.message || "Failed to decline", "error");
    }
  };

  // 4. Cancel pending sent request
  const handleCancelRequest = async (connectionId) => {
    try {
      await connectionsAPI.removeConnection(connectionId);
      showToast("Connection request cancelled.");
      loadData();
    } catch (err) {
      showToast(err.message || "Could not cancel request", "error");
    }
  };

  // 5. Remove existing connection
  const handleRemoveConnection = async (connectionId, targetUser) => {
    const confirmRemove = window.confirm(
      `Are you sure you want to remove connection with ${targetUser?.fullName || targetUser?.name}?`
    );
    if (!confirmRemove) return;

    try {
      await connectionsAPI.removeConnection(connectionId);
      showToast("Connection removed.");
      if (viewProfile?.id === targetUser?.id) setViewProfile(null);
      if (activeChatUser?.id === targetUser?.id) setActiveChatUser(null);
      loadData();
    } catch (err) {
      showToast(err.message || "Could not remove connection", "error");
    }
  };

  // Open Chat
  const handleOpenChat = (targetUser) => {
    const info = getUserConnectionInfo(targetUser);
    if (info.status !== "connected") {
      showToast("⚠️ You must connect and be accepted first to enable messages!", "warning");
      return;
    }
    setViewProfile(null);
    setActiveChatUser(targetUser);
  };

  // Send Chat Message
  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!messageInput.trim() || !activeChatUser) return;

    const chatKey = activeChatUser.applicationId || activeChatUser.id;
    const currentList = chatMessages[chatKey] || [
      {
        id: "init",
        sender: "system",
        text: `You and ${activeChatUser.fullName || activeChatUser.name} are now connected on Maatram Impact Hub.`,
        time: "Just now",
      },
    ];

    const myMsg = {
      id: `msg_${Date.now()}`,
      sender: "me",
      text: messageInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updated = {
      ...chatMessages,
      [chatKey]: [...currentList, myMsg],
    };

    setChatMessages(updated);
    try {
      localStorage.setItem("maatram_chat_messages", JSON.stringify(updated));
    } catch {}

    setMessageInput("");

    // Simulated reply
    setTimeout(() => {
      const replies = [
        `Hi! Thanks for messaging. Excited to volunteer together on the upcoming school visit!`,
        `Hello! Great to hear from you. Let's collaborate closely for the next Maatram drive.`,
        `Hey there! Thanks for reaching out. Are you attending the Sangamam meet? Let's connect there!`,
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];

      const friendMsg = {
        id: `reply_${Date.now()}`,
        sender: "other",
        text: randomReply,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setChatMessages((prev) => {
        const nextList = [...(prev[chatKey] || []), friendMsg];
        const nextObj = { ...prev, [chatKey]: nextList };
        try {
          localStorage.setItem("maatram_chat_messages", JSON.stringify(nextObj));
        } catch {}
        return nextObj;
      });
    }, 1200);
  };

  // Filter out self and any non-student
  const otherUsers = registeredUsers.filter(
    (u) =>
      u.role !== "admin" &&
      (u.applicationId || u.id || u._id) !== currentUserId &&
      u.email !== user?.email
  );

  const filteredUsers = otherUsers.filter((u) => {
    const q = search.toLowerCase();
    const name = (u.fullName || u.name || "").toLowerCase();
    const college = (u.college || "").toLowerCase();
    const dept = (u.department || "").toLowerCase();
    const skills = Array.isArray(u.skills) ? u.skills.join(" ").toLowerCase() : (u.skills || "").toLowerCase();
    return name.includes(q) || college.includes(q) || dept.includes(q) || skills.includes(q);
  });

  return (
    <div
      className="connect-root"
      style={{
        background:
          bgTheme === "yellow"
            ? "radial-gradient(ellipse at 10% 10%, rgba(255, 214, 41, 0.20), transparent 45%), #FFFDF5"
            : "radial-gradient(ellipse at 10% 10%, rgba(37, 99, 235, 0.15), transparent 45%), #F8FAFC",
        borderRadius: 24,
        padding: "24px 20px 60px",
        transition: "background 0.3s ease",
      }}
    >
      {/* ── THEME BAR & REFRESH ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          padding: "12px 18px",
          background: "#FFFFFF",
          borderRadius: 16,
          border: "1.5px solid #E2E8F0",
          boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Palette size={18} color={bgTheme === "yellow" ? "#D97706" : "#2563EB"} />
          <strong style={{ fontSize: 13.5, color: "#1E293B" }}>Theme:</strong>
          <button
            type="button"
            onClick={() => handleThemeChange("blue")}
            style={{
              padding: "5px 12px",
              borderRadius: 20,
              border: bgTheme === "blue" ? "2px solid #1D4ED8" : "1px solid #CBD5E1",
              background: bgTheme === "blue" ? "#2563EB" : "#F8FAFC",
              color: bgTheme === "blue" ? "#FFFFFF" : "#475569",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Maatram Blue
          </button>
          <button
            type="button"
            onClick={() => handleThemeChange("yellow")}
            style={{
              padding: "5px 12px",
              borderRadius: 20,
              border: bgTheme === "yellow" ? "2px solid #D97706" : "1px solid #CBD5E1",
              background: bgTheme === "yellow" ? "#FFD629" : "#F8FAFC",
              color: bgTheme === "yellow" ? "#0F172A" : "#475569",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Maatram Yellow
          </button>
        </div>

        <button className="dash-btn dash-btn-outline" onClick={loadData} style={{ padding: "6px 12px", fontSize: 13 }}>
          <RefreshCw size={14} className={loading ? "spin" : ""} /> Sync Directory
        </button>
      </div>

      {/* ── HEADER & SEARCH ── */}
      <div className="cp-header">
        <div className="cp-header-text">
          <span className="cp-eyebrow">
            <Users size={14} /> Peer Volunteering Network
          </span>
          <h1 className="cp-title">Maatram Student Connect</h1>
          <p className="cp-subtitle">
            Connect with registered volunteers from college chapters across Tamil Nadu. Build teams and collaborate.
          </p>
        </div>

        <div className="cp-search-wrap">
          <Search size={18} className="cp-search-icon" />
          <input
            type="text"
            className="cp-search-input"
            placeholder="Search volunteers by name, college, department, or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="cp-search-clear" onClick={() => setSearch("")} aria-label="Clear Search">
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* ── INCOMING CONNECTION REQUESTS (APPROVAL/REJECTION REQUIRED) ── */}
      {backendConnections.pendingIncoming.length > 0 && (
        <section className="cp-section cp-pending-section" style={{ marginBottom: 28 }}>
          <div className="cp-section-header">
            <div className="cp-section-title-wrap">
              <Clock size={18} color="#D97706" />
              <h2 className="cp-section-title">
                Pending Connection Requests ({backendConnections.pendingIncoming.length})
              </h2>
            </div>
            <span className="cp-section-hint">Review and accept to unlock direct collaboration</span>
          </div>

          <div className="cp-cards-grid">
            {backendConnections.pendingIncoming.map((item) => {
              const u = item.user;
              if (!u) return null;
              return (
                <div key={item.connectionId} className="cp-card pending-card" style={{ border: "2px solid #FDE68A" }}>
                  <div className="cp-card-top">
                    <img
                      src={
                        u.avatar ||
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                      }
                      alt={u.fullName}
                      className="cp-avatar"
                    />
                    <div className="cp-card-main-info">
                      <div className="cp-name-row">
                        <strong className="cp-name">{u.fullName}</strong>
                        <span className="cp-id-tag">{u.applicationId}</span>
                      </div>
                      <span className="cp-college">{u.department} · {u.college}</span>
                    </div>
                  </div>

                  <p style={{ margin: "10px 0 14px", fontSize: 13, color: "#475569", background: "#FEF9C3", padding: "8px 12px", borderRadius: 8 }}>
                    💬 "{item.message || "Sent you a connection request."}"
                  </p>

                  <div className="cp-card-actions" style={{ display: "flex", gap: 8 }}>
                    <button
                      className="dash-btn dash-btn-primary"
                      onClick={() => handleAcceptRequest(item.connectionId, u)}
                      style={{ flex: 1, padding: "8px" }}
                    >
                      <Check size={14} /> Accept Request
                    </button>
                    <button
                      className="dash-btn dash-btn-outline"
                      onClick={() => handleDeclineRequest(item.connectionId, u)}
                      style={{ padding: "8px 12px" }}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── MY ACCEPTED CONNECTIONS (ONLY ACCEPTED APPEAR HERE) ── */}
      <section className="cp-section" style={{ marginBottom: 32 }}>
        <div className="cp-section-header">
          <div className="cp-section-title-wrap">
            <UserCheck size={18} color="#16A34A" />
            <h2 className="cp-section-title">
              My Connected Friends ({backendConnections.accepted.length})
            </h2>
          </div>
          <span className="cp-section-hint">Only accepted connections appear in this list</span>
        </div>

        {backendConnections.accepted.length > 0 ? (
          <div className="cp-cards-grid">
            {backendConnections.accepted.map((item) => {
              const u = item.user;
              if (!u) return null;
              return (
                <div key={item.connectionId} className="cp-card connected-card" style={{ border: "1.5px solid #BBF7D0" }}>
                  <div className="cp-card-top">
                    <img
                      src={
                        u.avatar ||
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                      }
                      alt={u.fullName}
                      className="cp-avatar"
                      onClick={() => setViewProfile(u)}
                      style={{ cursor: "pointer" }}
                    />
                    <div className="cp-card-main-info">
                      <div className="cp-name-row">
                        <strong className="cp-name" onClick={() => setViewProfile(u)} style={{ cursor: "pointer" }}>
                          {u.fullName}
                        </strong>
                        <span className="cp-id-tag">{u.applicationId}</span>
                      </div>
                      <span className="cp-college">{u.department} · {u.college}</span>
                      <div style={{ display: "flex", gap: 10, marginTop: 4, fontSize: 12, color: "#64748B" }}>
                        <span>🏆 {u.points || 0} pts</span>
                        <span>🕒 {u.totalHours || 0} hrs</span>
                      </div>
                    </div>
                  </div>

                  <div className="cp-card-actions" style={{ display: "flex", gap: 8, marginTop: 14 }}>
                    <button
                      className="dash-btn dash-btn-primary"
                      onClick={() => handleOpenChat(u)}
                      style={{ flex: 1, padding: "8px" }}
                    >
                      <MessageSquare size={14} /> Message
                    </button>
                    <button
                      className="dash-btn dash-btn-outline"
                      onClick={() => setViewProfile(u)}
                      style={{ padding: "8px 12px" }}
                    >
                      Profile
                    </button>
                    <button
                      className="dash-btn dash-btn-outline"
                      onClick={() => handleRemoveConnection(item.connectionId, u)}
                      style={{ padding: "8px 12px", color: "#DC2626", borderColor: "#FCA5A5" }}
                      title="Remove Connection"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ background: "#FFFFFF", padding: "28px", borderRadius: 16, textAlign: "center", color: "#64748B", border: "1px dashed #CBD5E1" }}>
            <Users size={32} color="#94A3B8" style={{ marginBottom: 8 }} />
            <p style={{ margin: 0 }}>You don't have any accepted connections yet. Discover volunteers below and click Connect!</p>
          </div>
        )}
      </section>

      {/* ── DISCOVER ALL REGISTERED VOLUNTEERS ── */}
      <section className="cp-section">
        <div className="cp-section-header">
          <div className="cp-section-title-wrap">
            <Sparkles size={18} color="#0066CC" />
            <h2 className="cp-section-title">
              Discover Registered Volunteers ({filteredUsers.length})
            </h2>
          </div>
          <span className="cp-section-hint">Send a connection request to collaborate</span>
        </div>

        <div className="cp-cards-grid">
          {filteredUsers.map((u) => {
            const info = getUserConnectionInfo(u);
            return (
              <div key={u.id || u._id} className="cp-card">
                <div className="cp-card-top">
                  <img
                    src={
                      u.avatar ||
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                    }
                    alt={u.fullName}
                    className="cp-avatar"
                    onClick={() => setViewProfile(u)}
                    style={{ cursor: "pointer" }}
                  />
                  <div className="cp-card-main-info">
                    <div className="cp-name-row">
                      <strong className="cp-name" onClick={() => setViewProfile(u)} style={{ cursor: "pointer" }}>
                        {u.fullName}
                      </strong>
                      <span className="cp-id-tag">{u.applicationId || u.id}</span>
                    </div>
                    <span className="cp-college">{u.department} · {u.college}</span>
                    <div style={{ display: "flex", gap: 10, marginTop: 4, fontSize: 12, color: "#64748B" }}>
                      <span>🏆 {u.points || 0} pts</span>
                      <span>🕒 {u.totalHours || 0} hrs</span>
                    </div>
                  </div>
                </div>

                {/* Skills tags */}
                {Array.isArray(u.skills) && u.skills.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "10px 0" }}>
                    {u.skills.slice(0, 3).map((sk, idx) => (
                      <span key={idx} style={{ background: "#F1F5F9", color: "#475569", fontSize: 11, padding: "2px 8px", borderRadius: 10 }}>
                        {sk}
                      </span>
                    ))}
                  </div>
                )}

                {/* Connection Button Logic */}
                <div className="cp-card-actions" style={{ marginTop: 12 }}>
                  {info.status === "connected" ? (
                    <div style={{ display: "flex", gap: 8, width: "100%" }}>
                      <button
                        className="dash-btn dash-btn-primary"
                        onClick={() => handleOpenChat(u)}
                        style={{ flex: 1, padding: "8px" }}
                      >
                        <MessageSquare size={14} /> Message
                      </button>
                      <button
                        className="dash-btn dash-btn-outline"
                        onClick={() => setViewProfile(u)}
                        style={{ padding: "8px 12px" }}
                      >
                        Profile
                      </button>
                    </div>
                  ) : info.status === "pending_sent" ? (
                    <div style={{ display: "flex", gap: 8, width: "100%" }}>
                      <button className="dash-btn dash-btn-outline" disabled style={{ flex: 1, color: "#D97706", borderColor: "#FCD34D" }}>
                        <Clock size={14} /> Request Pending
                      </button>
                      <button
                        className="dash-btn dash-btn-outline"
                        onClick={() => handleCancelRequest(info.connectionId)}
                        style={{ padding: "8px 12px" }}
                        title="Cancel Request"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : info.status === "pending_received" ? (
                    <button
                      className="dash-btn dash-btn-primary"
                      onClick={() => handleAcceptRequest(info.connectionId, u)}
                      style={{ width: "100%", background: "#16A34A" }}
                    >
                      <Check size={14} /> Accept Request
                    </button>
                  ) : (
                    <div style={{ display: "flex", gap: 8, width: "100%" }}>
                      <button
                        className="dash-btn dash-btn-primary"
                        onClick={() => handleSendRequest(u)}
                        style={{ flex: 1, padding: "8px" }}
                      >
                        <UserPlus size={14} /> Connect
                      </button>
                      <button
                        className="dash-btn dash-btn-outline"
                        onClick={() => setViewProfile(u)}
                        style={{ padding: "8px 12px" }}
                      >
                        View
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── MODAL: INTERACTIVE MESSAGING / CHAT ── */}
      {activeChatUser && (
        <div className="cp-modal-overlay" onClick={() => setActiveChatUser(null)}>
          <div
            className="cp-modal chat-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 480, display: "flex", flexDirection: "column", height: 560 }}
          >
            {/* Chat Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                background: bgTheme === "yellow" ? "#FFD629" : "#2563EB",
                color: bgTheme === "yellow" ? "#0F172A" : "#FFFFFF",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img
                  src={
                    activeChatUser.avatar ||
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                  }
                  alt={activeChatUser.fullName}
                  style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover" }}
                />
                <div>
                  <strong style={{ fontSize: 15, display: "block" }}>
                    {activeChatUser.fullName || activeChatUser.name}
                  </strong>
                  <span style={{ fontSize: 11.5, opacity: 0.85 }}>Connected Volunteer</span>
                </div>
              </div>
              <button
                onClick={() => setActiveChatUser(null)}
                style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat Messages Body */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px 20px",
                background: "#F8FAFC",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {((chatMessages[activeChatUser.applicationId || activeChatUser.id]) || []).map((msg) => {
                const isMe = msg.sender === "me";
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isMe ? "flex-end" : "flex-start",
                      maxWidth: "80%",
                      alignSelf: isMe ? "flex-end" : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        padding: "10px 14px",
                        borderRadius: isMe ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                        background: isMe ? (bgTheme === "yellow" ? "#EAB308" : "#2563EB") : "#FFFFFF",
                        color: isMe ? (bgTheme === "yellow" ? "#0F172A" : "#FFFFFF") : "#1E293B",
                        fontSize: 13.5,
                        fontWeight: 500,
                        border: isMe ? "none" : "1px solid #E2E8F0",
                      }}
                    >
                      {msg.text}
                    </div>
                    <span style={{ fontSize: 10.5, color: "#94A3B8", marginTop: 4 }}>{msg.time}</span>
                  </div>
                );
              })}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={handleSendMessage}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 16px",
                background: "#FFFFFF",
                borderTop: "1.5px solid #E2E8F0",
              }}
            >
              <input
                type="text"
                placeholder={`Message ${activeChatUser.fullName || "friend"}...`}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 24,
                  border: "1.5px solid #CBD5E1",
                  fontSize: 13.5,
                  outline: "none",
                }}
              />
              <button
                type="submit"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  border: "none",
                  background: bgTheme === "yellow" ? "#FFD629" : "#2563EB",
                  color: bgTheme === "yellow" ? "#0F172A" : "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: PROFILE VIEW ── */}
      {viewProfile && (
        <div className="cp-modal-overlay" onClick={() => setViewProfile(null)}>
          <div className="cp-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <button className="cp-modal-close" onClick={() => setViewProfile(null)}>
              <X size={18} />
            </button>

            <div
              className="cp-modal-banner"
              style={{
                background:
                  bgTheme === "yellow"
                    ? "linear-gradient(135deg, #FFD629, #F59E0B)"
                    : "linear-gradient(135deg, #1E3A8A, #2563EB)",
              }}
            />

            <div className="cp-modal-avatar-wrap">
              <img
                src={
                  viewProfile.avatar ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                }
                alt={viewProfile.fullName}
                className="cp-modal-avatar"
              />
            </div>

            <div className="cp-modal-body">
              <div className="cp-modal-title-row">
                <h2 className="cp-modal-name">{viewProfile.fullName}</h2>
                <span className="cp-id-tag">{viewProfile.applicationId}</span>
              </div>

              <p className="cp-modal-college">
                <GraduationCap size={15} /> {viewProfile.department} · {viewProfile.college}
              </p>

              <p className="cp-modal-bio">
                {viewProfile.bio || "Active volunteer passionate about education and community empowerment."}
              </p>

              <div className="cp-modal-stats">
                <div className="cp-stat">
                  <span className="cp-stat-val">{viewProfile.points || 0}</span>
                  <span className="cp-stat-lbl">Points</span>
                </div>
                <div className="cp-stat">
                  <span className="cp-stat-val">{viewProfile.totalHours ?? 0}</span>
                  <span className="cp-stat-lbl">Hours</span>
                </div>
                <div className="cp-stat">
                  <span className="cp-stat-val">{viewProfile.completedEventsCount || viewProfile.eventsJoined || 0}</span>
                  <span className="cp-stat-lbl">Drives</span>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                {(() => {
                  const info = getUserConnectionInfo(viewProfile);
                  if (info.status === "connected") {
                    return (
                      <div style={{ display: "flex", gap: 10 }}>
                        <button
                          className="dash-btn dash-btn-primary"
                          onClick={() => handleOpenChat(viewProfile)}
                          style={{ flex: 1 }}
                        >
                          <MessageSquare size={16} /> Send Direct Message
                        </button>
                        <button
                          className="dash-btn dash-btn-outline"
                          onClick={() => handleRemoveConnection(info.connectionId, viewProfile)}
                          style={{ color: "#DC2626", borderColor: "#FCA5A5" }}
                        >
                          Remove
                        </button>
                      </div>
                    );
                  }
                  if (info.status === "pending_sent") {
                    return (
                      <button className="dash-btn dash-btn-outline" disabled style={{ width: "100%" }}>
                        <Clock size={16} /> Connection Request Pending
                      </button>
                    );
                  }
                  if (info.status === "pending_received") {
                    return (
                      <button
                        className="dash-btn dash-btn-primary"
                        onClick={() => handleAcceptRequest(info.connectionId, viewProfile)}
                        style={{ width: "100%", background: "#16A34A" }}
                      >
                        <Check size={16} /> Accept Connection Request
                      </button>
                    );
                  }
                  return (
                    <button
                      className="dash-btn dash-btn-primary"
                      onClick={() => handleSendRequest(viewProfile)}
                      style={{ width: "100%" }}
                    >
                      <UserPlus size={16} /> Connect with {viewProfile.fullName}
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
