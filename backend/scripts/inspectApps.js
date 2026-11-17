const path = require('path');
require('dns').setServers(["8.8.8.8", "8.8.4.4"]);
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });
  console.log('Connected to MongoDB Atlas!');
  const Application = require('../models/Application');
  const apps = await Application.find({}).lean();
  console.log('MongoDB Apps count:', apps.length);
  apps.forEach(a => {
    console.log(`App ID: ${a._id} | oppId: ${a.opportunityId} | Name: ${a.applicantDetails?.name} | status: ${a.status} | att: ${a.attendanceStatus}`);
  });

  const Event = require('../models/Event');
  const evts = await Event.find({}).lean();
  console.log('MongoDB Events count:', evts.length);
  evts.forEach(e => {
    console.log(`Event ID: ${e._id} | title: ${e.title} | status: ${e.eventStatus || e.status}`);
  });

  await mongoose.disconnect();
}
run().catch(console.error);
