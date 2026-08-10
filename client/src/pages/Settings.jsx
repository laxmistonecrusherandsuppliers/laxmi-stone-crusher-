import React, { useState } from 'react';
import './Settings.css';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('business');

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>System Settings</h1>
      </div>

      <div className="settings-container">
        <div className="settings-sidebar">
          <button 
            className={`settings-tab ${activeTab === 'business' ? 'active' : ''}`}
            onClick={() => setActiveTab('business')}
          >
            🏢 Business Information
          </button>
          <button 
            className={`settings-tab ${activeTab === 'gst' ? 'active' : ''}`}
            onClick={() => setActiveTab('gst')}
          >
            📑 GST & Taxation
          </button>
          <button 
            className={`settings-tab ${activeTab === 'materials' ? 'active' : ''}`}
            onClick={() => setActiveTab('materials')}
          >
            🪨 Materials & Rates
          </button>
          <button 
            className={`settings-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 User Management
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'business' && (
            <div className="settings-panel">
              <h2>Business Information</h2>
              <p className="settings-desc">Update your company details and contact information.</p>
              
              <form className="settings-form">
                <div className="form-group">
                  <label>Company Name</label>
                  <input type="text" defaultValue="Lakshmi Stone Crusher & Suppliers" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" defaultValue="contact@lscs.com" />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input type="tel" defaultValue="+91 9876543210" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Registered Address</label>
                  <textarea defaultValue="Plot No 45, Industrial Area Phase 1, New Delhi, 110020"></textarea>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'gst' && (
            <div className="settings-panel">
              <h2>GST & Taxation Settings</h2>
              <p className="settings-desc">Manage your GSTIN and default tax rates.</p>
              
              <form className="settings-form">
                <div className="form-group">
                  <label>GSTIN Number</label>
                  <input type="text" defaultValue="07AAAAA0000A1Z5" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Default CGST Rate (%)</label>
                    <input type="number" defaultValue="2.5" />
                  </div>
                  <div className="form-group">
                    <label>Default SGST Rate (%)</label>
                    <input type="number" defaultValue="2.5" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Invoice Prefix</label>
                  <input type="text" defaultValue="INV-2023-" />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-primary">Update Tax Settings</button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'materials' && (
            <div className="settings-panel">
              <div className="panel-header">
                <div>
                  <h2>Materials & Rates</h2>
                  <p className="settings-desc">Manage your material catalog and base pricing per ton.</p>
                </div>
                <button className="btn-primary">+ Add Material</button>
              </div>
              
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Material Name</th>
                      <th>Base Rate (per ton)</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>20mm Aggregate</td>
                      <td>₹1,250</td>
                      <td><span className="status-badge status-active">Active</span></td>
                      <td><button className="action-btn">Edit</button></td>
                    </tr>
                    <tr>
                      <td>40mm Aggregate</td>
                      <td>₹1,100</td>
                      <td><span className="status-badge status-active">Active</span></td>
                      <td><button className="action-btn">Edit</button></td>
                    </tr>
                    <tr>
                      <td>Stone Dust</td>
                      <td>₹900</td>
                      <td><span className="status-badge status-active">Active</span></td>
                      <td><button className="action-btn">Edit</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="settings-panel">
              <div className="panel-header">
                <div>
                  <h2>User Management</h2>
                  <p className="settings-desc">Manage staff access and roles.</p>
                </div>
                <button className="btn-primary">+ Add User</button>
              </div>
              
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Admin User</td>
                      <td>admin@lscs.com</td>
                      <td>Administrator</td>
                      <td><button className="action-btn">Edit</button></td>
                    </tr>
                    <tr>
                      <td>Manager User</td>
                      <td>manager@lscs.com</td>
                      <td>Manager</td>
                      <td><button className="action-btn">Edit</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
