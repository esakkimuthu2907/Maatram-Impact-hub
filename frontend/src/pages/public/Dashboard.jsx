import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";
import styles from "./Dashboard.module.css";

/* Volunteering opportunities — grouped by category, fresh wording */
const OPPORTUNITIES = [
  /* ---------- Teaching & Mentoring ---------- */
  {
    category: "Teaching & Mentoring",
    title: "Karppom Karppipom",
    description:
      "Teach, share what you know and give students the academic support they need to keep learning with confidence.",
  },
  {
    category: "Teaching & Mentoring",
    title: "Mentoring & Skill Development",
    description:
      "Be a guide for a student: offer advice from your own career and help them grow personally and professionally.",
  },
  {
    category: "Teaching & Mentoring",
    title: "Siragugal",
    description:
      "Help students find their strengths through learning activities, one-to-one guidance and encouragement.",
  },
  {
    category: "Teaching & Mentoring",
    title: "Teaching & Community Support",
    description:
      "Give a few hours to classroom sessions and local community programmes where your skills make a real difference.",
  },
  {
    category: "Teaching & Mentoring",
    title: "Aptitude",
    description:
      "Lead training sessions on logical reasoning, maths and problem solving so students feel ready for tests.",
  },

  /* ---------- Careers & Skills ---------- */
  {
    category: "Careers & Skills",
    title: "Mock Interviews",
    description:
      "Play the interviewer, give honest feedback and help students walk into real interviews well prepared.",
  },
  {
    category: "Careers & Skills",
    title: "Anchor Workshop",
    description:
      "Coach students in stage presence, public speaking and hosting events through hands-on practice.",
  },
  {
    category: "Careers & Skills",
    title: "Leadership Camp",
    description:
      "Run team games and real-life challenges that teach students to lead, decide and solve problems together.",
  },
  {
    category: "Careers & Skills",
    title: "School Visits & Career Awareness",
    description:
      "Go to schools, talk about courses and careers after Class 12 and help students choose their path.",
  },
  {
    category: "Careers & Skills",
    title: "School Visit",
    description:
      "Meet school students, boost their confidence and show them what higher education can open up for them.",
  },
  {
    category: "Careers & Skills",
    title: "College Visit",
    description:
      "Introduce Maatram to college students and invite them to join our volunteering and social service work.",
  },

  /* ---------- Events & Culture ---------- */
  {
    category: "Events & Culture",
    title: "Hackforge",
    description:
      "Join a hackathon where teams turn ideas into working technology. Mentor, judge or help organise the event.",
  },
  {
    category: "Events & Culture",
    title: "Sangamam",
    description:
      "A festival of togetherness where students and volunteers share culture, music and teamwork on one stage.",
  },
  {
    category: "Events & Culture",
    title: "Freshers Day",
    description:
      "Give first-year students a warm welcome to Maatram with games, introductions and a day they will remember.",
  },
  {
    category: "Events & Culture",
    title: "Kadhaipoma",
    description:
      "Tell and listen to stories. Build creativity and speaking confidence through shared experiences.",
  },

  /* ---------- Community & Environment ---------- */
  {
    category: "Community & Environment",
    title: "Joy of Giving",
    description:
      "Collect and share clothes, food and essentials with families who need them, and spread a little happiness.",
  },
  {
    category: "Community & Environment",
    title: "Palm Tree Plantation",
    description:
      "Plant palm saplings, care for them and teach the community why every tree matters for our environment.",
  },
  {
    category: "Community & Environment",
    title: "Immersion Program",
    description:
      "Spend time inside a community, learn from the people there and see first-hand how social change happens.",
  },

  /* ---------- Admissions ---------- */
  {
    category: "Admissions",
    title: "Student Verification",
    description:
      "Check student applications carefully so that scholarships and support reach those who deserve them.",
  },
  {
    category: "Admissions",
    title: "Admission Panel Interviews",
    description:
      "Sit on an interview panel, speak with applicants and help select the next batch of Maatram students.",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const goLogin = (loginType) => navigate("/login", { state: { loginType } });

  return (
    <div className={styles.page}>
      {/* ===== Top bar ===== */}
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <img
            src="/maatram-logo.png" /* file lives in frontend/public/ */
            alt="Maatram Foundation"
            className={styles.logoImg}
          />
        </div>

        <div className={styles.topActions}>
          <button
            type="button"
            className={styles.btnGhost}
            onClick={() => goLogin("admin")}
          >
            <ShieldCheck size={16} /> Admin
          </button>
          <button
            type="button"
            className={styles.btnSolid}
            onClick={() => goLogin("volunteer")}
          >
            Volunteer Sign in <ArrowRight size={16} />
          </button>
        </div>
      </header>

      {/* ===== Intro banner ===== */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <h1>Volunteering Opportunities</h1>
          <p>
            Pick a programme that matches your interest, give a little of your
            time and help students and communities grow.
          </p>
        </div>
      </section>

      {/* ===== Filters + cards ===== */}
      <main className={styles.main}>
        <div className={styles.grid}>
          {OPPORTUNITIES.map((item, i) => (
            <article className={styles.card} key={item.title}>
              <div className={styles.cardTop}>
                <span className={styles.cardNo}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={styles.cardTag}>{item.category}</span>
              </div>

              <h3>{item.title}</h3>
              <p>{item.description}</p>

              <button
                type="button"
                className={styles.cardLink}
                onClick={() => goLogin("volunteer")}
              >
                Join as volunteer <ArrowRight size={15} />
              </button>
            </article>
          ))}
        </div>
      </main>

      <footer className={styles.footer}>
        © {new Date().getFullYear()} Maatram Volunteer Community
      </footer>
    </div>
  );
}