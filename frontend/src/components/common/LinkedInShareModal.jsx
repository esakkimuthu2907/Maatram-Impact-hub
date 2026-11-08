// frontend/src/components/common/LinkedInShareModal.jsx
import React, { useState } from "react";
import {
  Share2,
  Copy,
  Check,
  ExternalLink,
  X,
  Sparkles,
  Heart,
  Award,
  Clock,
  Calendar,
  Building2,
  ShieldCheck,
} from "lucide-react";
import "./LinkedInShareModal.css";

export default function LinkedInShareModal({
  isOpen,
  onClose,
  volunteerName,
  eventTitle,
  hours = 4,
  category = "Volunteering",
  date = "",
  certificateId = "",
  onShared,
}) {
  if (!isOpen) return null;

  const defaultQuote = "Thank you for being part of the Maatram community. Your contribution is helping us build a better tomorrow!";

  const generatedPostTemplate = `Proud to contribute ${hours} verified hours of volunteering with Maatram Foundation for "${eventTitle}"! 🌟

${defaultQuote}

Dedicated to empowering underprivileged students and youth across Tamil Nadu through education, career guidance, and social transformation.

Event Details:
📌 Initiative: ${eventTitle}
🏷️ Category: ${category}
⏱️ Verified Hours: ${hours} Hours
${certificateId ? `📜 Verified Certificate ID: ${certificateId}\n` : ""}
Heartfelt thanks to the Maatram Foundation mentors, coordinators, and fellow volunteers for making this drive impactful!

#MaatramFoundation #SocialImpact #YouthLeadership #Volunteering #GiveBack #CommunityTransformation #BuildingABetterTomorrow`;

  const [postText, setPostText] = useState(generatedPostTemplate);
  const [copied, setCopied] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(postText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2400);
  };

  const handleShareToLinkedIn = () => {
    // Copy first for easy paste into LinkedIn feed
    navigator.clipboard.writeText(postText);
    setCopied(true);

    // Open LinkedIn feed share
    const shareUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(postText)}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");

    onShared?.();
  };

  return (
    <div className="linkedin-modal-overlay" onClick={onClose}>
      <div className="linkedin-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="linkedin-modal-header">
          <div className="header-icon-badge">
            <Share2 size={22} color="#0A66C2" />
          </div>
          <div className="header-text-block">
            <h3>Share Achievement on LinkedIn</h3>
            <p>Showcase your verified social impact to your professional network</p>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Highlighted Thank-You Quote Card */}
        <div className="thank-you-quote-card">
          <div className="quote-icon-col">
            <Heart size={20} fill="#E11D48" color="#E11D48" />
          </div>
          <div className="quote-text-col">
            <span className="quote-eyebrow">Maatram Community Recognition</span>
            <p className="quote-body">&ldquo;{defaultQuote}&rdquo;</p>
          </div>
        </div>

        {/* Quick Highlights Row */}
        <div className="impact-highlights-row">
          <div className="highlight-pill">
            <Clock size={14} color="#0066CC" />
            <span><strong>{hours}</strong> Verified Hours</span>
          </div>
          <div className="highlight-pill">
            <Award size={14} color="#D97706" />
            <span><strong>+{hours * 10}</strong> Points Credited</span>
          </div>
          {certificateId && (
            <div className="highlight-pill">
              <ShieldCheck size={14} color="#16A34A" />
              <span>Cert: <strong>{certificateId}</strong></span>
            </div>
          )}
        </div>

        {/* Ready-to-share post preview */}
        <div className="post-preview-section">
          <div className="post-preview-label-row">
            <label htmlFor="post-content-preview">
              <Sparkles size={14} color="#0A66C2" /> Generated Ready-to-Share Post (Editable)
            </label>
            <span className="consent-reminder-tag">Consent-First Sharing</span>
          </div>

          <textarea
            id="post-content-preview"
            className="post-textarea"
            rows={8}
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
          />
        </div>

        {/* Volunteer Consent Checkbox */}
        <div className="consent-checkbox-wrap">
          <label className="consent-label">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
            />
            <span>
              I review and consent to share this volunteering accomplishment and post text to my LinkedIn profile.
            </span>
          </label>
        </div>

        {/* Footer Actions */}
        <div className="linkedin-modal-footer">
          <button className="btn-copy-post" onClick={handleCopy}>
            {copied ? (
              <>
                <Check size={16} color="#16A34A" /> Copied to Clipboard!
              </>
            ) : (
              <>
                <Copy size={16} /> Copy Post Text
              </>
            )}
          </button>

          <button
            className="btn-share-linkedin"
            onClick={handleShareToLinkedIn}
            disabled={!consentGiven}
            title={!consentGiven ? "Please tick the consent checkbox above to enable sharing" : "Open LinkedIn to publish post"}
          >
            <Share2 size={16} /> Open LinkedIn Share Page <ExternalLink size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
