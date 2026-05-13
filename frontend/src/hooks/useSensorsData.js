// frontend/src/hooks/useSensorsData.js
// Хук для страницы Датчики
//
// Загружает датчики, телеметрию, поддерживает live-обновления через WebSocket.

import { useState, useEffect, useCallback, useRef } from "react";
import { getSensors, updateSensorThresholds } from "../services/sensorsService";
import { getLocations } from "../services/locationsService";
import { getLatestForSensors, getTelemetryHistory } from "../services/telemetryService";
import { wsService } from "../services/websocketService";

export const useSensorsData = () => {
  const [sensors,   setSensors]   = useState([]);
  const [locations, setLocations] = useState([]);
  const [telemetry, setTelemetry] = useState(new Map()); // sensorId → { temperature, humidity, timestamp }
  const [histories, setHistories] = useState(new Map()); // sensorId → { dayTemp[], dayHum[], ... }
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const mountedRef  = useRef(true);
  // Ref для проверки уже загруженных историй без зависимости от состояния
  const loadedIds   = useRef(new Set());

  // ── Загрузить всё ──────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sens, locs] = await Promise.all([
        getSensors().catch(() => []),
        getLocations().catch(() => []),
      ]);

      if (!mountedRef.current) return;
      setSensors(sens || []);
      setLocations(locs || []);

      // Телеметрия — последние значения
      if (sens?.length) {
        const ids = sens.map((s) => s.id);
        const telMap = await getLatestForSensors(ids);
        if (mountedRef.current) setTelemetry(telMap);
      }
    } catch (err) {
      if (mountedRef.current) setError(err.message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  // ── Загрузить историю для конкретного датчика ──────────────────────────────
  // Используем ref вместо состояния для проверки "уже загружено",
  // чтобы не пересоздавать функцию при каждом изменении histories.

  const fetchSensorHistory = useCallback(async (sensorId) => {
    if (loadedIds.current.has(sensorId)) return; // уже загружено
    loadedIds.current.add(sensorId);

    try {
      const [day, week, month] = await Promise.all([
        getTelemetryHistory(sensorId, { period: "24h", limit: 24 }),
        getTelemetryHistory(sensorId, { period: "7d",  limit: 7  }),
        getTelemetryHistory(sensorId, { period: "30d", limit: 30 }),
      ]);

      const toValues = (arr, field) =>
        (arr || []).map((m) => parseFloat(m[field]) || 0);

      if (mountedRef.current) {
        setHistories((prev) => {
          const next = new Map(prev);
          next.set(sensorId, {
            dayTemp:  toValues(day,   "temperature"),
            dayHum:   toValues(day,   "humidity"),
            weekTemp: toValues(week,  "temperature"),
            weekHum:  toValues(week,  "humidity"),
            monTemp:  toValues(month, "temperature"),
            monHum:   toValues(month, "humidity"),
          });
          return next;
        });
      }
    } catch (err) {
      // Убираем из загруженных чтобы можно было повторить попытку
      loadedIds.current.delete(sensorId);
      console.error("Ошибка загрузки истории датчика:", err);
    }
  }, []); // нет зависимостей — функция стабильна

  // ── Обновить пороги через API ──────────────────────────────────────────────

  const saveThresholds = useCallback(async (sensorId, thresholds) => {
    await updateSensorThresholds(sensorId, {
      warning_min_temp:    thresholds.tempWarn   || null,
      warning_max_temp:    thresholds.tempAlert  || null,
      alarm_min_temp:      thresholds.tempMin    || null,
      alarm_max_temp:      thresholds.tempMax    || null,
      alarm_delay_seconds: 300,
    });
    // Обновляем локально
    setSensors((prev) =>
      prev.map((s) =>
        s.id === sensorId
          ? {
              ...s,
              alarm_min_temp:   parseFloat(thresholds.tempMin)   || s.alarm_min_temp,
              alarm_max_temp:   parseFloat(thresholds.tempMax)   || s.alarm_max_temp,
              warning_min_temp: parseFloat(thresholds.tempWarn)  || s.warning_min_temp,
              warning_max_temp: parseFloat(thresholds.tempAlert) || s.warning_max_temp,
            }
          : s
      )
    );
  }, []);

  // ── Монтирование / размонтирование ────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    fetchAll();

    // WebSocket: обновление текущих значений в реальном времени
    const unsub = wsService.on("new_measurement", (data) => {
      if (!mountedRef.current) return;
      setTelemetry((prev) => {
        const next = new Map(prev);
        next.set(data.sensor_id, {
          temperature: data.temp,
          humidity:    data.hum,
          timestamp:   new Date().toISOString(),
        });
        return next;
      });
    });

    return () => {
      mountedRef.current = false;
      unsub();
    };
  }, [fetchAll]);

  // ── Преобразовать данные для компонента SensorDetailCard ──────────────────

  /**
   * Преобразует датчик из API в формат, который ожидает Sensors.jsx.
   * Если история ещё не загружена — возвращает пустые массивы (не заглушки),
   * чтобы компонент показал состояние «данные загружаются».
   *
   * @param {object} sensor - объект Sensor из API
   * @returns {object}
   */
  const mapSensorToUI = useCallback(
    (sensor) => {
      const tel  = telemetry.get(sensor.id);
      const hist = histories.get(sensor.id);

      const temp     = tel ? parseFloat(tel.temperature) : null;
      const humidity = tel ? parseFloat(tel.humidity)    : null;

      // Определяем статус
      let statusKey = "ok";
      if (temp !== null) {
        if (
          (sensor.alarm_min_temp !== null && temp < sensor.alarm_min_temp) ||
          (sensor.alarm_max_temp !== null && temp > sensor.alarm_max_temp)
        )
          statusKey = "error";
        else if (
          (sensor.warning_min_temp !== null && temp < sensor.warning_min_temp) ||
          (sensor.warning_max_temp !== null && temp > sensor.warning_max_temp)
        )
          statusKey = "warn";
      }

      // Найти локацию
      const location = locations.find((l) => l.id === sensor.group_id);

      return {
        id:         String(sensor.id).padStart(4, "0"),
        _id:        sensor.id,
        name:       sensor.name,
        temp:       temp    ?? "—",
        humidity:   humidity ?? "—",
        statusKey,
        location:   location?.name || "Не указана",
        battery:    `${sensor.battery_level ?? 75}%`,
        power:      sensor.power_status === "power" ? "Сеть" : "Батарея",
        gsm:
          sensor.gsm_signal >= 3
            ? "Хорошо"
            : sensor.gsm_signal >= 1
            ? "Слабый"
            : "Нет",
        simBalance: sensor.sim_balance
          ? `₸ ${Math.round(sensor.sim_balance)}`
          : "—",
        updated: sensor.last_seen
          ? new Date(sensor.last_seen + "Z").toLocaleString("ru-RU", {
              hour:  "2-digit",
              minute: "2-digit",
              day:   "2-digit",
              month: "2-digit",
            })
          : "—",
        is_online: sensor.is_online,
        thresholds: {
          tempMin:   sensor.alarm_min_temp   ?? 10,
          tempMax:   sensor.alarm_max_temp   ?? 40,
          tempAlert: sensor.warning_max_temp ?? 35,
          tempWarn:  sensor.warning_min_temp ?? 8,
        },
        // Пустые массивы если история не загружена — компонент сам покажет заглушку
        dayData:      hist?.dayTemp  || [],
        weekData:     hist?.weekTemp || [],
        monthData:    hist?.monTemp  || [],
        humDayData:   hist?.dayHum   || [],
        humWeekData:  hist?.weekHum  || [],
        humMonthData: hist?.monHum   || [],
        historyLoaded: !!hist,
      };
    },
    [telemetry, histories, locations]
  );

  return {
    sensors,
    locations,
    telemetry,
    loading,
    error,
    refetch: fetchAll,
    fetchSensorHistory,
    saveThresholds,
    mapSensorToUI,
  };
};