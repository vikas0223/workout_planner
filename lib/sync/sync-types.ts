/**
 * Sync Engine Types and Contracts
 * Canonical interfaces for queueing, locking, conflicts, cursors, and telemetry.
 */

import { StoreName } from '../storage/indexeddb-schema';

export type SyncOperationType = 'insert' | 'update' | 'delete' | 'upsert';

export type SyncQueueStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'conflict'
  | 'dead';

export interface SyncQueueItem {
  id: string;
  operation: SyncOperationType;
  entityType: string;
  entityId: string;
  idempotencyKey: string;
  payload: Record<string, unknown>;
  baseVersion: number;
  baseUpdatedAt: string;
  retryCount: number;
  status: SyncQueueStatus;
  createdAt: string;
  updatedAt: string;
  nextAttemptAt: string;
  lastAttemptAt?: string | null;
  processedAt?: string | null;
  errorData?: Record<string, unknown> | null;
}

export interface SyncLockRecord {
  lockKey: string;
  ownerTabId: string;
  acquiredAt: string;
  expiresAt: string;
}

export interface SyncConflictItem {
  id: string;
  entityType: string;
  entityId: string;
  localPayload: Record<string, unknown>;
  remotePayload: Record<string, unknown>;
  reason: string;
  resolved: boolean;
  resolutionStatus?: 'merged' | 'local_kept' | 'remote_kept' | 'manual_required';
  createdAt: string;
  resolvedAt?: string | null;
}

export interface SyncCursorItem {
  storeName: StoreName | string;
  lastRemoteCursor?: string | null;
  lastLocalCursor?: string | null;
  updatedAt: string;
}

export interface SyncStatusState {
  isOnline: boolean;
  isSyncing: boolean;
  statusText: 'Online' | 'Offline' | 'Syncing' | 'Synced' | 'Sync pending' | 'Sync failed' | 'Needs attention';
  pendingCount: number;
  failedCount: number;
  deadCount: number;
  conflictCount: number;
  lastSyncedAt: string | null;
  lastError: string | null;
}

export interface SyncTelemetryEvent {
  eventName:
    | 'workout_sync_started'
    | 'workout_sync_succeeded'
    | 'sync_queue_item_failed'
    | 'sync_conflict_created'
    | 'sync_queue_drained'
    | 'sync_recovery_detected'
    | 'sync_dead_lettered'
    | 'supabase_migration_failed'
    | 'rls_test_failed';
  entityType?: string;
  entityId?: string;
  operation?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
