import React from 'react';
import Input from './Input';
import { Calendar } from 'lucide-react';

const DateRangePicker = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  label = 'Date Range',
  className = ''
}) => {
  return (
    <div className={`date-range-picker ${className}`} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
      <div style={{ flex: 1 }}>
        <Input
          type="date"
          label={label}
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          leftIcon={<Calendar size={16} />}
        />
      </div>
      <div style={{ flex: 1 }}>
        <Input
          type="date"
          label="To"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          min={startDate}
          leftIcon={<Calendar size={16} />}
        />
      </div>
    </div>
  );
};

export default DateRangePicker;
