// frontend/src/hooks/useAnalyticsData.js
// ─── Хук для страницы Аналитики ───────────────────────────────────────────────

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

const CHART_POINTS = { day: 24, week: 48, month: 60, year: 52 };
const API_LIMITS   = { day: 96, week: 336, month: 720, year: 1000 };

// ─── Главный хук ──────────────────────────────────────────────────────────────
export const useAnalyticsData = () => {
  const [sensors,      setSensors]      = useState([]);
  const [locations,    setLocations]    = useState([]);
  const [controlUnits, setControlUnits] = useState([]);   // ← ЦБУ
  const [loading,      setLoading]      = useState(true);
  const [loadError,    setLoadError]    = useState("");

  const [history,     setHistory]     = useState({ temp: [], hum: [], timestamps: [] });
  const [histLoading, setHistLoading] = useState(false);
  const [histError,   setHistError]   = useState("");

  const activeSensorId = useRef(null);

  // ── Загрузить датчики, локации и ЦБУ при монтировании ───────────────────
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setLoadError("");
      try {
        // Параллельно грузим всё — каждый запрос независим
        const [sensorsResult, locResult, cuResult] = await Promise.allSettled([
          apiRequest("/sensors/"),
          apiRequest("/locations/"),
          apiRequest("/control-units/"),
        ]);

        if (cancelled) return;

        if (sensorsResult.status === "fulfilled") {
          setSensors(Array.isArray(sensorsResult.value) ? sensorsResult.value : []);
        }

        if (locResult.status === "fulfilled") {
          setLocations(Array.isArray(locResult.value) ? locResult.value : []);
        }
        // 403 для не-admin — нормально, оставляем []

        if (cuResult.status === "fulfilled") {
          setControlUnits(Array.isArray(cuResult.value) ? cuResult.value : []);
        }
        // 403 для не-admin — нормально, оставляем []

      } catch (err) {
        if (!cancelled) setLoadError(err.message || "Ошибка загрузки");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  // ── WebSocket: live-обновления ────────────────────────────────────────────
  useEffect(() => {
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

  // ── Загрузить историю для выбранного датчика ─────────────────────────────
  const fetchHistory = useCallback(async (sensorId, options = {}) => {
    if (!sensorId) return;

    activeSensorId.current = sensorId;
    setHistLoading(true);
    setHistError("");

    try {
      let measurements = [];

      if (options.dateFrom && options.dateTo) {
        const data = await apiRequest(`/telemetry/${sensorId}/history?limit=1000`);
        const all  = data?.measurements || [];
        const from = new Date(options.dateFrom);
        const to   = new Date(options.dateTo);
        measurements = all.filter((m) => {
          const t = new Date(m.timestamp);
          return t >= from && t <= to;
        });
        setHistory(extractSeries(measurements, 60));
        return;
      }

      const uiPeriodMap = {
        last_24_hours: "day",
        last_week:     "week",
        last_month:    "month",
        last_year:     "year",
      };
      const uiPeriod = uiPeriodMap[options.period] || "month";

      if (options.period === "last_24_hours") {
        const data = await apiRequest(`/telemetry/${sensorId}/last-24h`);
        measurements = data?.measurements || [];
      } else {
        const limit = API_LIMITS[uiPeriod] || 500;
        const data  = await apiRequest(`/telemetry/${sensorId}/history?limit=${limit}`);
        measurements = data?.measurements || [];
      }

      setHistory(extractSeries(measurements, CHART_POINTS[uiPeriod] || 60));
    } catch (err) {
      setHistError(err.message || "Ошибка загрузки истории");
      setHistory({ temp: [], hum: [], timestamps: [] });
    } finally {
      setHistLoading(false);
    }
  }, []);

  // ── Опции для Dropdown ────────────────────────────────────────────────────

  const sensorOptions = sensors.map((s) => ({
    value:       String(s.id),
    label:       `${s.name}${s.is_online === false ? " (офлайн)" : ""}`,
    location_id: s.location_id ?? s.group_id ?? null,
  }));

  const locationOptions = locations.map((l) => ({
    value: String(l.id),
    label: l.name,
  }));

  // Для ЦБУ добавляем location_id чтобы фильтр по роли работал в Analytics
  const controlUnitOptions = controlUnits.map((cu) => ({
    value:       String(cu.id),
    label:       cu.name ?? `ЦБУ #${cu.id}`,
    location_id: cu.location_id ?? cu.group_id ?? null,
  }));

  return {
    // данные
    sensors,
    locations,
    controlUnits,
    // опции для дропдаунов
    sensorOptions,
    locationOptions,
    controlUnitOptions,
    // состояние загрузки
    loading,
    loadError,
    // история телеметрии
    histLoading,
    histError,
    history,
    fetchHistory,
  };
};

export default useAnalyticsData;