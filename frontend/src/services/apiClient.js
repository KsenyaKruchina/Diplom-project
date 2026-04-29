// services/apiClient.js
// ─── Базовый HTTP-клиент для IoT Monitoring API ───────────────────────────────
//
// Base URL: http://157.90.127.202:8000
// Auth: JWT Bearer Token (хранится в localStorage)
// При 401 — очищаем токен и редиректим на /login

const BASE_URL = "http://157.90.127.202:8000";

// ─── Получить токен из хранилища ─────────────────────────────────────────────
export const getToken = () => localStorage.getItem("access_token");
export const setToken = (token) => localStorage.setItem("access_token", token);
export const clearToken = () => localStorage.removeItem("access_token");

// ─── Авторизованный fetch ─────────────────────────────────────────────────────
/**
 * @param {string} path  — путь вида "/api/v1/sensors/"
 * @param {RequestInit} options
 * @returns {Promise<Response>}
 */
export const apiFetch = async (path, options = {}) => {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearToken();
    // Редирект на логин если настроен роутер
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("auth:expired"));
    }
    throw new Error("Сессия истекла. Пожалуйста, войдите снова.");
  }

  return response;
};

// ─── JSON-запросы ─────────────────────────────────────────────────────────────
export const apiGet = async (path, params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== null && v !== undefined)
  ).toString();
  const fullPath = query ? `${path}?${query}` : path;
  const response = await apiFetch(fullPath);
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(err.detail || `Ошибка ${response.status}`);
  }
  return response.json();
};

export const apiPatch = async (path, body) => {
  const response = await apiFetch(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(err.detail || `Ошибка ${response.status}`);
  }
  return response.json();
};

// ─── Скачивание файлов (blob) ─────────────────────────────────────────────────
/**
 * Скачивает бинарный файл через авторизованный запрос.
 * @param {string} path
 * @param {string} filename — имя файла для сохранения
 */
export const apiDownload = async (path, filename) => {
  const response = await apiFetch(path);

  if (!response.ok) {
    // Попробуем прочитать JSON-ошибку
    const err = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(err.detail || `Ошибка загрузки: ${response.status}`);
  }

  // Получаем имя файла из заголовка Content-Disposition, если есть
  const disposition = response.headers.get("Content-Disposition");
  if (disposition) {
    const match = disposition.match(/filename=([^;]+)/);
    if (match) filename = match[1].replace(/"/g, "");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ─── Логин ────────────────────────────────────────────────────────────────────
/**
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{access_token: string, token_type: string}>}
 */
export const login = async (username, password) => {
  const response = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username, password }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: "Ошибка авторизации" }));
    throw new Error(err.detail || "Неверный логин или пароль");
  }

  const data = await response.json();
  setToken(data.access_token);
  return data;
};

// ─── WebSocket ─────────────────────────────────────────────────────────────────
/**
 * Создаёт WebSocket-соединение с автопереподключением.
 * @param {function} onMessage  — колбэк при получении сообщения
 * @returns {{ close: function }} — объект для ручного закрытия
 */
export const createAlarmSocket = (onMessage) => {
  const WS_URL = BASE_URL.replace(/^http/, "ws");
  let ws = null;
  let stopped = false;

  const connect = () => {
    if (stopped) return;
    ws = new WebSocket(`${WS_URL}/ws/alarms`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      if (!stopped) setTimeout(connect, 3000);
    };

    ws.onerror = () => ws.close();
  };

  connect();

  return {
    close: () => {
      stopped = true;
      ws?.close();
    },
  };
};

export default { apiFetch, apiGet, apiPatch, apiDownload, login, createAlarmSocket, getToken, setToken, clearToken };