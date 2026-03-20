// components/Sensors.jsx
import React, { useState, useEffect } from 'react';
import { microclimateService, microclimateUtils } from "../services/microclimateService";
import "./Sensors.css";

const Sensors = ({ logActivity }) => {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tempSliderValue, setTempSliderValue] = useState(22.0);
  const [humiditySliderValue, setHumiditySliderValue] = useState(45.0);
  const [showTempConfirm, setShowTempConfirm] = useState(false);
  const [showHumidityConfirm, setShowHumidityConfirm] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      fetchSensors(selectedLocation);
    }
  }, [selectedLocation]);

  const fetchLocations = async () => {
    try {
      const locationsData = await microclimateService.getLocations();
      const limitedLocations = locationsData.slice(0, 4);
      if (limitedLocations.length < 4) {
        for (let i = limitedLocations.length + 1; i <= 4; i++) {
          limitedLocations.push({ id: i, name: `Кабинет ${i}` });
        }
      }
      setLocations(limitedLocations);
      if (limitedLocations.length > 0 && !selectedLocation) {
        setSelectedLocation(limitedLocations[0].id);
      }
    } catch (error) {
      console.error('Ошибка загрузки локаций:', error);
      const defaultLocations = [
        { id: 1, name: 'Кабинет 1' },
        { id: 2, name: 'Кабинет 2' },
        { id: 3, name: 'Кабинет 3' },
        { id: 4, name: 'Кабинет 4' }
      ];
      setLocations(defaultLocations);
      setSelectedLocation(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchSensors = async (locationId) => {
    try {
      const sensorsData = await microclimateService.getSensors(locationId);
      setSensors(sensorsData);
      // Устанавливаем начальные значения слайдеров
      sensorsData.forEach(sensor => {
        if (sensor.sensor_type?.name === 'Temperature') {
          setTempSliderValue(sensor.target_value || 22.0);
        } else if (sensor.sensor_type?.name === 'Humidity') {
          setHumiditySliderValue(sensor.target_value || 45.0);
        }
      });
    } catch (error) {
      console.error('Ошибка загрузки датчиков:', error);
      // Случайные значения для демонстрации
      const randomTemp = 21.5 + Math.random() * 3;
      const randomHumidity = 44.3 + Math.random() * 5;
      
      setSensors([
        {
          id: 1,
          name: 'Кондиционер 1',
          sensor_type: { name: 'Temperature', unit: '°C' },
          is_active: true,
          target_value: 22.0,
          last_value: randomTemp
        },
        {
          id: 2,
          name: 'Увлажнитель 1',
          sensor_type: { name: 'Humidity', unit: '%' },
          is_active: true,
          target_value: 45.0,
          last_value: randomHumidity
        }
      ]);
      
      setTempSliderValue(22.0);
      setHumiditySliderValue(45.0);
    }
  };

  const handleUpdateSensor = async (sensorId, updates) => {
    try {
      await microclimateService.updateSensor(sensorId, updates);
      // Обновляем локальное состояние
      setSensors(sensors.map(sensor =>
        sensor.id === sensorId
          ? { ...sensor, ...updates }
          : sensor
      ));
      // Логируем действие
      if (logActivity) {
        const sensor = sensors.find(s => s.id === sensorId);
        if (sensor) {
          if (updates.is_active !== undefined) {
            logActivity(`${updates.is_active ? 'Включил' : 'Выключил'} ${sensor.name}`, selectedLocationName);
          }
          if (updates.target_value !== undefined) {
            logActivity(`Установил ${sensor.name} на ${updates.target_value}${sensor.sensor_type?.unit}`, selectedLocationName);
          }
        }
      }
    } catch (error) {
      console.error('Ошибка обновления датчика:', error);
    }
  };

  const handleTempChange = (e) => {
    const newValue = parseFloat(e.target.value);
    setTempSliderValue(newValue);
    setShowTempConfirm(true);
  };

  const confirmTempChange = async () => {
    const tempSensor = sensors.find(s => s.sensor_type?.name === 'Temperature');
    if (tempSensor) {
      await handleUpdateSensor(tempSensor.id, { target_value: tempSliderValue });
      setShowTempConfirm(false);
    }
  };

  const handleHumidityChange = (e) => {
    const newValue = parseFloat(e.target.value);
    setHumiditySliderValue(newValue);
    setShowHumidityConfirm(true);
  };

  const confirmHumidityChange = async () => {
    const humiditySensor = sensors.find(s => s.sensor_type?.name === 'Humidity');
    if (humiditySensor) {
      await handleUpdateSensor(humiditySensor.id, { target_value: humiditySliderValue });
      setShowHumidityConfirm(false);
    }
  };

  const handleRoomChange = (locationId) => {
    setSelectedLocation(locationId);
    if (logActivity) {
      const location = locations.find(l => l.id === locationId);
      if (location) {
        logActivity(`Переключился на комнату: ${location.name}`, 'Навигация');
      }
    }
  };

  if (loading) {
    return (
      <div className="sensors-screen">
        <div className="sensors-text-wrapper">Датчики</div>
        <div className="sensors-loading">Загрузка данных...</div>
      </div>
    );
  }

  const selectedLocationName = locations.find(loc => loc.id === selectedLocation)?.name || 'Кабинет 1';
  const tempSensor = sensors.find(s => s.sensor_type?.name === 'Temperature');
  const humiditySensor = sensors.find(s => s.sensor_type?.name === 'Humidity');

  return (
    <div className="sensors-screen">
      <div className="sensors-text-wrapper">Датчики</div>

      {/* Выбор комнаты */}
      <div className="sensors-room-selector">
        <div className="sensors-room-title">Выбор комнаты:</div>
        <div className="sensors-room-buttons">
          {locations.map(location => (
            <button
              key={location.id}
              className={`sensors-room-btn ${selectedLocation === location.id ? 'active' : ''}`}
              onClick={() => handleRoomChange(location.id)}
            >
              {location.name}
            </button>
          ))}
        </div>
      </div>

      {/* Контейнер для двух колонок */}
      <div className="sensors-container">
        {/* Левая колонка - Кондиционер */}
        <div className="sensors-column">
          <div className={`sensors-device-card ${!tempSensor?.is_active ? 'disabled' : ''}`}>
            {/* Заголовок блока */}
            <div className="sensors-device-header">
              <div className="sensors-device-title">
                <span className="sensors-room-name">{selectedLocationName}</span>
                <h3>{tempSensor?.name || 'Кондиционер'}</h3>
              </div>
              <div className="sensors-device-status">
                <div
                  className={`sensors-status-toggle ${tempSensor?.is_active ? 'enabled' : 'disabled'}`}
                  onClick={() => tempSensor && handleUpdateSensor(tempSensor.id, { is_active: !tempSensor.is_active })}
                >
                  <div className="sensors-status-text">
                    {tempSensor?.is_active ? 'Включено' : 'Выключено'}
                  </div>
                  <div className="sensors-status-dot"></div>
                </div>
              </div>
            </div>

            {/* Текущая температура */}
            <div className="sensors-current-value">
              <div className="sensors-value-large">
                {microclimateUtils.formatTemperature(tempSensor?.last_value)}
              </div>
              <div className="sensors-target-value">
                Текущая цель: <span>{tempSensor?.target_value || 22.0}°C</span>
              </div>
            </div>

            {/* Ползунок регулировки */}
            <div className="sensors-slider-section">
              <div className="sensors-slider-title">Регулировка целевого значения:</div>
              <div className="sensors-slider-container">
                <input
                  type="range"
                  min="16"
                  max="30"
                  step="0.1"
                  value={tempSliderValue}
                  onChange={handleTempChange}
                  disabled={!tempSensor?.is_active}
                  className="sensors-slider"
                />
                <div className="sensors-slider-labels">
                  <span>16°C</span>
                  <span>23°C</span>
                  <span>30°C</span>
                </div>
                <div className="sensors-slider-value">
                  Установлено: {tempSliderValue}°C
                </div>
              </div>
            </div>

            {/* Кнопка подтверждения */}
            {showTempConfirm && (
              <div className="sensors-confirm-section">
                <button
                  className="sensors-confirm-btn"
                  onClick={confirmTempChange}
                  disabled={!tempSensor?.is_active}
                >
                  Подтвердить изменение температуры
                </button>
              </div>
            )}

            {/* Питание */}
            <div className="sensors-power-section">
              <div className="sensors-power-label">Питание</div>
              <div className="sensors-power-status">
                {tempSensor?.is_active ? ' Включено' : ' Выключено'}
              </div>
            </div>
          </div>
        </div>

        {/* Правая колонка - Увлажнитель */}
        <div className="sensors-column">
          <div className={`sensors-device-card ${!humiditySensor?.is_active ? 'disabled' : ''}`}>
            {/* Заголовок блока */}
            <div className="sensors-device-header">
              <div className="sensors-device-title">
                <span className="sensors-room-name">{selectedLocationName}</span>
                <h3>{humiditySensor?.name || 'Увлажнитель'}</h3>
              </div>
              <div className="sensors-device-status">
                <div
                  className={`sensors-status-toggle ${humiditySensor?.is_active ? 'enabled' : 'disabled'}`}
                  onClick={() => humiditySensor && handleUpdateSensor(humiditySensor.id, { is_active: !humiditySensor.is_active })}
                >
                  <div className="sensors-status-text">
                    {humiditySensor?.is_active ? 'Включено' : 'Выключено'}
                  </div>
                  <div className="sensors-status-dot"></div>
                </div>
              </div>
            </div>

            {/* Текущая влажность */}
            <div className="sensors-current-value">
              <div className="sensors-value-large">
                {microclimateUtils.formatHumidity(humiditySensor?.last_value)}
              </div>
              <div className="sensors-target-value">
                Текущая цель: <span>{humiditySensor?.target_value || 45.0}%</span>
              </div>
            </div>

            {/* Ползунок регулировки */}
            <div className="sensors-slider-section">
              <div className="sensors-slider-title">Регулировка целевого значения:</div>
              <div className="sensors-slider-container">
                <input
                  type="range"
                  min="20"
                  max="80"
                  step="0.1"
                  value={humiditySliderValue}
                  onChange={handleHumidityChange}
                  disabled={!humiditySensor?.is_active}
                  className="sensors-slider"
                />
                <div className="sensors-slider-labels">
                  <span>20%</span>
                  <span>50%</span>
                  <span>80%</span>
                </div>
                <div className="sensors-slider-value">
                  Установлено: {humiditySliderValue}%
                </div>
              </div>
            </div>

            {/* Кнопка подтверждения */}
            {showHumidityConfirm && (
              <div className="sensors-confirm-section">
                <button
                  className="sensors-confirm-btn"
                  onClick={confirmHumidityChange}
                  disabled={!humiditySensor?.is_active}
                >
                  Подтвердить изменение влажности
                </button>
              </div>
            )}

            {/* Питание */}
            <div className="sensors-power-section">
              <div className="sensors-power-label">Питание</div>
              <div className="sensors-power-status">
                {humiditySensor?.is_active ? ' Включено' : ' Выключено'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sensors;