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
    tableName: 'workout_templates' | 'generated_workouts' | 'workout_sessions' | 'favorites',
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
        // Local record is dirty -> run conflict resolution
        const resolution = await this.conflictResolver.resolveConflict(
          tableName,
          entityId,
          localRecord,
          row
        );

        conflictsDetected++;
        const finalRecord = {
          ...resolution.mergedPayload,
          id: entityId,
          ownerKind: 'user' as const,
          ownerId: userId,
          syncStatus: resolution.resolved ? 'synced' : 'conflict',
          lastSyncedAt: new Date().toISOString(),
          version: (row.version as number) || (localRecord.version as number) || 1,
        };

        await this.db.put(localStoreName, finalRecord);
      } else {
        // Clean local or new record -> apply remote record directly
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
      ProgressInvalidationBus.getInstance().emit('sync_applied');
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
      case 'favorites':
        return { entityId: row.entity_id, entityType: row.entity_type };
      default:
        return row;
    }
  }
}
