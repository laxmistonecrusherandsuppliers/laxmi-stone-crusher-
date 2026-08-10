'use client';

import React, { useState, useEffect } from 'react';
import { formatCurrency, formatDate } from '@/lib/format';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('daily');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReport();
  }, [reportType, from, to]);

  async function loadReport() {
    setLoading(true);
    try {
      let endpoint = `/api/sales?`;
      if (from) endpoint += `from=${from}&`;
      if (to) endpoint += `to=${to}&`;
      const res = await fetch(endpoint).then(r => r.json());
      if (res.data) setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const totals = data.reduce(
    (acc, item) => {
      acc.total_amount += parseFloat(item.grand_total) || 0;
      acc.total_paid += parseFloat(item.amount_paid) || 0;
      acc.total_due += parseFloat(item.amount_due) || 0;
      return acc;
    },
    { total_amount: 0, total_paid: 0, total_due: 0 }
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📊 Business Sales Reports</h1>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <label className="form-label">From Date</label>
            <input type="date" className="form-input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="form-label">To Date</label>
            <input type="date" className="form-input" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div style={{ marginTop: '24px' }}>
            <button className="btn btn-secondary" onClick={() => { setFrom(''); setTo(''); }}>Clear Filter</button>
          </div>
        </div>
      </div>

      {/* Report Summary Cards */}
      <div className="stat-cards-grid">
        <div className="stat-card">
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Sales Count</div>
            <div className="stat-value">{data.length} transactions</div>
            <div style={{ color: 'var(--primary)', fontWeight: 700 }}>{formatCurrency(totals.total_amount)}</div>
          </div>
          <div className="stat-icon">📊</div>
        </div>

        <div className="stat-card">
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Amount Collected</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{formatCurrency(totals.total_paid)}</div>
          </div>
          <div className="stat-icon">💰</div>
        </div>

        <div className="stat-card">
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Outstanding Due</div>
            <div className="stat-value" style={{ color: totals.total_due > 0 ? 'var(--danger)' : 'inherit' }}>
              {formatCurrency(totals.total_due)}
            </div>
          </div>
          <div className="stat-icon">⚠️</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">📋 Detailed Sales Breakdown</div>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center' }}>Generating report data...</div>
        ) : data.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No records for the selected period.</div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Customer</th>
                  <th>Sale Date</th>
                  <th>Grand Total</th>
                  <th>Collected</th>
                  <th>Due Balance</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.id}>
                    <td style={{ fontWeight: 600 }}>{row.invoice_number}</td>
                    <td>{row.customer_name || 'N/A'}</td>
                    <td>{formatDate(row.sale_date)}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(row.grand_total)}</td>
                    <td style={{ color: 'var(--success)' }}>{formatCurrency(row.amount_paid)}</td>
                    <td style={{ color: parseFloat(row.amount_due) > 0 ? 'var(--danger)' : 'inherit', fontWeight: parseFloat(row.amount_due) > 0 ? 700 : 400 }}>
                      {formatCurrency(row.amount_due)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
