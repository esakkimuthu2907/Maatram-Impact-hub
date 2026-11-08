// frontend/src/components/common/CertificateModal.jsx
import React, { useRef } from "react";
import {
  Download,
  Printer,
  Share2,
  X,
  Award,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
} from "lucide-react";
import "./CertificateModal.css";

export default function CertificateModal({
  isOpen,
  onClose,
  certificate,
  onOpenLinkedInShare,
}) {
  const printAreaRef = useRef(null);

  if (!isOpen || !certificate) return null;

  const {
    certificateId = "MF-CERT-2026-1042",
    volunteerName = "Student Volunteer",
    college = "Anna University, Chennai",
    eventTitle = "Govt School Career Orientation & Mentorship Drive",
    eventCategory = "School Visits",
    verifiedHours = 4,
    pointsAwarded = 50,
    issueDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    signatoryName = "Sujith Kumar",
    signatoryTitle = "Founder & Managing Trustee, Maatram Foundation",
  } = certificate;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="cert-modal-overlay" onClick={onClose}>
      <div className="cert-modal-wrapper" onClick={(e) => e.stopPropagation()}>
        {/* Modal Toolbar (hidden during print) */}
        <div className="cert-modal-toolbar">
          <div className="toolbar-left">
            <span className="cert-status-badge">
              <ShieldCheck size={14} color="#15803D" /> Official Verified Certificate
            </span>
            <span className="cert-id-tag">ID: {certificateId}</span>
          </div>

          <div className="toolbar-actions">
            <button
              className="cert-btn cert-btn-linkedin"
              onClick={() => onOpenLinkedInShare?.(certificate)}
              title="Share this achievement to LinkedIn"
            >
              <Share2 size={15} /> Share to LinkedIn
            </button>

            <button className="cert-btn cert-btn-print" onClick={handlePrint} title="Print or Save as PDF">
              <Printer size={15} /> Print / Save PDF
            </button>

            <button className="cert-modal-close-btn" onClick={onClose} aria-label="Close certificate">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* PRINTABLE CERTIFICATE CANVAS */}
        <div className="certificate-frame-container" ref={printAreaRef} id="printable-certificate">
          <div className="certificate-inner-border">
            {/* Corner Decorative Accents */}
            <div className="cert-corner top-left" />
            <div className="cert-corner top-right" />
            <div className="cert-corner bottom-left" />
            <div className="cert-corner bottom-right" />

            {/* Certificate Header */}
            <div className="cert-header">
              <div className="cert-logo-wrapper">
                <div className="cert-logo-pill">MAATRAM FOUNDATION</div>
                <div className="cert-tamil-subtitle">மாற்றம் அறக்கட்டளை &bull; கல்வி மற்றும் சமூக மேம்பாட்டு அறக்கட்டளை</div>
              </div>
              <div className="cert-tagline">
                Educational & Charitable Trust &bull; Registered NGO, Tamil Nadu
              </div>
            </div>

            {/* Certificate Title */}
            <div className="cert-title-section">
              <h1 className="cert-main-heading">CERTIFICATE OF APPRECIATION</h1>
              <p className="cert-sub-heading">FOR EXEMPLARY VOLUNTEERING SERVICE & SOCIAL LEADERSHIP</p>
            </div>

            {/* Certificate Body */}
            <div className="cert-body-section">
              <p className="cert-intro-text">This is proudly presented to certify that</p>
              
              <div className="cert-recipient-name">{volunteerName}</div>
              
              <div className="cert-recipient-org">
                of <strong>{college}</strong>
              </div>

              <p className="cert-description-text">
                has actively participated and successfully completed <strong>{verifiedHours} Verified Hours</strong> of dedicated on-ground community service in the initiative:
              </p>

              <div className="cert-event-title-box">
                <span className="event-box-cat">{eventCategory}</span>
                <h3 className="event-box-title">&ldquo;{eventTitle}&rdquo;</h3>
              </div>

              {/* Mandatory Thank You Quote */}
              <div className="cert-quote-box">
                &ldquo;Thank you for being part of the Maatram community. Your contribution is helping us build a better tomorrow!&rdquo;
              </div>
            </div>

            {/* Certificate Footer with Signatures & Official Seal */}
            <div className="cert-footer-section">
              {/* Left: Issue Date & Verification ID */}
              <div className="cert-footer-col left">
                <div className="cert-meta-item">
                  <span className="meta-label">Date of Issue:</span>
                  <strong className="meta-val">{issueDate}</strong>
                </div>
                <div className="cert-meta-item">
                  <span className="meta-label">Certificate ID:</span>
                  <strong className="meta-val font-mono">{certificateId}</strong>
                </div>
                <div className="cert-meta-item">
                  <span className="meta-label">Verified Contribution:</span>
                  <strong className="meta-val text-blue">{verifiedHours} Hours ({pointsAwarded} pts)</strong>
                </div>
              </div>

              {/* Center: Gold Official Seal */}
              <div className="cert-footer-col center">
                <div className="official-gold-seal">
                  <div className="seal-outer-ring">
                    <div className="seal-inner-circle">
                      <Sparkles size={24} color="#B45309" />
                      <span className="seal-text-top">MAATRAM</span>
                      <span className="seal-text-mid">OFFICIAL</span>
                      <span className="seal-text-bot">SEAL</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Authorised Signature */}
              <div className="cert-footer-col right">
                <div className="signature-line-box">
                  <div className="digital-signature-font">Sujith Kumar</div>
                  <div className="sig-rule" />
                  <div className="signatory-name-text">{signatoryName}</div>
                  <div className="signatory-title-text">{signatoryTitle}</div>
                </div>
              </div>
            </div>

            {/* Bottom Security Watermark */}
            <div className="cert-security-bar">
              <span>Verified digital credential issued via Maatram Impact Hub &bull; Document hash validated</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
