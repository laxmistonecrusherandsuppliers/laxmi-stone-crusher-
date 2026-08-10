import api from './axios';
export const getMaterials = () => api.get('/materials').then(r => r.data.data);
export const createMaterial = (name) => api.post('/materials', { name }).then(r => r.data);
export const getSavedRates = () => api.get('/materials/rates').then(r => r.data.data);
export const updateSavedRate = (materialId, rate, unit) => api.put(`/materials/rates/${materialId}`, { rate_per_unit: rate, unit }).then(r => r.data);
export const updateMaterial = (id, data) => api.put(`/materials/${id}`, data).then(r => r.data);
