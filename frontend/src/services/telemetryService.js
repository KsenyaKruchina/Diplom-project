// frontend/src/services/telemetryService.js
// ─── Сервис телеметрии ────────────────────────────────────────────────────────

import { apiRequest } from "./api";

/**
 * Получить последнее измерение датчика.
 * @param {number} sensorId
 * @returns {{ id, sensor_id, temperature, humidity, timestamp } | null}
 */
export const getLatestTelemetry = async (sensorId) => {
  const response = await apiRequest(`/telemetry/${sensorId}/history?limit=1`);
  const measurements = normalizeTelemetryHistory(response);
  if (measurements.length === 0) return null;

  return [...measurements].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  )[0];
};

/**
 * Нормализовать ответ бэкенда с историей телеметрии.
 *
 * Бэкенд может вернуть:
 *   1. Массив напрямую: [ { temperature, humidity, timestamp }, ... ]
 *   2. Объект с полем measurements: { measurements: [ ... ], total: N }
 *
 * Эта функция всегда возвращает массив.
 *
 * @param {Array|object} response
 * @returns {Array}
 */
const normalizeTelemetryHistory = (response) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.measurements)) return response.measurements;
  return [];
};

/**
 * Получить историю измерений датчика за последние 24 часа.
 * @param {number} sensorId
 * @param {number} limit - макс. количество записей (default 96)
 * @returns {Array} Measurement[]
 */
export const getTelemetryLast24h = async (sensorId, limit = 96) => {
  const response = await apiRequest(
    `/telemetry/${sensorId}/last-24h?limit=${limit}`
  );
  return normalizeTelemetryHistory(response);
};

/**
 * Получить историю измерений датчика.
 * @param {number} sensorId
 * @param {object} options
 * @param {string} options.period - "1h" | "6h" | "24h" | "7d" | "30d"
 * @param {string|null} options.dateFrom - ISO datetime
 * @param {string|null} options.dateTo - ISO datetime
 * @param {number} options.limit - макс. количество записей (default 1000)
 * @returns {Array} Measurement[]
 */
export const getTelemetryHistory = async (
  sensorId,
  { period = "24h", dateFrom = null, dateTo = null, limit = 1000 } = {}
) => {
  const params = new URLSearchParams();
  if (period)   params.append("period",    period);
  if (dateFrom) params.append("date_from", dateFrom);
  if (dateTo)   params.append("date_to",   dateTo);
  params.append("limit", String(limit));

  const response = await apiRequest(
    `/telemetry/${sensorId}/history?${params.toString()}`
  );
  // Нормализуем: бэкенд может вернуть массив или { measurements: [...] }
  return normalizeTelemetryHistory(response);
};

/**
 * Получить последние данные сразу для нескольких датчиков.
 * Возвращает Map: sensorId -> { temperature, humidity, timestamp }
 *
 * @param {number[]} sensorIds
 * @returns {Map<number, object>}
 */
export const getLatestForSensors = async (sensorIds) => {
  const results = await Promise.allSettled(
    sensorIds.map((id) => getLatestTelemetry(id))
  );

  const map = new Map();
  sensorIds.forEach((id, index) => {
    const result = results[index];
    if (result.status === "fulfilled" && result.value) {
      map.set(id, result.value);
    } else {
      map.set(id, null);
    }
  });

  return map;
};

/**
 * Преобразовать историю телеметрии в формат для графика MiniChart.
 * Возвращает массив значений (только числа).
 *
 * @param {Array} history - Measurement[]
 * @param {"temperature"|"humidity"} field
 * @returns {number[]}
 */
export const historyToChartData = (history, field = "temperature") => {
  if (!history || history.length === 0) return [0, 0, 0, 0, 0, 0];
  return history.map((m) => parseFloat(m[field]) || 0);
};
