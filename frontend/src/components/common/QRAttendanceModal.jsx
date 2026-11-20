// frontend/src/components/common/QRAttendanceModal.jsx
import React, { useState, useEffect, useRef } from "react";
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
  Mail,
  Send,
  Ban,
  RotateCcw,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Html5Qrcode } from "html5-qrcode";
import { eventsAPI } from "../../api/eventsAPI";
import "./QRAttendanceModal.css";

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
  const [qrToken, setQrToken] = useState(event?.qrCodeToken || `MFQR-${event?.id || "TOKEN"}`);
  const [attendanceOpen, setAttendanceOpen] = useState(event?.attendanceOpen !== false);
  const [manualToken, setManualToken] = useState("");
  const [scanning, setScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState("");
  const [attendanceRoster, setAttendanceRoster] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [confirmingSelection, setConfirmingSelection] = useState(false);
  const [retryingEmails, setRetryingEmails] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [emailStats, setEmailStats] = useState(null);

  const eventId = event?.id || event?._id;
  const scannerRef = useRef(null);

  // Load roster when modal opens
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
      setAttendanceOpen(event?.attendanceOpen !== false);
      loadRoster();
    }
  }, [isOpen, eventId]);

  // Clean up camera scanner on unmount or modal close
  useEffect(() => {
    return () => {
      stopCameraScanner();
    };
  }, []);

  const stopCameraScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.warn("Error stopping scanner:", err.message);
      }
      scannerRef.current = null;
      setCameraActive(false);
    }
  };

  const startCameraScanner = async () => {
    setCameraError("");
    try {
      setCameraActive(true);
      // Wait for DOM element to render
      setTimeout(async () => {
        const scannerElement = document.getElementById("qr-reader-viewport");
        if (!scannerElement) return;

        const html5QrCode = new Html5Qrcode("qr-reader-viewport");
        scannerRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        try {
          await html5QrCode.start(
            { facingMode: "environment" },
            config,
            async (decodedText) => {
              console.log("[Scanner] QR decoded successfully:", decodedText);
              await stopCameraScanner();
              handleCheckIn(decodedText);
            },
            () => {
              // Ignore frame errors while hunting for QR
            }
          );
        } catch (startErr) {
          console.warn("Could not start environment camera, trying user camera:", startErr.message);
          try {
            await html5QrCode.start(
              { facingMode: "user" },
              config,
              async (decodedText) => {
                await stopCameraScanner();
                handleCheckIn(decodedText);
              },
              () => { }
            );
          } catch (userCamErr) {
            setCameraError(
              "Camera access denied or unavailable. Please use manual code check-in below."
            );
            setCameraActive(false);
          }
        }
      }, 100);
    } catch (err) {
      setCameraError(err.message || "Failed to initialize camera scanner.");
      setCameraActive(false);
    }
  };

  if (!isOpen || !event) return null;

  // Admin: Generate fresh QR Code with cryptographically secure random token & SHA-256 hash
  const handleRegenerateQR = async () => {
    try {
      const res = await eventsAPI.generateQRToken(eventId, 24);
      if (res && res.data) {
        setQrToken(res.data.qrCodeToken);
        setAttendanceOpen(true);
        showToast?.("Generated fresh event QR code (SHA-256 protected, 24h validity)!");
      }
    } catch (err) {
      showToast?.(err.message || "Failed to generate QR token", "error");
    }
  };

  // Admin: Invalidate QR Code
  const handleInvalidateQR = async () => {
    if (!window.confirm("Invalidate this QR code? Volunteers will no longer be able to check in.")) return;
    try {
      await eventsAPI.invalidateQRToken(eventId);
      setAttendanceOpen(false);
      showToast?.("QR code invalidated and attendance closed for check-ins.");
    } catch (err) {
      showToast?.(err.message || "Failed to invalidate QR code", "error");
    }
  };

  // Admin: Confirm Volunteer Selection (Module 1 - Email 1)
  const handleConfirmSelection = async () => {
    try {
      setConfirmingSelection(true);
      const res = await eventsAPI.confirmSelection(eventId);
      setEmailStats({
        sent: res.sentCount || 0,
        failed: res.failedCount || 0,
        skipped: res.skippedCount || 0,
      });
      showToast?.(
        res.message ||
        `Selection emails dispatched! Sent: ${res.sentCount || 0}, Skipped: ${res.skippedCount || 0}`
      );
    } catch (err) {
      showToast?.(err.message || "Failed to confirm volunteer selection.", "error");
    } finally {
      setConfirmingSelection(false);
    }
  };

  // Admin: Close Attendance & Verify Hours (Module 1 - Email 2 & Module 3)
  const handleCloseAttendanceAndVerify = async () => {
    if (
      !window.confirm(
        "Close attendance and verify volunteer completion? This will credit 10 points per verified hour, update student profiles, update leaderboard rankings, and send thank-you completion emails."
      )
    ) {
      return;
    }

    try {
      setVerifying(true);
      const res = await eventsAPI.closeAttendance(eventId, {
        defaultHours: event.durationHours || 4,
      });

      setAttendanceOpen(false);
      setEmailStats({
        sent: res.sentCount || 0,
        failed: res.failedCount || 0,
        skipped: res.skippedCount || 0,
      });

      showToast?.(
        `Attendance closed! Verified ${res.verifiedCount || 0} volunteers. Points & thank-you emails dispatched!`
      );
      onAttendanceVerified?.();
      await loadRoster();
    } catch (err) {
      showToast?.(err.message || "Could not close attendance and verify.", "error");
    } finally {
      setVerifying(false);
    }
  };

  // Admin: Retry failed emails
  const handleRetryFailedEmails = async () => {
    try {
      setRetryingEmails(true);
      const res = await eventsAPI.retryFailedEmails(eventId);
      showToast?.("Retried failed email dispatches.");
    } catch (err) {
      showToast?.(err.message || "Could not retry emails.", "error");
    } finally {
      setRetryingEmails(false);
    }
  };

  // Student: Check-in with QR code or manual token
  const handleCheckIn = async (tokenToUse) => {
    const finalToken = (tokenToUse || manualToken || "").trim();
    if (!finalToken) {
      showToast?.("Please scan a valid QR code or enter your check-in code.", "error");
      return;
    }

    try {
      setScanning(true);
      const res = await eventsAPI.checkInViaQR(eventId, finalToken);
      setCheckInSuccess(true);
      setCheckInMessage(
        res.message || "Attendance recorded successfully! Awaiting admin hours verification."
      );
      showToast?.("QR Attendance Recorded! ✅");
      loadRoster();
    } catch (err) {
      showToast?.(err.message || "Check-in failed. Please verify approval.", "error");
    } finally {
      setScanning(false);
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
            <p>
              {event.title} &bull; {event.date}
            </p>
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
                <strong>Dynamic QR Workflow:</strong> Display this QR Code at the event venue. Only
                approved volunteers can scan this code. Tokens are cryptographically secure and
                SHA-256 hashed.
              </span>
            </div>

            {/* Email Stats Notification Pill */}
            {emailStats && (
              <div
                style={{
                  background: "#EFF6FF",
                  border: "1px solid #BFDBFE",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  display: "flex",
                  gap: "14px",
                  fontSize: "13px",
                  color: "#1E40AF",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>
                  <strong>Email Delivery:</strong> Sent: {emailStats.sent} | Skipped:{" "}
                  {emailStats.skipped} | Failed: {emailStats.failed}
                </span>
                {emailStats.failed > 0 && (
                  <button
                    onClick={handleRetryFailedEmails}
                    disabled={retryingEmails}
                    style={{
                      background: "#2563EB",
                      color: "#fff",
                      border: "none",
                      padding: "4px 10px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <RotateCcw size={12} /> Retry Failed
                  </button>
                )}
              </div>
            )}

            <div className="qr-code-center-frame">
              <div className="qr-code-box" id="printable-qr-code">
                <div className="qr-box-header">
                  <div className="qr-maatram-pill">MAATRAM IMPACT HUB</div>
                  <h4>{event.title}</h4>
                  <p>
                    {event.date} &bull; {event.location || "Tamil Nadu"}
                  </p>
                  {!attendanceOpen && (
                    <span
                      style={{
                        background: "#FEE2E2",
                        color: "#DC2626",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: 700,
                        marginTop: 4,
                        display: "inline-block",
                      }}
                    >
                      ATTENDANCE CLOSED
                    </span>
                  )}
                </div>

                <div className="qr-svg-wrap" style={{ padding: "12px", background: "#fff", borderRadius: "12px" }}>
                  <QRCodeSVG
                    value={qrToken}
                    size={220}
                    level="H"
                    includeMargin={true}
                  />
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
                <>
                  <button className="qr-btn qr-btn-secondary" onClick={handleRegenerateQR}>
                    <RefreshCw size={16} /> Regenerate QR
                  </button>

                  {attendanceOpen ? (
                    <button
                      className="qr-btn qr-btn-secondary"
                      style={{ color: "#DC2626" }}
                      onClick={handleInvalidateQR}
                    >
                      <Ban size={16} /> Invalidate QR
                    </button>
                  ) : null}
                </>
              )}
            </div>

            {/* Admin Management Actions: Selection Email & Attendance Close */}
            {isAdmin && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  marginTop: "16px",
                  paddingTop: "16px",
                  borderTop: "1px solid #E2E8F0",
                }}
              >
                <button
                  className="qr-btn qr-btn-secondary"
                  onClick={handleConfirmSelection}
                  disabled={confirmingSelection}
                  title="Sends Volunteer Selection Confirmation Email (Email 1) to all approved applicants"
                >
                  <Mail size={16} color="#0066CC" />
                  {confirmingSelection ? "Sending Selection Emails..." : "Confirm Selection (Send Emails)"}
                </button>

                <button
                  className="qr-btn qr-btn-primary"
                  onClick={handleCloseAttendanceAndVerify}
                  disabled={verifying}
                  title="Closes attendance, verifies completed hours, awards 10 pts/hr, and sends Thank You Email (Email 2)"
                >
                  <ShieldCheck size={16} />
                  {verifying ? "Closing & Crediting..." : "Close Attendance & Award Points"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ADMIN TAB 2: LIVE ATTENDANCE ROSTER & VERIFICATION */}
        {isAdmin && activeTab === "live_roster" && (
          <div className="roster-view-section">
            <div className="roster-stats-row">
              <div className="roster-stat-pill">
                <Users size={14} color="#0066CC" />
                <span>
                  Check-ins Logged: <strong>{attendanceRoster.length}</strong>
                </span>
              </div>
              <div className="roster-stat-pill">
                <Clock size={14} color="#16A34A" />
                <span>
                  Rate: <strong>10 Points per Verified Hour ({event.durationHours || 4} hrs = {(event.durationHours || 4) * 10} pts)</strong>
                </span>
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
                      <th>Verified Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceRoster.map((item) => (
                      <tr key={item.id || item._id}>
                        <td>
                          <strong>{item.volunteerName || item.user?.fullName || "Volunteer"}</strong>
                          <span className="sub-text">{item.user?.college || item.volunteerEmail}</span>
                        </td>
                        <td>
                          <span className="checkin-method-badge">{item.checkInMethod || "QR_SCAN"}</span>
                        </td>
                        <td>
                          {new Date(item.checkInTime || item.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td>
                          <span
                            className={item.isVerified ? "status-pill-present" : "checkin-method-badge"}
                          >
                            <CheckCircle2 size={13} />{" "}
                            {item.isVerified ? "Verified Present" : item.status || "Checked-In"}
                          </span>
                        </td>
                        <td>
                          <strong>
                            {item.pointsAwarded
                              ? `+${item.points || (item.verifiedHours || 4) * 10} pts`
                              : `${(event.durationHours || 4) * 10} pts (Pending close)`}
                          </strong>
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
                  Closing attendance will award <strong>10 points for each verified hour</strong>, update
                  student profiles & leaderboard, and dispatch official thank-you emails!
                </span>
              </div>
              <button
                className="qr-btn qr-btn-primary"
                onClick={handleCloseAttendanceAndVerify}
                disabled={verifying}
              >
                {verifying ? "Closing & Verifying..." : "Close Attendance & Credit All Verified Hours"}
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
                  <span>
                    Drive: <strong>{event.title}</strong>
                  </span>
                  <span>
                    Hours Pending Audit: <strong>{event.durationHours || 4} hrs</strong>
                  </span>
                  <span>
                    Potential Impact: <strong>+{(event.durationHours || 4) * 10} Points</strong>
                  </span>
                </div>
                <button
                  className="qr-btn qr-btn-primary"
                  onClick={onClose}
                  style={{ marginTop: 16 }}
                >
                  Close & View Dashboard
                </button>
              </div>
            ) : (
              <div className="scan-interactive-box">
                {/* Real Camera Viewport */}
                {cameraActive ? (
                  <div style={{ position: "relative", marginBottom: "16px" }}>
                    <div
                      id="qr-reader-viewport"
                      style={{
                        width: "100%",
                        borderRadius: "12px",
                        overflow: "hidden",
                        border: "2px solid #0066CC",
                        minHeight: "260px",
                        background: "#000",
                      }}
                    />
                    <button
                      onClick={stopCameraScanner}
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        background: "rgba(0,0,0,0.6)",
                        color: "#fff",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      Cancel Camera
                    </button>
                  </div>
                ) : (
                  <div className="camera-sim-view" onClick={startCameraScanner} style={{ cursor: "pointer" }}>
                    <div className="camera-overlay-frame">
                      <div className="scan-laser-line" />
                      <Camera size={38} color="#FFFFFF" />
                      <span style={{ fontWeight: 600 }}>Tap to Open Device Camera</span>
                      <small style={{ color: "#E2E8F0" }}>Point device at Coordinator's QR Code</small>
                    </div>
                  </div>
                )}

                {cameraError && (
                  <div
                    style={{
                      background: "#FEF2F2",
                      border: "1px solid #FCA5A5",
                      color: "#B91C1C",
                      padding: "10px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      marginBottom: "12px",
                    }}
                  >
                    {cameraError}
                  </div>
                )}

                {!cameraActive && (
                  <div className="sim-scan-action">
                    <button
                      className="qr-btn qr-btn-primary full-width"
                      onClick={startCameraScanner}
                      disabled={scanning}
                    >
                      <Camera size={16} /> Open Camera Scanner
                    </button>
                  </div>
                )}

                <div className="or-divider">
                  <span>OR ENTER CHECK-IN CODE</span>
                </div>

                <div className="manual-code-row">
                  <div className="code-input-wrap">
                    <KeyRound size={16} color="#64748B" />
                    <input
                      type="text"
                      placeholder="e.g. MFQR-AB12-34CD"
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                    />
                  </div>
                  <button
                    className="qr-btn qr-btn-secondary"
                    onClick={() => handleCheckIn(manualToken)}
                    disabled={!manualToken.trim() || scanning}
                  >
                    {scanning ? "Verifying..." : "Submit Code"}
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
