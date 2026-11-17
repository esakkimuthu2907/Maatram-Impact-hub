// frontend/src/pages/student/OpportunityDetailPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Home,
  Calendar,
  Clock,
  ShieldCheck,
  Star,
  Wifi,
  Users,
  Info,
  CalendarDays,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Navigation,
  ExternalLink,
  Check,
  X,
  Bookmark,
  Share2,
  QrCode,
  FileText,
  CheckCircle2,
  Sparkles,
  Send,
  Leaf,
} from "lucide-react";

import { useApp } from "../../context/AppContext";
import { eventsAPI } from "../../api/eventsAPI";
import "./OpportunitiesPage.css";
import "./OpportunityDetailPage.css";

/* ── helpers ─────────────────────────────────────────────────────────── */
const initialsOf = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "MC";

export default function OpportunityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    user,
    opportunities = [],
    applications = [],
    bookmarks = [],
    toggleBookmark,
    showToast,
    openQRAttendance,
    openLinkedInShare,
    openCertificate,
  } = useApp();

  const [copiedLink, setCopiedLink] = useState(false);
  const [eventDetails, setEventDetails] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(true);

  // Feedback form (section 05)
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");

  // Load detailed event data & registered cohort
  const loadFullEvent = async () => {
    try {
      setLoadingDetails(true);
      const res = await eventsAPI.getById(id);
      if (res && res.data) {
        setEventDetails(res.data);
        setVolunteers(res.data.registeredVolunteers || []);
      }
    } catch (err) {
      console.warn("Event detail fetch error:", err.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    loadFullEvent();
  }, [id]);

  const opp = eventDetails || opportunities.find((o) => o.id === id || o._id === id);

  if (!opp) {
    return (
      <div className="evd-page">
        <button type="button" className="evd-back" onClick={() => navigate("/opportunities")}>
          <ArrowLeft size={16} /> Back to Catalog
        </button>
        <div className="evd-loading">
          <Sparkles size={32} color="#D97706" />
          <h2>Loading Event Details...</h2>
          <p>Retrieving drive logistics and volunteer cohort data.</p>
        </div>
      </div>
    );
  }

  const oppId = opp.id || opp._id;
  const bookmarked = (bookmarks || []).includes(oppId);

  // Current student's registration
  const myApp =
    (volunteers || []).find(
      (app) =>
        (app.userId === user?.id ||
          app.userId === user?._id ||
          app.applicationId === user?.applicationId) &&
        app.status !== "Cancelled"
    ) ||
    applications.find(
      (a) => (a.opportunityId === oppId || a.opportunityId?._id === oppId) && a.status !== "Cancelled"
    );

  const isApproved = myApp?.status === "Approved";
  const isCompleted = myApp?.status === "Completed";

  // Slots
  const needed = Number(opp.volunteersNeeded) || 10;
  const available = Number(opp.slotsAvailable) || 0;
  const filled = Math.max(0, needed - available);
  const fillRatio = Math.min(100, Math.round((filled / needed) * 100));

  // Title: last word highlighted in yellow
  const titleWords = String(opp.title || "").trim().split(" ");
  const titleAccent = titleWords.length > 1 ? titleWords.pop() : "";
  const titleMain = titleWords.join(" ");

  // Coordinator (only real data, sensible fallbacks)
  const coordName = opp.coordinatorName || opp.contactName || "Event Coordinator";
  const coordPhone = opp.coordinatorPhone || opp.contactPhone || "";
  const coordEmail = opp.contactEmail || "coordinator@maatramfoundation.org";
  const whatsappLink = opp.whatsappLink || opp.whatsappGroup || "";

  // Agenda & checklist come only from what the admin entered when posting the event
  const agenda = Array.isArray(opp.agenda)
    ? opp.agenda
      .filter((a) => a && a.title)
      .map((a) => ({ time: a.time, title: a.title, desc: a.description || a.desc || "" }))
    : [];
  const bringList = Array.isArray(opp.whatToBring) ? opp.whatToBring.filter(Boolean) : [];

  const venue = opp.location || "Chennai, Tamil Nadu";
  const mapQuery = encodeURIComponent(venue);

  /* ── handlers ─────────────────────────────────────────────────────── */
  const handleCopyShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    showToast?.("Drive link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleSubmitFeedback = () => {
    if (!rating) {
      showToast?.("Please choose a star rating first.", "error");
      return;
    }
    showToast?.("Thank you! Your feedback has been submitted.");
    setRating(0);
    setFeedbackText("");
  };

  let secNo = 0;
  const nextNo = () => String(++secNo).padStart(2, "0");

  const SectionHead = ({ no, title, icon: Icon }) => (
    <div className="evd-sec-head">
      <span className="evd-sec-no">{no}</span>
      <h2>{title}</h2>
      <span className="evd-sec-line" />
      {Icon && <Icon size={16} className="evd-sec-ico" />}
    </div>
  );

  return (
    <div className="evd-page">
      {/* ─── BREADCRUMB ─────────────────────────────────────────────── */}
      <nav className="evd-crumbs" aria-label="Breadcrumb">
        <Link to="/dashboard" title="Home"><Home size={13} /></Link>
        <span>/</span>
        <Link to="/opportunities">Event Management</Link>
        <span>/</span>
        <b>Event Details</b>
      </nav>

      {/* ─── HERO BANNER ────────────────────────────────────────────── */}
      <header className="evd-hero">
        <div className="evd-hero-text">
          <h1>
            {titleMain} {titleAccent && <span>{titleAccent}</span>}
          </h1>
          <p className="evd-org">
            <i className="evd-org-rule" />
            Organized by <b>{opp.organizer || "Maatram Foundation"}</b> &bull; Tamil Nadu
          </p>
        </div>

        <div className="evd-hero-actions">
          <button
            type="button"
            className={`evd-icon-btn ${bookmarked ? "on" : ""}`}
            onClick={() => toggleBookmark(oppId)}
            title={bookmarked ? "Saved in bookmarks" : "Save to bookmarks"}
          >
            <Bookmark size={17} fill={bookmarked ? "#FACC15" : "none"} />
          </button>
          <button type="button" className="evd-icon-btn" onClick={handleCopyShare} title="Share drive link">
            {copiedLink ? <Check size={17} color="#4ADE80" /> : <Share2 size={17} />}
          </button>
        </div>
      </header>

      {/* ─── KEY FACTS ──────────────────────────────────────────────── */}
      <section className="evd-facts">
        <div className="evd-fact blue">
          <span className="evd-fact-ico"><Calendar size={18} /></span>
          <div><small>DATE</small><b>{opp.date}</b></div>
        </div>
        <div className="evd-fact orange">
          <span className="evd-fact-ico"><Clock size={18} /></span>
          <div><small>EVENT TIME</small><b>{opp.time || "09:00 AM – 01:00 PM"}</b></div>
        </div>
        <div className="evd-fact green">
          <span className="evd-fact-ico"><ShieldCheck size={18} /></span>
          <div><small>HOURS</small><b>{opp.durationHours || 4} Hours</b></div>
        </div>
        <div className="evd-fact yellow">
          <span className="evd-fact-ico"><Star size={18} /></span>
          <div><small>POINTS</small><b>{opp.points || 50} Points</b></div>
        </div>
        <div className="evd-fact indigo">
          <span className="evd-fact-ico"><Wifi size={18} /></span>
          <div><small>EVENT TYPE</small><b>{opp.mode || "Offline"}</b></div>
        </div>
      </section>

      {/* ─── JOIN THIS DRIVE ────────────────────────────────────────── */}
      <section className="evd-card evd-join">
        <div className="evd-join-left">
          <h3>Join this Drive</h3>
          <div className="evd-slots-row">
            <span className={`evd-slots-num ${available <= 2 ? "low" : ""}`}>{available}</span>
            <div>
              <strong>slots left</strong>
              <small>{filled} of {needed} volunteers joined</small>
            </div>
          </div>
          <div className="evd-meter">
            <div
              className="evd-meter-fill"
              style={{ width: `${fillRatio}%`, background: available <= 2 ? "linear-gradient(90deg,#F97316,#EF4444)" : "linear-gradient(90deg,#16A34A,#22C55E)" }}
            />
          </div>
        </div>

        <div className="evd-join-right">
          <div className="evd-deadline">
            <span><CalendarDays size={14} /> Registration deadline{opp.deadline ? `: ${opp.deadline}` : ""}</span>
            <em className={available > 0 ? "open" : "closed"}>{available > 0 ? "Open" : "Full"}</em>
          </div>

          {myApp ? (
            <div className="evd-mystatus">
              <div className="evd-mystatus-top">
                <CheckCircle2 size={18} color="#15803D" />
                <strong>You are registered</strong>
                <span className={`evd-pill ${String(myApp.status).toLowerCase()}`}>{myApp.status}</span>
              </div>
              <div className="evd-mystatus-meta">
                Slot: <b>{myApp.slotName || "Standard Slot"}</b> &nbsp;&bull;&nbsp; Ref: <code>{myApp.referenceId || "MAT-REF"}</code>
              </div>
              <div className="evd-mystatus-actions">
                {isApproved && (
                  <button type="button" className="evd-btn-primary" onClick={() => openQRAttendance(opp)}>
                    <QrCode size={15} /> Check-in with QR Code
                  </button>
                )}
                {isCompleted && (
                  <>
                    <button
                      type="button"
                      className="evd-btn-primary"
                      onClick={() =>
                        openCertificate({
                          volunteerName: user?.fullName,
                          eventTitle: opp.title,
                          eventCategory: opp.category,
                          verifiedHours: opp.durationHours || 4,
                          pointsAwarded: opp.points || 50,
                          certificateId: `MF-CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                        })
                      }
                    >
                      <FileText size={15} /> View Certificate
                    </button>
                    <button
                      type="button"
                      className="evd-btn-linkedin"
                      onClick={() =>
                        openLinkedInShare({
                          volunteerName: user?.fullName,
                          eventTitle: opp.title,
                          hours: opp.durationHours || 4,
                          category: opp.category,
                        })
                      }
                    >
                      <Share2 size={15} /> Share to LinkedIn
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <Link to={`/opportunities/${oppId}/apply`} className="evd-btn-primary evd-btn-block">
              Register Now <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </section>

      {/* ─── 01 EVENT TEAM ──────────────────────────────────────────── */}
      <section className="evd-card">
        <SectionHead no={nextNo()} title="Event Team" icon={Users} />
        <div className={`evd-team-grid ${whatsappLink ? "" : "single"}`}>
          <div className="evd-coord">
            <small className="evd-label">COORDINATOR</small>
            <div className="evd-coord-row">
              <span className="evd-avatar">{initialsOf(coordName)}</span>
              <div>
                <strong>{coordName}</strong>
                {coordPhone && <p><Phone size={12} /> {coordPhone}</p>}
                <p><Mail size={12} /> <a href={`mailto:${coordEmail}`}>{coordEmail}</a></p>
              </div>
            </div>
          </div>

          {whatsappLink && (
            <div className="evd-whatsapp">
              <small className="evd-label">WHATSAPP GROUP</small>
              <div className="evd-wa-row">
                <span className="evd-wa-ico"><MessageCircle size={18} /></span>
                <strong>Join our event group for updates!</strong>
              </div>
              <a href={whatsappLink} target="_blank" rel="noreferrer" className="evd-wa-btn">
                Join Group <ArrowRight size={14} />
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ─── 02 ABOUT ───────────────────────────────────────────────── */}
      <section className="evd-card">
        <SectionHead no={nextNo()} title="About this Event" icon={Info} />
        <p className="evd-about">
          {opp.description ||
            "Join us for this volunteering drive and contribute to the community. This event is open to all interested students who care about making a difference."}
        </p>
        <div className="evd-callout">
          <Leaf size={14} /> Together, we can make a difference!
        </div>
        <div className="evd-tags">
          <span className="evd-tag">{opp.category}</span>
          {(Array.isArray(opp.skills) ? opp.skills : typeof opp.skills === "string" ? opp.skills.split(",") : [])
            .map((s) => String(s).trim())
            .filter(Boolean)
            .map((s) => (
              <span key={s} className="evd-tag soft">{s}</span>
            ))}
        </div>
      </section>

      {/* ─── 03 AGENDA ──────────────────────────────────────────────── */}
      {agenda.length > 0 && (
        <section className="evd-card">
          <SectionHead no={nextNo()} title="Event Agenda — Start to End" icon={CalendarDays} />
          <ol className="evd-agenda">
            {agenda.map((item, idx) => (
              <li key={idx} className={idx === agenda.length - 1 ? "last" : ""}>
                <span className="evd-time">{item.time}</span>
                <span className="evd-node" />
                <div className="evd-agenda-box">
                  <strong>{item.title}</strong>
                  {item.desc && <p>{item.desc}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* ─── 04 LIVE LOCATION ───────────────────────────────────────── */}
      <section className="evd-card">
        <SectionHead no={nextNo()} title="Live Location" icon={MapPin} />
        <a
          className="evd-map"
          href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
          target="_blank"
          rel="noreferrer"
          title="Open in Google Maps"
        >
          <svg viewBox="0 0 600 150" preserveAspectRatio="none" aria-hidden="true">
            <rect width="600" height="150" fill="#E6ECFB" />
            <rect x="25" y="85" width="140" height="35" rx="4" fill="#CFEFD8" />
            <rect x="330" y="10" width="160" height="90" rx="4" fill="#CFEFD8" />
            <rect x="15" y="15" width="45" height="26" rx="4" fill="#D3DCF4" />
            <rect x="105" y="60" width="75" height="36" rx="4" fill="#D3DCF4" />
            <rect x="215" y="12" width="70" height="30" rx="4" fill="#D3DCF4" />
            <rect x="215" y="60" width="95" height="36" rx="4" fill="#D3DCF4" />
            <rect x="440" y="75" width="70" height="38" rx="4" fill="#D3DCF4" />
            <rect x="70" y="0" width="14" height="150" fill="#fff" />
            <rect x="195" y="0" width="14" height="150" fill="#fff" />
            <rect x="305" y="0" width="12" height="150" fill="#fff" />
            <rect x="0" y="48" width="600" height="12" fill="#fff" />
            <rect x="0" y="108" width="600" height="12" fill="#fff" />
          </svg>
          <span className="evd-pin"><MapPin size={34} fill="#DC2626" color="#fff" /></span>
        </a>

        <div className="evd-venue-row">
          <MapPin size={18} color="#DC2626" />
          <div className="evd-venue-text">
            <strong>Official Venue</strong>
            <small>{venue}</small>
          </div>
          <a
            className="evd-btn-light"
            href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
            target="_blank"
            rel="noreferrer"
          >
            View on Map <ExternalLink size={12} />
          </a>
          <a
            className="evd-btn-blue"
            href={`https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`}
            target="_blank"
            rel="noreferrer"
          >
            <Navigation size={13} /> Get Directions
          </a>
        </div>

        {bringList.length > 0 && (
          <>
            <small className="evd-label evd-bring-label">WHAT TO BRING</small>
            <div className="evd-bring-grid">
              {bringList.map((item) => (
                <div key={item} className="evd-bring-item">
                  <Check size={14} color="#16A34A" /> {item}
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* ─── 05 FEEDBACK ────────────────────────────────────────────── */}
      <section className="evd-card">
        <SectionHead no={nextNo()} title="Feedback" icon={Star} />
        <p className="evd-fb-lead">Share your experience about this event</p>
        <div className="evd-stars" onMouseLeave={() => setHoverRating(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className="evd-star"
              onMouseEnter={() => setHoverRating(n)}
              onClick={() => setRating(n)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
            >
              <Star
                size={28}
                color={(hoverRating || rating) >= n ? "#F59E0B" : "#8EA2D8"}
                fill={(hoverRating || rating) >= n ? "#F59E0B" : "none"}
              />
            </button>
          ))}
        </div>
        <textarea
          className="evd-fb-text"
          rows={4}
          placeholder="Your feedback..."
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
        />
        <div className="evd-fb-foot">
          <button type="button" className="evd-btn-primary" onClick={handleSubmitFeedback}>
            <Send size={14} /> Submit Feedback
          </button>
        </div>
      </section>
    </div>
  );
}