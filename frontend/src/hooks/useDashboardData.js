// frontend/src/hooks/useDashboardData.js
//  Хук для загрузки всех данных Dashboard 
//
// Загружает: локации, датчики, последнюю телеметрию, тревоги.
// Обновляется через WebSocket при приходе новых данных.
//
// Использование в Dashboard.jsx:
//   const { locations, sensors, telemetry, alarms, loading, error, refetch } = useDashboardData();

import { useState, useEffect, useCallback, useRef } from "react";
import { getLocations } from "../services/locationsService";
import { getSensors } from "../services/sensorsService";
import { getLatestForSensors } from "../services/telemetryService";
import { getAlarms } from "../services/alarmsService";
import { wsService } from "../services/websocketService";
import { apiRequest } from "../services/api";

export const useDashboardData = () => {
  const [locations, setLocations]   = useState([]);
  const [sensors,   setSensors]     = useState([]);
  const [controlUnits, setControlUnits] = useState([]);
  const [telemetry, setTelemetry]   = useState(new Map()); // sensorId -> { temperature, humidity, timestamp }
  const [alarms,    setAlarms]      = useState([]);
  const [loading,   setLoading]     = useState(true);
  const [error,     setError]       = useState(null);

  const mountedRef = useRef(true);

  // Загрузить все данные 

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Загружаем параллельно
      const [locs, sens, alm, units] = await Promise.all([
        getLocations().catch(() => []),
        getSensors().catch(() => []),
        getAlarms({ status: null, limit: 50 }).catch(() => []),
        apiRequest("/control-units/").catch(() => []),
      ]);

      if (!mountedRef.current) return;

      setLocations(locs || []);
      setSensors(sens || []);
      setAlarms(alm || []);
      setControlUnits(Array.isArray(units) ? units : []);

      // Загружаем телеметрию для каждого датчика
      if (sens && sens.length > 0) {
        const sensorIds = sens.map((s) => s.id);
        const telMap = await getLatestForSensors(sensorIds);
        if (mountedRef.current) setTelemetry(telMap);
      }
    } catch (err) {
      if (mountedRef.current) setError(err.message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  //  Начальная загрузка 

  useEffect(() => {
    mountedRef.current = true;
    fetchAll();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchAll]);

  //  WebSocket: обновление телеметрии в реальном времени 

  useEffect(() => {
    const applySensorPosition = (data) => {
      // data = { type, sensor_id, pos_x, pos_y }
      if (!mountedRef.current) return;
      setSensors((prev) =>
        prev.map((s) =>
          s.id === data.sensor_id
            ? { ...s, pos_x: data.pos_x, pos_y: data.pos_y } // обновляем только координаты
            : s
        )
      );
    };

    // Синхронизация позиций датчиков на мнемосхеме.
    // Основное событие по контракту: sensor_position.
    // sensor_position_updated оставлен для совместимости со старым бэком.
    const unsubPosition = wsService.on("sensor_position", applySensorPosition);
    const unsubPositionLegacy = wsService.on("sensor_position_updated", applySensorPosition);

    // Обработчик нового измерения
    const unsubMeasurement = wsService.on("new_measurement", (data) => {
      // data = { type, sensor_id, sensor_name, temp, hum, is_alarm }
      if (!mountedRef.current) return;

      setTelemetry((prev) => {
        const next = new Map(prev);
        next.set(data.sensor_id, {
          temperature: data.temp,
          humidity: data.hum,
          timestamp: new Date().toISOString(),
        });
        return next;
      });

      // Если пришёл новый алларм — перезагружаем список тревог
      if (data.is_alarm) {
        getAlarms({ status: null, limit: 50 })
          .then((alm) => {
            if (mountedRef.current) setAlarms(alm || []);
          })
          .catch(() => {});
      }
    });

    // Обработчик обновления статуса тревоги
    const unsubAlarm = wsService.on("alarm_updated", () => {
      if (!mountedRef.current) return;
      getAlarms({ status: null, limit: 50 })
        .then((alm) => {
          if (mountedRef.current) setAlarms(alm || []);
        })
        .catch(() => {});
    });

    const refreshStructure = () => {
      if (mountedRef.current) fetchAll();
    };

    const unsubSensorCreated = wsService.on("sensor_created", refreshStructure);
    const unsubSensorUpdated = wsService.on("sensor_updated", refreshStructure);
    const unsubSensorDeleted = wsService.on("sensor_deleted", refreshStructure);
    const unsubUnitCreated = wsService.on("control_unit_created", refreshStructure);
    const unsubUnitUpdated = wsService.on("control_unit_updated", refreshStructure);
    const unsubLocationCreated = wsService.on("location_created", refreshStructure);

    return () => {
      unsubPosition();
      unsubPositionLegacy();
      unsubMeasurement();
      unsubAlarm();
      unsubSensorCreated();
      unsubSensorUpdated();
      unsubSensorDeleted();
      unsubUnitCreated();
      unsubUnitUpdated();
      unsubLocationCreated();
    };
  }, [fetchAll]);

  //  Вернуть данные 

  return {
    locations,  // LocationGroup[]
    sensors,    // Sensor[]
    controlUnits,
    telemetry,  // Map<sensorId, { temperature, humidity, timestamp }>
    alarms,     // AlarmEvent[]
    loading,
    error,
    refetch: fetchAll, // вызови вручную для обновления
  };
};
