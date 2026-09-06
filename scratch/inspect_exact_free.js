const fs = require('fs');

const freeDb = JSON.parse(fs.readFileSync('scratch/free-exercise-db/dist/exercises.json', 'utf8'));

// Load canonical exercises
const code = fs.readFileSync('lib/data/canonical-exercises.ts', 'utf8');
const eqIndex = code.indexOf('export const CANONICAL_EXERCISES');
const arrayStart = code.indexOf('[', code.indexOf('=', eqIndex));
const arrayEnd = code.lastIndexOf(']');
const canonicalList = JSON.parse(code.substring(arrayStart, arrayEnd + 1));

console.log('Successfully loaded', canonicalList.length, 'canonical exercises.');

function cleanName(s) {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

const freeByName = new Map();
for (const f of freeDb) {
  freeByName.set(cleanName(f.name), f);
}

let exactNameMatches = 0;
const results = [];

for (const ex of canonicalList) {
  const name = cleanName(ex.name);
  const match = freeByName.get(name);
  if (match) {
    exactNameMatches++;
    results.push({
      canonical: ex.name,
      equipment: ex.equipment,
      matched: match.name,
      freeId: match.id,
      images: match.images
    });
  }
}

console.log('Exact (clean) name matches with free-exercise-db:', exactNameMatches);
console.log('Exact matches:');
console.log(results);
