// components/Users.jsx
import React from 'react';
import { User } from "./icons/User";
import "./Users.css";

const Users = ({ activities = [] }) => {
  // Моковые данные пользователя
  const user = {
    id: 1,
    name: "Engineer Kseniya Kruchina",
    role: "Engineer",
    status: "online",
    last_login: new Date().toISOString()
  };

  // Функция форматирования времени
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Функция форматирования даты
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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
    reportContent += `Всего действий: ${activities.length}\n`;
    reportContent += `Период: с ${formatDate(activities[activities.length - 1].timestamp)} по ${formatDate(activities[0].timestamp)}\n\n`;
    reportContent += `=== ДЕТАЛЬНАЯ ИСТОРИЯ ДЕЙСТВИЙ ===\n\n`;

    // Добавляем каждое действие в отчет
    activities.forEach((activity, index) => {
      reportContent += `${index + 1}. ${formatDate(activity.timestamp)} ${formatTime(activity.timestamp)}\n`;
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
    reportContent += `В процессе: ${activities.filter(a => !a.completed).length}\n\n`;

    // Группируем по комнатам
    const roomsStats = {};
    activities.forEach(activity => {
      const room = activity.room || 'Общее';
      roomsStats[room] = (roomsStats[room] || 0) + 1;
    });

    reportContent += `Распределение по комнатам:\n`;
    Object.entries(roomsStats).forEach(([room, count]) => {
      reportContent += `  ${room}: ${count} действий\n`;
    });

    // Группируем по типам действий
    const actionTypes = {};
    activities.forEach(activity => {
      const action = activity.action;
      if (action.includes('температуру')) actionTypes['Изменение температуры'] = (actionTypes['Изменение температуры'] || 0) + 1;
      else if (action.includes('влажность')) actionTypes['Изменение влажности'] = (actionTypes['Изменение влажности'] || 0) + 1;
      else if (action.includes('кондиционер')) actionTypes['Управление кондиционером'] = (actionTypes['Управление кондиционером'] || 0) + 1;
      else if (action.includes('увлажнитель')) actionTypes['Управление увлажнителем'] = (actionTypes['Управление увлажнителем'] || 0) + 1;
      else if (action.includes('скачала') || action.includes('отчет')) actionTypes['Скачивание отчетов'] = (actionTypes['Скачивание отчетов'] || 0) + 1;
      else if (action.includes('Перешла')) actionTypes['Навигация'] = (actionTypes['Навигация'] || 0) + 1;
      else actionTypes['Прочие действия'] = (actionTypes['Прочие действия'] || 0) + 1;
    });

    reportContent += `\nРаспределение по типам действий:\n`;
    Object.entries(actionTypes).forEach(([type, count]) => {
      reportContent += `  ${type}: ${count}\n`;
    });

    // Создаем и скачиваем файл
    const element = document.createElement('a');
    const file = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `аудит_отчет_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

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
          </div>
          <div className="users-last-login">
            Последний вход: {formatDate(user.last_login)} {formatTime(user.last_login)}
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
                  <div className="users-audit-date">{formatDate(activity.timestamp)}</div>
                  <div className="users-audit-hour">{formatTime(activity.timestamp)}</div>
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
        <div className="users-report-section">
          <button 
            className="users-report-btn"
            onClick={downloadAuditReport}
            disabled={activities.length === 0}
          >
            📥 Скачать полный отчет аудита
          </button>
          <div className="users-report-hint">
            Отчет содержит все действия пользователей за весь период
          </div>
        </div>
      </div>

    </div>
  );
};

export default Users;