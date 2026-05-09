// frontend/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { login as loginService, logout as logoutService, getCurrentUser } from "../services/authService";
import { isAuthenticated } from "../services/authService";
import { wsService } from "../services/websocketService";
import { getUserLocations } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [userLocations, setUserLocations] = useState([]);

  const fetchUserLocations = useCallback(async () => {
    if (!isAuthenticated()) return;
    try {
      const locations = await getUserLocations();
      setUserLocations(locations || []);
    } catch (err) {
      console.error("Failed to fetch user locations:", err);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      if (isAuthenticated()) {
        try {
          const userData = await getCurrentUser();
          setUser(userData);
          await fetchUserLocations();
          wsService.connect();
        } catch {
          logoutService();
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
    return () => { wsService.disconnect(); };
  }, [fetchUserLocations]);

  const login = useCallback(async (username, password) => {
    setError(null);
    try {
      await loginService(username, password);
      const userData = await getCurrentUser();
      setUser(userData);
      await fetchUserLocations();
      wsService.connect();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchUserLocations]);

  const logout = useCallback(() => {
    logoutService();
    wsService.disconnect();
    setUser(null);
    setUserLocations([]);
  }, []);

  const role = user?.role ?? null;

  const value = {
    user,
    userLocations, // ← список ID локаций, к которым имеет доступ пользователь
    loading,
    error,
    login,
    logout,
    role,

    isAdmin:  role === "admin",
    isEditor: role === "editor",
    isViewer: role === "viewer",

    // ─── Флаги доступа ───────────────────────────────────────────────────────

    // Редактирование порогов датчиков — admin + editor
    canEdit: role === "admin" || role === "editor",

    // Создание датчиков — только admin
    canCreateSensor: role === "admin",

    // Создание/удаление локаций — только admin
    canCreateLocation: role === "admin",

    // Изменение порядка локаций и датчиков — только admin
    canReorder: role === "admin",

    // Перемещение датчиков на плане — admin + editor
    canMoveSensors: role === "admin" || role === "editor",

    // Просмотр пользователей — admin + editor
    canViewUsers: role === "admin" || role === "editor",

    // Просмотр локаций и датчиков — все авторизованные
    canViewLocations: role === "admin" || role === "editor" || role === "viewer",
    
    // Вспомогательная функция для проверки доступа к датчику
    canAccessLocation: (locationId) => {
      if (role === "admin") return true;
      return userLocations.some(loc => loc.id === locationId);
    },
    
    canAccessSensor: (sensorGroupId) => {
      if (role === "admin") return true;
      return userLocations.some(loc => loc.id === sensorGroupId);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth должен использоваться внутри <AuthProvider>");
  return ctx;
};