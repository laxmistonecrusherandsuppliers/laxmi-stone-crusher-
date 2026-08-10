import api from './axios';
export const getCustomers = (search) => api.get('/customers', { params: { search } }).then(r => r.data.data);
export const createCustomer = (data) => api.post('/customers', data).then(r => r.data);
export const getCustomer = (id) => api.get(`/customers/${id}`).then(r => r.data.data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data).then(r => r.data);
export const deleteCustomer = (id) => api.delete(`/customers/${id}`).then(r => r.data);
export const getCustomerSales = (id, from, to) => api.get(`/customers/${id}/sales`, { params: { from, to } }).then(r => r.data.data);
export const getCustomerLedger = (id) => api.get(`/customers/${id}/ledger`).then(r => r.data.data);
