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
} from "lucide-react";

import { useApp } from "../../context/AppContext";
import { adminAPI } from "../../api/adminAPI";
import StudentProfileDrawer from "../../components/common/StudentProfileDrawer";
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
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Drawer & Modals state
  const [drawerStudent, setDrawerStudent] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
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

      // Filter student/volunteer users
      const students = raw
        .filter((u) => u && (u.role === "student" || u.role === "volunteer" || !u.role))
        .map((u) => ({
          ...u,
          zone: u.zone || "Zone 1",
          batch: u.batch || "2022-2026",
          department: u.department || "CSE",
          college: u.college || "Maatram Institute of Technology",
          rollNumber: u.regNumber || u.rollNumber || u.applicationId || "MA2022001",
          rating: u.rating || 4.8,
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
      result = result.filter((u) => u.status === "inactive");
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

    return result;
  }, [usersList, activeStatusFilter, searchQuery]);

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
          <span className="usr-card-arrow">&rarr;</span>
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
          <span className="usr-card-arrow">&rarr;</span>
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
          <span className="usr-card-arrow">&rarr;</span>
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
          <span className="usr-card-arrow">&rarr;</span>
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
          <span className="usr-card-arrow">&rarr;</span>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* B. SEARCH & FILTER TOOLBAR (Exact match to media_71dea7d8.jpg)*/}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="usr-search-filter-row">
        {/* Search Input */}
        <div className="usr-search-input-wrap">
          <Search size={18} className="usr-search-icon" />
          <input
            type="text"
            className="usr-search-input"
            placeholder="Search name, roll no, college, department..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Filter Pills matching media_71dea7d8.jpg */}
        <div className="usr-filter-pills-wrap">
          {/* All Pill */}
          <button
            type="button"
            className={`usr-filter-pill-btn all ${activeStatusFilter === "all" ? "selected" : ""}`}
            onClick={() => {
              setActiveStatusFilter("all");
              setCurrentPage(1);
            }}
          >
            All <span className="usr-pill-badge">{summaryMetrics.totalStudents}</span>
          </button>

          {/* Active Pill */}
          <button
            type="button"
            className={`usr-filter-pill-btn active-pill ${
              activeStatusFilter === "active" ? "selected" : ""
            }`}
            onClick={() => {
              setActiveStatusFilter("active");
              setCurrentPage(1);
            }}
          >
            <CheckCircle2 size={14} /> Active{" "}
            <span className="usr-pill-badge">{summaryMetrics.activeVolunteers}</span>
          </button>

          {/* Inactive Pill */}
          <button
            type="button"
            className={`usr-filter-pill-btn inactive-pill ${
              activeStatusFilter === "inactive" ? "selected" : ""
            }`}
            onClick={() => {
              setActiveStatusFilter("inactive");
              setCurrentPage(1);
            }}
          >
            <XCircle size={14} /> Inactive{" "}
            <span className="usr-pill-badge">{summaryMetrics.inactiveVolunteers}</span>
          </button>
        </div>

        <div className="usr-actions-right">
          <button
            type="button"
            className="usr-btn-action"
            onClick={loadUsers}
            title="Refresh student list"
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* C. STUDENT TABLE (Exact match to media_71dea7d8.jpg)          */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="usr-table-card">
        <div style={{ overflowX: "auto" }}>
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
                      onClick={() => {
                        setDrawerStudent(std);
                        setShowDrawer(true);
                      }}
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
                            title="View student profile drawer"
                            onClick={() => {
                              setDrawerStudent(std);
                              setShowDrawer(true);
                            }}
                          >
                            <Eye size={13} /> View
                          </button>

                          {std.status === "pending_approval" ? (
                            <button
                              type="button"
                              className="usr-btn-action toggle-inactive"
                              title="Approve registration"
                              onClick={() => handleApprove(std)}
                            >
                              <CheckCircle2 size={13} /> Approve
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
                              <UserX size={13} /> Deactivate
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
                              <UserCheck size={13} /> Activate
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

      {/* ───────────────────────────────────────────────────────────── */}
      {/* D. STUDENT PROFILE DRAWER (Phase 6)                           */}
      {/* ───────────────────────────────────────────────────────────── */}
      <StudentProfileDrawer
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        student={drawerStudent}
        onToggleStatus={(nextSt) => {
          if (drawerStudent) {
            setStatusConfirmModal({ user: drawerStudent, nextStatus: nextSt });
          }
        }}
      />

      {/* ───────────────────────────────────────────────────────────── */}
      {/* E. CONFIRMATION MODAL FOR STATUS TOGGLE                      */}
      {/* ───────────────────────────────────────────────────────────── */}
      {statusConfirmModal && (
        <div className="status-modal-overlay">
          <div className="status-modal-card">
            <h3>
              {statusConfirmModal.nextStatus === "active"
                ? "Activate Student Account?"
                : "Deactivate Student Account?"}
            </h3>
            <p>
              {statusConfirmModal.nextStatus === "active"
                ? `Confirm activating ${statusConfirmModal.user.fullName}'s account. They will be granted full login access and drive participation permissions.`
                : `Confirm deactivating ${statusConfirmModal.user.fullName}'s account. Login will be blocked immediately, but their volunteering records and points history will remain securely stored.`}
            </p>
            <div className="status-modal-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setStatusConfirmModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`btn-confirm ${statusConfirmModal.nextStatus}`}
                onClick={confirmToggleStatus}
              >
                Confirm {statusConfirmModal.nextStatus === "active" ? "Activation" : "Deactivation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
