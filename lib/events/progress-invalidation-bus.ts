/**
 * Progress Invalidation Bus
 * Dual-layer invalidation mechanism:
 * 1. In-memory event listeners for current tab/window.
 * 2. BroadcastChannel for cross-tab / cross-window synchronization.
 *
 * Events signify "recompute affected progress" without carrying metric payloads.
 */

export type ProgressInvalidationEventType =
  | 'set_changed'
  | 'session_changed'
  | 'feedback_changed'
  | 'program_changed'
  | 'goal_changed'
  | 'challenge_changed'
  | 'sync_applied';

export interface ProgressInvalidationEvent {
  type: ProgressInvalidationEventType;
  entityId?: string;
  timestamp: number;
}

export type InvalidationListener = (event: ProgressInvalidationEvent) => void;

const BROADCAST_CHANNEL_NAME = 'workout_progress_invalidation_channel';

export class ProgressInvalidationBus {
  private static instance: ProgressInvalidationBus | null = null;
  private listeners: Set<InvalidationListener> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;

  private constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.broadcastChannel.onmessage = (messageEvent: MessageEvent<ProgressInvalidationEvent>) => {
          if (messageEvent.data && messageEvent.data.type) {
            this.notifyLocalListeners(messageEvent.data);
          }
        };
      } catch (err) {
        console.warn('[ProgressInvalidationBus] BroadcastChannel not supported or restricted:', err);
      }
    }
  }

  public static getInstance(): ProgressInvalidationBus {
    if (!ProgressInvalidationBus.instance) {
      ProgressInvalidationBus.instance = new ProgressInvalidationBus();
    }
    return ProgressInvalidationBus.instance;
  }

  /**
   * For testing: resets singleton instance and closes broadcast channel
   */
  public static resetInstance(): void {
    if (ProgressInvalidationBus.instance) {
      if (ProgressInvalidationBus.instance.broadcastChannel) {
        try {
          ProgressInvalidationBus.instance.broadcastChannel.close();
        } catch {
          // ignore
        }
      }
      ProgressInvalidationBus.instance.listeners.clear();
      ProgressInvalidationBus.instance = null;
    }
  }

  /**
   * Subscribes a listener callback to invalidation events.
   * Returns an unsubscribe function.
   */
  public subscribe(listener: InvalidationListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Emits an invalidation event to local listeners and broadcasts to other open tabs.
   * Does NOT contain metric data. Accepts event object or type string.
   */
  public emit(
    eventOrType: ProgressInvalidationEventType | ProgressInvalidationEvent,
    entityId?: string
  ): void {
    const event: ProgressInvalidationEvent =
      typeof eventOrType === 'string'
        ? {
            type: eventOrType,
            entityId,
            timestamp: Date.now(),
          }
        : eventOrType;

    // 1. Notify current tab
    this.notifyLocalListeners(event);

    // 2. Broadcast across tabs
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(event);
      } catch (err) {
        console.warn('[ProgressInvalidationBus] Failed to broadcast event:', err);
      }
    }
  }

  private notifyLocalListeners(event: ProgressInvalidationEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('[ProgressInvalidationBus] Error in invalidation listener:', err);
      }
    });
  }
}
