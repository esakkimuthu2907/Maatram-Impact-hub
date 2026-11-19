// frontend/src/pages/games/GamesBadges.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Award, Flame, Zap, Trophy, Crown, Gift, Rocket, Sparkles, Check } from "lucide-react";
import { gamesAPI } from "../../api/gamesAPI";

const ICON_MAP = {
  Rocket,
  Flame,
  Gift,
  Crown,
  Zap,
  Sparkles,
  Trophy,
};

export default function GamesBadges() {
  const [badges, setBadges] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function load() {
      try {
        const res = await gamesAPI.getBadges();
        const data = res.data || res;
        if (data && data.badges) {
          setBadges(data.badges);
        }
      } catch (err) {
        setBadges([
          { id: "first_game", name: "First Step", description: "Completed your first daily game puzzle", icon: "Rocket", xpReward: 50, isUnlocked: true },
          { id: "streak_3", name: "Streak Novice", description: "Maintained a 3-day win streak", icon: "Flame", xpReward: 100, isUnlocked: true },
          { id: "streak_7", name: "Week Warrior", description: "Achieved a full 7-day win streak & unlocked bonus puzzle!", icon: "Gift", xpReward: 250, isUnlocked: false },
          { id: "streak_30", name: "Monthly Legend", description: "Completed a 30-day streak of daily games", icon: "Crown", xpReward: 500, isUnlocked: false },
          { id: "speed_zip", name: "Speed Zipper", description: "Solved the ZIP puzzle in under 30 seconds", icon: "Zap", xpReward: 150, isUnlocked: true },
          { id: "speed_wend", name: "Word Wizard", description: "Solved the WEND word puzzle in under 20 seconds", icon: "Sparkles", xpReward: 150, isUnlocked: false },
          { id: "perfect_dual", name: "Daily Dual Master", description: "Completed both ZIP and WEND games in a single day", icon: "Trophy", xpReward: 200, isUnlocked: false },
        ]);
      }
    }
    load();
  }, []);

  const unlockedCount = badges.filter((b) => b.isUnlocked).length;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 20px 60px", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <Link
        to="/games"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#64748B", textDecoration: "none", fontWeight: 700, fontSize: 13.5, marginBottom: 16 }}
      >
        <ArrowLeft size={16} />
        <span>Back to Games Hub</span>
      </Link>

      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <span>Badges & Achievements</span>
          <Award size={28} color="#8B5CF6" />
        </h1>
        <p style={{ color: "#64748B", fontSize: 14.5, margin: 0 }}>
          Unlocked <strong>{unlockedCount}</strong> of <strong>{badges.length}</strong> available trophies
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
        {badges.map((b) => {
          const IconComponent = ICON_MAP[b.icon] || Trophy;
          return (
            <div
              key={b.id}
              style={{
                background: "#fff",
                borderRadius: 20,
                padding: "24px 20px",
                border: b.isUnlocked ? "2px solid #FDE047" : "1.5px solid #F1F5F9",
                boxShadow: b.isUnlocked ? "0 8px 24px rgba(253, 224, 71, 0.25)" : "0 2px 10px rgba(0,0,0,0.04)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                opacity: b.isUnlocked ? 1 : 0.65,
                filter: b.isUnlocked ? "none" : "grayscale(0.7)",
                transition: "all 0.2s",
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  background: b.isUnlocked ? "linear-gradient(135deg, #FEF08A, #F59E0B)" : "#F1F5F9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: b.isUnlocked ? "#78350F" : "#94A3B8",
                  marginBottom: 14,
                  boxShadow: b.isUnlocked ? "0 4px 14px rgba(245, 158, 11, 0.35)" : "none",
                }}
              >
                <IconComponent size={30} />
              </div>

              <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: "#0F172A" }}>
                {b.name}
              </h3>

              <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748B", lineHeight: 1.4 }}>
                {b.description}
              </p>

              <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    background: b.isUnlocked ? "#DCFCE7" : "#F1F5F9",
                    color: b.isUnlocked ? "#15803D" : "#64748B",
                    padding: "4px 12px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {b.isUnlocked ? "Unlocked ✓" : "Locked 🔒"}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#F59E0B" }}>
                  +{b.xpReward} XP
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
