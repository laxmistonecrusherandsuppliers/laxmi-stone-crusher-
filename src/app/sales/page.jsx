'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/format';

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    loadSales();
  }, [from, to]);

  async function loadSales() {
    try {
      let url = '/api/sales?';
      if (from) url += `from=${from}&`;
      if (to) url += `to=${to}&`;
      const res = await fetch(url).then(r => r.json());
      if (res.data) setSales(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🧾 All Sales &amp; Invoices</h1>
        <Link href="/sales/new" className="btn btn-primary">
          ➕ New Sale
        </Link>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div>
            <label className="form-label">From Date</label>
            <input type="date" className="form-input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="form-label">To Date</label>
            <input type="date" className="form-input" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div style={{ marginTop: '24px' }}>
            <button className="btn btn-secondary" onClick={() => { setFrom(''); setTo(''); }}>Clear Dates</button>
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center' }}>Loading sales...</div>
        ) : sales.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No sales found for selected dates.</div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Customer</th>
                  <th>Sale Date</th>
                  <th>GST</th>
                  <th>Status</th>
                  <th>Grand Total</th>
                  <th>Paid</th>
                  <th>Due</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.invoice_number}</td>
                    <td>{s.customer_name || 'N/A'}</td>
                    <td>{formatDate(s.sale_date)}</td>
                    <td>{s.gst_enabled ? '✅ YES' : '❌ NO'}</td>
                    <td>
                      <span className={`badge badge-${s.payment_mode}`}>{s.payment_mode?.toUpperCase()}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(s.grand_total)}</td>
                    <td style={{ color: 'var(--success)' }}>{formatCurrency(s.amount_paid)}</td>
                    <td style={{ color: parseFloat(s.amount_due) > 0 ? 'var(--danger)' : 'inherit', fontWeight: parseFloat(s.amount_due) > 0 ? 700 : 400 }}>
                      {formatCurrency(s.amount_due)}
                    </td>
                    <td>
                      <Link href={`/sales/${s.id}`} className="btn btn-ghost btn-sm">
                        👁️ View Invoice
                      </Link>
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
