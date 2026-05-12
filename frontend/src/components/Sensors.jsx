// frontend/src/components/Sensors.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import "./Sensors.css";

const BASE_URL = "http://157.90.127.202:8000";
const getToken = () => localStorage.getItem("token");

// ─── API helpers ──────────────────────────────────────────────────────────────
const apiFetch = async (path, opts = {}) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      ...(opts.body && !(opts.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...opts.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    let message;
    if (Array.isArray(err.detail)) {
      message = err.detail
        .map(e => {
          const field = Array.isArray(e.loc) ? e.loc.filter(l => l !== "body").join(".") : "";
          return field ? `${field}: ${e.msg}` : e.msg;
        })
        .join("; ");
    } else {
      message = err.detail || `Ошибка ${res.status}`;
    }
    const error = new Error(message);
    error.status = res.status;
    error.raw = err;
    console.error(`API error ${res.status} on ${path}:`, err);
    throw error;
  }
  const text = await res.text();
  return text ? JSON.parse(text) : {};
};

const apiGet    = (path)        => apiFetch(path);
const apiPatch  = (path, body)  => apiFetch(path, { method: "PATCH",  body: JSON.stringify(body) });
const apiPost   = (path, body)  => apiFetch(path, { method: "POST",   body: JSON.stringify(body) });
const apiDelete = (path)        => apiFetch(path, { method: "DELETE" });

