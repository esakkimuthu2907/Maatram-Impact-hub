// frontend/src/components/common/EventFeedbackModal.jsx
import React, { useState } from "react";
import { Star, X, CheckCircle2, MessageSquare, Award, Sparkles, Send } from "lucide-react";
import { eventsAPI } from "../../api/eventsAPI";

export default function EventFeedbackModal({
  isOpen,
  onClose,
  certificate,
  onFeedbackSuccess,
}) {
  const [rating, setRating] = useState(5);
  const [coordinatorRating, setCoordinatorRating] = useState(5);
  const [organizationRating, setOrganizationRating] = useState(5);
  const [recommendRating, setRecommendRating] = useState("Definitely");
  const [comment, setComment] = useState("");
  const [takeaways, setTakeaways] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !certificate) return null;

  const eventTitle = certificate.eventTitle || "Volunteering Event";
  const eventId = certificate.eventId || certificate.id;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!eventId) {
      setError("Event identifier missing.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const res = await eventsAPI.submitFeedback(eventId, {
        rating,
        coordinatorRating,
        organizationRating,
        recommendRating,
        comment,
        takeaways,
        studentName: certificate.volunteerName,
        studentEmail: certificate.volunteerEmail,
      });

      if (res.data?.success) {
        onFeedbackSuccess?.({
          ...certificate,
          unlocked: true,
          feedbackSubmitted: true,
        });
        onClose();
      } else {
        setError(res.data?.message || "Failed to submit feedback.");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange, label }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#1E293B" }}>{label}</span>
        <span style={{ fontSize: 12.5, fontWeight: 800, color: "#CA8A04" }}>
          {value} / 5 Stars
        </span>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 2,
              display: "flex",
              alignItems: "center",
              transition: "transform 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
          >
            <Star
              size={26}
              color={star <= value ? "#EAB308" : "#CBD5E1"}
              fill={star <= value ? "#EAB308" : "none"}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        zIndex: 9999,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 24,
          maxWidth: 580,
          width: "100%",
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.3)",
          position: "relative",
          animation: "fadeIn 0.2s ease-out",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
            color: "#FFFFFF",
            padding: "24px 28px",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span
              style={{
                background: "#FEF08A",
                color: "#854D0E",
                fontSize: 11,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                padding: "3px 10px",
                borderRadius: 6,
              }}
            >
              Event Completed &bull; Certificate Unlock
            </span>
          </div>

          <h3 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 900, color: "#FFFFFF" }}>
            Submit Feedback to Unlock Certificate
          </h3>
          <p style={{ margin: 0, fontSize: 13.5, color: "#94A3B8", lineHeight: 1.5 }}>
            Share your experience for <strong style={{ color: "#FDE047" }}>{eventTitle}</strong> to preview and download your official Certificate of Appreciation.
          </p>

          <button
            type="button"
            onClick={onClose}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              background: "rgba(255, 255, 255, 0.15)",
              border: "none",
              color: "#FFFFFF",
              width: 34,
              height: 34,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: "24px 28px" }}>
          {error && (
            <div
              style={{
                background: "#FEE2E2",
                color: "#991B1B",
                border: "1px solid #FCA5A5",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          {/* Star Ratings */}
          <StarRating
            value={rating}
            onChange={setRating}
            label="1. Overall Volunteering Experience *"
          />

          <StarRating
            value={coordinatorRating}
            onChange={setCoordinatorRating}
            label="2. Coordinator Support & Leadership Guidance *"
          />

          <StarRating
            value={organizationRating}
            onChange={setOrganizationRating}
            label="3. Event Organization, Venue & Refreshments *"
          />

          {/* Would you volunteer again? */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 8 }}>
              4. Would you volunteer with Maatram Foundation again? *
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { key: "Definitely", label: "🚀 Definitely", bg: "#DCFCE7", color: "#166534", border: "#86EFAC" },
                { key: "Likely", label: "👍 Likely", bg: "#EFF6FF", color: "#1E40AF", border: "#93C5FD" },
                { key: "Maybe", label: "🤔 Maybe", bg: "#FEF9C3", color: "#854D0E", border: "#FDE047" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setRecommendRating(opt.key)}
                  style={{
                    flex: 1,
                    padding: "9px 12px",
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    background: recommendRating === opt.key ? opt.bg : "#F8FAFC",
                    color: recommendRating === opt.key ? opt.color : "#475569",
                    border: recommendRating === opt.key ? `2px solid ${opt.border}` : "1.5px solid #E2E8F0",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Key Learnings */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 6 }}>
              5. What was your key takeaway or personal learning?
            </label>
            <textarea
              value={takeaways}
              onChange={(e) => setTakeaways(e.target.value)}
              placeholder="E.g., Learned teamwork under pressure, enjoyed mentoring students, built confidence..."
              rows={2}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 12,
                border: "1.5px solid #CBD5E1",
                fontSize: 13.5,
                color: "#0F172A",
                outline: "none",
                boxSizing: "border-box",
                resize: "vertical",
              }}
            />
          </div>

          {/* Feedback & Suggestions */}
          <div style={{ marginBottom: 22 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 6 }}>
              6. Comments or suggestions for the Maatram team:
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share what went exceptionally well or how we can make future drives even better..."
              rows={3}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 12,
                border: "1.5px solid #CBD5E1",
                fontSize: 13.5,
                color: "#0F172A",
                outline: "none",
                boxSizing: "border-box",
                resize: "vertical",
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: "11px 20px",
                borderRadius: 12,
                border: "1.5px solid #CBD5E1",
                background: "#FFFFFF",
                color: "#475569",
                fontSize: 13.5,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "11px 24px",
                borderRadius: 12,
                border: "none",
                background: "#FACC15",
                color: "#000000",
                fontSize: 14,
                fontWeight: 900,
                cursor: submitting ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 4px 14px rgba(250, 204, 21, 0.4)",
              }}
            >
              <Award size={16} />
              {submitting ? "Submitting..." : "Submit Feedback & Unlock Certificate →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
