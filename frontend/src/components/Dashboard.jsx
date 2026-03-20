// components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { CircleGraph } from "./icons/CircleGraph";
import { microclimateService, microclimateUtils } from "../services/microclimateService";
import "./Dashboard.css";

const Dashboard = () => {
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(1); // Начинаем с комнаты 1
  const [sensors, setSensors] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    fetchLocations();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      fetchSensors(selectedLocation);
    }
  }, [selectedLocation]);

  // Функция для принудительной нормализации ID комнат
  const normalizeLocations = (locationsData) => {
    if (!locationsData || !Array.isArray(locationsData)) {
      return [];
    }
    
    // Берем максимум 4 комнаты и нормализуем ID
    return locationsData.slice(0, 4).map((location, index) => ({
      ...location,
      id: index + 1, // Форсируем ID 1,2,3,4
      name: location.name || this.getLocationName(index + 1)
    }));
  };

  // Функция для получения названий комнат
  const getLocationName = (index) => {
    const names = {
      1: 'Главный офис',
      2: 'Конференц-зал',
      3: 'Серверная',
      4: 'Переговорная'
    };
    return names[index] || `Кабинет ${index}`;
  };

  const fetchLocations = async () => {
    try {
      const locationsData = await microclimateService.getLocations();
      // Нормализуем ID комнат
      const normalizedLocations = normalizeLocations(locationsData);
      setLocations(normalizedLocations);
      
      if (normalizedLocations.length > 0 && !selectedLocation) {
        setSelectedLocation(normalizedLocations[0].id);
      }
    } catch (error) {
      console.error('Ошибка загрузки локаций:', error);
      // Используем стандартные 4 комнаты
      const defaultLocations = [
        { id: 1, name: 'Главный офис' },
        { id: 2, name: 'Конференц-зал' },
        { id: 3, name: 'Серверная' },
        { id: 4, name: 'Переговорная' }
      ];
      setLocations(defaultLocations);
      if (!selectedLocation) {
        setSelectedLocation(1);
      }
    }
  };

  const fetchSensors = async (locationId) => {
    try {
      const sensorsData = await microclimateService.getSensors(locationId);
      setSensors(sensorsData);
    } catch (error) {
      console.error('Ошибка загрузки датчиков:', error);
      // Используем моковые данные
      setSensors([
        {
          id: 1,
          name: 'Кондиционер',
          sensor_type: { name: 'Temperature', unit: '°C' },
          is_active: true,
          target_value: 22.0,
          last_value: 21.5 + Math.random() * 2
        },
        {
          id: 2,
          name: 'Увлажнитель',
          sensor_type: { name: 'Humidity', unit: '%' },
          is_active: true,
          target_value: 45.0,
          last_value: 44.3 + Math.random() * 3
        }
      ]);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [statsData, usersData] = await Promise.all([
        microclimateService.getDashboardStats(),
        microclimateService.getUsers()
      ]);
      
      setStats(statsData);

      // Сохраняем данные пользователя
      if (usersData && usersData.length > 0) {
        setCurrentUser(usersData[0]);
      }

      // Создаем уведомления на основе реальных данных
      const currentNotifications = [];
      
      // Уведомление по температуре
      const tempSensor = sensors.find(s => s.sensor_type?.name === 'Temperature');
      if (tempSensor) {
        const tempDiff = tempSensor.last_value - tempSensor.target_value;
        currentNotifications.push({
          id: 1,
          title: "Контроль температуры",
          message: `Текущая температура: ${tempSensor.last_value.toFixed(1)}°C, цель: ${tempSensor.target_value}°C`,
          completed: Math.abs(tempDiff) < 1,
          type: 'temperature'
        });
      }

      // Уведомление по влажности
      const humiditySensor = sensors.find(s => s.sensor_type?.name === 'Humidity');
      if (humiditySensor) {
        const humDiff = humiditySensor.last_value - humiditySensor.target_value;
        currentNotifications.push({
          id: 2,
          title: "Контроль влажности",
          message: `Текущая влажность: ${humiditySensor.last_value.toFixed(1)}%, цель: ${humiditySensor.target_value}%`,
          completed: Math.abs(humDiff) < 2,
          type: 'humidity'
        });
      }

      // Системные уведомления
      if (statsData) {
        currentNotifications.push({
          id: 3,
          title: "Системная статистика",
          message: `Средняя температура: ${statsData.avg_temperature}°C, Средняя влажность: ${statsData.avg_humidity}%`,
          completed: true,
          type: 'system'
        });
      }

      // Уведомление о пользователе
      if (currentUser) {
        currentNotifications.push({
          id: 4,
          title: "Активность пользователя",
          message: `${currentUser.full_name} (${currentUser.role}) онлайн`,
          completed: true,
          type: 'user'
        });
      }

      // Добавляем уведомления о состоянии датчиков
      sensors.forEach((sensor, index) => {
        if (!sensor.is_active) {
          currentNotifications.push({
            id: 5 + index,
            title: `Датчик ${sensor.name}`,
            message: `${sensor.name} отключен. Требуется включение.`,
            completed: false,
            type: 'sensor'
          });
        }
      });

      setNotifications(currentNotifications);

    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      setStats({
        avg_temperature: 22.5,
        avg_humidity: 45.3,
        temp_change: 2.1,
        hum_change: -1.5
      });
      
      // Устанавливаем текущего пользователя
      setCurrentUser({
        id: 1,
        full_name: "Kseniya Kruchina",
        role: "Администратор",
        is_online: true
      });
      
      setNotifications([
        {
          id: 1,
          title: "Контроль температуры",
          message: "Текущая температура: 22.5°C, цель: 22.0°C",
          completed: true
        },
        {
          id: 2,
          title: "Контроль влажности",
          message: "Текущая влажность: 45.3%, цель: 45.0%",
          completed: true
        },
        {
          id: 3,
          title: "Активность пользователя",
          message: "Kseniya Kruchina (Администратор) онлайн",
          completed: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification);
    setShowConfirmModal(true);
  };

  const confirmStatusChange = () => {
    if (selectedNotification) {
      const updatedNotifications = notifications.map(n => 
        n.id === selectedNotification.id 
          ? { ...n, completed: !n.completed }
          : n
      );
      setNotifications(updatedNotifications);
      setShowConfirmModal(false);
      
      console.log(`Статус уведомления ${selectedNotification.id} изменен на: ${!selectedNotification.completed ? 'Выполнено' : 'Ожидает'}`);
    }
  };

  const cancelStatusChange = () => {
    setShowConfirmModal(false);
    setSelectedNotification(null);
  };

  const handleRoomChange = (locationId) => {
    setSelectedLocation(locationId);
    fetchSensors(locationId);
    fetchDashboardData();
  };

  const formatChange = (change) => {
    if (change === null || change === undefined || isNaN(change)) {
      return 'N/A';
    }
    return change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
  };

  if (loading || !stats) {
    return (
      <div className="dashboard-screen">
        <div className="dashboard-text-wrapper">Дэшборд</div>
        <div className="dashboard-loading">Загрузка данных...</div>
      </div>
    );
  }

  const tempPercentage = Math.min(100, (stats.avg_temperature / 50) * 100);
  const selectedLocationName = locations.find(loc => loc.id === selectedLocation)?.name || 'Главный офис';
  const tempSensor = sensors.find(s => s.sensor_type?.name === 'Temperature');
  const humiditySensor = sensors.find(s => s.sensor_type?.name === 'Humidity');

  return (
    <div className="dashboard-screen">
      <div className="dashboard-text-wrapper">Дэшборд</div>

      {/* Отображение текущего пользователя */}
      {currentUser && (
        <div className="dashboard-user-info">
          <span className="dashboard-user-name">{currentUser.full_name}</span>
          <span className="dashboard-user-status online">● Онлайн</span>
        </div>
      )}

      <div className="dashboard-room-selector">
        <div className="dashboard-room-title">Выбор комнаты:</div>
        <div className="dashboard-room-buttons">
          {locations.map(location => (
            <button
              key={location.id}
              className={`dashboard-room-btn ${selectedLocation === location.id ? 'active' : ''}`}
              onClick={() => handleRoomChange(location.id)}
            >
              {location.name}
            </button>
          ))}
        </div>
      </div>

      <div className="dashboard-rectangle-2" />
      <div className="dashboard-text-wrapper-3">Влажность ({selectedLocationName})</div>
      <div className="dashboard-text-wrapper-5">
        {stats.hum_change ? `изменилось на ${formatChange(stats.hum_change)}` : 'стабильно'}
      </div>
      <div className="dashboard-text-wrapper-6">%</div>
      <div className="dashboard-big-number">
        <div className="dashboard-text-wrapper-7">
          {humiditySensor ? humiditySensor.last_value.toFixed(1) : stats.avg_humidity.toFixed(1)}
        </div>
      </div>

      <div className="dashboard-rectangle-3" />
      <div className="dashboard-text-wrapper-8">Температура ({selectedLocationName})</div>
      <div className="dashboard-text-wrapper-9">
        {stats.temp_change ? `изменилось на ${formatChange(stats.temp_change)}` : 'стабильно'}
      </div>
      <div className="dashboard-text-wrapper-10">°C</div>
      <div className="dashboard-div-wrapper">
        <div className="dashboard-text-wrapper-7">
          {tempSensor ? tempSensor.last_value.toFixed(1) : stats.avg_temperature.toFixed(1)}
        </div>
      </div>

      <div className="dashboard-humidity-graph">
        <CircleGraph percentage={humiditySensor ? humiditySensor.last_value : stats.avg_humidity} />
      </div>
      <div className="dashboard-temperature-graph">
        <CircleGraph percentage={tempPercentage} />
      </div>
      <div className="dashboard-humidity-percent">
        {humiditySensor ? humiditySensor.last_value.toFixed(1) : stats.avg_humidity.toFixed(1)}%
      </div>
      <div className="dashboard-temperature-value">
        {tempSensor ? tempSensor.last_value.toFixed(1) : stats.avg_temperature.toFixed(1)}°C
      </div>

      <div className="dashboard-text-wrapper-4">ИИ-уведомления</div>
      <div className="dashboard-notifications-container">
        {notifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onClick={() => handleNotificationClick(notification)}
          />
        ))}
      </div>

      {showConfirmModal && selectedNotification && (
        <div className="dashboard-modal-overlay">
          <div className="dashboard-modal">
            <div className="dashboard-modal-header">
              <h3>Изменение статуса уведомления</h3>
            </div>
            <div className="dashboard-modal-content">
              <p>Вы уверены, что хотите изменить статус уведомления?</p>
              <div className="dashboard-modal-notification">
                <div className="dashboard-modal-notification-title">
                  {selectedNotification.title}
                </div>
                <div className="dashboard-modal-notification-message">
                  {selectedNotification.message}
                </div>
                <div className="dashboard-modal-notification-status">
                  Текущий статус: <span className={selectedNotification.completed ? 'completed' : 'pending'}>
                    {selectedNotification.completed ? 'Выполнено' : 'Ожидает'}
                  </span>
                </div>
                <div className="dashboard-modal-notification-status">
                  Новый статус: <span className={!selectedNotification.completed ? 'completed' : 'pending'}>
                    {!selectedNotification.completed ? 'Выполнено' : 'Ожидает'}
                  </span>
                </div>
              </div>
            </div>
            <div className="dashboard-modal-actions">
              <button className="dashboard-modal-btn confirm" onClick={confirmStatusChange}>
                Подтвердить
              </button>
              <button className="dashboard-modal-btn cancel" onClick={cancelStatusChange}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const NotificationCard = ({ notification, onClick }) => {
  return (
    <div className="dashboard-notification-card" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="dashboard-notification-title">
        {notification.title}
      </div>
      <p className="dashboard-notification-message">
        {notification.message}
      </p>
      <div
        className={`dashboard-notification-status ${notification.completed ? 'completed' : 'pending'}`}
      >
        {notification.completed ? "Выполнено" : "Ожидает"}
      </div>
      <div className="dashboard-notification-divider" />
    </div>
  );
};

export default Dashboard;