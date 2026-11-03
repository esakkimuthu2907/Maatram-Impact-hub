// backend/scripts/seedPeers.js
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');

const SAMPLE_PEERS = [
  {
    fullName: "Kavitha Raman",
    email: "kavitha.raman@gmail.com",
    college: "Anna University, CEG Campus",
    department: "Computer Science & Engineering",
    academicYear: "3rd Year",
    regNumber: "2022CS1012",
    points: 320, // Gold Tier
    totalHours: 0,
    eventsJoined: 4,
    completedEventsCount: 4,
    badgesEarned: 3,
    streakDays: 7,
    bio: "Passionate about STEM education for rural children and women in technology.",
    skills: ["Web Basics", "Teaching", "Public Speaking"],
    interests: ["Education", "Youth Mentoring"]
  },
  {
    fullName: "Dinesh Kumar",
    email: "dinesh.kumar@gmail.com",
    college: "PSG College of Technology, Coimbatore",
    department: "Mechanical Engineering",
    academicYear: "4th Year",
    regNumber: "2021ME2044",
    points: 650, // Diamond Tier
    totalHours: 0,
    eventsJoined: 7,
    completedEventsCount: 6,
    badgesEarned: 5,
    streakDays: 12,
    bio: "Environmental activist leading afforestation drives across western Tamil Nadu.",
    skills: ["Team Leadership", "Event Operations", "Organic Farming"],
    interests: ["Environment", "Community Relief"]
  },
  {
    fullName: "Aishwarya Sundaram",
    email: "aishwarya.s@gmail.com",
    college: "Madras Christian College (MCC), Chennai",
    department: "Social Work & Sociology",
    academicYear: "2nd Year",
    regNumber: "2023SW3018",
    points: 150, // Silver Tier
    totalHours: 0,
    eventsJoined: 2,
    completedEventsCount: 2,
    badgesEarned: 2,
    streakDays: 4,
    bio: "Focused on mental health advocacy and school outreach programmes.",
    skills: ["Counseling", "Empathy", "Documentation"],
    interests: ["Public Health", "Education"]
  },
  {
    fullName: "Suresh Balaji",
    email: "suresh.balaji@gmail.com",
    college: "SSN College of Engineering, Chennai",
    department: "Information Technology",
    academicYear: "1st Year",
    regNumber: "2024IT4089",
    points: 20, // Bronze Tier (new enrollee)
    totalHours: 0,
    eventsJoined: 1,
    completedEventsCount: 0,
    badgesEarned: 0,
    streakDays: 1,
    bio: "Freshman volunteer eager to participate in weekend social impact drives.",
    skills: ["Coding", "Event Volunteering"],
    interests: ["Outside Events", "Karpom Karpipom"]
  },
  {
    fullName: "Meenakshi V",
    email: "meenakshi.v@gmail.com",
    college: "Loyola College, Chennai",
    department: "Visual Communication",
    academicYear: "3rd Year",
    regNumber: "2022VC5011",
    points: 1200, // Platinum Tier
    totalHours: 0,
    eventsJoined: 12,
    completedEventsCount: 11,
    badgesEarned: 7,
    streakDays: 18,
    bio: "Documenting grassroots stories and media outreach for education access.",
    skills: ["Photography", "Storytelling", "Social Media"],
    interests: ["Media", "Education"]
  }
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('Connected to MongoDB');

  const hashedPass = await bcrypt.hash('Student@123', 10);

  for (let i = 0; i < SAMPLE_PEERS.length; i++) {
    const peer = SAMPLE_PEERS[i];
    const exists = await User.findOne({ email: peer.email });
    if (!exists) {
      const appSeq = String(i + 2).padStart(3, '0');
      const newUser = await User.create({
        ...peer,
        password: hashedPass,
        role: 'student',
        applicationId: `MAA${appSeq}`,
        status: 'active',
        avatar: '', // uses initial badge
      });
      console.log('Created peer student:', newUser.fullName, `(${newUser.applicationId})`, `Points: ${newUser.points}`);
    } else {
      console.log('Peer already exists:', exists.fullName, `Points: ${exists.points}`);
    }
  }

  const count = await User.countDocuments({ role: 'student' });
  console.log('Total students in DB now:', count);

  await mongoose.disconnect();
}

seed().catch(console.error);
