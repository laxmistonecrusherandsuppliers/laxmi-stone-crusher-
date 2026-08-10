import React, { useState } from 'react';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('daily');

  return (
    <div className="page-container reports-page">
      <h1>Reports & Analytics</h1>
      
      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'daily' ? 'active' : ''}`} onClick={() => setActiveTab('daily')}>Daily Summary</button>
        <button className={`tab-btn ${activeTab === 'customer' ? 'active' : ''}`} onClick={() => setActiveTab('customer')}>Customer-wise</button>
        <button className={`tab-btn ${activeTab === 'material' ? 'active' : ''}`} onClick={() => setActiveTab('material')}>Material-wise</button>
        <button className={`tab-btn ${activeTab === 'due' ? 'active' : ''}`} onClick={() => setActiveTab('due')}>Due Reports</button>
      </div>

      <div className="card report-content">
        {activeTab === 'daily' && (
          <div>
            <h2>Daily Summary Report</h2>
            <div className="report-controls">
              <input type="date" className="date-picker" />
              <button className="btn btn-primary">Generate</button>
            </div>
            {/* Mock Chart/Table area */}
            <div className="mock-report-area">
              <p>Total Sales Today: ₹45,000</p>
              <p>Total Cash Received: ₹15,000</p>
              <p>Total Due Generated: ₹30,000</p>
            </div>
          </div>
        )}

        {activeTab === 'customer' && (
          <div>
            <h2>Customer-wise Report</h2>
            <div className="report-controls">
              <select>
                <option>Select Customer</option>
                <option>ABC Constructions</option>
                <option>Rahul Sharma</option>
              </select>
              <button className="btn btn-primary">Generate</button>
            </div>
            <div className="mock-report-area">
              <p>Select a customer to view their complete ledger and history.</p>
            </div>
          </div>
        )}

        {activeTab === 'material' && (
          <div>
            <h2>Material-wise Dispatch Report</h2>
            <div className="report-controls">
              <input type="date" /> to <input type="date" />
              <button className="btn btn-primary">Generate</button>
            </div>
            <div className="mock-report-area">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Total Dispatched (Tons)</th>
                    <th>Revenue Generated</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>10mm</td>
                    <td>150</td>
                    <td>₹75,000</td>
                  </tr>
                  <tr>
                    <td>20mm</td>
                    <td>300</td>
                    <td>₹1,20,000</td>
                  </tr>
                  <tr>
                    <td>Dust</td>
                    <td>50</td>
                    <td>₹15,000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'due' && (
          <div>
            <h2>Outstanding Dues Report</h2>
            <button className="btn btn-primary">Send Payment Reminders</button>
            <div className="mock-report-area mt-3">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Total Due</th>
                    <th>Last Payment Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>ABC Constructions</td>
                    <td>₹1,45,000</td>
                    <td>12/08/2026</td>
                    <td><button className="btn btn-sm btn-info">View Ledger</button></td>
                  </tr>
                  <tr>
                    <td>Rahul Sharma</td>
                    <td>₹6,210</td>
                    <td>N/A</td>
                    <td><button className="btn btn-sm btn-info">View Ledger</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
