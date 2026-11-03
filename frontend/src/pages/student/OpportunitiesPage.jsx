import React, { useMemo, useState } from "react";
import { Link, useSearchParams, useParams } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  Bookmark,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  ArrowRight,
  GraduationCap,
  Globe,
  BookOpen,
  HeartHandshake,
  Sparkles,
} from "lucide-react";

import { useApp } from "../../context/AppContext";
import { CATEGORIES } from "../../data/mockData";
import "./OpportunitiesPage.css";

export default function OpportunitiesPage() {
  const { categorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { opportunities, applications, bookmarks, toggleBookmark } = useApp();

  const urlSearch = searchParams.get("search") || "";
  const [search, setSearch] = useState(urlSearch);
  const [formatFilter, setFormatFilter] = useState("All"); // All, Online, Offline, Hybrid
  const [sortBy, setSortBy] = useState("date"); // date, slots, duration

  // Find active category if URL param present
  const currentCategory = categorySlug
    ? CATEGORIES.find((c) => c.slug === categorySlug)
    : null;

  // Set active category filter or default to all
  const activeCategorySlug = currentCategory ? currentCategory.slug : "all";

  // Filtered list
  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();

    return (opportunities || []).filter((item) => {
      // Category filter
      if (activeCategorySlug !== "all") {
        const itemSlug = item.categorySlug || (item.category || "").toLowerCase().replace(/\s+/g, "-");
        if (itemSlug !== activeCategorySlug) {
          return false;
        }
      }

      // Format filter
      if (formatFilter !== "All" && item.mode !== formatFilter) {
        return false;
      }

      // Search query
      if (q) {
        const matchTitle = (item.title || "").toLowerCase().includes(q);
        const matchDesc = (item.description || "").toLowerCase().includes(q);
        const matchCategory = (item.category || "").toLowerCase().includes(q);
        const skillsArr = Array.isArray(item.skills)
          ? item.skills
          : typeof item.skills === "string"
          ? item.skills.split(",").map((s) => s.trim())
          : [];
        const matchSkills = skillsArr.some((s) => s.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchCategory && !matchSkills) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "slots") return (b.slotsAvailable || 0) - (a.slotsAvailable || 0);
      if (sortBy === "duration") return (b.durationHours || 0) - (a.durationHours || 0);
      return 0; // Default date order
    });
  }, [opportunities, activeCategorySlug, formatFilter, search, sortBy]);

  // Check if student applied
  const isApplied = (oppId) => {
    return applications.some(
      (app) => app.opportunityId === oppId && app.status !== "Cancelled"
    );
  };

  return (
    <div className="opportunities-page-container">
      {/* Category Hero Banner if on category route */}
      {currentCategory ? (
        <div
          className="category-hero-banner"
          style={{
            backgroundImage: `linear-gradient(rgba(21, 21, 21, 0.72), rgba(21, 21, 21, 0.85)), url(${currentCategory.bannerImage})`,
          }}
        >
          <div className="category-hero-content">
            <span className="category-hero-eyebrow">
              <Sparkles size={14} color="#FFD629" /> Maatram Volunteering Module
            </span>
            <h1>{currentCategory.name}</h1>
            <p className="category-hero-tagline">{currentCategory.tagline}</p>
            <p className="category-hero-desc">{currentCategory.description}</p>
          </div>
        </div>
      ) : (
        <div className="opportunities-header">
          <div>
            <h1>Volunteering Opportunities</h1>
            <p>
              Discover and apply for school visit, admissions verification, community campaigns, and Social and skill developing events.
            </p>
          </div>
        </div>
      )}

      {/* CATEGORY SELECTOR TABS */}
      <div className="category-tabs-bar">
        <Link
          to="/opportunities"
          className={`category-tab-btn ${activeCategorySlug === "all" ? "active" : ""}`}
        >
          All Opportunities
        </Link>
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            to={`/opportunities/${cat.slug}`}
            className={`category-tab-btn ${activeCategorySlug === cat.slug ? "active" : ""}`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {/* SEARCH AND FORMAT FILTER BAR (MATCHING MOBILE REFERENCE TABS) */}
      <div className="opp-filter-controls">
        <div className="opp-search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search opportunities, schools, locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-btn" onClick={() => setSearch("")}>
              ✕
            </button>
          )}
        </div>

        {/* Format tabs matching reference: All | Online | Offline | Hybrid */}
        <div className="format-pills-row">
          {["All", "Online", "Offline", "Hybrid"].map((mode) => (
            <button
              key={mode}
              className={`format-pill-btn ${formatFilter === mode ? "active" : ""}`}
              onClick={() => setFormatFilter(mode)}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Sort selector */}
        <div className="sort-dropdown-wrap">
          <SlidersHorizontal size={15} color="#717784" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="date">Sort by Date</option>
            <option value="slots">Most Slots Available</option>
            <option value="duration">Longest Duration</option>
          </select>
        </div>
      </div>

      {/* RESULTS COUNT */}
      <div className="opp-results-summary">
        <span>
          Showing <strong>{filteredList.length}</strong> opportunities
          {activeCategorySlug !== "all" && ` in ${currentCategory?.name}`}
          {formatFilter !== "All" && ` (${formatFilter})`}
        </span>
      </div>

      {/* OPPORTUNITIES GRID */}
      {filteredList.length === 0 ? (
        <div className="opp-empty-state">
          <div className="empty-icon-wrap">
            <Search size={36} color="#717784" />
          </div>
          <h3>No matching opportunities found</h3>
          <p>Try adjusting your search terms or clearing the format filters.</p>
          <button
            className="dash-btn dash-btn-primary"
            onClick={() => {
              setSearch("");
              setFormatFilter("All");
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="opportunities-cards-grid">
          {filteredList.map((opp) => {
            const oppId = opp.id || opp._id;
            const applied = isApplied(oppId);
            const bookmarked = (bookmarks || []).includes(oppId);
            const skillsList = Array.isArray(opp.skills)
              ? opp.skills
              : typeof opp.skills === "string"
              ? opp.skills.split(",").map((s) => s.trim()).filter(Boolean)
              : [];
            const desc = opp.description || "";

            return (
              <div key={oppId} className="opportunity-card-rich">
                {/* Card Top Image & Badges */}
                <div className="opp-card-media">
                  <img src={opp.image} alt={opp.title} />
                  <div className="opp-card-media-overlay" />

                  {/* Mode Badge matching reference */}
                  <span className={`opp-mode-badge ${(opp.mode || "offline").toLowerCase()}`}>
                    {opp.mode || "Offline"}
                  </span>

                  {/* Bookmark Button */}
                  <button
                    className={`opp-bookmark-btn ${bookmarked ? "bookmarked" : ""}`}
                    onClick={() => toggleBookmark(oppId)}
                    aria-label="Save opportunity"
                  >
                    <Bookmark size={16} fill={bookmarked ? "#FFD629" : "none"} />
                  </button>
                </div>

                {/* Card Content */}
                <div className="opp-card-body">
                  <div className="opp-card-meta-top">
                    <span className="opp-category-tag">{opp.category}</span>
                    <span className="opp-slots-left">
                      <Users size={13} /> {opp.slotsAvailable ?? 10} slots left
                    </span>
                  </div>

                  <h3 className="opp-card-title">
                    <Link to={`/opportunities/${oppId}`}>{opp.title}</Link>
                  </h3>

                  <p className="opp-card-desc">
                    {desc.length > 110 ? `${desc.slice(0, 110)}...` : desc}
                  </p>

                  <div className="opp-card-details-grid">
                    <div className="card-detail-item">
                      <Calendar size={14} color="#717784" />
                      <span>{opp.date}</span>
                    </div>
                    <div className="card-detail-item">
                      <Clock size={14} color="#717784" />
                      <span>{opp.durationHours || 4} hours</span>
                    </div>
                    <div className="card-detail-item location-item">
                      <MapPin size={14} color="#717784" />
                      <span>{opp.location || "Tamil Nadu"}</span>
                    </div>
                  </div>

                  {/* Skills tags */}
                  <div className="opp-card-skills">
                    {skillsList.slice(0, 3).map((skill, i) => (
                      <span key={i} className="skill-pill">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="opp-card-footer">
                  <Link
                    to={`/opportunities/${oppId}`}
                    className="opp-btn-secondary"
                  >
                    View Details
                  </Link>

                  {applied ? (
                    <span className="opp-applied-badge">
                      <CheckCircle2 size={15} /> Applied
                    </span>
                  ) : (
                    <Link
                      to={`/opportunities/${oppId}/apply`}
                      className="opp-btn-primary"
                    >
                      Register Now <ArrowRight size={15} />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
