import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import ReactDOM from "react-dom";
import "./Reports.css";
import { apiRequest } from "../services/api";
import { getToken } from "../services/api";
import { wsService } from "../services/websocketService";

const BASE_URL = "http://157.90.127.202/api/v1";

// ── Storage helpers ───────────────────────────────────────────────────────────
// Ключ хранилища зависит от id и роли пользователя, чтобы история была per-user
const getStorageKey = (user) => {
  if (!user) return null;
  return `rp_export_history_${user.id}_${user.role || "user"}`;
};

const loadHistory = (user) => {
  const key = getStorageKey(user);
  if (!key) return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveHistory = (user, history) => {
  const key = getStorageKey(user);
  if (!key) return;
  try {
    // Ограничиваем 100 записями, чтобы не засорять localStorage
    localStorage.setItem(key, JSON.stringify(history.slice(0, 100)));
  } catch {
    // localStorage может быть недоступен (приватный режим и т.д.)
  }
};

// иконки
const IconSearch = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="7" stroke="#929292" strokeWidth="1.8"/>
    <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="#929292" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);
const IconSort = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M7 4v12M7 16l-3-3M7 16l3-3M13 16V4M13 4l-3 3M13 4l3 3" stroke="#929292" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconSortAlt = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M5 7l5-5 5 5M15 13l-5 5-5-5" stroke="#929292" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconMessage = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1" y="1" width="12" height="9" rx="2" stroke="#929292" strokeWidth="1.2"/>
    <path d="M3 13l2-3h6" stroke="#929292" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconEdit = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M11 2l3 3-8 8H3v-3l8-8z" stroke="#929292" strokeWidth="1.3" strokeLinejoin="round"/>
  </svg>
);
const IconEventNote = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="5" width="18" height="16" rx="2" stroke="white" strokeWidth="1.6"/>
    <line x1="3" y1="10" x2="21" y2="10" stroke="white" strokeWidth="1.4"/>
    <line x1="8" y1="3" x2="8" y2="7" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="16" y1="3" x2="16" y2="7" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="7" y1="14" x2="12" y2="14" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
    <line x1="7" y1="17" x2="10" y2="17" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);
const IconDownload = () => (
  <svg width="20" height="22" viewBox="0 0 20 22" fill="none">
    <path d="M10 2v13M10 15l-5-5M10 15l5-5" stroke="#ffc207" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="2" y1="20" x2="18" y2="20" stroke="#ffc207" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);
const IconChevDown = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 6l4 4 4-4" stroke="#929292" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconChevLeft = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M13 7l-4 4 4 4" stroke="#929292" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconChevRight = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M9 7l4 4-4 4" stroke="#929292" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconFilter = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M2 4h14M5 9h8M8 14h2" stroke="#929292" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);
const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M3 3l8 8M11 3l-8 8" stroke="#929292" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 7l4 4 6-6" stroke="#ffc207" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconCalendar = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="3" width="14" height="12" rx="2" stroke="#929292" strokeWidth="1.3"/>
    <line x1="1" y1="7" x2="15" y2="7" stroke="#929292" strokeWidth="1.2"/>
    <line x1="5" y1="1" x2="5" y2="5" stroke="#929292" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="11" y1="1" x2="11" y2="5" stroke="#929292" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);
const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <line x1="3" y1="3" x2="13" y2="13" stroke="#929292" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="13" y1="3" x2="3" y2="13" stroke="#929292" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IconPDF = () => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
    <rect x="8" y="4" width="28" height="36" rx="3" fill="#1a1a1a" stroke="#ff5252" strokeWidth="1.5"/>
    <path d="M36 4l8 8h-8V4z" fill="#ff5252" fillOpacity="0.5"/>
    <line x1="14" y1="16" x2="30" y2="16" stroke="#ff5252" strokeWidth="1.4" strokeLinecap="round"/>
    <line x1="14" y1="21" x2="30" y2="21" stroke="#ff5252" strokeWidth="1.4" strokeLinecap="round"/>
    <line x1="14" y1="26" x2="24" y2="26" stroke="#ff5252" strokeWidth="1.4" strokeLinecap="round"/>
    <text x="26" y="47" textAnchor="middle" fill="#ff5252" fontSize="9" fontFamily="Inter, sans-serif" fontWeight="700">PDF</text>
  </svg>
);
const IconExcel = () => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
    <rect x="8" y="4" width="28" height="36" rx="3" fill="#1a1a1a" stroke="#01e676" strokeWidth="1.5"/>
    <path d="M36 4l8 8h-8V4z" fill="#01e676" fillOpacity="0.5"/>
    <line x1="14" y1="16" x2="30" y2="16" stroke="#01e676" strokeWidth="1.4" strokeLinecap="round"/>
    <line x1="14" y1="21" x2="30" y2="21" stroke="#01e676" strokeWidth="1.4" strokeLinecap="round"/>
    <line x1="14" y1="26" x2="24" y2="26" stroke="#01e676" strokeWidth="1.4" strokeLinecap="round"/>
    <text x="26" y="47" textAnchor="middle" fill="#01e676" fontSize="9" fontFamily="Inter, sans-serif" fontWeight="700">XLSX</text>
  </svg>
);
const IconRefresh = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M13.5 8a5.5 5.5 0 1 1-1.1-3.3" stroke="#929292" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M12 2.5V5.5H15" stroke="#929292" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconLocation = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 1a4 4 0 0 1 4 4c0 3-4 8-4 8S3 8 3 5a4 4 0 0 1 4-4z" stroke="#929292" strokeWidth="1.2"/>
    <circle cx="7" cy="5" r="1.2" fill="#929292"/>
  </svg>
);
const IconBuilding = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="2" y="2" width="10" height="11" rx="1" stroke="#929292" strokeWidth="1.2"/>
    <line x1="5" y1="5" x2="5" y2="5.01" stroke="#929292" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="9" y1="5" x2="9" y2="5.01" stroke="#929292" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="5" y1="8" x2="5" y2="8.01" stroke="#929292" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="9" y1="8" x2="9" y2="8.01" stroke="#929292" strokeWidth="1.5" strokeLinecap="round"/>
    <rect x="5" y="10" width="4" height="3" rx="0.5" stroke="#929292" strokeWidth="1.1"/>
  </svg>
);
const IconSensor = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="2" stroke="#929292" strokeWidth="1.2"/>
    <path d="M3.5 3.5a5 5 0 0 0 0 7M10.5 3.5a5 5 0 0 1 0 7" stroke="#929292" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 4h10M5 4V2h4v2M6 7v4M8 7v4" stroke="#929292" strokeWidth="1.2" strokeLinecap="round"/>
    <rect x="3" y="4" width="8" height="8" rx="1" stroke="#929292" strokeWidth="1.2"/>
  </svg>
);

