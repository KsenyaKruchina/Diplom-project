// frontend/src/services/sensorsService.js
// ─── Сервис датчиков ──────────────────────────────────────────────────────────

import { apiRequest } from "./api";

/**
 * Получить список датчиков.
 * admin видит все, editor/viewer — только своей локации.
 * @returns {Array} Sensor[]
 */
export const getSensors = async () => {
  return apiRequest("/sensors/");
};

/**
 * Получить один датчик по ID.
 * @param {number} sensorId
 * @returns {object} Sensor
 */
export const getSensor = async (sensorId) => {
  return apiRequest(`/sensors/${sensorId}`);
};

/**
 * Создать новый датчик (только admin).
 * @param {object} sensorData
 * @param {string} sensorData.name
 * @param {number|null} sensorData.group_id
 * @param {number|null} sensorData.control_unit_id
 * @param {string|null} sensorData.internal_id
 * @param {number} sensorData.pos_x - координата X в пикселях на плане
 * @param {number} sensorData.pos_y - координата Y в пикселях на плане
 * @param {number|null} sensorData.warning_min_temp
 * @param {number|null} sensorData.warning_max_temp
 * @param {number|null} sensorData.alarm_min_temp
 * @param {number|null} sensorData.alarm_max_temp
 * @param {number|null} sensorData.alarm_max_hum
 * @param {number} sensorData.alarm_delay_seconds
 * @returns {object} Sensor
 */
export const createSensor = async (sensorData) => {
  return apiRequest("/sensors/create_sensor", {
    method: "POST",
    body: JSON.stringify(sensorData),
  });
};

/**
 * Обновить название или позицию датчика (admin и editor).
 * @param {number} sensorId
 * @param {object} updates - { name?, pos_x?, pos_y? }
 * @returns {object} Sensor
 */
export const updateSensor = async (sensorId, updates) => {
  return apiRequest(`/sensors/${sensorId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
};

/**
 * Обновить пороги тревог датчика (admin и editor).
 * @param {number} sensorId
 * @param {object} thresholds
 * @param {number|null} thresholds.warning_min_temp
 * @param {number|null} thresholds.warning_max_temp
 * @param {number|null} thresholds.warning_min_hum
 * @param {number|null} thresholds.warning_max_hum
 * @param {number|null} thresholds.alarm_min_temp
 * @param {number|null} thresholds.alarm_max_temp
 * @param {number|null} thresholds.alarm_min_hum
 * @param {number|null} thresholds.alarm_max_hum
 * @param {number} thresholds.alarm_delay_seconds
 * @returns {object} Sensor
 */
export const updateSensorThresholds = async (sensorId, thresholds) => {
  return apiRequest(`/sensors/${sensorId}/thresholds`, {
    method: "PATCH",
    body: JSON.stringify(thresholds),
  });
};

// ─── Вспомогательные функции для вычисления статуса ──────────────────────────

/**
 * Определить статус температуры по порогам из датчика.
 * Возвращает "problem" | "warning" | "normal"
 * @param {number} temp
 * @param {object} sensor - объект Sensor с полями alarm_* / warning_*
 * @returns {string}
 */
export const getTempStatusFromSensor = (temp, sensor) => {
  if (temp === null || temp === undefined) return "normal";
  const v = parseFloat(temp);
  if (
    (sensor.alarm_min_temp !== null && v < sensor.alarm_min_temp) ||
    (sensor.alarm_max_temp !== null && v > sensor.alarm_max_temp)
  )
    return "problem";
  if (
    (sensor.warning_min_temp !== null && v < sensor.warning_min_temp) ||
    (sensor.warning_max_temp !== null && v > sensor.warning_max_temp)
  )
    return "warning";
  return "normal";
};

/**
 * Определить статус влажности по порогам из датчика.
 * @param {number} hum
 * @param {object} sensor
 * @returns {string}
 */
export const getHumStatusFromSensor = (hum, sensor) => {
  if (hum === null || hum === undefined) return "normal";
  const v = parseFloat(hum);
  if (
    (sensor.alarm_min_hum !== null && v < sensor.alarm_min_hum) ||
    (sensor.alarm_max_hum !== null && v > sensor.alarm_max_hum)
  )
    return "problem";
  if (
    (sensor.warning_min_hum !== null && v < sensor.warning_min_hum) ||
    (sensor.warning_max_hum !== null && v > sensor.warning_max_hum)
  )
    return "warning";
  return "normal";
};

/**
 * Простой fallback (если нет порогов из API) — как было раньше.
 */
export const getTempStatus = (v) => {
  const n = parseFloat(v);
  return isNaN(n) ? "normal" : n >= 30 ? "problem" : n >= 25 ? "warning" : "normal";
};

export const getHumStatus = (v) => {
  const n = parseFloat(v);
  return isNaN(n) ? "normal" : n < 30 || n > 70 ? "warning" : "normal";
};