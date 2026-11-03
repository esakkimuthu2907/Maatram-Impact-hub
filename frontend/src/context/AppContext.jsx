// frontend/src/context/AppContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { eventsAPI } from "../api/eventsAPI";
import { applicationsAPI } from "../api/applicationsAPI";
import { notificationsAPI } from "../api/notificationsAPI";
import { adminAPI } from "../api/adminAPI";
import { connectionsAPI } from "../api/connectionsAPI";
import { usersAPI } from "../api/usersAPI";
import { authAPI } from "../api/authAPI";

const AppContext = createContext();

const DEFAULT_STUDENT = null;

export function AppProvider({ children }) {
  /* ─── Auth State ─────────────────────────────────────────────── */
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("maatram_user");
      const parsed = saved ? JSON.parse(saved) : null;
      if (parsed && typeof parsed === "object" && parsed.email) {
        return {
          ...parsed,
          name: parsed.fullName || parsed.name || "",
          fullName: parsed.fullName || parsed.name || "",
          // Preserve MongoDB _id for JWT auth
          id: parsed.id || parsed._id || "",
          _id: parsed._id || parsed.id || "",
          applicationId: parsed.applicationId || "",
          points: parsed.points !== undefined ? parsed.points : 0,
        };
      }
      return null;
    } catch {
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    Boolean(localStorage.getItem("maatram_token"))
  );

  /* ─── Toast Feedback ────────────────────────────────────────── */
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = "success") => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => setToast(null), 3800);
  }, []);

  /* ─── Real Data ──────────────────────────────────────────────── */
  const [events, setEvents] = useState([]);
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [gradingLevels, setGradingLevels] = useState([]);
  const [connections, setConnections] = useState({ accepted: [], pendingIncoming: [], pendingOutgoing: [] });
  const [pointsHistory, setPointsHistory] = useState([]);
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("maatram_bookmarks")) || ["evt_001"];
    } catch {
      return ["evt_001"];
    }
  });
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState("default");

  /* ─── Fetch Events ───────────────────────────────────────────── */
  const fetchEvents = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const res = await eventsAPI.getAll(params);
      if (res && res.data) {
        const mapped = res.data.map((e) => ({
          ...e,
          id: e.id || e._id,
        }));
        setEvents(mapped);
      }
    } catch (err) {
      console.warn("Fetch events notice:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ─── Fetch Applications ─────────────────────────────────────── */
  const fetchApplications = useCallback(async () => {
    try {
      const res = user?.role === "admin"
        ? await applicationsAPI.getAll()
        : await applicationsAPI.getMy();
      if (res && res.data) {
        setApplications(res.data);
      }
    } catch (err) {
      console.warn("Fetch applications notice:", err.message);
    }
  }, [user?.role]);

  /* ─── Fetch Notifications ────────────────────────────────────── */
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationsAPI.getAll();
      if (res && res.data) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.warn("Fetch notifications notice:", err.message);
    }
  }, []);

  /* ─── Fetch Admin Stats ──────────────────────────────────────── */
  const fetchAdminStats = useCallback(async () => {
    if (user?.role !== "admin") return;
    try {
      const res = await adminAPI.getStats();
      if (res && res.data) {
        setAdminStats(res.data);
      }
    } catch (err) {
      console.warn("Admin stats notice:", err.message);
    }
  }, [user?.role]);

  /* ─── Fetch Grading Levels ───────────────────────────────────── */
  const fetchGradingLevels = useCallback(async () => {
    try {
      const res = await adminAPI.getGradingLevels();
      if (res && res.data) {
        setGradingLevels(res.data);
      }
    } catch (err) {
      console.warn("Grading levels notice:", err.message);
    }
  }, []);

  /* ─── Fetch Peer Connections ─────────────────────────────────── */
  const fetchConnections = useCallback(async () => {
    try {
      const res = await connectionsAPI.getMyConnections();
      if (res && res.data) {
        setConnections(res.data);
      }
    } catch (err) {
      console.warn("Connections fetch notice:", err.message);
    }
  }, []);

  /* ─── Fetch Points History ──────────────────────────────────── */
  const fetchPointsHistory = useCallback(async () => {
    try {
      const res = await usersAPI.getPointsHistory();
      if (res && res.data) {
        setPointsHistory(res.data);
      }
      // Also sync user profile stats with backend
      const statsRes = await usersAPI.getStats();
      if (statsRes && statsRes.data) {
        setUser((prev) => ({
          ...prev,
          points: statsRes.data.points,
          eventsJoined: statsRes.data.eventsJoined,
          completedEventsCount: statsRes.data.completedEventsCount,
          badgesEarned: statsRes.data.badgesEarned,
          streakDays: statsRes.data.streakDays,
          grade: statsRes.data.grade,
        }));
      }
    } catch (err) {
      console.warn("Points history notice:", err.message);
    }
  }, []);

  /* Initial Loads */
  useEffect(() => {
    fetchEvents();
    fetchGradingLevels();
  }, [fetchEvents, fetchGradingLevels]);

  useEffect(() => {
    if (isAuthenticated) {
      // Sync fresh profile from MongoDB (including permanent avatar)
      authAPI.getMe().then((res) => {
        if (res && res.data) {
          const fresh = res.data;
          setUser((prev) => {
            const merged = {
              ...prev,
              ...fresh,
              name: fresh.fullName || fresh.name || prev?.name || "",
              fullName: fresh.fullName || fresh.name || prev?.fullName || "",
              id: (fresh._id || fresh.id || prev?.id || "").toString(),
              _id: (fresh._id || fresh.id || prev?._id || "").toString(),
              applicationId: fresh.applicationId || prev?.applicationId || "",
              avatar: fresh.avatar !== undefined ? fresh.avatar : (prev?.avatar || ""),
            };
            localStorage.setItem("maatram_user", JSON.stringify(merged));
            return merged;
          });
        }
      }).catch(() => {});

      fetchApplications();
      fetchNotifications();
      fetchConnections();
      fetchPointsHistory();
      if (user?.role === "admin") {
        fetchAdminStats();
      }
    }
  }, [isAuthenticated, user?.role, fetchApplications, fetchNotifications, fetchConnections, fetchPointsHistory, fetchAdminStats]);

  /* Check Notification / FCM Permission */
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushSupported(true);
      setPushPermission(Notification.permission);
    }
  }, []);

  const requestPushPermission = useCallback(async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        setPushPermission(perm);
        if (perm === "granted") {
          showToast("Push notifications enabled! You will receive live event alerts.");
          new Notification("Maatram Impact Hub", {
            body: "Push alerts active! Stay tuned for volunteering calls.",
            icon: "/assets/logo_icon.jpg",
          });
        } else {
          showToast("Notification permission was not granted.", "info");
        }
      } catch (err) {
        console.warn("Notification error:", err);
      }
    }
  }, [showToast]);

  /* ─── Auth Handlers ─────────────────────────────────────────── */
  const login = useCallback(
    (userData, token) => {
      if (!token) {
        console.error("No JWT token provided to login function");
        return;
      }
      const normalizedUser = {
        ...userData,
        name: userData.fullName || userData.name || "",
        fullName: userData.fullName || userData.name || "",
        // Store MongoDB _id as primary id for JWT verification
        id: userData.id || userData._id || "",
        _id: userData._id || userData.id || "",
        applicationId: userData.applicationId || "",
        points: userData.points !== undefined ? userData.points : 0,
        totalHours: userData.totalHours !== undefined ? userData.totalHours : 0,
        eventsJoined: userData.eventsJoined !== undefined ? userData.eventsJoined : 0,
        badgesEarned: userData.badgesEarned !== undefined ? userData.badgesEarned : 0,
        streakDays: userData.streakDays !== undefined ? userData.streakDays : 0,
        role: userData.role || "student",
      };

      localStorage.setItem("maatram_token", token);
      localStorage.setItem("maatram_user", JSON.stringify(normalizedUser));
      setUser(normalizedUser);
      setIsAuthenticated(true);
      showToast(`Welcome back, ${normalizedUser.name || normalizedUser.fullName}!`);
    },
    [showToast]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("maatram_token");
    localStorage.removeItem("maatram_user");
    setUser(null);
    setIsAuthenticated(false);
    setApplications([]);
    setNotifications([]);
    setAdminStats(null);
    showToast("Signed out successfully.", "info");
  }, [showToast]);

  const updateUser = useCallback(async (updates) => {
    try {
      const res = await usersAPI.updateProfile(updates);
      const serverData = res?.data || updates;
      setUser((prev) => {
        const next = {
          ...prev,
          ...serverData,
          name: serverData.fullName || serverData.name || prev?.name,
          fullName: serverData.fullName || serverData.name || prev?.fullName,
          avatar: serverData.avatar !== undefined ? serverData.avatar : prev?.avatar,
        };
        localStorage.setItem("maatram_user", JSON.stringify(next));
        return next;
      });
      return serverData;
    } catch (err) {
      console.error("Update profile error:", err);
      throw err;
    }
  }, []);

  /* ─── Event CRUD ─────────────────────────────────────────────── */
  const addOpportunity = useCallback(
    async (eventPayload) => {
      try {
        const res = await eventsAPI.create(eventPayload);
        const created = res.data ? { ...res.data, id: res.data.id || res.data._id } : null;
        if (created) {
          setEvents((prev) => [created, ...prev]);
        }
        await fetchEvents();
        await fetchAdminStats();
        showToast("Event posted successfully to all student dashboards!");
        return created;
      } catch (err) {
        showToast(err.message || "Could not create event", "error");
        throw err;
      }
    },
    [fetchEvents, fetchAdminStats, showToast]
  );

  const updateOpportunity = useCallback(
    async (id, updatePayload) => {
      try {
        const res = await eventsAPI.update(id, updatePayload);
        const updated = res.data ? { ...res.data, id: res.data.id || res.data._id } : null;
        if (updated) {
          setEvents((prev) => prev.map((e) => (e.id === id || e._id === id ? updated : e)));
        }
        await fetchEvents();
        await fetchAdminStats();
        showToast("Event details updated!");
      } catch (err) {
        showToast(err.message || "Could not update event", "error");
      }
    },
    [fetchEvents, fetchAdminStats, showToast]
  );

  const deleteOpportunity = useCallback(
    async (id) => {
      try {
        await eventsAPI.remove(id);
        setEvents((prev) => prev.filter((e) => e.id !== id && e._id !== id));
        await fetchAdminStats();
        showToast("Event removed from catalog.", "info");
      } catch (err) {
        showToast(err.message || "Could not delete event", "error");
      }
    },
    [fetchAdminStats, showToast]
  );

  /* ─── Apply for Opportunity ─────────────────────────────────── */
  const applyForOpportunity = useCallback(
    async (opp, formData) => {
      const oppId = opp.id || opp._id;
      try {
        const res = await applicationsAPI.apply({
          opportunityId: oppId,
          slotId: formData.slotId,
          slotName: formData.slotName,
          motivation: formData.motivation,
          experience: formData.experience,
          skills: formData.skills,
        });

        await fetchApplications();
        await fetchEvents();
        await fetchNotifications();
        showToast("Application submitted successfully!");
        return res.data;
      } catch (err) {
        showToast(err.message || "Failed to submit application", "error");
        throw err;
      }
    },
    [fetchApplications, fetchEvents, fetchNotifications, showToast]
  );

  /* ─── Cancel Application ────────────────────────────────────── */
  const cancelApplication = useCallback(
    async (appId) => {
      try {
        await applicationsAPI.cancel(appId);
        await fetchApplications();
        await fetchEvents();
        showToast("Application withdrawn.", "info");
      } catch (err) {
        showToast(err.message || "Could not cancel application", "error");
      }
    },
    [fetchApplications, fetchEvents, showToast]
  );

  /* ─── Admin: Update Application Status ──────────────────────── */
  const updateApplicationStatus = useCallback(
    async (appId, status, notes = "") => {
      try {
        await applicationsAPI.updateStatus(appId, status, notes);
        await fetchApplications();
        await fetchEvents();
        await fetchAdminStats();
        showToast(`Application marked as ${status}! Respective student notified.`);
      } catch (err) {
        showToast(err.message || "Failed to update status", "error");
      }
    },
    [fetchApplications, fetchEvents, fetchAdminStats, showToast]
  );

  /* ─── Admin: Track Attendance & Award Points ────────────────── */
  const trackAttendanceAndAwardPoints = useCallback(
    async (eventId, attendanceRecords) => {
      try {
        const res = await adminAPI.trackAttendance(eventId, attendanceRecords);
        await fetchEvents();
        await fetchApplications();
        await fetchAdminStats();
        await fetchPointsHistory();
        showToast("Attendance logged! Points distributed to completing volunteers.");
        return res.data;
      } catch (err) {
        showToast(err.message || "Attendance submission failed", "error");
        throw err;
      }
    },
    [fetchEvents, fetchApplications, fetchAdminStats, fetchPointsHistory, showToast]
  );

  /* ─── Admin: Manual Point Adjustment ────────────────────────── */
  const adjustStudentPoints = useCallback(
    async (userId, payload) => {
      try {
        const res = await adminAPI.adjustPoints(userId, payload);
        await fetchAdminStats();
        await fetchPointsHistory();
        showToast(res.message || "Student points adjusted successfully!");
        return res.data;
      } catch (err) {
        showToast(err.message || "Points adjustment failed", "error");
        throw err;
      }
    },
    [fetchAdminStats, fetchPointsHistory, showToast]
  );

  /* ─── Admin: Broadcast Notification ─────────────────────────── */
  const broadcastNotification = useCallback(
    async (payload) => {
      try {
        const res = await adminAPI.broadcastNotification(payload);
        await fetchNotifications();
        await fetchAdminStats();
        showToast(`Announcement sent to ${res.data?.sentCount || "recipients"}!`);
        return res.data;
      } catch (err) {
        showToast(err.message || "Broadcast failed", "error");
        throw err;
      }
    },
    [fetchNotifications, fetchAdminStats, showToast]
  );

  /* ─── Connect: Peer Networking ──────────────────────────────── */
  const sendConnectRequest = useCallback(
    async (recipientId, message) => {
      try {
        const res = await connectionsAPI.sendRequest(recipientId, message);
        await fetchConnections();
        showToast("Connection request sent!");
        return res.data;
      } catch (err) {
        showToast(err.message || "Failed to send request", "error");
        throw err;
      }
    },
    [fetchConnections, showToast]
  );

  const acceptConnectRequest = useCallback(
    async (connectionId) => {
      try {
        await connectionsAPI.acceptRequest(connectionId);
        await fetchConnections();
        showToast("Connection accepted! You can now collaborate.");
      } catch (err) {
        showToast(err.message || "Failed to accept connection", "error");
      }
    },
    [fetchConnections, showToast]
  );

  const rejectConnectRequest = useCallback(
    async (connectionId) => {
      try {
        await connectionsAPI.rejectRequest(connectionId);
        await fetchConnections();
        showToast("Connection request declined.");
      } catch (err) {
        showToast(err.message || "Failed to decline", "error");
      }
    },
    [fetchConnections, showToast]
  );

  const removeConnection = useCallback(
    async (connectionId) => {
      try {
        await connectionsAPI.removeConnection(connectionId);
        await fetchConnections();
        showToast("Connection removed.");
      } catch (err) {
        showToast(err.message || "Could not remove connection", "error");
      }
    },
    [fetchConnections, showToast]
  );

  /* ─── Notifications ─────────────────────────────────────────── */
  const markNotificationsRead = useCallback(async () => {
    try {
      await notificationsAPI.markRead();
    } catch {}
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const markAsRead = useCallback((notifId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId || n._id === notifId ? { ...n, isRead: true } : n))
    );
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const toggleBookmark = useCallback((oppId) => {
    setBookmarks((prev) => {
      const exists = prev.includes(oppId);
      const next = exists ? prev.filter((id) => id !== oppId) : [...prev, oppId];
      try {
        localStorage.setItem("maatram_bookmarks", JSON.stringify(next));
      } catch {}
      showToast(exists ? "Removed from bookmarks" : "Saved to your bookmarks!");
      return next;
    });
  }, [showToast]);

  return (
    <AppContext.Provider
      value={{
        /* User & Auth */
        user,
        isAuthenticated,
        login,
        logout,
        updateUser,
        updateProfile: updateUser,
        /* Events & Opportunities */
        events,
        opportunities: events,
        fetchEvents,
        addOpportunity,
        addEvent: addOpportunity,
        updateOpportunity,
        editEvent: updateOpportunity,
        deleteOpportunity,
        removeEvent: deleteOpportunity,
        /* Applications */
        applications,
        fetchApplications,
        applyForOpportunity,
        cancelApplication,
        updateApplicationStatus,
        /* Admin Management */
        adminStats,
        fetchAdminStats,
        gradingLevels,
        fetchGradingLevels,
        trackAttendanceAndAwardPoints,
        adjustStudentPoints,
        broadcastNotification,
        /* Connections */
        connections,
        fetchConnections,
        sendConnectRequest,
        acceptConnectRequest,
        rejectConnectRequest,
        removeConnection,
        /* Points & History */
        pointsHistory,
        fetchPointsHistory,
        /* Notifications & Push */
        notifications,
        fetchNotifications,
        markNotificationsRead,
        markAllAsRead: markNotificationsRead,
        markAsRead,
        unreadCount,
        pushSupported,
        pushPermission,
        requestPushPermission,
        /* UI & Feedback */
        bookmarks,
        toggleBookmark,
        contributions,
        loading,
        toast,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
