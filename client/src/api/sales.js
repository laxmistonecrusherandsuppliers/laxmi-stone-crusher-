import api from './axios';
export const getSales = (filters) => api.get('/sales', { params: filters }).then(r => r.data);
export const createSale = (data) => api.post('/sales', data).then(r => r.data);
export const getSale = (id) => api.get(`/sales/${id}`).then(r => r.data.data);
export const addPayment = (saleId, data) => api.post(`/sales/${saleId}/payments`, data).then(r => r.data);
export const getDashboardStats = () => api.get('/sales/stats/dashboard').then(r => r.data.data);
export const getRecentSales = () => api.get('/sales/stats/recent').then(r => r.data.data);
