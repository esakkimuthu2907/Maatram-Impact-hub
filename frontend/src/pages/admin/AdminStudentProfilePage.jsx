// frontend/src/pages/admin/AdminStudentProfilePage.jsx
// Student full profile for administrators — with admin-edit panel for achievements, certificates, points, rating.

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  GraduationCap,
  Landmark,
  MapPin,
  Mail,
  CalendarDays,
  Clock,
  Trophy,
  Star,
  Medal,
  Eye,
  Pause,
  Play,
  Trash2,
  Droplet,
  Leaf,
  Laptop,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Edit3,
  Plus,
  X,
  CheckCircle2,
  Award,
  Save,
} from "lucide-react";
import { adminAPI } from "../../api/adminAPI";
import { applicationsAPI } from "../../api/applicationsAPI";
import { useApp } from "../../context/AppContext";
import "./AdminStudentProfilePage.css";

/* Point thresholds for the volunteer level card */
const LEVELS = [
  { level: 1, name: "Rookie", min: 0 },
  { level: 2, name: "Contributor", min: 100 },
  { level: 3, name: "Achiever", min: 300 },
  { level: 4, name: "Leader", min: 600 },
  { level: 5, name: "Champion", min: 1000 },
  { level: 6, name: "Legend", min: 1500 },
  { level: 7, name: "Icon", min: 2200 },
  { level: 8, name: "Hall of Fame", min: 3000 },
];

function getLevelInfo(points) {
  let idx = 0;
  LEVELS.forEach((l, i) => { if (points >= l.min) idx = i; });
  const current = LEVELS[idx];
  const next = LEVELS[idx + 1];
  if (!next) return { current, next: null, percent: 100, remaining: 0 };
  const span = next.min - current.min;
  const percent = Math.min(100, Math.round(((points - current.min) / span) * 100));
  return { current, next, percent, remaining: next.min - points };
}

function categoryIcon(category = "") {
  const c = category.toLowerCase();
  if (c.includes("health") || c.includes("blood")) return { Icon: Droplet, tone: "red" };
  if (c.includes("environ") || c.includes("outside")) return { Icon: Leaf, tone: "green" };
  if (c.includes("karp") || c.includes("tech") || c.includes("educat")) return { Icon: Laptop, tone: "blue" };
  return { Icon: BookOpen, tone: "blue" };
}

function categoryTone(category = "") {
  const c = category.toLowerCase();
  if (c.includes("health")) return "red";
  if (c.includes("environ") || c.includes("outside")) return "green";
  return "blue";
}

const fmtDate = (value, opts) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", opts || { day: "2-digit", month: "2-digit", year: "numeric" });
};

const initialsOf = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase();

// ── Inline star rating component ───────────────────────────────────────────
function StarRatingInput({ value, onChange }) {
  const [hovered, setHovered] = useState(null);
  const display = hovered !== null ? hovered : value;
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => onChange(star)}
          style={{
            background: "none", border: "none", cursor: "pointer", padding: 2,
            color: star <= display ? "#EAB308" : "#CBD5E1", fontSize: 22,
          }}
          title={`${star} star`}
        >
          ★
        </button>
      ))}
      <span style={{ fontSize: 13, color: "#64748B", marginLeft: 4 }}>{value} / 5</span>
      {value > 0 && (
        <button
          type="button"
          onClick={() => onChange(0)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 11, marginLeft: 4 }}
          title="Reset to 0"
        >
          Reset
        </button>
      )}
    </div>
  );
}

