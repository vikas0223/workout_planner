/**
 * Sync Conflict Detection & Resolution Engine
 * Implements entity-specific conflict rules and preserves unresolvable conflicts in sync_conflicts.
 */

import { getIndexedDBEngine, IndexedDBEngine } from '../storage/indexeddb-engine';
import { STORES } from '../storage/indexeddb-schema';
import { SyncConflictItem } from './sync-types';
import { SessionStatus, SessionExerciseStatus } from '@/types/domain';

export interface ConflictResolutionResult {
  resolved: boolean;
  mergedPayload: Record<string, unknown>;
  conflictItem?: SyncConflictItem;
  strategy: 'merged' | 'local_kept' | 'remote_kept' | 'manual_required';
}

export class SyncConflictResolver {
  private db: IndexedDBEngine;

  constructor(db?: IndexedDBEngine) {
    this.db = db || getIndexedDBEngine();
  }

  /**
   * Resolves conflicts between a local dirty record and a remote updated record.
   */
  public async resolveConflict(
    entityType: string,
    entityId: string,
    localPayload: Record<string, unknown>,
    remotePayload: Record<string, unknown>
  ): Promise<ConflictResolutionResult> {
    let result: ConflictResolutionResult;

    switch (entityType) {
      case 'workout_templates':
        result = this.resolveTemplateConflict(localPayload, remotePayload);
        break;
      case 'workout_sessions':
        result = this.resolveSessionConflict(localPayload, remotePayload);
        break;
      case 'session_exercises':
        result = this.resolveSessionExerciseConflict(localPayload, remotePayload);
        break;
      case 'programs':
        result = this.resolveProgramConflict(localPayload, remotePayload);
        break;
      case 'program_days':
        result = this.resolveProgramDayConflict(localPayload, remotePayload);
        break;
      case 'fitness_goals':
        result = this.resolveGoalConflict(localPayload, remotePayload);
        break;
      case 'challenge_progress':
        result = this.resolveChallengeProgressConflict(localPayload, remotePayload);
        break;
      case 'logged_sets':
      case 'sets':
        result = this.resolveSetConflict(localPayload, remotePayload);
        break;
      case 'generated_workouts':
      case 'generated_workout_exercises':
        result = this.resolveImmutableConflict(localPayload, remotePayload, entityType);
        break;
      default:
        result = this.resolveDefaultLastWriterWins(localPayload, remotePayload);
        break;
    }

    // If an unresolved or merged conflict was detected, persist a copy in sync_conflicts
    const conflictItem: SyncConflictItem = {
      id: `conflict-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      entityType,
      entityId,
      localPayload,
      remotePayload,
      reason: result.strategy === 'merged' ? 'Field-level auto merge' : 'Version/payload divergence',
      resolved: result.resolved,
      resolutionStatus: result.strategy,
      createdAt: new Date().toISOString(),
      resolvedAt: result.resolved ? new Date().toISOString() : null,
    };

    await this.db.put(STORES.SYNC_CONFLICTS, conflictItem);
    result.conflictItem = conflictItem;
    return result;
  }

  private resolveTemplateConflict(
    local: Record<string, unknown>,
    remote: Record<string, unknown>
  ): ConflictResolutionResult {
    const localUpdatedAt = new Date((local.updatedAt as string) || 0).getTime();
    const remoteUpdatedAt = new Date((remote.updatedAt as string) || 0).getTime();

    const base = localUpdatedAt >= remoteUpdatedAt ? { ...remote, ...local } : { ...local, ...remote };
    // Favorite boolean OR-merge: if favorited anywhere, keep favorited
    const isFavorite = Boolean(local.isFavorite || remote.isFavorite);

    return {
      resolved: true,
      mergedPayload: { ...base, isFavorite },
      strategy: 'merged',
    };
  }

  private resolveSessionConflict(
    local: Record<string, unknown>,
    remote: Record<string, unknown>
  ): ConflictResolutionResult {
    const statusPrecedence: Record<SessionStatus, number> = {
      completed: 4,
      active: 3,
      planned: 2,
      abandoned: 1,
    };

    const localStatus = (local.status as SessionStatus) || 'planned';
    const remoteStatus = (remote.status as SessionStatus) || 'planned';

    const localScore = statusPrecedence[localStatus] || 0;
    const remoteScore = statusPrecedence[remoteStatus] || 0;

    if (localScore > remoteScore) {
      return { resolved: true, mergedPayload: local, strategy: 'local_kept' };
    } else if (remoteScore > localScore) {
      return { resolved: true, mergedPayload: remote, strategy: 'remote_kept' };
    }

    // Tie-breaker: latest clientUpdatedAt
    const localTime = new Date((local.clientUpdatedAt || local.updatedAt) as string || 0).getTime();
    const remoteTime = new Date((remote.clientUpdatedAt || remote.updatedAt) as string || 0).getTime();

    return {
      resolved: true,
      mergedPayload: localTime >= remoteTime ? local : remote,
      strategy: localTime >= remoteTime ? 'local_kept' : 'remote_kept',
    };
  }

  private resolveSessionExerciseConflict(
    local: Record<string, unknown>,
    remote: Record<string, unknown>
  ): ConflictResolutionResult {
    const localStatus = local.status as SessionExerciseStatus;
    const remoteStatus = remote.status as SessionExerciseStatus;

    if (localStatus === 'completed' && remoteStatus === 'pending') {
      return { resolved: true, mergedPayload: local, strategy: 'local_kept' };
    }
    if (remoteStatus === 'completed' && localStatus === 'pending') {
      return { resolved: true, mergedPayload: remote, strategy: 'remote_kept' };
    }

    // Incompatible completed vs skipped/substituted
    if (
      (localStatus === 'completed' && (remoteStatus === 'skipped' || remoteStatus === 'substituted')) ||
      (remoteStatus === 'completed' && (localStatus === 'skipped' || localStatus === 'substituted'))
    ) {
      return {
        resolved: false,
        mergedPayload: local,
        strategy: 'manual_required',
      };
    }

    return this.resolveDefaultLastWriterWins(local, remote);
  }

  private resolveSetConflict(
    local: Record<string, unknown>,
    remote: Record<string, unknown>
  ): ConflictResolutionResult {
    // Check for disjoint field modification
    const keys = new Set([...Object.keys(local), ...Object.keys(remote)]);
    const merged: Record<string, unknown> = {};
    let hasOverlappingConflict = false;

    for (const key of keys) {
      const localVal = local[key];
      const remoteVal = remote[key];

      if (
        key !== 'version' &&
        key !== 'updatedAt' &&
        key !== 'clientUpdatedAt' &&
        key !== 'syncStatus' &&
        localVal !== undefined &&
        remoteVal !== undefined &&
        localVal !== remoteVal
      ) {
        hasOverlappingConflict = true;
        break;
      }

      if (localVal !== undefined && remoteVal !== undefined) {
        merged[key] = localVal;
      } else if (localVal !== undefined) {
        merged[key] = localVal;
      } else if (remoteVal !== undefined) {
        merged[key] = remoteVal;
      }
    }

    if (!hasOverlappingConflict) {
      return { resolved: true, mergedPayload: merged, strategy: 'merged' };
    }

    // Overlapping values in set fields (e.g. 45kg vs 47.5kg)
    const localVersion = (local.version as number) || 1;
    const remoteVersion = (remote.version as number) || 1;

    if (localVersion !== remoteVersion) {
      const winner = localVersion > remoteVersion ? local : remote;
      return {
        resolved: true,
        mergedPayload: winner,
        strategy: localVersion > remoteVersion ? 'local_kept' : 'remote_kept',
      };
    }

    // Same version conflict: preserve conflict record and take latest client timestamp
    const localTime = new Date((local.clientUpdatedAt || local.updatedAt) as string || 0).getTime();
    const remoteTime = new Date((remote.clientUpdatedAt || remote.updatedAt) as string || 0).getTime();
    const winner = localTime >= remoteTime ? local : remote;

    return {
      resolved: false, // Flag as conflict requiring attention while keeping non-destructive state
      mergedPayload: winner,
      strategy: 'manual_required',
    };
  }

  private resolveImmutableConflict(
    local: Record<string, unknown>,
    remote: Record<string, unknown>,
    entityType: string
  ): ConflictResolutionResult {
    // Generated workouts and exercise prescriptions are deterministic and immutable
    return {
      resolved: false,
      mergedPayload: local,
      strategy: 'manual_required',
    };
  }

  private resolveProgramConflict(
    local: Record<string, unknown>,
    remote: Record<string, unknown>
  ): ConflictResolutionResult {
    const statusPrecedence: Record<string, number> = {
      completed: 5,
      active: 4,
      paused: 3,
      draft: 2,
      archived: 1,
    };

    const localStatus = (local.status as string) || 'draft';
    const remoteStatus = (remote.status as string) || 'draft';
    const winningStatus =
      (statusPrecedence[localStatus] || 0) >= (statusPrecedence[remoteStatus] || 0)
        ? localStatus
        : remoteStatus;

    const localUpdatedAt = new Date((local.updatedAt as string) || 0).getTime();
    const remoteUpdatedAt = new Date((remote.updatedAt as string) || 0).getTime();
    const base = localUpdatedAt >= remoteUpdatedAt ? { ...remote, ...local } : { ...local, ...remote };

    return {
      resolved: true,
      mergedPayload: {
        ...base,
        status: winningStatus,
      },
      strategy: 'merged',
    };
  }

  private resolveProgramDayConflict(
    local: Record<string, unknown>,
    remote: Record<string, unknown>
  ): ConflictResolutionResult {
    const statusPrecedence: Record<string, number> = {
      completed: 4,
      rescheduled: 3,
      skipped: 2,
      planned: 1,
    };

    const localStatus = (local.status as string) || 'planned';
    const remoteStatus = (remote.status as string) || 'planned';
    const winningStatus =
      (statusPrecedence[localStatus] || 0) >= (statusPrecedence[remoteStatus] || 0)
        ? localStatus
        : remoteStatus;

    const completedSessionId =
      local.completedSessionId || remote.completedSessionId || undefined;
    const completedAt = local.completedAt || remote.completedAt || undefined;
    const workoutTemplateId =
      local.workoutTemplateId || remote.workoutTemplateId || undefined;

    const localUpdatedAt = new Date((local.updatedAt as string) || 0).getTime();
    const remoteUpdatedAt = new Date((remote.updatedAt as string) || 0).getTime();
    const base = localUpdatedAt >= remoteUpdatedAt ? { ...remote, ...local } : { ...local, ...remote };

    return {
      resolved: true,
      mergedPayload: {
        ...base,
        status: winningStatus,
        completedSessionId,
        completedAt,
        workoutTemplateId,
      },
      strategy: 'merged',
    };
  }

  private resolveGoalConflict(
    local: Record<string, unknown>,
    remote: Record<string, unknown>
  ): ConflictResolutionResult {
    const statusPrecedence: Record<string, number> = {
      completed: 3,
      active: 2,
      abandoned: 1,
    };

    const localStatus = (local.status as string) || 'active';
    const remoteStatus = (remote.status as string) || 'active';
    const winningStatus =
      (statusPrecedence[localStatus] || 0) >= (statusPrecedence[remoteStatus] || 0)
        ? localStatus
        : remoteStatus;

    const localUpdatedAt = new Date((local.updatedAt as string) || 0).getTime();
    const remoteUpdatedAt = new Date((remote.updatedAt as string) || 0).getTime();
    const base = localUpdatedAt >= remoteUpdatedAt ? { ...remote, ...local } : { ...local, ...remote };

    return {
      resolved: true,
      mergedPayload: {
        ...base,
        status: winningStatus,
      },
      strategy: 'merged',
    };
  }

  private resolveChallengeProgressConflict(
    local: Record<string, unknown>,
    remote: Record<string, unknown>
  ): ConflictResolutionResult {
    const statusPrecedence: Record<string, number> = {
      completed: 3,
      active: 2,
      abandoned: 1,
    };

    const localStatus = (local.status as string) || 'active';
    const remoteStatus = (remote.status as string) || 'active';
    const winningStatus =
      (statusPrecedence[localStatus] || 0) >= (statusPrecedence[remoteStatus] || 0)
        ? localStatus
        : remoteStatus;

    // Preserve earliest joinedAt
    const localJoined = new Date((local.joinedAt as string) || Date.now()).getTime();
    const remoteJoined = new Date((remote.joinedAt as string) || Date.now()).getTime();
    const winningJoinedAt = localJoined <= remoteJoined ? local.joinedAt : remote.joinedAt;

    const completedAt = local.completedAt || remote.completedAt || undefined;

    return {
      resolved: true,
      mergedPayload: {
        ...local,
        ...remote,
        status: winningStatus,
        joinedAt: winningJoinedAt,
        completedAt,
      },
      strategy: 'merged',
    };
  }

  private resolveDefaultLastWriterWins(
    local: Record<string, unknown>,
    remote: Record<string, unknown>
  ): ConflictResolutionResult {
    const localTime = new Date((local.updatedAt || local.clientUpdatedAt) as string || 0).getTime();
    const remoteTime = new Date((remote.updatedAt || remote.clientUpdatedAt) as string || 0).getTime();

    return {
      resolved: true,
      mergedPayload: localTime >= remoteTime ? local : remote,
      strategy: localTime >= remoteTime ? 'local_kept' : 'remote_kept',
    };
  }
}
