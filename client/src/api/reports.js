import api from './axios';
export const getDailyReport = (from, to) => api.get('/reports/daily', { params: { from, to } }).then(r => r.data.data);
export const getCustomerWiseReport = (from, to) => api.get('/reports/customer-wise', { params: { from, to } }).then(r => r.data.data);
export const getMaterialWiseReport = (from, to) => api.get('/reports/material-wise', { params: { from, to } }).then(r => r.data.data);
export const getDueReport = (asOf) => api.get('/reports/due', { params: { as_of: asOf } }).then(r => r.data.data);
export const getReportPdf = (type, from, to) => {
  const token = localStorage.getItem('lsc_token');
  return fetch(`/api/reports/pdf?type=${type}&from=${from || ''}&to=${to || ''}`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.blob());
};
