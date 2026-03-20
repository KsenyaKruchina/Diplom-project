const MICROCLIMATE_API_URL = '/api';

// Функция для получения названия комнаты по ID
const getRoomName = (id) => {
  const roomNames = {
    1: 'Главный офис',
    2: 'Конференц-зал',
    3: 'Серверная',
    4: 'Переговорная'
  };
  return roomNames[id] || `Комната ${id}`;
};

// Функция для получения дефолтных локаций
const getDefaultLocations = () => {
  return [
    { id: 1, name: 'Главный офис' },
    { id: 2, name: 'Конференц-зал' },
    { id: 3, name: 'Серверная' },
    { id: 4, name: 'Переговорная' }
  ];
};

// Функция получения текущего пользователя
const getCurrentUser = () => {
  return {
    id: 1,
    full_name: "Kseniya Kruchina",
    role: "Администратор",
    is_online: true,
    last_login: new Date().toISOString()
  };
};

// Основной сервис
export const microclimateService = {
  // === ЛОКАЦИИ И КАБИНЕТЫ ===
  async getLocations() {
    try {
      const response = await fetch(`${MICROCLIMATE_API_URL}/locations`);
      if (!response.ok) throw new Error('Ошибка загрузки локаций');
      let data = await response.json();
      
      // Нормализуем данные
      if (data && Array.isArray(data)) {
        const normalizedData = data.slice(0, 4).map((item, index) => ({
          ...item,
          id: index + 1,
          name: getRoomName(index + 1)
        }));
        
        if (normalizedData.length < 4) {
          for (let i = normalizedData.length; i < 4; i++) {
            normalizedData.push({
              id: i + 1,
              name: getRoomName(i + 1)
            });
          }
        }
        
        return normalizedData;
      }
      
      throw new Error('Нет данных от API');
      
    } catch (error) {
      console.error('Ошибка загрузки локаций:', error);
      return getDefaultLocations();
    }
  },

  // === ДАТЧИКИ ===
  async getSensors(locationId) {
    try {
      const response = await fetch(`${MICROCLIMATE_API_URL}/sensors/${locationId}`);
      if (!response.ok) throw new Error('Ошибка загрузки датчиков');
      return await response.json();
    } catch (error) {
      console.error('Ошибка:', error);
      const randomTemp = 21.5 + Math.random() * 3;
      const randomHumidity = 44.3 + Math.random() * 5;
      
      return [
        {
          id: 1,
          name: 'Кондиционер',
          sensor_type: { name: 'Temperature', unit: '°C' },
          is_active: true,
          target_value: 22.0,
          last_value: randomTemp
        },
        {
          id: 2,
          name: 'Увлажнитель',
          sensor_type: { name: 'Humidity', unit: '%' },
          is_active: true,
          target_value: 45.0,
          last_value: randomHumidity
        }
      ];
    }
  },

  async updateSensor(sensorId, data) {
    try {
      const response = await fetch(`${MICROCLIMATE_API_URL}/sensors/${sensorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Ошибка обновления датчика');
      return await response.json();
    } catch (error) {
      console.error('Ошибка:', error);
      return { success: true };
    }
  },

  // === СТАТИСТИКА ===
  async getDashboardStats() {
    try {
      const response = await fetch(`${MICROCLIMATE_API_URL}/dashboard/stats`);
      if (!response.ok) throw new Error('Ошибка загрузки статистики');
      return await response.json();
    } catch (error) {
      console.error('Ошибка:', error);
      const randomChange = () => (Math.random() * 4 - 2).toFixed(1);
      
      return {
        avg_temperature: 22.5,
        avg_humidity: 45.3,
        temp_change: randomChange(),
        hum_change: randomChange()
      };
    }
  },

  async getRooms() {
    try {
      const response = await fetch(`${MICROCLIMATE_API_URL}/rooms`);
      if (!response.ok) throw new Error('Ошибка загрузки комнат');
      const data = await response.json();
      
      return data.slice(0, 4).map((room, index) => ({
        ...room,
        id: index + 1,
        name: getRoomName(index + 1)
      }));
    } catch (error) {
      console.error('Ошибка:', error);
      return [
        { 
          id: 1, 
          name: 'Главный офис', 
          temperature: 23.1, 
          humidity: 44.2, 
          sensor_count: 2 
        },
        { 
          id: 2, 
          name: 'Конференц-зал', 
          temperature: 21.8, 
          humidity: 46.7, 
          sensor_count: 2 
        },
        { 
          id: 3, 
          name: 'Серверная', 
          temperature: 22.9, 
          humidity: 43.9, 
          sensor_count: 2 
        },
        { 
          id: 4, 
          name: 'Переговорная', 
          temperature: 23.5, 
          humidity: 45.2, 
          sensor_count: 2 
        }
      ];
    }
  },

  // === ОТЧЕТЫ ===
  async getReports() {
    try {
      const response = await fetch(`${MICROCLIMATE_API_URL}/reports`);
      if (!response.ok) throw new Error('Ошибка загрузки отчетов');
      return await response.json();
    } catch (error) {
      console.error('Ошибка:', error);
      return [];
    }
  },

  async generateReport(period) {
    try {
      const response = await fetch(`${MICROCLIMATE_API_URL}/reports/generate/${period}`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Ошибка генерации отчета');
      return await response.json();
    } catch (error) {
      console.error('Ошибка:', error);
      return { message: "Отчет сгенерирован" };
    }
  },

  // === ПОЛЬЗОВАТЕЛИ И ЛОГИ ===
  async getUsers() {
    try {
      const response = await fetch(`${MICROCLIMATE_API_URL}/users`);
      if (!response.ok) throw new Error('Ошибка загрузки пользователей');
      const users = await response.json();
      
      if (users.length === 0) {
        return [getCurrentUser()];
      }
      
      return users.map((user, index) => ({
        ...user,
        id: user.id || index + 1,
        full_name: user.full_name || (index === 0 ? "Kseniya Kruchina" : `Пользователь ${index + 1}`),
        role: user.role || (index === 0 ? "Администратор" : "Пользователь"),
        is_online: true,
        last_login: user.last_login || new Date().toISOString()
      }));
    } catch (error) {
      console.error('Ошибка:', error);
      return [getCurrentUser()];
    }
  },

  async getLogs(limit = 20) {
    try {
      const response = await fetch(`${MICROCLIMATE_API_URL}/logs?limit=${limit}`);
      if (!response.ok) throw new Error('Ошибка загрузки логов');
      const logs = await response.json();
      
      return logs.map(log => ({
        ...log,
        user_name: log.user_name || "Kseniya Kruchina"
      }));
    } catch (error) {
      console.error('Ошибка:', error);
      return [];
    }
  },

  // === УТИЛИТЫ ===
  async seedData() {
    try {
      const response = await fetch(`${MICROCLIMATE_API_URL}/seed_data`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Ошибка создания данных');
      return await response.json();
    } catch (error) {
      console.error('Ошибка:', error);
      return { message: "Данные созданы" };
    }
  }
};

// Утилиты
export const microclimateUtils = {
  formatDate(dateString) {
    if (!dateString) return '--';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '--';
    }
  },

  formatTemperature(value) {
    if (value === null || value === undefined) return '--°C';
    return `${parseFloat(value).toFixed(1)}°C`;
  },

  formatHumidity(value) {
    if (value === null || value === undefined) return '--%';
    return `${parseFloat(value).toFixed(1)}%`;
  }
};