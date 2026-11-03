// frontend/src/pages/AdminUsersPage.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Search,
  Filter,
  UserCheck,
  UserX,
  Award,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Eye,
  Sliders,
  PlusCircle,
  MinusCircle,
  ShieldCheck,
  GraduationCap,
  Mail,
  Phone,
  Building,
  ArrowRight,
  TrendingUp,
  Settings,
  RefreshCw,
  FileText,
  Trash2,
  AlertCircle,
} from "lucide-react";

import { useApp } from "../../context/AppContext";
import { adminAPI } from "../../api/adminAPI";
import '../student/StudentDashboard.css';
import "./AdminEventsPage.css";

export default function AdminUsersPage() {
  const { user, showToast } = useApp();
  const [usersList, setUsersList] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // "all" | "pending"

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Profile Modal State
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Manual Points Adjustment Modal State
  const [pointsModalUser, setPointsModalUser] = useState(null);
  const [pointsForm, setPointsForm] = useState({
    type: "CREDIT",
    points: 25,
    reason: "",
    adminRemarks: "",
  });
  const [adjustingPoints, setAdjustingPoints] = useState(false);

  // Grading System Configuration Modal State
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [gradingLevels, setGradingLevels] = useState([]);

  // Fetch active/inactive users
  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getUsers({
        search: searchQuery,
        department: selectedDept,
        academicYear: selectedYear,
        status: selectedStatus,
      });
      if (res && res.data) {
        setUsersList(res.data.filter(u => u.status !== "pending_approval"));
      }
    } catch (err) {
      console.warn("Could not fetch users:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending-approval users
  const loadPendingUsers = async () => {
    try {
      setPendingLoading(true);
      const res = await adminAPI.getUsers({ status: "pending_approval" });
      if (res && res.data) {
        setPendingUsers(res.data);
      }
    } catch (err) {
      console.warn("Could not fetch pending users:", err.message);
    } finally {
      setPendingLoading(false);
    }
  };

  // Fetch Grading Levels
  const loadGrading = async () => {
    try {
      const res = await adminAPI.getGradingLevels();
      if (res && res.data) {
        setGradingLevels(res.data);
      }
    } catch (err) {}
  };

  useEffect(() => {
    loadUsers();
    loadPendingUsers();
    loadGrading();
  }, [selectedDept, selectedYear, selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadUsers();
  };

  // Approve a pending user
  const handleApproveUser = async (u) => {
    if (!window.confirm(`Approve ${u.fullName}'s account? They will be able to log in immediately.`)) return;
    try {
      const res = await adminAPI.approveUser(u.id || u._id);
      showToast(res.message || `${u.fullName}'s account approved!`);
      loadPendingUsers();
      loadUsers();
    } catch (err) {
      showToast(err.message || "Failed to approve user", "error");
    }
  };

  // Permanently delete a user
  const handleDeleteUser = async (u) => {
    if (!window.confirm(`Permanently delete ${u.fullName}'s account? This cannot be undone.`)) return;
    try {
      const res = await adminAPI.deleteUser(u.id || u._id);
      showToast(res.message || `${u.fullName}'s account deleted.`);
      loadPendingUsers();
      loadUsers();
    } catch (err) {
      showToast(err.message || "Failed to delete user", "error");
    }
  };

  // View Individual Profile
  const handleViewProfile = async (userId) => {
    try {
      setDetailLoading(true);
      const res = await adminAPI.getUserById(userId);
      if (res && res.data) {
        setSelectedUserDetail(res.data);
      }
    } catch (err) {
      showToast(err.message || "Could not fetch user profile", "error");
    } finally {
      setDetailLoading(false);
    }
  };

  // Activate / Deactivate Account
  const handleToggleStatus = async (userObj) => {
    const nextStatus = userObj.status === "active" ? "inactive" : "active";
    const confirmMsg = `Are you sure you want to ${nextStatus === "active" ? "activate" : "deactivate"} ${userObj.fullName}'s account?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await adminAPI.toggleUserStatus(userObj.id || userObj._id, nextStatus);
      showToast(res.message || `Account ${nextStatus === "active" ? "activated" : "deactivated"}!`);
      loadUsers();
      if (selectedUserDetail && (selectedUserDetail.id === userObj.id || selectedUserDetail._id === userObj._id)) {
        setSelectedUserDetail((prev) => ({ ...prev, status: nextStatus }));
      }
    } catch (err) {
      showToast(err.message || "Failed to update status", "error");
    }
  };

  // Submit Points Adjustment
  const handlePointsSubmit = async (e) => {
    e.preventDefault();
    if (!pointsForm.reason.trim()) {
      showToast("A mandatory reason must be provided for manual point adjustments.", "error");
      return;
    }
    if (!pointsForm.points || Number(pointsForm.points) <= 0) {
      showToast("Points must be greater than zero.", "error");
      return;
    }

    try {
      setAdjustingPoints(true);
      const res = await adminAPI.adjustPoints(pointsModalUser.id || pointsModalUser._id, pointsForm);
      showToast(res.message || "Points updated successfully!");
      setPointsModalUser(null);
      setPointsForm({ type: "CREDIT", points: 25, reason: "", adminRemarks: "" });
      loadUsers();
      if (selectedUserDetail && selectedUserDetail.id === pointsModalUser.id) {
        handleViewProfile(pointsModalUser.id);
      }
    } catch (err) {
      showToast(err.message || "Adjustment failed", "error");
    } finally {
      setAdjustingPoints(false);
    }
  };

  // Save Grading Configuration
  const handleSaveGrading = async (e) => {
    e.preventDefault();
    try {
      const res = await adminAPI.updateGradingLevels(gradingLevels);
      showToast(res.message || "Grading levels saved successfully!");
      setShowGradingModal(false);
      loadUsers();
    } catch (err) {
      showToast(err.message || "Failed to save grading config", "error");
    }
  };

  const departmentsList = [
    "All",
    "Information Technology",
    "Computer Science",
    "Mechanical Engineering",
    "Electronics & Communication",
    "Aeronautical Engineering",
    "Civil Engineering",
  ];

  const yearsList = ["All", "1st Year", "2nd Year", "3rd Year", "4th Year"];

  return (
    <div className="dashboard-container">
      {/* HEADER ROW */}
      <div className="section-header-row">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                background: "#DBEAFE",
                color: "#1E40AF",
                fontSize: 12,
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: 20,
              }}
            >
              Registered Users Directory
            </span>
            <span style={{ color: "#94A3B8", fontSize: 13 }}>{usersList.length} Users</span>
            {pendingUsers.length > 0 && (
              <span style={{ background: "#FEF3C7", color: "#B45309", fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>
                ⏳ {pendingUsers.length} Pending Approval
              </span>
            )}
          </div>
          <h1 className="page-heading" style={{ marginTop: 6 }}>
            User Management
          </h1>
          <p className="page-subheading">
            Approve new registrations, review student &amp; alumni profiles, track volunteering points, and manage account activation.
          </p>
        </div>

        <div className="header-action-group">
          <button
            className="dash-btn dash-btn-outline"
            onClick={() => setShowGradingModal(true)}
            style={{ borderColor: "#F59E0B", color: "#B45309" }}
          >
            <Settings size={15} /> Configure Grading Tiers
          </button>
          <button className="dash-btn dash-btn-outline" onClick={loadUsers}>
            <RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div
        style={{
          background: "#FFFFFF",
          padding: "16px 20px",
          borderRadius: 16,
          border: "1px solid #E2E8F0",
          marginBottom: 20,
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: 8, flex: "1 1 300px" }}>
          <div style={{ position: "relative", width: "100%" }}>
            <Search
              size={16}
              color="#94A3B8"
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              placeholder="Search by student name, registration ID (MAA...), or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px 10px 36px",
                borderRadius: 8,
                border: "1px solid #CBD5E1",
                fontSize: 14,
              }}
            />
          </div>
          <button type="submit" className="dash-btn dash-btn-primary" style={{ padding: "8px 16px" }}>
            Search
          </button>
        </form>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13 }}
          >
            {departmentsList.map((d) => (
              <option key={d} value={d}>
                {d === "All" ? "All Departments" : d}
              </option>
            ))}
          </select>

          {/* Academic Year Filter */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13 }}
          >
            {yearsList.map((y) => (
              <option key={y} value={y}>
                {y === "All" ? "All Academic Years" : y}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13 }}
          >
            <option value="All">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* TAB SELECTOR */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setActiveTab("all")}
          style={{
            padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13,
            background: activeTab === "all" ? "#1E40AF" : "#F1F5F9",
            color: activeTab === "all" ? "#FFF" : "#334155",
          }}
        >
          All Users ({usersList.length})
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          style={{
            padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13,
            background: activeTab === "pending" ? "#D97706" : "#FEF3C7",
            color: activeTab === "pending" ? "#FFF" : "#92400E",
            display: "flex", alignItems: "center", gap: 6,
          }}
        >
          <AlertCircle size={14} />
          Pending Approval ({pendingUsers.length})
        </button>
      </div>

      {/* PENDING APPROVAL TABLE */}
      {activeTab === "pending" && (
        <div className="dash-card" style={{ padding: 0, overflow: "hidden", marginBottom: 24 }}>
          <div style={{ background: "#FFFBEB", padding: "14px 20px", borderBottom: "1px solid #FDE68A" }}>
            <strong style={{ color: "#92400E", fontSize: 14 }}>⏳ Pending Registration Approvals</strong>
            <span style={{ color: "#B45309", fontSize: 12, marginLeft: 8 }}>
              These users have registered but cannot log in until approved.
            </span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name &amp; Email</th>
                  <th>Role</th>
                  <th>College / Org</th>
                  <th>Registered</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingLoading ? (
                  <tr><td colSpan={5} style={{ padding: 32, textAlign: "center", color: "#64748B" }}>Loading...</td></tr>
                ) : pendingUsers.length > 0 ? (
                  pendingUsers.map((pu) => (
                    <tr key={pu.id || pu._id} style={{ background: "#FFFBEB" }}>
                      <td>
                        <strong style={{ display: "block", fontSize: 14, color: "#0F172A" }}>{pu.fullName}</strong>
                        <span style={{ fontSize: 12, color: "#64748B" }}>{pu.email}</span>
                      </td>
                      <td>
                        <span style={{
                          background: pu.role === "alumni" ? "#EDE9FE" : "#DBEAFE",
                          color: pu.role === "alumni" ? "#6D28D9" : "#1E40AF",
                          padding: "2px 8px", borderRadius: 12, fontSize: 12, fontWeight: 700,
                        }}>
                          {pu.role === "alumni" ? "🎓 Alumni" : "🎒 Student"}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 13, color: "#334155" }}>
                          {pu.organization || pu.college || "—"}
                        </span>
                        {pu.designation && <span style={{ display: "block", fontSize: 11, color: "#94A3B8" }}>{pu.designation}</span>}
                      </td>
                      <td>
                        <span style={{ fontSize: 12, color: "#64748B" }}>
                          {pu.createdAt ? new Date(pu.createdAt).toLocaleDateString("en-IN") : "—"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: 6 }}>
                          <button
                            onClick={() => handleApproveUser(pu)}
                            style={{ padding: "6px 12px", borderRadius: 6, background: "#DCFCE7", border: "none", cursor: "pointer", color: "#16A34A", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}
                            title="Approve this user"
                          >
                            <UserCheck size={14} /> Approve
                          </button>
                          <button
                            onClick={() => handleDeleteUser(pu)}
                            style={{ padding: "6px 12px", borderRadius: 6, background: "#FEE2E2", border: "none", cursor: "pointer", color: "#DC2626", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}
                            title="Reject & delete"
                          >
                            <Trash2 size={14} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ padding: "40px 20px", textAlign: "center", color: "#64748B" }}>
                      ✅ No pending approvals. All registrations are up to date.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REGISTERED USERS DATA TABLE */}
      <div className="dash-card" style={{ padding: 0, overflow: "hidden", display: activeTab === "all" ? "block" : "none" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Student Volunteer</th>
                <th>Reg ID / Roll No</th>
                <th>College & Department</th>
                <th>Year</th>
                <th>Points Earned</th>
                <th>Completed Events</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersList.length > 0 ? (
                usersList.map((st) => (
                  <tr key={st.id || st._id}>
                    {/* Student Info */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <img
                          src={
                            st.avatar ||
                            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                          }
                          alt={st.fullName}
                          style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }}
                        />
                        <div>
                          <strong style={{ fontSize: 14.5, color: "#0F172A", display: "block" }}>
                            {st.fullName}
                          </strong>
                          <span style={{ fontSize: 12, color: "#64748B" }}>{st.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Registration ID */}
                    <td>
                      <span
                        style={{
                          background: "#EFF6FF",
                          color: "#1E40AF",
                          padding: "3px 8px",
                          borderRadius: 6,
                          fontWeight: 700,
                          fontSize: 12.5,
                        }}
                      >
                        {st.applicationId || st.id}
                      </span>
                      {st.regNumber && (
                        <span style={{ display: "block", fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                          {st.regNumber}
                        </span>
                      )}
                    </td>

                    {/* College & Department */}
                    <td>
                      <div style={{ maxWidth: 220 }}>
                        <strong style={{ fontSize: 13, color: "#334155", display: "block" }}>
                          {st.college || "Anna University"}
                        </strong>
                        <span style={{ fontSize: 12, color: "#64748B" }}>{st.department || "Engineering"}</span>
                      </div>
                    </td>

                    {/* Year */}
                    <td>
                      <span style={{ fontSize: 13, color: "#475569" }}>{st.academicYear || "1st Year"}</span>
                    </td>

                    {/* Points */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Award size={16} color="#EAB308" />
                        <strong style={{ fontSize: 15, color: "#0F172A" }}>{st.points ?? 0}</strong>
                        <span style={{ fontSize: 11, color: "#64748B" }}>pts</span>
                      </div>
                    </td>

                    {/* Completed Events */}
                    <td>
                      <span
                        style={{
                          background: "#ECFDF5",
                          color: "#059669",
                          padding: "3px 10px",
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {st.completedEventsCount || st.eventsJoined || 0} events
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 12,
                          fontWeight: 700,
                          padding: "3px 9px",
                          borderRadius: 12,
                          background:
                            st.status === "active" ? "#DCFCE7" :
                            st.status === "pending_approval" ? "#FEF3C7" : "#FEE2E2",
                          color:
                            st.status === "active" ? "#15803D" :
                            st.status === "pending_approval" ? "#B45309" : "#B91C1C",
                        }}
                      >
                        {st.status === "active" ? (
                          <><CheckCircle2 size={12} /> Active</>
                        ) : st.status === "pending_approval" ? (
                          <>⏳ Pending</>
                        ) : (
                          <><XCircle size={12} /> Inactive</>
                        )}
                      </span>
                      <span style={{ display: "block", fontSize: 11, color: "#94A3B8", marginTop: 3 }}>
                        {st.role === "alumni" ? "Alumni" : "Student"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: 6 }}>
                        {/* View Profile */}
                        <button
                          className="action-btn"
                          onClick={() => handleViewProfile(st.id || st._id)}
                          title="View Profile & Contribution History"
                          style={{
                            padding: "6px 10px",
                            borderRadius: 6,
                            background: "#F1F5F9",
                            border: "none",
                            cursor: "pointer",
                            color: "#334155",
                          }}
                        >
                          <Eye size={15} />
                        </button>

                        {/* Adjust Points */}
                        <button
                          className="action-btn"
                          onClick={() => {
                            setPointsModalUser(st);
                            setPointsForm({ type: "CREDIT", points: 25, reason: "", adminRemarks: "" });
                          }}
                          title="Adjust Volunteering Points"
                          style={{
                            padding: "6px 10px",
                            borderRadius: 6,
                            background: "#FEF08A",
                            border: "none",
                            cursor: "pointer",
                            color: "#854D0E",
                            fontWeight: 700,
                          }}
                        >
                          <Award size={15} />
                        </button>

                        {/* Toggle Status */}
                        <button
                          className="action-btn"
                          onClick={() => handleToggleStatus(st)}
                          title={st.status === "active" ? "Deactivate Account" : "Activate Account"}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 6,
                            background: st.status === "active" ? "#FEE2E2" : "#DCFCE7",
                            border: "none",
                            cursor: "pointer",
                            color: st.status === "active" ? "#DC2626" : "#16A34A",
                          }}
                        >
                          {st.status === "active" ? <UserX size={15} /> : <UserCheck size={15} />}
                        </button>

                        {/* Delete User */}
                        <button
                          className="action-btn"
                          onClick={() => handleDeleteUser(st)}
                          title="Permanently Delete User"
                          style={{
                            padding: "6px 10px",
                            borderRadius: 6,
                            background: "#FEE2E2",
                            border: "none",
                            cursor: "pointer",
                            color: "#B91C1C",
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ padding: "40px 20px", textAlign: "center", color: "#64748B" }}>
                    No students matched the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INDIVIDUAL PROFILE & CONTRIBUTION HISTORY MODAL */}
      {selectedUserDetail && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 720, maxHeight: "90vh", overflowY: "auto" }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Student Profile & Service Audit</h3>
                <span style={{ fontSize: 12, color: "#64748B" }}>
                  Registration ID: <strong>{selectedUserDetail.applicationId}</strong>
                </span>
              </div>
              <button className="close-modal-btn" onClick={() => setSelectedUserDetail(null)}>
                ✕
              </button>
            </div>

            <div style={{ padding: "24px" }}>
              {/* Header profile card */}
              <div
                style={{
                  display: "flex",
                  gap: 18,
                  alignItems: "center",
                  background: "#F8FAFC",
                  padding: "18px 20px",
                  borderRadius: 16,
                  border: "1px solid #E2E8F0",
                  marginBottom: 20,
                }}
              >
                <img
                  src={
                    selectedUserDetail.avatar ||
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                  }
                  alt={selectedUserDetail.fullName}
                  style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover" }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: "#0F172A" }}>
                      {selectedUserDetail.fullName}
                    </h2>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 12,
                        fontSize: 11.5,
                        fontWeight: 700,
                        background:
                          selectedUserDetail.grade?.tier === "Platinum"
                            ? "#EDE9FE"
                            : selectedUserDetail.grade?.tier === "Gold"
                            ? "#FEF08A"
                            : selectedUserDetail.grade?.tier === "Silver"
                            ? "#F1F5F9"
                            : "#FFEDD5",
                        color:
                          selectedUserDetail.grade?.tier === "Platinum"
                            ? "#6D28D9"
                            : selectedUserDetail.grade?.tier === "Gold"
                            ? "#854D0E"
                            : "#334155",
                      }}
                    >
                      🏆 {selectedUserDetail.grade?.name || "Volunteer"}
                    </span>
                  </div>

                  <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "#475569" }}>
                    {selectedUserDetail.department} • {selectedUserDetail.academicYear} • {selectedUserDetail.college}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748B" }}>
                    Email: {selectedUserDetail.email} | Mobile: {selectedUserDetail.phone || "Not provided"}
                  </p>
                </div>
              </div>

              {/* Stats Bar */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 12,
                  marginBottom: 24,
                  textAlign: "center",
                }}
              >
                <div style={{ background: "#EFF6FF", padding: "12px", borderRadius: 10 }}>
                  <span style={{ fontSize: 12, color: "#1E40AF" }}>Total Points</span>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#1E3A8A" }}>
                    {selectedUserDetail.points || 0}
                  </div>
                </div>
                <div style={{ background: "#ECFDF5", padding: "12px", borderRadius: 10 }}>
                  <span style={{ fontSize: 12, color: "#065F46" }}>Verified Hours</span>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#064E3B" }}>
                    {selectedUserDetail.totalHours || 0}h
                  </div>
                </div>
                <div style={{ background: "#FEF08A", padding: "12px", borderRadius: 10 }}>
                  <span style={{ fontSize: 12, color: "#854D0E" }}>Completed Events</span>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#713F12" }}>
                    {selectedUserDetail.completedEventsCount || 0}
                  </div>
                </div>
                <div style={{ background: "#F1F5F9", padding: "12px", borderRadius: 10 }}>
                  <span style={{ fontSize: 12, color: "#475569" }}>Account Status</span>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: selectedUserDetail.status === "active" ? "#16A34A" : "#DC2626",
                    }}
                  >
                    {selectedUserDetail.status?.toUpperCase() || "ACTIVE"}
                  </div>
                </div>
              </div>

              {/* Points Transaction History */}
              <h4 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>
                Points Transaction & Allocation History
              </h4>
              <div
                style={{
                  border: "1px solid #E2E8F0",
                  borderRadius: 12,
                  overflow: "hidden",
                  marginBottom: 24,
                }}
              >
                {selectedUserDetail.transactions && selectedUserDetail.transactions.length > 0 ? (
                  <table className="admin-table" style={{ fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Event / Reason</th>
                        <th>Points</th>
                        <th>Admin Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedUserDetail.transactions.map((tx) => (
                        <tr key={tx._id || tx.id}>
                          <td>{new Date(tx.date || tx.createdAt).toLocaleDateString()}</td>
                          <td>
                            <strong>{tx.eventName || "Point Adjustment"}</strong>
                            <span style={{ display: "block", fontSize: 11.5, color: "#64748B" }}>
                              {tx.reason}
                            </span>
                          </td>
                          <td>
                            <span
                              style={{
                                fontWeight: 800,
                                color: tx.type === "DEBIT" || tx.points < 0 ? "#DC2626" : "#16A34A",
                              }}
                            >
                              {tx.type === "DEBIT" || tx.points < 0 ? `${tx.points}` : `+${tx.points}`} pts
                            </span>
                          </td>
                          <td style={{ color: "#64748B" }}>{tx.adminRemarks || "Verified"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: "20px", textAlign: "center", color: "#64748B", fontSize: 13 }}>
                    No point transactions recorded yet.
                  </div>
                )}
              </div>

              {/* Event Applications & Attendance History */}
              <h4 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>
                Applied Volunteering Drives & Completion Records
              </h4>
              <div style={{ border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
                {selectedUserDetail.applications && selectedUserDetail.applications.length > 0 ? (
                  <table className="admin-table" style={{ fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th>Reference ID</th>
                        <th>Event Title</th>
                        <th>Slot</th>
                        <th>Status</th>
                        <th>Attendance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedUserDetail.applications.map((app) => (
                        <tr key={app._id || app.id}>
                          <td>
                            <strong>{app.referenceId}</strong>
                          </td>
                          <td>{app.opportunityTitle}</td>
                          <td>{app.slotName || "General Slot"}</td>
                          <td>
                            <span
                              style={{
                                padding: "2px 8px",
                                borderRadius: 10,
                                fontSize: 11.5,
                                fontWeight: 700,
                                background:
                                  app.status === "Completed"
                                    ? "#DCFCE7"
                                    : app.status === "Approved"
                                    ? "#DBEAFE"
                                    : "#FEF08A",
                                color:
                                  app.status === "Completed"
                                    ? "#16A34A"
                                    : app.status === "Approved"
                                    ? "#1D4ED8"
                                    : "#854D0E",
                              }}
                            >
                              {app.status}
                            </span>
                          </td>
                          <td>
                            <span
                              style={{
                                color: app.attendanceStatus === "Present" ? "#16A34A" : "#64748B",
                                fontWeight: 600,
                              }}
                            >
                              {app.attendanceStatus || "Unmarked"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: "20px", textAlign: "center", color: "#64748B", fontSize: 13 }}>
                    No drive applications found.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL POINTS ADJUSTMENT MODAL */}
      {pointsModalUser && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Manual Points Adjustment</h3>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748B" }}>
                  Adjust points for <strong>{pointsModalUser.fullName}</strong> ({pointsModalUser.applicationId})
                </p>
              </div>
              <button className="close-modal-btn" onClick={() => setPointsModalUser(null)}>
                ✕
              </button>
            </div>

            <form onSubmit={handlePointsSubmit} style={{ padding: "20px 24px" }}>
              {/* Type: Credit or Debit */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Adjustment Action *
                </label>
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setPointsForm({ ...pointsForm, type: "CREDIT" })}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: 8,
                      border: pointsForm.type === "CREDIT" ? "2px solid #16A34A" : "1px solid #CBD5E1",
                      background: pointsForm.type === "CREDIT" ? "#DCFCE7" : "#FFFFFF",
                      color: pointsForm.type === "CREDIT" ? "#15803D" : "#475569",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <PlusCircle size={16} /> Increase Points
                  </button>
                  <button
                    type="button"
                    onClick={() => setPointsForm({ ...pointsForm, type: "DEBIT" })}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: 8,
                      border: pointsForm.type === "DEBIT" ? "2px solid #DC2626" : "1px solid #CBD5E1",
                      background: pointsForm.type === "DEBIT" ? "#FEE2E2" : "#FFFFFF",
                      color: pointsForm.type === "DEBIT" ? "#B91C1C" : "#475569",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <MinusCircle size={16} /> Deduct Points
                  </button>
                </div>
              </div>

              {/* Points Amount */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Points to {pointsForm.type === "CREDIT" ? "Add" : "Deduct"} *
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={pointsForm.points}
                  onChange={(e) => setPointsForm({ ...pointsForm, points: e.target.value })}
                  required
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #CBD5E1" }}
                />
              </div>

              {/* Mandatory Reason */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Mandatory Reason for Adjustment *
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Special recognition for coordinating school outreach logistics..."
                  value={pointsForm.reason}
                  onChange={(e) => setPointsForm({ ...pointsForm, reason: e.target.value })}
                  required
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #CBD5E1" }}
                />
                <span style={{ fontSize: 11, color: "#64748B" }}>
                  This reason will be recorded permanently in the student's transaction ledger.
                </span>
              </div>

              {/* Admin Remarks */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Admin Remarks (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Authorized by Outreach Director"
                  value={pointsForm.adminRemarks}
                  onChange={(e) => setPointsForm({ ...pointsForm, adminRemarks: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #CBD5E1" }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button
                  type="button"
                  className="dash-btn dash-btn-outline"
                  onClick={() => setPointsModalUser(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="dash-btn dash-btn-primary"
                  disabled={adjustingPoints}
                >
                  {adjustingPoints ? "Updating..." : "Confirm Point Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIGURABLE GRADING TIERS MODAL */}
      {showGradingModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 580 }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Configure Volunteer Achievement Tiers</h3>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748B" }}>
                  Set minimum points threshold for each volunteer badge tier.
                </p>
              </div>
              <button className="close-modal-btn" onClick={() => setShowGradingModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGrading} style={{ padding: "20px 24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {gradingLevels.map((lvl, idx) => (
                  <div
                    key={lvl.tier}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      background: "#F8FAFC",
                      borderRadius: 10,
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: 14.5, color: "#0F172A", display: "block" }}>
                        {lvl.name}
                      </strong>
                      <span style={{ fontSize: 12, color: "#64748B" }}>{lvl.description}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, color: "#475569" }}>Min Points:</span>
                      <input
                        type="number"
                        min="0"
                        value={lvl.minPoints}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setGradingLevels((prev) =>
                            prev.map((l, i) => (i === idx ? { ...l, minPoints: val } : l))
                          );
                        }}
                        style={{
                          width: 80,
                          padding: "6px 10px",
                          borderRadius: 6,
                          border: "1px solid #CBD5E1",
                          fontWeight: 700,
                          textAlign: "center",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 20 }}>
                <button
                  type="button"
                  className="dash-btn dash-btn-outline"
                  onClick={() => setShowGradingModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="dash-btn dash-btn-primary">
                  Save Tier Configurations
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
