/**
 * Sync Telemetry and Observability Events
 * Emits non-sensitive diagnostic logs and structured monitoring events.
 */

import { SyncTelemetryEvent } from './sync-types';

export class SyncEventEmitter {
  private static listeners: Array<(event: SyncTelemetryEvent) => void> = [];

  public static subscribe(listener: (event: SyncTelemetryEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public static emit(
    eventName: SyncTelemetryEvent['eventName'],
    metadata?: Record<string, unknown>,
    entityType?: string,
    entityId?: string
  ): void {
    const event: SyncTelemetryEvent = {
      eventName,
      entityType,
      entityId,
      timestamp: new Date().toISOString(),
      metadata,
    };

    // Notify listeners
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[SyncEventEmitter] Listener error:', err);
      }
    }
  }
}
