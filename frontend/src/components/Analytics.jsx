// frontend/src/components/Analytics.jsx
// ─── Аналитика с реальными данными из API ────────────────────────────────────
//
// Изменения по сравнению со старой версией:
//   1. Список датчиков и локаций загружается из API
//   2. График строится по реальной телеметрии
//   3. Кнопка "Скачать" вызывает реальный endpoint /reports/download-period/

import React, { useState, useRef, useEffect } from "react";
import "./Analytics.css";
import { useAnalyticsData } from "../hooks/useAnalyticsData";
import { downloadPeriodReport, downloadRangeReport, PERIOD_MAP } from "../services/reportsService";

// ── Icons (без изменений) ──────────────────────────────────────────────────
const IconDownloadArrow = ({ color = "#ffc207" }) => (
  <svg width="18" height="20" viewBox="0 0 20 22" fill="none">
    <path d="M10 2v13M10 15l-5-5M10 15l5-5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="2" y1="20" x2="18" y2="20" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);
const IconChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 6l4 4 4-4" stroke="#929292" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
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
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <line x1="4" y1="4" x2="12" y2="12" stroke="#929292" strokeWidth="1.6" strokeLinecap="round"/>
    <line x1="12" y1="4" x2="4" y2="12" stroke="#929292" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);
const IconSensor = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="3" fill="#ffc207" fillOpacity="0.3" stroke="#ffc207" strokeWidth="1.3"/>
    <circle cx="8" cy="8" r="1.5" fill="#ffc207"/>
    <path d="M4 4a5.66 5.66 0 0 0 0 8M12 4a5.66 5.66 0 0 1 0 8" stroke="#ffc207" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);
const IconLocation = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 1.5a4.5 4.5 0 0 1 4.5 4.5c0 3.5-4.5 8.5-4.5 8.5S3.5 9.5 3.5 6A4.5 4.5 0 0 1 8 1.5z" stroke="#07bcd4" strokeWidth="1.3" fill="#07bcd4" fillOpacity="0.15"/>
    <circle cx="8" cy="6" r="1.5" fill="#07bcd4"/>
  </svg>
);
const IconXLS = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
    <rect x="6" y="3" width="24" height="30" rx="2.5" fill="#1a1a1a" stroke="#01e676" strokeWidth="1.4"/>
    <path d="M30 3l8 8h-8V3z" fill="#01e676" fillOpacity="0.5"/>
    <text x="22" y="41" textAnchor="middle" fill="#01e676" fontSize="8" fontFamily="Inter, sans-serif" fontWeight="700">XLSX</text>
  </svg>
);
const IconPDF = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
    <rect x="6" y="3" width="24" height="30" rx="2.5" fill="#1a1a1a" stroke="#ff5252" strokeWidth="1.4"/>
    <path d="M30 3l8 8h-8V3z" fill="#ff5252" fillOpacity="0.5"/>
    <text x="22" y="41" textAnchor="middle" fill="#ff5252" fontSize="8" fontFamily="Inter, sans-serif" fontWeight="700">PDF</text>
  </svg>
);

// ── Периоды ───────────────────────────────────────────────────────────────────
const PERIODS = [
  { key: "day",   label: "День" },
  { key: "week",  label: "Нед" },
  { key: "month", label: "Мес" },
  { key: "year",  label: "Год" },
];
const PERIOD_LABELS_FULL = { day: "день", week: "неделю", month: "месяц", year: "год" };
const MONTH_LABELS = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];

const getLabels = (period) => {
  if (period === "day")   return Array.from({length:24},(_,i)=>`${i}:00`).filter((_,i)=>i%3===0);
  if (period === "week")  return ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
  if (period === "month") return Array.from({length:30},(_,i)=>`${i+1}`).filter((_,i)=>i%4===0);
  return MONTH_LABELS;
};

// Заглушка графика когда нет реальных данных
const genFallback = (n) => Array.from({ length: n }, (_, i) => 20 + Math.sin(i / 2) * 5);

const FORMAT_CONFIG = {
  xlsx: { label: "Excel (XLSX)", icon: <IconXLS />, color: "#01e676", accentBg: "rgba(1,230,118,0.08)", borderColor: "#01e676", btnBg: "#1a1410" },
  pdf:  { label: "PDF",          icon: <IconPDF />, color: "#ff5252", accentBg: "rgba(255,82,82,0.08)",  borderColor: "#ff5252", btnBg: "#1a1010" },
};

