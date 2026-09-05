/**
 * Canonical Exercise Media Resolver
 *
 * Implements deterministic media resolution hierarchy according to Section 3:
 * 1. GIF / animation demonstration
 * 2. Video + poster
 * 3. SVG illustration
 * 4. Static image
 * 5. thumbnailUrl
 * 6. mediaUrl
 * 7. neutral fallback
 */

import { Exercise, ExerciseMedia as DomainExerciseMedia } from '@/types/domain';

export type ExerciseMediaContext = 'card' | 'detail' | 'picker' | 'session';

export interface ResolvedCandidate {
  id: string;
  url: string;
  type: 'animation' | 'video' | 'svg' | 'image';
  posterUrl?: string;
  license?: string;
}

export const VALID_MEDIA_TYPES = new Set(['image', 'video', 'gif', 'svg', 'animation']);

/**
 * Validates whether a candidate URL is non-empty and well-formed
 */
export function isValidUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  return (
    trimmed.startsWith('/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/')
  );
}

/**
 * Extracts and sorts valid media candidates in priority order according to Requirement 3:
 * 1. GIF / animation demonstration
 * 2. Video + poster
 * 3. SVG illustration
 * 4. Static image
 * 5. thumbnailUrl
 * 6. mediaUrl
 */
export function resolveMediaCandidates(
  exercise: Exercise,
  context: ExerciseMediaContext = 'card'
): ResolvedCandidate[] {
  const candidates: ResolvedCandidate[] = [];
  const rawList: DomainExerciseMedia[] = Array.isArray(exercise.media) ? exercise.media : [];

  // Categorized buckets
  const animations: ResolvedCandidate[] = [];
  const videos: ResolvedCandidate[] = [];
  const svgs: ResolvedCandidate[] = [];
  const images: ResolvedCandidate[] = [];

  for (const item of rawList) {
    if (!item || !isValidUrl(item.url)) continue;
    if (!item.type || !VALID_MEDIA_TYPES.has(item.type)) continue;

    const license = item.provenance?.license || exercise.provenance?.license;
    const isSvg = item.type === 'svg' || item.url.toLowerCase().endsWith('.svg');

    if (item.type === 'gif' || item.type === 'animation') {
      animations.push({
        id: item.id || `anim-${item.url}`,
        url: item.url,
        type: 'animation',
        posterUrl: item.posterUrl,
        license,
      });
    } else if (item.type === 'video') {
      videos.push({
        id: item.id || `video-${item.url}`,
        url: item.url,
        type: 'video',
        posterUrl: item.posterUrl,
        license,
      });
    } else if (isSvg) {
      svgs.push({
        id: item.id || `svg-${item.url}`,
        url: item.url,
        type: 'svg',
        posterUrl: item.posterUrl,
        license,
      });
    } else {
      images.push({
        id: item.id || `img-${item.url}`,
        url: item.url,
        type: 'image',
        posterUrl: item.posterUrl,
        license,
      });
    }
  }

  // Hierarchy prioritization
  // For cards: lightweight SVG/static/poster first to avoid eager downloading of hundreds of animations,
  // then animations if no static media is present.
  // For detail & session: full animation demonstration first.
  if (context === 'card' || context === 'picker') {
    if (svgs.length > 0) {
      candidates.push(...svgs);
      candidates.push(...images);
      candidates.push(...animations);
      candidates.push(...videos);
    } else if (images.length > 0) {
      candidates.push(...images);
      candidates.push(...svgs);
      candidates.push(...animations);
      candidates.push(...videos);
    } else {
      candidates.push(...animations);
      candidates.push(...videos);
      candidates.push(...svgs);
      candidates.push(...images);
    }
  } else {
    // Detail / Session context: full demonstration priority
    candidates.push(...animations);
    candidates.push(...videos);
    candidates.push(...svgs);
    candidates.push(...images);
  }

  // Fallback 5: thumbnailUrl
  if (isValidUrl(exercise.thumbnailUrl)) {
    candidates.push({
      id: `thumb-${exercise.id}`,
      url: exercise.thumbnailUrl,
      type: exercise.thumbnailUrl.toLowerCase().endsWith('.svg') ? 'svg' : 'image',
      license: exercise.provenance?.license,
    });
  }

  // Fallback 6: mediaUrl
  if (isValidUrl(exercise.mediaUrl)) {
    candidates.push({
      id: `mediaurl-${exercise.id}`,
      url: exercise.mediaUrl,
      type: exercise.mediaUrl.toLowerCase().endsWith('.svg') ? 'svg' : 'image',
      license: exercise.provenance?.license,
    });
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  const uniqueCandidates: ResolvedCandidate[] = [];
  for (const c of candidates) {
    if (!seen.has(c.url)) {
      seen.add(c.url);
      uniqueCandidates.push(c);
    }
  }

  return uniqueCandidates;
}

/**
 * Resolves the active candidate that has not failed, or returns null if all failed
 */
export function resolveActiveCandidate(
  candidates: ResolvedCandidate[],
  failedUrls: Set<string>
): ResolvedCandidate | null {
  return candidates.find((c) => !failedUrls.has(c.url)) || null;
}