// словари маппинги
const STATUS_MAP = {
  new:          { label: "Новая",      color: "#ff5252", bg: "#321c1b" },
  acknowledged: { label: "В работе",   color: "#ffd550", bg: "#312c1c" },
  resolved:     { label: "Устранено",  color: "#01e676", bg: "#19282b" },
};
const SEVERITY_MAP = {
  critical: { label: "Критическая", color: "#ff5252" },
  warning:  { label: "Внимание",    color: "#ffd550" },
};
const ALARM_TYPE_MAP = {
  temperature:     "Температура",
  humidity:        "Влажность",
  connection_lost: "Потеря связи",
  low_battery:     "Низкий заряд",
};
const PERIOD_API_MAP = {
  "1d":  "last_24_hours",
  "1w":  "last_week",
  "1m":  "last_month",
  "2m":  "last_2_months",
  "3m":  "last_3_months",
  "6m":  "last_6_months",
  "1y":  "last_year",
};
const PERIOD_OPTIONS = [
  { key: "1d", label: "1 день" },
  { key: "1w", label: "1 неделя" },
  { key: "1m", label: "1 месяц" },
  { key: "2m", label: "2 месяца" },
  { key: "3m", label: "3 месяца" },
  { key: "6m", label: "6 месяцев" },
  { key: "1y", label: "1 год" },
  { key: "custom", label: "Свой диапазон" },
];
const REPORT_TYPE_OPTIONS = [
  { key: "location",     label: "По локации",  icon: <IconLocation />,  endpoint: "download-events-location" },
  { key: "control_unit", label: "По ЦБУ",      icon: <IconBuilding />,  endpoint: "download-events-control-unit" },
  { key: "sensor",       label: "По датчику",  icon: <IconSensor />,    endpoint: "download-events-sensor" },
];
const COLS = [
  { key: "id",          label: "ID" },
  { key: "severity",    label: "Серьезность" },
  { key: "alarm_type",  label: "Тип события" },
  { key: "sensor_id",   label: "Датчик" },
  { key: "description", label: "Описание" },
  { key: "status",      label: "Статус" },
  { key: "timestamp",   label: "Время события" },
  { key: "resolved_at", label: "Время устранения" },
];

const formatDateTime = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("ru-RU", {
      day: "2-digit", month: "2-digit", year: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
};

function Dropdown({ trigger, children, open, setOpen }) {
  return (
    <div className="rp-dropdown-wrap">
      <div onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}>
        {trigger}
      </div>
      {open && (
        <>
          <div
            className="rp-dropdown-backdrop"
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
          />
          <div className="rp-dropdown-menu" style={{ position: "relative", zIndex: 1001 }}>
            {children}
          </div>
        </>
      )}
    </div>
  );
}

function FilterChip({ label, onRemove }) {
  return (
    <span className="rp-filter-chip">
      {label}
      <button className="rp-filter-chip-x" onClick={onRemove}><IconX /></button>
    </span>
  );
}

