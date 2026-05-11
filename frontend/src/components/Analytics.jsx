// frontend/src/components/Analytics.jsx
// ─── Аналитика с реальными данными из API ────────────────────────────────────

import React, { useState, useRef, useEffect, useCallback } from "react";
import "./Analytics.css";
import { useAnalyticsData } from "../hooks/useAnalyticsData";

// ── API helpers ───────────────────────────────────────────────────────────────

const API_BASE = "http://157.90.127.202:3000/api/v1";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

/** Получить текущего пользователя */
const fetchCurrentUser = async () => {
  const res = await fetch(`${API_BASE}/users/me`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Не удалось получить данные пользователя");
  return res.json();
};

/**
 * GET /api/v1/telemetry/{sensor_id}/history
 * Params: start_time, end_time (ISO strings), limit?
 */
const fetchSensorHistory = async (sensorId, startTime, endTime) => {
  const params = new URLSearchParams({ start_time: startTime, end_time: endTime });
  const res = await fetch(
    `${API_BASE}/telemetry/${sensorId}/history?${params}`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error(`Ошибка получения истории: ${res.status}`);
  return res.json(); // ожидаем массив { timestamp, temperature, humidity, ... }
};

/**
 * GET /api/v1/telemetry/{sensor_id}/last-24h
 */
const fetchSensorLast24h = async (sensorId) => {
  const res = await fetch(
    `${API_BASE}/telemetry/${sensorId}/last-24h`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error(`Ошибка получения данных за 24ч: ${res.status}`);
  return res.json();
};

/**
 * GET /api/v1/telemetry/{sensor_id}/latest
 */
const fetchSensorLatest = async (sensorId) => {
  const res = await fetch(
    `${API_BASE}/telemetry/${sensorId}/latest`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error(`Ошибка получения последних данных: ${res.status}`);
  return res.json();
};

/**
 * Скачать отчёт по произвольному endpoint.
 */
const downloadReport = async (url, fallbackName = "report.pdf") => {
  const res = await fetch(url, { headers: authHeaders() });
  if (res.status === 403) throw new Error("Нет доступа к этой сущности");
  if (!res.ok) throw new Error(`Ошибка сервера: ${res.status}`);

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename[^;=\n]*=["']?([^"';\n]+)["']?/i);
  const filename = match ? match[1].trim() : fallbackName;

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
};

/** Построить URL для скачивания отчёта */
const buildReportUrl = ({ reportType, entityId, period, customRange }) => {
  const endpointMap = {
    location:     `${API_BASE}/reports/download-events-location/${entityId}`,
    control_unit: `${API_BASE}/reports/download-events-control-unit/${entityId}`,
    sensor:       `${API_BASE}/reports/download-events-sensor/${entityId}`,
  };
  const base = endpointMap[reportType];
  if (!base) throw new Error("Неизвестный тип отчёта");

  const params = new URLSearchParams();
  if (customRange) {
    params.set("period", "custom");
    params.set("start_date", customRange.from);
    params.set("end_date", customRange.to);
  } else {
    params.set("period", period);
  }
  return `${base}?${params.toString()}`;
};

// ── Period helpers ────────────────────────────────────────────────────────────

const PERIOD_API_MAP = {
  day:   "last_24_hours",
  week:  "last_week",
  month: "last_month",
  year:  "last_year",
};

/**
 * Вычислить start_time / end_time для запроса истории по выбранному периоду
 */
const getPeriodRange = (period) => {
  const now = new Date();
  const end = now.toISOString();
  const starts = {
    day:   new Date(now - 24 * 60 * 60 * 1000).toISOString(),
    week:  new Date(now - 7  * 24 * 60 * 60 * 1000).toISOString(),
    month: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(),
    year:  new Date(now - 365* 24 * 60 * 60 * 1000).toISOString(),
  };
  return { start: starts[period] || starts.month, end };
};

const MONTH_LABELS = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
const PERIODS = [
  { key: "day",   label: "День" },
  { key: "week",  label: "Нед"  },
  { key: "month", label: "Мес"  },
  { key: "year",  label: "Год"  },
];

const getLabels = (period) => {
  if (period === "day")   return Array.from({length:24},(_,i)=>`${i}:00`).filter((_,i)=>i%3===0);
  if (period === "week")  return ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
  if (period === "month") return Array.from({length:30},(_,i)=>`${i+1}`).filter((_,i)=>i%4===0);
  return MONTH_LABELS;
};

const genFallback = (n) => Array.from({ length: n }, (_, i) => 20 + Math.sin(i / 2) * 5);

/**
 * Преобразовать массив телеметрии в массив значений для графика.
 * Делаем downsample до нужного кол-ва точек.
 * @param {Array} data    — массив объектов с полями timestamp + поле value
 * @param {string} field  — "temperature" | "humidity"
 * @param {number} points — желаемое кол-во точек на графике
 */
const extractChartData = (data, field, points) => {
  if (!data || data.length === 0) return [];

  // Фильтруем только записи с нужным полем
  const valid = data.filter(d => d[field] != null);
  if (valid.length === 0) return [];

  if (valid.length <= points) {
    return valid.map(d => d[field]);
  }

  // Downsample: берём равномерно распределённые точки
  const step = (valid.length - 1) / (points - 1);
  return Array.from({ length: points }, (_, i) => {
    const idx = Math.round(i * step);
    return valid[Math.min(idx, valid.length - 1)][field];
  });
};

// ── Icons ─────────────────────────────────────────────────────────────────────

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
const IconSensor = ({ color = "#ffc207" }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="3" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1.3"/>
    <circle cx="8" cy="8" r="1.5" fill={color}/>
    <path d="M4 4a5.66 5.66 0 0 0 0 8M12 4a5.66 5.66 0 0 1 0 8" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);
const IconLocation = ({ color = "#07bcd4" }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 1.5a4.5 4.5 0 0 1 4.5 4.5c0 3.5-4.5 8.5-4.5 8.5S3.5 9.5 3.5 6A4.5 4.5 0 0 1 8 1.5z" stroke={color} strokeWidth="1.3" fill={color} fillOpacity="0.15"/>
    <circle cx="8" cy="6" r="1.5" fill={color}/>
  </svg>
);
const IconControlUnit = ({ color = "#a78bfa" }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="4" width="12" height="8" rx="1.5" stroke={color} strokeWidth="1.3" fill={color} fillOpacity="0.1"/>
    <circle cx="5.5" cy="8" r="1" fill={color}/>
    <circle cx="8" cy="8" r="1" fill={color}/>
    <circle cx="10.5" cy="8" r="1" fill={color}/>
  </svg>
);
const IconPDF = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
    <rect x="6" y="3" width="24" height="30" rx="2.5" fill="#1a1a1a" stroke="#ff5252" strokeWidth="1.4"/>
    <path d="M30 3l8 8h-8V3z" fill="#ff5252" fillOpacity="0.5"/>
    <text x="22" y="41" textAnchor="middle" fill="#ff5252" fontSize="8" fontFamily="Inter, sans-serif" fontWeight="700">PDF</text>
  </svg>
);

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
          {options.length === 0 && (
            <div style={{padding:"12px 14px", color:"#555", fontSize:"13px"}}>Нет данных</div>
          )}
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
          <button
            className="an-btn-save"
            disabled={!from || !to}
            onClick={() => { if (from && to) { onApply(from, to); onClose(); } }}>
            Применить
          </button>
        </div>
      </div>
    </div>
  );
};

