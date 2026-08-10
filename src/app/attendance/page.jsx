'use client';

import React, { useState, useEffect } from 'react';
import { formatCurrency, formatDate } from '@/lib/format';

export default function AttendancePage() {
  const [tab, setTab] = useState('attendance');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [staffList, setStaffList] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newStaff, setNewStaff] = useState({ name: '', mobile: '', salary: '' });
  const [newAdvance, setNewAdvance] = useState({ staff_id: '', amount: '', advance_date: date, notes: '' });
  const [newLeave, setNewLeave] = useState({ staff_id: '', from_date: date, to_date: date, reason: '' });

  useEffect(() => {
    loadData();
  }, [date, tab]);

  async function loadData() {
    setLoading(true);
    try {
      const [staffRes, attRes, advRes, leaveRes] = await Promise.all([
        fetch('/api/staff').then(r => r.json()),
        fetch(`/api/attendance?date=${date}`).then(r => r.json()),
        fetch('/api/advances').then(r => r.json()),
        fetch('/api/leaves').then(r => r.json()),
      ]);

      if (staffRes.data) setStaffList(staffRes.data);
      if (attRes.data) setAttendance(attRes.data);
      if (advRes.data) setAdvances(advRes.data);
      if (leaveRes.data) setLeaves(leaveRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!newStaff.name.trim()) return;
    try {
      await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStaff),
      });
      setNewStaff({ name: '', mobile: '', salary: '' });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveAttendance = async (staffId, status, notes) => {
    try {
      await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_id: staffId, date, status, notes }),
      });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddAdvance = async (e) => {
    e.preventDefault();
    if (!newAdvance.staff_id || !newAdvance.amount) return alert('Select staff and enter amount.');
    try {
      await fetch('/api/advances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdvance),
      });
      setNewAdvance({ staff_id: '', amount: '', advance_date: date, notes: '' });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddLeave = async (e) => {
    e.preventDefault();
    if (!newLeave.staff_id || !newLeave.reason) return alert('Select staff and enter reason.');
    try {
      await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLeave),
      });
      setNewLeave({ staff_id: '', from_date: date, to_date: date, reason: '' });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📋 Staff &amp; Attendance Manager</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button className={`btn ${tab === 'attendance' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('attendance')}>
          📅 Daily Attendance
        </button>
        <button className={`btn ${tab === 'staff' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('staff')}>
          👥 Staff Directory
        </button>
        <button className={`btn ${tab === 'advance' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('advance')}>
          💸 Salary Advances
        </button>
        <button className={`btn ${tab === 'leave' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('leave')}>
          🏖️ Leave Requests
        </button>
      </div>

      {/* TAB 1: DAILY ATTENDANCE */}
      {tab === 'attendance' && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Daily Attendance Tracker</span>
            <div>
              <label style={{ fontSize: '0.9rem', marginRight: '8px' }}>Date:</label>
              <input type="date" className="form-input" style={{ width: 'auto', display: 'inline-block' }} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          {attendance.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No staff profiles found. Go to "Staff Directory" tab to add workers.</div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Staff Name</th>
                    <th>Attendance Status</th>
                    <th>Notes / Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((st) => (
                    <tr key={st.id}>
                      <td style={{ fontWeight: 600 }}>{st.name}</td>
                      <td>
                        <select
                          className="form-select"
                          style={{ width: '160px' }}
                          value={st.status || 'present'}
                          onChange={(e) => handleSaveAttendance(st.id, e.target.value, st.notes)}
                        >
                          <option value="present">✅ Present</option>
                          <option value="absent">❌ Absent</option>
                          <option value="half">🌓 Half Day</option>
                          <option value="leave">🏖️ On Leave</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Add note..."
                          defaultValue={st.notes || ''}
                          onBlur={(e) => handleSaveAttendance(st.id, st.status || 'present', e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STAFF DIRECTORY */}
      {tab === 'staff' && (
        <div className="card">
          <div className="card-header">Add New Staff Member</div>
          <form onSubmit={handleAddStaff} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'end', marginBottom: '24px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Staff Name *</label>
              <input type="text" className="form-input" required value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Mobile</label>
              <input type="text" className="form-input" value={newStaff.mobile} onChange={(e) => setNewStaff({ ...newStaff, mobile: e.target.value })} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Monthly Salary (₹)</label>
              <input type="number" className="form-input" value={newStaff.salary} onChange={(e) => setNewStaff({ ...newStaff, salary: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary">Add Staff</button>
          </form>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Monthly Salary</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((st, i) => (
                  <tr key={st.id}>
                    <td>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{st.name}</td>
                    <td>{st.mobile || 'N/A'}</td>
                    <td>{formatCurrency(st.salary)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SALARY ADVANCES */}
      {tab === 'advance' && (
        <div className="card">
          <div className="card-header">Record Salary Advance</div>
          <form onSubmit={handleAddAdvance} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '12px', alignItems: 'end', marginBottom: '24px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Staff Member *</label>
              <select className="form-select" required value={newAdvance.staff_id} onChange={(e) => setNewAdvance({ ...newAdvance, staff_id: e.target.value })}>
                <option value="">Select Staff</option>
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Advance Amount (₹) *</label>
              <input type="number" className="form-input" required value={newAdvance.amount} onChange={(e) => setNewAdvance({ ...newAdvance, amount: e.target.value })} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Date</label>
              <input type="date" className="form-input" value={newAdvance.advance_date} onChange={(e) => setNewAdvance({ ...newAdvance, advance_date: e.target.value })} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Notes</label>
              <input type="text" className="form-input" value={newAdvance.notes} onChange={(e) => setNewAdvance({ ...newAdvance, notes: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary">Record Advance</button>
          </form>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Staff</th>
                  <th>Date</th>
                  <th>Advance Amount</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {advances.map((ad) => (
                  <tr key={ad.id}>
                    <td style={{ fontWeight: 600 }}>{ad.staff_name}</td>
                    <td>{formatDate(ad.advance_date)}</td>
                    <td style={{ color: 'var(--danger)', fontWeight: 700 }}>{formatCurrency(ad.amount)}</td>
                    <td>{ad.notes || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: LEAVE REQUESTS */}
      {tab === 'leave' && (
        <div className="card">
          <div className="card-header">Record Leave Request</div>
          <form onSubmit={handleAddLeave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr auto', gap: '12px', alignItems: 'end', marginBottom: '24px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Staff Member *</label>
              <select className="form-select" required value={newLeave.staff_id} onChange={(e) => setNewLeave({ ...newLeave, staff_id: e.target.value })}>
                <option value="">Select Staff</option>
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">From Date</label>
              <input type="date" className="form-input" value={newLeave.from_date} onChange={(e) => setNewLeave({ ...newLeave, from_date: e.target.value })} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">To Date</label>
              <input type="date" className="form-input" value={newLeave.to_date} onChange={(e) => setNewLeave({ ...newLeave, to_date: e.target.value })} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Reason *</label>
              <input type="text" className="form-input" required value={newLeave.reason} onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary">Record Leave</button>
          </form>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Staff</th>
                  <th>Dates</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((l) => (
                  <tr key={l.id}>
                    <td style={{ fontWeight: 600 }}>{l.staff_name}</td>
                    <td>{formatDate(l.from_date)} - {formatDate(l.to_date)}</td>
                    <td>{l.reason}</td>
                    <td><span className="badge badge-paid">APPROVED</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