// ── Comment Edit Modal ────────────────────────────────────────────────────────
function CommentModal({ alarmId, value, onSave, onClose }) {
  const [val, setVal] = useState(value || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const updated = await apiRequest(`/alarms/${alarmId}/comment`, {
        method: "PATCH",
        body: JSON.stringify({ comment: val }),
      });
      onSave(updated);
      onClose();
    } catch (err) {
      setError(err.message || "Ошибка сохранения комментария");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rp-modal-overlay" onClick={onClose}>
      <div className="rp-modal" onClick={e => e.stopPropagation()}>
        <div className="rp-modal-header">
          <h3 className="rp-modal-title">Комментарий к тревоге #{alarmId}</h3>
          <button className="rp-modal-close" onClick={onClose}><IconClose /></button>
        </div>
        <div className="rp-modal-body">
          <textarea
            ref={textareaRef}
            className="rp-desc-textarea"
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => { if (e.key === "Escape") onClose(); }}
            placeholder="Введите комментарий оператора..."
            rows={5}
          />
          {error && <div style={{ color: "#ff5252", fontSize: "12px", marginTop: "6px" }}>{error}</div>}
        </div>
        <div className="rp-modal-footer">
          <button className="rp-btn-cancel" onClick={onClose}>Отмена</button>
          <button className="rp-btn-save" onClick={handleSave} disabled={saving}>
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Status picker ─────────────────────────────────────────────────────────────
function StatusPicker({ alarm, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState(null);

  const currentStatus = optimisticStatus ?? alarm.status;
  const st = STATUS_MAP[currentStatus] || STATUS_MAP.new;

  const handleChange = async (newStatus) => {
    setOpen(false);
    if (newStatus === alarm.status) return;
    setOptimisticStatus(newStatus);
    setLoading(true);
    try {
      const updated = await apiRequest(`/alarms/${alarm.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      setOptimisticStatus(null);
      onUpdate(updated);
    } catch (err) {
      setOptimisticStatus(null);
      console.error("Ошибка смены статуса:", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dropdown open={open} setOpen={setOpen}
      trigger={
        <span
          className="rp-status-pill rp-status-pill--clickable"
          style={{ color: st.color, background: st.bg, opacity: loading ? 0.7 : 1, cursor: "pointer" }}
        >
          {loading ? "..." : st.label}
          <IconChevDown />
        </span>
      }
    >
      {Object.entries(STATUS_MAP).map(([key, s]) => (
        <div
          key={key}
          className={`rp-dropdown-item ${currentStatus === key ? "rp-dropdown-item--active" : ""}`}
          onClick={(e) => { e.stopPropagation(); handleChange(key); }}
          style={{ color: s.color, cursor: "pointer" }}
        >
          {currentStatus === key && <IconCheck />}
          {s.label}
        </div>
      ))}
    </Dropdown>
  );
}

// ── Description cell ──────────────────────────────────────────────────────────
function DescriptionCell({ alarm, onUpdate }) {
  const [modalOpen, setModalOpen] = useState(false);
  const displayText = alarm.user_comment || alarm.description || "—";

  return (
    <>
      <span
        className="rp-editable-cell"
        onClick={() => setModalOpen(true)}
        title="Нажмите для добавления комментария"
      >
        <IconEdit />
        <span className="rp-description-text">{displayText}</span>
      </span>
      {modalOpen && (
        <CommentModal
          alarmId={alarm.id}
          value={alarm.user_comment || ""}
          onSave={onUpdate}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

// ── Calendar picker ───────────────────────────────────────────────────────────
function CalendarPicker({ onChange }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(today);
  const [selecting, setSelecting] = useState("start");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const blanks = (firstDay + 6) % 7;
  const MONTHS = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
  const DAYS = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

  const selectDay = (d) => {
    const date = new Date(year, month, d);
    if (selecting === "start" || (startDate && date < startDate)) {
      setStartDate(date); setEndDate(null); setSelecting("end");
    } else {
      setEndDate(date); setSelecting("start");
      onChange({ start: startDate, end: date });
    }
  };

  const isInRange = (d) => {
    const date = new Date(year, month, d);
    return startDate && endDate && date >= startDate && date <= endDate;
  };
  const isStart = (d) => startDate && new Date(year, month, d).toDateString() === startDate.toDateString();
  const isEnd   = (d) => endDate   && new Date(year, month, d).toDateString() === endDate.toDateString();
  const fmt = (d) => d ? d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "—";

  return (
    <div className="rp-calendar">
      <div className="rp-calendar-hint">
        {selecting === "start" ? "Выберите начальную дату" : "Выберите конечную дату"}
        {startDate && <span className="rp-calendar-range-label">{fmt(startDate)} – {fmt(endDate)}</span>}
      </div>
      <div className="rp-calendar-nav">
        <button className="rp-cal-nav-btn" onClick={() => setViewDate(new Date(year, month - 1, 1))}><IconChevLeft /></button>
        <span className="rp-calendar-month">{MONTHS[month]} {year}</span>
        <button className="rp-cal-nav-btn" onClick={() => setViewDate(new Date(year, month + 1, 1))}><IconChevRight /></button>
      </div>
      <div className="rp-calendar-grid">
        {DAYS.map(d => <div key={d} className="rp-cal-dayname">{d}</div>)}
        {Array(blanks).fill(null).map((_, i) => <div key={"b" + i} />)}
        {Array(daysInMonth).fill(null).map((_, i) => {
          const d = i + 1;
          return (
            <div key={d}
              className={`rp-cal-day ${isStart(d) ? "rp-cal-day--start" : ""} ${isEnd(d) ? "rp-cal-day--end" : ""} ${isInRange(d) ? "rp-cal-day--range" : ""}`}
              onClick={() => selectDay(d)}>
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Скачивание отчёта (blob) ──────────────────────────────────────────────────
const downloadReport = async (path, fallbackFilename, isXlsx = false) => {
  const token = getToken();

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(isXlsx
      ? { Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
      : { Accept: "application/pdf" }),
  };

  const response = await fetch(`${BASE_URL}${path}`, { headers });

  if (response.status === 403) {
    throw new Error("403: Нет доступа к этой сущности");
  }
  if (response.status === 422) {
    let detail = "Неверные параметры запроса (422)";
    try {
      const body = await response.json();
      if (body?.detail) {
        detail = Array.isArray(body.detail)
          ? body.detail.map(e => `${e.loc?.join(".")} — ${e.msg}`).join("; ")
          : String(body.detail);
      }
    } catch { /* ignore */ }
    throw new Error(detail);
  }
  if (!response.ok) {
    let msg = `Ошибка ${response.status}`;
    try { const e = await response.json(); if (e.detail) msg = e.detail; } catch {}
    throw new Error(msg);
  }

  let fname = fallbackFilename;
  const cd = response.headers.get("Content-Disposition");
  if (cd) {
    const m = cd.match(/filename[^;=\n]*=([^;\n]*)/);
    if (m) fname = m[1].replace(/['"]/g, "").trim();
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ── Generic Selector (Location / ControlUnit / Sensor) ───────────────────────
function EntitySelector({ value, onChange, items, loading, error, placeholder, icon }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef    = useRef(null);
  const [menuStyle, setMenuStyle] = useState({});

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setMenuStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 200),
      zIndex: 9999,
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) setOpen(false);
    };
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 50);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", handler); };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const h = () => setOpen(false);
    window.addEventListener("scroll", h, true);
    return () => window.removeEventListener("scroll", h, true);
  }, [open]);

  const selectedLabel = value
    ? (value.name || value.serial_number || `#${value.id}`)
    : placeholder;

  if (loading) return <div className="rp-location-loading">Загрузка...</div>;
  if (error)   return <div className="rp-location-error">{error}</div>;
  if (!items || items.length === 0) return <div className="rp-location-empty">Нет доступных элементов</div>;

  return (
    <>
      <div ref={triggerRef} className="rp-location-trigger" onClick={() => setOpen(o => !o)}>
        {icon}
        <span className="rp-location-trigger-label">{selectedLabel}</span>
        <IconChevDown />
      </div>
      {open && ReactDOM.createPortal(
        <div
          ref={menuRef}
          className="rp-dropdown-menu"
          style={menuStyle}
          onMouseDown={e => e.stopPropagation()}
        >
          {items.map(item => (
            <div
              key={item.id}
              className={`rp-dropdown-item ${value?.id === item.id ? "rp-dropdown-item--active" : ""}`}
              onClick={() => { onChange(item); setOpen(false); }}
              style={{ cursor: "pointer" }}
            >
              {value?.id === item.id && <IconCheck />}
              {item.name || item.serial_number || `#${item.id}`}
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

// ── LocationSelector ──────────────────────────────────────────────────────────
function LocationSelector({ value, onChange, locations, loading: loadingLocs, error, allLabel }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef    = useRef(null);
  const [menuStyle, setMenuStyle] = useState({});

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setMenuStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) setOpen(false);
    };
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 50);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", handler); };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const h = () => setOpen(false);
    window.addEventListener("scroll", h, true);
    return () => window.removeEventListener("scroll", h, true);
  }, [open]);

  const selectedLabel = value
    ? (value.name || `Локация #${value.id}`)
    : (allLabel || "Выберите локацию");

  if (loadingLocs) return <div className="rp-location-loading">Загрузка локаций...</div>;
  if (error)       return <div className="rp-location-error">{error}</div>;
  if (!locations || locations.length === 0) return <div className="rp-location-empty">Нет доступных локаций</div>;

  return (
    <>
      <div ref={triggerRef} className="rp-location-trigger" onClick={() => setOpen(o => !o)}>
        <IconLocation />
        <span className="rp-location-trigger-label">{selectedLabel}</span>
        <IconChevDown />
      </div>
      {open && ReactDOM.createPortal(
        <div
          ref={menuRef}
          className="rp-dropdown-menu"
          style={menuStyle}
          onMouseDown={e => e.stopPropagation()}
        >
          {allLabel && (
            <div
              className={`rp-dropdown-item ${!value ? "rp-dropdown-item--active" : ""}`}
              onClick={() => { onChange(null); setOpen(false); }}
              style={{ cursor: "pointer" }}
            >
              {!value && <IconCheck />}
              {allLabel}
            </div>
          )}
          {locations.map(loc => (
            <div
              key={loc.id}
              className={`rp-dropdown-item ${value?.id === loc.id ? "rp-dropdown-item--active" : ""}`}
              onClick={() => { onChange(loc); setOpen(false); }}
              style={{ cursor: "pointer" }}
            >
              {value?.id === loc.id && <IconCheck />}
              {loc.name || `Локация #${loc.id}`}
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

// ── FilterPanel ────────────────────────────────────────────────────────────────
function FilterPanel({
  anchorRef, onClose,
  filterIdRange, setFilterIdRange,
  filterSeverity, setFilterSeverity,
  filterType, setFilterType,
  filterStatus, setFilterStatus,
  activeFilters, setPage, onClearAll,
}) {
  const panelRef = useRef(null);
  const [style, setStyle] = useState({ opacity: 0 });

  useEffect(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const panelWidth = 260;
    const viewportWidth = window.innerWidth;
    let left = rect.right - panelWidth;
    if (left < 8) left = 8;
    if (left + panelWidth > viewportWidth - 8) left = viewportWidth - panelWidth - 8;
    setStyle({ position: "fixed", top: rect.bottom + 8, left, width: panelWidth, zIndex: 9999, opacity: 1 });
  }, [anchorRef]);

  useEffect(() => {
    const handler = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        anchorRef.current && !anchorRef.current.contains(e.target)
      ) onClose();
    };
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 50);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", handler); };
  }, [onClose, anchorRef]);

  useEffect(() => {
    const h = () => onClose();
    window.addEventListener("scroll", h, true);
    return () => window.removeEventListener("scroll", h, true);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div ref={panelRef} className="rp-filter-panel-fixed" style={style} onMouseDown={e => e.stopPropagation()}>
      <div className="rp-filter-section-title">Фильтрация</div>

      <div className="rp-filter-label">ID диапазон</div>
      <div className="rp-filter-id-row">
        <input className="rp-filter-id-input" placeholder="от" value={filterIdRange.from}
          onChange={e => { setFilterIdRange(p => ({ ...p, from: e.target.value })); setPage(1); }} />
        <span style={{ color: "#929292" }}>—</span>
        <input className="rp-filter-id-input" placeholder="до" value={filterIdRange.to}
          onChange={e => { setFilterIdRange(p => ({ ...p, to: e.target.value })); setPage(1); }} />
      </div>

      <div className="rp-filter-label">Критичность</div>
      <div className="rp-filter-options">
        {Object.entries(SEVERITY_MAP).map(([k, v]) => (
          <div key={k}
            className={`rp-filter-option ${filterSeverity === k ? "rp-filter-option--active" : ""}`}
            style={{ color: filterSeverity === k ? v.color : undefined }}
            onClick={() => { setFilterSeverity(p => p === k ? "" : k); setPage(1); }}>
            {v.label}
          </div>
        ))}
      </div>

      <div className="rp-filter-label">Тип события</div>
      <div className="rp-filter-options rp-filter-options--col">
        {Object.entries(ALARM_TYPE_MAP).map(([k, v]) => (
          <div key={k}
            className={`rp-filter-option ${filterType === k ? "rp-filter-option--active" : ""}`}
            onClick={() => { setFilterType(p => p === k ? "" : k); setPage(1); }}>
            {v}
          </div>
        ))}
      </div>

      <div className="rp-filter-label">Статус</div>
      <div className="rp-filter-options rp-filter-options--col">
        {Object.entries(STATUS_MAP).map(([k, v]) => (
          <div key={k}
            className={`rp-filter-option ${filterStatus === k ? "rp-filter-option--active" : ""}`}
            style={{ color: filterStatus === k ? v.color : undefined }}
            onClick={() => { setFilterStatus(p => p === k ? "" : k); setPage(1); }}>
            {v.label}
          </div>
        ))}
      </div>

      {activeFilters.length > 0 && (
        <button className="rp-filter-clear-all" onClick={onClearAll}>Сбросить все</button>
      )}
    </div>,
    document.body
  );
}

// ── Export Card ───────────────────────────────────────────────────────────────
function ExportCard({
  locations, loadingLocs, locationsError,
  sensors, controlUnits,
  currentUser,
  exportHistory, setExportHistory,
}) {
  const [exportFmt, setExportFmt]           = useState("pdf");
  const [reportType, setReportType]         = useState("location");
  const [selectedLocation, setSelectedLocation]       = useState(null);
  const [selectedControlUnit, setSelectedControlUnit] = useState(null);
  const [selectedSensor, setSelectedSensor]           = useState(null);
  const [periodKey, setPeriodKey]           = useState("1m");
  const [showCalendar, setShowCalendar]     = useState(false);
  const [customRange, setCustomRange]       = useState(null);
  const [exportLoading, setExportLoading]   = useState(false);
  const [exportError, setExportError]       = useState("");

  const isAdmin = currentUser?.role === "admin";

  const availableLocations = useMemo(() => {
    if (isAdmin) return locations;
    if (!currentUser?.location_id) return [];
    return locations.filter(l => l.id === currentUser.location_id);
  }, [locations, isAdmin, currentUser]);

  // FIX: расширенная фильтрация ЦБУ — проверяем все возможные поля привязки к локации
  const availableControlUnits = useMemo(() => {
    if (isAdmin) return controlUnits;
    if (!currentUser?.location_id) return [];
    const locId = Number(currentUser.location_id);
    return controlUnits.filter(cu => {
      // Проверяем все возможные поля, по которым ЦБУ может быть привязан к локации
      return (
        Number(cu.location_id) === locId ||
        Number(cu.group_id)    === locId ||
        Number(cu.site_id)     === locId
      );
    });
  }, [controlUnits, isAdmin, currentUser]);

  const availableSensors = useMemo(() => {
    if (isAdmin) return sensors;
    if (!currentUser?.location_id) return [];
    const locId = Number(currentUser.location_id);
    return sensors.filter(s =>
      Number(s.location_id) === locId ||
      Number(s.group_id)    === locId
    );
  }, [sensors, isAdmin, currentUser]);

  const handleReportTypeChange = (key) => {
    setReportType(key);
    setSelectedLocation(null);
    setSelectedControlUnit(null);
    setSelectedSensor(null);
    setExportError("");
  };

  useEffect(() => {
    if (reportType === "location" && !selectedLocation && availableLocations.length > 0)
      setSelectedLocation(availableLocations[0]);
  }, [availableLocations, reportType]);

  useEffect(() => {
    if (reportType === "control_unit" && !selectedControlUnit && availableControlUnits.length > 0)
      setSelectedControlUnit(availableControlUnits[0]);
  }, [availableControlUnits, reportType]);

  useEffect(() => {
    if (reportType === "sensor" && !selectedSensor && availableSensors.length > 0)
      setSelectedSensor(availableSensors[0]);
  }, [availableSensors, reportType]);

  const getPeriodLabel = () => {
    if (periodKey === "custom" && customRange) {
      const fmt = d => d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });
      return `${fmt(customRange.start)} – ${fmt(customRange.end)}`;
    }
    return PERIOD_OPTIONS.find(p => p.key === periodKey)?.label || "—";
  };

  const getPeriodDescription = () => {
    const map = {
      "1d": "за 24 часа", "1w": "за неделю", "1m": "за месяц",
      "2m": "за 2 месяца", "3m": "за 3 месяца", "6m": "за 6 месяцев",
      "1y": "за год", "custom": "за выбранный период",
    };
    return map[periodKey] || "за период";
  };

  const handleExport = async () => {
    setExportLoading(true);
    setExportError("");

    try {
      const rtConfig = REPORT_TYPE_OPTIONS.find(r => r.key === reportType);
      let entityId, entityName;

      if (reportType === "location") {
        if (!selectedLocation) throw new Error("Выберите локацию");
        entityId   = selectedLocation.id;
        entityName = selectedLocation.name || `Локация #${entityId}`;
      } else if (reportType === "control_unit") {
        if (!selectedControlUnit) throw new Error("Выберите ЦБУ");
        entityId   = selectedControlUnit.id;
        entityName = selectedControlUnit.name || selectedControlUnit.serial_number || `ЦБУ #${entityId}`;
      } else {
        if (!selectedSensor) throw new Error("Выберите датчик");
        entityId   = selectedSensor.id;
        entityName = selectedSensor.name || selectedSensor.serial_number || `Датчик #${entityId}`;
      }

      const isXlsx = exportFmt === "xlsx";

      let params;
      if (periodKey === "custom") {
        if (!customRange?.start || !customRange?.end) throw new Error("Выберите диапазон дат");
        params = new URLSearchParams({
          period:     "custom",
          start_date: customRange.start.toISOString().slice(0, 10),
          end_date:   customRange.end.toISOString().slice(0, 10),
          format:     isXlsx ? "xlsx" : "pdf",
        });
      } else {
        params = new URLSearchParams({
          period: PERIOD_API_MAP[periodKey] || "last_month",
          format: isXlsx ? "xlsx" : "pdf",
        });
      }

      const ext = isXlsx ? "xlsx" : "pdf";
      const now = new Date();
      const dateStr = now.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
      const timeStr = now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
      const fallbackFilename = `report_${rtConfig.key}_${entityId}_${now.toISOString().slice(0,10)}.${ext}`;

      const path = `/reports/${rtConfig.endpoint}/${entityId}?${params}`;

      await downloadReport(path, fallbackFilename, isXlsx);

      const newEntry = {
        label: `${rtConfig.label} ${getPeriodDescription()} · ${entityName}`,
        fmt:   isXlsx ? "XLSX" : "PDF",
        date:  dateStr,
        time:  timeStr,
        color: isXlsx ? "#01e676" : "#ff5252",
        icon:  rtConfig.key,
      };

      // FIX: обновляем историю и сразу сохраняем в localStorage
      setExportHistory(prev => {
        const updated = [newEntry, ...prev];
        saveHistory(currentUser, updated);
        return updated;
      });

    } catch (err) {
      if (err.message?.startsWith("403")) {
        setExportError("Нет доступа к этой сущности");
      } else {
        setExportError(err.message || "Ошибка экспорта");
      }
    } finally {
      setExportLoading(false);
    }
  };

  const hasSelection = (
    (reportType === "location"     && selectedLocation)     ||
    (reportType === "control_unit" && selectedControlUnit)  ||
    (reportType === "sensor"       && selectedSensor)
  );

  const exportBtnLabel = exportLoading
    ? "Загрузка..."
    : exportFmt === "xlsx" ? "Экспортировать Excel" : "Экспортировать PDF";

  return (
    <div className="rp-card rp-export-card">
      <h2 className="rp-card-title">Экспортировать данные</h2>

      <div className="rp-format-row">
        <button
          className={`rp-format-btn rp-format-btn--pdf ${exportFmt === "pdf" ? "rp-format-btn--active" : ""}`}
          onClick={() => setExportFmt("pdf")}
        >
          <IconPDF />
          <span>PDF формат</span>
        </button>
        <button
          className={`rp-format-btn rp-format-btn--excel ${exportFmt === "xlsx" ? "rp-format-btn--active" : ""}`}
          onClick={() => setExportFmt("xlsx")}
        >
          <IconExcel />
          <span>Excel формат</span>
        </button>
      </div>

      <div className="rp-filter-label" style={{ marginTop: 14 }}>Тип отчёта</div>
      <div className="rp-report-type-row">
        {REPORT_TYPE_OPTIONS.map(opt => (
          <button
            key={opt.key}
            className={`rp-report-type-btn ${reportType === opt.key ? "rp-report-type-btn--active" : ""}`}
            onClick={() => handleReportTypeChange(opt.key)}
          >
            {opt.icon}
            <span>{opt.label}</span>
          </button>
        ))}
      </div>

      <div className="rp-filter-label" style={{ marginTop: 12 }}>
        {reportType === "location"     && "Локация"}
        {reportType === "control_unit" && "ЦБУ (Центральный блок управления)"}
        {reportType === "sensor"       && "Датчик"}
      </div>

      {reportType === "location" && (
        <EntitySelector
          value={selectedLocation}
          onChange={setSelectedLocation}
          items={availableLocations}
          loading={loadingLocs}
          error={locationsError}
          placeholder="Выберите локацию"
          icon={<IconLocation />}
        />
      )}
      {reportType === "control_unit" && (
        <EntitySelector
          value={selectedControlUnit}
          onChange={setSelectedControlUnit}
          items={availableControlUnits}
          loading={false}
          error={null}
          placeholder="Выберите ЦБУ"
          icon={<IconBuilding />}
        />
      )}
      {reportType === "sensor" && (
        <EntitySelector
          value={selectedSensor}
          onChange={setSelectedSensor}
          items={availableSensors}
          loading={false}
          error={null}
          placeholder="Выберите датчик"
          icon={<IconSensor />}
        />
      )}

      <div className="rp-filter-label" style={{ marginTop: 12 }}>Период</div>
      <div className="rp-period-quick">
        {PERIOD_OPTIONS.filter(p => p.key !== "custom").map(p => (
          <button key={p.key}
            className={`rp-period-chip ${periodKey === p.key ? "rp-period-chip--active" : ""}`}
            onClick={() => { setPeriodKey(p.key); setShowCalendar(false); setCustomRange(null); }}>
            {p.label}
          </button>
        ))}
        <button
          className={`rp-period-chip ${periodKey === "custom" ? "rp-period-chip--active" : ""}`}
          onClick={() => { setPeriodKey("custom"); setShowCalendar(s => !s); }}>
          <IconCalendar />&nbsp;Свой диапазон
        </button>
      </div>

      {showCalendar && periodKey === "custom" && (
        <CalendarPicker onChange={range => { setCustomRange(range); setShowCalendar(false); }} />
      )}

      <div className="rp-period-field">
        <IconEventNote />
        <span className="rp-period-dates">{getPeriodLabel()}</span>
        <span className="rp-period-label">Выбранный период</span>
      </div>

      {exportError && (
        <div style={{ fontSize: "12px", color: "#ff5252", marginTop: 4 }}>{exportError}</div>
      )}

      <button
        className="rp-export-btn"
        onClick={handleExport}
        disabled={exportLoading || !hasSelection}
        title={!hasSelection ? "Выберите сущность для отчёта" : undefined}
      >
        <IconDownload />
        <span>{exportBtnLabel}</span>
      </button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export const Reports = () => {
  const [alarms, setAlarms]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState("");

  const [locations, setLocations]             = useState([]);
  const [loadingLocs, setLoadingLocs]         = useState(true);
  const [locationsError, setLocationsError]   = useState("");
  const [sensors, setSensors]                 = useState([]);
  const [controlUnits, setControlUnits]       = useState([]);
  const [currentUser, setCurrentUser]         = useState(null);

  const [tableLocation, setTableLocation] = useState(null);

  const [search, setSearch]                 = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [filterStatus, setFilterStatus]     = useState("");
  const [filterType, setFilterType]         = useState("");
  const [filterIdRange, setFilterIdRange]   = useState({ from: "", to: "" });
  const [filterOpen, setFilterOpen]         = useState(false);
  const filterRef = useRef(null);

  // FIX: история инициализируется из localStorage после загрузки пользователя
  const [exportHistory, setExportHistory] = useState([]);

  const [page, setPage]       = useState(1);
  const [sortCol, setSortCol] = useState("timestamp");
  const [sortDir, setSortDir] = useState("desc");

  const ROWS_PER_PAGE = 10;

  useEffect(() => {
    const load = async () => {
      setLoadingLocs(true);
      setLocationsError("");
      try {
        const [locData, sensorData, userData] = await Promise.all([
          apiRequest("/locations/"),
          apiRequest("/sensors/"),
          apiRequest("/users/me"),
        ]);
        setLocations(Array.isArray(locData) ? locData : []);
        setSensors(Array.isArray(sensorData) ? sensorData : []);

        const user = userData || null;
        setCurrentUser(user);

        // FIX: загружаем историю из localStorage сразу после получения данных пользователя
        if (user) {
          setExportHistory(loadHistory(user));
        }

        // FIX: пробуем загрузить ЦБУ сначала из /control-units/, потом из /groups/
        // и логируем структуру для диагностики
        try {
          const cuData = await apiRequest("/control-units/");
          const arr = Array.isArray(cuData) ? cuData : [];
          if (arr.length > 0) {
            console.debug("[Reports] ЦБУ поля первой записи:", Object.keys(arr[0]));
          }
          setControlUnits(arr);
        } catch {
          try {
            const grpData = await apiRequest("/groups/");
            const arr = Array.isArray(grpData) ? grpData : [];
            if (arr.length > 0) {
              console.debug("[Reports] Groups поля первой записи:", Object.keys(arr[0]));
            }
            setControlUnits(arr);
          } catch {
            setControlUnits([]);
          }
        }
      } catch (err) {
        setLocationsError("Не удалось загрузить данные");
        console.error("Ошибка загрузки:", err.message);
      } finally {
        setLoadingLocs(false);
      }
    };
    load();
  }, []);

  const loadAlarms = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const data = await apiRequest("/alarms/");
      setAlarms(Array.isArray(data) ? data : []);
    } catch (err) {
      setLoadError(err.message || "Ошибка загрузки тревог");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAlarms(); }, [loadAlarms]);

  useEffect(() => {
    const unsubStatus = wsService.on("alarm_updated", (event) => {
      setAlarms(prev => prev.map(a =>
        a.id === event.alarm_id
          ? { ...a, status: event.new_status, resolved_at: event.resolved_at, user_comment: event.user_comment ?? a.user_comment }
          : a
      ));
    });
    const unsubComment = wsService.on("alarm_comment_updated", (event) => {
      setAlarms(prev => prev.map(a =>
        a.id === event.alarm_id ? { ...a, user_comment: event.user_comment } : a
      ));
    });
    return () => { unsubStatus(); unsubComment(); };
  }, []);

  const updateAlarm = useCallback((updated) => {
    if (!updated) return;
    setAlarms(prev => prev.map(a => a.id === updated.id ? updated : a));
  }, []);

  const handleSort = (key) => {
    if (sortCol === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(key); setSortDir("asc"); }
    setPage(1);
  };

  const locationSensorIds = useMemo(() => {
    if (!tableLocation) return null;
    return new Set(
      sensors
        .filter(s => Number(s.group_id) === Number(tableLocation.id))
        .map(s => s.id)
    );
  }, [tableLocation, sensors]);

  const filtered = alarms.filter(a => {
    if (locationSensorIds && !locationSensorIds.has(Number(a.sensor_id))) return false;
    if (search) {
      const q = search.toLowerCase();
      const typeLabel = ALARM_TYPE_MAP[a.alarm_type] || a.alarm_type || "";
      if (![String(a.id), typeLabel, a.description || "", a.user_comment || ""].some(v => v.toLowerCase().includes(q))) return false;
    }
    if (filterSeverity && a.severity    !== filterSeverity) return false;
    if (filterStatus   && a.status      !== filterStatus)   return false;
    if (filterType     && a.alarm_type  !== filterType)     return false;
    if (filterIdRange.from && a.id < parseInt(filterIdRange.from)) return false;
    if (filterIdRange.to   && a.id > parseInt(filterIdRange.to))   return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!sortCol) return 0;
    const av = a[sortCol] ?? "", bv = b[sortCol] ?? "";
    return sortDir === "asc"
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av));
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const pageData   = sorted.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const activeFilters = [
    filterSeverity && { key: "severity", label: `Критичность: ${SEVERITY_MAP[filterSeverity]?.label}`, clear: () => setFilterSeverity("") },
    filterStatus   && { key: "status",   label: `Статус: ${STATUS_MAP[filterStatus]?.label}`,           clear: () => setFilterStatus("") },
    filterType     && { key: "type",     label: `Тип: ${ALARM_TYPE_MAP[filterType] || filterType}`,     clear: () => setFilterType("") },
    (filterIdRange.from || filterIdRange.to) && { key: "id", label: `ID: ${filterIdRange.from || "—"} – ${filterIdRange.to || "—"}`, clear: () => setFilterIdRange({ from: "", to: "" }) },
  ].filter(Boolean);

  // FIX: очистка истории с удалением из localStorage
  const handleClearHistory = () => {
    setExportHistory([]);
    saveHistory(currentUser, []);
  };

  return (
    <div className="rp-container">
      <main className="rp-main">
        <div className="rp-page-header">
          <h1 className="rp-page-title">Уведомления</h1>
          <button className="rp-refresh-btn" onClick={loadAlarms} disabled={loading} title="Обновить">
            <IconRefresh />
            {loading ? "Загрузка..." : "Обновить"}
          </button>
        </div>

        {loadError && <div className="rp-error-banner">{loadError}</div>}

        <div className="rp-card rp-table-card">
          <div className="rp-table-topbar">
            <h2 className="rp-card-title">Журнал событий</h2>
            <div className="rp-table-controls">
              <div className="rp-table-location-wrap">
                <LocationSelector
                  value={tableLocation}
                  onChange={(loc) => { setTableLocation(loc); setPage(1); }}
                  locations={locations}
                  loading={loadingLocs}
                  error={locationsError}
                  allLabel="Все локации"
                />
              </div>
              <div className="rp-search-box">
                <IconSearch />
                <input
                  className="rp-search-input"
                  placeholder="Поиск по ID, типу, описанию..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                />
                {search && <button className="rp-search-clear" onClick={() => setSearch("")}><IconX /></button>}
              </div>
              <div className="rp-filter-wrap" ref={filterRef}>
                <button
                  className={`rp-filter-btn ${activeFilters.length ? "rp-filter-btn--active" : ""}`}
                  onClick={() => setFilterOpen(o => !o)}
                >
                  <IconFilter />
                  {activeFilters.length > 0 && <span className="rp-filter-badge">{activeFilters.length}</span>}
                </button>
                {filterOpen && (
                  <FilterPanel
                    anchorRef={filterRef}
                    onClose={() => setFilterOpen(false)}
                    filterIdRange={filterIdRange}   setFilterIdRange={setFilterIdRange}
                    filterSeverity={filterSeverity} setFilterSeverity={setFilterSeverity}
                    filterType={filterType}         setFilterType={setFilterType}
                    filterStatus={filterStatus}     setFilterStatus={setFilterStatus}
                    activeFilters={activeFilters}
                    setPage={setPage}
                    onClearAll={() => {
                      setFilterSeverity(""); setFilterStatus(""); setFilterType("");
                      setFilterIdRange({ from: "", to: "" }); setPage(1);
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className="rp-filter-chips">
              {activeFilters.map(f => <FilterChip key={f.key} label={f.label} onRemove={f.clear} />)}
            </div>
          )}

          <div className="rp-col-header">
            {COLS.map(col => (
              <div key={col.key} className="rp-col-head" onClick={() => handleSort(col.key)}>
                <span>{col.label}</span>
                {["id","severity","status","timestamp","resolved_at"].includes(col.key) ? <IconSort /> : <IconSortAlt />}
              </div>
            ))}
          </div>

          <div className="rp-table-body">
            {loading && <div className="rp-empty-state">Загрузка событий...</div>}
            {!loading && pageData.length === 0 && (
              <div className="rp-empty-state">
                {alarms.length === 0 ? "Нет тревог" : "Нет событий, соответствующих фильтрам"}
              </div>
            )}
            {!loading && pageData.map((row) => {
              const sev = SEVERITY_MAP[row.severity] || { label: row.severity, color: "#929292" };
              const typeLabel = ALARM_TYPE_MAP[row.alarm_type] || row.alarm_type || "—";
              return (
                <div key={row.id} className="rp-table-row">
                  <div className="rp-td">{row.id}</div>
                  <div className="rp-td" style={{ color: sev.color }}>{sev.label}</div>
                  <div className="rp-td rp-td--gap"><IconMessage />{typeLabel}</div>
                  <div className="rp-td" style={{ color: "#929292" }}>#{row.sensor_id}</div>
                  <div className="rp-td"><DescriptionCell alarm={row} onUpdate={updateAlarm} /></div>
                  <div className="rp-td"><StatusPicker alarm={row} onUpdate={updateAlarm} /></div>
                  <div className="rp-td">{formatDateTime(row.timestamp)}</div>
                  <div className="rp-td">{formatDateTime(row.resolved_at)}</div>
                </div>
              );
            })}
          </div>

          <div className="rp-pagination">
            <span className="rp-pagination-count">{filtered.length} записей</span>
            <button className="rp-page-btn" onClick={() => setPage(p => Math.max(1, p - 1))}><IconChevLeft /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`rp-page-num ${page === p ? "rp-page-num--active" : ""}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="rp-page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))}><IconChevRight /></button>
          </div>
        </div>

        <div className="rp-bottom-row">
          <ExportCard
            locations={locations}
            loadingLocs={loadingLocs}
            locationsError={locationsError}
            sensors={sensors}
            controlUnits={controlUnits}
            currentUser={currentUser}
            exportHistory={exportHistory}
            setExportHistory={setExportHistory}
          />

          <div className="rp-card rp-history-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 className="rp-card-title">История экспорта</h2>
              {exportHistory.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  title="Очистить историю"
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    background: "none", border: "none", cursor: "pointer",
                    color: "#929292", fontSize: "12px", padding: "2px 6px",
                  }}
                >
                  <IconTrash /> Очистить
                </button>
              )}
            </div>
            {exportHistory.length === 0 && (
              <div className="rp-empty-state" style={{ marginTop: 16 }}>Нет истории</div>
            )}
            <ul className="rp-history-list">
              {exportHistory.map((item, i) => (
                <li key={i} className="rp-history-item">
                  <div className="rp-history-timeline">
                    <span className="rp-history-dot" style={{ background: item.color }} />
                    {i < exportHistory.length - 1 && <span className="rp-history-line" />}
                  </div>
                  <div className="rp-history-text">
                    <div className="rp-history-label-row">
                      <span className="rp-history-label">{item.label}</span>
                      <span className="rp-history-fmt-tag" style={{ color: item.color, borderColor: item.color }}>{item.fmt}</span>
                    </div>
                    <span className="rp-history-date">{item.date} в {item.time}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reports;