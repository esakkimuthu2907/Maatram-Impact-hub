// frontend/src/pages/games/UserGameProfile.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, User, Flame, Trophy, Award, Zap, Clock, ShieldCheck } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { gamesAPI } from "../../api/gamesAPI";

export default function UserGameProfile() {
  const { user } = useApp();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await gamesAPI.getDailyChallenge();
        const data = res.data || res;
        if (data && data.streak) {
          setProfile(data.streak);
        }
      } catch (err) {
        console.warn("Using sample profile:", err);
      }
    }
    load();
  }, []);

  const streak = profile || {
    currentStreak: 1,
    longestStreak: 4,
    totalXP: 450,
    gamesCompleted: 8,
    zipCompleted: 4,
    wendCompleted: 4,
    bestZipTime: 12,
    bestWendTime: 24,
    unlockedBadges: [],
  };

  const level = Math.floor(streak.totalXP / 200) + 1;
  const nextLevelXP = level * 200;
  const currentLevelProgress = streak.totalXP % 200;

  return (
    <div style={{ maxWidth: 840, margin: "0 auto", padding: "24px 20px 60px", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <Link
        to="/games"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#64748B", textDecoration: "none", fontWeight: 700, fontSize: 13.5, marginBottom: 16 }}
      >
        <ArrowLeft size={16} />
        <span>Back to Games Hub</span>
      </Link>

      {/* Profile Card */}
      <div
        style={{
          background: "linear-gradient(135deg, #0F172A, #1E1B4B)",
          borderRadius: 24,
          padding: "32px",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 24,
          flexWrap: "wrap",
          marginBottom: 28,
        }}
      >
        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: "50%",
            background: "#ffd629",
            color: "#0F172A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 34,
            fontWeight: 900,
            boxShadow: "0 8px 24px rgba(255, 214, 41, 0.3)",
          }}
        >
          {user?.profilePicture ? (
            <img src={user.profilePicture} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%" }} />
          ) : (
            user?.name?.charAt(0) || "M"
          )}
        </div>

        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>{user?.name || "Maatram Player"}</h2>
            <span style={{ background: "#F59E0B", color: "#000", padding: "3px 10px", borderRadius: 14, fontSize: 11.5, fontWeight: 800 }}>
              Level {level}
            </span>
          </div>
          <p style={{ margin: "0 0 14px", color: "#94A3B8", fontSize: 13.5 }}>
            {user?.college || "Maatram Foundation"} • Daily Challenge Competitor
          </p>

          {/* Level progress bar */}
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 10, height: 8, overflow: "hidden", maxWidth: 380, marginBottom: 6 }}>
            <div
              style={{
                background: "linear-gradient(90deg, #FFD629, #F59E0B)",
                height: "100%",
                width: `${(currentLevelProgress / 200) * 100}%`,
              }}
            />
          </div>
          <div style={{ fontSize: 11.5, color: "#CBD5E1" }}>
            {currentLevelProgress} / 200 XP to Level {level + 1}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 32 }}>
        <div style={{ background: "#fff", padding: "20px", borderRadius: 20, border: "1.5px solid #F1F5F9", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, color: "#F59E0B" }}>
            <Flame size={24} />
            <span style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", color: "#64748B" }}>Win Streak</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#0F172A" }}>{streak.currentStreak} Days</div>
          <div style={{ fontSize: 12, color: "#94A3B8" }}>Longest: {streak.longestStreak} Days</div>
        </div>

        <div style={{ background: "#fff", padding: "20px", borderRadius: 20, border: "1.5px solid #F1F5F9", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, color: "#10B981" }}>
            <Zap size={24} />
            <span style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", color: "#64748B" }}>Total Gaming XP</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#0F172A" }}>{streak.totalXP} XP</div>
          <div style={{ fontSize: 12, color: "#94A3B8" }}>Earned across all daily puzzles</div>
        </div>

        <div style={{ background: "#fff", padding: "20px", borderRadius: 20, border: "1.5px solid #F1F5F9", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, color: "#0284C7" }}>
            <Trophy size={24} />
            <span style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", color: "#64748B" }}>Completed Games</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#0F172A" }}>{streak.gamesCompleted}</div>
          <div style={{ fontSize: 12, color: "#94A3B8" }}>{streak.zipCompleted || 0} ZIP • {streak.wendCompleted || 0} WEND</div>
        </div>
      </div>
    </div>
  );
}
