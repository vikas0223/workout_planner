const fs = require('fs');

const freeDb = JSON.parse(fs.readFileSync('scratch/free-exercise-db/dist/exercises.json', 'utf8'));

// Load canonical exercises
const code = fs.readFileSync('lib/data/canonical-exercises.ts', 'utf8');
const eqIndex = code.indexOf('export const CANONICAL_EXERCISES');
const arrayStart = code.indexOf('[', code.indexOf('=', eqIndex));
const arrayEnd = code.lastIndexOf(']');
const canonicalList = JSON.parse(code.substring(arrayStart, arrayEnd + 1));

function normalize(s) {
  if (!s) return '';
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normalizeKey(s) {
  if (!s) return '';
  return s
    .toLowerCase()
    .replace(/[—–\-_\/\\(),.:;']/g, ' ')
    .replace(/\b(barbell|dumbbell|cable|machine|smith|band|resistance band|kettlebell|bodyweight)\b/g, '')
    .replace(/s\b/g, '')
    .replace(/\s+/g, '')
    .trim();
}

console.log('--- Testing matching logic ---');
let matchedCount = 0;
const matchedDetails = [];

for (const ex of canonicalList) {
  const normEx = normalize(ex.name);
  const keyEx = normalizeKey(ex.name);
  const exEquip = (ex.equipment || []).map(e => e.toLowerCase());
  const exPrimary = (ex.primaryMuscles || []).map(m => m.toLowerCase());

  // Step 1: exact normalized name
  let found = freeDb.find(f => normalize(f.name) === normEx);
  let method = 'exact_normalized';

  // Step 2: verified normalized name + equipment
  if (!found) {
    const candidates = freeDb.filter(f => normalizeKey(f.name) === keyEx);
    if (candidates.length > 0) {
      // Check equipment match
      const equipMatch = candidates.find(c => {
        const cEquip = (c.equipment || '').toLowerCase();
        return exEquip.some(eq => eq.includes(cEquip) || cEquip.includes(eq));
      });
      if (equipMatch) {
        found = equipMatch;
        method = 'verified_name_equipment';
      } else if (candidates.length === 1) {
        found = candidates[0];
        method = 'normalized_name';
      }
    }
  }

  // Step 3: target muscles + equipment + substring match
  if (!found && exEquip.length > 0) {
    const candidates = freeDb.filter(f => {
      const cName = f.name.toLowerCase();
      const exNameClean = ex.name.toLowerCase();
      const cEquip = (f.equipment || '').toLowerCase();
      const equipMatch = exEquip.some(eq => eq.includes(cEquip) || cEquip.includes(eq));
      if (!equipMatch) return false;

      // Substring check
      if (cName.includes(exNameClean) || exNameClean.includes(cName)) return true;
      return false;
    });

    if (candidates.length === 1) {
      found = candidates[0];
      method = 'verified_name_equipment_sub';
    }
  }

  if (found) {
    matchedCount++;
    matchedDetails.push({
      canonicalId: ex.id,
      canonicalName: ex.name,
      equipment: ex.equipment,
      matchedName: found.name,
      matchedId: found.id,
      method,
      images: found.images
    });
  }
}

console.log(`Matched ${matchedCount} / ${canonicalList.length} canonical exercises to free-exercise-db.`);
console.log('Sample matches (first 30):');
console.log(matchedDetails.slice(0, 30));
