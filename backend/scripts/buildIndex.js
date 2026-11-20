// Script to build RAG index
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const ragService = require('../services/ragService');
ragService.buildIndex(true).then(r => {
  console.log('BUILD RESULT:', JSON.stringify(r, null, 2));
  process.exit(0);
}).catch(e => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
