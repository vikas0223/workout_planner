/**
 * Local Goal Repository (IndexedDB Backed)
 * Implements GoalRepository for FitnessGoalTarget persistence.
 */

import { GoalRepository } from '@/lib/repositories/interfaces';
import { FitnessGoalTarget } from '@/types/domain';
import { IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import {
  STORES,
  LocalFitnessGoalRecord,
  SyncQueueRecord,
} from '@/lib/storage/indexeddb-schema';
import { ProgressInvalidationBus } from '@/lib/events/progress-invalidation-bus';

export class LocalGoalRepository implements GoalRepository {
  constructor(
    private engine: IndexedDBEngine = IndexedDBEngine.getInstance(),
    private invalidationBus: ProgressInvalidationBus = ProgressInvalidationBus.getInstance()
  ) {}

  public async getGoalById(id: string): Promise<FitnessGoalTarget | null> {
    try {
      const record = await this.engine.get<LocalFitnessGoalRecord>(STORES.FITNESS_GOALS, id);
      if (!record || record.deletedAt) return null;
      return record.goal;
    } catch (err) {
      console.error('[LocalGoalRepository] Failed to get goal by ID:', err);
      return null;
    }
  }

  public async listGoals(userId?: string, status?: string): Promise<FitnessGoalTarget[]> {
    try {
      const ownerId = userId || 'guest_user';
      const records = await this.engine.getByIndex<LocalFitnessGoalRecord>(
        STORES.FITNESS_GOALS,
        'ownerId',
        ownerId
      );

      let active = records.filter((r) => !r.deletedAt);
      if (status) {
        active = active.filter((r) => r.goal.status === status);
      }

      return active
        .map((r) => r.goal)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      console.error('[LocalGoalRepository] Failed to list goals:', err);
      return [];
    }
  }

  public async saveGoal(goal: FitnessGoalTarget): Promise<void> {
    const now = new Date().toISOString();
    const ownerId = goal.userId || 'guest_user';
    const ownerKind = goal.userId ? 'user' : 'guest';

    const existing = await this.engine.get<LocalFitnessGoalRecord>(STORES.FITNESS_GOALS, goal.id);

    const goalRecord: LocalFitnessGoalRecord = {
      id: goal.id,
      ownerKind,
      ownerId,
      goal: {
        ...goal,
        updatedAt: now,
      },
      version: (existing?.version || 0) + 1,
      syncStatus: 'queued',
      createdAt: goal.createdAt || now,
      updatedAt: now,
      clientUpdatedAt: now,
      deletedAt: null,
    };

    await this.engine.put(STORES.FITNESS_GOALS, goalRecord);

    const syncItem: SyncQueueRecord = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      operation: 'upsert',
      entityType: 'fitness_goals',
      entityId: goal.id,
      idempotencyKey: `goal_${goal.id}_${now}`,
      payload: goalRecord.goal as unknown as Record<string, unknown>,
      baseVersion: goalRecord.version,
      baseUpdatedAt: now,
      retryCount: 0,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      nextAttemptAt: now,
    };
    await this.engine.put(STORES.SYNC_QUEUE, syncItem);

    this.invalidationBus.emit({
      type: 'goal_changed',
      entityId: goal.id,
      timestamp: Date.now(),
    });
  }

  public async deleteGoal(id: string): Promise<void> {
    const now = new Date().toISOString();
    const existing = await this.engine.get<LocalFitnessGoalRecord>(STORES.FITNESS_GOALS, id);
    if (!existing) return;

    existing.deletedAt = now;
    existing.updatedAt = now;
    existing.clientUpdatedAt = now;
    existing.syncStatus = 'queued';
    await this.engine.put(STORES.FITNESS_GOALS, existing);

    const syncItem: SyncQueueRecord = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      operation: 'delete',
      entityType: 'fitness_goals',
      entityId: id,
      idempotencyKey: `goal_del_${id}_${now}`,
      payload: { id, deletedAt: now },
      baseVersion: existing.version,
      baseUpdatedAt: now,
      retryCount: 0,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      nextAttemptAt: now,
    };
    await this.engine.put(STORES.SYNC_QUEUE, syncItem);

    this.invalidationBus.emit({
      type: 'goal_changed',
      entityId: id,
      timestamp: Date.now(),
    });
  }
}
