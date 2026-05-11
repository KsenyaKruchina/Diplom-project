// frontend/src/components/Dashboard.jsx
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import "./Dashboard.css";
import { useAuth } from "../context/AuthContext";
import { useDashboardData } from "../hooks/useDashboardData";
import { updateAlarmStatus, alarmToNotification, countAlarms } from "../services/alarmsService";

const BASE_URL = "http://157.90.127.202:8000";

// ─── API helpers ──────────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem("token");

const apiGet = async (path) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
};

const apiPatch = async (path, body) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Ошибка ${res.status}`);
  }
  return res.json();
};

const apiDelete = async (path) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Ошибка ${res.status}`);
  }
  return res.ok;
};

const apiUploadPlan = async (locationId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE_URL}/api/v1/locations/${locationId}/upload-plan`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Ошибка загрузки плана: ${res.status}`);
  }
  return res.json();
};

const apiCreateLocation = async (name, file) => {
  const formData = new FormData();
  formData.append("name", name);
  if (file) formData.append("file", file);
  const res = await fetch(`${BASE_URL}/api/v1/locations/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Ошибка создания: ${res.status}`);
  }
  return res.json();
};

// ─── Построение URL изображения ───────────────────────────────────────────────
const imgUrl = (image_url) => {
  if (!image_url) return null;
  if (image_url.startsWith("http://") || image_url.startsWith("https://")) return image_url;
  const path = image_url.startsWith("/") ? image_url : `/${image_url}`;
  return `${BASE_URL}${path}`;
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconError   = ({ color = "#ff5b5b" }) => <svg width="20" height="20" viewBox="0 0 24 24" fill={color}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>;
const IconWarning = ({ color = "#ffd550" }) => <svg width="20" height="20" viewBox="0 0 24 24" fill={color}><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>;
const IconCheck   = ({ color = "#01e676" }) => <svg width="20" height="20" viewBox="0 0 24 24" fill={color}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>;
const IconPlus    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>;
const IconEdit    = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconPin     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const IconSensor  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M6.3 6.3a8 8 0 0 0 0 11.4M17.7 6.3a8 8 0 0 1 0 11.4M3.5 3.5a12 12 0 0 0 0 17M20.5 3.5a12 12 0 0 1 0 17"/></svg>;
const IconBattery = ({ level }) => {
  const fw = Math.round((level / 100) * 16);
  const c  = level > 50 ? "#01e676" : level > 20 ? "#ffd550" : "#ff5b5b";
  return <svg width="22" height="12" viewBox="0 0 22 12" fill="none"><rect x="0.5" y="0.5" width="18" height="11" rx="2.5" stroke={c} strokeWidth="1"/><rect x="19" y="3.5" width="2.5" height="5" rx="1" fill={c}/><rect x="1.5" y="1.5" width={fw} height="9" rx="1.5" fill={c}/></svg>;
};
const IconTrash = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const IconChevronDown = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>;

// ─── Status helpers ───────────────────────────────────────────────────────────
// "nodata" — нет данных (не online, не offline — просто нет телеметрии)
const SENSOR_COLORS = { normal: "#01e676", warning: "#ffd550", problem: "#ff5b5b", nodata: "#555" };
const SENSOR_BG     = { normal: "#19282b", warning: "#312c1c", problem: "#321c1b", nodata: "#161616" };
const STATUS_LABELS = { normal: "Норма",   warning: "Внимание", problem: "Тревога", nodata: "Нет данных" };
const STATUS_TEXT   = { normal: "#01e676", warning: "#ffd550",  problem: "#ff5b5b", nodata: "#555" };

const getTempStatus = (v, sensor) => {
  const n = parseFloat(v);
  if (isNaN(n) || v == null) return "nodata";   // ← было "normal"
  if (sensor) {
    if ((sensor.alarm_min_temp != null && n < sensor.alarm_min_temp) || (sensor.alarm_max_temp != null && n > sensor.alarm_max_temp)) return "problem";
    if ((sensor.warning_min_temp != null && n < sensor.warning_min_temp) || (sensor.warning_max_temp != null && n > sensor.warning_max_temp)) return "warning";
    return "normal";
  }
  return n >= 30 ? "problem" : n >= 25 ? "warning" : "normal";
};

const getHumStatus = (v, sensor) => {
  const n = parseFloat(v);
  if (isNaN(n) || v == null) return "nodata";   // ← было "normal"
  if (sensor) {
    if ((sensor.alarm_min_hum != null && n < sensor.alarm_min_hum) || (sensor.alarm_max_hum != null && n > sensor.alarm_max_hum)) return "problem";
    if ((sensor.warning_min_hum != null && n < sensor.warning_min_hum) || (sensor.warning_max_hum != null && n > sensor.warning_max_hum)) return "warning";
    return "normal";
  }
  return (n < 30 || n > 70) ? "warning" : "normal";
};

// ─── MiniChart ────────────────────────────────────────────────────────────────
// Все расчёты (toY, диапазон) происходят ДО ветвления — пороги рисуются всегда.
// Не использует вложенные компоненты (вызывают проблемы с рендерингом в SVG).
const MiniChart = ({ data, color, isOffline = false, thresholds = {} }) => {
  const W = 200, H = 48;

  // 1. Собираем пороги
  const tEntries = [
    { val: thresholds.alarmMin,   col: "#ff5b5b" },
    { val: thresholds.alarmMax,   col: "#ff5b5b" },
    { val: thresholds.warningMin, col: "#ffd550" },
    { val: thresholds.warningMax, col: "#ffd550" },
  ].filter(t => t.val != null && !isNaN(Number(t.val)));

  // 2. История: фильтруем null/NaN
  const vals = Array.isArray(data)
    ? data.map(Number).filter(n => !isNaN(n))
    : [];
  const hasHistory = vals.length >= 2;

  // 3. Диапазон оси Y — объединяем историю и пороги, добавляем отступ 10%
  const allNums = [...vals, ...tEntries.map(t => Number(t.val))];
  let yMin, yMax;
  if (allNums.length === 0) {
    yMin = 0; yMax = 100;
  } else {
    const rMin = Math.min(...allNums);
    const rMax = Math.max(...allNums);
    const pad  = (rMax - rMin) * 0.15 || 5;
    yMin = rMin - pad;
    yMax = rMax + pad;
  }
  const yRange = yMax - yMin || 1;

  // 4. Перевод значения → координата Y (0 = верх SVG, H = низ)
  const toY = (v) => H - ((Number(v) - yMin) / yRange) * (H - 10) - 5;

  // 5. Строим путь истории
  const ptsStr = hasHistory
    ? vals.map((v, i) => `${(i / (vals.length - 1)) * W},${toY(v)}`).join("L")
    : null;

  // 6. Строим линии порогов (чистые SVG-элементы, без вложенных компонентов)
  const thresholdSvg = tEntries.map((t, i) => {
    const y = toY(t.val);
    // Разрешаем небольшой выход за края (1px) — пороги у границ всё равно видны
    if (y < -2 || y > H + 2) return null;
    const clampedY = Math.max(1, Math.min(H - 1, y));
    return (
      <g key={`th-${i}`}>
        <line
          x1="0" y1={clampedY} x2={W} y2={clampedY}
          stroke={t.col} strokeWidth="1.2" strokeDasharray="5,3" opacity="0.8"
        />
        <rect
          x={W - 27} y={clampedY - 9} width={26} height={10} rx="2"
          fill="#0a0a0a" opacity="0.9"
        />
        <text
          x={W - 2} y={clampedY - 1}
          fill={t.col} fontSize="6.5" textAnchor="end"
          opacity="1" fontFamily="monospace" fontWeight="600"
        >
          {Number(t.val).toFixed(1)}
        </text>
      </g>
    );
  });

  // ── OFFLINE: мёртвая линия + пороги ───────────────────────────────────────
  if (isOffline) {
    const deadY = H - 6;
    return (
      <div>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H }} preserveAspectRatio="none">
          <path d={`M0,${deadY} L${W},${deadY} L${W},${H} L0,${H}Z`}
            fill="#ff5b5b" opacity="0.07"/>
          <line x1="0" y1={deadY} x2={W} y2={deadY}
            stroke="#ff5b5b" strokeWidth="1.5" strokeDasharray="6,4" opacity="0.6"/>
          {thresholdSvg}
        </svg>
        <div style={{ display:"flex", justifyContent:"center", fontSize:9, color:"#ff5b5b", marginTop:2, opacity:0.75 }}>
          нет связи
        </div>
      </div>
    );
  }

  // ── НЕТ ИСТОРИИ: только пороги (или пустое поле) ──────────────────────────
  if (!hasHistory) {
    return (
      <div>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height:H }} preserveAspectRatio="none">
          <rect x="0" y="0" width={W} height={H} fill="#0e0e0e" rx="3"/>
          {thresholdSvg}
        </svg>
        <div style={{ display:"flex", justifyContent:"center", fontSize:9, color:"#3a3a3a", marginTop:2 }}>
          {tEntries.length > 0 ? "нет истории" : "нет данных"}
        </div>
      </div>
    );
  }

  // ── ПОЛНЫЙ ГРАФИК + пороги ─────────────────────────────────────────────────
  const avg = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height:H }} preserveAspectRatio="none">
        <path d={`M0,${H} L${ptsStr} L${W},${H}Z`} fill={color} opacity="0.12"/>
        <path d={`M${ptsStr}`} fill="none" stroke={color} strokeWidth="1.5"/>
        {thresholdSvg}
      </svg>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:"#555", marginTop:2 }}>
        <span>↓<span style={{ color }}>{Math.min(...vals).toFixed(1)}</span></span>
        <span>~<span style={{ color }}>{avg}</span></span>
        <span>↑<span style={{ color }}>{Math.max(...vals).toFixed(1)}</span></span>
      </div>
    </div>
  );
};

