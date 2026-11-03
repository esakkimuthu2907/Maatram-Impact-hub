const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();
const mongoose = require('mongoose');

async function check() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  const txs = await mongoose.connection.db.collection('pointstransactions').find().toArray();
  console.log('--- Transactions (' + txs.length + ') ---');
  console.log(JSON.stringify(txs, null, 2));

  const notifs = await mongoose.connection.db.collection('notifications').find().toArray();
  console.log('--- Notifications (' + notifs.length + ') ---');
  console.log(JSON.stringify(notifs, null, 2));

  const apps = await mongoose.connection.db.collection('applications').find().toArray();
  console.log('--- Applications (' + apps.length + ') ---');
  console.log(JSON.stringify(apps, null, 2));

  await mongoose.disconnect();
}
check().catch(e => { console.error(e); process.exit(1); });
