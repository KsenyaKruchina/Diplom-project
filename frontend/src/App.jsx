// App.jsx
import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import Sensors from './components/Sensors';
import { Users } from './components/Users';
import { GridFour01 } from './components/icons/GridFour01';
import { StyleLine } from './components/icons/StyleLine';
import { User } from './components/icons/User';
import { ViewList } from './components/icons/ViewList';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Начальные значения (базовые)
  const initialTemperature = 18.4;
  const initialHumidity = 75.7;
  
  // Общее состояние для данных датчиков
  const [sensorData, setSensorData] = useState({
    temperature: initialTemperature,
    humidity: initialHumidity,
    tempEnabled: true,
    humidityEnabled: false,
    // Добавляем начальные значения для расчета изменений
    initialTemperature: initialTemperature,
    initialHumidity: initialHumidity
  });

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

  // Функция для расчета изменений в процентах
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
        return <Analytics />;
      case 'sensors':
        return (
          <Sensors 
            sensorData={sensorData}
            updateTemperature={updateTemperature}
            updateHumidity={updateHumidity}
            toggleTemperature={toggleTemperature}
            toggleHumidity={toggleHumidity}
          />
        );
      case 'users':
        return <Users />;
      default:
        return <Dashboard sensorData={sensorData} changes={changes} />;
    }
  };

  // ... остальной код App (menuStyle, menuItemStyle) без изменений
  const menuStyle = {
    position: 'fixed',
    left: '20px',
    top: '19px',
    width: '279px',
    height: '983px',
    backgroundColor: '#414141',
    zIndex: 1000
  };

  const menuItemStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    margin: '8px',
    borderRadius: '12px',
    backgroundColor: isActive ? '#8234f7' : 'transparent',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    color: 'white',
    fontFamily: '"Inter-SemiBold", Helvetica',
    fontSize: '18px',
    zIndex: 1001
  });

  return (
    <div className="screen">
      {/* Боковое меню */}
      <div style={menuStyle}>
        <div 
          style={menuItemStyle(activeTab === 'dashboard')}
          onClick={() => setActiveTab('dashboard')}
        >
          <GridFour01 color="white" />
          <span>Дэшборд</span>
        </div>
        
        <div 
          style={menuItemStyle(activeTab === 'analytics')}
          onClick={() => setActiveTab('analytics')}
        >
          <ViewList color="white" />
          <span>Анализ</span>
        </div>
        
        <div 
          style={menuItemStyle(activeTab === 'sensors')}
          onClick={() => setActiveTab('sensors')}
        >
          <StyleLine color="white" />
          <span>Датчики</span>
        </div>
        
        <div 
          style={menuItemStyle(activeTab === 'users')}
          onClick={() => setActiveTab('users')}
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