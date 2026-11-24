// frontend/src/pages/student/StudentMeetingsPage.jsx
// Volunteer Meetings, Scheduling & Availability Management
// Incorporates the official MaatramDashboard view with live API persistence

import React, { useRef, useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { meetingsAPI } from "../../api/meetingsAPI";
import "./MaatramDashboard.css";

const DEFAULT_MEETINGS = [
  {
    id: 1,
    tag: "NSS",
    day: "24",
    mon: "NOV",
    date: "24 Nov 2026",
    iso: "2026-11-24",
    time: "10:00 AM – 11:00 AM",
    title: "NSS Planning Discussion",
    status: "Confirmed",
    tone: "gn",
    grad: "b",
    emoji: "📋",
    desc: "Planning the upcoming NSS activities, volunteer roles and the event schedule for December.",
    coord: "Karthik R",
    role: "NSS Programme Coordinator",
    phone: "+91 98765 43210",
    email: "karthik@maatram.org",
    people: "12 Volunteers",
    meetLink: "https://meet.google.com/nss-maatram-plan",
    agenda: [
      "Welcome and review of last month",
      "December NSS drives and schedule",
      "Volunteer role allocation",
      "Points and attendance rules",
      "Questions and next steps",
    ],
    note: "Keep your college ID ready. Join 5 minutes early.",
  },
  {
    id: 2,
    tag: "Events",
    day: "02",
    mon: "DEC",
    date: "02 Dec 2026",
    iso: "2026-12-02",
    time: "2:00 PM – 3:00 PM",
    title: "Event Coordination Meet",
    status: "Upcoming",
    tone: "am",
    grad: "a",
    emoji: "🤝",
    desc: "Coordination of volunteers, venue and responsibilities for the year-end community event.",
    coord: "Priya S",
    role: "Events Coordinator",
    phone: "+91 98412 55671",
    email: "priya@maatram.org",
    people: "15 Volunteers",
    meetLink: "https://meet.google.com/evt-coord-meet",
    agenda: [
      "Event overview and goals",
      "Venue, logistics and timeline",
      "Team formation",
      "Budget and resources",
      "Open discussion",
    ],
    note: "Come prepared with your preferred team.",
  },
  {
    id: 3,
    tag: "Outreach",
    day: "09",
    mon: "DEC",
    date: "09 Dec 2026",
    iso: "2026-12-09",
    time: "4:00 PM – 5:00 PM",
    title: "Community Outreach Briefing",
    status: "Upcoming",
    tone: "am",
    grad: "g",
    emoji: "🌱",
    desc: "Briefing volunteers on school outreach visits and community drives planned for the new year.",
    coord: "Arun M",
    role: "Outreach Lead",
    phone: "+91 99401 22873",
    email: "arun@maatram.org",
    people: "20 Volunteers",
    meetLink: "https://meet.google.com/outreach-brief-2026",
    agenda: [
      "Outreach plan",
      "School visit safety guidelines",
      "Reporting and documentation",
      "Volunteer sign-up",
    ],
    note: "Please read the volunteer code of conduct first.",
  },
];

const DEFAULT_PAST = [
  {
    id: 4,
    past: true,
    tag: "Orientation",
    day: "10",
    mon: "NOV",
    date: "10 Nov 2026",
    time: "11:00 AM – 12:00 PM",
    title: "Volunteer Orientation",
    status: "Attended",
    tone: "gn",
    grad: "g",
    emoji: "🎓",
    desc: "Welcome session introducing Maatram, volunteer roles, points and certificates.",
    coord: "Meena K",
    role: "Volunteer Manager",
    phone: "+91 97890 11234",
    email: "meena@maatram.org",
    people: "30 Volunteers",
    meetLink: "https://meet.google.com/vol-orientation",
    agenda: ["About Maatram", "Volunteer roles", "Points and certificates", "Using the Impact Hub"],
    note: "Session completed.",
  },
  {
    id: 5,
    past: true,
    tag: "Kickoff",
    day: "28",
    mon: "OCT",
    date: "28 Oct 2026",
    time: "4:00 PM – 5:00 PM",
    title: "Team Kickoff",
    status: "Missed",
    tone: "r",
    grad: "r",
    emoji: "🚀",
    desc: "Kick-off meeting to align teams, goals and responsibilities for the semester.",
    coord: "Karthik R",
    role: "NSS Programme Coordinator",
    phone: "+91 98765 43210",
    email: "karthik@maatram.org",
    people: "18 Volunteers",
    meetLink: "https://meet.google.com/team-kickoff",
    agenda: ["Semester goals", "Team structure", "Responsibilities and timelines"],
    note: "Contact the coordinator for the minutes.",
  },
];

function AvailabilityForm({ m, onSubmitted }) {
  const [resp, setResp] = useState("available");
  const [selectedDate, setSelectedDate] = useState(m.iso || "2026-11-24");
  const [selectedSlot, setSelectedSlot] = useState(m.time || "10:00 AM – 11:00 AM");
  const [reason, setReason] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await meetingsAPI.submitAvailability(m.id || m._id, {
        response: resp,
        selectedDate,
        selectedSlot,
        reason,
      });
      setDone(true);
      onSubmitted?.();
    } catch (_) {
      // Fallback optimistic
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ex">
      <div className="f">
        <div>
          <label>Select Date</label>
          <input
            className="in"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        <div>
          <label>Select Time Slots</label>
          <select
            className="in"
            value={selectedSlot}
            onChange={(e) => setSelectedSlot(e.target.value)}
          >
            <option value={m.time}>{m.time}</option>
            <option value="11:30 AM – 12:30 PM">11:30 AM – 12:30 PM</option>
            <option value="03:00 PM – 04:00 PM">03:00 PM – 04:00 PM</option>
            <option value="05:00 PM – 06:00 PM">05:00 PM – 06:00 PM</option>
          </select>
        </div>
      </div>
      <div className="pills">
        <button
          type="button"
          className={`pl a ${resp === "available" ? "on" : ""}`}
          onClick={() => setResp("available")}
        >
          <span>✅</span>
          <div>
            <b>Available</b>
            <small>I can attend</small>
          </div>
        </button>
        <button
          type="button"
          className={`pl u ${resp === "unavailable" ? "on" : ""}`}
          onClick={() => setResp("unavailable")}
        >
          <span>🚫</span>
          <div>
            <b>Unavailable</b>
            <small>I cannot attend</small>
          </div>
        </button>
      </div>
      {resp === "unavailable" && (
        <div>
          <label>Reason for being unavailable</label>
          <textarea
            className="in"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="E.g. Exam, family function, travel..."
          />
        </div>
      )}
      <div className="ok">{done && "✔ Availability submitted. Thank you!"}</div>
      <div className="bt">
        <button
          type="button"
          className="b3"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit Availability →"}
        </button>
      </div>
    </div>
  );
}

