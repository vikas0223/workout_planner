/**
 * Local User Profile Repository (IndexedDB backed)
 * Satisfies UserRepository interface for guest & authenticated profiles.
 */

import { UserRepository } from '@/lib/repositories/interfaces';
import { UserProfile } from '@/types/domain';
import { IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import { STORES, LocalProfileRecord } from '@/lib/storage/indexeddb-schema';

export class LocalUserRepository implements UserRepository {
  constructor(private engine: IndexedDBEngine = IndexedDBEngine.getInstance()) {}

  public async getProfile(id: string): Promise<UserProfile | null> {
    try {
      const record = await this.engine.get<LocalProfileRecord>(STORES.LOCAL_PROFILES, id);
      return record ? record.profile : null;
    } catch (err) {
      console.warn(`[LocalUserRepository] Failed to getProfile for id=${id}`, err);
      return null;
    }
  }

  public async getCurrentGuestProfile(): Promise<UserProfile | null> {
    try {
      const guests = await this.engine.getByIndex<LocalProfileRecord>(
        STORES.LOCAL_PROFILES,
        'ownerKind',
        'guest'
      );
      if (guests.length > 0) {
        // Return current or most recently updated guest
        const active = guests.find((g) => g.isCurrentGuest) || guests[0];
        return active.profile;
      }
      return null;
    } catch (err) {
      console.warn('[LocalUserRepository] Failed to getCurrentGuestProfile', err);
      return null;
    }
  }

  public async saveProfile(profile: UserProfile): Promise<void> {
    const now = new Date().toISOString();
    const existing = await this.engine.get<LocalProfileRecord>(STORES.LOCAL_PROFILES, profile.id);

    const record: LocalProfileRecord = {
      id: profile.id,
      ownerKind: 'guest',
      ownerId: profile.id,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      clientUpdatedAt: now,
      version: (existing?.version || 0) + 1,
      syncStatus: 'local',
      isCurrentGuest: true,
      profile: {
        ...profile,
        updatedAt: now,
      },
    };

    await this.engine.put(STORES.LOCAL_PROFILES, record);
  }

  public async listReturningUsers(): Promise<string[]> {
    try {
      const all = await this.engine.getAll<LocalProfileRecord>(STORES.LOCAL_PROFILES);
      return all
        .map((r) => r.profile.name)
        .filter((name): name is string => Boolean(name && name.trim()));
    } catch (err) {
      console.warn('[LocalUserRepository] Failed to listReturningUsers', err);
      return [];
    }
  }
}
