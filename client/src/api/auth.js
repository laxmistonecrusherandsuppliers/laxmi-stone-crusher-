import api from './axios';
export const loginApi = (identifier, password) => api.post('/auth/login', { identifier, password });
export const getMeApi = () => api.get('/auth/me');
