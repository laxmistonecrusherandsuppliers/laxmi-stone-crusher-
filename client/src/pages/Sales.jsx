import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const Sales = () => {
  const [filter, setFilter] = useState('');
  
  const { data: sales = [], isLoading, isError } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      // Mock data for UI demonstration
      return [
        { id: '1001', date: new Date().toISOString(), customerName: 'Rahul Sharma', totalAmount: 11210, paymentMethod: 'bank', due: 6210 },
        { id: '1002', date: new Date().toISOString(), customerName: 'ABC Constructions', totalAmount: 45000, paymentMethod: 'credit', due: 45000 },
        { id: '1003', date: new Date().toISOString(), customerName: 'Cash Sale', totalAmount: 3500, paymentMethod: 'cash', due: 0 },
      ];
    }
  });

  const filteredSales = sales.filter(sale => 
    sale.customerName.toLowerCase().includes(filter.toLowerCase()) || 
    sale.id.includes(filter)
  );

  return (
    <div className="page-container sales-page">
      <div className="page-header">
        <h1>Sales Records</h1>
        <Link to="/sales/new" className="btn btn-primary">Create New Sale</Link>
      </div>

      <div className="filters-card card">
        <input 
          type="text" 
          placeholder="Search by Customer Name or Invoice ID..." 
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="search-input"
        />
      </div>

      {isLoading ? (
        <p>Loading sales data...</p>
      ) : isError ? (
        <p>Error loading sales.</p>
      ) : (
        <div className="table-responsive card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Date</th>
                <th>Customer Name</th>
                <th>Amount</th>
                <th>Payment Status</th>
                <th>Due</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center">No sales found</td>
                </tr>
              ) : (
                filteredSales.map(sale => (
                  <tr key={sale.id}>
                    <td>INV-{sale.id}</td>
                    <td>{new Date(sale.date).toLocaleDateString()}</td>
                    <td>{sale.customerName}</td>
                    <td>₹{sale.totalAmount.toFixed(2)}</td>
                    <td>
                      <span className={`badge badge-${sale.due === 0 ? 'success' : sale.due === sale.totalAmount ? 'danger' : 'warning'}`}>
                        {sale.due === 0 ? 'Paid' : sale.due === sale.totalAmount ? 'Unpaid' : 'Partial'}
                      </span>
                    </td>
                    <td>₹{sale.due.toFixed(2)}</td>
                    <td>
                      <Link to={`/sales/${sale.id}`} className="btn btn-sm btn-info">View / Print</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Sales;