export default function AdminStudentProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast, openCertificate, applications: ctxApplications = [], opportunities: ctxOpportunities = [] } = useApp();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusModal, setStatusModal] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [busy, setBusy] = useState(false);

  // Admin edit states
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);

  // Points manual adjust
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [pointsForm, setPointsForm] = useState({ type: "CREDIT", points: 25, reason: "" });
  const [savingPoints, setSavingPoints] = useState(false);

  // Certificate issue
  const [showCertModal, setShowCertModal] = useState(false);
  const [certForm, setCertForm] = useState({ eventTitle: "", verifiedHours: 4, pointsAwarded: 50 });
  const [savingCert, setSavingCert] = useState(false);

  // Rating
  const [editRating, setEditRating] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [savingRating, setSavingRating] = useState(false);

  // New achievement
  const [newAchievement, setNewAchievement] = useState("");
  const [savingAchievements, setSavingAchievements] = useState(false);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      let res = null;
      try { res = await adminAPI.getUserById(id); } catch (_) {}

      if (res?.data) {
        const studentData = res.data;
        setStudent(studentData);
        setRatingValue(Number(studentData.rating) || 0);

        // If student has no applications in the profile response, try fetching all applications filtered by user
        if (!studentData.applications?.length) {
          try {
            const uid = studentData._id || studentData.id;
            const allAppsRes = await applicationsAPI.getAll({ userId: uid });
            const allApps = Array.isArray(allAppsRes?.data) ? allAppsRes.data : [];
            // Also match by email
            const em = String(studentData.email || "").toLowerCase();
            const appId = String(studentData.applicationId || studentData.regNumber || "").toLowerCase();
            const matched = allApps.filter((a) => {
              const aUid = String(a.userId || a.user || "").toLowerCase();
              const aEmail = String(a.applicantDetails?.email || a.email || "").toLowerCase();
              const aAppId = String(a.applicantDetails?.applicationId || a.applicationId || "").toLowerCase();
              return (uid && aUid === String(uid).toLowerCase()) ||
                     (em && aEmail === em) ||
                     (appId && aAppId === appId);
            });
            if (matched.length > 0) {
              setStudent((prev) => ({ ...prev, applications: matched }));
            }
          } catch (_) {}
        }
      } else {
        try {
          const all = await adminAPI.getUsers();
          const list = Array.isArray(all?.data) ? all.data : [];
          const key = String(id).toLowerCase();
          const found = list.find(
            (u) =>
              String(u._id || "").toLowerCase() === key ||
              String(u.id || "").toLowerCase() === key ||
              String(u.applicationId || "").toLowerCase() === key ||
              String(u.email || "").toLowerCase() === key
          );
          if (found) { setStudent(found); setRatingValue(Number(found.rating) || 0); return; }
        } catch (_) {}
        showToast("Student not found", "error");
      }
    } catch (err) {
      console.error("Failed to load student profile:", err);
      showToast("Error loading student profile", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) loadStudentData(); }, [id]);

  const handleToggleStatus = async (newStatus) => {
    try {
      setBusy(true);
      await adminAPI.toggleUserStatus(student._id || student.id, newStatus);
      setStudent((prev) => ({ ...prev, status: newStatus }));
      showToast(`Student account marked as ${newStatus}!`);
      setStatusModal(null);
    } catch (err) {
      showToast(err.message || "Failed to update account status", "error");
    } finally { setBusy(false); }
  };

  const handleDelete = async () => {
    try {
      setBusy(true);
      const res = await adminAPI.deleteUser(student._id || student.id);
      showToast(res?.message || `${student.fullName}'s account deleted.`);
      setDeleteOpen(false);
      navigate("/admin/users");
    } catch (err) {
      showToast(err.message || "Failed to delete account", "error");
    } finally { setBusy(false); }
  };

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      await adminAPI.updateStudentProfile(student._id || student.id, profileForm);
      setStudent((prev) => ({ ...prev, ...profileForm }));
      showToast("Profile updated successfully!");
      setEditingProfile(false);
    } catch (err) {
      showToast(err.message || "Failed to update profile", "error");
    } finally { setSavingProfile(false); }
  };

  const handleAddAchievement = async () => {
    if (!newAchievement.trim()) return;
    try {
      setSavingAchievements(true);
      const updated = [...(student.achievements || []), newAchievement.trim()];
      await adminAPI.updateStudentProfile(student._id || student.id, { achievements: updated });
      setStudent((prev) => ({ ...prev, achievements: updated }));
      setNewAchievement("");
      showToast("Achievement added!");
    } catch (err) {
      showToast(err.message || "Failed to add achievement", "error");
    } finally { setSavingAchievements(false); }
  };

  const handleRemoveAchievement = async (idx) => {
    try {
      const updated = (student.achievements || []).filter((_, i) => i !== idx);
      await adminAPI.updateStudentProfile(student._id || student.id, { achievements: updated });
      setStudent((prev) => ({ ...prev, achievements: updated }));
      showToast("Achievement removed.");
    } catch (err) {
      showToast(err.message || "Failed to remove achievement", "error");
    }
  };

  const handleAdjustPoints = async (e) => {
    e.preventDefault();
    if (!pointsForm.reason.trim()) { showToast("Reason is required", "error"); return; }
    try {
      setSavingPoints(true);
      if (pointsForm.type === "CREDIT") {
        await adminAPI.adjustPoints(student._id || student.id, { points: Number(pointsForm.points), type: "CREDIT", reason: pointsForm.reason });
      } else {
        await adminAPI.deductPoints(student._id || student.id, { points: Number(pointsForm.points), reason: pointsForm.reason });
      }
      showToast(`${pointsForm.type === "CREDIT" ? "+" : "-"}${pointsForm.points} points applied!`);
      setShowPointsModal(false);
      setPointsForm({ type: "CREDIT", points: 25, reason: "" });
      await loadStudentData();
    } catch (err) {
      showToast(err.message || "Failed to adjust points", "error");
    } finally { setSavingPoints(false); }
  };

  const handleIssueCertificate = async (e) => {
    e.preventDefault();
    if (!certForm.eventTitle.trim()) { showToast("Event title is required", "error"); return; }
    try {
      setSavingCert(true);
      await adminAPI.issueCertificate(student._id || student.id, certForm);
      showToast(`Certificate issued for "${certForm.eventTitle}"!`);
      setShowCertModal(false);
      setCertForm({ eventTitle: "", verifiedHours: 4, pointsAwarded: 50 });
      await loadStudentData();
    } catch (err) {
      showToast(err.message || "Failed to issue certificate", "error");
    } finally { setSavingCert(false); }
  };

  const handleSaveRating = async () => {
    try {
      setSavingRating(true);
      await adminAPI.updateStudentRating(student._id || student.id, ratingValue);
      setStudent((prev) => ({ ...prev, rating: ratingValue }));
      showToast(`Rating updated to ${ratingValue} ★`);
      setEditRating(false);
    } catch (err) {
      showToast(err.message || "Failed to update rating", "error");
    } finally { setSavingRating(false); }
  };

  const derived = useMemo(() => {
    if (!student) return null;
    const apps = student.applications || [];
    let txns = [...(student.transactions || [])];

    // Cross-match from global context applications by userId / email / applicationId
    const uId = String(student._id || student.id || "");
    const em = String(student.email || "").toLowerCase();
    const appId = String(student.applicationId || student.regNumber || "").toLowerCase();
    const contextApps = ctxApplications.filter((a) => {
      const aUid = String(a.userId || a.user || "").toLowerCase();
      const aEmail = String(a.applicantDetails?.email || a.email || "").toLowerCase();
      const aAppId = String(a.applicantDetails?.applicationId || a.applicationId || "").toLowerCase();
      return (uId && aUid === uId.toLowerCase()) ||
             (em && aEmail === em) ||
             (appId && aAppId === appId);
    });
    // Merge without duplicates (prefer student.applications entry if same id)
    const existingIds = new Set(apps.map((a) => String(a._id || a.id || "")));
    const extraApps = contextApps.filter((a) => !existingIds.has(String(a._id || a.id || "")));

    // Enrich apps with opportunity data from context (title, category, date)
    const enrichApp = (app) => {
      if (app.opportunityTitle && app.category) return app;
      const opp = ctxOpportunities.find((o) =>
        String(o._id || o.id || "") === String(app.opportunityId || app.eventId || "")
      );
      if (!opp) return app;
      return {
        ...app,
        opportunityTitle: app.opportunityTitle || opp.title || opp.opportunityTitle,
        category: app.category || opp.category,
        eventDate: app.eventDate || opp.eventDate || opp.date,
        hours: app.hours || opp.duration,
        pointsAwarded: app.pointsAwarded || opp.pointsAwarded,
      };
    };

    // Include all applications and assigned drives
    let drives = [...apps.map(enrichApp), ...extraApps.map(enrichApp)];
    if (drives.length === 0 && (student.assignedEvent || student.assignedRole)) {
      drives.push({
        id: "assigned_0",
        opportunityTitle: student.assignedEvent || "Community Volunteering Drive",
        eventDate: student.assignedDate || "Active",
        category: "Community Service",
        status: "Assigned",
        hours: student.totalHours || 4,
        pointsAwarded: student.points || 50,
      });
    }

    // If transactions list is empty but student has a points balance, synthesize the credit baseline
    const userPts = Number(student.points) || 0;
    if (txns.length === 0 && userPts > 0) {
      txns = [
        {
          id: "init_credit",
          type: "CREDIT",
          points: userPts,
          reason: "Community Volunteering Points Balance",
          createdAt: student.createdAt || new Date().toISOString(),
        },
      ];
    }

    const earned = txns.filter((t) => String(t.type).toUpperCase() === "CREDIT").reduce((s, t) => s + (Number(t.points) || 0), 0);
    const redeemed = txns.filter((t) => String(t.type).toUpperCase() === "DEBIT").reduce((s, t) => s + (Number(t.points) || 0), 0);
    return { drives, txns, earned: earned || userPts, redeemed };
  }, [student]);

  if (loading) {
    return (
      <div className="sp-state">
        <div className="sp-spinner" />
        <p>Loading student profile…</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="sp-state">
        <h3>Student record not found</h3>
        <p>This student could not be located in the database.</p>
        <button type="button" className="sp-btn sp-btn-ghost" onClick={() => navigate("/admin/users")}>
          <ArrowLeft size={15} /> Back to Student Directory
        </button>
      </div>
    );
  }

  const {
    fullName = "Student Volunteer",
    email = "",
    phone = "",
    applicationId = "",
    college = "Maatram Institute of Technology",
    department = "Computer Science & Engineering",
    batch = "2022-2026",
    zone = "Zone 1",
    status = "active",
    points = 0,
    totalHours = 0,
    eventsJoined = 0,
    rating = 0,
    achievements = [],
    adminNotes = "",
    createdAt,
    lastActiveAt,
  } = student;

  const rollNumber = String(applicationId || student.regNumber || student.rollNumber || "MAA001");
  const isActive = status === "active";
  const { drives, txns, earned, redeemed } = derived;
  const totalEvents = eventsJoined || drives.length || 0;
  const level = getLevelInfo(Number(points) || 0);

  // Calculate rating from involvement if 0
  const displayRating = Number(student.rating) || 0;

  const activityText = (() => {
    const date = lastActiveAt || createdAt;
    if (!date) return "Active recently";
    const hours = Math.floor((Date.now() - new Date(date).getTime()) / 36e5);
    if (hours < 24) return "Active today";
    if (hours < 48) return "Active yesterday";
    const days = Math.floor(hours / 24);
    return days < 7 ? `Active ${days} days ago` : "Active recently";
  })();

  const certificates = Array.isArray(student.certificates) && student.certificates.length
    ? student.certificates
    : drives.filter((a) => a.status === "Completed").map((a, i) => ({
        certificateId: a.certificateId || `MF-CERT-${new Date().getFullYear()}-${1042 + i}`,
        eventTitle: a.opportunityTitle || "Volunteering Drive",
        hours: a.hours || 4,
      }));

  return (
    <div className="sp-page">
      <nav className="sp-crumbs" aria-label="Breadcrumb">
        <button type="button" onClick={() => navigate("/admin/users")}>
          <ArrowLeft size={14} /> Student Directory
        </button>
        <span className="sp-crumb-sep">/</span>
        <strong>{fullName}</strong>
      </nav>

      <div className="sp-layout">
        {/* ───── Left identity card ───── */}
        <aside className="sp-identity">
          <div className="sp-identity-cover" />
          <div className="sp-avatar">{initialsOf(fullName)}</div>
          <h1 className="sp-name">{fullName}</h1>
          <p className="sp-sub">{rollNumber} • Batch {batch}</p>
          <div className="sp-pills">
            <span className={`sp-pill ${isActive ? "green" : "red"}`}>
              <i /> {isActive ? "Active Account" : "Inactive Account"}
            </span>
            <span className="sp-pill blue">{activityText}</span>
          </div>

          <ul className="sp-contact-list">
            <li><span className="sp-ico"><GraduationCap size={14} /></span>{department}</li>
            <li><span className="sp-ico"><Landmark size={14} /></span>{college}</li>
            <li><span className="sp-ico"><MapPin size={14} /></span>{zone}</li>
            <li><span className="sp-ico"><Mail size={14} /></span>{email || "—"}</li>
          </ul>

          <div className="sp-level">
            <div className="sp-level-top">
              <strong>Level {level.current.level} • {level.current.name}</strong>
              <span>{level.percent}%</span>
            </div>
            <div className="sp-level-bar" role="progressbar" aria-valuenow={level.percent} aria-valuemin={0} aria-valuemax={100}>
              <div style={{ width: `${level.percent}%` }} />
            </div>
            <p>{level.next ? `${level.remaining.toLocaleString()} points to Level ${level.next.level}` : "Top level reached"}</p>
          </div>
        </aside>

        {/* ───── Right column ───── */}
        <div className="sp-main">
          <div className="sp-stats">
            <div className="sp-stat">
              <span className="sp-stat-ico blue"><CalendarDays size={18} /></span>
              <div><strong>{totalEvents}</strong><small>Total events</small></div>
            </div>
            <div className="sp-stat">
              <span className="sp-stat-ico violet"><Clock size={18} /></span>
              <div><strong>{totalHours}h</strong><small>Total hours</small></div>
            </div>
            <div className="sp-stat">
              <span className="sp-stat-ico amber"><Trophy size={18} /></span>
              <div><strong>{Number(points).toLocaleString()}</strong><small>Community points</small></div>
            </div>
            <div className="sp-stat" style={{ position: "relative" }}>
              <span className="sp-stat-ico green"><Star size={18} /></span>
              <div>
                <strong className="blue">{displayRating} ★</strong>
                <small>Volunteer rating</small>
              </div>
              <button
                type="button"
                onClick={() => { setRatingValue(displayRating); setEditRating(true); }}
                style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", cursor: "pointer", color: "#64748B" }}
                title="Edit rating"
              >
                <Edit3 size={13} />
              </button>
            </div>
          </div>

          {/* Rating edit modal */}
          {editRating && (
            <div className="sp-overlay" onClick={() => setEditRating(false)}>
              <div className="sp-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380 }}>
                <Star size={18} style={{ color: "#EAB308", margin: "0 auto 8px", display: "block" }} />
                <h3 style={{ textAlign: "center", marginBottom: 16 }}>Update Volunteer Rating</h3>
                <p style={{ fontSize: 13, color: "#64748B", textAlign: "center", marginBottom: 16 }}>
                  Rate based on student's overall involvement, punctuality, and performance.
                </p>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                  <StarRatingInput value={ratingValue} onChange={setRatingValue} />
                </div>
                <div className="sp-modal-actions">
                  <button type="button" className="sp-btn sp-btn-soft" onClick={() => setEditRating(false)}>Cancel</button>
                  <button
                    type="button"
                    className="sp-btn sp-btn-navy"
                    disabled={savingRating}
                    onClick={handleSaveRating}
                  >
                    {savingRating ? "Saving…" : "Save Rating"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 1 — Personal information */}
          <section className="sp-card">
            <header className="sp-card-head">
              <span className="sp-num">1</span>
              <div>
                <h2>Personal Information</h2>
                <p>Identity, contact and institution details</p>
              </div>
              <button
                type="button"
                className="sp-btn sp-btn-ghost"
                onClick={() => {
                  setProfileForm({
                    fullName: student.fullName || "",
                    phone: student.phone || "",
                    college: student.college || "",
                    department: student.department || "",
                    batch: student.batch || "",
                    zone: student.zone || "",
                    regNumber: student.regNumber || "",
                    adminNotes: student.adminNotes || "",
                  });
                  setEditingProfile(true);
                }}
                style={{ marginLeft: "auto" }}
              >
                <Edit3 size={13} /> Edit
              </button>
            </header>
            <div className="sp-info-grid">
              <div><small>Full name</small><strong>{fullName}</strong></div>
              <div><small>Roll number / App ID</small><strong>{rollNumber}</strong></div>
              <div><small>Date joined</small><strong>{fmtDate(createdAt || "2024-08-15", { day: "numeric", month: "short", year: "numeric" })}</strong></div>
              <div><small>Email address</small><strong>{email || "—"}</strong></div>
              <div><small>Phone contact</small><strong>{phone || "—"}</strong></div>
              <div><small>Batch</small><strong>{batch}</strong></div>
              <div><small>Institution / college</small><strong>{college}</strong></div>
              <div><small>Department</small><strong>{department}</strong></div>
              <div><small>Assigned zone</small><strong><span className="sp-zone">{zone}</span></strong></div>
              {adminNotes && <div style={{ gridColumn: "1/-1" }}><small>Admin notes</small><strong style={{ whiteSpace: "pre-wrap", fontWeight: 400, color: "#475569" }}>{adminNotes}</strong></div>}
            </div>
          </section>

          {/* Profile Edit Modal */}
          {editingProfile && (
            <div className="sp-overlay" onClick={() => !savingProfile && setEditingProfile(false)}>
              <div className="sp-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540, maxHeight: "85vh", overflowY: "auto" }}>
                <Edit3 size={18} style={{ color: "#0066CC", margin: "0 auto 8px", display: "block" }} />
                <h3 style={{ textAlign: "center", marginBottom: 16 }}>Edit Student Profile</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  {[
                    { label: "Full Name", key: "fullName" },
                    { label: "Phone", key: "phone" },
                    { label: "College", key: "college" },
                    { label: "Department", key: "department" },
                    { label: "Batch", key: "batch" },
                    { label: "Roll Number", key: "regNumber" },
                  ].map(({ label, key }) => (
                    <label key={key} style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
                      <span style={{ fontWeight: 600, color: "#475569" }}>{label}</span>
                      <input
                        value={profileForm[key] || ""}
                        onChange={(e) => setProfileForm((p) => ({ ...p, [key]: e.target.value }))}
                        style={{ padding: "8px 10px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 13 }}
                      />
                    </label>
                  ))}
                  <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
                    <span style={{ fontWeight: 600, color: "#475569" }}>Zone</span>
                    <select
                      value={profileForm.zone || "Zone 1"}
                      onChange={(e) => setProfileForm((p) => ({ ...p, zone: e.target.value }))}
                      style={{ padding: "8px 10px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 13 }}
                    >
                      {["Zone 1", "Zone 2", "Zone 3", "Zone 4"].map((z) => <option key={z}>{z}</option>)}
                    </select>
                  </label>
                </div>
                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, marginBottom: 16 }}>
                  <span style={{ fontWeight: 600, color: "#475569" }}>Admin Notes (internal)</span>
                  <textarea
                    value={profileForm.adminNotes || ""}
                    onChange={(e) => setProfileForm((p) => ({ ...p, adminNotes: e.target.value }))}
                    rows={3}
                    style={{ padding: "8px 10px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 13, resize: "vertical" }}
                  />
                </label>
                <div className="sp-modal-actions">
                  <button type="button" className="sp-btn sp-btn-soft" disabled={savingProfile} onClick={() => setEditingProfile(false)}>Cancel</button>
                  <button type="button" className="sp-btn sp-btn-navy" disabled={savingProfile} onClick={handleSaveProfile}>
                    <Save size={13} /> {savingProfile ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2 — Achievements */}
          <section className="sp-card">
            <header className="sp-card-head">
              <span className="sp-num">2</span>
              <div>
                <h2>Achievements & Recognitions</h2>
                <p>Admin-managed student milestones and special awards</p>
              </div>
              <span className="sp-count">{(achievements || []).length} items</span>
            </header>
            <div style={{ marginBottom: 16 }}>
              {(achievements || []).length === 0 && (
                <p className="sp-empty" style={{ marginBottom: 12 }}>No achievements recorded yet. Add one below.</p>
              )}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                {(achievements || []).map((ach, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 6, background: "#F0F7FF",
                    border: "1px solid #BFDBFE", borderRadius: 20, padding: "4px 12px", fontSize: 13, fontWeight: 600, color: "#1D4ED8"
                  }}>
                    <Award size={12} />
                    {ach}
                    <button
                      type="button"
                      onClick={() => handleRemoveAchievement(i)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: 0, lineHeight: 1 }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={newAchievement}
                  onChange={(e) => setNewAchievement(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddAchievement()}
                  placeholder="e.g. Best Volunteer Award 2026, Zone Leader..."
                  style={{ flex: 1, padding: "8px 12px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 13 }}
                />
                <button
                  type="button"
                  className="sp-btn sp-btn-navy"
                  onClick={handleAddAchievement}
                  disabled={savingAchievements}
                >
                  <Plus size={13} /> Add
                </button>
              </div>
            </div>
          </section>

          {/* 3 — Volunteering history */}
          <section className="sp-card">
            <header className="sp-card-head">
              <span className="sp-num">3</span>
              <div>
                <h2>Volunteering History</h2>
                <p>Participated and assigned drives</p>
              </div>
              <span className="sp-count">{drives.length} {drives.length === 1 ? "drive" : "drives"}</span>
            </header>
            <div className="sp-table-wrap">
              <table className="sp-table">
                <thead>
                  <tr>
                    <th>Event title</th><th>Date</th><th>Category</th><th>Status</th><th>Hours</th><th>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {drives.length === 0 && (
                    <tr><td colSpan={6} className="sp-empty">No volunteering drives recorded for this student yet.</td></tr>
                  )}
                  {drives.map((app, i) => {
                    const cat = app.category || "Social Impact";
                    const { Icon, tone } = categoryIcon(cat);
                    return (
                      <tr key={app.id || app._id || i}>
                        <td>
                          <div className="sp-event-cell">
                            <span className={`sp-event-ico ${tone}`}><Icon size={15} /></span>
                            {app.opportunityTitle || "Volunteering Drive"}
                          </div>
                        </td>
                        <td>{fmtDate(app.eventDate || app.date, { day: "2-digit", month: "short", year: "numeric" })}</td>
                        <td><span className={`sp-chip ${categoryTone(cat)}`}>{cat}</span></td>
                        <td><span className={`sp-status ${String(app.status).toLowerCase()}`}>{app.status}</span></td>
                        <td>{app.hours || 4}h</td>
                        <td className="sp-pos">+{app.pointsAwarded || 50}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* 4 — Points ledger */}
          <section className="sp-card">
            <header className="sp-card-head">
              <span className="sp-num">4</span>
              <div>
                <h2>Points &amp; Recognition Ledger</h2>
                <p>Every credit and debit on this account</p>
              </div>
              <button
                type="button"
                className="sp-btn sp-btn-navy"
                onClick={() => setShowPointsModal(true)}
                style={{ marginLeft: "auto" }}
              >
                <Edit3 size={13} /> Adjust Points
              </button>
            </header>
            <div className="sp-balance-row">
              <div><small>Current balance</small><strong className="blue">{Number(points).toLocaleString()}</strong></div>
              <div><small>Total earned</small><strong className="pos">+{earned.toLocaleString()}</strong></div>
              <div><small>Total redeemed</small><strong className="neg">−{redeemed.toLocaleString()}</strong></div>
            </div>
            <div className="sp-table-wrap">
              <table className="sp-table">
                <thead>
                  <tr><th>Type</th><th>Points</th><th>Reason</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {txns.length === 0 && (
                    <tr><td colSpan={4} className="sp-empty">No points adjustments recorded.</td></tr>
                  )}
                  {txns.map((t, i) => {
                    const credit = String(t.type).toUpperCase() === "CREDIT";
                    return (
                      <tr key={t.id || t._id || i}>
                        <td>
                          <span className={`sp-txn ${credit ? "credit" : "debit"}`}>
                            {credit ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {credit ? "CREDIT" : "DEBIT"}
                          </span>
                        </td>
                        <td className={credit ? "sp-pos" : "sp-neg"}>{credit ? "+" : "−"}{t.points}</td>
                        <td>{t.reason}</td>
                        <td>{fmtDate(t.createdAt || Date.now())}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Points adjustment modal */}
          {showPointsModal && (
            <div className="sp-overlay" onClick={() => !savingPoints && setShowPointsModal(false)}>
              <div className="sp-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
                <Trophy size={18} style={{ color: "#EAB308", margin: "0 auto 8px", display: "block" }} />
                <h3 style={{ textAlign: "center", marginBottom: 16 }}>Manual Points Adjustment</h3>
                <form onSubmit={handleAdjustPoints}>
                  <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, marginBottom: 12 }}>
                    <span style={{ fontWeight: 600 }}>Action</span>
                    <select
                      value={pointsForm.type}
                      onChange={(e) => setPointsForm((p) => ({ ...p, type: e.target.value }))}
                      style={{ padding: "8px 10px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 13 }}
                    >
                      <option value="CREDIT">Credit (Add Points)</option>
                      <option value="DEBIT">Debit (Deduct Points)</option>
                    </select>
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, marginBottom: 12 }}>
                    <span style={{ fontWeight: 600 }}>Points</span>
                    <input
                      type="number" min="1"
                      value={pointsForm.points}
                      onChange={(e) => setPointsForm((p) => ({ ...p, points: e.target.value }))}
                      style={{ padding: "8px 10px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 13 }}
                    />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, marginBottom: 16 }}>
                    <span style={{ fontWeight: 600 }}>Reason <span style={{ color: "#EF4444" }}>*</span></span>
                    <input
                      type="text"
                      value={pointsForm.reason}
                      onChange={(e) => setPointsForm((p) => ({ ...p, reason: e.target.value }))}
                      placeholder="e.g. Special achievement award"
                      style={{ padding: "8px 10px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 13 }}
                    />
                  </label>
                  <div className="sp-modal-actions">
                    <button type="button" className="sp-btn sp-btn-soft" disabled={savingPoints} onClick={() => setShowPointsModal(false)}>Cancel</button>
                    <button type="submit" className={`sp-btn ${pointsForm.type === "CREDIT" ? "sp-btn-green" : "sp-btn-red"}`} disabled={savingPoints}>
                      {savingPoints ? "Saving…" : `${pointsForm.type === "CREDIT" ? "Credit" : "Deduct"} Points`}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 5 — Certificates */}
          <section className="sp-card">
            <header className="sp-card-head">
              <span className="sp-num">5</span>
              <div>
                <h2>Official Volunteering Certificates</h2>
                <p>Issued and verified by Maatram Foundation</p>
              </div>
              <button
                type="button"
                className="sp-btn sp-btn-navy"
                onClick={() => setShowCertModal(true)}
                style={{ marginLeft: "auto" }}
              >
                <Plus size={13} /> Issue Certificate
              </button>
            </header>
            <div className="sp-table-wrap">
              <table className="sp-table">
                <thead>
                  <tr>
                    <th>Certificate ID</th>
                    <th>Event / Initiative</th>
                    <th>Verified Hours</th>
                    <th>Points Awarded</th>
                    <th>Issued Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {certificates.length === 0 && (
                    <tr>
                      <td colSpan={6} className="sp-empty">
                        No certificates have been issued to this student yet. Click "+ Issue Certificate" above to issue one.
                      </td>
                    </tr>
                  )}
                  {certificates.map((c, i) => (
                    <tr key={c.certificateId || c.id || c._id || i}>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700, color: "#1E293B" }}>
                          <Medal size={15} color="#D97706" />
                          {c.certificateId || `MF-CERT-${new Date().getFullYear()}-${1000 + i}`}
                        </span>
                      </td>
                      <td>
                        <strong>{c.eventTitle || "Volunteering Initiative"}</strong>
                      </td>
                      <td>{c.hours || c.verifiedHours || 4}h</td>
                      <td className="sp-pos">+{c.pointsAwarded || 50} pts</td>
                      <td>{fmtDate(c.issuedDate || c.createdAt || Date.now())}</td>
                      <td>
                        <button
                          type="button"
                          className="sp-btn sp-btn-navy"
                          style={{ padding: "5px 12px", fontSize: 12 }}
                          onClick={() =>
                            openCertificate({
                              certificateId: c.certificateId || `MF-CERT-${new Date().getFullYear()}-${1000 + i}`,
                              volunteerName: fullName,
                              eventTitle: c.eventTitle || "Volunteering Initiative",
                              college,
                              verifiedHours: c.hours || c.verifiedHours || totalHours || 24,
                              pointsAwarded: c.pointsAwarded || points || 100,
                            })
                          }
                        >
                          <Eye size={13} /> View &amp; Print
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Certificate issue modal */}
          {showCertModal && (
            <div className="sp-overlay" onClick={() => !savingCert && setShowCertModal(false)}>
              <div className="sp-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
                <Medal size={18} style={{ color: "#0066CC", margin: "0 auto 8px", display: "block" }} />
                <h3 style={{ textAlign: "center", marginBottom: 16 }}>Issue Certificate Manually</h3>
                <form onSubmit={handleIssueCertificate}>
                  <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, marginBottom: 12 }}>
                    <span style={{ fontWeight: 600 }}>Event / Drive Title <span style={{ color: "#EF4444" }}>*</span></span>
                    <input
                      type="text"
                      value={certForm.eventTitle}
                      onChange={(e) => setCertForm((p) => ({ ...p, eventTitle: e.target.value }))}
                      placeholder="e.g. School Career Mentoring Drive"
                      style={{ padding: "8px 10px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 13 }}
                    />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, marginBottom: 12 }}>
                    <span style={{ fontWeight: 600 }}>Verified Hours</span>
                    <input
                      type="number" min="1"
                      value={certForm.verifiedHours}
                      onChange={(e) => setCertForm((p) => ({ ...p, verifiedHours: Number(e.target.value) }))}
                      style={{ padding: "8px 10px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 13 }}
                    />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, marginBottom: 16 }}>
                    <span style={{ fontWeight: 600 }}>Points Awarded</span>
                    <input
                      type="number" min="0"
                      value={certForm.pointsAwarded}
                      onChange={(e) => setCertForm((p) => ({ ...p, pointsAwarded: Number(e.target.value) }))}
                      style={{ padding: "8px 10px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 13 }}
                    />
                  </label>
                  <div className="sp-modal-actions">
                    <button type="button" className="sp-btn sp-btn-soft" disabled={savingCert} onClick={() => setShowCertModal(false)}>Cancel</button>
                    <button type="submit" className="sp-btn sp-btn-navy" disabled={savingCert}>
                      <CheckCircle2 size={13} /> {savingCert ? "Issuing…" : "Issue Certificate"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 6 — Account actions */}
          <section className="sp-card sp-danger-zone">
            <header className="sp-card-head">
              <span className="sp-num red">6</span>
              <div>
                <h2>Account Actions</h2>
                <p>Sensitive actions — review carefully before proceeding</p>
              </div>
            </header>
            <div className="sp-action-grid">
              <div className="sp-action">
                <h3>{isActive ? <Pause size={13} /> : <Play size={13} />} {isActive ? "Deactivate Account" : "Activate Account"}</h3>
                <p>
                  {isActive
                    ? "Blocks login while keeping all records, hours and points preserved. Can be reactivated later."
                    : "Restores login so this volunteer can sign in and apply for drives again."}
                </p>
                <button
                  type="button"
                  className={`sp-btn ${isActive ? "sp-btn-outline-red" : "sp-btn-outline-green"}`}
                  onClick={() => setStatusModal(isActive ? "inactive" : "active")}
                >
                  {isActive ? "Deactivate Account" : "Activate Account"}
                </button>
              </div>
              <div className="sp-action">
                <h3><Trash2 size={13} /> Delete Account</h3>
                <p>Permanently removes this volunteer and all associated data. This action cannot be undone.</p>
                <button
                  type="button"
                  className="sp-btn sp-btn-red"
                  onClick={() => { setDeleteConfirmText(""); setDeleteOpen(true); }}
                >
                  Delete Account
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ───── Deactivate / activate modal ───── */}
      {statusModal && (
        <div className="sp-overlay" onClick={() => !busy && setStatusModal(null)}>
          <div className="sp-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <span className={`sp-modal-ico ${statusModal === "active" ? "green" : "amber"}`}>
              {statusModal === "active" ? <Play size={16} /> : <Pause size={16} />}
            </span>
            <h3>{statusModal === "active" ? "Activate Account?" : "Deactivate Account?"}</h3>
            <p>
              {statusModal === "active"
                ? `Are you sure you want to activate ${fullName}'s account?`
                : `Are you sure you want to deactivate ${fullName}'s account? Their existing records will remain preserved, but login will be blocked.`}
            </p>
            <div className="sp-modal-actions">
              <button type="button" className="sp-btn sp-btn-soft" disabled={busy} onClick={() => setStatusModal(null)}>Cancel</button>
              <button
                type="button"
                className={`sp-btn ${statusModal === "active" ? "sp-btn-green" : "sp-btn-red"} sp-glow`}
                disabled={busy}
                onClick={() => handleToggleStatus(statusModal)}
              >
                Confirm {statusModal === "active" ? "Activation" : "Deactivation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───── Delete permanently modal ───── */}
      {deleteOpen && (
        <div className="sp-overlay" onClick={() => !busy && setDeleteOpen(false)}>
          <div className="sp-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <span className="sp-modal-ico red"><Trash2 size={16} /></span>
            <h3>Delete Account Permanently?</h3>
            <p>You are about to delete <strong>{fullName} ({rollNumber})</strong>. This cannot be undone.</p>
            <ul className="sp-modal-list">
              <li>Profile and login access</li>
              <li>{totalEvents} events and {totalHours} verified hours</li>
              <li>{Number(points).toLocaleString()} community points and ledger</li>
              <li>All issued certificates</li>
            </ul>
            <label className="sp-modal-label" htmlFor="sp-delete-confirm">
              Type <strong>{rollNumber}</strong> to confirm
            </label>
            <input
              id="sp-delete-confirm"
              className={`sp-modal-input ${deleteConfirmText.trim().toLowerCase() === String(rollNumber).toLowerCase() ? "match" : ""}`}
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              autoComplete="off"
              autoFocus
            />
            <div className="sp-modal-actions">
              <button type="button" className="sp-btn sp-btn-soft" disabled={busy} onClick={() => setDeleteOpen(false)}>Cancel</button>
              <button
                type="button"
                className="sp-btn sp-btn-red sp-glow"
                disabled={busy || deleteConfirmText.trim().toLowerCase() !== String(rollNumber).toLowerCase()}
                onClick={handleDelete}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
