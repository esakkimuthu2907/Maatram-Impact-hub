import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  Bell,
  Shield,
  Lock,
  HelpCircle,
  Info,
  LogOut,
  CheckCircle2,
  ChevronDown,
  Sparkles,
} from "lucide-react";

import { useApp } from "../../context/AppContext";
import MaatramLogo from "../../components/common/MaatramLogo";
import "./StudentDashboard.css";

export default function SettingsPage() {
  const { user, logout, showToast } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("notifications"); // notifications, privacy, password, about, help

  const [notifPrefs, setNotifPrefs] = useState({
    emailAlerts: true,
    smsReminders: true,
    opportunityDigests: true,
    leaderboardUpdates: false,
  });

  const [privacyPrefs, setPrivacyPrefs] = useState({
    publicProfile: true,
    showLeaderboard: true,
    allowLinkedInTag: true,
  });

  const [pwdForm, setPwdForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleToggleNotif = (key) => {
    setNotifPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      showToast("Notification preference updated");
      return next;
    });
  };

  const handleTogglePrivacy = (key) => {
    setPrivacyPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      showToast("Privacy setting saved");
      return next;
    });
  };

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    if (!pwdForm.newPassword || pwdForm.newPassword.length < 8) {
      showToast("New password must be at least 8 characters", "error");
      return;
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }
    showToast("Password updated successfully!");
    setPwdForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  const handleSignOut = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="dashboard-container">
      <div className="section-header-row">
        <div>
          <h1 className="page-heading">Settings</h1>
          <p className="page-subheading">
            Manage your volunteer profile alerts, privacy options, account security, and foundation guidelines.
          </p>
        </div>

        <button className="dash-btn dash-btn-outline danger-btn" onClick={handleSignOut}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      <div className="settings-grid-layout">
        {/* SETTINGS VERTICAL TABS NAV */}
        <aside className="settings-nav-col">
          <button
            className={`settings-nav-btn ${activeTab === "notifications" ? "active" : ""}`}
            onClick={() => setActiveTab("notifications")}
          >
            <Bell size={18} />
            <span>Notification Alerts</span>
          </button>

          <button
            className={`settings-nav-btn ${activeTab === "privacy" ? "active" : ""}`}
            onClick={() => setActiveTab("privacy")}
          >
            <Shield size={18} />
            <span>Privacy & Consent</span>
          </button>

          <button
            className={`settings-nav-btn ${activeTab === "password" ? "active" : ""}`}
            onClick={() => setActiveTab("password")}
          >
            <Lock size={18} />
            <span>Password & Security</span>
          </button>

          <button
            className={`settings-nav-btn ${activeTab === "about" ? "active" : ""}`}
            onClick={() => setActiveTab("about")}
          >
            <Info size={18} />
            <span>About Maatram Foundation</span>
          </button>

          <button
            className={`settings-nav-btn ${activeTab === "help" ? "active" : ""}`}
            onClick={() => setActiveTab("help")}
          >
            <HelpCircle size={18} />
            <span>Help & Support FAQ</span>
          </button>
        </aside>

        {/* SETTINGS CONTENT PANEL */}
        <div className="settings-content-col">
          {/* TAB 1: NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="settings-card">
              <h2>Notification Preferences</h2>
              <p className="settings-sub">
                Choose how and when Maatram Foundation sends you drive updates and certificates.
              </p>

              <div className="settings-toggle-list">
                <div className="toggle-item">
                  <div>
                    <strong>Email Drive Alerts</strong>
                    <p>Receive venue briefings and reporting time updates for accepted events.</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={notifPrefs.emailAlerts}
                      onChange={() => handleToggleNotif("emailAlerts")}
                    />
                    <span className="slider round" />
                  </label>
                </div>

                <div className="toggle-item">
                  <div>
                    <strong>SMS Day-Before Reminders</strong>
                    <p>Get essential SMS reminders 24 hours prior to school visit departure.</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={notifPrefs.smsReminders}
                      onChange={() => handleToggleNotif("smsReminders")}
                    />
                    <span className="slider round" />
                  </label>
                </div>

                <div className="toggle-item">
                  <div>
                    <strong>Weekly Opportunities Digest</strong>
                    <p>Curated recommendations matching your mentoring & career skills.</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={notifPrefs.opportunityDigests}
                      onChange={() => handleToggleNotif("opportunityDigests")}
                    />
                    <span className="slider round" />
                  </label>
                </div>

                <div className="toggle-item">
                  <div>
                    <strong>Leaderboard Milestone Alerts</strong>
                    <p>Get notified when your volunteer rank climbs into the top 10.</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={notifPrefs.leaderboardUpdates}
                      onChange={() => handleToggleNotif("leaderboardUpdates")}
                    />
                    <span className="slider round" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRIVACY & CONSENT */}
          {activeTab === "privacy" && (
            <div className="settings-card">
              <h2>Privacy & Social Consent</h2>
              <p className="settings-sub">
                Control your profile visibility and social recognition settings.
              </p>

              <div className="settings-toggle-list">
                <div className="toggle-item">
                  <div>
                    <strong>Public Volunteer Profile</strong>
                    <p>Allow fellow volunteers and college coordinators to see your verified hours.</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={privacyPrefs.publicProfile}
                      onChange={() => handleTogglePrivacy("publicProfile")}
                    />
                    <span className="slider round" />
                  </label>
                </div>

                <div className="toggle-item">
                  <div>
                    <strong>Leaderboard Participation</strong>
                    <p>Showcase your name on the statewide student volunteer leaderboard.</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={privacyPrefs.showLeaderboard}
                      onChange={() => handleTogglePrivacy("showLeaderboard")}
                    />
                    <span className="slider round" />
                  </label>
                </div>

                <div className="toggle-item">
                  <div>
                    <strong>LinkedIn Social Tagging</strong>
                    <p>Permit Maatram to tag your LinkedIn profile when issuing certificates.</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={privacyPrefs.allowLinkedInTag}
                      onChange={() => handleTogglePrivacy("allowLinkedInTag")}
                    />
                    <span className="slider round" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PASSWORD & SECURITY */}
          {activeTab === "password" && (
            <div className="settings-card">
              <h2>Password & Account Security</h2>
              <p className="settings-sub">Update your password to keep your volunteer account secure.</p>

              <form onSubmit={handlePasswordUpdate} className="settings-form">
                <div className="register-field">
                  <label>Current Password</label>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    value={pwdForm.currentPassword}
                    onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                    required
                  />
                </div>

                <div className="register-field">
                  <label>New Password (min 8 characters)</label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={pwdForm.newPassword}
                    onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                    required
                  />
                </div>

                <div className="register-field">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={pwdForm.confirmPassword}
                    onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                    required
                  />
                </div>

                <button type="submit" className="dash-btn dash-btn-primary" style={{ marginTop: 12 }}>
                  Update Password
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: ABOUT MAATRAM FOUNDATION */}
          {activeTab === "about" && (
            <div className="settings-card">
              <div style={{ marginBottom: 20 }}>
                <MaatramLogo size="lg" showTagline={true} />
              </div>

              <h2>Maatram Foundation</h2>
              <p className="lead-paragraph">
                "Empowering Students. Building Brighter Futures."
              </p>
              <p style={{ lineHeight: 1.7, color: "#475569" }}>
                Maatram Foundation is a pioneering non-profit educational trust founded in Tamil Nadu.
                We believe that quality higher education is the birthright of every deserving student,
                regardless of their financial background. Through our university partnerships,
                scholarship endowments, and passionate student volunteering network, we provide free
                higher education and career mentoring to thousands of rural first-generation learners.
              </p>

              <div className="about-pillars-grid">
                <div className="about-pillar">
                  <strong>2,400+</strong>
                  <span>Free College Educations Provided</span>
                </div>
                <div className="about-pillar">
                  <strong>45+</strong>
                  <span>Partner Universities & Colleges</span>
                </div>
                <div className="about-pillar">
                  <strong>10,000+</strong>
                  <span>Students Mentored in Rural Schools</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: HELP & SUPPORT FAQ */}
          {activeTab === "help" && (
            <div className="settings-card">
              <h2>Help & Support FAQ</h2>
              <p className="settings-sub">Answers to common questions about volunteering and hours verification.</p>

              <div className="faq-list">
                <div className="faq-item">
                  <h4>How are my volunteering hours verified?</h4>
                  <p>
                    After each event, the designated Maatram teacher coordinator or field lead confirms
                    attendance rosters. Verified hours reflect in your profile within 24–48 hours.
                  </p>
                </div>

                <div className="faq-item">
                  <h4>Can I claim academic credits for these hours?</h4>
                  <p>
                    Yes! Maatram Foundation certificates are recognized by Anna University, state universities,
                    and autonomous engineering colleges towards NSS/YRC and mandatory social internship credits.
                  </p>
                </div>

                <div className="faq-item">
                  <h4>Who can I reach out to for technical assistance?</h4>
                  <p>
                    Email our Student Tech Support cell at{" "}
                    <strong>support@maatramfoundation.com</strong> or call our student helpline during
                    business hours.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
