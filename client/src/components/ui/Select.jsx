import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import './Input.css'; // Reusing input styles

const Select = forwardRef(({
  label,
  error,
  helpText,
  id,
  className = '',
  options = [],
  placeholder = 'Select an option',
  ...props
}, ref) => {
  const selectId = id || Math.random().toString(36).substring(7);
  const isInvalid = !!error;
  
  return (
    <div className={`input-group ${className}`}>
      {label && (
        <label htmlFor={selectId} className="input-label">
          {label}
        </label>
      )}
      
      <div className="input-wrapper">
        <select
          ref={ref}
          id={selectId}
          className={`input-field ${isInvalid ? 'input-error' : ''} has-right-icon`}
          style={{ appearance: 'none' }}
          aria-invalid={isInvalid}
          aria-describedby={
            isInvalid ? `${selectId}-error` : helpText ? `${selectId}-help` : undefined
          }
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        <span className="input-icon-right" style={{ pointerEvents: 'none' }}>
          <ChevronDown size={16} />
        </span>
      </div>

      {isInvalid && (
        <p className="input-error-message" id={`${selectId}-error`}>
          {error}
        </p>
      )}
      
      {!isInvalid && helpText && (
        <p className="input-help-text" id={`${selectId}-help`}>
          {helpText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
