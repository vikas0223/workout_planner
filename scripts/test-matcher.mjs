import fs from 'fs';

const dataset = JSON.parse(fs.readFileSync('./lib/data/dataset-exercises.json', 'utf8'));
const canonicalFileContent = fs.readFileSync('./lib/data/canonical-exercises.ts', 'utf8');
const eqIndex = canonicalFileContent.indexOf('export const CANONICAL_EXERCISES');
const arrayStart = canonicalFileContent.indexOf('[', canonicalFileContent.indexOf('=', eqIndex));
const arrayEnd = canonicalFileContent.lastIndexOf(']');
const canonicalExercises = JSON.parse(canonicalFileContent.substring(arrayStart, arrayEnd + 1));

// Normalize strings for matching
function norm(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Manual high-accuracy mappings for canonical core movements to dataset ID
const CORE_CANONICAL_TO_DATASET_ID = {
  // Barbell Squat -> Barbell Full Squat (0043)
  '00000000-0000-4000-8000-000000e08b53': '0043',
  // Bench Press -> Barbell Bench Press (0025)
  '00000000-0000-4000-8000-000012b3e666': '0025',
  // Deadlift -> Barbell Deadlift (0032)
  '00000000-0000-4000-8000-00001e04d96f': '0032',
  // Pull-ups -> Pull-up (0652)
  '00000000-0000-4000-8000-00005e103db0': '0652',
  // Overhead Press -> Barbell Standing Overhead Press (0108)
  '00000000-0000-4000-8000-00004cbde1ea': '0108',
  // Barbell Rows -> Barbell Bent Over Row (0027)
  '00000000-0000-4000-8000-0000107d5e50': '0027',
  // Bent Over Rows -> Barbell Bent Over Row (0027)
  '00000000-0000-4000-8000-000016fbfbae': '0027',
  // Dips -> Chest Dip (0251)
  '00000000-0000-4000-8000-0000002f0d48': '0251',
  // Lunges -> Barbell Lunge (0054)
  '00000000-0000-4000-8000-000041104ed0': '0054',
  // Push-ups -> Push-up (0662)
  '00000000-0000-4000-8000-0000098d19f7': '0662',
  // Incline Dumbbell Press -> Dumbbell Incline Bench Press (0314)
  '00000000-0000-4000-8000-000001e92846': '0314',
  // Dumbbell Curl -> Dumbbell Bicep Curl (0294)
  '00000000-0000-4000-8000-000004d88adf': '0294',
  // Lat Pulldown -> Cable Bar Lateral Pulldown (0150)
  '00000000-0000-4000-8000-000036ee932b': '0150',
  // Leg Press -> Sled 45° Leg Press (0739)
  '00000000-0000-4000-8000-0000248117c4': '0739',
  // Romanian Deadlift -> Barbell Romanian Deadlift (0085)
  '00000000-0000-4000-8000-00003a39fa7d': '0085',
  // Leg Extensions -> Lever Leg Extension (0585)
  '00000000-0000-4000-8000-00003c160133': '0585',
  // Hammer Curls -> Dumbbell Hammer Curl (0313)
  '00000000-0000-4000-8000-000073f37e00': '0313',
  // Mountain Climbers -> Mountain Climber (0458)
  '00000000-0000-4000-8000-00006d36be2f': '0458',
  // Triceps Pushdown -> Cable Pushdown (0201)
  '00000000-0000-4000-8000-00000af286ad': '0201',
  // Seated Cable Rows -> Cable Seated Row (0239)
  '00000000-0000-4000-8000-000051798d72': '0239',
  // Face Pulls -> Cable Rear Delt Row (With Rope) (0220)
  '00000000-0000-4000-8000-00001eb9f4a2': '0220',
  // Lying Leg Curls -> Lever Lying Leg Curl (0589)
  '00000000-0000-4000-8000-000023cb7348': '0589',
};

const datasetById = new Map(dataset.map(d => [d.id, d]));
const datasetByNorm = new Map(dataset.map(d => [norm(d.name), d]));

// Validate all configured mappings resolve with expected ID
for (const [canonId, expectedId] of Object.entries(CORE_CANONICAL_TO_DATASET_ID)) {
  const d = datasetById.get(expectedId);
  if (!d || d.id !== expectedId) {
    console.error(`[ERROR] Unresolved configured mapping: Canonical ID ${canonId} -> expected Dataset ID ${expectedId}`);
    process.exit(1);
  }
}

let matchedCount = 0;
for (const c of canonicalExercises) {
  let matchedDataset = null;
  if (CORE_CANONICAL_TO_DATASET_ID[c.id]) {
    const expectedId = CORE_CANONICAL_TO_DATASET_ID[c.id];
    const resolved = datasetById.get(expectedId);
    if (!resolved || resolved.id !== expectedId) {
      console.error(`[ERROR] Missing or mismatched dataset record for canonical exercise "${c.name}" (${c.id}): expected ID "${expectedId}"`);
      process.exit(1);
    }
    matchedDataset = resolved;
  } else if (datasetByNorm.has(norm(c.name))) {
    matchedDataset = datasetByNorm.get(norm(c.name));
  } else {
    // Try relaxed match: check if dataset exercise starts with or contains
    const cNorm = norm(c.name);
    for (const d of dataset) {
      const dNorm = norm(d.name);
      if (dNorm === cNorm || (dNorm.includes(cNorm) && d.equipment[0] === c.equipment[0])) {
        matchedDataset = d;
        break;
      }
    }
  }

  if (matchedDataset) {
    matchedCount++;
    console.log(`[MATCH] "${c.name}" -> "${matchedDataset.name}" (${matchedDataset.id})`);
  }
}

console.log(`\nTotal matched: ${matchedCount} / ${canonicalExercises.length}`);
