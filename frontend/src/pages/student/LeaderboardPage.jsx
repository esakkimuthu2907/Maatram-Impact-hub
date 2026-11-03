import React, { useState, useEffect } from "react";
import {
  Trophy,
  Award,
  Search,
  Star,
  Medal,
} from "lucide-react";

import { useApp } from "../../context/AppContext";
import { usersAPI } from "../../api/usersAPI";
import "./StudentDashboard.css";

export default function LeaderboardPage() {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState("Overall"); // Overall, Students, Alumni
  const [search, setSearch] = useState("");
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        setLoading(true);
        const res = await usersAPI.getLeaderboard();
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.map((u, index) => ({
            rank: u.rank || index + 1,
            id: u.id || u._id,
            applicationId: u.applicationId,
            name: u.fullName || u.name || "Student Volunteer",
            college: u.college || "Tamil Nadu University",
            eventsJoined: u.eventsJoined || 0,
            badges: u.badgesEarned || 0,
            points: Number(u.points) || 0,
            avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.fullName || "Student")}`,
            badgeTier:
              (u.points || 0) >= 1500
                ? "Green Gem Leader"
                : (u.points || 0) >= 1000
                ? "Platinum Volunteer"
                : (u.points || 0) >= 500
                ? "Diamond Volunteer"
                : (u.points || 0) >= 250
                ? "Gold Impact Champion"
                : (u.points || 0) >= 100
                ? "Silver Star Volunteer"
                : "Bronze Social Leader",
            category: "Students",
            isCurrentUser: user
              ? u.applicationId === user.applicationId ||
                u.id === user.id ||
                u.id === user._id ||
                u.email === user.email
              : false,
          }));
          setLeaderboardData(mapped);
        } else {
          setLeaderboardData([
            {
              rank: 1,
              name: user?.fullName || user?.name || "Esakki Muthu",
              college: user?.college || "College of Engineering",
              eventsJoined: user?.eventsJoined || 1,
              badges: 1,
              points: Number(user?.points) || 50,
              avatar: user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
              badgeTier: "Bronze Social Leader",
              category: "Students",
              isCurrentUser: true,
            },
          ]);
        }
      } catch (err) {
        console.warn("Could not load leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }

    loadLeaderboard();
  }, [user]);

  const filteredUsers = leaderboardData.filter((u) => {
    const matchesTab = activeTab === "Overall" || u.category === activeTab;
    const matchesSearch =
      (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.college || "").toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const topThree = leaderboardData.slice(0, 3);
  const myStanding = leaderboardData.find((u) => u.isCurrentUser) || { rank: 1, points: user?.points || 50 };

  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <div className="section-header-row">
        <div>
          <h1 className="page-heading">Celebrating Student Impact</h1>
          <p className="page-subheading">
            Honoring college students who dedicate their time, empathy, and skills to uplift communities.
          </p>
        </div>

        {/* Current user's standing chip */}
        <div className="my-rank-chip">
          <Trophy size={18} color="#FFD629" />
          <div>
            <small>Your Status</small>
            <strong>Rank #{myStanding.rank} • {user?.points ?? myStanding.points ?? 0} Points</strong>
          </div>
        </div>
      </div>

      {/* TOP 3 PODIUM HERO */}
      {topThree.length > 0 && (
        <div className="podium-section">
          {/* 2nd Place: Silver */}
          {topThree[1] && (
            <div className="podium-card rank-2">
              <div className="podium-badge-icon silver">
                <Medal size={24} />
              </div>
              <span className="podium-rank-tag">#2 Silver Star</span>
              <img
                src={topThree[1].avatar}
                alt={topThree[1].name}
                className="podium-avatar"
              />
              <h3>{topThree[1].name}</h3>
              <p className="podium-college">{topThree[1].college}</p>
              <div className="podium-hours-pill">
                <Star size={14} color="#D97706" fill="#D97706" />
                <strong>{topThree[1].points} pts</strong>
              </div>
            </div>
          )}

          {/* 1st Place: Gold Champion */}
          {topThree[0] && (
            <div className="podium-card rank-1">
              <div className="podium-crown">👑</div>
              <div className="podium-badge-icon gold">
                <Trophy size={28} />
              </div>
              <span className="podium-rank-tag gold-tag">#1 Top Contributor</span>
              <img
                src={topThree[0].avatar}
                alt={topThree[0].name}
                className="podium-avatar large"
              />
              <h3>{topThree[0].name}</h3>
              <p className="podium-college">{topThree[0].college}</p>
              <div className="podium-hours-pill gold-pill">
                <Star size={16} color="#B45309" fill="#B45309" />
                <strong>{topThree[0].points} pts</strong>
              </div>
            </div>
          )}

          {/* 3rd Place: Bronze */}
          {topThree[2] && (
            <div className="podium-card rank-3">
              <div className="podium-badge-icon bronze">
                <Medal size={24} />
              </div>
              <span className="podium-rank-tag">#3 Bronze Hero</span>
              <img
                src={topThree[2].avatar}
                alt={topThree[2].name}
                className="podium-avatar"
              />
              <h3>{topThree[2].name}</h3>
              <p className="podium-college">{topThree[2].college}</p>
              <div className="podium-hours-pill">
                <Star size={14} color="#D97706" fill="#D97706" />
                <strong>{topThree[2].points} pts</strong>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SEARCH AND TABS TOOLBAR */}
      <div className="filter-search-toolbar">
        <div className="format-pills-row">
          {["Overall", "Students", "Alumni"].map((tab) => (
            <button
              key={tab}
              className={`format-pill-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="opp-search-box" style={{ maxWidth: 320 }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search student or college..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* RANKINGS LIST TABLE */}
      <div className="leaderboard-table-card">
        <div className="table-header-row">
          <span className="col-rank">Rank</span>
          <span className="col-user">Volunteer Student</span>
          <span className="col-college desktop-only">College & District</span>
          <span className="col-badges desktop-only">Badges</span>
          <span className="col-hours">Points</span>
        </div>

        <div className="table-body-rows">
          {filteredUsers.map((u) => {
            const isMe = u.isCurrentUser || (user && u.name === user.name);

            return (
              <div
                key={u.rank + "_" + u.name}
                className={`table-row-item ${isMe ? "current-user-row" : ""}`}
              >
                <div className="col-rank">
                  <span className={`rank-badge rank-${u.rank}`}>
                    {u.rank}
                  </span>
                </div>

                <div className="col-user">
                  <img src={u.avatar} alt={u.name} className="user-table-avatar" />
                  <div className="user-table-text">
                    <strong>
                      {u.name} {isMe && <span className="you-pill">You</span>}
                    </strong>
                    <span className="mobile-only sub-college">{u.college}</span>
                  </div>
                </div>

                <div className="col-college desktop-only">
                  <span className="college-text">{u.college}</span>
                </div>

                <div className="col-badges desktop-only">
                  <span className="badge-count-pill">
                    <Award size={13} color="#F59E0B" /> {u.badges} Badges
                  </span>
                </div>

                <div className="col-hours">
                  <strong className="hours-highlight">{u.points} pts</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
