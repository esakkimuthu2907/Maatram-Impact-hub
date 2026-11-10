// frontend/src/pages/admin/AdminReportsPage.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  BarChart2,
  FileSpreadsheet,
  FileText,
  Filter,
  RefreshCw,
  Search,
  Trophy,
  Medal,
  Star,
  ArrowUpRight,
  GraduationCap,
  Layers,
  PieChart,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { adminAPI } from "../../api/adminAPI";
import BarChart from "../../components/charts/BarChart";
import DonutChart from "../../components/charts/DonutChart";
import "../student/StudentDashboard.css";
import "./AdminEventsPage.css";

const COLLEGES = [
  "All Colleges",
  "Velammal Engineering College, Chennai",
  "College of Engineering Guindy (CEG)",
  "Madras Institute of Technology (MIT)",
  "Anna University, Chennai",
];

const TABS = [
  { id: "event_participation", label: "Event Participation", icon: <Calendar size={15} /> },
  { id: "student_contributions", label: "Student Contributions", icon: <Users size={15} /> },
  { id: "department_stats", label: "Department Stats", icon: <Layers size={15} /> },
  { id: "points_distribution", label: "Points Distribution", icon: <Award size={15} /> },
  { id: "application_stats", label: "Application Stats", icon: <PieChart size={15} /> },
];

const RANK_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];
const RANK_ICONS = ["🥇", "🥈", "🥉"];

