const fs = require('fs');

const freeDb = JSON.parse(fs.readFileSync('scratch/free-exercise-db/dist/exercises.json', 'utf8'));

const code = fs.readFileSync('lib/data/canonical-exercises.ts', 'utf8');
const eqIndex = code.indexOf('export const CANONICAL_EXERCISES');
const arrayStart = code.indexOf('[', code.indexOf('=', eqIndex));
const arrayEnd = code.lastIndexOf(']');
const canonicalList = JSON.parse(code.substring(arrayStart, arrayEnd + 1));

// Deterministic manual mapping for canonical exercises where names differ slightly but movement & equipment are identical
const MANUAL_FREE_DB_MAPPINGS = {
  // 18 Priority exercises
  '00000000-0000-4000-8000-000000e08b53': 'Barbell_Squat', // Barbell Squat
  '00000000-0000-4000-8000-000012b3e666': 'Barbell_Bench_Press_-_Medium_Grip', // Bench Press
  '00000000-0000-4000-8000-00001e04d96f': 'Barbell_Deadlift', // Deadlift
  '00000000-0000-4000-8000-00005e103db0': 'Pullups', // Pull-ups
  '00000000-0000-4000-8000-00004cbde1ea': 'Standing_Military_Press', // Overhead Press
  '00000000-0000-4000-8000-0000002f0d48': 'Dips_-_Chest_Version', // Dips
  '00000000-0000-4000-8000-000041104ed0': 'Barbell_Lunge', // Lunges
  '00000000-0000-4000-8000-0000098d19f7': 'Pushups', // Push-ups
  '00000000-0000-4000-8000-000036ee932b': 'Wide-Grip_Lat_Pulldown', // Lat Pulldown
  '00000000-0000-4000-8000-000001e92846': 'Incline_Dumbbell_Press', // Incline Dumbbell Press
  '00000000-0000-4000-8000-000004d88adf': 'Dumbbell_Bicep_Curl', // Bicep Curls
  '00000000-0000-4000-8000-0000107d5e50': 'Bent_Over_Barbell_Row', // Barbell Rows
  '00000000-0000-4000-8000-000020a82f50': 'Band_Pull_Apart', // Resistance Band Pull-Apart
  '00000000-0000-4000-8000-00000ba244dd': 'Band_Pull_Apart', // Resistance Band Pull-Aparts
  '00000000-0000-4000-8000-000016fbfbae': 'Bent_Over_Barbell_Row', // Bent Over Rows
};

function normalize(s) {
  return s ? s.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
}

const freeById = new Map();
const freeByName = new Map();
for (const f of freeDb) {
  freeById.set(f.id, f);
  freeByName.set(normalize(f.name), f);
}

const verifiedMatches = [];

for (const ex of canonicalList) {
  let matched = null;
  let method = null;
  let confidence = 0;

  // 1. Manual verified mapping
  if (MANUAL_FREE_DB_MAPPINGS[ex.id]) {
    const fId = MANUAL_FREE_DB_MAPPINGS[ex.id];
    matched = freeById.get(fId);
    if (matched) {
      method = 'exact_source_id';
      confidence = 1.0;
    }
  }

  // 2. Exact normalized name
  if (!matched) {
    const norm = normalize(ex.name);
    const found = freeByName.get(norm);
    if (found) {
      // Verify equipment compatibility
      const exEquip = (ex.equipment || []).map(e => e.toLowerCase());
      const fEquip = (found.equipment || '').toLowerCase();
      const equipCompatible = exEquip.length === 0 || !fEquip || exEquip.some(eq => eq.includes(fEquip) || fEquip.includes(eq));
      if (equipCompatible) {
        matched = found;
        method = 'exact_normalized_name';
        confidence = 0.95;
      }
    }
  }

  if (matched) {
    verifiedMatches.push({
      canonicalId: ex.id,
      canonicalName: ex.name,
      equipment: ex.equipment,
      matchedId: matched.id,
      matchedName: matched.name,
      matchedEquipment: matched.equipment,
      method,
      confidence,
      images: matched.images,
    });
  }
}

console.log(`Verified matches with free-exercise-db: ${verifiedMatches.length} / ${canonicalList.length}`);
console.log(verifiedMatches);
