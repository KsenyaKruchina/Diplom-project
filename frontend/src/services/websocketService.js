// frontend/src/services/websocketService.js
// ─── WebSocket сервис — live-обновления ───────────────────────────────────────
//
// Подключается к /api/v1/ws/alarms и слушает события:
//   - new_measurement  → новые данные с датчика
//   - alarm_updated    → тревога обработана
//   - new_alarm        → новая тревога
//   - alarm_created    → новая тревога (альтернативное событие)
//   - alarm_comment_updated → обновился комментарий
//   - alarm_deleted    → тревога удалена
//   - sensor_position → датчик перемещён на плане
//   - sensor_position_updated → датчик перемещён на плане (старое имя)
//
// Автоматически переподключается при разрыве.
// Передаёт JWT-токен через query-параметр ?token=... для авторизации.

import { BASE_URL, getToken } from "./api";

// Строим WebSocket URL от API origin.
// Если VITE_API_BASE_URL = http://157.90.127.202/api/v1, WS пойдёт на
// ws://157.90.127.202/api/v1/ws/alarms, а не на localhost dev-сервера.
const buildWsUrl = () => {
  const explicitWsUrl = import.meta.env.VITE_WS_URL;
  const token = getToken();

  if (explicitWsUrl) {
    return token
      ? `${explicitWsUrl}?token=${encodeURIComponent(token)}`
      : explicitWsUrl;
  }

  const apiUrl = new URL(BASE_URL, window.location.origin);
  const proto = apiUrl.protocol === "https:" ? "wss" : "ws";
  const wsPath = import.meta.env.VITE_WS_PATH || "/api/v1/ws/alarms";
  const base = `${proto}://${apiUrl.host}${wsPath}`;
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
};

class WebSocketService {
  constructor() {
    this.ws               = null;   // само WebSocket-соединение
    this.listeners        = {};     // подписчики: { тип_события: [функции...] }
    this.reconnectTimeout = null;   // таймер переподключения
    this.shouldReconnect  = true;   // флаг: нужно ли переподключаться
    this.reconnectDelay   = 3000;   // задержка переподключения (мс)
  }

  /**
   * Подключиться к WebSocket.
   * Повторного подключения не будет, если уже подключён.
   */
  connect() {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    // Сбрасываем флаг чтобы после явного connect() можно было переподключаться
    this.shouldReconnect = true;

    try {
      this.ws = new WebSocket(buildWsUrl());

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
   * @param {string} eventType - тип события ("new_measurement", "alarm_updated", ...)
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

  // При отключении пытаемся переподключиться с экспоненциальным бэкоффом.
  // Первый раз ждём 3 секунды, потом 4.5, потом 6.75... до 30 секунд.
  _scheduleReconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    console.log(`[WS] Переподключение через ${this.reconnectDelay / 1000}с...`);
    this.reconnectTimeout = setTimeout(() => {
      if (this.shouldReconnect) this.connect();
    }, this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30000);
  }
}

// Создаём один экземпляр (синглтон) на всё приложение.
// Все компоненты используют один и тот же объект — одно WebSocket-соединение.
export const wsService = new WebSocketService();
