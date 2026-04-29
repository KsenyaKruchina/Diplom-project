// frontend/src/hooks/useAnalyticsData.js
// ─── Хук для страницы Аналитики ───────────────────────────────────────────────
//
// Использует apiRequest из api.js — тот же клиент что и везде в проекте.
// Токен подхватывается автоматически через getToken() внутри apiRequest.

import { useState, useEffect, useCallback, useRef } from "react";
import { apiRequest } from "../services/api";
import { wsService } from "../services/websocketService";

// ─── Прореживание массива до нужного кол-ва точек ────────────────────────────
const downsample = (arr, target) => {
  if (!arr || arr.length === 0) return [];
  if (arr.length <= target) return arr;
  const step = arr.length / target;
  return Array.from({ length: target }, (_, i) => arr[Math.floor(i * step)]);
};

// ─── Извлечение temp/hum из массива measurements ─────────────────────────────
const extractSeries = (measurements = [], targetPoints = 100) => {
  const sorted = [...measurements].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );
  const sampled = downsample(sorted, targetPoints);
  return {
    temp:       sampled.map((m) => m.temperature),
    hum:        sampled.map((m) => m.humidity),
    timestamps: sampled.map((m) => m.timestamp),
  };
};

// Сколько точек показывать на графике для каждого периода
const CHART_POINTS = { day: 24, week: 48, month: 60, year: 52 };

// Сколько записей запрашивать с API для каждого периода
const API_LIMITS = { day: 96, week: 336, month: 720, year: 1000 };

// ─── Главный хук ──────────────────────────────────────────────────────────────
export const useAnalyticsData = () => {
  const [sensors,     setSensors]     = useState([]);
  const [locations,   setLocations]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [loadError,   setLoadError]   = useState("");

  const [history,     setHistory]     = useState({ temp: [], hum: [], timestamps: [] });
  const [histLoading, setHistLoading] = useState(false);
  const [histError,   setHistError]   = useState("");

  // Ref чтобы WebSocket-обработчик знал текущий активный датчик
  const activeSensorId = useRef(null);

  // ── Загрузить датчики и локации при монтировании ──────────────────────────
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setLoadError("");
      try {
        // Датчики — доступны всем авторизованным пользователям
        const sensorsData = await apiRequest("/sensors/");
        if (!cancelled) setSensors(Array.isArray(sensorsData) ? sensorsData : []);

        // Локации — только для admin (при 403 apiRequest выбрасывает ошибку)
        try {
          const locData = await apiRequest("/locations/");
          if (!cancelled) setLocations(Array.isArray(locData) ? locData : []);
        } catch {
          // Не admin — нормальная ситуация, оставляем []
          if (!cancelled) setLocations([]);
        }
      } catch (err) {
        if (!cancelled) setLoadError(err.message || "Ошибка загрузки");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  // ── Подписка на WebSocket для live-обновлений ─────────────────────────────
  useEffect(() => {
    // Используем существующий wsService из проекта
    // wsService.on() возвращает функцию отписки
    const unsubscribe = wsService.on("new_measurement", (event) => {
      if (activeSensorId.current && event.sensor_id === activeSensorId.current) {
        setHistory((prev) => {
          const temp = [...prev.temp, event.temp].slice(-500);
          const hum  = [...prev.hum,  event.hum].slice(-500);
          const ts   = [...prev.timestamps, new Date().toISOString()].slice(-500);
          return { temp, hum, timestamps: ts };
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // ── Загрузить историю для выбранного датчика ──────────────────────────────
  /**
   * @param {number} sensorId
   * @param {{ period?: string, dateFrom?: string, dateTo?: string }} options
   *   period   — API-значение: last_24_hours | last_week | last_month | last_year
   *   dateFrom — ISO-строка начала (для произвольного диапазона)
   *   dateTo   — ISO-строка конца
   */
  const fetchHistory = useCallback(async (sensorId, options = {}) => {
    if (!sensorId) return;

    activeSensorId.current = sensorId;
    setHistLoading(true);
    setHistError("");

    try {
      let measurements = [];

      if (options.dateFrom && options.dateTo) {
        // Произвольный диапазон — берём максимум и фильтруем на клиенте
        const data = await apiRequest(`/telemetry/${sensorId}/history?limit=1000`);
        const all  = data?.measurements || [];
        const from = new Date(options.dateFrom);
        const to   = new Date(options.dateTo);
        measurements = all.filter((m) => {
          const t = new Date(m.timestamp);
          return t >= from && t <= to;
        });

        const series = extractSeries(measurements, 60);
        setHistory(series);
        return;
      }

      // Определяем UI-период из API-периода для прореживания
      const uiPeriodMap = {
        last_24_hours: "day",
        last_week:     "week",
        last_month:    "month",
        last_year:     "year",
      };
      const uiPeriod = uiPeriodMap[options.period] || "month";

      if (options.period === "last_24_hours") {
        // Специальный эндпоинт для 24 часов
        const data = await apiRequest(`/telemetry/${sensorId}/last-24h`);
        measurements = data?.measurements || [];
      } else {
        const limit = API_LIMITS[uiPeriod] || 500;
        const data  = await apiRequest(`/telemetry/${sensorId}/history?limit=${limit}`);
        measurements = data?.measurements || [];
      }

      const targetPoints = CHART_POINTS[uiPeriod] || 60;
      const series = extractSeries(measurements, targetPoints);
      setHistory(series);
    } catch (err) {
      setHistError(err.message || "Ошибка загрузки истории");
      setHistory({ temp: [], hum: [], timestamps: [] });
    } finally {
      setHistLoading(false);
    }
  }, []);

  // ── Опции для Dropdown-компонентов ────────────────────────────────────────
  const sensorOptions = sensors.map((s) => ({
    value: String(s.id),
    label: `${s.name}${s.is_online === false ? " (офлайн)" : ""}`,
  }));

  const locationOptions = locations.map((l) => ({
    value: String(l.id),
    label: l.name,
  }));

  return {
    sensorOptions,
    locationOptions,
    sensors,
    locations,
    loading,
    loadError,
    histLoading,
    histError,
    history,
    fetchHistory,
  };
};

export default useAnalyticsData;