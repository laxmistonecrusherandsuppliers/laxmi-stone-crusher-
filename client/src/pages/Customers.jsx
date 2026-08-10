import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Customers.css';

const Customers = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  const mockCustomers = [
    { id: 1, name: 'Ramesh Builders', phone: '+91 9876543210', balance: '₹45,000', status: 'Active' },
    { id: 2, name: 'Shree Krishna Infra', phone: '+91 9876543211', balance: '₹1,20,500', status: 'Active' },
    { id: 3, name: 'Aditya Constructions', phone: '+91 9876543212', balance: '₹0', status: 'Inactive' },
    { id: 4, name: 'Balaji Materials', phone: '+91 9876543213', balance: '₹22,000', status: 'Active' },
  ];

  return (
    <div className="customers-page">
      <div className="page-header">
        <h1>Customers Directory</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Add New Customer
        </button>
      </div>

      <div className="page-actions">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search customers by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-actions">
          <select className="filter-select">
            <option>All Status</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
          <select className="filter-select">
            <option>Sort By: Name</option>
            <option>Sort By: Balance</option>
          </select>
        </div>
      </div>

      <div className="customers-list-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Phone Number</th>
              <th>Outstanding Balance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockCustomers.map(customer => (
              <tr key={customer.id}>
                <td>
                  <div className="customer-name-cell">
                    <div className="customer-avatar">{customer.name.charAt(0)}</div>
                    <span className="customer-name">{customer.name}</span>
                  </div>
                </td>
                <td>{customer.phone}</td>
                <td className="balance-col">{customer.balance}</td>
                <td>
                  <span className={`status-badge status-${customer.status.toLowerCase()}`}>
                    {customer.status}
                  </span>
                </td>
                <td>
                  <button className="action-btn" onClick={() => navigate(`/customers/${customer.id}`)}>
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New Customer</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form className="modal-form">
              <div className="form-group">
                <label>Customer Name / Company Name</label>
                <input type="text" placeholder="Enter name" required />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input type="tel" placeholder="Enter phone number" required />
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea placeholder="Enter full address"></textarea>
              </div>
              <div className="form-group">
                <label>GST Number (Optional)</label>
                <input type="text" placeholder="Enter GSTIN" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
