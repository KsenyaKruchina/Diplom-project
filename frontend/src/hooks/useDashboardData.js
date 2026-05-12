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

export const useDashboardData = () => {
  const [locations, setLocations]   = useState([]);
  const [sensors,   setSensors]     = useState([]);
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
      const [locs, sens, alm] = await Promise.all([
        getLocations().catch(() => []),
        getSensors().catch(() => []),
        getAlarms({ status: null, limit: 50 }).catch(() => []),
      ]);

      if (!mountedRef.current) return;

      setLocations(locs || []);
      setSensors(sens || []);
      setAlarms(alm || []);

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
    // Синхронизация позиций датчиков на мнемосхеме 
    // Когда Flutter (или другой браузер) сохраняет позицию датчика через
    // PATCH /sensors/{id}, сервер рассылает это событие всем WS-клиентам.
    // Обновляем только координаты конкретного датчика — без перезагрузки списка.
    const unsubPosition = wsService.on("sensor_position_updated", (data) => {
      // data = { type, sensor_id, pos_x, pos_y }
      if (!mountedRef.current) return;
      setSensors((prev) =>
        prev.map((s) =>
          s.id === data.sensor_id
            ? { ...s, pos_x: data.pos_x, pos_y: data.pos_y } // обновляем только координаты
            : s
        )
      );
    });

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

    return () => {
      unsubPosition();
      unsubMeasurement();
      unsubAlarm();
    };
  }, []);

  //  Вернуть данные 

  return {
    locations,  // LocationGroup[]
    sensors,    // Sensor[]
    telemetry,  // Map<sensorId, { temperature, humidity, timestamp }>
    alarms,     // AlarmEvent[]
    loading,
    error,
    refetch: fetchAll, // вызови вручную для обновления
  };
};