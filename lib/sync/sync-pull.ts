/**
 * Sync Pull Engine
 * Incrementally pulls remote changes using sync_cursors, reconciles changes with dirty local records
 * using conflict resolution, applies updates to IndexedDB, and advances cursors only on full batch success.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { getIndexedDBEngine, IndexedDBEngine } from '../storage/indexeddb-engine';
import { STORES, StoreName, LocalRecordMeta } from '../storage/indexeddb-schema';
import { SyncCursorItem } from './sync-types';
import { SyncConflictResolver } from './sync-conflict';
import { SupabaseDomainMappers } from '../repositories/supabase/database.types';
import { getBrowserSupabaseClient } from '../supabase/browser-client';
import { ProgressInvalidationBus } from '../events/progress-invalidation-bus';

export interface PullResult {
  storeName: string;
  recordsPulled: number;
  conflictsDetected: number;
  cursorUpdated: boolean;
}

export class SyncPullWorker {
  private db: IndexedDBEngine;
  private supabaseClient: SupabaseClient;
  private conflictResolver: SyncConflictResolver;

  constructor(
    db?: IndexedDBEngine,
    supabaseClient?: SupabaseClient,
    conflictResolver?: SyncConflictResolver
  ) {
    this.db = db || getIndexedDBEngine();
    this.supabaseClient = supabaseClient || getBrowserSupabaseClient();
    this.conflictResolver = conflictResolver || new SyncConflictResolver(this.db);
  }

  /**
   * Retrieves the current remote cursor timestamp for a given store.
   */
  public async getCursor(storeName: string): Promise<string> {
    const record = await this.db.get<SyncCursorItem>(STORES.SYNC_CURSORS, storeName);
    return record?.lastRemoteCursor || new Date(0).toISOString();
  }

  /**
   * Updates the remote cursor timestamp for a store.
   */
  public async setCursor(storeName: string, cursor: string): Promise<void> {
    const record: SyncCursorItem = {
      storeName,
      lastRemoteCursor: cursor,
      updatedAt: new Date().toISOString(),
    };
    await this.db.put(STORES.SYNC_CURSORS, record);
  }

  /**
   * Pulls remote changes for a specific entity table.
   * Advances cursor ONLY if the entire batch successfully applies to IndexedDB.
   */
  public async pullStoreChanges(
    tableName:
      | 'workout_templates'
      | 'generated_workouts'
      | 'workout_sessions'
      | 'programs'
      | 'program_weeks'
      | 'program_days'
      | 'fitness_goals'
      | 'challenge_progress'
      | 'favorites',
    localStoreName: StoreName
  ): Promise<PullResult> {
    const cursor = await this.getCursor(tableName);
    const { data: sessionData } = await this.supabaseClient.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    if (!userId) {
      return { storeName: tableName, recordsPulled: 0, conflictsDetected: 0, cursorUpdated: false };
    }

    const { data: remoteRows, error } = await this.supabaseClient
      .from(tableName)
      .select('*')
      .eq('user_id', userId)
      .or(`updated_at.gt.${cursor},deleted_at.gt.${cursor}`)
      .order('updated_at', { ascending: true })
      .limit(100);

    if (error || !remoteRows || remoteRows.length === 0) {
      return { storeName: tableName, recordsPulled: 0, conflictsDetected: 0, cursorUpdated: false };
    }

    let conflictsDetected = 0;
    let maxRemoteTimestamp = cursor;

    // Apply entire batch atomically/sequentially
    for (const row of remoteRows as any[]) {
      const entityId = row.id || row.entity_id;
      const rowTimestamp = row.updated_at || row.deleted_at || new Date().toISOString();

      const localRecord = await this.db.get<LocalRecordMeta & Record<string, unknown>>(localStoreName, entityId);

      if (localRecord && localRecord.syncStatus && localRecord.syncStatus !== 'synced') {
        // Local record is dirty -> run conflict resolution with unwrapped domain payloads
        const remoteMapped = this.mapRemoteRowToLocal(tableName, row);
        const localDomain = (localRecord.program || localRecord.goal || localRecord.progress || localRecord.template || localRecord.session || localRecord) as Record<string, unknown>;
        const remoteDomain = (remoteMapped.program || remoteMapped.goal || remoteMapped.progress || remoteMapped.template || remoteMapped.session || remoteMapped) as Record<string, unknown>;

        const resolution = await this.conflictResolver.resolveConflict(
          tableName,
          entityId,
          localDomain,
          remoteDomain
        );

        if (resolution.resolved) {
          let rewrappedPayload: Record<string, unknown> = resolution.mergedPayload;
          if (tableName === 'programs') {
            rewrappedPayload = { program: resolution.mergedPayload };
          } else if (tableName === 'fitness_goals') {
            rewrappedPayload = { goal: resolution.mergedPayload };
          } else if (tableName === 'challenge_progress') {
            rewrappedPayload = { progress: resolution.mergedPayload };
          } else if (tableName === 'program_days') {
            rewrappedPayload = { programDay: resolution.mergedPayload };
          }

          await this.db.put(localStoreName, {
            ...localRecord,
            ...rewrappedPayload,
            syncStatus: 'synced',
            lastSyncedAt: new Date().toISOString(),
          });
        } else {
          conflictsDetected++;
        }
      } else {
        // Clean update or insert
        const mappedPayload = this.mapRemoteRowToLocal(tableName, row);
        const newRecord: LocalRecordMeta & Record<string, unknown> = {
          ...mappedPayload,
          id: entityId,
          ownerKind: 'user' as const,
          ownerId: userId,
          createdAt: row.created_at || new Date().toISOString(),
          updatedAt: row.updated_at || new Date().toISOString(),
          clientUpdatedAt: row.client_updated_at || row.updated_at || new Date().toISOString(),
          deletedAt: row.deleted_at || null,
          version: row.version || 1,
          syncStatus: 'synced',
          lastSyncedAt: new Date().toISOString(),
        };

        await this.db.put(localStoreName, newRecord);
      }

      if (new Date(rowTimestamp).getTime() > new Date(maxRemoteTimestamp).getTime()) {
        maxRemoteTimestamp = rowTimestamp;
      }
    }

    // Advance cursor now that the full batch succeeded
    await this.setCursor(tableName, maxRemoteTimestamp);

    if (tableName === 'workout_sessions') {
      ProgressInvalidationBus.getInstance().emit({
        type: 'sync_applied',
        timestamp: Date.now(),
      });
    } else if (tableName === 'programs' || tableName === 'program_weeks' || tableName === 'program_days') {
      ProgressInvalidationBus.getInstance().emit({
        type: 'program_changed',
        timestamp: Date.now(),
      });
    } else if (tableName === 'fitness_goals') {
      ProgressInvalidationBus.getInstance().emit({
        type: 'goal_changed',
        timestamp: Date.now(),
      });
    } else if (tableName === 'challenge_progress') {
      ProgressInvalidationBus.getInstance().emit({
        type: 'challenge_changed',
        timestamp: Date.now(),
      });
    }

    return {
      storeName: tableName,
      recordsPulled: remoteRows.length,
      conflictsDetected,
      cursorUpdated: true,
    };
  }

  private mapRemoteRowToLocal(tableName: string, row: any): Record<string, unknown> {
    switch (tableName) {
      case 'workout_templates':
        return { template: SupabaseDomainMappers.templateToDomain(row, []) };
      case 'generated_workouts':
        return { workout: SupabaseDomainMappers.generatedWorkoutToDomain(row, []) };
      case 'workout_sessions':
        return { session: SupabaseDomainMappers.sessionToDomain(row, []) };
      case 'programs':
        return {
          program: {
            id: row.id,
            userId: row.user_id,
            name: row.name,
            description: row.description,
            goal: row.goal,
            difficulty: row.difficulty,
            status: row.status,
            startDate: row.start_date,
            completedAt: row.completed_at,
            currentWeekNumber: row.current_week_number,
            currentDayNumber: row.current_day_number,
            isCustom: row.is_custom,
            weeks: [],
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          },
        };
      case 'program_weeks':
        return {
          programWeek: {
            id: row.id,
            programId: row.program_id,
            weekNumber: row.week_number,
            label: row.label,
            days: [],
          },
          programId: row.program_id,
          weekNumber: row.week_number,
        };
      case 'program_days':
        return {
          programDay: {
            id: row.id,
            programId: row.program_id,
            programWeekId: row.program_week_id,
            dayNumber: row.day_number,
            type: row.type,
            label: row.label,
            workoutTemplateId: row.workout_template_id,
            status: row.status,
            scheduledDate: row.scheduled_date,
            effectiveDate: row.effective_date,
            completedSessionId: row.completed_session_id,
            completedAt: row.completed_at,
            notes: row.notes,
          },
          programId: row.program_id,
          programWeekId: row.program_week_id,
          dayNumber: row.day_number,
          workoutTemplateId: row.workout_template_id,
          status: row.status,
        };
      case 'fitness_goals':
        return {
          goal: {
            id: row.id,
            userId: row.user_id,
            type: row.type,
            direction: row.direction,
            label: row.label,
            targetValue: Number(row.target_value),
            unit: row.unit,
            startValue: row.start_value ? Number(row.start_value) : undefined,
            startDate: row.start_date,
            targetDate: row.target_date,
            exerciseId: row.exercise_id,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          },
        };
      case 'challenge_progress':
        return {
          progress: {
            id: row.id,
            challengeId: row.challenge_id,
            userId: row.user_id,
            status: row.status,
            joinedAt: row.joined_at,
            completedAt: row.completed_at,
            updatedAt: row.updated_at,
          },
          challengeId: row.challenge_id,
        };
      case 'favorites':
        return { entityId: row.entity_id, entityType: row.entity_type };
      default:
        return row;
    }
  }
}