// ─── useSensorHistory ─────────────────────────────────────────────────────────
const useSensorHistory = (sensorId) => {
  const [history, setHistory] = useState(null);
  useEffect(() => {
    if (!sensorId) return;
    apiGet(`/api/v1/telemetry/${sensorId}/history?limit=24`)
      .then(d => setHistory(d))
      .catch(() => setHistory(null));
  }, [sensorId]);
  return history;
};

// ─── useUserLocation ──────────────────────────────────────────────────────────
const useUserLocation = (role, sensors) => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (role !== "editor" && role !== "viewer") {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const me = await apiGet("/api/v1/users/me");
        const locationId = me.location_id ?? (sensors.length > 0 ? sensors[0]?.group_id : null);

        if (!locationId) {
          setLoading(false);
          return;
        }

        const loc = await apiGet(`/api/v1/locations/${locationId}`);
        setLocation(loc);
      } catch (e) {
        if (sensors.length > 0 && sensors[0]?.group_id) {
          setLocation({
            id: sensors[0].group_id,
            name: "Моя локация",
            image_url: null,
          });
        }
        console.warn("useUserLocation:", e.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [role, sensors]);

  return { location, loading };
};

// ─── SensorCard ───────────────────────────────────────────────────────────────
// isOffline=true        → connection_lost тревога → красный
// telemetryData==null   → нет телеметрии совсем  → серый "Нет данных"
// telemetryData!=null   → есть данные            → по значению
const SensorCard = ({ sensor, telemetryData, isOffline = false }) => {
  const temp = (!isOffline && telemetryData != null) ? telemetryData.temperature ?? null : null;
  const hum  = (!isOffline && telemetryData != null) ? telemetryData.humidity    ?? null : null;

  const battery = sensor.battery_level ?? null;
  const bc = battery == null ? "#555" : battery > 50 ? "#01e676" : battery > 20 ? "#ffd550" : "#ff5b5b";

  // История загружается ВСЕГДА — чтобы пороги были видны даже без живых данных
  const history = useSensorHistory(sensor.id);
  const tempH = history?.measurements?.map(m => m.temperature) ?? null;
  const humH  = history?.measurements?.map(m => m.humidity)    ?? null;

  // Статус определяем явно: offline → problem, нет телеметрии → nodata, иначе по значению
  const tSt = isOffline
    ? "problem"
    : (telemetryData == null ? "nodata" : getTempStatus(temp, sensor));
  const hSt = isOffline
    ? "problem"
    : (telemetryData == null ? "nodata" : getHumStatus(hum, sensor));

  // Цвет числа значения
  const numColor = (st) =>
    st === "nodata" ? "#3a3a3a" : st === "problem" ? "#ff5b5b" : "#fff";

  const tempThresholds = {
    warningMin: sensor.warning_min_temp ?? null,
    warningMax: sensor.warning_max_temp ?? null,
    alarmMin:   sensor.alarm_min_temp   ?? null,
    alarmMax:   sensor.alarm_max_temp   ?? null,
  };
  const humThresholds = {
    warningMin: sensor.warning_min_hum ?? null,
    warningMax: sensor.warning_max_hum ?? null,
    alarmMin:   sensor.alarm_min_hum   ?? null,
    alarmMax:   sensor.alarm_max_hum   ?? null,
  };

  return (
    <div className="sensor-card" style={isOffline ? { borderColor: "#ff5b5b44", opacity: 0.92 } : {}}>
      <div className="sensor-card-header">
        <div className="sensor-card-title" style={{ display:"flex", alignItems:"center", gap:6 }}>
          {sensor.name}
          {isOffline && (
            <span style={{
              fontSize:8, fontWeight:700, letterSpacing:"0.4px",
              color:"#ff5b5b", border:"1px solid #ff5b5b55",
              background:"#321c1b", borderRadius:3, padding:"1px 5px",
              textTransform:"uppercase",
            }}>нет связи</span>
          )}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          {(isOffline || battery == null)
            ? <span style={{ fontSize:10, color:"#555" }}>—%</span>
            : <><IconBattery level={battery}/><span style={{ fontSize:10, color:bc, fontWeight:500 }}>{battery}%</span></>
          }
        </div>
      </div>

      <div className="sensor-metrics-row">
        {/* ── Температура ── */}
        <div className="sensor-metric-half" style={{
          borderColor: SENSOR_COLORS[tSt] + "44",
          background:  SENSOR_BG[tSt],
        }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
            <span style={{ fontSize:9, color:"#666" }}>🌡 Темп.</span>
            <span style={{ fontSize:8, color:STATUS_TEXT[tSt], border:`1px solid ${SENSOR_COLORS[tSt]}44`, borderRadius:3, padding:"1px 4px" }}>
              {isOffline ? "Нет связи" : STATUS_LABELS[tSt]}
            </span>
          </div>
          <div style={{ display:"flex", alignItems:"baseline", gap:1, marginBottom:6 }}>
            <span style={{ fontSize:24, fontWeight:500, color:numColor(tSt), lineHeight:1 }}>
              {temp != null ? parseFloat(temp).toFixed(1) : "—"}
            </span>
            <span style={{ fontSize:11, fontWeight:700, color:SENSOR_COLORS[tSt] }}>°C</span>
          </div>
          <MiniChart data={tempH} color={SENSOR_COLORS[tSt]} isOffline={isOffline} thresholds={tempThresholds}/>
        </div>

        {/* ── Влажность ── */}
        <div className="sensor-metric-half" style={{
          borderColor: SENSOR_COLORS[hSt] + "44",
          background:  SENSOR_BG[hSt],
        }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
            <span style={{ fontSize:9, color:"#666" }}>💧 Влажн.</span>
            <span style={{ fontSize:8, color:STATUS_TEXT[hSt], border:`1px solid ${SENSOR_COLORS[hSt]}44`, borderRadius:3, padding:"1px 4px" }}>
              {isOffline ? "Нет связи" : STATUS_LABELS[hSt]}
            </span>
          </div>
          <div style={{ display:"flex", alignItems:"baseline", gap:1, marginBottom:6 }}>
            <span style={{ fontSize:24, fontWeight:500, color:numColor(hSt), lineHeight:1 }}>
              {hum != null ? parseFloat(hum).toFixed(1) : "—"}
            </span>
            <span style={{ fontSize:11, fontWeight:700, color:SENSOR_COLORS[hSt] }}>%</span>
          </div>
          <MiniChart data={humH} color={SENSOR_COLORS[hSt]} isOffline={isOffline} thresholds={humThresholds}/>
        </div>
      </div>
    </div>
  );
};

// ─── NotificationItem ─────────────────────────────────────────────────────────
const NotificationItem = ({ type, title, desc, location, alarmId, status, onAcknowledge }) => {
  const C = {
    error:   { bg: "#321c1b", border: "#ff5b5b", accent: "#ff5b5b" },
    warning: { bg: "#312c1c", border: "#ffd550", accent: "#ffd550" },
    ok:      { bg: "#19282b", border: "#01e676", accent: "#01e676" },
  };
  const c = C[type] || C.error;
  const Icon = type === "error" ? IconError : type === "warning" ? IconWarning : IconCheck;
  return (
    <div className="notif-item" style={{ background: c.bg, borderColor: c.border, borderLeftColor: c.accent }}>
      <div className="notif-icon-wrap" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
        <Icon color={c.accent}/>
      </div>
      <div className="notif-text">
        <div className="notif-title">{title}</div>
        <div className="notif-desc">{desc}</div>
        <div className="notif-location">{location}</div>
      </div>
      {alarmId && status === "new" && onAcknowledge && (
        <button
          onClick={() => onAcknowledge(alarmId)}
          style={{ background: "transparent", border: `1px solid ${c.accent}`, color: c.accent, borderRadius: "6px", padding: "4px 10px", fontSize: "11px", cursor: "pointer", flexShrink: 0, fontFamily: "inherit" }}
        >
          Принять
        </button>
      )}
    </div>
  );
};

// ─── Modal primitives ─────────────────────────────────────────────────────────
const Overlay  = ({ children, onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div onClick={e => e.stopPropagation()}>{children}</div>
  </div>
);
const ModalBox = ({ title, children }) => (
  <div className="modal-box">
    <div className="modal-title">{title}</div>
    {children}
  </div>
);
const BtnRow = ({ onCancel, onSave, saveLabel = "Сохранить" }) => (
  <div className="modal-btn-row">
    <button className="btn-cancel" onClick={onCancel}>Отмена</button>
    <button className="btn-save" onClick={onSave}>{saveLabel}</button>
  </div>
);

// ─── Modal: Add Location ──────────────────────────────────────────────────────
const AddLocationModal = ({ onClose, onSave }) => {
  const [name, setName]       = useState("");
  const [file, setFile]       = useState(null);
  const [err,  setErr]        = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleSave = async () => {
    if (!name.trim()) { setErr("Введите название"); return; }
    setLoading(true);
    try { await onSave(name.trim(), file); onClose(); }
    catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Overlay onClose={onClose}>
      <ModalBox title="Добавить локацию">
        <div className="modal-field">
          <div className="modal-label">Название</div>
          <input className="modal-input" placeholder="Например: ПХ №3" value={name} onChange={e => setName(e.target.value)}/>
        </div>
        <div className="modal-field">
          <div className="modal-label">План помещения (необязательно)</div>
          <div className={`modal-file-drop${file ? " has-file" : ""}`} onClick={() => fileRef.current.click()}>
            {file
              ? <span className="file-name">✓ {file.name}</span>
              : <span>Выберите файл<br/><span className="modal-file-hint">PNG, JPG, SVG</span></span>
            }
          </div>
          <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,.svg" onChange={e => setFile(e.target.files[0] || null)} style={{ display: "none" }}/>
        </div>
        {err && <div className="modal-error">{err}</div>}
        <BtnRow onCancel={onClose} onSave={handleSave} saveLabel={loading ? "Сохранение..." : "Сохранить"}/>
      </ModalBox>
    </Overlay>
  );
};

// ─── Modal: Edit Location ─────────────────────────────────────────────────────
const EditLocationModal = ({ location, onClose, onSave, onDelete }) => {
  const [name,    setName]    = useState(location?.name || "");
  const [file,    setFile]    = useState(null);
  const [preview, setPreview] = useState(null);
  const [err,     setErr]     = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    if (file) setPreview(URL.createObjectURL(file));
    else setPreview(imgUrl(location?.image_url));
    return () => { if (file && preview) URL.revokeObjectURL(preview); };
  }, [file]);

  const handleSave = async () => {
    if (!name.trim()) { setErr("Введите название"); return; }
    setLoading(true);
    try { await onSave(location.id, name.trim(), file); onClose(); }
    catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setLoading(true);
    try { await onDelete(location.id); onClose(); }
    catch (e) { setErr(e.message); setConfirmDelete(false); }
    finally { setLoading(false); }
  };

  return (
    <Overlay onClose={onClose}>
      <ModalBox title="Редактировать локацию">
        <div className="modal-field">
          <div className="modal-label">Название</div>
          <input className="modal-input" value={name} onChange={e => setName(e.target.value)}/>
        </div>
        {preview && (
          <div className="modal-field">
            <div className="modal-label">План помещения</div>
            <img src={preview} alt="plan preview" style={{ width: "100%", maxHeight: 140, objectFit: "contain", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "#0d0d0d" }}/>
          </div>
        )}
        <div className="modal-field">
          <div className="modal-label">Заменить план (необязательно)</div>
          <div className={`modal-file-drop${file ? " has-file" : ""}`} onClick={() => fileRef.current.click()}>
            {file
              ? <span className="file-name">✓ {file.name}</span>
              : <span>Загрузить новый план<br/><span className="modal-file-hint">PNG, JPG, SVG</span></span>
            }
          </div>
          <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,.svg" onChange={e => setFile(e.target.files[0] || null)} style={{ display: "none" }}/>
        </div>
        {err && <div className="modal-error">{err}</div>}

        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <button
            onClick={handleDelete}
            disabled={loading}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 8,
              border: `1px solid ${confirmDelete ? "#ff5b5b" : "rgba(255,91,91,0.35)"}`,
              background: confirmDelete ? "rgba(255,91,91,0.12)" : "transparent",
              color: "#ff5b5b", cursor: "pointer",
              fontSize: 12, fontFamily: "inherit",
              transition: "all 0.15s", width: "100%", justifyContent: "center",
            }}
          >
            <IconTrash/>
            {confirmDelete ? "Нажмите ещё раз для подтверждения" : "Удалить локацию"}
          </button>
          {confirmDelete && (
            <div style={{ fontSize: 11, color: "#929292", textAlign: "center", marginTop: 5 }}>
              Все датчики этой локации будут откреплены
            </div>
          )}
        </div>

        <BtnRow onCancel={onClose} onSave={handleSave} saveLabel={loading ? "Сохранение..." : "Сохранить"}/>
      </ModalBox>
    </Overlay>
  );
};

