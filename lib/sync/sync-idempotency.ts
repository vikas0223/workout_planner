/**
 * Sync Idempotency Manager
 * Generates and validates canonical idempotency keys in format:
 * {ownerId}:{entityType}:{entityId}:{operation}:{version}
 */

import { SyncOperationType } from './sync-types';

export class SyncIdempotency {
  /**
   * Generates a deterministic idempotency key.
   * Retries of the same mutation at the same version produce the exact same key.
   */
  public static generateKey(
    ownerId: string,
    entityType: string,
    entityId: string,
    operation: SyncOperationType,
    version: number
  ): string {
    return `${ownerId}:${entityType}:${entityId}:${operation}:${version}`;
  }

  /**
   * Parses an idempotency key into its constituent metadata.
   */
  public static parseKey(key: string): {
    ownerId: string;
    entityType: string;
    entityId: string;
    operation: SyncOperationType;
    version: number;
  } | null {
    const parts = key.split(':');
    if (parts.length < 5) return null;
    return {
      ownerId: parts[0],
      entityType: parts[1],
      entityId: parts[2],
      operation: parts[3] as SyncOperationType,
      version: parseInt(parts[4], 10) || 1,
    };
  }
}
