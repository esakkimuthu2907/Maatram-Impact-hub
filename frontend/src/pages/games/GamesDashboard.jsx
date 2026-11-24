// frontend/src/pages/games/GamesDashboard.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Flame,
  Trophy,
  Check,
  Zap,
  Clock,
  Sparkles,
  ArrowRight,
  Gift,
  Star,
  ChevronDown,
  ChevronUp,
  History,
  ShieldCheck,
  Award,
} from "lucide-react";
import { gamesAPI } from "../../api/gamesAPI";
import { useApp } from "../../context/AppContext";
import "./GamesDashboard.css";

export default function GamesDashboard() {
  const { user } = useApp();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState(null);
  const [showBadgesList, setShowBadgesList] = useState(false);
  const [pushReminders, setPushReminders] = useState(true);

  useEffect(() => {
    fetchChallenge();
  }, []);

  const fetchChallenge = async () => {
    try {
      setLoading(true);
      const res = await gamesAPI.getDailyChallenge();
      if (res && res.data) {
        setDailyData(res.data);
      } else if (res && res.success) {
        setDailyData(res);
      }
    } catch (err) {
      console.warn("Games data load notice:", err);
      // Fallback local mockup for immediate smooth experience
      setDailyData({
        puzzleNumber: 163,
        date: new Date().toISOString().split("T")[0],
        userProgress: { zipDone: false, wendDone: false, todayXP: 0 },
        streak: {
          currentStreak: 1,
          longestStreak: 4,
          totalXP: 450,
          gamesCompleted: 8,
          weekNodes: [
            { dayLetter: "W", completed: true, isGift: false },
            { dayLetter: "T", completed: false, isGift: false },
            { dayLetter: "F", completed: false, isGift: false },
            { dayLetter: "S", completed: false, isGift: false },
            { dayLetter: "S", completed: false, isGift: false },
            { dayLetter: "M", completed: false, isGift: false },
            { dayLetter: "T", completed: false, isGift: true },
          ],
        },
        community: { totalPlayersToday: 42, avgZipTime: 35, avgWendTime: 30 },
      });
    } finally {
      setLoading(false);
    }
  };

  const streak = dailyData?.streak || {
    currentStreak: 0,
    longestStreak: 0,
    totalXP: 0,
    gamesCompleted: 0,
    weekNodes: [],
  };

  const userProg = dailyData?.userProgress || {
    zipDone: false,
    wendDone: false,
    todayXP: 0,
  };

  const puzzleNo = dailyData?.puzzleNumber || 163;
  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="games-hub-container">
      {/* ─── Top Hero Welcome Banner ─── */}
      <div className="games-header-banner">
        <div className="games-banner-left">
          <h1>
            <span>Maatram Daily Games</span>
            <span style={{ fontSize: 24 }}>✨</span>
          </h1>
          <div style={{ marginTop: 12, fontSize: 13, color: "#ffd629", fontWeight: 700 }}>
            📅 Today: {todayFormatted} • Challenge #{puzzleNo}
          </div>
        </div>

        <div className="games-quick-stats">
          <div className="quick-stat-chip">
            <div className="quick-stat-val">{streak.currentStreak} 🔥</div>
            <div className="quick-stat-lbl">Win Streak</div>
          </div>
          <div className="quick-stat-chip">
            <div className="quick-stat-val">{streak.totalXP}</div>
            <div className="quick-stat-lbl">Total XP</div>
          </div>
          <div className="quick-stat-chip">
            <div className="quick-stat-val">{streak.gamesCompleted}</div>
            <div className="quick-stat-lbl">Completed</div>
          </div>
        </div>
      </div>

      {/* ─── 7-Day Streak Tracker (Matches Screenshot 1) ─── */}
      <div className="streak-tracker-card">
        <div className="streak-card-top">
          <h2 className="streak-title-heading">
            <span>{streak.currentStreak}-day win streak</span>
            <span className="streak-flame-icon">🔥</span>
          </h2>
          <div className="streak-longest-badge">
            Longest streak: {Math.max(streak.longestStreak, streak.currentStreak)} days
          </div>
        </div>

        {/* 7-node row */}
        <div className="week-nodes-row">
          <div className="week-nodes-line"></div>
          {(streak.weekNodes && streak.weekNodes.length > 0
            ? streak.weekNodes
            : [
              { dayLetter: "W", completed: streak.currentStreak >= 1 },
              { dayLetter: "T", completed: streak.currentStreak >= 2 },
              { dayLetter: "F", completed: streak.currentStreak >= 3 },
              { dayLetter: "S", completed: streak.currentStreak >= 4 },
              { dayLetter: "S", completed: streak.currentStreak >= 5 },
              { dayLetter: "M", completed: streak.currentStreak >= 6 },
              { dayLetter: "T", completed: streak.currentStreak >= 7, isGift: true },
            ]
          ).map((node, idx) => (
            <div key={idx} className="week-node-col">
              <span className="week-node-day">{node.dayLetter}</span>
              <div
                className={`week-node-circle ${node.completed ? "completed" : ""
                  } ${node.isGift || idx === 6 ? "gift-node" : ""} ${node.completed && (node.isGift || idx === 6) ? "unlocked" : ""
                  }`}
              >
                {node.isGift || idx === 6 ? (
                  "🎁"
                ) : node.completed ? (
                  <Check size={20} strokeWidth={3} />
                ) : (
                  ""
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Yellow Callout for 7-day bonus */}
        <div className="streak-callout-bubble">
          <div className="callout-gift-img">🎁</div>
          <p className="callout-text">
            Unlock a bonus Zip puzzle after 7 wins in a row! Keep your streak burning daily.
          </p>
        </div>

        {/* Badges preview row */}
        <div
          className="badges-collapsible-row"
          onClick={() => setShowBadgesList(!showBadgesList)}
        >
          <div className="badges-row-left">Badges</div>
          <div className="badges-row-stars">
            <Star size={20} fill="#E2E8F0" color="#94A3B8" />
            <Star size={20} fill="#E2E8F0" color="#94A3B8" />
            <Trophy size={20} color="#94A3B8" />
            {showBadgesList ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>

        {showBadgesList && (
          <div
            style={{
              padding: "12px 6px",
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              borderTop: "1px dashed #e2e8f0",
              marginTop: 6,
            }}
          >
            <div
              style={{
                fontSize: 13,
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>🚀 First Step</span> • <span>🔥 3-Day Flame</span> •{" "}
              <span>⚡ Speed Zipper</span> • <span>🏆 Dual Champion</span>
            </div>
            <Link
              to="/games/badges"
              style={{
                fontSize: 12.5,
                color: "#4338ca",
                fontWeight: 700,
                textDecoration: "none",
                marginLeft: "auto",
              }}
            >
              View All Badges →
            </Link>
          </div>
        )}

        {/* Stay tuned row (matches Screenshot 1) */}
        <div className="stay-tuned-row">
          <div>
            <h4 className="stay-tuned-title">Stay tuned</h4>
            <p className="stay-tuned-subtitle">Get daily push reminders + follow the Zip page</p>
          </div>
          <label className="switch-toggle">
            <input
              type="checkbox"
              checked={pushReminders}
              onChange={() => setPushReminders(!pushReminders)}
            />
            <span className="slider-round"></span>
          </label>
        </div>
      </div>

      {/* ─── Available Games Today ─── */}
      <div className="section-heading-row">
        <h2>Today's Daily Common Challenges</h2>
        <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>
          Same puzzles for all Maatram members worldwide
        </span>
      </div>

      <div className="games-grid">
        {/* ZIP GAME CARD (Screenshot 2 Inspiration) */}
        <div className="game-card">
          <div
            className={`game-card-badge ${userProg.zipDone ? "badge-completed" : "badge-pending"
              }`}
          >
            {userProg.zipDone ? "Completed ✓" : "Ready to Play"}
          </div>

          <div>
            <div className="game-card-icon-wrap zip-icon-bg">
              <span>🔢</span>
            </div>
            <div className="game-card-info">
              <h3>ZIP #{puzzleNo}</h3>
              <p>
                Connect numbered dots 1 through 8 in strict numerical order and fill every single
                cell in the 6×6 grid with one continuous path!
              </p>
            </div>

            <div className="game-card-meta">
              <div className="meta-item">
                <Clock size={16} color="#0284c7" />
                <span>Par: 0:45</span>
              </div>
              <div className="meta-item">
                <Zap size={16} color="#f59e0b" />
                <span>+100 XP</span>
              </div>
              <div className="meta-item">
                <Sparkles size={16} color="#8b5cf6" />
                <span>Streak Eligible</span>
              </div>
            </div>
          </div>

          <Link
            to="/games/zip"
            className={`play-game-btn ${userProg.zipDone ? "completed-btn" : ""}`}
          >
            {userProg.zipDone ? "Replay ZIP (Practice)" : "Play ZIP Challenge"}
            <ArrowRight size={18} />
          </Link>
        </div>

        {/* WEND GAME CARD (Screenshot 3 Inspiration) */}
        <div className="game-card">
          <div
            className={`game-card-badge ${userProg.wendDone ? "badge-completed" : "badge-pending"
              }`}
          >
            {userProg.wendDone ? "Completed ✓" : "Ready to Play"}
          </div>

          <div>
            <div className="game-card-icon-wrap wend-icon-bg">
              <span>🔤</span>
            </div>
            <div className="game-card-info">
              <h3>WEND #{puzzleNo}</h3>
              <p>
                Form words connecting adjacent letters in a 2×2 grid! Find the required anagrams
                and beat today's community average time.
              </p>
            </div>

            <div className="game-card-meta">
              <div className="meta-item">
                <Clock size={16} color="#0284c7" />
                <span>Par: 0:35</span>
              </div>
              <div className="meta-item">
                <Zap size={16} color="#f59e0b" />
                <span>+100 XP</span>
              </div>
              <div className="meta-item">
                <Sparkles size={16} color="#8b5cf6" />
                <span>+50 Bonus Dual</span>
              </div>
            </div>
          </div>

          <Link
            to="/games/wend"
            className={`play-game-btn ${userProg.wendDone ? "completed-btn" : ""}`}
          >
            {userProg.wendDone ? "Replay WEND (Practice)" : "Play WEND Challenge"}
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>

      {/* ─── Navigation Shortcuts to other Games pages ─── */}
      <div className="section-heading-row">
        <h2>Games Hub Navigation</h2>
      </div>

      <div className="hub-subnav-grid">
        <Link to="/games/leaderboard" className="subnav-box">
          <div className="subnav-icon-circle" style={{ color: "#f59e0b" }}>
            <Trophy size={20} />
          </div>
          <div>
            <div>Leaderboard</div>
            <div style={{ fontSize: 11.5, color: "#94a3b8", fontWeight: 500 }}>
              Rankings & Speeds
            </div>
          </div>
        </Link>

        <Link to="/games/badges" className="subnav-box">
          <div className="subnav-icon-circle" style={{ color: "#8b5cf6" }}>
            <Award size={20} />
          </div>
          <div>
            <div>Badges & Awards</div>
            <div style={{ fontSize: 11.5, color: "#94a3b8", fontWeight: 500 }}>
              Milestones & Trophies
            </div>
          </div>
        </Link>

        <Link to="/games/history" className="subnav-box">
          <div className="subnav-icon-circle" style={{ color: "#0284c7" }}>
            <History size={20} />
          </div>
          <div>
            <div>Game History</div>
            <div style={{ fontSize: 11.5, color: "#94a3b8", fontWeight: 500 }}>
              Past Scores & Stats
            </div>
          </div>
        </Link>

        <Link to="/games/profile" className="subnav-box">
          <div className="subnav-icon-circle" style={{ color: "#10b981" }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <div>Player Profile</div>
            <div style={{ fontSize: 11.5, color: "#94a3b8", fontWeight: 500 }}>
              Performance & Streaks
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
