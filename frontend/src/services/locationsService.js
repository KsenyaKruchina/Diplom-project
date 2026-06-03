// frontend/src/services/locationsService.js
//  Сервис локаций 

import { apiRequest, apiUpload, getAssetUrlCandidates } from "./api";

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
  return apiRequest(`/locations/${id}/`);
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

  return apiUpload(`/locations/${locationId}/upload-plan/`, formData, "POST");
};

/**
 * Сформировать полный URL изображения плана.
 * Старые абсолютные http://IP/uploads/... ссылки переводим на текущий HTTPS-origin.
 * @param {string|null} imageUrl
 * @returns {string|null}
 */
export const getFullImageUrl = (imageUrl) => {
  return getAssetUrlCandidates(imageUrl)[0] || null;
};
