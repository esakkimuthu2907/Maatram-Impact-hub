// frontend/src/pages/admin/AdminManageEventPage.jsx
// Simplified Event Command Center
//   1. Compact hero with one-click Alumni supervisor assignment
//   2. Four tabs: Selection · Selected · Attendance · Feedback
//   3. One collapsible Filters panel (Group + Student type incl. "Both" + Status)
//   4. Sticky action bar to approve the selected volunteers
//   5. Single Volunteer modal (profile + personal QR pass)

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft, Sparkles, Users, QrCode, Award, CheckCircle2, XCircle, Calendar,
  MapPin, Clock, Mail, GraduationCap, Star, RefreshCw, Send, Check, X,
  ShieldCheck, AlertCircle, Compass, UserCheck, Eye, Copy, Download,
  SlidersHorizontal, ChevronDown, Search,
} from "lucide-react";
import { eventsAPI } from "../../api/eventsAPI";
import { adminAPI } from "../../api/adminAPI";
import "./AdminManageEventPage.css";

/* ───────────────────────── constants & helpers ───────────────────────── */

const DEFAULT_ALUMNI_MENTORS = [
  "Sundar R (Senior SDE @ Zoho)",
  "Charles (ALU000 - Student coordinator @ SISCO)",
  "Deepika K (Civil Services Aspirant & Public Policy Fellow)",
  "Karthik M (Product Lead @ Freshworks)",
  "Ananya S (Data Scientist @ Microsoft)",
  "Vignesh P (Operations Lead @ Teach For India)",
  "Direct Admin Supervised",
];

const GROUP_OPTIONS = [
  { key: "all", label: "All" },
  { key: "high", label: "🔥 High repeat" },
  { key: "medium", label: "⚡ Medium repeat" },
  { key: "low", label: "🌱 First-time" },
  { key: "recommended", label: "⭐ AI recommended" },
];

const TYPE_OPTIONS = [
  { key: "both", label: "Both", icon: "👥", hint: "Hosteller + Day Scholar" },
  { key: "hosteller", label: "Hosteller", icon: "🏠", hint: "Staying in hostel" },
  { key: "day", label: "Day Scholar", icon: "🎒", hint: "Commuting daily" },
];

const STATUS_OPTIONS = [
  { key: "all", label: "Any status" },
  { key: "pending", label: "Pending" },
  { key: "selected", label: "Selected" },
];

const residenceOf = (c) => (c.studentType || c.residence || "").toLowerCase();
const isHostel = (c) => residenceOf(c).includes("hostel");
const isDay = (c) => residenceOf(c).includes("day");
const tierOf = (c) => (c.group || "Low").toLowerCase();

/* ── session timer helpers ── */
const parseWhen = (v) => {
  if (!v) return null;
  const d = new Date(v);
  if (!isNaN(d)) return d.getTime();
  const m = String(v).match(/(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!m) return null;
  let h = Number(m[4]);
  if (m[7]) h = (h % 12) + (m[7].toLowerCase() === "pm" ? 12 : 0);
  return new Date(+m[3], +m[2] - 1, +m[1], h, +m[5], +(m[6] || 0)).getTime();
};

const clockToMin = (txt) => {
  const m = String(txt || "").trim().match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  if (!m) return null;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === "PM") h += 12;
  return h * 60 + Number(m[2] || 0);
};

// scheduled end of the meet as a timestamp (null if date/time can't be parsed)
const eventEndMs = (ev) => {
  const day = new Date(String(ev?.date || "").replace(/\(.*?\)/, "").trim());
  if (isNaN(day)) return null;
  const end = clockToMin(String(ev?.time || "").split(/\s*(?:-|–|—|to)\s*/i)[1]);
  if (end === null) return null;
  day.setHours(0, 0, 0, 0);
  return day.getTime() + end * 60000;
};

const fmtHMS = (ms) => {
  const t = Math.max(0, Math.floor(ms / 1000));
  const p = (n) => String(n).padStart(2, "0");
  return `${p(Math.floor(t / 3600))}:${p(Math.floor((t % 3600) / 60))}:${p(t % 60)}`;
};

const fmtClock = (ms) =>
  ms ? new Date(ms).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—";

const fileSafe = (s) => (s || "File").replace(/[^a-zA-Z0-9]/g, "_");

/* ───────────────────────── small presentational pieces ───────────────────────── */

function Avatar({ person, size = 44 }) {
  const name = person.studentName || "V";
  return (
    <div className="adm-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {person.avatar ? <img src={person.avatar} alt={name} /> : name.charAt(0).toUpperCase()}
    </div>
  );
}

function Empty({ icon, title, text }) {
  return (
    <div className="adm-empty">
      <div className="adm-empty-icon">{icon}</div>
      <h4>{title}</h4>
      {text && <p>{text}</p>}
    </div>
  );
}

