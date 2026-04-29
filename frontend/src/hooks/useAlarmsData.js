// frontend/src/hooks/useAlarmsData.js
// ─── Хук для страницы Уведомления (Reports) ───────────────────────────────────
//
// Загружает тревоги, поддерживает обновление статуса и live-апдейты.

import { useState, useEffect, useCallback, useRef } from "react";
import { getAlarms, updateAlarmStatus } from "../services/alarmsService";
import { wsService } from "../services/websocketService";

/**
 * Преобразует AlarmEvent из API в строку таблицы Reports.jsx
 */
const alarmToRow = (alarm, index) => {
  const severityMap = {
    critical: "high",
    warning:  "medium",
  };
  const typeMap = {
    temperature:      "Высокая температура",
    humidity:         "Высокая влажность",
    connection_lost:  "Потеря связи",
    low_battery:      "Низкий заряд батареи",
  };
  const statusMap = {
    new:          "active",
    acknowledged: "inwork",
    resolved:     "resolved",
  };

  const dt = alarm.timestamp ? new Date(alarm.timestamp + "Z") : new Date();
  const fmt = (d) =>
    d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" }) +
    " " +
    d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

  const resolvedDt = alarm.resolved_at ? new Date(alarm.resolved_at + "Z") : null;

  return {
    id:          String(alarm.id).padStart(4, "0"),
    _apiId:      alarm.id,           // настоящий ID для PATCH-запросов
    priority:    severityMap[alarm.severity] || "medium",
    eventType:   typeMap[alarm.alarm_type] || alarm.alarm_type || "Событие",
    assignee:    alarm.resolved_by_id ? `Оператор #${alarm.resolved_by_id}` : "Не назначен",
    description: alarm.description || "—",
    status:      statusMap[alarm.status] || "active",
    eventTime:   fmt(dt),
    resolveTime: resolvedDt ? fmt(resolvedDt) : "—",
  };
};

export const useAlarmsData = () => {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const mountedRef = useRef(true);

  // ─── Загрузить тревоги ──────────────────────────────────────────────────────

  const fetchAlarms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAlarms({ limit: 200 });
      if (!mountedRef.current) return;
      setRows((data || []).map((a, i) => alarmToRow(a, i)));
    } catch (err) {
      if (mountedRef.current) setError(err.message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  // ─── Обновить статус тревоги через API ─────────────────────────────────────

  /**
   * Обновить статус строки.
   * @param {string} rowId - строковый id ("0001")
   * @param {"active"|"inwork"|"resolved"} uiStatus
   * @param {string|null} comment
   */
  const updateRowStatus = useCallback(async (rowId, uiStatus, comment = null) => {
    const row = rows.find(r => r.id === rowId);
    if (!row) return;

    const apiStatusMap = {
      active:   "new",
      inwork:   "acknowledged",
      resolved: "resolved",
    };
    const apiStatus = apiStatusMap[uiStatus] || uiStatus;

    try {
      await updateAlarmStatus(row._apiId, apiStatus, comment);
      // Обновляем локально без перезагрузки
      setRows(prev => prev.map(r =>
        r.id === rowId ? { ...r, status: uiStatus, assignee: r.assignee } : r
      ));
    } catch (err) {
      console.error("Ошибка обновления статуса:", err);
    }
  }, [rows]);

  // ─── Обновить исполнителя (только локально — API не поддерживает) ──────────

  const updateRowAssignee = useCallback((rowId, assignee) => {
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, assignee } : r));
  }, []);

  // ─── Обновить описание (только локально) ───────────────────────────────────

  const updateRowDescription = useCallback((rowId, description) => {
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, description } : r));
  }, []);

  // ─── Монтирование + WebSocket ───────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    fetchAlarms();

    // При новом тревоге — перезагружаем
    const unsubNew = wsService.on("new_measurement", (data) => {
      if (data.is_alarm && mountedRef.current) fetchAlarms();
    });

    // При изменении тревоги — перезагружаем
    const unsubUpd = wsService.on("alarm_updated", () => {
      if (mountedRef.current) fetchAlarms();
    });

    return () => {
      mountedRef.current = false;
      unsubNew();
      unsubUpd();
    };
  }, [fetchAlarms]);

  return {
    rows,
    loading,
    error,
    refetch:           fetchAlarms,
    updateRowStatus,
    updateRowAssignee,
    updateRowDescription,
  };
};