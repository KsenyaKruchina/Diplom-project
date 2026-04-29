// frontend/src/services/alarmsService.js
// ─── Сервис тревог ────────────────────────────────────────────────────────────

import { apiRequest } from "./api";

/**
 * Получить список тревог.
 * admin — все, editor/viewer — только своей локации.
 *
 * @param {object} filters
 * @param {string|null} filters.status - "new" | "acknowledged" | "resolved" | null (все)
 * @param {string|null} filters.severity - "warning" | "critical" | null (все)
 * @param {number|null} filters.sensorId - фильтр по датчику
 * @param {number} filters.skip
 * @param {number} filters.limit
 * @returns {Array} AlarmEvent[]
 */
export const getAlarms = async ({
  status = null,
  severity = null,
  sensorId = null,
  skip = 0,
  limit = 100,
} = {}) => {
  const params = new URLSearchParams();
  params.append("skip", String(skip));
  params.append("limit", String(limit));
  if (status) params.append("status", status);
  if (severity) params.append("severity", severity);
  if (sensorId) params.append("sensor_id", String(sensorId));

  return apiRequest(`/alarms/?${params.toString()}`);
};

/**
 * Получить одну тревогу по ID.
 * @param {number} alarmId
 * @returns {object} AlarmEvent
 */
export const getAlarm = async (alarmId) => {
  return apiRequest(`/alarms/${alarmId}`);
};

/**
 * Обновить статус тревоги (подтвердить или закрыть).
 * @param {number} alarmId
 * @param {"acknowledged"|"resolved"} status
 * @param {string|null} userComment
 * @returns {object} AlarmEvent
 */
export const updateAlarmStatus = async (alarmId, status, userComment = null) => {
  return apiRequest(`/alarms/${alarmId}`, {
    method: "PATCH",
    body: JSON.stringify({
      status,
      ...(userComment ? { user_comment: userComment } : {}),
    }),
  });
};

// ─── Вспомогательные функции ──────────────────────────────────────────────────

/**
 * Преобразовать тревогу из API в формат уведомлений для NotificationItem.
 *
 * @param {object} alarm - AlarmEvent из API
 * @returns {{ type, title, desc, location }}
 */
export const alarmToNotification = (alarm) => {
  const typeMap = {
    critical: "error",
    warning: "warning",
  };

  const titleMap = {
    temperature: "Высокая температура",
    humidity: "Высокая влажность",
    connection_lost: "Потеря связи",
    low_battery: "Низкий заряд батареи",
  };

  return {
    type: typeMap[alarm.severity] || "warning",
    title: titleMap[alarm.alarm_type] || "Тревога",
    desc: alarm.description,
    location: `Датчик #${alarm.sensor_id}`,
    alarmId: alarm.id,
    status: alarm.status,
  };
};

/**
 * Подсчитать количество тревог по типам.
 * @param {Array} alarms
 * @returns {{ critical: number, warning: number, new: number }}
 */
export const countAlarms = (alarms) => {
  return alarms.reduce(
    (acc, alarm) => {
      if (alarm.severity === "critical") acc.critical++;
      if (alarm.severity === "warning") acc.warning++;
      if (alarm.status === "new") acc.new++;
      return acc;
    },
    { critical: 0, warning: 0, new: 0 }
  );
};