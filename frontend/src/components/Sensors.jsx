import React, { useState } from "react";
import "./Sensors.css";

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconBattery = () => (
  <svg width="28" height="14" viewBox="0 0 28 14" fill="none">
    <rect x="1" y="2" width="23" height="10" rx="2" stroke="white" strokeWidth="1.5"/>
    <rect x="2.5" y="3.5" width="18" height="7" rx="1" fill="#01e676"/>
    <rect x="24" y="4.5" width="3" height="5" rx="1" fill="white" fillOpacity="0.6"/>
  </svg>
);

const IconSearch = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="7" stroke="#929292" strokeWidth="1.8"/>
    <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="#929292" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const IconPlus = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <line x1="9" y1="2" x2="9" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <line x1="2" y1="9" x2="16" y2="9" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const IconPlusSmall = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <line x1="8" y1="2" x2="8" y2="14" stroke="#929292" strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="2" y1="8" x2="14" y2="8" stroke="#929292" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const IconPencil = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M11.5 2.5l2 2L5 13H3v-2L11.5 2.5z" stroke="#929292" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconSort = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M7 4v12M7 16l-3-3M7 16l3-3M13 16V4M13 4l-3 3M13 4l3 3" stroke="#929292" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconSortAsc = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 4v12M10 4l-3 3M10 4l3 3" stroke="#ffc207" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconSortDesc = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 16V4M10 16l-3-3M10 16l3-3" stroke="#ffc207" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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

const IconThermometer = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="6" y="1" width="4" height="9" rx="2" stroke="#ffc207" strokeWidth="1.2"/>
    <circle cx="8" cy="12" r="3" fill="#ffc207" fillOpacity="0.3" stroke="#ffc207" strokeWidth="1.2"/>
    <rect x="7" y="6" width="2" height="5" fill="#ffc207"/>
  </svg>
);

const IconDrop = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 2C8 2 3 7.5 3 10.5a5 5 0 0010 0C13 7.5 8 2 8 2z" fill="#07bcd4" fillOpacity="0.3" stroke="#07bcd4" strokeWidth="1.2"/>
  </svg>
);

const IconCalendar = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="1.5" y="3" width="13" height="11" rx="2" stroke="#929292" strokeWidth="1.3"/>
    <line x1="5" y1="1.5" x2="5" y2="4.5" stroke="#929292" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="11" y1="1.5" x2="11" y2="4.5" stroke="#929292" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="1.5" y1="7" x2="14.5" y2="7" stroke="#929292" strokeWidth="1.3"/>
  </svg>
);

const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <line x1="4" y1="4" x2="14" y2="14" stroke="#929292" strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="14" y1="4" x2="4" y2="14" stroke="#929292" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const IconGSM = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="10" width="2.5" height="4" rx="0.5" fill="#01e676"/>
    <rect x="6" y="7" width="2.5" height="7" rx="0.5" fill="#01e676"/>
    <rect x="10" y="4" width="2.5" height="10" rx="0.5" fill="#929292"/>
    <rect x="14" y="1" width="0.5" height="13" rx="0.25" fill="#929292" fillOpacity="0.3"/>
  </svg>
);

const IconPower = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 2v5M5 4a5 5 0 1 0 6 0" stroke="#01e676" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

const IconSim = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="3" y="1.5" width="10" height="13" rx="2" stroke="#ffc207" strokeWidth="1.3"/>
    <rect x="5.5" y="6" width="2" height="2" rx="0.5" fill="#ffc207"/>
    <rect x="8.5" y="6" width="2" height="2" rx="0.5" fill="#ffc207"/>
    <rect x="5.5" y="9" width="2" height="2" rx="0.5" fill="#ffc207"/>
    <rect x="8.5" y="9" width="2" height="2" rx="0.5" fill="#ffc207"/>
    <path d="M6 1.5V4h4V1.5" stroke="#ffc207" strokeWidth="1.3"/>
  </svg>
);

