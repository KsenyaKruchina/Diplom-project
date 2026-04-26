import React, { useState } from "react";
import "./SystemSettings.css";

// ── Icons ─────────────────────────────────────────────────────────────────────
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

// ── Avatar ────────────────────────────────────────────────────────
const Avatar = ({ name, color, size = 28 }) => {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2);
  return (
    <div className="ss-avatar" style={{ width: size, height: size, background: color, borderRadius: size / 2, fontSize: size * 0.38 }}>
      {initials}
    </div>
  );
};

// ── Data ──────────────────────────────────────────────────────────
const INITIAL_PROFILE = {
  name:     "Ксения Кручина",
  role:     "admin",
  phone:    "+7 707 777 14 34",
  telegram: "ksnii_kr",
  email:    "kruchinakseniya@gmail.com",
  location: "Алматы",
};

const INITIAL_USERS = [
  { name: "Ксения Кручина",      role: "admin",  email: "kruchinakseniya@gmail.com", login: "kseniya_k",  status: "online",  color: "#ffd550", location: "Алматы" },
  { name: "Сибирцева Анастасия", role: "editor", email: "sibirka06@gmail.com",       login: "anastasia_s", status: "online",  color: "#07bcd4", location: "Алматы" },
  { name: "Курбанов Артур",      role: "viewer", email: "hacharchi@gmail.com",        login: "artur_k",    status: "offline", color: "#01e676", location: "Астана" },
];

const ROLE_LABELS = { admin: "Админ", editor: "Редактор", viewer: "Читатель" };
const ROLE_COLORS = { admin: "#ffd550", editor: "#07bcd4", viewer: "#929292" };

const STATUS_STYLE = {
  online:  { color: "#01e676", dot: "#01e676", label: "Онлайн" },
  offline: { color: "#ff5b5b", dot: "#ff5b5b", label: "Оффлайн" },
};

const PROFILE_FIELDS = [
  { label: "ФИО",            key: "name",     editable: true  },
  { label: "Email",          key: "email",    editable: false },
  { label: "Роль",           key: "role",     editable: false, render: v => ROLE_LABELS[v] || v },
  { label: "Номер телефона", key: "phone",    editable: true  },
  { label: "Telegram",       key: "telegram", editable: true  },
  { label: "Локация",        key: "location", editable: false },
];

// ── Add User Modal ─────────────────────────────────────────────────
const EMPTY_FORM = { name: "", login: "", password: "", email: "", role: "viewer", location: "" };

const AddUserModal = ({ onClose, onAdd }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())     e.name     = "Введите ФИО";
    if (!form.login.trim())    e.login    = "Введите логин";
    if (!form.password.trim()) e.password = "Введите пароль";
    if (!form.email.trim())    e.email    = "Введите email";
    if (!form.location.trim()) e.location = "Введите локацию";
    return e;
  };

  const handleAdd = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const colors = ["#ffd550", "#07bcd4", "#01e676", "#ff5b5b", "#b47afe", "#ff8c42"];
    onAdd({
      ...form,
      status: "offline",
      color: colors[Math.floor(Math.random() * colors.length)],
    });
    onClose();
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
            { key: "name",     label: "ФИО",      type: "text",     placeholder: "Иванов Иван Иванович" },
            { key: "login",    label: "Логин",     type: "text",     placeholder: "ivan_ivanov" },
            { key: "password", label: "Пароль",    type: "password", placeholder: "••••••••" },
            { key: "email",    label: "Email",     type: "email",    placeholder: "ivan@example.com" },
            { key: "location", label: "Локация",   type: "text",     placeholder: "Алматы" },
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
            <label className="ss-form-label">Роль</label>
            <div className="ss-role-selector">
              {Object.entries(ROLE_LABELS).map(([val, lbl]) => (
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
              {form.role === "admin" && "Полный доступ. Видит все локации и данные. Управляет пользователями."}
              {form.role === "editor" && "Управляет данными своей локации. Может создавать viewer-пользователей."}
              {form.role === "viewer" && "Только просмотр данных своей локации. Может обрабатывать тревоги."}
            </p>
          </div>
        </div>

        <div className="ss-modal-footer">
          <button className="ss-btn-cancel" onClick={onClose}>Отмена</button>
          <button className="ss-btn-add" onClick={handleAdd}>Добавить</button>
        </div>
      </div>
    </div>
  );
};

// ── Edit Profile Modal ─────────────────────────────────────────────
const EditProfileModal = ({ profile, onClose, onSave }) => {
  const [name, setName] = useState(profile.name);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim() });
    onClose();
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
              className="ss-form-input"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSave()}
              autoFocus
            />
          </div>
        </div>
        <div className="ss-modal-footer">
          <button className="ss-btn-cancel" onClick={onClose}>Отмена</button>
          <button className="ss-btn-add" onClick={handleSave}>Сохранить</button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
