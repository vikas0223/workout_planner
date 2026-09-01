/**
 * Generator script to create lib/data/canonical-exercises.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { exerciseDatabase } from './lib/exercise-database';
import { toStableId } from './lib/utils/id';

// Muscle mapping helper
function cleanMuscles(rawGroup: string, name: string): { primary: string[]; secondary: string[]; movement: string; joints: string[] } {
  const n = name.toLowerCase();
  const g = rawGroup.toLowerCase();

  let primary: string[] = [];
  let secondary: string[] = [];
  let movement: 'push' | 'pull' | 'squat' | 'hinge' | 'carry' | 'rotation' | 'isolation' | 'locomotion' = 'isolation';
  let joints: string[] = [];

  if (n.includes('bench press') || n.includes('push-up') || n.includes('push up') || n.includes('chest press') || n.includes('chest fly') || n.includes('dip')) {
    primary = ['Chest'];
    secondary = ['Triceps', 'Shoulders'];
    movement = 'push';
    joints = ['shoulders', 'elbows', 'wrists'];
  } else if (n.includes('overhead press') || n.includes('shoulder press') || n.includes('military press') || n.includes('lateral raise') || n.includes('arnold')) {
    primary = ['Shoulders'];
    secondary = ['Triceps', 'Upper Back'];
    movement = 'push';
    joints = ['shoulders', 'elbows'];
  } else if (n.includes('deadlift') || n.includes('romanian') || n.includes('good morning') || n.includes('kettlebell swing') || n.includes('hip thrust') || n.includes('glute bridge')) {
    primary = ['Hamstrings', 'Glutes'];
    secondary = ['Lower Back', 'Core', 'Forearms'];
    movement = 'hinge';
    joints = ['hips', 'spine', 'knees'];
  } else if (n.includes('squat') || n.includes('lunge') || n.includes('leg press') || n.includes('split squat') || n.includes('step-up') || n.includes('wall sit')) {
    primary = ['Quads', 'Glutes'];
    secondary = ['Hamstrings', 'Calves', 'Core'];
    movement = 'squat';
    joints = ['knees', 'hips', 'ankles'];
  } else if (n.includes('pull-up') || n.includes('chin-up') || n.includes('lat pulldown') || n.includes('row') || n.includes('pulldown') || n.includes('face pull')) {
    primary = ['Back', 'Lats'];
    secondary = ['Biceps', 'Shoulders', 'Forearms'];
    movement = 'pull';
    joints = ['shoulders', 'elbows'];
  } else if (n.includes('curl') || n.includes('bicep')) {
    primary = ['Biceps'];
    secondary = ['Forearms'];
    movement = 'isolation';
    joints = ['elbows', 'wrists'];
  } else if (n.includes('tricep') || n.includes('skull crusher') || n.includes('pushdown')) {
    primary = ['Triceps'];
    secondary = ['Shoulders'];
    movement = 'isolation';
    joints = ['elbows'];
  } else if (n.includes('plank') || n.includes('crunch') || n.includes('leg raise') || n.includes('russian twist') || n.includes('woodchopper') || n.includes('ab wheel') || n.includes('hollow body') || n.includes('dead bug')) {
    primary = ['Abs', 'Core'];
    secondary = ['Obliques', 'Lower Back'];
    movement = n.includes('twist') || n.includes('wood') ? 'rotation' : 'isolation';
    joints = ['spine'];
  } else if (n.includes('carry') || n.includes('farmer') || n.includes('walk') || n.includes('sled')) {
    primary = ['Full Body', 'Core'];
    secondary = ['Forearms', 'Traps', 'Glutes'];
    movement = 'carry';
    joints = ['shoulders', 'hips', 'ankles'];
  } else if (n.includes('run') || n.includes('jump') || n.includes('burpee') || n.includes('skater') || n.includes('mountain climber') || n.includes('jumping jack') || n.includes('high knee') || n.includes('rowing machine') || n.includes('sprint') || n.includes('cycling')) {
    primary = ['Cardio', 'Full Body'];
    secondary = ['Quads', 'Calves', 'Core'];
    movement = 'locomotion';
    joints = ['knees', 'ankles', 'hips'];
  } else if (n.includes('calf') || n.includes('raise')) {
    primary = ['Calves'];
    secondary = ['Feet'];
    movement = 'isolation';
    joints = ['ankles'];
  } else if (g.includes('push') || g.includes('chest')) {
    primary = ['Chest', 'Shoulders'];
    secondary = ['Triceps'];
    movement = 'push';
    joints = ['shoulders', 'elbows'];
  } else if (g.includes('pull') || g.includes('back')) {
    primary = ['Back', 'Lats'];
    secondary = ['Biceps'];
    movement = 'pull';
    joints = ['shoulders', 'elbows'];
  } else if (g.includes('lower') || g.includes('legs')) {
    primary = ['Quads', 'Hamstrings', 'Glutes'];
    secondary = ['Calves'];
    movement = 'squat';
    joints = ['knees', 'hips'];
  } else {
    primary = ['Full Body'];
    secondary = ['Core'];
    movement = 'isolation';
    joints = [];
  }

  return { primary, secondary, movement, joints };
}

function assignDifficulty(name: string, equipment: string[]): 'beginner' | 'intermediate' | 'advanced' {
  const n = name.toLowerCase();
  if (n.includes('deadlift') || n.includes('barbell squat') || n.includes('clean') || n.includes('snatch') || n.includes('handstand') || n.includes('pistol squat') || n.includes('muscle-up') || n.includes('dragon flag')) {
    return 'advanced';
  }
  if (n.includes('push-up') || n.includes('bodyweight squat') || n.includes('plank') || n.includes('jumping jack') || n.includes('glute bridge') || n.includes('wall sit') || n.includes('bicep curl') || n.includes('lat pulldown') || n.includes('seated') || n.includes('crunch') || n.includes('machine') || n.includes('high knee') || n.includes('cat cow') || n.includes('child')) {
    return 'beginner';
  }
  return 'intermediate';
}

function generateFormCues(name: string, movement: string): string[] {
  const n = name.toLowerCase();
  if (movement === 'squat') {
    return ['Keep chest proud and spine neutral', 'Track knees in line with second toes', 'Drive through mid-foot and heels'];
  }
  if (movement === 'hinge') {
    return ['Hinge at the hips with soft knees', 'Keep bar/weight close to body', 'Engage lats and maintain flat back'];
  }
  if (movement === 'push') {
    return ['Retract and depress shoulder blades', 'Maintain stable 45° to 60° elbow angle', 'Exhale during concentric pressing phase'];
  }
  if (movement === 'pull') {
    return ['Initiate movement by retracting scapulae', 'Pull elbows toward ribcage/hips', 'Avoid using momentum or excessive lumbar arching'];
  }
  if (n.includes('plank') || n.includes('core')) {
    return ['Brace core as if preparing for a punch', 'Keep hips in a straight line from shoulders to heels', 'Breathe steadily into the diaphragm'];
  }
  return ['Maintain controlled tempo throughout the movement', 'Exhale on exertion, inhale on lowering', 'Focus on mind-muscle connection with the target muscle'];
}

function generateMistakes(name: string, movement: string): string[] {
  if (movement === 'squat') {
    return ['Knees caving inward (valgus collapse)', 'Rounding the lower back in the hole', 'Shifting weight onto the toes'];
  }
  if (movement === 'hinge') {
    return ['Rounding the lumbar spine under load', 'Hyperextending the lower back at lockout', 'Squatting the movement instead of hinging'];
  }
  if (movement === 'push') {
    return ['Flaring elbows out at 90 degrees', 'Arching excessively without glute/core engagement', 'Bouncing the weight at the bottom'];
  }
  if (movement === 'pull') {
    return ['Shrugging shoulders into upper traps', 'Using excessive hip swing to initiate the pull', 'Incomplete range of motion at extension'];
  }
  return ['Using excessive weight that compromises form', 'Rushing the eccentric (lowering) phase', 'Holding breath during exertion'];
}

// Extract exercises from rawDb
const rawDb = exerciseDatabase as Record<string, Record<string, any[]>>;
const exercisesMap = new Map<string, any>();

for (const [goal, groups] of Object.entries(rawDb)) {
  for (const [groupName, exList] of Object.entries(groups)) {
    for (const raw of exList) {
      const name = raw.name.trim();
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const id = toStableId('ex', slug);

      const equipment = (raw.equipment || ['bodyweight']).map((eq: string) => {
        const e = eq.toLowerCase();
        if (e === 'barbells') return 'Barbell';
        if (e === 'dumbbells') return 'Dumbbell';
        if (e === 'cables') return 'Cable';
        if (e === 'kettlebells') return 'Kettlebell';
        if (e === 'resistance bands') return 'Resistance Band';
        if (e === 'bodyweight') return 'Bodyweight';
        if (e === 'machine') return 'Machine';
        return eq.charAt(0).toUpperCase() + eq.slice(1);
      });

      const { primary, secondary, movement, joints } = cleanMuscles(groupName, name);
      const difficulty = assignDifficulty(name, equipment);

      if (exercisesMap.has(slug)) {
        const existing = exercisesMap.get(slug);
        if (!existing.goals.includes(goal)) existing.goals.push(goal);
        equipment.forEach((eq: string) => {
          if (!existing.equipment.includes(eq)) existing.equipment.push(eq);
        });
      } else {
        const instructions = raw.instructions
          ? raw.instructions.split('. ').map((s: string) => s.trim().replace(/\.$/, '') + '.').filter((s: string) => s.length > 2)
          : [`Perform ${name} with controlled form and full range of motion.`];

        exercisesMap.set(slug, {
          id,
          name,
          slug,
          aliases: [name.toLowerCase()],
          description: raw.instructions || `Standard ${name} targeting ${primary.join(', ')}.`,
          primaryMuscles: primary,
          secondaryMuscles: secondary,
          equipment,
          movementPattern: movement,
          difficulty,
          goals: [goal],
          joints,
          instructions,
          formCues: generateFormCues(name, movement),
          commonMistakes: generateMistakes(name, movement),
          defaultSets: raw.sets || 3,
          defaultReps: raw.reps || (raw.duration ? raw.duration : '10-12'),
          defaultRestSeconds: typeof raw.rest === 'string' ? (parseInt(raw.rest, 10) || 60) * (raw.rest.includes('min') ? 60 : 1) : (raw.rest || 60),
          isActive: true,
          catalogVersion: '1.0.0',
          provenance: {
            source: 'in_house',
            license: 'CC-BY-4.0',
            attribution: 'Workout Planner Canonical Exercise Catalog',
            commercialUseAllowed: true,
          },
          media: [
            {
              id: `media-${slug}-1`,
              type: 'image',
              url: `/images/exercises/${slug}.svg`,
              posterUrl: `/images/exercises/${slug}-poster.jpg`,
              isLocal: true,
              provenance: {
                source: 'in_house',
                license: 'CC-BY-4.0',
                attribution: 'Workout Planner Core Design System',
                commercialUseAllowed: true,
              },
            },
          ],
        });
      }
    }
  }
}

// Generate alternatives for each exercise (e.g. same muscle/movement with different equipment)
const allExercises = Array.from(exercisesMap.values());
for (const ex of allExercises) {
  const alts = allExercises
    .filter((other) => other.slug !== ex.slug && (
      (other.primaryMuscles.some((m: string) => ex.primaryMuscles.includes(m)) && other.movementPattern === ex.movementPattern) ||
      (other.name.includes(ex.name.replace(/(Barbell|Dumbbell|Cable|Machine|Bodyweight)\s+/i, '')))
    ))
    .slice(0, 4)
    .map((other) => ({
      alternativeExerciseId: other.id,
      alternativeName: other.name,
      reason: other.equipment[0] !== ex.equipment[0] 
        ? `${other.equipment.join('/')} variation`
        : `Similar ${other.movementPattern} movement pattern for ${other.primaryMuscles[0]}`,
    }));

  ex.alternatives = alts;
}

const fileContent = `/**
 * Canonical Exercise Dataset
 * Autogenerated & normalized for Workout Planner Platform Phase 2F
 * Catalog Version: 1.0.0
 */

import { Exercise } from '@/types/domain';

export const CANONICAL_EXERCISES: Exercise[] = ${JSON.stringify(allExercises, null, 2)};
`;

fs.writeFileSync(path.resolve(__dirname, '../lib/data/canonical-exercises.ts'), fileContent, 'utf-8');
console.log('Successfully generated canonical-exercises.ts with', allExercises.length, 'exercises');
