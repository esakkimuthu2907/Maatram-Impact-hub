// frontend/src/components/common/BadgeShowcase.jsx
import React, { useState, useEffect } from "react";
import {
  Award,
  Shield,
  ShieldCheck,
  Star,
  Crown,
  Sparkles,
  Lock,
  PlusCircle,
  Edit3,
  Trash2,
  CheckCircle2,
  X,
  Target,
  Clock,
  Coins,
  Filter,
} from "lucide-react";
import { badgesAPI } from "../../api/badgesAPI";
import "./BadgeShowcase.css";

const ICON_MAP = {
  Award: Award,
  Shield: Shield,
  ShieldCheck: ShieldCheck,
  Star: Star,
  Crown: Crown,
  Sparkles: Sparkles,
};

export default function BadgeShowcase({
  user,
  isAdmin = false,
  showToast,
  onBadgeUpdated,
}) {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBadge, setEditingBadge] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "Award",
    category: "Milestone",
    eligibilityCriteria: "",
    pointsThreshold: 50,
    hoursThreshold: 4,
    eventsThreshold: 1,
    tierColor: "#EAB308",
    isActive: true,
  });

  const loadBadges = async () => {
    try {
      setLoading(true);
      const res = isAdmin ? await badgesAPI.getAll() : await badgesAPI.getMy();
      if (res && res.data) {
        setBadges(res.data);
      }
    } catch (err) {
      console.warn("Could not load badges:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBadges();
  }, [isAdmin]);

  const handleOpenAdd = () => {
    setEditingBadge(null);
    setFormData({
      name: "",
      description: "",
      icon: "Award",
      category: "Milestone",
      eligibilityCriteria: "",
      pointsThreshold: 100,
      hoursThreshold: 10,
      eventsThreshold: 2,
      tierColor: "#EAB308",
      isActive: true,
    });
    setShowEditModal(true);
  };

  const handleOpenEdit = (badge) => {
    setEditingBadge(badge);
    setFormData({
      name: badge.name || "",
      description: badge.description || "",
      icon: badge.icon || "Award",
      category: badge.category || "Milestone",
      eligibilityCriteria: badge.eligibilityCriteria || "",
      pointsThreshold: badge.pointsThreshold || 0,
      hoursThreshold: badge.hoursThreshold || 0,
      eventsThreshold: badge.eventsThreshold || 0,
      tierColor: badge.tierColor || "#EAB308",
      isActive: badge.isActive !== undefined ? badge.isActive : true,
    });
    setShowEditModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBadge) {
        await badgesAPI.update(editingBadge.id || editingBadge._id, formData);
        showToast?.("Badge updated successfully!");
      } else {
        await badgesAPI.create(formData);
        showToast?.("New recognition badge created!");
      }
      setShowEditModal(false);
      loadBadges();
      onBadgeUpdated?.();
    } catch (err) {
      showToast?.(err.message || "Failed to save badge", "error");
    }
  };

  const handleDelete = async (badgeId) => {
    if (!window.confirm("Are you sure you want to remove or deactivate this badge?")) return;
    try {
      await badgesAPI.remove(badgeId);
      showToast?.("Badge removed or deactivated.");
      loadBadges();
      onBadgeUpdated?.();
    } catch (err) {
      showToast?.(err.message || "Failed to delete badge", "error");
    }
  };

  return (
    <div className="badge-showcase-container">
      {/* Header bar */}
      <div className="badge-section-header">
        <div>
          <h2 className="badge-section-title">
            <Award size={22} color="#D97706" /> Volunteer Recognition Badges
          </h2>
          <p className="badge-section-desc">
            Earn prestigious badges as you hit milestones in verified volunteering hours and community impact points.
          </p>
        </div>

        {isAdmin && (
          <button className="dash-btn dash-btn-primary" onClick={handleOpenAdd}>
            <PlusCircle size={16} /> Create New Badge
          </button>
        )}
      </div>

      {/* Badges Grid */}
      <div className="badges-grid-layout">
        {badges.map((badge) => {
          const IconComponent = ICON_MAP[badge.icon] || Award;
          const isUnlocked = badge.isUnlocked || isAdmin;
          const progress = badge.progress !== undefined ? badge.progress : 100;

          return (
            <div
              key={badge.id || badge._id}
              className={`badge-card-item ${isUnlocked ? "unlocked" : "locked"} ${!badge.isActive ? "inactive" : ""}`}
              style={{ "--badge-tier-color": badge.tierColor || "#EAB308" }}
            >
              <div className="badge-card-top">
                <div
                  className="badge-icon-medallion"
                  style={{
                    backgroundColor: isUnlocked ? `${badge.tierColor}18` : "#F1F5F9",
                    borderColor: isUnlocked ? badge.tierColor : "#CBD5E1",
                  }}
                >
                  <IconComponent
                    size={28}
                    color={isUnlocked ? badge.tierColor : "#94A3B8"}
                  />
                  {!isUnlocked && (
                    <div className="badge-lock-overlay">
                      <Lock size={12} color="#475569" />
                    </div>
                  )}
                </div>

                <div className="badge-status-pills">
                  {isUnlocked ? (
                    <span className="badge-unlocked-pill">
                      <CheckCircle2 size={12} /> Unlocked
                    </span>
                  ) : (
                    <span className="badge-locked-pill">
                      <Lock size={12} /> Locked ({progress}%)
                    </span>
                  )}
                  {badge.category && (
                    <span className="badge-category-tag">{badge.category}</span>
                  )}
                </div>
              </div>

              <div className="badge-card-body">
                <h4 className="badge-name">{badge.name}</h4>
                <p className="badge-desc">{badge.description}</p>

                {badge.eligibilityCriteria && (
                  <div className="badge-criteria-box">
                    <strong>Criteria:</strong> {badge.eligibilityCriteria}
                  </div>
                )}

                {/* Thresholds row */}
                <div className="badge-thresholds-row">
                  {badge.pointsThreshold > 0 && (
                    <span title="Points required">
                      <Coins size={12} /> {badge.pointsThreshold} pts
                    </span>
                  )}
                  {badge.hoursThreshold > 0 && (
                    <span title="Verified hours required">
                      <Clock size={12} /> {badge.hoursThreshold} hrs
                    </span>
                  )}
                  {badge.eventsThreshold > 0 && (
                    <span title="Drives required">
                      <Target size={12} /> {badge.eventsThreshold} drives
                    </span>
                  )}
                </div>

                {/* Progress Bar for students */}
                {!isAdmin && !isUnlocked && (
                  <div className="badge-progress-wrap">
                    <div className="progress-labels">
                      <span>Progress</span>
                      <strong>{progress}%</strong>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${progress}%`,
                          backgroundColor: badge.tierColor || "#0066CC",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Admin Actions */}
              {isAdmin && (
                <div className="badge-admin-actions">
                  <button
                    className="badge-action-btn edit"
                    onClick={() => handleOpenEdit(badge)}
                    title="Edit badge criteria"
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                  <button
                    className="badge-action-btn delete"
                    onClick={() => handleDelete(badge.id || badge._id)}
                    title="Remove or deactivate badge"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Admin Add / Edit Modal */}
      {showEditModal && (
        <div className="badge-modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div className="badge-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="badge-modal-header">
              <h3>{editingBadge ? "Edit Recognition Badge" : "Create Recognition Badge"}</h3>
              <button onClick={() => setShowEditModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="badge-form-grid">
              <div className="form-group full-width">
                <label>Badge Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Community Champion"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief description of the achievement"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Icon Style</label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                >
                  <option value="Award">Award Ribbon</option>
                  <option value="Shield">Bronze Shield</option>
                  <option value="ShieldCheck">Silver Shield</option>
                  <option value="Star">Gold Star</option>
                  <option value="Crown">Crown</option>
                  <option value="Sparkles">Sparkles Gem</option>
                </select>
              </div>

              <div className="form-group">
                <label>Tier Accent Color</label>
                <input
                  type="color"
                  value={formData.tierColor}
                  onChange={(e) => setFormData({ ...formData, tierColor: e.target.value })}
                  style={{ height: 38, padding: "2px 4px" }}
                />
              </div>

              <div className="form-group">
                <label>Points Threshold</label>
                <input
                  type="number"
                  min="0"
                  value={formData.pointsThreshold}
                  onChange={(e) => setFormData({ ...formData, pointsThreshold: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Verified Hours Threshold</label>
                <input
                  type="number"
                  min="0"
                  value={formData.hoursThreshold}
                  onChange={(e) => setFormData({ ...formData, hoursThreshold: e.target.value })}
                />
              </div>

              <div className="form-group full-width">
                <label>Eligibility Criteria Text</label>
                <input
                  type="text"
                  placeholder="e.g. Complete 50 verified hours or earn 500 leadership points."
                  value={formData.eligibilityCriteria}
                  onChange={(e) => setFormData({ ...formData, eligibilityCriteria: e.target.value })}
                />
              </div>

              <div className="form-group full-width">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span>Active Badge (Visible to all students & alumni)</span>
                </label>
              </div>

              <div className="form-actions-row full-width">
                <button type="submit" className="dash-btn dash-btn-primary">
                  {editingBadge ? "Save Changes" : "Create Badge"}
                </button>
                <button
                  type="button"
                  className="dash-btn dash-btn-outline"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
