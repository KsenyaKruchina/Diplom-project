import React, { useState, useEffect, useMemo } from "react";
import "./SystemSettings.css";

const BASE_URL = "http://157.90.127.202:8000";

const api = async (path, options = {}) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/api/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    return null;
  }
  return res;
};

// ── Icons ─────────────────────────────────────────────────────────
const IconPlus = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <line x1="9" y1="2" x2="9" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <line x1="2" y1="9" x2="16" y2="9" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const IconSort = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M7 4v12M7 16l-3-3M7 16l3-3M13 16V4M13 4l-3 3M13 4l3 3" stroke="#929292" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconEdit = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M11 2l3 3-8 8H3v-3l8-8z" stroke="#929292" strokeWidth="1.3" strokeLinejoin="round"/>
  </svg>
);

const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3" stroke="#ff5b5b" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 11l3-3-3-3" stroke="#ff5b5b" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="13" y1="8" x2="6" y2="8" stroke="#ff5b5b" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <line x1="3" y1="3" x2="13" y2="13" stroke="#929292" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="13" y1="3" x2="3" y2="13" stroke="#929292" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconBuilding = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="4" width="12" height="10" rx="1" stroke="#ffc207" strokeWidth="1.3"/>
    <path d="M5 14V9h6v5" stroke="#ffc207" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M5 4V2h6v2" stroke="#ffc207" strokeWidth="1.3" strokeLinecap="round"/>
    <rect x="6.5" y="10" width="3" height="2" rx="0.5" fill="#ffc207"/>
  </svg>
);

const IconArrowBack = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M12 5l-5 5 5 5" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconHistory = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <circle cx="7.5" cy="7.5" r="5.5" stroke="#929292" strokeWidth="1.3"/>
    <path d="M7.5 4.5v3l2 1.5" stroke="#929292" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconUsers = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <circle cx="5.5" cy="5" r="2.5" stroke="#929292" strokeWidth="1.3"/>
    <path d="M1 13c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="#929292" strokeWidth="1.3" strokeLinecap="round"/>
    <circle cx="11" cy="4.5" r="2" stroke="#929292" strokeWidth="1.3"/>
    <path d="M13.5 12.5c0-2-1.3-3-2.5-3" stroke="#929292" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="7" cy="7" r="5" stroke="#929292" strokeWidth="1.3"/>
    <path d="M11 11l3.5 3.5" stroke="#929292" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

// ── Avatar ────────────────────────────────────────────────────────
const AVATAR_COLORS = ["#ffd550", "#07bcd4", "#01e676", "#ff5b5b", "#b47afe", "#ff8c42"];
const getAvatarColor = (id) => AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length];

const Avatar = ({ name, color, size = 28 }) => {
  const initials = (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="ss-avatar" style={{ width: size, height: size, background: color || "#ffd550", borderRadius: size / 2, fontSize: size * 0.38 }}>
      {initials}
    </div>
  );
};

// ── Constants ──────────────────────────────────────────────────────
const ROLE_LABELS = { admin: "Админ", editor: "Редактор", viewer: "Читатель" };
const ROLE_COLORS = { admin: "#ffd550", editor: "#07bcd4", viewer: "#929292" };
const STATUS_STYLE = {
  online:  { color: "#01e676", dot: "#01e676", label: "Онлайн" },
  offline: { color: "#ff5b5b", dot: "#ff5b5b", label: "Оффлайн" },
};

const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

// ── Add User Modal ─────────────────────────────────────────────────
const EMPTY_FORM = { full_name: "", username: "", password: "", email: "", role: "viewer", location_id: "" };

