/**
 * @fileoverview 事件总线
 * @description 全局事件订阅和发布
 */

type EventCallback = (data?: any) => void;

export class EventBus {
  private static _listeners: Map<string, EventCallback[]> = new Map();

  static on(event: string, callback: EventCallback): void {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    this._listeners.get(event)!.push(callback);
  }

  static off(event: string, callback: EventCallback): void {
    const callbacks = this._listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  static emit(event: string, data?: any): void {
    const callbacks = this._listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  static once(event: string, callback: EventCallback): void {
    const onceCallback = (data?: any) => {
      this.off(event, onceCallback);
      callback(data);
    };
    this.on(event, onceCallback);
  }
}