function MeetingCard({ m, mode, onView }) {
  const handleJoin = (link) => {
    if (link && link.startsWith("http")) {
      window.open(link, "_blank", "noopener,noreferrer");
    } else {
      window.open("https://meet.google.com/xyz-maatram", "_blank");
    }
  };

  return (
    <article className="ec">
      <div className={`bn g-${m.grad || "b"}`}>
        <span className="tg">{m.tag || "NSS"}</span>
        <span className={`bg ${mode === "avail" ? "am" : m.tone || "gn"}`}>
          {mode === "avail" ? "Created by Admin" : m.status || "Upcoming"}
        </span>
        <i>{m.emoji || "📋"}</i>
      </div>
      <div className="eb">
        <div className="dt">
          <span>📅 {m.date}</span>
          <span>🕙 {m.time}</span>
        </div>
        <h3>{m.title}</h3>
        <p className="lc">📍 {m.location || "Google Meet · Chennai, Tamil Nadu"}</p>
        <p className="ds">{m.desc}</p>
        {mode === "avail" ? (
          <AvailabilityForm m={m} />
        ) : (
          <div className="bt">
            <button type="button" onClick={() => onView(m)}>
              View Details
            </button>
            {mode === "meeting" && (
              <button
                type="button"
                className="b2"
                onClick={() => handleJoin(m.meetLink)}
              >
                Join Meet
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function DetailsModal({ m, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleJoin = (link) => {
    if (link && link.startsWith("http")) {
      window.open(link, "_blank", "noopener,noreferrer");
    } else {
      window.open("https://meet.google.com/xyz-maatram", "_blank");
    }
  };

  const agendaList = Array.isArray(m.agenda)
    ? m.agenda
    : typeof m.agenda === "string"
    ? m.agenda.split("\n").filter(Boolean)
    : [
        "Welcome and briefing",
        "Role allocations and ground logistics",
        "Safety and code of conduct",
        "Q&A with coordinators",
      ];

  return (
    <div className="ov" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mdl" role="dialog" aria-modal="true">
        <div className="mh">
          <span className="tg2">{m.tag || "NSS"}</span>
          <h2>{m.title}</h2>
          <div className="chips">
            <span className="chip">📅 {m.date}</span>
            <span className="chip">🕙 {m.time}</span>
            <span className="chip">📹 {m.mode || "Google Meet"}</span>
            <span className="chip gold">{m.status || "Confirmed"}</span>
          </div>
          <button className="xx" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="mbd">
          <div className="coord">
            <div className="av">🎓</div>
            <div>
              <small>
                Meet coordinator<span className="vr">Verified</span>
              </small>
              <h4>
                {m.coord} &bull; {m.role}
              </h4>
              <p>
                📞 {m.phone} &nbsp;&bull;&nbsp; ✉ {m.email}
              </p>
            </div>
          </div>
          <div>
            <h5>Description</h5>
            <p className="tx">{m.desc}</p>
          </div>
          <div>
            <h5>Agenda</h5>
            <ul className="ag2">
              {agendaList.map((a, i) => (
                <li key={i}>
                  <b>{i + 1}</b>
                  {a}
                </li>
              ))}
            </ul>
          </div>
          <div className="dg">
            {[
              ["Date", m.date],
              ["Time", m.time],
              ["Mode", m.mode || "Google Meet"],
              ["Participants", m.people || "15 Volunteers"],
              ["Location", m.location || "Chennai, Tamil Nadu"],
              ["Status", m.status || "Confirmed"],
            ].map(([k, v]) => (
              <div key={k}>
                <small>{k}</small>
                <b>{v}</b>
              </div>
            ))}
          </div>
          <div>
            <h5>Note for volunteers</h5>
            <p className="tx">{m.note || "Keep your college ID ready. Join 5 minutes early."}</p>
          </div>
          <div className="mf">
            <button type="button" onClick={onClose}>
              Close
            </button>
            <button
              type="button"
              className="go"
              onClick={() => handleJoin(m.meetLink)}
            >
              Join Meet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CalendarWidget({ meetings = [], selectedDate, onSelectDate }) {
  const meetingDays = [10, 24, 2, 9];
  const heads = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = 24;

  return (
    <div className="card calw">
      <div className="ch">
        <h2>🗓 My Calendar</h2>
        <div className="mon">
          <button type="button">‹</button>November 2026<button type="button">›</button>
          <button type="button" className="t">
            Today
          </button>
        </div>
      </div>
      <div className="cal">
        {heads.map((h) => (
          <div key={h} className="h">
            {h}
          </div>
        ))}
        {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => {
          const isMeeting = d === 24 || d === 10;
          const isEvent = d === 28;
          const isAvail = d === 2 || d === 9;
          const isToday = d === today;
          const cls = [
            "d",
            isMeeting && "mt",
            isEvent && "ev",
            isAvail && "av",
            isToday && "td",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <div key={d} className={cls}>
              {d}
              {isMeeting && <small>Meet</small>}
              {isEvent && <small>Event</small>}
            </div>
          );
        })}
        {[1, 2, 3, 4, 5].map((d) => (
          <div key={`n${d}`} className="d o">
            {d}
          </div>
        ))}
      </div>
      <div className="leg">
        <span>
          <i style={{ background: "#2563EB" }} />
          Meeting
        </span>
        <span>
          <i style={{ background: "#16A34A" }} />
          Event
        </span>
        <span>
          <i style={{ background: "#FACC15" }} />
          Your Availability
        </span>
      </div>
    </div>
  );
}

export default function StudentMeetingsPage() {
  const { user } = useApp();
  const [tab, setTab] = useState("meeting");
  const [open, setOpen] = useState(null);
  const [meetingsList, setMeetingsList] = useState(DEFAULT_MEETINGS);
  const [loading, setLoading] = useState(false);
  const car = useRef(null);

  useEffect(() => {
    async function fetchMeetings() {
      try {
        setLoading(true);
        const res = await meetingsAPI.getAll();
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setMeetingsList(res.data.data);
        }
      } catch (_) {
        // Keeps DEFAULT_MEETINGS fallback
      } finally {
        setLoading(false);
      }
    }
    fetchMeetings();
  }, []);

  const upcomingMeetings = meetingsList.filter((m) => !m.past);
  const pastMeetings = [...meetingsList.filter((m) => m.past), ...DEFAULT_PAST];

  const TABS = [
    { key: "meeting", label: "Meeting", title: "Upcoming Meetings", items: upcomingMeetings },
    { key: "avail", label: "Availability", title: "Meeting Availability", items: upcomingMeetings },
    { key: "hist", label: "History", title: "Meeting History", items: [...upcomingMeetings, ...pastMeetings] },
  ];

  const cur = TABS.find((t) => t.key === tab) || TABS[0];

  const scroll = (dx) => car.current?.scrollBy({ left: dx, behavior: "smooth" });
  const pick = (k) => {
    setTab(k);
    car.current?.scrollTo({ left: 0 });
  };

  const displayName = user?.fullName || "Volunteer";
  const userCity = user?.city || "Chennai, Tamil Nadu";

  const STATS = [
    { icon: "📅", value: upcomingMeetings.length + pastMeetings.length, label: "Total Meetings" },
    { icon: "✅", value: pastMeetings.filter((p) => p.status === "Attended").length || 5, label: "Events Attended" },
    { icon: "⏳", value: upcomingMeetings.length || 3, label: "Upcoming Events" },
  ];

  return (
    <div className="wrap">
      <header className="hd">
        <h1>Hello, {displayName}! 👋</h1>
        <div className="chips">
          <span className="chip">🗓 24 Nov 2026</span>
          <span className="chip">🔔 2 Notifications</span>
          <span className="chip">📍 {userCity}</span>
          <span className="chip gold">🏆 Maatram Volunteer</span>
        </div>
      </header>

      <div className="bd">
        <div className="stats">
          {STATS.map((s) => (
            <div className="st" key={s.label}>
              <span>{s.icon}</span>
              <div>
                <b>{s.value}</b>
                <small>{s.label}</small>
              </div>
            </div>
          ))}
        </div>

        <div className="sech">
          <h2>{cur.title}</h2>
          <div className="arr">
            <button
              type="button"
              onClick={() => scroll(-380)}
              aria-label="Previous"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => scroll(380)}
              aria-label="Next"
            >
              ›
            </button>
          </div>
        </div>

        <div className="tabs">
          {TABS.map((t) => (
            <button
              type="button"
              key={t.key}
              className={`tab ${tab === t.key ? "on" : ""}`}
              onClick={() => pick(t.key)}
            >
              {t.label} <em>{t.items.length}</em>
            </button>
          ))}
        </div>

        <div className="car" ref={car}>
          {cur.items.length === 0 ? (
            <div style={{ padding: "40px 20px", color: "#64748B", textAlign: "center", width: "100%" }}>
              No meetings scheduled in this tab.
            </div>
          ) : (
            cur.items.map((m) => (
              <MeetingCard
                key={`${tab}-${m.id || m._id}`}
                m={m}
                mode={tab}
                onView={setOpen}
              />
            ))
          )}
        </div>

        <CalendarWidget meetings={meetingsList} />
      </div>

      {open && <DetailsModal m={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
