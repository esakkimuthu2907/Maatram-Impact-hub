import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Home, Sparkles } from "lucide-react";
import "./PageHeader.css";

/**
 * Enterprise-grade unified PageHeader component
 * @param {Array<{label: string, path?: string}>} breadcrumbs
 * @param {string} title
 * @param {string} subtitle
 * @param {string} [badge]
 * @param {React.ReactNode} [actions]
 * @param {Array<{label: string, value: string | number, color?: string}>} [stats]
 */
export default function PageHeader({
  breadcrumbs = [],
  title,
  subtitle,
  badge,
  badgeIcon: BadgeIcon = Sparkles,
  actions,
  stats,
}) {
  return (
    <div className="unified-page-header">
      {/* Breadcrumbs Row */}
      {breadcrumbs.length > 0 && (
        <nav className="header-breadcrumbs" aria-label="Breadcrumb">
          <Link to="/dashboard" className="breadcrumb-item breadcrumb-home">
            <Home size={13} />
            <span>Home</span>
          </Link>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight size={13} className="breadcrumb-separator" />
              {crumb.path ? (
                <Link to={crumb.path} className="breadcrumb-item">
                  {crumb.label}
                </Link>
              ) : (
                <span className="breadcrumb-item active" aria-current="page">
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Main Header Content */}
      <div className="header-main-row">
        <div className="header-title-block">
          {badge && (
            <div className="header-tag-pill">
              {BadgeIcon && <BadgeIcon size={12} />}
              <span>{badge}</span>
            </div>
          )}
          <h1 className="header-main-title">{title}</h1>
          {subtitle && <p className="header-main-subtitle">{subtitle}</p>}
        </div>

        {/* Action Buttons (e.g., Primary CTA, Export, Filters) */}
        {actions && <div className="header-actions-block">{actions}</div>}
      </div>

      {/* Optional Mini Quick Stats Strip */}
      {stats && stats.length > 0 && (
        <div className="header-quick-stats-strip">
          {stats.map((s, idx) => (
            <div key={idx} className="quick-stat-chip">
              <span className="quick-stat-label">{s.label}:</span>
              <strong className="quick-stat-val" style={{ color: s.color || "#151515" }}>
                {s.value}
              </strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
