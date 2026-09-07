import fs from 'fs';
import path from 'path';

const datasetExercises = JSON.parse(fs.readFileSync('./lib/data/dataset-exercises.json', 'utf8'));

// Read canonical exercises
const canonicalFileContent = fs.readFileSync('./lib/data/canonical-exercises.ts', 'utf8');
const eqIndex = canonicalFileContent.indexOf('export const CANONICAL_EXERCISES');
const arrayStart = canonicalFileContent.indexOf('[', canonicalFileContent.indexOf('=', eqIndex));
const arrayEnd = canonicalFileContent.lastIndexOf(']');
const canonicalExercises = JSON.parse(canonicalFileContent.substring(arrayStart, arrayEnd + 1));

console.log(`Loaded ${canonicalExercises.length} canonical exercises.`);
console.log(`Loaded ${datasetExercises.length} dataset exercises.`);

// Build indexes
const datasetById = new Map(datasetExercises.map(d => [d.id, d]));
const datasetByNormName = new Map();
for (const d of datasetExercises) {
  const norm = d.name.toLowerCase().replace(/[^a-z0-9]/g, '');
  datasetByNormName.set(norm, d);
}

const CORE_CANONICAL_TO_DATASET_ID = {
  '00000000-0000-4000-8000-000000e08b53': '0043',
  '00000000-0000-4000-8000-000012b3e666': '0025',
  '00000000-0000-4000-8000-00001e04d96f': '0032',
  '00000000-0000-4000-8000-00005e103db0': '0652',
  '00000000-0000-4000-8000-0000107d5e50': '0027',
  '00000000-0000-4000-8000-000016fbfbae': '0027',
  '00000000-0000-4000-8000-0000002f0d48': '0251',
  '00000000-0000-4000-8000-000041104ed0': '0054',
  '00000000-0000-4000-8000-0000098d19f7': '0662',
  '00000000-0000-4000-8000-000001e92846': '0314',
  '00000000-0000-4000-8000-000004d88adf': '0294',
  '00000000-0000-4000-8000-000036ee932b': '0150',
  '00000000-0000-4000-8000-0000248117c4': '0739',
  '00000000-0000-4000-8000-00003a39fa7d': '0085',
  '00000000-0000-4000-8000-00003c160133': '0585',
  '00000000-0000-4000-8000-000073f37e00': '0313',
  '00000000-0000-4000-8000-00000af286ad': '0201',
  '00000000-0000-4000-8000-000051798d72': '0239',
};

function isSafetySignatureViolated(canonicalName, canonicalEquip, externalName, externalEquip) {
  const normTarget = canonicalName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normExt = externalName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const targetEquipLower = (canonicalEquip || []).map(e => e.toLowerCase());
  const extEquipLower = (externalEquip || '').toLowerCase();

  if (normTarget.includes('abductor') && normExt.includes('adductor')) return true;
  if (normTarget.includes('adductor') && normExt.includes('abductor')) return true;
  const isTargetBand = targetEquipLower.some(e => e.includes('band'));
  const isExtBand = extEquipLower.includes('band');
  if (isTargetBand && !isExtBand && (extEquipLower.includes('barbell') || extEquipLower.includes('dumbbell') || extEquipLower.includes('cable'))) return true;
  if (!isTargetBand && isExtBand && targetEquipLower.some(e => e.includes('barbell') || e.includes('dumbbell') || e.includes('cable'))) return true;
  if (normTarget === 'benchpress' && (normExt.includes('incline') || normExt.includes('decline') || normExt.includes('dumbbell'))) return true;
  if (normTarget.includes('barbellrow') && (normExt.includes('cablerow') || normExt.includes('dumbbellrow'))) return true;
  if (normTarget.includes('backsquat') && (normExt.includes('frontsquat') || normExt.includes('smith'))) return true;
  return false;
}

const claimedDatasetIds = new Set();
const claimedDatasetNames = new Set();
let canonicalEnrichedWithMedia = 0;

const enrichedCanonicalExercises = canonicalExercises.map(c => {
  let match = null;
  const targetId = CORE_CANONICAL_TO_DATASET_ID[c.id];
  if (targetId) {
    const candidate = datasetById.get(targetId);
    if (candidate && !isSafetySignatureViolated(c.name, c.equipment || [], candidate.name, (candidate.equipment && candidate.equipment[0]) || '')) {
      match = candidate;
    }
  }

  if (!match) {
    const norm = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const candidate = datasetByNormName.get(norm);
    if (candidate && !isSafetySignatureViolated(c.name, c.equipment || [], candidate.name, (candidate.equipment && candidate.equipment[0]) || '')) {
      match = candidate;
    }
  }

  if (match) {
    claimedDatasetIds.add(match.id);
    claimedDatasetNames.add(match.name.toLowerCase().replace(/[^a-z0-9]/g, ''));

    if (match.media && match.media.length > 0) {
      canonicalEnrichedWithMedia++;
      const existingUrls = new Set((c.media || []).map(m => m.url));
      const mergedMedia = [...(c.media || [])];
      for (const m of match.media) {
        if (!existingUrls.has(m.url)) {
          mergedMedia.push(m);
          existingUrls.add(m.url);
        }
      }
      return {
        ...c,
        media: mergedMedia,
        thumbnailUrl: c.thumbnailUrl || match.thumbnailUrl,
        mediaUrl: c.mediaUrl || match.mediaUrl,
      };
    }
  }
  return c;
});

console.log(`Enriched ${canonicalEnrichedWithMedia} canonical exercises with dataset media.`);

// Combine: All canonical exercises + all dataset exercises that are not duplicate names of canonical exercises
const allExercises = [...enrichedCanonicalExercises];
const canonicalIds = new Set(canonicalExercises.map(c => c.id));
const existingNames = new Set(canonicalExercises.map(c => c.name.toLowerCase().replace(/[^a-z0-9]/g, '')));
let addedFromDataset = 0;

for (const d of datasetExercises) {
  const norm = d.name.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!canonicalIds.has(d.id) && !claimedDatasetIds.has(d.id) && !existingNames.has(norm) && !claimedDatasetNames.has(norm)) {
    allExercises.push(d);
    existingNames.add(norm);
    addedFromDataset++;
  }
}

console.log(`Added ${addedFromDataset} unique exercises from dataset.`);
console.log(`Total combined exercise catalog size: ${allExercises.length}`);

// Write combined catalog
const combinedPath = path.resolve('lib/data/combined-exercises.json');
fs.writeFileSync(combinedPath, JSON.stringify(allExercises));
console.log(`Wrote combined catalog to ${combinedPath} (${Math.round(fs.statSync(combinedPath).size / 1024)} KB)`);
