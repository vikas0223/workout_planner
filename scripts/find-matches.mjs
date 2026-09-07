import fs from 'fs';

const dataset = JSON.parse(fs.readFileSync('./lib/data/dataset-exercises.json', 'utf8'));
const canonicalFileContent = fs.readFileSync('./lib/data/canonical-exercises.ts', 'utf8');
const eqIndex = canonicalFileContent.indexOf('export const CANONICAL_EXERCISES');
const arrayStart = canonicalFileContent.indexOf('[', canonicalFileContent.indexOf('=', eqIndex));
const arrayEnd = canonicalFileContent.lastIndexOf(']');
const canonicalExercises = JSON.parse(canonicalFileContent.substring(arrayStart, arrayEnd + 1));

console.log('Sample canonical names:');
for (let i = 0; i < 15; i++) {
  console.log(' - ' + canonicalExercises[i].name);
}

console.log('\nSearch for squat in dataset:');
const squats = dataset.filter(d => d.name.toLowerCase().includes('squat'));
console.log(squats.slice(0, 10).map(s => s.name));

console.log('\nSearch for bench press in dataset:');
const benches = dataset.filter(d => d.name.toLowerCase().includes('bench press'));
console.log(benches.slice(0, 10).map(s => s.name));

console.log('\nSearch for deadlift in dataset:');
const deadlifts = dataset.filter(d => d.name.toLowerCase().includes('deadlift'));
console.log(deadlifts.slice(0, 10).map(s => s.name));
