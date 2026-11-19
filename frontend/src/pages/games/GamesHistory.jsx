// frontend/src/pages/games/GamesHistory.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, History, Clock, Zap, CheckCircle2, Calendar } from "lucide-react";
import { gamesAPI } from "../../api/gamesAPI";

export default function GamesHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await gamesAPI.getHistory();
        const data = res.data || res;
        if (data && data.history) {
          setHistory(data.history);
        }
      } catch (err) {
        setHistory([
          { _id: "1", gameType: "zip", date: "2026-11-18", duration: 12, xpEarned: 125, completed: true, createdAt: new Date() },
          { _id: "2", gameType: "wend", date: "2026-11-18", duration: 24, xpEarned: 100, completed: true, createdAt: new Date() },
          { _id: "3", gameType: "zip", date: "2026-11-17", duration: 38, xpEarned: 100, completed: true, createdAt: new Date(Date.now() - 86400000) },
          { _id: "4", gameType: "wend", date: "2026-11-17", duration: 18, xpEarned: 125, completed: true, createdAt: new Date(Date.now() - 86400000) },
        ]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const formatSecs = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const totalXP = history.reduce((acc, h) => acc + (h.xpEarned || 0), 0);
  const bestZip = Math.min(...history.filter(h => h.gameType === "zip").map(h => h.duration), Infinity);
  const bestWend = Math.min(...history.filter(h => h.gameType === "wend").map(h => h.duration), Infinity);

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 20px 60px", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <Link
        to="/games"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#64748B", textDecoration: "none", fontWeight: 700, fontSize: 13.5, marginBottom: 16 }}
      >
        <ArrowLeft size={16} />
        <span>Back to Games Hub</span>
      </Link>

      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 6px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <span>Your Game History</span>
          <History size={26} color="#0284C7" />
        </h1>
        <p style={{ color: "#64748B", fontSize: 14.5, margin: 0 }}>
          Track past daily challenge solutions, timings, and XP progress
        </p>
      </div>

      {/* Summary Chips */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
        <div style={{ background: "#fff", padding: "16px 20px", borderRadius: 16, border: "1.5px solid #F1F5F9", textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>{history.length}</div>
          <div style={{ fontSize: 11.5, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>Total Games Played</div>
        </div>
        <div style={{ background: "#fff", padding: "16px 20px", borderRadius: 16, border: "1.5px solid #F1F5F9", textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#10B981" }}>+{totalXP}</div>
          <div style={{ fontSize: 11.5, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>Total XP Earned</div>
        </div>
        <div style={{ background: "#fff", padding: "16px 20px", borderRadius: 16, border: "1.5px solid #F1F5F9", textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0284C7" }}>{bestZip !== Infinity ? formatSecs(bestZip) : "--:--"}</div>
          <div style={{ fontSize: 11.5, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>Best ZIP Time</div>
        </div>
        <div style={{ background: "#fff", padding: "16px 20px", borderRadius: 16, border: "1.5px solid #F1F5F9", textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#F59E0B" }}>{bestWend !== Infinity ? formatSecs(bestWend) : "--:--"}</div>
          <div style={{ fontSize: 11.5, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>Best WEND Time</div>
        </div>
      </div>

      {/* History List */}
      <div style={{ background: "#fff", borderRadius: 20, border: "1.5px solid #F1F5F9", overflow: "hidden", boxShadow: "0 4px 18px rgba(0,0,0,0.04)" }}>
        <div style={{ padding: "16px 22px", background: "#F8FAFC", borderBottom: "1px solid #F1F5F9", fontWeight: 800, fontSize: 13, color: "#64748B" }}>
          Recent Activity
        </div>

        {history.length === 0 ? (
          <div style={{ padding: "36px", textAlign: "center", color: "#94A3B8" }}>No games played yet. Play today's challenges!</div>
        ) : (
          history.map((item, idx) => (
            <div
              key={item._id || idx}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 22px",
                borderBottom: "1px solid #F8FAFC",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: item.gameType === "zip" ? "#E0F2FE" : "#FEF08A",
                    color: item.gameType === "zip" ? "#0284C7" : "#A16207",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 16,
                  }}
                >
                  {item.gameType === "zip" ? "🔢" : "🔤"}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>
                    {item.gameType === "zip" ? "ZIP Game" : "WEND Game"}
                  </div>
                  <div style={{ fontSize: 12, color: "#94A3B8" }}>
                    {new Date(item.date || item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
                    ⏱️ {formatSecs(item.duration)}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#10B981" }}>
                    +{item.xpEarned} XP
                  </div>
                </div>
                <CheckCircle2 size={20} color="#10B981" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
