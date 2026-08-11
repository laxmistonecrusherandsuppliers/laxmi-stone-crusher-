'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { formatCurrency, formatDate } from '@/lib/format';

export default function ReportsPage() {
  const [type, setType] = useState('customer-wise');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [data, setData] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  const reportPrintRef = useRef(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(res => { if (res.data) setSettings(res.data); });
  }, []);

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

  const handlePrint = useReactToPrint({
    contentRef: reportPrintRef,
    documentTitle: `${type}-sales-report-${from || 'all'}-${to || 'all'}`,
  });

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
      <div className="page-header no-print">
        <h1 className="page-title">📊 Business Sales Reports</h1>
        <button className="btn btn-primary" onClick={handlePrint} disabled={loading || filteredData.length === 0}>
          🖨️ Print {type === 'customer-wise' ? 'Customer-Wise' : ''} Report
        </button>
      </div>

      {/* Report Tabs */}
      <div className="no-print" style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
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
      <div className="card no-print" style={{ marginBottom: '20px' }}>
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

      {/* PRINTABLE CONTAINER AREA */}
      <div ref={reportPrintRef} style={{ padding: '10px' }}>
        {/* Printable Header Letterhead (Visible during print & report view) */}
        <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid var(--primary)', paddingBottom: '16px' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
            {settings.business_name || 'Lakshmi Stone Crusher & Suppliers'}
          </h2>
          <div style={{ fontSize: '0.9rem', color: '#4b5563' }}>{settings.business_address}</div>
          <div style={{ fontSize: '0.9rem', color: '#4b5563' }}>Ph: {settings.business_mobile} {settings.gstin ? `| GSTIN: ${settings.gstin}` : ''}</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '10px', textTransform: 'uppercase' }}>
            {type === 'customer-wise' && 'Customer-Wise Sales Summary Report'}
            {type === 'daily' && 'Daily Sales Breakdown Report'}
            {type === 'material-wise' && 'Material Sales Volume Report'}
            {type === 'due' && 'Outstanding Customer Dues Report'}
          </h3>
          <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
            Period: {from ? formatDate(from) : 'Beginning'} to {to ? formatDate(to) : 'Present Date'} | Generated: {formatDate(new Date())}
          </div>
        </div>

        {/* Summary KPI Cards */}
        <div className="stat-cards-grid" style={{ marginBottom: '20px' }}>
          <div className="stat-card" style={{ border: '1px solid var(--border)' }}>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Sales Billed</div>
              <div className="stat-value" style={{ color: 'var(--primary)' }}>
                {formatCurrency(totals.total_billed)}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {totals.total_orders} total orders
              </div>
            </div>
            <div className="stat-icon no-print">📊</div>
          </div>

          <div className="stat-card" style={{ border: '1px solid var(--border)' }}>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Amount Paid</div>
              <div className="stat-value" style={{ color: 'var(--success)' }}>
                {formatCurrency(totals.total_paid)}
              </div>
            </div>
            <div className="stat-icon no-print">💰</div>
          </div>

          <div className="stat-card" style={{ border: '1px solid var(--border)' }}>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Remaining Due</div>
              <div className="stat-value" style={{ color: totals.total_due > 0 ? 'var(--danger)' : 'inherit' }}>
                {formatCurrency(totals.total_due)}
              </div>
            </div>
            <div className="stat-icon no-print">⚠️</div>
          </div>
        </div>

        {/* Report Results Table */}
        <div className="card" style={{ border: '1px solid var(--border)' }}>
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
                      <th>#</th>
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
                        <td>{i + 1}</td>
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
                  <tfoot>
                    <tr style={{ background: '#f8fafc', fontWeight: 700, borderTop: '2px solid var(--border)' }}>
                      <td colSpan="3">TOTAL SUMMARY</td>
                      <td>{totals.total_orders} bills</td>
                      <td style={{ color: 'var(--primary)' }}>{formatCurrency(totals.total_billed)}</td>
                      <td style={{ color: 'var(--success)' }}>{formatCurrency(totals.total_paid)}</td>
                      <td style={{ color: totals.total_due > 0 ? 'var(--danger)' : 'inherit' }}>{formatCurrency(totals.total_due)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}

              {/* TYPE 2: DAILY SALES */}
              {type === 'daily' && (
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
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
                        <td>{i + 1}</td>
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
                      <th>#</th>
                      <th>Material</th>
                      <th>Total Quantity Sold</th>
                      <th>Average Rate (₹)</th>
                      <th>Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((row, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
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
                      <th className="no-print">Action</th>
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
                        <td className="no-print">
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

        {/* Report Footer / Signature Line (Visible during print) */}
        <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b7280', paddingTop: '16px', borderTop: '1px dashed #ccc' }}>
          <div>Generated by Lakshmi Stone Crusher Software</div>
          <div style={{ textAlign: 'right' }}>Authorized Signature: ______________________</div>
        </div>
      </div>
    </div>
  );
}
