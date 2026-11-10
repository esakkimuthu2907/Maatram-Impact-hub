// frontend/src/components/common/CertificateModal.jsx
// Official Hackforge Participation Certificate Implementation
// Faithful to the official Maatram Foundation Reference Design (media_1794282309128_391c3175.jpg)

import React, { useRef } from "react";
import {
  Download,
  Printer,
  Share2,
  X,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
  Award,
} from "lucide-react";
import certFooterImg from "../../assets/cert_footer_official.png";
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
    volunteerName = "Esakkimuthu.S",
    college = "Anna University, Chennai",
    eventTitle = "Hackforge Hackathon 2025",
    eventCategory = "Hackathon",
    verifiedHours = 24,
    pointsAwarded = 100,
    issueDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    signatoryName = "SUJITH KUMAR",
    signatoryTitle = "Founder & Managing Trustee",
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
              type="button"
              className="cert-btn cert-btn-linkedin"
              onClick={() => onOpenLinkedInShare?.(certificate)}
              title="Share this achievement to LinkedIn"
            >
              <Share2 size={15} /> Share to LinkedIn
            </button>

            <button
              type="button"
              className="cert-btn cert-btn-print"
              onClick={handlePrint}
              title="Print or Save as PDF"
            >
              <Printer size={15} /> Print / Download PDF
            </button>

            <button
              type="button"
              className="cert-modal-close-btn"
              onClick={onClose}
              aria-label="Close certificate"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* PRINTABLE HACKFORGE CERTIFICATE CANVAS (Strictly follows Reference Image) */}
        <div
          className="hackforge-cert-container"
          ref={printAreaRef}
          id="printable-certificate"
        >
          {/* Cyber / Binary Matrix Background Pattern */}
          <div className="cert-matrix-bg" aria-hidden="true">
            <div className="matrix-column col-1">0 1 1 0 1 0 0 1 1 0 1 1 0 1 0 1 1 0 0 1 0 1 0 0 1 1 1 0 1 0 1 1 0</div>
            <div className="matrix-column col-2">1 0 1 1 0 1 0 0 1 1 0 0 1 1 1 0 0 1 0 1 1 0 1 1 0 0 1 0 1 1 0 1 0</div>
            <div className="matrix-column col-3">0 0 1 0 1 1 1 0 1 0 1 0 0 1 1 0 1 0 1 1 0 1 0 0 1 1 0 1 0 0 1 1 1</div>
            <div className="matrix-column col-4">1 1 0 1 0 0 1 1 0 1 0 1 1 0 0 1 0 1 0 0 1 1 0 1 0 1 1 0 1 0 1 0 0</div>
            <div className="matrix-column col-5">0 1 0 1 1 0 0 1 0 1 1 0 1 0 1 1 0 0 1 0 1 1 0 0 1 0 1 1 0 1 0 1 1</div>
            <div className="matrix-column col-6">1 0 1 0 0 1 1 0 1 0 0 1 1 1 0 1 0 1 0 0 1 0 1 1 0 1 0 0 1 1 0 1 0</div>
            <div className="matrix-column col-7">0 1 1 0 1 0 1 1 0 1 0 0 1 0 1 0 1 1 0 1 0 0 1 1 0 1 0 1 0 1 1 0 0</div>
            <div className="matrix-column col-8">1 1 0 1 0 1 0 0 1 1 0 1 0 1 1 0 0 1 0 1 1 0 1 0 0 1 1 0 1 0 1 1 0</div>
          </div>

          <div className="hackforge-cert-content">
            {/* 1. Header: MAATRAM FOUNDATION with attractive, prestigious typography */}
            <div className="cert-top-header">
              <span className="cert-top-subtext">EDUCATIONAL & CHARITABLE TRUST</span>
              <h1 className="cert-foundation-title">MAATRAM FOUNDATION</h1>
              <div className="cert-gold-flourish">
                <span className="flourish-line" />
                <span className="flourish-diamond">&#9670;</span>
                <span className="flourish-line" />
              </div>
            </div>

            {/* 2. Gold Circular Participation Certificate Seal with Blue Ribbon tails */}
            <div className="cert-seal-wrapper">
              <div className="cert-seal-ribbons">
                <span className="ribbon-tail left-tail" />
                <span className="ribbon-tail right-tail" />
              </div>
              <div className="cert-gold-seal-disc">
                <div className="seal-serrated-border">
                  <div className="seal-inner-circle">
                    <span className="seal-text-part">PARTICIPATION</span>
                    <span className="seal-text-cert">CERTIFICATE</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. "This Certificate is awarded to" */}
            <div className="cert-award-intro">
              <p className="award-intro-text">This Certificate is awarded to</p>
            </div>

            {/* 4. Student Name Highlighted in Radiant Gold */}
            <div className="cert-recipient-section">
              <h2 className="recipient-gold-name">{volunteerName}</h2>
              <div className="recipient-name-divider" />
            </div>

            {/* 5. Participation Description */}
            <div className="cert-description-section">
              <p className="cert-desc-paragraph">
                for <strong>Participating</strong> in {eventTitle}, organized by Maatram Foundation.
              </p>
            </div>

            {/* Spacer / Divider before footer */}
            <div className="cert-mid-divider" />

            {/* 6. Crisp White Footer Section using the exact official attached graphic */}
            <div className="cert-white-footer-card">
              <img
                src={certFooterImg}
                alt="Maatram Foundation - Sujith Kumar, Founder & Managing Trustee"
                className="cert-official-footer-strip"
              />
            </div>

            {/* Bottom Verification & ID Tag */}
            <div className="cert-meta-footnote">
              <span>Certificate ID: {certificateId}</span>
              <span>&bull;</span>
              <span>Issue Date: {issueDate}</span>
              <span>&bull;</span>
              <span>Verified via Maatram Foundation Impact Hub</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
