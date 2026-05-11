import React, { useState, useEffect, useMemo } from "react";
import "./SystemSettings.css";
import { apiRequest } from "../services/api";
import { getCurrentUser, registerUser } from "../services/authService";
import { useAuth } from "../context/AuthContext";

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
const IconChevron = ({ open }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
    style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
    <path d="M3 5l4 4 4-4" stroke="#929292" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconLocation = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
    <path d="M7 1C4.79 1 3 2.79 3 5c0 3 4 8 4 8s4-5 4-8c0-2.21-1.79-4-4-4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    <circle cx="7" cy="5" r="1.3" stroke="currentColor" strokeWidth="1.1"/>
  </svg>
);
const IconBuilding = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="3" width="12" height="11" rx="1" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M5 14V9h6v5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    <rect x="5" y="5" width="2" height="2" rx="0.3" stroke="currentColor" strokeWidth="1.1"/>
    <rect x="9" y="5" width="2" height="2" rx="0.3" stroke="currentColor" strokeWidth="1.1"/>
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

// ── Нормализация location_id ──────────────────────────────────────
const normalizeLocationId = (val) => {
  if (val === null || val === undefined || val === "" || val === "null") return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
};

// ── Безопасный запрос к API: 403 для editor/viewer — не ошибка ──
const safeApiRequest = async (url, options) => {
  try {
    return await apiRequest(url, options);
  } catch (err) {
    if (err?.status === 403 || err?.message?.includes("403")) {
      return null;
    }
    throw err;
  }
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

  useEffect(() => {
    if (currentUser?.role === "editor") {
      const locId = normalizeLocationId(currentUser?.location_id);
      setForm(f => ({
        ...f,
        role: "viewer",
        location_id: locId ? String(locId) : f.location_id,
      }));
    }
  }, [currentUser]);

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
      const newUser = await registerUser({
        full_name:   form.full_name,
        username:    form.username,
        password:    form.password,
        email:       form.email,
        role:        form.role,
        location_id: parseInt(form.location_id),
      });
      onAdd({ ...newUser, location_id: parseInt(form.location_id) });
      onClose();
    } catch (err) {
      setErrors({ username: err.message || "Ошибка соединения с сервером" });
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
                type={type} placeholder={placeholder} value={form[key]}
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
              disabled={currentUser?.role === "editor"}
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
                <button key={val}
                  className={`ss-role-btn${form.role === val ? " ss-role-btn--active" : ""}`}
                  style={form.role === val ? { borderColor: ROLE_COLORS[val], color: ROLE_COLORS[val], background: `${ROLE_COLORS[val]}18` } : {}}
                  onClick={() => set("role", val)}>
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
      const updated = await apiRequest(`/users/${profile.id}`, {
        method: "PATCH",
        body: JSON.stringify({ full_name: name.trim() }),
      });
      onSave(updated || { full_name: name.trim() });
      onClose();
    } catch (err) {
      setError(err.message || "Ошибка соединения");
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
              type="text" value={name}
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

// ── Shared: таблица пользователей ─────────────────────────────────
const UsersTable = ({ users }) => (
  <div className="ss-inline-table">
    <div className="ss-users-col-header ss-users-col-header--4col">
      {["Пользователь", "Email", "Роль", "Статус"].map(col => (
        <div key={col} className="ss-users-col-head"><span>{col}</span><IconSort /></div>
      ))}
    </div>
    <div className="ss-users-body">
      {users.length === 0 && <div className="ss-empty">Пользователи не найдены</div>}
      {users.map(user => {
        const st = STATUS_STYLE[user.is_online ? "online" : "offline"];
        return (
          <div key={user.id} className="ss-users-row ss-users-row--4col">
            <div className="ss-users-cell ss-user-name-cell">
              <Avatar name={user.full_name} color={getAvatarColor(user.id)} size={26}/>
              <div className="ss-user-name-block">
                <span>{user.full_name || "—"}</span>
                <span className="ss-user-username">@{user.username}</span>
              </div>
            </div>
            <div className="ss-users-cell">
              {user.email
                ? <a href={`mailto:${user.email}`} className="ss-email-link">{user.email}</a>
                : <span style={{ color: "#555" }}>—</span>}
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
);

// ── Shared: лента истории ─────────────────────────────────────────
const HistoryList = ({ logs, getUserById }) => {
  const sorted = useMemo(
    () => [...logs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    [logs]
  );
  return (
    <div className="ss-history-list">
      {sorted.length === 0 && <div className="ss-empty">Действий пока нет</div>}
      {sorted.map(h => {
        const actor = getUserById(h.user_id);
        return (
          <div key={h.id} className="ss-history-row">
            <div className="ss-history-actor">
              {actor
                ? <Avatar name={actor.full_name} color={getAvatarColor(actor.id)} size={30}/>
                : <div className="ss-history-actor-unknown">?</div>}
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
  );
};

// ── Панель для editor/viewer: пользователи своей локации ──────────
const MyLocationUsersPanel = ({ myLocation, currentUser, onUserAdded }) => {
  const [activeTab, setActiveTab]       = useState("users");
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery]   = useState("");
  const [roleFilter, setRoleFilter]     = useState("all");
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const [colleagues, setColleagues] = useState([]);
  const [auditLogs, setAuditLogs]   = useState([]);
  const [loading, setLoading]       = useState(true);

  const isEditor = currentUser?.role === "editor";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await safeApiRequest("/users/my-location");
      if (Array.isArray(data)) {
        // Исключаем admin-ов
        const filtered = data.filter(u => u.role !== "admin");
        setColleagues(filtered);
      }

      if (isEditor) {
        const logs = await safeApiRequest("/users/audit-logs?limit=500");
        if (Array.isArray(logs)) {
          // Получаем пользователей своей локации для фильтрации логов
          const myLocationData = await safeApiRequest("/users/my-location");
          const nonAdminIds = new Set(
            Array.isArray(myLocationData)
              ? myLocationData.filter(u => u.role !== "admin").map(u => u.id)
              : []
          );
          // Оставляем только логи пользователей не-админов своей локации
          setAuditLogs(logs.filter(log => nonAdminIds.has(log.user_id)));
        }
      }
      setLoading(false);
    };
    load();
  }, [isEditor]);

  const roleOptions = [
    { value: "all",    label: "Все роли" },
    { value: "editor", label: "Редактор" },
    { value: "viewer", label: "Читатель" },
  ];

  const filteredUsers = useMemo(() => {
    let result = [...colleagues];
    if (roleFilter !== "all") result = result.filter(u => u.role === roleFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u =>
        (u.full_name || "").toLowerCase().includes(q) ||
        (u.username  || "").toLowerCase().includes(q) ||
        (u.email     || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [colleagues, roleFilter, searchQuery]);

  const getUserById = (id) => colleagues.find(u => u.id === id);

  const handleUserAdded = (newUser) => {
    const withLocation = { ...newUser, location_id: myLocation?.id ?? newUser.location_id };
    setColleagues(prev => {
      const map = new Map(prev.map(u => [u.id, u]));
      map.set(withLocation.id, withLocation);
      return [...map.values()];
    });
    if (onUserAdded) onUserAdded(withLocation);
  };

  if (loading) return <div className="ss-loading ss-loading--inline">Загрузка пользователей...</div>;

  return (
    <div className="ss-users-panel">
      <div className="ss-tabs">
        <button
          className={`ss-tab${activeTab === "users" ? " ss-tab--active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          <IconUsers /><span>Пользователи</span>
          <span className="ss-tab-count">{filteredUsers.length}</span>
        </button>

        {isEditor && (
          <button
            className={`ss-tab${activeTab === "history" ? " ss-tab--active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            <IconHistory /><span>История</span>
            <span className="ss-tab-count">{auditLogs.length}</span>
          </button>
        )}

        {activeTab === "users" && (
          <div className="ss-tab-toolbar">
            <div className="ss-search-wrapper ss-search-wrapper--sm">
              <IconSearch />
              <input
                type="text" className="ss-search-input" placeholder="Поиск..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="ss-dropdown-wrap">
              <button className="ss-dropdown-btn" onClick={() => setRoleDropdownOpen(o => !o)}>
                <span style={{ color: roleFilter !== "all" ? ROLE_COLORS[roleFilter] : undefined }}>
                  {roleOptions.find(o => o.value === roleFilter)?.label}
                </span>
                <IconChevron open={roleDropdownOpen} />
              </button>
              {roleDropdownOpen && (
                <>
                  <div className="ss-dropdown-backdrop" onClick={() => setRoleDropdownOpen(false)} />
                  <div className="ss-dropdown-menu">
                    {roleOptions.map(opt => (
                      <button key={opt.value}
                        className={`ss-dropdown-item${roleFilter === opt.value ? " ss-dropdown-item--active" : ""}`}
                        style={opt.value !== "all" ? { color: roleFilter === opt.value ? ROLE_COLORS[opt.value] : undefined } : {}}
                        onClick={() => { setRoleFilter(opt.value); setRoleDropdownOpen(false); }}>
                        {opt.value !== "all" && <span className="ss-dropdown-dot" style={{ background: ROLE_COLORS[opt.value] }} />}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            {isEditor && (
              <button className="ss-add-btn" onClick={() => setShowAddModal(true)}>
                <IconPlus /><span>Добавить</span>
              </button>
            )}
          </div>
        )}
      </div>

      {activeTab === "users" && <UsersTable users={filteredUsers} />}
      {activeTab === "history" && isEditor && (
        <HistoryList logs={auditLogs} getUserById={getUserById} />
      )}

      {showAddModal && isEditor && myLocation && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleUserAdded}
          currentUser={currentUser}
          locations={[myLocation]}
        />
      )}
    </div>
  );
};

// ── Location Detail Panel (только admin) ──────────────────────────
const LocationDetailPanel = ({ location, allUsers, allAuditLogs, currentUser, onUserAdded, onClose }) => {
  const [activeTab, setActiveTab] = useState("users");
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const locationUsers = useMemo(
    () => allUsers.filter(
      u => normalizeLocationId(u.location_id) === normalizeLocationId(location.id) && u.role !== "admin"
    ),
    [allUsers, location.id]
  );

  const filteredUsers = useMemo(() => {
    let result = [...locationUsers];
    if (roleFilter !== "all") result = result.filter(u => u.role === roleFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u =>
        (u.full_name || "").toLowerCase().includes(q) ||
        (u.username  || "").toLowerCase().includes(q) ||
        (u.email     || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [locationUsers, roleFilter, searchQuery]);

  const locationUserIds = useMemo(() => new Set(locationUsers.map(u => u.id)), [locationUsers]);
  const sortedLogs = useMemo(() =>
    allAuditLogs
      .filter(log => locationUserIds.has(log.user_id))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    [allAuditLogs, locationUserIds]
  );

  const getUserById = (id) => allUsers.find(u => u.id === id);

  const roleOptions = [
    { value: "all", label: "Все роли" },
    { value: "editor", label: "Редактор" },
    { value: "viewer", label: "Читатель" },
  ];

  return (
    <div className="ss-location-detail-overlay" onClick={onClose}>
      <div className="ss-location-detail-panel" onClick={e => e.stopPropagation()}>
        <div className="ss-location-detail-header">
          <div className="ss-location-detail-title-row">
            <div className="ss-location-detail-icon"><IconBuilding /></div>
            <div>
              <h3 className="ss-location-detail-name">{location.name}</h3>
              <span className="ss-location-detail-meta">
                {locationUsers.length} пользователей · {sortedLogs.length} событий
              </span>
            </div>
          </div>
          <button className="ss-modal-close" onClick={onClose}><IconClose /></button>
        </div>

        <div className="ss-tabs ss-tabs--detail">
          <button className={`ss-tab${activeTab === "users" ? " ss-tab--active" : ""}`} onClick={() => setActiveTab("users")}>
            <IconUsers /><span>Пользователи</span><span className="ss-tab-count">{filteredUsers.length}</span>
          </button>
          <button className={`ss-tab${activeTab === "history" ? " ss-tab--active" : ""}`} onClick={() => setActiveTab("history")}>
            <IconHistory /><span>История</span><span className="ss-tab-count">{sortedLogs.length}</span>
          </button>
          {activeTab === "users" && (
            <div className="ss-tab-toolbar">
              <div className="ss-search-wrapper ss-search-wrapper--sm">
                <IconSearch />
                <input
                  type="text" className="ss-search-input" placeholder="Поиск..."
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="ss-dropdown-wrap">
                <button className="ss-dropdown-btn" onClick={() => setRoleDropdownOpen(o => !o)}>
                  <span style={{ color: roleFilter !== "all" ? ROLE_COLORS[roleFilter] : undefined }}>
                    {roleOptions.find(o => o.value === roleFilter)?.label}
                  </span>
                  <IconChevron open={roleDropdownOpen} />
                </button>
                {roleDropdownOpen && (
                  <>
                    <div className="ss-dropdown-backdrop" onClick={() => setRoleDropdownOpen(false)} />
                    <div className="ss-dropdown-menu">
                      {roleOptions.map(opt => (
                        <button key={opt.value}
                          className={`ss-dropdown-item${roleFilter === opt.value ? " ss-dropdown-item--active" : ""}`}
                          style={opt.value !== "all" ? { color: roleFilter === opt.value ? ROLE_COLORS[opt.value] : undefined } : {}}
                          onClick={() => { setRoleFilter(opt.value); setRoleDropdownOpen(false); }}>
                          {opt.value !== "all" && <span className="ss-dropdown-dot" style={{ background: ROLE_COLORS[opt.value] }} />}
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button className="ss-add-btn" onClick={() => setShowAddModal(true)}>
                <IconPlus /><span>Добавить</span>
              </button>
            </div>
          )}
        </div>

        {activeTab === "users" && <UsersTable users={filteredUsers} />}
        {activeTab === "history" && <HistoryList logs={sortedLogs} getUserById={getUserById} />}

        {showAddModal && (
          <AddUserModal
            onClose={() => setShowAddModal(false)}
            onAdd={(newUser) => { if (onUserAdded) onUserAdded(newUser); }}
            currentUser={currentUser}
            locations={[location]}
          />
        )}
      </div>
    </div>
  );
};

// ── Locations Panel (только admin) ─────────────────────────────────
const LocationsPanel = ({ locations, allUsers, allAuditLogs, currentUser, onUserAdded }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const locationOptions = useMemo(() => [
    { value: "all", label: "Все локации" },
    ...locations.map(loc => ({ value: String(loc.id), label: loc.name })),
  ], [locations]);

  const getUsersForLocation = (locId) =>
    allUsers.filter(
      u => normalizeLocationId(u.location_id) === normalizeLocationId(locId) && u.role !== "admin"
    );

  const filteredLocations = useMemo(() => {
    let result = [...locations];
    if (locationFilter !== "all") result = result.filter(loc => String(loc.id) === locationFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(loc => (loc.name || "").toLowerCase().includes(q));
    }
    return result;
  }, [locations, locationFilter, searchQuery]);

  const activeLocationLabel = locationOptions.find(o => o.value === locationFilter)?.label ?? "Все локации";

  return (
    <div className="ss-locations-panel">
      <div className="ss-locations-toolbar">
        <div className="ss-search-wrapper ss-search-wrapper--sm">
          <IconSearch />
          <input
            type="text" className="ss-search-input" placeholder="Поиск локации..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="ss-dropdown-wrap">
          <button className="ss-dropdown-btn" onClick={() => setDropdownOpen(o => !o)}>
            <span style={{ color: "#929292", display: "flex", alignItems: "center" }}><IconLocation /></span>
            <span style={{ color: locationFilter !== "all" ? "#07bcd4" : undefined, marginLeft: 4 }}>
              {activeLocationLabel}
            </span>
            <IconChevron open={dropdownOpen} />
          </button>
          {dropdownOpen && (
            <>
              <div className="ss-dropdown-backdrop" onClick={() => setDropdownOpen(false)} />
              <div className="ss-dropdown-menu ss-dropdown-menu--location">
                {locationOptions.map(opt => (
                  <button key={opt.value}
                    className={`ss-dropdown-item${locationFilter === opt.value ? " ss-dropdown-item--active" : ""}`}
                    style={opt.value !== "all" && locationFilter === opt.value ? { color: "#07bcd4" } : {}}
                    onClick={() => { setLocationFilter(opt.value); setDropdownOpen(false); }}>
                    {opt.value !== "all" && <span className="ss-dropdown-dot" style={{ background: "#07bcd4" }} />}
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="ss-locations-grid">
        {filteredLocations.length === 0 && <div className="ss-empty">Локации не найдены</div>}
        {filteredLocations.map(loc => {
          const locUsers  = getUsersForLocation(loc.id);
          const locUserIds = new Set(locUsers.map(u => u.id));
          const locLogsCount = allAuditLogs.filter(log => locUserIds.has(log.user_id)).length;
          const editors   = locUsers.filter(u => u.role === "editor");
          const viewers   = locUsers.filter(u => u.role === "viewer");
          const onlineCount = locUsers.filter(u => u.is_online).length;

          return (
            <div
              key={loc.id}
              className="ss-location-card"
              onClick={() => setSelectedLocation(loc)}
              role="button" tabIndex={0}
              onKeyDown={e => e.key === "Enter" && setSelectedLocation(loc)}
            >
              <div className="ss-location-card-header">
                <div className="ss-location-card-icon"><IconBuilding /></div>
                <div className="ss-location-card-title-block">
                  <span className="ss-location-card-name">{loc.name}</span>
                  {loc.address && (
                    <span className="ss-location-card-address"><IconLocation /> {loc.address}</span>
                  )}
                </div>
                <IconChevron open={false} />
              </div>
              <div className="ss-location-card-stats">
                <div className="ss-location-stat">
                  <span className="ss-location-stat-value">{locUsers.length}</span>
                  <span className="ss-location-stat-label">пользователей</span>
                </div>
                <div className="ss-location-stat-divider" />
                <div className="ss-location-stat">
                  <span className="ss-location-stat-value" style={{ color: "#01e676" }}>{onlineCount}</span>
                  <span className="ss-location-stat-label">онлайн</span>
                </div>
                <div className="ss-location-stat-divider" />
                <div className="ss-location-stat">
                  <span className="ss-location-stat-value">{locLogsCount}</span>
                  <span className="ss-location-stat-label">событий</span>
                </div>
              </div>
              <div className="ss-location-card-roles">
                {editors.length > 0 && (
                  <span className="ss-role-pill" style={{ color: ROLE_COLORS.editor, background: `${ROLE_COLORS.editor}18`, borderColor: `${ROLE_COLORS.editor}40` }}>
                    {editors.length} редактор{editors.length !== 1 ? "а" : ""}
                  </span>
                )}
                {viewers.length > 0 && (
                  <span className="ss-role-pill" style={{ color: ROLE_COLORS.viewer, background: `${ROLE_COLORS.viewer}18`, borderColor: `${ROLE_COLORS.viewer}40` }}>
                    {viewers.length} читатель{viewers.length > 1 ? (viewers.length < 5 ? "я" : "ей") : ""}
                  </span>
                )}
                {locUsers.length === 0 && <span style={{ color: "#555", fontSize: 12 }}>Нет пользователей</span>}
              </div>
              {locUsers.length > 0 && (
                <div className="ss-location-card-avatars">
                  {locUsers.slice(0, 5).map(u => <Avatar key={u.id} name={u.full_name} color={getAvatarColor(u.id)} size={24} />)}
                  {locUsers.length > 5 && (
                    <div className="ss-location-avatar-more">+{locUsers.length - 5}</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedLocation && (
        <LocationDetailPanel
          location={selectedLocation}
          allUsers={allUsers}
          allAuditLogs={allAuditLogs}
          currentUser={currentUser}
          onUserAdded={onUserAdded}
          onClose={() => setSelectedLocation(null)}
        />
      )}
    </div>
  );
};

// ── Заглушка: нет назначенной локации ─────────────────────────────
const NoLocationPlaceholder = () => (
  <div style={{ padding: "32px 24px", textAlign: "center", color: "#929292" }}>
    <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>📍</div>
    <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6, color: "#ccc" }}>Локация не назначена</div>
    <div style={{ fontSize: 12, lineHeight: 1.6 }}>
      Обратитесь к администратору, чтобы получить доступ к локации.
    </div>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────
export const SystemSettings = () => {
  const { isViewer, isAdmin, isEditor } = useAuth();

  const [profile, setProfile]     = useState(null);
  const [locations, setLocations] = useState([]);
  const [allUsers, setAllUsers]   = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      let me;
      try {
        me = await getCurrentUser();
      } catch (err) {
        setError(err.message || "Не удалось загрузить профиль.");
        setLoading(false);
        return;
      }
      setProfile(me);

      const role = me?.role;

      if (role === "viewer") {
        setLoading(false);
        return;
      }

      if (role === "editor") {
        const locId = normalizeLocationId(me?.location_id);

        if (locId === null) {
          setLoading(false);
          return;
        }

        const details = await safeApiRequest(
          `/locations/${locId}/details?users_limit=200&logs_limit=500`
        );

        if (details) {
          const { location } = details;
          setLocations([location || { id: locId, name: `Локация #${locId}` }]);
        } else {
          const locData = await safeApiRequest(`/locations/${locId}`);
          setLocations([locData || { id: locId, name: `Локация #${locId}` }]);
        }

        setLoading(false);
        return;
      }

      if (role === "admin") {
        try {
          const allLocations = await apiRequest("/locations/");
          const locationsList = Array.isArray(allLocations) ? allLocations : [];
          setLocations(locationsList);

          const detailsResults = await Promise.allSettled(
            locationsList.map(loc =>
              apiRequest(`/locations/${loc.id}/details?users_limit=200&logs_limit=500`)
            )
          );

          const allUsersMap = new Map();
          const allLogsMap  = new Map();

          detailsResults.forEach((result, idx) => {
            if (result.status === "fulfilled" && result.value) {
              const { users = [], audit_logs = [] } = result.value;
              users.forEach(u => {
                allUsersMap.set(u.id, { ...u, location_id: locationsList[idx].id });
              });
              audit_logs.forEach(log => {
                allLogsMap.set(log.id, log);
              });
            } else {
              console.warn(
                `Не удалось загрузить детали локации ${locationsList[idx]?.id}:`,
                result.reason
              );
            }
          });

          setAllUsers([...allUsersMap.values()]);
          setAuditLogs([...allLogsMap.values()]);
        } catch (err) {
          setError(err.message || "Не удалось загрузить данные.");
        }

        setLoading(false);
        return;
      }

      setLoading(false);
    };

    loadData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
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

  const myLocation = locations[0] ?? null;
  const myLocationId = normalizeLocationId(profile?.location_id);

  return (
    <div className="ss-container">
      <main className="ss-main">
        <h1 className="ss-page-title">Настройки</h1>
        <div className="ss-content-grid">

          <div className="ss-card ss-profile-card">
            <div className="ss-card-header">
              <h2 className="ss-card-title">Профиль</h2>
              <div className="ss-profile-actions">
                <button className="ss-icon-btn ss-edit-profile-btn" onClick={() => setShowEditModal(true)}>
                  <IconEdit /><span>Редактировать</span>
                </button>
                <button className="ss-icon-btn ss-logout-btn" onClick={handleLogout}>
                  <IconLogout /><span>Выйти</span>
                </button>
              </div>
            </div>
            <div className="ss-profile-hero">
              <div className="ss-profile-avatar" style={{ background: getAvatarColor(profile?.id) }}>
                <span>
                  {(profile?.full_name || profile?.username || "?")
                    .split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="ss-profile-info">
                <span className="ss-profile-name">{profile?.full_name || profile?.username || "—"}</span>
                <span className="ss-profile-username" style={{ fontSize: 12, color: "#929292" }}>
                  @{profile?.username}
                </span>
                {profile?.email && (
                  <span className="ss-profile-email" style={{ fontSize: 12, color: "#929292" }}>
                    {profile.email}
                  </span>
                )}
                <span className="ss-profile-role-badge" style={{
                  color: ROLE_COLORS[profile?.role],
                  background: `${ROLE_COLORS[profile?.role]}18`,
                  borderColor: `${ROLE_COLORS[profile?.role]}40`,
                }}>
                  {ROLE_LABELS[profile?.role] || profile?.role || "—"}
                </span>
                {(isEditor || isViewer) && myLocation && (
                  <span style={{ fontSize: 12, color: "#929292", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                    <IconLocation /> {myLocation.name}
                  </span>
                )}
              </div>
            </div>
            {isViewer && (
              <div style={{ marginTop: 16, padding: "12px 14px", background: "rgba(146,146,146,0.08)", borderRadius: 10, fontSize: 12, color: "#929292", lineHeight: 1.6 }}>
                Вы можете редактировать своё имя. Для расширенного доступа обратитесь к администратору.
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="ss-card ss-companies-full-card">
              <div className="ss-card-header">
                <h2 className="ss-card-title">Локации</h2>
                <span className="ss-card-header-meta">{locations.length} локаций</span>
              </div>
              <LocationsPanel
                locations={locations}
                allUsers={allUsers}
                allAuditLogs={auditLogs}
                currentUser={profile}
                onUserAdded={(newUser) => setAllUsers(prev => {
                  const map = new Map(prev.map(u => [u.id, u]));
                  map.set(newUser.id, newUser);
                  return [...map.values()];
                })}
              />
            </div>
          )}

          {isEditor && (
            <div className="ss-card ss-companies-full-card">
              <div className="ss-card-header">
                <h2 className="ss-card-title">Пользователи</h2>
                <span className="ss-card-header-meta" style={{ fontSize: 12, color: "#929292" }}>
                  {myLocation?.name ?? "Моя локация"}
                </span>
              </div>
              {myLocationId === null ? (
                <NoLocationPlaceholder />
              ) : (
                <MyLocationUsersPanel
                  myLocation={myLocation}
                  currentUser={profile}
                  onUserAdded={() => {}}
                />
              )}
            </div>
          )}

          {isViewer && (
            <div className="ss-card ss-companies-full-card">
              <div className="ss-card-header">
                <h2 className="ss-card-title">Коллеги</h2>
                <span className="ss-card-header-meta" style={{ fontSize: 12, color: "#929292" }}>
                  {myLocation?.name ?? "Моя локация"}
                </span>
              </div>
              {myLocationId === null ? (
                <NoLocationPlaceholder />
              ) : (
                <MyLocationUsersPanel
                  myLocation={myLocation}
                  currentUser={profile}
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
          onSave={(updates) => setProfile(p => ({ ...p, ...updates }))}
        />
      )}
    </div>
  );
};

export default SystemSettings;