/**
 * Canonical Anatomy Definitions & Mappings
 * 
 * Provides metadata, precomputed count cache, and catalog mapping for all interactive
 * muscle and joint regions.
 * Pure mapping layer — does not store exercises directly.
 */

import { AnatomyRegionDefinition, BodyView, AnatomyMode } from '@/types/domain';
import { ExerciseCatalog } from '@/lib/data/exercise-catalog';

export const ANATOMY_REGIONS: AnatomyRegionDefinition[] = [
  // ==========================================
  // FRONT VIEW — MUSCLE REGIONS (8 regions)
  // ==========================================
  {
    id: 'chest',
    label: 'Chest / Pectorals',
    type: 'muscle',
    view: 'front',
    side: 'bilateral',
    catalogMuscles: ['Chest'],
    relatedRegionIds: ['front_deltoids', 'triceps'],
    description: 'Pectoralis major and minor muscles responsible for pushing movements and humeral adduction.',
  },
  {
    id: 'front_deltoids',
    label: 'Front Shoulders',
    type: 'muscle',
    view: 'front',
    side: 'bilateral',
    catalogMuscles: ['Shoulders'],
    relatedRegionIds: ['chest', 'triceps'],
    description: 'Anterior and lateral deltoids responsible for shoulder flexion and arm elevation.',
  },
  {
    id: 'biceps',
    label: 'Biceps',
    type: 'muscle',
    view: 'front',
    side: 'bilateral',
    catalogMuscles: ['Biceps'],
    relatedRegionIds: ['forearms_front', 'lats'],
    description: 'Biceps brachii responsible for elbow flexion and forearm supination.',
  },
  {
    id: 'forearms_front',
    label: 'Forearms (Anterior)',
    type: 'muscle',
    view: 'front',
    side: 'bilateral',
    catalogMuscles: ['Forearms'],
    relatedRegionIds: ['biceps'],
    description: 'Wrist and finger flexors supporting grip and wrist stability.',
  },
  {
    id: 'abs',
    label: 'Abdominals / Core',
    type: 'muscle',
    view: 'front',
    side: 'center',
    catalogMuscles: ['Abs', 'Core'],
    relatedRegionIds: ['obliques'],
    description: 'Rectus abdominis and deep core stabilizers supporting trunk flexion and intra-abdominal pressure.',
  },
  {
    id: 'obliques',
    label: 'Obliques',
    type: 'muscle',
    view: 'front',
    side: 'bilateral',
    catalogMuscles: ['Obliques', 'Core', 'Abs'],
    relatedRegionIds: ['abs'],
    description: 'Internal and external obliques facilitating trunk rotation and lateral flexion.',
  },
  {
    id: 'quads',
    label: 'Quadriceps',
    type: 'muscle',
    view: 'front',
    side: 'bilateral',
    catalogMuscles: ['Quads'],
    relatedRegionIds: ['calves_front', 'glutes'],
    description: 'Rectus femoris and vastus muscles responsible for knee extension and hip flexion.',
  },
  {
    id: 'calves_front',
    label: 'Calves (Anterior / Tibialis)',
    type: 'muscle',
    view: 'front',
    side: 'bilateral',
    catalogMuscles: ['Calves'],
    relatedRegionIds: ['quads'],
    description: 'Anterior lower leg muscles responsible for ankle dorsiflexion and deceleration.',
  },

  // ==========================================
  // BACK VIEW — MUSCLE REGIONS (9 regions)
  // ==========================================
  {
    id: 'traps',
    label: 'Trapezius / Upper Back',
    type: 'muscle',
    view: 'back',
    side: 'bilateral',
    catalogMuscles: ['Traps', 'Upper Back', 'Back'],
    relatedRegionIds: ['rear_deltoids', 'lats'],
    description: 'Upper, middle, and lower trapezius supporting scapular elevation, retraction, and depression.',
  },
  {
    id: 'rear_deltoids',
    label: 'Rear Shoulders',
    type: 'muscle',
    view: 'back',
    side: 'bilateral',
    catalogMuscles: ['Shoulders'],
    relatedRegionIds: ['traps', 'lats'],
    description: 'Posterior deltoids facilitating horizontal abduction and shoulder extension.',
  },
  {
    id: 'triceps',
    label: 'Triceps',
    type: 'muscle',
    view: 'back',
    side: 'bilateral',
    catalogMuscles: ['Triceps'],
    relatedRegionIds: ['rear_deltoids', 'chest'],
    description: 'Triceps brachii (lateral, long, medial heads) extending the elbow.',
  },
  {
    id: 'forearms_back',
    label: 'Forearms (Posterior)',
    type: 'muscle',
    view: 'back',
    side: 'bilateral',
    catalogMuscles: ['Forearms'],
    relatedRegionIds: ['triceps'],
    description: 'Wrist and finger extensors supporting grip endurance and wrist extension.',
  },
  {
    id: 'lats',
    label: 'Lats (Latissimus Dorsi)',
    type: 'muscle',
    view: 'back',
    side: 'bilateral',
    catalogMuscles: ['Lats', 'Back'],
    relatedRegionIds: ['traps', 'biceps', 'lower_back'],
    description: 'Broad back muscles responsible for pulling the arms downward and backward.',
  },
  {
    id: 'lower_back',
    label: 'Lower Back (Erectors)',
    type: 'muscle',
    view: 'back',
    side: 'center',
    catalogMuscles: ['Lower Back', 'Back'],
    relatedRegionIds: ['glutes', 'hamstrings'],
    description: 'Erector spinae muscles providing spinal extension and posterior chain stability.',
  },
  {
    id: 'glutes',
    label: 'Glutes',
    type: 'muscle',
    view: 'back',
    side: 'bilateral',
    catalogMuscles: ['Glutes'],
    relatedRegionIds: ['hamstrings', 'lower_back', 'quads'],
    description: 'Gluteus maximus and medius muscles extending the hip and stabilizing the pelvis.',
  },
  {
    id: 'hamstrings',
    label: 'Hamstrings',
    type: 'muscle',
    view: 'back',
    side: 'bilateral',
    catalogMuscles: ['Hamstrings'],
    relatedRegionIds: ['glutes', 'calves_back'],
    description: 'Biceps femoris, semitendinosus, and semimembranosus flexing the knee and extending the hip.',
  },
  {
    id: 'calves_back',
    label: 'Calves (Gastrocnemius & Soleus)',
    type: 'muscle',
    view: 'back',
    side: 'bilateral',
    catalogMuscles: ['Calves'],
    relatedRegionIds: ['hamstrings'],
    description: 'Posterior lower leg muscles responsible for plantar flexion and propulsion.',
  },

  // ==========================================
  // FRONT VIEW — JOINT REGIONS (13 regions)
  // ==========================================
  {
    id: 'shoulder_left',
    label: 'Left Shoulder',
    type: 'joint',
    view: 'front',
    side: 'left',
    catalogJoints: ['shoulders'],
    description: 'Glenohumeral and scapulothoracic joint complex involved in pressing and pulling.',
  },
  {
    id: 'shoulder_right',
    label: 'Right Shoulder',
    type: 'joint',
    view: 'front',
    side: 'right',
    catalogJoints: ['shoulders'],
    description: 'Glenohumeral and scapulothoracic joint complex involved in pressing and pulling.',
  },
  {
    id: 'elbow_left',
    label: 'Left Elbow',
    type: 'joint',
    view: 'front',
    side: 'left',
    catalogJoints: ['elbows'],
    description: 'Humeroulnar and humeroradial hinge joint involved in arms and compound movements.',
  },
  {
    id: 'elbow_right',
    label: 'Right Elbow',
    type: 'joint',
    view: 'front',
    side: 'right',
    catalogJoints: ['elbows'],
    description: 'Humeroulnar and humeroradial hinge joint involved in arms and compound movements.',
  },
  {
    id: 'wrist_left',
    label: 'Left Wrist',
    type: 'joint',
    view: 'front',
    side: 'left',
    catalogJoints: ['wrists'],
    description: 'Radiocarpal joint complex supporting grip load and wrist articulation.',
  },
  {
    id: 'wrist_right',
    label: 'Right Wrist',
    type: 'joint',
    view: 'front',
    side: 'right',
    catalogJoints: ['wrists'],
    description: 'Radiocarpal joint complex supporting grip load and wrist articulation.',
  },
  {
    id: 'spine_neck',
    label: 'Cervical Spine / Neck',
    type: 'joint',
    view: 'front',
    side: 'center',
    catalogJoints: ['spine'],
    description: 'Upper spinal column supporting head alignment and posture.',
  },
  {
    id: 'hip_left',
    label: 'Left Hip',
    type: 'joint',
    view: 'front',
    side: 'left',
    catalogJoints: ['hips'],
    description: 'Acetabulofemoral ball-and-socket joint supporting squatting and hinge dynamics.',
  },
  {
    id: 'hip_right',
    label: 'Right Hip',
    type: 'joint',
    view: 'front',
    side: 'right',
    catalogJoints: ['hips'],
    description: 'Acetabulofemoral ball-and-socket joint supporting squatting and hinge dynamics.',
  },
  {
    id: 'knee_left',
    label: 'Left Knee',
    type: 'joint',
    view: 'front',
    side: 'left',
    catalogJoints: ['knees'],
    description: 'Tibiofemoral and patellofemoral hinge joint involved in knee flexion and extension.',
  },
  {
    id: 'knee_right',
    label: 'Right Knee',
    type: 'joint',
    view: 'front',
    side: 'right',
    catalogJoints: ['knees'],
    description: 'Tibiofemoral and patellofemoral hinge joint involved in knee flexion and extension.',
  },
  {
    id: 'ankle_left',
    label: 'Left Ankle',
    type: 'joint',
    view: 'front',
    side: 'left',
    catalogJoints: ['ankles'],
    description: 'Talocrural joint responsible for plantarflexion and dorsiflexion.',
  },
  {
    id: 'ankle_right',
    label: 'Right Ankle',
    type: 'joint',
    view: 'front',
    side: 'right',
    catalogJoints: ['ankles'],
    description: 'Talocrural joint responsible for plantarflexion and dorsiflexion.',
  },

  // ==========================================
  // BACK VIEW — JOINT REGIONS (10 regions)
  // ==========================================
  {
    id: 'spine_thoracic',
    label: 'Thoracic Spine',
    type: 'joint',
    view: 'back',
    side: 'center',
    catalogJoints: ['spine'],
    description: 'Mid-back spinal segment providing rotational mobility and ribcage stability.',
  },
  {
    id: 'spine_lumbar',
    label: 'Lumbar Spine',
    type: 'joint',
    view: 'back',
    side: 'center',
    catalogJoints: ['spine'],
    description: 'Lower spinal segment bearing axial load in squats, deadlifts, and carries.',
  },
  {
    id: 'shoulder_left_back',
    label: 'Left Scapula / Shoulder',
    type: 'joint',
    view: 'back',
    side: 'left',
    catalogJoints: ['shoulders'],
    description: 'Posterior shoulder and scapulothoracic articulation.',
  },
  {
    id: 'shoulder_right_back',
    label: 'Right Scapula / Shoulder',
    type: 'joint',
    view: 'back',
    side: 'right',
    catalogJoints: ['shoulders'],
    description: 'Posterior shoulder and scapulothoracic articulation.',
  },
  {
    id: 'elbow_left_back',
    label: 'Left Elbow (Posterior)',
    type: 'joint',
    view: 'back',
    side: 'left',
    catalogJoints: ['elbows'],
    description: 'Posterior elbow olecranon involved in extensions and pulls.',
  },
  {
    id: 'elbow_right_back',
    label: 'Right Elbow (Posterior)',
    type: 'joint',
    view: 'back',
    side: 'right',
    catalogJoints: ['elbows'],
    description: 'Posterior elbow olecranon involved in extensions and pulls.',
  },
  {
    id: 'knee_left_back',
    label: 'Left Knee (Popliteal)',
    type: 'joint',
    view: 'back',
    side: 'left',
    catalogJoints: ['knees'],
    description: 'Posterior knee articulation involved in hamstring curls and squats.',
  },
  {
    id: 'knee_right_back',
    label: 'Right Knee (Popliteal)',
    type: 'joint',
    view: 'back',
    side: 'right',
    catalogJoints: ['knees'],
    description: 'Posterior knee articulation involved in hamstring curls and squats.',
  },
  {
    id: 'ankle_left_back',
    label: 'Left Achilles / Ankle',
    type: 'joint',
    view: 'back',
    side: 'left',
    catalogJoints: ['ankles'],
    description: 'Posterior ankle complex and Achilles tendon articulation.',
  },
  {
    id: 'ankle_right_back',
    label: 'Right Achilles / Ankle',
    type: 'joint',
    view: 'back',
    side: 'right',
    catalogJoints: ['ankles'],
    description: 'Posterior ankle complex and Achilles tendon articulation.',
  },
];

