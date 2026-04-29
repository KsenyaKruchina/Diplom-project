// frontend/src/services/authService.js
// ─── Сервис авторизации ───────────────────────────────────────────────────────

import { apiLogin, apiRequest, setToken, removeToken, getToken } from "./api";

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