// ── LineChart ─────────────────────────────────────────────────────────────────
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

// ── Конфиг типов отчётов ──────────────────────────────────────────────────────
const REPORT_TYPES = [
  {
    key:         "location",
    label:       "По локации",
    placeholder: "Выбрать локацию",
    icon:        <IconLocation />,
    color:       "#07bcd4",
  },
  {
    key:         "control_unit",
    label:       "По ЦБУ",
    placeholder: "Выбрать ЦБУ",
    icon:        <IconControlUnit />,
    color:       "#a78bfa",
  },
  {
    key:         "sensor",
    label:       "По датчику",
    placeholder: "Выбрать датчик",
    icon:        <IconSensor />,
    color:       "#ffc207",
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────
export const Analytics = () => {
  const {
    sensorOptions,
    locationOptions,
    controlUnitOptions,
    loading,
  } = useAnalyticsData();

  // ── Chart state ──
  const [filterSensor,   setFilterSensor]   = useState(null);
  const [filterLocation, setFilterLocation] = useState(null);
  const [chartPeriod,    setChartPeriod]    = useState("month");
  const [customRange,    setCustomRange]    = useState(null);
  const [showCal,        setShowCal]        = useState(false);

  // ── Telemetry state ──
  const [chartTemp,    setChartTemp]    = useState([]);
  const [chartHum,     setChartHum]     = useState([]);
  const [histLoading,  setHistLoading]  = useState(false);
  const [histError,    setHistError]    = useState("");
  const [latestData,   setLatestData]   = useState(null); // { temperature, humidity, timestamp }

  // ── Export state ──
  const [reportType,     setReportType]     = useState("sensor");
  const [exportEntityId, setExportEntityId] = useState(null);
  const [exportPeriod,   setExportPeriod]   = useState("month");
  const [exportCustom,   setExportCustom]   = useState(null);
  const [showExportCal,  setShowExportCal]  = useState(false);
  const [exportHistory,  setExportHistory]  = useState([]);
  const [exportLoading,  setExportLoading]  = useState(false);
  const [exportError,    setExportError]    = useState("");

  // ── User / role ──
  const [currentUser, setCurrentUser] = useState(null);
  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    fetchCurrentUser().then(setCurrentUser).catch(() => {});
  }, []);

  // Синхронизируем период экспорта с периодом графика
  useEffect(() => {
    setExportPeriod(chartPeriod);
    setExportCustom(customRange);
  }, [chartPeriod, customRange]);

  // Сбросить выбранную сущность при смене типа отчёта
  useEffect(() => {
    setExportEntityId(null);
    setExportError("");
  }, [reportType]);

  // ── Загрузка телеметрии при выборе датчика / смене периода ──
  useEffect(() => {
    if (!filterSensor) {
      // Нет выбранного датчика — сбрасываем данные
      setChartTemp([]);
      setChartHum([]);
      setLatestData(null);
      setHistError("");
      return;
    }

    const load = async () => {
      setHistLoading(true);
      setHistError("");

      const periodCounts = { day: 24, week: 7, month: 30, year: 12 };
      const points = periodCounts[chartPeriod] || 30;

      try {
        let rawData;

        if (customRange) {
          // Произвольный диапазон — используем /history с start_time / end_time
          const startTime = `${customRange.from}T00:00:00`;
          const endTime   = `${customRange.to}T23:59:59`;
          rawData = await fetchSensorHistory(filterSensor, startTime, endTime);
        } else if (chartPeriod === "day") {
          // Последние 24 часа — специализированный endpoint
          rawData = await fetchSensorLast24h(filterSensor);
        } else {
          // Остальные периоды — /history с вычисленным диапазоном
          const { start, end } = getPeriodRange(chartPeriod);
          rawData = await fetchSensorHistory(filterSensor, start, end);
        }

        // Нормализуем: API может вернуть как массив, так и { data: [...] }
        const list = Array.isArray(rawData) ? rawData : (rawData?.data ?? []);

        setChartTemp(extractChartData(list, "temperature", points));
        setChartHum (extractChartData(list, "humidity",    points));

        // Последнее значение для подписи
        if (list.length > 0) {
          const last = list[list.length - 1];
          setLatestData({
            temperature: last.temperature ?? null,
            humidity:    last.humidity    ?? null,
            timestamp:   last.timestamp   ?? null,
          });
        }
      } catch (err) {
        setHistError(err.message || "Ошибка загрузки данных");
        setChartTemp([]);
        setChartHum([]);
      } finally {
        setHistLoading(false);
      }
    };

    load();
  }, [filterSensor, chartPeriod, customRange]);

  // При смене локации — сбрасываем датчик и данные
  useEffect(() => {
    setFilterSensor(null);
  }, [filterLocation]);

  // ── Опции для селектора экспорта с учётом роли ──
  const exportOptions = useCallback(() => {
    const userLocationId = currentUser?.location_id ?? null;

    const filterByLocation = (options) => {
      if (isAdmin || !userLocationId) return options;
      return options.filter(o => o.location_id === userLocationId);
    };

    if (reportType === "location") {
      if (!isAdmin && userLocationId) {
        return locationOptions.filter(o => o.value === String(userLocationId));
      }
      return locationOptions;
    }
    if (reportType === "control_unit") {
      return filterByLocation(controlUnitOptions || []);
    }
    return filterByLocation(sensorOptions);
  }, [reportType, isAdmin, currentUser, locationOptions, sensorOptions, controlUnitOptions]);

  const currentReportTypeCfg = REPORT_TYPES.find(r => r.key === reportType);

  const exportPeriodLabel = exportCustom
    ? `${exportCustom.from} – ${exportCustom.to}`
    : { day: "День", week: "Неделя", month: "Месяц", year: "Год" }[exportPeriod];

  const entityLabel = exportEntityId
    ? exportOptions().find(o => o.value === exportEntityId)?.label
    : null;

  // ── Экспорт ───────────────────────────────────────────────────────────────────
  const doExport = async () => {
    if (!exportEntityId) {
      setExportError(`Выберите ${currentReportTypeCfg.label.toLowerCase().replace("по ", "")}`);
      return;
    }
    setExportError("");
    setExportLoading(true);

    const now = new Date();
    const dateStr = now.toLocaleDateString("ru-RU", { day:"2-digit", month:"2-digit", year:"numeric" });
    const timeStr = now.toLocaleTimeString("ru-RU", { hour:"2-digit", minute:"2-digit" });

    try {
      const url = buildReportUrl({
        reportType,
        entityId:    exportEntityId,
        period:      PERIOD_API_MAP[exportPeriod] || "last_month",
        customRange: exportCustom,
      });

      const fallbackName = `report_${reportType}_${exportEntityId}_${now.toISOString().slice(0,10)}.pdf`;
      await downloadReport(url, fallbackName);

      setExportHistory(prev => [{
        label:  `Отчёт за ${exportPeriodLabel}${entityLabel ? ", " + entityLabel.split(" ")[0] : ""}`,
        format: "PDF",
        color:  "#ff5252",
        type:   currentReportTypeCfg.label,
        date:   dateStr,
        time:   timeStr,
      }, ...prev]);
    } catch (err) {
      setExportError(err.message || "Ошибка экспорта");
    } finally {
      setExportLoading(false);
    }
  };

  // ── Chart data ────────────────────────────────────────────────────────────────
  const labels = getLabels(chartPeriod);
  const periodCounts = { day: 24, week: 7, month: 30, year: 12 };
  const n = periodCounts[chartPeriod];

  // Используем реальные данные, фоллбэк только если датчик не выбран
  const displayTemp = chartTemp.length > 0 ? chartTemp : (!filterSensor ? genFallback(n) : []);
  const displayHum  = chartHum.length  > 0 ? chartHum  : (!filterSensor ? genFallback(n) : []);

  const selectedSensorLabel  = sensorOptions.find(s => s.value === filterSensor)?.label;
  const selectedLocationLabel = locationOptions.find(l => l.value === filterLocation)?.label;
  const chartSubLabel = filterSensor
    ? selectedSensorLabel
    : filterLocation
      ? selectedLocationLabel
      : "Все датчики (демо)";

  // ── Render ────────────────────────────────────────────────────────────────────
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
            <button className="an-filter-reset" onClick={() => {
              setFilterSensor(null);
              setFilterLocation(null);
            }}>
              Сбросить
            </button>
          )}
          {histLoading && (
            <span style={{fontSize:"12px", color:"#929292"}}>Загрузка данных...</span>
          )}
          {histError && (
            <span style={{fontSize:"12px", color:"#ff5252"}}>{histError}</span>
          )}
          {/* Последние показания */}
          {latestData && !histLoading && (
            <span style={{fontSize:"12px", color:"#929292", marginLeft:"auto"}}>
              {latestData.temperature != null && (
                <span style={{marginRight:12}}>
                  🌡 <span style={{color:"#07bcd4", fontWeight:600}}>{latestData.temperature.toFixed(1)}°C</span>
                </span>
              )}
              {latestData.humidity != null && (
                <span>
                  💧 <span style={{color:"#ffc207", fontWeight:600}}>{latestData.humidity.toFixed(1)}%</span>
                </span>
              )}
            </span>
          )}
        </div>

        {/* ── Charts ── */}
        <div className="an-charts-row">
          {/* Temperature */}
          <div className="an-card an-chart-card">
            <div className="an-chart-header">
              <div>
                <h2 className="an-card-title">Температура</h2>
                <p className="an-chart-sub">{chartSubLabel}</p>
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
              {histLoading
                ? <div style={{height:130, display:"flex", alignItems:"center", justifyContent:"center", color:"#555", fontSize:"13px"}}>Загрузка...</div>
                : <LineChart data={displayTemp} color="#07bcd4" />
              }
            </div>
          </div>

          {/* Humidity */}
          <div className="an-card an-chart-card">
            <div className="an-chart-header">
              <div>
                <h2 className="an-card-title">Влажность</h2>
                <p className="an-chart-sub">{chartSubLabel}</p>
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
              {histLoading
                ? <div style={{height:130, display:"flex", alignItems:"center", justifyContent:"center", color:"#555", fontSize:"13px"}}>Загрузка...</div>
                : <LineChart data={displayHum} color="#ffc207" />
              }
            </div>
          </div>
        </div>

        {/* ── Bottom row ── */}
        <div className="an-bottom-row">
          {/* Export card */}
          <div className="an-card an-export-card">
            <h2 className="an-card-title">Экспортировать данные</h2>

            {/* Тип отчёта */}
            <div className="an-export-type-row">
              {REPORT_TYPES.map(rt => (
                <button key={rt.key}
                  className={`an-report-type-btn ${reportType === rt.key ? "an-report-type-btn--active" : ""}`}
                  style={reportType === rt.key
                    ? { borderColor: rt.color, color: rt.color, backgroundColor: `${rt.color}14` }
                    : {}
                  }
                  onClick={() => setReportType(rt.key)}>
                  {rt.icon}
                  <span>{rt.label}</span>
                </button>
              ))}
            </div>

            {/* Сущность */}
            <div className="an-export-context">
              <div className="an-export-context-row">
                {currentReportTypeCfg.icon}
                <span className="an-export-context-key">{currentReportTypeCfg.label}:</span>
                <div style={{ flex: 1 }}>
                  <Dropdown
                    icon={currentReportTypeCfg.icon}
                    placeholder={loading ? "Загрузка..." : currentReportTypeCfg.placeholder}
                    options={exportOptions()}
                    value={exportEntityId}
                    onChange={setExportEntityId}
                  />
                </div>
              </div>

              {/* Период */}
              <div className="an-export-context-row">
                <IconCalendar />
                <span className="an-export-context-key">Период:</span>
                <div className="an-period-bar an-period-bar--inline">
                  {PERIODS.map(p => (
                    <button key={p.key}
                      className={`an-period-btn ${exportPeriod === p.key && !exportCustom ? "an-period-btn--active" : ""}`}
                      onClick={() => { setExportPeriod(p.key); setExportCustom(null); }}>
                      {p.label}
                    </button>
                  ))}
                  <button
                    className={`an-period-btn an-period-btn--cal ${exportCustom ? "an-period-btn--active" : ""}`}
                    onClick={() => setShowExportCal(true)} title="Произвольный период">
                    <IconCalendar />
                  </button>
                </div>
              </div>

              {exportCustom && (
                <div className="an-export-context-row">
                  <span style={{fontSize:"12px", color:"#929292"}}>
                    {exportCustom.from} – {exportCustom.to}
                  </span>
                  <button style={{background:"none", border:"none", cursor:"pointer", padding:"2px"}}
                    onClick={() => setExportCustom(null)}>
                    <IconClose />
                  </button>
                </div>
              )}
            </div>

            {/* Формат — только PDF */}
            <div className="an-format-row">
              <div className="an-format-btn an-format-btn--active"
                style={{ borderColor:"#ff5252", backgroundColor:"rgba(255,82,82,0.08)", color:"#ff5252" }}>
                <IconPDF />
                <span>PDF</span>
              </div>
            </div>

            {exportError && (
              <div style={{ fontSize:"12px", color:"#ff5252", padding:"4px 0" }}>{exportError}</div>
            )}

            <button
              className="an-export-btn"
              style={{
                borderColor:     "#ff5252",
                color:           "#ff5252",
                backgroundColor: "#1a1010",
                opacity:         exportLoading ? 0.7 : 1,
              }}
              onClick={doExport}
              disabled={exportLoading}>
              <IconDownloadArrow color="#ff5252" />
              <span>{exportLoading ? "Загрузка..." : "Скачать PDF"}</span>
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
                        <span className="an-history-badge"
                          style={{ background:`${item.color}22`, color: item.color }}>
                          {item.format}
                        </span>
                        {item.type && (
                          <span className="an-history-badge"
                            style={{ background:"rgba(255,255,255,0.05)", color:"#929292", marginLeft:4 }}>
                            {item.type}
                          </span>
                        )}
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

      {/* Календарь для графика */}
      {showCal && (
        <DatePickerModal
          onClose={() => setShowCal(false)}
          onApply={(from, to) => { setCustomRange({ from, to }); }}
        />
      )}

      {/* Календарь для экспорта */}
      {showExportCal && (
        <DatePickerModal
          onClose={() => setShowExportCal(false)}
          onApply={(from, to) => { setExportCustom({ from, to }); }}
        />
      )}
    </div>
  );
};

export default Analytics;