export const SystemSettings = () => {
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [users, setUsers]     = useState(INITIAL_USERS);
  const [showAddModal, setShowAddModal]   = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const isAdmin = profile.role === "admin";

  const handleSaveProfile = (updates) => {
    setProfile(p => ({ ...p, ...updates }));
  };

  const handleAddUser = (newUser) => {
    setUsers(u => [...u, newUser]);
  };

  return (
    <div className="ss-container">
      <main className="ss-main">
        <h1 className="ss-page-title">Настройки</h1>

        <div className="ss-content-grid">

          {/* ── Profile card ── */}
          <div className="ss-card ss-profile-card">
            <div className="ss-card-header">
              <h2 className="ss-card-title">Профиль</h2>
              <div className="ss-profile-actions">
                <button className="ss-icon-btn ss-edit-profile-btn" title="Редактировать профиль" onClick={() => setShowEditModal(true)}>
                  <IconEdit />
                  <span>Редактировать</span>
                </button>
                <button className="ss-icon-btn ss-logout-btn" title="Выйти">
                  <IconLogout />
                  <span>Выйти</span>
                </button>
              </div>
            </div>

            <div className="ss-profile-hero">
              <div className="ss-profile-avatar">
                <span>{profile.name.split(" ").map(w => w[0]).join("").slice(0, 2)}</span>
              </div>
              <div className="ss-profile-info">
                <span className="ss-profile-name">{profile.name}</span>
                <span className="ss-profile-role-badge" style={{ color: ROLE_COLORS[profile.role], background: `${ROLE_COLORS[profile.role]}18`, borderColor: `${ROLE_COLORS[profile.role]}40` }}>
                  {ROLE_LABELS[profile.role]}
                </span>
              </div>
            </div>

            <div className="ss-fields-grid">
              {PROFILE_FIELDS.map(({ label, key, render }) => (
                <div key={key} className="ss-field-group">
                  <span className="ss-field-label">{label}</span>
                  <div className="ss-field-input">
                    <span className="ss-field-value">{render ? render(profile[key]) : profile[key]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Users card ── */}
          <div className="ss-card ss-users-card">
            <div className="ss-users-header">
              <h2 className="ss-card-title">Пользователи</h2>
              <div className="ss-users-count">{users.length}</div>
              {isAdmin && (
                <button className="ss-add-btn" title="Добавить пользователя" onClick={() => setShowAddModal(true)}>
                  <IconPlus />
                </button>
              )}
            </div>

            <div className="ss-users-col-header">
              {["Пользователь", "Email", "Роль", "Локация", "Статус"].map(col => (
                <div key={col} className="ss-users-col-head">
                  <span>{col}</span>
                  <IconSort />
                </div>
              ))}
            </div>

            <div className="ss-users-body">
              {users.map((user, i) => {
                const st = STATUS_STYLE[user.status];
                return (
                  <div key={i} className="ss-users-row">
                    <div className="ss-users-cell ss-user-name-cell">
                      <Avatar name={user.name} color={user.color} size={28}/>
                      <span>{user.name}</span>
                    </div>
                    <div className="ss-users-cell">
                      <a href={`mailto:${user.email}`} className="ss-email-link">{user.email}</a>
                    </div>
                    <div className="ss-users-cell">
                      <span className="ss-role-pill" style={{ color: ROLE_COLORS[user.role], background: `${ROLE_COLORS[user.role]}18`, borderColor: `${ROLE_COLORS[user.role]}40` }}>
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </div>
                    <div className="ss-users-cell">{user.location}</div>
                    <div className="ss-users-cell">
                      <span className="ss-status-dot" style={{ background: st.dot }}/>
                      <span style={{ color: st.color }}>{st.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {showAddModal && isAdmin && (
        <AddUserModal onClose={() => setShowAddModal(false)} onAdd={handleAddUser} />
      )}
      {showEditModal && (
        <EditProfileModal profile={profile} onClose={() => setShowEditModal(false)} onSave={handleSaveProfile} />
      )}
    </div>
  );
};

export default SystemSettings;