// ─── Modal: Edit Sensor ───────────────────────────────────────────────────────
const EditSensorModal = ({ sensor, onClose, onSave }) => {
  const [form, setForm] = useState({
    name:             sensor?.name             ?? "",
    alarm_min_temp:   sensor?.alarm_min_temp   ?? "",
    alarm_max_temp:   sensor?.alarm_max_temp   ?? "",
    alarm_min_hum:    sensor?.alarm_min_hum    ?? "",
    alarm_max_hum:    sensor?.alarm_max_hum    ?? "",
    warning_min_temp: sensor?.warning_min_temp ?? "",
    warning_max_temp: sensor?.warning_max_temp ?? "",
    warning_min_hum:  sensor?.warning_min_hum  ?? "",
    warning_max_hum:  sensor?.warning_max_hum  ?? "",
  });
  const [err, setErr]         = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const parseOpt = v => (v === "" || v == null) ? null : parseFloat(v);

  const handleSave = async () => {
    if (!form.name.trim()) { setErr("Введите название"); return; }
    setLoading(true);
    try {
      await onSave(sensor.id, {
        name:             form.name.trim(),
        alarm_min_temp:   parseOpt(form.alarm_min_temp),
        alarm_max_temp:   parseOpt(form.alarm_max_temp),
        alarm_min_hum:    parseOpt(form.alarm_min_hum),
        alarm_max_hum:    parseOpt(form.alarm_max_hum),
        warning_min_temp: parseOpt(form.warning_min_temp),
        warning_max_temp: parseOpt(form.warning_max_temp),
        warning_min_hum:  parseOpt(form.warning_min_hum),
        warning_max_hum:  parseOpt(form.warning_max_hum),
      });
      onClose();
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  const NF = ({ label, fkey }) => (
    <div className="modal-field" style={{ marginBottom: 8 }}>
      <div className="modal-label">{label}</div>
      <input className="modal-input" type="number" step="0.1" value={form[fkey] ?? ""} onChange={e => set(fkey, e.target.value)}/>
    </div>
  );

  return (
    <Overlay onClose={onClose}>
      <ModalBox title={`Настройки: ${sensor?.name}`}>
        <div className="modal-field">
          <div className="modal-label">Название датчика</div>
          <input className="modal-input" value={form.name} onChange={e => set("name", e.target.value)}/>
        </div>
        <div style={{ fontSize: 11, color: "#ff5b5b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", margin: "12px 0 6px" }}>🔴 Тревога (Alarm)</div>
        <div className="modal-two-col"><NF label="Мин. темп °C" fkey="alarm_min_temp"/><NF label="Макс. темп °C" fkey="alarm_max_temp"/></div>
        <div className="modal-two-col"><NF label="Мин. влажн %" fkey="alarm_min_hum"/><NF label="Макс. влажн %" fkey="alarm_max_hum"/></div>
        <div style={{ fontSize: 11, color: "#ffd550", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", margin: "12px 0 6px" }}>🟡 Внимание (Warning)</div>
        <div className="modal-two-col"><NF label="Мин. темп °C" fkey="warning_min_temp"/><NF label="Макс. темп °C" fkey="warning_max_temp"/></div>
        <div className="modal-two-col"><NF label="Мин. влажн %" fkey="warning_min_hum"/><NF label="Макс. влажн %" fkey="warning_max_hum"/></div>
        {err && <div className="modal-error">{err}</div>}
        <BtnRow onCancel={onClose} onSave={handleSave} saveLabel={loading ? "Сохранение..." : "Сохранить"}/>
      </ModalBox>
    </Overlay>
  );
};

// ─── FloorPlan ────────────────────────────────────────────────────────────────
const FloorPlan = ({ activeLoc, locSensors, telemetry, canEdit, dragAllMode, onPositionSave, pendingPositions, onPendingPositionChange }) => {
  const containerRef = useRef(null);
  const [localPositions, setLocalPositions] = useState({});
  const dragging = useRef(null);
  const didDrag = useRef(false);

  const effectivePositions = dragAllMode ? pendingPositions : localPositions;

  useEffect(() => {
    const p = {};
    locSensors.forEach(s => { p[s.id] = { x: s.pos_x ?? 50, y: s.pos_y ?? 50 }; });
    setLocalPositions(p);
  }, [locSensors]);

  const startDrag = useCallback((clientX, clientY, sensor) => {
    if (!dragAllMode || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    didDrag.current = false;
    dragging.current = {
      sensorId: sensor.id,
      startClientX: clientX,
      startClientY: clientY,
      startPosX: effectivePositions[sensor.id]?.x ?? sensor.pos_x ?? 50,
      startPosY: effectivePositions[sensor.id]?.y ?? sensor.pos_y ?? 50,
      rectW: rect.width,
      rectH: rect.height,
    };
  }, [dragAllMode, effectivePositions]);

  const moveDrag = useCallback((clientX, clientY) => {
    if (!dragging.current) return;
    const { sensorId, startClientX, startClientY, startPosX, startPosY, rectW, rectH } = dragging.current;
    const dx = ((clientX - startClientX) / rectW) * 100;
    const dy = ((clientY - startClientY) / rectH) * 100;
    if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) didDrag.current = true;
    const nx = Math.max(2, Math.min(98, startPosX + dx));
    const ny = Math.max(2, Math.min(98, startPosY + dy));
    if (dragAllMode) {
      onPendingPositionChange(sensorId, { x: nx, y: ny });
    } else {
      setLocalPositions(p => ({ ...p, [sensorId]: { x: nx, y: ny } }));
    }
  }, [dragAllMode, onPendingPositionChange]);

  const endDrag = useCallback(async () => {
    if (!dragging.current) return;
    const { sensorId } = dragging.current;
    const wasDrag = didDrag.current;
    dragging.current = null;
    didDrag.current = false;
    if (wasDrag && !dragAllMode) {
      const pos = localPositions[sensorId];
      try { await onPositionSave(sensorId, pos.x, pos.y); } catch (e) { console.error(e); }
    }
  }, [localPositions, onPositionSave, dragAllMode]);

  const planUrl = imgUrl(activeLoc?.image_url);

  const pinStyle = (s) => {
    const tel    = telemetry.get(s.id);
    const status = getTempStatus(tel?.temperature, s);
    const col    = SENSOR_COLORS[status];
    const bg     = SENSOR_BG[status];
    const pos    = effectivePositions[s.id];
    return { col, bg, status, tel, left: pos ? `${pos.x}%` : "50%", top: pos ? `${pos.y}%` : "50%" };
  };

  return (
    <div
      ref={containerRef}
      className="floor-plan-wrap"
      style={{ cursor: dragging.current ? "grabbing" : (dragAllMode ? "grab" : "default"), userSelect: "none", touchAction: "none" }}
      onMouseMove={e => moveDrag(e.clientX, e.clientY)}
      onMouseUp={() => endDrag()}
      onMouseLeave={() => { if (dragging.current) dragging.current = null; }}
    >
      {planUrl ? (
        <>
          <img src={planUrl} alt="Floor plan" className="floor-image" draggable={false}/>
          <div className="floor-image-overlay">
            {locSensors.map(s => {
              const { col, bg, tel, left, top } = pinStyle(s);
              return (
                <div
                  key={s.id}
                  className="floor-sensor-pin"
                  style={{ left, top, borderColor: col, background: bg, color: col, cursor: dragAllMode ? "grab" : "default" }}
                  onMouseDown={e => { if (e.button === 0 && dragAllMode) { e.preventDefault(); startDrag(e.clientX, e.clientY, s); } }}
                  onTouchStart={e => { if (dragAllMode) { e.preventDefault(); startDrag(e.touches[0].clientX, e.touches[0].clientY, s); } }}
                  onTouchMove={e => { if (dragAllMode) { e.preventDefault(); moveDrag(e.touches[0].clientX, e.touches[0].clientY); } }}
                  onTouchEnd={() => { if (dragAllMode) endDrag(); }}
                >
                  {dragAllMode && (
                    <div style={{ position: "absolute", top: -7, right: -7, background: "#111", borderRadius: "50%", width: 15, height: 15, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${col}55`, pointerEvents: "none" }}>
                      <IconEdit/>
                    </div>
                  )}
                  <div style={{ fontSize: 9, fontWeight: 700, lineHeight: 1.3, whiteSpace: "nowrap" }}>{s.name.slice(0, 9)}</div>
                  <div style={{ fontSize: 8, opacity: 0.85, whiteSpace: "nowrap" }}>
                    {tel ? `${parseFloat(tel.temperature).toFixed(1)}° / ${parseFloat(tel.humidity).toFixed(0)}%` : "—"}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <svg className="floor-svg" viewBox="0 0 500 340" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="10" width="480" height="320" rx="8" fill="none" stroke="#2a2a2a" strokeWidth="1.5"/>
          <text x="250" y="170" fill="#2a2a2a" fontSize="13" textAnchor="middle">{activeLoc?.name || "Нет плана помещения"}</text>
          {locSensors.map(s => {
            const { col, bg, tel, left, top } = pinStyle(s);
            const cx = (parseFloat(left) / 100) * 480 + 10;
            const cy = (parseFloat(top)  / 100) * 320 + 10;
            return (
              <g key={s.id} onMouseDown={e => dragAllMode && startDrag(e.clientX, e.clientY, s)} style={{ cursor: dragAllMode ? "grab" : "pointer" }}>
                <circle cx={cx} cy={cy} r="22" fill={bg} stroke={col} strokeWidth="1.5"/>
                <text x={cx} y={cy - 6} fill={col} fontSize="7" textAnchor="middle" fontWeight="700">{s.name.slice(0, 5)}</text>
                <text x={cx} y={cy + 3} fill={col} fontSize="6.5" textAnchor="middle">{tel ? `${parseFloat(tel.temperature).toFixed(1)}°C` : "—"}</text>
                <text x={cx} y={cy + 12} fill={col} fontSize="6.5" textAnchor="middle">{tel ? `${parseFloat(tel.humidity).toFixed(0)}%` : "—"}</text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
};

// ─── FloorPanel ───────────────────────────────────────────────────────────────
const FloorPanel = ({
  locations,
  sensors,
  telemetry,
  onAddLocation,
  onEditLocation,
  onDeleteLocation,
  onUpdateSensor,
  canEdit,
  canCreateLocation,
  canDragSensors,
  isNonAdmin,
  userLocation,
  onActiveLocationChange,
}) => {
  // FIX #1: activeLocId живёт отдельно и не сбрасывается при обновлении locations.
  // Инициализируем один раз (lazy initializer), не через useEffect на locations.
  const [activeLocId,    setActiveLocId]    = useState(() => null);
  const [showAdd,        setShowAdd]        = useState(false);
  const [editingLoc,     setEditingLoc]     = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [editingSensor,   setEditingSensor]   = useState(null);

  const [dragAllMode,        setDragAllMode]        = useState(false);
  const [pendingPositions,   setPendingPositions]   = useState({});
  const [saving,             setSaving]             = useState(false);

  // FIX #1: устанавливаем начальную локацию только один раз, когда locations
  // появляются впервые (activeLocId ещё null). Последующие refetch не трогают выбор.
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;        // уже инициализировано — выходим
    if (!isNonAdmin && locations.length > 0) {
      initializedRef.current = true;
      const initId = locations[0]?.id ?? null;
      setActiveLocId(initId);
      onActiveLocationChange?.(initId);
    }
  }, [locations, isNonAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isNonAdmin && userLocation?.id) {
      onActiveLocationChange?.(userLocation.id);
    }
  }, [isNonAdmin, userLocation]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const effectiveId = isNonAdmin
    ? (userLocation?.id ?? null)
    : (activeLocId ?? (locations[0]?.id || null));

  const activeLoc = isNonAdmin
    ? userLocation
    : (locations.find(l => l.id === effectiveId) || locations[0]);

  const locSensors = sensors.filter(s => s.group_id === activeLoc?.id);

  const handleLocationSelect = (locId) => {
    setActiveLocId(locId);
    setIsDropdownOpen(false);
    onActiveLocationChange?.(locId);
  };

  const handlePositionSave = useCallback(async (sensorId, x, y) => {
    if (dragAllMode) {
      setPendingPositions(p => ({ ...p, [sensorId]: { x, y } }));
    } else {
      await onUpdateSensor(sensorId, { pos_x: x, pos_y: y });
    }
  }, [dragAllMode, onUpdateSensor]);

  const handlePendingPositionChange = useCallback((sensorId, pos) => {
    setPendingPositions(prev => ({ ...prev, [sensorId]: pos }));
  }, []);

  const handleDragAllSave = async () => {
    setSaving(true);
    try {
      await Promise.all(
        Object.entries(pendingPositions).map(([id, pos]) =>
          onUpdateSensor(Number(id), { pos_x: pos.x, pos_y: pos.y })
        )
      );
    } catch (e) { console.error("Ошибка сохранения позиций:", e); }
    finally {
      setSaving(false);
      setPendingPositions({});
      setDragAllMode(false);
      // FIX #1: не вызываем refetch здесь напрямую, а только через onUpdateSensor,
      // который уже вызывает refetch в Dashboard. activeLocId при этом не сбросится.
    }
  };

  const handleDragAllCancel = () => {
    setPendingPositions({});
    setDragAllMode(false);
  };

  const enterDragAllMode = () => {
    const initialPositions = {};
    locSensors.forEach(s => { initialPositions[s.id] = { x: s.pos_x ?? 50, y: s.pos_y ?? 50 }; });
    setPendingPositions(initialPositions);
    setDragAllMode(true);
  };

  return (
    <>
      <div className="panel floor-panel">
        <div className="panel-header">
          <h2 className="panel-title">План помещения</h2>
          {canCreateLocation && !dragAllMode && (
            <button className="btn-floor-action" onClick={() => setShowAdd(true)}>
              <IconPlus/> Локация
            </button>
          )}
        </div>

        {!isNonAdmin && locations.length > 0 && !dragAllMode && (
          <div className="location-dropdown-container" ref={dropdownRef}>
            <button className="location-dropdown-trigger" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <span className="location-dropdown-value">
                <IconPin/>
                {activeLoc?.name || "Выберите локацию"}
              </span>
              <span className={`location-dropdown-arrow ${isDropdownOpen ? "open" : ""}`}>
                <IconChevronDown/>
              </span>
            </button>
            {isDropdownOpen && (
              <div className="location-dropdown-menu">
                {locations.map(loc => (
                  <button
                    key={loc.id}
                    className={`location-dropdown-item ${loc.id === effectiveId ? "active" : ""}`}
                    onClick={() => handleLocationSelect(loc.id)}
                  >
                    <IconPin/> {loc.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {isNonAdmin && activeLoc && !dragAllMode && (
          <div className="location-name-static">
            <IconPin/>
            <span>{activeLoc.name}</span>
          </div>
        )}

        {dragAllMode && (
          <div style={{ fontSize: 12, color: "#929292", padding: "6px 2px", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "#ffd550" }}>✦</span>
            Перетаскивайте датчики в нужные места
          </div>
        )}

        {(!activeLoc) && (
          <div style={{ color: "#555", fontSize: "13px", textAlign: "center", padding: "40px 0" }}>
            {canCreateLocation ? "Нет локаций. Добавьте первую." : "Нет доступных локаций"}
          </div>
        )}

        {activeLoc && (
          <FloorPlan
            activeLoc={activeLoc}
            locSensors={locSensors}
            telemetry={telemetry}
            canEdit={canEdit}
            dragAllMode={dragAllMode}
            onPositionSave={handlePositionSave}
            pendingPositions={pendingPositions}
            onPendingPositionChange={handlePendingPositionChange}
          />
        )}

        {dragAllMode ? (
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 15 }}>
            <button className="btn-cancel" onClick={handleDragAllCancel}>Отменить</button>
            <button className="btn-save"   onClick={handleDragAllSave} disabled={saving}>
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        ) : (
          <div className="floor-footer">
            <div className="legend">
              <span><span className="legend-dot" style={{ background: "#01e676" }}/> Нормально</span>
              <span><span className="legend-dot" style={{ background: "#ffd550" }}/> Внимание</span>
              <span><span className="legend-dot" style={{ background: "#ff5b5b" }}/> Тревога</span>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {canDragSensors && activeLoc && (
                <button
                  className="btn-location-name"
                  onClick={enterDragAllMode}
                  style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
                >
                  <IconSensor/> Датчики
                </button>
              )}
              {activeLoc && (
                <button
                  className="btn-location-name"
                  onClick={canCreateLocation ? () => setEditingLoc(activeLoc) : undefined}
                  style={{ cursor: canCreateLocation ? "pointer" : "default" }}
                >
                  <IconPin/> {activeLoc.name}
                  {canCreateLocation && <span style={{ marginLeft: 4, opacity: 0.6 }}><IconEdit/></span>}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {editingSensor && (
        <EditSensorModal
          sensor={editingSensor}
          onClose={() => setEditingSensor(null)}
          onSave={async (id, payload) => {
            await onUpdateSensor(id, payload);
            setEditingSensor(null);
          }}
        />
      )}

      {showAdd && (
        <AddLocationModal
          onClose={() => setShowAdd(false)}
          onSave={async (n, f) => { await onAddLocation(n, f); setShowAdd(false); }}
        />
      )}
      {editingLoc && (
        <EditLocationModal
          location={editingLoc}
          onClose={() => setEditingLoc(null)}
          onSave={async (id, n, f) => { await onEditLocation(id, n, f); setEditingLoc(null); }}
          onDelete={async (id) => {
            await onDeleteLocation(id);
            setEditingLoc(null);
            // FIX #1: если удалили активную локацию — сбрасываем выбор
            if (activeLocId === id) {
              setActiveLocId(null);
              initializedRef.current = false; // разрешаем повторную инициализацию
            }
          }}
        />
      )}
    </>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { canEdit, canCreateLocation, role } = useAuth();

  const canDragSensors = role === "admin";

  const { locations: rawLocations, sensors, telemetry, alarms, loading, error, refetch } = useDashboardData();

  const { location: userLocation, loading: locationLoading } = useUserLocation(role, sensors);

  const isNonAdmin = role === "editor" || role === "viewer";

  const locations = isNonAdmin
    ? (userLocation ? [userLocation] : [])
    : (rawLocations ?? []);

  const [activeLocationId, setActiveLocationId] = useState(null);

  const filteredAlarms = useMemo(() => {
    if (isNonAdmin) return alarms;
    if (!activeLocationId) return alarms;

    const locationSensorIds = new Set(
      sensors
        .filter(s => s.group_id === activeLocationId)
        .map(s => s.id)
    );

    return alarms.filter(a => locationSensorIds.has(a.sensor_id));
  }, [alarms, sensors, activeLocationId, isNonAdmin]);

  // Множество sensor_id с активной тревогой connection_lost
  const offlineSensorIds = useMemo(() => {
    return new Set(
      alarms
        .filter(a =>
          a.alarm_type === "connection_lost" &&
          (a.status === "new" || a.status === "acknowledged")
        )
        .map(a => a.sensor_id)
    );
  }, [alarms]);

  const handleAddLocation = async (name, file) => {
    await apiCreateLocation(name, file);
    refetch();
  };

  const handleEditLocation = async (id, name, file) => {
    try { await apiPatch(`/api/v1/locations/${id}`, { name }); }
    catch (e) { console.warn("PATCH /locations не поддержан:", e.message); }
    if (file) await apiUploadPlan(id, file);
    refetch();
  };

  const handleDeleteLocation = async (id) => {
    await apiDelete(`/api/v1/locations/${id}`);
    refetch();
  };

  const handleUpdateSensor = async (id, payload) => {
    await apiPatch(`/api/v1/sensors/${id}`, payload);
    refetch();
  };

  const handleAcknowledge = async (alarmId) => {
    try { await updateAlarmStatus(alarmId, "acknowledged"); refetch(); }
    catch (e) { console.error(e); }
  };

  const notifications = filteredAlarms.map(alarmToNotification);
  const alarmCounts   = countAlarms(filteredAlarms);

  // FIX #2: карточки датчиков — только из активной локации.
  // Если activeLocationId ещё null (не выбрано) — показываем пустой список,
  // чтобы не путать данные разных локаций.
  const sensorCards = useMemo(() => {
    if (!activeLocationId) return [];
    return sensors.filter(s => s.group_id === activeLocationId);
  }, [sensors, activeLocationId]);

  if (loading || (isNonAdmin && locationLoading)) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", color: "#929292", fontFamily: '"Inter",sans-serif', fontSize: 14 }}>
      Загрузка данных...
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, color: "#ff5b5b", fontFamily: '"Inter",sans-serif' }}>
      <div style={{ fontSize: 14 }}>Ошибка загрузки: {error}</div>
      <button onClick={refetch} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #ff5b5b", background: "transparent", color: "#ff5b5b", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>Повторить</button>
    </div>
  );

  return (
    <div className="dashboard-container">
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Система мониторинга помещений</h1>
            <p className="dashboard-subtitle">Мониторинг окружающей среды и управление оповещениями в реальном времени</p>
          </div>
        </header>

        <div className="dashboard-top-row">
          <FloorPanel
            locations={locations}
            sensors={sensors}
            telemetry={telemetry}
            onAddLocation={handleAddLocation}
            onEditLocation={handleEditLocation}
            onDeleteLocation={handleDeleteLocation}
            onUpdateSensor={handleUpdateSensor}
            canEdit={canEdit}
            canCreateLocation={canCreateLocation}
            canDragSensors={canDragSensors}
            isNonAdmin={isNonAdmin}
            userLocation={userLocation}
            onActiveLocationChange={setActiveLocationId}
          />
          <section className="panel notif-panel">
            <div className="panel-header">
              <h2 className="panel-title">Уведомления</h2>
              <div className="notif-summary">
                {alarmCounts.critical > 0 && <><span className="dot dot--red"/> {alarmCounts.critical} Критич.</>}
                {alarmCounts.warning  > 0 && <><span className="dot dot--yellow"/> {alarmCounts.warning} Предупр.</>}
                {notifications.length === 0 && <span style={{ color: "#01e676", fontSize: 12 }}>Всё в норме ✓</span>}
              </div>
            </div>
            <div className="notif-list">
              {notifications.length === 0 && (
                <div style={{ color: "#555", fontSize: 13, textAlign: "center", padding: "30px 0" }}>Активных тревог нет</div>
              )}
              {notifications.map((n, i) => (
                <NotificationItem key={i} {...n} onAcknowledge={handleAcknowledge}/>
              ))}
            </div>
          </section>
        </div>

        {/* Карточки датчиков текущей локации с флагом isOffline */}
        {sensorCards.length > 0 && (
          <div className="dashboard-bottom-row">
            {sensorCards.map(sensor => (
              <SensorCard
                key={sensor.id}
                sensor={sensor}
                telemetryData={telemetry.get(sensor.id)}
                isOffline={offlineSensorIds.has(sensor.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;