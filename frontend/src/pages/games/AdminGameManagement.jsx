// frontend/src/pages/games/AdminGameManagement.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Plus, Calendar, Save, CheckCircle2, Clock } from "lucide-react";
import { gamesAPI } from "../../api/gamesAPI";

export default function AdminGameManagement() {
  const [puzzles, setPuzzles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [puzzleNumber, setPuzzleNumber] = useState(164);
  const [wendLetters, setWendLetters] = useState("W, E, D, N");
  const [wendWords, setWendWords] = useState("WEND, NEWS, DENS, WEDS, NEW, DEW, END, WED");
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    fetchPuzzles();
  }, []);

  const fetchPuzzles = async () => {
    try {
      setLoading(true);
      const res = await gamesAPI.getAdminPuzzles();
      const data = res.data || res;
      if (data && data.puzzles) {
        setPuzzles(data.puzzles);
      }
    } catch (err) {
      console.warn("Notice loading admin puzzles:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePuzzle = async (e) => {
    e.preventDefault();
    try {
      const lettersArr = wendLetters.split(",").map((s) => s.trim().toUpperCase());
      const wordsArr = wendWords.split(",").map((s) => s.trim().toUpperCase());

      await gamesAPI.saveAdminPuzzle({
        date: newDate,
        puzzleNumber: parseInt(puzzleNumber, 10),
        wendPuzzle: {
          letters: lettersArr,
          grid: [
            [lettersArr[0] || "W", lettersArr[1] || "E"],
            [lettersArr[2] || "D", lettersArr[3] || "N"],
          ],
          targetWords: wordsArr,
          minWordsToWin: 4,
          parTime: 35,
          maxXP: 100,
        },
      });

      setStatusMsg("Puzzle scheduled successfully!");
      fetchPuzzles();
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err) {
      alert("Failed to save puzzle: " + err.message);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 20px 60px", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <Link
        to="/admin"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#64748B", textDecoration: "none", fontWeight: 700, fontSize: 13.5, marginBottom: 16 }}
      >
        <ArrowLeft size={16} />
        <span>Back to Admin Dashboard</span>
      </Link>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 6px", display: "flex", alignItems: "center", gap: 10 }}>
          <span>Daily Games & Challenge Management</span>
          <Shield size={26} color="#4338CA" />
        </h1>
        <p style={{ color: "#64748B", fontSize: 14.5, margin: 0 }}>
          Configure, schedule and inspect daily common ZIP & WEND puzzles for all users
        </p>
      </div>

      {statusMsg && (
        <div style={{ background: "#DCFCE7", color: "#15803D", padding: "12px 18px", borderRadius: 12, fontWeight: 700, marginBottom: 20 }}>
          {statusMsg}
        </div>
      )}

      {/* Schedule Form */}
      <div style={{ background: "#fff", borderRadius: 20, padding: "24px 28px", border: "1.5px solid #F1F5F9", boxShadow: "0 4px 18px rgba(0,0,0,0.05)", marginBottom: 32 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800 }}>Schedule / Update Daily Puzzle</h3>

        <form onSubmit={handleSavePuzzle} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18 }}>
          <div>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
              Target Date (YYYY-MM-DD)
            </label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #CBD5E1", fontSize: 14, fontWeight: 600 }}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
              Challenge Number (#)
            </label>
            <input
              type="number"
              value={puzzleNumber}
              onChange={(e) => setPuzzleNumber(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #CBD5E1", fontSize: 14, fontWeight: 600 }}
              required
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
              WEND 4 Letters (Comma separated)
            </label>
            <input
              type="text"
              value={wendLetters}
              onChange={(e) => setWendLetters(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #CBD5E1", fontSize: 14 }}
              required
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
              WEND Target Valid Words (Comma separated)
            </label>
            <input
              type="text"
              value={wendWords}
              onChange={(e) => setWendWords(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #CBD5E1", fontSize: 14 }}
              required
            />
          </div>

          <div style={{ gridColumn: "1 / -1", marginTop: 8 }}>
            <button
              type="submit"
              style={{
                background: "linear-gradient(135deg, #0F172A, #312E81)",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "12px 24px",
                fontWeight: 700,
                fontSize: 14.5,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Save size={16} />
              <span>Save & Publish Puzzle</span>
            </button>
          </div>
        </form>
      </div>

      {/* Scheduled Puzzles List */}
      <div style={{ background: "#fff", borderRadius: 20, border: "1.5px solid #F1F5F9", overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", background: "#F8FAFC", borderBottom: "1px solid #F1F5F9", fontWeight: 800, fontSize: 14 }}>
          Published Daily Puzzles
        </div>
        {puzzles.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#94A3B8" }}>
            Automated daily rotation is active. Puzzles seed automatically each morning.
          </div>
        ) : (
          puzzles.map((p, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid #F1F5F9" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800 }}>Challenge #{p.puzzleNumber}</div>
                <div style={{ fontSize: 12.5, color: "#64748B" }}>Date: {p.date}</div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <span style={{ background: "#E0F2FE", color: "#0284C7", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                  ZIP 6×6
                </span>
                <span style={{ background: "#FEF08A", color: "#854D0E", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                  WEND ({p.wendPuzzle?.letters?.join("") || "WEDN"})
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