function CandidateCard({ c, selected, onToggle, onOpen }) {
  return (
    <article className={`adm-card ${selected ? "is-selected" : ""} ${c.recommended ? "is-ai" : ""}`}>
      {c.recommended && (
        <span className="adm-ai-ribbon">
          <Sparkles size={11} /> AI Match #{c.rank}
        </span>
      )}

      <header className="adm-card-head">
        <Avatar person={c} />
        <div className="adm-card-id">
          <h4>{c.studentName}</h4>
          <p>{[c.college, c.department].filter(Boolean).join(" • ")}</p>
        </div>
      </header>

      <div className="adm-chips">
        <span className={`adm-chip tier-${tierOf(c)}`}>
          {c.groupLabel || `${c.group || "Low"} repeat`}
        </span>
        <span className="adm-chip neutral">{isHostel(c) ? "🏠 Hosteller" : "🎒 Day Scholar"}</span>
        {c.distanceKm !== undefined && c.distanceKm !== null && (
          <span className="adm-chip blue"><MapPin size={11} /> {c.distanceKm} km</span>
        )}
        {typeof c.similarityScore === "number" && (
          <span className="adm-chip purple"><Compass size={11} /> {Math.round(c.similarityScore * 100)}% fit</span>
        )}
      </div>

      <div className="adm-mini-stats">
        <div><b>{c.totalPoints || 0}</b><span>Points</span></div>
        <div><b>{c.completedEventsCount || 0}</b><span>Drives</span></div>
        <div><b>{c.totalHours || 0}</b><span>Hours</span></div>
      </div>

      {c.aiRationale && (
        <p className="adm-why">
          <Sparkles size={12} /> {c.aiRationale}
        </p>
      )}

      <footer className="adm-card-actions">
        <button type="button" className="adm-btn ghost" onClick={() => onOpen(c)}>
          <Eye size={14} /> Profile
        </button>
        <button
          type="button"
          className={`adm-btn ${selected ? "success" : "dark"}`}
          onClick={() => onToggle(c.applicationId)}
        >
          {selected ? <Check size={14} /> : <UserCheck size={14} />}
          {selected ? "Selected" : "Select"}
        </button>
      </footer>
    </article>
  );
}

/* ───────────────────────── main page ───────────────────────── */

