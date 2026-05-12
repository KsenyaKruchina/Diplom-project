// frontend/src/App.jsx

import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import "./App.css";
import Dashboard      from "./components/Dashboard";
import Analytics      from "./components/Analytics";
import Sensors        from "./components/Sensors";
import Reports        from "./components/Reports";
import SystemSettings from "./components/SystemSettings";

// иконки для меню
const IconDashboard = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="7" height="7" rx="1.5"
      stroke={active ? "#000" : "#fff"} strokeWidth="1.8"/>
    <rect x="14" y="3" width="7" height="7" rx="1.5"
      stroke={active ? "#000" : "#fff"} strokeWidth="1.8"/>
    <rect x="3" y="14" width="7" height="7" rx="1.5"
      stroke={active ? "#000" : "#fff"} strokeWidth="1.8"/>
    <rect x="14" y="14" width="7" height="7" rx="1.5"
      stroke={active ? "#000" : "#fff"} strokeWidth="1.8"/>
  </svg>
);

const IconSensors = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="3"
      stroke={active ? "#000" : "#fff"} strokeWidth="1.8"/>
    <path d="M6.3 6.3a8 8 0 0 0 0 11.4M17.7 6.3a8 8 0 0 1 0 11.4"
      stroke={active ? "#000" : "#fff"} strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M9.2 9.2a4 4 0 0 0 0 5.6M14.8 9.2a4 4 0 0 1 0 5.6"
      stroke={active ? "#000" : "#fff"} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const IconAnalytics = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <polyline points="3,17 8,12 13,15 21,7"
      stroke={active ? "#000" : "#fff"} strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="3" y1="20" x2="21" y2="20"
      stroke={active ? "#000" : "#fff"} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const IconReports = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="2"
      stroke={active ? "#000" : "#fff"} strokeWidth="1.8"/>
    <line x1="7" y1="8"  x2="17" y2="8"
      stroke={active ? "#000" : "#fff"} strokeWidth="1.6" strokeLinecap="round"/>
    <line x1="7" y1="12" x2="17" y2="12"
      stroke={active ? "#000" : "#fff"} strokeWidth="1.6" strokeLinecap="round"/>
    <line x1="7" y1="16" x2="13" y2="16"
      stroke={active ? "#000" : "#fff"} strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);

const IconSettings = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="3"
      stroke={active ? "#000" : "#fff"} strokeWidth="1.8"/>
    <path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
      stroke={active ? "#000" : "#fff"} strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconLogout = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
      stroke="#ff5b5b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="16 17 21 12 16 7"
      stroke="#ff5b5b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="21" y1="12" x2="9" y2="12"
      stroke="#ff5b5b" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

// Роли
// admin  → "Администратор" (Temperature KZ, полный контроль)
// editor → "Редактор"      (Компания, управление порогами и датчиками)
// viewer → "Наблюдатель"   (Сотрудник, только просмотр + устранение алармов)
const ROLE_DISPLAY = {
  admin:  "Администратор",
  editor: "Редактор",
  viewer: "Наблюдатель",
};

// Пункты меню 

const NAV_ITEMS = [
  { id: "dashboard", label: "Дашборд",     Icon: IconDashboard },
  { id: "sensors",   label: "Датчики",     Icon: IconSensors   },
  { id: "analytics", label: "Аналитика",   Icon: IconAnalytics },
  { id: "reports",   label: "Уведомления", Icon: IconReports   },
  { id: "settings",  label: "Настройки",   Icon: IconSettings  },
];

// Боковое меню 
const Sidebar = ({ activePage, onNavigate }) => {
  const { user, logout } = useAuth();

// для аватарки инициалы
  const initials = user?.full_name
    ? user.full_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : (user?.username || "?").slice(0, 2).toUpperCase();

  return (
    <aside className="app-sidebar">
      <div className="app-sidebar-logo">
        TEMPERATURA.KZ
      </div>


      <nav className="app-sidebar-nav"> 
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const active = activePage === id;
          return (
            <button
              key={id}
              className={`app-nav-item ${active ? "app-nav-item--active" : ""}`}
              onClick={() => onNavigate(id)}
            >
              <span className="app-nav-icon">
                <Icon active={active} />
              </span>
              <span className="app-nav-label">{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="app-sidebar-user">
        <div className="app-user-avatar">{initials}</div>
        <div style={{ flex: 1 }}>
          <div className="app-user-name">
            {user?.full_name || user?.username || "Пользователь"}
          </div>
          <div className="app-user-role">
            {ROLE_DISPLAY[user?.role] ?? "—"}
          </div>
        </div>
        <button className="app-logout-btn" onClick={logout} title="Выйти">
          <IconLogout />
        </button>
      </div>
    </aside>
  );
};

// Основной макет, первая страница выходит Дэшборд 
const AppLayout = () => {
  const [activePage, setActivePage] = useState("dashboard");

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":  return <Dashboard />;
      case "sensors":    return <Sensors />;
      case "analytics":  return <Analytics />;
      case "reports":    return <Reports />;
      case "settings":   return <SystemSettings />;
      default:           return <Dashboard />;
    }
  };

// две колонки — Sidebar слева и main справа, которые работаю сообща
  return (
    <div className="app-screen">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="app-main">
        {renderPage()}
      </main>
    </div>
  );
};

//Если данные ещё загружаются → показываем спиннер
//Если пользователь не авторизован (user = null) → показываем страницу входа
//Если авторизован → показываем основное приложение
const AppRouter = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading-screen">
        <div className="app-loading-spinner"></div>
        <span>Загрузка...</span>
      </div>
    );
  }

  if (!user) return <LoginPage />;
  return <AppLayout />;
};

// ЛЮБОЙ компонент внутри (AppRouter, Sidebar, Dashboard...) может вызвать useAuth() и получить данные пользователя.
const App = () => (
  <AuthProvider>
    <AppRouter />
  </AuthProvider>
);

export default App;