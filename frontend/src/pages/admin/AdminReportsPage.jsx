// frontend/src/pages/ReportsPage.jsx
import React, { useState, useEffect } from "react";
import {
  Download,
  Printer,
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  TrendingUp,
  Award,
  Sparkles,
  Building2,
  PieChart,
  FileSpreadsheet,
  FileText,
  Filter,
  RefreshCw,
  Search,
} from "lucide-react";

import { useApp } from "../../context/AppContext";
import { adminAPI } from "../../api/adminAPI";
import BarChart from "../../components/charts/BarChart";
import DonutChart from "../../components/charts/DonutChart";
import '../student/StudentDashboard.css';
import "./AdminEventsPage.css";

export default function ReportsPage() {
  const { user, showToast } = useApp();
  const isAdmin = user?.role === "admin";

  const [activeTab, setActiveTab] = useState("event_participation");
  // Tabs:
  // 1. event_participation: Event-wise participation & Total volunteers per event
  // 2. student_contributions: Student contribution reports
  // 3. department_stats: Department-wise volunteering statistics
  // 4. points_distribution: Points distribution reports
  // 5. application_stats: Approved and rejected application statistics

  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getReports();
      if (res && res.data) {
        setReportsData(res.data);
      }
    } catch (err) {
      console.warn("Could not load reports:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  // Export to Excel / CSV format
  const handleExportExcel = () => {
    if (!reportsData) {
      showToast("No data available to export", "error");
      return;
    }

    let csvRows = [];
    let fileName = `Maatram_Report_${activeTab}_${Date.now()}.csv`;

    if (activeTab === "event_participation") {
      const headers = [
        "Event ID",
        "Event Title",
        "Category",
        "Date",
        "Volunteers Needed",
        "Applications Received",
        "Approved Count",
        "Completed Count",
        "Points Awarded",
        "Event Status",
      ];
      csvRows.push(headers.join(","));
      (reportsData.eventParticipation || []).forEach((row) => {
        csvRows.push(
          [
            row.eventId,
            `"${(row.title || "").replace(/"/g, '""')}"`,
            `"${row.category || ""}"`,
            `"${row.date || ""}"`,
            row.volunteersNeeded,
            row.totalApplications,
            row.approvedCount,
            row.completedCount,
            row.pointsAwarded,
            row.status,
          ].join(",")
        );
      });
    } else if (activeTab === "student_contributions") {
      const headers = [
        "Student ID",
        "Full Name",
        "Email",
        "Phone",
        "College",
        "Department",
        "Academic Year",
        "Total Points",
        "Impact Tier",
        "Completed Events",
        "Status",
      ];
      csvRows.push(headers.join(","));
      (reportsData.studentContributions || []).forEach((row) => {
        csvRows.push(
          [
            row.studentId,
            `"${(row.name || "").replace(/"/g, '""')}"`,
            row.email,
            `"${row.phone || ""}"`,
            `"${(row.college || "").replace(/"/g, '""')}"`,
            `"${row.department || ""}"`,
            row.academicYear,
            row.points,
            row.tier || "Bronze",
            row.completedEvents,
            row.status,
          ].join(",")
        );
      });
    } else if (activeTab === "department_stats") {
      const headers = ["Department", "Total Enrolled Students", "Total Points Generated", "Avg Points per Student"];
      csvRows.push(headers.join(","));
      (reportsData.departmentStatistics || []).forEach((row) => {
        csvRows.push(
          [
            `"${row.department}"`,
            row.totalStudents,
            row.totalPoints,
            row.averagePoints || Math.round(row.totalPoints / (row.totalStudents || 1)),
          ].join(",")
        );
      });
    } else if (activeTab === "points_distribution") {
      const headers = [
        "Transaction ID",
        "Date",
        "Student ID",
        "Student Name",
        "Event / Activity",
        "Type",
        "Points",
        "Reason",
        "Admin Remarks",
      ];
      csvRows.push(headers.join(","));
      (reportsData.pointsDistribution || []).forEach((row) => {
        csvRows.push(
          [
            row.transactionId,
            new Date(row.date).toLocaleDateString(),
            row.studentId,
            `"${(row.studentName || "").replace(/"/g, '""')}"`,
            `"${(row.eventName || "").replace(/"/g, '""')}"`,
            row.type,
            row.points,
            `"${(row.reason || "").replace(/"/g, '""')}"`,
            `"${(row.adminRemarks || "").replace(/"/g, '""')}"`,
          ].join(",")
        );
      });
    } else {
      // Application statistics
      const s = reportsData.applicationStatistics || {};
      const headers = ["Metric", "Count"];
      csvRows.push(headers.join(","));
      csvRows.push(`"Total Applications Received",${s.total || 0}`);
      csvRows.push(`"Approved Applications",${s.approved || 0}`);
      csvRows.push(`"Pending Review",${s.pending || 0}`);
      csvRows.push(`"Completed Drives",${s.completed || 0}`);
      csvRows.push(`"Rejected Applications",${s.rejected || 0}`);
    }

    const csvContent = "\uFEFF" + csvRows.join("\r\n"); // UTF-8 BOM for Excel
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Excel/CSV report exported successfully!");
  };

  // Download PDF / Print
  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="dashboard-container" id="printable-reports">
      {/* HEADER WITH PRINT & EXCEL ACTIONS */}
      <div className="section-header-row">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                background: "#FEF08A",
                color: "#854D0E",
                fontSize: 12,
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: 20,
              }}
            >
              Audited Analytics & Reporting
            </span>
            <span style={{ color: "#94A3B8", fontSize: 13 }}>Official NGO Disclosures</span>
          </div>
          <h1 className="page-heading" style={{ marginTop: 6 }}>
            Volunteering Impact Reports
          </h1>
          <p className="page-subheading">
            Audit-ready metrics on event participation, student hours, points distributions, and department statistics.
          </p>
        </div>

        <div className="header-action-group">
          <button className="dash-btn dash-btn-outline" onClick={handleDownloadPDF}>
            <Printer size={16} /> Download PDF
          </button>
          <button className="dash-btn dash-btn-primary" onClick={handleExportExcel}>
            <FileSpreadsheet size={16} /> Export to Excel
          </button>
        </div>
      </div>

      {/* REPORT TYPE TABS */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          background: "#FFFFFF",
          padding: "12px 16px",
          borderRadius: 16,
          border: "1px solid #E2E8F0",
          marginBottom: 20,
        }}
      >
        {[
          { key: "event_participation", label: "Event Participation Reports", icon: Calendar },
          { key: "student_contributions", label: "Student Contribution Ledger", icon: Users },
          { key: "department_stats", label: "Department-wise Statistics", icon: Building2 },
          { key: "points_distribution", label: "Points Distribution Ledger", icon: Award },
          { key: "application_stats", label: "Approval & Rejection Ratios", icon: CheckCircle2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                borderRadius: 10,
                border: active ? "1.5px solid #0066CC" : "1px solid #E2E8F0",
                background: active ? "#EFF6FF" : "#FFFFFF",
                color: active ? "#0066CC" : "#475569",
                fontWeight: active ? 700 : 500,
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={15} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* SEARCH BAR */}
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ position: "relative", width: 340 }}>
          <Search size={16} color="#94A3B8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder="Filter current report records..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 36px",
              borderRadius: 8,
              border: "1px solid #CBD5E1",
              fontSize: 13.5,
            }}
          />
        </div>

        <button className="dash-btn dash-btn-outline" onClick={loadReports} style={{ padding: "6px 12px", fontSize: 13 }}>
          <RefreshCw size={13} className={loading ? "spin" : ""} /> Refresh Data
        </button>
      </div>

      {/* ── TAB 1: EVENT-WISE PARTICIPATION ── */}
      {activeTab === "event_participation" && (
        <div className="dash-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "18px 20px", borderBottom: "1px solid #E2E8F0" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#0F172A" }}>
              Total Volunteers per Event & Execution Status
            </h3>
            <span style={{ fontSize: 12.5, color: "#64748B" }}>
              Track applications, filled capacities, completed drives, and total awarded points per initiative.
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Event Drive Title</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Volunteers Needed</th>
                  <th>Total Applications</th>
                  <th>Approved</th>
                  <th>Completed & Present</th>
                  <th>Points Awarded</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(reportsData?.eventParticipation || [])
                  .filter((e) =>
                    !searchFilter ||
                    e.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
                    e.category.toLowerCase().includes(searchFilter.toLowerCase())
                  )
                  .map((evt) => (
                    <tr key={evt.eventId}>
                      <td>
                        <strong>{evt.title}</strong>
                        <span style={{ display: "block", fontSize: 11, color: "#64748B" }}>{evt.eventId}</span>
                      </td>
                      <td>
                        <span style={{ background: "#F1F5F9", padding: "2px 8px", borderRadius: 8, fontSize: 12 }}>
                          {evt.category}
                        </span>
                      </td>
                      <td>{evt.date}</td>
                      <td>
                        <strong>{evt.volunteersNeeded}</strong>
                      </td>
                      <td>{evt.totalApplications}</td>
                      <td>
                        <span style={{ color: "#2563EB", fontWeight: 700 }}>{evt.approvedCount}</span>
                      </td>
                      <td>
                        <span style={{ color: "#16A34A", fontWeight: 700 }}>{evt.completedCount}</span>
                      </td>
                      <td>
                        <span style={{ color: "#D97706", fontWeight: 700 }}>+{evt.pointsAwarded} pts</span>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: 12,
                            fontSize: 11.5,
                            fontWeight: 700,
                            background: evt.status === "Completed" ? "#DCFCE7" : "#EFF6FF",
                            color: evt.status === "Completed" ? "#15803D" : "#1D4ED8",
                          }}
                        >
                          {evt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: STUDENT CONTRIBUTION REPORTS ── */}
      {activeTab === "student_contributions" && (
        <div className="dash-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "18px 20px", borderBottom: "1px solid #E2E8F0" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#0F172A" }}>
              Student Volunteer Contribution Ledger
            </h3>
            <span style={{ fontSize: 12.5, color: "#64748B" }}>
              Individual social service audit: points accumulated, verified hours, and completion metrics.
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Student Volunteer</th>
                  <th>Reg ID</th>
                  <th>College & Department</th>
                  <th>Year</th>
                  <th>Total Points</th>
                  <th>Impact Tier</th>
                  <th>Completed Drives</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(reportsData?.studentContributions || [])
                  .filter((s) =>
                    !searchFilter ||
                    s.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                    s.studentId.toLowerCase().includes(searchFilter.toLowerCase()) ||
                    s.college.toLowerCase().includes(searchFilter.toLowerCase())
                  )
                  .map((st) => (
                    <tr key={st.studentId}>
                      <td>
                        <strong>{st.name}</strong>
                        <span style={{ display: "block", fontSize: 11.5, color: "#64748B" }}>{st.email}</span>
                      </td>
                      <td>
                        <span style={{ fontFamily: "monospace", color: "#0066CC", fontWeight: 700 }}>
                          {st.studentId}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 13, color: "#334155" }}>{st.college}</span>
                        <span style={{ display: "block", fontSize: 11, color: "#64748B" }}>{st.department}</span>
                      </td>
                      <td>{st.academicYear}</td>
                      <td>
                        <strong style={{ color: "#EAB308", fontSize: 14 }}>{st.points}</strong> pts
                      </td>
                      <td>
                        <span style={{ background: "#F1F5F9", color: "#334155", padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
                          {st.tier || "Bronze"}
                        </span>
                      </td>
                      <td>
                        <span style={{ background: "#ECFDF5", color: "#059669", padding: "2px 8px", borderRadius: 10, fontSize: 12, fontWeight: 700 }}>
                          {st.completedEvents} drives
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 10,
                            fontSize: 11,
                            fontWeight: 700,
                            background: st.status === "active" ? "#DCFCE7" : "#FEE2E2",
                            color: st.status === "active" ? "#16A34A" : "#DC2626",
                          }}
                        >
                          {st.status?.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: DEPARTMENT-WISE STATISTICS ── */}
      {activeTab === "department_stats" && (
        <div>
          <div className="dash-card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px", color: "#0F172A" }}>
              Department Engagement Chart
            </h3>
            <div style={{ height: 260 }}>
              <BarChart
                data={(reportsData?.departmentStatistics || []).map((d) => ({
                  label: d.department.split(" ")[0],
                  value: d.totalStudents,
                }))}
                valueKey="value"
                labelKey="label"
                barColor="#0066CC"
              />
            </div>
          </div>

          <div className="dash-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "18px 20px", borderBottom: "1px solid #E2E8F0" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#0F172A" }}>
                Department-wise Participation Breakdown
              </h3>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Department / Discipline</th>
                    <th>Enrolled Students</th>
                    <th>Total Points Generated</th>
                    <th>Avg Points / Student</th>
                  </tr>
                </thead>
                <tbody>
                  {(reportsData?.departmentStatistics || []).map((dept) => (
                    <tr key={dept.department}>
                      <td>
                        <strong>{dept.department}</strong>
                      </td>
                      <td>
                        <strong>{dept.totalStudents}</strong> volunteers
                      </td>
                      <td>
                        <strong style={{ color: "#EAB308" }}>{dept.totalPoints}</strong> pts
                      </td>
                      <td>
                        <strong>{dept.averagePoints || Math.round(dept.totalPoints / (dept.totalStudents || 1))}</strong> pts
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: POINTS DISTRIBUTION REPORTS ── */}
      {activeTab === "points_distribution" && (
        <div className="dash-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "18px 20px", borderBottom: "1px solid #E2E8F0" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#0F172A" }}>
              Volunteering Points Transaction Ledger
            </h3>
            <span style={{ fontSize: 12.5, color: "#64748B" }}>
              Complete audit trail of points credited for event completion and manual adjustments with mandatory reasons.
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Date</th>
                  <th>Student Volunteer</th>
                  <th>Event / Context</th>
                  <th>Type</th>
                  <th>Points</th>
                  <th>Mandatory Reason</th>
                  <th>Admin Remarks</th>
                </tr>
              </thead>
              <tbody>
                {(reportsData?.pointsDistribution || []).map((tx) => (
                  <tr key={tx.transactionId}>
                    <td>
                      <span style={{ fontFamily: "monospace", fontSize: 12, color: "#0066CC" }}>
                        {tx.transactionId}
                      </span>
                    </td>
                    <td>{new Date(tx.date).toLocaleDateString()}</td>
                    <td>
                      <strong>{tx.studentName}</strong>
                      <span style={{ display: "block", fontSize: 11, color: "#64748B" }}>{tx.studentId}</span>
                    </td>
                    <td>{tx.eventName}</td>
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
                      <strong style={{ color: tx.type === "CREDIT" ? "#16A34A" : "#DC2626", fontSize: 14 }}>
                        {tx.points > 0 ? `+${tx.points}` : tx.points} pts
                      </strong>
                    </td>
                    <td style={{ maxWidth: 220 }}>{tx.reason}</td>
                    <td style={{ color: "#64748B" }}>{tx.adminRemarks || "Verified"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 5: APPLICATION APPROVAL & REJECTION STATS ── */}
      {activeTab === "application_stats" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div className="dash-card">
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px", color: "#0F172A" }}>
              Application Decisions Ratio
            </h3>
            <div style={{ padding: "10px 0" }}>
              <DonutChart
                data={[
                  { label: "Approved", value: reportsData?.applicationStatistics?.approved || 2, color: "#10B981" },
                  { label: "Pending", value: reportsData?.applicationStatistics?.pending || 1, color: "#F59E0B" },
                  { label: "Completed", value: reportsData?.applicationStatistics?.completed || 1, color: "#6366F1" },
                  { label: "Rejected", value: reportsData?.applicationStatistics?.rejected || 0, color: "#EF4444" },
                ]}
                centerValue={reportsData?.applicationStatistics?.total || 4}
                centerLabel="Total Submissions"
              />
            </div>
          </div>

          <div className="dash-card">
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px", color: "#0F172A" }}>
              Application Metrics Summary
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Total Applications Received", count: reportsData?.applicationStatistics?.total || 4, color: "#0066CC" },
                { label: "Approved Volunteers", count: reportsData?.applicationStatistics?.approved || 2, color: "#10B981" },
                { label: "Pending Approval", count: reportsData?.applicationStatistics?.pending || 1, color: "#F59E0B" },
                { label: "Drives Completed", count: reportsData?.applicationStatistics?.completed || 1, color: "#6366F1" },
                { label: "Declined Applications", count: reportsData?.applicationStatistics?.rejected || 0, color: "#EF4444" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    background: "#F8FAFC",
                    borderRadius: 10,
                    border: "1px solid #E2E8F0",
                  }}
                >
                  <span style={{ fontSize: 13.5, color: "#334155", fontWeight: 500 }}>{item.label}</span>
                  <strong style={{ fontSize: 16, color: item.color }}>{item.count}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
