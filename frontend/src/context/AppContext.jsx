// frontend/src/context/AppContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { eventsAPI } from "../api/eventsAPI";
import { applicationsAPI } from "../api/applicationsAPI";
import { notificationsAPI } from "../api/notificationsAPI";
import { adminAPI } from "../api/adminAPI";
import { connectionsAPI } from "../api/connectionsAPI";
import { usersAPI } from "../api/usersAPI";
import { authAPI } from "../api/authAPI";
import { badgesAPI } from "../api/badgesAPI";
import { certificatesAPI } from "../api/certificatesAPI";
import { hoursAPI } from "../api/hoursAPI";

import LinkedInShareModal from "../components/common/LinkedInShareModal";
import CertificateModal from "../components/common/CertificateModal";
import QRAttendanceModal from "../components/common/QRAttendanceModal";

const AppContext = createContext();

export function AppProvider({ children }) {
  /* ─── Auth State ────────────────────────────────────────────────────────── */
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("maatram_user");
      const parsed = saved ? JSON.parse(saved) : null;
      if (parsed && typeof parsed === "object" && parsed.email) {
        return {
          ...parsed,
          name: parsed.fullName || parsed.name || "",
          fullName: parsed.fullName || parsed.name || "",
          id: parsed.id || parsed._id || "",
          _id: parsed._id || parsed.id || "",
          applicationId: parsed.applicationId || "",
          points: parsed.points !== undefined ? parsed.points : 0,
          totalHours: parsed.totalHours !== undefined ? parsed.totalHours : 0,
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

  /* ─── Toast Feedback ────────────────────────────────────────────────────── */
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = "success") => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => setToast(null), 3800);
  }, []);

  /* ─── Core Data States ─────────────────────────────────────────────────── */
  const [events, setEvents] = useState([]);
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [gradingLevels, setGradingLevels] = useState([]);
  const [connections, setConnections] = useState({ accepted: [], pendingIncoming: [], pendingOutgoing: [] });
  const [pointsHistory, setPointsHistory] = useState([]);
  const [badges, setBadges] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [hourLogs, setHourLogs] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
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

  /* ─── Global Modals State ───────────────────────────────────────────────── */
  const [linkedInModal, setLinkedInModal] = useState({
    isOpen: false,
    volunteerName: "",
    eventTitle: "",
    hours: 4,
    category: "Volunteering",
    date: "",
    certificateId: "",
  });

  const [certModal, setCertModal] = useState({
    isOpen: false,
    certificate: null,
  });

  const [qrModal, setQrModal] = useState({
    isOpen: false,
    event: null,
  });

  const openLinkedInShare = useCallback((data = {}) => {
    setLinkedInModal({
      isOpen: true,
      volunteerName: data.volunteerName || user?.fullName || "Volunteer",
      eventTitle: data.eventTitle || "Maatram Volunteering Drive",
      hours: data.hours || data.verifiedHours || 4,
      category: data.category || "Volunteering",
      date: data.date || data.eventDate || "",
      certificateId: data.certificateId || "",
    });
  }, [user?.fullName]);

  const closeLinkedInShare = useCallback(() => {
    setLinkedInModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const openCertificate = useCallback((cert) => {
    setCertModal({
      isOpen: true,
      certificate: cert,
    });
  }, []);

  const closeCertificate = useCallback(() => {
    setCertModal({ isOpen: false, certificate: null });
  }, []);

  const openQRAttendance = useCallback((evt) => {
    setQrModal({
      isOpen: true,
      event: evt,
    });
  }, []);

  const closeQRAttendance = useCallback(() => {
    setQrModal({ isOpen: false, event: null });
  }, []);

  /* ─── Fetch Events ──────────────────────────────────────────────────────── */
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

  /* ─── Fetch Applications ────────────────────────────────────────────────── */
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

  /* ─── Fetch Notifications ───────────────────────────────────────────────── */
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

  /* ─── Fetch Admin Stats ─────────────────────────────────────────────────── */
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

  /* ─── Fetch Grading Levels ──────────────────────────────────────────────── */
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

  /* ─── Fetch Connections ─────────────────────────────────────────────────── */
  const fetchConnections = useCallback(async () => {
    try {
      const res = await connectionsAPI.getAll();
      if (res && res.data) {
        setConnections(res.data);
      }
    } catch (err) {
      console.warn("Connections notice:", err.message);
    }
  }, []);

  /* ─── Fetch Badges ──────────────────────────────────────────────────────── */
  const fetchBadges = useCallback(async () => {
    try {
      const res = user?.role === "admin" ? await badgesAPI.getAll() : await badgesAPI.getMy();
      if (res && res.data) {
        setBadges(res.data);
      }
    } catch (err) {
      console.warn("Badges notice:", err.message);
    }
  }, [user?.role]);

  /* ─── Fetch Certificates ────────────────────────────────────────────────── */
  const fetchCertificates = useCallback(async () => {
    try {
      const res = user?.role === "admin" ? await certificatesAPI.getAll() : await certificatesAPI.getMy();
      if (res && res.data) {
        setCertificates(res.data);
      }
    } catch (err) {
      console.warn("Certificates notice:", err.message);
    }
  }, [user?.role]);

  /* ─── Fetch Hour Verification Logs ──────────────────────────────────────── */
  const fetchHourLogs = useCallback(async (params = {}) => {
    try {
      const res = user?.role === "admin" ? await hoursAPI.getAll(params) : await hoursAPI.getMy();
      if (res && res.data) {
        setHourLogs(res.data);
      }
    } catch (err) {
      console.warn("Hour logs notice:", err.message);
    }
  }, [user?.role]);

  /* ─── Fetch Automated Email Logs ────────────────────────────────────────── */
  const fetchEmailLogs = useCallback(async (limit = 100) => {
    if (user?.role !== "admin") return;
    try {
      const res = await adminAPI.getEmailLogs(limit);
      if (res && res.data) {
        setEmailLogs(res.data);
      }
    } catch (err) {
      console.warn("Email logs notice:", err.message);
    }
  }, [user?.role]);

  /* ─── Fetch Points History ──────────────────────────────────────────────── */
  const fetchPointsHistory = useCallback(async () => {
    try {
      const res = await usersAPI.getPointsHistory();
      if (res && res.data) {
        setPointsHistory(res.data);
      }
      const statsRes = await usersAPI.getStats();
      if (statsRes && statsRes.data) {
        setUser((prev) => ({
          ...prev,
          points: statsRes.data.points,
          totalHours: statsRes.data.totalHours,
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
      fetchBadges();
      fetchCertificates();
      fetchHourLogs();
      if (user?.role === "admin") {
        fetchAdminStats();
        fetchEmailLogs();
      }
    }
  }, [
    isAuthenticated,
    user?.role,
    fetchApplications,
    fetchNotifications,
    fetchConnections,
    fetchPointsHistory,
    fetchBadges,
    fetchCertificates,
    fetchHourLogs,
    fetchAdminStats,
    fetchEmailLogs,
  ]);

  /* Push notification check */
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
        } else {
          showToast("Notification permission was not granted.", "info");
        }
      } catch (err) {
        console.warn("Notification error:", err);
      }
    }
  }, [showToast]);

  /* ─── Auth Handlers ─────────────────────────────────────────────────────── */
  const login = useCallback(
    (userData, token) => {
      if (!token) return;
      const normalizedUser = {
        ...userData,
        name: userData.fullName || userData.name || "",
        fullName: userData.fullName || userData.name || "",
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
        };
        localStorage.setItem("maatram_user", JSON.stringify(next));
        return next;
      });
      showToast("Profile details updated successfully!");
    } catch (err) {
      showToast(err.message || "Failed to update profile", "error");
    }
  }, [showToast]);

  /* ─── Opportunity Management ────────────────────────────────────────────── */
  const addOpportunity = useCallback(
    async (oppData) => {
      try {
        const res = await eventsAPI.create(oppData);
        await fetchEvents();
        await fetchAdminStats();
        showToast("New volunteering drive published successfully!");
        return res.data;
      } catch (err) {
        showToast(err.message || "Could not create event", "error");
        throw err;
      }
    },
    [fetchEvents, fetchAdminStats, showToast]
  );

  const updateOpportunity = useCallback(
    async (id, oppData) => {
      try {
        const res = await eventsAPI.update(id, oppData);
        await fetchEvents();
        await fetchAdminStats();
        showToast("Opportunity updated successfully!");
        return res.data;
      } catch (err) {
        showToast(err.message || "Could not update event", "error");
        throw err;
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

  /* ─── Application Management ────────────────────────────────────────────── */
  const applyForOpportunity = useCallback(
    async (oppOrId, maybeFormData = {}) => {
      let oppId = "";
      let formData = maybeFormData || {};

      if (typeof oppOrId === "string") {
        oppId = oppOrId;
      } else if (oppOrId && typeof oppOrId === "object") {
        if (oppOrId.id || oppOrId._id) {
          oppId = (oppOrId.id || oppOrId._id).toString();
        } else if (oppOrId.opportunityId) {
          oppId = oppOrId.opportunityId.toString();
          formData = oppOrId;
        }
      }

      if (!oppId && formData.opportunityId) {
        oppId = formData.opportunityId.toString();
      }

      try {
        const res = await applicationsAPI.apply({
          opportunityId: oppId,
          slotId: formData.slotId || "",
          slotName: formData.slotName || "Standard Slot",
          motivation: formData.motivation || "",
          experience: formData.experience || "",
          skills: formData.skills || "",
        });

        await fetchApplications();
        await fetchEvents();
        await fetchNotifications();
        showToast("Application submitted successfully!");
        return res?.data;
      } catch (err) {
        showToast(err.message || "Failed to submit application", "error");
        throw err;
      }
    },
    [fetchApplications, fetchEvents, fetchNotifications, showToast]
  );

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

  const updateApplicationStatus = useCallback(
    async (appId, status, notes = "") => {
      try {
        await applicationsAPI.updateStatus(appId, status, notes);
        await fetchApplications();
        await fetchEvents();
        await fetchAdminStats();
        showToast(`Application marked as ${status}! Automated email notification sent.`);
      } catch (err) {
        showToast(err.message || "Failed to update status", "error");
      }
    },
    [fetchApplications, fetchEvents, fetchAdminStats, showToast]
  );

  const deleteApplication = useCallback(
    async (appId) => {
      try {
        await applicationsAPI.remove(appId);
        await fetchApplications();
        await fetchEvents();
        await fetchAdminStats();
        showToast("Application permanently deleted.");
      } catch (err) {
        showToast(err.message || "Failed to delete application", "error");
      }
    },
    [fetchApplications, fetchEvents, fetchAdminStats, showToast]
  );

  /* ─── Attendance & QR ───────────────────────────────────────────────────── */
  const trackAttendanceAndAwardPoints = useCallback(
    async (eventId, attendanceRecords) => {
      try {
        const res = await adminAPI.trackAttendance(eventId, attendanceRecords);
        await fetchEvents();
        await fetchApplications();
        await fetchAdminStats();
        await fetchPointsHistory();
        await fetchCertificates();
        showToast("Attendance audited & verified hours added to contributions!");
        return res.data;
      } catch (err) {
        showToast(err.message || "Attendance submission failed", "error");
        throw err;
      }
    },
    [fetchEvents, fetchApplications, fetchAdminStats, fetchPointsHistory, fetchCertificates, showToast]
  );

  const checkInViaQR = useCallback(
    async (eventId, qrToken) => {
      try {
        const res = await eventsAPI.checkInViaQR(eventId, qrToken);
        await fetchApplications();
        await fetchNotifications();
        showToast("QR Attendance successfully recorded! ✅");
        return res;
      } catch (err) {
        showToast(err.message || "Check-in failed", "error");
        throw err;
      }
    },
    [fetchApplications, fetchNotifications, showToast]
  );

  const sendEventReminder = useCallback(
    async (eventId) => {
      try {
        const res = await eventsAPI.sendReminder(eventId);
        showToast(res.message || "Event reminder emails dispatched!");
        return res.data;
      } catch (err) {
        showToast(err.message || "Failed to send reminders", "error");
        throw err;
      }
    },
    [showToast]
  );

  /* ─── Hours Verification ────────────────────────────────────────────────── */
  const submitHourLog = useCallback(
    async (payload) => {
      try {
        const res = await hoursAPI.submit(payload);
        await fetchHourLogs();
        showToast("Volunteering hours submitted for admin audit!");
        return res.data;
      } catch (err) {
        showToast(err.message || "Failed to submit hours", "error");
        throw err;
      }
    },
    [fetchHourLogs, showToast]
  );

  const verifyHourLog = useCallback(
    async (id, payload) => {
      try {
        const res = await hoursAPI.verify(id, payload);
        await fetchHourLogs();
        await fetchAdminStats();
        await fetchPointsHistory();
        showToast(res.message || `Hours verified! Only verified hours count on reports.`);
        return res.data;
      } catch (err) {
        showToast(err.message || "Failed to update hour verification status", "error");
        throw err;
      }
    },
    [fetchHourLogs, fetchAdminStats, fetchPointsHistory, showToast]
  );

  /* ─── Admin Point Adjustments & Broadcasts ──────────────────────────────── */
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

  /* ─── Peer Networking ───────────────────────────────────────────────────── */
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

  /* ─── Notifications ─────────────────────────────────────────────────────── */
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
        sendEventReminder,
        /* Applications */
        applications,
        fetchApplications,
        applyForOpportunity,
        cancelApplication,
        updateApplicationStatus,
        deleteApplication,
        /* Admin Management */
        adminStats,
        fetchAdminStats,
        gradingLevels,
        fetchGradingLevels,
        trackAttendanceAndAwardPoints,
        adjustStudentPoints,
        broadcastNotification,
        /* QR Attendance */
        checkInViaQR,
        openQRAttendance,
        closeQRAttendance,
        /* Certificates */
        certificates,
        fetchCertificates,
        openCertificate,
        closeCertificate,
        /* Badges */
        badges,
        fetchBadges,
        /* Hours Verification */
        hourLogs,
        fetchHourLogs,
        submitHourLog,
        verifyHourLog,
        /* LinkedIn Sharing */
        openLinkedInShare,
        closeLinkedInShare,
        /* Automated Email Audit */
        emailLogs,
        fetchEmailLogs,
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

      {/* Global Modals for Seamless One-Click Invocation */}
      <LinkedInShareModal
        isOpen={linkedInModal.isOpen}
        onClose={closeLinkedInShare}
        volunteerName={linkedInModal.volunteerName}
        eventTitle={linkedInModal.eventTitle}
        hours={linkedInModal.hours}
        category={linkedInModal.category}
        date={linkedInModal.date}
        certificateId={linkedInModal.certificateId}
        onShared={() => showToast("Opening LinkedIn sharing page! Thank you for sharing your impact.")}
      />

      <CertificateModal
        isOpen={certModal.isOpen}
        onClose={closeCertificate}
        certificate={certModal.certificate}
        onOpenLinkedInShare={(cert) => {
          closeCertificate();
          openLinkedInShare({
            volunteerName: cert.volunteerName,
            eventTitle: cert.eventTitle,
            hours: cert.verifiedHours,
            category: cert.eventCategory,
            date: cert.eventDate || cert.issueDate,
            certificateId: cert.certificateId,
          });
        }}
      />

      {qrModal.event && (
        <QRAttendanceModal
          isOpen={qrModal.isOpen}
          onClose={closeQRAttendance}
          event={qrModal.event}
          user={user}
          isAdmin={user?.role === "admin"}
          showToast={showToast}
          onAttendanceVerified={() => {
            fetchEvents();
            fetchApplications();
            fetchPointsHistory();
            fetchCertificates();
          }}
        />
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
