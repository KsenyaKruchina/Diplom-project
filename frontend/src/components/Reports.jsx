import React, { useState, useRef, useEffect } from "react";
import "./Reports.css";

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
const IconUser = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="4.5" r="2.5" stroke="#929292" strokeWidth="1.2"/>
    <path d="M2 12c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="#929292" strokeWidth="1.2" strokeLinecap="round"/>
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

// ── Data ──────────────────────────────────────────────────────────────────────
const STATUS_STYLE = {
  resolved: { label: "Устранено", color: "#01e676", bg: "#19282b" },
  active:   { label: "Активна",   color: "#ff5252", bg: "#321c1b" },
  inwork:   { label: "В работе",  color: "#ffd550", bg: "#312c1c" },
  done:     { label: "Выполнено", color: "#01e676", bg: "#19282b" },
};
const PRIORITY_STYLE = {
  high:   { label: "Высокая", color: "#ff5252" },
  medium: { label: "Средняя", color: "#ffd550" },
  low:    { label: "Низкая",  color: "#929292" },
};
const ALL_ASSIGNEES = [
  "Кручина Ксения",
  "Сибирцева Анастасия",
  "Курбанов Артур",
  "Петров Иван",
  "Мне (Я)",
];

const INITIAL_EVENTS = [
  { id: "0001", priority: "high",   eventType: "Высокая температура Д1",  assignee: "Кручина Ксения",      description: "Проблема возникла из-за перегрева системы охлаждения.",    status: "resolved", eventTime: "03/04/26 12:39", resolveTime: "03/04/26 12:34" },
  { id: "0002", priority: "medium", eventType: "Неисправность датчика Д3", assignee: "Сибирцева Анастасия", description: "Датчик не отвечает более 10 минут, требуется замена.",       status: "active",   eventTime: "03/04/26 12:40", resolveTime: "03/04/26 12:20" },
  { id: "0003", priority: "high",   eventType: "Отказ оборудования",       assignee: "Курбанов Артур",       description: "Полный отказ насосного агрегата №3.",                       status: "inwork",   eventTime: "03/04/26 12:05", resolveTime: "03/04/26 12:00" },
  { id: "0004", priority: "medium", eventType: "Обрыв связи",              assignee: "Кручина Ксения",      description: "Потеря связи с удалённым узлом на 15 минут.",              status: "done",     eventTime: "02/04/26 01:00", resolveTime: "02/04/26 00:20" },
  { id: "0005", priority: "low",    eventType: "Низкий заряд батареи",     assignee: "Сибирцева Анастасия", description: "Уровень заряда резервной батареи опустился ниже 20%.",      status: "done",     eventTime: "01/04/26 22:32", resolveTime: "01/04/26 22:30" },
];

const COLS = [
  { key: "id",          label: "ID" },
  { key: "priority",    label: "Критичность" },
  { key: "eventType",   label: "Тип события" },
  { key: "assignee",    label: "Исполнитель" },
  { key: "description", label: "Описание" },
  { key: "status",      label: "Статус" },
  { key: "eventTime",   label: "Время события" },
  { key: "resolveTime", label: "Время устранения" },
];

const PERIOD_OPTIONS = [
  { key: "1d",     label: "1 день" },
  { key: "1w",     label: "1 неделя" },
  { key: "1m",     label: "1 месяц" },
  { key: "1y",     label: "1 год" },
  { key: "custom", label: "Свой диапазон" },
];

