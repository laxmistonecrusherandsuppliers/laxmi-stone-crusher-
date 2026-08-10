import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './CustomerDetail.css';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('sales');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Mock data
  const customer = {
    name: 'Ramesh Builders',
    phone: '+91 9876543210',
    address: '123 Construction Hub, New Delhi',
    gstin: '07AAAAA0000A1Z5',
    balance: '₹45,000'
  };

  const salesHistory = [
    { id: 'INV-1024', date: '2023-10-15', materials: '20mm Aggregate (10 ton)', amount: '₹12,500', status: 'Paid' },
    { id: 'INV-1010', date: '2023-10-10', materials: 'Dust (15 ton)', amount: '₹15,000', status: 'Pending' },
    { id: 'INV-0985', date: '2023-09-25', materials: '40mm Aggregate (20 ton)', amount: '₹30,000', status: 'Pending' },
  ];

  const paymentLedger = [
    { id: 'PAY-501', date: '2023-10-16', type: 'Bank Transfer', amount: '₹12,500', ref: 'HDFC123456789' },
    { id: 'PAY-480', date: '2023-09-20', type: 'Cash', amount: '₹10,000', ref: 'Receipt #124' },
  ];

  return (
    <div className="customer-detail-page">
      <div className="page-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/customers')}>← Back</button>
          <h1>{customer.name}</h1>
        </div>
        <button className="btn-primary" onClick={() => setShowPaymentModal(true)}>
          + Record Payment
        </button>
      </div>

      <div className="customer-info-card">
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Contact</span>
            <span className="info-value">{customer.phone}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Address</span>
            <span className="info-value">{customer.address}</span>
          </div>
          <div className="info-item">
            <span className="info-label">GSTIN</span>
            <span className="info-value">{customer.gstin}</span>
          </div>
          <div className="info-item balance-item">
            <span className="info-label">Outstanding Balance</span>
            <span className="info-value balance-value">{customer.balance}</span>
          </div>
        </div>
      </div>

      <div className="tabs-container">
        <div className="tabs-header">
          <button 
            className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
            onClick={() => setActiveTab('sales')}
          >
            Sales History
          </button>
          <button 
            className={`tab-btn ${activeTab === 'ledger' ? 'active' : ''}`}
            onClick={() => setActiveTab('ledger')}
          >
            Payment Ledger
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'sales' && (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Date</th>
                    <th>Materials Details</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {salesHistory.map(sale => (
                    <tr key={sale.id}>
                      <td>{sale.id}</td>
                      <td>{sale.date}</td>
                      <td>{sale.materials}</td>
                      <td>{sale.amount}</td>
                      <td>
                        <span className={`status-badge status-${sale.status.toLowerCase()}`}>
                          {sale.status}
                        </span>
                      </td>
                      <td>
                        <button className="action-btn">View Invoice</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'ledger' && (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Payment ID</th>
                    <th>Date</th>
                    <th>Payment Mode</th>
                    <th>Amount Paid</th>
                    <th>Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentLedger.map(payment => (
                    <tr key={payment.id}>
                      <td>{payment.id}</td>
                      <td>{payment.date}</td>
                      <td>{payment.type}</td>
                      <td className="payment-amount">+{payment.amount}</td>
                      <td>{payment.ref}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Record Payment - {customer.name}</h2>
              <button className="close-btn" onClick={() => setShowPaymentModal(false)}>×</button>
            </div>
            <form className="modal-form">
              <div className="form-group">
                <label>Amount Received (₹)</label>
                <input type="number" placeholder="Enter amount" required />
              </div>
              <div className="form-group">
                <label>Payment Date</label>
                <input type="date" required />
              </div>
              <div className="form-group">
                <label>Payment Mode</label>
                <select className="filter-select" style={{width: '100%'}}>
                  <option>Cash</option>
                  <option>Bank Transfer (NEFT/RTGS)</option>
                  <option>UPI</option>
                  <option>Cheque</option>
                </select>
              </div>
              <div className="form-group">
                <label>Reference / Remarks</label>
                <input type="text" placeholder="Transaction ID, Cheque No, etc." />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDetail;
