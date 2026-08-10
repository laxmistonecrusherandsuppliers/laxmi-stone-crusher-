import api from './axios';
export const getStaff=()=>api.get('/attendance/staff').then(r=>r.data.data);
export const addStaff=data=>api.post('/attendance/staff',data).then(r=>r.data.data);
export const getAttendance=date=>api.get('/attendance',{params:{date}}).then(r=>r.data.data);
export const saveAttendance=data=>api.post('/attendance',data).then(r=>r.data.data);
export const getAdvances=()=>api.get('/attendance/advances').then(r=>r.data.data);
export const addAdvance=data=>api.post('/attendance/advances',data).then(r=>r.data.data);
export const getLeaves=()=>api.get('/attendance/leaves').then(r=>r.data.data);
export const addLeave=data=>api.post('/attendance/leaves',data).then(r=>r.data.data);
