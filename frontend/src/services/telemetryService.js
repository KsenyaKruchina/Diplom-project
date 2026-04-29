// frontend/src/services/telemetryService.js
// ─── Сервис телеметрии ────────────────────────────────────────────────────────

import { apiRequest } from "./api";

/**
 * Получить последнее измерение датчика.
 * @param {number} sensorId
 * @returns {{ id, sensor_id, temperature, humidity, timestamp } | null}
 */
export const getLatestTelemetry = async (sensorId) => {
  return apiRequest(`/telemetry/${sensorId}/latest`);
};

/**
 * Получить историю измерений датчика.
 * @param {number} sensorId
 * @param {object} options
 * @param {string} options.period - "1h" | "6h" | "24h" | "7d" | "30d"
 * @param {string|null} options.dateFrom - ISO datetime (альтернатива period)
 * @param {string|null} options.dateTo - ISO datetime
 * @param {number} options.limit - макс. количество записей (default 1000)
 * @returns {Array} Measurement[]
 */
export const getTelemetryHistory = async (
  sensorId,
  { period = "24h", dateFrom = null, dateTo = null, limit = 1000 } = {}
) => {
  const params = new URLSearchParams();
  if (period) params.append("period", period);
  if (dateFrom) params.append("date_from", dateFrom);
  if (dateTo) params.append("date_to", dateTo);
  params.append("limit", String(limit));

  return apiRequest(`/telemetry/${sensorId}/history?${params.toString()}`);
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