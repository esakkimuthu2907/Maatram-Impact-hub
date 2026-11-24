// frontend/src/pages/ApplyOpportunityPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Sparkles, ArrowRight } from "lucide-react";

import { useApp } from "../../context/AppContext";
import { eventsAPI } from "../../api/eventsAPI";
import "./OpportunitiesPage.css";

export default function ApplyOpportunityPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user = {}, opportunities = [], applyForOpportunity } = useApp();

  const [opp, setOpp] = useState(() => opportunities.find((o) => (o.id || o._id) === id));

  useEffect(() => {
    if (!opp && id) {
      eventsAPI
        .getById(id)
        .then((res) => {
          if (res && res.data) setOpp(res.data);
        })
        .catch(() => { });
    }
  }, [id, opp]);

  // Slot is no longer shown in the UI; the first/default slot is used automatically.
  const defaultSlots =
    opp?.slots && opp.slots.length > 0
      ? opp.slots
      : [
        {
          slotId: "slot_default_1",
          title: "General Volunteering Slot",
          time: opp?.time || "9:30 AM – 1:30 PM",
          capacity: opp?.volunteersNeeded || 10,
          filled: 0,
        },
      ];

  const selectedSlotId = defaultSlots[0]?.slotId || "slot_default_1";

  const [formData, setFormData] = useState({
    skills: user?.skills && Array.isArray(user.skills) ? user.skills.join(", ") : "Communication, Teamwork, Mentoring",
    motivation: "",
    experience: "",
    availableOnDate: true,
    consentUpdates: true,
    consentLinkedin: true,
    consentPrivacy: true,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedApp, setSubmittedApp] = useState(null);

  if (!opp) {
    return (
      <div className="apply-page-container" style={{ padding: "40px 24px", maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
        <button className="back-nav-btn" onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>
          <ArrowLeft size={18} /> Back to Opportunities
        </button>
        <div style={{ background: "#FFFFFF", padding: "48px 24px", borderRadius: 20, border: "1px dashed #CBD5E1" }}>
          <Sparkles size={40} color="#D97706" style={{ marginBottom: 12 }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>Loading Opportunity...</h2>
          <p style={{ color: "#64748B", fontSize: 14, marginBottom: 20 }}>
            Please wait while we prepare the volunteering drive details.
          </p>
          <Link to="/opportunities" className="dash-btn dash-btn-primary">
            Browse All Opportunities
          </Link>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.availableOnDate) {
      errs.availableOnDate = "You must confirm your availability on the event date.";
    }
    if (!formData.consentUpdates) {
      errs.consentUpdates = "Please agree to receive event updates.";
    }
    if (!formData.consentPrivacy) {
      errs.consentPrivacy = "You must accept the volunteer privacy consent.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const selectedSlotObj = defaultSlots.find((s) => s.slotId === selectedSlotId) || defaultSlots[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const oppId = (opp?.id || opp?._id || id || "").toString();
      const payload = {
        ...formData,
        opportunityId: oppId,
        slotId: selectedSlotId,
        slotName: selectedSlotObj?.title || "Standard Slot",
      };
      const appResult = await applyForOpportunity(oppId, payload);
      if (appResult) {
        setSubmittedApp(appResult);
      }
    } catch (err) {
      console.warn("Application submit notice:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="apply-page-container" style={{ maxWidth: 800, margin: "0 auto", padding: "28px 20px" }}>
      {/* Top back button */}
      <button
        className="back-nav-btn"
        onClick={() => navigate(-1)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "none",
          border: "none",
          color: "#475569",
          fontWeight: 600,
          fontSize: 14,
          cursor: "pointer",
          marginBottom: 20,
        }}
      >
        <ArrowLeft size={18} /> Back to Opportunity Details
      </button>

      {/* CONFIRMATION SCREEN UPON SUBMISSION */}
      {submittedApp ? (
        <div
          className="apply-success-card"
          style={{
            background: "#FFFFFF",
            borderRadius: 24,
            padding: "48px 32px",
            textAlign: "center",
            maxWidth: 640,
            margin: "0 auto",
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
            border: "1px solid #E2E8F0",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "#DCFCE7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <CheckCircle2 size={42} color="#166534" />
          </div>

          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#151515", margin: "0 0 10px" }}>
            Application Submitted!
          </h2>
          <p style={{ color: "#64748B", fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
            Thank you, <strong>{user?.fullName || user?.name || "Volunteer"}</strong>. Your application for{" "}
            <strong>"{opp.title}"</strong> is registered with reference{" "}
            <span style={{ color: "#0066CC", fontFamily: "monospace", fontWeight: 700 }}>
              {submittedApp.referenceId || "MAT-PENDING"}
            </span>
            .
          </p>

          <div
            style={{
              background: "#F8FAFC",
              borderRadius: 16,
              padding: "20px 24px",
              textAlign: "left",
              border: "1px solid #E2E8F0",
              marginBottom: 28,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ color: "#64748B", fontSize: 13 }}>Selected Slot:</span>
              <strong style={{ color: "#0F172A", fontSize: 13.5 }}>{selectedSlotObj?.title || "Confirmed"}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ color: "#64748B", fontSize: 13 }}>Drive Date & Venue:</span>
              <strong style={{ color: "#0F172A", fontSize: 13.5 }}>
                {opp.date} • {opp.location}
              </strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748B", fontSize: 13 }}>Potential Points:</span>
              <strong style={{ color: "#D97706", fontSize: 13.5 }}>+{opp.points || 50} Volunteering Points</strong>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Link to="/applications" className="dash-btn dash-btn-primary">
              View My Applications <ArrowRight size={16} />
            </Link>
            <Link to={`/opportunities/${opp.id || opp._id}`} className="dash-btn dash-btn-outline">
              Back to Event
            </Link>
          </div>
        </div>
      ) : (
        /* APPLICATION FORM LAYOUT */
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 20,
            padding: "36px 32px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 6px 20px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#151515", margin: "0 0 6px" }}>
              Apply for {opp.title}
            </h2>
            <p style={{ color: "#717784", fontSize: 14.5, margin: 0, lineHeight: 1.5 }}>
              Review your credentials and submit your application.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="apply-form-body">
            {/* 01: APPLICANT PREVIEW */}
            <div style={{ marginBottom: 24 }}>
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 12,
                }}
              >
                01. Student Volunteer Credentials
              </h3>
              <div
                style={{
                  background: "#F8FAFC",
                  borderRadius: 14,
                  padding: "18px 20px",
                  border: "1px solid #E2E8F0",
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 14,
                  fontSize: 13,
                }}
              >
                <div>
                  <small style={{ color: "#94A3B8", display: "block", marginBottom: 2 }}>Student Name</small>
                  <strong style={{ color: "#1E293B", fontSize: 14 }}>
                    {user?.fullName || user?.name || "Student Volunteer"}
                  </strong>
                </div>
                <div>
                  <small style={{ color: "#94A3B8", display: "block", marginBottom: 2 }}>Registration ID</small>
                  <strong style={{ color: "#1E293B", fontSize: 14, fontFamily: "monospace" }}>
                    {user?.applicationId || user?.id || "MAA001"}
                  </strong>
                </div>
                <div>
                  <small style={{ color: "#94A3B8", display: "block", marginBottom: 2 }}>Email Address</small>
                  <span style={{ color: "#334155" }}>{user?.email || "student@maatram.org"}</span>
                </div>
                <div>
                  <small style={{ color: "#94A3B8", display: "block", marginBottom: 2 }}>College & Department</small>
                  <span style={{ color: "#334155" }}>
                    {user?.college || "Anna University"} ({user?.department || "Engineering"})
                  </span>
                </div>
              </div>
            </div>

            {/* CONSENTS */}
            <div
              style={{
                marginBottom: 28,
                background: "#F8FAFC",
                padding: "16px 20px",
                borderRadius: 12,
                border: "1px solid #E2E8F0",
              }}
            >
              <label
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  marginBottom: 10,
                  cursor: "pointer",
                  fontSize: 13,
                  color: "#334155",
                }}
              >
                <input
                  type="checkbox"
                  name="availableOnDate"
                  checked={formData.availableOnDate}
                  onChange={handleChange}
                  style={{ marginTop: 2 }}
                />
                <span>
                  I confirm my availability on <strong>{opp.date}</strong> for the selected slot.
                </span>
              </label>

              <label
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  cursor: "pointer",
                  fontSize: 13,
                  color: "#334155",
                }}
              >
                <input
                  type="checkbox"
                  name="consentPrivacy"
                  checked={formData.consentPrivacy}
                  onChange={handleChange}
                  style={{ marginTop: 2 }}
                />
                <span>I agree to uphold the Maatram Foundation volunteer code of ethics.</span>
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button type="button" className="dash-btn dash-btn-outline" onClick={() => navigate(-1)}>
                Cancel
              </button>
              <button type="submit" className="dash-btn dash-btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "Submitting Application..." : "Submit Application"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}