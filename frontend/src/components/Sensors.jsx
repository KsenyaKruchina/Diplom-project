// components/Sensors.jsx
import React, { useState, useEffect } from 'react';
import "./Sensors.css";

const Sensors = ({
  sensorData,
  updateTemperature,
  updateHumidity,
  toggleTemperature,
  toggleHumidity,
  logActivity // Функция для логгирования действий
}) => {
  const [selectedRoom, setSelectedRoom] = useState('Кабинет 2');
  const [rooms, setRooms] = useState([
    { id: 1, name: 'Кабинет 1', temperature: 22.5, humidity: 45.0 },
    { id: 2, name: 'Кабинет 2', temperature: 20.2, humidity: 43.8 },
    { id: 3, name: 'Конференц-зал', temperature: 21.8, humidity: 50.2 },
    { id: 4, name: 'Кухня', temperature: 23.5, humidity: 38.5 },
  ]);

  const [tempTarget, setTempTarget] = useState(29.0);
  const [humidityTarget, setHumidityTarget] = useState(23.0);
  const [tempSliderValue, setTempSliderValue] = useState(20.2);
  const [humiditySliderValue, setHumiditySliderValue] = useState(43.8);
  const [showTempConfirm, setShowTempConfirm] = useState(false);
  const [showHumidityConfirm, setShowHumidityConfirm] = useState(false);
  const [previousTempValue, setPreviousTempValue] = useState(20.2);
  const [previousHumidityValue, setPreviousHumidityValue] = useState(43.8);

  // Получаем данные текущей комнаты
  const currentRoom = rooms.find(room => room.name === selectedRoom) || rooms[1];

  // Имитация постепенного изменения температуры к целевой
  useEffect(() => {
    const tempInterval = setInterval(() => {
      if (Math.abs(currentRoom.temperature - tempTarget) > 0.1) {
        const newTemp = currentRoom.temperature + (tempTarget > currentRoom.temperature ? 0.1 : -0.1);
        updateRoomTemperature(selectedRoom, newTemp);
      }
    }, 1000);

    return () => clearInterval(tempInterval);
  }, [currentRoom.temperature, tempTarget, selectedRoom]);

  // Имитация постепенного изменения влажности к целевой
  useEffect(() => {
    const humidityInterval = setInterval(() => {
      if (Math.abs(currentRoom.humidity - humidityTarget) > 0.1) {
        const newHumidity = currentRoom.humidity + (humidityTarget > currentRoom.humidity ? 0.1 : -0.1);
        updateRoomHumidity(selectedRoom, newHumidity);
      }
    }, 1000);

    return () => clearInterval(humidityInterval);
  }, [currentRoom.humidity, humidityTarget, selectedRoom]);

  // Функция обновления температуры комнаты
  const updateRoomTemperature = (roomName, newTemp) => {
    setRooms(prev => prev.map(room => 
      room.name === roomName ? { ...room, temperature: parseFloat(newTemp.toFixed(1)) } : room
    ));
  };

  // Функция обновления влажности комнаты
  const updateRoomHumidity = (roomName, newHumidity) => {
    setRooms(prev => prev.map(room => 
      room.name === roomName ? { ...room, humidity: parseFloat(newHumidity.toFixed(1)) } : room
    ));
  };

  // Обработчик изменения температуры через ползунок
  const handleTempChange = (e) => {
    const newValue = parseFloat(e.target.value);
    setTempSliderValue(newValue);
    setShowTempConfirm(true);
  };

  // Подтверждение изменения температуры
  const confirmTempChange = () => {
    // Логируем изменение только при подтверждении
    if (logActivity) {
      const change = (tempSliderValue - previousTempValue).toFixed(1);
      const changeText = change > 0 ? `увеличил на +${change}°C` : `уменьшил на ${change}°C`;
      logActivity(`Установил температуру в ${selectedRoom}: ${tempSliderValue}°C (${changeText})`, selectedRoom);
    }
    
    setPreviousTempValue(tempSliderValue);
    setTempTarget(tempSliderValue);
    updateRoomTemperature(selectedRoom, tempSliderValue);
    setShowTempConfirm(false);
  };

  // Обработчик изменения влажности через ползунок
  const handleHumidityChange = (e) => {
    const newValue = parseFloat(e.target.value);
    setHumiditySliderValue(newValue);
    setShowHumidityConfirm(true);
  };

  // Подтверждение изменения влажности
  const confirmHumidityChange = () => {
    // Логируем изменение только при подтверждении
    if (logActivity) {
      const change = (humiditySliderValue - previousHumidityValue).toFixed(1);
      const changeText = change > 0 ? `увеличил на +${change}%` : `уменьшил на ${change}%`;
      logActivity(`Установил влажность в ${selectedRoom}: ${humiditySliderValue}% (${changeText})`, selectedRoom);
    }
    
    setPreviousHumidityValue(humiditySliderValue);
    setHumidityTarget(humiditySliderValue);
    updateRoomHumidity(selectedRoom, humiditySliderValue);
    setShowHumidityConfirm(false);
  };

  // Переключение кондиционера
  const handleACtoggle = (enabled) => {
    toggleTemperature(enabled);
    setShowTempConfirm(false);
    
    // Логируем действие
    if (logActivity) {
      logActivity(`${enabled ? 'Включил' : 'Выключил'} кондиционер в ${selectedRoom}`, selectedRoom);
    }
  };

  // Переключение увлажнителя
  const handleHumidityToggle = (enabled) => {
    toggleHumidity(enabled);
    setShowHumidityConfirm(false);
    
    // Логируем действие
    if (logActivity) {
      logActivity(`${enabled ? 'Включил' : 'Выключил'} увлажнитель в ${selectedRoom}`, selectedRoom);
    }
  };

  // Смена комнаты
  const handleRoomChange = (roomName) => {
    setSelectedRoom(roomName);
    const room = rooms.find(r => r.name === roomName);
    if (room) {
      setTempSliderValue(room.temperature);
      setHumiditySliderValue(room.humidity);
      setTempTarget(room.temperature);
      setHumidityTarget(room.humidity);
      setPreviousTempValue(room.temperature);
      setPreviousHumidityValue(room.humidity);
    }
    
    // Логируем действие
    if (logActivity) {
      logActivity(`Переключился на комнату: ${roomName}`, 'Навигация');
    }
  };

  return (
    <div className="sensors-screen">
      <div className="sensors-text-wrapper">Датчики</div>
      
      {/* Выбор комнаты */}
      <div className="sensors-room-selector">
        <div className="sensors-room-title">Выбор комнаты:</div>
        <div className="sensors-room-buttons">
          {rooms.map(room => (
            <button
              key={room.id}
              className={`sensors-room-btn ${selectedRoom === room.name ? 'active' : ''}`}
              onClick={() => handleRoomChange(room.name)}
            >
              {room.name}
            </button>
          ))}
        </div>
      </div>

      {/* Контейнер для двух колонок */}
      <div className="sensors-container">
        
        {/* Левая колонка - Кондиционер */}
        <div className="sensors-column">
          <div className={`sensors-device-card ${!sensorData.tempEnabled ? 'disabled' : ''}`}>
            
            {/* Заголовок блока */}
            <div className="sensors-device-header">
              <div className="sensors-device-title">
                <span className="sensors-room-name">{selectedRoom}</span>
                <h3>Кондиционер 2</h3>
              </div>
              <div className="sensors-device-status">
                <div 
                  className={`sensors-status-toggle ${sensorData.tempEnabled ? 'enabled' : 'disabled'}`}
                  onClick={() => handleACtoggle(!sensorData.tempEnabled)}
                >
                  <div className="sensors-status-text">
                    {sensorData.tempEnabled ? 'Включено' : 'Выключено'}
                  </div>
                  <div className="sensors-status-dot"></div>
                </div>
              </div>
            </div>

            {/* Текущая температура */}
            <div className="sensors-current-value">
              <div className="sensors-value-large">{currentRoom.temperature}°C</div>
              <div className="sensors-target-value">
                Текущая цель: <span>{tempTarget}°C</span>
              </div>
            </div>

            {/* Ползунок регулировки */}
            <div className="sensors-slider-section">
              <div className="sensors-slider-title">Регулировка целевого значения:</div>
              <div className="sensors-slider-container">
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="0.1"
                  value={tempSliderValue}
                  onChange={handleTempChange}
                  disabled={!sensorData.tempEnabled}
                  className="sensors-slider"
                />
                <div className="sensors-slider-labels">
                  <span>0°C</span>
                  <span>20°C</span>
                  <span>40°C</span>
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
                  disabled={!sensorData.tempEnabled}
                >
                  Подтвердить изменение температуры
                </button>
              </div>
            )}

            {/* Питание */}
            <div className="sensors-power-section">
              <div className="sensors-power-label">Питание</div>
              <div className="sensors-power-status">
                {sensorData.tempEnabled ? '● Включено' : '○ Выключено'}
              </div>
            </div>

          </div>
        </div>

        {/* Правая колонка - Увлажнитель */}
        <div className="sensors-column">
          <div className={`sensors-device-card ${!sensorData.humidityEnabled ? 'disabled' : ''}`}>
            
            {/* Заголовок блока */}
            <div className="sensors-device-header">
              <div className="sensors-device-title">
                <span className="sensors-room-name">{selectedRoom}</span>
                <h3>Увлажнитель 2</h3>
              </div>
              <div className="sensors-device-status">
                <div 
                  className={`sensors-status-toggle ${sensorData.humidityEnabled ? 'enabled' : 'disabled'}`}
                  onClick={() => handleHumidityToggle(!sensorData.humidityEnabled)}
                >
                  <div className="sensors-status-text">
                    {sensorData.humidityEnabled ? 'Включено' : 'Выключено'}
                  </div>
                  <div className="sensors-status-dot"></div>
                </div>
              </div>
            </div>

            {/* Текущая влажность */}
            <div className="sensors-current-value">
              <div className="sensors-value-large">{currentRoom.humidity}%</div>
              <div className="sensors-target-value">
                Текущая цель: <span>{humidityTarget}%</span>
              </div>
            </div>

            {/* Ползунок регулировки */}
            <div className="sensors-slider-section">
              <div className="sensors-slider-title">Регулировка целевого значения:</div>
              <div className="sensors-slider-container">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={humiditySliderValue}
                  onChange={handleHumidityChange}
                  disabled={!sensorData.humidityEnabled}
                  className="sensors-slider"
                />
                <div className="sensors-slider-labels">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
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
                  disabled={!sensorData.humidityEnabled}
                >
                  Подтвердить изменение влажности
                </button>
              </div>
            )}

            {/* Питание */}
            <div className="sensors-power-section">
              <div className="sensors-power-label">Питание</div>
              <div className="sensors-power-status">
                {sensorData.humidityEnabled ? '● Включено' : '○ Выключено'}
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};

export default Sensors;