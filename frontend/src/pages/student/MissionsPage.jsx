import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import "./MissionsPage.css";

const MISSIONS = [
  { id: "pv",  icon: "🎓", title: "Complete 1 PV",           desc: "Complete one Parent Visit drive",           coins: 500,  category: "task" },
  { id: "tv",  icon: "📺", title: "Complete 1 TV",           desc: "Complete one Teaching Visit session",       coins: 300,  category: "task" },
  { id: "sv",  icon: "🏫", title: "Complete 1 School Visit", desc: "Complete a school visit drive",             coins: 400,  category: "task" },
  { id: "oe",  icon: "🌍", title: "Complete 1 Outside Event",desc: "Attend an external community event",        coins: 200,  category: "task" },
  { id: "s3",  icon: "📅", title: "Sign in for 3 Days",      desc: "Complete this task to get 500 coins",      coins: 500,  category: "streak" },
  { id: "s15", icon: "📅", title: "Sign in for 15 Days",     desc: "Complete this task to get 2000 coins",     coins: 2000, category: "streak" },
  { id: "s30", icon: "📅", title: "Sign in for 30 Days",     desc: "Complete this task to get 5000 coins",     coins: 5000, category: "streak" },
];

const WEEK_DAYS    = ["T","F","S","S","M","T","W"];
const BADGE_MILESTONES = [
  { days: 3,  icon: "⭐", label: "Star"      },
  { days: 5,  icon: "🌟", label: "Superstar" },
  { days: 7,  icon: "🏆", label: "Champion"  },
  { days: 31, icon: "🏅", label: "Icon"      },
];
const SCRATCH_PRIZES = [100, 200, 500, 100, 300, 200];
const SEASON_REWARDS = [
  { level: 1, freeCoins: 50,   premiumItem: "⚡ 1",   collectBtn: false },
  { level: 2, freeCoins: null, premiumItem: "🛒 2",   collectBtn: true  },
  { level: 3, freeCoins: 100,  premiumItem: "👑 3",   collectBtn: false },
];

const CONFETTI_COLORS = ["#FFD629","#FF6B6B","#4ECDC4","#45B7D1","#96CEB4","#FFEAA7","#DDA0DD","#FF69B4","#00CED1","#FF7F50"];
const CONFETTI_PIECES = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  color: CONFETTI_COLORS[i % 10],
  left: (i * 1.67) % 100,
  delay: (i * 0.04) % 1.5,
  size: (i % 10) + 6,
  shape: i % 3 === 0 ? "circle" : i % 3 === 1 ? "square" : "rect",
}));

