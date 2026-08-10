'use client';

import React, { useState, useEffect } from 'react';
import { formatCurrency, formatDate } from '@/lib/format';

export default function ReportsPage() {
  const [type, setType] = useState('customer-wise');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportData();
  }, [type, from, to]);

  async function loadReportData() {
    setLoading(true);
    try {
      let endpoint = `/api/reports?type=${type}&`;
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

  // Filter customer-wise data by client search input
  const filteredData = data.filter(item => {
    if (!customerSearch.trim()) return true;
    const searchLower = customerSearch.toLowerCase();
    return (
      item.customer_name?.toLowerCase().includes(searchLower) ||
      item.customer_mobile?.includes(searchLower) ||
      item.material_name?.toLowerCase().includes(searchLower)
    );
  });

  const totals = filteredData.reduce(
    (acc, r) => {
      acc.total_billed += parseFloat(r.total_billed || r.grand_total || r.total_amount || 0);
      acc.total_paid += parseFloat(r.total_paid || r.amount_paid || 0);
      acc.total_due += parseFloat(r.total_due || r.amount_due || 0);
      acc.total_orders += parseInt(r.total_orders || r.count || 1);
      return acc;
    },
    { total_billed: 0, total_paid: 0, total_due: 0, total_orders: 0 }
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📊 Business Sales Reports</h1>
      </div>

      {/* Report Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          className={`btn ${type === 'customer-wise' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setType('customer-wise')}
        >
          👥 Customer-Wise Sales
        </button>
        <button
          className={`btn ${type === 'daily' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setType('daily')}
        >
          📅 Daily Sales
        </button>
        <button
          className={`btn ${type === 'material-wise' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setType('material-wise')}
        >
          🪨 Material-Wise Sales
        </button>
        <button
          className={`btn ${type === 'due' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setType('due')}
        >
          ⚠️ Outstanding Dues
        </button>
      </div>

      {/* Date Filter Card */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'end', flexWrap: 'wrap' }}>
          <div>
            <label className="form-label">From Date</label>
            <input
              type="date"
              className="form-input"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">To Date</label>
            <input
              type="date"
              className="form-input"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          {type === 'customer-wise' && (
            <div style={{ flex: 1, minWidth: '220px' }}>
              <label className="form-label">Filter Customer Name/Mobile</label>
              <input
                type="text"
                className="form-input"
                placeholder="Search customer..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
            </div>
          )}

          <div>
            <button
              className="btn btn-secondary"
              onClick={() => { setFrom(''); setTo(''); setCustomerSearch(''); }}
            >
              🔄 Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="stat-cards-grid">
        <div className="stat-card">
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Sales Billed</div>
            <div className="stat-value" style={{ color: 'var(--primary)' }}>
              {formatCurrency(totals.total_billed)}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {totals.total_orders} total orders
            </div>
          </div>
          <div className="stat-icon">📊</div>
        </div>

        <div className="stat-card">
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Amount Paid</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>
              {formatCurrency(totals.total_paid)}
            </div>
          </div>
          <div className="stat-icon">💰</div>
        </div>

        <div className="stat-card">
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Remaining Due</div>
            <div className="stat-value" style={{ color: totals.total_due > 0 ? 'var(--danger)' : 'inherit' }}>
              {formatCurrency(totals.total_due)}
            </div>
          </div>
          <div className="stat-icon">⚠️</div>
        </div>
      </div>

      {/* Report Results Table */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>
            {type === 'customer-wise' && '👥 Customer-Wise Sales Report'}
            {type === 'daily' && '📅 Daily Sales Breakdown'}
            {type === 'material-wise' && '🪨 Material Sales Volume Report'}
            {type === 'due' && '⚠️ Outstanding Customer Dues'}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {from || to ? `Filtered: ${from || 'Start'} to ${to || 'Today'}` : 'All Time'}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center' }}>Generating report data...</div>
        ) : filteredData.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No sales records match the selected date range.
          </div>
        ) : (
          <div className="table-container">
            {/* TYPE 1: CUSTOMER WISE */}
            {type === 'customer-wise' && (
              <table className="table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Mobile</th>
                    <th>Total Orders</th>
                    <th>Total Billed</th>
                    <th>Total Paid</th>
                    <th>Total Due Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{row.customer_name}</td>
                      <td>{row.customer_mobile || 'N/A'}</td>
                      <td>{row.total_orders} bills</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(row.total_billed)}</td>
                      <td style={{ color: 'var(--success)' }}>{formatCurrency(row.total_paid)}</td>
                      <td style={{ color: parseFloat(row.total_due) > 0 ? 'var(--danger)' : 'inherit', fontWeight: parseFloat(row.total_due) > 0 ? 700 : 400 }}>
                        {formatCurrency(row.total_due)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* TYPE 2: DAILY SALES */}
            {type === 'daily' && (
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Orders Count</th>
                    <th>Total Billed</th>
                    <th>Collected</th>
                    <th>Due Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{formatDate(row.sale_date)}</td>
                      <td>{row.total_orders} bills</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(row.total_billed)}</td>
                      <td style={{ color: 'var(--success)' }}>{formatCurrency(row.total_paid)}</td>
                      <td style={{ color: parseFloat(row.total_due) > 0 ? 'var(--danger)' : 'inherit', fontWeight: parseFloat(row.total_due) > 0 ? 700 : 400 }}>
                        {formatCurrency(row.total_due)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* TYPE 3: MATERIAL WISE */}
            {type === 'material-wise' && (
              <table className="table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Total Quantity Sold</th>
                    <th>Average Rate (₹)</th>
                    <th>Total Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{row.material_name}</td>
                      <td>{parseFloat(row.total_quantity).toFixed(3)} {row.unit || 'Tonne'}</td>
                      <td>{formatCurrency(row.avg_rate)}</td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(row.total_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* TYPE 4: OUTSTANDING DUES */}
            {type === 'due' && (
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Customer Name</th>
                    <th>Mobile</th>
                    <th>Sale Date</th>
                    <th>Grand Total</th>
                    <th>Paid</th>
                    <th>Outstanding Due</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{row.invoice_number}</td>
                      <td>{row.customer_name}</td>
                      <td>{row.customer_mobile || 'N/A'}</td>
                      <td>{formatDate(row.sale_date)}</td>
                      <td>{formatCurrency(row.grand_total)}</td>
                      <td style={{ color: 'var(--success)' }}>{formatCurrency(row.amount_paid)}</td>
                      <td style={{ color: 'var(--danger)', fontWeight: 700 }}>{formatCurrency(row.amount_due)}</td>
                      <td>
                        <a href={`/sales/${row.id}`} className="btn btn-danger btn-sm">
                          💳 Settle Due
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
