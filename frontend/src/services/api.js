// frontend/src/services/api.js
// Базовый API-клиент
// Все запросы к бэкенду идут через этот файл.
// Он автоматически подставляет токен и обрабатывает ошибки.

// URL из переменных окружения.
// В dev-режиме Vite проксирует /api → http://157.90.127.202:8000
// В продакшне nginx делает то же самое.
// Если нужно переопределить — задай VITE_API_BASE_URL в .env
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";
const FRONTEND_ORIGIN =
  typeof window !== "undefined" && window.location?.origin
    ? window.location.origin
    : "";

export const BACKEND_ORIGIN =
  import.meta.env.VITE_BACKEND_ORIGIN ||
  (BASE_URL.startsWith("http://") || BASE_URL.startsWith("https://")
    ? new URL(BASE_URL).origin
    : FRONTEND_ORIGIN);

const uniqueUrls = (urls) => [...new Set(urls.filter(Boolean))];

export const getUploadUrlCandidates = (imageUrl) => {
  if (!imageUrl) return [];

  const frontendOrigin = FRONTEND_ORIGIN || window.location.origin;
  const parsedUrl = new URL(imageUrl, frontendOrigin);
  const path = `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
  const isUpload = parsedUrl.pathname.startsWith("/uploads/");

  if (isUpload) {
    return uniqueUrls([path, `${frontendOrigin}${path}`]);
  }

  if (parsedUrl.origin === frontendOrigin) {
    return uniqueUrls([path]);
  }

  if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
    return uniqueUrls([path, BACKEND_ORIGIN && `${BACKEND_ORIGIN}${path}`]);
  }

  return uniqueUrls([parsedUrl.href]);
};

const withTrailingSlash = (url) => {
  const [base, hash = ""] = url.split("#");
  const [path, query = ""] = base.split("?");
  if (path.endsWith("/")) return url;
  return `${path}/${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
};

const shouldRetryWithTrailingSlash = (status, url) =>
  status === 405 && !new URL(url, FRONTEND_ORIGIN || window.location.origin).pathname.endsWith("/");

// ─── Токен хранится под одним ключом во всём приложении ──────────────────────
// ВАЖНО: ключ "token" — единственный используемый ключ.
// apiClient.js (старый файл) использовал "access_token" — это была ошибка.
export const getToken    = () => localStorage.getItem("token");
export const setToken    = (t) => localStorage.setItem("token", t);
export const removeToken = () => localStorage.removeItem("token");

// ─── Основная функция всех запросов ──────────────────────────────────────────
/**
 * Универсальная функция для всех HTTP-запросов.
 * Автоматически добавляет Authorization-заголовок.
 * При 401 — удаляет токен и редиректит на /login.
 *
 * @param {string} path - путь после BASE_URL, например "/sensors/"
 * @param {object} options - стандартные fetch-опции (method, body, headers...)
 * @returns {Promise<any>}
 */
export const apiRequest = async (path, options = {}) => {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = `${BASE_URL}${path}`;

  let response = await fetch(url, {
    ...options,
    headers,
  });

  if (shouldRetryWithTrailingSlash(response.status, url)) {
    response = await fetch(withTrailingSlash(url), {
      ...options,
      headers,
    });
  }

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
      // ignore JSON parse error
    }
    throw new Error(errorMessage);
  }

  // Если ответ пустой (например, 204 No Content)
  if (response.status === 204) return null;

  return response.json();
};

// ─── Публичные JSON-запросы без редиректа на /login ─────────────────────────
// Нужны для восстановления пароля, когда пользователь ещё не авторизован.
export const apiPublicRequest = async (path, options = {}) => {
  const url = `${BASE_URL}${path}`;
  let response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (shouldRetryWithTrailingSlash(response.status, url)) {
    response = await fetch(withTrailingSlash(url), {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  }

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
      // ignore JSON parse error
    }
    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

// ─── Специальная функция для multipart/form-data (загрузка файлов) ────────────
// Для загрузки файлов — НЕ ставим Content-Type, браузер сам добавит boundary.
export const apiUpload = async (path, formData, method = "POST") => {
  const token = getToken();

  const url = `${BASE_URL}${path}`;
  let response = await fetch(url, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (shouldRetryWithTrailingSlash(response.status, url)) {
    response = await fetch(withTrailingSlash(url), {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
  }

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

// ─── Специальная функция для скачивания бинарных файлов (blob) ───────────────
export const apiDownload = async (path, fallbackFilename) => {
  const token = getToken();

  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (response.status === 401) {
    removeToken();
    window.location.href = "/login";
    return;
  }

  if (!response.ok) {
    let msg = `Ошибка ${response.status}`;
    try {
      const err = await response.json();
      if (err.detail) msg = typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail);
    } catch {}
    throw new Error(msg);
  }

  let filename = fallbackFilename;
  const disposition = response.headers.get("Content-Disposition");
  if (disposition) {
    const match = disposition.match(/filename[^;=\n]*=([^;\n]*)/);
    if (match) filename = match[1].replace(/['"]/g, "").trim();
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

// ─── Специальная функция для логина (form-urlencoded) ─────────────────────────
// Логин использует application/x-www-form-urlencoded — это требование OAuth2/FastAPI.
export const apiLogin = async (username, password) => {
  const url = `${BASE_URL}/auth/login`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username, password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Неверный логин или пароль");
  }

  const data = await response.json();
  return data; // { access_token, token_type }
};

/**
 * Получение локаций пользователя с учётом роли.
 * - Admin: все локации
 * - Editor/Viewer: только свои локации (бэкенд фильтрует)
 */
export const getUserLocations = async () => {
  const data = await apiRequest("/locations/");
  return data || [];
};

/**
 * Получение датчиков пользователя с фильтрацией по локациям.
 * - Admin: все датчики
 * - Editor/Viewer: только датчики из своих локаций
 */
export const getUserSensors = async () => {
  const allSensors = await apiRequest("/sensors/");

  const userLocations = await getUserLocations();
  const userLocationIds = userLocations.map((loc) => loc.id);

  try {
    const userInfo = await apiRequest("/users/me");
    if (userInfo?.role === "admin") {
      return allSensors || [];
    }
  } catch (e) {
    console.error("Failed to get user role:", e);
  }

  if (userLocationIds.length > 0 && allSensors) {
    return allSensors.filter((sensor) =>
      userLocationIds.includes(sensor.group_id)
    );
  }

  return allSensors || [];
};

/**
 * Проверка доступа к датчику перед редактированием.
 * @param {number} sensorId
 * @returns {Promise<boolean>}
 */
export const canAccessSensor = async (sensorId) => {
  try {
    const userLocations = await getUserLocations();
    const userLocationIds = userLocations.map((loc) => loc.id);
    const sensor = await apiRequest(`/sensors/${sensorId}`);
    return userLocationIds.includes(sensor?.group_id);
  } catch {
    return false;
  }
};