export default function AdminManageEventPage() {
  const { id: eventId } = useParams();
  const navigate = useNavigate();

  // core
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("selection"); // selection | selected | attendance | feedback

  // toast
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // alumni
  const [alumniList, setAlumniList] = useState([]);
  const [reassigning, setReassigning] = useState(false);

  // AI selection
  const [aiData, setAiData] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [needed, setNeeded] = useState(10);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [applying, setApplying] = useState(false);

  // filters
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [groupFilter, setGroupFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("both");
  const [statusFilter, setStatusFilter] = useState("all");

  // volunteer modal (profile + pass)
  const [modalVolunteer, setModalVolunteer] = useState(null);

  // attendance
  const [qrTokenData, setQrTokenData] = useState(null);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [attendance, setAttendance] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceSearch, setAttendanceSearch] = useState("");
  const [closing, setClosing] = useState(false);
  const [verifiedHours, setVerifiedHours] = useState(4);
  const [now, setNow] = useState(Date.now());
  const [localLocks, setLocalLocks] = useState({}); // { [recordId]: { at, reason } }

  // feedback
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackStats, setFeedbackStats] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  /* ── data loading ── */

  const fetchEventData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await eventsAPI.getById(eventId);
      if (res && res.data) {
        const ev = res.data.data || res.data;
        setEvent(ev);
        setNeeded(Number(ev.volunteersNeeded || ev.requiredVolunteers || 10));
        setAttendance(ev.attendanceRecords || []);
      }
      try {
        const uRes = await adminAPI.getUsers();
        if (uRes && uRes.data) {
          const list = uRes.data.data || uRes.data.users || uRes.data || [];
          setAlumniList(list.filter((u) => (u.role || "").toLowerCase() === "alumni"));
        }
      } catch (_) { }
    } catch (err) {
      setError(err.message || "Failed to load event data");
    } finally {
      setLoading(false);
    }
  };

  const fetchAI = async (override) => {
    try {
      setAiLoading(true);
      const res = await eventsAPI.getAIRecommendations(eventId, {
        volunteersNeeded: override || needed || 10,
      });
      if (res && res.data) {
        const data = res.data.data || res.data;
        setAiData(data);
        const pre = new Set();
        (data.recommendations || []).forEach((c) => {
          if (c.recommended || c.status === "Approved") pre.add(c.applicationId);
        });
        setSelectedIds(pre);
      }
    } catch (err) {
      showToast(err.message || "Failed to generate AI recommendations", "error");
    } finally {
      setAiLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      setAttendanceLoading(true);
      const res = await eventsAPI.getAttendance(eventId);
      if (res && res.data) setAttendance(res.data.data || res.data || []);
    } catch (err) {
      console.warn("Failed to fetch attendance:", err);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const fetchFeedbacks = async () => {
    if (!eventId) return;
    try {
      setFeedbackLoading(true);
      const res = await eventsAPI.getFeedbacks(eventId);
      if (res && res.data) {
        const d = res.data.data || res.data;
        setFeedbacks(d.feedbacks || []);
        setFeedbackStats(d.stats || null);
      }
    } catch (_) {
      setFeedbacks([]);
    } finally {
      setFeedbackLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchEventData();
      fetchAI();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  // live clock for session timers (only while the Attendance tab is open)
  useEffect(() => {
    if (activeTab !== "attendance") return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [activeTab]);

  // when the scheduled end time passes: lock open sessions and save verified attendance (once)
  const autoSavedRef = useRef(false);
  useEffect(() => {
    if (activeTab !== "attendance" || !event || autoSavedRef.current) return;
    const end = eventEndMs(event);
    if (!end || now < end) return;
    const open = attendance.filter((r) => r.status === "Present" && !(r.checkOutTime || r.lockedAt));
    if (open.length === 0) return;
    autoSavedRef.current = true;
    (async () => {
      try {
        await Promise.all(
          open.map((r) =>
            eventsAPI.lockSession?.(eventId, {
              applicationId: r.applicationId,
              userId: r.userId,
              lockedAt: new Date(end).toISOString(),
              auto: true,
            })
          )
        );
        await adminAPI.verifyAllApprovedAttendance(eventId);
        showToast("Meet ended: sessions auto-locked & attendance saved");
        fetchAttendance();
      } catch (_) { }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, activeTab, event, attendance]);

  /* ── alumni ── */

  const alumniLabel = (a) =>
    `${a.fullName} (${a.designation || a.role || "Alumni Leader"} @ ${a.organization || a.company || "Zoho"})`;

  const alumniOptions = useMemo(() => {
    const fromApi = alumniList.map(alumniLabel);
    const all = [...fromApi, ...DEFAULT_ALUMNI_MENTORS];
    if (event?.assignedAlumni) all.unshift(event.assignedAlumni);
    return [...new Set(all)];
  }, [alumniList, event?.assignedAlumni]);

  const handleReassignAlumni = async (newAlumni) => {
    if (!newAlumni) return;
    try {
      setReassigning(true);
      setEvent((prev) => (prev ? { ...prev, assignedAlumni: newAlumni } : prev));
      await eventsAPI.update(eventId, { assignedAlumni: newAlumni });

      const match = alumniList.find((a) => alumniLabel(a) === newAlumni || a.fullName === newAlumni);
      if (match) {
        try {
          await adminAPI.assignWork(match.id || match._id, {
            targetEvent: event.title,
            targetRole: "Event Lead & Supervisor",
            targetDate: event.date || new Date().toISOString().split("T")[0],
            targetDesc: `Lead and supervise on-ground student drive for "${event.title}".`,
          });
        } catch (_) { }
      }
      showToast(`Supervisor set to ${newAlumni}`);
    } catch (err) {
      showToast(err.message || "Failed to update alumni supervisor", "error");
    } finally {
      setReassigning(false);
    }
  };

  /* ── selection handlers ── */

  const toggleSelect = (appId) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(appId) ? next.delete(appId) : next.add(appId);
      return next;
    });

  const selectAllRecommended = () => {
    if (!aiData?.recommendations) return;
    const next = new Set(selectedIds);
    aiData.recommendations.forEach((c) => c.recommended && next.add(c.applicationId));
    setSelectedIds(next);
    showToast(`Selected all ${aiData.counts?.recommended || 0} AI recommended volunteers`);
  };

  const handleApply = async (sendEmail = true) => {
    if (selectedIds.size === 0) return showToast("Please select at least one volunteer.", "error");
    try {
      setApplying(true);
      const res = await eventsAPI.applyAISelection(eventId, {
        selectedApplicationIds: Array.from(selectedIds),
        sendEmail,
      });
      showToast(res.data?.message || `Approved ${selectedIds.size} volunteers!`);
      await fetchEventData();
      await fetchAI();
    } catch (err) {
      showToast(err.message || "Failed to apply selection", "error");
    } finally {
      setApplying(false);
    }
  };

  /* ── QR / attendance handlers ── */

  const downloadQRCode = (elementId, filename = "checkin-qr.png") => {
    try {
      const svg = document.getElementById(elementId);
      if (!svg) return showToast("QR code not ready for download", "error");
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width + 60;
        canvas.height = img.height + 60;
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 30, 30);
        const a = document.createElement("a");
        a.download = filename;
        a.href = canvas.toDataURL("image/png");
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast("QR code downloaded!");
      };
      img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    } catch (err) {
      showToast("Download failed: " + err.message, "error");
    }
  };

  const handleGenerateQR = async () => {
    try {
      setGeneratingQR(true);
      const res = await eventsAPI.generateQRToken(eventId, 24);
      if (res && res.data) {
        setQrTokenData(res.data.data || res.data);
        showToast("Check-in QR generated!");
      }
    } catch (err) {
      showToast(err.message || "Failed to generate QR Code", "error");
    } finally {
      setGeneratingQR(false);
    }
  };

  const handleInvalidateQR = async () => {
    try {
      await eventsAPI.invalidateQRToken(eventId);
      setQrTokenData(null);
      showToast("QR code invalidated.");
    } catch (err) {
      showToast(err.message || "Failed to invalidate QR Code", "error");
    }
  };

  const handleToggleAttendance = async (userId, applicationId, currentStatus) => {
    const next = currentStatus === "Present" ? "Absent" : "Present";
    try {
      await adminAPI.markVolunteerAttendance(eventId, userId, applicationId, next);
      showToast(`Marked ${next}`);
      fetchAttendance();
    } catch (err) {
      showToast(err.message || "Failed to update attendance", "error");
    }
  };

  const handleVerifyAll = async () => {
    try {
      await adminAPI.verifyAllApprovedAttendance(eventId);
      showToast("All approved volunteers verified!");
      fetchAttendance();
    } catch (err) {
      showToast(err.message || "Failed to verify attendance", "error");
    }
  };

  const handleCloseEvent = async () => {
    if (!window.confirm("Close attendance and distribute completion points to all verified volunteers?")) return;
    try {
      setClosing(true);
      // lock every active session as verified before closing
      await adminAPI.verifyAllApprovedAttendance(eventId).catch(() => { });
      const res = await eventsAPI.closeAttendance(eventId, {
        verifiedHours: Number(verifiedHours),
        pointsAwarded: event?.points || 50,
      });
      showToast(res.data?.message || "Attendance closed & certificates issued!");
      setEvent((prev) => (prev ? { ...prev, status: "Completed", eventStatus: "Completed" } : prev));
      // admin close → every active session is locked as verified
      setLocalLocks((prev) => {
        const next = { ...prev };
        attendance.forEach((r) => {
          const id = r.applicationId || r.userId || r.id;
          if (r.status === "Present" && !next[id]) next[id] = { at: Date.now(), reason: "Closed by admin" };
        });
        return next;
      });
      fetchEventData();
    } catch (err) {
      showToast(err.message || "Failed to close attendance", "error");
    } finally {
      setClosing(false);
    }
  };

  const handleLockSession = async (rec) => {
    const id = rec.applicationId || rec.userId || rec.id;
    const at = Date.now();
    setLocalLocks((prev) => ({ ...prev, [id]: { at, reason: "Manual lock" } }));
    try {
      // optional backend hook — safe to leave unimplemented
      await eventsAPI.lockSession?.(eventId, { applicationId: rec.applicationId, userId: rec.userId, lockedAt: new Date(at).toISOString() });
    } catch (_) { }
    showToast("Time locked & check-out recorded");
  };

  const sendConfirmEmails = async () => {
    try {
      await eventsAPI.confirmSelection(eventId);
      showToast("Confirmation emails sent to selected volunteers!");
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const sendReminder = async () => {
    try {
      await eventsAPI.sendReminder(eventId);
      showToast("Event reminders sent!");
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  /* ── derived data ── */

  const allApps = aiData?.recommendations || [];
  const isChosen = (c) => c.status === "Approved" || selectedIds.has(c.applicationId);

  const matchesType = (c) =>
    typeFilter === "both" ? true : typeFilter === "hosteller" ? isHostel(c) : isDay(c);

  const filteredCandidates = useMemo(() => {
    return allApps.filter((c) => {
      if (groupFilter === "high" && c.group !== "High") return false;
      if (groupFilter === "medium" && c.group !== "Medium") return false;
      if (groupFilter === "low" && c.group !== "Low") return false;
      if (groupFilter === "recommended" && !c.recommended) return false;
      if (statusFilter === "pending" && !(c.status === "Pending" || c.status === "Applied")) return false;
      if (statusFilter === "selected" && !(c.status === "Approved" || selectedIds.has(c.applicationId))) return false;
      return matchesType(c);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allApps, groupFilter, typeFilter, statusFilter, selectedIds]);

  const approvedAll = useMemo(
    () => allApps.filter((c) => c.status === "Approved" || selectedIds.has(c.applicationId)),
    [allApps, selectedIds]
  );

  const approvedShown = useMemo(
    () => approvedAll.filter(matchesType),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [approvedAll, typeFilter]
  );

  const filteredAttendance = useMemo(() => {
    const q = attendanceSearch.trim().toLowerCase();
    if (!q) return attendance;
    return attendance.filter(
      (r) =>
        (r.fullName || r.userName || r.volunteerName || r.studentName || "").toLowerCase().includes(q) ||
        (r.maatramId || r.applicationId || "").toLowerCase().includes(q) ||
        (r.college || "").toLowerCase().includes(q)
    );
  }, [attendance, attendanceSearch]);

  const activeFilterCount =
    (groupFilter !== "all" ? 1 : 0) + (typeFilter !== "both" ? 1 : 0) + (statusFilter !== "all" ? 1 : 0);

  const clearFilters = () => {
    setGroupFilter("all");
    setTypeFilter("both");
    setStatusFilter("all");
  };

  const groupCount = (key) => {
    if (key === "all") return totalApps;
    return aiData?.counts?.[key] || 0;
  };

  /* ── early states ── */

  if (loading && !event) {
    return (
      <div className="adm-manage-page adm-center">
        <RefreshCw size={34} className="adm-spin gold" />
        <h3>Loading event…</h3>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="adm-manage-page adm-center">
        <AlertCircle size={44} className="red" />
        <h3>{error || "Event not found"}</h3>
        <button className="adm-btn ghost" onClick={() => navigate("/admin/events")}>
          <ArrowLeft size={15} /> Back to events
        </button>
      </div>
    );
  }

  const isCompleted = event.status === "Completed" || event.eventStatus === "Completed";
  const requiredCount = Number(event.volunteersNeeded || event.requiredVolunteers || 10);
  const totalApps = aiData?.totalApplicants || event.registeredVolunteers?.length || 0;
  const presentCount = attendance.filter((r) => r.status === "Present").length;
  const progressPct = Math.min(100, Math.round((approvedAll.length / Math.max(requiredCount, 1)) * 100));
  const points = event.points || 50;
  const endMs = eventEndMs(event);
  const plannedHours = Number(event.durationHours) || 4;

  // live / locked session for one attendance record
  const sessionOf = (rec) => {
    const id = rec.applicationId || rec.userId || rec.id;
    const start = parseWhen(rec.checkInAt || rec.checkedInAt || rec.checkInTime || rec.verifiedAt);
    if (rec.status !== "Present" || !start) return null;

    const local = localLocks[id];
    const saved = parseWhen(rec.checkOutTime || rec.lockedAt);
    let lockAt = local?.at || saved || (isCompleted ? endMs || now : null);
    let reason = local?.reason || (saved ? "Locked" : isCompleted ? "Event closed" : null);
    if (!lockAt && endMs && now >= endMs) {
      lockAt = endMs;
      reason = "Auto-locked";
    }
    const stop = Math.min(lockAt || now, endMs || Infinity);
    const elapsed = Math.max(0, stop - start);
    const hours = rec.verifiedHours && lockAt ? Number(rec.verifiedHours) : elapsed / 3600000;
    const pts = Math.round(points * Math.min(1, hours / plannedHours));
    return { start, elapsed, hours, pts, locked: Boolean(lockAt), reason };
  };

  const TABS = [
    { key: "selection", label: "AI Selection", icon: <Sparkles size={15} />, count: totalApps },
    { key: "selected", label: "Selected", icon: <Users size={15} />, count: approvedAll.length },
    {
      key: "attendance", label: "Attendance", icon: <QrCode size={15} />, count: presentCount,
      onOpen: fetchAttendance,
    },
    {
      key: "feedback", label: "Feedback", icon: <Star size={15} />, count: feedbacks.length || null,
      onOpen: fetchFeedbacks,
    },
  ];

  const avgRating =
    feedbackStats?.averageRating ||
    (feedbacks.length
      ? (feedbacks.reduce((s, f) => s + (Number(f.rating) || 5), 0) / feedbacks.length).toFixed(1)
      : "–");

  /* ───────────────────────── render ───────────────────────── */

  return (
    <div className="adm-manage-page">
      {/* Toast */}
      {toast && (
        <div className={`adm-toast ${toast.type}`}>
          {toast.type === "error" ? <AlertCircle size={17} /> : <CheckCircle2 size={17} />}
          {toast.msg}
        </div>
      )}

      {/* Top bar */}
      <div className="adm-topbar">
        <button className="adm-btn ghost" onClick={() => navigate("/admin/events")}>
          <ArrowLeft size={15} /> Events
        </button>
        <button
          className="adm-btn ghost"
          onClick={() => {
            fetchEventData();
            fetchAI();
          }}
        >
          <RefreshCw size={14} className={aiLoading ? "adm-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Hero + supervisor */}
      <section className="adm-hero">
        <div className="adm-hero-corner">
          <span className="adm-tag gold">{event.category || "Volunteering"}</span>
          <span className={`adm-tag ${isCompleted ? "blue" : "green"}`}>
            {isCompleted ? "Completed" : "Active"}
          </span>
        </div>

        <h1>{event.title}</h1>
        {event.description && <p className="adm-hero-desc">{event.description}</p>}

        <div className="adm-hero-bottom">
          <div className="adm-hero-meta">
            <span><Calendar size={14} /> {event.date || "Upcoming"}</span>
            <span><Clock size={14} /> {event.time || event.slot || "09:00 AM - 01:00 PM"}</span>
            <span>
              <MapPin size={14} /> {event.venue || event.location || "Venue TBA"} ({event.mode || "In-Person"})
            </span>
            <span><Award size={14} /> {points} points</span>
          </div>

          {/* Alumni supervisor — one-click assign */}
          <div className="adm-supervisor">
            <div className="adm-supervisor-icon"><GraduationCap size={20} /></div>
            <div className="adm-supervisor-text">
              <label htmlFor="adm-alumni-select">Alumni supervisor</label>
              <select
                id="adm-alumni-select"
                value={event.assignedAlumni || ""}
                onChange={(e) => handleReassignAlumni(e.target.value)}
                disabled={reassigning}
              >
                <option value="" disabled>Select an alumni to assign…</option>
                {alumniOptions.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            {reassigning && <RefreshCw size={15} className="adm-spin gold" />}
            {!reassigning && event.assignedAlumni && <span className="adm-tag gold small">✓ Assigned</span>}
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="adm-kpis">
        <div className="adm-kpi">
          <div className="adm-kpi-icon yellow"><Users size={20} /></div>
          <div><b>{totalApps}</b><span>Applicants</span></div>
        </div>
        <div className="adm-kpi">
          <div className="adm-kpi-icon blue"><UserCheck size={20} /></div>
          <div className="adm-kpi-grow">
            <b>{approvedAll.length}<small> / {requiredCount}</small></b>
            <span>Selected</span>
            <div className="adm-progress"><i style={{ width: `${progressPct}%` }} /></div>
          </div>
        </div>
        <div className="adm-kpi">
          <div className="adm-kpi-icon green"><CheckCircle2 size={20} /></div>
          <div><b>{presentCount}</b><span>Checked in</span></div>
        </div>
        <div className="adm-kpi">
          <div className="adm-kpi-icon purple"><Sparkles size={20} /></div>
          <div><b>{aiData?.counts?.high || 0}</b><span>High-repeat leads</span></div>
        </div>
      </section>

      {/* Tabs */}
      <nav className="adm-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`adm-tab ${activeTab === t.key ? "active" : ""}`}
            onClick={() => {
              setActiveTab(t.key);
              t.onOpen && t.onOpen();
            }}
          >
            {t.icon} {t.label}
            {t.count !== null && t.count !== undefined && <em>{t.count}</em>}
          </button>
        ))}
      </nav>

      {/* ═════════ TAB: AI SELECTION ═════════ */}
      {activeTab === "selection" && (
        <>
          <div className="adm-toolbar">
            <div>
              <h3>AI recommended volunteers</h3>
            </div>

            <div className="adm-toolbar-actions">
              <label className="adm-needed">
                Needed
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={needed}
                  onChange={(e) => setNeeded(Number(e.target.value))}
                />
              </label>
              <button className="adm-btn ghost" onClick={() => fetchAI(needed)} disabled={aiLoading}>
                <RefreshCw size={14} className={aiLoading ? "adm-spin" : ""} /> Re-run AI
              </button>
              <button className="adm-btn ghost" onClick={selectAllRecommended}>
                <Star size={14} className="gold" /> Select recommended ({aiData?.counts?.recommended || 0})
              </button>
            </div>
          </div>

          {/* Collapsible filters */}
          <div className={`adm-filters ${filtersOpen ? "open" : ""}`}>
            <div className="adm-filters-bar">
              <button
                type="button"
                className="adm-filter-toggle"
                onClick={() => setFiltersOpen((o) => !o)}
                aria-expanded={filtersOpen}
              >
                <SlidersHorizontal size={15} />
                Filters
                {activeFilterCount > 0 && <em>{activeFilterCount}</em>}
                <ChevronDown size={15} className="chev" />
              </button>

              <div className="adm-active-filters">
                {groupFilter !== "all" && (
                  <span className="adm-pill-on" onClick={() => setGroupFilter("all")}>
                    {GROUP_OPTIONS.find((g) => g.key === groupFilter)?.label} <X size={12} />
                  </span>
                )}
                {typeFilter !== "both" && (
                  <span className="adm-pill-on" onClick={() => setTypeFilter("both")}>
                    {TYPE_OPTIONS.find((g) => g.key === typeFilter)?.label} <X size={12} />
                  </span>
                )}
                {statusFilter !== "all" && (
                  <span className="adm-pill-on" onClick={() => setStatusFilter("all")}>
                    {STATUS_OPTIONS.find((g) => g.key === statusFilter)?.label} <X size={12} />
                  </span>
                )}
                {activeFilterCount === 0 && <span className="adm-muted">Showing everyone</span>}
              </div>

              <span className="adm-result-count">{filteredCandidates.length} shown</span>
            </div>

            {filtersOpen && (
              <div className="adm-filters-panel">
                <div className="adm-filter-group">
                  <h5>Applicant group</h5>
                  <div className="adm-seg">
                    {GROUP_OPTIONS.map((g) => (
                      <button
                        key={g.key}
                        className={groupFilter === g.key ? "on" : ""}
                        onClick={() => setGroupFilter(g.key)}
                      >
                        {g.label} <em>{groupCount(g.key)}</em>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="adm-filter-group">
                  <h5>Student type</h5>
                  <div className="adm-type-row">
                    {TYPE_OPTIONS.map((t) => (
                      <button
                        key={t.key}
                        className={`adm-type ${typeFilter === t.key ? "on" : ""}`}
                        onClick={() => setTypeFilter(t.key)}
                      >
                        <span className="adm-type-icon">{t.icon}</span>
                        <span>
                          <b>{t.label}</b>
                          <small>{t.hint}</small>
                        </span>
                        {typeFilter === t.key && <Check size={15} className="tick" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="adm-filter-group">
                  <h5>Status</h5>
                  <div className="adm-seg">
                    {STATUS_OPTIONS.map((s) => (
                      <button
                        key={s.key}
                        className={statusFilter === s.key ? "on" : ""}
                        onClick={() => setStatusFilter(s.key)}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="adm-filters-foot">
                  <button className="adm-link" onClick={clearFilters} disabled={activeFilterCount === 0}>
                    Reset filters
                  </button>
                  <button className="adm-btn dark small" onClick={() => setFiltersOpen(false)}>
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Candidate grid */}
          {aiLoading ? (
            <div className="adm-center small">
              <RefreshCw size={30} className="adm-spin gold" />
              <p>Running AI volunteer selection…</p>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <Empty icon={<Users size={26} />} title="No candidates match these filters" text="Try resetting the filters." />
          ) : (
            <div className="adm-grid">
              {filteredCandidates.map((c) => (
                <CandidateCard
                  key={c.applicationId}
                  c={c}
                  selected={selectedIds.has(c.applicationId)}
                  onToggle={toggleSelect}
                  onOpen={setModalVolunteer}
                />
              ))}
            </div>
          )}

          {/* Sticky approve bar */}
          {selectedIds.size > 0 && (
            <div className="adm-sticky">
              <div className="adm-sticky-info">
                <b>{selectedIds.size}</b> selected
                <span>· event needs {requiredCount}</span>
              </div>
              <div className="adm-sticky-actions">
                <button className="adm-btn ghost" onClick={() => setSelectedIds(new Set())}>Clear</button>
                <button className="adm-btn ghost" onClick={() => handleApply(false)} disabled={applying}>
                  Approve only
                </button>
                <button className="adm-btn gold" onClick={() => handleApply(true)} disabled={applying}>
                  <CheckCircle2 size={15} /> {applying ? "Approving…" : "Approve & email"}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═════════ TAB: SELECTED ═════════ */}
      {activeTab === "selected" && (
        <>
          <div className="adm-toolbar">
            <div>
              <h3>Selected volunteers ({approvedShown.length})</h3>
            </div>
            <div className="adm-toolbar-actions">
              <div className="adm-seg compact">
                {TYPE_OPTIONS.map((t) => (
                  <button key={t.key} className={typeFilter === t.key ? "on" : ""} onClick={() => setTypeFilter(t.key)}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
              <button className="adm-btn ghost" onClick={sendConfirmEmails}>
                <Mail size={14} /> Confirmation emails
              </button>
              <button className="adm-btn gold" onClick={sendReminder}>
                <Send size={14} /> Send reminder
              </button>
            </div>
          </div>

          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Volunteer</th>
                  <th>Contact</th>
                  <th>College</th>
                  <th>Experience</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {approvedShown.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="adm-td-empty">
                      Nobody selected yet. Pick volunteers in the AI Selection tab.
                    </td>
                  </tr>
                ) : (
                  approvedShown.map((v) => (
                    <tr key={v.applicationId}>
                      <td>
                        <div className="adm-person">
                          <Avatar person={v} size={36} />
                          <div>
                            <b>{v.studentName}</b>
                            <small>{v.maatramId}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span>{v.studentEmail || "—"}</span>
                        <small>{v.studentPhone || "—"}</small>
                      </td>
                      <td>
                        <b>{v.college}</b>
                        <small>{v.department} · {isHostel(v) ? "Hosteller" : "Day Scholar"}</small>
                      </td>
                      <td>
                        <span className={`adm-chip tier-${tierOf(v)}`}>{v.repeatCount || 0}× repeat</span>
                        <small>{v.totalPoints || 0} pts · {v.completedEventsCount || 0} drives</small>
                      </td>
                      <td className="adm-td-right">
                        <button className="adm-btn ghost small" onClick={() => setModalVolunteer(v)}>
                          <Eye size={13} /> Profile & Pass
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ═════════ TAB: ATTENDANCE ═════════ */}
      {activeTab === "attendance" && (
        <div className="adm-attendance">
          {/* QR card */}
          <aside className="adm-qr-card">
            <h3>Event check-in QR</h3>
            <p>Volunteers scan this to mark verified attendance.</p>

            <div className="adm-qr-frame">
              {qrTokenData ? (
                <QRCodeSVG
                  id="event-main-qr-svg"
                  value={JSON.stringify({
                    eventId,
                    token: qrTokenData.qrToken || qrTokenData.token,
                    passCode: qrTokenData.checkInCode || event.checkInCode || "MF-PASS",
                    title: event.title,
                  })}
                  size={190}
                  level="H"
                  includeMargin
                />
              ) : (
                <div className="adm-qr-empty">
                  <QrCode size={44} />
                  <span>No active QR</span>
                </div>
              )}
            </div>

            <div className="adm-note">
              <Clock size={14} /> Scans open 10 min before start ({event.time || "09:00 AM"})
            </div>

            {qrTokenData && (
              <>
                <div className="adm-code-box">
                  <div>
                    <small>Check-in code</small>
                    <b>{qrTokenData.checkInCode || event.checkInCode || "MF-CHECKIN"}</b>
                  </div>
                  <button
                    className="adm-btn ghost small"
                    onClick={() => {
                      navigator.clipboard.writeText(qrTokenData.checkInCode || event.checkInCode || "MF-CHECKIN");
                      showToast("Code copied!");
                    }}
                  >
                    <Copy size={13} /> Copy
                  </button>
                </div>
                <div className="adm-live">● Live · valid for 24 hours</div>
                <button
                  className="adm-btn ghost full"
                  onClick={() => downloadQRCode("event-main-qr-svg", `${fileSafe(event.title)}_CheckIn_QR.png`)}
                >
                  <Download size={14} /> Download PNG
                </button>
              </>
            )}

            <div className="adm-row full">
              <button className="adm-btn gold grow" onClick={handleGenerateQR} disabled={generatingQR}>
                <QrCode size={14} /> {qrTokenData ? "Regenerate" : "Generate QR"}
              </button>
              {qrTokenData && (
                <button className="adm-btn ghost" onClick={handleInvalidateQR} title="Invalidate QR">
                  <X size={14} />
                </button>
              )}
            </div>
          </aside>

          {/* Roster + close event */}
          <div className="adm-attendance-main">
            <div className="adm-toolbar tight">
              <div>
                <h3>Live attendance ({presentCount} checked in)</h3>
                <p>Meet ends {fmtClock(endMs)} · timers auto-lock at end time.</p>
              </div>
              <div className="adm-toolbar-actions">
                <button className="adm-btn ghost" onClick={handleVerifyAll}>
                  <ShieldCheck size={14} /> Verify all
                </button>
              </div>
            </div>

            <div className="adm-search">
              <Search size={15} />
              <input
                type="text"
                placeholder="Search by name, ID or college…"
                value={attendanceSearch}
                onChange={(e) => setAttendanceSearch(e.target.value)}
              />
            </div>

            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Volunteer</th>
                    <th>Status</th>
                    <th>Check-in</th>
                    <th>Session timer</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="adm-td-empty">
                        {attendanceLoading ? "Loading roster…" : "No attendance recorded yet."}
                      </td>
                    </tr>
                  ) : (
                    filteredAttendance.map((rec) => {
                      const present = rec.status === "Present";
                      const ses = sessionOf(rec);
                      return (
                        <tr key={rec.applicationId || rec.userId || rec.id}>
                          <td>
                            <b>{rec.fullName || rec.volunteerName || rec.userName || rec.studentName || "Volunteer"}</b>
                            <small>{[rec.maatramId || rec.regNumber || "MAA-VOL", rec.department].filter(Boolean).join(" · ")}</small>
                          </td>
                          <td>
                            <span className={`adm-status ${present ? "ok" : "no"}`}>
                              {present ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                              {present ? "Present" : "Absent"}
                            </span>
                          </td>
                          <td>
                            <span>
                              {(() => {
                                const t = parseWhen(rec.checkInAt || rec.checkedInAt || rec.checkInTime || rec.verifiedAt);
                                return t ? fmtClock(t) : rec.checkInTime || "—";
                              })()}
                            </span>
                            <small>{rec.method || "QR Code"}</small>
                          </td>
                          <td>
                            {ses ? (
                              <div className="adm-session">
                                <span className={`adm-timer ${ses.locked ? "locked" : "live"}`}>
                                  {ses.locked ? "🔒" : <i className="adm-dot" />} {fmtHMS(ses.elapsed)}
                                </span>
                                <small>
                                  {ses.hours.toFixed(2)} h · ~{ses.pts} pts
                                  {ses.locked && ses.reason ? ` · ${ses.reason}` : ""}
                                </small>
                              </div>
                            ) : (
                              <span className="adm-muted">—</span>
                            )}
                          </td>
                          <td className="adm-td-right">
                            {ses && !ses.locked && (
                              <button
                                className="adm-btn dark small"
                                onClick={() => handleLockSession(rec)}
                                style={{ marginRight: 6 }}
                                title="Lock Time Manually & Finish Check-Out"
                              >
                                🔒 Lock & Check-Out
                              </button>
                            )}
                            <button
                              className="adm-btn ghost small"
                              onClick={() => handleToggleAttendance(rec.userId, rec.applicationId, rec.status)}
                            >
                              {present ? "Mark absent" : "Mark present"}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Close event (replaces the old Points tab) */}
            <div className="adm-close-card">
              <div className="adm-close-text">
                <h4><Award size={17} /> Finish event</h4>
                <p>
                  Adds verified hours, awards <b>{points} points</b> per volunteer, and issues certificates.
                </p>
              </div>
              <label className="adm-needed">
                Hours
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={verifiedHours}
                  onChange={(e) => setVerifiedHours(Number(e.target.value))}
                />
              </label>
              <button className="adm-btn success" onClick={handleCloseEvent} disabled={closing || isCompleted}>
                <Award size={15} /> {isCompleted ? "Event completed" : closing ? "Finishing…" : "Close & award points"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════ TAB: FEEDBACK ═════════ */}
      {activeTab === "feedback" && (
        <>
          <div className="adm-toolbar">
            <div>
              <h3>Volunteer feedback</h3>
              <p>Ratings submitted by volunteers to unlock their certificates.</p>
            </div>
            <div className="adm-toolbar-actions">
              <button className="adm-btn ghost" onClick={fetchFeedbacks} disabled={feedbackLoading}>
                <RefreshCw size={14} className={feedbackLoading ? "adm-spin" : ""} /> Refresh
              </button>
            </div>
          </div>

          <div className="adm-kpis">
            <div className="adm-kpi"><div className="adm-kpi-icon yellow">⭐</div><div><b>{avgRating}<small> / 5</small></b><span>Overall</span></div></div>
            <div className="adm-kpi"><div className="adm-kpi-icon blue">🤝</div><div><b>{feedbackStats?.averageCoordinatorRating || "–"}<small> / 5</small></b><span>Leadership</span></div></div>
            <div className="adm-kpi"><div className="adm-kpi-icon green">🏢</div><div><b>{feedbackStats?.averageOrganizationRating || "–"}<small> / 5</small></b><span>Venue & org</span></div></div>
            <div className="adm-kpi"><div className="adm-kpi-icon purple">🚀</div><div><b>{feedbackStats?.recommendRate ?? "–"}{feedbackStats?.recommendRate !== undefined && "%"}</b><span>Would volunteer again</span></div></div>
          </div>

          {feedbackLoading ? (
            <div className="adm-center small"><RefreshCw size={28} className="adm-spin gold" /><p>Loading feedback…</p></div>
          ) : feedbacks.length === 0 ? (
            <Empty icon="⭐" title="No reviews yet" text="Reviews appear here once volunteers submit feedback after the event." />
          ) : (
            <div className="adm-feedback-list">
              {feedbacks.map((fb, idx) => {
                const rating = Number(fb.rating) || 5;
                return (
                  <article key={idx} className="adm-feedback">
                    <header>
                      <Avatar person={fb} size={42} />
                      <div className="adm-feedback-id">
                        <h4>{fb.studentName || "Volunteer"}</h4>
                        <p>{fb.college || "—"} • {fb.department || "General"}</p>
                      </div>
                      <div className="adm-stars">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={15} color={i < rating ? "#EAB308" : "#CBD5E1"} fill={i < rating ? "#EAB308" : "none"} />
                        ))}
                        <b>{rating}/5</b>
                      </div>
                    </header>
                    <div className="adm-chips">
                      <span className="adm-chip neutral">Leadership {fb.coordinatorRating || 5}/5</span>
                      <span className="adm-chip neutral">Venue {fb.organizationRating || 5}/5</span>
                      {fb.recommendRating && <span className="adm-chip tier-high">👍 {fb.recommendRating}</span>}
                      <span className="adm-muted push">
                        {fb.submittedAt
                          ? new Date(fb.submittedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                          : "Recent"}
                      </span>
                    </div>
                    {fb.takeaways && <p className="adm-quote blue"><b>Takeaways</b>{fb.takeaways}</p>}
                    {fb.comment && <p className="adm-quote">“{fb.comment}”</p>}
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ═════════ MODAL: PROFILE + PASS ═════════ */}
      {modalVolunteer && (() => {
        const v = modalVolunteer;
        const chosen = selectedIds.has(v.applicationId);
        const history = v.past_volunteering_details?.events_breakdown || [];
        return (
          <div className="adm-modal-backdrop" onClick={() => setModalVolunteer(null)}>
            <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
              <header className="adm-modal-head">
                <Avatar person={v} size={46} />
                <div className="adm-modal-title">
                  <h3>{v.studentName}</h3>
                  <p>{[v.maatramId, v.college].filter(Boolean).join(" • ")}</p>
                </div>
                <button className="adm-icon-btn" onClick={() => setModalVolunteer(null)} aria-label="Close">
                  <X size={20} />
                </button>
              </header>

              <div className="adm-modal-body">
                <div className="adm-info-grid">
                  <div><small>Email</small><b>{v.studentEmail || "—"}</b></div>
                  <div><small>Phone</small><b>{v.studentPhone || "—"}</b></div>
                  <div><small>Department</small><b>{v.department || "General"}</b></div>
                  <div><small>Year</small><b>{v.academicYear || "Final Year"}</b></div>
                </div>

                <div className="adm-panel">
                  <div className="adm-panel-row">
                    <b>Repeat tier</b>
                    <span className={`adm-chip tier-${tierOf(v)}`}>{v.groupLabel || `${v.group || "Low"} repeat`}</span>
                  </div>
                  <p>
                    Volunteered <b>{v.repeatCount || 0} time(s)</b> for this event.
                    {v.locationProximity?.text && <span className="adm-loc"> 📍 {v.locationProximity.text}</span>}
                  </p>
                </div>

                <h4 className="adm-sub">Past volunteering ({history.length})</h4>
                <div className="adm-history">
                  <table>
                    <thead>
                      <tr><th>Event</th><th>Hours</th><th>Points</th><th>Date</th></tr>
                    </thead>
                    <tbody>
                      {history.length ? (
                        history.map((ev, i) => (
                          <tr key={i}>
                            <td><b>{ev.event_name}</b></td>
                            <td>{ev.hours}h</td>
                            <td>{ev.points} pts</td>
                            <td className="adm-muted">{ev.date || "Past"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="4" className="adm-td-empty">No prior completed events.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {v.aiRationale && (
                  <p className="adm-why big">
                    <Sparkles size={13} /> {v.aiRationale}
                  </p>
                )}

                <div className="adm-row full">
                  <button
                    className={`adm-btn ${chosen ? "ghost" : "gold"} grow`}
                    onClick={() => {
                      toggleSelect(v.applicationId);
                      setModalVolunteer(null);
                    }}
                  >
                    <Check size={15} /> {chosen ? "Remove from selection" : "Select this volunteer"}
                  </button>
                  <button className="adm-btn ghost" onClick={() => setModalVolunteer(null)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}