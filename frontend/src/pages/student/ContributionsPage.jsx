// frontend/src/pages/student/ContributionsPage.jsx
import React, { useState, useEffect } from "react";
import {
  Clock,
  Award,
  PlusCircle,
  FileCheck,
  ShieldCheck,
  Download,
  Coins,
  Share2,
  Star,
} from "lucide-react";

import { useApp } from "../../context/AppContext";
import { usersAPI } from "../../api/usersAPI";
import EventFeedbackModal from "../../components/common/EventFeedbackModal";
import "./StudentDashboard.css";
import "./OpportunityDetailPage.css";

const BLACK = "#334155";

export default function ContributionsPage() {
  const {
    user,
    certificates = [],
    hourLogs = [],
    fetchCertificates,
    fetchHourLogs,
    submitHourLog,
    openLinkedInShare,
    openCertificate,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState("hours"); // 'hours' | 'certificates' | 'points'
  const [showLogModal, setShowLogModal] = useState(false);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [submittingHours, setSubmittingHours] = useState(false);
  // Feedback unlock state
  const [selectedFeedbackCert, setSelectedFeedbackCert] = useState(null);
  const [unlockedCerts, setUnlockedCerts] = useState(new Set());

  const [newLog, setNewLog] = useState({
    eventTitle: "",
    category: "School Visits",
    date: new Date().toISOString().split("T")[0],
    submittedHours: 4,
    evidenceRemarks: "",
  });

  useEffect(() => {
    fetchCertificates?.();
    fetchHourLogs?.();
    const fetchPoints = async () => {
      try {
        const res = await usersAPI.getPointsHistory();
        if (res && res.data) {
          setPointsHistory(res.data);
        }
      } catch (err) { }
    };
    fetchPoints();
  }, [fetchCertificates, fetchHourLogs]);

  const totalPoints = user?.points ?? 0;
  const verifiedHours = user?.totalHours ?? 0;

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    if (!newLog.eventTitle) {
      showToast("Please enter an event or activity title", "error");
      return;
    }
    try {
      setSubmittingHours(true);
      await submitHourLog(newLog);
      setShowLogModal(false);
      setNewLog({
        eventTitle: "",
        category: "School Visits",
        date: new Date().toISOString().split("T")[0],
        submittedHours: 4,
        evidenceRemarks: "",
      });
      showToast("Hours submitted for admin verification! ✅");
    } catch (err) {
      showToast(err.message || "Could not submit hours", "error");
    } finally {
      setSubmittingHours(false);
    }
  };

  const labelStyle = { display: "block", fontSize: 13, fontWeight: 700, color: BLACK, marginBottom: 5 };
  const inputStyle = { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #94A3B8", fontSize: 14, color: BLACK, background: "#FFFFFF" };

  return (
    <div
      className="dashboard-container contrib-page"
      style={{
        width: "100%",
        maxWidth: "100%",
        margin: 0,
        padding: "16px 24px 40px",
        background: "#FFFFFF",
        minHeight: "100%",
        color: BLACK,
      }}
    >
      <style>{`
        /* Use the full left-to-right width of the page */
        .contrib-page { max-width: 100% !important; width: 100% !important; margin: 0 !important; }

        /* Dark, clearly visible text */
        .contrib-page .stat-label,
        .contrib-page .stat-value,
        .contrib-page .stat-subtext { color: #334155 !important; }
        .contrib-page .stat-label { font-weight: 800 !important; }
        .contrib-page .stat-value { font-weight: 800 !important; }
        .contrib-page .stat-subtext { font-weight: 700 !important; }
        .contrib-page .stat-period-tag { font-weight: 700 !important; }

        .contrib-table thead tr,
        .contrib-table thead th {
          background: #000000 !important;
          color: #FFFFFF !important;
        }
        .contrib-table th,
        .contrib-table td {
          text-align: center !important;
          color: #334155;
        }
        .contrib-table thead th { color: #FFFFFF !important; }
      `}</style>

      {/* ─── BANNER ──────────────────────────────────────────────────────── */}
      <div
        style={{
          background: "linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 50%, #0284C7 100%)",
          borderRadius: 20,
          padding: "20px 24px",
          color: "#FFFFFF",
          boxShadow: "0 8px 24px rgba(29, 78, 216, 0.2)",
          marginBottom: 20,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ flex: "1 1 320px", minWidth: 260 }}>
          <h1 style={{ fontSize: "clamp(20px, 2.4vw, 26px)", fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.02em", color: "#FFFFFF" }}>
            My Contributions & Achievements
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "#FFFFFF", lineHeight: 1.4 }}>
            Official record of verified field hours, community certificates, and impact points.
          </p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(6px)",
              padding: "8px 16px",
              borderRadius: 14,
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#FFFFFF" }}>{verifiedHours}h</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#FFFFFF", textTransform: "uppercase" }}>Hours</div>
            </div>
            <div style={{ width: 1, height: 26, background: "rgba(255, 255, 255, 0.25)" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#FDE047" }}>{totalPoints}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#FFFFFF", textTransform: "uppercase" }}>Points</div>
            </div>
            <div style={{ width: 1, height: 26, background: "rgba(255, 255, 255, 0.25)" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#86EFAC" }}>{certificates.length}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#FFFFFF", textTransform: "uppercase" }}>Certs</div>
            </div>
          </div>

          <button
            onClick={() => setShowLogModal(true)}
            style={{
              background: "#FFFFFF",
              color: "#1E3A8A",
              border: "none",
              borderRadius: 12,
              padding: "10px 18px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              transition: "transform 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            <PlusCircle size={16} color="#1E3A8A" /> Log Service Hours
          </button>
        </div>
      </div>

      {/* ─── SUMMARY STATS ROW ───────────────────────────────────────────── */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card" style={{ borderLeft: "4px solid #0284C7" }}>
          <div className="stat-icon-wrap blue">
            <Clock size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Verified Hours</span>
            <div className="stat-value-row">
              <span className="stat-value">{verifiedHours}</span>
              <span className="stat-subtext">hrs</span>
            </div>
            <span className="stat-period-tag" style={{ color: "#075985", background: "#E0F2FE" }}>
              ✓ Official Audited Record
            </span>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: "4px solid #EAB308" }}>
          <div className="stat-icon-wrap yellow">
            <Award size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Impact Points Earned</span>
            <div className="stat-value-row">
              <span className="stat-value">{totalPoints}</span>
              <span className="stat-subtext">pts</span>
            </div>
            <span className="stat-period-tag" style={{ color: "#854D0E", background: "#FEF9C3" }}>
              Tier: {user?.tier || "Bronze"}
            </span>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: "4px solid #10B981" }}>
          <div className="stat-icon-wrap green">
            <ShieldCheck size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Official Certificates</span>
            <div className="stat-value-row">
              <span className="stat-value">{certificates.length}</span>
              <span className="stat-subtext">issued</span>
            </div>
            <span className="stat-period-tag" style={{ color: "#166534", background: "#DCFCE7" }}>
              Verified Credentials
            </span>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: "4px solid #6366F1" }}>
          <div className="stat-icon-wrap purple">
            <FileCheck size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Completed Drives</span>
            <div className="stat-value-row">
              <span className="stat-value">{user?.completedEventsCount || 0}</span>
              <span className="stat-subtext">drives</span>
            </div>
            <span className="stat-period-tag" style={{ color: "#3730A3", background: "#EEF2FF" }}>
              Community Service
            </span>
          </div>
        </div>
      </div>

      {/* ─── TAB NAVIGATION (Recognition Badges removed) ─────────────────── */}
      <div
        style={{
          display: "flex",
          gap: 8,
          borderBottom: "2px solid #CBD5E1",
          marginBottom: 20,
          flexWrap: "wrap",
          overflow: "visible",
        }}
      >
        {[
          { key: "hours", label: "Hours Audit Log", icon: Clock },
          { key: "certificates", label: `Certificates (${certificates.length})`, icon: ShieldCheck },
          { key: "points", label: `Points History (${pointsHistory.length})`, icon: Coins },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 16px",
                border: "none",
                background: "transparent",
                color: BLACK,
                fontWeight: isActive ? 800 : 700,
                fontSize: 14.5,
                cursor: "pointer",
                borderBottom: isActive ? "3px solid #334155" : "3px solid transparent",
                marginBottom: -2,
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}
            >
              <Icon size={16} color={BLACK} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: HOURS LOG ────────────────────────────────────────────── */}
      {activeTab === "hours" && (
        <div style={{ background: "#FFFFFF", borderRadius: 16, border: "1px solid #CBD5E1", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #CBD5E1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: BLACK }}>
              Volunteering Hours Submissions & Audits
            </h3>
            <span style={{ fontSize: 14, color: BLACK, fontWeight: 800 }}>{hourLogs.length} Records</span>
          </div>

          {hourLogs.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center", color: BLACK }}>
              <Clock size={36} color="#64748B" style={{ marginBottom: 12 }} />
              <h4 style={{ margin: "0 0 6px", color: BLACK, fontSize: 16, fontWeight: 800 }}>No hours logged yet</h4>
              <p style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 500, color: BLACK }}>
                Participate in an event or log your community field hours for administrative audit.
              </p>
              <button
                onClick={() => setShowLogModal(true)}
                style={{
                  background: "#1D4ED8",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 10,
                  padding: "8px 18px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Log First Hours
              </button>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="contrib-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#000000", borderBottom: "1px solid #000000", color: "#FFFFFF", fontWeight: 700 }}>
                    <th style={{ padding: "12px 16px" }}>Event / Activity</th>
                    <th style={{ padding: "12px 16px" }}>Category</th>
                    <th style={{ padding: "12px 16px" }}>Date</th>
                    <th style={{ padding: "12px 16px" }}>Submitted</th>
                    <th style={{ padding: "12px 16px" }}>Verified</th>
                    <th style={{ padding: "12px 16px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {hourLogs.map((log) => {
                    const isVer = log.verificationStatus === "Verified";
                    const isRej = log.verificationStatus === "Rejected";
                    const badgeBg = isVer ? "#DCFCE7" : isRej ? "#FEE2E2" : "#FEF3C7";
                    const badgeCol = isVer ? "#166534" : isRej ? "#991B1B" : "#92400E";

                    return (
                      <tr key={log.id || log._id} style={{ borderBottom: "1px solid #CBD5E1" }}>
                        <td style={{ padding: "14px 16px", fontWeight: 700, color: BLACK }}>{log.eventTitle}</td>
                        <td style={{ padding: "14px 16px", color: BLACK, fontWeight: 600 }}>{log.eventCategory}</td>
                        <td style={{ padding: "14px 16px", color: BLACK, fontWeight: 600 }}>{log.participationDate}</td>
                        <td style={{ padding: "14px 16px", color: BLACK, fontWeight: 700 }}>{log.submittedHours} hrs</td>
                        <td style={{ padding: "14px 16px", fontWeight: 800, color: BLACK }}>{log.verifiedHours || 0} hrs</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span
                            style={{
                              background: badgeBg,
                              color: badgeCol,
                              padding: "4px 10px",
                              borderRadius: 12,
                              fontSize: 12.5,
                              fontWeight: 800,
                              display: "inline-block",
                            }}
                          >
                            {log.verificationStatus || "Pending"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: CERTIFICATES ─────────────────────────────────────────── */}
      {activeTab === "certificates" && (
        <div style={{ background: "#FFFFFF", borderRadius: 16, border: "1px solid #CBD5E1", padding: "20px" }}>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 800, color: BLACK }}>
              Official Volunteering Certificates
            </h3>
            <p style={{ margin: 0, fontSize: 13.5, fontWeight: 500, color: BLACK }}>
              Credentials verified and issued by Maatram Educational & Charitable Trust.
            </p>
          </div>

          {certificates.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center", color: BLACK }}>
              <ShieldCheck size={40} color="#64748B" style={{ marginBottom: 12 }} />
              <h4 style={{ margin: "0 0 6px", color: BLACK, fontSize: 16, fontWeight: 800 }}>
                No certificates issued yet
              </h4>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: BLACK }}>
                Complete a volunteering drive to automatically receive your signed official certificate!
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {certificates.map((cert) => (
                <div
                  key={cert.certificateId || cert.id}
                  style={{
                    background: "#FFFFFF",
                    border: "1.5px solid #CBD5E1",
                    borderRadius: 14,
                    padding: "16px 18px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <span
                        style={{
                          background: "#EEF2FF",
                          color: "#3730A3",
                          padding: "3px 8px",
                          borderRadius: 8,
                          fontSize: 11.5,
                          fontWeight: 800,
                        }}
                      >
                        {cert.certificateId}
                      </span>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: BLACK }}>{cert.issueDate}</span>
                    </div>

                    <h4 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 800, color: BLACK }}>
                      {cert.eventTitle}
                    </h4>
                    <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 500, color: BLACK }}>
                      Verified Hours: <strong>{cert.verifiedHours} hrs</strong> &bull; Points: <strong>+{cert.pointsAwarded || 50} pts</strong>
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: 8, paddingTop: 12, borderTop: "1px solid #CBD5E1" }}>
                    {(!cert.unlocked && !cert.feedbackSubmitted && !unlockedCerts.has(cert.certificateId || cert.eventId)) ? (
                      /* Locked — feedback required */
                      <button
                        onClick={() => setSelectedFeedbackCert(cert)}
                        style={{
                          flex: 1,
                          background: "#FACC15",
                          color: "#000000",
                          border: "none",
                          borderRadius: 8,
                          padding: "9px 12px",
                          fontSize: 12.5,
                          fontWeight: 900,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          boxShadow: "0 3px 8px rgba(234,179,8,0.3)",
                        }}
                      >
                        <Star size={13} fill="#000" color="#000" /> Submit Feedback to Unlock
                      </button>
                    ) : (
                      /* Unlocked */
                      <>
                        <button
                          onClick={() => openCertificate?.(cert)}
                          style={{
                            flex: 1,
                            background: "#1D4ED8",
                            color: "#FFFFFF",
                            border: "none",
                            borderRadius: 8,
                            padding: "7px 12px",
                            fontSize: 12.5,
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                          }}
                        >
                          <Download size={13} /> View / Save
                        </button>
                        <button
                          onClick={() => openLinkedInShare?.(cert)}
                          style={{
                            background: "#0A66C2",
                            color: "#FFFFFF",
                            border: "none",
                            borderRadius: 8,
                            padding: "7px 12px",
                            fontSize: 12.5,
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                          }}
                        >
                          <Share2 size={13} /> LinkedIn
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: POINTS HISTORY ──────────────────────────────────────── */}
      {activeTab === "points" && (
        <div style={{ background: "#FFFFFF", borderRadius: 16, border: "1px solid #CBD5E1", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #CBD5E1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: BLACK }}>
              Points Ledger & Audit History
            </h3>
            <span style={{ fontSize: 14, color: BLACK, fontWeight: 800 }}>Total Balance: {totalPoints} pts</span>
          </div>

          {pointsHistory.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center", color: BLACK }}>
              <Coins size={36} color="#64748B" style={{ marginBottom: 12 }} />
              <h4 style={{ margin: "0 0 6px", color: BLACK, fontSize: 16, fontWeight: 800 }}>No transactions yet</h4>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: BLACK }}>
                Points earned from volunteer drives and activities will be listed here chronologically.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="contrib-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#000000", borderBottom: "1px solid #000000", color: "#FFFFFF", fontWeight: 700 }}>
                    <th style={{ padding: "12px 16px" }}>Type</th>
                    <th style={{ padding: "12px 16px" }}>Points</th>
                    <th style={{ padding: "12px 16px" }}>Activity / Reason</th>
                    <th style={{ padding: "12px 16px" }}>Admin Remarks</th>
                    <th style={{ padding: "12px 16px" }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {pointsHistory.map((tx) => {
                    const isCredit = tx.type === "CREDIT";
                    return (
                      <tr key={tx.id || tx._id} style={{ borderBottom: "1px solid #CBD5E1" }}>
                        <td style={{ padding: "12px 16px" }}>
                          <span
                            style={{
                              background: isCredit ? "#DCFCE7" : "#FEE2E2",
                              color: isCredit ? "#166534" : "#991B1B",
                              padding: "3px 8px",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 800,
                            }}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", fontWeight: 800, color: isCredit ? "#166534" : "#991B1B", fontSize: 14.5 }}>
                          {isCredit ? `+${tx.points}` : `-${tx.points}`} pts
                        </td>
                        <td style={{ padding: "12px 16px", color: BLACK, fontWeight: 700 }}>{tx.reason}</td>
                        <td style={{ padding: "12px 16px", color: BLACK, fontSize: 14, fontWeight: 600 }}>{tx.adminRemarks || "Verified"}</td>
                        <td style={{ padding: "12px 16px", color: BLACK, fontSize: 14, fontWeight: 700 }}>
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── LOG HOURS MODAL ────────────────────────────────────────────── */}
      {showLogModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 20,
              maxWidth: 520,
              width: "100%",
              padding: "24px 28px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
              color: BLACK,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#E0F2FE", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Clock size={20} color="#0284C7" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: BLACK }}>Submit Field Hours</h3>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: BLACK }}>Awaiting audit by Maatram coordinator</p>
                </div>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                style={{ background: "none", border: "none", fontSize: 20, color: BLACK, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLogSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelStyle}>Event / Activity Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. School Career Mentoring, Sangamam Logistics"
                  value={newLog.eventTitle}
                  onChange={(e) => setNewLog({ ...newLog, eventTitle: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Category</label>
                  <select
                    value={newLog.category}
                    onChange={(e) => setNewLog({ ...newLog, category: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="School Visits">School Visits</option>
                    <option value="Sangamam">Sangamam</option>
                    <option value="Admissions">Admissions</option>
                    <option value="Outside Events">Outside Events</option>
                    <option value="Karpom Karpipom">Karpom Karpipom</option>
                    <option value="Special Projects">Special Projects</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Hours Dedicated *</label>
                  <input
                    type="number"
                    min="0.5"
                    max="24"
                    step="0.5"
                    required
                    value={newLog.submittedHours}
                    onChange={(e) => setNewLog({ ...newLog, submittedHours: Number(e.target.value) })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Date of Volunteering</label>
                <input
                  type="date"
                  value={newLog.date}
                  onChange={(e) => setNewLog({ ...newLog, date: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Work Summary / Evidence Remarks</label>
                <textarea
                  rows={3}
                  placeholder="Briefly describe what tasks you conducted or mention team leader name..."
                  value={newLog.evidenceRemarks}
                  onChange={(e) => setNewLog({ ...newLog, evidenceRemarks: e.target.value })}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  style={{
                    background: "#FFFFFF",
                    color: BLACK,
                    border: "1px solid #94A3B8",
                    borderRadius: 8,
                    padding: "9px 16px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingHours}
                  style={{
                    background: "#1D4ED8",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 8,
                    padding: "9px 20px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {submittingHours ? "Submitting..." : "Submit for Verification"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FEEDBACK MODAL — submit feedback to unlock certificate */}
      <EventFeedbackModal
        isOpen={Boolean(selectedFeedbackCert)}
        certificate={selectedFeedbackCert}
        onClose={() => setSelectedFeedbackCert(null)}
        onFeedbackSuccess={(unlockedCert) => {
          setUnlockedCerts((prev) => {
            const next = new Set(prev);
            if (unlockedCert.certificateId) next.add(unlockedCert.certificateId);
            if (unlockedCert.eventId) next.add(unlockedCert.eventId);
            return next;
          });
          showToast("🎉 Certificate unlocked! Feedback submitted successfully.");
          setSelectedFeedbackCert(null);
          setTimeout(() => openCertificate?.(unlockedCert), 400);
        }}
      />
    </div>
  );
}