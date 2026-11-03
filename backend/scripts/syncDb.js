// backend/scripts/syncDb.js
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const Application = require('../models/Application');
const Event = require('../models/Event');
const User = require('../models/User');

async function sync() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  console.log('Connected to MongoDB');

  const studentUser = await User.findOne({ email: 'esakkimuthu2907@gmail.com' });
  if (!studentUser) {
    console.error('Student user esakkimuthu2907@gmail.com not found!');
    process.exit(1);
  }

  const schoolEvent = await Event.findOne({ title: /School Visit/i }) || (await Event.findOne({}));
  if (!schoolEvent) {
    console.error('No events found!');
    process.exit(1);
  }

  const dbJsonPath = path.join(__dirname, '../data/db.json');
  if (fs.existsSync(dbJsonPath)) {
    const raw = JSON.parse(fs.readFileSync(dbJsonPath, 'utf8'));
    if (raw.applications && raw.applications.length > 0) {
      for (const app of raw.applications) {
        // Resolve event
        let targetEvent = await Event.findOne({ title: new RegExp(app.opportunityTitle.slice(0, 15), 'i') });
        if (!targetEvent) targetEvent = schoolEvent;

        // Resolve user
        let targetUser = await User.findOne({ email: (app.applicantDetails?.email || 'esakkimuthu2907@gmail.com').toLowerCase() });
        if (!targetUser) targetUser = studentUser;

        const exists = await Application.findOne({
          $or: [
            { referenceId: app.referenceId },
            { userId: targetUser._id, opportunityId: targetEvent._id }
          ]
        });

        if (!exists) {
          const newApp = await Application.create({
            userId: targetUser._id,
            applicationId: targetUser.applicationId || 'MAA001',
            opportunityId: targetEvent._id,
            opportunityTitle: targetEvent.title,
            category: targetEvent.category,
            eventDate: targetEvent.date,
            hours: targetEvent.durationHours || 4,
            slotId: 'slot_1',
            slotName: 'Morning Session (9:30 AM – 1:30 PM)',
            motivation: app.motivation || 'I love volunteering and making a positive impact with students.',
            status: app.status || 'Approved',
            referenceId: app.referenceId || `MAT-${Math.floor(1000 + Math.random() * 9000)}`,
            applicantDetails: {
              name: targetUser.fullName || 'Esakki Muthu',
              email: targetUser.email,
              phone: targetUser.phone || '+91 98765 43210',
              college: targetUser.college || 'Anna University',
              department: targetUser.department || 'Computer Science & Engineering',
              academicYear: targetUser.academicYear || '3rd Year',
              regNumber: targetUser.regNumber || '2022CS1045',
              avatar: targetUser.avatar || ''
            }
          });
          console.log('✅ Migrated application to MongoDB:', newApp._id.toString(), newApp.opportunityTitle, newApp.status);
        } else {
          console.log('Application already in MongoDB:', exists._id.toString());
        }
      }
    }
  }

  // Also check if any other applications exist for this student
  const allApps = await Application.find({});
  console.log('Total applications now in MongoDB:', allApps.length);
  for (const a of allApps) {
    console.log(`- ${a.opportunityTitle} | Status: ${a.status} | User: ${a.applicantDetails?.email} (${a.userId}) | Ref: ${a.referenceId}`);
  }

  await mongoose.disconnect();
}

sync().catch(err => {
  console.error('Sync error:', err);
  process.exit(1);
});
