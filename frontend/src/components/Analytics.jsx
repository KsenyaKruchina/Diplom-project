// components/Analytics.jsx
import React, { useState, useEffect } from "react";
import { FiRsDownload } from "./icons/FiRsDownload";
import { FileText01 } from "./icons/FileText01";
import { FileText6 } from "./icons/FileText6";
import { microclimateService, microclimateUtils } from "../services/microclimateService";
import "./Analytics.css";

const Analytics = ({ onDownloadReport }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reportsData, logsData] = await Promise.all([
        microclimateService.getReports(),
        microclimateService.getLogs(50)
      ]);
      setReports(reportsData);
      setActivities(logsData);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      // Моковые данные
      setReports([
        {
          id: 1,
          title: "Недельный отчет",
          file_path: "/reports/week_20251212_123456.txt",
          report_date: new Date().toISOString(),
          description: "Отчет за последнюю неделю"
        },
        {
          id: 2,
          title: "Месячный отчет",
          file_path: "/reports/month_20251212_123456.txt",
          report_date: new Date().toISOString(),
          description: "Отчет за последний месяц"
        }
      ]);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const generateAuditReport = () => {
    if (activities.length === 0) {
      return "Нет данных для отчета";
    }

    let reportContent = `=== ОТЧЕТ ПО ДЕЙСТВИЯМ ПОЛЬЗОВАТЕЛЕЙ ===\n\n`;
    reportContent += `Сгенерирован: ${new Date().toLocaleString('ru-RU')}\n`;
    reportContent += `Всего действий: ${activities.length}\n\n`;

    activities.forEach((activity, index) => {
      reportContent += `${index + 1}. ${microclimateUtils.formatDate(activity.timestamp)}\n`;
      reportContent += ` ${activity.user_name}: ${activity.action}\n`;
      reportContent += ` ---\n`;
    });

    return reportContent;
  };

  const generateTemperatureReport = async () => {
    try {
      // Пытаемся получить данные из API
      const stats = await microclimateService.getDashboardStats();
      let reportContent = `=== ОТЧЕТ ПО ТЕМПЕРАТУРЕ ===\n\n`;
      reportContent += `Сгенерирован: ${new Date().toLocaleString('ru-RU')}\n`;
      reportContent += `Средняя температура: ${stats.avg_temperature}°C\n`;
      reportContent += `Изменение за 24 часа: ${stats.temp_change}%\n\n`;

      reportContent += `=== СТАТИСТИКА ===\n\n`;
      reportContent += `• Средняя температура: ${stats.avg_temperature}°C\n`;
      reportContent += `• Средняя влажность: ${stats.avg_humidity}%\n`;
      reportContent += `• Изменение температуры: ${stats.temp_change}%\n`;
      reportContent += `• Изменение влажности: ${stats.hum_change}%\n`;

      return reportContent;
    } catch (error) {
      console.error('Ошибка:', error);
      return "=== ОТЧЕТ ПО ТЕМПЕРАТУРЕ ===\n\nНе удалось получить данные температуры с сервера";
    }
  };

  const handleDownload = async (reportType) => {
    console.log(`Скачивание отчета: ${reportType}`);
    let reportContent = "";
    let fileName = "";

    try {
      switch(reportType) {
        case 'weekly':
          const weeklyResult = await microclimateService.generateReport('week');
          reportContent = `Недельный отчет сгенерирован\nНазвание: ${weeklyResult.title}\nСсылка: ${weeklyResult.report_url || weeklyResult.message}`;
          fileName = `недельный_отчет_${new Date().toISOString().split('T')[0]}.txt`;
          break;
        case 'monthly':
          const monthlyResult = await microclimateService.generateReport('month');
          reportContent = `Месячный отчет сгенерирован\nНазвание: ${monthlyResult.title}\nСсылка: ${monthlyResult.report_url || monthlyResult.message}`;
          fileName = `месячный_отчет_${new Date().toISOString().split('T')[0]}.txt`;
          break;
        case 'audit':
          reportContent = generateAuditReport();
          fileName = `аудит_отчет_${new Date().toISOString().split('T')[0]}.txt`;
          break;
        case 'temperature':
          reportContent = await generateTemperatureReport();
          fileName = `отчет_температура_${new Date().toISOString().split('T')[0]}.txt`;
          break;
        default:
          reportContent = `Отчет: ${reportType}\nДата: ${new Date().toLocaleDateString('ru-RU')}\n`;
          fileName = `${reportType}_отчет_${new Date().toISOString().split('T')[0]}.txt`;
      }

      // Создаем и скачиваем файл
      const element = document.createElement('a');
      const file = new Blob([reportContent], {type: 'text/plain;charset=utf-8'});
      element.href = URL.createObjectURL(file);
      element.download = fileName;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.error('Ошибка при скачивании:', error);
      alert('Ошибка при генерации отчета');
    }

    if (onDownloadReport) {
      onDownloadReport(reportType);
    }
  };

  if (loading) {
    return (
      <div className="analytics-screen">
        <div className="analytics-main-content">
          <div className="analytics-title">Отчеты</div>
          <div style={{color: 'white', textAlign: 'center', padding: '50px'}}>Загрузка данных...</div>
        </div>
      </div>
    );
  }

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
                onClick={() => handleDownload('weekly')}
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
                onClick={() => handleDownload('monthly')}
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
                onClick={() => handleDownload('audit')}
              />
            </div>
          </div>

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
                onClick={() => handleDownload('temperature')}
              />
            </div>
          </div>
        </div>

        {/* Список файлов */}
        <div className="analytics-files-container">
          <div className="analytics-files-title">Доступные отчеты</div>
          <div className="analytics-files-list">
            {reports.length > 0 ? (
              reports.map((report, index) => {
                const IconComponent = report.title.includes('Недельный') ? FileText6 : FileText01;
                const iconColor = report.title.includes('Недельный') ? '#B7A2EE' :
                  report.title.includes('Месячный') ? '#66B740' : '#8234f7';

                return (
                  <div key={report.id || index} className="analytics-file-item">
                    <div className="analytics-file-content">
                      <IconComponent
                        className="analytics-file-icon"
                        color={iconColor}
                      />
                      <div className="analytics-file-info">
                        <div className="analytics-file-name">{report.title}</div>
                        <div className="analytics-file-description">
                          {report.description || 'Отчет системы мониторинга'}
                        </div>
                        <div className="analytics-file-date">
                          Дата: {microclimateUtils.formatDate(report.report_date)}
                        </div>
                      </div>
                    </div>
                    <button
                      className="analytics-download-btn"
                      onClick={() => {
                        // Открываем отчет в новой вкладке
                        if (report.file_path) {
                          // Используем прокси для доступа к файлам
                          window.open(`/api${report.file_path}`, '_blank');
                        } else {
                          handleDownload('audit');
                        }
                      }}
                    >
                      Скачать
                    </button>
                    {index < reports.length - 1 && (
                      <div className="analytics-file-divider" />
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{padding: '40px', textAlign: 'center', color: '#bababa'}}>
                Нет доступных отчетов. Сгенерируйте первый отчет.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;