import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import "./Reports.css";
import { apiRequest } from "../services/api";
import { getToken } from "../services/api";
import { wsService } from "../services/websocketService";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

// ── Icons ─────────────────────────────────────────────────────────────────────
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

// ── Маппинг API → UI ──────────────────────────────────────────────────────────
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
  "1d": "last_24_hours",
  "1w": "last_week",
  "1m": "last_month",
  "1y": "last_year",
};

const PERIOD_OPTIONS = [
  { key: "1d", label: "1 день" },
  { key: "1w", label: "1 неделя" },
  { key: "1m", label: "1 месяц" },
  { key: "1y", label: "1 год" },
  { key: "custom", label: "Свой диапазон" },
];

const COLS = [
  { key: "id",          label: "ID" },
  { key: "severity",    label: "Критичность" },
  { key: "alarm_type",  label: "Тип события" },
  { key: "sensor_id",   label: "Датчик" },
  { key: "description", label: "Описание" },
  { key: "status",      label: "Статус" },
  { key: "timestamp",   label: "Время события" },
  { key: "resolved_at", label: "Время устранения" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDateTime = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("ru-RU", {
      day: "2-digit", month: "2-digit", year: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
};

// ── Dropdown ──────────────────────────────────────────────────────────────────
// FIX: The original implementation used a mousedown listener on document to close
// the dropdown. This caused a race condition: mousedown fired and closed the menu
// BEFORE the click event on a menu item could register — so items were never selectable.
// Solution: use a transparent backdrop div that closes the menu on click,
// and let menu items handle their own clicks normally. This guarantees
// the item's onClick fires before the backdrop's onClick.
function Dropdown({ trigger, children, open, setOpen }) {
  return (
    <div className="rp-dropdown-wrap">
      <div onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}>
        {trigger}
      </div>
      {open && (
        <>
          {/* Backdrop closes menu; pointer-events none on children ensures
              clicks on menu items reach their onClick handlers first */}
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

// ── FilterChip ────────────────────────────────────────────────────────────────
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

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const updated = await apiRequest(`/alarms/${alarmId}`, {
        method: "PATCH",
        body: JSON.stringify({ user_comment: val }),
      });
      onSave(updated);
      onClose();
    } catch (err) {
      setError(err.message || "Ошибка сохранения");
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
// FIX 1: Removed setOpen(false) from handleChange — the backdrop now handles closing,
//         so calling setOpen(false) before the await caused the menu to vanish
//         before the item click event fully propagated.
// FIX 2: Added optimistic UI update — status pill updates immediately on click,
//         then rolls back to the server response (or original on error).
// FIX 3: All three statuses (new, acknowledged, resolved) are now always clickable
//         regardless of the alarm's current status.
function StatusPicker({ alarm, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  // Optimistic: show the picked status immediately while the request is in-flight
  const [optimisticStatus, setOptimisticStatus] = useState(null);

  const currentStatus = optimisticStatus ?? alarm.status;
  const st = STATUS_MAP[currentStatus] || STATUS_MAP.new;

  const handleChange = async (newStatus) => {
    // Close the dropdown via backdrop naturally; just update state here
    setOpen(false);
    if (newStatus === alarm.status) return;

    // Optimistic update so the pill changes instantly
    setOptimisticStatus(newStatus);
    setLoading(true);
    try {
      const updated = await apiRequest(`/alarms/${alarm.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      // Sync with server response
      setOptimisticStatus(null);
      onUpdate(updated);
    } catch (err) {
      // Roll back on error
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
        <span>{displayText}</span>
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
  const isEnd = (d) => endDate && new Date(year, month, d).toDateString() === endDate.toDateString();
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
const downloadReport = async (path, filename) => {
  const token = getToken();
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!response.ok) {
    let msg = `Ошибка ${response.status}`;
    try { const e = await response.json(); if (e.detail) msg = e.detail; } catch {}
    throw new Error(msg);
  }
  let fname = filename;
  const cd = response.headers.get("Content-Disposition");
  if (cd) { const m = cd.match(/filename[^;=\n]*=([^;\n]*)/); if (m) fname = m[1].replace(/['"]/g, "").trim(); }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = fname;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
};

// ── FilterPanel (Portal) ──────────────────────────────────────────────────────
// Рендерится через ReactDOM.createPortal прямо в document.body.
// Позиция вычисляется по getBoundingClientRect кнопки-якоря,
// поэтому панель всегда отображается поверх любых блоков страницы
// независимо от overflow, z-index или stacking context родителей.
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

  // Вычисляем позицию под кнопкой после монтирования
  useEffect(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const panelWidth = 260;
    const viewportWidth = window.innerWidth;

    let left = rect.right - panelWidth;
    if (left < 8) left = 8;
    if (left + panelWidth > viewportWidth - 8) left = viewportWidth - panelWidth - 8;

    setStyle({
      position: "fixed",
      top: rect.bottom + 8,
      left,
      width: panelWidth,
      zIndex: 9999,
      opacity: 1,
    });
  }, [anchorRef]);

  // Закрываем при клике вне панели и кнопки
  useEffect(() => {
    const handler = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        anchorRef.current && !anchorRef.current.contains(e.target)
      ) {
        onClose();
      }
    };
    // Небольшая задержка чтобы не сработало на сам клик открытия
    const timeout = setTimeout(() => {
      document.addEventListener("mousedown", handler);
    }, 50);
    return () => {
      clearTimeout(timeout);
      document.removeEventListener("mousedown", handler);
    };
  }, [onClose, anchorRef]);

  // Закрываем при скролле страницы (позиция уплывёт)
  useEffect(() => {
    const handler = () => onClose();
    window.addEventListener("scroll", handler, true);
    return () => window.removeEventListener("scroll", handler, true);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div
      ref={panelRef}
      className="rp-filter-panel-fixed"
      style={style}
      // Не даём клику внутри панели дойти до backdrop документа
      onMouseDown={e => e.stopPropagation()}
    >
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
        <button className="rp-filter-clear-all" onClick={onClearAll}>
          Сбросить все
        </button>
      )}
    </div>,
    document.body
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export const Reports = () => {
  const [alarms, setAlarms]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [loadError, setLoadError]   = useState("");

  const [search, setSearch]                 = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [filterStatus, setFilterStatus]     = useState("");
  const [filterType, setFilterType]         = useState("");
  const [filterIdRange, setFilterIdRange]   = useState({ from: "", to: "" });
  const [filterOpen, setFilterOpen]         = useState(false);
  const filterRef = useRef(null);

  const [exportFmt, setExportFmt]         = useState("pdf");
  const [periodKey, setPeriodKey]         = useState("1m");
  const [showCalendar, setShowCalendar]   = useState(false);
  const [customRange, setCustomRange]     = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError]     = useState("");
  const [exportHistory, setExportHistory] = useState([]);

  const [page, setPage]       = useState(1);
  const [sortCol, setSortCol] = useState("timestamp");
  const [sortDir, setSortDir] = useState("desc");

  const ROWS_PER_PAGE = 10;

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
    const unsub = wsService.on("alarm_updated", (event) => {
      setAlarms(prev => prev.map(a =>
        a.id === event.alarm_id
          ? { ...a, status: event.new_status, resolved_at: event.resolved_at, user_comment: event.user_comment ?? a.user_comment }
          : a
      ));
    });
    return () => unsub();
  }, []);

  // Закрытие фильтр-панели при клике вне обрабатывается внутри FilterPanel (портал)

  const updateAlarm = useCallback((updated) => {
    if (!updated) return;
    setAlarms(prev => prev.map(a => a.id === updated.id ? updated : a));
  }, []);

  const handleSort = (key) => {
    if (sortCol === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(key); setSortDir("asc"); }
    setPage(1);
  };

  const filtered = alarms.filter(a => {
    if (search) {
      const q = search.toLowerCase();
      const typeLabel = ALARM_TYPE_MAP[a.alarm_type] || a.alarm_type || "";
      if (![String(a.id), typeLabel, a.description || "", a.user_comment || ""].some(v => v.toLowerCase().includes(q))) return false;
    }
    if (filterSeverity && a.severity !== filterSeverity) return false;
    if (filterStatus   && a.status   !== filterStatus)   return false;
    if (filterType     && a.alarm_type !== filterType)   return false;
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
  const pageData = sorted.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const activeFilters = [
    filterSeverity && { key: "severity", label: `Критичность: ${SEVERITY_MAP[filterSeverity]?.label}`, clear: () => setFilterSeverity("") },
    filterStatus   && { key: "status",   label: `Статус: ${STATUS_MAP[filterStatus]?.label}`,           clear: () => setFilterStatus("") },
    filterType     && { key: "type",     label: `Тип: ${ALARM_TYPE_MAP[filterType] || filterType}`,     clear: () => setFilterType("") },
    (filterIdRange.from || filterIdRange.to) && { key: "id", label: `ID: ${filterIdRange.from || "—"} – ${filterIdRange.to || "—"}`, clear: () => setFilterIdRange({ from: "", to: "" }) },
  ].filter(Boolean);

  const getPeriodLabel = () => {
    if (periodKey === "custom" && customRange) {
      const fmt = d => d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });
      return `${fmt(customRange.start)} – ${fmt(customRange.end)}`;
    }
    return PERIOD_OPTIONS.find(p => p.key === periodKey)?.label || "—";
  };

  const getPeriodDescription = () => {
    const map = { "1d": "за день", "1w": "за неделю", "1m": "за месяц", "1y": "за год", "custom": "за выбранный период" };
    return map[periodKey] || "за период";
  };

  const handleExport = async () => {
    setExportLoading(true);
    setExportError("");
    const fmt = exportFmt === "excel" ? "xlsx" : "pdf";
    const now = new Date();
    const dateStr = now.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
    const timeStr = now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

    try {
      if (periodKey === "custom" && customRange) {
        const sensorId = alarms[0]?.sensor_id;
        if (sensorId) {
          const start = customRange.start.toISOString().slice(0, 10);
          const end   = customRange.end.toISOString().slice(0, 10);
          const params = new URLSearchParams({ period: "custom", start_date: start, end_date: end, format: fmt });
          await downloadReport(`/reports/download-period/${sensorId}?${params}`, `report_alarms_${start}_${end}.${fmt}`);
        } else {
          throw new Error("Нет данных для экспорта");
        }
      } else {
        const apiPeriod = PERIOD_API_MAP[periodKey] || "last_month";
        const sensorId = alarms[0]?.sensor_id;
        if (sensorId) {
          const params = new URLSearchParams({ period: apiPeriod, format: fmt });
          await downloadReport(`/reports/download-period/${sensorId}?${params}`, `report_alarms_${periodKey}.${fmt}`);
        } else {
          throw new Error("Нет данных для экспорта");
        }
      }

      const color = exportFmt === "pdf" ? "#ff5252" : "#01e676";
      setExportHistory(prev => [{
        label: `Журнал событий ${getPeriodDescription()}`,
        fmt: fmt.toUpperCase(),
        date: dateStr,
        time: timeStr,
        color,
      }, ...prev]);
    } catch (err) {
      setExportError(err.message || "Ошибка экспорта");
    } finally {
      setExportLoading(false);
    }
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

        {loadError && (
          <div className="rp-error-banner">{loadError}</div>
        )}

        <div className="rp-card rp-table-card">
          <div className="rp-table-topbar">
            <h2 className="rp-card-title">
              Журнал событий
              {!loading && <span className="rp-alarm-count">{alarms.length}</span>}
            </h2>
            <div className="rp-table-controls">
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

                {/* Portal: рендерим панель прямо в document.body,
                    позицию вычисляем по координатам кнопки.
                    Это гарантирует, что никакой overflow/z-index родителя
                    не обрежет панель и она всегда будет поверх всех блоков. */}
                {filterOpen && <FilterPanel
                  anchorRef={filterRef}
                  onClose={() => setFilterOpen(false)}
                  filterIdRange={filterIdRange}
                  setFilterIdRange={setFilterIdRange}
                  filterSeverity={filterSeverity}
                  setFilterSeverity={setFilterSeverity}
                  filterType={filterType}
                  setFilterType={setFilterType}
                  filterStatus={filterStatus}
                  setFilterStatus={setFilterStatus}
                  activeFilters={activeFilters}
                  setPage={setPage}
                  onClearAll={() => {
                    setFilterSeverity(""); setFilterStatus(""); setFilterType("");
                    setFilterIdRange({ from: "", to: "" }); setPage(1);
                  }}
                />}
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
            {loading && (
              <div className="rp-empty-state">Загрузка событий...</div>
            )}
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
                  <div className="rp-td rp-td--gap">
                    <IconMessage />
                    {typeLabel}
                  </div>
                  <div className="rp-td" style={{ color: "#929292" }}>
                    #{row.sensor_id}
                  </div>
                  <div className="rp-td">
                    <DescriptionCell alarm={row} onUpdate={updateAlarm} />
                  </div>
                  <div className="rp-td">
                    <StatusPicker alarm={row} onUpdate={updateAlarm} />
                  </div>
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
          <div className="rp-card rp-export-card">
            <h2 className="rp-card-title">Экспортировать данные</h2>

            <div className="rp-format-row">
              <button className={`rp-format-btn ${exportFmt === "pdf" ? "rp-format-btn--active" : ""}`}
                onClick={() => setExportFmt("pdf")}>
                <IconPDF />
                <span>PDF формат</span>
              </button>
              <button className={`rp-format-btn ${exportFmt === "excel" ? "rp-format-btn--active rp-format-btn--excel" : ""}`}
                onClick={() => setExportFmt("excel")}>
                <IconExcel />
                <span>Excel формат</span>
              </button>
            </div>

            <div className="rp-filter-label" style={{ marginTop: 4 }}>Период</div>
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
              <div style={{ fontSize: "12px", color: "#ff5252" }}>{exportError}</div>
            )}

            <button className="rp-export-btn" onClick={handleExport} disabled={exportLoading}>
              <IconDownload />
              <span>{exportLoading ? "Загрузка..." : `Экспортировать  ${exportFmt.toUpperCase()}`}</span>
            </button>
          </div>

          <div className="rp-card rp-history-card">
            <h2 className="rp-card-title">История экспорта</h2>
            {exportHistory.length === 0 && (
              <div className="rp-empty-state" style={{ marginTop: 16 }}>Нет истории</div>
            )}
            <ul className="rp-history-list">
              {exportHistory.map((item, i) => (
                <li key={i} className="rp-history-item">
                  <div className="rp-history-timeline">
                    <span className="rp-history-dot" style={{ background: item.color }}/>
                    {i < exportHistory.length - 1 && <span className="rp-history-line"/>}
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