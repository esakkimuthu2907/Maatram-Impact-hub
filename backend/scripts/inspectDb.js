// backend/scripts/inspectDb.js
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');

async function check() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  console.log('Database name:', mongoose.connection.db.databaseName);
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('Collections:', collections.map(c => c.name));
  for (const c of collections) {
    const count = await mongoose.connection.db.collection(c.name).countDocuments();
    console.log(c.name + ': ' + count + ' docs');
  }
  const events = await mongoose.connection.db.collection('events').find({}).toArray();
  console.log('Events in raw collection:', events.map(e => ({ id: e._id, title: e.title, category: e.category, points: e.points })));
  const users = await mongoose.connection.db.collection('users').find({}).toArray();
  console.log('Users in raw collection:', users.map(u => ({ id: u._id, email: u.email, role: u.role, points: u.points })));
  const apps = await mongoose.connection.db.collection('applications').find({}).toArray();
  console.log('Applications in raw collection:', apps.map(a => ({ id: a._id, title: a.opportunityTitle, email: a.applicantDetails?.email, status: a.status })));
  await mongoose.disconnect();
}
check().catch(err => {
  console.error(err);
  process.exit(1);
});
