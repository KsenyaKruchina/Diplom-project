import React from "react";
import { FiRsDownload } from "./icons/FiRsDownload";
import { FileText01 } from "./icons/FileText01";
import { FileText6 } from "./icons/FileText6";
import "./Analytics.css";

const Analytics = () => {
  // Моковые данные для отчетов
  const reports = [
    {
      id: 1,
      title: "Недельный отчет",
      date: "22.11.2025",
      type: "weekly",
      icon: FileText6,
      iconColor: "#B7A2EE"
    },
    {
      id: 2,
      title: "Месячный отчет", 
      date: "22.11.2025",
      type: "monthly",
      icon: FileText01,
      iconColor: "#66B740"
    },
    {
      id: 3,
      title: "Недельный отчет",
      date: "22.11.2025",
      type: "weekly",
      icon: FileText6,
      iconColor: "#B7A2EE"
    },
    {
      id: 4,
      title: "Недельный отчет",
      date: "22.11.2025", 
      type: "weekly",
      icon: FileText6,
      iconColor: "#B7A2EE"
    },
    {
      id: 5,
      title: "Недельный отчет",
      date: "22.11.2025",
      type: "weekly",
      icon: FileText6,
      iconColor: "#B7A2EE"
    },
    {
      id: 6,
      title: "Недельный отчет",
      date: "22.11.2025",
      type: "weekly",
      icon: FileText6,
      iconColor: "#B7A2EE"
    }
  ];

  const handleDownload = (reportId, reportType) => {
    console.log(`Скачивание отчета: ${reportType}, ID: ${reportId}`);
    // Здесь будет логика скачивания отчета
  };

  return (
    <div className="analytics-wrapper">
      <div className="analytics-title">Отчеты</div>

      {/* Карточки основных отчетов */}
      <div className="analytics-cards-container">
        <div className="analytics-card">
          <div className="analytics-card-content">
            <FileText01 className="analytics-card-icon" color="#B7A2EE" />
            <div className="analytics-card-title">
              Недельный<br />отчет
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
            <div className="analytics-card-divider" />
            <FiRsDownload 
              className="analytics-download-icon" 
              color="#6E6E6E"
              onClick={() => handleDownload(2, 'monthly')}
            />
          </div>
        </div>
      </div>

      {/* Список файлов */}
      <div className="analytics-files-container">
        <div className="analytics-files-title">Файлы</div>
        
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
                    <div className="analytics-file-date">{report.date}</div>
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
  );
};

export default Analytics;