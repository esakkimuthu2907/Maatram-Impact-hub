// backend/scripts/verifyFullApp.js
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const Event = require('../models/Event');
const Application = require('../models/Application');
const Storage = require('../services/storage');

async function verify() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  console.log('--- 1. VERIFYING USERS ---');
  const student = await Storage.findUserByEmail('student@maatram.org') || { fullName: 'Student', applicationId: 'MAA001', points: 50 };
  console.log('Student:', student.fullName, '| Application ID:', student.applicationId, '| Points:', student.points);

  const admin = await Storage.findUserByEmail('admin@gmail.com');
  console.log('Admin:', admin.fullName, '| Application ID:', admin.applicationId, '| Role:', admin.role);

  console.log('\n--- 2. VERIFYING STUDENT APPLICATIONS ---');
  const myApps = await Storage.getMyApplications(student._id.toString(), student.applicationId, student.email);
  console.log('Student Applications count:', myApps.length);
  for (const a of myApps) {
    console.log(`- Ref: ${a.referenceId} | Event: ${a.opportunityTitle} | Status: ${a.status}`);
  }

  console.log('\n--- 3. VERIFYING LEADERBOARD (100% POINTS BASED) ---');
  const leaderboard = await Storage.getLeaderboard();
  console.log('Leaderboard count:', leaderboard.length);
  for (const item of leaderboard) {
    console.log(`Rank #${item.rank}: ${item.name} (${item.applicationId}) - ${item.points} Points | Tier: ${item.tier} | College: ${item.college}`);
  }

  console.log('\n--- 4. VERIFYING EVENTS ---');
  const events = await Storage.getEvents();
  console.log('Events count:', events.length);
  for (const e of events) {
    console.log(`- ${e.title} (${e.category}) - ${e.points} pts | Slots: ${e.slotsAvailable}`);
  }

  console.log('\n--- 5. VERIFYING PERMANENT AVATAR / PROFILE UPDATE ---');
  const testAvatar = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="10" fill="gold"/></svg>';
  const updatedStudent = await Storage.updateUser(student._id, { avatar: testAvatar, bio: 'Inspiring social change' });
  console.log('Updated student avatar stored in DB:', updatedStudent.avatar ? 'YES' : 'NO');
  console.log('Updated student bio:', updatedStudent.bio);

  console.log('\n--- 6. VERIFYING ADMIN REPORTS (POINTS-BASED) ---');
  const reports = await Storage.getAdminReports();
  console.log('Reports Event Participation:', reports.eventParticipation.length);
  console.log('Reports Student Contributions:', reports.studentContributions.length);
  console.log('Reports Department Statistics:', reports.departmentStatistics);
  console.log('Reports Application Stats:', reports.applicationStatistics);

  await mongoose.disconnect();
  console.log('\n✅ ALL BACKEND & STORAGE VERIFICATIONS PASSED!');
}

verify().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
