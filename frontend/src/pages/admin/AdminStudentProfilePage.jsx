// frontend/src/pages/admin/AdminStudentProfilePage.jsx
// Student full profile for administrators.
// Layout: left identity card + right column of numbered sections
// (personal info, volunteering history, points ledger, certificates, account actions).

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
} from "lucide-react";
import { adminAPI } from "../../api/adminAPI";
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
  LEVELS.forEach((l, i) => {
    if (points >= l.min) idx = i;
  });
  const current = LEVELS[idx];
  const next = LEVELS[idx + 1];
  if (!next) {
    return { current, next: null, percent: 100, remaining: 0 };
  }
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
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

export default function AdminStudentProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast, openCertificate } = useApp();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusModal, setStatusModal] = useState(null); // "active" | "inactive" | null
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function loadStudentData() {
      try {
        setLoading(true);
        let res = null;
        try {
          res = await adminAPI.getUserById(id);
        } catch (_) { }

        if (res?.data) {
          setStudent(res.data);
        } else {
          // Fallback: locate the student in the full users list
          try {
            const all = await adminAPI.getUsers();
            const list = Array.isArray(all?.data) ? all.data : Array.isArray(all) ? all : [];
            const key = String(id).toLowerCase();
            const found = list.find(
              (u) =>
                String(u._id || "").toLowerCase() === key ||
                String(u.id || "").toLowerCase() === key ||
                String(u.applicationId || "").toLowerCase() === key ||
                String(u.email || "").toLowerCase() === key ||
                String(u.rollNumber || u.regNumber || "").toLowerCase() === key
            );
            if (found) {
              setStudent(found);
              return;
            }
          } catch (_) { }
          showToast("Student not found", "error");
        }
      } catch (err) {
        console.error("Failed to load student profile:", err);
        showToast("Error loading student profile", "error");
      } finally {
        setLoading(false);
      }
    }
    if (id) loadStudentData();
  }, [id]);

  const handleToggleStatus = async (newStatus) => {
    try {
      setBusy(true);
      await adminAPI.toggleUserStatus(student._id || student.id, newStatus);
      setStudent((prev) => ({ ...prev, status: newStatus }));
      showToast(`Student account marked as ${newStatus}!`);
      setStatusModal(null);
    } catch (err) {
      showToast(err.message || "Failed to update account status", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    try {
      setBusy(true);
      const res = await adminAPI.deleteUser(student._id || student.id);
      showToast(res?.message || `${student.fullName}'s account deleted. Historical records safely archived.`);
      setDeleteOpen(false);
      navigate("/admin/users");
    } catch (err) {
      showToast(err.message || "Failed to delete account", "error");
    } finally {
      setBusy(false);
    }
  };

  const derived = useMemo(() => {
    if (!student) return null;
    const apps = student.applications || [];
    const txns = student.transactions || [];
    const drives = apps.filter((a) => ["Completed", "Approved", "Assigned"].includes(a.status));
    const earned = txns
      .filter((t) => String(t.type).toUpperCase() === "CREDIT")
      .reduce((s, t) => s + (Number(t.points) || 0), 0);
    const redeemed = txns
      .filter((t) => String(t.type).toUpperCase() === "DEBIT")
      .reduce((s, t) => s + (Number(t.points) || 0), 0);
    return { drives, txns, earned, redeemed };
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
    rating = 4.8,
    createdAt,
    lastActiveAt,
  } = student;
  const rollNumber = String(applicationId || student.regNumber || student.rollNumber || "MAA001");
  const isActive = status === "active";
  const { drives, txns, earned, redeemed } = derived;
  const totalEvents = eventsJoined || drives.length || 0;
  const level = getLevelInfo(Number(points) || 0);

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
    : drives
      .filter((a) => a.status === "Completed")
      .map((a, i) => ({
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
          <p className="sp-sub">
            {rollNumber} • Batch {batch}
          </p>
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
              <strong>
                Level {level.current.level} • {level.current.name}
              </strong>
              <span>{level.percent}%</span>
            </div>
            <div className="sp-level-bar" role="progressbar" aria-valuenow={level.percent} aria-valuemin={0} aria-valuemax={100}>
              <div style={{ width: `${level.percent}%` }} />
            </div>
            <p>
              {level.next
                ? `${level.remaining.toLocaleString()} points to Level ${level.next.level}`
                : "Top level reached"}
            </p>
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
            <div className="sp-stat">
              <span className="sp-stat-ico green"><Star size={18} /></span>
              <div><strong className="blue">{rating} ★</strong><small>Volunteer rating</small></div>
            </div>
          </div>

          {/* 1 — Personal information */}
          <section className="sp-card">
            <header className="sp-card-head">
              <span className="sp-num">1</span>
              <div>
                <h2>Personal Information</h2>
                <p>Identity, contact and institution details</p>
              </div>
            </header>
            <div className="sp-info-grid">
              <div><small>Full name</small><strong>{fullName}</strong></div>
              <div><small>Roll number / App ID</small><strong>{rollNumber}</strong></div>
              <div><small>Date joined</small><strong>{fmtDate(createdAt || "2024-08-15", { day: "numeric", month: "short", year: "numeric" })}</strong></div>
              <div><small>Email address</small><strong>{email || "—"}</strong></div>
              <div><small>Phone contact</small><strong>{phone || "+91 98765 43210"}</strong></div>
              <div><small>Batch</small><strong>{batch}</strong></div>
              <div><small>Institution / college</small><strong>{college}</strong></div>
              <div><small>Department</small><strong>{department}</strong></div>
              <div><small>Assigned zone</small><strong><span className="sp-zone">{zone}</span></strong></div>
            </div>
          </section>

          {/* 2 — Volunteering history */}
          <section className="sp-card">
            <header className="sp-card-head">
              <span className="sp-num">2</span>
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
                    <th>Event title</th>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Hours</th>
                    <th>Points</th>
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

          {/* 3 — Points ledger */}
          <section className="sp-card">
            <header className="sp-card-head">
              <span className="sp-num">3</span>
              <div>
                <h2>Points &amp; Recognition Ledger</h2>
                <p>Every credit and debit on this account</p>
              </div>
            </header>
            <div className="sp-balance-row">
              <div><small>Current balance</small><strong className="blue">{Number(points).toLocaleString()}</strong></div>
              <div><small>Total earned</small><strong className="pos">+{earned.toLocaleString()}</strong></div>
              <div><small>Total redeemed</small><strong className="neg">−{redeemed.toLocaleString()}</strong></div>
            </div>
            <div className="sp-table-wrap">
              <table className="sp-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Points</th>
                    <th>Reason</th>
                    <th>Date</th>
                  </tr>
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
                        <td className={credit ? "sp-pos" : "sp-neg"}>
                          {credit ? "+" : "−"}{t.points}
                        </td>
                        <td>{t.reason}</td>
                        <td>{fmtDate(t.createdAt || Date.now())}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* 4 — Certificates */}
          <section className="sp-card">
            <header className="sp-card-head">
              <span className="sp-num">4</span>
              <div>
                <h2>Official Volunteering Certificates</h2>
                <p>Issued and verified by Maatram Foundation</p>
              </div>
            </header>
            <div className="sp-cert-list">
              {certificates.length === 0 && (
                <p className="sp-empty sp-empty-block">No certificates have been issued to this student yet.</p>
              )}
              {certificates.map((c, i) => (
                <div className="sp-cert" key={c.certificateId || i}>
                  <span className="sp-cert-medal"><Medal size={20} /></span>
                  <div className="sp-cert-text">
                    <h3>{c.eventTitle} Participation Certificate</h3>
                    <p>Certificate ID: {c.certificateId} • Issued by Maatram Foundation</p>
                  </div>
                  <button
                    type="button"
                    className="sp-btn sp-btn-navy"
                    onClick={() =>
                      openCertificate({
                        certificateId: c.certificateId,
                        volunteerName: fullName,
                        eventTitle: c.eventTitle,
                        college,
                        verifiedHours: c.hours || totalHours || 24,
                        pointsAwarded: points || 100,
                      })
                    }
                  >
                    <Eye size={14} /> View &amp; Print Certificate
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* 5 — Account actions */}
          <section className="sp-card sp-danger-zone">
            <header className="sp-card-head">
              <span className="sp-num red">5</span>
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
                  onClick={() => {
                    setDeleteConfirmText("");
                    setDeleteOpen(true);
                  }}
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
                ? `Are you sure you want to activate ${fullName}'s account? They will be able to log in and apply for drives.`
                : `Are you sure you want to deactivate ${fullName}'s account? Their existing records will remain preserved, but login will be blocked.`}
            </p>
            <div className="sp-modal-actions">
              <button type="button" className="sp-btn sp-btn-soft" disabled={busy} onClick={() => setStatusModal(null)}>
                Cancel
              </button>
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
            <p>
              You are about to delete <strong>{fullName} ({rollNumber})</strong>. This cannot be undone and will remove:
            </p>
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
              <button type="button" className="sp-btn sp-btn-soft" disabled={busy} onClick={() => setDeleteOpen(false)}>
                Cancel
              </button>
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