// ── Chart ─────────────────────────────────────────────────────────────────────
const LineChart = ({ data, color, height = 130 }) => {
  if (!data || data.length < 2) return <div style={{height, background:"#111", borderRadius:8}}/>;
  const W = 520, H = height;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const step = W / (data.length - 1);
  const toY = v => H - 8 - ((v - min) / range) * (H - 20);
  const pts = data.map((v, i) => `${i * step},${toY(v)}`).join(" ");
  const fill = `0,${H} ${pts} ${(data.length-1)*step},${H}`;
  const gradId = `grad-${color.replace("#","")}`;
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={fill} fill={`url(#${gradId})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
      {data.map((v, i) => i % Math.ceil(data.length / 8) === 0 &&
        <circle key={i} cx={i*step} cy={toY(v)} r="3.5" fill={color} fillOpacity="0.9"/>
      )}
    </svg>
  );
};

// ── Dropdown ──────────────────────────────────────────────────────────────────
const Dropdown = ({ icon, options, value, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const current = options.find(o => o.value === value);
  return (
    <div className="an-dropdown" ref={ref}>
      <button className="an-dropdown-btn" onClick={() => setOpen(o => !o)}>
        <span className="an-dropdown-icon">{icon}</span>
        <span className="an-dropdown-text">
          {current ? current.label : <span className="an-dropdown-placeholder">{placeholder}</span>}
        </span>
        {value && (
          <span className="an-dropdown-clear" onClick={e => { e.stopPropagation(); onChange(null); }}>
            <IconClose />
          </span>
        )}
        <IconChevronDown />
      </button>
      {open && (
        <div className="an-dropdown-menu">
          {options.length === 0 && <div style={{padding:"12px 14px", color:"#555", fontSize:"13px"}}>Нет данных</div>}
          {options.map(o => (
            <button key={o.value}
              className={`an-dropdown-item ${value === o.value ? "an-dropdown-item--active" : ""}`}
              onClick={() => { onChange(o.value); setOpen(false); }}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── DatePickerModal ───────────────────────────────────────────────────────────
const DatePickerModal = ({ onClose, onApply }) => {
  const [from, setFrom] = useState("");
  const [to, setTo]     = useState("");
  return (
    <div className="an-overlay" onClick={onClose}>
      <div className="an-modal" onClick={e => e.stopPropagation()}>
        <div className="an-modal-header">
          <span className="an-modal-title">Произвольный период</span>
          <button className="an-modal-close" onClick={onClose}><IconClose /></button>
        </div>
        <div className="an-modal-body">
          <div className="an-modal-fields">
            <div className="an-modal-field">
              <label className="an-modal-label">От</label>
              <input className="an-modal-input" type="date" value={from} onChange={e=>setFrom(e.target.value)}/>
            </div>
            <div className="an-modal-field">
              <label className="an-modal-label">До</label>
              <input className="an-modal-input" type="date" value={to} onChange={e=>setTo(e.target.value)}/>
            </div>
          </div>
        </div>
        <div className="an-modal-footer">
          <button className="an-btn-cancel" onClick={onClose}>Отмена</button>
          <button className="an-btn-save" onClick={()=>{ if(from&&to){ onApply(from,to); onClose(); } }}>Применить</button>
        </div>
      </div>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
export const Analytics = () => {
  const {
    sensorOptions,
    locationOptions,
    history,
    histLoading,
    loading,
    fetchHistory,
  } = useAnalyticsData();

  const [filterSensor,   setFilterSensor]   = useState(null);
  const [filterLocation, setFilterLocation] = useState(null);
  const [chartPeriod,    setChartPeriod]    = useState("month");
  const [customRange,    setCustomRange]    = useState(null);
  const [showCal,        setShowCal]        = useState(false);
  const [exportFormat,   setExportFormat]   = useState("xlsx");
  const [exportHistory,  setExportHistory]  = useState([]);
  const [exportLoading,  setExportLoading]  = useState(false);
  const [exportError,    setExportError]    = useState("");

  const labels = getLabels(chartPeriod);

  // Когда выбран датчик — загружаем его историю
  useEffect(() => {
    if (filterSensor) {
      const apiPeriod = PERIOD_MAP[chartPeriod] || "30d";
      if (customRange) {
        fetchHistory(Number(filterSensor), {
          period: null,
          dateFrom: customRange.from + "T00:00:00",
          dateTo:   customRange.to   + "T23:59:59",
        });
      } else {
        fetchHistory(Number(filterSensor), { period: apiPeriod });
      }
    }
  }, [filterSensor, chartPeriod, customRange, fetchHistory]);

  // Данные для графика: реальные если загружены, иначе заглушка
  const periodCounts = { day: 24, week: 7, month: 30, year: 12 };
  const n = periodCounts[chartPeriod];
  const chartTemp = history.temp.length > 0 ? history.temp : genFallback(n);
  const chartHum  = history.hum.length  > 0 ? history.hum  : genFallback(n);

  const currentFmt = FORMAT_CONFIG[exportFormat];

  const periodLabel = customRange
    ? `${customRange.from} – ${customRange.to}`
    : PERIOD_LABELS_FULL[chartPeriod];

  const exportContextPeriod = customRange
    ? `${customRange.from} – ${customRange.to}`
    : { day: "День", week: "Неделя", month: "Месяц", year: "Год" }[chartPeriod];

  const sensorLabel = filterSensor
    ? sensorOptions.find(s => s.value === filterSensor)?.label
    : null;

  // ─── Экспорт ────────────────────────────────────────────────────────────────

  const doExport = async () => {
    if (!filterSensor) {
      setExportError("Выберите датчик для экспорта");
      return;
    }
    setExportError("");
    setExportLoading(true);
    const now = new Date();
    const dateStr = now.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
    const timeStr = now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

    try {
      if (customRange) {
        await downloadRangeReport(
          Number(filterSensor),
          customRange.from + "T00:00:00",
          customRange.to   + "T23:59:59",
          exportFormat
        );
      } else {
        await downloadPeriodReport(
          Number(filterSensor),
          PERIOD_MAP[chartPeriod] || "30d",
          exportFormat
        );
      }

      setExportHistory(prev => [{
        label:  `Отчёт за ${periodLabel}${sensorLabel ? ", " + sensorLabel.split(" ")[0] : ""}`,
        format: currentFmt.label,
        color:  currentFmt.color,
        date:   dateStr,
        time:   timeStr,
      }, ...prev]);
    } catch (err) {
      setExportError(err.message || "Ошибка экспорта");
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="an-container">
      <main className="an-main">
        <div className="an-page-header">
          <h1 className="an-page-title">Аналитика и архив</h1>
          <p className="an-page-sub">Визуализация данных и экспорт отчётов</p>
        </div>

        {/* ── Filter bar ── */}
        <div className="an-filter-bar">
          <div className="an-filter-label">Фильтр данных:</div>
          <Dropdown
            icon={<IconSensor />}
            placeholder={loading ? "Загрузка..." : "Выбрать датчик"}
            options={sensorOptions}
            value={filterSensor}
            onChange={setFilterSensor}
          />
          <Dropdown
            icon={<IconLocation />}
            placeholder={loading ? "Загрузка..." : "Выбрать локацию"}
            options={locationOptions}
            value={filterLocation}
            onChange={setFilterLocation}
          />
          {(filterSensor || filterLocation) && (
            <button className="an-filter-reset" onClick={() => { setFilterSensor(null); setFilterLocation(null); }}>
              Сбросить
            </button>
          )}
          {histLoading && <span style={{fontSize:"12px", color:"#929292"}}>Загрузка данных...</span>}
        </div>

        {/* ── Charts ── */}
        <div className="an-charts-row">
          {/* Temperature */}
          <div className="an-card an-chart-card">
            <div className="an-chart-header">
              <div>
                <h2 className="an-card-title">Температура</h2>
                <p className="an-chart-sub">
                  {filterSensor
                    ? sensorOptions.find(s => s.value === filterSensor)?.label
                    : filterLocation
                      ? locationOptions.find(l => l.value === filterLocation)?.label
                      : "Все датчики"}
                </p>
              </div>
              <div className="an-period-bar">
                {PERIODS.map(p => (
                  <button key={p.key}
                    className={`an-period-btn ${chartPeriod === p.key && !customRange ? "an-period-btn--active" : ""}`}
                    onClick={() => { setChartPeriod(p.key); setCustomRange(null); }}>
                    {p.label}
                  </button>
                ))}
                <button
                  className={`an-period-btn an-period-btn--cal ${customRange ? "an-period-btn--active" : ""}`}
                  onClick={() => setShowCal(true)} title="Произвольный период">
                  <IconCalendar />
                </button>
              </div>
            </div>
            <div className="an-chart-labels">{labels.map(l => <span key={l}>{l}</span>)}</div>
            <div className="an-chart-area">
              <LineChart data={chartTemp} color="#07bcd4" />
            </div>
          </div>

          {/* Humidity */}
          <div className="an-card an-chart-card">
            <div className="an-chart-header">
              <div>
                <h2 className="an-card-title">Влажность</h2>
                <p className="an-chart-sub">
                  {filterSensor
                    ? sensorOptions.find(s => s.value === filterSensor)?.label
                    : filterLocation
                      ? locationOptions.find(l => l.value === filterLocation)?.label
                      : "Все датчики"}
                </p>
              </div>
              <div className="an-period-bar">
                {PERIODS.map(p => (
                  <button key={p.key}
                    className={`an-period-btn ${chartPeriod === p.key && !customRange ? "an-period-btn--active" : ""}`}
                    onClick={() => { setChartPeriod(p.key); setCustomRange(null); }}>
                    {p.label}
                  </button>
                ))}
                <button
                  className={`an-period-btn an-period-btn--cal ${customRange ? "an-period-btn--active" : ""}`}
                  onClick={() => setShowCal(true)} title="Произвольный период">
                  <IconCalendar />
                </button>
              </div>
            </div>
            <div className="an-chart-labels">{labels.map(l => <span key={l}>{l}</span>)}</div>
            <div className="an-chart-area">
              <LineChart data={chartHum} color="#ffc207" />
            </div>
          </div>
        </div>

        {/* ── Bottom row ── */}
        <div className="an-bottom-row">
          {/* Export card */}
          <div className="an-card an-export-card">
            <h2 className="an-card-title">Экспортировать данные</h2>
            <div className="an-export-context">
              <div className="an-export-context-row">
                <IconSensor />
                <span className="an-export-context-key">Датчик:</span>
                <span className="an-export-context-val">{sensorLabel || "Не выбран"}</span>
              </div>
              <div className="an-export-context-row">
                <IconLocation />
                <span className="an-export-context-key">Локация:</span>
                <span className="an-export-context-val">
                  {filterLocation ? locationOptions.find(l => l.value === filterLocation)?.label : "Все локации"}
                </span>
              </div>
              <div className="an-export-context-row">
                <IconCalendar />
                <span className="an-export-context-key">Период:</span>
                <span className="an-export-context-val">{exportContextPeriod}</span>
              </div>
            </div>

            <div className="an-format-row">
              {Object.entries(FORMAT_CONFIG).map(([key, cfg]) => (
                <button key={key}
                  className={`an-format-btn ${exportFormat === key ? "an-format-btn--active" : ""}`}
                  style={exportFormat === key ? { borderColor: cfg.borderColor, backgroundColor: cfg.accentBg, color: cfg.color } : {}}
                  onClick={() => setExportFormat(key)}>
                  {cfg.icon}
                  <span>{cfg.label}</span>
                </button>
              ))}
            </div>

            {exportError && (
              <div style={{ fontSize:"12px", color:"#ff5252", padding:"4px 0" }}>{exportError}</div>
            )}

            <button
              className="an-export-btn"
              style={{ borderColor: currentFmt.color, color: currentFmt.color, backgroundColor: currentFmt.btnBg, opacity: exportLoading ? 0.7 : 1 }}
              onClick={doExport}
              disabled={exportLoading}
            >
              <IconDownloadArrow color={currentFmt.color} />
              <span>{exportLoading ? "Загрузка..." : `Скачать  ${currentFmt.label}`}</span>
            </button>
          </div>

          {/* History card */}
          <div className="an-card an-history-card">
            <h2 className="an-card-title">История экспорта</h2>
            {exportHistory.length === 0 ? (
              <p className="an-history-empty">Нет скачанных отчётов</p>
            ) : (
              <ul className="an-history-list">
                {exportHistory.map((item, i) => (
                  <li key={i} className="an-history-item">
                    <div className="an-history-timeline">
                      <span className="an-history-dot" style={{ background: item.color }} />
                      {i < exportHistory.length - 1 && <span className="an-history-line" />}
                    </div>
                    <div className="an-history-text">
                      <span className="an-history-label">
                        {item.label}
                        <span className="an-history-badge" style={{ background: `${item.color}22`, color: item.color }}>
                          {item.format}
                        </span>
                      </span>
                      <span className="an-history-meta">{item.date} в {item.time}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>

      {showCal && (
        <DatePickerModal
          onClose={() => setShowCal(false)}
          onApply={(from, to) => { setCustomRange({ from, to }); }}
        />
      )}
    </div>
  );
};

export default Analytics;