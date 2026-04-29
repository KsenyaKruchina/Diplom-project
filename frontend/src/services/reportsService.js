// frontend/src/services/reportsService.js
// ─── Сервис для скачивания отчётов ───────────────────────────────────────────
//
// Использует getToken() из api.js — тот же ключ "token" в localStorage.
// BASE_URL берётся из VITE_API_BASE_URL (как и везде в проекте).

import { getToken } from "./api";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

// ─── Маппинг UI-периодов → API-значения ──────────────────────────────────────
export const PERIOD_MAP = {
  day:   "last_24_hours",
  week:  "last_week",
  month: "last_month",
  year:  "last_year",
};

// ─── Внутренний хелпер: скачать файл через авторизованный запрос ─────────────
const downloadBlob = async (path, fallbackFilename) => {
  const token = getToken();

  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (response.status === 401) {
    throw new Error("Сессия истекла. Войдите снова.");
  }

  if (!response.ok) {
    let msg = `Ошибка ${response.status}`;
    try {
      const err = await response.json();
      if (err.detail) msg = typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail);
    } catch {}
    throw new Error(msg);
  }

  // Имя файла из Content-Disposition если есть
  let filename = fallbackFilename;
  const disposition = response.headers.get("Content-Disposition");
  if (disposition) {
    const match = disposition.match(/filename[^;=\n]*=([^;\n]*)/);
    if (match) filename = match[1].replace(/['"]/g, "").trim();
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ─── Скачать отчёт по датчику за предустановленный период ────────────────────
export const downloadPeriodReport = async (sensorId, period, format = "xlsx") => {
  const params = new URLSearchParams({ period, format });
  await downloadBlob(
    `/reports/download-period/${sensorId}?${params}`,
    `report_sensor_${sensorId}_${period}.${format}`
  );
};

// ─── Скачать отчёт по датчику за произвольный диапазон ───────────────────────
export const downloadRangeReport = async (sensorId, startDate, endDate, format = "xlsx") => {
  const params = new URLSearchParams({
    period: "custom",
    start_date: startDate.slice(0, 10),
    end_date:   endDate.slice(0, 10),
    format,
  });
  await downloadBlob(
    `/reports/download-period/${sensorId}?${params}`,
    `report_sensor_${sensorId}_${startDate.slice(0,10)}_${endDate.slice(0,10)}.${format}`
  );
};

// ─── Скачать сводный отчёт по локации ────────────────────────────────────────
export const downloadLocationReport = async (locationId, period, format = "xlsx") => {
  const params = new URLSearchParams({ period, format });
  await downloadBlob(
    `/reports/download-period-location/${locationId}?${params}`,
    `report_location_${locationId}_${period}.${format}`
  );
};

export default { downloadPeriodReport, downloadRangeReport, downloadLocationReport, PERIOD_MAP };