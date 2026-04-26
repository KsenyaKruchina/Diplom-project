import React, { useState, useRef, useCallback, useEffect } from "react";
import "./Dashboard.css";

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconError = ({ color = "#ff5b5b" }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={color}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
  </svg>
);

const IconWarning = ({ color = "#ffd550" }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={color}>
    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
  </svg>
);

const IconCheck = ({ color = "#01e676" }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={color}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
);

const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="16"/>
    <line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
);

const IconPencil = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const IconPin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const IconBattery = ({ level }) => {
  const fillWidth = Math.round((level / 100) * 16);
  const c = level > 50 ? "#01e676" : level > 20 ? "#ffd550" : "#ff5b5b";
  return (
    <svg width="22" height="12" viewBox="0 0 22 12" fill="none">
      <rect x="0.5" y="0.5" width="18" height="11" rx="2.5" stroke={c} strokeWidth="1"/>
      <rect x="19" y="3.5" width="2.5" height="5" rx="1" fill={c}/>
      <rect x="1.5" y="1.5" width={fillWidth} height="9" rx="1.5" fill={c}/>
    </svg>
  );
};

// ─── localStorage persistence ─────────────────────────────────────────────────

const LS_KEY    = "floor_locations_v3";
const LS_ACTIVE = "floor_active_loc_v3";

const loadLocations   = () => { try { const r = localStorage.getItem(LS_KEY);    return r ? JSON.parse(r) : null; } catch { return null; } };
const saveLocations   = (d) => { try { localStorage.setItem(LS_KEY,    JSON.stringify(d)); } catch {} };
const loadActiveLocId = () => { try { const r = localStorage.getItem(LS_ACTIVE); return r ? JSON.parse(r) : null; } catch { return null; } };
const saveActiveLocId = (d) => { try { localStorage.setItem(LS_ACTIVE, JSON.stringify(d)); } catch {} };

const fileToDataURL = (file) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result);
  r.onerror = rej;
  r.readAsDataURL(file);
});

// ─── Chart constants ──────────────────────────────────────────────────────────

const CHART_DATA    = { normal: [20,22,21,23,22,21,22,23,22,21,22,22], warning: [20,21,22,24,23,24,25,24,23,24,23,23], problem: [20,22,25,28,30,32,35,37,36,38,37,36] };
const CHART_COLORS  = { normal: "#01e676", warning: "#ffd550", problem: "#ff5b5b" };
const STATUS_LABELS = { normal: "Нормально", warning: "Предупреждение", problem: "Проблема" };
const STATUS_BG     = { normal: "#19282b",   warning: "#312c1c",         problem: "#321c1b"  };
const STATUS_TEXT   = { normal: "#01e676",   warning: "#ffd550",         problem: "#ff5b5b"  };
const SENSOR_COLORS = { normal: "#01e676", warning: "#ffd550", problem: "#ff5b5b" };
const SENSOR_BG     = { normal: "#19282b", warning: "#312c1c", problem: "#321c1b" };
const MONTHS        = ["Jan","Feb","Mar","Apr","Mai","Jun"];

const getTempStatus = (v) => { const n = parseFloat(v); return isNaN(n) ? "normal" : n >= 30 ? "problem" : n >= 25 ? "warning" : "normal"; };
const getHumStatus  = (v) => { const n = parseFloat(v); return isNaN(n) ? "normal" : (n < 30 || n > 70) ? "warning" : "normal"; };

// ─── MiniChart ────────────────────────────────────────────────────────────────

