'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { formatCurrency, formatDate } from '@/lib/format';
import { Printer, Users, CalendarDays, Layers, AlertTriangle, RotateCcw, BarChart3, IndianRupee, CreditCard, FileText, Search } from 'lucide-react';

export default function ReportsPage() {
  const [type, setType] = useState('customer-statement');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customersList, setCustomersList] = useState([]);
  const [data, setData] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  const reportPrintRef = useRef(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/settings').then(r => r.json()),
      fetch('/api/customers').then(r => r.json()),
    ]).then(([setRes, custRes]) => {
      if (setRes.data) setSettings(setRes.data);
      if (custRes.data) {
        setCustomersList(custRes.data);
        if (custRes.data.length > 0 && !selectedCustomerId) {
          setSelectedCustomerId(String(custRes.data[0].id));
        }
      }
    }).catch(err => console.error(err));
  }, []);

  useEffect(() => {
    loadReportData();
  }, [type, from, to, selectedCustomerId]);

  async function loadReportData() {
    setLoading(true);
    try {
      let endpoint = `/api/reports?type=${type}&`;
      if (from) endpoint += `from=${from}&`;
      if (to) endpoint += `to=${to}&`;
      if (type === 'customer-statement' && selectedCustomerId) {
        endpoint += `customer_id=${selectedCustomerId}&`;
      }
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
    if (type !== 'customer-wise' || !customerSearch.trim()) return true;
    const searchLower = customerSearch.toLowerCase();
    return (
      item.customer_name?.toLowerCase().includes(searchLower) ||
      item.customer_mobile?.includes(searchLower) ||
      item.material_name?.toLowerCase().includes(searchLower)
    );
  });

  // Calculate totals
  const totals = filteredData.reduce(
    (acc, r) => {
      acc.total_billed += parseFloat(r.total_billed || r.grand_total || r.total_amount || r.item_amount || 0);
      acc.total_paid += parseFloat(r.total_paid || r.amount_paid || 0);
      acc.total_due += parseFloat(r.total_due || r.amount_due || 0);
      acc.total_orders += parseInt(r.total_orders || r.count || 1);
      acc.total_qty += parseFloat(r.quantity || r.total_quantity || 0);
      return acc;
    },
    { total_billed: 0, total_paid: 0, total_due: 0, total_orders: 0, total_qty: 0 }
  );

  // Bill-level totals for Customer Statement map
  const selectedCustomerInfo = customersList.find(c => String(c.id) === String(selectedCustomerId));
  const statementSalesMap = new Map();
  if (type === 'customer-statement') {
    filteredData.forEach(r => {
      if (r.sale_id && !statementSalesMap.has(r.sale_id)) {
        statementSalesMap.set(r.sale_id, {
          grand_total: parseFloat(r.grand_total || 0),
          amount_paid: parseFloat(r.amount_paid || 0),
          amount_due: parseFloat(r.amount_due || 0),
        });
      }
    });
  }

  let statementTotalBilled = 0;
  let statementTotalPaid = 0;
  let statementTotalDue = 0;
  statementSalesMap.forEach(s => {
    statementTotalBilled += s.grand_total;
    statementTotalPaid += s.amount_paid;
    statementTotalDue += s.amount_due;
  });

  return (
    <div>
      <div className="page-header no-print">
        <h1 className="page-title">Sales Reports &amp; Customer Statement</h1>
        <button className="btn btn-primary" onClick={handlePrint} disabled={loading || filteredData.length === 0}>
          <Printer size={14} /> Print {type === 'customer-statement' ? 'Customer Statement' : 'Report'}
        </button>
      </div>

      {/* Report Tabs */}
      <div className="tabs no-print" style={{ marginBottom: '20px' }}>
        <button
          className={`tab-btn ${type === 'customer-statement' ? 'active' : ''}`}
          onClick={() => setType('customer-statement')}
        >
          <FileText size={14} /> Customer Statement (Itemized)
        </button>
        <button
          className={`tab-btn ${type === 'customer-wise' ? 'active' : ''}`}
          onClick={() => setType('customer-wise')}
        >
          <Users size={14} /> Customer-Wise Summary
        </button>
        <button
          className={`tab-btn ${type === 'daily' ? 'active' : ''}`}
          onClick={() => setType('daily')}
        >
          <CalendarDays size={14} /> Daily Sales
        </button>
        <button
          className={`tab-btn ${type === 'material-wise' ? 'active' : ''}`}
          onClick={() => setType('material-wise')}
        >
          <Layers size={14} /> Material-Wise
        </button>
        <button
          className={`tab-btn ${type === 'due' ? 'active' : ''}`}
          onClick={() => setType('due')}
        >
          <AlertTriangle size={14} /> Outstanding Dues
        </button>
      </div>

      {/* Date & Customer Filter Card */}
      <div className="card no-print" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'end', flexWrap: 'wrap' }}>
          {type === 'customer-statement' && (
            <div style={{ flex: 1, minWidth: '240px' }}>
              <label className="form-label">Select Customer Account *</label>
              <select
                className="form-select"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
              >
                <option value="">Select Customer...</option>
                {customersList.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.mobile ? `(${c.mobile})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

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
              <RotateCcw size={14} /> Reset
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
            {type === 'customer-statement' && `Customer Detailed Statement (${selectedCustomerInfo?.name || 'Customer'})`}
            {type === 'customer-wise' && 'Customer-Wise Sales Summary Report'}
            {type === 'daily' && 'Daily Sales Breakdown Report'}
            {type === 'material-wise' && 'Material Sales Volume Report'}
            {type === 'due' && 'Outstanding Customer Dues Report'}
          </h3>
          <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
            Period: {from ? formatDate(from) : 'Beginning'} to {to ? formatDate(to) : 'Present Date'} | Generated: {formatDate(new Date())}
          </div>
        </div>

        {/* Customer Info Box for Customer Statement */}
        {type === 'customer-statement' && selectedCustomerInfo && (
          <div className="card" style={{ marginBottom: '20px', padding: '16px 20px', background: '#f8fafc' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', fontSize: '0.875rem' }}>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Customer Name</div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{selectedCustomerInfo.name}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Contact Mobile</div>
                <div>{selectedCustomerInfo.mobile || 'N/A'}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Address</div>
                <div>{selectedCustomerInfo.address || 'N/A'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Summary KPI Cards */}
        <div className="stat-cards-grid" style={{ marginBottom: '20px' }}>
          <div className="stat-card" style={{ border: '1px solid var(--border)' }}>
            <div>
              <div className="stat-label">Total Sales Billed</div>
              <div className="stat-value" style={{ color: 'var(--primary)' }}>
                {formatCurrency(type === 'customer-statement' ? statementTotalBilled : totals.total_billed)}
              </div>
              <div className="stat-meta">
                {type === 'customer-statement' ? `${statementSalesMap.size} invoices` : `${totals.total_orders} total orders`}
              </div>
            </div>
            <div className="stat-icon stat-icon-blue no-print"><BarChart3 size={20} /></div>
          </div>

          <div className="stat-card" style={{ border: '1px solid var(--border)' }}>
            <div>
              <div className="stat-label">Total Amount Paid</div>
              <div className="stat-value" style={{ color: 'var(--success)' }}>
                {formatCurrency(type === 'customer-statement' ? statementTotalPaid : totals.total_paid)}
              </div>
            </div>
            <div className="stat-icon stat-icon-green no-print"><IndianRupee size={20} /></div>
          </div>

          <div className="stat-card" style={{ border: '1px solid var(--border)' }}>
            <div>
              <div className="stat-label">Total Remaining Due</div>
              <div className="stat-value" style={{ color: (type === 'customer-statement' ? statementTotalDue : totals.total_due) > 0 ? 'var(--danger)' : 'inherit' }}>
                {formatCurrency(type === 'customer-statement' ? statementTotalDue : totals.total_due)}
              </div>
            </div>
            <div className="stat-icon stat-icon-red no-print"><AlertTriangle size={20} /></div>
          </div>
        </div>

        {/* Report Results Table */}
        <div className="card" style={{ border: '1px solid var(--border)' }}>
          {loading ? (
            <div style={{ padding: '36px', textAlign: 'center' }}>Generating report data...</div>
          ) : filteredData.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No sales records match the selected customer and date range.
            </div>
          ) : (
            <div className="table-container">
              {/* TYPE 0: CUSTOMER DETAILED STATEMENT (Sr No, Date, Item, Price/Rate, Quantity, Total Amount + Bottom Total) */}
              {type === 'customer-statement' && (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Sr No</th>
                      <th>Date</th>
                      <th>Invoice No</th>
                      <th>Item / Material</th>
                      <th>Quantity</th>
                      <th style={{ textAlign: 'right' }}>Price / Rate (₹)</th>
                      <th style={{ textAlign: 'right' }}>Total Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((row, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{formatDate(row.sale_date)}</td>
                        <td style={{ fontWeight: 600 }}>{row.invoice_number}</td>
                        <td style={{ fontWeight: 500 }}>{row.material_name}</td>
                        <td>{parseFloat(row.quantity || 0).toFixed(3)} {row.unit || 'Tonne'}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(row.rate)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(row.item_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#f8fafc', fontWeight: 700, borderTop: '2px solid var(--border)' }}>
                      <td colSpan="4" style={{ textTransform: 'uppercase' }}>TOTAL OF ALL BILLS / ITEMS</td>
                      <td>{totals.total_qty.toFixed(3)} Units</td>
                      <td style={{ textAlign: 'right' }}>-</td>
                      <td style={{ textAlign: 'right', color: 'var(--brand-blue)', fontSize: '1rem' }}>
                        {formatCurrency(totals.total_billed)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}

              {/* TYPE 1: CUSTOMER WISE SUMMARY */}
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
                            <CreditCard size={14} /> Settle Due
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
