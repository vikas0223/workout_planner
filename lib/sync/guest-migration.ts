/**
 * Controlled Guest Data Association & Offline Sync Migration
 * 
 * Safely associates local guest workouts, sessions, sets, and profiles with
 * an authenticated Supabase user identity.
 * 
 * Invariants:
 * 1. Guest local data is NEVER deleted upon sign-in/account creation.
 * 2. Rewrites ownership from 'guest' -> 'user' while preserving stable entity IDs.
 * 3. Never touches records already owned by an authenticated user.
 * 4. Explicitly creates canonical sync operations in strict dependency order:
 *    profiles -> templates -> workouts -> exercises -> sessions -> session_exercises -> sets -> events/favorites.
 * 5. Strictly idempotent: running multiple times does not produce duplicate entities or duplicate sync queue records.
 * 6. Resilient: partial failures preserve local records for subsequent recovery.
 */

import { getIndexedDBEngine, IndexedDBEngine } from '../storage/indexeddb-engine';
import { STORES, StoreName, LocalRecordMeta, LocalProfileRecord } from '../storage/indexeddb-schema';
import { SyncOutbox } from './sync-outbox';
import { SyncLock } from './sync-lock';

export interface GuestMigrationResult {
  success: boolean;
  migratedCount: number;
  queuedCount: number;
  migratedStores: Record<string, number>;
  errors?: string[];
}

export interface GuestStoreDefinition {
  storeName: StoreName;
  entityType: string;
  order: number;
}

// Canonical dependency ordering for foreign key and data integrity constraints
export const GUEST_MIGRATION_STORES: GuestStoreDefinition[] = [
  { storeName: STORES.LOCAL_PROFILES, entityType: 'profiles', order: 1 },
  { storeName: STORES.WORKOUT_TEMPLATES, entityType: 'workout_templates', order: 2 },
  { storeName: STORES.GENERATED_WORKOUTS, entityType: 'generated_workouts', order: 3 },
  { storeName: STORES.GENERATED_WORKOUT_EXERCISES, entityType: 'generated_workout_exercises', order: 4 },
  { storeName: STORES.WORKOUT_SESSIONS, entityType: 'workout_sessions', order: 5 },
  { storeName: STORES.SESSION_EXERCISES, entityType: 'session_exercises', order: 6 },
  { storeName: STORES.SETS, entityType: 'logged_sets', order: 7 },
  { storeName: STORES.FAVORITES, entityType: 'favorites', order: 8 },
  { storeName: STORES.RECOMMENDATION_EVENTS, entityType: 'recommendation_events', order: 9 },
];

/**
 * Checks if any guest-owned records exist in IndexedDB
 */
export async function hasGuestData(db?: IndexedDBEngine): Promise<boolean> {
  const engine = db || getIndexedDBEngine();

  for (const { storeName } of GUEST_MIGRATION_STORES) {
    try {
      const records = await engine.getAll<LocalRecordMeta>(storeName);
      const hasGuest = records.some(
        (r) => r.ownerKind === 'guest' || r.ownerId === 'guest_user'
      );
      if (hasGuest) {
        return true;
      }
    } catch {
      // Store might not be initialized or accessible in SSR/memory
    }
  }

  return false;
}

/**
 * Associates local guest-owned records with an authenticated Supabase user ID.
 * Explicitly enqueues them into the sync outbox in dependency order.
 */
