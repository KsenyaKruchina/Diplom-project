// frontend/src/components/Analytics.jsx
// ─── Аналитика с реальными данными из API ────────────────────────────────────

import React, { useState, useRef, useEffect, useCallback } from "react";
import "./Analytics.css";
import { useAnalyticsData } from "../hooks/useAnalyticsData";
import { getToken } from "../services/api";

// ── Константы ─────────────────────────────────────────────────────────────────

const BASE_URL = "http://157.90.127.202/api/v1";
const TELEMETRY_BASE = "http://157.90.127.202:8000/api/v1";
const HISTORY_KEY = "analytics_export_history";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// ── Telemetry helpers ─────────────────────────────────────────────────────────

// FIX: API возвращает { sensor_id, sensor_name, measurements: [...], latest: {...} }
// Добавлен limit=1000 для получения достаточного количества данных
const fetchSensorHistory = async (sensorId, startTime, endTime) => {
  const params = new URLSearchParams({
    start_time: startTime,
    end_time: endTime,
    limit: 1000,
  });
  const res = await fetch(
    `${TELEMETRY_BASE}/telemetry/${sensorId}/history?${params}`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error(`Ошибка получения истории: ${res.status}`);
  return res.json(); // { sensor_id, sensor_name, measurements: [...], latest: {...} }
};

const fetchSensorHistoryByPeriod = async (sensorId, limit = 500) => {
  const res = await fetch(
    `${TELEMETRY_BASE}/telemetry/${sensorId}/history?limit=${limit}`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error(`Ошибка получения истории: ${res.status}`);
  return res.json(); // { sensor_id, sensor_name, measurements: [...], latest: {...} }
};

const fetchSensorLast24h = async (sensorId) => {
  const res = await fetch(
    `${TELEMETRY_BASE}/telemetry/${sensorId}/last-24h`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error(`Ошибка получения данных за 24ч: ${res.status}`);
  return res.json(); // { sensor_id, sensor_name, measurements: [...], latest: {...} }
};

// ── FIX: Правильное извлечение measurements из ответа API ────────────────────
const extractMeasurements = (apiResponse) => {
  if (!apiResponse) return [];
  // API возвращает объект с полем measurements
  if (Array.isArray(apiResponse.measurements)) return apiResponse.measurements;
  // Fallback: если вдруг пришёл массив напрямую
  if (Array.isArray(apiResponse)) return apiResponse;
  // Fallback для других форматов
  if (Array.isArray(apiResponse.data)) return apiResponse.data;
  return [];
};

// ── FIX: Прореживание массива до нужного кол-ва точек ────────────────────────
const downsample = (arr, target) => {
  if (!arr || arr.length === 0) return [];
  if (arr.length <= target) return arr;
  const step = (arr.length - 1) / (target - 1);
  return Array.from({ length: target }, (_, i) => {
    const idx = Math.round(i * step);
    return arr[Math.min(idx, arr.length - 1)];
  });
};

// ── Download ──────────────────────────────────────────────────────────────────

const REPORT_ENDPOINTS = {
  location:     "download-events-location",
  control_unit: "download-events-control-unit",
  sensor:       "download-events-sensor",
};

const PERIOD_API_MAP = {
  day:   "last_24_hours",
  week:  "last_week",
  month: "last_month",
  year:  "last_year",
};

const downloadReport = async ({ entityType, entityId, period, format, customRange }) => {
  const endpoint = REPORT_ENDPOINTS[entityType];
  if (!endpoint) throw new Error("Неизвестный тип сущности");

  const isXlsx = format === "xlsx";

  const params = new URLSearchParams();
  if (customRange) {
    params.set("period", "custom");
    params.set("start_date", customRange.from);
    params.set("end_date", customRange.to);
  } else {
    params.set("period", period);
  }
  params.set("format", isXlsx ? "xlsx" : "pdf");

  const url = `${BASE_URL}/reports/${endpoint}/${entityId}?${params}`;
  const token = getToken();

  const response = await fetch(url, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(isXlsx
        ? { Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
        : { Accept: "application/pdf" }
      ),
    },
  });

  if (response.status === 403) throw new Error("Нет доступа к этой сущности");
  if (response.status === 422) {
    let detail = "Неверные параметры запроса (422)";
    try {
      const body = await response.json();
      if (body?.detail) {
        detail = Array.isArray(body.detail)
          ? body.detail.map(e => `${e.loc?.join(".")} — ${e.msg}`).join("; ")
          : String(body.detail);
      }
    } catch {}
    throw new Error(detail);
  }
  if (!response.ok) {
    let msg = `Ошибка ${response.status}`;
    try { const e = await response.json(); if (e.detail) msg = e.detail; } catch {}
    throw new Error(msg);
  }

  const cd = response.headers.get("Content-Disposition") || "";
  const m  = cd.match(/filename[^;=\n]*=([^;\n]*)/);
  const ext = isXlsx ? "xlsx" : "pdf";
  const filename = m
    ? m[1].replace(/['"]/g, "").trim()
    : `report_${entityType}_${entityId}_${new Date().toISOString().slice(0, 10)}.${ext}`;

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
};

// ── Period helpers ────────────────────────────────────────────────────────────

const getPeriodRange = (period) => {
  const now = new Date();
  const starts = {
    day:   new Date(now - 24 * 60 * 60 * 1000).toISOString(),
    week:  new Date(now - 7  * 24 * 60 * 60 * 1000).toISOString(),
    month: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(),
    year:  new Date(now - 365* 24 * 60 * 60 * 1000).toISOString(),
  };
  return { start: starts[period] || starts.month, end: now.toISOString() };
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

const CHART_POINTS = { day: 24, week: 48, month: 60, year: 52 };
const API_LIMITS   = { day: 96, week: 336, month: 720, year: 1000 };

const genFallback = (n) => Array.from({ length: n }, (_, i) => 20 + Math.sin(i / 2) * 5);

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
const IconXLSX = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
    <rect x="6" y="3" width="24" height="30" rx="2.5" fill="#1a1a1a" stroke="#01e676" strokeWidth="1.4"/>
    <path d="M30 3l8 8h-8V3z" fill="#01e676" fillOpacity="0.5"/>
    <text x="22" y="41" textAnchor="middle" fill="#01e676" fontSize="8" fontFamily="Inter, sans-serif" fontWeight="700">XLSX</text>
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

// ── Configs ───────────────────────────────────────────────────────────────────
const REPORT_TYPES = [
  { key: "location",     label: "По локации",  placeholder: "Выбрать локацию",  icon: <IconLocation />,    color: "#07bcd4" },
  { key: "control_unit", label: "По ЦБУ",      placeholder: "Выбрать ЦБУ",      icon: <IconControlUnit />, color: "#a78bfa" },
  { key: "sensor",       label: "По датчику",  placeholder: "Выбрать датчик",   icon: <IconSensor />,      color: "#ffc207" },
];

const EXPORT_FORMATS = [
  { key: "pdf",  label: "PDF",   icon: <IconPDF />,  color: "#ff5252", bg: "rgba(255,82,82,0.08)" },
  { key: "xlsx", label: "Excel", icon: <IconXLSX />, color: "#01e676", bg: "rgba(1,230,118,0.08)" },
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
  const [filterSensor,      setFilterSensor]      = useState(null);
  const [filterLocation,    setFilterLocation]    = useState(null);
  const [filterControlUnit, setFilterControlUnit] = useState(null);
  const [chartPeriod,       setChartPeriod]       = useState("month");
  const [customRange,       setCustomRange]       = useState(null);
  const [showCal,           setShowCal]           = useState(false);

  const selectSensor = (v) => {
    setFilterSensor(v);
    setFilterLocation(null);
    setFilterControlUnit(null);
  };
  const selectLocation = (v) => {
    setFilterLocation(v);
    setFilterSensor(null);
    setFilterControlUnit(null);
  };
  const selectControlUnit = (v) => {
    setFilterControlUnit(v);
    setFilterSensor(null);
    setFilterLocation(null);
  };

  // ── Telemetry state ──
  const [chartTemp,   setChartTemp]   = useState([]);
  const [chartHum,    setChartHum]    = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [histError,   setHistError]   = useState("");
  const [latestData,  setLatestData]  = useState(null);

  // ── Export state ──
  const [reportType,     setReportType]     = useState("sensor");
  const [exportEntityId, setExportEntityId] = useState(null);
  const [exportPeriod,   setExportPeriod]   = useState("month");
  const [exportCustom,   setExportCustom]   = useState(null);
  const [showExportCal,  setShowExportCal]  = useState(false);
  const [exportFormat,   setExportFormat]   = useState("pdf");
  const [exportLoading,  setExportLoading]  = useState(false);
  const [exportError,    setExportError]    = useState("");

  const [exportHistory, setExportHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // ── User / role ──
  const [currentUser, setCurrentUser] = useState(null);
  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    fetch(`${TELEMETRY_BASE}/users/me`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(u => setCurrentUser(u))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setExportPeriod(chartPeriod);
    setExportCustom(customRange);
  }, [chartPeriod, customRange]);

  useEffect(() => {
    setExportEntityId(null);
    setExportError("");
  }, [reportType]);

  // ── FIX: Загрузка телеметрии с правильным парсингом ответа API ──────────────
  useEffect(() => {
    if (!filterSensor) {
      setChartTemp([]);
      setChartHum([]);
      setLatestData(null);
      setHistError("");
      return;
    }

    const load = async () => {
      setHistLoading(true);
      setHistError("");

      const uiPeriod = chartPeriod; // "day" | "week" | "month" | "year"
      const targetPoints = CHART_POINTS[uiPeriod] || 60;

      try {
        let apiResponse;

        if (customRange) {
          // Произвольный диапазон — передаём start_time / end_time
          apiResponse = await fetchSensorHistory(
            filterSensor,
            `${customRange.from}T00:00:00`,
            `${customRange.to}T23:59:59`
          );
        } else if (uiPeriod === "day") {
          // Последние 24 часа — специальный endpoint
          apiResponse = await fetchSensorLast24h(filterSensor);
        } else {
          // Остальные периоды — history с нужным лимитом
          const limit = API_LIMITS[uiPeriod] || 500;
          apiResponse = await fetchSensorHistoryByPeriod(filterSensor, limit);
        }

        // FIX: Извлекаем measurements из объекта ответа
        const measurements = extractMeasurements(apiResponse);

        // Сортируем по времени (от старых к новым)
        const sorted = [...measurements].sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );

        // Прореживаем до нужного кол-ва точек для графика
        const sampled = downsample(sorted, targetPoints);

        // Извлекаем значения температуры и влажности
        const temps = sampled
          .map(m => m.temperature)
          .filter(v => v != null && !isNaN(v));
        const hums = sampled
          .map(m => m.humidity)
          .filter(v => v != null && !isNaN(v));

        setChartTemp(temps);
        setChartHum(hums);

        // Последнее значение — из поля latest или из последнего measurement
        const latest = apiResponse?.latest ?? (sorted.length > 0 ? sorted[sorted.length - 1] : null);
        if (latest) {
          setLatestData({
            temperature: latest.temperature ?? null,
            humidity:    latest.humidity    ?? null,
          });
        } else {
          setLatestData(null);
        }

      } catch (err) {
        console.error("[Analytics] Ошибка загрузки телеметрии:", err);
        setHistError(err.message || "Ошибка загрузки данных");
        setChartTemp([]);
        setChartHum([]);
        setLatestData(null);
      } finally {
        setHistLoading(false);
      }
    };

    load();
  }, [filterSensor, chartPeriod, customRange]);

  // ── Опции для экспорта с учётом роли ──
  const exportOptions = useCallback(() => {
    const userLocationId = currentUser?.location_id ?? null;
    const filterByLocation = (opts) => {
      if (isAdmin || !userLocationId) return opts;
      return opts.filter(o => o.location_id === userLocationId);
    };
    if (reportType === "location") {
      if (!isAdmin && userLocationId) return locationOptions.filter(o => o.value === String(userLocationId));
      return locationOptions;
    }
    if (reportType === "control_unit") return filterByLocation(controlUnitOptions || []);
    return filterByLocation(sensorOptions);
  }, [reportType, isAdmin, currentUser, locationOptions, sensorOptions, controlUnitOptions]);

  const currentReportTypeCfg = REPORT_TYPES.find(r => r.key === reportType);
  const currentFormatCfg     = EXPORT_FORMATS.find(f => f.key === exportFormat);

  const exportPeriodLabel = exportCustom
    ? `${exportCustom.from} – ${exportCustom.to}`
    : { day: "День", week: "Неделя", month: "Месяц", year: "Год" }[exportPeriod];

  const entityLabel = exportEntityId
    ? exportOptions().find(o => o.value === exportEntityId)?.label
    : null;

  // ── Экспорт ──
  const doExport = async () => {
    if (!exportEntityId) {
      setExportError(`Выберите ${currentReportTypeCfg.placeholder.toLowerCase()}`);
      return;
    }
    setExportError("");
    setExportLoading(true);
    const now = new Date();
    try {
      await downloadReport({
        entityType:  reportType,
        entityId:    exportEntityId,
        period:      PERIOD_API_MAP[exportPeriod] || "last_month",
        format:      exportFormat,
        customRange: exportCustom,
      });

      const newItem = {
        label:  `Отчёт за ${exportPeriodLabel}${entityLabel ? ", " + entityLabel.split(" ")[0] : ""}`,
        format: exportFormat.toUpperCase(),
        color:  currentFormatCfg.color,
        type:   currentReportTypeCfg.label,
        date:   now.toLocaleDateString("ru-RU", { day:"2-digit", month:"2-digit", year:"numeric" }),
        time:   now.toLocaleTimeString("ru-RU", { hour:"2-digit", minute:"2-digit" }),
      };

      setExportHistory(prev => {
        const next = [newItem, ...prev];
        try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch {}
        return next;
      });
    } catch (err) {
      setExportError(err.message || "Ошибка экспорта");
    } finally {
      setExportLoading(false);
    }
  };

  // ── Очистка истории ──
  const clearHistory = () => {
    setExportHistory([]);
    try { localStorage.removeItem(HISTORY_KEY); } catch {}
  };

  // ── Chart data ──
  const labels = getLabels(chartPeriod);
  const n = CHART_POINTS[chartPeriod] || 30;

  // Показываем реальные данные если датчик выбран, иначе демо
  const displayTemp = chartTemp.length > 0 ? chartTemp : (!filterSensor ? genFallback(n) : []);
  const displayHum  = chartHum.length  > 0 ? chartHum  : (!filterSensor ? genFallback(n) : []);

  const chartSubLabel = filterSensor
    ? sensorOptions.find(s => s.value === filterSensor)?.label
    : filterControlUnit
      ? (controlUnitOptions || []).find(c => c.value === filterControlUnit)?.label
      : filterLocation
        ? locationOptions.find(l => l.value === filterLocation)?.label
        : "Все датчики (демо)";

  const hasActiveFilter = filterSensor || filterLocation || filterControlUnit;

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
            placeholder={loading ? "Загрузка..." : "По датчику"}
            options={sensorOptions}
            value={filterSensor}
            onChange={selectSensor}
          />
          <Dropdown
            icon={<IconLocation />}
            placeholder={loading ? "Загрузка..." : "По локации"}
            options={locationOptions}
            value={filterLocation}
            onChange={selectLocation}
          />
          <Dropdown
            icon={<IconControlUnit />}
            placeholder={loading ? "Загрузка..." : "По ЦБУ"}
            options={controlUnitOptions || []}
            value={filterControlUnit}
            onChange={selectControlUnit}
          />

          {hasActiveFilter && (
            <button
              className="an-filter-reset"
              onClick={() => {
                setFilterSensor(null);
                setFilterLocation(null);
                setFilterControlUnit(null);
              }}>
              Сбросить
            </button>
          )}

          {histLoading && (
            <span style={{ fontSize: "12px", color: "#929292" }}>Загрузка данных...</span>
          )}
          {histError && (
            <span style={{ fontSize: "12px", color: "#ff5252" }}>{histError}</span>
          )}
          {latestData && !histLoading && (
            <span style={{ fontSize: "12px", color: "#929292", marginLeft: "auto" }}>
              {latestData.temperature != null && (
                <span style={{ marginRight: 12 }}>
                  🌡 <span style={{ color: "#07bcd4", fontWeight: 600 }}>{latestData.temperature.toFixed(1)}°C</span>
                </span>
              )}
              {latestData.humidity != null && (
                <span>
                  💧 <span style={{ color: "#ffc207", fontWeight: 600 }}>{latestData.humidity.toFixed(1)}%</span>
                </span>
              )}
            </span>
          )}
        </div>

        {/* ── Charts ── */}
        <div className="an-charts-row">
          {[
            { title: "Температура", data: displayTemp, color: "#07bcd4" },
            { title: "Влажность",   data: displayHum,  color: "#ffc207" },
          ].map(({ title, data, color }) => (
            <div key={title} className="an-card an-chart-card">
              <div className="an-chart-header">
                <div>
                  <h2 className="an-card-title">{title}</h2>
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
                    onClick={() => setShowCal(true)}>
                    <IconCalendar />
                  </button>
                </div>
              </div>
              <div className="an-chart-labels">{labels.map(l => <span key={l}>{l}</span>)}</div>
              <div className="an-chart-area">
                {histLoading ? (
                  <div style={{height:130,display:"flex",alignItems:"center",justifyContent:"center",color:"#555",fontSize:"13px"}}>
                    Загрузка...
                  </div>
                ) : data.length === 0 && filterSensor ? (
                  <div style={{height:130,display:"flex",alignItems:"center",justifyContent:"center",color:"#555",fontSize:"13px"}}>
                    Нет данных за выбранный период
                  </div>
                ) : (
                  <LineChart data={data} color={color} />
                )}
              </div>
            </div>
          ))}
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
                  style={reportType === rt.key ? { borderColor: rt.color, color: rt.color, backgroundColor: `${rt.color}14` } : {}}
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
                    onClick={() => setShowExportCal(true)}>
                    <IconCalendar />
                  </button>
                </div>
              </div>

              {exportCustom && (
                <div className="an-export-context-row">
                  <span style={{fontSize:"12px", color:"#929292"}}>{exportCustom.from} – {exportCustom.to}</span>
                  <button style={{background:"none", border:"none", cursor:"pointer", padding:"2px"}} onClick={() => setExportCustom(null)}>
                    <IconClose />
                  </button>
                </div>
              )}
            </div>

            {/* Формат */}
            <div className="an-format-row">
              {EXPORT_FORMATS.map(fmt => (
                <button key={fmt.key}
                  className={`an-format-btn ${exportFormat === fmt.key ? "an-format-btn--active" : ""}`}
                  style={exportFormat === fmt.key ? { borderColor: fmt.color, backgroundColor: fmt.bg, color: fmt.color } : {}}
                  onClick={() => setExportFormat(fmt.key)}>
                  {fmt.icon}
                  <span>{fmt.label}</span>
                </button>
              ))}
            </div>

            {exportError && (
              <div style={{ fontSize:"12px", color:"#ff5252", padding:"4px 0" }}>{exportError}</div>
            )}

            <button
              className="an-export-btn"
              style={{
                borderColor:     currentFormatCfg.color,
                color:           currentFormatCfg.color,
                backgroundColor: exportFormat === "pdf" ? "#1a1010" : "#0f1a12",
                opacity:         exportLoading ? 0.7 : 1,
              }}
              onClick={doExport}
              disabled={exportLoading}>
              <IconDownloadArrow color={currentFormatCfg.color} />
              <span>{exportLoading ? "Загрузка..." : `Скачать ${currentFormatCfg.label}`}</span>
            </button>
          </div>

          {/* History card */}
          <div className="an-card an-history-card">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"12px" }}>
              <h2 className="an-card-title" style={{ margin: 0 }}>История экспорта</h2>
              {exportHistory.length > 0 && (
                <button
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "12px",
                    color: "#555",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = "#ff5252"}
                  onMouseLeave={e => e.currentTarget.style.color = "#555"}
                  onClick={clearHistory}>
                  Очистить
                </button>
              )}
            </div>
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
                        <span className="an-history-badge" style={{ background:`${item.color}22`, color: item.color }}>{item.format}</span>
                        {item.type && (
                          <span className="an-history-badge" style={{ background:"rgba(255,255,255,0.05)", color:"#929292", marginLeft:4 }}>{item.type}</span>
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

      {showCal && (
        <DatePickerModal onClose={() => setShowCal(false)} onApply={(from, to) => setCustomRange({ from, to })} />
      )}
      {showExportCal && (
        <DatePickerModal onClose={() => setShowExportCal(false)} onApply={(from, to) => setExportCustom({ from, to })} />
      )}
    </div>
  );
};

export default Analytics;