// ── Dropdown helper (portal-style, fixed positioning) ─────────────────────────
function Dropdown({ trigger, children, open, setOpen, dropUp = false }) {
  const ref = useRef(null);
  const menuRef = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target) && menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [setOpen]);

  return (
    <div className="rp-dropdown-wrap" ref={ref}>
      <div onClick={() => setOpen(o => !o)}>{trigger}</div>
      {open && (
        <div className={`rp-dropdown-menu ${dropUp ? "rp-dropdown-menu--up" : ""}`} ref={menuRef}>
          {children}
        </div>
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

// ── Description Edit Modal ────────────────────────────────────────────────────
function DescriptionModal({ value, onSave, onClose }) {
  const [val, setVal] = useState(value);
  const textareaRef = useRef(null);

  useEffect(() => {
    textareaRef.current?.focus();
    // place cursor at end
    const len = val.length;
    textareaRef.current?.setSelectionRange(len, len);
  }, []);

  const handleSave = () => {
    onSave(val);
    onClose();
  };

  return (
    <div className="rp-modal-overlay" onClick={onClose}>
      <div className="rp-modal" onClick={e => e.stopPropagation()}>
        <div className="rp-modal-header">
          <h3 className="rp-modal-title">Редактировать описание</h3>
          <button className="rp-modal-close" onClick={onClose}><IconClose /></button>
        </div>
        <div className="rp-modal-body">
          <textarea
            ref={textareaRef}
            className="rp-desc-textarea"
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => { if (e.key === "Escape") onClose(); }}
            rows={5}
          />
        </div>
        <div className="rp-modal-footer">
          <button className="rp-btn-cancel" onClick={onClose}>Отмена</button>
          <button className="rp-btn-save" onClick={handleSave}>Сохранить</button>
        </div>
      </div>
    </div>
  );
}

// ── Assignee picker ───────────────────────────────────────────────────────────
function AssigneePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <Dropdown
      open={open} setOpen={setOpen}
      trigger={
        <span className="rp-assignee-trigger">
          <IconUser />
          <span className="rp-assignee-name">{value || "—"}</span>
          <IconChevDown />
        </span>
      }
    >
      {ALL_ASSIGNEES.map(a => (
        <div key={a} className={`rp-dropdown-item ${value === a ? "rp-dropdown-item--active" : ""}`}
          onClick={() => { onChange(a); setOpen(false); }}>
          {value === a && <IconCheck />}
          {a}
        </div>
      ))}
    </Dropdown>
  );
}

// ── Status picker ─────────────────────────────────────────────────────────────
function StatusPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const st = STATUS_STYLE[value];
  return (
    <Dropdown
      open={open} setOpen={setOpen}
      trigger={
        <span className="rp-status-pill rp-status-pill--clickable"
          style={{ color: st.color, background: st.bg }}>
          {st.label}
          <IconChevDown />
        </span>
      }
    >
      {Object.entries(STATUS_STYLE).map(([key, s]) => (
        <div key={key} className={`rp-dropdown-item ${value === key ? "rp-dropdown-item--active" : ""}`}
          onClick={() => { onChange(key); setOpen(false); }}
          style={{ color: s.color }}>
          {value === key && <IconCheck />}
          {s.label}
        </div>
      ))}
    </Dropdown>
  );
}