const AddUserModal = ({ onClose, onAdd, currentUser, locations }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: "" }));
  };

  const availableRoles = currentUser?.role === "admin"
    ? Object.entries(ROLE_LABELS)
    : [["viewer", ROLE_LABELS.viewer]];

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = "Введите ФИО";
    if (!form.username.trim())  e.username  = "Введите логин";
    if (!form.password.trim())  e.password  = "Введите пароль";
    if (!form.email.trim())     e.email     = "Введите email";
    if (!form.location_id)      e.location_id = "Выберите локацию";
    return e;
  };

  const handleAdd = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/v1/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: form.full_name,
          username: form.username,
          password: form.password,
          email: form.email,
          role: form.role,
          location_id: parseInt(form.location_id),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        const detail = typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail);
        setErrors({ username: detail });
        setLoading(false);
        return;
      }
      const newUser = await res.json();
      onAdd(newUser);
      onClose();
    } catch {
      setErrors({ username: "Ошибка соединения с сервером" });
    }
    setLoading(false);
  };

  return (
    <div className="ss-modal-overlay" onClick={onClose}>
      <div className="ss-modal" onClick={e => e.stopPropagation()}>
        <div className="ss-modal-header">
          <h3 className="ss-modal-title">Добавить пользователя</h3>
          <button className="ss-modal-close" onClick={onClose}><IconClose /></button>
        </div>
        <div className="ss-modal-body">
          {[
            { key: "full_name", label: "ФИО",    type: "text",     placeholder: "Иванов Иван Иванович" },
            { key: "username",  label: "Логин",   type: "text",     placeholder: "ivan_ivanov" },
            { key: "password",  label: "Пароль",  type: "password", placeholder: "••••••••" },
            { key: "email",     label: "Email",   type: "email",    placeholder: "ivan@example.com" },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key} className="ss-form-group">
              <label className="ss-form-label">{label}</label>
              <input
                className={`ss-form-input${errors[key] ? " ss-form-input--error" : ""}`}
                type={type}
                placeholder={placeholder}
                value={form[key]}
                onChange={e => set(key, e.target.value)}
              />
              {errors[key] && <span className="ss-form-error">{errors[key]}</span>}
            </div>
          ))}

          <div className="ss-form-group">
            <label className="ss-form-label">Локация</label>
            <select
              className={`ss-form-input ss-form-select${errors.location_id ? " ss-form-input--error" : ""}`}
              value={form.location_id}
              onChange={e => set("location_id", e.target.value)}
            >
              <option value="">— Выберите локацию —</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
            {errors.location_id && <span className="ss-form-error">{errors.location_id}</span>}
          </div>

          <div className="ss-form-group">
            <label className="ss-form-label">Роль</label>
            <div className="ss-role-selector">
              {availableRoles.map(([val, lbl]) => (
                <button
                  key={val}
                  className={`ss-role-btn${form.role === val ? " ss-role-btn--active" : ""}`}
                  style={form.role === val ? { borderColor: ROLE_COLORS[val], color: ROLE_COLORS[val], background: `${ROLE_COLORS[val]}18` } : {}}
                  onClick={() => set("role", val)}
                >
                  {lbl}
                </button>
              ))}
            </div>
            <p className="ss-role-desc">
              {form.role === "admin"  && "Полный доступ. Видит все локации и данные. Управляет пользователями."}
              {form.role === "editor" && "Управляет данными своей локации. Может создавать viewer-пользователей."}
              {form.role === "viewer" && "Только просмотр данных своей локации. Может обрабатывать тревоги."}
            </p>
          </div>
        </div>
        <div className="ss-modal-footer">
          <button className="ss-btn-cancel" onClick={onClose}>Отмена</button>
          <button className="ss-btn-add" onClick={handleAdd} disabled={loading}>
            {loading ? "Создание..." : "Добавить"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Edit Profile Modal ─────────────────────────────────────────────
const EditProfileModal = ({ profile, onClose, onSave }) => {
  const [name, setName] = useState(profile?.full_name || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/v1/users/${profile.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ full_name: name.trim() }),
      });

      if (res.ok) {
        const updated = await res.json();
        onSave(updated);
      } else {
        onSave({ full_name: name.trim() });
      }
      onClose();
    } catch {
      setError("Ошибка соединения");
    }
    setLoading(false);
  };

  return (
    <div className="ss-modal-overlay" onClick={onClose}>
      <div className="ss-modal ss-modal--sm" onClick={e => e.stopPropagation()}>
        <div className="ss-modal-header">
          <h3 className="ss-modal-title">Редактировать профиль</h3>
          <button className="ss-modal-close" onClick={onClose}><IconClose /></button>
        </div>
        <div className="ss-modal-body">
          <div className="ss-form-group">
            <label className="ss-form-label">ФИО</label>
            <input
              className={`ss-form-input${error ? " ss-form-input--error" : ""}`}
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleSave()}
              autoFocus
            />
            {error && <span className="ss-form-error">{error}</span>}
          </div>
        </div>
        <div className="ss-modal-footer">
          <button className="ss-btn-cancel" onClick={onClose}>Отмена</button>
          <button className="ss-btn-add" onClick={handleSave} disabled={loading}>
            {loading ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Company Detail Panel (Users + History) ─────────────────────────
const CompanyDetailPanel = ({ location, allUsers, allAuditLogs, currentUser, locations, onUserAdded, onBack }) => {
  const [activeTab, setActiveTab] = useState("users");
  const [showAddModal, setShowAddModal] = useState(false);
  const [localUsers, setLocalUsers] = useState(allUsers);

  useEffect(() => { setLocalUsers(allUsers); }, [allUsers]);

  const companyUsers = localUsers.filter(u => u.location_id === location.id);
  const companyUserIds = new Set(companyUsers.map(u => u.id));
  const companyLogs = [...allAuditLogs]
    .filter(h => companyUserIds.has(h.user_id))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const getUserById = (id) => localUsers.find(u => u.id === id);
  const canAdd = currentUser?.role === "admin" || (currentUser?.role === "editor" && currentUser?.location_id === location.id);

  const handleUserAdded = (newUser) => {
    setLocalUsers(prev => [...prev, newUser]);
    if (onUserAdded) onUserAdded(newUser);
  };

  return (
    <div className="ss-company-detail">
      <div className="ss-detail-header">
        <button className="ss-back-btn" onClick={onBack}>
          <IconArrowBack />
          <span>Назад к списку</span>
        </button>
        <div className="ss-detail-title">
          <IconBuilding />
          <span>{location.name}</span>
        </div>
      </div>

      <div className="ss-tabs">
        <button className={`ss-tab${activeTab === "users" ? " ss-tab--active" : ""}`} onClick={() => setActiveTab("users")}>
          <IconUsers />
          <span>Пользователи</span>
          <span className="ss-tab-count">{companyUsers.length}</span>
        </button>
        <button className={`ss-tab${activeTab === "history" ? " ss-tab--active" : ""}`} onClick={() => setActiveTab("history")}>
          <IconHistory />
          <span>История действий</span>
          <span className="ss-tab-count">{companyLogs.length}</span>
        </button>
        {canAdd && activeTab === "users" && (
          <button className="ss-add-btn ss-add-btn--tab" onClick={() => setShowAddModal(true)}>
            <IconPlus />
          </button>
        )}
      </div>

      {activeTab === "users" && (
        <div className="ss-inline-table">
          <div className="ss-users-col-header ss-users-col-header--detail">
            {["Пользователь", "Email", "Роль", "Статус"].map(col => (
              <div key={col} className="ss-users-col-head">
                <span>{col}</span>
                <IconSort />
              </div>
            ))}
          </div>
          <div className="ss-users-body">
            {companyUsers.length === 0 && (
              <div className="ss-empty">Нет пользователей в этой локации</div>
            )}
            {companyUsers.map((user) => {
              const isOnline = user.is_online ?? false;
              const st = STATUS_STYLE[isOnline ? "online" : "offline"];
              return (
                <div key={user.id} className="ss-users-row ss-users-row--4col">
                  <div className="ss-users-cell ss-user-name-cell">
                    <Avatar name={user.full_name} color={getAvatarColor(user.id)} size={26}/>
                    <span>{user.full_name}</span>
                  </div>
                  <div className="ss-users-cell">
                    <a href={`mailto:${user.email}`} className="ss-email-link">{user.email || "—"}</a>
                  </div>
                  <div className="ss-users-cell">
                    <span className="ss-role-pill" style={{ color: ROLE_COLORS[user.role], background: `${ROLE_COLORS[user.role]}18`, borderColor: `${ROLE_COLORS[user.role]}40` }}>
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                  </div>
                  <div className="ss-users-cell">
                    <span className="ss-status-dot" style={{ background: st.dot }}/>
                    <span style={{ color: st.color }}>{st.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="ss-history-list">
          {companyLogs.length === 0 && (
            <div className="ss-empty">Действий пока нет</div>
          )}
          {companyLogs.map(h => {
            const actor = getUserById(h.user_id);
            return (
              <div key={h.id} className="ss-history-row">
                <div className="ss-history-actor">
                  {actor ? (
                    <Avatar name={actor.full_name} color={getAvatarColor(actor.id)} size={30}/>
                  ) : (
                    <div className="ss-history-actor-unknown">?</div>
                  )}
                </div>
                <div className="ss-history-body">
                  <div className="ss-history-top">
                    <span className="ss-history-name">{actor?.full_name || "Неизвестно"}</span>
                    {actor?.role && (
                      <span className="ss-history-role-pill" style={{ color: ROLE_COLORS[actor.role], background: `${ROLE_COLORS[actor.role]}18` }}>
                        {ROLE_LABELS[actor.role] || "—"}
                      </span>
                    )}
                    <span className="ss-history-action">{h.action}</span>
                  </div>
                  <div className="ss-history-time">{formatDate(h.timestamp)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleUserAdded}
          currentUser={currentUser}
          locations={locations}
        />
      )}
    </div>
  );
};

// ── Companies List Component ────────────────────────────────────────
const CompaniesList = ({ locations, allUsers, allAuditLogs, currentUser, onSelectCompany, onUserAdded }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) return locations;
    const query = searchQuery.toLowerCase();
    return locations.filter(loc => loc.name.toLowerCase().includes(query));
  }, [locations, searchQuery]);

  return (
    <div className="ss-companies-list">
      <div className="ss-companies-header">
        <h2 className="ss-card-title">Компании</h2>
        <div className="ss-search-wrapper">
          <IconSearch />
          <input
            type="text"
            className="ss-search-input"
            placeholder="Поиск компании..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="ss-companies-grid">
        {filteredLocations.length === 0 && (
          <div className="ss-empty ss-empty-grid">Компании не найдены</div>
        )}
        {filteredLocations.map(loc => {
          const companyUsers = allUsers.filter(u => u.location_id === loc.id);
          const userCount = companyUsers.length;
          return (
            <div key={loc.id} className="ss-company-card" onClick={() => onSelectCompany(loc)}>
              <div className="ss-company-card-icon">
                <IconBuilding />
              </div>
              <div className="ss-company-card-info">
                <span className="ss-company-card-name">{loc.name}</span>
                <span className="ss-company-card-meta">{userCount} пользователей</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────
export const SystemSettings = () => {
  const [profile, setProfile]     = useState(null);
  const [locations, setLocations] = useState([]);
  const [allUsers, setAllUsers]   = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Получаем текущего пользователя
        const meRes = await api("/users/me");
        if (!meRes.ok) {
          const errData = await meRes.json();
          throw new Error(errData.detail || "Ошибка авторизации");
        }
        const me = await meRes.json();
        setProfile(me);

        // Получаем все локации
        const locationsRes = await api("/locations/");
        let allLocations = [];
        if (locationsRes.ok) {
          allLocations = await locationsRes.json();
        }
        
        // Получаем всех пользователей
        const usersRes = await api("/users/");
        let allUsersData = [];
        if (usersRes.ok) {
          allUsersData = await usersRes.json();
        }

        // Получаем audit logs
        const logsRes = await api("/users/audit-logs");
        let logsData = [];
        if (logsRes.ok) {
          logsData = await logsRes.json();
        }

        // Фильтруем данные в зависимости от роли
        if (me.role === "admin") {
          setLocations(Array.isArray(allLocations) ? allLocations : []);
          setAllUsers(Array.isArray(allUsersData) ? allUsersData : []);
          setAuditLogs(Array.isArray(logsData) ? logsData : []);
        } else {
          // Для editor и viewer показываем только их локацию и пользователей этой локации
          const userLocationId = me.location_id;
          if (userLocationId) {
            const userLocation = Array.isArray(allLocations) 
              ? allLocations.find(l => l.id === userLocationId)
              : null;
            if (userLocation) {
              setLocations([userLocation]);
            } else {
              setLocations([{ id: userLocationId, name: `Локация #${userLocationId}` }]);
            }
            const filteredUsers = Array.isArray(allUsersData)
              ? allUsersData.filter(u => u.location_id === userLocationId)
              : [];
            setAllUsers(filteredUsers);
          } else {
            setLocations([]);
            setAllUsers([]);
          }
          // Для audit logs фильтруем по пользователям текущей локации
          if (me.location_id) {
            const filteredLogs = Array.isArray(logsData)
              ? logsData.filter(log => {
                  const user = allUsersData.find(u => u.id === log.user_id);
                  return user && user.location_id === me.location_id;
                })
              : [];
            setAuditLogs(filteredLogs);
          } else {
            setAuditLogs([]);
          }
        }
      } catch (err) {
        console.error("Ошибка загрузки данных:", err);
        setError(err.message || "Не удалось загрузить данные. Проверьте соединение с сервером.");
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const handleSaveProfile = (updates) => {
    setProfile(p => ({ ...p, ...updates }));
  };

  const handleUserAdded = (newUser) => {
    setAllUsers(prev => [...prev, newUser]);
  };

  if (loading) {
    return (
      <div className="ss-container">
        <main className="ss-main">
          <div className="ss-loading">Загрузка данных...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ss-container">
        <main className="ss-main">
          <div className="ss-loading" style={{ color: "#ff5b5b" }}>{error}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="ss-container">
      <main className="ss-main">
        <h1 className="ss-page-title">Настройки</h1>
        <div className="ss-content-grid">

          {/* ── Профиль ── */}
          <div className="ss-card ss-profile-card">
            <div className="ss-card-header">
              <h2 className="ss-card-title">Профиль</h2>
              <div className="ss-profile-actions">
                <button className="ss-icon-btn ss-edit-profile-btn" onClick={() => setShowEditModal(true)}>
                  <IconEdit />
                  <span>Редактировать</span>
                </button>
                <button className="ss-icon-btn ss-logout-btn" onClick={() => { localStorage.removeItem("token"); window.location.href = "/login"; }}>
                  <IconLogout />
                  <span>Выйти</span>
                </button>
              </div>
            </div>

            <div className="ss-profile-hero">
              <div className="ss-profile-avatar" style={{ background: getAvatarColor(profile?.id) }}>
                <span>{(profile?.full_name || profile?.username || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}</span>
              </div>
              <div className="ss-profile-info">
                <span className="ss-profile-name">{profile?.full_name || profile?.username || "—"}</span>
                <span className="ss-profile-username" style={{ fontSize: 12, color: "#929292" }}>@{profile?.username}</span>
                {profile?.email && (
                  <span className="ss-profile-email" style={{ fontSize: 12, color: "#929292" }}>{profile.email}</span>
                )}
                <span
                  className="ss-profile-role-badge"
                  style={{
                    color: ROLE_COLORS[profile?.role],
                    background: `${ROLE_COLORS[profile?.role]}18`,
                    borderColor: `${ROLE_COLORS[profile?.role]}40`
                  }}
                >
                  {ROLE_LABELS[profile?.role] || profile?.role || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* ── Компании / Локации ── */}
          {locations.length > 0 && (
            <div className="ss-card ss-companies-full-card">
              {!selectedCompany ? (
                <CompaniesList
                  locations={locations}
                  allUsers={allUsers}
                  allAuditLogs={auditLogs}
                  currentUser={profile}
                  onSelectCompany={setSelectedCompany}
                  onUserAdded={handleUserAdded}
                />
              ) : (
                <CompanyDetailPanel
                  location={selectedCompany}
                  allUsers={allUsers}
                  allAuditLogs={auditLogs}
                  currentUser={profile}
                  locations={locations}
                  onUserAdded={handleUserAdded}
                  onBack={() => setSelectedCompany(null)}
                />
              )}
            </div>
          )}

        </div>
      </main>

      {showEditModal && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveProfile}
        />
      )}
    </div>
  );
};

export default SystemSettings;