// ── Sparkline ─────────────────────────────────────────────────────────────────
const Sparkline = ({ color = "#ffc207", data, thresholds }) => {
  const h = 80;
  const w = 220;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = w / (data.length - 1);
  const pts = data.map((v, i) => `${i * stepX},${h - ((v - min) / range) * (h - 8) - 4}`).join(" ");
  const fillPts = `0,${h} ${pts} ${(data.length - 1) * stepX},${h}`;

  const toY = (val) => h - ((val - min) / range) * (h - 8) - 4;

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={fillPts} fill={`url(#sg-${color.replace("#","")})`}/>
      {thresholds?.tempMax && toY(thresholds.tempMax) > 0 && toY(thresholds.tempMax) < h && (
        <line x1="0" y1={toY(thresholds.tempMax)} x2={w} y2={toY(thresholds.tempMax)} stroke="#ff5252" strokeWidth="1" strokeDasharray="4,3" opacity="0.7"/>
      )}
      {thresholds?.tempAlert && toY(thresholds.tempAlert) > 0 && toY(thresholds.tempAlert) < h && (
        <line x1="0" y1={toY(thresholds.tempAlert)} x2={w} y2={toY(thresholds.tempAlert)} stroke="#ffd550" strokeWidth="1" strokeDasharray="4,3" opacity="0.7"/>
      )}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  );
};

// ── Data ──────────────────────────────────────────────────────────
const LOCATIONS = ["Все датчики", "ПХ №1", "ПХ №2", "ПХ №7", "Хозяйственный блок", "Зона брака", "ПХ №6"];
const LOCATION_OPTIONS = LOCATIONS.filter(l => l !== "Все датчики");

const generatePeriodData = (base, count) =>
  Array.from({ length: count }, (_, i) => +(base + (Math.random() - 0.5) * 6).toFixed(1));

const SENSORS_DATA_INIT = [
  {
    id: "0001", name: "Д1",
    temp: 22.8, humidity: 58,
    statusKey: "ok",
    location: "ПХ №1",
    battery: "98%", power: "Сеть", gsm: "Хорошо", simBalance: "₸ 450",
    updated: "2 мин назад",
    thresholds: { tempMin: 15, tempMax: 30, tempAlert: 28, tempWarn: 25 },
    dayData:   generatePeriodData(22.8, 24),
    weekData:  generatePeriodData(22.8, 7),
    monthData: generatePeriodData(22.8, 30),
    humDayData:   generatePeriodData(58, 24),
    humWeekData:  generatePeriodData(58, 7),
    humMonthData: generatePeriodData(58, 30),
  },
  {
    id: "0002", name: "Д2",
    temp: 20.2, humidity: 72,
    statusKey: "error",
    location: "ПХ №1",
    battery: "34%", power: "Батарея", gsm: "Слабый", simBalance: "₸ 12",
    updated: "3 ч назад",
    thresholds: { tempMin: 18, tempMax: 28, tempAlert: 26, tempWarn: 24 },
    dayData:   generatePeriodData(20.2, 24),
    weekData:  generatePeriodData(20.2, 7),
    monthData: generatePeriodData(20.2, 30),
    humDayData:   generatePeriodData(72, 24),
    humWeekData:  generatePeriodData(72, 7),
    humMonthData: generatePeriodData(72, 30),
  },
  {
    id: "0003", name: "Д3",
    temp: 35.5, humidity: 45,
    statusKey: "warn",
    location: "ПХ №7",
    battery: "76%", power: "Сеть", gsm: "Хорошо", simBalance: "₸ 230",
    updated: "1 мин назад",
    thresholds: { tempMin: 20, tempMax: 40, tempAlert: 38, tempWarn: 35 },
    dayData:   generatePeriodData(35.5, 24),
    weekData:  generatePeriodData(35.5, 7),
    monthData: generatePeriodData(35.5, 30),
    humDayData:   generatePeriodData(45, 24),
    humWeekData:  generatePeriodData(45, 7),
    humMonthData: generatePeriodData(45, 30),
  },
  {
    id: "0004", name: "Д4",
    temp: 60.2, humidity: 30,
    statusKey: "ok",
    location: "ПХ №7",
    battery: "98%", power: "Сеть", gsm: "Хорошо", simBalance: "₸ 550",
    updated: "1 мин назад",
    thresholds: { tempMin: 50, tempMax: 70, tempAlert: 68, tempWarn: 65 },
    dayData:   generatePeriodData(60.2, 24),
    weekData:  generatePeriodData(60.2, 7),
    monthData: generatePeriodData(60.2, 30),
    humDayData:   generatePeriodData(30, 24),
    humWeekData:  generatePeriodData(30, 7),
    humMonthData: generatePeriodData(30, 30),
  },
  {
    id: "0005", name: "Д5",
    temp: 22.8, humidity: 65,
    statusKey: "ok",
    location: "ПХ №3",
    battery: "88%", power: "Сеть", gsm: "Хорошо", simBalance: "₸ 380",
    updated: "3 мин назад",
    thresholds: { tempMin: 15, tempMax: 30, tempAlert: 28, tempWarn: 25 },
    dayData:   generatePeriodData(22.8, 24),
    weekData:  generatePeriodData(22.8, 7),
    monthData: generatePeriodData(22.8, 30),
    humDayData:   generatePeriodData(65, 24),
    humWeekData:  generatePeriodData(65, 7),
    humMonthData: generatePeriodData(65, 30),
  },
];

