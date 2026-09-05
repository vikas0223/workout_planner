const fs = require('fs');

const content = fs.readFileSync('./lib/data/canonical-exercises.ts', 'utf8');

// Parse basic exercise info
const idMatches = content.match(/"id":\s*"([^"]+)"/g) || [];
const nameMatches = content.match(/"name":\s*"([^"]+)"/g) || [];
const mediaUrlMatches = content.match(/"url":\s*"([^"]+)"/g) || [];
const mediaTypeMatches = content.match(/"type":\s*"([^"]+)"/g) || [];

console.log('Total IDs found:', idMatches.length);
console.log('Total Names found:', nameMatches.length);
console.log('Total Media URLs found:', mediaUrlMatches.length);

const urls = mediaUrlMatches.map(m => m.match(/"url":\s*"([^"]+)"/)[1]);
const uniqueUrls = Array.from(new Set(urls));
console.log('Sample URLs (first 20):', uniqueUrls.slice(0, 20));

// Check if these URLs exist in public folder
let existingCount = 0;
let missingCount = 0;
for (const u of uniqueUrls) {
  const localPath = './public' + u;
  if (fs.existsSync(localPath)) {
    existingCount++;
  } else {
    missingCount++;
  }
}
console.log(`Media files check: ${existingCount} exist in public/, ${missingCount} missing in public/`);
