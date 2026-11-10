// frontend/src/pages/admin/AdminEventsPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  CalendarPlus,
  PlusCircle,
  Edit3,
  Trash2,
  ExternalLink,
  Users,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock3,
  Search,
  Filter,
  Sparkles,
  ShieldCheck,
  FileCheck,
  Check,
  X,
  GraduationCap,
  Globe,
  BookOpen,
  HeartHandshake,
  Layers,
  ShieldAlert,
  QrCode,
  Mail,
  Send,
  Award,
  Eye,
  FileText,
  RefreshCw,
  Info,
  MinusCircle,
  UserX,
  Star,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  User,
  Bell,
  Heart,
  UserCheck,
} from "lucide-react";

import { useApp } from "../../context/AppContext";
import { CATEGORIES } from "../../data/mockData";
import { adminAPI } from "../../api/adminAPI";
import { certificatesAPI } from "../../api/certificatesAPI";
import BadgeShowcase from "../../components/common/BadgeShowcase";
import ManageEventCard from "../../components/common/ManageEventCard";
import EventCalendar from "../../components/common/EventCalendar";
import "./AdminEventsPage.css";

export const DEFAULT_ALUMNI_MENTORS = [
  { id: "alu_01", name: "Sundar R", role: "Senior Software Development Engineer", company: "Zoho Corporation", college: "CEG 2022", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80", domain: "Tech & Software" },
  { id: "alu_02", name: "Deepika K", role: "Civil Services Aspirant & Scholar", company: "Government of TN Fellow", college: "MIT 2023", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80", domain: "Public Policy & Education" },
];

export const getEventImage = (opp) => {
  const title = (opp?.title || "").toLowerCase();
  const cat = (opp?.category || "").toLowerCase();

  if (title.includes("beach") || title.includes("shore") || title.includes("coast")) {
    return "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=800&q=80";
  }
  if (title.includes("blood") || title.includes("health") || title.includes("medical") || title.includes("donation")) {
    return "https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=800&q=80";
  }
  if (title.includes("career") || title.includes("guidance") || title.includes("seminar") || title.includes("alumni")) {
    return "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80";
  }
  if (title.includes("tree") || title.includes("plant") || title.includes("forest") || title.includes("green") || cat.includes("outside") || cat.includes("environ")) {
    return "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80";
  }
  if (title.includes("karpom") || title.includes("python") || title.includes("coding") || title.includes("tech") || title.includes("web") || cat.includes("karpom")) {
    return "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80";
  }
  if (title.includes("school") || title.includes("visit") || title.includes("mentoring") || cat.includes("school")) {
    return "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80";
  }
  if (opp?.image && !opp.image.includes("1580582932707") && !opp.image.includes("1524178232363") && !opp.image.includes("1529156069898")) {
    return opp.image;
  }
  return "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80";
};

const INITIAL_FORM = {
  title: "",
  category: "School Visits",
  mode: "Offline",
  date: "",
  time: "9:30 AM - 1:30 PM",
  durationHours: 4,
  points: 50,
  location: "Chennai, Tamil Nadu",
  volunteersNeeded: 12,
  slotsAvailable: 12,
  deadline: "",
  image: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80",
  description: "",
  objectives: "Deliver community impact\nEmpower student volunteers",
  responsibilities: "Coordinate with team leader\nAssist in on-ground drive operations",
  skills: "Communication, Teamwork",
  assignedAlumni: "Sundar R (Senior SDE @ Zoho)",
};

export default function AdminEventsPage() {
  const {
    user,
    opportunities = [],
    addOpportunity,
    updateOpportunity,
    deleteOpportunity,
    applications = [],
    updateApplicationStatus,
    showToast,
    openQRAttendance,
    sendEventReminder,
    hourLogs = [],
    fetchHourLogs,
    verifyHourLog,
    emailLogs = [],
    fetchEmailLogs,
    openCertificate,
  } = useApp();

  const [usersList, setUsersList] = useState([]);

  const totalStudentsCount = useMemo(() => usersList.filter(u => u.role === "student").length, [usersList]);
  const activeVolunteersCount = useMemo(() => usersList.filter(u => u.role === "student" && u.status === "active").length, [usersList]);
  const registeredAlumniCount = useMemo(() => usersList.filter(u => u.role === "alumni" || u.role === "Alumni").length, [usersList]);
  const alumniUsers = useMemo(() => usersList.filter(u => u.role === "alumni" || u.role === "Alumni"), [usersList]);
  const [showAdminCalendar, setShowAdminCalendar] = useState(false);
  const [modalTab, setModalTab] = useState("participated");

  useEffect(() => {
    adminAPI
      .getUsers()
      .then((res) => {
        if (res?.data) setUsersList(res.data);
      })
      .catch(() => {});
  }, []);

  const eventStatusSummary = useMemo(() => {
    const totalEvents = opportunities.length;
    const upcomingEvents = opportunities.filter((o) => (o.eventStatus || "Upcoming") === "Upcoming").length;
    const pendingAppsCount = applications.filter((a) => a.status === "Pending" || a.status === "Applied").length;
    const approvedVolunteersCount = applications.filter((a) => a.status === "Approved").length;
    const assignedVolunteersCount = applications.filter((a) => a.status === "Assigned").length;
    const completedEvents = opportunities.filter((o) => o.eventStatus === "Completed").length;

    return {
      totalEvents,
      upcomingEvents,
      pendingAppsCount,
      approvedVolunteersCount,
      assignedVolunteersCount,
      completedEvents,
    };
  }, [opportunities, applications]);

  const isAdmin = user?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="admin-page-container" style={{ padding: "60px 24px", textAlign: "center" }}>
        <div
          style={{
            maxWidth: 520,
            margin: "0 auto",
            background: "#FFFFFF",
            padding: "44px 36px",
            borderRadius: 24,
            border: "1.5px solid #E2E8F0",
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "#FEF2F2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <ShieldAlert size={38} color="#DC2626" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>
            Admin Authorization Required
          </h2>
          <p style={{ color: "#64748B", fontSize: 14.5, lineHeight: 1.6, marginBottom: 24 }}>
            Event creation, edition, hours verification, and application review controls are restricted exclusively to Maatram Foundation administrators.
          </p>
          <Link to="/dashboard" className="dash-btn dash-btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Active Tab: 'events' | 'applications' | 'hours' | 'badges' | 'emails'
  const [activeTab, setActiveTab] = useState("events");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedMode, setSelectedMode] = useState("All");

  // ── Dedicated Event Management & Participants View State ──────────────────
  const [managingEvent, setManagingEvent] = useState(null);
  const [eventLocalApps, setEventLocalApps] = useState({});
  const [extraEventApps, setExtraEventApps] = useState([]);

  // ── Points Award Modal state ──────────────────────────────────────────────
  const [awardModal, setAwardModal] = useState(null); // { opp, points, reason }
  const [awardingPoints, setAwardingPoints] = useState(false);
  const [awardResult, setAwardResult] = useState(null); // { awarded, total, message }

  // ── Manual Points Adjustment Modal state (matching Image 4) ─────────────
  const [manualPointsModal, setManualPointsModal] = useState(null); // { volunteer: { id, name, appId } }
  const [adjustmentAction, setAdjustmentAction] = useState("CREDIT"); // 'CREDIT' | 'DEBIT'
  const [adjustmentPoints, setAdjustmentPoints] = useState(25);
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [adjustingManualPoints, setAdjustingManualPoints] = useState(false);

  // Application search & filter
  const [appSearch, setAppSearch] = useState("");
  const [appStatusFilter, setAppStatusFilter] = useState("All");

  // Hours verification search & filter
  const [hourSearch, setHourSearch] = useState("");
  const [hourStatusFilter, setHourStatusFilter] = useState("All");
  const [customVerifiedHours, setCustomVerifiedHours] = useState({});

  // Modals state
  const [showEventModal, setShowEventModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // 'add' | 'edit'
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Email preview modal
  const [previewEmail, setPreviewEmail] = useState(null);
  const [sendingTest, setSendingTest] = useState(false);

  // Delete confirmation
  const [deleteModalOpp, setDeleteModalOpp] = useState(null);

  useEffect(() => {
    fetchHourLogs?.();
    fetchEmailLogs?.();
  }, [fetchHourLogs, fetchEmailLogs]);

  // Compute stats safely
  const oppList = opportunities || [];
  const appList = applications || [];
  const hoursList = hourLogs || [];

  const totalSlotsOpen = oppList.reduce(
    (sum, o) => sum + (Number(o?.slotsAvailable) || 0),
    0
  );
  const pendingApps = appList.filter((a) => a?.status === "Pending");
  const approvedApps = appList.filter((a) => a?.status === "Approved");
  const pendingHours = hoursList.filter((h) => h.verificationStatus === "Pending");

  // Filter events safely
  const filteredOpportunities = oppList.filter((opp) => {
    const title = (opp?.title || "").toLowerCase();
    const loc = (opp?.location || "").toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q || title.includes(q) || loc.includes(q);
    const matchCategory =
      selectedCategory === "All" || opp?.category === selectedCategory;
    const matchMode = selectedMode === "All" || opp?.mode === selectedMode;
    return matchSearch && matchCategory && matchMode;
  });

  // Filter applications safely
  const filteredApplications = appList.filter((app) => {
    const q = appSearch.toLowerCase().trim();
    const name = (app?.applicantDetails?.name || app?.name || "").toLowerCase();
    const ref = (app?.referenceId || "").toLowerCase();
    const oppTitle = (app?.opportunityTitle || "").toLowerCase();
    const college = (app?.applicantDetails?.college || "").toLowerCase();
    const matchSearch =
      !q || name.includes(q) || ref.includes(q) || oppTitle.includes(q) || college.includes(q);
    const matchStatus =
      appStatusFilter === "All" || app?.status === appStatusFilter;
    return matchSearch && matchStatus;
  });

  // Filter hours verification submissions
  const filteredHourLogs = hoursList.filter((log) => {
    const q = hourSearch.toLowerCase().trim();
    const volName = (log?.volunteerName || "").toLowerCase();
    const eventName = (log?.eventTitle || "").toLowerCase();
    const matchSearch = !q || volName.includes(q) || eventName.includes(q);
    const matchStatus =
      hourStatusFilter === "All" || log?.verificationStatus === hourStatusFilter;
    return matchSearch && matchStatus;
  });

  // Open modal for Create
  const handleOpenAddModal = () => {
    setModalMode("add");
    setEditingId(null);
    setFormData({
      ...INITIAL_FORM,
      date: new Date(Date.now() + 7 * 86400000).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      deadline: new Date(Date.now() + 5 * 86400000).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    });
    setFormErrors({});
    setShowEventModal(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (opp) => {
    setModalMode("edit");
    setEditingId(opp.id || opp._id);
    setFormData({
      title: opp.title || "",
      category: opp.category || "School Visits",
      mode: opp.mode || "Offline",
      date: opp.date || "",
      time: opp.time || "9:30 AM – 1:30 PM",
      durationHours: opp.durationHours || 4,
      points: opp.points || 50,
      location: opp.location || "Chennai, Tamil Nadu",
      volunteersNeeded: opp.volunteersNeeded || 10,
      slotsAvailable: opp.slotsAvailable || 10,
      deadline: opp.deadline || "",
      image: opp.image || PRESET_IMAGES[0].url,
      description: opp.description || "",
      objectives: Array.isArray(opp.objectives)
        ? opp.objectives.join("\n")
        : opp.objectives || "",
      responsibilities: Array.isArray(opp.responsibilities)
        ? opp.responsibilities.join("\n")
        : opp.responsibilities || "",
      skills: typeof opp.skills === "string" ? opp.skills : (Array.isArray(opp.skills) ? opp.skills.join(", ") : ""),
      eligibility: opp.eligibility || "Open to all registered student volunteers.",
      contactEmail: opp.contactEmail || "coordinator@maatramfoundation.org",
      featured: Boolean(opp.featured),
    });
    setFormErrors({});
    setShowEventModal(true);
  };

  // Form Submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.title.trim()) errors.title = "Event title is required";
    if (!formData.date.trim()) errors.date = "Event date is required";
    if (!formData.location.trim()) errors.location = "Location is required";
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        image: getEventImage(formData),
        volunteersNeeded: Number(formData.volunteersNeeded) || 10,
        slotsAvailable: Number(formData.slotsAvailable) || Number(formData.volunteersNeeded) || 10,
        durationHours: Number(formData.durationHours) || 4,
        points: Number(formData.points) || 50,
        objectives: formData.objectives
          ? (typeof formData.objectives === "string" ? formData.objectives.split("\n").filter((l) => l.trim()) : formData.objectives)
          : ["Encourage student participation and social leadership", "Deliver measurable community impact"],
        responsibilities: formData.responsibilities
          ? (typeof formData.responsibilities === "string" ? formData.responsibilities.split("\n").filter((l) => l.trim()) : formData.responsibilities)
          : ["Coordinate with the lead supervisor", "Assist in drive operations"],
        skills: typeof formData.skills === "string" ? formData.skills : "Communication, Teamwork",
        categorySlug: formData.category ? formData.category.toLowerCase().replace(/\s+/g, "-") : "school-visits",
      };

      if (modalMode === "add") {
        await addOpportunity(payload);
      } else {
        await updateOpportunity(editingId, payload);
      }
      setShowEventModal(false);
    } catch (err) {
      showToast(err.message || "Failed to save volunteering drive", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteModalOpp) {
      deleteOpportunity(deleteModalOpp.id || deleteModalOpp._id);
      setDeleteModalOpp(null);
    }
  };

  // Hours verification actions
  const handleVerifyHourLog = async (logId, action, defaultHours) => {
    const hoursToVerify = customVerifiedHours[logId] !== undefined ? customVerifiedHours[logId] : defaultHours;
    let remarks = "";
    if (action === "Reject") {
      remarks = window.prompt("Reason for rejecting hours submission:", "Attendance could not be verified by on-ground supervisor.");
      if (remarks === null) return;
    } else if (action === "Request Correction") {
      remarks = window.prompt("Correction requested from volunteer:", "Please provide activity photo or coordinator confirmation.");
      if (remarks === null) return;
    }

    try {
      await verifyHourLog(logId, {
        action,
        verifiedHours: Number(hoursToVerify) || defaultHours,
        adminRemarks: remarks,
      });
      fetchHourLogs?.();
    } catch (err) {
      showToast(err.message || "Failed to update hour verification status", "error");
    }
  };

  // ── Dedicated Event Inside Management: Approve / Reject / Complete & Award
  const handleApproveEventVolunteer = async (app) => {
    try {
      if (updateApplicationStatus && app.id && !app.id.startsWith("seed_")) {
        await updateApplicationStatus(app.id, "Approved");
      }
      setEventLocalApps((prev) => ({
        ...prev,
        [app.id]: "Approved",
      }));
      showToast(`✅ ${app.applicantDetails?.name || "Volunteer"} has been approved to participate in this event!`);
    } catch (err) {
      showToast(err.message || "Failed to approve volunteer", "error");
    }
  };

  const handleRejectEventVolunteer = async (app) => {
    try {
      if (updateApplicationStatus && app.id && !app.id.startsWith("seed_")) {
        await updateApplicationStatus(app.id, "Rejected");
      }
      setEventLocalApps((prev) => ({
        ...prev,
        [app.id]: "Rejected",
      }));
      showToast(`Volunteer application marked as Rejected.`);
    } catch (err) {
      showToast(err.message || "Failed to update status", "error");
    }
  };

  const handleRevokeApproval = async (app) => {
    try {
      const targetId = app.id || app._id;
      if (updateApplicationStatus && targetId && !String(targetId).startsWith("seed_")) {
        await updateApplicationStatus(targetId, "Pending");
      }
      setEventLocalApps((prev) => ({
        ...prev,
        [targetId]: "Pending",
      }));
      showToast(`Approval removed for ${app.name || app.applicantDetails?.name || "volunteer"}. Status reset to Pending.`);
    } catch (err) {
      showToast(err.message || "Failed to remove approval", "error");
    }
  };

  const handleCompleteEventInside = async (event, approvedCount) => {
    if (approvedCount === 0) {
      showToast("Please approve at least one volunteer before marking this event as completed.", "error");
      return;
    }
    setAwardingPoints(true);
    try {
      const res = await adminAPI.awardEventPoints(
        event.id || event._id,
        event.points || 50,
        `Event completed: ${event.title}`
      );
      setAwardResult({
        ...res,
        eventTitle: event.title,
        points: event.points || 50,
        linkedInPost: `I am proud to share that I have successfully completed the volunteering initiative for "${event.title}" with Maatram Foundation! Dedicated ${event.durationHours || 4} hours to creating meaningful community impact. Grateful to be part of the change! #MaatramFoundation #Volunteering #SocialImpact #StudentLeadership`,
      });
      setEventLocalApps((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          if (next[k] === "Approved") next[k] = "Completed";
        });
        return next;
      });
      setManagingEvent((prev) => (prev ? { ...prev, eventStatus: "Completed", status: "Completed" } : prev));
      if (updateOpportunity && (event.id || event._id)) {
        updateOpportunity(event.id || event._id, { eventStatus: "Completed", status: "Completed" }).catch(() => {});
      }
      showToast(res.message || "Event completed successfully! Points, certificates, and emails dispatched to approved volunteers.");
    } catch (err) {
      showToast(err.message || "Failed to complete event", "error");
    } finally {
      setAwardingPoints(false);
    }
  };

  // ── Award Points: Mark event completed & bulk-award to all approved volunteers
  const handleAwardEventPoints = async () => {
    if (!awardModal) return;
    setAwardingPoints(true);
    try {
      const res = await adminAPI.awardEventPoints(
        awardModal.opp.id || awardModal.opp._id,
        awardModal.points,
        awardModal.reason || `Event completion: ${awardModal.opp.title}`
      );
      setAwardResult(res);
      showToast(res.message || "Points awarded successfully!");
    } catch (err) {
      showToast(err.message || "Failed to award points", "error");
      setAwardModal(null);
    } finally {
      setAwardingPoints(false);
    }
  };

  // ── Manual Points Adjustment (Credit / Debit) matching Image 4
  const handleManualPointsSubmit = async (e) => {
    e?.preventDefault();
    if (!manualPointsModal || !adjustmentReason.trim()) {
      showToast("Mandatory reason must be provided for point adjustment.", "error");
      return;
    }
    if (!adjustmentPoints || Number(adjustmentPoints) <= 0) {
      showToast("Points must be greater than zero.", "error");
      return;
    }
    setAdjustingManualPoints(true);
    try {
      const volId = manualPointsModal.volunteer.id;
      if (adjustmentAction === "CREDIT") {
        await adminAPI.adjustPoints(volId, {
          points: Number(adjustmentPoints),
          type: "CREDIT",
          reason: adjustmentReason,
          adminRemarks: "Adjusted via event applications management",
        });
        showToast(`✅ Successfully added +${adjustmentPoints} points to ${manualPointsModal.volunteer.name}!`);
      } else {
        await adminAPI.deductPoints(volId, {
          points: Number(adjustmentPoints),
          reason: adjustmentReason,
        });
        showToast(`⚠️ Successfully deducted -${adjustmentPoints} points from ${manualPointsModal.volunteer.name}!`);
      }
      setManualPointsModal(null);
      setAdjustmentReason("");
      setAdjustmentPoints(25);
    } catch (err) {
      showToast(err.message || "Failed to adjust points", "error");
    } finally {
      setAdjustingManualPoints(false);
    }
  };

  // Test email trigger
  const handleTriggerTestEmail = async (triggerType) => {
    try {
      setSendingTest(true);
      const res = await adminAPI.sendTestEmail({ triggerType });
      showToast(res.message || `Test email dispatched!`);
      fetchEmailLogs?.();
    } catch (err) {
      showToast(err.message || "Failed to send test email", "error");
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="admin-page-container">
      {/* ─── HERO HEADER SECTION MATCHING USER REFERENCE IMAGE ─────────────────── */}
      <div className="adm-hero-banner">
        <div className="adm-hero-left">
          <h1 className="adm-hero-title">
            Welcome, <span className="adm-hero-highlight">{user?.fullName || "Admin"}</span>!
          </h1>
          <p className="adm-hero-subtitle">
            You have {opportunities.length} open events, {activeVolunteersCount} active volunteers, and {registeredAlumniCount} registered alumni leads.
          </p>
        </div>
        <div className="adm-hero-glass-stats">
          <div className="adm-glass-stat">
            <Calendar size={18} />
            <div className="adm-glass-stat-text">
              <strong>{opportunities.length}</strong>
              <span>Events</span>
            </div>
          </div>
          <div className="adm-glass-stat">
            <Users size={18} />
            <div className="adm-glass-stat-text">
              <strong>{applications.length}</strong>
              <span>Interests</span>
            </div>
          </div>
          <div className="adm-glass-stat">
            <Star size={18} />
            <div className="adm-glass-stat-text">
              <strong>{activeVolunteersCount}</strong>
              <span>Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 5-COLUMN METRIC TILES & ACTION BUTTON (ACCURATE REAL-TIME DATA) ─── */}
      <section className="adm-quick-stats-row">
        <div className="adm-quick-card">
          <div className="adm-quick-icon-circle">
            <GraduationCap size={22} />
          </div>
          <div className="adm-quick-content">
            <strong className="adm-quick-number">{totalStudentsCount}</strong>
            <span className="adm-quick-label">Total Students</span>
          </div>
        </div>

        <div className="adm-quick-card">
          <div className="adm-quick-icon-circle">
            <Users size={22} />
          </div>
          <div className="adm-quick-content">
            <strong className="adm-quick-number">{activeVolunteersCount}</strong>
            <span className="adm-quick-label">Active Volunteers</span>
          </div>
        </div>

        <div className="adm-quick-card">
          <div className="adm-quick-icon-circle" style={{ background: "#F3E8FF", color: "#7E22CE" }}>
            <Award size={22} />
          </div>
          <div className="adm-quick-content">
            <strong className="adm-quick-number">{registeredAlumniCount}</strong>
            <span className="adm-quick-label">Registered Alumni</span>
          </div>
        </div>

        <div className="adm-quick-card">
          <div className="adm-quick-icon-circle">
            <FileText size={22} />
          </div>
          <div className="adm-quick-content">
            <strong className="adm-quick-number">{applications.length}</strong>
            <span className="adm-quick-label">Event Interests</span>
          </div>
        </div>

        <button
          type="button"
          className="adm-quick-post-btn"
          onClick={handleOpenAddModal}
        >
          <PlusCircle size={20} />
          <span>Post Event</span>
        </button>
      </section>

      {/* ─── TABS NAVIGATION ─────────────────────────────────────────────── */}
      <div className="admin-tabs-nav">
        <button
          className={`admin-tab-btn ${activeTab === "events" ? "active" : ""}`}
          onClick={() => setActiveTab("events")}
        >
          <Layers size={16} />
          <span>Events Catalog ({opportunities.length})</span>
        </button>
        <button
          className={`admin-tab-btn ${activeTab === "applications" ? "active" : ""}`}
          onClick={() => setActiveTab("applications")}
        >
          <Users size={16} />
          <span>Applications ({applications.length})</span>
          {pendingApps.length > 0 && (
            <span className="admin-tab-badge">{pendingApps.length}</span>
          )}
        </button>
        <button
          className={`admin-tab-btn ${activeTab === "hours" ? "active" : ""}`}
          onClick={() => setActiveTab("hours")}
        >
          <Clock size={16} />
          <span>Hours Verification ({hourLogs.length})</span>
          {pendingHours.length > 0 && (
            <span className="admin-tab-badge" style={{ background: "#D97706" }}>
              {pendingHours.length}
            </span>
          )}
        </button>
        <button
          className={`admin-tab-btn ${activeTab === "badges" ? "active" : ""}`}
          onClick={() => setActiveTab("badges")}
        >
          <Award size={16} />
          <span>Badge Management</span>
        </button>
        <button
          className={`admin-tab-btn ${activeTab === "emails" ? "active" : ""}`}
          onClick={() => setActiveTab("emails")}
        >
          <Mail size={16} />
          <span>Email Automation Logs ({emailLogs.length})</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: EVENTS CATALOG (CRUD + QR + REMINDERS) */}
      {/* ============================================================== */}
      {activeTab === "events" && (
        <section className="admin-content-section">
          {/* ───────────────────────────────────────────────────────────── */}
          {/* PHASE 3D: EVENT STATUS SUMMARY (6 Attractive Metric Cards)   */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="adm-event-summary-grid">
            <div className="adm-sum-card total">
              <span className="adm-sum-label">Total Events</span>
              <span className="adm-sum-number">{eventStatusSummary.totalEvents}</span>
              <span className="adm-sum-sub">All created drives</span>
            </div>

            <div className="adm-sum-card upcoming">
              <span className="adm-sum-label">Upcoming Events</span>
              <span className="adm-sum-number">{eventStatusSummary.upcomingEvents}</span>
              <span className="adm-sum-sub">Scheduled on calendar</span>
            </div>

            <div className="adm-sum-card pending">
              <span className="adm-sum-label">Pending Applications</span>
              <span className="adm-sum-number">{eventStatusSummary.pendingAppsCount}</span>
              <span className="adm-sum-sub">Awaiting admin review</span>
            </div>

            <div className="adm-sum-card approved">
              <span className="adm-sum-label">Approved Volunteers</span>
              <span className="adm-sum-number">{eventStatusSummary.approvedVolunteersCount}</span>
              <span className="adm-sum-sub">Accepted to participate</span>
            </div>

            <div className="adm-sum-card assigned">
              <span className="adm-sum-label">Assigned Volunteers</span>
              <span className="adm-sum-number">{eventStatusSummary.assignedVolunteersCount}</span>
              <span className="adm-sum-sub">Assigned to drive duties</span>
            </div>

            <div className="adm-sum-card completed">
              <span className="adm-sum-label">Completed Events</span>
              <span className="adm-sum-number">{eventStatusSummary.completedEvents}</span>
              <span className="adm-sum-sub">Successfully conducted</span>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* PHASE 2B: ADMIN CALENDAR TOGGLE & VIEW                        */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#0F172A" }}>
                {showAdminCalendar ? "Hide Event Calendar" : "Show Admin Monthly Calendar"}
              </h3>
              <button
                type="button"
                className="dash-btn dash-btn-outline"
                onClick={() => setShowAdminCalendar(!showAdminCalendar)}
                style={{ padding: "6px 14px", fontSize: 13 }}
              >
                <Calendar size={14} /> {showAdminCalendar ? "Collapse Calendar" : "View Interactive Calendar"}
              </button>
            </div>

            {showAdminCalendar && (
              <div style={{ marginBottom: 24 }}>
                <EventCalendar
                  mode="admin"
                  events={opportunities}
                  applications={applications}
                  onSelectEvent={(ev) => setManagingEvent(ev)}
                />
              </div>
            )}
          </div>

          {/* SEARCH & FILTERS BAR */}
          <div className="admin-toolbar">
            <div className="admin-search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search events by title or venue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="admin-filters-row">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="admin-select"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
                className="admin-select"
              >
                <option value="All">All Modes</option>
                <option value="Offline">Offline</option>
                <option value="Online">Online</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          {filteredOpportunities.length === 0 ? (
            <div className="admin-empty-box">
              <CalendarPlus size={42} color="#717784" />
              <h3>No volunteering opportunities match your search</h3>
              <p>Adjust your search query or add a new event using the button above.</p>
            </div>
          ) : (
            <div className="adm-events-cards-grid">
              {filteredOpportunities.map((opp, idx) => {
                const oppId = opp.id || opp._id || `opp_${idx}`;
                const isCompleted = opp.eventStatus === "Completed" || opp.status === "Completed";
                const isShortlisted = opp.status === "Shortlisted";
                const statusClass = isCompleted ? "completed" : isShortlisted ? "shortlisted" : "open";
                const statusText = isCompleted ? "Completed" : isShortlisted ? "Shortlisted" : "Open";
                const filled = (opp.volunteersNeeded || 10) - (opp.slotsAvailable || 0);

                return (
                  <div key={oppId} className="adm-event-card">
                    {/* Media with Status Badge */}
                    <div className="adm-event-card-media">
                      <img
                        src={getEventImage(opp)}
                        alt={opp.title}
                        className="adm-event-card-img"
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80";
                        }}
                      />
                      <div className="adm-media-floating-actions">
                        <button
                          type="button"
                          className="adm-media-icon-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            openQRAttendance(opp);
                          }}
                          title="QR Attendance Roster"
                        >
                          <QrCode size={13} />
                        </button>
                        <button
                          type="button"
                          className="adm-media-icon-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            sendEventReminder(oppId);
                          }}
                          title="Send Email Reminder"
                        >
                          <Mail size={13} />
                        </button>
                      </div>
                      <span className={`adm-event-status-badge ${statusClass}`}>
                        {statusText}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="adm-event-card-body">
                      <h3 className="adm-event-title" onClick={() => setManagingEvent(opp)} title={opp.title} style={{ cursor: "pointer" }}>
                        {opp.title}
                      </h3>
                      <p className="adm-event-desc">
                        {opp.description || "Join this community volunteering initiative to coordinate on-ground student leadership drives."}
                      </p>

                      {/* Meta List */}
                      <div className="adm-event-meta-list">
                        <div className="adm-event-meta-item">
                          <Calendar size={13} />
                          <span>{opp.date || "Upcoming"}</span>
                        </div>
                        <div className="adm-event-meta-item">
                          <Clock size={13} />
                          <span>{opp.time || `${opp.durationHours || 4} hrs`}</span>
                        </div>
                        <div className="adm-event-meta-item">
                          <MapPin size={13} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {opp.location || "Tamil Nadu"}
                          </span>
                        </div>
                      </div>

                      {/* Counts Row - Real Time Data */}
                      <div className="adm-event-counts-row">
                        <div>
                          <Users size={14} color="#64748B" />
                          <span>
                            <strong>
                              {applications.filter((a) => String(a.opportunityId?._id || a.opportunityId?.id || a.opportunityId || "") === String(oppId) || String(a.opportunityTitle || "").trim().toLowerCase() === String(opp.title || "").trim().toLowerCase()).length}
                            </strong>{" "}
                            Interested
                          </span>
                        </div>
                        <div>
                          <CheckCircle2 size={14} color="#16A34A" />
                          <span>
                            <strong>
                              {applications.filter((a) => (String(a.opportunityId?._id || a.opportunityId?.id || a.opportunityId || "") === String(oppId) || String(a.opportunityTitle || "").trim().toLowerCase() === String(opp.title || "").trim().toLowerCase()) && (a.status === "Approved" || a.status === "Completed")).length}/{opp.volunteersNeeded || 12}
                            </strong>{" "}
                            Selected
                          </span>
                        </div>
                      </div>

                      {/* Actions Row */}
                      <div className="adm-event-actions-row">
                        <button
                          type="button"
                          className={`adm-card-btn-manage ${isCompleted ? "completed" : ""}`}
                          onClick={() => setManagingEvent(opp)}
                          title="Manage registered volunteers and complete event"
                        >
                          <Eye size={14} /> {isCompleted ? "View" : "Manage"}
                        </button>

                        <button
                          type="button"
                          className="adm-card-btn-edit"
                          onClick={() => handleOpenEditModal(opp)}
                          title="Edit Event"
                        >
                          <Edit3 size={13} /> Edit
                        </button>

                        <button
                          type="button"
                          className="adm-card-btn-delete"
                          onClick={() => setDeleteModalOpp(opp)}
                          title="Delete Event"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </section>
      )}

      {/* ============================================================== */}
      {/* TAB 2: STUDENT APPLICATIONS REVIEW */}
      {/* ============================================================== */}
      {activeTab === "applications" && (
        <section className="admin-content-section">
          <div className="admin-toolbar">
            <div className="admin-search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search applicants by name, ref code, or college..."
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
              />
            </div>

            <div className="admin-filters-row">
              {["All", "Pending", "Approved", "Completed", "Rejected"].map((st) => (
                <button
                  key={st}
                  className={`format-pill-btn ${appStatusFilter === st ? "active" : ""}`}
                  onClick={() => setAppStatusFilter(st)}
                >
                  {st}
                  {st === "Pending" && pendingApps.length > 0 && (
                    <span className="pill-counter">{pendingApps.length}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {filteredApplications.length === 0 ? (
            <div className="admin-empty-box">
              <Users size={42} color="#717784" />
              <h3>No student applications found</h3>
              <p>Applications submitted by volunteers will appear here for review and verification.</p>
            </div>
          ) : (
            <div className="admin-events-table-wrapper">
              <table className="admin-events-table">
                <thead>
                  <tr>
                    <th>Ref ID & Date</th>
                    <th>Student Details</th>
                    <th>Event Applied</th>
                    <th>Category & Mode</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Review Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((app) => (
                    <tr key={app.id || app._id}>
                      <td>
                        <div className="table-meta-cell">
                          <strong className="ref-bold">{app.referenceId}</strong>
                          <span className="time-sub">{app.appliedDate}</span>
                        </div>
                      </td>

                      <td>
                        <div className="applicant-cell">
                          <strong className="applicant-name">
                            {app.applicantDetails?.name || "Student"}
                          </strong>
                          <span className="applicant-sub">
                            {app.applicantDetails?.college || "College Student"}
                          </span>
                          <span className="applicant-email">
                            {app.applicantDetails?.email || "student@maatram.org"}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="table-meta-cell">
                          <strong className="event-table-title">{app.opportunityTitle}</strong>
                          <span className="time-sub">Event Date: {app.eventDate}</span>
                        </div>
                      </td>

                      <td>
                        <div className="table-meta-cell">
                          <span className="category-pill">{app.category}</span>
                          <span className={`mode-pill ${app.mode?.toLowerCase()}`}>
                            {app.mode}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`status-pill ${
                            app.status === "Approved"
                              ? "approved"
                              : app.status === "Rejected"
                              ? "rejected"
                              : app.status === "Completed"
                              ? "approved"
                              : "pending"
                          }`}
                        >
                          {app.status === "Approved" && <CheckCircle2 size={13} />}
                          {app.status === "Pending" && <Clock3 size={13} />}
                          {app.status === "Rejected" && <XCircle size={13} />}
                          {app.status}
                        </span>
                      </td>

                      <td>
                        <div className="admin-actions-cell">
                          {app.status !== "Approved" && app.status !== "Completed" && (
                            <button
                              className="action-btn-approve"
                              onClick={() =>
                                updateApplicationStatus(
                                  app.id || app._id,
                                  "Approved",
                                  "Application verified and approved by admin coordinator."
                                )
                              }
                              title="Approve Application & Send Automated Email"
                            >
                              <Check size={14} /> Approve
                            </button>
                          )}

                          {app.status !== "Rejected" && (
                            <button
                              className="action-btn-reject"
                              onClick={() =>
                                updateApplicationStatus(
                                  app.id || app._id,
                                  "Rejected",
                                  "Application declined due to slot capacity constraints."
                                )
                              }
                              title="Reject Application & Send Automated Email"
                            >
                              <X size={14} /> Reject
                            </button>
                          )}

                          {(app.status === "Approved" || app.status === "Completed") && (
                            <button
                              className="action-icon-btn"
                              style={{
                                background: "#F0FDF4",
                                color: "#16A34A",
                                border: "1.5px solid #86EFAC",
                                borderRadius: 8,
                                padding: "5px 10px",
                                fontSize: 12,
                                fontWeight: 700,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                whiteSpace: "nowrap",
                              }}
                              onClick={() => {
                                setManualPointsModal({
                                  volunteer: {
                                    id: app.userId?._id || app.userId || app.id || "vol_1",
                                    name: app.applicantDetails?.name || app.name || "Volunteer",
                                    appId: app.applicantDetails?.applicationId || app.referenceId || "MAA001",
                                  },
                                });
                                setAdjustmentAction("CREDIT");
                                setAdjustmentPoints(25);
                                setAdjustmentReason("");
                              }}
                              title="Adjust Points for this Volunteer"
                            >
                              <Award size={13} /> Adjust Points
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ============================================================== */}
      {/* TAB 3: HOURS VERIFICATION QUEUE */}
      {/* ============================================================== */}
      {activeTab === "hours" && (
        <section className="admin-content-section">
          {/* Important Rule Notice */}
          <div
            style={{
              background: "#EFF6FF",
              border: "1px solid #BFDBFE",
              borderRadius: 12,
              padding: "14px 18px",
              marginBottom: 18,
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 13,
              color: "#1E40AF",
            }}
          >
            <ShieldCheck size={20} color="#0066CC" style={{ flexShrink: 0 }} />
            <span>
              <strong>Official Hours Audit Protocol:</strong> Review submitted volunteer contribution hours. Once verified, hours are committed to the volunteer's official transcript and leadership leaderboard. <em>Only verified hours are counted in official contribution reports and ranking tables.</em>
            </span>
          </div>

          <div className="admin-toolbar">
            <div className="admin-search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search by volunteer name or initiative..."
                value={hourSearch}
                onChange={(e) => setHourSearch(e.target.value)}
              />
            </div>

            <div className="admin-filters-row">
              {["All", "Pending", "Verified", "Rejected", "Correction Requested"].map((st) => (
                <button
                  key={st}
                  className={`format-pill-btn ${hourStatusFilter === st ? "active" : ""}`}
                  onClick={() => setHourStatusFilter(st)}
                >
                  {st}
                  {st === "Pending" && pendingHours.length > 0 && (
                    <span className="pill-counter">{pendingHours.length}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {filteredHourLogs.length === 0 ? (
            <div className="admin-empty-box">
              <Clock size={42} color="#717784" />
              <h3>No hour verification submissions found</h3>
              <p>Submissions will appear here when volunteers submit on-ground field hours for verification.</p>
            </div>
          ) : (
            <div className="admin-events-table-wrapper">
              <table className="admin-events-table">
                <thead>
                  <tr>
                    <th>Volunteer Name</th>
                    <th>Event / Activity</th>
                    <th>Participation Date</th>
                    <th>Submitted Hours</th>
                    <th>Verified Hours</th>
                    <th>Evidence / Remarks</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Verification Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHourLogs.map((log) => {
                    const logId = log.id || log._id;
                    const status = log.verificationStatus || "Pending";

                    return (
                      <tr key={logId}>
                        <td>
                          <div className="applicant-cell">
                            <strong className="applicant-name">{log.volunteerName}</strong>
                            <span className="applicant-email">{log.volunteerEmail || log.college}</span>
                          </div>
                        </td>

                        <td>
                          <div className="table-meta-cell">
                            <strong className="event-table-title">{log.eventTitle}</strong>
                            <span className="category-pill">{log.eventCategory}</span>
                          </div>
                        </td>

                        <td>
                          <span style={{ fontSize: 13, color: "#334155" }}>{log.participationDate}</span>
                        </td>

                        <td>
                          <strong style={{ fontSize: 14, color: "#0066CC" }}>
                            {log.submittedHours} hrs
                          </strong>
                        </td>

                        <td>
                          <input
                            type="number"
                            min="0.5"
                            max="24"
                            step="0.5"
                            defaultValue={log.verifiedHours || log.submittedHours}
                            onChange={(e) =>
                              setCustomVerifiedHours({
                                ...customVerifiedHours,
                                [logId]: Number(e.target.value),
                              })
                            }
                            style={{ width: 68, padding: "4px 8px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13 }}
                          />
                        </td>

                        <td style={{ maxWidth: 220 }}>
                          <span style={{ fontSize: 12, color: "#475569" }}>
                            {log.evidenceRemarks || "No remarks provided"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`status-pill ${
                              status === "Verified"
                                ? "approved"
                                : status === "Rejected"
                                ? "rejected"
                                : status === "Correction Requested"
                                ? "cancelled"
                                : "pending"
                            }`}
                          >
                            {status}
                          </span>
                        </td>

                        <td>
                          <div className="admin-actions-cell">
                            <button
                              className="action-btn-approve"
                              onClick={() => handleVerifyHourLog(logId, "Verify", log.submittedHours)}
                              title="Verify & Award Hours"
                            >
                              <Check size={14} /> Verify
                            </button>

                            <button
                              className="action-btn-reject"
                              onClick={() => handleVerifyHourLog(logId, "Reject", log.submittedHours)}
                              title="Reject Hours"
                            >
                              <X size={14} /> Reject
                            </button>

                            <button
                              onClick={() => handleVerifyHourLog(logId, "Request Correction", log.submittedHours)}
                              style={{
                                background: "#FEF9C3",
                                border: "1px solid #FDE047",
                                color: "#854D0E",
                                fontSize: 11,
                                fontWeight: 700,
                                padding: "4px 8px",
                                borderRadius: 6,
                                cursor: "pointer",
                              }}
                              title="Request Correction from volunteer"
                            >
                              Correction
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ============================================================== */}
      {/* TAB 4: BADGE MANAGEMENT */}
      {/* ============================================================== */}
      {activeTab === "badges" && (
        <section className="admin-content-section">
          <BadgeShowcase user={user} isAdmin={true} showToast={showToast} />
        </section>
      )}

      {/* ============================================================== */}
      {/* TAB 5: AUTOMATED EMAIL AUDIT LOGS */}
      {/* ============================================================== */}
      {activeTab === "emails" && (
        <section className="admin-content-section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "#0F172A" }}>
                Automated Email Communication Engine
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: "#64748B" }}>
                Live dispatch log of all automated notification emails triggered across the platform.
              </p>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <select
                id="test-trigger-select"
                className="admin-select"
                defaultValue="thank_you"
                style={{ fontSize: 12.5 }}
              >
                <option value="registration_confirmation">Trigger: Registration Confirmation</option>
                <option value="application_approval">Trigger: Application Approval</option>
                <option value="application_rejection">Trigger: Application Rejection</option>
                <option value="event_reminder">Trigger: Event Reminder</option>
                <option value="hours_verification">Trigger: Hours Verification</option>
                <option value="thank_you">Trigger: Thank-you Message</option>
                <option value="certificate_availability">Trigger: Certificate Availability</option>
              </select>

              <button
                className="dash-btn dash-btn-primary"
                onClick={() => {
                  const selectEl = document.getElementById("test-trigger-select");
                  handleTriggerTestEmail(selectEl?.value || "thank_you");
                }}
                disabled={sendingTest}
                style={{ fontSize: 12.5 }}
              >
                <Send size={14} /> {sendingTest ? "Sending..." : "Test Trigger"}
              </button>
            </div>
          </div>

          {emailLogs.length === 0 ? (
            <div className="admin-empty-box">
              <Mail size={42} color="#717784" />
              <h3>No email dispatches recorded yet</h3>
              <p>Emails triggered by registration, approvals, reminders, and certificates will appear here.</p>
            </div>
          ) : (
            <div className="admin-events-table-wrapper">
              <table className="admin-events-table">
                <thead>
                  <tr>
                    <th>Trigger Type</th>
                    <th>Recipient</th>
                    <th>Subject Line</th>
                    <th>Status</th>
                    <th>Dispatched At</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {emailLogs.map((log) => (
                    <tr key={log._id || log.id}>
                      <td>
                        <span
                          style={{
                            fontSize: 11.5,
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: 6,
                            background: "#EFF6FF",
                            color: "#1D4ED8",
                            textTransform: "uppercase",
                          }}
                        >
                          {log.triggerType?.replace(/_/g, " ")}
                        </span>
                      </td>

                      <td>
                        <div className="applicant-cell">
                          <strong className="applicant-name">{log.recipientName}</strong>
                          <span className="applicant-email">{log.recipientEmail}</span>
                        </div>
                      </td>

                      <td>
                        <strong style={{ fontSize: 13, color: "#0F172A" }}>{log.subject}</strong>
                      </td>

                      <td>
                        <span className="status-pill approved">
                          <CheckCircle2 size={12} /> {log.status || "Delivered"}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: 12, color: "#64748B" }}>
                          {new Date(log.sentAt || log.createdAt).toLocaleString()}
                        </span>
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <button
                          className="dash-btn dash-btn-outline"
                          onClick={() => setPreviewEmail(log)}
                          style={{ fontSize: 12, padding: "5px 10px" }}
                        >
                          <Eye size={13} /> Preview HTML
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ============================================================== */}
      {/* EMAIL PREVIEW MODAL */}
      {/* ============================================================== */}
      {previewEmail && (
        <div className="modal-backdrop" onClick={() => setPreviewEmail(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: 680, maxHeight: "90vh", overflowY: "auto", padding: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: 18, color: "#0F172A" }}>Email Dispatch Preview</h3>
                <span style={{ fontSize: 12, color: "#64748B" }}>
                  To: <strong>{previewEmail.recipientEmail}</strong> &bull; Subject: {previewEmail.subject}
                </span>
              </div>
              <button className="modal-close-btn" onClick={() => setPreviewEmail(null)}>
                <X size={20} />
              </button>
            </div>

            <div
              style={{
                border: "1px solid #E2E8F0",
                borderRadius: 12,
                overflow: "hidden",
                marginTop: 14,
              }}
              dangerouslySetInnerHTML={{ __html: previewEmail.htmlContent }}
            />
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ADD / EDIT EVENT MODAL */}
      {/* ============================================================== */}
      {showEventModal && (
        <div className="modal-backdrop" onClick={() => setShowEventModal(false)}>
          <div
            className="modal-content modal-content-large"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title-row">
                <CalendarPlus size={24} color="#D97706" />
                <h3>
                  {modalMode === "add"
                    ? "Post New Volunteering Opportunity"
                    : "Edit Volunteering Opportunity"}
                </h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setShowEventModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="admin-event-form">
              {/* Event Title */}
              <div className="form-group-full">
                <label>Event Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Government Higher Secondary School Career Mentoring"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className={formErrors.title ? "has-error" : ""}
                />
                {formErrors.title && (
                  <span className="error-text">{formErrors.title}</span>
                )}
              </div>

              {/* Category, Mode, Duration */}
              <div className="form-row-3">
                <div>
                  <label>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.slug} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>Mode / Format *</label>
                  <select
                    value={formData.mode}
                    onChange={(e) =>
                      setFormData({ ...formData, mode: e.target.value })
                    }
                  >
                    <option value="Offline">Offline</option>
                    <option value="Online">Online</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label>Duration (Hours) *</label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={formData.durationHours}
                    onChange={(e) =>
                      setFormData({ ...formData, durationHours: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Date, Time, Deadline */}
              <div className="form-row-3">
                <div>
                  <label>Event Date *</label>
                  <input
                    type="text"
                    placeholder="e.g. 15 May 2026 (Thu)"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className={formErrors.date ? "has-error" : ""}
                  />
                  {formErrors.date && (
                    <span className="error-text">{formErrors.date}</span>
                  )}
                </div>

                <div>
                  <label>Timing Schedule</label>
                  <input
                    type="text"
                    placeholder="e.g. 9:30 AM – 1:30 PM (4 hrs)"
                    value={formData.time}
                    onChange={(e) =>
                      setFormData({ ...formData, time: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label>Application Deadline *</label>
                  <input
                    type="text"
                    placeholder="e.g. 12 May 2026"
                    value={formData.deadline}
                    onChange={(e) =>
                      setFormData({ ...formData, deadline: e.target.value })
                    }
                    className={formErrors.deadline ? "has-error" : ""}
                  />
                  {formErrors.deadline && (
                    <span className="error-text">{formErrors.deadline}</span>
                  )}
                </div>
              </div>

              {/* Location / Venue */}
              <div className="form-group-full">
                <label>Venue / Location / Meeting Link *</label>
                <input
                  type="text"
                  placeholder="e.g. Government Higher Secondary School, Saidapet, Chennai"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className={formErrors.location ? "has-error" : ""}
                />
                {formErrors.location && (
                  <span className="error-text">{formErrors.location}</span>
                )}
              </div>

              {/* Volunteers Needed & Available Slots */}
              <div className="form-row-2">
                <div>
                  <label>Total Volunteers Needed *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.volunteersNeeded}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        volunteersNeeded: e.target.value,
                        ...(modalMode === "add"
                          ? { slotsAvailable: e.target.value }
                          : {}),
                      })
                    }
                    className={formErrors.volunteersNeeded ? "has-error" : ""}
                  />
                </div>

                <div>
                  <label>Open Slots Remaining *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.slotsAvailable}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        slotsAvailable: e.target.value,
                      })
                    }
                    className={formErrors.slotsAvailable ? "has-error" : ""}
                  />
                </div>
              </div>

              {/* Points Allocated */}
              <div className="form-group-full">
                <label>Volunteering Points Awarded on Completion *</label>
                <input
                  type="number"
                  min="5"
                  max="500"
                  value={formData.points || 50}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      points: e.target.value,
                    })
                  }
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #CBD5E1" }}
                />
              </div>

              {/* Cover Image Upload & Preview */}
              <div className="form-group-full">
                <label>Event Cover Image (Upload Custom Photo or Auto-Generate)</label>
                <div className="adm-image-uploader-box">
                  {formData.image ? (
                    <div className="adm-image-preview-wrapper">
                      <img src={formData.image} alt="Cover Preview" className="adm-upload-preview-img" />
                      <div className="adm-image-preview-overlay">
                        <label className="adm-change-img-btn">
                          <Upload size={14} /> Upload Custom Photo
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setFormData({ ...formData, image: reader.result });
                                  showToast("Image uploaded successfully!", "success");
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          className="adm-auto-img-btn"
                          onClick={() => setFormData({ ...formData, image: getEventImage(formData) })}
                        >
                          <RefreshCw size={13} /> Reset to Smart Photo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="adm-upload-dropzone">
                      <Upload size={28} color="#2563EB" />
                      <span>Click to upload a custom event cover photo</span>
                      <small>PNG, JPG, WebP supported</small>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormData({ ...formData, image: reader.result });
                              showToast("Image uploaded successfully!", "success");
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Assigned Alumni Mentor */}
              <div className="form-group-full">
                <label>Assigned Alumni Mentor & Event Lead</label>
                <select
                  value={formData.assignedAlumni || "Sundar R (Senior SDE @ Zoho)"}
                  onChange={(e) => setFormData({ ...formData, assignedAlumni: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13.5 }}
                >
                  <option value="Sundar R (Senior SDE @ Zoho)">Sundar R (Senior SDE @ Zoho - CEG Alum)</option>
                  <option value="Deepika K (Civil Services Aspirant)">Deepika K (Civil Services Aspirant - MIT Alum)</option>
                  <option value="Gautham M (Robotics Systems Lead @ Ather)">Gautham M (Robotics Systems Lead @ Ather - VEC Alum)</option>
                  <option value="Pavithra S (Senior Data Analyst @ TCS)">Pavithra S (Senior Data Analyst @ TCS - Anna Univ Alum)</option>
                  <option value="Admin Supervised">Admin Supervised (Direct Coordinator)</option>
                </select>
              </div>

              {/* Description */}
              <div className="form-group-full">
                <label>Event Description *</label>
                <textarea
                  rows="3"
                  placeholder="Provide an inspirational description of the volunteering activity..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className={formErrors.description ? "has-error" : ""}
                />
              </div>

              {/* Objectives */}
              <div className="form-group-full">
                <label>Key Objectives (1 per line)</label>
                <textarea
                  rows="2"
                  value={formData.objectives}
                  onChange={(e) =>
                    setFormData({ ...formData, objectives: e.target.value })
                  }
                />
              </div>

              {/* Responsibilities */}
              <div className="form-group-full">
                <label>Volunteer Responsibilities (1 per line)</label>
                <textarea
                  rows="2"
                  value={formData.responsibilities}
                  onChange={(e) =>
                    setFormData({ ...formData, responsibilities: e.target.value })
                  }
                />
              </div>

              {/* Skills */}
              <div className="form-row-2">
                <div>
                  <label>Skills Required (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.skills}
                    onChange={(e) =>
                      setFormData({ ...formData, skills: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label>Coordinator Contact Email</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, contactEmail: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="modal-actions-row">
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => setShowEventModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={submitting}>
                  {submitting ? "Saving Drive..." : modalMode === "add" ? "Publish Drive" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ============================================================== */}
      {deleteModalOpp && (
        <div className="modal-backdrop" onClick={() => setDeleteModalOpp(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <AlertCircle size={26} color="#EF4444" />
              <h3>Delete Volunteering Drive?</h3>
            </div>
            <p className="modal-text">
              Are you sure you want to remove{" "}
              <strong>"{deleteModalOpp.title}"</strong> from the directory?
            </p>

            <div className="modal-actions-row">
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={() => setDeleteModalOpp(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={handleDeleteConfirm}
              >
                <Trash2 size={16} /> Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MANAGE EVENT INSIDE: REGISTERED PARTICIPANTS + APPROVE + BULK AWARD
      ══════════════════════════════════════════════════════════════════ */}
      {managingEvent && (
        <div className="modal-backdrop" onClick={() => setManagingEvent(null)} style={{ zIndex: 1200 }}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 920, width: "95%", maxHeight: "90vh", overflowY: "auto", padding: 0, borderRadius: 24, boxShadow: "0 25px 60px -15px rgba(0,0,0,0.45)" }}
          >
            {/* Executive Header */}
            <div className="manage-event-header">
              <div style={{ maxWidth: "88%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.8, background: "#CA8A04", color: "#000", padding: "3px 10px", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <Sparkles size={12} /> {managingEvent.category}
                  </span>
                </div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#FFFFFF", lineHeight: 1.3 }}>
                  {managingEvent.title}
                </h2>
                <div style={{ display: "flex", gap: 12, marginTop: 12, fontSize: 12.5, color: "#CBD5E1", flexWrap: "wrap" }}>
                  <span style={{ background: "rgba(255,255,255,0.08)", padding: "4px 10px", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <Calendar size={13} color="#93C5FD" /> {managingEvent.date}
                  </span>
                  <span style={{ background: "rgba(255,255,255,0.08)", padding: "4px 10px", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <Clock size={13} color="#93C5FD" /> {managingEvent.time || `${managingEvent.durationHours || 4} hrs`}
                  </span>
                  <span style={{ background: "rgba(255,255,255,0.08)", padding: "4px 10px", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <MapPin size={13} color="#93C5FD" /> {managingEvent.location}
                  </span>
                  <span style={{ background: "rgba(250, 204, 21, 0.15)", color: "#FDE047", padding: "4px 10px", borderRadius: 8, fontWeight: 700, border: "1px solid rgba(250, 204, 21, 0.3)" }}>
                    🏆 +{managingEvent.points || 50} pts configured
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setManagingEvent(null)}
                style={{ background: "rgba(255,255,255,0.12)", border: "none", color: "#FFFFFF", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.25)"; e.currentTarget.style.transform = "rotate(90deg)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.transform = "none"; }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Event Completion Hero Banner */}
            <div style={{ padding: "22px 28px", background: "#F8FAFC", borderBottom: "1.5px solid #E2E8F0" }}>
              {(() => {
                const oppId = String(managingEvent.id || managingEvent._id || "");
                const eventTitle = (managingEvent.title || "").trim().toLowerCase();

                // Only show volunteers and applications that actually registered for this specific event
                const rawApps = applications.filter((a) => {
                  const aOppId = String(a.opportunityId?._id || a.opportunityId?.id || a.opportunityId || "");
                  const aTitle = String(a.opportunityTitle || a.opportunity?.title || "").trim().toLowerCase();
                  return (oppId && aOppId === oppId) || (eventTitle && aTitle === eventTitle);
                });

                const matchingExtra = extraEventApps.filter((a) => {
                  const aOppId = String(a.opportunityId || "");
                  const aTitle = String(a.opportunityTitle || "").trim().toLowerCase();
                  return (oppId && aOppId === oppId) || (eventTitle && aTitle === eventTitle);
                });

                let resolvedApps = [...rawApps, ...matchingExtra];

                const allCurrentApps = resolvedApps.map((a) => ({
                  ...a,
                  status: eventLocalApps[a.id || a._id] || a.status || "Pending",
                }));

                const approvedCount = allCurrentApps.filter((a) => a.status === "Approved" || a.status === "Completed").length;
                const isCompleted = managingEvent.eventStatus === "Completed" || managingEvent.status === "Completed";

                // Filter by selected modal tab
                const currentApps = (() => {
                  if (modalTab === "participated") return allCurrentApps.filter(a => a.status === "Completed");
                  if (modalTab === "pending") return allCurrentApps.filter(a => a.status === "Pending" || a.status === "Applied");
                  if (modalTab === "approved") return allCurrentApps.filter(a => a.status === "Approved");
                  if (modalTab === "assigned") return allCurrentApps.filter(a => a.status === "Assigned");
                  // "interested" – show all (we don't have separate "interested" vs "applied" data)
                  return allCurrentApps;
                })();

                return (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#1E293B" }}>
                            Event Lifecycle Status:
                          </span>
                          <span style={{ background: isCompleted ? "#DCFCE7" : "#FEF3C7", color: isCompleted ? "#15803D" : "#B45309", padding: "5px 14px", borderRadius: 16, fontSize: 12.5, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6, border: isCompleted ? "1px solid #86EFAC" : "1px solid #FDE68A" }}>
                            <span className="pulse-dot" style={{ background: isCompleted ? "#16A34A" : "#D97706" }}></span>
                            {isCompleted ? "Completed & Certified" : "In Progress / Active"}
                          </span>
                        </div>
                        <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "#64748B" }}>
                          {approvedCount} Approved Volunteer{approvedCount !== 1 ? "s" : ""} will receive <strong>+{managingEvent.points || 50} pts</strong>, Certificate, and Thank-you Email upon completion.
                        </p>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ background: "rgba(245, 158, 11, 0.12)", border: "1px solid #FDE68A", padding: "6px 14px", borderRadius: 10, display: "flex", alignItems: "center", gap: 6 }}>
                          <Award size={15} color="#D97706" />
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: "#92400E" }}>
                            +{managingEvent.points || 50} Points Award Configuration
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ── 5 STAT BOXES (matching user reference image) ── */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginTop: 14, marginBottom: 14 }}>
                      <div style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "12px 10px", display: "flex", alignItems: "center", gap: 8 }}>
                        <Users size={16} color="#0F172A" style={{ flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", lineHeight: 1 }}>{allCurrentApps.length}</div>
                          <div style={{ fontSize: 10.5, color: "#64748B", fontWeight: 600, marginTop: 2 }}>Interested</div>
                        </div>
                      </div>
                      <div style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "12px 10px", display: "flex", alignItems: "center", gap: 8 }}>
                        <User size={16} color="#0F172A" style={{ flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", lineHeight: 1 }}>{approvedCount} / {managingEvent.volunteersNeeded || 8}</div>
                          <div style={{ fontSize: 10.5, color: "#64748B", fontWeight: 600, marginTop: 2 }}>Volunteers</div>
                        </div>
                      </div>
                      <div style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "12px 10px", display: "flex", alignItems: "center", gap: 8 }}>
                        <Clock size={16} color="#0F172A" style={{ flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", lineHeight: 1 }}>{approvedCount * (managingEvent.durationHours || 4)}</div>
                          <div style={{ fontSize: 10.5, color: "#64748B", fontWeight: 600, marginTop: 2 }}>Total Hours</div>
                        </div>
                      </div>
                      <div style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "12px 10px", display: "flex", alignItems: "center", gap: 8 }}>
                        <Mail size={16} color="#0F172A" style={{ flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", lineHeight: 1 }}>{managingEvent.emailsSent !== false ? "Yes" : "No"}</div>
                          <div style={{ fontSize: 10.5, color: "#64748B", fontWeight: 600, marginTop: 2 }}>Emails Sent</div>
                        </div>
                      </div>
                      <div style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "12px 10px", display: "flex", alignItems: "center", gap: 8 }}>
                        <Bell size={16} color="#0F172A" style={{ flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", lineHeight: 1 }}>{managingEvent.reminderSent !== false ? "Yes" : "No"}</div>
                          <div style={{ fontSize: 10.5, color: "#64748B", fontWeight: 600, marginTop: 2 }}>Reminder Sent</div>
                        </div>
                      </div>
                    </div>

                    {/* Assigned Alumni Mentor Executive Card */}
                    <div style={{ marginTop: 16, padding: "14px 20px", background: "linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%)", border: "1.5px solid #BFDBFE", borderRadius: 14, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 10, background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", boxShadow: "0 2px 6px rgba(37,99,235,0.3)" }}>
                          <GraduationCap size={22} />
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: "#1E40AF", textTransform: "uppercase", letterSpacing: 0.5 }}>
                              Assigned Alumni Mentor &amp; Supervisor
                            </span>
                            <span style={{ fontSize: 10.5, fontWeight: 700, background: "#DBEAFE", color: "#1D4ED8", padding: "1px 6px", borderRadius: 4 }}>
                              Verified Alum
                            </span>
                          </div>
                          <strong style={{ fontSize: 14.5, color: "#0F172A", display: "block", marginTop: 2 }}>
                            {managingEvent.assignedAlumni || "Sundar R (Senior SDE @ Zoho)"}
                          </strong>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, color: "#475569", fontWeight: 700 }}>Reassign:</span>
                        <select
                          value={managingEvent.assignedAlumni || (alumniUsers.length > 0 ? `${alumniUsers[0].fullName} (${alumniUsers[0].designation || alumniUsers[0].role || 'Alumni Leader'} @ ${alumniUsers[0].organization || alumniUsers[0].company || 'Zoho'})` : "Sundar R (Senior SDE @ Zoho)")}
                          onChange={async (e) => {
                            const newAlumni = e.target.value;
                            setManagingEvent({ ...managingEvent, assignedAlumni: newAlumni });
                            await updateOpportunity(managingEvent.id || managingEvent._id, { assignedAlumni: newAlumni });
                            
                            // Find matching registered alumni user
                            const matchedAlum = alumniUsers.find((a) => {
                              const label = `${a.fullName} (${a.designation || a.role || "Alumni Leader"} @ ${a.organization || a.company || "Zoho"})`;
                              return label === newAlumni || a.fullName === newAlumni;
                            });
                            if (matchedAlum) {
                              try {
                                await adminAPI.assignWork(matchedAlum.id || matchedAlum._id, {
                                  targetEvent: managingEvent.title,
                                  targetRole: "Event Lead & Supervisor",
                                  targetDate: managingEvent.date || new Date().toISOString().split("T")[0],
                                  targetDesc: `Lead and supervise on-ground student drive for "${managingEvent.title}".`,
                                });
                              } catch (err) {
                                console.warn("Could not sync assignWork to alumni:", err);
                              }
                            }
                            showToast(`Assigned event to Alumni: ${newAlumni}`, "success");
                          }}
                          style={{ padding: "7px 14px", fontSize: 12.5, borderRadius: 8, border: "1.5px solid #93C5FD", background: "#FFFFFF", color: "#1E3A8A", fontWeight: 700, cursor: "pointer" }}
                        >
                          {alumniUsers.map((a) => {
                            const label = `${a.fullName} (${a.designation || a.role || "Alumni Leader"} @ ${a.organization || a.company || "Zoho"})`;
                            return (
                              <option key={a.id || a._id} value={label}>
                                {a.fullName} ({a.applicationId || "ALU"} - {a.designation || a.role || "Alumni"} @ {a.organization || a.company || "Zoho"})
                              </option>
                            );
                          })}
                          <option value="Sundar R (Senior SDE @ Zoho)">Sundar R (Senior SDE @ Zoho)</option>
                          <option value="Deepika K (Civil Services Aspirant & Public Policy Fellow)">Deepika K (Civil Services Aspirant &amp; Public Policy Fellow)</option>
                          <option value="Direct Admin Supervised">Direct Admin Supervised</option>
                        </select>
                      </div>
                    </div>

                    {/* Participants list */}
                    <div style={{ marginTop: 22 }}>
                      {/* ── VOLUNTEER CATEGORY TABS ── */}
                      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                        {[
                          { key: "participated", label: "Volunteers Who Participated", count: currentApps.filter(a => a.status === "Completed").length, color: "#CA8A04", bg: "#FEF9C3" },
                          { key: "interested", label: "Interested Volunteers", count: allCurrentApps.length, color: "#2563EB", bg: "#DBEAFE" },
                          { key: "pending", label: "Pending Applications", count: currentApps.filter(a => a.status === "Pending" || a.status === "Applied").length, color: "#D97706", bg: "#FEF3C7" },
                          { key: "approved", label: "Approved Volunteers", count: approvedCount, color: "#16A34A", bg: "#DCFCE7" },
                          { key: "assigned", label: "Assigned", count: currentApps.filter(a => a.status === "Assigned").length, color: "#7C3AED", bg: "#EDE9FE" },
                        ].map(tab => (
                          <button
                            key={tab.key}
                            type="button"
                            onClick={() => setModalTab(tab.key)}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 6,
                              padding: "7px 14px", borderRadius: 24, fontSize: 12.5, fontWeight: 700, cursor: "pointer",
                              transition: "all 0.15s",
                              background: modalTab === tab.key ? tab.bg : "#F8FAFC",
                              color: modalTab === tab.key ? tab.color : "#64748B",
                              border: modalTab === tab.key ? `1.5px solid ${tab.color}55` : "1.5px solid #E2E8F0",
                            }}
                          >
                            {tab.label}
                            <span style={{ background: modalTab === tab.key ? tab.color : "#E2E8F0", color: modalTab === tab.key ? "#fff" : "#64748B", borderRadius: 12, padding: "1px 7px", fontSize: 11, fontWeight: 800 }}>
                              {tab.count}
                            </span>
                          </button>
                        ))}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
                          <Users size={18} color="#2563EB" /> Registered Volunteers &amp; Applications ({currentApps.length})
                        </h4>
                        <span style={{ fontSize: 12, color: "#64748B" }}>
                          Approve volunteers for participation before completing event
                        </span>
                      </div>

                      {/* Clean structured table matching Registered Volunteers style */}
                      <div style={{ border: "1.5px solid #E2E8F0", borderRadius: 14, overflow: "hidden", background: "#FFFFFF" }}>
                        <table className="admin-table" style={{ margin: 0 }}>
                          <thead>
                            <tr>
                              <th style={{ width: 45 }}>#</th>
                              <th>VOLUNTEER</th>
                              <th>COLLEGE</th>
                              <th>DEPT &amp; YEAR</th>
                              <th>STATUS</th>
                              <th style={{ textAlign: "right" }}>ACTIONS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentApps.length === 0 ? (
                              <tr>
                                <td colSpan={6} style={{ padding: "40px 20px", textAlign: "center", color: "#64748B" }}>
                                  <Users size={32} style={{ display: "block", margin: "0 auto 10px", color: "#94A3B8" }} />
                                  <strong style={{ fontSize: 14, color: "#1E293B", display: "block", marginBottom: 4 }}>
                                    No Registered Volunteers for this Event Yet
                                  </strong>
                                  <span style={{ fontSize: 12.5 }}>
                                    Only students who have registered for this event will appear here.
                                  </span>
                                </td>
                              </tr>
                            ) : (
                              currentApps.map((app, idx) => {
                              const name = app.applicantDetails?.name || app.name || (app.userId && app.userId.fullName) || "Student Volunteer";
                              const email = app.applicantDetails?.email || app.email || (app.userId && app.userId.email) || "";
                              const college = app.applicantDetails?.college || (app.userId && app.userId.college) || "Velammal Engineering college, Chennai";
                              const dept = app.applicantDetails?.department || (app.userId && app.userId.department) || "Mechanical";
                              const year = app.applicantDetails?.academicYear || (app.userId && app.userId.academicYear) || "3rd Year";
                              const appId = app.applicantDetails?.applicationId || app.applicationId || (app.userId && app.userId.applicationId) || `MAA00${idx + 1}`;
                              const st = app.status;
                              const avatarColors = ["#3B82F6", "#10B981", "#8B5CF6"];
                              const avatarBg = avatarColors[idx % 3];
                              const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

                              return (
                                <tr key={app.id || app._id || idx}>
                                  <td style={{ fontWeight: 700, color: "#64748B" }}>{idx + 1}</td>
                                  <td>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                      <div style={{ width: 34, height: 34, borderRadius: 8, background: avatarBg, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12.5 }}>
                                        {initials}
                                      </div>
                                      <div>
                                        <div style={{ fontWeight: 700, color: "#0F172A", fontSize: 13.5 }}>{name}</div>
                                        <div style={{ fontSize: 11, color: "#64748B" }}>{appId} • {email}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td style={{ color: "#334155", fontSize: 13 }}>{college}</td>
                                  <td style={{ color: "#475569", fontSize: 13 }}>
                                    <span style={{ fontWeight: 600 }}>{dept}</span> • {year}
                                  </td>
                                  <td>
                                    {st === "Approved" ? (
                                      <span className="status-badge-active">
                                        Approved
                                      </span>
                                    ) : st === "Completed" ? (
                                      <span style={{ background: "#EFF6FF", color: "#1D4ED8", padding: "4px 10px", borderRadius: 14, fontSize: 11.5, fontWeight: 700, border: "1px solid #BFDBFE", display: "inline-flex", alignItems: "center", gap: 4 }}>
                                        <Award size={12} /> +{managingEvent.points || 50} pts
                                      </span>
                                    ) : (
                                      <span style={{ background: "#FEF9C3", color: "#854D0E", padding: "4px 12px", borderRadius: 16, fontSize: 12, fontWeight: 700, border: "1px solid #FDE047", display: "inline-flex", alignItems: "center", gap: 5 }}>
                                        <Clock size={12} color="#854D0E" /> Pending
                                      </span>
                                    )}
                                  </td>
                                  <td style={{ textAlign: "right" }}>
                                    <div style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                                      {st === "Pending" ? (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => handleApproveEventVolunteer(app)}
                                            style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 14px", background: "#10B981", color: "#FFF", border: "none", borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: "pointer", transition: "all 0.15s ease", boxShadow: "0 2px 6px rgba(16,185,129,0.3)" }}
                                          >
                                            <Check size={13} /> Approve
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleRejectEventVolunteer(app)}
                                            style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 14px", background: "#EF4444", color: "#FFF", border: "none", borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: "pointer", transition: "all 0.15s ease", boxShadow: "0 2px 6px rgba(239,68,68,0.3)" }}
                                          >
                                            <X size={13} /> Reject
                                          </button>
                                        </>
                                      ) : st === "Approved" ? (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => handleRevokeApproval(app)}
                                            style={{
                                              display: "inline-flex",
                                              alignItems: "center",
                                              gap: 5,
                                              padding: "6px 14px",
                                              background: "#F1F5F9",
                                              color: "#475569",
                                              border: "1px solid #CBD5E1",
                                              borderRadius: 8,
                                              fontSize: 12,
                                              fontWeight: 700,
                                              cursor: "pointer",
                                              transition: "all 0.15s ease",
                                            }}
                                            title="Reconsider and reset back to Pending"
                                          >
                                            <RotateCcw size={12} /> Reconsider
                                          </button>
                                        </>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleApproveEventVolunteer(app)}
                                          style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 11px", background: "#F1F5F9", color: "#475569", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                                          title="Reconsider Application"
                                        >
                                          <RotateCcw size={12} /> Reconsider
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer with Close Button & Complete Event & Award Points Green Button */}
            <div
              style={{
                padding: "16px 28px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#FFFFFF",
                borderTop: "1.5px solid #E2E8F0",
                borderBottomLeftRadius: 24,
                borderBottomRightRadius: 24,
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 12.5, color: "#64748B", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Sparkles size={14} color="#10B981" />
                Approvals &amp; awarded points sync real-time with volunteer profile certificates.
              </span>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => setManagingEvent(null)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 700,
                    border: "1.5px solid #CBD5E1",
                    color: "#475569",
                    background: "#F8FAFC",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  Close Window
                </button>

                <button
                  type="button"
                  className="btn-complete-event"
                  onClick={() => {
                    const oppId = String(managingEvent.id || managingEvent._id || "");
                    const eventTitle = (managingEvent.title || "").trim().toLowerCase();
                    const rawApps = applications.filter((a) => {
                      const aOppId = String(a.opportunityId?._id || a.opportunityId?.id || a.opportunityId || "");
                      const aTitle = String(a.opportunityTitle || a.opportunity?.title || "").trim().toLowerCase();
                      return (oppId && aOppId === oppId) || (eventTitle && aTitle === eventTitle);
                    });
                    const matchingExtra = extraEventApps.filter((a) => {
                      const aOppId = String(a.opportunityId || "");
                      const aTitle = String(a.opportunityTitle || "").trim().toLowerCase();
                      return (oppId && aOppId === oppId) || (eventTitle && aTitle === eventTitle);
                    });
                    let resolved = [...rawApps, ...matchingExtra];
                    if (resolved.length === 0) resolved = [{ id: "app_default", status: "Approved" }];
                    const count = resolved.filter((a) => (eventLocalApps[a.id || a._id] || a.status) === "Approved").length || 1;
                    handleCompleteEventInside(managingEvent, count);
                  }}
                  disabled={awardingPoints}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 24px",
                    borderRadius: 10,
                    background: (managingEvent.eventStatus === "Completed" || managingEvent.status === "Completed")
                      ? "#10B981"
                      : "linear-gradient(135deg, #059669 0%, #10B981 100%)",
                    color: "#FFFFFF",
                    border: "none",
                    fontSize: 13.5,
                    fontWeight: 800,
                    cursor: awardingPoints ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <CheckCircle2 size={17} />
                  <span>
                    {awardingPoints
                      ? "Processing Awards..."
                      : (managingEvent.eventStatus === "Completed" || managingEvent.status === "Completed")
                      ? "Event Completed (Awards Sent)"
                      : "Complete Event & Award Points"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          AWARD EVENT POINTS MODAL
      ══════════════════════════════════════════════════════════════════ */}
      {awardModal && !awardResult && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-box" style={{ maxWidth: 480 }}>
            <div className="modal-header" style={{ background: "linear-gradient(135deg, #064E3B, #16A34A)", color: "#fff", padding: "20px 24px", borderRadius: "16px 16px 0 0" }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 600, marginBottom: 2 }}>MARK EVENT AS COMPLETED</div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Award Points to All Volunteers</h3>
                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>{awardModal.opp.title}</div>
              </div>
              <button className="modal-close-btn" onClick={() => setAwardModal(null)} style={{ color: "#fff", background: "rgba(0,0,0,0.2)" }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: "24px" }}>
              <div style={{ background: "#F0FDF4", border: "1.5px solid #86EFAC", borderRadius: 12, padding: 14, marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: "#166534", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircle2 size={15} /> Clicking "Complete & Award" will:
                </div>
                <ul style={{ margin: "8px 0 0 20px", fontSize: 12.5, color: "#15803D", lineHeight: 1.8 }}>
                  <li>Mark this event as <strong>Completed</strong></li>
                  <li>Award points to <strong>all approved volunteers</strong></li>
                  <li>Issue official <strong>Certificates</strong> &amp; <strong>LinkedIn sharing content</strong></li>
                  <li>Dispatch <strong>thank-you confirmation emails</strong></li>
                </ul>
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Points to Award per Volunteer *</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="number"
                    className="form-input"
                    min="1" max="500"
                    value={awardModal.points}
                    onChange={(e) => setAwardModal((p) => ({ ...p, points: Number(e.target.value) }))}
                    style={{ fontSize: 20, fontWeight: 800, color: "#16A34A", textAlign: "center", maxWidth: 120 }}
                  />
                  <span style={{ fontSize: 13, color: "#64748B" }}>pts (default: +{awardModal.opp.points || 50})</span>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Reason / Note (logged in ledger)</label>
                <input
                  type="text"
                  className="form-input"
                  value={awardModal.reason}
                  onChange={(e) => setAwardModal((p) => ({ ...p, reason: e.target.value }))}
                  placeholder={`Event completion bonus: ${awardModal.opp.title}`}
                />
              </div>

              <div className="modal-actions-row">
                <button type="button" className="admin-btn admin-btn-outline" onClick={() => setAwardModal(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  style={{ background: "#16A34A", border: "none" }}
                  onClick={handleAwardEventPoints}
                  disabled={awardingPoints || !awardModal.points}
                >
                  {awardingPoints ? (
                    <><RefreshCw size={15} className="spin" /> Awarding...</>
                  ) : (
                    <><CheckCircle2 size={15} /> Complete & Award {awardModal.points} Points</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Award Result Modal — Full Event Completion Summary */}
      {awardResult && (
        <div className="modal-overlay" style={{ zIndex: 1300 }}>
          <div className="modal-box" style={{ maxWidth: 580, borderRadius: 20, padding: 0, overflow: "hidden" }}>
            {/* Green Header */}
            <div style={{ background: "linear-gradient(135deg, #15803D 0%, #166534 100%)", padding: "28px 28px 20px", textAlign: "center", color: "#fff" }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
              <h3 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>Event Completed Successfully!</h3>
              <p style={{ margin: 0, fontSize: 13.5, opacity: 0.9 }}>"{awardResult?.eventTitle || "Event"}" — All actions dispatched</p>
            </div>

            <div style={{ padding: "20px 24px" }}>
              {/* Stats Row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>
                {[
                  { label: "Volunteers Awarded", value: awardResult?.data?.awarded ?? awardResult?.awarded ?? 1, color: "#16A34A", bg: "#F0FDF4" },
                  { label: "Points Each", value: `+${awardResult?.points || 50}`, color: "#D97706", bg: "#FFFBEB" },
                  { label: "Certificates", value: awardResult?.data?.certificatesCount ?? awardResult?.certificatesCount ?? 1, color: "#7C3AED", bg: "#F5F3FF" },
                  { label: "Emails Sent", value: awardResult?.data?.emailsCount ?? awardResult?.emailsCount ?? 1, color: "#2563EB", bg: "#EFF6FF" },
                ].map((s) => (
                  <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 10.5, color: "#64748B", fontWeight: 600, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Completed Actions */}
              <div style={{ background: "#F0FDF4", border: "1.5px solid #86EFAC", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#166534" }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>✅ Automation Actions Completed:</div>
                <div>✓ Points credited to each volunteer's profile</div>
                <div>✓ Official certificates generated & stored</div>
                <div>✓ Thank-you & hours confirmation emails dispatched</div>
                <div>✓ In-app notifications sent to all volunteers</div>
                <div>✓ Event marked as Completed in the database</div>
              </div>

              {/* LinkedIn Post */}
              {(awardResult?.linkedInPost || awardResult?.data?.linkedInPost) && (
                <div style={{ background: "#EFF6FF", border: "1.5px solid #BFDBFE", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "#1E40AF" }}>🔗 Ready-to-Share LinkedIn Post:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const text = awardResult?.linkedInPost || awardResult?.data?.linkedInPost || "";
                        navigator.clipboard?.writeText(text).then(() => showToast("LinkedIn post copied to clipboard! 📋")).catch(() => showToast("Select the text below and copy manually"));
                      }}
                      style={{ fontSize: 11, background: "#2563EB", color: "#fff", border: "none", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontWeight: 700 }}
                    >
                      Copy
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={awardResult?.linkedInPost || awardResult?.data?.linkedInPost || ""}
                    rows={4}
                    style={{ width: "100%", fontSize: 12.5, color: "#1E293B", lineHeight: 1.5, background: "#fff", border: "1px solid #BFDBFE", borderRadius: 8, padding: "8px 10px", resize: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                  />
                </div>
              )}

              {/* Close Button */}
              <button
                type="button"
                style={{ width: "100%", background: "#0F172A", color: "#fff", border: "none", borderRadius: 10, padding: "12px 0", fontWeight: 800, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                onClick={() => {
                  setAwardResult(null);
                  setAwardModal(null);
                  setManagingEvent(null);
                  fetchEvents?.();
                }}
              >
                <Check size={16} /> Close & Refresh Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MANUAL POINTS ADJUSTMENT MODAL (MATCHING IMAGE 4 EXACTLY)
      ══════════════════════════════════════════════════════════════════ */}
      {manualPointsModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-box" style={{ maxWidth: 480, borderRadius: 20, overflow: "hidden" }}>
            <div className="modal-header" style={{ padding: "20px 24px 14px", borderBottom: "1px solid #F1F5F9" }}>
              <div>
                <h3 className="modal-title" style={{ fontSize: 19, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                  Manual Points Adjustment
                </h3>
                <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>
                  Adjust points for <strong>{manualPointsModal.volunteer?.name}</strong> ({manualPointsModal.volunteer?.appId})
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setManualPointsModal(null);
                  setAdjustmentReason("");
                  setAdjustmentPoints(25);
                }}
                style={{ width: 32, height: 32, borderRadius: "50%", background: "#F1F5F9", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleManualPointsSubmit} style={{ padding: "20px 24px 24px" }}>
              {/* Adjustment Action Selector */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 8 }}>
                  Adjustment Action *
                </label>
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setAdjustmentAction("CREDIT")}
                    style={{
                      flex: 1,
                      padding: "11px 16px",
                      borderRadius: 12,
                      border: adjustmentAction === "CREDIT" ? "2px solid #16A34A" : "1.5px solid #CBD5E1",
                      background: adjustmentAction === "CREDIT" ? "#DCFCE7" : "#FFFFFF",
                      color: adjustmentAction === "CREDIT" ? "#15803D" : "#475569",
                      fontWeight: 700,
                      fontSize: 14,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <PlusCircle size={17} /> Increase Points
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustmentAction("DEBIT")}
                    style={{
                      flex: 1,
                      padding: "11px 16px",
                      borderRadius: 12,
                      border: adjustmentAction === "DEBIT" ? "2px solid #DC2626" : "1.5px solid #CBD5E1",
                      background: adjustmentAction === "DEBIT" ? "#FEE2E2" : "#FFFFFF",
                      color: adjustmentAction === "DEBIT" ? "#B91C1C" : "#475569",
                      fontWeight: 700,
                      fontSize: 14,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <MinusCircle size={17} /> Deduct Points
                  </button>
                </div>
              </div>

              {/* Points Amount Input */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Points to {adjustmentAction === "CREDIT" ? "Add" : "Deduct"} *
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={adjustmentPoints}
                  onChange={(e) => setAdjustmentPoints(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1.5px solid #CBD5E1",
                    fontSize: 16,
                    fontWeight: 700,
                    color: adjustmentAction === "CREDIT" ? "#16A34A" : "#DC2626",
                    outline: "none",
                  }}
                />
              </div>

              {/* Mandatory Reason */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Mandatory Reason for Adjustment *
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Special recognition for coordinating school outreach logistics..."
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1.5px solid #CBD5E1",
                    fontSize: 13.5,
                    color: "#0F172A",
                    outline: "none",
                    resize: "vertical",
                  }}
                />
                <span style={{ fontSize: 11.5, color: "#64748B", display: "block", marginTop: 4 }}>
                  This reason will be recorded permanently in the student's transaction ledger.
                </span>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => {
                    setManualPointsModal(null);
                    setAdjustmentReason("");
                    setAdjustmentPoints(25);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  style={{
                    background: adjustmentAction === "CREDIT" ? "#16A34A" : "#DC2626",
                    borderColor: adjustmentAction === "CREDIT" ? "#16A34A" : "#DC2626",
                  }}
                  disabled={adjustingManualPoints || !adjustmentReason.trim() || Number(adjustmentPoints) <= 0}
                >
                  {adjustingManualPoints
                    ? "Updating..."
                    : adjustmentAction === "CREDIT"
                    ? `+ Add ${adjustmentPoints} Points`
                    : `− Deduct ${adjustmentPoints} Points`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
