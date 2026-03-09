// src/core/event/index.ts
type EventType = string | symbol;
type EventHandler = (...args: any[]) => void;

export class EventBus {
  private events: Map<EventType, Set<EventHandler>> = new Map();

  // 订阅事件
  on(type: EventType, handler: EventHandler) {
    if (!this.events.has(type)) {
      this.events.set(type, new Set());
    }
    this.events.get(type)!.add(handler);
  }

  // 取消订阅
  off(type: EventType, handler?: EventHandler) {
    if (!this.events.has(type)) return;
    if (handler) {
      this.events.get(type)!.delete(handler);
    } else {
      this.events.delete(type);
    }
  }

  // 触发事件
  emit(type: EventType, ...args: any[]) {
    if (!this.events.has(type)) return;
    this.events.get(type)!.forEach(handler => {
      try {
        handler(...args);
      } catch (e) {
        console.error(`事件${String(type)}处理失败`, e);
      }
    });
  }

  // 一次性订阅
  once(type: EventType, handler: EventHandler) {
    const wrapHandler = (...args: any[]) => {
      handler(...args);
      this.off(type, wrapHandler);
    };
    this.on(type, wrapHandler);
  }
}

// 创建全局事件总线实例
export const eventBus = new EventBus();