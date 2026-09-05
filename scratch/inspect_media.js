const fs = require('fs');

const content = fs.readFileSync('./lib/data/canonical-exercises.ts', 'utf8');

// Match media blocks
const mediaTypeMatches = content.match(/"type":\s*"([^"]+)"/g) || [];
const types = mediaTypeMatches.map(m => m.match(/"type":\s*"([^"]+)"/)[1]);
console.log('Media types count:', types.reduce((acc, t) => { acc[t] = (acc[t] || 0) + 1; return acc; }, {}));

const provenanceMatches = content.match(/"license":\s*"([^"]+)"/g) || [];
console.log('Licenses count:', provenanceMatches.reduce((acc, t) => { acc[t] = (acc[t] || 0) + 1; return acc; }, {}));

// Check mediaUrls vs media array
const hasMediaArray = (content.match(/"media":\s*\[/g) || []).length;
console.log('Exercises with "media": [ :', hasMediaArray);
