// components/Sensors.js
import React, { useState } from 'react';
import "./Sensors.css";

const Sensors = ({ 
  sensorData, 
  updateTemperature, 
  updateHumidity, 
  toggleTemperature, 
  toggleHumidity 
}) => {
  const [tempSwitch, setTempSwitch] = useState(sensorData.tempEnabled);
  const [humiditySwitch, setHumiditySwitch] = useState(sensorData.humidityEnabled);
  const [tempTooltip, setTempTooltip] = useState({ show: false, value: 0, position: 0 });
  const [humidityTooltip, setHumidityTooltip] = useState({ show: false, value: 0, position: 0 });

  // Обработчик изменения температуры
  const handleTempChange = (e) => {
    const newValue = parseFloat(e.target.value);
    updateTemperature(newValue);
  };

  // Обработчик изменения влажности
  const handleHumidityChange = (e) => {
    const newValue = parseFloat(e.target.value);
    updateHumidity(newValue);
  };

  // Показать подсказку температуры
  const showTempTooltip = (e) => {
    const rect = e.target.getBoundingClientRect();
    const position = e.clientX - rect.left;
    setTempTooltip({
      show: true,
      value: sensorData.temperature,
      position: position
    });
  };

  // Показать подсказку влажности
  const showHumidityTooltip = (e) => {
    const rect = e.target.getBoundingClientRect();
    const position = e.clientX - rect.left;
    setHumidityTooltip({
      show: true,
      value: sensorData.humidity,
      position: position
    });
  };

  // Скрыть подсказки
  const hideTempTooltip = () => {
    setTempTooltip({ show: false, value: 0, position: 0 });
  };

  const hideHumidityTooltip = () => {
    setHumidityTooltip({ show: false, value: 0, position: 0 });
  };

  // Синхронизация переключателей
  const handleTempToggle = (enabled) => {
    toggleTemperature(enabled);
    setTempSwitch(enabled);
  };

  const handleHumidityToggle = (enabled) => {
    toggleHumidity(enabled);
    setHumiditySwitch(enabled);
  };

  return (
    <div className="sensors-screen">
      <div className="sensors-text-wrapper">Датчики</div>
      <div className="sensors-text-wrapper-9">Настройка датчиков</div>

      {/* Карточка регулирования температуры */}
      <div className={`sensors-rectangle-2 ${!sensorData.tempEnabled ? 'sensors-disabled' : ''}`} />
      <div className={`sensors-text-wrapper-3 ${!sensorData.tempEnabled ? 'sensors-disabled-text' : ''}`}>Регулирование температуры</div>
      <div className={`sensors-text-wrapper-4 ${!sensorData.tempEnabled ? 'sensors-disabled-text' : ''}`}>Средняя температура: 20 °C</div>
      
      {/* Большие цифры температуры */}
      <div className={`sensors-text-wrapper-8 ${!sensorData.tempEnabled ? 'sensors-disabled-text' : ''}`}>{sensorData.temperature.toFixed(1)}</div>
      <div className={`sensors-text-wrapper-7 ${!sensorData.tempEnabled ? 'sensors-disabled-text' : ''}`}>°C</div>

      {/* Переключатель температуры */}
      <div 
        className={`sensors-text-wrapper-6 ${sensorData.tempEnabled ? 'sensors-active' : ''}`}
        onClick={() => handleTempToggle(true)}
      >
        Включено
      </div>
      <div 
        className={`sensors-ellipse ${sensorData.tempEnabled ? 'sensors-active' : ''}`}
        onClick={() => handleTempToggle(true)}
      />
      
      <div 
        className={`sensors-text-wrapper-10 ${!sensorData.tempEnabled ? 'sensors-active' : ''}`}
        onClick={() => handleTempToggle(false)}
      >
        Выключено
      </div>
      <div 
        className={`sensors-ellipse-2 ${!sensorData.tempEnabled ? 'sensors-active' : ''}`}
        onClick={() => handleTempToggle(false)}
      />

      {/* Ползунок температуры */}
      <div className="sensors-slider-container">
        <div className={`sensors-rectangle-3 ${!sensorData.tempEnabled ? 'sensors-disabled' : ''}`} />
        <div 
          className={`sensors-rectangle-4 ${!sensorData.tempEnabled ? 'sensors-disabled' : ''}`}
          style={{ width: `${((sensorData.temperature - 10) / 30) * 351}px` }}
        />
        
        <input
          type="range"
          min="10"
          max="40"
          step="0.1"
          value={sensorData.temperature}
          onChange={handleTempChange}
          onMouseMove={showTempTooltip}
          onMouseLeave={hideTempTooltip}
          disabled={!sensorData.tempEnabled}
          className="sensors-slider-input sensors-temp-slider"
        />
        
        <div 
          className={`sensors-ellipse-3 ${!sensorData.tempEnabled ? 'sensors-disabled' : ''}`}
          style={{ left: `${369 + ((sensorData.temperature - 10) / 30) * 351 - 15}px` }}
        />

        {/* Шкала температуры */}
        <div className={`sensors-slider-scale ${!sensorData.tempEnabled ? 'sensors-disabled-text' : ''}`} style={{ left: '369px', top: '545px' }}>
          <span>10°C</span>
          <span>25°C</span>
          <span>40°C</span>
        </div>

        {/* Подсказка ползунка температуры */}
        {tempTooltip.show && (
          <div 
            className="sensors-slider-tooltip sensors-temp-tooltip"
            style={{ 
              left: `${369 + tempTooltip.position - 25}px`,
            }}
          >
            {tempTooltip.value.toFixed(1)}°C
          </div>
        )}
      </div>

      {/* Карточка регулирования влажности */}
      <div className={`sensors-rectangle-5 ${!sensorData.humidityEnabled ? 'sensors-disabled' : ''}`} />
      <div className={`sensors-text-wrapper-11 ${!sensorData.humidityEnabled ? 'sensors-disabled-text' : ''}`}>Регулирование влажности</div>
      <div className={`sensors-text-wrapper-12 ${!sensorData.humidityEnabled ? 'sensors-disabled-text' : ''}`}>Средняя влажность: 80 %</div>
      
      {/* Большие цифры влажности */}
      <div className={`sensors-text-wrapper-17 ${!sensorData.humidityEnabled ? 'sensors-disabled-text' : ''}`}>{sensorData.humidity.toFixed(1)}</div>
      <div className={`sensors-text-wrapper-16 ${!sensorData.humidityEnabled ? 'sensors-disabled-text' : ''}`}>%</div>

      {/* Переключатель влажности */}
      <div 
        className={`sensors-text-wrapper-15 ${sensorData.humidityEnabled ? 'sensors-active' : ''}`}
        onClick={() => handleHumidityToggle(true)}
      >
        Включено
      </div>
      <div 
        className={`sensors-ellipse-4 ${sensorData.humidityEnabled ? 'sensors-active' : ''}`}
        onClick={() => handleHumidityToggle(true)}
      />
      
      <div 
        className={`sensors-text-wrapper-18 ${!sensorData.humidityEnabled ? 'sensors-active' : ''}`}
        onClick={() => handleHumidityToggle(false)}
      >
        Выключено
      </div>
      <div 
        className={`sensors-ellipse-5 ${!sensorData.humidityEnabled ? 'sensors-active' : ''}`}
        onClick={() => handleHumidityToggle(false)}
      />

      {/* Ползунок влажности */}
      <div className="sensors-slider-container">
        <div className={`sensors-rectangle-6 ${!sensorData.humidityEnabled ? 'sensors-disabled' : ''}`} />
        <div 
          className={`sensors-rectangle-7 ${!sensorData.humidityEnabled ? 'sensors-disabled' : ''}`}
          style={{ width: `${((sensorData.humidity - 30) / 70) * 351}px` }}
        />
        
        <input
          type="range"
          min="30"
          max="100"
          step="0.1"
          value={sensorData.humidity}
          onChange={handleHumidityChange}
          onMouseMove={showHumidityTooltip}
          onMouseLeave={hideHumidityTooltip}
          disabled={!sensorData.humidityEnabled}
          className="sensors-slider-input sensors-humidity-slider"
        />
        
        <div 
          className={`sensors-ellipse-6 ${!sensorData.humidityEnabled ? 'sensors-disabled' : ''}`}
          style={{ left: `${846 + ((sensorData.humidity - 30) / 70) * 351 - 15}px` }}
        />

        {/* Шкала влажности */}
        <div className={`sensors-slider-scale ${!sensorData.humidityEnabled ? 'sensors-disabled-text' : ''}`} style={{ left: '846px', top: '545px' }}>
          <span>30%</span>
          <span>65%</span>
          <span>100%</span>
        </div>

        {/* Подсказка ползунка влажности */}
        {humidityTooltip.show && (
          <div 
            className="sensors-slider-tooltip sensors-humidity-tooltip"
            style={{ 
              left: `${846 + humidityTooltip.position - 25}px`,
            }}
          >
            {humidityTooltip.value.toFixed(1)}%
          </div>
        )}
      </div>

      {/* Карточка управления температурой */}
      <div className="sensors-rectangle-8" />
      <div className="sensors-text-wrapper-21">Температура</div>
      <div className="sensors-text-wrapper-23">{sensorData.temperature.toFixed(1)}</div>
      <div className="sensors-text-wrapper-22">°C</div>

      {/* Переключатель температуры 2 */}
      <div 
        className={`sensors-text-wrapper-19 ${tempSwitch ? 'sensors-active' : ''}`}
        onClick={() => handleTempToggle(true)}
      >
        Включено
      </div>
      <div 
        className={`sensors-ellipse-7 ${tempSwitch ? 'sensors-active' : ''}`}
        onClick={() => handleTempToggle(true)}
      />
      
      <div 
        className={`sensors-text-wrapper-20 ${!tempSwitch ? 'sensors-active' : ''}`}
        onClick={() => handleTempToggle(false)}
      >
        Выключено
      </div>
      <div 
        className={`sensors-ellipse-8 ${!tempSwitch ? 'sensors-active' : ''}`}
        onClick={() => handleTempToggle(false)}
      />

      {/* Toggle switch температура */}
      <div 
        className={`sensors-rectangle-9 ${!sensorData.tempEnabled ? 'sensors-disabled-toggle' : ''}`}
        onClick={() => handleTempToggle(!tempSwitch)}
      />
      <div 
        className={`sensors-ellipse-9 ${!sensorData.tempEnabled ? 'sensors-disabled-toggle' : ''}`}
        onClick={() => handleTempToggle(!tempSwitch)}
        style={{ 
          left: tempSwitch ? '386px' : '450px'
        }}
      />

      {/* Карточка управления влажностью */}
      <div className="sensors-rectangle-10" />
      <div className="sensors-text-wrapper-26">Влажность</div>
      <div className="sensors-text-wrapper-28">{sensorData.humidity.toFixed(1)}</div>
      <div className="sensors-text-wrapper-27">%</div>

      {/* Переключатель влажности 2 */}
      <div 
        className={`sensors-text-wrapper-24 ${humiditySwitch ? 'sensors-active' : ''}`}
        onClick={() => handleHumidityToggle(true)}
      >
        Включено
      </div>
      <div 
        className={`sensors-ellipse-10 ${humiditySwitch ? 'sensors-active' : ''}`}
        onClick={() => handleHumidityToggle(true)}
      />
      
      <div 
        className={`sensors-text-wrapper-25 ${!humiditySwitch ? 'sensors-active' : ''}`}
        onClick={() => handleHumidityToggle(false)}
      >
        Выключено
      </div>
      <div 
        className={`sensors-ellipse-11 ${!humiditySwitch ? 'sensors-active' : ''}`}
        onClick={() => handleHumidityToggle(false)}
      />

      {/* Toggle switch влажность */}
      <div 
        className={`sensors-rectangle-11 ${!sensorData.humidityEnabled ? 'sensors-disabled-toggle' : ''}`}
        onClick={() => handleHumidityToggle(!humiditySwitch)}
      />
      <div 
        className={`sensors-ellipse-12 ${!sensorData.humidityEnabled ? 'sensors-disabled-toggle' : ''}`}
        onClick={() => handleHumidityToggle(!humiditySwitch)}
        style={{ 
          left: humiditySwitch ? '860px' : '931px'
        }}
      />
    </div>
  );
};

export default Sensors;