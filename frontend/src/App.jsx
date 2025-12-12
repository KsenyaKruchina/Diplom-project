// App.jsx
import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import Sensors from './components/Sensors';
import Users from './components/Users';
import { GridFour01 } from './components/icons/GridFour01';
import { StyleLine } from './components/icons/StyleLine';
import { User } from './components/icons/User';
import { ViewList } from './components/icons/ViewList';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activities, setActivities] = useState([]);
  
  // Начальные значения
  const initialTemperature = 20.2;
  const initialHumidity = 43.8;

  // Общее состояние для данных датчиков
  const [sensorData, setSensorData] = useState({
    temperature: initialTemperature,
    humidity: initialHumidity,
    tempEnabled: true,
    humidityEnabled: false,
    initialTemperature: initialTemperature,
    initialHumidity: initialHumidity
  });

  // Загрузка данных при монтировании
  useEffect(() => {
    // Загружаем историю действий из localStorage
    const savedActivities = localStorage.getItem('userActivities');
    if (savedActivities) {
      setActivities(JSON.parse(savedActivities));
    }
    
    // Логируем вход в систему
    logActivity('Вошла в систему', 'Система');
  }, []);

  // Сохранение действий в localStorage
  useEffect(() => {
    localStorage.setItem('userActivities', JSON.stringify(activities));
  }, [activities]);

  // Функция для логирования действий
  const logActivity = (action, room = 'Общее') => {
    const newActivity = {
      id: Date.now(),
      user_name: 'Engineer Kseniya Kruchina',
      action: action,
      room: room,
      completed: true,
      timestamp: new Date().toISOString()
    };
    
    setActivities(prev => [newActivity, ...prev.slice(0, 49)]); // Храним последние 50 действий
  };

  // Функции для обновления данных
  const updateTemperature = (newTemp) => {
    setSensorData(prev => ({
      ...prev,
      temperature: newTemp
    }));
  };

  const updateHumidity = (newHumidity) => {
    setSensorData(prev => ({
      ...prev,
      humidity: newHumidity
    }));
  };

  const toggleTemperature = (enabled) => {
    setSensorData(prev => ({
      ...prev,
      tempEnabled: enabled
    }));
  };

  const toggleHumidity = (enabled) => {
    setSensorData(prev => ({
      ...prev,
      humidityEnabled: enabled
    }));
  };

  // Функция для скачивания отчета
  const handleDownloadReport = (reportType) => {
    // Логируем скачивание отчета
    logActivity(`Скачала ${reportType} отчет`, 'Отчеты');
    
    // Здесь будет логика скачивания файла
    console.log(`Скачивание отчета: ${reportType}`);
    
    // Временная реализация для демонстрации
    const element = document.createElement('a');
    const file = new Blob([`Отчет: ${reportType}\nДата: ${new Date().toLocaleDateString()}\nПользователь: Kseniya Kruchina`], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${reportType}_отчет_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Функция для расчета изменений
  const calculateChanges = () => {
    const tempChange = ((sensorData.temperature - sensorData.initialTemperature) / sensorData.initialTemperature) * 100;
    const humidityChange = ((sensorData.humidity - sensorData.initialHumidity) / sensorData.initialHumidity) * 100;

    return {
      temperatureChange: tempChange,
      humidityChange: humidityChange
    };
  };

  const renderContent = () => {
    const changes = calculateChanges();

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard sensorData={sensorData} changes={changes} />;
      case 'analytics':
        return <Analytics onDownloadReport={handleDownloadReport} activities={activities} />;
      case 'sensors':
        return (
          <Sensors
            sensorData={sensorData}
            updateTemperature={updateTemperature}
            updateHumidity={updateHumidity}
            toggleTemperature={toggleTemperature}
            toggleHumidity={toggleHumidity}
            logActivity={logActivity}
          />
        );
      case 'users':
        return <Users activities={activities} />;
      default:
        return <Dashboard sensorData={sensorData} changes={changes} />;
    }
  };

  const menuStyle = {
    position: 'fixed',
    left: '20px',
    top: '19px',
    width: '279px',
    height: '983px',
    backgroundColor: '#414141',
    zIndex: 1000,
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
  };

  const menuItemStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '15px 20px',
    margin: '8px 0',
    borderRadius: '12px',
    backgroundColor: isActive ? '#8234f7' : 'transparent',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    color: 'white',
    fontFamily: '"Inter-SemiBold", Helvetica',
    fontSize: '18px',
    zIndex: 1001,
    border: '1px solid transparent'
  });

  return (
    <div className="screen">
      {/* Боковое меню */}
      <div style={menuStyle}>
        <div
          style={menuItemStyle(activeTab === 'dashboard')}
          onClick={() => {
            setActiveTab('dashboard');
            logActivity('Перешла на Дэшборд', 'Навигация');
          }}
        >
          <GridFour01 color="white" />
          <span>Дэшборд</span>
        </div>
        
        <div
          style={menuItemStyle(activeTab === 'analytics')}
          onClick={() => {
            setActiveTab('analytics');
            logActivity('Перешла в Анализ', 'Навигация');
          }}
        >
          <ViewList color="white" />
          <span>Анализ</span>
        </div>
        
        <div
          style={menuItemStyle(activeTab === 'sensors')}
          onClick={() => {
            setActiveTab('sensors');
            logActivity('Перешла в Датчики', 'Навигация');
          }}
        >
          <StyleLine color="white" />
          <span>Датчики</span>
        </div>
        
        <div
          style={menuItemStyle(activeTab === 'users')}
          onClick={() => {
            setActiveTab('users');
            logActivity('Перешла в Пользователи', 'Навигация');
          }}
        >
          <User color="white" />
          <span>Пользователи</span>
        </div>
      </div>

      {/* Основной контент */}
      <div className="main-content">
        {renderContent()}
      </div>
    </div>
  );
}

export default App;