// frontend/src/pages/admin/AdminUsersPage.jsx
// Complete Redesign following media_733ff2e2.png and media_71dea7d8.jpg

import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Trophy,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Plus,
  ArrowRight,
  Settings,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Trash2,
  Sliders,
  Pause,
  Play,
} from "lucide-react";

import { useApp } from "../../context/AppContext";
import { adminAPI } from "../../api/adminAPI";
import "./AdminUsersPage.css";
import "./AdminEventsPage.css";

export default function AdminUsersPage() {
  const { user, showToast } = useApp();
  const navigate = useNavigate();

  const [usersList, setUsersList] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatusFilter, setActiveStatusFilter] = useState("all"); // "all" | "active" | "inactive" | "pending"
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("newest"); // newest | name | points | hours
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [modalBusy, setModalBusy] = useState(false);
  const [statusConfirmModal, setStatusConfirmModal] = useState(null); // { user, nextStatus }
  const [showAddVolunteerModal, setShowAddVolunteerModal] = useState(false);
  const [addForm, setAddForm] = useState({
    fullName: "",
    email: "",
    college: "Maatram Institute of Technology",
    zone: "Zone 1",
    batch: "2022-2026",
    department: "Computer Science & Engineering",
    phone: "",
    regNumber: "",
  });

  // Points Modal State
  const [pointsModalUser, setPointsModalUser] = useState(null);
  const [pointsForm, setPointsForm] = useState({
    type: "CREDIT",
    points: 25,
    reason: "",
    adminRemarks: "",
  });

  // Grading System Modal State
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [gradingLevels, setGradingLevels] = useState([]);

  // Fetch users from backend API
  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getUsers();
      const raw = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.users)
          ? res.users
          : Array.isArray(res)
            ? res
            : [];

      // Filter student/volunteer users and deduplicate by _id
      const unique = [...new Map(raw.map((u) => [u._id || u.id || u.email, u])).values()];
      const students = unique
        .filter((u) => u && (u.role === "student" || u.role === "volunteer" || !u.role))
        .map((u) => ({
          ...u,
          zone: u.zone || "Zone 1",
          batch: u.batch || "2022-2026",
          department: u.department || "CSE",
          college: u.college || "Maatram Institute of Technology",
          rollNumber: u.regNumber || u.rollNumber || u.applicationId || "MA2022001",
          rating: u.rating !== undefined ? u.rating : 0,
          points: Number(u.points) || 0,
          totalHours: Number(u.totalHours) || 0,
          eventsJoined: Number(u.eventsJoined) || Number(u.completedEventsCount) || 0,
        }));

      setUsersList(students);
      setPendingUsers(students.filter((u) => u.status === "pending_approval"));
    } catch (err) {
      console.warn("Could not load users:", err.message);
      setUsersList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Compute 5 Summary Metrics from real data
  const summaryMetrics = useMemo(() => {
    const totalStudents = usersList.length;
    const activeVolunteers = usersList.filter((u) => u.status === "active").length;
    const inactiveVolunteers = usersList.filter(
      (u) => u.status === "inactive" || u.status === "pending_approval"
    ).length;
    const totalHours = usersList.reduce((acc, u) => acc + (Number(u.totalHours) || 0), 0);
    const totalPoints = usersList.reduce((acc, u) => acc + (Number(u.points) || 0), 0);

    return {
      totalStudents,
      activeVolunteers,
      inactiveVolunteers,
      totalHours,
      totalPoints,
    };
  }, [usersList]);

  // Compute activity label helper
  const getActivityLabel = (userObj) => {
    if (userObj.activityText) return userObj.activityText;
    const lastTime = userObj.lastActiveAt || userObj.updatedAt || userObj.createdAt;
    if (!lastTime) return "Active today";
    const d = new Date(lastTime);
    const now = new Date();
    const diffHours = Math.floor((now - d) / (1000 * 60 * 60));
    if (diffHours < 24) return "Active today";
    if (diffHours < 48) return "Active yesterday";
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays <= 7) return `Active ${diffDays} days ago`;
    return "Active recently";
  };

  // Filtered & Searched student list
  const filteredStudents = useMemo(() => {
    let result = [...usersList];

    // Status filter pill
    if (activeStatusFilter === "active") {
      result = result.filter((u) => u.status === "active");
    } else if (activeStatusFilter === "inactive") {
      result = result.filter((u) => u.status === "inactive" || u.status === "pending_approval");
    } else if (activeStatusFilter === "pending") {
      result = result.filter((u) => u.status === "pending_approval");
    }

    // Search query: name, roll no, college, department
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (u) =>
          (u.fullName || "").toLowerCase().includes(q) ||
          (u.rollNumber || "").toLowerCase().includes(q) ||
          (u.applicationId || "").toLowerCase().includes(q) ||
          (u.college || "").toLowerCase().includes(q) ||
          (u.department || "").toLowerCase().includes(q) ||
          (u.zone || "").toLowerCase().includes(q) ||
          (u.batch || "").toLowerCase().includes(q)
      );
    }

    if (deptFilter !== "All") {
      result = result.filter((u) => u.department === deptFilter);
    }

    result.sort((a, b) => {
      if (sortOrder === "name") return (a.fullName || "").localeCompare(b.fullName || "");
      if (sortOrder === "points") return (b.points || 0) - (a.points || 0);
      if (sortOrder === "hours") return (b.totalHours || 0) - (a.totalHours || 0);
      return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
    });

    return result;
  }, [usersList, activeStatusFilter, searchQuery, deptFilter, sortOrder]);

  const departmentOptions = useMemo(
    () => ["All", ...Array.from(new Set(usersList.map((u) => u.department).filter(Boolean)))],
    [usersList]
  );

  // Paginated list
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  // Handle status toggle (Activate / Deactivate)
  const confirmToggleStatus = async () => {
    if (!statusConfirmModal) return;
    const { user: targetUser, nextStatus } = statusConfirmModal;
    try {
      const res = await adminAPI.toggleUserStatus(targetUser._id || targetUser.id, nextStatus);
      showToast(res.message || `Account marked as ${nextStatus}!`);
      loadUsers();
      setStatusConfirmModal(null);
    } catch (err) {
      showToast(err.message || "Failed to update account status", "error");
    }
  };

  const deleteCode = deleteTarget
    ? String(deleteTarget.applicationId || deleteTarget.rollNumber || deleteTarget.regNumber || "MAA001").trim()
    : "";

  const openProfile = (std) => navigate(`/admin/users/${std._id || std.id}`);

  // Handle permanent delete (requires typing the roll number)
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setModalBusy(true);
      const targetId = deleteTarget._id || deleteTarget.id;
      const res = await adminAPI.deleteUser(targetId);
      showToast(res?.message || `${deleteTarget.fullName}'s account has been deleted. Historical records safely archived.`);
      setUsersList((prev) => prev.filter((u) => (u._id || u.id) !== targetId));
      setDeleteTarget(null);
      setDeleteConfirmText("");
    } catch (err) {
      showToast(err.message || "Failed to delete account", "error");
    } finally {
      setModalBusy(false);
    }
  };

  // Handle Approve Pending User
  const handleApprove = async (pu) => {
    try {
      const res = await adminAPI.approveUser(pu._id || pu.id);
      showToast(res.message || `${pu.fullName}'s account approved!`);
      loadUsers();
    } catch (err) {
      showToast(err.message || "Failed to approve user", "error");
    }
  };

  return (
    <div className="admin-users-page-container">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* A. 5 SUMMARY CARDS (Exact match to media_733ff2e2.png)        */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="usr-summary-cards-row">
        {/* Card 1: Total Students */}
        <div
          className="usr-summary-card theme-total"
          onClick={() => {
            setActiveStatusFilter("all");
            setCurrentPage(1);
          }}
        >
          <div className="usr-card-left">
            <div className="usr-card-icon-wrap">
              <Users size={24} />
            </div>
            <div className="usr-card-content">
              <span className="usr-card-title">Total Students</span>
              <span className="usr-card-number">{summaryMetrics.totalStudents}</span>
            </div>
          </div>
          <ArrowRight size={18} className="usr-card-arrow" />
        </div>

        {/* Card 2: Active Volunteers */}
        <div
          className="usr-summary-card theme-active"
          onClick={() => {
            setActiveStatusFilter("active");
            setCurrentPage(1);
          }}
        >
          <div className="usr-card-left">
            <div className="usr-card-icon-wrap">
              <UserCheck size={24} />
            </div>
            <div className="usr-card-content">
              <span className="usr-card-title">Active Volunteers</span>
              <span className="usr-card-number">{summaryMetrics.activeVolunteers}</span>
            </div>
          </div>
          <ArrowRight size={18} className="usr-card-arrow" />
        </div>

        {/* Card 3: Inactive Volunteers */}
        <div
          className="usr-summary-card theme-inactive"
          onClick={() => {
            setActiveStatusFilter("inactive");
            setCurrentPage(1);
          }}
        >
          <div className="usr-card-left">
            <div className="usr-card-icon-wrap">
              <UserX size={24} />
            </div>
            <div className="usr-card-content">
              <span className="usr-card-title">Inactive Volunteers</span>
              <span className="usr-card-number">{summaryMetrics.inactiveVolunteers}</span>
            </div>
          </div>
          <ArrowRight size={18} className="usr-card-arrow" />
        </div>

        {/* Card 4: Total Hours */}
        <div className="usr-summary-card theme-hours">
          <div className="usr-card-left">
            <div className="usr-card-icon-wrap">
              <Clock size={24} />
            </div>
            <div className="usr-card-content">
              <span className="usr-card-title">Total Hours</span>
              <span className="usr-card-number">{summaryMetrics.totalHours}h</span>
            </div>
          </div>
          <ArrowRight size={18} className="usr-card-arrow" />
        </div>

        {/* Card 5: Community Points */}
        <div className="usr-summary-card theme-points">
          <div className="usr-card-left">
            <div className="usr-card-icon-wrap">
              <Trophy size={24} />
            </div>
            <div className="usr-card-content">
              <span className="usr-card-title">Community Points</span>
              <span className="usr-card-number">{summaryMetrics.totalPoints.toLocaleString()}</span>
            </div>
          </div>
          <ArrowRight size={18} className="usr-card-arrow" />
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* C. STUDENT TABLE (Exact match to media_71dea7d8.jpg)          */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="usr-table-card">
        {/* Directory header */}
        <div className="usr-dir-head">
          <h2>Student Directory</h2>
          <div className="usr-dir-badges">
            <button
              type="button"
              className={`usr-dir-badge green ${activeStatusFilter === "active" ? "selected" : ""}`}
              aria-pressed={activeStatusFilter === "active"}
              title="Show active students"
              onClick={() => { setActiveStatusFilter(activeStatusFilter === "active" ? "all" : "active"); setCurrentPage(1); }}
            >
              Active {summaryMetrics.activeVolunteers}
            </button>
            <button
              type="button"
              className={`usr-dir-badge red ${activeStatusFilter === "inactive" ? "selected" : ""}`}
              aria-pressed={activeStatusFilter === "inactive"}
              title="Show inactive students"
              onClick={() => { setActiveStatusFilter(activeStatusFilter === "inactive" ? "all" : "inactive"); setCurrentPage(1); }}
            >
              Inactive {summaryMetrics.inactiveVolunteers}
            </button>
            <button type="button" className="usr-btn-action" onClick={loadUsers} title="Refresh student list">
              <RefreshCw size={14} className={loading ? "spin" : ""} /> <span className="usr-btn-label">Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="usr-filter-bar">
          <label className="usr-field">
            <span>Status</span>
            <select
              value={activeStatusFilter}
              onChange={(e) => { setActiveStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">All Students</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending Approval</option>
            </select>
          </label>
          <label className="usr-field">
            <span>Department</span>
            <select
              value={deptFilter}
              onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1); }}
            >
              {departmentOptions.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className="usr-field">
            <span>Sort</span>
            <select value={sortOrder} onChange={(e) => { setSortOrder(e.target.value); setCurrentPage(1); }}>
              <option value="newest">Newest First</option>
              <option value="name">Name A–Z</option>
              <option value="points">Most Points</option>
              <option value="hours">Most Hours</option>
            </select>
          </label>
          <label className="usr-field usr-field-search">
            <span>Search</span>
            <input
              type="text"
              placeholder="Name, roll no, college, department..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </label>
        </div>

        <div className="usr-table-scroll">
          <table className="usr-data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll No</th>
                <th>College</th>
                <th>Zone</th>
                <th>Department</th>
                <th>Status</th>
                <th>Events</th>
                <th>Hours</th>
                <th>Points</th>
                <th>Activity</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: "center", padding: "40px 20px", color: "#64748B" }}>
                    Loading student records...
                  </td>
                </tr>
              ) : paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: "center", padding: "40px 20px", color: "#64748B" }}>
                    No students match the selected filter.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((std) => {
                  const initials = (std.fullName || "Student")
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase();

                  const isActive = std.status === "active";
                  const activityText = getActivityLabel(std);

                  return (
                    <tr
                      key={std._id || std.id || std.applicationId}
                      onClick={() => openProfile(std)}
                    >
                      {/* 1. Student (initials avatar + name + batch) */}
                      <td>
                        <div className="usr-student-col">
                          <div className="usr-avatar-badge">{initials}</div>
                          <div className="usr-name-batch">
                            <span className="usr-student-name">{std.fullName}</span>
                            <span className="usr-student-batch">{std.batch || "2022-2026"}</span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Roll No */}
                      <td>
                        <span className="usr-roll-no">{std.rollNumber}</span>
                      </td>

                      {/* 3. College */}
                      <td>
                        <span className="usr-college-name" title={std.college}>
                          {std.college}
                        </span>
                      </td>

                      {/* 4. Zone */}
                      <td>
                        <span className="usr-zone-pill">{std.zone || "Zone 1"}</span>
                      </td>

                      {/* 5. Department */}
                      <td>
                        <span className="usr-dept-text">{std.department || "CSE"}</span>
                      </td>

                      {/* 6. Status */}
                      <td>
                        <span className={`usr-status-cell ${isActive ? "active" : "inactive"}`}>
                          <span className="usr-status-dot" />
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* 7. Events */}
                      <td>
                        <strong>{std.eventsJoined}</strong>
                      </td>

                      {/* 8. Hours */}
                      <td>
                        <span>{std.totalHours}h</span>
                      </td>

                      {/* 9. Points */}
                      <td>
                        <span className="usr-points-val">
                          <Trophy size={13} color="#EAB308" /> {std.points.toLocaleString()}
                        </span>
                      </td>

                      {/* 10. Activity */}
                      <td>
                        <span className="usr-activity-pill">{activityText}</span>
                      </td>

                      {/* 11. Actions */}
                      <td style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                        <div className="usr-row-actions">
                          <button
                            type="button"
                            className="usr-btn-action"
                            title="Open full student profile"
                            onClick={() => openProfile(std)}
                          >
                            <Eye size={13} /> <span className="usr-btn-label">View</span>
                          </button>

                          {std.status === "pending_approval" ? (
                            <button
                              type="button"
                              className="usr-btn-action toggle-inactive"
                              title="Approve registration"
                              onClick={() => handleApprove(std)}
                            >
                              <CheckCircle2 size={13} /> <span className="usr-btn-label">Approve</span>
                            </button>
                          ) : isActive ? (
                            <button
                              type="button"
                              className="usr-btn-action toggle-active"
                              title="Deactivate student account"
                              onClick={() =>
                                setStatusConfirmModal({
                                  user: std,
                                  nextStatus: "inactive",
                                })
                              }
                            >
                              <UserX size={13} /> <span className="usr-btn-label">Deactivate</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="usr-btn-action toggle-inactive"
                              title="Activate student account"
                              onClick={() =>
                                setStatusConfirmModal({
                                  user: std,
                                  nextStatus: "active",
                                })
                              }
                            >
                              <UserCheck size={13} /> <span className="usr-btn-label">Activate</span>
                            </button>
                          )}

                          <button
                            type="button"
                            className="usr-btn-action delete"
                            title="Delete student account"
                            onClick={() => {
                              setDeleteConfirmText("");
                              setDeleteTarget(std);
                            }}
                          >
                            <Trash2 size={13} /> <span className="usr-btn-label">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls (< 1 2 >) matching media_71dea7d8.jpg */}
        <div className="usr-pagination-row">
          <button
            type="button"
            className="usr-page-nav-btn"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              type="button"
              className={`usr-page-num-btn ${currentPage === num ? "active" : ""}`}
              onClick={() => setCurrentPage(num)}
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            className="usr-page-nav-btn"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Status toggle confirmation */}
      {statusConfirmModal && (
        <div className="usr-overlay" onClick={() => setStatusConfirmModal(null)}>
          <div className="usr-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <span className={`usr-modal-ico ${statusConfirmModal.nextStatus === "active" ? "green" : "amber"}`}>
              {statusConfirmModal.nextStatus === "active" ? <Play size={16} /> : <Pause size={16} />}
            </span>
            <h3>
              {statusConfirmModal.nextStatus === "active"
                ? "Activate Account?"
                : "Deactivate Account?"}
            </h3>
            <p>
              {statusConfirmModal.nextStatus === "active"
                ? `Are you sure you want to activate ${statusConfirmModal.user.fullName}'s account? They will be able to log in and apply for drives.`
                : `Are you sure you want to deactivate ${statusConfirmModal.user.fullName}'s account? Their existing records will remain preserved, but login will be blocked.`}
            </p>
            <div className="usr-modal-actions">
              <button type="button" className="usr-mbtn soft" onClick={() => setStatusConfirmModal(null)}>
                Cancel
              </button>
              <button
                type="button"
                className={`usr-mbtn ${statusConfirmModal.nextStatus === "active" ? "green" : "red"}`}
                onClick={confirmToggleStatus}
              >
                Confirm {statusConfirmModal.nextStatus === "active" ? "Activation" : "Deactivation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent delete confirmation */}
      {deleteTarget && (
        <div className="usr-overlay" onClick={() => !modalBusy && setDeleteTarget(null)}>
          <div className="usr-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <span className="usr-modal-ico red"><Trash2 size={16} /></span>
            <h3>Delete Account Permanently?</h3>
            <p>
              You are about to delete <strong>{deleteTarget.fullName} ({deleteCode})</strong>. This cannot be undone and will remove:
            </p>
            <ul className="usr-modal-list">
              <li>Profile and login access</li>
              <li>{deleteTarget.eventsJoined} events and {deleteTarget.totalHours} verified hours</li>
              <li>{deleteTarget.points.toLocaleString()} community points and ledger</li>
              <li>All issued certificates</li>
            </ul>
            <label className="usr-modal-label" htmlFor="usr-delete-confirm">
              Type <strong>{deleteCode}</strong> to confirm
            </label>
            <input
              id="usr-delete-confirm"
              className={`usr-modal-input ${deleteConfirmText.trim().toLowerCase() === String(deleteCode).toLowerCase() ? "match" : ""}`}
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              autoComplete="off"
              autoFocus
            />
            <div className="usr-modal-actions">
              <button type="button" className="usr-mbtn soft" disabled={modalBusy} onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="usr-mbtn red"
                disabled={modalBusy || deleteConfirmText.trim().toLowerCase() !== String(deleteCode).toLowerCase()}
                onClick={confirmDelete}
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