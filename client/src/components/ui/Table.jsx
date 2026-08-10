import React from 'react';
import './Table.css';

const Table = ({ columns, data, keyField = 'id', isLoading = false, emptyMessage = 'No data available' }) => {
  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th key={col.key || index} className={`table-th ${col.className || ''}`} style={col.style}>
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="table-loading">
                Loading...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="table-empty">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr key={row[keyField] || rowIndex} className="table-row">
                {columns.map((col, colIndex) => (
                  <td key={col.key || colIndex} className={`table-td ${col.className || ''}`} style={col.style}>
                    {col.render ? col.render(row[col.key], row, rowIndex) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
