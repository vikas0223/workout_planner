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
  isApproved?: boolean;
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
export function isLocalUrl(url: string): boolean {
  return !url.startsWith('http://') && !url.startsWith('https://');
}

/**
 * Extracts and sorts valid media candidates in priority order according to Section 20:
 * 1. approved local animated media
 * 2. approved local video
 * 3. approved local SVG
 * 4. approved local static image
 * 5. approved permitted remote media
 * 6. thumbnail
 * 7. mediaUrl
 * 8. fallback
 *
 * Automatically excludes:
 * - referenceOnly = true
 * - identity = unverified
 * - rights = unverified or restricted
 * - asset = broken
 */
export function resolveMediaCandidates(
  exercise: Exercise,
  context: ExerciseMediaContext = 'card'
): ResolvedCandidate[] {
  const candidates: ResolvedCandidate[] = [];
  const rawList: DomainExerciseMedia[] = Array.isArray(exercise.media) ? exercise.media : [];

  // Categorized buckets for approved media
  const localAnimations: ResolvedCandidate[] = [];
  const localVideos: ResolvedCandidate[] = [];
  const localSvgs: ResolvedCandidate[] = [];
  const localImages: ResolvedCandidate[] = [];
  const remoteApproved: ResolvedCandidate[] = [];

  for (const item of rawList) {
    if (!item || !isValidUrl(item.url)) continue;
    if (!item.type || !VALID_MEDIA_TYPES.has(item.type)) continue;

    // Filter out unapproved or reference-only media per Section 20
    if (item.provenance) {
      if (item.provenance.referenceOnly) continue;
      if (item.provenance.verification) {
        if (item.provenance.verification.identity === 'unverified') continue;
        if (
          item.provenance.verification.rights === 'unverified' ||
          item.provenance.verification.rights === 'restricted'
        ) {
          continue;
        }
        if (item.provenance.verification.asset === 'broken') continue;
      }
    }

    const license = item.provenance?.license || exercise.provenance?.license;
    const isSvg = item.type === 'svg' || item.url.toLowerCase().endsWith('.svg');
    const isLocal = item.isLocal ?? isLocalUrl(item.url);

    const candidate: ResolvedCandidate = {
      id: item.id || `m-${item.url}`,
      url: item.url,
      type: (item.type === 'gif' || item.type === 'animation')
        ? 'animation'
        : item.type === 'video'
        ? 'video'
        : isSvg
        ? 'svg'
        : 'image',
      posterUrl: item.posterUrl,
      license,
      isApproved: true,
    };

    if (!isLocal) {
      remoteApproved.push(candidate);
    } else if (candidate.type === 'animation') {
      localAnimations.push(candidate);
    } else if (candidate.type === 'video') {
      localVideos.push(candidate);
    } else if (candidate.type === 'svg') {
      localSvgs.push(candidate);
    } else {
      localImages.push(candidate);
    }
  }

  // Hierarchy prioritization
  // For cards & pickers: lightweight local SVG/static image first to prevent 24 cards from downloading heavy GIFs (Section 17 & 21)
  // For detail & session: full demonstration (animated/video) first
  if (context === 'card' || context === 'picker') {
    if (localSvgs.length > 0 || localImages.length > 0) {
      candidates.push(...localSvgs);
      candidates.push(...localImages);
      candidates.push(...localAnimations);
      candidates.push(...localVideos);
    } else {
      candidates.push(...localAnimations);
      candidates.push(...localVideos);
      candidates.push(...localSvgs);
      candidates.push(...localImages);
    }
  } else {
    // Detail / Session context: full demonstration priority
    candidates.push(...localAnimations);
    candidates.push(...localVideos);
    candidates.push(...localSvgs);
    candidates.push(...localImages);
  }

  // Remote approved media after local approved media
  candidates.push(...remoteApproved);

  // Fallback 6: thumbnailUrl
  if (isValidUrl(exercise.thumbnailUrl)) {
    candidates.push({
      id: `thumb-${exercise.id}`,
      url: exercise.thumbnailUrl,
      type: exercise.thumbnailUrl.toLowerCase().endsWith('.svg') ? 'svg' : 'image',
      license: exercise.provenance?.license,
      isApproved: false,
    });
  }

  // Fallback 7: mediaUrl
  if (isValidUrl(exercise.mediaUrl)) {
    candidates.push({
      id: `mediaurl-${exercise.id}`,
      url: exercise.mediaUrl,
      type: exercise.mediaUrl.toLowerCase().endsWith('.svg') ? 'svg' : 'image',
      license: exercise.provenance?.license,
      isApproved: false,
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
 * Resolves only approved media candidates (excluding loose thumbnailUrl/mediaUrl fallbacks)
 */
export function resolveApprovedMediaCandidates(
  exercise: Exercise,
  context: ExerciseMediaContext = 'card'
): ResolvedCandidate[] {
  return resolveMediaCandidates(exercise, context).filter((c) => c.isApproved === true);
}

/**
 * Shared approved-media predicate checking if an exercise possesses at least one qualified approved asset
 */
export function hasApprovedMedia(exercise: Exercise): boolean {
  return resolveApprovedMediaCandidates(exercise).length > 0;
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
