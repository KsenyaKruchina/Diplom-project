// components/Analytics.jsx
import React from "react";
import { FiRsDownload } from "./icons/FiRsDownload";
import { FileText01 } from "./icons/FileText01";
import { FileText6 } from "./icons/FileText6";
import "./Analytics.css";

const Analytics = ({ onDownloadReport, activities = [] }) => {
  // Моковые данные для отчетов
  const reports = [
    {
      id: 1,
      title: "Недельный отчет",
      date: "22.11.2025",
      type: "weekly",
      icon: FileText6,
      iconColor: "#B7A2EE",
      description: "Отчет за последнюю неделю"
    },
    {
      id: 2,
      title: "Месячный отчет", 
      date: "22.11.2025",
      type: "monthly",
      icon: FileText01,
      iconColor: "#66B740",
      description: "Отчет за последний месяц"
    },
    {
      id: 3,
      title: "Отчет по действиям",
      date: new Date().toLocaleDateString('ru-RU'),
      type: "audit",
      icon: FileText01,
      iconColor: "#8234f7",
      description: "Полная история действий пользователей"
    },
    {
      id: 4,
      title: "Отчет по температуре",
      date: "22.11.2025", 
      type: "temperature",
      icon: FileText6,
      iconColor: "#FF9D00",
      description: "Статистика изменений температуры"
    },
    {
      id: 5,
      title: "Отчет по влажности",
      date: "22.11.2025",
      type: "humidity",
      icon: FileText6,
      iconColor: "#66B7FF",
      description: "Статистика изменений влажности"
    },
    {
      id: 6,
      title: "Системный отчет",
      date: "22.11.2025",
      type: "system",
      icon: FileText6,
      iconColor: "#B7A2EE",
      description: "Общий отчет работы системы"
    }
  ];

  const generateAuditReport = () => {
    if (activities.length === 0) {
      return "Нет данных для отчета";
    }

    let reportContent = `=== ОТЧЕТ ПО ДЕЙСТВИЯМ ПОЛЬЗОВАТЕЛЕЙ ===\n\n`;
    reportContent += `Сгенерирован: ${new Date().toLocaleString('ru-RU')}\n`;
    reportContent += `Всего действий: ${activities.length}\n`;
    reportContent += `Период: с ${new Date(activities[activities.length - 1].timestamp).toLocaleDateString('ru-RU')} по ${new Date(activities[0].timestamp).toLocaleDateString('ru-RU')}\n\n`;
    
    // Только последние 50 действий для недельного/месячного отчета
    const recentActions = activities.slice(0, Math.min(50, activities.length));
    
    recentActions.forEach((activity, index) => {
      const date = new Date(activity.timestamp);
      reportContent += `${index + 1}. ${date.toLocaleDateString('ru-RU')} ${date.toLocaleTimeString('ru-RU')}\n`;
      reportContent += `   ${activity.user_name}: ${activity.action}\n`;
      reportContent += `   Комната: ${activity.room || 'Общее'}\n`;
      reportContent += `   Статус: ${activity.completed ? 'Выполнено' : 'В процессе'}\n`;
      reportContent += `   ---\n`;
    });

    return reportContent;
  };

  const generateTemperatureReport = () => {
    const tempActions = activities.filter(a => 
      a.action.includes('температуру') || a.action.includes('кондиционер')
    );
    
    let reportContent = `=== ОТЧЕТ ПО ТЕМПЕРАТУРЕ ===\n\n`;
    reportContent += `Сгенерирован: ${new Date().toLocaleString('ru-RU')}\n`;
    reportContent += `Всего изменений температуры: ${tempActions.length}\n\n`;
    
    tempActions.forEach((action, index) => {
      const date = new Date(action.timestamp);
      reportContent += `${index + 1}. ${date.toLocaleDateString('ru-RU')} ${date.toLocaleTimeString('ru-RU')}\n`;
      reportContent += `   ${action.action}\n`;
      reportContent += `   Комната: ${action.room || 'Общее'}\n`;
      reportContent += `   ---\n`;
    });

    return reportContent;
  };

  const generateHumidityReport = () => {
    const humidityActions = activities.filter(a => 
      a.action.includes('влажность') || a.action.includes('увлажнитель')
    );
    
    let reportContent = `=== ОТЧЕТ ПО ВЛАЖНОСТИ ===\n\n`;
    reportContent += `Сгенерирован: ${new Date().toLocaleString('ru-RU')}\n`;
    reportContent += `Всего изменений влажности: ${humidityActions.length}\n\n`;
    
    humidityActions.forEach((action, index) => {
      const date = new Date(action.timestamp);
      reportContent += `${index + 1}. ${date.toLocaleDateString('ru-RU')} ${date.toLocaleTimeString('ru-RU')}\n`;
      reportContent += `   ${action.action}\n`;
      reportContent += `   Комната: ${action.room || 'Общее'}\n`;
      reportContent += `   ---\n`;
    });

    return reportContent;
  };

  const handleDownload = (reportId, reportType) => {
    console.log(`Скачивание отчета: ${reportType}, ID: ${reportId}`);
    
    let reportContent = "";
    let fileName = "";
    
    switch(reportType) {
      case 'weekly':
      case 'monthly':
        reportContent = generateAuditReport();
        fileName = `${reportType}_отчет_действий_${new Date().toISOString().split('T')[0]}.txt`;
        break;
      case 'audit':
        reportContent = generateAuditReport();
        fileName = `полный_аудит_отчет_${new Date().toISOString().split('T')[0]}.txt`;
        break;
      case 'temperature':
        reportContent = generateTemperatureReport();
        fileName = `отчет_температура_${new Date().toISOString().split('T')[0]}.txt`;
        break;
      case 'humidity':
        reportContent = generateHumidityReport();
        fileName = `отчет_влажность_${new Date().toISOString().split('T')[0]}.txt`;
        break;
      default:
        reportContent = `Отчет: ${reportType}\nДата: ${new Date().toLocaleDateString('ru-RU')}\n`;
        fileName = `${reportType}_отчет_${new Date().toISOString().split('T')[0]}.txt`;
    }
    
    // Вызываем функцию логирования, если она передана
    if (onDownloadReport) {
      onDownloadReport(reportType);
    }
    
    // Создаем и скачиваем файл
    const element = document.createElement('a');
    const file = new Blob([reportContent], {type: 'text/plain;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="analytics-screen">
      <div className="analytics-main-content">
        <div className="analytics-title">Отчеты</div>

        {/* Карточки основных отчетов */}
        <div className="analytics-cards-container">
          <div className="analytics-card">
            <div className="analytics-card-content">
              <FileText01 className="analytics-card-icon" color="#B7A2EE" />
              <div className="analytics-card-title">
                Недельный<br />отчет
              </div>
              <div className="analytics-card-description">
                Действия за неделю
              </div>
              <div className="analytics-card-divider" />
              <FiRsDownload 
                className="analytics-download-icon" 
                color="#6E6E6E"
                onClick={() => handleDownload(1, 'weekly')}
              />
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-card-content">
              <FileText01 className="analytics-card-icon" color="#66B740" />
              <div className="analytics-card-title">
                Месячный<br />отчет
              </div>
              <div className="analytics-card-description">
                Действия за месяц
              </div>
              <div className="analytics-card-divider" />
              <FiRsDownload 
                className="analytics-download-icon" 
                color="#6E6E6E"
                onClick={() => handleDownload(2, 'monthly')}
              />
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-card-content">
              <FileText01 className="analytics-card-icon" color="#8234f7" />
              <div className="analytics-card-title">
                Аудит<br />отчет
              </div>
              <div className="analytics-card-description">
                Все действия
              </div>
              <div className="analytics-card-divider" />
              <FiRsDownload 
                className="analytics-download-icon" 
                color="#6E6E6E"
                onClick={() => handleDownload(3, 'audit')}
              />
            </div>
          </div>

          {/* ЧЕТВЕРТЫЙ БЛОК - ОТЧЕТ ПО ТЕМПЕРАТУРЕ */}
          <div className="analytics-card">
            <div className="analytics-card-content">
              <FileText6 className="analytics-card-icon" color="#FF9D00" />
              <div className="analytics-card-title">
                Отчет по<br />температуре
              </div>
              <div className="analytics-card-description">
                Статистика температуры
              </div>
              <div className="analytics-card-divider" />
              <FiRsDownload 
                className="analytics-download-icon" 
                color="#6E6E6E"
                onClick={() => handleDownload(4, 'temperature')}
              />
            </div>
          </div>
        </div>

        {/* Список файлов */}
        <div className="analytics-files-container">
          <div className="analytics-files-title">Доступные отчеты</div>
          
          <div className="analytics-files-list">
            {reports.map((report, index) => {
              const IconComponent = report.icon;
              return (
                <div key={report.id} className="analytics-file-item">
                  <div className="analytics-file-content">
                    <IconComponent 
                      className="analytics-file-icon" 
                      color={report.iconColor} 
                    />
                    <div className="analytics-file-info">
                      <div className="analytics-file-name">{report.title}</div>
                      <div className="analytics-file-description">{report.description}</div>
                      <div className="analytics-file-date">Дата: {report.date}</div>
                    </div>
                  </div>
                  
                  <button 
                    className="analytics-download-btn"
                    onClick={() => handleDownload(report.id, report.type)}
                  >
                    Скачать
                  </button>

                  {index < reports.length - 1 && (
                    <div className="analytics-file-divider" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;