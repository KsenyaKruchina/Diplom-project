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
import { microclimateService } from './services/microclimateService';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Начальные значения для совместимости
  const initialTemperature = 20.2;
  const initialHumidity = 43.8;

  // Общее состояние для данных датчиков (для обратной совместимости)
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
    fetchInitialData();
    
    // Логируем вход в систему
    logActivity('Вошла в систему', 'Система');
  }, []);

  // Сохранение действий в localStorage
  useEffect(() => {
    localStorage.setItem('userActivities', JSON.stringify(activities));
  }, [activities]);

  const fetchInitialData = async () => {
    try {
      // Загружаем историю действий из localStorage
      const savedActivities = localStorage.getItem('userActivities');
      if (savedActivities) {
        setActivities(JSON.parse(savedActivities));
      }
      
      // Пробуем загрузить данные из микроклимата
      try {
        const [stats, logs] = await Promise.all([
          microclimateService.getDashboardStats(),
          microclimateService.getLogs(20)
        ]);
        
        // Обновляем sensorData с реальными данными
        setSensorData(prev => ({
          ...prev,
          temperature: stats.avg_temperature || initialTemperature,
          humidity: stats.avg_humidity || initialHumidity,
          initialTemperature: stats.avg_temperature || initialTemperature,
          initialHumidity: stats.avg_humidity || initialHumidity
        }));
        
        // Добавляем логи из микроклимата в activities
        const microclimateActivities = logs.map(log => ({
          id: log.id || Date.now(),
          user_name: log.user_name || 'Пользователь',
          action: log.action,
          room: 'Общее',
          completed: true,
          timestamp: log.timestamp || new Date().toISOString()
        }));
        
        setActivities(prev => [...microclimateActivities, ...prev]);
        
      } catch (error) {
        console.log('Использую локальные данные:', error.message);
        // Используем локальные данные если API недоступно
      }
      
    } catch (error) {
      console.error('Ошибка при загрузке данных:', error);
    } finally {
      setLoading(false);
    }
  };

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
    
    // Также можно отправлять логи на сервер микроклимата
    try {
      // В реальном приложении здесь будет вызов API для сохранения лога
      // microclimateService.saveLog(action, room);
    } catch (error) {
      console.error('Ошибка при сохранении лога на сервере:', error);
    }
  };

  // Функции для обновления данных (оставлены для обратной совместимости)
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
    
    console.log(`Скачивание отчета: ${reportType}`);
  };

  // Функция для расчета изменений (оставлена для обратной совместимости с Dashboard)
  const calculateChanges = () => {
    const tempChange = ((sensorData.temperature - sensorData.initialTemperature) / sensorData.initialTemperature) * 100;
    const humidityChange = ((sensorData.humidity - sensorData.initialHumidity) / sensorData.initialHumidity) * 100;

    return {
      temperatureChange: tempChange,
      humidityChange: humidityChange
    };
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <div className="loading-text">Загрузка данных...</div>
        </div>
      );
    }

    const changes = calculateChanges();

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard sensorData={sensorData} changes={changes} />;
      case 'analytics':
        return <Analytics onDownloadReport={handleDownloadReport} />;
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
    border: '1px solid transparent',
    '&:hover': {
      backgroundColor: isActive ? '#9548ff' : 'rgba(130, 52, 247, 0.1)',
      borderColor: '#8234f7'
    }
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

        {/* Кнопка для создания тестовых данных */}
        <div style={{ marginTop: '30px', padding: '20px 0', borderTop: '1px solid #6d6d6d' }}>
          <button
            onClick={async () => {
              try {
                await microclimateService.seedData();
                logActivity('Создала тестовые данные', 'Система');
                alert('Тестовые данные созданы!');
                fetchInitialData(); // Перезагружаем данные
              } catch (error) {
                alert('Ошибка создания данных: ' + error.message);
              }
            }}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: 'rgba(102, 183, 64, 0.2)',
              border: '1px solid #66B740',
              borderRadius: '8px',
              color: '#66B740',
              cursor: 'pointer',
              fontFamily: '"Inter-Medium", Helvetica',
              fontSize: '14px',
              transition: 'all 0.3s ease'
            }}
          >
            Создать тестовые данные
          </button>
        </div>
      </div>

      {/* Основной контент */}
      <div className="main-content">
        {renderContent()}
      </div>

      {/* Стили для загрузки */}
      <style>{`
        .loading-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          color: white;
        }
        
        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(130, 52, 247, 0.3);
          border-radius: 50%;
          border-top-color: #8234f7;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }
        
        .loading-text {
          font-family: "Inter-Regular", Helvetica;
          font-size: 16px;
          color: #bababa;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        div[style*="menuItemStyle"]:hover {
          background-color: ${menuItemStyle(false)['&:hover'].backgroundColor} !important;
          border-color: ${menuItemStyle(false)['&:hover'].borderColor} !important;
        }
      `}</style>
    </div>
  );
}

export default App;