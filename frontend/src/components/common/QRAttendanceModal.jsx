// frontend/src/components/common/QRAttendanceModal.jsx
import React, { useState, useEffect } from "react";
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Printer,
  Copy,
  Check,
  ShieldCheck,
  Users,
  Clock,
  Sparkles,
  Camera,
  KeyRound,
  ArrowRight,
} from "lucide-react";
import { eventsAPI } from "../../api/eventsAPI";
import "./QRAttendanceModal.css";

// Pure SVG QR Code Matrix Generator (deterministic 21x21 standard matrix based on hash)
function QRCodeSVG({ value, size = 200 }) {
  // Generate deterministic grid pattern based on string hash
  const gridSize = 25;
  const hash = Array.from(value || "MAATRAM").reduce(
    (acc, char, i) => acc + char.charCodeAt(0) * (i + 1),
    0
  );

  const cells = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      // Standard QR position markers (Top-Left, Top-Right, Bottom-Left)
      const isTopLeft = r < 7 && c < 7;
      const isTopRight = r < 7 && c >= gridSize - 7;
      const isBottomLeft = r >= gridSize - 7 && c < 7;

      let filled = false;

      if (isTopLeft || isTopRight || isBottomLeft) {
        // Corner squares logic
        const localR = isBottomLeft ? r - (gridSize - 7) : r;
        const localC = isTopRight ? c - (gridSize - 7) : c;
        if (localR === 0 || localR === 6 || localC === 0 || localC === 6) {
          filled = true;
        } else if (localR >= 2 && localR <= 4 && localC >= 2 && localC <= 4) {
          filled = true;
        }
      } else if (r === 6 || c === 6) {
        // Timing patterns
        filled = (r + c) % 2 === 0;
      } else {
        // Data pattern pseudo-randomized by hash and coordinate
        const seed = (r * 31 + c * 17 + hash) % 100;
        filled = seed > 45;
      }

      if (filled) {
        cells.push({ r, c });
      }
    }
  }

  const cellSize = size / gridSize;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="qr-svg-canvas">
      <rect width={size} height={size} fill="#FFFFFF" rx="8" />
      {cells.map((cell, idx) => (
        <rect
          key={idx}
          x={cell.c * cellSize}
          y={cell.r * cellSize}
          width={cellSize + 0.1}
          height={cellSize + 0.1}
          fill="#0F172A"
        />
      ))}
      {/* Center Branding Accent */}
      <rect
        x={size / 2 - 14}
        y={size / 2 - 14}
        width={28}
        height={28}
        fill="#FFD629"
        rx="4"
        stroke="#004D99"
        strokeWidth="2"
      />
      <text
        x={size / 2}
        y={size / 2 + 5}
        textAnchor="middle"
        fontSize="12"
        fontWeight="900"
        fill="#002B59"
        fontFamily="sans-serif"
      >
        M
      </text>
    </svg>
  );
}

