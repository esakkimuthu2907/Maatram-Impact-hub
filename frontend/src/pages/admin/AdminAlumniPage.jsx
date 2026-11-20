// frontend/src/pages/admin/AdminAlumniPage.jsx
import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Briefcase,
  Calendar,
  CheckCircle2,
  Edit2,
  Trash2,
  Check,
  X,
  Eye,
  Plus,
  Users,
  Trophy,
  Ban,
  RotateCcw,
  Mail,
  Phone,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { adminAPI } from "../../api/adminAPI";
import authService from "../../services/authService";
import "./AdminAlumniPage.css";

export default function AdminAlumniPage() {
  const { opportunities = [], updateOpportunity, showToast } = useApp();

  const [alumniList, setAlumniList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [sortBy, setSortBy] = useState("newest"); // newest | oldest | name
  const [deptFilter, setDeptFilter] = useState("All");

  // Tab state: "roster" | "assigned"
  const [pageTab, setPageTab] = useState("roster");

  const loadAlumni = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await adminAPI.getUsers();
      const rawUsers = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.users)
          ? res.users
          : Array.isArray(res)
            ? res
            : [];

      const alumniUsers = rawUsers.filter((u) => u && (u.role === "alumni" || u.role === "Alumni"));
      const mapped = alumniUsers.map((u) => ({
        id: u.id || u._id,
        applicationId: u.applicationId || "ALU",
        fullName: u.fullName || u.name || "Alumni Leader",
        email: u.email || "",
        phone: u.phone || "—",
        college: u.college || "Anna University",
        batch: u.batch || u.graduationYear || "2020 - 2024",
        department: u.department || "Engineering",
        company: u.organization || u.company || "Maatram Alumni Network",
        role: u.designation || u.role || "Alumni Leader",
        avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.fullName || "Alumni")}`,
        status: u.status || "active",
        createdAt: u.createdAt || u.created_at || null,
        assignedEvent: u.assignedEvent || null,
        assignedRole: u.assignedRole || null,
        assignedDate: u.assignedDate || null,
        workDescription: u.workDescription || null,
        assignedWorks: u.assignedWorks || [],
      }));
      setAlumniList(mapped);
    } catch (err) {
      console.warn("Could not load alumni:", err);
      setAlumniList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlumni();
    // Keep counts & rows live: quiet refresh every 30s
    const t = setInterval(() => {
      loadAlumni(true);
    }, 30000);
    return () => clearInterval(t);
  }, []);

  // View details modal + status toggle (deactivate / reactivate)
  const [viewAlum, setViewAlum] = useState(null);
  const handleToggleAlumniStatus = async (alum, nextStatus) => {
    try {
      await adminAPI.toggleUserStatus(alum.id, nextStatus);
      showToast(nextStatus === "active" ? `${alum.fullName} reactivated.` : `${alum.fullName} deactivated.`);
      loadAlumni(true);
    } catch (err) {
      showToast(err.message || "Failed to update status", "error");
    }
  };

  // Assign Work Modal
  const [assignModal, setAssignModal] = useState(null); // alumnus object
  const [targetEvent, setTargetEvent] = useState("");
  const [targetRole, setTargetRole] = useState("Event Lead & Supervisor");
  const [targetDesc, setTargetDesc] = useState("");

  // Add Alumni Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAlumni, setNewAlumni] = useState({
    fullName: "",
    email: "",
    phone: "",
    college: "Anna University, Chennai",
    batch: "2020 - 2024",
    department: "Computer Science",
    company: "",
    role: "",
  });

  const filteredAlumni = (alumniList || []).filter((a) => {
    if (!a) return false;
    const matchStatus = selectedStatus === "All" || a.status === selectedStatus;
    const s = (search || "").toLowerCase().trim();
    if (!s) return matchStatus;
    const matchSearch =
      (a.fullName || "").toLowerCase().includes(s) ||
      (a.company || "").toLowerCase().includes(s) ||
      (a.college || "").toLowerCase().includes(s) ||
      (a.role || "").toLowerCase().includes(s) ||
      (a.department || "").toLowerCase().includes(s) ||
      (a.assignedEvent && (a.assignedEvent || "").toLowerCase().includes(s));
    return matchStatus && matchSearch;
  });

  // Department filter + sorting
  const departments = ["All", ...Array.from(new Set((alumniList || []).map((a) => a.department).filter(Boolean)))];
  const visibleAlumni = filteredAlumni
    .filter((a) => deptFilter === "All" || a.department === deptFilter)
    .sort((a, b) => {
      if (sortBy === "name") return (a.fullName || "").localeCompare(b.fullName || "");
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortBy === "oldest" ? ta - tb : tb - ta;
    });

  const initialsOf = (name = "") =>
    name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "AL";
  const handleAvatarError = (e) => {
    e.currentTarget.style.display = "none";
    if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = "flex";
  };

  const assignedAlumniList = (alumniList || []).filter(
    (a) => a && a.assignedEvent && a.assignedEvent !== "Unassigned"
  );

  const handleOpenAssignModal = (alumnus) => {
    setAssignModal(alumnus);
    setTargetEvent(
      alumnus.assignedEvent && alumnus.assignedEvent !== "Unassigned"
        ? alumnus.assignedEvent
        : opportunities[0]?.title || "School Visit – Government Higher Secondary School"
    );
    setTargetRole(alumnus.assignedRole || "Event Lead & Supervisor");
    setTargetDesc(alumnus.workDescription || "");
  };

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    if (!targetEvent) {
      showToast("Please select an event to assign.", "error");
      return;
    }

    const todayDate = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    try {
      await adminAPI.assignWork(assignModal.id, {
        targetEvent,
        targetRole,
        targetDate: todayDate,
        targetDesc,
      });

      // Sync to opportunity if matched
      const matchedOpp = opportunities.find((o) => o.title === targetEvent);
      if (matchedOpp) {
        updateOpportunity(matchedOpp.id || matchedOpp._id, {
          assignedAlumni: `${assignModal.fullName} (${targetRole} @ ${assignModal.company})`,
        });
      }

      showToast(`Work assigned successfully! ${assignModal.fullName} is now assigned to ${targetEvent}.`, "success");
      setAssignModal(null);
      loadAlumni();
    } catch (err) {
      showToast(err.message || "Failed to assign work", "error");
    }
  };

  const handleApproveAlumni = async (alum) => {
    try {
      await adminAPI.approveUser(alum.id);
      showToast(`✅ Alumni ${alum.fullName} (${alum.applicationId}) has been approved!`);
      loadAlumni();
    } catch (err) {
      showToast(err.message || "Failed to approve alumni", "error");
    }
  };

  const handleRejectAlumni = async (alum) => {
    try {
      await adminAPI.toggleUserStatus(alum.id, "inactive");
      showToast(`Alumni ${alum.fullName} marked as Inactive.`);
      loadAlumni();
    } catch (err) {
      showToast(err.message || "Failed to update alumni status", "error");
    }
  };

  const handleRemoveAssignment = async (alumnus) => {
    if (window.confirm(`Remove work assignment for ${alumnus.fullName}?`)) {
      try {
        await adminAPI.assignWork(alumnus.id, {
          targetEvent: "Unassigned",
          targetRole: "Available for Event Assignment",
          targetDate: "None",
          targetDesc: "",
        });
        showToast(`Removed event assignment for ${alumnus.fullName}.`);
        loadAlumni();
      } catch (err) {
        showToast(err.message || "Failed to remove assignment", "error");
      }
    }
  };

  const handleAddAlumniSubmit = async (e) => {
    e.preventDefault();
    if (!newAlumni.fullName || !newAlumni.email || !newAlumni.company) {
      showToast("Please fill in required fields (Name, Email, Company).", "error");
      return;
    }

    try {
      const res = await authService.register({
        fullName: newAlumni.fullName,
        email: newAlumni.email,
        phone: newAlumni.phone || "",
        college: newAlumni.college || "Anna University",
        department: newAlumni.department || "Engineering",
        role: "alumni",
        batch: newAlumni.batch || "2020-2024",
        graduationYear: newAlumni.batch || "2024",
        organization: newAlumni.company,
        designation: newAlumni.role || "Alumni Leader",
        password: "Password@123",
      });

      // If admin created directly, auto-approve
      if (res.user?.id) {
        try {
          await adminAPI.approveUser(res.user.id);
        } catch (_) { }
      }

      showToast(`Alumni account for ${newAlumni.fullName} created successfully!`);
      setShowAddModal(false);
      setNewAlumni({
        fullName: "",
        email: "",
        phone: "",
        college: "Anna University, Chennai",
        batch: "2020 - 2024",
        department: "Computer Science",
        company: "",
        role: "",
      });
      loadAlumni();
    } catch (err) {
      showToast(err.message || "Failed to register alumni", "error");
    }
  };

  const Avatar = ({ alum, size = 44 }) => (
    <span className="alm-avatar-wrap" style={{ width: size, height: size }}>
      <img src={alum.avatar} alt={alum.fullName} onError={handleAvatarError} />
      <span className="alm-avatar-fallback" style={{ display: "none" }}>{initialsOf(alum.fullName)}</span>
    </span>
  );

  return (
    <div className="adm-alumni-page">
      {/* ── HERO BANNER ────────────────────────────────────────── */}
      <div className="alm-hero">
        <div className="alm-hero-text">
          <h1>
            Alumni Leadership &amp; <span>Work Assignment</span>
          </h1>
        </div>
        <button type="button" className="alm-hero-btn" onClick={() => setShowAddModal(true)}>
          <Plus size={18} strokeWidth={2.6} /> Register New Alumni
        </button>
      </div>

      {/* ── VIEW SWITCH: ROSTER / ASSIGNED WORKS ───────────────── */}
      <div className="alm-view-switch">
        <button type="button" className={pageTab === "roster" ? "on" : ""} onClick={() => setPageTab("roster")}>
          <GraduationCap size={15} /> Alumni Roster ({alumniList.length})
        </button>
        <button type="button" className={pageTab === "assigned" ? "on" : ""} onClick={() => setPageTab("assigned")}>
          <Trophy size={15} /> Assigned Works ({assignedAlumniList.length})
        </button>
      </div>

      {pageTab === "assigned" ? (
        /* ── ASSIGNED ALUMNI WORKS & EVENT LEADERSHIP ───────────── */
        <div className="alm-card">
          <div className="alm-card-head">
            <div className="alm-title-box">
              <span className="alm-title-pill">
                <Trophy size={18} /> Assigned Alumni Works &amp; Event Leadership ({assignedAlumniList.length})
              </span>
            </div>
          </div>

          <div className="alm-table-wrap">
            <table className="alm-table compact fixed">
              <colgroup>
                <col style={{ width: "4%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "18%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="num">#</th>
                  <th>Alumni Leader</th>
                  <th>Assigned Event Drive</th>
                  <th>Delegated Role &amp; Scope</th>
                  <th>Assignment Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignedAlumniList.length === 0 ? (
                  <tr><td colSpan={7} className="alm-empty">No alumni currently assigned to event works.</td></tr>
                ) : (
                  assignedAlumniList.map((alum, idx) => (
                    <tr key={alum.id}>
                      <td className="num">{idx + 1}</td>
                      <td>
                        <div className="alm-person">
                          <Avatar alum={alum} size={32} />
                          <div>
                            <div className="alm-strong">{alum.fullName}</div>
                            <div className="alm-sub">{alum.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="alm-event-link">{alum.assignedEvent}</span></td>
                      <td>
                        <div className="alm-strong">{alum.assignedRole}</div>
                        {alum.workDescription && <div className="alm-role">({alum.workDescription})</div>}
                      </td>
                      <td>
                        <span className="alm-date">
                          <Calendar size={14} /> {alum.assignedDate || "Active"}
                        </span>
                      </td>
                      <td><span className="alm-status active"><i /> Active Lead</span></td>
                      <td>
                        <div className="alm-actions">
                          <button type="button" className="alm-reassign" onClick={() => handleOpenAssignModal(alum)}>
                            Reassign
                          </button>
                          <button type="button" className="alm-ico view" title="View details" onClick={() => setViewAlum(alum)}>
                            <Eye size={16} />
                          </button>
                          <button type="button" className="alm-ico del" title="Remove event assignment" onClick={() => handleRemoveAssignment(alum)}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          {/* ── ALUMNI DIRECTORY ─────────────────────────────────── */}
          <div className="alm-dir">
            <div className="alm-dir-head">
              <div className="alm-title-box">
                <span className="alm-title-pill"><GraduationCap size={18} /> Alumni Directory</span>
              </div>
              <div className="alm-dir-badges">
                {[
                  { key: "All", label: "ALL", cls: "yellow", n: alumniList.length },
                  { key: "active", label: "ACTIVE", cls: "green", n: alumniList.filter((a) => a.status === "active").length },
                  { key: "pending_approval", label: "PENDING", cls: "amber", n: alumniList.filter((a) => a.status === "pending_approval").length },
                  { key: "inactive", label: "INACTIVE", cls: "gray", n: alumniList.filter((a) => a.status === "inactive").length },
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    className={`alm-tag ${t.cls} ${selectedStatus === t.key ? "on" : ""}`}
                    onClick={() => setSelectedStatus(t.key)}
                    title={`Show ${t.label.toLowerCase()} alumni`}
                  >
                    {t.label} {t.n}
                  </button>
                ))}
              </div>
            </div>

            <div className="alm-dir-filters">
              <div className="alm-f">
                <label>STATUS</label>
                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                  <option value="All">All Alumni</option>
                  <option value="active">Active</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="alm-f">
                <label>DEPARTMENT</label>
                <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
                  {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="alm-f">
                <label>SORT</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name (A–Z)</option>
                </select>
              </div>
              <div className="alm-f grow">
                <label>SEARCH</label>
                <input
                  type="text"
                  placeholder="Name, company, college, department..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="alm-table-wrap">
              <table className="alm-table compact fixed">
                <colgroup>
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "16%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>ALUMNI ID</th>
                    <th>NAME</th>
                    <th>COLLEGE</th>
                    <th>BATCH</th>
                    <th>DEPT</th>
                    <th>COMPANY &amp; DESIGNATION</th>
                    <th>STATUS</th>
                    <th>ASSIGNED</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={9} className="alm-empty">Loading alumni...</td></tr>
                  ) : visibleAlumni.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="alm-empty">
                        <div className="alm-empty-box">
                          <Users size={28} />
                          <strong>No alumni records found</strong>
                          <button type="button" className="alm-empty-btn" onClick={() => setShowAddModal(true)}>
                            <Plus size={15} /> Register New Alumni
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    visibleAlumni.map((alum) => (
                      <tr key={alum.id}>
                        <td className="mono">{alum.applicationId}</td>
                        <td>
                          <button type="button" className="alm-name-link" onClick={() => handleOpenAssignModal(alum)}>
                            {alum.fullName}
                          </button>
                        </td>
                        <td>{alum.college}</td>
                        <td>{alum.batch}</td>
                        <td>{alum.department}</td>
                        <td>
                          <div className="alm-strong">{alum.company}</div>
                          <div className="alm-sub">{alum.role}</div>
                        </td>
                        <td>
                          <span className={`alm-mini ${alum.status === "active" ? "green" : alum.status === "pending_approval" ? "amber" : "gray"}`}>
                            {alum.status === "pending_approval" ? "PENDING" : alum.status === "inactive" ? "INACTIVE" : "ACTIVE"}
                          </span>
                        </td>
                        <td>
                          {alum.assignedEvent && alum.assignedEvent !== "Unassigned" ? (
                            <span className="alm-mini yellow">ASSIGNED</span>
                          ) : (
                            <span className="alm-dash">—</span>
                          )}
                        </td>
                        <td>
                          <div className="alm-actions">
                            {alum.status === "pending_approval" && (
                              <>
                                <button type="button" className="alm-sq ok" title="Approve" onClick={() => handleApproveAlumni(alum)}><Check size={14} /></button>
                                <button type="button" className="alm-sq warn" title="Reject" onClick={() => handleRejectAlumni(alum)}><X size={14} /></button>
                              </>
                            )}
                            <button type="button" className="alm-sq view" title="View details" onClick={() => setViewAlum(alum)}><Eye size={14} /></button>
                            <button type="button" className="alm-sq edit" title="Edit / assign work" onClick={() => handleOpenAssignModal(alum)}><Edit2 size={13} /></button>
                            {alum.status === "active" && (
                              <button type="button" className="alm-sq warn" title="Deactivate" onClick={() => handleToggleAlumniStatus(alum, "inactive")}><Ban size={13} /></button>
                            )}
                            {alum.status === "inactive" && (
                              <button type="button" className="alm-sq ok" title="Reactivate" onClick={() => handleToggleAlumniStatus(alum, "active")}><RotateCcw size={13} /></button>
                            )}
                            <button
                              type="button"
                              className="alm-sq del"
                              title="Remove alumni"
                              onClick={() => {
                                if (window.confirm(`Remove ${alum.fullName} from active alumni list?`)) {
                                  setAlumniList(alumniList.filter((a) => a.id !== alum.id));
                                  showToast(`Alumni ${alum.fullName} removed.`);
                                }
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── VIEW ALUMNI DETAILS MODAL ──────────────────────────── */}
      {viewAlum && (
        <div className="modal-backdrop" onClick={() => setViewAlum(null)}>
          <div className="alm-view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="alm-view-head">
              <Avatar alum={viewAlum} size={48} />
              <div>
                <h3>{viewAlum.fullName}</h3>
                <p>{viewAlum.role} &bull; {viewAlum.company}</p>
              </div>
              <span className={`alm-mini ${viewAlum.status === "active" ? "green" : viewAlum.status === "pending_approval" ? "amber" : "gray"}`}>
                {viewAlum.status === "pending_approval" ? "PENDING" : viewAlum.status === "inactive" ? "INACTIVE" : "ACTIVE"}
              </span>
              <button type="button" className="alm-sq del" onClick={() => setViewAlum(null)} title="Close"><X size={14} /></button>
            </div>
            <div className="alm-view-grid">
              <div><label>ALUMNI ID</label><b>{viewAlum.applicationId}</b></div>
              <div><label>BATCH</label><b>{viewAlum.batch}</b></div>
              <div><label><Mail size={11} /> EMAIL</label><b>{viewAlum.email || "—"}</b></div>
              <div><label><Phone size={11} /> PHONE</label><b>{viewAlum.phone || "—"}</b></div>
              <div><label>COLLEGE</label><b>{viewAlum.college}</b></div>
              <div><label>DEPARTMENT</label><b>{viewAlum.department}</b></div>
              <div className="wide">
                <label>CURRENT ASSIGNMENT</label>
                <b>
                  {viewAlum.assignedEvent && viewAlum.assignedEvent !== "Unassigned"
                    ? `${viewAlum.assignedEvent} — ${viewAlum.assignedRole || ""}`
                    : "Not assigned to any event yet"}
                </b>
              </div>
            </div>
            <div className="alm-view-foot">
              <button type="button" className="alm-btn-soft" onClick={() => setViewAlum(null)}>Close</button>
              <button
                type="button"
                className="alm-btn-yellow"
                onClick={() => { const a = viewAlum; setViewAlum(null); handleOpenAssignModal(a); }}
              >
                <Briefcase size={14} /> Assign Work
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ASSIGN WORK MODAL ──────────────────────────────────── */}
      {assignModal && (
        <div className="modal-backdrop" onClick={() => setAssignModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img
                  src={assignModal.avatar}
                  alt={assignModal.fullName}
                  style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }}
                />
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>
                    Assign Volunteering Work to {assignModal.fullName}
                  </h3>
                  <span style={{ fontSize: 12.5, color: "#64748B" }}>
                    {assignModal.role} • {assignModal.company}
                  </span>
                </div>
              </div>
              <button type="button" className="close-btn" onClick={() => setAssignModal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} style={{ padding: "20px 24px" }}>
              <div className="form-group-full" style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 6 }}>
                  Select Volunteering Event Drive *
                </label>
                <select
                  value={targetEvent}
                  onChange={(e) => setTargetEvent(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1.5px solid #CBD5E1", fontSize: 14 }}
                  required
                >
                  <option value="School Visit – Government Higher Secondary School">
                    School Visit – Government Higher Secondary School (Chennai)
                  </option>
                  <option value="Tree Plantation Drive – Semmozhi Poonga Expansion">
                    Tree Plantation Drive – Semmozhi Poonga Expansion (Chennai)
                  </option>
                  <option value="Karpom Karpipom – Peer Python & Web Basics Workshop">
                    Karpom Karpipom – Peer Python &amp; Web Basics Workshop (Online)
                  </option>
                  <option value="Career Guidance & Mentorship Bootcamp">
                    Career Guidance &amp; Mentorship Bootcamp (Statewide)
                  </option>
                </select>
              </div>

              <div className="form-group-full" style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 6 }}>
                  Alumni Work Title / Responsibility *
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1.5px solid #CBD5E1", fontSize: 14 }}
                >
                  <option value="Lead Technical Instructor & Code Mentor">Lead Technical Instructor &amp; Code Mentor</option>
                  <option value="Lead Career Counselor & Motivational Speaker">Lead Career Counselor &amp; Motivational Speaker</option>
                  <option value="Field Logistics & Green Stewardship Lead">Field Logistics &amp; Green Stewardship Lead</option>
                  <option value="Event Supervisor & Student Mentor">Event Supervisor &amp; Student Mentor</option>
                </select>
              </div>

              <div className="form-group-full" style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 6 }}>
                  Detailed Task Scope &amp; Instructions
                </label>
                <textarea
                  rows="3"
                  placeholder="e.g. Lead the technical coding breakout rooms, guide students through syntax exercises, and deliver the opening keynote..."
                  value={targetDesc}
                  onChange={(e) => setTargetDesc(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1.5px solid #CBD5E1", fontSize: 13.5 }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setAssignModal(null)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: "#FACC15", color: "#0F172A", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}
                >
                  <CheckCircle2 size={16} /> Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── REGISTER NEW ALUMNI MODAL ──────────────────────────── */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>
                Register New Maatram Alumnus
              </h3>
              <button type="button" className="close-btn" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddAlumniSubmit} style={{ padding: "20px 24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Vignesh K"
                    value={newAlumni.fullName}
                    onChange={(e) => setNewAlumni({ ...newAlumni, fullName: e.target.value })}
                    required
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #CBD5E1" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>Official Email *</label>
                  <input
                    type="email"
                    placeholder="e.g. vignesh@alumni.maatram.org"
                    value={newAlumni.email}
                    onChange={(e) => setNewAlumni({ ...newAlumni, email: e.target.value })}
                    required
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #CBD5E1" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>Current Company *</label>
                  <input
                    type="text"
                    placeholder="e.g. Microsoft / Zoho"
                    value={newAlumni.company}
                    onChange={(e) => setNewAlumni({ ...newAlumni, company: e.target.value })}
                    required
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #CBD5E1" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>Job Title / Role *</label>
                  <input
                    type="text"
                    placeholder="e.g. Software Engineer"
                    value={newAlumni.role}
                    onChange={(e) => setNewAlumni({ ...newAlumni, role: e.target.value })}
                    required
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #CBD5E1" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>Alma Mater College</label>
                  <input
                    type="text"
                    value={newAlumni.college}
                    onChange={(e) => setNewAlumni({ ...newAlumni, college: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #CBD5E1" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>Graduation Batch</label>
                  <input
                    type="text"
                    value={newAlumni.batch}
                    onChange={(e) => setNewAlumni({ ...newAlumni, batch: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #CBD5E1" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: "#FACC15", color: "#0F172A", fontWeight: 700 }}
                >
                  Save &amp; Register Alumnus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}