export function getRegionsByViewAndMode(view: BodyView, mode: AnatomyMode): AnatomyRegionDefinition[] {
  return ANATOMY_REGIONS.filter((r) => r.view === view && r.type === mode);
}

export function getRegionById(id: string): AnatomyRegionDefinition | undefined {
  return ANATOMY_REGIONS.find((r) => r.id === id);
}

export function findRelatedRegions(regionId: string): AnatomyRegionDefinition[] {
  const region = getRegionById(regionId);
  if (!region || !region.relatedRegionIds) return [];
  return region.relatedRegionIds
    .map((id) => getRegionById(id))
    .filter((r): r is AnatomyRegionDefinition => r !== undefined);
}

// Precomputed exercise counts cache to avoid catalog queries on every hover/pointer move
const PRECOMPUTED_REGION_COUNTS: Map<string, number> = new Map();

export function getRegionExerciseCount(region: AnatomyRegionDefinition | null): number {
  if (!region) return 0;
  if (PRECOMPUTED_REGION_COUNTS.has(region.id)) {
    return PRECOMPUTED_REGION_COUNTS.get(region.id)!;
  }

  let count = 0;
  if (region.type === 'muscle' && region.catalogMuscles) {
    count = ExerciseCatalog.queryExercises({ muscles: region.catalogMuscles }).totalCount;
  } else if (region.type === 'joint' && region.catalogJoints) {
    count = ExerciseCatalog.queryExercises({ joints: region.catalogJoints }).totalCount;
  }

  PRECOMPUTED_REGION_COUNTS.set(region.id, count);
  return count;
}
