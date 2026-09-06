const fs = require('fs');
const code = fs.readFileSync('lib/data/canonical-exercises.ts', 'utf8');
const eqIndex = code.indexOf('export const CANONICAL_EXERCISES');
const arrayStart = code.indexOf('[', code.indexOf('=', eqIndex));
const arrayEnd = code.lastIndexOf(']');
const canonicalExercises = JSON.parse(code.substring(arrayStart, arrayEnd + 1));

const freeDb = JSON.parse(fs.readFileSync('scratch/free-exercise-db/dist/exercises.json', 'utf8'));
const freeById = new Map(freeDb.map(f => [f.id, f]));

const exactMappings = {
  'Barbell Squat': 'Barbell_Squat',
  'Bench Press': 'Barbell_Bench_Press_-_Medium_Grip',
  'Deadlift': 'Barbell_Deadlift',
  'Pull-ups': 'Pullups',
  'Overhead Press': 'Standing_Military_Press',
  'Dips': 'Dips_-_Chest_Version',
  'Lunges': 'Barbell_Lunge',
  'Resistance Band Push-ups': 'Pushups',
  'Lat Pulldown': 'Wide-Grip_Lat_Pulldown',
  'Incline Dumbbell Press': 'Incline_Dumbbell_Press',
  'Bicep Curls': 'Dumbbell_Bicep_Curl',
  'Barbell Rows': 'Bent_Over_Barbell_Row',
  'Resistance Band Pull-Apart': 'Band_Pull_Apart',
  'Resistance Band Pull-Aparts': 'Band_Pull_Apart',
  'Bent Over Rows': 'Bent_Over_Barbell_Row',
  'Leg Press': 'Leg_Press',
  'Romanian Deadlift': 'Romanian_Deadlift',
  'Leg Extensions': 'Leg_Extensions',
  'Glute-Ham Raises': 'Glute_Ham_Raise',
  'Medicine Ball Chest Pass': 'Medicine_Ball_Chest_Pass',
  'Hammer Curls': 'Hammer_Curls',
  'Mountain Climbers': 'Mountain_Climbers',
  'Sled Push': 'Sled_Push',
  'Plyo Push-ups': 'Plyo_Push-up',
  'Shoulder Stretch': 'Shoulder_Stretch',
  "Child's Pose": 'Childs_Pose',
  "World's Greatest Stretch": 'Worlds_Greatest_Stretch',
  'Dumbbell Shoulder Press': 'Dumbbell_Shoulder_Press',
  'Seated Cable Rows': 'Seated_Cable_Rows',
  'Face Pulls': 'Face_Pull',
  'Plank': 'Plank',
  'Tricep Pushdowns': 'Triceps_Pushdown',
  'Resistance Band Tricep Extensions': 'Band_Skull_Crusher',
  'Resistance Band Tricep Pushdowns': 'Triceps_Pushdown',
  'Calf Raises': 'Smith_Machine_Calf_Raise',
  'Leg Curls': 'Lying_Leg_Curls'
};

const mapOutput = {};

for (const [name, freeId] of Object.entries(exactMappings)) {
  const found = canonicalExercises.find(c => c.name.toLowerCase() === name.toLowerCase());
  if (found && freeById.has(freeId)) {
    mapOutput[found.id] = {
      name: found.name,
      slug: found.slug,
      freeId: freeId,
      freeName: freeById.get(freeId).name,
      freeImages: freeById.get(freeId).images
    };
  } else {
    console.log('Not mapped:', name, found ? 'found' : 'not found in canonical', freeById.has(freeId) ? 'freeId ok' : 'freeId missing');
  }
}

console.log('Total verified maps:', Object.keys(mapOutput).length);
fs.writeFileSync('scratch/verified_map_table.json', JSON.stringify(mapOutput, null, 2));
