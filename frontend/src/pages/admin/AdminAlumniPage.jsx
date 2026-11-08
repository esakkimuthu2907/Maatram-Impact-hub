// frontend/src/pages/admin/AdminAlumniPage.jsx
import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Briefcase,
  Building2,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  PlusCircle,
  Edit2,
  Trash2,
  UserCheck,
  Sparkles,
  ShieldCheck,
  X,
  Send,
  ExternalLink,
  Award,
  Layers,
  ChevronRight,
  Eye,
  Plus,
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

  const loadAlumni = async () => {
    try {
      setLoading(true);
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
  }, []);

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

  const assignedAlumniList = (alumniList || []).filter(
    (a) => a && a.assignedEvent && a.assignedEvent !== "Unassigned"
  );

  const handleOpenAssignModal = (alumnus) => {
    setAssignModal(alumnus);
    setTargetEvent(alumnus.assignedEvent && alumnus.assignedEvent !== "Unassigned" ? alumnus.assignedEvent : (opportunities[0]?.title || "School Visit – Government Higher Secondary School"));
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

      const newId = res.applicationId || res.studentId || res.user?.id;
      // If admin created directly, auto-approve
      if (res.user?.id) {
        try {
          await adminAPI.approveUser(res.user.id);
        } catch (_) {}
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

  return (
    <div className="adm-alumni-page">
      {/* ── HERO BANNER ────────────────────────────────────────── */}
      <div className="adm-alumni-hero">
        <div className="adm-alumni-hero-content">
          <div className="adm-alumni-badge">
            <ShieldCheck size={14} /> Administrator Control Center
          </div>
          <h1>Alumni Leadership &amp; Work Assignment</h1>
          <p>
            Review registered Maatram alumni scholar accounts and assign them to lead on-ground student drives, technical clinics, and school visits.
          </p>
        </div>

        <button
          type="button"
          className="adm-add-alumni-btn"
          onClick={() => setShowAddModal(true)}
        >
          <PlusCircle size={18} /> Register New Alumni
        </button>
      </div>

      {/* ── TOOLBAR & STATS SUMMARY ────────────────────────────── */}
      <div className="adm-alumni-toolbar">
        <div className="adm-alumni-search-box">
          <Search size={18} color="#64748B" />
          <input
            type="text"
            placeholder="Search alumni by name, company, college, or assigned event..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="adm-alumni-filter-tabs">
          {["All", "active"].map((st) => (
            <button
              key={st}
              type="button"
              className={`adm-filter-pill ${selectedStatus === st ? "active" : ""}`}
              onClick={() => setSelectedStatus(st)}
            >
              {st === "All" ? `All Registered Alumni (${alumniList.length})` : "Active Scholars"}
            </button>
          ))}
        </div>
      </div>

      {/* ── ALUMNI REGISTERED DETAILS TABLE (MATCHING REGISTERED VOLUNTEERS TABLE) ── */}
      <div className="modern-table-card">
        {/* Table Top Header Bar with Search and Add Alumni Button */}
        <div className="modern-table-header-bar">
          <div className="modern-table-title">
            <GraduationCap size={22} />
            <span>Registered Alumni Volunteers</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div className="modern-table-search-box">
              <Search size={16} />
              <input
                type="text"
                className="modern-table-search-input"
                placeholder="Search alumni..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="modern-btn-add"
              onClick={() => setShowAddModal(true)}
            >
              <PlusCircle size={16} /> Add Alumni
            </button>
          </div>
        </div>

        {/* The Clean Structured Table matching Registered Volunteers */}
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 45 }}>#</th>
                <th>NAME</th>
                <th>COLLEGE</th>
                <th>BATCH</th>
                <th>DEPT</th>
                <th>COMPANY &amp; DESIGNATION</th>
                <th>ASSIGNMENT STATUS</th>
                <th>STATUS</th>
                <th style={{ textAlign: "right", minWidth: 160 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlumni.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: "40px 20px", textAlign: "center", color: "#64748B" }}>
                    No alumni records matched the search query.
                  </td>
                </tr>
              ) : (
                filteredAlumni.map((alum, idx) => (
                  <tr key={alum.id}>
                    {/* # Index */}
                    <td style={{ fontWeight: 700, color: "#64748B" }}>{idx + 1}</td>

                    {/* Name */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <img
                          src={alum.avatar}
                          alt={alum.fullName}
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "1.5px solid #CBD5E1",
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, color: "#0F172A", fontSize: 13.5 }}>
                            {alum.fullName}
                          </div>
                          <div style={{ fontSize: 11, color: "#64748B" }}>
                            {alum.applicationId} • {alum.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* College */}
                    <td style={{ color: "#334155" }}>
                      {alum.college}
                    </td>

                    {/* Batch */}
                    <td style={{ color: "#475569" }}>
                      {alum.batch}
                    </td>

                    {/* Dept */}
                    <td style={{ fontWeight: 600, color: "#1E293B" }}>
                      {alum.department}
                    </td>

                    {/* Company & Role */}
                    <td style={{ color: "#334155" }}>
                      <strong style={{ color: "#0F172A", display: "block" }}>{alum.role}</strong>
                      <span style={{ fontSize: 12, color: "#2563EB", fontWeight: 600 }}>
                        {alum.company}
                      </span>
                    </td>

                    {/* Assignment Status (Clean Badge, detailed assigned work is shown in the dedicated table below) */}
                    <td>
                      {alum.assignedEvent && alum.assignedEvent !== "Unassigned" ? (
                        <span
                          style={{
                            background: "#DCFCE7",
                            color: "#15803D",
                            padding: "4px 10px",
                            borderRadius: 12,
                            fontSize: 11.5,
                            fontWeight: 700,
                            border: "1px solid #86EFAC",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <CheckCircle2 size={12} /> Assigned
                        </span>
                      ) : (
                        <span
                          style={{
                            background: "#F1F5F9",
                            color: "#64748B",
                            padding: "4px 10px",
                            borderRadius: 12,
                            fontSize: 11.5,
                            fontWeight: 700,
                            border: "1px solid #E2E8F0",
                          }}
                        >
                          Unassigned (Available)
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td>
                      <span className="status-badge-active">
                        Active
                      </span>
                    </td>

                    {/* Actions: Assign Work Button + View + Edit + Delete */}
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <button
                          type="button"
                          className="table-action-btn"
                          onClick={() => handleOpenAssignModal(alum)}
                          style={{
                            width: "auto",
                            padding: "0 10px",
                            height: 32,
                            background: "#EFF6FF",
                            color: "#2563EB",
                            borderColor: "#BFDBFE",
                            fontSize: 12,
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                          }}
                          title="Assign or reassign volunteering drive"
                        >
                          <Briefcase size={13} />
                          <span>{alum.assignedEvent && alum.assignedEvent !== "Unassigned" ? "Reassign" : "Assign Work"}</span>
                        </button>

                        <button
                          type="button"
                          className="table-action-btn table-action-view"
                          onClick={() => handleOpenAssignModal(alum)}
                          title="View Alumni Profile"
                        >
                          <Eye size={14} />
                        </button>

                        <button
                          type="button"
                          className="table-action-btn table-action-edit"
                          onClick={() => handleOpenAssignModal(alum)}
                          title="Edit Details"
                        >
                          <Edit2 size={13} />
                        </button>

                        <button
                          type="button"
                          className="table-action-btn table-action-delete"
                          onClick={() => {
                            if (window.confirm(`Remove ${alum.fullName} from active alumni list?`)) {
                              setAlumniList(alumniList.filter((a) => a.id !== alum.id));
                              showToast(`Alumni ${alum.fullName} removed.`);
                            }
                          }}
                          title="Delete Alumni"
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

        {/* Table Footer with Showing info and Pagination (Matching Image) */}
        <div className="modern-table-pagination">
          <span className="modern-table-showing">
            Showing 1–{filteredAlumni.length} of {filteredAlumni.length} alumni
          </span>
          <div className="modern-pagination-pages">
            <button type="button" className="modern-page-btn active">1</button>
          </div>
        </div>
      </div>

      {/* ── NEW SECTION: ASSIGNED ALUMNI WORKS & EVENT LEADERSHIP TABLE ── */}
      <div className="modern-table-card" style={{ marginTop: 28 }}>
        <div className="modern-table-header-bar" style={{ background: "linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)" }}>
          <div className="modern-table-title">
            <Briefcase size={22} color="#D97706" />
            <span>Assigned Alumni Works &amp; Event Leadership ({assignedAlumniList.length})</span>
          </div>
          <span style={{ fontSize: 12.5, color: "#64748B", fontWeight: 600 }}>
            Real-time administrative event delegations &amp; mentor leadership
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 45 }}>#</th>
                <th>ALUMNI LEADER</th>
                <th>ASSIGNED EVENT DRIVE</th>
                <th>DELEGATED ROLE &amp; SCOPE</th>
                <th>ASSIGNMENT DATE</th>
                <th>STATUS</th>
                <th style={{ textAlign: "right", minWidth: 150 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {assignedAlumniList.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "40px 20px", textAlign: "center", color: "#64748B" }}>
                    No alumni currently assigned to event works. Click "Assign Work" above to assign an alumnus to lead an event.
                  </td>
                </tr>
              ) : (
                assignedAlumniList.map((alum, idx) => (
                  <tr key={alum.id}>
                    <td style={{ fontWeight: 700, color: "#64748B" }}>{idx + 1}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <img
                          src={alum.avatar}
                          alt={alum.fullName}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "1.5px solid #CBD5E1",
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, color: "#0F172A", fontSize: 13.5 }}>
                            {alum.fullName}
                          </div>
                          <div style={{ fontSize: 11, color: "#2563EB", fontWeight: 600 }}>
                            {alum.role} • {alum.company}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: "#D97706", fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}>
                        <Sparkles size={13} color="#D97706" /> {alum.assignedEvent}
                      </strong>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 300 }}>
                        <strong style={{ fontSize: 12.5, color: "#1E293B" }}>{alum.assignedRole}</strong>
                        <span style={{ fontSize: 11.5, color: "#64748B", lineHeight: 1.3 }}>{alum.workDescription}</span>
                      </div>
                    </td>
                    <td style={{ color: "#475569", fontSize: 12.5 }}>
                      <Calendar size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                      {alum.assignedDate || "Active"}
                    </td>
                    <td>
                      <span className="status-badge-active" style={{ background: "#DCFCE7", color: "#15803D" }}>
                        Active Lead
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: 6 }}>
                        <button
                          type="button"
                          className="table-action-btn"
                          onClick={() => handleOpenAssignModal(alum)}
                          style={{
                            width: "auto",
                            padding: "0 10px",
                            height: 32,
                            background: "#EFF6FF",
                            color: "#2563EB",
                            borderColor: "#BFDBFE",
                            fontSize: 12,
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                          title="Reassign to another event"
                        >
                          <Edit2 size={13} /> Reassign
                        </button>
                        <button
                          type="button"
                          className="table-action-btn table-action-delete"
                          onClick={() => handleRemoveAssignment(alum)}
                          title="Remove event assignment"
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
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
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
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setAssignModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: "#2563EB", color: "#FFF", display: "flex", alignItems: "center", gap: 8 }}
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
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
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
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: "#2563EB", color: "#FFF" }}
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
