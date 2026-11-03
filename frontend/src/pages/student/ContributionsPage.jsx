// frontend/src/pages/ContributionsPage.jsx
import React, { useState, useEffect } from "react";
import {
  HeartHandshake,
  Clock,
  Calendar,
  CheckCircle2,
  Clock3,
  PlusCircle,
  Award,
  Filter,
  FileCheck,
  ShieldCheck,
  Download,
  Coins,
  Crown,
  Star,
  Shield,
  ArrowRight,
} from "lucide-react";

import { useApp } from "../../context/AppContext";
import { usersAPI } from "../../api/usersAPI";
import { adminAPI } from "../../api/adminAPI";
import "./StudentDashboard.css";

export default function ContributionsPage() {
  const { user, contributions, logContribution } = useApp();

  const [filterCategory, setFilterCategory] = useState("All");
  const [showLogModal, setShowLogModal] = useState(false);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [gradingTiers, setGradingTiers] = useState([]);

  const [newLog, setNewLog] = useState({
    eventTitle: "",
    category: "School Visits",
    date: new Date().toISOString().split("T")[0],
    hours: 4,
  });

  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const res = await usersAPI.getPointsHistory();
        if (res && res.data) {
          setPointsHistory(res.data);
        }
        const gRes = await adminAPI.getGradingLevels();
        if (gRes && gRes.data) {
          setGradingTiers(gRes.data);
        }
      } catch (err) {}
    };
    fetchPoints();
  }, []);

  const totalPoints = user.points ?? 0;

  // Compute tier
  const tiers = gradingTiers.length > 0 ? gradingTiers : [
    { tier: "Bronze", name: "Bronze Volunteer", minPoints: 0, color: "#CD7F32" },
    { tier: "Silver", name: "Silver Volunteer", minPoints: 100, color: "#94A3B8" },
    { tier: "Gold", name: "Gold Volunteer", minPoints: 250, color: "#EAB308" },
    { tier: "Platinum", name: "Platinum Volunteer", minPoints: 500, color: "#6366F1" },
  ];

  const sortedTiers = [...tiers].sort((a, b) => a.minPoints - b.minPoints);
  let currentTier = sortedTiers[0];
  for (let i = 0; i < sortedTiers.length; i++) {
    if (totalPoints >= sortedTiers[i].minPoints) {
      currentTier = sortedTiers[i];
    }
  }

  const filteredContributions = (contributions || []).filter((c) => {
    return filterCategory === "All" || c.category === filterCategory;
  });

  const handleLogSubmit = (e) => {
    e.preventDefault();
    if (!newLog.eventTitle) return;
    logContribution(newLog);
    setShowLogModal(false);
    setNewLog({
      eventTitle: "",
      category: "School Visits",
      date: new Date().toISOString().split("T")[0],
      hours: 4,
    });
  };

  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <div className="section-header-row">
        <div>
          <h1 className="page-heading">My Volunteering Points & Contributions</h1>
          <p className="page-subheading">
            Track your verified hours, points earned across completed events, and volunteer achievement rankings.
          </p>
        </div>

        <button className="dash-btn dash-btn-primary" onClick={() => setShowLogModal(true)}>
          <PlusCircle size={16} /> Log Field Hours
        </button>
      </div>

      {/* STAT METRICS ROW */}
      <div className="stats-grid">
        {/* Points Card */}
        <div className="stat-card" style={{ borderLeft: "4px solid #EAB308" }}>
          <div className="stat-icon-wrap yellow">
            <Award size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Volunteering Points</span>
            <div className="stat-value-row">
              <span className="stat-value">{totalPoints}</span>
              <span className="stat-subtext">pts</span>
            </div>
            <span className="stat-period-tag">🏆 Ranking: {currentTier.name}</span>
          </div>
        </div>

        {/* Verified Hours */}
        <div className="stat-card" style={{ borderLeft: "4px solid #0066CC" }}>
          <div className="stat-icon-wrap blue">
            <Clock size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Verified Hours</span>
            <div className="stat-value-row">
              <span className="stat-value">{user.totalHours ?? 0}</span>
              <span className="stat-subtext">hrs</span>
            </div>
            <span className="stat-period-tag">Audited Service</span>
          </div>
        </div>

        {/* Completed Drives */}
        <div className="stat-card" style={{ borderLeft: "4px solid #10B981" }}>
          <div className="stat-icon-wrap green">
            <FileCheck size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Completed Drives</span>
            <div className="stat-value-row">
              <span className="stat-value">{user.completedEventsCount || contributions.length || 0}</span>
              <span className="stat-subtext">events</span>
            </div>
            <span className="stat-period-tag">100% verified</span>
          </div>
        </div>

        {/* Current Tier */}
        <div className="stat-card" style={{ borderLeft: "4px solid #8B5CF6" }}>
          <div className="stat-icon-wrap" style={{ background: "#EDE9FE", color: "#7C3AED" }}>
            <Crown size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Volunteer Tier</span>
            <div className="stat-value-row">
              <span className="stat-value" style={{ fontSize: 20 }}>{currentTier.tier}</span>
            </div>
            <span className="stat-period-tag">{currentTier.name}</span>
          </div>
        </div>
      </div>

      {/* POINTS TRANSACTIONS SECTION */}
      <div className="dash-section-card" style={{ marginBottom: 24, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid #E2E8F0" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#0F172A" }}>
            Points Earned from Events & Activities
          </h2>
          <span style={{ fontSize: 12.5, color: "#64748B" }}>
            Official transaction records of points awarded for completed events and authorized coordinator adjustments.
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Event / Context</th>
                <th>Type</th>
                <th>Points Awarded</th>
                <th>Reason</th>
                <th>Admin Remarks</th>
              </tr>
            </thead>
            <tbody>
              {pointsHistory.length > 0 ? (
                pointsHistory.map((tx) => (
                  <tr key={tx._id || tx.id}>
                    <td>{new Date(tx.date || tx.createdAt).toLocaleDateString()}</td>
                    <td>
                      <strong>{tx.eventName || "Volunteering Activity"}</strong>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 8,
                          fontSize: 11,
                          fontWeight: 700,
                          background: tx.type === "CREDIT" ? "#DCFCE7" : "#FEE2E2",
                          color: tx.type === "CREDIT" ? "#16A34A" : "#DC2626",
                        }}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td>
                      <strong
                        style={{
                          color: tx.type === "DEBIT" || tx.points < 0 ? "#DC2626" : "#16A34A",
                          fontSize: 14,
                        }}
                      >
                        {tx.type === "DEBIT" || tx.points < 0 ? `${tx.points}` : `+${tx.points}`} pts
                      </strong>
                    </td>
                    <td>{tx.reason}</td>
                    <td style={{ color: "#64748B" }}>{tx.adminRemarks || "Verified by Coordinator"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: "30px", textAlign: "center", color: "#64748B" }}>
                    No points transactions recorded yet. Join and complete volunteering drives to earn points!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECENT ACTIVITIES & VERIFIED LOGS */}
      <div className="dash-section-card">
        <div className="section-card-header">
          <div>
            <h2>Verified Contribution History</h2>
            <p>Official records of all volunteering drives completed.</p>
          </div>

          {/* Category filter */}
          <div className="format-pills-row">
            {["All", "School Visits", "Maatram Opportunities", "Karpom Karpipom", "Outside Events", "Sangamam"].map(
              (cat) => (
                <button
                  key={cat}
                  className={`format-pill-btn ${filterCategory === cat ? "active" : ""}`}
                  onClick={() => setFilterCategory(cat)}
                >
                  {cat}
                </button>
              )
            )}
          </div>
        </div>

        {filteredContributions.length === 0 ? (
          <div className="opp-empty-state" style={{ padding: "40px 20px" }}>
            <Clock size={40} color="#717784" />
            <h3>No off-portal records logged</h3>
            <p>Your off-portal logs will appear here once submitted.</p>
            <button className="dash-btn dash-btn-primary" onClick={() => setShowLogModal(true)}>
              <PlusCircle size={16} /> Log Field Hours
            </button>
          </div>
        ) : (
          <div className="contributions-timeline-list">
            {filteredContributions.map((cnt) => (
              <div key={cnt.id} className="contribution-log-item">
                <div className="log-icon-col">
                  <div className="log-circle-icon">
                    <HeartHandshake size={18} color="#FFD629" />
                  </div>
                </div>

                <div className="log-details-col">
                  <div className="log-top-meta">
                    <span className="category-pill">{cnt.category}</span>
                    <span className="status-pill approved">
                      <CheckCircle2 size={13} /> {cnt.status}
                    </span>
                  </div>
                  <h3 className="log-event-title">{cnt.eventTitle}</h3>
                  <p className="log-verifier">Verified by: {cnt.verifier}</p>
                  <div className="log-bottom-meta">
                    <span>
                      <Calendar size={13} /> {cnt.date}
                    </span>
                    <span>
                      Certificate ID: <strong>{cnt.certificateId}</strong>
                    </span>
                  </div>
                </div>

                <div className="log-hours-col">
                  <span className="log-hours-num">+{cnt.hours}</span>
                  <span className="log-hours-text">hours</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LOG HOURS MODAL */}
      {showLogModal && (
        <div className="modal-backdrop" onClick={() => setShowLogModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <HeartHandshake size={24} color="#D97706" />
              <h3>Log Field Volunteering Hours</h3>
            </div>
            <p className="modal-text">
              Submit your contribution for an off-portal or verified field drive. Hours will be added
              to your profile and certificate record.
            </p>

            <form onSubmit={handleLogSubmit} className="edit-form-grid">
              <div className="register-field" style={{ gridColumn: "1 / -1" }}>
                <label>Event / Activity Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Govt School Career Orientation Drive"
                  value={newLog.eventTitle}
                  onChange={(e) => setNewLog({ ...newLog, eventTitle: e.target.value })}
                  required
                />
              </div>

              <div className="register-field">
                <label>Category *</label>
                <select
                  value={newLog.category}
                  onChange={(e) => setNewLog({ ...newLog, category: e.target.value })}
                >
                  <option value="School Visits">School Visits</option>
                  <option value="Maatram Opportunities">Maatram Opportunities</option>
                  <option value="Karpom Karpipom">Karpom Karpipom</option>
                  <option value="Outside Events">Outside Events</option>
                  <option value="Sangamam">Sangamam</option>
                </select>
              </div>

              <div className="register-field">
                <label>Hours Contributed *</label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={newLog.hours}
                  onChange={(e) => setNewLog({ ...newLog, hours: e.target.value })}
                  required
                />
              </div>

              <div className="register-field" style={{ gridColumn: "1 / -1" }}>
                <label>Date Completed *</label>
                <input
                  type="date"
                  value={newLog.date}
                  onChange={(e) => setNewLog({ ...newLog, date: e.target.value })}
                  required
                />
              </div>

              <div style={{ gridColumn: "1 / -1", display: "flex", gap: 12, marginTop: 8 }}>
                <button type="submit" className="dash-btn dash-btn-primary">
                  Submit & Log Hours
                </button>
                <button
                  type="button"
                  className="dash-btn dash-btn-outline"
                  onClick={() => setShowLogModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
