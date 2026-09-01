/**
 * Sync Pull, Cursor Safety & Startup Recovery Tests
 * Validates cursor advancement upon complete batch and dirty record reconstruction.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupMockIndexedDB } from './helpers/fake-indexeddb';
import { getIndexedDBEngine, IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import { STORES } from '@/lib/storage/indexeddb-schema';
import {
  SyncPullWorker,
  SyncRecoveryScanner,
  SyncOutbox,
} from '@/lib/sync';

describe('Phase 2D-B: Incremental Pull & Cursor Management', () => {
  let db: ReturnType<typeof getIndexedDBEngine>;

  beforeEach(async () => {
    IndexedDBEngine.resetInstance();
    setupMockIndexedDB();
    db = getIndexedDBEngine();
    await db.clear(STORES.SYNC_CURSORS);
    await db.clear(STORES.WORKOUT_TEMPLATES);
  });

  it('updates cursor only after the entire fetched batch is successfully written', async () => {
    const mockSupabase: any = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: 'usr-1' } } },
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'tmpl-1',
              user_id: 'usr-1',
              name: 'Remote Tmpl 1',
              duration_minutes: 45,
              experience_level: 'intermediate',
              is_favorite: false,
              created_at: '2026-08-25T10:00:00Z',
              updated_at: '2026-08-25T10:05:00Z',
            },
          ],
          error: null,
        }),
      }),
    };

    const pullWorker = new SyncPullWorker(db, mockSupabase);
    const initialCursor = await pullWorker.getCursor('workout_templates');
    expect(initialCursor).toBe(new Date(0).toISOString());

    const result = await pullWorker.pullStoreChanges('workout_templates', STORES.WORKOUT_TEMPLATES);
    expect(result.recordsPulled).toBe(1);
    expect(result.cursorUpdated).toBe(true);

    const newCursor = await pullWorker.getCursor('workout_templates');
    expect(newCursor).toBe('2026-08-25T10:05:00Z');

    const localTmpl = await db.get<any>(STORES.WORKOUT_TEMPLATES, 'tmpl-1');
    expect(localTmpl).not.toBeNull();
    expect(localTmpl.syncStatus).toBe('synced');
  });
});

describe('Phase 2D-B: Startup Consistency Recovery Scanner', () => {
  let db: ReturnType<typeof getIndexedDBEngine>;
  let outbox: SyncOutbox;
  let scanner: SyncRecoveryScanner;

  beforeEach(async () => {
    IndexedDBEngine.resetInstance();
    setupMockIndexedDB();
    db = getIndexedDBEngine();
    await db.clear(STORES.SYNC_QUEUE);
    await db.clear(STORES.WORKOUT_TEMPLATES);
    outbox = new SyncOutbox(db);
    scanner = new SyncRecoveryScanner(db, outbox);
  });

  it('scans local stores and recreates missing queue items for unsynced user records', async () => {
    // Simulate crash: local record written with syncStatus = 'queued' but queue insertion failed
    await db.put(STORES.WORKOUT_TEMPLATES, {
      id: 'tmpl-dirty-1',
      ownerKind: 'user',
      ownerId: 'usr-1',
      createdAt: '2026-08-25T10:00:00Z',
      updatedAt: '2026-08-25T10:00:00Z',
      clientUpdatedAt: '2026-08-25T10:00:00Z',
      deletedAt: null,
      version: 1,
      syncStatus: 'queued',
      template: {
        id: 'tmpl-dirty-1',
        name: 'Dirty Template',
      },
    });

    const queueBefore = await db.getAll(STORES.SYNC_QUEUE);
    expect(queueBefore.length).toBe(0);

    const recoveredCount = await scanner.scanAndRecover();
    expect(recoveredCount).toBe(1);

    const queueAfter = await db.getAll<any>(STORES.SYNC_QUEUE);
    expect(queueAfter.length).toBe(1);
    expect(queueAfter[0].entityId).toBe('tmpl-dirty-1');
    expect(queueAfter[0].entityType).toBe('workout_templates');
    expect(queueAfter[0].status).toBe('pending');
  });
});
