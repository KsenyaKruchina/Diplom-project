// frontend/src/services/websocketService.js
// ─── WebSocket сервис — live-обновления ───────────────────────────────────────
//
// Подключается к /ws/alarms и слушает события:
//   - new_measurement  → новые данные с датчика
//   - alarm_updated    → тревога обработана
//
// Автоматически переподключается при разрыве.

const WS_URL = `${window.location.protocol === "https:" ? "wss" : "ws"}://${
    window.location.host
  }/ws/alarms`;
  
  class WebSocketService {
    constructor() {
      this.ws = null;
      this.listeners = {}; // { eventType: [callback, ...] }
      this.reconnectTimeout = null;
      this.shouldReconnect = true;
      this.reconnectDelay = 3000; // мс
    }
  
    /**
     * Подключиться к WebSocket.
     * Безопасно вызывать несколько раз — повторного подключения не будет,
     * если уже подключён.
     */
    connect() {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
  
      try {
        this.ws = new WebSocket(WS_URL);
  
        this.ws.onopen = () => {
          console.log("[WS] Подключён к серверу");
          this.reconnectDelay = 3000; // сброс задержки при успешном подключении
        };
  
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this._dispatch(data.type, data);
          } catch (e) {
            console.error("[WS] Ошибка парсинга сообщения:", e);
          }
        };
  
        this.ws.onclose = () => {
          console.log("[WS] Соединение закрыто");
          if (this.shouldReconnect) {
            this._scheduleReconnect();
          }
        };
  
        this.ws.onerror = (error) => {
          console.error("[WS] Ошибка:", error);
          // onclose вызовется автоматически после onerror
        };
      } catch (e) {
        console.error("[WS] Не удалось создать WebSocket:", e);
        this._scheduleReconnect();
      }
    }
  
    /**
     * Отключиться и не переподключаться.
     */
    disconnect() {
      this.shouldReconnect = false;
      if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
    }
  
    /**
     * Подписаться на события конкретного типа.
     *
     * @param {"new_measurement"|"alarm_updated"} eventType
     * @param {function} callback - функция(data)
     * @returns {function} unsubscribe — вызови, чтобы отписаться
     *
     * Пример:
     *   const unsub = wsService.on("new_measurement", (data) => {
     *     console.log("Новое измерение:", data.temp);
     *   });
     *   // Когда компонент размонтируется:
     *   unsub();
     */
    on(eventType, callback) {
      if (!this.listeners[eventType]) {
        this.listeners[eventType] = [];
      }
      this.listeners[eventType].push(callback);
  
      // Возвращаем функцию отписки
      return () => {
        this.listeners[eventType] = this.listeners[eventType].filter(
          (cb) => cb !== callback
        );
      };
    }
  
    _dispatch(eventType, data) {
      const callbacks = this.listeners[eventType] || [];
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`[WS] Ошибка в обработчике "${eventType}":`, e);
        }
      });
    }
  
    _scheduleReconnect() {
      if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
      console.log(`[WS] Переподключение через ${this.reconnectDelay / 1000}с...`);
      this.reconnectTimeout = setTimeout(() => {
        this.shouldReconnect = true;
        this.connect();
      }, this.reconnectDelay);
      // Экспоненциальный бэкофф (макс. 30 секунд)
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30000);
    }
  }
  
  // ─── Синглтон ─────────────────────────────────────────────────────────────────
  // Один экземпляр на всё приложение
  export const wsService = new WebSocketService();