const fs = require('fs');

const freeDb = JSON.parse(fs.readFileSync('scratch/free-exercise-db/dist/exercises.json', 'utf8'));
const azilDb = JSON.parse(fs.readFileSync('scratch/azilRababe-dataset/gifs_data.json', 'utf8'));

// Read canonical exercises by loading or parsing
const code = fs.readFileSync('lib/data/canonical-exercises.ts', 'utf8');
const exercises = [];
const lines = code.split('\n');
let curId = null;
let curName = null;
let curEquip = [];
let curPrimary = [];

for (const line of lines) {
  const idMatch = line.match(/"id":\s*"([^"]+)"/);
  if (idMatch && line.includes('00000000-0000-4000-8000-')) {
    curId = idMatch[1];
  }
  const nameMatch = line.match(/"name":\s*"([^"]+)"/);
  if (nameMatch && curId && !curName) {
    curName = nameMatch[1];
    exercises.push({ id: curId, name: curName });
    curId = null;
    curName = null;
  }
}

console.log('Parsed', exercises.length, 'canonical exercises.');

function normalize(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normalizeFuzzy(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[—–\-_\/\\(),.:;]/g, ' ')
    .replace(/\b(barbell|dumbbell|cable|machine|smith|band|resistance band|kettlebell)\b/g, '')
    .replace(/s\b/g, '')
    .replace(/[^a-z0-9]/g, '');
}

const freeMapExact = new Map();
const freeMapNorm = new Map();
for (const item of freeDb) {
  freeMapExact.set(normalize(item.name), item);
  freeMapNorm.set(normalizeFuzzy(item.name), item);
}

const azilMapExact = new Map();
const azilMapNorm = new Map();
for (const item of azilDb) {
  azilMapExact.set(normalize(item.title), item);
  azilMapNorm.set(normalizeFuzzy(item.title), item);
}

let freeExactCount = 0;
let freeNormCount = 0;
let azilExactCount = 0;
let azilNormCount = 0;

const matchedList = [];

for (const ex of exercises) {
  const normExact = normalize(ex.name);
  const normFuzzy = normalizeFuzzy(ex.name);

  let freeMatch = freeMapExact.get(normExact);
  let freeMethod = freeMatch ? 'exact_normalized' : null;
  if (!freeMatch) {
    freeMatch = freeMapNorm.get(normFuzzy);
    if (freeMatch) freeMethod = 'normalized_name';
  }

  let azilMatch = azilMapExact.get(normExact);
  let azilMethod = azilMatch ? 'exact_normalized' : null;
  if (!azilMatch) {
    azilMatch = azilMapNorm.get(normFuzzy);
    if (azilMatch) azilMethod = 'normalized_name';
  }

  if (freeMatch) {
    if (freeMethod === 'exact_normalized') freeExactCount++;
    else freeNormCount++;
  }
  if (azilMatch) {
    if (azilMethod === 'exact_normalized') azilExactCount++;
    else azilNormCount++;
  }

  matchedList.push({
    id: ex.id,
    name: ex.name,
    freeMatch: freeMatch ? { id: freeMatch.id, name: freeMatch.name, images: freeMatch.images, method: freeMethod } : null,
    azilMatch: azilMatch ? { id: azilMatch.id, title: azilMatch.title, gifUrl: azilMatch.gif_url, method: azilMethod } : null,
  });
}

console.log(`free-exercise-db: ${freeExactCount} exact, ${freeNormCount} normalized (Total: ${freeExactCount + freeNormCount})`);
console.log(`azilRababe: ${azilExactCount} exact, ${azilNormCount} normalized (Total: ${azilExactCount + azilNormCount})`);

// Priority exercises check
const priorityNames = [
  'Abductor Machine',
  'Adductor Machine',
  'Ankle Rotations',
  'Assault Bike',
  'Band Pull-Aparts',
  'Barbell Rows',
  'Barbell Back Squat',
  'Bench Press',
  'Deadlift',
  'Pull-Ups',
  'Overhead Press',
  'Dips',
  'Lunges',
  'Push-Ups',
  'Lat Pulldown',
  'Dumbbell Press',
  'Biceps Curl',
  'Triceps Extension'
];

console.log('\n--- Priority Exercises Check ---');
for (const p of priorityNames) {
  const ex = exercises.find(e => normalize(e.name) === normalize(p) || normalizeFuzzy(e.name) === normalizeFuzzy(p));
  if (!ex) {
    console.log(`[NOT FOUND IN CANONICAL]: ${p}`);
  } else {
    const match = matchedList.find(m => m.id === ex.id);
    console.log(`[FOUND]: "${ex.name}" (ID: ${ex.id}) -> freeDb: ${match.freeMatch ? match.freeMatch.name : 'NO'}, azil: ${match.azilMatch ? match.azilMatch.title : 'NO'}`);
  }
}
