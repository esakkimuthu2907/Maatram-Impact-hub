const fs = require('fs');

const path = 'C:/Users/hp/.gemini/antigravity/brain/05e214fe-17b0-4d45-88cf-08d0ede48fda/.system_generated/logs/transcript_full.jsonl';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');
for (const line of lines) {
  if (line.includes('StudentDashboard.jsx') && line.includes('Showing lines') && (line.includes('50-') || line.includes('1-100') || line.includes('100-') || line.includes('90-'))) {
    const data = JSON.parse(line);
    console.log(`=== STEP ${data.step_index} ===`);
    console.log(data.content);
  }
}