export default function MissionsPage() {
  const { user, updateStreak, showToast } = useApp();
  const coins     = user?.coins      ?? 80;
  const streakDays = user?.streakDays ?? 1;

  const [completedMissions, setCompletedMissions] = useState([]);
  const [showBadges,  setShowBadges]  = useState(true);
  const [keepStreak,  setKeepStreak]  = useState(true);
  const [strikeAnim,  setStrikeAnim]  = useState(false);
  const [strikeMsg,   setStrikeMsg]   = useState("");
  const [scratchCards, setScratchCards] = useState(
    SCRATCH_PRIZES.map((prize, i) => ({ id: i, prize, revealed: false }))
  );

  /* ── earned coins accumulator ── */
  const earnedCoins = completedMissions.reduce((acc, id) => {
    const m = MISSIONS.find(x => x.id === id);
    return acc + (m?.coins || 0);
  }, 0);

  const handleClaim = (mission) => {
    if (completedMissions.includes(mission.id)) return;
    setCompletedMissions(prev => [...prev, mission.id]);
    setStrikeMsg(`+${mission.coins} 🪙 Coins Earned!`);
    setStrikeAnim(true);
    if (updateStreak) updateStreak(streakDays + 1, mission.coins);
    showToast(`🔥 Mission Complete! +${mission.coins} coins earned!`);
    setTimeout(() => setStrikeAnim(false), 3000);
  };

  const handleScratch = (idx) => {
    if (scratchCards[idx].revealed) return;
    const prize = scratchCards[idx].prize;
    setScratchCards(prev => prev.map((c, i) => i === idx ? { ...c, revealed: true } : c));
    showToast(`🎉 You won ${prize} coins from the scratch card!`);
    if (updateStreak) updateStreak(streakDays, prize);
  };

  return (
    <div className="missions-root">

      {/* ── STRIKE ANIMATION OVERLAY ── */}
      {strikeAnim && (
        <div className="strike-overlay">
          <div className="confetti-container">
            {CONFETTI_PIECES.map(p => (
              <div
                key={p.id}
                className={`confetti-piece confetti-${p.shape}`}
                style={{
                  left: `${p.left}%`,
                  background: p.color,
                  width: p.size,
                  height: p.shape === "rect" ? p.size * 2 : p.size,
                  animationDelay: `${p.delay}s`,
                }}
              />
            ))}
          </div>
          <div className="strike-banner">
            <div className="strike-fire">🔥</div>
            <div className="strike-title">STRIKE!</div>
            <div className="strike-coins">{strikeMsg}</div>
            <div className="strike-sub">Keep the momentum going!</div>
          </div>
        </div>
      )}

      {/* ── TOP COINS BAR ── */}
      <div className="missions-topbar">
        <div className="missions-topbar-left">
          <Link to="/dashboard" className="missions-back-btn">← Back</Link>
          <span className="missions-page-title">🎮 Missions & Streak</span>
        </div>
        <div className="missions-topbar-right">
          <span className="missions-coin-badge">🪙 {coins + earnedCoins}</span>
          <span className="missions-life-badge">❤️ 5</span>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="missions-content">

        {/* SEASON PASS CARD */}
        <div className="season-card">
          <div className="season-header">
            <div className="season-title-block">
              <span className="season-label">SEASON 1</span>
              <span className="season-end">END IN 28D 16H</span>
            </div>
          </div>
          <div className="season-level-bar">
            <span className="season-level-badge">👑 LEVEL 2</span>
            <div className="season-progress-track">
              <div className="season-progress-fill" style={{ width: "25%" }} />
            </div>
            <span className="season-progress-label">1/4</span>
          </div>
          <div className="season-passes-row">
            <div className="pass-col premium-col">
              <div className="pass-label premium-label">PREMIUM PASS</div>
              {SEASON_REWARDS.map(r => (
                <div key={r.level} className="pass-item locked-item">
                  <span className="pass-lock">🔒</span>
                  <span>{r.premiumItem}</span>
                </div>
              ))}
            </div>

            <div className="season-timeline">
              <div className="season-timeline-line" />
              {SEASON_REWARDS.map(r => (
                <div key={r.level} className="season-node">
                  <div className="season-hex">{r.level}</div>
                </div>
              ))}
            </div>

            <div className="pass-col free-col">
              <div className="pass-label free-label">FREE PASS</div>
              {SEASON_REWARDS.map(r => (
                <div key={r.level} className={`pass-item ${r.collectBtn ? "collect-item" : "coin-item"}`}>
                  {r.collectBtn ? (
                    <button className="collect-btn">COLLECT</button>
                  ) : r.freeCoins ? (
                    <span>🪙 {r.freeCoins}</span>
                  ) : (
                    <span>✅</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* DAILY STREAK CARD */}
        <div className="streak-card-missions">
          <div className="streak-top-row">
            <div>
              <div className="streak-day-count">{streakDays}-day streak</div>
              <div className="streak-tagline">You're heating up!</div>
            </div>
            <div className="streak-flame-big">🔥</div>
          </div>

          <div className="streak-week-wrapper">
            <div className="streak-week-row">
              {WEEK_DAYS.map((d, i) => (
                <div key={i} className="streak-day-col">
                  <span className="streak-day-letter">{d}</span>
                  <div className={`streak-day-circle ${i === 0 ? "streak-day-done" : ""}`}>
                    {i === 0 ? <span className="streak-check">✓</span> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Badges */}
          <div className="badges-section">
            <button className="badges-toggle-btn" onClick={() => setShowBadges(!showBadges)}>
              <span>Badges</span>
              <span className="chevron-icon">{showBadges ? "∧" : "∨"}</span>
            </button>
            {showBadges && (
              <div className="badges-row">
                {BADGE_MILESTONES.map(b => (
                  <div key={b.days} className={`badge-milestone ${streakDays >= b.days ? "badge-earned" : ""}`}>
                    <div className="badge-icon-box">{b.icon}</div>
                    <div className="badge-days">{b.days} days</div>
                    <div className="badge-label-name">{b.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Keep streak toggle */}
          <div className="streak-keep-row">
            <div>
              <div className="streak-keep-title">Keep your streak</div>
              <div className="streak-keep-sub">Push notify me for tomorrow's game</div>
            </div>
            <div
              className={`streak-toggle ${keepStreak ? "toggle-on" : "toggle-off"}`}
              onClick={() => setKeepStreak(!keepStreak)}
              role="switch"
              aria-checked={keepStreak}
            >
              <div className="toggle-thumb" />
            </div>
          </div>
        </div>

        {/* TASKS & MISSIONS SECTION */}
        <div className="missions-section-card">
          <div className="missions-section-header">
            <span>📅</span>
            <span>Task &amp; Missions</span>
          </div>
          <div className="missions-list">
            {MISSIONS.map(m => {
              const done = completedMissions.includes(m.id);
              return (
                <div key={m.id} className={`mission-row ${done ? "mission-done" : ""}`}>
                  <div className="mission-icon-box">{m.icon}</div>
                  <div className="mission-info">
                    <div className="mission-title">{m.title}</div>
                    <div className="mission-desc">{m.desc}</div>
                  </div>
                  <div className="mission-right">
                    <div className="mission-coins">+{m.coins} 🪙</div>
                    {done ? (
                      <div className="mission-done-check">✅</div>
                    ) : (
                      <button className="mission-claim-btn" onClick={() => handleClaim(m)}>
                        CLAIM
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SCRATCH CARD REWARDS SECTION */}
        <div className="scratch-section-card">
          <div className="scratch-section-header">
            <span>🎁</span>
            <span>Scratch Card Rewards</span>
          </div>
          <p className="scratch-section-sub">
            Complete missions to earn scratch cards. Redeem coins for Paytm, Google Play &amp; Amazon vouchers!
          </p>
          <div className="scratch-cards-grid">
            {scratchCards.map((card, idx) => (
              <div
                key={card.id}
                className={`scratch-card-item ${card.revealed ? "card-revealed" : "card-unscratched"}`}
                onClick={() => handleScratch(idx)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === "Enter" && handleScratch(idx)}
              >
                {card.revealed ? (
                  <div className="card-prize-reveal">
                    <div className="prize-coin-icon">🪙</div>
                    <div className="prize-amount">+{card.prize}</div>
                    <div className="prize-label">Coins Won!</div>
                  </div>
                ) : (
                  <div className="card-scratch-prompt">
                    <div className="scratch-gift">🎁</div>
                    <div className="scratch-text">Scratch to<br />Reveal!</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
