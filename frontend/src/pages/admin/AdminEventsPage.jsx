import React, { useState } from "react";
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
} from "lucide-react";

import { useApp } from "../../context/AppContext";
import { CATEGORIES } from "../../data/mockData";
import "./AdminEventsPage.css";

const PRESET_IMAGES = [
  {
    label: "School Outreach",
    url: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1000&q=80",
  },
  {
    label: "Tree Plantation",
    url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1000&q=80",
  },
  {
    label: "Peer Mentoring",
    url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1000&q=80",
  },
  {
    label: "Community Gathering",
    url: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=80",
  },
  {
    label: "NGO Coordination",
    url: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1000&q=80",
  },
];

const INITIAL_FORM = {
  title: "",
  category: "School Visits",
  mode: "Offline",
  date: "",
  time: "9:30 AM – 1:30 PM",
  durationHours: 4,
  points: 50,
  location: "Chennai, Tamil Nadu",
  volunteersNeeded: 12,
  slotsAvailable: 12,
  deadline: "",
  image: PRESET_IMAGES[0].url,
  description: "",
  objectives: "Deliver community impact\nEmpower student volunteers",
  responsibilities: "Coordinate with team leader\nAssist in on-ground drive operations",
  skills: "Communication, Teamwork, Mentoring",
  eligibility: "Open to all registered student volunteers.",
  contactEmail: "coordinator@maatramfoundation.org",
  featured: false,
};

