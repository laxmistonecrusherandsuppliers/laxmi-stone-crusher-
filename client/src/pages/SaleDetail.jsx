import React, { useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useReactToPrint } from 'react-to-print';
import { getSale, addPayment } from '../api/sales';
import { getSettings } from '../api/settings';

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount || 0);
};

const SaleDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const autoPrint = searchParams.get('print') === 'true';
  const queryClient = useQueryClient();
  
  const printRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
  });

  const { data: sale, isLoading: saleLoading } = useQuery({
    queryKey: ['sale', id],
    queryFn: () => getSale(id),
  });

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });

  React.useEffect(() => {
    if (autoPrint && sale && settings) {
      handlePrint();
    }
  }, [autoPrint, sale, settings, handlePrint]);

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  const paymentMutation = useMutation({
    mutationFn: (data) => addPayment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['sale', id]);
      setPaymentAmount('');
      setPaymentNotes('');
    }
  });

  const handleAddPayment = () => {
    if (!paymentAmount || isNaN(paymentAmount) || Number(paymentAmount) <= 0) return;
    paymentMutation.mutate({
      amount_paid: parseFloat(paymentAmount),
      payment_mode: paymentMethod,
      notes: paymentNotes
    });
  };

  const handleDownloadPdf = async () => {
    try {
      const token = localStorage.getItem('lsc_token');
      const response = await fetch(`/api/sales/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("PDF generation failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      alert("Could not download PDF. " + err.message);
    }
  };

  if (saleLoading || settingsLoading) return <div className="loading-overlay"><div className="spinner"></div>Loading invoice...</div>;
  if (!sale) return <div className="empty-state">Sale not found.</div>;

  return (
    <div className="page-container">
      <div className="page-header no-print">
        <h1 className="page-title">Invoice #{sale.invoice_number}</h1>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handleDownloadPdf}>⬇️ Download PDF</button>
          <button className="btn btn-primary" onClick={handlePrint}>🖨️ Print Bill</button>
        </div>
      </div>

      <div style={{display: 'flex', gap: '24px', flexWrap: 'wrap'}} className="no-print mb-6">
        {sale.amount_due > 0 && (
          <div className="card" style={{flex: '1', minWidth: '300px'}}>
            <div className="card-header">Record Payment</div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Amount (Max: {formatCurrency(sale.amount_due)})</label>
                <input 
                  type="number" 
                  className="form-input" 
                  max={sale.amount_due}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                />
              </div>
              <div className="form-group"><label className="form-label">Payment method</label><select className="form-select" value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)}><option value="cash">Cash</option><option value="upi">UPI</option></select></div>
              <button 
                className="btn btn-success btn-full" 
                onClick={handleAddPayment}
                disabled={paymentMutation.isLoading || !paymentAmount}
              >
                {paymentMutation.isLoading ? 'Processing...' : 'Add Payment'}
              </button>
            </div>
          </div>
        )}

        <div className="card" style={{flex: '2', minWidth: '300px'}}>
          <div className="card-header">Payment History</div>
          <div className="card-body p-0">
            {sale.payment_logs && sale.payment_logs.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Mode</th>
                    <th>Amount</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.payment_logs.map((p, i) => (
                    <tr key={i}>
                      <td>{formatDate(p.payment_date || p.created_at)}</td>
                      <td>{p.payment_mode}</td>
                      <td className="amount text-success">{formatCurrency(p.amount_paid)}</td>
                      <td>{p.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state" style={{padding: '24px'}}>No separate payments recorded.</div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{display: 'flex', justifyContent: 'center', background: '#f3f4f6', padding: '24px'}}>
          <div className="bill-print-container" style={{background: 'white', padding: '24px', boxShadow: 'var(--shadow-sm)'}}>
            
            <div className="bill-print" ref={printRef}>
              <div className="bill-header">
                <div className="bill-title">{settings.business_name || 'Lakshmi Stone Crusher'}</div>
                {sale.gst_enabled && <div style={{fontWeight:'bold', margin:'4px 0'}}>TAX INVOICE</div>}
                <div className="bill-subtitle">{settings.business_address || 'Address Line 1'}</div>
                <div className="bill-subtitle">📞 {settings.business_mobile || '9999999999'}</div>
                {sale.gst_enabled && settings.gstin && <div className="bill-subtitle">GSTIN: {settings.gstin}</div>}
              </div>
              
              <div className="bill-divider" />
              
              <div style={{display:'flex', justifyContent:'space-between', fontSize:'10pt'}}>
                <div>
                  <div><strong>Invoice No:</strong> {sale.invoice_number}</div>
                  <div><strong>Date:</strong> {formatDate(sale.sale_date)}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div><strong>Bill To:</strong></div>
                  <div>{sale.customer_name}</div>
                  <div>{sale.customer_mobile}</div>
                </div>
              </div>
              
              <div className="bill-divider" />
              
              <table className="bill-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Material</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th style={{textAlign: 'right'}}>Rate (₹)</th>
                    <th style={{textAlign: 'right'}}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items && sale.items.map((item, i) => (
                    <tr key={i}>
                      <td>{i+1}</td>
                      <td>{item.custom_material_name || item.material_name}</td>
                      <td>{item.quantity}</td>
                      <td>{item.unit}</td>
                      <td style={{textAlign: 'right'}}>{Number(item.rate).toFixed(2)}</td>
                      <td style={{textAlign: 'right'}}>{Number(item.amount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="bill-divider" />
              
              <div className="bill-total-section" style={{marginLeft: 'auto', width: '60%'}}>
                {sale.gst_enabled && (
                  <>
                    <div className="bill-total-row"><span>Subtotal:</span><span>₹{Number(sale.subtotal).toFixed(2)}</span></div>
                    <div className="bill-total-row"><span>CGST @ {(sale.gst_percent/2).toFixed(1)}%:</span><span>₹{(sale.gst_amount/2).toFixed(2)}</span></div>
                    <div className="bill-total-row"><span>SGST @ {(sale.gst_percent/2).toFixed(1)}%:</span><span>₹{(sale.gst_amount/2).toFixed(2)}</span></div>
                  </>
                )}
                <div className="bill-total-row bill-grand-total"><span>Grand Total:</span><span>₹{Number(sale.grand_total).toFixed(2)}</span></div>
                <div className="bill-total-row" style={{color: sale.amount_due > 0 ? 'inherit' : 'green', marginTop: '4px'}}>
                  <span>Amount Paid:</span><span>₹{Number(sale.amount_paid).toFixed(2)}</span>
                </div>
                {sale.amount_due > 0 && (
                  <div className="bill-total-row" style={{color: 'red', fontWeight: 'bold'}}>
                    <span>Balance Due:</span><span>₹{Number(sale.amount_due).toFixed(2)}</span>
                  </div>
                )}
              </div>
              
              <div className="bill-footer">Thank you for your business! — {settings.business_name || 'Lakshmi Stone Crusher'}</div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default SaleDetail;
