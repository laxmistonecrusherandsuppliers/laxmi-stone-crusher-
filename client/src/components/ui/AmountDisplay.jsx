import React from 'react';
import { formatCurrency } from '../../utils/format';

const AmountDisplay = ({ amount, className = '', showSymbol = true }) => {
  const formatted = showSymbol ? formatCurrency(amount) : Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  return (
    <span className={`font-numbers ${className}`} style={{ fontWeight: 600 }}>
      {formatted}
    </span>
  );
};

export default AmountDisplay;
