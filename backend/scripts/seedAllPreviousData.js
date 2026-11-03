const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('../models/Event');
const User = require('../models/User');
const Application = require('../models/Application');
const PointsTransaction = require('../models/PointsTransaction');
const Notification = require('../models/Notification');

const ALL_OPPORTUNITIES = [
  {
    title: "School Visit – Government Higher Secondary School",
    category: "School Visits",
    categorySlug: "school-visits",
    organizer: "Maatram School Outreach Cell",
    mode: "Offline",
    date: "12 Apr 2025 (Sat)",
    time: "10:00 AM – 2:00 PM (4 hrs)",
    durationHours: 4,
    points: 50,
    location: "Government Higher Secondary School, Saidapet, Chennai",
    volunteersNeeded: 10,
    slotsAvailable: 4,
    deadline: "10 Apr 2025",
    image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1000&q=80",
    description: "Join the Maatram team to visit rural and government school students, conduct interactive career guidance sessions, and create awareness about higher education opportunities.",
    objectives: [
      "Guide 10th & 12th standard students on career choices and entrance examinations.",
      "Conduct interactive group mentoring on self-confidence and communication.",
      "Distribute educational toolkits and scholarship informational brochures."
    ],
    responsibilities: [
      "Facilitate classroom discussions with 20–25 students per volunteer.",
      "Demonstrate basic digital education tools and mobile study resources.",
      "Assist teacher coordinators in organizing the Q&A workshop."
    ],
    skills: "Communication, Teamwork, Empathy, Public Speaking",
    eligibility: "Open to 2nd, 3rd, and 4th year college students across all disciplines.",
    contactEmail: "schooloutreach@maatramfoundation.com",
    featured: true,
    eventStatus: "Upcoming",
    isActive: true,
  },
  {
    title: "Televerification & Admissions Support",
    category: "Maatram Opportunities",
    categorySlug: "maatram",
    organizer: "Maatram Admissions Board",
    mode: "Online",
    date: "15 Apr 2025 (Tue)",
    time: "4:00 PM – 8:00 PM (4 hrs)",
    durationHours: 4,
    points: 40,
    location: "Online (Google Meet & Portal)",
    volunteersNeeded: 15,
    slotsAvailable: 8,
    deadline: "14 Apr 2025",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=80",
    description: "Support the Maatram scholarship selection process by calling student applicants to verify eligibility criteria, academic records, and socio-economic backgrounds.",
    objectives: [
      "Verify 300+ prospective student applications for the upcoming academic cycle.",
      "Ensure fairness, transparency, and accurate documentation verification."
    ],
    responsibilities: [
      "Call shortlisted students and parents to verify family background and educational status.",
      "Record structured feedback directly in the Maatram Volunteer Portal."
    ],
    skills: "Active Listening, Data Entry, Tamil/English Fluency, Integrity",
    eligibility: "Any college student with a laptop/smartphone and good telephone communication.",
    contactEmail: "scholarships@maatramfoundation.com",
    featured: true,
    eventStatus: "Upcoming",
    isActive: true,
  },
  {
    title: "Mock Interview & Resume Mentoring Session",
    category: "Karpom Karpipom",
    categorySlug: "karpom-karpipom",
    organizer: "Karpom Karpipom Peer Wing",
    mode: "Online",
    date: "18 Apr 2025 (Fri)",
    time: "5:00 PM – 9:00 PM (4 hrs)",
    durationHours: 4,
    points: 40,
    location: "Online (Zoom Video Breakout Rooms)",
    volunteersNeeded: 8,
    slotsAvailable: 3,
    deadline: "16 Apr 2025",
    image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1000&q=80",
    description: "Help underprivileged final-year college students practise technical and HR interviews, refine their resumes, and build confidence before placement season.",
    objectives: [
      "Conduct 1-on-1 mock interviews (30 mins per candidate).",
      "Provide constructive critique on resume design, LinkedIn profiles, and body language."
    ],
    responsibilities: [
      "Assess 4 candidates in structured interview simulations.",
      "Fill out scoring rubrics and personalized improvement tips."
    ],
    skills: "Interviewing, Resume Review, Constructive Feedback, Professional Etiquette",
    eligibility: "Pre-final and final-year students, or students placed in campus placements.",
    contactEmail: "karpom@maatramfoundation.com",
    featured: true,
    eventStatus: "Upcoming",
    isActive: true,
  },
  {
    title: "Sangamam Youth Impact Conclave & Meetup",
    category: "Sangamam",
    categorySlug: "sangamam",
    organizer: "Sangamam State Council",
    mode: "Offline",
    date: "26 Apr 2025 (Sat)",
    time: "9:00 AM – 3:00 PM (6 hrs)",
    durationHours: 6,
    points: 80,
    location: "Kalaivanar Arangam, Wallajah Road, Triplicane, Chennai",
    volunteersNeeded: 25,
    slotsAvailable: 9,
    deadline: "22 Apr 2025",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1000&q=80",
    description: "The flagship annual convention bringing together 800+ student changemakers across Tamil Nadu. Volunteer in stage management, guest welcoming, and workshop coordination.",
    objectives: [
      "Deliver a seamless, high-energy networking convention for student leaders.",
      "Facilitate 6 breakout workshops on education equality, youth entrepreneurship, and rural upliftment."
    ],
    responsibilities: [
      "Registration desk check-in and delegate kit distribution.",
      "Stage assistance, audio-visual coordination, and crowd management."
    ],
    skills: "Event Operations, Hospitality, Crisis Management, Public Relations",
    eligibility: "Enthusiastic students ready for an action-packed on-ground convention day.",
    contactEmail: "sangamam@maatramfoundation.com",
    featured: true,
    eventStatus: "Upcoming",
    isActive: true,
  },
  {
    title: "Urban Miyawaki Forest Plantation Drive",
    category: "Outside Events",
    categorySlug: "outside-events",
    organizer: "Maatram Green Future Taskforce",
    mode: "Offline",
    date: "03 May 2025 (Sat)",
    time: "6:30 AM – 10:30 AM (4 hrs)",
    durationHours: 4,
    points: 50,
    location: "Nanmangalam Reserve Forest Fringe, Chennai",
    volunteersNeeded: 30,
    slotsAvailable: 14,
    deadline: "01 May 2025",
    image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1000&q=80",
    description: "Plant 500 indigenous saplings in an urban micro-forest pocket. Learn soil conditioning, organic mulching, and sustainable biodiversity restoration.",
    objectives: [
      "Enhance green cover and urban biodiversity through dense Miyawaki planting.",
      "Foster environmental stewardship and hands-on conservation among college youth."
    ],
    responsibilities: [
      "Digging, sapling planting, staking, and drip-line arrangement.",
      "Documenting tree tags with QR codes for future health tracking."
    ],
    skills: "Physical Stamina, Environmental Science, Team Collaboration",
    eligibility: "Open to all students who enjoy early morning outdoor community work.",
    contactEmail: "green@maatramfoundation.com",
    featured: false,
    eventStatus: "Upcoming",
    isActive: true,
  },
  {
    title: "Digital Literacy & Cyber Safety Camp",
    category: "Karpom Karpipom",
    categorySlug: "karpom-karpipom",
    organizer: "Karpom Digital Taskforce",
    mode: "Offline",
    date: "10 May 2025 (Sat)",
    time: "9:30 AM – 1:30 PM (4 hrs)",
    durationHours: 4,
    points: 40,
    location: "Community Center, Tambaram West, Chennai",
    volunteersNeeded: 12,
    slotsAvailable: 5,
    deadline: "08 May 2025",
    image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1000&q=80",
    description: "Teach senior citizens and high school students basic digital skills: UPI safety, preventing cyber scams, government e-sevai portal access, and smartphone hygiene.",
    objectives: [
      "Empower 100+ community members with safe smartphone practices.",
      "Demonstrate live scam identification and phishing prevention."
    ],
    responsibilities: [
      "One-on-one guided smartphone walkthroughs with participants.",
      "Distribute vernacular cyber safety cheat-sheets."
    ],
    skills: "Patience, Vernacular Communication, Tech Troubleshooting",
    eligibility: "Students familiar with daily smartphone apps and security settings.",
    contactEmail: "digitalliteracy@maatramfoundation.com",
    featured: false,
    eventStatus: "Upcoming",
    isActive: true,
  },
  {
    title: "Statewide Science Fair Jury & Facilitation",
    category: "School Visits",
    categorySlug: "school-visits",
    organizer: "Maatram STEM Initiative",
    mode: "Hybrid",
    date: "17 May 2025 (Sat)",
    time: "8:30 AM – 2:30 PM (6 hrs)",
    durationHours: 6,
    points: 60,
    location: "District Science Centre, Tirunelveli (with online judging stream)",
    volunteersNeeded: 16,
    slotsAvailable: 6,
    deadline: "14 May 2025",
    image: "https://images.unsplash.com/photo-1564981797816-1043664bf78d?auto=format&fit=crop&w=1000&q=80",
    description: "Support rural middle and high school students showcasing indigenous science experiments and robotics prototypes. Evaluate projects and provide encouraging feedback.",
    objectives: [
      "Encourage scientific temper and innovation in young students from rural districts.",
      "Provide constructive scoring and certificate distribution."
    ],
    responsibilities: [
      "Interview student project teams about their prototypes.",
      "Help maintain stall timetables and manage stage presentations."
    ],
    skills: "STEM Basics, Student Encouragement, Evaluation",
    eligibility: "Science and Engineering college students.",
    contactEmail: "stem@maatramfoundation.com",
    featured: false,
    eventStatus: "Upcoming",
    isActive: true,
  },
  {
    title: "Maatram Creative Media & Storytelling Corps",
    category: "Maatram Opportunities",
    categorySlug: "maatram",
    organizer: "Maatram Communications",
    mode: "Online",
    date: "20 May 2025 (Tue)",
    time: "Flexible remote schedule (8 hrs weekly)",
    durationHours: 8,
    points: 75,
    location: "Remote / Online",
    volunteersNeeded: 6,
    slotsAvailable: 2,
    deadline: "18 May 2025",
    image: "https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=1000&q=80",
    description: "Capture the incredible impact stories of Maatram beneficiaries. Create Instagram reels, student spotlight articles, video edits, and impact newsletters.",
    objectives: [
      "Document transformative life stories of students supported by Maatram.",
      "Publish weekly student volunteer spotlights across social channels."
    ],
    responsibilities: [
      "Write short inspirational articles and interview beneficiary students.",
      "Design Canva graphics or edit short video reels."
    ],
    skills: "Copywriting, Graphic Design, Video Editing, Social Media",
    eligibility: "Students passionate about digital storytelling and design.",
    contactEmail: "media@maatramfoundation.com",
    featured: false,
    eventStatus: "Upcoming",
    isActive: true,
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log("Connected to MongoDB!");

  // Upsert all 8 opportunities
  for (const opp of ALL_OPPORTUNITIES) {
    const existing = await Event.findOne({ title: opp.title });
    if (!existing) {
      await Event.create(opp);
      console.log(`Created event: "${opp.title}"`);
    } else {
      console.log(`Event already exists: "${opp.title}"`);
    }
  }

  // Ensure Esakkimuthu's student account has status: 'active', points: 50
  const student = await User.findOne({ email: "esakkimuthu2907@gmail.com" });
  if (student) {
    student.status = "active";
    student.points = 50;
    student.completedEventsCount = 1;
    student.eventsJoined = 2;
    student.totalHours = 4;
    student.badgesEarned = 1;
    student.streakDays = 3;
    await student.save();
    console.log("Updated student user:", student.email);

    // Find the first event (School Visit)
    const schoolEvent = await Event.findOne({ title: "School Visit – Government Higher Secondary School" });
    if (schoolEvent) {
      // Upsert approved application
      await Application.findOneAndUpdate(
        { userId: student._id, opportunityId: schoolEvent._id },
        {
          referenceId: "MAT-2907",
          userId: student._id,
          applicationId: student.applicationId || "MAA001",
          opportunityId: schoolEvent._id,
          opportunityTitle: schoolEvent.title,
          category: schoolEvent.category,
          eventDate: schoolEvent.date,
          hours: schoolEvent.durationHours,
          slotId: "slot_001_1",
          slotName: "Morning Batch A (10:00 AM – 12:00 PM)",
          status: "Approved",
          attendanceStatus: "Present",
          pointsAwarded: 50,
          motivation: "Passionate about teaching and mentoring high school students in science and math.",
          appliedDate: "10 Apr 2025",
          applicantDetails: {
            name: student.fullName,
            email: student.email,
            phone: student.phone,
            college: student.college,
            department: student.department,
            academicYear: student.academicYear,
            regNumber: student.regNumber,
            avatar: student.avatar || "",
          },
        },
        { upsert: true, new: true }
      );
      console.log("Upserted approved application MAT-2907 for student.");
    }

    // Add a second pending application for Televerification
    const teleEvent = await Event.findOne({ title: "Televerification & Admissions Support" });
    if (teleEvent) {
      await Application.findOneAndUpdate(
        { userId: student._id, opportunityId: teleEvent._id },
        {
          referenceId: "MAT-2908",
          userId: student._id,
          applicationId: student.applicationId || "MAA001",
          opportunityId: teleEvent._id,
          opportunityTitle: teleEvent.title,
          category: teleEvent.category,
          eventDate: teleEvent.date,
          hours: teleEvent.durationHours,
          slotId: "slot_002_1",
          slotName: "Afternoon Verification Slot",
          status: "Pending",
          attendanceStatus: "Unmarked",
          pointsAwarded: 0,
          motivation: "Keen to assist in the scholarship admissions process.",
          appliedDate: "12 Apr 2025",
          applicantDetails: {
            name: student.fullName,
            email: student.email,
            phone: student.phone,
            college: student.college,
            department: student.department,
            academicYear: student.academicYear,
            regNumber: student.regNumber,
            avatar: student.avatar || "",
          },
        },
        { upsert: true, new: true }
      );
      console.log("Upserted pending application MAT-2908 for student.");
    }

    // Sync counter to prevent collision
    const allUsers = await User.find().lean();
    let maxSeq = 1;
    for (const u of allUsers) {
      if (u.applicationId && u.applicationId.startsWith("MAA")) {
        const num = parseInt(u.applicationId.replace("MAA", ""), 10);
        if (!isNaN(num) && num > maxSeq) maxSeq = num;
      }
    }
    await mongoose.connection.db.collection('counters').updateOne(
      { _id: 'applicationId' },
      { $set: { seq: maxSeq + 1 } },
      { upsert: true }
    );
    console.log("Updated applicationId counter to:", maxSeq + 1);

    // Also add a sample pending registration user to test Admin approval flow
    const pendingStudent = await User.findOne({ email: "priya.nair@gmail.com" });
    if (!pendingStudent) {
      await User.create({
        applicationId: `MAA${String(maxSeq + 1).padStart(3, "0")}`,
        fullName: "Priya Nair",
        email: "priya.nair@gmail.com",
        password: "Password@123",
        phone: "+91 9876543210",
        college: "SSN College of Engineering, Chennai",
        department: "Computer Science",
        academicYear: "3rd Year",
        regNumber: "312221104045",
        role: "student",
        status: "pending_approval",
        points: 0,
        bio: "Eager to contribute in STEM tutoring and rural school mentoring.",
      });
      console.log("Created sample pending registration user: Priya Nair");
    }

    const pendingAlumni = await User.findOne({ email: "karthik.alumni@gmail.com" });
    if (!pendingAlumni) {
      await User.create({
        applicationId: `MAA${String(maxSeq + 2).padStart(3, "0")}`,
        fullName: "Karthik Raja",
        email: "karthik.alumni@gmail.com",
        password: "Password@123",
        phone: "+91 9443322110",
        college: "College of Engineering, Guindy",
        department: "Mechanical Engineering",
        academicYear: "Alumni",
        graduationYear: "2023",
        organization: "Zoho Corporation",
        designation: "Software Engineer",
        role: "alumni",
        status: "pending_approval",
        points: 0,
        bio: "Maatram scholar alum wishing to conduct mock interviews and career clinics.",
      });
      console.log("Created sample pending alumni user: Karthik Raja");
    }
  }

  await mongoose.disconnect();
  console.log("Seeding complete!");
}

seed().catch(err => {
  console.error("Seeding error:", err);
  process.exit(1);
});