const MiniChart = ({ data, color }) => {
  const w = 200, h = 70;
  const min = Math.min(...data), max = Math.max(...data);
  const avg = Math.round(data.reduce((a, b) => a + b, 0) / data.length);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i/(data.length-1))*w},${h-((v-min)/range)*(h-8)-4}`);
  return (
    <div className="chart-wrap">
      <svg className="chart-svg-area" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <path d={`M 0,${h} L ${pts.join(" L ")} L ${w},${h} Z`} fill={color} opacity="0.13"/>
        <path d={`M ${pts.join(" L ")}`} fill="none" stroke={color} strokeWidth="2"/>
      </svg>
      <div className="chart-stats">
        <span>↓ Min: <span style={{color}}>{min}</span></span>
        <span>~ Avg: <span style={{color}}>{avg}</span></span>
        <span>↑ Max: <span style={{color}}>{max}</span></span>
      </div>
    </div>
  );
};

// ─── SensorCard ───────────────────────────────────────────────────────────────

const SensorMetric = ({ label, value, unit, status }) => (
  <div className="sensor-metric">
    <div className="sensor-metric-top">
      <div>
        <div className="sensor-metric-label">{label}</div>
        <div className="sensor-card-value">
          <span className="sensor-val">{value}</span>
          <span className="sensor-unit">{unit}</span>
        </div>
      </div>
      <div className="sensor-badge" style={{ background: STATUS_BG[status], color: STATUS_TEXT[status] }}>
        {STATUS_LABELS[status]}
      </div>
    </div>
    <MiniChart data={CHART_DATA[status]} color={CHART_COLORS[status]}/>
    <div className="chart-x-axis">{MONTHS.map(m => <span key={m}>{m}</span>)}</div>
  </div>
);

const SensorCard = ({ sensor, tempValue, tempStatus, humValue, humStatus, battery = 75 }) => {
  const bc = battery > 50 ? "#01e676" : battery > 20 ? "#ffd550" : "#ff5b5b";
  return (
    <div className="sensor-card">
      <div className="sensor-card-header">
        <div className="sensor-card-title">{sensor}</div>
        <div className="sensor-battery">
          <IconBattery level={battery}/>
          <span className="battery-label" style={{color: bc}}>{battery}%</span>
        </div>
      </div>
      <SensorMetric label="🌡 Температура" value={tempValue} unit="°C" status={tempStatus}/>
      <SensorMetric label="💧 Влажность"   value={humValue}  unit="%" status={humStatus}/>
    </div>
  );
};

// ─── NotificationItem ─────────────────────────────────────────────────────────

const NotificationItem = ({ type, title, desc, location }) => {
  const colors = { error: { bg:"#321c1b",border:"#ff5b5b",accent:"#ff5b5b" }, warning: { bg:"#312c1c",border:"#ffd550",accent:"#ffd550" }, ok: { bg:"#19282b",border:"#01e676",accent:"#01e676" } };
  const c = colors[type] || colors.error;
  const Icon = type === "error" ? IconError : type === "warning" ? IconWarning : IconCheck;
  return (
    <div className="notif-item" style={{ background:c.bg, borderColor:c.border, borderLeftColor:c.accent }}>
      <div className="notif-icon-wrap" style={{ background:c.bg, border:`1px solid ${c.border}` }}><Icon color={c.accent}/></div>
      <div className="notif-text">
        <div className="notif-title">{title}</div>
        <div className="notif-desc">{desc}</div>
        <div className="notif-location">{location}</div>
      </div>
    </div>
  );
};

// ─── Modal primitives ─────────────────────────────────────────────────────────

const Overlay  = ({ children, onClose }) => (
  <div className="modal-overlay" onClick={onClose}><div onClick={e => e.stopPropagation()}>{children}</div></div>
);
const ModalBox = ({ title, children }) => (
  <div className="modal-box"><div className="modal-title">{title}</div>{children}</div>
);
const BtnRow   = ({ onCancel, onSave }) => (
  <div className="modal-btn-row">
    <button className="btn-cancel" onClick={onCancel}>Отмена</button>
    <button className="btn-save"   onClick={onSave}>Сохранить</button>
  </div>
);
const ModalInput = ({ label, ...props }) => (
  <div className="modal-field">
    {label && <div className="modal-label">{label}</div>}
    <input className="modal-input" {...props}/>
  </div>
);

const FileDropZone = ({ file, dataURL, onFile, label = "План помещения" }) => {
  const ref = useRef();
  const [err, setErr] = useState("");
  const handleChange = (e) => {
    const f = e.target.files[0]; if (!f) return;
    if (!["image/png","image/jpeg","image/svg+xml"].includes(f.type)) { setErr("Только PNG, JPG или SVG"); return; }
    if (f.size > 50*1024*1024) { setErr("Файл не должен превышать 50 МБ"); return; }
    setErr(""); onFile(f);
  };
  return (
    <div className="modal-field">
      <div className="modal-label">{label}</div>
      <div className={`modal-file-drop${(file||dataURL) ? " has-file" : ""}`} onClick={() => ref.current.click()}>
        {(file||dataURL) ? <span className="file-name">✓ {file ? file.name : "Загружено"}</span>
          : <span>Выберите файл<br/><span className="modal-file-hint">PNG, JPG, SVG — до 50 МБ</span></span>}
      </div>
      <input ref={ref} type="file" accept=".png,.jpg,.jpeg,.svg" onChange={handleChange} style={{display:"none"}}/>
      {err && <div className="modal-error">{err}</div>}
    </div>
  );
};

// ─── Modal: Add Location ──────────────────────────────────────────────────────

const AddLocationModal = ({ onClose, onSave }) => {
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [err,  setErr]  = useState("");
  const handleSave = async () => {
    if (!name.trim()) { setErr("Введите название локации"); return; }
    onSave({ name, imageDataURL: file ? await fileToDataURL(file) : null });
    onClose();
  };
  return (
    <Overlay onClose={onClose}>
      <ModalBox title="Добавить локацию">
        <ModalInput label="Название локации" placeholder="Например: ПХ №3" value={name} onChange={e => setName(e.target.value)}/>
        <FileDropZone file={file} onFile={setFile}/>
        {err && <div className="modal-error">{err}</div>}
        <BtnRow onCancel={onClose} onSave={handleSave}/>
      </ModalBox>
    </Overlay>
  );
};

// ─── Modal: Edit Location ─────────────────────────────────────────────────────

const EditLocationModal = ({ location, onClose, onSave }) => {
  const [name, setName] = useState(location.name);
  const [file, setFile] = useState(null);
  const handleSave = async () => {
    onSave({ name, imageDataURL: file ? await fileToDataURL(file) : null });
    onClose();
  };
  return (
    <Overlay onClose={onClose}>
      <ModalBox title="Редактировать локацию">
        <ModalInput label="Название локации" value={name} onChange={e => setName(e.target.value)}/>
        <FileDropZone file={file} dataURL={location.floorImage} onFile={setFile}/>
        <BtnRow onCancel={onClose} onSave={handleSave}/>
      </ModalBox>
    </Overlay>
  );
};

// ─── Modal: Add/Edit Sensor (with real floor image drag) ──────────────────────

const SensorModal = ({ sensors, existingSensor, floorImage, onClose, onSave }) => {
  const [sensorName, setSensorName] = useState(existingSensor?.name      || "");
  const [tempValue,  setTempValue]  = useState(existingSensor?.tempValue ?? "");
  const [humValue,   setHumValue]   = useState(existingSensor?.humValue  ?? "");
  const [battery,    setBattery]    = useState(existingSensor?.battery   ?? 100);
  const [pos,        setPos]        = useState(existingSensor?.pos       || { x: 50, y: 50 });

  const mapRef   = useRef();
  const dragging = useRef(false);

  const tempStatus  = getTempStatus(tempValue);
  const markerColor = SENSOR_COLORS[tempStatus] || "#01e676";
  const markerBg    = SENSOR_BG[tempStatus]    || "#19282b";

  const getPosFromEvent = useCallback((e) => {
    if (!mapRef.current) return null;
    const rect = mapRef.current.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: Math.max(2, Math.min(98, ((cx - rect.left) / rect.width)  * 100)),
      y: Math.max(2, Math.min(98, ((cy - rect.top)  / rect.height) * 100)),
    };
  }, []);

  const startDrag  = (e) => { e.preventDefault(); dragging.current = true; };
  const stopDrag   = ()  => { dragging.current = false; };
  const moveDrag   = useCallback((e) => { if (!dragging.current) return; const p = getPosFromEvent(e); if (p) setPos(p); }, [getPosFromEvent]);
  const touchStart = (e) => { e.preventDefault(); dragging.current = true; const p = getPosFromEvent(e); if (p) setPos(p); };

  const bc = battery > 50 ? "#01e676" : battery > 20 ? "#ffd550" : "#ff5b5b";

  return (
    <Overlay onClose={onClose}>
      <ModalBox title={existingSensor ? "Редактировать датчик" : "Добавить датчик"}>
        <ModalInput label="Название датчика" placeholder="Например: Д3" value={sensorName} onChange={e => setSensorName(e.target.value)}/>

        <div className="modal-two-col">
          <div className="modal-field">
            <div className="modal-label">🌡 Температура (°C)</div>
            <input className="modal-input" type="number" placeholder="22" value={tempValue} onChange={e => setTempValue(e.target.value)}/>
          </div>
          <div className="modal-field">
            <div className="modal-label">💧 Влажность (%)</div>
            <input className="modal-input" type="number" placeholder="55" value={humValue} onChange={e => setHumValue(e.target.value)}/>
          </div>
        </div>

        <div className="modal-field">
          <div className="modal-label">🔋 Заряд батареи: <span style={{color: bc}}>{battery}%</span></div>
          <input className="modal-range" type="range" min="0" max="100" value={battery} onChange={e => setBattery(Number(e.target.value))}/>
        </div>

        <div className="modal-field">
          <div className="modal-label">
            {floorImage ? "Перетащите датчик по плану помещения" : "Укажите позицию датчика"}
          </div>
          <div
            ref={mapRef}
            className="sensor-drag-map"
            onMouseMove={moveDrag}
            onMouseUp={stopDrag}
            onMouseLeave={stopDrag}
            onTouchMove={moveDrag}
            onTouchEnd={stopDrag}
          >
            {/* Real floor image as background */}
            {floorImage ? (
              <img src={floorImage} alt="Floor plan" className="sensor-drag-bg-image" draggable={false}/>
            ) : (
              <svg viewBox="0 0 500 300" className="sensor-drag-bg-svg">
                <rect x="10" y="10" width="480" height="280" rx="6" fill="none" stroke="#2e2e2e" strokeWidth="2"/>
                <rect x="10" y="10" width="230" height="140" fill="#1a1a1a" stroke="#2e2e2e"/>
                <rect x="250" y="10" width="240" height="140" fill="#1a1a1a" stroke="#2e2e2e"/>
                <rect x="10" y="155" width="480" height="135" fill="#191919" stroke="#2e2e2e"/>
                <text x="120" y="40" fill="#444" fontSize="14" textAnchor="middle">ПХ №1</text>
                <text x="370" y="40" fill="#444" fontSize="14" textAnchor="middle">ПХ №7</text>
                <text x="240" y="200" fill="#444" fontSize="14" textAnchor="middle">Коридор</text>
              </svg>
            )}

            {/* Ghost markers for other sensors */}
            {sensors.filter(s => s !== existingSensor).map((s, i) => {
              const sc = SENSOR_COLORS[s.tempStatus] || "#01e676";
              const sb = SENSOR_BG[s.tempStatus] || "#19282b";
              return (
                <div key={i} className="sensor-drag-ghost"
                  style={{ left:`${s.pos.x}%`, top:`${s.pos.y}%`, borderColor:sc, background:sb, color:sc }}>
                  {s.name?.slice(0,3) || "?"}
                </div>
              );
            })}

            {/* Active draggable marker */}
            <div
              className="sensor-drag-marker"
              style={{ left:`${pos.x}%`, top:`${pos.y}%`, background:markerBg, border:`2px solid ${markerColor}`, color:markerColor, boxShadow:`0 0 14px ${markerColor}66` }}
              onMouseDown={startDrag}
              onTouchStart={touchStart}
            >
              <span className="drag-marker-label">{sensorName ? sensorName.slice(0,3) : "??"}</span>
            </div>
          </div>
          <div className="sensor-drag-hint">Позиция: {Math.round(pos.x)}% × {Math.round(pos.y)}%</div>
        </div>

        <BtnRow
          onCancel={onClose}
          onSave={() => {
            onSave({ name:sensorName, tempValue, humValue, battery, pos, tempStatus:getTempStatus(tempValue), humStatus:getHumStatus(humValue) });
            onClose();
          }}
        />
      </ModalBox>
    </Overlay>
  );
};

// ─── Default data ─────────────────────────────────────────────────────────────

const DEFAULT_LOCATIONS = [
  {
    id: 1,
    name: "ПХ №1 — Основной",
    floorImage: null,
    sensors: [
      { name:"Д1", tempValue:"22", humValue:"55", battery:88, pos:{x:26,y:37}, tempStatus:"normal",  humStatus:"normal"  },
      { name:"Д2", tempValue:"35", humValue:"20", battery:32, pos:{x:72,y:37}, tempStatus:"problem", humStatus:"warning" },
    ],
  },
];

// ─── FloorPanel ───────────────────────────────────────────────────────────────

const FloorPanel = () => {
  const [locations,   setLocations]   = useState(() => loadLocations() || DEFAULT_LOCATIONS);
  const [activeLocId, setActiveLocId] = useState(() => loadActiveLocId() || 1);
  const [showAdd,     setShowAdd]     = useState(false);
  const [showEdit,    setShowEdit]    = useState(false);
  const [showSensor,  setShowSensor]  = useState(false);
  const [editSensor,  setEditSensor]  = useState(null);

  useEffect(() => { saveLocations(locations); }, [locations]);
  useEffect(() => { saveActiveLocId(activeLocId); }, [activeLocId]);

  const activeLoc = locations.find(l => l.id === activeLocId) || locations[0];

  const handleAddLocation  = ({ name, imageDataURL }) => {
    const newLoc = { id: Date.now(), name, floorImage: imageDataURL, sensors: [] };
    setLocations(prev => [...prev, newLoc]);
    setActiveLocId(newLoc.id);
  };

  const handleEditLocation = ({ name, imageDataURL }) => {
    setLocations(prev => prev.map(l =>
      l.id === activeLocId ? { ...l, name, floorImage: imageDataURL ?? l.floorImage } : l
    ));
  };

  const handleAddSensor = (data) => {
    setLocations(prev => prev.map(l =>
      l.id === activeLocId ? { ...l, sensors: [...l.sensors, data] } : l
    ));
  };

  const handleEditSensor = (data) => {
    setLocations(prev => prev.map(l =>
      l.id === activeLocId ? { ...l, sensors: l.sensors.map(s => s === editSensor ? data : s) } : l
    ));
    setEditSensor(null);
  };

  const openEditSensor = (sensor) => { setEditSensor(sensor); setShowSensor(true); };

  return (
    <>
      <div className="panel floor-panel">
        <div className="panel-header">
          <h2 className="panel-title">План помещения</h2>
          <button className="btn-add-location" onClick={() => setShowAdd(true)}><IconPlus /> Локация</button>
        </div>

        {locations.length > 0 && (
          <div className="location-tabs">
            {locations.map(loc => (
              <button
                key={loc.id}
                className={`location-tab${loc.id === activeLocId ? " active" : ""}`}
                onClick={() => setActiveLocId(loc.id)}
              >{loc.name}</button>
            ))}
          </div>
        )}

        <div className="floor-plan-wrap">
          {activeLoc.floorImage ? (
            <div className="floor-image-container">
              <img src={activeLoc.floorImage} alt="Floor plan" className="floor-image"/>
              <div className="floor-image-overlay">
                {activeLoc.sensors.map((s, i) => {
                  const col = SENSOR_COLORS[s.tempStatus] || "#01e676";
                  const bg  = SENSOR_BG[s.tempStatus]    || "#19282b";
                  return (
                    <div key={i} className="floor-sensor-pin"
                      style={{ left:`${s.pos.x}%`, top:`${s.pos.y}%`, borderColor:col, background:bg, color:col }}
                      onClick={() => openEditSensor(s)}>
                      <div className="floor-sensor-pin-name">{s.name}</div>
                      <div className="floor-sensor-pin-vals">{s.tempValue}° / {s.humValue}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <svg className="floor-svg" viewBox="0 0 500 480" xmlns="http://www.w3.org/2000/svg">
              <rect x="20" y="20" width="460" height="440" rx="8" fill="none" stroke="#3a3a3a" strokeWidth="2"/>
              <rect x="20" y="20" width="220" height="200" fill="#1a1a1a" stroke="#2e2e2e" strokeWidth="1"/>
              <rect x="240" y="20" width="240" height="200" fill="#1a1a1a" stroke="#2e2e2e" strokeWidth="1"/>
              <rect x="20" y="220" width="460" height="240" fill="#191919" stroke="#2e2e2e" strokeWidth="1"/>
              <text x="120" y="55" fill="#444" fontSize="11" textAnchor="middle">ПХ №1</text>
              <text x="360" y="55" fill="#444" fontSize="11" textAnchor="middle">ПХ №7</text>
              <text x="240" y="255" fill="#444" fontSize="11" textAnchor="middle">Коридор</text>
              <rect x="40"  y="70"  width="80" height="50" rx="4" fill="#222" stroke="#2a2a2a"/>
              <rect x="260" y="70"  width="80" height="50" rx="4" fill="#222" stroke="#2a2a2a"/>
              <rect x="40"  y="140" width="40" height="40" rx="4" fill="#222" stroke="#2a2a2a"/>
              <rect x="160" y="140" width="40" height="40" rx="4" fill="#222" stroke="#2a2a2a"/>
              {activeLoc.sensors.map((s, i) => {
                const cx  = (s.pos.x / 100) * 460 + 20;
                const cy  = (s.pos.y / 100) * 440 + 20;
                const col = SENSOR_COLORS[s.tempStatus] || "#01e676";
                const bg  = SENSOR_BG[s.tempStatus]    || "#19282b";
                return (
                  <g key={i} style={{cursor:"pointer"}} onClick={() => openEditSensor(s)}>
                    <circle cx={cx} cy={cy} r="22" fill={bg} stroke={col} strokeWidth="1.5"/>
                    <text x={cx} y={cy-7}  fill={col} fontSize="7.5" textAnchor="middle" fontWeight="700">{s.name}</text>
                    <text x={cx} y={cy+2}  fill={col} fontSize="6.5" textAnchor="middle">{s.tempValue}°C</text>
                    <text x={cx} y={cy+11} fill={col} fontSize="6.5" textAnchor="middle">{s.humValue}%</text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>

        <div className="floor-footer">
          <div className="legend">
            <span><span className="legend-dot" style={{background:"#01e676"}}/> Нормально</span>
            <span><span className="legend-dot" style={{background:"#ffd550"}}/> Предупреждение</span>
            <span><span className="legend-dot" style={{background:"#ff5b5b"}}/> Проблема</span>
          </div>
          <div className="floor-actions">
            <button className="btn-sensor" onClick={() => { setEditSensor(null); setShowSensor(true); }}>
              <IconPencil /> Датчик
            </button>
            <button className="btn-location-name" onClick={() => setShowEdit(true)}>
              <IconPin /> {activeLoc.name}
            </button>
          </div>
        </div>
      </div>

      {showAdd    && <AddLocationModal onClose={() => setShowAdd(false)}   onSave={handleAddLocation}/>}
      {showEdit   && <EditLocationModal location={activeLoc} onClose={() => setShowEdit(false)} onSave={handleEditLocation}/>}
      {showSensor && (
        <SensorModal
          sensors={activeLoc.sensors}
          existingSensor={editSensor}
          floorImage={activeLoc.floorImage}
          onClose={() => { setShowSensor(false); setEditSensor(null); }}
          onSave={editSensor ? handleEditSensor : handleAddSensor}
        />
      )}
    </>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

const Dashboard = () => (
  <div className="dashboard-container">
    <main className="dashboard-main">
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Система мониторинга помещений</h1>
          <p className="dashboard-subtitle">Мониторинг окружающей среды и управление оповещениями в реальном времени</p>
        </div>
      </header>

      <div className="dashboard-top-row">
        <FloorPanel/>
        <section className="panel notif-panel">
          <div className="panel-header">
            <h2 className="panel-title">Уведомления</h2>
            <div className="notif-summary">
              <span className="dot dot--red"/> 2 Проблемы
              <span className="dot dot--yellow"/> 2 Предупреждения
            </div>
          </div>
          <div className="notif-list">
            <NotificationItem type="error"   title="Высокая температура" desc='Температура "Датчик 1" растет...'         location="T1 - ПХ №1"/>
            <NotificationItem type="error"   title="Высокая температура" desc='Температура "Датчик 1" растет...'         location="T1 - ПХ №1"/>
            <NotificationItem type="warning" title="Высокая влажность"   desc='Влажность "Датчик 2" превышает норму...'  location="Д2 - ПХ №7"/>
            <NotificationItem type="warning" title="Низкий заряд"        desc='Заряд батареи датчика менее 35%'          location="Д2 - ПХ №1"/>
            <NotificationItem type="ok"      title="Восстановлено"       desc='Параметры вернулись в норму'              location="Д1 - ПХ №1"/>
          </div>
        </section>
      </div>

      <div className="dashboard-bottom-row">
        <SensorCard sensor="Датчик Д1 — ПХ №1" tempValue="22.8" tempStatus="normal"  humValue="55.3" humStatus="normal"  battery={88}/>
        <SensorCard sensor="Датчик Д2 — ПХ №7" tempValue="35.6" tempStatus="problem" humValue="20.2" humStatus="warning" battery={32}/>
      </div>
    </main>
  </div>
);

export default Dashboard;