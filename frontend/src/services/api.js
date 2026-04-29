// frontend/src/services/api.js
// ─── Базовый API-клиент ───────────────────────────────────────────────────────
// Все запросы к бэкенду идут через этот файл.
// Он автоматически подставляет токен и обрабатывает ошибки.

// 🔥 БЕРЁМ URL ИЗ ПЕРЕМЕННЫХ ОКРУЖЕНИЯ
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

console.log("API Base URL:", BASE_URL); // Для отладки — убедись, что URL правильный

// ─── Вспомогательные функции для токена ──────────────────────────────────────

export const getToken = () => localStorage.getItem("token");
export const setToken = (token) => localStorage.setItem("token", token);
export const removeToken = () => localStorage.removeItem("token");

// ─── Основная функция запроса ─────────────────────────────────────────────────

/**
 * Универсальная функция для всех HTTP-запросов.
 * Автоматически добавляет Authorization-заголовок.
 * При 401 — удаляет токен и редиректит на /login.
 *
 * @param {string} path - путь после /api/v1, например "/sensors/"
 * @param {object} options - стандартные fetch-опции (method, body, headers...)
 * @returns {Promise<any>} - распарсенный JSON или null
 */
export const apiRequest = async (path, options = {}) => {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = `${BASE_URL}${path}`;
  console.log(`📡 ${options.method || 'GET'} ${url}`); // Для отладки

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Токен истёк или невалидный — выгоняем пользователя
  if (response.status === 401) {
    removeToken();
    window.location.href = "/login";
    return null;
  }

  // Нет прав
  if (response.status === 403) {
    throw new Error("Недостаточно прав для выполнения действия");
  }

  // Ресурс не найден
  if (response.status === 404) {
    throw new Error("Ресурс не найден");
  }

  // Другие ошибки сервера
  if (!response.ok) {
    let errorMessage = `Ошибка сервера: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage =
          typeof errorData.detail === "string"
            ? errorData.detail
            : JSON.stringify(errorData.detail);
      }
    } catch {
      // Если JSON не парсится — оставляем дефолтное сообщение
    }
    throw new Error(errorMessage);
  }

  // Если ответ пустой (например, 204 No Content)
  if (response.status === 204) return null;

  return response.json();
};

// ─── Специальная функция для multipart/form-data (загрузка файлов) ────────────

/**
 * Для загрузки файлов — НЕ ставим Content-Type, браузер сам добавит boundary.
 */
export const apiUpload = async (path, formData, method = "POST") => {
  const token = getToken();

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (response.status === 401) {
    removeToken();
    window.location.href = "/login";
    return null;
  }

  if (!response.ok) {
    let errorMessage = `Ошибка загрузки: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.detail) errorMessage = errorData.detail;
    } catch {}
    throw new Error(errorMessage);
  }

  return response.json();
};

// ─── Специальная функция для логина (form-urlencoded) ─────────────────────────

/**
 * Логин использует application/x-www-form-urlencoded — это требование OAuth2/FastAPI.
 */
export const apiLogin = async (username, password) => {
  const url = `${BASE_URL}/auth/login`;
  console.log("🔐 Login URL:", url); // Для отладки
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username, password }),
  });

  console.log("📡 Login response status:", response.status); // Для отладки

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("❌ Login error:", errorData); // Для отладки
    throw new Error(errorData.detail || "Неверный логин или пароль");
  }

  const data = await response.json();
  console.log("✅ Login success, token received"); // Для отладки
  return data; // { access_token, token_type }
};