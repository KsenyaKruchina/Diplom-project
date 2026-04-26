import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import Sensors from './components/Sensors';
import Users from './components/SystemSettings';
import Reports from './components/Reports';
import { microclimateService } from './services/microclimateService';
import './App.css';

// --- ОРИГИНАЛЬНЫЕ ИКОНКИ ИЗ DASHBOARD.JSX ---
const IconDashboard = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z" opacity=".9"/>
  </svg>
);

const IconSensors = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M6.3 6.3a8 8 0 0 0 0 11.4M17.7 6.3a8 8 0 0 1 0 11.4M3.5 3.5a14 14 0 0 0 0 17M20.5 3.5a14 14 0 0 1 0 17"/>
  </svg>
);

const IconAnalytics = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M5 3v16h16v2H3V3h2zm14.293 2.293 1.414 1.414L16 11.414l-3-3-4.707 4.707-1.414-1.414L13 5.586l3 3 4.293-4.293z"/>
  </svg>
);

const IconReports = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15h8v2H8zm0-4h8v2H8z"/>
  </svg>
);

const IconSettings = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
  </svg>
);

const IconPerson = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
  </svg>
);
// --- КОНЕЦ ИКОНОК ---

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const initialTemperature = 20.2;
  const initialHumidity = 43.8;

  const [sensorData, setSensorData] = useState({
    temperature: initialTemperature,
    humidity: initialHumidity,
    tempEnabled: true,
    humidityEnabled: false,
    initialTemperature: initialTemperature,
    initialHumidity: initialHumidity
  });

  useEffect(() => {
    fetchInitialData();
    logActivity('Вошла в систему', 'Система');
  }, []);

  useEffect(() => {
    localStorage.setItem('userActivities', JSON.stringify(activities));
  }, [activities]);

  const fetchInitialData = async () => {
    try {
      const savedActivities = localStorage.getItem('userActivities');
      if (savedActivities) {
        setActivities(JSON.parse(savedActivities));
      }
      
      try {
        const [stats, logs] = await Promise.all([
          microclimateService.getDashboardStats(),
          microclimateService.getLogs(20)
        ]);
        
        setSensorData(prev => ({
          ...prev,
          temperature: stats.avg_temperature || initialTemperature,
          humidity: stats.avg_humidity || initialHumidity,
          initialTemperature: stats.avg_temperature || initialTemperature,
          initialHumidity: stats.avg_humidity || initialHumidity
        }));
        
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
      }
      
    } catch (error) {
      console.error('Ошибка при загрузке данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const logActivity = (action, room = 'Общее') => {
    const newActivity = {
      id: Date.now(),
      user_name: 'Engineer Kseniya Kruchina',
      action: action,
      room: room,
      completed: true,
      timestamp: new Date().toISOString()
    };
    
    setActivities(prev => [newActivity, ...prev.slice(0, 49)]);
  };

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

  const handleDownloadReport = (reportType) => {
    logActivity(`Скачала ${reportType} отчет`, 'Отчеты');
    console.log(`Скачивание отчета: ${reportType}`);
  };

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
        return <Dashboard 
          sensorData={sensorData} 
          changes={changes} 
          logActivity={logActivity}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />;
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
      case 'reports':
        return <Reports />;
      case 'users':
        return <Users activities={activities} />;
      default:
        return <Dashboard 
          sensorData={sensorData} 
          changes={changes} 
          logActivity={logActivity}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />;
    }
  };

  return (
    <div className="app-screen">
      {/* Sidebar - точная копия из Dashboard.jsx */}
      <aside className="app-sidebar">
        <div className="app-sidebar-logo">TEMPERATURA.KZ</div>

        <nav className="app-sidebar-nav">
          <button
            className={`app-nav-item ${activeTab === 'dashboard' ? 'app-nav-item--active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="app-nav-icon"><IconDashboard /></span>
            <span className="app-nav-label">Дэшборд</span>
          </button>

          <button
            className={`app-nav-item ${activeTab === 'sensors' ? 'app-nav-item--active' : ''}`}
            onClick={() => setActiveTab('sensors')}
          >
            <span className="app-nav-icon"><IconSensors /></span>
            <span className="app-nav-label">Датчики</span>
          </button>

          <button
            className={`app-nav-item ${activeTab === 'analytics' ? 'app-nav-item--active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <span className="app-nav-icon"><IconAnalytics /></span>
            <span className="app-nav-label">Аналитика</span>
          </button>

          <button
            className={`app-nav-item ${activeTab === 'reports' ? 'app-nav-item--active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <span className="app-nav-icon"><IconReports /></span>
            <span className="app-nav-label">Уведомления</span>
          </button>

          <button
            className={`app-nav-item ${activeTab === 'users' ? 'app-nav-item--active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <span className="app-nav-icon"><IconSettings /></span>
            <span className="app-nav-label">Настройки</span>
          </button>
        </nav>

        <div className="app-sidebar-user">
          <IconPerson />
          <span>Кручина Ксения</span>
        </div>
      </aside>

      {/* Main Content */}
      <div className="app-main">
        {renderContent()}
      </div>

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
          border: 4px solid rgba(255, 194, 7, 0.3);
          border-radius: 50%;
          border-top-color: #ffc207;
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
      `}</style>
    </div>
  );
}

export default App;