const STATUS_STYLE = {
  ok:    { color: "#01e676", bg: "#19282b", label: "Нормально" },
  error: { color: "#ff5252", bg: "#321c1b", label: "Проблема"  },
  warn:  { color: "#ffd550", bg: "#312c1c", label: "Предупреждение" },
};

const EMPTY_FORM = {
  name: "", location: LOCATION_OPTIONS[0],
  tempMin: "", tempMax: "", tempAlert: "", tempWarn: "",
};

// ── Add/Edit Modal ────────────────────────────────────────────────
const SensorModal = ({ mode, initial, onClose, onSave }) => {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="sn-overlay" onClick={onClose}>
      <div className="sn-modal" onClick={e => e.stopPropagation()}>
        <div className="sn-modal-header">
          <h3 className="sn-modal-title">
            {mode === "add" ? "Добавить датчик" : "Редактировать пороговые значения"}
          </h3>
          <button className="sn-modal-close" onClick={onClose}><IconClose /></button>
        </div>

        <div className="sn-modal-body">
          {mode === "add" && (
            <>
              <div className="sn-field">
                <label className="sn-field-label">Название датчика</label>
                <input className="sn-field-input" value={form.name} onChange={e => set("name", e.target.value)} placeholder="Например: Д6"/>
              </div>
              <div className="sn-field">
                <label className="sn-field-label">Местоположение</label>
                <select className="sn-field-select" value={form.location} onChange={e => set("location", e.target.value)}>
                  {LOCATION_OPTIONS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            </>
          )}

          <div className="sn-modal-section-title">Пороговые значения температуры</div>
          <div className="sn-field-grid">
            <div className="sn-field">
              <label className="sn-field-label">Минимальная (°C)</label>
              <input className="sn-field-input" type="number" value={form.tempMin} onChange={e => set("tempMin", e.target.value)} placeholder="напр. 15"/>
            </div>
            <div className="sn-field">
              <label className="sn-field-label">Максимальная (°C)</label>
              <input className="sn-field-input" type="number" value={form.tempMax} onChange={e => set("tempMax", e.target.value)} placeholder="напр. 35"/>
            </div>
            <div className="sn-field">
              <label className="sn-field-label sn-field-label--alert">Тревога (°C)</label>
              <input className="sn-field-input sn-field-input--alert" type="number" value={form.tempAlert} onChange={e => set("tempAlert", e.target.value)} placeholder="напр. 32"/>
            </div>
            <div className="sn-field">
              <label className="sn-field-label sn-field-label--warn">Внимание (°C)</label>
              <input className="sn-field-input sn-field-input--warn" type="number" value={form.tempWarn} onChange={e => set("tempWarn", e.target.value)} placeholder="напр. 28"/>
            </div>
          </div>
        </div>

        <div className="sn-modal-footer">
          <button className="sn-btn-cancel" onClick={onClose}>Отмена</button>
          <button className="sn-btn-save" onClick={() => onSave(form)}>
            {mode === "add" ? "Добавить" : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Date Range Picker ─────────────────────────────────────────────
const DateRangePicker = ({ onClose, onApply }) => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  return (
    <div className="sn-overlay" onClick={onClose}>
      <div className="sn-modal sn-modal--sm" onClick={e => e.stopPropagation()}>
        <div className="sn-modal-header">
          <h3 className="sn-modal-title">Выбрать период</h3>
          <button className="sn-modal-close" onClick={onClose}><IconClose /></button>
        </div>
        <div className="sn-modal-body">
          <div className="sn-field-grid">
            <div className="sn-field">
              <label className="sn-field-label">От</label>
              <input className="sn-field-input" type="date" value={from} onChange={e => setFrom(e.target.value)}/>
            </div>
            <div className="sn-field">
              <label className="sn-field-label">До</label>
              <input className="sn-field-input" type="date" value={to} onChange={e => setTo(e.target.value)}/>
            </div>
          </div>
        </div>
        <div className="sn-modal-footer">
          <button className="sn-btn-cancel" onClick={onClose}>Отмена</button>
          <button className="sn-btn-save" onClick={() => { onApply(from, to); onClose(); }}>Применить</button>
        </div>
      </div>
    </div>
  );
};

// ── Sensor Detail Card ────────────────────────────────────────────
const SensorDetailCard = ({ sensor, onEdit, onAdd }) => {
  const [period, setPeriod] = useState("day");
  const [showCal, setShowCal] = useState(false);
  const [customLabel, setCustomLabel] = useState(null);

  const st = STATUS_STYLE[sensor.statusKey];
  const tempData = period === "week" ? sensor.weekData : period === "month" ? sensor.monthData : sensor.dayData;
  const humData  = period === "week" ? sensor.humWeekData : period === "month" ? sensor.humMonthData : sensor.humDayData;

  const periods = [
    { k: "day",   l: "День" },
    { k: "week",  l: "Нед" },
    { k: "month", l: "Мес" },
  ];

  return (
    <div className="sn-detail-card">
      {/* Card header */}
      <div className="sn-detail-card-top">
        <div className="sn-detail-card-name">
          <span className="sn-detail-sensor-id">{sensor.id}</span>
          <span className="sn-detail-sensor-name">{sensor.name}</span>
          <span className="sn-detail-sensor-loc">{sensor.location}</span>
        </div>
        <div className="sn-detail-card-actions">
          <div className="sn-status-badge" style={{ color: st.color, background: st.bg }}>
            <span className="sn-status-dot" style={{ background: st.color }}/>
            {st.label}
          </div>
          <button className="sn-icon-btn" title="Редактировать пороги" onClick={() => onEdit(sensor)}>
            <IconPencil />
          </button>
          <button className="sn-icon-btn" title="Добавить датчик" onClick={onAdd}>
            <IconPlusSmall />
          </button>
        </div>
      </div>

      {/* Values row */}
      <div className="sn-detail-values">
        <div className="sn-detail-val-item">
          <IconThermometer />
          <span className="sn-detail-val-num">{sensor.temp}°C</span>
          <span className="sn-detail-val-lbl">Температура</span>
        </div>
        <div className="sn-detail-val-divider"/>
        <div className="sn-detail-val-item">
          <IconDrop />
          <span className="sn-detail-val-num sn-detail-val-num--blue">{sensor.humidity}%</span>
          <span className="sn-detail-val-lbl">Влажность</span>
        </div>
      </div>

      {/* Period selector */}
      <div className="sn-period-row">
        <div className="sn-period-tabs">
          {periods.map(p => (
            <button
              key={p.k}
              className={`sn-period-tab ${period === p.k ? "sn-period-tab--active" : ""}`}
              onClick={() => { setPeriod(p.k); setCustomLabel(null); }}
            >
              {p.l}
            </button>
          ))}
          {customLabel && (
            <button className="sn-period-tab sn-period-tab--active">{customLabel}</button>
          )}
        </div>
        <button className="sn-icon-btn" title="Выбрать период" onClick={() => setShowCal(true)}>
          <IconCalendar />
        </button>
      </div>

      {/* Charts */}
      <div className="sn-detail-charts-row">
        <div className="sn-detail-chart-wrap">
          <div className="sn-detail-chart-label">Температура</div>
          <div className="sn-detail-chart">
            <Sparkline color="#ffc207" data={tempData} thresholds={sensor.thresholds} />
          </div>
        </div>
        <div className="sn-detail-chart-wrap">
          <div className="sn-detail-chart-label">Влажность</div>
          <div className="sn-detail-chart">
            <Sparkline color="#07bcd4" data={humData} />
          </div>
        </div>
      </div>

      {/* Info footer */}
      <div className="sn-detail-info-row">
        <div className="sn-detail-info-item">
          <IconPower />
          <span className="sn-detail-info-lbl">Питание</span>
          <span className="sn-detail-info-val">{sensor.power}</span>
        </div>
        <div className="sn-detail-info-item">
          <IconGSM />
          <span className="sn-detail-info-lbl">GSM</span>
          <span className="sn-detail-info-val">{sensor.gsm}</span>
        </div>
        <div className="sn-detail-info-item">
          <IconSim />
          <span className="sn-detail-info-lbl">SIM</span>
          <span className="sn-detail-info-val sn-detail-info-val--accent">{sensor.simBalance}</span>
        </div>
        <div className="sn-detail-info-item">
          <IconBattery />
          <span className="sn-detail-info-lbl">Батарея</span>
          <span className="sn-detail-info-val">{sensor.battery}</span>
        </div>
      </div>

      {showCal && (
        <DateRangePicker
          onClose={() => setShowCal(false)}
          onApply={(from, to) => {
            if (from && to) setCustomLabel(`${from} – ${to}`);
          }}
        />
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────
export const Sensors = () => {
  const [sensors, setSensors]             = useState(SENSORS_DATA_INIT);
  const [activeLocation, setActiveLocation] = useState("Все датчики");
  const [searchQuery, setSearchQuery]       = useState("");
  const [sortCol, setSortCol]               = useState(null);
  const [sortDir, setSortDir]               = useState("asc");
  const [currentPage, setCurrentPage]       = useState(1);
  const [showAddModal, setShowAddModal]     = useState(false);
  const [editSensor, setEditSensor]         = useState(null);
  const ROWS_PER_PAGE = 5;

  // Filter
  const filtered = sensors.filter(s => {
    const matchLoc = activeLocation === "Все датчики" || s.location === activeLocation;
    const q = searchQuery.toLowerCase().trim();
    const matchQ = !q
      || s.id.toLowerCase().includes(q)
      || s.name.toLowerCase().includes(q)
      || s.location.toLowerCase().includes(q);
    return matchLoc && matchQ;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (!sortCol) return 0;
    let av = a[sortCol], bv = b[sortCol];
    if (sortCol === "temp" || sortCol === "humidity") { av = parseFloat(av); bv = parseFloat(bv); }
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const paginated = sorted.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  const handleAdd = (form) => {
    const newSensor = {
      id: String(sensors.length + 1).padStart(4, "0"),
      name: form.name || `Д${sensors.length + 1}`,
      temp: 20.0,
      humidity: 50,
      statusKey: "ok",
      location: form.location,
      battery: "100%", power: "Сеть", gsm: "Хорошо", simBalance: "₸ 0",
      updated: "только что",
      thresholds: {
        tempMin: parseFloat(form.tempMin) || 10,
        tempMax: parseFloat(form.tempMax) || 40,
        tempAlert: parseFloat(form.tempAlert) || 35,
        tempWarn: parseFloat(form.tempWarn) || 30,
      },
      dayData:   generatePeriodData(20, 24),
      weekData:  generatePeriodData(20, 7),
      monthData: generatePeriodData(20, 30),
      humDayData:   generatePeriodData(50, 24),
      humWeekData:  generatePeriodData(50, 7),
      humMonthData: generatePeriodData(50, 30),
    };
    setSensors(prev => [...prev, newSensor]);
    setShowAddModal(false);
  };

  const handleEdit = (form) => {
    setSensors(prev => prev.map(s =>
      s.id === editSensor.id
        ? {
            ...s,
            thresholds: {
              tempMin: parseFloat(form.tempMin) || s.thresholds.tempMin,
              tempMax: parseFloat(form.tempMax) || s.thresholds.tempMax,
              tempAlert: parseFloat(form.tempAlert) || s.thresholds.tempAlert,
              tempWarn: parseFloat(form.tempWarn) || s.thresholds.tempWarn,
            }
          }
        : s
    ));
    setEditSensor(null);
  };

  const colDefs = [
    { key: "id",        label: "ID" },
    { key: "name",      label: "Имя" },
    { key: "temp",      label: "Температура" },
    { key: "humidity",  label: "Влажность" },
    { key: "updated",   label: "Обновлено" },
    { key: "statusKey", label: "Статус" },
    { key: "location",  label: "Местоположение" },
    { key: "battery",   label: "Батарея" },
  ];

  // Detail cards — show highlighted sensors (first 2 filtered, or first 2 overall)
  const detailSensors = (filtered.length > 0 ? filtered : sensors).slice(0, 2);

  return (
    <div className="sn-container">
      <main className="sn-main">
        {/* Page header */}
        <div className="sn-page-header">
          <div>
            <h1 className="sn-page-title">Датчики</h1>
            <p className="sn-page-sub">Мониторинг датчиков в реальном времени</p>
          </div>
        </div>

        {/* Location tabs */}
        <div className="sn-tabs">
          {LOCATIONS.map(loc => (
            <button
              key={loc}
              className={`sn-tab ${activeLocation === loc ? "sn-tab--active" : ""}`}
              onClick={() => { setActiveLocation(loc); setCurrentPage(1); }}
            >
              {loc}
            </button>
          ))}
        </div>

        {/* Detail cards */}
        <div className="sn-detail-row">
          {detailSensors.map(sensor => (
            <SensorDetailCard
              key={sensor.id}
              sensor={sensor}
              onEdit={(s) => setEditSensor(s)}
              onAdd={() => setShowAddModal(true)}
            />
          ))}
        </div>

        {/* Table section */}
        <div className="sn-card sn-table-card">
          <div className="sn-table-header">
            <h2 className="sn-card-title">Все датчики</h2>
            <div className="sn-table-controls">
              <div className="sn-search-box">
                <IconSearch />
                <input
                  className="sn-search-input"
                  placeholder="Поиск по ID, имени, месту..."
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                />
              </div>
              <button className="sn-add-btn" title="Добавить датчик" onClick={() => setShowAddModal(true)}>
                <IconPlus />
              </button>
            </div>
          </div>

          {/* Column headers */}
          <div className="sn-col-header">
            {colDefs.map(col => (
              <div
                key={col.key}
                className="sn-col-cell sn-col-cell--head"
                onClick={() => handleSort(col.key)}
              >
                <span>{col.label}</span>
                {sortCol === col.key
                  ? (sortDir === "asc" ? <IconSortAsc /> : <IconSortDesc />)
                  : <IconSort />
                }
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="sn-table-body">
            {paginated.length === 0 ? (
              <div className="sn-empty-row">Датчики не найдены</div>
            ) : paginated.map((sensor) => {
              const st = STATUS_STYLE[sensor.statusKey];
              return (
                <div key={sensor.id} className="sn-table-row">
                  <div className="sn-col-cell">{sensor.id}</div>
                  <div className="sn-col-cell">{sensor.name}</div>
                  <div className="sn-col-cell">
                    <IconThermometer />
                    {sensor.temp}°C
                  </div>
                  <div className="sn-col-cell">
                    <IconDrop />
                    {sensor.humidity}%
                  </div>
                  <div className="sn-col-cell sn-col-cell--dim">{sensor.updated}</div>
                  <div className="sn-col-cell">
                    <span className="sn-status-pill" style={{ color: st.color, background: st.bg }}>
                      {st.label}
                    </span>
                  </div>
                  <div className="sn-col-cell">{sensor.location}</div>
                  <div className="sn-col-cell">{sensor.battery}</div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="sn-pagination">
            <span className="sn-page-info">{sorted.length} датчиков</span>
            <button className="sn-page-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
              <IconChevLeft />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                className={`sn-page-num ${currentPage === p ? "sn-page-num--active" : ""}`}
                onClick={() => setCurrentPage(p)}
              >
                {p}
              </button>
            ))}
            <button className="sn-page-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
              <IconChevRight />
            </button>
          </div>
        </div>
      </main>

      {/* Modals */}
      {showAddModal && (
        <SensorModal
          mode="add"
          initial={EMPTY_FORM}
          onClose={() => setShowAddModal(false)}
          onSave={handleAdd}
        />
      )}
      {editSensor && (
        <SensorModal
          mode="edit"
          initial={{
            name: editSensor.name,
            location: editSensor.location,
            tempMin: editSensor.thresholds.tempMin,
            tempMax: editSensor.thresholds.tempMax,
            tempAlert: editSensor.thresholds.tempAlert,
            tempWarn: editSensor.thresholds.tempWarn,
          }}
          onClose={() => setEditSensor(null)}
          onSave={handleEdit}
        />
      )}
    </div>
  );
};

export default Sensors;