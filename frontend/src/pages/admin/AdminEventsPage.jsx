// frontend/src/pages/admin/AdminEventsPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
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
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { useApp } from "../../context/AppContext";
import { CATEGORIES } from "../../data/mockData";
import { adminAPI } from "../../api/adminAPI";
import { eventsAPI } from "../../api/eventsAPI";
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

export const getEventTheme = (opp) => {
  const title = (opp?.title || "").toLowerCase();
  const cat = (opp?.category || "").toLowerCase();
  const done = opp?.eventStatus === "Completed" || opp?.status === "Completed";
  if (done) return "violet";
  if (cat.includes("health") || title.includes("blood")) return "red";
  if (cat.includes("karp") || title.includes("python")) return "indigo";
  if (cat.includes("school") || title.includes("school")) return "amber";
  if (title.includes("tree") || title.includes("plant") || title.includes("green")) return "green";
  if (cat.includes("environ") || title.includes("beach")) return "teal";
  return "indigo";
};

// ── Standard agenda builder ─────────────────────────────────
const parseClock = (txt) => {
  const m = String(txt || "").trim().match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  if (!m) return null;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === "PM") h += 12;
  return h * 60 + Number(m[2] || 0);
};

const formatClock = (mins) => {
  const total = ((Math.round(mins / 5) * 5) % 1440 + 1440) % 1440;
  const h24 = Math.floor(total / 60);
  const mm = String(total % 60).padStart(2, "0");
  const suffix = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${String(h12).padStart(2, "0")}:${mm} ${suffix}`;
};

export const buildStandardAgenda = (timeText, title = "the drive") => {
  const parts = String(timeText || "").split(/\s*(?:-|–|—|to)\s*/i);
  let start = parseClock(parts[0]);
  let end = parseClock(parts[1]);
  if (start === null) start = 9 * 60;
  if (end === null || end <= start) end = start + 4 * 60;
  const span = end - start;
  const steps = [
    { at: start - 15, title: "Reporting & Registration", description: "Meet the Maatram team leader and mark attendance with the event QR code." },
    { at: start, title: "Welcome & Orientation", description: "Introduction to the drive, team grouping and safety briefing." },
    { at: start + span * 0.12, title: "Briefing & Task Allocation", description: "Roles, materials and responsibilities are shared with every team." },
    { at: start + span * 0.25, title: "Main Activity", description: `Volunteers carry out the planned activity for ${title}.` },
    { at: start + span * 0.6, title: "Refreshment Break", description: "Rest, hydrate and share experiences with fellow volunteers." },
    { at: end - 15, title: "Group Photo & Feedback", description: "Team photo and quick feedback with the coordinator." },
    { at: end, title: "Closing & Wrap-up", description: "Vote of thanks. Volunteer hours are credited to your profile." },
  ];
  return steps.map((st) => ({ time: formatClock(st.at), title: st.title, description: st.description }));
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
  coordinatorName: "",
  coordinatorPhone: "",
  contactEmail: "coordinator@maatramfoundation.org",
  whatsappLink: "",
  highlightNote: "Together, we can make a difference!",
  venueName: "Official Venue",
  mapLink: "",
  whatToBring: "",
  agenda: [{ time: "", title: "", description: "" }],
  assignedAlumni: "Sundar R (Senior SDE @ Zoho)",
  targetAudience: "Both",
  zone: "All Zones",
};

export default function AdminEventsPage() {
  const navigate = useNavigate();

  const handleOpenManageEvent = (ev) => {
    const id = ev?.id || ev?._id;
    if (id) {
      navigate(`/admin/events/${id}/manage`);
    }
  };
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
    markEventCompletedInContext,
    refreshAllData,
  } = useApp();

  const [usersList, setUsersList] = useState([]);

  const totalStudentsCount = useMemo(() => usersList.filter(u => u.role === "student").length, [usersList]);
  const activeVolunteersCount = useMemo(() => usersList.filter(u => u.role === "student" && u.status === "active").length, [usersList]);
  const registeredAlumniCount = useMemo(() => usersList.filter(u => u.role === "alumni" || u.role === "Alumni").length, [usersList]);
  const alumniUsers = useMemo(() => usersList.filter(u => u.role === "alumni" || u.role === "Alumni"), [usersList]);
  const [showAdminCalendar, setShowAdminCalendar] = useState(false);
  const [modalTab, setModalTab] = useState("participated");
  const [modalPage, setModalPage] = useState("overview"); // "overview" (Page 1) or "rubric" (Page 2)
  const [selectedStudentForRubric, setSelectedStudentForRubric] = useState(null);
  const [rubricScores, setRubricScores] = useState({});

  const RUBRIC_CATEGORIES = useMemo(() => [
    { id: "attendance", label: "Attendance", max: 2 },
    { id: "punctuality", label: "Punctuality", max: 2 },
    { id: "taskCompletion", label: "Task Completion", max: 2 },
    { id: "responsibility", label: "Responsibility", max: 2 },
    { id: "teamwork", label: "Teamwork", max: 2 },
  ], []);

  useEffect(() => {
    adminAPI
      .getUsers()
      .then((res) => {
        if (res?.data) setUsersList(res.data);
      })
      .catch(() => { });
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
  const [eventLocalAttendance, setEventLocalAttendance] = useState({});
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
  const [sectionsOpen, setSectionsOpen] = useState({ necessary: true, additional: true });
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
      assignedAlumni: opp.assignedAlumni || "Sundar R (Senior SDE @ Zoho)",
      targetAudience: opp.targetAudience || "Both",
      zone: opp.zone || (Array.isArray(opp.targetZones) && opp.targetZones.length === 1 ? opp.targetZones[0] : "All Zones"),
      coordinatorName: opp.coordinatorName || "",
      coordinatorPhone: opp.coordinatorPhone || "",
      whatsappLink: opp.whatsappLink || "",
      highlightNote: opp.highlightNote || "",
      venueName: opp.venueName || "",
      mapLink: opp.mapLink || "",
      whatToBring: Array.isArray(opp.whatToBring) ? opp.whatToBring.join("\n") : opp.whatToBring || "",
      agenda: Array.isArray(opp.agenda) && opp.agenda.length > 0
        ? opp.agenda.map((r) => ({ time: r.time || "", title: r.title || "", description: r.description || "" }))
        : [{ time: "", title: "", description: "" }],
      eligibility: opp.eligibility || "Open to all registered student volunteers.",
      contactEmail: opp.contactEmail || "coordinator@maatramfoundation.org",
      featured: Boolean(opp.featured),
    });
    setFormErrors({});
    setShowEventModal(true);
  };

  // Agenda row helpers (Event Agenda — Start to End)
  const updateAgendaRow = (idx, key, value) =>
    setFormData((prev) => ({
      ...prev,
      agenda: prev.agenda.map((row, i) => (i === idx ? { ...row, [key]: value } : row)),
    }));
  const addAgendaRow = () =>
    setFormData((prev) => ({ ...prev, agenda: [...(prev.agenda || []), { time: "", title: "", description: "" }] }));
  const autoFillAgenda = () => {
    const hasContent = (formData.agenda || []).some((r) => (r.title || "").trim());
    if (hasContent && !window.confirm("Replace the current agenda with the standard 7-step plan?")) return;
    setFormData((prev) => ({ ...prev, agenda: buildStandardAgenda(prev.time, prev.title.trim() || "the drive") }));
    showToast("Standard agenda created from the event time. You can edit every step.", "success");
  };
  const removeAgendaRow = (idx) =>
    setFormData((prev) => ({ ...prev, agenda: prev.agenda.filter((_, i) => i !== idx) }));

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
      let targetZones = ["Zone 1", "Zone 2", "Zone 3", "Zone 4"];
      if (formData.zone && formData.zone !== "All Zones") {
        targetZones = [formData.zone];
      }

      const payload = {
        ...formData,
        zone: formData.zone || "All Zones",
        targetZones,
        targetAudience: formData.targetAudience || "Both",
        image: getEventImage(formData),
        volunteersNeeded: Number(formData.volunteersNeeded) || 10,
        slotsAvailable: Number(formData.slotsAvailable) || Number(formData.volunteersNeeded) || 10,
        durationHours: Number(formData.durationHours) || 4,
        points: Number(formData.points) || 50,
        whatToBring: String(formData.whatToBring || "")
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean),
        agenda: (Array.isArray(formData.agenda) ? formData.agenda : [])
          .map((r) => ({ time: (r.time || "").trim(), title: (r.title || "").trim(), description: (r.description || "").trim() }))
          .filter((r) => r.title),
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
      // Trigger Volunteer Selection Confirmation Email (Module 1 - Email 1)
      try {
        const evId = managingEvent?.id || managingEvent?._id;
        if (evId) {
          const emailRes = await eventsAPI.confirmSelection(evId, { applicationId: app.id || app._id });
          if (emailRes && emailRes.sentCount > 0) {
            showToast(`✅ ${app.applicantDetails?.name || "Volunteer"} approved & selection email dispatched!`);
            return;
          }
        }
      } catch (e) {
        console.warn("Selection email trigger notice:", e.message);
      }
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

  const handleToggleAttendance = async (app, status) => {
    try {
      const targetId = app.id || app._id;
      const uId = app.userId?._id || app.userId?.id || app.userId || app.id;
      await adminAPI.markVolunteerAttendance(
        managingEvent.id || managingEvent._id,
        uId,
        targetId,
        status
      );
      setEventLocalAttendance((prev) => ({
        ...prev,
        [targetId]: status,
      }));
      showToast(`Attendance marked as ${status} for ${app.applicantDetails?.name || app.name || "volunteer"}!`);
    } catch (err) {
      showToast(err.message || "Failed to update attendance", "error");
    }
  };

  const handleVerifyAllAttendance = async (currentList = []) => {
    try {
      await adminAPI.verifyAllApprovedAttendance(managingEvent.id || managingEvent._id);
      setEventLocalAttendance((prev) => {
        const next = { ...prev };
        (currentList || []).forEach((a) => {
          const st = eventLocalApps[a.id || a._id] || a.status;
          if (st === "Approved" || st === "Completed") {
            next[a.id || a._id] = "Present";
          }
        });
        return next;
      });
      showToast("✅ Attendance verified for all approved volunteers!");
    } catch (err) {
      showToast(err.message || "Failed to verify attendance", "error");
    }
  };

  const handleCompleteEventInside = async (event, approvedCount) => {
    setAwardingPoints(true);
    try {
      const evId = event.id || event._id;
      // Close attendance, verify hours, award 10 pts/hr, and send Thank You completion emails
      const res = await eventsAPI.closeAttendance(evId, {
        defaultHours: event.durationHours || 4,
      });

      const awardedPts = (event.durationHours || 4) * 10;
      setAwardResult({
        ...res,
        eventTitle: event.title,
        points: awardedPts,
        linkedInPost: `I am proud to share that I have successfully completed the volunteering initiative for "${event.title}" with Maatram Foundation! Dedicated ${event.durationHours || 4} hours to creating meaningful community impact. Grateful to be part of the change! #MaatramFoundation #Volunteering #SocialImpact #StudentLeadership`,
      });
      setEventLocalApps((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          if (next[k] === "Approved" || !next[k]) next[k] = "Completed";
        });
        return next;
      });
      setEventLocalAttendance((prev) => {
        const next = { ...prev };
        Object.keys(eventLocalApps).forEach((k) => {
          next[k] = "Present";
        });
        return next;
      });
      setManagingEvent((prev) => (prev ? { ...prev, eventStatus: "Completed", status: "Completed", pointsDistributed: true } : prev));
      if (typeof markEventCompletedInContext === "function") {
        markEventCompletedInContext(
          evId,
          event.title,
          awardedPts,
          {
            certificateId: res.data?.certificateId || res.certificateId,
            eventTitle: event.title,
            verifiedHours: event.durationHours || 4,
            pointsAwarded: awardedPts,
          }
        );
      }
      if (updateOpportunity && evId) {
        await updateOpportunity(evId, { eventStatus: "Completed", status: "Completed", pointsDistributed: true }).catch(() => { });
      }
      if (typeof refreshAllData === "function") {
        refreshAllData().catch(() => { });
      }
      showToast(res.message || "Event completed successfully! Verified hours, points (+10/hr), and thank-you emails dispatched to volunteers.");
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
      if (typeof markEventCompletedInContext === "function") {
        markEventCompletedInContext(
          awardModal.opp.id || awardModal.opp._id,
          awardModal.opp.title,
          awardModal.points || 50,
          {
            certificateId: res.data?.certificateId || res.certificateId,
            eventTitle: awardModal.opp.title,
            verifiedHours: awardModal.opp.durationHours || 4,
            pointsAwarded: awardModal.points || 50,
          }
        );
      }
      if (updateOpportunity && (awardModal.opp.id || awardModal.opp._id)) {
        await updateOpportunity(awardModal.opp.id || awardModal.opp._id, { eventStatus: "Completed", status: "Completed", pointsDistributed: true }).catch(() => { });
      }
      if (typeof refreshAllData === "function") {
        refreshAllData().catch(() => { });
      }
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

  const [retryingEmailId, setRetryingEmailId] = useState(null);

  const handleRetryEmail = async (logId) => {
    try {
      setRetryingEmailId(logId);
      const res = await adminAPI.retryEmail(logId);
      showToast(res.message || "Email retry dispatched successfully!");
      fetchEmailLogs?.();
    } catch (err) {
      showToast(err.message || "Failed to retry email", "error");
    } finally {
      setRetryingEmailId(null);
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
                  onSelectEvent={(ev) => handleOpenManageEvent(ev)}
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
                    <div className={`adm-event-card-media theme-${getEventTheme(opp)}`}>
                      <div className="adm-media-floating-actions">
                        <button
                          type="button"
                          className="adm-media-icon-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            openQRAttendance(opp);
                          }}
                          title="QR Attendance Roster"
                          aria-label="Open QR attendance roster"
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
                          aria-label="Send email reminder"
                        >
                          <Mail size={13} />
                        </button>
                      </div>
                      <span className={`adm-event-status-badge ${statusClass}`}>
                        {statusText}
                      </span>
                      <span className="adm-media-cat">{opp.category || "Event"}</span>
                      <span className="adm-media-pts"><Star size={12} /> +{opp.points || 0} pts</span>
                    </div>

                    {/* Card Body */}
                    <div className="adm-event-card-body">
                      <h3 className="adm-event-title" onClick={() => handleOpenManageEvent(opp)} title={opp.title} style={{ cursor: "pointer" }}>
                        {opp.title}
                      </h3>
                      <div className="adm-event-tags">
                        <span className={`adm-mode-tag ${String(opp.mode || "Offline").toLowerCase()}`}>{opp.mode || "Offline"}</span>
                        <span className="adm-date-tag"><Calendar size={11} /> {opp.date || "Upcoming"}</span>
                      </div>
                      <p className="adm-event-desc">
                        {opp.description || "Join this community volunteering initiative to coordinate on-ground student leadership drives."}
                      </p>

                      <div className="adm-event-meta-list">
                        <div className="adm-event-meta-item">
                          <span className="adm-meta-ico amber"><Clock size={12} /></span>
                          <span>{opp.time || `${opp.durationHours || 4} hrs`}</span>
                        </div>
                        <div className="adm-event-meta-item">
                          <span className="adm-meta-ico red"><MapPin size={12} /></span>
                          <span className="adm-meta-loc">{opp.location || "Tamil Nadu"}</span>
                        </div>
                      </div>

                      {(() => {
                        const needed = Number(opp.volunteersNeeded) || 12;
                        const eventApps = applications.filter(
                          (a) =>
                            String(a.opportunityId?._id || a.opportunityId?.id || a.opportunityId || "") === String(oppId) ||
                            String(a.opportunityTitle || "").trim().toLowerCase() === String(opp.title || "").trim().toLowerCase()
                        );
                        const selected = eventApps.filter((a) => a.status === "Approved" || a.status === "Completed").length;
                        const filledSlots = Math.max(0, needed - (Number(opp.slotsAvailable) || 0));
                        const filledCount = Math.max(filledSlots, selected);
                        const pct = Math.min(100, Math.round((filledCount / needed) * 100));
                        return (
                          <>
                            <div className="adm-slots">
                              <div className="adm-slots-top">
                                <span>Volunteer slots filled</span>
                                <strong>{filledCount}/{needed} · {pct}%</strong>
                              </div>
                              <div className="adm-slots-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                                <div style={{ width: `${pct}%` }} />
                              </div>
                            </div>

                            <div className="adm-event-counts-row">
                              <div>
                                <Users size={13} color="#64748B" />
                                <span><strong>{eventApps.length}</strong> Interested</span>
                              </div>
                              <div>
                                <CheckCircle2 size={13} color="#16A34A" />
                                <span><strong>{selected}</strong> Selected</span>
                              </div>
                            </div>
                          </>
                        );
                      })()}

                      {/* Actions Row */}
                      <div className="adm-event-actions-row">
                        <button
                          type="button"
                          className={`adm-card-btn-manage ${isCompleted ? "completed" : ""}`}
                          onClick={() => handleOpenManageEvent(opp)}
                          title="Manage registered volunteers and complete event"
                        >
                          <Eye size={14} /> {isCompleted ? "View Summary" : "Manage"}
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
                          className={`status-pill ${app.status === "Approved"
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
                            className={`status-pill ${status === "Verified"
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
                <option value="registration_confirmation">Trigger: User Registration (Account Created)</option>
                <option value="account_approved">Trigger: User Account Approved & Activated</option>
                <option value="event_registration_received">Trigger: Event Registration Received</option>
                <option value="application_approval">Trigger: Volunteer Selection / Event Approved</option>
                <option value="application_rejection">Trigger: Application Rejection</option>
                <option value="event_reminder">Trigger: Event Reminder</option>
                <option value="hours_verification">Trigger: Hours Verification</option>
                <option value="thank_you">Trigger: Volunteer Completion Thank You</option>
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
                        {log.status === "failed" ? (
                          <span
                            className="status-pill rejected"
                            style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}
                            title={log.errorDetails || "Delivery failed"}
                          >
                            <AlertCircle size={12} /> Failed
                          </span>
                        ) : log.status === "sending" || log.status === "pending" ? (
                          <span className="status-pill pending">
                            <Clock3 size={12} /> {log.status}
                          </span>
                        ) : (
                          <span className="status-pill approved">
                            <CheckCircle2 size={12} /> {log.status || "Delivered"}
                          </span>
                        )}
                        {log.errorDetails && log.status === "failed" && (
                          <div
                            style={{
                              fontSize: 11,
                              color: "#DC2626",
                              marginTop: 3,
                              maxWidth: 220,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={log.errorDetails}
                          >
                            {log.errorDetails}
                          </div>
                        )}
                      </td>

                      <td>
                        <span style={{ fontSize: 12, color: "#64748B" }}>
                          {new Date(log.sentAt || log.createdAt).toLocaleString()}
                        </span>
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: 6, alignItems: "center", justifyContent: "flex-end" }}>
                          {log.status === "failed" && (
                            <button
                              className="dash-btn dash-btn-outline"
                              onClick={() => handleRetryEmail(log._id || log.id)}
                              disabled={retryingEmailId === (log._id || log.id)}
                              style={{
                                fontSize: 11.5,
                                padding: "4px 8px",
                                borderColor: "#DC2626",
                                color: "#DC2626",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                              title="Retry sending this failed email"
                            >
                              <RotateCcw size={12} className={retryingEmailId === (log._id || log.id) ? "spin-animate" : ""} />
                              {retryingEmailId === (log._id || log.id) ? "Retrying..." : "Retry"}
                            </button>
                          )}
                          <button
                            className="dash-btn dash-btn-outline"
                            onClick={() => setPreviewEmail(log)}
                            style={{ fontSize: 12, padding: "5px 10px" }}
                          >
                            <Eye size={13} /> Preview HTML
                          </button>
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
                <X size={18} />
              </button>
            </div>

            {previewEmail.status === "failed" && previewEmail.errorDetails && (
              <div
                style={{
                  margin: "14px 0",
                  padding: "10px 14px",
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: 8,
                  color: "#B91C1C",
                  fontSize: 12.5,
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start",
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong>Dispatch Failure Reason:</strong>
                  <p style={{ margin: "3px 0 0", color: "#7F1D1D" }}>{previewEmail.errorDetails}</p>
                </div>
              </div>
            )}

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
        <div className="adm-event-fullpage-overlay">
          {/* Top Fullpage Header */}
          <header className="adm-event-fullpage-header">
            <div className="adm-event-fullpage-header-left">
              <button
                type="button"
                className="adm-event-fullpage-back-btn"
                onClick={() => setShowEventModal(false)}
              >
                <ArrowLeft size={17} /> Back to Events
              </button>
              <div style={{ width: 1, height: 26, background: "#CBD5E1" }} />
              <div className="adm-event-fullpage-title-box">
                <CalendarPlus size={22} color="#D97706" />
                <h2>
                  {modalMode === "add"
                    ? "Post New Volunteering Opportunity"
                    : "Edit Volunteering Opportunity"}
                </h2>
              </div>
            </div>

            <div className="adm-event-fullpage-header-right">
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={() => setShowEventModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={handleFormSubmit}
                disabled={submitting}
              >
                {submitting
                  ? "Saving Drive..."
                  : modalMode === "add"
                  ? "Publish Drive"
                  : "Save Changes"}
              </button>
            </div>
          </header>

          {/* Fullpage Content Body with Natural Page Scroll */}
          <div className="adm-event-fullpage-content">
            <form onSubmit={handleFormSubmit} className="admin-event-form">
              {/* ══════════════════════════════════════════════════════════════
                  SECTION 1: NECESSARY DETAILS (EXPAND / COLLAPSE)
              ══════════════════════════════════════════════════════════════ */}
              <div className="form-accordion-section">
                <button
                  type="button"
                  className="form-accordion-header"
                  onClick={() => setSectionsOpen((prev) => ({ ...prev, necessary: !prev.necessary }))}
                >
                  <div className="form-accordion-title">
                    <span className="form-accordion-icon amber">📋</span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0F172A" }}>
                        Necessary Details
                      </h4>
                      <p style={{ margin: 0, fontSize: 12, color: "#64748B" }}>
                        Event Title, Category, Mode, Timing, Location, Capacity, Points, Cover &amp; Targeting
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 12, background: "#FEF3C7", color: "#92400E" }}>
                      Required *
                    </span>
                    {sectionsOpen.necessary ? <ChevronUp size={20} color="#64748B" /> : <ChevronDown size={20} color="#64748B" />}
                  </div>
                </button>

                {sectionsOpen.necessary && (
                  <div className="form-accordion-body">
                    {/* Event Title */}
                    <div className="form-group-full">
                      <label>Event Title *</label>
                      <input
                        type="text"
                        placeholder="e.g. Government Higher Secondary School Career Mentoring"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className={formErrors.title ? "has-error" : ""}
                      />
                      {formErrors.title && <span className="error-text">{formErrors.title}</span>}
                    </div>

                    {/* TARGET ROLE & ZONE TYPE */}
                    <div className="form-row-2">
                      <div>
                        <label>Target Audience (Students, Alumni or Both) *</label>
                        <select
                          value={formData.targetAudience || "Both"}
                          onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                          style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1.5px solid #2563EB", fontWeight: 600 }}
                        >
                          <option value="Both">Both Students &amp; Alumni (Open for Everyone)</option>
                          <option value="Students">Students Only (Send to Students Alone): Event is visible/accessible to student volunteers only.</option>
                          <option value="Alumni">Alumni Only (Send to Alumni Alone)</option>
                        </select>
                        <small style={{ color: "#2563EB", fontSize: 11.5, marginTop: 4, display: "block" }}>
                          {formData.targetAudience === "Students"
                            ? "🔒 Only student volunteers will see and apply for this event."
                            : formData.targetAudience === "Alumni"
                            ? "🎓 Only verified alumni will see and apply for this event."
                            : "🌐 Open to all registered students and alumni."}
                        </small>
                      </div>

                      <div>
                        <label>Zone Type *</label>
                        <select
                          value={formData.zone || "All Zones"}
                          onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                          style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1.5px solid #059669", fontWeight: 600 }}
                        >
                          <option value="All Zones">All Zones (Shows to students across all zones)</option>
                          <option value="Zone 1">Zone 1 (Shows event to Zone 1 students alone)</option>
                          <option value="Zone 2">Zone 2 (Shows event to Zone 2 students alone)</option>
                          <option value="Zone 3">Zone 3 (Shows event to Zone 3 students alone)</option>
                          <option value="Zone 4">Zone 4 (Shows event to Zone 4 students alone)</option>
                        </select>
                        <small style={{ color: "#059669", fontSize: 11.5, marginTop: 4, display: "block" }}>
                          {formData.zone === "All Zones"
                            ? "🌍 Universal: All students can view this event regardless of zone."
                            : `📍 Restricted: Only ${formData.zone} students will see this event.`}
                        </small>
                      </div>
                    </div>

                    {/* Category, Mode, Duration */}
                    <div className="form-row-3">
                      <div>
                        <label>Category *</label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
                          onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
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
                          onChange={(e) => setFormData({ ...formData, durationHours: e.target.value })}
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
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className={formErrors.date ? "has-error" : ""}
                        />
                        {formErrors.date && <span className="error-text">{formErrors.date}</span>}
                      </div>

                      <div>
                        <label>Timing Schedule</label>
                        <input
                          type="text"
                          placeholder="e.g. 9:30 AM – 1:30 PM (4 hrs)"
                          value={formData.time}
                          onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        />
                      </div>

                      <div>
                        <label>Application Deadline *</label>
                        <input
                          type="text"
                          placeholder="e.g. 12 May 2026"
                          value={formData.deadline}
                          onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                          className={formErrors.deadline ? "has-error" : ""}
                        />
                        {formErrors.deadline && <span className="error-text">{formErrors.deadline}</span>}
                      </div>
                    </div>

                    {/* Venue / Location / Meeting Link */}
                    <div className="form-group-full">
                      <label>Venue / Location / Meeting Link *</label>
                      <input
                        type="text"
                        placeholder="e.g. Government Higher Secondary School, Saidapet, Chennai"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className={formErrors.location ? "has-error" : ""}
                      />
                      {formErrors.location && <span className="error-text">{formErrors.location}</span>}
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
                              ...(modalMode === "add" ? { slotsAvailable: e.target.value } : {}),
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
                        onChange={(e) => setFormData({ ...formData, points: e.target.value })}
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
                      <label>Assigned Alumni Mentor &amp; Event Lead</label>
                      <select
                        value={formData.assignedAlumni || "Sundar R (Senior SDE @ Zoho)"}
                        onChange={(e) => setFormData({ ...formData, assignedAlumni: e.target.value })}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13.5 }}
                      >
                        <option value="Sundar R (Senior SDE @ Zoho)">Sundar R (Senior SDE @ Zoho - CEG Alum)</option>
                        <option value="Charles (ALU000 - Student coordinator @ SISCO)">Charles (ALU000 - Student coordinator @ SISCO)</option>
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
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className={formErrors.description ? "has-error" : ""}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ══════════════════════════════════════════════════════════════
                  SECTION 2: ADDITIONAL DETAILS (EXPAND / COLLAPSE)
              ══════════════════════════════════════════════════════════════ */}
              <div className="form-accordion-section">
                <button
                  type="button"
                  className="form-accordion-header"
                  onClick={() => setSectionsOpen((prev) => ({ ...prev, additional: !prev.additional }))}
                >
                  <div className="form-accordion-title">
                    <span className="form-accordion-icon purple">✨</span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0F172A" }}>
                        Additional Details
                      </h4>
                      <p style={{ margin: 0, fontSize: 12, color: "#64748B" }}>
                        Highlight Note, Team Updates, Agenda &amp; Venue Guidelines
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 12, background: "#F1F5F9", color: "#475569" }}>
                      Optional
                    </span>
                    {sectionsOpen.additional ? <ChevronUp size={20} color="#64748B" /> : <ChevronDown size={20} color="#64748B" />}
                  </div>
                </button>

                {sectionsOpen.additional && (
                  <div className="form-accordion-body">
                    {/* About highlight line */}
                    <div className="form-group-full">
                      <label>Highlight Message (green note under the description)</label>
                      <input
                        type="text"
                        placeholder="Together, we can make a difference!"
                        value={formData.highlightNote}
                        onChange={(e) => setFormData({ ...formData, highlightNote: e.target.value })}
                      />
                    </div>

                    {/* Event Team */}
                    <div className="form-section-title">Event Team &amp; Updates</div>
                    <div className="form-row-3">
                      <div>
                        <label>Coordinator Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Dr. Priya Sharma"
                          value={formData.coordinatorName}
                          onChange={(e) => setFormData({ ...formData, coordinatorName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label>Coordinator Phone</label>
                        <input
                          type="tel"
                          placeholder="e.g. +91 98765 43210"
                          value={formData.coordinatorPhone}
                          onChange={(e) => setFormData({ ...formData, coordinatorPhone: e.target.value })}
                        />
                      </div>
                      <div>
                        <label>Coordinator Email</label>
                        <input
                          type="email"
                          placeholder="coordinator@maatramfoundation.org"
                          value={formData.contactEmail}
                          onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="form-group-full">
                      <label>WhatsApp Group Link</label>
                      <input
                        type="url"
                        placeholder="https://chat.whatsapp.com/..."
                        value={formData.whatsappLink}
                        onChange={(e) => setFormData({ ...formData, whatsappLink: e.target.value })}
                      />
                    </div>

                    {/* Event Agenda */}
                    <div className="form-section-title">Event Agenda — Start to End</div>
                    <div className="agenda-editor">
                      {(formData.agenda || []).map((row, idx) => (
                        <div className="agenda-row" key={idx}>
                          <input
                            type="text"
                            aria-label={`Agenda time ${idx + 1}`}
                            placeholder="09:00 AM"
                            value={row.time}
                            onChange={(e) => updateAgendaRow(idx, "time", e.target.value)}
                          />
                          <input
                            type="text"
                            aria-label={`Agenda title ${idx + 1}`}
                            placeholder="Activity title"
                            value={row.title}
                            onChange={(e) => updateAgendaRow(idx, "title", e.target.value)}
                          />
                          <input
                            type="text"
                            aria-label={`Agenda description ${idx + 1}`}
                            placeholder="Short description"
                            value={row.description}
                            onChange={(e) => updateAgendaRow(idx, "description", e.target.value)}
                          />
                          <button
                            type="button"
                            className="agenda-remove-btn"
                            onClick={() => removeAgendaRow(idx)}
                            aria-label={`Remove agenda step ${idx + 1}`}
                            title="Remove this step"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      <div className="agenda-btn-row">
                        <button type="button" className="agenda-add-btn" onClick={addAgendaRow}>
                          <PlusCircle size={15} /> Add agenda item
                        </button>
                        <button type="button" className="agenda-auto-btn" onClick={autoFillAgenda} title="Builds a 7-step plan from the Timing Schedule above">
                          <Sparkles size={15} /> Auto-fill standard agenda
                        </button>
                      </div>
                    </div>

                    {/* Live Location & What to Bring */}
                    <div className="form-section-title">Live Location &amp; What to Bring</div>
                    <div className="form-row-2">
                      <div>
                        <label>Official Venue Name</label>
                        <input
                          type="text"
                          placeholder="Official Venue"
                          value={formData.venueName}
                          onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label>Google Maps Link</label>
                        <input
                          type="url"
                          placeholder="https://maps.google.com/..."
                          value={formData.mapLink}
                          onChange={(e) => setFormData({ ...formData, mapLink: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="form-group-full">
                      <label>What Volunteers Should Bring (1 per line)</label>
                      <textarea
                        rows="4"
                        placeholder={"College ID card & volunteer ID tag\nSmartphone for QR attendance scan\nComfortable outdoor attire\nDrinking water bottle"}
                        value={formData.whatToBring}
                        onChange={(e) => setFormData({ ...formData, whatToBring: e.target.value })}
                      />
                    </div>
                  </div>
                )}
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
              </div></form>
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