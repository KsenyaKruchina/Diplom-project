// components/Users.jsx
import React, { useState, useEffect } from 'react';
import { User } from "./icons/User";
import { microclimateService, microclimateUtils } from "../services/microclimateService";
import "./Users.css";

const Users = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({
    id: 1,
    name: "Kseniya Kruchina",
    role: "Администратор",
    status: "online",
    last_login: new Date().toISOString()
  });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Метод для получения случайного действия
  const getRandomAction = (index = 0) => {
    const actions = [
      "Включил кондиционер в Главном офисе",
      "Установил температуру 22°C",
      "Проверил систему вентиляции в Конференц-зале",
      "Сгенерировал недельный отчет",
      "Настроил увлажнитель на 45% в Серверной",
      "Провел аудит системы",
      "Обновил настройки датчиков в Переговорной",
      "Проверил состояние всех датчиков",
      "Настроил автоматический режим работы",
      "Создал резервную копию настроек"
    ];
    return actions[index % actions.length] || actions[0];
  };

  // Метод для получения случайной комнаты
  const getRandomRoom = (index = 0) => {
    const rooms = ['Главный офис', 'Конференц-зал', 'Серверная', 'Переговорная', 'Общее'];
    return rooms[index % rooms.length] || 'Общее';
  };

  const fetchData = async () => {
    try {
      const [usersData, logsData] = await Promise.all([
        microclimateService.getUsers(),
        microclimateService.getLogs(50)
      ]);

      // Обновляем данные пользователя - ПЕРВЫМ ДЕЛОМ!
      if (usersData && usersData.length > 0) {
        const apiUser = usersData[0];
        setUser({
          id: apiUser.id || 1,
          name: apiUser.full_name || "Kseniya Kruchina", // Используем full_name
          role: apiUser.role || "Администратор",
          status: 'online', // Всегда онлайн
          last_login: apiUser.last_login || new Date().toISOString()
        });
      }

      // Преобразуем логи в формат activities с разными временными метками
      const formattedActivities = logsData.map((log, index) => {
        // Создаем разные временные метки для демонстрации
        const now = new Date();
        const timestamp = new Date(now.getTime() - (index * 600000)); // Каждое действие на 10 минут раньше предыдущего
        
        // Используем имя из state user
        const currentUserName = user.name || "Kseniya Kruchina";
        
        return {
          id: log.id || index + 1,
          user_name: log.user_name || currentUserName, // Используем имя текущего пользователя
          action: log.action || getRandomAction(index),
          timestamp: log.timestamp || timestamp.toISOString(),
          completed: Math.random() > 0.3, // Случайный статус выполнения
          room: getRandomRoom(index)
        };
      });

      setActivities(formattedActivities);

    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      // Используем моковые данные с разными временными метками
      const mockActivities = [];
      const now = new Date();
      
      for (let i = 0; i < 8; i++) {
        const timestamp = new Date(now.getTime() - (i * 600000)); // Каждое действие на 10 минут раньше
        mockActivities.push({
          id: i + 1,
          user_name: i % 2 === 0 ? "Kseniya Kruchina" : "Иван Петров",
          action: getRandomAction(i),
          timestamp: timestamp.toISOString(),
          completed: i % 3 !== 0,
          room: getRandomRoom(i)
        });
      }

      setActivities(mockActivities);
      
      // Устанавливаем пользователя онлайн с правильным именем
      setUser({
        id: 1,
        name: "Kseniya Kruchina", // Правильное имя
        role: "Администратор",
        status: "online",
        last_login: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  // Функция для скачивания полного отчета действий
  const downloadAuditReport = () => {
    if (activities.length === 0) {
      alert('Нет данных для отчета');
      return;
    }

    // Создаем содержимое отчета
    let reportContent = `=== ОТЧЕТ ПО ДЕЙСТВИЯМ ПОЛЬЗОВАТЕЛЕЙ ===\n\n`;
    reportContent += `Сгенерирован: ${new Date().toLocaleString('ru-RU')}\n`;
    reportContent += `Пользователь: ${user.name}\n`;
    reportContent += `Роль: ${user.role}\n`;
    reportContent += `Статус: ${user.status === 'online' ? 'Онлайн' : 'Оффлайн'}\n`;
    reportContent += `Последний вход: ${microclimateUtils.formatDate(user.last_login)}\n`;
    reportContent += `Всего действий: ${activities.length}\n\n`;

    reportContent += `=== ДЕТАЛЬНАЯ ИСТОРИЯ ДЕЙСТВИЙ ===\n\n`;

    // Добавляем каждое действие в отчет
    activities.forEach((activity, index) => {
      reportContent += `${index + 1}. ${microclimateUtils.formatDate(activity.timestamp)}\n`;
      reportContent += `   Пользователь: ${activity.user_name}\n`;
      reportContent += `   Действие: ${activity.action}\n`;
      reportContent += `   Комната: ${activity.room || 'Общее'}\n`;
      reportContent += `   Статус: ${activity.completed ? 'Выполнено' : 'В процессе'}\n`;
      reportContent += `   ---\n`;
    });

    // Добавляем статистику
    reportContent += `\n=== СТАТИСТИКА ===\n\n`;
    reportContent += `Всего действий: ${activities.length}\n`;
    reportContent += `Выполнено: ${activities.filter(a => a.completed).length}\n`;
    reportContent += `В процессе: ${activities.filter(a => !a.completed).length}\n`;

    // Создаем и скачиваем файл
    const element = document.createElement('a');
    const file = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `аудит_отчет_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (loading) {
    return (
      <div className="users-screen">
        <div className="users-text-wrapper">Пользователи</div>
        <div className="users-loading">Загрузка данных...</div>
      </div>
    );
  }

  return (
    <div className="users-screen">
      {/* Основной заголовок */}
      <div className="users-text-wrapper">Пользователи</div>

      {/* Карточка информации о пользователе */}
      <div className="users-rectangle-3">
        <div className="users-user-info">
          <User className="users-user-icon" color="white" />
          <div className="users-user-details">
            <div className="users-user-name">{user.name}</div>
            <div className="users-user-role">{user.role}</div>
            <div className={`users-user-status ${user.status}`}>
              {user.status === 'online' ? '● Онлайн' : '○ Оффлайн'}
            </div>
            <div className="users-last-login">
              Последний вход: {microclimateUtils.formatDate(user.last_login)}
            </div>
          </div>
        </div>
      </div>

      {/* Заголовок журнала аудита */}
      <div className="users-text-wrapper-37">Журнал аудита</div>

      {/* Контейнер журнала аудита */}
      <div className="users-rectangle-2">
        {/* Заголовки колонок */}
        <div className="users-audit-headers">
          <div className="users-audit-header" style={{ width: '150px' }}>Время</div>
          <div className="users-audit-header" style={{ width: '200px' }}>Пользователь</div>
          <div className="users-audit-header" style={{ flex: 1 }}>Действие</div>
          <div className="users-audit-header" style={{ width: '120px' }}>Комната</div>
          <div className="users-audit-header" style={{ width: '100px' }}>Статус</div>
        </div>

        {/* Список действий */}
        <div className="users-audit-list">
          {activities.length > 0 ? (
            activities.map((activity, index) => (
              <div key={activity.id || index} className="users-audit-item">
                <div className="users-audit-time">
                  <div className="users-audit-date">
                    {microclimateUtils.formatDate(activity.timestamp)}
                  </div>
                  <div className="users-audit-hour">
                    {new Date(activity.timestamp).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div className="users-audit-user">
                  <User className="users-audit-user-icon" color="white" />
                  <span>{activity.user_name}</span>
                </div>
                <div className="users-audit-action">
                  {activity.action}
                </div>
                <div className="users-audit-room">
                  {activity.room || 'Общее'}
                </div>
                <div className={`users-audit-status ${activity.completed ? 'completed' : 'pending'}`}>
                  {activity.completed ? '✓ Выполнено' : '⌛ В процессе'}
                </div>
              </div>
            ))
          ) : (
            <div className="users-no-activities">
              <div className="users-empty-icon">📋</div>
              <div className="users-empty-text">Журнал аудита пуст</div>
              <div className="users-empty-subtext">Действия будут отображаться здесь после изменений</div>
            </div>
          )}
        </div>
      </div>

      {/* Статистика и кнопки */}
      <div className="users-stats-container">
        <div className="users-stats">
          <div className="users-stat-card">
            <div className="users-stat-value">{activities.length}</div>
            <div className="users-stat-label">Всего действий</div>
          </div>
          <div className="users-stat-card">
            <div className="users-stat-value">
              {activities.filter(a => a.completed).length}
            </div>
            <div className="users-stat-label">Выполнено</div>
          </div>
          <div className="users-stat-card">
            <div className="users-stat-value">
              {activities.filter(a => !a.completed).length}
            </div>
            <div className="users-stat-label">В процессе</div>
          </div>
        </div>

        {/* Кнопка скачивания полного отчета */}
        <div className="users-report-section" style={{ margin: '20px 329px' }}>
          <button
            className="users-report-btn"
            onClick={downloadAuditReport}
            disabled={activities.length === 0}
            style={{
              width: '100%',
              backgroundColor: '#8234f7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '15px',
              fontFamily: '"Inter-Medium", Helvetica',
              fontSize: '18px',
              fontWeight: '500',
              cursor: activities.length === 0 ? 'not-allowed' : 'pointer',
              opacity: activities.length === 0 ? 0.5 : 1,
              transition: 'all 0.3s ease'
            }}
          >
            📥 Скачать полный отчет аудита
          </button>
        </div>
      </div>
    </div>
  );
};

export default Users;