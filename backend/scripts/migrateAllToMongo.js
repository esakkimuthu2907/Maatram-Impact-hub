// backend/scripts/migrateAllToMongo.js
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const User = require('../models/User');
const Event = require('../models/Event');
const Application = require('../models/Application');
const PointsTransaction = require('../models/PointsTransaction');

async function run() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  console.log('Connected to MongoDB Atlas');

  // 1. Ensure Admin exists
  let admin = await User.findOne({ email: 'admin@gmail.com' });
  const adminPassHash = await bcrypt.hash('Admin@123', 10);
  if (!admin) {
    admin = await User.create({
      fullName: 'Admin',
      email: 'admin@gmail.com',
      password: adminPassHash,
      role: 'admin',
      applicationId: 'ADMIN001',
      points: 0,
      totalHours: 0,
      avatar: ''
    });
    console.log('Created Admin user:', admin._id.toString());
  } else {
    admin.fullName = 'Admin';
    admin.applicationId = 'ADMIN001';
    admin.role = 'admin';
    // Clear out any stock photo so it uses clean initial avatar
    if (admin.avatar && admin.avatar.includes('unsplash')) admin.avatar = '';
    await admin.save();
    console.log('Updated Admin user:', admin._id.toString());
  }

  // 2. Ensure Student exists
  let student = await User.findOne({ email: 'student@maatram.org' });
  const studentPassHash = await bcrypt.hash('Student@123', 10);
  if (!student) {
    student = await User.create({
      fullName: 'Kavitha R',
      email: 'student@maatram.org',
      password: studentPassHash,
      role: 'student',
      applicationId: 'MAA001',
      college: 'Anna University',
      department: 'Computer Science & Engineering',
      academicYear: '3rd Year',
      regNumber: '2022CS1045',
      points: 50,
      totalHours: 0,
      eventsJoined: 1,
      completedEventsCount: 1,
      badgesEarned: 1,
      streakDays: 3,
      avatar: ''
    });
    console.log('Created Student user:', student._id.toString());
  } else {
    student.fullName = 'Esakki Muthu';
    student.applicationId = 'MAA001';
    student.role = 'student';
    student.points = 50;
    student.totalHours = 0;
    student.eventsJoined = 1;
    student.completedEventsCount = 1;
    student.badgesEarned = 1;
    student.college = student.college || 'Anna University';
    student.department = student.department || 'Computer Science & Engineering';
    student.academicYear = student.academicYear || '3rd Year';
    student.regNumber = student.regNumber || '2022CS1045';
    // Clear out any stock photo if present
    if (student.avatar && student.avatar.includes('unsplash')) student.avatar = '';
    await student.save();
    console.log('Updated Student user:', student._id.toString(), 'Points:', student.points);
  }

  // 3. Migrate Events
  const dbJsonPath = path.join(__dirname, '../data/db.json');
  let rawEvents = [];
  let rawApps = [];
  if (fs.existsSync(dbJsonPath)) {
    const raw = JSON.parse(fs.readFileSync(dbJsonPath, 'utf8'));
    rawEvents = raw.events || [];
    rawApps = raw.applications || [];
  }

  const defaultEvents = [
    {
      title: "School Visit – Government Higher Secondary School",
      category: "School Visits",
      organizer: "Maatram School Outreach Cell",
      mode: "Offline",
      date: "12 Apr 2025 (Sat)",
      time: "10:00 AM – 2:00 PM (4 hrs)",
      durationHours: 4,
      points: 50,
      location: "Government Higher Secondary School, Saidapet, Chennai",
      volunteersNeeded: 12,
      slotsAvailable: 10,
      deadline: "10 Apr 2025",
      image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=80",
      description: "Mentor 9th & 10th grade students on science experiments and career guidance.",
      objectives: ["Mentor students in science", "Inspire career pathways"],
      responsibilities: ["Lead classroom demo sessions", "Engage with students"],
      skills: "Communication, Empathy, Teaching",
      eligibility: "Open to all 1st–4th year college student volunteers.",
      contactEmail: "outreach@maatramfoundation.org",
      featured: true,
      isActive: true,
      eventStatus: "Upcoming",
    },
    {
      title: "Tree Plantation Drive – Semmozhi Poonga Expansion",
      category: "Outside Events",
      organizer: "Maatram Green Tamil Nadu Initiative",
      mode: "Offline",
      date: "19 Apr 2025 (Sat)",
      time: "6:30 AM – 11:30 AM (5 hrs)",
      durationHours: 5,
      points: 60,
      location: "Semmozhi Poonga & Surrounding Green Belt, Chennai",
      volunteersNeeded: 25,
      slotsAvailable: 18,
      deadline: "17 Apr 2025",
      image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1000&q=80",
      description: "Be part of Maatram's 500-sapling environmental drive across urban Chennai.",
      objectives: ["Plant 500 native tree saplings", "Spread awareness on urban afforestation"],
      responsibilities: ["Dig pits, place saplings and install protective fencing"],
      skills: "Physical Stamina, Teamwork, Environmental Enthusiasm",
      eligibility: "Open to all enrolled college students.",
      contactEmail: "green@maatramfoundation.com",
      featured: true,
      isActive: true,
      eventStatus: "Upcoming",
    },
    {
      title: "Karpom Karpipom – Peer Python & Web Basics Workshop",
      category: "Karpom Karpipom",
      organizer: "Maatram Tech Mentorship Circle",
      mode: "Online",
      date: "26 Apr 2025 (Sat)",
      time: "2:00 PM – 6:00 PM (4 hrs)",
      durationHours: 4,
      points: 40,
      location: "Google Meet / YouTube Live Stream",
      volunteersNeeded: 8,
      slotsAvailable: 6,
      deadline: "24 Apr 2025",
      image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1000&q=80",
      description: "Teach basic Python coding concepts and digital problem solving to 1st year polytechnic & arts college students.",
      objectives: ["Teach basics of programming", "Build simple projects with students"],
      responsibilities: ["Lead live breakout room sessions and debug beginner code"],
      skills: "Basic Python/JS, Patience, Clear Explanation",
      eligibility: "Open to engineering, BCA, MCA, or CS students.",
      contactEmail: "techmentors@maatramfoundation.com",
      featured: false,
      isActive: true,
      eventStatus: "Upcoming",
    }
  ];

  const eventsToSeed = rawEvents.length > 0 ? rawEvents : defaultEvents;
  const createdEvents = [];

  for (const item of eventsToSeed) {
    let evt = await Event.findOne({ title: item.title });
    if (!evt) {
      evt = await Event.create({
        title: item.title,
        category: item.category,
        organizer: item.organizer || "Maatram Foundation",
        mode: item.mode || "Offline",
        date: item.date,
        time: item.time || "9:30 AM – 1:30 PM",
        durationHours: item.durationHours || 4,
        points: item.points || 50,
        pointsDistributed: Boolean(item.pointsDistributed),
        location: item.location || "Chennai, Tamil Nadu",
        volunteersNeeded: item.volunteersNeeded || 10,
        slotsAvailable: item.slotsAvailable || 10,
        deadline: item.deadline || "",
        image: item.image || "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=80",
        description: item.description || "Community volunteering initiative.",
        objectives: Array.isArray(item.objectives) ? item.objectives : ["Help the community"],
        responsibilities: Array.isArray(item.responsibilities) ? item.responsibilities : ["Participate actively"],
        skills: typeof item.skills === 'string' ? item.skills : (Array.isArray(item.skills) ? item.skills.join(', ') : "Teamwork"),
        eligibility: item.eligibility || "Open to all students",
        contactEmail: item.contactEmail || "coordinator@maatramfoundation.org",
        featured: Boolean(item.featured),
        isActive: true,
        eventStatus: item.eventStatus || "Upcoming",
        postedBy: admin._id,
      });
      console.log('Created event in MongoDB:', evt.title, evt._id.toString());
    } else {
      console.log('Event already in MongoDB:', evt.title, evt._id.toString());
    }
    createdEvents.push(evt);
  }

  // 4. Migrate Student's Previous Application
  const primaryEvent = createdEvents[0];
  let studentApp = await Application.findOne({
    $or: [
      { userId: student._id },
      { "applicantDetails.email": student.email }
    ]
  });

  if (!studentApp) {
    studentApp = await Application.create({
      userId: student._id,
      applicationId: student.applicationId,
      opportunityId: primaryEvent._id,
      opportunityTitle: primaryEvent.title,
      category: primaryEvent.category,
      eventDate: primaryEvent.date,
      hours: primaryEvent.durationHours || 4,
      slotId: "slot_001_1",
      slotName: "Morning Batch A (10:00 AM – 12:00 PM)",
      motivation: "Passionate about teaching and mentoring high school students in science and math.",
      status: "Approved",
      referenceId: "MAT-2907",
      appliedDate: "10 Apr 2025",
      applicantDetails: {
        name: student.fullName,
        email: student.email,
        phone: student.phone || "+91 98765 43210",
        college: student.college,
        department: student.department,
        academicYear: student.academicYear,
        regNumber: student.regNumber,
        avatar: student.avatar || ""
      }
    });
    console.log('✅ Created previous application for student:', studentApp.referenceId, studentApp.opportunityTitle);
  } else {
    studentApp.opportunityId = primaryEvent._id;
    studentApp.opportunityTitle = primaryEvent.title;
    studentApp.status = studentApp.status || "Approved";
    await studentApp.save();
    console.log('Existing student application synced:', studentApp.referenceId, studentApp.opportunityTitle);
  }

  // 5. Ensure PointsTransaction exists
  let tx = await PointsTransaction.findOne({ userId: student._id });
  if (!tx) {
    await PointsTransaction.create({
      userId: student._id,
      applicationId: student.applicationId,
      studentName: student.fullName,
      eventId: primaryEvent._id,
      eventName: primaryEvent.title,
      type: "CREDIT",
      points: 50,
      reason: "Initial volunteering drive contribution",
      adminName: "Admin",
      date: new Date().toISOString()
    });
    console.log('Created points transaction audit record for student.');
  }

  console.log('\n--- VERIFICATION STATS ---');
  console.log('Users in MongoDB:', await User.countDocuments());
  console.log('Events in MongoDB:', await Event.countDocuments());
  console.log('Applications in MongoDB:', await Application.countDocuments());
  console.log('PointsTransactions in MongoDB:', await PointsTransaction.countDocuments());

  await mongoose.disconnect();
  console.log('Done!');
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