export default function AdminEventsPage() {
  const {
    user,
    opportunities,
    addOpportunity,
    updateOpportunity,
    deleteOpportunity,
    applications,
    updateApplicationStatus,
    showToast,
  } = useApp();

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
            Event creation, edition, and application review controls are restricted exclusively to Maatram Foundation administrators.
          </p>
          <Link to="/dashboard" className="dash-btn dash-btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState("events"); // 'events' | 'applications'
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedMode, setSelectedMode] = useState("All");

  // Application search & filter
  const [appSearch, setAppSearch] = useState("");
  const [appStatusFilter, setAppStatusFilter] = useState("All");

  // Modals state
  const [showEventModal, setShowEventModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // 'add' | 'edit'
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation
  const [deleteModalOpp, setDeleteModalOpp] = useState(null);

  // Compute stats safely
  const oppList = opportunities || [];
  const appList = applications || [];

  const totalSlotsOpen = oppList.reduce(
    (sum, o) => sum + (Number(o?.slotsAvailable) || 0),
    0
  );
  const pendingApps = appList.filter((a) => a?.status === "Pending");
  const approvedApps = appList.filter((a) => a?.status === "Approved");
  const totalHoursOffered = oppList.reduce(
    (sum, o) => sum + (Number(o?.durationHours) || 0),
    0
  );

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
      title: opp.title,
      category: opp.category,
      mode: opp.mode,
      date: opp.date,
      time: opp.time || "9:30 AM – 1:30 PM (4 hrs)",
      durationHours: opp.durationHours || 4,
      points: opp.points || 50,
      location: opp.location || "",
      volunteersNeeded: opp.volunteersNeeded || 10,
      slotsAvailable: opp.slotsAvailable || 10,
      deadline: opp.deadline || "",
      image: opp.image || PRESET_IMAGES[0].url,
      description: opp.description || "",
      objectives: Array.isArray(opp.objectives) ? opp.objectives.join("\n") : opp.objectives || "",
      responsibilities: Array.isArray(opp.responsibilities)
        ? opp.responsibilities.join("\n")
        : opp.responsibilities || "",
      skills: Array.isArray(opp.skills) ? opp.skills.join(", ") : opp.skills || "",
      eligibility: opp.eligibility || "Open to all students.",
      contactEmail: opp.contactEmail || "coordinator@maatramfoundation.com",
      featured: Boolean(opp.featured),
    });
    setFormErrors({});
    setShowEventModal(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = "Event title is required";
    if (!formData.location.trim()) errors.location = "Location or meeting link is required";
    if (!formData.date.trim()) errors.date = "Event date is required";
    if (!formData.deadline.trim()) errors.deadline = "Deadline is required";
    if (!formData.description.trim()) errors.description = "Description is required";
    if (Number(formData.volunteersNeeded) <= 0)
      errors.volunteersNeeded = "Volunteers needed must be at least 1";
    if (Number(formData.slotsAvailable) < 0)
      errors.slotsAvailable = "Available slots cannot be negative";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast("Please fill in all required fields (Title, Date, Deadline, Location, Description)", "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        volunteersNeeded: Number(formData.volunteersNeeded) || 10,
        slotsAvailable: Number(formData.slotsAvailable) || Number(formData.volunteersNeeded) || 10,
        durationHours: Number(formData.durationHours) || 4,
        points: Number(formData.points) || 50,
        objectives: formData.objectives
          ? (typeof formData.objectives === "string" ? formData.objectives.split("\n").filter((line) => line.trim()) : formData.objectives)
          : [
              "Encourage student participation and social leadership",
              "Deliver measurable community impact",
            ],
        responsibilities: formData.responsibilities
          ? (typeof formData.responsibilities === "string" ? formData.responsibilities.split("\n").filter((line) => line.trim()) : formData.responsibilities)
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
      console.error("Error creating/updating event:", err);
      showToast(err.message || "Failed to save volunteering drive", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteModalOpp) {
      deleteOpportunity(deleteModalOpp.id);
      setDeleteModalOpp(null);
    }
  };

  return (
    <div className="admin-page-container">
      {/* HEADER SECTION */}
      <div className="admin-header-row">
        <div>
          <div className="admin-role-badge">
            <ShieldCheck size={14} color="#D97706" />
            <span>Admin Control Center</span>
          </div>
          <h1 className="admin-main-heading">Volunteer Event Operations & Management</h1>
          <p className="admin-subheading">
            Publish, edit, and organize drives across all 5 volunteering categories. Review and approve student volunteer applications.
          </p>
        </div>

        <button className="admin-btn admin-btn-primary" onClick={handleOpenAddModal}>
          <PlusCircle size={18} /> Post New Volunteering Drive
        </button>
      </div>

      {/* METRIC OVERVIEW CARDS */}
      <section className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon yellow">
            <CalendarPlus size={22} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Active Drives</span>
            <strong className="admin-stat-val">{opportunities.length}</strong>
            <span className="admin-stat-sub">Across 5 categories</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon green">
            <Users size={22} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Open Volunteer Slots</span>
            <strong className="admin-stat-val">{totalSlotsOpen}</strong>
            <span className="admin-stat-sub">Ready for college students</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon amber">
            <Clock3 size={22} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Applications Pending Review</span>
            <strong className="admin-stat-val">{pendingApps.length}</strong>
            <span className="admin-stat-sub">Requires admin decision</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon blue">
            <FileCheck size={22} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Approved Volunteers</span>
            <strong className="admin-stat-val">{approvedApps.length}</strong>
            <span className="admin-stat-sub">Confirmed participants</span>
          </div>
        </div>
      </section>

      {/* TABS SWITCHER */}
      <div className="admin-tabs-nav">
        <button
          className={`admin-tab-btn ${activeTab === "events" ? "active" : ""}`}
          onClick={() => setActiveTab("events")}
        >
          <Layers size={17} />
          <span>Events Catalog ({opportunities.length})</span>
        </button>
        <button
          className={`admin-tab-btn ${activeTab === "applications" ? "active" : ""}`}
          onClick={() => setActiveTab("applications")}
        >
          <Users size={17} />
          <span>Student Applications Review</span>
          {pendingApps.length > 0 && (
            <span className="admin-tab-badge">{pendingApps.length}</span>
          )}
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: EVENTS CATALOG (CRUD) */}
      {/* ============================================================== */}
      {activeTab === "events" && (
        <section className="admin-content-section">
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
              {/* Category Filter */}
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

              {/* Mode Filter */}
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

          {/* EVENTS LIST */}
          {filteredOpportunities.length === 0 ? (
            <div className="admin-empty-box">
              <Calendar size={42} color="#717784" />
              <h3>No events match your criteria</h3>
              <p>Try resetting filters or create a new volunteering drive.</p>
              <button className="admin-btn admin-btn-primary" onClick={handleOpenAddModal}>
                <PlusCircle size={16} /> Post New Event
              </button>
            </div>
          ) : (
            <div className="admin-events-table-wrapper">
              <table className="admin-events-table">
                <thead>
                  <tr>
                    <th>Event Details</th>
                    <th>Category</th>
                    <th>Date & Time</th>
                    <th>Format & Venue</th>
                    <th>Volunteers / Slots</th>
                    <th>Deadline</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOpportunities.map((opp) => {
                    const percentFilled = Math.min(
                      100,
                      Math.round(
                        ((opp.volunteersNeeded - opp.slotsAvailable) /
                          (opp.volunteersNeeded || 1)) *
                          100
                      )
                    );

                    return (
                      <tr key={opp.id}>
                        <td>
                          <div className="event-row-main">
                            <img src={opp.image} alt={opp.title} className="event-table-thumb" />
                            <div>
                              <strong className="event-table-title">{opp.title}</strong>
                              <span className="event-table-id">ID: {opp.id}</span>
                              {opp.featured && (
                                <span className="featured-pill">
                                  <Sparkles size={11} /> Featured
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="category-pill">{opp.category}</span>
                        </td>

                        <td>
                          <div className="table-meta-cell">
                            <span>
                              <Calendar size={13} /> {opp.date}
                            </span>
                            <span className="time-sub">
                              <Clock size={12} /> {opp.durationHours} hrs
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="table-meta-cell">
                            <span className={`mode-pill ${opp.mode.toLowerCase()}`}>
                              {opp.mode}
                            </span>
                            <span className="venue-sub" title={opp.location}>
                              <MapPin size={12} /> {opp.location}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="slots-cell">
                            <div className="slots-text">
                              <strong>{opp.slotsAvailable}</strong> / {opp.volunteersNeeded} slots left
                            </div>
                            <div className="slots-bar-bg">
                              <div
                                className="slots-bar-fill"
                                style={{ width: `${percentFilled}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="deadline-text">{opp.deadline}</span>
                        </td>

                        <td>
                          <div className="admin-actions-cell">
                            <Link
                              to={`/opportunities/${opp.id}`}
                              className="action-icon-btn view"
                              title="View Event Details"
                            >
                              <ExternalLink size={15} />
                            </Link>

                            <button
                              className="action-icon-btn edit"
                              onClick={() => handleOpenEditModal(opp)}
                              title="Edit Event"
                            >
                              <Edit3 size={15} />
                            </button>

                            <button
                              className="action-icon-btn delete"
                              onClick={() => setDeleteModalOpp(opp)}
                              title="Delete Event"
                            >
                              <Trash2 size={15} />
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
      {/* TAB 2: STUDENT APPLICATIONS REVIEW */}
      {/* ============================================================== */}
      {activeTab === "applications" && (
        <section className="admin-content-section">
          {/* SEARCH & FILTER */}
          <div className="admin-toolbar">
            <div className="admin-search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search by student name, college, or reference..."
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
              />
            </div>

            <div className="format-pills-row">
              {["All", "Pending", "Approved", "Rejected", "Cancelled"].map((st) => (
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
              <p>
                Applications submitted by students through the portal will appear here for review and verification.
              </p>
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
                    <tr key={app.id}>
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
                              : app.status === "Cancelled"
                              ? "cancelled"
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
                          {app.status !== "Approved" && (
                            <button
                              className="action-btn-approve"
                              onClick={() =>
                                updateApplicationStatus(
                                  app.id,
                                  "Approved",
                                  "Application verified and approved by admin coordinator."
                                )
                              }
                              title="Approve Application"
                            >
                              <Check size={14} /> Approve
                            </button>
                          )}

                          {app.status !== "Rejected" && (
                            <button
                              className="action-btn-reject"
                              onClick={() =>
                                updateApplicationStatus(
                                  app.id,
                                  "Rejected",
                                  "Application declined due to slot capacity constraints."
                                )
                              }
                              title="Reject Application"
                            >
                              <X size={14} /> Reject
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
                    placeholder="e.g. 15 May 2025 (Thu)"
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
                    placeholder="e.g. 12 May 2025"
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
                        // If creating, sync available slots
                        ...(modalMode === "add"
                          ? { slotsAvailable: e.target.value }
                          : {}),
                      })
                    }
                    className={formErrors.volunteersNeeded ? "has-error" : ""}
                  />
                  {formErrors.volunteersNeeded && (
                    <span className="error-text">
                      {formErrors.volunteersNeeded}
                    </span>
                  )}
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
                  {formErrors.slotsAvailable && (
                    <span className="error-text">
                      {formErrors.slotsAvailable}
                    </span>
                  )}
                </div>
              </div>

              {/* Volunteering Points Allocated */}
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
                  placeholder="e.g. 50"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #CBD5E1" }}
                />
                <span style={{ fontSize: 11.5, color: "#64748B", marginTop: 4, display: "block" }}>
                  Different events can have different points allocated (e.g. 50 pts for half day, 100 pts for multi-day).
                </span>
              </div>

              {/* Cover Image Preset Picker */}
              <div className="form-group-full">
                <label>Cover Image</label>
                <div className="preset-images-row">
                  {PRESET_IMAGES.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      className={`preset-img-btn ${
                        formData.image === preset.url ? "active" : ""
                      }`}
                      onClick={() =>
                        setFormData({ ...formData, image: preset.url })
                      }
                    >
                      <img src={preset.url} alt={preset.label} />
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
                <input
                  type="url"
                  placeholder="Or enter custom image URL"
                  value={formData.image}
                  onChange={(e) =>
                    setFormData({ ...formData, image: e.target.value })
                  }
                  style={{ marginTop: 8 }}
                />
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
                {formErrors.description && (
                  <span className="error-text">{formErrors.description}</span>
                )}
              </div>

              {/* Key Objectives */}
              <div className="form-group-full">
                <label>Key Objectives (1 per line)</label>
                <textarea
                  rows="2"
                  placeholder="Line 1: Mentor students on competitive exam prep&#10;Line 2: Conduct confidence-building workshop"
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
                  placeholder="Line 1: Arrive 15 minutes before session&#10;Line 2: Guide 15-20 students in small clusters"
                  value={formData.responsibilities}
                  onChange={(e) =>
                    setFormData({ ...formData, responsibilities: e.target.value })
                  }
                />
              </div>

              {/* Skills & Contact */}
              <div className="form-row-2">
                <div>
                  <label>Skills Required (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Communication, Mentoring, Teamwork"
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
                    placeholder="coordinator@maatramfoundation.com"
                    value={formData.contactEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, contactEmail: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Featured Checkbox */}
              <div className="checkbox-row">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) =>
                      setFormData({ ...formData, featured: e.target.checked })
                    }
                  />
                  <span>Feature on Student Dashboard spotlight banner</span>
                </label>
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
                  {submitting ? (
                    "Publishing Drive..."
                  ) : modalMode === "add" ? (
                    <>
                      <PlusCircle size={16} /> Publish Volunteering Drive
                    </>
                  ) : (
                    <>
                      <Check size={16} /> Save Changes
                    </>
                  )}
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
              <strong>"{deleteModalOpp.title}"</strong> from the opportunities directory?
              This action cannot be undone.
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
    </div>
  );
}