function downloadCSV(rows, filename) {
  if (!rows || rows.length === 0) return;
  const header = Object.keys(rows[0]).join(",");
  const body = rows.map((r) =>
    Object.values(r).map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")
  );
  const csv = [header, ...body].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminReportsPage() {
  const { user, showToast } = useApp();
  const [activeTab, setActiveTab] = useState("event_participation");
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");
  const [collegeFilter, setCollegeFilter] = useState("All Colleges");

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getReports();
      if (res && res.data) setReportsData(res.data);
    } catch (err) {
      console.warn("Could not load reports:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReports(); }, []);

  // --- Export handlers ---
  const handleExport = () => {
    if (!reportsData) { showToast("No data to export", "error"); return; }
    const tab = activeTab;
    const ts = new Date().toISOString().slice(0, 10);

    if (tab === "event_participation") {
      const rows = (reportsData.eventParticipation || []).map((e) => ({
        "Event Title": e.eventTitle,
        "Category": e.category,
        "Date": e.date,
        "Volunteers Needed": e.volunteersNeeded,
        "Applications": e.applicationsReceived,
        "Approved": e.approvedVolunteers,
        "Completion %": e.completionRate,
      }));
      downloadCSV(rows, `Maatram_Event_Participation_${ts}.csv`);
    } else if (tab === "student_contributions") {
      const rows = filtered(reportsData.studentContributions || []).map((s) => ({
        "Name": s.fullName,
        "College": s.college,
        "Department": s.department,
        "Points": s.points,
        "Hours": s.totalHours,
        "Events Joined": s.eventsJoined,
        "Status": s.status,
      }));
      downloadCSV(rows, `Maatram_Student_Contributions_${ts}.csv`);
    } else if (tab === "department_stats") {
      const rows = (reportsData.departmentStatistics || []).map((d) => ({
        "Department": d.department,
        "Students": d.totalStudents,
        "Total Points": d.totalPoints,
        "Total Hours": d.totalHours,
        "Avg Points": d.averagePoints,
      }));
      downloadCSV(rows, `Maatram_Department_Stats_${ts}.csv`);
    } else if (tab === "points_distribution") {
      const rows = (reportsData.pointsDistribution || []).map((p) => ({
        "Student": p.studentName,
        "Event": p.eventName,
        "Points": p.points,
        "Type": p.type,
        "Reason": p.reason,
        "Date": p.date,
      }));
      downloadCSV(rows, `Maatram_Points_Distribution_${ts}.csv`);
    } else if (tab === "college_leaderboard") {
      const rows = (reportsData.collegeLeaderboard || []).map((c) => ({
        "Rank": c.rank,
        "College": c.college,
        "Students": c.totalStudents,
        "Total Points": c.totalPoints,
        "Total Hours": c.totalHours,
        "Avg Points": c.averagePoints,
      }));
      downloadCSV(rows, `Maatram_College_Leaderboard_${ts}.csv`);
    } else if (tab === "application_stats") {
      const stats = reportsData.applicationStatistics || {};
      const rows = [
        { "Metric": "Total Applications", "Value": stats.total || 0 },
        { "Metric": "Pending", "Value": stats.pending || 0 },
        { "Metric": "Approved", "Value": stats.approved || 0 },
        { "Metric": "Rejected", "Value": stats.rejected || 0 },
        { "Metric": "Completed", "Value": stats.completed || 0 },
      ];
      downloadCSV(rows, `Maatram_Application_Stats_${ts}.csv`);
    }
    showToast("CSV exported successfully!", "success");
  };

  const handlePrint = () => window.print();

  const filtered = (arr = []) => {
    let data = arr;
    if (collegeFilter !== "All Colleges") {
      data = data.filter((r) =>
        (r.college || "").toLowerCase().includes(collegeFilter.toLowerCase().slice(0, 10))
      );
    }
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      data = data.filter((r) =>
        Object.values(r).some((v) => String(v).toLowerCase().includes(q))
      );
    }
    return data;
  };

  const summary = reportsData?.summary || {};
  const appStats = reportsData?.applicationStatistics || {};

  // ---- Stat Cards (All Real-time, defaulting to 0)
  const summaryCards = [
    { label: "Total Students", value: summary.totalStudents ?? 0, icon: <Users size={22} />, color: "#4F46E5", bg: "#EEF2FF" },
    { label: "Total Hours", value: summary.totalHours ?? 0, icon: <Clock size={22} />, color: "#0369A1", bg: "#E0F2FE", suffix: "hrs" },
    { label: "Total Points", value: summary.totalPoints ?? 0, icon: <Award size={22} />, color: "#B45309", bg: "#FEF3C7", suffix: "pts" },
    { label: "Total Applications", value: summary.totalApplications ?? 0, icon: <FileText size={22} />, color: "#059669", bg: "#D1FAE5" },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 320, gap: 16 }}>
        <div style={{ width: 48, height: 48, border: "4px solid #E0E7FF", borderTopColor: "#4F46E5", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "#6366F1", fontWeight: 600, fontSize: 15 }}>Loading Impact Reports…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 20px", maxWidth: 1200, margin: "0 auto" }}>

      {/* ── HERO BANNER ── */}
      <div style={{
        background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)",
        borderRadius: 20,
        padding: "32px 36px",
        marginBottom: 28,
        position: "relative",
        overflow: "hidden",
      }}>
        {/* decorative circles */}
        <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "absolute", bottom: -20, left: "40%", width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, position: "relative" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "6px 10px", display: "flex" }}>
                <BarChart2 size={20} color="#A5B4FC" />
              </div>
              <span style={{ color: "#A5B4FC", fontWeight: 600, fontSize: 13, letterSpacing: 1 }}>MAATRAM IMPACT HUB</span>
            </div>
            <h1 style={{ color: "#fff", margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>
              Volunteering Impact Reports
            </h1>
            <p style={{ color: "#C7D2FE", margin: "6px 0 0", fontSize: 14 }}>
              Real-time analytics • College-wise leaderboard • Full CSV export
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handlePrint} style={heroBtnStyle("#FFFFFF22", "#fff")}>
              <Printer size={15} /> Print
            </button>
            <button onClick={handleExport} style={heroBtnStyle("#22C55E", "#fff")}>
              <Download size={15} /> Export CSV
            </button>
            <button onClick={loadReports} style={heroBtnStyle("#FFFFFF15", "#A5B4FC")}>
              <RefreshCw size={15} /> Refresh
            </button>
          </div>
        </div>

        {/* Summary KPI chips */}
        <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
          {summaryCards.map((s) => (
            <div key={s.label} style={{
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(10px)",
              borderRadius: 14,
              padding: "12px 20px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              border: "1px solid rgba(255,255,255,0.15)",
              minWidth: 160,
            }}>
              <div style={{ background: s.bg, borderRadius: 8, padding: 8, display: "flex", color: s.color }}>
                {s.icon}
              </div>
              <div>
                <div style={{ color: "#E0E7FF", fontSize: 11, fontWeight: 600, marginBottom: 2 }}>{s.label}</div>
                <div style={{ color: "#fff", fontSize: 22, fontWeight: 800 }}>
                  {s.value}<span style={{ fontSize: 13, fontWeight: 500, marginLeft: 3, color: "#C7D2FE" }}>{s.suffix || ""}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FILTER ROW ── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
          <input
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search in current tab…"
            style={inputStyle}
          />
        </div>
        {/* College Filter — only for student_contributions */}
        {activeTab === "student_contributions" && (
          <div style={{ position: "relative" }}>
            <Filter size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#6366F1", pointerEvents: "none" }} />
            <select
              value={collegeFilter}
              onChange={(e) => setCollegeFilter(e.target.value)}
              style={{ ...inputStyle, paddingLeft: 32, minWidth: 240 }}
            >
              {COLLEGES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* ── TABS ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setActiveTab(t.id); setSearchFilter(""); }}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 18px", borderRadius: 50,
              border: activeTab === t.id ? "2px solid #4F46E5" : "2px solid #E2E8F0",
              background: activeTab === t.id ? "linear-gradient(135deg,#4F46E5,#7C3AED)" : "#fff",
              color: activeTab === t.id ? "#fff" : "#475569",
              fontWeight: 600, fontSize: 13, cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: activeTab === t.id ? "0 4px 15px rgba(79,70,229,0.3)" : "none",
            }}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ── */}
      {activeTab === "event_participation" && (
        <EventParticipationTab data={reportsData?.eventParticipation || []} search={searchFilter} />
      )}
      {activeTab === "student_contributions" && (
        <StudentContributionsTab data={filtered(reportsData?.studentContributions || [])} />
      )}
      {activeTab === "department_stats" && (
        <DepartmentStatsTab data={filtered(reportsData?.departmentStatistics || [])} />
      )}
      {activeTab === "points_distribution" && (
        <PointsDistributionTab data={filtered(reportsData?.pointsDistribution || [])} />
      )}
      {activeTab === "application_stats" && (
        <ApplicationStatsTab stats={appStats} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────

function SectionCard({ title, icon, children, action }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden", marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
      <div style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#fff" }}>
          {icon}
          <span style={{ fontWeight: 700, fontSize: 15 }}>{title}</span>
        </div>
        {action}
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  );
}

function EmptyState({ message = "No data available" }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 20px", color: "#94A3B8" }}>
      <Sparkles size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
      <p style={{ fontWeight: 600, fontSize: 15 }}>{message}</p>
    </div>
  );
}

// ── Tab 1: Event Participation
function EventParticipationTab({ data, search }) {
  const q = search.toLowerCase();
  const rows = data.filter((r) =>
    !q || Object.values(r).some((v) => String(v).toLowerCase().includes(q))
  );
  return (
    <SectionCard title="Event-wise Participation" icon={<Calendar size={18} />}>
      {rows.length === 0 ? <EmptyState message="No events recorded yet" /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                {["#", "Event Title", "Category", "Date", "Volunteers Needed", "Applications", "Approved", "Completion %"].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((e, i) => (
                <tr key={i} style={rowStyle(i)}>
                  <td style={tdStyle}><span style={badgeStyle("#EEF2FF", "#4F46E5")}>{i + 1}</span></td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: "#1E293B" }}>{e.eventTitle}</td>
                  <td style={tdStyle}><span style={badgeStyle("#F0FDF4", "#16A34A")}>{e.category}</span></td>
                  <td style={{ ...tdStyle, color: "#64748B" }}>{e.date}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>{e.volunteersNeeded}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}><span style={badgeStyle("#EFF6FF", "#1D4ED8")}>{e.applicationsReceived}</span></td>
                  <td style={{ ...tdStyle, textAlign: "center" }}><span style={badgeStyle("#F0FDF4", "#16A34A")}>{e.approvedVolunteers}</span></td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <span style={badgeStyle(Number(e.completionRate) >= 100 ? "#F0FDF4" : "#FEF3C7", Number(e.completionRate) >= 100 ? "#15803D" : "#B45309")}>
                      {e.completionRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

// ── Tab 2: Student Contributions
function StudentContributionsTab({ data }) {
  return (
    <SectionCard title="Student Contribution Reports" icon={<Users size={18} />}>
      {data.length === 0 ? <EmptyState message="No students found" /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                {["#", "Name", "College", "Department", "Points", "Hours", "Events", "Status"].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((s, i) => (
                <tr key={i} style={rowStyle(i)}>
                  <td style={tdStyle}><span style={badgeStyle("#EEF2FF", "#4F46E5")}>{i + 1}</span></td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: "#1E293B" }}>{s.fullName}</td>
                  <td style={{ ...tdStyle, color: "#475569", fontSize: 12 }}>{s.college}</td>
                  <td style={tdStyle}><span style={badgeStyle("#F5F3FF", "#7C3AED")}>{s.department}</span></td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <span style={badgeStyle("#FEF3C7", "#B45309")}>{s.points} pts</span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <span style={badgeStyle("#E0F2FE", "#0369A1")}>{s.totalHours} hrs</span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>{s.eventsJoined}</td>
                  <td style={tdStyle}>
                    <span style={badgeStyle(s.status === "active" ? "#F0FDF4" : "#F1F5F9", s.status === "active" ? "#16A34A" : "#64748B")}>
                      {s.status === "active" ? "● Active" : s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

// ── Tab 3: Department Stats
function DepartmentStatsTab({ data }) {
  const chartData = data.map((d) => ({ label: d.department, value: d.totalPoints }));
  return (
    <>
      <SectionCard title="Department-wise Statistics" icon={<Layers size={18} />}>
        {data.length === 0 ? <EmptyState message="No department data" /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {["Department", "Students", "Total Points", "Total Hours", "Avg Points/Student"].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((d, i) => (
                  <tr key={i} style={rowStyle(i)}>
                    <td style={{ ...tdStyle, fontWeight: 700, color: "#1E293B" }}>{d.department}</td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>{d.totalStudents}</td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <span style={badgeStyle("#FEF3C7", "#B45309")}>{d.totalPoints} pts</span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <span style={badgeStyle("#E0F2FE", "#0369A1")}>{d.totalHours} hrs</span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>{d.averagePoints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
      {chartData.length > 0 && (
        <SectionCard title="Points by Department (Chart)" icon={<BarChart2 size={18} />}>
          <BarChart data={chartData} />
        </SectionCard>
      )}
    </>
  );
}

// ── Tab 4: Points Distribution
function PointsDistributionTab({ data }) {
  return (
    <SectionCard title="Points Distribution Records" icon={<Award size={18} />}>
      {data.length === 0 ? (
        <EmptyState message="No points transactions recorded yet" />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                {["#", "Student Name", "Event", "Points", "Type", "Reason", "Date"].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((p, i) => (
                <tr key={i} style={rowStyle(i)}>
                  <td style={tdStyle}><span style={badgeStyle("#EEF2FF", "#4F46E5")}>{i + 1}</span></td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: "#1E293B" }}>{p.studentName}</td>
                  <td style={{ ...tdStyle, color: "#475569", fontSize: 12 }}>{p.eventName}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <span style={{ ...badgeStyle("#FEF3C7", "#B45309"), fontWeight: 800 }}>+{p.points}</span>
                  </td>
                  <td style={tdStyle}><span style={badgeStyle("#F5F3FF", "#7C3AED")}>{p.type}</span></td>
                  <td style={{ ...tdStyle, color: "#64748B", fontSize: 12 }}>{p.reason}</td>
                  <td style={{ ...tdStyle, color: "#64748B", fontSize: 12 }}>{p.date ? new Date(p.date).toLocaleDateString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

// ── Tab 5: Application Stats
function ApplicationStatsTab({ stats }) {
  const cards = [
    { label: "Total Applications", value: stats.total || 0, color: "#4F46E5", bg: "#EEF2FF", icon: <FileText size={22} /> },
    { label: "Pending Review", value: stats.pending || 0, color: "#B45309", bg: "#FEF3C7", icon: <Clock size={22} /> },
    { label: "Approved", value: stats.approved || 0, color: "#16A34A", bg: "#F0FDF4", icon: <CheckCircle2 size={22} /> },
    { label: "Rejected", value: stats.rejected || 0, color: "#DC2626", bg: "#FEF2F2", icon: <TrendingUp size={22} /> },
    { label: "Completed", value: stats.completed || 0, color: "#0369A1", bg: "#E0F2FE", icon: <Star size={22} /> },
  ];
  const donutData = [
    { label: "Approved", value: stats.approved || 0 },
    { label: "Pending", value: stats.pending || 0 },
    { label: "Completed", value: stats.completed || 0 },
    { label: "Rejected", value: stats.rejected || 0 },
  ];
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 16, marginBottom: 24 }}>
        {cards.map((c) => (
          <div key={c.label} style={{ background: "#fff", borderRadius: 16, padding: "20px 20px 16px", border: `2px solid ${c.bg}`, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <div style={{ background: c.bg, borderRadius: 10, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", color: c.color, marginBottom: 12 }}>
              {c.icon}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B", marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>
      {(stats.total || 0) > 0 && (
        <SectionCard title="Applications Breakdown" icon={<PieChart size={18} />}>
          <DonutChart data={donutData} />
        </SectionCard>
      )}
    </>
  );
}

// ─── Shared Styles ───
const tableStyle = { width: "100%", borderCollapse: "collapse", fontSize: 13 };
const thStyle = {
  textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 700,
  color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5,
  borderBottom: "2px solid #E2E8F0", background: "#F8FAFC",
};
const tdStyle = { padding: "12px 14px", borderBottom: "1px solid #F1F5F9", verticalAlign: "middle" };
const rowStyle = (i) => ({ background: i % 2 === 0 ? "#fff" : "#FAFBFF" });
const badgeStyle = (bg, color) => ({
  display: "inline-flex", alignItems: "center", padding: "3px 10px",
  borderRadius: 20, fontSize: 12, fontWeight: 600, background: bg, color,
});
const inputStyle = {
  width: "100%", padding: "10px 14px 10px 36px", border: "1.5px solid #E2E8F0",
  borderRadius: 10, fontSize: 13, background: "#F8FAFC", outline: "none",
  boxSizing: "border-box",
};
const heroBtnStyle = (bg, color) => ({
  display: "flex", alignItems: "center", gap: 7, padding: "9px 18px",
  borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13,
  background: bg, color, transition: "opacity 0.2s",
});
const smallLinkBtn = (bg, color) => ({
  display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 12px",
  borderRadius: 8, fontSize: 12, fontWeight: 600, background: bg, color,
  textDecoration: "none", border: `1px solid ${color}22`,
});
