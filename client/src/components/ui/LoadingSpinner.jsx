import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'md', center = true, text }) => {
  return (
    <div className={`spinner-container ${center ? 'spinner-center' : ''}`}>
      <div className={`spinner spinner-${size}`}></div>
      {text && <span className="spinner-text">{text}</span>}
    </div>
  );
};

export default LoadingSpinner;
