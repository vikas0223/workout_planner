/**
 * Sync Push Engine
 * Processes pending sync queue items in dependency-aware order, enforces idempotency,
 * dispatches cloud mutations to Supabase repositories, and handles exponential retry/dead-lettering.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { getIndexedDBEngine, IndexedDBEngine } from '../storage/indexeddb-engine';
import { STORES, StoreName, LocalRecordMeta } from '../storage/indexeddb-schema';
import { SyncLock } from './sync-lock';
import { SyncOutbox } from './sync-outbox';
import { SyncQueueItem } from './sync-types';
import {
  SupabaseUserRepository,
  SupabaseWorkoutRepository,
  SupabaseCompletionRepository,
  SupabaseFavoritesRepository,
} from '../repositories/supabase';
import { getBrowserSupabaseClient } from '../supabase/browser-client';

export interface PushResult {
  processedCount: number;
  succeededCount: number;
  failedCount: number;
  deadCount: number;
}

export class SyncPushWorker {
  private db: IndexedDBEngine;
  private lock: SyncLock;
  private outbox: SyncOutbox;
  private supabaseClient: SupabaseClient;

  private userRepo: SupabaseUserRepository;
  private workoutRepo: SupabaseWorkoutRepository;
  private completionRepo: SupabaseCompletionRepository;
  private favoritesRepo: SupabaseFavoritesRepository;

  constructor(
    db?: IndexedDBEngine,
    lock?: SyncLock,
    outbox?: SyncOutbox,
    supabaseClient?: SupabaseClient
  ) {
    this.db = db || getIndexedDBEngine();
    this.lock = lock || new SyncLock(this.db);
    this.outbox = outbox || new SyncOutbox(this.db);
    this.supabaseClient = supabaseClient || getBrowserSupabaseClient();

    this.userRepo = new SupabaseUserRepository(this.supabaseClient);
    this.workoutRepo = new SupabaseWorkoutRepository(this.supabaseClient);
    this.completionRepo = new SupabaseCompletionRepository(this.supabaseClient);
    this.favoritesRepo = new SupabaseFavoritesRepository(this.supabaseClient);
  }

  /**
   * Sorts queue items according to parent-before-child dependency order.
   */
  public sortItemsByDependency(items: SyncQueueItem[]): SyncQueueItem[] {
    const dependencyTiers: Record<string, number> = {
      profiles: 1,
      local_profiles: 1,
      workout_templates: 2,
      generated_workouts: 3,
      generated_workout_exercises: 4,
      workout_sessions: 5,
      session_exercises: 6,
      logged_sets: 7,
      sets: 7,
      favorites: 8,
      recommendation_events: 9,
    };

    return [...items].sort((a, b) => {
      const tierA = dependencyTiers[a.entityType] || 10;
      const tierB = dependencyTiers[b.entityType] || 10;
      if (tierA !== tierB) return tierA - tierB;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }

  /**
   * Calculates next exponential backoff timestamp.
   * Progression: 1: 0s, 2: 5s, 3: 30s, 4: 120s, 5: 600s, 6+: 1800s
   */
  public calculateBackoffDelay(retryCount: number): number {
    const schedule = [0, 5000, 30000, 120000, 600000, 1800000];
    const baseDelay = schedule[Math.min(retryCount, schedule.length - 1)];
    // Add up to 10% jitter
    const jitter = Math.floor(Math.random() * (baseDelay * 0.1));
    return baseDelay + jitter;
  }

  /**
   * Determines whether an error is retryable.
   */
  public isRetryableError(error: any): boolean {
    if (!error) return true;
    const message = (error.message || String(error)).toLowerCase();
    const status = error.status || error.statusCode || error.code;

    // Non-retryable: RLS violation, duplicate non-idempotent conflict, invalid payload
    if (
      message.includes('row-level security') ||
      message.includes('permission denied') ||
      message.includes('violates foreign key constraint') ||
      message.includes('violates check constraint') ||
      status === 400 ||
      status === 401 ||
      status === 403 ||
      status === 422
    ) {
      return false;
    }

    // Retryable: network offline, timeouts, 429 rate limits, 5xx server errors
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('timeout') ||
      status === 429 ||
      (typeof status === 'number' && status >= 500 && status <= 599) ||
      status === 'FETCH_ERROR'
    );
  }

  /**
   * Executes push synchronization for pending queue items.
   */
  public async pushPendingOperations(maxBatchSize = 25): Promise<PushResult> {
    const hasLock = await this.lock.acquire();
    if (!hasLock) {
      return { processedCount: 0, succeededCount: 0, failedCount: 0, deadCount: 0 };
    }

    const result: PushResult = {
      processedCount: 0,
      succeededCount: 0,
      failedCount: 0,
      deadCount: 0,
    };

    try {
      const rawItems = await this.outbox.getDueItems(maxBatchSize);
      if (rawItems.length === 0) {
        return result;
      }

      const items = this.sortItemsByDependency(rawItems);

      for (const item of items) {
        await this.lock.renew();
        result.processedCount++;

        item.status = 'processing';
        item.lastAttemptAt = new Date().toISOString();
        await this.outbox.updateItem(item);

        try {
          await this.processSingleOperation(item);

          // Mark succeeded
          item.status = 'succeeded';
          item.processedAt = new Date().toISOString();
          item.errorData = null;
          await this.outbox.updateItem(item);
          await this.updateLocalRecordStatus(item.entityType, item.entityId, 'synced');
          result.succeededCount++;
        } catch (error: any) {
          const retryable = this.isRetryableError(error);
          item.retryCount++;
          item.errorData = {
            message: error?.message || String(error),
            status: error?.status,
            timestamp: new Date().toISOString(),
          };

          if (retryable && item.retryCount < 6) {
            item.status = 'pending';
            const delayMs = this.calculateBackoffDelay(item.retryCount);
            item.nextAttemptAt = new Date(Date.now() + delayMs).toISOString();
            result.failedCount++;
          } else {
            // Non-retryable or max retries exceeded -> Dead letter
            item.status = 'dead';
            item.processedAt = new Date().toISOString();
            result.deadCount++;
            await this.updateLocalRecordStatus(item.entityType, item.entityId, 'error');
          }

          await this.outbox.updateItem(item);
        }
      }
    } finally {
      await this.lock.release();
    }

    return result;
  }

  /**
   * Dispatches an individual mutation to the appropriate Supabase repository.
   */
  private async processSingleOperation(item: SyncQueueItem): Promise<void> {
    const { operation, entityType, payload } = item;

    // Check Cloud Idempotency Table: sync_operations
    const { data: existingOp } = await this.supabaseClient
      .from('sync_operations')
      .select('id, status')
      .eq('idempotency_key', item.idempotencyKey)
      .maybeSingle();

    if (existingOp && (existingOp.status === 'succeeded' || existingOp.status === 'processing')) {
      // Already processed in cloud
      return;
    }

    // Execute entity mutation
    switch (entityType) {
      case 'profiles':
      case 'local_profiles':
        await this.userRepo.saveProfile(payload as any);
        break;
      case 'workout_templates':
        if (operation === 'delete') {
          await this.workoutRepo.deleteTemplate(item.entityId);
        } else {
          await this.workoutRepo.saveTemplate(payload as any);
        }
        break;
      case 'generated_workouts':
        await this.workoutRepo.saveGeneratedWorkout(payload as any);
        break;
      case 'workout_sessions':
        await this.completionRepo.saveSession(payload as any);
        break;
      case 'favorites':
        if (operation === 'delete') {
          await this.favoritesRepo.removeFavorite(item.entityId);
        } else {
          await this.favoritesRepo.addFavorite(item.entityId);
        }
        break;
      default:
        break;
    }

    // Record processed idempotency key in cloud sync_operations
    const { data: sessionData } = await this.supabaseClient.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    if (userId) {
      await this.supabaseClient.from('sync_operations').upsert(
        {
          id: item.id,
          user_id: userId,
          idempotency_key: item.idempotencyKey,
          operation: item.operation,
          entity_type: item.entityType,
          entity_id: item.entityId,
          status: 'succeeded',
          request_hash: null,
          error_data: null,
          created_at: item.createdAt,
          processed_at: new Date().toISOString(),
        } as any,
        { onConflict: 'idempotency_key' }
      );
    }
  }

  /**
   * Updates the sync status of the corresponding local IndexedDB record.
   */
  private async updateLocalRecordStatus(
    entityType: string,
    entityId: string,
    status: 'synced' | 'error'
  ): Promise<void> {
    const storeMap: Record<string, StoreName> = {
      profiles: STORES.LOCAL_PROFILES,
      local_profiles: STORES.LOCAL_PROFILES,
      workout_templates: STORES.WORKOUT_TEMPLATES,
      generated_workouts: STORES.GENERATED_WORKOUTS,
      workout_sessions: STORES.WORKOUT_SESSIONS,
      session_exercises: STORES.SESSION_EXERCISES,
      logged_sets: STORES.SETS,
      sets: STORES.SETS,
      favorites: STORES.FAVORITES,
    };

    const storeName = storeMap[entityType];
    if (!storeName) return;

    const record = await this.db.get<LocalRecordMeta>(storeName, entityId);
    if (record) {
      record.syncStatus = status;
      if (status === 'synced') {
        record.lastSyncedAt = new Date().toISOString();
      }
      await this.db.put(storeName, record);
    }
  }
}
