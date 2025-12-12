import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiRrCheck } from "./icons/FiRrCheck";
import { CircleGraph } from "./icons/CircleGraph";
import "./Dashboard.css";

const Dashboard = ({ sensorData, changes }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // ПРОВЕРЬТЕ: Убедитесь, что бэкенд запущен и настроены CORS
      const notificationsRes = await axios.get("http://localhost:8000/notifications");
      setNotifications(notificationsRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);

      // Mock уведомления (для тестирования, если бэкенд недоступен или CORS блокирует)
      setNotifications([
        {
          id: 1,
          title: "Увеличьте температуру на +10°C",
          message: "Нужно увеличивать температуру для комфортного климата в помещении",
          completed: true
        },
        {
          id: 2,
          title: "Проверьте систему вентиляции",
          message: "Рекомендуется проверить работу системы вентиляции для улучшения качества воздуха",
          completed: false
        }
      ]);
    }
  };

  // Форматируем изменения для отображения
  const formatChange = (change) => {
    // Проверяем, что change — это число.
    if (typeof change !== 'number' || isNaN(change)) {
      return 'N/A';
    }
    return change >= 0 ? `+${change.toFixed(1)}` : change.toFixed(1);
  };

  // Проверка наличия данных перед использованием
  if (!sensorData || !sensorData.humidity || !sensorData.temperature || !changes) {
      // Можно вернуть лоадер или пустой div, пока данные не загружены
      return <div>Загрузка данных...</div>;
  }
  
  // Рассчитываем процент для круговой диаграммы температуры (если 50°C — это 100%)
  const tempPercentage = Math.min(100, (sensorData.temperature / 50) * 100);

  return (
    <>
      <div className="dashboard-text-wrapper">Дэшборд</div>

      {/* Карточка влажности */}
      <div className="dashboard-rectangle-2" />
      <div className="dashboard-text-wrapper-3">Влажность</div>
      <div className="dashboard-text-wrapper-5">
        изменилось на {formatChange(changes.humidityChange)}%
      </div>
      <div className="dashboard-text-wrapper-6">%</div>
      <div className="dashboard-big-number">
        <div className="dashboard-text-wrapper-7">{sensorData.humidity.toFixed(1)}</div>
      </div>

      {/* Карточка температуры */}
      <div className="dashboard-rectangle-3" />
      <div className="dashboard-text-wrapper-8">Температура</div>
      <div className="dashboard-text-wrapper-9">
        изменилось на {formatChange(changes.temperatureChange)}%
      </div>
      <div className="dashboard-text-wrapper-10">°C</div>
      <div className="dashboard-div-wrapper">
        <div className="dashboard-text-wrapper-7">{sensorData.temperature.toFixed(1)}</div>
      </div>

      {/* Графики - круговые диаграммы */}
      <div className="dashboard-humidity-graph">
        <CircleGraph percentage={sensorData.humidity} />
      </div>
      
      <div className="dashboard-temperature-graph">
        <CircleGraph percentage={tempPercentage} />
      </div>

      <div className="dashboard-humidity-percent">{sensorData.humidity.toFixed(1)}%</div>
      <div className="dashboard-temperature-value">{sensorData.temperature.toFixed(1)}°C</div>

      {/* Секция уведомлений */}
      <div className="dashboard-text-wrapper-4">ИИ-уведомления</div>
      <div className="dashboard-notifications-container">
        {notifications.map((notification) => (
          <NotificationCard 
            key={notification.id}
            notification={notification}
          />
        ))}
      </div>
    </>
  );
};

// Компонент карточки уведомления (без изменений)
const NotificationCard = ({ notification }) => {
  return (
    <div className="dashboard-notification-card">
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
        {notification.completed && <FiRrCheck className="dashboard-status-icon" />}
      </div>
      
      {/* Делитель (простой пример, который можно оптимизировать в CSS) */}
      <div className="dashboard-notification-divider" />
    </div>
  );
};

export default Dashboard;