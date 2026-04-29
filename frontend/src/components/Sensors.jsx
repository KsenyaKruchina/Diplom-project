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
    throw new Error(err.detail || `Ошибка ${res.status}`);
  }
  return res.json();
};

const apiGet    = (path)        => apiFetch(path);
const apiPatch  = (path, body)  => apiFetch(path, { method: "PATCH", body: JSON.stringify(body) });
const apiPost   = (path, body)  => apiFetch(path, { method: "POST",  body: JSON.stringify(body) });

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
const IconDrag      = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="5.5" cy="4" r="1" fill="#555"/><circle cx="10.5" cy="4" r="1" fill="#555"/><circle cx="5.5" cy="8" r="1" fill="#555"/><circle cx="10.5" cy="8" r="1" fill="#555"/><circle cx="5.5" cy="12" r="1" fill="#555"/><circle cx="10.5" cy="12" r="1" fill="#555"/></svg>;
const IconMapPin    = () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 1a5 5 0 0 1 5 5c0 4-5 9-5 9S3 10 3 6a5 5 0 0 1 5-5z" stroke="#929292" strokeWidth="1.3"/><circle cx="8" cy="6" r="1.5" fill="#929292"/></svg>;
const IconPlus      = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><line x1="8" y1="3" x2="8" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="3" y1="8" x2="13" y2="8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;

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

