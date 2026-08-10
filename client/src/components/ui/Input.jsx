import React, { forwardRef } from 'react';
import './Input.css';

const Input = forwardRef(({
  label,
  error,
  helpText,
  id,
  className = '',
  leftIcon,
  rightIcon,
  ...props
}, ref) => {
  const inputId = id || Math.random().toString(36).substring(7);
  const isInvalid = !!error;
  
  return (
    <div className={`input-group ${className}`}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      
      <div className="input-wrapper">
        {leftIcon && <span className="input-icon-left">{leftIcon}</span>}
        
        <input
          ref={ref}
          id={inputId}
          className={`input-field ${isInvalid ? 'input-error' : ''} ${leftIcon ? 'has-left-icon' : ''} ${rightIcon ? 'has-right-icon' : ''}`}
          aria-invalid={isInvalid}
          aria-describedby={
            isInvalid ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined
          }
          {...props}
        />
        
        {rightIcon && <span className="input-icon-right">{rightIcon}</span>}
      </div>

      {isInvalid && (
        <p className="input-error-message" id={`${inputId}-error`}>
          {error}
        </p>
      )}
      
      {!isInvalid && helpText && (
        <p className="input-help-text" id={`${inputId}-help`}>
          {helpText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