export async function associateGuestDataWithUser(
  authUserId: string,
  db?: IndexedDBEngine
): Promise<GuestMigrationResult> {
  if (!authUserId) {
    throw new Error('associateGuestDataWithUser requires a valid authUserId');
  }

  const engine = db || getIndexedDBEngine();
  const lock = new SyncLock(engine);
  const outbox = new SyncOutbox(engine);

  let lockAcquired = false;
  const migratedStores: Record<string, number> = {};
  let totalMigrated = 0;
  let totalQueued = 0;
  const errors: string[] = [];

  try {
    lockAcquired = await lock.acquire(15000);
  } catch (err: any) {
    console.warn('[GuestMigration] Could not acquire exclusive lock, proceeding with caution:', err);
  }

  const now = new Date().toISOString();

  try {
    // 1. Resolve or create authenticated local profile
    try {
      const allProfiles = await engine.getAll<LocalProfileRecord>(STORES.LOCAL_PROFILES);
      const existingAuthProfile = allProfiles.find(
        (p) => p.id === authUserId || p.ownerId === authUserId
      );

      const guestProfile = allProfiles.find(
        (p) => p.isCurrentGuest || p.ownerKind === 'guest' || p.ownerId === 'guest_user'
      );

      if (!existingAuthProfile && guestProfile) {
        // Clone guest profile attributes into the new authenticated profile
        const newAuthProfile: LocalProfileRecord = {
          ...guestProfile,
          id: authUserId,
          ownerKind: 'user',
          ownerId: authUserId,
          isCurrentGuest: false,
          clientUpdatedAt: now,
          updatedAt: now,
          version: (guestProfile.version || 1) + 1,
          syncStatus: 'local',
          profile: {
            ...guestProfile.profile,
            id: authUserId,
            updatedAt: now,
          },
        };
        await engine.put(STORES.LOCAL_PROFILES, newAuthProfile);
      }
    } catch (profErr: any) {
      errors.push(`Profile linking error: ${profErr?.message || String(profErr)}`);
    }

    // 2. Iterate through all domain stores in explicit dependency order
    for (const { storeName, entityType } of GUEST_MIGRATION_STORES) {
      try {
        const records = await engine.getAll<LocalRecordMeta & Record<string, any>>(storeName);
        let storeMigrated = 0;

        for (const record of records) {
          // STRICT RULE: Only migrate records that are explicitly guest-owned.
          // Never overwrite or modify existing authenticated user records!
          const isGuest =
            record.ownerKind === 'guest' ||
            record.ownerId === 'guest_user' ||
            (!record.ownerId && record.ownerKind !== 'user');

          if (!isGuest) {
            continue;
          }

          // Preserve stable primary key ID, update ownership metadata
          const updatedRecord: LocalRecordMeta & Record<string, any> = {
            ...record,
            ownerKind: 'user' as const,
            ownerId: authUserId,
            clientUpdatedAt: now,
            updatedAt: now,
            version: (record.version || 1) + 1,
            syncStatus: 'local' as const,
          };

          // Rewrite nested domain object user IDs if present
          if (updatedRecord.template && typeof updatedRecord.template === 'object') {
            updatedRecord.template = { ...updatedRecord.template, userId: authUserId, updatedAt: now };
          }
          if (updatedRecord.session && typeof updatedRecord.session === 'object') {
            updatedRecord.session = { ...updatedRecord.session, userId: authUserId, updatedAt: now };
          }
          if (updatedRecord.workout && typeof updatedRecord.workout === 'object') {
            updatedRecord.workout = { ...updatedRecord.workout, userId: authUserId, updatedAt: now };
          }
          if (updatedRecord.userId) {
            updatedRecord.userId = authUserId;
          }

          // Persist updated record back to IndexedDB
          await engine.put(storeName, updatedRecord);
          storeMigrated++;
          totalMigrated++;

          // 3. Explicitly enqueue canonical sync operation in outbox
          const operation = record.deletedAt ? 'delete' : 'upsert';
          const queued = await outbox.enqueue({
            ownerKind: 'user',
            ownerId: authUserId,
            entityType,
            entityId: updatedRecord.id,
            operation,
            version: updatedRecord.version,
            payload: updatedRecord,
            baseUpdatedAt: updatedRecord.updatedAt,
          });

          if (queued) {
            totalQueued++;
          }
        }

        migratedStores[entityType] = storeMigrated;
      } catch (storeErr: any) {
        errors.push(`Store ${storeName} migration error: ${storeErr?.message || String(storeErr)}`);
      }
    }

    // 4. Retain audit record in STORES.META
    try {
      await engine.put(STORES.META, {
        key: 'last_guest_migration_audit',
        value: {
          authUserId,
          migratedAt: now,
          totalMigrated,
          totalQueued,
          migratedStores,
        },
        updatedAt: now,
      });
    } catch {
      // Audit entry failure is non-blocking
    }

    return {
      success: errors.length === 0,
      migratedCount: totalMigrated,
      queuedCount: totalQueued,
      migratedStores,
      errors: errors.length > 0 ? errors : undefined,
    };
  } finally {
    if (lockAcquired) {
      try {
        await lock.release();
      } catch {
        // Lock release cleanup
      }
    }
  }
}