// ─── Modal: Thresholds ────────────────────────────────────────────────────────
const ThresholdsModal = ({ sensor, onClose, onSave }) => {
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

  const NF = ({ label, fkey, color }) => (
    <div className="sn-field">
      <label className="sn-field-label" style={{ color: color || undefined }}>{label}</label>
      <input 
        className="sn-field-input" 
        type="text" 
        inputMode="decimal"
        value={form[fkey] === null ? "" : form[fkey]}
        onChange={e => setVal(fkey, e.target.value)}
        placeholder="—"
        style={{ 
          borderColor: form[fkey] !== "" && form[fkey] !== null && form[fkey] !== undefined ? (color + "66") : undefined,
          width: "100%"
        }}
      />
    </div>
  );

  return (
    <div className="sn-overlay" onClick={onClose}>
      <div className="sn-modal" onClick={e => e.stopPropagation()}>
        <div className="sn-modal-header">
          <h3 className="sn-modal-title">Пороговые значения — {sensor?.name}</h3>
          <button className="sn-modal-close" onClick={onClose}><IconClose/></button>
        </div>
        <div className="sn-modal-body">
          <div className="sn-modal-section-title">🌡 Температура (°C)</div>
          <div className="sn-threshold-section">
            <div className="sn-threshold-title" style={{ color: "#01e676" }}>🟢 Норма</div>
            <div className="sn-field-grid">
              <NF label="Мин." fkey="normal_min_temp" color="#01e676"/>
              <NF label="Макс." fkey="normal_max_temp" color="#01e676"/>
            </div>
          </div>
          <div className="sn-threshold-section">
            <div className="sn-threshold-title" style={{ color: "#ffd550" }}>🟡 Внимание</div>
            <div className="sn-field-grid">
              <NF label="Мин." fkey="warning_min_temp" color="#ffd550"/>
              <NF label="Макс." fkey="warning_max_temp" color="#ffd550"/>
            </div>
          </div>
          <div className="sn-threshold-section">
            <div className="sn-threshold-title" style={{ color: "#ff5b5b" }}>🔴 Тревога</div>
            <div className="sn-field-grid">
              <NF label="Мин." fkey="alarm_min_temp" color="#ff5b5b"/>
              <NF label="Макс." fkey="alarm_max_temp" color="#ff5b5b"/>
            </div>
          </div>
          <div className="sn-modal-section-title" style={{ marginTop: 8 }}>💧 Влажность (%)</div>
          <div className="sn-threshold-section">
            <div className="sn-threshold-title" style={{ color: "#01e676" }}>🟢 Норма</div>
            <div className="sn-field-grid">
              <NF label="Мин." fkey="normal_min_hum" color="#01e676"/>
              <NF label="Макс." fkey="normal_max_hum" color="#01e676"/>
            </div>
          </div>
          <div className="sn-threshold-section">
            <div className="sn-threshold-title" style={{ color: "#ffd550" }}>🟡 Внимание</div>
            <div className="sn-field-grid">
              <NF label="Мин." fkey="warning_min_hum" color="#ffd550"/>
              <NF label="Макс." fkey="warning_max_hum" color="#ffd550"/>
            </div>
          </div>
          <div className="sn-threshold-section">
            <div className="sn-threshold-title" style={{ color: "#ff5b5b" }}>🔴 Тревога</div>
            <div className="sn-field-grid">
              <NF label="Мин." fkey="alarm_min_hum" color="#ff5b5b"/>
              <NF label="Макс." fkey="alarm_max_hum" color="#ff5b5b"/>
            </div>
          </div>
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

// ─── Modal: Добавить датчик ─────────────────────────────────
const AddSensorModal = ({ locations, defaultLocationId, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: "",
    group_id: defaultLocationId ?? locations[0]?.id ?? "",
    normal_min_temp: "", normal_max_temp: "",
    warning_min_temp: "", warning_max_temp: "",
    alarm_min_temp: "", alarm_max_temp: "",
    normal_min_hum: "", normal_max_hum: "",
    warning_min_hum: "", warning_max_hum: "",
    alarm_min_hum: "", alarm_max_hum: "",
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const setVal = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const parseOpt = v => (v === "" || v == null) ? null : parseFloat(v);

  const handleSave = async () => {
    if (!form.name.trim()) { setErr("Введите название датчика"); return; }
    if (!form.group_id) { setErr("Выберите локацию"); return; }
    setLoading(true);
    setErr("");
    try {
      await onSave({
        name: form.name.trim(),
        group_id: Number(form.group_id),
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

  const NF = ({ label, fkey, color, placeholder }) => (
    <div className="sn-field">
      <label className="sn-field-label" style={{ color: color || undefined }}>{label}</label>
      <input
        className="sn-field-input"
        type="text"
        inputMode="decimal"
        value={form[fkey]}
        onChange={e => setVal(fkey, e.target.value)}
        placeholder={placeholder ?? "—"}
        style={{ 
          borderColor: form[fkey] !== "" && color ? (color + "55") : undefined,
          width: "100%"
        }}
      />
    </div>
  );

  return (
    <div className="sn-overlay" onClick={onClose}>
      <div className="sn-modal sn-modal--wide" onClick={e => e.stopPropagation()}>
        <div className="sn-modal-header">
          <h3 className="sn-modal-title">Добавить датчик</h3>
          <button className="sn-modal-close" onClick={onClose}><IconClose/></button>
        </div>

        <div className="sn-modal-body">
          <div className="sn-field">
            <label className="sn-field-label">Название датчика *</label>
            <input
              className="sn-field-input"
              type="text"
              placeholder="Напр.: Стеллаж А1, Зона хранения"
              value={form.name}
              onChange={e => setVal("name", e.target.value)}
              autoFocus
              style={{ width: "100%" }}
            />
          </div>

          <div className="sn-field">
            <label className="sn-field-label">Локация *</label>
            <select
              className="sn-field-input sn-field-select"
              value={form.group_id}
              onChange={e => setVal("group_id", e.target.value)}
              style={{ width: "100%" }}
            >
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          <div className="sn-add-info-box">
            <span style={{ fontSize: 11, color: "#929292", lineHeight: 1.6 }}>
              Датчик передаёт: 🌡 Температуру · 💧 Влажность · 🔋 Уровень заряда батареи
            </span>
          </div>

          <div className="sn-modal-section-title">🌡 Температура (°C) — необязательно</div>
          <div className="sn-threshold-section">
            <div className="sn-threshold-title" style={{ color: "#01e676" }}>🟢 Норма</div>
            <div className="sn-field-grid">
              <NF label="Мин." fkey="normal_min_temp" color="#01e676" placeholder="напр. 18"/>
              <NF label="Макс." fkey="normal_max_temp" color="#01e676" placeholder="напр. 24"/>
            </div>
          </div>
          <div className="sn-threshold-section">
            <div className="sn-threshold-title" style={{ color: "#ffd550" }}>🟡 Внимание</div>
            <div className="sn-field-grid">
              <NF label="Мин." fkey="warning_min_temp" color="#ffd550" placeholder="напр. 15"/>
              <NF label="Макс." fkey="warning_max_temp" color="#ffd550" placeholder="напр. 26"/>
            </div>
          </div>
          <div className="sn-threshold-section">
            <div className="sn-threshold-title" style={{ color: "#ff5b5b" }}>🔴 Тревога</div>
            <div className="sn-field-grid">
              <NF label="Мин." fkey="alarm_min_temp" color="#ff5b5b" placeholder="напр. 10"/>
              <NF label="Макс." fkey="alarm_max_temp" color="#ff5b5b" placeholder="напр. 30"/>
            </div>
          </div>

          <div className="sn-modal-section-title" style={{ marginTop: 4 }}>💧 Влажность (%) — необязательно</div>
          <div className="sn-threshold-section">
            <div className="sn-threshold-title" style={{ color: "#01e676" }}>🟢 Норма</div>
            <div className="sn-field-grid">
              <NF label="Мин." fkey="normal_min_hum" color="#01e676" placeholder="напр. 40"/>
              <NF label="Макс." fkey="normal_max_hum" color="#01e676" placeholder="напр. 60"/>
            </div>
          </div>
          <div className="sn-threshold-section">
            <div className="sn-threshold-title" style={{ color: "#ffd550" }}>🟡 Внимание</div>
            <div className="sn-field-grid">
              <NF label="Мин." fkey="warning_min_hum" color="#ffd550" placeholder="напр. 35"/>
              <NF label="Макс." fkey="warning_max_hum" color="#ffd550" placeholder="напр. 65"/>
            </div>
          </div>
          <div className="sn-threshold-section">
            <div className="sn-threshold-title" style={{ color: "#ff5b5b" }}>🔴 Тревога</div>
            <div className="sn-field-grid">
              <NF label="Мин." fkey="alarm_min_hum" color="#ff5b5b" placeholder="напр. 20"/>
              <NF label="Макс." fkey="alarm_max_hum" color="#ff5b5b" placeholder="напр. 80"/>
            </div>
          </div>

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
const SensorMiniCard = ({ sensor, isReorderMode, onDragStart, onDragOver, onDrop, onEditThresholds }) => {
  const st = STATUS[getSensorStatus(sensor)];
  const history = useSensorHistory(sensor.id);
  const tempData = history?.map(p => p.temperature) ?? null;
  const humData  = history?.map(p => p.humidity)    ?? null;
  const battery  = sensor.battery_level ?? null;
  const bc = battery > 50 ? "#01e676" : battery > 20 ? "#ffd550" : "#ff5b5b";
  const [showEdit, setShowEdit] = useState(false);

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
              <button className="sn-icon-btn" onClick={() => setShowEdit(true)} title="Настроить пороги">
                <IconEdit/>
              </button>
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
    </>
  );
};

// ─── BlockCard ────────────────────────────────────────────────────────────────
const BlockCard = ({ block, allSensors, onEditThresholds, onReorderSensors, onAddSensor, isSearching }) => {
  // 🔧 ИСПРАВЛЕНИЕ: начальное состояние false (закрыто)
  const [expanded, setExpanded] = useState(false);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [sensorOrder, setSensorOrder] = useState([]);
  const dragSrc = useRef(null);

  // 🔧 ДОБАВЛЕНО: автоматическое раскрытие при поиске
  useEffect(() => {
    if (isSearching) {
      setExpanded(true);
    }
  }, [isSearching]);

  const childSensors = allSensors.filter(s => s.group_id === block.id);

  useEffect(() => {
    setSensorOrder(childSensors.map(s => s.id));
  }, [childSensors.length]);

  const orderedSensors = isReorderMode
    ? sensorOrder.map(id => childSensors.find(s => s.id === id)).filter(Boolean)
    : childSensors;

  const battery = block.battery_level ?? null;
  const bc = battery > 50 ? "#01e676" : battery > 20 ? "#ffd550" : "#ff5b5b";
  const isOnline = block.status === "active";

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
    finally {
      setIsReorderMode(false);
    }
  };

  return (
    <div className="sn-block-card">
      <div className="sn-block-header" onClick={() => !isReorderMode && setExpanded(v => !v)}>
        <div className="sn-block-header-left">
          <span className="sn-block-chevron">{expanded ? <IconChevDown/> : <IconChevRight/>}</span>
          <div className="sn-block-name-group">
            <span className="sn-block-id-tag">Блок #{block.id}</span>
            <span className="sn-block-name">{block.name}</span>
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
          <span className="sn-block-sensor-count">{childSensors.length} датч.</span>

          {!isReorderMode ? (
            expanded && (
              <>
                <button
                  className="sn-add-sensor-btn"
                  title="Добавить датчик в блок"
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

      {expanded && (
        <div className="sn-sensors-grid" onDragEnd={handleDragEnd}>
          {orderedSensors.length === 0 && (
            <div className="sn-empty-sensors">
              <div style={{ marginBottom: 12, color: "#555" }}>Нет датчиков в этом блоке</div>
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
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── LocationSection ──────────────────────────────────────────────────────────
const LocationSection = ({ location, blocks, allSensors, onEditThresholds, onReorderSensors, onAddSensor,
  isReorderLocMode, onLocDragStart, onLocDragOver, onLocDrop, isSearching }) => {
  // 🔧 ИСПРАВЛЕНИЕ: начальное состояние false (закрыто)
  const [expanded, setExpanded] = useState(false);
  
  // 🔧 ДОБАВЛЕНО: автоматическое раскрытие при поиске
  useEffect(() => {
    if (isSearching) {
      setExpanded(true);
    }
  }, [isSearching]);
  
  const locBlocks = blocks.filter(b => b.group_id === location.id || b.location_id === location.id);
  const totalSensors = allSensors.filter(s => locBlocks.some(b => b.id === s.group_id)).length;

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
              onEditThresholds={onEditThresholds}
              onReorderSensors={(order) => onReorderSensors(block.id, order)}
              onAddSensor={onAddSensor}
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
  const [sensors,    setSensors]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  const [searchQuery,      setSearchQuery]      = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showLocDropdown,  setShowLocDropdown]  = useState(false);

  const [isReorderLocMode, setIsReorderLocMode] = useState(false);
  const [locOrder,         setLocOrder]         = useState([]);
  const locDragSrc = useRef(null);

  const [showAddSensor, setShowAddSensor]   = useState(false);
  const [addSensorBlock, setAddSensorBlock] = useState(null);

  const dropdownRef = useRef(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [locs, snrs] = await Promise.all([
        apiGet("/api/v1/locations/"),
        apiGet("/api/v1/sensors/"),
      ]);
      setLocations(locs);

      const saved = loadLocOrder();
      if (saved && saved.length > 0) {
        const existingIds = locs.map(l => l.id);
        const filtered = saved.filter(id => existingIds.includes(id));
        const newIds = existingIds.filter(id => !filtered.includes(id));
        setLocOrder([...filtered, ...newIds]);
      } else {
        setLocOrder(locs.map(l => l.id));
      }

      setSensors(snrs);
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
    await apiPatch(`/api/v1/sensors/${sensorId}`, payload);
    await fetchAll();
  };

  const handleAddSensor = async (payload) => {
    await apiPost("/api/v1/sensors/create_sensor", payload);
    await fetchAll();
  };

  const handleReorderSensors = async (blockId, orderedIds) => {
    await Promise.all(
      orderedIds.map((id, idx) => apiPatch(`/api/v1/sensors/${id}`, { display_order: idx }))
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
    } catch (e) {
      console.error("Не удалось сохранить порядок на сервере:", e);
    }
    setIsReorderLocMode(false);
  };

  const q = searchQuery.toLowerCase().trim();
  const isSearching = q.length > 0;
  
  const filteredSensors = sensors.filter(s => {
    const loc = locations.find(l => l.id === s.group_id);
    const matchSearch = !isSearching
      || String(s.id).includes(q)
      || s.name?.toLowerCase().includes(q)
      || loc?.name?.toLowerCase().includes(q);
    const matchLoc = !selectedLocation || s.group_id === selectedLocation;
    return matchSearch && matchLoc;
  });

  const orderedLocations = locOrder.map(id => locations.find(l => l.id === id)).filter(Boolean);

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
                <button className="sn-add-btn" onClick={() => { setAddSensorBlock(null); setShowAddSensor(true); }}>
                  <IconPlus/> Добавить датчик
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
                placeholder="Поиск по ID, названию датчика, локации..."
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
                  <div className={`sn-loc-option ${!selectedLocation ? "sn-loc-option--active" : ""}`}
                    onClick={() => { setSelectedLocation(null); setShowLocDropdown(false); }}>
                    Все локации
                  </div>
                  {locations.map(loc => (
                    <div key={loc.id}
                      className={`sn-loc-option ${selectedLocation === loc.id ? "sn-loc-option--active" : ""}`}
                      onClick={() => { setSelectedLocation(loc.id); setShowLocDropdown(false); }}>
                      <IconMapPin/>
                      {loc.name}
                      <span className="sn-loc-option-count">{sensors.filter(s => s.group_id === loc.id).length}</span>
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
                <SensorMiniCard key={sensor.id} sensor={sensor} isReorderMode={false}
                  onDragStart={() => {}} onDragOver={() => {}} onDrop={() => {}}
                  onEditThresholds={handleEditThresholds}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="sn-locations-list" onDragEnd={handleLocDragEnd}>
            {orderedLocations.length === 0 && <div className="sn-empty-state">Нет локаций</div>}
            {orderedLocations.map(loc => {
              if (selectedLocation && loc.id !== selectedLocation) return null;
              const locSensors = sensors.filter(s => s.group_id === loc.id);
              const block = {
                id: loc.id,
                name: loc.name,
                group_id: loc.id,
                status: locSensors.some(s => s.status === "active") ? "active" : "offline",
                battery_level: null,
                gsm_signal: null,
                sim_balance: null,
              };

              return (
                <LocationSection
                  key={loc.id}
                  location={loc}
                  blocks={[block]}
                  allSensors={locSensors}
                  onEditThresholds={handleEditThresholds}
                  onReorderSensors={handleReorderSensors}
                  onAddSensor={(blk) => { setAddSensorBlock(blk); setShowAddSensor(true); }}
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

      {showAddSensor && (
        <AddSensorModal
          locations={locations}
          defaultLocationId={addSensorBlock?.group_id ?? addSensorBlock?.id}
          onClose={() => setShowAddSensor(false)}
          onSave={handleAddSensor}
        />
      )}
    </div>
  );
};

export default Sensors;