// frontend/src/context/AuthContext.jsx
// ─── Глобальный контекст авторизации ─────────────────────────────────────────
//
// Оборачивает всё приложение. Хранит текущего пользователя и токен.
// Используй хук useAuth() в любом компоненте.

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { login as loginService, logout as logoutService, getCurrentUser } from "../services/authService";
import { isAuthenticated } from "../services/authService";
import { wsService } from "../services/websocketService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);   // { id, username, full_name, role, email }
  const [loading, setLoading] = useState(true);   // Идёт ли начальная загрузка
  const [error, setError]     = useState(null);   // Ошибка входа

  // При старте приложения — проверяем токен и загружаем пользователя
  useEffect(() => {
    const initAuth = async () => {
      if (isAuthenticated()) {
        try {
          const userData = await getCurrentUser();
          setUser(userData);
          // Подключаем WebSocket после загрузки пользователя
          wsService.connect();
        } catch {
          // Токен невалидный — очищаем
          logoutService();
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();

    // При размонтировании отключаем WebSocket
    return () => {
      wsService.disconnect();
    };
  }, []);

  /**
   * Войти в систему.
   * @param {string} username
   * @param {string} password
   * @throws {Error} если логин/пароль неверные
   */
  const login = useCallback(async (username, password) => {
    setError(null);
    try {
      await loginService(username, password);
      const userData = await getCurrentUser();
      setUser(userData);
      wsService.connect();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Выйти из системы.
   */
  const logout = useCallback(() => {
    logoutService();
    wsService.disconnect();
    setUser(null);
  }, []);

  const value = {
    user,       // объект текущего пользователя или null
    loading,    // true пока идёт проверка токена
    error,      // строка ошибки или null
    login,
    logout,
    isAdmin:    user?.role === "admin",
    isEditor:   user?.role === "editor" || user?.role === "admin",
    isViewer:   Boolean(user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Хук для использования авторизации в компонентах.
 *
 * Пример:
 *   const { user, login, logout, isAdmin } = useAuth();
 */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth должен использоваться внутри <AuthProvider>");
  return ctx;
};