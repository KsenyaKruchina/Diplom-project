// frontend/src/services/locationsService.js
//  Сервис локаций 

import { apiRequest, apiUpload } from "./api";

// Базовый URL бэкенда (для формирования image_url)
// Если бэкенд на том же домене — оставь пустую строку ""
export const BACKEND_ORIGIN = "";

/**
 * Получить список всех локаций (только admin).
 * @returns {Array} LocationGroup[]
 */
export const getLocations = async () => {
  return apiRequest("/locations/");
};

/**
 * Получить одну локацию по ID.
 * @returns {object} LocationGroup
 */
export const getLocation = async (id) => {
  return apiRequest(`/locations/${id}`);
};

/**
 * Создать новую локацию с необязательным планом-изображением.
 * @param {string} name - Название локации
 * @param {File|null} file - PNG/JPG/SVG файл плана (необязательно)
 * @param {number|null} parentId - ID родительской локации (необязательно)
 * @returns {object} LocationGroup
 */
export const createLocation = async (name, file = null, parentId = null) => {
  const formData = new FormData();
  formData.append("name", name);
  if (parentId) formData.append("parent_id", String(parentId));
  if (file) formData.append("file", file);

  return apiUpload("/locations/", formData, "POST");
};

/**
 * Загрузить или заменить план для существующей локации.
 * @param {number} locationId
 * @param {File} file
 * @returns {object} LocationGroup
 */
export const uploadLocationPlan = async (locationId, file) => {
  const formData = new FormData();
  formData.append("file", file);

  return apiUpload(`/locations/${locationId}/upload-plan`, formData, "POST");
};

/**
 * Сформировать полный URL изображения плана.
 * Если image_url уже полный (начинается с http) — возвращаем как есть.
 * Иначе — добавляем BACKEND_ORIGIN.
 * @param {string|null} imageUrl
 * @returns {string|null}
 */
export const getFullImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${BACKEND_ORIGIN}${imageUrl}`;
};