// ── Description cell with modal ───────────────────────────────────────────────
function DescriptionCell({ value, onSave }) {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <>
      <span
        className="rp-editable-cell"
        onClick={() => setModalOpen(true)}
        title="Нажмите для редактирования"
      >
        <IconEdit />
        <span>{value}</span>
      </span>
      {modalOpen && (
        <DescriptionModal
          value={value}
          onSave={onSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

// ── Calendar picker ───────────────────────────────────────────────────────────
function CalendarPicker({ value, onChange }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(value || today);
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

// ── Main Component ────────────────────────────────────────────────────────────
export const Reports = () => {
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterIdRange, setFilterIdRange] = useState({ from: "", to: "" });

  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

  const [exportFmt, setExportFmt] = useState("pdf");
  const [periodKey, setPeriodKey] = useState("1m");
  const [showCalendar, setShowCalendar] = useState(false);
  const [customRange, setCustomRange] = useState(null);

  const [page, setPage] = useState(1);
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [exportHistory, setExportHistory] = useState([
    { label: "Скачан журнал событий за месяц",     fmt: "PDF",  date: "05/04/2026", color: "#ff5252" },
    { label: "Скачан журнал событий за месяц",     fmt: "XLSX", date: "05/03/2026", color: "#01e676" },
    { label: "Скачан журнал событий за 6 месяцев", fmt: "PDF",  date: "05/01/2026", color: "#ff5252" },
    { label: "Скачан журнал событий за день",      fmt: "XLSX", date: "11/12/2025", color: "#01e676" },
  ]);

  // Close filter panel when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const ROWS_PER_PAGE = 5;

  const updateEvent = (id, field, value) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleSort = (key) => {
    if (sortCol === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(key); setSortDir("asc"); }
  };

  const filtered = events.filter(e => {
    if (search) {
      const q = search.toLowerCase();
      if (![e.id, e.eventType, e.description].some(v => v.toLowerCase().includes(q))) return false;
    }
    if (filterPriority && e.priority !== filterPriority) return false;
    if (filterAssignee && e.assignee !== filterAssignee) return false;
    if (filterStatus && e.status !== filterStatus) return false;
    if (filterIdRange.from && parseInt(e.id) < parseInt(filterIdRange.from)) return false;
    if (filterIdRange.to && parseInt(e.id) > parseInt(filterIdRange.to)) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!sortCol) return 0;
    const av = a[sortCol], bv = b[sortCol];
    return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const pageData = sorted.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const activeFilters = [
    filterPriority && { key: "priority", label: `Критичность: ${PRIORITY_STYLE[filterPriority]?.label}`, clear: () => setFilterPriority("") },
    filterAssignee && { key: "assignee", label: `Исполнитель: ${filterAssignee}`, clear: () => setFilterAssignee("") },
    filterStatus && { key: "status", label: `Статус: ${STATUS_STYLE[filterStatus]?.label}`, clear: () => setFilterStatus("") },
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

  const handleExport = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
    const label = `Скачан журнал событий ${getPeriodDescription()}`;
    const color = exportFmt === "pdf" ? "#ff5252" : "#01e676";
    setExportHistory(prev => [{ label, fmt: exportFmt.toUpperCase(), date: dateStr, color }, ...prev]);
  };

  const uniqueAssignees = [...new Set(events.map(e => e.assignee))];

  return (
    <div className="rp-container">
      <main className="rp-main">
        <h1 className="rp-page-title">Уведомления</h1>

        {/* ── Event log table ── */}
        <div className="rp-card rp-table-card">
          <div className="rp-table-topbar">
            <h2 className="rp-card-title">Журнал событий</h2>
            <div className="rp-table-controls">
              {/* Search */}
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

              {/* Filter toggle — fixed positioned panel */}
              <div className="rp-filter-wrap" ref={filterRef}>
                <button
                  className={`rp-filter-btn ${activeFilters.length ? "rp-filter-btn--active" : ""}`}
                  onClick={() => setFilterOpen(o => !o)}
                >
                  <IconFilter />
                  {activeFilters.length > 0 && <span className="rp-filter-badge">{activeFilters.length}</span>}
                </button>

                {filterOpen && (
                  <div className="rp-filter-panel-fixed">
                    <div className="rp-filter-section-title">Фильтрация</div>

                    {/* ID range */}
                    <div className="rp-filter-label">ID диапазон</div>
                    <div className="rp-filter-id-row">
                      <input className="rp-filter-id-input" placeholder="от" value={filterIdRange.from}
                        onChange={e => { setFilterIdRange(p => ({ ...p, from: e.target.value })); setPage(1); }} />
                      <span style={{ color: "#929292" }}>—</span>
                      <input className="rp-filter-id-input" placeholder="до" value={filterIdRange.to}
                        onChange={e => { setFilterIdRange(p => ({ ...p, to: e.target.value })); setPage(1); }} />
                    </div>

                    {/* Priority */}
                    <div className="rp-filter-label">Критичность</div>
                    <div className="rp-filter-options">
                      {Object.entries(PRIORITY_STYLE).map(([k, v]) => (
                        <div key={k} className={`rp-filter-option ${filterPriority === k ? "rp-filter-option--active" : ""}`}
                          style={{ color: filterPriority === k ? v.color : undefined }}
                          onClick={() => { setFilterPriority(p => p === k ? "" : k); setPage(1); }}>
                          {v.label}
                        </div>
                      ))}
                    </div>

                    {/* Assignee */}
                    <div className="rp-filter-label">Исполнитель</div>
                    <div className="rp-filter-options rp-filter-options--col">
                      {uniqueAssignees.map(a => (
                        <div key={a} className={`rp-filter-option ${filterAssignee === a ? "rp-filter-option--active" : ""}`}
                          onClick={() => { setFilterAssignee(p => p === a ? "" : a); setPage(1); }}>
                          {a}
                        </div>
                      ))}
                    </div>

                    {/* Status */}
                    <div className="rp-filter-label">Статус</div>
                    <div className="rp-filter-options rp-filter-options--col">
                      {Object.entries(STATUS_STYLE).map(([k, v]) => (
                        <div key={k} className={`rp-filter-option ${filterStatus === k ? "rp-filter-option--active" : ""}`}
                          style={{ color: filterStatus === k ? v.color : undefined }}
                          onClick={() => { setFilterStatus(p => p === k ? "" : k); setPage(1); }}>
                          {v.label}
                        </div>
                      ))}
                    </div>

                    {activeFilters.length > 0 && (
                      <button className="rp-filter-clear-all" onClick={() => {
                        setFilterPriority(""); setFilterAssignee(""); setFilterStatus("");
                        setFilterIdRange({ from: "", to: "" }); setPage(1);
                      }}>
                        Сбросить все
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilters.length > 0 && (
            <div className="rp-filter-chips">
              {activeFilters.map(f => <FilterChip key={f.key} label={f.label} onRemove={f.clear} />)}
            </div>
          )}

          {/* Column headers */}
          <div className="rp-col-header">
            {COLS.map(col => (
              <div key={col.key} className="rp-col-head" onClick={() => handleSort(col.key)}>
                <span>{col.label}</span>
                {["id","priority","status","eventTime","resolveTime"].includes(col.key) ? <IconSort /> : <IconSortAlt />}
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="rp-table-body">
            {pageData.length === 0 && (
              <div className="rp-empty-state">Нет событий, соответствующих фильтрам</div>
            )}
            {pageData.map((row) => {
              const pr = PRIORITY_STYLE[row.priority];
              return (
                <div key={row.id} className="rp-table-row">
                  <div className="rp-td">{row.id}</div>
                  <div className="rp-td" style={{ color: pr.color }}>{pr.label}</div>
                  <div className="rp-td rp-td--gap">
                    <IconMessage />
                    {row.eventType}
                  </div>
                  <div className="rp-td">
                    <AssigneePicker value={row.assignee} onChange={v => updateEvent(row.id, "assignee", v)} />
                  </div>
                  <div className="rp-td">
                    <DescriptionCell value={row.description} onSave={v => updateEvent(row.id, "description", v)} />
                  </div>
                  <div className="rp-td">
                    <StatusPicker value={row.status} onChange={v => updateEvent(row.id, "status", v)} />
                  </div>
                  <div className="rp-td">{row.eventTime}</div>
                  <div className="rp-td">{row.resolveTime}</div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="rp-pagination">
            <span className="rp-pagination-count">{filtered.length} записей</span>
            <button className="rp-page-btn" onClick={() => setPage(p => Math.max(1, p - 1))}><IconChevLeft /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`rp-page-num ${page === p ? "rp-page-num--active" : ""}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="rp-page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))}><IconChevRight /></button>
          </div>
        </div>

        {/* ── Bottom row ── */}
        <div className="rp-bottom-row">

          {/* Export panel */}
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
                  onClick={() => { setPeriodKey(p.key); setShowCalendar(false); }}>
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

            <button className="rp-export-btn" onClick={handleExport}>
              <IconDownload />
              <span>Экспортировать&nbsp;&nbsp;{exportFmt.toUpperCase()}</span>
            </button>
          </div>

          {/* Export history */}
          <div className="rp-card rp-history-card">
            <h2 className="rp-card-title">История экспорта</h2>
            {exportHistory.length === 0 && <div className="rp-empty-state" style={{ marginTop: 16 }}>Нет истории</div>}
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
                    <span className="rp-history-date">{item.date}</span>
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