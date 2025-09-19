// ============================================================================
// Event Emitter - Browser-compatible implementation
// ============================================================================

export type EventListener<T = unknown> = (data: T) => void;

export class EventEmitter {
  private events: Map<string, Set<EventListener>> = new Map();

  on<T = unknown>(event: string, listener: EventListener<T>): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(listener as EventListener);
  }

  off<T = unknown>(event: string, listener: EventListener<T>): void {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.delete(listener as EventListener);
    }
  }

  emit<T = unknown>(event: string, data: T): void {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  once<T = unknown>(event: string, listener: EventListener<T>): void {
    const onceListener = (data: T) => {
      listener(data);
      this.off(event, onceListener);
    };
    this.on(event, onceListener);
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  listenerCount(event: string): number {
    return this.events.get(event)?.size || 0;
  }

  eventNames(): string[] {
    return Array.from(this.events.keys());
  }
}