// ─── LocalStorage helpers for location order ──────────────────────────────────
const LOC_ORDER_KEY = "sensors_location_order";
const saveLocOrder = (order) => {
  try { localStorage.setItem(LOC_ORDER_KEY, JSON.stringify(order)); } catch {}
};
const loadLocOrder = () => {
  try { const v = localStorage.getItem(LOC_ORDER_KEY); return v ? JSON.parse(v) : null; } catch { return null; }
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconSearch    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#929292" strokeWidth="1.8"/><line x1="16.5" y1="16.5" x2="21" y2="21" stroke="#929292" strokeWidth="1.8" strokeLinecap="round"/></svg>;
const IconClose     = () => <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><line x1="4" y1="4" x2="14" y2="14" stroke="#929292" strokeWidth="1.8" strokeLinecap="round"/><line x1="14" y1="4" x2="4" y2="14" stroke="#929292" strokeWidth="1.8" strokeLinecap="round"/></svg>;
const IconChevDown  = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 5l4 4 4-4" stroke="#929292" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IconChevRight = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="#929292" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IconTherm     = () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="6" y="1" width="4" height="9" rx="2" stroke="#ffc207" strokeWidth="1.2"/><circle cx="8" cy="12" r="3" fill="#ffc207" fillOpacity="0.3" stroke="#ffc207" strokeWidth="1.2"/><rect x="7" y="6" width="2" height="5" fill="#ffc207"/></svg>;
const IconDrop      = () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 2C8 2 3 7.5 3 10.5a5 5 0 0010 0C13 7.5 8 2 8 2z" fill="#07bcd4" fillOpacity="0.3" stroke="#07bcd4" strokeWidth="1.2"/></svg>;
const IconBattery   = ({ pct = 75 }) => { const c = pct > 50 ? "#01e676" : pct > 20 ? "#ffd550" : "#ff5b5b"; const w = Math.round((pct / 100) * 16); return <svg width="22" height="12" viewBox="0 0 22 12" fill="none"><rect x="0.5" y="0.5" width="18" height="11" rx="2.5" stroke={c} strokeWidth="1"/><rect x="19" y="3.5" width="2.5" height="5" rx="1" fill={c}/><rect x="1.5" y="1.5" width={w} height="9" rx="1.5" fill={c}/></svg>; };
const IconGSM       = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="10" width="2.5" height="4" rx="0.5" fill="#01e676"/><rect x="6" y="7" width="2.5" height="7" rx="0.5" fill="#01e676"/><rect x="10" y="4" width="2.5" height="10" rx="0.5" fill="#929292"/><rect x="14" y="1" width="0.5" height="13" rx="0.25" fill="#929292" fillOpacity="0.3"/></svg>;
const IconSim       = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="3" y="1.5" width="10" height="13" rx="2" stroke="#ffc207" strokeWidth="1.3"/><rect x="5.5" y="6" width="2" height="2" rx="0.5" fill="#ffc207"/><rect x="8.5" y="6" width="2" height="2" rx="0.5" fill="#ffc207"/><rect x="5.5" y="9" width="2" height="2" rx="0.5" fill="#ffc207"/><rect x="8.5" y="9" width="2" height="2" rx="0.5" fill="#ffc207"/><path d="M6 1.5V4h4V1.5" stroke="#ffc207" strokeWidth="1.3"/></svg>;
const IconPower     = ({ on }) => <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2v5M5 4a5 5 0 1 0 6 0" stroke={on ? "#01e676" : "#555"} strokeWidth="1.4" strokeLinecap="round"/></svg>;
const IconEdit      = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#929292" strokeWidth="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconTrash     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ff5b5b" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const IconDrag      = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="5.5" cy="4" r="1" fill="#555"/><circle cx="10.5" cy="4" r="1" fill="#555"/><circle cx="5.5" cy="8" r="1" fill="#555"/><circle cx="10.5" cy="8" r="1" fill="#555"/><circle cx="5.5" cy="12" r="1" fill="#555"/><circle cx="10.5" cy="12" r="1" fill="#555"/></svg>;
const IconMapPin    = () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 1a5 5 0 0 1 5 5c0 4-5 9-5 9S3 10 3 6a5 5 0 0 1 5-5z" stroke="#929292" strokeWidth="1.3"/><circle cx="8" cy="6" r="1.5" fill="#929292"/></svg>;
const IconPlus      = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><line x1="8" y1="3" x2="8" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="3" y1="8" x2="13" y2="8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
const IconBlock     = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>;
const IconWarn      = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 20h20L12 2z" stroke="#ffd550" strokeWidth="1.8" strokeLinejoin="round"/><line x1="12" y1="9" x2="12" y2="14" stroke="#ffd550" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="17.5" r="0.8" fill="#ffd550"/></svg>;

// ─── Sparkline ────────────────────────────────────────────────────────────────
const Sparkline = ({ color, data, sensor, type }) => {
  const h = 88, w = 260;
  if (!data || data.length < 2) return (
    <div style={{ height: h, display: "flex", alignItems: "center", justifyContent: "center", color: "#333", fontSize: 10 }}>нет данных</div>
  );
  const vals = data.map(Number);

  const getLimits = () => {
    if (!sensor) return [];
    if (type === "temp") return [
      sensor.alarm_min_temp, sensor.alarm_max_temp,
      sensor.warning_min_temp, sensor.warning_max_temp,
      sensor.normal_min_temp, sensor.normal_max_temp,
    ].filter(v => v != null);
    return [
      sensor.alarm_min_hum, sensor.alarm_max_hum,
      sensor.warning_min_hum, sensor.warning_max_hum,
      sensor.normal_min_hum, sensor.normal_max_hum,
    ].filter(v => v != null);
  };

  const limits = getLimits();
  const allVals = [...vals, ...limits];
  const vMin = Math.min(...allVals) - 1.5;
  const vMax = Math.max(...allVals) + 1.5;
  const range = vMax - vMin || 1;
  const toY = (v) => h - ((v - vMin) / range) * (h - 10) - 5;

  const renderBand = (minVal, maxVal, fill) => {
    if (minVal == null || maxVal == null) return null;
    const y1 = toY(maxVal), y2 = toY(minVal);
    if (y2 < 0 || y1 > h) return null;
    return <rect key={`band-${fill}`} x="0" y={Math.max(0,y1)} width={w} height={Math.min(h,y2)-Math.max(0,y1)} fill={fill} opacity="0.08"/>;
  };

  const renderLine = (val, stroke, dash) => {
    if (val == null) return null;
    const y = toY(val);
    if (y < 0 || y > h) return null;
    return <line key={`line-${val}-${stroke}`} x1="0" y1={y} x2={w} y2={y} stroke={stroke} strokeWidth="1.1" strokeDasharray={dash} opacity="0.8"/>;
  };

  const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * w},${toY(v)}`).join(" ");

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${color.replace("#","")}-${type}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {type === "temp" && sensor && <>
        {renderBand(sensor.normal_min_temp, sensor.normal_max_temp, "#01e676")}
        {renderBand(sensor.warning_min_temp, sensor.normal_min_temp, "#ffd550")}
        {renderBand(sensor.normal_max_temp, sensor.warning_max_temp, "#ffd550")}
      </>}
      {type === "hum" && sensor && <>
        {renderBand(sensor.normal_min_hum, sensor.normal_max_hum, "#01e676")}
        {renderBand(sensor.warning_min_hum, sensor.normal_min_hum, "#ffd550")}
        {renderBand(sensor.normal_max_hum, sensor.warning_max_hum, "#ffd550")}
      </>}
      {type === "temp" && sensor && <>
        {renderLine(sensor.alarm_max_temp,   "#ff5b5b", "5,3")}
        {renderLine(sensor.alarm_min_temp,   "#ff5b5b", "5,3")}
        {renderLine(sensor.warning_max_temp, "#ffd550", "5,3")}
        {renderLine(sensor.warning_min_temp, "#ffd550", "5,3")}
        {renderLine(sensor.normal_max_temp,  "#01e676", "3,3")}
        {renderLine(sensor.normal_min_temp,  "#01e676", "3,3")}
      </>}
      {type === "hum" && sensor && <>
        {renderLine(sensor.alarm_max_hum,   "#ff5b5b", "5,3")}
        {renderLine(sensor.alarm_min_hum,   "#ff5b5b", "5,3")}
        {renderLine(sensor.warning_max_hum, "#ffd550", "5,3")}
        {renderLine(sensor.warning_min_hum, "#ffd550", "5,3")}
        {renderLine(sensor.normal_max_hum,  "#01e676", "3,3")}
        {renderLine(sensor.normal_min_hum,  "#01e676", "3,3")}
      </>}
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#sg-${color.replace("#","")}-${type})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  );
};

// ─── Статус датчика ───────────────────────────────────────────────────────────
const getSensorStatus = (sensor) => {
  const t = sensor.current_temp, h = sensor.current_hum;
  if (sensor.status === "offline") return "offline";
  if (
    (sensor.alarm_max_temp != null && t > sensor.alarm_max_temp) ||
    (sensor.alarm_min_temp != null && t < sensor.alarm_min_temp) ||
    (sensor.alarm_max_hum  != null && h > sensor.alarm_max_hum)  ||
    (sensor.alarm_min_hum  != null && h < sensor.alarm_min_hum)
  ) return "alarm";
  if (
    (sensor.warning_max_temp != null && t > sensor.warning_max_temp) ||
    (sensor.warning_min_temp != null && t < sensor.warning_min_temp) ||
    (sensor.warning_max_hum  != null && h > sensor.warning_max_hum)  ||
    (sensor.warning_min_hum  != null && h < sensor.warning_min_hum)
  ) return "warning";
  return "ok";
};

const STATUS = {
  ok:      { color: "#01e676", bg: "#19282b", label: "Норма" },
  warning: { color: "#ffd550", bg: "#312c1c", label: "Внимание" },
  alarm:   { color: "#ff5b5b", bg: "#321c1b", label: "Тревога" },
  offline: { color: "#555",    bg: "#1a1a1a", label: "Офлайн" },
};

// ─── useSensorHistory ─────────────────────────────────────────────────────────
const useSensorHistory = (sensorId) => {
  const [data, setData] = useState(null);
  useEffect(() => {
    if (!sensorId) return;
    setData(null);
    apiGet(`/api/v1/telemetry/sensor/${sensorId}/latest`)
      .then(d => setData(d))
      .catch(() => setData(null));
  }, [sensorId]);
  return data;
};

// ─── Легенда лимитов ──────────────────────────────────────────────────────────
const ChartLegend = ({ sensor, type }) => {
  const items = [];
  if (type === "temp" && sensor) {
    if (sensor.normal_min_temp != null || sensor.normal_max_temp != null)
      items.push({ color: "#01e676", label: `Норма: ${sensor.normal_min_temp ?? "—"}…${sensor.normal_max_temp ?? "—"}°C` });
    if (sensor.warning_min_temp != null || sensor.warning_max_temp != null)
      items.push({ color: "#ffd550", label: `Внимание: ${sensor.warning_min_temp ?? "—"}…${sensor.warning_max_temp ?? "—"}°C` });
    if (sensor.alarm_min_temp != null || sensor.alarm_max_temp != null)
      items.push({ color: "#ff5b5b", label: `Тревога: ${sensor.alarm_min_temp ?? "—"}…${sensor.alarm_max_temp ?? "—"}°C` });
  }
  if (type === "hum" && sensor) {
    if (sensor.normal_min_hum != null || sensor.normal_max_hum != null)
      items.push({ color: "#01e676", label: `Норма: ${sensor.normal_min_hum ?? "—"}…${sensor.normal_max_hum ?? "—"}%` });
    if (sensor.warning_min_hum != null || sensor.warning_max_hum != null)
      items.push({ color: "#ffd550", label: `Внимание: ${sensor.warning_min_hum ?? "—"}…${sensor.warning_max_hum ?? "—"}%` });
    if (sensor.alarm_min_hum != null || sensor.alarm_max_hum != null)
      items.push({ color: "#ff5b5b", label: `Тревога: ${sensor.alarm_min_hum ?? "—"}…${sensor.alarm_max_hum ?? "—"}%` });
  }
  if (!items.length) return null;
  return (
    <div className="sn-chart-legend">
      {items.map((it, i) => (
        <span key={i} className="sn-chart-legend-item">
          <span style={{ width: 8, height: 2, background: it.color, display: "inline-block", borderRadius: 1 }}/>
          {it.label}
        </span>
      ))}
    </div>
  );
};

// ─── ThresholdTable ───────────────────────────────────────────────────────────
const ThresholdTable = ({ form, setVal, type }) => {
  const unit = type === "temp" ? "°C" : "%";
  const prefix = type === "temp" ? "temp" : "hum";

  const levels = [
    { key: "normal",  color: "#01e676", bg: "#0d2318", label: "🟢 Норма" },
    { key: "warning", color: "#ffd550", bg: "#29220a", label: "🟡 Внимание" },
    { key: "alarm",   color: "#ff5b5b", bg: "#2a100f", label: "🔴 Тревога" },
  ];

  const NumInput = ({ fkey, placeholder, color }) => (
    <input
      className="sn-th-input"
      type="text"
      inputMode="decimal"
      value={form[fkey] === null ? "" : form[fkey]}
      onChange={e => setVal(fkey, e.target.value)}
      placeholder={placeholder}
      style={{ "--inp-focus": color }}
    />
  );

  return (
    <div className="sn-th-table">
      <div className="sn-th-header-row">
        <div className="sn-th-col-level">Уровень</div>
        <div className="sn-th-col-minmax">
          <span>Мин {unit}</span>
          <span className="sn-th-range-sep">—</span>
          <span>Макс {unit}</span>
        </div>
      </div>
      {levels.map(({ key, color, bg, label }) => (
        <div key={key} className="sn-th-row" style={{ background: bg, borderLeft: `3px solid ${color}22` }}>
          <div className="sn-th-col-level">
            <span className="sn-th-level-dot" style={{ background: color }}/>
            <span className="sn-th-level-label" style={{ color }}>{label}</span>
          </div>
          <div className="sn-th-col-minmax">
            <NumInput fkey={`${key}_min_${prefix}`} placeholder="—" color={color}/>
            <span className="sn-th-range-sep" style={{ color: "#444" }}>—</span>
            <NumInput fkey={`${key}_max_${prefix}`} placeholder="—" color={color}/>
          </div>
        </div>
      ))}
      <div className="sn-th-hint">
        Пустое поле = порог не задан. Значения можно оставить частичными (только макс., только мин.).
      </div>
    </div>
  );
};

// ─── Modal: Подтверждение удаления ───────────────────────────────────────────
const ConfirmModal = ({ title, message, confirmLabel = "Удалить", onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleConfirm = async () => {
    setLoading(true);
    setErr("");
    try {
      await onConfirm();
      onClose();
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="sn-overlay" onClick={onClose}>
      <div className="sn-modal sn-modal--narrow" onClick={e => e.stopPropagation()}>
        <div className="sn-modal-header">
          <div>
            <h3 className="sn-modal-title">{title}</h3>
          </div>
          <button className="sn-modal-close" onClick={onClose}><IconClose/></button>
        </div>
        <div className="sn-modal-body">
          <p style={{ color: "#929292", fontSize: 13, lineHeight: 1.6, margin: 0 }}>{message}</p>
          {err && <div className="sn-modal-error" style={{ marginTop: 12 }}>{err}</div>}
        </div>
        <div className="sn-modal-footer">
          <button className="sn-btn-cancel" onClick={onClose}>Отмена</button>
          <button
            className="sn-btn-delete"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Удаление..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Modal: Удаление ЦБУ с привязанными сенсорами ────────────────────────────
// Показывается когда у блока есть датчики.
// Предлагает два варианта:
//   1. Удалить блок с отвязкой сенсоров (DELETE ?detach_sensors=true)
//   2. Отмена
const DeleteBlockWithSensorsModal = ({ block, attachedSensors, onClose, onDetachAndDelete }) => {
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState("");

  const handleDetachAndDelete = async () => {
    setLoading(true);
    setErr("");
    try {
      await onDetachAndDelete();
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sn-overlay" onClick={onClose}>
      <div className="sn-modal" onClick={e => e.stopPropagation()}>
        <div className="sn-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <IconWarn/>
            <div>
              <h3 className="sn-modal-title">Удалить ЦБУ невозможно</h3>
              <div className="sn-modal-subtitle">ЦБУ «{block.name}» · ID {block.id}</div>
            </div>
          </div>
          <button className="sn-modal-close" onClick={onClose}><IconClose/></button>
        </div>

        <div className="sn-modal-body">
          {/* Предупреждение */}
          <div style={{
            background: "#29220a",
            border: "1px solid #ffd55033",
            borderRadius: 8,
            padding: "12px 14px",
            marginBottom: 16,
            fontSize: 13,
            color: "#ffd550",
            lineHeight: 1.6,
          }}>
            К этому ЦБУ привязано <strong>{attachedSensors.length}</strong> датч.
            Нельзя удалить блок, пока к нему привязаны сенсоры.
          </div>

          {/* Список датчиков */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "#555", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Привязанные датчики
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 180, overflowY: "auto" }}>
              {attachedSensors.map(s => (
                <div key={s.id} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 12px",
                  background: "#1a1a1a",
                  borderRadius: 6,
                  border: "1px solid #252525",
                }}>
                  <span className="sn-sensor-id-tag" style={{ flexShrink: 0 }}>ID {s.id}</span>
                  <span style={{ fontSize: 13, color: "#ccc" }}>{s.name}</span>
                  {s.current_temp != null && (
                    <span style={{ marginLeft: "auto", fontSize: 11, color: "#ffc207", flexShrink: 0 }}>
                      {parseFloat(s.current_temp).toFixed(1)}°C
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Информация о detach */}
          <div style={{
            background: "#0d1f1a",
            border: "1px solid #01e67622",
            borderRadius: 8,
            padding: "12px 14px",
            fontSize: 12,
            color: "#929292",
            lineHeight: 1.7,
            marginBottom: 4,
          }}>
            <div style={{ color: "#01e676", fontWeight: 600, marginBottom: 6, fontSize: 12 }}>
              Удалить блок с отвязкой сенсоров
            </div>
            Центральный блок будет удалён. Сенсоры <strong style={{ color: "#ccc" }}>останутся в системе</strong> и
            будут отвязаны от этого ЦБУ. История измерений и тревог сохранится.
          </div>

          {err && <div className="sn-modal-error" style={{ marginTop: 12 }}>{err}</div>}
        </div>

        <div className="sn-modal-footer">
          <button className="sn-btn-cancel" onClick={onClose} disabled={loading}>
            Отмена
          </button>
          <button
            className="sn-btn-delete"
            onClick={handleDetachAndDelete}
            disabled={loading}
            style={{ minWidth: 190 }}
          >
            {loading ? "Удаление..." : "Удалить блок, отвязать датчики"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Modal: Редактировать ЦБУ ─────────────────────────────────────────────────
const EditBlockModal = ({ block, locations, onClose, onSave }) => {
  const [form, setForm] = useState({
    name:        block?.name        ?? "",
    location_id: block?.location_id ?? block?.group_id ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const setVal = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim())   { setErr("Введите название ЦБУ"); return; }
    if (!form.location_id)   { setErr("Выберите локацию"); return; }
    setLoading(true);
    setErr("");
    try {
      await onSave({
        name:        form.name.trim(),
        location_id: Number(form.location_id),
        group_id:    Number(form.location_id),
      });
      onClose();
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="sn-overlay" onClick={onClose}>
      <div className="sn-modal" onClick={e => e.stopPropagation()}>
        <div className="sn-modal-header">
          <div>
            <h3 className="sn-modal-title">Редактировать ЦБУ</h3>
            <div className="sn-modal-subtitle">ID: {block?.id}</div>
          </div>
          <button className="sn-modal-close" onClick={onClose}><IconClose/></button>
        </div>
        <div className="sn-modal-body">
          <div className="sn-field" style={{ marginBottom: 16 }}>
            <label className="sn-field-label">Название ЦБУ <span style={{ color: "#ff5b5b" }}>*</span></label>
            <input
              className="sn-field-input"
              type="text"
              value={form.name}
              onChange={e => setVal("name", e.target.value)}
              autoFocus
              style={{ width: "100%" }}
            />
          </div>
          <div className="sn-field">
            <label className="sn-field-label">Локация <span style={{ color: "#ff5b5b" }}>*</span></label>
            <select
              className="sn-field-input sn-field-select"
              value={form.location_id}
              onChange={e => setVal("location_id", e.target.value)}
              style={{ width: "100%" }}
            >
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>
          {err && <div className="sn-modal-error" style={{ marginTop: 12 }}>{err}</div>}
        </div>
        <div className="sn-modal-footer">
          <button className="sn-btn-cancel" onClick={onClose}>Отмена</button>
          <button className="sn-btn-save" onClick={handleSave} disabled={loading}>
            {loading ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Modal: Thresholds ────────────────────────────────────────────────────────
const ThresholdsModal = ({ sensor, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState("temp");
  const [form, setForm] = useState({
    alarm_min_temp:   sensor?.alarm_min_temp   ?? "",
    alarm_max_temp:   sensor?.alarm_max_temp   ?? "",
    warning_min_temp: sensor?.warning_min_temp ?? "",
    warning_max_temp: sensor?.warning_max_temp ?? "",
    normal_min_temp:  sensor?.normal_min_temp  ?? "",
    normal_max_temp:  sensor?.normal_max_temp  ?? "",
    alarm_min_hum:    sensor?.alarm_min_hum    ?? "",
    alarm_max_hum:    sensor?.alarm_max_hum    ?? "",
    warning_min_hum:  sensor?.warning_min_hum  ?? "",
    warning_max_hum:  sensor?.warning_max_hum  ?? "",
    normal_min_hum:   sensor?.normal_min_hum   ?? "",
    normal_max_hum:   sensor?.normal_max_hum   ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const setVal = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const parseOpt = v => (v === "" || v == null) ? null : parseFloat(v);

  const handleSave = async () => {
    setLoading(true);
    setErr("");
    try {
      await onSave({
        alarm_min_temp:   parseOpt(form.alarm_min_temp),
        alarm_max_temp:   parseOpt(form.alarm_max_temp),
        warning_min_temp: parseOpt(form.warning_min_temp),
        warning_max_temp: parseOpt(form.warning_max_temp),
        normal_min_temp:  parseOpt(form.normal_min_temp),
        normal_max_temp:  parseOpt(form.normal_max_temp),
        alarm_min_hum:    parseOpt(form.alarm_min_hum),
        alarm_max_hum:    parseOpt(form.alarm_max_hum),
        warning_min_hum:  parseOpt(form.warning_min_hum),
        warning_max_hum:  parseOpt(form.warning_max_hum),
        normal_min_hum:   parseOpt(form.normal_min_hum),
        normal_max_hum:   parseOpt(form.normal_max_hum),
      });
      onClose();
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="sn-overlay" onClick={onClose}>
      <div className="sn-modal" onClick={e => e.stopPropagation()}>
        <div className="sn-modal-header">
          <div>
            <h3 className="sn-modal-title">Пороговые значения</h3>
            <div className="sn-modal-subtitle">{sensor?.name} · ID {sensor?.id}</div>
          </div>
          <button className="sn-modal-close" onClick={onClose}><IconClose/></button>
        </div>
        <div className="sn-modal-tabs">
          <button className={`sn-modal-tab ${activeTab === "temp" ? "sn-modal-tab--active" : ""}`} onClick={() => setActiveTab("temp")}>
            🌡 Температура
          </button>
          <button className={`sn-modal-tab ${activeTab === "hum" ? "sn-modal-tab--active" : ""}`} onClick={() => setActiveTab("hum")}>
            💧 Влажность
          </button>
        </div>
        <div className="sn-modal-body" style={{ paddingTop: 16 }}>
          <ThresholdTable form={form} setVal={setVal} type={activeTab} />
          {err && <div className="sn-modal-error">{err}</div>}
        </div>
        <div className="sn-modal-footer">
          <button className="sn-btn-cancel" onClick={onClose}>Отмена</button>
          <button className="sn-btn-save" onClick={handleSave} disabled={loading}>
            {loading ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Modal: Создать ЦБУ ────────────────────────────────────────────────────────
const CreateBlockModal = ({ locations, onClose, onSave }) => {
  const [form, setForm] = useState({
    control_unit_id: "",
    serial_number: "",
    name: "",
    location_id: locations[0]?.id ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const setVal = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.control_unit_id.trim()) { setErr("Введите ID блока"); return; }
    if (!form.serial_number.trim())   { setErr("Введите серийный номер"); return; }
    if (!form.name.trim())            { setErr("Введите название ЦБУ"); return; }
    if (!form.location_id)            { setErr("Выберите локацию"); return; }
    setLoading(true);
    setErr("");
    try {
      await onSave({
        control_unit_id: form.control_unit_id.trim(),
        serial_number:   form.serial_number.trim(),
        name:            form.name.trim(),
        location_id:     Number(form.location_id),
        group_id:        Number(form.location_id),
      });
      onClose();
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="sn-overlay" onClick={onClose}>
      <div className="sn-modal" onClick={e => e.stopPropagation()}>
        <div className="sn-modal-header">
          <div>
            <h3 className="sn-modal-title">Создать ЦБУ</h3>
            <div className="sn-modal-subtitle">Центральный Блок Управления</div>
          </div>
          <button className="sn-modal-close" onClick={onClose}><IconClose/></button>
        </div>

        <div className="sn-modal-body">
          <div className="sn-cbu-preview">
            <div className="sn-cbu-preview-row">
              <span className="sn-cbu-preview-field">
                <span className="sn-cbu-preview-label">ID блока</span>
                <span className="sn-cbu-preview-val sn-cbu-preview-val--id">
                  {form.control_unit_id || "—"}
                </span>
              </span>
              <span className="sn-cbu-preview-field">
                <span className="sn-cbu-preview-label">Серийный №</span>
                <span className="sn-cbu-preview-val sn-cbu-preview-val--id">
                  {form.serial_number || "—"}
                </span>
              </span>
              <span className="sn-cbu-preview-field">
                <span className="sn-cbu-preview-label">Локация</span>
                <span className="sn-cbu-preview-val">
                  {form.location_id
                    ? locations.find(l => l.id === Number(form.location_id))?.name ?? "—"
                    : "—"}
                </span>
              </span>
              <span className="sn-cbu-preview-field">
                <span className="sn-cbu-preview-label">Название</span>
                <span className="sn-cbu-preview-val">{form.name || "—"}</span>
              </span>
            </div>
          </div>

          <div className="sn-field-grid" style={{ marginTop: 20 }}>
            <div className="sn-field">
              <label className="sn-field-label">ID блока <span style={{ color: "#ff5b5b" }}>*</span></label>
              <input
                className="sn-field-input sn-field-input--mono"
                type="text"
                placeholder="Напр.: CBU-001, B42"
                value={form.control_unit_id}
                onChange={e => setVal("control_unit_id", e.target.value)}
                autoFocus
                style={{ width: "100%" }}
              />
            </div>
            <div className="sn-field">
              <label className="sn-field-label">Серийный номер <span style={{ color: "#ff5b5b" }}>*</span></label>
              <input
                className="sn-field-input sn-field-input--mono"
                type="text"
                placeholder="Напр.: SN-123456"
                value={form.serial_number}
                onChange={e => setVal("serial_number", e.target.value)}
                style={{ width: "100%" }}
              />
            </div>
          </div>

          <div className="sn-field-grid">
            <div className="sn-field">
              <label className="sn-field-label">Название ЦБУ <span style={{ color: "#ff5b5b" }}>*</span></label>
              <input
                className="sn-field-input"
                type="text"
                placeholder="Напр.: Склад А, Холодная зона"
                value={form.name}
                onChange={e => setVal("name", e.target.value)}
                style={{ width: "100%" }}
              />
            </div>
            <div className="sn-field">
              <label className="sn-field-label">Локация <span style={{ color: "#ff5b5b" }}>*</span></label>
              <select
                className="sn-field-input sn-field-select"
                value={form.location_id}
                onChange={e => setVal("location_id", e.target.value)}
                style={{ width: "100%" }}
              >
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="sn-add-info-box" style={{ marginTop: 8 }}>
            <span style={{ fontSize: 11, color: "#929292", lineHeight: 1.6 }}>
              ID и серийный номер берутся с физического устройства. После создания ЦБУ можно добавлять датчики.
            </span>
          </div>

          {err && <div className="sn-modal-error">{err}</div>}
        </div>

        <div className="sn-modal-footer">
          <button className="sn-btn-cancel" onClick={onClose}>Отмена</button>
          <button className="sn-btn-save" onClick={handleSave} disabled={loading}>
            {loading ? "Создание..." : "Создать ЦБУ"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Modal: Добавить датчик ─────────────────────────────────
const AddSensorModal = ({ locations, blocks, defaultBlockId, onClose, onSave }) => {
  const [form, setForm] = useState({
    sensor_id: "",
    name: "",
    control_unit_id: defaultBlockId ?? blocks[0]?.id ?? "",
    normal_min_temp: "", normal_max_temp: "",
    warning_min_temp: "", warning_max_temp: "",
    alarm_min_temp: "", alarm_max_temp: "",
    normal_min_hum: "", normal_max_hum: "",
    warning_min_hum: "", warning_max_hum: "",
    alarm_min_hum: "", alarm_max_hum: "",
  });
  const [activeTab, setActiveTab] = useState("info");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const setVal = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const parseOpt = v => (v === "" || v == null) ? null : parseFloat(v);

  const selectedBlock = blocks.find(b => String(b.id) === String(form.control_unit_id));

  const handleSave = async () => {
    if (!form.sensor_id.trim())     { setErr("Введите ID датчика"); return; }
    if (!form.name.trim())          { setErr("Введите название датчика"); return; }
    if (!form.control_unit_id)      { setErr("Выберите блок (ЦБУ)"); return; }
    setLoading(true);
    setErr("");
    try {
      await onSave({
        sensor_id:        form.sensor_id.trim(),
        name:             form.name.trim(),
        control_unit_id:  form.control_unit_id,
        normal_min_temp:  parseOpt(form.normal_min_temp),
        normal_max_temp:  parseOpt(form.normal_max_temp),
        warning_min_temp: parseOpt(form.warning_min_temp),
        warning_max_temp: parseOpt(form.warning_max_temp),
        alarm_min_temp:   parseOpt(form.alarm_min_temp),
        alarm_max_temp:   parseOpt(form.alarm_max_temp),
        normal_min_hum:   parseOpt(form.normal_min_hum),
        normal_max_hum:   parseOpt(form.normal_max_hum),
        warning_min_hum:  parseOpt(form.warning_min_hum),
        warning_max_hum:  parseOpt(form.warning_max_hum),
        alarm_min_hum:    parseOpt(form.alarm_min_hum),
        alarm_max_hum:    parseOpt(form.alarm_max_hum),
      });
      onClose();
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="sn-overlay" onClick={onClose}>
      <div className="sn-modal sn-modal--wide" onClick={e => e.stopPropagation()}>
        <div className="sn-modal-header">
          <div>
            <h3 className="sn-modal-title">Добавить датчик</h3>
            <div className="sn-modal-subtitle">
              {selectedBlock ? `ЦБУ: ${selectedBlock.name} · ID ${selectedBlock.id}` : "Выберите ЦБУ"}
            </div>
          </div>
          <button className="sn-modal-close" onClick={onClose}><IconClose/></button>
        </div>

        <div className="sn-modal-tabs">
          <button className={`sn-modal-tab ${activeTab === "info" ? "sn-modal-tab--active" : ""}`} onClick={() => setActiveTab("info")}>
            Основное
          </button>
          <button className={`sn-modal-tab ${activeTab === "temp" ? "sn-modal-tab--active" : ""}`} onClick={() => setActiveTab("temp")}>
            🌡 Пороги темп.
          </button>
          <button className={`sn-modal-tab ${activeTab === "hum" ? "sn-modal-tab--active" : ""}`} onClick={() => setActiveTab("hum")}>
            💧 Пороги влаж.
          </button>
        </div>

        <div className="sn-modal-body">
          {activeTab === "info" && (
            <>
              <div className="sn-cbu-preview sn-cbu-preview--sensor">
                <div className="sn-cbu-preview-row">
                  <span className="sn-cbu-preview-field">
                    <span className="sn-cbu-preview-label">ID датчика</span>
                    <span className="sn-cbu-preview-val sn-cbu-preview-val--id">
                      {form.sensor_id || "—"}
                    </span>
                  </span>
                  <span className="sn-cbu-preview-field">
                    <span className="sn-cbu-preview-label">Название</span>
                    <span className="sn-cbu-preview-val">{form.name || "—"}</span>
                  </span>
                  <span className="sn-cbu-preview-field">
                    <span className="sn-cbu-preview-label">ЦБУ</span>
                    <span className="sn-cbu-preview-val">{selectedBlock?.name ?? "—"}</span>
                  </span>
                </div>
              </div>

              <div className="sn-field-grid" style={{ marginTop: 20 }}>
                <div className="sn-field">
                  <label className="sn-field-label">ID датчика <span style={{ color: "#ff5b5b" }}>*</span></label>
                  <input
                    className="sn-field-input sn-field-input--mono"
                    type="text"
                    placeholder="Напр.: S-001, T42"
                    value={form.sensor_id}
                    onChange={e => setVal("sensor_id", e.target.value)}
                    autoFocus
                    style={{ width: "100%" }}
                  />
                </div>
                <div className="sn-field">
                  <label className="sn-field-label">Название датчика <span style={{ color: "#ff5b5b" }}>*</span></label>
                  <input
                    className="sn-field-input"
                    type="text"
                    placeholder="Напр.: Стеллаж А1, Зона хранения"
                    value={form.name}
                    onChange={e => setVal("name", e.target.value)}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              <div className="sn-field">
                <label className="sn-field-label">ЦБУ (Центральный блок) <span style={{ color: "#ff5b5b" }}>*</span></label>
                <select
                  className="sn-field-input sn-field-select"
                  value={form.control_unit_id}
                  onChange={e => setVal("control_unit_id", e.target.value)}
                  style={{ width: "100%" }}
                >
                  {blocks.map(b => {
                    const loc = locations.find(l => l.id === (b.location_id ?? b.group_id));
                    return (
                      <option key={b.id} value={b.id}>
                        {b.name} (ID: {b.id}){loc ? ` · ${loc.name}` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="sn-add-info-box">
                <span style={{ fontSize: 11, color: "#929292", lineHeight: 1.6 }}>
                  ID берётся с физического устройства. Датчик передаёт: 🌡 Температуру · 💧 Влажность · 🔋 Батарею.
                  Пороги задаются на вкладках выше — необязательно.
                </span>
              </div>
            </>
          )}

          {activeTab === "temp" && (
            <ThresholdTable form={form} setVal={setVal} type="temp" />
          )}

          {activeTab === "hum" && (
            <ThresholdTable form={form} setVal={setVal} type="hum" />
          )}

          {err && <div className="sn-modal-error">{err}</div>}
        </div>

        <div className="sn-modal-footer">
          <button className="sn-btn-cancel" onClick={onClose}>Отмена</button>
          <button className="sn-btn-save" onClick={handleSave} disabled={loading}>
            {loading ? "Сохранение..." : "Добавить датчик"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── SensorMiniCard ───────────────────────────────────────────────────────────
const SensorMiniCard = ({ sensor, isReorderMode, onDragStart, onDragOver, onDrop, onEditThresholds, onDeleteSensor }) => {
  const st = STATUS[getSensorStatus(sensor)];
  const history = useSensorHistory(sensor.id);
  const tempData = history?.map(p => p.temperature) ?? null;
  const humData  = history?.map(p => p.humidity)    ?? null;
  const battery  = sensor.battery_level ?? null;
  const bc = battery > 50 ? "#01e676" : battery > 20 ? "#ffd550" : "#ff5b5b";
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <>
      <div
        className={`sn-sensor-card ${isReorderMode ? "sn-sensor-card--reorder" : ""}`}
        draggable={isReorderMode}
        onDragStart={isReorderMode ? onDragStart : undefined}
        onDragOver={isReorderMode ? (e => { e.preventDefault(); onDragOver(); }) : undefined}
        onDrop={isReorderMode ? onDrop : undefined}
      >
        <div className="sn-sensor-header">
          <div className="sn-sensor-id-group">
            {isReorderMode && <span className="sn-drag-handle"><IconDrag/></span>}
            <span className="sn-sensor-id-tag">ID {sensor.id}</span>
            <span className="sn-sensor-name">{sensor.name}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="sn-status-pill" style={{ color: st.color, background: st.bg }}>
              <span className="sn-status-dot" style={{ background: st.color }}/>
              {st.label}
            </span>
            {!isReorderMode && (
              <>
                <button className="sn-icon-btn" onClick={() => setShowEdit(true)} title="Настроить пороги">
                  <IconEdit/>
                </button>
                <button className="sn-icon-btn sn-icon-btn--danger" onClick={() => setShowDeleteConfirm(true)} title="Удалить датчик">
                  <IconTrash/>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="sn-sensor-vals">
          <div className="sn-sensor-val-item">
            <IconTherm/>
            <span className="sn-sensor-val-num" style={{ color: "#ffc207" }}>
              {sensor.current_temp != null ? `${parseFloat(sensor.current_temp).toFixed(1)}°C` : "—"}
            </span>
          </div>
          <div className="sn-sensor-val-div"/>
          <div className="sn-sensor-val-item">
            <IconDrop/>
            <span className="sn-sensor-val-num" style={{ color: "#07bcd4" }}>
              {sensor.current_hum != null ? `${parseFloat(sensor.current_hum).toFixed(1)}%` : "—"}
            </span>
          </div>
          {battery != null && (
            <>
              <div className="sn-sensor-val-div"/>
              <div className="sn-sensor-val-item" style={{ gap: 5 }}>
                <IconBattery pct={battery}/>
                <span style={{ fontSize: 11, color: bc, fontWeight: 500 }}>{battery}%</span>
              </div>
            </>
          )}
        </div>

        {!isReorderMode && (
          <div className="sn-charts-row">
            <div className="sn-chart-wrap">
              <div className="sn-chart-label"><IconTherm/> Температура</div>
              <ChartLegend sensor={sensor} type="temp"/>
              <div className="sn-chart-box">
                <Sparkline color="#ffc207" data={tempData} sensor={sensor} type="temp"/>
              </div>
            </div>
            <div className="sn-chart-wrap">
              <div className="sn-chart-label"><IconDrop/> Влажность</div>
              <ChartLegend sensor={sensor} type="hum"/>
              <div className="sn-chart-box">
                <Sparkline color="#07bcd4" data={humData} sensor={sensor} type="hum"/>
              </div>
            </div>
          </div>
        )}
      </div>

      {showEdit && (
        <ThresholdsModal
          sensor={sensor}
          onClose={() => setShowEdit(false)}
          onSave={async (payload) => {
            await onEditThresholds(sensor.id, payload);
            setShowEdit(false);
          }}
        />
      )}
      {showDeleteConfirm && (
        <ConfirmModal
          title="Удалить датчик"
          message={`Удалить датчик «${sensor.name}» (ID: ${sensor.id})? Это действие необратимо.`}
          confirmLabel="Удалить датчик"
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={async () => {
            await onDeleteSensor(sensor.id);
          }}
        />
      )}
    </>
  );
};

// ─── BlockCard ────────────────────────────────────────────────────────────────
const BlockCard = ({
  block,
  allSensors,
  allBlocks,
  locations,
  onEditThresholds,
  onReorderSensors,
  onAddSensor,
  onEditBlock,
  onDeleteBlock,
  onDeleteSensor,
  isSearching,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [sensorOrder, setSensorOrder] = useState([]);
  const [showEditBlock, setShowEditBlock] = useState(false);

  // ─── Новый стейт для флоу удаления ЦБУ ───────────────────────────────────
  // Возможные значения:
  //   null           — ничего не показываем
  //   "loading"      — загружаем список датчиков с сервера
  //   "confirmEmpty" — датчиков нет, показываем простое подтверждение
  //   "hasSensors"   — датчики есть, показываем DeleteBlockWithSensorsModal
  const [deleteState, setDeleteState]         = useState(null);
  const [blockSensors, setBlockSensors]       = useState([]);
  const [deleteCheckErr, setDeleteCheckErr]   = useState("");

  const dragSrc = useRef(null);

  useEffect(() => {
    if (isSearching) setExpanded(true);
  }, [isSearching]);

  const isSyntheticBlock = String(block.id).startsWith("__synthetic__");
  const syntheticLocId = isSyntheticBlock ? block.location_id ?? block.group_id : null;

  const childSensors = allSensors.filter(s => {
    if (isSyntheticBlock) {
      return s.group_id === syntheticLocId;
    }
    return String(s.control_unit_id) === String(block.id) ||
           String(s.group_id)        === String(block.id);
  });

  useEffect(() => {
    setSensorOrder(childSensors.map(s => s.id));
  }, [childSensors.length]);

  const orderedSensors = isReorderMode
    ? sensorOrder.map(id => childSensors.find(s => s.id === id)).filter(Boolean)
    : childSensors;

  const battery  = block.battery_level ?? null;
  const bc = battery > 50 ? "#01e676" : battery > 20 ? "#ffd550" : "#ff5b5b";
  const isOnline = block.status === "active" || block.status === "online";

  // Количество сенсоров: предпочитаем sensors_count из API, иначе считаем локально
  const sensorsCount = block.sensors_count ?? childSensors.length;

  const handleDragStart = (sensorId) => { dragSrc.current = sensorId; };
  const handleDragOver  = (targetId) => {
    if (!dragSrc.current || dragSrc.current === targetId) return;
    setSensorOrder(prev => {
      const arr = [...prev];
      const from = arr.indexOf(dragSrc.current);
      const to   = arr.indexOf(targetId);
      if (from === -1 || to === -1) return prev;
      arr.splice(from, 1);
      arr.splice(to, 0, dragSrc.current);
      return arr;
    });
  };
  const handleDragEnd = () => { dragSrc.current = null; };

  const handleSaveOrder = async () => {
    try {
      await onReorderSensors(sensorOrder);
    } catch (e) { console.error(e); }
    finally { setIsReorderMode(false); }
  };

  // ─── Клик на кнопку "Удалить ЦБУ" ────────────────────────────────────────
  // Шаг 1: запрашиваем список датчиков с сервера, не доверяем UI
  const handleDeleteClick = async (e) => {
    e.stopPropagation();
    setDeleteCheckErr("");
    setDeleteState("loading");
    try {
      const sensors = await apiGet(`/api/v1/control-units/${block.id}/sensors`);
      setBlockSensors(Array.isArray(sensors) ? sensors : []);
      if (!sensors || sensors.length === 0) {
        // Датчиков нет — переходим к простому подтверждению
        setDeleteState("confirmEmpty");
      } else {
        // Датчики есть — показываем предупреждение с выбором
        setDeleteState("hasSensors");
      }
    } catch (e) {
      setDeleteCheckErr(e.message);
      setDeleteState("error");
    }
  };

  const handleCloseDelete = () => {
    setDeleteState(null);
    setBlockSensors([]);
    setDeleteCheckErr("");
  };

  // Шаг 2a: обычное удаление (датчиков нет)
  const handleConfirmDelete = async () => {
    await onDeleteBlock(block.id);
  };

  // Шаг 2b: удаление с отвязкой датчиков
  const handleDetachAndDelete = async () => {
    await onDeleteBlock(block.id, true);
  };

  return (
    <>
      <div className="sn-block-card">
        <div className="sn-block-header" onClick={() => !isReorderMode && setExpanded(v => !v)}>
          <div className="sn-block-header-left">
            <span className="sn-block-chevron">{expanded ? <IconChevDown/> : <IconChevRight/>}</span>
            <div className="sn-block-name-group">
              <span className="sn-block-id-tag">ЦБУ #{block.id}</span>
              <span className="sn-block-name">{block.name}</span>
              {/* Отображаем sensors_count из API если доступно */}
              {block.sensors_count != null && (
                <span style={{
                  fontSize: 10,
                  color: block.sensors_count > 0 ? "#ffc207" : "#555",
                  background: block.sensors_count > 0 ? "#29220a" : "#1a1a1a",
                  border: `1px solid ${block.sensors_count > 0 ? "#ffc20733" : "#252525"}`,
                  borderRadius: 4,
                  padding: "1px 6px",
                  marginLeft: 4,
                }}>
                  {block.sensors_count} датч.
                </span>
              )}
            </div>
          </div>
          <div className="sn-block-header-right" onClick={e => e.stopPropagation()}>
            <div className="sn-block-indicators">
              <div className="sn-block-indicator" title={isOnline ? "Питание: Сеть" : "Питание: Офлайн"}>
                <IconPower on={isOnline}/>
                <span style={{ color: isOnline ? "#01e676" : "#555", fontSize: 10 }}>{isOnline ? "Сеть" : "Офф"}</span>
              </div>
              <div className="sn-block-indicator" title="GSM">
                <IconGSM/>
                <span style={{ fontSize: 10, color: "#929292" }}>{block.gsm_signal ?? "—"}</span>
              </div>
              <div className="sn-block-indicator" title="SIM баланс">
                <IconSim/>
                <span style={{ fontSize: 10, color: "#ffc207" }}>{block.sim_balance ?? "—"}</span>
              </div>
              {battery != null && (
                <div className="sn-block-indicator" title={`Батарея: ${battery}%`}>
                  <IconBattery pct={battery}/>
                  <span style={{ fontSize: 10, color: bc }}>{battery}%</span>
                </div>
              )}
            </div>
            <span className="sn-block-sensor-count">{sensorsCount} датч.</span>

            {!isReorderMode ? (
              expanded && (
                <>
                  <button
                    className="sn-add-sensor-btn"
                    title="Добавить датчик в этот ЦБУ"
                    onClick={e => { e.stopPropagation(); onAddSensor(block); }}
                  >
                    <IconPlus/> Датчик
                  </button>
                  <button
                    className="sn-reorder-btn"
                    title="Порядок датчиков (двойной клик)"
                    onDoubleClick={() => { setSensorOrder(childSensors.map(s => s.id)); setIsReorderMode(true); }}
                    onClick={e => e.stopPropagation()}
                  >
                    <IconDrag/> <span>Порядок</span>
                  </button>
                  {!isSyntheticBlock && (
                    <>
                      <button
                        className="sn-icon-btn"
                        title="Редактировать ЦБУ"
                        onClick={e => { e.stopPropagation(); setShowEditBlock(true); }}
                      >
                        <IconEdit/>
                      </button>
                      <button
                        className="sn-icon-btn sn-icon-btn--danger"
                        title="Удалить ЦБУ"
                        onClick={handleDeleteClick}
                        disabled={deleteState === "loading"}
                      >
                        {deleteState === "loading"
                          ? <span style={{ fontSize: 10, color: "#555" }}>...</span>
                          : <IconTrash/>
                        }
                      </button>
                    </>
                  )}
                </>
              )
            ) : (
              <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                <button className="sn-btn-cancel-sm" onClick={() => setIsReorderMode(false)}>Отмена</button>
                <button className="sn-btn-save-sm" onClick={handleSaveOrder}>Сохранить</button>
              </div>
            )}
          </div>
        </div>

        {/* Ошибка загрузки при проверке датчиков */}
        {deleteState === "error" && (
          <div style={{ padding: "8px 16px", background: "#2a100f", borderTop: "1px solid #ff5b5b33" }}>
            <span style={{ fontSize: 12, color: "#ff5b5b" }}>
              Не удалось проверить датчики: {deleteCheckErr}
            </span>
            <button
              onClick={handleCloseDelete}
              style={{ marginLeft: 12, fontSize: 11, color: "#929292", background: "none", border: "none", cursor: "pointer" }}
            >
              Закрыть
            </button>
          </div>
        )}

        {expanded && (
          <div className="sn-sensors-grid" onDragEnd={handleDragEnd}>
            {orderedSensors.length === 0 && (
              <div className="sn-empty-sensors">
                <div style={{ marginBottom: 12, color: "#555" }}>Нет датчиков в этом ЦБУ</div>
                <button className="sn-add-sensor-btn-empty" onClick={() => onAddSensor(block)}>
                  <IconPlus/> Добавить датчик
                </button>
              </div>
            )}
            {orderedSensors.map(sensor => (
              <SensorMiniCard
                key={sensor.id}
                sensor={sensor}
                isReorderMode={isReorderMode}
                onDragStart={() => handleDragStart(sensor.id)}
                onDragOver={() => handleDragOver(sensor.id)}
                onDrop={() => {}}
                onEditThresholds={onEditThresholds}
                onDeleteSensor={onDeleteSensor}
              />
            ))}
          </div>
        )}
      </div>

      {/* Редактирование ЦБУ */}
      {showEditBlock && (
        <EditBlockModal
          block={block}
          locations={locations}
          onClose={() => setShowEditBlock(false)}
          onSave={async (payload) => {
            await onEditBlock(block.id, payload);
            setShowEditBlock(false);
          }}
        />
      )}

      {/* Удаление: датчиков нет — простое подтверждение */}
      {deleteState === "confirmEmpty" && (
        <ConfirmModal
          title="Удалить ЦБУ"
          message={`Удалить блок «${block.name}» (ID: ${block.id})? Датчиков не привязано. Это действие необратимо.`}
          confirmLabel="Удалить ЦБУ"
          onClose={handleCloseDelete}
          onConfirm={handleConfirmDelete}
        />
      )}

      {/* Удаление: датчики есть — предупреждение с выбором */}
      {deleteState === "hasSensors" && (
        <DeleteBlockWithSensorsModal
          block={block}
          attachedSensors={blockSensors}
          onClose={handleCloseDelete}
          onDetachAndDelete={handleDetachAndDelete}
        />
      )}
    </>
  );
};

// ─── LocationSection ──────────────────────────────────────────────────────────
const LocationSection = ({
  location,
  blocks,
  allSensors,
  allBlocks,
  locations,
  onEditThresholds,
  onReorderSensors,
  onAddSensor,
  onEditBlock,
  onDeleteBlock,
  onDeleteSensor,
  isReorderLocMode,
  onLocDragStart,
  onLocDragOver,
  onLocDrop,
  isSearching,
}) => {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (isSearching) setExpanded(true);
  }, [isSearching]);

  const locBlocks = blocks.filter(b => b.group_id === location.id || b.location_id === location.id);
  const totalSensors = allSensors.filter(s =>
    locBlocks.some(b => b.id === s.group_id || b.id === s.control_unit_id)
  ).length;

  return (
    <div
      className={`sn-location-section ${isReorderLocMode ? "sn-location-section--reorder" : ""}`}
      draggable={isReorderLocMode}
      onDragStart={isReorderLocMode ? onLocDragStart : undefined}
      onDragOver={isReorderLocMode ? (e => { e.preventDefault(); onLocDragOver(); }) : undefined}
      onDrop={isReorderLocMode ? onLocDrop : undefined}
    >
      <div className="sn-location-header" onClick={() => !isReorderLocMode && setExpanded(v => !v)}>
        <div className="sn-location-header-left">
          {isReorderLocMode && <span className="sn-drag-handle" style={{ marginRight: 8 }}><IconDrag/></span>}
          <IconMapPin/>
          <span className="sn-location-name">{location.name}</span>
          <span className="sn-location-meta">{locBlocks.length} блок. · {totalSensors} датч.</span>
        </div>
        {!isReorderLocMode && (
          <span className="sn-location-chevron">{expanded ? <IconChevDown/> : <IconChevRight/>}</span>
        )}
      </div>

      {expanded && !isReorderLocMode && (
        <div className="sn-blocks-list">
          {locBlocks.length === 0 && <div className="sn-empty-location">Нет блоков в этой локации</div>}
          {locBlocks.map(block => (
            <BlockCard
              key={block.id}
              block={block}
              allSensors={allSensors}
              allBlocks={allBlocks}
              locations={locations}
              onEditThresholds={onEditThresholds}
              onReorderSensors={(order) => onReorderSensors(block.id, order)}
              onAddSensor={onAddSensor}
              onEditBlock={onEditBlock}
              onDeleteBlock={onDeleteBlock}
              onDeleteSensor={onDeleteSensor}
              isSearching={isSearching}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Sensors Component ───────────────────────────────────────────────────
const Sensors = () => {
  const [locations,  setLocations]  = useState([]);
  const [blocks,     setBlocks]     = useState([]);
  const [sensors,    setSensors]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  const [searchQuery,      setSearchQuery]      = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showLocDropdown,  setShowLocDropdown]  = useState(false);

  const [isReorderLocMode, setIsReorderLocMode] = useState(false);
  const [locOrder,         setLocOrder]         = useState([]);
  const locDragSrc = useRef(null);

  const [showCreateBlock, setShowCreateBlock]   = useState(false);
  const [showAddSensor,   setShowAddSensor]     = useState(false);
  const [addSensorBlock,  setAddSensorBlock]    = useState(null);

  const dropdownRef = useRef(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [locs, snrs, blks] = await Promise.all([
        apiGet("/api/v1/locations/"),
        apiGet("/api/v1/sensors/"),
        apiGet("/api/v1/control-units/").catch(() => []),
      ]);
      setLocations(locs);
      setSensors(snrs);
      setBlocks(blks);

      console.group("📡 Sensors page — raw API data");
      console.log("📍 Locations:", JSON.stringify(locs, null, 2));
      console.log("🔲 Control units:", JSON.stringify(blks, null, 2));
      console.log("🌡 Sensors:", JSON.stringify(snrs, null, 2));
      console.groupEnd();

      const saved = loadLocOrder();
      if (saved && saved.length > 0) {
        const existingIds = locs.map(l => l.id);
        const filtered = saved.filter(id => existingIds.includes(id));
        const newIds = existingIds.filter(id => !filtered.includes(id));
        setLocOrder([...filtered, ...newIds]);
      } else {
        setLocOrder(locs.map(l => l.id));
      }

      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    const id = setInterval(() => {
      apiGet("/api/v1/sensors/").then(s => setSensors(s)).catch(() => {});
    }, 10000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowLocDropdown(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleEditThresholds = async (sensorId, payload) => {
    await apiPatch(`/api/v1/sensors/${sensorId}/thresholds`, payload);
    await fetchAll();
  };

  const handleAddSensor = async (payload) => {
    await apiPost("/api/v1/sensors/create_sensor", payload);
    await fetchAll();
  };

  const handleCreateBlock = async (payload) => {
    await apiPost("/api/v1/control-units/register", payload);
    await fetchAll();
  };

  const handleDeleteSensor = async (sensorId) => {
    await apiDelete(`/api/v1/sensors/${sensorId}`);
    await fetchAll();
  };

  const handleEditBlock = async (blockId, payload) => {
    await apiPatch(`/api/v1/control-units/${blockId}`, payload);
    await fetchAll();
  };

  // ─── Удаление ЦБУ ────────────────────────────────────────────────────────
  // detach=true  → DELETE /api/v1/control-units/{id}?detach_sensors=true
  // detach=false → DELETE /api/v1/control-units/{id}  (обычное, только если нет датчиков)
  const handleDeleteBlock = async (blockId, detach = false) => {
    const url = detach
      ? `/api/v1/control-units/${blockId}?detach_sensors=true`
      : `/api/v1/control-units/${blockId}`;
    await apiDelete(url);
    await fetchAll();
  };

  const handleReorderSensors = async (blockId, orderedIds) => {
    await Promise.all(
      orderedIds.map((id, idx) =>
        apiPatch(`/api/v1/sensors/${id}/position`, { position: idx })
      )
    );
    await fetchAll();
  };

  const handleLocDragStart = (locId) => { locDragSrc.current = locId; };
  const handleLocDragOver  = (targetId) => {
    if (!locDragSrc.current || locDragSrc.current === targetId) return;
    setLocOrder(prev => {
      const arr = [...prev];
      const from = arr.indexOf(locDragSrc.current);
      const to   = arr.indexOf(targetId);
      if (from === -1 || to === -1) return prev;
      arr.splice(from, 1);
      arr.splice(to, 0, locDragSrc.current);
      return arr;
    });
  };
  const handleLocDragEnd = () => { locDragSrc.current = null; };

  const handleSaveLocOrder = async () => {
    saveLocOrder(locOrder);
    try {
      await Promise.all(
        locOrder.map((id, idx) =>
          apiPatch(`/api/v1/locations/${id}`, { display_order: idx }).catch(() => {})
        )
      );
    } catch (e) { console.error("Не удалось сохранить порядок на сервере:", e); }
    setIsReorderLocMode(false);
  };

  const q = searchQuery.toLowerCase().trim();
  const isSearching = q.length > 0;

  const filteredSensors = sensors.filter(s => {
    const sBlock = blocks.find(b => String(b.id) === String(s.control_unit_id ?? s.group_id));
    const loc = sBlock
      ? locations.find(l => l.id === (sBlock.location_id ?? sBlock.group_id))
      : locations.find(l => l.id === s.group_id);

    const matchSearch = !isSearching
      || String(s.id).includes(q)
      || s.name?.toLowerCase().includes(q)
      || loc?.name?.toLowerCase().includes(q)
      || sBlock?.name?.toLowerCase().includes(q);
    const matchLoc = !selectedLocation || (sBlock
      ? (sBlock.location_id === selectedLocation || sBlock.group_id === selectedLocation)
      : s.group_id === selectedLocation);
    return matchSearch && matchLoc;
  });

  const orderedLocations = locOrder.map(id => locations.find(l => l.id === id)).filter(Boolean);

  const getBlocksForLocation = (locId) => {
    const real = blocks.filter(b => b.location_id === locId || b.group_id === locId);

    const realBlockIds = new Set(real.map(b => String(b.id)));
    const orphanSensors = sensors.filter(s => {
      const cuId = String(s.control_unit_id ?? s.group_id ?? "");
      return s.group_id === locId && !realBlockIds.has(cuId);
    });

    const syntheticBlocks = orphanSensors.length > 0 ? [{
      id: `__synthetic__${locId}`,
      name: locations.find(l => l.id === locId)?.name ?? `Блок #${locId}`,
      location_id: locId,
      group_id: locId,
      __synthetic: true,
      status: orphanSensors.some(s => s.status === "active") ? "active" : "offline",
      battery_level: null,
      gsm_signal: null,
      sim_balance: null,
    }] : [];

    if (real.length === 0 && syntheticBlocks.length === 0) {
      return [{
        id: `__synthetic__${locId}`,
        name: locations.find(l => l.id === locId)?.name ?? `Блок #${locId}`,
        location_id: locId,
        group_id: locId,
        __synthetic: true,
        status: "offline",
        battery_level: null,
        gsm_signal: null,
        sim_balance: null,
      }];
    }

    return [...real, ...syntheticBlocks];
  };

  const allBlocksForModal = blocks.length > 0
    ? blocks
    : locations.map(loc => ({
        id: loc.id,
        name: loc.name,
        location_id: loc.id,
        group_id: loc.id,
      }));

  if (loading) return (
    <div className="sn-container" style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", color:"#555", fontSize: 14 }}>
      Загрузка данных...
    </div>
  );

  if (error) return (
    <div className="sn-container" style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", gap: 16 }}>
      <div style={{ color:"#ff5b5b", fontSize: 14 }}>Ошибка: {error}</div>
      <button onClick={fetchAll} style={{ padding:"8px 20px", borderRadius:8, border:"1px solid #ff5b5b", background:"transparent", color:"#ff5b5b", cursor:"pointer", fontFamily:"inherit" }}>Повторить</button>
    </div>
  );

  return (
    <div className="sn-container">
      <main className="sn-main">

        <div className="sn-page-header">
          <div>
            <h1 className="sn-page-title">Датчики</h1>
            <p className="sn-page-sub">Мониторинг в реальном времени · {sensors.length} датчиков · {locations.length} локаций</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {!isReorderLocMode ? (
              <>
                <button
                  className="sn-reorder-loc-btn"
                  onDoubleClick={() => { setLocOrder(locations.map(l => l.id)); setIsReorderLocMode(true); }}
                  title="Изменить порядок локаций (двойной клик)"
                >
                  <IconDrag/> Порядок локаций
                </button>
                <button
                  className="sn-add-btn sn-add-btn--secondary"
                  onClick={() => { setAddSensorBlock(null); setShowAddSensor(true); }}
                  title="Добавить датчик к существующему ЦБУ"
                >
                  <IconPlus/> Датчик
                </button>
                <button
                  className="sn-add-btn"
                  onClick={() => setShowCreateBlock(true)}
                >
                  <IconBlock/> Создать ЦБУ
                </button>
              </>
            ) : (
              <>
                <button
                  className="sn-btn-cancel"
                  onClick={() => setIsReorderLocMode(false)}
                  style={{ height: 38, padding: "0 16px" }}
                >
                  Отмена
                </button>
                <button
                  className="sn-btn-save"
                  onClick={handleSaveLocOrder}
                  style={{ height: 38, padding: "0 16px" }}
                >
                  Сохранить порядок
                </button>
              </>
            )}
          </div>
        </div>

        {!isReorderLocMode && (
          <div className="sn-controls-row">
            <div className="sn-search-box">
              <IconSearch/>
              <input
                className="sn-search-input"
                placeholder="Поиск по ID, названию датчика, ЦБУ, локации..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="sn-search-clear" onClick={() => setSearchQuery("")}>
                  <IconClose/>
                </button>
              )}
            </div>

            <div className="sn-loc-dropdown-wrap" ref={dropdownRef}>
              <button className="sn-loc-dropdown-btn" onClick={() => setShowLocDropdown(v => !v)}>
                <IconMapPin/>
                <span>{selectedLocation ? locations.find(l => l.id === selectedLocation)?.name : "Все локации"}</span>
                <IconChevDown/>
              </button>
              {showLocDropdown && (
                <div className="sn-loc-dropdown">
                  <div
                    className={`sn-loc-option ${!selectedLocation ? "sn-loc-option--active" : ""}`}
                    onClick={() => { setSelectedLocation(null); setShowLocDropdown(false); }}
                  >
                    Все локации
                  </div>
                  {locations.map(loc => (
                    <div
                      key={loc.id}
                      className={`sn-loc-option ${selectedLocation === loc.id ? "sn-loc-option--active" : ""}`}
                      onClick={() => { setSelectedLocation(loc.id); setShowLocDropdown(false); }}
                    >
                      <IconMapPin/>
                      {loc.name}
                      <span className="sn-loc-option-count">
                        {sensors.filter(s => {
                          const b = blocks.find(bl => String(bl.id) === String(s.control_unit_id ?? s.group_id));
                          return b ? (b.location_id === loc.id || b.group_id === loc.id) : s.group_id === loc.id;
                        }).length}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {isSearching ? (
          <div className="sn-search-results">
            <div className="sn-search-results-title">{filteredSensors.length} результат(ов)</div>
            <div className="sn-sensors-grid">
              {filteredSensors.map(sensor => (
                <SensorMiniCard
                  key={sensor.id}
                  sensor={sensor}
                  isReorderMode={false}
                  onDragStart={() => {}}
                  onDragOver={() => {}}
                  onDrop={() => {}}
                  onEditThresholds={handleEditThresholds}
                  onDeleteSensor={handleDeleteSensor}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="sn-locations-list" onDragEnd={handleLocDragEnd}>
            {orderedLocations.length === 0 && <div className="sn-empty-state">Нет локаций</div>}
            {orderedLocations.map(loc => {
              if (selectedLocation && loc.id !== selectedLocation) return null;
              const locBlocks = getBlocksForLocation(loc.id);
              const locSensors = sensors.filter(s => {
                const viaBlock = locBlocks.some(b => {
                  if (String(b.id).startsWith("__synthetic__")) return false;
                  return String(s.control_unit_id) === String(b.id) ||
                         String(s.group_id)        === String(b.id);
                });
                if (viaBlock) return true;
                return s.group_id === loc.id;
              });

              return (
                <LocationSection
                  key={loc.id}
                  location={loc}
                  blocks={locBlocks}
                  allSensors={locSensors}
                  allBlocks={allBlocksForModal}
                  locations={locations}
                  onEditThresholds={handleEditThresholds}
                  onReorderSensors={handleReorderSensors}
                  onAddSensor={(blk) => { setAddSensorBlock(blk); setShowAddSensor(true); }}
                  onEditBlock={handleEditBlock}
                  onDeleteBlock={handleDeleteBlock}
                  onDeleteSensor={handleDeleteSensor}
                  isReorderLocMode={isReorderLocMode}
                  onLocDragStart={() => handleLocDragStart(loc.id)}
                  onLocDragOver={() => handleLocDragOver(loc.id)}
                  onLocDrop={() => {}}
                  isSearching={isSearching}
                />
              );
            })}
          </div>
        )}
      </main>

      {showCreateBlock && (
        <CreateBlockModal
          locations={locations}
          onClose={() => setShowCreateBlock(false)}
          onSave={handleCreateBlock}
        />
      )}

      {showAddSensor && (
        <AddSensorModal
          locations={locations}
          blocks={allBlocksForModal}
          defaultBlockId={addSensorBlock?.id}
          onClose={() => setShowAddSensor(false)}
          onSave={handleAddSensor}
        />
      )}
    </div>
  );
};

export default Sensors;