export default function QRAttendanceModal({
  isOpen,
  onClose,
  event,
  user,
  isAdmin = false,
  onAttendanceVerified,
  showToast,
}) {
  const [activeTab, setActiveTab] = useState(isAdmin ? "qr_display" : "scan");
  const [qrToken, setQrToken] = useState(event?.qrCodeToken || `MF-QR-${event?.id || "TOKEN"}`);
  const [manualToken, setManualToken] = useState("");
  const [scanning, setScanning] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState("");
  const [attendanceRoster, setAttendanceRoster] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const eventId = event?.id || event?._id;

  // Load roster when admin tab opens
  const loadRoster = async () => {
    if (!eventId) return;
    try {
      setLoadingRoster(true);
      const res = await eventsAPI.getAttendance(eventId);
      if (res && res.data) {
        setAttendanceRoster(res.data);
      }
    } catch (err) {
      console.warn("Could not load attendance roster:", err.message);
    } finally {
      setLoadingRoster(false);
    }
  };

  useEffect(() => {
    if (isOpen && eventId) {
      if (event?.qrCodeToken) setQrToken(event.qrCodeToken);
      loadRoster();
    }
  }, [isOpen, eventId]);

  if (!isOpen || !event) return null;

  // Admin: Generate new QR Code
  const handleRegenerateQR = async () => {
    try {
      const res = await eventsAPI.generateQRToken(eventId);
      if (res && res.data) {
        setQrToken(res.data.qrCodeToken);
        showToast?.("Generated fresh event QR code!");
      }
    } catch (err) {
      showToast?.(err.message || "Failed to generate QR token", "error");
    }
  };

  // Student: Check-in with QR code or manual token
  const handleCheckIn = async (tokenToUse) => {
    try {
      setScanning(true);
      const res = await eventsAPI.checkInViaQR(eventId, tokenToUse || manualToken || qrToken);
      setCheckInSuccess(true);
      setCheckInMessage(res.message || "Attendance recorded successfully! Awaiting admin hours verification.");
      showToast?.("QR Attendance Recorded! ✅");
      loadRoster();
    } catch (err) {
      showToast?.(err.message || "Check-in failed. Please verify approval.", "error");
    } finally {
      setScanning(false);
    }
  };

  // Admin: Verify Participation & Award Hours for all checked-in volunteers
  const handleVerifyParticipation = async () => {
    try {
      setVerifying(true);
      // Collect all checked-in or registered volunteers
      const records = (event.registeredVolunteers || attendanceRoster || []).map((v) => ({
        applicationId: v.applicationId || v._id || v.id,
        userId: v.userId?._id || v.userId || v.id,
        status: "Present",
      }));

      const { adminAPI } = await import("../../api/adminAPI");
      const res = await adminAPI.trackAttendance(eventId, records);
      showToast?.("Attendance verified & verified hours credited to all volunteers! 🎉");
      onAttendanceVerified?.();
      loadRoster();
      onClose();
    } catch (err) {
      showToast?.(err.message || "Could not verify attendance", "error");
    } finally {
      setVerifying(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(qrToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handlePrintQR = () => {
    window.print();
  };

  return (
    <div className="qr-modal-overlay" onClick={onClose}>
      <div className="qr-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="qr-modal-header">
          <div className="qr-header-icon">
            <QrCode size={24} color="#004D99" />
          </div>
          <div className="qr-header-title">
            <h3>Event QR Attendance & Verification</h3>
            <p>{event.title}</p>
          </div>
          <button className="qr-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Tab switcher for Admin */}
        {isAdmin && (
          <div className="qr-tabs-bar">
            <button
              className={`qr-tab-btn ${activeTab === "qr_display" ? "active" : ""}`}
              onClick={() => setActiveTab("qr_display")}
            >
              <QrCode size={15} /> Event QR Code
            </button>
            <button
              className={`qr-tab-btn ${activeTab === "live_roster" ? "active" : ""}`}
              onClick={() => setActiveTab("live_roster")}
            >
              <Users size={15} /> Live Attendance Roster ({attendanceRoster.length})
            </button>
          </div>
        )}

        {/* ADMIN TAB 1: QR CODE DISPLAY */}
        {(activeTab === "qr_display" || (!isAdmin && activeTab === "display")) && (
          <div className="qr-content-card">
            <div className="qr-instructions-banner">
              <Sparkles size={16} color="#D97706" />
              <span>
                <strong>Workflow:</strong> Display this QR Code at the event venue. Approved volunteers scan this code to record attendance. Admin then verifies participation to credit verified hours!
              </span>
            </div>

            <div className="qr-code-center-frame">
              <div className="qr-code-box" id="printable-qr-code">
                <div className="qr-box-header">
                  <div className="qr-maatram-pill">MAATRAM IMPACT HUB</div>
                  <h4>{event.title}</h4>
                  <p>{event.date} &bull; {event.location || "Tamil Nadu"}</p>
                </div>

                <div className="qr-svg-wrap">
                  <QRCodeSVG value={qrToken} size={220} />
                </div>

                <div className="qr-code-footer-code">
                  <span className="code-label">Check-in Token:</span>
                  <strong className="code-value">{qrToken}</strong>
                </div>
              </div>
            </div>

            <div className="qr-action-buttons-row">
              <button className="qr-btn qr-btn-secondary" onClick={handleCopyCode}>
                {copiedToken ? <Check size={16} color="#16A34A" /> : <Copy size={16} />}
                {copiedToken ? "Copied Token!" : "Copy Token"}
              </button>

              <button className="qr-btn qr-btn-secondary" onClick={handlePrintQR}>
                <Printer size={16} /> Print Event Poster
              </button>

              {isAdmin && (
                <button className="qr-btn qr-btn-secondary" onClick={handleRegenerateQR}>
                  <RefreshCw size={16} /> Regenerate QR
                </button>
              )}
            </div>
          </div>
        )}

        {/* ADMIN TAB 2: LIVE ATTENDANCE ROSTER & VERIFICATION */}
        {isAdmin && activeTab === "live_roster" && (
          <div className="roster-view-section">
            <div className="roster-stats-row">
              <div className="roster-stat-pill">
                <Users size={14} color="#0066CC" />
                <span>Check-ins Logged: <strong>{attendanceRoster.length}</strong></span>
              </div>
              <div className="roster-stat-pill">
                <Clock size={14} color="#16A34A" />
                <span>Credited per Volunteer: <strong>{event.durationHours || 4} hrs</strong></span>
              </div>
            </div>

            <div className="roster-table-container">
              {attendanceRoster.length === 0 ? (
                <div className="roster-empty-state">
                  <Users size={32} color="#94A3B8" />
                  <p>No volunteer has checked in yet. Volunteers will appear here as they scan the QR code.</p>
                </div>
              ) : (
                <table className="roster-table">
                  <thead>
                    <tr>
                      <th>Volunteer</th>
                      <th>Check-in Method</th>
                      <th>Time</th>
                      <th>Attendance Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceRoster.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.volunteerName || item.user?.fullName || "Volunteer"}</strong>
                          <span className="sub-text">{item.user?.college || item.volunteerEmail}</span>
                        </td>
                        <td>
                          <span className="checkin-method-badge">{item.checkInMethod || "QR_SCAN"}</span>
                        </td>
                        <td>
                          {new Date(item.checkInTime || item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td>
                          <span className="status-pill-present">
                            <CheckCircle2 size={13} /> {item.status || "Checked-In"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Verification trigger */}
            <div className="roster-verify-footer">
              <div className="verify-info-text">
                <ShieldCheck size={18} color="#15803D" />
                <span>
                  Verifying participation will award <strong>+{event.points || 50} Points</strong>, credit <strong>{event.durationHours || 4} Verified Hours</strong>, issue official certificates, and send thank-you emails!
                </span>
              </div>
              <button
                className="qr-btn qr-btn-primary"
                onClick={handleVerifyParticipation}
                disabled={verifying}
              >
                {verifying ? "Verifying & Crediting..." : "Verify All & Issue Verified Hours"}
              </button>
            </div>
          </div>
        )}

        {/* VOLUNTEER SCAN / CHECK-IN TAB */}
        {!isAdmin && activeTab === "scan" && (
          <div className="volunteer-scan-section">
            {checkInSuccess ? (
              <div className="scan-success-card">
                <div className="success-icon-wrap">
                  <CheckCircle2 size={44} color="#15803D" />
                </div>
                <h3>Attendance Recorded!</h3>
                <p>{checkInMessage}</p>
                <div className="success-details-pill">
                  <span>Drive: <strong>{event.title}</strong></span>
                  <span>Hours Pending Audit: <strong>{event.durationHours || 4} hrs</strong></span>
                </div>
                <button className="qr-btn qr-btn-primary" onClick={onClose} style={{ marginTop: 16 }}>
                  Close & View Dashboard
                </button>
              </div>
            ) : (
              <div className="scan-interactive-box">
                <div className="camera-sim-view">
                  <div className="camera-overlay-frame">
                    <div className="scan-laser-line" />
                    <Camera size={38} color="#FFFFFF" />
                    <span>Point device at Event Coordinator's QR Code</span>
                  </div>
                </div>

                <div className="sim-scan-action">
                  <button
                    className="qr-btn qr-btn-primary full-width"
                    onClick={() => handleCheckIn(qrToken)}
                    disabled={scanning}
                  >
                    {scanning ? "Recording Attendance..." : "Simulate QR Code Scan & Check-in"}
                  </button>
                </div>

                <div className="or-divider">
                  <span>OR ENTER CHECK-IN CODE</span>
                </div>

                <div className="manual-code-row">
                  <div className="code-input-wrap">
                    <KeyRound size={16} color="#64748B" />
                    <input
                      type="text"
                      placeholder="e.g. MF-QR-AB12-34CD"
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                    />
                  </div>
                  <button
                    className="qr-btn qr-btn-secondary"
                    onClick={() => handleCheckIn(manualToken)}
                    disabled={!manualToken.trim() || scanning}
                  >
                    Submit Code
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
