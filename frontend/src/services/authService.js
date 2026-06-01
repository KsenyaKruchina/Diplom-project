// frontend/src/services/authService.js
// ─── Сервис авторизации ───────────────────────────────────────────────────────

import { apiLogin, apiPublicRequest, apiRequest, setToken, removeToken, getToken } from "./api";

/**
 * Войти в систему.
 * Сохраняет токен в localStorage.
 * @returns {object} { access_token, token_type }
 */
export const login = async (username, password) => {
  const data = await apiLogin(username, password);
  setToken(data.access_token);
  return data;
};

/**
 * Выйти из системы — удаляет токен.
 */
export const logout = () => {
  removeToken();
};

/**
 * Получить данные текущего пользователя.
 * @returns {object} { id, username, full_name, role, email }
 */
export const getCurrentUser = async () => {
  return apiRequest("/users/me");
};

/**
 * Обновить профиль текущего авторизованного пользователя.
 * Backend сам определяет пользователя по JWT, user_id с фронта не отправляем.
 * @param {object} profileData - { full_name?, email? }
 * @returns {object} User
 */
export const updateCurrentUser = async (profileData) => {
  return apiRequest("/users/me", {
    method: "PATCH",
    body: JSON.stringify(profileData),
  });
};

const requestWithFallback = async (paths, options) => {
  let lastError;
  for (const path of paths) {
    try {
      return await apiPublicRequest(path, options);
    } catch (err) {
      lastError = err;
      if (err?.status !== 404 && err?.status !== 405) break;
    }
  }
  throw lastError;
};

/**
 * Запросить 6-значный код восстановления пароля.
 * @param {string} identifier - email или username
 */
export const requestPasswordRecovery = async (identifier) => {
  return requestWithFallback(["/auth/password-recovery", "/password-recovery"], {
    method: "POST",
    body: JSON.stringify({ identifier, source: "web" }),
  });
};

/**
 * Подтвердить 6-значный код и задать новый пароль.
 * token — сырой код из письма, не хэш.
 */
export const confirmPasswordReset = async ({ token, new_password }) => {
  return requestWithFallback(["/auth/reset-password-confirm", "/password-reset/confirm"], {
    method: "POST",
    body: JSON.stringify({ token, new_password }),
  });
};

/**
 * Проверить, авторизован ли пользователь (есть ли токен).
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return Boolean(getToken());
};

/**
 * Получить список всех пользователей (только admin).
 * @returns {Array}
 */
export const getAllUsers = async (skip = 0, limit = 100) => {
  return apiRequest(`/users/?skip=${skip}&limit=${limit}`);
};

/**
 * Зарегистрировать нового пользователя.
 * @param {object} userData - { username, password, full_name, role, location_id?, email? }
 * @returns {object} User
 */
export const registerUser = async (userData) => {
  return apiRequest("/users/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
};

/**
 * Получить журнал действий.
 * @returns {Array} AuditLog[]
 */
export const getAuditLogs = async (skip = 0, limit = 100) => {
  return apiRequest(`/users/audit-logs?skip=${skip}&limit=${limit}`);
};
