'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
import { formatCurrency, formatDate } from '@/lib/format';

export default function SaleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const saleId = params.id;
  const printRef = useRef(null);

  const [sale, setSale] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [recordingPayment, setRecordingPayment] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [saleRes, settingsRes] = await Promise.all([
          fetch(`/api/sales/${saleId}`).then(r => r.json()),
          fetch('/api/settings').then(r => r.json()),
        ]);
        if (saleRes.data) setSale(saleRes.data);
        if (settingsRes.data) setSettings(settingsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (saleId) loadData();
  }, [saleId]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: sale ? `Invoice-${sale.invoice_number}` : 'Invoice',
  });

  const handleDownloadPdf = () => {
    window.open(`/api/sales/${saleId}/pdf`, '_blank');
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const payAmt = parseFloat(paymentAmount);
    if (!payAmt || payAmt <= 0) return alert('Enter valid payment amount.');
    if (payAmt > parseFloat(sale.amount_due)) return alert('Payment exceeds amount due.');

    setRecordingPayment(true);
    try {
      // Record payment via backend query
      const res = await fetch(`/api/sales/${saleId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount_paid: payAmt, notes: paymentNotes }),
      }).then(r => r.json());

      // Reload sale data
      const updated = await fetch(`/api/sales/${saleId}`).then(r => r.json());
      if (updated.data) setSale(updated.data);
      setPaymentAmount('');
      setPaymentNotes('');
    } catch (err) {
      alert(err.message);
    } finally {
      setRecordingPayment(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading sale details...</div>;
  if (!sale) return <div style={{ padding: '40px', textAlign: 'center' }}>Sale not found.</div>;

  return (
    <div>
      <div className="page-header no-print">
        <div>
          <h1 className="page-title">Invoice #{sale.invoice_number}</h1>
          <span className={`badge badge-${sale.payment_mode}`}>{sale.payment_mode?.toUpperCase()}</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={handlePrint}>
            🖨️ Print Invoice
          </button>
          <button className="btn btn-primary" onClick={handleDownloadPdf}>
            📄 Download PDF
          </button>
        </div>
      </div>

      {/* Screen View + Printable Invoice Box */}
      <div className="card" style={{ padding: '36px', maxWidth: '800px', margin: '0 auto' }}>
        <div className="bill-print" ref={printRef}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{settings.business_name || 'Lakshmi Stone Crusher & Suppliers'}</h2>
            {sale.gst_enabled && <div style={{ fontWeight: 800, color: 'var(--primary)', margin: '4px 0' }}>TAX INVOICE</div>}
            <div style={{ fontSize: '0.9rem', color: '#4b5563' }}>{settings.business_address}</div>
            <div style={{ fontSize: '0.9rem', color: '#4b5563' }}>Ph: {settings.business_mobile}</div>
            {sale.gst_enabled && settings.gstin && <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>GSTIN: {settings.gstin}</div>}
          </div>

          <hr style={{ margin: '16px 0', borderColor: '#ccc' }} />

          {/* Details */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '0.95rem' }}>
            <div>
              <div><strong>Invoice No:</strong> {sale.invoice_number}</div>
              <div><strong>Date:</strong> {formatDate(sale.sale_date)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div><strong>Customer:</strong> {sale.customer_name}</div>
              <div>{sale.customer_mobile}</div>
              <div>{sale.customer_address}</div>
            </div>
          </div>

          {/* Items Table */}
          <table className="table" style={{ marginBottom: '20px' }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Material</th>
                <th>Qty</th>
                <th>Unit</th>
                <th style={{ textAlign: 'right' }}>Rate (₹)</th>
                <th style={{ textAlign: 'right' }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{item.custom_material_name || item.material_name}</td>
                  <td>{item.quantity}</td>
                  <td>{item.unit}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(item.rate)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ maxWidth: '320px', marginLeft: 'auto', textAlign: 'right', fontSize: '0.95rem' }}>
            {sale.gst_enabled && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Subtotal (Taxable):</span> <strong>{formatCurrency(sale.subtotal)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>CGST @ {(parseFloat(sale.gst_percent)/2).toFixed(1)}%:</span> <strong>{formatCurrency(sale.gst_amount/2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>SGST @ {(parseFloat(sale.gst_percent)/2).toFixed(1)}%:</span> <strong>{formatCurrency(sale.gst_amount/2)}</strong>
                </div>
              </>
            )}
            <hr style={{ margin: '8px 0', borderColor: '#000' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800 }}>
              <span>Grand Total:</span> <span>{formatCurrency(sale.grand_total)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)', marginTop: '4px' }}>
              <span>Amount Paid:</span> <span>{formatCurrency(sale.amount_paid)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: parseFloat(sale.amount_due) > 0 ? 'var(--danger)' : 'inherit', marginTop: '4px', fontWeight: parseFloat(sale.amount_due) > 0 ? 700 : 400 }}>
              <span>Balance Due:</span> <span>{formatCurrency(sale.amount_due)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
